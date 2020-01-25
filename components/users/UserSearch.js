import { useState } from 'react';
import { api } from '../../lib/api';
import styles from '../../styles/Chat.module.css';

export default function UserSearch({ onStartDM }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (value) => {
    setQuery(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await api.get(`/users/search?q=${encodeURIComponent(value)}`);
      setResults(data.users || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (userId) => {
    onStartDM(userId);
    setQuery('');
    setResults([]);
  };

  return (
    <div className={styles.searchBox}>
      <input
        className={styles.searchInput}
        type="text"
        placeholder="Search users to chat..."
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
      />
      {results.length > 0 && (
        <div className={styles.searchResults}>
          {results.map((user) => (
            <div
              key={user._id}
              className={styles.searchResultItem}
              onClick={() => handleSelect(user._id)}
            >
              <div className={styles.onlineDot} />
              <span>{user.displayName || user.username}</span>
              <span style={{ color: '#666', marginLeft: 'auto', fontSize: '0.75rem' }}>
                @{user.username}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
