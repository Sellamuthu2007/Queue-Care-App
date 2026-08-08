import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppNavigation } from '../../context/NavigationContext';
import { apiRequest } from '../../services/api';

interface Appointment {
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  hospital_id: string;
  appointment_date: string;
  appointment_time: string;
  department: string;
  reason: string;
  symptoms: string;
  status: string;
  created_at: string;
  updated_at: string;
  queue_position: number;
  estimated_wait: number;
  slot_capacity: number;
  booked_count: number;
  notes: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  patient_phone: string;
  patient_email: string;
  patient_address: string;
  patient_blood_group: string;
  patient_emergency_contact: string;
  medical_diseases: string;
  medical_medications: string;
  medical_previous_visit: boolean;
  medical_insurance_available: boolean;
  medical_insurance_provider: string;
  doctor_name: string;
  doctor_specialization: string;
  doctor_photo_url: string;
  hospital_name: string;
  consultation_fee: number;
}

const STATUS_STATES = [
  'Booked',
  'Confirmed',
  'Checked In',
  'In Queue',
  'Consultation Started',
  'Completed'
];

export const AppointmentDetailsScreen = () => {
  const { screenParams, goBack } = useAppNavigation();
  const appointmentId = screenParams?.appointmentId;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const fetchAppointmentDetails = async () => {
    if (!appointmentId) return;
    try {
      setIsLoading(true);
      const data = await apiRequest(`/appointments/${appointmentId}`);
      setAppointment(data);
    } catch (err) {
      console.error('Error loading appointment details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointmentDetails();
  }, [appointmentId]);

  const handleCancelPress = () => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment token?',
      [
        { text: 'Keep Appointment', style: 'cancel' },
        { text: 'Cancel Token', style: 'destructive', onPress: cancelAppointment }
      ]
    );
  };

  const cancelAppointment = async () => {
    if (!appointment) return;
    try {
      setIsCancelling(true);
      await apiRequest(`/appointments/${appointment.appointment_id}/cancel`, {
        method: 'PATCH'
      });
      alert('Your appointment has been cancelled.');
      
      // Reload appointment state
      await fetchAppointmentDetails();
    } catch (err: any) {
      console.error('Error cancelling appointment:', err);
      alert(err.message || 'Failed to cancel appointment. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading || !appointment) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0D9488" />
        <Text style={styles.loadingText}>Loading token details...</Text>
      </View>
    );
  }

  const shortAptId = appointment.appointment_id ? appointment.appointment_id.slice(0, 8).toUpperCase() : 'N/A';
  const isCancelled = appointment.status === 'Cancelled';

  // Determine active step index in status timeline
  const activeStatusIdx = STATUS_STATES.indexOf(appointment.status);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.7}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Appointment Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Token Details Header Card */}
        <View style={styles.tokenCard}>
          <View style={styles.tokenHeader}>
            <View>
              <Text style={styles.tokenLabel}>Token Number</Text>
              <Text style={styles.tokenValue}>#{shortAptId}</Text>
            </View>
            <View style={[
              styles.statusLabelBadge,
              isCancelled && styles.statusBadgeCancelled,
              appointment.status === 'Completed' && styles.statusBadgeCompleted,
              (appointment.status === 'In Queue' || appointment.status === 'Consultation Started') && styles.statusBadgeActive
            ]}>
              <Text style={[
                styles.statusLabelText,
                isCancelled && styles.statusTextCancelled,
                appointment.status === 'Completed' && styles.statusTextCompleted,
                (appointment.status === 'In Queue' || appointment.status === 'Consultation Started') && styles.statusTextActive
              ]}>
                {appointment.status}
              </Text>
            </View>
          </View>

          <View style={styles.tokenDivider} />

          {/* Core queue position calculations */}
          {!isCancelled && appointment.status !== 'Completed' && (
            <View style={styles.queueMetricsRow}>
              <View style={styles.queueMetricItem}>
                <Text style={styles.queueLabel}>Queue Position</Text>
                <Text style={styles.queueValue}>#{appointment.queue_position}</Text>
              </View>
              <View style={styles.queueMetricDivider} />
              <View style={styles.queueMetricItem}>
                <Text style={styles.queueLabel}>Estimated Wait</Text>
                <Text style={styles.queueValue}>~{appointment.estimated_wait} mins</Text>
              </View>
            </View>
          )}

          {isCancelled && (
            <Text style={styles.cancelledNoticeText}>
              This appointment has been cancelled. If you want a new token, please book another slot.
            </Text>
          )}

          {appointment.status === 'Completed' && (
            <Text style={styles.completedNoticeText}>
              This consultation has been completed. Thank you for using Queue Care!
            </Text>
          )}
        </View>

        {/* Status Timeline */}
        {!isCancelled && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Status Timeline</Text>
            <View style={styles.timelineCard}>
              {STATUS_STATES.map((state, idx) => {
                const isPassed = idx <= activeStatusIdx;
                const isCurrent = idx === activeStatusIdx;
                const showLine = idx < STATUS_STATES.length - 1;

                return (
                  <View key={state} style={styles.timelineItem}>
                    {/* Circle Indicator */}
                    <View style={styles.indicatorContainer}>
                      <View style={[
                        styles.timelineCircle,
                        isPassed && styles.timelineCirclePassed,
                        isCurrent && styles.timelineCircleCurrent
                      ]}>
                        {isPassed && !isCurrent && <Text style={styles.timelineCheck}>✓</Text>}
                      </View>
                      {showLine && (
                        <View style={[
                          styles.timelineLine,
                          idx < activeStatusIdx && styles.timelineLinePassed
                        ]} />
                      )}
                    </View>
                    
                    {/* Step label */}
                    <View style={styles.timelineLabelBlock}>
                      <Text style={[
                        styles.timelineLabel,
                        isPassed && styles.timelineLabelPassed,
                        isCurrent && styles.timelineLabelCurrent
                      ]}>
                        {state}
                      </Text>
                      {isCurrent && (
                        <Text style={styles.timelineHelper}>Active State</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Doctor and Hospital Information */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Clinical Location & Doctor</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Doctor</Text>
            <Text style={styles.infoVal}>{appointment.doctor_name} ({appointment.department})</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Hospital</Text>
            <Text style={styles.infoVal}>{appointment.hospital_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Consultation Fee</Text>
            <Text style={styles.infoVal}>₹{Number(appointment.consultation_fee).toFixed(0)}</Text>
          </View>
        </View>

        {/* Date and Time Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Scheduled Slot</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoVal}>{appointment.appointment_date}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoVal}>{appointment.appointment_time}</Text>
          </View>
        </View>

        {/* Patient Details */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Patient Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Patient Name</Text>
            <Text style={styles.infoVal}>{appointment.patient_name} ({appointment.patient_age} yrs, {appointment.patient_gender})</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoVal}>{appointment.patient_phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoVal}>{appointment.patient_email}</Text>
          </View>
          {appointment.patient_address !== '' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoVal}>{appointment.patient_address}</Text>
            </View>
          )}
          {appointment.patient_blood_group !== '' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Blood Group</Text>
              <Text style={styles.infoVal}>{appointment.patient_blood_group}</Text>
            </View>
          )}
        </View>

        {/* Medical History Details */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Medical Parameters</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reason for Visit</Text>
            <Text style={styles.infoVal}>{appointment.reason}</Text>
          </View>
          {appointment.symptoms !== '' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Symptoms</Text>
              <Text style={styles.infoVal}>{appointment.symptoms}</Text>
            </View>
          )}
          {appointment.medical_diseases !== '' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Diseases</Text>
              <Text style={styles.infoVal}>{appointment.medical_diseases}</Text>
            </View>
          )}
          {appointment.medical_medications !== '' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Medications</Text>
              <Text style={styles.infoVal}>{appointment.medical_medications}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Previous Visit</Text>
            <Text style={styles.infoVal}>{appointment.medical_previous_visit ? 'Yes' : 'No'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Insurance</Text>
            <Text style={styles.infoVal}>
              {appointment.medical_insurance_available 
                ? `Yes (${appointment.medical_insurance_provider || 'Not specified'})` 
                : 'No'
              }
            </Text>
          </View>
          {appointment.notes !== '' && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Notes</Text>
              <Text style={styles.infoVal}>{appointment.notes}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Cancel Action Footer */}
      {!isCancelled && appointment.status !== 'Completed' && (
        <View style={styles.footerContainer}>
          <TouchableOpacity
            style={[styles.cancelButton, isCancelling && styles.cancelButtonDisabled]}
            disabled={isCancelling}
            onPress={handleCancelPress}
            activeOpacity={0.8}
          >
            {isCancelling ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.cancelButtonText}>Cancel Appointment</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  backText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F766E',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  placeholder: {
    width: 60,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  tokenCard: {
    margin: 16,
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
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  tokenValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  statusLabelBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  statusLabelText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  statusBadgeCancelled: {
    backgroundColor: '#FEF2F2',
  },
  statusTextCancelled: {
    color: '#EF4444',
  },
  statusBadgeCompleted: {
    backgroundColor: '#ECFDF5',
  },
  statusTextCompleted: {
    color: '#10B981',
  },
  statusBadgeActive: {
    backgroundColor: '#E6F4F1',
  },
  statusTextActive: {
    color: '#0D9488',
  },
  tokenDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  queueMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  queueMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  queueLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  queueValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F766E',
    marginTop: 4,
  },
  queueMetricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  cancelledNoticeText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 18,
  },
  completedNoticeText: {
    fontSize: 13,
    color: '#10B981',
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: 18,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timelineCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 56,
  },
  indicatorContainer: {
    alignItems: 'center',
    width: 24,
    marginRight: 16,
  },
  timelineCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineCirclePassed: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  timelineCircleCurrent: {
    borderColor: '#0D9488',
    backgroundColor: '#FFFFFF',
  },
  timelineCheck: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '900',
  },
  timelineLine: {
    position: 'absolute',
    top: 22,
    bottom: 0,
    width: 2,
    backgroundColor: '#E2E8F0',
    zIndex: 1,
  },
  timelineLinePassed: {
    backgroundColor: '#10B981',
  },
  timelineLabelBlock: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 1,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94A3B8',
  },
  timelineLabelPassed: {
    color: '#475569',
    fontWeight: '600',
  },
  timelineLabelCurrent: {
    color: '#0D9488',
    fontWeight: '800',
  },
  timelineHelper: {
    fontSize: 10,
    color: '#0D9488',
    fontWeight: '700',
    marginTop: 2,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  infoVal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right',
  },
  footerContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  cancelButtonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AppointmentDetailsScreen;
