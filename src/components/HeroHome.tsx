import React from 'react';
import { NavigationTab } from '../types';
import { HERO_ASSETS, GARMENTS_DATA } from '../data/mockData';
import { ArrowRight, Compass, Palette, BookOpen, Sparkles, CheckCircle2 } from 'lucide-react';

interface HeroHomeProps {
  onNavigate: (tab: NavigationTab) => void;
  onSelectGarment: (garmentId: string) => void;
}

export const HeroHome: React.FC<HeroHomeProps> = ({ onNavigate, onSelectGarment }) => {
  const featuredGarments = GARMENTS_DATA.slice(0, 3);

  return (
    <div className="space-y-16 sm:space-y-24 pb-12">
      {/* Editorial Hero Banner */}
      <section className="relative pt-6 sm:pt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Unboxed Metadata (Zero-Pill discipline) */}
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#8B2626] font-semibold">
                <span>Dự án Cổ Phục & Người Trẻ</span>
                <span aria-hidden="true">·</span>
                <span>Thế Hệ Z & Gen Alpha</span>
                <span aria-hidden="true">·</span>
                <span>Phiên Bản Khung Nền</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-[#241E1C] leading-[1.15] font-semibold tracking-tight text-balance">
                Mạch nguồn cổ phục, <br />
                <span className="text-[#8B2626] italic font-normal">hơi thở đương đại</span> cho người trẻ.
              </h1>

              <p className="text-base sm:text-lg text-[#241E1C]/80 leading-relaxed max-w-2xl">
                Mạch Việt ra đời giúp học sinh, sinh viên và bạn trẻ dễ dàng tìm hiểu cấu trúc chuẩn mực của Áo ngũ thân, Áo tấc, Nhật bình... từ đó tự tin phối đồ theo dịp, màu sắc và cá tính riêng mà không sợ sai lệch quy cách.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => onNavigate('explore')}
                  className="px-6 py-3.5 bg-[#8B2626] hover:bg-[#741E1E] text-[#FAF7F2] text-sm font-semibold tracking-wide rounded-sm shadow-sm transition-all flex items-center gap-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#8B2626]"
                >
                  <span>Bắt đầu khám phá</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => onNavigate('studio')}
                  className="px-6 py-3.5 bg-transparent hover:bg-[#8B2626]/5 text-[#8B2626] border border-[#8B2626]/40 hover:border-[#8B2626] text-sm font-semibold tracking-wide rounded-sm transition-all flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#8B2626]"
                >
                  <Palette className="w-4 h-4" />
                  <span>Xem khung Studio</span>
                </button>
              </div>

              {/* Trust/Design principles unboxed list */}
              <div className="pt-4 border-t border-[#241E1C]/10 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-[#241E1C]/75">
                <div>
                  <span className="font-semibold text-[#8B2626] block text-sm font-serif">100% Chuẩn mực</span>
                  <span>Quy cách cắt may truyền thống</span>
                </div>
                <div>
                  <span className="font-semibold text-[#8B2626] block text-sm font-serif">Định hướng trẻ</span>
                  <span>Gợi ý phối kỷ yếu, lễ hội</span>
                </div>
                <div>
                  <span className="font-semibold text-[#8B2626] block text-sm font-serif">Không gian 3D</span>
                  <span>Đang kiến tạo mô đun phối dáng</span>
                </div>
              </div>
            </div>

            {/* Right Media Column */}
            <div className="lg:col-span-5">
              <div className="relative group overflow-hidden rounded-sm border border-[#241E1C]/10 bg-[#FAF7F2] shadow-sm">
                <img
                  src={HERO_ASSETS.heroBanner}
                  alt="Người trẻ diện trang phục truyền thống Việt Nam thanh lịch"
                  referrerPolicy="no-referrer"
                  className="w-full h-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/5] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                {/* Editorial Scrim Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#241E1C]/90 via-[#241E1C]/30 to-transparent flex flex-col justify-end p-6 text-[#FAF7F2]">
                  <div className="text-[11px] uppercase tracking-widest text-[#E8C882] font-medium mb-1">
                    Góc nhìn thanh xuân
                  </div>
                  <h3 className="font-serif text-lg sm:text-xl font-medium leading-snug">
                    Áo Ngũ Thân & Áo Tấc trong nhịp sống đương đại
                  </h3>
                  <p className="text-xs text-[#FAF7F2]/80 mt-1 line-clamp-2">
                    Vẻ đẹp trang nghiêm mà gần gũi, phù hợp từ giảng đường đến các sự kiện văn hóa trọng đại.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4 Foundation Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="text-xs uppercase tracking-widest text-[#8B2626] font-semibold mb-2">
            Cấu Trúc Hệ Thống
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#241E1C] font-semibold">
            Bốn trục trải nghiệm của Mạch Việt
          </h2>
          <p className="text-sm text-[#241E1C]/70 mt-2">
            Được phân bổ thành các mô đun độc lập, sẵn sàng đón nhận dữ liệu khảo cứu và công nghệ 3D tiếp theo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1 */}
          <div 
            onClick={() => onNavigate('explore')}
            className="p-6 bg-white/70 hover:bg-white rounded-sm border border-[#241E1C]/10 transition-all hover:border-[#8B2626]/40 cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-sm bg-[#8B2626]/10 text-[#8B2626] flex items-center justify-center mb-4 group-hover:bg-[#8B2626] group-hover:text-white transition-colors">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#241E1C] group-hover:text-[#8B2626] transition-colors">
                01. Khám Phá Việt Phục
              </h3>
              <p className="text-xs text-[#241E1C]/75 leading-relaxed mt-2">
                Hệ thống dữ liệu phân loại Áo ngũ thân tay chẽn, Áo tấc, Nhật bình, Giao lĩnh với hình ảnh và cấu trúc chi tiết từng bộ phận.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#241E1C]/10 flex items-center gap-1.5 text-xs font-semibold text-[#8B2626]">
              <span>Xem danh mục</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Pillar 2 */}
          <div 
            onClick={() => onNavigate('studio')}
            className="p-6 bg-white/70 hover:bg-white rounded-sm border border-[#241E1C]/10 transition-all hover:border-[#8B2626]/40 cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-sm bg-[#D4A054]/15 text-[#9E6E20] flex items-center justify-center mb-4 group-hover:bg-[#D4A054] group-hover:text-white transition-colors">
                <Palette className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-semibold text-[#241E1C] group-hover:text-[#8B2626] transition-colors">
                  02. Studio Phối Đồ
                </h3>
              </div>
              <p className="text-xs text-[#241E1C]/75 leading-relaxed mt-2">
                Khung bố cục bàn phối (Mannequin, xếp tầng lớp trang phục, chọn bảng màu ngũ hành). Giai đoạn 2 sẽ tích hợp 3D canvas trực quan.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#241E1C]/10 flex items-center justify-between text-xs font-semibold text-[#8B2626]">
              <span>Khám phá không gian</span>
              <span className="text-[10px] font-normal text-[#8B2626] bg-[#8B2626]/10 px-2 py-0.5 rounded-xs">Đang dựng 3D</span>
            </div>
          </div>

          {/* Pillar 3 */}
          <div 
            onClick={() => onNavigate('lookbook')}
            className="p-6 bg-white/70 hover:bg-white rounded-sm border border-[#241E1C]/10 transition-all hover:border-[#8B2626]/40 cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-sm bg-[#8B2626]/10 text-[#8B2626] flex items-center justify-center mb-4 group-hover:bg-[#8B2626] group-hover:text-white transition-colors">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#241E1C] group-hover:text-[#8B2626] transition-colors">
                03. Lookbook Bộ Phối
              </h3>
              <p className="text-xs text-[#241E1C]/75 leading-relaxed mt-2">
                Các ý tưởng phối phục thực tế cho kỷ yếu, dạo phố, chụp ảnh và lễ hội dành cho giới trẻ, phân tích bảng màu và phụ kiện đi kèm.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#241E1C]/10 flex items-center gap-1.5 text-xs font-semibold text-[#8B2626]">
              <span>Xem bộ sưu tập</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Pillar 4 */}
          <div 
            onClick={() => onNavigate('culture')}
            className="p-6 bg-white/70 hover:bg-white rounded-sm border border-[#241E1C]/10 transition-all hover:border-[#8B2626]/40 cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-sm bg-[#241E1C]/10 text-[#241E1C] flex items-center justify-center mb-4 group-hover:bg-[#241E1C] group-hover:text-white transition-colors">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#241E1C] group-hover:text-[#8B2626] transition-colors">
                04. Góc Văn Hóa & Giá Trị
              </h3>
              <p className="text-xs text-[#241E1C]/75 leading-relaxed mt-2">
                Diễn giải ngắn gọn, hấp dẫn về ý nghĩa 5 thân áo, đạo lý Ngũ Thường, quy tắc hữu nhậm và tác phong lịch thiệp khi diện cổ phục.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-[#241E1C]/10 flex items-center gap-1.5 text-xs font-semibold text-[#8B2626]">
              <span>Đọc tri thức</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Costumes Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4 border-b border-[#241E1C]/10 pb-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-[#8B2626] font-semibold mb-1">
              Tiêu Điểm Khảo Cứu
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#241E1C] font-semibold">
              Các dạng thức Việt phục tiêu biểu
            </h2>
          </div>
          <button
            onClick={() => onNavigate('explore')}
            className="text-xs font-semibold text-[#8B2626] hover:text-[#741E1E] flex items-center gap-1 cursor-pointer"
          >
            <span>Xem toàn bộ thư viện</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredGarments.map((garment) => (
            <div
              key={garment.id}
              onClick={() => {
                onNavigate('explore');
                onSelectGarment(garment.id);
              }}
              className="group bg-white rounded-sm border border-[#241E1C]/10 overflow-hidden cursor-pointer hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Visual Display */}
                <div className="relative aspect-[4/3] bg-[#F5EFEB] overflow-hidden">
                  {garment.image ? (
                    <img
                      src={garment.image}
                      alt={garment.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#241E1C]/40 text-xs italic">
                      Đang chụp bản mẫu hiện vật
                    </div>
                  )}
                  <div className="absolute top-3 left-3 bg-[#FAF7F2]/90 backdrop-blur-xs px-2.5 py-1 text-[11px] font-medium text-[#241E1C] rounded-xs border border-[#241E1C]/10">
                    {garment.originEra.split('(')[0]}
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-3">
                  <div className="text-xs text-[#8B2626] font-medium">
                    {garment.subName}
                  </div>
                  <h3 className="font-serif text-xl font-semibold text-[#241E1C] group-hover:text-[#8B2626] transition-colors">
                    {garment.name}
                  </h3>
                  <p className="text-xs text-[#241E1C]/75 line-clamp-2 leading-relaxed">
                    {garment.silhouette}
                  </p>

                  {/* Occasions unboxed inline */}
                  <div className="pt-2 flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-[#241E1C]/60">
                    <span className="font-medium text-[#241E1C]/80">Dịp phù hợp:</span>
                    {garment.idealOccasions.map((occ, idx) => (
                      <span key={occ}>
                        {occ}{idx < garment.idealOccasions.length - 1 ? ' ·' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action bottom */}
              <div className="px-5 py-3 bg-[#FAF7F2] border-t border-[#241E1C]/5 flex items-center justify-between text-xs font-semibold text-[#8B2626]">
                <span>Xem cấu tạo chi tiết</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Cultural Principle Quote Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 bg-[#8B2626] text-[#FAF7F2] rounded-sm relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="text-xs uppercase tracking-widest text-[#E8C882] font-semibold">
              Tinh Thần Mạch Việt
            </div>
            <blockquote className="font-serif text-xl sm:text-2xl lg:text-3xl font-normal leading-snug">
              &ldquo;Mặc cổ phục không phải là sao chép lại quá khứ trong tủ kính bảo tàng, mà là đem tinh hoa và phẩm cách của tiền nhân đồng hành cùng tuổi trẻ hôm nay.&rdquo;
            </blockquote>
            <p className="text-xs sm:text-sm text-[#FAF7F2]/80 pt-2">
              — Định hướng nghiên cứu & phát triển ứng dụng Mạch Việt cho học sinh, sinh viên Việt Nam.
            </p>
          </div>
          {/* Subtle watermark background motif */}
          <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 font-serif text-9xl font-bold select-none pointer-events-none text-white">
            VIỆT
          </div>
        </div>
      </section>
    </div>
  );
};
