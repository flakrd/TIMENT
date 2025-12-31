import React, { useEffect, useState, useRef } from 'react';
import { getCordobaTime } from '../utils/dateHelpers';

interface CountdownProps {
  targetDate: Date;
  isRestMode: boolean; // Received from App for potential external styling adaptation
}

const calculateTimeLeft = (target: Date) => {
  const now = getCordobaTime();
  const difference = target.getTime() - now.getTime();

  if (difference > 0) {
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    };
  }
  return { days: 0, hours: 0, minutes: 0, seconds: 0 };
};

const Countdown: React.FC<CountdownProps> = React.memo(({ targetDate, isRestMode }) => {
  // Initialize with the calculation function to avoid 0-state flash
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Immediate update on prop change
    setTimeLeft(calculateTimeLeft(targetDate));

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width - 0.5) * 2;
    const y = ((e.clientY - top) / height - 0.5) * 2;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const isUrgent = timeLeft.days < 7 && (timeLeft.days > 0 || timeLeft.hours > 0 || timeLeft.minutes > 0);

  // Blend with RestMode: Adds a subtle border or glow if in rest mode to match other widgets
  const containerClasses = isRestMode 
    ? 'ring-1 ring-white/10 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)]'
    : 'shadow-xl';

  return (
    <div 
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative overflow-hidden rounded-xl p-6 text-white transform transition-all duration-300 group ${isUrgent ? 'ring-4 ring-orange-400/50' : containerClasses}`}
        style={{ perspective: '1000px' }}
    >
      {/* Parallax Background Container */}
      <div className={`absolute inset-0 z-0 overflow-hidden transition-colors duration-1000 ${isUrgent ? 'bg-orange-500' : 'bg-sky-500'}`}>
          
          {/* Layer 1: Sky Gradient */}
          <div 
            className={`absolute inset-0 opacity-80 transition-transform duration-300 ease-out ${isUrgent ? 'bg-gradient-to-b from-red-600 to-orange-400' : 'bg-gradient-to-b from-indigo-600 to-sky-400'}`} 
            style={{ transform: `scale(1.1) translate(${mousePos.x * -5}px, ${mousePos.y * -5}px)` }}
          />

          {/* Layer 2: Sun / Moon */}
          <div 
            className="absolute inset-0 transition-transform duration-500 ease-out"
            style={{ transform: `translate(${mousePos.x * 15}px, ${mousePos.y * 15}px)` }}
          >
             <div className={`absolute top-6 right-10 w-24 h-24 rounded-full blur-3xl opacity-50 animate-pulse ${isUrgent ? 'bg-yellow-300' : 'bg-white'}`}></div>
             <div className={`absolute top-8 right-12 w-14 h-14 rounded-full mix-blend-overlay animate-float ${isUrgent ? 'bg-yellow-100' : 'bg-white/80'}`}></div>
          </div>

          {/* Layer 3: Clouds */}
          <div 
             className="absolute top-1/4 left-0 w-full h-full opacity-20 pointer-events-none transition-transform duration-700 ease-out"
             style={{ transform: `translate(${mousePos.x * -10}px, ${mousePos.y * -5}px)` }}
          >
             <div className="absolute top-10 left-10 w-32 h-1 bg-white rounded-full animate-drift"></div>
             <div className="absolute top-24 left-1/2 w-48 h-1 bg-white rounded-full animate-drift" style={{ animationDelay: '2s' }}></div>
          </div>

          {/* Layer 4: Sierras Back */}
          <div 
            className={`absolute bottom-0 left-[-10%] right-[-10%] h-48 transition-all duration-100 ease-out ${isUrgent ? 'text-red-800' : 'text-indigo-500'} opacity-70`}
            style={{ transform: `scale(1.1) translate(${mousePos.x * -10}px, ${mousePos.y * -5}px)` }}
          >
               <svg viewBox="0 0 1440 320" className="w-full h-full preserve-3d animate-drift" style={{ animationDuration: '20s' }}>
                  <path fill="currentColor" d="M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,224C840,245,960,267,1080,261.3C1200,256,1320,224,1380,208L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"></path>
               </svg>
          </div>
          
          {/* Layer 5: Sierras Front */}
          <div 
            className={`absolute -bottom-4 left-[-10%] right-[-10%] h-40 transition-all duration-100 ease-out ${isUrgent ? 'text-orange-900' : 'text-indigo-800'} opacity-80`}
            style={{ transform: `scale(1.1) translate(${mousePos.x * -20}px, ${mousePos.y * -10}px)` }}
          >
               <svg viewBox="0 0 1440 320" className="w-full h-full preserve-3d animate-drift" style={{ animationDuration: '25s', animationDirection: 'alternate-reverse' }}>
                  <path fill="currentColor" d="M0,96L80,112C160,128,320,160,480,186.7C640,213,800,235,960,213.3C1120,192,1280,128,1360,96L1440,64L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
               </svg>
          </div>
      </div>

      {/* Content */}
      <div 
        className="relative z-10 transition-transform duration-200 ease-out"
        style={{ transform: `translate(${mousePos.x * 5}px, ${mousePos.y * 5}px)` }}
      >
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 drop-shadow-md">
          {isUrgent ? (
             <span className="text-2xl animate-bounce">🔥</span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {isUrgent ? '¡Prepara las maletas!' : 'Cuenta Regresiva: Vacaciones'}
        </h3>

        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="bg-white/20 rounded-lg p-3 backdrop-blur-md border border-white/10 shadow-lg">
            <span className="block text-3xl font-bold drop-shadow-sm">{timeLeft.days}</span>
            <span className="text-xs uppercase tracking-wider font-medium text-white/90">Días</span>
          </div>
          <div className="bg-white/20 rounded-lg p-3 backdrop-blur-md border border-white/10 shadow-lg">
            <span className="block text-3xl font-bold drop-shadow-sm">{timeLeft.hours}</span>
            <span className="text-xs uppercase tracking-wider font-medium text-white/90">Horas</span>
          </div>
          <div className="bg-white/20 rounded-lg p-3 backdrop-blur-md border border-white/10 shadow-lg">
            <span className="block text-3xl font-bold drop-shadow-sm">{timeLeft.minutes}</span>
            <span className="text-xs uppercase tracking-wider font-medium text-white/90">Min</span>
          </div>
          <div className="bg-white/20 rounded-lg p-3 backdrop-blur-md border border-white/10 shadow-lg">
            <span className="block text-3xl font-bold drop-shadow-sm">{timeLeft.seconds}</span>
            <span className="text-xs uppercase tracking-wider font-medium text-white/90">Seg</span>
          </div>
        </div>

        <div className="mt-4 text-center text-sm font-medium text-white/90 drop-shadow-md bg-black/10 py-1 px-3 rounded-full inline-block w-full backdrop-blur-sm border border-white/10">
          {isUrgent 
            ? `¡Solo faltan ${timeLeft.days} días para las sierras!` 
            : `Objetivo: ${targetDate.toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
          }
        </div>
      </div>
    </div>
  );
});

export default Countdown;