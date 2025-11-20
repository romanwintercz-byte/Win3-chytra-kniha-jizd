import React, { useState } from 'react';
import { ShieldCheck, Smartphone, Monitor, Share, MoreVertical, Download, ChevronDown, ChevronUp, Menu } from 'lucide-react';

export const AboutView: React.FC = () => {
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center py-8 animate-fade-in px-4">
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center max-w-2xl w-full">
        
        {/* Branding Section */}
        <div className="mb-8 relative inline-block group">
          <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
          <div className="relative bg-black text-white w-24 h-24 flex items-center justify-center rounded-2xl shadow-xl mx-auto transform group-hover:scale-105 transition-transform duration-300">
            <span className="text-3xl font-bold tracking-tighter font-mono">Win3</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-1">Chytrá kniha jízd</h2>
        <p className="text-sm text-gray-400 font-mono mb-6">Verze: 1.1.0</p>
        
        <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto mb-8"></div>

        {/* Install Guide Toggle */}
        <button 
          onClick={() => setShowInstallGuide(!showInstallGuide)}
          className={`w-full mb-8 flex items-center justify-between p-4 rounded-xl border transition-all ${showInstallGuide ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-gray-50 border-gray-100 text-gray-700 hover:bg-gray-100'}`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${showInstallGuide ? 'bg-white' : 'bg-gray-200'}`}>
              <Download size={20} />
            </div>
            <div className="text-left">
              <div className="font-bold text-sm">Nainstalovat aplikaci</div>
              <div className="text-xs opacity-80">Jak přidat ikonu na plochu mobilu nebo PC</div>
            </div>
          </div>
          {showInstallGuide ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {/* Install Guide Content */}
        {showInstallGuide && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left animate-fade-in">
            
            {/* iOS Guide */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 mb-3 text-gray-900 font-bold text-sm">
                <Smartphone size={16} /> iOS (iPhone)
              </div>
              <ol className="text-xs text-gray-600 space-y-2 list-decimal pl-4">
                <li>Otevřete stránku v prohlížeči <strong>Safari</strong>.</li>
                <li>Klepněte na tlačítko <strong>Sdílet</strong> <span className="inline-flex align-middle bg-gray-200 p-0.5 rounded"><Share size={10} /></span> v dolní liště.</li>
                <li>Sjeďte dolů a vyberte <strong>Přidat na plochu</strong>.</li>
                <li>Potvrďte tlačítkem <strong>Přidat</strong>.</li>
              </ol>
            </div>

            {/* Android Guide */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 mb-3 text-gray-900 font-bold text-sm">
                <Smartphone size={16} /> Android
              </div>
              <ol className="text-xs text-gray-600 space-y-2 list-decimal pl-4">
                <li>Otevřete stránku v prohlížeči <strong>Chrome</strong>.</li>
                <li>Klepněte na <strong>Menu</strong> <span className="inline-flex align-middle bg-gray-200 p-0.5 rounded"><MoreVertical size={10} /></span> vpravo nahoře.</li>
                <li>Vyberte <strong>Instalovat aplikaci</strong> nebo <strong>Přidat na plochu</strong>.</li>
                <li>Postupujte dle pokynů na obrazovce.</li>
              </ol>
            </div>

            {/* PC Guide */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 mb-3 text-gray-900 font-bold text-sm">
                <Monitor size={16} /> Počítač
              </div>
              <ol className="text-xs text-gray-600 space-y-2 list-decimal pl-4">
                <li>Doporučujeme prohlížeč <strong>Chrome</strong> nebo <strong>Edge</strong>.</li>
                <li>V pravé části adresního řádku klikněte na ikonu <strong>Instalovat</strong> <span className="inline-flex align-middle bg-gray-200 p-0.5 rounded"><Download size={10} /></span>.</li>
                <li>Případně v menu prohlížeče zvolte <strong>Odeslat, uložit a sdílet</strong> → <strong>Vytvořit zástupce</strong>.</li>
              </ol>
            </div>

          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-gray-700 font-medium bg-gray-50 py-2 px-4 rounded-full inline-flex mx-auto mb-8">
          <ShieldCheck size={18} className="text-green-500" />
          Vytvořil a spravuje Win3.
        </div>

        <p className="text-xs text-gray-400 leading-relaxed">
          © {new Date().getFullYear()} Win3 Solutions.<br/>
          Všechna práva vyhrazena.
        </p>
      </div>
    </div>
  );
};