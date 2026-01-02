import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { WorkConfig } from '../constants';
import { WeatherData } from '../utils/weatherService';

interface AIChatWidgetProps {
  workConfig: WorkConfig;
  dailyStats: {
    percentage: number;
    statusText: string;
  };
  now: Date;
  vacationDate: Date;
  weather: WeatherData | null;
  title?: string;
  isRestMode: boolean; // Received from App
  isDarkMode?: boolean;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AIChatWidget: React.FC<AIChatWidgetProps> = ({ workConfig, dailyStats, now, vacationDate, weather, title = "Chatbot", isRestMode, isDarkMode }) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
        try {
            const saved = localStorage.getItem('gemini_chat_history');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }
    return [];
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const isDark = isRestMode || isDarkMode;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  useEffect(() => {
    localStorage.setItem('gemini_chat_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem('gemini_chat_history');
  };

  const getSystemContext = () => {
    return `
      Eres un compañero inteligente integrado en el dashboard "TIEMPON'T".
      ESTADO ACTUAL DEL USUARIO:
      - Hora: ${now.toLocaleTimeString()} (${isRestMode ? 'Tiempo Libre' : 'Horario Laboral'}).
      - Progreso del día: ${dailyStats.percentage.toFixed(0)}%.
      - Clima: ${weather ? weather.temperature + '°C' : 'Desconocido'}.
      TU PERSONALIDAD: Versátil, Conversacional, Asistente Profundo. Responde conciso.
    `;
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
            ...messages.slice(-10).map(m => ({ role: m.role, parts: [{ text: m.text }] })), 
            { role: 'user', parts: [{ text: userMsg }] }
        ],
        config: { systemInstruction: getSystemContext() }
      });
      const text = response.text;
      if (text) setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Error de conexión." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`backdrop-blur-xl rounded-3xl shadow-xl border h-[500px] flex flex-col overflow-hidden relative group transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${isRestMode 
        ? 'bg-slate-900/80 border-slate-700/50 ring-1 ring-white/10' 
        : (isDarkMode 
            ? 'bg-slate-800/90 border-slate-700 ring-1 ring-white/5'
            : 'bg-white/90 ring-1 ring-slate-900/5 border-white')
    }`}>
       <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-white/50'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            </div>
            <div>
                <h3 className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Gemini 3 Pro</p>
            </div>
          </div>
          <button onClick={clearHistory} className="text-slate-400 hover:text-red-500 transition-colors p-2" title="Borrar historial">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
       </div>

       <div className={`flex-1 overflow-y-auto p-4 space-y-6 ${isDark ? 'bg-slate-950/30' : 'bg-slate-50/50'}`} ref={scrollRef}>
          {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 opacity-60">
                  <span className="text-4xl mb-2">💬</span>
                  <p className="text-sm font-medium">¿En qué piensas? Hablemos.</p>
              </div>
          )}
          {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-5 py-3 text-sm shadow-sm leading-relaxed relative ${
                      m.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-none' 
                      : (isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-white text-slate-700 border-slate-200') + ' rounded-2xl rounded-tl-none border shadow-sm'
                  }`}>
                      {m.text}
                  </div>
              </div>
          ))}
          {isLoading && <div className="flex justify-start"><div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div></div>}
       </div>

       <div className={`p-4 border-t relative ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <form onSubmit={handleSend} className="relative flex items-center gap-2">
              <input 
                type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe un mensaje..."
                className={`w-full border-none rounded-xl py-3 pl-4 pr-12 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner ${isDark ? 'bg-slate-950 text-white focus:bg-slate-900' : 'bg-slate-100 text-slate-800 hover:bg-slate-50 focus:bg-white'}`}
              />
              <button type="submit" disabled={isLoading || !input.trim()} className="absolute right-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
              </button>
          </form>
       </div>
    </div>
  );
};

export default AIChatWidget;