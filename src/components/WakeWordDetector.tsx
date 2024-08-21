import React, { useEffect, useState, useRef } from 'react';
import { usePorcupine } from "@picovoice/porcupine-react";
import ppnBase64 from '../pico/ppn_base64';
import porcupineModelBase64 from '../pico/porcupine_model_base64';
import AudioRecorder from './AudioRecorder';
import { Alert, AlertIcon, AlertTitle, AlertDescription, Box, Card, CardHeader, CardBody, VStack, Text, Heading, Image, Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton, Spinner } from '@chakra-ui/react';
import axios from 'axios';
import { getOrCreateUUID } from '../utils/api';

const API_BASE_URL = 'https://alto-prod.axesys.xyz'; 

const WakeWordDetector: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [claudeResponse, setClaudeResponse] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{
    role: string;
    content: Array<{ type: string; text?: string; source?: { type: string; media_type: string; data: string } }> | string;
  }>>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const {
    keywordDetection,
    isLoaded,
    isListening,
    error,
    init,
    start,
    stop,
    release,
  } = usePorcupine();

  const porcupineKeyword = { 
    base64: ppnBase64,
    label: "hey_alto"
  }
  const porcupineModel = { base64: porcupineModelBase64 }

  const startAudio = useRef(new Audio('https://storage.googleapis.com/alto-serv/start.wav'));

  useEffect(() => {
    startAudio.current.load();
  }, []);

  useEffect(() => {
    const primeAudio = () => {
      startAudio.current.play().then(() => {
        startAudio.current.pause();
        startAudio.current.currentTime = 0;
      }).catch(error => console.error("Error priming audio:", error));
      document.removeEventListener('click', primeAudio);
    };

    document.addEventListener('click', primeAudio);

    return () => {
      document.removeEventListener('click', primeAudio);
    };
  }, []);

  useEffect(() => {
    console.log('Initializing Porcupine...');
    init(
      "o2ZhLM7RW+Gn2IKGcwBN1mzHfcpY0CoutOF/b2JIfSNYH/ek5u0CCg==",
      porcupineKeyword,
      porcupineModel
    );
  }, []);

  useEffect(() => {
    if (isLoaded && !isListening) {
      console.log('Model loaded. Starting wake word detection...');
      start();
    }
  }, [isLoaded, isListening]);

  useEffect(() => {
    if (keywordDetection !== null && keywordDetection.label === "hey_alto" && !isThinking) {
      console.log('Wake word "Hey Alto" detected!');
      startAudio.current.play().catch(error => console.error("Error playing audio:", error));
      setIsRecording(true);
      setShowAlert(true);
      setShowConversation(false);
    }
  }, [keywordDetection]);

  useEffect(() => {
    if (isThinking) {
      console.log('Stopping wake word detection while thinking...');
      stop();
    }
  }, [isThinking, stop]);

  const handleStopRecording = (transcription: { chunks: Array<{ text: string, timestamp: number[] }>, text: string }, screenshotUrl: string, claudeResponse: string) => {
    console.log('Recording stopped. Transcription:', transcription);
    console.log('Screenshot URL:', screenshotUrl);
    console.log('Claude Response:', claudeResponse);
    setIsRecording(false);
    setTranscription(transcription.text);
    setClaudeResponse(claudeResponse);
    setShowConversation(true);
    setIsThinking(false);
    
    // Add a slight delay before resuming wake word detection
    setTimeout(() => {
      console.log('Resuming wake word detection after delay...');
      start();
    }, 1000); // 1 second delay

    setConversationHistory((prevHistory: typeof conversationHistory) => [
      ...prevHistory,
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: transcription.text
          },
          {
            type: 'image',
            source: {
              type: 'url',
              media_type: 'image/png',
              data: screenshotUrl
            }
          }
        ]
      },
      {
        role: 'assistant',
        content: claudeResponse
      }
    ]);
  };

  const handleRecordingStopped = () => {
    setShowAlert(false);
    setIsThinking(true);
  };

  useEffect(() => {
    console.log('Recording state changed:', isRecording ? 'Started' : 'Stopped');
  }, [isRecording]);

  if (error) {
    console.error('Porcupine error:', error);
  }

  const fetchConversationHistory = async () => {
    try {
      const uuid = await getOrCreateUUID();
      const response = await axios.get(`${API_BASE_URL}/get-conversation-history/${uuid}`);
      setConversationHistory(response.data.history);
    } catch (error) {
      console.error('Error fetching conversation history:', error);
    }
  };

  const deleteConversationHistory = async () => {
    try {
      const uuid = await getOrCreateUUID();
      await axios.delete(`${API_BASE_URL}/delete-conversation-history/${uuid}`);
      setConversationHistory([]);
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting conversation history:', error);
    }
  };

  useEffect(() => {
    fetchConversationHistory();
  }, []);

  return (
    <div>
      {showAlert && (
        <Alert
          status='info'
          variant='subtle'
          flexDirection='column'
          alignItems='center'
          justifyContent='center'
          textAlign='center'
          height='200px'
          width='100%'
          position='fixed'
          top='50%'
          left='50%'
          transform='translate(-50%, -50%)'
          zIndex={9999}
        >
          <AlertIcon boxSize='40px' mr={0} />
          <AlertTitle mt={4} mb={1} fontSize='lg'>
            Recording Started
          </AlertTitle>
          <AlertDescription maxWidth='sm'>
            Please say your request now. Your screen will be captured when you hear the second chime as recording stops.
          </AlertDescription>
        </Alert>
      )}
      <AudioRecorder isRecording={isRecording} onStopRecording={handleStopRecording} onRecordingStopped={handleRecordingStopped} />
      {conversationHistory.map((entry: {
        role: string;
        content: Array<{ type: string; text?: string; source?: { type: string; media_type: string; data: string } }> | string;
      }, index: number) => (
        <Card key={index} variant="elevated" maxW="md" mx="auto" mt={6}>
          <CardHeader>
            <Heading size="md">{entry.role === 'user' ? 'You' : 'Alto'}</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              {Array.isArray(entry.content) ? (
                entry.content.map((item: { type: string; text?: string; source?: { type: string; media_type: string; data: string } }, itemIndex: number) => (
                  <Box key={itemIndex}>
                    {item.type === 'text' && (
                      <Text bg={entry.role === 'user' ? "gray.100" : "blue.50"} p={3} borderRadius="md">
                        {item.text}
                      </Text>
                    )}
                    {item.type === 'image' && item.source && (
                      <Image 
                        src={item.source.type === 'url' ? item.source.data : `data:${item.source.media_type};base64,${item.source.data}`}
                        alt="Conversation Image" 
                        maxW="100%" 
                        borderRadius="md" 
                      />
                    )}
                  </Box>
                ))
              ) : (
                <Text bg={entry.role === 'user' ? "gray.100" : "blue.50"} p={3} borderRadius="md">
                  {entry.content}
                </Text>
              )}
            </VStack>
          </CardBody>
        </Card>
      ))}
      <Button colorScheme="red" onClick={() => setIsDeleteModalOpen(true)} mt={4}>
        Delete Conversation History
      </Button>
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to delete the entire conversation history?
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="red" mr={3} onClick={deleteConversationHistory}>
              Delete
            </Button>
            <Button variant="ghost" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Modal isOpen={isThinking} onClose={() => {}} isCentered closeOnOverlayClick={false} closeOnEsc={false}>
        <ModalOverlay />
        <ModalContent>
          <ModalBody>
            <VStack spacing={4} align="center" justify="center" height="150px">
              <Spinner size="xl" />
              <Text fontSize="lg" fontWeight="bold">Alto is thinking...</Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default WakeWordDetector;