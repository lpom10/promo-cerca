import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MapPin, Lock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/app/theme/ThemeContext';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import { useFavorites } from '@/features/favoritos/hooks/useFavorites';
import { usePromociones } from '@/features/promociones/hooks/usePromociones';

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isAuth } = useAuthStore();
  const navigation = useNavigation<any>();
  const { favorites, toggleFavorite, isFavorite, isLoading: isFavsLoading } = useFavorites();
  const { promociones, isLoading: isPromosLoading } = usePromociones();

  if (!isAuth) {
    return (
      <View style={[styles.unauthContainer, { backgroundColor: colors.background }]}>
        <Lock color={colors.primary} size={48} />
        <Text style={[styles.unauthTitle, { color: colors.text }]}>Inicia Sesión</Text>
        <Text style={[styles.unauthText, { color: colors.textSecondary }]}>
          Debes iniciar sesión para guardar y ver tus promociones favoritas.
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

  // Filtrar promociones que estén en el arreglo de favoritos
  const favoritePromos = promociones.filter(promo => favorites.includes(promo.id));
  const isLoading = isFavsLoading || isPromosLoading;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
            <Text style={styles.headerSubtitle}>{favoritePromos.length} promociones guardadas</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.infoBox, { backgroundColor: colors.card, shadowColor: colors.border }]}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>Toca el </Text>
          <Heart color={colors.primary} size={16} fill={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}> para quitar de favoritos</Text>
        </View>

        {isLoading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 12, color: colors.textSecondary }}>Cargando favoritos...</Text>
          </View>
        ) : favoritePromos.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No tienes promociones favoritas guardadas.</Text>
          </View>
        ) : (
          <View style={styles.promotionsContainer}>
            {favoritePromos.map(promo => (
              <TouchableOpacity key={promo.id} style={[styles.promoCard, { backgroundColor: colors.card, shadowColor: colors.border }]} activeOpacity={0.9}>
                <View style={styles.promoImageContainer}>
                  <Image source={{ uri: promo.image }} style={styles.promoImage} />
                  <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.discountText}>{promo.discount}</Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.heartButton, { backgroundColor: colors.card, shadowColor: colors.border }]}
                    onPress={() => toggleFavorite(promo.id)}
                  >
                    <Heart color={colors.primary} size={20} fill={isFavorite(promo.id) ? colors.primary : 'transparent'} />
                  </TouchableOpacity>
                  <View style={[styles.distancePill, { backgroundColor: colors.card }]}>
                    <MapPin color={colors.primary} size={12} />
                    <Text style={[styles.distanceText, { color: colors.textSecondary }]}>{promo.distance}</Text>
                  </View>
                </View>
                <View style={styles.promoInfo}>
                  <Text style={[styles.storeName, { color: colors.textSecondary }]}>{promo.store}</Text>
                  <Text style={[styles.promoTitle, { color: colors.text }]} numberOfLines={1}>{promo.title}</Text>
                  <Text style={[styles.expiryText, { color: colors.textSecondary }]}>{promo.expiry}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  infoText: {
    fontSize: 14,
  },
  promotionsContainer: {
    gap: 20,
  },
  promoCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
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
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  distancePill: {
    position: 'absolute',
    bottom: 16,
    left: 16,
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
  },
  promoInfo: {
    padding: 16,
  },
  storeName: {
    fontSize: 13,
    marginBottom: 4,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  expiryText: {
    fontSize: 12,
  },
});
