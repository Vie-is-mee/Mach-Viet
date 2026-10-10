/**
 * Danh mục ánh xạ thông tin các tệp mô hình 3D (.glb) mẫu
 * Tuân thủ giấy phép CC BY 4.0 và ghi công rõ ràng
 * Tuyệt đối không khẳng định các mô hình là phục dựng lịch sử chính xác 100%
 */

export interface SampleModelMeta {
  filename: string;
  matchedGarmentId: string;
  matchedCategory: string;
  title: string;
  description: string;
  author: string;
  sourceUrl: string;
  license: string;
  attribution: string;
  cautionNotice: string;
  modelKind?: 'garment' | 'accessory' | 'modern_experimental';
  path?: string;
}

export interface SessionModelRecord {
  id: string;
  file?: File;
  url?: string;
  fileName: string;
  fileSizeBytes: number;
  assignedGarmentId: string;
  assignedGarmentLabel: string;
  matchedMeta: SampleModelMeta | null;
  uploadedAt: string;
  dimensions?: { width: number; height: number; depth: number };
  modelKind?: 'garment' | 'accessory' | 'modern_experimental';
  isPreloaded?: boolean;
}

export interface AccessoryModelRecord {
  id: string;
  file?: File;
  url?: string;
  fileName: string;
  fileSizeBytes: number;
  matchedMeta: SampleModelMeta | null;
  uploadedAt: string;
  dimensions?: { width: number; height: number; depth: number };
  isPreloaded?: boolean;
}

export const SAMPLE_MODELS_REGISTRY: Record<string, SampleModelMeta> = {
  'tu-than-color.glb': {
    filename: 'tu-than-color.glb',
    matchedGarmentId: 'ao-tu-than',
    matchedCategory: 'ao_tu_than',
    title: 'Áo Tứ Thân Đa Sắc',
    description: 'Mô hình 3D phỏng dựng cấu trúc áo tứ thân với dải màu sinh động, yếm và bốn vạt buông rủ.',
    author: 'ghostnoface trên Sketchfab',
    sourceUrl: 'https://sketchfab.com/3d-models/marvelous-to-substance-test-6-ao-tu-than-3-88f76e45667e407580977304ba9cfb05',
    license: 'CC BY 4.0',
    attribution: 'Tác giả ghostnoface trên Sketchfab (Giấy phép CC BY 4.0)',
    cautionNotice: 'Mô hình minh họa 3D, chưa được thẩm định phục dựng bảo tàng.',
    modelKind: 'garment',
    path: '/models/tu-than-color.glb',
  },
  'ao-dai-blue.glb': {
    filename: 'ao-dai-blue.glb',
    matchedGarmentId: 'ao-dai-hien-dai',
    matchedCategory: 'ao_dai',
    title: 'Áo Dài Màu Xanh',
    description: 'Mô hình 3D áo dài dáng suông hiện đại với hai tà dài thướt tha.',
    author: 'ghostnoface trên Sketchfab',
    sourceUrl: 'https://sketchfab.com/3d-models/marvelous-to-substance-test-2-aodai-88015bd2f553451b8a6e4fb694b1ee14',
    license: 'CC BY 4.0',
    attribution: 'Tác giả ghostnoface trên Sketchfab (Giấy phép CC BY 4.0)',
    cautionNotice: 'Mô hình minh họa 3D, chưa được thẩm định phục dựng bảo tàng.',
    modelKind: 'garment',
    path: '/models/ao-dai-blue.glb',
  },
  'nhat-binh.glb': {
    filename: 'nhat-binh.glb',
    matchedGarmentId: 'ao-nhat-binh',
    matchedCategory: 'ao_nhat_binh',
    title: 'Áo Nhật Bình',
    description: 'Mô hình 3D áo Nhật Bình với nẹp cổ chữ nhật trước ngực và dải viền tay ngũ sắc.',
    author: 'ghostnoface trên Sketchfab',
    sourceUrl: 'https://sketchfab.com/3d-models/marvelous-to-substance-test-9-ao-nhat-binh-78d702a91dc84d66805050488d415d0e',
    license: 'CC BY 4.0',
    attribution: 'Tác giả ghostnoface trên Sketchfab (Giấy phép CC BY 4.0)',
    cautionNotice: 'Mô hình minh họa 3D, chưa được thẩm định phục dựng bảo tàng.',
    modelKind: 'garment',
    path: '/models/nhat-binh.glb',
  },
  'fan-decorated.glb': {
    filename: 'fan-decorated.glb',
    matchedGarmentId: 'quat_tram',
    matchedCategory: 'phu_kien_cam_tay',
    title: 'Quạt Cầm Tay Gấp (Folding Fan)',
    description: 'Mô hình 3D quạt gấp có nan hoa văn trang trí, phối hợp làm phụ kiện cầm tay truyền thống cho Việt phục.',
    author: 'staceyneko0415 trên Sketchfab',
    sourceUrl: 'https://sketchfab.com/3d-models/folding-fan-a0ece787e7fd431a9dd42b142bb87f45',
    license: 'CC BY 4.0',
    attribution: 'Tác giả staceyneko0415 trên Sketchfab (Giấy phép CC BY 4.0)',
    cautionNotice: 'Mô hình minh họa phụ kiện 3D, độc lập với trang phục và chưa gắn khung xương nhân vật.',
    modelKind: 'accessory',
    path: '/models/fan-decorated.glb',
  },
  'hat-non-la.glb': {
    filename: 'hat-non-la.glb',
    matchedGarmentId: 'non_la',
    matchedCategory: 'phu_kien_doi_dau',
    title: 'Nón Lá Truyền Thống (Conical Hat)',
    description: 'Mô hình 3D nón lá chóp nón truyền thống đan lá nón mộc mạc, tạo điểm nhấn đội đầu dân gian đặc trưng khi kết hợp cùng áo tứ thân và áo dài.',
    author: 'NNgan trên Sketchfab',
    sourceUrl: 'https://sketchfab.com/3d-models/vietnamese---non-la-abd86436d03344b9a40c82e127fb6252',
    license: 'CC BY 4.0',
    attribution: 'Tác giả NNgan trên Sketchfab (Giấy phép CC BY 4.0)',
    cautionNotice: 'Mô hình minh họa 3D, chưa phải tư liệu xác thực tuyệt đối về văn hóa.',
    modelKind: 'accessory',
    path: '/models/hat-non-la.glb',
  },
  'woven-tote.glb': {
    filename: 'woven-tote.glb',
    matchedGarmentId: 'tui_coi',
    matchedCategory: 'phu_kien_cam_tay',
    title: 'Túi Cói Đan Mộc (Woven Tote Bag)',
    description: 'Mô hình 3D túi cói/túi đan mây mộc mạc có quai xách, phối hợp làm phụ kiện xách tay dân dã đi cùng trang phục truyền thống.',
    author: 'eeelabvisual trên Sketchfab',
    sourceUrl: 'https://sketchfab.com/3d-models/woven-tote-bag-7259d1fc109b4c43a0d4bf3661433919',
    license: 'CC BY 4.0',
    attribution: 'Tác giả eeelabvisual trên Sketchfab (Giấy phép CC BY 4.0)',
    cautionNotice: 'Mô hình 3D minh họa độc lập cho phụ kiện túi cói xách tay, chưa phải tư liệu xác thực tuyệt đối về lịch sử hay phục dựng truyền thống.',
    modelKind: 'accessory',
    path: '/models/woven-tote.glb',
  },
};

/**
 * Danh sách 3 mô hình áo Việt phục cốt lõi có sẵn trong hệ thống
 */
export const PRELOADED_GARMENTS: {
  id: string;
  fileName: string;
  url: string;
  fileSizeBytes: number;
  assignedGarmentId: string;
  assignedGarmentLabel: string;
}[] = [
  {
    id: 'preloaded-tu-than-color',
    fileName: 'tu-than-color.glb',
    url: '/models/tu-than-color.glb',
    fileSizeBytes: 2637964,
    assignedGarmentId: 'ao-tu-than',
    assignedGarmentLabel: 'Áo Tứ Thân Đa Sắc',
  },
  {
    id: 'preloaded-ao-dai-blue',
    fileName: 'ao-dai-blue.glb',
    url: '/models/ao-dai-blue.glb',
    fileSizeBytes: 1672572,
    assignedGarmentId: 'ao-dai-hien-dai',
    assignedGarmentLabel: 'Áo Dài Màu Xanh',
  },
  {
    id: 'preloaded-nhat-binh',
    fileName: 'nhat-binh.glb',
    url: '/models/nhat-binh.glb',
    fileSizeBytes: 2415540,
    assignedGarmentId: 'ao-nhat-binh',
    assignedGarmentLabel: 'Áo Nhật Bình',
  },
];

/**
 * Danh sách 3 phụ kiện 3D cốt lõi có sẵn trong hệ thống
 */
export const PRELOADED_ACCESSORIES: Record<'fan' | 'hat' | 'bag', AccessoryModelRecord> = {
  fan: {
    id: 'preloaded-fan-decorated',
    fileName: 'fan-decorated.glb',
    url: '/models/fan-decorated.glb',
    fileSizeBytes: 1081740,
    matchedMeta: SAMPLE_MODELS_REGISTRY['fan-decorated.glb'],
    uploadedAt: 'Hệ thống có sẵn',
    isPreloaded: true,
  },
  hat: {
    id: 'preloaded-hat-non-la',
    fileName: 'hat-non-la.glb',
    url: '/models/hat-non-la.glb',
    fileSizeBytes: 2680716,
    matchedMeta: SAMPLE_MODELS_REGISTRY['hat-non-la.glb'],
    uploadedAt: 'Hệ thống có sẵn',
    isPreloaded: true,
  },
  bag: {
    id: 'preloaded-woven-tote',
    fileName: 'woven-tote.glb',
    url: '/models/woven-tote.glb',
    fileSizeBytes: 1466304,
    matchedMeta: SAMPLE_MODELS_REGISTRY['woven-tote.glb'],
    uploadedAt: 'Hệ thống có sẵn',
    isPreloaded: true,
  },
};

/**
 * Trả về danh sách bản ghi áo chính có sẵn khởi tạo cho Studio
 */
export function getPreloadedGarmentRecords(): SessionModelRecord[] {
  return PRELOADED_GARMENTS.map((item) => ({
    id: item.id,
    fileName: item.fileName,
    url: item.url,
    fileSizeBytes: item.fileSizeBytes,
    assignedGarmentId: item.assignedGarmentId,
    assignedGarmentLabel: item.assignedGarmentLabel,
    matchedMeta: SAMPLE_MODELS_REGISTRY[item.fileName] || null,
    uploadedAt: 'Hệ thống có sẵn',
    modelKind: 'garment',
    isPreloaded: true,
  }));
}

/**
 * Trả về bản ghi phụ kiện có sẵn
 */
export function getPreloadedAccessoryRecord(type: 'fan' | 'hat' | 'bag'): AccessoryModelRecord {
  return { ...PRELOADED_ACCESSORIES[type] };
}

/**
 * Danh sách các mô hình trang phục hiện đại bổ sung trong public/models
 * Được ghi nhận riêng biệt trong danh mục, chưa tự động ghép vào Việt phục truyền thống
 */
export interface ModernExperimentalModelItem {
  id: string;
  filename: string;
  path: string;
  title: string;
  category: 'pants' | 'shirt' | 'jacket' | 'skirt' | 'set';
  fileSizeBytes: number;
  note: string;
}

export const MODERN_EXPERIMENTAL_MODELS: ModernExperimentalModelItem[] = [
  {
    id: 'cargo_pants',
    filename: 'cargo_pants.glb',
    path: '/models/cargo_pants.glb',
    title: 'Quần Túi Hộp (Cargo Pants)',
    category: 'pants',
    fileSizeBytes: 3987388,
    note: 'Mô hình trang phục đường phố hiện đại, ghi nhận sẵn để chuẩn bị cho thử nghiệm cách tân đương đại.',
  },
  {
    id: 'denim_jacket_white_tee',
    filename: 'denim_jacket_sleeveless_with_white_t-shirt.glb',
    path: '/models/denim_jacket_sleeveless_with_white_t-shirt.glb',
    title: 'Áo Khoác Denim Sát Nách & Thun Trắng',
    category: 'jacket',
    fileSizeBytes: 7903808,
    note: 'Mẫu áo khoác cộc tay kết hợp áo thun trẻ trung, ghi nhận riêng trong kho tài nguyên.',
  },
  {
    id: 'dolphin_pants_set',
    filename: 'dolphin_pants_set_female.glb',
    path: '/models/dolphin_pants_set_female.glb',
    title: 'Set Quần Short Dolphin Nữ',
    category: 'set',
    fileSizeBytes: 4660608,
    note: 'Trang phục thể thao năng động nữ, lưu trữ sẵn trong thư mục tài nguyên.',
  },
  {
    id: 'free_shirt',
    filename: 'free_shirt.glb',
    path: '/models/free_shirt.glb',
    title: 'Áo Sơ Mi Form Suông Rộng',
    category: 'shirt',
    fileSizeBytes: 1635976,
    note: 'Mẫu sơ mi suông hiện đại cho học sinh, sinh viên.',
  },
  {
    id: 'monalisa_tee',
    filename: 'off-white_monalisa_black_t-shirt.glb',
    path: '/models/off-white_monalisa_black_t-shirt.glb',
    title: 'Áo Thun Đen In Họa Tiết Monalisa',
    category: 'shirt',
    fileSizeBytes: 1720664,
    note: 'Mẫu áo thun đồ họa đường phố đương đại.',
  },
  {
    id: 'sleeveless_shirt',
    filename: 'sleeveless_shirt.glb',
    path: '/models/sleeveless_shirt.glb',
    title: 'Áo Ba Lỗ Sát Nách Thể Thao',
    category: 'shirt',
    fileSizeBytes: 2029808,
    note: 'Áo không tay cơ bản hiện đại.',
  },
  {
    id: 't_shirt_white',
    filename: 't-shirt.glb',
    path: '/models/t-shirt.glb',
    title: 'Áo Thun Trắng Cổ Tròn',
    category: 'shirt',
    fileSizeBytes: 2471360,
    note: 'Mẫu áo thun trắng cơ bản hiện đại.',
  },
  {
    id: 't_shirt_basic',
    filename: 't_shirt.glb',
    path: '/models/t_shirt.glb',
    title: 'Áo Thun Trơn Cơ Bản',
    category: 'shirt',
    fileSizeBytes: 6786916,
    note: 'Mẫu áo thun cổ tròn form chuẩn.',
  },
  {
    id: 'track_pants',
    filename: 'track_pants.glb',
    path: '/models/track_pants.glb',
    title: 'Quần Thể Thao Kẻ Sọc (Track Pants)',
    category: 'pants',
    fileSizeBytes: 1336100,
    note: 'Mẫu quần thể thao ống suông hiện đại.',
  },
  {
    id: 'women_long_skirt',
    filename: 'women_long_skirt.glb',
    path: '/models/women_long_skirt.glb',
    title: 'Chân Váy Dài Nữ Hiện Đại',
    category: 'skirt',
    fileSizeBytes: 30808212,
    note: 'Mẫu chân váy dài vải buông rủ.',
  },
  {
    id: 'womens_blouse_skirt',
    filename: 'womens_blouse_and_skirt.glb',
    path: '/models/womens_blouse_and_skirt.glb',
    title: 'Set Áo Blouse và Chân Váy Nữ',
    category: 'set',
    fileSizeBytes: 4104696,
    note: 'Bộ trang phục công sở/dạo phố nữ hiện đại.',
  },
  {
    id: 'womens_shirt',
    filename: 'womens_shirt.glb',
    path: '/models/womens_shirt.glb',
    title: 'Áo Sơ Mi Nữ Hiện Đại',
    category: 'shirt',
    fileSizeBytes: 3397508,
    note: 'Mẫu sơ mi nữ trẻ trung.',
  },
];

export const GARMENTS_ASSIGNABLE_OPTIONS = [
  { id: 'ao-tu-than', label: 'Áo Tứ Thân (tu-than-color.glb)' },
  { id: 'ao-dai-hien-dai', label: 'Áo Dài Hiện Đại (ao-dai-blue.glb)' },
  { id: 'ao-nhat-binh', label: 'Áo Nhật Bình (nhat-binh.glb)' },
  { id: 'ao-ngu-than', label: 'Áo Ngũ Thân (chưa có tệp mẫu riêng)' },
  { id: 'custom_other', label: 'Dòng y phục khác / Tự do' },
];

/**
 * Trạng thái mô hình cho từng dòng áo trong catalog
 */
export interface GarmentModelAvailability {
  hasSampleFile: boolean;
  suggestedFilename?: string;
  modelTitle?: string;
  notice: string;
}

export function getGarmentModelAvailability(garmentId: string): GarmentModelAvailability {
  if (garmentId === 'ao-tu-than') {
    return {
      hasSampleFile: true,
      suggestedFilename: 'tu-than-color.glb',
      modelTitle: 'Áo Tứ Thân Đa Sắc',
      notice: 'Tệp mẫu sẵn trong hệ thống: tu-than-color.glb (CC BY 4.0).',
    };
  }

  if (garmentId === 'ao-dai-hien-dai') {
    return {
      hasSampleFile: true,
      suggestedFilename: 'ao-dai-blue.glb',
      modelTitle: 'Áo Dài Màu Xanh',
      notice: 'Tệp mẫu sẵn trong hệ thống: ao-dai-blue.glb (CC BY 4.0).',
    };
  }

  if (garmentId === 'ao-nhat-binh') {
    return {
      hasSampleFile: true,
      suggestedFilename: 'nhat-binh.glb',
      modelTitle: 'Áo Nhật Bình',
      notice: 'Tệp mẫu sẵn trong hệ thống: nhat-binh.glb (CC BY 4.0).',
    };
  }

  // Áo ngũ thân (cả tay chẽn lẫn áo tấc)
  return {
    hasSampleFile: false,
    notice: 'Hiện bộ tài nguyên 3D chưa có tệp mô hình riêng cho dòng Áo ngũ thân. Hệ thống giữ trạng thái chờ và không lấy mô hình áo dài thay thế để đảm bảo tính chuẩn xác định danh.',
  };
}

/**
 * Tìm metadata cho một tệp được nạp vào
 */
export function matchUploadedModelMeta(fileName: string): SampleModelMeta | null {
  const normalized = fileName.trim().toLowerCase();
  for (const [key, meta] of Object.entries(SAMPLE_MODELS_REGISTRY)) {
    if (normalized === key.toLowerCase() || normalized.endsWith(key.toLowerCase())) {
      return meta;
    }
  }
  return null;
}

/**
 * Tự động nhận diện dòng y phục mặc định hoặc phụ kiện dựa theo tên tệp tải lên
 */
export function detectGarmentFromFilename(fileName: string): { garmentId: string; label: string; kind: 'garment' | 'accessory' } {
  const norm = fileName.toLowerCase().replace(/[-_]/g, ' ');
  if (norm.includes('fan') || norm.includes('quat') || norm.includes('quạt')) {
    return { garmentId: 'quat_tram', label: 'Quạt Cầm Tay (Phụ kiện)', kind: 'accessory' };
  }
  if (norm.includes('hat') || norm.includes('non la') || norm.includes('non-la') || norm.includes('nón lá') || norm.includes('nón') || norm.includes('non')) {
    return { garmentId: 'non_la', label: 'Nón Lá (Phụ kiện đội đầu)', kind: 'accessory' };
  }
  if (norm.includes('tote') || norm.includes('woven') || norm.includes('tui') || norm.includes('túi') || norm.includes('bag') || norm.includes('coi') || norm.includes('cói')) {
    return { garmentId: 'tui_coi', label: 'Túi Cói (Phụ kiện xách tay)', kind: 'accessory' };
  }
  if (norm.includes('tu than') || norm.includes('tu-than') || norm.includes('tứ thân')) {
    return { garmentId: 'ao-tu-than', label: 'Áo Tứ Thân', kind: 'garment' };
  }
  if (norm.includes('ao dai') || norm.includes('ao-dai') || norm.includes('áo dài')) {
    return { garmentId: 'ao-dai-hien-dai', label: 'Áo Dài', kind: 'garment' };
  }
  if (norm.includes('nhat binh') || norm.includes('nhat-binh') || norm.includes('nhật bình')) {
    return { garmentId: 'ao-nhat-binh', label: 'Áo Nhật Bình', kind: 'garment' };
  }
  if (norm.includes('ngu than') || norm.includes('ngu-than') || norm.includes('ngũ thân')) {
    return { garmentId: 'ao-ngu-than', label: 'Áo Ngũ Thân', kind: 'garment' };
  }
  return { garmentId: 'custom_other', label: 'Dòng y phục khác / Tự do', kind: 'garment' };
}
