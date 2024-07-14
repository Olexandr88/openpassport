import React from 'react';
import { YStack, Button, Image, Text } from 'tamagui';
import { Camera, SquarePen } from '@tamagui/lucide-icons';
import { bgColor, borderColor, textColor1, textColor2 } from '../utils/colors';
import SCANHelp from '../images/scan_help.png'
import { startCameraScan } from '../utils/cameraScanner';

interface CameraScreenProps {
  sheetIsOpen: boolean
  setSheetIsOpen: (value: boolean) => void
}

const CameraScreen: React.FC<CameraScreenProps> = ({ sheetIsOpen, setSheetIsOpen }) => {

  return (
    <YStack f={1} p="$3">
      <YStack f={1} jc="center">
        <Image borderRadius="$5"
          w="full"
          h="$13"
          source={{ uri: SCANHelp }}
        />
        <YStack gap="$0.5" mt="$3.5">
          <Text mt="$1" color={textColor1}>Use your camera to scan the main page of your passport.</Text>
          <Text fontSize="$2" color={textColor2} mt="$2">You can also enter those data manually.</Text>
          <Text fontSize="$2" style={{ fontStyle: 'italic' }} color={textColor2}>The app does not take a picture of your passport, it only reads some fields.</Text>
        </YStack>

      </YStack>

      <YStack gap="$2" mb="$6">
        <Button borderWidth={1.3} borderColor={borderColor} borderRadius="$10" bg="#3185FC" onPress={startCameraScan}><Camera color={textColor1} /></Button>
        <Button bg={textColor2} borderColor={borderColor} borderRadius="$10" onPress={() => setSheetIsOpen(true)}><SquarePen /></Button>
      </YStack>

    </YStack >
  );
};

export default CameraScreen;
