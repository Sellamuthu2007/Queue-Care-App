import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';

interface TipItem {
  id: string;
  title: string;
  description: string;
  bg: string;
  accent: string;
  imgUrl: string;
}

const WELLNESS_TIPS: TipItem[] = [
  {
    id: 'tip-1',
    title: 'Stay Hydrated',
    description: 'Drink at least 8 glasses of water daily.',
    bg: '#E0F2FE', // Soft aqua
    accent: '#0369A1',
    imgUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=150&auto=format&fit=crop',
  },
  {
    id: 'tip-2',
    title: 'Daily Exercise',
    description: '30 mins of exercise keeps you healthy.',
    bg: '#FEF3C7', // Soft warm yellow
    accent: '#B45309',
    imgUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=150&auto=format&fit=crop',
  },
  {
    id: 'tip-3',
    title: 'Good Sleep',
    description: '7-8 hours of sleep improves immunity.',
    bg: '#F3E8FF', // Soft lavender
    accent: '#6B21A8',
    imgUrl: 'https://images.unsplash.com/photo-1511295742364-92767fa62d9f?q=80&w=150&auto=format&fit=crop',
  },
  {
    id: 'tip-4',
    title: 'Eat Healthy',
    description: 'Eat fresh & balanced food every day.',
    bg: '#D1FAE5', // Soft mint green
    accent: '#047857',
    imgUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=150&auto=format&fit=crop',
  },
];

export const HealthyLifeSection: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Section Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>For a Healthy Life</Text>
        <TouchableOpacity style={styles.seeAllButton} activeOpacity={0.7}>
          <Text style={styles.seeAllText}>See All &gt;</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontally Scrollable Tip Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {WELLNESS_TIPS.map((tip) => (
          <View key={tip.id} style={[styles.card, { backgroundColor: tip.bg }]}>
            {/* LEFT: Mini Illustration image */}
            <Image
              source={{ uri: tip.imgUrl }}
              style={styles.cardImage}
            />

            {/* RIGHT: Text Content Stack */}
            <View style={styles.textStack}>
              <Text style={[styles.cardTitle, { color: tip.accent }]}>
                {tip.title}
              </Text>
              <Text style={styles.cardDescription} numberOfLines={2}>
                {tip.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#101B46', // Primary dark navy
  },
  seeAllButton: {
    paddingVertical: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#315BEF', // Brand primary blue
  },
  scrollContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 220,
    height: 94,
    borderRadius: 18, // Premium small/secondary rounding
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#101B46',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 2px 8px rgba(16, 27, 70, 0.02)',
      } as any,
    }),
  },
  cardImage: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginRight: 12,
  },
  textStack: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    lineHeight: 14,
  },
});
export default HealthyLifeSection;
