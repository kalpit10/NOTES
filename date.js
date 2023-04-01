exports.getDate = function () {
  //module.exports is a js object that means it has properties and methods associated so we can do this....
  const today = new Date();

  const options = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };

  return today.toLocaleDateString("en-US", options);
  return day;
};

exports.getDay = function () {
  const today = new Date();

  const options = {
    weekday: "long",
  };

  return today.toLocaleDateString("en-US", options);
  return day;
};
