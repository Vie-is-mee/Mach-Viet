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
} from 'lucide-react';
import {
  matchUploadedModelMeta,
  getGarmentModelAvailability,
  SampleModelMeta,
  SAMPLE_MODELS_REGISTRY,
} from '../data/modelCatalog';

export interface GlbModelViewerProps {
  currentGarmentId: string;
  currentGarmentName: string;
  onSyncGarment?: (garmentId: string) => void;
  onModelLoaded?: (fileName: string, garmentType: string) => void;
  onModelError?: (error: string) => void;
  onModelCleared?: () => void;
}

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB limit

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

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const currentModelRef = useRef<THREE.Group | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const initialViewRef = useRef<{ cameraPos: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  // Component state
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [confirmedGarmentType, setConfirmedGarmentType] = useState<string>('auto');
  const [modelMeta, setModelMeta] = useState<SampleModelMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  const availability = getGarmentModelAvailability(currentGarmentId);

  // Dispose all meshes, geometries, and materials safely to prevent RAM leakage
  const disposeCurrentModel = useCallback(() => {
    if (currentModelRef.current && sceneRef.current) {
      currentModelRef.current.traverse((child) => {
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
                  if (val && typeof val === 'object' && 'isTexture' in val) {
                    (val as THREE.Texture).dispose();
                  }
                }
              });
            } else {
              mesh.material.dispose();
              for (const key of Object.keys(mesh.material)) {
                const val = (mesh.material as unknown as Record<string, unknown>)[key];
                if (val && typeof val === 'object' && 'isTexture' in val) {
                  (val as THREE.Texture).dispose();
                }
              }
            }
          }
        }
      });
      sceneRef.current.remove(currentModelRef.current);
      currentModelRef.current = null;
    }
  }, []);

  // Initialize Three.js Scene, Camera, Renderer, Controls
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

    // 3. WebGL Renderer with high color fidelity
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 4. OrbitControls with smooth damping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI * 0.95;
    controls.minDistance = 0.3;
    controls.maxDistance = 20;
    controlsRef.current = controls;

    // 5. Soft directional + ambient lighting so materials and textures are clearly visible
    const ambientLight = new THREE.AmbientLight(0xfffaf0, 1.3);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(4, 8, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf4ece1, 0.9);
    fillLight.position.set(-4, 5, -4);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xdcd3c3, 0.6);
    hemiLight.position.set(0, 10, 0);
    scene.add(hemiLight);

    // 6. Animation loop
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      renderer.render(scene, camera);
    };
    animate();

    // 7. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || !entries[0]) return;
      const { width: newWidth, height: newHeight } = entries[0].contentRect;
      if (newWidth > 0 && newHeight > 0) {
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      disposeCurrentModel();
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [disposeCurrentModel]);

  // Handle auto-rotation
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotating;
      controlsRef.current.autoRotateSpeed = 2.0;
    }
  }, [isAutoRotating]);

  // Load GLB file using GLTFLoader & auto-center/auto-frame by bounding box
  const loadGlbFile = useCallback(
    (file: File) => {
      setErrorMessage(null);
      setIsLoading(true);
      setLoadingProgress(0);

      const fileNameLower = file.name.toLowerCase();
      if (!fileNameLower.endsWith('.glb')) {
        setErrorMessage(
          'Định dạng không được hỗ trợ. Trình xem chỉ tiếp nhận tệp mô hình 3D chuẩn Binary glTF 2.0 (.glb).'
        );
        setIsLoading(false);
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        setErrorMessage(
          `Kích thước tệp (${sizeMb} MB) vượt quá giới hạn an toàn 50 MB. Vui lòng tối ưu dung lượng tệp .glb trước khi nạp.`
        );
        setIsLoading(false);
        return;
      }

      // Dispose previous model completely before decoding new one
      disposeCurrentModel();

      const objectUrl = URL.createObjectURL(file);
      const loader = new GLTFLoader();

      loader.load(
        objectUrl,
        (gltf) => {
          URL.revokeObjectURL(objectUrl);

          const scene = sceneRef.current;
          const camera = cameraRef.current;
          const controls = controlsRef.current;

          if (!scene || !camera || !controls) {
            setIsLoading(false);
            return;
          }

          const model = gltf.scene;
          currentModelRef.current = model;

          // 1. Calculate bounding box and center model at origin (0, 0, 0)
          const rawBox = new THREE.Box3().setFromObject(model);
          const center = rawBox.getCenter(new THREE.Vector3());
          const size = rawBox.getSize(new THREE.Vector3());

          // Recenter model so its geometric center is strictly at (0, 0, 0)
          model.position.x -= center.x;
          model.position.y -= center.y;
          model.position.z -= center.z;

          // 2. Re-compute centered bounding box and bounding sphere for exact camera distance
          const centeredBox = new THREE.Box3().setFromObject(model);
          const sphere = centeredBox.getBoundingSphere(new THREE.Sphere());
          const radius = Math.max(sphere.radius, size.length() / 2, 0.5);

          const fov = camera.fov * (Math.PI / 180);
          let distance = radius / Math.sin(fov / 2);
          distance = Math.max(distance * 1.25, 1.2);

          camera.position.set(0, radius * 0.15, distance);
          camera.lookAt(0, 0, 0);
          camera.near = Math.max(distance / 50, 0.05);
          camera.far = Math.max(distance * 50, 100);
          camera.updateProjectionMatrix();

          controls.target.set(0, 0, 0);
          controls.minDistance = Math.max(radius * 0.25, 0.2);
          controls.maxDistance = distance * 5;
          controls.update();

          // Save default camera viewpoint for reset button
          initialViewRef.current = {
            cameraPos: camera.position.clone(),
            target: controls.target.clone(),
          };

          // 3. Add model to scene
          scene.add(model);

          // 4. Update initial metadata suggestion (without forcing assumptions)
          const matchedMeta = matchUploadedModelMeta(file.name);
          setModelMeta(matchedMeta);

          // Set default user confirmation option based on match or current garment
          const targetType = matchedMeta ? matchedMeta.matchedGarmentId : 'custom_other';
          setConfirmedGarmentType(targetType);

          setIsLoading(false);
          setLoadingProgress(100);
          onModelLoaded?.(file.name, targetType);
        },
        (progress) => {
          if (progress.total > 0) {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setLoadingProgress(percent);
          }
        },
        (error) => {
          URL.revokeObjectURL(objectUrl);
          console.error('Lỗi nạp mô hình GLB:', error);
          const errText = 'Không thể giải mã mô hình. Tệp có thể bị hỏng, mã hóa không đúng chuẩn Binary glTF 2.0 (.glb), hoặc thiếu tài nguyên texture đi kèm.';
          setErrorMessage(errText);
          setIsLoading(false);
          onModelError?.(errText);
        }
      );
    },
    [disposeCurrentModel, onModelLoaded, onModelError]
  );

  // When activeFile changes, load it
  useEffect(() => {
    if (activeFile) {
      loadGlbFile(activeFile);
    } else {
      disposeCurrentModel();
      setModelMeta(null);
    }
  }, [activeFile, loadGlbFile, disposeCurrentModel]);

  // Reset camera view to auto-framed state (Căn chuẩn theo Bounding Box thực tế)
  const handleResetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      if (initialViewRef.current) {
        cameraRef.current.position.copy(initialViewRef.current.cameraPos);
        controlsRef.current.target.copy(initialViewRef.current.target);
      } else {
        cameraRef.current.position.set(0, 1.2, 3);
        controlsRef.current.target.set(0, 0, 0);
      }
      controlsRef.current.update();
    }
  };

  // Zoom In button handler (Tịnh tiến camera lại gần tâm mô hình theo vector, kiểm soát minDistance)
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

  // Zoom Out button handler (Lùi camera xa khỏi tâm mô hình theo vector, kiểm soát maxDistance)
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

  // Process dropped or selected file
  const handleProcessFile = (file: File) => {
    setErrorMessage(null);
    setActiveFile(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Remove active model
  const handleClearModel = () => {
    disposeCurrentModel();
    setActiveFile(null);
    setModelMeta(null);
    setErrorMessage(null);
    setConfirmedGarmentType('auto');
  };

  // Check mismatch between confirmed model type and current Studio garment
  const isGarmentTypeMismatched = (() => {
    if (!activeFile) return false;
    if (confirmedGarmentType === 'custom_other') return false;

    // If confirmed as tu-than but studio is NOT ao-tu-than
    if (confirmedGarmentType === 'ao-tu-than' && currentGarmentId !== 'ao-tu-than') {
      return true;
    }
    // If confirmed as ao-dai but studio is NOT ao-dai-hien-dai
    if (confirmedGarmentType === 'ao-dai-hien-dai' && currentGarmentId !== 'ao-dai-hien-dai') {
      return true;
    }
    // If confirmed as nhat-binh but studio is NOT ao-nhat-binh
    if (confirmedGarmentType === 'ao-nhat-binh' && currentGarmentId !== 'ao-nhat-binh') {
      return true;
    }
    // If confirmed as ngu-than but studio is neither chen nor tac
    if (
      confirmedGarmentType === 'ao-ngu-than' &&
      currentGarmentId !== 'ngu-than-tay-chen' &&
      currentGarmentId !== 'ao-tac-ngu-than-tay-thung'
    ) {
      return true;
    }

    return false;
  })();

  const getConfirmedGarmentLabel = () => {
    if (confirmedGarmentType === 'ao-tu-than') return 'Áo Tứ Thân';
    if (confirmedGarmentType === 'ao-dai-hien-dai') return 'Áo Dài';
    if (confirmedGarmentType === 'ao-nhat-binh') return 'Áo Nhật Bình';
    if (confirmedGarmentType === 'ao-ngu-than') return 'Áo Ngũ Thân';
    return 'Dòng y phục khác';
  };

  return (
    <div className="relative aspect-[3/4] bg-[#F6F3ED] rounded-sm border border-[#241E1C]/15 overflow-hidden flex flex-col justify-between select-none">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".glb"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* THREE.JS CANVAS CONTAINER */}
      <div
        ref={containerRef}
        className={`w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing ${
          !activeFile ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      />

      {/* TOP OVERLAY CONTROLS (Active when file is loaded) */}
      {activeFile && (
        <div className="relative z-20 p-3 space-y-2 pointer-events-auto">
          <div className="flex items-start justify-between gap-2">
            {/* Active Model Name & Type Badge */}
            <div className="bg-white/95 backdrop-blur-xs p-2 px-3 rounded-xs border border-[#241E1C]/10 shadow-xs max-w-[65%] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8B2626] truncate">
                <FileCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate" title={activeFile.name}>
                  {modelMeta?.title || activeFile.name}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-[10px] text-stone-500">
                <span>{(activeFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                <span>·</span>
                <span className="text-[#1B4D3E] font-medium">Đã tải bằng File API</span>
              </div>
            </div>

            {/* Viewport Control Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1.5 bg-white/95 hover:bg-white text-[#241E1C] border border-[#241E1C]/15 rounded-xs shadow-xs text-xs font-medium cursor-pointer transition-colors"
                title="Phóng to mô hình (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1.5 bg-white/95 hover:bg-white text-[#241E1C] border border-[#241E1C]/15 rounded-xs shadow-xs text-xs font-medium cursor-pointer transition-colors"
                title="Thu nhỏ mô hình (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleResetCamera}
                className="p-1.5 bg-white/95 hover:bg-white text-[#241E1C] border border-[#241E1C]/15 rounded-xs shadow-xs text-xs font-medium cursor-pointer transition-colors flex items-center gap-1"
                title="Đặt lại góc nhìn camera ban đầu"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#8B2626]" />
                <span className="hidden sm:inline text-[11px]">Góc nhìn</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAutoRotating(!isAutoRotating)}
                className={`p-1.5 border rounded-xs shadow-xs text-xs font-medium cursor-pointer transition-colors flex items-center gap-1 ${
                  isAutoRotating
                    ? 'bg-[#8B2626] text-white border-[#8B2626]'
                    : 'bg-white/95 hover:bg-white text-[#241E1C] border-[#241E1C]/15'
                }`}
                title={isAutoRotating ? 'Dừng tự xoay' : 'Tự động xoay mô hình'}
              >
                {isAutoRotating ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-[#8B2626]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 bg-white/95 hover:bg-white text-[#8B2626] border border-[#241E1C]/15 rounded-xs shadow-xs text-xs font-medium cursor-pointer transition-colors"
                title="Đổi sang file .glb khác"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleClearModel}
                className="p-1.5 bg-white/95 hover:bg-red-50 text-red-700 border border-red-200 rounded-xs shadow-xs text-xs cursor-pointer transition-colors"
                title="Gỡ bỏ mô hình hiện tại"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* User Confirmation of Garment Type Selector */}
          <div className="bg-white/95 backdrop-blur-xs p-2 rounded-xs border border-[#241E1C]/10 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-stone-600 font-medium">
                Xác nhận dòng y phục của tệp:
              </span>
              <select
                value={confirmedGarmentType}
                onChange={(e) => {
                  const val = e.target.value;
                  setConfirmedGarmentType(val);
                  // Update metadata if matches known sample
                  if (val === 'ao-tu-than') {
                    setModelMeta(SAMPLE_MODELS_REGISTRY['tu-than-color.glb']);
                  } else if (val === 'ao-dai-hien-dai') {
                    setModelMeta(SAMPLE_MODELS_REGISTRY['ao-dai-blue.glb']);
                  } else if (val === 'ao-nhat-binh') {
                    setModelMeta(SAMPLE_MODELS_REGISTRY['nhat-binh.glb']);
                  } else {
                    setModelMeta(null);
                  }
                }}
                className="bg-[#FAF7F2] border border-[#241E1C]/20 px-2 py-0.5 rounded-xs text-[11px] font-medium text-[#241E1C] focus:outline-none focus:border-[#8B2626]"
              >
                <option value="ao-tu-than">Áo Tứ Thân (tu-than-color.glb)</option>
                <option value="ao-dai-hien-dai">Áo Dài Hiện Đại (ao-dai-blue.glb)</option>
                <option value="ao-nhat-binh">Áo Nhật Bình (nhat-binh.glb)</option>
                <option value="ao-ngu-than">Áo Ngũ Thân</option>
                <option value="custom_other">Dòng y phục khác / Tự do</option>
              </select>
            </div>

            <span className="text-[10px] text-stone-500 italic">
              (Người dùng tự xác nhận, không đoán bừa)
            </span>
          </div>

          {/* MISMATCH WARNING NOTICE (e.g. Studio is on Áo ngũ thân while user loaded Nhật Bình) */}
          {isGarmentTypeMismatched && (
            <div className="p-2.5 bg-amber-50/95 border border-amber-300 rounded-xs text-xs text-amber-900 flex items-start justify-between gap-2 shadow-xs animate-in fade-in">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5 text-[11px]">
                  <strong className="block text-amber-950 font-semibold">
                    Lệch dòng y phục so với bàn phối Studio
                  </strong>
                  <p className="text-amber-900/90 leading-tight">
                    Mô hình 3D vừa nạp là <strong>{getConfirmedGarmentLabel()}</strong>, trong khi bàn phối Studio đang thiết lập <strong>{currentGarmentName}</strong>.
                  </p>
                </div>
              </div>

              {onSyncGarment && confirmedGarmentType !== 'custom_other' && (
                <button
                  type="button"
                  onClick={() => onSyncGarment(confirmedGarmentType)}
                  className="px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded-xs text-[10px] font-semibold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1 shadow-xs shrink-0"
                >
                  <span>Chuyển bàn phối sang {getConfirmedGarmentLabel()}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* LOADING OVERLAY */}
      {isLoading && (
        <div className="absolute inset-0 z-30 bg-[#F6F3ED]/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div className="w-9 h-9 border-3 border-[#8B2626]/20 border-t-[#8B2626] rounded-full animate-spin" />
          <div className="space-y-1">
            <h4 className="font-serif text-sm font-semibold text-[#241E1C]">
              Đang giải mã mô hình 3D...
            </h4>
            <p className="text-xs text-stone-600">
              {loadingProgress > 0 ? `Đang nạp: ${loadingProgress}%` : 'Đang xử lý cấu trúc lưới và vật liệu'}
            </p>
          </div>
        </div>
      )}

      {/* ERROR MESSAGE NOTIFICATION WITH "THỬ LẠI" BUTTON */}
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
            {activeFile && (
              <button
                type="button"
                onClick={() => loadGlbFile(activeFile)}
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
              Chọn lại tệp khác
            </button>
          </div>
        </div>
      )}

      {/* EMPTY STATE: IMPORT DROPZONE & GUIDELINES (When no file is loaded) */}
      {!activeFile && !isLoading && (
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
          <div className="my-auto space-y-3.5 max-w-sm">
            <div className="w-14 h-14 mx-auto rounded-full bg-white border border-[#241E1C]/15 flex items-center justify-center shadow-xs text-[#8B2626]">
              <Upload className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif text-base font-semibold text-[#241E1C]">
                Tải mô hình .glb từ máy tính
              </h3>
              <p className="text-xs text-[#241E1C]/75 leading-relaxed">
                Chọn tệp <strong>.glb</strong> bạn đã tải về để kiểm tra phom dáng 3D thực tế trong không gian Studio.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-[#8B2626] hover:bg-[#741E1E] text-white text-xs font-semibold rounded-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2 active:scale-98"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Tải mô hình .glb từ máy</span>
            </button>

            {/* Model Availability Notice for current garment */}
            <div className="p-3 bg-white/85 rounded-xs border border-[#241E1C]/10 text-left text-[11px] space-y-1.5">
              <div className="font-semibold text-[#241E1C] flex items-center justify-between">
                <span>Dòng áo đang chọn: {currentGarmentName}</span>
                <span className="text-[10px] text-stone-500">Mã: {currentGarmentId}</span>
              </div>
              <p className="text-stone-600 leading-relaxed text-[10px]">{availability.notice}</p>
              {availability.hasSampleFile && (
                <div className="text-[10px] text-[#1B4D3E] font-medium pt-0.5 border-t border-[#241E1C]/5">
                  ✓ Tệp mẫu tương ứng: <code>{availability.suggestedFilename}</code>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Security / Privacy notice */}
          <div className="w-full bg-white/80 p-2.5 rounded-xs border border-[#241E1C]/10 text-[10px] text-stone-600 space-y-1 text-left">
            <div className="flex items-center gap-1 text-[#8B2626] font-medium">
              <Info className="w-3 h-3 shrink-0" />
              <span>Xử lý cục bộ bằng File API (Không lưu file lên server)</span>
            </div>
            <p className="leading-relaxed text-[10px]">
              Tệp được giải mã trực tiếp trong phiên duyệt hiện tại. Kéo chuột để xoay, cuộn chuột hoặc dùng nút +/- để phóng to/thu nhỏ, nút Góc nhìn để tự căn giữa theo bounding box.
            </p>
          </div>
        </div>
      )}

      {/* BOTTOM OVERLAY STATUS WITH EXACT ATTRIBUTION & SKETCHFAB LINKS (When model is active) */}
      {activeFile && (
        <div className="relative z-20 p-3 pt-0 pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-xs p-2.5 rounded-xs border border-[#241E1C]/10 shadow-xs space-y-1.5 text-left">
            {/* Model Title & Label */}
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <strong className="text-[#8B2626]">{modelMeta?.title || activeFile.name}</strong>
                <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-800 font-medium rounded-xs">
                  Mô hình minh họa 3D, chưa được thẩm định phục dựng
                </span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 bg-[#1B4D3E]/10 text-[#1B4D3E] font-semibold rounded-xs">
                {modelMeta?.license || 'CC BY 4.0'}
              </span>
            </div>

            {/* Description */}
            <p className="text-[10px] text-stone-600 leading-relaxed">
              {modelMeta?.description || 'Mô hình 3D do người dùng nạp từ máy tính qua File API.'}
            </p>

            {/* Attribution & Sketchfab Source URL */}
            <div className="text-[10px] text-stone-600 pt-1 border-t border-[#241E1C]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div>
                <strong>Tác giả:</strong> {modelMeta?.author || 'ghostnoface trên Sketchfab'} (Giấy phép CC BY 4.0)
              </div>

              {modelMeta?.sourceUrl && (
                <a
                  href={modelMeta.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8B2626] hover:underline inline-flex items-center gap-1 font-medium text-[10px]"
                >
                  <span>Nguồn Sketchfab</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
