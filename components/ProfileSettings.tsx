import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { X, Save, Camera, Lock, User, Hash, UploadCloud, LogOut } from 'lucide-react';

interface ProfileSettingsProps {
  user: UserProfile;
  onUpdate: (updatedUser: UserProfile) => void;
  onClose: () => void;
  onLogout: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onUpdate, onClose, onLogout }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    badgeNumber: user.badgeNumber || '',
    avatarUrl: user.avatarUrl,
    password: user.password || '',
  });
  
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, avatarUrl: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({
      ...user,
      name: formData.name,
      badgeNumber: formData.badgeNumber,
      avatarUrl: formData.avatarUrl,
      password: formData.password
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center flex-shrink-0 border-b border-slate-700">
          <h2 className="text-lg font-bold flex items-center gap-2 uppercase tracking-wide">
            <User size={18} /> Profil Personil
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Avatar Preview & Upload */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div 
              className="relative group cursor-pointer" 
              onClick={() => fileInputRef.current?.click()}
            >
              <img 
                src={formData.avatarUrl} 
                alt="Profile" 
                className="w-24 h-24 rounded-full border-4 border-slate-200 object-cover shadow-sm group-hover:brightness-75 transition-all"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white drop-shadow-md" size={32} />
              </div>
              <div className="absolute bottom-0 right-0 bg-slate-800 text-white p-1.5 rounded-full shadow-sm border-2 border-white">
                <UploadCloud size={14} />
              </div>
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} 
            />
            
            <div className="text-center">
              <p className="text-xs text-slate-700 font-bold cursor-pointer hover:underline uppercase" onClick={() => fileInputRef.current?.click()}>
                Ubah Foto
              </p>
              <p className="text-[10px] text-slate-400 mt-1">{user.email}</p>
            </div>
            
            <span className={`px-3 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin' ? 'bg-slate-200 text-slate-800' : 'bg-blue-100 text-blue-800'}`}>
              {user.role}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1 uppercase">
                <User size={14} /> Nama Lengkap
              </label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 text-sm text-slate-900 font-medium"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1 uppercase">
                <Hash size={14} /> Nomor Register / NIP
              </label>
              <input 
                type="text" 
                value={formData.badgeNumber}
                onChange={(e) => setFormData({...formData, badgeNumber: e.target.value})}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 text-sm text-slate-900 font-medium"
                placeholder="Contoh: SEC-2024-001"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1 uppercase">
                <Lock size={14} /> Ganti Password
              </label>
              <input 
                type="password" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 text-sm text-slate-900 font-medium"
                placeholder="Biarkan kosong jika tidak ingin mengganti"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 bg-white border border-slate-300 text-slate-700 font-bold py-3 rounded-lg hover:bg-slate-50 transition-colors uppercase text-xs tracking-wide"
              >
                Batal
              </button>
              <button 
                type="submit"
                className="flex-1 bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition-colors shadow-lg flex items-center justify-center gap-2 uppercase text-xs tracking-wide"
              >
                <Save size={16} /> Simpan Perubahan
              </button>
            </div>
          </form>

          {/* Logout Button moved outside form for reliability */}
          <div className="mt-6 pt-4 border-t border-slate-200">
             {!showLogoutConfirm ? (
               <button 
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full flex items-center justify-center gap-2 text-red-600 hover:text-red-800 hover:bg-red-50 py-3 rounded-lg transition-colors font-bold uppercase text-xs tracking-wide"
              >
                <LogOut size={16} /> Keluar Akun
              </button>
             ) : (
               <div className="bg-red-50 p-4 rounded-xl animate-fade-in border border-red-100">
                 <p className="text-center text-red-800 text-sm font-bold mb-3 uppercase">Konfirmasi Keluar?</p>
                 <div className="flex gap-2">
                   <button 
                     type="button"
                     onClick={() => setShowLogoutConfirm(false)}
                     className="flex-1 py-2 bg-white border border-red-200 text-red-700 rounded-lg text-xs font-bold hover:bg-red-50 uppercase"
                   >
                     Batal
                   </button>
                   <button 
                     type="button"
                     onClick={onLogout}
                     className="flex-1 py-2 bg-red-700 text-white rounded-lg text-xs font-bold hover:bg-red-800 shadow-sm uppercase"
                   >
                     Ya, Keluar
                   </button>
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};