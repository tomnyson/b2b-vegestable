// Follow this setup guide to integrate the Deno runtime into your project:
// https://deno.land/manual/examples/deploy_node_server

// This is a skeleton Edge Function that can be used to send emails
// In a production environment, you would integrate with an email service
// like SendGrid, Mailgun, AWS SES, etc.

// Add Deno types
// @deno-types="https://deno.land/x/servest/types/react/index.d.ts"

interface EmailRequestBody {
  to: string;
  subject: string;
  orderData?: any;
  invoiceHtml?: string;
}

// For types
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: {
    get: (key: string) => string | undefined;
  }
};

Deno.serve(async (req: Request) => {
  // Enable CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Parse request body
    const body: EmailRequestBody = await req.json();
    
    // Validate required fields
    if (!body.to || !body.subject) {
      return new Response(JSON.stringify({ error: 'Missing required fields: to, subject' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    // Log email parameters - in a real implementation, you'd send the email here
    console.log(`Sending email to: ${body.to}`);
    console.log(`Subject: ${body.subject}`);
    console.log(`Has order data: ${!!body.orderData}`);
    console.log(`Has HTML content: ${!!body.invoiceHtml}`);
    
    // In a production implementation, you would call an email service here
    // For example, using SendGrid:
    /*
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sendGridApiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: body.to }] }],
        from: { email: 'noreply@b2bvegetable.com', name: 'B2B Vegetable' },
        subject: body.subject,
        content: [
          {
            type: 'text/html',
            value: body.invoiceHtml || `<p>Your order details are attached.</p>`,
          },
        ],
      }),
    });
    
    if (!response.ok) {
      const errorResponse = await response.json();
      throw new Error(`Email service error: ${JSON.stringify(errorResponse)}`);
    }
    */

    // Return success
    return new Response(JSON.stringify({ success: true, message: 'Email sent successfully' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: unknown) {
    console.error('Error sending email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}); 