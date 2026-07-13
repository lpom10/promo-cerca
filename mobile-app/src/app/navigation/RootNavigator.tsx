import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";
import { useAuthStore } from "../store/useAuthStore";
import { colors } from "../theme/colors";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuth, isInitialized, initializeAuthListener } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    return () => unsubscribe();
  }, []);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuth ? (
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
        />
      ) : (
        <Stack.Screen
          name="Main"
          component={MainNavigator}
        />
      )}
    </Stack.Navigator>
  );
}