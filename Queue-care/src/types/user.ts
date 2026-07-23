export interface User {
  id: string;
  phone: string;
  role: 'patient' | 'doctor' | 'nurse' | 'receptionist' | 'hospital_admin';
}
