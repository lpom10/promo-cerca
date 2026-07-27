import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { useTheme } from '@/app/theme/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScanLine, Search, CheckCircle2, XCircle } from 'lucide-react-native';
import { Button } from '@/shared/ui/Button';

export default function CanjeTicketsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [ticketCode, setTicketCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);

  const handleVerify = () => {
    if (!ticketCode.trim()) return;
    
    setIsVerifying(true);
    setResult(null);

    // Simulate API call for now
    setTimeout(() => {
      setIsVerifying(false);
      // Fake logic: if it ends with "1", it's valid. Otherwise invalid.
      if (ticketCode.endsWith('1')) {
        setResult('success');
      } else {
        setResult('error');
      }
    }, 1500);
  };

  const handleScan = () => {
    Alert.alert("Escanear QR", "La cámara se abrirá en una futura actualización.");
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
  }
});
