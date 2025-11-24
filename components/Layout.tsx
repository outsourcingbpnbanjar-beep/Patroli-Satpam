import React, { ReactNode } from 'react';
import { ShieldCheck, PlusCircle, LayoutList, Menu, Settings } from 'lucide-react';
import { UserProfile } from '../types';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  currentUser: UserProfile;
  onOpenProfile: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, currentUser, onOpenProfile }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header - Firm Look */}
      <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-50 border-b border-slate-700">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg border border-white/20">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight uppercase tracking-wider">SecurePatrol</h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-wide">SYSTEM V.2.0</p>
            </div>
          </div>
          <button 
            onClick={onOpenProfile}
            className="flex items-center gap-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md border border-slate-700 transition-colors"
          >
            <span className="text-xs font-bold hidden sm:block uppercase">{currentUser.name}</span>
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto p-4 pb-24">
        {children}
      </main>

      {/* Bottom Navigation - Firm Look */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 shadow-[0_-5px_10px_rgba(0,0,0,0.05)] z-50 safe-area-bottom">
        <div className="max-w-3xl mx-auto flex justify-around items-center h-16">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              activeTab === 'dashboard' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ShieldCheck size={24} className={activeTab === 'dashboard' ? 'stroke-[2.5px]' : ''} />
            <span className={`text-[10px] uppercase font-bold ${activeTab === 'dashboard' ? 'text-slate-900' : ''}`}>Dashboard</span>
          </button>
          
          <button
            onClick={() => onTabChange('new-patrol')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              activeTab === 'new-patrol' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <PlusCircle size={32} className={activeTab === 'new-patrol' ? 'fill-slate-100 text-slate-900 stroke-[2px]' : ''} />
            <span className={`text-[10px] uppercase font-bold ${activeTab === 'new-patrol' ? 'text-slate-900' : ''}`}>Patroli</span>
          </button>

          <button
            onClick={() => onTabChange('history')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
              activeTab === 'history' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <LayoutList size={24} className={activeTab === 'history' ? 'stroke-[2.5px]' : ''} />
            <span className={`text-[10px] uppercase font-bold ${activeTab === 'history' ? 'text-slate-900' : ''}`}>Database</span>
          </button>

          {/* Admin Tab - Only for Admins */}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => onTabChange('admin')}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                activeTab === 'admin' ? 'text-red-700' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Settings size={24} className={activeTab === 'admin' ? 'stroke-[2.5px]' : ''} />
              <span className={`text-[10px] uppercase font-bold ${activeTab === 'admin' ? 'text-red-700' : ''}`}>Admin</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
};