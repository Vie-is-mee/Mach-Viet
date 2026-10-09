import React, { useState } from 'react';
import { GARMENTS_DATA, SHARED_GARMENT_CATEGORIES } from '../data/mockData';
import { GarmentItem, GarmentCategory } from '../types';
import { Search, X, Info, Sparkles, Palette, ExternalLink, ShieldAlert, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface CostumeExplorerProps {
  initialGarmentId?: string | null;
  onNavigateToStudio: (garmentId?: string) => void;
}

export const CostumeExplorer: React.FC<CostumeExplorerProps> = ({
  initialGarmentId,
  onNavigateToStudio,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('all');
  const [activeGarment, setActiveGarment] = useState<GarmentItem | null>(() => {
    if (initialGarmentId) {
      return GARMENTS_DATA.find((g) => g.id === initialGarmentId) || null;
    }
    return null;
  });

  const categoriesList = [
    { id: 'all', label: 'Tất cả các nhóm' },
    ...SHARED_GARMENT_CATEGORIES.map((cat) => ({ id: cat.id, label: cat.name.split('(')[0].trim() })),
  ];


  const occasionsList = [
    { id: 'all', label: 'Mọi dịp' },
    { id: 'ky_yeu', label: 'Kỷ yếu' },
    { id: 'le_tet', label: 'Lễ Tết' },
    { id: 'di_hoc', label: 'Học đường' },
    { id: 'dao_pho', label: 'Dạo phố' },
    { id: 'cuoi_hoi', label: 'Cưới hỏi / Lễ' },
  ];

  const filteredGarments = GARMENTS_DATA.filter((item) => {
    const matchSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.keyIdentificationFeatures.some((f) => f.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;

    // Filter by primary garment group
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }

    // Filter by occasion
    if (selectedOccasion !== 'all') {
      if (selectedOccasion === 'ky_yeu' && !item.idealOccasions.some((o) => o.toLowerCase().includes('kỷ yếu'))) return false;
      if (selectedOccasion === 'le_tet' && !item.idealOccasions.some((o) => o.toLowerCase().includes('tết') || o.toLowerCase().includes('lễ'))) return false;
      if (selectedOccasion === 'di_hoc' && !item.idealOccasions.some((o) => o.toLowerCase().includes('học') || o.toLowerCase().includes('trường'))) return false;
      if (selectedOccasion === 'dao_pho' && !item.idealOccasions.some((o) => o.toLowerCase().includes('dạo phố') || o.toLowerCase().includes('ngoại cảnh'))) return false;
      if (selectedOccasion === 'cuoi_hoi' && !item.idealOccasions.some((o) => o.toLowerCase().includes('cưới') || o.toLowerCase().includes('nghệ thuật') || o.toLowerCase().includes('lễ'))) return false;
    }

    return true;
  });

  const getStatusBadge = (status: 'verified_source' | 'needs_verification' | 'unverified') => {
    switch (status) {
      case 'verified_source':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1B4D3E] bg-[#1B4D3E]/10 px-2 py-0.5 rounded-xs">
            <CheckCircle2 className="w-3 h-3" />
            <span>Đã có nguồn tham khảo chính thức</span>
          </span>
        );
      case 'needs_verification':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#9E6E20] bg-[#D4A054]/15 px-2 py-0.5 rounded-xs">
            <AlertCircle className="w-3 h-3" />
            <span>Cần đối chiếu thêm nguồn học thuật</span>
          </span>
        );
      case 'unverified':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8B2626] bg-[#8B2626]/10 px-2 py-0.5 rounded-xs">
            <HelpCircle className="w-3 h-3" />
            <span>Chưa xác minh học thuật</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header section */}
      <div className="border-b border-[#241E1C]/10 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#8B2626] font-semibold mb-1">
              Thư Viện Tra Cứu Cổ Phục
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#241E1C] font-semibold">
              Khám Phá Bốn Nhóm Việt Phục
            </h1>
            <p className="text-sm text-[#241E1C]/75 mt-2 max-w-2xl">
              Cung cấp đặc điểm nhận diện, mô tả ngắn gọn, gợi ý dịp mặc và ý tưởng phối đồ hiện đại; kèm nguồn tham khảo thực tế và cảnh báo học thuật minh bạch.
            </p>
          </div>

          <div className="text-xs text-[#241E1C]/70 bg-white border border-[#241E1C]/10 p-3 rounded-sm space-y-1">
            <div className="font-semibold text-[#8B2626] flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Nguyên tắc thông tin của Mạch Việt</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Tách bạch thông tin lịch sử với ảnh minh họa và gợi ý phối đồ trẻ; nêu rõ nguồn kiểm chứng hoặc ghi chú cần xác minh thêm.
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="mt-6 space-y-3">
          {/* Search box & Primary Group Tabs */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#241E1C]/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm áo dài, tứ thân, ngũ thân, Nhật Bình..."
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

            {/* 4 Primary Categories Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              <span className="text-xs font-semibold text-[#241E1C]/60 whitespace-nowrap mr-1">Nhóm:</span>
              {categoriesList.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-sm whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#8B2626] text-[#FAF7F2]'
                      : 'bg-white text-[#241E1C]/70 hover:bg-[#FAF7F2] border border-[#241E1C]/10'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Occasion filter bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 scrollbar-none text-xs text-[#241E1C]/70">
            <span className="font-semibold text-[#241E1C]/60 whitespace-nowrap mr-1">Dịp gợi ý:</span>
            {occasionsList.map((occ) => (
              <button
                key={occ.id}
                onClick={() => setSelectedOccasion(occ.id)}
                className={`px-2.5 py-1 text-xs rounded-sm whitespace-nowrap transition-colors cursor-pointer ${
                  selectedOccasion === occ.id
                    ? 'bg-[#241E1C] text-[#FAF7F2] font-medium'
                    : 'bg-white/60 hover:bg-white text-[#241E1C]/70 border border-[#241E1C]/10'
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
          <p className="text-[#241E1C]/70 font-serif text-lg">Không tìm thấy trang phục phù hợp với bộ lọc hiện tại.</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setSelectedOccasion('all');
            }}
            className="text-xs font-semibold text-[#8B2626] underline cursor-pointer"
          >
            Đặt lại tất cả bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredGarments.map((garment) => (
            <div
              key={garment.id}
              className="bg-white rounded-sm border border-[#241E1C]/10 hover:border-[#8B2626]/40 transition-all flex flex-col justify-between overflow-hidden shadow-xs"
            >
              <div>
                {/* Media frame with explicit disclaimer badge */}
                <div className="relative aspect-[16/9] bg-[#F5EFEB] overflow-hidden">
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
                      <span className="text-[11px] italic">Bản phác họa tư liệu thị giác</span>
                    </div>
                  )}

                  {/* Disclaimer overlay pill on image */}
                  <div className="absolute bottom-2 left-2 right-2 bg-[#241E1C]/80 backdrop-blur-xs text-[10px] text-[#FAF7F2] px-2 py-1 rounded-xs truncate">
                    {garment.imageNote}
                  </div>

                  <div className="absolute top-2.5 left-2.5 bg-[#FAF7F2]/90 backdrop-blur-xs px-2.5 py-1 text-[11px] font-semibold text-[#8B2626] border border-[#241E1C]/10">
                    {garment.name}
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-6 space-y-4">
                  {/* Short summary */}
                  <div>
                    <div className="text-xs text-[#8B2626] font-medium mb-0.5">
                      {garment.subName}
                    </div>
                    <h3 className="font-serif text-2xl font-semibold text-[#241E1C]">
                      {garment.name}
                    </h3>
                    <p className="text-xs text-[#241E1C]/80 leading-relaxed mt-2">
                      {garment.shortDescription}
                    </p>
                  </div>

                  {/* Vài nét nhận diện chính (Bullet points) */}
                  <div className="bg-[#FAF7F2] p-3.5 rounded-sm border border-[#241E1C]/5 space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#241E1C] block">
                      Vài nét nhận diện cốt lõi:
                    </span>
                    <ul className="text-xs text-[#241E1C]/80 space-y-1.5">
                      {garment.keyIdentificationFeatures.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-1.5 leading-snug">
                          <span className="text-[#8B2626] font-bold mt-0.5">▪</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Dịp mặc phù hợp (ở mức gợi ý) */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-[#241E1C]/70 block">
                      Dịp mặc phù hợp <span className="font-normal italic">(chỉ ở mức gợi ý tham khảo)</span>:
                    </span>
                    <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-[#241E1C]/80">
                      {garment.idealOccasions.map((occ, oIdx) => (
                        <span key={oIdx}>
                          {occ}{oIdx < garment.idealOccasions.length - 1 ? ' ·' : ''}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Gợi ý phối hiện đại tách riêng */}
                  <div className="p-3 bg-white border border-[#D4A054]/40 rounded-sm space-y-1">
                    <div className="text-[10px] uppercase font-bold text-[#9E6E20] tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#D4A054]" />
                      <span>Gợi ý phối hiện đại (Tách riêng với lịch sử)</span>
                    </div>
                    <p className="text-xs text-[#241E1C]/85 italic leading-relaxed">
                      {garment.modernStylingTip}
                    </p>
                  </div>

                  {/* Verification status preview */}
                  <div className="pt-2 border-t border-[#241E1C]/10 flex items-center justify-between">
                    <span className="text-[11px] text-[#241E1C]/60">Tình trạng nguồn:</span>
                    <div>
                      {getStatusBadge(garment.references[0]?.status || 'needs_verification')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 bg-[#FAF7F2] border-t border-[#241E1C]/10 flex items-center justify-between gap-3">
                <button
                  onClick={() => setActiveGarment(garment)}
                  className="text-xs font-semibold text-[#8B2626] hover:text-[#741E1E] flex items-center gap-1.5 cursor-pointer py-1"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Xem nguồn & đối chiếu lịch sử</span>
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

      {/* Comprehensive Academic Source & Detail Modal */}
      {activeGarment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#241E1C]/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[#FAF7F2] border border-[#241E1C]/15 rounded-sm max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div className="p-6 sm:p-8 space-y-6">
              {/* Modal Top Header */}
              <div className="flex items-start justify-between border-b border-[#241E1C]/10 pb-4">
                <div>
                  <div className="text-xs font-semibold text-[#8B2626] uppercase tracking-wider">
                    {activeGarment.subName}
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#241E1C] mt-1">
                    {activeGarment.name}
                  </h2>
                  <div className="text-xs text-[#241E1C]/70 mt-1">
                    Niên đại & thời kỳ: <strong>{activeGarment.originEra}</strong>
                  </div>
                </div>
                <button
                  onClick={() => setActiveGarment(null)}
                  className="p-1.5 text-[#241E1C]/50 hover:text-[#241E1C] hover:bg-[#241E1C]/5 rounded-sm cursor-pointer"
                  aria-label="Đóng bảng tra cứu"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Lịch sử & Bối cảnh truyền thống */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#241E1C]">
                  Lịch sử & Bối cảnh truyền thống
                </h3>
                <p className="text-sm text-[#241E1C]/85 leading-relaxed bg-white p-4 rounded-sm border border-[#241E1C]/10">
                  {activeGarment.historicalContext}
                </p>
              </div>

              {/* Cảnh báo học thuật nếu có */}
              {activeGarment.historicalCaution && (
                <div className="p-4 bg-[#FAF7F2] border border-[#8B2626]/30 rounded-sm flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-[#8B2626] shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold text-[#8B2626]">
                      Lưu ý về nguồn tư liệu và độ xác thực:
                    </div>
                    <p className="text-[#241E1C]/80 leading-relaxed">
                      {activeGarment.historicalCaution}
                    </p>
                  </div>
                </div>
              )}

              {/* Vài nét nhận diện & cấu tạo */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#241E1C]">
                  Đặc điểm nhận diện và cấu trúc chi tiết
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeGarment.structure.map((part, index) => (
                    <div key={index} className="bg-white p-3.5 rounded-sm border border-[#241E1C]/10 space-y-1">
                      <div className="font-serif font-semibold text-[#241E1C] text-xs">
                        {part.name}
                      </div>
                      <p className="text-xs text-[#241E1C]/75 leading-relaxed">
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

              {/* Gợi ý phối hiện đại */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#9E6E20]">
                  Gợi ý phối hiện đại cho người trẻ (Tách biệt khỏi bối cảnh lịch sử)
                </h3>
                <div className="p-3.5 bg-white border border-[#D4A054]/40 rounded-sm text-xs text-[#241E1C]/85 leading-relaxed">
                  {activeGarment.modernStylingTip}
                </div>
              </div>

              {/* NGUỒN THAM KHẢO THỰC TẾ (CRITICAL SECTION) */}
              <div className="space-y-3 pt-3 border-t border-[#241E1C]/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B2626]">
                    Nguồn tham khảo & Tình trạng kiểm chứng
                  </h3>
                  <span className="text-[11px] text-[#241E1C]/50">
                    {activeGarment.references.length} nguồn ghi nhận
                  </span>
                </div>

                <div className="space-y-3">
                  {activeGarment.references.map((ref, rIdx) => (
                    <div
                      key={rIdx}
                      className="bg-white p-4 rounded-sm border border-[#241E1C]/10 space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="font-semibold text-xs text-[#241E1C]">
                          {ref.title}
                        </div>
                        <div>
                          {getStatusBadge(ref.status)}
                        </div>
                      </div>

                      <div className="text-xs text-[#241E1C]/70">
                        Đơn vị / Tác giả: <strong>{ref.authorOrOrg}</strong>
                      </div>

                      {ref.note && (
                        <p className="text-[11px] text-[#241E1C]/75 italic leading-relaxed">
                          Ghi chú: {ref.note}
                        </p>
                      )}

                      {/* Real verified URL link */}
                      {ref.url ? (
                        <div className="pt-1">
                          <a
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8B2626] hover:underline"
                          >
                            <span>Truy cập nguồn tư liệu thực tế</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ) : (
                        <div className="text-[11px] text-[#241E1C]/50 italic pt-1">
                          * Nguồn tài liệu giấy / Thư tịch cổ chưa có liên kết số hóa công khai.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
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
