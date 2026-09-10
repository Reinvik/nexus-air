import React, { useState, useEffect } from 'react';
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
import { PublicBookingModal } from './components/PublicBookingModal';
import { LandingNexusAir } from './components/LandingNexusAir';
import { CustomerPortalAir } from './components/CustomerPortalAir';
import { ViewTab, ServiceOrder } from './types';
import { Toaster, toast } from 'react-hot-toast';

type MainView = 'landing' | 'customer' | 'dashboard';

export default function App() {
  const {
    isLoaded,
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
    addTechnician,
    updateTechnician,
    addPart,
    updatePart,
    deletePart,
    updateSettings,
    resetToDefaults,
  } = useAirStore();

  const [view, setView] = useState<MainView>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'customer') return 'customer';
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

  // Modal States
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false);
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // Selected Order for Editing / Inspection
  const [selectedOrder, setSelectedOrder] = useState<ServiceOrder | null>(null);

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

  // Handler for booking from public modal
  const handleConfirmPublicBooking = (bookingData: any) => {
    // Buscar si el cliente ya existe o registrarlo
    let cust = customers.find(c => c.phone.includes(bookingData.phone.replace(/[^0-9]/g, '')));
    if (!cust) {
      cust = addCustomer({
        name: bookingData.name,
        rut: 'S/RUT',
        phone: bookingData.phone,
        email: '',
        address: bookingData.address,
        commune: bookingData.commune,
        city: 'Santiago',
        customer_type: 'residencial',
        notes: bookingData.notes,
      });
    }

    const newOrder = addOrder({
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
          unit_price: bookingData.service_type === 'instalacion' ? settings.standard_installation_price : settings.standard_maintenance_price,
          total: bookingData.service_type === 'instalacion' ? settings.standard_installation_price : settings.standard_maintenance_price,
          type: 'servicio',
        }
      ],
      subtotal: settings.standard_maintenance_price,
      tax: Math.round(settings.standard_maintenance_price * 0.19),
      total: Math.round(settings.standard_maintenance_price * 1.19),
      payment_status: 'pendiente',
    });

    return newOrder;
  };

  // Convert quote to order and open tab
  const handleCreateOrderFromQuote = (orderData: Partial<ServiceOrder>) => {
    const cust = customers[0];
    const newOrder = addOrder({
      ...orderData,
      customer_id: cust.id,
      scheduled_date: new Date().toISOString().split('T')[0],
      scheduled_time_slot: '11:30 - 13:30',
    });
    setActiveTab('dashboard');
  };

  // 1. Vista Landing Pública
  if (view === 'landing') {
    return (
      <>
        <Toaster position="top-right" />
        <LandingNexusAir
          settings={settings}
          onOpenBooking={() => setIsBookingModalOpen(true)}
          onOpenPortal={() => setView('customer')}
          onAdminAccess={() => setView('dashboard')}
        />
        <PublicBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          settings={settings}
          onConfirmBooking={handleConfirmPublicBooking}
        />
      </>
    );
  }

  // 2. Vista Portal de Cliente
  if (view === 'customer') {
    return (
      <>
        <Toaster position="top-right" />
        <CustomerPortalAir
          customers={customers}
          equipments={equipments}
          orders={orders}
          settings={settings}
          onBackToApp={() => setView('dashboard')}
          onOpenBooking={() => setIsBookingModalOpen(true)}
        />
        <PublicBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          settings={settings}
          onConfirmBooking={handleConfirmPublicBooking}
        />
      </>
    );
  }

  // 3. Vista Panel Operativo (Dashboard)
  return (
    <>
      <Toaster position="top-right" />
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewOrder={() => setIsAddOrderModalOpen(true)}
        onOpenLanding={() => setView('landing')}
        onOpenPortal={() => setView('customer')}
        overdueRecaptacionCount={overdueCount}
        activeOrdersCount={activeOrdersCount}
        settings={settings}
      >
        {activeTab === 'dashboard' && (
          <KanbanBoardAir
            orders={orders}
            technicians={technicians}
            onOpenNewOrder={() => setIsAddOrderModalOpen(true)}
            onEditOrder={handleOpenEdit}
            onOpenInspection={handleOpenInspection}
            onUpdateStatus={updateOrderStatus}
          />
        )}

        {activeTab === 'recaptacion' && (
          <RecaptacionSemestral
            reminders={reminders}
            settings={settings}
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
            onCreateOrderFromQuote={handleCreateOrderFromQuote}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryAir
            parts={parts}
            onAddPart={addPart}
            onUpdatePart={updatePart}
            onDeletePart={deletePart}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersAir
            customers={customers}
            equipments={equipments}
            onAddCustomer={addCustomer}
            onAddEquipment={addEquipment}
            onUpdateCustomer={updateCustomer}
          />
        )}

        {activeTab === 'technicians' && (
          <TechniciansAir
            technicians={technicians}
            onAddTechnician={addTechnician}
            onUpdateTechnician={updateTechnician}
          />
        )}

        {activeTab === 'sales' && (
          <SalesAir orders={orders} />
        )}

        {activeTab === 'settings' && (
          <SettingsAir
            settings={settings}
            onUpdateSettings={updateSettings}
            onResetDefaults={resetToDefaults}
          />
        )}
      </Layout>

      {/* Modals */}
      <AddServiceOrderModal
        isOpen={isAddOrderModalOpen}
        onClose={() => setIsAddOrderModalOpen(false)}
        customers={customers}
        equipments={equipments}
        technicians={technicians}
        onAddOrder={addOrder}
      />

      <EditServiceOrderModal
        isOpen={isEditOrderModalOpen}
        onClose={() => {
          setIsEditOrderModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        technicians={technicians}
        onUpdateOrder={updateOrder}
        onDeleteOrder={deleteOrder}
      />

      <InspeccionHVACModal
        isOpen={isInspectionModalOpen}
        onClose={() => {
          setIsInspectionModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onSaveChecklist={updateChecklist}
      />

      <PublicBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        settings={settings}
        onConfirmBooking={handleConfirmPublicBooking}
      />
    </>
  );
}
