import { supabaseAdmin } from './supabase';

/**
 * Set up storage buckets and permissions
 */
export async function setupStorage() {
  try {
    // Create products bucket if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabaseAdmin
      .storage
      .listBuckets();
      
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      throw bucketsError;
    }
    
    const productsBucketExists = buckets.some(bucket => bucket.name === 'products');
    
    if (!productsBucketExists) {
      console.log('Creating products storage bucket...');
      const { error } = await supabaseAdmin
        .storage
        .createBucket('products', {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
          fileSizeLimit: 1024 * 1024 * 2, // 2MB
        });
        
      if (error) {
        console.error('Error creating products bucket:', error);
        throw error;
      }
      
      console.log('Products bucket created successfully!');
    } else {
      console.log('Products bucket already exists');
    }
    
    // Set bucket public
    const { error: updateError } = await supabaseAdmin
      .storage
      .updateBucket('products', {
        public: true,
      });
      
    if (updateError) {
      console.error('Error making products bucket public:', updateError);
    } else {
      console.log('Products bucket set to public successfully!');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Storage setup failed:', error);
    return { success: false, error };
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupStorage()
    .then(result => {
      console.log('Storage setup result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unhandled error in storage setup:', err);
      process.exit(1);
    });
} 