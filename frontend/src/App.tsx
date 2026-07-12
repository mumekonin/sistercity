import Router from './router';
import { useThemeStore } from './store/theme.store';

export default function App() {
  const { isDark } = useThemeStore();

  return (
    <div className={isDark ? 'dark' : ''}>
      <Router />
    </div>
  );
}