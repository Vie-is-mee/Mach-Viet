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
  },
};

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
      notice: 'Tệp mẫu trong bộ tài nguyên: tu-than-color.glb (CC BY 4.0).',
    };
  }

  if (garmentId === 'ao-dai-hien-dai') {
    return {
      hasSampleFile: true,
      suggestedFilename: 'ao-dai-blue.glb',
      modelTitle: 'Áo Dài Màu Xanh',
      notice: 'Tệp mẫu trong bộ tài nguyên: ao-dai-blue.glb (CC BY 4.0).',
    };
  }

  if (garmentId === 'ao-nhat-binh') {
    return {
      hasSampleFile: true,
      suggestedFilename: 'nhat-binh.glb',
      modelTitle: 'Áo Nhật Bình',
      notice: 'Tệp mẫu trong bộ tài nguyên: nhat-binh.glb (CC BY 4.0).',
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
