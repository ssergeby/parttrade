(function (window, document) {
  const PIXEL_ID = window.META_PIXEL_ID;
  const COMPLETE_REG_KEY = 'parttrade_pixel_complete_registration';

  const state = {
    initialized: false,
    loading: false,
    pendingCommands: [],
  };

  function queueCommand(command) {
    if (state.initialized) {
      command();
    } else {
      state.pendingCommands.push(command);
    }
  }

  function flushQueue() {
    if (!state.initialized) {
      return;
    }
    while (state.pendingCommands.length > 0) {
      const command = state.pendingCommands.shift();
      try {
        command();
      } catch (error) {
        console.error('Pixel command failed', error);
      }
    }
  }

  function ensurePixelSnippet() {
    if (window.fbq) {
      return;
    }

    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  }

  async function hashEmail(email) {
    if (!email) {
      return null;
    }

    const normalised = email.trim().toLowerCase();
    if (!normalised) {
      return null;
    }

    if (!window.crypto || !window.crypto.subtle) {
      console.warn('Web Crypto API not available for hashing email.');
      return null;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(normalised);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  async function initPixel(options) {
    if (!PIXEL_ID) {
      console.warn('META_PIXEL_ID is not set; pixel will not be initialised.');
      return;
    }

    if (state.initialized || state.loading) {
      if (options && options.email) {
        updateAdvancedMatching(options.email);
      }
      return;
    }

    state.loading = true;
    ensurePixelSnippet();

    try {
      const hashedEmail = options && options.email ? await hashEmail(options.email) : null;
      const advancedMatching = hashedEmail ? { em: hashedEmail } : undefined;

      window.fbq('consent', 'grant');
      if (advancedMatching) {
        window.fbq('init', PIXEL_ID, advancedMatching);
      } else {
        window.fbq('init', PIXEL_ID);
      }

      window.fbq('set', 'autoConfig', true, PIXEL_ID);

      state.initialized = true;
      flushQueue();
    } finally {
      state.loading = false;
    }
  }

  async function updateAdvancedMatching(email) {
    if (!PIXEL_ID || !window.fbq) {
      return;
    }

    const hashedEmail = await hashEmail(email);
    if (!hashedEmail) {
      return;
    }

    window.fbq('init', PIXEL_ID, { em: hashedEmail });
  }

  function trackPageView(payload) {
    queueCommand(() => window.fbq('track', 'PageView', payload));
  }

  function trackCompleteRegistration(payload) {
    queueCommand(() => window.fbq('track', 'CompleteRegistration', payload));
  }

  function trackViewContent(payload) {
    queueCommand(() => window.fbq('track', 'ViewContent', payload));
  }

  function markCompleteRegistrationPending() {
    try {
      window.sessionStorage.setItem(COMPLETE_REG_KEY, 'true');
    } catch (error) {
      console.warn('Unable to persist registration tracking flag', error);
    }
  }

  function consumeCompleteRegistrationPending() {
    try {
      return window.sessionStorage.getItem(COMPLETE_REG_KEY) === 'true';
    } catch (error) {
      console.warn('Unable to read registration tracking flag', error);
      return false;
    }
  }

  function clearCompleteRegistrationPending() {
    try {
      window.sessionStorage.removeItem(COMPLETE_REG_KEY);
    } catch (error) {
      console.warn('Unable to clear registration tracking flag', error);
    }
  }

  window.PartTradePixel = {
    init: initPixel,
    trackPageView,
    trackCompleteRegistration,
    trackViewContent,
    updateAdvancedMatching,
    markCompleteRegistrationPending,
    consumeCompleteRegistrationPending,
    clearCompleteRegistrationPending,
  };
})(window, document);
