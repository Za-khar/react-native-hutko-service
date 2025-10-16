import { useState, useRef, useCallback } from 'react'
import { Alert } from 'react-native'

import {
  CardInput,
  CardLayout,
  Cloudipsp,
  CloudipspWebView,
  Order,
  Card,
  CardFieldNumber,
  CardFieldExpMm,
  CardFieldExpYy,
  CardFieldCvv,
} from 'react-native-hutko-service'

import { PaymentState, PaymentHook, PaymentRefs, EMode } from '../types'

const initialState: PaymentState = {
  merchant: '1700002',
  amount: '1',
  ccy: 'UAH',
  email: 'example@test.com',
  description: 'test payment :)',
  mode: EMode.ENTRY,
  webView: undefined,
}

export const usePayment = (): PaymentHook => {
  const [state, setState] = useState<PaymentState>(initialState)

  const cardInputRef = useRef<CardInput>(null)
  const cardLayoutRef = useRef<CardLayout>(null)
  const inputNumberRef = useRef<CardFieldNumber>(null)
  const inputExpMmRef = useRef<CardFieldExpMm>(null)
  const inputExpYyRef = useRef<CardFieldExpYy>(null)
  const inputCvvRef = useRef<CardFieldCvv>(null)
  const cloudipspWebViewRef = useRef<CloudipspWebView>(null)

  const updateState = useCallback((updates: Partial<PaymentState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  const getOrder = useCallback((): Order => {
    return new Order(
      Number(state.amount),
      state.ccy,
      'rn_' + Math.random(),
      state.description,
      state.email,
    )
  }, [state.amount, state.ccy, state.description, state.email])

  const cloudipsp = useCallback((): Cloudipsp => {
    return new Cloudipsp(Number(state.merchant), async payConfirmator => {
      updateState({ webView: 1 })
      if (!cloudipspWebViewRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      return payConfirmator(cloudipspWebViewRef.current!)
    })
  }, [state.merchant, updateState])

  const pay = useCallback((): void => {
    let card: Card | null = null

    if (state.mode === 'default') {
      card = cardInputRef.current?.getCard() ?? null
    } else if (state.mode === 'flexible') {
      card = cardLayoutRef.current?.getCard() ?? null
    }

    const order = getOrder()

    if (!card || !card.isValidCardNumber()) {
      Alert.alert('Warning', 'Credit card number is not valid')
    } else if (!card.isValidExpireMonth()) {
      Alert.alert('Warning', 'Expire month is not valid')
    } else if (!card.isValidExpireYear()) {
      Alert.alert('Warning', 'Expire year is not valid')
    } else if (!card.isValidExpireDate()) {
      Alert.alert('Warning', 'Expire date is not valid')
    } else if (!card.isValidCvv()) {
      Alert.alert('Warning', 'CVV is not valid')
    } else {
      const cloudipspInstance = cloudipsp()
      cloudipspInstance
        .pay(card, order)
        .then(receipt => {
          updateState({ webView: undefined })
          Alert.alert(
            'Transaction Completed :)',
            'Result: ' + receipt.status + '\nPaymentId: ' + receipt.paymentId,
          )
          console.log('Receipt: ', receipt)
        })
        .catch(error => {
          console.log('Error: ', error)
        })
    }
  }, [state.mode, getOrder, cloudipsp, updateState])

  const applePay = useCallback((): void => {
    const cloudipspInstance = cloudipsp()
    const order = getOrder()
    cloudipspInstance
      .applePay(order)
      .then(receipt => {
        updateState({ webView: undefined })
        Alert.alert(
          'Transaction Completed :)',
          'Result: ' + receipt.status + '\nPaymentId: ' + receipt.paymentId,
        )
        console.log('Receipt: ', receipt)
      })
      .catch(error => {
        console.log('Error: ', error)
      })
  }, [cloudipsp, getOrder, updateState])

  const googlePay = useCallback((): void => {
    const cloudipspInstance = cloudipsp()
    const order = getOrder()
    cloudipspInstance
      .googlePay(order)
      .then(receipt => {
        updateState({ webView: undefined })
        Alert.alert(
          'Transaction Completed :)',
          'Result: ' + receipt.status + '\nPaymentId: ' + receipt.paymentId,
        )
        console.log('Receipt: ', receipt)
      })
      .catch(error => {
        console.log('Error: ', error)
        Alert.alert('Transaction Failure :(', 'Result: ' + error)
      })
  }, [cloudipsp, getOrder, updateState])

  const refs: PaymentRefs = {
    cardInputRef,
    cardLayoutRef,
    inputNumberRef,
    inputExpMmRef,
    inputExpYyRef,
    inputCvvRef,
    cloudipspWebViewRef,
  }

  const actions = {
    updateState,
    pay,
    applePay,
    googlePay,
  }

  return {
    state,
    ...refs,
    ...actions,
  }
}
