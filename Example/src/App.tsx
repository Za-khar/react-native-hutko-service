import React, { useEffect } from 'react'
import { SafeAreaView, StyleSheet } from 'react-native'

import { CloudipspWebView, Cloudipsp } from 'react-native-hutko-service'

import { ModeSelection } from './components/ModeSelection'
import { PaymentForm } from './components/PaymentForm'
import { usePayment } from './hooks/usePayment'
import { EMode } from './types'

const App = () => {
  const {
    state,
    updateState,
    pay,
    applePay,
    googlePay,
    cardInputRef,
    cardLayoutRef,
    inputNumberRef,
    inputExpMmRef,
    inputExpYyRef,
    inputCvvRef,
    cloudipspWebViewRef,
  } = usePayment()

  useEffect(() => {
    Cloudipsp.supportsApplePay().then((result: boolean) => {
      console.log('SupportsApplePay: ', result)
    })
    Cloudipsp.supportsGooglePay().then((result: boolean) => {
      console.log('SupportsGooglePay: ', result)
    })
  }, [])

  const renderContent = (): React.ReactNode => {
    if (state.webView !== undefined) {
      return <CloudipspWebView ref={cloudipspWebViewRef} />
    }

    if (state.mode === EMode.ENTRY) {
      return <ModeSelection onSelectMode={mode => updateState({ mode })} />
    }

    return (
      <PaymentForm
        state={state}
        updateState={updateState}
        pay={pay}
        applePay={applePay}
        googlePay={googlePay}
        cardInputRef={cardInputRef}
        cardLayoutRef={cardLayoutRef}
        inputNumberRef={inputNumberRef}
        inputExpMmRef={inputExpMmRef}
        inputExpYyRef={inputExpYyRef}
        inputCvvRef={inputCvvRef}
      />
    )
  }

  return <SafeAreaView style={styles.flex1}>{renderContent()}</SafeAreaView>
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
})

export default App
