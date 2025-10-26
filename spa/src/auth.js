(function (window) {
  const AUTH_STATE_LISTENERS = new Set();
  const COMPLETE_STATE = { isAuthenticated: false, user: null, isLoading: true, error: null };

  const DEFAULT_REDIRECT = `${window.location.origin}/callback`;

  const AUTH_CONFIG = {
    domain: window.AUTH0_DOMAIN,
    clientId: window.AUTH0_CLIENT_ID,
    authorizationParams: {
      redirect_uri: DEFAULT_REDIRECT,
      scope: 'openid profile email',
    },
    cacheLocation: 'localstorage',
    useRefreshTokens: true,
  };

  let auth0ClientPromise = null;

  function cloneState() {
    return {
      isAuthenticated: COMPLETE_STATE.isAuthenticated,
      user: COMPLETE_STATE.user,
      isLoading: COMPLETE_STATE.isLoading,
      error: COMPLETE_STATE.error,
    };
  }

  function notifyAuthState() {
    const snapshot = cloneState();
    AUTH_STATE_LISTENERS.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('Auth listener failed', err);
      }
    });
  }

  async function getAuth0Client() {
    if (!auth0ClientPromise) {
      if (typeof window.createAuth0Client !== 'function') {
        throw new Error('Auth0 SDK is not loaded.');
      }

      if (!AUTH_CONFIG.domain || !AUTH_CONFIG.clientId) {
        throw new Error('Auth0 configuration is missing. Set AUTH0_DOMAIN and AUTH0_CLIENT_ID.');
      }

      auth0ClientPromise = window.createAuth0Client({
        domain: AUTH_CONFIG.domain,
        clientId: AUTH_CONFIG.clientId,
        authorizationParams: AUTH_CONFIG.authorizationParams,
        cacheLocation: AUTH_CONFIG.cacheLocation,
        useRefreshTokens: AUTH_CONFIG.useRefreshTokens,
      });
    }
    return auth0ClientPromise;
  }

  async function refreshAuthState() {
    COMPLETE_STATE.isLoading = true;
    COMPLETE_STATE.error = null;
    notifyAuthState();

    try {
      const client = await getAuth0Client();
      const authenticated = await client.isAuthenticated();

      COMPLETE_STATE.isAuthenticated = authenticated;
      COMPLETE_STATE.user = authenticated ? await client.getUser() : null;
    } catch (error) {
      console.error('Auth session refresh failed', error);
      COMPLETE_STATE.error = error;
      COMPLETE_STATE.isAuthenticated = false;
      COMPLETE_STATE.user = null;
    } finally {
      COMPLETE_STATE.isLoading = false;
      notifyAuthState();
    }
  }

  async function loginWithRedirect(options) {
    const client = await getAuth0Client();
    return client.loginWithRedirect({
      authorizationParams: {
        redirect_uri: AUTH_CONFIG.authorizationParams.redirect_uri,
        scope: AUTH_CONFIG.authorizationParams.scope,
        connection: 'facebook',
        ...((options && options.authorizationParams) || {}),
      },
      appState: {
        returnTo: '/profile',
        ...(options && options.appState),
      },
    });
  }

  async function handleRedirectCallback(url) {
    COMPLETE_STATE.isLoading = true;
    COMPLETE_STATE.error = null;
    notifyAuthState();

    try {
      const client = await getAuth0Client();
      const result = await client.handleRedirectCallback(url);
      COMPLETE_STATE.isAuthenticated = true;
      COMPLETE_STATE.user = await client.getUser();
      COMPLETE_STATE.error = null;
      return result;
    } catch (error) {
      COMPLETE_STATE.error = error;
      COMPLETE_STATE.isAuthenticated = false;
      COMPLETE_STATE.user = null;
      console.error('Auth redirect handling failed', error);
      throw error;
    } finally {
      COMPLETE_STATE.isLoading = false;
      notifyAuthState();
    }
  }

  async function logout(options) {
    try {
      const client = await getAuth0Client();
      await client.logout({
        logoutParams: {
          returnTo: window.location.origin,
          ...((options && options.logoutParams) || {}),
        },
      });
    } catch (error) {
      console.error('Auth logout failed', error);
      COMPLETE_STATE.error = error;
      notifyAuthState();
    }
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') {
      return function noop() {};
    }

    AUTH_STATE_LISTENERS.add(listener);
    listener(cloneState());

    return function unsubscribe() {
      AUTH_STATE_LISTENERS.delete(listener);
    };
  }

  window.PartTradeAuth = {
    initialize: refreshAuthState,
    login: loginWithRedirect,
    logout,
    handleRedirectCallback,
    subscribe,
    getClient: getAuth0Client,
    get state() {
      return cloneState();
    },
  };
})(window);
