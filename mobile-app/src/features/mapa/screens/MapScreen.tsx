import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SlidersHorizontal, MapPin, Navigation } from 'lucide-react-native';
import { colors } from '@/app/theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MapScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Background Grid Simulation */}
      <View style={styles.gridBackground}>
        {Array.from({ length: 40 }).map((_, i) => (
          <View key={`v-${i}`} style={[styles.gridLine, styles.gridLineVertical, { left: i * 40 }]} />
        ))}
        {Array.from({ length: 40 }).map((_, i) => (
          <View key={`h-${i}`} style={[styles.gridLine, styles.gridLineHorizontal, { top: i * 40 }]} />
        ))}
      </View>

      {/* Top Search Bar */}
      <View style={[styles.topBarContainer, { paddingTop: insets.top + 20 }]}>
        <View style={styles.searchBox}>
          <TextInput 
            placeholder="Buscando promociones cerca"
            placeholderTextColor={colors.textSecondary}
            style={styles.searchInput}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <SlidersHorizontal color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      {/* Map Pins (Simulated) */}
      <View style={[styles.pinContainer, { top: 200, left: 60 }]}>
        <View style={styles.pinBadge}>
          <Text style={styles.pinText}>50%</Text>
          <Text style={styles.pinText}>OFF</Text>
          <View style={styles.pinTriangle} />
        </View>
      </View>
      
      <View style={[styles.pinContainer, { top: 210, left: 110 }]}>
        <View style={styles.pinBadge}>
          <Text style={styles.pinText}>25%</Text>
          <Text style={styles.pinText}>OFF</Text>
          <View style={styles.pinTriangle} />
        </View>
      </View>

      <View style={[styles.pinContainer, { top: 380, left: 150 }]}>
        <View style={styles.iconPin}>
          <View style={styles.iconPinBadge}>
            <Text style={styles.iconPinText}>2x1</Text>
          </View>
          <MapPin color={colors.primary} size={24} />
        </View>
      </View>

      <View style={[styles.pinContainer, { top: 370, left: 190 }]}>
        <View style={styles.iconPin}>
          <View style={styles.iconPinBadge}>
            <Text style={styles.iconPinText}>3x2</Text>
          </View>
          <MapPin color={colors.primary} size={24} />
        </View>
      </View>

      <View style={[styles.pinContainer, { top: 520, left: 220 }]}>
        <View style={styles.pinBadge}>
          <Text style={styles.pinText}>40%</Text>
          <Text style={styles.pinText}>OFF</Text>
          <View style={styles.pinTriangle} />
        </View>
      </View>

      <View style={[styles.pinContainer, { top: 680, left: 300 }]}>
        <View style={styles.pinBadge}>
          <Text style={styles.pinText}>30%</Text>
          <Text style={styles.pinText}>OFF</Text>
          <View style={styles.pinTriangle} />
        </View>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Navigation color={colors.primary} size={24} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FDF4', // Light greenish map tint
  },
  gridBackground: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    opacity: 0.5,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#E2E8F0',
  },
  gridLineVertical: {
    width: 1,
    height: '100%',
  },
  gridLineHorizontal: {
    height: 1,
    width: '100%',
  },
  topBarContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
    height: 52,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  searchInput: {
    fontSize: 15,
    color: colors.text,
  },
  filterButton: {
    width: 52,
    height: 52,
    backgroundColor: 'white',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  pinContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  pinText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    lineHeight: 12,
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
    borderTopColor: colors.primary,
  },
  iconPin: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  iconPinBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  iconPinText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 60,
    height: 60,
    backgroundColor: 'white',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});
