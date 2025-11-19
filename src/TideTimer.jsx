import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, RotateCcw, CheckCircle2, Coffee, Waves } from 'lucide-react';

export default function TideTimer() {
  // States: 'idle', 'working', 'resting', 'finished'
  const [status, setStatus] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [totalWorkTime, setTotalWorkTime] = useState(0);
  const [initialRestTime, setInitialRestTime] = useState(0);

  // Refs for timestamp-based timing (Fixes background tab throttling)
  const startTimeRef = useRef(0);
  const timerRef = useRef(null);
  const wakeLockRef = useRef(null);

  // Function to request Wake Lock
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  // Function to release Wake Lock
  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  // Effect 1: Timer Logic (Using Date.now() for accuracy)
  useEffect(() => {
    // Wake Lock Management
    if (status === 'working' || status === 'resting') {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    if (status === 'working') {
      // Start the interval
      timerRef.current = setInterval(() => {
        // Calculate delta from start time instead of incrementing
        const now = Date.now();
        const elapsed = Math.floor((now - startTimeRef.current) / 1000);
        setSeconds(elapsed);
      }, 1000);
    } else if (status === 'resting') {
      timerRef.current = setInterval(() => {
        const now = Date.now();
        // Calculate remaining time based on start of rest
        const elapsedRest = Math.floor((now - startTimeRef.current) / 1000);
        const remaining = initialRestTime - elapsedRest;

        if (remaining <= 0) {
          clearInterval(timerRef.current);
          setStatus('finished');
          setSeconds(0);
        } else {
          setSeconds(remaining);
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [status, initialRestTime]);

  // Effect 2: Document Title (Updates every second)
  useEffect(() => {
    if (status === 'working') {
      document.title = `🌊 ${formatTime(seconds)} - Rising`;
    } else if (status === 'resting') {
      document.title = `🏖️ ${formatTime(seconds)} - Receding`;
    } else if (status === 'finished') {
      document.title = "✅ Cycle Complete";
    } else {
      document.title = "TideTimer";
    }
  }, [seconds, status]);

  const startWork = () => {
    setStatus('working');
    startTimeRef.current = Date.now(); // Capture exact start timestamp
    setSeconds(0);
    setTotalWorkTime(0);
  };

  const stopWorkAndRest = () => {
    // Capture the final work duration from the timestamp difference
    const now = Date.now();
    const finalWorkDuration = Math.floor((now - startTimeRef.current) / 1000);
    
    setTotalWorkTime(finalWorkDuration);
    
    // Logic: Rest is 1/3 of work duration
    const restDuration = Math.floor(finalWorkDuration / 3);
    const finalRest = restDuration < 1 ? 1 : restDuration;
    
    setInitialRestTime(finalRest);
    setSeconds(finalRest);
    
    // Reset start time for the resting phase
    startTimeRef.current = Date.now();
    setStatus('resting');
  };

  const resetTimer = () => {
    setStatus('idle');
    setSeconds(0);
    setTotalWorkTime(0);
    setInitialRestTime(0);
  };

  // Helper to format time as MM:SS or HH:MM:SS if long
  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (status === 'working') return 100;
    if (status === 'resting') {
      return (seconds / initialRestTime) * 100;
    }
    return 0;
  };

  const getStatusColor = () => {
    switch (status) {
      case 'working': return 'text-blue-400 stroke-blue-400';
      case 'resting': return 'text-emerald-400 stroke-emerald-400';
      case 'finished': return 'text-gray-400 stroke-gray-400';
      default: return 'text-slate-200 stroke-slate-200';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'working': return 'HIGH TIDE (FOCUS)';
      case 'resting': return 'LOW TIDE (REST)';
      case 'finished': return 'TIDE RESET';
      default: return 'READY';
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-y-auto bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans selection:bg-blue-500/30">
      
      {/* Header */}
      <div className="absolute top-8 uppercase tracking-[0.3em] text-xs font-bold text-slate-500 flex items-center gap-2">
        <Waves size={16} />
        TideTimer
      </div>

      {/* Main Display */}
      <div className="relative flex flex-col items-center justify-center">
        
        {/* SVG Circle Progress */}
        <div className="relative w-72 h-72 md:w-96 md:h-96 lg:w-[32rem] lg:h-[32rem] xl:w-[40rem] xl:h-[40rem] flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              className="stroke-slate-800"
              strokeWidth="2"
            />
            {(status === 'resting' || status === 'working') && (
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                className={`${getStatusColor()} transition-all duration-1000 ease-linear`}
                strokeWidth="2"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * getProgress()) / 100}
                strokeLinecap="round"
              />
            )}
          </svg>

          {/* Timer Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <span className={`text-6xl md:text-8xl lg:text-9xl xl:text-[10rem] font-light tracking-tighter tabular-nums ${getStatusColor()} drop-shadow-2xl`}>
              {formatTime(seconds)}
            </span>
            <span className="mt-4 text-sm md:text-base lg:text-lg tracking-[0.2em] font-medium text-slate-500 animate-pulse">
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* Context Info */}
        <div className="h-12 mt-4 md:mt-8 text-slate-400 text-sm lg:text-base font-light">
           {status === 'resting' && (
             <div className="flex items-center gap-2 opacity-70">
               <Coffee size={14} />
               <span>Resting for 1/3 of previous work ({formatTime(totalWorkTime)})</span>
             </div>
           )}
           {status === 'finished' && (
             <span className="text-emerald-400 flex items-center gap-2">
               <CheckCircle2 size={16} /> Cycle Complete
             </span>
           )}
        </div>

      </div>

      {/* Controls */}
      <div className="mt-12 lg:mt-16 flex gap-6 items-center scale-100 lg:scale-125 transition-transform">
        {status === 'idle' && (
          <button
            onClick={startWork}
            className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all duration-300 shadow-lg hover:shadow-blue-500/25 flex items-center gap-3"
          >
            <Play size={20} className="fill-current" />
            <span className="font-medium tracking-widest uppercase text-sm">Start Flow</span>
          </button>
        )}

        {status === 'working' && (
          <button
            onClick={stopWorkAndRest}
            className="group px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 rounded-full transition-all duration-300 flex items-center gap-3"
          >
            <Square size={20} className="fill-current" />
            <span className="font-medium tracking-widest uppercase text-sm">Stop & Recede</span>
          </button>
        )}

        {(status === 'resting' || status === 'finished') && (
          <button
            onClick={resetTimer}
            className="group px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 rounded-full transition-all duration-300 flex items-center gap-3"
          >
            <RotateCcw size={20} className="group-hover:-rotate-180 transition-transform duration-500" />
            <span className="font-medium tracking-widest uppercase text-sm">New Tide</span>
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 flex flex-col items-center gap-6">
        <div className="text-slate-600 text-xs max-w-xs text-center leading-relaxed">
          Work as long as you can maintain focus. <br/>
          When you stop, your rest time will be calculated as <span className="text-slate-400 whitespace-nowrap">Work ÷ 3</span>.
        </div>

        <a 
          href="https://ko-fi.com/tidetimer" 
          target="_blank" 
          rel="noreferrer" 
          className="group flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/50 text-slate-500 hover:text-blue-400 hover:bg-slate-900 transition-all duration-300 text-xs font-medium border border-transparent hover:border-slate-800"
        >
          <Coffee size={14} className="group-hover:scale-110 transition-transform" />
          <span>Keep the tide flowing</span>
        </a>
      </div>

      
    </div>
  );
}