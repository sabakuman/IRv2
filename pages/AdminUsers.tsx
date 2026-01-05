
import React, { useEffect, useState } from 'react';
import { MockService } from '../services/mockService';
import { UserProfile, UserRole } from '../types';
import { Button, Card, Badge, Input } from '../components/ui/LayoutComponents';
import { Trash2, UserPlus, ShieldAlert, User, Mail, X, Key, RefreshCcw, ShieldCheck } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);

  // New User Form State
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    role: 'user' as UserRole,
    password: ''
  });

  const fetchUsers = async () => {
    setLoading(true);
    const data = await MockService.getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRemoveUser = async (id: string) => {
    if (id === 'u-admin') {
      alert("Cannot delete the root administrator.");
      return;
    }
    if (window.confirm('Are you sure you want to delete this user? This action is permanent.')) {
      try {
        await MockService.deleteUser(id);
        await fetchUsers(); // Refresh immediately
      } catch (e: any) {
        alert(e.message || "Failed to remove user");
      }
    }
  };

  const handleResetPassword = async (id: string) => {
    const newPass = prompt("Enter new password for this user:");
    if (newPass) {
      try {
        await MockService.updatePassword(id, newPass);
        alert("Password updated successfully.");
      } catch (e) {
        alert("Failed to update password.");
      }
    }
  };

  const handleToggleRole = async (user: UserProfile) => {
    if (user.id === 'u-admin') {
      alert("Root administrator role cannot be changed.");
      return;
    }
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    if (window.confirm(`Are you sure you want to change ${user.fullName}'s role to ${newRole}?`)) {
      try {
        await MockService.updateUserRole(user.id, newRole);
        await fetchUsers();
      } catch (e) {
        alert("Failed to update user role.");
      }
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.fullName || !newUser.email || !newUser.password) return;

    const user: UserProfile = {
      id: `u-${uuidv4().slice(0, 8)}`,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(newUser.fullName)}&background=random&color=fff`,
      password: newUser.password
    };

    setIsModalOpen(false);
    setNewUser({ fullName: '', email: '', role: 'user', password: '' });
    
    await MockService.addUser(user);
    await fetchUsers();
  };

  return (
    <div className="space-y-6 animate-in fade-in relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary-dark dark:text-primary-foreground">User Management</h1>
          <p className="text-muted-foreground">Manage system access and user roles.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <UserPlus size={18} /> Add New User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <Card key={user.id} className="relative group overflow-hidden border-border dark:bg-secondary flex flex-col h-full">
             <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                   <img src={user.avatarUrl} alt={user.fullName} className="w-12 h-12 rounded-full border border-gray-200" />
                   <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{user.fullName}</h3>
                      <Badge color={user.role === 'admin' ? 'blue' : 'green'}>{user.role}</Badge>
                   </div>
                </div>
                {user.id !== 'u-admin' && (
                  <button 
                    onClick={() => handleRemoveUser(user.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-2"
                    title="Remove User"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
             </div>
             
             <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400 flex-1">
                <div className="flex items-center gap-2">
                   <Mail size={14} className="opacity-70" />
                   {user.email}
                </div>
                <div className="flex items-center gap-2">
                   <ShieldAlert size={14} className="opacity-70" />
                   ID: <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">{user.id}</span>
                </div>
             </div>

             <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                <button 
                  onClick={() => handleToggleRole(user)}
                  className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary-dark dark:text-primary-light transition-colors w-full"
                >
                  <ShieldCheck size={12} /> Change to {user.role === 'admin' ? 'User' : 'Admin'} Role
                </button>
                <button 
                  onClick={() => handleResetPassword(user.id)}
                  className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors w-full"
                >
                  <RefreshCcw size={12} /> Reset Password
                </button>
             </div>
          </Card>
        ))}
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-md m-4 border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-serif text-primary-dark dark:text-white">Add New User</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <Input 
                label="Full Name" 
                placeholder="e.g. Fatima Al-Kaabi" 
                value={newUser.fullName}
                onChange={e => setNewUser({...newUser, fullName: e.target.value})}
                required
              />
              <Input 
                label="Official Email" 
                type="email"
                placeholder="name@mohre.gov.ae" 
                value={newUser.email}
                onChange={e => setNewUser({...newUser, email: e.target.value})}
                required
              />
              <Input 
                label="Initial Password" 
                type="password" 
                placeholder="••••••••" 
                value={newUser.password}
                onChange={e => setNewUser({...newUser, password: e.target.value})}
                required
              />
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground/80">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewUser({...newUser, role: 'user'})}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${newUser.role === 'user' ? 'bg-primary text-white border-primary' : 'bg-gray-50 dark:bg-gray-800 dark:text-gray-300 border-gray-200 hover:bg-gray-100'}`}
                  >
                    <User size={16} /> Standard User
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewUser({...newUser, role: 'admin'})}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${newUser.role === 'admin' ? 'bg-primary text-white border-primary' : 'bg-gray-50 dark:bg-gray-800 dark:text-gray-300 border-gray-200 hover:bg-gray-100'}`}
                  >
                    <ShieldAlert size={16} /> Admin
                  </button>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  <UserPlus size={16} /> Create User
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}