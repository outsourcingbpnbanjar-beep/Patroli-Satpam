export enum PatrolStatus {
  SECURE = 'Aman',
  ATTENTION = 'Perlu Perhatian',
  DANGER = 'Bahaya'
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: 'admin' | 'user';
  status: 'active' | 'pending';
  badgeNumber?: string; // Nomor Register Satpam
  password?: string; // Kept for legacy/compatibility if needed, but not used in Firebase Auth flow logic directly
}

export interface Guard {
  id: string;
  name: string;
  badgeNumber: string;
  photoUrl?: string;
}

export interface Location {
  id: string;
  name: string;
  floor: string;
}

export interface AIAnalysisResult {
  status: PatrolStatus;
  summary: string;
  itemsDetected: string[];
}

export interface PatrolLog {
  id: string;
  guardId: string;
  guardName: string;
  locationId: string;
  locationName: string;
  timestamp: number;
  imageUrl: string;
  aiAnalysis: AIAnalysisResult | null;
  notes: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: any; // Lucide icon component type
}