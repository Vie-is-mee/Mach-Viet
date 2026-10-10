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
} from 'lucide-react';
import {
  matchUploadedModelMeta,
  getGarmentModelAvailability,
  detectGarmentFromFilename,
  SampleModelMeta,
  SessionModelRecord,
  GARMENTS_ASSIGNABLE_OPTIONS,
} from '../data/modelCatalog';

export interface GlbModelViewerProps {
  currentGarmentId: string;
  currentGarmentName: string;
  onSyncGarment?: (garmentId: string) => void;
  onModelLoaded?: (fileName: string, garmentType: string) => void;
  onModelError?: (error: string) => void;
  onModelCleared?: () => void;
}

type ViewerStatus = 'idle' | 'loading' | 'ready' | 'error';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB limit

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

// Phụ kiện cầm tay trong danh mục
export interface AccessoryModelRecord {
  id: string;
  file: File;
  fileName: string;
  fileSizeBytes: number;
  matchedMeta: SampleModelMeta | null;
  uploadedAt: string;
  dimensions?: { width: number; height: number; depth: number };
}

export const GlbModelViewer: React.FC<GlbModelViewerProps> = ({
  currentGarmentId,
  currentGarmentName,
  onSyncGarment,
  onModelLoaded,
  onModelError,
  onModelCleared,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const additionalFileInputRef = useRef<HTMLInputElement>(null);
  const accessoryFileInputRef = useRef<HTMLInputElement>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);

  // Separate Object Groups for Garment and Accessory
  const garmentGroupRef = useRef<THREE.Group | null>(null);
  const accessoryPivotRef = useRef<THREE.Group | null>(null);
  const accessoryRotatorRef = useRef<THREE.Group | null>(null);
  const accessoryInnerModelRef = useRef<THREE.Group | null>(null);

  const animationFrameIdRef = useRef<number | null>(null);
  const initialViewRef = useRef<{ cameraPos: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  // Session & Loading Control Refs (Preventing duplicate/infinite load loops)
  const currentLoadedGarmentIdRef = useRef<string | null>(null);
  const garmentLoadGenRef = useRef<number>(0);

  const currentLoadedAccessoryIdRef = useRef<string | null>(null);
  const accessoryLoadGenRef = useRef<number>(0);

  // Stabilize external callbacks
  const onSyncGarmentRef = useRef(onSyncGarment);
  onSyncGarmentRef.current = onSyncGarment;
  const onModelLoadedRef = useRef(onModelLoaded);
  onModelLoadedRef.current = onModelLoaded;
  const onModelErrorRef = useRef(onModelError);
  onModelErrorRef.current = onModelError;
  const onModelClearedRef = useRef(onModelCleared);
  onModelClearedRef.current = onModelCleared;

  // Garment models session state
  const [loadedModels, setLoadedModels] = useState<SessionModelRecord[]>([]);
  const loadedModelsRef = useRef<SessionModelRecord[]>([]);
  loadedModelsRef.current = loadedModels;
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  // Accessory model state (Quạt cầm tay riêng biệt)
  const [accessoryModel, setAccessoryModel] = useState<AccessoryModelRecord | null>(null);
  const accessoryModelRef = useRef<AccessoryModelRecord | null>(null);
  accessoryModelRef.current = accessoryModel;
  const [isAccessoryLoading, setIsAccessoryLoading] = useState<boolean>(false);
  const [accessoryLoadingProgress, setAccessoryLoadingProgress] = useState<number>(0);
  const [accessoryError, setAccessoryError] = useState<string | null>(null);

  // Anchor helper 3D indicator reference
  const anchorHelperRef = useRef<THREE.Group | null>(null);
  const [showAnchorHelper, setShowAnchorHelper] = useState<boolean>(false);
  const [resetFeedbackNotice, setResetFeedbackNotice] = useState<string | null>(null);

  // Accessory fine-tuning transform settings
  // Default anchor loaded from user-saved preset, session storage, or calibrated garment presets
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
  const [isAccessoryVisible, setIsAccessoryVisible] = useState<boolean>(true);
  const [showAccessoryControls, setShowAccessoryControls] = useState<boolean>(true);

  // Grid visibility toggle (Ẩn mặc định theo yêu cầu người dùng để không rối tà áo)
  const [showGrid, setShowGrid] = useState<boolean>(false);

  // Viewer state
  const [viewerStatus, setViewerStatus] = useState<ViewerStatus>('idle');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

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
  }, [currentGarmentId, activeModelId, accessoryModel?.fileName, activeRecord?.fileName]);

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
    setIsAccessoryVisible(true);

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

  // Preset các góc nhìn camera để kiểm tra vị trí quạt và đầu ống tay
  const setPresetCameraAngle = (view: 'front' | 'perspective' | 'side') => {
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
  }, [disposeGroup]);

  const disposeCurrentAccessory = useCallback(() => {
    if (accessoryPivotRef.current && sceneRef.current) {
      disposeGroup(accessoryPivotRef.current);
      sceneRef.current.remove(accessoryPivotRef.current);
      accessoryPivotRef.current = null;
      accessoryRotatorRef.current = null;
      accessoryInnerModelRef.current = null;
    }
  }, [disposeGroup]);

  // Recalculate camera framing to encompass both garment and accessory comfortably
  const updateCameraFraming = useCallback(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!scene || !camera || !controls) return;

    const combinedBox = new THREE.Box3();
    let hasObjects = false;

    if (garmentGroupRef.current) {
      combinedBox.expandByObject(garmentGroupRef.current);
      hasObjects = true;
    }

    if (accessoryPivotRef.current && isAccessoryVisible) {
      combinedBox.expandByObject(accessoryPivotRef.current);
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
  }, [isAccessoryVisible]);

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

      if (anchorHelperRef.current && sceneRef.current) {
        sceneRef.current.remove(anchorHelperRef.current);
        anchorHelperRef.current = null;
      }

      renderer.dispose();

      if (container && renderer.domElement) {
        renderer.domElement.remove();
      }
    };
  }, [disposeCurrentGarment, disposeCurrentAccessory]);

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
    if (!activeModelId) {
      if (currentLoadedGarmentIdRef.current !== null) {
        disposeCurrentGarment();
        currentLoadedGarmentIdRef.current = null;
      }
      setViewerStatus(accessoryModelRef.current ? 'ready' : 'idle');
      return;
    }

    if (currentLoadedGarmentIdRef.current === activeModelId && viewerStatus === 'ready') {
      return;
    }

    const targetRecord = loadedModelsRef.current.find((m) => m.id === activeModelId);
    if (!targetRecord) {
      return;
    }

    const thisGeneration = ++garmentLoadGenRef.current;

    setErrorMessage(null);
    setViewerStatus('loading');
    setLoadingProgress(0);

    const file = targetRecord.file;
    const fileNameLower = file.name.toLowerCase();

    if (!fileNameLower.endsWith('.glb')) {
      setErrorMessage(
        'Định dạng không được hỗ trợ. Trình xem chỉ tiếp nhận tệp mô hình 3D chuẩn Binary glTF 2.0 (.glb).'
      );
      setViewerStatus('error');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setErrorMessage(
        `Kích thước tệp (${sizeMb} MB) vượt quá giới hạn an toàn 50 MB. Vui lòng tối ưu dung lượng tệp .glb trước khi nạp.`
      );
      setViewerStatus('error');
      return;
    }

    disposeCurrentGarment();

    const objectUrl = URL.createObjectURL(file);
    const loader = new GLTFLoader();

    loader.load(
      objectUrl,
      (gltf) => {
        URL.revokeObjectURL(objectUrl);

        if (garmentLoadGenRef.current !== thisGeneration) {
          disposeGroup(gltf.scene);
          return;
        }

        const scene = sceneRef.current;
        if (!scene) {
          setViewerStatus('idle');
          return;
        }

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
        scene.add(model);
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
        setViewerStatus('ready');
        setLoadingProgress(100);

        setLoadedModels((prev) =>
          prev.map((m) => (m.id === targetRecord.id ? { ...m, dimensions } : m))
        );

        updateCameraFraming();
        onModelLoadedRef.current?.(file.name, targetRecord.assignedGarmentId);
      },
      (progress) => {
        if (garmentLoadGenRef.current !== thisGeneration) return;
        if (progress.total > 0) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          setLoadingProgress(percent);
        }
      },
      (error) => {
        URL.revokeObjectURL(objectUrl);
        if (garmentLoadGenRef.current !== thisGeneration) return;
        console.error('Lỗi nạp mô hình GLB áo:', error);
        const errText =
          'Không thể giải mã mô hình áo. Tệp có thể bị hỏng, mã hóa không đúng chuẩn Binary glTF 2.0 (.glb), hoặc thiếu tài nguyên texture đi kèm.';
        setErrorMessage(errText);
        setViewerStatus('error');
        currentLoadedGarmentIdRef.current = null;
        onModelErrorRef.current?.(errText);
      }
    );
  }, [activeModelId, retryTrigger, disposeCurrentGarment, disposeGroup, updateCameraFraming, computeRightSleeveSuggestedPos, currentGarmentId]);

  // ==========================================
  // EFFECT 2: LOAD ACCESSORY MODEL (QUẠT RIÊNG BIỆT - KHÔNG TẢI LẠI ÁO)
  // ==========================================
  useEffect(() => {
    if (!accessoryModel) {
      if (currentLoadedAccessoryIdRef.current !== null) {
        disposeCurrentAccessory();
        currentLoadedAccessoryIdRef.current = null;
        updateCameraFraming();
      }
      return;
    }

    if (currentLoadedAccessoryIdRef.current === accessoryModel.id) {
      return;
    }

    const thisAccessoryGen = ++accessoryLoadGenRef.current;
    setIsAccessoryLoading(true);
    setAccessoryLoadingProgress(0);
    setAccessoryError(null);

    const file = accessoryModel.file;
    if (!file.name.toLowerCase().endsWith('.glb')) {
      setAccessoryError('Tệp phụ kiện phải có định dạng .glb.');
      setIsAccessoryLoading(false);
      return;
    }

    disposeCurrentAccessory();

    const objectUrl = URL.createObjectURL(file);
    const loader = new GLTFLoader();

    loader.load(
      objectUrl,
      (gltf) => {
        URL.revokeObjectURL(objectUrl);

        if (accessoryLoadGenRef.current !== thisAccessoryGen) {
          disposeGroup(gltf.scene);
          return;
        }

        const scene = sceneRef.current;
        if (!scene) {
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
        // Đặt điểm xoay (pivot) tại đáy quạt (rawBox.min.y) - nơi có chuôi/cán quạt và đinh tán nan quạt.
        // Nhờ vậy khi xoay góc hay căn điểm neo, cán quạt luôn nằm chính xác ở vị trí cầm của ống tay áo!
        fanModel.position.x = -center.x;
        fanModel.position.y = -rawBox.min.y;
        fanModel.position.z = -center.z;
        fanModel.rotation.set(0, 0, 0);

        // Đảm bảo phụ kiện quạt luôn render rõ nét phía trước vải áo, tránh lỗi depth conflict
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

        // Position: use target offset
        pivot.position.set(targetAnchor.x, targetAnchor.y, targetAnchor.z);
        pivot.scale.set(targetAnchor.scale, targetAnchor.scale, targetAnchor.scale);
        pivot.visible = isAccessoryVisible;

        accessoryPivotRef.current = pivot;
        scene.add(pivot);

        setShowAccessoryControls(true);

        const dimensions = {
          width: Number(size.x.toFixed(2)),
          height: Number(size.y.toFixed(2)),
          depth: Number(size.z.toFixed(2)),
        };

        setAccessoryModel((prev) => (prev ? { ...prev, dimensions } : null));

        currentLoadedAccessoryIdRef.current = accessoryModel.id;
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
        URL.revokeObjectURL(objectUrl);
        if (accessoryLoadGenRef.current !== thisAccessoryGen) return;
        console.error('Lỗi nạp mô hình phụ kiện GLB:', error);
        setAccessoryError(
          'Không thể giải mã tệp phụ kiện. Vui lòng kiểm tra lại định dạng tệp .glb hoặc dung lượng.'
        );
        setIsAccessoryLoading(false);
        currentLoadedAccessoryIdRef.current = null;
      }
    );
  }, [
    accessoryModel,
    disposeCurrentAccessory,
    disposeGroup,
    updateCameraFraming,
    accessoryOffsetX,
    accessoryOffsetY,
    accessoryOffsetZ,
    accessoryRotX,
    accessoryRotY,
    accessoryRotZ,
    accessoryScale,
    isAccessoryVisible,
  ]);

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

    if (matching && matching.id !== activeModelId) {
      setActiveModelId(matching.id);
    }
  }, [currentGarmentId, activeModelId]);

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
    setAccessoryModel(record);
    setIsAccessoryVisible(true);
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
      const firstFile = e.dataTransfer.files[0];
      const nameLower = firstFile.name.toLowerCase();
      if (nameLower.includes('fan') || nameLower.includes('quat')) {
        handleProcessAccessoryFile([firstFile]);
      } else {
        handleProcessGarmentFiles(e.dataTransfer.files);
      }
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
          if (!accessoryModelRef.current) {
            setViewerStatus('idle');
          }
          onModelClearedRef.current?.();
        }
      }
      return nextList;
    });
  };

  // Remove accessory model
  const handleRemoveAccessory = () => {
    disposeCurrentAccessory();
    currentLoadedAccessoryIdRef.current = null;
    setAccessoryModel(null);
    setAccessoryError(null);
    setShowAccessoryControls(false);
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
    setViewerStatus(accessoryModel ? 'ready' : 'idle');
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

          {/* Quick accessory badge if loaded */}
          {accessoryModel && (
            <div className="flex items-center gap-1.5 bg-emerald-50/80 px-2 py-1 rounded-xs border border-emerald-200 text-xs shadow-2xs">
              <Fan className="w-3.5 h-3.5 text-[#1B4D3E] shrink-0" />
              <span className="text-[#1B4D3E] font-medium truncate max-w-[130px] sm:max-w-[180px]">
                {accessoryMeta?.title || accessoryModel.fileName}
              </span>
              <span className={`text-[9px] px-1 py-0.2 rounded-xs font-semibold ${isAccessoryVisible ? 'bg-emerald-600 text-white' : 'bg-stone-300 text-stone-700'}`}>
                {isAccessoryVisible ? 'Đang hiện' : 'Đang ẩn'}
              </span>
            </div>
          )}
        </div>

        {/* Viewport Action Tools */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          {/* Grid Toggle Button (Lưới tọa độ) */}
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 border rounded-xs shadow-2xs text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 ${
              showGrid
                ? 'bg-[#241E1C] text-white border-[#241E1C]'
                : 'bg-white hover:bg-stone-50 text-[#241E1C] border-[#241E1C]/15'
            }`}
            title={showGrid ? 'Tắt lưới tọa độ sàn' : 'Bật lưới tọa độ sàn'}
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Lưới</span>
          </button>

          {/* Accessory Controls Drawer Toggle Button */}
          {accessoryModel && (
            <button
              type="button"
              onClick={() => setShowAccessoryControls(!showAccessoryControls)}
              className={`p-1.5 border rounded-xs shadow-2xs text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 ${
                showAccessoryControls
                  ? 'bg-[#1B4D3E] text-white border-[#1B4D3E]'
                  : 'bg-white hover:bg-stone-50 text-[#1B4D3E] border-[#1B4D3E]/30'
              }`}
              title="Bảng chỉnh vị trí & góc xoay quạt"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Chỉnh quạt</span>
            </button>
          )}

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

      {/* 2. DEDICATED ACCESSORY FINE-TUNING PANEL (HIỂN THỊ KHI BẬT, NẰM NGOÀI CANVAS ĐỂ KHÔNG CHE ÁO) */}
      {accessoryModel && showAccessoryControls && (
        <div className="bg-white p-3.5 rounded-sm border border-[#1B4D3E]/30 shadow-xs space-y-3 text-xs animate-in fade-in">
          {/* Header Panel */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1B4D3E]/10 pb-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Fan className="w-4 h-4 text-[#1B4D3E]" />
              <strong className="text-sm font-semibold text-[#1B4D3E]">
                Công cụ chỉnh tay quạt 3D & Lưu Preset
              </strong>
              {(activeRecord?.assignedGarmentId === 'ao-tu-than' || currentGarmentId === 'ao-tu-than') && (
                <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-xs font-semibold border border-amber-300">
                  Cặp riêng: Áo Tứ Thân (tu-than-color.glb) × Quạt (fan-decorated.glb)
                </span>
              )}
              {hasSavedCustomPreset ? (
                <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-xs font-bold border border-emerald-300 flex items-center gap-1 shadow-2xs">
                  ★ Đã lưu Preset riêng
                </span>
              ) : (
                <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-xs border border-stone-200">
                  Chưa lưu preset riêng
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 ml-auto">
              {/* Nút Hiện / Ẩn điểm neo 3D (Mặc định ẩn, bật khi cần căn thử) */}
              <button
                type="button"
                onClick={() => setShowAnchorHelper(!showAnchorHelper)}
                className={`px-2 py-1 rounded-xs text-[11px] font-medium border cursor-pointer transition-colors flex items-center gap-1 ${
                  showAnchorHelper
                    ? 'bg-amber-100 text-amber-900 border-amber-400 font-semibold shadow-2xs'
                    : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-300'
                }`}
                title={showAnchorHelper ? 'Ẩn điểm neo 3D' : 'Hiện điểm neo 3D để căn thử'}
              >
                <Crosshair className="w-3.5 h-3.5 text-[#1B4D3E]" />
                <span>{showAnchorHelper ? 'Điểm neo (Bật)' : 'Hiện điểm neo'}</span>
              </button>

              {/* Nút Ẩn / Hiện Quạt */}
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

              <button
                type="button"
                onClick={() => setShowAccessoryControls(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
                title="Đóng bảng chỉnh"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

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
              <span className="font-semibold text-stone-800 font-sans mr-1">Tọa độ đang áp dụng:</span>
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
                  <code>nhat-binh.glb</code>) và phụ kiện riêng (<code>fan-decorated.glb</code>).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
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
                  onClick={() => accessoryFileInputRef.current?.click()}
                  className="w-full sm:w-auto px-3.5 py-2 bg-white hover:bg-[#1B4D3E]/5 text-[#1B4D3E] border border-[#1B4D3E] text-xs font-semibold rounded-xs shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <Fan className="w-3.5 h-3.5" />
                  <span>Tải quạt .glb</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
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

          {/* Accessory Attribution */}
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
        </div>
      )}

      {/* 5. SESSION MODEL MANAGER (QUẢN LÝ TỆP ĐÃ NẠP TRONG PHIÊN) */}
      <div className="bg-[#FAF7F2] p-3.5 rounded-sm border border-[#241E1C]/15 space-y-3">
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
                  {loadedModels.length + (accessoryModel ? 1 : 0)} tệp
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {(loadedModels.length > 0 || accessoryModel) && (
              <button
                type="button"
                onClick={() => {
                  handleClearAllModels();
                  handleRemoveAccessory();
                }}
                className="px-2 py-1 text-[11px] text-stone-600 hover:text-red-700 hover:bg-red-50 rounded-xs transition-colors cursor-pointer"
                title="Gỡ toàn bộ mô hình khỏi phiên"
              >
                Gỡ tất cả
              </button>
            )}

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
            Vị trí quạt được tính toán tự động dựa trên tọa độ biên (Bounding Box) ống tay áo phải và điều chỉnh độc lập qua sliders. Các thao tác di chuyển, đổi góc xoay hoặc ẩn/hiện quạt <strong>hoàn toàn không kích hoạt nạp lại mô hình áo</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};
