window.addEventListener("message", receiveMessage, false);

function receiveMessage(event)
{
  if (event.origin !== "http://closepopup.ingresse.com.s3-website-us-east-1.amazonaws.com"){
  	return;
  }

  var obj = JSON.parse(event.data);
  angular.element(document.body).scope().$broadcast('ingresseAPI.userHasLogged',obj);
}

angular.module('ingresseSDK',['venusUI']).provider('ingresseAPI',function() {
	var publickey;
	var privatekey;
	PagarMe.encryption_key = "ek_live_lMsy9iABVbZrtgpd7Xpb9MMFgvjTYQ";
	//PagarMe.encryption_key = "ek_test_8vbegf4Jw85RB12xPlACofJGcqIabb";

	return{
		publickey: publickey,
		privatekey: privatekey,
		setPublicKey: function(key){
		  publickey = key;
		},
		setPrivateKey: function(key){
		  privatekey = key;
		},
		$get: function($http,$rootScope,VenusActivityIndicatorService, $q){
			return {
				publickey: publickey,
				privatekey: privatekey,
				host: 'https://api.ingresse.com',
				//host: 'http://ingresse-api.dev',

				// ENCODE ANY STRING TO BE USED IN URLS
				urlencode: function(str){
					str = (str + '')
					.toString();

					return encodeURIComponent(str)
					.replace(/!/g, '%21')
					.replace(/'/g, '%27')
					.replace(/\(/g, '%28')
					.replace(/\)/g, '%29')
					.replace(/\*/g, '%2A')
					.replace(/%20/g, '+');
				},

				/*	GENERATES THE PROPER AUTHENTICATION KEY FOR API CALLS, NEED THE PRIVATE AND PUBLIC KEYS OF APPLICATION SETTED WITH ingresseAPIProvider.

					Ex:
					angular.module('yourAppModuleName').config(function(ingresseAPIProvider){
						ingresseAPIProvider.setPublicKey('your public key');
						ingresseAPIProvider.setPrivateKey('your private key');
					});

					RETURNS THE STRING TO BE USED ON API CALLS.
				*/
				generateAuthKey : function(){
					var formatTwoCaracters = function(value){
						if(value < 10){
						  value = "0" + value;
						}
						return value;
					}

					var now = new Date();
					var UTCYear = now.getUTCFullYear();
					var UTCMonth = formatTwoCaracters(now.getUTCMonth() + 1);
					var UTCDay = formatTwoCaracters(now.getUTCDate());
					var UTCHours = formatTwoCaracters(now.getUTCHours());
					var UTCMinutes = formatTwoCaracters(now.getUTCMinutes());
					var UTCSeconds = formatTwoCaracters(now.getUTCSeconds());

					var timestamp = UTCYear + "-" + UTCMonth + "-" + UTCDay + "T" + UTCHours + ":" + UTCMinutes + ":" + UTCSeconds + "Z";
					var data1 = this.publickey + timestamp;
					var data2 = CryptoJS.HmacSHA1(data1, this.privatekey);
					var computedSignature = data2.toString(CryptoJS.enc.Base64);
					var authenticationString = "?publickey=" + this.publickey + "&signature=" + this.urlencode(computedSignature) + "&timestamp=" + this.urlencode(timestamp);

					return authenticationString;
				},

				/* CREATES A NEW LIST OF TICKETS WITH THE NECESSARY STRUCTURE TO SEND TO API

					PARAMETERS
					tickets = [
						{
							validTo: <moment.js object>,
							id: '',
							type: '',
							quantitySelected: '' //number of tickets the user selected.
						}
					]
				*/
				ticketToDTO: function(tickets){
					var ticketsDTO = [];

					for (var i = tickets.length - 1; i >= 0; i--) {
						var ticketDTO = {
							session:{
								date: tickets[i].validTo.format('DD/M/YYYY'),
								time: tickets[i].validTo.format('HH:MM:SS')
							},
							ticketTypeId: tickets[i].id,
							type: tickets[i].type,
							quantity: tickets[i].quantitySelected
						}

						ticketsDTO.push(ticketDTO);
					};

					return ticketsDTO;
				},

				// GET EVENT
				getEvent: function(eventId){
					var url = this.host + '/event/' + eventId + this.generateAuthKey();
					VenusActivityIndicatorService.startActivity('Carregando dados do evento...');

					return $http.get(url)
					.error(function(error){
						VenusActivityIndicatorService.error('Não foi possível carregar os dados do evento...');
					})
					.finally(function(error){
						VenusActivityIndicatorService.stopActivity('Carregando dados do evento...');
					});
				},


				// GET TICKETS OF EVENT
				getEventTickets: function(eventId){
					var url = this.host + '/event/' + eventId + '/tickets/' + this.generateAuthKey();
					VenusActivityIndicatorService.startActivity("Carregando ingressos...");

					return $http.get(url)
					.catch(function(error){
						VenusActivityIndicatorService.error('Não foi possível carregar os ingressos do evento...');
					})
					.finally(function(){
						VenusActivityIndicatorService.stopActivity("Carregando ingressos...");
					});
				},

				// GET USER INFO
				getUser: function(userid, token){
					var url = this.host + '/user/'+ userid + this.generateAuthKey() + '&usertoken=' + token + '&fields=id,name,lastname,username,email,cellphone,phone,token,street,district,city,state,zip,number,complement';

					VenusActivityIndicatorService.startActivity('Carregando dados do usuário...');

					return $http.get(url).then(function(result) {
						VenusActivityIndicatorService.stopActivity('Carregando dados do usuário...');

						if(result.status != 200){
							VenusActivityIndicatorService.error('Erro ao carregar dados do usuário...',result.statusText);
							return;
						}

						return result.data;
					});
				},


				/* UPDATE USER INFO

					PARAMETERS
					userObj = {
						name: '',
						lastname: '',
						street: '',
						number: '',
						complement: '',
						district: '',
						city: '',
						state: '',
						zip: '',
						phone: ''
					}
				*/
				updateUserInfo: function(userid, token, userObj){
					var url = this.host + '/user/' + userid + this.generateAuthKey() + '&usertoken=' + token + '&method=update';
					VenusActivityIndicatorService.startActivity('Salvando seu cadastro...');
					return $http.post(url,userObj).then(function(response){
						VenusActivityIndicatorService.stopActivity('Salvando seu cadastro...');
						if(response.status != 200){
							VenusActivityIndicatorService.error('Houve um problema ao tentar salvar o endereço, tente novamente.',response.statusText);
							return false;
						}

						return true;
					});
				},

				getUserPhotoUrl: function(userid){
					return this.host + '/user/'+ userid +'/picture/' + this.generateAuthKey();
				},

				login: function(email, password){
					var url = this.host + '/authorize/' + this.generateAuthKey();
					if(email && password){
						var data = {
							email: email,
							password: password
						}
						return $http.post(url,data);
					}else{
						return window.open(url + '&returnurl=' + this.urlencode('http://closepopup.ingresse.com.s3-website-us-east-1.amazonaws.com'),"",'toolbar=no,location=no,directories=no,status=no, menubar=no,scrollbars=no,resizable=yes,width=800,height=600');
					}
				},

				ticketReservation: function(eventId, userId, token, tickets, discountCode){
					if(!VenusActivityIndicatorService.startActivity('Reservando Ingressos...')){
						return;
					}

					var url = this.host + '/shop/' + this.generateAuthKey() + '&usertoken=' + token;

					var reservation = {
						eventId: eventId,
						userId: userId,
						tickets: this.ticketToDTO(tickets),
						discountCode: discountCode
					}

					return $http.post(url,reservation)
						.then(function(response){
							if(response.status != 200){
								VenusActivityIndicatorService.error('Erro ao reservar ingressos. ' + response.statusText);
								return response;
							}

							if(response.data.responseData.data.status == 'declined'){
								VenusActivityIndicatorService.error('Erro ao reservar ingressos. ' + response.responseData.message);
								return response;
							}
							return response;
						})
						.finally(function(){
							VenusActivityIndicatorService.stopActivity('Reservando Ingressos...');
						});
				},

				createPagarmeCard: function(transaction){

					//Create hash for pagar.me
					var creditCard = new PagarMe.creditCard();
					creditCard.cardHolderName = transaction.creditcard.name.toString();
					creditCard.cardExpirationMonth = transaction.creditcard.month.toString();
					creditCard.cardExpirationYear = transaction.creditcard.year.toString();
					creditCard.cardNumber = transaction.creditcard.number.toString();
					creditCard.cardCVV = transaction.creditcard.cvv.toString();

					// pega os erros de validação nos campos do form
					var fieldErrors = creditCard.fieldErrors();

					//Verifica se há erros
					var hasErrors = false;
					for(var field in fieldErrors) { hasErrors = true; break; }

					if(hasErrors) {
						var cardErrors = '';
						for (var key in fieldErrors){
							cardErrors += ' ' + fieldErrors[key];
						}
						VenusActivityIndicatorService.error('Verifique os dados do cartão -' + cardErrors);

						return;
					} else {
						// se não há erros, retorna o cartão...
						transaction.creditcard.pagarme = creditCard;
						return transaction;
					}
				},
				postTransaction: function(transaction){
					VenusActivityIndicatorService.startActivity('Realizando o pagamento...');
					var url = this.host + '/shop/' + this.generateAuthKey() + '&usertoken=' + token;

					return $http.post(url,transactionDTO)
						.then(function(response){

							VenusActivityIndicatorService.stopActivity('Realizando o pagamento...');

							// NETWORK ERROR
							if(response.status != 200){
								VenusActivityIndicatorService.error('Erro ao tentar realizar o pagamento, tente novamente.',response.statusText);
								deferred.reject();
							}

							// BUSINESS ERROR
							if(!response.data.responseData.data){
								VenusActivityIndicatorService.error('Erro ao tentar realizar o pagamento, tente novamente.',response.responseData);
								deferred.reject();
							}

							// PAGAR.ME ERROR
							if(response.data.responseData.data.status == 'declined'){
								VenusActivityIndicatorService.error('Desculpe, por algum motivo seu cartão foi recusado, tente novamente utilizando outro cartão.',response);
								deferred.reject();
							}

							// LIFE IS GOOD, CREDIT IS GOOD!
							if(response.responseData.data.status == 'approved'){
								deferred.resolve(response.data);
							}
						});
				},

				payReservation: function(eventId, userId, token, tickets, creditCardCpf, transactionId, paymentMethod, creditCardNumber, creditCardHolderName, creditCardExpirationYear, creditCardExpirationMonth, creditCardCVV, discountCode) {

					var deferred = $q.defer();

					var self = this;

					var currentTransaction = {
						transactionId: transactionId,
						userId: userId,
						eventId: eventId,
						tickets: this.ticketToDTO(tickets),
						paymentMethod: paymentMethod,
						discountCode: discountCode,
						creditcard: {
							cpf: creditCardCpf,
							number: creditCardNumber,
							name: creditCardHolderName,
							year: creditCardExpirationYear,
							month: creditCardExpirationMonth,
							cvv: creditCardCVV
						}
					}

					var transactionDTO = this.createPagarmeCard(currentTransaction);

					if(!transactionDTO){
						deferred.reject();
						return deferred.promise;
					}

					VenusActivityIndicatorService.startActivity('Criptografando dados do cartão...');

					transactionDTO.creditcard.pagarme.generateHash(function(hash){
						VenusActivityIndicatorService.stopActivity('Criptografando dados do cartão...');
						transactionDTO.creditcard = {
							cardHash: hash,
							cpf: transactionDTO.creditcard.cpf
						}

						VenusActivityIndicatorService.startActivity('Realizando o pagamento...');

						var url = self.host + '/shop/' + self.generateAuthKey() + '&usertoken=' + token;

						deferred.resolve($http.post(url,transactionDTO)
							.then(function(response){

								VenusActivityIndicatorService.stopActivity('Realizando o pagamento...');

								// NETWORK ERROR
								if(response.status != 200){
									VenusActivityIndicatorService.error('Erro ao tentar realizar o pagamento, tente novamente.',response.statusText);
									deferred.reject();
								}

								// PAGAR.ME ERROR
								if(response.data.responseData.data.status == 'declined'){
									VenusActivityIndicatorService.error('Desculpe, por algum motivo seu cartão foi recusado, tente novamente utilizando outro cartão.',response);
									deferred.reject();
								}

								// LIFE IS GOOD, CREDIT IS GOOD!
								if(response.data.responseData.data.status == 'approved'){
									deferred.resolve(response.data);
								}
							}));
					});

					return deferred.promise;
				}
			}
		}
	}
});