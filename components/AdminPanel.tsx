import React, { useState } from 'react';
import { Users, FileText, Check, Download, Filter, LogOut, Map, Plus, Trash2, Edit, Key, UserPlus, X, Save, AlertTriangle } from 'lucide-react';
import { UserProfile, PatrolLog, PatrolStatus, Location } from '../types';
import { addUserLocal, updateUserLocal, deleteUserLocal, resetPasswordLocal } from '../services/firebaseService';

interface AdminPanelProps {
  users: UserProfile[];
  logs: PatrolLog[];
  locations: Location[];
  onApproveUser: (userId: string) => void;
  onLogout: () => void;
  onAddLocation: (loc: Location) => void;
  onDeleteLocation: (id: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  users, 
  logs, 
  locations,
  onApproveUser, 
  onLogout,
  onAddLocation,
  onDeleteLocation
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'locations'>('users');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Report Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredLogs, setFilteredLogs] = useState<PatrolLog[]>([]);
  const [hasFiltered, setHasFiltered] = useState(false);

  // Location Form State
  const [newLocName, setNewLocName] = useState('');
  const [newLocFloor, setNewLocFloor] = useState('');

  // User Management State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userFormMode, setUserFormMode] = useState<'add' | 'edit'>('add');
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    badgeNumber: '',
    role: 'user',
    status: 'active',
    password: ''
  });

  // Action Modals State
  const [deleteModalUser, setDeleteModalUser] = useState<UserProfile | null>(null);
  const [resetPassModalUser, setResetPassModalUser] = useState<UserProfile | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const handleFilter = () => {
    if (!startDate || !endDate) return;
    
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(23, 59, 59, 999);

    const result = logs.filter(log => {
      return log.timestamp >= start && log.timestamp <= end;
    });

    setFilteredLogs(result.sort((a, b) => b.timestamp - a.timestamp));
    setHasFiltered(true);
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocName || !newLocFloor) return;

    onAddLocation({
      id: '', // Firestore will assign, or service handles it
      name: newLocName,
      floor: newLocFloor
    });
    setNewLocName('');
    setNewLocFloor('');
  };

  // --- USER ACTIONS ---

  const openAddUserModal = () => {
    setUserFormMode('add');
    setEditingUser(null);
    setUserFormData({
      name: '',
      email: '',
      badgeNumber: '',
      role: 'user',
      status: 'active',
      password: ''
    });
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: UserProfile) => {
    setUserFormMode('edit');
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      badgeNumber: user.badgeNumber || '',
      role: user.role,
      status: user.status,
      password: '' 
    });
    setIsUserModalOpen(true);
  };

  // Delete Action
  const openDeleteConfirm = (user: UserProfile) => {
    setDeleteModalUser(user);
  };

  const confirmDeleteUser = async () => {
    if (deleteModalUser) {
      try {
        await deleteUserLocal(deleteModalUser.id);
        setDeleteModalUser(null);
      } catch (e) {
        alert("Gagal menghapus user.");
      }
    }
  };

  // Reset Password Action
  const openResetPassword = (user: UserProfile) => {
    setResetPassModalUser(user);
    setNewPasswordInput('');
  };

  const confirmResetPassword = async () => {
    if (resetPassModalUser && newPasswordInput.length >= 6) {
      try {
        await resetPasswordLocal(resetPassModalUser.id, newPasswordInput);
        alert(`Password untuk ${resetPassModalUser.name} berhasil diubah.`);
        setResetPassModalUser(null);
        setNewPasswordInput('');
      } catch (e) {
        alert("Gagal mereset password.");
      }
    } else {
      alert("Password minimal 6 karakter.");
    }
  };

  const handleUserFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (userFormMode === 'add') {
        if (!userFormData.password) {
          alert("Password wajib diisi untuk user baru.");
          return;
        }
        await addUserLocal({
          ...userFormData,
          role: userFormData.role as 'admin' | 'user',
          status: userFormData.status as 'active' | 'pending'
        });
      } else {
        if (!editingUser) return;
        await updateUserLocal({
          ...editingUser,
          name: userFormData.name,
          email: userFormData.email,
          badgeNumber: userFormData.badgeNumber,
          role: userFormData.role as 'admin' | 'user',
          status: userFormData.status as 'active' | 'pending'
        });
      }
      setIsUserModalOpen(false);
    } catch (error: any) {
      alert(error.message || "Terjadi kesalahan saat menyimpan data user.");
    }
  };

  const handlePrintPDF = () => {
    if (filteredLogs.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableRows = filteredLogs.map((log, index) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">
          ${new Date(log.timestamp).toLocaleDateString('id-ID')}<br/>
          <span style="font-size: 10px; color: #666;">${new Date(log.timestamp).toLocaleTimeString('id-ID')}</span>
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
          ${log.imageUrl ? `<img src="${log.imageUrl}" alt="Eviden" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px; border: 1px solid #eee;">` : '<span style="color:#ccc;">No Image</span>'}
        </td>
        <td style="padding: 8px; border: 1px solid #ddd;">${log.guardName}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${log.locationName}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">
          <span style="font-weight: bold; color: ${log.aiAnalysis?.status === PatrolStatus.SECURE ? 'green' : 'red'}">
            ${log.aiAnalysis?.status || 'Manual'}
          </span>
        </td>
        <td style="padding: 8px; border: 1px solid #ddd;">${log.aiAnalysis?.summary || log.notes || '-'}</td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Laporan Patroli Keamanan - BPN Kota Banjar</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; margin-bottom: 5px; }
            p { text-align: center; color: #666; font-size: 14px; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background-color: #f2f2f2; font-weight: bold; padding: 10px; border: 1px solid #999; text-align: left; }
            .header-section { margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .footer { margin-top: 50px; text-align: right; font-size: 12px; }
            @media print {
              tr { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header-section">
            <h1>Laporan Patroli Keamanan</h1>
            <p>Kantor Pertanahan Kota Banjar</p>
            <p>Periode: ${new Date(startDate).toLocaleDateString('id-ID')} s.d. ${new Date(endDate).toLocaleDateString('id-ID')}</p>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 30px;">No</th>
                <th style="width: 100px;">Waktu</th>
                <th style="width: 110px;">Foto Eviden</th>
                <th>Petugas</th>
                <th>Lokasi</th>
                <th>Status</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="footer">
            <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
            <br/><br/>
            <p>( Administrator Sistem )</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="animate-fade-in relative">
       {/* Added Header with Logout */}
       <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide">Panel Administrator</h2>
          
          {!showLogoutConfirm ? (
            <button 
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-2 bg-white text-red-700 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors uppercase"
            >
              <LogOut size={14} /> Logout
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-50 px-2 py-1 rounded-lg border border-red-100 animate-fade-in">
              <span className="text-xs font-bold text-red-800 mr-1 hidden sm:inline">Keluar?</span>
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="px-2 py-1 text-[10px] font-bold bg-white text-slate-800 border border-slate-300 rounded hover:bg-slate-50"
              >
                Batal
              </button>
              <button 
                onClick={onLogout}
                className="px-2 py-1 text-[10px] font-bold bg-red-700 text-white border border-red-700 rounded hover:bg-red-800"
              >
                Ya
              </button>
            </div>
          )}
       </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-300 pb-1 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 pb-3 px-2 border-b-2 transition-colors whitespace-nowrap text-sm ${
            activeTab === 'users' ? 'border-slate-800 text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users size={16} /> User
        </button>
        <button 
           onClick={() => setActiveTab('locations')}
           className={`flex items-center gap-2 pb-3 px-2 border-b-2 transition-colors whitespace-nowrap text-sm ${
            activeTab === 'locations' ? 'border-slate-800 text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Map size={16} /> Lokasi
        </button>
        <button 
           onClick={() => setActiveTab('reports')}
           className={`flex items-center gap-2 pb-3 px-2 border-b-2 transition-colors whitespace-nowrap text-sm ${
            activeTab === 'reports' ? 'border-slate-800 text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText size={16} /> Laporan
        </button>
      </div>

      {/* Tab Content: Users */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
           <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
             <h2 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Daftar Personil</h2>
             <button 
               onClick={openAddUserModal}
               className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-800 uppercase shadow-sm"
             >
               <UserPlus size={14} /> Tambah Personil
             </button>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-sm text-left text-slate-900">
               <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs">
                 <tr>
                   <th className="p-4">Nama</th>
                   <th className="p-4">Email / ID</th>
                   <th className="p-4">Role</th>
                   <th className="p-4">Status</th>
                   <th className="p-4 text-right">Aksi</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {users.map(user => (
                   <tr key={user.id} className="hover:bg-slate-50">
                     <td className="p-4 font-bold flex items-center gap-3">
                       <img src={user.avatarUrl} className="w-8 h-8 rounded-full border border-slate-200" alt="avatar" />
                       <div>
                         <div>{user.name}</div>
                         {user.badgeNumber && <div className="text-xs text-slate-500 font-normal">{user.badgeNumber}</div>}
                       </div>
                     </td>
                     <td className="p-4 text-slate-700">{user.email}</td>
                     <td className="p-4">
                       <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                         user.role === 'admin' ? 'bg-slate-200 text-slate-800' : 'bg-blue-100 text-blue-800'
                       }`}>
                         {user.role}
                       </span>
                     </td>
                     <td className="p-4">
                       <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                         user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                       }`}>
                         {user.status === 'active' ? 'AKTIF' : 'PENDING'}
                       </span>
                     </td>
                     <td className="p-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          {user.status === 'pending' && (
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onApproveUser(user.id);
                              }}
                              className="bg-green-600 text-white p-1.5 rounded hover:bg-green-700 shadow-sm transition-colors"
                              title="Setujui Pendaftaran"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button 
                             type="button"
                             onClick={(e) => {
                                e.stopPropagation();
                                openEditUserModal(user);
                             }}
                             className="bg-blue-50 text-blue-600 p-1.5 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                             title="Edit User"
                           >
                             <Edit size={14} />
                           </button>
                           <button 
                             type="button"
                             onClick={(e) => {
                                e.stopPropagation();
                                openResetPassword(user);
                             }}
                             className="bg-orange-50 text-orange-600 p-1.5 rounded border border-orange-200 hover:bg-orange-100 transition-colors"
                             title="Reset Password"
                           >
                             <Key size={14} />
                           </button>
                           <button 
                             type="button"
                             onClick={(e) => {
                                e.stopPropagation();
                                openDeleteConfirm(user);
                             }}
                             className="bg-red-50 text-red-600 p-1.5 rounded border border-red-200 hover:bg-red-100 transition-colors"
                             title="Hapus User"
                           >
                             <Trash2 size={14} />
                           </button>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {/* Tab Content: Locations */}
      {activeTab === 'locations' && (
         <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-xs font-bold text-slate-700 mb-3 uppercase">Tambah Lokasi Kontrol</h3>
              <form onSubmit={handleAddLocation} className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  placeholder="Nama Ruangan (e.g. Ruang Server)" 
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium"
                  required
                />
                <input 
                  type="text" 
                  placeholder="Lantai / Keterangan" 
                  value={newLocFloor}
                  onChange={(e) => setNewLocFloor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 font-medium"
                  required
                />
                <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 flex items-center justify-center gap-2 uppercase">
                  <Plus size={16} /> Tambah
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-4 bg-slate-50 border-b border-slate-200">
                 <h2 className="font-bold text-slate-700 uppercase text-xs tracking-wider">Daftar Titik Lokasi</h2>
               </div>
               <div className="divide-y divide-slate-100">
                  {locations.map(loc => (
                    <div key={loc.id} className="p-4 flex justify-between items-center hover:bg-slate-50">
                      <div>
                        <h4 className="font-bold text-slate-800">{loc.name}</h4>
                        <p className="text-sm text-slate-500 font-medium">{loc.floor}</p>
                      </div>
                      <button 
                        onClick={() => onDeleteLocation(loc.id)}
                        className="text-red-400 hover:text-red-700 p-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      )}

      {/* Tab Content: Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-slate-700 mb-4 flex items-center gap-2 uppercase text-xs tracking-wider">
              <Filter size={16} /> Filter Data
            </h2>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Dari Tanggal</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 text-slate-900 font-medium"
                />
              </div>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase">Sampai Tanggal</label>
                 <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 text-slate-900 font-medium"
                />
              </div>
              <button 
                onClick={handleFilter}
                disabled={!startDate || !endDate}
                className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 disabled:bg-slate-300 transition-colors uppercase tracking-wide text-xs"
              >
                Tampilkan
              </button>
            </div>
          </div>

          {hasFiltered && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 uppercase">Total: {filteredLogs.length} Data</span>
                </div>
                {filteredLogs.length > 0 && (
                  <button 
                    onClick={handlePrintPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white text-xs font-bold rounded-lg hover:bg-red-800 transition-colors uppercase"
                  >
                    <Download size={14} /> Cetak PDF
                  </button>
                )}
              </div>

              {filteredLogs.length === 0 ? (
                 <div className="p-8 text-center text-slate-500">Tidak ada data patroli pada rentang tanggal ini.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-900">
                    <thead className="bg-slate-100 text-slate-600 font-bold text-xs uppercase">
                      <tr>
                        <th className="p-3">Waktu</th>
                        <th className="p-3">Foto</th>
                        <th className="p-3">Lokasi</th>
                        <th className="p-3">Petugas</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50">
                          <td className="p-3 font-medium">
                            {new Date(log.timestamp).toLocaleDateString('id-ID')} <br/>
                            <span className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleTimeString('id-ID')}</span>
                          </td>
                          <td className="p-3">
                            <div className="w-12 h-12 rounded overflow-hidden bg-slate-200 border border-slate-300">
                               {log.imageUrl && <img src={log.imageUrl} alt="evidence" className="w-full h-full object-cover" />}
                            </div>
                          </td>
                          <td className="p-3 font-bold">{log.locationName}</td>
                          <td className="p-3">{log.guardName}</td>
                          <td className="p-3">
                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                               log.aiAnalysis?.status === PatrolStatus.SECURE ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'
                             }`}>
                               {log.aiAnalysis?.status || 'Manual'}
                             </span>
                          </td>
                          <td className="p-3 text-slate-600 max-w-xs truncate italic">
                            {log.aiAnalysis?.summary || log.notes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT USER */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setIsUserModalOpen(false)}>
           <div 
             className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200"
             onClick={(e) => e.stopPropagation()}
           >
              <div className="bg-slate-900 text-white p-4 flex justify-between items-center border-b border-slate-700">
                <h2 className="text-lg font-bold flex items-center gap-2 uppercase tracking-wide">
                  {userFormMode === 'add' ? <UserPlus size={18}/> : <Edit size={18} />}
                  {userFormMode === 'add' ? 'Tambah Personil' : 'Edit Personil'}
                </h2>
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleUserFormSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={userFormData.name}
                      onChange={(e) => setUserFormData({...userFormData, name: e.target.value})}
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 text-sm font-medium"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Email</label>
                    <input 
                      type="email" 
                      value={userFormData.email}
                      onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 text-sm font-medium"
                      required
                      disabled={userFormMode === 'edit'} 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">Nomor Induk (NIK/Badge)</label>
                    <input 
                      type="text" 
                      value={userFormData.badgeNumber}
                      onChange={(e) => setUserFormData({...userFormData, badgeNumber: e.target.value})}
                      className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 text-sm font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">Role</label>
                      <select 
                        value={userFormData.role}
                        onChange={(e) => setUserFormData({...userFormData, role: e.target.value})}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 text-sm font-medium bg-white"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase">Status</label>
                      <select 
                        value={userFormData.status}
                        onChange={(e) => setUserFormData({...userFormData, status: e.target.value})}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 text-sm font-medium bg-white"
                      >
                        <option value="active">Aktif</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </div>

                  {userFormMode === 'add' && (
                     <div className="space-y-1 pt-2 border-t border-slate-100">
                        <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-2">
                           Password Awal
                        </label>
                        <input 
                          type="text" 
                          value={userFormData.password}
                          onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                          className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 text-sm font-medium bg-slate-50"
                          placeholder="Minimal 6 karakter"
                        />
                        <p className="text-[10px] text-slate-500">Berikan password ini kepada personil terkait.</p>
                     </div>
                  )}

                  <div className="pt-4 flex gap-3">
                     <button 
                       type="button"
                       onClick={() => setIsUserModalOpen(false)}
                       className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold uppercase text-xs hover:bg-slate-50"
                     >
                       Batal
                     </button>
                     <button 
                       type="submit"
                       className="flex-1 py-3 bg-slate-900 text-white rounded-lg font-bold uppercase text-xs hover:bg-slate-800 flex items-center justify-center gap-2 shadow-lg"
                     >
                       <Save size={16} /> Simpan
                     </button>
                  </div>
                </form>
              </div>
           </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {resetPassModalUser && (
        <div className="fixed inset-0 bg-black/70 z-[85] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setResetPassModalUser(null)}>
           <div 
             className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-slate-200"
             onClick={(e) => e.stopPropagation()}
           >
              <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Key size={20} className="text-orange-500" />
                Reset Password
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Masukkan password baru untuk user <strong>{resetPassModalUser.name}</strong>.
              </p>
              
              <input 
                type="text" 
                value={newPasswordInput}
                onChange={(e) => setNewPasswordInput(e.target.value)}
                placeholder="Password Baru (Min 6 Karakter)"
                className="w-full p-3 border border-slate-300 rounded-lg mb-4 text-sm font-medium focus:ring-2 focus:ring-orange-500"
                autoFocus
              />

              <div className="flex gap-2">
                <button 
                  onClick={() => setResetPassModalUser(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold uppercase hover:bg-slate-200"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmResetPassword}
                  className="flex-1 py-2.5 bg-orange-600 text-white rounded-lg text-xs font-bold uppercase hover:bg-orange-700"
                >
                  Simpan Password
                </button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRM */}
      {deleteModalUser && (
        <div className="fixed inset-0 bg-black/70 z-[85] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setDeleteModalUser(null)}>
           <div 
             className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-slate-200"
             onClick={(e) => e.stopPropagation()}
           >
              <div className="flex items-center gap-3 mb-4 text-red-600">
                <div className="bg-red-100 p-2 rounded-full">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Hapus Personil?</h3>
              </div>
              
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Anda akan menghapus user <strong>{deleteModalUser.name}</strong>. 
                <br/>
                Tindakan ini tidak dapat dibatalkan dan user akan kehilangan akses masuk.
              </p>

              <div className="flex gap-2">
                <button 
                  onClick={() => setDeleteModalUser(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold uppercase hover:bg-slate-200"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmDeleteUser}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-xs font-bold uppercase hover:bg-red-700"
                >
                  Ya, Hapus
                </button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};