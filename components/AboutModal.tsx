import React from 'react';
import { X, Mail, Smartphone, Globe } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors z-10 bg-white/50 rounded-full p-1"
        >
          <X size={24} />
        </button>

        <div className="flex flex-col items-center text-center p-8 pt-12">
          <div className="w-20 h-20 bg-black text-white rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-xl mb-6 transform rotate-3 border-4 border-gray-100">
            Win3
          </div>

          <h2 className="text-2xl font-black text-gray-900 mb-1">Win3</h2>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-6">Digital Studio</p>

          <p className="text-gray-600 leading-relaxed mb-8 text-sm">
            Tuto aplikaci jsme vyrobili s důrazem na design, efektivitu a spokojenost uživatelů.
            <br /><br />
            <strong>Líbí se vám?</strong>
            <br />
            Rádi pro vás vytvoříme podobné softwarové řešení nebo mobilní aplikaci na míru.
          </p>

          <div className="w-full space-y-3">
            <a 
              href="https://win3.cz" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-gray-800 transition-all active:scale-[0.98]"
            >
              <Globe size={18} />
              Navštívit Win3.cz
            </a>
            
            <a 
              href="mailto:info@win3.cz"
              className="flex items-center justify-center gap-3 w-full bg-gray-100 text-gray-900 py-3.5 rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-[0.98]"
            >
              <Mail size={18} />
              Napište nám
            </a>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100 w-full">
            <p className="text-[10px] text-gray-400">
              © {new Date().getFullYear()} Win3. Všechna práva vyhrazena.
              <br />Verze 2.1.0 Mobile
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};