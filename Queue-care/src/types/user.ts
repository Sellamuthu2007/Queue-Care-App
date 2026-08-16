export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: 'patient' | 'doctor' | 'nurse' | 'receptionist' | 'hospital_admin' | 'staff';
  age?: number;
  gender?: string;
  phone?: string;
  blood_group?: string;
  address?: string;
  medical_diseases?: string;
  medical_medications?: string;
  medical_insurance_available?: boolean;
  medical_insurance_provider?: string;
}
