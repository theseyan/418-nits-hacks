/**
 * Authentication API
*/

import {request, authRequest} from './HTTPClient';
import Errors from './Errors';
import { writable, get } from 'svelte/store';
import config from '../config';

// Currently logged in user
export let currentUser = writable(null);

// PKCE functions
export const pkce = {
    generateCodeVerifier: () => {
        const array = new Uint32Array(28);
        window.crypto.getRandomValues(array);
        return Array.from(array, dec => ('0' + dec.toString(16)).substring(-2)).join('');
    },

    getChallengeFromVerifier: async (code_verifier) => {
        const encoder = new TextEncoder();
        const data = encoder.encode(code_verifier);
        const s256 = await window.crypto.subtle.digest('SHA-256', data);

        // Base64 URL encode the hash
        // @ts-ignore
        const challenge = btoa(String.fromCharCode.apply(null, new Uint8Array(s256))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        return challenge;
    }
};

// Creates an account if it doesn't already exist.
export const createAccount = async (idToken) => {
    const response = await (await request(config.api.host + '/auth/create_account', {
        method: 'post',
        json: {
            id_token: idToken
        }
    })).json();
    
    return response;
};

// Fetches new refresh and access token pair and establishes new session.
export const login = async (idToken) => {
    // Create new PKCE code verifier and challenge
    const codeVerifier = pkce.generateCodeVerifier();
    const codeChallenge = await pkce.getChallengeFromVerifier(codeVerifier);

    // Get authorization code
    const authCode = (await (await request(config.api.host + '/auth/authorize', {
        method: 'post',
        json: {
            id_token: idToken,
            code_challenge: codeChallenge,
            client_id: config.auth.client_id,
        }
    })).json()).auth_code;

    // Get tokens
    const tokens = await (await request(config.api.host + '/auth/tokens', {
        method: 'post',
        json: {
            auth_code: authCode,
            code_verifier: codeVerifier,
            client_id: config.auth.client_id
        }
    })).json();

    // Save tokens
    await setTokens({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
    });

    // Fetch user details initially
    await fetchUser();

    return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
    };
};

// Signs in or creates account
export const signInOrCreateAccount = async (idToken) => {
    try {
        const account = await createAccount(idToken);
        console.log(`[auth] Created a new user account.`);
    } catch(e) {
        if (!(e instanceof Errors.HttpError) || (e instanceof Errors.HttpError && e.status !== 409)) {
            alert("Could not create account due to an error. Please try again.");
            return;
        }
    }

    // Login
    return await login(idToken);
};

// Fetches the user data
export const fetchUser = async () => {
    const user = get(currentUser);

    // Return cached user if present
    if(user !== null) return user;

    // Make request to get user data
    const responseJson = await (await authRequest(config.api.host + '/auth/user', {
        method: 'get',
    })).json();

    currentUser.set(responseJson.user);
    return responseJson;
};

// Refreshes access and refresh tokens.
export const refreshTokens = async () => {
    const tokens = await getTokens();

    // Check if there are tokens
    if (tokens === null) throw new Errors.UserUnauthenticatedError("User is not logged in.");

    try {
        const responseJson = await (await request(config.api.host + '/auth/refresh_tokens', {
            method: 'post',
            json: {
                refresh_token: tokens.refreshToken
            }
        })).json();

        console.log(`[auth] Tokens refreshed`);

        // Save tokens locally
        setTokens({
            accessToken: responseJson.accessToken,
            refreshToken: responseJson.refreshToken
        });

        return {
            accessToken: responseJson.accessToken,
            refreshToken: responseJson.refreshToken
        };
    } catch(e) {
        if(e instanceof Errors.HttpError && e.status === 401) {
            // User may be new OR refresh token may be invalid
            console.log(`[auth] Access token OR refresh token is invalid, throwing error.`);

            // User needs to login again
            throw new Errors.UserUnauthenticatedError("Invalid auth credentials, please login again.");
        } else {
            throw e;
        }
    }
};

// Fetches tokens from persistent storage
export const getTokens = async () => {
    return JSON.parse(localStorage.getItem('418nsh.auth.tokens'));
}

// Saves tokens to persistent storage
export const setTokens = async (value) => {
    if(value === null) localStorage.removeItem('418nsh.auth.tokens');
    else localStorage.setItem('418nsh.auth.tokens', JSON.stringify(value));
}

// Logs out the current session
export const logout = async () => {
    const tokens = await getTokens();

    // Check if user is logged in.
    if (tokens === null) throw new Errors.UserUnauthenticatedError("User is already logged out.");

    // Log out server side
    await request(config.api.host + '/auth/logout', {
        method: 'post',
        json: {
            refresh_token: tokens.refreshToken
        }
    });

    // Clear tokens
    await setTokens(null);

    // Clear state
    currentUser.set(null);
}