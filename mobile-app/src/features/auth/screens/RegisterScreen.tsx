import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { UserPlus, Mail, Lock, Eye, EyeOff, User, Phone, CreditCard, Building2, MapPin, Tag } from 'lucide-react-native';
import { colors } from '@/app/theme/colors';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '@/app/store/useAuthStore';
import { validarEmail, validarPassword, validarTelefono, validarCedula, validarRuc, sanitizarNumero } from '@/shared/utils/validators';

const CATEGORIAS = [
  'Restaurantes', 'Cafeterías', 'Ropa y Accesorios', 'Tecnología', 'Salud y Belleza', 'Entretenimiento', 'Supermercados', 'Otros'
];

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { register } = useAuthStore();
  
  const [tipo, setTipo] = useState<'cliente' | 'empresa'>('cliente');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    cedula: '', // Solo cliente
    negocio: '', // Solo empresa
    categoria: '', // Solo empresa
    direccion: '', // Solo empresa
    ruc: '', // Solo empresa
  });

  const handleChange = (name: string, value: string) => {
    let newValue = value;
    if (['cedula', 'ruc', 'telefono'].includes(name)) {
      newValue = sanitizarNumero(value);
    }
    setForm(prev => ({ ...prev, [name]: newValue }));
  };

  const handleRegister = async () => {
    // 1. Validaciones Básicas
    if (!form.nombre.trim() || !form.email.trim() || !form.password || !form.confirmPassword || !form.telefono.trim()) {
      Alert.alert("Error", "Por favor completa los campos básicos obligatorios.");
      return;
    }
    if (!validarEmail(form.email)) {
      Alert.alert("Error", "El correo electrónico es inválido.");
      return;
    }
    const passVal = validarPassword(form.password);
    if (!passVal.valida) {
      Alert.alert("Error", passVal.error);
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }
    if (!validarTelefono(form.telefono)) {
      Alert.alert("Error", "El teléfono debe tener 10 dígitos.");
      return;
    }

    // 2. Validaciones Específicas
    if (tipo === 'cliente') {
      if (!form.cedula.trim()) {
        Alert.alert("Error", "La cédula es obligatoria.");
        return;
      }
      if (!validarCedula(form.cedula)) {
        Alert.alert("Error", "La cédula ingresada es inválida.");
        return;
      }
    } else {
      if (!form.negocio.trim() || !form.ruc.trim() || !form.categoria) {
        Alert.alert("Error", "Faltan datos del negocio (Nombre, RUC o Categoría).");
        return;
      }
      if (!validarRuc(form.ruc)) {
        Alert.alert("Error", "El RUC ingresado es inválido.");
        return;
      }
    }

    // 3. Registro
    try {
      setIsRegistering(true);
      const cleanForm = {
        ...form,
        email: form.email.trim()
      };
      
      await register(tipo, cleanForm);
      setIsRegistering(false);
      
      if (tipo === 'empresa') {
        Alert.alert("¡Registro Exitoso!", "Tu cuenta de empresa ha sido creada y está pendiente de aprobación. Podrás configurar tu ubicación más tarde.");
      }
      navigation.navigate("Main");
    } catch (error: any) {
      setIsRegistering(false);
      let errorMessage = "No se pudo crear la cuenta.";
      if (error.code === 'auth/email-already-in-use') errorMessage = "El correo electrónico ya está en uso.";
      else if (error.code === 'auth/invalid-email') errorMessage = "El formato del correo es inválido.";
      else if (error.message) errorMessage = error.message; // Mensajes custom de useAuthStore (duplicados)
      
      Alert.alert("Error", errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} keyboardShouldPersistTaps="handled">
        <LinearGradient
          colors={[colors.primary, '#f97316', '#ea580c']}
          style={styles.headerGradient}
        >
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <UserPlus color={colors.primary} size={48} />
            </View>
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>
              {tipo === 'empresa' ? 'Haz crecer tu negocio' : 'Regístrate para descubrir promociones'}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.formContainer}>
          <View style={styles.formCard}>
            
            {/* Tabs Selector */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity 
                style={[styles.tab, tipo === 'cliente' && styles.tabActive]}
                onPress={() => setTipo('cliente')}
              >
                <Text style={[styles.tabText, tipo === 'cliente' && styles.tabTextActive]}>Cliente</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tab, tipo === 'empresa' && styles.tabActive]}
                onPress={() => setTipo('empresa')}
              >
                <Text style={[styles.tabText, tipo === 'empresa' && styles.tabTextActive]}>Empresa</Text>
              </TouchableOpacity>
            </View>

            {/* Common Fields */}
            <Input
              label="Nombre completo"
              placeholder="Tu nombre y apellido"
              value={form.nombre}
              onChangeText={(v) => handleChange('nombre', v)}
              icon={<User color={colors.textSecondary} size={20} />}
            />

            <Input
              label="Correo electrónico"
              placeholder="tu@email.com"
              value={form.email}
              onChangeText={(v) => handleChange('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Mail color={colors.textSecondary} size={20} />}
            />

            <Input
              label="Teléfono"
              placeholder="0991234567"
              value={form.telefono}
              onChangeText={(v) => handleChange('telefono', v)}
              keyboardType="numeric"
              maxLength={10}
              icon={<Phone color={colors.textSecondary} size={20} />}
            />

            {/* Cliente Fields */}
            {tipo === 'cliente' && (
              <Input
                label="Cédula"
                placeholder="Ingresa tu cédula (10 dígitos)"
                value={form.cedula}
                onChangeText={(v) => handleChange('cedula', v)}
                keyboardType="numeric"
                maxLength={10}
                icon={<CreditCard color={colors.textSecondary} size={20} />}
              />
            )}

            {/* Empresa Fields */}
            {tipo === 'empresa' && (
              <View style={styles.empresaSection}>
                <View style={styles.divider}>
                  <View style={styles.line} />
                  <Text style={styles.dividerText}>Datos del negocio</Text>
                  <View style={styles.line} />
                </View>

                <Input
                  label="Nombre del negocio"
                  placeholder="El nombre de tu empresa"
                  value={form.negocio}
                  onChangeText={(v) => handleChange('negocio', v)}
                  icon={<Building2 color={colors.textSecondary} size={20} />}
                />
                
                <Input
                  label="RUC"
                  placeholder="Tu RUC (13 dígitos)"
                  value={form.ruc}
                  onChangeText={(v) => handleChange('ruc', v)}
                  keyboardType="numeric"
                  maxLength={13}
                  icon={<CreditCard color={colors.textSecondary} size={20} />}
                />

                <Input
                  label="Dirección (opcional)"
                  placeholder="Ej. Av. Principal 123"
                  value={form.direccion}
                  onChangeText={(v) => handleChange('direccion', v)}
                  icon={<MapPin color={colors.textSecondary} size={20} />}
                />

                <Text style={styles.label}>Categoría</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
                  {CATEGORIAS.map((cat) => (
                    <TouchableOpacity 
                      key={cat}
                      style={[styles.catBadge, form.categoria === cat && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                      onPress={() => handleChange('categoria', cat)}
                    >
                      <Text style={[styles.catText, form.categoria === cat && { color: 'white' }]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Passwords */}
            <Input
              label="Contraseña"
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChangeText={(v) => handleChange('password', v)}
              secureTextEntry={!showPassword}
              icon={<Lock color={colors.textSecondary} size={20} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff color={colors.textSecondary} size={20} /> : <Eye color={colors.textSecondary} size={20} />}
                </TouchableOpacity>
              }
            />

            <Input
              label="Confirmar Contraseña"
              placeholder="Repite tu contraseña"
              value={form.confirmPassword}
              onChangeText={(v) => handleChange('confirmPassword', v)}
              secureTextEntry={!showConfirmPassword}
              icon={<Lock color={colors.textSecondary} size={20} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff color={colors.textSecondary} size={20} /> : <Eye color={colors.textSecondary} size={20} />}
                </TouchableOpacity>
              }
            />

            <View style={styles.buttonContainer}>
              <Button title="Registrarse" onPress={handleRegister} isLoading={isRegistering} />
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
    paddingTop: 60,
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
    paddingHorizontal: 20,
    marginTop: -32,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
  },
  empresaSection: {
    marginTop: 10,
    marginBottom: 10,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 10,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  categoriesScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  catBadge: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: colors.background,
  },
  catText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  buttonContainer: {
    marginTop: 24,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 40,
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
