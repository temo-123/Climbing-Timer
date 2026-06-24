import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { TrainingPlan } from '../types/models';

const TYPE_EMOJI: Record<string, string> = {
  fingerboard: '🧗',
  campus: '🏃',
  flexibility: '🧘',
  strength: '💪',
};

// Returns estimated session minutes for a workout
const estimateMinutes = (hangTime: number, restTime: number, reps: number, sets: number, recoverTime: number): number => {
  const prepSecs = 12;
  const sessionSecs = prepSecs + sets * (reps * hangTime + (reps - 1) * restTime) + (sets - 1) * recoverTime;
  return Math.max(15, Math.ceil(sessionSecs / 60));
};

export const requestCalendarPermissions = async (): Promise<boolean> => {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') return false;
  if (Platform.OS === 'ios') {
    const { status: rStatus } = await Calendar.requestRemindersPermissionsAsync();
    if (rStatus !== 'granted') return false;
  }
  return true;
};

const getDefaultCalendarId = async (): Promise<string | null> => {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  // prefer the device default writable calendar
  const writable = calendars.filter(c => c.allowsModifications);
  if (writable.length === 0) return null;

  // On Android, find the "primary" Google calendar
  if (Platform.OS === 'android') {
    const primary = writable.find(c => c.isPrimary) || writable[0];
    return primary.id;
  }

  // On iOS, use the default calendar from Calendar.getDefaultCalendarAsync
  try {
    const def = await Calendar.getDefaultCalendarAsync();
    return def?.id || writable[0].id;
  } catch {
    return writable[0].id;
  }
};

// dayIndex 0=Mon...6=Sun → JS getDay 1=Mon...7=Sun (0=Sun wraps to 7)
const toJsDay = (dayIndex: number): number => (dayIndex + 1) % 7;

// Find the first occurrence of a given JS weekday on or after a base date
const nextWeekday = (base: Date, jsWeekday: number): Date => {
  const d = new Date(base);
  const diff = (jsWeekday - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
};

export const addPlanToCalendar = async (
  plan: TrainingPlan,
  startDate: string,
  notifTime: string
): Promise<string[]> => {
  const calendarId = await getDefaultCalendarId();
  if (!calendarId) return [];

  const [hStr, mStr] = notifTime.split(':');
  const startHour = parseInt(hStr);
  const startMin = parseInt(mStr);

  const planStart = new Date(startDate);
  planStart.setHours(0, 0, 0, 0);

  const weeksToSchedule = plan.weeks > 0 ? plan.weeks : 8;
  const eventIds: string[] = [];

  for (const session of plan.sessions) {
    const jsDay = toJsDay(session.dayIndex);
    const firstOccurrence = nextWeekday(planStart, jsDay);

    for (let week = 0; week < weeksToSchedule; week++) {
      const eventDate = new Date(firstOccurrence);
      eventDate.setDate(eventDate.getDate() + week * 7);

      // Build title + notes from workouts
      const workoutNames = session.workouts.map(w => `${TYPE_EMOJI[w.type] || '🏋️'} ${w.name}`).join(', ');
      const title = `${plan.emoji} ${plan.name}: ${session.dayLabel}`;

      const totalMins = session.workouts.reduce((sum, w) =>
        sum + estimateMinutes(w.hangTime, w.restTime, w.reps, w.sets, w.recoverTime), 0
      );

      const notes = [
        `Training Plan: ${plan.name}`,
        `Week ${week + 1}${plan.weeks > 0 ? ` of ${plan.weeks}` : ''}`,
        '',
        'Exercises:',
        ...session.workouts.map(w =>
          `${TYPE_EMOJI[w.type] || '🏋️'} ${w.name}: ${w.hangTime}s × ${w.reps} reps × ${w.sets} sets`
        ),
        '',
        plan.coachNote,
      ].join('\n');

      const startTime = new Date(eventDate);
      startTime.setHours(startHour, startMin, 0, 0);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + totalMins);

      try {
        const id = await Calendar.createEventAsync(calendarId, {
          title,
          startDate: startTime,
          endDate: endTime,
          notes,
          alarms: [{ relativeOffset: -15 }], // 15-min reminder
        });
        eventIds.push(id);
      } catch {
        // skip individual event failures silently
      }
    }
  }

  return eventIds;
};

export const removePlanFromCalendar = async (eventIds: string[]): Promise<void> => {
  for (const id of eventIds) {
    try {
      await Calendar.deleteEventAsync(id);
    } catch {
      // already deleted or not found — ignore
    }
  }
};
