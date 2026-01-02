
import React, { useState } from 'react';
import { WorkConfig, DAYS_OF_WEEK, UIConfig, DEFAULT_UI_CONFIG, ModuleId, BackgroundTheme } from '../constants';
import { LocationConfig } from '../types/models';

interface SettingsModalProps {
  config: WorkConfig;
  uiConfig?: UIConfig;
  locationConfig: LocationConfig;
  currentVacationDate: Date;
  onSave: (config: WorkConfig, vacationDate: Date, uiConfig: UIConfig, locationConfig: LocationConfig) => void;
  onClose: () => void;
}

type Tab = 'general' | 'schedule' | 'interface';

const SettingsModal: React.FC<SettingsModalProps> = ({ config, uiConfig = DEFAULT_UI_CONFIG, locationConfig, currentVacationDate, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [tempConfig, setTempConfig] = useState(config);
  const [tempUI, setTempUI] = useState<UIConfig>(uiConfig);
  const [tempLocation, setTempLocation] = useState<LocationConfig>(locationConfig);
  
  // Safe date conversion
  const formatDate = (d: Date) => {
      try { return d.toISOString().split('T')[0]; } 
      catch { return new Date().toISOString().split('T')[0]; }
  };
  const [tempVacationDate, setTempVacationDate] = useState<string>(formatDate(currentVacationDate));
  
  const [isSaved, setIsSaved] = useState(false);
  const [locStatus, setLocStatus] = useState<'idle' | 'detecting' | 'success' | 'error'>('idle');

  // --- Logic Helpers ---
  const toggleDay = (dayIndex: number) => {
    const newDays = tempConfig.workDays.includes(dayIndex)
      ? tempConfig.workDays.filter(d => d !== dayIndex)
      : [...tempConfig.workDays, dayIndex];
    setTempConfig({ ...tempConfig, workDays: newDays });
  };

  const selectBackground = (theme: BackgroundTheme) => setTempConfig({ ...tempConfig, backgroundTheme: theme });
  
  const detectLocation = () => {
    setLocStatus('detecting');
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setTempLocation({
                    type: 'gps',
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    city: 'Ubicación GPS (Detectada)'
                });
                setLocStatus('success');
                setTimeout(() => setLocStatus('idle'), 2000);
            },
            () => { setLocStatus('error'); setTimeout(() => setLocStatus('idle'), 2000); }
        );
    } else { setLocStatus('error'); }
  };

  const handleSaveClick = () => {
      setIsSaved(true);
      const newVacationDate = new Date(tempVacationDate + 'T00:00:00');
      // Ensure we don't save minimized state here as it is handled by the main UI, 
      // but preserve it if it exists in tempUI
      onSave(tempConfig, newVacationDate, tempUI, tempLocation);
  };

  // UI Components
  const TabButton = ({ id, label, icon }: { id: Tab, label: string, icon: string }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`w-full text-left px-4 py-4 rounded-xl font-bold text-sm flex items-center gap-3 transition-all ${
            activeTab === id 
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
            : 'text-slate-500 hover:bg-slate-100'
        }`}
      >
          <span className="text-lg">{icon}</span>
          {label}
      </button>
  );

  const Card = ({ title, children }: { title: string, children: React.ReactNode }) => (
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-6 animate-in slide-in-from-bottom-2 duration-300">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              {title}
          </h3>
          {children}
      </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      <div className="bg-[#f8fafc] rounded-[2rem] shadow-2xl w-full max-w-4xl h-[85vh] flex overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
        
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col hidden md:flex">
            <h2 className="text-2xl font-black text-slate-800 mb-10 tracking-tight pl-2">Configuración</h2>
            <div className="space-y-2 flex-1">
                <TabButton id="general" label="General" icon="🌍" />
                <TabButton id="schedule" label="Horarios" icon="⏰" />
                <TabButton id="interface" label="Interfaz" icon="🎨" />
            </div>
            <div className="text-xs text-slate-400 font-medium pl-4">v3.1.0</div>
        </div>

        {/* Mobile Header (visible only on small screens) */}
        <div className="md:hidden absolute top-0 left-0 right-0 bg-white p-4 border-b border-slate-200 z-20 flex justify-between items-center">
             <span className="font-black text-lg">Configuración</span>
             <button onClick={onClose}>✕</button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            
            {/* Mobile Tabs */}
            <div className="md:hidden flex bg-white border-b border-slate-200 pt-14 px-4 gap-2 overflow-x-auto">
                 {['general', 'schedule', 'interface'].map(t => (
                     <button key={t} onClick={() => setActiveTab(t as Tab)} className={`px-4 py-2 rounded-t-lg text-xs font-bold ${activeTab === t ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}>{t.toUpperCase()}</button>
                 ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 scrollbar-thin">
                
                {activeTab === 'general' && (
                    <>
                        <Card title="Ubicación">
                            <div className="flex gap-4 items-start flex-col sm:flex-row">
                                <div className="flex-1 w-full">
                                    <label className="block text-xs font-bold text-slate-400 mb-2">CIUDAD O COORDENADAS</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            value={tempLocation.city || ''}
                                            onChange={(e) => setTempLocation({ ...tempLocation, type: 'manual', city: e.target.value })}
                                            placeholder="Ej: Buenos Aires"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        />
                                        <span className="absolute left-3 top-3.5 text-slate-400">📍</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2 ml-1">Usado para el clima y mapas.</p>
                                </div>
                                <button 
                                    onClick={detectLocation}
                                    className={`px-6 py-3 rounded-xl font-bold text-sm border-2 transition-all h-[50px] mt-6 sm:mt-0 ${tempLocation.type === 'gps' ? 'border-green-500 bg-green-50 text-green-700' : 'border-indigo-100 hover:border-indigo-500 text-indigo-600'}`}
                                >
                                    {locStatus === 'detecting' ? 'Detectando...' : 'Usar GPS'}
                                </button>
                            </div>
                        </Card>

                        <Card title="Apariencia">
                            <div className="grid grid-cols-3 gap-4">
                                {(['minimal', 'dynamic', 'geometric'] as BackgroundTheme[]).map(theme => (
                                    <button 
                                        key={theme}
                                        onClick={() => selectBackground(theme)}
                                        className={`h-28 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden group ${tempConfig.backgroundTheme === theme ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-100 hover:border-slate-300'}`}
                                    >
                                        <div className={`absolute inset-0 opacity-10 ${theme === 'minimal' ? 'bg-slate-500' : theme === 'dynamic' ? 'bg-gradient-to-tr from-blue-500 to-purple-500' : 'bg-slate-900'}`}></div>
                                        <span className="relative z-10 text-xs font-bold uppercase">{theme}</span>
                                        {tempConfig.backgroundTheme === theme && <span className="absolute top-2 right-2 text-indigo-600">✓</span>}
                                    </button>
                                ))}
                            </div>
                        </Card>

                        <Card title="Metas">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Horas de Sueño</label>
                                    <input 
                                        type="number" 
                                        value={tempConfig.sleepGoal}
                                        onChange={(e) => setTempConfig({...tempConfig, sleepGoal: parseInt(e.target.value)})}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Vacaciones</label>
                                    <input 
                                        type="date" 
                                        value={tempVacationDate}
                                        onChange={(e) => setTempVacationDate(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
                                    />
                                </div>
                            </div>
                        </Card>
                    </>
                )}

                {activeTab === 'schedule' && (
                    <Card title="Horario Laboral Base">
                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-400 mb-3 uppercase">Días de Trabajo</label>
                            <div className="flex gap-2 flex-wrap">
                                {DAYS_OF_WEEK.map((day, idx) => (
                                    <button 
                                        key={day}
                                        onClick={() => toggleDay(idx)}
                                        className={`w-10 h-10 rounded-lg text-xs font-black transition-all ${tempConfig.workDays.includes(idx) ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 transform -translate-y-1' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                    >
                                        {day.charAt(0)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                             <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Entrada</label>
                                <input 
                                    type="number" min="0" max="23"
                                    value={tempConfig.startHour}
                                    onChange={(e) => setTempConfig({...tempConfig, startHour: parseInt(e.target.value)})}
                                    className="w-full p-3 text-center bg-slate-50 border border-slate-200 rounded-xl font-black text-lg"
                                />
                             </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Salida</label>
                                <input 
                                    type="number" min="0" max="23"
                                    value={tempConfig.endHour}
                                    onChange={(e) => setTempConfig({...tempConfig, endHour: parseInt(e.target.value)})}
                                    className="w-full p-3 text-center bg-slate-50 border border-slate-200 rounded-xl font-black text-lg"
                                />
                             </div>
                        </div>
                    </Card>
                )}

                {activeTab === 'interface' && (
                    <Card title="Organización de Módulos">
                        <p className="text-sm text-slate-500 mb-4">Arrastra y suelta los módulos en la pantalla principal para reorganizarlos. Aquí puedes cambiar sus nombres.</p>
                        <div className="space-y-2">
                            {Object.entries(tempUI.titles).map(([key, title]) => (
                                <div key={key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-xs font-bold uppercase text-slate-400 w-24">{key}</span>
                                    <input 
                                        value={title}
                                        onChange={(e) => setTempUI({...tempUI, titles: { ...tempUI.titles, [key as ModuleId]: e.target.value }})}
                                        className="flex-1 bg-transparent font-bold text-slate-700 outline-none border-b border-transparent focus:border-indigo-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3 z-20">
                <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors">Cancelar</button>
                <button 
                    onClick={handleSaveClick}
                    className={`px-8 py-3 rounded-xl font-black text-white shadow-xl transition-all ${isSaved ? 'bg-green-500 scale-95' : 'bg-slate-900 hover:bg-slate-800 hover:-translate-y-1'}`}
                >
                    {isSaved ? '¡Guardado!' : 'Guardar Cambios'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
