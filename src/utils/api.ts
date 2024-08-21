import axios from 'axios';

const API_BASE_URL = 'https://alto-prod.axesys.xyz';  

export async function getOrCreateUUID(): Promise<string> {
  const storedUUID = localStorage.getItem('clientUUID');
  if (storedUUID) {
    return storedUUID;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/generate-uuid`);
    const newUUID = response.data.uuid;
    localStorage.setItem('clientUUID', newUUID);
    return newUUID;
  } catch (error) {
    console.error('Error generating UUID:', error);
    throw error;
  }
}

export async function uploadScreenshot(file: File): Promise<string> {
  const uuid = await getOrCreateUUID();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('client_uuid', uuid);

  try {
    const response = await axios.post(`${API_BASE_URL}/upload-screenshot`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params: {
        client_uuid: uuid
      }
    });
    return response.data.url;
  } catch (error) {
    console.error('Error uploading screenshot:', error);
    throw error;
  }
}

export async function uploadAudio(audioBlob: Blob, screenshotUrl: string): Promise<{ transcription: { chunks: Array<{ text: string, timestamp: number[] }>, text: string }, claudeResponse: string }> {
  const uuid = await getOrCreateUUID();
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');
  formData.append('client_uuid', uuid);
  formData.append('screenshot_url', screenshotUrl);

  try {
    const response = await axios.post(`${API_BASE_URL}/upload-audio`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params: {
        client_uuid: uuid
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading audio:', error);
    throw error;
  }
}