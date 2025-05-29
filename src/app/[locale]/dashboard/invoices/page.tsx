'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import Pagination from '@/app/components/Pagination';
import {
  getInvoices,
  getCustomers,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  downloadInvoice,
  type Invoice,
  type Customer,
  type InvoiceFilters,
  type CreateInvoiceData,
  type UpdateInvoiceData
} from '../../../lib/invoice-api';
import { supabase } from '../../../lib/supabase';

type SortField = 'created_at' | 'status' | 'user.name';
type SortDirection = 'asc' | 'desc';

export default function InvoicesPage() {
  const t = useTranslations('invoices');
  const tCommon = useTranslations('common');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Add preview modal state
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewingInvoice, setPreviewingInvoice] = useState<Invoice | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Invoice['status'] | 'all'>('all');

  // Sorting state
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    user_id: '',
    notes: '',
    status: 'pending' as Invoice['status']
  });

  // Fetch invoices and customers
  useEffect(() => {
    fetchInvoicesData();
    fetchCustomersData();
  }, [currentPage, sortField, sortDirection, searchTerm, statusFilter]);

  const fetchInvoicesData = async () => {
    try {
      setLoading(true);
      
      const filters: InvoiceFilters = {
        searchTerm,
        statusFilter,
        sortField,
        sortDirection,
        page: currentPage,
        itemsPerPage
      };

      const response = await getInvoices(filters);
      setInvoices(response.invoices);
      setTotalCount(response.totalCount);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError(t('loadingError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomersData = async () => {
    try {
      const customersData = await getCustomers();
      setCustomers(customersData);
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast.error(t('pdfOnly'));
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      user_id: invoice.user_id,
      notes: invoice.notes || '',
      status: invoice.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('deleteConfirm'))) {
      try {
        setLoading(true);
        await deleteInvoice(id);
        toast.success(t('deleteSuccess'));
        fetchInvoicesData();
      } catch (err) {
        console.error('Error deleting invoice:', err);
        toast.error(t('deleteError'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!selectedFile && !editingInvoice) || !formData.user_id) {
      toast.error(t('requiredFields'));
      return;
    }

    try {
      setLoading(true);
      
      if (editingInvoice) {
        // Update existing invoice
        const updateData: UpdateInvoiceData = {
          user_id: formData.user_id,
          notes: formData.notes,
          status: formData.status
        };

        await updateInvoice(editingInvoice.id, updateData);
        toast.success(t('updateSuccess'));
      } else {
        // Create new invoice
        const createData: CreateInvoiceData = {
          user_id: formData.user_id,
          notes: formData.notes,
          status: formData.status,
          file: selectedFile!
        };

        await createInvoice(createData);
        toast.success(t('uploadSuccess'));
      }

      setIsModalOpen(false);
      fetchInvoicesData();
      resetForm();
    } catch (err) {
      console.error('Error saving invoice:', err);
      toast.error(editingInvoice ? t('updateError') : t('uploadError'));
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (path: string, fileName: string) => {
    try {
      await downloadInvoice(path, fileName);
    } catch (err) {
      console.error('Error downloading file:', err);
      toast.error(t('downloadError'));
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      notes: '',
      status: 'pending'
    });
    setSelectedFile(null);
    setEditingInvoice(null);
  };

  // Handle column sorting
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
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

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Handle PDF preview
  const handlePreview = async (invoice: Invoice) => {
    try {
      setPreviewLoading(true);
      setPreviewingInvoice(invoice);
      
      // Get the PDF URL from Supabase storage
      const { data, error } = await supabase.storage
        .from('products')
        .createSignedUrl(invoice.path, 60 * 60); // URL valid for 1 hour

      if (error) throw error;

      setPreviewPdfUrl(data.signedUrl);
      setIsPreviewModalOpen(true);
    } catch (err) {
      console.error('Error getting preview URL:', err);
      toast.error('Failed to load preview. Please try downloading the file instead.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Close preview modal
  const closePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setPreviewPdfUrl(null);
    setPreviewingInvoice(null);
  };

  // Loading state
  if (loading && invoices.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          <p className="text-lg font-medium text-gray-700">{t('labels.loading')}</p>
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
      <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="mt-1 text-gray-600 text-base">
              {t('description')}
            </p>
          </div>
          <div className="mt-4 lg:mt-0">
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center space-x-2 disabled:opacity-50 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{t('uploadNewInvoice')}</span>
            </button>
          </div>
        </div>
      </div>

     
      {/* Search and Filters */}
      <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-1">
              {t('actions.search')}
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
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-xs font-medium text-gray-700 mb-1">
              {t('labels.status')}
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as Invoice['status'] | 'all');
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 text-sm"
            >
              <option value="all">{t('labels.allStatuses')}</option>
              <option value="pending">{t('labels.pending')}</option>
              <option value="paid">{t('labels.paid')}</option>
              <option value="cancelled">{t('labels.cancelled')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 overflow-hidden">
        {/* Mobile Card View */}
        <div className="block lg:hidden">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">{t('title')}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {invoices.length > 0 ? (
              invoices.map((invoice) => (
                <div key={invoice.id} className="p-4 hover:bg-emerald-50/50 transition-colors duration-200">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-base font-semibold text-gray-900">{invoice.user.name}</h4>
                        <p className="text-xs text-gray-600">{invoice.user.email}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {t(`labels.${invoice.status}`)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Date:</span> {new Date(invoice.created_at).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Notes:</span> {invoice.notes || '-'}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handlePreview(invoice)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-xs"
                      >
                        {t('actions.preview')}
                      </button>
                      <button
                        onClick={() => handleDownload(invoice.path, `invoice-${invoice.id}.pdf`)}
                        className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors font-medium text-xs"
                      >
                        {t('actions.download')}
                      </button>
                      <button
                        onClick={() => handleEdit(invoice)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-xs"
                      >
                        {t('actions.edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(invoice.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium text-xs"
                      >
                        {t('actions.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 font-medium">{t('noInvoicesFound')}</p>
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
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    {t('labels.date')}
                    {sortField === 'created_at' && (
                      <svg className={`w-4 h-4 ml-1 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 transition-colors duration-200"
                  onClick={() => handleSort('user.name')}
                >
                  <div className="flex items-center">
                    {t('labels.customer')}
                    {sortField === 'user.name' && (
                      <svg className={`w-4 h-4 ml-1 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-emerald-100 transition-colors duration-200"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    {t('labels.status')}
                    {sortField === 'status' && (
                      <svg className={`w-4 h-4 ml-1 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </div>
                </th>
                <th className="px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('labels.notes')}
                </th>
                <th className="px-6 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('labels.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-gray-100">
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-emerald-50/50 transition-colors duration-200">
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{invoice.user.name}</div>
                      <div className="text-sm text-gray-500">{invoice.user.email}</div>
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {t(`labels.${invoice.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-2 text-sm text-gray-500">
                      {invoice.notes ? (invoice.notes.length > 50 ? `${invoice.notes.substring(0, 50)}...` : invoice.notes) : '-'}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handlePreview(invoice)}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title={t('actions.preview')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDownload(invoice.path, `invoice-${invoice.id}.pdf`)}
                          className="text-emerald-600 hover:text-emerald-900 p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                          title={t('actions.download')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEdit(invoice)}
                          className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                          title={t('actions.edit')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(invoice.id)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title={t('actions.delete')}
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
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 font-medium">{t('noInvoicesFound')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload/Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-opacity-60 flex items-center justify-center z-50 p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
              resetForm();
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingInvoice ? t('editInvoice') : t('uploadNewInvoice')}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('selectCustomer')} *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={
                        customers.find((c) => c.id === formData.user_id)
                          ? `${customers.find((c) => c.id === formData.user_id)?.name} (${customers.find((c) => c.id === formData.user_id)?.email || ''})`
                          : formData.user_id
                      }
                      onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                      placeholder={t('selectCustomer')}
                      required
                    />
                    {formData.user_id && (
                      <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                        {customers
                          .filter((c) =>
                            `${c.name} (${c.email})`.toLowerCase().includes(formData.user_id.toLowerCase())
                          )
                          .map((c) => (
                            <li
                              key={c.id}
                              onClick={() => setFormData({ ...formData, user_id: c.id })}
                              className="px-4 py-2 hover:bg-emerald-100 cursor-pointer text-sm"
                            >
                              {c.name} ({c.email})
                            </li>
                          ))}
                      </ul>
                    )}
                  </div>
                </div>

                {!editingInvoice && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('uploadPDF')} *
                    </label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500">
                            <span>{t('uploadFile')}</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              className="sr-only"
                              accept="application/pdf"
                              onChange={handleFileChange}
                              required={!editingInvoice}
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">PDF {t('upTo')} 10MB</p>
                        {selectedFile && (
                          <p className="text-sm text-emerald-600">{selectedFile.name}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('labels.notes')}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    placeholder={t('notesPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('labels.status')}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Invoice['status'] })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                  >
                    <option value="pending">{t('labels.pending')}</option>
                    <option value="paid">{t('labels.paid')}</option>
                    <option value="cancelled">{t('labels.cancelled')}</option>
                  </select>
                </div>
              </form>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
                >
                  {t('actions.cancel')}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || (!editingInvoice && !selectedFile) || !formData.user_id}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {uploadProgress > 0 ? `${Math.round(uploadProgress)}%` : t('labels.loading')}
                    </>
                  ) : (
                    editingInvoice ? t('actions.save') : t('upload')
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && (
        <div
          className="fixed inset-0 bg-opacity-60 flex items-center justify-center z-50 p-6"
          onClick={closePreviewModal}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  {previewingInvoice ? t('previewInvoice') : t('previewError')}
                </h2>
                <button
                  onClick={closePreviewModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {previewLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                </div>
              ) : previewPdfUrl ? (
                <iframe
                  src={previewPdfUrl}
                  width="100%"
                  height="600px"
                  frameBorder="0"
                ></iframe>
              ) : (
                <p className="text-red-700 font-medium">{t('previewError')}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 