'use strict';

angular.module('ingresseEmulatorApp')
  .config(function ($routeProvider) {
      $routeProvider
          .when('/hash', {
              templateUrl   : 'views/emulator.html',
              controller    : 'HashController',
              reloadOnSearch: false
          });
  })
  .controller('HashController', function ($scope, Payment, ingresseAPI, IngresseApiUserService, EmulatorService, QueryService) {
      $scope.request = {};

      /**
       * On view load get user credentias and
       * query params to fill up the form
       */
      $scope.$on('$viewContentLoaded', function () {
        $scope.credentials = IngresseApiUserService.credentials;

        QueryService.getSearchParams($scope.fields);
        QueryService.getSearchParams($scope.defaults);
      });

      /**
       * Generate card hash for pagarme and pagseguro
       */
      $scope.getHash = function () {
         $scope.isLoading = true;

         var params      = QueryService.getFiltersByTab($scope.fields.cardHash),
             transaction = $scope.formatTransactionParams(params);

         // If pagseguro get a gateway session first
         if (transaction.gateway.name === 'pagseguro') {
            $scope.generatePagseguroSession(params)
              .then(function (response) {
                // Set session from api response
                transaction.gateway.session = response.data.gateway.session;

                $scope.startPaymentProcess(transaction);
              });

         } else {
            $scope.startPaymentProcess(transaction);
         }
      };

      /**
       * Start payment process
       * @param {object} transaction - Transaction information
       */
      $scope.startPaymentProcess = function (transaction) {
         var payment = new Payment();

         // Set transaction and define the gateway
         payment
           .setTransaction(transaction)
           .setGateway();

         // Execute the payment to generate the cardhash and sender hash
         payment.execute()
           .then(function (response) {
             EmulatorService.addResponse(response, true);
           })
           .catch(function (error) {
             EmulatorService.addResponse(error, false);
           })
           .finally(function () {
             $scope.isLoading = false;
           });
      };

      /**
       * Generate pagseguro session
       * @param {object} params - Filled form params
       */
      $scope.generatePagseguroSession = function (params) {
        var tickets = [{
          quantity: 5,
          guestTypeId: params.guestTypeId
        }];

        return ingresseAPI.ticketReservation(
          params.eventId,
          $scope.credentials.userId,
          $scope.credentials.token,
          tickets
        );
      };

      /**
       * Format transaction params
       * @param {object} params - Filled form params
       */
      $scope.formatTransactionParams = function (params) {
        var transaction = {
          creditcard: {
            name  : params['creditcard.name'],
            number: params['creditcard.number'],
            month : params['creditcard.month'],
            year  : params['creditcard.year'],
            flag  : params['creditcard.flag'],
            cvv   : params['creditcard.cvv']
          },
          gateway: {
            name: params.gateway
          },
          paymentMethod: params.paymentMethod
        };

        return transaction;
      };

      /**
       * From fileds
       */
      $scope.fields = {
        cardHash: {
          label: 'Hash',
          action: $scope.getHash,
          authentication: true,
          fields: [{
            label: 'eventId',
            model: '15844',
            type: 'text',
            disabled: false
          }, {
            label: 'guestTypeId',
            model: '38907',
            type: 'text',
            disabled: false
          }, {
            label: 'paymentMethod',
            model: 'CartaoCredito',
            type: 'option',
            options: ['CartaoCredito', 'BoletoBancario'],
            disabled: false
          }, {
            label: 'gateway',
            model: '',
            type: 'option',
            options: ['pagarme', 'pagseguro'],
            disabled: false
          }, {
            label: 'creditcard.name',
            model: 'John Doe',
            type: 'text',
            disabled: false
          }, {
            label: 'creditcard.month',
            model: '01',
            type: 'option',
            options: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
            disabled: false
          }, {
            label: 'creditcard.year',
            model: '2020',
            type: 'option',
            options: ['2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023'],
            disabled: false
          }, {
            label: 'creditcard.number',
            model: '4111111111111111',
            type: 'text',
            disabled: false
          }, {
            label: 'creditcard.cvv',
            model: '123',
            type: 'text',
            disabled: false
          }, {
            label: 'creditcard.flag',
            model: 'visa',
            type: 'option',
            options: ['visa', 'mastercard', 'amex', 'diners', 'elo'],
            disabled: false
          }]
        }
      };
  });

