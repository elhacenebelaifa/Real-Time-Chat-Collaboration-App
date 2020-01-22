import { useState, useEffect, useCallback, useRef } from 'react';
import {
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  deriveSharedKey,
  encryptMessage,
  decryptMessage,
  saveKeyToStore,
  getKeyFromStore,
  exportPrivateKey,
  importPrivateKey,
} from '../lib/crypto';
import { api } from '../lib/api';

export function useEncryption(user) {
  const [ready, setReady] = useState(false);
  const keyPairRef = useRef(null);
  const sharedKeysRef = useRef({}); // cache: { [otherUserId]: CryptoKey }

  // Initialize or load key pair
  useEffect(() => {
    if (!user) return;

    async function init() {
      try {
        // Try to load existing private key from IndexedDB
        const storedPrivateKey = await getKeyFromStore(`privateKey:${user._id}`);
        const storedPublicKey = await getKeyFromStore(`publicKey:${user._id}`);

        if (storedPrivateKey && storedPublicKey) {
          keyPairRef.current = {
            privateKey: await importPrivateKey(storedPrivateKey),
            publicKey: await importPublicKey(storedPublicKey),
          };
        } else {
          // Generate new key pair
          const keyPair = await generateKeyPair();
          const exportedPublic = await exportPublicKey(keyPair.publicKey);
          const exportedPrivate = await exportPrivateKey(keyPair.privateKey);

          // Store in IndexedDB
          await saveKeyToStore(`privateKey:${user._id}`, exportedPrivate);
          await saveKeyToStore(`publicKey:${user._id}`, exportedPublic);

          keyPairRef.current = keyPair;

          // Upload public key to server if not already set
          if (!user.publicKey) {
            try {
              await api.put(`/users/${user._id}/publicKey`, { publicKey: exportedPublic });
            } catch {
              // Non-critical - key can be uploaded later
            }
          }
        }

        setReady(true);
      } catch (err) {
        console.error('Encryption init failed:', err);
        setReady(false);
      }
    }

    init();
  }, [user]);

  // Derive shared key for DM with another user
  const getSharedKey = useCallback(async (otherUserId) => {
    if (sharedKeysRef.current[otherUserId]) {
      return sharedKeysRef.current[otherUserId];
    }

    if (!keyPairRef.current) throw new Error('Key pair not initialized');

    // Fetch other user's public key
    const { user: otherUser } = await api.get(`/users/${otherUserId}`);
    if (!otherUser.publicKey) throw new Error('Other user has no public key');

    const otherPublicKey = await importPublicKey(otherUser.publicKey);
    const sharedKey = await deriveSharedKey(keyPairRef.current.privateKey, otherPublicKey);

    sharedKeysRef.current[otherUserId] = sharedKey;
    return sharedKey;
  }, []);

  const encrypt = useCallback(async (plaintext, otherUserId) => {
    const key = await getSharedKey(otherUserId);
    return encryptMessage(plaintext, key);
  }, [getSharedKey]);

  const decrypt = useCallback(async (ciphertext, iv, otherUserId) => {
    const key = await getSharedKey(otherUserId);
    return decryptMessage(ciphertext, iv, key);
  }, [getSharedKey]);

  return { ready, encrypt, decrypt, getSharedKey };
}
