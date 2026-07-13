import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MapPin } from 'lucide-react-native';
import { colors } from '@/app/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const favorites = [
  {
    id: '1',
    store: 'Pizza Napolitana',
    title: 'Pizza familiar gratis',
    discount: '2x1',
    distance: '0.8 km',
    expiry: 'Válido hasta 14/7/2026',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600&h=400',
  },
  {
    id: '2',
    store: 'Fashion Store',
    title: 'Descuento en ropa de temporada',
    discount: '30% OFF',
    distance: '0.5 km',
    expiry: 'Válido hasta 24/7/2026',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600&h=400',
  }
];

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, '#f97316', '#ea580c']}
        style={[styles.headerGradient, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Heart color="white" size={28} fill="white" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Favoritos</Text>
            <Text style={styles.headerSubtitle}>2 promociones guardadas</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Toca el </Text>
          <Heart color={colors.primary} size={16} fill={colors.primary} />
          <Text style={styles.infoText}> para quitar de favoritos</Text>
        </View>

        <View style={styles.promotionsContainer}>
          {favorites.map(promo => (
            <TouchableOpacity key={promo.id} style={styles.promoCard} activeOpacity={0.9}>
              {/* Image Section */}
              <View style={styles.promoImageContainer}>
                <Image source={{ uri: promo.image }} style={styles.promoImage} />
                
                {/* Overlay Elements */}
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{promo.discount}</Text>
                </View>
                
                <TouchableOpacity style={styles.heartButton}>
                  <Heart color={colors.primary} size={20} fill={colors.primary} />
                </TouchableOpacity>

                <View style={styles.distancePill}>
                  <MapPin color={colors.primary} size={12} />
                  <Text style={styles.distanceText}>{promo.distance}</Text>
                </View>
              </View>

              {/* Info Section */}
              <View style={styles.promoInfo}>
                <Text style={styles.storeName}>{promo.store}</Text>
                <Text style={styles.promoTitle} numberOfLines={1}>{promo.title}</Text>
                <Text style={styles.expiryText}>{promo.expiry}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
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
    paddingBottom: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  promotionsContainer: {
    gap: 20,
  },
  promoCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  promoImageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  promoImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  discountText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  heartButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  distancePill: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  promoInfo: {
    padding: 16,
  },
  storeName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  expiryText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
