import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@/app/theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';

type RouteParams = {
  params: {
    empresaId?: string;
    nombreEmpresa?: string;
  }
};

export default function EmpresaPublicaScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<RouteParams, 'params'>>();
  const { empresaId, nombreEmpresa } = route.params || {};

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 24, paddingHorizontal: 16 }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {nombreEmpresa || 'Perfil de Empresa'}
        </Text>
        {empresaId && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            ID: {empresaId}
          </Text>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Información</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          Aquí se mostrará la información detallada de la empresa, dirección, horarios, etc.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Promociones Activas</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>
          Aquí se listarán las promociones actuales que ofrece este negocio.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  }
});
