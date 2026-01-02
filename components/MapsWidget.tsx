
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { WorkConfig } from '../constants';
import { LocationConfig } from '../types/models';

interface MapsWidgetProps {
  title?: string;
  workConfig: WorkConfig;
  locationConfig?: LocationConfig;
  isRestMode: boolean;
  isDarkMode?: boolean;
}

interface PlaceResult {
  title: string;
  uri: string;
}

const MapsWidget: React.FC<MapsWidgetProps> = ({ title = "Ruta de Salida", workConfig, locationConfig, isRestMode, isDarkMode }) => {
  const [query, setQuery] = useState('');
  const [resultsText, setResultsText] = useState<string>('');
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for the visual map source
  const [mapSrc, setMapSrc] = useState<string>('');

  const isDark = isRestMode || isDarkMode;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  useEffect(() => {
      // Set initial map based on location config
      let q = '';
      if (locationConfig?.type === 'gps' && locationConfig.lat) {
          q = `${locationConfig.lat},${locationConfig.lon}`;
      } else if (locationConfig?.type === 'manual' && locationConfig.city) {
          q = locationConfig.city;
      }
      
      if (q) {
          setMapSrc(`https://maps.google.com/maps?q=${encodeURIComponent(q)}&t=&z=13&ie=UTF8&iwloc=&output=embed`);
      }
  }, [locationConfig]);

  const getLocationLabel = () => {
     if (locationConfig?.type === 'gps') return 'GPS Activo';
     if (locationConfig?.type === 'manual' && locationConfig.city) return locationConfig.city;
     return 'Ubicación Desconocida';
  }

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setResultsText('');
    setPlaces([]);
    setError(null);

    // Update Map Iframe to show search results visually
    setMapSrc(`https://maps.google.com/maps?q=${encodeURIComponent(query + ' ' + (locationConfig?.city || ''))}&t=&z=13&ie=UTF8&iwloc=&output=embed`);

    try {
      const locationContext = locationConfig?.city || 'mi ubicación actual';
      
      const prompt = `
        El usuario sale de trabajar a las ${workConfig.endHour}:00 horas.
        Busca "${query}" en o cerca de ${locationContext}.
        Filtra OBLIGATORIAMENTE lugares que estén abiertos después de las ${workConfig.endHour}:00 horas hoy.
        Dame una respuesta útil y breve resumiendo las opciones.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleMaps: {} }],
        }
      });

      if (response.text) {
          setResultsText(response.text);
      }

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks && Array.isArray(chunks)) {
          const extractedPlaces: PlaceResult[] = [];
          chunks.forEach((chunk: any) => {
              if (chunk.web && chunk.web.uri && chunk.web.title) {
                  extractedPlaces.push({
                      title: chunk.web.title,
                      uri: chunk.web.uri
                  });
              }
          });
          setPlaces(extractedPlaces);
      }
      
    } catch (err) {
      console.error(err);
      setError("No pudimos conectar con Gemini. Pero el mapa visual debería funcionar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`backdrop-blur-xl rounded-3xl shadow-xl border h-full min-h-[500px] flex flex-col overflow-hidden transition-all duration-300 ${isRestMode 
        ? 'bg-slate-900/80 border-slate-700/50 ring-1 ring-white/10' 
        : (isDarkMode 
            ? 'bg-slate-800/90 border-slate-700 ring-1 ring-white/5'
            : 'bg-white/90 ring-1 ring-slate-900/5 border-white')
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b shrink-0 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-white/50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
                🗺️
            </div>
            <div>
                <h3 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider truncate max-w-[150px]">
                    {getLocationLabel()}
                </p>
            </div>
          </div>
          <div className={`text-[10px] px-2 py-1 rounded-lg font-bold ${isDark ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-50 text-indigo-600'}`}>
              Salida: {workConfig.endHour}:00hs
          </div>
      </div>

      {/* Body Container */}
      <div className="flex-1 flex flex-col relative">
          
          {/* Map Area (Visual) */}
          <div className="h-[40%] min-h-[200px] w-full relative bg-slate-100 border-b border-slate-200/50">
             {mapSrc ? (
                 <iframe 
                    width="100%" 
                    height="100%" 
                    src={mapSrc} 
                    style={{ border: 0 }} 
                    loading="lazy"
                    title="Google Maps"
                    className="opacity-90 hover:opacity-100 transition-opacity"
                 ></iframe>
             ) : (
                 <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs uppercase font-bold">Sin ubicación definida</div>
             )}
             {/* Gradient overlay for blending */}
             <div className={`absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t ${isDark ? 'from-slate-900/90' : 'from-white/90'} to-transparent pointer-events-none`}></div>
          </div>

          {/* Search & Results Area */}
          <div className={`flex-1 flex flex-col p-6 overflow-hidden ${isDark ? 'bg-slate-950/30' : 'bg-slate-50/50'}`}>
              
              <form onSubmit={handleSearch} className="mb-4 relative shrink-0">
                  <input 
                      type="text" 
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Buscar lugares abiertos..."
                      className={`w-full py-3 pl-4 pr-12 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm ${isDark ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'}`}
                  />
                  <button 
                    type="submit"
                    disabled={isLoading}
                    className={`absolute right-2 top-2 bottom-2 px-3 rounded-lg flex items-center justify-center transition-colors ${isLoading ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
                  >
                      {isLoading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                      )}
                  </button>
              </form>

              {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold mb-4 shrink-0">
                      {error}
                  </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                  {!resultsText && !isLoading && !error && places.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60 py-4">
                          <p className="text-xs font-medium text-center">Escribe qué necesitas y te diré qué está abierto al salir.</p>
                      </div>
                  )}

                  {resultsText && (
                      <div className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-line shadow-sm border ${isDark ? 'bg-slate-800/50 text-slate-300 border-slate-700' : 'bg-white text-slate-600 border-slate-100'}`}>
                          {resultsText}
                      </div>
                  )}

                  {places.length > 0 && (
                      <div className="grid grid-cols-1 gap-2">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Enlaces Directos</h4>
                          {places.map((place, idx) => (
                              <a 
                                key={idx} 
                                href={place.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all group ${isDark ? 'bg-slate-900 border-slate-800 hover:border-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md'}`}
                              >
                                  <div className="flex items-center gap-3 overflow-hidden">
                                      <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                          {idx + 1}
                                      </div>
                                      <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>{place.title}</span>
                                  </div>
                                  <span className="text-indigo-500 transform group-hover:translate-x-1 transition-transform">↗</span>
                              </a>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default MapsWidget;
