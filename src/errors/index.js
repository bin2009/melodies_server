// errors/index.js
module.exports = {
    ValidationError: class ValidationError extends Error {
        constructor(message) {
            super(message);
            this.name = 'ValidationError';
            this.statusCode = 400;
            this.isOperational = true;
        }
    },

    DuplicateError: class DuplicateError extends Error {
        constructor(message) {
            super(message);
            this.name = 'DuplicateError';
            this.statusCode = 409;
            this.isOperational = true;
        }
    },

    InternalServerError: class InternalServerError extends Error {
        constructor(message) {
            super(message);
            this.name = 'InternalServerError';
            this.statusCode = 500;
            this.isOperational = false;
        }
    },
};
