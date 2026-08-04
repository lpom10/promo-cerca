import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '@/app/theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Clock, Tag, Store, QrCode } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useTickets } from '@/features/tickets/hooks/useTickets';
import { Promocion } from '../hooks/usePromociones';

export default function PromoDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { isAuth, userType } = useAuthStore();
  const { generateTicket, isGenerating } = useTickets();

  const promo: Promocion = route.params?.promo;

  if (!promo) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Promoción no encontrada.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
          <Text style={{ color: colors.primary }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCanjear = async () => {
    if (!isAuth) {
      Alert.alert(
        'Inicia Sesión',
        'Necesitas una cuenta para canjear promociones y obtener tu ticket.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar Sesión', onPress: () => navigation.navigate('Auth') }
        ]
      );
      return;
    }

    if (userType === 'empresa') {
      Alert.alert('Acceso Denegado', 'Las cuentas de empresa no pueden canjear promociones.');
      return;
    }

    try {
      const ticketId = await generateTicket(promo);
      if (ticketId) {
        navigation.replace('TicketDetail', { ticketId });
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo generar el ticket. Inténtalo de nuevo.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView bounces={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Cover Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: promo.image }} style={styles.image} />
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          />
          <TouchableOpacity 
            style={[styles.backButton, { top: insets.top + 10 }]}
            onPress={() => navigation.goBack()}
          >
            <ChevronLeft color="white" size={28} />
          </TouchableOpacity>

          <View style={styles.badgeContainer}>
            <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
              <Tag color="white" size={14} style={{ marginRight: 4 }} />
              <Text style={styles.discountText}>{promo.discount}</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{promo.title}</Text>
          
          <View style={styles.storeRow}>
            <Store color={colors.textSecondary} size={20} />
            <Text style={[styles.storeName, { color: colors.textSecondary }]}>{promo.store}</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MapPin color={colors.primary} size={24} />
              <Text style={[styles.infoCardValue, { color: colors.text }]}>{promo.distance}</Text>
              <Text style={[styles.infoCardLabel, { color: colors.textSecondary }]}>Distancia</Text>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Clock color={colors.primary} size={24} />
              <Text style={[styles.infoCardValue, { color: colors.text }]} numberOfLines={1}>Expiración</Text>
              <Text style={[styles.infoCardLabel, { color: colors.textSecondary }]}>{promo.expiry.replace('Válido hasta ', '')}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Términos y Condiciones</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              Válido únicamente presentando el código QR o el código alfanumérico generado al canjear esta promoción en el local.
              No acumulable con otras promociones. Sujeto a disponibilidad del comercio.
            </Text>
          </View>

        </View>
      </ScrollView>

      {/* Floating Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Platform.OS === 'ios' ? insets.bottom || 20 : 20 }]}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: colors.primary, opacity: isGenerating ? 0.7 : 1 }]}
          onPress={handleCanjear}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <QrCode color="white" size={24} />
              <Text style={styles.actionText}>Canjear Promoción</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { width: '100%', height: 350, position: 'relative' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  gradient: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  backButton: { position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  badgeContainer: { position: 'absolute', bottom: 20, left: 24 },
  discountBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  discountText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  content: { padding: 24, borderTopLeftRadius: 30, borderTopRightRadius: 30, marginTop: -30, backgroundColor: 'transparent' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 12 },
  storeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  storeName: { fontSize: 16, marginLeft: 8 },
  infoGrid: { flexDirection: 'row', gap: 16, marginBottom: 30 },
  infoCard: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  infoCardValue: { fontSize: 16, fontWeight: 'bold', marginTop: 12, marginBottom: 4 },
  infoCardLabel: { fontSize: 12 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  description: { fontSize: 14, lineHeight: 22 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 16, borderTopWidth: 1 },
  actionButton: { flexDirection: 'row', height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  actionText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 12 },
});
