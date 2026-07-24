import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

interface BookActionCardProps {
  onPress?: () => void;
}

export const BookActionCard: React.FC<BookActionCardProps> = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* LEFT: Calendar/Appointment Icon */}
      <View style={styles.iconWrapper}>
        <View style={styles.calendarBody}>
          <View style={styles.calendarTop} />
          <View style={styles.calendarBinderRow}>
            <View style={styles.binderPin} />
            <View style={styles.binderPin} />
          </View>
          <View style={styles.calendarCenter}>
            <Text style={styles.plusSymbol}>+</Text>
          </View>
        </View>
      </View>

      {/* CENTER: Title & Description */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>Book Appointment</Text>
        <Text style={styles.description}>
          Schedule your next appointment with a doctor quickly and easily.
        </Text>
      </View>

      {/* RIGHT: Chevron Arrow */}
      <View style={styles.arrowWrapper}>
        <View style={styles.arrowTop} />
        <View style={styles.arrowBottom} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20, // Premium secondary corner rounding
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#101B46',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 12px -2px rgba(16, 27, 70, 0.05)',
      },
    }),
  },
  iconWrapper: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#F0F3FF', // Subtle light blue highlight background
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  calendarBody: {
    width: 24,
    height: 24,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#315BEF', // Brand primary blue calendar
    backgroundColor: '#FFFFFF',
    position: 'relative',
    overflow: 'hidden',
  },
  calendarTop: {
    width: '100%',
    height: 5,
    backgroundColor: '#315BEF',
  },
  calendarBinderRow: {
    position: 'absolute',
    top: -3,
    left: 4,
    right: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  binderPin: {
    width: 2,
    height: 4,
    backgroundColor: '#101B46',
    borderRadius: 1,
  },
  calendarCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusSymbol: {
    color: '#315BEF',
    fontSize: 13,
    fontWeight: '800',
    marginTop: -2,
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: '#101B46', // Primary dark navy
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    color: '#667085', // Secondary gray descriptor text
    lineHeight: 16,
    fontWeight: '500',
  },
  arrowWrapper: {
    width: 10,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowTop: {
    width: 8,
    height: 2,
    backgroundColor: '#315BEF', // Brand blue arrow lines
    transform: [{ rotate: '45deg' }],
    borderTopLeftRadius: 1,
    borderBottomLeftRadius: 1,
    marginBottom: 2,
  },
  arrowBottom: {
    width: 8,
    height: 2,
    backgroundColor: '#315BEF',
    transform: [{ rotate: '-45deg' }],
    borderTopLeftRadius: 1,
    borderBottomLeftRadius: 1,
    marginTop: 2,
  },
});
export default BookActionCard;
