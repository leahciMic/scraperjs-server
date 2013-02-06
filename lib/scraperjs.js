var express = require('express'),
    redis = require('redis'),
    async = require('async'),
    _ = require('underscore'),
    sha1 = require('../contrib/sha1.js');

function scraperjs() {
  this.redis = redis.createClient();
  this.server = express();

  this.server.get('/queue/:fetcher/get', this.queueGet);
  this.server.get('/queue/:fetcher/length', _.bind(this.queueLength, this));
  this.server.post('/queue', this.queueAdd);
  this.server.put('/queue/:fetcher/:key', this.queueUpdate);
};

scraperjs.prototype.startServer = function() {
  this.server.listen(8080);
};

scraperjs.prototype.stopServer = function() {
  this.redis.quit();
};

scraperjs.prototype.getQueueKey = function(fetcher) {
  return 'queue:' + fetcher;
};

scraperjs.prototype.sendResponse = function(error, data, response) {
  data = _.extend({success: !error}, data);
  response.send(data);
};

scraperjs.prototype.queueLength = function(req, res) {
  var scraperjs = this;
  this.redis.llen(
    this.getQueueKey(req.params.fetcher),
    function(error, length) {
      scraperjs.sendResponse(
        error,
        {
          length: length
        },
        res
      );
    }
  );
};

scraperjs.prototype.queueGet = function(req, res) {
  var scraperjs = this;
  async.auto(
    {
      key: function(callback) {
        scraperjs.redis.rpoplpush(
          scraperjs.getQueueKey(req.params.fetcher),
          scraperjs.getQueueKey(req.params.fetcher) + ':inprogress',
          callback
        );
      },
      value: ['key', function(callback, results) {
        scraperjs.redis.get(
          scraperjs.getQueueKey(req.params.fetcher) + ':' + results.key,
          callback
        );
      }]
    },
    function(error, results) {
      scraperjs.sendResponse(
        error,
        {
          queueItem: JSON.parse(results.value)
        },
        res
      );
    }
  );
};

scraperjs.prototype.exists = function(fetcher, url, callback) {
  this.redis.get(
    this.getQueueKey(fetcher) + ':' + sha1(url),
    function(errors, data) {
      callback(data !== null);
    }
  );
};

scraperjs.prototype.queueAdd = function(req, res) {
  var scraperjs = this;
  this.add(req.body.fetcher, req.body.queueItem, function(error) {
    scraperjs.sendResponse(
      error,
      {},
      res
    );
  });
  /**
   * @lastTouched
   * need to add exists, and a few other things
   * tests need to be written next, mustn't move on without them
   */
};

scraperjs.prototype.add = function(fetcher, queueItem, callback) {
  var urls = [],
      scraperjs = this;

  if (_.isArray(queueItem)) {
    if (!queueItem.length)
      return this.sendResponse(
        true,
        {success: false},
        res
      );
    async.forEach(
      queueItem,
      function(queueItem, callback) {
        if (urls.indexOf(queueItem.url) !== -1)
          return callback(false);
        urls.push(queueItem.url);
        scraperjs.add(fetcher, queueItem, callback);
      },
      function(error) {
        callback(error);
      }
    );
  } else
    this._add(
      fetcher,
      queueItem,
      function() {
        callback();
      }
    );
  }

scraperjs.prototype._add = function(fetcher, queueItem, callback) {
  var scraperjs = this;

  async.auto(
    {
      checkExists: function(callback) {
        scraperjs.exists(
          fetcher,
          queueItem.url,
          function(exists) {
            callback(false, exists);
          }
        );
      },
      addQueueItem: ['checkExists', function(callback, results) {
        if (results.checkExists)
          return callback(false);
        scraperjs.redis.multi()
          .set(
            scraperjs.getQueueKey(fetcher) + ':' + sha1(queueItem.url),
            JSON.stringify(queueItem)
          )
          .lpush(
            scraperjs.getQueueKey(fetcher),
            sha1(queueItem.url)
          )
          .exec(function(error) {
            callback(error);
          });
      }]
    },
    function(error) {
      callback(error);
    }
  )
};

scraperjs.prototype.queueUpdate = function() {
};

scraperjs.prototype.dataAdd = function(req, res) {

};

module.exports = scraperjs;