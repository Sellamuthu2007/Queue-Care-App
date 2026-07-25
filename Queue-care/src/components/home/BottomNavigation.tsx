import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomNavigationProps {
  activeTab?: 'home' | 'reports' | 'settings';
  onTabChange?: (tab: 'home' | 'reports' | 'settings') => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab = 'home',
  onTabChange,
}) => {
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom > 0 ? insets.bottom + 8 : 16;

  const getTabColor = (tabName: 'home' | 'reports' | 'settings') => {
    return activeTab === tabName ? '#315BEF' : '#667085';
  };

  const renderIcon = (tabName: 'home' | 'reports' | 'settings') => {
    const color = getTabColor(tabName);

    switch (tabName) {
      case 'home':
        return (
          <View style={styles.iconContainer}>
            {/* Custom minimalist house shape */}
            <View style={[styles.houseRoof, { borderBottomColor: color }]} />
            <View style={[styles.houseBody, { borderColor: color }]} />
          </View>
        );
      case 'reports':
        return (
          <View style={styles.iconContainer}>
            {/* Custom minimalist file folder shape */}
            <View style={[styles.fileBody, { borderColor: color }]}>
              <View style={[styles.fileLine, { backgroundColor: color }]} />
              <View style={[styles.fileLine, { backgroundColor: color, width: 6 }]} />
            </View>
          </View>
        );
      case 'settings':
        return (
          <View style={styles.iconContainer}>
            {/* Custom concentric circular gear shapes */}
            <View style={[styles.gearOuter, { borderColor: color }]}>
              <View style={[styles.gearInner, { borderColor: color }]} />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.floatingNav, { bottom: bottomOffset }]}>
      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabChange && onTabChange('home')}
        activeOpacity={0.7}
      >
        {renderIcon('home')}
        <Text style={[styles.tabLabel, { color: getTabColor('home') }]}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabChange && onTabChange('reports')}
        activeOpacity={0.7}
      >
        {renderIcon('reports')}
        <Text style={[styles.tabLabel, { color: getTabColor('reports') }]}>Reports</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabChange && onTabChange('settings')}
        activeOpacity={0.7}
      >
        {renderIcon('settings')}
        <Text style={[styles.tabLabel, { color: getTabColor('settings') }]}>Settings</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingNav: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 72,
    backgroundColor: '#FFFFFF',
    borderRadius: 24, // Consistent large corner rounding
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#101B46',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 8px 30px -4px rgba(16, 27, 70, 0.12)',
      } as any,
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // HOUSE OUTLINE ICON DRAWING
  houseRoof: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginBottom: -1,
  },
  houseBody: {
    width: 14,
    height: 9,
    borderWidth: 1.8,
    borderTopWidth: 0,
    borderBottomLeftRadius: 1.5,
    borderBottomRightRadius: 1.5,
  },
  // FILE OUTLINE ICON DRAWING
  fileBody: {
    width: 12,
    height: 16,
    borderWidth: 1.8,
    borderRadius: 2,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 2,
    gap: 2,
  },
  fileLine: {
    width: 6,
    height: 1.5,
    borderRadius: 0.5,
  },
  // GEAR OUTLINE ICON DRAWING
  gearOuter: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 1.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gearInner: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    borderWidth: 1.5,
  },
});
export default BottomNavigation;
