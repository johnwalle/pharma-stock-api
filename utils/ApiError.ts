class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    stack = ''
  ) {
    super(message);

    // Set the prototype explicitly (important for extending Error in TS)
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.isOperational = isOperational;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    console.error('API Error:', {
      statusCode: this.statusCode,
      message: this.message,
      stack: this.stack,
    });
    
    return {
      error: true,
      code: this.statusCode,
      message: this.message,
      stack: this.stack,
    };
  }
}

export default ApiError;
