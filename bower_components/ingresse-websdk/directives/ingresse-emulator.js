'use strict';

/**
* ingresse.emulator Module
*
* Description
*/

angular.module('ingresse.emulator', ['ingresseSDK']).directive('ingresseEmulator', function (ingresseAPI_Preferences) {
  // Runs during compile
  return {
    scope: {}, // {} = isolate, true = child, false/undefined = no change
    controller: function ($scope, ipCookie, ingresseAPI, ingresseAPI_Preferences, IngresseAPI_UserService, IngresseAPI_Freepass, VenusActivityIndicatorService) {
      $scope.domain = ingresseAPI_Preferences._host;
      $scope.httpCalls = ingresseAPI_Preferences.httpCalls;
      $scope.result = {};
      $scope.collapsed = false;
      $scope.user = {};
      $scope.eventListForm = {};

      $scope.resetResponses = function () {
        // $scope.clearHttpHistory();
        $scope.responseUser = null;
        $scope.result = {};
      };

      $scope.setHost = function (host) {
        if (!host || host === '') {
          return;
        }

        ipCookie('host', host, {expires: 365});
        ingresseAPI_Preferences.setHost(host);
        $scope.domain = ingresseAPI_Preferences._host;
      };

      $scope.setPrivateKey = function (key) {
        ingresseAPI_Preferences.setPrivateKey(key);
      };

      $scope.setPublicKey = function (key) {
        ingresseAPI_Preferences.setPublicKey(key);
      };

      $scope.clearHttpHistory = function () {
        ingresseAPI_Preferences.clearHttpHistory();
      };

      $scope.updateTicketStatusAddTicket = function () {
        $scope.updateTicketStatusData.tickets.push({
          ticketCode: '',
          ticketStatus: '',
          ticketTimestamp: $scope.generateTimestamp()
        });
      };

      $scope.updateTicketStatusRemoveTicket = function (ticket) {
        var i;

        for (i = $scope.updateTicketStatusData.tickets.length - 1; i >= 0; i--) {
          if ($scope.updateTicketStatusData.tickets[i] === ticket) {
            $scope.updateTicketStatusData.tickets.splice(i, 1);
          }
        }
      };

      $scope.getEvent = function (form) {
        $scope.resetResponses();
        VenusActivityIndicatorService.startActivity('Carregando Eventos...');
        ingresseAPI.getEvent(form.id, form.fields, $scope.user.token)
          .then(function (response) {
            $scope.result = response;
          })
          .catch(function (error) {
            VenusActivityIndicatorService.error(error);
          })
          .finally(function () {
            VenusActivityIndicatorService.stopActivity('Carregando Eventos...');
          });
      };

      $scope.getError = function (errorClass) {
        $scope.resetResponses();
        VenusActivityIndicatorService.startActivity('Carregando lista de erros...');
        ingresseAPI.getError(errorClass)
          .then(function (response) {
            $scope.result = response;
          })
          .catch(function (error) {
            VenusActivityIndicatorService.error(error);
          })
          .finally(function () {
            VenusActivityIndicatorService.stopActivity('Carregando lista de erros...');
          });
      };

      $scope.getEventList = function (form) {
        $scope.resetResponses();
        VenusActivityIndicatorService.startActivity('Carregando Eventos...');
        ingresseAPI.getEventList(form.fields, form.filters, form.page, form.pageSize)
          .then(function (response) {
            $scope.result = response;
          })
          .catch(function (error) {
            VenusActivityIndicatorService.error(error);
          })
          .finally(function () {
            VenusActivityIndicatorService.stopActivity('Carregando Eventos...');
          });
      };

      $scope.getEventTickets = function (form) {
        $scope.resetResponses();
        VenusActivityIndicatorService.startActivity('Carregando Ingressos...');
        ingresseAPI.getEventTickets(form.id)
          .then(function (response) {
            $scope.result = response;
          })
          .catch(function (error) {
            VenusActivityIndicatorService.error(error);
          })
          .finally(function () {
            VenusActivityIndicatorService.stopActivity('Carregando Ingressos...');
          });
      };

      $scope.getUser = function (form) {
        $scope.resetResponses();
        VenusActivityIndicatorService.startActivity('Carregando dados do usuário...');
        ingresseAPI.getUser(form.id, $scope.user.token, form.fields)
          .then(function (response) {
            $scope.responseUser = angular.copy(response);
            $scope.result = response;
          })
          .catch(function (error) {
            VenusActivityIndicatorService.error(error);
          })
          .finally(function () {
            VenusActivityIndicatorService.stopActivity('Carregando dados do usuário...');
          });
      };

      $scope.getUserTickets = function (form) {
        $scope.resetResponses();
        VenusActivityIndicatorService.startActivity('Carregando ingressos do usuário...');
        ingresseAPI.getUserTickets(form.id, $scope.user.token, form.fields, form.filters)
          .then(function (response) {
            $scope.result = response;
          })
          .catch(function (error) {
            VenusActivityIndicatorService.error(error);
          })
          .finally(function () {
            VenusActivityIndicatorService.stopActivity('Carregando ingressos do usuário...');
          });
      };

      $scope.getUserEvents = function (form) {
        $scope.resetResponses();
        VenusActivityIndicatorService.startActivity('Carregando eventos do usuário...');
        ingresseAPI.getUserEvents(form.id, $scope.user.token, form.fields, form.filters, form.page, form.pageSize)
          .then(function (response) {
            $scope.result = response;
          })
          .catch(function (error) {
            VenusActivityIndicatorService.error(error);
          })
          .finally(function () {
            VenusActivityIndicatorService.stopActivity('Carregando eventos do usuário...');
          });
      };

      $scope.updateTicketStatus = function () {
        $scope.resetResponses();
        VenusActivityIndicatorService.startActivity('Alterando status dos ingressos...');
        ingresseAPI.updateTicketStatus($scope.updateTicketStatusData.eventid, $scope.user.token, $scope.updateTicketStatusData.tickets)
          .then(function (response) {
            $scope.result = response;
          })
          .catch(function (error) {
            VenusActivityIndicatorService.error(error);
          })
          .finally(function () {
            VenusActivityIndicatorService.stopActivity('Alterando status dos ingressos...');
          });
      };

      $scope.getCheckinReport = function () {
        $scope.resetResponses();
        VenusActivityIndicatorService.startActivity('Carregando dados do relatório de entrada...');
        ingresseAPI.getCheckinReport($scope.checkinReportForm.eventId, $scope.user.token)
          .then(function (response) {
            $scope.result = response;
          })
          .catch(function (error) {
            VenusActivityIndicatorService.error(error);
          })
          .finally(function () {
            VenusActivityIndicatorService.stopActivity('Carregando dados do relatório de entrada...');
          });
      };

      $scope.getGuestList = function () {
        $scope.resetResponses();
        VenusActivityIndicatorService.startActivity('Carregando lista de convidados...');
        ingresseAPI.getGuestList($scope.guestListForm.eventId, $scope.user.token, $scope.guestListForm.fields, $scope.guestListForm.filters)
          .then(function (response) {
            $scope.result = response;
          })
          .catch(function (error) {
            VenusActivityIndicatorService.error(error);
          })
          .finally(function () {
            VenusActivityIndicatorService.stopActivity('Carregando lista de convidados...');
          });
      };

      $scope.getTransactionData = function () {
        $scope.resetResponses();
        VenusActivityIndicatorService.startActivity('Carregando dados da transação...');
        ingresseAPI.getTransactionData($scope.transactionDataForm.transactionId, $scope.user.token, $scope.transactionDataForm.fields)
          .then(function (response) {
            $scope.result = response;
          })
          .catch(function (error) {
            VenusActivityIndicatorService.error(error);
          })
          .finally(function () {
            VenusActivityIndicatorService.stopActivity('Carregando dados da transação...');
          });
      };

      $scope.updateUser = function (form) {
        $scope.resetResponses();
        VenusActivityIndicatorService.startActivity('Atualizando dados do usuário...');
        ingresseAPI.updateUserInfo(form.userId, $scope.user.token, form.userdata)
          .then(function (response) {
            $scope.result = response;
          })
          .catch(function (error) {
            VenusActivityIndicatorService.error(error);
          })
          .finally(function () {
            VenusActivityIndicatorService.stopActivity('Atualizando dados do usuário...');
          });
      };

      $scope.createTransaction = function () {
        $scope.resetResponses();
        VenusActivityIndicatorService.startActivity('Gerando Transação...');
        ingresseAPI.ticketReservation($scope.createTransactionData.eventId, $scope.createTransactionData.userId, $scope.user.token, $scope.createTransactionData.tickets, $scope.createTransactionData.discountCode)
          .then(function (response) {
            $scope.result = response;
          })
          .catch(function (error) {
            VenusActivityIndicatorService.error(error);
          })
          .finally(function () {
            VenusActivityIndicatorService.stopActivity('Gerando Transação...');
          });
      };

      $scope.payTransaction = function (form) {
        $scope.resetResponses();
        VenusActivityIndicatorService.startActivity('Pagando Transação...');
        ingresseAPI.payReservation(form.eventId, form.userId, $scope.user.token, form.transactionId, $scope.payTransactionFormData.tickets, form.paymentMethod, form.creditCard, form.installments)
          .then(function (response) {
            $scope.result = response;
          })
          .catch(function (error) {
            VenusActivityIndicatorService.error(error);
          })
          .finally(function () {
            VenusActivityIndicatorService.stopActivity('Pagando Transação...');
          });
      };

      $scope.freepass = function (form) {
        $scope.resetResponses();
        VenusActivityIndicatorService.startActivity('Validando cortesias...');
        IngresseAPI_Freepass.send(form.eventId, form.ticketTypeId, form.isHalfPrice, form.emails, form.validate, $scope.user.token)
          .then(function (response) {
            $scope.result = response;
          })
          .catch(function (error) {
            VenusActivityIndicatorService.error(error);
          })
          .finally(function () {
            VenusActivityIndicatorService.stopActivity('Validando cortesias...');
          });
      };

      $scope.getSales = function (form) {
        $scope.resetResponses();
        VenusActivityIndicatorService.startActivity('Carregando vendas...');

        var status = [];
        if (form.status) {
          if (form.status.approved) {
            status.push('approved');
          }
          if (form.status.declined) {
            status.push('declined');
          }
          if (form.status.pending) {
            status.push('pending');
          }

          if (status.length > 0) {
            form.filters.status = status.toString();
          }
        }

        ingresseAPI.getSales($scope.user.token, form.filters, form.page)
          .then(function (response) {
            $scope.result = response;
          })
          .catch(function (error) {
            VenusActivityIndicatorService.error(error);
          })
          .finally(function () {
            VenusActivityIndicatorService.stopActivity('Carregando vendas...');
          });
      };

      $scope.generateTimestamp = function () {
        var timestamp = new Date();
        return timestamp.getTime();
      };

      $scope.login = function () {
        IngresseAPI_UserService.login();
      };

      $scope.logout = function () {
        IngresseAPI_UserService.logout();
      };

      $scope.updateTicketStatusData = {
        tickets: [{
          ticketCode: '',
          ticketStatus: '',
          ticketTimestamp: $scope.generateTimestamp()
        }]
      };

      $scope.createTransactionData = {
        tickets: [{
          ticketTypeId: '',
          quantity: 0,
          type: 'Inteira',
          session: {
            date: '',
            time: ''
          }
        }]
      };

      $scope.payTransactionFormData = {
        tickets: [{
          ticketTypeId: '',
          quantity: 0,
          type: 'Inteira',
          session: {
            date: '',
            time: ''
          }
        }]
      };

      $scope.$on('userSessionSaved', function () {
        $scope.user = {
          token: IngresseAPI_UserService.token,
          id: IngresseAPI_UserService.userId
        };
      });

      $scope.$watch('privateKey', function () {
        // $document.cookie = "privateKey=" + $scope.privateKey + "; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
        if (!$scope.privateKey) {
          return;
        }
        ipCookie('privatekey', $scope.privateKey, {expires: 365});
      });

      $scope.$watch('publicKey', function () {
        if (!$scope.publicKey) {
          return;
        }
        // $document.cookie = "publicKey=" + $scope.publicKey + "; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
        ipCookie('publickey', $scope.publicKey, {expires: 365});
      });

      if (ipCookie('publickey') !== "") {
        ingresseAPI_Preferences.setPublicKey(ipCookie('publickey'));
      }

      if (ipCookie('privatekey') !== "") {
        ingresseAPI_Preferences.setPrivateKey(ipCookie('privatekey'));
      }

      if (ipCookie.host !== "") {
        $scope.setHost(ipCookie.host);
      }

      $scope.privateKey = ingresseAPI_Preferences.privatekey;
      $scope.publicKey = ingresseAPI_Preferences.publickey;
    },
    restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
    templateUrl: ingresseAPI_Preferences.templates_directory + 'ingresse-emulator.html'
  };
});
