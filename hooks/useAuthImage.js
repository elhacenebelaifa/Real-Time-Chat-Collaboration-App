import { useEffect, useState } from 'react';

export default function useAuthImage(url) {
  const [state, setState] = useState({ blobUrl: null, error: null });

  useEffect(() => {
    if (!url) {
      setState({ blobUrl: null, error: null });
      return;
    }

    let cancelled = false;
    let objectUrl = null;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setState({ blobUrl: objectUrl, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ blobUrl: null, error: err });
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return state;
}
