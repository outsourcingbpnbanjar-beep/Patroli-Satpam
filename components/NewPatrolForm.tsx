import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, User, Loader2, CheckCircle, AlertTriangle, UploadCloud, MapPinOff, ExternalLink } from 'lucide-react';
import { OFFICE_LOCATION, GOOGLE_DRIVE_FOLDER_URL } from '../constants';
import { PatrolLog, PatrolStatus, AIAnalysisResult, UserProfile, Location } from '../types';
import { analyzePatrolImage } from '../services/geminiService';
import { uploadPatrolImage, savePatrolLog } from '../services/firebaseService';

interface NewPatrolFormProps {
  onSubmit: (log: PatrolLog) => void;
  onCancel: () => void;
  locations: Location[];
  users: UserProfile[];
  currentUser: UserProfile;
}

export const NewPatrolForm: React.FC<NewPatrolFormProps> = ({ 
  onSubmit, 
  onCancel, 
  locations,
  users,
  currentUser
}) => {
  const [selectedGuard, setSelectedGuard] = useState<string>(currentUser.id);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [manualNotes, setManualNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMode, setSuccessMode] = useState(false);
  
  // Geolocation State
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);
  const [currentDistance, setCurrentDistance] = useState<number | null>(null);
  const [isLocationValid, setIsLocationValid] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>("Sedang mencari lokasi...");
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const d = R * c; 
    return d;
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Browser tidak mendukung geolokasi.");
      setIsLoadingLocation(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setCurrentCoords({ lat, lng });

        const dist = calculateDistance(
          lat,
          lng,
          OFFICE_LOCATION.latitude,
          OFFICE_LOCATION.longitude
        );
        
        setCurrentDistance(dist);
        setIsLoadingLocation(false);

        if (dist <= OFFICE_LOCATION.radiusMeters) {
          setIsLocationValid(true);
          setLocationError(null);
        } else {
          setIsLocationValid(false);
          setLocationError(`Lokasi tidak valid. Jarak: ${Math.round(dist)}m dari kantor (Max ${OFFICE_LOCATION.radiusMeters}m).`);
        }
      },
      (error) => {
        setIsLoadingLocation(false);
        setIsLocationValid(false);
        setLocationError("Gagal mengambil lokasi GPS. Pastikan GPS aktif.");
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert("Format file tidak didukung.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!imagePreview) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzePatrolImage(imagePreview);
      setAnalysisResult(result);
    } catch (error) {
      alert("Gagal menganalisis gambar.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLocationValid) {
      alert("Patroli tidak dapat disimpan karena Anda berada di luar area kantor.");
      return;
    }
    if (!selectedGuard || !selectedLocation || !imagePreview) {
      alert("Mohon lengkapi data patroli.");
      return;
    }

    setIsSubmitting(true);
    try {
      const imageUrl = await uploadPatrolImage(imagePreview, selectedGuard);
      const guard = users.find(u => u.id === selectedGuard);
      const location = locations.find(l => l.id === selectedLocation);

      const newLog: PatrolLog = {
        id: Date.now().toString(),
        guardId: selectedGuard,
        guardName: guard?.name || 'Unknown',
        locationId: selectedLocation,
        locationName: location?.name || 'Unknown',
        timestamp: Date.now(),
        imageUrl: imageUrl, 
        aiAnalysis: analysisResult,
        notes: manualNotes,
        coordinates: currentCoords ? {
          latitude: currentCoords.lat,
          longitude: currentCoords.lng
        } : undefined
      };

      await savePatrolLog(newLog);
      
      // Instead of closing immediately, show success with Drive link
      setSuccessMode(true);
    } catch (error) {
      alert("Gagal menyimpan patroli.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successMode) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center animate-fade-in flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="text-green-600" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Laporan Tersimpan!</h2>
        <p className="text-slate-600 mb-8 max-w-xs mx-auto">
          Data patroli berhasil disimpan ke database lokal perangkat Anda.
        </p>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl w-full mb-6">
          <p className="text-xs font-bold text-blue-800 uppercase mb-2">Backup Cloud (Opsional)</p>
          <a 
            href={GOOGLE_DRIVE_FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors uppercase text-sm shadow-md"
          >
            <UploadCloud size={18} /> Upload Eviden ke Drive
          </a>
          <p className="text-[10px] text-blue-600 mt-2">
            Klik tombol di atas untuk membuka folder Google Drive dan upload foto manual.
          </p>
        </div>

        <button 
          onClick={onCancel}
          className="text-slate-500 font-bold hover:text-slate-800 text-sm uppercase tracking-wide"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide">Input Patroli</h2>
        <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200">LOCAL</span>
      </div>
      
      <div className={`p-3 text-sm flex items-start gap-2 border-b ${
        isLoadingLocation ? 'bg-slate-100 text-slate-600' :
        isLocationValid ? 'bg-green-50 text-green-900 border-green-100' : 
        'bg-red-50 text-red-900 border-red-100'
      }`}>
        <div className="mt-0.5">
          {isLoadingLocation ? <Loader2 size={16} className="animate-spin" /> :
           isLocationValid ? <CheckCircle size={16} /> : <MapPinOff size={16} />}
        </div>
        <div className="flex-1">
          {isLoadingLocation ? (
            <p className="font-medium">Mendeteksi koordinat...</p>
          ) : isLocationValid ? (
            <p className="font-bold">Lokasi Valid: Kantor ({Math.round(currentDistance || 0)}m)</p>
          ) : (
            <div>
              <p className="font-bold">DILUAR JANGKAUAN!</p>
              <p className="text-xs mt-1 font-medium">{locationError}</p>
            </div>
          )}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-2 uppercase">
            <User size={16} className="text-slate-500" />
            Petugas Jaga
          </label>
          <select 
            value={selectedGuard} 
            onChange={(e) => setSelectedGuard(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
            required
            disabled={currentUser.role === 'user'} 
          >
            <option value="">Pilih Nama Petugas</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} {u.badgeNumber ? `(${u.badgeNumber})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-2 uppercase">
            <MapPin size={16} className="text-slate-500" />
            Lokasi Kontrol
          </label>
          <select 
            value={selectedLocation} 
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="w-full p-3 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
            required
          >
            <option value="">Pilih Lokasi</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name} - {loc.floor}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-2 uppercase">
            <Camera size={16} className="text-slate-500" />
            Eviden Foto
          </label>
          
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative min-h-[200px]" onClick={() => fileInputRef.current?.click()}>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/png, image/jpeg, image/jpg" 
              className="hidden" 
              onChange={handleFileChange}
              capture="environment" 
            />
            
            {imagePreview ? (
              <div className="relative w-full">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg shadow-sm border border-slate-200" />
                <button 
                  type="button"
                  className="absolute bottom-2 right-2 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  UBAH FOTO
                </button>
              </div>
            ) : (
              <>
                <div className="bg-white p-4 rounded-full shadow-sm mb-3 border border-slate-200">
                  <Camera size={32} className="text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-600">Ambil Foto / Upload</p>
                <p className="text-xs text-slate-400 mt-1">Tap untuk membuka kamera</p>
              </>
            )}
          </div>
        </div>

        {/* AI Analysis Section */}
        {imagePreview && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase">
                <UploadCloud size={16} />
                Analisis Cerdas
              </h3>
              {!analysisResult && !isAnalyzing && (
                 <button 
                 type="button"
                 onClick={handleAnalyze}
                 className="text-xs bg-slate-800 text-white font-bold px-3 py-1.5 rounded hover:bg-slate-700 transition-colors uppercase"
               >
                 Mulai Scan
               </button>
              )}
            </div>

            {isAnalyzing ? (
              <div className="flex flex-col items-center py-4">
                <Loader2 className="animate-spin text-slate-600 mb-2" size={24} />
                <p className="text-xs text-slate-600 font-medium">Sedang memindai keamanan...</p>
              </div>
            ) : analysisResult ? (
              <div className="space-y-3">
                <div className={`flex items-center gap-2 p-2 rounded border ${
                  analysisResult.status === PatrolStatus.SECURE ? 'bg-green-100 border-green-200 text-green-800' :
                  analysisResult.status === PatrolStatus.DANGER ? 'bg-red-100 border-red-200 text-red-800' :
                  'bg-yellow-100 border-yellow-200 text-yellow-800'
                }`}>
                   {analysisResult.status === PatrolStatus.SECURE ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                   <span className="font-bold text-sm uppercase">{analysisResult.status}</span>
                </div>
                <p className="text-sm text-slate-800 italic border-l-2 border-slate-300 pl-2">"{analysisResult.summary}"</p>
                {analysisResult.itemsDetected.length > 0 && (
                   <div className="flex flex-wrap gap-1">
                     {analysisResult.itemsDetected.map((item, i) => (
                       <span key={i} className="text-[10px] uppercase font-bold bg-white border border-slate-300 text-slate-600 px-2 py-0.5 rounded shadow-sm">
                         {item}
                       </span>
                     ))}
                   </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">Tekan tombol scan untuk memeriksa keamanan secara otomatis.</p>
            )}
          </div>
        )}

        <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase">Catatan Tambahan</label>
            <textarea 
              value={manualNotes}
              onChange={(e) => setManualNotes(e.target.value)}
              className="w-full text-slate-900 p-3 border border-slate-300 rounded-lg bg-white"
              rows={3}
              placeholder="Kondisi pintu, lampu, dll..."
            />
        </div>

        <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors uppercase tracking-wide text-xs"
            >
              Batal
            </button>
            <button 
              type="submit" 
              disabled={!isLocationValid || isLoadingLocation || isSubmitting}
              className={`flex-1 py-3 px-4 font-bold rounded-lg transition-colors shadow-lg uppercase tracking-wide text-xs flex justify-center items-center gap-2 ${
                !isLocationValid || isLoadingLocation || isSubmitting
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-400/50'
              }`}
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : 'Simpan Laporan'}
            </button>
        </div>

      </form>
    </div>
  );
};