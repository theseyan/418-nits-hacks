/**
 * HTTP client
 * Based on sindresorhus/ky
*/

import ky, {HTTPError} from 'ky';
import * as Auth from './Auth';
import Errors from './Errors';

export const request = async (url, options) => {
    try {
        return await ky(url, options);
    } catch (e) {
        // Handle HTTP errors (non 2xx responses) from server
        if (e instanceof HTTPError) {
            const data = await e.response.json();

            // A custom error from server
            if (data !== "" && data.code && data.message) {
                throw new Errors.HttpError(e.response, data.code, data.message);
            }

            // Server sent a custom error without code
            else if (data !== "" && data.message) {
                throw new Errors.HttpError(e.response, `E_HTTP`, data.message);
            }

            // Received HTTP error but not conforming to the standard format
            else {
                console.error(`[HTTPClient] received an HTTP error response from server, but it does not conform to the standard format:`, e);
                throw new Errors.HttpError(e.response, `E_HTTP`, `An unknown error occurred.`);
            }
        }

        // Handle non-HTTP errors (network issues, etc)
        else {
            throw new Errors.HttpClientError(e, e.message);
        }
    }
};

export const authRequest = async (url, options, attempt = 1, error = null) => {
    // Don't try more than 3 times
    if (attempt > 3) {
        console.error("[HTTPClient] Authenticated HTTP request failed after 5 tries. Aborting.");
        throw error;
    }

    const tokens = await Auth.getTokens();

    // Check if user is logged in
    if (tokens === null) throw new Errors.UserUnauthenticatedError("User is not logged in.");

    try {
        const config = {
            headers: {
                Authorization: `Bearer ${tokens.accessToken}`
            }
        };
        const response = await request(url, {...options, ...config});

        return response;
    } catch(e) {
        if(e instanceof Errors.HttpError && e.status === 401) {
            try {
                // Refresh access token
                await Auth.refreshTokens();
            } catch (refresh_err) {
                // Failed to refresh tokens as well, throw.
                throw refresh_err;
            }

            // Retry
            return await authRequest(url, options, attempt + 1, e);
        } else {
            throw e;
        }
    }
};