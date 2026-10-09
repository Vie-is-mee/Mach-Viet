/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NavigationTab } from './types';
import { Navbar } from './components/Navbar';
import { HeroHome } from './components/HeroHome';
import { CostumeExplorer } from './components/CostumeExplorer';
import { StudioWorkspace } from './components/StudioWorkspace';
import { LookbookSection } from './components/LookbookSection';
import { CulturalValues } from './components/CulturalValues';
import { Footer } from './components/Footer';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [selectedGarmentId, setSelectedGarmentId] = useState<string | null>(null);
  const [userSavedOutfits, setUserSavedOutfits] = useState<string[]>([]);

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

  const handleSaveOutfit = (outfitTitle: string) => {
    setUserSavedOutfits((prev) => [outfitTitle, ...prev]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#241E1C]">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} onSelectTab={handleNavigate} />

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
          />
        )}

        {activeTab === 'lookbook' && (
          <LookbookSection
            userSavedOutfits={userSavedOutfits}
            onNavigateToStudio={() => {
              setActiveTab('studio');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeTab === 'culture' && <CulturalValues />}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
