export type NavigationTab = 'home' | 'explore' | 'studio' | 'lookbook' | 'culture';

export type OccasionType = 'all' | 'ky_yeu' | 'le_tet' | 'di_hoc' | 'dao_pho' | 'cuoi_hoi';

export type GarmentCategory = 
  | 'ngu_than_chen' 
  | 'ngu_than_tac' 
  | 'nhat_binh' 
  | 'giao_linh' 
  | 'tu_than' 
  | 'ao_dai_tan_thoi';

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
  silhouette: string;
  idealOccasions: string[];
  structure: GarmentStructurePart[];
  youthStylingTip: string;
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
