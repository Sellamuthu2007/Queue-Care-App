import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Report } from '../../types/report';

interface ReportPreviewProps {
  report: Report;
}

export const ReportPreview: React.FC<ReportPreviewProps> = ({ report }) => {
  const data = report.previewData || {};

  const renderContent = () => {
    switch (report.type) {
      case 'Lab Test':
        return (
          <View style={styles.section}>
            <View style={styles.tableHeader}>
              <Text style={[styles.columnHeader, { flex: 2 }]}>Test Name</Text>
              <Text style={[styles.columnHeader, { flex: 1, textAlign: 'right' }]}>Result</Text>
              <Text style={[styles.columnHeader, { flex: 1.5, textAlign: 'right' }]}>Reference Range</Text>
            </View>
            {data.metrics && data.metrics.map((item: any, index: number) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.cellText, { flex: 2, fontWeight: '600', color: '#334155' }]}>{item.test}</Text>
                <Text style={[styles.cellText, { flex: 1, textAlign: 'right', fontWeight: '700', color: item.status === 'Attention' ? '#EF4444' : '#1E293B' }]}>{item.result}</Text>
                <Text style={[styles.cellText, { flex: 1.5, textAlign: 'right', color: '#64748B' }]}>{item.reference}</Text>
              </View>
            ))}
          </View>
        );

      case 'Prescription':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rx (Prescribed Medications)</Text>
            {data.medications && data.medications.map((item: any, index: number) => (
              <View key={index} style={styles.medicationRow}>
                <View style={styles.medHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="medical-outline" size={13} color="#315BEF" />
                    <Text style={styles.medName}>{item.name}</Text>
                  </View>
                  <Text style={styles.medDuration}>{item.duration}</Text>
                </View>
                <Text style={styles.medDetails}>Dosage: {item.dosage} • Instructions: {item.instructions}</Text>
              </View>
            ))}
          </View>
        );

      case 'Scan':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Radiology/Scan Findings</Text>
            {data.findings ? (
              data.findings.map((item: any, index: number) => (
                <View key={index} style={styles.findingRow}>
                  <Text style={styles.findingArea}>{item.area}</Text>
                  <Text style={styles.findingText}>{item.finding}</Text>
                </View>
              ))
            ) : data.metrics ? (
              // Fallback for ECG
              data.metrics.map((item: any, index: number) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.cellText, { flex: 2, fontWeight: '600', color: '#334155' }]}>{item.test}</Text>
                  <Text style={[styles.cellText, { flex: 2, textAlign: 'right', fontWeight: '700', color: '#1E293B' }]}>{item.result}</Text>
                </View>
              ))
            ) : null}
          </View>
        );

      case 'Consultation':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Clinical Summary & Vitals</Text>
            <View style={styles.vitalBox}>
              <Text style={styles.vitalText}>{data.assessment?.vitals}</Text>
            </View>
            
            <Text style={styles.clinicalHeader}>Reason for Visit / Complaint</Text>
            <Text style={styles.clinicalBody}>{data.assessment?.complaint}</Text>
            
            <Text style={styles.clinicalHeader}>Clinical Examination Notes</Text>
            <Text style={styles.clinicalBody}>{data.assessment?.notes}</Text>
            
            <Text style={styles.clinicalHeader}>Treatment Plan</Text>
            <Text style={styles.clinicalBody}>{data.assessment?.plan}</Text>
          </View>
        );

      case 'Vaccination':
        return (
          <View style={styles.section}>
            <View style={styles.tableHeader}>
              <Text style={[styles.columnHeader, { flex: 2 }]}>Vaccine Name</Text>
              <Text style={[styles.columnHeader, { flex: 1, textAlign: 'center' }]}>Dose</Text>
              <Text style={[styles.columnHeader, { flex: 1.2, textAlign: 'right' }]}>Batch No.</Text>
            </View>
            {data.vaccines && data.vaccines.map((item: any, index: number) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.cellText, { flex: 2, fontWeight: '600', color: '#334155' }]}>{item.name}</Text>
                <Text style={[styles.cellText, { flex: 1, textAlign: 'center', color: '#1E293B', fontWeight: '600' }]}>{item.doseNumber}</Text>
                <Text style={[styles.cellText, { flex: 1.2, textAlign: 'right', color: '#64748B' }]}>{item.batch}</Text>
              </View>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.previewContainer}>
      {/* Prototype Banner Watermark */}
      <View style={styles.watermarkBanner}>
        <Text style={styles.watermarkText}>PROTOTYPE REPORT • DEMONSTRATION CONTENT ONLY</Text>
      </View>

      {/* Clinical Letterhead */}
      <View style={styles.letterhead}>
        <Text style={styles.hospitalText}>{report.hospital.toUpperCase()}</Text>
        <Text style={styles.departmentText}>{report.department} Department</Text>
        <View style={styles.divider} />
      </View>

      {/* Patient Header Block */}
      <View style={styles.patientMeta}>
        <View style={styles.metaCol}>
          <Text style={styles.metaLabel}>PATIENT NAME</Text>
          <Text style={styles.metaValue}>{data.patientName || 'Queue Care Demo Patient'}</Text>
        </View>
        <View style={styles.metaColRight}>
          <Text style={styles.metaLabelRight}>REPORT DATE</Text>
          <Text style={styles.metaValueRight}>{report.date}</Text>
        </View>
      </View>

      <View style={styles.patientMeta}>
        <View style={styles.metaCol}>
          <Text style={styles.metaLabel}>PHYSICIAN</Text>
          <Text style={styles.metaValue}>{report.doctor}</Text>
        </View>
        <View style={styles.metaColRight}>
          <Text style={styles.metaLabelRight}>RECORD TYPE</Text>
          <Text style={styles.metaValueRight}>{report.type}</Text>
        </View>
      </View>

      <View style={[styles.divider, { marginVertical: 12 }]} />

      {/* Screen Title */}
      <Text style={styles.reportTitle}>{report.title}</Text>

      {/* Dynamically Rendered Medical Data */}
      {renderContent()}

      <View style={[styles.divider, { marginVertical: 14 }]} />

      {/* Footer Signature Block */}
      <View style={styles.letterheadFooter}>
        <Text style={styles.footerSignature}>Digitally Certified Document</Text>
        <Text style={styles.footerDisclaimer}>Verified by: {report.doctor}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  previewContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 16,
    marginVertical: 12,
  },
  watermarkBanner: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    marginBottom: 16,
  },
  watermarkText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  letterhead: {
    alignItems: 'center',
    marginBottom: 12,
  },
  hospitalText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  departmentText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    width: '100%',
    marginTop: 10,
  },
  patientMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaCol: {
    flex: 1,
  },
  metaColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 8,
    color: '#94A3B8',
    fontWeight: '800',
    marginBottom: 2,
  },
  metaLabelRight: {
    fontSize: 8,
    color: '#94A3B8',
    fontWeight: '800',
    marginBottom: 2,
    textAlign: 'right',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  metaValueRight: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'right',
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginVertical: 12,
  },
  section: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  columnHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F1F5F9',
  },
  cellText: {
    fontSize: 11,
  },
  medicationRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
  },
  medHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  medName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  medDuration: {
    fontSize: 10,
    fontWeight: '700',
    color: '#315BEF',
  },
  medDetails: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 14,
  },
  findingRow: {
    borderLeftWidth: 3,
    borderLeftColor: '#315BEF',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  findingArea: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  findingText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 14,
  },
  vitalBox: {
    backgroundColor: '#F1F5F9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  vitalText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  clinicalHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    marginTop: 10,
    marginBottom: 4,
  },
  clinicalBody: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginBottom: 8,
  },
  letterheadFooter: {
    alignItems: 'center',
    marginTop: 12,
  },
  footerSignature: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  footerDisclaimer: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 2,
  },
});
