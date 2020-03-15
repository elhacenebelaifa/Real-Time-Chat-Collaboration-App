import { useContext } from 'react';
import { PopupWindowsContext } from '../context/PopupWindowsContext';

export function usePopupWindows() {
  const ctx = useContext(PopupWindowsContext);
  if (!ctx) {
    throw new Error('usePopupWindows must be used within a PopupWindowsProvider');
  }
  return ctx;
}
