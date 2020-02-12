import { useState } from 'react';
import { api } from '../../lib/api';
import Avatar from '../shared/Avatar';
import Icon from '../shared/Icon';
import styles from '../../styles/Chat.module.css';

export default function UserSearch({ onStartDM }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = async (value) => {
    setQuery(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }
    try {
      const data = await api.get(`/users/search?q=${encodeURIComponent(value)}`);
      setResults(data.users || []);
    } catch {
      setResults([]);
    }
  };

  const handleSelect = (userId) => {
    onStartDM(userId);
    setQuery('');
    setResults([]);
  };

  return (
    <div className={styles.userSearchBox}>
      <div className={styles.searchBox}>
        <Icon name="search" color="#64748b" />
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search conversations, messages…"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <kbd className={`${styles.kbd} ${styles.mono}`}>⌘K</kbd>
      </div>
      {results.length > 0 && (
        <div className={styles.searchResults}>
          {results.map((user) => (
            <div
              key={user._id}
              className={styles.searchResultItem}
              onClick={() => handleSelect(user._id)}
            >
              <Avatar user={user} size={24} showDot online={user.online} />
              <span style={{ fontWeight: 600 }}>{user.displayName || user.username}</span>
              <span style={{ color: '#64748b', marginLeft: 'auto', fontSize: 11 }}>
                @{user.username}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
