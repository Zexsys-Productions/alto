import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import ScreenCapture from './components/ScreenCapture';
import WakeWordDetector from './components/WakeWordDetector';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <ScreenCapture />
    <WakeWordDetector />
  </React.StrictMode>
);

console.log('👋 This message is being logged by "renderer.tsx", included via webpack');
