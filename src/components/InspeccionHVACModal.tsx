import React, { useState } from 'react';
import { ServiceOrder, HVACInspectionChecklist } from '../types';
import { 
  X, 
  ClipboardCheck, 
  CheckSquare, 
  Square, 
  Thermometer, 
  Gauge, 
  Zap, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert,
  Wind,
  Camera,
  Video,
  Trash2,
  Plus,
  Play,
  Image as ImageIcon
} from 'lucide-react';

interface InspeccionHVACModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  onSaveChecklist: (orderId: string, checklist: HVACInspectionChecklist) => void;
}

export const InspeccionHVACModal: React.FC<InspeccionHVACModalProps> = ({
  isOpen,
  onClose,
  order,
  onSaveChecklist,
}) => {
  if (!isOpen || !order) return null;

  const [checklist, setChecklist] = useState<HVACInspectionChecklist>(() => ({
    clean_evaporator_coil: order.checklist?.clean_evaporator_coil || false,
    clean_turbine_fan: order.checklist?.clean_turbine_fan || false,
    sanitize_bactericide: order.checklist?.sanitize_bactericide || false,
    clean_condenser_coil: order.checklist?.clean_condenser_coil || false,
    check_electrical_connections: order.checklist?.check_electrical_connections || false,
    check_condensate_drain: order.checklist?.check_condensate_drain || false,
    clean_filters: order.checklist?.clean_filters || false,
    delta_t_celsius: order.checklist?.delta_t_celsius || 12.0,
    suction_pressure_psi: order.checklist?.suction_pressure_psi || 120,
    discharge_pressure_psi: order.checklist?.discharge_pressure_psi || 350,
    amperage_amps: order.checklist?.amperage_amps || 4.5,
    technician_notes: order.checklist?.technician_notes || '',
    photos_before: order.checklist?.photos_before || [],
    photos_after: order.checklist?.photos_after || [],
    videos_before: order.checklist?.videos_before || [],
    videos_after: order.checklist?.videos_after || [],
  }));

  const [inputUrl, setInputUrl] = useState('');
  const [activeMediaTab, setActiveMediaTab] = useState<'before' | 'after'>('before');

  const handleAddMedia = (type: 'photo' | 'video', target: 'before' | 'after') => {
    const url = prompt(`Ingresa la URL o enlace de la ${type === 'photo' ? 'foto' : 'video'} (${target === 'before' ? 'Antes' : 'Después'}):`);
    if (!url || !url.trim()) return;

    if (type === 'photo') {
      const key = target === 'before' ? 'photos_before' : 'photos_after';
      setChecklist(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), url.trim()]
      }));
    } else {
      const key = target === 'before' ? 'videos_before' : 'videos_after';
      setChecklist(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), url.trim()]
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video', target: 'before' | 'after') => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        if (type === 'photo') {
          const key = target === 'before' ? 'photos_before' : 'photos_after';
          setChecklist(prev => ({
            ...prev,
            [key]: [...(prev[key] || []), dataUrl]
          }));
        } else {
          const key = target === 'before' ? 'videos_before' : 'videos_after';
          setChecklist(prev => ({
            ...prev,
            [key]: [...(prev[key] || []), dataUrl]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveMedia = (target: 'before' | 'after', type: 'photo' | 'video', index: number) => {
    const key = type === 'photo' 
      ? (target === 'before' ? 'photos_before' : 'photos_after')
      : (target === 'before' ? 'videos_before' : 'videos_after');
    setChecklist(prev => ({
      ...prev,
      [key]: (prev[key] || []).filter((_, i) => i !== index)
    }));
  };

  const handleToggle = (key: keyof HVACInspectionChecklist) => {
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    onSaveChecklist(order.id, checklist);
    onClose();
  };

  // Evaluación de Salto Térmico (Delta T)
  const deltaT = checklist.delta_t_celsius || 0;
  let deltaTStatus = {
    text: 'Óptimo (Excelente transferencia)',
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  };
  if (deltaT < 8) {
    deltaTStatus = {
      text: 'Deficiente (Revisar posible fuga de gas o turbina sucia)',
      color: 'text-rose-700 bg-rose-50 border-rose-200',
    };
  } else if (deltaT < 10) {
    deltaTStatus = {
      text: 'Aceptable (Límite operacional)',
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 text-slate-900">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-200 shadow-xs">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                Ficha Técnica & Checklist HVAC
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-mono font-bold">
                  {order.ticket_number}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {order.customer?.name} • {order.equipment ? `${order.equipment.brand} ${order.equipment.btu} BTU (${order.equipment.refrigerant})` : 'Equipo HVAC'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Checklist Protocol */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-700 flex items-center gap-2">
              <Wind className="w-4 h-4 text-cyan-600" />
              Protocolo de Limpieza y Mantención Preventiva
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {[
                { key: 'clean_filters', label: 'Limpieza y lavado de filtros electrostáticos' },
                { key: 'clean_evaporator_coil', label: 'Desincrustado químico de serpentín interior' },
                { key: 'clean_turbine_fan', label: 'Limpieza de turbina y rotor centrífugo' },
                { key: 'sanitize_bactericide', label: 'Sanitización con bactericida ClimaCare' },
                { key: 'clean_condenser_coil', label: 'Hidrolavado / soplado unidad exterior' },
                { key: 'check_condensate_drain', label: 'Prueba de desagüe libre y desinfección bandeja' },
                { key: 'check_electrical_connections', label: 'Reapriete de borneras y cable de interconexión' },
              ].map(({ key, label }) => {
                const checked = (checklist as any)[key] as boolean;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleToggle(key as keyof HVACInspectionChecklist)}
                    className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      checked
                        ? 'bg-cyan-50 border-cyan-300 text-cyan-950 font-medium'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100/50'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    )}
                    <span className="text-xs font-medium leading-relaxed">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thermodynamic Measurements */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-700 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-cyan-600" />
              Medición de Parámetros Termodinámicos y Eléctricos
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Delta T */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-cyan-600" />
                  Salto Térmico ΔT (°C)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={checklist.delta_t_celsius || ''}
                    onChange={(e) => setChecklist(prev => ({ ...prev, delta_t_celsius: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500">°C</span>
                </div>
                <div className={`text-[10px] px-2 py-1 rounded-lg border font-medium ${deltaTStatus.color}`}>
                  {deltaTStatus.text}
                </div>
              </div>

              {/* Suction Pressure PSI */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-blue-600" />
                  Presión de Succión (PSI)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    value={checklist.suction_pressure_psi || ''}
                    onChange={(e) => setChecklist(prev => ({ ...prev, suction_pressure_psi: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500">PSI</span>
                </div>
                <p className="text-[10px] text-slate-500">R410A: 110-130 PSI / R32: 120-135 PSI</p>
              </div>

              {/* Amperage */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Consumo Eléctrico (A)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={checklist.amperage_amps || ''}
                    onChange={(e) => setChecklist(prev => ({ ...prev, amperage_amps: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-xs text-slate-500">A</span>
                </div>
                <p className="text-[10px] text-slate-500">Verificar con placa del compresor</p>
              </div>
            </div>
          </div>

          {/* SECCIÓN MULTIMEDIA ANTES Y DESPUÉS */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-800 flex items-center gap-2">
                <Camera className="w-4 h-4 text-cyan-600" />
                Evidencia Multimedia (Fotos y Videos Antes / Después)
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                Toma fotos directas desde el celular con la cámara o súbelas de la galería
              </span>
            </div>

            {/* 1. SECCIÓN ANTES DEL SERVICIO */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                    1. Estado Inicial (Antes del Servicio)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                    {((checklist.photos_before?.length || 0) + (checklist.videos_before?.length || 0))} archivos
                  </span>
                </div>

                {/* Botones de acción Antes */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold cursor-pointer transition-all shadow-xs active:scale-95">
                    <Camera className="w-3.5 h-3.5" />
                    <span>📷 Tomar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'photo', 'before')}
                    />
                  </label>

                  <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-blue-400 text-slate-700 text-[11px] font-bold cursor-pointer transition-all shadow-xs active:scale-95">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>🖼️ Galería</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'photo', 'before')}
                    />
                  </label>

                  <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-purple-400 text-slate-700 text-[11px] font-bold cursor-pointer transition-all shadow-xs active:scale-95">
                    <Video className="w-3.5 h-3.5 text-purple-600" />
                    <span>🎥 Grabar Video</span>
                    <input
                      type="file"
                      accept="video/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'video', 'before')}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => handleAddMedia('photo', 'before')}
                    className="px-2 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-medium transition-colors"
                    title="Agregar por URL web"
                  >
                    + URL
                  </button>
                </div>
              </div>

              {/* Grid Fotos y Videos Antes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {(checklist.photos_before || []).map((url, i) => (
                  <div key={`pb-${i}`} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video flex items-center justify-center shadow-xs">
                    <img src={url} alt={`Antes ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia('before', 'photo', i)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                      Antes #{i + 1}
                    </span>
                  </div>
                ))}

                {(checklist.videos_before || []).map((url, i) => (
                  <div key={`vb-${i}`} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video flex items-center justify-center shadow-xs">
                    <video src={url} controls className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia('before', 'video', i)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                      title="Eliminar video"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-purple-900/90 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5 font-mono">
                      <Video className="w-2.5 h-2.5" /> Video #{i + 1}
                    </span>
                  </div>
                ))}

                {(!checklist.photos_before?.length && !checklist.videos_before?.length) && (
                  <div className="col-span-full py-4 text-center text-xs text-slate-400 border border-dashed border-slate-300 rounded-xl bg-white/50">
                    No se han registrado fotos ni videos del estado inicial.
                  </div>
                )}
              </div>
            </div>

            {/* 2. SECCIÓN DESPUÉS DEL SERVICIO */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border-2 border-emerald-300 space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wide">
                    2. Trabajo Terminado (Después del Servicio / Entrega)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-bold">
                    {((checklist.photos_after?.length || 0) + (checklist.videos_after?.length || 0))} archivos
                  </span>
                </div>

                {/* Botones de acción Después */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold cursor-pointer transition-all shadow-xs active:scale-95">
                    <Camera className="w-3.5 h-3.5" />
                    <span>📷 Tomar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'photo', 'after')}
                    />
                  </label>

                  <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 hover:border-emerald-500 text-emerald-800 text-[11px] font-bold cursor-pointer transition-all shadow-xs active:scale-95">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>🖼️ Galería</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'photo', 'after')}
                    />
                  </label>

                  <label className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 hover:border-purple-400 text-slate-700 text-[11px] font-bold cursor-pointer transition-all shadow-xs active:scale-95">
                    <Video className="w-3.5 h-3.5 text-purple-600" />
                    <span>🎥 Grabar Video</span>
                    <input
                      type="file"
                      accept="video/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'video', 'after')}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => handleAddMedia('photo', 'after')}
                    className="px-2 py-1.5 rounded-lg bg-emerald-200/80 hover:bg-emerald-300 text-emerald-900 text-[11px] font-medium transition-colors"
                    title="Agregar por URL web"
                  >
                    + URL
                  </button>
                </div>
              </div>

              {/* Grid Fotos y Videos Después */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {(checklist.photos_after || []).map((url, i) => (
                  <div key={`pa-${i}`} className="relative group rounded-xl overflow-hidden border border-emerald-300 bg-black aspect-video flex items-center justify-center shadow-xs">
                    <img src={url} alt={`Después ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia('after', 'photo', i)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-emerald-900/90 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                      Después #{i + 1}
                    </span>
                  </div>
                ))}

                {(checklist.videos_after || []).map((url, i) => (
                  <div key={`va-${i}`} className="relative group rounded-xl overflow-hidden border border-emerald-300 bg-black aspect-video flex items-center justify-center shadow-xs">
                    <video src={url} controls className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveMedia('after', 'video', i)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                      title="Eliminar video"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-purple-900/90 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5 font-mono">
                      <Video className="w-2.5 h-2.5" /> Video #{i + 1}
                    </span>
                  </div>
                ))}

                {(!checklist.photos_after?.length && !checklist.videos_after?.length) && (
                  <div className="col-span-full py-4 text-center text-xs text-emerald-700 border border-dashed border-emerald-300 rounded-xl bg-white/50">
                    Aquí se cargan las fotos y videos del trabajo terminado (serpentín limpio, presiones y pruebas).
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Observations and Notes */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-slate-700">
              Observaciones del Técnico para el Informe del Cliente:
            </label>
            <textarea
              rows={3}
              value={checklist.technician_notes || ''}
              onChange={(e) => setChecklist(prev => ({ ...prev, technician_notes: e.target.value }))}
              placeholder="Ej: Se realizó prueba de calor y frío. Desagüe libre de sarro. Se recomienda próxima mantención preventiva en 6 meses antes de verano..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none leading-relaxed transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Los datos se sincronizan con el informe de entrega y el portal del cliente.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Guardar Ficha Técnica
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
