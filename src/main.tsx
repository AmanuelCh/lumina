import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Open all external links in the OS default browser instead of the webview
document.addEventListener('click', async (e) => {
  const target = (e.target as HTMLElement).closest('a');
  if (!target) return;
  const href = target.getAttribute('href');
  if (!href || !href.startsWith('http')) return;
  e.preventDefault();
  try {
    const { open } = await import('@tauri-apps/plugin-shell');
    await open(href);
  } catch {
    window.open(href, '_blank');
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
