import { Equipment } from '../types/models';

export interface GearProduct {
  id: string;
  equipment: Equipment;
  emoji: string;
  nameEn: string;
  nameKa: string;
  descEn: string;
  descKa: string;
  priceRange: string;
}

export const CLIMBING_GE_PRODUCTS: GearProduct[] = [
  {
    id: 'cge-fingerboard',
    equipment: 'fingerboard',
    emoji: '🏋️',
    nameEn: 'Training Fingerboard',
    nameKa: 'სასწავლო ფინგერბორდი',
    descEn: 'Wooden hangboard with multiple pocket depths and edge sizes.',
    descKa: 'ხის ჰანგბორდი სხვადასხვა ჯიბისა და კიდის ზომებით.',
    priceRange: '₾45–120',
  },
  {
    id: 'cge-campus',
    equipment: 'campus_board',
    emoji: '🔢',
    nameEn: 'Campus Rung Set',
    nameKa: 'კამპუს ბორდის კომპლექტი',
    descEn: 'Solid wood campus rungs (5 pcs). Mounts on any angled wall.',
    descKa: 'მყარი ხის კამპუს ბორდი (5 ც). ეწყობა ნებ. კედელზე.',
    priceRange: '₾65–90',
  },
  {
    id: 'cge-pullup',
    equipment: 'pull_up_bar',
    emoji: '💪',
    nameEn: 'Pull-up Bar',
    nameKa: 'ჰ. ბარი / კოლტი',
    descEn: 'Doorframe or wall-mount bar. Holds up to 150 kg.',
    descKa: 'კარჩარჩო ან კედლის ბარი. გადააქვს 150 კგ-მდე.',
    priceRange: '₾35–55',
  },
];

export function localizedProduct(product: GearProduct, lang: string) {
  if (lang === 'ka') return { name: product.nameKa, desc: product.descKa };
  return { name: product.nameEn, desc: product.descEn };
}
