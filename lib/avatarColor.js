const AVATAR_COLORS = [
  '#5b8dee',
  '#e9634a',
  '#3cc47c',
  '#f5a623',
  '#9b59b6',
  '#1abc9c',
  '#e74c8b',
  '#6c757d',
];

export function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
