export interface User {
  id: number;
  username: string;
  password: string;
  role: 'user' | 'admin' | 'service' | 'imaging-technician' | 'radiographer';
  name: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'O';
  dob: string;
  contactInfo: string;
  email?: string;
  // added in response to feedback
  weightKg?: number;
  heightCm?: number;
  createdAt: string;
}

export interface WorklistItem {
  id: string;
  patientId: string;
  patientName: string;
  studyDate: string;
  studyTime: string;
  modality: 'MRI' | 'CT' | 'XR' | 'US';
  description: string;
  // additional metadata for more complete study descriptions
  details?: string;
  referringPhysician?: string;
  status: 'new' | 'ongoing' | 'completed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  imageCount: number;
  images: DicomImage[];
}

export interface DicomImage {
  id: string;
  instanceNumber: number;
  filename: string;
  seriesDescription: string;
  sliceThickness?: string;
  windowCenter?: number;
  windowWidth?: number;
  rescaleSlope?: number;
  rescaleIntercept?: number;
  viewed?: boolean;
  viewedAt?: string;
}

export interface Report {
  id: string;
  patientId: string;
  worklistId: string;
  radiologist: string;
  findings: string;
  impression: string;
  recommendations?: string;
  createdAt: string;
  status: 'draft' | 'completed' | 'signed';
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: 1,
    username: 'user1',
    password: 'pass123',
    role: 'user',
    name: 'Dr. John Smith'
  },
  {
    id: 2,
    username: 'admin1',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User'
  },
  {
    id: 3,
    username: 'service1',
    password: 'service123',
    role: 'service',
    name: 'Service Account'
  },
  {
    id: 4,
    username: 'tech1',
    password: 'tech123',
    role: 'imaging-technician',
    name: 'Sarah Johnson'
  },
  {
    id: 5,
    username: 'radio1',
    password: 'radio123',
    role: 'radiographer',
    name: 'Mike Davis'
  }
];

// Mock Patients
export const mockPatients: Patient[] = [
  {
    id: 'P001',
    name: 'John Doe',
    age: 45,
    gender: 'M',
    dob: '1979-05-15',
    contactInfo: '555-0101',
    email: 'john.doe@email.com',
    weightKg: 82,
    heightCm: 178,
    createdAt: '2025-01-10'
  },
  {
    id: 'P002',
    name: 'Jane Smith',
    age: 38,
    gender: 'F',
    dob: '1987-08-22',
    contactInfo: '555-0102',
    email: 'jane.smith@email.com',
    weightKg: 65,
    heightCm: 165,
    createdAt: '2025-01-12'
  },
  {
    id: 'P003',
    name: 'Robert Johnson',
    age: 62,
    gender: 'M',
    dob: '1963-03-10',
    contactInfo: '555-0103',
    email: 'robert.j@email.com',
    weightKg: 90,
    heightCm: 182,
    createdAt: '2025-01-15'
  },
  {
    id: 'P004',
    name: 'Maria Garcia',
    age: 51,
    gender: 'F',
    dob: '1974-12-05',
    contactInfo: '555-0104',
    email: 'maria.garcia@email.com',
    weightKg: 70,
    heightCm: 160,
    createdAt: '2025-02-01'
  },
  {
    id: 'P005',
    name: 'Michael Chen',
    age: 35,
    gender: 'M',
    dob: '1990-07-18',
    contactInfo: '555-0105',
    email: 'm.chen@email.com',
    weightKg: 75,
    heightCm: 175,
    createdAt: '2025-02-10'
  }
];

// Mock Worklist
export const mockWorklist: WorklistItem[] = [
  {
    id: 'W001',
    patientId: 'P001',
    patientName: 'John Doe',
    studyDate: '2026-03-10',
    studyTime: '09:30',
    modality: 'MRI',
    description: 'Brain MRI with Contrast',
    details: 'Suspected lesion in right frontal lobe; additional sequences acquired.',
    referringPhysician: 'Dr. Alice Wang',
    status: 'completed',
    priority: 'high',
    imageCount: 45,
    images: [
      {
        id: 'IMG001',
        instanceNumber: 1,
        filename: 'IMG_001.dcm',
        seriesDescription: 'T1 Sagittal',
        sliceThickness: '2.0mm',
        windowCenter: 40,
        windowWidth: 400,
        viewed: true,
        viewedAt: '2026-03-10T10:15:00Z'
      },
      {
        id: 'IMG002',
        instanceNumber: 2,
        filename: 'IMG_002.dcm',
        seriesDescription: 'T1 Sagittal',
        sliceThickness: '2.0mm',
        windowCenter: 40,
        windowWidth: 400,
        viewed: true,
        viewedAt: '2026-03-10T10:16:00Z'
      },
      {
        id: 'IMG003',
        instanceNumber: 3,
        filename: 'IMG_003.dcm',
        seriesDescription: 'T1 Sagittal',
        sliceThickness: '2.0mm',
        windowCenter: 40,
        windowWidth: 400,
        viewed: false
      }
    ]
  },
  {
    id: 'W002',
    patientId: 'P002',
    patientName: 'Jane Smith',
    studyDate: '2026-03-10',
    studyTime: '10:15',
    modality: 'CT',
    description: 'Chest CT',
    details: 'Looking for pulmonary nodules; contrast-enhanced phase included.',
    referringPhysician: 'Dr. Michael Brown',
    status: 'completed',
    priority: 'normal',
    imageCount: 120,
    images: [
      {
        id: 'IMG101',
        instanceNumber: 1,
        filename: 'IMG_101.dcm',
        seriesDescription: 'Chest - Lung Window',
        sliceThickness: '1.0mm',
        windowCenter: -400,
        windowWidth: 1500,
        viewed: true,
        viewedAt: '2026-03-10T11:30:00Z'
      },
      {
        id: 'IMG102',
        instanceNumber: 2,
        filename: 'IMG_102.dcm',
        seriesDescription: 'Chest - Lung Window',
        sliceThickness: '1.0mm',
        windowCenter: -400,
        windowWidth: 1500,
        viewed: false
      }
    ]
  },
  {
    id: 'W003',
    patientId: 'P003',
    patientName: 'Robert Johnson',
    studyDate: '2026-03-09',
    studyTime: '14:45',
    modality: 'XR',
    description: 'Chest X-Ray PA and Lateral',
    status: 'completed',
    priority: 'urgent',
    imageCount: 2,
    images: [
      {
        id: 'IMG201',
        instanceNumber: 1,
        filename: 'IMG_201.dcm',
        seriesDescription: 'Chest PA',
        windowCenter: 40,
        windowWidth: 400,
        viewed: true,
        viewedAt: '2026-03-09T15:00:00Z'
      },
      {
        id: 'IMG202',
        instanceNumber: 2,
        filename: 'IMG_202.dcm',
        seriesDescription: 'Chest Lateral',
        windowCenter: 40,
        windowWidth: 400,
        viewed: true,
        viewedAt: '2026-03-09T15:05:00Z'
      }
    ]
  },
  {
    id: 'W004',
    patientId: 'P004',
    patientName: 'Maria Garcia',
    studyDate: '2026-03-09',
    studyTime: '11:20',
    modality: 'US',
    description: 'Abdominal Ultrasound',
    status: 'ongoing',
    priority: 'normal',
    imageCount: 25,
    images: [
      {
        id: 'IMG301',
        instanceNumber: 1,
        filename: 'IMG_301.dcm',
        seriesDescription: 'Liver',
        sliceThickness: '0.5mm',
        viewed: false
      },
      {
        id: 'IMG302',
        instanceNumber: 2,
        filename: 'IMG_302.dcm',
        seriesDescription: 'Liver',
        sliceThickness: '0.5mm',
        viewed: false
      }
    ]
  },
  {
    id: 'W005',
    patientId: 'P005',
    patientName: 'Michael Chen',
    studyDate: '2026-03-11',
    studyTime: '08:00',
    modality: 'MRI',
    description: 'Knee MRI',
    status: 'new',
    priority: 'low',
    imageCount: 60,
    images: [
      {
        id: 'IMG401',
        instanceNumber: 1,
        filename: 'IMG_401.dcm',
        seriesDescription: 'T2 Sagittal',
        sliceThickness: '3.0mm',
        viewed: false
      }
    ]
  },
  {
    id: 'W006',
    patientId: 'P001',
    patientName: 'John Doe',
    studyDate: '2026-03-08',
    studyTime: '16:30',
    modality: 'CT',
    description: 'Abdomen and Pelvis CT',
    status: 'completed',
    priority: 'normal',
    imageCount: 150,
    images: []
  },
  {
    id: 'W007',
    patientId: 'P002',
    patientName: 'Jane Smith',
    studyDate: '2026-03-07',
    studyTime: '13:00',
    modality: 'XR',
    description: 'Hand X-Ray',
    status: 'completed',
    priority: 'low',
    imageCount: 3,
    images: []
  },
  {
    id: 'W008',
    patientId: 'P003',
    patientName: 'Robert Johnson',
    studyDate: '2026-03-06',
    studyTime: '10:00',
    modality: 'MRI',
    description: 'Lumbar Spine MRI',
    status: 'completed',
    priority: 'normal',
    imageCount: 80,
    images: []
  },
  {
    id: 'W009',
    patientId: 'P004',
    patientName: 'Maria Garcia',
    studyDate: '2026-03-05',
    studyTime: '09:45',
    modality: 'US',
    description: 'Thyroid Ultrasound',
    status: 'completed',
    priority: 'low',
    imageCount: 12,
    images: []
  },
  {
    id: 'W010',
    patientId: 'P005',
    patientName: 'Michael Chen',
    studyDate: '2026-03-04',
    studyTime: '15:15',
    modality: 'CT',
    description: 'Head CT',
    status: 'completed',
    priority: 'normal',
    imageCount: 60,
    images: []
  }
];

// Mock Reports
export const mockReports: Report[] = [
  {
    id: 'R001',
    patientId: 'P001',
    worklistId: 'W001',
    radiologist: 'Dr. John Smith',
    findings: 'No acute abnormality identified. Brain parenchyma demonstrates normal signal intensity.',
    impression: 'Normal brain MRI.',
    recommendations: 'Clinical correlation recommended.',
    createdAt: '2026-03-10T10:30:00Z',
    status: 'completed'
  },
  {
    id: 'R002',
    patientId: 'P002',
    worklistId: 'W002',
    radiologist: 'Dr. John Smith',
    findings: 'Mild bibasilar atelectasis. No focal consolidation. Heart size normal.',
    impression: 'Mild bibasilar atelectasis. No pneumonia.',
    createdAt: '2026-03-10T11:00:00Z',
    status: 'completed'
  }
];
