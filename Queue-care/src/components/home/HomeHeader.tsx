import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, Image } from 'react-native';

interface HomeHeaderProps {
  userInitials?: string;
  notificationCount?: number;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({
  userInitials = 'QC',
  notificationCount = 3,
}) => {
  return (
    <View style={styles.container}>
      {/* Brand Header */}
      <View style={styles.brandRow}>
        <Text style={styles.brandTitle}>Queue Care</Text>
      </View>

      {/* Action Row: Avatar, Search, Notifications */}
      <View style={styles.actionRow}>
        {/* Profile Avatar with Photo */}
        <TouchableOpacity style={styles.avatarContainer} activeOpacity={0.8}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=120&auto=format&fit=crop' }}
            style={styles.avatar}
          />
          <View style={styles.statusIndicator} />
        </TouchableOpacity>

        {/* Search Input Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchIconWrapper}>
            <View style={styles.glassCircle} />
            <View style={styles.glassHandle} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search hospitals, doctors..."
            placeholderTextColor="#98A2B3"
            underlineColorAndroid="transparent"
          />
        </View>

        {/* Notification Bell Icon */}
        <TouchableOpacity style={styles.bellContainer} activeOpacity={0.7}>
          <View style={styles.bellIconWrapper}>
            <View style={styles.bellCup} />
            <View style={styles.bellRim} />
            <View style={styles.bellClapper} />
          </View>
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificationCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#F8FAFC', // Soft clinical light-gray background
    paddingBottom: 8,
  },
  brandRow: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#101B46', // Primary dark navy Queue Care brand color
    letterSpacing: -0.8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    marginVertical: 10,
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#315BEF', // Brand primary blue
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981', // Success green status indicator dot
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16, // Premium small rounding
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    height: 44,
    ...Platform.select({
      ios: {
        shadowColor: '#101B46',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  searchIconWrapper: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  glassCircle: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 1.8,
    borderColor: '#667085',
  },
  glassHandle: {
    width: 1.8,
    height: 6,
    backgroundColor: '#667085',
    transform: [{ rotate: '-45deg' }],
    marginTop: -2,
    marginLeft: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#101B46',
    fontWeight: '500',
    padding: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none' as any,
      },
    }),
  },
  bellContainer: {
    position: 'relative',
    width: 44,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#101B46',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  bellIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  bellCup: {
    width: 13,
    height: 11,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1.8,
    borderColor: '#667085',
    borderBottomWidth: 0,
  },
  bellRim: {
    width: 17,
    height: 1.8,
    backgroundColor: '#667085',
    borderRadius: 1,
  },
  bellClapper: {
    width: 5,
    height: 2.5,
    borderBottomLeftRadius: 2.5,
    borderBottomRightRadius: 2.5,
    backgroundColor: '#667085',
    marginTop: 1,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444', // Danger red notification badge
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
export default HomeHeader;
