import { useEffect } from 'react';
import Router from './router';
import { useThemeStore } from './store/theme.store';

export default function App() {
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);
  return <Router />;
}