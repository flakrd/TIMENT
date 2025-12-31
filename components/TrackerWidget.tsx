import React, { useState, useEffect } from 'react';

type TabType = 'vitals' | 'focus' | 'breaks';

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

const TrackerWidget: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('vitals');

  // --- VITALS STATE ---
  const [coffees, setCoffees] = useState(0);
  const [poops, setPoops] = useState(0);
  const [water, setWater] = useState(0);
  
  // Animation states
  const [coffeeBump, setCoffeeBump] = useState(false);
  const [poopBump, setPoopBump] = useState(false);
  const [waterBump, setWaterBump] = useState(false);

  // --- POMODORO STATE ---
  const [pomoTime, setPomoTime] = useState(25 * 60);
  const [isPomoRunning, setIsPomoRunning] = useState(false);
  const [pomoFinished, setPomoFinished] = useState(false); // New state for completion
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState("");

  // --- BREAKS STATE ---
  const [workInterval, setWorkInterval] = useState(120); // minutes (2 hours)
  const [breakDuration, setBreakDuration] = useState(15); // minutes
  const [startBreakTime, setStartBreakTime] = useState("09:00");

  // Load Data
  useEffect(() => {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('tracker_date');
    const isNewDay = savedDate !== today;

    if (isNewDay) {
        setCoffees(0);
        setPoops(0);
        setWater(0);
        // Tasks persist across days unless cleared manually, or you can clear them here
        localStorage.setItem('tracker_date', today);
    } else {
        setCoffees(parseInt(localStorage.getItem('tracker_coffees') || '0'));
        setPoops(parseInt(localStorage.getItem('tracker_poops') || '0'));
        setWater(parseInt(localStorage.getItem('tracker_water') || '0'));
    }

    // Load tasks regardless of day
    const savedTasks = localStorage.getItem('tracker_tasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));

    // Load break config
    const savedBreakConfig = localStorage.getItem('tracker_break_config');
    if (savedBreakConfig) {
        const config = JSON.parse(savedBreakConfig);
        setWorkInterval(config.work || 120);
        setBreakDuration(config.break || 15);
        setStartBreakTime(config.start || "09:00");
    }
  }, []);

  // Persist Data
  useEffect(() => {
    localStorage.setItem('tracker_coffees', coffees.toString());
    localStorage.setItem('tracker_poops', poops.toString());
    localStorage.setItem('tracker_water', water.toString());
    localStorage.setItem('tracker_tasks', JSON.stringify(tasks));
    localStorage.setItem('tracker_break_config', JSON.stringify({
        work: workInterval,
        break: breakDuration,
        start: startBreakTime
    }));
  }, [coffees, poops, water, tasks, workInterval, breakDuration, startBreakTime]);

  // --- SOUND EFFECT ---
  const playTimerSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // Simple pleasant "Ding"
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, ctx.currentTime + 0.1); // C6
      
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  // --- VITALS LOGIC ---
  const handleUpdate = (type: 'coffee' | 'poop' | 'water', delta: number) => {
    const triggerBump = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
        setter(true);
        setTimeout(() => setter(false), 300); // Matches animation duration
    };

    if (type === 'coffee') {
        const newVal = Math.max(0, coffees + delta);
        if (newVal !== coffees) {
            setCoffees(newVal);
            triggerBump(setCoffeeBump);
        }
    } else if (type === 'poop') {
        const newVal = Math.max(0, poops + delta);
        if (newVal !== poops) {
            setPoops(newVal);
            triggerBump(setPoopBump);
        }
    } else {
        const newVal = Math.max(0, water + delta);
        if (newVal !== water) {
            setWater(newVal);
            triggerBump(setWaterBump);
        }
    }
  };

  // --- POMODORO LOGIC ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPomoRunning && pomoTime > 0) {
      setPomoFinished(false);
      interval = setInterval(() => setPomoTime(t => t - 1), 1000);
    } else if (pomoTime === 0 && isPomoRunning) {
      // Timer just finished
      setIsPomoRunning(false);
      setPomoFinished(true);
      playTimerSound();
    }
    return () => clearInterval(interval);
  }, [isPomoRunning, pomoTime]);

  const togglePomo = () => {
      if (pomoFinished) {
          // If finished, reset and start
          setPomoFinished(false);
          setPomoTime(25 * 60);
          setIsPomoRunning(true);
      } else {
          setIsPomoRunning(!isPomoRunning);
      }
  };
  
  const resetPomo = () => {
      setIsPomoRunning(false);
      setPomoFinished(false);
      setPomoTime(25 * 60);
  };
  
  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      return `${m}:${s}`;
  };

  const addTask = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTaskText.trim()) return;
      setTasks([...tasks, { id: Date.now(), text: newTaskText, completed: false }]);
      setNewTaskText("");
  };

  const toggleTask = (id: number) => {
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: number) => {
      setTasks(tasks.filter(t => t.id !== id));
  };

  // --- BREAKS LOGIC ---
  const calculateBreaks = () => {
      const schedule = [];
      const [startH, startM] = startBreakTime.split(':').map(Number);
      let currentTime = new Date();
      currentTime.setHours(startH, startM, 0, 0);
      
      // Limit calculation to next 12 hours approx
      const endTime = new Date(currentTime);
      endTime.setHours(endTime.getHours() + 12);

      while (currentTime < endTime) {
          // Add work interval
          currentTime = new Date(currentTime.getTime() + workInterval * 60000);
          if (currentTime >= endTime) break;

          const breakStart = currentTime.toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'});
          
          // Add break duration
          currentTime = new Date(currentTime.getTime() + breakDuration * 60000);
          const breakEnd = currentTime.toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'});

          schedule.push({ start: breakStart, end: breakEnd });
      }
      return schedule;
  };

  const renderVitals = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 flex-1 overflow-y-auto pr-1">
         {/* Café Tracker */}
        <div className={`bg-amber-50 rounded-2xl p-3 border border-amber-100 flex items-center justify-between transition-colors duration-200 ${coffeeBump ? 'bg-amber-100 border-amber-300' : ''}`}>
            <div className="flex items-center gap-3">
                 <div className={`text-2xl filter drop-shadow-sm ${coffeeBump ? 'animate-pop' : ''}`}>☕</div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">Cafeína</span>
                    <span className="text-xs text-amber-600 font-medium">Energía líquida</span>
                 </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => handleUpdate('coffee', -1)} className="w-6 h-6 rounded-full bg-white text-amber-600 font-bold shadow-sm hover:bg-amber-100 active:scale-90 transition-transform">-</button>
                <span className={`text-lg font-black text-gray-800 w-6 text-center ${coffeeBump ? 'text-amber-600' : ''}`}>{coffees}</span>
                <button onClick={() => handleUpdate('coffee', 1)} className="w-6 h-6 rounded-full bg-amber-500 text-white font-bold shadow-md hover:bg-amber-600 active:scale-90 transition-transform">+</button>
            </div>
        </div>

         {/* Water Tracker (NEW) */}
         <div className={`bg-cyan-50 rounded-2xl p-3 border border-cyan-100 flex items-center justify-between transition-colors duration-200 ${waterBump ? 'bg-cyan-100 border-cyan-300' : ''}`}>
            <div className="flex items-center gap-3">
                 <div className={`text-2xl filter drop-shadow-sm ${waterBump ? 'animate-pop' : ''}`}>💧</div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-cyan-800 uppercase tracking-wide">Agua</span>
                    <span className="text-xs text-cyan-600 font-medium">Hidratación</span>
                 </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => handleUpdate('water', -1)} className="w-6 h-6 rounded-full bg-white text-cyan-600 font-bold shadow-sm hover:bg-cyan-100 active:scale-90 transition-transform">-</button>
                <span className={`text-lg font-black text-gray-800 w-6 text-center ${waterBump ? 'text-cyan-600' : ''}`}>{water}</span>
                <button onClick={() => handleUpdate('water', 1)} className="w-6 h-6 rounded-full bg-cyan-500 text-white font-bold shadow-md hover:bg-cyan-600 active:scale-90 transition-transform">+</button>
            </div>
        </div>

        {/* Caca Tracker */}
        <div className={`bg-stone-50 rounded-2xl p-3 border border-stone-100 flex items-center justify-between transition-colors duration-200 ${poopBump ? 'bg-stone-100 border-stone-300' : ''}`}>
            <div className="flex items-center gap-3">
                 <div className={`text-2xl filter drop-shadow-sm ${poopBump ? 'animate-pop' : ''}`}>💩</div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-stone-800 uppercase tracking-wide">Descargas</span>
                    <span className="text-xs text-stone-600 font-medium">Tiempo invertido en el baño</span>
                 </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => handleUpdate('poop', -1)} className="w-6 h-6 rounded-full bg-white text-stone-600 font-bold shadow-sm hover:bg-gray-100 active:scale-90 transition-transform">-</button>
                <span className={`text-lg font-black text-gray-800 w-6 text-center ${poopBump ? 'text-stone-600' : ''}`}>{poops}</span>
                <button onClick={() => handleUpdate('poop', 1)} className="w-6 h-6 rounded-full bg-stone-500 text-white font-bold shadow-md hover:bg-stone-600 active:scale-90 transition-transform">+</button>
            </div>
        </div>
        
        {/* Simple visualization of total */}
        <div className="pt-2 border-t border-slate-100 flex justify-center gap-1 flex-wrap">
             {Array.from({ length: Math.min(coffees, 5) }).map((_, i) => <span key={`c${i}`} className="text-[8px] animate-in zoom-in duration-300">☕</span>)}
             {Array.from({ length: Math.min(water, 5) }).map((_, i) => <span key={`w${i}`} className="text-[8px] animate-in zoom-in duration-300">💧</span>)}
             {Array.from({ length: Math.min(poops, 5) }).map((_, i) => <span key={`p${i}`} className="text-[8px] animate-in zoom-in duration-300">💩</span>)}
        </div>
    </div>
  );

  const renderPomodoro = () => (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col min-h-0">
          {/* Timer */}
          <div className={`rounded-2xl p-4 border text-center mb-4 shrink-0 transition-all duration-500 ${pomoFinished ? 'bg-green-50 border-green-200 animate-finish-flash' : 'bg-red-50 border-red-100'}`}>
              <div className={`text-4xl font-black font-mono tracking-wider mb-2 ${pomoFinished ? 'text-green-600' : 'text-red-600'}`}>
                  {pomoFinished ? "¡TIEMPO!" : formatTime(pomoTime)}
              </div>
              <div className="flex justify-center gap-2">
                  <button 
                    onClick={togglePomo}
                    className={`px-4 py-1 rounded-lg font-bold text-sm transition-colors ${
                        pomoFinished 
                            ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg' 
                            : isPomoRunning 
                                ? 'bg-red-200 text-red-800 hover:bg-red-300' 
                                : 'bg-red-500 text-white hover:bg-red-600 shadow-md'
                    }`}
                  >
                      {pomoFinished ? 'Nueva Ronda' : isPomoRunning ? 'Pausar' : 'Iniciar'}
                  </button>
                  <button 
                    onClick={resetPomo}
                    className="px-3 py-1 rounded-lg bg-white border border-red-200 text-red-500 font-bold text-sm hover:bg-red-50"
                  >
                      ↺
                  </button>
              </div>
          </div>

          {/* Checklist */}
          <div className="flex-1 flex flex-col min-h-0">
             <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2 shrink-0">Checklist de Tareas</h4>
             <form onSubmit={addTask} className="flex gap-2 mb-3 shrink-0">
                 <input 
                    type="text" 
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Nueva tarea..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-red-300"
                 />
                 <button type="submit" className="bg-slate-200 text-slate-600 px-2 rounded-lg hover:bg-slate-300">+</button>
             </form>
             
             <div className="flex-1 overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 min-h-0">
                 {tasks.length === 0 && <p className="text-xs text-slate-300 italic text-center py-2">Sin tareas pendientes</p>}
                 {tasks.map(task => (
                     <div key={task.id} className="flex items-center gap-2 group animate-in slide-in-from-left-2 duration-200">
                         <button 
                            onClick={() => toggleTask(task.id)}
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 bg-white'}`}
                         >
                             {task.completed && <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                         </button>
                         <span className={`text-sm flex-1 truncate transition-colors duration-300 ${task.completed ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-700'}`}>{task.text}</span>
                         <button onClick={() => deleteTask(task.id)} className="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                     </div>
                 ))}
             </div>
          </div>
      </div>
  );

  const renderBreaks = () => {
      const breaks = calculateBreaks();
      return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col min-h-0">
            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 mb-4 space-y-3 shrink-0">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-[9px] font-bold text-indigo-700 uppercase mb-1">Trabajo (min)</label>
                        <input 
                            type="number" 
                            value={workInterval}
                            onChange={(e) => setWorkInterval(Number(e.target.value))}
                            className="w-full text-xs p-1 rounded border border-indigo-200 bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-[9px] font-bold text-indigo-700 uppercase mb-1">Descanso (min)</label>
                        <input 
                            type="number" 
                            value={breakDuration}
                            onChange={(e) => setBreakDuration(Number(e.target.value))}
                            className="w-full text-xs p-1 rounded border border-indigo-200 bg-white"
                        />
                    </div>
                </div>
                <div>
                     <label className="block text-[9px] font-bold text-indigo-700 uppercase mb-1">Hora Inicio</label>
                     <input 
                        type="time" 
                        value={startBreakTime}
                        onChange={(e) => setStartBreakTime(e.target.value)}
                        className="w-full text-xs p-1 rounded border border-indigo-200 bg-white"
                     />
                </div>
            </div>

            <div className="space-y-2 flex-1 flex flex-col min-h-0">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide shrink-0">Próximos Descansos</h4>
                <div className="space-y-2 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-indigo-100 flex-1">
                    {breaks.map((b, i) => (
                        <div key={i} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 text-sm">
                            <span className="font-bold text-slate-700">{b.start}</span>
                            <span className="text-slate-400 text-xs">➜</span>
                            <span className="font-medium text-slate-500">{b.end}</span>
                            <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded ml-2">Break #{i+1}</span>
                        </div>
                    ))}
                    {breaks.length === 0 && <p className="text-xs text-slate-400 text-center">Configura el inicio para ver horarios</p>}
                </div>
            </div>
        </div>
      );
  };

  return (
    <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl shadow-slate-200/50 border border-white p-5 transform transition-all h-full max-h-[500px] flex flex-col">
      {/* Styles for Animations */}
      <style>{`
        @keyframes pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.5); }
          100% { transform: scale(1); }
        }
        .animate-pop {
          animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        @keyframes finish-flash {
            0%, 100% { background-color: #f0fdf4; border-color: #bbf7d0; box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
            50% { background-color: #dcfce7; border-color: #86efac; box-shadow: 0 0 10px 0 rgba(74, 222, 128, 0.4); }
        }
        .animate-finish-flash {
            animation: finish-flash 1.5s ease-in-out infinite;
        }
      `}</style>

      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 shrink-0">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <span>🛠️</span> Control
          </h3>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button 
                onClick={() => setActiveTab('vitals')}
                className={`p-1.5 rounded-md text-xs transition-all ${activeTab === 'vitals' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                title="Signos Vitales"
              >
                  📊
              </button>
              <button 
                onClick={() => setActiveTab('focus')}
                className={`p-1.5 rounded-md text-xs transition-all ${activeTab === 'focus' ? 'bg-white shadow text-red-500 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                title="Enfoque y Tareas"
              >
                  🍅
              </button>
              <button 
                onClick={() => setActiveTab('breaks')}
                className={`p-1.5 rounded-md text-xs transition-all ${activeTab === 'breaks' ? 'bg-white shadow text-indigo-600 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                title="Calculadora Descansos"
              >
                  ⏸️
              </button>
          </div>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {activeTab === 'vitals' && renderVitals()}
          {activeTab === 'focus' && renderPomodoro()}
          {activeTab === 'breaks' && renderBreaks()}
      </div>
    </div>
  );
};

export default TrackerWidget;