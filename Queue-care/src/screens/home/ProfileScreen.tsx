import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useAppNavigation } from '../../context/NavigationContext';
import { apiRequest } from '../../services/api';
import * as secureStorage from '../../storage/secureStorage';

export const ProfileScreen: React.FC = () => {
  const { user, setUser, logout } = useAuth();
  const { goBack } = useAppNavigation();

  // Profile Form States
  const [name, setName] = useState<string>(user?.name || '');
  const [age, setAge] = useState<string>(user?.age ? String(user.age) : '');
  const [gender, setGender] = useState<string>(user?.gender || 'Male');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [bloodGroup, setBloodGroup] = useState<string>(user?.blood_group || '');
  const [address, setAddress] = useState<string>(user?.address || '');
  const [medicalDiseases, setMedicalDiseases] = useState<string>(user?.medical_diseases || '');
  const [medicalMedications, setMedicalMedications] = useState<string>(user?.medical_medications || '');
  const [insuranceAvailable, setInsuranceAvailable] = useState<boolean>(user?.medical_insurance_available || false);
  const [insuranceProvider, setInsuranceProvider] = useState<string>(user?.medical_insurance_provider || '');

  // Loading States
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Full Name is required.');
      return;
    }

    const ageNum = parseInt(age);
    if (age && (isNaN(ageNum) || ageNum <= 0 || ageNum > 120)) {
      Alert.alert('Validation Error', 'Please enter a valid age.');
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        name,
        age: ageNum || 0,
        gender,
        phone,
        blood_group: bloodGroup,
        address,
        medical_diseases: medicalDiseases,
        medical_medications: medicalMedications,
        medical_insurance_available: insuranceAvailable,
        medical_insurance_provider: insuranceProvider,
      };

      const updatedUser = await apiRequest('/user/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      // Save updated details locally
      await secureStorage.saveUser(updatedUser);
      setUser(updatedUser);

      Alert.alert('Success', 'Profile details updated successfully!');
    } catch (err: any) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', err.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of Queue Care?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              await logout();
            } catch (err) {
              console.error('Failed to log out:', err);
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header Navigation */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Banner */}
        <View style={styles.profileBanner}>
          <Image
            source={{ uri: user?.avatar_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=120&auto=format&fit=crop' }}
            style={styles.avatar}
          />
          <View style={styles.bannerDetails}>
            <Text style={styles.userName}>{name || user?.name || 'Patient User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓ Active Patient Account</Text>
            </View>
          </View>
        </View>

        {/* Quick Health Summary Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>🩸</Text>
            <Text style={styles.metricLabel}>Blood Group</Text>
            <Text style={styles.metricValue}>{bloodGroup || 'N/A'}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>🎂</Text>
            <Text style={styles.metricLabel}>Age (Yrs)</Text>
            <Text style={styles.metricValue}>{age || 'N/A'}</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>🧬</Text>
            <Text style={styles.metricLabel}>Gender</Text>
            <Text style={styles.metricValue}>{gender || 'N/A'}</Text>
          </View>
        </View>

        {/* Section: Demographics & Account Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Personal & Contact Details</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              style={styles.inputField}
              value={name}
              onChangeText={setName}
              placeholder="Your Full Name"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Age</Text>
              <TextInput
                style={styles.inputField}
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                placeholder="Age"
                maxLength={3}
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View style={{ flex: 1.2 }}>
              <Text style={styles.fieldLabel}>Blood Group</Text>
              <TextInput
                style={styles.inputField}
                value={bloodGroup}
                onChangeText={setBloodGroup}
                placeholder="e.g. O+, B-"
                maxLength={5}
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['Male', 'Female', 'Other'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderButton,
                    gender === g ? styles.genderButtonActive : styles.genderButtonInactive,
                  ]}
                  onPress={() => setGender(g)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === g ? styles.genderButtonTextActive : styles.genderButtonTextInactive,
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              style={styles.inputField}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 XXXXX XXXXX"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Home Address</Text>
            <TextInput
              style={[styles.inputField, { height: 80, textAlignVertical: 'top' }]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter your home address"
              multiline
              numberOfLines={3}
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        {/* Section: Medical History */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Medical Profile & History</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Chronic Illnesses / Diseases</Text>
            <TextInput
              style={[styles.inputField, { height: 60, textAlignVertical: 'top' }]}
              value={medicalDiseases}
              onChangeText={setMedicalDiseases}
              placeholder="e.g. Hypertension, Diabetes, Asthma"
              multiline
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Current Medications</Text>
            <TextInput
              style={[styles.inputField, { height: 60, textAlignVertical: 'top' }]}
              value={medicalMedications}
              onChangeText={setMedicalMedications}
              placeholder="List active prescriptions and dosages"
              multiline
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Insurance Toggle */}
          <View style={styles.insuranceToggleRow}>
            <View>
              <Text style={styles.insuranceLabel}>Health Insurance</Text>
              <Text style={styles.insuranceSub}>Do you have active healthcare insurance coverage?</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.toggleBtn,
                insuranceAvailable ? styles.toggleBtnActive : styles.toggleBtnInactive,
              ]}
              onPress={() => setInsuranceAvailable(!insuranceAvailable)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.toggleDot,
                  insuranceAvailable ? styles.toggleDotActive : styles.toggleDotInactive,
                ]}
              />
            </TouchableOpacity>
          </View>

          {insuranceAvailable && (
            <View style={[styles.fieldGroup, { marginTop: 12 }]}>
              <Text style={styles.fieldLabel}>Insurance Provider Name</Text>
              <TextInput
                style={styles.inputField}
                value={insuranceProvider}
                onChangeText={setInsuranceProvider}
                placeholder="Name of insurance provider policy"
                placeholderTextColor="#94A3B8"
              />
            </View>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save Profile Details</Text>
          )}
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={isLoggingOut}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>Log Out Account</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80,
  },
  profileBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#315BEF',
  },
  bannerDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 8,
  },
  verifiedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 4,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  genderButtonActive: {
    backgroundColor: '#315BEF',
    borderColor: '#315BEF',
  },
  genderButtonInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  genderButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  genderButtonTextInactive: {
    color: '#475569',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  inputField: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  insuranceToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
    marginTop: 8,
  },
  insuranceLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  insuranceSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    maxWidth: '80%',
  },
  toggleBtn: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#10B981',
  },
  toggleBtnInactive: {
    backgroundColor: '#CBD5E1',
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleDotActive: {
    alignSelf: 'flex-end',
  },
  toggleDotInactive: {
    alignSelf: 'flex-start',
  },
  saveButton: {
    backgroundColor: '#315BEF',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  logoutButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  logoutButtonText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default ProfileScreen;
