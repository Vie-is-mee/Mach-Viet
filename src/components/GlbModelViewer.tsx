import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
  Upload,
  RotateCcw,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  FileCheck,
  Info,
  X,
  Compass,
  ExternalLink,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Box,
  Eye,
  Trash2,
  CheckCircle2,
  Layers,
  Sparkles,
  Fan,
  Sliders,
  Grid,
  EyeOff,
  Crosshair,
  Save,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  matchUploadedModelMeta,
  getGarmentModelAvailability,
  detectGarmentFromFilename,
  SampleModelMeta,
  SessionModelRecord,
  AccessoryModelRecord,
  GARMENTS_ASSIGNABLE_OPTIONS,
  getPreloadedGarmentRecords,
  getPreloadedAccessoryRecord,
  PRELOADED_GARMENTS,
  PRELOADED_ACCESSORIES,
  MODERN_EXPERIMENTAL_MODELS,
  ModernExperimentalModelItem,
} from '../data/modelCatalog';

export const NonLaIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 3L2 19h20L12 3z" />
    <path d="M5.5 15.5c3.2 1.3 9.8 1.3 13 0" />
    <path d="M12 3v16" strokeDasharray="1.5 1.5" />
  </svg>
);

export const WovenBagIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M6 8h12l1 12H5L6 8z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    <line x1="6" y1="12" x2="18" y2="12" strokeDasharray="1.5 1.5" />
    <line x1="6" y1="16" x2="18" y2="16" strokeDasharray="1.5 1.5" />
  </svg>
);

export interface GlbModelViewerProps {
  currentGarmentId: string;
  currentGarmentName: string;
  onSyncGarment?: (garmentId: string) => void;
  onModelLoaded?: (fileName: string, garmentType: string) => void;
  onModelError?: (error: string) => void;
  onModelCleared?: () => void;
  selectedHeadAccessory?: string;
  selectedHandAccessory?: string;
  externalPropsVisibility?: { fan?: boolean; hat?: boolean; bag?: boolean };
  onPropsVisibilityChange?: (props: { fan: boolean; hat: boolean; bag: boolean }) => void;
}

type ViewerStatus = 'idle' | 'loading' | 'ready' | 'error';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB limit

/**
 * Chuẩn hóa đường dẫn tệp mô hình 3D trong thư mục public/models
 * Đảm bảo đường dẫn chính xác khi nạp bằng Three.js GLTFLoader
 */
export function resolveModelUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return '';
  if (
    pathOrUrl.startsWith('http://') ||
    pathOrUrl.startsWith('https://') ||
    pathOrUrl.startsWith('blob:') ||
    pathOrUrl.startsWith('data:')
  ) {
    return pathOrUrl;
  }
  return pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
}

/**
 * Tải dữ liệu nhị phân GLB từ thư mục public/models hoặc máy chủ và chuyển thành Blob URL an toàn
 * Giúp Three.js GLTFLoader nạp trực tiếp từ bộ nhớ tương tự như tệp người dùng tải lên từ máy tính
 */
export async function fetchModelBlobUrl(pathOrUrl: string): Promise<string> {
  if (!pathOrUrl) throw new Error('Đường dẫn mô hình không hợp lệ.');
  if (pathOrUrl.startsWith('blob:') || pathOrUrl.startsWith('data:')) {
    return pathOrUrl;
  }

  // Chuẩn hóa đường dẫn: loại bỏ tiền tố public/ nếu có, giữ đúng tên đường dẫn
  const cleanPath = pathOrUrl
    .replace(/^https?:\/\/[^/]+/i, '')
    .replace(/^\/?(public\/)?/, '')
    .replace(/^\/?/, '');

  const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

  const candidates: string[] = [];
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    candidates.push(pathOrUrl);
  }
  if (baseUrl) {
    candidates.push(`${baseUrl}/${cleanPath}`);
  }
  candidates.push(`/${cleanPath}`);
  candidates.push(`./${cleanPath}`);
  candidates.push(cleanPath);

  let lastError: Error | null = null;
  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate);
      if (response.ok) {
        const blob = await response.blob();
        if (blob && blob.size > 0) {
          return URL.createObjectURL(blob);
        }
      } else {
        lastError = new Error(`HTTP ${response.status} (${response.statusText})`);
      }
    } catch (err) {
      lastError = err as Error;
    }
  }

  throw new Error(
    `Không thể tải tệp 3D "${cleanPath}" từ hệ thống: ${lastError?.message || 'Không tìm thấy tệp'}`
  );
}

// Cấu trúc dữ liệu điểm neo ống tay cho phụ kiện cầm tay
export interface SleeveAnchorData {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  scale: number;
}

// Cấu hình tọa độ & hướng xoay CHUYÊN BIỆT cho từng cặp áo với quạt (fan-decorated.glb)
// Khắc phục triệt để lỗi quạt bị áo đè lên hay chui vào trong ống tay:
// - Đặt sẵn tọa độ riêng biệt, không tính gộp chung hay suy đoán sai lệch.
// - Đẩy quạt ra phía trước theo trục Z (~6-7cm ngoài mặt vải) giống như bàn tay thật đang cầm quạt.
// - Xoay ngửa nhẹ theo trục Pitch X để nan quạt vươn ra ngoài, không cắm vào thân áo.
export const DEDICATED_GARMENT_FAN_CONFIGS: Record<string, SleeveAnchorData> = {
  // 1. Áo Tứ Thân (tu-than-color.glb) x Quạt (fan-decorated.glb)
  // Tọa độ và góc xoay căn chỉnh chuyên biệt mới:
  // - Hướng quạt: Giữ nguyên hướng quạt chuẩn (đầu quạt chúc xuống dưới và rủ chéo sang phải):
  //   + rotZ = -138°: Đầu quạt chúc xuống phía dưới (-Y) và rủ chéo sang bên phải (+X), tạo cảm giác cầm quạt rũ tự nhiên ở tay phải.
  //   + rotY = -12°: Mở mặt nan quạt hướng nhẹ ra phía người xem, nhìn rõ hoa văn từ cả góc chính diện lẫn nghiêng.
  //   + rotX = 8°: Ngửa nhẹ 8° về trước để nan quạt vươn ra ngoài, hoàn toàn không đâm vào vạt áo tứ thân.
  // - Vị trí: Dịch lên trên vừa khít mép tay áo phải (X: 0.43m, Y: 0.19m):
  //   + X = 0.43: Căn đúng tâm miệng ống tay áo phải (+1cm).
  //   + Y = 0.19: Dịch lên trên thêm ~3cm (từ 0.16 -> 0.19) để chuôi quạt áp sát miệng tay áo.
  //   + Z = 0.00: Giữ nguyên độ sâu tiếp xúc tự nhiên với tay áo.
  //   + scale = 0.90: Tỉ lệ vừa vặn, thanh thoát.
  'ao-tu-than': {
    x: 0.43,
    y: 0.19,
    z: 0.00,
    rotX: 8,
    rotY: -12,
    rotZ: -138,
    scale: 0.90,
  },

  // 2. Áo Dài hiện đại (ao-dai-blue.glb) x Quạt (fan-decorated.glb)
  'ao-dai-hien-dai': {
    x: 0.32,
    y: 0.10,
    z: 0.05,
    rotX: 8,
    rotY: -12,
    rotZ: -135,
    scale: 0.90,
  },

  // 3. Áo Nhật Bình (nhat-binh.glb) x Quạt (fan-decorated.glb)
  'ao-nhat-binh': {
    x: 0.38,
    y: 0.10,
    z: 0.06,
    rotX: 8,
    rotY: -14,
    rotZ: -136,
    scale: 0.90,
  },

  // 4. Áo Ngũ Thân
  'ao-ngu-than': {
    x: 0.33,
    y: 0.10,
    z: 0.05,
    rotX: 8,
    rotY: -12,
    rotZ: -136,
    scale: 0.90,
  },
};

export const CALIBRATED_AO_TU_THAN_ANCHOR = DEDICATED_GARMENT_FAN_CONFIGS['ao-tu-than'];
export const DEFAULT_AO_DAI_ANCHOR = DEDICATED_GARMENT_FAN_CONFIGS['ao-dai-hien-dai'];
export const DEFAULT_AO_NHAT_BINH_ANCHOR = DEDICATED_GARMENT_FAN_CONFIGS['ao-nhat-binh'];

const SLEEVE_ANCHOR_STORAGE_PREFIX = 'mach_viet_fan_pos_v13_';

export function getGarmentDefaultAnchor(garmentId: string): SleeveAnchorData {
  if (garmentId === 'ao-tu-than' || garmentId.includes('tu-than')) {
    return { ...DEDICATED_GARMENT_FAN_CONFIGS['ao-tu-than'] };
  }
  if (garmentId === 'ao-nhat-binh' || garmentId.includes('nhat-binh')) {
    return { ...DEDICATED_GARMENT_FAN_CONFIGS['ao-nhat-binh'] };
  }
  if (garmentId === 'ao-dai-hien-dai' || garmentId.includes('ao-dai')) {
    return { ...DEDICATED_GARMENT_FAN_CONFIGS['ao-dai-hien-dai'] };
  }
  if (garmentId.includes('ngu-than')) {
    return { ...DEDICATED_GARMENT_FAN_CONFIGS['ao-ngu-than'] };
  }
  return { ...DEDICATED_GARMENT_FAN_CONFIGS['ao-tu-than'] };
}

// Lưu trữ và phục hồi điểm neo theo phiên làm việc riêng cho từng áo (Session Persistence)
export function getSessionAnchor(garmentKey: string): SleeveAnchorData | null {
  try {
    const raw = sessionStorage.getItem(`${SLEEVE_ANCHOR_STORAGE_PREFIX}${garmentKey}`) ||
                localStorage.getItem(`${SLEEVE_ANCHOR_STORAGE_PREFIX}${garmentKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number' && typeof parsed.z === 'number') {
        return parsed as SleeveAnchorData;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc điểm neo từ session:', e);
  }
  return null;
}

export function saveSessionAnchor(garmentKey: string, data: SleeveAnchorData) {
  try {
    const serialized = JSON.stringify(data);
    sessionStorage.setItem(`${SLEEVE_ANCHOR_STORAGE_PREFIX}${garmentKey}`, serialized);
    localStorage.setItem(`${SLEEVE_ANCHOR_STORAGE_PREFIX}${garmentKey}`, serialized);
  } catch (e) {
    console.warn('Lỗi lưu điểm neo vào session:', e);
  }
}

// -------------------------------------------------------------
// USER SAVED PRESET STORAGE (Lưu vĩnh viễn vị trí mặc định cho từng cặp model)
// -------------------------------------------------------------
const USER_SAVED_PRESET_PREFIX = 'mach_viet_user_saved_fan_preset_v13_';

export interface UserSavedFanPreset extends SleeveAnchorData {
  savedAt: string;
  garmentLabel: string;
  pairKey: string;
}

export function getModelPairKey(garmentFileName?: string, garmentId?: string, accessoryFileName?: string): string {
  const gName = (garmentFileName || '').toLowerCase();
  const aName = (accessoryFileName || '').toLowerCase();

  if (gName.includes('tu-than') || garmentId === 'ao-tu-than' || garmentId?.includes('tu-than')) {
    return 'ao_tu_than_fan';
  }
  if (gName.includes('ao-dai') || garmentId === 'ao-dai-hien-dai' || garmentId?.includes('ao-dai')) {
    return 'ao_dai_fan';
  }
  if (gName.includes('nhat-binh') || garmentId === 'ao-nhat-binh' || garmentId?.includes('nhat-binh')) {
    return 'ao_nhat_binh_fan';
  }
  if (garmentId?.includes('ngu-than')) {
    return 'ao_ngu_than_fan';
  }
  const cleanG = (garmentFileName || garmentId || 'garment').replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanA = (accessoryFileName || 'fan').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${cleanG}__${cleanA}`;
}

export function getUserSavedPreset(pairKey: string): UserSavedFanPreset | null {
  try {
    const raw = localStorage.getItem(`${USER_SAVED_PRESET_PREFIX}${pairKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number' && typeof parsed.z === 'number') {
        return parsed as UserSavedFanPreset;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc user saved preset:', e);
  }
  return null;
}

export function saveUserCustomPreset(pairKey: string, data: SleeveAnchorData, garmentLabel: string) {
  try {
    const payload: UserSavedFanPreset = {
      ...data,
      savedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      garmentLabel,
      pairKey,
    };
    localStorage.setItem(`${USER_SAVED_PRESET_PREFIX}${pairKey}`, JSON.stringify(payload));
    saveSessionAnchor(pairKey, data);
  } catch (e) {
    console.warn('Lỗi lưu user custom preset:', e);
  }
}

export function deleteUserCustomPreset(pairKey: string) {
  try {
    localStorage.removeItem(`${USER_SAVED_PRESET_PREFIX}${pairKey}`);
    localStorage.removeItem(`mach_viet_user_saved_fan_preset_v12_${pairKey}`);
    localStorage.removeItem(`mach_viet_user_saved_fan_preset_v11_${pairKey}`);
    localStorage.removeItem(`mach_viet_user_saved_fan_preset_v10_${pairKey}`);
    localStorage.removeItem(`mach_viet_user_saved_fan_preset_v9_${pairKey}`);
    localStorage.removeItem(`mach_viet_user_saved_fan_preset_v8_${pairKey}`);
    localStorage.removeItem(`mach_viet_user_saved_fan_preset_v7_${pairKey}`);
    localStorage.removeItem(`mach_viet_user_saved_fan_preset_v6_${pairKey}`);
    localStorage.removeItem(`mach_viet_user_saved_fan_preset_v5_${pairKey}`);
    localStorage.removeItem(`mach_viet_user_saved_fan_preset_${pairKey}`);
    sessionStorage.removeItem(`${SLEEVE_ANCHOR_STORAGE_PREFIX}${pairKey}`);
    localStorage.removeItem(`${SLEEVE_ANCHOR_STORAGE_PREFIX}${pairKey}`);
    sessionStorage.removeItem(`mach_viet_fan_pos_v12_${pairKey}`);
    localStorage.removeItem(`mach_viet_fan_pos_v12_${pairKey}`);
    sessionStorage.removeItem(`mach_viet_fan_pos_v11_${pairKey}`);
    localStorage.removeItem(`mach_viet_fan_pos_v11_${pairKey}`);
    sessionStorage.removeItem(`mach_viet_fan_pos_v10_${pairKey}`);
    localStorage.removeItem(`mach_viet_fan_pos_v10_${pairKey}`);
    sessionStorage.removeItem(`mach_viet_fan_pos_v9_${pairKey}`);
    localStorage.removeItem(`mach_viet_fan_pos_v9_${pairKey}`);
    sessionStorage.removeItem(`mach_viet_fan_pos_v8_${pairKey}`);
    localStorage.removeItem(`mach_viet_fan_pos_v8_${pairKey}`);
    sessionStorage.removeItem(`mach_viet_fan_pos_v7_${pairKey}`);
    localStorage.removeItem(`mach_viet_fan_pos_v7_${pairKey}`);
    sessionStorage.removeItem(`mach_viet_fan_pos_v6_${pairKey}`);
    localStorage.removeItem(`mach_viet_fan_pos_v6_${pairKey}`);
    sessionStorage.removeItem(`mach_viet_fan_pos_v5_${pairKey}`);
    localStorage.removeItem(`mach_viet_fan_pos_v5_${pairKey}`);
  } catch (e) {
    console.warn('Lỗi xóa user custom preset:', e);
  }
}

// =============================================================
// CẤU HÌNH TỌA ĐỘ VÀ HƯỚNG XOAY CHUYÊN BIỆT CHO NÓN LÁ (hat-non-la.glb)
// Vị trí mặc định nằm gần phần đầu/cổ của áo (kiểu như đang đội lên người mặc)
// =============================================================
export const DEDICATED_GARMENT_HAT_CONFIGS: Record<string, SleeveAnchorData> = {
  // 1. Áo Tứ Thân (tu-than-color.glb) x Nón Lá (hat-non-la.glb)
  // Tọa độ căn chỉnh đội đầu tự nhiên:
  // - X = 0.00: Thẳng trục giữa cơ thể.
  // - Y = 0.68: Ngay phía trên cổ/vai áo tứ thân (phỏng dựng độ cao đầu người đội nón).
  // - Z = -0.02: Trùng trục cổ áo hơi nghiêng nhẹ theo dáng tự nhiên.
  // - rotX = -4°: Ngửa nhẹ 4° ra sau, tạo góc đội nón thanh thoát.
  // - rotY = 0°: Cân đối chính diện.
  // - rotZ = 0°: Thăng bằng.
  // - scale = 0.90: Tỉ lệ chuẩn vừa vặn với kích thước phom áo.
  'ao-tu-than': {
    x: 0.00,
    y: 0.68,
    z: -0.02,
    rotX: -4,
    rotY: 0,
    rotZ: 0,
    scale: 0.90,
  },
  'ao-dai-hien-dai': {
    x: 0.00,
    y: 0.70,
    z: -0.01,
    rotX: -4,
    rotY: 0,
    rotZ: 0,
    scale: 0.90,
  },
  'ao-nhat-binh': {
    x: 0.00,
    y: 0.68,
    z: -0.02,
    rotX: -4,
    rotY: 0,
    rotZ: 0,
    scale: 0.90,
  },
  'ao-ngu-than': {
    x: 0.00,
    y: 0.68,
    z: -0.02,
    rotX: -4,
    rotY: 0,
    rotZ: 0,
    scale: 0.90,
  },
};

const HAT_ANCHOR_STORAGE_PREFIX = 'mach_viet_hat_pos_v1_';
const USER_SAVED_HAT_PRESET_PREFIX = 'mach_viet_user_saved_hat_preset_v1_';

export function getGarmentDefaultHatAnchor(garmentId: string): SleeveAnchorData {
  if (garmentId === 'ao-tu-than' || garmentId.includes('tu-than')) {
    return { ...DEDICATED_GARMENT_HAT_CONFIGS['ao-tu-than'] };
  }
  if (garmentId === 'ao-nhat-binh' || garmentId.includes('nhat-binh')) {
    return { ...DEDICATED_GARMENT_HAT_CONFIGS['ao-nhat-binh'] };
  }
  if (garmentId === 'ao-dai-hien-dai' || garmentId.includes('ao-dai')) {
    return { ...DEDICATED_GARMENT_HAT_CONFIGS['ao-dai-hien-dai'] };
  }
  if (garmentId.includes('ngu-than')) {
    return { ...DEDICATED_GARMENT_HAT_CONFIGS['ao-ngu-than'] };
  }
  return { ...DEDICATED_GARMENT_HAT_CONFIGS['ao-tu-than'] };
}

export function getHatModelPairKey(garmentFileName?: string, garmentId?: string, accessoryFileName?: string): string {
  const gName = (garmentFileName || '').toLowerCase();
  if (gName.includes('tu-than') || garmentId === 'ao-tu-than' || garmentId?.includes('tu-than')) {
    return 'ao_tu_than_hat';
  }
  if (gName.includes('ao-dai') || garmentId === 'ao-dai-hien-dai' || garmentId?.includes('ao-dai')) {
    return 'ao_dai_hat';
  }
  if (gName.includes('nhat-binh') || garmentId === 'ao-nhat-binh' || garmentId?.includes('nhat-binh')) {
    return 'ao_nhat_binh_hat';
  }
  if (garmentId?.includes('ngu-than')) {
    return 'ao_ngu_than_hat';
  }
  const cleanG = (garmentFileName || garmentId || 'garment').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${cleanG}__hat`;
}

export function getSessionHatAnchor(key: string): SleeveAnchorData | null {
  try {
    const raw = sessionStorage.getItem(`${HAT_ANCHOR_STORAGE_PREFIX}${key}`) ||
                localStorage.getItem(`${HAT_ANCHOR_STORAGE_PREFIX}${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number' && typeof parsed.z === 'number') {
        return parsed as SleeveAnchorData;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc điểm neo nón lá từ session:', e);
  }
  return null;
}

export function saveSessionHatAnchor(key: string, data: SleeveAnchorData) {
  try {
    const serialized = JSON.stringify(data);
    sessionStorage.setItem(`${HAT_ANCHOR_STORAGE_PREFIX}${key}`, serialized);
    localStorage.setItem(`${HAT_ANCHOR_STORAGE_PREFIX}${key}`, serialized);
  } catch (e) {
    console.warn('Lỗi lưu điểm neo nón lá vào session:', e);
  }
}

export function getUserSavedHatPreset(pairKey: string): UserSavedFanPreset | null {
  try {
    const raw = localStorage.getItem(`${USER_SAVED_HAT_PRESET_PREFIX}${pairKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number' && typeof parsed.z === 'number') {
        return parsed as UserSavedFanPreset;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc user saved hat preset:', e);
  }
  return null;
}

export function saveUserCustomHatPreset(pairKey: string, data: SleeveAnchorData, garmentLabel: string) {
  try {
    const payload: UserSavedFanPreset = {
      ...data,
      savedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      garmentLabel,
      pairKey,
    };
    localStorage.setItem(`${USER_SAVED_HAT_PRESET_PREFIX}${pairKey}`, JSON.stringify(payload));
    saveSessionHatAnchor(pairKey, data);
  } catch (e) {
    console.warn('Lỗi lưu user custom hat preset:', e);
  }
}

export function deleteUserCustomHatPreset(pairKey: string) {
  try {
    localStorage.removeItem(`${USER_SAVED_HAT_PRESET_PREFIX}${pairKey}`);
    sessionStorage.removeItem(`${HAT_ANCHOR_STORAGE_PREFIX}${pairKey}`);
    localStorage.removeItem(`${HAT_ANCHOR_STORAGE_PREFIX}${pairKey}`);
  } catch (e) {
    console.warn('Lỗi xóa user custom hat preset:', e);
  }
}

// =============================================================
// CẤU HÌNH TỌA ĐỘ VÀ HƯỚNG XOAY CHUYÊN BIỆT CHO TÚI CÓI (woven-tote.glb)
// Vị trí mặc định nằm gần cuối tay áo bên trái khi nhìn từ chính diện (xách túi)
// Phần quai túi chạm mép ống tay, thân túi buông thõng tự nhiên xuống dưới
// =============================================================
export const DEDICATED_GARMENT_BAG_CONFIGS: Record<string, SleeveAnchorData> = {
  // 1. Áo Tứ Thân (tu-than-color.glb) x Túi Cói (woven-tote.glb)
  // Căn chỉnh vị trí xách tay trái tự nhiên:
  // - X = -0.42: Miệng ống tay áo trái khi nhìn từ chính diện (-X).
  // - Y = 0.18: Độ cao ngang tầm tay xách, quai túi đặt gần đầu ống tay.
  // - Z = 0.08: Đẩy nhẹ ra ngoài mặt vải phía trước để quai và thân túi không lún vào tà áo.
  // - rotX = 0°: Thẳng đứng tự nhiên theo phương trọng lực.
  // - rotY = 5°: Nghiêng nhẹ góc mở theo dáng buông tay.
  // - rotZ = -3°: Rủ hơi chếch ra ngoài thân áo để không va chạm mép tà dưới.
  // - scale = 0.85: Kích cỡ cân đối tự nhiên với phom áo tứ thân.
  'ao-tu-than': {
    x: -0.42,
    y: 0.18,
    z: 0.08,
    rotX: 0,
    rotY: 5,
    rotZ: -3,
    scale: 0.85,
  },
  'ao-dai-hien-dai': {
    x: -0.40,
    y: 0.16,
    z: 0.07,
    rotX: 0,
    rotY: 5,
    rotZ: -2,
    scale: 0.85,
  },
  'ao-nhat-binh': {
    x: -0.46,
    y: 0.14,
    z: 0.09,
    rotX: 0,
    rotY: 5,
    rotZ: -4,
    scale: 0.85,
  },
  'ao-ngu-than': {
    x: -0.42,
    y: 0.17,
    z: 0.08,
    rotX: 0,
    rotY: 5,
    rotZ: -3,
    scale: 0.85,
  },
};

const BAG_ANCHOR_STORAGE_PREFIX = 'mach_viet_bag_pos_v1_';
const USER_SAVED_BAG_PRESET_PREFIX = 'mach_viet_user_saved_bag_preset_v1_';

export function getGarmentDefaultBagAnchor(garmentId: string): SleeveAnchorData {
  if (garmentId === 'ao-tu-than' || garmentId.includes('tu-than')) {
    return { ...DEDICATED_GARMENT_BAG_CONFIGS['ao-tu-than'] };
  }
  if (garmentId === 'ao-nhat-binh' || garmentId.includes('nhat-binh')) {
    return { ...DEDICATED_GARMENT_BAG_CONFIGS['ao-nhat-binh'] };
  }
  if (garmentId === 'ao-dai-hien-dai' || garmentId.includes('ao-dai')) {
    return { ...DEDICATED_GARMENT_BAG_CONFIGS['ao-dai-hien-dai'] };
  }
  if (garmentId.includes('ngu-than')) {
    return { ...DEDICATED_GARMENT_BAG_CONFIGS['ao-ngu-than'] };
  }
  return { ...DEDICATED_GARMENT_BAG_CONFIGS['ao-tu-than'] };
}

export function getBagModelPairKey(garmentFileName?: string, garmentId?: string, accessoryFileName?: string): string {
  const gName = (garmentFileName || '').toLowerCase();
  if (gName.includes('tu-than') || garmentId === 'ao-tu-than' || garmentId?.includes('tu-than')) {
    return 'ao_tu_than_bag';
  }
  if (gName.includes('ao-dai') || garmentId === 'ao-dai-hien-dai' || garmentId?.includes('ao-dai')) {
    return 'ao_dai_bag';
  }
  if (gName.includes('nhat-binh') || garmentId === 'ao-nhat-binh' || garmentId?.includes('nhat-binh')) {
    return 'ao_nhat_binh_bag';
  }
  if (garmentId?.includes('ngu-than')) {
    return 'ao_ngu_than_bag';
  }
  const cleanG = (garmentFileName || garmentId || 'garment').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${cleanG}__bag`;
}

export function getSessionBagAnchor(key: string): SleeveAnchorData | null {
  try {
    const raw = sessionStorage.getItem(`${BAG_ANCHOR_STORAGE_PREFIX}${key}`) ||
                localStorage.getItem(`${BAG_ANCHOR_STORAGE_PREFIX}${key}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number' && typeof parsed.z === 'number') {
        return parsed as SleeveAnchorData;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc điểm neo túi cói từ session:', e);
  }
  return null;
}

export function saveSessionBagAnchor(key: string, data: SleeveAnchorData) {
  try {
    const serialized = JSON.stringify(data);
    sessionStorage.setItem(`${BAG_ANCHOR_STORAGE_PREFIX}${key}`, serialized);
    localStorage.setItem(`${BAG_ANCHOR_STORAGE_PREFIX}${key}`, serialized);
  } catch (e) {
    console.warn('Lỗi lưu điểm neo túi cói vào session:', e);
  }
}

export function getUserSavedBagPreset(pairKey: string): UserSavedFanPreset | null {
  try {
    const raw = localStorage.getItem(`${USER_SAVED_BAG_PRESET_PREFIX}${pairKey}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number' && typeof parsed.z === 'number') {
        return parsed as UserSavedFanPreset;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc user saved bag preset:', e);
  }
  return null;
}

export function saveUserCustomBagPreset(pairKey: string, data: SleeveAnchorData, garmentLabel: string) {
  try {
    const payload: UserSavedFanPreset = {
      ...data,
      savedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      garmentLabel,
      pairKey,
    };
    localStorage.setItem(`${USER_SAVED_BAG_PRESET_PREFIX}${pairKey}`, JSON.stringify(payload));
    saveSessionBagAnchor(pairKey, data);
  } catch (e) {
    console.warn('Lỗi lưu user custom bag preset:', e);
  }
}

export function deleteUserCustomBagPreset(pairKey: string) {
  try {
    localStorage.removeItem(`${USER_SAVED_BAG_PRESET_PREFIX}${pairKey}`);
    sessionStorage.removeItem(`${BAG_ANCHOR_STORAGE_PREFIX}${pairKey}`);
    localStorage.removeItem(`${BAG_ANCHOR_STORAGE_PREFIX}${pairKey}`);
  } catch (e) {
    console.warn('Lỗi xóa user custom bag preset:', e);
  }
}

// Thuật toán quét cấu trúc đỉnh (vertex sampling) hoặc bone node để tìm vị trí mép ngoài ống tay phải
function detectRightSleeveEnd(model: THREE.Group): { x: number; y: number; z: number } | null {
  // 1. Quét tìm bone node hoặc dummy object nếu tệp GLB có cấu trúc rig/armature
  const foundBone: { pos?: THREE.Vector3 } = {};
  const sleeveKeywords = ['hand_r', 'righthand', 'hand.r', 'wrist_r', 'wrist.r', 'forearm_r', 'sleeve_r', 'cuff_r'];
  
  model.traverse((child) => {
    if (foundBone.pos) return;
    const name = child.name.toLowerCase();
    if (sleeveKeywords.some((kw) => name.includes(kw))) {
      const wp = new THREE.Vector3();
      child.getWorldPosition(wp);
      foundBone.pos = wp;
    }
  });

  if (foundBone.pos) {
    return {
      x: Number(foundBone.pos.x.toFixed(2)),
      y: Number(foundBone.pos.y.toFixed(2)),
      z: Number(foundBone.pos.z.toFixed(2)),
    };
  }

  // 2. Quét tập đỉnh (vertex analysis) ở vùng ống tay phải (x > 0, nửa trên thân áo)
  const candidates: THREE.Vector3[] = [];
  const tempV = new THREE.Vector3();

  model.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      const geo = mesh.geometry;
      if (geo && geo.attributes.position) {
        const posAttr = geo.attributes.position;
        const step = Math.max(1, Math.floor(posAttr.count / 2000));
        for (let i = 0; i < posAttr.count; i += step) {
          tempV.fromBufferAttribute(posAttr, i);
          tempV.applyMatrix4(mesh.matrixWorld);
          // Ống tay phải: tọa độ X dương (bên phải), chiều cao thân áo giữa khoảng -0.15 và +0.35
          // (Loại bỏ các đỉnh tà váy xòe rộng bên dưới hông y < -0.15)
          if (tempV.x > 0.26 && tempV.y >= -0.15 && tempV.y <= 0.40) {
            candidates.push(tempV.clone());
          }
        }
      }
    }
  });

  if (candidates.length > 0) {
    // Sắp xếp theo X giảm dần để lấy các đỉnh rìa ngoài cùng của ống tay
    candidates.sort((a, b) => b.x - a.x);
    const sampleCount = Math.min(20, Math.max(1, Math.floor(candidates.length * 0.1)));
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;
    let validCount = 0;
    for (let i = 0; i < sampleCount; i++) {
      const pt = candidates[i];
      if (pt) {
        sumX += pt.x;
        sumY += pt.y;
        sumZ += pt.z;
        validCount++;
      }
    }
    if (validCount > 0) {
      return {
        x: Number((sumX / validCount).toFixed(2)),
        y: Number((sumY / validCount).toFixed(2)),
        z: Number((sumZ / validCount).toFixed(2)),
      };
    }
  }

  return null;
}

export const GlbModelViewer: React.FC<GlbModelViewerProps> = ({
  currentGarmentId,
  currentGarmentName,
  onSyncGarment,
  onModelLoaded,
  onModelError,
  onModelCleared,
  selectedHeadAccessory,
  selectedHandAccessory,
  externalPropsVisibility,
  onPropsVisibilityChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);
  const accessoryFileInputRef = useRef<HTMLInputElement>(null);
  const hatFileInputRef = useRef<HTMLInputElement>(null);
  const bagFileInputRef = useRef<HTMLInputElement>(null);

  // User explicit hide tracking for session (distinguishing default vs intentional manual hide)
  const userExplicitlyHiddenRef = useRef<{ fan?: boolean; hat?: boolean; bag?: boolean }>({});

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);

  // Separate Object Groups for Garment, Accessory (Fan), Hat (Nón Lá), and Bag (Túi Cói)
  const garmentGroupRef = useRef<THREE.Group | null>(null);
  const accessoryPivotRef = useRef<THREE.Group | null>(null);
  const accessoryRotatorRef = useRef<THREE.Group | null>(null);
  const accessoryInnerModelRef = useRef<THREE.Group | null>(null);

  const hatPivotRef = useRef<THREE.Group | null>(null);
  const hatRotatorRef = useRef<THREE.Group | null>(null);
  const hatInnerModelRef = useRef<THREE.Group | null>(null);

  const bagPivotRef = useRef<THREE.Group | null>(null);
  const bagRotatorRef = useRef<THREE.Group | null>(null);
  const bagInnerModelRef = useRef<THREE.Group | null>(null);

  const animationFrameIdRef = useRef<number | null>(null);
  const initialViewRef = useRef<{ cameraPos: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  // Session & Loading Control Refs (Preventing duplicate/infinite load loops)
  const currentLoadedGarmentIdRef = useRef<string | null>(null);
  const garmentLoadGenRef = useRef<number>(0);

  const currentLoadedAccessoryIdRef = useRef<string | null>(null);
  const accessoryLoadGenRef = useRef<number>(0);

  const currentLoadedHatIdRef = useRef<string | null>(null);
  const hatLoadGenRef = useRef<number>(0);

  const currentLoadedBagIdRef = useRef<string | null>(null);
  const bagLoadGenRef = useRef<number>(0);

  // Stabilize external callbacks
  const onSyncGarmentRef = useRef(onSyncGarment);
  onSyncGarmentRef.current = onSyncGarment;
  const onModelLoadedRef = useRef(onModelLoaded);
  onModelLoadedRef.current = onModelLoaded;
  const onModelErrorRef = useRef(onModelError);
  onModelErrorRef.current = onModelError;
  const onModelClearedRef = useRef(onModelCleared);
  onModelClearedRef.current = onModelCleared;

  // Garment models session state (Khởi tạo sẵn 3 áo chính từ thư mục public/models)
  const [loadedModels, setLoadedModels] = useState<SessionModelRecord[]>(getPreloadedGarmentRecords);
  const loadedModelsRef = useRef<SessionModelRecord[]>(loadedModels);
  loadedModelsRef.current = loadedModels;

  const [activeModelId, setActiveModelId] = useState<string | null>(() => {
    const list = getPreloadedGarmentRecords();
    const match = list.find((m) => {
      if (m.assignedGarmentId === currentGarmentId) return true;
      if (currentGarmentId === 'ao-tu-than' && m.fileName.toLowerCase().includes('tu-than')) return true;
      if (currentGarmentId === 'ao-dai-hien-dai' && m.fileName.toLowerCase().includes('ao-dai')) return true;
      if (currentGarmentId === 'ao-nhat-binh' && m.fileName.toLowerCase().includes('nhat-binh')) return true;
      return false;
    });
    return match ? match.id : (list[0]?.id || null);
  });
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  // Accessory model state (Khởi tạo sẵn Quạt cầm tay fan-decorated.glb)
  const [accessoryModel, setAccessoryModel] = useState<AccessoryModelRecord | null>(() => {
    return getPreloadedAccessoryRecord('fan');
  });
  const accessoryModelRef = useRef<AccessoryModelRecord | null>(accessoryModel);
  accessoryModelRef.current = accessoryModel;
  const [isAccessoryLoading, setIsAccessoryLoading] = useState<boolean>(false);
  const [accessoryLoadingProgress, setAccessoryLoadingProgress] = useState<number>(0);
  const [accessoryError, setAccessoryError] = useState<string | null>(null);

  // Hat model state (Khởi tạo sẵn Nón lá hat-non-la.glb)
  const [hatModel, setHatModel] = useState<AccessoryModelRecord | null>(() => {
    return getPreloadedAccessoryRecord('hat');
  });
  const hatModelRef = useRef<AccessoryModelRecord | null>(hatModel);
  hatModelRef.current = hatModel;
  const [isHatLoading, setIsHatLoading] = useState<boolean>(false);
  const [hatLoadingProgress, setHatLoadingProgress] = useState<number>(0);
  const [hatError, setHatError] = useState<string | null>(null);

  // Bag model state (Khởi tạo sẵn Túi cói woven-tote.glb)
  const [bagModel, setBagModel] = useState<AccessoryModelRecord | null>(() => {
    return getPreloadedAccessoryRecord('bag');
  });
  const bagModelRef = useRef<AccessoryModelRecord | null>(bagModel);
  bagModelRef.current = bagModel;
  const [isBagLoading, setIsBagLoading] = useState<boolean>(false);
  const [bagLoadingProgress, setBagLoadingProgress] = useState<number>(0);
  const [bagError, setBagError] = useState<string | null>(null);

  // Modern experimental models catalog modal state
  const [showModernCatalogModal, setShowModernCatalogModal] = useState<boolean>(false);

  // Anchor helper 3D indicator reference
  const anchorHelperRef = useRef<THREE.Group | null>(null);
  const [showAnchorHelper, setShowAnchorHelper] = useState<boolean>(false);
  const [resetFeedbackNotice, setResetFeedbackNotice] = useState<string | null>(null);
  const [hatResetFeedbackNotice, setHatResetFeedbackNotice] = useState<string | null>(null);
  const [bagResetFeedbackNotice, setBagResetFeedbackNotice] = useState<string | null>(null);

  // Accessory fine-tuning transform settings (Quạt)
  const initialPairKey = getModelPairKey(undefined, currentGarmentId, undefined);
  const initialUserPreset = getUserSavedPreset(initialPairKey);
  const initialSessionAnchor = getSessionAnchor(initialPairKey);
  const initialAnchorConfig = initialUserPreset || initialSessionAnchor || getGarmentDefaultAnchor(currentGarmentId);

  const [savedPresetData, setSavedPresetData] = useState<UserSavedFanPreset | null>(initialUserPreset);
  const [hasSavedCustomPreset, setHasSavedCustomPreset] = useState<boolean>(initialUserPreset !== null);

  const [suggestedAccessoryPos, setSuggestedAccessoryPos] = useState<{ x: number; y: number; z: number }>({
    x: initialAnchorConfig.x,
    y: initialAnchorConfig.y,
    z: initialAnchorConfig.z,
  });
  const [accessoryOffsetX, setAccessoryOffsetX] = useState<number>(initialAnchorConfig.x);
  const [accessoryOffsetY, setAccessoryOffsetY] = useState<number>(initialAnchorConfig.y);
  const [accessoryOffsetZ, setAccessoryOffsetZ] = useState<number>(initialAnchorConfig.z);
  const [accessoryRotY, setAccessoryRotY] = useState<number>(initialAnchorConfig.rotY); // xoay ngang quanh trục đứng Y (độ)
  const [accessoryRotZ, setAccessoryRotZ] = useState<number>(initialAnchorConfig.rotZ);  // nghiêng quạt quanh trục Z (độ)
  const [accessoryRotX, setAccessoryRotX] = useState<number>(initialAnchorConfig.rotX);   // ngửa/úp quạt quanh trục X (độ)
  const [accessoryScale, setAccessoryScale] = useState<number>(initialAnchorConfig.scale);
  const [isAccessoryVisible, setIsAccessoryVisible] = useState<boolean>(() => {
    if (externalPropsVisibility?.fan !== undefined) return externalPropsVisibility.fan;
    return true; // Default visible
  });

  // Hat fine-tuning transform settings (Nón lá)
  const initialHatPairKey = getHatModelPairKey(undefined, currentGarmentId, undefined);
  const initialUserHatPreset = getUserSavedHatPreset(initialHatPairKey);
  const initialSessionHatAnchor = getSessionHatAnchor(initialHatPairKey);
  const initialHatConfig = initialUserHatPreset || initialSessionHatAnchor || getGarmentDefaultHatAnchor(currentGarmentId);

  const [savedHatPresetData, setSavedHatPresetData] = useState<UserSavedFanPreset | null>(initialUserHatPreset);
  const [hasSavedHatCustomPreset, setHasSavedHatCustomPreset] = useState<boolean>(initialUserHatPreset !== null);

  const [hatOffsetX, setHatOffsetX] = useState<number>(initialHatConfig.x);
  const [hatOffsetY, setHatOffsetY] = useState<number>(initialHatConfig.y);
  const [hatOffsetZ, setHatOffsetZ] = useState<number>(initialHatConfig.z);
  const [hatRotY, setHatRotY] = useState<number>(initialHatConfig.rotY);
  const [hatRotZ, setHatRotZ] = useState<number>(initialHatConfig.rotZ);
  const [hatRotX, setHatRotX] = useState<number>(initialHatConfig.rotX);
  const [hatScale, setHatScale] = useState<number>(initialHatConfig.scale);
  const [isHatVisible, setIsHatVisible] = useState<boolean>(() => {
    if (externalPropsVisibility?.hat !== undefined) return externalPropsVisibility.hat;
    return true; // Default visible
  });

  // Bag fine-tuning transform settings (Túi cói)
  const initialBagPairKey = getBagModelPairKey(undefined, currentGarmentId, undefined);
  const initialUserBagPreset = getUserSavedBagPreset(initialBagPairKey);
  const initialSessionBagAnchor = getSessionBagAnchor(initialBagPairKey);
  const initialBagConfig = initialUserBagPreset || initialSessionBagAnchor || getGarmentDefaultBagAnchor(currentGarmentId);

  const [savedBagPresetData, setSavedBagPresetData] = useState<UserSavedFanPreset | null>(initialUserBagPreset);
  const [hasSavedBagCustomPreset, setHasSavedBagCustomPreset] = useState<boolean>(initialUserBagPreset !== null);

  const [bagOffsetX, setBagOffsetX] = useState<number>(initialBagConfig.x);
  const [bagOffsetY, setBagOffsetY] = useState<number>(initialBagConfig.y);
  const [bagOffsetZ, setBagOffsetZ] = useState<number>(initialBagConfig.z);
  const [bagRotY, setBagRotY] = useState<number>(initialBagConfig.rotY);
  const [bagRotZ, setBagRotZ] = useState<number>(initialBagConfig.rotZ);
  const [bagRotX, setBagRotX] = useState<number>(initialBagConfig.rotX);
  const [bagScale, setBagScale] = useState<number>(initialBagConfig.scale);
  const [isBagVisible, setIsBagVisible] = useState<boolean>(() => {
    if (externalPropsVisibility?.bag !== undefined) return externalPropsVisibility.bag;
    return true; // Default visible
  });

  // Active accessory controls drawer and collapsed Advanced Controls
  const [showAccessoryControls, setShowAccessoryControls] = useState<boolean>(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [activeAccessoryTab, setActiveAccessoryTab] = useState<'fan' | 'hat' | 'bag'>('fan');

  // Synchronize when externalPropsVisibility is passed from parent (e.g. restoring saved outfit)
  useEffect(() => {
    if (externalPropsVisibility) {
      if (externalPropsVisibility.fan !== undefined) {
        setIsAccessoryVisible(externalPropsVisibility.fan);
        if (accessoryPivotRef.current) accessoryPivotRef.current.visible = externalPropsVisibility.fan;
        userExplicitlyHiddenRef.current.fan = !externalPropsVisibility.fan;
      }
      if (externalPropsVisibility.hat !== undefined) {
        setIsHatVisible(externalPropsVisibility.hat);
        if (hatPivotRef.current) hatPivotRef.current.visible = externalPropsVisibility.hat;
        userExplicitlyHiddenRef.current.hat = !externalPropsVisibility.hat;
      }
      if (externalPropsVisibility.bag !== undefined) {
        setIsBagVisible(externalPropsVisibility.bag);
        if (bagPivotRef.current) bagPivotRef.current.visible = externalPropsVisibility.bag;
        userExplicitlyHiddenRef.current.bag = !externalPropsVisibility.bag;
      }
    }
  }, [externalPropsVisibility]);

  // Support Escape key to close modern catalog modal
  useEffect(() => {
    if (!showModernCatalogModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModernCatalogModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showModernCatalogModal]);

  // Grid visibility toggle (Ẩn mặc định theo yêu cầu người dùng để không rối tà áo)
  const [showGrid, setShowGrid] = useState<boolean>(false);

  // Viewer state
  const [viewerStatus, setViewerStatus] = useState<ViewerStatus>('idle');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // Scene readiness & actual in-scene display trackers
  // Phân biệt rõ ràng giữa "Đã nạp tệp vào phiên" và "Đang thực sự hiển thị trong khung 3D"
  const [isSceneReady, setIsSceneReady] = useState<boolean>(false);
  const [sceneVersion, setSceneVersion] = useState<number>(0);
  const [activeGarmentInScene, setActiveGarmentInScene] = useState<string | null>(null);
  const [isFanInScene, setIsFanInScene] = useState<boolean>(false);
  const [isHatInScene, setIsHatInScene] = useState<boolean>(false);
  const [isBagInScene, setIsBagInScene] = useState<boolean>(false);

  // Active garment record
  const activeRecord = loadedModels.find((m) => m.id === activeModelId) || null;
  const modelMeta = activeRecord ? activeRecord.matchedMeta : null;
  const availability = getGarmentModelAvailability(currentGarmentId);

  // Đồng bộ trạng thái preset đã lưu khi đổi áo hoặc đổi phụ kiện
  useEffect(() => {
    const pairKey = getModelPairKey(activeRecord?.fileName, currentGarmentId, accessoryModel?.fileName);
    const userPreset = getUserSavedPreset(pairKey);
    setHasSavedCustomPreset(userPreset !== null);
    setSavedPresetData(userPreset);

    const hatPairKey = getHatModelPairKey(activeRecord?.fileName, currentGarmentId, hatModel?.fileName);
    const userHatPreset = getUserSavedHatPreset(hatPairKey);
    setHasSavedHatCustomPreset(userHatPreset !== null);
    setSavedHatPresetData(userHatPreset);

    const bagPairKey = getBagModelPairKey(activeRecord?.fileName, currentGarmentId, bagModel?.fileName);
    const userBagPreset = getUserSavedBagPreset(bagPairKey);
    setHasSavedBagCustomPreset(userBagPreset !== null);
    setSavedBagPresetData(userBagPreset);
  }, [currentGarmentId, activeModelId, accessoryModel?.fileName, hatModel?.fileName, bagModel?.fileName, activeRecord?.fileName]);

  // Cập nhật tọa độ điểm neo trực tiếp và lưu tạm thời vào phiên làm việc
  const handleUpdateAnchorCoordinate = (
    key: 'x' | 'y' | 'z' | 'rotX' | 'rotY' | 'rotZ' | 'scale',
    value: number
  ) => {
    if (isNaN(value)) return;
    const nextX = key === 'x' ? value : accessoryOffsetX;
    const nextY = key === 'y' ? value : accessoryOffsetY;
    const nextZ = key === 'z' ? value : accessoryOffsetZ;
    const nextRotX = key === 'rotX' ? value : accessoryRotX;
    const nextRotY = key === 'rotY' ? value : accessoryRotY;
    const nextRotZ = key === 'rotZ' ? value : accessoryRotZ;
    const nextScale = key === 'scale' ? value : accessoryScale;

    if (key === 'x') setAccessoryOffsetX(value);
    if (key === 'y') setAccessoryOffsetY(value);
    if (key === 'z') setAccessoryOffsetZ(value);
    if (key === 'rotX') setAccessoryRotX(value);
    if (key === 'rotY') setAccessoryRotY(value);
    if (key === 'rotZ') setAccessoryRotZ(value);
    if (key === 'scale') setAccessoryScale(value);

    const pairKey = getModelPairKey(activeRecord?.fileName, currentGarmentId, accessoryModel?.fileName);
    saveSessionAnchor(pairKey, {
      x: nextX,
      y: nextY,
      z: nextZ,
      rotX: nextRotX,
      rotY: nextRotY,
      rotZ: nextRotZ,
      scale: nextScale,
    });
  };

  // Tinh chỉnh bước nhỏ (Nudge +/-)
  const handleNudgeCoordinate = (
    key: 'x' | 'y' | 'z' | 'rotX' | 'rotY' | 'rotZ' | 'scale',
    delta: number
  ) => {
    let currentVal = 0;
    if (key === 'x') currentVal = accessoryOffsetX;
    else if (key === 'y') currentVal = accessoryOffsetY;
    else if (key === 'z') currentVal = accessoryOffsetZ;
    else if (key === 'rotX') currentVal = accessoryRotX;
    else if (key === 'rotY') currentVal = accessoryRotY;
    else if (key === 'rotZ') currentVal = accessoryRotZ;
    else if (key === 'scale') currentVal = accessoryScale;

    const precision = (key === 'x' || key === 'y' || key === 'z' || key === 'scale') ? 2 : 0;
    const nextVal = Number((currentVal + delta).toFixed(precision));
    handleUpdateAnchorCoordinate(key, nextVal);
  };

  // 1. LƯU VỊ TRÍ HIỆN TẠI LÀM MẶC ĐỊNH CHO RIÊNG CẶP MODEL NÀY
  const handleSaveCurrentAsDefault = () => {
    const pairKey = getModelPairKey(activeRecord?.fileName, currentGarmentId, accessoryModel?.fileName);
    const garmentLabel = activeRecord?.assignedGarmentLabel || currentGarmentName || 'Áo Tứ Thân';
    const currentData: SleeveAnchorData = {
      x: Number(accessoryOffsetX.toFixed(2)),
      y: Number(accessoryOffsetY.toFixed(2)),
      z: Number(accessoryOffsetZ.toFixed(2)),
      rotX: Number(accessoryRotX.toFixed(0)),
      rotY: Number(accessoryRotY.toFixed(0)),
      rotZ: Number(accessoryRotZ.toFixed(0)),
      scale: Number(accessoryScale.toFixed(2)),
    };
    saveUserCustomPreset(pairKey, currentData, garmentLabel);
    setHasSavedCustomPreset(true);
    setSavedPresetData({
      ...currentData,
      savedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      garmentLabel,
      pairKey,
    });
    setResetFeedbackNotice(
      `✓ Đã lưu vị trí quạt hiện tại làm MẶC ĐỊNH cho riêng ${garmentLabel} + Quạt (X: ${currentData.x}m, Y: ${currentData.y}m, Z: ${currentData.z}m). Khi tải lại quạt hoặc tải lại trang sẽ tự động áp dụng vị trí này!`
    );
    setTimeout(() => setResetFeedbackNotice(null), 5000);
  };

  // 2. ĐƯA QUẠT VỀ VỊ TRÍ BAN ĐẦU (Khôi phục cài đặt gốc của hệ thống)
  const handleResetToInitial = () => {
    const pairKey = getModelPairKey(activeRecord?.fileName, currentGarmentId, accessoryModel?.fileName);
    const defaults = getGarmentDefaultAnchor(currentGarmentId);

    setAccessoryOffsetX(defaults.x);
    setAccessoryOffsetY(defaults.y);
    setAccessoryOffsetZ(defaults.z);
    setAccessoryRotX(defaults.rotX);
    setAccessoryRotY(defaults.rotY);
    setAccessoryRotZ(defaults.rotZ);
    setAccessoryScale(defaults.scale);
    userExplicitlyHiddenRef.current.fan = false;
    setIsAccessoryVisible(true);
    if (accessoryPivotRef.current) accessoryPivotRef.current.visible = true;

    saveSessionAnchor(pairKey, defaults);

    setResetFeedbackNotice(
      `Đã đưa quạt về vị trí ban đầu của hệ thống (X: ${defaults.x}m, Y: ${defaults.y}m, Z: ${defaults.z}m).`
    );
    setTimeout(() => setResetFeedbackNotice(null), 4000);
  };

  // 3. XÓA VỊ TRÍ ĐÃ LƯU (Xóa preset đã lưu cho cặp model này)
  const handleDeleteSavedPreset = () => {
    const pairKey = getModelPairKey(activeRecord?.fileName, currentGarmentId, accessoryModel?.fileName);
    deleteUserCustomPreset(pairKey);
    setHasSavedCustomPreset(false);
    setSavedPresetData(null);

    const defaults = getGarmentDefaultAnchor(currentGarmentId);
    setAccessoryOffsetX(defaults.x);
    setAccessoryOffsetY(defaults.y);
    setAccessoryOffsetZ(defaults.z);
    setAccessoryRotX(defaults.rotX);
    setAccessoryRotY(defaults.rotY);
    setAccessoryRotZ(defaults.rotZ);
    setAccessoryScale(defaults.scale);

    setResetFeedbackNotice(
      `Đã xóa preset mặc định đã lưu cho cặp mô hình này. Quạt đã quay về cài đặt gốc ban đầu.`
    );
    setTimeout(() => setResetFeedbackNotice(null), 4000);
  };

  // -----------------------------------------------------------------
  // HÀM ĐIỀU CHỈNH TỌA ĐỘ VÀ LƯU PRESET CHO NÓN LÁ (hat-non-la.glb)
  // -----------------------------------------------------------------
  const handleUpdateHatCoordinate = (
    key: 'x' | 'y' | 'z' | 'rotX' | 'rotY' | 'rotZ' | 'scale',
    value: number
  ) => {
    if (isNaN(value)) return;
    const nextX = key === 'x' ? value : hatOffsetX;
    const nextY = key === 'y' ? value : hatOffsetY;
    const nextZ = key === 'z' ? value : hatOffsetZ;
    const nextRotX = key === 'rotX' ? value : hatRotX;
    const nextRotY = key === 'rotY' ? value : hatRotY;
    const nextRotZ = key === 'rotZ' ? value : hatRotZ;
    const nextScale = key === 'scale' ? value : hatScale;

    if (key === 'x') setHatOffsetX(value);
    if (key === 'y') setHatOffsetY(value);
    if (key === 'z') setHatOffsetZ(value);
    if (key === 'rotX') setHatRotX(value);
    if (key === 'rotY') setHatRotY(value);
    if (key === 'rotZ') setHatRotZ(value);
    if (key === 'scale') setHatScale(value);

    const pairKey = getHatModelPairKey(activeRecord?.fileName, currentGarmentId, hatModel?.fileName);
    saveSessionHatAnchor(pairKey, {
      x: nextX,
      y: nextY,
      z: nextZ,
      rotX: nextRotX,
      rotY: nextRotY,
      rotZ: nextRotZ,
      scale: nextScale,
    });
  };

  const handleNudgeHatCoordinate = (
    key: 'x' | 'y' | 'z' | 'rotX' | 'rotY' | 'rotZ' | 'scale',
    delta: number
  ) => {
    let currentVal = 0;
    if (key === 'x') currentVal = hatOffsetX;
    else if (key === 'y') currentVal = hatOffsetY;
    else if (key === 'z') currentVal = hatOffsetZ;
    else if (key === 'rotX') currentVal = hatRotX;
    else if (key === 'rotY') currentVal = hatRotY;
    else if (key === 'rotZ') currentVal = hatRotZ;
    else if (key === 'scale') currentVal = hatScale;

    const precision = (key === 'x' || key === 'y' || key === 'z' || key === 'scale') ? 2 : 0;
    const nextVal = Number((currentVal + delta).toFixed(precision));
    handleUpdateHatCoordinate(key, nextVal);
  };

  const handleSaveHatAsDefault = () => {
    const pairKey = getHatModelPairKey(activeRecord?.fileName, currentGarmentId, hatModel?.fileName);
    const garmentLabel = activeRecord?.assignedGarmentLabel || currentGarmentName || 'Áo Tứ Thân';
    const currentData: SleeveAnchorData = {
      x: Number(hatOffsetX.toFixed(2)),
      y: Number(hatOffsetY.toFixed(2)),
      z: Number(hatOffsetZ.toFixed(2)),
      rotX: Number(hatRotX.toFixed(0)),
      rotY: Number(hatRotY.toFixed(0)),
      rotZ: Number(hatRotZ.toFixed(0)),
      scale: Number(hatScale.toFixed(2)),
    };
    saveUserCustomHatPreset(pairKey, currentData, garmentLabel);
    setHasSavedHatCustomPreset(true);
    setSavedHatPresetData({
      ...currentData,
      savedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      garmentLabel,
      pairKey,
    });
    setHatResetFeedbackNotice(
      `✓ Đã lưu vị trí nón lá hiện tại làm MẶC ĐỊNH cho riêng ${garmentLabel} + Nón Lá (X: ${currentData.x}m, Y: ${currentData.y}m, Z: ${currentData.z}m). Khi tải lại nón lá hoặc tải lại trang sẽ tự động áp dụng vị trí này!`
    );
    setTimeout(() => setHatResetFeedbackNotice(null), 5000);
  };
  const handleSaveCurrentHatAsDefault = handleSaveHatAsDefault;

  const handleResetHatToInitial = () => {
    const pairKey = getHatModelPairKey(activeRecord?.fileName, currentGarmentId, hatModel?.fileName);
    const defaults = getGarmentDefaultHatAnchor(currentGarmentId);

    setHatOffsetX(defaults.x);
    setHatOffsetY(defaults.y);
    setHatOffsetZ(defaults.z);
    setHatRotX(defaults.rotX);
    setHatRotY(defaults.rotY);
    setHatRotZ(defaults.rotZ);
    setHatScale(defaults.scale);
    userExplicitlyHiddenRef.current.hat = false;
    setIsHatVisible(true);
    if (hatPivotRef.current) hatPivotRef.current.visible = true;

    saveSessionHatAnchor(pairKey, defaults);

    setHatResetFeedbackNotice(
      `Đã đưa nón lá về vị trí ban đầu của hệ thống (X: ${defaults.x}m, Y: ${defaults.y}m, Z: ${defaults.z}m).`
    );
    setTimeout(() => setHatResetFeedbackNotice(null), 4000);
  };

  const handleDeleteSavedHatPreset = () => {
    const pairKey = getHatModelPairKey(activeRecord?.fileName, currentGarmentId, hatModel?.fileName);
    deleteUserCustomHatPreset(pairKey);
    setHasSavedHatCustomPreset(false);
    setSavedHatPresetData(null);

    const defaults = getGarmentDefaultHatAnchor(currentGarmentId);
    setHatOffsetX(defaults.x);
    setHatOffsetY(defaults.y);
    setHatOffsetZ(defaults.z);
    setHatRotX(defaults.rotX);
    setHatRotY(defaults.rotY);
    setHatRotZ(defaults.rotZ);
    setHatScale(defaults.scale);

    setHatResetFeedbackNotice(
      `Đã xóa preset mặc định đã lưu cho cặp mô hình này. Nón lá đã quay về cài đặt gốc ban đầu.`
    );
    setTimeout(() => setHatResetFeedbackNotice(null), 4000);
  };

  // -----------------------------------------------------------------
  // HÀM ĐIỀU CHỈNH TỌA ĐỘ VÀ LƯU PRESET CHO TÚI CÓI (woven-tote.glb)
  // -----------------------------------------------------------------
  const handleUpdateBagCoordinate = (
    key: 'x' | 'y' | 'z' | 'rotX' | 'rotY' | 'rotZ' | 'scale',
    value: number
  ) => {
    if (isNaN(value)) return;
    const nextX = key === 'x' ? value : bagOffsetX;
    const nextY = key === 'y' ? value : bagOffsetY;
    const nextZ = key === 'z' ? value : bagOffsetZ;
    const nextRotX = key === 'rotX' ? value : bagRotX;
    const nextRotY = key === 'rotY' ? value : bagRotY;
    const nextRotZ = key === 'rotZ' ? value : bagRotZ;
    const nextScale = key === 'scale' ? value : bagScale;

    if (key === 'x') setBagOffsetX(value);
    if (key === 'y') setBagOffsetY(value);
    if (key === 'z') setBagOffsetZ(value);
    if (key === 'rotX') setBagRotX(value);
    if (key === 'rotY') setBagRotY(value);
    if (key === 'rotZ') setBagRotZ(value);
    if (key === 'scale') setBagScale(value);

    const pairKey = getBagModelPairKey(activeRecord?.fileName, currentGarmentId, bagModel?.fileName);
    saveSessionBagAnchor(pairKey, {
      x: nextX,
      y: nextY,
      z: nextZ,
      rotX: nextRotX,
      rotY: nextRotY,
      rotZ: nextRotZ,
      scale: nextScale,
    });
  };

  const handleNudgeBagCoordinate = (
    key: 'x' | 'y' | 'z' | 'rotX' | 'rotY' | 'rotZ' | 'scale',
    delta: number
  ) => {
    let currentVal = 0;
    if (key === 'x') currentVal = bagOffsetX;
    else if (key === 'y') currentVal = bagOffsetY;
    else if (key === 'z') currentVal = bagOffsetZ;
    else if (key === 'rotX') currentVal = bagRotX;
    else if (key === 'rotY') currentVal = bagRotY;
    else if (key === 'rotZ') currentVal = bagRotZ;
    else if (key === 'scale') currentVal = bagScale;

    const precision = (key === 'x' || key === 'y' || key === 'z' || key === 'scale') ? 2 : 0;
    const nextVal = Number((currentVal + delta).toFixed(precision));
    handleUpdateBagCoordinate(key, nextVal);
  };

  const handleSaveBagAsDefault = () => {
    const pairKey = getBagModelPairKey(activeRecord?.fileName, currentGarmentId, bagModel?.fileName);
    const garmentLabel = activeRecord?.assignedGarmentLabel || currentGarmentName || 'Áo Tứ Thân';
    const currentData: SleeveAnchorData = {
      x: Number(bagOffsetX.toFixed(2)),
      y: Number(bagOffsetY.toFixed(2)),
      z: Number(bagOffsetZ.toFixed(2)),
      rotX: Number(bagRotX.toFixed(0)),
      rotY: Number(bagRotY.toFixed(0)),
      rotZ: Number(bagRotZ.toFixed(0)),
      scale: Number(bagScale.toFixed(2)),
    };
    saveUserCustomBagPreset(pairKey, currentData, garmentLabel);
    setHasSavedBagCustomPreset(true);
    setSavedBagPresetData({
      ...currentData,
      savedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      garmentLabel,
      pairKey,
    });
    setBagResetFeedbackNotice(
      `✓ Đã lưu vị trí túi cói hiện tại làm MẶC ĐỊNH cho riêng ${garmentLabel} + Túi Cói (X: ${currentData.x}m, Y: ${currentData.y}m, Z: ${currentData.z}m). Khi tải lại túi hoặc tải lại trang sẽ tự động áp dụng vị trí này!`
    );
    setTimeout(() => setBagResetFeedbackNotice(null), 5000);
  };
  const handleSaveCurrentBagAsDefault = handleSaveBagAsDefault;

  const handleResetBagToInitial = () => {
    const pairKey = getBagModelPairKey(activeRecord?.fileName, currentGarmentId, bagModel?.fileName);
    const defaults = getGarmentDefaultBagAnchor(currentGarmentId);

    setBagOffsetX(defaults.x);
    setBagOffsetY(defaults.y);
    setBagOffsetZ(defaults.z);
    setBagRotX(defaults.rotX);
    setBagRotY(defaults.rotY);
    setBagRotZ(defaults.rotZ);
    setBagScale(defaults.scale);
    userExplicitlyHiddenRef.current.bag = false;
    setIsBagVisible(true);
    if (bagPivotRef.current) bagPivotRef.current.visible = true;

    saveSessionBagAnchor(pairKey, defaults);

    setBagResetFeedbackNotice(
      `Đã đưa túi cói về vị trí ban đầu của hệ thống (X: ${defaults.x}m, Y: ${defaults.y}m, Z: ${defaults.z}m).`
    );
    setTimeout(() => setBagResetFeedbackNotice(null), 4000);
  };

  const handleDeleteSavedBagPreset = () => {
    const pairKey = getBagModelPairKey(activeRecord?.fileName, currentGarmentId, bagModel?.fileName);
    deleteUserCustomBagPreset(pairKey);
    setHasSavedBagCustomPreset(false);
    setSavedBagPresetData(null);

    const defaults = getGarmentDefaultBagAnchor(currentGarmentId);
    setBagOffsetX(defaults.x);
    setBagOffsetY(defaults.y);
    setBagOffsetZ(defaults.z);
    setBagRotX(defaults.rotX);
    setBagRotY(defaults.rotY);
    setBagRotZ(defaults.rotZ);
    setBagScale(defaults.scale);

    setBagResetFeedbackNotice(
      `Đã xóa preset mặc định đã lưu cho cặp mô hình này. Túi cói đã quay về cài đặt gốc ban đầu.`
    );
    setTimeout(() => setBagResetFeedbackNotice(null), 4000);
  };

  // Preset các góc nhìn camera để kiểm tra vị trí quạt, nón lá, túi cói và hai bên tay áo
  const setPresetCameraAngle = (view: 'front' | 'perspective' | 'side' | 'side_left') => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const target = controls.target.clone();
    const currentDist = camera.position.distanceTo(target) || 2.4;

    if (view === 'front') {
      // 1. Góc chính diện: thẳng trục Z
      camera.position.set(target.x, target.y + currentDist * 0.08, target.z + currentDist);
    } else if (view === 'perspective') {
      // 2. Góc nghiêng 45°: nhìn chếch 3/4
      const horiz = currentDist * 0.7071;
      camera.position.set(target.x + horiz, target.y + currentDist * 0.12, target.z + horiz);
    } else if (view === 'side') {
      // 3. Góc ngang 90°: nhìn trực diện từ cạnh sườn phải (nơi có đầu ống tay áo và quạt)
      camera.position.set(target.x + currentDist, target.y + currentDist * 0.08, target.z);
    } else if (view === 'side_left') {
      // 4. Góc ngang -90°: nhìn trực diện từ cạnh sườn trái (nơi xách túi cói)
      camera.position.set(target.x - currentDist, target.y + currentDist * 0.08, target.z);
    }

    camera.lookAt(target);
    controls.update();
  };

  // Helper: calculate smart default accessory position near the right sleeve end
  const computeRightSleeveSuggestedPos = useCallback((garmentGroup: THREE.Group, garmentKey: string) => {
    // 1. Kiểm tra session storage trước (nếu người dùng đã tự chỉnh trong phiên)
    const saved = getSessionAnchor(garmentKey);
    if (saved) {
      return { x: saved.x, y: saved.y, z: saved.z };
    }

    // 2. Với các dòng áo có cấu hình chuẩn riêng biệt (đặc biệt là Áo Tứ Thân tu-than-color.glb x Quạt):
    // Ưu tiên tuyệt đối bộ tọa độ đã được tinh chỉnh chuyên biệt theo từng phom dáng áo
    if (DEDICATED_GARMENT_FAN_CONFIGS[garmentKey]) {
      const def = DEDICATED_GARMENT_FAN_CONFIGS[garmentKey];
      return { x: def.x, y: def.y, z: def.z };
    }

    // 3. Nếu là tệp tùy biến / chưa có trong danh mục: Thử quét phân tích đỉnh (vertex analysis)
    const detected = detectRightSleeveEnd(garmentGroup);
    if (detected && detected.x >= 0.28 && detected.x <= 0.65 && detected.y >= -0.15 && detected.y <= 0.35) {
      return {
        x: Number((detected.x + 0.04).toFixed(2)),
        y: detected.y,
        z: Number((detected.z + 0.16).toFixed(2)), // Đẩy ra phía trước mặt vải
      };
    }

    // 4. Dự phòng cấu hình mặc định
    const def = getGarmentDefaultAnchor(garmentKey);
    return { x: def.x, y: def.y, z: def.z };
  }, []);

  // Dispose all meshes, geometries, and materials safely
  const disposeGroup = useCallback((group: THREE.Group | null) => {
    if (!group) return;
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => {
              mat.dispose();
              for (const key of Object.keys(mat)) {
                const val = (mat as unknown as Record<string, unknown>)[key];
                if (val && typeof val === 'object' && val !== null && 'isTexture' in val) {
                  (val as THREE.Texture).dispose();
                }
              }
            });
          } else {
            mesh.material.dispose();
            for (const key of Object.keys(mesh.material)) {
              const val = (mesh.material as unknown as Record<string, unknown>)[key];
              if (val && typeof val === 'object' && val !== null && 'isTexture' in val) {
                (val as THREE.Texture).dispose();
              }
            }
          }
        }
      }
    });
  }, []);

  const disposeCurrentGarment = useCallback(() => {
    if (garmentGroupRef.current && sceneRef.current) {
      disposeGroup(garmentGroupRef.current);
      sceneRef.current.remove(garmentGroupRef.current);
      garmentGroupRef.current = null;
    }
    currentLoadedGarmentIdRef.current = null;
    setActiveGarmentInScene(null);
  }, [disposeGroup]);

  const disposeCurrentAccessory = useCallback(() => {
    if (accessoryPivotRef.current && sceneRef.current) {
      disposeGroup(accessoryPivotRef.current);
      sceneRef.current.remove(accessoryPivotRef.current);
      accessoryPivotRef.current = null;
      accessoryRotatorRef.current = null;
      accessoryInnerModelRef.current = null;
    }
    currentLoadedAccessoryIdRef.current = null;
    setIsFanInScene(false);
  }, [disposeGroup]);

  const disposeCurrentHat = useCallback(() => {
    if (hatPivotRef.current && sceneRef.current) {
      disposeGroup(hatPivotRef.current);
      sceneRef.current.remove(hatPivotRef.current);
      hatPivotRef.current = null;
      hatRotatorRef.current = null;
      hatInnerModelRef.current = null;
    }
    currentLoadedHatIdRef.current = null;
    setIsHatInScene(false);
  }, [disposeGroup]);

  const disposeCurrentBag = useCallback(() => {
    if (bagPivotRef.current && sceneRef.current) {
      disposeGroup(bagPivotRef.current);
      sceneRef.current.remove(bagPivotRef.current);
      bagPivotRef.current = null;
      bagRotatorRef.current = null;
      bagInnerModelRef.current = null;
    }
    currentLoadedBagIdRef.current = null;
    setIsBagInScene(false);
  }, [disposeGroup]);

  // Recalculate camera framing to encompass garment, fan accessory, hat, and bag comfortably
  const updateCameraFraming = useCallback(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!scene || !camera || !controls) return;

    const combinedBox = new THREE.Box3();
    let hasObjects = false;

    if (garmentGroupRef.current && scene.children.includes(garmentGroupRef.current)) {
      combinedBox.expandByObject(garmentGroupRef.current);
      hasObjects = true;
    }

    if (accessoryPivotRef.current && isAccessoryVisible && scene.children.includes(accessoryPivotRef.current)) {
      combinedBox.expandByObject(accessoryPivotRef.current);
      hasObjects = true;
    }

    if (hatPivotRef.current && isHatVisible && scene.children.includes(hatPivotRef.current)) {
      combinedBox.expandByObject(hatPivotRef.current);
      hasObjects = true;
    }

    if (bagPivotRef.current && isBagVisible && scene.children.includes(bagPivotRef.current)) {
      combinedBox.expandByObject(bagPivotRef.current);
      hasObjects = true;
    }

    if (!hasObjects) return;

    const center = combinedBox.getCenter(new THREE.Vector3());
    const size = combinedBox.getSize(new THREE.Vector3());
    const sphere = combinedBox.getBoundingSphere(new THREE.Sphere());
    const radius = Math.max(sphere.radius, size.length() / 2, 0.6);

    const fov = camera.fov * (Math.PI / 180);
    let distance = radius / Math.sin(fov / 2);
    distance = Math.max(distance * 1.25, 1.3);

    // Frame camera with subtle eye-level elevate
    camera.position.set(center.x, center.y + radius * 0.12, center.z + distance);
    camera.lookAt(center.x, center.y, center.z);
    camera.near = Math.max(distance / 50, 0.05);
    camera.far = Math.max(distance * 50, 100);
    camera.updateProjectionMatrix();

    controls.target.copy(center);
    controls.minDistance = Math.max(radius * 0.25, 0.2);
    controls.maxDistance = distance * 5;
    controls.update();

    initialViewRef.current = {
      cameraPos: camera.position.clone(),
      target: controls.target.clone(),
    };
  }, [isAccessoryVisible, isHatVisible, isBagVisible]);

  // Update accessory position, rotation, scale, visibility in realtime WITHOUT loading again
  useEffect(() => {
    if (accessoryPivotRef.current) {
      accessoryPivotRef.current.position.set(accessoryOffsetX, accessoryOffsetY, accessoryOffsetZ);
      accessoryPivotRef.current.scale.set(accessoryScale, accessoryScale, accessoryScale);
      accessoryPivotRef.current.visible = isAccessoryVisible;
    }
    if (accessoryRotatorRef.current) {
      accessoryRotatorRef.current.rotation.x = THREE.MathUtils.degToRad(accessoryRotX);
      accessoryRotatorRef.current.rotation.y = THREE.MathUtils.degToRad(accessoryRotY);
      accessoryRotatorRef.current.rotation.z = THREE.MathUtils.degToRad(accessoryRotZ);
    }
  }, [accessoryOffsetX, accessoryOffsetY, accessoryOffsetZ, accessoryRotX, accessoryRotY, accessoryRotZ, accessoryScale, isAccessoryVisible]);

  // Update hat position, rotation, scale, visibility in realtime WITHOUT loading again
  useEffect(() => {
    if (hatPivotRef.current) {
      hatPivotRef.current.position.set(hatOffsetX, hatOffsetY, hatOffsetZ);
      hatPivotRef.current.scale.set(hatScale, hatScale, hatScale);
      hatPivotRef.current.visible = isHatVisible;
    }
    if (hatRotatorRef.current) {
      hatRotatorRef.current.rotation.x = THREE.MathUtils.degToRad(hatRotX);
      hatRotatorRef.current.rotation.y = THREE.MathUtils.degToRad(hatRotY);
      hatRotatorRef.current.rotation.z = THREE.MathUtils.degToRad(hatRotZ);
    }
  }, [hatOffsetX, hatOffsetY, hatOffsetZ, hatRotX, hatRotY, hatRotZ, hatScale, isHatVisible]);

  // Update bag position, rotation, scale, visibility in realtime WITHOUT loading again
  useEffect(() => {
    if (bagPivotRef.current) {
      bagPivotRef.current.position.set(bagOffsetX, bagOffsetY, bagOffsetZ);
      bagPivotRef.current.scale.set(bagScale, bagScale, bagScale);
      bagPivotRef.current.visible = isBagVisible;
    }
    if (bagRotatorRef.current) {
      bagRotatorRef.current.rotation.x = THREE.MathUtils.degToRad(bagRotX);
      bagRotatorRef.current.rotation.y = THREE.MathUtils.degToRad(bagRotY);
      bagRotatorRef.current.rotation.z = THREE.MathUtils.degToRad(bagRotZ);
    }
  }, [bagOffsetX, bagOffsetY, bagOffsetZ, bagRotX, bagRotY, bagRotZ, bagScale, isBagVisible]);

  // Cập nhật vị trí và hiển thị điểm neo 3D (Anchor Helper) theo thời gian thực
  useEffect(() => {
    if (anchorHelperRef.current) {
      anchorHelperRef.current.position.set(accessoryOffsetX, accessoryOffsetY, accessoryOffsetZ);
      anchorHelperRef.current.visible = showAnchorHelper;
    }
  }, [accessoryOffsetX, accessoryOffsetY, accessoryOffsetZ, showAnchorHelper]);

  // Update GridHelper visibility
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

  // Reset accessory và điểm neo về tọa độ chuẩn ống tay áo
  const handleResetAccessoryToSuggested = () => {
    const garmentKey = activeRecord?.assignedGarmentId || currentGarmentId || 'ao-tu-than';
    const defaults = getGarmentDefaultAnchor(garmentKey);

    setAccessoryOffsetX(defaults.x);
    setAccessoryOffsetY(defaults.y);
    setAccessoryOffsetZ(defaults.z);
    setAccessoryRotX(defaults.rotX);
    setAccessoryRotY(defaults.rotY);
    setAccessoryRotZ(defaults.rotZ);
    setAccessoryScale(defaults.scale);
    setIsAccessoryVisible(true);

    saveSessionAnchor(garmentKey, defaults);

    setResetFeedbackNotice(
      garmentKey === 'ao-tu-than'
        ? `Đã khôi phục điểm neo chuẩn ống tay áo tứ thân (X: ${defaults.x}m, Y: ${defaults.y}m, Z: ${defaults.z}m)`
        : 'Đã khôi phục điểm neo chuẩn về vị trí ống tay áo mặc định!'
    );
    setTimeout(() => setResetFeedbackNotice(null), 3500);
  };

  // Initialize Three.js Scene, Camera, Renderer, Controls (Runs ONCE on mount)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 500;

    // 1. Scene with soft warm heritage cream background
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf6f3ed);
    sceneRef.current = scene;

    // 2. Perspective Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 3);
    cameraRef.current = camera;

    // 3. WebGL Renderer with High DPI and Color Management
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    container.replaceChildren(renderer.domElement);

    // 4. Balanced 3-Point Studio Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xfffbf0, 1.4);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xdcd6cd, 0.8);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.0);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xedd9c0, 1.2);
    fillLight.position.set(-3, 3, -2);
    scene.add(fillLight);

    const frontLight = new THREE.DirectionalLight(0xffffff, 0.8);
    frontLight.position.set(0, 1, 4);
    scene.add(frontLight);

    // Grid Helper (Ẩn mặc định)
    const grid = new THREE.GridHelper(10, 20, 0xd4cdc5, 0xe5dfd7);
    grid.position.y = -1.2;
    grid.visible = false;
    gridHelperRef.current = grid;
    scene.add(grid);

    // Anchor Helper 3D Marker (Ẩn mặc định, bật khi cần căn thử)
    const anchorGroup = new THREE.Group();
    anchorGroup.name = 'sleeveAnchorHelper';

    const sphereGeo = new THREE.SphereGeometry(0.016, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x1B4D3E });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    anchorGroup.add(sphereMesh);

    const ringGeo = new THREE.RingGeometry(0.024, 0.032, 28);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xD4A054, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.name = 'anchorRing';
    anchorGroup.add(ringMesh);

    const axesHelper = new THREE.AxesHelper(0.06);
    anchorGroup.add(axesHelper);

    anchorGroup.position.set(accessoryOffsetX, accessoryOffsetY, accessoryOffsetZ);
    anchorGroup.visible = false;
    scene.add(anchorGroup);
    anchorHelperRef.current = anchorGroup;

    // 5. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI * 0.95;
    controls.minPolarAngle = 0.05;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 2.0;
    controlsRef.current = controls;

    // 6. Animation / Render Loop
    let isRunning = true;
    const animate = () => {
      if (!isRunning) return;
      controls.update();

      if (anchorHelperRef.current && anchorHelperRef.current.visible) {
        const ring = anchorHelperRef.current.getObjectByName('anchorRing');
        if (ring) {
          ring.rotation.z += 0.015;
        }
      }

      renderer.render(scene, camera);
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Đánh dấu khung cảnh 3D đã sẵn sàng gắn kết các mô hình vào không gian WebGL
    setIsSceneReady(true);
    setSceneVersion((v) => v + 1);

    // 7. Responsive Resize Observer
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth === 0 || newHeight === 0) return;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup on unmount
    return () => {
      isRunning = false;
      resizeObserver.disconnect();

      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }

      controls.dispose();
      disposeCurrentGarment();
      disposeCurrentAccessory();
      disposeCurrentHat();
      disposeCurrentBag();

      if (anchorHelperRef.current && sceneRef.current) {
        sceneRef.current.remove(anchorHelperRef.current);
        anchorHelperRef.current = null;
      }

      renderer.dispose();

      if (container && renderer.domElement) {
        renderer.domElement.remove();
      }

      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
      currentLoadedGarmentIdRef.current = null;
      currentLoadedAccessoryIdRef.current = null;
      currentLoadedHatIdRef.current = null;
      currentLoadedBagIdRef.current = null;
      setActiveGarmentInScene(null);
      setIsFanInScene(false);
      setIsHatInScene(false);
      setIsBagInScene(false);
      setIsSceneReady(false);
    };
  }, [disposeCurrentGarment, disposeCurrentAccessory, disposeCurrentHat, disposeCurrentBag]);

  // Handle auto-rotation
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotating;
      controlsRef.current.autoRotateSpeed = 2.0;
    }
  }, [isAutoRotating]);

  // ==========================================
  // EFFECT 1: LOAD ACTIVE GARMENT MODEL
  // ==========================================
  useEffect(() => {
    const scene = sceneRef.current;
    if (!isSceneReady || !scene) {
      return;
    }

    if (!activeModelId) {
      if (currentLoadedGarmentIdRef.current !== null) {
        disposeCurrentGarment();
      }
      setViewerStatus((accessoryModelRef.current || hatModelRef.current || bagModelRef.current) ? 'ready' : 'idle');
      return;
    }

    // Kiểm tra xem mô hình áo này đã thực sự được gắn vào khung cảnh 3D hiện tại chưa
    if (
      currentLoadedGarmentIdRef.current === activeModelId &&
      garmentGroupRef.current &&
      scene.children.includes(garmentGroupRef.current)
    ) {
      return;
    }

    const targetRecord = loadedModelsRef.current.find((m) => m.id === activeModelId);
    if (!targetRecord) {
      return;
    }

    let isCancelled = false;
    const thisGeneration = ++garmentLoadGenRef.current;

    setErrorMessage(null);
    setViewerStatus('loading');
    setLoadingProgress(0);

    const loadGarmentAsync = async () => {
      let objectUrl: string | null = null;
      let shouldRevoke = false;

      try {
        if (targetRecord.file) {
          const fileNameLower = targetRecord.fileName.toLowerCase();
          if (!fileNameLower.endsWith('.glb')) {
            throw new Error(`Định dạng tệp ${targetRecord.fileName} không được hỗ trợ. Trình xem chỉ tiếp nhận tệp chuẩn Binary glTF 2.0 (.glb).`);
          }
          if (targetRecord.file.size > MAX_FILE_SIZE_BYTES) {
            const sizeMb = (targetRecord.file.size / (1024 * 1024)).toFixed(1);
            throw new Error(`Kích thước tệp ${targetRecord.fileName} (${sizeMb} MB) vượt quá giới hạn an toàn 50 MB.`);
          }
          objectUrl = URL.createObjectURL(targetRecord.file);
          shouldRevoke = true;
        } else if (targetRecord.url) {
          objectUrl = await fetchModelBlobUrl(targetRecord.url);
          shouldRevoke = true;
        } else {
          throw new Error(`Không tìm thấy nguồn tệp cho mô hình ${targetRecord.fileName}`);
        }

        if (isCancelled || garmentLoadGenRef.current !== thisGeneration) {
          if (shouldRevoke && objectUrl) URL.revokeObjectURL(objectUrl);
          return;
        }

        const loader = new GLTFLoader();

        loader.load(
          objectUrl,
          (gltf) => {
            if (shouldRevoke && objectUrl) URL.revokeObjectURL(objectUrl);

            if (isCancelled || garmentLoadGenRef.current !== thisGeneration) {
              disposeGroup(gltf.scene);
              return;
            }

            const activeScene = sceneRef.current;
            if (!activeScene) {
              setViewerStatus('idle');
              return;
            }

            disposeCurrentGarment();

            const model = gltf.scene;
            garmentGroupRef.current = model;

            // 1. Calculate bounding box and center model at origin (0, 0, 0)
            const rawBox = new THREE.Box3().setFromObject(model);
            const center = rawBox.getCenter(new THREE.Vector3());
            const size = rawBox.getSize(new THREE.Vector3());

            // Recenter model so its geometric center is at (0, 0, 0)
            model.position.x -= center.x;
            model.position.y -= center.y;
            model.position.z -= center.z;

            // Position ground grid just below the model base
            if (gridHelperRef.current) {
              gridHelperRef.current.position.y = -(size.y / 2) - 0.02;
            }

            const dimensions = {
              width: Number(size.x.toFixed(2)),
              height: Number(size.y.toFixed(2)),
              depth: Number(size.z.toFixed(2)),
            };

            // Add garment to scene
            activeScene.add(model);
            model.updateMatrixWorld(true);

            // 2. Xác định điểm neo cho phụ kiện quạt
            const garmentKey = targetRecord.assignedGarmentId || currentGarmentId || 'ao-tu-than';
            const pairKey = getModelPairKey(targetRecord.fileName, garmentKey, accessoryModelRef.current?.fileName);
            const userPreset = getUserSavedPreset(pairKey);
            const currentSaved = getSessionAnchor(pairKey);
            const smartPos = computeRightSleeveSuggestedPos(model, garmentKey);
            setSuggestedAccessoryPos(smartPos);

            const targetAnchor = userPreset || currentSaved;
            if (targetAnchor) {
              setAccessoryOffsetX(targetAnchor.x);
              setAccessoryOffsetY(targetAnchor.y);
              setAccessoryOffsetZ(targetAnchor.z);
              setAccessoryRotX(targetAnchor.rotX);
              setAccessoryRotY(targetAnchor.rotY);
              setAccessoryRotZ(targetAnchor.rotZ);
              setAccessoryScale(targetAnchor.scale);
            } else {
              setAccessoryOffsetX(smartPos.x);
              setAccessoryOffsetY(smartPos.y);
              setAccessoryOffsetZ(smartPos.z);
              const def = getGarmentDefaultAnchor(garmentKey);
              setAccessoryRotX(def.rotX);
              setAccessoryRotY(def.rotY);
              setAccessoryRotZ(def.rotZ);
              setAccessoryScale(def.scale);
            }

            if (userPreset) {
              setHasSavedCustomPreset(true);
              setSavedPresetData(userPreset);
            } else {
              setHasSavedCustomPreset(false);
              setSavedPresetData(null);
            }

            currentLoadedGarmentIdRef.current = targetRecord.id;
            setActiveGarmentInScene(targetRecord.fileName);
            setViewerStatus('ready');
            setLoadingProgress(100);

            setLoadedModels((prev) =>
              prev.map((m) => (m.id === targetRecord.id ? { ...m, dimensions } : m))
            );

            updateCameraFraming();
            onModelLoadedRef.current?.(targetRecord.fileName, targetRecord.assignedGarmentId);
          },
          (progress) => {
            if (isCancelled || garmentLoadGenRef.current !== thisGeneration) return;
            if (progress.total > 0) {
              const percent = Math.round((progress.loaded / progress.total) * 100);
              setLoadingProgress(percent);
            }
          },
          (error) => {
            if (shouldRevoke && objectUrl) URL.revokeObjectURL(objectUrl);
            if (isCancelled || garmentLoadGenRef.current !== thisGeneration) return;
            console.error('Lỗi giải mã mô hình áo GLB:', error);
            const errText = `Không thể giải mã mô hình áo ${targetRecord.fileName}. Vui lòng thử lại hoặc nạp tệp thay thế.`;
            setErrorMessage(errText);
            setViewerStatus('error');
            currentLoadedGarmentIdRef.current = null;
            setActiveGarmentInScene(null);
            onModelErrorRef.current?.(errText);
          }
        );
      } catch (err: any) {
        if (isCancelled || garmentLoadGenRef.current !== thisGeneration) return;
        console.error('Lỗi nạp tệp mô hình áo:', err);
        const errText = `Lỗi tải tệp mô hình áo ${targetRecord.fileName}: ${err.message || 'Không tìm thấy tệp'}`;
        setErrorMessage(errText);
        setViewerStatus('error');
        currentLoadedGarmentIdRef.current = null;
        setActiveGarmentInScene(null);
        onModelErrorRef.current?.(errText);
      }
    };

    loadGarmentAsync();

    return () => {
      isCancelled = true;
    };
  }, [activeModelId, isSceneReady, sceneVersion, retryTrigger]);

  // ==========================================
  // EFFECT 2: LOAD ACCESSORY MODEL (QUẠT RIÊNG BIỆT - KHÔNG TẢI LẠI ÁO)
  // ==========================================
  useEffect(() => {
    const scene = sceneRef.current;
    if (!isSceneReady || !scene) {
      return;
    }

    if (!accessoryModel) {
      if (currentLoadedAccessoryIdRef.current !== null) {
        disposeCurrentAccessory();
        updateCameraFraming();
      }
      return;
    }

    // Kiểm tra xem quạt đã thực sự có trong khung cảnh 3D hiện tại chưa
    if (
      currentLoadedAccessoryIdRef.current === accessoryModel.id &&
      accessoryPivotRef.current &&
      scene.children.includes(accessoryPivotRef.current)
    ) {
      return;
    }

    const thisAccessoryGen = ++accessoryLoadGenRef.current;
    setIsAccessoryLoading(true);
    setAccessoryLoadingProgress(0);
    setAccessoryError(null);

    const fanUrl = accessoryModel.file
      ? URL.createObjectURL(accessoryModel.file)
      : (accessoryModel.url ? resolveModelUrl(accessoryModel.url) : null);

    if (!fanUrl) {
      setIsAccessoryLoading(false);
      return;
    }
    const isObjectUrl = !accessoryModel.url && !!accessoryModel.file;

    const fileNameLower = accessoryModel.fileName.toLowerCase();
    if (!fileNameLower.endsWith('.glb')) {
      if (isObjectUrl) URL.revokeObjectURL(fanUrl);
      setAccessoryError(`Tệp phụ kiện ${accessoryModel.fileName} phải có định dạng .glb.`);
      setIsAccessoryLoading(false);
      return;
    }

    disposeCurrentAccessory();

    const loader = new GLTFLoader();

    loader.load(
      fanUrl,
      (gltf) => {
        if (isObjectUrl) URL.revokeObjectURL(fanUrl);

        if (accessoryLoadGenRef.current !== thisAccessoryGen) {
          disposeGroup(gltf.scene);
          return;
        }

        const activeScene = sceneRef.current;
        if (!activeScene) {
          setIsAccessoryLoading(false);
          return;
        }

        const fanModel = gltf.scene;
        accessoryInnerModelRef.current = fanModel;

        // Bounding box of accessory
        const rawBox = new THREE.Box3().setFromObject(fanModel);
        const center = rawBox.getCenter(new THREE.Vector3());
        const size = rawBox.getSize(new THREE.Vector3());

        // Center geometry internally:
        fanModel.position.x = -center.x;
        fanModel.position.y = -rawBox.min.y;
        fanModel.position.z = -center.z;
        fanModel.rotation.set(0, 0, 0);

        fanModel.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            m.renderOrder = 10;
            if (m.material) {
              const mats = Array.isArray(m.material) ? m.material : [m.material];
              mats.forEach((mat) => {
                mat.depthTest = true;
                mat.depthWrite = true;
              });
            }
          }
        });

        // Lấy tọa độ từ preset đã lưu của người dùng cho cặp model này, hoặc session, hoặc mặc định
        const pairKey = getModelPairKey(activeRecord?.fileName, currentGarmentId, accessoryModel.fileName);
        const userPreset = getUserSavedPreset(pairKey);
        const currentSaved = getSessionAnchor(pairKey);
        const targetAnchor = userPreset || currentSaved || getGarmentDefaultAnchor(currentGarmentId);

        setAccessoryOffsetX(targetAnchor.x);
        setAccessoryOffsetY(targetAnchor.y);
        setAccessoryOffsetZ(targetAnchor.z);
        setAccessoryRotX(targetAnchor.rotX);
        setAccessoryRotY(targetAnchor.rotY);
        setAccessoryRotZ(targetAnchor.rotZ);
        setAccessoryScale(targetAnchor.scale);

        if (userPreset) {
          setHasSavedCustomPreset(true);
          setSavedPresetData(userPreset);
        } else {
          setHasSavedCustomPreset(false);
          setSavedPresetData(null);
        }

        // Middle Rotator Group (pivot xoay chuẩn tại gốc cán quạt)
        const rotator = new THREE.Group();
        rotator.name = 'fanRotatorGroup';
        rotator.rotation.x = THREE.MathUtils.degToRad(targetAnchor.rotX);
        rotator.rotation.y = THREE.MathUtils.degToRad(targetAnchor.rotY);
        rotator.rotation.z = THREE.MathUtils.degToRad(targetAnchor.rotZ);
        rotator.add(fanModel);
        accessoryRotatorRef.current = rotator;

        // Outer positioning pivot group
        const pivot = new THREE.Group();
        pivot.name = 'fanPivotGroup';
        pivot.add(rotator);

        pivot.position.set(targetAnchor.x, targetAnchor.y, targetAnchor.z);
        pivot.scale.set(targetAnchor.scale, targetAnchor.scale, targetAnchor.scale);
        const shouldFanBeVisible = userExplicitlyHiddenRef.current.fan === true ? false : true;
        pivot.visible = shouldFanBeVisible;
        setIsAccessoryVisible(shouldFanBeVisible);

        accessoryPivotRef.current = pivot;
        activeScene.add(pivot);

        const dimensions = {
          width: Number(size.x.toFixed(2)),
          height: Number(size.y.toFixed(2)),
          depth: Number(size.z.toFixed(2)),
        };

        setAccessoryModel((prev) => (prev ? { ...prev, dimensions } : null));

        currentLoadedAccessoryIdRef.current = accessoryModel.id;
        setIsFanInScene(true);
        setIsAccessoryLoading(false);
        setAccessoryLoadingProgress(100);

        updateCameraFraming();
      },
      (progress) => {
        if (accessoryLoadGenRef.current !== thisAccessoryGen) return;
        if (progress.total > 0) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          setAccessoryLoadingProgress(percent);
        }
      },
      (error) => {
        if (isObjectUrl) URL.revokeObjectURL(fanUrl);
        if (accessoryLoadGenRef.current !== thisAccessoryGen) return;
        console.error('Lỗi nạp mô hình phụ kiện GLB:', error);
        setAccessoryError(`Không thể nạp tệp quạt ${accessoryModel.fileName}.`);
        setIsAccessoryLoading(false);
        currentLoadedAccessoryIdRef.current = null;
        setIsFanInScene(false);
      }
    );
  }, [accessoryModel?.id, accessoryModel?.url, isSceneReady, sceneVersion, retryTrigger]);

  // ==========================================
  // EFFECT 3: LOAD HAT MODEL (NÓN LÁ RIÊNG BIỆT - KHÔNG TẢI LẠI ÁO HAY QUẠT)
  // ==========================================
  useEffect(() => {
    if (!hatModel) {
      if (currentLoadedHatIdRef.current !== null) {
        disposeCurrentHat();
        currentLoadedHatIdRef.current = null;
        updateCameraFraming();
      }
      return;
    }

    if (currentLoadedHatIdRef.current === hatModel.id) {
      return;
    }

    const thisHatGen = ++hatLoadGenRef.current;
    setIsHatLoading(true);
    setHatLoadingProgress(0);
    setHatError(null);

    const hatUrl = hatModel.url || (hatModel.file ? URL.createObjectURL(hatModel.file) : null);
    if (!hatUrl) {
      setIsHatLoading(false);
      return;
    }
    const isObjectUrl = !hatModel.url && !!hatModel.file;

    const fileNameLower = hatModel.fileName.toLowerCase();
    if (!fileNameLower.endsWith('.glb')) {
      if (isObjectUrl) URL.revokeObjectURL(hatUrl);
      setHatError('Tệp nón lá phải có định dạng .glb.');
      setIsHatLoading(false);
      return;
    }

    disposeCurrentHat();

    const loader = new GLTFLoader();

    loader.load(
      hatUrl,
      (gltf) => {
        if (isObjectUrl) URL.revokeObjectURL(hatUrl);

        if (hatLoadGenRef.current !== thisHatGen) {
          disposeGroup(gltf.scene);
          return;
        }

        const scene = sceneRef.current;
        if (!scene) {
          setIsHatLoading(false);
          return;
        }

        const hatScene = gltf.scene;
        hatInnerModelRef.current = hatScene;

        // Bounding box of hat
        const rawBox = new THREE.Box3().setFromObject(hatScene);
        const center = rawBox.getCenter(new THREE.Vector3());
        const size = rawBox.getSize(new THREE.Vector3());

        // Đặt điểm xoay (pivot) tại đáy vành nón (rawBox.min.y) và tâm x, z
        hatScene.position.x = -center.x;
        hatScene.position.y = -rawBox.min.y;
        hatScene.position.z = -center.z;
        hatScene.rotation.set(0, 0, 0);

        // Đảm bảo phụ kiện nón lá render rõ nét
        hatScene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            m.renderOrder = 10;
            if (m.material) {
              const mats = Array.isArray(m.material) ? m.material : [m.material];
              mats.forEach((mat) => {
                mat.depthTest = true;
                mat.depthWrite = true;
              });
            }
          }
        });

        // Lấy tọa độ từ preset đã lưu của người dùng cho cặp model này, hoặc session, hoặc mặc định
        const pairKey = getHatModelPairKey(activeRecord?.fileName, currentGarmentId, hatModel.fileName);
        const userPreset = getUserSavedHatPreset(pairKey);
        const currentSaved = getSessionHatAnchor(pairKey);
        const targetAnchor = userPreset || currentSaved || getGarmentDefaultHatAnchor(currentGarmentId);

        setHatOffsetX(targetAnchor.x);
        setHatOffsetY(targetAnchor.y);
        setHatOffsetZ(targetAnchor.z);
        setHatRotX(targetAnchor.rotX);
        setHatRotY(targetAnchor.rotY);
        setHatRotZ(targetAnchor.rotZ);
        setHatScale(targetAnchor.scale);

        if (userPreset) {
          setHasSavedHatCustomPreset(true);
          setSavedHatPresetData(userPreset);
        } else {
          setHasSavedHatCustomPreset(false);
          setSavedHatPresetData(null);
        }

        // Middle Rotator Group (pivot xoay tại gốc vành nón)
        const rotator = new THREE.Group();
        rotator.name = 'hatRotatorGroup';
        rotator.rotation.x = THREE.MathUtils.degToRad(targetAnchor.rotX);
        rotator.rotation.y = THREE.MathUtils.degToRad(targetAnchor.rotY);
        rotator.rotation.z = THREE.MathUtils.degToRad(targetAnchor.rotZ);
        rotator.add(hatScene);
        hatRotatorRef.current = rotator;

        // Outer positioning pivot group
        const pivot = new THREE.Group();
        pivot.name = 'hatPivotGroup';
        pivot.add(rotator);

        pivot.position.set(targetAnchor.x, targetAnchor.y, targetAnchor.z);
        pivot.scale.set(targetAnchor.scale, targetAnchor.scale, targetAnchor.scale);
        const shouldHatBeVisible = userExplicitlyHiddenRef.current.hat === true ? false : true;
        pivot.visible = shouldHatBeVisible;
        setIsHatVisible(shouldHatBeVisible);

        hatPivotRef.current = pivot;
        scene.add(pivot);

        const dimensions = {
          width: Number(size.x.toFixed(2)),
          height: Number(size.y.toFixed(2)),
          depth: Number(size.z.toFixed(2)),
        };

        setHatModel((prev) => (prev ? { ...prev, dimensions } : null));

        currentLoadedHatIdRef.current = hatModel.id;
        setIsHatLoading(false);
        setHatLoadingProgress(100);

        updateCameraFraming();
      },
      (progress) => {
        if (hatLoadGenRef.current !== thisHatGen) return;
        if (progress.total > 0) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          setHatLoadingProgress(percent);
        }
      },
      (error) => {
        if (isObjectUrl) URL.revokeObjectURL(hatUrl);
        if (hatLoadGenRef.current !== thisHatGen) return;
        console.error('Lỗi nạp mô hình nón lá GLB:', error);
        setHatError(
          'Không thể giải mã tệp nón lá. Vui lòng kiểm tra lại định dạng tệp .glb hoặc dung lượng.'
        );
        setIsHatLoading(false);
        currentLoadedHatIdRef.current = null;
      }
    );
  }, [hatModel?.id, hatModel?.url, retryTrigger]);

  // ==========================================
  // EFFECT 4: LOAD BAG MODEL (TÚI CÓI RIÊNG BIỆT - KHÔNG TẢI LẠI ÁO, QUẠT HAY NÓN LÁ)
  // ==========================================
  useEffect(() => {
    if (!bagModel) {
      if (currentLoadedBagIdRef.current !== null) {
        disposeCurrentBag();
        currentLoadedBagIdRef.current = null;
        updateCameraFraming();
      }
      return;
    }

    if (currentLoadedBagIdRef.current === bagModel.id) {
      return;
    }

    const thisBagGen = ++bagLoadGenRef.current;
    setIsBagLoading(true);
    setBagLoadingProgress(0);
    setBagError(null);

    const bagUrl = bagModel.url || (bagModel.file ? URL.createObjectURL(bagModel.file) : null);
    if (!bagUrl) {
      setIsBagLoading(false);
      return;
    }
    const isObjectUrl = !bagModel.url && !!bagModel.file;

    const fileNameLower = bagModel.fileName.toLowerCase();
    if (!fileNameLower.endsWith('.glb')) {
      if (isObjectUrl) URL.revokeObjectURL(bagUrl);
      setBagError('Tệp túi cói phải có định dạng .glb.');
      setIsBagLoading(false);
      return;
    }

    disposeCurrentBag();

    const loader = new GLTFLoader();

    loader.load(
      bagUrl,
      (gltf) => {
        if (isObjectUrl) URL.revokeObjectURL(bagUrl);

        if (bagLoadGenRef.current !== thisBagGen) {
          disposeGroup(gltf.scene);
          return;
        }

        const scene = sceneRef.current;
        if (!scene) {
          setIsBagLoading(false);
          return;
        }

        const bagScene = gltf.scene;
        bagInnerModelRef.current = bagScene;

        // Bounding box of bag
        const rawBox = new THREE.Box3().setFromObject(bagScene);
        const center = rawBox.getCenter(new THREE.Vector3());
        const size = rawBox.getSize(new THREE.Vector3());

        // Đặt điểm xoay (pivot) tại đỉnh quai xách của túi (rawBox.max.y)
        // Nhờ vậy khi đặt vào vị trí miệng ống tay áo trái (y ~ 0.18m), quai túi sẽ nằm ngay bàn tay/ống tay,
        // và phần thân túi sẽ rủ tự nhiên hướng xuống dưới (theo trục -Y), không bị lộn ngược hay lơ lửng!
        bagScene.position.x = -center.x;
        bagScene.position.y = -rawBox.max.y; // Đỉnh quai xách làm gốc tọa độ
        bagScene.position.z = -center.z;
        bagScene.rotation.set(0, 0, 0);

        // Giữ nguyên toàn bộ màu sắc, chất liệu và texture gốc của tệp mô hình túi cói
        // Đảm bảo depthTest / depthWrite / renderOrder để hiển thị rõ nét bên cạnh tà áo
        bagScene.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const m = child as THREE.Mesh;
            m.renderOrder = 10;
            if (m.material) {
              const mats = Array.isArray(m.material) ? m.material : [m.material];
              mats.forEach((mat) => {
                mat.depthTest = true;
                mat.depthWrite = true;
              });
            }
          }
        });

        // Lấy tọa độ từ preset đã lưu của người dùng cho cặp model này, hoặc session, hoặc mặc định
        const pairKey = getBagModelPairKey(activeRecord?.fileName, currentGarmentId, bagModel.fileName);
        const userPreset = getUserSavedBagPreset(pairKey);
        const currentSaved = getSessionBagAnchor(pairKey);
        const targetAnchor = userPreset || currentSaved || getGarmentDefaultBagAnchor(currentGarmentId);

        setBagOffsetX(targetAnchor.x);
        setBagOffsetY(targetAnchor.y);
        setBagOffsetZ(targetAnchor.z);
        setBagRotX(targetAnchor.rotX);
        setBagRotY(targetAnchor.rotY);
        setBagRotZ(targetAnchor.rotZ);
        setBagScale(targetAnchor.scale);

        if (userPreset) {
          setHasSavedBagCustomPreset(true);
          setSavedBagPresetData(userPreset);
        } else {
          setHasSavedBagCustomPreset(false);
          setSavedBagPresetData(null);
        }

        // Middle Rotator Group (pivot xoay tại đỉnh quai xách)
        const rotator = new THREE.Group();
        rotator.name = 'bagRotatorGroup';
        rotator.rotation.x = THREE.MathUtils.degToRad(targetAnchor.rotX);
        rotator.rotation.y = THREE.MathUtils.degToRad(targetAnchor.rotY);
        rotator.rotation.z = THREE.MathUtils.degToRad(targetAnchor.rotZ);
        rotator.add(bagScene);
        bagRotatorRef.current = rotator;

        // Outer positioning pivot group
        const pivot = new THREE.Group();
        pivot.name = 'bagPivotGroup';
        pivot.add(rotator);

        pivot.position.set(targetAnchor.x, targetAnchor.y, targetAnchor.z);
        pivot.scale.set(targetAnchor.scale, targetAnchor.scale, targetAnchor.scale);
        const shouldBagBeVisible = userExplicitlyHiddenRef.current.bag === true ? false : true;
        pivot.visible = shouldBagBeVisible;
        setIsBagVisible(shouldBagBeVisible);

        bagPivotRef.current = pivot;
        scene.add(pivot);

        const dimensions = {
          width: Number(size.x.toFixed(2)),
          height: Number(size.y.toFixed(2)),
          depth: Number(size.z.toFixed(2)),
        };

        setBagModel((prev) => (prev ? { ...prev, dimensions } : null));

        currentLoadedBagIdRef.current = bagModel.id;
        setIsBagLoading(false);
        setBagLoadingProgress(100);

        updateCameraFraming();
      },
      (progress) => {
        if (bagLoadGenRef.current !== thisBagGen) return;
        if (progress.total > 0) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          setBagLoadingProgress(percent);
        }
      },
      (error) => {
        if (isObjectUrl) URL.revokeObjectURL(bagUrl);
        if (bagLoadGenRef.current !== thisBagGen) return;
        console.error('Lỗi nạp mô hình túi cói GLB:', error);
        setBagError(
          'Không thể giải mã tệp túi cói. Vui lòng kiểm tra lại định dạng tệp .glb hoặc dung lượng.'
        );
        setIsBagLoading(false);
        currentLoadedBagIdRef.current = null;
      }
    );
  }, [bagModel?.id, bagModel?.url, retryTrigger]);

  // Auto-sync effect with studio garment selection
  useEffect(() => {
    const list = loadedModelsRef.current;
    if (list.length === 0) return;

    const matching = list.find((m) => {
      if (m.assignedGarmentId === currentGarmentId) return true;
      if (currentGarmentId === 'ao-tu-than' && m.fileName.toLowerCase().includes('tu-than')) return true;
      if (currentGarmentId === 'ao-dai-hien-dai' && m.fileName.toLowerCase().includes('ao-dai')) return true;
      if (currentGarmentId === 'ao-nhat-binh' && m.fileName.toLowerCase().includes('nhat-binh')) return true;
      return false;
    });

    if (matching) {
      if (matching.id !== activeModelId) {
        setActiveModelId(matching.id);
      }
    } else {
      // Dòng áo chưa có 3D (ví dụ Áo Ngũ Thân)
      if (currentLoadedGarmentIdRef.current !== null) {
        disposeCurrentGarment();
        currentLoadedGarmentIdRef.current = null;
      }
      setActiveModelId(null);
      setViewerStatus(accessoryModelRef.current ? 'ready' : 'idle');
    }

    // Khi chuyển áo, cập nhật tọa độ 3 phụ kiện theo đúng căn chỉnh chuyên biệt của áo đó
    const fanPairKey = getModelPairKey(matching?.fileName, currentGarmentId, accessoryModelRef.current?.fileName);
    const userFanPreset = getUserSavedPreset(fanPairKey);
    const defFan = userFanPreset || getGarmentDefaultAnchor(currentGarmentId);
    setAccessoryOffsetX(defFan.x);
    setAccessoryOffsetY(defFan.y);
    setAccessoryOffsetZ(defFan.z);
    setAccessoryRotX(defFan.rotX);
    setAccessoryRotY(defFan.rotY);
    setAccessoryRotZ(defFan.rotZ);
    setAccessoryScale(defFan.scale);

    const hatPairKey = getHatModelPairKey(matching?.fileName, currentGarmentId, hatModelRef.current?.fileName);
    const userHatPreset = getUserSavedHatPreset(hatPairKey);
    const defHat = userHatPreset || getGarmentDefaultHatAnchor(currentGarmentId);
    setHatOffsetX(defHat.x);
    setHatOffsetY(defHat.y);
    setHatOffsetZ(defHat.z);
    setHatRotX(defHat.rotX);
    setHatRotY(defHat.rotY);
    setHatRotZ(defHat.rotZ);
    setHatScale(defHat.scale);

    const bagPairKey = getBagModelPairKey(matching?.fileName, currentGarmentId, bagModelRef.current?.fileName);
    const userBagPreset = getUserSavedBagPreset(bagPairKey);
    const defBag = userBagPreset || getGarmentDefaultBagAnchor(currentGarmentId);
    setBagOffsetX(defBag.x);
    setBagOffsetY(defBag.y);
    setBagOffsetZ(defBag.z);
    setBagRotX(defBag.rotX);
    setBagRotY(defBag.rotY);
    setBagRotZ(defBag.rotZ);
    setBagScale(defBag.scale);

    // Đảm bảo tất cả phụ kiện tương thích hiển thị mặc định trừ khi người dùng chủ động ẩn
    if (accessoryPivotRef.current && userExplicitlyHiddenRef.current.fan !== true) {
      accessoryPivotRef.current.visible = true;
      setIsAccessoryVisible(true);
    }
    if (hatPivotRef.current && userExplicitlyHiddenRef.current.hat !== true) {
      hatPivotRef.current.visible = true;
      setIsHatVisible(true);
    }
    if (bagPivotRef.current && userExplicitlyHiddenRef.current.bag !== true) {
      bagPivotRef.current.visible = true;
      setIsBagVisible(true);
    }
  }, [currentGarmentId]);

  // Synchronize accessory visibility with Studio layer selection
  useEffect(() => {
    if (selectedHeadAccessory !== undefined) {
      if (selectedHeadAccessory === 'none') {
        userExplicitlyHiddenRef.current.hat = true;
        setIsHatVisible(false);
        if (hatPivotRef.current) hatPivotRef.current.visible = false;
      } else if (selectedHeadAccessory === 'non-la') {
        userExplicitlyHiddenRef.current.hat = false;
        setIsHatVisible(true);
        if (hatPivotRef.current) hatPivotRef.current.visible = true;
      }
    }
  }, [selectedHeadAccessory]);

  useEffect(() => {
    if (selectedHandAccessory !== undefined) {
      if (selectedHandAccessory === 'none') {
        userExplicitlyHiddenRef.current.fan = true;
        userExplicitlyHiddenRef.current.bag = true;
        setIsAccessoryVisible(false);
        setIsBagVisible(false);
        if (accessoryPivotRef.current) accessoryPivotRef.current.visible = false;
        if (bagPivotRef.current) bagPivotRef.current.visible = false;
      } else if (selectedHandAccessory === 'quat-nan') {
        userExplicitlyHiddenRef.current.fan = false;
        setIsAccessoryVisible(true);
        if (accessoryPivotRef.current) accessoryPivotRef.current.visible = true;
      } else if (selectedHandAccessory === 'tui-coi') {
        userExplicitlyHiddenRef.current.bag = false;
        setIsBagVisible(true);
        if (bagPivotRef.current) bagPivotRef.current.visible = true;
      }
    }
  }, [selectedHandAccessory]);

  // Reset camera view
  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      if (initialViewRef.current) {
        cameraRef.current.position.copy(initialViewRef.current.cameraPos);
        controlsRef.current.target.copy(initialViewRef.current.target);
      } else {
        updateCameraFraming();
      }
      controlsRef.current.update();
    }
  };

  // Zoom In button handler
  const handleZoomIn = () => {
    if (cameraRef.current && controlsRef.current) {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      const target = controls.target;
      const offset = camera.position.clone().sub(target);
      const currentDist = offset.length();
      const minLimit = controls.minDistance || 0.2;
      const newDist = Math.max(currentDist * 0.82, minLimit);
      if (Math.abs(newDist - currentDist) > 0.001) {
        offset.setLength(newDist);
        camera.position.copy(target).add(offset);
        controls.update();
      }
    }
  };

  // Zoom Out button handler
  const handleZoomOut = () => {
    if (cameraRef.current && controlsRef.current) {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      const target = controls.target;
      const offset = camera.position.clone().sub(target);
      const currentDist = offset.length();
      const maxLimit = controls.maxDistance || 30;
      const newDist = Math.min(currentDist * 1.22, maxLimit);
      if (Math.abs(newDist - currentDist) > 0.001) {
        offset.setLength(newDist);
        camera.position.copy(target).add(offset);
        controls.update();
      }
    }
  };

  // Process garment files
  const handleProcessGarmentFiles = (files: FileList | File[]) => {
    setErrorMessage(null);
    const fileArray = Array.from(files);
    const validGlbFiles = fileArray.filter((f) => f.name.toLowerCase().endsWith('.glb'));

    if (validGlbFiles.length === 0) {
      setErrorMessage(
        'Định dạng không được hỗ trợ. Vui lòng chọn tệp mô hình 3D chuẩn Binary glTF 2.0 (.glb).'
      );
      setViewerStatus('error');
      return;
    }

    const oversized = validGlbFiles.filter((f) => f.size > MAX_FILE_SIZE_BYTES);
    if (oversized.length > 0) {
      const sizeMb = (oversized[0].size / (1024 * 1024)).toFixed(1);
      setErrorMessage(
        `Tệp ${oversized[0].name} (${sizeMb} MB) vượt quá giới hạn an toàn 50 MB. Vui lòng tối ưu dung lượng tệp trước khi nạp.`
      );
      setViewerStatus('error');
      return;
    }

    const newRecords: SessionModelRecord[] = validGlbFiles.map((file) => {
      const meta = matchUploadedModelMeta(file.name);
      const detection = detectGarmentFromFilename(file.name);
      const assignedGarmentId = meta ? meta.matchedGarmentId : detection.garmentId;
      const assignedGarmentLabel = meta ? meta.title : detection.label;

      return {
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        file,
        fileName: file.name,
        fileSizeBytes: file.size,
        assignedGarmentId,
        assignedGarmentLabel,
        matchedMeta: meta,
        uploadedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        modelKind: 'garment',
      };
    });

    setLoadedModels((prev) => {
      const updated = [...prev];
      newRecords.forEach((newRec) => {
        const existingIdx = updated.findIndex(
          (r) => r.fileName.toLowerCase() === newRec.fileName.toLowerCase()
        );
        if (existingIdx >= 0) {
          updated[existingIdx] = newRec;
        } else {
          updated.push(newRec);
        }
      });
      return updated;
    });

    const matching =
      newRecords.find((r) => r.assignedGarmentId === currentGarmentId) || newRecords[0];
    if (matching) {
      currentLoadedGarmentIdRef.current = null;
      setActiveModelId(matching.id);
    }
  };

  // Process accessory file
  const handleProcessAccessoryFile = (files: FileList | File[]) => {
    setAccessoryError(null);
    const fileArray = Array.from(files);
    const file = fileArray.find((f) => f.name.toLowerCase().endsWith('.glb'));

    if (!file) {
      setAccessoryError('Vui lòng chọn tệp mô hình phụ kiện chuẩn .glb.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setAccessoryError(`Tệp phụ kiện (${sizeMb} MB) vượt quá giới hạn 50 MB.`);
      return;
    }

    const meta = matchUploadedModelMeta(file.name);

    const record: AccessoryModelRecord = {
      id: `acc-${file.name}-${Date.now()}`,
      file,
      fileName: file.name,
      fileSizeBytes: file.size,
      matchedMeta: meta,
      uploadedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    currentLoadedAccessoryIdRef.current = null;
    userExplicitlyHiddenRef.current.fan = false;
    setAccessoryModel(record);
    setIsAccessoryVisible(true);
    if (accessoryPivotRef.current) accessoryPivotRef.current.visible = true;
  };

  const handleGarmentFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessGarmentFiles(files);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleAccessoryFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessAccessoryFile(files);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  // Process hat file (Nón lá 3D)
  const handleProcessHatFile = (files: FileList | File[]) => {
    setHatError(null);
    const fileArray = Array.from(files);
    const file = fileArray.find((f) => f.name.toLowerCase().endsWith('.glb'));

    if (!file) {
      setHatError('Vui lòng chọn tệp mô hình nón lá chuẩn .glb.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setHatError(`Tệp nón lá (${sizeMb} MB) vượt quá giới hạn 50 MB.`);
      return;
    }

    const meta = matchUploadedModelMeta(file.name);

    const record: AccessoryModelRecord = {
      id: `hat-${file.name}-${Date.now()}`,
      file,
      fileName: file.name,
      fileSizeBytes: file.size,
      matchedMeta: meta,
      uploadedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    currentLoadedHatIdRef.current = null;
    userExplicitlyHiddenRef.current.hat = false;
    setHatModel(record);
    setIsHatVisible(true);
    if (hatPivotRef.current) hatPivotRef.current.visible = true;
    setActiveAccessoryTab('hat');
  };

  const handleHatFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessHatFile(files);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  // Process bag file (Túi cói đan 3D)
  const handleProcessBagFile = (files: FileList | File[]) => {
    setBagError(null);
    const fileArray = Array.from(files);
    const file = fileArray.find((f) => f.name.toLowerCase().endsWith('.glb'));

    if (!file) {
      setBagError('Vui lòng chọn tệp mô hình túi cói chuẩn .glb.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setBagError(`Tệp túi cói (${sizeMb} MB) vượt quá giới hạn 50 MB.`);
      return;
    }

    const meta = matchUploadedModelMeta(file.name);

    const record: AccessoryModelRecord = {
      id: `bag-${file.name}-${Date.now()}`,
      file,
      fileName: file.name,
      fileSizeBytes: file.size,
      matchedMeta: meta,
      uploadedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    currentLoadedBagIdRef.current = null;
    userExplicitlyHiddenRef.current.bag = false;
    setBagModel(record);
    setIsBagVisible(true);
    if (bagPivotRef.current) bagPivotRef.current.visible = true;
    setActiveAccessoryTab('bag');
  };

  const handleBagFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessBagFile(files);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = Array.from(e.dataTransfer.files);
      const fanFile = fileList.find((f) => {
        const n = f.name.toLowerCase();
        return n.includes('fan') || n.includes('quat');
      });
      const hatFile = fileList.find((f) => {
        const n = f.name.toLowerCase();
        return n.includes('hat') || n.includes('non');
      });
      const bagFile = fileList.find((f) => {
        const n = f.name.toLowerCase();
        return n.includes('tote') || n.includes('woven') || n.includes('bag') || n.includes('tui') || n.includes('coi');
      });
      const garmentFiles = fileList.filter((f) => f !== fanFile && f !== hatFile && f !== bagFile);

      if (fanFile) handleProcessAccessoryFile([fanFile]);
      if (hatFile) handleProcessHatFile([hatFile]);
      if (bagFile) handleProcessBagFile([bagFile]);
      if (garmentFiles.length > 0) handleProcessGarmentFiles(garmentFiles);
    }
  };

  // Remove a garment model from session
  const handleRemoveGarmentModel = (idToRemove: string) => {
    setLoadedModels((prev) => {
      const nextList = prev.filter((m) => m.id !== idToRemove);
      if (activeModelId === idToRemove) {
        disposeCurrentGarment();
        currentLoadedGarmentIdRef.current = null;
        const nextActive =
          nextList.find((m) => m.assignedGarmentId === currentGarmentId) || nextList[0] || null;
        setActiveModelId(nextActive ? nextActive.id : null);
        if (!nextActive) {
          if (!accessoryModelRef.current && !hatModelRef.current && !bagModelRef.current) {
            setViewerStatus('idle');
          }
          onModelClearedRef.current?.();
        }
      }
      return nextList;
    });
  };

  // Remove accessory model (Quạt)
  const handleRemoveAccessory = () => {
    disposeCurrentAccessory();
    currentLoadedAccessoryIdRef.current = null;
    setAccessoryModel(null);
    setAccessoryError(null);
    if (hatModelRef.current) {
      setActiveAccessoryTab('hat');
    } else if (bagModelRef.current) {
      setActiveAccessoryTab('bag');
    } else {
      setShowAccessoryControls(false);
    }
    updateCameraFraming();
  };

  // Remove hat model (Nón lá)
  const handleRemoveHat = () => {
    disposeCurrentHat();
    currentLoadedHatIdRef.current = null;
    setHatModel(null);
    setHatError(null);
    if (accessoryModelRef.current) {
      setActiveAccessoryTab('fan');
    } else if (bagModelRef.current) {
      setActiveAccessoryTab('bag');
    } else {
      setShowAccessoryControls(false);
    }
    updateCameraFraming();
  };

  // Remove bag model (Túi cói)
  const handleRemoveBag = () => {
    disposeCurrentBag();
    currentLoadedBagIdRef.current = null;
    setBagModel(null);
    setBagError(null);
    if (accessoryModelRef.current) {
      setActiveAccessoryTab('fan');
    } else if (hatModelRef.current) {
      setActiveAccessoryTab('hat');
    } else {
      setShowAccessoryControls(false);
    }
    updateCameraFraming();
  };

  // Format bytes
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Retry loading current garment model
  const handleRetryCurrentModel = () => {
    currentLoadedGarmentIdRef.current = null;
    setRetryTrigger((prev) => prev + 1);
  };

  // Clear all models
  const handleClearAllModels = () => {
    disposeCurrentGarment();
    currentLoadedGarmentIdRef.current = null;
    setLoadedModels([]);
    setActiveModelId(null);
    setViewerStatus((accessoryModel || hatModel || bagModel) ? 'ready' : 'idle');
    setErrorMessage(null);
    onModelClearedRef.current?.();
  };

  // Update assigned garment ID for a record
  const handleUpdateAssignedGarment = (id: string, newGarmentId: string) => {
    const opt = GARMENTS_ASSIGNABLE_OPTIONS.find((o) => o.id === newGarmentId);
    setLoadedModels((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              assignedGarmentId: newGarmentId,
              assignedGarmentLabel: opt ? opt.label : newGarmentId,
            }
          : m
      )
    );
  };

  const isModelReady = viewerStatus === 'ready';
  const isCurrentlyLoading = viewerStatus === 'loading';
  const isGarmentTypeMismatched =
    activeRecord &&
    activeRecord.assignedGarmentId !== 'custom_other' &&
    activeRecord.assignedGarmentId !== currentGarmentId;

  const accessoryMeta = accessoryModel?.matchedMeta;
  const hatMeta = hatModel?.matchedMeta;
  const bagMeta = bagModel?.matchedMeta;

  const handleToggleFanVisibility = () => {
    setIsAccessoryVisible((prev) => {
      const next = !prev;
      userExplicitlyHiddenRef.current.fan = !next;
      if (accessoryPivotRef.current) accessoryPivotRef.current.visible = next;
      onPropsVisibilityChange?.({ fan: next, hat: isHatVisible, bag: isBagVisible });
      return next;
    });
  };

  const handleToggleHatVisibility = () => {
    setIsHatVisible((prev) => {
      const next = !prev;
      userExplicitlyHiddenRef.current.hat = !next;
      if (hatPivotRef.current) hatPivotRef.current.visible = next;
      onPropsVisibilityChange?.({ fan: isAccessoryVisible, hat: next, bag: isBagVisible });
      return next;
    });
  };

  const handleToggleBagVisibility = () => {
    setIsBagVisible((prev) => {
      const next = !prev;
      userExplicitlyHiddenRef.current.bag = !next;
      if (bagPivotRef.current) bagPivotRef.current.visible = next;
      onPropsVisibilityChange?.({ fan: isAccessoryVisible, hat: isHatVisible, bag: next });
      return next;
    });
  };

  return (
    <div className="space-y-3 w-full max-w-full overflow-hidden">
      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb"
        multiple
        className="hidden"
        onChange={handleGarmentFileInputChange}
      />
      <input
        ref={additionalFileInputRef}
        type="file"
        accept=".glb"
        multiple
        className="hidden"
        onChange={handleGarmentFileInputChange}
      />
      <input
        ref={accessoryFileInputRef}
        type="file"
        accept=".glb"
        className="hidden"
        onChange={handleAccessoryFileInputChange}
      />
      <input
        ref={hatFileInputRef}
        type="file"
        accept=".glb"
        className="hidden"
        onChange={handleHatFileInputChange}
      />
      <input
        ref={bagFileInputRef}
        type="file"
        accept=".glb"
        className="hidden"
        onChange={handleBagFileInputChange}
      />

      {/* 1. COMPACT TOP STATUS STRIP (OUTSIDE CANVAS - Không che cổ áo hay tà trên) */}
      <div className="bg-[#FAF7F2] p-2.5 rounded-sm border border-[#241E1C]/15 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Model info tags */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {activeRecord ? (
            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xs border border-[#241E1C]/10 text-xs shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-[#8B2626] shrink-0" />
              <strong className="text-[#8B2626] truncate max-w-[140px] sm:max-w-[200px]" title={activeRecord.fileName}>
                {modelMeta?.title || activeRecord.fileName}
              </strong>
              <span className="text-[10px] text-stone-500 font-mono">({formatFileSize(activeRecord.fileSizeBytes)})</span>
              <span className="text-[10px] text-[#1B4D3E] font-medium hidden md:inline">· {activeRecord.assignedGarmentLabel}</span>
            </div>
          ) : (
            <div className="text-stone-500 text-[11px] flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              <span>Chưa có áo chính trong không gian 3D</span>
            </div>
          )}

          {/* Interactive prop toggle: Quạt cầm tay */}
          {accessoryModel && (
            <button
              type="button"
              onClick={handleToggleFanVisibility}
              aria-pressed={isAccessoryVisible}
              aria-label={`Quạt cầm tay: ${isAccessoryVisible ? 'Đang hiện, nhấn để ẩn' : 'Đang ẩn, nhấn để hiện'}`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xs border text-xs shadow-2xs cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E] ${
                isAccessoryVisible
                  ? 'bg-emerald-50/90 hover:bg-emerald-100 border-emerald-300 text-[#1B4D3E]'
                  : 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-600'
              }`}
              title={`Nhấn để ${isAccessoryVisible ? 'ẩn' : 'hiện'} quạt`}
            >
              <Fan className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium truncate max-w-[100px] sm:max-w-[140px]">
                {accessoryMeta?.title || 'Quạt'}
              </span>
              <span className={`text-[9px] px-1 py-0.2 rounded-xs font-semibold flex items-center gap-0.5 ${
                isAccessoryVisible ? 'bg-emerald-600 text-white' : 'bg-stone-300 text-stone-700'
              }`}>
                {isAccessoryVisible ? <Eye className="w-2.5 h-2.5 inline" /> : <EyeOff className="w-2.5 h-2.5 inline" />}
                <span>{isAccessoryVisible ? 'Hiện' : 'Ẩn'}</span>
              </span>
            </button>
          )}

          {/* Interactive prop toggle: Nón lá */}
          {hatModel && (
            <button
              type="button"
              onClick={handleToggleHatVisibility}
              aria-pressed={isHatVisible}
              aria-label={`Nón lá: ${isHatVisible ? 'Đang hiện, nhấn để ẩn' : 'Đang ẩn, nhấn để hiện'}`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xs border text-xs shadow-2xs cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-800 ${
                isHatVisible
                  ? 'bg-amber-50/90 hover:bg-amber-100 border-amber-300 text-amber-900'
                  : 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-600'
              }`}
              title={`Nhấn để ${isHatVisible ? 'ẩn' : 'hiện'} nón lá`}
            >
              <NonLaIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium truncate max-w-[100px] sm:max-w-[140px]">
                {hatMeta?.title || 'Nón lá'}
              </span>
              <span className={`text-[9px] px-1 py-0.2 rounded-xs font-semibold flex items-center gap-0.5 ${
                isHatVisible ? 'bg-amber-600 text-white' : 'bg-stone-300 text-stone-700'
              }`}>
                {isHatVisible ? <Eye className="w-2.5 h-2.5 inline" /> : <EyeOff className="w-2.5 h-2.5 inline" />}
                <span>{isHatVisible ? 'Hiện' : 'Ẩn'}</span>
              </span>
            </button>
          )}

          {/* Interactive prop toggle: Túi cói */}
          {bagModel && (
            <button
              type="button"
              onClick={handleToggleBagVisibility}
              aria-pressed={isBagVisible}
              aria-label={`Túi cói: ${isBagVisible ? 'Đang hiện, nhấn để ẩn' : 'Đang ẩn, nhấn để hiện'}`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xs border text-xs shadow-2xs cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-950 ${
                isBagVisible
                  ? 'bg-amber-100/70 hover:bg-amber-100 border-amber-400 text-amber-950'
                  : 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-600'
              }`}
              title={`Nhấn để ${isBagVisible ? 'ẩn' : 'hiện'} túi cói`}
            >
              <WovenBagIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium truncate max-w-[100px] sm:max-w-[140px]">
                {bagMeta?.title || 'Túi cói'}
              </span>
              <span className={`text-[9px] px-1 py-0.2 rounded-xs font-semibold flex items-center gap-0.5 ${
                isBagVisible ? 'bg-amber-700 text-white' : 'bg-stone-300 text-stone-700'
              }`}>
                {isBagVisible ? <Eye className="w-2.5 h-2.5 inline" /> : <EyeOff className="w-2.5 h-2.5 inline" />}
                <span>{isBagVisible ? 'Hiện' : 'Ẩn'}</span>
              </span>
            </button>
          )}
        </div>

        {/* Viewport Action Tools */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {/* Grid Toggle Button (Lưới tọa độ) */}
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 border rounded-xs shadow-2xs text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#241E1C] ${
              showGrid
                ? 'bg-[#241E1C] text-white border-[#241E1C]'
                : 'bg-white hover:bg-stone-50 text-[#241E1C] border-[#241E1C]/15'
            }`}
            title={showGrid ? 'Tắt lưới tọa độ sàn' : 'Bật lưới tọa độ sàn'}
            aria-pressed={showGrid}
            aria-label="Lưới tọa độ sàn 3D"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Lưới</span>
          </button>

          {/* Advanced Controls Toggle Button (Tọa độ 3D & Quản lý tệp) */}
          <button
            type="button"
            onClick={() => {
              const next = !showAdvancedSettings;
              setShowAdvancedSettings(next);
              setShowAccessoryControls(next);
            }}
            className={`p-1.5 border rounded-xs shadow-2xs text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D3E] ${
              showAdvancedSettings
                ? 'bg-[#1B4D3E] text-white border-[#1B4D3E]'
                : 'bg-white hover:bg-stone-50 text-[#1B4D3E] border-[#1B4D3E]/30'
            }`}
            title="Cài đặt nâng cao: Chỉnh tọa độ 3D, xoay, phóng tỉ lệ và tải tệp .glb"
            aria-expanded={showAdvancedSettings}
            aria-label="Bảng cài đặt nâng cao"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Nâng cao</span>
            {showAdvancedSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Zoom In */}
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 bg-white hover:bg-stone-50 text-[#241E1C] border border-[#241E1C]/15 rounded-xs shadow-2xs text-xs cursor-pointer transition-colors"
            title="Phóng to (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Out */}
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 bg-white hover:bg-stone-50 text-[#241E1C] border border-[#241E1C]/15 rounded-xs shadow-2xs text-xs cursor-pointer transition-colors"
            title="Thu nhỏ (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Reset Camera */}
          <button
            type="button"
            onClick={handleResetCamera}
            className="p-1.5 bg-white hover:bg-stone-50 text-[#8B2626] border border-[#241E1C]/15 rounded-xs shadow-2xs text-xs cursor-pointer transition-colors flex items-center gap-1"
            title="Đặt lại góc nhìn camera"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Góc nhìn</span>
          </button>

          {/* Auto Rotate */}
          <button
            type="button"
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`p-1.5 border rounded-xs shadow-2xs text-xs cursor-pointer transition-colors flex items-center gap-1 ${
              isAutoRotating
                ? 'bg-[#8B2626] text-white border-[#8B2626]'
                : 'bg-white hover:bg-stone-50 text-[#241E1C] border-[#241E1C]/15'
            }`}
            title={isAutoRotating ? 'Dừng tự xoay' : 'Tự động xoay'}
          >
            {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-[#8B2626]" />}
          </button>
        </div>
      </div>

      {/* MISMATCH WARNING NOTICE (Đưa ra ngoài canvas để không che khuất mô hình) */}
      {isGarmentTypeMismatched && (
        <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xs text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2 shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="text-[11px]">
              Mô hình 3D: <strong>{activeRecord.assignedGarmentLabel}</strong> · Studio đang chọn: <strong>{currentGarmentName}</strong>
            </span>
          </div>

          {onSyncGarmentRef.current && activeRecord.assignedGarmentId !== 'custom_other' && (
            <button
              type="button"
              onClick={() => onSyncGarmentRef.current?.(activeRecord.assignedGarmentId)}
              className="px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded-xs text-[10px] font-semibold cursor-pointer transition-colors flex items-center gap-1 shrink-0 ml-auto"
            >
              <span>Chuyển bàn phối sang {activeRecord.assignedGarmentLabel}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* 2. DEDICATED ACCESSORY FINE-TUNING PANEL (HIỂN THỊ KHI BẬT NÂNG CAO, TÁCH TỪNG MỤC PHỤ KIỆN RÕ RÀNG) */}
      {(accessoryModel || hatModel || bagModel) && showAdvancedSettings && (
        <div className="bg-white p-3.5 rounded-sm border border-[#241E1C]/20 shadow-xs space-y-3 text-xs animate-in fade-in">
          {/* Header Panel with Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#241E1C]/10 pb-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {/* Tab Selector */}
              <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-xs border border-[#241E1C]/10">
                <button
                  type="button"
                  onClick={() => setActiveAccessoryTab('fan')}
                  className={`px-3 py-1.5 rounded-xs font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                    activeAccessoryTab === 'fan'
                      ? 'bg-[#1B4D3E] text-white shadow-2xs'
                      : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                  }`}
                >
                  <Fan className="w-3.5 h-3.5" />
                  <span>Quạt Cầm Tay</span>
                  {accessoryModel ? (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-2xs font-bold ${
                        activeAccessoryTab === 'fan'
                          ? isAccessoryVisible ? 'bg-emerald-300 text-emerald-950' : 'bg-stone-400 text-stone-900'
                          : isAccessoryVisible ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {isAccessoryVisible ? 'Hiện' : 'Ẩn'}
                    </span>
                  ) : (
                    <span className="text-[9px] text-stone-400 italic">(Chưa nạp)</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveAccessoryTab('hat')}
                  className={`px-3 py-1.5 rounded-xs font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                    activeAccessoryTab === 'hat'
                      ? 'bg-[#8B2626] text-white shadow-2xs'
                      : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                  }`}
                >
                  <NonLaIcon className="w-3.5 h-3.5" />
                  <span>Nón Lá</span>
                  {hatModel ? (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-2xs font-bold ${
                        activeAccessoryTab === 'hat'
                          ? isHatVisible ? 'bg-amber-300 text-amber-950' : 'bg-stone-400 text-stone-900'
                          : isHatVisible ? 'bg-amber-100 text-amber-800' : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {isHatVisible ? 'Hiện' : 'Ẩn'}
                    </span>
                  ) : (
                    <span className="text-[9px] text-stone-400 italic">(Chưa nạp)</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveAccessoryTab('bag')}
                  className={`px-3 py-1.5 rounded-xs font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                    activeAccessoryTab === 'bag'
                      ? 'bg-amber-800 text-white shadow-2xs'
                      : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                  }`}
                >
                  <WovenBagIcon className="w-3.5 h-3.5" />
                  <span>Túi Cói</span>
                  {bagModel ? (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-2xs font-bold ${
                        activeAccessoryTab === 'bag'
                          ? isBagVisible ? 'bg-amber-300 text-amber-950' : 'bg-stone-400 text-stone-900'
                          : isBagVisible ? 'bg-amber-100 text-amber-800' : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {isBagVisible ? 'Hiện' : 'Ẩn'}
                    </span>
                  ) : (
                    <span className="text-[9px] text-stone-400 italic">(Chưa nạp)</span>
                  )}
                </button>
              </div>

              {/* Status info for active tab */}
              {activeAccessoryTab === 'fan' && (
                <>
                  {(activeRecord?.assignedGarmentId === 'ao-tu-than' || currentGarmentId === 'ao-tu-than') && (
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-xs font-semibold border border-amber-300 hidden md:inline">
                      Cặp riêng: Áo Tứ Thân × Quạt
                    </span>
                  )}
                  {hasSavedCustomPreset ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-xs font-bold border border-emerald-300 flex items-center gap-1 shadow-2xs">
                      ★ Đã lưu Preset quạt
                    </span>
                  ) : (
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-xs border border-stone-200 hidden sm:inline">
                      Preset quạt mặc định
                    </span>
                  )}
                </>
              )}

              {activeAccessoryTab === 'hat' && (
                <>
                  {(activeRecord?.assignedGarmentId === 'ao-tu-than' || currentGarmentId === 'ao-tu-than') && (
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-xs font-semibold border border-amber-300 hidden md:inline">
                      Cặp riêng: Áo Tứ Thân × Nón Lá
                    </span>
                  )}
                  {hasSavedHatCustomPreset ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-xs font-bold border border-emerald-300 flex items-center gap-1 shadow-2xs">
                      ★ Đã lưu Preset nón
                    </span>
                  ) : (
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-xs border border-stone-200 hidden sm:inline">
                      Preset nón mặc định
                    </span>
                  )}
                </>
              )}

              {activeAccessoryTab === 'bag' && (
                <>
                  {(activeRecord?.assignedGarmentId === 'ao-tu-than' || currentGarmentId === 'ao-tu-than') && (
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-xs font-semibold border border-amber-300 hidden md:inline">
                      Cặp riêng: Áo Tứ Thân × Túi Cói
                    </span>
                  )}
                  {hasSavedBagCustomPreset ? (
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-xs font-bold border border-emerald-300 flex items-center gap-1 shadow-2xs">
                      ★ Đã lưu Preset túi
                    </span>
                  ) : (
                    <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-xs border border-stone-200 hidden sm:inline">
                      Preset túi mặc định
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 ml-auto">
              {/* Nút Hiện / Ẩn điểm neo 3D (cho quạt) */}
              {activeAccessoryTab === 'fan' && (
                <button
                  type="button"
                  onClick={() => setShowAnchorHelper(!showAnchorHelper)}
                  className={`px-2 py-1 rounded-xs text-[11px] font-medium border cursor-pointer transition-colors flex items-center gap-1 ${
                    showAnchorHelper
                      ? 'bg-amber-100 text-amber-900 border-amber-400 font-semibold shadow-2xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-300'
                  }`}
                  title={showAnchorHelper ? 'Ẩn điểm neo 3D quạt' : 'Hiện điểm neo 3D quạt để căn thử'}
                >
                  <Crosshair className="w-3.5 h-3.5 text-[#1B4D3E]" />
                  <span>{showAnchorHelper ? 'Điểm neo (Bật)' : 'Hiện điểm neo'}</span>
                </button>
              )}

              {/* Nút Ẩn / Hiện riêng cho từng món */}
              {activeAccessoryTab === 'fan' && accessoryModel && (
                <button
                  type="button"
                  onClick={() => setIsAccessoryVisible(!isAccessoryVisible)}
                  className={`px-2 py-1 rounded-xs text-[11px] font-medium border cursor-pointer transition-colors flex items-center gap-1 ${
                    isAccessoryVisible
                      ? 'bg-emerald-50 text-[#1B4D3E] border-emerald-300 hover:bg-emerald-100'
                      : 'bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200'
                  }`}
                  title={isAccessoryVisible ? 'Ẩn quạt khỏi khung 3D' : 'Hiện quạt trở lại'}
                >
                  {isAccessoryVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>{isAccessoryVisible ? 'Quạt (Hiện)' : 'Quạt (Ẩn)'}</span>
                </button>
              )}

              {activeAccessoryTab === 'hat' && hatModel && (
                <button
                  type="button"
                  onClick={() => setIsHatVisible(!isHatVisible)}
                  className={`px-2 py-1 rounded-xs text-[11px] font-medium border cursor-pointer transition-colors flex items-center gap-1 ${
                    isHatVisible
                      ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                      : 'bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200'
                  }`}
                  title={isHatVisible ? 'Ẩn nón lá khỏi khung 3D' : 'Hiện nón lá trở lại'}
                >
                  {isHatVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>{isHatVisible ? 'Nón lá (Hiện)' : 'Nón lá (Ẩn)'}</span>
                </button>
              )}

              {activeAccessoryTab === 'bag' && bagModel && (
                <button
                  type="button"
                  onClick={() => setIsBagVisible(!isBagVisible)}
                  className={`px-2 py-1 rounded-xs text-[11px] font-medium border cursor-pointer transition-colors flex items-center gap-1 ${
                    isBagVisible
                      ? 'bg-amber-50 text-amber-950 border-amber-400 hover:bg-amber-100'
                      : 'bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200'
                  }`}
                  title={isBagVisible ? 'Ẩn túi cói khỏi khung 3D' : 'Hiện túi cói trở lại'}
                >
                  {isBagVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  <span>{isBagVisible ? 'Túi cói (Hiện)' : 'Túi cói (Ẩn)'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowAccessoryControls(false)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                title="Đóng bảng chỉnh"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* TAB 1: NỘI DUNG CHỈNH QUẠT */}
          {activeAccessoryTab === 'fan' && (
            !accessoryModel ? (
              <div className="p-4 bg-[#FAF7F2] rounded-xs border border-dashed border-stone-300 text-center space-y-2">
                <Fan className="w-6 h-6 text-stone-400 mx-auto" />
                <p className="text-stone-600 text-xs">Chưa nạp tệp quạt <code>fan-decorated.glb</code> vào phiên làm việc.</p>
                <button
                  type="button"
                  onClick={() => accessoryFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-[#1B4D3E] hover:bg-[#153e32] text-white rounded-xs text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Nạp quạt ngay</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Action Buttons Row: Lưu làm mặc định, Về vị trí ban đầu, Xóa preset đã lưu */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#FAF7F2] rounded-xs border border-[#241E1C]/10">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Nút Lưu vị trí hiện tại làm mặc định */}
                    <button
                      type="button"
                      onClick={handleSaveCurrentAsDefault}
                      className="px-3.5 py-1.5 bg-[#1B4D3E] hover:bg-[#153e32] text-white rounded-xs text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
                      title="Lưu vị trí và góc xoay hiện tại làm mặc định vĩnh viễn cho riêng cặp Áo Tứ Thân + Quạt này"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu vị trí hiện tại làm mặc định</span>
                    </button>

                    {/* Nút Đưa quạt về vị trí ban đầu */}
                    <button
                      type="button"
                      onClick={handleResetToInitial}
                      className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-xs text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs active:scale-95"
                      title="Khôi phục lại tọa độ gốc ban đầu của hệ thống"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#1B4D3E]" />
                      <span>Đưa quạt về vị trí ban đầu</span>
                    </button>

                    {/* Nút Xóa vị trí đã lưu (Chỉ hiện khi đã có preset lưu tùy chỉnh) */}
                    {hasSavedCustomPreset && (
                      <button
                        type="button"
                        onClick={handleDeleteSavedPreset}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xs text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs active:scale-95"
                        title="Xóa preset mặc định đã lưu cho cặp mô hình này và quay về cài đặt gốc"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>Xóa vị trí đã lưu</span>
                      </button>
                    )}
                  </div>

                  {/* Quick 3 Camera Angles to verify fan & right sleeve placement */}
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-[10px] text-stone-500 font-medium mr-1 hidden sm:inline">Góc nhìn:</span>
                    <button
                      type="button"
                      onClick={() => setPresetCameraAngle('front')}
                      className="px-2 py-1 bg-white hover:bg-stone-100 text-[#241E1C] border border-[#241E1C]/15 rounded-xs text-[11px] font-medium cursor-pointer transition-colors shadow-2xs active:scale-95"
                      title="Góc chính diện (0°)"
                    >
                      Chính diện (0°)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetCameraAngle('perspective')}
                      className="px-2 py-1 bg-white hover:bg-stone-100 text-[#241E1C] border border-[#241E1C]/15 rounded-xs text-[11px] font-medium cursor-pointer transition-colors shadow-2xs active:scale-95"
                      title="Góc nghiêng 45°"
                    >
                      Nghiêng 45°
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetCameraAngle('side')}
                      className="px-2 py-1 bg-white hover:bg-stone-100 text-[#241E1C] border border-[#241E1C]/15 rounded-xs text-[11px] font-medium cursor-pointer transition-colors shadow-2xs active:scale-95"
                      title="Góc ngang 90° (Cạnh tay áo)"
                    >
                      Ngang 90°
                    </button>
                  </div>
                </div>

                {/* Status & Feedback Notice Banner */}
                {resetFeedbackNotice ? (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xs text-xs font-medium flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#1B4D3E] shrink-0" />
                      <span>{resetFeedbackNotice}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetFeedbackNotice(null)}
                      className="text-emerald-700 hover:text-emerald-950 cursor-pointer p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : hasSavedCustomPreset ? (
                  <div className="p-2 bg-emerald-50/70 border border-emerald-200 text-emerald-900 rounded-xs text-[11px] flex items-center justify-between">
                    <span>
                      ✓ Đang áp dụng vị trí <strong>MẶC ĐỊNH bạn đã lưu</strong> cho Áo Tứ Thân + Quạt (X: {savedPresetData?.x}m, Y: {savedPresetData?.y}m, Z: {savedPresetData?.z}m, Yaw: {savedPresetData?.rotY}°, Nghiêng Z: {savedPresetData?.rotZ}°). Các lần tải lại quạt hoặc tải lại trang sẽ tự động giữ nguyên vị trí này!
                    </span>
                  </div>
                ) : (
                  <div className="p-2 bg-amber-50/60 border border-amber-200 text-amber-900 rounded-xs text-[11px]">
                    <span>
                      ℹ Đang áp dụng vị trí chuẩn mới cho Áo Tứ Thân: Đầu quạt giữ nguyên hướng chúc xuống và rủ chéo sang phải (Z-Roll: -138°), tọa độ quạt dịch lên khít sát mép tay áo (X: 0.43m, Y: 0.19m, Z: 0.00m). Bạn có thể tinh chỉnh thêm rồi nhấn <strong>"Lưu vị trí hiện tại làm mặc định"</strong>!
                    </span>
                  </div>
                )}

                {/* Sliders & Direct Number Inputs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 text-[11px]">
                  {/* 1. Trái / Phải (X) */}
                  <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xs border border-[#241E1C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-medium text-stone-800">
                      <span>Trái - Phải (X):</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleNudgeCoordinate('x', -0.01)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Dịch trái -0.01m"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.01"
                          value={accessoryOffsetX}
                          onChange={(e) => handleUpdateAnchorCoordinate('x', parseFloat(e.target.value))}
                          className="w-14 text-center font-mono font-bold text-xs bg-white border border-stone-300 rounded-2xs py-0.5 text-[#1B4D3E]"
                        />
                        <span className="text-[10px] font-mono text-stone-500">m</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeCoordinate('x', 0.01)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Dịch phải +0.01m"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-0.10"
                      max="0.85"
                      step="0.01"
                      value={accessoryOffsetX}
                      onChange={(e) => handleUpdateAnchorCoordinate('x', parseFloat(e.target.value))}
                      className="w-full accent-[#1B4D3E] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span>(-) Gần thân</span>
                      <span>Mép ngoài tay (+)</span>
                    </div>
                  </div>

                  {/* 2. Lên / Xuống (Y) */}
                  <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xs border border-[#241E1C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-medium text-stone-800">
                      <span>Lên - Xuống (Y):</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleNudgeCoordinate('y', -0.01)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Hạ thấp -0.01m"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.01"
                          value={accessoryOffsetY}
                          onChange={(e) => handleUpdateAnchorCoordinate('y', parseFloat(e.target.value))}
                          className="w-14 text-center font-mono font-bold text-xs bg-white border border-stone-300 rounded-2xs py-0.5 text-[#1B4D3E]"
                        />
                        <span className="text-[10px] font-mono text-stone-500">m</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeCoordinate('y', 0.01)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Nâng cao +0.01m"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-0.50"
                      max="0.50"
                      step="0.01"
                      value={accessoryOffsetY}
                      onChange={(e) => handleUpdateAnchorCoordinate('y', parseFloat(e.target.value))}
                      className="w-full accent-[#1B4D3E] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span>(-) Hạ thấp</span>
                      <span>Nâng cao (+)</span>
                    </div>
                  </div>

                  {/* 3. Trước / Sau (Z - Chiều sâu ra ngoài áo) */}
                  <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xs border border-[#241E1C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-medium text-stone-800">
                      <span>Trước - Sau (Z):</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleNudgeCoordinate('z', -0.01)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Lùi sau -0.01m"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.01"
                          value={accessoryOffsetZ}
                          onChange={(e) => handleUpdateAnchorCoordinate('z', parseFloat(e.target.value))}
                          className="w-14 text-center font-mono font-bold text-xs bg-white border border-stone-300 rounded-2xs py-0.5 text-[#1B4D3E]"
                        />
                        <span className="text-[10px] font-mono text-stone-500">m</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeCoordinate('z', 0.01)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Đưa ra trước +0.01m"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-0.15"
                      max="0.55"
                      step="0.01"
                      value={accessoryOffsetZ}
                      onChange={(e) => handleUpdateAnchorCoordinate('z', parseFloat(e.target.value))}
                      className="w-full accent-[#1B4D3E] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span>(-) Lùi trong áo</span>
                      <span>Ra ngoài mặt vải (+)</span>
                    </div>
                  </div>

                  {/* 4. Góc Xoay Hướng Quạt (Yaw - Y) */}
                  <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xs border border-[#241E1C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-medium text-stone-800">
                      <span>Xoay mặt nan (Y):</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleNudgeCoordinate('rotY', -2)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Xoay -2°"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="1"
                          value={accessoryRotY}
                          onChange={(e) => handleUpdateAnchorCoordinate('rotY', parseInt(e.target.value, 10))}
                          className="w-12 text-center font-mono font-bold text-xs bg-white border border-stone-300 rounded-2xs py-0.5 text-[#1B4D3E]"
                        />
                        <span className="text-[10px] font-mono text-stone-500">°</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeCoordinate('rotY', 2)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Xoay +2°"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={accessoryRotY}
                      onChange={(e) => handleUpdateAnchorCoordinate('rotY', parseInt(e.target.value, 10))}
                      className="w-full accent-[#1B4D3E] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span>-180° Xoay trong</span>
                      <span>Xoay ngoài +180°</span>
                    </div>
                  </div>

                  {/* 5. Góc Nghiêng Cán Quạt (Roll - Z) */}
                  <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xs border border-[#241E1C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-medium text-stone-800">
                      <span>Nghiêng quạt (Z):</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleNudgeCoordinate('rotZ', -2)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Nghiêng -2°"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="1"
                          value={accessoryRotZ}
                          onChange={(e) => handleUpdateAnchorCoordinate('rotZ', parseInt(e.target.value, 10))}
                          className="w-12 text-center font-mono font-bold text-xs bg-white border border-stone-300 rounded-2xs py-0.5 text-[#1B4D3E]"
                        />
                        <span className="text-[10px] font-mono text-stone-500">°</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeCoordinate('rotZ', 2)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Nghiêng +2°"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={accessoryRotZ}
                      onChange={(e) => handleUpdateAnchorCoordinate('rotZ', parseInt(e.target.value, 10))}
                      className="w-full accent-[#1B4D3E] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span>-180° Chúc xuống-phải</span>
                      <span>Dựng đứng +180°</span>
                    </div>
                  </div>

                  {/* 6. Ngửa / Úp Quạt (Pitch - X) */}
                  <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xs border border-[#241E1C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-medium text-stone-800">
                      <span>Ngửa/Úp quạt (X):</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleNudgeCoordinate('rotX', -2)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Ngửa -2°"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="1"
                          value={accessoryRotX}
                          onChange={(e) => handleUpdateAnchorCoordinate('rotX', parseInt(e.target.value, 10))}
                          className="w-12 text-center font-mono font-bold text-xs bg-white border border-stone-300 rounded-2xs py-0.5 text-[#1B4D3E]"
                        />
                        <span className="text-[10px] font-mono text-stone-500">°</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeCoordinate('rotX', 2)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Úp +2°"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={accessoryRotX}
                      onChange={(e) => handleUpdateAnchorCoordinate('rotX', parseInt(e.target.value, 10))}
                      className="w-full accent-[#1B4D3E] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span>-180° Ngửa ra trước</span>
                      <span>Úp vào sau +180°</span>
                    </div>
                  </div>

                  {/* 7. Tỉ lệ Kích Thước (Scale) */}
                  <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xs border border-[#241E1C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-medium text-stone-800">
                      <span>Kích thước (Scale):</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleNudgeCoordinate('scale', -0.05)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Thu nhỏ -0.05"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.02"
                          value={accessoryScale}
                          onChange={(e) => handleUpdateAnchorCoordinate('scale', parseFloat(e.target.value))}
                          className="w-14 text-center font-mono font-bold text-xs bg-white border border-stone-300 rounded-2xs py-0.5 text-[#1B4D3E]"
                        />
                        <span className="text-[10px] font-mono text-stone-500">x</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeCoordinate('scale', 0.05)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Phóng to +0.05"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.50"
                      max="1.80"
                      step="0.02"
                      value={accessoryScale}
                      onChange={(e) => handleUpdateAnchorCoordinate('scale', parseFloat(e.target.value))}
                      className="w-full accent-[#1B4D3E] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span>0.50x Thu nhỏ</span>
                      <span>Phóng lớn 1.80x</span>
                    </div>
                  </div>
                </div>

                {/* Footer Coordinates Summary */}
                <div className="text-[10px] text-stone-600 bg-[#FAF7F2] px-3 py-2 rounded-xs flex flex-wrap items-center justify-between gap-2 border border-[#241E1C]/10 font-mono">
                  <div>
                    <span className="font-semibold text-stone-800 font-sans mr-1">Tọa độ quạt đang áp dụng:</span>
                    <span>X: <strong>{accessoryOffsetX.toFixed(2)}m</strong></span>
                    <span className="mx-1">|</span>
                    <span>Y: <strong>{accessoryOffsetY.toFixed(2)}m</strong></span>
                    <span className="mx-1">|</span>
                    <span>Z: <strong>{accessoryOffsetZ.toFixed(2)}m</strong></span>
                    <span className="mx-1">|</span>
                    <span>Yaw: <strong>{accessoryRotY}°</strong></span>
                    <span className="mx-1">|</span>
                    <span>Roll: <strong>{accessoryRotZ}°</strong></span>
                    <span className="mx-1">|</span>
                    <span>Pitch: <strong>{accessoryRotX}°</strong></span>
                    <span className="mx-1">|</span>
                    <span>Scale: <strong>{accessoryScale.toFixed(2)}x</strong></span>
                  </div>
                  <div className="font-sans text-[#1B4D3E] font-medium text-[11px] ml-auto">
                    ✓ Kéo chỉnh không nạp lại áo · Camera zoom/xoay mượt mà
                  </div>
                </div>
              </div>
            )
          )}

          {/* TAB 2: NỘI DUNG CHỈNH NÓN LÁ */}
          {activeAccessoryTab === 'hat' && (
            !hatModel ? (
              <div className="p-4 bg-[#FAF7F2] rounded-xs border border-dashed border-stone-300 text-center space-y-2">
                <NonLaIcon className="w-6 h-6 text-amber-800 mx-auto" />
                <p className="text-stone-600 text-xs">Chưa nạp tệp nón lá <code>hat-non-la.glb</code> vào phiên làm việc.</p>
                <button
                  type="button"
                  onClick={() => hatFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-[#8B2626] hover:bg-[#741E1E] text-white rounded-xs text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Nạp nón lá ngay</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Action Buttons Row: Lưu làm mặc định nón, Về vị trí ban đầu nón, Xóa preset đã lưu nón */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#FAF7F2] rounded-xs border border-[#241E1C]/10">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Nút Lưu vị trí hiện tại làm mặc định cho nón */}
                    <button
                      type="button"
                      onClick={handleSaveCurrentHatAsDefault}
                      className="px-3.5 py-1.5 bg-[#8B2626] hover:bg-[#741E1E] text-white rounded-xs text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
                      title="Lưu vị trí và góc xoay hiện tại làm mặc định vĩnh viễn cho riêng cặp Áo Tứ Thân + Nón Lá này"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu vị trí nón làm mặc định</span>
                    </button>

                    {/* Nút Đưa nón về vị trí ban đầu */}
                    <button
                      type="button"
                      onClick={handleResetHatToInitial}
                      className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-xs text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs active:scale-95"
                      title="Khôi phục lại tọa độ nón lá gốc ban đầu của hệ thống"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#8B2626]" />
                      <span>Đưa nón lá về vị trí ban đầu</span>
                    </button>

                    {/* Nút Xóa vị trí đã lưu cho nón */}
                    {hasSavedHatCustomPreset && (
                      <button
                        type="button"
                        onClick={handleDeleteSavedHatPreset}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xs text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs active:scale-95"
                        title="Xóa preset mặc định đã lưu cho cặp nón lá này và quay về cài đặt gốc"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>Xóa vị trí đã lưu</span>
                      </button>
                    )}
                  </div>

                  {/* Quick 3 Camera Angles */}
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-[10px] text-stone-500 font-medium mr-1 hidden sm:inline">Góc nhìn:</span>
                    <button
                      type="button"
                      onClick={() => setPresetCameraAngle('front')}
                      className="px-2 py-1 bg-white hover:bg-stone-100 text-[#241E1C] border border-[#241E1C]/15 rounded-xs text-[11px] font-medium cursor-pointer transition-colors shadow-2xs active:scale-95"
                    >
                      Chính diện
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetCameraAngle('perspective')}
                      className="px-2 py-1 bg-white hover:bg-stone-100 text-[#241E1C] border border-[#241E1C]/15 rounded-xs text-[11px] font-medium cursor-pointer transition-colors shadow-2xs active:scale-95"
                    >
                      Nghiêng 45°
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetCameraAngle('side')}
                      className="px-2 py-1 bg-white hover:bg-stone-100 text-[#241E1C] border border-[#241E1C]/15 rounded-xs text-[11px] font-medium cursor-pointer transition-colors shadow-2xs active:scale-95"
                    >
                      Ngang 90°
                    </button>
                  </div>
                </div>

                {/* Status & Feedback Notice Banner for Hat */}
                {resetFeedbackNotice ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xs text-xs font-medium flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#8B2626] shrink-0" />
                      <span>{resetFeedbackNotice}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetFeedbackNotice(null)}
                      className="text-amber-700 hover:text-amber-950 cursor-pointer p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : hasSavedHatCustomPreset ? (
                  <div className="p-2 bg-emerald-50/70 border border-emerald-200 text-emerald-900 rounded-xs text-[11px] flex items-center justify-between">
                    <span>
                      ✓ Đang áp dụng vị trí <strong>MẶC ĐỊNH bạn đã lưu</strong> cho Áo Tứ Thân + Nón Lá (X: {savedHatPresetData?.x}m, Y: {savedHatPresetData?.y}m, Z: {savedHatPresetData?.z}m, Yaw: {savedHatPresetData?.rotY}°, Nghiêng X: {savedHatPresetData?.rotX}°).
                    </span>
                  </div>
                ) : (
                  <div className="p-2 bg-amber-50/60 border border-amber-200 text-amber-900 rounded-xs text-[11px]">
                    <span>
                      ℹ Vị trí mặc định nón lá cho Áo Tứ Thân: Ngay trên cổ áo/đầu người mặc (X: 0.00m, Y: 0.44m, Z: 0.02m, ngả nhẹ X: -4°). Bạn có thể tinh chỉnh rồi bấm <strong>"Lưu vị trí nón làm mặc định"</strong>!
                    </span>
                  </div>
                )}

                {/* Hat Sliders Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 text-[11px]">
                  {/* 1. Trái - Phải (X) */}
                  <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xs border border-[#241E1C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-medium text-stone-800">
                      <span>Trái - Phải (X):</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleNudgeHatCoordinate('x', -0.01)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.01"
                          value={hatOffsetX}
                          onChange={(e) => handleUpdateHatCoordinate('x', parseFloat(e.target.value))}
                          className="w-14 text-center font-mono font-bold text-xs bg-white border border-stone-300 rounded-2xs py-0.5 text-amber-900"
                        />
                        <span className="text-[10px] font-mono text-stone-500">m</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeHatCoordinate('x', 0.01)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-0.50"
                      max="0.50"
                      step="0.01"
                      value={hatOffsetX}
                      onChange={(e) => handleUpdateHatCoordinate('x', parseFloat(e.target.value))}
                      className="w-full accent-amber-800 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span>(-) Sang trái</span>
                      <span>Sang phải (+)</span>
                    </div>
                  </div>

                  {/* 2. Lên - Xuống (Y) */}
                  <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xs border border-[#241E1C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-medium text-stone-800">
                      <span>Lên - Xuống (Y):</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleNudgeHatCoordinate('y', -0.01)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.01"
                          value={hatOffsetY}
                          onChange={(e) => handleUpdateHatCoordinate('y', parseFloat(e.target.value))}
                          className="w-14 text-center font-mono font-bold text-xs bg-white border border-stone-300 rounded-2xs py-0.5 text-amber-900"
                        />
                        <span className="text-[10px] font-mono text-stone-500">m</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeHatCoordinate('y', 0.01)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.10"
                      max="0.85"
                      step="0.01"
                      value={hatOffsetY}
                      onChange={(e) => handleUpdateHatCoordinate('y', parseFloat(e.target.value))}
                      className="w-full accent-amber-800 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span>(-) Cổ áo</span>
                      <span>Đỉnh đầu (+)</span>
                    </div>
                  </div>

                  {/* 3. Trước - Sau (Z) */}
                  <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xs border border-[#241E1C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-medium text-stone-800">
                      <span>Trước - Sau (Z):</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleNudgeHatCoordinate('z', -0.01)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.01"
                          value={hatOffsetZ}
                          onChange={(e) => handleUpdateHatCoordinate('z', parseFloat(e.target.value))}
                          className="w-14 text-center font-mono font-bold text-xs bg-white border border-stone-300 rounded-2xs py-0.5 text-amber-900"
                        />
                        <span className="text-[10px] font-mono text-stone-500">m</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeHatCoordinate('z', 0.01)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-0.40"
                      max="0.40"
                      step="0.01"
                      value={hatOffsetZ}
                      onChange={(e) => handleUpdateHatCoordinate('z', parseFloat(e.target.value))}
                      className="w-full accent-amber-800 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span>(-) Lùi sau</span>
                      <span>Ra trước mặt (+)</span>
                    </div>
                  </div>

                  {/* 4. Góc Xoay Quanh Trục Y */}
                  <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xs border border-[#241E1C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-medium text-stone-800">
                      <span>Xoay ngang (Y):</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleNudgeHatCoordinate('rotY', -2)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="1"
                          value={hatRotY}
                          onChange={(e) => handleUpdateHatCoordinate('rotY', parseInt(e.target.value, 10))}
                          className="w-12 text-center font-mono font-bold text-xs bg-white border border-stone-300 rounded-2xs py-0.5 text-amber-900"
                        />
                        <span className="text-[10px] font-mono text-stone-500">°</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeHatCoordinate('rotY', 2)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={hatRotY}
                      onChange={(e) => handleUpdateHatCoordinate('rotY', parseInt(e.target.value, 10))}
                      className="w-full accent-amber-800 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span>-180° Xoay trái</span>
                      <span>Xoay phải +180°</span>
                    </div>
                  </div>

                  {/* 5. Nghiêng Trái/Phải (Roll - Z) */}
                  <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xs border border-[#241E1C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-medium text-stone-800">
                      <span>Nghiêng vành (Z):</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleNudgeHatCoordinate('rotZ', -2)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="1"
                          value={hatRotZ}
                          onChange={(e) => handleUpdateHatCoordinate('rotZ', parseInt(e.target.value, 10))}
                          className="w-12 text-center font-mono font-bold text-xs bg-white border border-stone-300 rounded-2xs py-0.5 text-amber-900"
                        />
                        <span className="text-[10px] font-mono text-stone-500">°</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeHatCoordinate('rotZ', 2)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-90"
                      max="90"
                      step="1"
                      value={hatRotZ}
                      onChange={(e) => handleUpdateHatCoordinate('rotZ', parseInt(e.target.value, 10))}
                      className="w-full accent-amber-800 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span>-90° Nghiêng trái</span>
                      <span>Nghiêng phải +90°</span>
                    </div>
                  </div>

                  {/* 6. Ngửa/Cụp vành nón (Pitch - X) */}
                  <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xs border border-[#241E1C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-medium text-stone-800">
                      <span>Ngửa/Cụp nón (X):</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleNudgeHatCoordinate('rotX', -2)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="1"
                          value={hatRotX}
                          onChange={(e) => handleUpdateHatCoordinate('rotX', parseInt(e.target.value, 10))}
                          className="w-12 text-center font-mono font-bold text-xs bg-white border border-stone-300 rounded-2xs py-0.5 text-amber-900"
                        />
                        <span className="text-[10px] font-mono text-stone-500">°</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeHatCoordinate('rotX', 2)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-90"
                      max="90"
                      step="1"
                      value={hatRotX}
                      onChange={(e) => handleUpdateHatCoordinate('rotX', parseInt(e.target.value, 10))}
                      className="w-full accent-amber-800 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span>-90° Ngửa ra sau</span>
                      <span>Cụp về trước +90°</span>
                    </div>
                  </div>

                  {/* 7. Kích Thước Nón (Scale) */}
                  <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xs border border-[#241E1C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-medium text-stone-800">
                      <span>Kích thước (Scale):</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleNudgeHatCoordinate('scale', -0.05)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.02"
                          value={hatScale}
                          onChange={(e) => handleUpdateHatCoordinate('scale', parseFloat(e.target.value))}
                          className="w-14 text-center font-mono font-bold text-xs bg-white border border-stone-300 rounded-2xs py-0.5 text-amber-900"
                        />
                        <span className="text-[10px] font-mono text-stone-500">x</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeHatCoordinate('scale', 0.05)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.40"
                      max="1.80"
                      step="0.02"
                      value={hatScale}
                      onChange={(e) => handleUpdateHatCoordinate('scale', parseFloat(e.target.value))}
                      className="w-full accent-amber-800 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span>0.40x Nhỏ</span>
                      <span>Lớn 1.80x</span>
                    </div>
                  </div>
                </div>

                {/* Footer Coordinates Summary for Hat */}
                <div className="text-[10px] text-stone-600 bg-[#FAF7F2] px-3 py-2 rounded-xs flex flex-wrap items-center justify-between gap-2 border border-[#241E1C]/10 font-mono">
                  <div>
                    <span className="font-semibold text-stone-800 font-sans mr-1">Tọa độ nón đang áp dụng:</span>
                    <span>X: <strong>{hatOffsetX.toFixed(2)}m</strong></span>
                    <span className="mx-1">|</span>
                    <span>Y: <strong>{hatOffsetY.toFixed(2)}m</strong></span>
                    <span className="mx-1">|</span>
                    <span>Z: <strong>{hatOffsetZ.toFixed(2)}m</strong></span>
                    <span className="mx-1">|</span>
                    <span>Yaw: <strong>{hatRotY}°</strong></span>
                    <span className="mx-1">|</span>
                    <span>Roll: <strong>{hatRotZ}°</strong></span>
                    <span className="mx-1">|</span>
                    <span>Pitch: <strong>{hatRotX}°</strong></span>
                    <span className="mx-1">|</span>
                    <span>Scale: <strong>{hatScale.toFixed(2)}x</strong></span>
                  </div>
                  <div className="font-sans text-amber-900 font-medium text-[11px] ml-auto">
                    ✓ Nón lá được căn ở cổ/đầu · Đội cùng áo và quạt trong cùng khung nhìn 3D
                  </div>
                </div>
              </div>
            )
          )}

          {/* TAB 3: NỘI DUNG CHỈNH TÚI CÓI */}
          {activeAccessoryTab === 'bag' && (
            !bagModel ? (
              <div className="p-4 bg-[#FAF7F2] rounded-xs border border-dashed border-stone-300 text-center space-y-2">
                <WovenBagIcon className="w-6 h-6 text-amber-900 mx-auto" />
                <p className="text-stone-600 text-xs">Chưa nạp tệp túi cói <code>woven-tote.glb</code> vào phiên làm việc.</p>
                <button
                  type="button"
                  onClick={() => bagFileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xs text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Nạp túi cói ngay</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Action Buttons Row: Lưu làm mặc định túi, Về vị trí ban đầu túi, Xóa preset đã lưu túi */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-[#FAF7F2] rounded-xs border border-[#241E1C]/10">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Nút Lưu vị trí hiện tại làm mặc định cho túi */}
                    <button
                      type="button"
                      onClick={handleSaveCurrentBagAsDefault}
                      className="px-3.5 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xs text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
                      title="Lưu vị trí và góc xoay hiện tại làm mặc định vĩnh viễn cho riêng cặp Áo Tứ Thân + Túi Cói này"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu vị trí túi làm mặc định</span>
                    </button>

                    {/* Nút Đưa túi về vị trí ban đầu */}
                    <button
                      type="button"
                      onClick={handleResetBagToInitial}
                      className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-xs text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs active:scale-95"
                      title="Khôi phục lại tọa độ túi cói gốc ban đầu của hệ thống"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-800" />
                      <span>Đưa túi cói về vị trí ban đầu</span>
                    </button>

                    {/* Nút Xóa vị trí đã lưu cho túi */}
                    {hasSavedBagCustomPreset && (
                      <button
                        type="button"
                        onClick={handleDeleteSavedBagPreset}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xs text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs active:scale-95"
                        title="Xóa preset mặc định đã lưu cho cặp túi cói này và quay về cài đặt gốc"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>Xóa vị trí đã lưu</span>
                      </button>
                    )}
                  </div>

                  {/* Quick Camera Angles */}
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-[10px] text-stone-500 font-medium mr-1 hidden sm:inline">Góc nhìn:</span>
                    <button
                      type="button"
                      onClick={() => setPresetCameraAngle('front')}
                      className="px-2 py-1 bg-white hover:bg-stone-100 text-[#241E1C] border border-[#241E1C]/15 rounded-xs text-[11px] font-medium cursor-pointer transition-colors shadow-2xs active:scale-95"
                      title="Góc chính diện (0°)"
                    >
                      Chính diện
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetCameraAngle('perspective')}
                      className="px-2 py-1 bg-white hover:bg-stone-100 text-[#241E1C] border border-[#241E1C]/15 rounded-xs text-[11px] font-medium cursor-pointer transition-colors shadow-2xs active:scale-95"
                      title="Góc nghiêng 45°"
                    >
                      Nghiêng 45°
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetCameraAngle('side_left')}
                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-xs text-[11px] font-medium cursor-pointer transition-colors shadow-2xs active:scale-95"
                      title="Góc ngang -90° (Cạnh tay áo trái & quai túi)"
                    >
                      Tay trái (-90°)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetCameraAngle('side')}
                      className="px-2 py-1 bg-white hover:bg-stone-100 text-[#241E1C] border border-[#241E1C]/15 rounded-xs text-[11px] font-medium cursor-pointer transition-colors shadow-2xs active:scale-95"
                      title="Góc ngang 90° (Cạnh tay áo phải)"
                    >
                      Ngang 90°
                    </button>
                  </div>
                </div>

                {/* Status & Feedback Notice Banner for Bag */}
                {bagResetFeedbackNotice ? (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 text-amber-900 rounded-xs text-xs font-medium flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-800 shrink-0" />
                      <span>{bagResetFeedbackNotice}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBagResetFeedbackNotice(null)}
                      className="text-amber-700 hover:text-amber-950 cursor-pointer p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : hasSavedBagCustomPreset ? (
                  <div className="p-2 bg-emerald-50/70 border border-emerald-200 text-emerald-900 rounded-xs text-[11px] flex items-center justify-between">
                    <span>
                      ✓ Đang áp dụng vị trí <strong>MẶC ĐỊNH bạn đã lưu</strong> cho Áo Tứ Thân + Túi Cói (X: {savedBagPresetData?.x}m, Y: {savedBagPresetData?.y}m, Z: {savedBagPresetData?.z}m, Yaw: {savedBagPresetData?.rotY}°, Nghiêng Z: {savedBagPresetData?.rotZ}°).
                    </span>
                  </div>
                ) : (
                  <div className="p-2 bg-amber-50/60 border border-amber-200 text-amber-900 rounded-xs text-[11px]">
                    <span>
                      ℹ Vị trí mặc định túi cói cho Áo Tứ Thân: Quai xách chạm đầu ống tay áo bên trái khi nhìn chính diện (X: -0.42m, Y: 0.18m, Z: 0.08m), thân túi buông thõng tự nhiên hướng xuống dưới, không lún vào tà áo. Bạn có thể tinh chỉnh rồi bấm <strong>"Lưu vị trí túi làm mặc định"</strong>!
                    </span>
                  </div>
                )}

                {/* Bag Sliders Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 text-[11px]">
                  {/* 1. Trái - Phải (X) */}
                  <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xs border border-[#241E1C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-medium text-stone-800">
                      <span>Trái - Phải (X):</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleNudgeBagCoordinate('x', -0.01)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Dịch trái -0.01m"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.01"
                          value={bagOffsetX}
                          onChange={(e) => handleUpdateBagCoordinate('x', parseFloat(e.target.value))}
                          className="w-14 text-center font-mono font-bold text-xs bg-white border border-stone-300 rounded-2xs py-0.5 text-amber-950"
                        />
                        <span className="text-[10px] font-mono text-stone-500">m</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeBagCoordinate('x', 0.01)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Dịch phải +0.01m"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-0.90"
                      max="0.20"
                      step="0.01"
                      value={bagOffsetX}
                      onChange={(e) => handleUpdateBagCoordinate('x', parseFloat(e.target.value))}
                      className="w-full accent-amber-800 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span>(-) Ra ngoài tay trái</span>
                      <span>Vào thân áo (+)</span>
                    </div>
                  </div>

                  {/* 2. Lên - Xuống (Y) */}
                  <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xs border border-[#241E1C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-medium text-stone-800">
                      <span>Lên - Xuống (Y):</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleNudgeBagCoordinate('y', -0.01)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Hạ thấp -0.01m"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.01"
                          value={bagOffsetY}
                          onChange={(e) => handleUpdateBagCoordinate('y', parseFloat(e.target.value))}
                          className="w-14 text-center font-mono font-bold text-xs bg-white border border-stone-300 rounded-2xs py-0.5 text-amber-950"
                        />
                        <span className="text-[10px] font-mono text-stone-500">m</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeBagCoordinate('y', 0.01)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Nâng cao +0.01m"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-0.30"
                      max="0.60"
                      step="0.01"
                      value={bagOffsetY}
                      onChange={(e) => handleUpdateBagCoordinate('y', parseFloat(e.target.value))}
                      className="w-full accent-amber-800 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span>(-) Buông thấp</span>
                      <span>Nâng quai (+)</span>
                    </div>
                  </div>

                  {/* 3. Trước - Sau (Z) */}
                  <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xs border border-[#241E1C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-medium text-stone-800">
                      <span>Trước - Sau (Z):</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleNudgeBagCoordinate('z', -0.01)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Lùi sau -0.01m"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.01"
                          value={bagOffsetZ}
                          onChange={(e) => handleUpdateBagCoordinate('z', parseFloat(e.target.value))}
                          className="w-14 text-center font-mono font-bold text-xs bg-white border border-stone-300 rounded-2xs py-0.5 text-amber-950"
                        />
                        <span className="text-[10px] font-mono text-stone-500">m</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeBagCoordinate('z', 0.01)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Ra trước +0.01m"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-0.30"
                      max="0.40"
                      step="0.01"
                      value={bagOffsetZ}
                      onChange={(e) => handleUpdateBagCoordinate('z', parseFloat(e.target.value))}
                      className="w-full accent-amber-800 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span>(-) Lùi sau</span>
                      <span>Ra trước tà áo (+)</span>
                    </div>
                  </div>

                  {/* 4. Góc Xoay Quanh Trục Y */}
                  <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xs border border-[#241E1C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-medium text-stone-800">
                      <span>Xoay ngang (Y):</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleNudgeBagCoordinate('rotY', -2)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Xoay -2°"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="1"
                          value={bagRotY}
                          onChange={(e) => handleUpdateBagCoordinate('rotY', parseInt(e.target.value, 10))}
                          className="w-12 text-center font-mono font-bold text-xs bg-white border border-stone-300 rounded-2xs py-0.5 text-amber-950"
                        />
                        <span className="text-[10px] font-mono text-stone-500">°</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeBagCoordinate('rotY', 2)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Xoay +2°"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={bagRotY}
                      onChange={(e) => handleUpdateBagCoordinate('rotY', parseInt(e.target.value, 10))}
                      className="w-full accent-amber-800 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span>-180° Xoay trái</span>
                      <span>Xoay phải +180°</span>
                    </div>
                  </div>

                  {/* 5. Nghiêng Túi (Roll - Z) */}
                  <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xs border border-[#241E1C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-medium text-stone-800">
                      <span>Nghiêng thân túi (Z):</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleNudgeBagCoordinate('rotZ', -2)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Nghiêng -2°"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="1"
                          value={bagRotZ}
                          onChange={(e) => handleUpdateBagCoordinate('rotZ', parseInt(e.target.value, 10))}
                          className="w-12 text-center font-mono font-bold text-xs bg-white border border-stone-300 rounded-2xs py-0.5 text-amber-950"
                        />
                        <span className="text-[10px] font-mono text-stone-500">°</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeBagCoordinate('rotZ', 2)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Nghiêng +2°"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-90"
                      max="90"
                      step="1"
                      value={bagRotZ}
                      onChange={(e) => handleUpdateBagCoordinate('rotZ', parseInt(e.target.value, 10))}
                      className="w-full accent-amber-800 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span>-90° Chếch ra ngoài</span>
                      <span>Ép vào trong +90°</span>
                    </div>
                  </div>

                  {/* 6. Ngửa/Úp Thân Túi (Pitch - X) */}
                  <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xs border border-[#241E1C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-medium text-stone-800">
                      <span>Ngửa/Úp túi (X):</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleNudgeBagCoordinate('rotX', -2)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Ngửa -2°"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="1"
                          value={bagRotX}
                          onChange={(e) => handleUpdateBagCoordinate('rotX', parseInt(e.target.value, 10))}
                          className="w-12 text-center font-mono font-bold text-xs bg-white border border-stone-300 rounded-2xs py-0.5 text-amber-950"
                        />
                        <span className="text-[10px] font-mono text-stone-500">°</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeBagCoordinate('rotX', 2)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Úp +2°"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="-90"
                      max="90"
                      step="1"
                      value={bagRotX}
                      onChange={(e) => handleUpdateBagCoordinate('rotX', parseInt(e.target.value, 10))}
                      className="w-full accent-amber-800 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span>-90° Ngửa ra trước</span>
                      <span>Úp vào sau +90°</span>
                    </div>
                  </div>

                  {/* 7. Kích Thước Túi (Scale) */}
                  <div className="space-y-1.5 bg-[#FAF7F2] p-2.5 rounded-xs border border-[#241E1C]/10 flex flex-col justify-between">
                    <div className="flex items-center justify-between font-medium text-stone-800">
                      <span>Kích thước (Scale):</span>
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleNudgeBagCoordinate('scale', -0.05)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Thu nhỏ -0.05"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.02"
                          value={bagScale}
                          onChange={(e) => handleUpdateBagCoordinate('scale', parseFloat(e.target.value))}
                          className="w-14 text-center font-mono font-bold text-xs bg-white border border-stone-300 rounded-2xs py-0.5 text-amber-950"
                        />
                        <span className="text-[10px] font-mono text-stone-500">x</span>
                        <button
                          type="button"
                          onClick={() => handleNudgeBagCoordinate('scale', 0.05)}
                          className="w-4 h-4 bg-white border border-stone-300 hover:bg-stone-100 rounded-2xs text-[10px] font-bold flex items-center justify-center cursor-pointer"
                          title="Phóng to +0.05"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.40"
                      max="1.80"
                      step="0.02"
                      value={bagScale}
                      onChange={(e) => handleUpdateBagCoordinate('scale', parseFloat(e.target.value))}
                      className="w-full accent-amber-800 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-stone-400">
                      <span>0.40x Nhỏ gọn</span>
                      <span>Lớn 1.80x</span>
                    </div>
                  </div>
                </div>

                {/* Footer Coordinates Summary for Bag */}
                <div className="text-[10px] text-stone-600 bg-[#FAF7F2] px-3 py-2 rounded-xs flex flex-wrap items-center justify-between gap-2 border border-[#241E1C]/10 font-mono">
                  <div>
                    <span className="font-semibold text-stone-800 font-sans mr-1">Tọa độ túi cói đang áp dụng:</span>
                    <span>X: <strong>{bagOffsetX.toFixed(2)}m</strong></span>
                    <span className="mx-1">|</span>
                    <span>Y: <strong>{bagOffsetY.toFixed(2)}m</strong></span>
                    <span className="mx-1">|</span>
                    <span>Z: <strong>{bagOffsetZ.toFixed(2)}m</strong></span>
                    <span className="mx-1">|</span>
                    <span>Yaw: <strong>{bagRotY}°</strong></span>
                    <span className="mx-1">|</span>
                    <span>Roll: <strong>{bagRotZ}°</strong></span>
                    <span className="mx-1">|</span>
                    <span>Pitch: <strong>{bagRotX}°</strong></span>
                    <span className="mx-1">|</span>
                    <span>Scale: <strong>{bagScale.toFixed(2)}x</strong></span>
                  </div>
                  <div className="font-sans text-amber-900 font-medium text-[11px] ml-auto">
                    ✓ Quai xách buông tự nhiên cạnh ống tay áo trái · Giữ nguyên màu sắc và chất liệu mộc của tệp GLB
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* 3. CLEAN THREE.JS CANVAS VIEWPORT (THOÁNG ĐÃNG - KHÔNG BỊ OVERLAY CHE KHUẤT CỔ ÁO HAY DẢI TÀ) */}
      <div className="relative w-full aspect-[4/3] min-h-[440px] max-h-[580px] bg-[#F6F3ED] border border-[#241E1C]/15 rounded-sm overflow-hidden select-none">
        {/* THREE.JS CANVAS CONTAINER */}
        <div
          ref={containerRef}
          className={`w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing ${
            !isModelReady ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        />

        {/* LOADING OVERLAY (Garment) */}
        {isCurrentlyLoading && (
          <div className="absolute inset-0 z-30 bg-[#F6F3ED]/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-9 h-9 border-3 border-[#8B2626]/20 border-t-[#8B2626] rounded-full animate-spin" />
            <div className="space-y-1">
              <h4 className="font-serif text-sm font-semibold text-[#241E1C]">
                Đang giải mã mô hình áo 3D...
              </h4>
              <p className="text-xs text-stone-600">
                {loadingProgress > 0 ? `Đang nạp: ${loadingProgress}%` : 'Đang xử lý cấu trúc lưới và vật liệu'}
              </p>
            </div>
          </div>
        )}

        {/* LOADING OVERLAY (Accessory) */}
        {isAccessoryLoading && !isCurrentlyLoading && (
          <div className="absolute top-3 right-3 z-30 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xs border border-[#1B4D3E]/30 shadow-md flex items-center gap-2 text-xs text-[#1B4D3E]">
            <div className="w-3.5 h-3.5 border-2 border-[#1B4D3E]/20 border-t-[#1B4D3E] rounded-full animate-spin" />
            <span>Đang giải mã quạt 3D ({accessoryLoadingProgress}%)...</span>
          </div>
        )}

        {/* LOADING OVERLAY (Hat) */}
        {isHatLoading && !isCurrentlyLoading && (
          <div className="absolute top-12 right-3 z-30 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xs border border-amber-300 shadow-md flex items-center gap-2 text-xs text-amber-900">
            <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-amber-800 rounded-full animate-spin" />
            <span>Đang giải mã nón lá 3D ({hatLoadingProgress}%)...</span>
          </div>
        )}

        {/* LOADING OVERLAY (Bag) */}
        {isBagLoading && !isCurrentlyLoading && (
          <div className="absolute top-21 right-3 z-30 bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xs border border-amber-400 shadow-md flex items-center gap-2 text-xs text-amber-950">
            <div className="w-3.5 h-3.5 border-2 border-amber-500 border-t-amber-900 rounded-full animate-spin" />
            <span>Đang giải mã túi cói 3D ({bagLoadingProgress}%)...</span>
          </div>
        )}

        {/* ERROR MESSAGE NOTIFICATION */}
        {errorMessage && (
          <div className="relative z-30 m-4 p-3.5 bg-red-50 border border-red-300 rounded-sm text-xs text-red-800 space-y-2 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <strong className="block font-semibold">Lỗi nạp mô hình 3D</strong>
                <p className="text-[11px] leading-relaxed text-red-700">{errorMessage}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1 border-t border-red-200">
              {activeRecord && (
                <button
                  type="button"
                  onClick={handleRetryCurrentModel}
                  className="px-2.5 py-1 bg-white hover:bg-stone-50 border border-red-300 text-red-800 rounded-xs text-[11px] font-medium cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Thử lại tệp này</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded-xs text-[11px] font-semibold cursor-pointer"
              >
                Chọn tệp khác
              </button>
            </div>
          </div>
        )}

        {/* ACCESSORY ERROR NOTIFICATION */}
        {accessoryError && (
          <div className="relative z-30 m-3 p-2 bg-red-50 border border-red-200 rounded-xs text-[11px] text-red-700 flex items-center justify-between gap-2">
            <span>{accessoryError}</span>
            <button
              type="button"
              onClick={() => setAccessoryError(null)}
              className="text-red-500 hover:text-red-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* HAT ERROR NOTIFICATION */}
        {hatError && (
          <div className="relative z-30 m-3 p-2 bg-amber-50 border border-amber-300 rounded-xs text-[11px] text-amber-900 flex items-center justify-between gap-2">
            <span>{hatError}</span>
            <button
              type="button"
              onClick={() => setHatError(null)}
              className="text-amber-700 hover:text-amber-950"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* BAG ERROR NOTIFICATION */}
        {bagError && (
          <div className="relative z-30 m-3 p-2 bg-amber-50 border border-amber-300 rounded-xs text-[11px] text-amber-950 flex items-center justify-between gap-2">
            <span>{bagError}</span>
            <button
              type="button"
              onClick={() => setBagError(null)}
              className="text-amber-800 hover:text-amber-950"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* EMPTY STATE DROPZONE */}
        {!isModelReady && !isCurrentlyLoading && !errorMessage && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full h-full p-6 flex flex-col items-center justify-between text-center transition-all ${
              isDraggingOver ? 'bg-[#8B2626]/5 border-2 border-dashed border-[#8B2626]' : ''
            }`}
          >
            {/* Top header status */}
            <div className="w-full flex items-center justify-between text-[11px] border-b border-[#241E1C]/10 pb-2.5">
              <span className="font-semibold text-[#8B2626] flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <Compass className="w-3.5 h-3.5" />
                <span>Trình Xem Mô Hình 3D Thật (GLB)</span>
              </span>
              <span className="text-stone-500">Three.js Engine</span>
            </div>

            {/* Center Dropzone Area */}
            <div className="my-auto space-y-3 max-w-sm">
              <div className="w-14 h-14 mx-auto rounded-full bg-white border border-[#241E1C]/15 flex items-center justify-center shadow-xs text-[#8B2626]">
                <Upload className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="font-serif text-base font-semibold text-[#241E1C]">
                  Tải mô hình .glb từ máy tính
                </h3>
                <p className="text-xs text-[#241E1C]/75 leading-relaxed">
                  Hỗ trợ tải áo chính (<code>tu-than-color.glb</code>, <code>ao-dai-blue.glb</code>,{' '}
                  <code>nhat-binh.glb</code>) và các phụ kiện riêng (<code>fan-decorated.glb</code>,{' '}
                  <code>hat-non-la.glb</code>, <code>woven-tote.glb</code>).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2 bg-[#8B2626] hover:bg-[#741E1E] text-white text-xs font-semibold rounded-xs shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-2 active:scale-98"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tải mô hình áo .glb</span>
                </button>

                <button
                  type="button"
                  onClick={() => hatFileInputRef.current?.click()}
                  className="w-full sm:w-auto px-3.5 py-2 bg-white hover:bg-amber-50 text-amber-900 border border-amber-600 text-xs font-semibold rounded-xs shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <NonLaIcon className="w-3.5 h-3.5 text-amber-800" />
                  <span>Tải nón lá .glb</span>
                </button>

                <button
                  type="button"
                  onClick={() => accessoryFileInputRef.current?.click()}
                  className="w-full sm:w-auto px-3.5 py-2 bg-white hover:bg-[#1B4D3E]/5 text-[#1B4D3E] border border-[#1B4D3E] text-xs font-semibold rounded-xs shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <Fan className="w-3.5 h-3.5" />
                  <span>Tải quạt .glb</span>
                </button>

                <button
                  type="button"
                  onClick={() => bagFileInputRef.current?.click()}
                  className="w-full sm:w-auto px-3.5 py-2 bg-white hover:bg-amber-50 text-amber-950 border border-amber-700 text-xs font-semibold rounded-xs shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <WovenBagIcon className="w-3.5 h-3.5 text-amber-900" />
                  <span>Tải túi cói .glb</span>
                </button>
              </div>

              {/* Model Availability Notice */}
              <div className="p-2.5 bg-white/85 rounded-xs border border-[#241E1C]/10 text-left text-[11px] space-y-1">
                <div className="font-semibold text-[#241E1C] flex items-center justify-between">
                  <span>Dòng áo đang chọn: {currentGarmentName}</span>
                  <span className="text-[10px] text-stone-500">Mã: {currentGarmentId}</span>
                </div>
                <p className="text-stone-600 leading-relaxed text-[10px]">
                  {availability.notice}
                </p>
                {availability.hasSampleFile && (
                  <div className="text-[10px] text-[#1B4D3E] font-medium pt-0.5 border-t border-[#241E1C]/5">
                    ✓ Tệp mẫu tương ứng: <code>{availability.suggestedFilename}</code>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Security / Privacy notice */}
            <div className="w-full bg-white/80 p-2 rounded-xs border border-[#241E1C]/10 text-[10px] text-stone-600 text-left flex items-center justify-between">
              <div className="flex items-center gap-1 text-[#8B2626] font-medium">
                <Info className="w-3 h-3 shrink-0" />
                <span>Xử lý cục bộ bằng File API · Kéo chuột để xoay, cuộn chuột để zoom</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. COMPACT ATTRIBUTION & SOURCE INFO (NẰM DƯỚI CANVAS - KHÔNG CHE MÔ HÌNH) */}
      {isModelReady && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
          {/* Garment Attribution */}
          {activeRecord && (
            <div className="bg-[#FAF7F2] p-2.5 rounded-sm border border-[#241E1C]/10 space-y-1 text-left">
              <div className="flex items-center justify-between">
                <strong className="text-[#8B2626] text-[11px]">
                  {modelMeta?.title || activeRecord.fileName}
                </strong>
                <span className="text-[10px] px-1.5 py-0.2 bg-[#8B2626]/10 text-[#8B2626] font-semibold rounded-xs">
                  {modelMeta?.license || 'CC BY 4.0'}
                </span>
              </div>
              <div className="text-[10px] text-stone-600 flex flex-wrap items-center justify-between gap-1 pt-0.5 border-t border-[#241E1C]/5">
                <span>Tác giả: <strong>{modelMeta?.author || 'ghostnoface trên Sketchfab'}</strong></span>
                {modelMeta?.sourceUrl && (
                  <a
                    href={modelMeta.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8B2626] hover:underline inline-flex items-center gap-0.5 font-medium"
                  >
                    <span>Sketchfab</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Accessory Attribution (Quạt) */}
          {accessoryModel && (
            <div className="bg-[#FAF7F2] p-2.5 rounded-sm border border-[#1B4D3E]/20 space-y-1 text-left">
              <div className="flex items-center justify-between">
                <strong className="text-[#1B4D3E] text-[11px]">
                  {accessoryMeta?.title || accessoryModel.fileName}
                </strong>
                <span className="text-[10px] px-1.5 py-0.2 bg-[#1B4D3E]/10 text-[#1B4D3E] font-semibold rounded-xs">
                  {accessoryMeta?.license || 'CC BY 4.0'}
                </span>
              </div>
              <div className="text-[10px] text-stone-600 flex flex-wrap items-center justify-between gap-1 pt-0.5 border-t border-[#1B4D3E]/10">
                <span>Tác giả: <strong>{accessoryMeta?.author || 'staceyneko0415 trên Sketchfab'}</strong></span>
                {accessoryMeta?.sourceUrl && (
                  <a
                    href={accessoryMeta.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1B4D3E] hover:underline inline-flex items-center gap-0.5 font-medium"
                  >
                    <span>Sketchfab</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Hat Attribution (Nón Lá) */}
          {hatModel && (
            <div className="bg-[#FAF7F2] p-2.5 rounded-sm border border-amber-300 space-y-1 text-left">
              <div className="flex items-center justify-between">
                <strong className="text-amber-900 text-[11px] flex items-center gap-1">
                  <NonLaIcon className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                  <span>{hatMeta?.title || hatModel.fileName}</span>
                </strong>
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-900 font-semibold rounded-xs">
                  {hatMeta?.license || 'CC BY 4.0'}
                </span>
              </div>
              <p className="text-[10px] text-amber-800 leading-tight">
                {hatMeta?.cautionNotice || 'Mô hình 3D minh họa phục vụ trải nghiệm không gian số, chưa phải tư liệu xác thực tuyệt đối về mặt khảo cứu lịch sử trang phục.'}
              </p>
              <div className="text-[10px] text-stone-600 flex flex-wrap items-center justify-between gap-1 pt-0.5 border-t border-amber-200">
                <span>Tác giả: <strong>{hatMeta?.author || 'Sketchfab Community'}</strong></span>
                {hatMeta?.sourceUrl && (
                  <a
                    href={hatMeta.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-900 hover:underline inline-flex items-center gap-0.5 font-medium"
                  >
                    <span>Sketchfab</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Bag Attribution (Túi Cói) */}
          {bagModel && (
            <div className="bg-[#FAF7F2] p-2.5 rounded-sm border border-amber-400 space-y-1 text-left">
              <div className="flex items-center justify-between">
                <strong className="text-amber-950 text-[11px] flex items-center gap-1">
                  <WovenBagIcon className="w-3.5 h-3.5 text-amber-900 shrink-0" />
                  <span>{bagMeta?.title || bagModel.fileName}</span>
                </strong>
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-950 font-semibold rounded-xs">
                  {bagMeta?.license || 'CC BY 4.0 / Open Asset'}
                </span>
              </div>
              <p className="text-[10px] text-amber-900 leading-tight">
                {bagMeta?.cautionNotice || 'Mô hình 3D minh họa độc lập cho phụ kiện túi cói xách tay, chưa phải tư liệu xác thực tuyệt đối về lịch sử hay phục dựng truyền thống.'}
              </p>
              <div className="text-[10px] text-stone-600 flex flex-wrap items-center justify-between gap-1 pt-0.5 border-t border-amber-200">
                <span>Tác giả: <strong>{bagMeta?.author || 'Tài nguyên 3D cộng đồng (Chưa xác minh đầy đủ danh tính)'}</strong></span>
                {bagMeta?.sourceUrl && (
                  <a
                    href={bagMeta.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-900 hover:underline inline-flex items-center gap-0.5 font-medium"
                  >
                    <span>Nguồn tham khảo</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. SESSION MODEL MANAGER (QUẢN LÝ TỆP ĐÃ NẠP TRONG PHIÊN - CHỈ HIỂN THỊ KHI BẬT NÂNG CAO) */}
      {showAdvancedSettings && (
        <div className="bg-[#FAF7F2] p-3.5 rounded-sm border border-[#241E1C]/15 space-y-3 animate-in fade-in">
        {/* Panel Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#241E1C]/10 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-xs bg-[#8B2626]/10 text-[#8B2626]">
              <Box className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-serif text-xs font-semibold text-[#241E1C] flex items-center gap-1.5">
                <span>Danh mục mô hình 3D trong phiên</span>
                <span className="font-sans text-[10px] px-1.5 py-0.2 rounded-full bg-[#8B2626] text-white font-medium">
                  {loadedModels.length + (accessoryModel ? 1 : 0) + (hatModel ? 1 : 0) + (bagModel ? 1 : 0)} tệp
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {(loadedModels.length > 0 || accessoryModel || hatModel || bagModel) && (
              <button
                type="button"
                onClick={() => {
                  handleClearAllModels();
                  handleRemoveAccessory();
                  handleRemoveHat();
                  handleRemoveBag();
                }}
                className="px-2 py-1 text-[11px] text-stone-600 hover:text-red-700 hover:bg-red-50 rounded-xs transition-colors cursor-pointer"
                title="Gỡ toàn bộ mô hình khỏi phiên"
              >
                Gỡ tất cả
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowModernCatalogModal(true)}
              className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 text-[11px] font-medium rounded-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
              title="Xem danh mục các mô hình trang phục hiện đại bổ sung (quần cargo, áo thun, áo khoác)"
            >
              <Box className="w-3 h-3 text-[#8B2626]" />
              <span>Kho mẫu hiện đại ({MODERN_EXPERIMENTAL_MODELS.length})</span>
            </button>

            <button
              type="button"
              onClick={() => bagFileInputRef.current?.click()}
              className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-950 border border-amber-700 text-[11px] font-medium rounded-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <WovenBagIcon className="w-3 h-3 text-amber-900" />
              <span>Nạp túi cói .glb</span>
            </button>

            <button
              type="button"
              onClick={() => hatFileInputRef.current?.click()}
              className="px-2.5 py-1 bg-white hover:bg-amber-50 text-amber-900 border border-amber-600 text-[11px] font-medium rounded-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <NonLaIcon className="w-3 h-3 text-amber-800" />
              <span>Nạp nón lá .glb</span>
            </button>

            <button
              type="button"
              onClick={() => accessoryFileInputRef.current?.click()}
              className="px-2.5 py-1 bg-white hover:bg-stone-50 text-[#1B4D3E] border border-[#1B4D3E] text-[11px] font-medium rounded-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <Fan className="w-3 h-3" />
              <span>Nạp quạt .glb</span>
            </button>

            <button
              type="button"
              onClick={() => additionalFileInputRef.current?.click()}
              className="px-2.5 py-1 bg-[#8B2626] hover:bg-[#741E1E] text-white text-[11px] font-medium rounded-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <Upload className="w-3 h-3" />
              <span>Nạp thêm áo .glb</span>
            </button>
          </div>
        </div>

        {/* SECTION: TÚI CÓI PHỤ KIỆN */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-950 flex items-center gap-1.5">
              <WovenBagIcon className="w-3.5 h-3.5 text-amber-900" />
              <span>Phụ kiện 3D: Túi cói đan mộc (woven-tote.glb)</span>
            </span>
          </div>

          {bagModel ? (
            <div className="p-2.5 bg-white rounded-xs border border-amber-400 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-amber-800 shrink-0" />
                <strong className="text-amber-950 truncate">{bagMeta?.title || bagModel.fileName}</strong>
                <span className="text-[10px] text-stone-500 font-mono">({formatFileSize(bagModel.fileSizeBytes)})</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-xs font-medium ${isBagVisible ? 'bg-amber-100 text-amber-950' : 'bg-stone-100 text-stone-600'}`}>
                  {isBagVisible ? 'Đang hiện' : 'Đang ẩn'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsBagVisible(!isBagVisible)}
                  className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xs text-[11px] font-medium cursor-pointer flex items-center gap-1"
                >
                  {isBagVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{isBagVisible ? 'Ẩn' : 'Hiện'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveAccessoryTab('bag');
                    setShowAccessoryControls(true);
                  }}
                  className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-xs text-[11px] font-medium cursor-pointer flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Chỉnh vị trí</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemoveBag}
                  className="p-1 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-xs transition-colors cursor-pointer"
                  title="Gỡ túi cói"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-white/70 rounded-xs border border-dashed border-stone-300 flex items-center justify-between gap-2 text-xs">
              <span className="text-stone-500">Chưa nạp tệp túi cói woven-tote.glb vào phiên.</span>
              <button
                type="button"
                onClick={() => bagFileInputRef.current?.click()}
                className="px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded-xs text-[11px] font-medium cursor-pointer inline-flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                <span>Nạp túi cói</span>
              </button>
            </div>
          )}
        </div>

        {/* SECTION: NÓN LÁ PHỤ KIỆN */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-amber-900 flex items-center gap-1.5">
              <NonLaIcon className="w-3.5 h-3.5 text-amber-800" />
              <span>Phụ kiện 3D: Nón lá Việt Nam (hat-non-la.glb)</span>
            </span>
          </div>

          {hatModel ? (
            <div className="p-2.5 bg-white rounded-xs border border-amber-300 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-amber-700 shrink-0" />
                <strong className="text-amber-950 truncate">{hatMeta?.title || hatModel.fileName}</strong>
                <span className="text-[10px] text-stone-500 font-mono">({formatFileSize(hatModel.fileSizeBytes)})</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-xs font-medium ${isHatVisible ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-600'}`}>
                  {isHatVisible ? 'Đang hiện' : 'Đang ẩn'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsHatVisible(!isHatVisible)}
                  className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xs text-[11px] font-medium cursor-pointer flex items-center gap-1"
                >
                  {isHatVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{isHatVisible ? 'Ẩn' : 'Hiện'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveAccessoryTab('hat');
                    setShowAccessoryControls(true);
                  }}
                  className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xs text-[11px] font-medium cursor-pointer flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Chỉnh vị trí</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemoveHat}
                  className="p-1 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-xs transition-colors cursor-pointer"
                  title="Gỡ nón lá"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-white/70 rounded-xs border border-dashed border-stone-300 flex items-center justify-between gap-2 text-xs">
              <span className="text-stone-500">Chưa nạp tệp nón lá hat-non-la.glb vào phiên.</span>
              <button
                type="button"
                onClick={() => hatFileInputRef.current?.click()}
                className="px-2.5 py-1 bg-[#8B2626] hover:bg-[#741E1E] text-white rounded-xs text-[11px] font-medium cursor-pointer inline-flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                <span>Nạp nón lá</span>
              </button>
            </div>
          )}
        </div>

        {/* SECTION: QUẠT PHỤ KIỆN */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#1B4D3E] flex items-center gap-1.5">
              <Fan className="w-3.5 h-3.5" />
              <span>Phụ kiện 3D: Quạt cầm tay (fan-decorated.glb)</span>
            </span>
          </div>

          {accessoryModel ? (
            <div className="p-2.5 bg-white rounded-xs border border-[#1B4D3E]/30 shadow-2xs flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-[#1B4D3E] shrink-0" />
                <strong className="text-[#1B4D3E] truncate">{accessoryMeta?.title || accessoryModel.fileName}</strong>
                <span className="text-[10px] text-stone-500 font-mono">({formatFileSize(accessoryModel.fileSizeBytes)})</span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded-xs font-medium ${isAccessoryVisible ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>
                  {isAccessoryVisible ? 'Đang hiện' : 'Đang ẩn'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsAccessoryVisible(!isAccessoryVisible)}
                  className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xs text-[11px] font-medium cursor-pointer flex items-center gap-1"
                >
                  {isAccessoryVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{isAccessoryVisible ? 'Ẩn' : 'Hiện'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAccessoryControls(!showAccessoryControls)}
                  className="px-2 py-1 bg-[#1B4D3E]/10 hover:bg-[#1B4D3E]/20 text-[#1B4D3E] rounded-xs text-[11px] font-medium cursor-pointer flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Chỉnh vị trí</span>
                </button>

                <button
                  type="button"
                  onClick={handleRemoveAccessory}
                  className="p-1 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-xs transition-colors cursor-pointer"
                  title="Gỡ quạt"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-white/70 rounded-xs border border-dashed border-stone-300 flex items-center justify-between gap-2 text-xs">
              <span className="text-stone-500">Chưa nạp tệp quạt fan-decorated.glb vào phiên.</span>
              <button
                type="button"
                onClick={() => accessoryFileInputRef.current?.click()}
                className="px-2.5 py-1 bg-[#1B4D3E] hover:bg-[#153e32] text-white rounded-xs text-[11px] font-medium cursor-pointer inline-flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                <span>Nạp quạt</span>
              </button>
            </div>
          )}
        </div>

        {/* SECTION: DANH SÁCH ÁO CHÍNH */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#8B2626] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Mô hình áo chính ({loadedModels.length})</span>
            </span>
          </div>

          {loadedModels.length === 0 ? (
            <div className="p-3 bg-white rounded-xs border border-dashed border-[#241E1C]/20 text-center text-xs text-stone-500">
              Chưa có mô hình áo nào được nạp vào phiên làm việc.
            </div>
          ) : (
            <div className="space-y-1.5">
              {loadedModels.map((item) => {
                const isActive = item.id === activeModelId;
                const matchesCurrentGarment =
                  (item.assignedGarmentId === 'ao-tu-than' && currentGarmentId === 'ao-tu-than') ||
                  (item.assignedGarmentId === 'ao-dai-hien-dai' && currentGarmentId === 'ao-dai-hien-dai') ||
                  (item.assignedGarmentId === 'ao-nhat-binh' && currentGarmentId === 'ao-nhat-binh') ||
                  (item.assignedGarmentId === 'ao-ngu-than' &&
                    (currentGarmentId === 'ngu-than-tay-chen' || currentGarmentId === 'ao-tac-ngu-than-tay-thung'));

                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xs border transition-all text-xs flex flex-wrap items-center justify-between gap-2 ${
                      isActive
                        ? 'bg-white border-[#8B2626] shadow-2xs ring-1 ring-[#8B2626]/20'
                        : 'bg-white/80 hover:bg-white border-[#241E1C]/10'
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-[#8B2626] animate-pulse' : matchesCurrentGarment ? 'bg-[#1B4D3E]' : 'bg-stone-300'}`} />
                      <strong className="text-[#241E1C] truncate max-w-[150px] sm:max-w-[220px]" title={item.fileName}>
                        {item.matchedMeta?.title || item.fileName}
                      </strong>
                      <span className="text-[10px] text-stone-500 font-mono">({formatFileSize(item.fileSizeBytes)})</span>

                      <div className="flex items-center gap-1 text-[10px] text-stone-600">
                        <span>Gắn dòng:</span>
                        <select
                          value={item.assignedGarmentId}
                          onChange={(e) => handleUpdateAssignedGarment(item.id, e.target.value)}
                          className="bg-[#FAF7F2] border border-[#241E1C]/20 px-1 py-0.2 rounded-xs text-[10px] font-medium text-[#241E1C] focus:outline-none focus:border-[#8B2626]"
                        >
                          {GARMENTS_ASSIGNABLE_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                      {!isActive ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (activeModelId !== item.id) {
                              setActiveModelId(item.id);
                            }
                          }}
                          className="px-2 py-1 bg-stone-100 hover:bg-[#8B2626] hover:text-white text-[#241E1C] rounded-xs font-medium text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Xem áo này</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#8B2626] font-medium flex items-center gap-1 px-1.5 py-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đang hiển thị</span>
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveGarmentModel(item.id)}
                        className="p-1 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-xs transition-colors cursor-pointer"
                        title="Gỡ mô hình này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notice */}
        <div className="p-2.5 bg-white/90 rounded-xs border border-[#241E1C]/10 text-[10px] text-stone-600 space-y-0.5">
          <div className="flex items-center gap-1.5 font-semibold text-[#8B2626]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Đồng bộ tọa độ & Khung nhìn</span>
          </div>
          <p className="leading-relaxed">
            Các phụ kiện (quạt cầm tay, nón lá, túi cói) được neo vào các vị trí tự nhiên (ống tay phải, đỉnh cổ áo, tay áo trái) và điều chỉnh độc lập qua sliders. Các thao tác di chuyển, đổi góc xoay, lưu mặc định hoặc ẩn/hiện từng món <strong>hoàn toàn độc lập và không kích hoạt nạp lại mô hình áo hay các phụ kiện còn lại</strong>.
          </p>
        </div>
      </div>
      )}

      {/* MODAL: DANH MỤC CÁC MÔ HÌNH HIỆN ĐẠI BỔ SUNG (GHI NHẬN RIÊNG) */}
      {showModernCatalogModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modern-catalog-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-[#FAF7F2] rounded-md border border-[#241E1C]/20 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-[#241E1C]">
            {/* Modal Header */}
            <div className="p-4 bg-white border-b border-[#241E1C]/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#8B2626]/10 text-[#8B2626] rounded-xs">
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="modern-catalog-modal-title" className="font-serif text-base font-bold text-[#241E1C]">
                    Kho Mô Hình Trang Phục Hiện Đại Mới ({MODERN_EXPERIMENTAL_MODELS.length} mẫu)
                  </h3>
                  <p className="text-xs text-stone-600">
                    Ghi nhận sẵn trong hệ thống để chuẩn bị cho các thử nghiệm phối đương đại
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModernCatalogModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xs transition-colors cursor-pointer"
                title="Đóng hộp thoại"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
              <div className="p-3 bg-amber-50 rounded-xs border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong>Lưu ý kiến trúc:</strong> Các mô hình hiện đại (quần cargo, áo thun, áo khoác denim, chân váy) này đã có sẵn trong thư mục <code className="bg-amber-100/70 px-1 py-0.5 rounded text-[11px] font-mono">public/models</code> và được ghi nhận riêng biệt trong catalog. Theo yêu cầu, chúng chưa tự động ghép vào các mẫu Việt phục truyền thống để giữ chuẩn mực thẩm mỹ và cấu trúc trang phục.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {MODERN_EXPERIMENTAL_MODELS.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white rounded-xs border border-[#241E1C]/10 shadow-2xs hover:border-[#8B2626]/40 transition-colors flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <strong className="text-[#241E1C] font-semibold text-xs truncate" title={item.title}>
                          {item.title}
                        </strong>
                        <span className="text-[10px] px-1.5 py-0.2 bg-stone-100 text-stone-600 font-mono rounded-2xs shrink-0">
                          {formatFileSize(item.fileSizeBytes)}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#8B2626] font-mono truncate mb-1.5">
                        {item.filename}
                      </div>
                      <p className="text-[11px] text-stone-600 leading-snug line-clamp-3">
                        {item.note}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[10px] text-stone-500">
                      <span className="capitalize px-1.5 py-0.2 bg-stone-100 rounded-2xs text-stone-700 font-medium">
                        Phân loại: {item.category === 'pants' ? 'Quần' : item.category === 'shirt' ? 'Áo thun/sơ mi' : item.category === 'jacket' ? 'Áo khoác' : item.category === 'skirt' ? 'Chân váy' : 'Bộ phối'}
                      </span>
                      <span className="text-emerald-700 font-medium">✓ Sẵn sàng</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-white border-t border-[#241E1C]/10 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowModernCatalogModal(false)}
                className="px-4 py-1.5 bg-[#241E1C] hover:bg-[#3D3330] text-[#FAF7F2] text-xs font-semibold rounded-xs transition-colors cursor-pointer"
              >
                Đã hiểu & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
