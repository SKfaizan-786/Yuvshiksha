import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ParallaxProvider } from 'react-scroll-parallax';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <GoogleOAuthProvider clientId="929059757750-6v3iphehhd1vg3lgjlk0h4t9o63aufdf.apps.googleusercontent.com">
        <ParallaxProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ParallaxProvider>
      </GoogleOAuthProvider>
    </React.StrictMode>
  );
} else {
  console.error("No root element found in index.html");
}
