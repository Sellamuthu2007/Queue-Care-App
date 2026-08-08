-- Create Hospitals Table
CREATE TABLE IF NOT EXISTS hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    rating DECIMAL(3, 2) NOT NULL DEFAULT 0.0,
    open_hours VARCHAR(100) NOT NULL,
    emergency_availability BOOLEAN NOT NULL DEFAULT true,
    phone_number VARCHAR(50) NOT NULL,
    about TEXT NOT NULL,
    facilities TEXT NOT NULL DEFAULT '[]', -- JSON string array
    departments TEXT NOT NULL DEFAULT '[]', -- JSON string array
    services TEXT NOT NULL DEFAULT '[]', -- JSON string array
    cover_image_url TEXT NOT NULL DEFAULT ''
);

-- Create Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    qualification VARCHAR(255) NOT NULL,
    experience INT NOT NULL,
    consultation_fee DECIMAL(10, 2) NOT NULL,
    available_today BOOLEAN NOT NULL DEFAULT true,
    rating DECIMAL(3, 2) NOT NULL DEFAULT 0.0,
    languages TEXT NOT NULL DEFAULT '[]', -- JSON string array
    short_description TEXT NOT NULL,
    profile_photo_url TEXT NOT NULL DEFAULT '',
    registration_number VARCHAR(100) NOT NULL DEFAULT '',
    patients_treated INT NOT NULL DEFAULT 0,
    biography TEXT NOT NULL DEFAULT '',
    special_interests TEXT NOT NULL DEFAULT '[]', -- JSON string array
    education TEXT NOT NULL DEFAULT '[]', -- JSON string array
    working_hours VARCHAR(100) NOT NULL DEFAULT '',
    available_days TEXT NOT NULL DEFAULT '[]', -- JSON string array
    hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL
);

-- Create Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    hospital_id UUID REFERENCES hospitals(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(20) NOT NULL,
    department VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    symptoms TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Booked',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    queue_position INT NOT NULL DEFAULT 0,
    estimated_wait INT NOT NULL DEFAULT 0, -- in minutes
    slot_capacity INT NOT NULL DEFAULT 10,
    booked_count INT NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    -- Patient details
    patient_name VARCHAR(255) NOT NULL DEFAULT '',
    patient_age INT NOT NULL DEFAULT 0,
    patient_gender VARCHAR(20) NOT NULL DEFAULT '',
    patient_phone VARCHAR(50) NOT NULL DEFAULT '',
    patient_email VARCHAR(255) NOT NULL DEFAULT '',
    patient_address TEXT NOT NULL DEFAULT '',
    patient_blood_group VARCHAR(10) NOT NULL DEFAULT '',
    patient_emergency_contact VARCHAR(50) NOT NULL DEFAULT '',
    -- Medical details
    medical_diseases TEXT NOT NULL DEFAULT '',
    medical_medications TEXT NOT NULL DEFAULT '',
    medical_previous_visit BOOLEAN NOT NULL DEFAULT false,
    medical_insurance_available BOOLEAN NOT NULL DEFAULT false,
    medical_insurance_provider VARCHAR(255) NOT NULL DEFAULT ''
);

-- Clean up any duplicate doctors and hospitals that don't match our static UUIDs
DELETE FROM doctors WHERE id NOT IN ('7a93c8e3-f330-4c29-86dd-c8aba0538b90', '2c8a9f0e-d713-4c91-b68a-cf8e234c9c10');
DELETE FROM hospitals WHERE id NOT IN ('b2eee8bb-49d3-4e12-b42d-37baa3d44e63');

-- Seed Initial Default Hospital
INSERT INTO hospitals (id, name, address, rating, open_hours, emergency_availability, phone_number, about, facilities, departments, services, cover_image_url)
VALUES (
    'b2eee8bb-49d3-4e12-b42d-37baa3d44e63',
    'Queue Care General Hospital', 
    '12 Medical District, New Delhi, India 110001', 
    4.8, 
    '24/7 Open', 
    true, 
    '+91 11 4040 8080', 
    'Queue Care General Hospital is a state-of-the-art medical center dedicated to providing world-class healthcare. Our hospital features advanced diagnostic services, specialized clinical operations, and an automated token queue system that estimates and manages waiting times efficiently.',
    '["ICU & CCU", "24/7 Pharmacy", "Diagnostic Labs", "Ambulance Support", "Emergency Wing", "In-patient Wards"]',
    '["Cardiology", "Neurology", "Orthopedics", "ENT", "Pediatrics", "General Medicine", "Dentist"]',
    '["Consultations", "Out-patient checkups", "Advanced Surgeries", "Diagnostics & Scans", "Critical Care", "Physiotherapy"]',
    'hospital_cover'
) ON CONFLICT (id) DO NOTHING;

-- Seed Initial Doctors
INSERT INTO doctors (id, name, specialization, qualification, experience, consultation_fee, available_today, rating, languages, short_description, profile_photo_url, registration_number, patients_treated, biography, special_interests, education, working_hours, available_days, hospital_id)
VALUES (
    '7a93c8e3-f330-4c29-86dd-c8aba0538b90',
    'Dr. Sarah Rahman', 
    'Cardiology', 
    'MBBS, MD (Cardiology), FACC', 
    14, 
    800.00, 
    true, 
    4.9, 
    '["English", "Hindi", "Urdu"]', 
    'Expert cardiologist specializing in non-invasive cardiac checkups, heart failure care, and preventive health.', 
    'doctor_cardiology', 
    'MC-98240-A', 
    12500, 
    'Dr. Sarah Rahman is a highly regarded cardiologist who has spent over 14 years healing hearts and managing patient queues at premium medical clinics.',
    '["Preventive Cardiology", "Echocardiography", "Heart Failure Management"]',
    '["MBBS - Delhi University", "MD Cardiology - AIIMS", "Fellowship - American College of Cardiology"]',
    '09:00 AM - 01:00 PM',
    '["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]',
    'b2eee8bb-49d3-4e12-b42d-37baa3d44e63'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO doctors (id, name, specialization, qualification, experience, consultation_fee, available_today, rating, languages, short_description, profile_photo_url, registration_number, patients_treated, biography, special_interests, education, working_hours, available_days, hospital_id)
VALUES (
    '2c8a9f0e-d713-4c91-b68a-cf8e234c9c10',
    'Dr. Alok Verma', 
    'Neurology', 
    'MBBS, DM (Neurology), PhD', 
    11, 
    1000.00, 
    true, 
    4.8, 
    '["English", "Hindi"]', 
    'Renowned neurologist focused on migraines, stroke management, and sleep disorder therapies.', 
    'doctor_neurology', 
    'MC-74112-B', 
    8900, 
    'Dr. Alok Verma specializes in mapping brain functions and treating chronic headache syndromes.',
    '["Stroke Rehabilitation", "Migraine Therapies", "Neuropathy Treatments"]',
    '["MBBS - BHU", "DM Neurology - NIMHANS", "Post-Doc Research - Oxford"]',
    '02:00 PM - 06:00 PM',
    '["Monday", "Wednesday", "Friday"]',
    'b2eee8bb-49d3-4e12-b42d-37baa3d44e63'
) ON CONFLICT (id) DO NOTHING;
