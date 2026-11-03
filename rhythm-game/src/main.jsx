import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// Altura real del viewport (las barras del navegador móvil cambian 100vh)
const setAppHeight = () => document.documentElement.style.setProperty('--app-h', `${window.innerHeight}px`);
setAppHeight();
window.addEventListener('resize', setAppHeight);
window.addEventListener('orientationchange', setAppHeight);

createRoot(document.getElementById('root')).render(<App />);
