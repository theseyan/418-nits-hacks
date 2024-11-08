/**
 * Error definitions
*/

/**
 * E_BAD_REQUEST
 * Bad/invalid information supplied with request from client side.
*/
class BadRequestError extends Error {
    constructor(message) {
        const code = `E_BAD_REQUEST`;
        const status = 400;

        message = message ? message : `Invalid or malformed information in request.`;
        super(`${code} (${status}): ${message}`);

        this.code = code;
        this.status = status;
        this.message = message;
    }
}
BadRequestError.prototype.name = 'BadRequestError';

/**
 * E_INTERNAL_SERVER
 * Internal Server Error.
*/
class InternalServerError extends Error {
    constructor(message) {
        const code = `E_INTERNAL_SERVER`;
        const status = 500;

        message = message ? message : `Internal Server Error.`;
        super(`${code} (${status}): ${message}`);

        this.code = code;
        this.status = status;
        this.message = message;
    }
}
InternalServerError.prototype.name = 'InternalServerError';

/**
 * E_RESOURCE_EXISTS
 * Resource or entity already exists.
*/
class ResourceExistsError extends Error {
    constructor(message) {
        const code = `E_RESOURCE_EXISTS`;
        const status = 409;

        message = message ? message : `Resource or entity already exists.`;
        super(`${code} (${status}): ${message}`);

        this.code = code;
        this.status = status;
        this.message = message;
    }
}
ResourceExistsError.prototype.name = 'ResourceExistsError';

/**
 * E_RESOURCE_NOT_FOUND
 * Resource not found.
*/
class ResourceNotFoundError extends Error {
    constructor(message) {
        const code = `E_RESOURCE_NOT_FOUND`;
        const status = 404;

        message = message ? message : `Resource not found.`;
        super(`${code} (${status}): ${message}`);

        this.code = code;
        this.status = status;
        this.message = message;
    }
}
ResourceNotFoundError.prototype.name = 'ResourceNotFoundError';

/**
 * E_UNAUTHORIZED
 * Unauthorized to perform action / invalid credentials.
*/
class UnauthorizedError extends Error {
    constructor(message) {
        const code = `E_UNAUTHORIZED`;
        const status = 401;

        message = message ? message : `Unauthorized to perform action, or credentials are invalid.`;
        super(`${code} (${status}): ${message}`);

        this.code = code;
        this.status = status;
        this.message = message;
    }
}
UnauthorizedError.prototype.name = 'UnauthorizedError';

/**
 * E_FORBIDDEN
 * Access to resource is forbidden, even though we understand the request.
*/
class ForbiddenError extends Error {
    constructor(message) {
        const code = `E_FORBIDDEN`;
        const status = 403;

        message = message ? message : `Access to resource is forbidden`;
        super(`${code} (${status}): ${message}`);

        this.code = code;
        this.status = status;
        this.message = message;
    }
}
UnauthorizedError.prototype.name = 'ForbiddenError';

// Export all errors
module.exports = {
    BadRequestError, InternalServerError, ResourceExistsError, UnauthorizedError, ResourceNotFoundError, ForbiddenError
};