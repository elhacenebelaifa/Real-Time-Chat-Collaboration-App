import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => { } });

const STORAGE_KEY = 'theme';

function getInitialTheme() {
    if (typeof window === 'undefined') return 'light';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }
    return 'light';
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light');

    useEffect(() => {
        setTheme(getInitialTheme());
    }, []);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.documentElement.dataset.theme = theme;
        try {
            window.localStorage.setItem(STORAGE_KEY, theme);
        } catch { }
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
