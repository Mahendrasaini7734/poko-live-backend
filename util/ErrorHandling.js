
const successResponse = (res, message,   statusCode = 200) => {
    return res.status(statusCode).json({
      status: "success",
      message :message,
    });
  };
  
  const errorResponse = (res, message = "Something went wrong", statusCode = 500) => {
    return res.status(statusCode).json({
      status: "error",
      message,
    });
  };
  
  const validationErrorResponse = (res, errors, message = "Validation Failed", statusCode = 400) => {
    return res.status(statusCode).json({
      status: "fail",
      message,
      errors,
    });
  };
  
  module.exports = {
    successResponse,
    errorResponse,
    validationErrorResponse,
  };