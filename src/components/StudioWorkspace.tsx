import React, { useState } from 'react';
import { GARMENTS_DATA, STUDIO_COLOR_PRESETS } from '../data/mockData';
import {
  INNER_LAYER_OPTIONS,
  BOTTOM_LAYER_OPTIONS,
  ACCESSORY_HEAD_OPTIONS,
  ACCESSORY_HAND_OPTIONS,
  GARMENT_COMPATIBILITY_RULES,
  checkLayerCompatibility,
  resolveGarmentLayerTransition,
} from '../data/layerCompatibilityRules';
import {
  PreferenceProfile,
  InnerLayerId,
  BottomLayerId,
  AccessoryHeadId,
  AccessoryHandId,
  StudioOutfitState,
  SavedOutfitItem,
  normalizeGarmentChoice,
} from '../types';
import { GlbModelViewer } from './GlbModelViewer';
import { mapPreferenceToStudio, StudioAppliedResult } from '../utils/preferenceMapper';
import {
  Layers,
  Palette,
  Check,
  AlertCircle,
  RefreshCw,
  BookmarkPlus,
  UserCheck,
  Edit3,
  Trash2,
  Sparkles,
  CheckCheck,
  Info,
  X,
  Undo2,
  ShieldCheck,
  Compass,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface StudioWorkspaceProps {
  initialGarmentId?: string | null;
  onSavedToLookbook?: (outfit: SavedOutfitItem | string) => void;
  preferenceProfile: PreferenceProfile | null;
  onOpenPreferenceWizard: () => void;
  onClearPreferenceProfile: () => void;
  editingOutfit?: SavedOutfitItem | null;
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  initialGarmentId,
  onSavedToLookbook,
  preferenceProfile,
  onOpenPreferenceWizard,
  onClearPreferenceProfile,
  editingOutfit,
}) => {
  // Current outfit configuration (Mặc định Áo Tứ Thân cùng nón lá và quạt theo yêu cầu)
  const [selectedGarmentId, setSelectedGarmentId] = useState<string>(() => {
    if (initialGarmentId) return initialGarmentId;
    return 'ao-tu-than';
  });

  const [innerLayer, setInnerLayer] = useState<InnerLayerId>(() => {
    const defaultGarment = initialGarmentId || 'ao-tu-than';
    const rule = GARMENT_COMPATIBILITY_RULES[defaultGarment];
    return rule ? rule.defaultLayers.innerLayer : 'yem-dao';
  });
  const [bottomLayer, setBottomLayer] = useState<BottomLayerId>(() => {
    const defaultGarment = initialGarmentId || 'ao-tu-than';
    const rule = GARMENT_COMPATIBILITY_RULES[defaultGarment];
    return rule ? rule.defaultLayers.bottomLayer : 'vay-xep-ly';
  });
  const [selectedColor, setSelectedColor] = useState<string>('#8B2626'); // Đỏ chu sa
  const [accessoryHead, setAccessoryHead] = useState<AccessoryHeadId>(() => {
    const defaultGarment = initialGarmentId || 'ao-tu-than';
    const rule = GARMENT_COMPATIBILITY_RULES[defaultGarment];
    return rule ? rule.defaultLayers.accessoryHead : 'non-la';
  });
  const [accessoryHand, setAccessoryHand] = useState<AccessoryHandId>(() => {
    const defaultGarment = initialGarmentId || 'ao-tu-than';
    const rule = GARMENT_COMPATIBILITY_RULES[defaultGarment];
    return rule ? rule.defaultLayers.accessoryHand : 'quat-nan';
  });
  const [occasionGoal, setOccasionGoal] = useState<string>('dao_pho');
  const [currentPropsVisibility, setCurrentPropsVisibility] = useState<{ fan?: boolean; hat?: boolean; bag?: boolean }>({
    fan: true,
    hat: true,
    bag: true,
  });
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  // Interactive UI states
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState<boolean>(false);
  const [isManualEdited, setIsManualEdited] = useState<boolean>(false);

  // Undo management
  const [previousOutfitState, setPreviousOutfitState] = useState<StudioOutfitState | null>(null);
  const [autoTransitionAlert, setAutoTransitionAlert] = useState<{
    fromGarmentName: string;
    toGarmentName: string;
    changedItems: {
      slotName: string;
      fromLabel: string;
      toLabel: string;
      reason: string;
    }[];
    retainedItems: {
      slotName: string;
      label: string;
    }[];
    timestamp: string;
  } | null>(null);
  const [undoToast, setUndoToast] = useState<string | null>(null);

  const [appliedReport, setAppliedReport] = useState<{
    success: string[];
    notices: string[];
    timestamp: string;
  } | null>(null);

  // Restore complete outfit when editingOutfit is provided
  React.useEffect(() => {
    if (editingOutfit) {
      setSelectedGarmentId(editingOutfit.garmentId);
      setSelectedColor(editingOutfit.selectedColor);
      setInnerLayer(editingOutfit.innerLayer);
      setBottomLayer(editingOutfit.bottomLayer);
      setAccessoryHead(editingOutfit.accessoryHead);
      setAccessoryHand(editingOutfit.accessoryHand);
      setOccasionGoal(editingOutfit.occasionGoal);
      if (editingOutfit.propsVisible) {
        setCurrentPropsVisibility(editingOutfit.propsVisible);
      }
      setIsManualEdited(true);
      setUndoToast(`Đã khôi phục trọn vẹn bản phối "${editingOutfit.title}" để bạn tiếp tục tinh chỉnh.`);
    }
  }, [editingOutfit]);

  // Synchronize when initialGarmentId prop updates from navigation
  React.useEffect(() => {
    if (initialGarmentId && initialGarmentId !== selectedGarmentId) {
      handleSelectGarmentWithCompatibility(initialGarmentId);
    }
  }, [initialGarmentId]);

  const currentGarment = GARMENTS_DATA.find((g) => g.id === selectedGarmentId) || GARMENTS_DATA[0];
  const currentRule = GARMENT_COMPATIBILITY_RULES[selectedGarmentId] || GARMENT_COMPATIBILITY_RULES['ngu-than-tay-chen'];

  // Current Outfit snapshot
  const getCurrentSnapshot = (): StudioOutfitState => ({
    garmentId: selectedGarmentId,
    innerLayer,
    bottomLayer,
    selectedColor,
    accessoryHead,
    accessoryHand,
    occasionGoal,
  });

  // Helper to format profile garment name
  const getProfileGarmentLabel = () => {
    if (!preferenceProfile) return 'Chưa định dòng';
    const normalized = normalizeGarmentChoice(preferenceProfile.garmentChoice);
    if (normalized.garmentChoice === 'ao_dai') return 'Áo dài (Hiện Đại)';
    if (normalized.garmentChoice === 'ao_tu_than') return 'Áo tứ thân';
    if (normalized.garmentChoice === 'ao_nhat_binh') return 'Áo Nhật Bình';
    if (normalized.garmentChoice === 'ao_ngu_than') {
      const sub = preferenceProfile.subGarmentVariantId || normalized.subVariantId;
      if (sub === 'ao-tac-ngu-than-tay-thung') return 'Áo ngũ thân (Áo tấc tay thụng)';
      if (sub === 'ngu-than-tay-chen') return 'Áo ngũ thân (Tay chẽn)';
      return 'Áo ngũ thân';
    }
    return 'Chưa biết chọn loại nào';
  };

  // SMART GARMENT SWITCH: Evaluates compatibility, retains valid layers, auto-swaps invalid ones with report
  const handleSelectGarmentWithCompatibility = (nextGarmentId: string) => {
    // Normalize if category identifier or alias is passed
    let resolvedGarmentId = nextGarmentId;
    if (resolvedGarmentId === 'ao-ngu-than' || resolvedGarmentId === 'ao_ngu_than') {
      resolvedGarmentId = 'ngu-than-tay-chen';
    } else if (resolvedGarmentId === 'ao_dai') {
      resolvedGarmentId = 'ao-dai-hien-dai';
    } else if (resolvedGarmentId === 'ao_tu_than') {
      resolvedGarmentId = 'ao-tu-than';
    } else if (resolvedGarmentId === 'ao_nhat_binh') {
      resolvedGarmentId = 'ao-nhat-binh';
    }

    if (resolvedGarmentId === selectedGarmentId) return;

    // Snapshot for Undo
    const snapshot = getCurrentSnapshot();
    setPreviousOutfitState(snapshot);

    const transition = resolveGarmentLayerTransition(
      selectedGarmentId,
      resolvedGarmentId,
      snapshot
    );

    setSelectedGarmentId(transition.nextOutfit.garmentId);
    setInnerLayer(transition.nextOutfit.innerLayer);
    setBottomLayer(transition.nextOutfit.bottomLayer);
    setAccessoryHead(transition.nextOutfit.accessoryHead);
    setAccessoryHand(transition.nextOutfit.accessoryHand);
    setIsManualEdited(true);

    if (transition.hasAutoChanged) {
      setAutoTransitionAlert({
        fromGarmentName: currentGarment.name,
        toGarmentName: GARMENT_COMPATIBILITY_RULES[resolvedGarmentId]?.garmentName || resolvedGarmentId,
        changedItems: transition.changedItems,
        retainedItems: transition.retainedItems,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
    } else {
      setAutoTransitionAlert(null);
    }
  };

  // UNDO RECENT CHANGE
  const handleUndoRecentChange = () => {
    if (!previousOutfitState) return;

    setSelectedGarmentId(previousOutfitState.garmentId);
    setInnerLayer(previousOutfitState.innerLayer);
    setBottomLayer(previousOutfitState.bottomLayer);
    setSelectedColor(previousOutfitState.selectedColor);
    setAccessoryHead(previousOutfitState.accessoryHead);
    setAccessoryHand(previousOutfitState.accessoryHand);
    setOccasionGoal(previousOutfitState.occasionGoal);

    const restoredName = GARMENT_COMPATIBILITY_RULES[previousOutfitState.garmentId]?.garmentName || previousOutfitState.garmentId;
    setPreviousOutfitState(null);
    setAutoTransitionAlert(null);
    setUndoToast(`Đã hoàn tác và phục hồi bản phối: ${restoredName}.`);
    setTimeout(() => setUndoToast(null), 4000);
  };

  // EXPLICIT ACTION: Apply saved profile preferences to the Studio styling canvas
  const handleApplyPreferences = () => {
    if (!preferenceProfile) return;

    // Save snapshot before applying
    setPreviousOutfitState(getCurrentSnapshot());

    const applied: StudioAppliedResult = mapPreferenceToStudio(
      preferenceProfile,
      selectedGarmentId,
      selectedColor
    );

    if (applied.garmentId) {
      setSelectedGarmentId(applied.garmentId);
    }
    if (applied.colorHex) {
      setSelectedColor(applied.colorHex);
    }
    if (applied.innerLayer) {
      setInnerLayer(applied.innerLayer);
    }
    if (applied.bottomLayer) {
      setBottomLayer(applied.bottomLayer);
    }
    if (applied.accessoryHead) {
      setAccessoryHead(applied.accessoryHead);
    }
    if (applied.accessoryHand) {
      setAccessoryHand(applied.accessoryHand);
    }
    if (applied.occasionGoal) {
      setOccasionGoal(applied.occasionGoal);
    }

    setIsManualEdited(false);
    setAutoTransitionAlert(null);
    setAppliedReport({
      success: applied.successMessages,
      notices: applied.noticeMessages,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });
  };

  // CONFIRMED RESET
  const handleConfirmReset = () => {
    // Save history for undo before reset
    setPreviousOutfitState(getCurrentSnapshot());

    setSelectedGarmentId('ao-tu-than');
    setInnerLayer('yem-dao');
    setBottomLayer('vay-xep-ly');
    setSelectedColor('#8B2626');
    setAccessoryHead('non-la');
    setAccessoryHand('quat-nan');
    setOccasionGoal('dao_pho');
    setIsManualEdited(false);
    setAppliedReport(null);
    setAutoTransitionAlert(null);
    setConfirmResetOpen(false);

    setUndoToast('Đã đặt lại bàn phối về mặc định (Hồ sơ sở thích đã lưu vẫn được giữ nguyên).');
    setTimeout(() => setUndoToast(null), 4000);
  };

  const handleSaveDraft = () => {
    const colorName = STUDIO_COLOR_PRESETS.find((c) => c.hex.toLowerCase() === selectedColor.toLowerCase())?.name || 'Màu phối';
    const outfitTitle = `${currentGarment.name} (${colorName})`;
    
    const savedItem: SavedOutfitItem = {
      id: editingOutfit?.id || `outfit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: outfitTitle,
      savedAt: new Date().toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      garmentId: selectedGarmentId,
      selectedColor,
      innerLayer,
      bottomLayer,
      accessoryHead,
      accessoryHand,
      occasionGoal,
      propsVisible: currentPropsVisibility,
    };

    if (onSavedToLookbook) {
      onSavedToLookbook(savedItem as any);
    }
    setSavedSuccessMessage(`✓ Đã lưu trọn vẹn bản phối "${outfitTitle}" vào Lookbook.`);
    setTimeout(() => {
      setSavedSuccessMessage(null);
    }, 4500);
  };

  // Resolve metadata for "Các lớp đang phối"
  const currentInnerMeta = INNER_LAYER_OPTIONS.find((i) => i.id === innerLayer);
  const currentBottomMeta = BOTTOM_LAYER_OPTIONS.find((b) => b.id === bottomLayer);
  const currentHeadMeta = ACCESSORY_HEAD_OPTIONS.find((h) => h.id === accessoryHead);
  const currentHandMeta = ACCESSORY_HAND_OPTIONS.find((a) => a.id === accessoryHand);
  const currentColorMeta = STUDIO_COLOR_PRESETS.find((c) => c.hex.toLowerCase() === selectedColor.toLowerCase());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Studio Header & Navigation - Minimalist Style */}
      <div className="border-b border-[#241E1C]/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#241E1C] font-semibold tracking-tight">
            Studio Phối Dáng
          </h1>
          <p className="text-xs sm:text-sm text-[#241E1C]/60 mt-0.5">
            Phối lớp y phục truyền thống & tương tác thời gian thực trên không gian 3D.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenPreferenceWizard}
            className="px-3 py-1.5 text-xs font-medium text-[#8B2626] bg-[#8B2626]/5 hover:bg-[#8B2626]/10 border border-[#8B2626]/20 rounded-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{preferenceProfile ? 'Hồ sơ sở thích' : 'Tạo hồ sơ sở thích'}</span>
          </button>

          <button
            onClick={() => setConfirmResetOpen(true)}
            className="px-3 py-1.5 text-xs font-medium text-[#241E1C]/70 hover:text-[#8B2626] border border-[#241E1C]/15 rounded-sm bg-white hover:bg-[#FAF7F2] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* CONFIRM RESET DIALOG */}
      {confirmResetOpen && (
        <div className="p-4 bg-white border border-[#8B2626]/40 rounded-sm shadow-md space-y-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#8B2626] shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h3 className="font-semibold text-sm text-[#241E1C]">
                Xác nhận làm mới bàn phối?
              </h3>
              <p className="text-[#241E1C]/80 leading-relaxed">
                Thao tác này sẽ đặt lại các lựa chọn áo chính, lớp lót, hạ y và phụ kiện trên bàn phối về mặc định.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#241E1C]/10">
            <button
              type="button"
              onClick={() => setConfirmResetOpen(false)}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-[#241E1C] text-xs font-medium rounded-xs cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={handleConfirmReset}
              className="px-3.5 py-1.5 bg-[#8B2626] hover:bg-[#741E1E] text-white text-xs font-semibold rounded-xs cursor-pointer shadow-xs"
            >
              Xác nhận làm mới
            </button>
          </div>
        </div>
      )}

      {/* MINIMALIST PREFERENCE PROFILE STRIP */}
      {preferenceProfile && (
        <div className="p-2.5 px-3.5 bg-white border border-[#241E1C]/10 rounded-sm shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-[#1B4D3E]" />
            <span className="font-medium text-[#241E1C]">Hồ sơ sở thích:</span>
            <span className="px-2 py-0.5 bg-[#FAF7F2] text-[#8B2626] font-medium rounded-xs border border-[#241E1C]/10 text-[11px]">
              {getProfileGarmentLabel()}
            </span>
            <span className="px-2 py-0.5 bg-[#FAF7F2] text-[#241E1C]/70 rounded-xs border border-[#241E1C]/10 text-[11px]">
              {preferenceProfile.occasion}
            </span>
            <div className="flex items-center gap-1">
              {preferenceProfile.likedColors.map((hex) => (
                <span
                  key={hex}
                  className="w-3 h-3 rounded-xs border border-black/15 inline-block"
                  style={{ backgroundColor: hex }}
                  title={STUDIO_COLOR_PRESETS.find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.name}
                />
              ))}
            </div>
            {isManualEdited && (
              <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-xs">
                Đang tinh chỉnh tay
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyPreferences}
              className="px-2.5 py-1 bg-[#8B2626] hover:bg-[#741E1E] text-[#FAF7F2] text-[11px] font-medium rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#D4A054]" />
              <span>Áp dụng vào phối</span>
            </button>
            <button
              type="button"
              onClick={onOpenPreferenceWizard}
              className="text-[11px] text-[#241E1C]/60 hover:text-[#8B2626] cursor-pointer"
            >
              Sửa
            </button>
            <span className="text-[#241E1C]/20">|</span>
            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              className="text-[11px] text-[#241E1C]/40 hover:text-red-700 cursor-pointer"
            >
              Xóa
            </button>
          </div>

          {/* Inline confirmation to clear profile */}
          {confirmDeleteOpen && (
            <div className="w-full mt-1 p-2 bg-[#FAF7F2] border border-[#8B2626]/20 rounded-xs flex items-center justify-between gap-2 text-xs">
              <span className="text-[#8B2626] text-[11px]">Xác nhận xóa hồ sơ sở thích đã lưu?</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOpen(false)}
                  className="px-2 py-0.5 bg-white border border-[#241E1C]/15 rounded-xs text-[11px]"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClearPreferenceProfile();
                    setConfirmDeleteOpen(false);
                    setAppliedReport(null);
                  }}
                  className="px-2 py-0.5 bg-[#8B2626] text-white rounded-xs text-[11px] font-medium"
                >
                  Xóa
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AUTO TRANSITION ALERT BANNER WITH "HOÀN TÁC THAY ĐỔI GẦN NHẤT" */}
      {autoTransitionAlert && (
        <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-sm shadow-xs space-y-3 text-xs animate-in fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-900 font-semibold">
              <Compass className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                Đã chuyển sang {autoTransitionAlert.toGarmentName} · Tự động điều chỉnh các lớp chưa tương thích
              </span>
              <span className="text-[10px] text-amber-700/60 font-normal">
                ({autoTransitionAlert.timestamp})
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {previousOutfitState && (
                <button
                  type="button"
                  onClick={handleUndoRecentChange}
                  className="px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded-xs font-medium flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 transition-transform"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Hoàn tác thay đổi gần nhất</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setAutoTransitionAlert(null)}
                className="text-amber-800/60 hover:text-amber-950 cursor-pointer p-0.5"
                title="Đóng thông báo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-1.5 p-3 bg-amber-100/50 rounded-xs border border-amber-200/80 text-[11px] text-amber-900/90">
            {autoTransitionAlert.changedItems.map((c, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                <span className="font-semibold text-amber-950">{c.slotName}:</span>
                <span>
                  Đổi từ <span className="line-through opacity-75">{c.fromLabel}</span> → <strong>{c.toLabel}</strong>
                </span>
                <span className="text-amber-800 text-[10px] italic">({c.reason})</span>
              </div>
            ))}

            {autoTransitionAlert.retainedItems.length > 0 && (
              <div className="pt-1 text-amber-800/80 text-[11px]">
                <strong className="text-emerald-800">✓ Đã giữ nguyên hợp lệ:</strong>{' '}
                {autoTransitionAlert.retainedItems.map((r) => `${r.slotName} (${r.label})`).join(', ')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* UNDO FEEDBACK TOAST */}
      {undoToast && (
        <div className="p-3 bg-[#241E1C] text-[#FAF7F2] text-xs rounded-sm flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <Undo2 className="w-4 h-4 text-[#D4A054]" />
            <span>{undoToast}</span>
          </div>
          <button
            onClick={() => setUndoToast(null)}
            className="text-white/60 hover:text-white text-xs underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* APPLIED REPORT NOTIFICATION TOAST */}
      {appliedReport && (
        <div className="p-3.5 bg-white border border-[#1B4D3E]/30 rounded-sm shadow-xs space-y-2 text-xs animate-in fade-in">
          <div className="flex items-center justify-between border-b border-[#241E1C]/5 pb-1.5">
            <div className="flex items-center gap-1.5 text-[#1B4D3E] font-semibold">
              <CheckCheck className="w-4 h-4" />
              <span>Đã đồng bộ sở thích vào bàn phối lúc {appliedReport.timestamp}</span>
            </div>
            <button
              onClick={() => setAppliedReport(null)}
              className="text-[#241E1C]/40 hover:text-[#241E1C] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1 text-[#241E1C]/80">
            {appliedReport.success.map((msg, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                <span className="text-[#1B4D3E]">✓</span>
                <span>{msg}</span>
              </div>
            ))}
          </div>

          {appliedReport.notices.length > 0 && (
            <div className="pt-1.5 border-t border-[#241E1C]/5 space-y-1 text-[#9E6E20] text-[11px]">
              {appliedReport.notices.map((notice, nIdx) => (
                <div key={nIdx} className="flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#D4A054]" />
                  <span>{notice}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SAVE TO LOOKBOOK NOTIFICATION TOAST */}
      {savedSuccessMessage && (
        <div className="p-3 bg-[#1B4D3E] text-[#FAF7F2] text-xs font-medium rounded-sm flex items-center justify-between shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#D4A054]" />
            <span>{savedSuccessMessage}</span>
          </div>
          <button
            onClick={() => setSavedSuccessMessage(null)}
            className="text-white/60 hover:text-white text-xs underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 3-Column Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Tủ đồ & Phân lớp y phục (4 cols, order-2 on mobile so 3D preview is first) */}
        <div className="lg:col-span-4 order-2 lg:order-1 bg-white p-5 rounded-sm border border-[#241E1C]/10 space-y-5">
          <div className="border-b border-[#241E1C]/10 pb-3 flex items-center justify-between">
            <h2 className="font-serif text-sm font-semibold uppercase tracking-wider text-xs text-[#241E1C] flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-[#8B2626]" />
              <span>Phân Lớp Y Phục</span>
            </h2>
            <span className="text-[11px] text-[#241E1C]/40">Quy chuẩn</span>
          </div>

          {/* Layer A: Thân áo chính */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[#241E1C]/80 block">
              Thân áo chính:
            </label>

            <div className="space-y-1.5">
              {GARMENTS_DATA.map((g) => {
                const isSelected = selectedGarmentId === g.id;
                const isMatchProfile = preferenceProfile && (
                  preferenceProfile.garmentChoice === g.category ||
                  preferenceProfile.subGarmentVariantId === g.id
                );

                return (
                  <button
                    key={g.id}
                    onClick={() => handleSelectGarmentWithCompatibility(g.id)}
                    className={`w-full text-left p-2.5 rounded-sm text-xs transition-colors flex items-center justify-between cursor-pointer border ${
                      isSelected
                        ? 'bg-[#8B2626] text-[#FAF7F2] font-medium border-[#8B2626]'
                        : 'bg-[#FAF7F2] text-[#241E1C]/85 hover:bg-[#241E1C]/5 border-[#241E1C]/10'
                    }`}
                  >
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{g.name}</span>
                        {isMatchProfile && (
                          <span className={`text-[9px] px-1 py-0.2 rounded-xs ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-[#8B2626]/10 text-[#8B2626]'
                          }`}>
                            Khớp hồ sơ
                          </span>
                        )}
                      </div>
                      <div className={`text-[10px] truncate ${isSelected ? 'text-white/80' : 'text-[#241E1C]/60'}`}>
                        {g.subName}
                      </div>
                    </div>

                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Layer B: Lớp áo lót trong */}
          <div className="space-y-2 pt-2 border-t border-[#241E1C]/10">
            <label className="text-xs font-medium text-[#241E1C]/80 block">
              Lớp lót bên trong:
            </label>

            <div className="space-y-1.5 text-xs">
              {INNER_LAYER_OPTIONS.map((item) => {
                const isSelected = innerLayer === item.id;
                const compat = checkLayerCompatibility(selectedGarmentId, 'innerLayer', item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!compat.isCompatible}
                    title={!compat.isCompatible ? compat.reason : undefined}
                    onClick={() => {
                      if (compat.isCompatible) {
                        setInnerLayer(item.id);
                        setIsManualEdited(true);
                      }
                    }}
                    className={`w-full p-2 rounded-sm text-left transition-colors flex items-center justify-between border ${
                      !compat.isCompatible
                        ? 'opacity-35 cursor-not-allowed bg-stone-50 border-stone-200 text-stone-400'
                        : isSelected
                        ? 'border-2 border-[#8B2626] bg-[#8B2626]/5 text-[#8B2626] font-medium'
                        : 'border border-[#241E1C]/15 bg-white text-[#241E1C]/80 hover:bg-stone-50 cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {compat.isRecommended && compat.isCompatible && (
                          <span className="text-[9px] bg-[#1B4D3E]/10 text-[#1B4D3E] px-1 py-0.2 rounded-xs font-medium">
                            Khuyên dùng
                          </span>
                        )}
                        {!compat.isCompatible && (
                          <span className="text-[9px] text-stone-400">
                            Không hỗ trợ
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-500">{item.subName}</div>
                    </div>

                    {isSelected && compat.isCompatible && (
                      <Check className="w-3.5 h-3.5 text-[#8B2626] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Layer C: Quần / Xiêm */}
          <div className="space-y-2 pt-2 border-t border-[#241E1C]/10">
            <label className="text-xs font-medium text-[#241E1C]/80 block">
              Hạ y (Quần lụa / Váy):
            </label>

            <div className="space-y-1.5 text-xs">
              {BOTTOM_LAYER_OPTIONS.map((item) => {
                const isSelected = bottomLayer === item.id;
                const compat = checkLayerCompatibility(selectedGarmentId, 'bottomLayer', item.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!compat.isCompatible}
                    title={!compat.isCompatible ? compat.reason : undefined}
                    onClick={() => {
                      if (compat.isCompatible) {
                        setBottomLayer(item.id);
                        setIsManualEdited(true);
                      }
                    }}
                    className={`w-full p-2 rounded-sm text-left transition-colors flex items-center justify-between border ${
                      !compat.isCompatible
                        ? 'opacity-35 cursor-not-allowed bg-stone-50 border-stone-200 text-stone-400'
                        : isSelected
                        ? 'border-2 border-[#8B2626] bg-[#8B2626]/5 text-[#8B2626] font-medium'
                        : 'border border-[#241E1C]/15 bg-white text-[#241E1C]/80 hover:bg-stone-50 cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {compat.isRecommended && compat.isCompatible && (
                          <span className="text-[9px] bg-[#1B4D3E]/10 text-[#1B4D3E] px-1 py-0.2 rounded-xs font-medium">
                            Khuyên dùng
                          </span>
                        )}
                        {!compat.isCompatible && (
                          <span className="text-[9px] text-stone-400">
                            Không hỗ trợ
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-500">{item.subName}</div>
                    </div>

                    {isSelected && compat.isCompatible && (
                      <Check className="w-3.5 h-3.5 text-[#8B2626] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Layer D: Phụ kiện */}
          <div className="space-y-3 pt-2 border-t border-[#241E1C]/10">
            <label className="text-xs font-medium text-[#241E1C]/80 block">
              Phụ kiện kèm theo:
            </label>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#241E1C]/60 text-[11px] block mb-1">Khăn đội đầu:</span>
                <div className="grid grid-cols-1 gap-1.5">
                  {ACCESSORY_HEAD_OPTIONS.map((item) => {
                    const isSelected = accessoryHead === item.id;
                    const compat = checkLayerCompatibility(selectedGarmentId, 'accessoryHead', item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={!compat.isCompatible}
                        title={!compat.isCompatible ? compat.reason : undefined}
                        onClick={() => {
                          if (compat.isCompatible) {
                            setAccessoryHead(item.id);
                            setIsManualEdited(true);
                          }
                        }}
                        className={`p-1.5 px-2.5 rounded-sm text-left transition-colors flex items-center justify-between border text-[11px] ${
                          !compat.isCompatible
                            ? 'opacity-35 cursor-not-allowed bg-stone-50 border-stone-200 text-stone-400'
                            : isSelected
                            ? 'border-2 border-[#8B2626] bg-[#8B2626]/5 text-[#8B2626] font-medium'
                            : 'border border-[#241E1C]/15 bg-white text-[#241E1C]/80 hover:bg-stone-50 cursor-pointer'
                        }`}
                      >
                        <span>{item.name}</span>
                        {isSelected && compat.isCompatible && <Check className="w-3 h-3 text-[#8B2626]" />}
                        {!compat.isCompatible && (
                          <span className="text-[9px] text-stone-400">Không hỗ trợ</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="text-[#241E1C]/60 text-[11px] block mb-1">Đồ cầm tay:</span>
                <div className="grid grid-cols-1 gap-1.5">
                  {ACCESSORY_HAND_OPTIONS.map((item) => {
                    const isSelected = accessoryHand === item.id;
                    const compat = checkLayerCompatibility(selectedGarmentId, 'accessoryHand', item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={!compat.isCompatible}
                        title={!compat.isCompatible ? compat.reason : undefined}
                        onClick={() => {
                          if (compat.isCompatible) {
                            setAccessoryHand(item.id);
                            setIsManualEdited(true);
                          }
                        }}
                        className={`p-1.5 px-2.5 rounded-sm text-left transition-colors flex items-center justify-between border text-[11px] ${
                          !compat.isCompatible
                            ? 'opacity-35 cursor-not-allowed bg-stone-50 border-stone-200 text-stone-400'
                            : isSelected
                            ? 'border-2 border-[#8B2626] bg-[#8B2626]/5 text-[#8B2626] font-medium'
                            : 'border border-[#241E1C]/15 bg-white text-[#241E1C]/80 hover:bg-stone-50 cursor-pointer'
                        }`}
                      >
                        <span>{item.name}</span>
                        {isSelected && compat.isCompatible && <Check className="w-3 h-3 text-[#8B2626]" />}
                        {!compat.isCompatible && (
                          <span className="text-[9px] text-stone-400">Không hỗ trợ</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Sân khấu dựng hình Mannequin Preview (5 cols, order-1 on mobile so 3D model is visible first) */}
        <div className="lg:col-span-5 order-1 lg:order-2 bg-white p-5 rounded-sm border border-[#241E1C]/10 space-y-4">
          <div className="border-b border-[#241E1C]/10 pb-3 flex items-center justify-between">
            <h2 className="font-serif text-sm font-semibold uppercase tracking-wider text-xs text-[#241E1C] flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-[#8B2626]" />
              <span>Không Gian Trực Quan</span>
            </h2>
            <span className="text-[11px] font-medium text-[#8B2626] bg-[#8B2626]/10 px-2 py-0.5 rounded-xs">
              {currentGarment.name}
            </span>
          </div>

          {/* Color Palette Selector - Minimalist dots */}
          <div className="flex items-center justify-between text-xs py-1 border-b border-[#241E1C]/5 pb-2.5">
            <span className="text-[#241E1C]/70 font-medium">Sắc độ tà áo:</span>
            <div className="flex items-center gap-2">
              {STUDIO_COLOR_PRESETS.map((c) => {
                const isSelected = selectedColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => {
                      setSelectedColor(c.hex);
                      setIsManualEdited(true);
                    }}
                    title={`${c.name} - ${c.note}`}
                    className={`w-6 h-6 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                      isSelected ? 'ring-2 ring-offset-2 ring-[#8B2626] scale-110 border-white' : 'border-black/15 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && (
                      <Check className={`w-3 h-3 ${c.hex === '#EAE6DF' ? 'text-black' : 'text-white'}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real GLB 3D Model Viewer Staging Area */}
          <GlbModelViewer
            currentGarmentId={selectedGarmentId}
            currentGarmentName={currentGarment.name}
            onSyncGarment={handleSelectGarmentWithCompatibility}
            selectedHeadAccessory={accessoryHead}
            selectedHandAccessory={accessoryHand}
            externalPropsVisibility={currentPropsVisibility}
            onPropsVisibilityChange={(props) => setCurrentPropsVisibility(props)}
          />

          {/* Mobile quick save button */}
          <button
            type="button"
            onClick={handleSaveDraft}
            className="lg:hidden w-full py-2.5 bg-[#8B2626] hover:bg-[#741E1E] text-[#FAF7F2] text-xs font-semibold rounded-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>Lưu bản phối này vào Lookbook</span>
          </button>
        </div>

        {/* Right Column: Định hình dịp & Bản phối (3 cols, order-3) */}
        <div className="lg:col-span-3 order-3 lg:order-3 bg-white p-5 rounded-sm border border-[#241E1C]/10 space-y-5">
          <div className="border-b border-[#241E1C]/10 pb-3 flex items-center justify-between">
            <h2 className="font-serif text-sm font-semibold uppercase tracking-wider text-xs text-[#241E1C]">
              Bản Phối & Bối Cảnh
            </h2>
            <span className="text-[11px] text-[#241E1C]/40">Thiết lập</span>
          </div>

          {/* Occasion selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-[#241E1C]/75 block">
              Dịp xuất hiện:
            </label>
            <select
              value={occasionGoal}
              onChange={(e) => {
                setOccasionGoal(e.target.value);
                setIsManualEdited(true);
              }}
              className="w-full bg-[#FAF7F2] border border-[#241E1C]/15 p-2 rounded-sm text-xs focus:outline-none focus:border-[#8B2626]"
            >
              <option value="ky_yeu">Chụp kỷ yếu tốt nghiệp</option>
              <option value="le_tet">Lễ Tết Nguyên Đán</option>
              <option value="thuyet_trinh">Thuyết trình văn hóa học đường</option>
              <option value="dao_pho">Dạo phố cuối tuần</option>
              <option value="cuoi_hoi">Đám cưới / Nghi lễ gia đình</option>
            </select>
          </div>

          {/* Current Outfit Spec Card - Minimalist */}
          <div className="bg-[#FAF7F2] p-3 rounded-sm border border-[#241E1C]/5 space-y-2 text-xs">
            <div className="font-semibold text-[#8B2626] font-serif text-[11px] uppercase tracking-wider">
              Chi tiết các lớp
            </div>
            <div className="space-y-1.5 text-[#241E1C]/80 text-[11px]">
              <div className="flex justify-between items-center"><span className="text-[#241E1C]/50">Áo chính:</span> <span className="font-medium text-[#241E1C]">{currentGarment.name}</span></div>
              <div className="flex justify-between items-center"><span className="text-[#241E1C]/50">Lớp lót:</span> <span className="font-medium text-[#241E1C]">{currentInnerMeta?.name}</span></div>
              <div className="flex justify-between items-center"><span className="text-[#241E1C]/50">Hạ y:</span> <span className="font-medium text-[#241E1C]">{currentBottomMeta?.name}</span></div>
              <div className="flex justify-between items-center"><span className="text-[#241E1C]/50">Khăn:</span> <span className="font-medium text-[#241E1C]">{currentHeadMeta?.name}</span></div>
              <div className="flex justify-between items-center"><span className="text-[#241E1C]/50">Cầm tay:</span> <span className="font-medium text-[#241E1C]">{currentHandMeta?.name}</span></div>
            </div>
          </div>

          {/* Cultural context card - Minimalist */}
          <div className="p-3 bg-white rounded-sm text-xs space-y-1.5 border border-[#241E1C]/10">
            <div className="flex items-center gap-1.5 font-medium text-xs text-[#241E1C]/80">
              <Compass className="w-3.5 h-3.5 text-[#8B2626]" />
              <span>Ghi chú bối cảnh</span>
            </div>
            <p className="text-[11px] text-[#241E1C]/70 leading-relaxed">
              {currentRule.culturalNotes.summary}
            </p>
          </div>

          {/* Save Action */}
          <button
            onClick={handleSaveDraft}
            className="w-full py-2.5 bg-[#8B2626] hover:bg-[#741E1E] text-[#FAF7F2] text-xs font-semibold rounded-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B2626]"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>Lưu bản phối vào Lookbook</span>
          </button>
        </div>

      </div>

      {/* Discreet footer inspection */}
      <div className="pt-2 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="text-xs text-[#241E1C]/50 hover:text-[#241E1C] flex items-center gap-1.5 py-1.5 px-3 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
        >
          <span>Thông số kỹ thuật</span>
          {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showTechnicalDetails && (
          <div className="w-full bg-white p-4 rounded-sm border border-[#241E1C]/10 animate-in fade-in space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
              <div className="p-2.5 bg-[#FAF7F2] rounded-xs border border-[#241E1C]/5 space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-stone-500 block">Áo chính</span>
                <div className="font-medium text-[#241E1C] truncate" title={currentGarment.name}>
                  {currentGarment.name}
                </div>
                <code className="text-[10px] font-mono text-[#8B2626] bg-white px-1 py-0.5 rounded border border-[#241E1C]/10 block truncate">
                  {selectedGarmentId}
                </code>
              </div>

              <div className="p-2.5 bg-[#FAF7F2] rounded-xs border border-[#241E1C]/5 space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-stone-500 block">Lớp lót</span>
                <div className="font-medium text-[#241E1C] truncate" title={currentInnerMeta?.name}>
                  {currentInnerMeta?.name}
                </div>
                <code className="text-[10px] font-mono text-stone-700 bg-white px-1 py-0.5 rounded border border-[#241E1C]/10 block truncate">
                  {innerLayer}
                </code>
              </div>

              <div className="p-2.5 bg-[#FAF7F2] rounded-xs border border-[#241E1C]/5 space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-stone-500 block">Hạ y</span>
                <div className="font-medium text-[#241E1C] truncate" title={currentBottomMeta?.name}>
                  {currentBottomMeta?.name}
                </div>
                <code className="text-[10px] font-mono text-stone-700 bg-white px-1 py-0.5 rounded border border-[#241E1C]/10 block truncate">
                  {bottomLayer}
                </code>
              </div>

              <div className="p-2.5 bg-[#FAF7F2] rounded-xs border border-[#241E1C]/5 space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-stone-500 block">Khăn</span>
                <div className="font-medium text-[#241E1C] truncate" title={currentHeadMeta?.name}>
                  {currentHeadMeta?.name}
                </div>
                <code className="text-[10px] font-mono text-stone-700 bg-white px-1 py-0.5 rounded border border-[#241E1C]/10 block truncate">
                  {accessoryHead}
                </code>
              </div>

              <div className="p-2.5 bg-[#FAF7F2] rounded-xs border border-[#241E1C]/5 space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-stone-500 block">Cầm tay</span>
                <div className="font-medium text-[#241E1C] truncate" title={currentHandMeta?.name}>
                  {currentHandMeta?.name}
                </div>
                <code className="text-[10px] font-mono text-stone-700 bg-white px-1 py-0.5 rounded border border-[#241E1C]/10 block truncate">
                  {accessoryHand}
                </code>
              </div>

              <div className="p-2.5 bg-[#FAF7F2] rounded-xs border border-[#241E1C]/5 space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-stone-500 block">Màu</span>
                <div className="font-medium text-[#241E1C] flex items-center gap-1.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full border border-black/15 shrink-0 inline-block"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <span className="truncate">{currentColorMeta?.name || selectedColor}</span>
                </div>
                <code className="text-[10px] font-mono text-stone-700 bg-white px-1 py-0.5 rounded border border-[#241E1C]/10 block truncate">
                  {selectedColor}
                </code>
              </div>

              <div className="p-2.5 bg-[#FAF7F2] rounded-xs border border-[#241E1C]/5 space-y-0.5">
                <span className="text-[10px] uppercase font-semibold text-stone-500 block">Dịp</span>
                <div className="font-medium text-[#241E1C] truncate">
                  {occasionGoal}
                </div>
                <code className="text-[10px] font-mono text-stone-700 bg-white px-1 py-0.5 rounded border border-[#241E1C]/10 block truncate">
                  {occasionGoal}
                </code>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
