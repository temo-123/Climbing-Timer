import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrainingPlan, TrainingType, Workout } from '../types/models';

// Backend: github.com/temo-123/climbing.ge — Laravel content API + admin CMS,
// documented in that repo's docs/TRAINING.md. Editable at runtime from the
// app's Settings screen (stored under BASE_URL_KEY) in case of a staging URL.
const DEFAULT_BASE_URL = 'https://climbing.ge/api';
const BASE_URL_KEY = 'apiBaseUrl';

export async function getApiBaseUrl(): Promise<string> {
  const stored = await AsyncStorage.getItem(BASE_URL_KEY);
  return stored || DEFAULT_BASE_URL;
}

export async function setApiBaseUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(BASE_URL_KEY, url.trim().replace(/\/+$/, ''));
}

const client = axios.create({ timeout: 10000 });

client.interceptors.request.use(async config => {
  config.baseURL = await getApiBaseUrl();
  return config;
});

// Cache-first-on-failure: always fetch fresh data, but fall back to the last
// successful response (and persist new ones) so the app keeps working when
// the API is unreachable or not built yet.
async function withCache<T>(cacheKey: string, fetcher: () => Promise<T>): Promise<T> {
  try {
    const data = await fetcher();
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (err) {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
    throw err;
  }
}

export async function fetchTrainings(type?: TrainingType): Promise<Workout[]> {
  return withCache(`cache_trainings_${type ?? 'all'}`, async () => {
    const { data } = await client.get<Workout[]>('/get_training/get_all_trainings', { params: type ? { type } : undefined });
    return data;
  });
}

export async function fetchTrainingById(id: string): Promise<Workout> {
  return withCache(`cache_training_${id}`, async () => {
    const { data } = await client.get<Workout>(`/get_training/get_training_data/${id}`);
    return data;
  });
}

export async function fetchPlans(): Promise<TrainingPlan[]> {
  return withCache('cache_plans', async () => {
    const { data } = await client.get<TrainingPlan[]>('/get_training_plan/get_all_plans');
    return data;
  });
}

export async function fetchPlanById(id: string): Promise<TrainingPlan> {
  return withCache(`cache_plan_${id}`, async () => {
    const { data } = await client.get<TrainingPlan>(`/get_training_plan/get_plan_data/${id}`);
    return data;
  });
}
