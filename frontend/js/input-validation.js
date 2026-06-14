// ============================================
// Input Validation - Project Hub
// Enforces consistent input rules across all pages
// ============================================

(function () {
  'use strict';

  // --- Validation Rules ---
  const RULES = {
    // Letters, spaces, dots, hyphens only (names)
    nameOnly: {
      pattern: /^[a-zA-Z\s.\-']+$/,
      message: 'Only letters, spaces, dots and hyphens are allowed'
    },
    // Alphanumeric + spaces (general text labels)
    alphaSpace: {
      pattern: /^[a-zA-Z0-9\s.\-,/()]+$/,
      message: 'Only letters, numbers, spaces and basic punctuation allowed'
    },
    // GitHub username: alphanumeric + hyphens
    githubUsername: {
      pattern: /^[a-zA-Z0-9\-]+$/,
      message: 'Only letters, numbers and hyphens allowed for GitHub username'
    },
    // Search: letters, numbers, spaces, common symbols
    search: {
      pattern: /^[a-zA-Z0-9\s.\-_/#+]+$/,
      message: 'Only letters, numbers and common symbols allowed'
    },
    // Comment: anything printable, but no script tags
    safeText: {
      pattern: /^[^<>]*$/, // block < and > to prevent XSS
      message: 'Special characters < and > are not allowed'
    },
    // URL validation
    url: {
      pattern: /^(https?:\/\/)?[\w\-]+(\.[\w\-]+)+[/#?]?.*$/,
      message: 'Please enter a valid URL'
    }
  };

  // --- Field-to-Rule Mapping ---
  // Maps input IDs to their validation rules
  const FIELD_RULES = {
    // Search bars
    'searchBar': 'search',

    // Submit project form
    'customProjectType': 'alphaSpace',
    'timePeriod': 'alphaSpace',
    'supervisorName': 'nameOnly',
    'githubUsernameSearch': 'search',

    // Profile edit form
    'editUsername': 'alphaSpace',
    'editBio': 'safeText',
    'editLocation': 'nameOnly',

    // Comments
    'commentText': 'safeText'
  };

  // --- Error Display Helpers ---
  function showFieldError(input, message) {
    input.style.borderColor = '#f44336';
    input.style.boxShadow = '0 0 0 2px rgba(244, 67, 54, 0.2)';

    let errorEl = input.parentElement.querySelector('.field-error-msg');
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'field-error-msg';
      errorEl.style.cssText = 'color:#f44336;font-size:12px;margin-top:4px;font-weight:500;';
      input.parentElement.appendChild(errorEl);
    }
    errorEl.textContent = '⚠ ' + message;
  }

  function clearFieldError(input) {
    input.style.borderColor = '';
    input.style.boxShadow = '';

    const errorEl = input.parentElement.querySelector('.field-error-msg');
    if (errorEl) {
      errorEl.remove();
    }
  }

  // --- Core Validation ---
  function validateInput(input) {
    const ruleKey = FIELD_RULES[input.id];
    if (!ruleKey) return true;

    const rule = RULES[ruleKey];
    const value = input.value;

    // Allow empty (let HTML required handle that)
    if (value === '') {
      clearFieldError(input);
      return true;
    }

    if (!rule.pattern.test(value)) {
      showFieldError(input, rule.message);
      return false;
    }

    clearFieldError(input);
    return true;
  }

  // --- Attach Listeners on DOMContentLoaded ---
  document.addEventListener('DOMContentLoaded', function () {
    // Attach to all known fields that exist on this page
    for (const fieldId in FIELD_RULES) {
      const input = document.getElementById(fieldId);
      if (!input) continue;

      // Real-time validation on each keystroke
      input.addEventListener('input', function () {
        validateInput(this);
      });

      // Also validate on blur (leaving the field)
      input.addEventListener('blur', function () {
        validateInput(this);
      });

      // Block invalid paste
      input.addEventListener('paste', function (e) {
        setTimeout(() => validateInput(this), 10);
      });
    }

    // --- Block form submissions if validation fails ---
    const forms = document.querySelectorAll('form');
    forms.forEach(function (form) {
      form.addEventListener('submit', function (e) {
        let hasError = false;

        for (const fieldId in FIELD_RULES) {
          const input = document.getElementById(fieldId);
          if (!input || !form.contains(input)) continue;

          if (!validateInput(input)) {
            hasError = true;
            input.focus();
            break;
          }
        }

        if (hasError) {
          e.preventDefault();
          e.stopPropagation();
          if (typeof showNotification === 'function') {
            showNotification('Please fix the highlighted errors before submitting', 'error');
          }
        }
      });
    });
  });
})();
