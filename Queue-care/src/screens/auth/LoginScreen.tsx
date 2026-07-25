import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorMessage } from '../../components/ErrorMessage';
import { getErrorMessage } from '../../utils/errorHandling';
import * as authService from '../../services/authService';
import { Fonts } from '../../constants/theme';

export const LoginScreen = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.signInWithGoogle();
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
});

export default LoginScreen;
