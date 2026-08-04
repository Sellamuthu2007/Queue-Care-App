import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import HomeHeader from '../../components/home/HomeHeader';
import AppointmentHero, { Appointment } from '../../components/home/AppointmentHero';
import BookActionCard from '../../components/home/BookActionCard';
import HealthyLifeSection from '../../components/home/HealthyLifeSection';
import HealthNewsSection from '../../components/home/HealthNewsSection';
import BottomNavigation from '../../components/home/BottomNavigation';

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'appointment-1',
    specialization: 'General Physician',
    hospitalName: 'City Care Hospital',
    location: 'Delhi',
    date: '22 May 2025',
    time: '11:30 AM',
    tokenNumber: 'A-23',
    status: 'Confirmed',
  },
  {
    id: 'appointment-2',
    specialization: 'Cardiologist',
    hospitalName: 'Apex Heart Care',
    location: 'Delhi',
    date: '28 May 2025',
    time: '04:00 PM',
    tokenNumber: 'C-09',
    status: 'Confirmed',
  },
];

export const HomeScreen = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'reports' | 'settings'>('home');

  const handleBookPress = () => {
    alert('Appointment booking flow selection triggered.');
  };

  // Determine Initials from User name or email
  const getUserInitials = (): string => {
    if (!user) return 'QC';
    if (user.name) {
      const parts = user.name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'QC';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Scrollable Container */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Block */}
        <HomeHeader userInitials={getUserInitials()} notificationCount={3} />

        {/* Upcoming Appointment Card (Single full-width presentation) */}
        <AppointmentHero
          appointments={MOCK_APPOINTMENTS}
          state="normal"
          onBookPress={handleBookPress}
        />

        {/* Book Appointment Card Shortcut */}
        <BookActionCard onPress={handleBookPress} />

        {/* Wellness Tip Cards Scroll */}
        <HealthyLifeSection />

        {/* News Feed List */}
        <HealthNewsSection />
        
        {/* Profile Logout Callout (Floating helper at bottom list) */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.7}>
            <Text style={styles.logoutText}>Log out of account ({user?.email || user?.name})</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Bottom Navigator (Fixed at Page Bottom) */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Uniform clinical light-gray tint
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 140, // Increased bottom spacing to account for safe-area raised floating navigation bar
  },
  logoutContainer: {
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 8,
    alignItems: 'center',
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 13,
  },
});
export default HomeScreen;
