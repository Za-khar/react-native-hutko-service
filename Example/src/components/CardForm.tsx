import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

import {
  CardInput,
  CardLayout,
  CardFieldNumber,
  CardFieldCvv,
  CardFieldExpMm,
  CardFieldExpYy,
} from 'react-native-hutko-service'

import { CardFormProps } from '../types'

export const CardForm = ({
  mode,
  cardInputRef,
  cardLayoutRef,
  inputNumberRef,
  inputExpMmRef,
  inputExpYyRef,
  inputCvvRef,
}: CardFormProps) => {
  if (mode === 'default') {
    return (
      <View>
        <Text>Default card view</Text>
        <CardInput
          ref={cardInputRef}
          debug={true}
          textStyle={styles.simpleText}
          textInputStyle={styles.simpleTextInput}
        />
      </View>
    )
  } else {
    return (
      <CardLayout
        ref={cardLayoutRef}
        inputNumber={() => inputNumberRef.current!}
        inputExpMm={() => inputExpMmRef.current!}
        inputExpYy={() => inputExpYyRef.current!}
        inputCvv={() => inputCvvRef.current!}>
        <Text style={styles.layoutDescription}>
          Card form layout. Cvv and expirity field were swapped
        </Text>
        <Text
          onPress={() => {
            cardLayoutRef.current?.test()
          }}>
          Card Number:
        </Text>
        <CardFieldNumber
          ref={inputNumberRef}
          style={styles.simpleTextInput}
          onSubmitEditing={() => {
            inputCvvRef.current?.focus()
          }}
        />
        <Text style={styles.fieldLabel}>CVV:</Text>
        <CardFieldCvv
          ref={inputCvvRef}
          style={styles.simpleTextInput}
          onSubmitEditing={() => {
            inputExpMmRef.current?.focus()
          }}
        />
        <Text style={styles.fieldLabel}>Expiry:</Text>
        <View style={styles.expiryContainer}>
          <CardFieldExpMm
            ref={inputExpMmRef}
            style={[styles.flex1, styles.simpleTextInput]}
            placeholder="MM"
            onSubmitEditing={() => {
              inputExpYyRef.current?.focus()
            }}
          />
          <CardFieldExpYy
            ref={inputExpYyRef}
            style={[styles.flex1, styles.simpleTextInput]}
            placeholder="YY"
          />
        </View>
      </CardLayout>
    )
  }
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
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
  layoutDescription: {
    marginVertical: 20,
  },
  fieldLabel: {
    marginTop: 10,
  },
  expiryContainer: {
    flexDirection: 'row',
    flex: 1,
  },
})
