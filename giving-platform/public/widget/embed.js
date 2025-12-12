(function() {
  'use strict';

  // DonorX Widget Embed Script
  var DonorXWidget = window.DonorXWidget || {};

  // Configuration
  var BASE_URL = 'https://donor-x.vercel.app';

  // Default styles for the iframe container
  var defaultStyles = {
    width: '100%',
    maxWidth: '400px',
    minHeight: '500px',
    border: 'none',
    borderRadius: '12px',
    overflow: 'hidden'
  };

  /**
   * Initialize a DonorX donation widget
   * @param {Object} options - Configuration options
   * @param {string} options.token - The widget token (required)
   * @param {string} options.container - Container element ID (default: 'donorx-widget')
   * @param {string} options.width - Widget width (default: '100%')
   * @param {string} options.maxWidth - Widget max width (default: '400px')
   * @param {string} options.height - Widget min height (default: '500px')
   */
  DonorXWidget.init = function(options) {
    if (!options || !options.token) {
      console.error('DonorX Widget: token is required');
      return;
    }

    var containerId = options.container || 'donorx-widget';
    var container = document.getElementById(containerId);

    if (!container) {
      console.error('DonorX Widget: Container element not found: ' + containerId);
      return;
    }

    // Create iframe
    var iframe = document.createElement('iframe');
    iframe.src = BASE_URL + '/widget/' + options.token;
    iframe.title = 'Donate with DonorX';
    iframe.allow = 'payment';

    // Apply styles
    iframe.style.width = options.width || defaultStyles.width;
    iframe.style.maxWidth = options.maxWidth || defaultStyles.maxWidth;
    iframe.style.minHeight = options.height || defaultStyles.minHeight;
    iframe.style.border = defaultStyles.border;
    iframe.style.borderRadius = defaultStyles.borderRadius;
    iframe.style.overflow = defaultStyles.overflow;
    iframe.style.display = 'block';
    iframe.style.margin = '0 auto';

    // Add loading state
    container.innerHTML = '';
    container.style.position = 'relative';

    var loader = document.createElement('div');
    loader.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:200px;color:#64748b;">Loading donation form...</div>';
    container.appendChild(loader);

    // Handle iframe load
    iframe.onload = function() {
      if (loader.parentNode) {
        loader.parentNode.removeChild(loader);
      }
    };

    container.appendChild(iframe);
  };

  /**
   * Create a donation button that opens the widget in a modal
   * @param {Object} options - Configuration options
   * @param {string} options.token - The widget token (required)
   * @param {string} options.buttonText - Button text (default: 'Donate')
   * @param {string} options.buttonColor - Button background color (default: '#059669')
   * @param {string} options.container - Container element ID for the button
   */
  DonorXWidget.button = function(options) {
    if (!options || !options.token) {
      console.error('DonorX Widget: token is required');
      return;
    }

    var containerId = options.container || 'donorx-button';
    var container = document.getElementById(containerId);

    if (!container) {
      console.error('DonorX Widget: Container element not found: ' + containerId);
      return;
    }

    var buttonColor = options.buttonColor || '#059669';
    var buttonText = options.buttonText || 'Donate';

    // Create button
    var button = document.createElement('button');
    button.innerHTML = '❤️ ' + buttonText;
    button.style.cssText = 'background-color:' + buttonColor + ';color:white;border:none;padding:12px 24px;font-size:16px;font-weight:600;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;transition:opacity 0.2s;';

    button.onmouseover = function() { this.style.opacity = '0.9'; };
    button.onmouseout = function() { this.style.opacity = '1'; };

    button.onclick = function() {
      DonorXWidget.openModal(options.token);
    };

    container.appendChild(button);
  };

  /**
   * Open the widget in a modal overlay
   * @param {string} token - The widget token
   */
  DonorXWidget.openModal = function(token) {
    // Create modal overlay
    var overlay = document.createElement('div');
    overlay.id = 'donorx-modal-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:999999;padding:20px;';

    // Create modal container
    var modal = document.createElement('div');
    modal.style.cssText = 'background:white;border-radius:16px;max-width:420px;width:100%;max-height:90vh;overflow:auto;position:relative;';

    // Close button
    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = 'position:absolute;top:8px;right:8px;background:none;border:none;font-size:24px;cursor:pointer;color:#64748b;z-index:10;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:50%;';
    closeBtn.onmouseover = function() { this.style.background = '#f1f5f9'; };
    closeBtn.onmouseout = function() { this.style.background = 'none'; };
    closeBtn.onclick = function() {
      DonorXWidget.closeModal();
    };

    // Create iframe
    var iframe = document.createElement('iframe');
    iframe.src = BASE_URL + '/widget/' + token;
    iframe.title = 'Donate with DonorX';
    iframe.allow = 'payment';
    iframe.style.cssText = 'width:100%;min-height:520px;border:none;display:block;';

    modal.appendChild(closeBtn);
    modal.appendChild(iframe);
    overlay.appendChild(modal);

    // Close on overlay click
    overlay.onclick = function(e) {
      if (e.target === overlay) {
        DonorXWidget.closeModal();
      }
    };

    // Close on escape key
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        DonorXWidget.closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    });

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
  };

  /**
   * Close the modal
   */
  DonorXWidget.closeModal = function() {
    var overlay = document.getElementById('donorx-modal-overlay');
    if (overlay) {
      overlay.parentNode.removeChild(overlay);
      document.body.style.overflow = '';
    }
  };

  // Expose to global scope
  window.DonorXWidget = DonorXWidget;

  // Auto-initialize if data attributes present
  document.addEventListener('DOMContentLoaded', function() {
    var autoWidgets = document.querySelectorAll('[data-donorx-token]');
    autoWidgets.forEach(function(el) {
      var token = el.getAttribute('data-donorx-token');
      var mode = el.getAttribute('data-donorx-mode') || 'inline';

      if (mode === 'button') {
        DonorXWidget.button({
          token: token,
          container: el.id,
          buttonText: el.getAttribute('data-donorx-text'),
          buttonColor: el.getAttribute('data-donorx-color')
        });
      } else {
        DonorXWidget.init({
          token: token,
          container: el.id
        });
      }
    });
  });
})();
