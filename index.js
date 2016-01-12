var express = require('express');
var validator = require('validator');

var models = require('./models');
var config = require('./config');

var app = express();

var port = process.env.PORT || config.port;
var baseUrl = process.env.HEROKU_URL || config.base;

// application core
app.get("*", function(req, res) {
  var originalUrl = req.originalUrl.substring(1);
  var id = parseInt(originalUrl, 36);
  var isId = !isNaN(id) && /^[a-z0-9]*$/.test(originalUrl);
  var isUrl = validator.isURL(originalUrl, {
    protocols: ["http", "https"],
    require_tld: false,
    require_protocol: true,
    require_valid_protocol: true,
    allow_underscores: false,
    host_whitelist: false,
    host_blacklist: false,
    allow_trailing_dot: false,
    allow_protocol_relative_urls: false
  });
  if (isId) {
    models.Url.findById(originalUrl, function(err, url) {
      if (err || !url) {
        res.status(404).json({
          error: "Invalid Shortened Link",
          id: originalUrl
        });
        return;
      }
      res.redirect(url.link);
    });
  } else if (isUrl) {
    var url = new models.Url({
      link: originalUrl
    });
    url.save(function(err) {
      if (err) {
        res.status(500).json({
          error: "Something went wrong trying to save your link",
          original_url: originalUrl
        });
        return;
      }
      res.json({
        shortened_url: baseUrl + url._id.toString(36),
        original_url: originalUrl
      });
    });
  } else {
    res.status(422).json({
      error: "Invalid URL",
      original_url: originalUrl
    });
  }
});

module.exports = app.listen(port, function() {
  if (config.environment !== "test") console.log(
    'Shortener app listening on port ' + port + '!');
});
