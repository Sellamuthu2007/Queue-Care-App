export interface Report {
  id: string;
  title: string;
  type: 'Lab Test' | 'Prescription' | 'Scan' | 'Consultation' | 'Vaccination';
  description: string;
  doctor: string;
  hospital: string;
  department: string;
  date: string;
  fileType: string;
  status: 'Available';
  previewType: 'document';
  aiSummary?: {
    overview: string;
    observations: string[];
  };
  previewData?: any;
}
