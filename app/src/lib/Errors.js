/**
 * Error definitions (client-side)
*/

/**
 * An HTTP error is received from the server.
*/
class HttpError extends Error {
    constructor(response, code, message) {
        message = message ? message : `An error was received as HTTP response.`;
        super(`${code} (${response.status}): ${message}`);

        this.code = code;
        this.status = response.status;
        this.message = message;
        this.response = response;
    }
}
HttpError.prototype.name = 'HttpError';

/**
 * An error occurred in the client-side from HTTP client.
*/
class HttpClientError extends Error {
    constructor(inner, message) {
        message = message ? message : `An unknown error occurred.`;
        super(`${inner.name}: ${message}`);

        this.message = message;
        this.inner = inner;
    }
}
HttpError.prototype.name = 'HttpClientError';

/**
 * User is not logged in or authenticated.
*/
class UserUnauthenticatedError extends Error {
    constructor(message) {
        message = message ? message : `User is unauthenticated or not logged in.`;
        super(`${message}`);

        this.message = message;
    }
}
HttpError.prototype.name = 'UserUnauthenticatedError';

// Export all
export default { HttpError, HttpClientError, UserUnauthenticatedError };