import React, { useState } from 'react';
import { Technician } from '../types';
import { Wrench, ShieldCheck, Phone, Mail, Plus, X } from 'lucide-react';

interface TechniciansAirProps {
  technicians: Technician[];
  onAddTechnician: (tech: Omit<Technician, 'id'>) => void;
  onUpdateTechnician: (id: string, updates: Partial<Technician>) => void;
}

export const TechniciansAir: React.FC<TechniciansAirProps> = ({
  technicians,
  onAddTechnician,
  onUpdateTechnician,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [phone, setPhone] = useState('+56 9 ');
  const [email, setEmail] = useState('');
  const [secCertified, setSecCertified] = useState(true);
  const [certNumber, setCertNumber] = useState('SEC-HVAC-');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTechnician({
      name,
      rut,
      phone,
      email,
      sec_certified: secCertified,
      certification_number: secCertified ? certNumber : undefined,
      status: 'disponible',
    });
    setIsModalOpen(false);
    setName('');
    setRut('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Equipo Técnico HVAC & Certificaciones SEC</h2>
            <p className="text-xs text-slate-500">
              Instaladores autorizados con acreditación en manejo seguro de refrigerantes
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] hover:from-[#38bdf8] hover:to-[#1d4ed8] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Registrar Técnico</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {technicians.map((t) => (
          <div
            key={t.id}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 space-y-4 shadow-xs hover:border-cyan-400 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900">{t.name}</h3>
                <span className="text-xs text-slate-400 font-mono">{t.rut}</span>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                t.status === 'disponible' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                t.status === 'en_servicio' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                'bg-slate-100 text-slate-600'
              }`}>
                {t.status.replace('_', ' ')}
              </span>
            </div>

            {/* SEC Badge */}
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-bold">Certificación SEC</span>
              </div>
              <span className="font-mono text-[11px] text-emerald-900 font-bold">
                {t.sec_certified ? (t.certification_number || 'Acreditado') : 'No Registrado'}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-slate-800 font-medium">{t.phone}</span>
              </div>
              {t.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate text-slate-600">{t.email}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Órdenes activas en ruta:</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-900 font-bold font-mono">
                {t.active_orders_count || 1}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Nuevo Técnico HVAC</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-medium">Nombre Completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-medium">RUT</label>
                  <input
                    type="text"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    placeholder="12.345.678-9"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium">Teléfono</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-700 font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                />
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={secCertified}
                    onChange={(e) => setSecCertified(e.target.checked)}
                    className="w-4 h-4 accent-cyan-600 rounded"
                  />
                  <span className="font-bold text-slate-800">Cuenta con Certificación SEC Climatización</span>
                </label>
                {secCertified && (
                  <input
                    type="text"
                    value={certNumber}
                    onChange={(e) => setCertNumber(e.target.value)}
                    placeholder="Número de registro SEC (ej: SEC-HVAC-9940)"
                    className="w-full p-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs"
                  />
                )}
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] text-white font-bold"
                >
                  Guardar Técnico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
