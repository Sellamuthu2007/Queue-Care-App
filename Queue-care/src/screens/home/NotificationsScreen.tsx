import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppNavigation } from '../../context/NavigationContext';
import { apiRequest } from '../../services/api';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export const NotificationsScreen: React.FC = () => {
  const { goBack } = useAppNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [isMarkingRead, setIsMarkingRead] = useState<boolean>(false);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const data = await apiRequest('/notifications');
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    // If no unread notifications exist, skip
    const hasUnread = notifications.some(n => !n.is_read);
    if (!hasUnread) return;

    try {
      setIsMarkingRead(true);
      await apiRequest('/notifications/read', { method: 'POST' });
      
      // Update local state to mark all read instantly
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      Alert.alert('Error', 'Failed to mark notifications as read.');
    } finally {
      setIsMarkingRead(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      await apiRequest(`/notifications/${id}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
      Alert.alert('Error', 'Failed to delete notification.');
    }
  };

  const handleLongPress = (item: Notification) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteNotification(item.id),
        },
      ],
      { cancelable: true }
    );
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return '📅';
      case 'cancellation':
        return '❌';
      case 'queue':
        return '🩺';
      default:
        return 'ℹ️';
    }
  };

  const formatTimeElapsed = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const elapsedMs = now.getTime() - date.getTime();
      
      const seconds = Math.floor(elapsedMs / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (seconds < 60) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return `${days}d ago`;
    } catch {
      return '';
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={() => handleLongPress(item)}
        style={[
          styles.card,
          !item.is_read ? styles.cardUnread : styles.cardRead
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>{getNotificationIcon(item.type)}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.notifTitle}>{item.title}</Text>
            <Text style={styles.notifTime}>{formatTimeElapsed(item.created_at)}</Text>
          </View>
          {!item.is_read && <View style={styles.unreadIndicator} />}
        </View>
        <Text style={styles.notifMessage}>{item.message}</Text>
      </TouchableOpacity>
    );
  };

  const hasUnread = notifications.some(n => !n.is_read);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBack} activeOpacity={0.7}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        
        {hasUnread ? (
          <TouchableOpacity 
            style={styles.markReadBtn} 
            onPress={handleMarkAllRead}
            disabled={isMarkingRead}
            activeOpacity={0.7}
          >
            {isMarkingRead ? (
              <ActivityIndicator size="small" color="#315BEF" />
            ) : (
              <Text style={styles.markReadText}>Read All</Text>
            )}
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color="#315BEF" />
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Failed to load notifications</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.bellLarge}>🔔</Text>
          <Text style={styles.emptyText}>You're all caught up!</Text>
          <Text style={styles.emptySubText}>No active alerts or reminders found.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
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
    marginLeft: 12,
  },
  markReadBtn: {
    minWidth: 60,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  markReadText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#315BEF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#101B46',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardUnread: {
    borderColor: 'rgba(49, 91, 239, 0.15)',
    backgroundColor: '#F4F7FF', // Soft brand blue tint
  },
  cardRead: {
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  notifTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#315BEF',
    alignSelf: 'center',
  },
  notifMessage: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#315BEF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bellLarge: {
    fontSize: 52,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default NotificationsScreen;
