import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? '/chat' : '/login');
    }
  }, [user, loading, router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Head>
        <title>Real-Time Chat</title>
      </Head>
      <p style={{ color: '#888' }}>Loading...</p>
    </div>
  );
}
