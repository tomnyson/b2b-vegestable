'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { User, getPaginatedUsers, createUser, updateUser, deleteUser, toggleUserStatus, updateUserPassword } from '../../../lib/users-api';
import ImportUserModal from './ImportUserModal';
import { toast } from 'react-toastify';
import Switch from '../../../components/Switch';
import Loading from '@/app/components/Loading';
import Pagination from '@/app/components/Pagination';

type SortField = 'name' | 'email' | 'phone' | 'address' | 'role' | 'status';
type SortDirection = 'asc' | 'desc';

// Address suggestion interface
interface AddressSuggestion {
  name: string;
  address: string;
  longitude?: number;
  latitude?: number;
  city?: string;
  postcode?: string;
  street?: string;
  housenumber?: string;
}

export default function UsersPage() {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    business_name: '',
    city: '',
    zip_code: '',
    notes: '',
    password: '',
    role: 'customer' as User['role'],
    status: 'active' as User['status'],
  });

  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Address suggestion state
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const addressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const addressSuggestionsRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isSearching) {
        setCurrentPage(1);
        setIsSearching(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm, isSearching]);

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

    if (!isSearching) {
      loadUsers();
    }
  }, [currentPage, itemsPerPage, sortField, sortDirection, searchTerm, isSearching]);

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

      closeModal();
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
      address: user.address || '',
      business_name: user.business_name || '',
      city: user.city || '',
      zip_code: user.zip_code || '',
      notes: user.notes || '',
      password: '',
      role: user.role,
      status: user.status,
    });
    setIsModalOpen(true);
    // Reset address suggestions
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
  };

  // Helper function to close modal and reset state
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      business_name: '',
      city: '',
      zip_code: '',
      notes: '',
      password: '',
      role: 'customer',
      status: 'active'
    });
    // Clear address suggestions
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
    if (addressTimeoutRef.current) {
      clearTimeout(addressTimeoutRef.current);
    }
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

  // Handle status toggle
  const handleToggleStatus = async (id: string, newStatus: User['status']) => {
    try {
      setLoading(true);
      await toggleUserStatus(id, newStatus);

      // Update the local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === id ? { ...user, status: newStatus } : user
        )
      );

    } catch (err) {
      console.error('Error toggling user status:', err);
      toast.error(t('statusError'));
    } finally {
      setLoading(false);
    }
  };

  // Address suggestion functions
  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setFormData({ ...formData, address: query });

    if (addressTimeoutRef.current) {
      clearTimeout(addressTimeoutRef.current);
    }

    if (query.length > 2) {
      addressTimeoutRef.current = setTimeout(() => {
        fetchAddressSuggestions(query);
      }, 500);
    } else {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
    }
  };

  const fetchAddressSuggestions = async (query: string) => {
    if (query.length < 3) return;

    try {
      setIsSearchingAddress(true);
      const response = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`);
      const data = await response.json();

      if (data && data.features) {
        const suggestions: AddressSuggestion[] = data.features
          .filter((feature: any) => feature.properties.name)
          .map((feature: any) => {
            const props = feature.properties;
            const parts = [
              props.name, props.street, props.housenumber, props.postcode, props.city, props.state, props.country
            ].filter(Boolean);

            const coordinates = feature.geometry?.coordinates || [];
            return {
              name: props.name,
              address: parts.join(', '),
              longitude: coordinates[0],
              latitude: coordinates[1],
              city: props.city,
              postcode: props.postcode,
              street: props.street,
              housenumber: props.housenumber
            };
          });

        setAddressSuggestions(suggestions);
        setShowAddressSuggestions(suggestions.length > 0);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      toast.error('Error fetching address suggestions');
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleSelectAddressSuggestion = (suggestion: AddressSuggestion) => {
    // Split the address into components
    const streetAddress = [suggestion.street, suggestion.housenumber].filter(Boolean).join(' ');
    const city = suggestion.city || '';
    const zipCode = suggestion.postcode || '';
    
    setFormData({
      ...formData,
      address: streetAddress || suggestion.address,
      city: city,
      zip_code: zipCode
    });
    
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
    toast.success('Address automatically filled!');
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addressSuggestionsRef.current && !addressSuggestionsRef.current.contains(event.target as Node)) {
        setShowAddressSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle search input with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setIsSearching(true);
  };

  const handleImportComplete = async (importedCount: number) => {
    try {
      // Refresh user list after import
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

      toast.success(`Successfully imported ${importedCount} users!`);
    } catch (err) {
      console.error('Error refreshing users after import:', err);
      toast.error('Import completed but failed to refresh user list');
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
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
      <Loading />
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50/80 backdrop-blur-lg rounded-lg shadow-2xl border border-red-200/20 p-4 lg:p-6">
        <div className="flex items-center">
          <svg className="w-4 h-4 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-700 font-medium text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="mt-1 text-gray-600 text-base">
              Manage user accounts and access permissions
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setIsImportModalOpen(true)}
              disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center space-x-2 disabled:opacity-50 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span>Import CSV</span>
            </button>
            <button
              onClick={() => {
                setEditingUser(null);
                setFormData({
                  name: '',
                  email: '',
                  phone: '',
                  address: '',
                  business_name: '',
                  city: '',
                  zip_code: '',
                  notes: '',
                  password: '',
                  role: 'customer',
                  status: 'active'
                });
                setIsModalOpen(true);
                // Reset address suggestions
                setAddressSuggestions([]);
                setShowAddressSuggestions(false);
              }}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center space-x-2 disabled:opacity-50 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{t('addUser')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Statistics */}
      <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-1">
              {t('searchUsers')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white/50 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={handleSearchChange}
                disabled={loading}
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin h-3 w-3 border-2 border-emerald-500 rounded-full border-t-transparent"></div>
                </div>
              )}
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-3">
            <div className="text-xl font-bold text-emerald-700">{totalCount}</div>
            <div className="text-xs text-gray-600">{t('totalUsers')}</div>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-3">
            <div className="text-xl font-bold text-teal-700">{users.filter(u => u.status === 'active').length}</div>
            <div className="text-xs text-gray-600">{t('activeUsers')}</div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 overflow-hidden">
        {/* Mobile Card View */}
        <div className="block lg:hidden">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">{t('users')}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {users.length > 0 ? (
              users.map((user) => (
                <div key={user.id} className="p-4 hover:bg-emerald-50/50 transition-colors duration-200">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">{user.name}</h4>
                        <p className="text-xs text-gray-600">{user.email}</p>
                      </div>
                      <Switch
                        checked={user.status === 'active'}
                        onChange={(checked) => handleToggleStatus(user.id, checked ? 'active' : 'inactive')}
                        disabled={loading}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">{t('phone')}:</span> {user.phone || '-'}
                      </div>
                      <div>
                        <span className="font-medium">{t('address')}:</span> {user.address || '-'}
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
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-xs disabled:opacity-50"
                        disabled={loading}
                      >
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-xs disabled:opacity-50"
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
                  className="px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 transition-colors duration-200"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    {t('name')}
                    {renderSortIcon('name')}
                  </div>
                </th>
                <th
                  className="px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 transition-colors duration-200"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center">
                    {t('email')}
                    {renderSortIcon('email')}
                  </div>
                </th>
                <th
                  className="px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 transition-colors duration-200"
                  onClick={() => handleSort('phone')}
                >
                  <div className="flex items-center">
                    {t('phone')}
                    {renderSortIcon('phone')}
                  </div>
                </th>
                <th
                  className="px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 transition-colors duration-200"
                  onClick={() => handleSort('address')}
                >
                  <div className="flex items-center">
                    {t('address')}
                    {renderSortIcon('address')}
                  </div>
                </th>
                <th
                  className="px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 transition-colors duration-200"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center">
                    {t('role')}
                    {renderSortIcon('role')}
                  </div>
                </th>
                <th
                  className="px-6 py-2 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 transition-colors duration-200"
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
                    <td className="px-6 py-2 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-600">
                      {user.phone || '-'}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-600">
                    {user.address ? (user.address.length >50 ? `${user.address.substring(0, 50)}...` : user.address) : '-'}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-600">
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                        {user.role === 'customer' ? t('customer') :
                          user.role === 'driver' ? t('driver') : t('admin')}
                      </span>
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-center">
                      <Switch
                        checked={user.status === 'active'}
                        onChange={(checked) => handleToggleStatus(user.id, checked ? 'active' : 'inactive')}
                        disabled={loading}
                      />
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        t={tCommon}
        itemName="users"
      />

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-6 sm:p-8 lg:p-12"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col border border-gray-100 backdrop-blur-sm">
            {/* Header */}
            <div className="modal-header flex justify-between items-center border-b border-gray-200 p-6 bg-gradient-to-r from-emerald-50 to-teal-50">
              <h2 className="text-2xl font-bold text-gray-800">
                👤 {editingUser ? t('editUser') : t('addNewUser')}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                disabled={loading}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information Section */}
                <div className="bg-blue-50 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    👤 {t('personalInformation')}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('name')} *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                        required
                        disabled={loading}
                        placeholder="Enter full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('email')} *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                        required
                        disabled={loading}
                        placeholder="Enter email address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('phone')}</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                        disabled={loading}
                        placeholder="Enter phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('businessName')}</label>
                      <input
                        type="text"
                        value={formData.business_name}
                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                        disabled={loading}
                        placeholder="Enter business name (optional)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('role')} *</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as User['role'] })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                        disabled={loading}
                      >
                        <option value="customer">{t('customer')}</option>
                        <option value="driver">{t('driver')}</option>
                        <option value="admin">{t('admin')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Address Information Section */}
                <div className="bg-green-50 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    🏠 Address Information
                  </h3>

                  <div className="space-y-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('address')}</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.address}
                          onChange={handleAddressInputChange}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                          disabled={loading}
                          placeholder="Start typing to search for address..."
                        />
                        {isSearchingAddress && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>

                      {showAddressSuggestions && addressSuggestions.length > 0 && (
                        <div
                          ref={addressSuggestionsRef}
                          className="absolute z-50 mt-1 w-full bg-white shadow-lg rounded-lg border border-gray-200 max-h-60 overflow-auto"
                        >
                          {addressSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                              onClick={() => handleSelectAddressSuggestion(suggestion)}
                            >
                              <div className="text-sm font-medium text-gray-900">{suggestion.address}</div>
                              {suggestion.city && suggestion.postcode && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {suggestion.city}, {suggestion.postcode}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="mt-1 text-xs text-gray-500">
                        Type an address to get suggestions and auto-fill city and zip code
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('city')}</label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                          disabled={loading}
                          placeholder="Enter city (optional)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('zipCode')}</label>
                        <input
                          type="text"
                          value={formData.zip_code}
                          onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                          disabled={loading}
                          placeholder="Enter zip code (optional)"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{t('notes')}</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 resize-none"
                        disabled={loading}
                        placeholder="Enter additional notes (optional)"
                      />
                    </div>
                  </div>
                </div>

                {/* Security & Access Section */}
                <div className="bg-purple-50 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    🔒 {t('securityAndAccess')}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('password')} {!editingUser && '*'}
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-4 py-3 pr-32 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                          disabled={loading}
                          placeholder={editingUser ? t('passwordPlaceholder') : "Enter secure password"}
                          required={!editingUser}
                        />
                        <button
                          type="button"
                          onClick={generateRandomPassword}
                          disabled={loading}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 inline-flex items-center px-3 py-1.5 border border-emerald-300 text-xs font-medium rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 hover:scale-105"
                        >
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Generate
                        </button>
                      </div>
                    </div>

                    {editingUser && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">{t('status')}</label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as User['status'] })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                          disabled={loading}
                        >
                          <option value="active">{t('active')}</option>
                          <option value="inactive">{t('inactive')}</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="modal-footer border-t border-gray-200 p-6 bg-gray-50 flex flex-col sm:flex-row justify-between gap-4">
              <button
                onClick={closeModal}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 font-medium"
                disabled={loading}
              >
                ❌ {t('cancel')}
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`px-6 py-3 flex items-center justify-center space-x-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 
                  ${loading
                    ? 'bg-emerald-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg'} 
                  text-white`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t('processing')}</span>
                  </>
                ) : (
                  <>
                    <span>{editingUser ? '✏️ ' + t('update') : '➕ ' + t('add')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      <ImportUserModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
} 