import { useState, useEffect } from 'react';
import { 
  Building, 
  Room, 
  Tenant, 
  MeterReading, 
  Expense, 
  Contract, 
  Invoice 
} from './types';

// Import our modular view components
import Dashboard from './components/Dashboard';
import Meters from './components/Meters';
import Expenses from './components/Expenses';
import Contracts from './components/Contracts';
import Buildings from './components/Buildings';
import Rooms from './components/Rooms';
import Tenants from './components/Tenants';
import Invoices from './components/Invoices';

// Import icons
import { 
  LayoutDashboard, 
  Gauge, 
  DollarSign, 
  FileText, 
  Building2, 
  Home, 
  Users, 
  Receipt,
  Sparkles,
  Menu,
  X
} from 'lucide-react';

type TabType = 'dashboard' | 'meters' | 'expenses' | 'contracts' | 'buildings' | 'rooms' | 'tenants' | 'invoices';

export default function App() {
  // Global Data States
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [meters, setMeters] = useState<MeterReading[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Navigation states
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch all database records from Express REST API
  const fetchAllData = async () => {
    try {
      const [
        buildingsRes, 
        roomsRes, 
        tenantsRes, 
        metersRes, 
        expensesRes, 
        contractsRes, 
        invoicesRes
      ] = await Promise.all([
        fetch('/api/v1/buildings').then(r => r.json()),
        fetch('/api/v1/rooms').then(r => r.json()),
        fetch('/api/v1/tenants').then(r => r.json()),
        fetch('/api/v1/meters').then(r => r.json()),
        fetch('/api/v1/expenses').then(r => r.json()),
        fetch('/api/v1/contracts').then(r => r.json()),
        fetch('/api/v1/invoices').then(r => r.json()),
      ]);

      setBuildings(buildingsRes || []);
      setRooms(roomsRes || []);
      setTenants(tenantsRes || []);
      setMeters(metersRes || []);
      setExpenses(expensesRes || []);
      setContracts(contractsRes || []);
      setInvoices(invoicesRes || []);
    } catch (error) {
      console.error("Critical error fetching UpPath.Ops entities:", error);
    } finally {
      setLoading(false);
    }
  };

  // On mount, load everything
  useEffect(() => {
    fetchAllData();
  }, []);

  // API Call Helpers with state refreshing
  const handleAddBuilding = async (b: Omit<Building, 'id'>) => {
    await fetch('/api/v1/buildings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(b)
    });
    fetchAllData();
  };

  const handleUpdateBuilding = async (id: string, b: Partial<Building>) => {
    await fetch(`/api/v1/buildings/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(b)
    });
    fetchAllData();
  };

  const handleDeleteBuilding = async (id: string) => {
    await fetch(`/api/v1/buildings/${id}`, { method: 'DELETE' });
    fetchAllData();
  };

  const handleAddRoom = async (r: Omit<Room, 'id'>) => {
    await fetch('/api/v1/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r)
    });
    fetchAllData();
  };

  const handleUpdateRoom = async (id: string, r: Partial<Room>) => {
    await fetch(`/api/v1/rooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r)
    });
    fetchAllData();
  };

  const handleDeleteRoom = async (id: string) => {
    await fetch(`/api/v1/rooms/${id}`, { method: 'DELETE' });
    fetchAllData();
  };

  const handleAddTenant = async (t: Omit<Tenant, 'id'>) => {
    await fetch('/api/v1/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(t)
    });
    fetchAllData();
  };

  const handleUpdateTenant = async (id: string, t: Partial<Tenant>) => {
    await fetch(`/api/v1/tenants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(t)
    });
    fetchAllData();
  };

  const handleDeleteTenant = async (id: string) => {
    await fetch(`/api/v1/tenants/${id}`, { method: 'DELETE' });
    fetchAllData();
  };

  const handleSaveMeterBatch = async (payload: { month: number; year: number; readings: any[] }) => {
    await fetch('/api/v1/meters/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    fetchAllData();
  };

  const handleUpdateSingleMeter = async (id: string, m: Partial<MeterReading>) => {
    await fetch(`/api/v1/meters/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(m)
    });
    fetchAllData();
  };

  const handleAddExpense = async (e: Omit<Expense, 'id'>) => {
    await fetch('/api/v1/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(e)
    });
    fetchAllData();
  };

  const handleUpdateExpense = async (id: string, e: Partial<Expense>) => {
    await fetch(`/api/v1/expenses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(e)
    });
    fetchAllData();
  };

  const handleDeleteExpense = async (id: string) => {
    await fetch(`/api/v1/expenses/${id}`, { method: 'DELETE' });
    fetchAllData();
  };

  const handleAddContract = async (c: Omit<Contract, 'id'>) => {
    await fetch('/api/v1/contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c)
    });
    fetchAllData();
  };

  const handleUpdateContract = async (id: string, c: Partial<Contract>) => {
    await fetch(`/api/v1/contracts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c)
    });
    fetchAllData();
  };

  const handleDeleteContract = async (id: string) => {
    await fetch(`/api/v1/contracts/${id}`, { method: 'DELETE' });
    fetchAllData();
  };

  const handleGenerateInvoices = async (payload: { month: number; year: number }) => {
    const res = await fetch('/api/v1/invoices/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      throw new Error("Billing generation failed");
    }
    fetchAllData();
  };

  const handleRegisterPayment = async (id: string, payload: { paidAmount: number; paymentDate?: string; notes?: string }) => {
    await fetch(`/api/v1/invoices/${id}/payment`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    fetchAllData();
  };

  const handleUpdateInvoice = async (id: string, payload: Partial<Invoice>) => {
    await fetch(`/api/v1/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    fetchAllData();
  };

  const handleDeleteInvoice = async (id: string) => {
    await fetch(`/api/v1/invoices/${id}`, { method: 'DELETE' });
    fetchAllData();
  };

  // Left sidebar menu specs
  const menuItems = [
    { id: 'dashboard', label: 'Bảng Điều Khiển', icon: LayoutDashboard },
    { id: 'meters', label: 'Chốt Chỉ Số', icon: Gauge },
    { id: 'expenses', label: 'Quản Lý Chi Phí', icon: DollarSign },
    { id: 'contracts', label: 'Quản Lý Hợp Đồng', icon: FileText },
    { id: 'buildings', label: 'Tòa Nhà', icon: Building2 },
    { id: 'rooms', label: 'Phòng Trọ', icon: Home },
    { id: 'tenants', label: 'Khách Thuê', icon: Users },
    { id: 'invoices', label: 'Hóa Đơn & VietQR', icon: Receipt },
  ] as const;

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard buildings={buildings} rooms={rooms} expenses={expenses} invoices={invoices} />;
      case 'meters':
        return (
          <Meters 
            buildings={buildings} 
            rooms={rooms} 
            meters={meters} 
            onSaveBatch={handleSaveMeterBatch} 
            onUpdateSingle={handleUpdateSingleMeter}
            onRefresh={fetchAllData} 
          />
        );
      case 'expenses':
        return (
          <Expenses 
            buildings={buildings} 
            rooms={rooms} 
            expenses={expenses} 
            onAdd={handleAddExpense} 
            onUpdate={handleUpdateExpense} 
            onDelete={handleDeleteExpense} 
          />
        );
      case 'contracts':
        return (
          <Contracts 
            buildings={buildings} 
            rooms={rooms} 
            tenants={tenants} 
            contracts={contracts} 
            onAdd={handleAddContract} 
            onUpdate={handleUpdateContract} 
            onDelete={handleDeleteContract} 
          />
        );
      case 'buildings':
        return (
          <Buildings 
            buildings={buildings} 
            rooms={rooms} 
            onAdd={handleAddBuilding} 
            onUpdate={handleUpdateBuilding} 
            onDelete={handleDeleteBuilding} 
          />
        );
      case 'rooms':
        return (
          <Rooms 
            buildings={buildings} 
            rooms={rooms} 
            onAdd={handleAddRoom} 
            onUpdate={handleUpdateRoom} 
            onDelete={handleDeleteRoom} 
          />
        );
      case 'tenants':
        return (
          <Tenants 
            buildings={buildings} 
            rooms={rooms} 
            tenants={tenants} 
            onAdd={handleAddTenant} 
            onUpdate={handleUpdateTenant} 
            onDelete={handleDeleteTenant} 
          />
        );
      case 'invoices':
        return (
          <Invoices 
            buildings={buildings} 
            rooms={rooms} 
            meters={meters} 
            contracts={contracts}
            invoices={invoices} 
            onGenerateInvoices={handleGenerateInvoices} 
            onRegisterPayment={handleRegisterPayment} 
            onUpdate={handleUpdateInvoice}
            onDelete={handleDeleteInvoice} 
          />
        );
    }
  };

  // Map of titles for active view header
  const tabTitles: Record<TabType, string> = {
    dashboard: 'Bảng Điều Khiển Tài Chính',
    meters: 'Chốt Chỉ Số Điện Nước',
    expenses: 'Quản Lý Chi Phí Vận Hành',
    contracts: 'Quản Lý Hợp Đồng Thuê Nhà',
    buildings: 'Quản Lý Tòa Nhà & Block',
    rooms: 'Danh Sách Phòng Trọ & Căn Hộ',
    tenants: 'Hồ Sơ Khách Thuê Chi Tiết',
    invoices: 'Hóa Đơn & Mã VietQR'
  };

  const operationalTabs = ['dashboard', 'meters', 'expenses', 'contracts'] as const;
  const infrastructureTabs = ['buildings', 'rooms', 'tenants', 'invoices'] as const;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500 tracking-wider uppercase font-mono">Đang nạp dữ liệu An Nhiên Appartment...</p>
      </div>
    );
  }

  const renderNavButton = (itemId: TabType) => {
    const item = menuItems.find(m => m.id === itemId);
    if (!item) return null;
    const Icon = item.icon;
    const isSelected = activeTab === itemId;
    return (
      <button
        key={itemId}
        id={`side-nav-${itemId}`}
        onClick={() => {
          setActiveTab(itemId);
          setIsMobileSidebarOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold transition-all text-left cursor-pointer ${
          isSelected 
            ? 'bg-indigo-600 text-white shadow-sm font-medium' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900 overflow-hidden" id="app-root">
      
      {/* 1. DESKTOP PERMANENT LEFT SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 shrink-0 border-r border-slate-800" id="desktop-sidebar">
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white tracking-wider">AN</div>
          <span className="text-base font-bold tracking-tight text-white">An Nhiên <span className="text-indigo-400">Appartment</span></span>
        </div>

        {/* Navigation items split into Operational and Infrastructure */}
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          {/* Group 1: Operational */}
          <div className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Operational</div>
            {operationalTabs.map(tabId => renderNavButton(tabId))}
          </div>

          {/* Group 2: Infrastructure */}
          <div className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Infrastructure</div>
            {infrastructureTabs.map(tabId => renderNavButton(tabId))}
          </div>
        </nav>

        {/* Profile Footer Widget */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-indigo-400/20 flex items-center justify-center text-indigo-400 font-bold">AN</div>
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">Ban Quản Lý An Nhiên</div>
              <div className="text-[10px] text-slate-500 truncate">dangvankhoa0602@gmail.com</div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE FLOATING SIDEBAR OVERLAY */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" id="mobile-sidebar-overlay">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsMobileSidebarOpen(false)}></div>
          
          <aside className="relative flex flex-col w-64 bg-slate-900 text-white shadow-2xl h-full animate-fade-in">
            {/* Close action */}
            <div className="p-6 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white tracking-wider">AN</div>
                <span className="text-base font-bold tracking-tight text-white">An Nhiên <span className="text-indigo-400">Appartment</span></span>
              </div>
              <button 
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
              <div className="space-y-1">
                <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Operational</div>
                {operationalTabs.map(tabId => renderNavButton(tabId))}
              </div>

              <div className="space-y-1">
                <div className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Infrastructure</div>
                {infrastructureTabs.map(tabId => renderNavButton(tabId))}
              </div>
            </nav>

            {/* Profile Footer Widget */}
            <div className="p-4 border-t border-slate-800">
              <div className="flex items-center gap-3 p-2 bg-slate-800/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-indigo-400/20 flex items-center justify-center text-indigo-400 font-bold">AN</div>
                <div className="flex-1 overflow-hidden">
                  <div className="text-xs font-semibold text-white truncate">Ban Quản Lý An Nhiên</div>
                  <div className="text-[10px] text-slate-500 truncate">dangvankhoa0602@gmail.com</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* 3. MAIN APP WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden" id="main-app-container">
        
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 bg-white border-b border-slate-200 px-8 items-center justify-between shrink-0" id="desktop-header">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold text-slate-800">{tabTitles[activeTab]}</h2>
            <div className="h-4 w-[1px] bg-slate-300"></div>
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              <span>Năm tài chính:</span>
              <span className="font-bold text-indigo-600">2026</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">SaaS Operational Engine v1.0.4</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </header>

        {/* Mobile Header Toolbar */}
        <header className="lg:hidden h-16 bg-slate-900 text-white px-4 flex items-center justify-between shrink-0 shadow-sm" id="mobile-header">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center font-bold text-white text-xs">AN</div>
            <span className="font-bold text-sm tracking-tight">An Nhiên <span className="text-indigo-400">Appartment</span></span>
          </div>
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 focus:outline-none"
            id="mobile-menu-btn"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Master Work Area Stage */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto" id="app-stage">
          <div className="max-w-7xl mx-auto">
            {renderActiveTabContent()}
          </div>
        </main>
      </div>

    </div>
  );
}
