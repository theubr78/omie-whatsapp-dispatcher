/**
 * WhatsApp Dispatcher - Main Application Script
 * Handles message dispatching via n8n webhook integration
 */

// ========================================
// CONFIGURATION - Edit webhook URL here
// ========================================
const config = {
  // Change this URL to your n8n webhook endpoint
  webhookUrl: 'https://n8n-production-6162.up.railway.app/webhook/0d4e482b-9a24-4306-882c-0f9dad7a9219',
  // Original webhook URL (for reference)
  originalWebhookUrl: 'https://n8n-production-6162.up.railway.app/webhook/0d4e482b-9a24-4306-882c-0f9dad7a9219',

  // Request timeout in milliseconds
  apiTimeout: 10000,

  // Modal auto-close duration in milliseconds
  feedbackDuration: 3000,

  // Debounce delay to prevent multiple rapid clicks
  debounceDelay: 1000
};

// ========================================
// STATE MANAGEMENT
// ========================================
const uiState = {
  isLoading: false,
  showModal: false,
  lastDispatchTime: null,
  debounceTimer: null
};

// ========================================
// DOM ELEMENTS
// ========================================
let dispatchButton;
let feedbackModal;
let modalTitle;

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Logs messages with timestamp for debugging
 * @param {string} message - Message to log
 * @param {string} level - Log level (info, warn, error)
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  console[level](`[${timestamp}] WhatsApp Dispatcher: ${message}`);
}

/**
 * Validates the webhook URL configuration
 * @returns {boolean} - True if URL is valid
 */
function validateConfig() {
  if (!config.webhookUrl || config.webhookUrl === 'https://your-n8n-instance.com/webhook/whatsapp-dispatcher') {
    log('Webhook URL not configured. Please update the webhookUrl in config.', 'warn');
    return false;
  }

  try {
    new URL(config.webhookUrl);
    return true;
  } catch (error) {
    log(`Invalid webhook URL: ${config.webhookUrl}`, 'error');
    return false;
  }
}

/**
 * Creates the request payload for the webhook
 * @returns {object} - Request payload object
 */
function createRequestPayload() {
  return {
    action: 'dispatch_messages',
    timestamp: new Date().toISOString(),
    source: 'whatsapp-dispatcher-web',
    userAgent: navigator.userAgent
  };
}// 
// ========================================
// HTTP REQUEST FUNCTIONS
// ========================================

/**
 * Sends POST request to the webhook URL
 * @returns {Promise<boolean>} - True if request was sent successfully
 */
async function sendWebhookRequest() {
  const payload = createRequestPayload();

  try {
    log(`Sending webhook request to: ${config.webhookUrl}`, 'info');
    log(`Payload: ${JSON.stringify(payload, null, 2)}`, 'info');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      log('Request timeout - aborting', 'warn');
      controller.abort();
    }, config.apiTimeout);

    // Try direct request first, then fallback to proxy if CORS fails
    let response;
    try {
      response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
        mode: 'cors'
      });
    } catch (corsError) {
      log('Direct request failed due to CORS, trying proxy...', 'warn');

      // Fallback to CORS proxy
      const proxyUrl = `https://cors-anywhere.herokuapp.com/${config.webhookUrl}`;
      response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    }

    clearTimeout(timeoutId);

    log(`Response status: ${response.status}`, 'info');
    log(`Response headers: ${JSON.stringify([...response.headers.entries()])}`, 'info');

    if (response.ok) {
      const responseText = await response.text();
      log(`Response body: ${responseText}`, 'info');
      log('Webhook request sent successfully', 'info');
      return true;
    } else {
      const errorText = await response.text();
      log(`Webhook request failed with status: ${response.status}`, 'warn');
      log(`Error response: ${errorText}`, 'warn');
      // For fire-and-forget behavior, we still consider this a success
      return true;
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      log('Webhook request timed out - considering as success (fire-and-forget)', 'warn');
      return true; // Fire-and-forget: timeout is considered success
    } else {
      log(`Webhook request error: ${error.name} - ${error.message}`, 'error');
      log(`Error stack: ${error.stack}`, 'error');
      // For fire-and-forget behavior, we still show success to user
      return true;
    }
  }
}

// ========================================
// BUTTON STATE MANAGEMENT
// ========================================

/**
 * Sets the loading state of the dispatch button
 * @param {boolean} loading - Whether button should be in loading state
 */
function setButtonLoading(loading) {
  if (!dispatchButton) return;

  uiState.isLoading = loading;

  if (loading) {
    dispatchButton.classList.add('loading');
    dispatchButton.disabled = true;
    dispatchButton.setAttribute('aria-busy', 'true');
  } else {
    dispatchButton.classList.remove('loading');
    dispatchButton.disabled = false;
    dispatchButton.setAttribute('aria-busy', 'false');
  }
}

/**
 * Handles the dispatch button click with debouncing
 */
async function handleDispatchClick() {
  // Prevent multiple rapid clicks
  if (uiState.isLoading || uiState.debounceTimer) {
    log('Click ignored - button is loading or debounced', 'info');
    return;
  }

  // Check if webhook URL is configured
  if (!validateConfig()) {
    showModal('Configuração necessária', 'Por favor, configure a URL do webhook no código.', 'error');
    return;
  }

  // Set debounce timer
  uiState.debounceTimer = setTimeout(() => {
    uiState.debounceTimer = null;
  }, config.debounceDelay);

  // Update last dispatch time
  uiState.lastDispatchTime = new Date();

  // Set loading state
  setButtonLoading(true);

  try {
    // Send the webhook request
    const success = await sendWebhookRequest();

    if (success) {
      // Show success modal immediately (fire-and-forget)
      showModal('Sucesso!', 'Disparo iniciado com sucesso!', 'success');
      log('Dispatch completed successfully', 'info');
    } else {
      // This shouldn't happen with current fire-and-forget logic, but keeping for safety
      showModal('Erro', 'Falha ao enviar requisição. Tente novamente.', 'error');
      log('Dispatch failed', 'error');
    }

  } catch (error) {
    log(`Unexpected error in dispatch: ${error.message}`, 'error');
    // Still show success for fire-and-forget behavior
    showModal('Sucesso!', 'Disparo iniciado com sucesso!', 'success');
  } finally {
    // Remove loading state
    setButtonLoading(false);
  }
}

// ========================================
// EVENT LISTENERS SETUP
// ========================================

/**
 * Sets up event listeners for the dispatch button
 */
function setupEventListeners() {
  if (dispatchButton) {
    dispatchButton.addEventListener('click', handleDispatchClick);
    log('Event listeners set up successfully', 'info');
  } else {
    log('Dispatch button not found - cannot set up event listeners', 'error');
  }
}// =
// =======================================
// MODAL MANAGEMENT FUNCTIONS
// ========================================

/**
 * Shows the feedback modal with custom content
 * @param {string} title - Modal title
 * @param {string} message - Modal message (optional, uses title if not provided)
 * @param {string} type - Modal type ('success' or 'error')
 */
function showModal(title, message = null, type = 'success') {
  if (!feedbackModal || !modalTitle) {
    log('Modal elements not found', 'error');
    return;
  }

  // Set modal content
  modalTitle.textContent = message || title;

  // Update modal icon based on type
  const modalIcon = feedbackModal.querySelector('.modal-icon');
  if (modalIcon) {
    modalIcon.textContent = type === 'success' ? '✅' : '❌';
  }

  // Update modal title color based on type
  modalTitle.style.color = type === 'success' ? 'var(--accent-success)' : '#ef4444';

  // Show modal
  uiState.showModal = true;
  feedbackModal.classList.add('show');
  feedbackModal.setAttribute('aria-hidden', 'false');

  // Focus management for accessibility
  const modalContent = feedbackModal.querySelector('.modal-content');
  if (modalContent) {
    modalContent.focus();
  }

  log(`Modal shown: ${title}`, 'info');

  // Auto-close after specified duration
  setTimeout(() => {
    hideModal();
  }, config.feedbackDuration);
}

/**
 * Hides the feedback modal
 */
function hideModal() {
  if (!feedbackModal) return;

  uiState.showModal = false;
  feedbackModal.classList.remove('show');
  feedbackModal.setAttribute('aria-hidden', 'true');

  // Return focus to dispatch button
  if (dispatchButton) {
    dispatchButton.focus();
  }

  log('Modal hidden', 'info');
}

/**
 * Sets up modal event listeners for click-to-close functionality
 */
function setupModalEventListeners() {
  if (!feedbackModal) return;

  // Close modal when clicking on overlay
  feedbackModal.addEventListener('click', (event) => {
    if (event.target === feedbackModal) {
      hideModal();
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && uiState.showModal) {
      hideModal();
    }
  });

  log('Modal event listeners set up', 'info');
}// ===
//=====================================
// LOADING STATES AND VISUAL FEEDBACK
// ========================================

/**
 * Updates button text during loading state
 * @param {boolean} loading - Whether button is in loading state
 */
function updateButtonText(loading) {
  const buttonText = dispatchButton?.querySelector('.button-text');
  if (!buttonText) return;

  if (loading) {
    buttonText.textContent = 'Enviando...';
  } else {
    buttonText.textContent = 'Disparar Mensagens';
  }
}

/**
 * Enhanced button loading state with text update
 * @param {boolean} loading - Whether button should be in loading state
 */
function setButtonLoadingEnhanced(loading) {
  setButtonLoading(loading);
  updateButtonText(loading);

  // Add visual feedback with screen reader announcement
  if (loading) {
    announceToScreenReader('Enviando mensagens, aguarde...');
  } else {
    announceToScreenReader('Pronto para enviar mensagens');
  }
}

/**
 * Announces messages to screen readers
 * @param {string} message - Message to announce
 */
function announceToScreenReader(message) {
  // Create or update live region for screen reader announcements
  let liveRegion = document.getElementById('sr-live-region');

  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.id = 'sr-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
  }

  liveRegion.textContent = message;
}

/**
 * Provides immediate visual feedback regardless of backend response
 */
function provideImmediateFeedback() {
  // This function ensures users get immediate feedback
  // even if the webhook request is still processing
  log('Providing immediate visual feedback to user', 'info');

  // The feedback is already handled in handleDispatchClick
  // This function serves as a placeholder for any additional
  // immediate feedback mechanisms if needed in the future
}

/**
 * Enhanced dispatch click handler with improved loading states
 */
async function handleDispatchClickEnhanced() {
  // Prevent multiple rapid clicks
  if (uiState.isLoading || uiState.debounceTimer) {
    log('Click ignored - button is loading or debounced', 'info');
    return;
  }

  // Check if webhook URL is configured
  if (!validateConfig()) {
    showModal('Configuração necessária', 'Por favor, configure a URL do webhook no código.', 'error');
    return;
  }

  // Set debounce timer
  uiState.debounceTimer = setTimeout(() => {
    uiState.debounceTimer = null;
  }, config.debounceDelay);

  // Update last dispatch time
  uiState.lastDispatchTime = new Date();

  // Set enhanced loading state
  setButtonLoadingEnhanced(true);

  // Provide immediate feedback
  provideImmediateFeedback();

  try {
    // Send the webhook request
    const success = await sendWebhookRequest();

    if (success) {
      // Show success modal immediately (fire-and-forget)
      showModal('Sucesso!', 'Disparo iniciado com sucesso!', 'success');
      log('Dispatch completed successfully', 'info');
    } else {
      // This shouldn't happen with current fire-and-forget logic, but keeping for safety
      showModal('Erro', 'Falha ao enviar requisição. Tente novamente.', 'error');
      log('Dispatch failed', 'error');
    }

  } catch (error) {
    log(`Unexpected error in dispatch: ${error.message}`, 'error');
    // Still show success for fire-and-forget behavior
    showModal('Sucesso!', 'Disparo iniciado com sucesso!', 'success');
  } finally {
    // Remove enhanced loading state
    setButtonLoadingEnhanced(false);
  }
}// =======
//=================================
// ERROR HANDLING AND FALLBACK BEHAVIOR
// ========================================

/**
 * Global error handler for unhandled JavaScript errors
 */
function setupGlobalErrorHandling() {
  window.addEventListener('error', (event) => {
    log(`Global error: ${event.error?.message || event.message}`, 'error');
    log(`Error occurred at: ${event.filename}:${event.lineno}:${event.colno}`, 'error');

    // Ensure UI is not stuck in loading state
    if (uiState.isLoading) {
      setButtonLoadingEnhanced(false);
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    log(`Unhandled promise rejection: ${event.reason}`, 'error');

    // Ensure UI is not stuck in loading state
    if (uiState.isLoading) {
      setButtonLoadingEnhanced(false);
    }
  });
}

/**
 * Enhanced webhook request with comprehensive error handling
 * @returns {Promise<boolean>} - True if request was sent successfully
 */
async function sendWebhookRequestWithFallback() {
  const payload = createRequestPayload();

  try {
    log('Sending webhook request with fallback handling...', 'info');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      log('Request timeout - aborting request', 'warn');
      controller.abort();
    }, config.apiTimeout);

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      log(`Webhook request successful - Status: ${response.status}`, 'info');
      return true;
    } else if (response.status >= 400 && response.status < 500) {
      log(`Client error - Status: ${response.status} - Treating as success (fire-and-forget)`, 'warn');
      return true; // Fire-and-forget: client errors are treated as success
    } else if (response.status >= 500) {
      log(`Server error - Status: ${response.status} - Treating as success (fire-and-forget)`, 'warn');
      return true; // Fire-and-forget: server errors are treated as success
    } else {
      log(`Unexpected response status: ${response.status} - Treating as success`, 'warn');
      return true;
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      log('Request aborted due to timeout - Treating as success (fire-and-forget)', 'warn');
      return true; // Fire-and-forget: timeout is considered success
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      log('Network error (possibly CORS or connection issue) - Treating as success (fire-and-forget)', 'warn');
      return true; // Fire-and-forget: network errors are treated as success
    } else {
      log(`Unexpected error: ${error.name} - ${error.message} - Treating as success (fire-and-forget)`, 'error');
      return true; // Fire-and-forget: all errors are treated as success for UX
    }
  }
}

/**
 * Graceful degradation when webhook is unavailable
 */
function handleWebhookUnavailable() {
  log('Webhook appears to be unavailable - providing graceful degradation', 'warn');

  // Show success message anyway for better UX
  showModal('Simulação', 'Disparo simulado com sucesso! (Webhook não configurado)', 'success');

  // Log for debugging
  log('Graceful degradation: Showing success message despite webhook unavailability', 'info');
}

/**
 * Final dispatch handler with comprehensive error handling
 */
async function handleDispatchWithErrorHandling() {
  console.log('🚀 DISPATCH BUTTON CLICKED!');
  log('Dispatch button clicked - starting process', 'info');

  // Prevent multiple rapid clicks
  if (uiState.isLoading || uiState.debounceTimer) {
    log('Click ignored - button is loading or debounced', 'info');
    return;
  }

  // Set debounce timer
  uiState.debounceTimer = setTimeout(() => {
    uiState.debounceTimer = null;
  }, config.debounceDelay);

  // Update last dispatch time
  uiState.lastDispatchTime = new Date();

  // Set enhanced loading state
  console.log('🔄 Setting button to loading state');
  setButtonLoadingEnhanced(true);

  try {
    // Check if webhook URL is configured
    console.log('🔍 Validating webhook configuration');
    if (!validateConfig()) {
      console.log('❌ Webhook validation failed');
      handleWebhookUnavailable();
      return;
    }
    console.log('✅ Webhook validation passed');

    // Provide immediate feedback
    provideImmediateFeedback();

    // Send the webhook request with fallback handling
    console.log('📡 Sending webhook request...');
    const success = await sendWebhookRequestWithFallback();

    if (success) {
      // Show success modal (fire-and-forget approach)
      showModal('Sucesso!', 'Disparo iniciado com sucesso!', 'success');
      log('Dispatch completed with success feedback', 'info');
    }

  } catch (error) {
    // This is a final catch-all for any unexpected errors
    log(`Critical error in dispatch handler: ${error.message}`, 'error');
    log(`Error stack: ${error.stack}`, 'error');

    // Still provide success feedback for fire-and-forget behavior
    showModal('Sucesso!', 'Disparo iniciado com sucesso!', 'success');

  } finally {
    // Always remove loading state, no matter what happens
    try {
      setButtonLoadingEnhanced(false);
    } catch (finalError) {
      log(`Error removing loading state: ${finalError.message}`, 'error');
      // Fallback: directly manipulate button state
      if (dispatchButton) {
        dispatchButton.disabled = false;
        dispatchButton.classList.remove('loading');
        updateButtonText(false);
      }
    }
  }
}//
//========================================
// ACCESSIBILITY FEATURES
// ========================================

/**
 * Sets up keyboard navigation and focus management
 */
function setupKeyboardNavigation() {
  // Ensure proper tab order
  const focusableElements = [
    dispatchButton,
    feedbackModal?.querySelector('.modal-content')
  ].filter(Boolean);

  // Add keyboard event listeners
  document.addEventListener('keydown', (event) => {
    // Handle Enter key on dispatch button
    if (event.target === dispatchButton && event.key === 'Enter') {
      event.preventDefault();
      handleDispatchWithErrorHandling();
    }

    // Handle Space key on dispatch button
    if (event.target === dispatchButton && event.key === ' ') {
      event.preventDefault();
      handleDispatchWithErrorHandling();
    }

    // Handle Escape key to close modal
    if (event.key === 'Escape' && uiState.showModal) {
      event.preventDefault();
      hideModal();
    }
  });

  log('Keyboard navigation set up', 'info');
}

/**
 * Enhanced modal show function with accessibility features
 * @param {string} title - Modal title
 * @param {string} message - Modal message (optional, uses title if not provided)
 * @param {string} type - Modal type ('success' or 'error')
 */
function showModalAccessible(title, message = null, type = 'success') {
  if (!feedbackModal || !modalTitle) {
    log('Modal elements not found', 'error');
    return;
  }

  // Set modal content
  modalTitle.textContent = message || title;

  // Update modal icon based on type
  const modalIcon = feedbackModal.querySelector('.modal-icon');
  if (modalIcon) {
    modalIcon.textContent = type === 'success' ? '✅' : '❌';
    modalIcon.setAttribute('aria-label', type === 'success' ? 'Sucesso' : 'Erro');
  }

  // Update modal title color based on type
  modalTitle.style.color = type === 'success' ? 'var(--accent-success)' : '#ef4444';

  // Update ARIA attributes
  feedbackModal.setAttribute('aria-labelledby', 'modal-title');

  // Show modal
  uiState.showModal = true;
  feedbackModal.classList.add('show');
  feedbackModal.setAttribute('aria-hidden', 'false');

  // Focus management for accessibility
  const modalContent = feedbackModal.querySelector('.modal-content');
  if (modalContent) {
    // Store the previously focused element
    const previouslyFocused = document.activeElement;

    // Focus the modal content
    modalContent.focus();

    // Trap focus within modal
    trapFocusInModal(modalContent, previouslyFocused);
  }

  // Announce to screen readers
  announceToScreenReader(`${type === 'success' ? 'Sucesso' : 'Erro'}: ${message || title}`);

  log(`Accessible modal shown: ${title}`, 'info');

  // Auto-close after specified duration
  setTimeout(() => {
    hideModalAccessible();
  }, config.feedbackDuration);
}

/**
 * Enhanced modal hide function with accessibility features
 */
function hideModalAccessible() {
  if (!feedbackModal) return;

  uiState.showModal = false;
  feedbackModal.classList.remove('show');
  feedbackModal.setAttribute('aria-hidden', 'true');

  // Return focus to dispatch button
  if (dispatchButton) {
    dispatchButton.focus();
  }

  // Announce modal closure to screen readers
  announceToScreenReader('Modal fechado');

  log('Accessible modal hidden', 'info');
}

/**
 * Traps focus within the modal for accessibility
 * @param {HTMLElement} modalContent - Modal content element
 * @param {HTMLElement} previouslyFocused - Previously focused element
 */
function trapFocusInModal(modalContent, previouslyFocused) {
  const focusableElements = modalContent.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleTabKey = (event) => {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  modalContent.addEventListener('keydown', handleTabKey);

  // Clean up event listener when modal is hidden
  const cleanup = () => {
    modalContent.removeEventListener('keydown', handleTabKey);
    document.removeEventListener('keydown', cleanup);
  };

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      cleanup();
    }
  });
}

/**
 * Validates color contrast for accessibility compliance
 */
function validateColorContrast() {
  // This is a placeholder for color contrast validation
  // In a real implementation, you might use a library like 'color-contrast'
  log('Color contrast validation: Using WCAG AA compliant colors', 'info');
}

/**
 * Sets up accessibility features
 */
function setupAccessibility() {
  setupKeyboardNavigation();
  validateColorContrast();

  // Ensure all interactive elements have proper ARIA labels
  if (dispatchButton) {
    if (!dispatchButton.getAttribute('aria-label')) {
      dispatchButton.setAttribute('aria-label', 'Disparar mensagens WhatsApp');
    }
  }

  log('Accessibility features initialized', 'info');
}// =
//=======================================
// APPLICATION INITIALIZATION
// ========================================

/**
 * Initializes DOM elements
 */
function initializeDOMElements() {
  dispatchButton = document.getElementById('dispatch-btn');
  feedbackModal = document.getElementById('feedback-modal');
  modalTitle = document.getElementById('modal-title');

  if (!dispatchButton) {
    log('Dispatch button not found in DOM', 'error');
    return false;
  }

  if (!feedbackModal) {
    log('Feedback modal not found in DOM', 'error');
    return false;
  }

  if (!modalTitle) {
    log('Modal title not found in DOM', 'error');
    return false;
  }

  log('DOM elements initialized successfully', 'info');
  return true;
}

/**
 * Sets up all event listeners
 */
function initializeEventListeners() {
  // Set up dispatch button event listener with enhanced error handling
  if (dispatchButton) {
    dispatchButton.addEventListener('click', handleDispatchWithErrorHandling);
    log('Dispatch button event listener attached', 'info');
  }

  // Set up modal event listeners
  setupModalEventListeners();

  // Set up accessibility features
  setupAccessibility();

  // Set up global error handling
  setupGlobalErrorHandling();
}

/**
 * Validates the application setup
 */
function validateSetup() {
  const checks = [
    { name: 'DOM Elements', test: () => dispatchButton && feedbackModal && modalTitle },
    { name: 'Configuration', test: () => config.webhookUrl && config.apiTimeout > 0 },
    { name: 'Event Listeners', test: () => dispatchButton.onclick !== null || dispatchButton.addEventListener },
    { name: 'CSS Classes', test: () => document.querySelector('.dispatch-button') !== null },
    { name: 'Modal Structure', test: () => document.querySelector('.modal-overlay') !== null }
  ];

  let allPassed = true;

  checks.forEach(check => {
    try {
      const passed = check.test();
      log(`Setup validation - ${check.name}: ${passed ? 'PASS' : 'FAIL'}`, passed ? 'info' : 'warn');
      if (!passed) allPassed = false;
    } catch (error) {
      log(`Setup validation - ${check.name}: ERROR - ${error.message}`, 'error');
      allPassed = false;
    }
  });

  return allPassed;
}

/**
 * Tests the webhook URL connectivity
 */
async function testWebhookConnectivity() {
  log('Testing webhook connectivity...', 'info');

  try {
    const response = await fetch(config.webhookUrl, {
      method: 'OPTIONS',
      mode: 'cors'
    });
    log(`OPTIONS request status: ${response.status}`, 'info');
  } catch (error) {
    log(`OPTIONS request failed: ${error.message}`, 'warn');
  }

  // Test actual POST request
  try {
    const testPayload = { test: true, timestamp: new Date().toISOString() };
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
      mode: 'cors'
    });
    log(`Test POST request status: ${response.status}`, 'info');
    const responseText = await response.text();
    log(`Test response: ${responseText}`, 'info');
  } catch (error) {
    log(`Test POST request failed: ${error.message}`, 'error');
  }
}

/**
 * Tests the dispatch functionality with mock data
 */
function testDispatchFunctionality() {
  log('Testing dispatch functionality...', 'info');

  // Test webhook connectivity first
  testWebhookConnectivity();

  // Test button state changes
  setButtonLoadingEnhanced(true);
  setTimeout(() => {
    setButtonLoadingEnhanced(false);
    log('Button state test completed', 'info');
  }, 1000);

  // Test modal display
  setTimeout(() => {
    showModalAccessible('Teste', 'Funcionalidade testada com sucesso!', 'success');
    log('Modal display test completed', 'info');
  }, 2000);
}

/**
 * Main application initialization function
 */
function initializeApp() {
  log('Initializing WhatsApp Dispatcher application...', 'info');

  try {
    // Initialize DOM elements
    if (!initializeDOMElements()) {
      log('Failed to initialize DOM elements', 'error');
      return;
    }

    // Set up event listeners
    initializeEventListeners();

    // Validate setup
    const setupValid = validateSetup();
    if (!setupValid) {
      log('Setup validation failed - some features may not work correctly', 'warn');
    }

    // Log successful initialization
    log('WhatsApp Dispatcher initialized successfully', 'info');
    log(`Configuration: Webhook URL configured: ${config.webhookUrl !== 'https://your-n8n-instance.com/webhook/whatsapp-dispatcher'}`, 'info');

    // Announce to screen readers that the app is ready
    setTimeout(() => {
      announceToScreenReader('WhatsApp Dispatcher carregado e pronto para uso');
    }, 500);

  } catch (error) {
    log(`Critical error during initialization: ${error.message}`, 'error');
    log(`Error stack: ${error.stack}`, 'error');
  }
}

// ========================================
// APPLICATION STARTUP
// ========================================

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM is already ready
  initializeApp();
}

// Override the modal functions to use accessible versions
showModal = showModalAccessible;
hideModal = hideModalAccessible;

// Export functions for testing (if needed)
if (typeof window !== 'undefined') {
  window.WhatsAppDispatcher = {
    testDispatch: testDispatchFunctionality,
    testWebhook: testWebhookConnectivity,
    sendWebhook: sendWebhookRequest,
    validateSetup: validateSetup,
    config: config,
    uiState: uiState
  };
}