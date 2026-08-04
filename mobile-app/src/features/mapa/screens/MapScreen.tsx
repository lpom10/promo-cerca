import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SlidersHorizontal, Navigation } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/app/theme/ThemeContext';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { useLocation } from '@/features/mapa/hooks/useLocation';
import { usePromociones } from '@/features/promociones/hooks/usePromociones';

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { location, isLoading: isLocationLoading } = useLocation();
  const { empresasAgrupadas, isLoading: isPromosLoading } = usePromociones();
  const mapRef = useRef<MapView>(null);

  // Center map on user location when it loads
  useEffect(() => {
    if (Platform.OS !== 'web' && location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [location]);

  const centerOnUser = () => {
    if (Platform.OS !== 'web' && location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  // Default region for Ecuador (Loja) if location is not available immediately
  const initialRegion = {
    latitude: -3.9931,
    longitude: -79.2042,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MapView
        ref={mapRef}
        style={{ width: '100%', height: '100%' }}
        provider={PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false} // We have a custom FAB
      >
        {empresasAgrupadas.map((empresa) => {
          if (empresa.latitude && empresa.longitude) {
            const promoCount = empresa.promociones.length;
            return (
              <Marker
                key={empresa.id}
                coordinate={{ 
                  latitude: Number(empresa.latitude), 
                  longitude: Number(empresa.longitude) 
                }}
                title={empresa.nombre}
                description={`${promoCount} promociones activas`}
              >
                <View style={[styles.pinBadge, { backgroundColor: empresa.markerColor || colors.primary }]}>
                  <Text style={styles.pinText}>{promoCount}</Text>
                  <View style={[styles.pinTriangle, { borderTopColor: empresa.markerColor || colors.primary }]} />
                </View>
              </Marker>
            );
          }
          return null;
        })}
      </MapView>

      {/* Top Search Bar */}
      <View style={[styles.topBarContainer, { paddingTop: insets.top + 20 }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, shadowColor: colors.border }]}>
          <TextInput 
            placeholder="Buscando promociones cerca"
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
          />
        </View>
        <TouchableOpacity style={[styles.filterButton, { backgroundColor: colors.card, shadowColor: colors.border }]}>
          <SlidersHorizontal color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      {(isLocationLoading || isPromosLoading) && (
        <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Cargando mapa...</Text>
        </View>
      )}

      {/* Floating Action Button for Location */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.card, shadowColor: colors.border }]}
        onPress={centerOnUser}
      >
        <Navigation color={colors.primary} size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    zIndex: 1,
  },
  searchBox: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
    height: 52,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchInput: {
    fontSize: 15,
  },
  filterButton: {
    width: 52,
    height: 52,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  pinBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  pinText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 12,
    textAlign: 'center',
  },
  pinTriangle: {
    position: 'absolute',
    bottom: -6,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    zIndex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '500',
  }
});
