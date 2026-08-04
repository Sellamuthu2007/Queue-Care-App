import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { apiRequest } from '../services/api';

export default function RedirectScreen() {
  const { login } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    const handleAuthRedirect = async () => {
      try {
        if (typeof window === 'undefined' || !window.location || !window.location.href) return;
        
        // Extract hash or query parameters from current window URL
        const urlString = window.location.href;
        const hashIndex = urlString.indexOf('#');
        const queryIndex = urlString.indexOf('?');
        const searchPart = hashIndex !== -1 ? urlString.slice(hashIndex + 1) : (queryIndex !== -1 ? urlString.slice(queryIndex + 1) : '');
        
        if (!searchPart) {
          router.replace('/');
          return;
        }
        
        const params: Record<string, string> = {};
        searchPart.split('&').forEach((part) => {
          const [key, val] = part.split('=');
          if (key && val) {
            params[decodeURIComponent(key)] = decodeURIComponent(val);
          }
        });
        
        const supabaseAccessToken = params['access_token'];
        if (!supabaseAccessToken) {
          router.replace('/');
          return;
        }
        
        // Exchange with Go backend
        const res = await apiRequest('/auth/google', {
          method: 'POST',
          useAuth: false,
          body: JSON.stringify({ access_token: supabaseAccessToken }),
        });
        
        // Log in and save session
        await login(res.access_token, res.refresh_token, res.user);
        
        // Redirect to home
        router.replace('/');
      } catch (error) {
        console.error('Redirect login error:', error);
        router.replace('/');
      }
    };
    
    handleAuthRedirect();
  }, []);
  
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0D9488" />
      <Text style={styles.text}>Completing Sign-In...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#475569',
    fontWeight: '600',
  },
});
