import React, { useState } from 'react';
import { CULTURAL_ARTICLES } from '../data/mockData';
import { CulturalArticle } from '../types';
import { BookOpen, Sparkles, CheckCircle, Heart, ShieldCheck, Compass } from 'lucide-react';

export const CulturalValues: React.FC = () => {
  const [selectedArticleId, setSelectedArticleId] = useState<string>(CULTURAL_ARTICLES[0].id);

  const activeArticle = CULTURAL_ARTICLES.find((a) => a.id === selectedArticleId) || CULTURAL_ARTICLES[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Editorial Header */}
      <div className="border-b border-[#241E1C]/10 pb-6">
        <div className="text-xs uppercase tracking-widest text-[#8B2626] font-semibold mb-1">
          Hành Trang Di Sản Cho Người Trẻ
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#241E1C] font-semibold">
          Hiểu Sâu Để Mặc Đúng & Tự Hào
        </h1>
        <p className="text-sm text-[#241E1C]/75 mt-2 max-w-2xl">
          Mạch Việt đúc kết những nét cốt lõi nhất của y phục cổ truyền thành các góc nhìn ngắn gọn, gần gũi, giúp các bạn học sinh, sinh viên tự tin lan tỏa văn hóa.
        </p>
      </div>

      {/* 3 Core Youth Principles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-sm border border-[#241E1C]/10 space-y-3 shadow-xs">
          <div className="w-9 h-9 rounded-sm bg-[#8B2626]/10 text-[#8B2626] flex items-center justify-center font-serif font-bold text-base">
            01
          </div>
          <h2 className="font-serif text-lg font-semibold text-[#241E1C]">
            Đúng Phom Cốt Cổ Nhân
          </h2>
          <p className="text-xs text-[#241E1C]/75 leading-relaxed">
            Áo ngũ thân cần đường cắt thẳng, tà cong hình cánh cung, cổ đứng lập lĩnh kín đáo. Giữ đúng phom chuẩn là giữ gìn linh hồn của trang phục.
          </p>
        </div>

        <div className="p-6 bg-white rounded-sm border border-[#241E1C]/10 space-y-3 shadow-xs">
          <div className="w-9 h-9 rounded-sm bg-[#D4A054]/15 text-[#9E6E20] flex items-center justify-center font-serif font-bold text-base">
            02
          </div>
          <h2 className="font-serif text-lg font-semibold text-[#241E1C]">
            Đạo Đức & Đạo Hiếu Ẩn Sâu
          </h2>
          <p className="text-xs text-[#241E1C]/75 leading-relaxed">
            Mỗi nếp áo là một lời nhắc nhở: 4 vạt ngoài là cha mẹ đôi bên chở che vạt con bên trong; 5 hạt cúc là Nhân, Lễ, Nghĩa, Trí, Tín của người quân tử.
          </p>
        </div>

        <div className="p-6 bg-white rounded-sm border border-[#241E1C]/10 space-y-3 shadow-xs">
          <div className="w-9 h-9 rounded-sm bg-[#1B4D3E]/10 text-[#1B4D3E] flex items-center justify-center font-serif font-bold text-base">
            03
          </div>
          <h2 className="font-serif text-lg font-semibold text-[#241E1C]">
            Sáng Tạo Văn Minh & Lịch Thiệp
          </h2>
          <p className="text-xs text-[#241E1C]/75 leading-relaxed">
            Người trẻ hoàn toàn có thể phối cùng sneaker tối giản hay túi tote hiện đại khi dạo phố, miễn sao tác phong đoan chính và tôn trọng bối cảnh.
          </p>
        </div>
      </div>

      {/* Interactive Two-Column Editorial Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Topics Nav (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#241E1C]/60 block px-1">
            Chủ đề tuyển chọn
          </span>
          <div className="space-y-1.5">
            {CULTURAL_ARTICLES.map((article) => {
              const isSelected = article.id === selectedArticleId;
              return (
                <button
                  key={article.id}
                  onClick={() => setSelectedArticleId(article.id)}
                  className={`w-full text-left p-4 rounded-sm transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#8B2626] shadow-xs'
                      : 'bg-white/60 hover:bg-white border-[#241E1C]/10'
                  }`}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8B2626]">
                    {article.culturalDimension}
                  </div>
                  <div className="font-serif font-semibold text-sm text-[#241E1C] mt-1">
                    {article.title}
                  </div>
                  <div className="text-xs text-[#241E1C]/60 mt-1 line-clamp-1">
                    {article.subtitle}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Article Deep-Dive (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-sm border border-[#241E1C]/10 space-y-6">
          <div className="border-b border-[#241E1C]/10 pb-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#8B2626]">
              {activeArticle.culturalDimension}
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#241E1C] mt-1 leading-snug">
              {activeArticle.title}
            </h2>
            <div className="text-sm font-medium text-[#241E1C]/70 mt-1 italic">
              {activeArticle.subtitle}
            </div>
          </div>

          {/* Lead Summary */}
          <p className="text-sm sm:text-base text-[#241E1C]/85 leading-relaxed font-normal">
            {activeArticle.summary}
          </p>

          {/* Key Takeaway Box */}
          <div className="p-5 bg-[#FAF7F2] rounded-sm border border-[#241E1C]/10 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8B2626]">
              <Sparkles className="w-4 h-4" />
              <span>Ý nghĩa cốt lõi cần ghi nhớ</span>
            </div>
            <p className="text-xs sm:text-sm text-[#241E1C]/85 leading-relaxed">
              {activeArticle.keyTakeaway}
            </p>
          </div>

          {/* Etiquette Tip */}
          <div className="p-4 bg-[#1B4D3E]/5 border border-[#1B4D3E]/20 rounded-sm flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#1B4D3E] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-semibold text-[#1B4D3E]">
                Quy tắc ứng xử văn minh khi diện phục
              </div>
              <p className="text-xs text-[#241E1C]/80 leading-relaxed">
                {activeArticle.etiquetteTip}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
