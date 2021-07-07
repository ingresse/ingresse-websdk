'use strict';

angular.module('ingresseSDK', [])
.provider('ingresseApiPreferences', function () {
  var apikey, privatekey, companyid;
  var prefHost = 'https://api.ingresse.com';
  PagarMe.encryption_key = 'ek_live_lMsy9iABVbZrtgpd7Xpb9MMFgvjTYQ';

  var envs = {
    prod        : 'https://api.ingresse.com',
    stg         : 'https://stg-api.ingresse.com',
    hmla        : 'https://hmla-api.ingresse.com',
    hmlb        : 'https://hmlb-api.ingresse.com',
    hmlc        : 'https://hmlc-api.ingresse.com',
    hmld        : 'https://hmld-api.ingresse.com',
    hmle        : 'https://hmle-api.ingresse.com',
    integration : 'https://integration-api.ingresse.com',
    integration2: 'https://integration2-api.ingresse.com',
    local       : 'http://api.ingresse.dev',

    /* Deprecated */
    pre : 'https://apipre.ingresse.com',
    test: 'https://test-api.ingresse.com',
    hml : 'https://hml-api.ingresse.com',
    hml2: 'https://hml-api-2.ingresse.com',
  };

  return {
    setApiKey: function(key){
      apikey = key;
    },
    setPublicKey: function(key){
      apikey = key;
    },
    setPrivateKey: function(key){
      privatekey = key;
    },
    setHost: function (host) {
      var _host = ('' + (host || 'prod')).toLowerCase();
      prefHost  = (envs.hasOwnProperty(_host) ? envs[_host] : _host);

      /* Deprecated */
      if (prefHost === 'https://api.ingresse.com' || prefHost === 'https://apipre.ingresse.com') {
        PagarMe.encryption_key = 'ek_live_lMsy9iABVbZrtgpd7Xpb9MMFgvjTYQ';
      }

      if (prefHost === 'https://hml-api.ingresse.com' || prefHost === 'https://hml-api-2.ingresse.com') {
        PagarMe.encryption_key = 'ek_test_lwfVXNqRg3tpN7IPPXtatdMYhQG96N';
      }
    },
    setCompanyId: function(id) {
        companyid = id;
    },
    $get: function($rootScope) {
      return {
        /* Application Environments */
        environments: envs,

        /* Deprecated Methods */
        setPublicKey : function(key) {
          this.apikey = key;
        },
        setPrivateKey: function (key){
          this.privatekey = key;
        },

        /**
         * Set Application API Key
         *
         * @param {string} key
         */
        setApiKey   : function (key) {
          this.apikey = key;
        },

        /**
         * Get Application API Key
         *
         * @returns {string} key
         */
        getApiKey   : function () {
          return this.apikey;
        },

        /**
         * Set Application Company ID
         *
         * @param {string} id
         */
        setCompanyId: function (id) {
            this.companyid = id;
        },

        apikey    : apikey,
        privatekey: privatekey,
        companyid : companyid,
        _host     : prefHost,

        // PRIVATE
        loginReturnUrl: 'https://cdn.ingresse.com/websdk/v7/parse-response.html',
        httpCalls     : [],

        // PUBLIC
        getEnv: function() {
          return this._env;
        },
        getHost: function() {
          return this._host;
        },
        setHost: function (host) {
          this._env  = ('' + (host || 'prod')).toLowerCase();
          this._host = (envs.hasOwnProperty(this._env) ? envs[this._env] : this._env);

          /* Deprecated */
          if (this._host === 'https://api.ingresse.com' || this._host === 'https://apipre.ingresse.com') {
            PagarMe.encryption_key = 'ek_live_lMsy9iABVbZrtgpd7Xpb9MMFgvjTYQ';

          } else {
            PagarMe.encryption_key = 'ek_test_lwfVXNqRg3tpN7IPPXtatdMYhQG96N';
          }

          $rootScope.$broadcast('preferences.hostChanged');
        },
        getCompanyId: function () {
            return (this.companyid || 1);
        },
        setAuth: function (signature, timestamp) {
          this._signature = signature;
          this._timestamp = timestamp;
        },
        getPublicKey: function () {
          return this.apikey;
        },
        httpCallStarted: function (url) {
          var domain = url.split('?')[0];
          var parameters = url.split('?')[1].split('&');

          for (var i = parameters.length - 1; i >= 0; i--) {
            if (i === 0) {
              parameters[i] = '?' + parameters[i];
            } else {
              parameters[i] = '&' + parameters[i];
            }
          }

          this.httpCalls.unshift({
            url: url,
            startTime: new Date(),
            domain: domain,
            parameters: parameters
          });
        },
        httpCallStoped: function (url, success) {
          for (var i = this.httpCalls.length - 1; i >= 0; i--) {
            if (this.httpCalls[i].url === url) {
              this.httpCalls[i].stopTime = new Date();
              this.httpCalls[i].success = success;
              this.httpCalls[i].requestTime = (this.httpCalls[i].stopTime - this.httpCalls[i].startTime) / 1000;
            }
          }
        },
        clearHttpHistory: function () {
          this.httpCalls.splice(0,this.httpCalls.length);
        }
      };
    }
  };
});

