import React, { useEffect, useState, useRef } from 'react';
import { usePorcupine } from "@picovoice/porcupine-react";
import ppnBase64 from '../pico/ppn_base64';
import porcupineModelBase64 from '../pico/porcupine_model_base64';
import AudioRecorder from './AudioRecorder';


const WakeWordDetector: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<{ chunks: Array<{ text: string, timestamp: number[] }>, text: string } | null>(null);

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
      console.log('Porcupine loaded. Starting wake word detection...');
      start();
    }
  }, [isLoaded, isListening]);

  useEffect(() => {
    if (keywordDetection !== null && keywordDetection.label === "hey_alto") {
      console.log('Wake word "Hey Alto" detected!');
      startAudio.current.play().catch(error => console.error("Error playing audio:", error));
      setIsRecording(true);
    }
  }, [keywordDetection]);

  const handleStopRecording = (transcription: { chunks: Array<{ text: string, timestamp: number[] }>, text: string }) => {
    console.log('Recording stopped. Transcription:', transcription);
    setIsRecording(false);
    setTranscription(transcription);
  };

  useEffect(() => {
    console.log('Recording state changed:', isRecording ? 'Started' : 'Stopped');
  }, [isRecording]);

  if (error) {
    console.error('Porcupine error:', error);
  }

  return (
    <div>
      <AudioRecorder isRecording={isRecording} onStopRecording={handleStopRecording} />
      {transcription && (
        <div>
          <h3>Transcription:</h3>
          <p>{transcription.text}</p>
        </div>
      )}
    </div>
  );
};

export default WakeWordDetector;
