import React, { useState } from 'react';
import { LOOKBOOK_SAMPLES } from '../data/mockData';
import { LookbookCard } from '../types';
import { Sparkles, Bookmark, Palette, Share2, Plus, Info, X } from 'lucide-react';

interface LookbookSectionProps {
  userSavedOutfits: string[];
  onNavigateToStudio: () => void;
}

export const LookbookSection: React.FC<LookbookSectionProps> = ({
  userSavedOutfits,
  onNavigateToStudio,
}) => {
  const [selectedCard, setSelectedCard] = useState<LookbookCard | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(['lb-1']);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-[#241E1C]/10 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#8B2626] font-semibold mb-1">
            Không Gian Cảm Hứng
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#241E1C] font-semibold">
            Lookbook Bản Phối Trẻ
          </h1>
          <p className="text-sm text-[#241E1C]/75 mt-2 max-w-2xl">
            Các bộ phối thực tế được tổng hợp từ học sinh, sinh viên và các câu lạc bộ cổ phong trên toàn quốc, kết hợp hài hòa giữa truyền thống và thẩm mỹ trẻ trung.
          </p>
        </div>

        <button
          onClick={onNavigateToStudio}
          className="px-4 py-2.5 bg-[#8B2626] hover:bg-[#741E1E] text-[#FAF7F2] text-xs font-semibold rounded-sm transition-colors flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo bản phối mới trong Studio</span>
        </button>
      </div>

      {/* User Saved Outfits Tray (if any exist) */}
      {userSavedOutfits.length > 0 && (
        <div className="bg-white p-5 rounded-sm border border-[#241E1C]/10 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-base font-semibold text-[#241E1C] flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#8B2626]" />
              <span>Bản phối cá nhân của bạn ({userSavedOutfits.length})</span>
            </h2>
            <span className="text-[11px] text-[#241E1C]/50">Lưu trong phiên làm việc</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {userSavedOutfits.map((outfit, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#FAF7F2] border border-[#241E1C]/10 rounded-sm flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-medium text-[#241E1C]">{outfit}</div>
                  <div className="text-[10px] text-[#241E1C]/60">Tạo từ Studio Mạch Việt</div>
                </div>
                <button
                  onClick={onNavigateToStudio}
                  className="text-xs text-[#8B2626] font-semibold hover:underline cursor-pointer"
                >
                  Sửa
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lookbook Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {LOOKBOOK_SAMPLES.map((card) => {
          const isSaved = bookmarkedIds.includes(card.id);
          return (
            <div
              key={card.id}
              onClick={() => setSelectedCard(card)}
              className="bg-white rounded-sm border border-[#241E1C]/10 hover:border-[#8B2626]/40 transition-all flex flex-col justify-between overflow-hidden cursor-pointer group shadow-xs"
            >
              <div className="p-6 space-y-4">
                {/* Header info */}
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8B2626]">
                    {card.occasion}
                  </div>
                  <button
                    onClick={(e) => toggleBookmark(card.id, e)}
                    className={`p-1.5 rounded-sm transition-colors cursor-pointer ${
                      isSaved ? 'text-[#8B2626] bg-[#8B2626]/10' : 'text-[#241E1C]/30 hover:text-[#241E1C]'
                    }`}
                    aria-label="Lưu bản phối"
                  >
                    <Bookmark className="w-4 h-4 fill-current" />
                  </button>
                </div>

                <h3 className="font-serif text-xl font-semibold text-[#241E1C] group-hover:text-[#8B2626] transition-colors">
                  {card.title}
                </h3>

                <p className="text-xs text-[#241E1C]/75 leading-relaxed">
                  {card.concept}
                </p>

                {/* Primary Garment */}
                <div className="bg-[#FAF7F2] p-3 rounded-sm border border-[#241E1C]/5 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-[#241E1C]/60 tracking-wider block">
                    Y phục chủ đạo:
                  </span>
                  <div className="text-xs font-medium text-[#241E1C]">
                    {card.primaryGarment}
                  </div>
                </div>

                {/* Palette Swatches */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-[#241E1C]/70 block">
                    Bảng màu tổng thể:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {card.palette.map((colorHex, cIdx) => (
                      <span
                        key={cIdx}
                        className="w-5 h-5 rounded-xs border border-black/10 inline-block"
                        style={{ backgroundColor: colorHex }}
                      />
                    ))}
                  </div>
                </div>

                {/* Items breakdown list */}
                <div className="space-y-1 text-xs text-[#241E1C]/75 pt-2 border-t border-[#241E1C]/5">
                  <span className="font-semibold text-[#241E1C] block text-[11px]">
                    Các thành phần phối cùng:
                  </span>
                  <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px]">
                    {card.stylingItems.map((item, iIdx) => (
                      <span key={iIdx}>
                        {item}{iIdx < card.stylingItems.length - 1 ? ' ·' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Author & Audience Foot */}
              <div className="p-4 bg-[#FAF7F2] border-t border-[#241E1C]/10 flex items-center justify-between text-xs text-[#241E1C]/60">
                <span>{card.author}</span>
                <span className="font-medium text-[#8B2626]">{card.audience}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lookbook Detail Modal */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#241E1C]/60 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] border border-[#241E1C]/15 rounded-sm max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-start justify-between border-b border-[#241E1C]/10 pb-3">
              <div>
                <div className="text-xs text-[#8B2626] font-semibold uppercase tracking-wider">
                  {selectedCard.occasion}
                </div>
                <h3 className="font-serif text-2xl font-semibold text-[#241E1C] mt-1">
                  {selectedCard.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                className="p-1 text-[#241E1C]/40 hover:text-[#241E1C] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-[#241E1C]/80 leading-relaxed">
              {selectedCard.concept}
            </p>

            <div className="bg-white p-4 rounded-sm border border-[#241E1C]/10 space-y-2 text-xs">
              <div><strong>Trang phục cốt lõi:</strong> {selectedCard.primaryGarment}</div>
              <div><strong>Đóng góp bởi:</strong> {selectedCard.author}</div>
              <div><strong>Đối tượng khuyên dùng:</strong> {selectedCard.audience}</div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#241E1C]">Bảng chi tiết phụ kiện:</span>
              <ul className="text-xs space-y-1 text-[#241E1C]/80 list-disc list-inside">
                {selectedCard.stylingItems.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-[#241E1C]/10 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedCard(null)}
                className="px-4 py-2 text-xs text-[#241E1C]/70 hover:text-[#241E1C] cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setSelectedCard(null);
                  onNavigateToStudio();
                }}
                className="px-4 py-2 bg-[#8B2626] hover:bg-[#741E1E] text-[#FAF7F2] text-xs font-semibold rounded-sm cursor-pointer"
              >
                Mở trong Studio để tùy biến
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
