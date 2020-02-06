import { AVATAR_TONES, toneFor, initialsFor } from '../../lib/format';

export default function Avatar({
  user,
  name,
  id,
  initials,
  tone,
  online,
  size = 28,
  showDot = false,
  dotColor = '#ffffff',
}) {
  const resolvedName = name || user?.displayName || user?.username || user?.name;
  const resolvedId = id || user?._id || user?.id || resolvedName;
  const resolvedInitials = initials || user?.initials || initialsFor(resolvedName);
  const resolvedTone = tone || user?.tone || toneFor(resolvedId);
  const resolvedOnline = typeof online === 'boolean' ? online : !!user?.online;
  const t = AVATAR_TONES[resolvedTone] || AVATAR_TONES.indigo;
  const fs = Math.round(size * 0.42);

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: Math.round(size * 0.25),
        background: t.bg, color: t.fg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: fs, fontWeight: 600, letterSpacing: -0.2,
      }}>
        {resolvedInitials}
      </div>
      {showDot && (
        <span style={{
          position: 'absolute', right: -2, bottom: -2,
          width: Math.max(8, size * 0.28), height: Math.max(8, size * 0.28),
          borderRadius: '50%',
          background: resolvedOnline ? '#22c55e' : '#94a3b8',
          border: `2px solid ${dotColor}`,
          boxSizing: 'content-box',
        }}/>
      )}
    </div>
  );
}

export function AvatarStack({ users = [], max = 3, size = 20, ring = '#fff' }) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {shown.map((u, i) => (
        <div
          key={u._id || u.id || i}
          style={{
            marginLeft: i === 0 ? 0 : -6,
            border: `2px solid ${ring}`,
            borderRadius: Math.round(size * 0.3 + 2),
          }}
        >
          <Avatar user={u} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div style={{
          marginLeft: -6, height: size, minWidth: size, padding: '0 5px',
          borderRadius: Math.round(size * 0.3),
          background: '#e2e8f0', color: '#475569',
          fontSize: 10, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          border: `2px solid ${ring}`,
        }}>+{extra}</div>
      )}
    </div>
  );
}
