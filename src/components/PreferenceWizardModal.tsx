import React, { useState } from 'react';
import { PreferenceProfile, PreferredGarmentChoice, StyleOrientation, normalizeGarmentChoice } from '../types';
import { STUDIO_COLOR_PRESETS, ACCESSORY_OPTIONS, CULTURAL_BOUNDARY_PRESETS, SHARED_GARMENT_CATEGORIES } from '../data/mockData';
import { X, ArrowLeft, ArrowRight, Check, AlertCircle, Sparkles, RefreshCw, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface PreferenceWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProfile: PreferenceProfile | null;
  onSaveProfile: (profile: PreferenceProfile) => void;
}

export const PreferenceWizardModal: React.FC<PreferenceWizardModalProps> = ({
  isOpen,
  onClose,
  initialProfile,
  onSaveProfile,
}) => {
  // Steps: 1 to 5, step 6 is Review & Confirm
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);

  // Form State (with safe normalization of historical profile data)
  const [occasionChoice, setOccasionChoice] = useState<string>(() => {
    if (!initialProfile) return 'le_tet';
    if (['le_tet', 'ky_yeu', 'di_hoc', 'dao_pho', 'cuoi_hoi'].includes(initialProfile.occasion)) {
      return initialProfile.occasion;
    }
    return 'custom';
  });
  const [customOccasionText, setCustomOccasionText] = useState<string>(
    initialProfile?.customOccasion || (initialProfile?.occasion && !['le_tet', 'ky_yeu', 'di_hoc', 'dao_pho', 'cuoi_hoi'].includes(initialProfile.occasion) ? initialProfile.occasion : '')
  );

  // Safely resolve garment choice using normalizer
  const normalizedInitial = normalizeGarmentChoice(initialProfile?.garmentChoice);
  const [garmentChoice, setGarmentChoice] = useState<PreferredGarmentChoice>(
    normalizedInitial.garmentChoice
  );
  const [subGarmentVariantId, setSubGarmentVariantId] = useState<string | undefined>(
    initialProfile?.subGarmentVariantId || normalizedInitial.subVariantId
  );

  const [styleOrientation, setStyleOrientation] = useState<StyleOrientation>(
    initialProfile?.styleOrientation || 'balanced'
  );
  const [stylePriorityNotes, setStylePriorityNotes] = useState<string>(
    initialProfile?.stylePriorityNotes || ''
  );

  const [likedColors, setLikedColors] = useState<string[]>(
    initialProfile?.likedColors || ['#1B4D3E', '#FAF7F2']
  );
  const [avoidedColors, setAvoidedColors] = useState<string[]>(
    initialProfile?.avoidedColors || ['#5E3A5A']
  );

  const [selectedAccessories, setSelectedAccessories] = useState<string[]>(
    initialProfile?.accessories || ['Khăn đóng xếp nếp', 'Quạt nan lụa thêu']
  );
  const [selectedBoundaries, setSelectedBoundaries] = useState<string[]>(
    initialProfile?.culturalBoundaries || ['Tránh màu sắc dạ quang / quá chói']
  );
  const [customBoundaryNotes, setCustomBoundaryNotes] = useState<string>(
    initialProfile?.customBoundaryNotes || ''
  );

  if (!isOpen) return null;

  // Preset occasions
  const occasionOptions = [
    { id: 'le_tet', label: 'Lễ Tết truyền thống', desc: 'Du xuân, chúc Tết gia đình, lễ hội đầu năm' },
    { id: 'ky_yeu', label: 'Chụp kỷ yếu tốt nghiệp', desc: 'Lưu giữ thanh xuân trường lớp cùng bạn bè' },
    { id: 'di_hoc', label: 'Đi học hoặc thuyết trình', desc: 'Báo cáo văn hóa, hội thảo học đường gọn gàng' },
    { id: 'dao_pho', label: 'Đi chơi hoặc dạo phố', desc: 'Cà phê, dạo phố cổ, chụp ảnh phong cách retro' },
    { id: 'cuoi_hoi', label: 'Dự lễ cưới hoặc sự kiện trang trọng', desc: 'Đám cưới bạn bè, người thân hoặc đại lễ' },
    { id: 'custom', label: 'Dịp khác (Tự điền)', desc: 'Nhập bối cảnh cụ thể mà bạn chuẩn bị tham gia' },
  ];

  // Style orientation options
  const styleOptions = [
    {
      id: 'traditional' as StyleOrientation,
      title: 'Giữ chuẩn truyền thống',
      desc: 'Ưu tiên đúng phom cốt cổ điển, quy cách đoan trang, màu sắc trang nhã, hạn chế phụ kiện lai tạp.'
    },
    {
      id: 'balanced' as StyleOrientation,
      title: 'Cân bằng truyền thống & hiện đại',
      desc: 'Giữ nguyên cấu trúc áo chuẩn mực, kết hợp phụ kiện trẻ trung (giày da cổ điển, túi canvas, băng đô nhẹ).'
    },
    {
      id: 'modern_twist' as StyleOrientation,
      title: 'Biến tấu trẻ trung & phá cách',
      desc: 'Phối màu tươi sáng, có thể đi cùng sneaker tối giản hoặc phụ kiện cá tính cho các buổi dạo phố trẻ.'
    },
  ];

  // Color selection handling with collision prevention
  const toggleLikedColor = (hex: string) => {
    if (avoidedColors.includes(hex)) {
      setAvoidedColors((prev) => prev.filter((c) => c !== hex));
    }
    setLikedColors((prev) =>
      prev.includes(hex) ? prev.filter((c) => c !== hex) : [...prev, hex]
    );
  };

  const toggleAvoidedColor = (hex: string) => {
    if (likedColors.includes(hex)) {
      setLikedColors((prev) => prev.filter((c) => c !== hex));
    }
    setAvoidedColors((prev) =>
      prev.includes(hex) ? prev.filter((c) => c !== hex) : [...prev, hex]
    );
  };

  // Accessories toggle
  const toggleAccessory = (acc: string) => {
    setSelectedAccessories((prev) =>
      prev.includes(acc) ? prev.filter((a) => a !== acc) : [...prev, acc]
    );
  };

  // Boundaries toggle
  const toggleBoundary = (b: string) => {
    setSelectedBoundaries((prev) =>
      prev.includes(b) ? prev.filter((item) => item !== b) : [...prev, b]
    );
  };

  // Next Step validation handler
  const handleNext = () => {
    setErrorMessage(null);

    if (currentStep === 1) {
      if (!occasionChoice) {
        setErrorMessage('Vui lòng chọn dịp bạn dự định mặc trang phục.');
        return;
      }
      if (occasionChoice === 'custom' && !customOccasionText.trim()) {
        setErrorMessage('Vui lòng điền tên dịp bạn muốn mặc vào ô văn bản bên dưới.');
        return;
      }
    }

    if (currentStep === 4) {
      if (likedColors.length === 0) {
        setErrorMessage('Vui lòng chọn ít nhất một màu bạn yêu thích để làm tông chủ đạo.');
        return;
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 6));
  };

  const handleBack = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Submit and save profile to localStorage
  const handleConfirmProfile = () => {
    setStorageError(null);

    const resolvedOccasion =
      occasionChoice === 'custom'
        ? customOccasionText.trim()
        : occasionOptions.find((o) => o.id === occasionChoice)?.label || 'Dịp lễ hội';

    const newProfile: PreferenceProfile = {
      id: initialProfile?.id || `profile_${Date.now()}`,
      updatedAt: new Date().toISOString(),
      occasion: resolvedOccasion,
      customOccasion: occasionChoice === 'custom' ? customOccasionText.trim() : undefined,
      garmentChoice,
      subGarmentVariantId: garmentChoice === 'ao_ngu_than' ? subGarmentVariantId : undefined,
      styleOrientation,
      stylePriorityNotes: stylePriorityNotes.trim(),
      likedColors,
      avoidedColors,
      accessories: selectedAccessories,
      culturalBoundaries: selectedBoundaries,
      customBoundaryNotes: customBoundaryNotes.trim(),
    };

    try {
      localStorage.setItem('mach_viet_preference_profile', JSON.stringify(newProfile));
      onSaveProfile(newProfile);
      onClose();
    } catch (err) {
      console.error('LocalStorage write error:', err);
      setStorageError('Không thể lưu hồ sơ vào bộ nhớ trình duyệt (localStorage có thể bị tắt hoặc đã đầy).');
    }
  };

  // Helper to get formatted name of chosen garment for review
  const getChosenGarmentDisplayName = () => {
    if (garmentChoice === 'undecided') return 'Chưa biết chọn loại nào (Cần tư vấn sau)';
    const found = SHARED_GARMENT_CATEGORIES.find((c) => c.id === garmentChoice);
    if (!found) return 'Chưa xác định';
    if (garmentChoice === 'ao_ngu_than' && subGarmentVariantId) {
      if (subGarmentVariantId === 'ao-tac-ngu-than-tay-thung') return `${found.name} (Lựa chọn dạng thức: Áo tấc tay thụng)`;
      if (subGarmentVariantId === 'ngu-than-tay-chen') return `${found.name} (Lựa chọn dạng thức: Tay chẽn gọn gàng)`;
    }
    return found.name;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#241E1C]/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] border border-[#241E1C]/15 rounded-sm max-w-2xl w-full max-h-[92vh] flex flex-col justify-between shadow-2xl overflow-hidden">
        
        {/* Modal Top: Progress & Advisory Header */}
        <div className="p-4 sm:p-6 bg-white border-b border-[#241E1C]/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-xs bg-[#8B2626] text-[#FAF7F2] flex items-center justify-center font-serif text-xs font-bold">
                {currentStep <= 5 ? currentStep : '✓'}
              </span>
              <div className="text-xs uppercase tracking-widest text-[#8B2626] font-semibold">
                {currentStep <= 5 ? `Bước ${currentStep}/5: Tư vấn sở thích` : 'Tổng hợp & Xác nhận hồ sơ'}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#241E1C]/50 hover:text-[#241E1C] hover:bg-[#241E1C]/5 rounded-sm cursor-pointer transition-colors"
              aria-label="Đóng bảng sở thích"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="w-full bg-[#FAF7F2] h-1.5 rounded-full overflow-hidden border border-[#241E1C]/10">
            <div
              className="bg-[#8B2626] h-full transition-all duration-300"
              style={{ width: `${(Math.min(currentStep, 5) / 5) * 100}%` }}
            />
          </div>

          <p className="text-[11px] text-[#241E1C]/65 italic">
            * Dữ liệu thu thập để định hình phong cách cá nhân cho Studio; chưa kích hoạt tư vấn AI và chưa sinh bộ phối tự động.
          </p>
        </div>

        {/* Modal Body: Content for each step */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-[#8B2626]/10 border border-[#8B2626]/30 text-[#8B2626] rounded-sm text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {storageError && (
            <div className="p-3 bg-red-100 border border-red-300 text-red-800 rounded-sm text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{storageError}</span>
            </div>
          )}

          {/* BƯỚC 1: DỊP MẶC */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#241E1C]">
                  Bạn dự định diện Việt phục vào dịp nào?
                </h3>
                <p className="text-xs text-[#241E1C]/75 mt-1">
                  Mỗi bối cảnh sẽ có quy cách trang phục phù hợp (trang trọng, tôn nghiêm hay năng động, thoải mái).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {occasionOptions.map((occ) => {
                  const isSelected = occasionChoice === occ.id;
                  return (
                    <button
                      key={occ.id}
                      type="button"
                      onClick={() => {
                        setOccasionChoice(occ.id);
                        setErrorMessage(null);
                      }}
                      className={`p-3.5 rounded-sm text-left transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-white border-[#8B2626] shadow-xs ring-1 ring-[#8B2626]'
                          : 'bg-white/70 hover:bg-white border-[#241E1C]/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${isSelected ? 'text-[#8B2626]' : 'text-[#241E1C]'}`}>
                          {occ.label}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#8B2626]" />}
                      </div>
                      <p className="text-[11px] text-[#241E1C]/65 mt-1 leading-snug">
                        {occ.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {occasionChoice === 'custom' && (
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-[#241E1C] block">
                    Điền dịp cụ thể của bạn:
                  </label>
                  <input
                    type="text"
                    value={customOccasionText}
                    onChange={(e) => {
                      setCustomOccasionText(e.target.value);
                      setErrorMessage(null);
                    }}
                    placeholder="Ví dụ: Hội trại giao lưu sinh viên quốc tế, Lễ kỷ niệm trường..."
                    className="w-full p-2.5 text-xs bg-white border border-[#241E1C]/20 rounded-sm focus:outline-none focus:border-[#8B2626]"
                  />
                </div>
              )}
            </div>
          )}

          {/* BƯỚC 2: DÒNG VIỆT PHỤC QUAN TÂM (ĐẢM BẢO ĐỦ 4 NHÓM + TÙY CHỌN CHƯA BIẾT) */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#241E1C]">
                  Dòng y phục bạn đang dành nhiều sự quan tâm nhất?
                </h3>
                <p className="text-xs text-[#241E1C]/75 mt-1">
                  Đồng bộ chuẩn xác với 4 nhóm y phục chính từ Thư viện Khám phá: Áo dài, Áo tứ thân, Áo ngũ thân và Áo Nhật Bình.
                </p>
              </div>

              <div className="space-y-2.5">
                {/* 1 to 4: The 4 canonical categories */}
                {SHARED_GARMENT_CATEGORIES.map((cat) => {
                  const isSelected = garmentChoice === cat.id;
                  return (
                    <div
                      key={cat.id}
                      className={`rounded-sm border transition-all ${
                        isSelected
                          ? 'bg-white border-[#8B2626] shadow-xs ring-1 ring-[#8B2626]'
                          : 'bg-white/70 hover:bg-white border-[#241E1C]/10'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setGarmentChoice(cat.id);
                          // Default sub-variant for ngu than if not chosen
                          if (cat.id === 'ao_ngu_than' && !subGarmentVariantId) {
                            setSubGarmentVariantId('ngu-than-tay-chen');
                          }
                        }}
                        className="w-full p-3.5 text-left flex items-start justify-between gap-3 cursor-pointer"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${isSelected ? 'text-[#8B2626]' : 'text-[#241E1C]'}`}>
                              {cat.name}
                            </span>
                            <span className="text-[10px] text-[#8B2626] bg-[#8B2626]/10 px-1.5 py-0.2 rounded-xs">
                              {cat.tag}
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-[#241E1C]/75">
                            {cat.subTitle}
                          </div>
                          <p className="text-[11px] text-[#241E1C]/65 leading-relaxed">
                            {cat.description}
                          </p>
                        </div>

                        {isSelected && <Check className="w-4 h-4 text-[#8B2626] shrink-0 mt-0.5" />}
                      </button>

                      {/* Tùy chọn dạng thức phụ nếu chọn Áo ngũ thân */}
                      {isSelected && cat.id === 'ao_ngu_than' && cat.subVariants && (
                        <div className="px-3.5 pb-3.5 pt-1 border-t border-[#241E1C]/5 bg-[#FAF7F2]/60 mt-1 space-y-2">
                          <span className="text-[11px] font-semibold text-[#8B2626] block">
                            Dạng thức Áo ngũ thân bạn muốn tập trung (Lựa chọn phụ tùy ý):
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {cat.subVariants.map((sub) => {
                              const isSubActive = subGarmentVariantId === sub.id;
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() => setSubGarmentVariantId(sub.id)}
                                  className={`p-2.5 rounded-sm border text-left cursor-pointer transition-colors ${
                                    isSubActive
                                      ? 'border-[#8B2626] bg-white text-[#8B2626] font-medium shadow-2xs'
                                      : 'border-[#241E1C]/15 bg-white/70 text-[#241E1C]/75 hover:bg-white'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px]">{sub.name}</span>
                                    {isSubActive && <Check className="w-3 h-3 text-[#8B2626]" />}
                                  </div>
                                  <p className="text-[10px] text-[#241E1C]/60 mt-0.5 leading-snug">
                                    {sub.description}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 5: Undecided Option */}
                <button
                  type="button"
                  onClick={() => {
                    setGarmentChoice('undecided');
                    setSubGarmentVariantId(undefined);
                  }}
                  className={`w-full p-3.5 rounded-sm text-left transition-all border flex items-start justify-between gap-3 cursor-pointer ${
                    garmentChoice === 'undecided'
                      ? 'bg-white border-[#8B2626] shadow-xs ring-1 ring-[#8B2626]'
                      : 'bg-white/70 hover:bg-white border-[#241E1C]/10'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${garmentChoice === 'undecided' ? 'text-[#8B2626]' : 'text-[#241E1C]'}`}>
                        Chưa biết chọn loại nào
                      </span>
                      <span className="text-[10px] text-[#9E6E20] bg-[#D4A054]/15 px-1.5 py-0.2 rounded-xs">
                        Cần gợi ý sau
                      </span>
                    </div>
                    <p className="text-[11px] text-[#241E1C]/70 leading-relaxed">
                      Bạn muốn xem gợi ý phối hợp từ bối cảnh và màu sắc trước khi quyết định dòng y phục cụ thể.
                    </p>
                  </div>

                  {garmentChoice === 'undecided' && <Check className="w-4 h-4 text-[#8B2626] shrink-0 mt-0.5" />}
                </button>
              </div>
            </div>
          )}

          {/* BƯỚC 3: MỨC ĐỘ PHONG CÁCH */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#241E1C]">
                  Bạn muốn theo định hướng phong cách nào?
                </h3>
                <p className="text-xs text-[#241E1C]/75 mt-1">
                  Giúp định hình tỉ lệ giữa quy cách truyền thống nghiêm cẩn và sự phóng khoáng đương đại.
                </p>
              </div>

              <div className="space-y-2.5">
                {styleOptions.map((st) => {
                  const isSelected = styleOrientation === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setStyleOrientation(st.id)}
                      className={`w-full p-4 rounded-sm text-left transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-white border-[#8B2626] shadow-xs ring-1 ring-[#8B2626]'
                          : 'bg-white/70 hover:bg-white border-[#241E1C]/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${isSelected ? 'text-[#8B2626]' : 'text-[#241E1C]'}`}>
                          {st.title}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-[#8B2626]" />}
                      </div>
                      <p className="text-[11px] text-[#241E1C]/70 mt-1 leading-relaxed">
                        {st.desc}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Ô ghi ưu tiên cá nhân */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-[#241E1C] block">
                  Ghi chú ưu tiên cá nhân (Không bắt buộc):
                </label>
                <textarea
                  value={stylePriorityNotes}
                  onChange={(e) => setStylePriorityNotes(e.target.value)}
                  placeholder="Ví dụ: Ưu tiên form áo thoáng mát để dễ vận động ngoài trời; thích cảm giác thư sinh nhã nhặn..."
                  rows={2}
                  className="w-full p-2.5 text-xs bg-white border border-[#241E1C]/20 rounded-sm focus:outline-none focus:border-[#8B2626] text-[#241E1C]"
                />
              </div>
            </div>
          )}

          {/* BƯỚC 4: BẢNG MÀU THÍCH & MÀU MUỐN TRÁNH */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#241E1C]">
                  Bảng màu yêu thích & màu bạn muốn tránh
                </h3>
                <p className="text-xs text-[#241E1C]/75 mt-1">
                  Đồng bộ từ bảng màu Studio. Hệ thống tự động đảm bảo một màu không thể cùng lúc vừa thích vừa tránh.
                </p>
              </div>

              {/* Nhóm 1: Màu thích */}
              <div className="bg-white p-4 rounded-sm border border-[#241E1C]/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#1B4D3E]">
                  <span>1. Màu sắc yêu thích (Chọn ít nhất 1 màu):</span>
                  <span className="text-[10px] text-[#241E1C]/50">Đã chọn: {likedColors.length}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STUDIO_COLOR_PRESETS.map((color) => {
                    const isLiked = likedColors.includes(color.hex);
                    const isAvoided = avoidedColors.includes(color.hex);
                    return (
                      <button
                        key={`liked-${color.hex}`}
                        type="button"
                        onClick={() => toggleLikedColor(color.hex)}
                        className={`p-2 rounded-sm border flex items-center gap-2 text-left transition-all cursor-pointer ${
                          isLiked
                            ? 'border-[#1B4D3E] bg-[#1B4D3E]/5 ring-1 ring-[#1B4D3E]'
                            : 'border-[#241E1C]/15 hover:border-[#241E1C]/40 bg-white'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-xs border border-black/10 shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        <div className="truncate">
                          <div className="text-[11px] font-medium text-[#241E1C] truncate">{color.name}</div>
                          {isAvoided && (
                            <div className="text-[9px] text-[#8B2626]">Đang ở nhóm tránh</div>
                          )}
                        </div>
                        {isLiked && <Check className="w-3 h-3 text-[#1B4D3E] ml-auto shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nhóm 2: Màu muốn tránh */}
              <div className="bg-white p-4 rounded-sm border border-[#241E1C]/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#8B2626]">
                  <span>2. Màu sắc muốn tránh (Tùy chọn):</span>
                  <span className="text-[10px] text-[#241E1C]/50">Đã chọn: {avoidedColors.length}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STUDIO_COLOR_PRESETS.map((color) => {
                    const isAvoided = avoidedColors.includes(color.hex);
                    return (
                      <button
                        key={`avoided-${color.hex}`}
                        type="button"
                        onClick={() => toggleAvoidedColor(color.hex)}
                        className={`p-2 rounded-sm border flex items-center gap-2 text-left transition-all cursor-pointer ${
                          isAvoided
                            ? 'border-[#8B2626] bg-[#8B2626]/5 ring-1 ring-[#8B2626]'
                            : 'border-[#241E1C]/15 hover:border-[#241E1C]/40 bg-white'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-xs border border-black/10 shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        <div className="truncate">
                          <div className="text-[11px] font-medium text-[#241E1C] truncate">{color.name}</div>
                        </div>
                        {isAvoided && <Check className="w-3 h-3 text-[#8B2626] ml-auto shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-[11px] text-[#241E1C]/65 italic bg-[#FAF7F2] p-2.5 border border-[#241E1C]/10 rounded-sm">
                * Quy tắc loại trừ tự động: Khi bạn chọn một màu ở nhóm "Màu muốn tránh", hệ thống sẽ tự động gỡ màu đó khỏi nhóm "Yêu thích" và ngược lại.
              </div>
            </div>
          )}

          {/* BƯỚC 5: PHỤ KIỆN & GIỚI HẠN VĂN HÓA / CÁ NHÂN */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#241E1C]">
                  Phụ kiện đi kèm & Lưu ý giới hạn văn hóa
                </h3>
                <p className="text-xs text-[#241E1C]/75 mt-1">
                  Chọn những phụ kiện bạn muốn có và những điểm bạn muốn tránh để bản phối phù hợp nhất.
                </p>
              </div>

              {/* Phụ kiện quan tâm */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#241E1C]">
                  <span>Phụ kiện mong muốn:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedAccessories([])}
                    className="text-[10px] text-[#8B2626] hover:underline cursor-pointer"
                  >
                    Bỏ chọn tất cả / Để tự nhiên
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {ACCESSORY_OPTIONS.map((acc) => {
                    const isSelected = selectedAccessories.includes(acc);
                    return (
                      <button
                        key={acc}
                        type="button"
                        onClick={() => toggleAccessory(acc)}
                        className={`p-2.5 rounded-sm border text-left transition-colors cursor-pointer flex items-center justify-between gap-1 text-[11px] ${
                          isSelected
                            ? 'bg-[#8B2626] text-[#FAF7F2] border-[#8B2626]'
                            : 'bg-white text-[#241E1C]/80 border-[#241E1C]/15 hover:border-[#241E1C]/40'
                        }`}
                      >
                        <span className="truncate">{acc}</span>
                        {isSelected && <Check className="w-3 h-3 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Giới hạn văn hóa / cá nhân */}
              <div className="space-y-2 pt-2 border-t border-[#241E1C]/10">
                <div className="flex items-center justify-between text-xs font-semibold text-[#8B2626]">
                  <span>Giới hạn cá nhân hoặc văn hóa muốn tránh:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedBoundaries([])}
                    className="text-[10px] text-[#241E1C]/50 hover:underline cursor-pointer"
                  >
                    Không có ý kiến
                  </button>
                </div>
                <div className="space-y-1.5">
                  {CULTURAL_BOUNDARY_PRESETS.map((bound) => {
                    const isChecked = selectedBoundaries.includes(bound);
                    return (
                      <button
                        key={bound}
                        type="button"
                        onClick={() => toggleBoundary(bound)}
                        className={`w-full p-2.5 rounded-sm border text-left transition-colors cursor-pointer flex items-center justify-between gap-2 text-xs ${
                          isChecked
                            ? 'bg-[#8B2626]/10 border-[#8B2626] text-[#8B2626] font-medium'
                            : 'bg-white border-[#241E1C]/15 text-[#241E1C]/75 hover:bg-[#FAF7F2]'
                        }`}
                      >
                        <span>{bound}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 shrink-0 text-[#8B2626]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ghi chú giới hạn riêng */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#241E1C] block">
                  Lưu ý riêng khác (nếu có):
                </label>
                <input
                  type="text"
                  value={customBoundaryNotes}
                  onChange={(e) => setCustomBoundaryNotes(e.target.value)}
                  placeholder="Ví dụ: Không muốn dùng trâm kim loại; cần giày đi bộ nhiều..."
                  className="w-full p-2 text-xs bg-white border border-[#241E1C]/20 rounded-sm focus:outline-none focus:border-[#8B2626]"
                />
              </div>
            </div>
          )}

          {/* BƯỚC 6: TỔNG HỢP & XÁC NHẬN HỒ SƠ */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="border-b border-[#241E1C]/10 pb-3">
                <div className="text-xs uppercase tracking-widest text-[#8B2626] font-semibold">
                  Kiểm tra thông tin trước khi lưu
                </div>
                <h3 className="font-serif text-2xl font-semibold text-[#241E1C] mt-1">
                  Hồ Sơ Sở Thích Cá Nhân Của Bạn
                </h3>
                <p className="text-xs text-[#241E1C]/70 mt-1">
                  Sau khi bấm xác nhận, hồ sơ sẽ được lưu vào trình duyệt hiện tại và hiển thị trong Studio để làm căn cứ phối đồ.
                </p>
              </div>

              {/* Summary Cards Grid */}
              <div className="bg-white p-4 sm:p-5 rounded-sm border border-[#241E1C]/15 space-y-3.5 text-xs">
                {/* 1. Dịp */}
                <div className="flex items-start justify-between border-b border-[#241E1C]/5 pb-2">
                  <span className="font-medium text-[#241E1C]/60">Dịp mặc dự kiến:</span>
                  <span className="font-semibold text-[#8B2626] text-right">
                    {occasionChoice === 'custom'
                      ? customOccasionText || 'Dịp tùy chỉnh'
                      : occasionOptions.find((o) => o.id === occasionChoice)?.label}
                  </span>
                </div>

                {/* 2. Dòng áo (Đúng chuẩn 4 nhóm) */}
                <div className="flex items-start justify-between border-b border-[#241E1C]/5 pb-2">
                  <span className="font-medium text-[#241E1C]/60">Dòng y phục quan tâm:</span>
                  <span className="font-semibold text-[#241E1C] text-right">
                    {getChosenGarmentDisplayName()}
                  </span>
                </div>

                {/* 3. Phong cách */}
                <div className="flex items-start justify-between border-b border-[#241E1C]/5 pb-2">
                  <span className="font-medium text-[#241E1C]/60">Định hướng phong cách:</span>
                  <div className="text-right">
                    <span className="font-semibold text-[#241E1C]">
                      {styleOptions.find((s) => s.id === styleOrientation)?.title}
                    </span>
                    {stylePriorityNotes && (
                      <p className="text-[11px] text-[#241E1C]/60 italic mt-0.5">
                        &ldquo;{stylePriorityNotes}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* 4. Màu sắc */}
                <div className="space-y-1.5 border-b border-[#241E1C]/5 pb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[#241E1C]/60">Màu sắc yêu thích:</span>
                    <div className="flex items-center gap-1.5">
                      {likedColors.map((hex) => (
                        <span
                          key={hex}
                          className="w-4 h-4 rounded-xs border border-black/15 inline-block"
                          style={{ backgroundColor: hex }}
                          title={STUDIO_COLOR_PRESETS.find((c) => c.hex === hex)?.name}
                        />
                      ))}
                    </div>
                  </div>

                  {avoidedColors.length > 0 && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#8B2626]">Màu muốn tránh:</span>
                      <div className="flex items-center gap-1.5">
                        {avoidedColors.map((hex) => (
                          <span
                            key={hex}
                            className="w-3.5 h-3.5 rounded-xs border border-black/15 inline-block opacity-75"
                            style={{ backgroundColor: hex }}
                            title={STUDIO_COLOR_PRESETS.find((c) => c.hex === hex)?.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Phụ kiện & Giới hạn */}
                <div className="space-y-1">
                  <span className="font-medium text-[#241E1C]/60 block">Phụ kiện & Lưu ý văn hóa:</span>
                  <div className="text-[11px] text-[#241E1C]/80">
                    <div><strong>Phụ kiện:</strong> {selectedAccessories.length > 0 ? selectedAccessories.join(' · ') : 'Để tự nhiên'}</div>
                    {selectedBoundaries.length > 0 && (
                      <div className="text-[#8B2626] mt-0.5"><strong>Giới hạn tránh:</strong> {selectedBoundaries.join(' · ')}</div>
                    )}
                    {customBoundaryNotes && (
                      <div className="italic mt-0.5">Ghi chú riêng: {customBoundaryNotes}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom: Navigation Buttons */}
        <div className="p-4 sm:p-5 bg-[#F5EFEB] border-t border-[#241E1C]/10 flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2.5 text-xs font-semibold text-[#241E1C]/80 hover:text-[#241E1C] bg-white border border-[#241E1C]/15 rounded-sm flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-medium text-[#241E1C]/60 hover:text-[#241E1C] cursor-pointer"
            >
              Đóng
            </button>
          )}

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 text-xs font-semibold text-[#FAF7F2] bg-[#8B2626] hover:bg-[#741E1E] rounded-sm flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
            >
              <span>Tiếp tục</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmProfile}
              className="px-6 py-2.5 text-xs font-semibold text-[#FAF7F2] bg-[#8B2626] hover:bg-[#741E1E] rounded-sm flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Xác nhận & Lưu hồ sơ</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
