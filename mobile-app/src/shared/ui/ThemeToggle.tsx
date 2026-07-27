import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Sun, Moon } from "lucide-react-native";
import { useTheme } from "@/app/theme/ThemeContext";

export function ThemeToggle() {
  const { isDark, toggleTheme, colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[
        styles.container,
        { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
      ]}
      activeOpacity={0.7}
    >
      {isDark ? (
        <Sun color={colors.foreground} size={24} />
      ) : (
        <Moon color={colors.foreground} size={24} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
