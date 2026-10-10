export type NavigationTab = 'home' | 'explore' | 'studio' | 'lookbook' | 'culture';

export type OccasionType = 'all' | 'ky_yeu' | 'le_tet' | 'di_hoc' | 'dao_pho' | 'cuoi_hoi';

export type GarmentCategory = 
  | 'ao_ngu_than' 
  | 'ao_dai' 
  | 'ao_nhat_binh' 
  | 'ao_tu_than';

export type InnerLayerId = 'ao-lot-trang' | 'yem-dao';
export type BottomLayerId = 'quan-lua-trang' | 'quan-den' | 'vay-xep-ly';
export type AccessoryHeadId = 'khan-dong' | 'khan-van' | 'non-la' | 'none';
export type AccessoryHandId = 'quat-nan' | 'tui-gam' | 'tui-coi' | 'none';

export interface LayerItemMeta<T extends string = string> {
  id: T;
  name: string;
  subName: string;
  description: string;
}

export interface StudioOutfitState {
  garmentId: string;
  innerLayer: InnerLayerId;
  bottomLayer: BottomLayerId;
  selectedColor: string;
  accessoryHead: AccessoryHeadId;
  accessoryHand: AccessoryHandId;
  occasionGoal: string;
  propsVisible?: {
    fan?: boolean;
    hat?: boolean;
    bag?: boolean;
  };
}

export interface SavedOutfitItem {
  id: string;
  title: string;
  savedAt: string;
  garmentId: string;
  selectedColor: string;
  innerLayer: InnerLayerId;
  bottomLayer: BottomLayerId;
  accessoryHead: AccessoryHeadId;
  accessoryHand: AccessoryHandId;
  occasionGoal: string;
  propsVisible?: {
    fan?: boolean;
    hat?: boolean;
    bag?: boolean;
  };
  notes?: string;
}

export interface LayerCompatibilityEntry {
  isCompatible: boolean;
  isRecommended?: boolean;
  reason: string;
  verificationLevel: 'verified_convention' | 'experimental_suggestion' | 'not_recommended';
}

export type PreferredGarmentChoice = GarmentCategory | 'undecided';

export type StyleOrientation = 
  | 'traditional'    // Giữ chuẩn truyền thống
  | 'balanced'       // Cân bằng truyền thống & hiện đại
  | 'modern_twist';  // Biến tấu trẻ trung & phá cách

export interface ColorPresetItem {
  name: string;
  hex: string;
  note: string;
}

export interface GarmentCategoryMeta {
  id: GarmentCategory;
  name: string;
  subTitle: string;
  description: string;
  tag: string;
  subVariants?: { id: string; name: string; description: string }[];
}

export interface PreferenceProfile {
  id: string;
  updatedAt: string;
  // Bước 1: Dịp mặc
  occasion: string;
  customOccasion?: string;
  // Bước 2: Dòng Việt phục quan tâm (khớp 100% GarmentCategory hoặc undecided)
  garmentChoice: PreferredGarmentChoice;
  subGarmentVariantId?: string; // Tùy chọn dạng thức phụ (ví dụ: Áo tấc hoặc Tay chẽn khi chọn Áo ngũ thân)
  // Bước 3: Mức độ phong cách
  styleOrientation: StyleOrientation;
  stylePriorityNotes?: string;
  // Bước 4: Màu thích & màu tránh (danh sách mã hex)
  likedColors: string[];
  avoidedColors: string[];
  // Bước 5: Sở thích phụ kiện & Giới hạn cá nhân
  accessories: string[];
  culturalBoundaries: string[];
  customBoundaryNotes?: string;
}

export interface ReferenceSource {
  title: string;
  authorOrOrg: string;
  url?: string;
  note?: string;
  status: 'verified_source' | 'needs_verification' | 'unverified';
}

export interface GarmentStructurePart {
  name: string;
  description: string;
  significance?: string;
}

export interface GarmentItem {
  id: string;
  name: string;
  subName: string;
  category: GarmentCategory;
  originEra: string;
  image?: string;
  imageNote: string; // Chú thích bản quyền/minh họa
  shortDescription: string;
  keyIdentificationFeatures: string[]; // Vài nét nhận diện nhanh
  silhouette: string;
  historicalContext: string; // Lịch sử & bối cảnh truyền thống
  historicalCaution?: string; // Cảnh báo/lưu ý về tính xác thực học thuật
  idealOccasions: string[]; // Gợi ý tham khảo dịp mặc
  modernStylingTip: string; // Tách riêng gợi ý phối hiện đại
  structure: GarmentStructurePart[];
  references: ReferenceSource[]; // Nguồn tham khảo thực tế
  colorPalette: {
    name: string;
    hex: string;
  }[];
  isFeatured?: boolean;
}

export interface LookbookCard {
  id: string;
  title: string;
  concept: string;
  occasion: string;
  primaryGarment: string;
  palette: string[];
  stylingItems: string[];
  author: string;
  audience: string;
}

export interface CulturalArticle {
  id: string;
  title: string;
  subtitle: string;
  summary: string;
  keyTakeaway: string;
  culturalDimension: string;
  etiquetteTip: string;
}

/**
 * Xử lý an toàn hồ sơ cũ: chuyển đổi các id hoặc định dạng cũ về đúng danh mục chuẩn
 */
export function normalizeGarmentChoice(rawChoice: any): { 
  garmentChoice: PreferredGarmentChoice; 
  subVariantId?: string 
} {
  if (!rawChoice) return { garmentChoice: 'undecided' };

  if (rawChoice === 'ao_dai' || rawChoice === 'ao_dai_tan_thoi' || rawChoice === 'ao-dai-hien-dai') {
    return { garmentChoice: 'ao_dai', subVariantId: 'ao-dai-hien-dai' };
  }
  if (rawChoice === 'ao_tu_than' || rawChoice === 'tu_than' || rawChoice === 'ao-tu-than') {
    return { garmentChoice: 'ao_tu_than', subVariantId: 'ao-tu-than' };
  }
  if (rawChoice === 'ao_nhat_binh' || rawChoice === 'nhat_binh' || rawChoice === 'ao-nhat-binh') {
    return { garmentChoice: 'ao_nhat_binh', subVariantId: 'ao-nhat-binh' };
  }
  if (rawChoice === 'ao_ngu_than' || rawChoice === 'ngu_than_chen' || rawChoice === 'ngu-than-tay-chen') {
    return { garmentChoice: 'ao_ngu_than', subVariantId: 'ngu-than-tay-chen' };
  }
  if (rawChoice === 'ngu_than_tac' || rawChoice === 'ao-tac-ngu-than-tay-thung' || rawChoice === 'ao_tac') {
    // Áo tấc là dạng thức phụ của Áo ngũ thân (Ngũ thân tay thụng)
    return { garmentChoice: 'ao_ngu_than', subVariantId: 'ao-tac-ngu-than-tay-thung' };
  }
  if (rawChoice === 'undecided' || rawChoice === 'chua_ro') {
    return { garmentChoice: 'undecided' };
  }
  return { garmentChoice: 'undecided' };
}
