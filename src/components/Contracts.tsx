import React, { useState, useMemo } from 'react';
import { Building, Room, Tenant, Contract, formatCurrency } from '../types';
import { FileText, Plus, Search, Trash2, Edit, X, Calendar, User, ShieldAlert, Filter, DollarSign, Building2 } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface ContractsProps {
  buildings: Building[];
  rooms: Room[];
  tenants: Tenant[];
  contracts: Contract[];
  onAdd: (contract: Omit<Contract, 'id'>) => Promise<void>;
  onUpdate: (id: string, contract: Partial<Contract>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function Contracts({ buildings, rooms, tenants, contracts, onAdd, onUpdate, onDelete }: ContractsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('startDate_desc');

  // Extract all unique years from contracts start and end dates
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    contracts.forEach(c => {
      if (c.startDate) {
        const yr = c.startDate.split('-')[0];
        if (yr && yr.length === 4) yearsSet.add(yr);
      }
      if (c.endDate) {
        const yr = c.endDate.split('-')[0];
        if (yr && yr.length === 4) yearsSet.add(yr);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [contracts]);

  // Dialog Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [roomId, setRoomId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deposit, setDeposit] = useState('');
  const [rentPrice, setRentPrice] = useState('');

  // Custom Billing Rules states
  const [numberOfOccupants, setNumberOfOccupants] = useState('1');
  const [electricityPrice, setElectricityPrice] = useState('4000');
  const [waterPrice, setWaterPrice] = useState('100000');
  const [waterType, setWaterType] = useState<'PER_PERSON' | 'PER_CUBIC'>('PER_PERSON');
  const [machineWashingPrice, setMachineWashingPrice] = useState('0');
  const [internetPrice, setInternetPrice] = useState('0');
  const [parkingPrice, setParkingPrice] = useState('0');

  // Reset Form
  const resetForm = () => {
    setRoomId('');
    setTenantId('');
    setStartDate('');
    setEndDate('');
    setDeposit('');
    setRentPrice('');
    setNumberOfOccupants('1');
    setElectricityPrice('4000');
    setWaterPrice('100000');
    setWaterType('PER_PERSON');
    setMachineWashingPrice('0');
    setInternetPrice('0');
    setParkingPrice('0');
    setEditingContract(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c: Contract) => {
    setEditingContract(c);
    setRoomId(c.roomId);
    setTenantId(c.tenantId);
    setStartDate(c.startDate);
    setEndDate(c.endDate);
    setDeposit(String(c.deposit));
    setRentPrice(String(c.rentPrice));
    
    // Load custom billing rules with smart fallbacks
    setNumberOfOccupants(String(c.numberOfOccupants ?? 1));
    setElectricityPrice(String(c.electricityPrice ?? 4000));
    setWaterPrice(String(c.waterPrice ?? 100000));
    setWaterType(c.waterType ?? 'PER_PERSON');
    setMachineWashingPrice(String(c.machineWashingPrice ?? 0));
    setInternetPrice(String(c.internetPrice ?? 0));
    setParkingPrice(String(c.parkingPrice ?? 0));
    setIsFormOpen(true);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId || !tenantId || !startDate || !endDate || !deposit || !rentPrice) {
      alert('Vui lòng điền đầy đủ tất cả các trường dữ liệu bắt buộc.');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      alert('Ngày hết hạn hợp đồng phải lớn hơn ngày bắt đầu hợp đồng.');
      return;
    }

    const payload = {
      roomId,
      tenantId,
      startDate,
      endDate,
      deposit: Number(deposit),
      rentPrice: Number(rentPrice),
      // Add custom billing rules to payload
      numberOfOccupants: Number(numberOfOccupants),
      electricityPrice: Number(electricityPrice),
      waterPrice: Number(waterPrice),
      waterType,
      machineWashingPrice: Number(machineWashingPrice),
      internetPrice: Number(internetPrice),
      parkingPrice: Number(parkingPrice)
    };

    try {
      if (editingContract) {
        await onUpdate(editingContract.id, payload);
      } else {
        await onAdd(payload);
      }
      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi lưu hợp đồng thuê.');
    }
  };

  // Delete Handler
  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await onDelete(deletingId);
    } catch (err) {
      console.error(err);
      alert('Không thể xóa hợp đồng thuê.');
    }
  };

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

  const tenantsMap = useMemo(() => {
    const map: Record<string, Tenant> = {};
    tenants.forEach(t => { map[t.id] = t; });
    return map;
  }, [tenants]);

  // Form selections
  // Build a standard selection option for rooms following the format: "Phòng [Tên phòng] - Tòa [Tên tòa nhà]"
  const formattedRoomOptions = useMemo(() => {
    return rooms.map(room => {
      const buildingName = buildingsMap[room.buildingId] || 'Hệ thống';
      return {
        id: room.id,
        displayName: `Phòng ${room.name} - Tòa ${buildingName}`,
        basePrice: room.basePrice
      };
    });
  }, [rooms, buildingsMap]);

  // Handle room change in form to auto-fill base price
  const handleRoomSelect = (selectedId: string) => {
    setRoomId(selectedId);
    const selectedRoom = rooms.find(r => r.id === selectedId);
    if (selectedRoom && !rentPrice) {
      setRentPrice(String(selectedRoom.basePrice));
      // Usually deposit equals 1 month of rent
      if (!deposit) setDeposit(String(selectedRoom.basePrice));
    }
  };

  // Filter contract records
  const filteredContracts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    let result = contracts.filter(c => {
      const tenant = tenantsMap[c.tenantId];
      const tenantName = tenant ? tenant.name.toLowerCase() : '';
      const room = roomsMap[c.roomId];
      const roomName = room ? room.name.toLowerCase() : '';
      
      const matchesSearch = tenantName.includes(searchTerm.toLowerCase()) || 
                            roomName.includes(searchTerm.toLowerCase());

      const isExpired = c.endDate < today;
      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = !isExpired;
      } else if (statusFilter === 'expired') {
        matchesStatus = isExpired;
      }

      let matchesBuilding = true;
      if (selectedBuildingFilter !== 'all') {
        const roomObj = rooms.find(r => r.id === c.roomId);
        matchesBuilding = roomObj ? roomObj.buildingId === selectedBuildingFilter : false;
      }

      let matchesYear = true;
      if (selectedYearFilter !== 'all') {
        const startYr = c.startDate ? c.startDate.split('-')[0] : '';
        const endYr = c.endDate ? c.endDate.split('-')[0] : '';
        matchesYear = startYr === selectedYearFilter || endYr === selectedYearFilter;
      }

      return matchesSearch && matchesStatus && matchesBuilding && matchesYear;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortOrder === 'startDate_desc') {
        return b.startDate.localeCompare(a.startDate);
      } else if (sortOrder === 'startDate_asc') {
        return a.startDate.localeCompare(b.startDate);
      } else if (sortOrder === 'endDate_desc') {
        return b.endDate.localeCompare(a.endDate);
      } else if (sortOrder === 'endDate_asc') {
        return a.endDate.localeCompare(b.endDate);
      } else if (sortOrder === 'rent_desc') {
        return b.rentPrice - a.rentPrice;
      } else if (sortOrder === 'rent_asc') {
        return a.rentPrice - b.rentPrice;
      } else if (sortOrder === 'deposit_desc') {
        return b.deposit - a.deposit;
      }
      return 0;
    });

    return result;
  }, [contracts, searchTerm, statusFilter, selectedBuildingFilter, selectedYearFilter, sortOrder, tenantsMap, roomsMap, rooms]);

  // Compute summary metrics for contracts
  const filteredStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    let totalDeposit = 0;
    let totalMonthlyRent = 0;
    let activeCount = 0;
    let expiredCount = 0;

    filteredContracts.forEach(c => {
      const isExpired = c.endDate < today;
      if (isExpired) {
        expiredCount++;
      } else {
        activeCount++;
        totalMonthlyRent += c.rentPrice;
      }
      totalDeposit += c.deposit;
    });

    return {
      totalCount: filteredContracts.length,
      totalDeposit,
      totalMonthlyRent,
      activeCount,
      expiredCount
    };
  }, [filteredContracts]);

  return (
    <div className="space-y-8">
      {/* Header section with Add trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900" id="contracts-title">Quản Lý Hợp Đồng Thuê</h1>
          <p className="text-xs text-slate-500 mt-1">Lưu trữ thông tin pháp lý hợp đồng, ngày bắt đầu/hết hạn, tiền đặt cọc và mức giá thuê ký kết.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-fit cursor-pointer"
          id="btn-add-contract"
        >
          <Plus className="w-4 h-4" /> Ký Hợp Đồng Mới
        </button>
      </div>

      {/* Premium mini-overview panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white rounded-xl border border-slate-200 p-4 shadow-xs" id="contracts-summary-panel">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng tiền cọc nắm giữ</span>
            <span className="block text-base font-bold font-mono text-emerald-600 mt-0.5">{formatCurrency(filteredStats.totalDeposit)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doanh thu thuê ký kết / Tháng</span>
            <span className="block text-base font-bold font-mono text-indigo-600 mt-0.5">{formatCurrency(filteredStats.totalMonthlyRent)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hợp đồng lọc được</span>
            <span className="block text-sm font-bold text-slate-800 mt-0.5">
              {filteredStats.activeCount} hoạt động / {filteredStats.expiredCount} hết hạn ({filteredStats.totalCount} tổng)
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar Filter */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3" id="contract-toolbar">
        {/* Search */}
        <div className="col-span-2 md:col-span-1 relative">
          <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên khách hoặc số phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-700 h-9"
          />
        </div>

        {/* Year Filter */}
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={selectedYearFilter}
            onChange={(e) => setSelectedYearFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer h-9"
          >
            <option value="all">Tất cả các năm</option>
            {availableYears.map(yr => (
              <option key={yr} value={yr}>Năm {yr}</option>
            ))}
          </select>
        </div>

        {/* Building Filter */}
        <div className="flex items-center gap-1 col-span-2 md:col-span-1">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={selectedBuildingFilter}
            onChange={(e) => setSelectedBuildingFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer h-9"
          >
            <option value="all">Tất cả tòa nhà</option>
            {buildings.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Status filter tabs */}
        <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50/50 self-center col-span-2 md:col-span-1 h-9">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 text-center py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              statusFilter === 'all' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`flex-1 text-center py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              statusFilter === 'active' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Đang chạy
          </button>
          <button
            onClick={() => setStatusFilter('expired')}
            className={`flex-1 text-center py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
              statusFilter === 'expired' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Hết hạn
          </button>
        </div>

        {/* Sort order filter */}
        <div className="flex items-center gap-1 col-span-2 md:col-span-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0 hidden xl:inline">Sắp xếp:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full rounded-lg border border-indigo-100 bg-white px-2 py-2 text-xs font-semibold text-indigo-600 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer h-9"
          >
            <option value="startDate_desc">Bắt đầu: Mới nhất</option>
            <option value="startDate_asc">Bắt đầu: Cũ nhất</option>
            <option value="endDate_asc">Hết hạn: Sắp tới nhất</option>
            <option value="endDate_desc">Hết hạn: Xa nhất</option>
            <option value="rent_desc">Giá thuê: Cao nhất</option>
            <option value="rent_asc">Giá thuê: Thấp nhất</option>
            <option value="deposit_desc">Tiền cọc: Cao nhất</option>
          </select>
        </div>
      </div>

      {/* Contracts table list */}
      {filteredContracts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center" id="empty-contracts">
          <FileText className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-xs font-bold text-slate-800 uppercase tracking-wider">Không tìm thấy hợp đồng nào</h3>
          <p className="mt-1 text-xs text-slate-500">Ký hợp đồng thuê đầu tiên bằng cách nhấn vào nút "Ký Hợp Đồng Mới".</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden" id="contracts-table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs" id="contracts-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Khách thuê</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Phòng trọ</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Thời hạn</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Giá thuê ký kết</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Tiền đặt cọc</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="p-4 text-right font-bold text-slate-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContracts.map(c => {
                  const tenant = tenantsMap[c.tenantId];
                  const room = roomsMap[c.roomId];
                  
                  const today = new Date().toISOString().split('T')[0];
                  const isExpired = c.endDate < today;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/55 transition-colors">
                      {/* Tenant name and phone */}
                      <td className="p-4">
                        {tenant ? (
                          <>
                            <span className="block font-bold text-slate-800 text-sm">{tenant.name}</span>
                            <span className="block text-[10px] text-slate-400 font-semibold font-mono mt-0.5">SĐT: {tenant.phone}</span>
                          </>
                        ) : (
                          <span className="text-slate-400 italic font-medium">Khách đã xóa</span>
                        )}
                      </td>

                      {/* Room & Building name */}
                      <td className="p-4">
                        {room ? (
                          <>
                            <span className="block font-bold text-indigo-950 text-sm">{room.name}</span>
                            <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Tòa: {room.buildingName}</span>
                          </>
                        ) : (
                          <span className="text-slate-400 italic font-medium">Phòng đã xóa</span>
                        )}
                      </td>

                      {/* Dates duration */}
                      <td className="p-4">
                        <span className="block font-mono text-slate-600 font-semibold">{c.startDate}</span>
                        <span className="block font-mono text-slate-400 font-semibold mt-0.5">➜ {c.endDate}</span>
                      </td>

                      {/* Rent price */}
                      <td className="p-4 font-mono">
                        <span className="block font-bold text-slate-900 text-sm">{formatCurrency(c.rentPrice)}</span>
                        
                        {/* Custom billing rules list summary */}
                        <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-500 font-sans leading-tight bg-slate-50 border border-slate-100 rounded-lg p-1.5">
                          <div className="flex justify-between gap-2">
                            <span>👥 Số khách:</span>
                            <span className="font-bold text-slate-700">{c.numberOfOccupants ?? 1} ng</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span>⚡ Điện:</span>
                            <span className="font-bold text-slate-700">{formatCurrency(c.electricityPrice ?? 4000)}/kWh</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span>💧 Nước:</span>
                            <span className="font-bold text-slate-700">
                              {formatCurrency(c.waterPrice ?? 100000)}/{(c.waterType ?? 'PER_PERSON') === 'PER_CUBIC' ? 'm³' : 'ng'}
                            </span>
                          </div>
                          {((c.machineWashingPrice ?? 0) > 0) && (
                            <div className="flex justify-between gap-2">
                              <span>🧺 Máy giặt:</span>
                              <span className="font-bold text-slate-700">+{formatCurrency(c.machineWashingPrice ?? 0)}</span>
                            </div>
                          )}
                          {((c.internetPrice ?? 0) > 0) && (
                            <div className="flex justify-between gap-2">
                              <span>🌐 Internet:</span>
                              <span className="font-bold text-slate-700">+{formatCurrency(c.internetPrice ?? 0)}</span>
                            </div>
                          )}
                          {((c.parkingPrice ?? 0) > 0) && (
                            <div className="flex justify-between gap-2">
                              <span>🛵 Xe máy:</span>
                              <span className="font-bold text-slate-700">+{formatCurrency(c.parkingPrice ?? 0)}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Security Deposit */}
                      <td className="p-4 font-bold text-emerald-600 text-sm font-mono">
                        {formatCurrency(c.deposit)}
                      </td>

                      {/* Status Check badge */}
                      <td className="p-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isExpired ? 'bg-rose-50 text-rose-700 border-rose-200/50' : 'bg-emerald-50 text-emerald-700 border-emerald-200/50'
                        }`}>
                          {isExpired ? 'Hết hạn' : 'Đang hiệu lực'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(c.id)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 hover:bg-rose-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
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

      {/* Contract Add/Edit Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4" id="contract-form-dialog">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                {editingContract ? 'Cập Nhật Hợp Đồng Thuê' : 'Đăng Ký Ký Hợp Đồng Mới'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              
              {/* Room select option - formatted carefully */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Căn Hộ / Phòng Cho Thuê</label>
                <select
                  value={roomId}
                  onChange={(e) => handleRoomSelect(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">-- Chọn phòng thuê --</option>
                  {formattedRoomOptions.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.displayName} (Gốc: {formatCurrency(opt.basePrice)})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1.5 italic leading-tight">
                  Lọc kỹ phòng kèm tên tòa nhà tránh trùng số phòng giữa các cơ sở.
                </p>
              </div>

              {/* Tenant select */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Chủ Hợp Đồng (Khách Thuê)</label>
                <select
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">-- Chọn khách ký hợp đồng --</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} - SĐT {t.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date and End Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ngày Bắt Đầu</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ngày Hết Hạn</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Rent price and Deposit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Giá Thuê Thỏa Thuận (đ)</label>
                  <input
                    type="number"
                    value={rentPrice}
                    onChange={(e) => setRentPrice(e.target.value)}
                    placeholder="Mức giá thuê"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tiền Đặt Cọc (đ)</label>
                  <input
                    type="number"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    placeholder="Tiền cọc"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* ⚡ CẤU HÌNH ĐƠN GIÁ DỊCH VỤ HÀNG THÁNG */}
              <div className="border-t border-slate-200/80 pt-4 mt-2 space-y-4">
                <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-900 px-3 py-2 rounded-lg border border-indigo-100">
                  <span className="font-bold text-sm">⚡</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Cấu Hình Đơn Giá Dịch Vụ Hàng Tháng</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Số khách ở thực tế</label>
                    <input
                      type="number"
                      value={numberOfOccupants}
                      onChange={(e) => setNumberOfOccupants(e.target.value)}
                      placeholder="VD: 2 người"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Đơn giá điện (đ/kWh)</label>
                    <input
                      type="number"
                      value={electricityPrice}
                      onChange={(e) => setElectricityPrice(e.target.value)}
                      placeholder="Gợi ý: 4000"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cách tính tiền nước</label>
                    <select
                      value={waterType}
                      onChange={(e) => setWaterType(e.target.value as 'PER_PERSON' | 'PER_CUBIC')}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none cursor-pointer"
                    >
                      <option value="PER_PERSON">Đầu người (đ/người)</option>
                      <option value="PER_CUBIC">Theo số khối đồng hồ (đ/m³)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {waterType === 'PER_PERSON' ? 'Đơn giá nước / Người (đ)' : 'Đơn giá nước / Số Khối (đ)'}
                    </label>
                    <input
                      type="number"
                      value={waterPrice}
                      onChange={(e) => setWaterPrice(e.target.value)}
                      placeholder={waterType === 'PER_PERSON' ? 'Gợi ý: 100000' : 'Gợi ý: 25000'}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Fixed Monthly Services */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 space-y-3">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phí dịch vụ cố định hàng tháng</span>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1" title="Phí máy giặt + Dịch vụ chung">Phí máy giặt (đ)</label>
                      <input
                        type="number"
                        value={machineWashingPrice}
                        onChange={(e) => setMachineWashingPrice(e.target.value)}
                        placeholder="0"
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1" title="Phí Internet/Wifi">Phí Wifi (đ)</label>
                      <input
                        type="number"
                        value={internetPrice}
                        onChange={(e) => setInternetPrice(e.target.value)}
                        placeholder="0"
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1" title="Phí gửi xe hàng tháng">Phí xe (đ)</label>
                      <input
                        type="number"
                        value={parkingPrice}
                        onChange={(e) => setParkingPrice(e.target.value)}
                        placeholder="0"
                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold font-mono focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Submit Buttons */}
              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-bold shadow-sm cursor-pointer"
                >
                  {editingContract ? 'Cập Nhật Hợp Đồng' : 'Ký Kết Hợp Đồng'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deletingId !== null}
        onClose={() => setDeletingId(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa hợp đồng"
        message="Bạn có chắc chắn muốn hủy/xóa hợp đồng này? Thao tác này không thể hoàn tác và các thông tin liên quan có thể bị ảnh hưởng."
      />

    </div>
  );
}
