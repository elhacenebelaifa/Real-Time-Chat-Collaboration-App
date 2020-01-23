export default function LoadingSpinner({ size = 24 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: '3px solid #eee',
        borderTopColor: '#667eea',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
      }}
    />
  );
}
