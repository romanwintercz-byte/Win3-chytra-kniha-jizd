import React from 'react';
import { BookOpen, Sparkles, Camera, Bookmark, Share, Menu, Download, RefreshCw, Lock, Car, User, HelpCircle, ArrowLeft, Smartphone, Printer } from 'lucide-react';

interface HelpViewProps {
  onBack: () => void;
}

export const HelpView: React.FC<HelpViewProps> = ({ onBack }) => {
  return (
    <div className="animate-fade-in pb-20">
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Nápověda</h1>
          <p className="text-sm text-gray-500">Uživatelská příručka k aplikaci</p>
        </div>
      </div>

      <div className="space-y-8 max-w-3xl mx-auto">
        
        {/* Section 1: Intro */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="bg-black text-white p-1.5 rounded-lg"><BookOpen size={18} /></div>
            1. Instalace a první spuštění
          </h2>
          <div className="space-y-4 text-sm text-gray-600">
            <p>Aplikace funguje jako tzv. PWA. Nemusíte ji hledat v App Store, instaluje se přímo z prohlížeče.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Smartphone size={16} /> iPhone (iOS)
                </h3>
                <ol className="list-decimal pl-4 space-y-1.5">
                  <li>Otevřete v <strong>Safari</strong>.</li>
                  <li>Klikněte na ikonu <strong>Sdílet</strong> <Share size={12} className="inline" />.</li>
                  <li>Zvolte <strong>"Přidat na plochu"</strong>.</li>
                </ol>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Smartphone size={16} /> Android
                </h3>
                <ol className="list-decimal pl-4 space-y-1.5">
                  <li>Otevřete v <strong>Chrome</strong>.</li>
                  <li>Klikněte na <strong>Menu</strong> (tři tečky).</li>
                  <li>Zvolte <strong>"Instalovat aplikaci"</strong>.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Drivers */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg"><Car size={18} /></div>
            2. Pro Řidiče: Jak zapisovat jízdy
          </h2>
          
          <div className="space-y-6">
            
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">A. AI Asistent (Hlasové zadávání)</h3>
                <p className="text-sm text-gray-600 mt-1">
                  V nové jízdě přepněte na <strong>AI Asistent</strong>. Klikněte na mikrofon a řekněte např: 
                  <em> "Včera služebně Praha a zpět, ujeto 230 km, auto Superb."</em> AI vše vyplní za vás.
                </p>
                <div className="mt-2 bg-blue-50 p-2 rounded-lg text-xs text-blue-800 border border-blue-100 inline-block">
                  <strong>💡 Tip pro iPhone:</strong> Klikněte do textového pole a použijte mikrofon na klávesnici.
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                <Camera size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">B. Skenování účtenek</h3>
                <p className="text-sm text-gray-600 mt-1">
                  V nové jízdě klikněte na ikonu <strong>Fotoaparátu</strong>. Vyfoťte účtenku za palivo a aplikace sama přečte datum, litry i cenu.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                <Bookmark size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">C. Šablony (Oblíbené)</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Při ukládání jízdy zaškrtněte <strong>"Uložit do oblíbených"</strong>. Příště jízdu vyplníte jedním kliknutím přes ikonu záložky.
                </p>
              </div>
            </div>

            <div className="flex gap-4 border-t border-gray-100 pt-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <RefreshCw size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">D. Automatická návaznost tachometru</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Aplikace si pamatuje poslední stav tachometru u každého auta. 
                  Při zadávání nové jízdy se <strong>automaticky předvyplní startovní stav</strong>.
                  Pokud zadáte hodnotu, která nenavazuje, aplikace vás upozorní červeným rámečkem.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Section 3: Managers */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="bg-purple-600 text-white p-1.5 rounded-lg"><User size={18} /></div>
            3. Pro Správce a Účetní
          </h2>
          
          <div className="grid grid-cols-1 gap-4">
             <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
               <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-1"><Printer size={16} /> Měsíční reporty</h3>
               <p className="text-xs text-gray-600">
                 V sekci <strong>Reporty</strong> vyberte měsíc a řidiče. Můžete tisknout do PDF nebo exportovat do Excelu (CSV).
               </p>
             </div>

             <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
               <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-1"><Lock size={16} /> Účetní uzávěrka</h3>
               <p className="text-xs text-gray-600">
                 V Nastavení nastavte "Datum uzávěrky". Jízdy před tímto datem se zamknou a řidiči je nebudou moci měnit.
               </p>
             </div>

             <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
               <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-1"><Download size={16} /> Zálohování</h3>
               <p className="text-xs text-gray-600">
                 Data jsou uložena v prohlížeči. Pro přenos dat k účetní využijte v Nastavení funkci <strong>Export pro účetní</strong> (pošle JSON soubor emailem).
               </p>
             </div>
          </div>
        </div>

        {/* Section 4: FAQ */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="bg-gray-800 text-white p-1.5 rounded-lg"><HelpCircle size={18} /></div>
            4. Časté dotazy
          </h2>
          <div className="space-y-4">
            <div>
               <p className="text-sm font-bold text-gray-900">❓ Zmizela mi data!</p>
               <p className="text-xs text-gray-600 mt-1">
                 Pokud smažete historii prohlížeče (cookies/data), zmizí i data aplikace. Pravidelně stahujte zálohu v Nastavení!
               </p>
            </div>
            <div>
               <p className="text-sm font-bold text-gray-900">❓ Nesedí mi kilometry.</p>
               <p className="text-xs text-gray-600 mt-1">
                 Zkontrolujte, zda jste omylem nepřeskočili jízdu nebo nezadali špatný konečný stav u předchozí cesty. V seznamu jízd můžete staré záznamy opravit (pokud nejsou uzamčené).
               </p>
            </div>
          </div>
        </div>

        <div className="text-center pt-8">
          <button 
            onClick={onBack}
            className="bg-black text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-all"
          >
            Zpět do nastavení
          </button>
        </div>

      </div>
    </div>
  );
};