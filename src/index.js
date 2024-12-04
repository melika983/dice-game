import React from 'react';
import ReactDOM from 'react-dom/client'; // برای React 18

import App from './App';  // کامپوننت اصلی

const root = ReactDOM.createRoot(document.getElementById('root')); // استفاده از createRoot
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
