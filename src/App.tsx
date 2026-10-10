/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NavigationTab, PreferenceProfile, SavedOutfitItem, normalizeGarmentChoice } from './types';
import { Navbar } from './components/Navbar';
import { HeroHome } from './components/HeroHome';
import { CostumeExplorer } from './components/CostumeExplorer';
import { StudioWorkspace } from './components/StudioWorkspace';
import { LookbookSection } from './components/LookbookSection';
import { CulturalValues } from './components/CulturalValues';
import { PreferenceWizardModal } from './components/PreferenceWizardModal';
import { Footer } from './components/Footer';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [selectedGarmentId, setSelectedGarmentId] = useState<string | null>(null);
  const [editingOutfit, setEditingOutfit] = useState<SavedOutfitItem | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);

  // Durable saved outfits with safe localStorage retrieval
  const [userSavedOutfits, setUserSavedOutfits] = useState<SavedOutfitItem[]>(() => {
    try {
      const saved = localStorage.getItem('mach_viet_saved_outfits');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed as SavedOutfitItem[];
      }
    } catch (e) {
      console.error('Không thể đọc danh sách bản phối từ localStorage:', e);
    }
    return [];
  });

  // Preference Profile with safe localStorage retrieval and normalizer
  const [preferenceProfile, setPreferenceProfile] = useState<PreferenceProfile | null>(() => {
    try {
      const saved = localStorage.getItem('mach_viet_preference_profile');
      if (saved) {
        const parsed = JSON.parse(saved) as PreferenceProfile;
        const normalized = normalizeGarmentChoice(parsed.garmentChoice);
        return {
          ...parsed,
          garmentChoice: normalized.garmentChoice,
          subGarmentVariantId: parsed.subGarmentVariantId || normalized.subVariantId,
        };
      }
    } catch (e) {
      console.error('Không thể đọc hồ sơ sở thích từ localStorage:', e);
    }
    return null;
  });

  const handleNavigate = (tab: NavigationTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenGarmentInStudio = (garmentId?: string) => {
    if (garmentId) {
      setSelectedGarmentId(garmentId);
    }
    setActiveTab('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveOutfit = (outfit: SavedOutfitItem | string) => {
    const itemToSave: SavedOutfitItem = typeof outfit === 'string' ? {
      id: `outfit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: outfit,
      savedAt: new Date().toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      garmentId: selectedGarmentId || 'ao-tu-than',
      selectedColor: '#8B2626',
      innerLayer: 'yem-dao',
      bottomLayer: 'vay-xep-ly',
      accessoryHead: 'non-la',
      accessoryHand: 'quat-nan',
      occasionGoal: 'dao_pho',
    } : outfit;

    setUserSavedOutfits((prev) => {
      // Replace existing item if editing, or prepend new
      const filtered = prev.filter((o) => o.id !== itemToSave.id);
      const updated = [itemToSave, ...filtered];
      try {
        localStorage.setItem('mach_viet_saved_outfits', JSON.stringify(updated));
      } catch (e) {
        console.error('Không thể lưu bản phối vào localStorage:', e);
      }
      return updated;
    });
  };

  const handleEditOutfit = (outfit: SavedOutfitItem) => {
    setEditingOutfit(outfit);
    setSelectedGarmentId(outfit.garmentId);
    setActiveTab('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSavedOutfit = (id: string) => {
    setUserSavedOutfits((prev) => {
      const updated = prev.filter((o) => o.id !== id);
      try {
        localStorage.setItem('mach_viet_saved_outfits', JSON.stringify(updated));
      } catch (e) {
        console.error('Không thể lưu danh sách bản phối sau khi xóa:', e);
      }
      return updated;
    });
  };

  const handleSavePreferenceProfile = (newProfile: PreferenceProfile) => {
    setPreferenceProfile(newProfile);
    // Switch to Studio so user immediately sees their customized workspace
    setActiveTab('studio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearPreferenceProfile = () => {
    try {
      localStorage.removeItem('mach_viet_preference_profile');
    } catch (e) {
      console.error('Không thể xóa hồ sơ khỏi localStorage:', e);
    }
    setPreferenceProfile(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#241E1C]">
      {/* Top Navbar */}
      <Navbar 
        activeTab={activeTab} 
        onSelectTab={handleNavigate}
        onOpenPreferenceWizard={() => setIsWizardOpen(true)}
        hasPreferenceProfile={!!preferenceProfile}
      />

      {/* Main Content Area (with padding for mobile bottom bar) */}
      <main className="flex-1 pb-16 md:pb-0">
        {activeTab === 'home' && (
          <HeroHome
            onNavigate={handleNavigate}
            onSelectGarment={(id) => {
              setSelectedGarmentId(id);
              setActiveTab('explore');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenPreferenceWizard={() => setIsWizardOpen(true)}
            hasPreferenceProfile={!!preferenceProfile}
          />
        )}

        {activeTab === 'explore' && (
          <CostumeExplorer
            initialGarmentId={selectedGarmentId}
            onNavigateToStudio={handleOpenGarmentInStudio}
          />
        )}

        {activeTab === 'studio' && (
          <StudioWorkspace
            initialGarmentId={selectedGarmentId}
            onSavedToLookbook={handleSaveOutfit}
            preferenceProfile={preferenceProfile}
            onOpenPreferenceWizard={() => setIsWizardOpen(true)}
            onClearPreferenceProfile={handleClearPreferenceProfile}
            editingOutfit={editingOutfit}
          />
        )}

        {activeTab === 'lookbook' && (
          <LookbookSection
            userSavedOutfits={userSavedOutfits}
            onNavigateToStudio={() => {
              setEditingOutfit(null);
              setActiveTab('studio');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onEditOutfit={handleEditOutfit}
            onDeleteOutfit={handleDeleteSavedOutfit}
          />
        )}

        {activeTab === 'culture' && <CulturalValues />}
      </main>

      {/* 5-Step Preference Profile Consultation Modal */}
      <PreferenceWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        initialProfile={preferenceProfile}
        onSaveProfile={handleSavePreferenceProfile}
      />

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
