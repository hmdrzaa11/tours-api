module.exports = function (obj, ...fields) {
  let result = {};
  for (let key in obj) {
    if (fields.includes(key)) {
      result[key] = obj[key];
    }
  }
  return result;
};
