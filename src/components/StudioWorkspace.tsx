import React, { useState } from 'react';
import { GARMENTS_DATA } from '../data/mockData';
import { Layers, Palette, Sparkles, Check, AlertCircle, RefreshCw, BookmarkPlus, HelpCircle } from 'lucide-react';

interface StudioWorkspaceProps {
  initialGarmentId?: string | null;
  onSavedToLookbook?: (outfitName: string) => void;
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  initialGarmentId,
  onSavedToLookbook,
}) => {
  // Active layer selections
  const [selectedGarmentId, setSelectedGarmentId] = useState<string>(
    initialGarmentId || 'ngu-than-tay-chen'
  );
  const [innerLayer, setInnerLayer] = useState<'ao-lot-trang' | 'yem-dao' | 'ao-canh'>('ao-lot-trang');
  const [bottomLayer, setBottomLayer] = useState<'quan-lua-trang' | 'quan-den' | 'vay-xep-ly'>('quan-lua-trang');
  const [selectedColor, setSelectedColor] = useState<string>('#1B4D3E'); // Xanh lục bảo
  const [accessoryHead, setAccessoryHead] = useState<'khan-dong' | 'khan-van' | 'none'>('khan-dong');
  const [accessoryHand, setAccessoryHand] = useState<'quat-nan' | 'tui-gam' | 'none'>('quat-nan');
  const [occasionGoal, setOccasionGoal] = useState<string>('ky_yeu');
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  const currentGarment = GARMENTS_DATA.find((g) => g.id === selectedGarmentId) || GARMENTS_DATA[0];

  const colorPresets = [
    { name: 'Xanh lục bảo', hex: '#1B4D3E', note: 'Thanh nhã, điềm tĩnh' },
    { name: 'Đỏ chu sa', hex: '#8B2626', note: 'May mắn, truyền thống' },
    { name: 'Vàng hoàng yến', hex: '#D4A054', note: 'Rực rỡ, quyền quý' },
    { name: 'Xanh chàm cổ', hex: '#2C3E50', note: 'Trầm tĩnh, học thức' },
    { name: 'Trắng bạch ngọc', hex: '#EAE6DF', note: 'Thuần khiết, giản dị' },
    { name: 'Tím hoa cà', hex: '#5E3A5A', note: 'Dịu dàng, hoài niệm' },
  ];

  const handleReset = () => {
    setSelectedGarmentId('ngu-than-tay-chen');
    setInnerLayer('ao-lot-trang');
    setBottomLayer('quan-lua-trang');
    setSelectedColor('#1B4D3E');
    setAccessoryHead('khan-dong');
    setAccessoryHand('quat-nan');
    setOccasionGoal('ky_yeu');
  };

  const handleSaveDraft = () => {
    const outfitSummary = `${currentGarment.name} (${colorPresets.find(c => c.hex === selectedColor)?.name || 'Màu phối'})`;
    if (onSavedToLookbook) {
      onSavedToLookbook(outfitSummary);
    }
    setSavedSuccessMessage(`Đã ghi nhận bản phối nháp: ${outfitSummary}`);
    setTimeout(() => {
      setSavedSuccessMessage(null);
    }, 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Studio Header & Development Status Notice */}
      <div className="border-b border-[#241E1C]/10 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#8B2626] font-semibold">
            <span>Không Gian Thử Nghiệm</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#9E6E20]">Giai Đoạn Khung Kiến Trúc</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl text-[#241E1C] font-semibold mt-1">
            Studio Phối Dáng Việt Phục
          </h1>
          <p className="text-xs sm:text-sm text-[#241E1C]/75 mt-1 max-w-2xl">
            Bố cục bàn phối chuẩn xác theo các lớp y phục cổ truyền (Áo lót, áo chính, quần, phụ kiện), hỗ trợ người trẻ định hình phong cách trước khi may hoặc thuê.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleReset}
            className="px-3 py-2 text-xs font-medium text-[#241E1C]/70 hover:text-[#8B2626] border border-[#241E1C]/15 rounded-sm bg-white hover:bg-[#FAF7F2] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Làm mới bàn phối</span>
          </button>
        </div>
      </div>

      {/* Explicit Phase 2 & 3 Notice Banner */}
      <div className="p-4 bg-[#F5EFEB] border border-[#241E1C]/10 rounded-sm flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#8B2626] shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <div className="font-semibold text-[#241E1C]">
            Thông báo lộ trình phát triển Studio:
          </div>
          <p className="text-[#241E1C]/80 leading-relaxed">
            Hiện tại bạn đang tương tác với <strong>Khung bố cục bàn phối phân tầng (Multi-layer Architecture)</strong>.
            Mô đun <strong>dựng hình 3D tương tác (Three.js)</strong> và <strong>Trợ lý gợi ý phong cách Gemini AI</strong> được lên lịch triển khai ở các giai đoạn kế tiếp, tránh việc tạo dữ liệu 3D giả chưa được chuẩn hóa quy cách.
          </p>
        </div>
      </div>

      {/* Save Notification Toast */}
      {savedSuccessMessage && (
        <div className="p-3 bg-[#1B4D3E] text-[#FAF7F2] text-xs font-medium rounded-sm flex items-center justify-between shadow-md">
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
            <span className="text-[11px] text-[#241E1C]/50">4 Lớp y phục</span>
          </div>

          {/* Layer A: Thân áo chính */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#241E1C] block">
              Thân áo chính:
            </label>
            <div className="space-y-1.5">
              {GARMENTS_DATA.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGarmentId(g.id)}
                  className={`w-full text-left p-2.5 rounded-sm text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    selectedGarmentId === g.id
                      ? 'bg-[#8B2626] text-[#FAF7F2] font-medium'
                      : 'bg-[#FAF7F2] text-[#241E1C]/80 hover:bg-[#241E1C]/5'
                  }`}
                >
                  <span className="truncate">{g.name}</span>
                  {selectedGarmentId === g.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Layer B: Lớp áo lót trong */}
          <div className="space-y-2 pt-2 border-t border-[#241E1C]/10">
            <label className="text-xs font-semibold text-[#241E1C] block">
              Lớp lót bên trong (Bảo đảm kín đáo & tạo viền cổ):
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setInnerLayer('ao-lot-trang')}
                className={`p-2 rounded-sm text-left transition-colors cursor-pointer ${
                  innerLayer === 'ao-lot-trang'
                    ? 'border-2 border-[#8B2626] bg-[#8B2626]/5 text-[#8B2626] font-medium'
                    : 'border border-[#241E1C]/15 text-[#241E1C]/70'
                }`}
              >
                Áo lót trắng cổ đứng
              </button>
              <button
                onClick={() => setInnerLayer('yem-dao')}
                className={`p-2 rounded-sm text-left transition-colors cursor-pointer ${
                  innerLayer === 'yem-dao'
                    ? 'border-2 border-[#8B2626] bg-[#8B2626]/5 text-[#8B2626] font-medium'
                    : 'border border-[#241E1C]/15 text-[#241E1C]/70'
                }`}
              >
                Yếm lụa đào
              </button>
            </div>
          </div>

          {/* Layer C: Quần / Xiêm */}
          <div className="space-y-2 pt-2 border-t border-[#241E1C]/10">
            <label className="text-xs font-semibold text-[#241E1C] block">
              Hạ y (Quần lụa / Váy):
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setBottomLayer('quan-lua-trang')}
                className={`p-2 rounded-sm text-left transition-colors cursor-pointer ${
                  bottomLayer === 'quan-lua-trang'
                    ? 'border-2 border-[#8B2626] bg-[#8B2626]/5 text-[#8B2626] font-medium'
                    : 'border border-[#241E1C]/15 text-[#241E1C]/70'
                }`}
              >
                Quần lụa trắng
              </button>
              <button
                onClick={() => setBottomLayer('quan-den')}
                className={`p-2 rounded-sm text-left transition-colors cursor-pointer ${
                  bottomLayer === 'quan-den'
                    ? 'border-2 border-[#8B2626] bg-[#8B2626]/5 text-[#8B2626] font-medium'
                    : 'border border-[#241E1C]/15 text-[#241E1C]/70'
                }`}
              >
                Quần lụa đen
              </button>
            </div>
          </div>

          {/* Layer D: Phụ kiện */}
          <div className="space-y-3 pt-2 border-t border-[#241E1C]/10">
            <label className="text-xs font-semibold text-[#241E1C] block">
              Phụ kiện kèm theo:
            </label>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#241E1C]/70">Khăn đội đầu:</span>
                <select
                  value={accessoryHead}
                  onChange={(e) => setAccessoryHead(e.target.value as any)}
                  className="bg-[#FAF7F2] border border-[#241E1C]/15 px-2 py-1 rounded-sm text-xs focus:outline-none"
                >
                  <option value="khan-dong">Khăn đóng xếp nếp</option>
                  <option value="khan-van">Khăn vấn tóc lụa</option>
                  <option value="none">Không dùng khăn</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[#241E1C]/70">Cầm tay:</span>
                <select
                  value={accessoryHand}
                  onChange={(e) => setAccessoryHand(e.target.value as any)}
                  className="bg-[#FAF7F2] border border-[#241E1C]/15 px-2 py-1 rounded-sm text-xs focus:outline-none"
                >
                  <option value="quat-nan">Quạt nan lụa thêu</option>
                  <option value="tui-gam">Túi gấm truyền thống</option>
                  <option value="none">Để tay tự nhiên</option>
                </select>
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
              Bản vẽ phân tầng
            </span>
          </div>

          {/* Color Palette Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#241E1C]">Sắc độ tà áo:</span>
              <span className="text-[#241E1C]/60 text-[11px]">
                {colorPresets.find((c) => c.hex === selectedColor)?.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {colorPresets.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setSelectedColor(c.hex)}
                  title={`${c.name} - ${c.note}`}
                  className={`w-7 h-7 rounded-sm border transition-transform cursor-pointer flex items-center justify-center ${
                    selectedColor === c.hex ? 'scale-110 ring-2 ring-[#8B2626] border-white' : 'border-black/10'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {selectedColor === c.hex && (
                    <Check className={`w-3.5 h-3.5 ${c.hex === '#EAE6DF' ? 'text-black' : 'text-white'}`} />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Visual Mannequin Staging Area */}
          <div className="relative aspect-[3/4] bg-[#F7F4EE] rounded-sm border border-[#241E1C]/10 flex flex-col items-center justify-between p-6 overflow-hidden">
            {/* Visual Mannequin Silhouette Rendering Frame */}
            <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-4 relative z-10">
              
              {/* Head accessory display */}
              <div className="w-20 h-10 border border-[#241E1C]/20 rounded-full flex items-center justify-center bg-white/80 shadow-xs text-[10px] text-[#241E1C]/80 font-medium">
                {accessoryHead === 'khan-dong' ? 'Khăn đóng' : accessoryHead === 'khan-van' ? 'Khăn vấn lụa' : 'Để tóc tự nhiên'}
              </div>

              {/* Garment Silhouette representation */}
              <div 
                className="w-48 sm:w-56 h-56 rounded-t-xl border border-black/15 shadow-sm transition-colors duration-300 flex flex-col items-center justify-between p-3 relative text-white"
                style={{ backgroundColor: selectedColor }}
              >
                {/* Collar indicator */}
                <div className="w-16 h-6 border-b border-white/40 bg-white/20 rounded-b-md flex items-center justify-center text-[9px] uppercase tracking-wider font-semibold">
                  Cổ lập lĩnh
                </div>

                {/* Chest / buttons indicator */}
                <div className="text-center space-y-1">
                  <div className="text-xs font-serif font-medium">{currentGarment.name}</div>
                  <div className="text-[10px] opacity-80">Hệ 5 cúc cài bên hữu</div>
                </div>

                {/* Hand accessory preview */}
                <div className="text-[10px] bg-black/25 px-2 py-0.5 rounded-xs">
                  {accessoryHand === 'quat-nan' ? 'Cầm quạt nan' : accessoryHand === 'tui-gam' ? 'Túi gấm đeo' : 'Tự nhiên'}
                </div>
              </div>

              {/* Bottom Pants representation */}
              <div className={`w-36 h-20 rounded-b-md border border-black/10 flex items-center justify-center text-[10px] font-medium ${
                bottomLayer === 'quan-lua-trang' ? 'bg-[#FAF7F2] text-[#241E1C]' : 'bg-[#1C1917] text-[#FAF7F2]'
              }`}>
                {bottomLayer === 'quan-lua-trang' ? 'Quần lụa trắng' : 'Quần lụa đen'}
              </div>
            </div>

            {/* Subtle watermark explaining 3D roadmap */}
            <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-xs p-2 text-center rounded-xs border border-[#241E1C]/10 text-[10px] text-[#241E1C]/75">
              <span>Không gian 3D tương tác đang được phát triển theo lộ trình Giai đoạn 2</span>
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
              onChange={(e) => setOccasionGoal(e.target.value)}
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
              Thông số cấu hình hiện tại:
            </div>
            <div className="space-y-1 text-[#241E1C]/80 text-[11px]">
              <div><strong>Áo chính:</strong> {currentGarment.name}</div>
              <div><strong>Lớp lót:</strong> {innerLayer === 'ao-lot-trang' ? 'Áo lót trắng cổ đứng' : 'Yếm lụa'}</div>
              <div><strong>Hạ y:</strong> {bottomLayer === 'quan-lua-trang' ? 'Quần trắng' : 'Quần đen'}</div>
              <div><strong>Khăn & Phụ kiện:</strong> {accessoryHead !== 'none' ? accessoryHead : 'Tự nhiên'} · {accessoryHand}</div>
            </div>
          </div>

          {/* Gemini AI Advisor Placeholder (Explicitly Architectural) */}
          <div className="border border-dashed border-[#8B2626]/30 p-3.5 rounded-sm bg-[#8B2626]/5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8B2626]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Gợi Ý Trợ Lý Phối Đồ AI</span>
            </div>
            <p className="text-[11px] text-[#241E1C]/75 leading-relaxed">
              Mô đun phân tích màu sắc và ngữ cảnh bằng Gemini AI sẽ được kết nối ở Giai đoạn 3 để chấm điểm hài hòa ngũ hành và đề xuất giày/phụ kiện trẻ trung.
            </p>
            <div className="text-[10px] text-[#8B2626] font-medium uppercase tracking-wider">
              Trạng thái: Sắp tích hợp
            </div>
          </div>

          {/* Save Action */}
          <button
            onClick={handleSaveDraft}
            className="w-full py-2.5 bg-[#8B2626] hover:bg-[#741E1E] text-[#FAF7F2] text-xs font-semibold rounded-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>Lưu bản phối này</span>
          </button>
        </div>

      </div>
    </div>
  );
};
