import React from 'react';
import { Box, VStack, Heading, Button, Text, Image, Flex } from '@chakra-ui/react';
import SkillBoostHome from './train/SkillBoostHome';

//icons stuff
import CloudIcon from '../assets/svg/cloud.svg';
import AspectRatioIcon from '../assets/svg/aspect_ratio.svg';
import ExitIcon from '../assets/svg/exit.svg';

interface HomeProps {
  onStartDetection: () => void;
  onNavigateToSkillBoost: () => void;
}

declare global {
  interface Window {
    electronAPI: {
      captureScreen: () => Promise<Electron.DesktopCapturerSource[]>;
      resizeAndPositionWindow: () => Promise<void>;
      closeApp: () => void;
      openExternal: (url: string) => void;
    }
  }
}

const Home: React.FC<HomeProps> = ({ onStartDetection, onNavigateToSkillBoost }) => {
  const handleResizeAndPosition = async () => {
    await window.electronAPI.resizeAndPositionWindow();
  };

  const handleNavigateToSkillBoost = async () => {
    await handleResizeAndPosition();
    onNavigateToSkillBoost();
  };

  return (
    <Box 
      p={8} 
      pt={10}  
      minHeight="100vh"
      width="100%"
      display="flex" 
      flexDirection="column" 
      justifyContent="space-between"  
      alignItems="center" 
      borderRadius="lg"
      bg="rgba(240, 240, 240, 0.3)"  
      boxShadow="0 8px 32px 0 rgba(31, 38, 135, 0.37)"
      backdropFilter="blur(4px)"
      position="relative"
    >
      <VStack spacing={2} align="center" width="100%" maxWidth="300px">
        <Heading textAlign="center" fontSize="5xl" mb={0.2}>Alto AI</Heading>
        <Text textAlign="center" fontSize="md">Mempelajari cara menggunakan GCP <Image src={CloudIcon} display="inline-block" width="18px" height="18px" verticalAlign="text-bottom" ml="2px" /></Text>
      </VStack>
      <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)">
        <Button onClick={handleNavigateToSkillBoost} colorScheme="blue" marginTop={10} size="lg" height="50px" width="300px">
        🗯️ Mulai
        </Button>
      </Box>
      <Flex position="absolute" bottom="16px" width="100%" justifyContent="space-between" px={8}>
        <Button 
          onClick={() => window.electronAPI.closeApp()}
          bg="rgba(220, 38, 38, 0.8)"
          color="white"
          size="sm" 
          height="35px"
          width="80px"
          fontSize="xs"
          _hover={{ bg: "rgba(220, 38, 38, 1)" }}
        >
          <Image src={ExitIcon} display="inline-block" width="13px" height="13px" mr="5px" />  Keluar
        </Button>
      </Flex>
    </Box>
  );
};

export default Home;