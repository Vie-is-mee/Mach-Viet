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
} from 'lucide-react';
import {
  matchUploadedModelMeta,
  getGarmentModelAvailability,
  detectGarmentFromFilename,
  SampleModelMeta,
  SessionModelRecord,
  SAMPLE_MODELS_REGISTRY,
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

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const currentModelRef = useRef<THREE.Group | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const initialViewRef = useRef<{ cameraPos: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  // Session & Loading Control Refs (Preventing duplicate/infinite load loops)
  const currentLoadedIdRef = useRef<string | null>(null);
  const loadGenerationRef = useRef<number>(0);

  // Stabilize external callbacks to prevent re-triggering effects on parent re-renders
  const onSyncGarmentRef = useRef(onSyncGarment);
  onSyncGarmentRef.current = onSyncGarment;
  const onModelLoadedRef = useRef(onModelLoaded);
  onModelLoadedRef.current = onModelLoaded;
  const onModelErrorRef = useRef(onModelError);
  onModelErrorRef.current = onModelError;
  const onModelClearedRef = useRef(onModelCleared);
  onModelClearedRef.current = onModelCleared;

  // Multi-model session state
  const [loadedModels, setLoadedModels] = useState<SessionModelRecord[]>([]);
  const loadedModelsRef = useRef<SessionModelRecord[]>([]);
  loadedModelsRef.current = loadedModels;

  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);

  // Viewer state
  const [viewerStatus, setViewerStatus] = useState<ViewerStatus>('idle');
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // The record currently active
  const activeRecord = loadedModels.find((m) => m.id === activeModelId) || null;
  const modelMeta = activeRecord ? activeRecord.matchedMeta : null;

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
      sceneRef.current.remove(currentModelRef.current);
      currentModelRef.current = null;
    }
  }, []);

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
      currentLoadedIdRef.current = null;
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

  // PRIMARY EFFECT: Load active GLB model exactly ONCE when activeModelId changes
  // Guarded by currentLoadedIdRef and loadGenerationRef to completely prevent infinite reload cycles
  useEffect(() => {
    // Case 1: No active model selected
    if (!activeModelId) {
      if (currentLoadedIdRef.current !== null) {
        disposeCurrentModel();
        currentLoadedIdRef.current = null;
      }
      setViewerStatus('idle');
      return;
    }

    // Case 2: Model already decoded and active in Three.js scene (NO RELOAD)
    if (currentLoadedIdRef.current === activeModelId && viewerStatus === 'ready') {
      return;
    }

    const targetRecord = loadedModelsRef.current.find((m) => m.id === activeModelId);
    if (!targetRecord) {
      return;
    }

    // Advance generation counter to invalidate any previous or in-flight load request
    const thisGeneration = ++loadGenerationRef.current;

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

    // Dispose old model mesh before loading new one
    disposeCurrentModel();

    const objectUrl = URL.createObjectURL(file);
    const loader = new GLTFLoader();

    loader.load(
      objectUrl,
      (gltf) => {
        URL.revokeObjectURL(objectUrl);

        // If a newer load has been triggered (or component unmounted), discard and cleanup
        if (loadGenerationRef.current !== thisGeneration) {
          gltf.scene.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              (child as THREE.Mesh).geometry?.dispose();
            }
          });
          return;
        }

        const scene = sceneRef.current;
        const camera = cameraRef.current;
        const controls = controlsRef.current;

        if (!scene || !camera || !controls) {
          setViewerStatus('idle');
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

        // Save calculated dimensions
        const dimensions = {
          width: Number(size.x.toFixed(2)),
          height: Number(size.y.toFixed(2)),
          depth: Number(size.z.toFixed(2)),
        };

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

        // Mark model as safely loaded in scene
        currentLoadedIdRef.current = targetRecord.id;
        setViewerStatus('ready');
        setLoadingProgress(100);

        // Update dimensions in loadedModels without triggering re-load
        setLoadedModels((prev) =>
          prev.map((m) => (m.id === targetRecord.id ? { ...m, dimensions } : m))
        );

        onModelLoadedRef.current?.(file.name, targetRecord.assignedGarmentId);
      },
      (progress) => {
        if (loadGenerationRef.current !== thisGeneration) return;
        if (progress.total > 0) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          setLoadingProgress(percent);
        }
      },
      (error) => {
        URL.revokeObjectURL(objectUrl);
        if (loadGenerationRef.current !== thisGeneration) return;
        console.error('Lỗi nạp mô hình GLB:', error);
        const errText =
          'Không thể giải mã mô hình. Tệp có thể bị hỏng, mã hóa không đúng chuẩn Binary glTF 2.0 (.glb), hoặc thiếu tài nguyên texture đi kèm.';
        setErrorMessage(errText);
        setViewerStatus('error');
        currentLoadedIdRef.current = null;
        onModelErrorRef.current?.(errText);
      }
    );
  }, [activeModelId, retryTrigger, disposeCurrentModel]);

  // AUTO-SYNC EFFECT: When currentGarmentId changes in Studio Workspace,
  // switch to matching loaded model if one is already available in this session
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

  // Process dropped or selected files (Hỗ trợ nạp một hoặc nhiều tệp cùng lúc)
  const handleProcessFiles = (files: FileList | File[]) => {
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

    // Build session records
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

    // Select the best matching model or first newly uploaded model
    const matching =
      newRecords.find((r) => r.assignedGarmentId === currentGarmentId) || newRecords[0];
    if (matching) {
      currentLoadedIdRef.current = null; // Force fresh decode
      setActiveModelId(matching.id);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFiles(files);
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
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  // Remove a model from session
  const handleRemoveModel = (idToRemove: string) => {
    setLoadedModels((prev) => {
      const nextList = prev.filter((m) => m.id !== idToRemove);
      if (activeModelId === idToRemove) {
        disposeCurrentModel();
        currentLoadedIdRef.current = null;
        const nextActive =
          nextList.find((m) => m.assignedGarmentId === currentGarmentId) || nextList[0] || null;
        setActiveModelId(nextActive ? nextActive.id : null);
        if (!nextActive) {
          setViewerStatus('idle');
          onModelClearedRef.current?.();
        }
      }
      return nextList;
    });
  };

  // Clear all models
  const handleClearAllModels = () => {
    disposeCurrentModel();
    currentLoadedIdRef.current = null;
    setLoadedModels([]);
    setActiveModelId(null);
    setViewerStatus('idle');
    setErrorMessage(null);
    onModelClearedRef.current?.();
  };

  // Update assigned garment for a model
  const handleUpdateAssignedGarment = (modelId: string, newGarmentId: string) => {
    setLoadedModels((prev) =>
      prev.map((item) => {
        if (item.id !== modelId) return item;

        let meta: SampleModelMeta | null = null;
        let label = 'Dòng y phục khác';

        if (newGarmentId === 'ao-tu-than') {
          meta = SAMPLE_MODELS_REGISTRY['tu-than-color.glb'];
          label = 'Áo Tứ Thân';
        } else if (newGarmentId === 'ao-dai-hien-dai') {
          meta = SAMPLE_MODELS_REGISTRY['ao-dai-blue.glb'];
          label = 'Áo Dài Hiện Đại';
        } else if (newGarmentId === 'ao-nhat-binh') {
          meta = SAMPLE_MODELS_REGISTRY['nhat-binh.glb'];
          label = 'Áo Nhật Bình';
        } else if (newGarmentId === 'ao-ngu-than') {
          label = 'Áo Ngũ Thân';
        }

        return {
          ...item,
          assignedGarmentId: newGarmentId,
          assignedGarmentLabel: label,
          matchedMeta: meta,
        };
      })
    );
  };

  // Retry loading current active model
  const handleRetryCurrentModel = () => {
    currentLoadedIdRef.current = null;
    setRetryTrigger((prev) => prev + 1);
  };

  // Check mismatch between active model and current Studio garment
  const isGarmentTypeMismatched = (() => {
    if (!activeRecord || viewerStatus !== 'ready') return false;
    const assigned = activeRecord.assignedGarmentId;
    if (assigned === 'custom_other') return false;

    if (assigned === 'ao-tu-than' && currentGarmentId !== 'ao-tu-than') return true;
    if (assigned === 'ao-dai-hien-dai' && currentGarmentId !== 'ao-dai-hien-dai') return true;
    if (assigned === 'ao-nhat-binh' && currentGarmentId !== 'ao-nhat-binh') return true;
    if (
      assigned === 'ao-ngu-than' &&
      currentGarmentId !== 'ngu-than-tay-chen' &&
      currentGarmentId !== 'ao-tac-ngu-than-tay-thung'
    ) {
      return true;
    }

    return false;
  })();

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isModelReady = viewerStatus === 'ready' && activeRecord !== null;
  const isCurrentlyLoading = viewerStatus === 'loading';

  return (
    <div className="space-y-4">
      {/* 3D VIEWPORT CONTAINER */}
      <div className="relative aspect-[3/4] bg-[#F6F3ED] rounded-sm border border-[#241E1C]/15 overflow-hidden flex flex-col justify-between select-none">
        {/* Hidden file input (supports multiple files upload) */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".glb"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* Hidden additional file input */}
        <input
          ref={additionalFileInputRef}
          type="file"
          accept=".glb"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
        />

        {/* THREE.JS CANVAS CONTAINER */}
        <div
          ref={containerRef}
          className={`w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing ${
            !isModelReady ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        />

        {/* TOP OVERLAY CONTROLS (Active when model is ready) */}
        {isModelReady && activeRecord && (
          <div className="relative z-20 p-3 space-y-2 pointer-events-auto">
            <div className="flex items-start justify-between gap-2">
              {/* Active Model Name & Type Badge */}
              <div className="bg-white/95 backdrop-blur-xs p-2 px-3 rounded-xs border border-[#241E1C]/10 shadow-xs max-w-[65%] space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8B2626] truncate">
                  <FileCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate" title={activeRecord.fileName}>
                    {modelMeta?.title || activeRecord.fileName}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-stone-500">
                  <span>{formatFileSize(activeRecord.fileSizeBytes)}</span>
                  <span>·</span>
                  <span className="text-[#1B4D3E] font-medium">
                    {activeRecord.assignedGarmentLabel}
                  </span>
                  {activeRecord.dimensions && (
                    <>
                      <span>·</span>
                      <span className="text-stone-600 font-mono text-[9px]">
                        {activeRecord.dimensions.width}m × {activeRecord.dimensions.height}m ×{' '}
                        {activeRecord.dimensions.depth}m
                      </span>
                    </>
                  )}
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
                  onClick={() => additionalFileInputRef.current?.click()}
                  className="p-1.5 bg-white/95 hover:bg-white text-[#8B2626] border border-[#241E1C]/15 rounded-xs shadow-xs text-xs font-medium cursor-pointer transition-colors"
                  title="Nạp thêm file .glb khác"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleRemoveModel(activeRecord.id)}
                  className="p-1.5 bg-white/95 hover:bg-red-50 text-red-700 border border-red-200 rounded-xs shadow-xs text-xs cursor-pointer transition-colors"
                  title="Gỡ bỏ mô hình đang xem"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Assigned Garment Selector for Active Model */}
            <div className="bg-white/95 backdrop-blur-xs p-2 rounded-xs border border-[#241E1C]/10 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-600 font-medium">
                  Gắn dòng Việt phục:
                </span>
                <select
                  value={activeRecord.assignedGarmentId}
                  onChange={(e) =>
                    handleUpdateAssignedGarment(activeRecord.id, e.target.value)
                  }
                  className="bg-[#FAF7F2] border border-[#241E1C]/20 px-2 py-0.5 rounded-xs text-[11px] font-medium text-[#241E1C] focus:outline-none focus:border-[#8B2626]"
                >
                  {GARMENTS_ASSIGNABLE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-[10px] text-stone-500 italic">
                (Đã căn chuẩn tâm 0,0,0 & bounding box)
              </span>
            </div>

            {/* MISMATCH WARNING NOTICE */}
            {isGarmentTypeMismatched && (
              <div className="p-2.5 bg-amber-50/95 border border-amber-300 rounded-xs text-xs text-amber-900 flex items-start justify-between gap-2 shadow-xs animate-in fade-in">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-[11px]">
                    <strong className="block text-amber-950 font-semibold">
                      Lệch dòng y phục so với bàn phối Studio
                    </strong>
                    <p className="text-amber-900/90 leading-tight">
                      Mô hình 3D đang xem là <strong>{activeRecord.assignedGarmentLabel}</strong>, trong
                      khi bàn phối Studio đang thiết lập <strong>{currentGarmentName}</strong>.
                    </p>
                  </div>
                </div>

                {onSyncGarmentRef.current && activeRecord.assignedGarmentId !== 'custom_other' && (
                  <button
                    type="button"
                    onClick={() => onSyncGarmentRef.current?.(activeRecord.assignedGarmentId)}
                    className="px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded-xs text-[10px] font-semibold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1 shadow-xs shrink-0"
                  >
                    <span>Chuyển bàn phối sang {activeRecord.assignedGarmentLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* LOADING OVERLAY (Displayed strictly while loading, disappears completely when ready) */}
        {isCurrentlyLoading && (
          <div className="absolute inset-0 z-30 bg-[#F6F3ED]/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-9 h-9 border-3 border-[#8B2626]/20 border-t-[#8B2626] rounded-full animate-spin" />
            <div className="space-y-1">
              <h4 className="font-serif text-sm font-semibold text-[#241E1C]">
                Đang giải mã mô hình 3D...
              </h4>
              <p className="text-xs text-stone-600">
                {loadingProgress > 0
                  ? `Đang nạp: ${loadingProgress}%`
                  : 'Đang xử lý cấu trúc lưới và vật liệu'}
              </p>
            </div>
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

        {/* EMPTY STATE: IMPORT DROPZONE & GUIDELINES (When no active model is ready) */}
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
            <div className="my-auto space-y-3.5 max-w-sm">
              <div className="w-14 h-14 mx-auto rounded-full bg-white border border-[#241E1C]/15 flex items-center justify-center shadow-xs text-[#8B2626]">
                <Upload className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="font-serif text-base font-semibold text-[#241E1C]">
                  Tải mô hình .glb từ máy tính
                </h3>
                <p className="text-xs text-[#241E1C]/75 leading-relaxed">
                  Hỗ trợ tải lần lượt hoặc chọn cùng lúc 3 tệp mẫu: <code>tu-than-color.glb</code>,{' '}
                  <code>ao-dai-blue.glb</code>, <code>nhat-binh.glb</code>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-[#8B2626] hover:bg-[#741E1E] text-white text-xs font-semibold rounded-xs shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2 active:scale-98"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tải mô hình .glb (Chọn 1 hoặc nhiều tệp)</span>
              </button>

              {/* Model Availability Notice for current garment */}
              <div className="p-3 bg-white/85 rounded-xs border border-[#241E1C]/10 text-left text-[11px] space-y-1.5">
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
            <div className="w-full bg-white/80 p-2.5 rounded-xs border border-[#241E1C]/10 text-[10px] text-stone-600 space-y-1 text-left">
              <div className="flex items-center gap-1 text-[#8B2626] font-medium">
                <Info className="w-3 h-3 shrink-0" />
                <span>Xử lý cục bộ bằng File API (Không tải file lên server)</span>
              </div>
              <p className="leading-relaxed text-[10px]">
                Kéo chuột để xoay, cuộn chuột hoặc dùng nút +/- để phóng to/thu nhỏ. Camera tự căn theo
                kích thước bounding box độc lập của từng model.
              </p>
            </div>
          </div>
        )}

        {/* BOTTOM OVERLAY STATUS WITH EXACT ATTRIBUTION & SKETCHFAB LINKS (When model is ready) */}
        {isModelReady && activeRecord && (
          <div className="relative z-20 p-3 pt-0 pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-xs p-2.5 rounded-xs border border-[#241E1C]/10 shadow-xs space-y-1.5 text-left">
              {/* Model Title & Label */}
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <strong className="text-[#8B2626]">
                    {modelMeta?.title || activeRecord.fileName}
                  </strong>
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
                {modelMeta?.description ||
                  'Mô hình 3D do người dùng nạp từ máy tính qua File API trong phiên làm việc.'}
              </p>

              {/* Attribution & Sketchfab Source URL */}
              <div className="text-[10px] text-stone-600 pt-1 border-t border-[#241E1C]/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <strong>Tác giả:</strong> {modelMeta?.author || 'ghostnoface trên Sketchfab'} (Giấy
                  phép CC BY 4.0)
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

      {/* DEDICATED PANEL: QUẢN LÝ VÀ CHUẨN HOÁ MÔ HÌNH 3D ĐÃ TẢI TRONG PHIÊN */}
      <div className="bg-[#FAF7F2] p-4 rounded-sm border border-[#241E1C]/15 space-y-3.5">
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#241E1C]/10 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xs bg-[#8B2626]/10 text-[#8B2626]">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-xs font-semibold text-[#241E1C] flex items-center gap-1.5">
                <span>Mô hình 3D đã tải trong phiên</span>
                <span className="font-sans text-[10px] px-1.5 py-0.2 rounded-full bg-[#8B2626] text-white font-medium">
                  {loadedModels.length} tệp
                </span>
              </h3>
              <p className="text-[10px] text-stone-500">
                Lưu giữ trong bộ nhớ phiên làm việc · Chuyển đổi tức thì không cần tải lại
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {loadedModels.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllModels}
                className="px-2 py-1 text-[11px] text-stone-600 hover:text-red-700 hover:bg-red-50 rounded-xs transition-colors cursor-pointer"
                title="Gỡ toàn bộ mô hình khỏi phiên"
              >
                Gỡ tất cả
              </button>
            )}

            <button
              type="button"
              onClick={() => additionalFileInputRef.current?.click()}
              className="px-2.5 py-1 bg-[#8B2626] hover:bg-[#741E1E] text-white text-[11px] font-medium rounded-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <Upload className="w-3 h-3" />
              <span>Nạp thêm tệp .glb</span>
            </button>
          </div>
        </div>

        {/* List of Loaded Models in Session */}
        {loadedModels.length === 0 ? (
          <div className="p-4 bg-white rounded-xs border border-dashed border-[#241E1C]/20 text-center space-y-2">
            <Layers className="w-6 h-6 text-stone-400 mx-auto" />
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-[#241E1C]">
                Chưa có mô hình nào được nạp vào phiên làm việc
              </p>
              <p className="text-[11px] text-stone-500 max-w-md mx-auto">
                Bạn có thể nạp các tệp <code>tu-than-color.glb</code> (Tứ thân),{' '}
                <code>ao-dai-blue.glb</code> (Áo dài), <code>nhat-binh.glb</code> (Nhật Bình) để sẵn
                sàng chuyển qua lại khi phối đồ.
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white border border-[#8B2626] text-[#8B2626] hover:bg-[#8B2626]/5 rounded-xs text-xs font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Chọn các tệp .glb từ máy</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {loadedModels.map((item) => {
              const isActive = item.id === activeModelId;
              const matchesCurrentGarment =
                (item.assignedGarmentId === 'ao-tu-than' && currentGarmentId === 'ao-tu-than') ||
                (item.assignedGarmentId === 'ao-dai-hien-dai' &&
                  currentGarmentId === 'ao-dai-hien-dai') ||
                (item.assignedGarmentId === 'ao-nhat-binh' && currentGarmentId === 'ao-nhat-binh') ||
                (item.assignedGarmentId === 'ao-ngu-than' &&
                  (currentGarmentId === 'ngu-than-tay-chen' ||
                    currentGarmentId === 'ao-tac-ngu-than-tay-thung'));

              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xs border transition-all text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    isActive
                      ? 'bg-white border-[#8B2626] shadow-xs ring-1 ring-[#8B2626]/20'
                      : 'bg-white/80 hover:bg-white border-[#241E1C]/10'
                  }`}
                >
                  {/* Left: Model Name & Garment Association */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isActive
                            ? 'bg-[#8B2626] animate-pulse'
                            : matchesCurrentGarment
                            ? 'bg-[#1B4D3E]'
                            : 'bg-stone-300'
                        }`}
                      />
                      <span className="font-semibold text-[#241E1C] truncate" title={item.fileName}>
                        {item.matchedMeta?.title || item.fileName}
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono">
                        ({formatFileSize(item.fileSizeBytes)})
                      </span>

                      {isActive && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-xs bg-[#8B2626] text-white font-semibold uppercase tracking-wider">
                          Đang xem
                        </span>
                      )}

                      {!isActive && matchesCurrentGarment && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-xs bg-[#1B4D3E]/10 text-[#1B4D3E] font-medium">
                          Khớp áo Studio
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-stone-600 pl-4">
                      <span>Tệp: <code className="text-[#8B2626]">{item.fileName}</code></span>
                      <span>·</span>
                      <div className="flex items-center gap-1">
                        <span>Gắn dòng:</span>
                        <select
                          value={item.assignedGarmentId}
                          onChange={(e) => handleUpdateAssignedGarment(item.id, e.target.value)}
                          className="bg-[#FAF7F2] border border-[#241E1C]/20 px-1.5 py-0.5 rounded-xs text-[10px] font-medium text-[#241E1C] focus:outline-none focus:border-[#8B2626]"
                        >
                          {GARMENTS_ASSIGNABLE_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {item.dimensions && (
                        <>
                          <span>·</span>
                          <span className="text-stone-500 font-mono text-[9px]">
                            KT: {item.dimensions.width}m × {item.dimensions.height}m ×{' '}
                            {item.dimensions.depth}m
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {!isActive ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (activeModelId !== item.id) {
                            setActiveModelId(item.id);
                          }
                        }}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-[#8B2626] hover:text-white text-[#241E1C] rounded-xs font-medium text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Xem mô hình</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#8B2626] font-medium flex items-center gap-1 px-2 py-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Hiển thị trên sân khấu</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveModel(item.id)}
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

        {/* Standardization & Bounding Box Notice */}
        <div className="p-3 bg-white/90 rounded-xs border border-[#241E1C]/10 text-[10px] text-stone-600 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-[#8B2626]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chuẩn hoá mô hình & Khung nhìn</span>
          </div>
          <p className="leading-relaxed">
            Mỗi mô hình được giải mã độc lập, tự động căn tâm hình học về tọa độ <strong>(0, 0, 0)</strong> và camera
            tự điều chỉnh khoảng cách theo bounding box riêng. Hiện <strong>chưa ghép nối lên mannequin chung</strong> để
            tránh sai lệch tỉ lệ và xung đột trục tọa độ giữa các nguồn tài nguyên 3D khác nhau.
          </p>
        </div>
      </div>
    </div>
  );
};
