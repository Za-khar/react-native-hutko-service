import React from 'react'
import { View, Button, StyleSheet } from 'react-native'

import { EMode, ModeSelectionProps } from '../types'

export const ModeSelection = ({ onSelectMode }: ModeSelectionProps) => {
  return (
    <View style={styles.container}>
      <Button
        onPress={() => onSelectMode(EMode.DEFAULT)}
        title="Default Example"
      />
      <View style={styles.buttonSpacing}>
        <Button
          onPress={() => onSelectMode(EMode.FLEXIBLE)}
          title="Flexible Example"
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSpacing: {
    marginTop: 10,
  },
})
