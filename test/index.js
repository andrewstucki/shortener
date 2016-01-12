var fs = require('fs');

var request = require('supertest');
var _ = require('underscore');
var promise = require('promise');

process.env.ENVIRONMENT = "test";

var models = require("../models");
var config = require("../config");

describe('shortener', function() {
  var server;

  before(function(done) {
    models.Url.remove({}, function(err) {
      if (err) {
        throw new Error("Unable to remove Url collection");
        return;
      }
      fs.readFile(__dirname + "/data.json", function(err, data) {
        if (err) {
          throw new Error(
            "Something went wrong reading seed data!");
          return;
        }

        data = JSON.parse(data)
        promise.all(_.map(data, function(value) {
          return new promise(function(resolve, reject) {
            models.Url.findOrCreate(value,
              function(err) {
                if (err) reject(err);
                else resolve();
              });
          });
        })).then(function() {
          models.Counter.findByIdAndUpdate('url', {
            seq: data.length - 1
          }, function(err) {
            if (err) throw new Error(
              "Unable to properly seed test data");
            else done();
          });
        }).catch(function() {
          throw new Error(
            "Unable to properly seed test data");
        });
      });
    });
  });

  beforeEach(function() {
    server = require('../index');
  });

  afterEach(function() {
    server.close();
  });

  it('responds with json for a shortening request', function testShorten(
    done) {
    request(server)
      .get('/https://www.google.com')
      .expect('Content-Type', /json/)
      .expect(function(res) {
        if (!('shortened_url' in res.body)) throw new Error(
          "missing shortened_url key: " + JSON.stringify(res.body));
        if (!('original_url' in res.body)) throw new Error(
          "missing original_url key: " + JSON.stringify(res.body));
        if (!res.body.shortened_url.startsWith(config.base)) throw new Error(
          "wrong shortened url: " + res.body.shortened_url);
        if (res.body.original_url !== "https://www.google.com") throw new Error(
          "wrong original url: " + res.body.original_url);
      })
      .expect(200, done);
  });

  it('redirects for a link request', function testRedirect(done) {
    request(server)
      .get('/0')
      .expect(302, done);
  });

  it('responds with an error for invalid ids', function testInvalidId(done) {
    request(server)
      .get('/10000000')
      .expect(404, {
        error: "Invalid Shortened Link",
        id: "10000000"
      }, done);
  });

  it('responds with an error for invalid urls', function testInvalidUrl(
    done) {
    request(server)
      .get('/htp://www.google.com')
      .expect(422, {
        error: "Invalid URL",
        original_url: "htp://www.google.com"
      }, done);
  });
});
