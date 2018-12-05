'use strict';

angular.module('ingresseSDK', [])
.provider('ingresseApiPreferences', function () {
  var apikey, privatekey, companyid;
  var prefHost = 'https://api.ingresse.com';
  PagarMe.encryption_key = 'ek_live_kvF2lgSrlQpz3QlNZj44ODmEIeONfS';

  return {
    setPublicKey: function(key){
      apikey = key;
    },
    setPrivateKey: function(key){
      privatekey = key;
    },
    setHost: function (host) {
      prefHost = host;

      if (prefHost === 'https://api.ingresse.com' || prefHost === 'https://apipre.ingresse.com') {
        PagarMe.encryption_key = 'ek_live_kvF2lgSrlQpz3QlNZj44ODmEIeONfS';
      }

      if (prefHost === 'https://hml-api.ingresse.com' || prefHost === 'https://hml-api-2.ingresse.com') {
        PagarMe.encryption_key = 'ek_test_lwfVXNqRg3tpN7IPPXtatdMYhQG96N';
      }
    },
    setCompanyId: function(id) {
        companyid = id;
    },
    $get: function($rootScope) {
      return{
        setPublicKey: function(key){
          this.apikey = key;
        },
        setPrivateKey: function(key){
          this.privatekey = key;
        },
        setCompanyId: function(id) {
            this.companyid = id;
        },
        apikey: apikey,
        privatekey: privatekey,
        companyid: companyid,
        _host: prefHost,

        // PRIVATE
        loginReturnUrl: 'https://cdn.ingresse.com/websdk/v7/parse-response.html',
        httpCalls: [],

        // PUBLIC
        getHost: function() {
          return this._host;
        },
        setHost: function (host) {
          this._host = host;

          if (this._host === 'https://api.ingresse.com' || this._host === 'https://apipre.ingresse.com') {
            PagarMe.encryption_key = 'ek_live_kvF2lgSrlQpz3QlNZj44ODmEIeONfS';
          }

          if (this._host === 'https://hml-api.ingresse.com' ||
            this._host === 'https://hml-api-2.ingresse.com') {
            PagarMe.encryption_key = 'ek_test_lwfVXNqRg3tpN7IPPXtatdMYhQG96N';
          }

          $rootScope.$broadcast('preferences.hostChanged');
        },
        getCompanyId: function () {
            return this.companyid || 1;
        },
        setAuth: function (signature, timestamp) {
          this._signature = signature;
          this._timestamp = timestamp;
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
