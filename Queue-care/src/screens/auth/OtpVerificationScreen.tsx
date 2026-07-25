import React, { useState, useEffect } from 'react';
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
import { OtpInput } from '../../components/OtpInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ErrorMessage } from '../../components/ErrorMessage';
import { getErrorMessage } from '../../utils/errorHandling';
import * as authService from '../../services/authService';

export const OtpVerificationScreen = ({ route, navigation }: any) => {
  const { phone } = route.params;
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(45);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const obfuscatePhone = (phoneNum: string): string => {
    if (phoneNum.length < 5) return phoneNum;
    const prefix = phoneNum.slice(0, 3);
    const suffix = phoneNum.slice(-3);
    return `${prefix} XXXXXXX${suffix}`;
  };

  const handleVerify = async () => {
    Keyboard.dismiss();
    setError(null);

    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.verifyOtp(phone, otp);
      navigation.navigate('SetPassword', {
        phone,
        verificationToken: response.verification_token,
      });
    } catch (err) {
      setOtp(''); // Clear OTP boxes on invalid entry
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when the 6th digit is filled
  useEffect(() => {
    if (otp.length === 6) {
      handleVerify();
    }
  }, [otp]);

  const handleResend = async () => {
    setError(null);
    setOtp('');
    setLoading(true);
    try {
      await authService.sendOtp(phone);
      setTimer(60); // 60 seconds cooldown on resend
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
          <Text style={styles.title}>Verify your phone number</Text>
          <Text style={styles.subtitle}>
            OTP sent to {obfuscatePhone(phone)}
          </Text>
        </View>

        <OtpInput value={otp} onChange={setOtp} />

        <ErrorMessage message={error || ''} />

        <PrimaryButton
          title={loading ? 'Verifying...' : 'Verify OTP'}
          onPress={handleVerify}
          loading={loading}
          disabled={loading || otp.length !== 6}
          style={styles.button}
        />

        <View style={styles.resendContainer}>
          {timer > 0 ? (
            <Text style={styles.resendText}>
              Resend OTP in {timer} seconds
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          )}
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
    borderRadius: 24, // Matches the Phone Screen card rounding
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
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A', // Bold deep navy/slate
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B', // Light neutral gray
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#00796B', // Matches primary brand emerald teal
    borderRadius: 14, // Heavily rounded button
    marginTop: 12,
  },
  resendContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00796B', // Tapable brand teal link
  },
});
export default OtpVerificationScreen;
