import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Corrected the import path for the App component. The original path './App' pointed to an empty file, which is not a valid module. The path now points to the correct component inside the 'src' directory.
import App from './src/App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);