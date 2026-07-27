import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/app/theme/ThemeContext';

export default function MapScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.card }]}>
        <Text style={{ color: colors.textSecondary, textAlign: 'center', padding: 20 }}>
          El mapa interactivo no está disponible en la versión web.{'\n'}Por favor, usa un emulador de iOS/Android o la app Expo Go en tu teléfono.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});
