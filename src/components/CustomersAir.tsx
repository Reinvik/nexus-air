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
  FileText,
  Building2,
  Layers,
  ChevronDown,
  ChevronRight,
  Filter,
  Boxes
} from 'lucide-react';
import { toast } from 'react-hot-toast';
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

  // Bulk Equipment & Fleet Management State (NK-036)
  const [isBulkEqModalOpen, setIsBulkEqModalOpen] = useState(false);
  const [equipmentViewMode, setEquipmentViewMode] = useState<'grouped' | 'detailed'>('grouped');
  const [btuFilter, setBtuFilter] = useState<number | 'all'>('all');
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<Set<string>>(new Set());

  // Form State for Bulk Equipment Creation
  const [bulkQty, setBulkQty] = useState<number>(10);
  const [bulkBtu, setBulkBtu] = useState<number>(12000);
  const [bulkBrand, setBulkBrand] = useState('Anwo');
  const [bulkModel, setBulkModel] = useState('Inverter Eco 12k');
  const [bulkType, setBulkType] = useState<EquipmentType>('split_muro');
  const [bulkTech, setBulkTech] = useState<'inverter' | 'on_off'>('inverter');
  const [bulkRefrigerant, setBulkRefrigerant] = useState<RefrigerantType>('R410A');
  const [bulkLocationPrefix, setBulkLocationPrefix] = useState('Oficina');
  const [bulkStartNumber, setBulkStartNumber] = useState<number>(1);
  const [bulkSerialPrefix, setBulkSerialPrefix] = useState('');
  const [bulkLastDate, setBulkLastDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.commune.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddCustModalOpen(false);
        setIsEditCustModalOpen(false);
        setIsAddEqModalOpen(false);
        setIsBulkEqModalOpen(false);
        setEquipmentToDelete(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || filteredCustomers[0];
  const selectedEquipments = equipments.filter(e => e.customer_id === selectedCustomer?.id);

  // Lista de BTUs únicos para filtros rápidos
  const uniqueBtus = useMemo(() => {
    const set = new Set<number>();
    selectedEquipments.forEach(e => set.add(e.btu));
    return Array.from(set).sort((a, b) => a - b);
  }, [selectedEquipments]);

  // Equipos filtrados por BTU
  const filteredEquipments = useMemo(() => {
    if (btuFilter === 'all') return selectedEquipments;
    return selectedEquipments.filter(e => e.btu === btuFilter);
  }, [selectedEquipments, btuFilter]);

  // Agrupamiento de flota por BTU, Tipo y Marca (NK-036)
  const equipmentGroups = useMemo(() => {
    const map = new Map<string, {
      key: string;
      btu: number;
      type: EquipmentType;
      brand: string;
      technology: 'inverter' | 'on_off';
      refrigerant: RefrigerantType;
      items: AirEquipment[];
      totalBtu: number;
      totalTons: number;
    }>();

    filteredEquipments.forEach(eq => {
      const key = `${eq.btu}_${eq.type}_${eq.brand || 'Generico'}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          btu: eq.btu,
          type: eq.type,
          brand: eq.brand,
          technology: eq.technology,
          refrigerant: eq.refrigerant,
          items: [],
          totalBtu: 0,
          totalTons: 0,
        });
      }
      const grp = map.get(key)!;
      grp.items.push(eq);
      grp.totalBtu += eq.btu;
      grp.totalTons = Number((grp.totalBtu / 12000).toFixed(1));
    });

    return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length);
  }, [filteredEquipments]);

  const toggleGroupExpand = (key: string) => {
    setExpandedGroupKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleCreateBulkEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    const qty = Math.max(1, Math.min(100, Number(bulkQty) || 1));
    setIsSubmittingBulk(true);
    try {
      for (let i = 0; i < qty; i++) {
        const num = (Number(bulkStartNumber) || 1) + i;
        const loc = bulkLocationPrefix.trim() 
          ? `${bulkLocationPrefix.trim()} ${num}` 
          : `Unidad ${num}`;
        const serial = bulkSerialPrefix.trim() 
          ? `${bulkSerialPrefix.trim()}-${String(num).padStart(2, '0')}` 
          : undefined;

        onAddEquipment({
          customer_id: selectedCustomer.id,
          brand: bulkBrand.trim() || 'Anwo',
          model: bulkModel.trim() || `${bulkBtu} BTU`,
          serial_number: serial,
          btu: bulkBtu,
          type: bulkType,
          technology: bulkTech,
          refrigerant: bulkRefrigerant,
          location_in_property: loc,
          last_maintenance_date: bulkLastDate,
        });
      }
      toast.success(`¡Se agregaron con éxito ${qty} equipos a la flota de ${selectedCustomer.name}!`);
      setIsBulkEqModalOpen(false);
    } catch (err) {
      toast.error('Error al agregar el lote de equipos');
    } finally {
      setIsSubmittingBulk(false);
    }
  };

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
            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <Users className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No hay clientes registrados</p>
                <p className="text-[11px] text-slate-400">Comienza registrando a tus clientes residenciales o comerciales.</p>
                <button
                  type="button"
                  onClick={() => setIsAddCustModalOpen(true)}
                  className="mt-2 text-xs text-cyan-600 hover:text-cyan-700 font-bold underline cursor-pointer inline-block"
                >
                  + Registrar Primer Cliente
                </button>
              </div>
            ) : (
              filteredCustomers.map(c => {
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
                      <span className={`capitalize text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        c.customer_type === 'empresarial' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        c.customer_type === 'comercial' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        c.customer_type === 'industrial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {c.customer_type === 'empresarial' ? '🏢 Empresarial' : c.customer_type}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Customer Details */}
        <div className="lg:col-span-7 space-y-6">
          {selectedCustomer ? (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 space-y-6 shadow-xs">
              {/* Selected Customer Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{selectedCustomer.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                      {settings?.tax_id_label || 'RUT'}: {selectedCustomer.rut}
                    </span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                      selectedCustomer.customer_type === 'empresarial' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                      selectedCustomer.customer_type === 'comercial' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                      selectedCustomer.customer_type === 'industrial' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                      'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {selectedCustomer.customer_type === 'empresarial' ? '🏢 Cuenta Empresarial / Flota' : selectedCustomer.customer_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                    {selectedCustomer.address}, {selectedCustomer.commune} ({selectedCustomer.city})
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
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
                    onClick={() => setIsBulkEqModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold hover:bg-purple-100 transition-all cursor-pointer shadow-xs"
                    title="Agregar múltiples equipos en lote para empresas con flota"
                  >
                    <Boxes className="w-3.5 h-3.5 text-purple-600" />
                    <span>+ Agregar Lote</span>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Wind className="w-4 h-4 text-cyan-600" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Parque de Climatización ({selectedEquipments.length} Equipos)
                    </h4>
                  </div>

                  {/* View Mode Switch (Grouped by BTU vs Detailed Individual) */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setEquipmentViewMode('grouped')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        equipmentViewMode === 'grouped'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Agrupa los equipos por capacidad BTU (Ideal para 30+ equipos empresariales)"
                    >
                      <Layers className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Vista Agrupada por BTU</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEquipmentViewMode('detailed')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        equipmentViewMode === 'detailed'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Muestra tarjetas detalladas individuales de cada unidad"
                    >
                      <Boxes className="w-3.5 h-3.5 text-slate-600" />
                      <span>Vista Individual</span>
                    </button>
                  </div>
                </div>

                {/* Filtros Rápidos por BTU (NK-036) */}
                {selectedEquipments.length > 0 && uniqueBtus.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mr-1">
                      <Filter className="w-3 h-3 text-slate-400" />
                      Filtrar BTU:
                    </span>
                    <button
                      type="button"
                      onClick={() => setBtuFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        btuFilter === 'all'
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Todos ({selectedEquipments.length})
                    </button>
                    {uniqueBtus.map(btu => {
                      const count = selectedEquipments.filter(e => e.btu === btu).length;
                      return (
                        <button
                          key={btu}
                          type="button"
                          onClick={() => setBtuFilter(btuFilter === btu ? 'all' : btu)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            btuFilter === btu
                              ? 'bg-cyan-600 text-white shadow-xs'
                              : 'bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100'
                          }`}
                        >
                          {btu.toLocaleString('es-CL')} BTU ({count})
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedEquipments.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl space-y-2">
                    <Building2 className="w-8 h-8 mx-auto text-slate-300" />
                    <p className="font-bold text-slate-600">Este cliente aún no tiene equipos registrados.</p>
                    <p className="text-slate-400 text-[11px]">
                      Haz clic en "+ Agregar Equipo" para una unidad individual, o "+ Agregar Lote" para flotas de empresas.
                    </p>
                  </div>
                ) : equipmentViewMode === 'grouped' ? (
                  /* VISTA AGRUPADA POR CAPACIDAD (NK-036) */
                  <div className="space-y-3">
                    {equipmentGroups.map(grp => {
                      const isExpanded = expandedGroupKeys.has(grp.key);
                      return (
                        <div
                          key={grp.key}
                          className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs transition-all hover:border-cyan-300"
                        >
                          <div className="p-4 bg-gradient-to-r from-slate-50 via-white to-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-full bg-cyan-600 text-white font-mono font-black text-xs shadow-xs">
                                  {grp.items.length} {grp.items.length === 1 ? 'Unidad' : 'Unidades'}
                                </span>
                                <h5 className="font-black text-slate-900 text-sm">
                                  {grp.brand} {grp.btu.toLocaleString('es-CL')} BTU ({grp.type.replace('_', ' ').toUpperCase()})
                                </h5>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono font-bold">
                                  Gas {grp.refrigerant}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold uppercase">
                                  {grp.technology}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-0.5">
                                <span className="font-bold text-slate-700">Capacidad Total del Lote:</span>
                                <span className="font-mono text-cyan-700 font-black">{grp.totalBtu.toLocaleString('es-CL')} BTU</span>
                                <span>(~{grp.totalTons} Toneladas de refrigeración)</span>
                              </p>
                              <div className="text-[11px] text-slate-400 truncate max-w-xl">
                                <span className="font-medium text-slate-600">Ubicaciones:</span> {grp.items.slice(0, 5).map(it => it.location_in_property).join(', ')}
                                {grp.items.length > 5 ? ` y ${grp.items.length - 5} ubicaciones más...` : ''}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => toggleGroupExpand(grp.key)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer self-start md:self-center shrink-0"
                            >
                              <span>{isExpanded ? 'Ocultar Detalle' : `Ver ${grp.items.length} Equipos`}</span>
                              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          {/* Accordion Detalle de Unidades Individuales */}
                          {isExpanded && (
                            <div className="p-4 bg-slate-50/70 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in duration-150">
                              {grp.items.map(eq => (
                                <div
                                  key={eq.id}
                                  className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs relative group"
                                >
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="truncate">
                                      <div className="text-xs font-bold text-slate-900 truncate">
                                        📍 {eq.location_in_property}
                                      </div>
                                      {eq.serial_number ? (
                                        <div className="text-[10px] font-mono text-cyan-700 font-bold">
                                          S/N: {eq.serial_number}
                                        </div>
                                      ) : (
                                        <div className="text-[10px] text-slate-400">Sin serial asignado</div>
                                      )}
                                    </div>
                                    {onDeleteEquipment && (
                                      <button
                                        type="button"
                                        title="Eliminar este equipo"
                                        onClick={() => setEquipmentToDelete(eq)}
                                        className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-1.5 font-mono">
                                    <span>Próx: {eq.next_maintenance_date}</span>
                                    <span className="text-emerald-700 font-bold">Activo</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* VISTA DETALLADA UNO A UNO */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredEquipments.map(eq => (
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
            <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-3 shadow-xs">
              <Users className="w-12 h-12 mx-auto text-slate-300" />
              <h4 className="font-bold text-slate-700 text-sm">Sin cliente seleccionado</h4>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">
                {customers.length === 0 
                  ? 'Aún no tienes clientes registrados en tu empresa. Añade tu primer cliente para comenzar a gestionar sus equipos de climatización.'
                  : 'Selecciona un cliente de la lista izquierda para consultar sus detalles y parque de equipos.'}
              </p>
              {customers.length === 0 && (
                <button
                  type="button"
                  onClick={() => setIsAddCustModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Primer Cliente</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddCustModalOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddCustModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl cursor-default"
          >
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
                    <option value="empresarial">🏢 Empresarial (Flota / Gran Cuenta)</option>
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
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddEqModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl cursor-default"
          >
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

      {/* Bulk Add Equipment Modal (NK-036) */}
      {isBulkEqModalOpen && selectedCustomer && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsBulkEqModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Carga Masiva de Equipos (Lote)</h3>
                  <p className="text-[11px] text-slate-400">Genera múltiples unidades para {selectedCustomer.name}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsBulkEqModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBulkEquipment} className="space-y-3.5 text-xs">
              <div className="p-3 bg-cyan-50/60 border border-cyan-100 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-cyan-900 font-bold">
                  <span>Resumen del Lote</span>
                  <span className="font-mono text-xs bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full font-bold">
                    {bulkQty} unidades x {bulkBtu.toLocaleString('es-CL')} BTU = {(bulkQty * bulkBtu).toLocaleString('es-CL')} BTU (~{((bulkQty * bulkBtu) / 12000).toFixed(1)} TR)
                  </span>
                </div>
                <p className="text-[11px] text-cyan-700 leading-tight">
                  Se crearán {bulkQty} equipos con ubicaciones correlativas desde "{bulkLocationPrefix} {bulkStartNumber}" hasta "{bulkLocationPrefix} {Number(bulkStartNumber) + Number(bulkQty) - 1}".
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Cantidad de Equipos</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={bulkQty}
                    onChange={(e) => setBulkQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Capacidad BTU</label>
                  <select
                    value={bulkBtu}
                    onChange={(e) => setBulkBtu(parseInt(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:bg-white focus:border-cyan-500 focus:outline-none cursor-pointer"
                  >
                    <option value="9000">9.000 BTU (0.75 TR)</option>
                    <option value="12000">12.000 BTU (1.0 TR)</option>
                    <option value="18000">18.000 BTU (1.5 TR)</option>
                    <option value="24000">24.000 BTU (2.0 TR)</option>
                    <option value="36000">36.000 BTU (3.0 TR)</option>
                    <option value="48000">48.000 BTU (4.0 TR)</option>
                    <option value="60000">60.000 BTU (5.0 TR)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Marca</label>
                  <input
                    type="text"
                    value={bulkBrand}
                    onChange={(e) => setBulkBrand(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                    placeholder="Ej: Anwo, Midea, Clark"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Modelo / Referencia</label>
                  <input
                    type="text"
                    value={bulkModel}
                    onChange={(e) => setBulkModel(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                    placeholder="Ej: Inverter Eco 12k"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Tipo de Unidad</label>
                  <select
                    value={bulkType}
                    onChange={(e) => setBulkType(e.target.value as EquipmentType)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none cursor-pointer"
                  >
                    <option value="split_muro">Split Muro</option>
                    <option value="cassette">Cassette</option>
                    <option value="piso_cielo">Piso Cielo</option>
                    <option value="ducto">Ducto</option>
                    <option value="chiller">Chiller</option>
                    <option value="rooftop">Rooftop</option>
                    <option value="vrf">VRF / VRV</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Tecnología</label>
                  <select
                    value={bulkTech}
                    onChange={(e) => setBulkTech(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none cursor-pointer"
                  >
                    <option value="inverter">Inverter</option>
                    <option value="on_off">On / Off</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Gas Refrigerante</label>
                  <select
                    value={bulkRefrigerant}
                    onChange={(e) => setBulkRefrigerant(e.target.value as RefrigerantType)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none cursor-pointer"
                  >
                    <option value="R410A">R410A</option>
                    <option value="R32">R32</option>
                    <option value="R22">R22</option>
                    <option value="R134a">R134a</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-slate-700 font-semibold block mb-1">Prefijo de Ubicación</label>
                  <input
                    type="text"
                    value={bulkLocationPrefix}
                    onChange={(e) => setBulkLocationPrefix(e.target.value)}
                    placeholder="Ej: Oficina, Habitación, Local"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">N° Inicial</label>
                  <input
                    type="number"
                    min={1}
                    value={bulkStartNumber}
                    onChange={(e) => setBulkStartNumber(parseInt(e.target.value) || 1)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Prefijo Serial (Opcional)</label>
                  <input
                    type="text"
                    value={bulkSerialPrefix}
                    onChange={(e) => setBulkSerialPrefix(e.target.value)}
                    placeholder="Ej: FLOTA-A"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:bg-white focus:border-cyan-500 focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Última Mantención</label>
                  <input
                    type="date"
                    value={bulkLastDate}
                    onChange={(e) => setBulkLastDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBulkEqModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                  disabled={isSubmittingBulk}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBulk}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-md shadow-cyan-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSubmittingBulk ? 'Creando Lote...' : `Crear ${bulkQty} Equipos`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {isEditCustModalOpen && selectedCustomer && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsEditCustModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 cursor-default"
          >
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
                    <option value="empresarial">🏢 Empresarial (Flota / Gran Cuenta)</option>
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
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setEquipmentToDelete(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 cursor-default"
          >
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
