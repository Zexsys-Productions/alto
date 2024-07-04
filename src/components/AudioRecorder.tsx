import React, { useState, useRef, useEffect } from 'react';
import { uploadAudio } from '../utils/api';

interface AudioRecorderProps {
  isRecording: boolean;
  onStopRecording: (transcription: { chunks: Array<{ text: string, timestamp: number[] }>, text: string }) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ isRecording, onStopRecording }) => {
  const [transcription, setTranscription] = useState<{ chunks: Array<{ text: string, timestamp: number[] }>, text: string } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startSound = new Audio('https://storage.googleapis.com/alto-serv/start.wav');
  const endSound = new Audio('https://storage.googleapis.com/alto-serv/load.wav');

  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [isRecording]);

  useEffect(() => {
    const primeAudio = () => {
      startSound.play().then(() => {
        startSound.pause();
        startSound.currentTime = 0;
      }).catch(error => console.error("Error priming start sound:", error));

      endSound.play().then(() => {
        endSound.pause();
        endSound.currentTime = 0;
      }).catch(error => console.error("Error priming end sound:", error));

      document.removeEventListener('click', primeAudio);
    };

    document.addEventListener('click', primeAudio);

    return () => {
      document.removeEventListener('click', primeAudio);
    };
  }, []);

  const startRecording = async () => {
    try {
      console.log('Starting audio recording...');
      await startSound.play();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      analyserRef.current.fftSize = 2048;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
          if (average > 10) {
            resetSilenceTimeout();
          }
        }
        requestAnimationFrame(checkAudioLevel);
      };

      checkAudioLevel();

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
        console.log('Audio data received, chunk size:', event.data.size, 'bytes');
      };

      mediaRecorderRef.current.start(1000);
      console.log('MediaRecorder started');
      resetSilenceTimeout();
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('Stopping audio recording...');
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      await endSound.play();
      
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      console.log('Audio recording stopped, total size:', audioBlob.size, 'bytes');
      
      try {
        const result = await uploadAudio(audioBlob);
        setTranscription(result.transcription);
        onStopRecording(result.transcription);
      } catch (error) {
        console.error('Error uploading audio:', error);
      }
    }
  };

  const resetSilenceTimeout = () => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    silenceTimeoutRef.current = setTimeout(async () => {
      console.log('Silence detected for 2.5 seconds, stopping recording...');
      await endSound.play();
      stopRecording();
    }, 2500);
  };

  return <div></div>;
};

export default AudioRecorder;
