import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Silence harmless Chrome extension message channel errors in the console
const isExtensionError = (err: any): boolean => {
  if (!err) return false;
  const errMsg = typeof err === 'string' ? err : err.message || err.stack || '';
  if (typeof errMsg !== 'string') return false;
  return (
    errMsg.includes('A listener indicated an asynchronous response') ||
    errMsg.includes('message channel closed') ||
    errMsg.includes('extension')
  );
};

window.addEventListener('unhandledrejection', (event) => {
  if (isExtensionError(event.reason) || isExtensionError(event.detail)) {
    event.preventDefault();
    event.stopPropagation();
  }
});

window.addEventListener('error', (event) => {
  if (isExtensionError(event.error) || isExtensionError(event.message)) {
    event.preventDefault();
    event.stopPropagation();
  }
});


if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		if (import.meta.env.PROD) {
			navigator.serviceWorker.register('/sw.js').catch((error) => {
				console.error('Service worker registration failed:', error);
			});
			return;
		}

		// Avoid stale dev bundles (old Router/meta behavior) served by a prior service worker.
		void navigator.serviceWorker.getRegistrations().then((registrations) => {
			registrations.forEach((registration) => {
				void registration.unregister();
			});
		});

		if ('caches' in window) {
			void caches.keys().then((keys) => {
				keys.forEach((key) => {
					void caches.delete(key);
				});
			});
		}
	});
}

createRoot(document.getElementById("root")!).render(<App />);
