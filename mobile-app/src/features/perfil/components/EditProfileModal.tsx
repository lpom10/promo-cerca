import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '@/app/theme/ThemeContext';
import { X, Save, User, Phone, Building2, MapPin } from 'lucide-react-native';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { useAuthStore } from '@/app/store/useAuthStore';
import { validarTelefono, sanitizarNumero } from '@/shared/utils/validators';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EditProfileModal = ({ visible, onClose }: EditProfileModalProps) => {
  const { colors } = useTheme();
  const { userType, userDetails, updateProfile } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    negocio: '',
    direccion: '',
  });

  // Pre-fill data
  useEffect(() => {
    if (visible && userDetails) {
      setForm({
        nombre: userDetails.nombre || '',
        telefono: userDetails.telefono || '',
        negocio: userDetails.negocio || '',
        direccion: userDetails.direccion || '',
      });
    }
  }, [visible, userDetails]);

  const handleChange = (name: string, value: string) => {
    let newValue = value;
    if (name === 'telefono') {
      newValue = sanitizarNumero(value);
    }
    setForm(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSave = async () => {
    // Validations
    if (!form.nombre.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío.');
      return;
    }
    if (form.telefono && !validarTelefono(form.telefono)) {
      Alert.alert('Error', 'El teléfono debe tener 10 dígitos.');
      return;
    }
    if (userType === 'empresa' && !form.negocio.trim()) {
      Alert.alert('Error', 'El nombre del negocio no puede estar vacío.');
      return;
    }

    try {
      setIsSaving(true);
      
      const updateData: any = {
        nombre: form.nombre.trim(),
        telefono: form.telefono,
      };

      if (userType === 'empresa') {
        updateData.negocio = form.negocio.trim();
        updateData.direccion = form.direccion.trim();
      }

      await updateProfile(updateData);
      
      setIsSaving(false);
      Alert.alert('Éxito', 'Tu perfil ha sido actualizado correctamente.', [
        { text: 'OK', onPress: onClose }
      ]);
    } catch (error) {
      setIsSaving(false);
      Alert.alert('Error', 'No se pudo guardar la información. Intenta de nuevo.');
      console.error(error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalContent, { backgroundColor: colors.background }]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Editar Perfil</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={colors.textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView contentContainerStyle={styles.scrollContent} bounces={false} keyboardShouldPersistTaps="handled">
            
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.primary }]}>Información Personal</Text>
              
              <Input
                label="Nombre Completo"
                placeholder="Tu nombre"
                value={form.nombre}
                onChangeText={(v) => handleChange('nombre', v)}
                icon={<User color={colors.textSecondary} size={20} />}
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
            </View>

            {userType === 'empresa' && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.primary }]}>Datos del Negocio</Text>
                
                <Input
                  label="Nombre del Negocio"
                  placeholder="Ej. Mi Tienda"
                  value={form.negocio}
                  onChangeText={(v) => handleChange('negocio', v)}
                  icon={<Building2 color={colors.textSecondary} size={20} />}
                />
                <Input
                  label="Dirección"
                  placeholder="Ej. Av. Principal 123"
                  value={form.direccion}
                  onChangeText={(v) => handleChange('direccion', v)}
                  icon={<MapPin color={colors.textSecondary} size={20} />}
                />
              </View>
            )}

            {/* Read Only Note */}
            <Text style={[styles.note, { color: colors.textSecondary }]}>
              * Los campos como Correo Electrónico, Cédula o RUC no pueden modificarse desde aquí por seguridad.
            </Text>

          </ScrollView>

          {/* Footer Action */}
          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
            <Button 
              title="Guardar Cambios" 
              onPress={handleSave} 
              isLoading={isSaving} 
              icon={<Save color="white" size={20} />}
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  note: {
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
  }
});
