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
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AIChatWidget: React.FC<AIChatWidgetProps> = ({ workConfig, dailyStats, now, vacationDate, weather }) => {
  // Load initial state from localStorage if available
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
        try {
            const saved = localStorage.getItem('chat_history');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load chat history", e);
            return [];
        }
    }
    return [];
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize AI client
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Save to localStorage whenever messages change
  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const getSystemContext = () => {
    // Gather data from LocalStorage for TrackerWidget context
    const coffees = localStorage.getItem('tracker_coffees') || '0';
    const water = localStorage.getItem('tracker_water') || '0';
    const poops = localStorage.getItem('tracker_poops') || '0';
    const tasks = JSON.parse(localStorage.getItem('tracker_tasks') || '[]');
    const pendingTasks = tasks.filter((t: any) => !t.completed).map((t: any) => t.text).join(', ');

    // Calculate vacation based on dynamic prop
    const daysToVacation = Math.ceil((vacationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Weather Context
    let weatherCtx = "No disponible";
    if (weather) {
        weatherCtx = `${weather.temperature}°C, ${weather.weatherLabel} (${weather.recommendation.title}: ${weather.recommendation.activity})`;
    }

    return `
      Eres el asistente IA del dashboard "TIEMPON'T".
      
      Datos actuales del usuario:
      - Hora actual: ${now.toLocaleTimeString('es-AR')}
      - Fecha: ${now.toLocaleDateString('es-AR')}
      - Configuración laboral: ${workConfig.startHour}:00 a ${workConfig.endHour}:00
      - Progreso del día laboral: ${dailyStats.percentage.toFixed(1)}% (${dailyStats.statusText})
      - Días para vacaciones: ${daysToVacation} (Fecha objetivo: ${vacationDate.toLocaleDateString('es-AR')})
      - Clima actual: ${weatherCtx}
      
      Signos vitales (hoy):
      - Cafés: ${coffees}
      - Agua: ${water}
      - Idas al baño: ${poops}
      
      Tareas pendientes (Checklist): ${pendingTasks || 'Ninguna'}
      
      Instrucciones:
      - Responde de manera concisa y extremadamente rápida.
      - Usa un tono con humor sarcástico, existencialista o motivacional (estilo "Work-Life Balance").
      - Si el usuario pregunta "qué debo hacer", básate en el progreso del día, el clima y las tareas.
      - Usa emojis para dar vida a la respuesta.
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
      const systemInstruction = getSystemContext();
      
      // Using the specific requested model for low latency
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: [
            ...messages.slice(-10).map(m => ({ // Keep last 10 messages for context window efficiency
                role: m.role,
                parts: [{ text: m.text }]
            })),
            { role: 'user', parts: [{ text: userMsg }] }
        ],
        config: {
          systemInstruction: systemInstruction,
        }
      });

      const text = response.text;
      if (text) {
        setMessages(prev => [...prev, { role: 'model', text }]);
      }
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "😵 Error de conexión con la Matrix. Intenta de nuevo." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem('chat_history');
  };

  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl shadow-slate-200/50 p-6 border border-white h-[400px] flex flex-col transition-all hover:border-indigo-200">
       <style>{`
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideInLeft {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          .msg-user { animation: slideInRight 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
          .msg-model { animation: slideInLeft 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
       `}</style>

       <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg shadow-md animate-pulse">
                ✨
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-800">TIEMPON'T AI</h3>
                <p className="text-[10px] text-slate-500 font-medium">Asistente de Productividad (Beta)</p>
            </div>
          </div>
          {messages.length > 0 && (
            <button 
                onClick={clearHistory}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                title="Borrar historial"
            >
                🗑️
            </button>
          )}
       </div>

       <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-200 min-h-0" ref={scrollRef}>
          {messages.length === 0 && (
              <div className="text-center text-slate-400 text-sm mt-12 flex flex-col items-center gap-2">
                  <span className="text-4xl">🤖</span>
                  <p className="max-w-[200px]">Pregunta sobre tu progreso, tus cafés, el clima o cuánto falta para huir.</p>
              </div>
          )}
          {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`
                      max-w-[85%] px-4 py-2.5 text-sm shadow-sm leading-relaxed relative
                      ${m.role === 'user' 
                          ? 'msg-user bg-blue-600 text-white rounded-2xl rounded-tr-none' 
                          : 'msg-model bg-gray-100 text-gray-800 rounded-2xl rounded-tl-none'
                      }
                  `}>
                      {m.text}
                      {/* Tail CSS simulation */}
                      <div className={`absolute top-0 w-0 h-0 border-solid 
                          ${m.role === 'user' 
                            ? 'right-[-8px] border-t-[0px] border-r-[0px] border-b-[10px] border-l-[10px] border-l-blue-600 border-t-transparent border-r-transparent border-b-transparent' 
                            : 'left-[-8px] border-t-[0px] border-l-[0px] border-b-[10px] border-r-[10px] border-r-gray-100 border-t-transparent border-l-transparent border-b-transparent'
                          }`}
                      ></div>
                  </div>
              </div>
          ))}
          {isLoading && (
              <div className="flex justify-start msg-model">
                  <div className="bg-gray-100 border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex gap-1 items-center h-10">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                  </div>
              </div>
          )}
       </div>

       <form onSubmit={handleSend} className="relative shrink-0">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu consulta..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors shadow-sm"
          >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
             </svg>
          </button>
       </form>
    </div>
  );
};

export default AIChatWidget;