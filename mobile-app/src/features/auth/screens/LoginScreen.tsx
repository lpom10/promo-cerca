import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Tag, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { colors } from '@/app/theme/colors';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/app/store/useAuthStore';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor ingresa tu correo y contraseña.");
      return;
    }
    
    try {
      await login(email, password);
    } catch (error: any) {
      // Firebase auth error handling
      let errorMessage = "No se pudo iniciar sesión.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = "Correo o contraseña incorrectos.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "El formato del correo es inválido.";
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
              <Tag color={colors.primary} size={48} />
            </View>
            <Text style={styles.title}>Bienvenido</Text>
            <Text style={styles.subtitle}>Inicia sesión para descubrir promociones</Text>
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

            <TouchableOpacity style={styles.forgotPasswordContainer}>
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <Button title="Iniciar Sesión" onPress={handleLogin} isLoading={isLoading} />
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerText}>Regístrate</Text>
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
  forgotPasswordContainer: {
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
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
