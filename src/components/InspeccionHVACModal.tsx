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
  Wind
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
  }));

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
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  };
  if (deltaT < 8) {
    deltaTStatus = {
      text: 'Deficiente (Revisar posible fuga de gas o turbina sucia)',
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    };
  } else if (deltaT < 10) {
    deltaTStatus = {
      text: 'Aceptable (Límite operacional)',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    };
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Ficha Técnica & Checklist HVAC
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 font-mono">
                  {order.ticket_number}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {order.customer?.name} • {order.equipment ? `${order.equipment.brand} ${order.equipment.btu} BTU (${order.equipment.refrigerant})` : 'Equipo HVAC'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Checklist Protocol */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Wind className="w-4 h-4" />
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
                        ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    )}
                    <span className="text-xs font-medium leading-relaxed">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thermodynamic Measurements */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Medición de Parámetros Termodinámicos y Eléctricos
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Delta T */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                  Salto Térmico ΔT (°C)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={checklist.delta_t_celsius || ''}
                    onChange={(e) => setChecklist(prev => ({ ...prev, delta_t_celsius: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400">°C</span>
                </div>
                <div className={`text-[10px] px-2 py-1 rounded-lg border font-medium ${deltaTStatus.color}`}>
                  {deltaTStatus.text}
                </div>
              </div>

              {/* Suction Pressure PSI */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-blue-400" />
                  Presión de Succión (PSI)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    value={checklist.suction_pressure_psi || ''}
                    onChange={(e) => setChecklist(prev => ({ ...prev, suction_pressure_psi: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400">PSI</span>
                </div>
                <p className="text-[10px] text-slate-400">R410A: 110-130 PSI / R32: 120-135 PSI</p>
              </div>

              {/* Amperage */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Consumo Eléctrico (A)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={checklist.amperage_amps || ''}
                    onChange={(e) => setChecklist(prev => ({ ...prev, amperage_amps: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                  <span className="text-xs text-slate-400">A</span>
                </div>
                <p className="text-[10px] text-slate-400">Verificar con placa del compresor</p>
              </div>
            </div>
          </div>

          {/* Observations and Notes */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-slate-300">
              Observaciones del Técnico para el Informe del Cliente:
            </label>
            <textarea
              rows={3}
              value={checklist.technician_notes || ''}
              onChange={(e) => setChecklist(prev => ({ ...prev, technician_notes: e.target.value }))}
              placeholder="Ej: Se realizó prueba de calor y frío. Desagüe libre de sarro. Se recomienda próxima mantención preventiva en 6 meses antes de verano..."
              className="w-full p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Los datos se sincronizan con el informe de entrega y el portal del cliente.
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
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
