import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppNavigation } from '../../context/NavigationContext';
import { apiRequest } from '../../services/api';

// Image assets mapping
const ASSET_IMAGES: Record<string, any> = {
  'hospital_cover': require('../../../assets/images/hospital_cover.png'),
  'doctor_cardiology': require('../../../assets/images/doctor_cardiology.png'),
  'doctor_neurology': require('../../../assets/images/doctor_neurology.png'),
};

const getAssetImage = (key: string) => {
  if (ASSET_IMAGES[key]) return ASSET_IMAGES[key];
  return { uri: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80' };
};

interface Hospital {
	id: string;
	name: string;
	address: string;
	rating: number;
	open_hours: string;
	emergency_availability: boolean;
	phone_number: string;
	about: string;
	facilities: string[];
	departments: string[];
	services: string[];
	cover_image_url: string;
}

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
}

export const HospitalDetailsScreen = () => {
  const { navigate, goBack } = useAppNavigation();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDoctorsLoading, setIsDoctorsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchHospitalDetails = async () => {
      try {
        setIsLoading(true);
        const data = await apiRequest('/hospital');
        setHospital(data);
        
        // Fetch all doctors initially
        setIsDoctorsLoading(true);
        const doctorsData = await apiRequest(`/hospital/${data.id}/doctors?specialization=All`);
        setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
      } catch (err) {
        console.error('Error fetching hospital/doctors:', err);
      } finally {
        setIsLoading(false);
        setIsDoctorsLoading(false);
      }
    };
    fetchHospitalDetails();
  }, []);

  const handleSpecialtyChange = async (specialty: string) => {
    if (!hospital) return;
    setSelectedSpecialty(specialty);
    try {
      setIsDoctorsLoading(true);
      const doctorsData = await apiRequest(`/hospital/${hospital.id}/doctors?specialization=${specialty}`);
      setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
    } catch (err) {
      console.error('Error filtering doctors:', err);
    } finally {
      setIsDoctorsLoading(false);
    }
  };

  if (isLoading || !hospital) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0D9488" />
        <Text style={styles.loadingText}>Loading hospital details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Top Navigation Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.7}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hospital Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Cover Banner */}
        <Image 
          source={getAssetImage(hospital.cover_image_url)} 
          style={styles.coverImage} 
          resizeMode="cover"
        />

        {/* Hospital Brand Details */}
        <View style={styles.hospitalCard}>
          <Text style={styles.hospitalName}>{hospital.name}</Text>
          <Text style={styles.hospitalAddress}>{hospital.address}</Text>

          {/* Key Metrics Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Rating</Text>
              <Text style={styles.metricValue}>{Number(hospital.rating).toFixed(1)}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Hours</Text>
              <Text style={styles.metricValue}>{hospital.open_hours}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Emergency</Text>
              <Text style={[
                styles.metricValue, 
                { color: hospital.emergency_availability ? '#10B981' : '#EF4444' }
              ]}>
                {hospital.emergency_availability ? 'Available' : 'No'}
              </Text>
            </View>
          </View>

          <Text style={styles.phoneText}>Contact: {hospital.phone_number}</Text>
        </View>

        {/* About Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>About Hospital</Text>
          <Text style={styles.aboutText}>{hospital.about}</Text>
        </View>

        {/* Facilities Grid */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Facilities Available</Text>
          <View style={styles.badgeContainer}>
            {hospital.facilities.map((fac, idx) => (
              <View key={idx} style={styles.facilityBadge}>
                <Text style={styles.badgeText}>{fac}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Available Services */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Services Offered</Text>
          <View style={styles.badgeContainer}>
            {hospital.services.map((srv, idx) => (
              <View key={idx} style={styles.serviceBadge}>
                <Text style={styles.serviceText}>{srv}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Specialty Filter Chips */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Filter Doctors by Department</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
            {['All', ...hospital.departments].map((dept) => {
              const isSelected = selectedSpecialty === dept;
              return (
                <TouchableOpacity
                  key={dept}
                  style={[styles.filterChip, isSelected && styles.filterChipActive]}
                  onPress={() => handleSpecialtyChange(dept)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                    {dept}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Doctor Cards Listing */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Available Doctors</Text>
          {isDoctorsLoading ? (
            <ActivityIndicator size="small" color="#0D9488" style={{ marginTop: 24 }} />
          ) : doctors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No doctors currently available in this department.</Text>
            </View>
          ) : (
            doctors.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={styles.doctorCard}
                onPress={() => navigate('DoctorDetails', { doctorId: doc.id, hospitalId: hospital.id })}
                activeOpacity={0.9}
              >
                <Image source={getAssetImage(doc.profile_photo_url)} style={styles.doctorPhoto} />
                
                <View style={styles.doctorInfo}>
                  <View style={styles.doctorHeaderRow}>
                    <Text style={styles.doctorName}>{doc.name}</Text>
                    {doc.available_today && (
                      <View style={styles.availableBadge}>
                        <Text style={styles.availableBadgeText}>Today</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.doctorSub}>{doc.specialization} • {doc.qualification}</Text>
                  <Text style={styles.doctorMeta}>{doc.experience} Yrs Exp  •  Rating: {Number(doc.rating).toFixed(1)}</Text>
                  <Text style={styles.doctorFee}>Consultation Fee: ₹{Number(doc.consultation_fee).toFixed(0)}</Text>
                  <Text style={styles.doctorLang}>Languages: {doc.languages.join(', ')}</Text>
                  <Text style={styles.doctorDesc} numberOfLines={2}>{doc.short_description}</Text>
                </View>
                
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
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
  coverImage: {
    width: '100%',
    height: 220,
    backgroundColor: '#E2E8F0',
  },
  hospitalCard: {
    margin: 16,
    marginTop: -30,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  hospitalName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  hospitalAddress: {
    fontSize: 14,
    color: '#475569',
    marginTop: 8,
    lineHeight: 20,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E2E8F0',
  },
  phoneText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 16,
    fontWeight: '600',
    textAlign: 'center',
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
  aboutText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  facilityBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
  },
  badgeText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  serviceBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  serviceText: {
    fontSize: 12,
    color: '#0D9488',
    fontWeight: '600',
  },
  filterScroll: {
    paddingRight: 16,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  filterChipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  doctorCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  doctorPhoto: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#F1F5F9',
  },
  doctorInfo: {
    flex: 1,
    marginLeft: 16,
  },
  doctorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  availableBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: '#EEF2F6',
  },
  availableBadgeText: {
    fontSize: 10,
    color: '#0D9488',
    fontWeight: '700',
  },
  doctorSub: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    marginTop: 2,
  },
  doctorMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  doctorFee: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0D9488',
    marginTop: 6,
  },
  doctorLang: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  doctorDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    lineHeight: 18,
  },
  chevron: {
    fontSize: 24,
    color: '#94A3B8',
    fontWeight: '300',
    marginLeft: 8,
  },
});

export default HospitalDetailsScreen;
