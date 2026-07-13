import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  User, 
  Ticket, 
  Heart, 
  Bell, 
  Settings, 
  Shield, 
  HelpCircle, 
  FileText, 
  LogOut,
  ChevronRight
} from 'lucide-react-native';
import { colors } from '@/app/theme/colors';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas cerrar tu sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Cerrar Sesión", style: "destructive", onPress: () => logout() }
      ]
    );
  };

  const MenuItem = ({ icon: Icon, title, iconColor, iconBg }: any) => (
    <TouchableOpacity style={styles.menuItem}>
      <View style={[styles.menuIconContainer, { backgroundColor: iconBg }]}>
        <Icon color={iconColor} size={20} />
      </View>
      <Text style={styles.menuItemText}>{title}</Text>
      <ChevronRight color={colors.textSecondary} size={20} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <LinearGradient
          colors={[colors.primary, '#f97316', '#ea580c']}
          style={[styles.headerGradient, { paddingTop: insets.top + 20 }]}
        >
          <Text style={styles.headerTitle}>Perfil</Text>
          <Text style={styles.headerSubtitle}>Administra tu cuenta</Text>
        </LinearGradient>

        {/* User Card */}
        <View style={styles.userCardWrapper}>
          <View style={styles.userCard}>
            <View style={styles.userInfoTop}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150' }}
                style={styles.avatar}
              />
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user?.displayName || "Juan Pérez"}</Text>
                <Text style={styles.userEmail}>{user?.email || "juan.perez@email.com"}</Text>
              </View>
              <TouchableOpacity style={styles.editButton}>
                <User color={colors.primary} size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.statsDivider} />

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>12</Text>
                <Text style={styles.statLabel}>Tickets</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>8</Text>
                <Text style={styles.statLabel}>Favoritos</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>24</Text>
                <Text style={styles.statLabel}>Canjeados</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu Section 1 */}
        <View style={styles.menuSection}>
          <MenuItem 
            icon={Ticket} title="Mis Tickets" 
            iconColor={colors.primary} iconBg="#FFF5F3" 
          />
          <View style={styles.menuDivider} />
          <MenuItem 
            icon={Heart} title="Favoritos" 
            iconColor={colors.danger} iconBg="#FEF2F2" 
          />
          <View style={styles.menuDivider} />
          <MenuItem 
            icon={Bell} title="Notificaciones" 
            iconColor="#3B82F6" iconBg="#EFF6FF" 
          />
        </View>

        <Text style={styles.sectionHeader}>Configuración</Text>

        {/* Menu Section 2 */}
        <View style={styles.menuSection}>
          <MenuItem 
            icon={Settings} title="Configuración" 
            iconColor={colors.textSecondary} iconBg="#F3F4F6" 
          />
          <View style={styles.menuDivider} />
          <MenuItem 
            icon={Shield} title="Privacidad y seguridad" 
            iconColor={colors.textSecondary} iconBg="#F3F4F6" 
          />
          <View style={styles.menuDivider} />
          <MenuItem 
            icon={HelpCircle} title="Ayuda y soporte" 
            iconColor={colors.textSecondary} iconBg="#F3F4F6" 
          />
          <View style={styles.menuDivider} />
          <MenuItem 
            icon={FileText} title="Términos y condiciones" 
            iconColor={colors.textSecondary} iconBg="#F3F4F6" 
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut color={colors.danger} size={20} style={styles.logoutIcon} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Promo Cerca v1.0.0</Text>
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
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingHorizontal: 24,
    paddingBottom: 80,
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
  userCardWrapper: {
    paddingHorizontal: 24,
    marginTop: -60,
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  userInfoTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#F3F4F6',
  },
  userDetails: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  userEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  editButton: {
    padding: 8,
  },
  statsDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  menuSection: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 24,
    marginTop: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 72,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textSecondary,
    marginLeft: 32,
    marginTop: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 24,
    marginTop: 24,
    padding: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 24,
  },
});
