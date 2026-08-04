import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Search, Grid, Utensils, Shirt, HeartPulse, Laptop, Film, Wrench, MapPin, Heart } from 'lucide-react-native';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePromociones } from '@/features/promociones/hooks/usePromociones';
import { useTheme } from '@/app/theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useFavorites } from '@/features/favoritos/hooks/useFavorites';

// Constants for Categories
const CATEGORIES = [
  { id: 'todos', name: 'Todos', icon: Grid },
  { id: 'restaurantes', name: 'Gastronomía', icon: Utensils },
  { id: 'moda_accesorios', name: 'Moda y Accesorios', icon: Shirt },
  { id: 'salud_belleza', name: 'Salud y Belleza', icon: HeartPulse },
  { id: 'tecnologia', name: 'Tecnología', icon: Laptop },
  { id: 'entretenimiento', name: 'Entretenimiento', icon: Film },
  { id: 'servicios', name: 'Servicios', icon: Wrench },
];

export default function HomeScreen() {
  const { user, isAuth } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { promociones, isLoading } = usePromociones();
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { toggleFavorite, isFavorite } = useFavorites();
  
  // State for filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('todos');
  
  // Extraer nombre del displayName, o del email antes del @
  let userName = "Invitado";
  if (isAuth && user) {
    if (user.displayName) {
      userName = user.displayName;
    } else if (user.email) {
      userName = user.email.split('@')[0];
    } else {
      userName = "Usuario";
    }
  }

  // Filtrar las promociones
  const filteredPromociones = useMemo(() => {
    return promociones.filter(promo => {
      const matchesSearch = promo.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            promo.store.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'todos' || promo.categoria === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [promociones, searchQuery, activeCategory]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Header Gradient */}
        <LinearGradient
          colors={[colors.primary, '#f97316', '#ea580c']}
          style={[styles.headerGradient, { paddingTop: insets.top + 20 }]}
        >
          {/* Top Bar (Avatar & Bell) */}
          <View style={styles.headerTop}>
            <View style={styles.userInfo}>
              {isAuth ? (
                <Image 
                  source={{ uri: user?.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150' }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>?</Text>
                </View>
              )}
              <View>
                <Text style={styles.greeting}>Hola,</Text>
                <Text style={styles.userName}>{userName}</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.notificationBtn}>
              <Bell color="white" size={24} />
              <View style={[styles.notificationBadge, { backgroundColor: colors.danger, borderColor: colors.primary }]} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
            <Search color={colors.textSecondary} size={20} style={styles.searchIcon} />
            <TextInput 
              placeholder="Buscar promociones..."
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </LinearGradient>

        {/* Categories (Overlapping header) */}
        <View style={styles.categoriesWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContent}>
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <TouchableOpacity 
                  key={cat.id} 
                  style={[
                    styles.categoryCard, 
                    { backgroundColor: colors.card, shadowColor: colors.border },
                    isActive && { backgroundColor: colors.primary }
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setActiveCategory(cat.id)}
                >
                  <cat.icon color={isActive ? 'white' : colors.textSecondary} size={28} />
                  <Text style={[styles.categoryText, { color: colors.textSecondary }, isActive && styles.categoryTextActive]}>{cat.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Map Promo Card */}
        <TouchableOpacity 
          style={[styles.mapCard, { backgroundColor: colors.card, shadowColor: colors.border }]} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Map')}
        >
          <View style={[styles.mapIconContainer, { backgroundColor: colors.accent }]}>
            <MapPin color={colors.primary} size={24} />
          </View>
          <View style={styles.mapCardText}>
            <Text style={[styles.mapCardTitle, { color: colors.text }]}>Ver mapa de promociones</Text>
            <Text style={[styles.mapCardSubtitle, { color: colors.textSecondary }]}>Explora ofertas cerca de ti</Text>
          </View>
        </TouchableOpacity>

        {/* Promociones Destacadas Section */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Promociones Destacadas</Text>
          <TouchableOpacity>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 12, color: colors.textSecondary }}>Cargando promociones...</Text>
          </View>
        ) : filteredPromociones.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No se encontraron promociones.</Text>
          </View>
        ) : (
          <View style={styles.promotionsContainer}>
            {filteredPromociones.map(promo => (
              <TouchableOpacity 
                key={promo.id} 
                style={[styles.promoCard, { backgroundColor: colors.card, shadowColor: colors.border }]} 
                activeOpacity={0.9}
                onPress={() => navigation.navigate('PromoDetail', { promo })}
              >
                {/* Image Section */}
                <View style={styles.promoImageContainer}>
                  <Image source={{ uri: promo.image }} style={styles.promoImage} />
                  
                  {/* Overlay Elements */}
                  <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.discountText}>{promo.discount}</Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.heartButton, { backgroundColor: colors.card, shadowColor: colors.border }]}
                    onPress={() => toggleFavorite(promo.id)}
                  >
                    <Heart color={isFavorite(promo.id) ? colors.primary : colors.textSecondary} size={20} fill={isFavorite(promo.id) ? colors.primary : 'transparent'} />
                  </TouchableOpacity>

                  <View style={[styles.distancePill, { backgroundColor: colors.card }]}>
                    <MapPin color={colors.textSecondary} size={12} />
                    <Text style={[styles.distanceText, { color: colors.textSecondary }]}>{promo.distance}</Text>
                  </View>
                </View>

                {/* Info Section */}
                <View style={styles.promoInfo}>
                  <Text style={[styles.storeName, { color: colors.textSecondary }]}>{promo.store}</Text>
                  <Text style={[styles.promoTitle, { color: colors.text }]} numberOfLines={1}>{promo.title}</Text>
                  <Text style={[styles.expiryText, { color: colors.textSecondary }]}>{promo.expiry}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bottom padding for tab bar */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingHorizontal: 24,
    paddingBottom: 60, // Extra space for overlap
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  greeting: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
  },
  userName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  categoriesWrapper: {
    marginTop: -40, // Negative margin to overlap the header
  },
  categoriesContent: {
    paddingHorizontal: 24,
    gap: 16,
  },
  categoryCard: {
    width: 100,
    height: 100,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 8,
  },
  categoryText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: 'white',
  },
  mapCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    elevation: 3,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mapCardText: {
    flex: 1,
  },
  mapCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapCardSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  promotionsContainer: {
    paddingHorizontal: 24,
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
