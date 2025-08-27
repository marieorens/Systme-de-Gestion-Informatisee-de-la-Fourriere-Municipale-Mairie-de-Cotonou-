import { User, Vehicle, Owner, Procedure, Payment, Document } from '@/types';

// Mock users data
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Administrateur Test',
    email: 'admin@test.com',
    role: 'admin',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    name: 'Agent de Saisie Test',
    email: 'agent@test.com',
    role: 'agent',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '3',
    name: 'Responsable Financier Test',
    email: 'finance@test.com',
    role: 'finance',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  }
];

// Mock owners data
export const mockOwners: Owner[] = [
  {
    id: '1',
    first_name: 'Jean',
    last_name: 'Dupont',
    phone: '+229 97 12 34 56',
    email: 'jean.dupont@example.com',
    address: '123 Rue de la Paix, Cotonou',
    id_type: 'cni',
    id_number: 'BE12345678',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    first_name: 'Marie',
    last_name: 'Kone',
    phone: '+229 96 87 65 43',
    email: 'marie.kone@example.com',
    address: '456 Avenue de l\'Indépendance, Porto-Novo',
    id_type: 'passport',
    id_number: 'PA9876543',
    created_at: '2024-01-02T00:00:00.000Z',
    updated_at: '2024-01-02T00:00:00.000Z'
  }
];

// Mock vehicles data
export const mockVehicles: Vehicle[] = [
  {
    id: '1',
    license_plate: 'AB-123-CD',
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    color: 'Bleu',
    type: 'car',
    status: 'impounded',
    location: 'Fourrière Centrale Cotonou',
    impound_date: '2024-01-15T10:00:00.000Z',
    estimated_value: 15000000,
    owner_id: '1',
    qr_code: 'QR123456',
    photos: [],
    description: 'Véhicule en bon état',
    created_at: '2024-01-15T10:00:00.000Z',
    updated_at: '2024-01-15T10:00:00.000Z'
  },
  {
    id: '2',
    license_plate: 'EF-456-GH',
    make: 'Honda',
    model: 'Civic',
    year: 2019,
    color: 'Rouge',
    type: 'car',
    status: 'claimed',
    location: 'Fourrière Secondaire Porto-Novo',
    impound_date: '2024-01-10T14:30:00.000Z',
    estimated_value: 12000000,
    owner_id: '2',
    qr_code: 'QR789012',
    photos: [],
    description: 'Véhicule nécessitant quelques réparations',
    created_at: '2024-01-10T14:30:00.000Z',
    updated_at: '2024-01-20T16:00:00.000Z'
  }
];

// Mock procedures data
export const mockProcedures: Procedure[] = [
  {
    id: '1',
    vehicle_id: '1',
    type: 'release',
    status: 'pending',
    documents: [],
    fees_calculated: 150000,
    created_by: '2',
    created_at: '2024-01-15T10:30:00.000Z',
    updated_at: '2024-01-15T10:30:00.000Z'
  },
  {
    id: '2',
    vehicle_id: '2',
    type: 'release',
    status: 'completed',
    documents: [],
    fees_calculated: 125000,
    created_by: '2',
    created_at: '2024-01-10T15:00:00.000Z',
    updated_at: '2024-01-20T16:30:00.000Z'
  }
];

// Mock payments data
export const mockPayments: Payment[] = [
  {
    id: '1',
    vehicle_id: '2',
    owner_id: '2',
    amount: 125000,
    payment_method: 'mobile_money',
    payment_date: '2024-01-20T16:00:00.000Z',
    reference: 'PAY-2024-001',
    description: 'Frais de libération du véhicule EF-456-GH',
    receipt_url: null,
    created_at: '2024-01-20T16:00:00.000Z',
    updated_at: '2024-01-20T16:00:00.000Z'
  }
];

// Mock documents data
export const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Procès-verbal de mise en fourrière',
    type: 'pdf',
    url: '/documents/pv-001.pdf',
    uploaded_at: '2024-01-15T10:30:00.000Z'
  }
];

// Mock notifications data
export const mockNotifications = [
  {
    id: '1',
    type: 'payment',
    message: 'Paiement reçu pour le véhicule EF-456-GH',
    recipient: 'marie.kone@example.com',
    channel: 'email',
    status: 'sent',
    sent_at: '2024-01-20T16:10:00.000Z'
  }
];

// Mock settings data
export const mockSettings = [
  {
    id: '1',
    key: 'storage_fee_daily',
    value: { amount: 7500 },
    description: 'Frais de gardiennage par jour',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    key: 'administrative_fee',
    value: { amount: 50000 },
    description: 'Frais administratifs fixes',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  }
];