import React, { useState, useEffect } from 'react';
import { NativeEventEmitter, NativeModules, Linking, Modal, Platform, Pressable } from 'react-native';
import { YStack, XStack, Text, Button, Tabs, Sheet, Label, Fieldset, Input, Switch, H2, Image, useWindowDimensions, H4, H3, View, Separator } from 'tamagui'
import { HelpCircle, IterationCw, VenetianMask, Cog, CheckCircle2, ChevronLeft, Share, Eraser, ArrowRight, UserPlus, CalendarSearch, X } from '@tamagui/lucide-icons';
import Telegram from '../images/telegram.png'
import Github from '../images/github.png'
import Internet from "../images/internet.png"
import Dialog from "react-native-dialog";
// import ressources
import Xlogo from '../images/x.png'
import NFC_IMAGE from '../images/nfc.png'
import { ToastViewport } from '@tamagui/toast';
import { ToastMessage } from '../components/ToastMessage';
// import stores
import useUserStore from '../stores/userStore';
import useNavigationStore from '../stores/navigationStore';
// import utils
import { bgColor, bgGreen, bgWhite, blueColorLight, borderColor, componentBgColor, componentBgColor2, separatorColor, textBlack, textColor1, textColor2 } from '../utils/colors';
import { ModalProofSteps } from '../utils/utils';
import { scan } from '../utils/nfcScanner';
import { CircuitName, fetchZkey } from '../utils/zkeyDownload';
import { contribute } from '../utils/contribute';
// import screens
import ProveScreen from './ProveScreen';
import NfcScreen from './NfcScreen';
import CameraScreen from './CameraScreen';
import NextScreen from './NextScreen';
import RegisterScreen from './RegisterScreen';
import AppScreen from './AppScreen';
// import constants
import { RPC_URL, SignatureAlgorithm } from '../../../common/src/constants/constants';
import { mock_csca_sha256_rsa_4096, mock_dsc_sha256_rsa_4096 } from '../../../common/src/constants/mockCertificates';
import DatePicker from 'react-native-date-picker'
import StartScreen from './StartScreen';
import CustomButton from '../components/CustomButton';
import StepOneStepTwo from '../components/StepOneStepTwo';
import SplashScreen from './SplashScreen';
import ValidProofScreen from './ValidProofScreen';
import WrongProofScreen from './WrongProofScreen';
import MockDataScreen from './MockDataScreen';

const emitter = (Platform.OS === 'android')
  ? new NativeEventEmitter(NativeModules.nativeModule)
  : null

const MainScreen: React.FC = () => {
  const [scanningMessage, setScanningMessage] = useState('');
  const [displayOtherOptions, setDisplayOtherOptions] = useState(false);
  const [SettingsIsOpen, setSettingsIsOpen] = useState(false);
  const [DialogContributeIsOpen, setDialogContributeIsOpen] = useState(false);
  const [dialogDeleteSecretIsOpen, setDialogDeleteSecretIsOpen] = useState(false);
  const [HelpIsOpen, setHelpIsOpen] = useState(false);
  const [sheetIsOpen, setSheetIsOpen] = useState(false);
  const [sheetAppListOpen, setSheetAppListOpen] = useState(false);
  const [sheetRegisterIsOpen, setSheetRegisterIsOpen] = useState(false);
  const [modalProofStep, setModalProofStep] = useState(0);
  const [dateOfBirthDatePicker, setDateOfBirthDatePicker] = useState<Date | null>(null)
  const [dateOfExpiryDatePicker, setDateOfExpiryDatePicker] = useState<Date | null>(null)
  const [dateOfBirthDatePickerIsOpen, setDateOfBirthDatePickerIsOpen] = useState(false)
  const [dateOfExpiryDatePickerIsOpen, setDateOfExpiryDatePickerIsOpen] = useState(false)
  const [isFormComplete, setIsFormComplete] = useState(false);

  const {
    passportNumber,
    dateOfBirth,
    dateOfExpiry,
    deleteMrzFields,
    update,
    clearPassportDataFromStorage,
    clearSecretFromStorage,
    clearProofsFromStorage,
    passportData,
    registered,
    setRegistered,
    cscaProof,
    localProof,
  } = useUserStore()

  const {
    showWarningModal,
    update: updateNavigationStore,
    selectedTab,
    setSelectedTab,
    hideData,
    toast,
    showRegistrationErrorSheet,
    registrationErrorMessage,
    nfcSheetIsOpen,
    setNfcSheetIsOpen,
  } = useNavigationStore();

  const handleRestart = () => {
    setSelectedTab("start");
    deleteMrzFields();
  }
  const handleHideData = () => {
    updateNavigationStore({
      hideData: !hideData,
    })
  }

  const castDate = (date: Date) => {
    return (date.toISOString().slice(2, 4) + date.toISOString().slice(5, 7) + date.toISOString().slice(8, 10)).toString();
  }

  const handleNFCScan = () => {
    if ((Platform.OS === 'ios')) {
      console.log('ios');
      scan(setModalProofStep);
    }
    else {
      console.log('android :)');
      scan(setModalProofStep);
    }
  }

  function handleContribute() {
    contribute(passportData);
    setDialogContributeIsOpen(false);
  }

  function handleDeleteSecret() {
    clearSecretFromStorage()
    setDialogDeleteSecretIsOpen(false);
  }

  useEffect(() => {
    const handleNativeEvent = (event: string) => {
      setScanningMessage(event);
    };

    if (Platform.OS === 'android' && emitter) {
      const subscription = emitter.addListener('NativeEvent', handleNativeEvent);

      return () => {
        subscription.remove();
      };
    }
  }, []);

  // useEffect(() => {
  //   if (cscaProof && (modalProofStep === ModalProofSteps.MODAL_SERVER_SUCCESS)) {
  //     console.log('CSCA Proof received:', cscaProof);
  //     if ((cscaProof !== null) && (localProof !== null)) {
  //       const sendTransaction = async () => {
  //         const sigAlgFormatted = formatSigAlgNameForCircuit(passportData.signatureAlgorithm, passportData.pubKey.exponent);
  //         const sigAlgIndex = SignatureAlgorithm[sigAlgFormatted as keyof typeof SignatureAlgorithm]
  //         console.log("local proof already generated, sending transaction");
  //         const provider = new ethers.JsonRpcProvider(RPC_URL);
  //         const serverResponse = await sendRegisterTransaction(localProof, cscaProof, sigAlgIndex)
  //         const txHash = serverResponse?.data.hash;
  //         const receipt = await provider.waitForTransaction(txHash);
  //         console.log('receipt status:', receipt?.status);
  //         if (receipt?.status === 0) {
  //           throw new Error("Transaction failed");
  //         }
  //         setRegistered(true);
  //         setSelectedTab("app");
  //         setStep(Steps.REGISTERED);
  //         toast.show('✅', {
  //           message: "Registered",
  //           customData: {
  //             type: "success",
  //           },
  //         })
  //       }
  //       sendTransaction();
  //     }

  //   }
  // }, [modalProofStep]);


  useEffect(() => {
    setIsFormComplete(passportNumber?.length >= 3 && dateOfBirth?.length >= 6 && dateOfExpiry?.length >= 6);
  }, [passportNumber, dateOfBirth, dateOfExpiry]);


  const { height } = useWindowDimensions();

  return (
    <YStack f={1}>
      <ToastViewport portalToRoot flexDirection="column-reverse" top={85} right={0} left={0} />
      <ToastMessage />
      <YStack f={1} mt={Platform.OS === 'ios' ? "$8" : "$0"} mb={Platform.OS === 'ios' ? "$4" : "$2"}>
        <YStack >
          <StepOneStepTwo variable={selectedTab} step1="scan" step2="nfc" />
          {selectedTab !== ("app") && selectedTab !== ("splash") && <XStack onPress={() => setSelectedTab("app")} px="$4" py="$2" mt="$3" alignSelf='flex-end'><X size={28} color={textBlack} /></XStack>}
          {selectedTab === "app" &&
            <XStack px="$4" py="$2" mt="$0" ai="center">
              <Text fontSize="$9"  >OpenPassport</Text>
              <XStack f={1} />

              <XStack onPress={() => setHelpIsOpen(true)}><HelpCircle size={28} color={textBlack} /></XStack>
              <XStack p="$2" onPress={() => setSettingsIsOpen(true)}><Cog size={24} color={textBlack} /></XStack>
            </XStack>
          }

          {/* {selectedTab !== "start" && selectedTab !== "scan" && selectedTab !== "nfc" && selectedTab !== "next" && selectedTab !== "register" && (
            <YStack>
              <XStack jc="space-between" ai="center" px="$3">
                <Button p="$2" py="$3" unstyled onPress={decrementStep}><ChevronLeft color={(selectedTab === "start") ? "transparent" : "#a0a0a0"} /></Button>

                <Text fontSize="$6" color="#a0a0a0">
                  {selectedTab === "scan" ? "Scan" : (selectedTab === "app" ? "Apps" : "Prove")}
                </Text>
                <XStack>
                  <Button p="$2" py="$3" unstyled onPress={() => setSettingsIsOpen(true)}><Cog color="#a0a0a0" /></Button>
                  <Button p="$2" py="$3" unstyled onPress={() => setHelpIsOpen(true)}><HelpCircle color="#a0a0a0" /></Button>
                </XStack>
              </XStack>
              <Separator borderColor={separatorColor} />
            </YStack>
          )} */}
          <Sheet open={nfcSheetIsOpen} onOpenChange={setNfcSheetIsOpen} dismissOnSnapToBottom modal dismissOnOverlayPress={false} disableDrag animation="medium" snapPoints={[35]}>
            <Sheet.Overlay />
            <Sheet.Frame>

              <YStack gap="$5" f={1} pt="$3">
                <View>
                  <H2 textAlign='center'>Ready to scan</H2>
                  <Text textAlign='center'>{scanningMessage}</Text>
                </View>

                {selectedTab === "next" ?
                  <CheckCircle2
                    size="$8"
                    alignSelf='center'
                    color="#3185FC"
                    animation="quick"
                  /> :
                  <Image
                    h="$8"
                    w="$8"
                    alignSelf='center'
                    borderRadius={1000}
                    source={{
                      uri: NFC_IMAGE
                    }}
                  />
                }
                <Text textAlign='center'>Hold your device near the NFC tag and stop moving when it vibrates.</Text>
              </YStack>
            </Sheet.Frame>
          </Sheet>

          <Sheet open={SettingsIsOpen} onOpenChange={setSettingsIsOpen} dismissOnSnapToBottom modal animation="medium" snapPoints={[88]}>
            <Sheet.Overlay />
            <Sheet.Frame bg={bgWhite} borderTopLeftRadius="$9" borderTopRightRadius="$9" pt="$2" pb="$3" >
              <YStack p="$3" pb="$5" f={1} gap={height > 750 ? "$3" : "$1"} mb="$1.5">
                <XStack gap="$2" ml="$2" >
                  <H2 color={textBlack}>Settings</H2>
                  <Cog color={textBlack} mt="$1" alignSelf='center' size="$2" />
                </XStack>

                <Fieldset gap="$4" mt="$1" horizontal>
                  <Label color={textBlack} width={200} justifyContent="flex-end" htmlFor="restart">
                    Contribute
                  </Label>
                  <Button bg="white" jc="center" borderColor={borderColor} borderWidth={1.2} size="$3.5" ml="$2" onPress={() => setDialogContributeIsOpen(true)}>
                    <Share color={textBlack} />
                  </Button>
                </Fieldset>
                <Fieldset horizontal>
                  <Label color={textBlack} width={225} justifyContent="flex-end" htmlFor="restart" >
                    Private mode
                  </Label>
                  <Switch size="$3.5" checked={hideData} onCheckedChange={handleHideData}>
                    <Switch.Thumb animation="bouncy" bc={bgColor} />
                  </Switch>
                </Fieldset>

                <Fieldset horizontal>
                  <Label color={textBlack} width={225} justifyContent="flex-end" htmlFor="restart" >
                    Display other options
                  </Label>
                  <Switch size="$3.5" checked={displayOtherOptions} onCheckedChange={() => setDisplayOtherOptions(!displayOtherOptions)}>
                    <Switch.Thumb animation="bouncy" bc={bgColor} />
                  </Switch>
                </Fieldset>

                <Dialog.Container visible={DialogContributeIsOpen}>
                  <Dialog.Title>Contribute</Dialog.Title>
                  <Dialog.Description>
                    By pressing yes, you accept sending your passport data.
                    Passport data are encrypted and will be deleted once the signature algorithm is implemented.
                  </Dialog.Description>
                  <Dialog.Button onPress={() => setDialogContributeIsOpen(false)} label="Cancel" />
                  <Dialog.Button onPress={() => handleContribute()} label="Contribute" />
                </Dialog.Container>

                <Dialog.Container visible={dialogDeleteSecretIsOpen}>
                  <Dialog.Title>Delete Secret</Dialog.Title>
                  <Dialog.Description>
                    You are about to delete your secret. Be careful! You will not be able to recover your identity.
                  </Dialog.Description>
                  <Dialog.Button onPress={() => setDialogDeleteSecretIsOpen(false)} label="Cancel" />
                  <Dialog.Button onPress={() => handleDeleteSecret()} label="Delete secret" />
                </Dialog.Container>

                {displayOtherOptions && (
                  <>
                    <XStack my="$3" alignSelf='center' h={2} w="80%" bg={componentBgColor} borderRadius={100} />
                    <Fieldset gap="$4" horizontal>
                      <Label color={textBlack} width={200} justifyContent="flex-end" htmlFor="restart">
                        Restart to step 1
                      </Label>
                      <Button bg="white" jc="center" borderColor={borderColor} borderWidth={1.2} size="$3.5" ml="$2" onPress={handleRestart}>
                        <IterationCw color={textBlack} />
                      </Button>
                    </Fieldset>

                    <Fieldset gap="$4" mt="$1" horizontal>
                      <Label color={textBlack} width={200} justifyContent="flex-end" htmlFor="skip" >
                        Delete passport data
                      </Label>
                      <Button bg="white" jc="center" borderColor={borderColor} borderWidth={1.2} size="$3.5" ml="$2" onPress={clearPassportDataFromStorage}>
                        <Eraser color={textBlack} />
                      </Button>
                    </Fieldset>

                    <Fieldset gap="$4" mt="$1" horizontal>
                      <Label color={textBlack} width={200} justifyContent="flex-end" htmlFor="skip" >
                        Delete proofs
                      </Label>
                      <Button bg="white" jc="center" borderColor={borderColor} borderWidth={1.2} size="$3.5" ml="$2" onPress={clearProofsFromStorage}>
                        <Eraser color={textBlack} />
                      </Button>
                    </Fieldset>

                    <Fieldset gap="$4" mt="$1" horizontal>
                      <Label color={textBlack} width={200} justifyContent="flex-end" htmlFor="skip" >
                        Delete secret (caution)
                      </Label>
                      <Button bg="white" jc="center" borderColor={borderColor} borderWidth={1.2} size="$3.5" ml="$2" onPress={() => setDialogDeleteSecretIsOpen(true)}>
                        <Eraser color={textColor2} />
                      </Button>
                    </Fieldset>
                    <Fieldset gap="$4" mt="$1" horizontal>
                      <Label color={textBlack} width={200} justifyContent="flex-end" htmlFor="skip" >
                        go to register
                      </Label>
                      <Button bg="white" jc="center" borderColor={borderColor} borderWidth={1.2} size="$3.5" ml="$2" onPress={() => setSelectedTab('register')}>
                        <ArrowRight color={textColor2} />
                      </Button>
                    </Fieldset>
                    <Fieldset gap="$4" mt="$1" horizontal>
                      <Label color={textBlack} width={200} justifyContent="flex-end" htmlFor="skip" >
                        registered = (!registered)
                      </Label>
                      <Button bg="white" jc="center" borderColor={borderColor} borderWidth={1.2} size="$3.5" ml="$2" onPress={() => setRegistered(!registered)}>
                        <UserPlus color={textColor2} />
                      </Button>
                    </Fieldset>



                  </>
                )}

                <YStack flex={1} />

                <YStack mb="$0">
                  {/* <Button p="$2.5" borderRadius="$3" bg={componentBgColor} jc="center" borderColor={borderColor} borderWidth={1.2} onPress={() => setSettingsIsOpen(false)} w="80%" alignSelf='center'>
                    <Text color={textBlack}textAlign='center' fow="bold">Close</Text>
                  </Button> */}
                </YStack>
              </YStack>

            </Sheet.Frame>
          </Sheet>

          <Sheet open={HelpIsOpen} onOpenChange={setHelpIsOpen} dismissOnSnapToBottom modal animation="medium" snapPoints={[76]}>
            <Sheet.Overlay />
            <Sheet.Frame bg={bgWhite} borderTopLeftRadius="$9" borderTopRightRadius="$9" pt="$2" pb="$3">
              <YStack p="$4" f={1} gap="$3">

                <XStack>
                  <Text fontSize="$8" mb="$2">Help 💁</Text>
                  <XStack f={1} />
                  <XStack onPress={() => setHelpIsOpen(false)} p="$2">
                    <X color={borderColor} size="$1.5" mr="$2" />
                  </XStack>
                </XStack>
                <Separator borderColor={separatorColor} />



                <YStack flex={1} jc="space-between">
                  {/* <YStack >
                    <H3 color={textBlack}>Security and Privacy</H3>
                    <Text color={textBlack} ml="$2" mt="$1">OpenPassport uses zero-knowledge cryptography to allow you to prove facts about yourself like humanity, nationality or age without disclosing sensitive information.</Text>
                  </YStack>
                  <YStack >
                    <H3 color={textBlack}>About ZK Proofs</H3>
                    <Text color={textBlack} ml="$2" mt="$1">Zero-knowledge proofs rely on mathematical magic tricks to show the validity of some computation without revealing of all its inputs. In our case, the proof shows the passport has not been forged, but allows you to hide sensitive data.</Text>
                  </YStack> */}
                  <YStack gap="$1">
                    <H3 color={textBlack}>FAQ</H3>
                    <YStack ml="$1">
                      <H4 color={textBlack}>My passport is not supported</H4>
                      <Text color={textBlack} ml="$2">Please contact us on Telegram, or if you have programming skills, you can easily <Text onPress={() => Linking.openURL('https://t.me/openpassport')} color={blueColorLight} style={{ textDecorationLine: 'underline', fontStyle: 'italic' }}>contribute</Text> to the project by adding your signature algorithm.</Text>
                    </YStack>
                  </YStack>



                </YStack>
                <XStack justifyContent="center" mb="$2" gap="$5" mt="$8">
                  <Pressable onPress={() => Linking.openURL('https://openpassport.app')}>
                    <Image
                      source={{ uri: Internet, width: 24, height: 24 }}
                    />
                  </Pressable>
                  <Pressable onPress={() => Linking.openURL('https://t.me/openpassport')}>
                    <Image
                      source={{ uri: Telegram, width: 24, height: 24 }}
                    />
                  </Pressable>
                  <Pressable onPress={() => Linking.openURL('https://x.com/openpassportapp')}>
                    <Image
                      source={{ uri: Xlogo, width: 24, height: 24 }}
                    />
                  </Pressable>
                  <Pressable onPress={() => Linking.openURL('https://github.com/zk-passport/proof-of-passport')}>
                    <Image
                      tintColor={textBlack}
                      source={{ uri: Github, width: 24, height: 24 }}
                    />
                  </Pressable>
                </XStack>

              </YStack>
            </Sheet.Frame>
          </Sheet>

          <Sheet open={sheetIsOpen} onOpenChange={setSheetIsOpen} dismissOnSnapToBottom modal animation="medium" snapPoints={[44]} moveOnKeyboardChange>
            <Sheet.Overlay />
            <Sheet.Frame bg={bgWhite} borderTopLeftRadius="$9" borderTopRightRadius="$9" pt="$2" pb="$3">
              <YStack p="$4" f={1} gap="$3">
                <XStack>
                  <Text fontSize="$8" mb="$">Manual input ✍️</Text>
                  <XStack f={1} />
                  <XStack onPress={() => setSheetIsOpen(false)} p="$2">
                    <X color={borderColor} size="$1.5" mr="$2" />
                  </XStack>
                </XStack>
                <Separator borderColor={separatorColor} />
                <Fieldset gap="$4" horizontal mt="$2">
                  <Text color={textBlack} width={160} justifyContent="flex-end" fontSize="$5">
                    Passport Number
                  </Text>
                  <Input
                    bg={bgWhite}
                    color={textBlack}
                    h="$3.5"
                    borderColor={passportNumber?.length >= 3 ? bgGreen : textBlack}
                    flex={1}
                    id="passportnumber"
                    onChangeText={(text) => {
                      update({ passportNumber: text.toUpperCase() })
                    }}
                    value={passportNumber}
                    keyboardType="default"
                  />
                </Fieldset>


                <Fieldset gap="$4" horizontal>
                  <Text color={textBlack} width={160} justifyContent="flex-end" fontSize="$5">
                    Date of birth
                  </Text>
                  <Text color={textBlack} f={1}>
                    {dateOfBirthDatePicker ? dateOfBirthDatePicker.toISOString().slice(0, 10) : ''}
                  </Text>
                  <Button bg={bgGreen} onPress={() => setDateOfBirthDatePickerIsOpen(true)}
                    borderRadius={"$10"}
                  >
                    <CalendarSearch />
                  </Button>
                  <DatePicker
                    modal
                    mode='date'
                    open={dateOfBirthDatePickerIsOpen}
                    date={dateOfBirthDatePicker || new Date()}
                    onConfirm={(date) => {
                      setDateOfBirthDatePickerIsOpen(false)
                      setDateOfBirthDatePicker(date)
                      update({ dateOfBirth: castDate(date) })
                    }}
                    onCancel={() => {
                      setDateOfBirthDatePickerIsOpen(false)
                    }}
                  />
                </Fieldset>
                <Fieldset gap="$4" horizontal>
                  <Text color={textBlack} width={160} justifyContent="flex-end" fontSize="$5">
                    Date of expiry
                  </Text>
                  <Text color={textBlack} f={1}>
                    {dateOfExpiryDatePicker ? dateOfExpiryDatePicker.toISOString().slice(0, 10) : ''}
                  </Text>
                  <Button bg={bgGreen} onPress={() => setDateOfExpiryDatePickerIsOpen(true)}
                    borderRadius="$10"
                  >
                    <CalendarSearch />
                  </Button>
                  <DatePicker
                    modal
                    mode='date'
                    open={dateOfExpiryDatePickerIsOpen}
                    date={dateOfExpiryDatePicker || new Date()}
                    onConfirm={(date) => {
                      setDateOfExpiryDatePickerIsOpen(false)
                      setDateOfExpiryDatePicker(date)
                      update({ dateOfExpiry: castDate(date) })
                    }}
                    onCancel={() => {
                      setDateOfExpiryDatePickerIsOpen(false)
                    }}
                  />
                </Fieldset>
                <XStack f={1} />
                <YStack gap="$2">
                  <CustomButton
                    text="Submit"
                    onPress={() => {
                      setSelectedTab("nfc");
                      setSheetIsOpen(false);
                    }}
                    bgColor={isFormComplete ? bgGreen : separatorColor}
                    isDisabled={!isFormComplete}
                    disabledOnPress={() => toast.show('✍️', {
                      message: "Please fill in all fields.",
                      customData: {
                        type: "info",
                      },
                    })}
                  />
                </YStack>

              </YStack>
            </Sheet.Frame>
          </Sheet>

          <Sheet open={sheetAppListOpen} onOpenChange={setSheetAppListOpen} dismissOnSnapToBottom modal animation="medium" snapPoints={[35]}>
            <Sheet.Overlay />
            <Sheet.Frame bg={bgWhite} borderTopLeftRadius="$9" borderTopRightRadius="$9" pt="$2" mb="$3">
              <YStack p="$4" f={1} gap="$3">
                <XStack>
                  <Text fontSize="$8" mb="$2">Applications</Text>
                  <XStack f={1} />
                  <XStack onPress={() => setSheetAppListOpen(false)} p="$2">
                    <X color={borderColor} size="$1.5" mr="$2" />
                  </XStack>
                </XStack>
                <Separator borderColor={separatorColor} />

                <XStack f={1} />
                <YStack gap="$2">
                  <CustomButton
                    text="Zupass"
                    onPress={() => toast.show('😖', {
                      message: "Work in progress",
                      customData: {
                        type: "info",
                      },
                    })}
                  />
                  <CustomButton
                    text="Gitcoin passport"
                    onPress={() => toast.show('😖', {
                      message: "Work in progress",
                      customData: {
                        type: "info",
                      },
                    })}
                  />
                  <CustomButton
                    text="SBT"
                    onPress={() => toast.show('😖', {
                      message: "Work in progress",
                      customData: {
                        type: "info",
                      },
                    })}
                  />
                </YStack>
                <XStack f={1} />

              </YStack>
            </Sheet.Frame>
          </Sheet>

          <Sheet open={sheetRegisterIsOpen} onOpenChange={setSheetRegisterIsOpen} dismissOnSnapToBottom modal animation="medium" snapPoints={[35]}>
            <Sheet.Overlay />
            <Sheet.Frame bg={bgWhite} borderTopLeftRadius="$9" borderTopRightRadius="$9" pt="$2" >
              <YStack p="$4" f={1} gap="$3">
                <XStack>
                  <Text fontSize="$8" mb="$2">👋 Scan your passport</Text>
                  <XStack f={1} />
                  <XStack onPress={() => setSheetRegisterIsOpen(false)} p="$2">
                    <X color={borderColor} size="$1.5" mr="$2" />
                  </XStack>
                </XStack>
                <Separator borderColor={separatorColor} />
                <YStack gap="$2">
                  <Text fontSize="$7" color={textBlack}>Scan your passport to start using OpenPassport.</Text>
                  <Text fontSize="$6" style={{ opacity: 0.7 }} color={textBlack}>You can also generate a mock passport inside the app to test it.</Text>
                  {/* <Text fontSize="$6" onPress={() => Linking.openURL('https://zk-passport.github.io/posts/how-to-scan-your-passport-using-nfc/')} color={blueColorLight} style={{ textDecorationLine: 'underline', fontStyle: 'italic' }}>Learn more.</Text> */}
                </YStack>

                <XStack f={1} />
                <CustomButton
                  text="Let's start"
                  Icon={<ArrowRight color={textBlack} />}
                  onPress={() => {
                    setSheetRegisterIsOpen(false);
                    setSelectedTab("scan");

                  }}
                />
                <XStack f={1} />

              </YStack>
            </Sheet.Frame>
          </Sheet>

          <Sheet
            open={showRegistrationErrorSheet}
            onOpenChange={(open: boolean) => {
              updateNavigationStore({
                showRegistrationErrorSheet: open
              })
            }}
            dismissOnSnapToBottom modal animation="medium" snapPoints={[80]}
          >
            <Sheet.Overlay />
            <Sheet.Frame bg={bgWhite} borderRadius="$9" pt="$2">
              <YStack p="$4" f={1} gap="$3" pb="$6">
                <YStack jc="flex-start" >
                  <Text fontSize="$9" textAlign='left' mb="$2" color={textBlack}>Sorry, an error has occurred</Text>
                </YStack>

                <Text fontSize="$7">Error details:</Text>
                <Text fontSize="$6" mb="$2" textAlign="center" color="#a0a0a0">{registrationErrorMessage} </Text>

                <Separator borderColor={separatorColor} />
                <Text mt="$4" fontSize="$6" mb="$4" color={textBlack}>Unfortunately, your passport is currently not supported.</Text>

                <Text fontSize="$6" mb="$4" color={textBlack}>To help us add support for it, please consider contributing its data!</Text>
                <XStack f={1} />
                <CustomButton
                  text="Contribute"
                  onPress={() => setDialogContributeIsOpen(true)}
                  Icon={<Share />}
                />
              </YStack>
            </Sheet.Frame>
          </Sheet>

        </YStack>

        <Tabs f={1} orientation="horizontal" flexDirection="column" defaultValue={"splash"}
          value={selectedTab}
          onValueChange={(value) => updateNavigationStore({ selectedTab: value })}
        >
          <Tabs.Content value="splash" f={1}>
            <SplashScreen
            />
          </Tabs.Content>
          <Tabs.Content value="start" f={1}>
            <StartScreen
            />
          </Tabs.Content>
          <Tabs.Content value="mock" f={1}>
            <MockDataScreen />
          </Tabs.Content>
          <Tabs.Content value="scan" f={1}>
            <CameraScreen
              setSheetIsOpen={setSheetIsOpen}
            />
          </Tabs.Content>
          <Tabs.Content value="nfc" f={1}>
            <NfcScreen
              handleNFCScan={handleNFCScan}
            />
          </Tabs.Content>
          <Tabs.Content value="next" f={1}>
            <NextScreen />
          </Tabs.Content>
          <Tabs.Content value="register" f={1}>
            <RegisterScreen />
          </Tabs.Content>
          <Tabs.Content value="app" f={1}>
            <AppScreen
              setSheetAppListOpen={setSheetAppListOpen}
              setSheetRegisterIsOpen={setSheetRegisterIsOpen}
            />
          </Tabs.Content>
          <Tabs.Content value="prove" f={1}>
            <ProveScreen
              setSheetRegisterIsOpen={setSheetRegisterIsOpen}
            />
          </Tabs.Content>
          <Tabs.Content value="valid" f={1}>
            <ValidProofScreen />
          </Tabs.Content>
          <Tabs.Content value="wrong" f={1}>
            <WrongProofScreen />
          </Tabs.Content>
        </Tabs>

      </YStack>
      <Sheet
        open={showWarningModal.show}
        modal
        onOpenChange={(isOpen: boolean) => {
          if (!isOpen) {
            // download if user closes sheet
            fetchZkey(showWarningModal.circuit as CircuitName);
            updateNavigationStore({
              showWarningModal: {
                show: false,
                circuit: '',
                size: 0,
              }
            });
          }
        }}
        animation="medium"
        snapPoints={[88]}
      >
        <Sheet.Overlay />
        <Sheet.Frame bg="white" borderTopLeftRadius="$9" borderTopRightRadius="$9" pt="$2" pb="$3">
          <YStack p="$3" pb="$5" f={1} gap="$3" ai="center" jc="center">
            <Text fontWeight="bold" fontSize={18} color="black">👋 Hi</Text>
            <Text mt="$2" textAlign="center" fontSize={18} color="black">
              The app needs to download a large file ({(showWarningModal.size / 1024 / 1024).toFixed(2)}MB). Please make sure you're connected to a Wi-Fi network before continuing.
            </Text>
            <XStack mt="$4">
              <Button
                bg="black"
                borderRadius="$3"
                padding="$2.5"
                onPress={() => {
                  fetchZkey(showWarningModal.circuit as CircuitName);
                  updateNavigationStore({
                    showWarningModal: {
                      show: false,
                      circuit: '',
                      size: 0,
                    }
                  });
                }}
              >
                <Text color="white">Continue</Text>
              </Button>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
};

export default MainScreen;
