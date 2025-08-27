import { 
  mockUsers, 
  mockVehicles, 
  mockOwners, 
  mockProcedures, 
  mockPayments, 
  mockDocuments, 
  mockNotifications, 
  mockSettings 
} from '@/data/mockData';
import { 
  User, 
  Vehicle, 
  Owner, 
  Procedure, 
  Payment, 
  Document,
  Notification 
} from '@/types';

// Simulate API delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const mockService = {
  // Users
  async getUsers(): Promise<User[]> {
    await delay();
    return [...mockUsers];
  },

  async createUser(userData: Partial<User>): Promise<User> {
    await delay();
    const newUser: User = {
      id: (mockUsers.length + 1).toString(),
      name: userData.name || '',
      email: userData.email || '',
      role: userData.role || 'agent',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockUsers.push(newUser);
    return newUser;
  },

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    await delay();
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    
    mockUsers[index] = {
      ...mockUsers[index],
      ...userData,
      updated_at: new Date().toISOString()
    };
    return mockUsers[index];
  },

  async deleteUser(id: string): Promise<void> {
    await delay();
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    mockUsers.splice(index, 1);
  },

  // Vehicles
  async getVehicles(): Promise<Vehicle[]> {
    await delay();
    return [...mockVehicles];
  },

  async getVehicle(id: string): Promise<Vehicle | null> {
    await delay();
    return mockVehicles.find(v => v.id === id) || null;
  },

  async createVehicle(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    await delay();
    const newVehicle: Vehicle = {
      id: (mockVehicles.length + 1).toString(),
      license_plate: vehicleData.license_plate || '',
      make: vehicleData.make || '',
      model: vehicleData.model || '',
      color: vehicleData.color || '',
      year: vehicleData.year || new Date().getFullYear(),
      type: vehicleData.type || 'car',
      status: vehicleData.status || 'impounded',
      impound_date: vehicleData.impound_date || new Date().toISOString(),
      location: vehicleData.location || '',
      photos: vehicleData.photos || [],
      qr_code: vehicleData.qr_code,
      owner_id: vehicleData.owner_id,
      estimated_value: vehicleData.estimated_value || 0,
      description: vehicleData.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockVehicles.push(newVehicle);
    return newVehicle;
  },

  async updateVehicle(id: string, vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    await delay();
    const index = mockVehicles.findIndex(v => v.id === id);
    if (index === -1) throw new Error('Vehicle not found');
    
    mockVehicles[index] = {
      ...mockVehicles[index],
      ...vehicleData,
      updated_at: new Date().toISOString()
    };
    return mockVehicles[index];
  },

  // Owners
  async getOwners(): Promise<Owner[]> {
    await delay();
    return [...mockOwners];
  },

  async getOwner(id: string): Promise<Owner | null> {
    await delay();
    return mockOwners.find(o => o.id === id) || null;
  },

  async createOwner(ownerData: Partial<Owner>): Promise<Owner> {
    await delay();
    const newOwner: Owner = {
      id: (mockOwners.length + 1).toString(),
      first_name: ownerData.first_name || '',
      last_name: ownerData.last_name || '',
      phone: ownerData.phone || '',
      email: ownerData.email,
      address: ownerData.address || '',
      id_number: ownerData.id_number || '',
      id_type: ownerData.id_type || 'cni',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockOwners.push(newOwner);
    return newOwner;
  },

  // Procedures
  async getProcedures(): Promise<Procedure[]> {
    await delay();
    return [...mockProcedures];
  },

  async getProcedure(id: string): Promise<Procedure | null> {
    await delay();
    return mockProcedures.find(p => p.id === id) || null;
  },

  async createProcedure(procedureData: Partial<Procedure>): Promise<Procedure> {
    await delay();
    const newProcedure: Procedure = {
      id: (mockProcedures.length + 1).toString(),
      vehicle_id: procedureData.vehicle_id || '',
      type: procedureData.type || 'release',
      status: procedureData.status || 'pending',
      documents: procedureData.documents || [],
      fees_calculated: procedureData.fees_calculated || 0,
      created_by: procedureData.created_by || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockProcedures.push(newProcedure);
    return newProcedure;
  },

  async updateProcedure(id: string, procedureData: Partial<Procedure>): Promise<Procedure> {
    await delay();
    const index = mockProcedures.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Procedure not found');
    
    mockProcedures[index] = {
      ...mockProcedures[index],
      ...procedureData,
      updated_at: new Date().toISOString()
    };
    return mockProcedures[index];
  },

  // Payments
  async getPayments(): Promise<Payment[]> {
    await delay();
    return [...mockPayments];
  },

  async createPayment(paymentData: Partial<Payment>): Promise<Payment> {
    await delay();
    const newPayment: Payment = {
      id: (mockPayments.length + 1).toString(),
      vehicle_id: paymentData.vehicle_id || '',
      owner_id: paymentData.owner_id || '',
      amount: paymentData.amount || 0,
      payment_method: paymentData.payment_method || 'cash',
      payment_date: paymentData.payment_date || new Date().toISOString(),
      reference: paymentData.reference || `PAY-${Date.now()}`,
      description: paymentData.description || '',
      receipt_url: paymentData.receipt_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockPayments.push(newPayment);
    return newPayment;
  },

  // Notifications
  async getNotifications(): Promise<any[]> {
    await delay();
    return [...mockNotifications];
  },

  // Documents
  async getDocuments(): Promise<Document[]> {
    await delay();
    return [...mockDocuments];
  },

  // Dashboard stats
  async getDashboardStats() {
    await delay();
    const totalVehicles = mockVehicles.length;
    const impoundedVehicles = mockVehicles.filter(v => v.status === 'impounded').length;
    const claimedVehicles = mockVehicles.filter(v => v.status === 'claimed').length;
    const totalRevenue = mockPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const pendingProcedures = mockProcedures.filter(p => p.status === 'pending').length;
    const inProgressProcedures = mockProcedures.filter(p => p.status === 'in_progress').length;
    const completedProcedures = mockProcedures.filter(p => p.status === 'completed').length;

    return {
      totalVehicles,
      impoundedVehicles,
      claimedVehicles,
      totalRevenue,
      recentPayments: mockPayments.slice(-5),
      pendingProcedures,
      inProgressProcedures,
      completedProcedures
    };
  }
};