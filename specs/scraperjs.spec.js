describe('scraperjs api', function() {
  var SC = require('../lib/scraperjs.js'),
      sc = new SC(),
      async = require('async'),
      mockQueueItem = {
        url: 'http://example.com',
        callback: 'test'
      },
      mockRequest = {
        params: {
          fetcher: 'test'
        },
        body: {
          fetcher: 'test',
          queueItem: mockQueueItem
        }
      };

  it('Initial length should be zero', function(done) {
    var res = {
      send: function(data) {
        expect(data.success).toEqual(true);
        expect(data.length).toEqual(0);
        done();
      }
    };
    sc.queueLength(mockRequest, res);
  });

  it('Get on empty queue should be falsy', function(done) {
    var res = {
      send: function(data) {
        expect(data.success).toEqual(true);
        expect(data.queueItem).toBeFalsy();
        done();
      }
    };
    sc.queueGet(mockRequest, res);
  });

  it('Add a queueItem', function(done) {
    var res = {
      send: function(data) {
        expect(data.success).toEqual(true);
        done();
      }
    };

    sc.queueAdd(mockRequest, res);
  });

  it('Length should be 1 after adding queueItem', function(done) {
    var res = {
      send: function(data) {
        expect(data.success).toEqual(true);
        expect(data.length).toEqual(1);
        done();
      }
    };
    sc.queueLength(mockRequest, res);
  });

  it('Add array of queueItem', function(done) {
    var res = {
      send: function(data) {
        expect(data.success).toEqual(true);
        done();
      }
    };
    var mockRequest = {
      body: {
        fetcher: 'test',
        queueItem: [
          {url: 'http://example.com/1/', callback: 'test1'},
          {url: 'http://example.com/2/', callback: 'test2'}
        ]
      }
    };
    sc.queueAdd(mockRequest, res);
  });

  it('Length should be 3 after adding two queueItems', function(done) {
    var res = {
      send: function(data) {
        expect(data.success).toEqual(true);
        expect(data.length).toEqual(3);
        done();
      }
    };
    sc.queueLength(mockRequest, res);
  });

  it('Get should get a valid queueItem', function(done) {
    var res = {
      send: function(data) {
        expect(data.queueItem.url).toMatch(/http/);
        expect(data.queueItem.callback).toMatch(/test/);
        done();
      }
    };
    sc.queueGet(mockRequest, res);
  });

  it('Clean up after ourselves', function(done) {
    sc.redis.del([
      'queue:test:89dce6a446a69d6b9bdc01ac75251e4c322bcdff',
      'queue:test',
      'queue:test:a0500b3a5b058a1cd0323e054a2c72c16156519a',
      'queue:test:37bc82e9b72c6649dc8b5b3c2a0a577fa0f38b67',
      'queue:test:inprogress'
    ], function(error) {
      expect(error).toBeFalsy();
      done();
    });
  });

  it('Close redis', function() {
    sc.stopServer();
  });

});