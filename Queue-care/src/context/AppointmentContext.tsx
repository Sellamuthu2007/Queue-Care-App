import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from './AuthContext';

export interface Appointment {
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

interface AppointmentContextType {
  appointments: Appointment[];
  isLoading: boolean;
  fetchAppointments: (force?: boolean) => Promise<void>;
  getAppointmentById: (id: string) => Appointment | undefined;
  updateAppointmentInCache: (updatedApt: Appointment) => void;
  removeAppointmentFromCache: (id: string) => void;
  addAppointment: (appointment: Appointment) => void;
  clearCache: () => void;
}

const AppointmentContext = createContext<AppointmentContextType | undefined>(undefined);

export const AppointmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);

  const fetchAppointments = useCallback(async (force = false) => {
    try {
      if (!hasLoadedOnce || force) {
        setIsLoading(true);
      }
      const data = await apiRequest('/appointments/me');
      setAppointments(Array.isArray(data) ? data : []);
      setHasLoadedOnce(true);
    } catch (err) {
      console.error('Error fetching appointments in context:', err);
    } finally {
      setIsLoading(false);
    }
  }, [hasLoadedOnce]);

  const getAppointmentById = useCallback((id: string) => {
    return appointments.find(apt => apt.appointment_id === id);
  }, [appointments]);

  const updateAppointmentInCache = useCallback((updatedApt: Appointment) => {
    setAppointments(prev =>
      prev.map(apt => (apt.appointment_id === updatedApt.appointment_id ? updatedApt : apt))
    );
  }, []);

  const removeAppointmentFromCache = useCallback((id: string) => {
    setAppointments(prev => prev.filter(apt => apt.appointment_id !== id));
  }, []);

  const addAppointment = useCallback((newApt: Appointment) => {
    setAppointments(prev => [newApt, ...prev]);
  }, []);

  const clearCache = useCallback(() => {
    setAppointments([]);
    setHasLoadedOnce(false);
  }, []);

  // Clear cache if user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      clearCache();
    }
  }, [isAuthenticated, clearCache]);

  return (
    <AppointmentContext.Provider
      value={{
        appointments,
        isLoading,
        fetchAppointments,
        getAppointmentById,
        updateAppointmentInCache,
        removeAppointmentFromCache,
        addAppointment,
        clearCache,
      }}
    >
      {children}
    </AppointmentContext.Provider>
  );
};

export const useAppointments = () => {
  const context = useContext(AppointmentContext);
  if (!context) {
    throw new Error('useAppointments must be used within an AppointmentProvider');
  }
  return context;
};
