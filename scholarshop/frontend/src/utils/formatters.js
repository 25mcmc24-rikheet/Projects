export function formatCurrency(amount) {
  const n = Number(amount || 0);
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function formatRelative(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return d.toLocaleDateString();
}

export function imageUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const base = import.meta.env.VITE_UPLOADS_URL?.replace(/\/uploads\/?$/, '') || 'http://localhost:4000';
  if (path.startsWith('/uploads/')) return `${base}${path}`;
  if (path.startsWith('/')) return `${base}${path}`;
  return path;
}
