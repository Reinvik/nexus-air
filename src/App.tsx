import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useAirStore } from './hooks/useAirStore';
import { Layout } from './components/Layout';
import { KanbanBoardAir } from './components/KanbanBoardAir';
import { RecaptacionSemestral } from './components/RecaptacionSemestral';
import { AgendaAir } from './components/AgendaAir';
import { ThermalQuoterAir } from './components/ThermalQuoterAir';
import { InventoryAir } from './components/InventoryAir';
import { CustomersAir } from './components/CustomersAir';
import { TechniciansAir } from './components/TechniciansAir';
import { SalesAir } from './components/SalesAir';
import { SettingsAir } from './components/SettingsAir';
import { AddServiceOrderModal } from './components/AddServiceOrderModal';
import { EditServiceOrderModal } from './components/EditServiceOrderModal';
import { InspeccionHVACModal } from './components/InspeccionHVACModal';
import { PublicBookingModal, BookingPrefill } from './components/PublicBookingModal';
import { ReceiptModalAir } from './components/ReceiptModalAir';
import { LandingNexusAir } from './components/LandingNexusAir';
import { LandingTenantAir } from './components/LandingTenantAir';
import { LoginAir } from './components/LoginAir';
import { CustomerPortalAir } from './components/CustomerPortalAir';
import { NexusOwnerAir } from './components/NexusOwnerAir';
import { ViewTab, ServiceOrder, AirSettings, Customer, AirEquipment, ServiceType } from './types';
import { Toaster, toast } from 'react-hot-toast';
import { ShieldAlert } from 'lucide-react';

type MainView = 'landing' | 'tenant_landing' | 'login' | 'customer' | 'dashboard';

export default function App() {
  const { 
    user, 
    profile, 
    loadingAuth, 
    isNexusOwner, 
    effectiveCompanyId, 
    activeCompanyOverride, 
    switchActiveCompany, 
    login, 
    logout 
  } = useAuth();
  const {
    customers,
    equipments,
    technicians,
    parts,
    orders,
    reminders,
    settings,
    addOrder,
    updateOrder,
    updateOrderStatus,
    updateChecklist,
    deleteOrder,
    markReminderContacted,
    scheduleReminderService,
    generateWhatsAppUrl,
    addCustomer,
    updateCustomer,
    addEquipment,
    deleteEquipment,
    addTechnician,
    updateTechnician,
    deleteTechnician,
    addPart,
    updatePart,
    deletePart,
    updateSettings,
    resetToDefaults,
    refreshData,
    fetchPublicCompanyBySlug
  } = useAirStore(effectiveCompanyId);

  // Tenant slug detection (ej: ?t=nexus-air)
  const [tenantSlug] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('t');
    }
    return null;
  });

  const [tenantSettings, setTenantSettings] = useState<AirSettings | null>(null);

  useEffect(() => {
    if (tenantSlug) {
      fetchPublicCompanyBySlug(tenantSlug).then((data) => {
        if (data) {
          setTenantSettings({
            ...settings,
            company_id: data.company_id,
            company_name: data.company_name,
            fantasy_name: data.company_name,
            phone: data.phone || settings.phone,
            email: data.email || settings.email,
            address: data.address || settings.address,
            landing_config: data.landing_config || settings.landing_config
          });
        }
      });
    }
  }, [tenantSlug, fetchPublicCompanyBySlug, settings]);

  const [view, setView] = useState<MainView>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('t')) return 'tenant_landing';
      if (params.get('rut') || params.get('p') || params.get('view') === 'customer') return 'customer';
      if (params.get('view') === 'login') return 'login';
      if (params.get('view') === 'dashboard') return 'dashboard';
    }
    const saved = localStorage.getItem('nexus_air_view');
    return (saved as MainView) || 'landing';
  });

  const [activeTab, setActiveTab] = useState<ViewTab>(() => {
    const saved = localStorage.getItem('nexus_air_tab');
    return (saved as ViewTab) || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('nexus_air_view', view);
  }, [view]);

  useEffect(() => {
    localStorage.setItem('nexus_air_tab', activeTab);
  }, [activeTab]);

  // Si el usuario inicia sesión y estaba en login, ir automáticamente a dashboard
  useEffect(() => {
    if (!loadingAuth && user && view === 'login') {
      setView('dashboard');
    }
  }, [user, loadingAuth, view]);

  // Modal States
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState<BookingPrefill | null>(null);

  const handleOpenBooking = (customer?: Customer, equipment?: AirEquipment, serviceType?: ServiceType, notes?: string) => {
    setBookingPrefill({ customer, equipment, serviceType, notes });
    setIsBookingModalOpen(true);
  };

  // Selected Order for Editing / Inspection / Receipt
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<ServiceOrder | null>(null);

  // Overdue count for alert badge
  const overdueCount = reminders.filter(r => r.status === 'vencido' || r.status === 'por_vencer').length;
  const activeOrdersCount = orders.filter(o => o.status !== 'completado' && o.status !== 'cancelado').length;

  const handleOpenEdit = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setIsEditOrderModalOpen(true);
  };

  const handleOpenInspection = (order: ServiceOrder) => {
    setSelectedOrder(order);
    setIsInspectionModalOpen(true);
  };

  // Handler for booking from public modal (NK-024)
  const handleConfirmPublicBooking = async (bookingData: any) => {
    const cleanPhone = (bookingData.phone || '').replace(/\D/g, '');
    let cust = customers.find(c => {
      const matchRut = bookingData.rut && c.rut && c.rut.toLowerCase() === bookingData.rut.trim().toLowerCase();
      const matchPhone = cleanPhone && (c.phone || '').replace(/\D/g, '').includes(cleanPhone);
      return matchRut || matchPhone;
    });

    if (!cust) {
      cust = await addCustomer({
        name: bookingData.name,
        rut: bookingData.rut?.trim() || 'S/RUT',
        phone: bookingData.phone,
        email: '',
        address: bookingData.address,
        commune: bookingData.commune,
        city: settings.country_code === 'CR' ? 'San José' : 'Santiago',
        customer_type: 'residencial',
        notes: bookingData.notes,
      });
    }

    const price = bookingData.service_type === 'instalacion' 
      ? settings.standard_installation_price 
      : settings.standard_maintenance_price;

    const activeSettings = tenantSettings || settings;
    const taxRate = activeSettings?.tax_rate !== undefined ? Number(activeSettings.tax_rate) : 0.19;
    const taxAmount = Math.round(price * taxRate);
    const totalAmount = price + taxAmount;

    const newOrder = await addOrder({
      customer_id: cust.id,
      service_type: bookingData.service_type,
      status: 'ingresado',
      scheduled_date: bookingData.scheduled_date,
      scheduled_time_slot: bookingData.scheduled_time_slot,
      description: bookingData.notes || `Solicitud pública de ${bookingData.service_type.replace('_', ' ')}`,
      items: [
        {
          id: `it-${Date.now()}`,
          description: `Servicio ${bookingData.service_type.replace('_', ' ')}`,
          quantity: 1,
          unit_price: price,
          total: price,
          type: 'servicio',
        }
      ],
      subtotal: price,
      tax: taxAmount,
      total: totalAmount,
      payment_status: 'pendiente',
    });

    return newOrder;
  };

  // Convert quote to order and open tab
  const handleCreateOrderFromQuote = async (orderData: Partial<ServiceOrder>) => {
    const cust = customers[0];
    await addOrder({
      ...orderData,
      customer_id: cust?.id || '',
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time_slot: '11:30 - 13:30',
    });
    setActiveTab('dashboard');
  };

  // 1. Vista Landing de Empresa / Tenant (?t=slug)
  if (view === 'tenant_landing') {
    const currentSettings = tenantSettings || settings;
    return (
      <>
        <Toaster position="top-right" />
        <LandingTenantAir
          settings={currentSettings}
          onOpenBooking={() => handleOpenBooking()}
          onOpenPortal={() => setView('customer')}
          onAdminAccess={() => setView('login')}
        />
        {isBookingModalOpen && (
          <PublicBookingModal
            isOpen={isBookingModalOpen}
            onClose={() => {
              setIsBookingModalOpen(false);
              setBookingPrefill(null);
            }}
            settings={currentSettings}
            customers={customers}
            prefill={bookingPrefill}
            onConfirmBooking={handleConfirmPublicBooking}
          />
        )}
      </>
    );
  }

  // 2. Vista Landing Institucional SaaS Nexus Air
  if (view === 'landing') {
    return (
      <>
        <Toaster position="top-right" />
        <LandingNexusAir
          settings={settings}
          onOpenBooking={() => handleOpenBooking()}
          onOpenPortal={() => setView('customer')}
          onAdminAccess={() => setView('login')}
        />
        <PublicBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setBookingPrefill(null);
          }}
          settings={settings}
          customers={customers}
          prefill={bookingPrefill}
          onConfirmBooking={handleConfirmPublicBooking}
        />
      </>
    );
  }

  // 3. Vista Login Oficial Smartlean
  if (view === 'login') {
    return (
      <>
        <Toaster position="top-right" />
        <LoginAir
          onLogin={login}
          onQuickDemoAccess={() => setView('dashboard')}
          onBackToLanding={() => setView(tenantSlug ? 'tenant_landing' : 'landing')}
          onOpenCustomerPortal={() => setView('customer')}
          onOpenBooking={() => handleOpenBooking()}
        />
        <PublicBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setBookingPrefill(null);
          }}
          settings={tenantSettings || settings}
          customers={customers}
          prefill={bookingPrefill}
          onConfirmBooking={handleConfirmPublicBooking}
        />
      </>
    );
  }

  // 4. Vista Portal de Cliente ("Mi Climatización")
  if (view === 'customer') {
    return (
      <>
        <Toaster position="top-right" />
        <CustomerPortalAir
          customers={customers}
          equipments={equipments}
          orders={orders}
          settings={tenantSettings || settings}
          onBackToApp={() => setView(user ? 'dashboard' : (tenantSlug ? 'tenant_landing' : 'landing'))}
          onOpenBooking={(cust, eq) => handleOpenBooking(cust, eq, 'mantencion_preventiva')}
        />
        <PublicBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setBookingPrefill(null);
          }}
          settings={tenantSettings || settings}
          customers={customers}
          prefill={bookingPrefill}
          onConfirmBooking={handleConfirmPublicBooking}
        />
      </>
    );
  }

  // 5. Vista Panel Operativo (Dashboard)
  const currentProfile = profile || {
    email: user?.email || 'admin@nexusair.cl',
    full_name: profile?.full_name || user?.email?.split('@')[0] || 'Administrador HVAC',
    role: profile?.role || 'admin',
    company_id: effectiveCompanyId
  };

  return (
    <>
      <Toaster position="top-right" />
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewOrder={() => setIsAddOrderModalOpen(true)}
        onOpenLanding={() => setView(tenantSlug ? 'tenant_landing' : 'landing')}
        onOpenPortal={() => setView('customer')}
        overdueRecaptacionCount={overdueCount}
        activeOrdersCount={activeOrdersCount}
        settings={settings}
        currentUserProfile={currentProfile}
        isNexusOwner={isNexusOwner}
        onLogout={async () => {
          await logout();
          setView('landing');
          toast.success('Sesión cerrada correctamente');
        }}
      >
        {activeTab === 'dashboard' && (
          <KanbanBoardAir
            orders={orders}
            technicians={technicians}
            onOpenNewOrder={() => setIsAddOrderModalOpen(true)}
            onEditOrder={handleOpenEdit}
            onOpenInspection={handleOpenInspection}
            onUpdateStatus={updateOrderStatus}
            onOpenReceipt={(ord) => setReceiptOrder(ord)}
          />
        )}

        {activeTab === 'recaptacion' && (
          <RecaptacionSemestral
            reminders={reminders}
            settings={settings}
            orders={orders}
            onMarkContacted={markReminderContacted}
            onScheduleService={scheduleReminderService}
            generateWhatsAppUrl={generateWhatsAppUrl}
          />
        )}

        {activeTab === 'agenda' && (
          <AgendaAir
            orders={orders}
            technicians={technicians}
            onOpenNewOrder={() => setIsAddOrderModalOpen(true)}
            onSelectOrder={handleOpenEdit}
          />
        )}

        {activeTab === 'cotizador' && (
          <ThermalQuoterAir
            parts={parts}
            settings={settings}
            customers={customers}
            onCreateOrderFromQuote={handleCreateOrderFromQuote}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryAir
            parts={parts}
            settings={tenantSettings || settings}
            onAddPart={addPart}
            onUpdatePart={updatePart}
            onDeletePart={deletePart}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersAir
            customers={customers}
            equipments={equipments}
            settings={settings}
            onAddCustomer={addCustomer}
            onAddEquipment={addEquipment}
            onUpdateCustomer={updateCustomer}
            onDeleteEquipment={deleteEquipment}
          />
        )}

        {activeTab === 'technicians' && (
          <TechniciansAir
            technicians={technicians}
            orders={orders}
            settings={tenantSettings || settings}
            onAddTechnician={addTechnician}
            onUpdateTechnician={updateTechnician}
            onDeleteTechnician={deleteTechnician}
          />
        )}

        {activeTab === 'sales' && (
          <SalesAir 
            orders={orders} 
            settings={tenantSettings || settings}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsAir
            settings={settings}
            onUpdateSettings={updateSettings}
            onResetDefaults={resetToDefaults}
          />
        )}

        {activeTab === 'nexus_owner' && (
          isNexusOwner ? (
            <NexusOwnerAir
              currentProfile={currentProfile}
              currentCompanyId={effectiveCompanyId}
              activeCompanyOverride={activeCompanyOverride}
              onSwitchActiveCompany={switchActiveCompany}
              onReloadStoreData={refreshData}
            />
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-rose-200 text-center max-w-lg mx-auto my-12 space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Acceso Restringido</h3>
              <p className="text-xs text-slate-500">
                El módulo Nexus Owner es exclusivo para cuentas con rol de Nexus Owner o directiva de la plataforma.
              </p>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer hover:bg-slate-800"
              >
                Volver al Dashboard
              </button>
            </div>
          )
        )}
      </Layout>

      {/* Modales Globales */}
      {isAddOrderModalOpen && (
        <AddServiceOrderModal
          isOpen={isAddOrderModalOpen}
          onClose={() => setIsAddOrderModalOpen(false)}
          customers={customers}
          equipments={equipments}
          technicians={technicians}
          settings={tenantSettings || settings}
          onAddOrder={addOrder}
        />
      )}

      {isEditOrderModalOpen && selectedOrder && (
        <EditServiceOrderModal
          isOpen={isEditOrderModalOpen}
          onClose={() => {
            setIsEditOrderModalOpen(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
          technicians={technicians}
          settings={tenantSettings || settings}
          onOpenReceipt={(ord) => {
            setIsEditOrderModalOpen(false);
            setReceiptOrder(ord);
          }}
          onUpdateOrder={updateOrder}
          onDeleteOrder={deleteOrder}
        />
      )}

      {isInspectionModalOpen && selectedOrder && (
        <InspeccionHVACModal
          isOpen={isInspectionModalOpen}
          onClose={() => {
            setIsInspectionModalOpen(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
          onSaveChecklist={updateChecklist}
        />
      )}

      {isBookingModalOpen && (
        <PublicBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setBookingPrefill(null);
          }}
          settings={tenantSettings || settings}
          customers={customers}
          prefill={bookingPrefill}
          onConfirmBooking={handleConfirmPublicBooking}
        />
      )}

      {Boolean(receiptOrder) && (
        <ReceiptModalAir
          isOpen={Boolean(receiptOrder)}
          onClose={() => setReceiptOrder(null)}
          order={receiptOrder}
          settings={tenantSettings || settings}
        />
      )}
    </>
  );
}
