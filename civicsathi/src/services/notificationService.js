import { supabase } from './supabase';

const COLUMNS = 'id, complaint_id, type, title, message, is_read, created_at, complaints(complaint_number)';

export async function listNotifications(limit = 30) {
  const { data, error } = await supabase
    .from('notifications')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function countUnread() {
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false);
  if (error) throw error;
  return count ?? 0;
}

export async function markRead(id) {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllRead(userId) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw error;
}

// Calls onChange whenever one of the user's notifications is inserted or updated.
export function subscribeToNotifications(userId, onChange) {
  const channel = supabase
    .channel(`notifications:${userId}:${Math.random().toString(36).slice(2, 8)}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      () => onChange()
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// Picks the translated title/message for a notification, falling back to the stored text.
export function notificationText(n, t) {
  const known = ['submitted', 'pending', 'in_progress', 'resolved', 'rejected'];
  const number = n.complaints?.complaint_number;
  if (known.includes(n.type) && number) {
    return {
      title: t(`notif.type.${n.type}.title`),
      message: t(`notif.type.${n.type}.msg`, { number }),
    };
  }
  return { title: n.title, message: n.message };
}
