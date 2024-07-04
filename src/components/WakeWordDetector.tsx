import React, { useEffect, useState } from 'react';
import { usePorcupine } from "@picovoice/porcupine-react";
import ppnBase64 from '../pico/ppn_base64';
import porcupineModelBase64 from '../pico/porcupine_model_base64';

const WakeWordDetector: React.FC = () => {
  const [showPopup, setShowPopup] = useState(false);

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

  useEffect(() => {
    init(
      "o2ZhLM7RW+Gn2IKGcwBN1mzHfcpY0CoutOF/b2JIfSNYH/ek5u0CCg==",
      porcupineKeyword,
      porcupineModel
    );
  }, []);

  useEffect(() => {
    if (isLoaded && !isListening) {
      start();
    }
  }, [isLoaded, isListening]);

  useEffect(() => {
    if (keywordDetection !== null && keywordDetection.label === "hey_alto") {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 3000); // Hide popup after 3 seconds
    }
  }, [keywordDetection]);

  if (error) {
    console.error('Porcupine error:', error);
  }

  return (
    <div>
      {showPopup && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          zIndex: 1000
        }}>
          Hey Alto detected!
        </div>
      )}
    </div>
  );
};

export default WakeWordDetector;