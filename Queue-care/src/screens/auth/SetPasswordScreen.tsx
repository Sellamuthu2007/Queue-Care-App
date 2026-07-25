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
import { PasswordInput } from '../../components/PasswordInput';
import { PasswordStrengthIndicator } from '../../components/PasswordStrengthIndicator';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ErrorMessage } from '../../components/ErrorMessage';
import { checkPasswordRequirements } from '../../utils/passwordValidation';
import { getErrorMessage } from '../../utils/errorHandling';
import { useAuth } from '../../context/AuthContext';
import * as authService from '../../services/authService';

export const SetPasswordScreen = ({ route }: any) => {
  const { verificationToken } = route.params;
  const { login } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const requirements = checkPasswordRequirements(password);
  const isPasswordValid = Object.values(requirements).every(Boolean);

  // Instantly trigger red border if passwords do not match in real time
  const confirmPasswordError = confirmPassword && password !== confirmPassword 
    ? 'Passwords do not match.' 
    : undefined;

  const handleCreateAccount = async () => {
    Keyboard.dismiss();
    setError(null);

    if (!password) {
      setError('Please enter a password.');
      return;
    }
    if (!isPasswordValid) {
      setError('Password does not meet the security requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.setPassword(verificationToken, password);
      
      // Auto login patient after account creation
      await login(response.access_token, response.refresh_token, response.user);
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
          <Text style={styles.title}>Create your password</Text>
          <Text style={styles.subtitle}>Secure your Queue Care account</Text>
        </View>

        <View style={styles.form}>
          <PasswordInput
            label="Password"
            placeholder="Enter password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError(null);
            }}
          />

          <PasswordStrengthIndicator
            requirements={requirements}
            passwordLength={password.length}
          />

          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (error) setError(null);
            }}
            error={confirmPasswordError}
          />

          <ErrorMessage message={error || ''} />

          <PrimaryButton
            title={loading ? 'Creating account...' : 'Create Account'}
            onPress={handleCreateAccount}
            loading={loading}
            disabled={loading || !password || !confirmPassword || !isPasswordValid || password !== confirmPassword}
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
    backgroundColor: '#F1F5F9', // Soft clinical grey background canvas
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
    borderRadius: 24, // Consistent 24px border rounding
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
      } as any,
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A', // Bold deep navy/slate header text
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B', // Light neutral gray tagline
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  form: {
    width: '100%',
  },
  button: {
    backgroundColor: '#00796B', // Matches primary deep emerald/teal theme
    borderRadius: 14, // Heavily rounded button
    marginTop: 12,
  },
});
export default SetPasswordScreen;
