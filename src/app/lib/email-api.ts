import { supabase } from './supabase';
import { Order, OrderItem } from './order-api';
import { getAppSettings } from './settings-api';
import { getUserById } from './users-api';

interface EmailResponse {
  success: boolean;
  message: string;
}

/**
 * Send invoice email to customer
 * @param orderId The order ID
 * @param customerEmail The customer's email address
 * @param invoiceHtml Optional HTML content for the invoice
 */
export async function sendInvoiceEmail(
  orderId: string,
  customerEmail: string,
  invoiceHtml?: string
): Promise<EmailResponse> {
  try {
    // First get order details if we need to
    let order: Order | null = null;
    let customerDetails = null;

    if (!invoiceHtml) {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('id', orderId)
        .single();
      
      if (error) {
        console.error('Error fetching order for invoice email:', error);
        return {
          success: false,
          message: 'Failed to fetch order details'
        };
      }
      
      order = data;

      // Get customer details if user_id is available
      if (order?.user_id) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email, name, phone, address')
          .eq('id', order.user_id)
          .single();
        
        if (!userError && userData) {
          customerDetails = userData;
          // Attach customer data to order
          order.customer = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            phone: userData.phone,
            address: userData.address
          };
        }
      }
    }

    // Get app settings for branding the email
    const appSettings = await getAppSettings();

    // Call our Next.js API route with simplified format
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'invoice',
        orderId,
        customerEmail,
        orderData: order,
        customerDetails,
        invoiceHtml,
        appSettings: {
          companyName: appSettings?.company_name || 'B2B Vegetable',
          logoUrl: appSettings?.logo_url || '',
          supportEmail: appSettings?.support_email || '',
          supportPhone: appSettings?.support_phone || '',
          vatPercentage: appSettings?.vat_percentage || 0,
          currency: appSettings?.default_currency || 'USD'
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error sending invoice email:', result);
      return {
        success: false,
        message: result.message || 'Failed to send email'
      };
    }

    return {
      success: true,
      message: 'Invoice email sent successfully'
    };
  } catch (err: any) {
    console.error('Error in sendInvoiceEmail:', err);
    return {
      success: false,
      message: err.message || 'An unexpected error occurred'
    };
  }
}

/**
 * Send driver assignment notification email
 * @param orderId The order ID
 * @param driverId The driver's user ID
 * @param adminId The admin's user ID who assigned the driver
 */
export async function sendDriverAssignmentEmail(
  orderId: string,
  driverId: string,
  adminId?: string
): Promise<EmailResponse> {
  try {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*),
        customer:user_id(id, email, name, phone)
      `)
      .eq('id', orderId)
      .single();
    
    if (orderError || !order) {
      console.error('Error fetching order for driver assignment email:', orderError);
      return {
        success: false,
        message: 'Failed to fetch order details'
      };
    }

    // Get driver details
    const driver = await getUserById(driverId);
    if (!driver) {
      return {
        success: false,
        message: 'Driver not found'
      };
    }

    // Get admin details if provided
    let admin = null;
    if (adminId) {
      try {
        admin = await getUserById(adminId);
      } catch (err) {
        console.warn('Could not fetch admin details:', err);
      }
    }

    // Get app settings
    const appSettings = await getAppSettings();

    // Send email to driver with simplified format
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'driver_assignment',
        orderId,
        to: driver.email,
        orderData: order,
        driverData: driver,
        adminData: admin,
        appSettings: {
          companyName: appSettings?.company_name || 'B2B Vegetable',
          logoUrl: appSettings?.logo_url || '',
          supportEmail: appSettings?.support_email || '',
          supportPhone: appSettings?.support_phone || '',
          currency: appSettings?.default_currency || 'USD'
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error sending driver assignment email:', result);
      return {
        success: false,
        message: result.message || 'Failed to send email'
      };
    }

    // Log the email sending event
    await supabase
      .from('email_logs')
      .insert({
        order_id: orderId,
        recipient: driver.email,
        type: 'driver_assignment',
        status: 'sent'
      });

    return {
      success: true,
      message: 'Driver assignment email sent successfully'
    };
  } catch (err: any) {
    console.error('Error in sendDriverAssignmentEmail:', err);
    return {
      success: false,
      message: err.message || 'An unexpected error occurred'
    };
  }
}

/**
 * Send order completion notification emails
 * @param orderId The order ID
 * @param driverId The driver's user ID who completed the order
 */
export async function sendOrderCompletionEmails(
  orderId: string,
  driverId: string
): Promise<EmailResponse> {
  try {
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*),
        customer:user_id(id, email, name, phone)
      `)
      .eq('id', orderId)
      .single();
    
    if (orderError || !order) {
      console.error('Error fetching order for completion email:', orderError);
      return {
        success: false,
        message: 'Failed to fetch order details'
      };
    }

    // Get driver details
    const driver = await getUserById(driverId);
    if (!driver) {
      return {
        success: false,
        message: 'Driver not found'
      };
    }

    // Get admin users
    const { data: admins, error: adminError } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('role', 'admin')
      .eq('status', 'active');

    if (adminError) {
      console.warn('Could not fetch admin users:', adminError);
    }

    // Get app settings
    const appSettings = await getAppSettings();

    const emailPromises: Promise<Response>[] = [];

    // Send email to customer if we have customer email
    const customerEmail = order.customer?.email;

    if (customerEmail) {
      emailPromises.push(
        fetch('/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'order_completion_customer',
            orderId,
            to: customerEmail,
            orderData: order,
            driverData: driver,
            appSettings: {
              companyName: appSettings?.company_name || 'B2B Vegetable',
              logoUrl: appSettings?.logo_url || '',
              supportEmail: appSettings?.support_email || '',
              supportPhone: appSettings?.support_phone || '',
              currency: appSettings?.default_currency || 'USD'
            }
          })
        })
      );
    }

    // Send emails to all active admins
    if (admins && admins.length > 0) {
      for (const admin of admins) {
        emailPromises.push(
          fetch('/api/send-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'order_completion_admin',
              orderId,
              to: admin.email,
              orderData: order,
              driverData: driver,
              adminData: admin,
              appSettings: {
                companyName: appSettings?.company_name || 'B2B Vegetable',
                logoUrl: appSettings?.logo_url || '',
                supportEmail: appSettings?.support_email || '',
                supportPhone: appSettings?.support_phone || '',
                currency: appSettings?.default_currency || 'USD'
              }
            })
          })
        );
      }
    }

    // Wait for all emails to be sent
    const results = await Promise.allSettled(emailPromises);
    
    // Log email sending events
    const emailLogs = [];
    
    if (customerEmail) {
      emailLogs.push({
        order_id: orderId,
        recipient: customerEmail,
        type: 'order_completion_customer',
        status: results[0]?.status === 'fulfilled' ? 'sent' : 'failed'
      });
    }

    if (admins && admins.length > 0) {
      const adminStartIndex = customerEmail ? 1 : 0;
      admins.forEach((admin, index) => {
        emailLogs.push({
          order_id: orderId,
          recipient: admin.email,
          type: 'order_completion_admin',
          status: results[adminStartIndex + index]?.status === 'fulfilled' ? 'sent' : 'failed'
        });
      });
    }

    if (emailLogs.length > 0) {
      await supabase.from('email_logs').insert(emailLogs);
    }

    // Check if any emails failed
    const failedCount = results.filter(result => result.status === 'rejected').length;
    const successCount = results.length - failedCount;

    if (failedCount > 0) {
      console.warn(`${failedCount} out of ${results.length} completion emails failed to send`);
    }

    return {
      success: successCount > 0,
      message: failedCount === 0 
        ? 'All order completion emails sent successfully'
        : `${successCount} emails sent, ${failedCount} failed`
    };
  } catch (err: any) {
    console.error('Error in sendOrderCompletionEmails:', err);
    return {
      success: false,
      message: err.message || 'An unexpected error occurred'
    };
  }
} 