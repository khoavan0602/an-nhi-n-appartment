import React, { useState, useMemo } from 'react';
import { Building, Room, Expense, ExpenseCategory, formatCurrency } from '../types';
import { Briefcase, Plus, Search, Filter, Trash2, Edit, X, Calendar, MapPin, Home, DollarSign } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface ExpensesProps {
  buildings: Building[];
  rooms: Room[];
  expenses: Expense[];
  onAdd: (expense: Omit<Expense, 'id'>) => Promise<void>;
  onUpdate: (id: string, expense: Partial<Expense>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const CATEGORIES: ExpenseCategory[] = [
  'Sửa chữa & Bảo trì',
  'Điện nước chung',
  'Mua sắm thiết bị',
  'Thuế & Phí quản lý',
  'Internet & Vệ sinh',
  'Khác'
];

export default function Expenses({ buildings, rooms, expenses, onAdd, onUpdate, onDelete }: ExpensesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState<string>('all');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('all');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('date_desc');

  // Extract all unique years from expenses
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    expenses.forEach(exp => {
      if (exp.date) {
        const yr = exp.date.split('-')[0];
        if (yr && yr.length === 4) {
          yearsSet.add(yr);
        }
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [expenses]);

  // Form states for Add/Edit Dialog
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [category, setCategory] = useState<ExpenseCategory>('Sửa chữa & Bảo trì');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [targetType, setTargetType] = useState<'global' | 'building' | 'room'>('global');
  const [targetBuildingId, setTargetBuildingId] = useState('');
  const [targetRoomId, setTargetRoomId] = useState('');

  // Reset form
  const resetForm = () => {
    setCategory('Sửa chữa & Bảo trì');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setTargetType('global');
    setTargetBuildingId('');
    setTargetRoomId('');
    setEditingExpense(null);
  };

  // Open Form for Adding
  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setCategory(exp.category);
    setAmount(String(exp.amount));
    setDate(exp.date);
    setDescription(exp.description);
    
    if (exp.roomId) {
      setTargetType('room');
      setTargetRoomId(exp.roomId);
      // set building of that room
      const r = rooms.find(rm => rm.id === exp.roomId);
      if (r) setTargetBuildingId(r.buildingId);
    } else if (exp.buildingId) {
      setTargetType('building');
      setTargetBuildingId(exp.buildingId);
      setTargetRoomId('');
    } else {
      setTargetType('global');
      setTargetBuildingId('');
      setTargetRoomId('');
    }
    setIsFormOpen(true);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('Vui lòng nhập số tiền chi lớn hơn 0');
      return;
    }

    // Clean targets - convert empty string to null as requested
    const finalBuildingId = targetType === 'building' && targetBuildingId.trim() !== '' ? targetBuildingId : null;
    const finalRoomId = targetType === 'room' && targetRoomId.trim() !== '' ? targetRoomId : null;

    const payload = {
      category,
      amount: Number(amount),
      date,
      description: description.trim(),
      buildingId: targetType === 'room' ? null : finalBuildingId, // rooms target doesn't need buildingId column in simple DB, but we can set or keep null
      roomId: finalRoomId
    };

    try {
      if (editingExpense) {
        await onUpdate(editingExpense.id, payload);
      } else {
        await onAdd(payload);
      }
      setIsFormOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi khi lưu khoản chi.');
    }
  };

  // Delete handler
  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await onDelete(deletingId);
    } catch (err) {
      console.error(err);
      alert('Không thể xóa khoản chi.');
    }
  };

  // Lookup Maps
  const buildingsMap = useMemo(() => {
    const map: Record<string, string> = {};
    buildings.forEach(b => { map[b.id] = b.name; });
    return map;
  }, [buildings]);

  const roomsMap = useMemo(() => {
    const map: Record<string, string> = {};
    rooms.forEach(r => { map[r.id] = `${r.name} (${buildingsMap[r.buildingId] || ''})`; });
    return map;
  }, [rooms, buildingsMap]);

  // Filter Rooms based on building selection in form
  const formRooms = useMemo(() => {
    if (!targetBuildingId) return rooms;
    return rooms.filter(r => r.buildingId === targetBuildingId);
  }, [rooms, targetBuildingId]);

  // Filter Expense Records for display
  const filteredExpenses = useMemo(() => {
    let result = expenses.filter(exp => {
      const matchSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          exp.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = selectedCategory === 'all' || exp.category === selectedCategory;
      
      let matchBuilding = true;
      if (selectedBuildingFilter !== 'all') {
        if (exp.buildingId) {
          matchBuilding = exp.buildingId === selectedBuildingFilter;
        } else if (exp.roomId) {
          const roomObj = rooms.find(r => r.id === exp.roomId);
          matchBuilding = roomObj ? roomObj.buildingId === selectedBuildingFilter : false;
        } else {
          // global expenses don't match specific buildings
          matchBuilding = false;
        }
      }

      let matchYear = true;
      if (selectedYearFilter !== 'all' && exp.date) {
        matchYear = exp.date.startsWith(selectedYearFilter);
      }

      let matchMonth = true;
      if (selectedMonthFilter !== 'all' && exp.date) {
        const parts = exp.date.split('-');
        if (parts[1]) {
          matchMonth = Number(parts[1]) === Number(selectedMonthFilter);
        }
      }

      return matchSearch && matchCategory && matchBuilding && matchYear && matchMonth;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortOrder === 'date_desc') {
        return b.date.localeCompare(a.date);
      } else if (sortOrder === 'date_asc') {
        return a.date.localeCompare(b.date);
      } else if (sortOrder === 'amount_desc') {
        return b.amount - a.amount;
      } else if (sortOrder === 'amount_asc') {
        return a.amount - b.amount;
      }
      return 0;
    });

    return result;
  }, [expenses, searchTerm, selectedCategory, selectedBuildingFilter, selectedYearFilter, selectedMonthFilter, sortOrder, rooms]);

  // Compute summary stats based on filtered expenses
  const filteredStats = useMemo(() => {
    const totalCount = filteredExpenses.length;
    const totalAmount = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    return { totalCount, totalAmount };
  }, [filteredExpenses]);

  return (
    <div className="space-y-8">
      {/* Header section with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900" id="expenses-title">Quản Lý Chi Phí & Bảo Trì</h1>
          <p className="text-xs text-slate-500 mt-1">Kiểm soát dòng tiền chi ra, bóc tách hóa đơn bảo dưỡng sửa chữa và mua sắm thiết bị.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-fit cursor-pointer"
          id="btn-add-expense"
        >
          <Plus className="w-4 h-4" /> Ghi Nhận Khoản Chi
        </button>
      </div>

      {/* Premium mini-overview panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white rounded-xl border border-slate-200 p-4 shadow-xs" id="expense-summary-panel">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng ngân sách chi (Bộ lọc hiện tại)</span>
            <span className="block text-lg font-bold font-mono text-rose-600 mt-0.5">{formatCurrency(filteredStats.totalAmount)}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số lượng giao dịch chi</span>
            <span className="block text-lg font-bold font-mono text-slate-800 mt-0.5">{filteredStats.totalCount} khoản chi</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3" id="expense-toolbar">
        {/* Search */}
        <div className="col-span-2 md:col-span-1 relative">
          <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-700 h-9"
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

        {/* Month Filter */}
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={selectedMonthFilter}
            onChange={(e) => setSelectedMonthFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer h-9"
          >
            <option value="all">Tất cả các tháng</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>Tháng {i + 1}</option>
            ))}
          </select>
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer h-9"
          >
            <option value="all">Tất cả danh mục chi</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Building Filter */}
        <div className="flex items-center gap-1 col-span-2 md:col-span-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
          <select
            value={selectedBuildingFilter}
            onChange={(e) => setSelectedBuildingFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer h-9"
          >
            <option value="all">Tất cả tòa nhà / Chung</option>
            {buildings.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Sort order filter */}
        <div className="flex items-center gap-1 col-span-2 md:col-span-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0 hidden xl:inline">Sắp xếp:</span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full rounded-lg border border-indigo-100 bg-white px-2 py-2 text-xs font-semibold text-indigo-600 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer h-9"
          >
            <option value="date_desc">Ngày chi: Mới nhất</option>
            <option value="date_asc">Ngày chi: Cũ nhất</option>
            <option value="amount_desc">Số tiền: Cao nhất</option>
            <option value="amount_asc">Số tiền: Thấp nhất</option>
          </select>
        </div>
      </div>

      {/* Expense List Table */}
      {filteredExpenses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center" id="empty-expenses">
          <Briefcase className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-4 text-xs font-bold text-slate-800 uppercase tracking-wider">Không tìm thấy khoản chi nào</h3>
          <p className="mt-1 text-xs text-slate-500">Bấm "Ghi Nhận Khoản Chi" để bắt đầu theo dõi chi phí vận hành.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden" id="expenses-table-container">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs" id="expenses-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Ngày chi</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Danh mục</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Số tiền</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Nội dung chi tiết</th>
                  <th className="p-4 font-bold text-slate-500 uppercase tracking-wider">Đối tượng chịu chi</th>
                  <th className="p-4 text-right font-bold text-slate-500 uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map(exp => {
                  let targetLabel = 'Hệ thống chung';
                  if (exp.roomId) {
                    targetLabel = `Phòng: ${roomsMap[exp.roomId] || exp.roomId}`;
                  } else if (exp.buildingId) {
                    targetLabel = `Tòa nhà: ${buildingsMap[exp.buildingId] || exp.buildingId}`;
                  }

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/55 transition-colors">
                      <td className="p-4 font-mono text-slate-500 font-semibold">{exp.date}</td>
                      <td className="p-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          exp.category === 'Sửa chữa & Bảo trì' ? 'bg-amber-50 text-amber-700 border-amber-200/50' :
                          exp.category === 'Điện nước chung' ? 'bg-blue-50 text-blue-700 border-blue-200/50' :
                          exp.category === 'Mua sắm thiết bị' ? 'bg-purple-50 text-purple-700 border-purple-200/50' :
                          exp.category === 'Thuế & Phí quản lý' ? 'bg-rose-50 text-rose-700 border-rose-200/50' :
                          exp.category === 'Internet & Vệ sinh' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-rose-600 text-sm font-mono">{formatCurrency(exp.amount)}</td>
                      <td className="p-4 text-slate-700 font-medium max-w-sm">{exp.description}</td>
                      <td className="p-4 text-slate-500 font-medium">{targetLabel}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(exp)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-indigo-600 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(exp.id)}
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

      {/* Add/Edit Expense Dialog Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4" id="expense-form-dialog">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                {editingExpense ? 'Cập Nhật Khoản Chi Vận Hành' : 'Ghi Nhận Khoản Chi Mới'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Danh Mục Chi Phí</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Amount and Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Số Tiền Chi (đ)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Số tiền"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono font-semibold focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ngày Phát Sinh</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Scope Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Phạm Vi Áp Dụng</label>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === 'global'}
                      onChange={() => setTargetType('global')}
                      className="text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                    />
                    Chung hệ thống
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === 'building'}
                      onChange={() => setTargetType('building')}
                      className="text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                    />
                    Cho tòa nhà
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="targetType"
                      checked={targetType === 'room'}
                      onChange={() => setTargetType('room')}
                      className="text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                    />
                    Cho phòng cụ thể
                  </label>
                </div>
              </div>

              {/* Dynamic Dropdowns for Scope */}
              {targetType === 'building' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Chọn Tòa Nhà Gắn Chi Phí</label>
                  <select
                    value={targetBuildingId}
                    onChange={(e) => setTargetBuildingId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="">-- Chọn tòa nhà --</option>
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {targetType === 'room' && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lọc Theo Tòa Nhà</label>
                    <select
                      value={targetBuildingId}
                      onChange={(e) => {
                        setTargetBuildingId(e.target.value);
                        setTargetRoomId('');
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Tất cả tòa nhà --</option>
                      {buildings.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Chọn Phòng Trọ</label>
                    <select
                      value={targetRoomId}
                      onChange={(e) => setTargetRoomId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none cursor-pointer"
                      required
                    >
                      <option value="">-- Chọn phòng --</option>
                      {formRooms.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} - {buildingsMap[r.buildingId] || ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nội Dung Chi Tiết</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ghi rõ nội dung thanh toán, lý do sửa chữa hoặc mua thiết bị..."
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  rows={3}
                  required
                />
              </div>

              {/* Submit panel */}
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
                  {editingExpense ? 'Lưu thay đổi' : 'Ghi Nhận Khoản Chi'}
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
        title="Xác nhận xóa chi phí"
        message="Bạn có chắc chắn muốn xóa khoản chi vận hành này? Thao tác này không thể hoàn tác và số liệu bảng tài chính sẽ tự động điều chỉnh."
      />

    </div>
  );
}
