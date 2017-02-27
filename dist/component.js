define('ui/components/machine/driver-interoutevdc/component', ['exports', 'ember', 'ui/mixins/driver', 'ui/components/new-select/component'],
	function(exports, _ember, _uiMixinsDriver, _newSelect) { 
		var Ember = _ember.default;
		var DriverMixin = _uiMixinsDriver.default;
		var avServOfferingsArray = [];
		var changeServOffering = false;
		var serviceOfferingName; 
		exports['default'] = Ember.Component.extend(DriverMixin, {
		driverName: 'interoutevdc',
		config: Ember.computed.alias('model.interoutevdcConfig'),
		bootstrap: function(){
			let config = this.get("store").createRecord({
				type: 'interoutevdcConfig',
				apiurl: 'https://myservices.interoute.com/myservices/api/vdc',
				apikey: '',
				secretkey: '',
				zoneid: null,
                                vdcregion: '',
                                networkid: null,
				templateid: null,
				serviceofferingid: null,
				diskofferingid: null,
				disksize: null,
				cpu: 1,
				ram: 1
			});

                        let type = 'host';
                        if (!this.get('useHost')) {
                                type = 'machine';
                        }

			this.set('model', this.get('store').createRecord({
				type: type,
				'interoutevdcConfig': config
			}));

			let regions = [ { "id": "Asia", "name": "Asia" }, { "id": "Europe", "name": "EU" }, { "id": "USA", "name": "US" } ];
			if ( this.get('model.interoutevdcConfig.vdcregion') == '' ) {
				this.set('model.interoutevdcConfig.vdcregion', regions[0].id);
			}		
                        this.set('avregions', regions);
		}.on('init'),

		onDidRender: function(e) {
			let ele = $('#' + this.elementId).eq(0).find('.horizontal-form').not('.hide');
			let len = ele.length;
			let selectEle = ele.eq(len -1).find('select');
			let selectOpt = selectEle.find('option:selected');
			if (selectEle[0] !== undefined && selectEle[0].selectedIndex === 0 ) { 
				selectEle[0].selectedIndex = 1;
			}

			if (changeServOffering) {
				this.set('model.interoutevdcConfig.serviceOfferingName', this.get('model.interoutevdcConfig.ram') + '-' + this.get('model.interoutevdcConfig.cpu') );
				serviceOfferingName = this.get('model.interoutevdcConfig.ram') + '-' + this.get('model.interoutevdcConfig.cpu');
				changeServOffering = false;
			}
		}.on('didRender'),

		resetSiblingMenus:function(e) {
 			$('section.horizontal-form').removeClass('selected-item');
			$('select option[value="' + e.id +'"]').closest('section.horizontal-form').addClass('selected-item');

			var classStr= $('select option[value="' + e.id +'"]').closest('section.horizontal-form').attr('class');
			var start= $('select option[value="' + e.id +'"]').closest('section.horizontal-form').attr('class').indexOf('step');
			var end = classStr.substring(start + 4).indexOf(' ');
			var stepEdited = Number(classStr.substr(start + 4, end));
			this.set('step', stepEdited);

			$.each( $('section.horizontal-form.selected-item ~ section.horizontal-form select'), function(key, select){
				select.selectedIndex= 1;
			});
		},

		setRAMCPU(e) {
                       changeServOffering = true;
           	},
                      
		actions: {
		     setTransport(str){
			this.set('config.transport', str);
		     },

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
		            
			    this.set('model.interoutevdcConfig.zoneid', zones[0].id);
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
			this.apiRequest('listNetworks', { zoneid: this.get('model.interoutevdcConfig.zoneid') }).then((res) => {
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
			    this.set('model.interoutevdcConfig.networkid', networks[0].id);
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
   			if (this.get('model.interoutevdcConfig.templatefilter') == ''){
				this.set('model.interoutevdcConfig.templatefilter', templatestype[0].id);
			}
	                this.set('avtemplatestype', templatestype);
                        this.set('step', 7);
                    },

                    selectTemplateType: function() {
			this.set('step', 8);
                        if (this.get('model.interoutevdcConfig.templatefilter') == 'self'){
                            var templatekeyword = '';
                        } else {
                            var templatekeyword = 'ranchernode';
                        }
			this.apiRequest('listTemplates', { templatefilter: this.get('model.interoutevdcConfig.templatefilter'), zoneid: this.get('model.interoutevdcConfig.zoneid'), keyword: templatekeyword }).then((res) => {
			    let templates = [];
			    (res.listtemplatesresponse.template || []).forEach((temp) => {
                                let obj = {
                                    id: temp.id,
                                    name: temp.name
                                };
                                templates.push(obj);
                            });


		    	    if (templates.length == 0) {
				let errors = this.get('errors') || [];
                            	errors.pushObject(this.apiErrorMessage('', '', '', 'No templates could be found!'));
                            	this.set('errors', errors);
                            	this.set('step', 3);
			    } else {  
				this.set('model.interoutevdcConfig.templateid', templates[0].id);		
                            	this.set('avtemplates', templates);
                            	this.set('step', 9);
			    }


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
			    
			    	this.set('model.interoutevdcConfig.ram', 1);
				this.set('model.interoutevdcConfig.cpu', 1);
				this.set('model.interoutevdcConfig.serviceOfferingName', '1024-1'); 
			    
                            this.set('avservofferings', serviceofferings);
                            this.set('step', 11);
			    avServOfferingsArray.push(serviceofferings);
                        }, (err) => {
                            let errors = this.get('errors') || [];
                            errors.pushObject(this.apiErrorMessage(err, '', '', 'No service offerings found!'));
                            this.set('errors', errors);
                            this.set('step', 3);
                        });
                    },

		
       		 getServiceOfferingId: function() {         	
         			var result = this.apiRequest('listServiceOfferings', { issystem: 'false', name: this.get('model.interoutevdcConfig.serviceOfferingName') }).then((res) => {
				this.set('model.interoutevdcConfig.serviceofferingid', res.listserviceofferingsresponse.serviceoffering[0].id);			
				return this;
					
         		}, (err) => {
				let errors = this.get('errors') || [];
           			errors.pushObject(this.apiErrorMessage(err, '', '', 'Could not retrieve service offering id'));
				this.set('errors', errors);
         		});

                        this.apiRequest('listDiskOfferings').then((res) => {
                        	let diskofferings = [];
                        	diskofferings.push({ "id": null, "name": "No extra disks" });
                        	(res.listdiskofferingsresponse.diskoffering || []).forEach((diskoff) => {
                              		if ( diskoff.disksize == 0 ) {
                               			let obj = {
                                      		 id: diskoff.id,
                                       		 name: diskoff.name
                                      		};
                               			 diskofferings.push(obj);
                        		 }});
                        		this.set('avdiskofferings', diskofferings);
					this.set('model.interoutevdcConfig.disksize', null);
					this.set('model.interoutevdcConfig.diskofferingid', null);
                        	 	this.set('step', 13);
                       	 		}, (err) => {
                		            let errors = this.get('errors') || [];
                        		   errors.pushObject(this.apiErrorMessage(err, '', '', 'No disk offerings found!'));
                           			this.set('errors', errors);
                           		 	this.set('step', 3);
                       			});				
		    },

		    selectServiceOffering: function() {
                        this.set('step', 12);
                        this.apiRequest('listDiskOfferings').then((res) => {
                            let diskofferings = [];
			    diskofferings.push({ "id": null, "name": "No extra disks" });
                            (res.listdiskofferingsresponse.diskoffering || []).forEach((diskoff) => {
				if ( diskoff.disksize == 0 ) {
                            	    let obj = {
                                	    id: diskoff.id,
	                                    name: diskoff.name
        	                     };
                	             diskofferings.push(obj);
                            	}
			    });
                            this.set('avdiskofferings', diskofferings);
                            this.set('step', 13);
                        }, (err) => {
                            let errors = this.get('errors') || [];
                            errors.pushObject(this.apiErrorMessage(err, '', '', 'No disk offerings found!'));
                            this.set('errors', errors);
                            this.set('step', 3);
                        });
                    },

		    setRAMCPUOffering: function(e){
 			if (e.target.id == 'cpuoffering' && (this.get('model.interoutevdcConfig.cpu') >= 1 && this.get('model.interoutevdcConfig.cpu') < 16) ) {
				this.set('model.interoutevdcConfig.cpu', Number(e.target.value));
				var cpu = this.get('model.interoutevdcConfig.cpu');
                                var vram = this.get('model.interoutevdcConfig.ram');
                                this.set('model.interoutevdcConfig.serviceOfferingName', (vram * 1024) + '-' + cpu );

			}		

			if (e.target.id == 'vramoffering' && (  this.get('model.interoutevdcConfig.ram') >= 1 && this.get('model.interoutevdcConfig.ram') < 1024 )  ) {
				 this.set('model.interoutevdcConfig.ram', Number(e.target.value));
				 var cpu = this.get('model.interoutevdcConfig.cpu');
                                var vram = this.get('model.interoutevdcConfig.ram');
                                this.set('model.interoutevdcConfig.serviceOfferingName', (vram * 1024) + '-' + cpu );

			}
	
			if (this.get('model.interoutevdcConfig.cpu') <= 0) {
				this.set('model.interoutevdcConfig.cpu', 1);
				$('#cpuoffering').val('1');
			}

			if (this.get('model.interoutevdcConfig.cpu') > 16) {
                                this.set('model.interoutevdcConfig.cpu', 16);
				$('#cpuoffering').val('16')
                        }

			// max min vRAM
			if (this.get('model.interoutevdcConfig.ram') <= 0) {
                                this.set('model.interoutevdcConfig.ram', 1);
				$('#vramoffering').val('1');
                        }

                        if (this.get('model.interoutevdcConfig.ram') > 1024) {
                           this.set('model.interoutevdcConfig.ram', 1024);
				$('#vramoffering').val('1024')
			}

                    },


                    lessCPU: function(e){
			if ( this.get('model.interoutevdcConfig.cpu') > 1  ) {
				var cpu = this.get('model.interoutevdcConfig.cpu') - 1;
				var vram = this.get('model.interoutevdcConfig.ram');
				this.set('model.interoutevdcConfig.cpu', cpu  ); 
				this.set('model.interoutevdcConfig.serviceOfferingName', (vram * 1024) + '-' + cpu );
			}		
                    },

                    moreCPU: function(e){
			if ( this.get('model.interoutevdcConfig.cpu') < 16  ) {
                                var cpu = this.get('model.interoutevdcConfig.cpu') + 1;
				var vram = this.get('model.interoutevdcConfig.ram');
				this.set('model.interoutevdcConfig.cpu', cpu );
                      		this.set('model.interoutevdcConfig.serviceOfferingName', (vram * 1024) + '-' + cpu );
			 }
                    },

		    lessVRAM: function(e){
			if ( this.get('model.interoutevdcConfig.ram') > 1  ) {
                                var vram = this.get('model.interoutevdcConfig.ram') / 2;
				this.set('model.interoutevdcConfig.ram', vram );
                                this.set('model.interoutevdcConfig.serviceOfferingName', (vram * 1024) + '-' + this.get('model.interoutevdcConfig.cpu') );
                        }
               	    },

               	    moreVRAM: function(e){
			if ( this.get('model.interoutevdcConfig.ram') < 64  ) {
                                var vram = this.get('model.interoutevdcConfig.ram') * 2;
				this.set('model.interoutevdcConfig.ram', vram );
                                this.set('model.interoutevdcConfig.serviceOfferingName', (vram * 1024) + '-' + this.get('model.interoutevdcConfig.cpu') );
                         }
                    },

		    setInstance: function() {
			this.set('step', 14);
			this.set('step', 15);
	  	    }
		},
		
		apiRequest: function(command, params) {
		    let url		= this.get('app.proxyEndpoint') + '/' + this.get('model.interoutevdcConfig.apiurl');
		    params		= params || {};
		    params.command	= command;
		    params.apiKey	= this.get('model.interoutevdcConfig.apikey');
                    params.region	= this.get('model.interoutevdcConfig.vdcregion');
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
										this.get('model.interoutevdcConfig.secretkey'), qs, 'base64', 'sha1'));
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
                isStep14: Ember.computed.equal('step', 14),
                isStep15: Ember.computed.equal('step', 15),
		isGteStep3: Ember.computed.gte('step', 3),
		isGteStep5: Ember.computed.gte('step', 5),
		isGteStep7: Ember.computed.gte('step', 7),
                isGteStep9: Ember.computed.gte('step', 9),
		isGteStep11: Ember.computed.gte('step', 11),
		isGteStep13: Ember.computed.gte('step', 13),
		isGteStep15: Ember.computed.gte('step', 15),
	});
});
;

//var ember = require('../bower_components/ember/ember.js');
//var Ember = require('../../ember');
//var ComponentExtended = require('ui/components/new-select/component');

// extend component test
//export default ComponentExtended.extend({
  
//});


;
define("ui/components/machine/driver-interoutevdc/template",["exports","ember","ui/mixins/driver"],function(exports,_ember,_uiMixinsDriver){

exports["default"] = Ember.HTMLBars.template((function() {
  var child0 = (function() {
    return {
      meta: {
        "revision": "Ember@2.9.1",
        "loc": {
          "source": null,
          "start": {
            "line": 12,
            "column": 5
          },
          "end": {
            "line": 12,
            "column": 160
          }
        }
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode(" ");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode(" ");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
        return morphs;
      },
      statements: [
        ["inline","input",[],["type","text","autofocus","autofocus","value",["subexpr","@mut",[["get","model.interoutevdcConfig.apikey",["loc",[null,[12,69],[12,100]]],0,0,0,0]],[],[],0,0],"classNames","form-control","placeholder","Your VDC API Key"],["loc",[null,[12,21],[12,159]]],0,0]
      ],
      locals: [],
      templates: []
    };
  }());
  var child1 = (function() {
    return {
      meta: {
        "revision": "Ember@2.9.1",
        "loc": {
          "source": null,
          "start": {
            "line": 12,
            "column": 160
          },
          "end": {
            "line": 16,
            "column": 5
          }
        }
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("\n					");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","form-control-static");
        var el2 = dom.createTextNode("\n						");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n					");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]),1,1);
        return morphs;
      },
      statements: [
        ["content","model.interoutevdcConfig.apikey",["loc",[null,[14,6],[14,41]]],0,0,0,0]
      ],
      locals: [],
      templates: []
    };
  }());
  var child2 = (function() {
    return {
      meta: {
        "revision": "Ember@2.9.1",
        "loc": {
          "source": null,
          "start": {
            "line": 24,
            "column": 5
          },
          "end": {
            "line": 24,
            "column": 144
          }
        }
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode(" ");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode(" ");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
        return morphs;
      },
      statements: [
        ["inline","input",[],["type","text","value",["subexpr","@mut",[["get","model.interoutevdcConfig.secretkey",["loc",[null,[24,47],[24,81]]],0,0,0,0]],[],[],0,0],"classNames","form-control","placeholder","Your VDC Secret Key"],["loc",[null,[24,21],[24,143]]],0,0]
      ],
      locals: [],
      templates: []
    };
  }());
  var child3 = (function() {
    return {
      meta: {
        "revision": "Ember@2.9.1",
        "loc": {
          "source": null,
          "start": {
            "line": 24,
            "column": 144
          },
          "end": {
            "line": 28,
            "column": 5
          }
        }
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("\n					");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","form-control-static");
        var el2 = dom.createTextNode("\n						**************************************************************************************\n					");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes() { return []; },
      statements: [

      ],
      locals: [],
      templates: []
    };
  }());
  var child4 = (function() {
    return {
      meta: {
        "revision": "Ember@2.9.1",
        "loc": {
          "source": null,
          "start": {
            "line": 36,
            "column": 5
          },
          "end": {
            "line": 37,
            "column": 40
          }
        }
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode(" ");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode(" \n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
        return morphs;
      },
      statements: [
        ["inline","new-select",[],["classNames","form-control","content",["subexpr","@mut",[["get","avregions",["loc",[null,[36,68],[36,77]]],0,0,0,0]],[],[],0,0],"prompt","Please select a region","optionLabelPath","name","optionValuePath","id","value",["subexpr","@mut",[["get","model.interoutevdcConfig.vdcregion",["loc",[null,[36,160],[36,194]]],0,0,0,0]],[],[],0,0]],["loc",[null,[36,21],[36,196]]],0,0]
      ],
      locals: [],
      templates: []
    };
  }());
  var child5 = (function() {
    return {
      meta: {
        "revision": "Ember@2.9.1",
        "loc": {
          "source": null,
          "start": {
            "line": 42,
            "column": 1
          },
          "end": {
            "line": 46,
            "column": 1
          }
        }
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode(" ");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n	");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","footer-actions");
        var el2 = dom.createTextNode("\n		");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("button");
        dom.setAttribute(el2,"name","submit");
        dom.setAttribute(el2,"class","btn btn-primary");
        var el3 = dom.createTextNode("Authenticate");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("button");
        dom.setAttribute(el2,"class","btn btn-link");
        var el3 = dom.createTextNode("Cancel");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element18 = dom.childAt(fragment, [3]);
        var element19 = dom.childAt(element18, [1]);
        var element20 = dom.childAt(element18, [3]);
        var morphs = new Array(3);
        morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
        morphs[1] = dom.createElementMorph(element19);
        morphs[2] = dom.createElementMorph(element20);
        return morphs;
      },
      statements: [
        ["inline","top-errors",[],["errors",["subexpr","@mut",[["get","errors",["loc",[null,[42,37],[42,43]]],0,0,0,0]],[],[],0,0]],["loc",[null,[42,17],[42,45]]],0,0],
        ["element","action",["cloudAuth"],[],["loc",[null,[44,10],[44,32]]],0,0],
        ["element","action",["cancel"],[],["loc",[null,[44,101],[44,120]]],0,0]
      ],
      locals: [],
      templates: []
    };
  }());
  var child6 = (function() {
    return {
      meta: {
        "revision": "Ember@2.9.1",
        "loc": {
          "source": null,
          "start": {
            "line": 71,
            "column": 1
          },
          "end": {
            "line": 75,
            "column": 1
          }
        }
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode(" ");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n	");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","footer-actions");
        var el2 = dom.createTextNode("\n		");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("button");
        dom.setAttribute(el2,"class","btn btn-primary");
        var el3 = dom.createTextNode("Continue");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("button");
        dom.setAttribute(el2,"class","btn btn-link");
        var el3 = dom.createTextNode("Cancel");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n	");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element15 = dom.childAt(fragment, [3]);
        var element16 = dom.childAt(element15, [1]);
        var element17 = dom.childAt(element15, [3]);
        var morphs = new Array(3);
        morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
        morphs[1] = dom.createElementMorph(element16);
        morphs[2] = dom.createElementMorph(element17);
        return morphs;
      },
      statements: [
        ["inline","top-errors",[],["errors",["subexpr","@mut",[["get","errors",["loc",[null,[71,37],[71,43]]],0,0,0,0]],[],[],0,0]],["loc",[null,[71,17],[71,45]]],0,0],
        ["element","action",["selectZone"],[],["loc",[null,[73,10],[73,33]]],0,0],
        ["element","action",["cancel"],[],["loc",[null,[73,84],[73,103]]],0,0]
      ],
      locals: [],
      templates: []
    };
  }());
  var child7 = (function() {
    return {
      meta: {
        "revision": "Ember@2.9.1",
        "loc": {
          "source": null,
          "start": {
            "line": 100,
            "column": 8
          },
          "end": {
            "line": 104,
            "column": 8
          }
        }
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode(" ");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n        ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","footer-actions");
        var el2 = dom.createTextNode("\n                ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("button");
        dom.setAttribute(el2,"class","btn btn-primary");
        var el3 = dom.createTextNode("Continue");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("button");
        dom.setAttribute(el2,"class","btn btn-link");
        var el3 = dom.createTextNode("Cancel");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n        ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element12 = dom.childAt(fragment, [3]);
        var element13 = dom.childAt(element12, [1]);
        var element14 = dom.childAt(element12, [3]);
        var morphs = new Array(3);
        morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
        morphs[1] = dom.createElementMorph(element13);
        morphs[2] = dom.createElementMorph(element14);
        return morphs;
      },
      statements: [
        ["inline","top-errors",[],["errors",["subexpr","@mut",[["get","errors",["loc",[null,[100,44],[100,50]]],0,0,0,0]],[],[],0,0]],["loc",[null,[100,24],[100,52]]],0,0],
        ["element","action",["selectNetwork"],[],["loc",[null,[102,24],[102,50]]],0,0],
        ["element","action",["cancel"],[],["loc",[null,[102,101],[102,120]]],0,0]
      ],
      locals: [],
      templates: []
    };
  }());
  var child8 = (function() {
    return {
      meta: {
        "revision": "Ember@2.9.1",
        "loc": {
          "source": null,
          "start": {
            "line": 129,
            "column": 8
          },
          "end": {
            "line": 133,
            "column": 8
          }
        }
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode(" ");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n        ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","footer-actions");
        var el2 = dom.createTextNode("\n                ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("button");
        dom.setAttribute(el2,"class","btn btn-primary");
        var el3 = dom.createTextNode("Continue");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("button");
        dom.setAttribute(el2,"class","btn btn-link");
        var el3 = dom.createTextNode("Cancel");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n        ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element9 = dom.childAt(fragment, [3]);
        var element10 = dom.childAt(element9, [1]);
        var element11 = dom.childAt(element9, [3]);
        var morphs = new Array(3);
        morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
        morphs[1] = dom.createElementMorph(element10);
        morphs[2] = dom.createElementMorph(element11);
        return morphs;
      },
      statements: [
        ["inline","top-errors",[],["errors",["subexpr","@mut",[["get","errors",["loc",[null,[129,44],[129,50]]],0,0,0,0]],[],[],0,0]],["loc",[null,[129,24],[129,52]]],0,0],
        ["element","action",["selectTemplateType"],[],["loc",[null,[131,24],[131,55]]],0,0],
        ["element","action",["cancel"],[],["loc",[null,[131,106],[131,125]]],0,0]
      ],
      locals: [],
      templates: []
    };
  }());
  var child9 = (function() {
    return {
      meta: {
        "revision": "Ember@2.9.1",
        "loc": {
          "source": null,
          "start": {
            "line": 158,
            "column": 8
          },
          "end": {
            "line": 162,
            "column": 8
          }
        }
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode(" ");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n        ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","footer-actions");
        var el2 = dom.createTextNode("\n                ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("button");
        dom.setAttribute(el2,"class","btn btn-primary");
        var el3 = dom.createTextNode("Continue");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("button");
        dom.setAttribute(el2,"class","btn btn-link");
        var el3 = dom.createTextNode("Cancel");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n        ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element6 = dom.childAt(fragment, [3]);
        var element7 = dom.childAt(element6, [1]);
        var element8 = dom.childAt(element6, [3]);
        var morphs = new Array(3);
        morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
        morphs[1] = dom.createElementMorph(element7);
        morphs[2] = dom.createElementMorph(element8);
        return morphs;
      },
      statements: [
        ["inline","top-errors",[],["errors",["subexpr","@mut",[["get","errors",["loc",[null,[158,44],[158,50]]],0,0,0,0]],[],[],0,0]],["loc",[null,[158,24],[158,52]]],0,0],
        ["element","action",["selectTemplate"],[],["loc",[null,[160,24],[160,51]]],0,0],
        ["element","action",["cancel"],[],["loc",[null,[160,102],[160,121]]],0,0]
      ],
      locals: [],
      templates: []
    };
  }());
  var child10 = (function() {
    return {
      meta: {
        "revision": "Ember@2.9.1",
        "loc": {
          "source": null,
          "start": {
            "line": 205,
            "column": 8
          },
          "end": {
            "line": 209,
            "column": 8
          }
        }
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode(" ");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n        ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","footer-actions");
        var el2 = dom.createTextNode("\n               ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("button");
        dom.setAttribute(el2,"class","btn btn-primary");
        var el3 = dom.createTextNode("Continue");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("button");
        dom.setAttribute(el2,"class","btn btn-link");
        var el3 = dom.createTextNode("Cancel");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n        ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element3 = dom.childAt(fragment, [3]);
        var element4 = dom.childAt(element3, [1]);
        var element5 = dom.childAt(element3, [3]);
        var morphs = new Array(3);
        morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
        morphs[1] = dom.createElementMorph(element4);
        morphs[2] = dom.createElementMorph(element5);
        return morphs;
      },
      statements: [
        ["inline","top-errors",[],["errors",["subexpr","@mut",[["get","errors",["loc",[null,[205,45],[205,51]]],0,0,0,0]],[],[],0,0]],["loc",[null,[205,25],[205,53]]],0,0],
        ["element","action",["getServiceOfferingId"],[],["loc",[null,[207,23],[207,56]]],0,0],
        ["element","action",["cancel"],[],["loc",[null,[207,107],[207,126]]],0,0]
      ],
      locals: [],
      templates: []
    };
  }());
  var child11 = (function() {
    return {
      meta: {
        "revision": "Ember@2.9.1",
        "loc": {
          "source": null,
          "start": {
            "line": 236,
            "column": 8
          },
          "end": {
            "line": 240,
            "column": 8
          }
        }
      },
      isEmpty: false,
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode(" ");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n        ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","footer-actions");
        var el2 = dom.createTextNode("\n                ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("button");
        dom.setAttribute(el2,"class","btn btn-primary");
        var el3 = dom.createTextNode("Continue");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(" ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("button");
        dom.setAttribute(el2,"class","btn btn-link");
        var el3 = dom.createTextNode("Cancel");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n        ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [3]);
        var element1 = dom.childAt(element0, [1]);
        var element2 = dom.childAt(element0, [3]);
        var morphs = new Array(3);
        morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
        morphs[1] = dom.createElementMorph(element1);
        morphs[2] = dom.createElementMorph(element2);
        return morphs;
      },
      statements: [
        ["inline","top-errors",[],["errors",["subexpr","@mut",[["get","errors",["loc",[null,[236,45],[236,51]]],0,0,0,0]],[],[],0,0]],["loc",[null,[236,25],[236,53]]],0,0],
        ["element","action",["setInstance"],[],["loc",[null,[238,24],[238,48]]],0,0],
        ["element","action",["cancel"],[],["loc",[null,[238,99],[238,118]]],0,0]
      ],
      locals: [],
      templates: []
    };
  }());
  return {
    meta: {
      "revision": "Ember@2.9.1",
      "loc": {
        "source": null,
        "start": {
          "line": 1,
          "column": 0
        },
        "end": {
          "line": 263,
          "column": 0
        }
      }
    },
    isEmpty: false,
    arity: 0,
    cachedFragment: null,
    hasRendered: false,
    buildFragment: function buildFragment(dom) {
      var el0 = dom.createDocumentFragment();
      var el1 = dom.createElement("section");
      dom.setAttribute(el1,"class","horizontal-form");
      var el2 = dom.createTextNode("\n	");
      dom.appendChild(el1, el2);
      var el2 = dom.createElement("form");
      var el3 = dom.createTextNode("\n		");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("div");
      dom.setAttribute(el3,"class","container-fluid");
      var el4 = dom.createTextNode("\n			");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("div");
      dom.setAttribute(el4,"class","over-hr r-mt20 r-mb20");
      var el5 = dom.createTextNode("\n				");
      dom.appendChild(el4, el5);
      var el5 = dom.createElement("span");
      var el6 = dom.createTextNode("ACCOUNT ACCESS");
      dom.appendChild(el5, el6);
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n			");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n			");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("div");
      var el5 = dom.createTextNode("\n				");
      dom.appendChild(el4, el5);
      var el5 = dom.createElement("div");
      dom.setAttribute(el5,"class","col-sm-12 col-md-2 form-label");
      var el6 = dom.createTextNode("\n					");
      dom.appendChild(el5, el6);
      var el6 = dom.createElement("label");
      dom.setAttribute(el6,"class","form-control-static");
      var el7 = dom.createTextNode("API Key");
      dom.appendChild(el6, el7);
      dom.appendChild(el5, el6);
      var el6 = dom.createTextNode("\n				");
      dom.appendChild(el5, el6);
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n				");
      dom.appendChild(el4, el5);
      var el5 = dom.createElement("div");
      dom.setAttribute(el5,"class","col-sm-12 col-md-10");
      var el6 = dom.createTextNode("\n					");
      dom.appendChild(el5, el6);
      var el6 = dom.createComment("");
      dom.appendChild(el5, el6);
      var el6 = dom.createTextNode("				");
      dom.appendChild(el5, el6);
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n			");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n			");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("div");
      var el5 = dom.createTextNode("\n				");
      dom.appendChild(el4, el5);
      var el5 = dom.createElement("div");
      dom.setAttribute(el5,"class","col-sm-12 col-md-2 form-label");
      var el6 = dom.createTextNode("\n					");
      dom.appendChild(el5, el6);
      var el6 = dom.createElement("label");
      dom.setAttribute(el6,"class","form-control-static");
      var el7 = dom.createTextNode("Secret Key");
      dom.appendChild(el6, el7);
      dom.appendChild(el5, el6);
      var el6 = dom.createTextNode("\n				");
      dom.appendChild(el5, el6);
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n				");
      dom.appendChild(el4, el5);
      var el5 = dom.createElement("div");
      dom.setAttribute(el5,"class","col-sm-12 col-md-10");
      var el6 = dom.createTextNode("\n					");
      dom.appendChild(el5, el6);
      var el6 = dom.createComment("");
      dom.appendChild(el5, el6);
      var el6 = dom.createTextNode("				");
      dom.appendChild(el5, el6);
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n			");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n                        ");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("div");
      var el5 = dom.createTextNode("\n                                ");
      dom.appendChild(el4, el5);
      var el5 = dom.createElement("div");
      dom.setAttribute(el5,"class","col-sm-12 col-md-2 form-label");
      var el6 = dom.createTextNode("\n                                        ");
      dom.appendChild(el5, el6);
      var el6 = dom.createElement("label");
      dom.setAttribute(el6,"class","form-control-static");
      var el7 = dom.createTextNode("VDC Region");
      dom.appendChild(el6, el7);
      dom.appendChild(el5, el6);
      var el6 = dom.createTextNode("\n                                ");
      dom.appendChild(el5, el6);
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n                                ");
      dom.appendChild(el4, el5);
      var el5 = dom.createElement("div");
      dom.setAttribute(el5,"class","col-sm-12 col-md-10");
      var el6 = dom.createTextNode("\n					");
      dom.appendChild(el5, el6);
      var el6 = dom.createComment("");
      dom.appendChild(el5, el6);
      var el6 = dom.createTextNode("                                ");
      dom.appendChild(el5, el6);
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n                        ");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n		");
      dom.appendChild(el3, el4);
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode("\n	");
      dom.appendChild(el2, el3);
      dom.appendChild(el1, el2);
      var el2 = dom.createTextNode("\n	");
      dom.appendChild(el1, el2);
      var el2 = dom.createComment("");
      dom.appendChild(el1, el2);
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createComment(" Step 2 ");
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createElement("section");
      var el2 = dom.createTextNode("\n	");
      dom.appendChild(el1, el2);
      var el2 = dom.createElement("div");
      dom.setAttribute(el2,"class","text-center");
      var el3 = dom.createTextNode("\n		");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("i");
      dom.setAttribute(el3,"class","icon icon-spinner icon-spin");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("i");
      var el4 = dom.createTextNode("  Authenticating...");
      dom.appendChild(el3, el4);
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode("\n	");
      dom.appendChild(el2, el3);
      dom.appendChild(el1, el2);
      var el2 = dom.createTextNode("\n");
      dom.appendChild(el1, el2);
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createComment(" Step 3 ");
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createElement("section");
      var el2 = dom.createTextNode("\n	");
      dom.appendChild(el1, el2);
      var el2 = dom.createElement("div");
      dom.setAttribute(el2,"class","container-fluid");
      var el3 = dom.createTextNode("\n		");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("div");
      dom.setAttribute(el3,"class","over-hr r-mt20 r-mb20 test-1 test-1-test");
      var el4 = dom.createTextNode("\n			");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("span");
      var el5 = dom.createTextNode("AVAILABILITY ZONE");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n		");
      dom.appendChild(el3, el4);
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode("\n		");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("div");
      var el4 = dom.createTextNode("\n			");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("div");
      dom.setAttribute(el4,"class","col-sm-12 col-md-2 form-label");
      var el5 = dom.createTextNode("\n				");
      dom.appendChild(el4, el5);
      var el5 = dom.createElement("label");
      dom.setAttribute(el5,"class","form-control-static");
      var el6 = dom.createTextNode("Availability Zone");
      dom.appendChild(el5, el6);
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n			");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n       			");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("div");
      dom.setAttribute(el4,"class","col-sm-12 col-md-8 test-2");
      var el5 = dom.createTextNode("\n        		  ");
      dom.appendChild(el4, el5);
      var el5 = dom.createComment("");
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n        		");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n		");
      dom.appendChild(el3, el4);
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode("\n	");
      dom.appendChild(el2, el3);
      dom.appendChild(el1, el2);
      var el2 = dom.createTextNode("\n	");
      dom.appendChild(el1, el2);
      var el2 = dom.createComment("");
      dom.appendChild(el1, el2);
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createComment(" Step 4 ");
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createElement("section");
      var el2 = dom.createTextNode("\n	");
      dom.appendChild(el1, el2);
      var el2 = dom.createElement("div");
      dom.setAttribute(el2,"class","text-center");
      var el3 = dom.createTextNode("\n		");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("i");
      dom.setAttribute(el3,"class","icon icon-spinner icon-spin");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("i");
      var el4 = dom.createTextNode("  Please wait...");
      dom.appendChild(el3, el4);
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode("\n	");
      dom.appendChild(el2, el3);
      dom.appendChild(el1, el2);
      var el2 = dom.createTextNode("\n");
      dom.appendChild(el1, el2);
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createComment(" Step 5 ");
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createElement("section");
      var el2 = dom.createTextNode("\n        ");
      dom.appendChild(el1, el2);
      var el2 = dom.createElement("div");
      dom.setAttribute(el2,"class","container-fluid");
      var el3 = dom.createTextNode("\n                ");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("div");
      dom.setAttribute(el3,"class","over-hr r-mt20 r-mb20");
      var el4 = dom.createTextNode("\n                        ");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("span");
      var el5 = dom.createTextNode("Network");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n                ");
      dom.appendChild(el3, el4);
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode("\n                ");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("div");
      var el4 = dom.createTextNode("\n                        ");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("div");
      dom.setAttribute(el4,"class","col-sm-12 col-md-2 form-label");
      var el5 = dom.createTextNode("\n                                ");
      dom.appendChild(el4, el5);
      var el5 = dom.createElement("label");
      dom.setAttribute(el5,"class","form-control-static");
      var el6 = dom.createTextNode("Network");
      dom.appendChild(el5, el6);
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n                        ");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n                        ");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("div");
      dom.setAttribute(el4,"class","col-sm-12 col-md-8");
      var el5 = dom.createTextNode("\n                          ");
      dom.appendChild(el4, el5);
      var el5 = dom.createComment("");
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n                        ");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n                ");
      dom.appendChild(el3, el4);
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode("\n        ");
      dom.appendChild(el2, el3);
      dom.appendChild(el1, el2);
      var el2 = dom.createTextNode("\n        ");
      dom.appendChild(el1, el2);
      var el2 = dom.createComment("");
      dom.appendChild(el1, el2);
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createComment(" Step 6 ");
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createElement("section");
      var el2 = dom.createTextNode("\n        ");
      dom.appendChild(el1, el2);
      var el2 = dom.createElement("div");
      dom.setAttribute(el2,"class","text-center");
      var el3 = dom.createTextNode("\n                ");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("i");
      dom.setAttribute(el3,"class","icon icon-spinner icon-spin");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("i");
      var el4 = dom.createTextNode("  Please wait...");
      dom.appendChild(el3, el4);
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode("\n        ");
      dom.appendChild(el2, el3);
      dom.appendChild(el1, el2);
      var el2 = dom.createTextNode("\n");
      dom.appendChild(el1, el2);
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createComment(" Step 7 ");
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createElement("section");
      var el2 = dom.createTextNode("\n        ");
      dom.appendChild(el1, el2);
      var el2 = dom.createElement("div");
      dom.setAttribute(el2,"class","container-fluid");
      var el3 = dom.createTextNode("\n                ");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("div");
      dom.setAttribute(el3,"class","over-hr r-mt20 r-mb20");
      var el4 = dom.createTextNode("\n                        ");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("span");
      var el5 = dom.createTextNode("Template Type");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n                ");
      dom.appendChild(el3, el4);
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode("\n                ");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("div");
      var el4 = dom.createTextNode("\n                        ");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("div");
      dom.setAttribute(el4,"class","col-sm-12 col-md-2 form-label");
      var el5 = dom.createTextNode("\n                                ");
      dom.appendChild(el4, el5);
      var el5 = dom.createElement("label");
      dom.setAttribute(el5,"class","form-control-static");
      var el6 = dom.createTextNode("Template Type");
      dom.appendChild(el5, el6);
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n                        ");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n                        ");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("div");
      dom.setAttribute(el4,"class","col-sm-12 col-md-8");
      var el5 = dom.createTextNode("\n                         ");
      dom.appendChild(el4, el5);
      var el5 = dom.createComment("");
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n                        ");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n                ");
      dom.appendChild(el3, el4);
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode("\n        ");
      dom.appendChild(el2, el3);
      dom.appendChild(el1, el2);
      var el2 = dom.createTextNode("\n        ");
      dom.appendChild(el1, el2);
      var el2 = dom.createComment("");
      dom.appendChild(el1, el2);
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createComment(" Step 8 ");
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createElement("section");
      var el2 = dom.createTextNode("\n        ");
      dom.appendChild(el1, el2);
      var el2 = dom.createElement("div");
      dom.setAttribute(el2,"class","text-center");
      var el3 = dom.createTextNode("\n                ");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("i");
      dom.setAttribute(el3,"class","icon icon-spinner icon-spin");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("i");
      var el4 = dom.createTextNode("  Please wait...");
      dom.appendChild(el3, el4);
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode("\n        ");
      dom.appendChild(el2, el3);
      dom.appendChild(el1, el2);
      var el2 = dom.createTextNode("\n");
      dom.appendChild(el1, el2);
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createComment(" Step 9 ");
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createElement("section");
      var el2 = dom.createTextNode("\n        ");
      dom.appendChild(el1, el2);
      var el2 = dom.createElement("div");
      dom.setAttribute(el2,"class","container-fluid");
      var el3 = dom.createTextNode("\n                ");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("div");
      dom.setAttribute(el3,"class","over-hr r-mt20 r-mb20");
      var el4 = dom.createTextNode("\n                        ");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("span");
      var el5 = dom.createTextNode("Template");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n                ");
      dom.appendChild(el3, el4);
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode("\n                ");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("div");
      var el4 = dom.createTextNode("\n                        ");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("div");
      dom.setAttribute(el4,"class","col-sm-12 col-md-2 form-label");
      var el5 = dom.createTextNode("\n                                ");
      dom.appendChild(el4, el5);
      var el5 = dom.createElement("label");
      dom.setAttribute(el5,"class","form-control-static");
      var el6 = dom.createTextNode("Template");
      dom.appendChild(el5, el6);
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n                        ");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n                        ");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("div");
      dom.setAttribute(el4,"class","col-sm-12 col-md-8");
      var el5 = dom.createTextNode("\n                          ");
      dom.appendChild(el4, el5);
      var el5 = dom.createComment("");
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n                        ");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n                ");
      dom.appendChild(el3, el4);
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode("\n        ");
      dom.appendChild(el2, el3);
      dom.appendChild(el1, el2);
      var el2 = dom.createTextNode("\n        ");
      dom.appendChild(el1, el2);
      var el2 = dom.createComment("");
      dom.appendChild(el1, el2);
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createComment(" Step 10 ");
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createElement("section");
      var el2 = dom.createTextNode("\n        ");
      dom.appendChild(el1, el2);
      var el2 = dom.createElement("div");
      dom.setAttribute(el2,"class","text-center");
      var el3 = dom.createTextNode("\n                ");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("i");
      dom.setAttribute(el3,"class","icon icon-spinner icon-spin");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("i");
      var el4 = dom.createTextNode("  Please wait...");
      dom.appendChild(el3, el4);
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode("\n        ");
      dom.appendChild(el2, el3);
      dom.appendChild(el1, el2);
      var el2 = dom.createTextNode("\n");
      dom.appendChild(el1, el2);
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createComment(" Step 11 ");
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createElement("section");
      var el2 = dom.createTextNode("\n        ");
      dom.appendChild(el1, el2);
      var el2 = dom.createElement("div");
      dom.setAttribute(el2,"class","container-fluid");
      var el3 = dom.createTextNode("\n                ");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("div");
      dom.setAttribute(el3,"class","over-hr r-mt20 r-mb20");
      var el4 = dom.createTextNode("\n                        ");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("span");
      var el5 = dom.createTextNode("Service Offering");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n                ");
      dom.appendChild(el3, el4);
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode("\n                ");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("div");
      var el4 = dom.createTextNode("\n                        ");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("div");
      dom.setAttribute(el4,"class","col-sm-12 col-md-2 form-label");
      var el5 = dom.createTextNode("\n                                ");
      dom.appendChild(el4, el5);
      var el5 = dom.createElement("label");
      dom.setAttribute(el5,"class","form-control-static");
      var el6 = dom.createTextNode("CPU");
      dom.appendChild(el5, el6);
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n                        ");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n		\n			");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("div");
      dom.setAttribute(el4,"class","col-sml-12 col-md-10");
      var el5 = dom.createTextNode("\n				");
      dom.appendChild(el4, el5);
      var el5 = dom.createElement("button");
      dom.setAttribute(el5,"class","btn btn-primary btn-square cpu minus");
      var el6 = dom.createTextNode(" - ");
      dom.appendChild(el5, el6);
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode(" \n				");
      dom.appendChild(el4, el5);
      var el5 = dom.createElement("input");
      dom.setAttribute(el5,"id","cpuoffering");
      dom.setAttribute(el5,"maxlength","2");
      dom.setAttribute(el5,"type","text");
      dom.setAttribute(el5,"class","form-control");
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n				");
      dom.appendChild(el4, el5);
      var el5 = dom.createElement("span");
      dom.setAttribute(el5,"class","cpu-label");
      var el6 = dom.createTextNode("vCPU");
      dom.appendChild(el5, el6);
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n				");
      dom.appendChild(el4, el5);
      var el5 = dom.createElement("button");
      dom.setAttribute(el5,"class","btn btn-primary btn-square cpu plus");
      var el6 = dom.createTextNode(" + ");
      dom.appendChild(el5, el6);
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n			");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n			");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("div");
      dom.setAttribute(el4,"class","clearfix");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("br");
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n\n\n			");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("div");
      dom.setAttribute(el4,"class","col-sm-12 col-md-2 form-label");
      var el5 = dom.createTextNode("\n                                ");
      dom.appendChild(el4, el5);
      var el5 = dom.createElement("label");
      dom.setAttribute(el5,"class","form-control-static");
      var el6 = dom.createTextNode("VRAM");
      dom.appendChild(el5, el6);
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n                        ");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n	                ");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("div");
      dom.setAttribute(el4,"class","col-sml-12 col-md-10");
      var el5 = dom.createTextNode(" \n                                ");
      dom.appendChild(el4, el5);
      var el5 = dom.createElement("button");
      dom.setAttribute(el5,"class","btn btn-primary btn-square vram minus");
      var el6 = dom.createTextNode(" - ");
      dom.appendChild(el5, el6);
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n				");
      dom.appendChild(el4, el5);
      var el5 = dom.createElement("input");
      dom.setAttribute(el5,"id","vramoffering");
      dom.setAttribute(el5,"maxlength","4");
      dom.setAttribute(el5,"type","text");
      dom.setAttribute(el5,"class","form-control");
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n                            	");
      dom.appendChild(el4, el5);
      var el5 = dom.createElement("span");
      dom.setAttribute(el5,"class","vram-label");
      var el6 = dom.createTextNode("GB");
      dom.appendChild(el5, el6);
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n			  ");
      dom.appendChild(el4, el5);
      var el5 = dom.createElement("button");
      dom.setAttribute(el5,"class","btn btn-primary btn-square vram plus");
      var el6 = dom.createTextNode(" + ");
      dom.appendChild(el5, el6);
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n                        	");
      dom.appendChild(el4, el5);
      var el5 = dom.createComment(" <label>{{model.interoutevdcConfig.ram}} vRAM</label>");
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n			");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n\n                ");
      dom.appendChild(el3, el4);
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode("\n        ");
      dom.appendChild(el2, el3);
      dom.appendChild(el1, el2);
      var el2 = dom.createTextNode("\n        ");
      dom.appendChild(el1, el2);
      var el2 = dom.createComment("");
      dom.appendChild(el1, el2);
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createComment(" Step 12 ");
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createElement("section");
      var el2 = dom.createTextNode("\n        ");
      dom.appendChild(el1, el2);
      var el2 = dom.createElement("div");
      dom.setAttribute(el2,"class","text-center");
      var el3 = dom.createTextNode("\n                ");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("i");
      dom.setAttribute(el3,"class","icon icon-spinner icon-spin");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("i");
      var el4 = dom.createTextNode("  Please wait...");
      dom.appendChild(el3, el4);
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode("\n        ");
      dom.appendChild(el2, el3);
      dom.appendChild(el1, el2);
      var el2 = dom.createTextNode("\n");
      dom.appendChild(el1, el2);
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createComment(" Step 13 ");
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createElement("section");
      var el2 = dom.createTextNode("\n        ");
      dom.appendChild(el1, el2);
      var el2 = dom.createElement("div");
      dom.setAttribute(el2,"class","container-fluid");
      var el3 = dom.createTextNode("\n                ");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("div");
      dom.setAttribute(el3,"class","over-hr r-mt20 r-mb20");
      var el4 = dom.createTextNode("\n                        ");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("span");
      var el5 = dom.createTextNode("Disk Offering");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n                ");
      dom.appendChild(el3, el4);
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode("\n\n                ");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("div");
      var el4 = dom.createTextNode("\n                        ");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("div");
      dom.setAttribute(el4,"class","col-sm-12 col-md-2 form-label");
      var el5 = dom.createTextNode("\n                                ");
      dom.appendChild(el4, el5);
      var el5 = dom.createElement("label");
      dom.setAttribute(el5,"class","form-control-static");
      var el6 = dom.createTextNode("Disc Type / Disk Size (GB)");
      dom.appendChild(el5, el6);
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n                        ");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n                        ");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("div");
      dom.setAttribute(el4,"class","col-sm-12 col-md-8");
      var el5 = dom.createTextNode("\n	                  ");
      dom.appendChild(el4, el5);
      var el5 = dom.createComment("");
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n			  ");
      dom.appendChild(el4, el5);
      var el5 = dom.createComment("");
      dom.appendChild(el4, el5);
      var el5 = dom.createTextNode("\n			");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n                ");
      dom.appendChild(el3, el4);
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode("\n        ");
      dom.appendChild(el2, el3);
      dom.appendChild(el1, el2);
      var el2 = dom.createTextNode("\n        ");
      dom.appendChild(el1, el2);
      var el2 = dom.createComment("");
      dom.appendChild(el1, el2);
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createComment(" Step 14 ");
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createElement("section");
      var el2 = dom.createTextNode("\n	");
      dom.appendChild(el1, el2);
      var el2 = dom.createElement("div");
      dom.setAttribute(el2,"class","text-center");
      var el3 = dom.createTextNode("\n		");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("i");
      dom.setAttribute(el3,"class","icon icon-spinner icon-spin");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("i");
      var el4 = dom.createTextNode("  Please wait...");
      dom.appendChild(el3, el4);
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode("\n	");
      dom.appendChild(el2, el3);
      dom.appendChild(el1, el2);
      var el2 = dom.createTextNode("\n");
      dom.appendChild(el1, el2);
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createComment(" Step 15 ");
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n");
      dom.appendChild(el0, el1);
      var el1 = dom.createElement("section");
      var el2 = dom.createTextNode("\n	");
      dom.appendChild(el1, el2);
      var el2 = dom.createElement("div");
      dom.setAttribute(el2,"class","container-fluid");
      var el3 = dom.createTextNode("\n		");
      dom.appendChild(el2, el3);
      var el3 = dom.createElement("div");
      dom.setAttribute(el3,"class","over-hr r-mt20 r-mb20");
      var el4 = dom.createTextNode("\n			");
      dom.appendChild(el3, el4);
      var el4 = dom.createElement("span");
      var el5 = dom.createTextNode("INSTANCE");
      dom.appendChild(el4, el5);
      dom.appendChild(el3, el4);
      var el4 = dom.createTextNode("\n		");
      dom.appendChild(el3, el4);
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode("\n		");
      dom.appendChild(el2, el3);
      var el3 = dom.createComment("");
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode(" ");
      dom.appendChild(el2, el3);
      var el3 = dom.createComment("");
      dom.appendChild(el2, el3);
      var el3 = dom.createTextNode("\n	");
      dom.appendChild(el2, el3);
      dom.appendChild(el1, el2);
      var el2 = dom.createTextNode("\n	");
      dom.appendChild(el1, el2);
      var el2 = dom.createComment("");
      dom.appendChild(el1, el2);
      var el2 = dom.createTextNode(" ");
      dom.appendChild(el1, el2);
      var el2 = dom.createComment("");
      dom.appendChild(el1, el2);
      var el2 = dom.createTextNode("\n");
      dom.appendChild(el1, el2);
      dom.appendChild(el0, el1);
      var el1 = dom.createTextNode("\n\n\n\n");
      dom.appendChild(el0, el1);
      return el0;
    },
    buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
      var element21 = dom.childAt(fragment, [0]);
      var element22 = dom.childAt(element21, [1, 1]);
      var element23 = dom.childAt(element22, [3]);
      var element24 = dom.childAt(element22, [5]);
      var element25 = dom.childAt(element22, [7]);
      var element26 = dom.childAt(fragment, [4]);
      var element27 = dom.childAt(fragment, [8]);
      var element28 = dom.childAt(element27, [1, 3]);
      var element29 = dom.childAt(fragment, [12]);
      var element30 = dom.childAt(fragment, [16]);
      var element31 = dom.childAt(element30, [1, 3]);
      var element32 = dom.childAt(fragment, [20]);
      var element33 = dom.childAt(fragment, [24]);
      var element34 = dom.childAt(element33, [1, 3]);
      var element35 = dom.childAt(fragment, [28]);
      var element36 = dom.childAt(fragment, [32]);
      var element37 = dom.childAt(element36, [1, 3]);
      var element38 = dom.childAt(fragment, [36]);
      var element39 = dom.childAt(fragment, [40]);
      var element40 = dom.childAt(element39, [1, 3]);
      var element41 = dom.childAt(element40, [3]);
      var element42 = dom.childAt(element41, [1]);
      var element43 = dom.childAt(element41, [3]);
      var element44 = dom.childAt(element41, [7]);
      var element45 = dom.childAt(element40, [10]);
      var element46 = dom.childAt(element45, [1]);
      var element47 = dom.childAt(element45, [3]);
      var element48 = dom.childAt(element45, [7]);
      var element49 = dom.childAt(fragment, [44]);
      var element50 = dom.childAt(fragment, [48]);
      var element51 = dom.childAt(element50, [1, 3]);
      var element52 = dom.childAt(element51, [3]);
      var element53 = dom.childAt(fragment, [52]);
      var element54 = dom.childAt(fragment, [56]);
      var element55 = dom.childAt(element54, [1]);
      var morphs = new Array(51);
      morphs[0] = dom.createAttrMorph(element23, 'class');
      morphs[1] = dom.createMorphAt(dom.childAt(element23, [3]),1,1);
      morphs[2] = dom.createAttrMorph(element24, 'class');
      morphs[3] = dom.createMorphAt(dom.childAt(element24, [3]),1,1);
      morphs[4] = dom.createAttrMorph(element25, 'class');
      morphs[5] = dom.createMorphAt(dom.childAt(element25, [3]),1,1);
      morphs[6] = dom.createMorphAt(element21,3,3);
      morphs[7] = dom.createAttrMorph(element26, 'class');
      morphs[8] = dom.createAttrMorph(element27, 'class');
      morphs[9] = dom.createAttrMorph(element28, 'class');
      morphs[10] = dom.createMorphAt(dom.childAt(element28, [3]),1,1);
      morphs[11] = dom.createMorphAt(element27,3,3);
      morphs[12] = dom.createAttrMorph(element29, 'class');
      morphs[13] = dom.createAttrMorph(element30, 'class');
      morphs[14] = dom.createAttrMorph(element31, 'class');
      morphs[15] = dom.createMorphAt(dom.childAt(element31, [3]),1,1);
      morphs[16] = dom.createMorphAt(element30,3,3);
      morphs[17] = dom.createAttrMorph(element32, 'class');
      morphs[18] = dom.createAttrMorph(element33, 'class');
      morphs[19] = dom.createAttrMorph(element34, 'class');
      morphs[20] = dom.createMorphAt(dom.childAt(element34, [3]),1,1);
      morphs[21] = dom.createMorphAt(element33,3,3);
      morphs[22] = dom.createAttrMorph(element35, 'class');
      morphs[23] = dom.createAttrMorph(element36, 'class');
      morphs[24] = dom.createAttrMorph(element37, 'class');
      morphs[25] = dom.createMorphAt(dom.childAt(element37, [3]),1,1);
      morphs[26] = dom.createMorphAt(element36,3,3);
      morphs[27] = dom.createAttrMorph(element38, 'class');
      morphs[28] = dom.createAttrMorph(element39, 'class');
      morphs[29] = dom.createAttrMorph(element40, 'class');
      morphs[30] = dom.createElementMorph(element42);
      morphs[31] = dom.createAttrMorph(element43, 'onchange');
      morphs[32] = dom.createAttrMorph(element43, 'value');
      morphs[33] = dom.createElementMorph(element44);
      morphs[34] = dom.createElementMorph(element46);
      morphs[35] = dom.createAttrMorph(element47, 'onchange');
      morphs[36] = dom.createAttrMorph(element47, 'value');
      morphs[37] = dom.createElementMorph(element48);
      morphs[38] = dom.createMorphAt(element39,3,3);
      morphs[39] = dom.createAttrMorph(element49, 'class');
      morphs[40] = dom.createAttrMorph(element50, 'class');
      morphs[41] = dom.createAttrMorph(element51, 'class');
      morphs[42] = dom.createMorphAt(element52,1,1);
      morphs[43] = dom.createMorphAt(element52,3,3);
      morphs[44] = dom.createMorphAt(element50,3,3);
      morphs[45] = dom.createAttrMorph(element53, 'class');
      morphs[46] = dom.createAttrMorph(element54, 'class');
      morphs[47] = dom.createMorphAt(element55,3,3);
      morphs[48] = dom.createMorphAt(element55,5,5);
      morphs[49] = dom.createMorphAt(element54,3,3);
      morphs[50] = dom.createMorphAt(element54,5,5);
      return morphs;
    },
    statements: [
      ["attribute","class",["concat",["row ",["subexpr","if",[["get","isStep1",["loc",[null,[7,24],[7,31]]],0,0,0,0],"form-group"],[],["loc",[null,[7,19],[7,46]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["block","if",[["get","isStep1",["loc",[null,[12,11],[12,18]]],0,0,0,0]],[],0,1,["loc",[null,[12,5],[16,12]]]],
      ["attribute","class",["concat",["row ",["subexpr","if",[["get","isStep1",["loc",[null,[19,24],[19,31]]],0,0,0,0],"form-group"],[],["loc",[null,[19,19],[19,46]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["block","if",[["get","isStep1",["loc",[null,[24,11],[24,18]]],0,0,0,0]],[],2,3,["loc",[null,[24,5],[28,12]]]],
      ["attribute","class",["concat",["row ",["subexpr","if",[["get","isStep1",["loc",[null,[31,45],[31,52]]],0,0,0,0],"form-group"],[],["loc",[null,[31,40],[31,67]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["block","if",[["get","isStep1",["loc",[null,[36,11],[36,18]]],0,0,0,0]],[],4,null,["loc",[null,[36,5],[37,47]]]],
      ["block","if",[["get","isStep1",["loc",[null,[42,7],[42,14]]],0,0,0,0]],[],5,null,["loc",[null,[42,1],[46,8]]]],
      ["attribute","class",["concat",["horizontal-form r-pt0 step2 ",["subexpr","unless",[["get","isStep2",["loc",[null,[50,53],[50,60]]],0,0,0,0],"hide"],[],["loc",[null,[50,44],[50,69]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["attribute","class",["concat",["horizontal-form r-pt0 step3 ",["subexpr","unless",[["get","isGteStep3",["loc",[null,[57,53],[57,63]]],0,0,0,0],"hide"],[],["loc",[null,[57,44],[57,72]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["attribute","class",["concat",["row ",["subexpr","if",[["get","isStep3",["loc",[null,[62,23],[62,30]]],0,0,0,0],"form-group"],[],["loc",[null,[62,18],[62,45]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["inline","new-select",[],["classNames","form-control","action",["subexpr","action",[["get","resetSiblingMenus",["loc",[null,[67,66],[67,83]]],0,0,0,0]],[],["loc",[null,[67,58],[67,84]]],0,0],"content",["subexpr","@mut",[["get","avzones",["loc",[null,[67,93],[67,100]]],0,0,0,0]],[],[],0,0],"prompt","Please select a zone","optionLabelPath","name","optionValuePath","id","value",["subexpr","@mut",[["get","model.interoutevdcConfig.zoneid",["loc",[null,[67,181],[67,212]]],0,0,0,0]],[],[],0,0]],["loc",[null,[67,12],[67,214]]],0,0],
      ["block","if",[["get","isStep3",["loc",[null,[71,7],[71,14]]],0,0,0,0]],[],6,null,["loc",[null,[71,1],[75,8]]]],
      ["attribute","class",["concat",["horizontal-form r-pt0 step4 ",["subexpr","unless",[["get","isStep4",["loc",[null,[79,53],[79,60]]],0,0,0,0],"hide"],[],["loc",[null,[79,44],[79,69]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["attribute","class",["concat",["horizontal-form r-pt0 step5 ",["subexpr","unless",[["get","isGteStep5",["loc",[null,[86,53],[86,63]]],0,0,0,0],"hide"],[],["loc",[null,[86,44],[86,72]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["attribute","class",["concat",["row ",["subexpr","if",[["get","isStep5",["loc",[null,[91,37],[91,44]]],0,0,0,0],"form-group"],[],["loc",[null,[91,32],[91,59]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["inline","new-select",[],["action",["subexpr","action",[["get","resetSiblingMenus",["loc",[null,[96,54],[96,71]]],0,0,0,0]],[],["loc",[null,[96,46],[96,72]]],0,0],"classNames","form-control","content",["subexpr","@mut",[["get","avnetworks",["loc",[null,[96,107],[96,117]]],0,0,0,0]],[],[],0,0],"prompt","Please select a network","optionLabelPath","name","optionValuePath","id","value",["subexpr","@mut",[["get","model.interoutevdcConfig.networkid",["loc",[null,[96,201],[96,235]]],0,0,0,0]],[],[],0,0]],["loc",[null,[96,26],[96,238]]],0,0],
      ["block","if",[["get","isStep5",["loc",[null,[100,14],[100,21]]],0,0,0,0]],[],7,null,["loc",[null,[100,8],[104,15]]]],
      ["attribute","class",["concat",["horizontal-form r-pt0 step6 ",["subexpr","unless",[["get","isStep6",["loc",[null,[108,53],[108,60]]],0,0,0,0],"hide"],[],["loc",[null,[108,44],[108,69]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["attribute","class",["concat",["horizontal-form r-pt0 step7 ",["subexpr","unless",[["get","isGteStep7",["loc",[null,[115,53],[115,63]]],0,0,0,0],"hide"],[],["loc",[null,[115,44],[115,72]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["attribute","class",["concat",["row ",["subexpr","if",[["get","isStep7",["loc",[null,[120,37],[120,44]]],0,0,0,0],"form-group"],[],["loc",[null,[120,32],[120,59]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["inline","new-select",[],["action",["subexpr","action",[["get","resetSiblingMenus",["loc",[null,[125,53],[125,70]]],0,0,0,0]],[],["loc",[null,[125,45],[125,71]]],0,0],"classNames","form-control","content",["subexpr","@mut",[["get","avtemplatestype",["loc",[null,[125,106],[125,121]]],0,0,0,0]],[],[],0,0],"prompt","Please select a template type","optionLabelPath","name","optionValuePath","id","value",["subexpr","@mut",[["get","model.interoutevdcConfig.templatefilter",["loc",[null,[125,211],[125,250]]],0,0,0,0]],[],[],0,0]],["loc",[null,[125,25],[125,253]]],0,0],
      ["block","if",[["get","isStep7",["loc",[null,[129,14],[129,21]]],0,0,0,0]],[],8,null,["loc",[null,[129,8],[133,15]]]],
      ["attribute","class",["concat",["horizontal-form r-pt0 step8 ",["subexpr","unless",[["get","isStep8",["loc",[null,[137,53],[137,60]]],0,0,0,0],"hide"],[],["loc",[null,[137,44],[137,69]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["attribute","class",["concat",["horizontal-form r-pt0 step9 ",["subexpr","unless",[["get","isGteStep9",["loc",[null,[144,53],[144,63]]],0,0,0,0],"hide"],[],["loc",[null,[144,44],[144,72]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["attribute","class",["concat",["row ",["subexpr","if",[["get","isStep9",["loc",[null,[149,37],[149,44]]],0,0,0,0],"form-group"],[],["loc",[null,[149,32],[149,59]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["inline","new-select",[],["action",["subexpr","action",[["get","resetSiblingMenus",["loc",[null,[154,54],[154,71]]],0,0,0,0]],[],["loc",[null,[154,46],[154,72]]],0,0],"classNames","form-control","content",["subexpr","@mut",[["get","avtemplates",["loc",[null,[154,107],[154,118]]],0,0,0,0]],[],[],0,0],"prompt","Please select a template","optionLabelPath","name","optionValuePath","id","value",["subexpr","@mut",[["get","model.interoutevdcConfig.templateid",["loc",[null,[154,203],[154,238]]],0,0,0,0]],[],[],0,0]],["loc",[null,[154,26],[154,241]]],0,0],
      ["block","if",[["get","isStep9",["loc",[null,[158,14],[158,21]]],0,0,0,0]],[],9,null,["loc",[null,[158,8],[162,15]]]],
      ["attribute","class",["concat",["horizontal-form r-pt0 step10 ",["subexpr","unless",[["get","isStep10",["loc",[null,[166,54],[166,62]]],0,0,0,0],"hide"],[],["loc",[null,[166,45],[166,71]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["attribute","class",["concat",["horizontal-form r-pt0 step11 ",["subexpr","unless",[["get","isGteStep11",["loc",[null,[173,54],[173,65]]],0,0,0,0],"hide"],[],["loc",[null,[173,45],[173,74]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["attribute","class",["concat",["row ",["subexpr","if",[["get","isStep11",["loc",[null,[178,37],[178,45]]],0,0,0,0],"form-group"],[],["loc",[null,[178,32],[178,60]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["element","action",["lessCPU"],[],["loc",[null,[184,12],[184,32]]],0,0],
      ["attribute","onchange",["subexpr","action",["setRAMCPUOffering"],[],["loc",[null,[null,null],[185,81]]],0,0],0,0,0,0],
      ["attribute","value",["get","model.interoutevdcConfig.cpu",["loc",[null,[185,124],[185,152]]],0,0,0,0],0,0,0,0],
      ["element","action",["moreCPU"],[],["loc",[null,[187,12],[187,32]]],0,0],
      ["element","action",["lessVRAM"],[],["loc",[null,[196,40],[196,61]]],0,0],
      ["attribute","onchange",["subexpr","action",["setRAMCPUOffering"],[],["loc",[null,[null,null],[197,82]]],0,0],0,0,0,0],
      ["attribute","value",["get","model.interoutevdcConfig.ram",["loc",[null,[197,124],[197,152]]],0,0,0,0],0,0,0,0],
      ["element","action",["moreVRAM"],[],["loc",[null,[199,13],[199,34]]],0,0],
      ["block","if",[["get","isStep11",["loc",[null,[205,14],[205,22]]],0,0,0,0]],[],10,null,["loc",[null,[205,8],[209,15]]]],
      ["attribute","class",["concat",["horizontal-form r-pt0 step12 ",["subexpr","unless",[["get","isStep12",["loc",[null,[213,54],[213,62]]],0,0,0,0],"hide"],[],["loc",[null,[213,45],[213,71]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["attribute","class",["concat",["horizontal-form r-pt0 step13 ",["subexpr","unless",[["get","isGteStep13",["loc",[null,[220,54],[220,65]]],0,0,0,0],"hide"],[],["loc",[null,[220,45],[220,74]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["attribute","class",["concat",["row ",["subexpr","if",[["get","isStep13",["loc",[null,[226,37],[226,45]]],0,0,0,0],"form-group"],[],["loc",[null,[226,32],[226,60]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["inline","new-select",[],["action",["subexpr","action",[["get","resetSiblingMenus",["loc",[null,[231,47],[231,64]]],0,0,0,0]],[],["loc",[null,[231,39],[231,65]]],0,0],"classNames","col-sm-12 col-md-6 col-lg-6 form-control","content",["subexpr","@mut",[["get","avdiskofferings",["loc",[null,[231,128],[231,143]]],0,0,0,0]],[],[],0,0],"prompt","Please select a disk offering (extra/DATA disk)","optionLabelPath","name","optionValuePath","id","value",["subexpr","@mut",[["get","model.interoutevdcConfig.diskofferingid",["loc",[null,[231,252],[231,291]]],0,0,0,0]],[],[],0,0]],["loc",[null,[231,19],[231,294]]],0,0],
      ["inline","input",[],["type","text","value",["subexpr","@mut",[["get","model.interoutevdcConfig.disksize",["loc",[null,[232,31],[232,64]]],0,0,0,0]],[],[],0,0],"classNames","col-sm-12 col-md-6 col-lg-6 form-control","placeholder","Disk size (GB)"],["loc",[null,[232,5],[232,149]]],0,0],
      ["block","if",[["get","isStep13",["loc",[null,[236,14],[236,22]]],0,0,0,0]],[],11,null,["loc",[null,[236,8],[240,15]]]],
      ["attribute","class",["concat",["horizontal-form r-pt0 step14 ",["subexpr","unless",[["get","isStep14",["loc",[null,[244,54],[244,62]]],0,0,0,0],"hide"],[],["loc",[null,[244,45],[244,71]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["attribute","class",["concat",["horizontal-form r-pt0 step15 ",["subexpr","unless",[["get","isGteStep15",["loc",[null,[251,54],[251,65]]],0,0,0,0],"hide"],[],["loc",[null,[251,45],[251,74]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["inline","partial",["host/add-common"],[],["loc",[null,[256,2],[256,31]]],0,0],
      ["inline","partial",["host/add-options"],[],["loc",[null,[256,32],[256,62]]],0,0],
      ["inline","top-errors",[],["errors",["subexpr","@mut",[["get","errors",["loc",[null,[258,21],[258,27]]],0,0,0,0]],[],[],0,0]],["loc",[null,[258,1],[258,29]]],0,0],
      ["inline","save-cancel",[],["save","save","cancel","cancel"],["loc",[null,[258,30],[258,73]]],0,0]
    ],
    locals: [],
    templates: [child0, child1, child2, child3, child4, child5, child6, child7, child8, child9, child10, child11]
  };
}()));;

});
