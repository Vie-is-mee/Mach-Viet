import React from 'react';
import { NavigationTab } from '../types';

interface FooterProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="border-t border-[#241E1C]/10 bg-[#F5EFEB] py-12 text-[#241E1C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-sm bg-[#8B2626] text-[#FAF7F2] flex items-center justify-center font-serif font-bold text-sm">
                M
              </div>
              <span className="font-serif text-xl font-bold tracking-tight text-[#8B2626]">
                MẠCH VIỆT
              </span>
            </div>
            <p className="text-xs text-[#241E1C]/75 leading-relaxed max-w-sm">
              Nền tảng kiến tạo cầu nối giữa di sản y phục truyền thống Việt Nam và thẩm mỹ đương đại của thế hệ học sinh, sinh viên.
            </p>
          </div>

          {/* Quick links */}
          <div className="md:col-span-4 space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#8B2626] block">
              Các Khu Vực Trải Nghiệm
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#241E1C]/80">
              <button
                onClick={() => onNavigate('home')}
                className="text-left hover:text-[#8B2626] transition-colors cursor-pointer"
              >
                Trang chủ
              </button>
              <button
                onClick={() => onNavigate('explore')}
                className="text-left hover:text-[#8B2626] transition-colors cursor-pointer"
              >
                Khám phá y phục
              </button>
              <button
                onClick={() => onNavigate('studio')}
                className="text-left hover:text-[#8B2626] transition-colors cursor-pointer"
              >
                Studio phối đồ
              </button>
              <button
                onClick={() => onNavigate('lookbook')}
                className="text-left hover:text-[#8B2626] transition-colors cursor-pointer"
              >
                Lookbook trẻ
              </button>
              <button
                onClick={() => onNavigate('culture')}
                className="text-left hover:text-[#8B2626] transition-colors cursor-pointer"
              >
                Góc văn hóa
              </button>
            </div>
          </div>

          {/* Project notes */}
          <div className="md:col-span-3 space-y-2 text-xs text-[#241E1C]/70">
            <span className="font-semibold uppercase tracking-wider text-[#8B2626] block">
              Thông Tin Khung Nền
            </span>
            <p className="leading-relaxed">
              Dự án khởi đầu với bộ khung cấu trúc chuẩn mực. Giai đoạn tiếp theo sẽ tích hợp hiển thị 3D và gợi ý thông minh.
            </p>
            <div className="text-[11px] text-[#241E1C]/50 pt-1">
              Phát triển vì tình yêu di sản văn hóa Việt Nam.
            </div>
          </div>

        </div>

        <div className="mt-10 pt-6 border-t border-[#241E1C]/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#241E1C]/60 gap-4">
          <div>
            © {new Date().getFullYear()} Mạch Việt. Bản quyền nội dung & cấu trúc thuộc về dự án văn hóa trẻ.
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span>Thiết kế tôn vinh bản sắc</span>
            <span aria-hidden="true">·</span>
            <span>Không gian trang nhã</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
