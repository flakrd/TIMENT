import React from 'react';
import { WorkConfig, DAYS_OF_WEEK } from '../constants';

interface SettingsModalProps {
  config: WorkConfig;
  currentVacationDate: Date;
  onSave: (config: WorkConfig, vacationDate: Date) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ config, currentVacationDate, onSave, onClose }) => {
  const [tempConfig, setTempConfig] = React.useState(config);
  const [tempVacationDate, setTempVacationDate] = React.useState<string>(
    currentVacationDate.toISOString().split('T')[0]
  );
  const [isSaved, setIsSaved] = React.useState(false);

  const toggleDay = (dayIndex: number) => {
    const newDays = tempConfig.workDays.includes(dayIndex)
      ? tempConfig.workDays.filter(d => d !== dayIndex)
      : [...tempConfig.workDays, dayIndex];
    setTempConfig({ ...tempConfig, workDays: newDays });
  };

  const handleSaveClick = () => {
      setIsSaved(true);
      const newVacationDate = new Date(tempVacationDate + 'T00:00:00');
      setTimeout(() => {
          onSave(tempConfig, newVacationDate);
      }, 800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span>⚙️</span> Configuración
        </h2>
        
        <div className="space-y-6">
          {/* Section: Jornada Laboral */}
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-sm font-black text-indigo-600 uppercase tracking-wide mb-3">Jornada Laboral</h3>
            
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 mb-2">Días Laborales</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day, index) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(index)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors border ${
                      tempConfig.workDays.includes(index)
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Hora Inicio</label>
                <input 
                  type="number" 
                  min="0" max="23"
                  value={tempConfig.startHour}
                  onChange={(e) => setTempConfig({...tempConfig, startHour: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-mono bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Hora Fin</label>
                <input 
                  type="number" 
                  min="0" max="23"
                  value={tempConfig.endHour}
                  onChange={(e) => setTempConfig({...tempConfig, endHour: parseInt(e.target.value)})}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 outline-none text-lg font-mono bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Section: Objetivos */}
          <div>
            <h3 className="text-sm font-black text-orange-600 uppercase tracking-wide mb-3">Objetivos</h3>
            <div>
               <label className="block text-xs font-bold text-gray-500 mb-1">Fecha de Vacaciones</label>
               <input 
                  type="date"
                  value={tempVacationDate}
                  onChange={(e) => setTempVacationDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none font-sans bg-gray-50"
               />
               <p className="text-[10px] text-gray-400 mt-1">La cuenta regresiva se actualizará automáticamente.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">Cancelar</button>
          <button 
            onClick={handleSaveClick} 
            disabled={isSaved}
            className={`px-4 py-2 font-bold rounded-lg shadow-lg transform transition-all duration-300 ${
                isSaved 
                ? 'bg-green-500 text-white scale-105 shadow-green-500/30' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/30 active:scale-95'
            }`}
          >
            {isSaved ? '¡Guardado!' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;