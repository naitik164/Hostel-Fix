/**
 * Trusted Types Policy Configuration for HostelFix
 * Defends against DOM-based Cross-Site Scripting (DOM XSS)
 * Conforms to W3C Trusted Types specification
 */
import DOMPurify from 'dompurify';

// Hook to ensure dynamic iframes are strictly restricted to Google Identity Services
if (typeof window !== 'undefined' && DOMPurify && typeof DOMPurify.addHook === 'function') {
  DOMPurify.addHook('uponSanitizeElement', (node, data) => {
    if (data.tagName === 'iframe') {
      const src = node.getAttribute('src');
      if (src && !src.startsWith('https://accounts.google.com/')) {
        node.remove();
      }
    }
  });
}

/**
 * Sanitizes untrusted HTML using DOMPurify.
 * Preserves safe structural markup (including Google Identity Services button markup)
 * while strictly stripping executable scripts, javascript: pseudo-protocols, and inline event handlers.
 */
export const sanitizeWithDOMPurify = (dirty) => {
  if (typeof dirty !== 'string') return '';
  if (!dirty.trim()) return '';
  return DOMPurify.sanitize(dirty, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'src', 'tabindex', 'role', 'aria-labelledby', 'aria-label', 'target'],
    RETURN_TRUSTED_TYPE: false,
  });
};

let appPolicy = null;
let defaultPolicy = null;

if (typeof window !== 'undefined' && window.trustedTypes && typeof window.trustedTypes.createPolicy === 'function') {
  try {
    // 1. Application-Specific Named Policy: hostelfix#policy
    if (!window.trustedTypes.getPolicyNames?.().includes('hostelfix#policy')) {
      appPolicy = window.trustedTypes.createPolicy('hostelfix#policy', {
        createHTML: (string) => {
          return sanitizeWithDOMPurify(string);
        },
        createScriptURL: (url) => {
          try {
            const parsed = new URL(url, window.location.origin);
            if (parsed.origin === window.location.origin) {
              return url;
            }
            if (parsed.origin === 'https://accounts.google.com' && parsed.pathname.startsWith('/gsi/')) {
              return url;
            }
          } catch {
            // URL parse error
          }
          throw new TypeError(`[TrustedTypes Block]: Blocked unauthorized script URL: ${url}`);
        },
        createScript: () => {
          throw new TypeError('[TrustedTypes Block]: Inline script evaluation is strictly prohibited.');
        },
      });
    }

    // 2. Default Fallback Policy for Third-Party Libraries (Google Identity Services, Vite)
    if (!window.trustedTypes.defaultPolicy && !window.trustedTypes.getPolicyNames?.().includes('default')) {
      defaultPolicy = window.trustedTypes.createPolicy('default', {
        createHTML: (string) => {
          return sanitizeWithDOMPurify(string);
        },
        createScriptURL: (url) => {
          try {
            const parsed = new URL(url, window.location.origin);
            // Allow same-origin scripts (Vite chunk preloads, dynamic route imports)
            if (parsed.origin === window.location.origin) {
              return url;
            }
            // Allow Google Identity Services OAuth SDK script injection
            if (parsed.origin === 'https://accounts.google.com' && parsed.pathname.startsWith('/gsi/')) {
              return url;
            }
          } catch {
            // URL parse failure
          }
          throw new TypeError(`[TrustedTypes Block]: Disallowed script URL injection: ${url}`);
        },
        createScript: () => {
          throw new TypeError('[TrustedTypes Block]: Dynamic string execution via script sinks is disabled.');
        },
      });
    }
  } catch (err) {
    // Policy creation error safeguard (e.g. if CSP disallows duplicate policies)
    console.warn('[TrustedTypes Notice]: Policy initialization note:', err.message);
  }
}

/**
 * Helper to safely sanitize untrusted strings into TrustedHTML
 */
export const sanitizeToHTML = (untrusted) => {
  if (appPolicy) {
    return appPolicy.createHTML(untrusted);
  }
  return sanitizeWithDOMPurify(untrusted);
};

export default {
  sanitizeToHTML,
  sanitizeWithDOMPurify,
  appPolicy,
  defaultPolicy,
};
