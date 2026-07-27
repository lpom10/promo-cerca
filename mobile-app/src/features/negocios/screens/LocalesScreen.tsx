import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/app/theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LocalesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Text style={[styles.text, { color: colors.text }]}>Pantalla de Locales (Negocios)</Text>
      <Text style={[styles.subtext, { color: colors.textSecondary }]}>Próximamente: Lista de todas las empresas afiliadas.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});
