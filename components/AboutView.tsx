import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const AboutView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md w-full">
        
        {/* Win3 Logo Placeholder */}
        <div className="mb-8 relative inline-block group">
          <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full"></div>
          <div className="relative bg-black text-white w-24 h-24 flex items-center justify-center rounded-2xl shadow-xl mx-auto transform group-hover:scale-105 transition-transform duration-300">
            <span className="text-3xl font-bold tracking-tighter font-mono">Win3</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-1">Chytrá kniha jízd</h2>
        <p className="text-sm text-gray-400 font-mono mb-6">Verze: 1.1.0</p>
        
        <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mx-auto mb-6"></div>

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