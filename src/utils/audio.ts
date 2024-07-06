export const playAudioFromBase64 = async (base64Audio: string): Promise<void> => {
    const audioContext = new (window.AudioContext || window.AudioContext)();
    const arrayBuffer = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0)).buffer;
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
  };