import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppNavigation } from '../../context/NavigationContext';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';

export const BookingFormScreen = () => {
  const { screenParams, navigate, goBack } = useAppNavigation();
  const { user } = useAuth();

  const {
    doctorId,
    hospitalId,
    doctorName,
    doctorSpecialization,
    consultationFee,
    selectedDate,
    selectedTime,
  } = screenParams || {};

  // Form Fields
  const [patientName, setPatientName] = useState<string>(user?.name || '');
  const [patientAge, setPatientAge] = useState<string>('');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [patientPhone, setPatientPhone] = useState<string>('');
  const [patientEmail] = useState<string>(user?.email || '');
  const [patientAddress, setPatientAddress] = useState<string>('');
  const [patientBloodGroup, setPatientBloodGroup] = useState<string>('');
  const [patientEmergencyContact, setPatientEmergencyContact] = useState<string>('');

  const [reason, setReason] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string>('');
  const [medicalDiseases, setMedicalDiseases] = useState<string>('');
  const [medicalMedications, setMedicalMedications] = useState<string>('');
  const [medicalPreviousVisit, setMedicalPreviousVisit] = useState<boolean>(false);
  const [medicalInsuranceAvailable, setMedicalInsuranceAvailable] = useState<boolean>(false);
  const [medicalInsuranceProvider, setMedicalInsuranceProvider] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isConsentChecked, setIsConsentChecked] = useState<boolean>(false);
  const [isBooking, setIsBooking] = useState<boolean>(false);

  const handleBookingSubmit = async () => {
    // 1. Validation
    if (!patientName.trim()) {
      alert('Patient name is required.');
      return;
    }
    const ageNum = parseInt(patientAge);
    if (isNaN(ageNum) || ageNum <= 0) {
      alert('Please enter a valid age.');
      return;
    }
    if (!patientPhone.trim()) {
      alert('Patient phone number is required.');
      return;
    }
    if (!reason.trim()) {
      alert('Please state the reason for your visit.');
      return;
    }
    if (!isConsentChecked) {
      alert('You must agree to the hospital terms to book.');
      return;
    }

    try {
      setIsBooking(true);

      const payload = {
        doctor_id: doctorId,
        hospital_id: hospitalId,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        department: doctorSpecialization,
        reason: reason,
        symptoms: symptoms,
        notes: notes,
        patient_name: patientName,
        patient_age: ageNum,
        patient_gender: patientGender,
        patient_phone: patientPhone,
        patient_email: patientEmail,
        patient_address: patientAddress,
        patient_blood_group: patientBloodGroup,
        patient_emergency_contact: patientEmergencyContact,
        medical_diseases: medicalDiseases,
        medical_medications: medicalMedications,
        medical_previous_visit: medicalPreviousVisit,
        medical_insurance_available: medicalInsuranceAvailable,
        medical_insurance_provider: medicalInsuranceProvider
      };

      // Call Go Backend
      const appointmentResult = await apiRequest('/appointments', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Navigate to success screen
      navigate('BookingSuccess', { appointment: appointmentResult });
    } catch (err: any) {
      console.error('Failed to book appointment:', err);
      alert(err.message || 'Unable to book appointment. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.7}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Appointment Receipt Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Appointment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Doctor</Text>
            <Text style={styles.summaryVal}>{doctorName} ({doctorSpecialization})</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date</Text>
            <Text style={styles.summaryVal}>{selectedDate}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Session Slot</Text>
            <Text style={styles.summaryVal}>{selectedTime}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Consultation Fee</Text>
            <Text style={[styles.summaryVal, styles.feeHighlight]}>₹{Number(consultationFee).toFixed(0)}</Text>
          </View>
        </View>

        {/* Section 1: Patient Information */}
        <Text style={styles.sectionHeading}>Patient Details</Text>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={patientName}
              onChangeText={setPatientName}
              placeholder="Full name of patient"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Age *</Text>
              <TextInput
                style={styles.input}
                value={patientAge}
                onChangeText={setPatientAge}
                placeholder="Age"
                keyboardType="numeric"
                placeholderTextColor="#94A3B8"
              />
            </View>
            
            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {(['Male', 'Female', 'Other'] as const).map((g) => {
                  const isSelected = patientGender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderChip, isSelected && styles.genderChipActive]}
                      onPress={() => setPatientGender(g)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.genderText, isSelected && styles.genderTextActive]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={patientPhone}
              onChangeText={setPatientPhone}
              placeholder="Contact number"
              keyboardType="phone-pad"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email (Prefilled)</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              value={patientEmail}
              editable={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={patientAddress}
              onChangeText={setPatientAddress}
              placeholder="Patient residential address"
              multiline
              numberOfLines={2}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Blood Group</Text>
              <TextInput
                style={styles.input}
                value={patientBloodGroup}
                onChangeText={setPatientBloodGroup}
                placeholder="e.g. O+"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Emergency Contact</Text>
              <TextInput
                style={styles.input}
                value={patientEmergencyContact}
                onChangeText={setPatientEmergencyContact}
                placeholder="Contact number"
                keyboardType="phone-pad"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>
        </View>

        {/* Section 2: Medical Background Details */}
        <Text style={styles.sectionHeading}>Medical Details</Text>
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Reason for Visit *</Text>
            <TextInput
              style={styles.input}
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. Regular health checkup, consultation"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Symptoms</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={symptoms}
              onChangeText={setSymptoms}
              placeholder="Describe current symptoms"
              multiline
              numberOfLines={2}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Existing Diseases</Text>
            <TextInput
              style={styles.input}
              value={medicalDiseases}
              onChangeText={setMedicalDiseases}
              placeholder="e.g. Diabetes, Hypertension"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Medications</Text>
            <TextInput
              style={styles.input}
              value={medicalMedications}
              onChangeText={setMedicalMedications}
              placeholder="List active medications"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Toggle Switches */}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Have you visited this doctor before?</Text>
            <Switch
              value={medicalPreviousVisit}
              onValueChange={setMedicalPreviousVisit}
              trackColor={{ false: '#CBD5E1', true: '#99F6E4' }}
              thumbColor={medicalPreviousVisit ? '#0D9488' : '#F1F5F9'}
            />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Do you have Health Insurance?</Text>
            <Switch
              value={medicalInsuranceAvailable}
              onValueChange={setMedicalInsuranceAvailable}
              trackColor={{ false: '#CBD5E1', true: '#99F6E4' }}
              thumbColor={medicalInsuranceAvailable ? '#0D9488' : '#F1F5F9'}
            />
          </View>

          {medicalInsuranceAvailable && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Insurance Provider Name</Text>
              <TextInput
                style={styles.input}
                value={medicalInsuranceProvider}
                onChangeText={setMedicalInsuranceProvider}
                placeholder="Name of insurance company"
                placeholderTextColor="#94A3B8"
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Any other comments or requests"
              multiline
              numberOfLines={2}
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* Consent Checkbox */}
        <TouchableOpacity 
          style={styles.consentRow} 
          onPress={() => setIsConsentChecked(!isConsentChecked)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, isConsentChecked && styles.checkboxChecked]}>
            {isConsentChecked && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.consentText}>I agree to Queue Care General Hospital terms, conditions, and token queue guidelines.</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Booking CTA Footer */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={[styles.bookButton, isBooking && styles.bookButtonDisabled]}
          disabled={isBooking}
          onPress={handleBookingSubmit}
          activeOpacity={0.8}
        >
          {isBooking ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.bookButtonText}>Confirm & Book Token</Text>
          )}
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
  summaryCard: {
    margin: 16,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#0F766E',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#CCFBF1',
    textTransform: 'uppercase',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#99F6E4',
    fontWeight: '500',
  },
  summaryVal: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
    maxWidth: '70%',
    textAlign: 'right',
  },
  feeHighlight: {
    fontSize: 15,
    color: '#34D399',
    fontWeight: '800',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#475569',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
    backgroundColor: '#F8FAFC',
  },
  inputDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    color: '#64748B',
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: 'top',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 6,
    height: 48,
  },
  genderChip: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  genderChipActive: {
    backgroundColor: '#E6F4F1',
    borderColor: '#0D9488',
  },
  genderText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  genderTextActive: {
    color: '#0F766E',
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  switchLabel: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
    flex: 1,
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginVertical: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#0D9488',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#0D9488',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  consentText: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    fontWeight: '500',
  },
  footerContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  bookButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
  },
  bookButtonDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.7,
  },
  bookButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default BookingFormScreen;
