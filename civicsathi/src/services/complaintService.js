import { IMAGE_BUCKET, SUPABASE_ANON_KEY, SUPABASE_URL, supabase } from './supabase';

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const randomId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------
export async function getPublicStats() {
  return unwrap(await supabase.rpc('get_public_stats'));
}

// ---------------------------------------------------------------------------
// Image upload (XMLHttpRequest so we can report REAL upload progress)
// ---------------------------------------------------------------------------
export async function uploadComplaintImage(file, userId, onProgress) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    const err = new Error('Session expired');
    err.code = 'SESSION_EXPIRED';
    throw err;
  }
  const token = data.session.access_token;
  const path = `${userId}/${randomId()}.${EXT[file.type]}`;

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${IMAGE_BUCKET}/${path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100);
        resolve();
        return;
      }
      let message = 'Upload failed';
      try {
        const body = JSON.parse(xhr.responseText);
        message = body.message || body.error || message;
      } catch {
        /* keep default message */
      }
      reject(new Error(message));
    };
    xhr.onerror = () => reject(new Error('Failed to fetch'));
    xhr.ontimeout = () => reject(new Error('Failed to fetch'));
    xhr.timeout = 120000;
    xhr.send(file);
  });

  return path;
}

export async function getImageUrl(path) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

// ---------------------------------------------------------------------------
// Citizen
// ---------------------------------------------------------------------------
export async function createComplaint({ values, file, userId, onProgress, onStage }) {
  // Fail fast with a clear message if the session has expired, instead of letting the
  // insert surface as a generic "permission denied" (RLS) error for the user.
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    const err = new Error('Session expired');
    err.code = 'SESSION_EXPIRED';
    throw err;
  }

  let imagePath = null;
  if (file) {
    if (onStage) onStage('uploading');
    imagePath = await uploadComplaintImage(file, userId, onProgress);
  }

  if (onStage) onStage('saving');
  const { data, error } = await supabase
    .from('complaints')
    .insert({
      user_id: userId,
      title: values.title.trim(),
      description: values.description.trim(),
      category: values.category,
      image_url: imagePath,
      state: values.state,
      city: values.city.trim(),
      locality: values.locality.trim(),
      latitude: values.latitude ?? null,
      longitude: values.longitude ?? null,
    })
    .select('id, complaint_number')
    .single();

  if (error) {
    // do not leave an orphaned photo behind
    if (imagePath) {
      try {
        await supabase.storage.from(IMAGE_BUCKET).remove([imagePath]);
      } catch {
        /* best effort */
      }
    }
    throw error;
  }
  return data;
}

export async function listMyComplaints(userId) {
  return unwrap(
    await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500)
  );
}

export async function getRecentActivity(limit = 6) {
  return unwrap(
    await supabase
      .from('complaint_history')
      .select('id, old_status, new_status, remarks, created_at, complaint_id, complaints(complaint_number, title)')
      .order('created_at', { ascending: false })
      .limit(limit)
  );
}

// Row Level Security guarantees a citizen only ever gets their own complaint back
// (admins can read any). A complaint that exists but belongs to someone else looks
// exactly like "not found".
export async function getComplaintByNumber(number) {
  const value = String(number || '').trim().toUpperCase();
  if (!value) return null;
  return unwrap(
    await supabase
      .from('complaints')
      .select('*, profiles(full_name, email)')
      .eq('complaint_number', value)
      .maybeSingle()
  );
}

export async function getComplaintById(id) {
  if (!UUID_RE.test(String(id || ''))) return null;
  return unwrap(
    await supabase
      .from('complaints')
      .select('*, profiles(full_name, email)')
      .eq('id', id)
      .maybeSingle()
  );
}

export async function getComplaintHistory(complaintId) {
  return unwrap(
    await supabase
      .from('complaint_history')
      .select('*')
      .eq('complaint_id', complaintId)
      .order('created_at', { ascending: true })
  );
}

// ---------------------------------------------------------------------------
// Admin (every call is re-checked by the database: RLS / is_admin())
// ---------------------------------------------------------------------------
export async function adminListComplaints({ search = '', status = '', category = '', page = 1, pageSize = 10 }) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('complaints')
    .select('id, complaint_number, title, category, status, state, city, locality, created_at, profiles(full_name, email)', {
      count: 'exact',
    })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('status', status);
  if (category) query = query.eq('category', category);

  // strip characters that have a meaning inside a PostgREST filter expression
  const s = search.trim().replace(/[,()%*\\]/g, ' ').trim();
  if (s) query = query.or(`complaint_number.ilike.%${s}%,title.ilike.%${s}%`);

  const { data, error, count } = await query;
  if (error) throw error;
  return { rows: data ?? [], total: count ?? 0 };
}

export async function adminUpdateStatus(complaintId, newStatus, remarks) {
  return unwrap(
    await supabase.rpc('admin_update_complaint_status', {
      p_complaint_id: complaintId,
      p_new_status: newStatus,
      p_remarks: remarks || null,
    })
  );
}

export async function getAdminStats() {
  return unwrap(await supabase.rpc('admin_dashboard_stats'));
}
