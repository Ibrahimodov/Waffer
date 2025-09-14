const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Supabase errors
  if (err.code === '23505') { // PostgreSQL unique constraint violation
    let message = 'Duplicate field value entered';
    
    // Extract field name from error details
    if (err.details && err.details.includes('email')) {
      message = 'Email already exists';
    } else if (err.details && err.details.includes('phone')) {
      message = 'Phone number already exists';
    } else if (err.details && err.details.includes('commercial_registration')) {
      message = 'Commercial registration number already exists';
    }
    
    error = {
      message,
      statusCode: 409 // Conflict status code for duplicate resources
    };
  }

  // Supabase/PostgreSQL validation errors
  if (err.code === '23502') { // NOT NULL constraint violation
    const message = 'Required field is missing';
    error = {
      message,
      statusCode: 400
    };
  }

  // Supabase auth errors
  if (err.message && err.message.includes('Invalid login credentials')) {
    error = {
      message: 'Invalid login credentials',
      statusCode: 401
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      message,
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = {
      message,
      statusCode: 401
    };
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = {
      message,
      statusCode: 400
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = {
      message,
      statusCode: 400
    };
  }

  // Rate limiting error
  if (err.status === 429) {
    const message = 'Too many requests, please try again later';
    error = {
      message,
      statusCode: 429
    };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;