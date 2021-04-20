'use strict';

function receiveMessage (event) {
  if (event.origin !== 'https://cdn.ingresse.com') {
    return;
  }

  var obj = JSON.parse(event.data);
  angular.element(document.body).scope().$broadcast('ingresseAPI.userHasLogged', obj);
}

window.addEventListener('message', receiveMessage, false);

angular.module('ingresseSDK')
.service('ingresseAPI', function ($http, $q, ingresseApiPreferences, IngresseApiUserService, Payment, ingressePaymentType) {
  var API = {};

  API._urlencode = function (str) {
    if (str === null || str === undefined) {
      return;
    }

    str = str.toString();
    return encodeURIComponent(str);
  };

  API._formatTwoCaracters = function (value) {
    if (value < 10) {
      value = '0' + value;
    }
    return value;
  };

  /*  GENERATES THE PROPER AUTHENTICATION KEY FOR API CALLS, NEED THE PRIVATE AND PUBLIC KEYS OF APPLICATION SETTED WITH ingresseAPIProvider.

    Ex:
    angular.module('yourAppModuleName').config(function (ingresseAPIProvider) {
      ingresseAPIProvider.setPublicKey('your public key');
      ingresseAPIProvider.setPrivateKey('your private key');
    });

    RETURNS THE STRING TO BE USED ON API CALLS.
  */
  API._generateAuthKey = function () {
    if (!ingresseApiPreferences.apikey) {
      return '?noauthdata';
    }

    return '?apikey=' + API._urlencode(ingresseApiPreferences.apikey);
  };

  API._getUrlParameters = function (filters) {
    var parameters = '';
    var key;

    for (key in filters) {
      if (filters.hasOwnProperty(key)) {
        if (filters[key] !== undefined && filters[key] !== null) {
          parameters += '&' + key + '=' + this._urlencode(filters[key]);
        }
      }
    }

    return parameters;
  };

  /**
  * Get User Token to Requests
  *
  * @return {object}
  */
  API._getRequestToken = function () {
    var credentials = IngresseApiUserService.getCredentials();
    var usertoken   = (credentials && credentials.token ? credentials.token : '');

    return (!usertoken ? {} : {
      usertoken: usertoken,
    });
  };

  /**
  * Get Requests Headers
  *
  * @return {object}
  */
  API._getRequestHeaders = function () {
    var credentials   = IngresseApiUserService.getCredentials();
    var authorization = ((credentials && credentials.jwt) ? ('Bearer ' + credentials.jwt) : '');

    return (!authorization ? {} : {
      headers: {
        Authorization: authorization,
      },
    });
  };

  /**
   * Get Endpoint URL with Query Parameters
   *
   * @param {string} method
   * @param {string} identifier
   * @param {object} parameters
   *
   * @return {string} url
   */
  API._getUrl = function (method, identifier, parameters) {
    var userToken = API._getRequestToken();
    var url       = ingresseApiPreferences.getHost() + '/';

    if (method) {
      url += method;
    }

    if (identifier) {
      url += '/' + identifier;
    }

    url += API._generateAuthKey();
    url += API._getUrlParameters(angular.extend({}, (parameters || {}), userToken));

    return url;
  };

  API._get = function (method, identifier, parameters, options) {
    var deferred    = $q.defer();
    var endpointUrl = API._getUrl(method, identifier, parameters);
    var reqHeaders  = API._getRequestHeaders();
    var reqOptions  = angular.merge({}, reqHeaders, (options || {}));

    $http.get(endpointUrl, reqOptions)
      .then(function (response) {
        response = response.data;

        if (angular.isObject(response.responseData) && angular.isDefined(response.ResponseSessionStatus)) {
          response.responseData.sessionStatus = response.ResponseSessionStatus;
        }

        deferred.resolve(response.responseData);

      }, function (error) {
        deferred.reject(error);
      });

    return deferred.promise;
  };

  API._post = function (method, identifier, parameters, postParameters, options) {
    var deferred    = $q.defer();
    var endpointUrl = API._getUrl(method, identifier, parameters);
    var reqHeaders  = API._getRequestHeaders();
    var reqOptions  = angular.merge({}, reqHeaders, (options || {}));

    $http.post(endpointUrl, postParameters, reqOptions)
      .then(function (response) {
        response = response.data;

        deferred.resolve(response.responseData);

      }, function (error) {
        deferred.reject(error);
      });

    return deferred.promise;
  };

  API._put = function (method, identifier, parameters, postParameters, options) {
    var deferred    = $q.defer();
    var endpointUrl = API._getUrl(method, identifier, parameters);
    var reqHeaders  = API._getRequestHeaders();
    var reqOptions  = angular.merge({}, reqHeaders, (options || {}));

    $http.put(endpointUrl, postParameters, reqOptions)
      .then(function (response) {
        response = response.data;

        deferred.resolve(response.responseData);

      }, function (error) {
        deferred.reject(error);
      });

    return deferred.promise;
  };

  API._delete = function (method, identifier, parameters, options) {
    var deferred    = $q.defer();
    var endpointUrl = API._getUrl(method, identifier, parameters);
    var reqHeaders  = API._getRequestHeaders();
    var reqOptions  = angular.merge({}, reqHeaders, (options || {}));

    $http.delete(endpointUrl, reqOptions)
      .then(function (response) {
        response = response.data;

        deferred.resolve(response.responseData);
      }, function (error) {
        deferred.reject(error);
      });

    return deferred.promise;
  };

  /**
   * Calls for elasticsearch microservice.
   */
  API.search = {
    getUserTransfer: function (filters, usertoken) {
      var identifier = 'transfer/user';

      if (usertoken) {
        filters.usertoken = usertoken;
      }

      return API._get('search', identifier, filters);
    }
  };

  API.event = {
    get : function (eventId, filters) {
      var identifier;

      if (angular.isNumber(parseInt(eventId, 10)) && !isNaN(eventId)) {
        identifier = eventId;
      } else {
        filters.method = 'identify';
        filters.link = eventId;
      }

      return API._get('event', identifier, filters);
    },

    getCrew : function (eventId, filters, usertoken) {
      var identifier = eventId + '/crew';

      if (usertoken) {
        filters.usertoken = usertoken;
      }

      return API._get('event', identifier, filters);
    },

    search : function (filters) {
      return API._get('event', null, filters);
    },

    getTicketTypes : function (eventId, filters, usertoken) {
      var identifier = eventId + '/tickets';

      if (usertoken) {
        filters.usertoken = usertoken;
      }

      return API._get('event', identifier, filters);
    },

    getTicketTypesForSession: function (eventId, filters, usertoken) {
      var identifier = eventId + '/session/' + filters.sessionId + '/tickets';

      if (usertoken) {
        filters.usertoken = usertoken;
      }

      return API._get('event', identifier, filters);
    },

    updateTicketStatus : function (eventId, ticket, token) {
      var filters = {
        method: 'updatestatus',
        usertoken: token
      };

      var identifier = eventId + '/guestlist';

      var postObject = {
        tickets: [ticket]
      };

      return API._post('event', identifier, filters, postObject);
    },

    getCheckinReport : function (eventId, token) {
      var identifier = eventId + '/guestlist';

      var filters = {
        usertoken: token
      };

      return API._get('event', identifier, filters);
    },

    getAttributes : function (eventId, filters) {
      var _filter = filters || {},
        identifier = eventId + '/attributes';

      return API._get('event', identifier, _filter);
    },

    updateAttributes : function (eventId, data, token) {
      var filters = {
        usertoken: token
      };
      var identifier = eventId + '/attributes';

      return API._post('event', identifier, filters, data);
    },

    update : function (eventId, data, token) {
      var filters = {
        usertoken: token,
      };

      return API._post('event', eventId, filters, data);
    },
  };

  API.producer = {
    getCustomerProfile: function (producerId, token) {
      var identifier = producerId + '/customerProfile';

      var filters = {
        usertoken: token
      };

      return API._get('producer', identifier, filters);
    },
    getSalesForCostumer: function (identifier, filters, token) {
      var deferred = $q.defer();
      var url;

      url = ingresseApiPreferences.getHost() + '/producer/' + identifier.producerId + '/customer/' + identifier.costumerId + '/sale' +  API._generateAuthKey();

      if (filters) {
        angular.forEach(filters, function (value, key) {
          if (value) {
            url += '&' + key + '=' + value;
          }
        });
      }

      url += '&usertoken=' + token;

      $http.get(url)
        .then(function (response) {
          response = response.data;
          deferred.resolve(response.responseData);
        })
        .catch(function (error) {
          deferred.reject(error);
        });

      return deferred.promise;
    },
    getCustomerList: function (producerId, filters, token) {
      var identifier = producerId + '/customer';

      filters.usertoken = token;

      return API._get('producer', identifier, filters);
    },
    getCustomerListCSVExportURL: function (producerId, token, filters) {
      var url = ingresseApiPreferences.getHost() + '/producer/' + producerId + '/customerExport' + API._generateAuthKey() + '&usertoken=' + token;

      if (filters) {
        if (filters.scorefrom) {
          url += '&scorefrom=' + filters.scorefrom;
        }

        if (filters.scoreto) {
          url += '&scoreto=' + filters.scoreto;
        }

        if (filters.event) {
          url += '&event=' + filters.event;
        }

        if (filters.platform) {
          url += '&platform=' + filters.platform;
        }

        if (filters.classification) {
          url += '&classification=' + filters.classification;
        }

        if (filters.term) {
          url += '&term=' + filters.term;
        }
      }

      return url;
    },
    getSalesGroupReport: function (identifier, filters, token) {
      identifier += '/salesgroupReport';

      filters.usertoken = token;

      return API._get('producer', identifier, filters);
    },
    getSalesGroupPaymentReport: function (identifier, filters, token) {
      identifier += '/salesgroupPaymentReport';

      filters.usertoken = token;

      return API._get('producer', identifier, filters);
    }
  };

  API.ticketBooth = {
    sell: function (postObject, token) {
      var filters = {
        method: 'sell',
        usertoken: token
      };

      return API._post('ticketbooth', null, filters, postObject);
    },
    getPrintData: function (transactionId, filters, token) {
      filters.method = 'print';
      filters.usertoken = token;

      return API._get('ticketbooth', transactionId, filters);
    },
    setLogPrintData: function(transactionId, postObject, token) {
      var filters = {
          usertoken: token
        }, identifier = transactionId + '/history';

      return API._post('ticketbooth', identifier, filters, postObject);
    }
  };

  API.ticket = {
    // Legacy API code, different interface.
    getQRCodeUrl: function (ticketCode, usertoken) {
      var url;

      url = ingresseApiPreferences.getHost();
      url += '/ticket/' + ticketCode + '/qrcode';

      url += API._generateAuthKey();
      url += '&usertoken=' + usertoken;

      return url;
    },

    updateTicketTransfer: function (ticketId, postObject, userToken) {
      var filters = {
        usertoken: userToken
      },

      identifier = ticketId + '/transfer/' + postObject.transferId;

      return API._post('ticket', identifier, filters, postObject);
    },

    createTicketTransfer: function (ticketId, postObject, userToken) {
      var filters = {
        usertoken: userToken
      },

      identifier = ticketId + '/transfer';

      return API._post('ticket', identifier, filters, postObject);
    },

    getTransferHistory: function (ticketId,  userToken) {
      var filters = {
        usertoken: userToken
      },

      identifier = ticketId + '/transfer';

      return API._get('ticket', identifier, filters);
    },

    getCheckinStatus: function (ticketCode, userToken) {
      var filters = {
        usertoken: userToken
      },

      identifier = encodeURIComponent(ticketCode) + '/status';

      return API._get('ticket', identifier, filters);
    },
  };

  API.dashboard = {
    getEventReport: function (identifier, filters, token) {
      filters.usertoken = token;

      return API._get('dashboard', identifier, filters);
    },
    getVisitsReport: function (eventId, filters, usertoken) {
      var identifier = eventId + '/visitsReport';

      if (usertoken) {
        filters.usertoken = usertoken;
      }

      return API._get('dashboard', identifier, filters);
    },
    getTransactionsReport: function (identifier, filters, token) {
      identifier += '/transactionReport';

      filters.usertoken = token;

      return API._get('dashboard', identifier, filters);
    },
    getEventSalesTimeline: function (identifier, filters, token) {
      identifier += '/timeline';
      filters.usertoken = token;

      return API._get('dashboard', identifier, filters);
    },
    getSalesCalendarReport: function (eventId, filters, token) {
      var identifier = eventId + '/dailyTickets/';

      if (token) {
        filters.usertoken = token;
      }

      return API._get('dashboard', identifier, filters);
    },
    getCashFlowReport: function (eventId, filters, token) {
      var identifier = eventId + '/dailyCashFlow/';

      if (token) {
        filters.usertoken = token;
      }

      return API._get('dashboard', identifier, filters);
    },
    getPaymentReport: function (eventId, filters, token) {
      var identifier = eventId + '/dailyPayment/';

      if (token) {
        filters.usertoken = token;
      }

      return API._get('dashboard', identifier, filters);
    },
    getSalesChannelReport: function (eventId, filters, token) {
      var identifier = eventId + '/dailyChannels/';

      if (token) {
        filters.usertoken = token;
      }

      return API._get('dashboard', identifier, filters);
    }
  };

  API.balance = {
    describe: function (method) {
      if (method === 'get') {
        return 'https://docs.google.com/document/d/1a4-M6o4hCa0AUG1Q_Zsxhl4UuicuA7qWJWH0C66qfbo/edit#heading=h.qmxn7fpd5bif';
      }
    },
    get: function (filters, token) {
      if (token) {
        filters.usertoken = token;
      }

      return API._get('balance', null, filters);
    }
  };

  API.error = {
    get: function (errorClass) {
      return API._get('error', errorClass);
    }
  };

  API.user = {
    get: function (userid, filters, token) {
      var deferred = $q.defer();

      if (token) {
        filters.usertoken = token;
      }

      API._get('user', userid, filters)
      .catch(deferred.reject)
      .then(function (response) {
        if (typeof response !== 'object') {
          return deferred.reject();
        }

        var userData      = response;
        userData.fullName = ((response.name || '') + (response.lastname || ''));

        if (filters.fields && filters.fields.indexOf('picture')) {
          userData.photo = (
            response.pictures && response.pictures.medium ? response.pictures.medium : response.picture
          );
        }

        deferred.resolve(userData);
      });

      return deferred.promise;
    },

    create: function (userObj) {
      return API._post('user', null, {method: 'create'}, userObj);
    },

    newCreate: function (userObj) {
      return API._post('user', null, {}, userObj);
    },

    tokenValidate: function (userObj) {
      return API._post('activate-user-validate', null, {}, userObj);
    },

    activateUser: function (userObj) {
      return API._post('activate-user', null, {}, userObj);
    },

    update: function (userid, userObj, token) {
      var filters;

      if (token) {
        filters = {
          usertoken: token,
          method: 'update'
        };
      }

      return API._post('user', userid, filters, userObj);
    },

    delete: function (userid, token) {
      var filters;

      if (token) {
        filters = {
          usertoken: token,
        };
      }

      return API._delete('user', userid, filters);
    },

    search: function (filters, token) {
      if (token) {
        filters.usertoken = token;
      }

      return API._get('user', null, filters);
    },

    validateField: function (field) {
      return API._get('user/validate', null, field);
    },

    getTickets: function (userid, filters, token) {
      var identifier = userid + '/tickets';

      if (token) {
        filters.usertoken = token;
      }

      return API._get('user', identifier, filters);
    },

    renameTicket: function (userid, ticketId, filters, postObject, token) {
      var identifier = userid + '/ticket/' + ticketId;

      if (token) {
        filters.usertoken = token;
      }

      return API._post('user', identifier, filters, postObject);
    },

    getEvents: function (userid, filters, token) {
      var identifier = userid + '/events';

      if (token) {
        filters.usertoken = token;
      }

      return API._get('user', identifier, filters);
    },

    getPhotoUrl: function (userid) {
      return ingresseApiPreferences.getHost() + '/user/' + userid + '/picture/' + API._generateAuthKey();
    },

    getUserSessionTickets: function (userId, sessionId, filters, token) {
      var identifier = userId + '/sessions/' + sessionId + '/tickets';

      if (token) {
        filters.usertoken = token;
      }

      return API._get('user', identifier, filters);
    },

    getAllUserSessions: function (userId, filters, token) {
      var identifier = userId + '/sessions/';

      if (token) {
        filters.usertoken = token;
      }

      return API._get('user', identifier, filters);
    },

    getTransfers: function (userId, filters, token) {
      var identifier = userId + '/transfers/';

      if (token) {
        filters.usertoken = token;
      }

      return API._get('user', identifier, filters);
    },

    getRecentsTransfers: function (userId, filters, token) {
      var identifier = userId + '/last-transfers';

      if (token) {
        filters.usertoken = token;
      }

      return API._get('user', identifier, filters);
    },

    getUserWallet: function (userId, filters, token) {
      var identifier = userId + '/wallet';

      if (token) {
        filters.usertoken = token;
      }

      return API._get('user', identifier, filters);
    }
  };

  API.sale = {
    getReport: function (filters, token) {
      if (token) {
        filters.usertoken = token;
      }

      return API._get('sale', null, filters);
    },

    get: function (transactionId, token) {
      var filters = {
        usertoken: token
      };

      return API._get('sale', transactionId, filters);
    },

    refund: function (transactionId, postObject, token) {
      var filters = {
        method: 'refund',
        usertoken: token
      };

      return API._post('sale', transactionId, filters, postObject);
    }
  };

  API.salesgroup = {
    get: function (filters, token) {
      if (!filters) {
        filters = {};
      }

      filters.usertoken = token;

      return API._get('salesgroup', null, filters);
    }
  };

  API.home = {
    getSections:  function () {
      return API._get('home', 'sections');
    },
    getCover: function () {
      return API._get('home', 'cover');
    }
  };

  API.freepass = {
    send: function (filters, postObject, token) {
      filters.usertoken = token;

      return API._post('freepass', null, filters, postObject);
    }
  };

  API.getFeaturedEvents = function (filters) {
    return API._get('featured', null, filters);
  };

  API.getEventCategory = function (category, filters) {
    return API._get(null, category, filters);
  };

  API.getRefundReasons = function () {
    return API._get('refundReasons');
  };

  API.login = {
    getAuthorizeUrl: function (returnUrl) {
      var url = 'https://www.ingresse.com/login';

      if (returnUrl) {
        url += '?returnUrl=' +
          API._urlencode(returnUrl);
      }

      return url;
    },
    getLogoutURL: function () {
      var url = ingresseApiPreferences.getHost() + '/logout' + API._generateAuthKey();
      return url + '&returnurl=' + API._urlencode(ingresseApiPreferences.loginReturnUrl);
    },
    direct: function (postObject) {
      return API._post('login', null, null, postObject);
    },
    facebook: function (postObject) {
      return API._post('login', 'facebook', null, postObject);
    },
    renewToken: function (filters, token) {
      filters.usertoken = token;
      return API._get('login','renew-token', filters);
    }
  };

  API.recover = {
    recoverPassword: function (postObjects) {
      return API._post('recover-password', null, null, postObjects);
    },
    validateHash: function (postObjects) {
      return API._post('recover-validate', null, null, postObjects);
    },
    updatePassword: function (postObjects) {
      return API._post('recover-update-password', null, null, postObjects);
    }
  };

  API.register = function () {
    var url = ingresseApiPreferences.getHost() + '/register' + API._generateAuthKey();
    return url + '&returnurl=' + API._urlencode(ingresseApiPreferences.loginReturnUrl);
  };

  API.getLoginWithFacebookUrl = function () {
    var url = ingresseApiPreferences.getHost() + '/authorize/facebook' + API._generateAuthKey() + '&returnurl=' + API._urlencode(ingresseApiPreferences.loginReturnUrl);
    return url;
  };

  API.getRegisterWithFacebookUrl = function () {
    var url = ingresseApiPreferences.getHost() + '/register-from-facebook' + API._generateAuthKey() + '&returnurl=' + API._urlencode(ingresseApiPreferences.loginReturnUrl);
    return url;
  };

  API.ticketReservation = function (eventId, userId, token, tickets, discountCode, passkey, extra) {
    var filters = {
      usertoken: token
    };

    var postObject = {
      eventId: eventId,
      userId : userId,
      tickets: tickets,
    };

    if (passkey) {
      postObject.passkey = passkey;
    }

    if (discountCode) {
      postObject.discountCode = discountCode;
    }

    angular.extend(postObject, extra);

    return API._post('shop', null, filters, postObject);
  };

    API.payReservation = function (eventId, userId, token, transactionId, tickets, paymentMethod, creditCard, installments, passkey, postback) {
        var deferred = $q.defer();
        var self = this;
        var url = (
            ingresseApiPreferences.getHost() +
            '/shop/' +
            self._generateAuthKey() +
            '&usertoken=' +
            token
        );

        var transaction = {
            transactionId: transactionId,
            paymentMethod: paymentMethod,
            userId: userId,
            eventId: eventId,
            tickets: tickets,
            passkey: passkey,
        };

        // Bank Billet payment
        if (paymentMethod === ingressePaymentType.BANKSLIP) {
            $http.post(url, transaction)
            .catch(deferred.reject)
            .then(function (response) {
                response = response.data;

                if (!response.responseData.data) {
                    return deferred.reject(
                        'Desculpe, houve um erro ao tentar gerar o boleto. ' +
                        'Por favor entre em contato com a Ingresse pelo número ' +
                        '(11) 4264-0718.'
                    );
                }

                if (response.responseData.data.status === 'declined') {
                    return deferred.reject(response.responseData.data.message);
                }

                deferred.resolve(response.responseData.data);
            });

            return deferred.promise;
        }

        // Credit Card payment
        if (paymentMethod === ingressePaymentType.CREDITCARD) {
            transaction.creditcard = creditCard;

            if (installments) {
                transaction.installments = installments;
            }

            if (postback) {
                transaction.postback = 1;
            }

            $http.post(url, payment.creditCardPayment(transaction))
            .catch(deferred.reject)
            .then(function (response) {
                response = response.data;

                deferred.resolve(response.responseData);
            });

            return deferred.promise;
        }

        // Generic payment
        $http.post(url, payment.genericPayment(transaction))
        .catch(deferred.reject)
        .then(function (response) {
            response = response.data;

            deferred.resolve(response.responseData);
        });

        return deferred.promise;
    };

  /**
   * Pay for reserved tickets
   * @param {object}  transaction - Transaction object
   * @param {integer} transaction.eventId - Event id
   * @param {integer} transaction.userId - The id of the user paying
   * @param {object}  transaction.gateway - The gateway used by the event
   * @param {string}  transaction.transactionId - The transaction id
   * @param {string}  transaction.paymentMethod - The payment method
   * @param {object}  [transaction.creditcard] - The creditcard information
   * @param {integer} transaction.installments - The number of installmetns
   * @param {string}  [transaction.passkey] - The passkey used to buy the ticket
   * @param {boolean} [transaction.postback] - If it will use postback or not
   * @param {string}  token - The token of the user paying
   */
  API.pay = function (transaction, token) {
    var payment  = new Payment(),
        url      = ingresseApiPreferences.getHost() + '/shop/' + this._generateAuthKey() + '&usertoken=' + token,
        deferred = $q.defer();

    // Configure payment service
    payment
      .setGateway()
      .setTransaction(transaction)
    ;

    // Execute payment
    payment.execute()
      .then(function (transaction) {
        // Send date to api
        $http.post(url, transaction)
          .then(function (response) {
            response = response.data;

            deferred.resolve(response.responseData.data);
          })
          .catch(function (error) {
            deferred.reject(error);
          });
      })
      .catch(function (error) {
        deferred.reject(error);
      });

    return deferred.promise;
  };

  /**
   * Get User Wallet (new)
   */
  API.getWallet = function () {
    var deferred = $q.defer();

    API._get('wallet', '', { usertoken: true })
    .catch(deferred.reject)
    .then(deferred.resolve);

    return deferred.promise;
  };

  /**
   * Get PayPal Express Checkout Token
   *
   * @return {Promise}
   */
  API.getPayPalExpressCheckoutToken = function () {
    var deferred = $q.defer();

    API._post('paypal', 'express-checkout', { usertoken: true })
    .catch(deferred.reject)
    .then(function (response) {
      deferred.resolve(response.token);
    });

    return deferred.promise;
  };

  /**
   * Set PayPal Billing Agreement
   *
   * @param {object} billingData
   * @param {object} billingData - token
   *
   * @return {Promise}
   */
  API.setPayPalBillingAgreement = function (billingData) {
    return API._post(
      'paypal',
      'billing-agreement',
      { usertoken: true },
      billingData
    );
  };

  /**
   * Add Credit Card to user's wallet
   *
   * @param {object} cardData
   *
   * @return {Promise}
   */
  API.walletCardAdd = function (cardData) {
    return API._post(
      'wallet/creditcard',
      '',
      { usertoken: true },
      cardData
    );
  };

  /**
   * Update a Credit Card in user's wallet
   *
   * @param {string} cardToken
   * @param {object} cardData
   *
   * @return {Promise}
   */
  API.walletCardUpdate = function (cardToken, cardData) {
    return API._put(
      'wallet/creditcard',
      cardToken,
      { usertoken: true },
      cardData
    );
  };

  /**
   * Remove Credit Card from user's wallet
   *
   * @param {string} cardToken
   *
   * @return {Promise}
   */
  API.walletCardRemove = function (cardToken) {
    return API._delete(
      '/wallet/creditcard',
      cardToken,
      { usertoken: true }
    );
  };

  return API;
});
