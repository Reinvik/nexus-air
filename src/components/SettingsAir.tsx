import React, { useState } from 'react';
import { AirSettings } from '../types';
import { Settings, Save, RotateCcw, MessageSquare, DollarSign, Building, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SettingsAirProps {
  settings: AirSettings;
  onUpdateSettings: (settings: Partial<AirSettings>) => void;
  onResetDefaults: () => void;
}

export const SettingsAir: React.FC<SettingsAirProps> = ({
  settings,
  onUpdateSettings,
  onResetDefaults,
}) => {
  const [formData, setFormData] = useState<AirSettings>(settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Configuración de Nexus Air</h2>
            <p className="text-xs text-slate-500">
              Datos comerciales, valores base y plantillas automatizadas de WhatsApp para recaptación
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm('¿Restaurar todos los datos iniciales de demostración de Nexus Air?')) {
              onResetDefaults();
            }
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs transition-colors cursor-pointer border border-slate-200"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restablecer Demo</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Details */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-cyan-600" />
            Identidad Corporativa
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Razón Social</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Nombre de Fantasía</label>
              <input
                type="text"
                value={formData.fantasy_name}
                onChange={(e) => setFormData(prev => ({ ...prev, fantasy_name: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">RUT Empresa</label>
              <input
                type="text"
                value={formData.rut}
                onChange={(e) => setFormData(prev => ({ ...prev, rut: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">WhatsApp Corporativo</label>
              <input
                type="text"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Dirección Comercial</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Comuna Principal</label>
              <input
                type="text"
                value={formData.commune}
                onChange={(e) => setFormData(prev => ({ ...prev, commune: e.target.value }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Pricing & Maintenance Interval */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            Tarifas Base & Ciclo Semestral
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-700 font-semibold block mb-1">Intervalo Mantención (Meses)</label>
              <input
                type="number"
                value={formData.maintenance_interval_months}
                onChange={(e) => setFormData(prev => ({ ...prev, maintenance_interval_months: parseInt(e.target.value) || 6 }))}
                className="w-full p-2.5 bg-cyan-50 border border-cyan-300 rounded-xl text-cyan-900 font-mono font-bold focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Por defecto: 6 meses (180 días)</span>
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Precio Base Mantención ($ CLP)</label>
              <input
                type="number"
                value={formData.standard_maintenance_price}
                onChange={(e) => setFormData(prev => ({ ...prev, standard_maintenance_price: parseInt(e.target.value) || 0 }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block mb-1">Precio Base Instalación ($ CLP)</label>
              <input
                type="number"
                value={formData.standard_installation_price}
                onChange={(e) => setFormData(prev => ({ ...prev, standard_installation_price: parseInt(e.target.value) || 0 }))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* WhatsApp Templates */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-600" />
            Plantillas Automáticas de WhatsApp
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="text-slate-700 font-semibold block">
                Plantilla de Recaptación Semestral (Cada 6 Meses)
              </label>
              <p className="text-[11px] text-slate-400 mb-1">
                Variables soportadas: {'{cliente}'}, {'{marca}'}, {'{btu}'}, {'{ubicacion}'}, {'{link}'}
              </p>
              <textarea
                rows={4}
                value={formData.whatsapp_template_recaptacion}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_template_recaptacion: e.target.value }))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 leading-relaxed focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-slate-700 font-semibold block">
                Plantilla de Confirmación de Agendamiento
              </label>
              <p className="text-[11px] text-slate-400 mb-1">
                Variables soportadas: {'{cliente}'}, {'{tipo_servicio}'}, {'{fecha}'}, {'{hora}'}, {'{tecnico}'}
              </p>
              <textarea
                rows={2}
                value={formData.whatsapp_template_agendamiento}
                onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_template_agendamiento: e.target.value }))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 leading-relaxed focus:bg-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] hover:from-[#38bdf8] hover:to-[#1d4ed8] text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Configuración</span>
          </button>
        </div>
      </form>
    </div>
  );
};
