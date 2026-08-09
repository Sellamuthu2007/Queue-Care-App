import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppNavigation } from '../../context/NavigationContext';
import { apiRequest } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import { Report } from '../../types/report';
import { mockReports } from '../../data/mockReports';
import { ReportPreview } from '../../components/home/ReportPreview';
import { AISummaryCard } from '../../components/home/AISummaryCard';

export const ReportDetailsScreen: React.FC = () => {
  const { screenParams, goBack } = useAppNavigation();
  const reportId = screenParams?.reportId;

  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  // Custom polished toast state
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastOpacity] = useState(new Animated.Value(0));

  const showToast = (message: string) => {
    setToastMessage(message);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToastMessage(''));
  };

  const fetchReportDetails = async () => {
    if (!reportId) {
      setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setIsError(false);
      
      const data = await apiRequest(`/reports/${reportId}`);
      if (data && data.id) {
        // Map backend keys to matching frontend structure
        const mapped: Report = {
          id: data.id,
          title: data.title,
          type: data.type,
          description: data.description,
          doctor: data.doctor_name,
          hospital: data.hospital_name,
          department: data.department,
          date: formatDate(data.report_date),
          fileType: data.file_type || 'PDF',
          status: 'Available',
          previewType: 'document',
          aiSummary: parseAiSummary(data.title, data.type),
          previewData: getPreviewDataForReport(data.title, data.type),
        };
        setReport(mapped);
      } else {
        // Fallback to local mock data
        const localFound = mockReports.find((r) => r.id === reportId);
        if (localFound) {
          setReport(localFound);
        } else {
          setIsError(true);
        }
      }
    } catch (err) {
      console.error('Error fetching report details, loading mock fallback:', err);
      // Resilient fallback to local mock data
      const localFound = mockReports.find((r) => r.id === reportId);
      if (localFound) {
        setReport(localFound);
      } else {
        setIsError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportDetails();
  }, [reportId]);

  // Helper date formatter
  const formatDate = (isoStr: string): string => {
    try {
      const d = new Date(isoStr);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return 'Today';
    }
  };

  // Helper mapper to generate AI summaries for database items matching demo structure
  const parseAiSummary = (title: string, type: string) => {
    const match = mockReports.find(
      (m) => m.title.toLowerCase() === title.toLowerCase() || m.type === type
    );
    return match?.aiSummary || {
      overview: 'This is a prototype overview statement describing health results.',
      observations: ['Values are within standard ranges.', 'No acute issues noted.'],
    };
  };

  // Helper mapper to generate preview clinical values for database items matching mock structures
  const getPreviewDataForReport = (title: string, type: string) => {
    const match = mockReports.find(
      (m) => m.title.toLowerCase() === title.toLowerCase() || m.type === type
    );
    return match?.previewData || {};
  };

  const handleDownload = () => {
    showToast('Report download will be connected in the next phase.');
  };

  const handleShare = () => {
    showToast('Report is ready to share.');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back-outline" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report Details</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.7}>
          <Ionicons name="share-social-outline" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Main Content scrollable area */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color="#315BEF" />
        </View>
      ) : isError || !report ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Unable to load report details</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchReportDetails} activeOpacity={0.7}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header info card */}
            <View style={styles.infoCard}>
              <View style={styles.typeTag}>
                <Text style={styles.typeTagText}>{report.type}</Text>
              </View>
              <Text style={styles.titleText}>{report.title}</Text>
              
              <View style={styles.gridContainer}>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Date</Text>
                  <Text style={styles.gridValue}>{report.date}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Department</Text>
                  <Text style={styles.gridValue}>{report.department}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.providerRow}>
                <View style={styles.providerCol}>
                  <Text style={styles.gridLabel}>Doctor</Text>
                  <Text style={styles.providerName}>{report.doctor}</Text>
                </View>
                <View style={styles.providerCol}>
                  <Text style={styles.gridLabel}>Hospital/Clinic</Text>
                  <Text style={styles.providerHospital}>{report.hospital}</Text>
                </View>
              </View>
            </View>

            {/* Document preview sheet */}
            <ReportPreview report={report} />

            {/* AI observations dashboard card */}
            {report.aiSummary && (
              <AISummaryCard
                overview={report.aiSummary.overview}
                observations={report.aiSummary.observations}
              />
            )}

            {/* Bottom Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={handleDownload}
                activeOpacity={0.8}
              >
                <Text style={styles.downloadButtonText}>Download Report (PDF)</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.shareSecondaryButton}
                onPress={handleShare}
                activeOpacity={0.8}
              >
                <Text style={styles.shareSecondaryButtonText}>Share with Doctor</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Floating Toast Notification overlay */}
      {toastMessage.length > 0 && (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIcon: {
    fontSize: 18,
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 400,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 12,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#315BEF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  typeTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  typeTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#315BEF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridItem: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 8,
    color: '#94A3B8',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  providerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  providerCol: {
    flex: 1,
  },
  providerName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  providerHospital: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  actionsContainer: {
    marginTop: 12,
    gap: 8,
  },
  downloadButton: {
    backgroundColor: '#315BEF',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  shareSecondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareSecondaryButtonText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 14,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default ReportDetailsScreen;
