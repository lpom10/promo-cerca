import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useTheme } from '@/app/theme/ThemeContext';
import { X, Save, Image as ImageIcon, Tag, Clock, FileText, AlignLeft } from 'lucide-react-native';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import { useAuthStore } from '@/app/store/useAuthStore';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageAsync } from '@/core/firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/core/config/firebase';

interface CreatePromotionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreatePromotionModal = ({ visible, onClose }: CreatePromotionModalProps) => {
  const { colors } = useTheme();
  const { user, userDetails } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    discount: '',
    expiry: '',
    imageUri: '',
  });

  const handleChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      handleChange('imageUri', result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!form.title || !form.description || !form.discount || !form.expiry) {
      Alert.alert('Error', 'Todos los campos son obligatorios.');
      return;
    }
    if (!form.imageUri) {
      Alert.alert('Error', 'Debes subir una imagen para la promoción.');
      return;
    }

    try {
      setIsSaving(true);
      
      // Upload image
      const timestamp = new Date().getTime();
      const imagePath = `promociones/${user?.uid}_${timestamp}.jpg`;
      const downloadUrl = await uploadImageAsync(form.imageUri, imagePath);

      // Create promotion document
      await addDoc(collection(db, 'promociones'), {
        empresaId: user?.uid,
        empresaNombre: userDetails?.negocio || 'Negocio',
        title: form.title,
        description: form.description,
        discount: form.discount,
        expiry: form.expiry,
        image: downloadUrl,
        activa: true,
        createdAt: serverTimestamp(),
      });

      setIsSaving(false);
      Alert.alert('Éxito', 'Promoción creada correctamente.', [
        { text: 'OK', onPress: () => {
          setForm({ title: '', description: '', discount: '', expiry: '', imageUri: '' });
          onClose();
        }}
      ]);
    } catch (error) {
      setIsSaving(false);
      Alert.alert('Error', 'No se pudo crear la promoción.');
      console.error(error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.modalContent, { backgroundColor: colors.background }]}>
          
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>Crear Promoción</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={colors.textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
            
            <TouchableOpacity style={[styles.imagePicker, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={pickImage}>
              {form.imageUri ? (
                <Image source={{ uri: form.imageUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <ImageIcon color={colors.textSecondary} size={40} />
                  <Text style={[styles.imagePlaceholderText, { color: colors.textSecondary }]}>Subir Imagen (16:9)</Text>
                </View>
              )}
            </TouchableOpacity>

            <Input label="Título de Promoción" placeholder="Ej. 2x1 en Hamburguesas" value={form.title} onChangeText={(v) => handleChange('title', v)} icon={<Tag color={colors.textSecondary} size={20} />} />
            <Input label="Descripción" placeholder="Detalles de la oferta" value={form.description} onChangeText={(v) => handleChange('description', v)} icon={<AlignLeft color={colors.textSecondary} size={20} />} multiline numberOfLines={3} />
            <Input label="Descuento (Badge)" placeholder="Ej. 50% OFF" value={form.discount} onChangeText={(v) => handleChange('discount', v)} icon={<FileText color={colors.textSecondary} size={20} />} />
            <Input label="Fecha de Expiración" placeholder="Ej. 2026-12-31" value={form.expiry} onChangeText={(v) => handleChange('expiry', v)} icon={<Clock color={colors.textSecondary} size={20} />} />

          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}>
            <Button title="Publicar Promoción" onPress={handleSave} isLoading={isSaving} icon={<Save color="white" size={20} />} />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { height: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: 'bold' },
  closeBtn: { padding: 4 },
  scrollContent: { padding: 24, paddingBottom: 40 },
  imagePicker: { height: 160, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', overflow: 'hidden', marginBottom: 20, justifyContent: 'center', alignItems: 'center' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { alignItems: 'center' },
  imagePlaceholderText: { marginTop: 8, fontSize: 14 },
  footer: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 34 : 20, borderTopWidth: 1 }
});
