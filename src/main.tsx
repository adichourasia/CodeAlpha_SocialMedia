import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

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
