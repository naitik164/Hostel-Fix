import React, { useEffect, useRef, useState } from 'react';

/**
 * Singleton script loader for official Google Identity Services (GIS)
 * Ensures https://accounts.google.com/gsi/client is loaded exactly once.
 */
let gsiScriptPromise = null;

const loadGoogleGsiScript = () => {
  if (typeof window === 'undefined') return Promise.resolve(false);

  // If already loaded and initialized on window
  if (window.google?.accounts?.id) {
    return Promise.resolve(true);
  }

  if (gsiScriptPromise) {
    return gsiScriptPromise;
  }

  gsiScriptPromise = new Promise((resolve) => {
    // Check if script tag already exists in DOM
    const existingScript = document.getElementById('google-identity-services-script');
    if (existingScript) {
      if (window.google?.accounts?.id) {
        resolve(true);
        return;
      }
      existingScript.addEventListener('load', () => resolve(true), { once: true });
      existingScript.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    // Create and inject official GIS script
    const script = document.createElement('script');
    script.id = 'google-identity-services-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;

    script.onload = () => {
      resolve(true);
    };

    script.onerror = (err) => {
      console.error('[GoogleSignInButton] Failed to load Google Identity Services SDK:', err);
      gsiScriptPromise = null;
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return gsiScriptPromise;
};

/**
 * GoogleSignInButton — Dedicated, secure component for Google Identity Services.
 *
 * Implements Google Identity Services via google.accounts.id.renderButton().
 * - Uses a React ref to mount into an empty DOM container.
 * - Never renders Google HTML as React text strings or through dangerouslySetInnerHTML.
 * - Prevents duplicate initialization and duplicate button rendering.
 * - Cleans up on unmount or remount.
 */
const GoogleSignInButton = ({
  clientId,
  onSuccess,
  onError,
  theme = 'filled_blue',
  size = 'large',
  shape = 'pill',
  text = 'continue_with',
  width,
  logoAlignment = 'left',
  useOneTap = false,
  className = '',
}) => {
  const buttonContainerRef = useRef(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [initError, setInitError] = useState(null);

  // Stable references for callbacks to prevent re-initializing on callback recreation
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Load GIS Script
  useEffect(() => {
    let isCancelled = false;

    loadGoogleGsiScript().then((loaded) => {
      if (isCancelled) return;
      if (loaded && window.google?.accounts?.id) {
        setSdkReady(true);
      } else {
        const err = new Error('Google Identity Services SDK could not be loaded.');
        setInitError(err);
        onErrorRef.current?.(err);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Initialize GIS and Render the Button
  useEffect(() => {
    if (!sdkReady || !buttonContainerRef.current || !clientId) return;

    const container = buttonContainerRef.current;
    let isMounted = true;

    try {
      // 1. Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (credentialResponse) => {
          if (!isMounted) return;
          if (!credentialResponse?.credential) {
            onErrorRef.current?.(new Error('Google authentication returned no credential token.'));
            return;
          }
          onSuccessRef.current?.(credentialResponse);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // 2. Clear any prior children before rendering to ensure exactly ONE button exists
      container.innerHTML = '';

      // 3. Render the official Google Sign-In button into the empty DOM container
      const renderOptions = {
        theme,
        size,
        shape,
        text,
        logo_alignment: logoAlignment,
      };

      if (width) {
        renderOptions.width = width;
      }

      window.google.accounts.id.renderButton(container, renderOptions);

      // 4. Optionally prompt One-Tap
      if (useOneTap) {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            console.debug('[GoogleSignInButton] OneTap prompt not displayed:', notification.getNotDisplayedReason());
          } else if (notification.isSkippedMoment()) {
            console.debug('[GoogleSignInButton] OneTap prompt skipped:', notification.getSkippedReason());
          }
        });
      }
    } catch (err) {
      console.error('[GoogleSignInButton] Error initializing or rendering Google button:', err);
      setInitError(err);
      onErrorRef.current?.(err);
    }

    // Cleanup when component unmounts or reconfigures
    return () => {
      isMounted = false;
      if (useOneTap && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch (_) {
          // Ignore cancellation errors during unmount
        }
      }
    };
  }, [sdkReady, clientId, theme, size, shape, text, width, logoAlignment, useOneTap]);

  if (initError) {
    return (
      <div className="w-full text-center p-2 rounded bg-rose-50 border border-rose-200 text-rose-600 text-xs">
        <span>Failed to initialize Google Sign-In.</span>
      </div>
    );
  }

  return (
    <div
      ref={buttonContainerRef}
      className={`google-signin-btn-container flex items-center justify-center min-h-[44px] w-full ${className}`}
      data-testid="google-signin-button-container"
    />
  );
};

export default GoogleSignInButton;
