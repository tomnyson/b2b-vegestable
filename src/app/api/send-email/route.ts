import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // Initialize Supabase client on the server-side
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request data
    const requestData = await request.json();
    console.log('requestData', requestData);
    const { 
      type = 'invoice', 
      orderId, 
      to, 
      customerEmail, 
      invoiceHtml, 
      orderData, 
      driverData, 
      adminData, 
      appSettings 
    } = requestData;

    // Determine recipient email
    const recipientEmail = to || customerEmail;

    if (!orderId || !recipientEmail) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required parameters: orderId and recipient email' 
      }, { status: 400 });
    }

    // Determine sender email from app settings or use fallback
    const fromEmail = appSettings?.supportEmail || 'info@edukidstaynguyen.com';

    let subject = '';
    let emailBody = '';

    // Generate email content based on type
    switch (type) {
      case 'invoice':
        subject = `Your Invoice for Order #${orderId.substring(0, 8)}`;
        emailBody = generateInvoiceEmail(orderData, invoiceHtml, appSettings);
        break;
        
      case 'driver_assignment':
        subject = `New Delivery Assignment - Order #${orderId.substring(0, 8)}`;
        emailBody = generateDriverAssignmentEmail(orderData, driverData, adminData, appSettings);
        break;
        
      case 'order_completion_customer':
        subject = `Order Delivered - Order #${orderId.substring(0, 8)}`;
        emailBody = generateOrderCompletionCustomerEmail(orderData, driverData, appSettings);
        break;
        
      case 'order_completion_admin':
        subject = `Order Completed by Driver - Order #${orderId.substring(0, 8)}`;
        emailBody = generateOrderCompletionAdminEmail(orderData, driverData, adminData, appSettings);
        break;
        
      default:
        return NextResponse.json({ 
          success: false, 
          message: 'Invalid email type' 
        }, { status: 400 });
    }

    // Call Supabase Function with simplified payload format
    console.log('calling supabase function', {
      from: fromEmail,
      to: recipientEmail,
      subject: subject,
      html: emailBody
    });
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: JSON.stringify({
        from: fromEmail,
        to: recipientEmail,
        subject: subject,
        html: emailBody
      })
    });

    if (error) {
      console.error('Error from Supabase function:', error);
      return NextResponse.json({ 
        success: false, 
        message: error.message || 'Failed to send email' 
      }, { status: 500 });
    }

    // Log the email sending event
    await supabase
      .from('email_logs')
      .insert({
        order_id: orderId,
        recipient: recipientEmail,
        type: type,
        status: 'sent'
      });

    return NextResponse.json({ 
      success: true, 
      message: `${type} email sent successfully` 
    });
  } catch (err: any) {
    console.error('Error in API route:', err);
    return NextResponse.json({ 
      success: false, 
      message: err.message || 'An unexpected error occurred' 
    }, { status: 500 });
  }
}

// Email template generators
function generateInvoiceEmail(orderData: any, invoiceHtml?: string, appSettings?: any): string {
  const companyName = appSettings?.companyName || 'B2B Vegetable';
  const supportEmail = appSettings?.supportEmail || 'support@b2bvegetable.com';
  
  if (invoiceHtml) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice - ${companyName}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${companyName}</h1>
            <p>Invoice for Order #${orderData?.id?.substring(0, 8) || 'N/A'}</p>
          </div>
          ${invoiceHtml}
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>If you have any questions, please contact us at ${supportEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
  
  return generateBasicInvoiceEmail(orderData, appSettings);
}

function generateBasicInvoiceEmail(orderData: any, appSettings?: any): string {
  const companyName = appSettings?.companyName || 'B2B Vegetable';
  const supportEmail = appSettings?.supportEmail || 'support@b2bvegetable.com';
  const currency = appSettings?.currency || 'USD';
  const currencySymbol = currency === 'VND' ? '₫' : currency === 'EUR' ? '€' : '$';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice - ${companyName}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .order-details { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
        .total { font-weight: bold; font-size: 18px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${companyName}</h1>
          <h2>Invoice</h2>
          <p>Order #${orderData?.id?.substring(0, 8) || 'N/A'}</p>
          <p>Date: ${orderData?.order_date ? new Date(orderData.order_date).toLocaleDateString() : 'N/A'}</p>
        </div>
        
        <div class="order-details">
          <h3>Order Details</h3>
          <p><strong>Customer:</strong> ${orderData?.customer?.name || 'N/A'}</p>
          <p><strong>Delivery Address:</strong> ${orderData?.delivery_address || 'N/A'}</p>
          
          ${orderData?.items?.length ? `
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderData.items.map((item: any) => `
                  <tr>
                    <td>${item.product?.name || item.product_name || 'Product'}</td>
                    <td>${item.quantity}</td>
                    <td>${currencySymbol}${item.price?.toFixed(2) || '0.00'}</td>
                    <td>${currencySymbol}${((item.quantity || 0) * (item.price || 0)).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p>No items found</p>'}
          
          <div class="total">
            <p>Total Amount: ${currencySymbol}${orderData?.total_amount?.toFixed(2) || '0.00'}</p>
          </div>
          
          ${orderData?.notes ? `<p><strong>Notes:</strong> ${orderData.notes}</p>` : ''}
        </div>
        
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>If you have any questions, please contact us at ${supportEmail}</p>
          <p>&copy; ${new Date().getFullYear()} ${companyName}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateDriverAssignmentEmail(orderData: any, driverData: any, adminData: any, appSettings?: any): string {
  const companyName = appSettings?.companyName || 'B2B Vegetable';
  const supportEmail = appSettings?.supportEmail || 'support@b2bvegetable.com';
  const currency = appSettings?.currency || 'USD';
  const currencySymbol = currency === 'VND' ? '₫' : currency === 'EUR' ? '€' : '$';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Delivery Assignment - ${companyName}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; background: #e3f2fd; padding: 20px; border-radius: 8px; }
        .assignment-details { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .customer-info { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        .highlight { background: #fff3cd; padding: 10px; border-radius: 4px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${companyName}</h1>
          <h2>🚚 New Delivery Assignment</h2>
          <p>Order #${orderData?.id?.substring(0, 8) || 'N/A'}</p>
        </div>
        
        <div class="assignment-details">
          <h3>Hello ${driverData?.name || 'Driver'},</h3>
          <p>You have been assigned a new delivery order. Please review the details below:</p>
          
          <div class="highlight">
            <p><strong>Order ID:</strong> ${orderData?.id || 'N/A'}</p>
            <p><strong>Order Date:</strong> ${orderData?.order_date ? new Date(orderData.order_date).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Status:</strong> ${orderData?.status || 'pending'}</p>
            ${adminData ? `<p><strong>Assigned by:</strong> ${adminData.name} (${adminData.email})</p>` : ''}
          </div>
          
          <div class="customer-info">
            <h4>Customer Information</h4>
            <p><strong>Customer:</strong> ${orderData?.customer?.name || 'N/A'}</p>
            ${orderData?.customer?.email ? `<p><strong>Email:</strong> ${orderData.customer.email}</p>` : ''}
            ${orderData?.customer?.phone ? `<p><strong>Phone:</strong> ${orderData.customer.phone}</p>` : ''}
            <p><strong>Delivery Address:</strong> ${orderData?.delivery_address || 'N/A'}</p>
          </div>
          
          ${orderData?.items?.length ? `
            <h4>Order Items</h4>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                ${orderData.items.map((item: any) => `
                  <tr>
                    <td>${item.product?.name || item.product_name || 'Product'}</td>
                    <td>${item.quantity} ${item.product?.unit || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p>No items found</p>'}
          
          <p><strong>Total Amount:</strong> ${currencySymbol}${orderData?.total_amount?.toFixed(2) || '0.00'}</p>
          
          ${orderData?.notes ? `
            <div class="highlight">
              <p><strong>Special Instructions:</strong></p>
              <p>${orderData.notes}</p>
            </div>
          ` : ''}
          
          <p>Please log into your driver dashboard to update the delivery status and manage this order.</p>
        </div>
        
        <div class="footer">
          <p>If you have any questions, please contact us at ${supportEmail}</p>
          <p>&copy; ${new Date().getFullYear()} ${companyName}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateOrderCompletionCustomerEmail(orderData: any, driverData: any, appSettings?: any): string {
  const companyName = appSettings?.companyName || 'B2B Vegetable';
  const supportEmail = appSettings?.supportEmail || 'support@b2bvegetable.com';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Delivered - ${companyName}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; background: #d4edda; padding: 20px; border-radius: 8px; }
        .delivery-details { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        .success { background: #d1ecf1; padding: 15px; border-radius: 8px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${companyName}</h1>
          <h2>✅ Order Delivered Successfully!</h2>
          <p>Order #${orderData?.id?.substring(0, 8) || 'N/A'}</p>
        </div>
        
        <div class="delivery-details">
          <h3>Dear ${orderData?.customer?.name || 'Valued Customer'},</h3>
          
          <div class="success">
            <p><strong>Great news!</strong> Your order has been successfully delivered.</p>
          </div>
          
          <p><strong>Order Details:</strong></p>
          <ul>
            <li><strong>Order ID:</strong> ${orderData?.id || 'N/A'}</li>
            <li><strong>Delivery Date:</strong> ${new Date().toLocaleDateString()}</li>
            <li><strong>Delivered by:</strong> ${driverData?.name || 'Our delivery team'}</li>
            <li><strong>Delivery Address:</strong> ${orderData?.delivery_address || 'N/A'}</li>
          </ul>
          
          ${orderData?.items?.length ? `
            <p><strong>Items Delivered:</strong></p>
            <ul>
              ${orderData.items.map((item: any) => `
                <li>${item.quantity} ${item.product?.unit || ''} of ${item.product?.name || item.product_name || 'Product'}</li>
              `).join('')}
            </ul>
          ` : ''}
          
          <p>We hope you're satisfied with your fresh vegetables! If you have any questions or concerns about your delivery, please don't hesitate to contact us.</p>
          
          <p>Thank you for choosing ${companyName} for your fresh produce needs. We look forward to serving you again!</p>
        </div>
        
        <div class="footer">
          <p>Questions? Contact us at ${supportEmail}</p>
          <p>&copy; ${new Date().getFullYear()} ${companyName}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateOrderCompletionAdminEmail(orderData: any, driverData: any, adminData: any, appSettings?: any): string {
  const companyName = appSettings?.companyName || 'B2B Vegetable';
  const supportEmail = appSettings?.supportEmail || 'support@b2bvegetable.com';
  const currency = appSettings?.currency || 'USD';
  const currencySymbol = currency === 'VND' ? '₫' : currency === 'EUR' ? '€' : '$';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Completed - ${companyName}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .completion-details { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        .info-box { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f8f9fa; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${companyName}</h1>
          <h2>📋 Order Completion Report</h2>
          <p>Order #${orderData?.id?.substring(0, 8) || 'N/A'}</p>
        </div>
        
        <div class="completion-details">
          <h3>Hello ${adminData?.name || 'Admin'},</h3>
          
          <div class="info-box">
            <p><strong>Order Status Update:</strong> The following order has been marked as completed by the driver.</p>
          </div>
          
          <p><strong>Completion Details:</strong></p>
          <ul>
            <li><strong>Order ID:</strong> ${orderData?.id || 'N/A'}</li>
            <li><strong>Completed by:</strong> ${driverData?.name || 'Unknown Driver'} (${driverData?.email || 'N/A'})</li>
            <li><strong>Completion Date:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</li>
            <li><strong>Customer:</strong> ${orderData?.customer?.name || 'N/A'}</li>
            <li><strong>Delivery Address:</strong> ${orderData?.delivery_address || 'N/A'}</li>
          </ul>
          
          <p><strong>Order Summary:</strong></p>
          <ul>
            <li><strong>Order Date:</strong> ${orderData?.order_date ? new Date(orderData.order_date).toLocaleDateString() : 'N/A'}</li>
            <li><strong>Total Amount:</strong> ${currencySymbol}${orderData?.total_amount?.toFixed(2) || '0.00'}</li>
            <li><strong>Payment Status:</strong> ${orderData?.payment_status || 'N/A'}</li>
          </ul>
          
          ${orderData?.items?.length ? `
            <p><strong>Items Delivered:</strong></p>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${orderData.items.map((item: any) => `
                  <tr>
                    <td>${item.product?.name || item.product_name || 'Product'}</td>
                    <td>${item.quantity} ${item.product?.unit || ''}</td>
                    <td>${currencySymbol}${item.price?.toFixed(2) || '0.00'}</td>
                    <td>${currencySymbol}${((item.quantity || 0) * (item.price || 0)).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p>No items found</p>'}
          
          ${orderData?.notes ? `
            <div class="info-box">
              <p><strong>Order Notes:</strong></p>
              <p>${orderData.notes}</p>
            </div>
          ` : ''}
          
          <p>The customer has been automatically notified of the successful delivery.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated notification from your delivery management system.</p>
          <p>&copy; ${new Date().getFullYear()} ${companyName}</p>
        </div>
      </div>
    </body>
    </html>
  `;
} 