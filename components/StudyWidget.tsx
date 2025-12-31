
import React, { useState, useEffect } from 'react';

const StudyWidget: React.FC = () => {
  const [biblio, setBiblio] = useState(30);
  const [clases, setClases] = useState(5);
  const [totalClases] = useState(20);
  const [horasEstudio, setHorasEstudio] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('study_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      setBiblio(parsed.biblio || 30);
      setClases(parsed.clases || 5);
      setHorasEstudio(parsed.horas || 0);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('study_data', JSON.stringify({ biblio, clases, horas: horasEstudio }));
  }, [biblio, clases, horasEstudio]);

  return (
    <div className="bg-[#fcfaf2] border border-[#e5dfd3] rounded-3xl p-8 shadow-sm text-[#4a3728]">
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-[#4a3728] text-[#fcfaf2] p-3 rounded-2xl text-2xl">📖</div>
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight">Modo Concentración</h2>
          <p className="text-xs font-bold opacity-60">Sincronizado con tu progreso académico</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Bibliografía</span>
            <span className="text-xl font-black">{biblio}%</span>
          </div>
          <div className="h-4 bg-[#e5dfd3] rounded-full overflow-hidden">
            <div className="h-full bg-[#4a3728] transition-all duration-1000" style={{ width: `${biblio}%` }}></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setBiblio(Math.max(0, biblio - 5))} className="flex-1 py-1 bg-[#e5dfd3] rounded-lg text-xs font-bold">−5%</button>
            <button onClick={() => setBiblio(Math.min(100, biblio + 5))} className="flex-1 py-1 bg-[#4a3728] text-white rounded-lg text-xs font-bold">+5%</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Clases Vistas</span>
            <span className="text-xl font-black">{clases}/{totalClases}</span>
          </div>
          <div className="flex gap-1 h-4">
            {Array.from({ length: totalClases }).map((_, i) => (
              <div key={i} className={`flex-1 rounded-sm ${i < clases ? 'bg-[#4a3728]' : 'bg-[#e5dfd3]'}`}></div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setClases(Math.max(0, clases - 1))} className="flex-1 py-1 bg-[#e5dfd3] rounded-lg text-xs font-bold">−1</button>
            <button onClick={() => setClases(Math.min(totalClases, clases + 1))} className="flex-1 py-1 bg-[#4a3728] text-white rounded-lg text-xs font-bold">+1</button>
          </div>
        </div>

        <div className="bg-white/50 border border-[#e5dfd3] rounded-2xl p-4 text-center flex flex-col justify-center">
          <span className="text-3xl font-black mb-1">{horasEstudio}h</span>
          <span className="text-[10px] font-black uppercase opacity-60">Sesión de hoy</span>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setHorasEstudio(Math.max(0, horasEstudio - 0.5))} className="flex-1 bg-[#e5dfd3] rounded-lg py-1 text-xs font-bold">−</button>
            <button onClick={() => setHorasEstudio(horasEstudio + 0.5)} className="flex-1 bg-[#4a3728] text-white rounded-lg py-1 text-xs font-bold">+</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyWidget;
