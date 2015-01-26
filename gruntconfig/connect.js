'use strict';

var config = require('./config'),
    path = require('path');


var getLiveReload = function () {
  var livereload = require('connect-livereload');
  return livereload({
    port: config.liveReloadPort
  });
};

var getProxy = function () {
  var proxy = require('grunt-connect-proxy/lib/utils');
  return proxy.proxyRequest;
};

var mountFolder = function (connect, dir) {
  return connect.static(path.resolve(dir));
};

var mountPHP = function (dir, options) {
  options = options || {
    'phpini': config.src + '/conf/php.ini'
  };
  var gateway = require('gateway');
  var gatewayOptions = {
    '.php': 'php-cgi',
    'env': {
      'PHPRC': process.cwd() + '/' + options.phpini
    }
  };

  return gateway(path.resolve(dir), gatewayOptions);
};


var connect = {
  options: {
    hostname: '*'
  },
  dev: {
    options: {
      base: config.src + '/htdocs',
      port: 8080,
      middleware: function (connect, options) {
        return [
          mountPHP(options.base[0]),
          mountFolder(connect, options.base[0]),
          mountFolder(connect, config.tmp)
        ];
      }
    }
  },
  exampleDev: {
    proxies: [{
      context: '/theme',
      host: 'localhost',
      https: false,
      port: '<%= connect.dev.options.port %>',
      changeOrigin: false,
      xforward: false,
      rewrite: {'/theme': ''}
    }],
    options: {
      base: config.example,
      port: 8081,
      open: true,
      useAvailablePort: true,
      middleware: function (connect, options) {
        return [
          getLiveReload(),
          getProxy(),
          mountPHP(options.base[0]),
          mountFolder(connect, options.base[0]),

          mountFolder(connect, config.tmp),
          mountFolder(connect, 'node_modules')
        ];
      }
    }
  },

  dist: {
    options: {
      base: config.dist + '/htdocs',
      port: 8082,
      middleware: function (connect, options) {
        return [
          mountPHP(options.base[0], {phpini: config.dist + '/conf/php.ini'}),
          mountFolder(connect, options.base[0])
        ];
      }
    }
  },
  exampleDist: {
    proxies: [{
      context: '/theme',
      host: 'localhost',
      https: false,
      port: '<%= connect.dist.options.port %>',
      changeOrigin: false,
      xforward: false,
      rewrite: {'/theme': ''}
    }],
    options: {
      base: config.example,
      port: 8083,
      open: true,
      useAvailablePort: true,
      middleware: function (connect, options) {
        return [
          getLiveReload(),
          getProxy(),
          mountPHP(options.base[0], {phpini: config.dist + '/conf/php.ini'}),
          mountFolder(connect, options.base[0]),

          mountFolder(connect, config.tmp),
          mountFolder(connect, 'node_modules')
        ];
      }
    }
  }
};


module.exports = connect;
