import React from 'react';
import { Box, VStack, Heading, Button } from '@chakra-ui/react';

interface HomeProps {
  onStartDetection: () => void;
}

declare global {
  interface Window {
    electronAPI: {
      captureScreen: () => Promise<Electron.DesktopCapturerSource[]>;
      resizeAndPositionWindow: () => Promise<void>;
    }
  }
}

const Home: React.FC<HomeProps> = ({ onStartDetection }) => {
  const handleResizeAndPosition = async () => {
    await window.electronAPI.resizeAndPositionWindow();
  };

  return (
    <Box p={8}>
      <VStack spacing={6}>
        <Heading>Welcome to Alto AI</Heading>
        <Button onClick={onStartDetection} colorScheme="blue">
          start
        </Button>
        <Button onClick={handleResizeAndPosition} colorScheme="green">
          test resize
        </Button>
      </VStack>
    </Box>
  );
};

export default Home;