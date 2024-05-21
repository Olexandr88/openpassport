import { create } from 'zustand'
import {
  DEFAULT_PNUMBER,
  DEFAULT_DOB,
  DEFAULT_DOE,
} from '@env';
import { mockPassportData_sha256WithRSAEncryption_65537 } from '../../../common/src/utils/mockPassportData';
import { PassportData } from '../../../common/src/utils/types';
import * as Keychain from 'react-native-keychain';
import * as amplitude from '@amplitude/analytics-react-native';
import useNavigationStore from './navigationStore';
import { Steps } from '../utils/utils';
import { ethers } from 'ethers';
import { downloadZkey } from '../utils/zkeyDownload';
import { generateCircuitInputsRegister } from '../../../common/src/utils/generateInputs';
import { PASSPORT_ATTESTATION_ID, RPC_URL } from '../../../common/src/constants/constants';
import { generateProof } from '../utils/prover';
import { formatSigAlg } from '../../../common/src/utils/utils';
import { sendRegisterTransaction } from '../utils/transactions';

interface UserState {
  passportNumber: string
  dateOfBirth: string
  dateOfExpiry: string
  registered: boolean
  passportData: PassportData
  secret: string
  initUserStore: () => void
  registerPassportData: (passportData: PassportData) => void
  registerCommitment: (secret: string, passportData: PassportData) => void
  clearPassportDataFromStorage: () => void
  clearSecretFromStorage: () => void
  update: (patch: any) => void
  deleteMrzFields: () => void
}

const useUserStore = create<UserState>((set, get) => ({
  passportNumber: DEFAULT_PNUMBER ?? "",
  dateOfBirth: DEFAULT_DOB ?? "",
  dateOfExpiry: DEFAULT_DOE ?? "",

  registered: false,
  passportData: mockPassportData_sha256WithRSAEncryption_65537,
  secret: "",

  // When user opens the app, checks presence of passportData
  // - If passportData is not present, starts the onboarding flow
  // - If passportData is present, then secret must be here too (they are always set together). Request the tree.
  // 	- If the commitment is present in the tree, proceed to main screen
  // 	- If the commitment is not present in the tree, proceed to main screen AND try registering it in the background
  initUserStore: async () => {
    const passportDataCreds = await Keychain.getGenericPassword({ service: "passportData" });
    if (!passportDataCreds) {
      console.log("No passport data found, starting onboarding flow")
      return;
    }
    const secretCreds = await Keychain.getGenericPassword({ service: "secret" })

    const secret = (secretCreds as Keychain.UserCredentials).password

    console.log("Setting passportData, secret and registered boolean to true, skipping onboarding")

    set({
      passportData: JSON.parse(passportDataCreds.password),
      secret,
      registered: true,
    });
    useNavigationStore.getState().setStep(Steps.NFC_SCAN_COMPLETED); // this currently means go to app selection screen

    // download zkeys if they are not already downloaded
    downloadZkey("register_sha256WithRSAEncryption_65537"); // might move after nfc scanning
    downloadZkey("disclose");

    // TODO: check if the commitment is already registered, if not retry registering it

    // set({
    //   registered: true,
    // });
  },

  // When reading passport for the first time:
  // - Check presence of secret. If there is none, create one and store it
  // 	- Store the passportData and try registering the commitment in the background
  registerPassportData: async (passportData) => {
    const secretCreds = await Keychain.getGenericPassword({ service: "secret" });

    if (secretCreds && secretCreds.password) {
      // This should only ever happen if the user deletes the passport data in the options
      console.log("secret is already registered, let's keep it.")
    } else {
      const randomWallet = ethers.Wallet.createRandom();
      const secret = randomWallet.privateKey;
      await Keychain.setGenericPassword("secret", secret, { service: "secret" });
    }

    const newSecretCreds = await Keychain.getGenericPassword({ service: "secret" })
    const secret = (newSecretCreds as Keychain.UserCredentials).password

    const passportDataCreds = await Keychain.getGenericPassword({ service: "passportData" });

    if (passportDataCreds && passportDataCreds.password) {
      console.log("passportData is already registered, this should never happen in prod")
    }

    await Keychain.setGenericPassword("passportData", JSON.stringify(passportData), { service: "passportData" });

    get().registerCommitment(
      secret,
      passportData
    )

    set({
      passportData,
      secret
    });
  },

  registerCommitment: async (secret, passportData) => {
    const {
      toast
    } = useNavigationStore.getState();

    try {
      const inputs = generateCircuitInputsRegister(
        secret,
        PASSPORT_ATTESTATION_ID,
        passportData,
        { developmentMode: true }
      );

      amplitude.track(`Sig alg supported: ${passportData.signatureAlgorithm}`);
  
      Object.keys(inputs).forEach((key) => {
        if (Array.isArray(inputs[key as keyof typeof inputs])) {
          console.log(key, inputs[key as keyof typeof inputs].slice(0, 10), '...');
        } else {
          console.log(key, inputs[key as keyof typeof inputs]);
        }
      });
  
      const start = Date.now();

      const sigAlgFormatted = formatSigAlg(passportData.signatureAlgorithm, passportData.pubKey.exponent);

      const proof = await generateProof(
        `register_${sigAlgFormatted}`,
        inputs,
      );

      console.log('proof:', proof);

      const end = Date.now();
      console.log('Total proof time from frontend:', end - start);
      amplitude.track('Proof generation successful, took ' + ((end - start) / 1000) + ' seconds');

      const provider = new ethers.JsonRpcProvider(RPC_URL);

      const serverResponse = await sendRegisterTransaction(proof)
      const txHash = serverResponse?.data.hash;

      const receipt = await provider.waitForTransaction(txHash);
      console.log('receipt status:', receipt?.status);

      if (receipt?.status === 0) {
        throw new Error("Transaction failed");
      }

      set({
        registered: true,
      });
    } catch (error: any) {
      console.error(error);
      toast?.show('Error', {
        message: "Error registering your identity, please relaunch the app",
        customData: {
          type: "error",
        },
      })
      amplitude.track(error.message);
    }
  },

  clearPassportDataFromStorage: async () => {
    await Keychain.resetGenericPassword({ service: "passportData" });
  },

  clearSecretFromStorage: async () => {
    await Keychain.resetGenericPassword({ service: "secret" });
  },

  update: (patch) => {
    set({
      ...get(),
      ...patch,
    });
  },

  deleteMrzFields: () => set({
    passportNumber: "",
    dateOfBirth: "",
    dateOfExpiry: "",
  }),
}))

export default useUserStore