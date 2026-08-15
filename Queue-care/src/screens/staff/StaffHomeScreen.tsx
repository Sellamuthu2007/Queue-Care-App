import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../constants/api';
import { CameraView, useCameraPermissions } from 'expo-camera';

type ScanMode = 'NONE' | 'ARRIVAL' | 'CONSULTATION';

export const StaffHomeScreen = () => {
  const { user, logout } = useAuth();
  const [scanMode, setScanMode] = useState<ScanMode>('NONE');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scannedToken, setScannedToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [activeConsultation, setActiveConsultation] = useState<any>(null);

  // For simulation
  const [simulationInput, setSimulationInput] = useState('');

  // Expo-camera permission hook
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (permission) {
      setHasPermission(permission.granted);
    } else {
      setHasPermission(null);
    }
  }, [permission]);

  // Load active consultation on mount
  useEffect(() => {
    const loadActiveConsultation = async () => {
      try {
        const secureStorage = require('../../storage/secureStorage');
        const saved = await secureStorage.getActiveConsultation();
        if (saved) {
          setActiveConsultation(saved);
        }
      } catch (err) {
        console.log('[StaffHomeScreen] Load Active Consultation Error:', err);
      }
    };
    loadActiveConsultation();
  }, []);

  // Poll to keep active consultation in sync with backend
  useEffect(() => {
    if (!activeConsultation || !activeConsultation.doctor_id) return;

    let isMounted = true;
    const pollInterval = setInterval(async () => {
      try {
        const secureStorage = require('../../storage/secureStorage');
        const accessToken = await secureStorage.getAccessToken();

        const response = await fetch(`${API_URL}/staff/current-consultation?doctor_id=${activeConsultation.doctor_id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        if (response.ok && isMounted) {
          const data = await response.json();
          // If backend returns null, it means consultation is finished/completed
          if (!data) {
            setActiveConsultation(null);
            await secureStorage.removeActiveConsultation();
          } else {
            setActiveConsultation(data);
            await secureStorage.saveActiveConsultation(data);
          }
        }
      } catch (err) {
        console.log('[StaffHomeScreen] Poll Error:', err);
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [activeConsultation?.doctor_id]);

  const handleRequestPermission = async () => {
    if (requestPermission) {
      const status = await requestPermission();
      setHasPermission(status.granted);
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (isLoading) return;
    processToken(data, scanMode);
  };

  const processToken = async (token: string, mode: ScanMode) => {
    if (!token.trim()) {
      Alert.alert('Error', 'Please enter or scan a valid token.');
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    // 1. Extract UUID/ID from token
    let appointmentId = token.trim();
    if (appointmentId.startsWith('QUEUECARE:APPOINTMENT:')) {
      appointmentId = appointmentId.replace('QUEUECARE:APPOINTMENT:', '');
    }

    // Basic UUID format check
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    if (!uuidRegex.test(appointmentId)) {
      setIsLoading(false);
      setStatusMessage({
        text: 'Invalid Queue Care QR format. Please scan the patient\'s appointment QR.',
        success: false
      });
      return;
    }

    try {
      // Fetch access token from local auth
      const authState = require('../../context/AuthContext');
      // For api requests, we use raw fetch to avoid complex dependency cycles.
      const secureStorage = require('../../storage/secureStorage');
      const accessToken = await secureStorage.getAccessToken();

      const endpoint = mode === 'ARRIVAL' 
        ? `${API_URL}/staff/appointments/${appointmentId}/check-in` 
        : `${API_URL}/staff/appointments/${appointmentId}/consultation-scan`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Server rejected the request');
      }

      if (mode === 'ARRIVAL') {
        const apt = result.appointment || {};
        setStatusMessage({
          text: `✓ Patient arrival confirmed!\n\nToken: #${apt.queue_position}\nPatient: ${apt.patient_name || 'N/A'}\nStatus: ${apt.status}`,
          success: true
        });
      } else {
        const current = result.current_consultation || {};
        setActiveConsultation(current);
        const secureStorage = require('../../storage/secureStorage');
        await secureStorage.saveActiveConsultation(current);
        const prev = result.previous_consultation;
        let msg = `✓ Consultation started for Token #${current.queue_position}\nPatient: ${current.patient_name || 'N/A'}`;
        if (prev) {
          msg += `\n\n(Finished previous Token #${prev.queue_position}: ${prev.patient_name || 'N/A'})`;
        }
        setStatusMessage({
          text: msg,
          success: true
        });
      }

      // Vibrate or beep here if desired
      setScanMode('NONE'); // Close scanner on success
      setSimulationInput('');
    } catch (err: any) {
      console.log('[StaffHomeScreen] Scan Error:', err);
      setStatusMessage({
        text: err.message || 'Network error occurred while calling backend',
        success: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteConsultation = async (appointmentId: string) => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const secureStorage = require('../../storage/secureStorage');
      const accessToken = await secureStorage.getAccessToken();

      const response = await fetch(`${API_URL}/staff/appointments/${appointmentId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ status: 'Completed' })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || 'Server rejected the request');
      }

      setStatusMessage({
        text: `✓ Consultation ended successfully for Token #${activeConsultation.queue_position} (${activeConsultation.patient_name || 'N/A'})`,
        success: true
      });
      setActiveConsultation(null); // Clear active consultation
      await secureStorage.removeActiveConsultation();
    } catch (err: any) {
      console.log('[StaffHomeScreen] Complete Error:', err);
      setStatusMessage({
        text: err.message || 'Network error occurred while calling backend',
        success: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulatedScan = (mode: ScanMode) => {
    if (!simulationInput.trim()) {
      Alert.alert('Simulation Error', 'Please type or paste an appointment ID / QR string first.');
      return;
    }
    processToken(simulationInput, mode);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Queue Care Staff</Text>
        <Text style={styles.headerSubtitle}>Logged in: {user?.email}</Text>
      </View>

      {/* Main Panel */}
      {scanMode !== 'NONE' ? (
        <View style={styles.scannerContainer}>
          <View style={styles.scannerHeader}>
            <Text style={styles.scannerTitle}>
              {scanMode === 'ARRIVAL' ? 'Scanning Patient Arrival' : 'Scanning Consultation Start'}
            </Text>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setScanMode('NONE')}>
              <Text style={styles.cancelBtnText}>Back</Text>
            </TouchableOpacity>
          </View>

          {hasPermission === null ? (
            <View style={styles.cameraFallback}>
              <Text style={styles.statusText}>Requesting camera permission...</Text>
            </View>
          ) : hasPermission === false ? (
            <View style={styles.cameraFallback}>
              <Text style={styles.statusText}>No access to camera. Enable in settings or use simulation mode.</Text>
              <TouchableOpacity style={styles.permissionBtn} onPress={handleRequestPermission}>
                <Text style={styles.permissionBtnText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.cameraWrapper}>
              {CameraView && (
                <CameraView
                  style={styles.camera}
                  facing="back"
                  onBarcodeScanned={handleBarcodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                  }}
                />
              )}
            </View>
          )}
        </View>
      ) : (
        <View>
          {activeConsultation ? (
            <View style={[styles.card, styles.activeConsultationCard]}>
              <Text style={styles.sectionTitle}>Active Patient Consultation</Text>
              <Text style={styles.cardHelp}>A consultation is currently running. You must complete this session before you can scan the next patient.</Text>
              
              <View style={styles.activePatientInfo}>
                <Text style={styles.activeTokenText}>Token #{activeConsultation.queue_position}</Text>
                <Text style={styles.activeNameText}>{activeConsultation.patient_name}</Text>
                <Text style={styles.activeMetaText}>{activeConsultation.patient_age} yrs • {activeConsultation.patient_gender}</Text>
                {activeConsultation.reason ? (
                  <Text style={styles.activeReasonText}>Reason: {activeConsultation.reason}</Text>
                ) : null}
              </View>

              <TouchableOpacity 
                style={[styles.actionBtn, styles.completeBtn]}
                onPress={() => handleCompleteConsultation(activeConsultation.appointment_id || activeConsultation.id)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.btnText}>End Consultation</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Control Panel</Text>
            <Text style={styles.cardHelp}>Select a scanner mode to start processing patient appointments:</Text>

            <TouchableOpacity 
              style={[styles.actionBtn, styles.arrivalBtn]}
              onPress={() => {
                setStatusMessage(null);
                if (CameraView) {
                  setScanMode('ARRIVAL');
                } else {
                  Alert.alert('Simulation Only', 'expo-camera is not loaded. Please use the simulator below.');
                }
              }}
            >
              <Text style={styles.btnText}>[ ARRIVAL SCAN ]</Text>
              <Text style={styles.btnSubtext}>Scan QR to mark patient "Checked In"</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[
                styles.actionBtn, 
                styles.consultationBtn, 
                !!activeConsultation && { opacity: 0.5, backgroundColor: '#94A3B8' }
              ]}
              disabled={!!activeConsultation}
              onPress={() => {
                setStatusMessage(null);
                if (CameraView) {
                  setScanMode('CONSULTATION');
                } else {
                  Alert.alert('Simulation Only', 'expo-camera is not loaded. Please use the simulator below.');
                }
              }}
            >
              <Text style={styles.btnText}>[ CONSULTATION SCAN ]</Text>
              <Text style={styles.btnSubtext}>Scan QR to start/finish consultations</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Scanned/Status Results Overlay */}
      {statusMessage && (
        <View style={[styles.statusCard, statusMessage.success ? styles.successCard : styles.errorCard]}>
          <Text style={[styles.statusCardTitle, statusMessage.success ? styles.successTitle : styles.errorTitle]}>
            {statusMessage.success ? 'Success' : 'Scan Error'}
          </Text>
          <Text style={styles.statusCardText}>{statusMessage.text}</Text>
          <TouchableOpacity 
            style={styles.dismissBtn}
            onPress={() => setStatusMessage(null)}
          >
            <Text style={styles.dismissBtnText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Simulator / Emulator Input (Extremely useful for testing without camera) */}
      <View style={[styles.card, styles.simulatorCard]}>
        <Text style={styles.sectionTitle}>Emulator QR Scan Simulator</Text>
        <Text style={styles.cardHelp}>
          Use this form to test scanning behavior in emulators or when webcams/cameras are unavailable:
        </Text>

        <TextInput
          style={styles.input}
          placeholder="e.g. QUEUECARE:APPOINTMENT:<uuid> or just <uuid>"
          value={simulationInput}
          onChangeText={setSimulationInput}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.simRow}>
          <TouchableOpacity 
            style={[styles.simBtn, styles.simArrivalBtn]}
            onPress={() => handleSimulatedScan('ARRIVAL')}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.simBtnText}>Simulate Arrival</Text>}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.simBtn, styles.simConsultationBtn, !!activeConsultation && { opacity: 0.5 }]}
            onPress={() => handleSimulatedScan('CONSULTATION')}
            disabled={isLoading || !!activeConsultation}
          >
            {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.simBtnText}>Simulate Consultation</Text>}
          </TouchableOpacity>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Logout from Staff Portal</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F8FAFC',
    minHeight: '100%',
    paddingBottom: 50,
  },
  header: {
    marginTop: Platform.OS === 'ios' ? 40 : 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 15,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F766E',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 20,
  },
  simulatorCard: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
  },
  cardHelp: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 20,
  },
  actionBtn: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
  },
  arrivalBtn: {
    backgroundColor: '#0F766E',
  },
  consultationBtn: {
    backgroundColor: '#0D9488',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  btnSubtext: {
    color: '#CCFBF1',
    fontSize: 12,
    marginTop: 4,
  },
  scannerContainer: {
    backgroundColor: '#000000',
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  scannerTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  cancelBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  cameraWrapper: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  camera: {
    flex: 1,
  },
  cameraFallback: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 20,
  },
  statusText: {
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 13,
  },
  permissionBtn: {
    backgroundColor: '#0F766E',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 5,
  },
  successCard: {
    backgroundColor: '#F0FDF4',
    borderLeftColor: '#22C55E',
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderLeftColor: '#EF4444',
  },
  statusCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  successTitle: {
    color: '#15803D',
  },
  errorTitle: {
    color: '#B91C1C',
  },
  statusCardText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '500',
  },
  dismissBtn: {
    marginTop: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  dismissBtnText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 13,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 15,
  },
  simRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  simBtn: {
    flex: 0.48,
    padding: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  simArrivalBtn: {
    backgroundColor: '#0F766E',
  },
  simConsultationBtn: {
    backgroundColor: '#0D9488',
  },
  simBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  logoutBtn: {
    padding: 15,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 15,
  },
  activeConsultationCard: {
    borderColor: '#10B981',
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  activePatientInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  activeTokenText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F766E',
    marginBottom: 5,
  },
  activeNameText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  activeMetaText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 6,
  },
  activeReasonText: {
    fontSize: 14,
    color: '#475569',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  completeBtn: {
    backgroundColor: '#10B981',
  },
});

export default StaffHomeScreen;
