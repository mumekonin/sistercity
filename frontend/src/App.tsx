import { useEffect } from 'react';
import Router from './router';
import { useThemeStore } from './store/theme.store';

export default function App() {
  const { isDark } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);
  return <Router />;
}