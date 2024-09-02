import React, { useState, useEffect } from 'react';
import { Box, VStack, Heading, Text, Button, useToast, Flex, Image } from '@chakra-ui/react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import HomeIcon from '../../../assets/svg/home.svg';
import ArrowBackIcon from '../../../assets/svg/arrow_back.svg';
import CheckIcon from '../../../assets/svg/check.svg';
import TaskIcon from '../../../assets/svg/task.svg';

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

interface Step {
  title: string;
  content: string;
  task: string;
  requirement: string;
}

const steps: Step[] = [
  {
    title: "Siapkan proyek GCP Anda",
    content: `
1. Buka Google Cloud Console dan [buat proyek baru](https://console.cloud.google.com/projectcreate)
2. Masukkan nama proyek dalam kolom "**Project name**": \`MyFirstProject\`
3. Pilih akun pembayaran aktif yang akan digunakan dalam kolom "**Billing account**". Jika anda belum memiliki akun pembayaran, buatlah terlebih dahulu di [sini](https://console.cloud.google.com/billing/create).
4. Klik "**Create**"
    `,
    task: "Buat proyek GCP baru bernama 'MyFirstProject'.",
    requirement: "The screenshot should show the GCP Console with a project named 'MyFirstProject' selected or created. Look for the project name in the top bar or in the project information panel."
  },
  {
    title: "Navigasi ke Compute Engine",
    content: `
1. Di Cloud Console, buka menu Navigasi (≡)
2. Scroll ke bawah dan cari "**Compute Engine**"
3. Klik "**Compute Engine**"
4. Jika anda belum pernah mengakses Compute Engine sebelumnya, akan muncul setelan untuk mengaktifkan Compute Engine API. Klik "**Enable**". Setelah aktif, ulang kembali ke instruksi yang pertama.
5. Pilih "**VM Instances**" dari submenu di sebelah kiri layar.
    `,
    task: "Navigasi ke bagian Compute Engine di GCP Console.",
    requirement: "The screenshot should display the Compute Engine dashboard or VM instances page. Look for 'Compute Engine' in the page title or navigation menu."
  },
  {
    title: "Buat instance VM baru",
    content: `
1. Di halaman VM instances, klik tombol "**Create Instance**"
2. Isi detail instance:
   - Name: \`my-first-instance\`
    
3. Biarkan pengaturan lain default
4. Klik "**Create**" di bagian bawah halaman
5. Anda akan dibawa ke halaman **VM instances**
    `,
    task: "Buatlah sebuah mesin virtual baru dengan nama 'my-first-instance'.",
    requirement: "The screenshot should show the 'Create an instance' page. Look for headers or titles regarding Machine configuration, name of instance, region of instance, etc."
  },
  // Tambahkan langkah-langkah lain
  {
    title: "Masuk ke dalam VM",
    content: `
1. Di halaman VM instances, tunggu sampai bagian kolom **status** dari VM Anda ada lambang Success (✅)
2. Jika sudah ada lambang Success (✅), itu berarti instance Anda berhasil dibuat
3. Klik "**SSH**" pada kolom "Connect" untuk masuk ke dalam VM Anda
    `,
    task: "Masuk ke dalam mesin virtual Anda melalui SSH.",
    requirement: "The screenshot should show a browser window with the title SSH-in-browser. Look for some sort of window containing a linux terminal."
  }, 
];

interface CreateVMCourseProps {
  onBack: () => void;
}

const captureScreenshot = async (): Promise<File> => {
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

    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'screenshot.png', { type: 'image/png' });
          resolve(file);
        }
      }, 'image/png');
    });
  } catch (error) {
    console.error('Error capturing screen:', error);
    throw error;
  }
};

const CreateVMCourse: React.FC<CreateVMCourseProps> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const toast = useToast();

  const checkTaskCompletion = async () => {
    console.log(`Starting task completion check for step ${currentStep + 1}: ${steps[currentStep].title}`);
    setIsChecking(true);
    try {
      console.log('Capturing screenshot...');
      const screenshot = await captureScreenshot();
      console.log(`Screenshot captured successfully. Size: ${screenshot.size} bytes`);

      const formData = new FormData();
      formData.append('file', screenshot, 'screenshot.png');
      formData.append('request', JSON.stringify({
        message: steps[currentStep].task,
        requirement: steps[currentStep].requirement
      }));

      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      console.log('Sending request to check task completion...');
      const response = await axios.post('https://alto-prod.axesys.xyz/check', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Received response from task completion check:', response.data);

      if (response.data.response.toLowerCase().includes('true')) {
        console.log('Task completed successfully');
        toast({
          title: "Tugas Selesai",
          description: "Bagus sekali! Beralih ke tugas berikutnya.",
          status: "success",
          duration: 1000,
          isClosable: true,
        });
        nextStep();
      } else {
        console.log('Task not completed');
        toast({
          title: "Tugas Belum Selesai",
          description: "Silakan coba lagi untuk menyelesaikan tugas.",
          status: "warning",
          duration: 1000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error checking task completion:', error);
      if (axios.isAxiosError(error) && error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
      toast({
        title: "Kesalahan",
        description: "Gagal memeriksa penyelesaian tugas. Silakan coba lagi.",
        status: "error",
        duration: 1000,
        isClosable: true,
      });
    } finally {
      setIsChecking(false);
      console.log('Task completion check finished');
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Box p={8} pt={4}>
      <VStack spacing={8} align="stretch">
        <Flex justifyContent="space-between" alignItems="center" mb={4}>
          <Heading>Membuat Mesin Virtual</Heading>
          <VStack alignItems="center" spacing={1}>
            <Box
              borderWidth="2px"
              borderColor="black"
              borderRadius="full"
              p={0.5}
            >
              <Image
                src={HomeIcon}
                boxSize="40px"
                bg="gray.100"
                p={2}
                borderRadius="full"
                cursor="pointer"
                onClick={onBack}
              />
            </Box>
            <Text fontSize="xs">KEMBALI</Text>
          </VStack>
        </Flex>
        <Box position="relative">
          <Flex 
            position="absolute" 
            top="-40px" 
            left="0" 
            right="0" 
            alignItems="center" 
            zIndex="1"
          >
            <Text fontWeight="bold" mr={4}>
              {currentStep + 1}/{steps.length}
            </Text>
            <Box flex="1" height="4px" bg="gray.500" borderRadius="full">
              <Box 
                height="100%" 
                width={`${((currentStep + 1) / steps.length) * 100}%`} 
                bg="blue.500" 
                borderRadius="full"
              />
            </Box>
          </Flex>
          <Box 
            borderWidth={1} 
            borderRadius="lg" 
            p={6}
            pb={4}
            bg="white" 
            boxShadow="0 10px 30px -5px rgba(0, 0, 0, 0.3), 0 5px 15px -3px rgba(0, 0, 0, 0.2)"
          >
            <VStack align="stretch" spacing={4}>
              <Heading size="md">{steps[currentStep].title}</Heading>
              <Box pl={4}>
                <ReactMarkdown
                  className="markdown-content"
                  components={{
                    a: ({ node, ...props }) => (
                      <a
                        {...props}
                        onClick={(e) => {
                          e.preventDefault();
                          if (window.electronAPI && window.electronAPI.openExternal) {
                            window.electronAPI.openExternal(props.href);
                          } else {
                            window.open(props.href, '_blank', 'noopener,noreferrer');
                          }
                        }}
                        style={{ color: '#3182ce', textDecoration: 'underline', cursor: 'pointer' }}
                      />
                    ),
                  }}
                >
                  {steps[currentStep].content}
                </ReactMarkdown>
              </Box>
              <Flex alignItems="center">
                <Image src={TaskIcon} boxSize="24px" mr={2} />
                <Text fontWeight="bold">Tugas: {steps[currentStep].task}</Text>
              </Flex>
            </VStack>
          </Box>
        </Box>
        <Flex justifyContent="space-between" mt={2}>
          {currentStep > 0 && (
            <Button 
              onClick={prevStep} 
              disabled={isChecking}
              colorScheme="gray"
              leftIcon={<Image src={ArrowBackIcon} boxSize="20px" />}
            >
              Kembali
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button 
              onClick={checkTaskCompletion} 
              isLoading={isChecking} 
              loadingText="Memeriksa..."
              colorScheme="blue"
              leftIcon={<Image src={CheckIcon} boxSize="20px" />}
              ml="auto"
              flexGrow={1}
            >
              Periksa tugas
            </Button>
          )}
        </Flex>
      </VStack>
    </Box>
  );
};

export default CreateVMCourse;
