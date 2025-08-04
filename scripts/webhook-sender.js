/**
 * Simple Webhook Sender - Bypasses CORS issues
 */

const WEBHOOK_URL = 'https://n8n-production-6162.up.railway.app/webhook/0d4e482b-9a24-4306-882c-0f9dad7a9219';

/**
 * Send webhook using form submission (bypasses CORS)
 */
function sendWebhookViaForm() {
  console.log('🚀 Sending webhook via form method...');
  
  const payload = {
    action: 'dispatch_messages',
    timestamp: new Date().toISOString(),
    source: 'whatsapp-dispatcher-web',
    userAgent: navigator.userAgent
  };
  
  console.log('📦 Payload:', payload);
  
  // Create hidden form
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = WEBHOOK_URL;
  form.target = 'webhook-frame'; // Use hidden iframe
  form.style.display = 'none';
  
  // Create hidden iframe to receive response
  let iframe = document.getElementById('webhook-frame');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'webhook-frame';
    iframe.name = 'webhook-frame';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
  }
  
  // Add form fields
  Object.entries(payload).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = typeof value === 'object' ? JSON.stringify(value) : value;
    form.appendChild(input);
  });
  
  // Submit form
  document.body.appendChild(form);
  form.submit();
  
  // Clean up
  setTimeout(() => {
    if (document.body.contains(form)) {
      document.body.removeChild(form);
    }
  }, 1000);
  
  console.log('✅ Form submitted successfully');
  return true;
}

/**
 * Send webhook using fetch with CORS proxy
 */
async function sendWebhookViaProxy() {
  console.log('🚀 Sending webhook via CORS proxy...');
  
  const payload = {
    action: 'dispatch_messages',
    timestamp: new Date().toISOString(),
    source: 'whatsapp-dispatcher-web',
    userAgent: navigator.userAgent
  };
  
  console.log('📦 Payload:', payload);
  
  try {
    // Use a working CORS proxy
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(WEBHOOK_URL)}`;
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const responseText = await response.text();
      console.log('✅ Webhook sent successfully:', responseText);
      return true;
    } else {
      console.log('⚠️ Webhook response not OK, but continuing...');
      return true; // Fire-and-forget
    }
    
  } catch (error) {
    console.log('❌ Proxy method failed:', error.message);
    console.log('🔄 Falling back to form method...');
    return sendWebhookViaForm();
  }
}

/**
 * Main webhook sender function
 */
async function sendWebhook() {
  console.log('🎯 Starting webhook dispatch...');
  
  try {
    // Try proxy method first
    const success = await sendWebhookViaProxy();
    if (success) {
      console.log('🎉 Webhook dispatch completed!');
      return true;
    }
  } catch (error) {
    console.log('⚠️ Proxy method failed, trying form method...');
  }
  
  // Fallback to form method
  return sendWebhookViaForm();
}

/**
 * Test function for direct webhook call
 */
function testWebhookDirect() {
  console.log('🧪 DIRECT TEST - Creating form...');
  
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = WEBHOOK_URL;
  form.target = '_blank';
  
  // Add test data
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'test';
  input.value = 'direct-test-' + Date.now();
  form.appendChild(input);
  
  const input2 = document.createElement('input');
  input2.type = 'hidden';
  input2.name = 'action';
  input2.value = 'dispatch_messages';
  form.appendChild(input2);
  
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
  
  console.log('✅ Direct test form submitted!');
  alert('Teste enviado! Verifique o n8n para ver se chegou.');
}

// Export for global use
window.sendWebhook = sendWebhook;
window.testWebhookDirect = testWebhookDirect;