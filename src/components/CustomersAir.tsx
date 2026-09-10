import React, { useState, useMemo } from 'react';
import { Customer, AirEquipment, EquipmentType, RefrigerantType } from '../types';
import { 
  Users, 
  Search, 
  Plus, 
  MapPin, 
  Phone, 
  Mail, 
  Wind, 
  Clock, 
  ChevronRight, 
  X, 
  Wrench,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

interface CustomersAirProps {
  customers: Customer[];
  equipments: AirEquipment[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'created_at'>) => void;
  onAddEquipment: (equipment: Omit<AirEquipment, 'id' | 'next_maintenance_date'>) => void;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => void;
}

export const CustomersAir: React.FC<CustomersAirProps> = ({
  customers,
  equipments,
  onAddCustomer,
  onAddEquipment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(customers[0]?.id || null);
  const [isAddCustModalOpen, setIsAddCustModalOpen] = useState(false);
  const [isAddEqModalOpen, setIsAddEqModalOpen] = useState(false);

  // New Customer Form State
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [phone, setPhone] = useState('+56 9 ');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [commune, setCommune] = useState('Las Condes');
  const [city, setCity] = useState('Santiago');
  const [customerType, setCustomerType] = useState<Customer['customer_type']>('residencial');

  // New Equipment Form State
  const [eqBrand, setEqBrand] = useState('Anwo');
  const [eqModel, setEqModel] = useState('Inverter Eco 12k');
  const [eqBtu, setEqBtu] = useState(12000);
  const [eqType, setEqType] = useState<EquipmentType>('split_muro');
  const [eqTech, setEqTech] = useState<'inverter' | 'on_off'>('inverter');
  const [eqRefrigerant, setEqRefrigerant] = useState<RefrigerantType>('R410A');
  const [eqLocation, setEqLocation] = useState('Living Comedor');
  const [eqLastDate, setEqLastDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const filteredCustomers = useMemo(() => {
    return customers.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.commune.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || filteredCustomers[0];
  const selectedEquipments = equipments.filter(e => e.customer_id === selectedCustomer?.id);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const newCust = onAddCustomer({
      name,
      rut,
      phone,
      email,
      address,
      commune,
      city,
      customer_type: customerType,
    });
    setIsAddCustModalOpen(false);
    setName('');
    setRut('');
  };

  const handleCreateEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    onAddEquipment({
      customer_id: selectedCustomer.id,
      brand: eqBrand,
      model: eqModel,
      btu: eqBtu,
      type: eqType,
      technology: eqTech,
      refrigerant: eqRefrigerant,
      location_in_property: eqLocation,
      last_maintenance_date: eqLastDate,
    });

    setIsAddEqModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Clientes & Parque de Climatización</h2>
            <p className="text-xs text-slate-400">
              Directorio de clientes residenciales y comerciales con sus equipos y fechas de servicio
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddCustModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Registrar Nuevo Cliente</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customers List */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-4 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar cliente por nombre o comuna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredCustomers.map(c => {
              const isSelected = selectedCustomer?.id === c.id;
              const countEq = equipments.filter(e => e.customer_id === c.id).length;

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-cyan-500/15 border-cyan-500/40 text-white shadow-md shadow-cyan-500/10'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{c.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-800 text-cyan-300">
                      {countEq} {countEq === 1 ? 'Aire' : 'Aires'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{c.address}, {c.commune}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
                    <span>{c.phone}</span>
                    <span className="capitalize text-[10px] px-1.5 py-0.2 rounded bg-slate-800">
                      {c.customer_type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Customer Details & Their AC Units */}
        <div className="lg:col-span-7 space-y-6">
          {selectedCustomer ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
              {/* Selected Customer Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">{selectedCustomer.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                      RUT: {selectedCustomer.rut}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    {selectedCustomer.address}, {selectedCustomer.commune} ({selectedCustomer.city})
                  </p>
                </div>

                <button
                  onClick={() => setIsAddEqModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold hover:bg-cyan-500/30 transition-all cursor-pointer self-start"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Agregar Equipo</span>
                </button>
              </div>

              {/* Customer AC Units List */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  Equipos de Climatización Instalados ({selectedEquipments.length})
                </h4>

                {selectedEquipments.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                    Este cliente aún no tiene equipos registrados. Haz clic en "Agregar Equipo".
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedEquipments.map(eq => (
                      <div
                        key={eq.id}
                        className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-cyan-400">{eq.brand}</span>
                            <div className="text-sm font-bold text-white">
                              {eq.btu.toLocaleString('es-CL')} BTU ({eq.type.replace('_', ' ')})
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                            Gas {eq.refrigerant}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs space-y-1">
                          <div className="text-slate-300 font-medium">
                            📍 Ubicación: <span className="text-white font-bold">{eq.location_in_property}</span>
                          </div>
                          {eq.model && <div className="text-[11px] text-slate-400">Modelo: {eq.model}</div>}
                        </div>

                        {/* Recaptación 6M info */}
                        <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                          <div className="text-slate-400">
                            Último servicio: <span className="text-slate-300 font-mono">{eq.last_maintenance_date || 'N/A'}</span>
                          </div>
                          <div className="text-cyan-400 font-medium">
                            Próxima: <span className="font-mono">{eq.next_maintenance_date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
              Selecciona un cliente para ver sus detalles.
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddCustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Nuevo Cliente</h3>
              <button onClick={() => setIsAddCustModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium">Nombre Completo o Razón Social</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none mt-1"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-medium">RUT</label>
                  <input
                    type="text"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    placeholder="12.345.678-9"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium">Tipo</label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value as any)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none mt-1"
                  >
                    <option value="residencial">Residencial</option>
                    <option value="comercial">Comercial</option>
                    <option value="industrial">Industrial</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-300 font-medium">Teléfono (WhatsApp)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none mt-1 font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-slate-300 font-medium">Dirección & Comuna</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <input
                    type="text"
                    value={address}
                    placeholder="Calle y Número / Depto"
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    value={commune}
                    placeholder="Comuna (ej: Las Condes)"
                    onChange={(e) => setCommune(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCustModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Equipment Modal */}
      {isAddEqModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Nuevo Equipo para {selectedCustomer.name}</h3>
              <button onClick={() => setIsAddEqModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateEquipment} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-medium">Marca</label>
                  <input
                    type="text"
                    value={eqBrand}
                    onChange={(e) => setEqBrand(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium">Capacidad BTU</label>
                  <select
                    value={eqBtu}
                    onChange={(e) => setEqBtu(parseInt(e.target.value))}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white mt-1"
                  >
                    <option value="9000">9.000 BTU</option>
                    <option value="12000">12.000 BTU</option>
                    <option value="18000">18.000 BTU</option>
                    <option value="24000">24.000 BTU</option>
                    <option value="36000">36.000 BTU</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium">Ubicación en el Inmueble</label>
                <input
                  type="text"
                  value={eqLocation}
                  placeholder="Ej: Living Comedor, Dormitorio Principal, Sala Servidores"
                  onChange={(e) => setEqLocation(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-medium">Gas Refrigerante</label>
                  <select
                    value={eqRefrigerant}
                    onChange={(e) => setEqRefrigerant(e.target.value as any)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white mt-1"
                  >
                    <option value="R410A">R410A</option>
                    <option value="R32">R32 (Ecológico)</option>
                    <option value="R22">R22</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 font-medium">Última Mantención</label>
                  <input
                    type="date"
                    value={eqLastDate}
                    onChange={(e) => setEqLastDate(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white mt-1"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEqModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Guardar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
