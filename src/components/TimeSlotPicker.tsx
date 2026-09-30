import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Clock, ChevronDown, Check, Sparkles } from 'lucide-react';

interface TimeSlotPickerProps {
  value: string; // ej: "09:00 - 11:00" o "08:15 - 10:45"
  onChange: (newValue: string) => void;
  label?: string;
  className?: string;
}

// Genera lista de horas en intervalos de 15 minutos de 06:00 a 22:00
const generate15MinIntervals = (): string[] => {
  const intervals: string[] = [];
  for (let hour = 6; hour <= 21; hour++) {
    for (let min = 0; min < 60; min += 15) {
      const hStr = hour.toString().padStart(2, '0');
      const mStr = min.toString().padStart(2, '0');
      intervals.push(`${hStr}:${mStr}`);
    }
  }
  intervals.push('22:00');
  return intervals;
};

const TIME_OPTIONS = generate15MinIntervals();

// Formato am/pm para visualización amigable estilo Google Calendar
const formatTo12Hour = (time24: string): string => {
  if (!time24 || !time24.includes(':')) return time24;
  const [hStr, mStr] = time24.split(':');
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr}${ampm}`;
};

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  value,
  onChange,
  label = 'Horario de Atención',
  className = '',
}) => {
  // Extraer hora inicio y fin
  const { initialStart, initialEnd } = useMemo(() => {
    if (!value || typeof value !== 'string') {
      return { initialStart: '09:00', initialEnd: '11:00' };
    }
    const clean = value.replace(/\([^)]*\)/g, '').trim();
    const parts = clean.split(' - ');
    const s = parts[0]?.trim() || '09:00';
    const e = parts[1]?.trim() || '11:00';
    return { initialStart: s, initialEnd: e };
  }, [value]);

  const [startTime, setStartTime] = useState<string>(initialStart);
  const [endTime, setEndTime] = useState<string>(initialEnd);

  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);

  const startContainerRef = useRef<HTMLDivElement>(null);
  const endContainerRef = useRef<HTMLDivElement>(null);

  // Sincronizar si cambia el value externamente
  useEffect(() => {
    if (value && typeof value === 'string') {
      const clean = value.replace(/\([^)]*\)/g, '').trim();
      const parts = clean.split(' - ');
      if (parts[0]) setStartTime(parts[0].trim());
      if (parts[1]) setEndTime(parts[1].trim());
    }
  }, [value]);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (startContainerRef.current && !startContainerRef.current.contains(e.target as Node)) {
        setIsStartOpen(false);
      }
      if (endContainerRef.current && !endContainerRef.current.contains(e.target as Node)) {
        setIsEndOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Notificar al padre cuando cambian startTime o endTime
  const notifyChange = (newStart: string, newEnd: string) => {
    setStartTime(newStart);
    setEndTime(newEnd);
    onChange(`${newStart} - ${newEnd}`);
  };

  const handleSelectStart = (selected: string) => {
    let nextEnd = endTime;
    // Si la hora de fin es menor o igual a la de inicio, sumarle 1.5 horas
    if (selected >= endTime) {
      const [h, m] = selected.split(':').map(Number);
      const endHour = Math.min(22, h + 1);
      const endMin = (m + 30) % 60;
      const finalH = (m + 30 >= 60 ? Math.min(22, endHour + 1) : endHour).toString().padStart(2, '0');
      const finalM = endMin.toString().padStart(2, '0');
      nextEnd = `${finalH}:${finalM}`;
    }
    notifyChange(selected, nextEnd);
    setIsStartOpen(false);
  };

  const handleSelectEnd = (selected: string) => {
    notifyChange(startTime, selected);
    setIsEndOpen(false);
  };

  // Atajos de duración rápida (ej: +1h, +1.5h, +2h, +3h)
  const applyDuration = (minutes: number) => {
    const [h, m] = startTime.split(':').map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const newH = Math.min(22, Math.floor(totalMinutes / 60)).toString().padStart(2, '0');
    const newM = (totalMinutes % 60).toString().padStart(2, '0');
    notifyChange(startTime, `${newH}:${newM}`);
  };

  // Calcular duración en texto para feedback visual
  const durationText = useMemo(() => {
    try {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff <= 0) return 'Horario invertido';
      const hours = Math.floor(diff / 60);
      const mins = diff % 60;
      if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
      if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''}`;
      return `${mins} min`;
    } catch {
      return '';
    }
  }, [startTime, endTime]);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-600" />
            <span>{label}</span>
          </label>
          {durationText && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
              Duración: {durationText}
            </span>
          )}
        </div>
      )}

      {/* Selector interactivo estilo Google Calendar (nk066_2 & nk066_3) */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-300 rounded-xl">
        {/* Selector Hora Inicio */}
        <div className="relative flex-1" ref={startContainerRef}>
          <div
            onClick={() => {
              setIsStartOpen(!isStartOpen);
              setIsEndOpen(false);
            }}
            className="flex items-center justify-between p-2 bg-white border border-slate-200 hover:border-cyan-400 rounded-lg cursor-pointer transition-colors shadow-2xs group"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-cyan-600">Desde</span>
              <span className="font-mono font-bold text-xs text-slate-900">
                {startTime} <span className="text-[10px] font-normal text-slate-500">({formatTo12Hour(startTime)})</span>
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600 transition-transform" />
          </div>

          {/* Dropdown Lista de Horas Inicio con Intervalos de 15 Minutos */}
          {isStartOpen && (
            <div className="absolute left-0 top-full mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 text-xs">
              <div className="px-2 py-1 bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200">
                Seleccionar Hora Inicio (15 min)
              </div>
              {TIME_OPTIONS.map((time) => {
                const isSelected = time === startTime;
                return (
                  <button
                    key={`start-${time}`}
                    type="button"
                    onClick={() => handleSelectStart(time)}
                    className={`w-full px-3 py-1.5 text-left font-mono text-xs flex items-center justify-between hover:bg-cyan-50 cursor-pointer ${
                      isSelected ? 'bg-cyan-100/70 text-cyan-900 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <span>{time} <span className="text-[10px] text-slate-400">({formatTo12Hour(time)})</span></span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-700" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <span className="text-slate-400 font-bold text-sm select-none">–</span>

        {/* Selector Hora Término */}
        <div className="relative flex-1" ref={endContainerRef}>
          <div
            onClick={() => {
              setIsEndOpen(!isEndOpen);
              setIsStartOpen(false);
            }}
            className="flex items-center justify-between p-2 bg-white border border-slate-200 hover:border-cyan-400 rounded-lg cursor-pointer transition-colors shadow-2xs group"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-cyan-600">Hasta</span>
              <span className="font-mono font-bold text-xs text-slate-900">
                {endTime} <span className="text-[10px] font-normal text-slate-500">({formatTo12Hour(endTime)})</span>
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600 transition-transform" />
          </div>

          {/* Dropdown Lista de Horas Término con Intervalos de 15 Minutos */}
          {isEndOpen && (
            <div className="absolute right-0 top-full mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 text-xs">
              <div className="px-2 py-1 bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200">
                Seleccionar Hora Término (15 min)
              </div>
              {TIME_OPTIONS.filter(t => t > startTime).map((time) => {
                const isSelected = time === endTime;
                return (
                  <button
                    key={`end-${time}`}
                    type="button"
                    onClick={() => handleSelectEnd(time)}
                    className={`w-full px-3 py-1.5 text-left font-mono text-xs flex items-center justify-between hover:bg-cyan-50 cursor-pointer ${
                      isSelected ? 'bg-cyan-100/70 text-cyan-900 font-bold' : 'text-slate-700'
                    }`}
                  >
                    <span>{time} <span className="text-[10px] text-slate-400">({formatTo12Hour(time)})</span></span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-700" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Botones de Duración Rápida y Bloques Sugeridos */}
      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mr-1">Duración:</span>
        <button
          type="button"
          onClick={() => applyDuration(60)}
          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-cyan-500 hover:text-cyan-700 font-medium text-[11px] cursor-pointer transition-colors shadow-2xs"
        >
          1 hora
        </button>
        <button
          type="button"
          onClick={() => applyDuration(90)}
          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-cyan-500 hover:text-cyan-700 font-medium text-[11px] cursor-pointer transition-colors shadow-2xs"
        >
          1h 30m
        </button>
        <button
          type="button"
          onClick={() => applyDuration(120)}
          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-cyan-500 hover:text-cyan-700 font-medium text-[11px] cursor-pointer transition-colors shadow-2xs"
        >
          2 horas
        </button>
        <button
          type="button"
          onClick={() => applyDuration(180)}
          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:border-cyan-500 hover:text-cyan-700 font-medium text-[11px] cursor-pointer transition-colors shadow-2xs"
        >
          3 horas
        </button>

        {/* Input manual libre de horario */}
        <div className="ml-auto flex items-center gap-1 text-[11px] text-slate-400">
          <span>Manual:</span>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="08:00 - 09:30"
            className="w-24 px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-mono text-slate-800 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
