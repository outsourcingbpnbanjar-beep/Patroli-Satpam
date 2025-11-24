import React from 'react';
import { ShieldCheck, AlertTriangle, Activity, Clock, Map } from 'lucide-react';
import { PatrolLog, PatrolStatus, UserProfile } from '../types';
import { PatrolMap } from './PatrolMap';

interface DashboardProps {
  logs: PatrolLog[];
  onNewPatrol: () => void;
  currentUser: UserProfile;
}

export const Dashboard: React.FC<DashboardProps> = ({ logs, onNewPatrol, currentUser }) => {
  const totalPatrols = logs.length;
  const issuesFound = logs.filter(l => l.aiAnalysis?.status !== PatrolStatus.SECURE && l.aiAnalysis?.status !== undefined).length;
  
  // Calculate average patrol interval (mock logic)
  const lastPatrolTime = logs.length > 0 ? new Date(logs[0].timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner - Theme: Firm Slate/Dark */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-950 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden border-b-4 border-slate-600">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold mb-1">Siap, {currentUser.name}</h2>
          <p className="text-slate-300 text-sm mb-4">Sistem siap memantau. Laksanakan tugas dengan teliti.</p>
          <button 
            onClick={onNewPatrol}
            className="bg-white text-slate-900 font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-slate-100 transition-colors shadow-md uppercase tracking-wide"
          >
            Mulai Patroli
          </button>
        </div>
        {/* Abstract shapes bg */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="absolute right-20 bottom-0 w-24 h-24 bg-slate-500/20 rounded-full blur-xl"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-32 border-l-4 border-l-slate-800">
          <div className="bg-slate-100 w-10 h-10 rounded-full flex items-center justify-center text-slate-800 mb-2">
            <Activity size={20} />
          </div>
          <div>
            <span className="text-3xl font-bold text-slate-900">{totalPatrols}</span>
            <p className="text-xs text-slate-500 font-bold uppercase">Total Giat</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between h-32 border-l-4 border-l-red-700">
          <div className="bg-red-50 w-10 h-10 rounded-full flex items-center justify-center text-red-700 mb-2">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span className="text-3xl font-bold text-slate-900">{issuesFound}</span>
            <p className="text-xs text-slate-500 font-bold uppercase">Temuan Insiden</p>
          </div>
        </div>
      </div>

      {/* Map Visualization */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase text-xs tracking-wider">
            <Map size={16} className="text-slate-600" />
            Peta Sebaran
          </h3>
          <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-1 rounded">LIVE</span>
        </div>
        <div className="h-64 w-full relative z-0">
          <PatrolMap logs={logs} />
        </div>
      </div>

      {/* Recent Activity Mini List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 uppercase text-xs tracking-wider">
            <Clock size={16} className="text-slate-600" />
            Aktivitas Terkini
          </h3>
          <span className="text-xs text-slate-500 font-mono">{lastPatrolTime}</span>
        </div>
        
        <div className="divide-y divide-slate-100">
          {logs.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">Belum ada aktivitas.</div>
          ) : (
            logs.slice(0, 3).map(log => (
              <div key={log.id} className="p-4 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                 <img src={log.imageUrl} className="w-10 h-10 rounded object-cover bg-slate-200 border border-slate-300" alt="thumb" />
                 <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{log.locationName}</p>
                    <p className="text-xs text-slate-500">{log.guardName}</p>
                 </div>
                 <span className={`text-[10px] px-2 py-1 rounded-sm font-bold uppercase tracking-wide ${
                   log.aiAnalysis?.status === PatrolStatus.SECURE ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                 }`}>
                   {log.aiAnalysis?.status || 'Manual'}
                 </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};