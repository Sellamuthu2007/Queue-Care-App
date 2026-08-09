CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    doctor_name VARCHAR(255) NOT NULL DEFAULT '',
    hospital_name VARCHAR(255) NOT NULL DEFAULT '',
    department VARCHAR(255) NOT NULL DEFAULT '',
    report_date TIMESTAMP NOT NULL,
    file_url TEXT NOT NULL DEFAULT '',
    file_type VARCHAR(50) NOT NULL DEFAULT 'PDF',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_report_date ON reports(report_date);

-- Seed initial mock reports for the first user
INSERT INTO reports (user_id, title, type, description, doctor_name, hospital_name, department, report_date, file_url, file_type)
SELECT 
    id, 
    'Complete Blood Count', 
    'Lab Test', 
    'Routine hematology evaluation checking cell counts.', 
    'Dr. Ananya Rao', 
    'Apollo Medical Centre', 
    'General Medicine', 
    NOW() - INTERVAL '1 day', 
    'mock_cbc_report.pdf', 
    'PDF'
FROM users LIMIT 1 ON CONFLICT DO NOTHING;

INSERT INTO reports (user_id, title, type, description, doctor_name, hospital_name, department, report_date, file_url, file_type)
SELECT 
    id, 
    'ECG Report', 
    'Scan', 
    'Electrocardiogram tracing of heart electrical activity.', 
    'Dr. Arvind Raman', 
    'Apollo Hospital', 
    'Cardiology', 
    NOW() - INTERVAL '7 days', 
    'mock_ecg_report.pdf', 
    'PDF'
FROM users LIMIT 1 ON CONFLICT DO NOTHING;

INSERT INTO reports (user_id, title, type, description, doctor_name, hospital_name, department, report_date, file_url, file_type)
SELECT 
    id, 
    'Cardiology Prescription', 
    'Prescription', 
    'Prescribed medications for cardiovascular management.', 
    'Dr. Ananya Rao', 
    'Apollo Medical Centre', 
    'Cardiology', 
    NOW() - INTERVAL '13 days', 
    'mock_prescription_cardio.pdf', 
    'PDF'
FROM users LIMIT 1 ON CONFLICT DO NOTHING;

INSERT INTO reports (user_id, title, type, description, doctor_name, hospital_name, department, report_date, file_url, file_type)
SELECT 
    id, 
    'Lipid Profile', 
    'Lab Test', 
    'Cholesterol and triglycerides level assessment.', 
    'Dr. Arvind Raman', 
    'Apollo Hospital', 
    'Cardiology', 
    NOW() - INTERVAL '20 days', 
    'mock_lipid_profile.pdf', 
    'PDF'
FROM users LIMIT 1 ON CONFLICT DO NOTHING;

INSERT INTO reports (user_id, title, type, description, doctor_name, hospital_name, department, report_date, file_url, file_type)
SELECT 
    id, 
    'Chest X-Ray', 
    'Scan', 
    'Posterior-anterior view chest radiograph.', 
    'Dr. Meera Krishnan', 
    'Apollo Medical Centre', 
    'Pulmonology', 
    NOW() - INTERVAL '25 days', 
    'mock_chest_xray.pdf', 
    'PDF'
FROM users LIMIT 1 ON CONFLICT DO NOTHING;

INSERT INTO reports (user_id, title, type, description, doctor_name, hospital_name, department, report_date, file_url, file_type)
SELECT 
    id, 
    'Cardiology Consultation', 
    'Consultation', 
    'Initial cardiovascular review session findings.', 
    'Dr. Ananya Rao', 
    'Apollo Medical Centre', 
    'Cardiology', 
    NOW() - INTERVAL '30 days', 
    'mock_consultation_notes.pdf', 
    'PDF'
FROM users LIMIT 1 ON CONFLICT DO NOTHING;

INSERT INTO reports (user_id, title, type, description, doctor_name, hospital_name, department, report_date, file_url, file_type)
SELECT 
    id, 
    'Vaccination Record', 
    'Vaccination', 
    'Hepatitis B booster vaccine shot verification.', 
    'Dr. Meera Krishnan', 
    'Apollo Medical Centre', 
    'General Medicine', 
    NOW() - INTERVAL '39 days', 
    'mock_vaccination_log.pdf', 
    'PDF'
FROM users LIMIT 1 ON CONFLICT DO NOTHING;

INSERT INTO reports (user_id, title, type, description, doctor_name, hospital_name, department, report_date, file_url, file_type)
SELECT 
    id, 
    'Diabetes Screening', 
    'Lab Test', 
    'Fasting blood sugar and HbA1c screening metrics.', 
    'Dr. Arvind Raman', 
    'Apollo Hospital', 
    'Endocrinology', 
    NOW() - INTERVAL '46 days', 
    'mock_diabetes_report.pdf', 
    'PDF'
FROM users LIMIT 1 ON CONFLICT DO NOTHING;
