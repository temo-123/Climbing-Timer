import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Equipment, ShopCategoryGroup, ShopProduct, TrainableProduct, TrainingPlan, TrainingType, Workout } from '../types/models';

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

// Android blocks cleartext (http://) network requests by default, so any
// image the admin-authored content points at over plain http silently fails
// to load in the app (it works fine in a browser, which is why this is easy
// to miss). The backend serves both schemes over the same host, so upgrading
// is always safe.
const secureUrl = (url?: string | null): string | undefined => (url ? url.replace(/^http:\/\//i, 'https://') : undefined);

function secureWorkout(w: Workout): Workout {
  return {
    ...w,
    imageUrl: secureUrl(w.imageUrl),
    steps: w.steps?.map(s => ({ ...s, imageUrl: secureUrl(s.imageUrl) })),
  };
}

function securePlan(p: TrainingPlan): TrainingPlan {
  return {
    ...p,
    sessions: p.sessions.map(s => ({ ...s, workouts: s.workouts.map(secureWorkout) })),
  };
}

export async function fetchTrainings(type?: TrainingType): Promise<Workout[]> {
  return withCache(`cache_trainings_${type ?? 'all'}`, async () => {
    const { data } = await client.get<Workout[]>('/get_training/get_all_trainings', { params: type ? { type } : undefined });
    if (!isWorkoutArray(data)) throw new Error('Malformed trainings response');
    return data.map(secureWorkout);
  }, isWorkoutArray);
}

export async function fetchTrainingById(id: string): Promise<Workout> {
  return withCache(`cache_training_${id}`, async () => {
    const { data } = await client.get<Workout>(`/get_training/get_training_data/${id}`);
    if (!isWorkout(data)) throw new Error('Malformed training response');
    return secureWorkout(data);
  }, isWorkout);
}

export async function fetchPlans(): Promise<TrainingPlan[]> {
  return withCache('cache_plans', async () => {
    const { data } = await client.get<TrainingPlan[]>('/get_training_plan/get_all_plans');
    if (!isPlanArray(data)) throw new Error('Malformed plans response');
    return data.map(securePlan);
  }, isPlanArray);
}

export async function fetchPlanById(id: string): Promise<TrainingPlan> {
  return withCache(`cache_plan_${id}`, async () => {
    const { data } = await client.get<TrainingPlan>(`/get_training_plan/get_plan_data/${id}`);
    if (!isPlan(data)) throw new Error('Malformed plan response');
    return securePlan(data);
  }, isPlan);
}

// shop.climbing.ge product content, served from the same backend (docs/SHOP.md).
// The raw shape is the storefront's internal representation (global/locale split,
// image filenames instead of URLs) — normalized to ShopProduct at this boundary.
interface RawShopProduct {
  global_product?: { id: number; url_title: string; subcategory_id?: number | null };
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

// Product category tree (docs/SHOP.md's ProductCategoryController) — every
// category the backend has is included, none are curated/hardcoded here.
interface RawShopCategory {
  id: number;
  us_name: string | null;
  ka_name: string | null;
}

// Products link to a subcategory, not a category directly (docs/SHOP.md's
// products table has `subcategory_id`, no `category_id`), so this is needed
// to resolve subcategory_id -> category_id.
interface RawShopSubcategory {
  id: number;
  category_id: number;
}

const isCategoryGroupArray = (data: unknown): data is ShopCategoryGroup[] => Array.isArray(data);

// There's no public endpoint that filters or counts products by category
// server-side, so this fetches the full category tree, subcategory tree, and
// product list in one round trip and groups them client-side — one request
// each, not one per category. Categories with zero in-stock products are
// dropped entirely so ShopBanner never has to render an empty tab.
export async function fetchShopCategoryProducts(lang: string): Promise<ShopCategoryGroup[]> {
  return withCache(`cache_shop_category_products_${lang}`, async () => {
    const [{ data: rawCategories }, { data: rawSubcategories }, { data: rawProducts }] = await Promise.all([
      client.get<RawShopCategory[]>('/get_product/get_product_category/get_all_product_category'),
      client.get<RawShopSubcategory[]>('/get_product/get_product_category/get_subcategory/get_all_subcategories'),
      client.get<RawShopProduct[]>(`/get_product/get_local_products/${lang}`),
    ]);
    if (!Array.isArray(rawCategories) || !Array.isArray(rawSubcategories) || !Array.isArray(rawProducts)) {
      throw new Error('Malformed shop category products response');
    }

    const categoryIdBySubcategoryId = new Map(rawSubcategories.map(s => [s.id, s.category_id]));
    const assetBaseUrl = (await getApiBaseUrl()).replace(/\/api\/?$/, '');
    const productsByCategoryId = new Map<number, ShopProduct[]>();
    for (const raw of rawProducts) {
      const subcategoryId = raw.global_product?.subcategory_id;
      const categoryId = subcategoryId != null ? categoryIdBySubcategoryId.get(subcategoryId) : undefined;
      if (categoryId == null) continue;
      const product = normalizeProduct(raw, assetBaseUrl);
      if (!product || product.outOfStock) continue;
      const list = productsByCategoryId.get(categoryId);
      if (list) list.push(product); else productsByCategoryId.set(categoryId, [product]);
    }

    return rawCategories
      .map((raw): ShopCategoryGroup | null => {
        const products = productsByCategoryId.get(raw.id);
        if (!products || products.length === 0) return null;
        return {
          category: { id: raw.id, name: (lang === 'ka' ? raw.ka_name : raw.us_name) ?? raw.us_name ?? '' },
          products,
        };
      })
      .filter((g): g is ShopCategoryGroup => g !== null)
      .sort((a, b) => a.category.id - b.category.id);
  }, isCategoryGroupArray);
}
