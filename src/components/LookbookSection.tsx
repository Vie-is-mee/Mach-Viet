import React, { useState, useEffect } from 'react';
import { LOOKBOOK_SAMPLES, GARMENTS_DATA, STUDIO_COLOR_PRESETS } from '../data/mockData';
import {
  INNER_LAYER_OPTIONS,
  BOTTOM_LAYER_OPTIONS,
  ACCESSORY_HEAD_OPTIONS,
  ACCESSORY_HAND_OPTIONS,
} from '../data/layerCompatibilityRules';
import { LookbookCard, SavedOutfitItem } from '../types';
import { Sparkles, Bookmark, Palette, Plus, Info, X, Edit3, Trash2, Calendar, Check, ExternalLink } from 'lucide-react';

interface LookbookSectionProps {
  userSavedOutfits: SavedOutfitItem[];
  onNavigateToStudio: () => void;
  onEditOutfit?: (outfit: SavedOutfitItem) => void;
  onDeleteOutfit?: (id: string) => void;
}

export const LookbookSection: React.FC<LookbookSectionProps> = ({
  userSavedOutfits,
  onNavigateToStudio,
  onEditOutfit,
  onDeleteOutfit,
}) => {
  const [selectedCard, setSelectedCard] = useState<LookbookCard | null>(null);

  // Durable bookmarks saved in localStorage
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mach_viet_bookmarked_lookbooks');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Không thể đọc bookmarks từ localStorage:', e);
    }
    return ['lb-1'];
  });

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      try {
        localStorage.setItem('mach_viet_bookmarked_lookbooks', JSON.stringify(next));
      } catch (e) {
        console.error('Không thể lưu bookmarks vào localStorage:', e);
      }
      return next;
    });
  };

  // Close detail modal on Escape key
  useEffect(() => {
    if (!selectedCard) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedCard(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCard]);

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
          type="button"
          onClick={onNavigateToStudio}
          className="px-4 py-2.5 bg-[#8B2626] hover:bg-[#741E1E] text-[#FAF7F2] text-xs font-semibold rounded-sm transition-colors flex items-center gap-2 cursor-pointer shrink-0 shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B2626]"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo bản phối mới trong Studio</span>
        </button>
      </div>

      {/* User Saved Outfits Section (Durable Full Data) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-[#241E1C] flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[#8B2626]" />
            <span>Bản phối cá nhân của bạn ({userSavedOutfits.length})</span>
          </h2>
          <span className="text-xs text-[#241E1C]/60">Lưu an toàn trên trình duyệt</span>
        </div>

        {userSavedOutfits.length === 0 ? (
          <div className="bg-white p-8 rounded-sm border border-dashed border-[#241E1C]/20 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#8B2626]/10 text-[#8B2626] flex items-center justify-center">
              <Bookmark className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-base font-semibold text-[#241E1C]">
                Chưa có bản phối cá nhân nào được lưu
              </h3>
              <p className="text-xs text-[#241E1C]/70 max-w-md mx-auto leading-relaxed">
                Khi tạo bản phối trong Studio, bạn có thể nhấn &ldquo;Lưu bản phối&rdquo; để lưu giữ cấu tạo áo, sắc màu và phụ kiện tại đây để xem lại hoặc sửa đổi bất cứ lúc nào.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToStudio}
              className="px-4 py-2 bg-[#8B2626] hover:bg-[#741E1E] text-white text-xs font-semibold rounded-xs shadow-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B2626]"
            >
              Mở Studio để phối đồ ngay
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userSavedOutfits.map((outfit) => {
              const garmentMeta = GARMENTS_DATA.find((g) => g.id === outfit.garmentId);
              const innerMeta = INNER_LAYER_OPTIONS.find((i) => i.id === outfit.innerLayer);
              const bottomMeta = BOTTOM_LAYER_OPTIONS.find((b) => b.id === outfit.bottomLayer);
              const headMeta = ACCESSORY_HEAD_OPTIONS.find((h) => h.id === outfit.accessoryHead);
              const handMeta = ACCESSORY_HAND_OPTIONS.find((a) => a.id === outfit.accessoryHand);
              const colorMeta = STUDIO_COLOR_PRESETS.find((c) => c.hex.toLowerCase() === outfit.selectedColor?.toLowerCase());

              return (
                <div
                  key={outfit.id}
                  className="bg-white p-5 rounded-sm border border-[#241E1C]/15 shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-stone-500 flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" />
                          <span>{outfit.savedAt}</span>
                        </span>
                        <h3 className="font-serif text-base font-semibold text-[#241E1C] leading-snug">
                          {outfit.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className="w-5 h-5 rounded-full border border-black/15 shadow-2xs inline-block"
                          style={{ backgroundColor: outfit.selectedColor }}
                          title={colorMeta?.name || outfit.selectedColor}
                        />
                      </div>
                    </div>

                    {/* Breakdown spec */}
                    <div className="bg-[#FAF7F2] p-3 rounded-xs border border-[#241E1C]/10 text-xs space-y-1 text-[#241E1C]/80">
                      <div>
                        <strong>Áo chính:</strong> {garmentMeta?.name || outfit.garmentId}
                      </div>
                      <div>
                        <strong>Lớp lót & Hạ y:</strong> {innerMeta?.name || outfit.innerLayer} · {bottomMeta?.name || outfit.bottomLayer}
                      </div>
                      <div>
                        <strong>Phụ kiện:</strong> {headMeta?.name || 'Tự nhiên'} · {handMeta?.name || 'Tự nhiên'}
                      </div>
                      {outfit.occasionGoal && (
                        <div className="text-[#8B2626] font-medium pt-0.5 border-t border-[#241E1C]/5">
                          Dịp mặc: {
                            outfit.occasionGoal === 'ky_yeu' ? 'Kỷ yếu tốt nghiệp' :
                            outfit.occasionGoal === 'le_tet' ? 'Lễ Tết' :
                            outfit.occasionGoal === 'thuyet_trinh' ? 'Thuyết trình' :
                            outfit.occasionGoal === 'dao_pho' ? 'Dạo phố' : 'Sự kiện trang trọng'
                          }
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-[#241E1C]/10 flex items-center justify-between text-xs">
                    {onDeleteOutfit && (
                      <button
                        type="button"
                        onClick={() => onDeleteOutfit(outfit.id)}
                        className="text-stone-500 hover:text-red-700 flex items-center gap-1 cursor-pointer transition-colors p-1"
                        title="Xóa bản phối này khỏi máy"
                        aria-label={`Xóa bản phối ${outfit.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (onEditOutfit) {
                          onEditOutfit(outfit);
                        } else {
                          onNavigateToStudio();
                        }
                      }}
                      className="px-3 py-1.5 bg-[#8B2626] hover:bg-[#741E1E] text-white rounded-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs ml-auto transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B2626]"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Sửa trong Studio</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lookbook Cards Grid (Accessible, Non-Nested Interactive Controls) */}
      <div className="space-y-4 pt-4 border-t border-[#241E1C]/10">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-[#241E1C] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8B2626]" />
            <span>Bộ Sưu Tập Gợi Ý Phối Đương Đại</span>
          </h2>
          <span className="text-xs text-[#241E1C]/60">{LOOKBOOK_SAMPLES.length} phong cách</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {LOOKBOOK_SAMPLES.map((card) => {
            const isSaved = bookmarkedIds.includes(card.id);
            return (
              <article
                key={card.id}
                className="bg-white rounded-sm border border-[#241E1C]/10 hover:border-[#8B2626]/40 transition-all flex flex-col justify-between overflow-hidden shadow-xs"
              >
                <div className="p-6 space-y-4">
                  {/* Header info */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8B2626]">
                      {card.occasion}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleBookmark(card.id)}
                      className={`p-1.5 rounded-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B2626] ${
                        isSaved ? 'text-[#8B2626] bg-[#8B2626]/10' : 'text-[#241E1C]/30 hover:text-[#241E1C]'
                      }`}
                      aria-label={isSaved ? `Bỏ lưu bản phối ${card.title}` : `Lưu bản phối ${card.title}`}
                      aria-pressed={isSaved}
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCard(card)}
                    className="text-left font-serif text-xl font-semibold text-[#241E1C] hover:text-[#8B2626] transition-colors cursor-pointer block w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B2626] rounded-xs"
                  >
                    {card.title}
                  </button>

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
                          title={colorHex}
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

                  {/* Read detail button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCard(card)}
                      className="w-full py-2 px-3 text-center text-xs font-semibold text-[#8B2626] bg-[#8B2626]/5 hover:bg-[#8B2626]/15 rounded-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B2626]"
                    >
                      Xem chi tiết bản phối
                    </button>
                  </div>
                </div>

                {/* Author & Audience Foot */}
                <div className="p-4 bg-[#FAF7F2] border-t border-[#241E1C]/10 flex items-center justify-between text-xs text-[#241E1C]/60">
                  <span>{card.author}</span>
                  <span className="font-medium text-[#8B2626]">{card.audience}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Lookbook Detail Modal (Accessible Dialog with Escape Key Support) */}
      {selectedCard && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lookbook-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#241E1C]/60 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-[#FAF7F2] border border-[#241E1C]/15 rounded-sm max-w-lg w-full p-6 space-y-5 shadow-xl">
            <div className="flex items-start justify-between border-b border-[#241E1C]/10 pb-3">
              <div>
                <div className="text-xs text-[#8B2626] font-semibold uppercase tracking-wider">
                  {selectedCard.occasion}
                </div>
                <h3 id="lookbook-modal-title" className="font-serif text-2xl font-semibold text-[#241E1C] mt-1">
                  {selectedCard.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                className="p-1.5 text-[#241E1C]/50 hover:text-[#241E1C] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B2626] rounded-xs"
                aria-label="Đóng hộp thoại"
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
                type="button"
                onClick={() => setSelectedCard(null)}
                className="px-4 py-2 text-xs text-[#241E1C]/70 hover:text-[#241E1C] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B2626] rounded-xs"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCard(null);
                  onNavigateToStudio();
                }}
                className="px-4 py-2 bg-[#8B2626] hover:bg-[#741E1E] text-[#FAF7F2] text-xs font-semibold rounded-sm cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B2626]"
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
