import { Workout } from './models';

export type RootStackParamList = {
  Home: undefined;
  CreateWorkout: undefined;
  LoadWorkouts: undefined;
  History: undefined;
  Timer: { workout: Workout };
  TrainingPlans: undefined;
  PlanDetail: { planId: string };
  Analytics: undefined;
  CustomTraining: undefined;
  Onboarding: undefined;
  Settings: undefined;
};
