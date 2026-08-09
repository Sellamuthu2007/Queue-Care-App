import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AISummaryCardProps {
  overview: string;
  observations: string[];
}

export const AISummaryCard: React.FC<AISummaryCardProps> = ({ overview, observations }) => {
  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Ionicons name="sparkles" size={16} color="#315BEF" />
        <Text style={styles.title}>AI Summary</Text>
      </View>
      
      {/* Overview Block */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Prototype Insight</Text>
        <Text style={styles.overviewText}>"{overview}"</Text>
      </View>

      {/* Observations list */}
      {observations && observations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Key Observations</Text>
          {observations.map((obs, index) => (
            <View key={index} style={styles.bulletRow}>
              <Text style={styles.bulletIcon}>•</Text>
              <Text style={styles.bulletText}>{obs}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Disclaimer */}
      <View style={styles.disclaimerContainer}>
        <Ionicons name="alert-circle-outline" size={14} color="#B45309" />
        <Text style={styles.disclaimerText}>
          This prototype summary is for demonstration purposes only and does not replace professional medical advice.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginVertical: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  section: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  overviewText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingRight: 8,
  },
  bulletIcon: {
    fontSize: 14,
    color: '#315BEF',
    marginRight: 8,
    lineHeight: 16,
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  disclaimerContainer: {
    marginTop: 6,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#FDE68A',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 10,
    color: '#B45309',
    fontWeight: '600',
    lineHeight: 13,
  },
});
