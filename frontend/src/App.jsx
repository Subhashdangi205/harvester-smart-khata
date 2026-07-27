import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Sprout, LayoutDashboard, UserPlus, ClipboardList, Search, IndianRupee,
  TrendingUp, TrendingDown, Wallet, Receipt, Phone, MapPin, User, Users,
  Plus, Loader2, AlertCircle, CheckCircle2, ChevronDown, ChevronRight,
  Wheat, Fuel, Wrench, X, CalendarDays, Landmark, History, MessageSquare, Download, FileSpreadsheet, Languages,
  LogOut, Lock, UserCircle, Eye, EyeOff, Building2
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

/* ------------------------------------------------------------------ */
/*  Crops List for Dropdown                                            */
/* ------------------------------------------------------------------ */
const CROPS_LIST = [
  'गेहू',
  'सोयाबीन',
  'मक्का',
  'रायडा',
  'चावल',
  'मुंग',
  'जवार'
];

/* ------------------------------------------------------------------ */
/*  Design tokens — modern SaaS / fintech theme                       */
/* ------------------------------------------------------------------ */
const C = {
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderSoft: '#EDF2F7',
  ink: '#0F172A',
  inkSoft: '#64748B',
  inkFaint: '#94A3B8',
  sidebar: '#FFFFFF',
  emerald: '#059669',
  emeraldDark: '#047857',
  emeraldSoft: '#ECFDF5',
  emeraldRing: '#10B981',
  indigo: '#4F46E5',
  indigoSoft: '#EEF2FF',
  amber: '#D97706',
  amberSoft: '#FFFBEB',
  rose: '#E11D48',
  roseSoft: '#FFF1F2',
};

const fontHead = { fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" };
const fontMono = { fontFamily: "'IBM Plex Mono', monospace", fontVariantNumeric: 'tabular-nums' };
const fontBody = { fontFamily: "'Inter', sans-serif" };

const fmtINR = (n) => {
  const num = Number(n) || 0;
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 0 });
};

const todayISO = () => new Date().toISOString().slice(0, 10);

/* ------------------------------------------------------------------ */
/*  AUTH TOKEN STORAGE                                                 */
/* ------------------------------------------------------------------ */
const TOKEN_KEY = 'harvester_token';
const USER_KEY = 'harvester_user';

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
function loadSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);
  if (!token || !userRaw) return null;
  try {
    return { token, user: JSON.parse(userRaw) };
  } catch (_) {
    return null;
  }
}
function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/* ------------------------------------------------------------------ */
/*  API helpers (ab token ke saath)                                    */
/* ------------------------------------------------------------------ */
async function apiGet(path, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401) throw new Error('__UNAUTHORIZED__');
  if (!res.ok) throw new Error(`Server said no (${res.status})`);
  return res.json();
}
async function apiPost(path, body, token) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (res.status === 401) throw new Error('__UNAUTHORIZED__');
  if (!res.ok) {
    let msg = `Server said no (${res.status})`;
    try {
      const j = await res.json();
      if (j?.detail) msg = typeof j.detail === 'string' ? j.detail : msg;
    } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
}

// 📲 Bilingual WhatsApp Receipt Generator Helper (Hindi / English) + Due Date Reminder
function sendWhatsAppReceipt(phone, name, amount, remainingDue, mode, lang = 'hi', dueDate = null) {
  const cleanPhone = phone ? phone.replace(/\D/g, '') : '';

  const daysLeft = dueDate
    ? Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  let message = '';

  if (lang === 'en') {
    message += `🌾 *Harvester Smart Khata* 🌾\n`;
    message += `_______________________________\n\n`;
    message += `🙏 Dear *${name}*,\n\n`;

    if (amount > 0) {
      message += `✅ Your payment has been received successfully.\n\n`;
      message += `💰 Amount Paid: *₹${amount.toLocaleString('en-IN')}*\n`;
      message += `💳 Payment Mode: *${mode}*\n`;
    } else {
      message += `📋 Here is your complete account summary:\n\n`;
    }

    message += `_______________________________\n`;
    message += `📌 *Total Outstanding Due:* ₹${remainingDue.toLocaleString('en-IN')}\n`;

    if (remainingDue > 0 && daysLeft !== null) {
      if (daysLeft >= 0) {
        message += `⏰ Please clear the due within *${daysLeft} day(s)*.\n`;
      } else {
        message += `⚠️ Your due date has passed by *${Math.abs(daysLeft)} day(s)*. Please pay soon.\n`;
      }
    }

    message += `_______________________________\n\n`;
    message += `Thank you! 🙏\n`;
    message += `_Harvester Smart Khata_`;
  } else {
    message += `🌾 *हार्वेस्टर स्मार्ट खाता* 🌾\n`;
    message += `_______________________________\n\n`;
    message += `🙏 प्रणाम *${name}* जी,\n\n`;

    if (amount > 0) {
      message += `✅ आपका पेमेंट सफलतापूर्वक जमा कर लिया गया है।\n\n`;
      message += `💰 जमा राशि: *₹${amount.toLocaleString('en-IN')}*\n`;
      message += `💳 पेमेंट का तरीका: *${mode}*\n`;
    } else {
      message += `📋 आपके खाते का कुल हिसाब नीचे अनुसार है:\n\n`;
    }

    message += `_______________________________\n`;
    message += `📌 *कुल बकाया राशि:* ₹${remainingDue.toLocaleString('en-IN')}\n`;

    if (remainingDue > 0 && daysLeft !== null) {
      if (daysLeft >= 0) {
        message += `⏰ कृपया *${daysLeft} दिन* में भुगतान करें।\n`;
      } else {
        message += `⚠️ भुगतान की तारीख *${Math.abs(daysLeft)} दिन* पहले निकल चुकी है। कृपया जल्द भुगतान करें।\n`;
      }
    }

    message += `_______________________________\n\n`;
    message += `धन्यवाद! 🙏\n`;
    message += `_Harvester Smart Khata_`;
  }

  const encodedMsg = encodeURIComponent(message);
  const url = cleanPhone
    ? `https://wa.me/91${cleanPhone}?text=${encodedMsg}`
    : `https://wa.me/?text=${encodedMsg}`;

  window.open(url, '_blank');
}

// 🗓️ Helper: nearest upcoming/overdue due_date among a farmer's still-pending entries
function getNearestDueDate(entries = []) {
  const pending = entries
    .filter((e) => e.due_date && Number(e.amount_remaining) > 0)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  return pending.length > 0 ? pending[0].due_date : null;
}

/* ------------------------------------------------------------------ */
/*  Shared UI primitives                                              */
/* ------------------------------------------------------------------ */

function GoogleFonts() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');
      * { box-sizing: border-box; }
      ::selection { background: ${C.emeraldSoft}; color: ${C.emeraldDark}; }
      input:focus, select:focus, textarea:focus {
        outline: none;
        border-color: ${C.emeraldRing} !important;
        box-shadow: 0 0 0 3px ${C.emeraldSoft};
      }
      button:focus-visible { outline: 2px solid ${C.emeraldRing}; outline-offset: 2px; }
      @keyframes fadeUp { from { opacity:0; transform: translateY(6px);} to {opacity:1; transform:translateY(0);} }
      .fade-up { animation: fadeUp 0.25s ease-out; }
      .scrollbar-thin::-webkit-scrollbar { height: 6px; width: 6px; }
      .scrollbar-thin::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
    `}</style>
  );
}

function Pill({ children, tone = 'slate' }) {
  const tones = {
    slate: { bg: '#F1F5F9', fg: C.inkSoft },
    emerald: { bg: C.emeraldSoft, fg: C.emeraldDark },
    rose: { bg: C.roseSoft, fg: C.rose },
    amber: { bg: C.amberSoft, fg: C.amber },
    indigo: { bg: C.indigoSoft, fg: C.indigo },
  };
  const t = tones[tone] || tones.slate;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: t.bg, color: t.fg }}
    >
      {children}
    </span>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isErr = toast.type === 'error';
  return (
    <div
      className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 fade-up flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg max-w-[90vw] border"
      style={{ background: C.card, color: C.ink, borderColor: C.border }}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
        style={{ background: isErr ? C.roseSoft : C.emeraldSoft, color: isErr ? C.rose : C.emerald }}
      >
        {isErr ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
      </div>
      <span className="text-sm font-medium">{toast.message}</span>
      <button onClick={onClose} className="ml-2 text-slate-400 hover:text-slate-600">
        <X size={15} />
      </button>
    </div>
  );
}

function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border shadow-sm ${className}`}
      style={{ background: C.card, borderColor: C.border }}
    >
      {children}
    </div>
  );
}

function FieldLabel({ children }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.inkSoft }}>
      {children}
    </label>
  );
}

const inputBase =
  'w-full rounded-lg px-3.5 py-2.5 text-sm border transition-all bg-white placeholder:text-slate-400';
const inputStyle = { borderColor: C.border, color: C.ink };

function TextInput(props) {
  return <input {...props} className={`${inputBase} ${props.className || ''}`} style={{ ...inputStyle, ...props.style }} />;
}
function Select(props) {
  return <select {...props} className={`${inputBase} ${props.className || ''}`} style={{ ...inputStyle, ...props.style }} />;
}

function PrimaryButton({ children, icon, className = '', ...rest }) {
  return (
    <button
      {...rest}
      className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      style={{ background: C.emerald }}
      onMouseEnter={(e) => { if (!rest.disabled) e.currentTarget.style.background = C.emeraldDark; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = C.emerald; }}
    >
      {icon}
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  LOGIN / SIGNUP SCREEN                                              */
/* ------------------------------------------------------------------ */
function AuthScreen({ onLoggedIn, notify }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      notify('Username aur password dono bharo bhai.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        await apiPost('/auth/signup', {
          username: username.trim(),
          password,
          display_name: displayName.trim() || username.trim(),
        });
        notify('Account ban gaya! Ab login karo.', 'success');
        setMode('login');
        setPassword('');
        return;
      }

      // login
      const res = await apiPost('/auth/login', { username: username.trim(), password });
      const user = {
        username: res.username,
        display_name: res.display_name,
        role: res.role,
      };
      saveSession(res.access_token, user);
      notify(`स्वागत है, ${user.display_name || user.username}!`, 'success');
      onLoggedIn(res.access_token, user);
    } catch (e) {
      notify(e.message || 'Kuch gadbad ho gayi.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ ...fontBody, background: C.bg }}>
      <GoogleFonts />
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md mb-3"
            style={{ background: `linear-gradient(135deg, ${C.emerald}, ${C.emeraldDark})` }}
          >
            <Sprout size={26} color="#fff" strokeWidth={2.25} />
          </div>
          <h1 className="text-xl font-extrabold" style={{ ...fontHead, color: C.ink }}>Harvester Smart Khata</h1>
          <p className="text-xs" style={{ color: C.inkFaint }}>Agro-tech ledger</p>
        </div>

        <Card className="p-6">
          <div className="flex rounded-lg p-1 mb-5" style={{ background: '#F1F5F9' }}>
            <button
              type="button"
              onClick={() => setMode('login')}
              className="flex-1 py-2 rounded-md text-sm font-semibold transition-all"
              style={{ background: mode === 'login' ? C.card : 'transparent', color: mode === 'login' ? C.ink : C.inkSoft }}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className="flex-1 py-2 rounded-md text-sm font-semibold transition-all"
              style={{ background: mode === 'signup' ? C.card : 'transparent', color: mode === 'signup' ? C.ink : C.inkSoft }}
            >
              Naya Account
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <FieldLabel>Apna Naam</FieldLabel>
                <div className="relative">
                  <UserCircle size={16} color={C.inkFaint} className="absolute left-3 top-1/2 -translate-y-1/2" />
                  <TextInput
                    className="!pl-9"
                    placeholder="e.g. Suresh Bhai"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <FieldLabel>Username</FieldLabel>
              <div className="relative">
                <User size={16} color={C.inkFaint} className="absolute left-3 top-1/2 -translate-y-1/2" />
                <TextInput
                  className="!pl-9"
                  placeholder="e.g. suresh123"
                  autoCapitalize="none"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Password</FieldLabel>
              <div className="relative">
                <Lock size={16} color={C.inkFaint} className="absolute left-3 top-1/2 -translate-y-1/2" />
                <TextInput
                  type={showPassword ? 'text' : 'password'}
                  className="!pl-9 !pr-9"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <PrimaryButton
              type="submit"
              disabled={submitting}
              icon={submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              className="w-full !py-3"
            >
              {mode === 'login' ? 'Login Karein' : 'Account Banayein'}
            </PrimaryButton>
          </form>
        </Card>

        <p className="text-center text-xs mt-4" style={{ color: C.inkFaint }}>
          Har harvester owner ka apna alag, surakshit khata.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Navigation                                                        */
/* ------------------------------------------------------------------ */
function getNavItems(role) {
  const base = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'farmers', label: 'Add Farmer', icon: UserPlus },
    { id: 'entry', label: 'New Entry', icon: ClipboardList },
    { id: 'search', label: 'Khata Search', icon: Search },
  ];
  if (role === 'superadmin') {
    base.push({ id: 'all_harvesters', label: 'All Harvesters', icon: Building2 });
  }
  return base;
}

function Logo({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md"
        style={{ background: `linear-gradient(135deg, ${C.emerald}, ${C.emeraldDark})` }}
      >
        <Sprout size={18} color="#fff" strokeWidth={2.25} />
      </div>
      {!compact && (
        <div>
          <div className="font-bold leading-tight text-[15px]" style={{ ...fontHead, color: C.ink }}>
            Harvester Smart Khata
          </div>
          <div className="text-[11px] font-medium" style={{ color: C.inkFaint }}>Agro-tech ledger</div>
        </div>
      )}
    </div>
  );
}

function Sidebar({ view, setView, user, onLogout }) {
  const navItems = getNavItems(user?.role);
  return (
    <aside
      className="hidden md:flex flex-col w-64 shrink-0 min-h-screen sticky top-0 border-r"
      style={{ background: C.sidebar, borderColor: C.border }}
    >
      <div className="px-5 py-6 border-b" style={{ borderColor: C.borderSoft }}>
        <Logo />
      </div>
      <nav className="flex-1 px-3 py-5 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm font-semibold transition-colors"
              style={{
                background: active ? C.emeraldSoft : 'transparent',
                color: active ? C.emeraldDark : C.inkSoft,
              }}
            >
              <Icon size={17} strokeWidth={2.25} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: C.indigoSoft }}>
            <User size={15} color={C.indigo} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate" style={{ color: C.ink }}>{user?.display_name || user?.username}</div>
            <div className="text-[10px]" style={{ color: C.inkFaint }}>{user?.role === 'superadmin' ? 'Super Admin' : 'Harvester Owner'}</div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
          style={{ background: C.roseSoft, color: C.rose }}
        >
          <LogOut size={14} /> Logout
        </button>
      </div>
    </aside>
  );
}

function BottomNav({ view, setView, role }) {
  const navItems = getNavItems(role);
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-around py-2 border-t overflow-x-auto"
      style={{ background: C.card, borderColor: C.border }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = view === item.id;
        return (
          <button key={item.id} onClick={() => setView(item.id)} className="flex flex-col items-center gap-1 px-2 py-1 shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: active ? C.emeraldSoft : 'transparent' }}>
              <Icon size={18} color={active ? C.emeraldDark : C.inkFaint} strokeWidth={2.25} />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: active ? C.emeraldDark : C.inkFaint }}>
              {item.label.split(' ')[0]}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                         */
/* ------------------------------------------------------------------ */
function StatCard({ icon: Icon, label, value, tone, sub }) {
  const tones = {
    indigo: { fg: C.indigo, soft: C.indigoSoft },
    emerald: { fg: C.emerald, soft: C.emeraldSoft },
    rose: { fg: C.rose, soft: C.roseSoft },
    amber: { fg: C.amber, soft: C.amberSoft },
  };
  const t = tones[tone] || tones.indigo;
  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.inkSoft }}>{label}</span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: t.soft }}>
          <Icon size={16} color={t.fg} />
        </div>
      </div>
      <div className="text-2xl md:text-[28px] font-extrabold" style={{ ...fontHead, color: C.ink }}>
        {value}
      </div>
      {sub && <div className="text-xs" style={{ color: C.inkFaint }}>{sub}</div>}
    </Card>
  );
}

const EXPENSE_TYPES = [
  { id: 'diesel', label: 'Diesel' },
  { id: 'maintenance', label: 'Maintenance / Toot-Phoot' },
  { id: 'repair', label: 'Repair' },
  { id: 'labor', label: 'Labour' },
  { id: 'other', label: 'Other' },
];

function Dashboard({ notify, token, onUnauthorized }) {
  const [year, setYear] = useState(2026);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [exForm, setExForm] = useState({
    expense_type: 'diesel', amount: '', details: '', date: todayISO(), season_year: 2026,
  });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (y) => {
    setLoading(true);
    setError('');
    try {
      const data = await apiGet(`/expenses/profit-analysis?year=${y}`, token);
      setAnalysis(data);
    } catch (e) {
      if (e.message === '__UNAUTHORIZED__') return onUnauthorized();
      setError(e.message || 'Could not load the profit analysis.');
    } finally {
      setLoading(false);
    }
  }, [token, onUnauthorized]);

  useEffect(() => { load(year); }, [year, load]);

  useEffect(() => {
    setExForm((f) => ({ ...f, season_year: year }));
  }, [year]);

  const netProfit = analysis?.net_profit ?? 0;
  const cashCollected = analysis?.total_cash_collected ?? 0;

  const submitExpense = async (e) => {
    e.preventDefault();
    if (!exForm.amount || !exForm.details) {
      notify('Please fill amount and details.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await apiPost('/expenses/', {
        ...exForm,
        amount: Number(exForm.amount),
        season_year: Number(exForm.season_year),
      }, token);
      notify('Expense logged to the khata.', 'success');
      setExForm({ expense_type: 'diesel', amount: '', details: '', date: todayISO(), season_year: year });
      load(year);
    } catch (e) {
      if (e.message === '__UNAUTHORIZED__') return onUnauthorized();
      notify(e.message || 'Could not log the expense.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 🚜 DOWNLOAD KHARCHA EXCEL REPORT (CLEAN SINGLE TABLE FORMAT)
  const downloadExpenseExcelReport = async () => {
    try {
      let expList = [];
      try {
        expList = await apiGet(`/expenses/?year=${year}`, token);
      } catch (e) {
        expList = [];
      }

      let csvContent = "Date,Type of Expense,Details,Amount (Rs)\n";
      let grandTotal = 0;

      if (expList.length > 0) {
        expList.forEach(e => {
          const amt = Number(e.amount) || 0;
          grandTotal += amt;
          csvContent += `"${e.date || ''}","${e.expense_type || ''}","${(e.details || '').replace(/"/g, '""')}",${amt}\n`;
        });
        csvContent += `,,TOTAL KHARCHA,${grandTotal}\n`;
      } else {
        csvContent += `No expense entries found for ${year},,,\n`;
      }

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Harvester_Kharcha_Report_${year}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      notify(`${year} Ka Kharcha Excel Sheet Download Ho Gaya!`, 'success');
    } catch (err) {
      notify('Kharcha report download karne me dikkat aayi!', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ ...fontHead, color: C.ink }}>Owner Dashboard</h1>
          <p className="text-sm" style={{ color: C.inkSoft }}>Gross earnings, collections and season profit at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadExpenseExcelReport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <FileSpreadsheet size={15} /> Kharcha Excel File
          </button>

          <CalendarDays size={16} color={C.inkFaint} />
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="!w-32">
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl" style={{ background: C.roseSoft, color: C.rose }}>
          <AlertCircle size={16} /> {error} — is the backend running at {API_BASE}?
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm py-10 justify-center" style={{ color: C.inkSoft }}>
          <Loader2 size={18} className="animate-spin" /> Fetching this season's numbers…
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={IndianRupee} label="Gross Revenue" value={fmtINR(analysis?.total_gross_income)} tone="indigo" sub="Total value of work done" />
          <StatCard icon={Wallet} label="Cash Collected" value={fmtINR(cashCollected)} tone="emerald" sub="Received from farmers" />
          <StatCard icon={Receipt} label="Total Expenses" value={fmtINR(analysis?.total_expenses)} tone="rose" sub="Diesel, repairs & more" />
          <StatCard
            icon={netProfit >= 0 ? TrendingUp : TrendingDown}
            label="Net Profit"
            value={fmtINR(netProfit)}
            tone={netProfit >= 0 ? 'emerald' : 'rose'}
            sub={netProfit >= 0 ? 'Season is in the black' : 'Season is running at a loss'}
          />
        </div>
      )}

      <Card className="p-5 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.emeraldSoft }}>
            <Receipt size={15} color={C.emerald} />
          </div>
          <h2 className="font-bold" style={{ ...fontHead, color: C.ink }}>Log an Expense</h2>
        </div>
        <form onSubmit={submitExpense} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Expense Type</FieldLabel>
            <Select value={exForm.expense_type} onChange={(e) => setExForm({ ...exForm, expense_type: e.target.value })}>
              {EXPENSE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </Select>
          </div>
          <div>
            <FieldLabel>Amount (₹)</FieldLabel>
            <TextInput type="number" min="0" placeholder="e.g. 1500" value={exForm.amount}
              onChange={(e) => setExForm({ ...exForm, amount: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Date</FieldLabel>
            <TextInput type="date" value={exForm.date} onChange={(e) => setExForm({ ...exForm, date: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Season Year</FieldLabel>
            <Select value={exForm.season_year} onChange={(e) => setExForm({ ...exForm, season_year: Number(e.target.value) })}>
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
          </div>
          <div className="md:col-span-2">
            <FieldLabel>Details</FieldLabel>
            <TextInput type="text" placeholder="e.g. Diesel refill at Ramgarh pump" value={exForm.details}
              onChange={(e) => setExForm({ ...exForm, details: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <PrimaryButton type="submit" disabled={submitting} icon={submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} className="w-full md:w-auto">
              Save Expense
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Add Farmer                                                        */
/* ------------------------------------------------------------------ */
function AddFarmer({ notify, token, onUnauthorized }) {
  const empty = { name: '', father_name: '', phone_number: '', village: '' };
  const [form, setForm] = useState(empty);
  const [submitting, setSubmitting] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone_number) {
      notify('Name and phone number are required.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiPost('/farmers/', form, token);
      notify(`${form.name} added to the khata.`, 'success');
      setLastAdded(res?.name ? res : { ...form });
      setForm(empty);
    } catch (e) {
      if (e.message === '__UNAUTHORIZED__') return onUnauthorized();
      notify(e.message || 'Could not add farmer.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ ...fontHead, color: C.ink }}>Add New Farmer</h1>
        <p className="text-sm" style={{ color: C.inkSoft }}>Register a farmer once — reuse them for every harvesting entry.</p>
      </div>

      <Card className="p-5 md:p-6">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <FieldLabel>Farmer's Name</FieldLabel>
            <TextInput placeholder="e.g. Ramesh Patel" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Father's Name</FieldLabel>
            <TextInput placeholder="e.g. Suresh Patel" value={form.father_name} onChange={(e) => setForm({ ...form, father_name: e.target.value })} />
          </div>
          <div>
            <FieldLabel>Phone Number</FieldLabel>
            <TextInput type="tel" placeholder="10-digit mobile" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <FieldLabel>Village</FieldLabel>
            <TextInput placeholder="e.g. Bhatapara" value={form.village} onChange={(e) => setForm({ ...form, village: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <PrimaryButton type="submit" disabled={submitting} icon={submitting ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />} className="w-full md:w-auto">
              Add Farmer
            </PrimaryButton>
          </div>
        </form>
      </Card>

      {lastAdded && (
        <Card className="p-5 fade-up flex items-start gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: C.emeraldSoft }}>
            <CheckCircle2 size={18} color={C.emerald} />
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: C.ink }}>{lastAdded.name} was added</div>
            <div className="text-xs" style={{ color: C.inkSoft }}>
              {lastAdded.father_name && <>S/o {lastAdded.father_name} · </>}{lastAdded.village}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  New Katai Entry                                                   */
/* ------------------------------------------------------------------ */
function FarmerCombobox({ value, onChange, token, onUnauthorized }) {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiGet(`/farmers/search?name=${encodeURIComponent(query)}`, token);
        setOptions(Array.isArray(data) ? data : data?.farmers || []);
      } catch (e) {
        if (e.message === '__UNAUTHORIZED__') { onUnauthorized(); return; }
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query, token, onUnauthorized]);

  useEffect(() => {
    const onClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={boxRef}>
      <div className="relative">
        <Search size={15} color={C.inkFaint} className="absolute left-3 top-1/2 -translate-y-1/2" />
        <TextInput
          placeholder="Type a farmer's name…"
          className="!pl-9"
          value={value ? value.name : query}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); onChange(null); setOpen(true); }}
        />
      </div>
      {open && (query.length > 0 || options.length > 0) && (
        <div className="absolute z-20 mt-1.5 w-full rounded-xl shadow-lg border max-h-56 overflow-y-auto scrollbar-thin" style={{ background: C.card, borderColor: C.border }}>
          {loading && <div className="px-3.5 py-2.5 text-xs" style={{ color: C.inkSoft }}>Searching…</div>}
          {!loading && options.length === 0 && (
            <div className="px-3.5 py-2.5 text-xs" style={{ color: C.inkSoft }}>No farmer found. Try adding them first.</div>
          )}
          {options.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => { onChange(f); setQuery(''); setOpen(false); }}
              className="w-full text-left px-3.5 py-2.5 text-sm hover:bg-slate-50 flex items-center justify-between transition-colors"
            >
              <span style={{ color: C.ink }}>{f.name}</span>
              <span className="text-xs" style={{ color: C.inkFaint }}>{f.village}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NewKataiEntry({ notify, token, onUnauthorized }) {
  const [farmer, setFarmer] = useState(null);
  const [form, setForm] = useState({
    khet_name: '', fasal_name: '', bigha: '', rate_per_bigha: '', amount_received: '',
    season_year: 2026, created_at: todayISO(), due_date: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const total = useMemo(() => (Number(form.bigha) || 0) * (Number(form.rate_per_bigha) || 0), [form.bigha, form.rate_per_bigha]);
  const remaining = useMemo(() => total - (Number(form.amount_received) || 0), [total, form.amount_received]);

  const submit = async (e) => {
    e.preventDefault();
    if (!farmer) { notify('Please select a farmer first.', 'error'); return; }
    if (!form.khet_name || !form.fasal_name || !form.bigha || !form.rate_per_bigha) {
      notify('Please fill in the field, crop, bigha and rate.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiPost('/katai/', {
        ...form,
        bigha: Number(form.bigha),
        rate_per_bigha: Number(form.rate_per_bigha),
        amount_received: Number(form.amount_received) || 0,
        season_year: Number(form.season_year),
        due_date: form.due_date || null,
        farmer_id: farmer.id,
      }, token);
      notify('Harvesting entry recorded.', 'success');
      setReceipt(res);
      setForm({ khet_name: '', fasal_name: '', bigha: '', rate_per_bigha: '', amount_received: '', season_year: form.season_year, created_at: todayISO(), due_date: '' });
      setFarmer(null);
    } catch (e) {
      if (e.message === '__UNAUTHORIZED__') return onUnauthorized();
      notify(e.message || 'Could not save the entry.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold" style={{ ...fontHead, color: C.ink }}>New Harvesting Entry</h1>
        <p className="text-sm" style={{ color: C.inkSoft }}>Record a field cut — the totals below update as you type.</p>
      </div>

      <Card className="p-5 md:p-6">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <FieldLabel>Farmer</FieldLabel>
            <FarmerCombobox value={farmer} onChange={setFarmer} token={token} onUnauthorized={onUnauthorized} />
            {farmer && (
              <div className="mt-1.5 text-xs flex items-center gap-1 font-medium" style={{ color: C.emerald }}>
                <CheckCircle2 size={13} /> S/o {farmer.father_name || '—'} · {farmer.village}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Khet (Field) Name</FieldLabel>
              <TextInput placeholder="e.g. Uttar Khet" value={form.khet_name} onChange={(e) => setForm({ ...form, khet_name: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Fasal (Crop)</FieldLabel>
              <div className="relative">
                <Wheat size={15} color={C.inkFaint} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
                <Select
                  className="!pl-9"
                  value={form.fasal_name}
                  onChange={(e) => setForm({ ...form, fasal_name: e.target.value })}
                >
                  <option value="">-- Fasal Chuniye --</option>
                  {CROPS_LIST.map((crop) => (
                    <option key={crop} value={crop}>
                      {crop}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <FieldLabel>Bigha</FieldLabel>
              <TextInput type="number" min="0" step="0.1" placeholder="e.g. 4.5" value={form.bigha} onChange={(e) => setForm({ ...form, bigha: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Rate per Bigha (₹)</FieldLabel>
              <TextInput type="number" min="0" placeholder="e.g. 900" value={form.rate_per_bigha} onChange={(e) => setForm({ ...form, rate_per_bigha: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Amount Received (₹)</FieldLabel>
              <TextInput type="number" min="0" placeholder="e.g. 2000" value={form.amount_received} onChange={(e) => setForm({ ...form, amount_received: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Date</FieldLabel>
              <TextInput type="date" value={form.created_at} onChange={(e) => setForm({ ...form, created_at: e.target.value })} />
            </div>
            <div>
              <FieldLabel>Season Year</FieldLabel>
              <Select value={form.season_year} onChange={(e) => setForm({ ...form, season_year: Number(e.target.value) })}>
                {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
              </Select>
            </div>
            <div>
              <FieldLabel>Bhugtan Ki Antim Tithi (Due Date)</FieldLabel>
              <TextInput type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-xl p-4 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between border" style={{ background: C.emeraldSoft, borderColor: '#D1FAE5' }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: C.ink }}>
              <span style={fontMono}>{form.bigha || 0}</span>
              <span style={{ color: C.inkSoft }}>bigha ×</span>
              <span style={fontMono}>₹{form.rate_per_bigha || 0}</span>
              <span style={{ color: C.inkSoft }}>=</span>
              <span className="font-bold" style={{ ...fontMono, color: C.ink }}>{fmtINR(total)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wide font-semibold" style={{ color: C.inkSoft }}>Remaining Dues</span>
              <span className="font-bold text-lg" style={{ ...fontMono, color: remaining > 0 ? C.rose : C.emerald }}>
                {fmtINR(remaining)}
              </span>
            </div>
          </div>

          <PrimaryButton type="submit" disabled={submitting} icon={submitting ? <Loader2 size={16} className="animate-spin" /> : <ClipboardList size={16} />} className="w-full md:w-auto">
            Save Entry
          </PrimaryButton>
        </form>
      </Card>

      {receipt && (
        <Card className="p-5 md:p-6 fade-up">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: C.emeraldSoft }}>
                <Receipt size={15} color={C.emerald} />
              </div>
              <h3 className="font-bold" style={{ ...fontHead, color: C.ink }}>Entry Recorded</h3>
            </div>
            <Pill tone="emerald"><CheckCircle2 size={12} /> Saved</Pill>
          </div>
          <div className="grid grid-cols-2 gap-y-2.5 text-sm" style={{ color: C.ink }}>
            <span style={{ color: C.inkSoft }}>Farmer</span>
            <span className="text-right font-semibold">{receipt.farmer?.name || '—'}</span>
            <span style={{ color: C.inkSoft }}>Village</span>
            <span className="text-right">{receipt.farmer?.village || '—'}</span>
            <span style={{ color: C.inkSoft }}>Total Amount</span>
            <span className="text-right font-bold" style={fontMono}>{fmtINR(receipt.total_amount)}</span>
            <span style={{ color: C.inkSoft }}>Remaining Dues</span>
            <span className="text-right font-bold" style={{ ...fontMono, color: (receipt.amount_remaining > 0) ? C.rose : C.emerald }}>
              {fmtINR(receipt.amount_remaining)}
            </span>
            {receipt.due_date && (
              <>
                <span style={{ color: C.inkSoft }}>Due Date</span>
                <span className="text-right font-semibold">{receipt.due_date}</span>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Khata Search & List with WHATSAPP, JAMA PAYMENT & EXCEL EXPORT   */
/* ------------------------------------------------------------------ */
function FarmerResultCard({ f, onOpenPayment }) {
  const [expanded, setExpanded] = useState(false);
  const [lang, setLang] = useState('hi');
  const dues = f.total_outstanding_dues ?? f.outstanding_dues ?? f.total_dues ?? 0;
  const entries = f.katai_entries || f.entries || [];
  const nearestDueDate = getNearestDueDate(entries);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: C.indigoSoft }}>
            <User size={18} color={C.indigo} />
          </div>
          <div>
            <div className="font-bold" style={{ ...fontHead, color: C.ink }}>{f.name}</div>
            <div className="text-xs flex flex-wrap gap-x-3 gap-y-1 mt-1" style={{ color: C.inkSoft }}>
              {f.father_name && <span>S/o {f.father_name}</span>}
              {f.village && <span className="flex items-center gap-1"><MapPin size={11} />{f.village}</span>}
              {f.phone_number && <span className="flex items-center gap-1"><Phone size={11} />{f.phone_number}</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Pill tone={dues > 0 ? 'rose' : 'emerald'}>
            {dues > 0 ? `Due ${fmtINR(dues)}` : 'Cleared'}
          </Pill>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
              title="Toggle receipt language / भाषा बदलें"
            >
              <Languages size={13} /> {lang === 'hi' ? 'हिं' : 'EN'}
            </button>

            <button
              onClick={() => sendWhatsAppReceipt(f.phone_number, f.name, 0, dues, 'Khata Summary', lang, nearestDueDate)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all border border-emerald-200"
              title="Share Khata Dues on WhatsApp"
            >
              <MessageSquare size={13} /> WhatsApp
            </button>

            <button
              onClick={() => onOpenPayment(f)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm transition-all"
              style={{ background: C.emerald }}
            >
              <Wallet size={13} /> ➕ Jama Karein
            </button>
          </div>
        </div>
      </div>

      {entries.length > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide"
          style={{ color: C.emerald }}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <History size={13} /> {entries.length} harvesting {entries.length === 1 ? 'entry' : 'entries'}
        </button>
      )}

      {expanded && (
        <div className="mt-3 overflow-x-auto scrollbar-thin fade-up">
          <table className="w-full text-xs min-w-[620px]">
            <thead>
              <tr style={{ color: C.inkFaint }}>
                <th className="text-left font-semibold uppercase tracking-wide py-1.5 pr-3">Field</th>
                <th className="text-left font-semibold uppercase tracking-wide py-1.5 pr-3">Crop</th>
                <th className="text-right font-semibold uppercase tracking-wide py-1.5 pr-3">Bigha</th>
                <th className="text-right font-semibold uppercase tracking-wide py-1.5 pr-3">Total</th>
                <th className="text-right font-semibold uppercase tracking-wide py-1.5 pr-3">Received</th>
                <th className="text-right font-semibold uppercase tracking-wide py-1.5 pr-3">Due</th>
                <th className="text-right font-semibold uppercase tracking-wide py-1.5">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((en, i) => (
                <tr key={en.id || i} style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                  <td className="py-1.5 pr-3" style={{ color: C.ink }}>{en.khet_name}</td>
                  <td className="py-1.5 pr-3" style={{ color: C.ink }}>{en.fasal_name}</td>
                  <td className="py-1.5 pr-3 text-right" style={fontMono}>{en.bigha}</td>
                  <td className="py-1.5 pr-3 text-right" style={fontMono}>{fmtINR(en.total_amount)}</td>
                  <td className="py-1.5 pr-3 text-right" style={fontMono}>{fmtINR(en.amount_received)}</td>
                  <td className="py-1.5 pr-3 text-right font-bold" style={{ ...fontMono, color: (en.amount_remaining > 0) ? C.rose : C.emerald }}>
                    {fmtINR(en.amount_remaining)}
                  </td>
                  <td className="py-1.5 text-right" style={{ color: C.inkFaint }}>{en.due_date || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function KhataSearch({ notify, token, onUnauthorized }) {
  const [query, setQuery] = useState('');
  const [allFarmers, setAllFarmers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [paymentLang, setPaymentLang] = useState('hi');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Load all farmers on startup
  const fetchAllFarmers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet('/farmers/search?name=', token);
      setAllFarmers(Array.isArray(data) ? data : data?.farmers || []);
    } catch (e) {
      if (e.message === '__UNAUTHORIZED__') { onUnauthorized(); return; }
      notify(e.message || 'Could not load farmers list.', 'error');
    } finally {
      setLoading(false);
    }
  }, [notify, token, onUnauthorized]);

  useEffect(() => {
    fetchAllFarmers();
  }, [fetchAllFarmers]);

  // Client search filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allFarmers;
    return allFarmers.filter(f =>
      f.name?.toLowerCase().includes(q) ||
      f.village?.toLowerCase().includes(q) ||
      f.phone_number?.includes(q)
    );
  }, [allFarmers, query]);

  // 📊 CONSOLIDATED 2026 KISAN EXCEL REPORT (1 KISAN = 1 ROW SUMMARY)
  const downloadFarmersExcel = () => {
    if (allFarmers.length === 0) {
      notify('Koi kisan data nahi mila download ke liye!', 'error');
      return;
    }

    let csvContent = "Kisan Naam,Pita Ka Naam,Gaon,Mobile Number,Kul Khet (Count),Kul Bigha,Total Bill (Rs),Kul Jama Raashi (Rs),Kul Bakaya Dues (Rs)\n";
    let total2026Farmers = 0;

    allFarmers.forEach(f => {
      const entries = f.katai_entries || f.entries || [];
      const entries2026 = entries.filter(e => Number(e.season_year) === 2026);

      if (entries2026.length > 0) {
        total2026Farmers++;
        const totalKhetCount = entries2026.length;
        const totalBigha = entries2026.reduce((sum, e) => sum + (Number(e.bigha) || 0), 0);
        const totalBill = entries2026.reduce((sum, e) => sum + (Number(e.total_amount) || 0), 0);
        const totalJama = entries2026.reduce((sum, e) => sum + (Number(e.amount_received) || 0), 0);
        const totalDue = entries2026.reduce((sum, e) => sum + (Number(e.amount_remaining) || 0), 0);

        csvContent += `"${f.name || ''}","${f.father_name || ''}","${f.village || ''}","${f.phone_number || ''}",${totalKhetCount},${totalBigha},${totalBill},${totalJama},${totalDue}\n`;
      } else {
        total2026Farmers++;
        csvContent += `"${f.name || ''}","${f.father_name || ''}","${f.village || ''}","${f.phone_number || ''}",0,0,0,0,${f.total_outstanding_dues || 0}\n`;
      }
    });

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Kisan_Consolidated_Khata_Report_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify(`2026 ke ${total2026Farmers} kisaano ki Consolidated Excel sheet download ho gayi!`, 'success');
  };

  // Handle Payment Submit (STRICT BACKEND SYNC WITH ERROR ALERT)
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      notify('Please enter a valid payment amount.', 'error');
      return;
    }

    setSubmittingPayment(true);

    try {
      // 1. Strict API hit to Backend
      await apiPost('/payments/', {
        farmer_id: selectedFarmer.id,
        amount: amt,
        payment_mode: paymentMode,
        date: todayISO()
      }, token);

      notify(`₹${amt} payment saved permanently to database!`, 'success');

      // 2. Fetch updated data from DB
      await fetchAllFarmers();

      // 3. Open WhatsApp Receipt (bilingual + due date aware)
      const entries = selectedFarmer.katai_entries || selectedFarmer.entries || [];
      const nearestDueDate = getNearestDueDate(entries);
      const newDue = Math.max(0, (selectedFarmer.total_outstanding_dues || 0) - amt);
      sendWhatsAppReceipt(selectedFarmer.phone_number, selectedFarmer.name, amt, newDue, paymentMode, paymentLang, nearestDueDate);

      setSelectedFarmer(null);
      setPaymentAmount('');
    } catch (err) {
      if (err.message === '__UNAUTHORIZED__') { onUnauthorized(); return; }
      notify(`Payment Save Nahi Ho Paya: ${err.message}`, 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ ...fontHead, color: C.ink }}>Khata Search & Register</h1>
          <p className="text-sm" style={{ color: C.inkSoft }}>Look up farmers, see pending dues, receive payments & share WhatsApp slips.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadFarmersExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <FileSpreadsheet size={15} /> 2026 All Farmers Excel
          </button>

          <Pill tone="emerald">Total Farmers: {allFarmers.length}</Pill>
        </div>
      </div>

      <div className="relative">
        <Search size={17} color={C.inkFaint} className="absolute left-4 top-1/2 -translate-y-1/2" />
        <TextInput
          className="!pl-11 !py-3 text-base shadow-sm"
          placeholder="Search farmer by name, village or phone number..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm py-12 justify-center" style={{ color: C.inkSoft }}>
          <Loader2 size={18} className="animate-spin" /> Loading all farmer accounts…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-sm text-center py-10" style={{ color: C.inkSoft }}>
          No farmer matches "{query}".
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((f) => (
            <FarmerResultCard key={f.id} f={f} onOpenPayment={(farmer) => { setSelectedFarmer(farmer); setPaymentLang('hi'); }} />
          ))}
        </div>
      )}

      {/* 💳 JAMA PAYMENT POPUP MODAL */}
      {selectedFarmer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-up">
          <Card className="w-full max-w-md p-6 relative">
            <button
              onClick={() => setSelectedFarmer(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: C.emeraldSoft }}>
                <Wallet size={18} color={C.emerald} />
              </div>
              <div>
                <h3 className="font-bold text-base" style={{ ...fontHead, color: C.ink }}>Jama Payment Darj Karein</h3>
                <p className="text-xs" style={{ color: C.inkSoft }}>Kisan: <span className="font-semibold">{selectedFarmer.name}</span></p>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <FieldLabel>कितने रूपए जमा कर रहे हे (₹)</FieldLabel>
                <TextInput
                  type="number"
                  required
                  min="1"
                  placeholder="रकम डाले "
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="!text-lg font-bold !py-3"
                  style={{ color: C.emerald }}
                />
              </div>

              <div>
                <FieldLabel>Payment Method</FieldLabel>
                <Select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                  <option value="Cash">💵 नगद</option>
                  <option value="UPI">📱 फ़ोन पे </option>
                  <option value="Bank Transfer">🏦 बैंकअकाउंट</option>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <FieldLabel>Receipt Language</FieldLabel>
                <button
                  type="button"
                  onClick={() => setPaymentLang(paymentLang === 'hi' ? 'en' : 'hi')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all mb-1.5"
                >
                  <Languages size={13} /> {paymentLang === 'hi' ? 'हिंदी' : 'English'}
                </button>
              </div>

              <div className="pt-2">
                <PrimaryButton type="submit" disabled={submittingPayment} className="w-full !py-3">
                  {submittingPayment ? <Loader2 size={16} className="animate-spin" /> : 'Jama Karein & WhatsApp Slip Bhejein 📱'}
                </PrimaryButton>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SUPERADMIN: All Harvesters View                                    */
/* ------------------------------------------------------------------ */
function AllHarvestersView({ notify, token, onUnauthorized }) {
  const [year, setYear] = useState(2026);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (y) => {
    setLoading(true);
    try {
      const data = await apiGet(`/expenses/all-harvesters-summary?year=${y}`, token);
      setSummary(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e.message === '__UNAUTHORIZED__') { onUnauthorized(); return; }
      notify(e.message || 'Could not load harvesters summary.', 'error');
    } finally {
      setLoading(false);
    }
  }, [token, onUnauthorized, notify]);

  useEffect(() => { load(year); }, [year, load]);

  const grandTotals = useMemo(() => {
    return summary.reduce((acc, s) => ({
      farmers: acc.farmers + (s.total_farmers || 0),
      gross: acc.gross + (s.total_gross_income || 0),
      cash: acc.cash + (s.total_cash_collected || 0),
      expenses: acc.expenses + (s.total_expenses || 0),
      profit: acc.profit + (s.net_profit || 0),
      dues: acc.dues + (s.total_outstanding_dues || 0),
    }), { farmers: 0, gross: 0, cash: 0, expenses: 0, profit: 0, dues: 0 });
  }, [summary]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold flex items-center gap-2" style={{ ...fontHead, color: C.ink }}>
            <Building2 size={22} color={C.indigo} /> All Harvesters
          </h1>
          <p className="text-sm" style={{ color: C.inkSoft }}>Kiski kitni chali — sabhi harvester owners ka combined view.</p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays size={16} color={C.inkFaint} />
          <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="!w-32">
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Harvesters" value={summary.length} tone="indigo" sub="Registered owners" />
        <StatCard icon={IndianRupee} label="Combined Gross" value={fmtINR(grandTotals.gross)} tone="indigo" sub="All harvesters milakar" />
        <StatCard icon={TrendingUp} label="Combined Net Profit" value={fmtINR(grandTotals.profit)} tone="emerald" sub="Sabki total kamai" />
        <StatCard icon={AlertCircle} label="Combined Dues" value={fmtINR(grandTotals.dues)} tone="rose" sub="Sabke bakaya milakar" />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm py-12 justify-center" style={{ color: C.inkSoft }}>
          <Loader2 size={18} className="animate-spin" /> Sabka data la rahe hain…
        </div>
      ) : summary.length === 0 ? (
        <div className="text-sm text-center py-10" style={{ color: C.inkSoft }}>
          Abhi koi harvester owner registered nahi hai.
        </div>
      ) : (
        <Card className="p-5 md:p-6 overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr style={{ color: C.inkFaint }}>
                <th className="text-left font-semibold uppercase tracking-wide py-2 pr-4 text-xs">Owner</th>
                <th className="text-right font-semibold uppercase tracking-wide py-2 pr-4 text-xs">Farmers</th>
                <th className="text-right font-semibold uppercase tracking-wide py-2 pr-4 text-xs">Gross</th>
                <th className="text-right font-semibold uppercase tracking-wide py-2 pr-4 text-xs">Cash Collected</th>
                <th className="text-right font-semibold uppercase tracking-wide py-2 pr-4 text-xs">Expenses</th>
                <th className="text-right font-semibold uppercase tracking-wide py-2 pr-4 text-xs">Net Profit</th>
                <th className="text-right font-semibold uppercase tracking-wide py-2 text-xs">Dues</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((s) => (
                <tr key={s.owner_id} style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                  <td className="py-2.5 pr-4">
                    <div className="font-semibold" style={{ color: C.ink }}>{s.display_name || s.username}</div>
                    <div className="text-xs" style={{ color: C.inkFaint }}>@{s.username}</div>
                  </td>
                  <td className="py-2.5 pr-4 text-right" style={fontMono}>{s.total_farmers}</td>
                  <td className="py-2.5 pr-4 text-right" style={fontMono}>{fmtINR(s.total_gross_income)}</td>
                  <td className="py-2.5 pr-4 text-right" style={fontMono}>{fmtINR(s.total_cash_collected)}</td>
                  <td className="py-2.5 pr-4 text-right" style={fontMono}>{fmtINR(s.total_expenses)}</td>
                  <td className="py-2.5 pr-4 text-right font-bold" style={{ ...fontMono, color: s.net_profit >= 0 ? C.emerald : C.rose }}>
                    {fmtINR(s.net_profit)}
                  </td>
                  <td className="py-2.5 text-right font-bold" style={{ ...fontMono, color: s.total_outstanding_dues > 0 ? C.rose : C.emerald }}>
                    {fmtINR(s.total_outstanding_dues)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  App shell                                                         */
/* ------------------------------------------------------------------ */
export default function App() {
  const [session, setSession] = useState(() => loadSession());
  const [view, setView] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const notify = useCallback((message, type = 'success') => {
    setToast({ message, type });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const handleLoggedIn = useCallback((token, user) => {
    setSession({ token, user });
    setView('dashboard');
  }, []);

  const handleLogout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const handleUnauthorized = useCallback(() => {
    clearSession();
    setSession(null);
    notify('Login expired ho gaya, dobara login karein.', 'error');
  }, [notify]);

  // 🔐 Agar login nahi hai, to seedha auth screen dikhao
  if (!session) {
    return <AuthScreen onLoggedIn={handleLoggedIn} notify={notify} />;
  }

  const { token, user } = session;

  // Agar superadmin view select hai lekin role match nahi karta, dashboard pe wapas bhejo
  const safeView = (view === 'all_harvesters' && user.role !== 'superadmin') ? 'dashboard' : view;

  return (
    <div className="flex min-h-screen" style={{ ...fontBody, background: C.bg }}>
      <GoogleFonts />
      <Sidebar view={safeView} setView={setView} user={user} onLogout={handleLogout} />

      <main className="flex-1 pb-24 md:pb-10">
        <div className="md:hidden flex items-center justify-between gap-2 px-5 py-4 border-b" style={{ background: C.card, borderColor: C.border }}>
          <div className="flex items-center gap-2">
            <Logo compact />
            <span className="font-bold text-[15px]" style={{ ...fontHead, color: C.ink }}>Harvester Smart Khata</span>
          </div>
          <button onClick={handleLogout} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.roseSoft }}>
            <LogOut size={15} color={C.rose} />
          </button>
        </div>

        <div className="p-4 sm:p-6 md:p-10 max-w-6xl mx-auto">
          {safeView === 'dashboard' && <Dashboard notify={notify} token={token} onUnauthorized={handleUnauthorized} />}
          {safeView === 'farmers' && <AddFarmer notify={notify} token={token} onUnauthorized={handleUnauthorized} />}
          {safeView === 'entry' && <NewKataiEntry notify={notify} token={token} onUnauthorized={handleUnauthorized} />}
          {safeView === 'search' && <KhataSearch notify={notify} token={token} onUnauthorized={handleUnauthorized} />}
          {safeView === 'all_harvesters' && user.role === 'superadmin' && (
            <AllHarvestersView notify={notify} token={token} onUnauthorized={handleUnauthorized} />
          )}
        </div>
      </main>

      <BottomNav view={safeView} setView={setView} role={user.role} />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}