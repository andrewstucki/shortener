var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate')

var config = require("./config");

// initialize mongo
mongoose.connect(process.env.MONGOLAB_URI || config.db);
var counterSchema = mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  seq: {
    type: Number,
    default: 0
  }
});
var Counter = mongoose.model('Counter', counterSchema);

Counter.findById('url', function(err, count) {
  if (err) throw new Error("Unable to initialize counter");
  if (!count) {
    (new Counter({
      _id: 'url',
      seq: 0
    })).save(function(err) {
      if (err) throw new Error("Unable to initialize counter");
    })
  }
});

var urlSchema = new mongoose.Schema({
  _id: Number,
  link: String
})
urlSchema.plugin(findOrCreate);

urlSchema.pre('save', function(next) {
  var doc = this;
  Counter.findByIdAndUpdate({
    _id: 'url'
  }, {
    $inc: {
      seq: 1
    }
  }, function(error, count) {
    if (error) return next(error);
    doc._id = count.seq;
    next();
  });
});

var Url = mongoose.model('Url', urlSchema);

module.exports = {
  Url: Url,
  Counter: Counter
};
