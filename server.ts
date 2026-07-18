import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { 
  Building, 
  Room, 
  Tenant, 
  MeterReading, 
  Expense, 
  Contract, 
  Invoice,
  SERVICE_PRICES
} from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

const DB_FILE = path.join(process.cwd(), 'db.json');

// Helper to read database
function readDb(): {
  buildings: Building[];
  rooms: Room[];
  tenants: Tenant[];
  meters: MeterReading[];
  expenses: Expense[];
  contracts: Contract[];
  invoices: Invoice[];
} {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialData = seedDatabase();
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error("Error reading database file, returning empty schema", error);
    return {
      buildings: [],
      rooms: [],
      tenants: [],
      meters: [],
      expenses: [],
      contracts: [],
      invoices: []
    };
  }
}

// Helper to write database
function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error("Error writing database file", error);
  }
}

// Seed highly realistic multi-year data
function seedDatabase() {
  const buildings: Building[] = [
    {
      id: 'b-1',
      name: 'Tòa Nhà Happy House',
      address: 'Ngõ 105 Xuân Thủy, Cầu Giấy, Hà Nội',
      description: 'Chung cư mini 5 tầng, 15 phòng khép kín, bảo vệ 24/7.'
    },
    {
      id: 'b-2',
      name: 'Chung Cư Mini Sunrise',
      address: 'Số 42 Đường Trần Thái Tông, Cầu Giấy, Hà Nội',
      description: 'Tòa nhà mới bàn giao, trang bị thang máy và khóa vân tay.'
    },
    {
      id: 'b-3',
      name: 'Nhà Trọ Mỹ Đình',
      address: 'Ngõ 20 Lê Đức Thọ, Nam Từ Liêm, Hà Nội',
      description: 'Nhà dòng tiền bình dân, không chung chủ, giờ giấc tự do.'
    }
  ];

  const rooms: Room[] = [
    // Building 1 (Happy House)
    { id: 'r-101', buildingId: 'b-1', name: 'Phòng 101', basePrice: 4200000, status: 'occupied' },
    { id: 'r-102', buildingId: 'b-1', name: 'Phòng 102', basePrice: 4000000, status: 'occupied' },
    { id: 'r-201', buildingId: 'b-1', name: 'Phòng 201', basePrice: 4500000, status: 'occupied' },
    { id: 'r-202', buildingId: 'b-1', name: 'Phòng 202', basePrice: 4100000, status: 'empty' },
    
    // Building 2 (Sunrise)
    { id: 'r-s1', buildingId: 'b-2', name: 'Phòng 401', basePrice: 5500000, status: 'occupied' },
    { id: 'r-s2', buildingId: 'b-2', name: 'Phòng 402', basePrice: 5800000, status: 'occupied' },
    { id: 'r-s3', buildingId: 'b-2', name: 'Phòng 501', basePrice: 5500000, status: 'occupied' },
    
    // Building 3 (Mỹ Đình)
    { id: 'r-m1', buildingId: 'b-3', name: 'Phòng M1', basePrice: 2800000, status: 'occupied' },
    { id: 'r-m2', buildingId: 'b-3', name: 'Phòng M2', basePrice: 3000000, status: 'occupied' },
    { id: 'r-m3', buildingId: 'b-3', name: 'Phòng M3', basePrice: 2800000, status: 'empty' },
  ];

  const tenants: Tenant[] = [
    { id: 't-1', roomId: 'r-101', name: 'Nguyễn Văn An', phone: '0912345678', idNumber: '001201012345', temporaryResidenceStatus: true },
    { id: 't-2', roomId: 'r-102', name: 'Trần Thị Bình', phone: '0987654321', idNumber: '002202023456', temporaryResidenceStatus: true },
    { id: 't-3', roomId: 'r-201', name: 'Phạm Hồng Cường', phone: '0934567890', idNumber: '003203034567', temporaryResidenceStatus: false },
    { id: 't-4', roomId: 'r-s1', name: 'Lê Minh Dương', phone: '0945678901', idNumber: '004204045678', temporaryResidenceStatus: true },
    { id: 't-5', roomId: 'r-s2', name: 'Hoàng Quốc Đạt', phone: '0956789012', idNumber: '005205056789', temporaryResidenceStatus: true },
    { id: 't-6', roomId: 'r-s3', name: 'Vũ Thị Thanh Hương', phone: '0967890123', idNumber: '006206067890', temporaryResidenceStatus: false },
    { id: 't-7', roomId: 'r-m1', name: 'Đỗ Văn Khánh', phone: '0978901234', idNumber: '007207078901', temporaryResidenceStatus: true },
    { id: 't-8', roomId: 'r-m2', name: 'Bùi Thị Lan', phone: '0989012345', idNumber: '008208089012', temporaryResidenceStatus: false },
  ];

  const contracts: Contract[] = [
    { id: 'c-1', roomId: 'r-101', tenantId: 't-1', startDate: '2024-01-01', endDate: '2025-01-01', deposit: 4200000, rentPrice: 4200000 },
    { id: 'c-2', roomId: 'r-102', tenantId: 't-2', startDate: '2024-03-15', endDate: '2025-03-15', deposit: 4000000, rentPrice: 4000000 },
    { id: 'c-3', roomId: 'r-201', tenantId: 't-3', startDate: '2024-06-01', endDate: '2025-06-01', deposit: 4500000, rentPrice: 4500000 },
    { id: 'c-4', roomId: 'r-s1', tenantId: 't-4', startDate: '2025-01-10', endDate: '2026-01-10', deposit: 5500000, rentPrice: 5500000 },
    { id: 'c-5', roomId: 'r-s2', tenantId: 't-5', startDate: '2025-02-01', endDate: '2026-02-01', deposit: 5800000, rentPrice: 5800000 },
    { id: 'c-6', roomId: 'r-s3', tenantId: 't-6', startDate: '2025-03-01', endDate: '2026-03-01', deposit: 5500000, rentPrice: 5500000 },
    { id: 'c-7', roomId: 'r-m1', tenantId: 't-7', startDate: '2024-10-01', endDate: '2025-10-01', deposit: 2800000, rentPrice: 2800000 },
    { id: 'c-8', roomId: 'r-m2', tenantId: 't-8', startDate: '2024-11-15', endDate: '2025-11-15', deposit: 3000000, rentPrice: 3000000 },
  ];

  const meters: MeterReading[] = [];
  const expenses: Expense[] = [];
  const invoices: Invoice[] = [];

  // Generate multi-year mock transactions (2024, 2025, 2026) to make the dashboard look spectacular!
  const years = [2024, 2025, 2026];
  const occupiedRoomIds = rooms.filter(r => r.status === 'occupied').map(r => r.id);

  let meterIdCounter = 1;
  let expenseIdCounter = 1;
  let invoiceIdCounter = 1;

  for (const year of years) {
    // 2026 only has data up to July
    const maxMonth = year === 2026 ? 7 : 12;

    for (let month = 1; month <= maxMonth; month++) {
      // Add operational expenses
      if (month % 2 === 0) {
        expenses.push({
          id: `exp-${expenseIdCounter++}`,
          category: 'Sửa chữa & Bảo trì',
          amount: Math.floor(Math.random() * 1500000) + 500000,
          date: `${year}-${String(month).padStart(2, '0')}-05`,
          description: `Bảo dưỡng điều hòa & sửa chữa vòi nước rò rỉ`,
          buildingId: month % 4 === 0 ? 'b-1' : 'b-2',
          roomId: null
        });
      }

      if (month % 3 === 0) {
        expenses.push({
          id: `exp-${expenseIdCounter++}`,
          category: 'Điện nước chung',
          amount: Math.floor(Math.random() * 2000000) + 1000000,
          date: `${year}-${String(month).padStart(2, '0')}-12`,
          description: `Thanh toán hóa đơn điện nước dùng chung hành lang`,
          buildingId: null,
          roomId: null
        });
      }

      // Internet and waste collection
      expenses.push({
        id: `exp-${expenseIdCounter++}`,
        category: 'Internet & Vệ sinh',
        amount: 850000,
        date: `${year}-${String(month).padStart(2, '0')}-02`,
        description: `Cáp quang tốc độ cao & phí rác toàn bộ các phòng`,
        buildingId: null,
        roomId: null
      });

      // Annual Tax & Insurance in Month 1
      if (month === 1) {
        expenses.push({
          id: `exp-${expenseIdCounter++}`,
          category: 'Thuế & Phí quản lý',
          amount: 3500000,
          date: `${year}-01-20`,
          description: `Kê khai thuế môn bài & đóng bảo hiểm cháy nổ`,
          buildingId: null,
          roomId: null
        });
      }

      // Generate meter readings & invoices for each occupied room
      for (const roomId of occupiedRoomIds) {
        const room = rooms.find(r => r.id === roomId)!;
        
        // Base numbers
        const basePower = 100 + (month * 80) + (year - 2024) * 1000;
        const powerDiff = Math.floor(Math.random() * 150) + 80; // 80 - 230 kWh
        
        const baseWater = 20 + (month * 10) + (year - 2024) * 120;
        const waterDiff = Math.floor(Math.random() * 12) + 4; // 4 - 16 m3

        const meter: MeterReading = {
          id: `m-${meterIdCounter++}`,
          roomId,
          month,
          year,
          powerOld: basePower,
          powerNew: basePower + powerDiff,
          waterOld: baseWater,
          waterNew: baseWater + waterDiff,
          extraPrice: month % 5 === 0 ? 150000 : 0,
          extraNotes: month % 5 === 0 ? 'Phụ thu vệ sinh sửa đường ống phát sinh' : ''
        };

        meters.push(meter);

        // Calculate bill amounts
        const rentPrice = room.basePrice;
        const powerPrice = powerDiff * SERVICE_PRICES.powerUnitPrice;
        const waterPrice = waterDiff * SERVICE_PRICES.waterUnitPrice;
        const extraPrice = meter.extraPrice;
        const discountPrice = 0;
        const totalAmount = rentPrice + powerPrice + waterPrice + extraPrice;

        // Is it paid? In older years, everything is paid. In 2026, recent invoices might be unpaid or partially paid
        let paidAmount = totalAmount;
        let status: 'unpaid' | 'paid' | 'partially_paid' = 'paid';
        let paymentDate: string | null = `${year}-${String(month).padStart(2, '0')}-10`;

        if (year === 2026 && month === 7) {
          // July 2026 is unpaid (just generated)
          paidAmount = 0;
          status = 'unpaid';
          paymentDate = null;
        } else if (year === 2026 && month === 6) {
          // June 2026 is mostly paid, but some are partially paid
          if (roomId === 'r-101') {
            paidAmount = totalAmount - 1000000;
            status = 'partially_paid';
            paymentDate = `${year}-06-11`;
          } else if (roomId === 'r-s1') {
            paidAmount = 0;
            status = 'unpaid';
            paymentDate = null;
          }
        }

        invoices.push({
          id: `inv-${invoiceIdCounter++}`,
          roomId,
          month,
          year,
          rentPrice,
          powerPrice,
          waterPrice,
          extraPrice,
          discountPrice,
          totalAmount,
          paidAmount,
          status,
          paymentDate,
          notes: `Hóa đơn thanh toán tiền thuê & dịch vụ tháng ${month}/${year}`
        });
      }
    }
  }

  return {
    buildings,
    rooms,
    tenants,
    meters,
    expenses,
    contracts,
    invoices
  };
}

// REST APIs
// 1. BUILDINGS
app.get('/api/v1/buildings', (req, res) => {
  const db = readDb();
  res.json(db.buildings);
});

app.post('/api/v1/buildings', (req, res) => {
  const db = readDb();
  const newBuilding: Building = {
    id: `b-${Date.now()}`,
    name: req.body.name || 'Tòa nhà mới',
    address: req.body.address || '',
    description: req.body.description || ''
  };
  db.buildings.push(newBuilding);
  writeDb(db);
  res.status(201).json(newBuilding);
});

app.put('/api/v1/buildings/:id', (req, res) => {
  const db = readDb();
  const idx = db.buildings.findIndex(b => b.id === req.params.id);
  if (idx !== -1) {
    db.buildings[idx] = { ...db.buildings[idx], ...req.body };
    writeDb(db);
    res.json(db.buildings[idx]);
  } else {
    res.status(404).json({ message: 'Building not found' });
  }
});

app.delete('/api/v1/buildings/:id', (req, res) => {
  const db = readDb();
  db.buildings = db.buildings.filter(b => b.id !== req.params.id);
  // Also clean up or orphan rooms? Better to keep data clean, but in a simple DB we filter
  writeDb(db);
  res.json({ success: true });
});

// 2. ROOMS
app.get('/api/v1/rooms', (req, res) => {
  const db = readDb();
  res.json(db.rooms);
});

app.post('/api/v1/rooms', (req, res) => {
  const db = readDb();
  const newRoom: Room = {
    id: `r-${Date.now()}`,
    buildingId: req.body.buildingId,
    name: req.body.name || 'Phòng mới',
    basePrice: Number(req.body.basePrice) || 0,
    status: req.body.status || 'empty'
  };
  db.rooms.push(newRoom);
  writeDb(db);
  res.status(201).json(newRoom);
});

app.put('/api/v1/rooms/:id', (req, res) => {
  const db = readDb();
  const idx = db.rooms.findIndex(r => r.id === req.params.id);
  if (idx !== -1) {
    db.rooms[idx] = { 
      ...db.rooms[idx], 
      ...req.body,
      basePrice: req.body.basePrice !== undefined ? Number(req.body.basePrice) : db.rooms[idx].basePrice
    };
    writeDb(db);
    res.json(db.rooms[idx]);
  } else {
    res.status(404).json({ message: 'Room not found' });
  }
});

app.delete('/api/v1/rooms/:id', (req, res) => {
  const db = readDb();
  db.rooms = db.rooms.filter(r => r.id !== req.params.id);
  writeDb(db);
  res.json({ success: true });
});

// 3. TENANTS
app.get('/api/v1/tenants', (req, res) => {
  const db = readDb();
  res.json(db.tenants);
});

app.post('/api/v1/tenants', (req, res) => {
  const db = readDb();
  const newTenant: Tenant = {
    id: `t-${Date.now()}`,
    roomId: req.body.roomId,
    name: req.body.name || '',
    phone: req.body.phone || '',
    idNumber: req.body.idNumber || '',
    temporaryResidenceStatus: !!req.body.temporaryResidenceStatus
  };
  db.tenants.push(newTenant);
  
  // Update room status to occupied
  const roomIdx = db.rooms.findIndex(r => r.id === req.body.roomId);
  if (roomIdx !== -1) {
    db.rooms[roomIdx].status = 'occupied';
  }

  writeDb(db);
  res.status(201).json(newTenant);
});

app.put('/api/v1/tenants/:id', (req, res) => {
  const db = readDb();
  const idx = db.tenants.findIndex(t => t.id === req.params.id);
  if (idx !== -1) {
    const oldRoomId = db.tenants[idx].roomId;
    const newRoomId = req.body.roomId;

    db.tenants[idx] = { 
      ...db.tenants[idx], 
      ...req.body,
      temporaryResidenceStatus: req.body.temporaryResidenceStatus !== undefined ? !!req.body.temporaryResidenceStatus : db.tenants[idx].temporaryResidenceStatus
    };

    // If tenant room changed, update room statuses
    if (newRoomId && oldRoomId !== newRoomId) {
      // old room status might be empty if no other tenant is there
      const otherTenantsInOld = db.tenants.filter(t => t.roomId === oldRoomId && t.id !== req.params.id);
      if (otherTenantsInOld.length === 0) {
        const rOldIdx = db.rooms.findIndex(r => r.id === oldRoomId);
        if (rOldIdx !== -1) db.rooms[rOldIdx].status = 'empty';
      }
      // new room status occupied
      const rNewIdx = db.rooms.findIndex(r => r.id === newRoomId);
      if (rNewIdx !== -1) db.rooms[rNewIdx].status = 'occupied';
    }

    writeDb(db);
    res.json(db.tenants[idx]);
  } else {
    res.status(404).json({ message: 'Tenant not found' });
  }
});

app.delete('/api/v1/tenants/:id', (req, res) => {
  const db = readDb();
  const tenant = db.tenants.find(t => t.id === req.params.id);
  if (tenant) {
    const roomId = tenant.roomId;
    db.tenants = db.tenants.filter(t => t.id !== req.params.id);
    
    // check if room is empty now
    const activeTenants = db.tenants.filter(t => t.roomId === roomId);
    if (activeTenants.length === 0) {
      const roomIdx = db.rooms.findIndex(r => r.id === roomId);
      if (roomIdx !== -1) {
        db.rooms[roomIdx].status = 'empty';
      }
    }
  }
  writeDb(db);
  res.json({ success: true });
});

// 4. METERS (Chốt số điện nước & Phụ phí)
app.get('/api/v1/meters', (req, res) => {
  const db = readDb();
  res.json(db.meters);
});

// Batch Save Monthly Readings (Nút "Lưu Tất Cả Dữ Liệu Tháng")
app.post('/api/v1/meters/batch', (req, res) => {
  const db = readDb();
  const { month, year, readings } = req.body; // readings: Array of { roomId, powerOld, powerNew, waterOld, waterNew, extraPrice, extraNotes }

  if (!month || !year || !Array.isArray(readings)) {
    return res.status(400).json({ error: 'Month, Year, and Readings array are required' });
  }

  const numericMonth = Number(month);
  const numericYear = Number(year);

  for (const r of readings) {
    // Unique constraint: @@unique([roomId, month, year])
    const idx = db.meters.findIndex(
      m => m.roomId === r.roomId && m.month === numericMonth && m.year === numericYear
    );

    const dataPayload: MeterReading = {
      id: idx !== -1 ? db.meters[idx].id : `m-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      roomId: r.roomId,
      month: numericMonth,
      year: numericYear,
      powerOld: Number(r.powerOld) || 0,
      powerNew: Number(r.powerNew) || 0,
      waterOld: Number(r.waterOld) || 0,
      waterNew: Number(r.waterNew) || 0,
      extraPrice: Number(r.extraPrice) || 0,
      extraNotes: r.extraNotes || ''
    };

    if (idx !== -1) {
      db.meters[idx] = dataPayload;
    } else {
      db.meters.push(dataPayload);
    }
  }

  writeDb(db);
  res.json({ success: true, count: readings.length });
});

// Single meter update
app.put('/api/v1/meters/:id', (req, res) => {
  const db = readDb();
  const idx = db.meters.findIndex(m => m.id === req.params.id);
  if (idx !== -1) {
    db.meters[idx] = {
      ...db.meters[idx],
      ...req.body,
      powerOld: req.body.powerOld !== undefined ? Number(req.body.powerOld) : db.meters[idx].powerOld,
      powerNew: req.body.powerNew !== undefined ? Number(req.body.powerNew) : db.meters[idx].powerNew,
      waterOld: req.body.waterOld !== undefined ? Number(req.body.waterOld) : db.meters[idx].waterOld,
      waterNew: req.body.waterNew !== undefined ? Number(req.body.waterNew) : db.meters[idx].waterNew,
      extraPrice: req.body.extraPrice !== undefined ? Number(req.body.extraPrice) : db.meters[idx].extraPrice,
    };
    writeDb(db);
    res.json(db.meters[idx]);
  } else {
    res.status(404).json({ message: 'Meter reading not found' });
  }
});

// 5. EXPENSES
app.get('/api/v1/expenses', (req, res) => {
  const db = readDb();
  res.json(db.expenses);
});

app.post('/api/v1/expenses', (req, res) => {
  const db = readDb();
  // Safe filtering of empty strings to null for clean foreign keys in relational simulation
  const buildingId = req.body.buildingId && req.body.buildingId.trim() !== "" ? req.body.buildingId : null;
  const roomId = req.body.roomId && req.body.roomId.trim() !== "" ? req.body.roomId : null;

  const newExpense: Expense = {
    id: `exp-${Date.now()}`,
    category: req.body.category || 'Khác',
    amount: Number(req.body.amount) || 0,
    date: req.body.date || new Date().toISOString().split('T')[0],
    description: req.body.description || '',
    buildingId,
    roomId
  };

  db.expenses.push(newExpense);
  writeDb(db);
  res.status(201).json(newExpense);
});

app.put('/api/v1/expenses/:id', (req, res) => {
  const db = readDb();
  const idx = db.expenses.findIndex(e => e.id === req.params.id);
  if (idx !== -1) {
    const buildingId = req.body.buildingId && req.body.buildingId.trim() !== "" ? req.body.buildingId : null;
    const roomId = req.body.roomId && req.body.roomId.trim() !== "" ? req.body.roomId : null;

    db.expenses[idx] = {
      ...db.expenses[idx],
      ...req.body,
      amount: req.body.amount !== undefined ? Number(req.body.amount) : db.expenses[idx].amount,
      buildingId: req.body.buildingId !== undefined ? buildingId : db.expenses[idx].buildingId,
      roomId: req.body.roomId !== undefined ? roomId : db.expenses[idx].roomId,
    };
    writeDb(db);
    res.json(db.expenses[idx]);
  } else {
    res.status(404).json({ message: 'Expense not found' });
  }
});

app.delete('/api/v1/expenses/:id', (req, res) => {
  const db = readDb();
  db.expenses = db.expenses.filter(e => e.id !== req.params.id);
  writeDb(db);
  res.json({ success: true });
});

// 6. CONTRACTS
app.get('/api/v1/contracts', (req, res) => {
  const db = readDb();
  res.json(db.contracts);
});

app.post('/api/v1/contracts', (req, res) => {
  const db = readDb();
  const newContract: Contract = {
    id: `c-${Date.now()}`,
    roomId: req.body.roomId,
    tenantId: req.body.tenantId,
    startDate: req.body.startDate || '',
    endDate: req.body.endDate || '',
    deposit: Number(req.body.deposit) || 0,
    rentPrice: Number(req.body.rentPrice) || 0,
    // Store custom billing rules
    numberOfOccupants: req.body.numberOfOccupants !== undefined ? Number(req.body.numberOfOccupants) : 1,
    electricityPrice: req.body.electricityPrice !== undefined ? Number(req.body.electricityPrice) : 4000,
    waterPrice: req.body.waterPrice !== undefined ? Number(req.body.waterPrice) : 100000,
    waterType: req.body.waterType || 'PER_PERSON',
    machineWashingPrice: req.body.machineWashingPrice !== undefined ? Number(req.body.machineWashingPrice) : 0,
    internetPrice: req.body.internetPrice !== undefined ? Number(req.body.internetPrice) : 0,
    parkingPrice: req.body.parkingPrice !== undefined ? Number(req.body.parkingPrice) : 0
  };

  db.contracts.push(newContract);

  // Update room status to occupied
  const roomIdx = db.rooms.findIndex(r => r.id === req.body.roomId);
  if (roomIdx !== -1) {
    db.rooms[roomIdx].status = 'occupied';
  }

  writeDb(db);
  res.status(201).json(newContract);
});

app.put('/api/v1/contracts/:id', (req, res) => {
  const db = readDb();
  const idx = db.contracts.findIndex(c => c.id === req.params.id);
  if (idx !== -1) {
    db.contracts[idx] = {
      ...db.contracts[idx],
      ...req.body,
      deposit: req.body.deposit !== undefined ? Number(req.body.deposit) : db.contracts[idx].deposit,
      rentPrice: req.body.rentPrice !== undefined ? Number(req.body.rentPrice) : db.contracts[idx].rentPrice,
      numberOfOccupants: req.body.numberOfOccupants !== undefined ? Number(req.body.numberOfOccupants) : db.contracts[idx].numberOfOccupants,
      electricityPrice: req.body.electricityPrice !== undefined ? Number(req.body.electricityPrice) : db.contracts[idx].electricityPrice,
      waterPrice: req.body.waterPrice !== undefined ? Number(req.body.waterPrice) : db.contracts[idx].waterPrice,
      waterType: req.body.waterType !== undefined ? req.body.waterType : db.contracts[idx].waterType,
      machineWashingPrice: req.body.machineWashingPrice !== undefined ? Number(req.body.machineWashingPrice) : db.contracts[idx].machineWashingPrice,
      internetPrice: req.body.internetPrice !== undefined ? Number(req.body.internetPrice) : db.contracts[idx].internetPrice,
      parkingPrice: req.body.parkingPrice !== undefined ? Number(req.body.parkingPrice) : db.contracts[idx].parkingPrice,
    };
    writeDb(db);
    res.json(db.contracts[idx]);
  } else {
    res.status(404).json({ message: 'Contract not found' });
  }
});

app.delete('/api/v1/contracts/:id', (req, res) => {
  const db = readDb();
  db.contracts = db.contracts.filter(c => c.id !== req.params.id);
  writeDb(db);
  res.json({ success: true });
});

// 7. INVOICES (Hóa Đơn & VietQR)
app.get('/api/v1/invoices', (req, res) => {
  const db = readDb();
  res.json(db.invoices);
});

// Auto-generate invoices for a given month and year
app.post('/api/v1/invoices/generate', (req, res) => {
  const db = readDb();
  const { month, year } = req.body;

  if (!month || !year) {
    return res.status(400).json({ error: 'Month and Year are required' });
  }

  const numericMonth = Number(month);
  const numericYear = Number(year);

  // Find all occupied rooms or rooms with active contracts
  // Let's generate for rooms with active contracts or just occupied rooms
  const roomsToInvoice = db.rooms.filter(r => r.status === 'occupied');
  const generated: Invoice[] = [];

  for (const room of roomsToInvoice) {
    // Check if invoice already exists
    const exists = db.invoices.find(
      inv => inv.roomId === room.id && inv.month === numericMonth && inv.year === numericYear
    );
    if (exists) continue; // skip duplicates

    // Get active contract to get actual rentPrice and billing rules
    const contract = db.contracts.find(
      c => c.roomId === room.id && c.startDate <= `${numericYear}-${String(numericMonth).padStart(2, '0')}-31`
    );
    
    // Get custom rules from contract, or apply smart defaults
    const rentPrice = contract ? contract.rentPrice : room.basePrice;
    const numberOfOccupants = contract?.numberOfOccupants !== undefined ? contract.numberOfOccupants : 1;
    const electricityPrice = contract?.electricityPrice !== undefined ? contract.electricityPrice : 4000;
    const waterPriceUnit = contract?.waterPrice !== undefined ? contract.waterPrice : 100000;
    const waterType = contract?.waterType || 'PER_PERSON';
    const machineWashingPrice = contract?.machineWashingPrice !== undefined ? contract.machineWashingPrice : 0;
    const internetPrice = contract?.internetPrice !== undefined ? contract.internetPrice : 0;
    const parkingPrice = contract?.parkingPrice !== undefined ? contract.parkingPrice : 0;

    // Get meter reading for this month/year
    const meter = db.meters.find(
      m => m.roomId === room.id && m.month === numericMonth && m.year === numericYear
    );

    let powerPrice = 0;
    let waterPrice = 0;
    let extraPrice = 0;

    if (meter) {
      const powerDiff = Math.max(0, meter.powerNew - meter.powerOld);
      const waterDiff = Math.max(0, meter.waterNew - meter.waterOld);
      
      powerPrice = powerDiff * electricityPrice;
      
      if (waterType === 'PER_PERSON') {
        waterPrice = numberOfOccupants * waterPriceUnit;
      } else {
        waterPrice = waterDiff * waterPriceUnit;
      }
      
      extraPrice = meter.extraPrice;
    } else {
      // If no meter reading yet, calculate water if it's flat PER_PERSON
      if (waterType === 'PER_PERSON') {
        waterPrice = numberOfOccupants * waterPriceUnit;
      }
    }

    const totalAmount = rentPrice + powerPrice + waterPrice + extraPrice + machineWashingPrice + internetPrice + parkingPrice;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      roomId: room.id,
      month: numericMonth,
      year: numericYear,
      rentPrice,
      powerPrice,
      waterPrice,
      extraPrice,
      discountPrice: 0,
      totalAmount,
      paidAmount: 0,
      status: 'unpaid',
      paymentDate: null,
      notes: `Hóa đơn tự động phát sinh cho tháng ${numericMonth}/${numericYear}`,
      // Snapshot the rules
      numberOfOccupants,
      electricityPrice,
      waterPriceUnit,
      waterType,
      machineWashingPrice,
      internetPrice,
      parkingPrice
    };

    db.invoices.push(newInvoice);
    generated.push(newInvoice);
  }

  writeDb(db);
  res.json({ success: true, count: generated.length, invoices: generated });
});

// Update an invoice (payment status/amount paid)
app.put('/api/v1/invoices/:id/payment', (req, res) => {
  const db = readDb();
  const idx = db.invoices.findIndex(inv => inv.id === req.params.id);
  if (idx !== -1) {
    const paidAmount = Number(req.body.paidAmount);
    const invoice = db.invoices[idx];

    let status: 'unpaid' | 'paid' | 'partially_paid' = 'unpaid';
    if (paidAmount >= invoice.totalAmount - invoice.discountPrice) {
      status = 'paid';
    } else if (paidAmount > 0) {
      status = 'partially_paid';
    }

    db.invoices[idx] = {
      ...invoice,
      paidAmount,
      status,
      paymentDate: paidAmount > 0 ? (req.body.paymentDate || new Date().toISOString().split('T')[0]) : null,
      notes: req.body.notes !== undefined ? req.body.notes : invoice.notes
    };

    writeDb(db);
    res.json(db.invoices[idx]);
  } else {
    res.status(404).json({ message: 'Invoice not found' });
  }
});

// Full update / adjustment of an invoice
app.put('/api/v1/invoices/:id', (req, res) => {
  const db = readDb();
  const idx = db.invoices.findIndex(inv => inv.id === req.params.id);
  if (idx !== -1) {
    const existing = db.invoices[idx];
    
    // Parse values safely
    const rentPrice = req.body.rentPrice !== undefined ? Number(req.body.rentPrice) : existing.rentPrice;
    const powerPrice = req.body.powerPrice !== undefined ? Number(req.body.powerPrice) : existing.powerPrice;
    const waterPrice = req.body.waterPrice !== undefined ? Number(req.body.waterPrice) : existing.waterPrice;
    const extraPrice = req.body.extraPrice !== undefined ? Number(req.body.extraPrice) : existing.extraPrice;
    const discountPrice = req.body.discountPrice !== undefined ? Number(req.body.discountPrice) : existing.discountPrice;
    const machineWashingPrice = req.body.machineWashingPrice !== undefined ? Number(req.body.machineWashingPrice) : (existing.machineWashingPrice || 0);
    const internetPrice = req.body.internetPrice !== undefined ? Number(req.body.internetPrice) : (existing.internetPrice || 0);
    const parkingPrice = req.body.parkingPrice !== undefined ? Number(req.body.parkingPrice) : (existing.parkingPrice || 0);
    
    // Auto-calculate totalAmount
    const totalAmount = rentPrice + powerPrice + waterPrice + extraPrice + machineWashingPrice + internetPrice + parkingPrice;
    
    const paidAmount = req.body.paidAmount !== undefined ? Number(req.body.paidAmount) : existing.paidAmount;
    
    // Recalculate status
    let status: 'unpaid' | 'paid' | 'partially_paid' = 'unpaid';
    if (paidAmount >= totalAmount - discountPrice) {
      status = 'paid';
    } else if (paidAmount > 0) {
      status = 'partially_paid';
    }

    db.invoices[idx] = {
      ...existing,
      rentPrice,
      powerPrice,
      waterPrice,
      extraPrice,
      discountPrice,
      machineWashingPrice,
      internetPrice,
      parkingPrice,
      totalAmount,
      paidAmount,
      status,
      paymentDate: req.body.paymentDate !== undefined ? req.body.paymentDate : existing.paymentDate,
      notes: req.body.notes !== undefined ? req.body.notes : existing.notes,
      numberOfOccupants: req.body.numberOfOccupants !== undefined ? Number(req.body.numberOfOccupants) : existing.numberOfOccupants,
      electricityPrice: req.body.electricityPrice !== undefined ? Number(req.body.electricityPrice) : existing.electricityPrice,
      waterPriceUnit: req.body.waterPriceUnit !== undefined ? Number(req.body.waterPriceUnit) : existing.waterPriceUnit,
      waterType: req.body.waterType !== undefined ? req.body.waterType : existing.waterType,
    };

    writeDb(db);
    res.json(db.invoices[idx]);
  } else {
    res.status(404).json({ message: 'Invoice not found' });
  }
});

// Delete an invoice
app.delete('/api/v1/invoices/:id', (req, res) => {
  const db = readDb();
  db.invoices = db.invoices.filter(inv => inv.id !== req.params.id);
  writeDb(db);
  res.json({ success: true });
});

// Serve frontend build files in production mode, use Vite Dev Server in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
