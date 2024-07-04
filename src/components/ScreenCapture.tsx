import React, { useState } from 'react';
import { uploadScreenshot } from '../utils/api';

declare global {
  interface Window {
    electronAPI: {
      captureScreen: () => Promise<Electron.DesktopCapturerSource[]>;
    };
  }
}

const ScreenCapture: React.FC = () => {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const captureScreen = async () => {
    try {
      const sources = await window.electronAPI.captureScreen();
      const source = sources[0]; // Assuming we want the first screen

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
      video.onloadedmetadata = () => {
        video.play();
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        setScreenshot(dataUrl);
        stream.getTracks().forEach(track => track.stop());

        // Upload the screenshot
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], 'screenshot.png', { type: 'image/png' });
            try {
              const url = await uploadScreenshot(file);
              setUploadedUrl(url);
            } catch (error) {
              console.error('Error uploading screenshot:', error);
            }
          }
        }, 'image/png');
      };
    } catch (error) {
      console.error('Error capturing screen:', error);
    }
  };

  return (
    <div>
      <button onClick={captureScreen}>Capture Screen</button>
      {screenshot && <img src={screenshot} alt="Screenshot" style={{ maxWidth: '100%' }} />}
      {uploadedUrl && <p>Uploaded screenshot URL: <a href={uploadedUrl} target="_blank" rel="noopener noreferrer">{uploadedUrl}</a></p>}
    </div>
  );
};

export default ScreenCapture;