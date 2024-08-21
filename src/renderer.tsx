import './index.css';

import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import WakeWordDetector from './components/WakeWordDetector';
import Home from './components/Home';

const App = () => {
  const [showHome, setShowHome] = useState(true);

  return (
    <ChakraProvider>
      {showHome ? (
        <Home onStartDetection={() => setShowHome(false)} />
      ) : (
        <WakeWordDetector />
      )}
    </ChakraProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('👋 This message is being logged by "renderer.tsx", included via webpack');