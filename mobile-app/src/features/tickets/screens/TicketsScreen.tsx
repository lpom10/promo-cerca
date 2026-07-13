import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { QrCode, Clock } from 'lucide-react-native';
import { colors } from '@/app/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const tickets = [
  {
    id: '1',
    store: 'Pizza Napolitana',
    title: 'Pizza familiar gratis',
    discount: '2x1',
    status: 'Activo',
    expiry: 'Válido hasta 14/7/2026',
  },
  {
    id: '2',
    store: 'Fashion Store',
    title: 'Descuento en ropa de...',
    discount: '30% OFF',
    status: 'Activo',
    expiry: 'Válido hasta 24/7/2026',
  }
];

export default function TicketsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Activos');

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, '#f97316', '#ea580c']}
        style={[styles.headerGradient, { paddingTop: insets.top + 20 }]}
      >
        <Text style={styles.headerTitle}>Mis Tickets</Text>
        <Text style={styles.headerSubtitle}>2 tickets activos</Text>
      </LinearGradient>

      <View style={styles.tabsContainer}>
        <View style={styles.tabsWrapper}>
          {['Activos', 'Usados', 'Expirados'].map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.ticketsContainer} showsVerticalScrollIndicator={false}>
        {tickets.map(ticket => (
          <View key={ticket.id} style={styles.ticketCard}>
            <View style={styles.ticketTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.storeName}>{ticket.store}</Text>
                <Text style={styles.ticketTitle} numberOfLines={1}>{ticket.title}</Text>
              </View>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{ticket.discount}</Text>
              </View>
            </View>

            <View style={styles.ticketStatusRow}>
              <View style={styles.statusBadge}>
                <Clock color={colors.success} size={14} />
                <Text style={styles.statusText}>{ticket.status}</Text>
              </View>
              <Text style={styles.expiryText}>{ticket.expiry}</Text>
            </View>

            <View style={styles.dividerContainer}>
              <View style={styles.circleLeft} />
              <View style={styles.dashedLine} />
              <View style={styles.circleRight} />
            </View>

            <TouchableOpacity style={styles.qrButton}>
              <QrCode color={colors.primary} size={20} />
              <Text style={styles.qrButtonText}>Toca para ver código QR</Text>
            </TouchableOpacity>
          </View>
        ))}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 6,
    elevation: 4,
    shadowColor: '#000',
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
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
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
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
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
    color: colors.textSecondary,
    marginBottom: 4,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  discountBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 12,
  },
  discountText: {
    color: colors.success,
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
    color: colors.success,
    fontWeight: '500',
    fontSize: 13,
  },
  expiryText: {
    color: colors.textSecondary,
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
    backgroundColor: '#F9FAFB',
    marginLeft: -10,
  },
  circleRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    marginRight: -10,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});
