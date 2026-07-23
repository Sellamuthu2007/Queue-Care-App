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
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PasswordInput } from '../../components/PasswordInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ErrorMessage } from '../../components/ErrorMessage';
import { getErrorMessage } from '../../utils/errorHandling';
import { useAuth } from '../../context/AuthContext';
import * as authService from '../../services/authService';

export const LoginScreen = ({ route, navigation }: any) => {
  const { phone } = route.params;
  const { login } = useAuth();
  
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const obfuscatePhone = (phoneNum: string): string => {
    if (phoneNum.length < 5) return phoneNum;
    const prefix = phoneNum.slice(0, 3);
    const suffix = phoneNum.slice(-3);
    return `${prefix} XXXXXXX${suffix}`;
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    setError(null);

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.login(phone, password);
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
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Enter the password for {obfuscatePhone(phone)}</Text>
        </View>

        <View style={styles.form}>
          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError(null);
            }}
          />

          <ErrorMessage message={error || ''} />

          <PrimaryButton
            title={loading ? 'Logging in...' : 'Log In'}
            onPress={handleLogin}
            loading={loading}
            disabled={loading || !password}
            style={styles.button}
          />

          <View style={styles.backContainer}>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Text style={styles.backLink}>Use a different phone number</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: '#F1F5F9', // Soft clinical canvas grey
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
      },
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
  backContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  backLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00796B',
  },
});
export default LoginScreen;
