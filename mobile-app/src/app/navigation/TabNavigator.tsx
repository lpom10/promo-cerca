import React from "react";
import { Platform } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home, Map, Ticket, Heart, User, Store, LayoutDashboard, ListPlus, ScanLine } from "lucide-react-native";
import { useTheme } from "@/app/theme/ThemeContext";
import { useAuthStore } from "@/app/store/useAuthStore";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Import Screens (Clientes y Públicas)
import HomeScreen from "@/features/promociones/screens/HomeScreen";
import MapScreen from "@/features/mapa/screens/MapScreen";
import LocalesScreen from "@/features/negocios/screens/LocalesScreen";
import TicketsScreen from "@/features/tickets/screens/TicketsScreen";
import FavoritesScreen from "@/features/favoritos/screens/FavoritesScreen";
import ProfileScreen from "@/features/perfil/screens/ProfileScreen";

// Import Screens (Empresas - Placeholders)
import EmpresaDashboardScreen from "@/features/empresa/screens/EmpresaDashboardScreen";
import GestorPromocionesScreen from "@/features/empresa/screens/GestorPromocionesScreen";
import CanjeTicketsScreen from "@/features/empresa/screens/CanjeTicketsScreen";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { colors } = useTheme();
  const { isAuth, userType } = useAuthStore();
  const insets = useSafeAreaInsets();

  const isEmpresa = isAuth && userType === 'empresa';
  
  // Calculate bottom padding based on safe area
  const paddingBottom = Math.max(insets.bottom, 8);
  const tabHeight = 60 + (Platform.OS === 'ios' ? insets.bottom : paddingBottom - 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.sidebarPrimary,
        tabBarInactiveTintColor: colors.sidebarForeground,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: colors.sidebarBorder,
          height: tabHeight,
          paddingBottom: paddingBottom,
          paddingTop: 8,
          backgroundColor: colors.sidebar,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      {!isEmpresa ? (
        // Rutas Públicas / Cliente
        <>
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              tabBarLabel: "Inicio",
              tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Map"
            component={MapScreen}
            options={{
              tabBarLabel: "Mapa",
              tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Locales"
            component={LocalesScreen}
            options={{
              tabBarLabel: "Locales",
              tabBarIcon: ({ color, size }) => <Store color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Tickets"
            component={TicketsScreen}
            options={{
              tabBarLabel: "Tickets",
              tabBarIcon: ({ color, size }) => <Ticket color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Favorites"
            component={FavoritesScreen}
            options={{
              tabBarLabel: "Favoritos",
              tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />,
            }}
          />
        </>
      ) : (
        // Rutas Empresa
        <>
          <Tab.Screen
            name="Dashboard"
            component={EmpresaDashboardScreen}
            options={{
              tabBarLabel: "Panel",
              tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Promos"
            component={GestorPromocionesScreen}
            options={{
              tabBarLabel: "Promos",
              tabBarIcon: ({ color, size }) => <ListPlus color={color} size={size} />,
            }}
          />
          <Tab.Screen
            name="Canje"
            component={CanjeTicketsScreen}
            options={{
              tabBarLabel: "Escanear",
              tabBarIcon: ({ color, size }) => <ScanLine color={color} size={size} />,
            }}
          />
        </>
      )}

      {/* Perfil siempre está, pero su contenido cambia según isAuth y userType */}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Perfil",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
