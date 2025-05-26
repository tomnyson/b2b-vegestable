'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { User, getPaginatedUsers, createUser, updateUser, deleteUser, toggleUserStatus, updateUserPassword } from '../../../lib/users-api';

type SortField = 'name' | 'email' | 'phone' | 'role' | 'status';
type SortDirection = 'asc' | 'desc';

export default function UsersPage() {
  const t = useTranslations('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'customer' as User['role'],
    status: 'active' as User['status'],
  });

  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;

  // Fetch users from Supabase
  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        const result = await getPaginatedUsers(
          currentPage,
          itemsPerPage,
          sortField,
          sortDirection,
          searchTerm || undefined
        );
        
        setUsers(result.users);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalCount);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError(t('loadingError'));
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [currentPage, itemsPerPage, sortField, sortDirection, searchTerm]);

  // Handle column sorting
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
    // Reset to first page when sorting changes
    setCurrentPage(1);
  };

  // Pagination controls
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Generate a random password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingUser) {
        // Update existing user
        const { password, ...updateData } = formData;
        
        // First update user data
        await updateUser(editingUser.id, updateData);
        
        // Then update password if provided
        if (password) {
          try {
            await updateUserPassword(editingUser.id, password);
          } catch (passwordErr) {
            console.error('Error updating password:', passwordErr);
            alert(t('passwordUpdateError'));
          }
        }
      } else {
        // Add new user - ensure password is included
        if (!formData.password) {
          alert(t('passwordRequired'));
          setLoading(false);
          return;
        }
        await createUser(formData);
      }
      
      // Refresh user list
      const result = await getPaginatedUsers(
        currentPage,
        itemsPerPage,
        sortField,
        sortDirection,
        searchTerm || undefined
      );
      
      setUsers(result.users);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
      
      setIsModalOpen(false);
      setEditingUser(null);
      setFormData({ 
        name: '', 
        email: '', 
        phone: '', 
        password: '',
        role: 'customer',
        status: 'active' 
      });
    } catch (err) {
      console.error('Error saving user:', err);
      alert(t('saveError'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      role: user.role,
      status: user.status,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('deleteConfirm'))) {
      try {
        setLoading(true);
        await deleteUser(id);
        
        // Refresh user list
        const result = await getPaginatedUsers(
          currentPage,
          itemsPerPage,
          sortField,
          sortDirection,
          searchTerm || undefined
        );
        
        setUsers(result.users);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalCount);
      } catch (err) {
        console.error('Error deleting user:', err);
        alert(t('deleteError'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: User['status']) => {
    try {
      setLoading(true);
      await toggleUserStatus(id, currentStatus);
      
      // Refresh user list
      const result = await getPaginatedUsers(
        currentPage,
        itemsPerPage,
        sortField,
        sortDirection,
        searchTerm || undefined
      );
      
      setUsers(result.users);
    } catch (err) {
      console.error('Error toggling user status:', err);
      alert(t('statusError'));
    } finally {
      setLoading(false);
    }
  };

  // Handle search input with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  // Render sort indicator
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-emerald-600 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-emerald-600 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Loading state
  if (loading && users.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          <p className="text-lg font-medium text-gray-700">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-red-200/20 p-6 lg:p-8">
        <div className="flex items-center">
          <svg className="w-6 h-6 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="mt-2 text-gray-600 text-lg">
              Manage user accounts and access permissions
            </p>
          </div>
          <div className="mt-4 lg:mt-0">
            <button
              onClick={() => {
                setEditingUser(null);
                setFormData({ 
                  name: '', 
                  email: '', 
                  phone: '', 
                  password: '',
                  role: 'customer',
                  status: 'active'
                });
                setIsModalOpen(true);
              }}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center space-x-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{t('addUser')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Statistics */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Search */}
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              {t('searchUsers')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-2xl leading-5 bg-white/50 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={handleSearchChange}
                disabled={loading}
              />
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4">
            <div className="text-2xl font-bold text-emerald-700">{totalCount}</div>
            <div className="text-sm text-gray-600">{t('totalUsers')}</div>
          </div>
          
          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-4">
            <div className="text-2xl font-bold text-teal-700">{users.filter(u => u.status === 'active').length}</div>
            <div className="text-sm text-gray-600">{t('activeUsers')}</div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        {/* Mobile Card View */}
        <div className="block lg:hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">{t('users')}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {users.length > 0 ? (
              users.map((user) => (
                <div key={user.id} className="p-6 hover:bg-emerald-50/50 transition-colors duration-200">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{user.name}</h4>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.status === 'active' ? t('active') : t('inactive')}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">{t('phone')}:</span> {user.phone || '-'}
                      </div>
                      <div>
                        <span className="font-medium">{t('role')}:</span> {
                          user.role === 'customer' ? t('customer') : 
                          user.role === 'driver' ? t('driver') : t('admin')
                        }
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-sm disabled:opacity-50"
                        disabled={loading}
                      >
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user.id, user.status)}
                        className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors font-medium text-sm disabled:opacity-50"
                        disabled={loading}
                      >
                        {user.status === 'active' ? t('deactivate') : t('activate')}
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-sm disabled:opacity-50"
                        disabled={loading}
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <p className="text-gray-500 font-medium">{t('noUsersFound')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
              <tr>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 transition-colors duration-200"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    {t('name')}
                    {renderSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 transition-colors duration-200"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center">
                    {t('email')}
                    {renderSortIcon('email')}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 transition-colors duration-200"
                  onClick={() => handleSort('phone')}
                >
                  <div className="flex items-center">
                    {t('phone')}
                    {renderSortIcon('phone')}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 transition-colors duration-200"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center">
                    {t('role')}
                    {renderSortIcon('role')}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 transition-colors duration-200"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center justify-center">
                    {t('status')}
                    {renderSortIcon('status')}
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-gray-100">
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-emerald-50/50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.phone || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                        {user.role === 'customer' ? t('customer') : 
                         user.role === 'driver' ? t('driver') : t('admin')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.status === 'active' ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          disabled={loading}
                          title={t('edit')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          className="text-yellow-600 hover:text-yellow-900 p-2 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50"
                          disabled={loading}
                          title={user.status === 'active' ? t('deactivate') : t('activate')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          disabled={loading}
                          title={t('delete')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <p className="text-gray-500 font-medium">{t('noUsersFound')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="text-sm text-gray-700">
            {t('showing')} <span className="font-semibold">{users.length}</span> {t('of')}{' '}
            <span className="font-semibold">{totalCount}</span> {t('users')}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={prevPage}
              disabled={currentPage <= 1 || loading}
              className={`px-4 py-2 rounded-xl border font-medium transition-all duration-200 ${
                currentPage <= 1 || loading
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                  : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400'
              }`}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {t('previous')}
            </button>
            
            <div className="flex items-center space-x-1">
              <span className="px-4 py-2 text-sm font-medium text-gray-700">
                {t('page')} {currentPage} {t('of')} {totalPages || 1}
              </span>
            </div>
            
            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages || loading}
              className={`px-4 py-2 rounded-xl border font-medium transition-all duration-200 ${
                currentPage >= totalPages || loading
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                  : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400'
              }`}
            >
              {t('next')}
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                {editingUser ? t('editUser') : t('addNewUser')}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-colors"
                disabled={loading}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('name')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  required
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('email')}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  required
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('phone')}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('password')}</label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  disabled={loading}
                  placeholder={editingUser ? t('passwordPlaceholder') : ""}
                  required={!editingUser}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-2 border border-emerald-300 text-xs font-medium rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t('generateRandom')}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('role')}</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                  className="w-full min-w-[160px] px-4 py-3 border border-gray-300 rounded-2xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  disabled={loading}
                >
                  <option value="customer">{t('customer')}</option>
                  <option value="driver">{t('driver')}</option>
                  <option value="admin">{t('admin')}</option>
                </select>
              </div>
              
              {editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('status')}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as User['status'] })}
                    className="w-full min-w-[160px] px-4 py-3 border border-gray-300 rounded-2xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    disabled={loading}
                  >
                    <option value="active">{t('active')}</option>
                    <option value="inactive">{t('inactive')}</option>
                  </select>
                </div>
              )}
              
              <div className="flex flex-col-reverse lg:flex-row lg:justify-end lg:space-x-3 space-y-3 space-y-reverse lg:space-y-0 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full lg:w-auto px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 disabled:opacity-50 transition-all duration-200"
                  disabled={loading}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="w-full lg:w-auto px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:from-gray-400 disabled:to-gray-500 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{t('processing')}</span>
                    </>
                  ) : (
                    <span>{editingUser ? t('update') : t('add')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 