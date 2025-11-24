import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { NewPatrolForm } from './components/NewPatrolForm';
import { PatrolList } from './components/PatrolList';
import { LoginScreen } from './components/LoginScreen';
import { AdminPanel } from './components/AdminPanel';
import { ProfileSettings } from './components/ProfileSettings';
import { PatrolLog, UserProfile, Location } from './types';
import { ShieldAlert, LogOut, Loader2 } from 'lucide-react';
import { MOCK_LOCATIONS } from './constants';
import { 
  logoutUser, 
  subscribeToPatrolLogs, 
  subscribeToUsers, 
  subscribeToLocations, 
  updateUserStatus,
  addLocationToDb,
  deleteLocationFromDb,
  syncUserProfile,
  getSession
} from './services/firebaseService';

function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [patrolLogs, setPatrolLogs] = useState<PatrolLog[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // 1. Auth Listener (Local)
  useEffect(() => {
    const checkSession = () => {
      const user = getSession();
      setCurrentUser(user);
      setIsAuthChecking(false);
    };

    checkSession();
    
    // Listen for login/logout events
    window.addEventListener('auth-change', checkSession);
    return () => window.removeEventListener('auth-change', checkSession);
  }, []);

  // 2. Data Listeners (Only when logged in)
  useEffect(() => {
    if (!currentUser) return;

    // Listen to Patrol Logs
    const unsubLogs = subscribeToPatrolLogs((logs) => {
      setPatrolLogs(logs);
    });

    // Listen to Locations
    const unsubLocs = subscribeToLocations((locs) => {
      if (locs.length === 0) {
        setLocations(MOCK_LOCATIONS); // Fallback if DB empty
      } else {
        setLocations(locs);
      }
    });

    // Listen to Users (for Admin or just guard selection)
    const unsubUsers = subscribeToUsers((u) => {
      setUsers(u);
      
      // Real-time update of current user status if changed by admin
      const me = u.find(x => x.id === currentUser.id);
      if (me) {
        // Only update if something relevant changed to avoid loops
        if (me.status !== currentUser.status || me.role !== currentUser.role) {
           setCurrentUser(prev => prev ? { ...prev, status: me.status, role: me.role } : null);
        }
      }
    });

    return () => {
      unsubLogs();
      unsubLocs();
      unsubUsers();
    };
  }, [currentUser?.id]); // Re-run if user ID changes (login/logout)


  const handleLogin = (userProfile: UserProfile) => {
    setCurrentUser(userProfile);
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setActiveTab('dashboard');
    setIsProfileOpen(false);
  };

  const handleNewLog = (log: PatrolLog) => {
    // Handled via subscription
    setActiveTab('dashboard');
  };

  // Profile Updates
  const handleUpdateProfile = async (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
    await syncUserProfile(updatedUser);
  };

  // Admin Actions
  const handleApproveUser = async (userId: string) => {
    await updateUserStatus(userId, 'active');
  };

  const handleAddLocation = async (loc: Location) => {
    await addLocationToDb(loc);
  };

  const handleDeleteLocation = async (id: string) => {
    await deleteLocationFromDb(id);
  };

  // RENDER LOGIC

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-800" size={48} />
      </div>
    );
  }

  // 1. Not Logged In
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} existingUsers={users} />;
  }

  // 2. Pending User
  if (currentUser.status === 'pending') {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full animate-fade-in border-t-4 border-orange-500">
           <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-600">
             <ShieldAlert size={32} />
           </div>
           <h2 className="text-xl font-bold text-slate-900 mb-2">Menunggu Otorisasi</h2>
           <p className="text-slate-600 mb-6 text-sm">
             Akun <strong>{currentUser.email}</strong> sedang dalam antrian persetujuan Admin BPN. Harap lapor ke atasan.
           </p>
           <button 
             onClick={handleLogout}
             className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-slate-800 bg-white text-slate-800 rounded-lg hover:bg-slate-50 font-bold uppercase text-xs tracking-wider"
           >
             <LogOut size={16} /> Keluar Aplikasi
           </button>
        </div>
      </div>
    );
  }

  // 3. Authenticated (Admin or User)
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard logs={patrolLogs} onNewPatrol={() => setActiveTab('new-patrol')} currentUser={currentUser} />;
      case 'new-patrol':
        return (
          <NewPatrolForm 
            onSubmit={handleNewLog} 
            onCancel={() => setActiveTab('dashboard')} 
            locations={locations}
            users={users}
            currentUser={currentUser}
          />
        );
      case 'history':
        return <PatrolList logs={patrolLogs} />;
      case 'admin':
        // Double check role security
        return currentUser.role === 'admin' ? (
          <AdminPanel 
            users={users} 
            logs={patrolLogs} 
            locations={locations}
            onApproveUser={handleApproveUser} 
            onLogout={handleLogout}
            onAddLocation={handleAddLocation}
            onDeleteLocation={handleDeleteLocation}
          />
        ) : <Dashboard logs={patrolLogs} onNewPatrol={() => setActiveTab('new-patrol')} currentUser={currentUser} />;
      default:
        return <Dashboard logs={patrolLogs} onNewPatrol={() => setActiveTab('new-patrol')} currentUser={currentUser} />;
    }
  };

  return (
    <>
      <Layout 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileOpen(true)}
      >
        {renderContent()}
      </Layout>

      {/* Profile Modal */}
      {isProfileOpen && (
        <ProfileSettings 
          user={currentUser} 
          onUpdate={handleUpdateProfile} 
          onClose={() => setIsProfileOpen(false)} 
          onLogout={handleLogout}
        />
      )}
    </>
  );
}

export default App;