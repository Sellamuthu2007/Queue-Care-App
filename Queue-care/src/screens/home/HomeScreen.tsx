import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useAppNavigation } from '../../context/NavigationContext';
import { apiRequest } from '../../services/api';
import HomeHeader from '../../components/home/HomeHeader';
import AppointmentHero, { Appointment } from '../../components/home/AppointmentHero';
import BookActionCard from '../../components/home/BookActionCard';
import HealthyLifeSection from '../../components/home/HealthyLifeSection';
import HealthNewsSection from '../../components/home/HealthNewsSection';
import BottomNavigation from '../../components/home/BottomNavigation';

export const HomeScreen = () => {
  const { user, logout } = useAuth();
  const { currentScreen, navigate } = useAppNavigation();
  
  const [activeTab, setActiveTab] = useState<'home' | 'reports' | 'settings'>('home');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [heroState, setHeroState] = useState<'normal' | 'loading' | 'empty' | 'error'>('loading');

  const fetchAppointments = async () => {
    try {
      setHeroState('loading');
      const data = await apiRequest('/appointments/me');
      
      // Filter only active appointments (not cancelled or completed) to present in Upcoming card
      const active = Array.isArray(data) ? data.filter((apt: any) => apt.status !== 'Cancelled' && apt.status !== 'Completed') : [];
      
      if (active.length === 0) {
        setAppointments([]);
        setHeroState('empty');
      } else {
        console.log('[DEBUG] Raw Active Appointments:', JSON.stringify(active, null, 2));
        const mapped: Appointment[] = active.map((apt: any) => ({
          id: apt.appointment_id,
          specialization: apt.doctor_specialization || apt.department,
          hospitalName: apt.hospital_name,
          location: 'New Delhi',
          date: apt.appointment_date,
          time: apt.appointment_time,
          tokenNumber: apt.appointment_id ? apt.appointment_id.slice(0, 8).toUpperCase() : 'N/A',
          status: apt.status
        }));
        console.log('[DEBUG] Mapped Appointments:', JSON.stringify(mapped, null, 2));
        setAppointments(mapped);
        setHeroState('normal');
      }
    } catch (err) {
      console.error('Error fetching dashboard appointments:', err);
      setHeroState('error');
    }
  };

  useEffect(() => {
    if (currentScreen === 'Home') {
      fetchAppointments();
    }
  }, [currentScreen]);

  const handleBookPress = () => {
    navigate('HospitalDetails');
  };

  const handleDetailsPress = (id: string) => {
    navigate('AppointmentDetails', { appointmentId: id });
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
          appointments={appointments}
          state={heroState}
          onRetry={fetchAppointments}
          onBookPress={handleBookPress}
          onDetailsPress={handleDetailsPress}
        />

        {/* Other Bookings List Section */}
        {appointments.length > 1 && (
          <View style={styles.otherBookingsSection}>
            <Text style={styles.sectionTitle}>Your Other Bookings</Text>
            {appointments.slice(1).map((apt) => (
              <TouchableOpacity
                key={apt.id}
                style={styles.otherBookingCard}
                onPress={() => handleDetailsPress(apt.id)}
                activeOpacity={0.7}
              >
                <View style={styles.otherBookingLeft}>
                  <Text style={styles.otherDoctorText}>{apt.specialization}</Text>
                  <Text style={styles.otherHospitalText}>{apt.hospitalName}</Text>
                </View>
                <View style={styles.otherBookingRight}>
                  <Text style={styles.otherDateText}>
                    {apt.date ? apt.date.split('T')[0] : ''}
                  </Text>
                  <Text style={styles.otherTimeText}>{apt.time}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

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
  otherBookingsSection: {
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  otherBookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#101B46',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  otherBookingLeft: {
    flex: 1.2,
  },
  otherDoctorText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  otherHospitalText: {
    fontSize: 12,
    color: '#64748B',
  },
  otherBookingRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  otherDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#315BEF',
    marginBottom: 2,
  },
  otherTimeText: {
    fontSize: 12,
    color: '#475569',
  },
});
export default HomeScreen;
