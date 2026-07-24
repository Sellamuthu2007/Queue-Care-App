import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhoneInput } from '../../components/PhoneInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ErrorMessage } from '../../components/ErrorMessage';
import { validateAndNormalizePhone } from '../../utils/phoneValidation';
import { getErrorMessage } from '../../utils/errorHandling';
import * as authService from '../../services/authService';

export const PhoneAuthScreen = ({ navigation }: any) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    Keyboard.dismiss();
    setError(null);

    const validation = validateAndNormalizePhone(phone);
    if (!validation.isValid || !validation.normalized) {
      setError(validation.error || 'Please enter a valid phone number.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.sendOtp(validation.normalized);
      if (response.exists) {
        // Navigate directly to the password login screen for existing users
        navigation.navigate('Login', { phone: validation.normalized });
      } else {
        // Navigate to the OTP verification screen for new users
        navigation.navigate('OtpVerification', { phone: validation.normalized });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const ScrollViewContent = (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.cardContainer}>
        <View style={styles.header}>
          <Text style={styles.logoText}>Queue Care</Text>
          <Text style={styles.subtitle}>Your healthcare journey, made simpler</Text>
        </View>

        <View style={styles.form}>
          <PhoneInput
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              if (error) setError(null);
            }}
          />

          <ErrorMessage message={error || ''} />

          <PrimaryButton
            title={loading ? 'Sending OTP...' : 'Continue'}
            onPress={handleContinue}
            loading={loading}
            disabled={loading}
            style={styles.button}
          />
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {Platform.OS === 'web' ? (
          <View style={{ flex: 1 }}>{ScrollViewContent}</View>
        ) : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            {ScrollViewContent}
          </TouchableWithoutFeedback>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9', // Soft, clinical light grey background
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderRadius: 24, // Elegant highly rounded corners
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#00796B', // Bold deep emerald teal
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B', // Muted slate grey
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  form: {
    width: '100%',
  },
  button: {
    backgroundColor: '#00796B', // Deep emerald teal primary button
    borderRadius: 14, // Heavily rounded button
    marginTop: 8,
  },
});
export default PhoneAuthScreen;
