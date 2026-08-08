import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppNavigation } from '../../context/NavigationContext';
import { apiRequest } from '../../services/api';

// Image assets mapping
const ASSET_IMAGES: Record<string, any> = {
  'doctor_cardiology': require('../../../assets/images/doctor_cardiology.png'),
  'doctor_neurology': require('../../../assets/images/doctor_neurology.png'),
};

const getAssetImage = (key: string) => {
  if (ASSET_IMAGES[key]) return ASSET_IMAGES[key];
  return { uri: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80' };
};

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  experience: number;
  consultation_fee: number;
  available_today: boolean;
  rating: number;
  languages: string[];
  short_description: string;
  profile_photo_url: string;
  registration_number: string;
  patients_treated: number;
  biography: string;
  special_interests: string[];
  education: string[];
  working_hours: string;
  available_days: string[];
  hospital_id: string;
}

interface TimeSlot {
  time: string;
  bookedCount: number;
  maxPatients: number;
  estimatedWait: number;
  queueLength: number;
  isAvailable: boolean;
}

interface Session {
  sessionName: string;
  slots: TimeSlot[];
}

export const DoctorDetailsScreen = () => {
  const { screenParams, navigate, goBack } = useAppNavigation();
  const doctorId = screenParams?.doctorId;
  const hospitalId = screenParams?.hospitalId;

  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [dates, setDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState<boolean>(false);

  // Generate available calendar dates for the current month starting from today
  useEffect(() => {
    const generateDates = () => {
      const list: Date[] = [];
      const today = new Date();
      // Generate next 21 days
      for (let i = 0; i < 21; i++) {
        const nextDate = new Date();
        nextDate.setDate(today.getDate() + i);
        list.push(nextDate);
      }
      setDates(list);
      setSelectedDate(list[0]); // Default to first available date
    };
    generateDates();
  }, []);

  // Fetch Doctor Profile details
  useEffect(() => {
    const fetchDoctor = async () => {
      if (!doctorId) return;
      try {
        setIsLoading(true);
        const data = await apiRequest(`/doctor/${doctorId}`);
        setDoctor(data);
      } catch (err) {
        console.error('Error fetching doctor details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoctor();
  }, [doctorId]);

  // Fetch Availability slots when date changes
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!doctorId || !selectedDate) return;
      
      // Format selectedDate as YYYY-MM-DD
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      try {
        setIsAvailabilityLoading(true);
        setSelectedSlot(null); // Clear selected slot
        const data = await apiRequest(`/doctor/${doctorId}/availability?date=${dateStr}`);
        setSessions(data.sessions || []);
      } catch (err) {
        console.error('Error fetching slots:', err);
      } finally {
        setIsAvailabilityLoading(false);
      }
    };
    fetchAvailability();
  }, [doctorId, selectedDate]);

  const handleBookingContinue = () => {
    if (!doctor || !selectedDate || !selectedSlot) {
      alert('Please select an appointment date and time slot first.');
      return;
    }

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    navigate('BookingForm', {
      doctorId: doctor.id,
      hospitalId: hospitalId,
      doctorName: doctor.name,
      doctorSpecialization: doctor.specialization,
      consultationFee: doctor.consultation_fee,
      selectedDate: dateStr,
      selectedTime: selectedSlot.time,
      slotMetrics: selectedSlot
    });
  };

  if (isLoading || !doctor) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0D9488" />
        <Text style={styles.loadingText}>Loading doctor credentials...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.7}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doctor Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Header */}
        <View style={styles.doctorHeaderCard}>
          <View style={styles.profileRow}>
            <Image source={getAssetImage(doctor.profile_photo_url)} style={styles.doctorImage} />
            <View style={styles.doctorMainInfo}>
              <Text style={styles.doctorName}>{doctor.name}</Text>
              <Text style={styles.specializationText}>{doctor.specialization}</Text>
              <Text style={styles.qualificationText}>{doctor.qualification}</Text>
              
              <View style={styles.badgeRow}>
                <View style={styles.experienceBadge}>
                  <Text style={styles.badgeText}>{doctor.experience} Years Exp</Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Text style={styles.badgeText}>Rating: {Number(doctor.rating).toFixed(1)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={styles.quickMetricsRow}>
            <View style={styles.quickMetricItem}>
              <Text style={styles.quickMetricLabel}>Consultation</Text>
              <Text style={styles.quickMetricValue}>₹{Number(doctor.consultation_fee).toFixed(0)}</Text>
            </View>
            <View style={styles.quickMetricDivider} />
            <View style={styles.quickMetricItem}>
              <Text style={styles.quickMetricLabel}>Patients Treated</Text>
              <Text style={styles.quickMetricValue}>{doctor.patients_treated.toLocaleString()}+</Text>
            </View>
            <View style={styles.quickMetricDivider} />
            <View style={styles.quickMetricItem}>
              <Text style={styles.quickMetricLabel}>Reg Number</Text>
              <Text style={styles.quickMetricValue}>{doctor.registration_number}</Text>
            </View>
          </View>
        </View>

        {/* Biography */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Biography</Text>
          <Text style={styles.biographyText}>{doctor.biography}</Text>
        </View>

        {/* Credentials & Details List */}
        <View style={styles.detailsListCard}>
          <Text style={styles.detailsListTitle}>Qualifications & Info</Text>
          
          <View style={styles.detailListItem}>
            <Text style={styles.detailLabel}>Education</Text>
            <Text style={styles.detailValue}>{doctor.education.join('\n')}</Text>
          </View>

          <View style={styles.detailListItem}>
            <Text style={styles.detailLabel}>Special Interests</Text>
            <Text style={styles.detailValue}>{doctor.special_interests.join(', ')}</Text>
          </View>

          <View style={styles.detailListItem}>
            <Text style={styles.detailLabel}>Languages Spoken</Text>
            <Text style={styles.detailValue}>{doctor.languages.join(', ')}</Text>
          </View>

          <View style={styles.detailListItem}>
            <Text style={styles.detailLabel}>Working Hours</Text>
            <Text style={styles.detailValue}>{doctor.working_hours} ({doctor.available_days.join(', ')})</Text>
          </View>
        </View>

        {/* Calendar Picker Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Select Appointment Date</Text>
          <FlatList
            horizontal
            data={dates}
            keyExtractor={(item) => item.toDateString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.calendarScroll}
            renderItem={({ item }) => {
              const isSelected = selectedDate?.toDateString() === item.toDateString();
              const dayName = item.toLocaleDateString('en-US', { weekday: 'short' });
              const dateNum = item.getDate();
              const monthName = item.toLocaleDateString('en-US', { month: 'short' });

              return (
                <TouchableOpacity
                  style={[styles.calendarChip, isSelected && styles.calendarChipActive]}
                  onPress={() => setSelectedDate(item)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.calendarDay, isSelected && styles.calendarTextActive]}>{dayName}</Text>
                  <Text style={[styles.calendarNum, isSelected && styles.calendarTextActive]}>{dateNum}</Text>
                  <Text style={[styles.calendarMonth, isSelected && styles.calendarTextActive]}>{monthName}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Available Slot Sessions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Available Slots</Text>
          {isAvailabilityLoading ? (
            <ActivityIndicator size="small" color="#0D9488" style={{ marginTop: 12 }} />
          ) : sessions.length === 0 ? (
            <Text style={styles.noSlotsText}>No slots available for the selected date.</Text>
          ) : (
            sessions.map((sess) => (
              <View key={sess.sessionName} style={styles.sessionBlock}>
                <Text style={styles.sessionNameTitle}>{sess.sessionName}</Text>
                <View style={styles.slotsGrid}>
                  {sess.slots.map((slot) => {
                    const isSelected = selectedSlot?.time === slot.time;
                    const isFull = !slot.isAvailable;
                    
                    return (
                      <TouchableOpacity
                        key={slot.time}
                        style={[
                          styles.slotButton,
                          isSelected && styles.slotButtonActive,
                          isFull && styles.slotButtonDisabled
                        ]}
                        disabled={isFull}
                        onPress={() => setSelectedSlot(slot)}
                        activeOpacity={0.8}
                      >
                        <Text style={[
                          styles.slotTimeText,
                          isSelected && styles.slotTimeTextActive,
                          isFull && styles.slotTimeTextDisabled
                        ]}>
                          {slot.time}
                        </Text>
                        
                        {/* Dynamic Live Queue Metrics Room */}
                        <Text style={[
                          styles.slotSubText, 
                          isSelected && styles.slotSubTextActive,
                          isFull && styles.slotSubTextDisabled
                        ]}>
                          {isFull 
                            ? 'Full' 
                            : slot.bookedCount > 0 
                              ? `Wait ~${slot.estimatedWait}m` 
                              : 'No Wait'
                          }
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </View>

        {/* selected slot detail message summary */}
        {selectedSlot && (
          <View style={styles.summaryCallout}>
            <Text style={styles.summaryCalloutText}>
              Selected: <Text style={{ fontWeight: '700' }}>{selectedSlot.time}</Text> (Position #{selectedSlot.queueLength + 1} in queue, estimated waiting time: {selectedSlot.estimatedWait} mins)
            </Text>
          </View>
        )}
      </ScrollView>

      {/* CTA Footer */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={[styles.bookButton, !selectedSlot && styles.bookButtonDisabled]}
          disabled={!selectedSlot}
          onPress={handleBookingContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.bookButtonText}>Continue to Booking Form</Text>
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
  doctorHeaderCard: {
    margin: 16,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F1F5F9',
  },
  doctorMainInfo: {
    flex: 1,
    marginLeft: 16,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  specializationText: {
    fontSize: 14,
    color: '#0D9488',
    fontWeight: '700',
    marginTop: 2,
  },
  qualificationText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  experienceBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  ratingBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: '#FFFBEB',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  quickMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  quickMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickMetricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  quickMetricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  quickMetricDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  biographyText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  detailsListCard: {
    margin: 16,
    padding: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsListTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  detailListItem: {
    marginBottom: 14,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginTop: 4,
    fontWeight: '500',
  },
  calendarScroll: {
    paddingRight: 16,
    gap: 8,
  },
  calendarChip: {
    width: 64,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calendarChipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  calendarDay: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  calendarNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  calendarMonth: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  calendarTextActive: {
    color: '#FFFFFF',
  },
  noSlotsText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  sessionBlock: {
    marginBottom: 16,
  },
  sessionNameTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    width: '31%',
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  slotButtonActive: {
    backgroundColor: '#E6F4F1',
    borderColor: '#0D9488',
  },
  slotButtonDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.5,
  },
  slotTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  slotTimeTextActive: {
    color: '#0F766E',
  },
  slotTimeTextDisabled: {
    color: '#94A3B8',
  },
  slotSubText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  slotSubTextActive: {
    color: '#0D9488',
  },
  slotSubTextDisabled: {
    color: '#CBD5E1',
  },
  summaryCallout: {
    margin: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  summaryCalloutText: {
    fontSize: 13,
    color: '#0F766E',
    textAlign: 'center',
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

export default DoctorDetailsScreen;
