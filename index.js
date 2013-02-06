var Scraperjs = require('./lib/scraperjs.js'),
    scraperjs = new Scraperjs();

scraperjs.startServer();
console.log('Server listening on port 8080');