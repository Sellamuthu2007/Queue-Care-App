export interface User {
  id: string;
  email: string;
  phone?: string;
  role: 'patient' | 'doctor' | 'nurse' | 'receptionist' | 'hospital_admin';
}
