import React from 'react';
import { Box, VStack, Heading, Text, Button, SimpleGrid, Card, CardHeader, CardBody, CardFooter, Flex, Image } from '@chakra-ui/react';
import HomeIcon from '../../assets/svg/home.svg';
import courses from '../../data/courses.json';
import StartIcon from '../../assets/svg/start.svg';
import DurationIcon from '../../assets/svg/duration.svg';
import buttonSound from '../../assets/audio/button.mp3';
const buttonAudio = new Audio(buttonSound);

interface Course {
  id: string;
  title: string;
  description: string;
  duration: string;
}

interface SkillBoostHomeProps {
  onBack: () => void;
  onStartCourse: (courseId: string) => void;
}

const SkillBoostHome: React.FC<SkillBoostHomeProps> = ({ onBack, onStartCourse }) => {
  return (
    <Box p={8} width="100%" height="100%">
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <VStack align="start" spacing={1}>
          <Heading>Skill Boost GCP</Heading>
          <Text>Tingkatkan keterampilan IT Anda dengan kursus pilihan kami.</Text>
        </VStack>
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
              onClick={() => {
                buttonAudio.play();
                onBack();
              }}
            />
          </Box>
          <Text fontSize="xs">BERANDA</Text>
        </VStack>
      </Flex>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} width="100%">
        {courses.map((course) => (
          <Card key={course.id} boxShadow="0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)">
            <Flex>
              <Box flex="1" p={4}>
                <CardHeader p={0} mb={2}>
                  <Heading size="md">{course.title}</Heading>
                </CardHeader>
                <CardBody p={0}>
                  <Text>{course.description}</Text>
                  <Flex alignItems="center" mt={2}>
                    <Image src={DurationIcon} boxSize="16px" mr={1} />
                    <Text fontWeight="bold">{course.duration}</Text>
                  </Flex>
                </CardBody>
              </Box>
              <Flex
                direction="column"
                alignItems="center"
                justifyContent="center"
                bg="blue.500"
                color="white"
                p={4}
                width="120px"
                cursor="pointer"
                onClick={() => {
                  buttonAudio.play();
                  onStartCourse(course.id);
                }}
                _hover={{ bg: "blue.600" }}
                borderRadius="md"
                my={2}
                mr={2}
              >
                <Image src={StartIcon} boxSize="24px" mb={2} />
                <Text fontWeight="bold">Mulai</Text>
              </Flex>
            </Flex>
          </Card>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default SkillBoostHome;