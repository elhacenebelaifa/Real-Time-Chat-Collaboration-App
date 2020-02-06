import Avatar from '../shared/Avatar';

export default function UserAvatar({ user, size = 34, showStatus = false }) {
  const online = user?.status === 'online' || !!user?.online;
  return <Avatar user={user} size={size} showDot={showStatus} online={online} />;
}
