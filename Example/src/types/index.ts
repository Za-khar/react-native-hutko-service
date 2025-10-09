import {
  CardInput,
  CardLayout,
  CardFieldNumber,
  CardFieldCvv,
  CardFieldExpMm,
  CardFieldExpYy,
  CloudipspWebView,
} from 'react-native-hutko-service'

export enum EMode {
  ENTRY = 'entry',
  DEFAULT = 'default',
  FLEXIBLE = 'flexible',
}

export interface PaymentState {
  merchant: string
  amount: string
  ccy: string
  email: string
  description: string
  mode: EMode
  webView?: 1 | undefined
}

export interface PaymentRefs {
  cardInputRef: React.RefObject<CardInput | null>
  cardLayoutRef: React.RefObject<CardLayout | null>
  inputNumberRef: React.RefObject<CardFieldNumber | null>
  inputExpMmRef: React.RefObject<CardFieldExpMm | null>
  inputExpYyRef: React.RefObject<CardFieldExpYy | null>
  inputCvvRef: React.RefObject<CardFieldCvv | null>
  cloudipspWebViewRef?: React.RefObject<CloudipspWebView | null>
}

export interface PaymentActions {
  updateState: (updates: Partial<PaymentState>) => void
  pay: () => void
  applePay: () => void
  googlePay: () => void
}

export interface PaymentHook extends PaymentRefs, PaymentActions {
  state: PaymentState
}

export interface ModeSelectionProps {
  onSelectMode: (mode: EMode) => void
}

export interface CardFormProps extends PaymentRefs {
  mode: EMode
}

export interface PaymentFormProps extends PaymentRefs, PaymentActions {
  state: PaymentState
}
