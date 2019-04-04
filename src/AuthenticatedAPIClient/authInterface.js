import Cookies from 'universal-cookie';
import jwtDecode from 'jwt-decode';

import { logError } from '../logging';

// Apply the auth-related properties and functions to the Axios API client.
export default function applyAuthInterface(httpClient, authConfig) {
  /* eslint-disable no-param-reassign */
  httpClient.appBaseUrl = authConfig.appBaseUrl;
  httpClient.authBaseUrl = authConfig.authBaseUrl;
  httpClient.accessTokenCookieName = authConfig.accessTokenCookieName;
  httpClient.userInfoCookieName = authConfig.userInfoCookieName;
  httpClient.csrfTokenApiPath = authConfig.csrfTokenApiPath;
  httpClient.loginUrl = authConfig.loginUrl;
  httpClient.logoutUrl = authConfig.logoutUrl;
  httpClient.refreshAccessTokenEndpoint = authConfig.refreshAccessTokenEndpoint;
  /**
   * We will not try to refresh an expired access token before
   * making requests to these auth-related URLs.
   */
  httpClient.authUrls = [
    httpClient.refreshAccessTokenEndpoint,
  ];
  /**
   * We will not try to retrieve a CSRF token before
   * making requests to these CSRF-exempt URLS.
   */
  httpClient.csrfExemptUrls = [
    httpClient.refreshAccessTokenEndpoint,
  ];

  httpClient.getAuthenticationState = () => {
    const state = {};

    const token = httpClient.getDecodedAccessToken();
    if (token) {
      state.authentication = {
        userId: token.user_id,
        username: token.preferred_username,
      };
    }

    return state;
  };


  httpClient.ensurePublicOrAuthencationAndCookies = route =>
    httpClient.isRoutePublic(route) || httpClient.ensureAuthencationAndCookies(route);

  // JWT expiration is serialized as seconds since the epoch,
  // Date.now returns the number of milliseconds since the epoch.
  httpClient.isAccessTokenExpired = token => !token || token.exp < Date.now() / 1000;

  httpClient.login = (redirectUrl = authConfig.appBaseUrl) => {
    window.location.assign(`${httpClient.loginUrl}?next=${encodeURIComponent(redirectUrl)}`);
  };

  httpClient.logout = (redirectUrl = '') => {
    const cookies = new Cookies();
    cookies.remove(httpClient.accessTokenCookieName, {
      domain: '.smartlearn.kr',
    });
    window.location.assign(`${httpClient.logoutUrl}?redirect_url=${encodeURIComponent(redirectUrl)}`);
  };

  httpClient.refreshAccessToken = () =>
    httpClient.post(httpClient.refreshAccessTokenEndpoint);

  httpClient.isAuthUrl = url =>
    httpClient.authUrls.includes(url);

  httpClient.getDecodedAccessToken = () => {
    const cookies = new Cookies();
    let decodedToken = null;
    try {
      decodedToken = jwtDecode(cookies.get(httpClient.accessTokenCookieName));
    } catch (error) {
      // empty
    }
    return decodedToken;
  };

  httpClient.getCsrfToken = (apiProtocol, apiHost) =>
    httpClient.get(`${apiProtocol}//${apiHost}${httpClient.csrfTokenApiPath}`);

  httpClient.isCsrfExempt = url =>
    httpClient.csrfExemptUrls.includes(url);

  httpClient.ensureAuthencationAndCookies = (route = '') => {
    // Validate auth-related cookies are in a consistent state.
    const accessToken = httpClient.getDecodedAccessToken();
    const tokenExpired = httpClient.isAccessTokenExpired(accessToken);
    if (tokenExpired) {
      const cookies = new Cookies();
      const hasUserInfo = !!cookies.get(httpClient.userInfoCookieName);
      if (hasUserInfo) {
        // Cookies are out of sync. Log the user out to reset cookies and resync.
        logError(new Error(`Invalid auth cookies: isAccessTokenExpired=${tokenExpired}, hasUserInfo=${hasUserInfo}`));
        httpClient.logout(httpClient.appBaseUrl + route);
      } else {
        httpClient.login(httpClient.appBaseUrl + route);
      }
      return false;
    }
    return true;
  };

  httpClient.isRoutePublic = route => /^\/public.*$/.test(route);
  /* eslint-enable no-param-reassign */
}
