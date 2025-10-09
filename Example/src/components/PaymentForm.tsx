import React, { useRef } from 'react'
import {
  ScrollView,
  Text,
  TextInput,
  View,
  Button,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native'

import { Picker } from '@react-native-picker/picker'

import { EMode, PaymentFormProps } from '../types'

import { CardForm } from './CardForm'

const isAndroid = Platform.OS === 'android'

export const PaymentForm = ({
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
}: PaymentFormProps) => {
  const inputAmountRef = useRef<TextInput>(null)
  const inputEmailRef = useRef<TextInput>(null)
  const inputDescriptionRef = useRef<TextInput>(null)

  return (
    <ScrollView
      style={styles.flex1}
      keyboardDismissMode={'none'}
      automaticallyAdjustKeyboardInsets
      keyboardShouldPersistTaps={'always'}>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={() => {
            updateState({ mode: EMode.ENTRY })
          }}>
          <Text style={styles.simpleText}>{'< Modes'}</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.simpleText}>Merchant:</Text>
        </View>
        <TextInput
          value={state.merchant}
          keyboardType="numeric"
          onChangeText={(text: string) => {
            updateState({ merchant: text })
          }}
          onSubmitEditing={() => {
            inputAmountRef.current?.focus()
          }}
          style={styles.simpleTextInput}
        />

        <View style={styles.section}>
          <Text style={styles.simpleText}>Amount:</Text>
        </View>
        <TextInput
          ref={inputAmountRef}
          value={state.amount}
          maxLength={7}
          keyboardType="numeric"
          onChangeText={(text: string) => {
            updateState({ amount: text })
          }}
          onSubmitEditing={() => {
            inputEmailRef.current?.focus()
          }}
          style={styles.simpleTextInput}
        />

        <Text style={styles.simpleText}>Currency:</Text>
        <Picker
          selectedValue={state.ccy}
          onValueChange={(value: string) => {
            updateState({ ccy: value })
          }}>
          <Picker.Item label="UAH" value="UAH" />
          <Picker.Item label="USD" value="USD" />
          <Picker.Item label="EUR" value="EUR" />
          <Picker.Item label="GBP" value="GBP" />
          <Picker.Item label="RUB" value="RUB" />
          <Picker.Item label="KZT" value="KZT" />
        </Picker>

        <Text style={styles.simpleText}>Email:</Text>
        <TextInput
          ref={inputEmailRef}
          value={state.email}
          keyboardType="email-address"
          onChangeText={(text: string) => {
            updateState({ email: text })
          }}
          onSubmitEditing={() => {
            inputDescriptionRef.current?.focus()
          }}
          style={styles.simpleTextInput}
        />

        <Text style={styles.simpleText}>Description:</Text>
        <TextInput
          ref={inputDescriptionRef}
          value={state.description}
          onChangeText={(text: string) => {
            updateState({ description: text })
          }}
          onSubmitEditing={() => {
            if (state.mode === 'default') {
              cardInputRef.current?.focus()
            } else {
              inputNumberRef.current?.focus()
            }
          }}
          style={styles.simpleTextInput}
        />

        <CardForm
          mode={state.mode}
          cardInputRef={cardInputRef}
          cardLayoutRef={cardLayoutRef}
          inputNumberRef={inputNumberRef}
          inputExpMmRef={inputExpMmRef}
          inputExpYyRef={inputExpYyRef}
          inputCvvRef={inputCvvRef}
        />

        <View style={styles.buttonContainer}>
          <View style={styles.buttonWrapper}>
            <Button onPress={pay} title="Pay by Card" />
          </View>
          <View style={styles.buttonSpacer}>
            {isAndroid && <Button onPress={googlePay} title="Google Pay" />}
            {!isAndroid && <Button onPress={applePay} title="ApplePay" />}
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  container: {
    padding: 20,
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  buttonContainer: {
    marginTop: 10,
    flexDirection: 'row',
  },
  buttonWrapper: {
    flex: 1,
  },
  buttonSpacer: {
    flex: 1,
    marginLeft: 10,
  },
  simpleTextInput: {
    height: 33,
    borderWidth: 0.5,
    borderColor: '#9900ff',
    flex: 1,
    fontSize: 17,
    padding: 6,
  },
  simpleText: {
    color: '#ff9900',
    fontSize: 16,
    padding: 4,
    marginTop: 5,
    marginBottom: 5,
  },
})
