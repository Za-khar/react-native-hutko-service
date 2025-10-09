import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View,
  Button,
  Alert,
  Platform,
  SafeAreaView,
  StyleSheet,
} from 'react-native'

import { Order, Cloudipsp, CloudipspWebView } from 'react-native-hutko-service'

// Constants
const MERCHANT_ID = 1396424

interface PaymentSupport {
  applePay: boolean
  googlePay: boolean
}

const ApplePayGpay: React.FC = () => {
  const [webViewVisible, setWebViewVisible] = useState(false)
  const [supportedPayments, setSupportedPayments] = useState<PaymentSupport>({
    applePay: false,
    googlePay: false,
  })

  const cloudipspWebViewRef = useRef<CloudipspWebView>(null)

  const checkPaymentSupport = useCallback(async () => {
    const isIOS = Platform.OS === 'ios'

    if (isIOS) {
      const supportsApplePay = await Cloudipsp.supportsApplePay()
      if (supportsApplePay) {
        setSupportedPayments(prev => ({ ...prev, applePay: true }))
        return
      }
      Alert.alert('Apple Pay is not supported on this device')
      return
    }

    const supportsGooglePay = await Cloudipsp.supportsGooglePay()
    if (supportsGooglePay) {
      setSupportedPayments(prev => ({ ...prev, googlePay: true }))
      return
    }
    Alert.alert('Google Pay is not supported on this device')
  }, [])

  useEffect(() => {
    checkPaymentSupport()
  }, [checkPaymentSupport])

  const getCloudipspInstance = useCallback((): Cloudipsp => {
    return new Cloudipsp(MERCHANT_ID, payConfirmator => {
      setWebViewVisible(true)
      return payConfirmator(cloudipspWebViewRef.current!)
    })
  }, [])

  const handleGooglePayPress = async () => {
    const cloudipsp = getCloudipspInstance()

    const order = new Order(
      10,
      'GEL',
      `rn_${Math.random()}`,
      'test payment',
      'test@gmail.com',
    )

    try {
      const receipt = await cloudipsp.googlePay(order)
      setWebViewVisible(false)
      console.log('Payment successful:', receipt)
    } catch (error) {
      console.error('Payment error:', error)
      setWebViewVisible(false)
    }
  }

  const handleGooglePayPressWithToken = async () => {
    const cloudipsp = getCloudipspInstance()

    try {
      const receipt = await cloudipsp.googlePayToken(
        '59e582f09c17acad57ff2388b96ad775d44d8db4',
      )
      setWebViewVisible(false)
      console.log('Payment successful:', receipt)
    } catch (error) {
      console.error('Payment error:', error)
      setWebViewVisible(false)
    }
  }

  const handleApplePayPress = async () => {
    const cloudipsp = getCloudipspInstance()
    const order = new Order(
      100,
      'GEL',
      `rn_${Math.random()}`,
      'test payment',
      'test@gmail.com',
    )

    try {
      const receipt = await cloudipsp.applePay(order)
      console.log('Payment successful:', receipt)
    } catch (error) {
      console.error('Payment error:', error)
    }
  }

  if (webViewVisible) {
    return (
      <View style={styles.webViewContainer}>
        <CloudipspWebView ref={cloudipspWebViewRef} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {supportedPayments.googlePay && (
        <View style={styles.buttonContainer}>
          <Button title="Pay with Google Pay" onPress={handleGooglePayPress} />
        </View>
      )}
      {supportedPayments.googlePay && (
        <View style={styles.buttonContainer}>
          <Button
            title="Pay with Google Pay (Token)"
            onPress={handleGooglePayPressWithToken}
          />
        </View>
      )}
      {supportedPayments.applePay && (
        <View style={styles.buttonContainer}>
          <Button title="Pay with Apple Pay" onPress={handleApplePayPress} />
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: 'green',
  },
  buttonContainer: {
    marginBottom: 12,
  },
})

export default ApplePayGpay
