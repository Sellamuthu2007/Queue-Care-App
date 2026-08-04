export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  phone?: string;
  role: 'patient' | 'doctor' | 'nurse' | 'receptionist' | 'hospital_admin';
}
