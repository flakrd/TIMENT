import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";

interface NanoBananaWidgetProps {
  title?: string;
  onSetBackground: (imageData: string) => void;
  isRestMode: boolean; // Received from App
  isDarkMode?: boolean;
}

interface SavedImage {
  id: string;
  data: string; // base64
  prompt: string;
  date: string;
}

const NanoBananaWidget: React.FC<NanoBananaWidgetProps> = ({ title = "Nano Banana Studio", onSetBackground, isRestMode, isDarkMode }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'gallery'>('create');
  const [prompt, setPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [gallery, setGallery] = useState<SavedImage[]>([]);
  
  const isDark = isRestMode || isDarkMode;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('nano_gallery');
    if (saved) { try { setGallery(JSON.parse(saved)); } catch(e) {} }
  }, []);

  useEffect(() => { localStorage.setItem('nano_gallery', JSON.stringify(gallery)); }, [gallery]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => { setPreviewUrl(ev.target?.result as string); setGeneratedImage(null); };
        reader.readAsDataURL(file);
    }
  };

  const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
    return { inlineData: { data: await base64EncodedDataPromise, mimeType: file.type } };
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setGeneratedImage(null);
    try {
        const parts: any[] = [];
        if (selectedFile) {
            const imagePart = await fileToGenerativePart(selectedFile);
            parts.push(imagePart);
            parts.push({ text: prompt });
        } else {
            parts.push({ text: prompt });
        }
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
        });
        if (response.candidates && response.candidates[0].content.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData) {
                    const base64Data = part.inlineData.data;
                    const mimeType = part.inlineData.mimeType || 'image/png';
                    setGeneratedImage(`data:${mimeType};base64,${base64Data}`);
                    break;
                }
            }
        }
    } catch (error) { alert("Error al generar imagen."); } finally { setIsLoading(false); }
  };

  const saveToGallery = () => {
      if (generatedImage) {
          const newImage: SavedImage = { id: Date.now().toString(), data: generatedImage, prompt: prompt, date: new Date().toLocaleDateString() };
          setGallery([newImage, ...gallery]);
          setGeneratedImage(null); setPrompt(''); setActiveTab('gallery');
      }
  };

  const deleteFromGallery = (id: string) => { setGallery(gallery.filter(img => img.id !== id)); };
  
  const setLogoPreset = () => { setPrompt("A modern, minimalist logo for an app called 'TIEMPON'T'. The design should feature an abstract representation of a clock or hourglass merging with a leaf or cloud, symbolizing the balance between productivity and nature. Use a flat vector style with a vibrant color palette of indigo, emerald green, and white. Clean lines, high contrast, app icon style."); };

  return (
    <div className={`backdrop-blur-xl rounded-3xl shadow-xl ring-1 border h-full min-h-[500px] flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${isRestMode 
        ? 'bg-slate-900/80 border-slate-700/50 ring-white/10' 
        : (isDarkMode 
            ? 'bg-slate-800/90 border-slate-700 ring-white/5'
            : 'bg-white/90 border-white ring-slate-900/5')
    }`}>
      <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-white/50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
                🍌
            </div>
            <div>
                <h3 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Gemini 2.5 Image</p>
            </div>
          </div>
          <div className={`flex p-1 rounded-xl ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
              <button onClick={() => setActiveTab('create')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'create' ? (isDark ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm') : 'text-slate-500 hover:text-slate-400'}`}>Crear</button>
              <button onClick={() => setActiveTab('gallery')} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'gallery' ? (isDark ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm') : 'text-slate-500 hover:text-slate-400'}`}>Galería</button>
          </div>
      </div>

      <div className={`flex-1 overflow-y-auto p-6 ${isDark ? 'bg-slate-950/30' : 'bg-slate-50/50'}`}>
          {activeTab === 'create' && (
              <div className="space-y-6">
                  <div className={`border-2 border-dashed rounded-2xl p-4 text-center transition-colors relative ${isDark ? 'border-slate-700 bg-slate-900/50 hover:border-indigo-500' : 'border-slate-300 bg-white/50 hover:border-indigo-400'}`}>
                      {previewUrl || generatedImage ? (
                          <div className="relative group">
                              <img src={generatedImage || previewUrl || ''} alt="Preview" className="w-full h-64 object-contain rounded-lg mx-auto bg-slate-100" />
                              {generatedImage && (
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                      <button onClick={saveToGallery} className="bg-white text-slate-900 font-bold px-4 py-2 rounded-xl shadow-lg transform hover:scale-105 transition-all flex items-center gap-2"><span>💾</span> Guardar</button>
                                  </div>
                              )}
                              <button onClick={() => { setPreviewUrl(null); setGeneratedImage(null); setSelectedFile(null); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600">✕</button>
                          </div>
                      ) : (
                          <div className="py-10 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                              <div className="text-4xl mb-2 opacity-50">🖼️</div>
                              <p className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Subir imagen base (Opcional)</p>
                          </div>
                      )}
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                  </div>
                  <div className="space-y-3">
                      <div className="flex justify-end"><button onClick={setLogoPreset} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-400 uppercase tracking-wide">✨ Preset: Logo</button></div>
                      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe tu imagen..." className={`w-full h-24 p-4 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none shadow-sm ${isDark ? 'bg-slate-900 border-slate-700 text-white' : 'border-slate-200 text-slate-800'}`} />
                      <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 ${isLoading ? 'bg-slate-200 text-slate-400' : 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900 transform active:scale-95'}`}>{isLoading ? 'Generando...' : '✨ Generar'}</button>
                  </div>
              </div>
          )}
          {activeTab === 'gallery' && (
              <div className="grid grid-cols-2 gap-4">
                  {gallery.map((img) => (
                      <div key={img.id} className={`relative group p-2 rounded-xl shadow-sm border ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}>
                          <div className="aspect-square rounded-lg overflow-hidden bg-slate-100 mb-2"><img src={img.data} alt="Saved" className="w-full h-full object-cover" /></div>
                          <div className="flex gap-1">
                             <button onClick={() => onSetBackground(img.data)} className="flex-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">Fondo</button>
                             <button onClick={() => deleteFromGallery(img.id)} className="bg-red-50 text-red-500 p-1.5 rounded-lg hover:bg-red-100 transition-colors">🗑️</button>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};

export default NanoBananaWidget;