(function (window, document) {
  const CONSENT_KEY = 'tracking_consent';
  const CONSENT_EVENT_LISTENERS = new Set();

  function hasConsent() {
    try {
      return window.localStorage.getItem(CONSENT_KEY) === 'true';
    } catch (error) {
      console.warn('Unable to read consent from storage', error);
      return false;
    }
  }

  function storeConsent(value) {
    try {
      window.localStorage.setItem(CONSENT_KEY, value ? 'true' : 'false');
    } catch (error) {
      console.warn('Unable to persist consent choice', error);
    }
  }

  function notifyConsentListeners() {
    const consentGranted = hasConsent();
    CONSENT_EVENT_LISTENERS.forEach((listener) => {
      try {
        listener(consentGranted);
      } catch (error) {
        console.error('Consent listener failed', error);
      }
    });
  }

  function setConsent(granted) {
    storeConsent(granted);
    notifyConsentListeners();
  }

  function onConsent(listener) {
    if (typeof listener !== 'function') {
      return function noop() {};
    }

    CONSENT_EVENT_LISTENERS.add(listener);

    if (hasConsent()) {
      listener(true);
    }

    return function unsubscribe() {
      CONSENT_EVENT_LISTENERS.delete(listener);
    };
  }

  function removeExistingBanner() {
    const existingBanner = document.getElementById('consent-banner');
    if (existingBanner) {
      existingBanner.remove();
    }
  }

  function buildBanner() {
    const banner = document.createElement('div');
    banner.id = 'consent-banner';
    banner.className = 'consent-banner';

    const message = document.createElement('span');
    message.className = 'consent-message';
    message.textContent = 'We use cookies to measure ads on Facebook.';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-primary';
    button.textContent = 'Accept';
    button.addEventListener('click', () => {
      setConsent(true);
      banner.remove();
    });

    banner.appendChild(message);
    banner.appendChild(button);

    return banner;
  }

  function ensureBanner() {
    if (hasConsent()) {
      removeExistingBanner();
      return;
    }

    if (document.getElementById('consent-banner')) {
      return;
    }

    const banner = buildBanner();
    document.body.appendChild(banner);
  }

  window.PartTradeConsent = {
    hasConsent,
    setConsent,
    onConsent,
    ensureBanner,
  };
})(window, document);
