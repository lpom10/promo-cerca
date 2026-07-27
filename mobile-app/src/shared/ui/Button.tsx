import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from "react-native";
import { useTheme } from "@/app/theme/ThemeContext";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  isLoading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme();
  const isOutlineOrGhost = variant === "outline" || variant === "ghost";

  // Determinar colores basados en la variante
  let bgColor;
  let textColor = colors.primaryForeground;
  let borderColor;

  switch (variant) {
    case "primary":
      bgColor = colors.primary;
      textColor = colors.primaryForeground;
      break;
    case "secondary":
      bgColor = colors.secondary;
      textColor = colors.secondaryForeground;
      break;
    case "destructive":
      bgColor = colors.destructive;
      textColor = colors.destructiveForeground;
      break;
    case "outline":
      bgColor = "transparent";
      borderColor = colors.primary;
      textColor = colors.primary;
      break;
    case "ghost":
      bgColor = "transparent";
      textColor = colors.primary;
      break;
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bgColor },
        borderColor ? { borderWidth: 1, borderColor } : null,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text
          style={[
            styles.text,
            { color: textColor },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  text: {
    fontWeight: "600",
    fontSize: 16,
  },
  disabled: {
    opacity: 0.5,
  },
});
