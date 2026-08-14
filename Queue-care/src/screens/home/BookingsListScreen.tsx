import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppNavigation } from '../../context/NavigationContext';
import { apiRequest } from '../../services/api';

interface Appointment {
  id: string;
  specialization: string;
  doctorName: string;
  hospitalName: string;
  location: string;
  date: string;
  time: string;
  tokenNumber: string;
  status: string;
}

import { useAppointments } from '../../context/AppointmentContext';

export const BookingsListScreen: React.FC = () => {
  const { navigate, goBack } = useAppNavigation();
  const { appointments: contextAppointments, fetchAppointments: fetchContextAppointments, isLoading: isContextLoading } = useAppointments();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

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

    // Map API response keys to UI components format
    const mapped = active.map((apt: any) => ({
      id: apt.appointment_id,
      specialization: apt.doctor_specialization || apt.department,
      doctorName: apt.doctor_name,
      hospitalName: apt.hospital_name,
      location: 'New Delhi',
      date: apt.appointment_date,
      time: apt.appointment_time,
      tokenNumber: apt.appointment_id ? apt.appointment_id.slice(0, 8).toUpperCase() : 'N/A',
      status: apt.status,
    }));

    setAppointments(mapped);
    setIsLoading(isContextLoading && mapped.length === 0);
  }, [contextAppointments, isContextLoading]);

  const fetchBookings = () => {
    fetchContextAppointments(true);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const renderBookingItem = ({ item }: { item: Appointment }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigate('AppointmentDetails', { appointmentId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.specialtyText}>{item.specialization}</Text>
            <Text style={styles.doctorText}>{item.doctorName}</Text>
            <Text style={styles.hospitalText}>{item.hospitalName}</Text>
          </View>
          <View style={styles.tokenBox}>
            <Text style={styles.tokenLabel}>Token</Text>
            <Text style={styles.tokenValue}>{item.tokenNumber}</Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <View style={styles.dateTimeContainer}>
            <Text style={styles.dateTimeText}>
              📅 {item.date ? item.date.split('T')[0] : ''} • 🕒 {item.time}
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            item.status === 'Confirmed' ? styles.statusConfirmed : styles.statusOther
          ]}>
            <Text style={[
              styles.statusText,
              item.status === 'Confirmed' ? styles.statusTextConfirmed : styles.statusTextOther
            ]}>
              {item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All My Bookings</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Main Content Area */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color="#315BEF" />
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load bookings</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchBookings}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : appointments.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No upcoming appointments scheduled</Text>
          <TouchableOpacity style={styles.bookButton} onPress={() => navigate('Home')}>
            <Text style={styles.bookButtonText}>Book Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderBookingItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#315BEF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  doctorText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  hospitalText: {
    fontSize: 13,
    color: '#64748B',
  },
  tokenBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tokenLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tokenValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusConfirmed: {
    backgroundColor: '#ECFDF5',
  },
  statusOther: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextConfirmed: {
    color: '#059669',
  },
  statusTextOther: {
    color: '#64748B',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#315BEF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  bookButton: {
    backgroundColor: '#315BEF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default BookingsListScreen;
