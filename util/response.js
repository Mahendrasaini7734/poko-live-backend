// utils/response.js
exports.success = (res, data = {}, message = "Success") => {
  return res.json({
    status: true,
    message:message,
    data:data
  });
};

exports.error = (res, message = "Error", code = 400) => {
  return res.status(code).json({
    status: false,
    message:message
  });
};