const { Prisma } = require('@prisma/client');

/**
 * Translates Prisma database errors into application-level operational errors
 * with standard HTTP status codes, preventing database internals, raw SQL,
 * credentials, and metadata from leaking to clients.
 */
function translateDatabaseError(error) {
  if (!error) return error;

  // Preserve operational errors that already have a status code
  if (error.statusCode) {
    return error;
  }

  // Handle known Prisma request errors by code
  if (error instanceof Prisma.PrismaClientKnownRequestError || (error.code && typeof error.code === 'string')) {
    switch (error.code) {
      case 'P2002': {
        const fields = Array.isArray(error.meta?.target) ? error.meta.target.join(', ') : 'field';
        const appError = new Error(`Unique constraint violation on ${fields}`);
        appError.statusCode = 409;
        return appError;
      }
      case 'P2003': {
        const field = error.meta?.field_name || 'relation';
        const appError = new Error(`Foreign key constraint failed on ${field}: referenced record does not exist`);
        appError.statusCode = 400;
        return appError;
      }
      case 'P2025': {
        const appError = new Error('Record not found');
        appError.statusCode = 404;
        return appError;
      }
      default: {
        const appError = new Error('Database operation failed');
        appError.statusCode = 400;
        return appError;
      }
    }
  }

  // Handle Prisma schema validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    const appError = new Error('Invalid database query input');
    appError.statusCode = 400;
    return appError;
  }

  // Generic fallback for any other unexpected database error
  const genericError = new Error('Internal database error');
  genericError.statusCode = 500;
  return genericError;
}

module.exports = { translateDatabaseError };
