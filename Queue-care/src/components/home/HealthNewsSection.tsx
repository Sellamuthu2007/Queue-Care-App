import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  time: string;
  tag: string;
  imgUrl: string;
}

const NEWS_DATA: NewsItem[] = [
  {
    id: 'news-1',
    title: '10 Everyday Habits for a Healthier Heart',
    description: 'Simple changes in your daily routine can improve heart health and extend your life.',
    time: '2h ago',
    tag: 'Heart',
    imgUrl: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?q=80&w=150&auto=format&fit=crop',
  },
  {
    id: 'news-2',
    title: 'New Breakthrough in Lung Disease Treatment',
    description: 'Researchers have developed a new therapy that shows promise in faster recovery.',
    time: '5h ago',
    tag: 'Lung',
    imgUrl: 'https://images.unsplash.com/photo-1579684389782-64d84b5e901a?q=80&w=150&auto=format&fit=crop',
  },
  {
    id: 'news-3',
    title: "Flu Cases Rising: Here's How to Stay Safe",
    description: 'Follow these preventive measures to protect yourself and your family this season.',
    time: '1d ago',
    tag: 'Flu',
    imgUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?q=80&w=150&auto=format&fit=crop',
  },
];

export const HealthNewsSection: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Health News & Updates</Text>
        <TouchableOpacity style={styles.seeAllButton} activeOpacity={0.7}>
          <Text style={styles.seeAllText}>See All &gt;</Text>
        </TouchableOpacity>
      </View>

      {/* Vertical News Feed */}
      <View style={styles.newsList}>
        {NEWS_DATA.map((item, index) => (
          <View key={item.id}>
            <TouchableOpacity style={styles.newsRow} activeOpacity={0.7}>
              {/* LEFT: Rounded Thumbnail Image */}
              <Image
                source={{ uri: item.imgUrl }}
                style={styles.thumbnail}
              />

              {/* CENTER: Text Details */}
              <View style={styles.textContainer}>
                <View style={styles.titleRow}>
                  <Text style={styles.titleText} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>
                <Text style={styles.descriptionText} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Separator Divider Line (except last item) */}
            {index < NEWS_DATA.length - 1 && <View style={styles.separator} />}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 14,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
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
  newsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22, // Premium secondary corner rounding
    marginHorizontal: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#101B46',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 12px rgba(16, 27, 70, 0.03)',
      } as any,
    }),
  },
  newsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 14, // Premium small corner rounding
    marginRight: 14,
    backgroundColor: '#F8FAFC',
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#101B46', // Primary dark navy
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 11,
    color: '#98A2B3', // Muted slate gray
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 12,
    color: '#667085', // Secondary neutral gray
    lineHeight: 16,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    width: '100%',
  },
});
export default HealthNewsSection;
