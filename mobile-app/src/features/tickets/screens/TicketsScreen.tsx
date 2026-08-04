import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { QrCode, Clock, Lock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/app/theme/ThemeContext';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import { useTickets } from '@/features/tickets/hooks/useTickets';

export default function TicketsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isAuth } = useAuthStore();
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState('Activos');
  const { tickets, isLoading } = useTickets();

  if (!isAuth) {
    return (
      <View style={[styles.unauthContainer, { backgroundColor: colors.background }]}>
        <Lock color={colors.primary} size={48} />
        <Text style={[styles.unauthTitle, { color: colors.text }]}>Inicia Sesión</Text>
        <Text style={[styles.unauthText, { color: colors.textSecondary }]}>
          Debes iniciar sesión para ver tus tickets y realizar canjes.
        </Text>
        <TouchableOpacity 
          style={[styles.loginButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Auth')}
        >
          <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Filtrar los tickets según la pestaña seleccionada
  const filteredTickets = tickets.filter(t => {
    if (activeTab === 'Activos') return t.status === 'Activo';
    if (activeTab === 'Usados') return t.status === 'Usado';
    if (activeTab === 'Expirados') return t.status === 'Expirado';
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary, '#f97316', '#ea580c']}
        style={[styles.headerGradient, { paddingTop: insets.top + 20 }]}
      >
        <Text style={styles.headerTitle}>Mis Tickets</Text>
        <Text style={styles.headerSubtitle}>{tickets.filter(t => t.status === 'Activo').length} tickets activos</Text>
      </LinearGradient>

      <View style={styles.tabsContainer}>
        <View style={[styles.tabsWrapper, { backgroundColor: colors.card, shadowColor: colors.border }]}>
          {['Activos', 'Usados', 'Expirados'].map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[
                styles.tab, 
                activeTab === tab && { backgroundColor: colors.primary }
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText, 
                { color: colors.textSecondary },
                activeTab === tab && styles.activeTabText
              ]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.ticketsContainer} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 12, color: colors.textSecondary }}>Cargando tickets...</Text>
          </View>
        ) : filteredTickets.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No tienes tickets en esta categoría.</Text>
          </View>
        ) : (
          filteredTickets.map(ticket => (
            <View key={ticket.id} style={[styles.ticketCard, { backgroundColor: colors.card, shadowColor: colors.border }]}>
              <View style={styles.ticketTop}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.storeName, { color: colors.textSecondary }]}>{ticket.store}</Text>
                  <Text style={[styles.ticketTitle, { color: colors.text }]} numberOfLines={1}>{ticket.title}</Text>
                </View>
                <View style={[styles.discountBadge, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.discountText, { color: colors.success }]}>{ticket.discount}</Text>
                </View>
              </View>

              <View style={styles.ticketStatusRow}>
                <View style={styles.statusBadge}>
                  <Clock color={colors.success} size={14} />
                  <Text style={[styles.statusText, { color: colors.success }]}>{ticket.status}</Text>
                </View>
                <Text style={[styles.expiryText, { color: colors.textSecondary }]}>{ticket.expiry}</Text>
              </View>

              <View style={styles.dividerContainer}>
                <View style={[styles.circleLeft, { backgroundColor: colors.background }]} />
                <View style={[styles.dashedLine, { borderColor: colors.border }]} />
                <View style={[styles.circleRight, { backgroundColor: colors.background }]} />
              </View>

              <TouchableOpacity 
                style={styles.qrButton}
                onPress={() => navigation.navigate('TicketDetail', { ticketId: ticket.id })}
              >
                <QrCode color={colors.primary} size={20} />
                <Text style={[styles.qrButtonText, { color: colors.primary }]}>Toca para ver código QR</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  unauthContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  unauthTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  unauthText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerGradient: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  tabsContainer: {
    marginTop: -30,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  tabsWrapper: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 6,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 16,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  ticketsContainer: {
    paddingHorizontal: 24,
    gap: 16,
    paddingTop: 8,
  },
  ticketCard: {
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  ticketTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  storeName: {
    fontSize: 13,
    marginBottom: 4,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  discountBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  discountText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  ticketStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontWeight: '500',
    fontSize: 13,
  },
  expiryText: {
    fontSize: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    marginHorizontal: -20,
  },
  circleLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginLeft: -10,
  },
  circleRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: -10,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginHorizontal: 10,
  },
  qrButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  qrButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
