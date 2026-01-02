import React, { useState, useEffect } from 'react';

type TabType = 'vitals' | 'focus' | 'breaks';

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

interface TrackerWidgetProps {
  title?: string;
  isRestMode: boolean; // Received from App
  isDarkMode?: boolean;
}

const TrackerWidget: React.FC<TrackerWidgetProps> = ({ title = "Rastreador", isRestMode, isDarkMode }) => {
  const [activeTab, setActiveTab] = useState<TabType>('vitals');
  
  // --- VITALS STATE ---
  const [coffees, setCoffees] = useState(0);
  const [poops, setPoops] = useState(0);
  const [water, setWater] = useState(0);
  
  const [coffeeBump, setCoffeeBump] = useState(false);
  const [poopBump, setPoopBump] = useState(false);
  const [waterBump, setWaterBump] = useState(false);

  // --- POMODORO STATE ---
  const [pomoTime, setPomoTime] = useState(25 * 60);
  const [isPomoRunning, setIsPomoRunning] = useState(false);
  const [pomoFinished, setPomoFinished] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState("");

  // --- BREAKS STATE ---
  const [workInterval, setWorkInterval] = useState(120);
  const [breakDuration, setBreakDuration] = useState(15);
  const [startBreakTime, setStartBreakTime] = useState("09:00");

  const isDark = isRestMode || isDarkMode;

  useEffect(() => {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('tracker_date');
    if (savedDate !== today) {
        setCoffees(0); setPoops(0); setWater(0);
        localStorage.setItem('tracker_date', today);
    } else {
        setCoffees(parseInt(localStorage.getItem('tracker_coffees') || '0'));
        setPoops(parseInt(localStorage.getItem('tracker_poops') || '0'));
        setWater(parseInt(localStorage.getItem('tracker_water') || '0'));
    }
    const savedTasks = localStorage.getItem('tracker_tasks');
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    const savedBreakConfig = localStorage.getItem('tracker_break_config');
    if (savedBreakConfig) {
        const config = JSON.parse(savedBreakConfig);
        setWorkInterval(config.work || 120);
        setBreakDuration(config.break || 15);
        setStartBreakTime(config.start || "09:00");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tracker_coffees', coffees.toString());
    localStorage.setItem('tracker_poops', poops.toString());
    localStorage.setItem('tracker_water', water.toString());
    localStorage.setItem('tracker_tasks', JSON.stringify(tasks));
    localStorage.setItem('tracker_break_config', JSON.stringify({ work: workInterval, break: breakDuration, start: startBreakTime }));
  }, [coffees, poops, water, tasks, workInterval, breakDuration, startBreakTime]);

  const handleUpdate = (type: 'coffee' | 'poop' | 'water', delta: number) => {
    const triggerBump = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
        setter(true); setTimeout(() => setter(false), 300);
    };
    if (type === 'coffee') {
        const newVal = Math.max(0, coffees + delta);
        if (newVal !== coffees) { setCoffees(newVal); triggerBump(setCoffeeBump); }
    } else if (type === 'poop') {
        const newVal = Math.max(0, poops + delta);
        if (newVal !== poops) { setPoops(newVal); triggerBump(setPoopBump); }
    } else {
        const newVal = Math.max(0, water + delta);
        if (newVal !== water) { setWater(newVal); triggerBump(setWaterBump); }
    }
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

  const toggleTask = (id: number) => setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  const deleteTask = (id: number) => setTasks(tasks.filter(t => t.id !== id));

  const renderVitals = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 flex-1 overflow-y-auto pr-1">
        {[
          { id: 'coffee', label: 'Cafeína', sub: 'Energía', icon: '☕', val: coffees, color: isDark ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-100', bump: coffeeBump },
          { id: 'water', label: 'Agua', sub: 'Hidratación', icon: '💧', val: water, color: isDark ? 'bg-cyan-900/20 border-cyan-800' : 'bg-cyan-50 border-cyan-100', bump: waterBump },
          { id: 'poop', label: 'Baño', sub: 'Descargas', icon: '💩', val: poops, color: isDark ? 'bg-stone-900/20 border-stone-800' : 'bg-stone-50 border-stone-100', bump: poopBump }
        ].map(item => (
          <div key={item.id} className={`rounded-2xl p-3 border flex items-center justify-between transition-all duration-300 ${item.color} ${item.bump ? 'scale-[1.02]' : ''}`}>
              <div className="flex items-center gap-3">
                   <div className={`text-xl ${item.bump ? 'animate-pop' : ''}`}>{item.icon}</div>
                   <div className="flex flex-col">
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-800'}`}>{item.label}</span>
                   </div>
              </div>
              <div className="flex items-center gap-2">
                  <button onClick={() => handleUpdate(item.id as any, -1)} className={`w-7 h-7 rounded-full font-bold shadow-sm transition-transform active:scale-90 ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-white text-slate-600'}`}>-</button>
                  <span className={`text-lg font-black w-6 text-center ${isDark ? 'text-white' : 'text-slate-800'}`}>{item.val}</span>
                  <button onClick={() => handleUpdate(item.id as any, 1)} className={`w-7 h-7 rounded-full font-bold shadow-md transition-transform active:scale-90 ${isRestMode ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white'}`}>+</button>
              </div>
          </div>
        ))}
    </div>
  );

  const renderPomodoro = () => (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col min-h-0">
          <div className={`rounded-2xl p-4 border text-center mb-4 shrink-0 transition-all duration-500 ${isDark ? 'bg-slate-950/50 border-slate-700' : 'bg-red-50 border-red-100'} ${pomoFinished ? 'animate-finish-flash ring-2 ring-green-500' : ''}`}>
              <div className={`text-4xl font-black font-mono tracking-wider mb-2 ${pomoFinished ? 'text-green-500' : (isDark ? 'text-indigo-400' : 'text-red-600')}`}>
                  {pomoFinished ? "¡TIEMPO!" : formatTime(pomoTime)}
              </div>
              <div className="flex justify-center gap-2">
                  <button onClick={() => { if(pomoFinished) { setPomoFinished(false); setPomoTime(25*60); setIsPomoRunning(true); } else setIsPomoRunning(!isPomoRunning); }} className={`px-4 py-1 rounded-lg font-bold text-sm shadow-md transition-all ${isPomoRunning ? 'bg-slate-700 text-slate-300' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>{isPomoRunning ? 'Pausar' : 'Iniciar'}</button>
                  <button onClick={() => { setIsPomoRunning(false); setPomoFinished(false); setPomoTime(25*60); }} className={`px-3 py-1 rounded-lg border font-bold text-sm ${isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-400'}`}>↺</button>
              </div>
          </div>
          <div className="flex-1 flex flex-col min-h-0">
             <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 shrink-0">Lista de Enfoque</h4>
             <form onSubmit={addTask} className="flex gap-2 mb-3 shrink-0">
                 <input type="text" value={newTaskText} onChange={(e) => setNewTaskText(e.target.value)} placeholder="Nueva tarea..." className={`flex-1 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 transition-colors ${isDark ? 'bg-slate-900 border-slate-700 text-white focus:ring-indigo-500' : 'bg-slate-50 border-slate-200 focus:ring-indigo-300'}`} />
                 <button type="submit" className={`px-3 rounded-lg font-bold ${isDark ? 'bg-indigo-900/50 text-indigo-300' : 'bg-slate-200 text-slate-600'}`}>+</button>
             </form>
             <div className="flex-1 overflow-y-auto pr-1 space-y-1 min-h-0">
                 {tasks.map(task => (
                     <div key={task.id} className={`flex items-center gap-3 p-2 rounded-lg transition-colors group ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
                         <button onClick={() => toggleTask(task.id)} className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.completed ? 'bg-green-500 border-green-500 text-white' : (isDark ? 'border-slate-600' : 'border-slate-300')}`}>{task.completed && '✓'}</button>
                         <span className={`text-sm flex-1 truncate ${task.completed ? 'text-slate-500 line-through' : (isDark ? 'text-slate-200' : 'text-slate-700')}`}>{task.text}</span>
                         <button onClick={() => deleteTask(task.id)} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                     </div>
                 ))}
             </div>
          </div>
      </div>
  );

  return (
    <div className={`rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col h-full max-h-[500px] border ${isRestMode 
        ? 'bg-slate-900/80 backdrop-blur-xl border-slate-700/50 text-white shadow-2xl ring-1 ring-white/10' 
        : (isDarkMode 
            ? 'bg-slate-800/90 backdrop-blur-xl border-slate-700 text-white shadow-lg ring-1 ring-white/5'
            : 'bg-white/95 backdrop-blur-xl border-white/50 text-slate-900 shadow-sm ring-1 ring-slate-900/5')
    }`}>
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/5 shrink-0">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <span>{activeTab === 'vitals' ? '📊' : activeTab === 'focus' ? '🍅' : '⏸️'}</span> {title}
          </h3>
          <div className={`flex rounded-xl p-1 transition-colors ${isDark ? 'bg-slate-950' : 'bg-slate-100'}`}>
              {['vitals', 'focus', 'breaks'].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab as TabType)} className={`px-3 py-1.5 rounded-lg text-xs transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg font-black' : 'text-slate-500 hover:text-slate-300'}`}>
                      {tab === 'vitals' ? 'V' : tab === 'focus' ? 'F' : 'B'}
                  </button>
              ))}
          </div>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {activeTab === 'vitals' && renderVitals()}
          {activeTab === 'focus' && renderPomodoro()}
          {activeTab === 'breaks' && (
              <div className="text-center text-slate-500 text-xs py-10 italic">Configuración de descansos optimizada para {isRestMode ? 'reposo' : 'trabajo'}.</div>
          )}
      </div>
    </div>
  );
};

export default TrackerWidget;