import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, MessageCircle, Send, Trash2, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import './chatbot.css';

// ---------------------------------------------------------------------------
// CivicSathi AI Assistant
// A floating, bilingual (English/Hindi) chatbot.
//
// Default behaviour: a built-in FAQ assistant that ALWAYS works locally — no API
// key required. If VITE_CHATBOT_AI_URL is configured (pointing at a secure
// serverless/edge function such as /api/chat), the widget prefers the AI reply and
// falls back to the FAQ engine when the AI is unreachable.
// ---------------------------------------------------------------------------

const AI_URL = import.meta.env.VITE_CHATBOT_AI_URL;

const QUICK_QUESTIONS = {
  en: [
    'How do I report a complaint?',
    'How can I track my complaint?',
    'How do I report a streetlight problem?',
    'How do I report garbage collection issues?',
    'How do I report a water supply problem?',
  ],
  hi: [
    'शिकायत कैसे दर्ज करूँ?',
    'अपनी शिकायत कैसे ट्रैक करूँ?',
    'स्ट्रीटलाइट की समस्या कैसे दर्ज करूँ?',
    'कचरा सफाई की समस्या कैसे दर्ज करूँ?',
    'पानी की आपूर्ति की समस्या कैसे दर्ज करूँ?',
  ],
};

const WELCOME = {
  en: 'Hi! I\u2019m the CivicSathi AI Assistant \uD83D\uDC4B\nI can help you report civic issues, track complaints and use this website. Ask me a question or tap one of the quick questions below.',
  hi: 'नमस्ते! मैं CivicSathi AI सहायक हूँ \uD83D\uDC4B\nमैं नागरिक समस्याओं की शिकायत दर्ज करने, उन्हें ट्रैक करने और इस वेबसाइट का उपयोग करने में आपकी मदद कर सकता/सकती हूँ। नीचे दिए गए प्रश्नों में से कोई प्रश्न पूछें या चुनें।',
};

const REPLIES = {
  report: {
    en: {
      text: "Here's how to submit a complaint:\n\n1. Open the Report Issue page.\n2. Pick a category (roads, garbage, streetlights, water, drainage, and more).\n3. Describe the problem clearly (20\u20131000 characters).\n4. Add a photo if you have one.\n5. Fill your state, city and locality, then submit.\n\nYou'll get a complaint number (like CS-2026-000042) to track progress.",
      links: [{ label: 'Open Report Issue', to: '/report' }],
    },
    hi: {
      text: 'शिकायत दर्ज करने का तरीका:\n\n1. रिपोर्ट इश्यू पेज खोलें।\n2. श्रेणी चुनें (सड़क, कचरा, स्ट्रीटलाइट, पानी, नाली आदि)।\n3. समस्या साफ़-साफ़ लिखें (20\u20131000 अक्षर)।\n4. हो सके तो फोटो जोड़ें।\n5. राज्य, शहर और क्षेत्र भरकर सबमिट करें।\n\nसबमिट करने पर आपको शिकायत नंबर (जैसे CS-2026-000042) मिलेगा।',
      links: [{ label: 'रिपोर्ट इश्यू खोलें', to: '/report' }],
    },
  },
  track: {
    en: {
      text: "You can check your complaint's status in two ways:\n\n\u2022 Track Complaint page \u2014 enter your complaint number.\n\u2022 Dashboard \u2014 see all your complaints and their latest status.\n\nUse the Track page below if you have the complaint number.",
      links: [
        { label: 'Track Complaint', to: '/track' },
        { label: 'My Dashboard', to: '/dashboard' },
      ],
    },
    hi: {
      text: 'आप अपनी शिकायत की स्थिति दो तरीकों से देख सकते हैं:\n\n\u2022 ट्रैक शिकायत पेज \u2014 अपना शिकायत नंबर डालें।\n\u2022 डैशबोर्ड \u2014 अपनी सभी शिकायतें और उनकी ताज़ा स्थिति देखें।\n\nयदि आपके पास शिकायत नंबर है तो नीचे ट्रैक पेज खोलें।',
      links: [
        { label: 'शिकायत ट्रैक करें', to: '/track' },
        { label: 'मेरा डैशबोर्ड', to: '/dashboard' },
      ],
    },
  },
  streetlight: {
    en: {
      text: 'To report a streetlight issue:\n\n1. Open Report Issue.\n2. Choose the Streetlights category.\n3. Mention the exact location and how many lights are affected.\n4. Add a photo if possible, then submit.\n\nThe concerned team will review it after submission.',
      links: [{ label: 'Report Streetlight Issue', to: '/report?category=streetlights' }],
    },
    hi: {
      text: 'स्ट्रीटलाइट की समस्या दर्ज करने के लिए:\n\n1. रिपोर्ट इश्यू खोलें।\n2. स्ट्रीटलाइट श्रेणी चुनें।\n3. सही स्थान और कितनी लाइटें खराब हैं, लिखें।\n4. हो सके तो फोटो जोड़ें और सबमिट करें।\n\nसबमिट करने के बाद संबंधित टीम इसकी समीक्षा करेगी।',
      links: [{ label: 'स्ट्रीटलाइट शिकायत दर्ज करें', to: '/report?category=streetlights' }],
    },
  },
  garbage: {
    en: {
      text: 'To report a garbage collection issue:\n\n1. Open Report Issue.\n2. Choose the Garbage category.\n3. Describe the location and how long the problem has been there.\n4. Add a photo if possible, then submit.',
      links: [{ label: 'Report Garbage Issue', to: '/report?category=garbage' }],
    },
    hi: {
      text: 'कचरा सफाई की समस्या दर्ज करने के लिए:\n\n1. रिपोर्ट इश्यू खोलें।\n2. कचरा श्रेणी चुनें।\n3. स्थान और समस्या कब से है, लिखें।\n4. हो सके तो फोटो जोड़ें और सबमिट करें।',
      links: [{ label: 'कचरा शिकायत दर्ज करें', to: '/report?category=garbage' }],
    },
  },
  water: {
    en: {
      text: 'To report a water supply problem (leakage or no supply):\n\n1. Open Report Issue.\n2. Choose the Water Leakage category.\n3. Describe whether it is a leak or a supply problem, and the exact location.\n4. Add a photo if possible, then submit.',
      links: [{ label: 'Report Water Issue', to: '/report?category=water_leakage' }],
    },
    hi: {
      text: 'पानी की आपूर्ति की समस्या (रिसाव या आपूर्ति न होना) दर्ज करने के लिए:\n\n1. रिपोर्ट इश्यू खोलें।\n2. पानी का रिसाव श्रेणी चुनें।\n3. रिसाव है या आपूर्ति की समस्या है, और सही स्थान लिखें।\n4. हो सके तो फोटो जोड़ें और सबमिट करें।',
      links: [{ label: 'पानी की शिकायत दर्ज करें', to: '/report?category=water_leakage' }],
    },
  },
  road: {
    en: {
      text: 'To report road damage or a pothole:\n\n1. Open Report Issue.\n2. Choose the Roads and Potholes category.\n3. Describe the exact spot and the size of the damage.\n4. Add a photo if possible, then submit.',
      links: [{ label: 'Report Road Issue', to: '/report?category=roads' }],
    },
    hi: {
      text: 'सड़क क्षति या गड्ढे की शिकायत दर्ज करने के लिए:\n\n1. रिपोर्ट इश्यू खोलें।\n2. सड़क और गड्ढे श्रेणी चुनें।\n3. सही स्थान और क्षति का आकार लिखें।\n4. हो सके तो फोटो जोड़ें और सबमिट करें।',
      links: [{ label: 'सड़क की शिकायत दर्ज करें', to: '/report?category=roads' }],
    },
  },
  drainage: {
    en: {
      text: 'To report a drainage problem:\n\n1. Open Report Issue.\n2. Choose the Drainage category.\n3. Describe the blockage or overflow and the exact location.\n4. Add a photo if possible, then submit.',
      links: [{ label: 'Report Drainage Issue', to: '/report?category=drainage' }],
    },
    hi: {
      text: 'नाली की समस्या दर्ज करने के लिए:\n\n1. रिपोर्ट इश्यू खोलें।\n2. नाली श्रेणी चुनें।\n3. रुकावट या ओवरफ्लो और सही स्थान लिखें।\n4. हो सके तो फोटो जोड़ें और सबमिट करें।',
      links: [{ label: 'नाली की शिकायत दर्ज करें', to: '/report?category=drainage' }],
    },
  },
  categories: {
    en: {
      text: 'CivicSathi supports these complaint categories:\n\n\u2022 Roads and potholes\n\u2022 Garbage collection\n\u2022 Streetlights\n\u2022 Water leakage\n\u2022 Drainage\n\u2022 Public property\n\u2022 Other\n\nChoose the closest one when you report.',
      links: [{ label: 'Report an Issue', to: '/report' }],
    },
    hi: {
      text: 'CivicSathi में ये शिकायत श्रेणियाँ हैं:\n\n\u2022 सड़क और गड्ढे\n\u2022 कचरा सफाई\n\u2022 स्ट्रीटलाइट\n\u2022 पानी का रिसाव\n\u2022 नाली\n\u2022 सार्वजनिक संपत्ति\n\u2022 अन्य\n\nशिकायत दर्ज करते समय सबसे मिलती-जुलती श्रेणी चुनें।',
      links: [{ label: 'शिकायत दर्ज करें', to: '/report' }],
    },
  },
  status: {
    en: {
      text: 'CivicSathi complaint statuses:\n\n\u2022 Pending \u2014 submitted, waiting for review\n\u2022 In Progress \u2014 the team is working on it\n\u2022 Resolved \u2014 marked as fixed\n\u2022 Rejected \u2014 not accepted (a reason is shown)\n\nTrack your complaint to see its current status.',
      links: [{ label: 'Track Complaint', to: '/track' }],
    },
    hi: {
      text: 'CivicSathi शिकायत की स्थितियाँ:\n\n\u2022 लंबित \u2014 जमा हुई, समीक्षा की प्रतीक्षा में\n\u2022 प्रगति में \u2014 टीम इस पर काम कर रही है\n\u2022 हल हुई \u2014 ठीक कर दी गई\n\u2022 अस्वीकृत \u2014 स्वीकार नहीं हुई (कारण दिखाया जाता है)\n\nवर्तमान स्थिति देखने के लिए अपनी शिकायत ट्रैक करें।',
      links: [{ label: 'शिकायत ट्रैक करें', to: '/track' }],
    },
  },
  navigation: {
    en: {
      text: 'Main pages on CivicSathi:\n\n\u2022 Home \u2014 overview\n\u2022 Report Issue \u2014 submit a complaint\n\u2022 Track Complaint \u2014 check status\n\u2022 Dashboard \u2014 your complaints and updates\n\u2022 Notifications \u2014 alerts about your complaints\n\u2022 My Profile \u2014 update your details',
      links: [
        { label: 'Report Issue', to: '/report' },
        { label: 'Track Complaint', to: '/track' },
      ],
    },
    hi: {
      text: 'CivicSathi के मुख्य पेज:\n\n\u2022 होम \u2014 अवलोकन\n\u2022 रिपोर्ट इश्यू \u2014 शिकायत दर्ज करें\n\u2022 ट्रैक शिकायत \u2014 स्थिति देखें\n\u2022 डैशबोर्ड \u2014 आपकी शिकायतें और अपडेट\n\u2022 सूचनाएं \u2014 शिकायतों से जुड़ी जानकारी\n\u2022 मेरी प्रोफ़ाइल \u2014 अपनी जानकारी अपडेट करें',
      links: [
        { label: 'रिपोर्ट इश्यू', to: '/report' },
        { label: 'ट्रैक शिकायत', to: '/track' },
      ],
    },
  },
  fallback: {
    en: {
      text: "I'm not sure about that yet. I can help with:\n\n\u2022 Reporting a complaint\n\u2022 Tracking a complaint\n\u2022 Streetlight, garbage, water, road and drainage issues\n\u2022 Using the CivicSathi website\n\nTry one of the quick questions below.",
      links: [],
    },
    hi: {
      text: 'मुझे इस बारे में अभी पक्का पता नहीं है। मैं इनमें मदद कर सकता/सकती हूँ:\n\n\u2022 शिकायत दर्ज करना\n\u2022 शिकायत ट्रैक करना\n\u2022 स्ट्रीटलाइट, कचरा, पानी, सड़क और नाली की समस्याएँ\n\u2022 CivicSathi वेबसाइट का उपयोग\n\nनीचे दिए गए त्वरित प्रश्नों में से कोई प्रयास करें।',
      links: [],
    },
  },
};

function detectLanguage(text) {
  return /[\u0900-\u097F]/.test(text) ? 'hi' : 'en';
}

function buildLocalReply(raw) {
  const message = String(raw || '').trim();
  const lang = detectLanguage(message);
  const m = message.toLowerCase();

  const has = (words) => words.some((w) => m.includes(w));

  let key = null;
  if (lang === 'hi') {
    if (has(['स्ट्रीटलाइट', 'स्ट्रीट लाइट', 'लाइट', 'बत्ती', 'रोशनी'])) key = 'streetlight';
    else if (has(['कचरा', 'सफाई', 'गार्बेज'])) key = 'garbage';
    else if (has(['पानी', 'रिसाव', 'जल', 'आपूर्ति'])) key = 'water';
    else if (has(['सड़क', 'गड्ढा', 'गड्ढे', 'रोड'])) key = 'road';
    else if (has(['नाली', 'ड्रेनेज', 'जलभराव'])) key = 'drainage';
    else if (has(['ट्रैक', 'स्थिति', 'स्टेटस', 'देखूं', 'देखना'])) key = 'track';
    else if (has(['शिकायत', 'दर्ज', 'रिपोर्ट', 'शिकायतें'])) key = 'report';
    else if (has(['श्रेणी', 'श्रेणियाँ', 'कैटेगरी'])) key = 'categories';
    else if (has(['पेज', 'नेविगेट', 'वेबसाइट', 'साइट', 'उपयोग'])) key = 'navigation';
    else key = 'fallback';
  } else {
    if (has(['streetlight', 'street light', 'light', 'lamp'])) key = 'streetlight';
    else if (has(['garbage', 'waste', 'trash', 'cleanliness'])) key = 'garbage';
    else if (has(['water', 'leak', 'supply'])) key = 'water';
    else if (has(['road', 'pothole', 'potholes'])) key = 'road';
    else if (has(['drain', 'drainage', 'sewer', 'overflow'])) key = 'drainage';
    else if (has(['track', 'status', 'check', 'progress'])) key = 'track';
    else if (has(['report', 'complaint', 'submit', 'register', 'file'])) key = 'report';
    else if (has(['categor', 'types', 'kinds'])) key = 'categories';
    else if (has(['page', 'navigat', 'website', 'site', 'use', 'menu'])) key = 'navigation';
    else key = 'fallback';
  }

  return REPLIES[key][lang];
}

async function getReply(raw, history) {
  if (AI_URL) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(AI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history
            .filter((m) => m.role !== 'typing')
            .slice(-10)
            .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text })),
          lang: detectLanguage(raw),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.reply) return { text: data.reply, links: data.links || [] };
      }
      // Fall through to the local FAQ engine on any failure.
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[chatbot] AI call failed, using FAQ fallback:', err);
      }
    }
  }
  return buildLocalReply(raw);
}

export default function Chatbot() {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const idRef = useRef(0);
  const listRef = useRef(null);

  const nextId = () => `m${Date.now()}-${idRef.current++}`;

  // Welcome message on first mount.
  useEffect(() => {
    setMessages([{ id: nextId(), role: 'assistant', text: WELCOME[lang], links: [] }]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  async function send(text) {
    const clean = String(text ?? '').trim();
    if (!clean || typing) return;

    setInput('');
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', text: clean }]);
    setTyping(true);

    try {
      const reply = await getReply(clean, messages);
      setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', text: reply.text, links: reply.links || [] }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', text: buildLocalReply(clean).text, links: buildLocalReply(clean).links || [] },
      ]);
    } finally {
      setTyping(false);
    }
  }

  function clearChat() {
    setMessages([{ id: nextId(), role: 'assistant', text: WELCOME[lang], links: [] }]);
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const showQuickQuestions = messages.filter((m) => m.role === 'user').length === 0;

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close CivicSathi AI Assistant' : 'Open CivicSathi AI Assistant'}
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-lift transition hover:bg-teal-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-teal-600/40"
      >
        {open ? <X className="h-6 w-6" aria-hidden="true" /> : <MessageCircle className="h-6 w-6" aria-hidden="true" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="chatbot-panel fixed bottom-24 right-5 z-50 flex max-h-[70vh] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lift">
          {/* Header */}
          <div className="flex items-center gap-3 bg-navy-800 px-4 py-3 text-white">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-200">
              <Bot className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">CivicSathi AI Assistant</p>
              <p className="text-xs text-navy-200">
                {AI_URL ? 'Online \u00B7 AI assistant' : 'Online \u00B7 FAQ assistant'}
              </p>
            </div>
            <button
              type="button"
              onClick={clearChat}
              aria-label="Clear chat"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-navy-100 hover:bg-white/10"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-navy-100 hover:bg-white/10"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Messages */}
          <div ref={listRef} role="log" aria-live="polite" className="chatbot-scroll flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-br-sm bg-teal-600 text-white'
                      : 'rounded-bl-sm border border-slate-200 bg-white text-navy-900'
                  }`}
                >
                  {msg.text}
                  {msg.links?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.links.map((link) => (
                        <Link
                          key={link.to}
                          to={link.to}
                          className="inline-flex items-center rounded-lg bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-100"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3">
                  <span className="chatbot-dot h-2 w-2 rounded-full bg-slate-400" />
                  <span className="chatbot-dot h-2 w-2 rounded-full bg-slate-400" />
                  <span className="chatbot-dot h-2 w-2 rounded-full bg-slate-400" />
                </div>
              </div>
            )}
          </div>

          {/* Quick questions */}
          {showQuickQuestions && (
            <div className="flex gap-2 overflow-x-auto border-t border-slate-200 bg-white px-3 py-2 chatbot-scroll">
              {QUICK_QUESTIONS[lang].map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => send(q)}
                  className="shrink-0 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-700 transition hover:bg-teal-100"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2 border-t border-slate-200 bg-white p-3"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              maxLength={1000}
              placeholder={lang === 'hi' ? 'अपना प्रश्न लिखें…' : 'Type your question…'}
              aria-label="Message"
              className="max-h-24 min-h-[44px] flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/30"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              aria-label="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
