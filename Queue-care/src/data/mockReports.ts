import { Report } from '../types/report';

export const mockReports: Report[] = [
  {
    id: 'rep-001',
    title: 'Complete Blood Count',
    type: 'Lab Test',
    description: 'Routine hematological examination assessing cellular elements of blood.',
    doctor: 'Dr. Ananya Rao',
    hospital: 'Apollo Medical Centre',
    department: 'General Medicine',
    date: '08 Aug 2026',
    fileType: 'PDF',
    status: 'Available',
    previewType: 'document',
    aiSummary: {
      overview: 'Most values shown in this prototype report fall within the provided reference ranges.',
      observations: [
        'Hemoglobin (14.2 g/dL) is within normal range (13.5 - 17.5 g/dL).',
        'WBC count (7,200 /µL) is normal, showing no active signs of acute infection.',
        'Platelet count (2.45 lakh/µL) is healthy and within reference limits.'
      ]
    },
    previewData: {
      patientName: 'Queue Care Demo Patient',
      patientId: 'QC-9872',
      metrics: [
        { test: 'Hemoglobin', result: '14.2 g/dL', reference: '13.5 - 17.5 g/dL', status: 'Normal' },
        { test: 'White Blood Cells (WBC)', result: '7,200 /µL', reference: '4,000 - 11,000 /µL', status: 'Normal' },
        { test: 'Red Blood Cells (RBC)', result: '4.8 M/µL', reference: '4.3 - 5.9 M/µL', status: 'Normal' },
        { test: 'Platelets', result: '2.45 L/µL', reference: '1.50 - 4.50 L/µL', status: 'Normal' },
        { test: 'Hematocrit', result: '42.5 %', reference: '41.0 - 50.0 %', status: 'Normal' }
      ]
    }
  },
  {
    id: 'rep-002',
    title: 'ECG Report',
    type: 'Scan',
    description: 'Electrocardiogram recording showing heart electrical patterns.',
    doctor: 'Dr. Arvind Raman',
    hospital: 'Apollo Hospital',
    department: 'Cardiology',
    date: '02 Aug 2026',
    fileType: 'PDF',
    status: 'Available',
    previewType: 'document',
    aiSummary: {
      overview: 'The electrocardiogram waveform tracing indicates a normal sinus rhythm with no critical abnormalities.',
      observations: [
        'Heart rate is stable at 72 beats per minute.',
        'PR Interval and QRS duration are within standard cardiac parameters.',
        'No signs of acute ST-elevation or myocardial ischemia observed.'
      ]
    },
    previewData: {
      patientName: 'Queue Care Demo Patient',
      patientId: 'QC-9872',
      metrics: [
        { test: 'Heart Rate', result: '72 bpm', reference: '60 - 100 bpm', status: 'Normal' },
        { test: 'Rhythm', result: 'Normal Sinus Rhythm', reference: 'Sinus Rhythm', status: 'Normal' },
        { test: 'PR Interval', result: '160 ms', reference: '120 - 200 ms', status: 'Normal' },
        { test: 'QRS Duration', result: '88 ms', reference: '80 - 120 ms', status: 'Normal' },
        { test: 'QTc Interval', result: '410 ms', reference: '< 440 ms', status: 'Normal' }
      ]
    }
  },
  {
    id: 'rep-003',
    title: 'Cardiology Prescription',
    type: 'Prescription',
    description: 'Prescribed medication program for blood pressure regulation.',
    doctor: 'Dr. Ananya Rao',
    hospital: 'Apollo Medical Centre',
    department: 'Cardiology',
    date: '27 Jul 2026',
    fileType: 'PDF',
    status: 'Available',
    previewType: 'document',
    aiSummary: {
      overview: 'Prescription consists of standard blood pressure and cholesterol management medications.',
      observations: [
        'Aspirin 75mg: Blood thinner to prevent cardiovascular complications.',
        'Atorvastatin 10mg: Prescribed to maintain healthy lipid levels.',
        'Metoprolol 25mg: Beta-blocker to support heart rate control.'
      ]
    },
    previewData: {
      patientName: 'Queue Care Demo Patient',
      patientId: 'QC-9872',
      medications: [
        { name: 'Aspirin', dosage: '75 mg', instructions: 'Once daily after breakfast', duration: '30 Days' },
        { name: 'Atorvastatin', dosage: '10 mg', instructions: 'Once daily at bedtime', duration: '30 Days' },
        { name: 'Metoprolol Succinate', dosage: '25 mg', instructions: 'Twice daily with meals', duration: '30 Days' }
      ]
    }
  },
  {
    id: 'rep-004',
    title: 'Lipid Profile',
    type: 'Lab Test',
    description: 'Comprehensive panel testing cholesterol fractionations.',
    doctor: 'Dr. Arvind Raman',
    hospital: 'Apollo Hospital',
    department: 'Cardiology',
    date: '20 Jul 2026',
    fileType: 'PDF',
    status: 'Available',
    previewType: 'document',
    aiSummary: {
      overview: 'Lipid panel results show overall healthy profiles, with a slight alert on boundary LDL levels.',
      observations: [
        'Total Cholesterol (185 mg/dL) is within recommended range (< 200 mg/dL).',
        'HDL (48 mg/dL) is within acceptable range (> 40 mg/dL).',
        'LDL (112 mg/dL) is borderline high. Consider active dietary monitoring.',
        'Triglycerides (125 mg/dL) are optimal (< 150 mg/dL).'
      ]
    },
    previewData: {
      patientName: 'Queue Care Demo Patient',
      patientId: 'QC-9872',
      metrics: [
        { test: 'Total Cholesterol', result: '185 mg/dL', reference: '< 200 mg/dL', status: 'Normal' },
        { test: 'HDL (Good) Cholesterol', result: '48 mg/dL', reference: '> 40 mg/dL', status: 'Normal' },
        { test: 'LDL (Bad) Cholesterol', result: '112 mg/dL', reference: '< 100 mg/dL', status: 'Attention' },
        { test: 'Triglycerides', result: '125 mg/dL', reference: '< 150 mg/dL', status: 'Normal' }
      ]
    }
  },
  {
    id: 'rep-005',
    title: 'Chest X-Ray',
    type: 'Scan',
    description: 'Posterior-Anterior chest view imaging.',
    doctor: 'Dr. Meera Krishnan',
    hospital: 'Apollo Medical Centre',
    department: 'Pulmonology',
    date: '15 Jul 2026',
    fileType: 'PDF',
    status: 'Available',
    previewType: 'document',
    aiSummary: {
      overview: 'The PA chest radiograph shows clear lung fields and healthy cardiac contours.',
      observations: [
        'Both lung fields are clear. No evidence of acute infiltration or collapse.',
        'No pleural effusion or consolidation detected.',
        'Cardiomegaly is absent; heart size and mediastinal contours are normal.'
      ]
    },
    previewData: {
      patientName: 'Queue Care Demo Patient',
      patientId: 'QC-9872',
      findings: [
        { area: 'Lungs', finding: 'Clear, no active infiltrates', status: 'Normal' },
        { area: 'Heart & Mediastinum', finding: 'Normal size and shadow contour', status: 'Normal' },
        { area: 'Pleural Spaces', finding: 'Costophrenic angles are sharp', status: 'Normal' },
        { area: 'Bones & Soft Tissues', finding: 'Intact thoracic skeletal cage', status: 'Normal' }
      ]
    }
  },
  {
    id: 'rep-006',
    title: 'Cardiology Consultation',
    type: 'Consultation',
    description: 'Specialist clinical assessment report.',
    doctor: 'Dr. Ananya Rao',
    hospital: 'Apollo Medical Centre',
    department: 'Cardiology',
    date: '10 Jul 2026',
    fileType: 'PDF',
    status: 'Available',
    previewType: 'document',
    aiSummary: {
      overview: 'Consultation report records steady cardiac progress and standard monitoring protocols.',
      observations: [
        'Systolic and diastolic blood pressure levels are controlled at 120/80 mmHg.',
        'Auscultation reveals regular heart sounds S1, S2. No murmur detected.',
        'Recommended ongoing lifestyle monitoring and repeat lipid panel in 3 months.'
      ]
    },
    previewData: {
      patientName: 'Queue Care Demo Patient',
      patientId: 'QC-9872',
      assessment: {
        complaint: 'Routine follow-up post hypertension management.',
        vitals: 'BP: 120/80 mmHg | Pulse: 70 bpm | Temp: 98.4 F',
        notes: 'The patient reports adherence to medications and diet plans. Vitals are stable. Continue low-sodium diet and daily exercise of 30 minutes. No active complaints.',
        plan: '1. Continue Metoprolol 25mg twice daily.\n2. Scheduled next review in 12 weeks.'
      }
    }
  },
  {
    id: 'rep-007',
    title: 'Vaccination Record',
    type: 'Vaccination',
    description: 'Official certification log for immunizations.',
    doctor: 'Dr. Meera Krishnan',
    hospital: 'Apollo Medical Centre',
    department: 'General Medicine',
    date: '01 Jul 2026',
    fileType: 'PDF',
    status: 'Available',
    previewType: 'document',
    aiSummary: {
      overview: 'Records show standard immunization verification and vaccine scheduling.',
      observations: [
        'Hepatitis B booster vaccine shot successfully administered.',
        'No post-vaccine clinical reactions reported.',
        'Immunity log status: Up-to-date.'
      ]
    },
    previewData: {
      patientName: 'Queue Care Demo Patient',
      patientId: 'QC-9872',
      vaccines: [
        { name: 'Hepatitis B Vaccine (Recombinant)', doseNumber: 'Booster', batch: 'HB8902A', dateAdministered: '01 Jul 2026' },
        { name: 'Influenza Vaccine (Quadrivalent)', doseNumber: 'Annual', batch: 'FL4451B', dateAdministered: '10 Oct 2025' }
      ]
    }
  },
  {
    id: 'rep-008',
    title: 'Diabetes Screening',
    type: 'Lab Test',
    description: 'Endocrine panel to monitor blood glucose indices.',
    doctor: 'Dr. Arvind Raman',
    hospital: 'Apollo Hospital',
    department: 'Endocrinology',
    date: '24 Jun 2026',
    fileType: 'PDF',
    status: 'Available',
    previewType: 'document',
    aiSummary: {
      overview: 'Diabetes screening shows healthy fasting glucose and HbA1c values.',
      observations: [
        'Fasting Blood Glucose (95 mg/dL) is optimal (< 100 mg/dL).',
        'HbA1c level (5.6%) is in the non-diabetic range (< 5.7%).',
        'No clinical indicators for impaired glucose tolerance at present.'
      ]
    },
    previewData: {
      patientName: 'Queue Care Demo Patient',
      patientId: 'QC-9872',
      metrics: [
        { test: 'Fasting Blood Glucose', result: '95 mg/dL', reference: '70 - 100 mg/dL', status: 'Normal' },
        { test: 'HbA1c (Glycated Hemoglobin)', result: '5.6 %', reference: '4.0 - 5.6 %', status: 'Normal' },
        { test: 'Estimated Average Glucose (eAG)', result: '114 mg/dL', reference: '90 - 120 mg/dL', status: 'Normal' }
      ]
    }
  }
];
