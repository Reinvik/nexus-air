import React, { useState, useEffect } from 'react';
import { Customer, AirEquipment, EquipmentType, AirSettings } from '../types';
import { 
  X, 
  UserPlus, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  FileText, 
  Wind, 
  CheckCircle2, 
  Sparkles,
  Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface QuickCreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: AirSettings;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'created_at'>) => Promise<Customer | void> | void;
  onAddEquipment?: (equipment: Omit<AirEquipment, 'id' | 'next_maintenance_date'>) => Promise<AirEquipment | void> | void;
  onCustomerCreated: (customer: Customer, equipment?: AirEquipment) => void;
}

export const QuickCreateCustomerModal: React.FC<QuickCreateCustomerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onAddCustomer,
  onAddEquipment,
  onCustomerCreated,
}) => {
  const defaultCity = settings?.country_code === 'CR' ? 'San José' : 'Santiago';
  const defaultPhone = settings?.country_code === 'CR' ? '+506 ' : '+56 9 ';
  const defaultCommune = settings?.country_code === 'CR' ? 'Central' : 'Las Condes';

  // Customer Form State
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [customerType, setCustomerType] = useState<Customer['customer_type']>('residencial');
  const [phone, setPhone] = useState(defaultPhone);
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [commune, setCommune] = useState(defaultCommune);
  const [city, setCity] = useState(defaultCity);
  const [notes, setNotes] = useState('');

  // Equipment Form State (Optional)
  const [includeEquipment, setIncludeEquipment] = useState(true);
  const [eqBrand, setEqBrand] = useState('Anwo');
  const [eqModel, setEqModel] = useState('Split Inverter');
  const [eqBtu, setEqBtu] = useState(12000);
  const [eqType, setEqType] = useState<EquipmentType>('split_muro');
  const [eqTechnology, setEqTechnology] = useState<'inverter' | 'on_off'>('inverter');
  const [eqLocation, setEqLocation] = useState('Living Comedor');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('El nombre del cliente es obligatorio');
      return;
    }
    if (!phone.trim()) {
      toast.error('El teléfono de contacto es obligatorio');
      return;
    }
    if (!address.trim()) {
      toast.error('La dirección es obligatoria');
      return;
    }
    if (!commune.trim()) {
      toast.error(`La ${settings?.division_label || 'comuna'} es obligatoria`);
      return;
    }

    setIsSubmitting(true);
    try {
      const createdCust = await onAddCustomer({
        name: name.trim(),
        rut: rut.trim() || 'S/RUT',
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        commune: commune.trim(),
        city: city.trim() || defaultCity,
        customer_type: customerType,
        notes: notes.trim(),
      });

      if (!createdCust) {
        throw new Error('No se pudo completar el registro del cliente');
      }

      let createdEq: AirEquipment | undefined = undefined;
      if (includeEquipment && onAddEquipment) {
        try {
          const eqResult = await onAddEquipment({
            customer_id: createdCust.id,
            brand: eqBrand.trim() || 'Anwo',
            model: eqModel.trim() || 'Split Inverter',
            btu: Number(eqBtu) || 12000,
            type: eqType,
            technology: eqTechnology,
            refrigerant: 'R410A',
            location_in_property: eqLocation.trim() || 'Living Comedor',
            last_maintenance_date: new Date().toISOString().split('T')[0],
          });
          if (eqResult) {
            createdEq = eqResult;
          }
        } catch (eqErr) {
          console.warn('Error registrando equipo inicial:', eqErr);
        }
      }

      onCustomerCreated(createdCust, createdEq);
      onClose();
    } catch (err: any) {
      console.error('Error registrando cliente desde ticket:', err);
      toast.error(err?.message || 'Error al guardar el cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto text-slate-900 cursor-default"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 via-cyan-50/30 to-blue-50/30 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Registrar Nuevo Cliente</h3>
              <p className="text-xs text-slate-500">Crea el cliente y asígnalo inmediatamente a este ticket</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
            {/* Información del Cliente */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-800 uppercase tracking-wider">
                <User className="w-4 h-4 text-cyan-600" />
                <span>Datos de Identificación y Contacto</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Completo o Razón Social <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Ariel Mella o Inversiones Clima SpA"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none transition-colors"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {settings?.tax_id_label || 'RUT / Identificación'}
                  </label>
                  <input
                    type="text"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    placeholder="Ej: 17.257.060-7"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Cliente
                  </label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="residencial">🏠 Residencial (Hogar)</option>
                    <option value="comercial">🏢 Comercial (Local / Negocio)</option>
                    <option value="industrial">🏭 Industrial (Planta)</option>
                    <option value="empresarial">🏢 Empresarial (Flota / Gran Cuenta)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono (WhatsApp) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+56 9 1234 5678"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:border-cyan-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="cliente@ejemplo.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Dirección y Ubicación */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dirección (Calle y Número / Depto) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ej: Av. Vitacura 4500, Depto 602"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {settings?.division_label || 'Comuna / Cantón'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    placeholder="Ej: Las Condes"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notas de Acceso o Referencias
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Ej: Tocar timbre 402, conserjería exige carnet, estacionamiento de visitas disponible..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none transition-colors resize-none"
                />
              </div>
            </div>

            {/* Equipo Inicial Opcional */}
            {onAddEquipment && (
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeEquipment}
                      onChange={(e) => setIncludeEquipment(e.target.checked)}
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 cursor-pointer"
                    />
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-cyan-600" />
                      Registrar equipo de climatización inicial para este cliente
                    </span>
                  </label>
                  {includeEquipment && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 font-bold border border-cyan-200">
                      Recomendado
                    </span>
                  )}
                </div>

                {includeEquipment && (
                  <div className="p-4 rounded-2xl bg-cyan-50/40 border border-cyan-200/80 space-y-3 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Marca</label>
                        <input
                          type="text"
                          value={eqBrand}
                          onChange={(e) => setEqBrand(e.target.value)}
                          placeholder="Ej: Anwo, Midea, Clark"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Capacidad BTU</label>
                        <select
                          value={eqBtu}
                          onChange={(e) => setEqBtu(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-cyan-500 focus:outline-none cursor-pointer"
                        >
                          <option value={9000}>9.000 BTU</option>
                          <option value={12000}>12.000 BTU</option>
                          <option value={18000}>18.000 BTU</option>
                          <option value={24000}>24.000 BTU</option>
                          <option value={36000}>36.000 BTU</option>
                          <option value={60000}>60.000 BTU</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipo de Unidad</label>
                        <select
                          value={eqType}
                          onChange={(e) => setEqType(e.target.value as EquipmentType)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-cyan-500 focus:outline-none cursor-pointer"
                        >
                          <option value="split_muro">Split Muro</option>
                          <option value="multisplit">Multisplit</option>
                          <option value="cassette">Cassette</option>
                          <option value="ducto">Ducto</option>
                          <option value="piso_cielo">Piso Cielo</option>
                          <option value="portatil">Portátil</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Ubicación en Inmueble</label>
                        <input
                          type="text"
                          value={eqLocation}
                          onChange={(e) => setEqLocation(e.target.value)}
                          placeholder="Ej: Living Comedor, Dormitorio Principal"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-cyan-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Tecnología Compresor</label>
                        <select
                          value={eqTechnology}
                          onChange={(e) => setEqTechnology(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-cyan-500 focus:outline-none cursor-pointer"
                        >
                          <option value="inverter">Inverter (Eficiencia A+++)</option>
                          <option value="on_off">On / Off Convencional</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 font-bold transition-colors cursor-pointer text-xs"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando Cliente...' : 'Guardar y Asignar al Ticket'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
