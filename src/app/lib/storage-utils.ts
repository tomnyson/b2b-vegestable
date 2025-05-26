import { supabase } from './supabase';

/**
 * Uploads an image to Supabase storage
 * @param file The file to upload
 * @param bucket The storage bucket name (default: 'products')
 * @returns The public URL of the uploaded image
 */
export async function uploadImage(file: File, bucket = 'products'): Promise<string | null> {
  try {
    // Generate a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadImage:', error);
    return null;
  }
}

/**
 * Uploads a product image to Supabase storage
 * @param file The file to upload
 * @returns The public URL of the uploaded product image
 */
export async function uploadProductImage(file: File): Promise<string> {
  const url = await uploadImage(file, 'products');
  if (!url) {
    throw new Error('Failed to upload product image');
  }
  return url;
} 