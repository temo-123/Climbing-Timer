import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Equipment, ShopProduct, TrainableProduct, TrainingPlan, TrainingType, Workout } from '../types/models';

// Backend: github.com/temo-123/climbing.ge — Laravel content API + admin CMS,
// documented in that repo's docs/TRAINING.md. Fixed — not user-configurable.
const DEFAULT_BASE_URL = 'https://climbing.ge/api';

export async function getApiBaseUrl(): Promise<string> {
  return DEFAULT_BASE_URL;
}

const client = axios.create({ timeout: 10000 });

client.interceptors.request.use(async config => {
  config.baseURL = await getApiBaseUrl();
  return config;
});

// Cache-first-on-failure: always fetch fresh data, but fall back to the last
// successful response (and persist new ones) so the app keeps working when
// the API is unreachable or not built yet.
async function withCache<T>(cacheKey: string, fetcher: () => Promise<T>, isValid: (data: unknown) => data is T): Promise<T> {
  try {
    const data = await fetcher();
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (err) {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (isValid(parsed)) return parsed;
    }
    throw err;
  }
}

const isWorkoutArray = (data: unknown): data is Workout[] => Array.isArray(data);
const isWorkout = (data: unknown): data is Workout => !!data && typeof data === 'object';
const isPlanArray = (data: unknown): data is TrainingPlan[] => Array.isArray(data);
const isPlan = (data: unknown): data is TrainingPlan => !!data && typeof data === 'object';

export async function fetchTrainings(type?: TrainingType): Promise<Workout[]> {
  return withCache(`cache_trainings_${type ?? 'all'}`, async () => {
    const { data } = await client.get<Workout[]>('/get_training/get_all_trainings', { params: type ? { type } : undefined });
    if (!isWorkoutArray(data)) throw new Error('Malformed trainings response');
    return data;
  }, isWorkoutArray);
}

export async function fetchTrainingById(id: string): Promise<Workout> {
  return withCache(`cache_training_${id}`, async () => {
    const { data } = await client.get<Workout>(`/get_training/get_training_data/${id}`);
    if (!isWorkout(data)) throw new Error('Malformed training response');
    return data;
  }, isWorkout);
}

export async function fetchPlans(): Promise<TrainingPlan[]> {
  return withCache('cache_plans', async () => {
    const { data } = await client.get<TrainingPlan[]>('/get_training_plan/get_all_plans');
    if (!isPlanArray(data)) throw new Error('Malformed plans response');
    return data;
  }, isPlanArray);
}

export async function fetchPlanById(id: string): Promise<TrainingPlan> {
  return withCache(`cache_plan_${id}`, async () => {
    const { data } = await client.get<TrainingPlan>(`/get_training_plan/get_plan_data/${id}`);
    if (!isPlan(data)) throw new Error('Malformed plan response');
    return data;
  }, isPlan);
}

// shop.climbing.ge product content, served from the same backend (docs/SHOP.md).
// The raw shape is the storefront's internal representation (global/locale split,
// image filenames instead of URLs) — normalized to ShopProduct at this boundary.
interface RawShopProduct {
  global_product?: { id: number; url_title: string };
  locale_product?: { title: string };
  product_images?: string[];
  min_price?: string | number;
  new_min_price?: string | number;
  has_discount?: boolean;
  max_discount?: number;
  out_of_stock?: boolean;
  product_option?: { option?: { currency?: string } }[];
}

const isProductArray = (data: unknown): data is ShopProduct[] => Array.isArray(data);

function normalizeProduct(raw: RawShopProduct, assetBaseUrl: string): ShopProduct | null {
  const id = raw.global_product?.id;
  if (id == null) return null;
  const imageFile = raw.product_images?.[0];
  return {
    id,
    urlTitle: raw.global_product?.url_title ?? '',
    title: raw.locale_product?.title ?? '',
    imageUrl: imageFile ? `${assetBaseUrl}/public/images/product_option_img/${imageFile}` : null,
    price: Number(raw.min_price ?? 0),
    discountedPrice: raw.has_discount ? Number(raw.new_min_price ?? raw.min_price ?? 0) : null,
    discountPercent: raw.max_discount ?? 0,
    currency: raw.product_option?.[0]?.option?.currency ?? '₾',
    outOfStock: !!raw.out_of_stock,
  };
}

export async function fetchFeaturedProducts(lang: string): Promise<ShopProduct[]> {
  return withCache(`cache_products_${lang}`, async () => {
    const { data } = await client.get<RawShopProduct[]>(`/get_product/get_products_for_index/${lang}`);
    if (!Array.isArray(data)) throw new Error('Malformed products response');
    const assetBaseUrl = (await getApiBaseUrl()).replace(/\/api\/?$/, '');
    return data
      .map(raw => normalizeProduct(raw, assetBaseUrl))
      .filter((p): p is ShopProduct => p !== null && !p.outOfStock);
  }, isProductArray);
}

// Products the backend has tagged with an equipment type (docs/SHOP.md's product
// catalog, filtered server-side to just the ones relevant to training gear) — lets
// onboarding offer "pick the product you own" instead of an abstract equipment list.
const VALID_EQUIPMENT_TYPES = new Set<Equipment>([
  'fingerboard', 'campus_board', 'climbing_wall', 'system_wall', 'pull_up_bar', 'weights',
]);

interface RawTrainableProduct extends RawShopProduct {
  equipment_type?: string | null;
}

const isTrainableProductArray = (data: unknown): data is TrainableProduct[] => Array.isArray(data);

export async function fetchTrainableProducts(lang: string): Promise<TrainableProduct[]> {
  return withCache(`cache_trainable_products_${lang}`, async () => {
    const { data } = await client.get<RawTrainableProduct[]>(`/get_product/get_trainable_products/${lang}`);
    if (!Array.isArray(data)) throw new Error('Malformed trainable products response');
    const assetBaseUrl = (await getApiBaseUrl()).replace(/\/api\/?$/, '');
    return data
      .map((raw): TrainableProduct | null => {
        const base = normalizeProduct(raw, assetBaseUrl);
        if (!base) return null;
        const equipmentType = VALID_EQUIPMENT_TYPES.has(raw.equipment_type as Equipment)
          ? (raw.equipment_type as Equipment)
          : null;
        return { id: base.id, urlTitle: base.urlTitle, title: base.title, imageUrl: base.imageUrl, equipmentType };
      })
      .filter((p): p is TrainableProduct => p !== null);
  }, isTrainableProductArray);
}
