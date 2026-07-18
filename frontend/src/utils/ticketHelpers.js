export const TICKET_PRIORITY = {
  low:    { label: 'Düşük',  color: 'var(--primary)' },
  medium: { label: 'Orta',   color: 'var(--warning)' },
  high:   { label: 'Yüksek', color: 'var(--error)' },
};

export const EXTENSION_INFO = {
  pending:  { label: 'Ek Süre Talebi Bekliyor', color: 'var(--warning)' },
  approved: { label: 'Ek Süre Onaylandı',       color: 'var(--success)' },
  rejected: { label: 'Ek Süre Reddedildi',      color: 'var(--error)' },
};

const toDate = (d) => new Date(d.replace(' ', 'T'));

export const remainingInfo = (dueAt) => {
  if (!dueAt) return { label: '—', color: 'var(--text-subtle)' };
  const diffMin = Math.round((toDate(dueAt) - new Date()) / 60000);
  const abs = Math.abs(diffMin);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const text = h > 0 ? `${h}s ${m}dk` : `${m}dk`;

  if (diffMin < 0) return { label: `${text} gecikti`, color: 'var(--error)' };
  if (diffMin <= 120) return { label: `${text} kaldı`, color: 'var(--error)' };
  if (diffMin <= 480) return { label: `${text} kaldı`, color: 'var(--warning)' };
  return { label: `${text} kaldı`, color: 'var(--success)' };
};

export const fmtDateTime = (d) => d ? toDate(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const toLocalInputValue = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
