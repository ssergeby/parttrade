(function (window, document) {
  const ROUTE_HOME = '/';
  const ROUTE_PROFILE = '/profile';
  const ROUTE_CALLBACK = '/callback';

  const APP_ROOT_ID = 'app';
  const ALERT_BAR_ID = 'alert-bar';
  const COMPLETE_REG_PENDING = window.PartTradePixel
    ? window.PartTradePixel.consumeCompleteRegistrationPending()
    : false;

  let currentRoute = ROUTE_HOME;
  let pixelReady = false;
  let pendingCompleteRegistration = COMPLETE_REG_PENDING;
  let authState = {
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
  };

  function getAppRoot() {
    return document.getElementById(APP_ROOT_ID);
  }

  function renderAlert(message) {
    const alertBar = document.getElementById(ALERT_BAR_ID);
    if (!alertBar) {
      return;
    }

    if (!message) {
      alertBar.textContent = '';
      alertBar.classList.add('is-hidden');
      return;
    }

    alertBar.textContent = message;
    alertBar.classList.remove('is-hidden');
  }

  function toggleHidden(element, hidden) {
    if (!element) return;
    if (hidden) {
      element.classList.add('is-hidden');
    } else {
      element.classList.remove('is-hidden');
    }
  }

  function updateHeader(state) {
    const actionButton = document.getElementById('auth-action');
    const userAvatar = document.getElementById('user-avatar');
    const userName = document.getElementById('user-name');

    if (!actionButton) {
      return;
    }

    if (state.isLoading) {
      actionButton.textContent = 'Loading…';
      actionButton.dataset.action = 'idle';
      actionButton.disabled = true;
      toggleHidden(userAvatar, true);
      if (userName) {
        userName.textContent = '';
        toggleHidden(userName, true);
      }
      return;
    }

    actionButton.disabled = false;

    if (state.isAuthenticated) {
      actionButton.textContent = 'Logout';
      actionButton.dataset.action = 'logout';

      if (userAvatar) {
        userAvatar.src = state.user && state.user.picture ? state.user.picture : '';
        userAvatar.alt = state.user && state.user.name ? state.user.name : 'User avatar';
        toggleHidden(userAvatar, !(state.user && state.user.picture));
      }

      if (userName) {
        userName.textContent = state.user && state.user.name ? state.user.name : '';
        toggleHidden(userName, !(state.user && state.user.name));
      }
    } else {
      actionButton.textContent = 'Continue with Facebook';
      actionButton.dataset.action = 'login';

      toggleHidden(userAvatar, true);
      if (userAvatar) {
        userAvatar.src = '';
      }

      if (userName) {
        userName.textContent = '';
        toggleHidden(userName, true);
      }
    }
  }

  function bindHeaderActions() {
    const actionButton = document.getElementById('auth-action');
    if (!actionButton) {
      return;
    }

    actionButton.addEventListener('click', (event) => {
      const { action } = event.currentTarget.dataset;
      if (authState.isLoading) {
        return;
      }
      if (action === 'login') {
        window.PartTradeAuth.login();
      } else if (action === 'logout') {
        window.PartTradeAuth.logout();
      }
    });
  }

  function renderHome() {
    const root = getAppRoot();
    if (!root) {
      return;
    }

    root.innerHTML = `
      <section class="card hero">
        <div class="hero-content">
          <h1>Buy, Sell, Trade Auto Parts</h1>
          <p>PART.TRADE connects trusted suppliers and enthusiasts. Sign in with Facebook to manage your profile and preferences.</p>
          ${
            authState.isAuthenticated
              ? `<a class="btn btn-primary" data-nav="${ROUTE_PROFILE}" href="${ROUTE_PROFILE}">Go to Profile</a>`
              : `<button class="btn btn-primary" id="hero-login">Continue with Facebook</button>`
          }
        </div>
        <div class="hero-secondary">
          <h2>Why PART.TRADE?</h2>
          <ul class="feature-list">
            <li>Verified vendors and part histories</li>
            <li>Smart recommendations tailored to your vehicle</li>
            <li>Secure messaging and escrow options</li>
          </ul>
        </div>
      </section>
    `;

    const heroLoginButton = document.getElementById('hero-login');
    if (heroLoginButton) {
      heroLoginButton.addEventListener('click', () => {
        window.PartTradeAuth.login();
      });
    }
  }

  function renderProfile() {
    const root = getAppRoot();
    if (!root) {
      return;
    }

    if (authState.isLoading) {
      root.innerHTML = `
        <section class="card">
          <h1>Loading profile…</h1>
          <p>Please wait a moment.</p>
        </section>
      `;
      return;
    }

    if (!authState.isAuthenticated) {
      root.innerHTML = `
        <section class="card">
          <h1>Profile</h1>
          <p>You need to sign in with Facebook to view your profile.</p>
          <button class="btn btn-primary" id="profile-login">Continue with Facebook</button>
        </section>
      `;
      const profileLoginButton = document.getElementById('profile-login');
      if (profileLoginButton) {
        profileLoginButton.addEventListener('click', () => {
          window.PartTradeAuth.login();
        });
      }
      return;
    }

    const { user } = authState;
    const email = user && user.email ? user.email : 'Not provided';
    const picture = user && user.picture ? user.picture : '';
    const name = user && user.name ? user.name : 'Facebook User';

    root.innerHTML = `
      <section class="card profile-card">
        <div class="profile-header">
          ${
            picture
              ? `<img class="profile-avatar" src="${picture}" alt="${name}">`
              : `<div class="profile-avatar placeholder">${name.charAt(0)}</div>`
          }
          <div class="profile-meta">
            <h1>${name}</h1>
            <p>${email}</p>
          </div>
        </div>
        <div class="profile-body">
          <h2>Next steps</h2>
          <ul class="feature-list">
            <li>Complete your PART.TRADE preferences</li>
            <li>Follow new listings from your favorite vendors</li>
            <li>Track orders and delivery status in real time</li>
          </ul>
        </div>
      </section>
    `;
  }

  function renderNotFound() {
    const root = getAppRoot();
    if (!root) {
      return;
    }

    root.innerHTML = `
      <section class="card">
        <h1>Page not found</h1>
        <p>The page you were looking for is not available.</p>
        <a class="btn btn-secondary" data-nav="${ROUTE_HOME}" href="${ROUTE_HOME}">Back to home</a>
      </section>
    `;
  }

  function renderRoute(path) {
    if (path === ROUTE_PROFILE) {
      renderProfile();
    } else if (path === ROUTE_HOME) {
      renderHome();
    } else {
      renderNotFound();
    }
  }

  function trackRouteChange(path) {
    if (!pixelReady || !window.PartTradeConsent.hasConsent()) {
      return;
    }
    window.PartTradePixel.trackPageView({ route: path });
    if (path === ROUTE_PROFILE) {
      window.PartTradePixel.trackViewContent({ content_name: 'profile' });
    }
  }

  function maybeTrackCompleteRegistration() {
    if (!pendingCompleteRegistration) {
      return;
    }
    if (!pixelReady || !window.PartTradeConsent.hasConsent()) {
      return;
    }
    if (!authState.isAuthenticated) {
      return;
    }
    window.PartTradePixel.trackCompleteRegistration({ status: 'success' });
    window.PartTradePixel.clearCompleteRegistrationPending();
    pendingCompleteRegistration = false;
  }

  function handleAuthStateChange(nextState) {
    authState = nextState;
    updateHeader(authState);

    if (authState.error) {
      const message = authState.error.error_description || authState.error.message || 'Authentication failed.';
      renderAlert(message);
    } else {
      renderAlert('');
    }

    if (window.PartTradeConsent.hasConsent() && authState.isAuthenticated && authState.user && authState.user.email) {
      window.PartTradePixel.updateAdvancedMatching(authState.user.email);
    }

    maybeTrackCompleteRegistration();
    renderRoute(currentRoute);
  }

  function handleConsent(granted) {
    if (!granted) {
      return;
    }

    const email = authState && authState.user ? authState.user.email : null;
    window.PartTradePixel
      .init({ email })
      .then(() => {
        pixelReady = true;
        trackRouteChange(currentRoute);
        maybeTrackCompleteRegistration();
      })
      .catch((error) => {
        console.error('Failed to initialise Facebook Pixel', error);
      });
  }

  function setupConsent() {
    window.PartTradeConsent.ensureBanner();
    window.PartTradeConsent.onConsent(handleConsent);
  }

  function navigate(path, replace) {
    if (path === ROUTE_CALLBACK) {
      return;
    }

    if (path !== currentRoute) {
      currentRoute = path;
      renderRoute(currentRoute);
      trackRouteChange(currentRoute);
    } else {
      renderRoute(currentRoute);
    }

    const state = { path: currentRoute };
    if (replace) {
      window.history.replaceState(state, '', currentRoute);
    } else {
      window.history.pushState(state, '', currentRoute);
    }
  }

  function handlePopState(event) {
    const path = (event.state && event.state.path) || window.location.pathname || ROUTE_HOME;
    currentRoute = path;
    renderRoute(currentRoute);
    trackRouteChange(currentRoute);
  }

  function interceptNavigationClicks() {
    document.addEventListener('click', (event) => {
      const anchor = event.target.closest('a[data-nav]');
      if (!anchor) {
        return;
      }

      const targetPath = anchor.getAttribute('data-nav');
      if (!targetPath || anchor.target === '_blank' || event.metaKey || event.ctrlKey) {
        return;
      }

      event.preventDefault();
      navigate(targetPath, false);
    });
  }

  function determineInitialRoute() {
    const page = document.body.dataset.page || 'home';
    if (page === 'profile') {
      return ROUTE_PROFILE;
    }
    if (page === 'callback') {
      return ROUTE_CALLBACK;
    }
    return ROUTE_HOME;
  }

  async function processCallbackPage() {
    const root = getAppRoot();
    if (root) {
      root.innerHTML = `
        <section class="card">
          <h1>Completing sign in…</h1>
          <p>Please wait while we finish authenticating your account.</p>
        </section>
      `;
    }

    try {
      const result = await window.PartTradeAuth.handleRedirectCallback();
      window.PartTradePixel.markCompleteRegistrationPending();
      const target = (result && result.appState && result.appState.returnTo) || ROUTE_PROFILE;
      window.location.replace(target);
    } catch (error) {
      console.error('Callback handling failed', error);
      if (root) {
        root.innerHTML = `
          <section class="card error-card">
            <h1>Sign in failed</h1>
            <p>${error.error_description || error.message || 'An unexpected error occurred.'}</p>
            <a class="btn btn-primary" href="${ROUTE_HOME}">Back to home</a>
          </section>
        `;
      }
    }
  }

  function initialiseApp() {
    if (!window.PartTradeAuth || !window.PartTradeConsent || !window.PartTradePixel) {
      console.error('Application modules are missing.');
      return;
    }

    bindHeaderActions();
    interceptNavigationClicks();
    setupConsent();

    const initialRoute = determineInitialRoute();
    if (initialRoute === ROUTE_CALLBACK) {
      processCallbackPage();
      return;
    }

    currentRoute = initialRoute;
    renderRoute(currentRoute);
    window.history.replaceState({ path: currentRoute }, '', currentRoute);

    window.PartTradeAuth.subscribe(handleAuthStateChange);
    window.PartTradeAuth.initialize();

    window.addEventListener('popstate', handlePopState);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialiseApp);
  } else {
    initialiseApp();
  }
})(window, document);
