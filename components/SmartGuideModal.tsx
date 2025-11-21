import React, { useState } from 'react';
import { X, Mic, Camera, Bookmark, Smartphone, Lock, Download, Filter, Briefcase, Car, Database, Lightbulb, ChevronRight } from 'lucide-react';
import { Haptics } from '../utils/haptics';

interface SmartGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type GuideTab = 'driver' | 'accountant' | 'manager';

export const SmartGuideModal: React.FC<SmartGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('driver');

  if (!isOpen) return null;

  const renderFeatureItem = (icon: React.ReactNode, title: string, text: string, colorClass: string) => (
    <div className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{text}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm md:p-4 animate-fade-in">
      <div className="bg-gray-50 w-full h-[95dvh] md:h-auto md:max-h-[85vh] md:max-w-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col rounded-t-3xl">
        
        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400 p-2 rounded-lg text-white shadow-sm">
              <Lightbulb size={20} fill="currentColor" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900 leading-none">Chytré tipy</h2>
              <p className="text-xs text-gray-500 font-medium mt-1">Jak používat aplikaci na 100%</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 bg-gray-50 p-2 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 bg-white border-b border-gray-100 gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
          <button
            onClick={() => { Haptics.light(); setActiveTab('driver'); }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'driver' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Pro Řidiče
          </button>
          <button
            onClick={() => { Haptics.light(); setActiveTab('accountant'); }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'accountant' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Pro Účetní
          </button>
          <button
            onClick={() => { Haptics.light(); setActiveTab('manager'); }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'manager' ? 'bg-black text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Pro Manažery
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
          
          {activeTab === 'driver' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-4">
                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
                  Motto
                </span>
                <h3 className="text-xl font-bold text-gray-900">"Mějte hotovo za 10 vteřin"</h3>
              </div>

              <div className="grid gap-3">
                {renderFeatureItem(
                  <Mic size={20} />,
                  "Diktujte, nepište (AI Asistent)",
                  "Nebaví vás vyťukávat kilometry? Klikněte na 'AI Asistent', zmáčkněte mikrofon a prostě řekněte: 'Včera Praha a zpět, služebně, 150 km.' Umělá inteligence formulář vyplní za vás.",
                  "bg-blue-100 text-blue-600"
                )}
                
                {renderFeatureItem(
                  <Camera size={20} />,
                  "Účtenky bez přepisování (OCR)",
                  "Máte účtenku z benzínky? V nové jízdě klikněte na ikonu fotoaparátu. Aplikace sama přečte datum, litry i cenu. Žádné ruční zadávání.",
                  "bg-indigo-100 text-indigo-600"
                )}

                {renderFeatureItem(
                  <Bookmark size={20} />,
                  "Šablony pro časté trasy",
                  "Jezdíte pořád tu samou trasu? Uložte si ji jako šablonu (zaškrtávátko dole v nové jízdě). Příště ji vyplníte jedním kliknutím přes ikonu záložky.",
                  "bg-amber-100 text-amber-600"
                )}

                {renderFeatureItem(
                  <Smartphone size={20} />,
                  "Jako aplikace v mobilu",
                  "Neotevírejte pokaždé prohlížeč. Přidejte si nás na plochu (Sdílet -> Přidat na plochu) a aplikace bude fungovat jako nativní apka, i když jste offline.",
                  "bg-gray-200 text-gray-700"
                )}
              </div>
            </div>
          )}

          {activeTab === 'accountant' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-4">
                <span className="inline-block px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
                  Motto
                </span>
                <h3 className="text-xl font-bold text-gray-900">"Konec nahánění podkladů"</h3>
              </div>

              <div className="grid gap-3">
                {renderFeatureItem(
                  <Lock size={20} />,
                  "Uzávěrka období (Zámek)",
                  "Bojíte se, že vám řidiči zpětně změní data po odevzdání DPH? Nastavte v Nastavení datum uzávěrky. Všechny starší jízdy se zamknou a nepůjdou editovat.",
                  "bg-red-100 text-red-600"
                )}

                {renderFeatureItem(
                  <Download size={20} />,
                  "Exporty na jeden klik",
                  "Potřebujete podklady pro mzdy? V sekci Data si stáhněte CSV (Excel) pro konkrétního řidiče za vybraný měsíc. Soubor je formátovaný pro snadné zpracování.",
                  "bg-green-100 text-green-600"
                )}

                {renderFeatureItem(
                  <Filter size={20} />,
                  "Filtry a kontrola",
                  "Na Reportech si můžete vyfiltrovat konkrétní auto nebo řidiče a okamžitě vidíte poměr soukromých a služebních jízd i náklady na palivo.",
                  "bg-teal-100 text-teal-600"
                )}
              </div>
            </div>
          )}

          {activeTab === 'manager' && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center mb-4">
                <span className="inline-block px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
                  Motto
                </span>
                <h3 className="text-xl font-bold text-gray-900">"Přehled o flotile v kapse"</h3>
              </div>

              <div className="grid gap-3">
                {renderFeatureItem(
                  <Briefcase size={20} />,
                  "Náklady na projekty",
                  "Víte, kolik projedete na konkrétní zakázce? V Reportech vidíte přesný rozpad kilometrů podle projektů/zakázek. Ideální pro fakturaci klientům.",
                  "bg-purple-100 text-purple-600"
                )}

                {renderFeatureItem(
                  <Car size={20} />,
                  "Správa vozového parku",
                  "V Nastavení -> Zdroje máte přehled o všech autech. Můžete archivovat stará auta nebo neaktivní řidiče, aby se nepletli ve výběrech, ale historie zůstane zachována.",
                  "bg-orange-100 text-orange-600"
                )}

                {renderFeatureItem(
                  <Database size={20} />,
                  "Bezpečné zálohy",
                  "Všechna data jsou uložena ve vašem zařízení. Chcete jistotu? V Nastavení si stáhněte kompletní JSON zálohu celé firmy.",
                  "bg-gray-200 text-gray-700"
                )}
              </div>
            </div>
          )}
          
        </div>

        {/* Footer Action */}
        <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50">
          <button 
            onClick={onClose}
            className="w-full bg-black text-white py-3.5 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            Rozumím, jdu na to <ChevronRight size={18} />
          </button>
        </div>

      </div>
    </div>
  );
};