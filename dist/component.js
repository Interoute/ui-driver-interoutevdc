define('ui/components/machine/driver-interoutevdc/component', ['exports', 'ember', 'ui/mixins/driver'],
	function(exports, _ember, _uiMixinsDriver) {
		exports['default'] = _ember['default'].Component.extend(_uiMixinsDriver['default'], {
		driverName: 'interoutevdc',

		// Write your component here, starting with setting 'model' to a machine with your config populated
		bootstrap: function() {
			let config = this.get("store").createRecord({
				type: 'interoutevdcConfig',
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
				'interoutevdcConfig': config
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

			}, (err) => {
			    let errors = this.get('errors') || [];
			    errors.pushObject(this.apiErrorMessage(err, '', '', 'WARNING No zone could be found!'));
			    this.set('errors', errors);
			    this.set('step', 3);
			});
		    },

                    selectNetwork: function() {
			this.set('step', 6);
			this.apiRequest('listTemplates', { templatefilter: 'self', zoneid: this.get('model.interoutevdcConfig.zoneid') }).then((res) => {
 	                    let templates = [];
			    (res.listtemplatesresponse.template || []).forEach((temp) => {
                                let obj = {
                                    id: temp.id,
                                    name: temp.name
                                };
                                templates.push(obj);
                            });
                            this.set('avtemplates', templates);
                            this.set('step', 7);
		        }, (err) => {
                            let errors = this.get('errors') || [];
                            errors.pushObject(this.apiErrorMessage(err, '', '', 'No templates could be found!'));
                            this.set('errors', errors);
                            this.set('step', 3);
                        });
                    },

                    selectTemplate: function() {
			this.set('step', 8);
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
                            this.set('step', 9);
                        }, (err) => {
                            let errors = this.get('errors') || [];
                            errors.pushObject(this.apiErrorMessage(err, '', '', 'No service offerings found!'));
                            this.set('errors', errors);
                            this.set('step', 3);
                        });
                    },

		    setInstance: function() {
			this.set('step', 10);
			this.set('step', 11);
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
		isGteStep3: Ember.computed.gte('step', 3),
		isGteStep5: Ember.computed.gte('step', 5),
		isGteStep7: Ember.computed.gte('step', 7),
                isGteStep9: Ember.computed.gte('step', 9),
		isGteStep11: Ember.computed.gte('step', 11),
	});
});
;
define("ui/components/machine/driver-interoutevdc/template",["exports","ember","ui/mixins/driver"],function(exports,_ember,_uiMixinsDriver){

exports["default"] = Ember.HTMLBars.template((function() {
  var child0 = (function() {
    return {
      meta: {
        "revision": "Ember@2.7.1",
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
        "revision": "Ember@2.7.1",
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
        "revision": "Ember@2.7.1",
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
        "revision": "Ember@2.7.1",
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
        "revision": "Ember@2.7.1",
        "loc": {
          "source": null,
          "start": {
            "line": 36,
            "column": 40
          },
          "end": {
            "line": 36,
            "column": 175
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
        ["inline","input",[],["type","text","value",["subexpr","@mut",[["get","model.interoutevdcConfig.vdcregion",["loc",[null,[36,82],[36,116]]],0,0,0,0]],[],[],0,0],"classNames","form-control","placeholder","Your VDC Region"],["loc",[null,[36,56],[36,174]]],0,0]
      ],
      locals: [],
      templates: []
    };
  }());
  var child5 = (function() {
    return {
      meta: {
        "revision": "Ember@2.7.1",
        "loc": {
          "source": null,
          "start": {
            "line": 36,
            "column": 175
          },
          "end": {
            "line": 40,
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
        var el1 = dom.createTextNode("\n                                        ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","form-control-static");
        var el2 = dom.createTextNode("\n                                                ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n                                        ");
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
        ["content","model.interoutevdcConfig.vdcregion",["loc",[null,[38,48],[38,86]]],0,0,0,0]
      ],
      locals: [],
      templates: []
    };
  }());
  var child6 = (function() {
    return {
      meta: {
        "revision": "Ember@2.7.1",
        "loc": {
          "source": null,
          "start": {
            "line": 45,
            "column": 1
          },
          "end": {
            "line": 49,
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
        ["inline","top-errors",[],["errors",["subexpr","@mut",[["get","errors",["loc",[null,[45,37],[45,43]]],0,0,0,0]],[],[],0,0]],["loc",[null,[45,17],[45,45]]],0,0],
        ["element","action",["cloudAuth"],[],["loc",[null,[47,10],[47,32]]],0,0],
        ["element","action",["cancel"],[],["loc",[null,[47,101],[47,120]]],0,0]
      ],
      locals: [],
      templates: []
    };
  }());
  var child7 = (function() {
    return {
      meta: {
        "revision": "Ember@2.7.1",
        "loc": {
          "source": null,
          "start": {
            "line": 74,
            "column": 1
          },
          "end": {
            "line": 78,
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
        ["inline","top-errors",[],["errors",["subexpr","@mut",[["get","errors",["loc",[null,[74,37],[74,43]]],0,0,0,0]],[],[],0,0]],["loc",[null,[74,17],[74,45]]],0,0],
        ["element","action",["selectZone"],[],["loc",[null,[76,10],[76,33]]],0,0],
        ["element","action",["cancel"],[],["loc",[null,[76,84],[76,103]]],0,0]
      ],
      locals: [],
      templates: []
    };
  }());
  var child8 = (function() {
    return {
      meta: {
        "revision": "Ember@2.7.1",
        "loc": {
          "source": null,
          "start": {
            "line": 103,
            "column": 8
          },
          "end": {
            "line": 107,
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
        ["inline","top-errors",[],["errors",["subexpr","@mut",[["get","errors",["loc",[null,[103,44],[103,50]]],0,0,0,0]],[],[],0,0]],["loc",[null,[103,24],[103,52]]],0,0],
        ["element","action",["selectNetwork"],[],["loc",[null,[105,24],[105,50]]],0,0],
        ["element","action",["cancel"],[],["loc",[null,[105,101],[105,120]]],0,0]
      ],
      locals: [],
      templates: []
    };
  }());
  var child9 = (function() {
    return {
      meta: {
        "revision": "Ember@2.7.1",
        "loc": {
          "source": null,
          "start": {
            "line": 132,
            "column": 8
          },
          "end": {
            "line": 136,
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
        ["inline","top-errors",[],["errors",["subexpr","@mut",[["get","errors",["loc",[null,[132,44],[132,50]]],0,0,0,0]],[],[],0,0]],["loc",[null,[132,24],[132,52]]],0,0],
        ["element","action",["selectTemplate"],[],["loc",[null,[134,24],[134,51]]],0,0],
        ["element","action",["cancel"],[],["loc",[null,[134,102],[134,121]]],0,0]
      ],
      locals: [],
      templates: []
    };
  }());
  var child10 = (function() {
    return {
      meta: {
        "revision": "Ember@2.7.1",
        "loc": {
          "source": null,
          "start": {
            "line": 161,
            "column": 8
          },
          "end": {
            "line": 165,
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
        ["inline","top-errors",[],["errors",["subexpr","@mut",[["get","errors",["loc",[null,[161,44],[161,50]]],0,0,0,0]],[],[],0,0]],["loc",[null,[161,24],[161,52]]],0,0],
        ["element","action",["setInstance"],[],["loc",[null,[163,24],[163,48]]],0,0],
        ["element","action",["cancel"],[],["loc",[null,[163,99],[163,118]]],0,0]
      ],
      locals: [],
      templates: []
    };
  }());
  return {
    meta: {
      "revision": "Ember@2.7.1",
      "loc": {
        "source": null,
        "start": {
          "line": 1,
          "column": 0
        },
        "end": {
          "line": 185,
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
      var el6 = dom.createTextNode("\n                                        ");
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
      dom.setAttribute(el3,"class","over-hr r-mt20 r-mb20");
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
      dom.setAttribute(el4,"class","col-sm-12 col-md-8");
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
      var el6 = dom.createTextNode("ServiceOffering");
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
      var el1 = dom.createComment(" Step 11 ");
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
      var el1 = dom.createTextNode("\n");
      dom.appendChild(el0, el1);
      return el0;
    },
    buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
      var element15 = dom.childAt(fragment, [0]);
      var element16 = dom.childAt(element15, [1, 1]);
      var element17 = dom.childAt(element16, [3]);
      var element18 = dom.childAt(element16, [5]);
      var element19 = dom.childAt(element16, [7]);
      var element20 = dom.childAt(fragment, [4]);
      var element21 = dom.childAt(fragment, [8]);
      var element22 = dom.childAt(element21, [1, 3]);
      var element23 = dom.childAt(fragment, [12]);
      var element24 = dom.childAt(fragment, [16]);
      var element25 = dom.childAt(element24, [1, 3]);
      var element26 = dom.childAt(fragment, [20]);
      var element27 = dom.childAt(fragment, [24]);
      var element28 = dom.childAt(element27, [1, 3]);
      var element29 = dom.childAt(fragment, [28]);
      var element30 = dom.childAt(fragment, [32]);
      var element31 = dom.childAt(element30, [1, 3]);
      var element32 = dom.childAt(fragment, [36]);
      var element33 = dom.childAt(fragment, [40]);
      var element34 = dom.childAt(element33, [1]);
      var morphs = new Array(33);
      morphs[0] = dom.createAttrMorph(element17, 'class');
      morphs[1] = dom.createMorphAt(dom.childAt(element17, [3]),1,1);
      morphs[2] = dom.createAttrMorph(element18, 'class');
      morphs[3] = dom.createMorphAt(dom.childAt(element18, [3]),1,1);
      morphs[4] = dom.createAttrMorph(element19, 'class');
      morphs[5] = dom.createMorphAt(dom.childAt(element19, [3]),1,1);
      morphs[6] = dom.createMorphAt(element15,3,3);
      morphs[7] = dom.createAttrMorph(element20, 'class');
      morphs[8] = dom.createAttrMorph(element21, 'class');
      morphs[9] = dom.createAttrMorph(element22, 'class');
      morphs[10] = dom.createMorphAt(dom.childAt(element22, [3]),1,1);
      morphs[11] = dom.createMorphAt(element21,3,3);
      morphs[12] = dom.createAttrMorph(element23, 'class');
      morphs[13] = dom.createAttrMorph(element24, 'class');
      morphs[14] = dom.createAttrMorph(element25, 'class');
      morphs[15] = dom.createMorphAt(dom.childAt(element25, [3]),1,1);
      morphs[16] = dom.createMorphAt(element24,3,3);
      morphs[17] = dom.createAttrMorph(element26, 'class');
      morphs[18] = dom.createAttrMorph(element27, 'class');
      morphs[19] = dom.createAttrMorph(element28, 'class');
      morphs[20] = dom.createMorphAt(dom.childAt(element28, [3]),1,1);
      morphs[21] = dom.createMorphAt(element27,3,3);
      morphs[22] = dom.createAttrMorph(element29, 'class');
      morphs[23] = dom.createAttrMorph(element30, 'class');
      morphs[24] = dom.createAttrMorph(element31, 'class');
      morphs[25] = dom.createMorphAt(dom.childAt(element31, [3]),1,1);
      morphs[26] = dom.createMorphAt(element30,3,3);
      morphs[27] = dom.createAttrMorph(element32, 'class');
      morphs[28] = dom.createAttrMorph(element33, 'class');
      morphs[29] = dom.createMorphAt(element34,3,3);
      morphs[30] = dom.createMorphAt(element34,5,5);
      morphs[31] = dom.createMorphAt(element33,3,3);
      morphs[32] = dom.createMorphAt(element33,5,5);
      return morphs;
    },
    statements: [
      ["attribute","class",["concat",["row ",["subexpr","if",[["get","isStep1",["loc",[null,[7,24],[7,31]]],0,0,0,0],"form-group"],[],["loc",[null,[7,19],[7,46]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["block","if",[["get","isStep1",["loc",[null,[12,11],[12,18]]],0,0,0,0]],[],0,1,["loc",[null,[12,5],[16,12]]]],
      ["attribute","class",["concat",["row ",["subexpr","if",[["get","isStep1",["loc",[null,[19,24],[19,31]]],0,0,0,0],"form-group"],[],["loc",[null,[19,19],[19,46]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["block","if",[["get","isStep1",["loc",[null,[24,11],[24,18]]],0,0,0,0]],[],2,3,["loc",[null,[24,5],[28,12]]]],
      ["attribute","class",["concat",["row ",["subexpr","if",[["get","isStep1",["loc",[null,[31,45],[31,52]]],0,0,0,0],"form-group"],[],["loc",[null,[31,40],[31,67]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["block","if",[["get","isStep1",["loc",[null,[36,46],[36,53]]],0,0,0,0]],[],4,5,["loc",[null,[36,40],[40,47]]]],
      ["block","if",[["get","isStep1",["loc",[null,[45,7],[45,14]]],0,0,0,0]],[],6,null,["loc",[null,[45,1],[49,8]]]],
      ["attribute","class",["concat",["horizontal-form r-pt0 ",["subexpr","unless",[["get","isStep2",["loc",[null,[53,47],[53,54]]],0,0,0,0],"hide"],[],["loc",[null,[53,38],[53,63]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["attribute","class",["concat",["horizontal-form r-pt0 ",["subexpr","unless",[["get","isGteStep3",["loc",[null,[60,47],[60,57]]],0,0,0,0],"hide"],[],["loc",[null,[60,38],[60,66]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["attribute","class",["concat",["row ",["subexpr","if",[["get","isStep3",["loc",[null,[65,23],[65,30]]],0,0,0,0],"form-group"],[],["loc",[null,[65,18],[65,45]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["inline","new-select",[],["classNames","form-control","content",["subexpr","@mut",[["get","avzones",["loc",[null,[70,59],[70,66]]],0,0,0,0]],[],[],0,0],"prompt","Please select a zone","optionLabelPath","name","optionValuePath","id","value",["subexpr","@mut",[["get","model.interoutevdcConfig.zoneid",["loc",[null,[70,147],[70,178]]],0,0,0,0]],[],[],0,0]],["loc",[null,[70,12],[70,180]]],0,0],
      ["block","if",[["get","isStep3",["loc",[null,[74,7],[74,14]]],0,0,0,0]],[],7,null,["loc",[null,[74,1],[78,8]]]],
      ["attribute","class",["concat",["horizontal-form r-pt0 ",["subexpr","unless",[["get","isStep4",["loc",[null,[82,47],[82,54]]],0,0,0,0],"hide"],[],["loc",[null,[82,38],[82,63]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["attribute","class",["concat",["horizontal-form r-pt0 ",["subexpr","unless",[["get","isGteStep5",["loc",[null,[89,47],[89,57]]],0,0,0,0],"hide"],[],["loc",[null,[89,38],[89,66]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["attribute","class",["concat",["row ",["subexpr","if",[["get","isStep5",["loc",[null,[94,37],[94,44]]],0,0,0,0],"form-group"],[],["loc",[null,[94,32],[94,59]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["inline","new-select",[],["classNames","form-control","content",["subexpr","@mut",[["get","avnetworks",["loc",[null,[99,73],[99,83]]],0,0,0,0]],[],[],0,0],"prompt","Please select a network","optionLabelPath","name","optionValuePath","id","value",["subexpr","@mut",[["get","model.interoutevdcConfig.networkid",["loc",[null,[99,167],[99,201]]],0,0,0,0]],[],[],0,0]],["loc",[null,[99,26],[99,204]]],0,0],
      ["block","if",[["get","isStep5",["loc",[null,[103,14],[103,21]]],0,0,0,0]],[],8,null,["loc",[null,[103,8],[107,15]]]],
      ["attribute","class",["concat",["horizontal-form r-pt0 ",["subexpr","unless",[["get","isStep6",["loc",[null,[111,47],[111,54]]],0,0,0,0],"hide"],[],["loc",[null,[111,38],[111,63]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["attribute","class",["concat",["horizontal-form r-pt0 ",["subexpr","unless",[["get","isGteStep7",["loc",[null,[118,47],[118,57]]],0,0,0,0],"hide"],[],["loc",[null,[118,38],[118,66]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["attribute","class",["concat",["row ",["subexpr","if",[["get","isStep7",["loc",[null,[123,37],[123,44]]],0,0,0,0],"form-group"],[],["loc",[null,[123,32],[123,59]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["inline","new-select",[],["classNames","form-control","content",["subexpr","@mut",[["get","avtemplates",["loc",[null,[128,73],[128,84]]],0,0,0,0]],[],[],0,0],"prompt","Please select a template","optionLabelPath","name","optionValuePath","id","value",["subexpr","@mut",[["get","model.interoutevdcConfig.templateid",["loc",[null,[128,169],[128,204]]],0,0,0,0]],[],[],0,0]],["loc",[null,[128,26],[128,207]]],0,0],
      ["block","if",[["get","isStep7",["loc",[null,[132,14],[132,21]]],0,0,0,0]],[],9,null,["loc",[null,[132,8],[136,15]]]],
      ["attribute","class",["concat",["horizontal-form r-pt0 ",["subexpr","unless",[["get","isStep8",["loc",[null,[140,47],[140,54]]],0,0,0,0],"hide"],[],["loc",[null,[140,38],[140,63]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["attribute","class",["concat",["horizontal-form r-pt0 ",["subexpr","unless",[["get","isGteStep9",["loc",[null,[147,47],[147,57]]],0,0,0,0],"hide"],[],["loc",[null,[147,38],[147,66]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["attribute","class",["concat",["row ",["subexpr","if",[["get","isStep9",["loc",[null,[152,37],[152,44]]],0,0,0,0],"form-group"],[],["loc",[null,[152,32],[152,59]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["inline","new-select",[],["classNames","form-control","content",["subexpr","@mut",[["get","avservofferings",["loc",[null,[157,73],[157,88]]],0,0,0,0]],[],[],0,0],"optionLabelPath","name","optionValuePath","id","value",["subexpr","@mut",[["get","model.interoutevdcConfig.serviceofferingid",["loc",[null,[157,139],[157,181]]],0,0,0,0]],[],[],0,0]],["loc",[null,[157,26],[157,184]]],0,0],
      ["block","if",[["get","isStep9",["loc",[null,[161,14],[161,21]]],0,0,0,0]],[],10,null,["loc",[null,[161,8],[165,15]]]],
      ["attribute","class",["concat",["horizontal-form r-pt0 ",["subexpr","unless",[["get","isStep10",["loc",[null,[169,47],[169,55]]],0,0,0,0],"hide"],[],["loc",[null,[169,38],[169,64]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["attribute","class",["concat",["horizontal-form r-pt0 ",["subexpr","unless",[["get","isGteStep11",["loc",[null,[176,47],[176,58]]],0,0,0,0],"hide"],[],["loc",[null,[176,38],[176,67]]],0,0]],0,0,0,0,0],0,0,0,0],
      ["inline","partial",["host/add-common"],[],["loc",[null,[181,2],[181,31]]],0,0],
      ["inline","partial",["host/add-options"],[],["loc",[null,[181,32],[181,62]]],0,0],
      ["inline","top-errors",[],["errors",["subexpr","@mut",[["get","errors",["loc",[null,[183,21],[183,27]]],0,0,0,0]],[],[],0,0]],["loc",[null,[183,1],[183,29]]],0,0],
      ["inline","save-cancel",[],["save","save","cancel","cancel"],["loc",[null,[183,30],[183,73]]],0,0]
    ],
    locals: [],
    templates: [child0, child1, child2, child3, child4, child5, child6, child7, child8, child9, child10]
  };
}()));;

});
