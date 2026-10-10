import React from 'react';
import { NavigationTab } from '../types';
import { Sparkles, Compass, Palette, BookOpen, Layers, Menu, X } from 'lucide-react';

interface NavbarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenPreferenceWizard?: () => void;
  hasPreferenceProfile?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  onSelectTab, 
  onOpenPreferenceWizard,
  hasPreferenceProfile 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems: { id: NavigationTab; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Trang chủ', icon: <Compass className="w-4 h-4" /> },
    { id: 'explore', label: 'Khám phá Việt phục', icon: <Layers className="w-4 h-4" /> },
    { id: 'studio', label: 'Studio phối đồ', icon: <Palette className="w-4 h-4" /> },
    { id: 'lookbook', label: 'Lookbook', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'culture', label: 'Góc văn hóa', icon: <BookOpen className="w-4 h-4" /> },
  ];

  const handleSelect = (tab: NavigationTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrimaryAction = () => {
    if (!hasPreferenceProfile && onOpenPreferenceWizard) {
      onOpenPreferenceWizard();
    } else {
      handleSelect('studio');
    }
  };


  return (
    <>
      {/* Desktop & Tablet Top Bar (Adhering to Top Bar Contract: 3 Zones) */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#241E1C]/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Wordmark */}
          <button
            onClick={() => handleSelect('home')}
            className="flex items-center gap-2 group text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B2626]"
          >
            <div className="w-8 h-8 rounded-sm bg-[#8B2626] text-[#FAF7F2] flex items-center justify-center font-serif font-bold text-lg tracking-wider shadow-xs">
              M
            </div>
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#8B2626] whitespace-nowrap shrink-0">
              MẠCH VIỆT
            </span>
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-3 lg:gap-7 text-xs lg:text-sm font-medium">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`relative py-1 px-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B2626] ${
                    isActive
                      ? 'text-[#8B2626] font-semibold'
                      : 'text-[#241E1C]/70 hover:text-[#8B2626]'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#8B2626] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Primary Action & Mobile Menu Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handlePrimaryAction}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#FAF7F2] bg-[#8B2626] hover:bg-[#741E1E] active:scale-[0.98] transition-all rounded-sm shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#8B2626]"
            >
              Bắt đầu phối
            </button>

            {/* Mobile hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#241E1C]/80 hover:text-[#8B2626] cursor-pointer"
              aria-label="Mở thực đơn di động"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown drawer (within 15% screen flow) */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#241E1C]/10 bg-[#FAF7F2] px-4 py-3 space-y-1 shadow-md">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-left text-sm font-medium transition-colors cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-[#8B2626]/10 text-[#8B2626] font-semibold'
                    : 'text-[#241E1C]/80 hover:bg-[#241E1C]/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handlePrimaryAction();
                }}
                className="w-full py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-[#FAF7F2] bg-[#8B2626] rounded-sm cursor-pointer"
              >
                Bắt đầu phối đồ (5 bước)
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (Thumb-friendly, <= 15% viewport height) */}
      <nav 
        aria-label="Thanh điều hướng di động"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-t border-[#241E1C]/10 h-14 flex items-center justify-around px-2"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
                isActive ? 'text-[#8B2626]' : 'text-[#241E1C]/60 hover:text-[#8B2626]'
              }`}
            >
              <span className="p-0.5">{item.icon}</span>
              <span className="text-[10px] leading-tight font-medium mt-0.5 truncate max-w-[64px]">
                {item.id === 'home' ? 'Trang chủ' : item.id === 'explore' ? 'Khám phá' : item.id === 'studio' ? 'Studio' : item.id === 'lookbook' ? 'Lookbook' : 'Văn hóa'}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
