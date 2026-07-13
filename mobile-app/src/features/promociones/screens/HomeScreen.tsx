import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Search, Grid, Utensils, Coffee, MapPin, Heart } from 'lucide-react-native';
import { colors } from '@/app/theme/colors';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Dummy Data
const categories = [
  { id: '1', name: 'Todos', icon: Grid, active: true },
  { id: '2', name: 'Restaurantes', icon: Utensils, active: false },
  { id: '3', name: 'Cafeterías', icon: Coffee, active: false },
];

const promotions = [
  {
    id: '1',
    store: 'Café Aroma',
    title: '2x1 en cafés especiales',
    discount: '50% OFF',
    distance: '0.3 km',
    expiry: 'Válido hasta 29/7/2026',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=600&h=400',
  },
  {
    id: '2',
    store: 'Pizza Nostra',
    title: 'Pizza familiar a mitad de precio',
    discount: '50% OFF',
    distance: '1.2 km',
    expiry: 'Válido hasta hoy',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600&h=400',
  }
];

export default function HomeScreen() {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  
  // Extraer nombre del displayName, o del email antes del @, o usar default
  let userName = "Juan Pérez";
  if (user?.displayName) {
    userName = user.displayName;
  } else if (user?.email) {
    userName = user.email.split('@')[0];
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        
        {/* Header Gradient */}
        <LinearGradient
          colors={[colors.primary, '#f97316', '#ea580c']}
          style={[styles.headerGradient, { paddingTop: insets.top + 20 }]}
        >
          {/* Top Bar (Avatar & Bell) */}
          <View style={styles.headerTop}>
            <View style={styles.userInfo}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150' }}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.greeting}>Hola,</Text>
                <Text style={styles.userName}>{userName}</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.notificationBtn}>
              <Bell color="white" size={24} />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Search color={colors.textSecondary} size={20} style={styles.searchIcon} />
            <TextInput 
              placeholder="Buscar promociones..."
              placeholderTextColor={colors.textSecondary}
              style={styles.searchInput}
            />
          </View>
        </LinearGradient>

        {/* Categories (Overlapping header) */}
        <View style={styles.categoriesWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContent}>
            {categories.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={[styles.categoryCard, cat.active && styles.categoryCardActive]}
                activeOpacity={0.8}
              >
                <cat.icon color={cat.active ? 'white' : colors.textSecondary} size={28} />
                <Text style={[styles.categoryText, cat.active && styles.categoryTextActive]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Map Promo Card */}
        <TouchableOpacity style={styles.mapCard} activeOpacity={0.8}>
          <View style={styles.mapIconContainer}>
            <MapPin color={colors.primary} size={24} />
          </View>
          <View style={styles.mapCardText}>
            <Text style={styles.mapCardTitle}>Ver mapa de promociones</Text>
            <Text style={styles.mapCardSubtitle}>Explora ofertas cerca de ti</Text>
          </View>
        </TouchableOpacity>

        {/* Promociones Destacadas Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Promociones Destacadas</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.promotionsContainer}>
          {promotions.map(promo => (
            <TouchableOpacity key={promo.id} style={styles.promoCard} activeOpacity={0.9}>
              {/* Image Section */}
              <View style={styles.promoImageContainer}>
                <Image source={{ uri: promo.image }} style={styles.promoImage} />
                
                {/* Overlay Elements */}
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{promo.discount}</Text>
                </View>
                
                <TouchableOpacity style={styles.heartButton}>
                  <Heart color={colors.textSecondary} size={20} />
                </TouchableOpacity>

                <View style={styles.distancePill}>
                  <MapPin color={colors.textSecondary} size={12} />
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

        {/* Bottom padding for tab bar */}
        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Light grey almost white
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
    backgroundColor: colors.danger,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
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
    color: colors.text,
  },
  categoriesWrapper: {
    marginTop: -40, // Negative margin to overlap the header
  },
  categoriesContent: {
    paddingHorizontal: 24,
    gap: 16,
  },
  categoryCard: {
    backgroundColor: 'white',
    width: 100,
    height: 100,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 8,
  },
  categoryCardActive: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  categoryTextActive: {
    color: 'white',
  },
  mapCard: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mapCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  mapCardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
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
    color: colors.text,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  promotionsContainer: {
    paddingHorizontal: 24,
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
