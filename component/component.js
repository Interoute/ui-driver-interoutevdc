define('ui/components/machine/driver-%%DRIVERNAME%%/component', ['exports', 'ember', 'ui/mixins/driver'],
	function(exports, _ember, _uiMixinsDriver) {
		exports['default'] = _ember['default'].Component.extend(_uiMixinsDriver['default'], {
		driverName: '%%DRIVERNAME%%',

		// Write your component here, starting with setting 'model' to a machine with your config populated
		bootstrap: function() {
			let config = this.get("store").createRecord({
				type: '%%DRIVERNAME%%Config',
				apiurl: 'https://myservices.interoute.com/myservices/api/vdc',
				apikey: '',
				secretkey: '',
				zoneid: null,
                                vdcregion: 'Europe',
                                networkid: null,
				templateid: null,
				serviceofferingid: null,
			});

			this.set('model', this.get('store').createRecord({
				type: 'machine',
				'%%DRIVERNAME%%Config': config
			}));
		},
		actions: {
		    cloudAuth: function() {
			    this.set('step', 2);
			    this.apiRequest('listZones').then((res) => {
		            let zones = [];
		            res.listzonesresponse.zone.forEach((zone) => {
		                let obj = {
		                    id: zone.id,
		                    name: zone.name
		                };
		                zones.push(obj);
		            });
		            this.set('avzones', zones);
		            this.set('step', 3);
		        }, (err) => {
		            let errors = this.get('errors') || [];
		            errors.pushObject(this.apiErrorMessage(err, '', '', 'Authentication failure'));
		            this.set('errors', errors);
		            this.set('step', 1);
		        });
		    },

		    selectZone: function() {
			this.set('step', 4);
			this.apiRequest('listNetworks', { zoneid: this.get('model.%%DRIVERNAME%%Config.zoneid') }).then((res) => {
			    let networks = [];
			    (res.listnetworksresponse.network || []).forEach((net) => {
			        let obj = {
			            id: net.id,
			            name: net.name,
			        };
			        networks.push(obj);
			    });
			    this.set('avnetworks', networks);
			    this.set('step', 5);

			}, (err) => {
			    let errors = this.get('errors') || [];
			    errors.pushObject(this.apiErrorMessage(err, '', '', 'WARNING No zone could be found!'));
			    this.set('errors', errors);
			    this.set('step', 3);
			});
		    },

		    selectNetwork: function() {
                        this.set('step', 6);
			let templatestype = [ { "id": "self", "name": "Private" }, { "id": "featured", "name": "Public" } ];
                        this.set('avtemplatestype', templatestype);
                        this.set('step', 7);
                    },

                    selectTemplateType: function() {
			this.set('step', 8);
			this.apiRequest('listTemplates', { templatefilter: this.get('model.%%DRIVERNAME%%Config.templatefilter'), zoneid: this.get('model.%%DRIVERNAME%%Config.zoneid') }).then((res) => {
 	                    let templates = [];
			    (res.listtemplatesresponse.template || []).forEach((temp) => {
                                let obj = {
                                    id: temp.id,
                                    name: temp.name
                                };
                                templates.push(obj);
                            });
                            this.set('avtemplates', templates);
                            this.set('step', 9);
		        }, (err) => {
                            let errors = this.get('errors') || [];
                            errors.pushObject(this.apiErrorMessage(err, '', '', 'No templates could be found!'));
                            this.set('errors', errors);
                            this.set('step', 3);
                        });
                    },

                    selectTemplate: function() {
			this.set('step', 10);
                        this.apiRequest('listServiceOfferings', { issystem: 'false' }).then((res) => {
                            let serviceofferings = [];
                            (res.listserviceofferingsresponse.serviceoffering || []).forEach((servoff) => {
                                let obj = {
                                    id: servoff.id,
                                    name: servoff.name
                                };
                                serviceofferings.push(obj);
                            });
                            this.set('avservofferings', serviceofferings);
                            this.set('step', 11);
                        }, (err) => {
                            let errors = this.get('errors') || [];
                            errors.pushObject(this.apiErrorMessage(err, '', '', 'No service offerings found!'));
                            this.set('errors', errors);
                            this.set('step', 3);
                        });
                    },

		    setInstance: function() {
			this.set('step', 12);
			this.set('step', 13);
	  	    }
		},

		apiRequest: function(command, params) {
		    let url		= this.get('app.proxyEndpoint') + '/' + this.get('model.%%DRIVERNAME%%Config.apiurl');
		    params		= params || {};
		    params.command	= command;
		    params.apiKey	= this.get('model.%%DRIVERNAME%%Config.apikey');
                    params.region	= this.get('model.%%DRIVERNAME%%Config.vdcregion');
		    params.response	= 'json';

		    return this.ajaxPromise({url: url, method: 'POST', dataType: 'json',
							headers: {
								'Accept': 'application/json',
								'X-API-Headers-Restrict': 'Content-Length'
							},
							beforeSend: (xhr, settings) => {
								xhr.setRequestHeader('Content-Type', 'rancher:' + settings.contentType);
								let qs = settings.data.split('&')
									.map((q) => q.replace(/\+/g, '%20'))
									.map(Function.prototype.call, String.prototype.toLowerCase)
									.sort()
									.join('&');
									settings.data += '&signature=' + encodeURIComponent(AWS.util.crypto.hmac(
										this.get('model.%%DRIVERNAME%%Config.secretkey'), qs, 'base64', 'sha1'));
									return true;
							},
							data: params}, true);
		},

		ajaxPromise: function(opt, justBody) {
		    var promise = new Ember.RSVP.Promise(function(resolve,reject) {
		    Ember.$.ajax(opt).then(success,fail);
		    function success(body, textStatus, xhr) {
			if ( justBody === true ){
			    resolve(body, 'AJAX Response: '+ opt.url + '(' + xhr.status + ')');
			}
			else {
			    resolve({xhr: xhr, textStatus: textStatus},'AJAX Response: '+ opt.url + '(' + xhr.status + ')');
			}}
			function fail(xhr, textStatus, err) {
			    reject({xhr: xhr, textStatus: textStatus, err: err}, 'AJAX Error:' + opt.url + '(' + xhr.status + ')');
			}
			},'Raw AJAX Request: '+ opt.url);
		    return promise;
		},

		apiErrorMessage: function(err, kind, prefix, def) {
		    let answer	= (err.xhr || {}).responseJSON || {};
		    let text	= (answer[kind] || {}).errortext;
			if (text) {
			    return prefix + ": " + text;
			} else {
			    return def;
			}
		},

		// Any computed properties or custom logic can go here
		step: 1,
		isStep1: Ember.computed.equal('step', 1),
		isStep2: Ember.computed.equal('step', 2),
		isStep3: Ember.computed.equal('step', 3),
		isStep4: Ember.computed.equal('step', 4),
		isStep5: Ember.computed.equal('step', 5),
		isStep6: Ember.computed.equal('step', 6),
		isStep7: Ember.computed.equal('step', 7),
                isStep8: Ember.computed.equal('step', 8),
                isStep9: Ember.computed.equal('step', 9),
                isStep10: Ember.computed.equal('step', 10),
                isStep11: Ember.computed.equal('step', 11),
		isStep12: Ember.computed.equal('step', 12),
		isStep13: Ember.computed.equal('step', 13),
		isGteStep3: Ember.computed.gte('step', 3),
		isGteStep5: Ember.computed.gte('step', 5),
		isGteStep7: Ember.computed.gte('step', 7),
                isGteStep9: Ember.computed.gte('step', 9),
		isGteStep11: Ember.computed.gte('step', 11),
		isGteStep13: Ember.computed.gte('step', 13),
	});
});
