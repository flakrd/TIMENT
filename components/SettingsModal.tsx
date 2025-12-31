
import React, { useState } from 'react';
import { WorkConfig, DAYS_OF_WEEK, UIConfig, DEFAULT_UI_CONFIG, ModuleId, BackgroundTheme } from '../constants';

interface SettingsModalProps {
  config: WorkConfig;
  uiConfig?: UIConfig;
  currentVacationDate: Date;
  onSave: (config: WorkConfig, vacationDate: Date, uiConfig: UIConfig) => void;
  onClose: () => void;
}

type Tab = 'general' | 'schedule' | 'interface';

const SettingsModal: React.FC<SettingsModalProps> = ({ config, uiConfig = DEFAULT_UI_CONFIG, currentVacationDate, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [tempConfig, setTempConfig] = useState(config);
  const [tempUI, setTempUI] = useState<UIConfig>(uiConfig);
  const [tempVacationDate, setTempVacationDate] = useState<string>(
    currentVacationDate.toISOString().split('T')[0]
  );
  
  // Date Exception State
  const [newExceptionDate, setNewExceptionDate] = useState('');
  const [newExceptionStart, setNewExceptionStart] = useState(config.startHour);
  const [newExceptionEnd, setNewExceptionEnd] = useState(config.endHour);

  const [isSaved, setIsSaved] = useState(false);

  // --- Logic for Schedule ---
  const toggleDay = (dayIndex: number) => {
    const newDays = tempConfig.workDays.includes(dayIndex)
      ? tempConfig.workDays.filter(d => d !== dayIndex)
      : [...tempConfig.workDays, dayIndex];
    setTempConfig({ ...tempConfig, workDays: newDays });
  };

  const handleCustomScheduleChange = (dayIndex: number, field: 'start' | 'end', value: number) => {
    const currentSchedule = tempConfig.customSchedule || {};
    const daySchedule = currentSchedule[dayIndex] || { start: tempConfig.startHour, end: tempConfig.endHour };
    
    setTempConfig({
      ...tempConfig,
      customSchedule: {
        ...currentSchedule,
        [dayIndex]: { ...daySchedule, [field]: value }
      }
    });
  };

  const removeCustomSchedule = (dayIndex: number) => {
    const currentSchedule = { ...tempConfig.customSchedule };
    delete currentSchedule[dayIndex];
    setTempConfig({ ...tempConfig, customSchedule: currentSchedule });
  };

  // --- Logic for Date Exceptions ---
  const addDateException = () => {
    if (!newExceptionDate) return;
    const currentExceptions = tempConfig.dateExceptions || {};
    setTempConfig({
      ...tempConfig,
      dateExceptions: {
        ...currentExceptions,
        [newExceptionDate]: { start: newExceptionStart, end: newExceptionEnd }
      }
    });
    setNewExceptionDate('');
  };

  const removeDateException = (dateKey: string) => {
    const currentExceptions = { ...tempConfig.dateExceptions };
    delete currentExceptions[dateKey];
    setTempConfig({ ...tempConfig, dateExceptions: currentExceptions });
  };

  // --- Logic for Interface (Modules) ---
  const moveModule = (id: ModuleId, direction: 'up' | 'down', column: 'left' | 'right') => {
    const list = column === 'left' ? [...tempUI.leftColumn] : [...tempUI.rightColumn];
    const index = list.indexOf(id);
    if (index === -1) return;

    if (direction === 'up' && index > 0) {
      [list[index - 1], list[index]] = [list[index], list[index - 1]];
    } else if (direction === 'down' && index < list.length - 1) {
      [list[index + 1], list[index]] = [list[index], list[index + 1]];
    }

    setTempUI({
      ...tempUI,
      [column === 'left' ? 'leftColumn' : 'rightColumn']: list
    });
  };

  const swapColumn = (id: ModuleId, currentColumn: 'left' | 'right') => {
    const sourceList = currentColumn === 'left' ? [...tempUI.leftColumn] : [...tempUI.rightColumn];
    const targetList = currentColumn === 'left' ? [...tempUI.rightColumn] : [...tempUI.leftColumn];
    
    const index = sourceList.indexOf(id);
    if (index === -1) return;
    
    sourceList.splice(index, 1);
    targetList.push(id);

    setTempUI({
      ...tempUI,
      leftColumn: currentColumn === 'left' ? sourceList : targetList,
      rightColumn: currentColumn === 'left' ? targetList : sourceList
    });
  };

  const renameModule = (id: ModuleId, newName: string) => {
    setTempUI({
      ...tempUI,
      titles: { ...tempUI.titles, [id]: newName }
    });
  };

  const selectBackground = (theme: BackgroundTheme) => {
      setTempConfig({ ...tempConfig, backgroundTheme: theme });
  };
  
  const clearCustomBackground = () => {
      setTempConfig({ ...tempConfig, customBackgroundImage: undefined, backgroundTheme: 'minimal' });
  }

  // --- Save ---
  const handleSaveClick = () => {
      setIsSaved(true);
      const newVacationDate = new Date(tempVacationDate + 'T00:00:00');
      setTimeout(() => {
          onSave(tempConfig, newVacationDate, tempUI);
      }, 600);
  };

  // Styles forced to light mode
  const InputStyle = "w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none font-medium bg-white text-slate-800 transition-colors";
  const LabelStyle = "block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2";
  const SectionTitle = "text-lg font-black text-slate-800 mb-4 flex items-center gap-2";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      
      {/* Modal Content - FORCED LIGHT THEME */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative z-10 animate-in zoom-in-95 duration-200 border border-white/40">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
           <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
               <span className="text-indigo-600">⚙️</span> PREFERENCIAS
           </h2>
           <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50">
           {(['general', 'schedule', 'interface'] as Tab[]).map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${
                 activeTab === tab 
                 ? 'text-indigo-600 bg-white shadow-sm' 
                 : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
               }`}
             >
               {tab === 'general' ? 'General' : tab === 'schedule' ? 'Horarios' : 'Interfaz'}
               {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500"></div>}
             </button>
           ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
          
          {/* TAB: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 m-0">Diseño de Fondo</h3>
                     {tempConfig.customBackgroundImage && (
                         <button onClick={clearCustomBackground} className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md hover:bg-red-100">
                             Quitar fondo personalizado
                         </button>
                     )}
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {(['minimal', 'dynamic', 'geometric'] as BackgroundTheme[]).map(theme => (
                        <button 
                            key={theme}
                            onClick={() => selectBackground(theme)}
                            className={`h-24 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 ${tempConfig.backgroundTheme === theme && !tempConfig.customBackgroundImage ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'}`}
                        >
                            <div className={`w-8 h-8 rounded-full ${theme === 'minimal' ? 'bg-slate-200' : theme === 'dynamic' ? 'bg-gradient-to-tr from-blue-400 to-indigo-500' : 'bg-[url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIi8+CjxwYXRoIGQ9Ik0wIDBMODIDOFpNOCAwTDAgOFoiIHN0cm9rZT0iI2U1ZTdlYiIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjwvc3ZnPg==")] border border-slate-300'}`}></div>
                            <span className="text-[10px] font-bold uppercase">{theme === 'minimal' ? 'Minimal' : theme === 'dynamic' ? 'Dinámico' : 'Geométrico'}</span>
                        </button>
                    ))}
                </div>
                {tempConfig.customBackgroundImage && (
                     <p className="text-xs text-indigo-500 font-bold mb-6 text-center">✨ Imagen personalizada activa desde Nano Banana</p>
                )}

                <h3 className={SectionTitle}>Objetivos Personales</h3>
                <div className="grid md:grid-cols-2 gap-6">
                   <div>
                     <label className={LabelStyle}>Meta de Sueño</label>
                     <div className="relative">
                       <input 
                          type="number" min="4" max="12"
                          value={tempConfig.sleepGoal}
                          onChange={(e) => setTempConfig({...tempConfig, sleepGoal: parseInt(e.target.value)})}
                          className={InputStyle}
                       />
                       <span className="absolute right-4 top-3.5 text-sm font-bold text-slate-400">Horas</span>
                     </div>
                     <p className="text-[10px] text-slate-400 mt-2">Usado para calcular las fases de reposo.</p>
                   </div>
                   <div>
                      <label className={LabelStyle}>Fecha de Vacaciones</label>
                      <input 
                          type="date"
                          value={tempVacationDate}
                          onChange={(e) => setTempVacationDate(e.target.value)}
                          className={InputStyle}
                       />
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SCHEDULE */}
          {activeTab === 'schedule' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
               {/* Global Config */}
               <div>
                  <h3 className={SectionTitle}>Jornada Estándar</h3>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6">
                    <label className={LabelStyle}>Días Laborales</label>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {DAYS_OF_WEEK.map((day, index) => (
                        <button
                            key={day}
                            onClick={() => toggleDay(index)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                            tempConfig.workDays.includes(index)
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/30'
                                : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'
                            }`}
                        >
                            {day.slice(0, 3)}
                        </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={LabelStyle}>Inicio Global</label>
                            <input 
                            type="number" min="0" max="23"
                            value={tempConfig.startHour}
                            onChange={(e) => setTempConfig({...tempConfig, startHour: parseInt(e.target.value)})}
                            className={InputStyle}
                            />
                        </div>
                        <div>
                            <label className={LabelStyle}>Fin Global</label>
                            <input 
                            type="number" min="0" max="23"
                            value={tempConfig.endHour}
                            onChange={(e) => setTempConfig({...tempConfig, endHour: parseInt(e.target.value)})}
                            className={InputStyle}
                            />
                        </div>
                    </div>
                  </div>

                  <h3 className={SectionTitle}>Excepciones Semanales</h3>
                  <div className="space-y-3 mb-8">
                    {tempConfig.workDays.map((dayIndex) => {
                        const hasCustom = tempConfig.customSchedule && tempConfig.customSchedule[dayIndex];
                        const start = hasCustom ? tempConfig.customSchedule![dayIndex].start : tempConfig.startHour;
                        const end = hasCustom ? tempConfig.customSchedule![dayIndex].end : tempConfig.endHour;

                        return (
                        <div key={dayIndex} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${hasCustom ? 'bg-teal-50 border-teal-200' : 'bg-white border-slate-200'}`}>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-black uppercase w-10 ${hasCustom ? 'text-teal-700' : 'text-slate-500'}`}>{DAYS_OF_WEEK[dayIndex].slice(0,3)}</span>
                                {hasCustom && <span className="text-[9px] bg-teal-100 text-teal-700 px-1.5 rounded font-bold">CUSTOM</span>}
                            </div>
                            <div className="flex items-center gap-2">
                                <input 
                                type="number" 
                                className={`w-14 p-2 text-center text-sm rounded-lg border font-medium outline-none focus:ring-2 ${hasCustom ? 'border-teal-300 focus:ring-teal-500 bg-white' : 'border-slate-200 bg-slate-50'}`}
                                value={start}
                                onChange={(e) => handleCustomScheduleChange(dayIndex, 'start', parseInt(e.target.value))}
                                />
                                <span className="text-slate-300 font-black">-</span>
                                <input 
                                type="number" 
                                className={`w-14 p-2 text-center text-sm rounded-lg border font-medium outline-none focus:ring-2 ${hasCustom ? 'border-teal-300 focus:ring-teal-500 bg-white' : 'border-slate-200 bg-slate-50'}`}
                                value={end}
                                onChange={(e) => handleCustomScheduleChange(dayIndex, 'end', parseInt(e.target.value))}
                                />
                            </div>
                            {hasCustom && (
                                <button onClick={() => removeCustomSchedule(dayIndex)} className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar excepción">✕</button>
                            )}
                        </div>
                        );
                    })}
                  </div>

                  <h3 className={SectionTitle}>Excepciones por Fecha</h3>
                  <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                    <p className="text-[10px] text-orange-600 mb-3 font-medium">Agrega cambios de horario para fechas específicas (ej: Hoy).</p>
                    
                    {/* List of exceptions */}
                    <div className="space-y-2 mb-4">
                        {Object.entries(tempConfig.dateExceptions || {}).map(([dateKey, hours]) => (
                            <div key={dateKey} className="flex items-center justify-between bg-white p-2 rounded-lg border border-orange-200 shadow-sm">
                                <span className="text-xs font-bold text-slate-700">{dateKey}</span>
                                <span className="text-xs font-mono text-slate-500">{hours.start}:00 - {hours.end}:00</span>
                                <button onClick={() => removeDateException(dateKey)} className="text-red-400 hover:text-red-600 font-bold px-2">✕</button>
                            </div>
                        ))}
                        {Object.keys(tempConfig.dateExceptions || {}).length === 0 && (
                            <p className="text-xs text-slate-400 italic text-center py-2">Sin excepciones de fecha.</p>
                        )}
                    </div>

                    {/* Add new exception */}
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Fecha</label>
                            <input type="date" value={newExceptionDate} onChange={(e) => setNewExceptionDate(e.target.value)} className="w-full p-2 rounded border border-slate-200 text-sm" />
                        </div>
                        <div className="w-16">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Inicio</label>
                            <input type="number" value={newExceptionStart} onChange={(e) => setNewExceptionStart(parseInt(e.target.value))} className="w-full p-2 rounded border border-slate-200 text-sm text-center" />
                        </div>
                        <div className="w-16">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Fin</label>
                            <input type="number" value={newExceptionEnd} onChange={(e) => setNewExceptionEnd(parseInt(e.target.value))} className="w-full p-2 rounded border border-slate-200 text-sm text-center" />
                        </div>
                        <button onClick={addDateException} className="h-[38px] px-3 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700">+</button>
                    </div>
                  </div>
               </div>
             </div>
          )}

          {/* TAB: INTERFACE (Modules) */}
          {activeTab === 'interface' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Column Config */}
                    <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex justify-between">
                            Columna Lateral
                            <span className="text-indigo-500">{tempUI.leftColumn.length} Módulos</span>
                        </h4>
                        <div className="space-y-3 min-h-[100px] p-2 bg-slate-100 rounded-2xl border border-slate-200">
                            {tempUI.leftColumn.map((id, idx) => (
                                <div key={id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-2 group hover:border-indigo-300 transition-colors">
                                    <div className="flex justify-between items-center">
                                        <input 
                                            value={tempUI.titles[id]}
                                            onChange={(e) => renameModule(id, e.target.value)}
                                            className="text-sm font-bold bg-transparent border-b border-transparent focus:border-indigo-500 outline-none text-slate-800 w-full mr-2"
                                        />
                                        <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => moveModule(id, 'up', 'left')} disabled={idx===0} className="w-6 h-6 flex items-center justify-center rounded bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 disabled:opacity-30">↑</button>
                                            <button onClick={() => moveModule(id, 'down', 'left')} disabled={idx===tempUI.leftColumn.length-1} className="w-6 h-6 flex items-center justify-center rounded bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 disabled:opacity-30">↓</button>
                                        </div>
                                    </div>
                                    <button onClick={() => swapColumn(id, 'left')} className="text-[10px] font-bold text-slate-400 hover:text-indigo-500 self-end uppercase tracking-wider">
                                        Mover a Principal →
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Column Config */}
                    <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex justify-between">
                            Columna Principal
                            <span className="text-indigo-500">{tempUI.rightColumn.length} Módulos</span>
                        </h4>
                        <div className="space-y-3 min-h-[100px] p-2 bg-slate-100 rounded-2xl border border-slate-200">
                            {tempUI.rightColumn.map((id, idx) => (
                                <div key={id} className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-2 group hover:border-indigo-300 transition-colors">
                                    <div className="flex justify-between items-center">
                                        <input 
                                            value={tempUI.titles[id]}
                                            onChange={(e) => renameModule(id, e.target.value)}
                                            className="text-sm font-bold bg-transparent border-b border-transparent focus:border-indigo-500 outline-none text-slate-800 w-full mr-2"
                                        />
                                        <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => moveModule(id, 'up', 'right')} disabled={idx===0} className="w-6 h-6 flex items-center justify-center rounded bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 disabled:opacity-30">↑</button>
                                            <button onClick={() => moveModule(id, 'down', 'right')} disabled={idx===tempUI.rightColumn.length-1} className="w-6 h-6 flex items-center justify-center rounded bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 disabled:opacity-30">↓</button>
                                        </div>
                                    </div>
                                    <button onClick={() => swapColumn(id, 'right')} className="text-[10px] font-bold text-slate-400 hover:text-indigo-500 self-start uppercase tracking-wider">
                                        ← Mover a Lateral
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <p className="text-xs text-slate-400 text-center italic mt-4">Tip: Cambia el nombre de los módulos editando el texto directamente.</p>
             </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors">Cancelar</button>
          <button 
            onClick={handleSaveClick} 
            disabled={isSaved}
            className={`px-6 py-3 font-black text-sm rounded-xl shadow-lg transform transition-all duration-300 flex items-center gap-2 ${
                isSaved 
                ? 'bg-green-500 text-white scale-105 shadow-green-500/30' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/30 active:scale-95'
            }`}
          >
            {isSaved ? (
                <><span>✓</span> GUARDADO</>
            ) : (
                'GUARDAR CAMBIOS'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
