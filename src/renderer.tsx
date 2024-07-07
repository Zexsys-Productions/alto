import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider } from '@chakra-ui/react';
import WakeWordDetector from './components/WakeWordDetector';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <ChakraProvider>
      <WakeWordDetector />
    </ChakraProvider>
  </React.StrictMode>
);

console.log('👋 This message is being logged by "renderer.tsx", included via webpack');
