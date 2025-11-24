import React, { useState } from 'react';
import { ShieldCheck, Loader2, Lock, ArrowLeft, KeyRound, Mail, CheckCircle, User, Hash, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { UserProfile } from '../types';
import { loginLocal, registerLocal } from '../services/firebaseService';

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
  existingUsers: UserProfile[];
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, existingUsers }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [viewMode, setViewMode] = useState<'default' | 'forgot'>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setSuccessMsg('');

    try {
      if (activeTab === 'register') {
        // Register but DO NOT login automatically.
        await registerLocal(email, password, fullName, badgeNumber);
        
        // Show success message and switch to login tab
        setSuccessMsg("Pendaftaran berhasil! Akun Anda sedang dalam antrian verifikasi Admin. Silakan lapor ke atasan untuk aktivasi.");
        setActiveTab('login');
        
        // Clear sensitive fields, keep email for convenience
        setPassword('');
        setFullName('');
        setBadgeNumber('');
      } else {
        const user = await loginLocal(email, password);
        onLogin(user);
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Terjadi kesalahan.";
      if (err.message === 'auth/wrong-password') msg = "Password salah.";
      if (err.message === 'auth/email-already-in-use') msg = "Email sudah terdaftar.";
      if (err.message === 'auth/user-not-found') msg = "Akun tidak ditemukan. Silakan daftar terlebih dahulu.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulation
    setTimeout(() => {
      setSuccessMsg(`Simulasi: Link reset dikirim ke ${email}. (Hubungi Admin jika ini hanya demo lokal)`);
      setIsLoading(false);
    }, 1000);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setBadgeNumber('');
    setError('');
    setSuccessMsg('');
    setShowPassword(false);
  };

  const renderLogo = () => (
    <div className="flex flex-col items-center gap-3 mb-6">
      <div className={`p-4 rounded-2xl shadow-lg transition-colors bg-slate-900 border border-slate-700`}>
        {viewMode === 'forgot' ? (
          <KeyRound size={40} className="text-white" />
        ) : (
          <ShieldCheck size={40} className="text-white" />
        )}
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">
          {viewMode === 'forgot' ? 'Lupa Password' : 'SecurePatrol AI'}
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          {viewMode === 'forgot' 
            ? 'Reset akses akun Anda' 
            : 'Sistem Keamanan Kantor Pertanahan'}
        </p>
      </div>
    </div>
  );

  // --- Views ---

  if (viewMode === 'forgot') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-6">
        <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative animate-fade-in">
          <button 
            onClick={() => { setViewMode('default'); resetForm(); }}
            className="absolute top-4 left-4 text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft size={20} />
          </button>
          
          {renderLogo()}

          {successMsg ? (
             <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex flex-col items-center gap-3 text-center animate-fade-in">
                <CheckCircle className="text-green-600" size={32} />
                <p className="text-green-800 font-medium text-sm">{successMsg}</p>
                <button
                  onClick={() => { setViewMode('default'); resetForm(); }}
                  className="mt-2 text-sm text-slate-900 font-bold hover:underline"
                >
                  Kembali ke Login
                </button>
             </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Email Terdaftar</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-slate-900 pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 text-sm placeholder-slate-400"
                    placeholder="nama@email.com"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 text-white font-bold py-3 px-4 rounded-lg hover:bg-slate-800 transition-all shadow-lg flex justify-center items-center gap-2 uppercase tracking-wider"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : 'Kirim Link Reset'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // --- Default View (Login / Register Tabs) ---
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden border border-slate-200">
        
        {/* Header Section - Firm Theme */}
        <div className="bg-slate-900 p-8 pb-16 text-center text-white relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-500 via-slate-900 to-black"></div>
           <div className="relative z-10 flex flex-col items-center">
             <div className="bg-white/10 p-3 rounded-xl mb-3 backdrop-blur-sm border border-white/20">
               <ShieldCheck size={32} className="text-white" />
             </div>
             <h1 className="text-2xl font-bold uppercase tracking-wider">SecurePatrol AI</h1>
             <p className="text-slate-400 text-xs font-mono mt-1">Sistem Keamanan Terintegrasi</p>
           </div>
        </div>

        {/* Tab Switcher Floating */}
        <div className="px-6 -mt-8 relative z-20">
          <div className="bg-white p-1 rounded-lg shadow-lg border border-slate-200 flex">
            <button 
              onClick={() => { setActiveTab('login'); resetForm(); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 uppercase tracking-wide ${
                activeTab === 'login' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <LogIn size={14} /> Masuk
            </button>
            <button 
              onClick={() => { setActiveTab('register'); resetForm(); }}
              className={`flex-1 py-2.5 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 uppercase tracking-wide ${
                activeTab === 'register' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <UserPlus size={14} /> Daftar
            </button>
          </div>
        </div>

        <div className="p-8 pt-6">
          
          {/* Global Success Message Display (e.g. after Registration) */}
          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm font-medium flex items-start gap-3 animate-fade-in shadow-sm">
               <CheckCircle size={20} className="mt-0.5 flex-shrink-0 text-green-600" />
               <div className="leading-relaxed">{successMsg}</div>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            
            {activeTab === 'register' && (
              <>
                <div className="space-y-1 animate-fade-in">
                  <label className="text-xs font-bold text-slate-700 uppercase">Nama Lengkap</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full text-slate-900 pl-10 pr-3 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-800 text-sm transition-all outline-none"
                      placeholder="Nama Petugas"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1 animate-fade-in">
                  <label className="text-xs font-bold text-slate-700 uppercase">No. Badge / NIK</label>
                  <div className="relative">
                    <Hash size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      value={badgeNumber}
                      onChange={(e) => setBadgeNumber(e.target.value)}
                      className="w-full text-slate-900 pl-10 pr-3 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-800 text-sm transition-all outline-none"
                      placeholder="Contoh: SEC-2401"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-slate-900 pl-10 pr-3 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-800 text-sm transition-all outline-none"
                  placeholder="user@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                 <label className="text-xs font-bold text-slate-700 uppercase">Password</label>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-slate-900 pl-10 pr-10 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-slate-800 text-sm transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              
              {activeTab === 'login' && (
                <div className="flex justify-end pt-1">
                   <button 
                     type="button"
                     onClick={() => { setViewMode('forgot'); resetForm(); }}
                     className="text-[10px] text-slate-500 font-bold hover:text-slate-800 hover:underline uppercase tracking-wide"
                   >
                     Lupa Password?
                   </button>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-start gap-2 font-semibold animate-fade-in">
                <div className="mt-0.5">!</div>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-lg hover:bg-slate-800 transition-all shadow-lg flex justify-center items-center gap-2 mt-4 uppercase tracking-wider"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : activeTab === 'login' ? (
                'Masuk Sekarang'
              ) : (
                'Kirim Permintaan Akses'
              )}
            </button>
          </form>

        </div>
      </div>
      
      <p className="mt-8 text-[10px] text-slate-400 text-center font-mono">
        &copy; {new Date().getFullYear()} Kantor Pertanahan Kota Banjar.
      </p>
    </div>
  );
};