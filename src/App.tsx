import React, { useState, useEffect, useMemo } from 'react';
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
import { PayrollAir } from './components/PayrollAir';
import { SalesAir } from './components/SalesAir';
import { SettingsAir } from './components/SettingsAir';
import { FinanceModuleAir } from './components/FinanceModuleAir';
import { AddServiceOrderModal } from './components/AddServiceOrderModal';
import { EditServiceOrderModal } from './components/EditServiceOrderModal';
import { InspeccionHVACModal } from './components/InspeccionHVACModal';
import { PublicBookingModal, BookingPrefill } from './components/PublicBookingModal';
import { ReceiptModalAir } from './components/ReceiptModalAir';
import { LandingNexusAir } from './components/LandingNexusAir';
import { LandingSolagoAir } from './components/LandingSolagoAir';
import { LandingTenantAir } from './components/LandingTenantAir';
import { LandingEditorAir } from './components/LandingEditorAir';
import { LoginAir } from './components/LoginAir';
import { CustomerPortalAir } from './components/CustomerPortalAir';
import { NexusOwnerAir } from './components/NexusOwnerAir';
import { ViewTab, ServiceOrder, AirSettings, Customer, AirEquipment, ServiceType, canUserAccessTab } from './types';
import { Toaster, toast } from 'react-hot-toast';
import { ShieldAlert } from 'lucide-react';
import { useBrand } from './lib/brandConfig';

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

  // Tenant slug detection (ej: ?t=nexus-air o dominio personalizado www.venefrio.com)
  const [tenantSlug] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const querySlug = params.get('t');
      if (querySlug) return querySlug;

      const host = window.location.hostname.toLowerCase();
      if (host.includes('venefrio')) return 'venefrio';
      if (host.includes('shaddai')) return 'shaddai-air';
    }
    return null;
  });

  const [tenantSettings, setTenantSettings] = useState<AirSettings | null>(null);

  // NK-038: Identificar la empresa activa garantizando aislamiento y persistencia en Supabase
  const activeTenantCompanyId = tenantSettings?.company_id || null;
  const targetCompanyId = activeCompanyOverride || (user ? profile?.company_id : activeTenantCompanyId) || activeTenantCompanyId || effectiveCompanyId;

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
    deleteCustomer,
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
    fetchPublicCompanyBySlug,
    technicianPayouts,
    addTechnicianPayout,
    deleteTechnicianPayout,
    fixedCosts,
    expenses,
    financeSettings,
    updateFixedCosts,
    addExpense,
    updateExpense,
    deleteExpense,
    updateFinanceSettings,
    recurringSchedules,
    addRecurringSchedule,
    updateRecurringSchedule,
    deleteRecurringSchedule,
    confirmAndScheduleRecurringOrder,
    generateWhatsAppRecurringUrl
  } = useAirStore(targetCompanyId);

  const { isSolago, brand } = useBrand();

  const effectiveSettings = useMemo(() => {
    const base = tenantSettings || settings;
    if (isSolago && (!base.fantasy_name || base.fantasy_name === 'Nexus Air' || base.fantasy_name === 'Mi Empresa Climatizadora')) {
      return {
        ...base,
        fantasy_name: 'SoLago Air',
        company_name: base.company_name === 'Nexus Air Climatización SpA' || base.company_name === 'Mi Empresa Climatizadora' ? 'SoLago Air' : base.company_name,
        company_slogan: base.company_slogan || 'Software Online para Locales y Climatización Inteligente',
        logo_url: base.logo_url || '/brands/solago/solago-emblem.png',
      };
    }
    return base;
  }, [tenantSettings, settings, isSolago]);

  // Wrapper para guardar ajustes sincronizando tanto el store como tenantSettings
  const handleUpdateSettings = async (updates: Partial<AirSettings>): Promise<void> => {
    await updateSettings(updates);
    if (tenantSettings) {
      setTenantSettings(prev => prev ? ({ ...prev, ...updates }) : null);
    }
  };

  useEffect(() => {
    if (tenantSlug) {
      fetchPublicCompanyBySlug(tenantSlug).then((data) => {
        if (data) {
          setTenantSettings({
            ...settings,
            company_id: data.company_id,
            company_name: data.company_name || settings.company_name,
            fantasy_name: data.fantasy_name || data.company_name || settings.fantasy_name,
            company_slug: data.company_slug || settings.company_slug,
            logo_url: data.logo_url || settings.logo_url,
            company_slogan: data.company_slogan || settings.company_slogan,
            phone: data.phone || settings.phone,
            whatsapp_number: data.whatsapp_number || data.phone || settings.whatsapp_number,
            email: data.email || settings.email,
            address: data.address || settings.address,
            city: data.city || settings.city,
            commune: data.commune || settings.commune,
            country: data.country || settings.country,
            country_code: data.country_code || settings.country_code || (data.country === 'Costa Rica' ? 'CR' : 'CL'),
            currency_symbol: data.currency_symbol || settings.currency_symbol,
            currency_code: data.currency_code || settings.currency_code,
            tax_id_label: data.tax_id_label || settings.tax_id_label,
            tax_rate: data.tax_rate !== undefined && data.tax_rate !== null ? Number(data.tax_rate) : settings.tax_rate,
            tax_name: data.tax_name || settings.tax_name,
            division_label: data.division_label || settings.division_label,
            warranty_months: data.warranty_months !== undefined && data.warranty_months !== null ? Number(data.warranty_months) : settings.warranty_months,
            coverage_communes: data.coverage_communes || settings.coverage_communes,
            landing_config: data.landing_config || settings.landing_config,
            maintenance_interval_months: data.maintenance_interval_months !== undefined && data.maintenance_interval_months !== null 
              ? Number(data.maintenance_interval_months) 
              : (settings.maintenance_interval_months || 6),
            quality_control_days: data.quality_control_days !== undefined && data.quality_control_days !== null 
              ? Number(data.quality_control_days) 
              : (settings.quality_control_days || 7),
            inactive_recovery_months: data.inactive_recovery_months !== undefined && data.inactive_recovery_months !== null 
              ? Number(data.inactive_recovery_months) 
              : (settings.inactive_recovery_months || 9),
            pre_expiration_warning_days: data.pre_expiration_warning_days !== undefined && data.pre_expiration_warning_days !== null 
              ? Number(data.pre_expiration_warning_days) 
              : (settings.pre_expiration_warning_days || 15),
            standard_maintenance_price: data.standard_maintenance_price !== undefined && data.standard_maintenance_price !== null
              ? Number(data.standard_maintenance_price)
              : (settings.standard_maintenance_price || 45000),
            default_apply_tax: data.default_apply_tax !== undefined ? data.default_apply_tax : settings.default_apply_tax,
            default_tax_mode: data.default_tax_mode || settings.default_tax_mode,
            bank_name: data.bank_name || settings.bank_name,
            bank_account_type: data.bank_account_type || settings.bank_account_type,
            bank_account_number: data.bank_account_number || settings.bank_account_number,
            bank_account_rut: data.bank_account_rut || settings.bank_account_rut,
            bank_account_email: data.bank_account_email || settings.bank_account_email,
            whatsapp_template_cobro: data.whatsapp_template_cobro || settings.whatsapp_template_cobro,
            admin_pin: data.admin_pin || settings.admin_pin,
          });
        }
      });
    }
  }, [tenantSlug, fetchPublicCompanyBySlug, settings]);

  const [view, setView] = useState<MainView>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('rut') || params.get('p') || params.get('view') === 'customer') return 'customer';
      if (params.get('view') === 'login') return 'login';
      if (params.get('view') === 'dashboard') return 'dashboard';
      if (params.get('t')) return 'tenant_landing';

      const host = window.location.hostname.toLowerCase();
      if (host.includes('venefrio') || host.includes('shaddai')) {
        return 'tenant_landing';
      }
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
  const [dashboardSearchTerm, setDashboardSearchTerm] = useState('');

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
          onOpenBooking={(svcTitle) => handleOpenBooking(undefined, undefined, undefined, svcTitle ? `Servicio solicitado: ${svcTitle}` : undefined)}
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

  // 2. Vista Landing Institucional SaaS (Nexus Air o SoLago Air según marca activa)
  if (view === 'landing') {
    return (
      <>
        <Toaster position="top-right" />
        {isSolago ? (
          <LandingSolagoAir
            settings={effectiveSettings}
            onOpenBooking={() => handleOpenBooking()}
            onOpenPortal={() => setView('customer')}
            onAdminAccess={() => setView('login')}
          />
        ) : (
          <LandingNexusAir
            settings={effectiveSettings}
            onOpenBooking={() => handleOpenBooking()}
            onOpenPortal={() => setView('customer')}
            onAdminAccess={() => setView('login')}
          />
        )}
        <PublicBookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setBookingPrefill(null);
          }}
          settings={effectiveSettings}
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
          isStaff={Boolean(user)}
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

  // NK-067: Control de seguridad de pestaña activa según permisos de rol
  useEffect(() => {
    if (view === 'dashboard') {
      const userRole = currentProfile?.role || 'admin';
      const permissions = effectiveSettings?.role_permissions;
      if (!canUserAccessTab(activeTab, userRole, isNexusOwner, permissions)) {
        const allPossibleTabs: ViewTab[] = [
          'dashboard', 'agenda', 'recaptacion', 'cotizador', 
          'inventory', 'customers', 'technicians', 'payroll', 
          'sales', 'finances', 'landingpage', 'settings'
        ];
        const allowedFallback = allPossibleTabs.find(t => 
          canUserAccessTab(t, userRole, isNexusOwner, permissions)
        ) || 'dashboard';
        setActiveTab(allowedFallback);
      }
    }
  }, [activeTab, currentProfile?.role, isNexusOwner, effectiveSettings?.role_permissions, view]);

  return (
    <>
      <Toaster position="top-right" />
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewOrder={() => setIsAddOrderModalOpen(true)}
        onOpenLanding={() => {
          const slug = tenantSlug || settings.company_slug || (isSolago ? 'solago-air' : 'nexus-air');
          window.open(`/?t=${slug}`, '_blank');
        }}
        onOpenPortal={() => setView('customer')}
        overdueRecaptacionCount={overdueCount}
        activeOrdersCount={activeOrdersCount}
        settings={effectiveSettings}
        currentUserProfile={currentProfile}
        isNexusOwner={isNexusOwner}
        searchTerm={dashboardSearchTerm}
        onSearchChange={setDashboardSearchTerm}
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
            settings={effectiveSettings}
            currentUserProfile={currentProfile}
            searchTerm={dashboardSearchTerm}
            setSearchTerm={setDashboardSearchTerm}
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
            settings={effectiveSettings}
            orders={orders}
            onMarkContacted={markReminderContacted}
            onScheduleService={scheduleReminderService}
            generateWhatsAppUrl={generateWhatsAppUrl}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {activeTab === 'agenda' && (
          <AgendaAir
            orders={orders}
            technicians={technicians}
            customers={customers}
            equipments={equipments}
            settings={effectiveSettings}
            recurringSchedules={recurringSchedules}
            onOpenNewOrder={() => setIsAddOrderModalOpen(true)}
            onSelectOrder={handleOpenEdit}
            onAddRecurringSchedule={addRecurringSchedule}
            onUpdateRecurringSchedule={updateRecurringSchedule}
            onDeleteRecurringSchedule={deleteRecurringSchedule}
            onConfirmAndScheduleRecurringOrder={confirmAndScheduleRecurringOrder}
            onGenerateWhatsAppRecurringUrl={generateWhatsAppRecurringUrl}
          />
        )}

        {activeTab === 'cotizador' && (
          <ThermalQuoterAir
            parts={parts}
            settings={effectiveSettings}
            customers={customers}
            onCreateOrderFromQuote={handleCreateOrderFromQuote}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryAir
            parts={parts}
            settings={effectiveSettings}
            onAddPart={addPart}
            onUpdatePart={updatePart}
            onDeletePart={deletePart}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersAir
            customers={customers}
            equipments={equipments}
            settings={effectiveSettings}
            onAddCustomer={addCustomer}
            onAddEquipment={addEquipment}
            onUpdateCustomer={updateCustomer}
            onDeleteEquipment={deleteEquipment}
            onDeleteCustomer={deleteCustomer}
          />
        )}

        {activeTab === 'technicians' && (
          <TechniciansAir
            technicians={technicians}
            orders={orders}
            settings={effectiveSettings}
            technicianPayouts={technicianPayouts}
            onAddTechnician={addTechnician}
            onUpdateTechnician={updateTechnician}
            onDeleteTechnician={deleteTechnician}
            onAddTechnicianPayout={addTechnicianPayout}
            onDeleteTechnicianPayout={deleteTechnicianPayout}
            onNavigateToPayroll={() => setActiveTab('payroll')}
          />
        )}

        {activeTab === 'payroll' && (
          <PayrollAir
            technicians={technicians}
            orders={orders}
            settings={effectiveSettings}
            technicianPayouts={technicianPayouts}
            onAddTechnician={addTechnician}
            onUpdateTechnician={updateTechnician}
            onDeleteTechnician={deleteTechnician}
            onAddTechnicianPayout={addTechnicianPayout}
            onDeleteTechnicianPayout={deleteTechnicianPayout}
            onNavigateToTechnicians={() => setActiveTab('technicians')}
          />
        )}

        {activeTab === 'sales' && (
          <SalesAir 
            orders={orders} 
            settings={effectiveSettings}
            technicianPayouts={technicianPayouts}
            expenses={expenses}
            onUpdateOrder={updateOrder}
            onDeleteOrder={deleteOrder}
            onDeletePayout={deleteTechnicianPayout}
            onAddExpense={addExpense}
            onDeleteExpense={deleteExpense}
          />
        )}

        {activeTab === 'finances' && (
          <FinanceModuleAir
            orders={orders}
            settings={effectiveSettings}
            fixedCosts={fixedCosts}
            expenses={expenses}
            financeSettings={financeSettings}
            technicianPayouts={technicianPayouts}
            onUpdateFixedCosts={updateFixedCosts}
            onAddExpense={addExpense}
            onUpdateExpense={updateExpense}
            onDeleteExpense={deleteExpense}
            onUpdateFinanceSettings={updateFinanceSettings}
          />
        )}

        {activeTab === 'landingpage' && (
          <LandingEditorAir
            settings={effectiveSettings}
            onUpdateSettings={handleUpdateSettings}
            onBackToDashboard={() => setActiveTab('dashboard')}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsAir
            settings={effectiveSettings}
            onUpdateSettings={handleUpdateSettings}
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

        {/* NK-067: Mensaje elegante de Módulo Restringido si el usuario no tiene permisos asignados */}
        {activeTab !== 'nexus_owner' && !canUserAccessTab(activeTab, currentProfile.role, isNexusOwner, effectiveSettings?.role_permissions) && (
          <div className="bg-white rounded-3xl p-8 border border-amber-200 text-center max-w-lg mx-auto my-12 space-y-4 shadow-sm animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-slate-900">Módulo Restringido</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tu rol actual (<strong className="text-slate-800 uppercase">{currentProfile.role || 'usuario'}</strong>) no cuenta con permisos para ver este módulo. Si necesitas acceso, solicítalo al administrador de tu empresa.
            </p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer hover:bg-slate-800 transition-colors shadow-sm"
            >
              Ir a Tablero Permitido
            </button>
          </div>
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
          onAddCustomer={addCustomer}
          onAddEquipment={addEquipment}
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
          currentUserProfile={currentProfile}
          technicians={technicians}
          customers={customers}
          equipments={equipments}
          settings={tenantSettings || settings}
          onOpenReceipt={(ord) => {
            setIsEditOrderModalOpen(false);
            setReceiptOrder(ord);
          }}
          onOpenInspection={(ord) => {
            setIsEditOrderModalOpen(false);
            setSelectedOrder(ord);
            setIsInspectionModalOpen(true);
          }}
          onUpdateOrder={updateOrder}
          onDeleteOrder={deleteOrder}
          onAddCustomer={addCustomer}
          onAddEquipment={addEquipment}
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
