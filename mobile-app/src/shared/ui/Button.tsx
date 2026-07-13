import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from "react-native";
import { colors } from "@/app/theme/colors";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
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
  const isOutlineOrGhost = variant === "outline" || variant === "ghost";

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={isOutlineOrGhost ? colors.primary : "white"} />
      ) : (
        <Text
          style={[
            styles.text,
            isOutlineOrGhost && styles.textOutlineOrGhost,
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
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.textSecondary,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  textOutlineOrGhost: {
    color: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});
