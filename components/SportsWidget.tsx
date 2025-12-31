
import React from 'react';

const SportsWidget: React.FC = () => {
  return (
    <div className="bg-white border-2 border-orange-500/20 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden text-slate-900">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <svg className="w-40 h-40" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-orange-500 text-white p-4 rounded-2xl shadow-lg shadow-orange-500/30 animate-pulse">⚡</div>
          <div>
            <h2 className="text-4xl font-black italic tracking-tighter">RENDIMIENTO</h2>
            <p className="text-green-600 font-bold uppercase tracking-widest text-xs">Cuerpo activo, mente clara</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl text-center">
            <span className="text-4xl font-black text-orange-600 block">45'</span>
            <span className="text-[10px] font-black uppercase opacity-40">Cardio hoy</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl text-center">
            <span className="text-4xl font-black text-green-600 block">1200</span>
            <span className="text-[10px] font-black uppercase opacity-40">Calorías meta</span>
          </div>
          <div className="bg-orange-500 text-white p-6 rounded-3xl text-center shadow-lg shadow-orange-500/20">
             <span className="text-4xl font-black block">85%</span>
             <span className="text-[10px] font-black uppercase opacity-80">Hidratación</span>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
           <button className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-slate-800 transition-all">Iniciar Cronómetro</button>
           <button className="flex-1 py-4 bg-green-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-green-600 transition-all">Registrar Serie</button>
        </div>
      </div>
    </div>
  );
};

export default SportsWidget;
