import React, { useState } from 'react';
import { GARMENTS_DATA } from '../data/mockData';
import { GarmentItem } from '../types';
import { Search, X, Info, Sparkles, Palette, ArrowRight, Check } from 'lucide-react';

interface CostumeExplorerProps {
  initialGarmentId?: string | null;
  onNavigateToStudio: (garmentId?: string) => void;
}

export const CostumeExplorer: React.FC<CostumeExplorerProps> = ({
  initialGarmentId,
  onNavigateToStudio,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('all');
  const [activeGarment, setActiveGarment] = useState<GarmentItem | null>(() => {
    if (initialGarmentId) {
      return GARMENTS_DATA.find((g) => g.id === initialGarmentId) || null;
    }
    return null;
  });

  const occasionsList = [
    { id: 'all', label: 'Tất cả các dịp' },
    { id: 'ky_yeu', label: 'Chụp kỷ yếu' },
    { id: 'le_tet', label: 'Lễ Tết truyền thống' },
    { id: 'di_hoc', label: 'Thuyết trình / Đi học' },
    { id: 'dao_pho', label: 'Dạo phố cuối tuần' },
    { id: 'cuoi_hoi', label: 'Cưới hỏi / Trọng đại' },
  ];

  const filteredGarments = GARMENTS_DATA.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.silhouette.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchSearch) return false;

    if (selectedOccasion === 'all') return true;
    if (selectedOccasion === 'ky_yeu') return item.idealOccasions.some((o) => o.includes('kỷ yếu'));
    if (selectedOccasion === 'le_tet') return item.idealOccasions.some((o) => o.includes('Tết') || o.includes('Lễ'));
    if (selectedOccasion === 'di_hoc') return item.idealOccasions.some((o) => o.includes('học') || o.includes('trường'));
    if (selectedOccasion === 'dao_pho') return item.idealOccasions.some((o) => o.includes('Dạo phố') || o.includes('ngoại cảnh'));
    if (selectedOccasion === 'cuoi_hoi') return item.idealOccasions.some((o) => o.includes('cưới') || o.includes('nghệ thuật'));

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header section */}
      <div className="border-b border-[#241E1C]/10 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#8B2626] font-semibold mb-1">
              Thư Viện Cổ Phục
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#241E1C] font-semibold">
              Khám Phá Cấu Trúc Việt Phục
            </h1>
            <p className="text-sm text-[#241E1C]/75 mt-2 max-w-2xl">
              Tra cứu đặc điểm phom dáng, quy cách cổ áo, tà áo và các bộ phận cấu thành chuẩn mực của y phục truyền thống Việt Nam.
            </p>
          </div>

          <div className="text-xs text-[#241E1C]/60 italic bg-[#FAF7F2] border border-[#241E1C]/10 px-3 py-2 rounded-sm">
            Mục tiêu: Đem kiến thức cổ phục chính xác đến học sinh & sinh viên.
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#241E1C]/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên y phục, chi tiết..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-[#241E1C]/15 rounded-sm focus:outline-none focus:border-[#8B2626] text-[#241E1C] placeholder:text-[#241E1C]/40"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#241E1C]/40 hover:text-[#241E1C]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Occasion Filter Buttons (Functional filter bar) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {occasionsList.map((occ) => (
              <button
                key={occ.id}
                onClick={() => setSelectedOccasion(occ.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-sm whitespace-nowrap transition-colors cursor-pointer ${
                  selectedOccasion === occ.id
                    ? 'bg-[#8B2626] text-[#FAF7F2]'
                    : 'bg-white/80 hover:bg-white text-[#241E1C]/70 border border-[#241E1C]/10'
                }`}
              >
                {occ.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Garments */}
      {filteredGarments.length === 0 ? (
        <div className="text-center py-16 bg-white/50 rounded-sm border border-[#241E1C]/10 space-y-3">
          <p className="text-[#241E1C]/70 font-serif text-lg">Không tìm thấy trang phục phù hợp với bộ lọc.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedOccasion('all');
            }}
            className="text-xs font-semibold text-[#8B2626] underline cursor-pointer"
          >
            Đặt lại tất cả bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGarments.map((garment) => (
            <div
              key={garment.id}
              className="bg-white rounded-sm border border-[#241E1C]/10 hover:border-[#8B2626]/40 transition-all flex flex-col justify-between overflow-hidden shadow-xs"
            >
              <div>
                {/* Media frame */}
                <div className="relative aspect-[4/3] bg-[#F5EFEB] overflow-hidden">
                  {garment.image ? (
                    <img
                      src={garment.image}
                      alt={garment.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-[#241E1C]/50 space-y-1">
                      <span className="font-serif text-sm font-medium">{garment.name}</span>
                      <span className="text-[11px] italic">Bản phục dựng hiện vật</span>
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5 bg-[#FAF7F2]/90 backdrop-blur-xs px-2 py-0.5 text-[10px] font-medium text-[#241E1C] border border-[#241E1C]/10">
                    {garment.originEra.split('(')[0].trim()}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-3">
                  <div className="text-xs text-[#8B2626] font-medium">
                    {garment.subName}
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-[#241E1C]">
                    {garment.name}
                  </h3>
                  <p className="text-xs text-[#241E1C]/75 leading-relaxed">
                    {garment.silhouette}
                  </p>

                  {/* Structure parts preview */}
                  <div className="space-y-1.5 pt-2 border-t border-[#241E1C]/5">
                    <span className="text-[11px] font-semibold text-[#241E1C]/70 block">
                      Đặc điểm cấu tạo:
                    </span>
                    <ul className="text-xs text-[#241E1C]/80 space-y-1">
                      {garment.structure.slice(0, 2).map((part, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-1.5">
                          <span className="text-[#8B2626] text-xs font-bold leading-none mt-1">▪</span>
                          <span><strong className="font-medium text-[#241E1C]">{part.name}:</strong> {part.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Youth Styling Tip */}
                  <div className="bg-[#FAF7F2] p-3 rounded-sm border border-[#241E1C]/5 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-[#8B2626] tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Gợi ý người trẻ</span>
                    </div>
                    <p className="text-[11px] text-[#241E1C]/75 italic leading-relaxed">
                      {garment.youthStylingTip}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="p-4 bg-[#FAF7F2] border-t border-[#241E1C]/10 flex items-center justify-between gap-3">
                <button
                  onClick={() => setActiveGarment(garment)}
                  className="text-xs font-semibold text-[#241E1C] hover:text-[#8B2626] flex items-center gap-1 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Tra cứu chi tiết</span>
                </button>

                <button
                  onClick={() => onNavigateToStudio(garment.id)}
                  className="px-3 py-1.5 bg-[#8B2626] hover:bg-[#741E1E] text-[#FAF7F2] text-xs font-medium rounded-sm flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Đưa vào Studio</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Roadmap notification banner */}
      <div className="bg-white p-6 rounded-sm border border-[#241E1C]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-widest text-[#8B2626] font-semibold">
            Lộ trình dữ liệu tiếp theo
          </div>
          <h4 className="font-serif text-base font-semibold text-[#241E1C]">
            Đang khảo cứu mở rộng kho y phục Lý - Trần - Lê sơ & Trang phục dân tộc
          </h4>
          <p className="text-xs text-[#241E1C]/70">
            Dữ liệu được cố vấn bởi các câu lạc bộ cổ phong và nhà nghiên cứu văn hóa truyền thống.
          </p>
        </div>
        <div className="px-3 py-1.5 bg-[#FAF7F2] text-xs font-medium text-[#8B2626] border border-[#8B2626]/20 rounded-sm whitespace-nowrap">
          Giai đoạn 1: 5 dạng thức chuẩn
        </div>
      </div>

      {/* Garment Details Modal (for deep exploration of structure) */}
      {activeGarment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#241E1C]/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FAF7F2] border border-[#241E1C]/15 rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl flex flex-col justify-between">
            <div className="p-6 space-y-6">
              {/* Modal Top */}
              <div className="flex items-start justify-between border-b border-[#241E1C]/10 pb-4">
                <div>
                  <div className="text-xs font-medium text-[#8B2626]">
                    {activeGarment.subName}
                  </div>
                  <h2 className="font-serif text-2xl font-semibold text-[#241E1C] mt-0.5">
                    {activeGarment.name}
                  </h2>
                  <div className="text-xs text-[#241E1C]/60 mt-1">
                    Niên đại: {activeGarment.originEra}
                  </div>
                </div>
                <button
                  onClick={() => setActiveGarment(null)}
                  className="p-1.5 text-[#241E1C]/50 hover:text-[#241E1C] hover:bg-[#241E1C]/5 rounded-sm cursor-pointer"
                  aria-label="Đóng bảng chi tiết"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Phom dáng chung */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#241E1C]">
                  Đặc tính phom dáng
                </h4>
                <p className="text-sm text-[#241E1C]/80 leading-relaxed">
                  {activeGarment.silhouette}
                </p>
              </div>

              {/* Chi tiết từng cấu phần chuẩn mực */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8B2626]">
                  Các cấu phần y phục chuẩn mực
                </h4>
                <div className="space-y-3">
                  {activeGarment.structure.map((part, index) => (
                    <div key={index} className="bg-white p-3.5 rounded-sm border border-[#241E1C]/10 space-y-1">
                      <div className="font-serif font-semibold text-[#241E1C] text-sm">
                        {part.name}
                      </div>
                      <p className="text-xs text-[#241E1C]/80 leading-relaxed">
                        {part.description}
                      </p>
                      {part.significance && (
                        <div className="text-[11px] text-[#8B2626] font-medium pt-1">
                          Ý nghĩa văn hóa: {part.significance}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Bảng màu mẫu truyền thống */}
              {activeGarment.colorPalette && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#241E1C]">
                    Hệ màu sắc truyền thống tiêu biểu
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {activeGarment.colorPalette.map((col, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-sm border border-[#241E1C]/10 text-xs"
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-xs border border-black/10 inline-block"
                          style={{ backgroundColor: col.hex }}
                        />
                        <span className="text-[#241E1C]/80 font-medium">{col.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom action */}
            <div className="p-4 bg-[#F5EFEB] border-t border-[#241E1C]/10 flex items-center justify-between">
              <button
                onClick={() => setActiveGarment(null)}
                className="px-4 py-2 text-xs font-medium text-[#241E1C]/70 hover:text-[#241E1C] cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  const targetId = activeGarment.id;
                  setActiveGarment(null);
                  onNavigateToStudio(targetId);
                }}
                className="px-4 py-2 bg-[#8B2626] hover:bg-[#741E1E] text-[#FAF7F2] text-xs font-semibold rounded-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Palette className="w-4 h-4" />
                <span>Mở trong Studio phối đồ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
