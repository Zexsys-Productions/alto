import './index.css';
import './fonts.css';

import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import WakeWordDetector from './components/WakeWordDetector';
import Home from './components/Home';
import SkillBoostHome from './components/train/SkillBoostHome';
import CreateVMCourse from './components/train/course/CreateVMCourse';

const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: 'transparent',
      },
    },
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
});

const App = () => {
  const [currentView, setCurrentView] = useState<'home' | 'wakeWordDetector' | 'skillBoost' | 'course'>('home');
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <Home 
            onStartDetection={() => setCurrentView('wakeWordDetector')} 
            onNavigateToSkillBoost={() => setCurrentView('skillBoost')}
          />
        );
      case 'wakeWordDetector':
        return <WakeWordDetector />;
      case 'skillBoost':
        return (
          <SkillBoostHome 
            onBack={() => setCurrentView('home')} 
            onStartCourse={(courseId) => {
              setCurrentCourseId(courseId);
              setCurrentView('course');
            }}
          />
        );
      case 'course':
        if (currentCourseId === '1') {
          return <CreateVMCourse onBack={() => setCurrentView('skillBoost')} onQuit={() => setCurrentView('skillBoost')}/>;
        }
        // Add more course components
        return null;
    }
  };

  return (
    <ChakraProvider theme={theme}>
      {renderView()}
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