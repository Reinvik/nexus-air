import React, { useState, useEffect } from 'react';
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
  Image as ImageIcon,
  ExternalLink,
  UploadCloud,
  Clock,
  PenTool,
  Hash,
  ShieldCheck
} from 'lucide-react';
import { parseVideoUrl } from '../lib/videoUtils';

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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const [checklist, setChecklist] = useState<HVACInspectionChecklist>(() => ({
    clean_evaporator_coil: order?.checklist?.clean_evaporator_coil || false,
    clean_turbine_fan: order?.checklist?.clean_turbine_fan || false,
    sanitize_bactericide: order?.checklist?.sanitize_bactericide || false,
    clean_condenser_coil: order?.checklist?.clean_condenser_coil || false,
    check_electrical_connections: order?.checklist?.check_electrical_connections || false,
    check_condensate_drain: order?.checklist?.check_condensate_drain || false,
    clean_filters: order?.checklist?.clean_filters || false,
    delta_t_celsius: order?.checklist?.delta_t_celsius ?? 12.0,
    suction_pressure_psi: order?.checklist?.suction_pressure_psi ?? 120,
    discharge_pressure_psi: order?.checklist?.discharge_pressure_psi ?? 350,
    amperage_amps: order?.checklist?.amperage_amps ?? 4.5,
    work_start_time: order?.checklist?.work_start_time || '',
    work_end_time: order?.checklist?.work_end_time || '',
    serial_evaporator: order?.checklist?.serial_evaporator || order?.equipment?.serial_number_evaporator || order?.equipment?.serial_number || '',
    serial_condenser: order?.checklist?.serial_condenser || order?.equipment?.serial_number_condenser || '',
    amp_initial: order?.checklist?.amp_initial,
    amp_final: order?.checklist?.amp_final ?? order?.checklist?.amperage_amps,
    voltage_initial: order?.checklist?.voltage_initial,
    voltage_final: order?.checklist?.voltage_final,
    psi_low_initial: order?.checklist?.psi_low_initial,
    psi_low_final: order?.checklist?.psi_low_final ?? order?.checklist?.suction_pressure_psi,
    psi_high_initial: order?.checklist?.psi_high_initial,
    psi_high_final: order?.checklist?.psi_high_final ?? order?.checklist?.discharge_pressure_psi,
    capacitance_mfd: order?.checklist?.capacitance_mfd,
    technician_signature_name: order?.checklist?.technician_signature_name || order?.assigned_technician?.name || '',
    customer_signature_name: order?.checklist?.customer_signature_name || order?.customer?.name || '',
    customer_id_document: order?.checklist?.customer_id_document || order?.customer?.rut || '',
    technician_notes: order?.checklist?.technician_notes || '',
    photos_before: Array.isArray(order?.checklist?.photos_before) ? order!.checklist.photos_before : [],
    photos_after: Array.isArray(order?.checklist?.photos_after) ? order!.checklist.photos_after : [],
    videos_before: Array.isArray(order?.checklist?.videos_before) ? order!.checklist.videos_before : [],
    videos_after: Array.isArray(order?.checklist?.videos_after) ? order!.checklist.videos_after : [],
  }));

  useEffect(() => {
    if (order) {
      setChecklist({
        clean_evaporator_coil: order.checklist?.clean_evaporator_coil || false,
        clean_turbine_fan: order.checklist?.clean_turbine_fan || false,
        sanitize_bactericide: order.checklist?.sanitize_bactericide || false,
        clean_condenser_coil: order.checklist?.clean_condenser_coil || false,
        check_electrical_connections: order.checklist?.check_electrical_connections || false,
        check_condensate_drain: order.checklist?.check_condensate_drain || false,
        clean_filters: order.checklist?.clean_filters || false,
        delta_t_celsius: order.checklist?.delta_t_celsius ?? 12.0,
        suction_pressure_psi: order.checklist?.suction_pressure_psi ?? 120,
        discharge_pressure_psi: order.checklist?.discharge_pressure_psi ?? 350,
        amperage_amps: order.checklist?.amperage_amps ?? 4.5,
        work_start_time: order.checklist?.work_start_time || '',
        work_end_time: order.checklist?.work_end_time || '',
        serial_evaporator: order.checklist?.serial_evaporator || order.equipment?.serial_number_evaporator || order.equipment?.serial_number || '',
        serial_condenser: order.checklist?.serial_condenser || order.equipment?.serial_number_condenser || '',
        amp_initial: order.checklist?.amp_initial,
        amp_final: order.checklist?.amp_final ?? order.checklist?.amperage_amps,
        voltage_initial: order.checklist?.voltage_initial,
        voltage_final: order.checklist?.voltage_final,
        psi_low_initial: order.checklist?.psi_low_initial,
        psi_low_final: order.checklist?.psi_low_final ?? order.checklist?.suction_pressure_psi,
        psi_high_initial: order.checklist?.psi_high_initial,
        psi_high_final: order.checklist?.psi_high_final ?? order.checklist?.discharge_pressure_psi,
        capacitance_mfd: order.checklist?.capacitance_mfd,
        technician_signature_name: order.checklist?.technician_signature_name || order.assigned_technician?.name || '',
        customer_signature_name: order.checklist?.customer_signature_name || order.customer?.name || '',
        customer_id_document: order.checklist?.customer_id_document || order.customer?.rut || '',
        technician_notes: order.checklist?.technician_notes || '',
        photos_before: Array.isArray(order.checklist?.photos_before) ? order.checklist.photos_before : [],
        photos_after: Array.isArray(order.checklist?.photos_after) ? order.checklist.photos_after : [],
        videos_before: Array.isArray(order.checklist?.videos_before) ? order.checklist.videos_before : [],
        videos_after: Array.isArray(order.checklist?.videos_after) ? order.checklist.videos_after : [],
      });
    }
  }, [order?.id]);

  const [inputUrl, setInputUrl] = useState('');
  const [activeMediaTab, setActiveMediaTab] = useState<'before' | 'after'>('before');
  const [driveModalTarget, setDriveModalTarget] = useState<'before' | 'after' | null>(null);
  const [driveUrlInput, setDriveUrlInput] = useState('');

  if (!isOpen || !order) return null;

  const handleConfirmDriveVideo = () => {
    if (!driveUrlInput.trim() || !driveModalTarget) return;
    const parsed = parseVideoUrl(driveUrlInput.trim());
    const key = driveModalTarget === 'before' ? 'videos_before' : 'videos_after';
    setChecklist(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), parsed.rawUrl]
    }));
    setDriveUrlInput('');
    setDriveModalTarget(null);
  };

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

    if (type === 'video') {
      const largeFile = files.find(f => f.size > 5 * 1024 * 1024);
      if (largeFile) {
        alert(
          `⚠️ Video pesado detectado (${(largeFile.size / (1024 * 1024)).toFixed(1)}MB).\n\nPara no saturar el servidor ni la base de datos, te recomendamos usar el botón "📁 Google Drive" y pegar el enlace compartido desde la nube.`
        );
      }
    }

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

  // Safe media arrays
  const photosBefore = Array.isArray(checklist.photos_before) ? checklist.photos_before.filter(Boolean) : [];
  const videosBefore = Array.isArray(checklist.videos_before) ? checklist.videos_before.filter(Boolean) : [];
  const photosAfter = Array.isArray(checklist.photos_after) ? checklist.photos_after.filter(Boolean) : [];
  const videosAfter = Array.isArray(checklist.videos_after) ? checklist.videos_after.filter(Boolean) : [];

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
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto text-slate-900 cursor-default"
      >
        {/* Header */}
        <div className="px-6 py-3.5 bg-slate-50/95 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-200 shadow-xs">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                Ficha Técnica & Checklist HVAC
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-mono font-bold">
                  {order.ticket_number || 'S/N'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {order.customer?.name || 'Cliente'} • {order.equipment ? `${order.equipment.brand || ''} ${order.equipment.btu || ''} BTU (${order.equipment.refrigerant || ''})` : 'Equipo HVAC'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Cerrar ficha (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* COLUMNA IZQUIERDA: Checklist, Mediciones y Observaciones */}
            <div className="lg:col-span-6 space-y-4">
              {/* Datos de Servicio y Seriales de Equipo (Forma Venefrio) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-600" />
                  Horarios y Seriales de Unidad (Forma Venefrio)
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Hora Inicio</label>
                    <input
                      type="time"
                      value={checklist.work_start_time || ''}
                      onChange={(e) => setChecklist(prev => ({ ...prev, work_start_time: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Hora Término</label>
                    <input
                      type="time"
                      value={checklist.work_end_time || ''}
                      onChange={(e) => setChecklist(prev => ({ ...prev, work_end_time: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Serial Evap (Int.)</label>
                    <input
                      type="text"
                      placeholder="EVAP-..."
                      value={checklist.serial_evaporator || ''}
                      onChange={(e) => setChecklist(prev => ({ ...prev, serial_evaporator: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:border-cyan-500 focus:outline-none uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Serial Cond (Ext.)</label>
                    <input
                      type="text"
                      placeholder="COND-..."
                      value={checklist.serial_condenser || ''}
                      onChange={(e) => setChecklist(prev => ({ ...prev, serial_condenser: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:border-cyan-500 focus:outline-none uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Checklist Protocol */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-700 flex items-center gap-2">
                  <Wind className="w-4 h-4 text-cyan-600" />
                  Protocolo de Limpieza y Mantención Preventiva
                </h4>

                <div className="space-y-2">
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
                        className={`w-full flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                          checked
                            ? 'bg-cyan-50 border-cyan-300 text-cyan-950 font-medium shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <span className="text-[11px] font-medium leading-tight">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tabla Comparativa de Mediciones Técnicas (Forma Venefrio) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-700 flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-cyan-600" />
                    Mediciones Técnicas: Inicio vs Final (Venefrio)
                  </h4>
                  <span className="text-[10px] text-slate-500 font-mono">Comparativa</span>
                </div>

                <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-bold">
                      <tr>
                        <th className="py-2 px-3 text-[10px] uppercase">Parámetro</th>
                        <th className="py-2 px-3 text-[10px] uppercase text-center w-24">Inicio</th>
                        <th className="py-2 px-3 text-[10px] uppercase text-center w-24">Final</th>
                        <th className="py-2 px-2 text-[10px] uppercase text-center w-14">Unidad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-slate-800">Amperaje</td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            step="0.1"
                            placeholder="-"
                            value={checklist.amp_initial ?? ''}
                            onChange={(e) => setChecklist(prev => ({ ...prev, amp_initial: parseFloat(e.target.value) || undefined }))}
                            className="w-full px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded font-mono text-xs focus:bg-white focus:border-cyan-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            step="0.1"
                            placeholder="4.5"
                            value={checklist.amp_final ?? checklist.amperage_amps ?? ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || undefined;
                              setChecklist(prev => ({ ...prev, amp_final: val, amperage_amps: val || 0 }));
                            }}
                            className="w-full px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded font-mono text-xs font-bold text-cyan-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-center text-slate-500 font-mono text-[11px]">Amp</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-slate-800">Voltaje</td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            step="1"
                            placeholder="-"
                            value={checklist.voltage_initial ?? ''}
                            onChange={(e) => setChecklist(prev => ({ ...prev, voltage_initial: parseFloat(e.target.value) || undefined }))}
                            className="w-full px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded font-mono text-xs focus:bg-white focus:border-cyan-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            step="1"
                            placeholder="220"
                            value={checklist.voltage_final ?? ''}
                            onChange={(e) => setChecklist(prev => ({ ...prev, voltage_final: parseFloat(e.target.value) || undefined }))}
                            className="w-full px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded font-mono text-xs font-bold text-cyan-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-center text-slate-500 font-mono text-[11px]">V</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-slate-800">Presión Baja</td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            step="1"
                            placeholder="-"
                            value={checklist.psi_low_initial ?? ''}
                            onChange={(e) => setChecklist(prev => ({ ...prev, psi_low_initial: parseFloat(e.target.value) || undefined }))}
                            className="w-full px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded font-mono text-xs focus:bg-white focus:border-cyan-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            step="1"
                            placeholder="120"
                            value={checklist.psi_low_final ?? checklist.suction_pressure_psi ?? ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || undefined;
                              setChecklist(prev => ({ ...prev, psi_low_final: val, suction_pressure_psi: val || 0 }));
                            }}
                            className="w-full px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded font-mono text-xs font-bold text-cyan-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-center text-slate-500 font-mono text-[11px]">PSI</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-slate-800">Presión Alta</td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            step="1"
                            placeholder="-"
                            value={checklist.psi_high_initial ?? ''}
                            onChange={(e) => setChecklist(prev => ({ ...prev, psi_high_initial: parseFloat(e.target.value) || undefined }))}
                            className="w-full px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded font-mono text-xs focus:bg-white focus:border-cyan-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <input
                            type="number"
                            step="1"
                            placeholder="350"
                            value={checklist.psi_high_final ?? checklist.discharge_pressure_psi ?? ''}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || undefined;
                              setChecklist(prev => ({ ...prev, psi_high_final: val, discharge_pressure_psi: val || 0 }));
                            }}
                            className="w-full px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded font-mono text-xs font-bold text-cyan-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-center text-slate-500 font-mono text-[11px]">PSI</td>
                      </tr>
                      <tr>
                        <td className="py-1.5 px-3 font-semibold text-slate-800">Capacitancia</td>
                        <td colSpan={2} className="py-1.5 px-2">
                          <input
                            type="number"
                            step="0.5"
                            placeholder="Ej: 35"
                            value={checklist.capacitance_mfd ?? ''}
                            onChange={(e) => setChecklist(prev => ({ ...prev, capacitance_mfd: parseFloat(e.target.value) || undefined }))}
                            className="w-full px-2 py-1 text-center bg-slate-50 border border-slate-200 rounded font-mono text-xs focus:bg-white focus:border-cyan-500 focus:outline-none"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-center text-slate-500 font-mono text-[11px]">µF</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Delta T */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-cyan-600" />
                      Salto Térmico ΔT Operacional:
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.5"
                        value={checklist.delta_t_celsius || ''}
                        onChange={(e) => setChecklist(prev => ({ ...prev, delta_t_celsius: parseFloat(e.target.value) || 0 }))}
                        className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-900 font-mono font-bold focus:bg-white focus:border-cyan-500 focus:outline-none"
                      />
                      <span className="text-xs text-slate-500">°C</span>
                    </div>
                  </div>
                  <div className={`text-[10px] px-2 py-1 rounded border font-medium ${deltaTStatus.color}`}>
                    {deltaTStatus.text}
                  </div>
                </div>
              </div>

              {/* Observations and Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Observaciones del Técnico para el Informe del Cliente:
                </label>
                <textarea
                  rows={2}
                  value={checklist.technician_notes || ''}
                  onChange={(e) => setChecklist(prev => ({ ...prev, technician_notes: e.target.value }))}
                  placeholder="Ej: Se realizó prueba de calor y frío. Desagüe libre de sarro. Se recomienda próxima mantención preventiva en 6 meses..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none leading-relaxed transition-colors"
                />
              </div>

              {/* Firmas de Conformidad (Venefrio) */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-700 flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-cyan-600" />
                  Firmas y Conformidad Técnica
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Nombre / Firma Técnico</label>
                    <input
                      type="text"
                      placeholder="Nombre del técnico"
                      value={checklist.technician_signature_name || ''}
                      onChange={(e) => setChecklist(prev => ({ ...prev, technician_signature_name: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Nombre Cliente Receptor</label>
                    <input
                      type="text"
                      placeholder="Quién recibe en domicilio"
                      value={checklist.customer_signature_name || ''}
                      onChange={(e) => setChecklist(prev => ({ ...prev, customer_signature_name: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">Cédula / RUT Receptor</label>
                    <input
                      type="text"
                      placeholder="RUT / DNI"
                      value={checklist.customer_id_document || ''}
                      onChange={(e) => setChecklist(prev => ({ ...prev, customer_id_document: e.target.value }))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: Evidencia Multimedia (Antes y Después) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-800 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-cyan-600" />
                  Evidencia Multimedia (Fotos y Videos)
                </h4>
                <span className="text-[10px] text-slate-500 font-medium">
                  Cámara o Galería
                </span>
              </div>

              {/* 1. SECCIÓN ANTES DEL SERVICIO */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                      1. Estado Inicial (Antes)
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                      {(photosBefore.length + videosBefore.length)}
                    </span>
                  </div>

                  {/* Botones de acción Antes */}
                  <div className="flex flex-wrap items-center gap-1">
                    <label className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold cursor-pointer transition-all shadow-xs active:scale-95">
                      <Camera className="w-3 h-3" />
                      <span>📷 Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'photo', 'before')}
                      />
                    </label>

                    <label className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-300 hover:border-blue-400 text-slate-700 text-[10px] font-bold cursor-pointer transition-all shadow-xs active:scale-95">
                      <ImageIcon className="w-3 h-3 text-blue-600" />
                      <span>Galería</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'photo', 'before')}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setDriveUrlInput('');
                        setDriveModalTarget('before');
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-[10px] font-bold cursor-pointer transition-all shadow-xs active:scale-95"
                      title="Enlazar video desde Google Drive sin saturar el servidor"
                    >
                      <Video className="w-3 h-3 text-blue-600" />
                      <span>Drive Video</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddMedia('photo', 'before')}
                      className="px-1.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-medium transition-colors"
                      title="Agregar foto por URL web"
                    >
                      + URL
                    </button>
                  </div>
                </div>

                {/* Grid Fotos y Videos Antes */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {photosBefore.map((url, i) => (
                    <div key={`pb-${i}`} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video flex items-center justify-center shadow-xs">
                      <img src={url} alt={`Antes ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia('before', 'photo', i)}
                        className="absolute top-1 right-1 p-1 rounded bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                        title="Eliminar foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] px-1 py-0.5 rounded font-mono">
                        #{i + 1}
                      </span>
                    </div>
                  ))}

                  {videosBefore.map((url, i) => {
                    const vInfo = parseVideoUrl(url);
                    return (
                      <div key={`vb-${i}`} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video flex items-center justify-center shadow-xs">
                        {vInfo.isEmbed ? (
                          <iframe
                            src={vInfo.embedUrl}
                            className="w-full h-full border-0"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                            title={`Video Antes ${i + 1}`}
                          />
                        ) : (
                          <video src={url} controls className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia('before', 'video', i)}
                          className="absolute top-1 right-1 p-1 rounded bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md z-10"
                          title="Eliminar video"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-1 left-1 bg-purple-900/90 text-white text-[9px] px-1 py-0.5 rounded flex items-center gap-0.5 font-mono z-10 pointer-events-none">
                          <Video className="w-2.5 h-2.5" /> #{i + 1} {vInfo.isDrive && '(Drive)'}
                        </span>
                      </div>
                    );
                  })}

                  {(!photosBefore.length && !videosBefore.length) && (
                    <div className="col-span-full py-3 text-center text-[11px] text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white">
                      Sin archivos del estado inicial
                    </div>
                  )}
                </div>
              </div>

              {/* 2. SECCIÓN DESPUÉS DEL SERVICIO */}
              <div className="p-3.5 rounded-xl bg-emerald-50/40 border-2 border-emerald-300/80 space-y-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wide">
                      2. Trabajo Terminado (Entrega)
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-bold">
                      {(photosAfter.length + videosAfter.length)}
                    </span>
                  </div>

                  {/* Botones de acción Después */}
                  <div className="flex flex-wrap items-center gap-1">
                    <label className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold cursor-pointer transition-all shadow-xs active:scale-95">
                      <Camera className="w-3 h-3" />
                      <span>📷 Foto</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'photo', 'after')}
                      />
                    </label>

                    <label className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-emerald-300 hover:border-emerald-500 text-emerald-800 text-[10px] font-bold cursor-pointer transition-all shadow-xs active:scale-95">
                      <ImageIcon className="w-3 h-3 text-emerald-600" />
                      <span>Galería</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'photo', 'after')}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setDriveUrlInput('');
                        setDriveModalTarget('after');
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-900 text-[10px] font-bold cursor-pointer transition-all shadow-xs active:scale-95"
                      title="Enlazar video desde Google Drive sin saturar el servidor"
                    >
                      <Video className="w-3 h-3 text-emerald-700" />
                      <span>Drive Video</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddMedia('photo', 'after')}
                      className="px-1.5 py-1 rounded-lg bg-emerald-200/80 hover:bg-emerald-300 text-emerald-900 text-[10px] font-medium transition-colors"
                      title="Agregar foto por URL web"
                    >
                      + URL
                    </button>
                  </div>
                </div>

                {/* Grid Fotos y Videos Después */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {photosAfter.map((url, i) => (
                    <div key={`pa-${i}`} className="relative group rounded-xl overflow-hidden border border-emerald-300 bg-black aspect-video flex items-center justify-center shadow-xs">
                      <img src={url} alt={`Después ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveMedia('after', 'photo', i)}
                        className="absolute top-1 right-1 p-1 rounded bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                        title="Eliminar foto"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 bg-emerald-900/90 text-white text-[9px] px-1 py-0.5 rounded font-mono">
                        #{i + 1}
                      </span>
                    </div>
                  ))}

                  {videosAfter.map((url, i) => {
                    const vInfo = parseVideoUrl(url);
                    return (
                      <div key={`va-${i}`} className="relative group rounded-xl overflow-hidden border border-emerald-300 bg-black aspect-video flex items-center justify-center shadow-xs">
                        {vInfo.isEmbed ? (
                          <iframe
                            src={vInfo.embedUrl}
                            className="w-full h-full border-0"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                            title={`Video Después ${i + 1}`}
                          />
                        ) : (
                          <video src={url} controls className="w-full h-full object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia('after', 'video', i)}
                          className="absolute top-1 right-1 p-1 rounded bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md z-10"
                          title="Eliminar video"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <span className="absolute bottom-1 left-1 bg-purple-900/90 text-white text-[9px] px-1 py-0.5 rounded flex items-center gap-0.5 font-mono z-10 pointer-events-none">
                          <Video className="w-2.5 h-2.5" /> #{i + 1} {vInfo.isDrive && '(Drive)'}
                        </span>
                      </div>
                    );
                  })}

                  {(!photosAfter.length && !videosAfter.length) && (
                    <div className="col-span-full py-3 text-center text-[11px] text-emerald-700 border border-dashed border-emerald-300 rounded-xl bg-white">
                      Fotos y videos del trabajo terminado (serpentín, turbina y pruebas)
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50/95 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Los datos se sincronizan con el informe de entrega y el portal del cliente.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Cancelar (Esc)"
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

      {/* Modal Enlazar Video Google Drive (NK-014) */}
      {driveModalTarget && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                <Video className="w-5 h-5" />
                <span>Enlazar Video de Google Drive ({driveModalTarget === 'before' ? 'Antes' : 'Después'})</span>
              </div>
              <button
                type="button"
                onClick={() => setDriveModalTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
              <strong className="block font-bold">💡 Ahorro de Servidor y Base de Datos:</strong>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Pega el enlace de video de Google Drive (o YouTube/Loom). Se reproducirá directamente en el portal del cliente sin límites de peso ni saturación.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Enlace o URL compartida de Google Drive:
              </label>
              <input
                type="url"
                value={driveUrlInput}
                onChange={(e) => setDriveUrlInput(e.target.value)}
                placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 focus:outline-none"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDriveModalTarget(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!driveUrlInput.trim()}
                onClick={handleConfirmDriveVideo}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs disabled:opacity-50 cursor-pointer"
              >
                Guardar Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
