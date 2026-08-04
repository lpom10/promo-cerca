import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useTheme } from '@/app/theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScanLine, Search, CheckCircle2, XCircle } from 'lucide-react-native';
import { Button } from '@/shared/ui/Button';
import { CameraView, Camera } from 'expo-camera';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/core/config/firebase';

export default function CanjeTicketsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [ticketCode, setTicketCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };
    getCameraPermissions();
  }, []);

  const verifyTicketInFirestore = async (code: string) => {
    setIsVerifying(true);
    setResult(null);

    try {
      const ticketRef = doc(db, 'redemptions', code);
      const ticketDoc = await getDoc(ticketRef);

      if (ticketDoc.exists()) {
        const data = ticketDoc.data();
        if (data.status === 'PENDING') {
          await updateDoc(ticketRef, { status: 'REDEEMED' });
          setResult('success');
        } else {
          setResult('error'); // Ya fue canjeado o expirado
        }
      } else {
        setResult('error');
      }
    } catch (error) {
      console.error("Error verifying ticket:", error);
      setResult('error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerify = () => {
    if (!ticketCode.trim()) return;
    verifyTicketInFirestore(ticketCode);
  };

  const handleScan = () => {
    if (hasPermission === null) {
      Alert.alert("Permisos de cámara", "Solicitando permisos de cámara...");
      return;
    }
    if (hasPermission === false) {
      Alert.alert("Permisos de cámara", "No hay acceso a la cámara. Habilita los permisos en la configuración.");
      return;
    }
    setIsScanning(true);
    setScanned(false);
    setResult(null);
  };

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setIsScanning(false);
    setTicketCode(data);
    verifyTicketInFirestore(data);
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView bounces={false} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Canjear Ticket</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Escanea el código QR del cliente o ingresa el código manual para validar la promoción.</Text>
        </View>

        {/* Scanner Placeholder */}
        {isScanning ? (
          <View style={[styles.scannerPlaceholder, { overflow: 'hidden', borderWidth: 0 }]}>
            <CameraView 
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
            />
            <TouchableOpacity 
              style={styles.closeScannerButton}
              onPress={() => setIsScanning(false)}
            >
              <XCircle color="white" size={32} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={[styles.scannerPlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={handleScan}
          >
            <View style={[styles.scanIconWrapper, { backgroundColor: colors.primary + '15' }]}>
              <ScanLine color={colors.primary} size={48} />
            </View>
            <Text style={[styles.scanText, { color: colors.primary }]}>Toca para abrir la cámara</Text>
          </TouchableOpacity>
        )}

        <View style={styles.divider}>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>o ingreso manual</Text>
          <View style={[styles.line, { backgroundColor: colors.border }]} />
        </View>

        {/* Manual Entry */}
        <View style={styles.inputContainer}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Search color={colors.textSecondary} size={20} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Ej: TCK-9821"
              placeholderTextColor={colors.textSecondary}
              value={ticketCode}
              onChangeText={(text) => {
                setTicketCode(text.toUpperCase());
                setResult(null);
              }}
              autoCapitalize="characters"
              maxLength={12}
            />
          </View>
          <Button 
            title="Validar" 
            onPress={handleVerify} 
            isLoading={isVerifying} 
            disabled={ticketCode.length < 5}
            style={{ marginTop: 16 }}
          />
        </View>

        {/* Result Area */}
        {result === 'success' && (
          <View style={[styles.resultCard, { backgroundColor: '#10b98115', borderColor: '#10b981' }]}>
            <CheckCircle2 color="#10b981" size={32} />
            <View style={styles.resultTextContainer}>
              <Text style={[styles.resultTitle, { color: '#10b981' }]}>Ticket Válido</Text>
              <Text style={[styles.resultDesc, { color: colors.text }]}>La promoción ha sido aplicada. Puedes entregar el beneficio al cliente.</Text>
            </View>
          </View>
        )}

        {result === 'error' && (
          <View style={[styles.resultCard, { backgroundColor: '#ef444415', borderColor: '#ef4444' }]}>
            <XCircle color="#ef4444" size={32} />
            <View style={styles.resultTextContainer}>
              <Text style={[styles.resultTitle, { color: '#ef4444' }]}>Ticket Inválido</Text>
              <Text style={[styles.resultDesc, { color: colors.text }]}>Este código no existe, ha expirado o ya fue utilizado anteriormente.</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  header: {
    marginBottom: 30,
    marginTop: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  scannerPlaceholder: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 24,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  scanIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scanText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  line: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    height: '100%',
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  resultTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  resultDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeScannerButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 4,
  }
});
