import React, { useState, useMemo } from 'react';
import { Building, Room, MeterReading, Invoice, Contract, formatCurrency, SERVICE_PRICES } from '../types';
import { Receipt, Plus, Search, Trash2, Edit2, X, Check, Sparkles, Filter, CreditCard, ChevronRight, AlertCircle, Calendar, Building2, DollarSign, Printer, RefreshCw, Calculator } from 'lucide-react';

interface InvoicesProps {
  buildings: Building[];
  rooms: Room[];
  meters: MeterReading[];
  contracts: Contract[];
  invoices: Invoice[];
  onGenerateInvoices: (payload: { month: number; year: number }) => Promise<void>;
  onRegisterPayment: (id: string, payload: { paidAmount: number; paymentDate?: string; notes?: string }) => Promise<void>;
  onUpdate: (id: string, payload: Partial<Invoice>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function Invoices({ 
  buildings, 
  rooms, 
  meters, 
  contracts,
  invoices, 
  onGenerateInvoices, 
  onRegisterPayment, 
  onUpdate,
  onDelete 
}: InvoicesProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  const [generating, setGenerating] = useState(false);

  // Extract all unique years found inside current invoices list
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    invoices.forEach(inv => {
      yearsSet.add(String(inv.year));
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [invoices]);

  // Dialog / Modal state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Payment form states
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Invoice Adjustment Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedInvoiceToEdit, setSelectedInvoiceToEdit] = useState<Invoice | null>(null);
  const [editRentPrice, setEditRentPrice] = useState('');
  const [editPowerPrice, setEditPowerPrice] = useState('');
  const [editWaterPrice, setEditWaterPrice] = useState('');
  const [editExtraPrice, setEditExtraPrice] = useState('');
  const [editDiscountPrice, setEditDiscountPrice] = useState('');
  const [editMachineWashingPrice, setEditMachineWashingPrice] = useState('');
  const [editInternetPrice, setEditInternetPrice] = useState('');
  const [editParkingPrice, setEditParkingPrice] = useState('');
  const [editPaidAmount, setEditPaidAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editNumberOfOccupants, setEditNumberOfOccupants] = useState('');
  const [editElectricityPrice, setEditElectricityPrice] = useState('');
  const [editWaterPriceUnit, setEditWaterPriceUnit] = useState('');
  const [editWaterType, setEditWaterType] = useState<'PER_PERSON' | 'PER_CUBIC'>('PER_PERSON');

  // Print Bill Modal States
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedInvoiceToPrint, setSelectedInvoiceToPrint] = useState<Invoice | null>(null);

  // Custom Delete confirmation Modal States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [invoiceIdToDelete, setInvoiceIdToDelete] = useState<string | null>(null);
  const [roomNameToDelete, setRoomNameToDelete] = useState<string>('');

  // Live Auto-Calculation during invoice adjustment editing
  const liveTotal = useMemo(() => {
    const rent = Number(editRentPrice) || 0;
    const power = Number(editPowerPrice) || 0;
    const water = Number(editWaterPrice) || 0;
    const extra = Number(editExtraPrice) || 0;
    const wash = Number(editMachineWashingPrice) || 0;
    const internet = Number(editInternetPrice) || 0;
    const parking = Number(editParkingPrice) || 0;
    return rent + power + water + extra + wash + internet + parking;
  }, [editRentPrice, editPowerPrice, editWaterPrice, editExtraPrice, editMachineWashingPrice, editInternetPrice, editParkingPrice]);

  const liveNetTotal = useMemo(() => {
    return Math.max(0, liveTotal - (Number(editDiscountPrice) || 0));
  }, [liveTotal, editDiscountPrice]);

  const liveStatus = useMemo(() => {
    const paid = Number(editPaidAmount) || 0;
    if (paid >= liveNetTotal) return 'paid';
    if (paid > 0) return 'partially_paid';
    return 'unpaid';
  }, [editPaidAmount, liveNetTotal]);

  // Lookup maps
  const buildingsMap = useMemo(() => {
    const map: Record<string, string> = {};
    buildings.forEach(b => { map[b.id] = b.name; });
    return map;
  }, [buildings]);

  const roomsMap = useMemo(() => {
    const map: Record<string, { name: string; buildingName: string; basePrice: number }> = {};
    rooms.forEach(r => {
      map[r.id] = {
        name: r.name,
        buildingName: buildingsMap[r.buildingId] || 'Không xác định',
        basePrice: r.basePrice
      };
    });
    return map;
  }, [rooms, buildingsMap]);

  // Generate invoices trigger
  const handleGenerateClick = async () => {
    setGenerating(true);
    try {
      await onGenerateInvoices({ month: selectedMonth, year: selectedYear });
      alert(`Đã khởi tạo thành công hóa đơn cho chu kỳ Tháng ${selectedMonth}/${selectedYear}!`);
    } catch (e) {
      console.error(e);
      alert('Không có phòng nào đang ở trạng thái thuê hoặc hóa đơn đã tồn tại.');
    } finally {
      setGenerating(false);
    }
  };

  // Open Payment dialog
  const handleOpenPayment = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPaidAmountInput(String(inv.totalAmount - inv.discountPrice));
    setPaymentNotes(inv.notes || `Thanh toán hóa đơn tháng ${inv.month}/${inv.year}`);
    setPaymentModalOpen(true);
  };

  // Submit Payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    try {
      await onRegisterPayment(selectedInvoice.id, {
        paidAmount: Number(paidAmountInput),
        paymentDate: new Date().toISOString().split('T')[0],
        notes: paymentNotes.trim()
      });
      setPaymentModalOpen(false);
      setSelectedInvoice(null);
    } catch (err) {
      console.error(err);
      alert('Lỗi ghi nhận đóng tiền phòng.');
    }
  };

  // Open invoice adjustment / edit form dialog
  const handleOpenEdit = (inv: Invoice) => {
    setSelectedInvoiceToEdit(inv);
    setEditRentPrice(String(inv.rentPrice));
    setEditPowerPrice(String(inv.powerPrice));
    setEditWaterPrice(String(inv.waterPrice));
    setEditExtraPrice(String(inv.extraPrice));
    setEditDiscountPrice(String(inv.discountPrice));
    setEditMachineWashingPrice(String(inv.machineWashingPrice ?? 0));
    setEditInternetPrice(String(inv.internetPrice ?? 0));
    setEditParkingPrice(String(inv.parkingPrice ?? 0));
    setEditPaidAmount(String(inv.paidAmount));
    setEditNotes(inv.notes || '');
    setEditNumberOfOccupants(String(inv.numberOfOccupants ?? 1));
    setEditElectricityPrice(String(inv.electricityPrice ?? 4000));
    setEditWaterPriceUnit(String(inv.waterPriceUnit ?? 100000));
    setEditWaterType(inv.waterType ?? 'PER_PERSON');
    setEditModalOpen(true);
  };

  // Submit Invoice Adjustment edits
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceToEdit) return;

    try {
      await onUpdate(selectedInvoiceToEdit.id, {
        rentPrice: Number(editRentPrice),
        powerPrice: Number(editPowerPrice),
        waterPrice: Number(editWaterPrice),
        extraPrice: Number(editExtraPrice),
        discountPrice: Number(editDiscountPrice),
        machineWashingPrice: Number(editMachineWashingPrice),
        internetPrice: Number(editInternetPrice),
        parkingPrice: Number(editParkingPrice),
        paidAmount: Number(editPaidAmount),
        notes: editNotes.trim(),
        numberOfOccupants: Number(editNumberOfOccupants),
        electricityPrice: Number(editElectricityPrice),
        waterPriceUnit: Number(editWaterPriceUnit),
        waterType: editWaterType
      });
      setEditModalOpen(false);
      setSelectedInvoiceToEdit(null);
    } catch (err) {
      console.error(err);
      alert('Lỗi cập nhật điều chỉnh hóa đơn.');
    }
  };

  // Smart Recalculate helper to reset / update edit fields from contract and meter reading
  const handleRecalculateFromContract = () => {
    if (!selectedInvoiceToEdit) return;

    // 1. Find contract
    const contract = contracts.find(c => {
      if (c.roomId !== selectedInvoiceToEdit.roomId) return false;
      return true;
    }) || contracts.find(c => c.roomId === selectedInvoiceToEdit.roomId);

    // 2. Find meter reading for the matching invoice month and year
    const meter = meters.find(m => 
      m.roomId === selectedInvoiceToEdit.roomId && 
      m.month === selectedInvoiceToEdit.month && 
      m.year === selectedInvoiceToEdit.year
    );

    const rentVal = contract ? contract.rentPrice : (roomsMap[selectedInvoiceToEdit.roomId]?.basePrice || 0);
    const occupantsVal = contract?.numberOfOccupants !== undefined ? contract.numberOfOccupants : 1;
    const elecPriceVal = contract?.electricityPrice !== undefined ? contract.electricityPrice : 4000;
    const waterPriceUnitVal = contract?.waterPrice !== undefined ? contract.waterPrice : 100000;
    const waterTypeVal = contract?.waterType || 'PER_PERSON';
    const washVal = contract?.machineWashingPrice !== undefined ? contract.machineWashingPrice : 0;
    const internetVal = contract?.internetPrice !== undefined ? contract.internetPrice : 0;
    const parkingVal = contract?.parkingPrice !== undefined ? contract.parkingPrice : 0;

    let powerVal = 0;
    let waterVal = 0;
    let extraVal = 0;

    if (meter) {
      const powerDiff = Math.max(0, meter.powerNew - meter.powerOld);
      const waterDiff = Math.max(0, meter.waterNew - meter.waterOld);
      
      powerVal = powerDiff * elecPriceVal;
      
      if (waterTypeVal === 'PER_PERSON') {
        waterVal = occupantsVal * waterPriceUnitVal;
      } else {
        waterVal = waterDiff * waterPriceUnitVal;
      }
      extraVal = meter.extraPrice;
    } else {
      if (waterTypeVal === 'PER_PERSON') {
        waterVal = occupantsVal * waterPriceUnitVal;
      }
    }

    setEditRentPrice(String(rentVal));
    setEditPowerPrice(String(powerVal));
    setEditWaterPrice(String(waterVal));
    setEditExtraPrice(String(extraVal));
    setEditMachineWashingPrice(String(washVal));
    setEditInternetPrice(String(internetVal));
    setEditParkingPrice(String(parkingVal));
    setEditNumberOfOccupants(String(occupantsVal));
    setEditElectricityPrice(String(elecPriceVal));
    setEditWaterPriceUnit(String(waterPriceUnitVal));
    setEditWaterType(waterTypeVal);
    alert('Đã cập nhật lại toàn bộ đơn giá và chỉ số tính toán từ hợp đồng & đồng hồ mới nhất!');
  };

  // Open professional printable view modal
  const handleOpenPrint = (inv: Invoice) => {
    setSelectedInvoiceToPrint(inv);
    setPrintModalOpen(true);
  };

  const handleDeleteClick = (id: string, roomName: string) => {
    setInvoiceIdToDelete(id);
    setRoomNameToDelete(roomName);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!invoiceIdToDelete) return;
    try {
      await onDelete(invoiceIdToDelete);
      setDeleteConfirmOpen(false);
      setInvoiceIdToDelete(null);
      setRoomNameToDelete('');
    } catch (err) {
      console.error(err);
      alert('Lỗi khi xóa hóa đơn.');
    }
  };

  // Compute filtered invoice listing
  const filteredInvoices = useMemo(() => {
    let result = invoices.filter(inv => {
      const room = roomsMap[inv.roomId];
      const roomName = room ? room.name.toLowerCase() : '';
      const matchesSearch = roomName.includes(searchTerm.toLowerCase()) || 
                            String(inv.month).includes(searchTerm) || 
                            String(inv.year).includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;

      let matchesYear = true;
      if (selectedYearFilter !== 'all') {
        matchesYear = String(inv.year) === selectedYearFilter;
      }

      let matchesMonth = true;
      if (selectedMonthFilter !== 'all') {
        matchesMonth = String(inv.month) === selectedMonthFilter;
      }

      let matchesBuilding = true;
      if (selectedBuildingFilter !== 'all') {
        const roomObj = rooms.find(r => r.id === inv.roomId);
        matchesBuilding = roomObj ? roomObj.buildingId === selectedBuildingFilter : false;
      }

      return matchesSearch && matchesStatus && matchesYear && matchesMonth && matchesBuilding;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortOrder === 'newest') {
        return b.year - a.year || b.month - a.month;
      } else if (sortOrder === 'oldest') {
        return a.year - b.year || a.month - b.month;
      } else if (sortOrder === 'amount_desc') {
        return (b.totalAmount - b.discountPrice) - (a.totalAmount - a.discountPrice);
      } else if (sortOrder === 'amount_asc') {
        return (a.totalAmount - a.discountPrice) - (b.totalAmount - b.discountPrice);
      } else if (sortOrder === 'unpaid_first') {
        const aUnpaid = a.status !== 'paid' ? 1 : 0;
        const bUnpaid = b.status !== 'paid' ? 1 : 0;
        return bUnpaid - aUnpaid || b.year - a.year || b.month - a.month;
      } else if (sortOrder === 'paid_first') {
        const aPaid = a.status === 'paid' ? 1 : 0;
        const bPaid = b.status === 'paid' ? 1 : 0;
        return bPaid - aPaid || b.year - a.year || b.month - a.month;
      }
      return 0;
    });

    return result;
  }, [invoices, searchTerm, statusFilter, selectedYearFilter, selectedMonthFilter, selectedBuildingFilter, sortOrder, roomsMap, rooms]);

  // Compute summary metrics for filtered invoices list
  const filteredInvoiceStats = useMemo(() => {
    let totalExpected = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;
    let totalCount = filteredInvoices.length;

    filteredInvoices.forEach(inv => {
      const netAmount = Math.max(0, inv.totalAmount - inv.discountPrice);
      totalExpected += netAmount;
      totalPaid += inv.paidAmount;
      totalUnpaid += Math.max(0, netAmount - inv.paidAmount);
    });

    return {
      totalCount,
      totalExpected,
      totalPaid,
      totalUnpaid
    };
  }, [filteredInvoices]);

  return (
    <div className="space-y-8">
      {/* Header section with Dynamic generation inputs */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900" id="invoices-title">Quản Lý Hóa Đơn Chi Tiết</h1>
          <p className="text-xs text-slate-500 mt-1">Tự động cộng gộp tiền thuê gốc và các khoản phí dịch vụ sử dụng thực tế (điện, nước, wifi, xe, giặt...). Hỗ trợ điều chỉnh chi tiết, tự động cập nhật và in hóa đơn (bill) gửi khách chuyên nghiệp.</p>
        </div>

        {/* Invoice auto generation controls */}
        <div className="flex flex-wrap items-center gap-3 bg-indigo-50/30 p-3 rounded-xl border border-indigo-100/60">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-indigo-900 font-sans uppercase tracking-wider">Kỳ phát hành:</span>
            <select
              id="invoice-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
              ))}
            </select>
            <select
              id="invoice-year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerateClick}
            disabled={generating}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-xs font-bold text-white rounded-lg shadow-sm transition-all focus:outline-none shrink-0 cursor-pointer disabled:cursor-not-allowed"
            id="btn-generate-invoices"
          >
            <Plus className="w-4 h-4" /> {generating ? 'Đang xuất hóa đơn...' : 'Xuất Hóa Đơn Kỳ Này'}
          </button>
        </div>
      </div>

      {/* Premium mini-overview panel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white rounded-xl border border-slate-200 p-4 shadow-xs" id="invoice-summary-panel">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng cần thu</span>
            <span className="block text-base font-bold font-mono text-indigo-950 mt-0.5">{formatCurrency(filteredInvoiceStats.totalExpected)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thực thu thu được</span>
            <span className="block text-base font-bold font-mono text-emerald-600 mt-0.5">{formatCurrency(filteredInvoiceStats.totalPaid)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chưa thu / Còn nợ</span>
            <span className="block text-base font-bold font-mono text-rose-600 mt-0.5">{formatCurrency(filteredInvoiceStats.totalUnpaid)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số hóa đơn lọc</span>
            <span className="block text-base font-bold font-mono text-slate-800 mt-0.5">{filteredInvoiceStats.totalCount} hóa đơn</span>
          </div>
        </div>
      </div>

      {/* Grid Toolbar Filter */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3" id="invoice-toolbar">
        {/* Search Input */}
        <div className="col-span-2 md:col-span-1 relative">
          <Search className="absolute left-3 top-3.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm số phòng hoặc kỳ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs shadow-xs focus:border-indigo-500 focus:outline-none font-semibold text-slate-700 h-10"
          />
        </div>

        {/* Year Filter */}
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={selectedYearFilter}
            onChange={(e) => setSelectedYearFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer h-10"
          >
            <option value="all">Tất cả các năm</option>
            {availableYears.map(yr => (
              <option key={yr} value={yr}>Năm {yr}</option>
            ))}
          </select>
        </div>

        {/* Month Filter */}
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={selectedMonthFilter}
            onChange={(e) => setSelectedMonthFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer h-10"
          >
            <option value="all">Tất cả các tháng</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>Tháng {i + 1}</option>
            ))}
          </select>
        </div>

        {/* Building Filter */}
        <div className="flex items-center gap-1 col-span-2 md:col-span-1">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={selectedBuildingFilter}
            onChange={(e) => setSelectedBuildingFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer h-10"
          >
            <option value="all">Tất cả tòa nhà</option>
            {buildings.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Status Tab filter */}
        <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50/50 self-center col-span-2 md:col-span-1 h-10">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 text-center py-1.5 px-2 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              statusFilter === 'all' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            className={`flex-1 text-center py-1.5 px-2 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              statusFilter === 'paid' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Thu đủ
          </button>
          <button
            onClick={() => setStatusFilter('partially_paid')}
            className={`flex-1 text-center py-1.5 px-2 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              statusFilter === 'partially_paid' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Một phần
          </button>
          <button
            onClick={() => setStatusFilter('unpaid')}
            className={`flex-1 text-center py-1.5 px-2 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
              statusFilter === 'unpaid' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Chưa thu
          </button>
        </div>

        {/* Sort order filter */}
        <div className="flex items-center gap-1 col-span-2 md:col-span-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0 hidden xl:inline">Sắp xếp:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full rounded-lg border border-indigo-100 bg-white px-2 py-2 text-xs font-semibold text-indigo-600 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer h-10"
          >
            <option value="newest">Kỳ hóa đơn: Mới nhất</option>
            <option value="oldest">Kỳ hóa đơn: Cũ nhất</option>
            <option value="amount_desc">Tổng tiền: Cao nhất</option>
            <option value="amount_asc">Tổng tiền: Thấp nhất</option>
            <option value="unpaid_first">Chưa đóng trước</option>
            <option value="paid_first">Thu đủ trước</option>
          </select>
        </div>
      </div>

      {/* Invoices listings rendering */}
      {filteredInvoices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center" id="empty-invoices">
          <Receipt className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-xs font-bold text-slate-800 uppercase tracking-wider">Không tìm thấy hóa đơn nào</h3>
          <p className="mt-1 text-xs text-slate-500">Chọn chu kỳ phát hành bên trên và bấm "Xuất Hóa Đơn Kỳ Này".</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden" id="invoices-list-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs animate-fade-in" id="invoices-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Phòng & Kỳ Hóa Đơn</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Tiền Phòng Gốc</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Phí Điện</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Phí Nước</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Phụ Thu / Chiết Khấu</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Tổng Cộng Cần Thu</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Đã Thu Thực Tế</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider text-center">Trạng Thái</th>
                  <th className="p-4 text-right font-bold text-slate-500 uppercase tracking-wider">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map(inv => {
                  const room = roomsMap[inv.roomId] || { name: inv.roomId, buildingName: 'Chung cư' };
                  const unpaidAmount = Math.max(0, inv.totalAmount - inv.discountPrice - inv.paidAmount);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Room & Cycle Period */}
                      <td className="p-4">
                        <span className="block font-bold text-slate-800 text-sm">{room.name}</span>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Tháng {inv.month}/{inv.year}</span>
                      </td>

                      {/* Base room rent price */}
                      <td className="p-4 font-semibold font-mono text-slate-600 text-xs">
                        {formatCurrency(inv.rentPrice)}
                      </td>

                      {/* Electricity Service price */}
                      <td className="p-4 font-semibold font-mono text-slate-600 text-xs">
                        <span>{formatCurrency(inv.powerPrice)}</span>
                        {inv.electricityPrice !== undefined && (
                          <span className="block text-[10px] text-slate-400 font-sans mt-0.5">({formatCurrency(inv.electricityPrice)}/kWh)</span>
                        )}
                      </td>

                      {/* Water Service price */}
                      <td className="p-4 font-semibold font-mono text-slate-600 text-xs">
                        <span>{formatCurrency(inv.waterPrice)}</span>
                        {inv.waterPriceUnit !== undefined && (
                          <span className="block text-[10px] text-slate-400 font-sans mt-0.5">
                            ({formatCurrency(inv.waterPriceUnit)}/{(inv.waterType ?? 'PER_PERSON') === 'PER_CUBIC' ? 'm³' : 'ng'})
                          </span>
                        )}
                      </td>

                      {/* Extra charge & Discounts */}
                      <td className="p-4 text-slate-500 text-xs font-semibold">
                        {inv.extraPrice > 0 && (
                          <span className="block font-mono text-amber-600 font-bold">+{formatCurrency(inv.extraPrice)}</span>
                        )}
                        {((inv.machineWashingPrice ?? 0) > 0) && (
                          <span className="block text-[10px] text-indigo-600 font-sans leading-tight">🧺 Giặt: +{formatCurrency(inv.machineWashingPrice ?? 0)}</span>
                        )}
                        {((inv.internetPrice ?? 0) > 0) && (
                          <span className="block text-[10px] text-indigo-600 font-sans leading-tight">🌐 Wifi: +{formatCurrency(inv.internetPrice ?? 0)}</span>
                        )}
                        {((inv.parkingPrice ?? 0) > 0) && (
                          <span className="block text-[10px] text-indigo-600 font-sans leading-tight">🛵 Xe: +{formatCurrency(inv.parkingPrice ?? 0)}</span>
                        )}
                        {inv.discountPrice > 0 && (
                          <span className="block font-mono text-rose-600 font-bold">-{formatCurrency(inv.discountPrice)}</span>
                        )}
                        {inv.extraPrice === 0 && !(inv.machineWashingPrice ?? 0) && !(inv.internetPrice ?? 0) && !(inv.parkingPrice ?? 0) && inv.discountPrice === 0 && <span className="text-slate-300">-</span>}
                      </td>

                      {/* Total expected money */}
                      <td className="p-4 font-bold text-indigo-950 text-sm font-mono">
                        {formatCurrency(inv.totalAmount - inv.discountPrice)}
                      </td>

                      {/* Actual collected money */}
                      <td className="p-4 font-bold text-emerald-600 font-mono text-sm">
                        {formatCurrency(inv.paidAmount)}
                        {unpaidAmount > 0 && inv.paidAmount > 0 && (
                          <span className="block text-[10px] text-rose-500 font-semibold mt-0.5">Thiếu: {formatCurrency(unpaidAmount)}</span>
                        )}
                      </td>

                      {/* Paid Status badges */}
                      <td className="p-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' :
                          inv.status === 'partially_paid' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' : 'bg-rose-50 text-rose-700 border border-rose-200/50'
                        }`}>
                          {inv.status === 'paid' ? 'Thu Đủ' :
                           inv.status === 'partially_paid' ? 'Một Phần' : 'Chưa Thu'}
                        </span>
                      </td>

                      {/* Quick Actions trigger modals */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print Bill / Invoice */}
                          <button
                            onClick={() => handleOpenPrint(inv)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer transition-all"
                            title="In hóa đơn chuyên nghiệp gửi khách"
                          >
                            <Printer className="w-3.5 h-3.5 text-indigo-500" /> In bill
                          </button>

                          {/* Edit / Adjust details */}
                          <button
                            onClick={() => handleOpenEdit(inv)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-amber-600 bg-slate-50 hover:bg-amber-50 px-2.5 py-1.5 rounded-lg border border-slate-200 cursor-pointer transition-all"
                            title="Điều chỉnh hóa đơn"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-500" /> Sửa
                          </button>

                          {/* Record actual payments */}
                          <button
                            onClick={() => handleOpenPayment(inv)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:bg-indigo-700 bg-indigo-600 px-2.5 py-1.5 rounded-lg shadow-sm cursor-pointer transition-all"
                            title="Ghi nhận số tiền đóng"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Ghi thu
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteClick(inv.id, room.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                            title="Xóa hóa đơn"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment collection registration Modal Dialog */}
      {paymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4" id="invoice-payment-dialog">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Ghi Nhận Thực Thu Tiền Phòng</h3>
              <button onClick={() => setPaymentModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100/60 text-xs space-y-1">
                <span className="block font-bold text-indigo-950">HÓA ĐƠN PHÒNG: {roomsMap[selectedInvoice.roomId]?.name || selectedInvoice.roomId}</span>
                <span className="block text-slate-500 font-bold uppercase tracking-wider text-[10px]">Chu kỳ: Tháng {selectedInvoice.month}/{selectedInvoice.year}</span>
                <span className="block text-slate-700 font-semibold pt-1">Tổng hóa đơn cần thu: <strong className="text-indigo-950 font-bold">{formatCurrency(selectedInvoice.totalAmount - selectedInvoice.discountPrice)}</strong></span>
              </div>

              {/* Paid amount */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Số Tiền Thực Thu Được (VNĐ)</label>
                <input
                  type="number"
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                  placeholder="Nhập số tiền thực tế đã đóng..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                  required
                />
                <div className="flex gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setPaidAmountInput(String(selectedInvoice.totalAmount - selectedInvoice.discountPrice))}
                    className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded cursor-pointer"
                  >
                    Đóng đủ (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaidAmountInput('0')}
                    className="text-[10px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded cursor-pointer"
                  >
                    Chưa đóng (0đ)
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ghi Chú Đóng Tiền</label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ghi rõ chuyển khoản ACB, đóng tiền mặt, đóng thiếu hẹn tuần sau..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
                  rows={2}
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                >
                  Xác Nhận Thu Đóng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Adjustment / Editing Modal Dialog */}
      {editModalOpen && selectedInvoiceToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto" id="invoice-edit-dialog">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-amber-600 animate-spin-slow" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Điều Chỉnh Hóa Đơn & Doanh Thu Chi Tiết</h3>
              </div>
              <button onClick={() => setEditModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              
              {/* Info summary & Recalculate Trigger */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-amber-50/50 rounded-xl border border-amber-100/70 gap-3 text-xs">
                <div>
                  <span className="block font-bold text-amber-950">PHÒNG: {roomsMap[selectedInvoiceToEdit.roomId]?.name || selectedInvoiceToEdit.roomId}</span>
                  <span className="block text-[10px] text-amber-700 font-bold uppercase tracking-wider mt-0.5">Chu kỳ: Tháng {selectedInvoiceToEdit.month}/{selectedInvoiceToEdit.year}</span>
                </div>
                
                <button
                  type="button"
                  onClick={handleRecalculateFromContract}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg shadow-sm transition-all cursor-pointer"
                  title="Cập nhật lại từ Hợp đồng và Chỉ số điện nước"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Đồng Bộ Lại Từ Hợp Đồng & Chỉ Số
                </button>
              </div>

              {/* Grid Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Rent Price */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tiền Phòng Gốc (VNĐ)</label>
                  <input
                    type="number"
                    value={editRentPrice}
                    onChange={(e) => setEditRentPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                {/* Power Price */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phí Điện (VNĐ)</label>
                  <input
                    type="number"
                    value={editPowerPrice}
                    onChange={(e) => setEditPowerPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                  <span className="block text-[9px] text-slate-400 mt-0.5">Đơn giá áp dụng: {formatCurrency(Number(editElectricityPrice))}/kWh</span>
                </div>

                {/* Water Price */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phí Nước (VNĐ)</label>
                  <input
                    type="number"
                    value={editWaterPrice}
                    onChange={(e) => setEditWaterPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                  <span className="block text-[9px] text-slate-400 mt-0.5">Đơn giá: {formatCurrency(Number(editWaterPriceUnit))}/{editWaterType === 'PER_CUBIC' ? 'm³' : 'người'}</span>
                </div>

                {/* Extra Price */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phụ Thu Khác (VNĐ)</label>
                  <input
                    type="number"
                    value={editExtraPrice}
                    onChange={(e) => setEditExtraPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Fixed Laundry */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phí Máy Giặt & Dịch Vụ Chung (VNĐ)</label>
                  <input
                    type="number"
                    value={editMachineWashingPrice}
                    onChange={(e) => setEditMachineWashingPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Fixed Internet */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phí Internet / Wifi (VNĐ)</label>
                  <input
                    type="number"
                    value={editInternetPrice}
                    onChange={(e) => setEditInternetPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Fixed Parking */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phí Trông Giữ Xe Máy (VNĐ)</label>
                  <input
                    type="number"
                    value={editParkingPrice}
                    onChange={(e) => setEditParkingPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Discount price */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-rose-600">Chiết Khấu / Giảm Giá (VNĐ)</label>
                  <input
                    type="number"
                    value={editDiscountPrice}
                    onChange={(e) => setEditDiscountPrice(e.target.value)}
                    className="w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold font-mono focus:border-rose-500 focus:outline-none text-rose-700"
                  />
                </div>

                {/* Actual paid */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 text-emerald-600">Thực Tế Khách Đã Đóng (VNĐ)</label>
                  <input
                    type="number"
                    value={editPaidAmount}
                    onChange={(e) => setEditPaidAmount(e.target.value)}
                    className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold font-mono focus:border-emerald-500 focus:outline-none text-emerald-700"
                    required
                  />
                </div>

                {/* Edit notes */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ghi Chú Hóa Đơn</label>
                  <input
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="VD: ACB chuyển khoản, đóng thiếu hẹn ngày 20..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* LIVE CALCULATION FEEDBACK BOX (Hóa đơn tự động cập nhật) */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 shadow-md border border-slate-800">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Xem trước kết quả tự cập nhật</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="block text-[9px] text-slate-400">TỔNG CHƯA GIẢM</span>
                    <span className="block text-sm font-bold mt-1 text-slate-100">{formatCurrency(liveTotal)}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-rose-400">GIẢM GIÁ</span>
                    <span className="block text-sm font-bold mt-1 text-rose-400">-{formatCurrency(Number(editDiscountPrice) || 0)}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-indigo-300">CẦN THU (NET)</span>
                    <span className="block text-sm font-bold mt-1 text-indigo-300">{formatCurrency(liveNetTotal)}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-emerald-400">THỰC THU</span>
                    <span className="block text-sm font-bold mt-1 text-emerald-400">{formatCurrency(Number(editPaidAmount) || 0)}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Trạng thái tự cập nhật:</span>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    liveStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    liveStatus === 'partially_paid' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {liveStatus === 'paid' ? 'Thu Đủ' :
                     liveStatus === 'partially_paid' ? 'Một Phần' : 'Chưa Thu'}
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                >
                  Lưu & Cập Nhật Hóa Đơn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Professional Printable Bill/Invoice Modal Dialog */}
      {printModalOpen && selectedInvoiceToPrint && (() => {
        const room = roomsMap[selectedInvoiceToPrint.roomId] || { name: selectedInvoiceToPrint.roomId, buildingName: 'Chung Cư' };
        
        // Find matching meter reading for indexes
        const matchingMeter = meters.find(m => 
          m.roomId === selectedInvoiceToPrint.roomId && 
          m.month === selectedInvoiceToPrint.month && 
          m.year === selectedInvoiceToPrint.year
        );

        // Pre-paid Rent billing month calculation: Rent for next month, utilities for current month
        const nextMonthVal = selectedInvoiceToPrint.month === 12 ? 1 : selectedInvoiceToPrint.month + 1;
        const nextYearVal = selectedInvoiceToPrint.month === 12 ? selectedInvoiceToPrint.year + 1 : selectedInvoiceToPrint.year;

        // Calculate unpaid / debt
        const expectedTotal = selectedInvoiceToPrint.totalAmount - selectedInvoiceToPrint.discountPrice;
        const remainingDebt = Math.max(0, expectedTotal - selectedInvoiceToPrint.paidAmount);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto" id="invoice-print-dialog">
            {/* Inject special print style rules exclusively active inside printable popup */}
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                @page {
                  size: portrait;
                  margin: 15mm 15mm 15mm 15mm;
                }
                body {
                  background-color: white !important;
                  color: black !important;
                }
                /* Hide everything using visibility to support React rendering tree */
                body * {
                  visibility: hidden !important;
                }
                /* Only show the printable bill area and its children */
                #printable-bill-area, #printable-bill-area * {
                  visibility: visible !important;
                }
                /* Position the bill area perfectly to cover the whole print layout */
                #printable-bill-area {
                  visibility: visible !important;
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  border: none !important;
                  box-shadow: none !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  background: white !important;
                }
                /* Collapse parent containers to prevent extra blank pages */
                #app-root, #main-app-container, #app-stage, #invoice-print-dialog, #invoice-print-dialog > div {
                  height: 0 !important;
                  min-height: 0 !important;
                  overflow: visible !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  border: none !important;
                  background: transparent !important;
                  box-shadow: none !important;
                }
                .no-print {
                  display: none !important;
                  visibility: hidden !important;
                }
              }
            `}} />

            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
              {/* Header inside Modal overlay */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 no-print">
                <div className="flex items-center gap-1.5">
                  <Printer className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Xem & In Hóa Đơn Chuyên Nghiệp</h3>
                </div>
                <button onClick={() => setPrintModalOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable container displaying the bill paper layout */}
              <div className="p-8 max-h-[70vh] overflow-y-auto bg-slate-100/50">
                
                {/* Physical Bill Layout Page */}
                <div id="printable-bill-area" className="bg-white p-8 border border-slate-300 rounded-lg shadow-sm mx-auto font-sans text-slate-900">
                  
                  {/* Brand Header */}
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm tracking-wide uppercase">AN NHIÊN APPARTMENT</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Hệ thống quản lý vận hành phòng trọ & căn hộ dịch vụ</p>
                      <p className="text-[10px] text-slate-500 mt-1">SĐT: 0909.123.456 - Email: dangvankhoa0602@gmail.com</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-[10px] font-bold rounded">PHÒNG {room.name}</span>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">Mã HĐ: {selectedInvoiceToPrint.id}</p>
                    </div>
                  </div>

                  {/* Main Title */}
                  <div className="text-center my-6 space-y-1">
                    <h2 className="text-lg font-bold tracking-tight text-slate-900 uppercase">HÓA ĐƠN TIỀN PHÒNG & DỊCH VỤ</h2>
                    <span className="block text-xs font-semibold text-slate-500">Kỳ Thanh Toán: Tháng {selectedInvoiceToPrint.month} / Năm {selectedInvoiceToPrint.year}</span>
                    <span className="block text-[10px] text-slate-400">Ngày xuất hóa đơn: {new Date().toLocaleDateString('vi-VN')}</span>
                  </div>

                  {/* General Premises info */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg text-[11px] mb-4">
                    <div>
                      <span className="block text-slate-400 font-medium">Khách hàng:</span>
                      <span className="font-bold text-slate-800">Khách thuê phòng {room.name}</span>
                      <span className="block text-slate-500 mt-1">Cơ sở: {room.buildingName}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-medium">Phương thức đóng tiền:</span>
                      <span className="font-bold text-slate-800">Chuyển khoản hoặc Tiền mặt</span>
                      <span className="block text-indigo-600 font-mono mt-1 font-bold">STK ACB: 9999678999</span>
                    </div>
                  </div>

                  {/* Billing Cycle Explanation Callout */}
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-[10px] text-slate-700 leading-relaxed mb-6">
                    💡 <strong>Lưu ý về chu kỳ thanh toán:</strong> Tiền thuê phòng được thu trước cho <strong>tháng {nextMonthVal}/{nextYearVal}</strong>. Chỉ số điện & nước được đối soát dựa trên lượng sử dụng thực tế của <strong>tháng {selectedInvoiceToPrint.month}/{selectedInvoiceToPrint.year}</strong>.
                  </div>

                  {/* Pricing detail Table */}
                  <table className="w-full text-left text-[11px] border-collapse mb-6">
                    <thead>
                      <tr className="border-b-2 border-slate-900 text-slate-500 uppercase tracking-wider font-bold">
                        <th className="py-2">Mục Chi Phí / Dịch Vụ</th>
                        <th className="py-2 text-center">Chỉ Số Cũ</th>
                        <th className="py-2 text-center">Chỉ Số Mới</th>
                        <th className="py-2 text-center">Tiêu Thụ</th>
                        <th className="py-2 text-right">Đơn Giá</th>
                        <th className="py-2 text-right">Thành Tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      
                      {/* 1. Base rent price */}
                      <tr>
                        <td className="py-2.5 font-bold text-slate-800">
                          Tiền phòng tháng {nextMonthVal}/{nextYearVal} (Thu trước)
                          <span className="block text-[9px] text-slate-400 font-normal">
                            Thanh toán trước tiền thuê nhà kỳ kế tiếp
                          </span>
                        </td>
                        <td className="py-2.5 text-center text-slate-400">-</td>
                        <td className="py-2.5 text-center text-slate-400">-</td>
                        <td className="py-2.5 text-center font-semibold">1 tháng</td>
                        <td className="py-2.5 text-right font-mono">{formatCurrency(selectedInvoiceToPrint.rentPrice)}</td>
                        <td className="py-2.5 text-right font-bold font-mono">{formatCurrency(selectedInvoiceToPrint.rentPrice)}</td>
                      </tr>

                      {/* 2. Electricity */}
                      <tr>
                        <td className="py-2.5 font-bold text-slate-800">
                          Tiền điện sử dụng tháng {selectedInvoiceToPrint.month}/{selectedInvoiceToPrint.year}
                          <span className="block text-[9px] text-indigo-500 font-normal">
                            (Thực tế tiêu thụ trong tháng này)
                          </span>
                        </td>
                        <td className="py-2.5 text-center font-mono">{matchingMeter ? matchingMeter.powerOld : '-'}</td>
                        <td className="py-2.5 text-center font-mono">{matchingMeter ? matchingMeter.powerNew : '-'}</td>
                        <td className="py-2.5 text-center font-semibold font-mono">
                          {matchingMeter ? `${matchingMeter.powerNew - matchingMeter.powerOld} kWh` : '-'}
                        </td>
                        <td className="py-2.5 text-right font-mono">
                          {selectedInvoiceToPrint.electricityPrice !== undefined ? formatCurrency(selectedInvoiceToPrint.electricityPrice) : '3.800đ'}
                        </td>
                        <td className="py-2.5 text-right font-bold font-mono">{formatCurrency(selectedInvoiceToPrint.powerPrice)}</td>
                      </tr>

                      {/* 3. Water */}
                      <tr>
                        <td className="py-2.5 font-bold text-slate-800">
                          Tiền nước sinh hoạt tháng {selectedInvoiceToPrint.month}/{selectedInvoiceToPrint.year}
                          <span className="block text-[9px] text-indigo-500 font-normal">
                            ({(selectedInvoiceToPrint.waterType ?? 'PER_PERSON') === 'PER_CUBIC' ? 'Tính theo m³ tiêu thụ thực tế' : 'Tính khoán theo số lượng người ở'})
                          </span>
                        </td>
                        <td className="py-2.5 text-center font-mono">
                          {(selectedInvoiceToPrint.waterType ?? 'PER_PERSON') === 'PER_CUBIC' && matchingMeter ? matchingMeter.waterOld : '-'}
                        </td>
                        <td className="py-2.5 text-center font-mono">
                          {(selectedInvoiceToPrint.waterType ?? 'PER_PERSON') === 'PER_CUBIC' && matchingMeter ? matchingMeter.waterNew : '-'}
                        </td>
                        <td className="py-2.5 text-center font-semibold font-mono">
                          {(selectedInvoiceToPrint.waterType ?? 'PER_PERSON') === 'PER_CUBIC' 
                            ? (matchingMeter ? `${matchingMeter.powerNew !== undefined ? Math.max(0, matchingMeter.waterNew - matchingMeter.waterOld) : 0} m³` : '-')
                            : `${selectedInvoiceToPrint.numberOfOccupants ?? 1} người`
                          }
                        </td>
                        <td className="py-2.5 text-right font-mono">
                          {selectedInvoiceToPrint.waterPriceUnit !== undefined ? formatCurrency(selectedInvoiceToPrint.waterPriceUnit) : '25.000đ'}
                        </td>
                        <td className="py-2.5 text-right font-bold font-mono">{formatCurrency(selectedInvoiceToPrint.waterPrice)}</td>
                      </tr>

                      {/* 4. Fixed Laundry machine */}
                      {((selectedInvoiceToPrint.machineWashingPrice ?? 0) > 0) && (
                        <tr>
                          <td className="py-2.5 font-bold text-slate-800">Phí máy giặt & Dịch vụ chung</td>
                          <td className="py-2.5 text-center text-slate-400">-</td>
                          <td className="py-2.5 text-center text-slate-400">-</td>
                          <td className="py-2.5 text-center font-semibold">Cố định</td>
                          <td className="py-2.5 text-right font-mono">{formatCurrency(selectedInvoiceToPrint.machineWashingPrice ?? 0)}</td>
                          <td className="py-2.5 text-right font-bold font-mono">{formatCurrency(selectedInvoiceToPrint.machineWashingPrice ?? 0)}</td>
                        </tr>
                      )}

                      {/* 5. Wifi */}
                      {((selectedInvoiceToPrint.internetPrice ?? 0) > 0) && (
                        <tr>
                          <td className="py-2.5 font-bold text-slate-800">Phí mạng Internet / Wifi</td>
                          <td className="py-2.5 text-center text-slate-400">-</td>
                          <td className="py-2.5 text-center text-slate-400">-</td>
                          <td className="py-2.5 text-center font-semibold">Cố định</td>
                          <td className="py-2.5 text-right font-mono">{formatCurrency(selectedInvoiceToPrint.internetPrice ?? 0)}</td>
                          <td className="py-2.5 text-right font-bold font-mono">{formatCurrency(selectedInvoiceToPrint.internetPrice ?? 0)}</td>
                        </tr>
                      )}

                      {/* 6. Parking fee */}
                      {((selectedInvoiceToPrint.parkingPrice ?? 0) > 0) && (
                        <tr>
                          <td className="py-2.5 font-bold text-slate-800">Phí giữ xe máy</td>
                          <td className="py-2.5 text-center text-slate-400">-</td>
                          <td className="py-2.5 text-center text-slate-400">-</td>
                          <td className="py-2.5 text-center font-semibold">Cố định</td>
                          <td className="py-2.5 text-right font-mono">{formatCurrency(selectedInvoiceToPrint.parkingPrice ?? 0)}</td>
                          <td className="py-2.5 text-right font-bold font-mono">{formatCurrency(selectedInvoiceToPrint.parkingPrice ?? 0)}</td>
                        </tr>
                      )}

                      {/* 7. Extra price */}
                      {(selectedInvoiceToPrint.extraPrice > 0) && (
                        <tr>
                          <td className="py-2.5 font-bold text-amber-700">Phụ thu phát sinh</td>
                          <td className="py-2.5 text-center text-slate-400">-</td>
                          <td className="py-2.5 text-center text-slate-400">-</td>
                          <td className="py-2.5 text-center font-semibold">Điều chỉnh</td>
                          <td className="py-2.5 text-right font-mono">{formatCurrency(selectedInvoiceToPrint.extraPrice)}</td>
                          <td className="py-2.5 text-right font-bold font-mono text-amber-700">+{formatCurrency(selectedInvoiceToPrint.extraPrice)}</td>
                        </tr>
                      )}

                      {/* 8. Discounts */}
                      {(selectedInvoiceToPrint.discountPrice > 0) && (
                        <tr>
                          <td className="py-2.5 font-bold text-rose-700">Chiết khấu / Giảm giá</td>
                          <td className="py-2.5 text-center text-slate-400">-</td>
                          <td className="py-2.5 text-center text-slate-400">-</td>
                          <td className="py-2.5 text-center font-semibold">Khuyến mãi</td>
                          <td className="py-2.5 text-right font-mono">-{formatCurrency(selectedInvoiceToPrint.discountPrice)}</td>
                          <td className="py-2.5 text-right font-bold font-mono text-rose-700">-{formatCurrency(selectedInvoiceToPrint.discountPrice)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Summary Totals Calculation */}
                  <div className="w-1/2 ml-auto space-y-1.5 border-t-2 border-slate-900 pt-3 text-[11px]">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-500">Tổng cộng hóa đơn:</span>
                      <span className="font-mono text-slate-900 font-semibold">{formatCurrency(selectedInvoiceToPrint.totalAmount)}</span>
                    </div>
                    {selectedInvoiceToPrint.discountPrice > 0 && (
                      <div className="flex justify-between font-medium">
                        <span className="text-rose-600">Tổng tiền giảm trừ:</span>
                        <span className="font-mono text-rose-600 font-semibold">-{formatCurrency(selectedInvoiceToPrint.discountPrice)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-indigo-950 border-b border-dashed border-slate-200 pb-1.5">
                      <span>CẦN THANH TOÁN:</span>
                      <span className="font-mono text-xs">{formatCurrency(expectedTotal)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-emerald-600">
                      <span>ĐÃ THANH TOÁN (THỰC THU):</span>
                      <span className="font-mono">{formatCurrency(selectedInvoiceToPrint.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-rose-600 pt-1.5 border-t border-slate-950">
                      <span>CÒN NỢ (CẦN THU THÊM):</span>
                      <span className="font-mono text-xs">{formatCurrency(remainingDebt)}</span>
                    </div>
                  </div>

                  {/* Notes & Signatures footer */}
                  <div className="mt-8 pt-4 border-t border-slate-200 grid grid-cols-2 gap-8 text-[11px]">
                    <div>
                      <span className="block font-bold text-slate-800">Ghi chú thanh toán:</span>
                      <p className="text-slate-500 italic mt-1 leading-relaxed">
                        {selectedInvoiceToPrint.notes || 'Hóa đơn đã được ghi nhận và đối soát tự động trên hệ thống An Nhiên Appartment.'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-400 italic">Trạng thái: {
                        selectedInvoiceToPrint.status === 'paid' ? 'Đã thu đủ' :
                        selectedInvoiceToPrint.status === 'partially_paid' ? 'Đã thu một phần' : 'Chưa đóng tiền'
                      }</span>
                    </div>
                  </div>

                  <div className="mt-12 grid grid-cols-2 text-center text-[11px] font-semibold gap-4 h-24">
                    <div>
                      <span className="block mb-12">Đại diện ban quản lý (Ký, ghi rõ họ tên)</span>
                      <span className="block text-slate-400 italic">Ban Quản Lý An Nhiên</span>
                    </div>
                    <div>
                      <span className="block mb-12">Khách thuê phòng (Ký, ghi rõ họ tên)</span>
                      <span className="block text-slate-400 italic">Người Nộp Tiền</span>
                    </div>
                  </div>

                </div>

              </div>

              {/* Actions Footer inside Modal overlay (Non-printable) */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 no-print">
                <button
                  onClick={() => setPrintModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Đóng Lại
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> In Bill Ngay
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* State-based custom delete confirmation modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4" id="custom-delete-invoice-dialog">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Xác Nhận Xóa Hóa Đơn</h3>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa hóa đơn của <strong className="text-slate-900">phòng {roomNameToDelete}</strong>?
              Hành động này sẽ xóa toàn bộ lịch sử thu tiền của hóa đơn này và không thể phục hồi.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setInvoiceIdToDelete(null);
                  setRoomNameToDelete('');
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer"
              >
                Đồng Ý Xóa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
