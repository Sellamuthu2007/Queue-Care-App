import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Report } from '../../types/report';

interface ReportCardProps {
  report: Report;
  onPress: () => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        {/* Left side: Minimalist document icon */}
        <View style={styles.iconWrapper}>
          <View style={styles.docIcon}>
            <View style={styles.docLineLong} />
            <View style={styles.docLineShort} />
          </View>
        </View>

        {/* Center: Metadata */}
        <View style={styles.metaWrapper}>
          <View style={styles.typeBadgeContainer}>
            <Text style={styles.typeBadgeText}>{report.type}</Text>
          </View>
          <Text style={styles.titleText}>{report.title}</Text>
          <Text style={styles.doctorText}>{report.doctor}</Text>
          <Text style={styles.hospitalText}>{report.hospital}</Text>
          
          <View style={styles.footerRow}>
            <Ionicons name="calendar-outline" size={13} color="#64748B" />
            <Text style={styles.dateText}>{report.date}</Text>
            <View style={styles.fileBadge}>
              <Text style={styles.fileBadgeText}>{report.fileType}</Text>
            </View>
          </View>
        </View>

        {/* Right side: Arrow indicator */}
        <View style={styles.arrowWrapper}>
          <Ionicons name="chevron-forward-outline" size={16} color="#94A3B8" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#101B46',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docIcon: {
    width: 36,
    height: 46,
    borderWidth: 2,
    borderColor: '#475569',
    borderRadius: 5,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 6,
    gap: 4,
  },
  docLineLong: {
    width: 18,
    height: 2,
    backgroundColor: '#475569',
    borderRadius: 0.5,
  },
  docLineShort: {
    width: 10,
    height: 2,
    backgroundColor: '#475569',
    borderRadius: 0.5,
  },
  metaWrapper: {
    flex: 1,
  },
  typeBadgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#315BEF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  doctorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 1,
  },
  hospitalText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  fileBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
  },
  fileBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  arrowWrapper: {
    paddingLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '700',
  },
});
