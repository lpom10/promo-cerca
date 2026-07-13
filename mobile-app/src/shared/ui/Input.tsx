import React from "react";
import { View, TextInput, Text, StyleSheet, TextInputProps } from "react-native";
import { colors } from "@/app/theme/colors";

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
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          error ? styles.inputError : null,
          style,
        ]}
      >
        {icon && <View style={styles.leftIcon}>{icon}</View>}
        
        <TextInput
          style={[
            styles.input,
            icon ? styles.inputWithLeftIcon : null,
            rightIcon ? styles.inputWithRightIcon : null,
          ]}
          placeholderTextColor={colors.textSecondary}
          {...props}
        />
        
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB", // Equivalent to Tailwind's gray-200
    borderRadius: 12,
    backgroundColor: "white",
    height: 48,
  },
  inputError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    color: colors.text,
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
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
});
