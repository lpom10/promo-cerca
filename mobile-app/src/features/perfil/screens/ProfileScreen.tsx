import React, { useState } from 'react';
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
  ChevronRight,
  Lock,
  LayoutDashboard,
  Star
} from 'lucide-react-native';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/app/theme/ThemeContext';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';
import { useNavigation } from '@react-navigation/native';
import { EditProfileModal } from '../components/EditProfileModal';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, isAuth, userType, userDetails, logout } = useAuthStore();
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

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
    <TouchableOpacity style={[styles.menuItem, { backgroundColor: colors.card }]}>
      <View style={[styles.menuIconContainer, { backgroundColor: iconBg }]}>
        <Icon color={iconColor} size={20} />
      </View>
      <Text style={[styles.menuItemText, { color: colors.text }]}>{title}</Text>
      <ChevronRight color={colors.textSecondary} size={20} />
    </TouchableOpacity>
  );

  if (!isAuth) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[colors.primary, '#f97316', '#ea580c']}
          style={[styles.headerGradient, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerTitle}>Perfil</Text>
              <Text style={styles.headerSubtitle}>Bienvenido a Promo Cerca</Text>
            </View>
            <ThemeToggle />
          </View>
        </LinearGradient>
        <View style={styles.unauthContent}>
          <Lock color={colors.primary} size={48} />
          <Text style={[styles.unauthTitle, { color: colors.text }]}>Inicia Sesión</Text>
          <Text style={[styles.unauthText, { color: colors.textSecondary }]}>
            Inicia sesión para gestionar tus datos y preferencias.
          </Text>
          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('Auth')}
          >
            <Text style={styles.loginButtonText}>Iniciar Sesión / Registrarse</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Display Name logic
  let displayName = "Usuario";
  let displaySubname = "usuario@email.com";

  if (userType === 'empresa') {
    displayName = userDetails?.negocio || "Empresa";
    displaySubname = "Empresa";
  } else {
    displayName = user?.email || "usuario@email.com";
    displaySubname = "Usuario";
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <LinearGradient
          colors={[colors.primary, '#f97316', '#ea580c']}
          style={[styles.headerGradient, { paddingTop: insets.top + 20 }]}
        >
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.headerTitle}>Perfil</Text>
              <Text style={styles.headerSubtitle}>Administra tu cuenta</Text>
            </View>
            <ThemeToggle />
          </View>
        </LinearGradient>

        {/* User Card */}
        <View style={styles.userCardWrapper}>
          <View style={[styles.userCard, { backgroundColor: colors.card, shadowColor: colors.border }]}>
            <View style={styles.userInfoTop}>
              <Image 
                source={{ uri: userDetails?.foto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150' }}
                style={[styles.avatar, { borderColor: colors.border }]}
              />
              <View style={styles.userDetails}>
                <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
                <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{displaySubname}</Text>
              </View>
              <TouchableOpacity style={styles.editButton} onPress={() => setIsEditModalVisible(true)}>
                <User color={colors.primary} size={20} />
              </TouchableOpacity>
            </View>

            <View style={[styles.statsDivider, { backgroundColor: colors.border }]} />

            {/* Conditionally render stats based on userType */}
            {userType === 'empresa' ? (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>3</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Promos</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>4.8</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}><Star color={colors.textSecondary} size={12}/> Rating</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>142</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Canjes</Text>
                </View>
              </View>
            ) : (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>12</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tickets</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>8</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Favoritos</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: colors.primary }]}>24</Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Canjeados</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Menu Section 1 */}
        <View style={[styles.menuSection, { backgroundColor: colors.card, shadowColor: colors.border }]}>
          {userType === 'empresa' ? (
            <MenuItem 
              icon={LayoutDashboard} title="Panel de Empresa" 
              iconColor={colors.primary} iconBg={colors.accent} 
            />
          ) : (
            <>
              <MenuItem 
                icon={Ticket} title="Mis Tickets" 
                iconColor={colors.primary} iconBg={colors.accent} 
              />
              <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
              <MenuItem 
                icon={Heart} title="Favoritos" 
                iconColor={colors.danger} iconBg={colors.accent} 
              />
            </>
          )}
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          <MenuItem 
            icon={Bell} title="Notificaciones" 
            iconColor="#3B82F6" iconBg={colors.accent} 
          />
        </View>


        <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>Configuración</Text>

        {/* Menu Section 2 */}
        <View style={[styles.menuSection, { backgroundColor: colors.card, shadowColor: colors.border }]}>
          <MenuItem 
            icon={Settings} title="Configuración" 
            iconColor={colors.textSecondary} iconBg={colors.muted} 
          />
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          <MenuItem 
            icon={Shield} title="Privacidad y seguridad" 
            iconColor={colors.textSecondary} iconBg={colors.muted} 
          />
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          <MenuItem 
            icon={HelpCircle} title="Ayuda y soporte" 
            iconColor={colors.textSecondary} iconBg={colors.muted} 
          />
          <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />
          <MenuItem 
            icon={FileText} title="Términos y condiciones" 
            iconColor={colors.textSecondary} iconBg={colors.muted} 
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.card, shadowColor: colors.border }]} onPress={handleLogout}>
          <LogOut color={colors.danger} size={20} style={styles.logoutIcon} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.textSecondary }]}>Promo Cerca v1.0.0</Text>
        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Modal de Edición de Perfil */}
      <EditProfileModal 
        visible={isEditModalVisible} 
        onClose={() => setIsEditModalVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  unauthContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: -80,
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
    paddingBottom: 80,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    borderRadius: 20,
    padding: 24,
    elevation: 4,
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
  },
  userDetails: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  editButton: {
    padding: 8,
  },
  statsDivider: {
    height: 1,
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
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  menuSection: {
    borderRadius: 20,
    marginHorizontal: 24,
    marginTop: 24,
    elevation: 2,
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
  },
  menuDivider: {
    height: 1,
    marginLeft: 72,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 32,
    marginTop: 24,
  },
  logoutButton: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 24,
    padding: 16,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 24,
  },
});
