import React, { useState, useMemo } from 'react';
import { AirPart } from '../types';
import { 
  Boxes, 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle, 
  CheckCircle, 
  Edit, 
  Trash2, 
  TrendingUp, 
  X,
  Save,
  PackageCheck
} from 'lucide-react';

interface InventoryAirProps {
  parts: AirPart[];
  onAddPart: (part: Omit<AirPart, 'id'>) => void;
  onUpdatePart: (id: string, updates: Partial<AirPart>) => void;
  onDeletePart: (id: string) => void;
}

export const InventoryAir: React.FC<InventoryAirProps> = ({
  parts,
  onAddPart,
  onUpdatePart,
  onDeletePart,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<AirPart | null>(null);

  // Form State
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<AirPart['category']>('equipo');
  const [brand, setBrand] = useState('Anwo');
  const [btu, setBtu] = useState(12000);
  const [stock, setStock] = useState(10);
  const [minStock, setMinStock] = useState(3);
  const [costPrice, setCostPrice] = useState(240000);
  const [salePrice, setSalePrice] = useState(349990);
  const [unit, setUnit] = useState<AirPart['unit']>('unidad');
  const [description, setDescription] = useState('');

  const openAddModal = () => {
    setEditingPart(null);
    setSku(`EQ-${Math.floor(1000 + Math.random() * 9000)}`);
    setName('');
    setCategory('equipo');
    setBrand('Anwo');
    setBtu(12000);
    setStock(10);
    setMinStock(3);
    setCostPrice(240000);
    setSalePrice(349990);
    setUnit('unidad');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (part: AirPart) => {
    setEditingPart(part);
    setSku(part.sku);
    setName(part.name);
    setCategory(part.category);
    setBrand(part.brand || '');
    setBtu(part.btu || 12000);
    setStock(part.stock);
    setMinStock(part.min_stock);
    setCostPrice(part.cost_price);
    setSalePrice(part.sale_price);
    setUnit(part.unit);
    setDescription(part.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPart) {
      onUpdatePart(editingPart.id, {
        sku,
        name,
        category,
        brand,
        btu: category === 'equipo' ? btu : undefined,
        stock,
        min_stock: minStock,
        cost_price: costPrice,
        sale_price: salePrice,
        unit,
        description,
      });
    } else {
      onAddPart({
        sku,
        name,
        category,
        brand,
        btu: category === 'equipo' ? btu : undefined,
        stock,
        min_stock: minStock,
        cost_price: costPrice,
        sale_price: salePrice,
        unit,
        description,
      });
    }
    setIsModalOpen(false);
  };

  const filteredParts = useMemo(() => {
    return parts.filter(p => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [parts, searchTerm, selectedCategory]);

  const categories = [
    { id: 'all', label: 'Todo el Catálogo' },
    { id: 'equipo', label: 'Aires Acondicionados' },
    { id: 'refrigerante', label: 'Gases R410A / R32' },
    { id: 'cobre_aislacion', label: 'Cañería Cobre & Armaflex' },
    { id: 'bomba_soporte', label: 'Bombas & Soportes' },
    { id: 'quimico', label: 'Bactericidas & Limpieza' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Inventario de Equipos & Insumos HVAC</h2>
            <p className="text-xs text-slate-400">
              Gestión de stock de splits, gases ecológicos, cobre y químicos
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Agregar Producto / Equipo</span>
        </button>
      </div>

      {/* Categories & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
        <div className="flex items-center gap-1.5 flex-wrap">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por SKU, nombre, marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">SKU & Producto</th>
                <th className="py-3 px-4">Categoría / Marca</th>
                <th className="py-3 px-4">Stock Disponible</th>
                <th className="py-3 px-4">Costo Neto</th>
                <th className="py-3 px-4">Precio Venta (CLP)</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    No se encontraron productos en esta categoría.
                  </td>
                </tr>
              ) : (
                filteredParts.map((p) => {
                  const isLowStock = p.stock <= p.min_stock;
                  const margin = Math.round(((p.sale_price - p.cost_price) / p.sale_price) * 100);

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm">{p.name}</div>
                        <div className="text-[10px] text-cyan-400 font-mono">{p.sku}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="capitalize text-slate-300 font-medium">
                          {p.category.replace('_', ' ')}
                        </span>
                        {p.brand && <div className="text-[10px] text-slate-500">{p.brand}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold text-sm ${isLowStock ? 'text-rose-400' : 'text-slate-200'}`}>
                            {p.stock} {p.unit}s
                          </span>
                          {isLowStock && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] flex items-center gap-1 font-semibold">
                              <AlertTriangle className="w-3 h-3" /> Bajo Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        ${p.cost_price.toLocaleString('es-CL')}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div className="font-bold text-cyan-300 text-sm">
                          ${p.sale_price.toLocaleString('es-CL')}
                        </div>
                        <div className="text-[10px] text-emerald-400">Margen: {margin}%</div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar ${p.name}?`)) onDeletePart(p.id);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-base text-white">
                {editingPart ? 'Editar Producto' : 'Nuevo Producto / Equipo HVAC'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">SKU / Código</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:border-cyan-500 focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="equipo">Aire Acondicionado</option>
                    <option value="refrigerante">Gas Refrigerante</option>
                    <option value="cobre_aislacion">Cañería Cobre / Aislación</option>
                    <option value="bomba_soporte">Bomba / Soporte</option>
                    <option value="quimico">Químico / Sanitizante</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Nombre del Producto</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Split Anwo 12.000 BTU Inverter A++"
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Marca</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                {category === 'equipo' && (
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-300">Capacidad (BTU)</label>
                    <select
                      value={btu}
                      onChange={(e) => setBtu(parseInt(e.target.value))}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="9000">9.000 BTU</option>
                      <option value="12000">12.000 BTU</option>
                      <option value="18000">18.000 BTU</option>
                      <option value="24000">24.000 BTU</option>
                      <option value="36000">36.000 BTU</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Stock Inicial</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Stock Mínimo (Alerta)</label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Costo ($ CLP)</label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Precio Venta ($ CLP)</label>
                  <input
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20"
                >
                  Guardar en Inventario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
