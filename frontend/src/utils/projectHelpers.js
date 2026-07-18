export const PRIORITY_INFO = {
  low:      { label: 'Düşük',  color: 'var(--info)' },
  medium:   { label: 'Orta',   color: 'var(--warning)' },
  high:     { label: 'Yüksek', color: 'var(--error)' },
  critical: { label: 'Kritik', color: 'hsl(280, 70%, 58%)' },
};

export const daysRemaining = (endDate) => {
  if (!endDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [y, m, d] = endDate.split(' ')[0].split('-');
  const end = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  end.setHours(0, 0, 0, 0);
  return Math.round((end - today) / 86400000);
};

export const countdownInfo = (endDate) => {
  const days = daysRemaining(endDate);
  if (days === null) return { label: 'Bitiş tarihi yok', color: 'var(--text-subtle)' };
  if (days < 0) return { label: `${Math.abs(days)} gün gecikti`, color: 'var(--error)' };
  if (days === 0) return { label: 'Bugün son gün', color: 'var(--error)' };
  if (days <= 7) return { label: `${days} gün kaldı`, color: 'var(--warning)' };
  return { label: `${days} gün kaldı`, color: 'var(--success)' };
};

export const displayName = (u) => (u.first_name || u.last_name) ? `${u.first_name || ''} ${u.last_name || ''}`.trim() : u.username;

export const initials = (u) => displayName(u).split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase();
