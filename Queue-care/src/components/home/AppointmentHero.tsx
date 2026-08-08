import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';

export interface Appointment {
  id: string;
  specialization: string;
  hospitalName: string;
  location: string;
  date: string;
  time: string;
  tokenNumber: string;
  status: string;
}

interface AppointmentHeroProps {
  appointments: Appointment[];
  state?: 'normal' | 'loading' | 'empty' | 'error';
  onRetry?: () => void;
  onBookPress?: () => void;
  onDetailsPress?: (id: string) => void;
}

export const AppointmentHero: React.FC<AppointmentHeroProps> = ({
  appointments = [],
  state = 'normal',
  onRetry,
  onBookPress,
  onDetailsPress,
}) => {
  const appt = appointments[0]; // Restrict the display to only the first active appointment object

  // 1. LOADING SKELETON STATE
  if (state === 'loading') {
    return (
      <View style={styles.outerContainer}>
        <View style={styles.skeletonCard}>
          <View style={styles.skeletonHeader} />
          <View style={styles.skeletonTextLineLarge} />
          <View style={styles.skeletonTextLineMedium} />
          <View style={styles.skeletonTextLineSmall} />
          <View style={styles.skeletonDivider} />
          <View style={styles.skeletonBottomRow}>
            <View style={styles.skeletonBadge} />
            <View style={styles.skeletonToken} />
          </View>
        </View>
      </View>
    );
  }

  // 2. ERROR STATE
  if (state === 'error') {
    return (
      <View style={styles.outerContainer}>
        <View style={styles.errorCard}>
          <View style={styles.errorIcon}>
            <Text style={styles.errorIconText}>⚠</Text>
          </View>
          <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
          <Text style={styles.errorSubtitle}>Unable to load appointment details.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 3. EMPTY STATE
  if (state === 'empty' || !appt) {
    return (
      <View style={styles.outerContainer}>
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrapper}>
            <View style={styles.emptyCalendarOutline}>
              <View style={styles.emptyCalendarHeader} />
              <Text style={styles.emptyCalendarCheck}>✓</Text>
            </View>
          </View>
          <Text style={styles.emptyTitle}>No Upcoming Appointments</Text>
          <Text style={styles.emptySubtitle}>Book an appointment with a doctor to get started.</Text>
          <TouchableOpacity style={styles.emptyBookButton} onPress={onBookPress} activeOpacity={0.8}>
            <Text style={styles.emptyBookButtonText}>Book Appointment</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 4. NORMAL SINGLE CARD STATE
  return (
    <View style={{ width: '100%', paddingHorizontal: 16, marginVertical: 12 }}>
      <TouchableOpacity 
        style={{ backgroundColor: '#315BEF', borderRadius: 20, padding: 20 }}
        onPress={() => onDetailsPress?.(appt.id)}
        activeOpacity={0.9}
      >
        <Text style={{ color: '#E2E8F0', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 }}>
          YOUR UPCOMING APPOINTMENT
        </Text>
        <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', marginBottom: 4 }}>
          {appt.specialization}
        </Text>
        <Text style={{ color: '#E2E8F0', fontSize: 14, marginBottom: 12 }}>
          {appt.hospitalName}, {appt.location}
        </Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' }}>
            📅 {appt.date.split('T')[0]} • 🕒 {appt.time}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 10 }}>
          <View style={{ backgroundColor: '#FFFFFF', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 }}>
            <Text style={{ color: '#10B981', fontSize: 12, fontWeight: 'bold' }}>{appt.status}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: '#E2E8F0', fontSize: 10 }}>Token Number</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>{appt.tokenNumber}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    paddingHorizontal: 16, // Matches exact page layout padding margins
    marginVertical: 12,
  },
  // NORMAL CARD STYLING
  heroCard: {
    width: '100%',
    backgroundColor: '#315BEF', // Royal brand blue primary
    borderRadius: 20, // Consistent 20px rounded corners
    padding: 16, // 16px internal padding
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#101B46',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 8px 20px -4px rgba(16, 27, 70, 0.15)',
      } as any,
    }),
  },
  gradientOverlay: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    top: 0,
    width: '55%',
    backgroundColor: '#6C63E8', // Blends deep violet purple
    opacity: 0.65,
    borderTopLeftRadius: 130,
    borderBottomLeftRadius: 130,
  },
  calendarHeroImage: {
    position: 'absolute',
    right: 12,
    top: 16,
    width: 90,
    height: 90,
    opacity: 0.95,
  },
  decoratorCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    opacity: 0.08,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  cardHeaderLeft: {
    flex: 1,
    paddingRight: 60, // Clear floating illustration spacing
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E2E8F0',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  specialtyText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  hospitalText: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  clockIcon: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  clockCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  clockHand: {
    width: 1.5,
    height: 4,
    backgroundColor: '#E2E8F0',
    position: 'absolute',
    top: 5,
    left: 7.2,
  },
  dateTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(226, 232, 240, 0.15)',
    width: '100%',
    marginVertical: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Clean white background badge
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981', // Success green status dot
    marginRight: 6,
  },
  statusText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
  },
  tokenContainer: {
    alignItems: 'flex-end',
  },
  tokenLabel: {
    fontSize: 11,
    color: '#E2E8F0',
    fontWeight: '700',
    marginBottom: 2,
  },
  tokenValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  detailsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  detailsChevron: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // SKELETON LOADING CARD
  skeletonCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 16,
  },
  skeletonHeader: {
    width: 100,
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    marginBottom: 10,
  },
  skeletonTextLineLarge: {
    width: '80%',
    height: 20,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    marginBottom: 8,
  },
  skeletonTextLineMedium: {
    width: '60%',
    height: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    marginBottom: 14,
  },
  skeletonTextLineSmall: {
    width: '40%',
    height: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
  },
  skeletonDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    width: '100%',
    marginVertical: 14,
  },
  skeletonBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonBadge: {
    width: 80,
    height: 24,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
  },
  skeletonToken: {
    width: 60,
    height: 24,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
  },

  // ERROR CARD
  errorCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  errorIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorIconText: {
    color: '#EF4444',
    fontSize: 22,
    fontWeight: '700',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#101B46',
    marginBottom: 4,
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // EMPTY STATE CARD
  emptyCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  emptyIconWrapper: {
    marginBottom: 12,
  },
  emptyCalendarOutline: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderColor: '#6C63E8',
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
  },
  emptyCalendarHeader: {
    width: '100%',
    height: 10,
    backgroundColor: '#6C63E8',
  },
  emptyCalendarCheck: {
    color: '#6C63E8',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#101B46',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  emptyBookButton: {
    backgroundColor: '#315BEF',
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 20,
  },
  emptyBookButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
export default AppointmentHero;
