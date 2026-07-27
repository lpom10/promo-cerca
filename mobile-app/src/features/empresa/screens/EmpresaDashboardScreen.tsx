import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '@/app/theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/app/store/useAuthStore';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Users, TicketCheck, LayoutDashboard, PlusCircle, ScanLine } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

export default function EmpresaDashboardScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { userDetails } = useAuthStore();
  const navigation = useNavigation<any>();

  const empresaName = userDetails?.negocio || 'Tu Negocio';

  // Fake metrics for now
  const METRICS = [
    { title: 'Promos Activas', value: '3', icon: LayoutDashboard, color: '#3b82f6' },
    { title: 'Tickets Canjeados', value: '142', icon: TicketCheck, color: '#10b981' },
    { title: 'Vistas Totales', value: '2.4K', icon: Users, color: '#f59e0b' },
    { title: 'Conversión', value: '5.8%', icon: TrendingUp, color: '#8b5cf6' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        
        {/* Header Gradient */}
        <LinearGradient
          colors={[colors.primary, '#f97316']}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.empresaName}>{empresaName}</Text>
            </View>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarLetter}>{empresaName.charAt(0).toUpperCase()}</Text>
            </View>
          </View>
          
          {userDetails?.estado === 'pendiente' && (
            <View style={styles.alertPending}>
              <Text style={styles.alertText}>⚠️ Tu cuenta está pendiente de aprobación por un administrador. Algunas funciones pueden estar limitadas.</Text>
            </View>
          )}
        </LinearGradient>

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Resumen de Rendimiento</Text>
          
          {/* Metrics Grid */}
          <View style={styles.metricsGrid}>
            {METRICS.map((metric, index) => (
              <View key={index} style={[styles.metricCard, { backgroundColor: colors.card, shadowColor: colors.border }]}>
                <View style={[styles.iconBox, { backgroundColor: `${metric.color}20` }]}>
                  <metric.icon color={metric.color} size={24} />
                </View>
                <Text style={[styles.metricValue, { color: colors.text }]}>{metric.value}</Text>
                <Text style={[styles.metricTitle, { color: colors.textSecondary }]}>{metric.title}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>Acciones Rápidas</Text>
          
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}
              onPress={() => navigation.navigate('Promos')}
            >
              <PlusCircle color={colors.primary} size={32} />
              <Text style={[styles.actionText, { color: colors.primary }]}>Crear Promoción</Text>
              <Text style={[styles.actionSubtext, { color: colors.textSecondary }]}>Lanza una nueva oferta</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, { backgroundColor: '#10b98110', borderColor: '#10b981' }]}
              onPress={() => navigation.navigate('Canje')}
            >
              <ScanLine color="#10b981" size={32} />
              <Text style={[styles.actionText, { color: '#10b981' }]}>Escanear Ticket</Text>
              <Text style={[styles.actionSubtext, { color: colors.textSecondary }]}>Valida compras en tienda</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
  },
  empresaName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  avatarLetter: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ea580c',
  },
  alertPending: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#fde047',
  },
  alertText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '500',
  },
  content: {
    padding: 20,
    marginTop: -20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  metricCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: 13,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  actionCard: {
    width: '47%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  actionSubtext: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  }
});
