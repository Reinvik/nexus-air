import React, { useState, useMemo } from 'react';
import { Customer, AirEquipment, EquipmentType, RefrigerantType, AirSettings } from '../types';
import { 
  Users, 
  Search, 
  Plus, 
  MapPin, 
  Wind, 
  X, 
  CheckCircle2,
  Edit3,
  Trash2,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

interface CustomersAirProps {
  customers: Customer[];
  equipments: AirEquipment[];
  settings?: AirSettings;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'created_at'>) => void;
  onAddEquipment: (equipment: Omit<AirEquipment, 'id' | 'next_maintenance_date'>) => void;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => void;
  onDeleteEquipment?: (id: string) => void;
}

export const CustomersAir: React.FC<CustomersAirProps> = ({
  customers,
  equipments,
  settings,
  onAddCustomer,
  onAddEquipment,
  onUpdateCustomer,
  onDeleteEquipment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(customers[0]?.id || null);
  const [isAddCustModalOpen, setIsAddCustModalOpen] = useState(false);
  const [isEditCustModalOpen, setIsEditCustModalOpen] = useState(false);
  const [isAddEqModalOpen, setIsAddEqModalOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<AirEquipment | null>(null);

  // New Customer Form State
  const [name, setName] = useState('');
  const [rut, setRut] = useState('');
  const [phone, setPhone] = useState('+56 9 ');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [commune, setCommune] = useState('Las Condes');
  const [city, setCity] = useState('Santiago');
  const [customerType, setCustomerType] = useState<Customer['customer_type']>('residencial');

  // Edit Customer Form State
  const [editName, setEditName] = useState('');
  const [editRut, setEditRut] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editCommune, setEditCommune] = useState('');
  const [editCity, setEditCity] = useState('Santiago');
  const [editCustomerType, setEditCustomerType] = useState<Customer['customer_type']>('residencial');
  const [editNotes, setEditNotes] = useState('');

  // New Equipment Form State
  const [eqBrand, setEqBrand] = useState('Anwo');
  const [eqModel, setEqModel] = useState('Inverter Eco 12k');
  const [eqSerial, setEqSerial] = useState('');
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
    onAddCustomer({
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
      serial_number: eqSerial.trim() || undefined,
      btu: eqBtu,
      type: eqType,
      technology: eqTech,
      refrigerant: eqRefrigerant,
      location_in_property: eqLocation,
      last_maintenance_date: eqLastDate,
    });

    setEqSerial('');
    setIsAddEqModalOpen(false);
  };

  const handleOpenEditCustomer = (cust: Customer) => {
    setEditName(cust.name || '');
    setEditRut(cust.rut || '');
    setEditPhone(cust.phone || '');
    setEditEmail(cust.email || '');
    setEditAddress(cust.address || '');
    setEditCommune(cust.commune || '');
    setEditCity(cust.city || 'Santiago');
    setEditCustomerType(cust.customer_type || 'residencial');
    setEditNotes(cust.notes || '');
    setIsEditCustModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    onUpdateCustomer(selectedCustomer.id, {
      name: editName.trim(),
      rut: editRut.trim(),
      phone: editPhone.trim(),
      email: editEmail.trim(),
      address: editAddress.trim(),
      commune: editCommune.trim(),
      city: editCity.trim(),
      customer_type: editCustomerType,
      notes: editNotes.trim(),
    });
    setIsEditCustModalOpen(false);
  };

  const handleConfirmDeleteEquipment = () => {
    if (!equipmentToDelete || !onDeleteEquipment) return;
    onDeleteEquipment(equipmentToDelete.id);
    setEquipmentToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Clientes & Parque de Climatización</h2>
            <p className="text-xs text-slate-500">
              Directorio de clientes residenciales y comerciales con sus equipos y fechas de servicio
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddCustModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] hover:from-[#38bdf8] hover:to-[#1d4ed8] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Registrar Nuevo Cliente</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customers List */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-4 space-y-4 shadow-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar cliente por nombre o comuna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white transition-colors"
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
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-cyan-50/80 border-cyan-500 text-slate-900 shadow-xs'
                      : 'bg-white border-slate-200/90 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{c.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-slate-100 text-slate-700">
                      {countEq} {countEq === 1 ? 'Aire' : 'Aires'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{c.address}, {c.commune}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
                    <span>{c.phone}</span>
                    <span className="capitalize text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                      {c.customer_type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Customer Details */}
        <div className="lg:col-span-7 space-y-6">
          {selectedCustomer ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-6 shadow-xs">
              {/* Selected Customer Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{selectedCustomer.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                      {settings?.tax_id_label || 'RUT'}: {selectedCustomer.rut}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                    {selectedCustomer.address}, {selectedCustomer.commune} ({selectedCustomer.city})
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleOpenEditCustomer(selectedCustomer)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Editar Cliente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAddEqModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs font-bold hover:bg-cyan-100 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Agregar Equipo</span>
                  </button>
                </div>
              </div>

              {/* Customer AC Units List */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Wind className="w-4 h-4 text-cyan-600" />
                  Equipos de Climatización Instalados ({selectedEquipments.length})
                </h4>

                {selectedEquipments.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    Este cliente aún no tiene equipos registrados. Haz clic en "Agregar Equipo".
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedEquipments.map(eq => (
                      <div
                        key={eq.id}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3 shadow-xs relative group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-cyan-700">{eq.brand}</span>
                            <div className="text-sm font-bold text-slate-900">
                              {eq.btu.toLocaleString('es-CL')} BTU ({eq.type.replace('_', ' ')})
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-mono font-bold">
                              Gas {eq.refrigerant}
                            </span>
                            {onDeleteEquipment && (
                              <button
                                type="button"
                                title="Eliminar equipo"
                                onClick={() => setEquipmentToDelete(eq)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 text-xs space-y-1">
                          <div className="text-slate-600 font-medium">
                            📍 Ubicación: <span className="text-slate-900 font-bold">{eq.location_in_property}</span>
                          </div>
                          {eq.model && <div className="text-[11px] text-slate-400">Modelo: {eq.model}</div>}
                          {eq.serial_number && (
                            <div className="text-[11px] text-cyan-800 font-mono font-bold flex items-center gap-1.5 pt-0.5">
                              <span className="text-slate-500 font-sans font-medium">Serial / Serie:</span>
                              <span className="bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded border border-cyan-200">{eq.serial_number}</span>
                            </div>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                          <div className="text-slate-500">
                            Última: <span className="text-slate-700 font-mono font-semibold">{eq.last_maintenance_date || 'N/A'}</span>
                          </div>
                          <div className="text-cyan-700 font-semibold">
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
            <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
              Selecciona un cliente para ver sus detalles.
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddCustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Nuevo Cliente</h3>
              <button onClick={() => setIsAddCustModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-700 font-medium">Nombre Completo o Razón Social</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none mt-1"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-medium">{settings?.tax_id_label || 'RUT'}</label>
                  <input
                    type="text"
                    value={rut}
                    onChange={(e) => setRut(e.target.value)}
                    placeholder={settings?.tax_id_label || 'RUT / ID'}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium">Tipo</label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none mt-1"
                  >
                    <option value="residencial">Residencial</option>
                    <option value="comercial">Comercial</option>
                    <option value="industrial">Industrial</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-700 font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none mt-1"
                />
              </div>
              <div>
                <label className="text-slate-700 font-medium">Teléfono (WhatsApp)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none mt-1 font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-slate-700 font-medium">Dirección & {settings?.division_label || 'Comuna'}</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <input
                    type="text"
                    value={address}
                    placeholder="Dirección o Calle"
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                  <input
                    type="text"
                    value={commune}
                    placeholder={settings?.division_label || 'Comuna / Cantón'}
                    onChange={(e) => setCommune(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCustModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] text-white font-bold"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Nuevo Equipo para {selectedCustomer.name}</h3>
              <button onClick={() => setIsAddEqModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateEquipment} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-medium">Marca</label>
                  <input
                    type="text"
                    value={eqBrand}
                    onChange={(e) => setEqBrand(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium">Capacidad BTU</label>
                  <select
                    value={eqBtu}
                    onChange={(e) => setEqBtu(parseInt(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                  >
                    <option value="9000">9.000 BTU</option>
                    <option value="12000">12.000 BTU</option>
                    <option value="18000">18.000 BTU</option>
                    <option value="24000">24.000 BTU</option>
                    <option value="36000">36.000 BTU</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-medium">Modelo</label>
                  <input
                    type="text"
                    value={eqModel}
                    placeholder="Ej: Inverter Eco 12k"
                    onChange={(e) => setEqModel(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-medium">N° de Serial / Serie</label>
                  <input
                    type="text"
                    value={eqSerial}
                    placeholder="Ej: SN-2026-X88392"
                    onChange={(e) => setEqSerial(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-medium">Ubicación en el Inmueble</label>
                <input
                  type="text"
                  value={eqLocation}
                  placeholder="Ej: Living Comedor, Dormitorio Principal"
                  onChange={(e) => setEqLocation(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-700 font-medium">Gas Refrigerante</label>
                  <select
                    value={eqRefrigerant}
                    onChange={(e) => setEqRefrigerant(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                  >
                    <option value="R410A">R410A</option>
                    <option value="R32">R32 (Ecológico)</option>
                    <option value="R22">R22</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-medium">Última Mantención</label>
                  <input
                    type="date"
                    value={eqLastDate}
                    onChange={(e) => setEqLastDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 mt-1"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEqModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] text-white font-bold"
                >
                  Guardar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {isEditCustModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Editar Datos del Cliente</h3>
                  <p className="text-[11px] text-slate-400">Modifica los datos de contacto y facturación del cliente</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditCustModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Nombre Completo o Razón Social</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">{settings?.tax_id_label || 'RUT / ID'}</label>
                  <input
                    type="text"
                    value={editRut}
                    onChange={(e) => setEditRut(e.target.value)}
                    placeholder={settings?.tax_id_label ? `Ej: ${settings.tax_id_label}` : '12.345.678-9'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Teléfono Móvil (WhatsApp)</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-slate-700 font-semibold block mb-1">Dirección Completa</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">{settings?.division_label || 'Comuna / Cantón'}</label>
                  <input
                    type="text"
                    value={editCommune}
                    onChange={(e) => setEditCommune(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Tipo de Cliente</label>
                  <select
                    value={editCustomerType}
                    onChange={(e) => setEditCustomerType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:border-cyan-500 focus:outline-none cursor-pointer"
                  >
                    <option value="residencial">Residencial / Hogar</option>
                    <option value="comercial">Comercial / Oficina</option>
                    <option value="industrial">Industrial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Notas / Observaciones de Servicio</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  placeholder="Detalles de acceso, piso, estacionamiento o indicaciones para el técnico..."
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 leading-relaxed focus:bg-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditCustModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00d2ff] to-[#2563eb] hover:from-[#38bdf8] hover:to-[#1d4ed8] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Equipment Confirmation Modal */}
      {equipmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">¿Eliminar este equipo?</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Estás a punto de eliminar el equipo <strong className="text-slate-900">{equipmentToDelete.brand}</strong> ({equipmentToDelete.btu.toLocaleString('es-CL')} BTU) ubicado en <span className="font-semibold text-slate-900">"{equipmentToDelete.location_in_property}"</span>.
                </p>
                <p className="text-[11px] text-rose-500 font-medium pt-1">
                  Esta acción no se puede deshacer y desvinculará este equipo del cliente.
                </p>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEquipmentToDelete(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteEquipment}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/25 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Equipo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
