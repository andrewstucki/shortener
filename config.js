var _ = require("underscore");

var environment = process.env.ENVIRONMENT || "development";

var config = {
  development: {
    db: "mongodb://localhost/shortener",
    base: "http://localhost:3000/",
    port: 3000
  },

  test: {
    db: "mongodb://localhost/shortener-test",
    base: "http://test.shortener.com/",
    port: 3000
  }
}

if (!(environment in config))
  throw new Error("Invalid environment specified: " + environment + "!");

module.exports = _.extend({}, config[environment], {
  environment: environment
});
