import React from "react";
import { View, TextInput, Text, StyleSheet, TextInputProps } from "react-native";
import { useTheme } from "@/app/theme/ThemeContext";

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  icon,
  rightIcon,
  style,
  ...props
}: InputProps) {
  const { colors } = useTheme();
  
  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          { 
            borderColor: colors.border,
            backgroundColor: colors.inputBackground 
          },
          error ? { borderColor: colors.danger } : null,
          style,
        ]}
      >
        {icon && <View style={styles.leftIcon}>{icon}</View>}
        
        <TextInput
          style={[
            styles.input,
            { color: colors.text },
            icon ? styles.inputWithLeftIcon : null,
            rightIcon ? styles.inputWithRightIcon : null,
          ]}
          placeholderTextColor={colors.textSecondary}
          {...props}
        />
        
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>

      {error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
  },
  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputWithLeftIcon: {
    paddingLeft: 40,
  },
  inputWithRightIcon: {
    paddingRight: 40,
  },
  leftIcon: {
    position: "absolute",
    left: 12,
    zIndex: 1,
    justifyContent: "center",
  },
  rightIcon: {
    position: "absolute",
    right: 12,
    zIndex: 1,
    justifyContent: "center",
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});
