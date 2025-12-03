import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

console.log("App initializing...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Could not find root element");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log("App mounted successfully");
} catch (e) {
  console.error("Error mounting React app:", e);
}