import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserPlus, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { colors } from '@/app/theme/colors';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/app/store/useAuthStore';

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { register, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Error", "Por favor completa todos los campos.");
      return;
    }
    
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }
    
    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      await register(email, password);
      // Firebase auth listener handles the navigation to Main automatically
    } catch (error: any) {
      let errorMessage = "No se pudo crear la cuenta.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "El correo electrónico ya está en uso.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "El formato del correo es inválido.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "La contraseña es muy débil.";
      }
      
      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <LinearGradient
          colors={[colors.primary, '#f97316', '#ea580c']}
          style={styles.headerGradient}
        >
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <UserPlus color={colors.primary} size={48} />
            </View>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Regístrate para descubrir promociones</Text>
          </View>
        </LinearGradient>

        <View style={styles.formContainer}>
          <View style={styles.formCard}>
            <Input
              label="Correo electrónico"
              placeholder="tu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Mail color={colors.textSecondary} size={20} />}
            />
            
            <Input
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              icon={<Lock color={colors.textSecondary} size={20} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff color={colors.textSecondary} size={20} />
                  ) : (
                    <Eye color={colors.textSecondary} size={20} />
                  )}
                </TouchableOpacity>
              }
            />

            <Input
              label="Confirmar Contraseña"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              icon={<Lock color={colors.textSecondary} size={20} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? (
                    <EyeOff color={colors.textSecondary} size={20} />
                  ) : (
                    <Eye color={colors.textSecondary} size={20} />
                  )}
                </TouchableOpacity>
              }
            />

            <View style={styles.buttonContainer}>
              <Button title="Registrarse" onPress={handleRegister} isLoading={isLoading} />
            </View>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.registerText}>Inicia Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerGradient: {
    paddingTop: 80,
    paddingBottom: 60,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  iconContainer: {
    alignItems: 'center',
  },
  iconBackground: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    marginTop: 16,
    fontSize: 30,
    color: 'white',
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: -32,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  buttonContainer: {
    marginTop: 24,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  registerText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
