import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '@/app/theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Navigation, Tag } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/core/config/firebase';
import { Button } from '@/shared/ui/Button';

export default function TicketDetailScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const ticketId = route.params?.ticketId;

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const docRef = doc(db, 'redemptions', ticketId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setTicket({ id: docSnap.id, ...docSnap.data() });
        } else {
          Alert.alert('Error', 'Ticket no encontrado.');
          navigation.goBack();
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Error al cargar el ticket.');
      } finally {
        setLoading(false);
      }
    };
    if (ticketId) fetchTicket();
  }, [ticketId]);

  const openDirections = () => {
    if (!ticket?.latitude || !ticket?.longitude) {
      Alert.alert('Error', 'Ubicación no disponible para este local.');
      return;
    }
    
    const lat = ticket.latitude;
    const lng = ticket.longitude;
    const scheme = Platform.select({ ios: 'maps://0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${lat},${lng}`;
    const label = ticket.companyName || 'Destino';
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    });

    if (url) {
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback to browser
          const browserUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
          Linking.openURL(browserUrl);
        }
      });
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!ticket) return null;

  const isActive = ticket.status === 'PENDING';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ChevronLeft color="white" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tu Ticket</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Ticket Card */}
        <View style={[styles.ticketCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.cardHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.storeName, { color: colors.textSecondary }]}>{ticket.companyName}</Text>
            <Text style={[styles.promoTitle, { color: colors.text }]}>{ticket.promotionTitle}</Text>
            <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
              <Tag color="white" size={14} style={{ marginRight: 4 }} />
              <Text style={styles.discountText}>{ticket.discount}</Text>
            </View>
          </View>

          <View style={styles.qrContainer}>
            <Text style={[styles.qrInstruction, { color: colors.textSecondary }]}>
              {isActive ? 'Muestra este código en el local' : 'Este ticket ya no es válido'}
            </Text>
            <View style={[styles.qrWrapper, !isActive && { opacity: 0.3 }]}>
              <QRCode
                value={ticket.id}
                size={200}
                color={colors.text}
                backgroundColor={colors.card}
              />
            </View>
            <View style={[styles.codeBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.codeText, { color: colors.text }]}>{ticket.id.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.ticketFooter}>
            <Text style={[styles.expiryText, { color: isActive ? colors.success : colors.danger }]}>
              {isActive ? `Válido hasta ${new Date(ticket.validUntil).toLocaleDateString()}` : `Estado: ${ticket.status}`}
            </Text>
          </View>
        </View>

        {/* Action Section */}
        <View style={styles.actionSection}>
          <Button 
            title="Cómo llegar al local" 
            onPress={openDirections} 
            icon={<Navigation color="white" size={20} />}
          />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  scrollContent: { padding: 24, paddingBottom: 40 },
  ticketCard: { borderRadius: 24, borderWidth: 1, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, marginBottom: 24 },
  cardHeader: { padding: 24, borderBottomWidth: 1, borderStyle: 'dashed', alignItems: 'center' },
  storeName: { fontSize: 16, marginBottom: 4 },
  promoTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  discountBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  discountText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  qrContainer: { padding: 32, alignItems: 'center' },
  qrInstruction: { fontSize: 14, marginBottom: 24, textAlign: 'center' },
  qrWrapper: { padding: 16, backgroundColor: 'white', borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  codeBox: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, borderWidth: 1 },
  codeText: { fontSize: 18, fontWeight: 'bold', letterSpacing: 2 },
  ticketFooter: { padding: 20, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)' },
  expiryText: { fontSize: 14, fontWeight: '600' },
  actionSection: { marginTop: 8 },
});
