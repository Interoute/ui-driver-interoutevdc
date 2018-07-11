/* v----- Do not change anything between here
 *       (the DRIVERNAME placeholder will be automatically replaced during build) */
define('ui/components/node-driver/driver-%%DRIVERNAME%%/component', ['exports', 'ember', 'shared/components/node-driver/driver-%%DRIVERNAME%%/component'], function (exports, _ember, _component) {
  exports['default'] = _component['default'];
});

define('shared/components/node-driver/driver-%%DRIVERNAME%%/component', ['exports', 'ember', 'shared/mixins/node-driver', 'shared/components/node-driver/driver-%%DRIVERNAME%%/template'], function (exports, _ember, _uiMixinsDriver, _template) {
/* ^--- And here */

  // You can put ember object here
  var computed = Ember.computed;
  var get = Ember.get;
  var set = Ember.set;
  var alias = Ember.computed.alias;

  let ZONES = [
      {region: 'Europe', name: 'Amsterdam', id: '3c43b32b-fadf-4629-b8e9-61fb7a5b9bb8'},
      {region: 'Europe', name: 'Berlin', id: 'fc129b38-d490-4cd9-acf8-838cf7eb168d'},
      {region: 'Europe', name: 'Frankfurt', id: '7144b207-e97e-4e4a-b15d-64a30711e0e7'},
      {region: 'Europe', name: 'Geneva', id: '1ef96ec0-9e51-4502-9a81-045bc37ecc0a'},
      {region: 'Europe', name: 'Istanbul', id: '1ce2fa41-bc99-484c-99b9-b1b6a28487ba'},
      {region: 'Europe', name: 'London', id: 'f6b0d029-8e53-413b-99f3-e0a2a543ee1d'},
      {region: 'Europe', name: 'Madrid', id: 'ddf450f2-51b2-433d-8dea-c871be6de38d'},
      {region: 'Europe', name: 'Milan', id: '58848a37-db49-4518-946a-88911db0ee2b'},
      {region: 'Europe', name: 'Paris', id: '374b937d-2051-4440-b02c-a314dd9cb27e'},
      {region: 'Europe', name: 'Slough', id: '5343ddc2-919f-4d1b-a8e6-59f91d901f8e'},
      {region: 'Europe', name: 'Stockholm', id: 'e564f8cf-efda-4119-b404-b6d00cf434b3'},
      {region: 'Europe', name: 'Zurich', id: 'a5d3e015-0797-4283-b562-84feea6f66af'},
      {region: 'USA', name: 'New York', id: 'a2f03939-16e4-4d7e-b362-b22b4fe8ca09'},
      {region: 'USA', name: 'Los Angeles', id: '43b96440-497e-4ed3-88c9-e42fddd28d27'},
      {region: 'Asia', name: 'Hong Kong', id: 'edcc00ef-1a8e-411b-a46a-b123c20ed8f0'},
      {region: 'Asia', name: 'Singapore', id: 'f2e16beb-b8b1-4f1d-b211-6b6feb6bb394'}
  ];

  let TEMPLATE_TYPE = [
      {name: 'Private', id: 'self'},
      {name: 'Public', id: 'featured'}
  ];

/* v----- Do not change anything between here
 *       (the DRIVERNAME placeholder will be automatically replaced during build) */
  exports['default'] = _ember['default'].Component.extend(_uiMixinsDriver['default'], {
    layout: _template.default,
    driverName: '%%DRIVERNAME%%',
    config: alias('model.%%DRIVERNAME%%Config'),
/* ^--- And here */

    // Write your component here, starting with setting 'model' to a machine with your config populated
    bootstrap: function() {
        let config = get(this, 'globalStore').createRecord({
            type: '%%DRIVERNAME%%Config',
            apiurl: 'https://myservices.interoute.com/myservices/api/vdc',
            apikey: '',
            secretkey: '',
            zoneid: ZONES[0].id,
            vdcregion: 'Europe',
            networkid: null,
            templateid: null,
            serviceofferingid: null,
            diskofferingid: null,
            disksize: null,
            ram: 1,
            cpu: 1,
            templatefilter: TEMPLATE_TYPE[0].id,
            location: null,
            size: null,
        });

        set(this, 'model.%%DRIVERNAME%%Config', config);
        set(this, 'zones', ZONES);
        set(this, 'templatetype', TEMPLATE_TYPE);

    },

    step: 1,
    zones: ZONES,

    actions: {
        changeZone: function() {
            set(this, 'step', 1)
        },

        setRam: function(value) {
            set(this, 'model.%%DRIVERNAME%%Config.ram', value);
            this.updateServiceOffering();
        },

        updateServiceOffering: function() {
            this.updateServiceOffering();
        },

        interouteVDCLogin: function() {
            set(this, 'errors', []);
            set(this, 'step', 2);

            // Set values to display for already chosen options
            let zoneid = get(this, "model.%%DRIVERNAME%%Config.zoneid");
            set(this, 'model.%%DRIVERNAME%%Config.vdcregion', this.listLookup(ZONES, "id", zoneid, "region"));
            set(this, 'model.%%DRIVERNAME%%Config.location', this.listLookup(ZONES, "id", zoneid, "name"));
            set(this, 'model.%%DRIVERNAME%%Config.Location', this.listLookup(ZONES, "id", zoneid, "name"));
            set(this, 'model.%%DRIVERNAME%%Config.templatefiltername', this.listLookup(
                TEMPLATE_TYPE, "id", get(this, "model.%%DRIVERNAME%%Config.templatefilter"), "name"));

            // Send API requests to obtain data and fill dropdowns
            this.handleApiRequest("Network", {zoneid: get(this, 'model.%%DRIVERNAME%%Config.zoneid')}, "displaytext");
            this.handleApiRequest(
                "Template",
                {
                    zoneid: get(this, 'model.%%DRIVERNAME%%Config.zoneid'),
                    templatefilter: get(this, 'model.%%DRIVERNAME%%Config.templatefilter')
                },
                "displaytext",
                function(d) { return !d.isfeatured || d.name.toLowerCase().includes("rancher"); }
            );
            this.handleApiRequest("DiskOffering", {}, "displaytext", function(d) { return d.disksize == 0; });
            this.handleApiRequest("ServiceOffering", {}, "name");

        },
    },

    updateServiceOffering: function() {
        let offering_name = get(this, 'model.%%DRIVERNAME%%Config.ram') * 1024 + "-" + get(this, 'model.%%DRIVERNAME%%Config.cpu');
        get(this, 'serviceofferings').forEach((offering) => {
            if (offering.name == offering_name) {
                set(this, 'model.%%DRIVERNAME%%Config.serviceofferingid', offering.id);
            }
        })
    },

    handleApiRequest: function(resource_type, data, field_name, filter_function) {
        this.apiRequest("list" + resource_type + "s", data).then((res) => {
            this.parseApiResponse(res, resource_type.toLowerCase(), field_name, filter_function);
            let errors = get(this, 'errors');
            if (!errors || Object.keys(errors).length == 0) {
                set(this, 'step', 3);
            }
        }, (err) => {
            let errors = get(this, 'errors') || [];
            errors.push(this.apiErrorMessage(err, '', '', "list" + resource_type + "s API request failed"));
            set(this, 'errors', errors);
            set(this, 'step', 1);
        });
    },

    parseApiResponse: function(api_response, resource_type, field_name, filter_function) {
        // Parse an API response and set the corresponding fields in the config
        let objects = [];
        window[resource_type] = api_response;
        (api_response["list" + resource_type + "sresponse"][resource_type] || []).forEach((resource) => {
            if (!filter_function || filter_function(resource)){
                let obj = {
                    id: resource.id,
                    name: resource[field_name],
                };
                objects.push(obj);
            }
        });
        set(this, resource_type + "s", objects);
        if (Object.keys(objects).length == 0) {
            let errors = get(this, 'errors') || [];
            errors.push("No " + resource_type + "s found");
            set(this, 'errors', errors);
            set(this, 'step', 1);
        } else {
            set(this, 'model.%%DRIVERNAME%%Config.' + resource_type + 'id', objects[0].id);
        }
    },

    apiRequest(command, params) {
        let url		      = get(this, 'app.proxyEndpoint') + '/' + get(this, 'model.%%DRIVERNAME%%Config.apiurl');
        params		      = params || {};
        params.command	= command;
        params.apiKey 	= get(this, 'model.%%DRIVERNAME%%Config.apikey');
        params.region	  = get(this, 'model.%%DRIVERNAME%%Config.vdcregion');
        params.response	= 'json';

        return this.ajaxPromise(
        {
            url: url,
            method: 'POST',
            dataType: 'json',
            data: params,
            headers: {
                'Accept': 'application/json',
                'X-API-Headers-Restrict': 'Content-Length'
            },
            beforeSend: (xhr, settings) => {
                xhr.setRequestHeader('Content-Type', 'rancher:' + settings.contentType);
                // Compute the signature
                let qs = settings.data.split('&')
                        .map((q) => q.replace(/\+/g, '%20'))
                        .map(Function.prototype.call, String.prototype.toLowerCase)
                        .sort()
                        .join('&');
                settings.data += '&signature=' + encodeURIComponent(AWS.util.crypto.hmac(
                    get(this, 'model.%%DRIVERNAME%%Config.secretkey'), qs, 'base64', 'sha1'));
                settings.url += "?" + settings.data;
                return true;
            }
        }, true);
    },

    listLookup: function(list, sourceField, value, targetField) {
        // Look up the value of another field of a dictionary which is in a list
        let rv = "";
        list.forEach((element) => {
            if (element[sourceField] == value) {
                rv = element[targetField];
            }
        });
        return rv;
    },

    ajaxPromise: function(opt, justBody) {
        var promise = new Ember.RSVP.Promise(function(resolve, reject) {
            Ember.$.ajax(opt).then(success, fail);

            function success(body, textStatus, xhr) {
                if (justBody === true){
                    resolve(body, 'AJAX Response: '+ opt.url + '(' + xhr.status + ')');
                } else {
                    resolve({xhr: xhr, textStatus: textStatus}, 'AJAX Response: '+ opt.url + '(' + xhr.status + ')');
                }
            }

            function fail(xhr, textStatus, err) {
                reject({xhr: xhr, textStatus: textStatus, err: err}, 'AJAX Error: ' + opt.url + '(' + xhr.status + ')');
            }
        }, 'Raw AJAX Request: ' + opt.url);
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

    // Add custom validation beyond what can be done from the config API schema
    validate() {
        // Get generic API validation errors
        this._super();
        var errors = get(this, 'errors') || [];

        // Set the array of errors for display, and return true if saving should continue.
        if (get(errors, 'length')) {
            return false;
        } else {
            return true;
        }
    },

  });
});
/*define('ui/components/machine/driver-%%DRIVERNAME%%/component', ['exports', 'ember', 'ui/mixins/driver', 'ui/components/new-select/component'],
    function(exports, _ember, _uiMixinsDriver, _newSelect) {
        var Ember = _ember.default;
        var DriverMixin = _uiMixinsDriver.default;
        var avServOfferingsArray = [];
        var changeServOffering = false;
        var serviceOfferingName;
        exports['default'] = Ember.Component.extend(DriverMixin, {
        driverName: '%%DRIVERNAME%%',
        config: Ember.computed.alias('model.%%DRIVERNAME%%Config'),
        bootstrap: function(){
            let config = this.get("store").createRecord({
                type: '%%DRIVERNAME%%Config',
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
                '%%DRIVERNAME%%Config': config
            }));

            let regions = [ { "id": "Europe", "name": "EU" }, { "id": "USA", "name": "US" }, { "id": "Asia", "name": "Asia" } ];
            if ( this.get('model.%%DRIVERNAME%%Config.vdcregion') == '' ) {
                this.set('model.%%DRIVERNAME%%Config.vdcregion', regions[0].id);
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
                this.set('model.%%DRIVERNAME%%Config.serviceOfferingName', this.get('model.%%DRIVERNAME%%Config.ram') + '-' + this.get('model.%%DRIVERNAME%%Config.cpu') );
                serviceOfferingName = this.get('model.%%DRIVERNAME%%Config.ram') + '-' + this.get('model.%%DRIVERNAME%%Config.cpu');
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
                select.selectedIndex = 1;
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

                    this.set('model.%%DRIVERNAME%%Config.zoneid', zones[0].id);
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
                            name: net.displaytext,
                        };
                        networks.push(obj);
                    });
                    this.set('avnetworks', networks);
                    this.set('step', 5);
                    this.set('model.%%DRIVERNAME%%Config.networkid', networks[0].id);
                }, (err) => {
                    let errors = this.get('errors') || [];
                    errors.pushObject(this.apiErrorMessage(err, '', '', 'WARNING No zone could be found!'));
                    this.set('errors', errors);
                    this.set('step', 3);
                });
            },

            selectNetwork: function() {
                this.set('step', 6);
                let templatestype = [ { "id": "featured", "name": "Public" }, { "id": "self", "name": "Private" } ];
                if (this.get('model.%%DRIVERNAME%%Config.templatefilter') == ''){
                    this.set('model.%%DRIVERNAME%%Config.templatefilter', templatestype[0].id);
                }
                this.set('avtemplatestype', templatestype);
                this.set('step', 7);
            },

            selectTemplateType: function() {
                this.set('step', 8);
                if (this.get('model.%%DRIVERNAME%%Config.templatefilter') == 'self'){
                    var templatekeyword = '';
                } else {
                    var templatekeyword = 'ranchernode';
                }
                this.apiRequest('listTemplates', { templatefilter: this.get('model.%%DRIVERNAME%%Config.templatefilter'), zoneid: this.get('model.%%DRIVERNAME%%Config.zoneid'), keyword: templatekeyword }).then((res) => {
                    let templates = [];
                    (res.listtemplatesresponse.template || []).forEach((temp) => {
                        let obj = {
                            id: temp.id,
                            name: temp.displaytext
                        };
                        templates.push(obj);
                    });

                    if (templates.length == 0) {
                        let errors = this.get('errors') || [];
                        errors.pushObject(this.apiErrorMessage('', '', '', 'No templates could be found!'));
                        this.set('errors', errors);
                        this.set('step', 3);
                    } else {
                        this.set('model.%%DRIVERNAME%%Config.templateid', templates[0].id);
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
                this.set('model.%%DRIVERNAME%%Config.serviceOfferingName', '1024-1');
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
                var result = this.apiRequest('listServiceOfferings', { issystem: 'false', name: this.get('model.%%DRIVERNAME%%Config.serviceOfferingName') }).then((res) => {
                    this.set('model.%%DRIVERNAME%%Config.serviceofferingid', res.listserviceofferingsresponse.serviceoffering[0].id);
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
                    this.set('model.%%DRIVERNAME%%Config.disksize', null);
                    this.set('model.%%DRIVERNAME%%Config.diskofferingid', null);
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
                if (e.target.id == 'cpuoffering' && (this.get('model.%%DRIVERNAME%%Config.cpu') >= 1 && this.get('model.%%DRIVERNAME%%Config.cpu') < 16) ) {
                    this.set('model.%%DRIVERNAME%%Config.cpu', Number(e.target.value));
                    var cpu = this.get('model.%%DRIVERNAME%%Config.cpu');
                    var vram = this.get('model.%%DRIVERNAME%%Config.ram');
                    this.set('model.%%DRIVERNAME%%Config.serviceOfferingName', (vram * 1024) + '-' + cpu );

                }

                if (e.target.id == 'vramoffering' && (this.get('model.%%DRIVERNAME%%Config.ram') >= 1 && this.get('model.%%DRIVERNAME%%Config.ram') < 1024 )) {
                    this.set('model.%%DRIVERNAME%%Config.ram', Number(e.target.value));
                    var cpu = this.get('model.%%DRIVERNAME%%Config.cpu');
                    var vram = this.get('model.%%DRIVERNAME%%Config.ram');
                    this.set('model.%%DRIVERNAME%%Config.serviceOfferingName', (vram * 1024) + '-' + cpu );
                }

                if (this.get('model.%%DRIVERNAME%%Config.cpu') <= 0) {
                    this.set('model.%%DRIVERNAME%%Config.cpu', 1);
                    $('#cpuoffering').val('1');
                }

                if (this.get('model.%%DRIVERNAME%%Config.cpu') > 16) {
                    this.set('model.%%DRIVERNAME%%Config.cpu', 16);
                    $('#cpuoffering').val('16')
                }

                if (this.get('model.%%DRIVERNAME%%Config.ram') <= 0) {
                    this.set('model.%%DRIVERNAME%%Config.ram', 1);
                    $('#vramoffering').val('1');
                }

                if (this.get('model.%%DRIVERNAME%%Config.ram') > 1024) {
                    this.set('model.%%DRIVERNAME%%Config.ram', 1024);
                    $('#vramoffering').val('1024')
                }
            },

            lessCPU: function(e){
                if ( this.get('model.%%DRIVERNAME%%Config.cpu') > 1) {
                    var cpu = this.get('model.%%DRIVERNAME%%Config.cpu') - 1;
                    var vram = this.get('model.%%DRIVERNAME%%Config.ram');
                    this.set('model.%%DRIVERNAME%%Config.cpu', cpu);
                    this.set('model.%%DRIVERNAME%%Config.serviceOfferingName', (vram * 1024) + '-' + cpu );
                }
            },

            moreCPU: function(e){
                if ( this.get('model.%%DRIVERNAME%%Config.cpu') < 16) {
                    var cpu = this.get('model.%%DRIVERNAME%%Config.cpu') + 1;
                    var vram = this.get('model.%%DRIVERNAME%%Config.ram');
                    this.set('model.%%DRIVERNAME%%Config.cpu', cpu );
                    this.set('model.%%DRIVERNAME%%Config.serviceOfferingName', (vram * 1024) + '-' + cpu );
                }
            },

            lessVRAM: function(e){
                if ( this.get('model.%%DRIVERNAME%%Config.ram') > 1) {
                    var vram = this.get('model.%%DRIVERNAME%%Config.ram') / 2;
                    this.set('model.%%DRIVERNAME%%Config.ram', vram );
                    this.set('model.%%DRIVERNAME%%Config.serviceOfferingName', (vram * 1024) + '-' + this.get('model.%%DRIVERNAME%%Config.cpu') );
                }
            },

            moreVRAM: function(e){
                if ( this.get('model.%%DRIVERNAME%%Config.ram') < 64) {
                    var vram = this.get('model.%%DRIVERNAME%%Config.ram') * 2;
                    this.set('model.%%DRIVERNAME%%Config.ram', vram );
                    this.set('model.%%DRIVERNAME%%Config.serviceOfferingName', (vram * 1024) + '-' + this.get('model.%%DRIVERNAME%%Config.cpu') );
                }
            },

            setInstance: function() {
                this.set('step', 14);
                this.set('step', 15);
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
                    } else {
                        resolve({xhr: xhr, textStatus: textStatus},'AJAX Response: '+ opt.url + '(' + xhr.status + ')');
                    }
                }

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
*/
