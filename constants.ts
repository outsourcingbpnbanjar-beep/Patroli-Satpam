import { Guard, Location } from './types';

export const APP_NAME = "SecurePatrol AI";

// Kantor Pertanahan Kota Banjar Coordinates
export const OFFICE_LOCATION = {
  latitude: -7.3643555,
  longitude: 108.5324731,
  radiusMeters: 500 // Expanded radius for testing/flexibility
};

// Updated Public Drive Folder
export const GOOGLE_DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/16blin-Qt-yLxVx1hug3Wax_EVLDqy_sD?usp=sharing";

export const ADMIN_CREDENTIALS = {
  email: 'outsourcingbpnbanjar@gmail.com',
  password: '655434'
};

export const MOCK_GUARDS: Guard[] = [
  { id: 'G001', name: 'Budi Santoso', badgeNumber: 'SEC-8821' },
  { id: 'G002', name: 'Ahmad Wijaya', badgeNumber: 'SEC-8822' },
  { id: 'G003', name: 'Siti Aminah', badgeNumber: 'SEC-8823' },
];

export const MOCK_LOCATIONS: Location[] = [
  { id: 'L001', name: 'Lobby Utama', floor: 'Lantai Dasar' },
  { id: 'L002', name: 'Ruang Server', floor: 'Lantai 2' },
  { id: 'L003', name: 'Gudang Logistik', floor: 'Basement' },
  { id: 'L004', name: 'Ruang Meeting CEO', floor: 'Lantai 10' },
  { id: 'L005', name: 'Area Parkir VIP', floor: 'Basement' },
  { id: 'L006', name: 'Kantin Karyawan', floor: 'Lantai 3' },
];

export const DEFAULT_SYSTEM_INSTRUCTION = `
Anda adalah asisten AI keamanan profesional untuk sistem patroli gedung perkantoran. 
Tugas Anda adalah menganalisis gambar yang diunggah oleh satpam (security guard).
1. Identifikasi apakah ruangan terlihat rapi, aman, dan terkendali.
2. Cari potensi bahaya (misal: api, air tumpah, kabel berantakan, orang tidak dikenal, jendela pecah).
3. Tentukan status keamanan: "Aman", "Perlu Perhatian", atau "Bahaya".
4. Berikan ringkasan singkat dalam Bahasa Indonesia.
`;