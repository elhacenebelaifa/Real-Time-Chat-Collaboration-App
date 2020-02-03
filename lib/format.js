import React from 'react';

export const AVATAR_TONES = {
  indigo:  { bg: '#e0e4ff', fg: '#4338ca' },
  rose:    { bg: '#ffe0ea', fg: '#be185d' },
  amber:   { bg: '#fdeacb', fg: '#b45309' },
  teal:    { bg: '#cdf0ea', fg: '#0f766e' },
  violet:  { bg: '#ebe0ff', fg: '#6d28d9' },
  lime:    { bg: '#e2f3c3', fg: '#4d7c0f' },
  sky:     { bg: '#d6ecff', fg: '#0369a1' },
  fuchsia: { bg: '#fbdcf5', fg: '#a21caf' },
};

const TONE_KEYS = Object.keys(AVATAR_TONES);

export function toneFor(id) {
  if (!id) return 'indigo';
  let h = 0;
  const s = String(id);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return TONE_KEYS[h % TONE_KEYS.length];
}

export function initialsFor(name) {
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function fmtTime(ts) {
  const d = new Date(ts);
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${mm} ${ampm}`;
}

export function fmtRelative(ts) {
  const t = typeof ts === 'number' ? ts : new Date(ts).getTime();
  const diff = Date.now() - t;
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'now';
  const mn = Math.floor(s / 60);
  if (mn < 60) return `${mn}m`;
  const h = Math.floor(mn / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function fmtDay(ts) {
  const d = new Date(ts);
  const today = new Date();
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  const same = (a, b) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'Today';
  if (same(d, yest)) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export function groupByDay(msgs, tsKey = 'createdAt', idKey = '_id') {
  const out = [];
  let lastDay = null;
  for (const msg of msgs) {
    const ts = msg[tsKey] || msg.timestamp || msg.ts;
    const day = fmtDay(ts);
    if (day !== lastDay) { out.push({ divider: day, key: `d-${msg[idKey] || msg.id}` }); lastDay = day; }
    out.push(msg);
  }
  return out;
}

export function renderMessageBody(body) {
  if (!body) return null;
  const parts = String(body).split(/(@\w+|\*\*[^*\n]+\*\*|```[^`]+```|`[^`]+`|\*[^*\n]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('@')) return (
      <span key={i} style={{ color: '#4f46e5', fontWeight: 600, background: '#eef2ff', padding: '0 3px', borderRadius: 3 }}>{p}</span>
    );
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('*') && p.endsWith('*') && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
    if (p.startsWith('```')) return (
      <pre key={i} style={{
        display: 'block', background: '#0f172a', color: '#e2e8f0',
        padding: '8px 10px', borderRadius: 6, margin: '4px 0',
        fontFamily: 'ui-monospace, "JetBrains Mono", monospace', fontSize: 11.5, lineHeight: 1.45,
        whiteSpace: 'pre-wrap',
      }}>{p.slice(3, -3)}</pre>
    );
    if (p.startsWith('`') && p.endsWith('`')) return (
      <code key={i} style={{
        fontFamily: 'ui-monospace, "JetBrains Mono", monospace', fontSize: 12,
        background: '#f1f5f9', padding: '1px 5px', borderRadius: 3,
      }}>{p.slice(1, -1)}</code>
    );
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}
