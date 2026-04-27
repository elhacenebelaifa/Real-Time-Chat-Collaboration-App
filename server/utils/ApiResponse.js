class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  static ok(data, message) {
    return new ApiResponse(200, data, message || 'Success');
  }

  static created(data, message) {
    return new ApiResponse(201, data, message || 'Created');
  }

  static noContent() {
    return new ApiResponse(204, null, 'No Content');
  }

  send(res) {
    if (this.statusCode === 204) {
      return res.status(204).end();
    }
    return res.status(this.statusCode).json({
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
    });
  }
}

module.exports = ApiResponse;
