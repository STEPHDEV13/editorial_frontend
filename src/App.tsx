import { useState, useEffect } from 'react';
import Router from './app/router';
import SplashScreen from './components/common/SplashScreen';

const SPLASH_DURATION_MS = 1800;

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), SPLASH_DURATION_MS);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <SplashScreen />;
  return <Router />;
}
