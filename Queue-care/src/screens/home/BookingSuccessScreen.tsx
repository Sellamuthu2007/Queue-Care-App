import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppNavigation } from '../../context/NavigationContext';

export const BookingSuccessScreen = () => {
  const { screenParams, resetToHome } = useAppNavigation();
  const appointment = screenParams?.appointment;

  if (!appointment) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorText}>No appointment details found.</Text>
          <TouchableOpacity style={styles.homeButton} onPress={resetToHome}>
            <Text style={styles.homeButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const shortAptId = appointment.appointment_id ? appointment.appointment_id.slice(0, 8).toUpperCase() : 'N/A';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Apple Inspired Success Circle */}
        <View style={styles.successBadge}>
          <Text style={styles.successIcon}>✓</Text>
        </View>

        <Text style={styles.successTitle}>Appointment Confirmed</Text>
        <Text style={styles.successSubtitle}>Your token and queue position have been reserved successfully.</Text>

        {/* Details card */}
        <View style={styles.receiptCard}>
          <View style={styles.receiptHeader}>
            <Text style={styles.receiptHeaderLabel}>Appointment Number</Text>
            <Text style={styles.receiptHeaderVal}>#{shortAptId}</Text>
          </View>
          
          <View style={styles.receiptDivider} />

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Patient</Text>
            <Text style={styles.receiptVal}>{appointment.patient_name}</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Doctor</Text>
            <Text style={styles.receiptVal}>{appointment.doctor_name} ({appointment.department})</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Hospital</Text>
            <Text style={styles.receiptVal}>{appointment.hospital_name}</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Date</Text>
            <Text style={styles.receiptVal}>{appointment.appointment_date}</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Time Slot</Text>
            <Text style={styles.receiptVal}>{appointment.appointment_time}</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Queue Position</Text>
            <Text style={[styles.receiptVal, styles.highlightVal]}>#{appointment.queue_position}</Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Est. Wait Time</Text>
            <Text style={[styles.receiptVal, styles.highlightVal]}>~{appointment.estimated_wait} mins</Text>
          </View>
        </View>

        {/* Go Home CTA */}
        <TouchableOpacity style={styles.homeButton} onPress={resetToHome} activeOpacity={0.8}>
          <Text style={styles.homeButtonText}>Go to Home Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 40,
    color: '#10B981',
    fontWeight: '900',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 20,
    fontWeight: '500',
  },
  receiptCard: {
    width: '100%',
    marginVertical: 28,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  receiptHeaderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  receiptHeaderVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0D9488',
  },
  receiptDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 14,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  receiptLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  receiptVal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right',
  },
  highlightVal: {
    color: '#0F766E',
    fontWeight: '800',
  },
  homeButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  homeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 15,
    color: '#EF4444',
    marginBottom: 20,
    fontWeight: '600',
  },
});

export default BookingSuccessScreen;
