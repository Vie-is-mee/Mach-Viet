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

  // Accessory fine-tuning transform settings
  // Default suggested position calculated from garment bounding box
  const [suggestedAccessoryPos, setSuggestedAccessoryPos] = useState<{ x: number; y: number; z: number }>({
    x: 0.52,
    y: -0.15,
    z: 0.18,
  });
  const [accessoryOffsetX, setAccessoryOffsetX] = useState<number>(0.52);
  const [accessoryOffsetY, setAccessoryOffsetY] = useState<number>(-0.15);
  const [accessoryOffsetZ, setAccessoryOffsetZ] = useState<number>(0.18);
  const [accessoryRotY, setAccessoryRotY] = useState<number>(-25); // xoay ngang quanh trục đứng Y (độ)
  const [accessoryRotZ, setAccessoryRotZ] = useState<number>(15);  // nghiêng quạt quanh trục Z (độ)
  const [accessoryRotX, setAccessoryRotX] = useState<number>(0);   // ngửa/úp quạt quanh trục X (độ)
  const [accessoryScale, setAccessoryScale] = useState<number>(1.0);
  const [isAccessoryVisible, setIsAccessoryVisible] = useState<boolean>(true);
  const [showAccessoryControls, setShowAccessoryControls] = useState<boolean>(false);

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

  // Helper: calculate smart default accessory position near the right sleeve end
  const computeRightSleeveSuggestedPos = useCallback((garmentGroup: THREE.Group) => {
    const box = new THREE.Box3().setFromObject(garmentGroup);
    const size = box.getSize(new THREE.Vector3());
    const maxCorner = box.max;
    const minCorner = box.min;

    // Right sleeve tip is near max.x (or if model is oriented differently, at outer horizontal extreme)
    // Tứ thân / Áo dài thường có ống tay rủ ở khoảng 40%-55% chiều cao từ đỉnh áo xuống
    const suggestedX = Number((maxCorner.x * 0.92 + 0.08).toFixed(2));
    const suggestedY = Number((minCorner.y + size.y * 0.45).toFixed(2));
    const suggestedZ = Number((maxCorner.z * 0.5 + 0.12).toFixed(2));

    return {
      x: Math.max(suggestedX, 0.42),
      y: suggestedY,
      z: Math.max(suggestedZ, 0.12),
    };
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
    if (accessoryInnerModelRef.current) {
      accessoryInnerModelRef.current.rotation.x = THREE.MathUtils.degToRad(accessoryRotX);
      accessoryInnerModelRef.current.rotation.y = THREE.MathUtils.degToRad(accessoryRotY);
      accessoryInnerModelRef.current.rotation.z = THREE.MathUtils.degToRad(accessoryRotZ);
    }
  }, [accessoryOffsetX, accessoryOffsetY, accessoryOffsetZ, accessoryRotX, accessoryRotY, accessoryRotZ, accessoryScale, isAccessoryVisible]);

  // Update GridHelper visibility
  useEffect(() => {
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
  }, [showGrid]);

  // Reset accessory to suggested smart position
  const handleResetAccessoryToSuggested = () => {
    setAccessoryOffsetX(suggestedAccessoryPos.x);
    setAccessoryOffsetY(suggestedAccessoryPos.y);
    setAccessoryOffsetZ(suggestedAccessoryPos.z);
    setAccessoryRotX(0);
    setAccessoryRotY(-25);
    setAccessoryRotZ(15);
    setAccessoryScale(1.0);
    setIsAccessoryVisible(true);
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

        // 2. Compute smart suggested accessory position near right sleeve end based on real bounding box
        const smartPos = computeRightSleeveSuggestedPos(model);
        setSuggestedAccessoryPos(smartPos);
        setAccessoryOffsetX(smartPos.x);
        setAccessoryOffsetY(smartPos.y);
        setAccessoryOffsetZ(smartPos.z);

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
  }, [activeModelId, retryTrigger, disposeCurrentGarment, disposeGroup, updateCameraFraming, computeRightSleeveSuggestedPos]);

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

        // Center geometry internally
        fanModel.position.x = -center.x;
        fanModel.position.y = -center.y;
        fanModel.position.z = -center.z;

        // Set initial rotation
        fanModel.rotation.x = THREE.MathUtils.degToRad(accessoryRotX);
        fanModel.rotation.y = THREE.MathUtils.degToRad(accessoryRotY);
        fanModel.rotation.z = THREE.MathUtils.degToRad(accessoryRotZ);

        // Outer positioning pivot group
        const pivot = new THREE.Group();
        pivot.add(fanModel);

        // Position: use current offset (aligned near right sleeve)
        pivot.position.set(accessoryOffsetX, accessoryOffsetY, accessoryOffsetZ);
        pivot.scale.set(accessoryScale, accessoryScale, accessoryScale);
        pivot.visible = isAccessoryVisible;

        accessoryPivotRef.current = pivot;
        scene.add(pivot);

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
          <div className="flex items-center justify-between border-b border-[#1B4D3E]/10 pb-2">
            <div className="flex items-center gap-2">
              <Fan className="w-4 h-4 text-[#1B4D3E]" />
              <strong className="text-sm font-semibold text-[#1B4D3E]">
                Bảng tinh chỉnh vị trí & góc xoay quạt 3D
              </strong>
            </div>

            <div className="flex items-center gap-2">
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
                <span>{isAccessoryVisible ? 'Đang hiện' : 'Đang ẩn'}</span>
              </button>

              {/* Nút Reset về vị trí gợi ý ban đầu */}
              <button
                type="button"
                onClick={handleResetAccessoryToSuggested}
                className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xs text-[11px] font-medium cursor-pointer transition-colors flex items-center gap-1"
                title="Khôi phục vị trí gợi ý gần ống tay phải áo"
              >
                <RotateCcw className="w-3 h-3 text-[#1B4D3E]" />
                <span>Đặt lại vị trí gợi ý</span>
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

          {/* Sliders Grid: Trái phải (X), Lên xuống (Y), Trước sau (Z), Xoay (Yaw Y), Nghiêng (Roll Z), Tỉ lệ (Scale) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-[11px]">
            {/* 1. Trái / Phải (X) */}
            <div className="space-y-1 bg-[#FAF7F2] p-2 rounded-xs border border-[#241E1C]/5">
              <div className="flex justify-between font-medium text-stone-700">
                <span>Trái - Phải (X):</span>
                <span className="font-mono text-[#1B4D3E]">{accessoryOffsetX.toFixed(2)}m</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.4"
                step="0.02"
                value={accessoryOffsetX}
                onChange={(e) => setAccessoryOffsetX(parseFloat(e.target.value))}
                className="w-full accent-[#1B4D3E] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-stone-400">
                <span>Gần thân</span>
                <span>Xa tay</span>
              </div>
            </div>

            {/* 2. Lên / Xuống (Y) */}
            <div className="space-y-1 bg-[#FAF7F2] p-2 rounded-xs border border-[#241E1C]/5">
              <div className="flex justify-between font-medium text-stone-700">
                <span>Lên - Xuống (Y):</span>
                <span className="font-mono text-[#1B4D3E]">{accessoryOffsetY.toFixed(2)}m</span>
              </div>
              <input
                type="range"
                min="-0.7"
                max="0.4"
                step="0.02"
                value={accessoryOffsetY}
                onChange={(e) => setAccessoryOffsetY(parseFloat(e.target.value))}
                className="w-full accent-[#1B4D3E] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-stone-400">
                <span>Hạ thấp</span>
                <span>Nâng cao</span>
              </div>
            </div>

            {/* 3. Trước / Sau (Z) */}
            <div className="space-y-1 bg-[#FAF7F2] p-2 rounded-xs border border-[#241E1C]/5">
              <div className="flex justify-between font-medium text-stone-700">
                <span>Trước - Sau (Z):</span>
                <span className="font-mono text-[#1B4D3E]">{accessoryOffsetZ.toFixed(2)}m</span>
              </div>
              <input
                type="range"
                min="-0.3"
                max="0.6"
                step="0.02"
                value={accessoryOffsetZ}
                onChange={(e) => setAccessoryOffsetZ(parseFloat(e.target.value))}
                className="w-full accent-[#1B4D3E] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-stone-400">
                <span>Sau tà</span>
                <span>Trước ngực</span>
              </div>
            </div>

            {/* 4. Góc Xoay Hướng Quạt (Yaw - Y) */}
            <div className="space-y-1 bg-[#FAF7F2] p-2 rounded-xs border border-[#241E1C]/5">
              <div className="flex justify-between font-medium text-stone-700">
                <span>Góc xoay (Y):</span>
                <span className="font-mono text-[#1B4D3E]">{accessoryRotY}°</span>
              </div>
              <input
                type="range"
                min="-90"
                max="90"
                step="5"
                value={accessoryRotY}
                onChange={(e) => setAccessoryRotY(parseInt(e.target.value, 10))}
                className="w-full accent-[#1B4D3E] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-stone-400">
                <span>Quay trong</span>
                <span>Quay ngoài</span>
              </div>
            </div>

            {/* 5. Góc Nghiêng Quạt (Roll - Z) */}
            <div className="space-y-1 bg-[#FAF7F2] p-2 rounded-xs border border-[#241E1C]/5">
              <div className="flex justify-between font-medium text-stone-700">
                <span>Độ nghiêng (Z):</span>
                <span className="font-mono text-[#1B4D3E]">{accessoryRotZ}°</span>
              </div>
              <input
                type="range"
                min="-60"
                max="60"
                step="5"
                value={accessoryRotZ}
                onChange={(e) => setAccessoryRotZ(parseInt(e.target.value, 10))}
                className="w-full accent-[#1B4D3E] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-stone-400">
                <span>Nghiêng trái</span>
                <span>Nghiêng phải</span>
              </div>
            </div>

            {/* 6. Tỉ lệ Kích Thước (Scale) */}
            <div className="space-y-1 bg-[#FAF7F2] p-2 rounded-xs border border-[#241E1C]/5">
              <div className="flex justify-between font-medium text-stone-700">
                <span>Kích thước (Scale):</span>
                <span className="font-mono text-[#1B4D3E]">{accessoryScale.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.8"
                step="0.05"
                value={accessoryScale}
                onChange={(e) => setAccessoryScale(parseFloat(e.target.value))}
                className="w-full accent-[#1B4D3E] cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-stone-400">
                <span>Thu nhỏ</span>
                <span>Phóng lớn</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-stone-500 italic bg-[#FAF7F2] px-2.5 py-1 rounded-xs flex items-center justify-between">
            <span>* Vị trí gợi ý ban đầu được tính tự động từ bounding box ống tay áo phải ({suggestedAccessoryPos.x}m, {suggestedAccessoryPos.y}m, {suggestedAccessoryPos.z}m).</span>
            <span>Không làm nạp lại mô hình áo.</span>
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
