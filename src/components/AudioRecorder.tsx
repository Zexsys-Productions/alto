import React, { useState, useRef, useEffect } from 'react';
import { uploadAudio, uploadScreenshot } from '../utils/api';
import { playAudioFromBase64 } from '../utils/audio';

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

interface AudioRecorderProps {
  isRecording: boolean;
  onStopRecording: (transcription: { chunks: Array<{ text: string, timestamp: number[] }>, text: string }, screenshotUrl: string, claudeResponse: string) => void;
  onRecordingStopped: () => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ isRecording, onStopRecording, onRecordingStopped }) => {
  const [transcription, setTranscription] = useState<{ chunks: Array<{ text: string, timestamp: number[] }>, text: string } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startSound = new Audio('https://storage.googleapis.com/alto-serv/start.wav');
  const endSound = new Audio('https://storage.googleapis.com/alto-serv/load.wav');
  const audioLevelIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isRecording]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (audioLevelIntervalRef.current) {
          clearInterval(audioLevelIntervalRef.current);
        }
      } else {
        if (isRecording) {
          startAudioLevelCheck();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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

  const checkAudioLevel = () => {
    if (analyserRef.current) {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
      if (average > 10) {
        resetSilenceTimeout();
      }
    }
  };

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

      startAudioLevelCheck();

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

  const startAudioLevelCheck = () => {
    if (audioLevelIntervalRef.current) {
      clearInterval(audioLevelIntervalRef.current);
    }
    audioLevelIntervalRef.current = setInterval(checkAudioLevel, 100); // Check every 100ms
  };

  const captureScreenshot = async () => {
    try {
      const sources = await window.electronAPI.captureScreen();
      const source = sources[0];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id,
            minWidth: 1280,
            maxWidth: 1280,
            minHeight: 720,
            maxHeight: 720
          }
        } as MediaTrackConstraints
      });

      const video = document.createElement('video');
      video.srcObject = stream;
      await new Promise(resolve => video.onloadedmetadata = resolve);
      video.play();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      stream.getTracks().forEach(track => track.stop());

      return new Promise<string>((resolve) => {
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], 'screenshot.png', { type: 'image/png' });
            try {
              const url = await uploadScreenshot(file);
              resolve(url);
            } catch (error) {
              console.error('Error uploading screenshot:', error);
              resolve('');
            }
          } else {
            resolve('');
          }
        }, 'image/png');
      });
    } catch (error) {
      console.error('Error capturing screen:', error);
      return '';
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
      onRecordingStopped();
      
      const screenshotUrl = await captureScreenshot();
      
      try {
        const result = await uploadAudio(audioBlob, screenshotUrl);
        setTranscription(result.transcription);
        
        // Get TTS audio for Claude's response
        const ttsResponse = await fetch('https://alto-prod.axesys.xyz/text-to-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: result.claudeResponse }),
        });
        
        if (!ttsResponse.ok) {
          throw new Error(`HTTP error! status: ${ttsResponse.status}`);
        }
        
        const ttsData = await ttsResponse.json();
        
        if (!ttsData.audioContent) {
          throw new Error('No audio content received from TTS service');
        }
        
        // Play the TTS audio
        await playAudioFromBase64(ttsData.audioContent);
        
        onStopRecording(result.transcription, screenshotUrl, result.claudeResponse);
      } catch (error) {
        console.error('Error uploading audio or getting TTS:', error);
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