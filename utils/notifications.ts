import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { TrainingPlan } from '../types/models';

export const initNotifications = async () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('training-reminders', {
      name: 'Training Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4ecdc4',
      sound: 'default',
    });
  }
};

export const requestNotificationPermissions = async (): Promise<boolean> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

// dayIndex 0=Mon...6=Sun → Expo weekday 2=Mon...1=Sun
const toExpoWeekday = (dayIndex: number): number =>
  dayIndex === 6 ? 1 : dayIndex + 2;

export const scheduleTrainingNotifications = async (
  plan: TrainingPlan,
  notificationTime: string
): Promise<string[]> => {
  const [hourStr, minuteStr] = notificationTime.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  const ids: string[] = [];

  for (const session of plan.sessions) {
    const weekday = toExpoWeekday(session.dayIndex);
    const workoutNames = session.workouts.map(w => w.name).join(' + ');

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${plan.emoji} Time to train!`,
        body: `${plan.name}: ${workoutNames}`,
        sound: 'default',
        data: { planId: plan.id, dayLabel: session.dayLabel },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour,
        minute,
        channelId: 'training-reminders',
      } as any,
    });

    ids.push(id);
  }

  return ids;
};

export const cancelNotifications = async (ids: string[]): Promise<void> => {
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // already cancelled or never existed
    }
  }
};
