import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@/app/theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEmpresaPromociones } from '../hooks/useEmpresaPromociones';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Clock, Eye, MapPin, MoreVertical } from 'lucide-react-native';
import { Promocion } from '@/features/promociones/types/promocion';

export default function GestorPromocionesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { promociones, isLoading } = useEmpresaPromociones();

  const renderPromo = ({ item }: { item: Promocion }) => {
    // Assuming status logic or data exists
    const isActive = item.estado !== 'inactiva' && item.estado !== 'expirada';
    
    return (
      <View style={[styles.promoCard, { backgroundColor: colors.card, shadowColor: colors.border }]}>
        <Image source={{ uri: item.image }} style={styles.promoImage} />
        
        <View style={styles.promoContent}>
          <View style={styles.promoHeader}>
            <Text style={[styles.promoTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
            <TouchableOpacity style={styles.moreBtn}>
              <MoreVertical color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.promoDiscount, { color: colors.primary }]}>{item.discount}</Text>
          
          <View style={styles.promoFooter}>
            <View style={styles.footerItem}>
              <Clock color={colors.textSecondary} size={14} />
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>{item.expiry}</Text>
            </View>
          </View>
        </View>

        {/* Status Badge */}
        <View style={[
          styles.statusBadge, 
          { backgroundColor: isActive ? '#10b981' : colors.textSecondary }
        ]}>
          <Text style={styles.statusText}>{isActive ? 'Activa' : 'Inactiva'}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Tus Promociones</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Gestiona tus ofertas activas e historial.</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 12 }]}>Cargando promociones...</Text>
        </View>
      ) : promociones.length === 0 ? (
        <View style={styles.centerState}>
          <Image 
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1157/1157077.png' }} 
            style={{ width: 100, height: 100, opacity: 0.5, marginBottom: 16 }} 
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No tienes promociones</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Empieza a crear ofertas para atraer clientes a tu negocio.</Text>
        </View>
      ) : (
        <FlatList
          data={promociones}
          keyExtractor={(item) => item.id}
          renderItem={renderPromo}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <LinearGradient
          colors={[colors.primary, '#ea580c']}
          style={styles.fabGradient}
        >
          <Plus color="white" size={28} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  promoCard: {
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  promoImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  promoContent: {
    padding: 16,
  },
  promoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  moreBtn: {
    padding: 4,
  },
  promoDiscount: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  promoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  footerText: {
    fontSize: 12,
    marginLeft: 4,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
