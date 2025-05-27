"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { toast } from 'react-toastify';
import { useTranslations } from 'next-intl';
import { createProduct } from '../../../lib/product-api';
import { uploadImage } from '../../../lib/storage-utils';

export default function AddProductModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const t = useTranslations('products');
  const tc = useTranslations('common');
  
  const TABS = [t('tabDetails'), t('tabEnglish'), t('tabVietnamese'), t('tabTurkish')];
  const [activeTab, setActiveTab] = useState(0);
  const [sku, setSku] = useState("");
  const [unit, setUnit] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [active, setActive] = useState(true);
  const [productNameEn, setProductNameEn] = useState("");
  const [productNameVi, setProductNameVi] = useState("");
  const [productNameTr, setProductNameTr] = useState("");
  const [price, setPrice] = useState("0");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    "mt-1 block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 px-4 py-2 text-gray-900 placeholder-gray-400 transition-all";

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setImageFile(null);
  };

  const resetForm = () => {
    setSku("");
    setUnit("");
    setImage(null);
    setImageFile(null);
    setActive(true);
    setProductNameEn("");
    setProductNameVi("");
    setProductNameTr("");
    setPrice("0");
    setStockQuantity("0");
    setActiveTab(0);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!productNameEn) {
        setError(t('productNameEnRequired'));
        toast.error(t('productNameEnRequired'));
        return;
      }
      
      if (!unit) {
        setError(t('unitRequired'));
        toast.error(t('unitRequired'));
        return;
      }

      const productData = {
        name_en: productNameEn,
        name_vi: productNameVi || undefined,
        name_tr: productNameTr || undefined,
        unit,
        sku: sku || `SKU-${Date.now()}`,
        price: parseFloat(price) || 0,
        stock: parseInt(stockQuantity) || 0,
        is_active: active,
      };

      // Create product with optional image
      const product = await createProduct(productData, imageFile);
      
      // Show success toast
      toast.success(`${t('productCreatedSuccess')}: "${product.name_en}"`);
      
      // Call onSubmit with the created product data
      onSubmit(product);
      
      // Reset form and close modal
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Error creating product:', err);
      setError(err.message);
      toast.error(`${t('productCreateError')}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative animate-fadeIn">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={() => {
            resetForm();
            onClose();
          }}
          disabled={loading}
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-1">{t('addNewProduct')}</h2>
        <p className="text-gray-500 mb-4 text-sm">
          {t('addProductDescription')}
        </p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b mb-6">
          {TABS.map((tab, idx) => (
            <button
              key={tab}
              className={`px-4 py-2 text-sm font-medium focus:outline-none ${
                idx === activeTab
                  ? "border-b-2 border-black text-black"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab(idx)}
              type="button"
              disabled={loading}
            >
              {tab}
            </button>
          ))}
        </div>
        {/* Details Tab */}
        {activeTab === 0 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('sku')}</label>
              <input
                type="text"
                className={inputClass}
                placeholder={t('skuPlaceholder')}
                value={sku}
                onChange={e => setSku(e.target.value)}
                disabled={loading}
              />
              <span className="text-xs text-gray-400">{t('skuHelp')}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{tc('labels.unit')}</label>
              <input
                type="text"
                className={inputClass}
                placeholder={t('unitPlaceholder')}
                value={unit}
                onChange={e => setUnit(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">{tc('labels.price')}</label>
                <input
                  type="number"
                  step="0.01"
                  className={inputClass}
                  placeholder="0.00"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('stockQuantity')}</label>
                <input
                  type="number"
                  className={inputClass}
                  placeholder="0"
                  value={stockQuantity}
                  onChange={e => setStockQuantity(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('productImage')}</label>
              <div className="relative flex items-center justify-center bg-gray-100 rounded-lg h-36 mb-2 border border-dashed border-gray-300">
                {image ? (
                  <>
                    <img src={image} alt="Preview" className="object-contain h-32" />
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-red-100"
                      onClick={handleRemoveImage}
                      disabled={loading}
                    >
                      <span className="text-red-500 text-lg">&times;</span>
                    </button>
                  </>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                    <span className="text-3xl text-gray-300 mb-2">&#128247;</span>
                    <span className="text-xs text-gray-400">{t('clickToUpload')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                      disabled={loading}
                    />
                  </label>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
              <div>
                <span className="block font-medium text-sm">{t('activeStatus')}</span>
                <span className="block text-xs text-gray-400">
                  {t('activeStatusHelp')}
                </span>
              </div>
              <button
                type="button"
                className={`w-10 h-6 flex items-center bg-gray-200 rounded-full p-1 duration-300 focus:outline-none ${active ? 'bg-green-400' : 'bg-gray-200'}`}
                onClick={() => setActive(a => !a)}
                disabled={loading}
              >
                <span
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${active ? 'translate-x-4' : ''}`}
                />
              </button>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                className="px-4 py-2 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                disabled={loading}
              >
                {tc('actions.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 disabled:bg-green-300"
                disabled={loading}
              >
                {loading ? t('adding') : t('addProduct')}
              </button>
            </div>
          </form>
        )}
        {/* English Tab */}
        {activeTab === 1 && (
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('productNameEnglish')}</label>
              <input
                type="text"
                className={inputClass}
                placeholder={t('productNameEnglishPlaceholder')}
                value={productNameEn}
                onChange={e => setProductNameEn(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
        )}
        {/* Vietnamese Tab */}
        {activeTab === 2 && (
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('productNameVietnamese')}</label>
              <input
                type="text"
                className={inputClass}
                placeholder={t('productNameVietnamesePlaceholder')}
                value={productNameVi}
                onChange={e => setProductNameVi(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        )}
        {/* Turkish Tab */}
        {activeTab === 3 && (
          <div className="space-y-4 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('productNameTurkish')}</label>
              <input
                type="text"
                className={inputClass}
                placeholder={t('productNameTurkishPlaceholder')}
                value={productNameTr}
                onChange={e => setProductNameTr(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 