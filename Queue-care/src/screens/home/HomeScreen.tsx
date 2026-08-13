import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Platform, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useAppNavigation } from '../../context/NavigationContext';
import { useAppointments } from '../../context/AppointmentContext';
import { apiRequest } from '../../services/api';
import HomeHeader from '../../components/home/HomeHeader';
import AppointmentHero, { Appointment } from '../../components/home/AppointmentHero';
import BookActionCard from '../../components/home/BookActionCard';
import HealthyLifeSection from '../../components/home/HealthyLifeSection';
import HealthNewsSection from '../../components/home/HealthNewsSection';
import BottomNavigation, { TabName } from '../../components/home/BottomNavigation';

export const HomeScreen = () => {
  const { user, logout } = useAuth();
  const { currentScreen, navigate } = useAppNavigation();
  const { appointments: contextAppointments, fetchAppointments, isLoading: isContextLoading } = useAppointments();
  
  const [activeTab, setActiveTab] = useState<TabName>('home');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [heroState, setHeroState] = useState<'normal' | 'loading' | 'empty' | 'error'>('loading');
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchUnreadCount = async () => {
    try {
      const notifs = await apiRequest('/notifications');
      if (Array.isArray(notifs)) {
        const unread = notifs.filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Error fetching unread notifications count:', err);
    }
  };

  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    // Filter only active appointments (not cancelled or completed) scheduled for today or the future
    const active = contextAppointments.filter((apt: any) => {
      if (apt.status === 'Cancelled' || apt.status === 'Completed') {
        return false;
      }
      const aptDate = apt.appointment_date ? apt.appointment_date.split('T')[0] : '';
      return aptDate >= todayStr;
    });
    
    if (active.length === 0) {
      setAppointments([]);
      setHeroState(isContextLoading ? 'loading' : 'empty');
    } else {
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
      setAppointments(mapped);
      setHeroState('normal');
    }
  }, [contextAppointments, isContextLoading]);

  useEffect(() => {
    if (currentScreen === 'Home') {
      fetchAppointments();
      fetchUnreadCount();
    }
  }, [currentScreen]);

  const handleBookPress = () => {
    navigate('HospitalDetails');
  };

  const handleDetailsPress = (id: string) => {
    navigate('AppointmentDetails', { appointmentId: id });
  };

  const handleTabChange = (tab: TabName) => {
    setActiveTab(tab);
    if (tab === 'bookings') {
      navigate('BookingsList');
    } else if (tab === 'reports') {
      navigate('Reports');
    } else if (tab === 'profile') {
      navigate('Profile');
    }
  };

  const getUserInitials = () => {
    if (!user || !user.name) return 'U';
    const parts = user.name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return user.name.slice(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Scrollable Container */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Block */}
        <HomeHeader userInitials={getUserInitials()} notificationCount={unreadCount} />

        {/* Upcoming Appointment Card (Single full-width presentation) */}
        <AppointmentHero
          appointments={appointments}
          state={heroState}
          onRetry={() => fetchAppointments(true)}
          onBookPress={handleBookPress}
          onDetailsPress={handleDetailsPress}
        />

        {/* Other Bookings Summary Card */}
        {appointments.length > 1 && (
          <View style={styles.otherBookingsSection}>
            <TouchableOpacity
              style={styles.summaryCard}
              onPress={() => navigate('BookingsList')}
              activeOpacity={0.8}
            >
              <View style={styles.summaryLeft}>
                <Text style={styles.summaryTitle}>Other Bookings</Text>
                <Text style={styles.summarySub}>
                  You have {appointments.length - 1} other active booking{appointments.length - 1 > 1 ? 's' : ''} scheduled.
                </Text>
              </View>
              <View style={styles.summaryRight}>
                <Text style={styles.viewAllText}>View All →</Text>
              </View>
            </TouchableOpacity>
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
      <BottomNavigation activeTab="home" onTabChange={handleTabChange} />
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  summaryLeft: {
    flex: 1,
    paddingRight: 12,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  summarySub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  summaryRight: {
    justifyContent: 'center',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#315BEF',
  },
});
export default HomeScreen;
