import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorMessage } from '../../components/ErrorMessage';
import { getErrorMessage } from '../../utils/errorHandling';
import * as authService from '../../services/authService';
import { Fonts } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export const LoginScreen = () => {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleSignIn = async () => {
    // If either email or password is typed, we require BOTH to link/verify
    if (email || password) {
      if (!email) {
        setError('Please enter your email to verify with Google.');
        return;
      }
      if (!password) {
        setError('Please enter a password to register for future logins.');
        return;
      }
      // Simple email regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError('Please enter a valid email address.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const res = await authService.signInWithGoogle(
        email ? email.trim() : undefined,
        password || undefined
      );
      await login(res.access_token, res.refresh_token, res.user);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPasswordSignIn = async () => {
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await authService.signInWithEmailPassword(email.trim(), password);
      await login(res.access_token, res.refresh_token, res.user);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.cardContainer}>
          <View style={styles.header}>
            <Text style={styles.logoText}>Queue Care</Text>
            <Text style={styles.subtitle}>Your healthcare journey, made simpler</Text>
          </View>

          <View style={styles.form}>
            <ErrorMessage message={error || ''} />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, loading && styles.disabledButton]} 
              onPress={handleEmailPasswordSignIn} 
              activeOpacity={0.8}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In with Password</Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or verify & link with</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.googleButtonContainer}>
              <TouchableOpacity onPress={handleGoogleSignIn} activeOpacity={0.7} disabled={loading}>
                <View style={styles.googleButton}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#1F2937" />
                  ) : (
                    <>
                      <View style={styles.googleIconContainer}>
                        <View style={styles.googleIconQuadrant}>
                          <View style={[styles.googleQuad, { backgroundColor: '#4285F4', top: 0, left: 0 }]} />
                          <View style={[styles.googleQuad, { backgroundColor: '#EA4335', top: 0, right: 0 }]} />
                          <View style={[styles.googleQuad, { backgroundColor: '#FBBC05', bottom: 0, left: 0 }]} />
                          <View style={[styles.googleQuad, { backgroundColor: '#34A853', bottom: 0, right: 0 }]} />
                          <Text style={styles.googleIcon}>G</Text>
                        </View>
                      </View>
                      <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.infoText}>
              Note: Entering an email & password and clicking "Continue with Google" will check if they match your Google account and link them for future logins.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderRadius: 24,
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
  logoText: {
    fontFamily: Fonts.brand,
    fontSize: 34,
    fontWeight: '800',
    color: '#00796B', // Matches primary brand teal
    textAlign: 'center',
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  form: {
    width: '100%',
  },
  googleButtonContainer: {
    marginTop: 8,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    height: 52,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  googleIconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  googleIconQuadrant: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleQuad: {
    position: 'absolute',
    width: 12,
    height: 12,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Fonts.brand,
    zIndex: 1,
  },
  googleButtonText: {
    marginLeft: 12,
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0F172A',
    fontFamily: Fonts.sans,
  },
  primaryButton: {
    backgroundColor: '#00796B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: '#94A3B8',
    paddingHorizontal: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  infoText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 16,
  },
});

export default LoginScreen;
