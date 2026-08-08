import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/home/HomeScreen';
import HospitalDetailsScreen from '../screens/home/HospitalDetailsScreen';
import DoctorDetailsScreen from '../screens/home/DoctorDetailsScreen';
import BookingFormScreen from '../screens/home/BookingFormScreen';
import BookingSuccessScreen from '../screens/home/BookingSuccessScreen';
import AppointmentDetailsScreen from '../screens/home/AppointmentDetailsScreen';
import { NavigationProvider, useAppNavigation } from '../context/NavigationContext';
import { apiRequest } from '../services/api';

export const RootNavigator = () => {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);

  useEffect(() => {
    const handleWebOAuthRedirect = async () => {
      if (typeof window === 'undefined' || !window.location || !window.location.href) return;

      const urlString = window.location.href;
      if (!urlString.includes('access_token=')) return;

      const hashIndex = urlString.indexOf('#');
      const queryIndex = urlString.indexOf('?');
      const searchPart = hashIndex !== -1 ? urlString.slice(hashIndex + 1) : (queryIndex !== -1 ? urlString.slice(queryIndex + 1) : '');

      if (!searchPart) return;

      const params: Record<string, string> = {};
      searchPart.split('&').forEach((part) => {
        const [key, val] = part.split('=');
        if (key && val) {
          params[decodeURIComponent(key)] = decodeURIComponent(val);
        }
      });

      const supabaseAccessToken = params['access_token'];
      if (!supabaseAccessToken) return;

      try {
        setIsProcessingRedirect(true);
        // Clear the URL fragment so refreshing doesn't loop
        if (window.history && typeof window.history.replaceState === 'function') {
          window.history.replaceState({}, document.title, '/');
        }

        // Exchange with Go backend
        const res = await apiRequest('/auth/google', {
          method: 'POST',
          useAuth: false,
          body: JSON.stringify({ access_token: supabaseAccessToken }),
        });

        // Log in and save session
        await login(res.access_token, res.refresh_token, res.user);
      } catch (error) {
        console.error('Failed to complete Google Sign-In redirect:', error);
      } finally {
        setIsProcessingRedirect(false);
      }
    };

    handleWebOAuthRedirect();
  }, []);

  if (isLoading || isProcessingRedirect) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.content}>
          <Text style={styles.logo}>Queue Care</Text>
          <Text style={styles.subtitle}>
            {isProcessingRedirect ? 'Completing Google Sign-In...' : 'Your healthcare journey, made simpler'}
          </Text>
          <ActivityIndicator size="small" color="#0D9488" style={styles.spinner} />
        </View>
      </View>
    );
  }

  return isAuthenticated ? (
    <NavigationProvider>
      <AuthenticatedScreens />
    </NavigationProvider>
  ) : (
    <LoginScreen />
  );
};

const AuthenticatedScreens = () => {
  const { currentScreen } = useAppNavigation();

  switch (currentScreen) {
    case 'Home':
      return <HomeScreen />;
    case 'HospitalDetails':
      return <HospitalDetailsScreen />;
    case 'DoctorDetails':
      return <DoctorDetailsScreen />;
    case 'BookingForm':
      return <BookingFormScreen />;
    case 'BookingSuccess':
      return <BookingSuccessScreen />;
    case 'AppointmentDetails':
      return <AppointmentDetailsScreen />;
    default:
      return <HomeScreen />;
  }
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  spinner: {
    marginTop: 30,
  },
});

export default RootNavigator;
