/**
 *
 * @param {*} code - the http or custom error code
 * @param {*} message - A more detailed error message
 * @param {*} stacktrace - The stacktrace of the error
 */
const report = (res, code, message, stacktrace) => {
  console.log("ERROR:\n\n");
  console.log(code, message, stacktrace);
  res.status(code ? code : -1);
  res.json({
    text: message,
    stacktrace,
  });
  return;
};

module.exports = {
  report,
};
