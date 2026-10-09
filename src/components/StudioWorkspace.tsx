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
  normalizeGarmentChoice,
} from '../types';
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
} from 'lucide-react';

interface StudioWorkspaceProps {
  initialGarmentId?: string | null;
  onSavedToLookbook?: (outfitName: string) => void;
  preferenceProfile: PreferenceProfile | null;
  onOpenPreferenceWizard: () => void;
  onClearPreferenceProfile: () => void;
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  initialGarmentId,
  onSavedToLookbook,
  preferenceProfile,
  onOpenPreferenceWizard,
  onClearPreferenceProfile,
}) => {
  // Current outfit configuration
  const [selectedGarmentId, setSelectedGarmentId] = useState<string>(() => {
    if (initialGarmentId) return initialGarmentId;
    return 'ngu-than-tay-chen';
  });

  const [innerLayer, setInnerLayer] = useState<InnerLayerId>('ao-lot-trang');
  const [bottomLayer, setBottomLayer] = useState<BottomLayerId>('quan-lua-trang');
  const [selectedColor, setSelectedColor] = useState<string>('#1B4D3E'); // Xanh lục bảo
  const [accessoryHead, setAccessoryHead] = useState<AccessoryHeadId>('khan-dong');
  const [accessoryHand, setAccessoryHand] = useState<AccessoryHandId>('quat-nan');
  const [occasionGoal, setOccasionGoal] = useState<string>('ky_yeu');

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

  // Applied Report Toast from Preference Profile
  const [appliedReport, setAppliedReport] = useState<{
    success: string[];
    notices: string[];
    timestamp: string;
  } | null>(null);

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
    if (nextGarmentId === selectedGarmentId) return;

    // Snapshot for Undo
    const snapshot = getCurrentSnapshot();
    setPreviousOutfitState(snapshot);

    const transition = resolveGarmentLayerTransition(
      selectedGarmentId,
      nextGarmentId,
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
        toGarmentName: GARMENT_COMPATIBILITY_RULES[nextGarmentId]?.garmentName || nextGarmentId,
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

    setSelectedGarmentId('ngu-than-tay-chen');
    setInnerLayer('ao-lot-trang');
    setBottomLayer('quan-lua-trang');
    setSelectedColor('#1B4D3E');
    setAccessoryHead('khan-dong');
    setAccessoryHand('quat-nan');
    setOccasionGoal('ky_yeu');
    setIsManualEdited(false);
    setAppliedReport(null);
    setAutoTransitionAlert(null);
    setConfirmResetOpen(false);

    setUndoToast('Đã đặt lại bàn phối về mặc định (Hồ sơ sở thích đã lưu vẫn được giữ nguyên).');
    setTimeout(() => setUndoToast(null), 4000);
  };

  const handleSaveDraft = () => {
    const colorName = STUDIO_COLOR_PRESETS.find((c) => c.hex.toLowerCase() === selectedColor.toLowerCase())?.name || 'Màu phối';
    const outfitSummary = `${currentGarment.name} (${colorName}) - ${preferenceProfile ? preferenceProfile.occasion : 'Phối tự do'}`;
    if (onSavedToLookbook) {
      onSavedToLookbook(outfitSummary);
    }
    setSavedSuccessMessage(`Đã ghi nhận bản phối nháp: ${outfitSummary}`);
    setTimeout(() => {
      setSavedSuccessMessage(null);
    }, 4000);
  };

  // Resolve metadata for "Các lớp đang phối"
  const currentInnerMeta = INNER_LAYER_OPTIONS.find((i) => i.id === innerLayer);
  const currentBottomMeta = BOTTOM_LAYER_OPTIONS.find((b) => b.id === bottomLayer);
  const currentHeadMeta = ACCESSORY_HEAD_OPTIONS.find((h) => h.id === accessoryHead);
  const currentHandMeta = ACCESSORY_HAND_OPTIONS.find((a) => a.id === accessoryHand);
  const currentColorMeta = STUDIO_COLOR_PRESETS.find((c) => c.hex.toLowerCase() === selectedColor.toLowerCase());

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Studio Header & Navigation */}
      <div className="border-b border-[#241E1C]/10 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#8B2626] font-semibold">
            <span>Không Gian Bàn Phối</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#9E6E20]">Quy Tắc Tương Thích Lớp Y Phục</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#241E1C] font-semibold mt-1">
            Studio Phối Dáng Việt Phục
          </h1>
          <p className="text-xs sm:text-sm text-[#241E1C]/75 mt-1 max-w-2xl">
            Lựa chọn áo chính, kiểm soát tính tương thích của lớp lót, hạ y và phụ kiện. Hệ thống tự động giữ lại các món hợp lệ và giải thích minh bạch khi có điều chỉnh.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenPreferenceWizard}
            className="px-3.5 py-2 text-xs font-semibold text-[#8B2626] bg-[#8B2626]/10 hover:bg-[#8B2626]/20 border border-[#8B2626]/30 rounded-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>{preferenceProfile ? 'Chỉnh sửa hồ sơ (5 bước)' : 'Tạo hồ sơ sở thích (5 bước)'}</span>
          </button>

          <button
            onClick={() => setConfirmResetOpen(true)}
            className="px-3 py-2 text-xs font-medium text-[#241E1C]/70 hover:text-[#8B2626] border border-[#241E1C]/15 rounded-sm bg-white hover:bg-[#FAF7F2] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới bàn phối</span>
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
                Thao tác này sẽ đặt lại các lựa chọn áo chính, lớp lót, hạ y và phụ kiện trên bàn phối về mặc định ban đầu.
                <strong className="block text-[#1B4D3E] mt-1 font-medium">
                  ✓ Hồ sơ sở thích 5 bước đã lưu của bạn sẽ KHÔNG bị ảnh hưởng hay xóa bỏ.
                </strong>
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

      {/* USER PREFERENCE PROFILE SUMMARY STRIP WITH EXPLICIT "ÁP DỤNG" BUTTON */}
      {preferenceProfile ? (
        <div className="p-4 bg-white border border-[#8B2626]/25 rounded-sm shadow-xs space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#241E1C]/5 pb-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1B4D3E]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#8B2626]">
                Hồ sơ sở thích đã lưu
              </span>
              <span className="text-[11px] text-[#241E1C]/50">
                (Lưu trên trình duyệt)
              </span>
              {isManualEdited && (
                <span className="text-[10px] text-[#9E6E20] bg-[#D4A054]/15 px-2 py-0.5 rounded-xs font-medium">
                  Đang chỉnh tay · Hồ sơ gốc vẫn giữ nguyên
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleApplyPreferences}
                className="px-3 py-1.5 bg-[#8B2626] hover:bg-[#741E1E] text-[#FAF7F2] text-xs font-semibold rounded-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4A054]" />
                <span>Áp dụng sở thích vào bộ phối</span>
              </button>

              <button
                type="button"
                onClick={onOpenPreferenceWizard}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#8B2626] hover:underline cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Sửa hồ sơ</span>
              </button>

              <span className="text-[#241E1C]/20">|</span>

              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#241E1C]/60 hover:text-[#8B2626] cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Xóa</span>
              </button>
            </div>
          </div>

          {/* Profile parameters grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[#241E1C]/60 block text-[11px]">Dịp dự kiến:</span>
              <span className="font-semibold text-[#241E1C]">{preferenceProfile.occasion}</span>
            </div>

            <div>
              <span className="text-[#241E1C]/60 block text-[11px]">Dòng y phục:</span>
              <span className="font-semibold text-[#8B2626]">
                {getProfileGarmentLabel()}
              </span>
            </div>

            <div>
              <span className="text-[#241E1C]/60 block text-[11px]">Định hướng phong cách:</span>
              <span className="font-medium text-[#241E1C]">
                {preferenceProfile.styleOrientation === 'traditional' ? 'Giữ chuẩn truyền thống' :
                 preferenceProfile.styleOrientation === 'balanced' ? 'Cân bằng truyền thống-hiện đại' : 'Biến tấu trẻ trung'}
              </span>
            </div>

            <div>
              <span className="text-[#241E1C]/60 block text-[11px]">Bảng màu quan tâm:</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {preferenceProfile.likedColors.map((hex) => (
                  <span
                    key={hex}
                    className="w-3.5 h-3.5 rounded-xs border border-black/15 inline-block"
                    style={{ backgroundColor: hex }}
                    title={STUDIO_COLOR_PRESETS.find((c) => c.hex.toLowerCase() === hex.toLowerCase())?.name}
                  />
                ))}
                {preferenceProfile.avoidedColors.length > 0 && (
                  <span className="text-[10px] text-[#8B2626] ml-1">
                    (Tránh {preferenceProfile.avoidedColors.length} màu)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Phụ kiện & Giới hạn từ hồ sơ */}
          <div className="pt-2 border-t border-[#241E1C]/5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#241E1C]/75">
            <div>
              <strong className="text-[#241E1C]">Phụ kiện lưu ý:</strong>{' '}
              {preferenceProfile.accessories.length > 0 ? preferenceProfile.accessories.join(', ') : 'Tự nhiên'}
            </div>
            {preferenceProfile.culturalBoundaries.length > 0 && (
              <div className="text-[#8B2626]">
                <strong>Giới hạn tránh:</strong> {preferenceProfile.culturalBoundaries.join(', ')}
              </div>
            )}
          </div>

          {/* Inline confirmation to clear profile */}
          {confirmDeleteOpen && (
            <div className="mt-2 p-3 bg-[#FAF7F2] border border-[#8B2626]/30 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-[#8B2626] font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Bạn có chắc muốn xóa hồ sơ sở thích này để thiết lập lại từ đầu không?</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOpen(false)}
                  className="px-2.5 py-1 bg-white border border-[#241E1C]/20 rounded-xs text-[#241E1C] cursor-pointer hover:bg-gray-50"
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
                  className="px-2.5 py-1 bg-[#8B2626] text-white rounded-xs font-semibold cursor-pointer hover:bg-[#741E1E]"
                >
                  Xác nhận xóa
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-white border border-dashed border-[#8B2626]/30 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5 text-xs">
            <div className="font-semibold text-[#8B2626] flex items-center gap-1.5">
              <UserCheck className="w-4 h-4" />
              <span>Chưa thiết lập hồ sơ sở thích cá nhân</span>
            </div>
            <p className="text-[#241E1C]/75">
              Dành 1 phút trả lời 5 câu hỏi ngắn để tự động đề xuất dòng áo (Áo dài, Tứ thân, Ngũ thân, Nhật Bình) và màu sắc tương thích.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenPreferenceWizard}
            className="px-4 py-2 bg-[#8B2626] hover:bg-[#741E1E] text-[#FAF7F2] text-xs font-semibold rounded-sm whitespace-nowrap cursor-pointer transition-colors shrink-0 shadow-xs"
          >
            Tạo hồ sơ sở thích (5 bước)
          </button>
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

          <div className="space-y-1.5 pl-6 border-l-2 border-amber-300/80 text-[11px] text-amber-900/90">
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
        
        {/* Left Column: Tủ đồ & Phân lớp y phục (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-sm border border-[#241E1C]/10 space-y-6">
          <div className="border-b border-[#241E1C]/10 pb-3 flex items-center justify-between">
            <h2 className="font-serif text-base font-semibold text-[#241E1C] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#8B2626]" />
              <span>1. Tủ Phối Phân Lớp</span>
            </h2>
            <span className="text-[11px] text-[#241E1C]/50">4 Tầng lớp quy chuẩn</span>
          </div>

          {/* Layer A: Thân áo chính */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#241E1C] block">
                Thân áo chính:
              </label>
              <span className="text-[10px] text-[#241E1C]/50">5 Mẫu y phục</span>
            </div>

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
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#241E1C] block">
                Lớp lót bên trong:
              </label>
              <span className="text-[10px] text-[#241E1C]/50">Áo lót / Yếm</span>
            </div>

            <div className="space-y-2 text-xs">
              {INNER_LAYER_OPTIONS.map((item) => {
                const isSelected = innerLayer === item.id;
                const compat = checkLayerCompatibility(selectedGarmentId, 'innerLayer', item.id);

                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      type="button"
                      disabled={!compat.isCompatible}
                      onClick={() => {
                        if (compat.isCompatible) {
                          setInnerLayer(item.id);
                          setIsManualEdited(true);
                        }
                      }}
                      className={`w-full p-2 rounded-sm text-left transition-colors flex items-center justify-between border ${
                        !compat.isCompatible
                          ? 'opacity-40 cursor-not-allowed bg-stone-100 border-dashed border-stone-300 text-stone-500'
                          : isSelected
                          ? 'border-2 border-[#8B2626] bg-[#8B2626]/5 text-[#8B2626] font-medium'
                          : 'border border-[#241E1C]/15 bg-white text-[#241E1C]/80 hover:bg-stone-50 cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {compat.isRecommended && compat.isCompatible && (
                            <span className="text-[9px] bg-[#1B4D3E]/10 text-[#1B4D3E] px-1 py-0.2 rounded-xs font-semibold">
                              Khuyên dùng
                            </span>
                          )}
                          {!compat.isCompatible && (
                            <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.2 rounded-xs font-semibold">
                              Không tương thích
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-500">{item.subName}</div>
                      </div>

                      {isSelected && compat.isCompatible && (
                        <Check className="w-3.5 h-3.5 text-[#8B2626] shrink-0" />
                      )}
                    </button>

                    {!compat.isCompatible && (
                      <div className="text-[10px] text-stone-500 pl-2 italic">
                        ↳ {compat.reason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Layer C: Quần / Xiêm */}
          <div className="space-y-2 pt-2 border-t border-[#241E1C]/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#241E1C] block">
                Hạ y (Quần lụa / Váy):
              </label>
              <span className="text-[10px] text-[#241E1C]/50">3 Mẫu hạ y</span>
            </div>

            <div className="space-y-2 text-xs">
              {BOTTOM_LAYER_OPTIONS.map((item) => {
                const isSelected = bottomLayer === item.id;
                const compat = checkLayerCompatibility(selectedGarmentId, 'bottomLayer', item.id);

                return (
                  <div key={item.id} className="space-y-1">
                    <button
                      type="button"
                      disabled={!compat.isCompatible}
                      onClick={() => {
                        if (compat.isCompatible) {
                          setBottomLayer(item.id);
                          setIsManualEdited(true);
                        }
                      }}
                      className={`w-full p-2 rounded-sm text-left transition-colors flex items-center justify-between border ${
                        !compat.isCompatible
                          ? 'opacity-40 cursor-not-allowed bg-stone-100 border-dashed border-stone-300 text-stone-500'
                          : isSelected
                          ? 'border-2 border-[#8B2626] bg-[#8B2626]/5 text-[#8B2626] font-medium'
                          : 'border border-[#241E1C]/15 bg-white text-[#241E1C]/80 hover:bg-stone-50 cursor-pointer'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {compat.isRecommended && compat.isCompatible && (
                            <span className="text-[9px] bg-[#1B4D3E]/10 text-[#1B4D3E] px-1 py-0.2 rounded-xs font-semibold">
                              Khuyên dùng
                            </span>
                          )}
                          {!compat.isCompatible && (
                            <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.2 rounded-xs font-semibold">
                              Không tương thích
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-500">{item.subName}</div>
                      </div>

                      {isSelected && compat.isCompatible && (
                        <Check className="w-3.5 h-3.5 text-[#8B2626] shrink-0" />
                      )}
                    </button>

                    {!compat.isCompatible && (
                      <div className="text-[10px] text-stone-500 pl-2 italic">
                        ↳ {compat.reason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Layer D: Phụ kiện */}
          <div className="space-y-3 pt-2 border-t border-[#241E1C]/10">
            <label className="text-xs font-semibold text-[#241E1C] block">
              Phụ kiện kèm theo:
            </label>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#241E1C]/70 block mb-1">Khăn đội đầu:</span>
                <div className="grid grid-cols-1 gap-1.5">
                  {ACCESSORY_HEAD_OPTIONS.map((item) => {
                    const isSelected = accessoryHead === item.id;
                    const compat = checkLayerCompatibility(selectedGarmentId, 'accessoryHead', item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={!compat.isCompatible}
                        onClick={() => {
                          if (compat.isCompatible) {
                            setAccessoryHead(item.id);
                            setIsManualEdited(true);
                          }
                        }}
                        className={`p-1.5 px-2.5 rounded-sm text-left transition-colors flex items-center justify-between border text-[11px] ${
                          !compat.isCompatible
                            ? 'opacity-40 cursor-not-allowed bg-stone-100 border-dashed border-stone-300 text-stone-500'
                            : isSelected
                            ? 'border-2 border-[#8B2626] bg-[#8B2626]/5 text-[#8B2626] font-medium'
                            : 'border border-[#241E1C]/15 bg-white text-[#241E1C]/80 hover:bg-stone-50 cursor-pointer'
                        }`}
                      >
                        <span>{item.name}</span>
                        {isSelected && compat.isCompatible && <Check className="w-3 h-3 text-[#8B2626]" />}
                        {!compat.isCompatible && (
                          <span className="text-[9px] text-red-600">Không hỗ trợ</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="text-[#241E1C]/70 block mb-1">Đồ cầm tay:</span>
                <div className="grid grid-cols-1 gap-1.5">
                  {ACCESSORY_HAND_OPTIONS.map((item) => {
                    const isSelected = accessoryHand === item.id;
                    const compat = checkLayerCompatibility(selectedGarmentId, 'accessoryHand', item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={!compat.isCompatible}
                        onClick={() => {
                          if (compat.isCompatible) {
                            setAccessoryHand(item.id);
                            setIsManualEdited(true);
                          }
                        }}
                        className={`p-1.5 px-2.5 rounded-sm text-left transition-colors flex items-center justify-between border text-[11px] ${
                          !compat.isCompatible
                            ? 'opacity-40 cursor-not-allowed bg-stone-100 border-dashed border-stone-300 text-stone-500'
                            : isSelected
                            ? 'border-2 border-[#8B2626] bg-[#8B2626]/5 text-[#8B2626] font-medium'
                            : 'border border-[#241E1C]/15 bg-white text-[#241E1C]/80 hover:bg-stone-50 cursor-pointer'
                        }`}
                      >
                        <span>{item.name}</span>
                        {isSelected && compat.isCompatible && <Check className="w-3 h-3 text-[#8B2626]" />}
                        {!compat.isCompatible && (
                          <span className="text-[9px] text-red-600">Không hỗ trợ</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Sân khấu dựng hình Mannequin Preview (5 cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-sm border border-[#241E1C]/10 space-y-4">
          <div className="border-b border-[#241E1C]/10 pb-3 flex items-center justify-between">
            <h2 className="font-serif text-base font-semibold text-[#241E1C] flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#8B2626]" />
              <span>2. Khung Bàn Dựng Studio</span>
            </h2>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#8B2626] bg-[#8B2626]/10 px-2 py-0.5 rounded-xs">
              {currentGarment.category === 'ao_tu_than' ? 'Phom Áo Tứ Thân' :
               currentGarment.category === 'ao_nhat_binh' ? 'Phom Nhật Bình' :
               currentGarment.category === 'ao_dai' ? 'Phom Áo Dài' : 'Phom Ngũ Thân'}
            </span>
          </div>

          {/* Color Palette Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#241E1C]">Sắc độ tà áo:</span>
              <span className="text-[#241E1C]/60 text-[11px]">
                {STUDIO_COLOR_PRESETS.find((c) => c.hex.toLowerCase() === selectedColor.toLowerCase())?.name || selectedColor}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {STUDIO_COLOR_PRESETS.map((c) => {
                const isSelected = selectedColor.toLowerCase() === c.hex.toLowerCase();
                const isLikedInProfile = preferenceProfile?.likedColors.some(
                  (lk) => lk.toLowerCase() === c.hex.toLowerCase()
                );
                const isAvoidedInProfile = preferenceProfile?.avoidedColors.some(
                  (av) => av.toLowerCase() === c.hex.toLowerCase()
                );

                return (
                  <button
                    key={c.hex}
                    onClick={() => {
                      setSelectedColor(c.hex);
                      setIsManualEdited(true);
                    }}
                    title={`${c.name} - ${c.note}${isLikedInProfile ? ' (Thích trong hồ sơ)' : ''}${isAvoidedInProfile ? ' (Tránh trong hồ sơ)' : ''}`}
                    className={`w-7 h-7 rounded-sm border transition-transform cursor-pointer flex items-center justify-center relative ${
                      isSelected ? 'scale-110 ring-2 ring-[#8B2626] border-white' : 'border-black/10'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && (
                      <Check className={`w-3.5 h-3.5 ${c.hex === '#EAE6DF' ? 'text-black' : 'text-white'}`} />
                    )}
                    {isLikedInProfile && !isSelected && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#1B4D3E] border border-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual Mannequin Staging Area */}
          <div className="relative aspect-[3/4] bg-[#F7F4EE] rounded-sm border border-[#241E1C]/10 flex flex-col items-center justify-between p-6 overflow-hidden">
            <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-4 relative z-10">
              
              {/* Head accessory display */}
              <div className="w-24 h-10 border border-[#241E1C]/20 rounded-full flex items-center justify-center bg-white/80 shadow-xs text-[10px] text-[#241E1C]/80 font-medium px-2">
                {accessoryHead === 'khan-dong' ? 'Khăn đóng xếp nếp' : accessoryHead === 'khan-van' ? 'Khăn vấn tóc lụa' : 'Để tóc tự nhiên'}
              </div>

              {/* Garment Silhouette Body */}
              <div 
                className="w-48 sm:w-56 h-56 rounded-t-xl border border-black/15 shadow-sm transition-colors duration-300 flex flex-col items-center justify-between p-3 relative text-white"
                style={{ backgroundColor: selectedColor }}
              >
                {/* Specific Collar indicator */}
                <div className="w-24 h-6 border-b border-white/40 bg-white/20 rounded-b-md flex items-center justify-center text-[9px] uppercase tracking-wider font-semibold">
                  {currentGarment.category === 'ao_tu_than' ? 'Cổ yếm trong' :
                   currentGarment.category === 'ao_nhat_binh' ? 'Nẹp Nhật Bình' :
                   currentGarment.category === 'ao_dai' ? 'Cổ đứng tân thời' : 'Cổ lập lĩnh'}
                </div>

                {/* Chest & construction details */}
                <div className="text-center space-y-1">
                  <div className="text-xs font-serif font-medium">{currentGarment.name}</div>
                  <div className="text-[10px] opacity-85">
                    {currentGarment.category === 'ao_tu_than' ? '4 Vạt buông rủ · Thắt lưng lụa' :
                     currentGarment.category === 'ao_nhat_binh' ? 'Xẻ trước · Dải ngũ hành tay' :
                     currentGarment.category === 'ao_dai' ? 'Hai tà dài buông thả' :
                     currentGarment.id === 'ao-tac-ngu-than-tay-thung' ? 'Tay thụng rộng · Cúc hữu nhậm' : 'Tay chẽn gọn · Cúc hữu nhậm'}
                  </div>
                </div>

                {/* Hand accessory preview */}
                <div className="text-[10px] bg-black/30 px-2.5 py-0.5 rounded-xs">
                  {accessoryHand === 'quat-nan' ? 'Cầm quạt nan thêu' : accessoryHand === 'tui-gam' ? 'Túi gấm đeo' : 'Để tay tự nhiên'}
                </div>
              </div>

              {/* Bottom Pants/Skirt representation */}
              <div className={`w-36 h-20 rounded-b-md border border-black/10 flex items-center justify-center text-[10px] font-medium ${
                bottomLayer === 'quan-lua-trang' ? 'bg-[#FAF7F2] text-[#241E1C]' :
                bottomLayer === 'quan-den' ? 'bg-[#1C1917] text-[#FAF7F2]' : 'bg-[#3D2E28] text-[#FAF7F2]'
              }`}>
                {bottomLayer === 'quan-lua-trang' ? 'Quần lụa trắng' :
                 bottomLayer === 'quan-den' ? 'Quần lụa đen' : 'Váy đụp / xòe'}
              </div>
            </div>

            {/* Status watermark */}
            <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-xs p-2 text-center rounded-xs border border-[#241E1C]/10 text-[10px] text-[#241E1C]/75">
              <span>Bàn dựng trực quan kiểm soát tương thích · Không gian 3D sẽ tích hợp ở Giai đoạn 2</span>
            </div>
          </div>
        </div>

        {/* Right Column: Đánh giá dịp & Đề xuất quy cách (3 cols) */}
        <div className="lg:col-span-3 bg-white p-5 rounded-sm border border-[#241E1C]/10 space-y-6">
          <div className="border-b border-[#241E1C]/10 pb-3">
            <h2 className="font-serif text-base font-semibold text-[#241E1C]">
              3. Định Hình Dịp & Bản Phối
            </h2>
            <p className="text-[11px] text-[#241E1C]/60 mt-0.5">
              Kiểm tra tính phù hợp bối cảnh
            </p>
          </div>

          {/* Occasion selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#241E1C] block">
              Dịp xuất hiện dự kiến:
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

          {/* Current Outfit Spec Card */}
          <div className="bg-[#FAF7F2] p-3.5 rounded-sm border border-[#241E1C]/10 space-y-2 text-xs">
            <div className="font-semibold text-[#8B2626] font-serif">
              Quy chuẩn phối đồ hiện thời:
            </div>
            <div className="space-y-1 text-[#241E1C]/80 text-[11px]">
              <div><strong>Áo chính:</strong> {currentGarment.name}</div>
              <div><strong>Lớp lót:</strong> {currentInnerMeta?.name}</div>
              <div><strong>Hạ y:</strong> {currentBottomMeta?.name}</div>
              <div><strong>Khăn:</strong> {currentHeadMeta?.name}</div>
              <div><strong>Cầm tay:</strong> {currentHandMeta?.name}</div>
            </div>
          </div>

          {/* Academic Verification status box */}
          <div className="border border-[#241E1C]/10 p-3.5 rounded-sm bg-white space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              {currentRule.culturalNotes.academicStatus === 'verified_convention' ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-[#1B4D3E]" />
                  <span className="text-[#1B4D3E]">Quy cách y phục chuẩn mực</span>
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4 text-[#9E6E20]" />
                  <span className="text-[#9E6E20]">Gợi ý thiết kế thử nghiệm</span>
                </>
              )}
            </div>

            <p className="text-[11px] text-[#241E1C]/75 leading-relaxed">
              {currentRule.culturalNotes.summary}
            </p>
            <div className="text-[10px] text-stone-500 pt-1 border-t border-[#241E1C]/5">
              <strong>Ghi chú tư liệu:</strong> {currentRule.culturalNotes.sourceNotice}
            </div>
          </div>

          {/* Save Action */}
          <button
            onClick={handleSaveDraft}
            className="w-full py-2.5 bg-[#8B2626] hover:bg-[#741E1E] text-[#FAF7F2] text-xs font-semibold rounded-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>Lưu bản phối này vào Lookbook</span>
          </button>
        </div>

      </div>

      {/* DEDICATED TECHNICAL & CULTURAL INSPECTION SECTION: "CÁC LỚP ĐANG PHỐI" */}
      <div className="bg-white p-5 rounded-sm border border-[#241E1C]/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#241E1C]/10 pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#8B2626] font-semibold">
              <span>Bảng Kiểm Tra Kỹ Thuật</span>
              <span aria-hidden="true">·</span>
              <span className="text-stone-500">Mã Dữ Liệu & Quy Cách</span>
            </div>
            <h3 className="font-serif text-lg font-semibold text-[#241E1C] mt-0.5">
              Các Lớp Đang Phối
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {currentRule.culturalNotes.academicStatus === 'verified_convention' ? (
              <span className="px-2.5 py-1 rounded text-[11px] font-medium bg-[#1B4D3E]/10 text-[#1B4D3E] border border-[#1B4D3E]/20 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Quy chuẩn có tham chiếu tư liệu</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded text-[11px] font-medium bg-[#9E6E20]/10 text-[#9E6E20] border border-[#9E6E20]/20 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>Gợi ý thử nghiệm - Cần xác minh thêm</span>
              </span>
            )}
          </div>
        </div>

        {/* Technical Specification Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
          <div className="p-3 bg-[#FAF7F2] rounded-xs border border-[#241E1C]/5 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-stone-500 block">Áo chính</span>
            <div className="font-medium text-[#241E1C] truncate" title={currentGarment.name}>
              {currentGarment.name}
            </div>
            <code className="text-[10px] font-mono text-[#8B2626] bg-white px-1 py-0.5 rounded border border-[#241E1C]/10 block truncate">
              {selectedGarmentId}
            </code>
          </div>

          <div className="p-3 bg-[#FAF7F2] rounded-xs border border-[#241E1C]/5 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-stone-500 block">Lớp lót</span>
            <div className="font-medium text-[#241E1C] truncate" title={currentInnerMeta?.name}>
              {currentInnerMeta?.name}
            </div>
            <code className="text-[10px] font-mono text-stone-700 bg-white px-1 py-0.5 rounded border border-[#241E1C]/10 block truncate">
              {innerLayer}
            </code>
          </div>

          <div className="p-3 bg-[#FAF7F2] rounded-xs border border-[#241E1C]/5 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-stone-500 block">Hạ y (quần/váy)</span>
            <div className="font-medium text-[#241E1C] truncate" title={currentBottomMeta?.name}>
              {currentBottomMeta?.name}
            </div>
            <code className="text-[10px] font-mono text-stone-700 bg-white px-1 py-0.5 rounded border border-[#241E1C]/10 block truncate">
              {bottomLayer}
            </code>
          </div>

          <div className="p-3 bg-[#FAF7F2] rounded-xs border border-[#241E1C]/5 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-stone-500 block">Khăn đội đầu</span>
            <div className="font-medium text-[#241E1C] truncate" title={currentHeadMeta?.name}>
              {currentHeadMeta?.name}
            </div>
            <code className="text-[10px] font-mono text-stone-700 bg-white px-1 py-0.5 rounded border border-[#241E1C]/10 block truncate">
              {accessoryHead}
            </code>
          </div>

          <div className="p-3 bg-[#FAF7F2] rounded-xs border border-[#241E1C]/5 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-stone-500 block">Cầm tay</span>
            <div className="font-medium text-[#241E1C] truncate" title={currentHandMeta?.name}>
              {currentHandMeta?.name}
            </div>
            <code className="text-[10px] font-mono text-stone-700 bg-white px-1 py-0.5 rounded border border-[#241E1C]/10 block truncate">
              {accessoryHand}
            </code>
          </div>

          <div className="p-3 bg-[#FAF7F2] rounded-xs border border-[#241E1C]/5 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-stone-500 block">Sắc độ tà áo</span>
            <div className="font-medium text-[#241E1C] flex items-center gap-1.5 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full border border-black/15 shrink-0 inline-block"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="truncate">{currentColorMeta?.name || selectedColor}</span>
            </div>
            <code className="text-[10px] font-mono text-stone-700 bg-white px-1 py-0.5 rounded border border-[#241E1C]/10 block truncate">
              {selectedColor}
            </code>
          </div>

          <div className="p-3 bg-[#FAF7F2] rounded-xs border border-[#241E1C]/5 space-y-1">
            <span className="text-[10px] uppercase font-semibold text-stone-500 block">Dịp mục tiêu</span>
            <div className="font-medium text-[#241E1C] truncate">
              {occasionGoal === 'ky_yeu' ? 'Kỷ yếu' :
               occasionGoal === 'le_tet' ? 'Lễ Tết' :
               occasionGoal === 'thuyet_trinh' ? 'Thuyết trình' :
               occasionGoal === 'dao_pho' ? 'Dạo phố' : 'Cưới hỏi'}
            </div>
            <code className="text-[10px] font-mono text-stone-700 bg-white px-1 py-0.5 rounded border border-[#241E1C]/10 block truncate">
              {occasionGoal}
            </code>
          </div>
        </div>

        {/* Cultural Caution note */}
        <div className="p-3 bg-[#FAF7F2] rounded-xs text-[11px] text-[#241E1C]/75 border-l-2 border-[#8B2626] flex items-start gap-2">
          <Info className="w-3.5 h-3.5 text-[#8B2626] shrink-0 mt-0.5" />
          <div>
            <strong>Ghi chú học thuật & tính xác thực:</strong> {currentRule.culturalNotes.summary} Các quy tắc ở đây là gợi ý thiết kế phục vụ học sinh sinh viên tìm hiểu trang phục, không tùy tiện khẳng định các quy định lịch sử khi chưa có nguồn thư tịch đối chiếu chính thức.
          </div>
        </div>
      </div>
    </div>
  );
};
