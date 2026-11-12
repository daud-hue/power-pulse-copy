import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Restore saved theme before first paint
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
  document.documentElement.classList.add('light');
}

// Restore saved accent color before first paint
const savedAccent = localStorage.getItem('accentColor');
if (savedAccent && savedAccent !== 'lime') {
  document.documentElement.classList.add(`theme-${savedAccent}`);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)