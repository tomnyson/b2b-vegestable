'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
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

type SortField = 'created_at' | 'status' | 'user.name';
type SortDirection = 'asc' | 'desc';

export default function InvoicesPage() {
  const t = useTranslations('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

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
  const itemsPerPage = 10;

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

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
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
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="mt-2 text-gray-600 text-lg">
              {t('description')}
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as Invoice['status'] | 'all')}
              className="px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">{t('labels.allStatuses')}</option>
              <option value="pending">{t('labels.pending')}</option>
              <option value="paid">{t('labels.paid')}</option>
              <option value="cancelled">{t('labels.cancelled')}</option>
            </select>
            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                placeholder={t('actions.search')}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => {
                setEditingInvoice(null);
                resetForm();
                setIsModalOpen(true);
              }}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium flex items-center space-x-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{t('uploadNewInvoice')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{t('labels.date')}</span>
                    {sortField === 'created_at' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('user.name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{t('labels.customer')}</span>
                    {sortField === 'user.name' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>{t('labels.status')}</span>
                    {sortField === 'status' && (
                      <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('labels.notes')}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('labels.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(invoice.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{invoice.user.name}</div>
                    <div className="text-sm text-gray-500">{invoice.user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}`}>
                      {t(`labels.${invoice.status}`)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {invoice.notes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <button
                      onClick={() => handleDownload(invoice.path, `invoice-${invoice.id}.pdf`)}
                      className="text-emerald-600 hover:text-emerald-900"
                    >
                      {t('actions.download')}
                    </button>
                    <button
                      onClick={() => handleEdit(invoice)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {t('actions.edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(invoice.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      {t('actions.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {t('actions.previous')}
            </button>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              {t('actions.next')}
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                {t('labels.showing')} <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> {t('labels.to')}{' '}
                <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> {t('labels.of')}{' '}
                <span className="font-medium">{totalCount}</span> {t('results')}
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('actions.previous')}
                </button>
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('actions.next')}
                </button>
              </nav>
            </div>
          </div>
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
                <h2 className="text-2xl font-bold text-gray-800">
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
                  <select
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                    required
                  >
                    <option value="">{t('selectCustomer')}</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} ({customer.email})
                      </option>
                    ))}
                  </select>
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
    </div>
  );
} 