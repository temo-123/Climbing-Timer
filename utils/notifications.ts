import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { TrainingPlan } from '../types/models';

const isExpoGo = () => Constants.executionEnvironment === 'storeClient';

export const initNotifications = async () => {
  if (isExpoGo()) return;

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
  if (isExpoGo()) return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

// dayIndex 0=Mon...6=Sun → Expo weekday 2=Mon...1=Sun
const toExpoWeekday = (dayIndex: number): number =>
  dayIndex === 6 ? 1 : dayIndex + 2;

// Fixed daily reminder times for active training plans -- a morning
// heads-up plus an afternoon nudge if the session hasn't happened yet.
const MORNING_HOUR = 10;
const MORNING_MINUTE = 0;
const AFTERNOON_HOUR = 16;
const AFTERNOON_MINUTE = 30;

export const scheduleTrainingNotifications = async (
  plan: TrainingPlan
): Promise<string[]> => {
  if (isExpoGo()) return [];

  const ids: string[] = [];

  for (const session of plan.sessions) {
    const weekday = toExpoWeekday(session.dayIndex);
    const workoutNames = session.workouts.map(w => w.name).join(' + ');
    const data = { planId: plan.id, dayLabel: session.dayLabel };

    const morningId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${plan.emoji} Today is your training day!`,
        body: `${session.dayLabel}: ${workoutNames}`,
        sound: 'default',
        data,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour: MORNING_HOUR,
        minute: MORNING_MINUTE,
        channelId: 'training-reminders',
      } as any,
    });
    ids.push(morningId);

    const afternoonId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ Don't forget your training today!`,
        body: `${session.dayLabel}: ${workoutNames}`,
        sound: 'default',
        data,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour: AFTERNOON_HOUR,
        minute: AFTERNOON_MINUTE,
        channelId: 'training-reminders',
      } as any,
    });
    ids.push(afternoonId);
  }

  return ids;
};

export const cancelNotifications = async (ids: string[]): Promise<void> => {
  if (isExpoGo()) return;

  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // already cancelled or never existed
    }
  }
};
