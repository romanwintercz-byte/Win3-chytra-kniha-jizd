import React, { useState, useEffect } from 'react';
import { X, Share, MoreVertical, Monitor, Smartphone, Apple, Download } from 'lucide-react';
import { Haptics } from '../utils/haptics';

export const InstallGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ios' | 'android' | 'desktop'>('ios');

  useEffect(() => {
    // Zobrazit pouze pokud to uzivatel jeste nevidel
    const hasSeenGuide = localStorage.getItem('win3_install_guide_seen');
    if (!hasSeenGuide) {
      // Male zpozdeni, aby se aplikace stihla nacist a uzivatel se rozkoukal
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    Haptics.medium();
    localStorage.setItem('win3_install_guide_seen', 'true');
    setIsOpen(false);
  };

  // Detekce zarizeni pro vychozi tab (jednoducha heuristika)
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('iphone') || ua.includes('ipad')) {
      setActiveTab('ios');
    } else if (ua.includes('android')) {
      setActiveTab('android');
    } else {
      setActiveTab('desktop');
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
        
        <div className="p-6 pb-0">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h2 className="text-xl font-black text-gray-900">Rychlejší přístup</h2>
              <p className="text-sm text-gray-500 mt-1">Přidejte si aplikaci na plochu mobilu a používejte ji jako nativní aplikaci.</p>
            </div>
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-900 bg-gray-50 p-2 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 mt-4 px-6 overflow-x-auto no-scrollbar gap-4">
          <button
            onClick={() => { Haptics.light(); setActiveTab('ios'); }}
            className={`pb-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'ios' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
          >
            <Apple size={16} /> Apple iOS
          </button>
          <button
            onClick={() => { Haptics.light(); setActiveTab('android'); }}
            className={`pb-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'android' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
          >
            <Smartphone size={16} /> Android
          </button>
          <button
            onClick={() => { Haptics.light(); setActiveTab('desktop'); }}
            className={`pb-3 text-sm font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === 'desktop' ? 'border-black text-black' : 'border-transparent text-gray-400'}`}
          >
            <Monitor size={16} /> Počítač
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-gray-50/50 flex-grow overflow-y-auto">
          
          {activeTab === 'ios' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <Share size={18} />
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">1. Klikněte na <span className="font-bold">Sdílet</span></p>
                  <p className="text-xs text-gray-500">V dolní liště prohlížeče Safari najděte čtvereček se šipkou.</p>
                </div>
              </div>
              <div className="w-px h-4 bg-gray-200 ml-4"></div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 font-bold text-xs">
                  +
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">2. Vyberte <span className="font-bold">Přidat na plochu</span></p>
                  <p className="text-xs text-gray-500">Sjeďte v nabídce trochu níže a klikněte na tuto možnost.</p>
                </div>
              </div>
              <div className="w-px h-4 bg-gray-200 ml-4"></div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center flex-shrink-0 mt-1 font-bold text-xs">
                  OK
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">3. Potvrďte tlačítkem <span className="font-bold">Přidat</span></p>
                  <p className="text-xs text-gray-500">Aplikace se objeví mezi vašimi ikonami.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'android' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <MoreVertical size={18} />
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">1. Klikněte na <span className="font-bold">Menu</span></p>
                  <p className="text-xs text-gray-500">Tři tečky v pravém horním rohu prohlížeče Chrome.</p>
                </div>
              </div>
              <div className="w-px h-4 bg-gray-200 ml-4"></div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gray-200 text-gray-700 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                   <Download size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">2. Zvolte <span className="font-bold">Instalovat aplikaci</span></p>
                  <p className="text-xs text-gray-500">Případně "Přidat na plochu" u starších verzí.</p>
                </div>
              </div>
              <div className="w-px h-4 bg-gray-200 ml-4"></div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center flex-shrink-0 mt-1 font-bold text-xs">
                  OK
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">3. Potvrďte instalaci</p>
                  <p className="text-xs text-gray-500">Aplikace se nainstaluje do vašeho telefonu.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'desktop' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                <p className="text-sm text-blue-800 font-medium">Tip pro Windows/Mac</p>
                <p className="text-xs text-blue-600 mt-1">
                  V prohlížeči Chrome nebo Edge uvidíte v pravé části adresního řádku malou ikonku monitoru se šipkou dolů. Kliknutím na ni aplikaci nainstalujete.
                </p>
              </div>
              <div className="flex justify-center">
                 <Monitor size={64} className="text-gray-200" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleClose}
            className="w-full bg-black text-white py-3 rounded-xl font-bold shadow-lg active:scale-[0.98] transition-transform"
          >
            Rozumím, díky
          </button>
        </div>

      </div>
    </div>
  );
};