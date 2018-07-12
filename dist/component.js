/* v----- Do not change anything between here
 *       (the DRIVERNAME placeholder will be automatically replaced during build) */
define('ui/components/node-driver/driver-interoutevdc/component', ['exports', 'ember', 'shared/components/node-driver/driver-interoutevdc/component'], function (exports, _ember, _component) {
  exports['default'] = _component['default'];
});

define('shared/components/node-driver/driver-interoutevdc/component', ['exports', 'ember', 'shared/mixins/node-driver', 'shared/components/node-driver/driver-interoutevdc/template'], function (exports, _ember, _uiMixinsDriver, _template) {
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

  let TEMPLATE_TYPES = [
      {name: 'Private', id: 'self'},
      {name: 'Public', id: 'featured'}
  ];

/* v----- Do not change anything between here
 *       (the DRIVERNAME placeholder will be automatically replaced during build) */
  exports['default'] = _ember['default'].Component.extend(_uiMixinsDriver['default'], {
    layout: _template.default,
    driverName: 'interoutevdc',
    config: alias('model.interoutevdcConfig'),
/* ^--- And here */

    // Write your component here, starting with setting 'model' to a machine with your config populated
    bootstrap: function() {
        let config = get(this, 'globalStore').createRecord({
            type: 'interoutevdcConfig',
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
            templatefilter: TEMPLATE_TYPES[0].id,
            location: null,
            size: null,
        });

        set(this, 'model.interoutevdcConfig', config);
    },

    step: 1,
    zones: ZONES,
    cpu: 1,
    ram: 1,
    templatetypes: TEMPLATE_TYPES,

    actions: {
        changeZone: function() {
            set(this, 'step', 1)
        },

        setRam: function(value) {
            set(this, 'ram', value);
            this.updateServiceOffering();
        },

        updateServiceOffering: function() {
            this.updateServiceOffering();
        },

        interouteVDCLogin: function() {
            set(this, 'errors', []);
            set(this, 'step', 2);

            // Set values to display for already chosen options
            let zoneid = get(this, 'model.interoutevdcConfig.zoneid');
            set(this, 'model.interoutevdcConfig.vdcregion', this.listLookup(ZONES, 'id', zoneid, 'region'));
            set(this, 'model.interoutevdcConfig.location', this.listLookup(ZONES, 'id', zoneid, 'name'));
            set(this, 'model.interoutevdcConfig.templatefiltername', this.listLookup(
                TEMPLATE_TYPES, 'id', get(this, 'model.interoutevdcConfig.templatefilter'), 'name'));

            // Send API requests to obtain data and fill dropdowns
            this.handleApiRequest('Network', {zoneid: get(this, 'model.interoutevdcConfig.zoneid')}, 'displaytext');
            let list_templates_data = {
                zoneid: get(this, 'model.interoutevdcConfig.zoneid'),
                templatefilter: get(this, 'model.interoutevdcConfig.templatefilter')
            }
            if (get(this, 'model.interoutevdcConfig.templatefilter') == 'featured') {
                list_templates_data['keyword'] = 'ranchernode';
            }
            this.handleApiRequest('Template', list_templates_data, 'displaytext');
            this.handleApiRequest('DiskOffering', {}, 'displaytext', {id: null, name: 'No extra disks'}, function(d) { return d.disksize == 0; });
            this.handleApiRequest('ServiceOffering', {}, 'name');
        },
    },

    updateServiceOffering: function() {
        let offering_name = get(this, 'ram') * 1024 + '-' + get(this, 'cpu');
        get(this, 'serviceofferings').forEach((offering) => {
            if (offering.name == offering_name) {
                set(this, 'model.interoutevdcConfig.serviceofferingid', offering.id);
            }
        })
    },

    handleApiRequest: function(resource_type, data, field_name, first_value, filter_function) {
        this.apiRequest('list' + resource_type + 's', data).then((res) => {
            this.parseApiResponse(res, resource_type.toLowerCase(), field_name, first_value, filter_function);
            let errors = get(this, 'errors');
            if (!errors || Object.keys(errors).length == 0) {
                set(this, 'step', 3);
            }
        }, (err) => {
            let errors = get(this, 'errors') || [];
            errors.pushObject('list' + resource_type + 's API request failed');
            set(this, 'errors', errors);
            set(this, 'step', 1);
        });
    },

    parseApiResponse: function(api_response, resource_type, field_name, first_value, filter_function) {
        // Parse an API response and set the corresponding fields in the config
        let objects = [];
        if (first_value) {
            objects.push(first_value);
        }
        (api_response['list' + resource_type + 'sresponse'][resource_type] || []).forEach((resource) => {
            if (!filter_function || filter_function(resource)){
                let obj = {
                    id: resource.id,
                    name: resource[field_name],
                };
                objects.push(obj);
            }
        });
        set(this, resource_type + 's', objects);
        if (Object.keys(objects).length == 0) {
            let errors = get(this, 'errors') || [];
            errors.pushObject('No ' + resource_type + 's found');
            set(this, 'errors', errors);
            set(this, 'step', 1);
        } else {
            set(this, 'model.interoutevdcConfig.' + resource_type + 'id', objects[0].id);
        }
    },

    apiRequest(command, params) {
        let url		      = get(this, 'app.proxyEndpoint') + '/' + get(this, 'model.interoutevdcConfig.apiurl');
        params		      = params || {};
        params.command	= command;
        params.apiKey 	= get(this, 'model.interoutevdcConfig.apikey');
        params.region	  = get(this, 'model.interoutevdcConfig.vdcregion');
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
                    get(this, 'model.interoutevdcConfig.secretkey'), qs, 'base64', 'sha1'));
                settings.url += '?' + settings.data;
                return true;
            }
        }, true);
    },

    listLookup: function(list, sourceField, value, targetField) {
        // Look up the value of another field of a dictionary which is in a list
        let rv = '';
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
;
define("shared/components/node-driver/driver-interoutevdc/template",["exports"],function(exports){

exports["default"] = Ember.HTMLBars.template({"id":"3WIwlAxe","block":"{\"symbols\":[\"al\",\"expandFn\"],\"statements\":[[6,\"section\"],[10,\"class\",\"horizontal-form\"],[8],[0,\"\\n\"],[4,\"accordion-list\",null,[[\"showExpandAll\"],[false]],{\"statements\":[[0,\"    \"],[6,\"div\"],[10,\"class\",\"over-hr mb-20\"],[8],[6,\"span\"],[8],[1,[20,\"driverOptionsTitle\"],false],[9],[9],[0,\"\\n\\n\"],[0,\"    \"],[6,\"section\"],[10,\"class\",\"box\"],[8],[0,\"\\n\"],[0,\"        \"],[6,\"div\"],[11,\"class\",[27,[\"row \",[26,\"if\",[[26,\"eq\",[[22,[\"step\"]],1],null],\"inline-form\"],null]]]],[8],[0,\"\\n            \"],[6,\"div\"],[10,\"class\",\"col span-2 col-inline\"],[8],[0,\"\\n                \"],[6,\"label\"],[8],[0,\"API Key\"],[9],[0,\"\\n            \"],[9],[0,\"\\n\"],[4,\"if\",[[26,\"eq\",[[22,[\"step\"]],1],null]],null,{\"statements\":[[0,\"                \"],[6,\"div\"],[10,\"class\",\"col span-10\"],[8],[0,\"\\n                    \"],[1,[26,\"input\",null,[[\"type\",\"name\",\"classNames\",\"placeholder\",\"value\",\"autocomplete\"],[\"text\",\"apikey\",\"form-control\",\"Paste your API key here...\",[22,[\"model\",\"interoutevdcConfig\",\"apikey\"]],\"on\"]]],false],[0,\"\\n                \"],[9],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"                \"],[6,\"div\"],[10,\"class\",\"form-control-static\"],[8],[0,\"\\n                    \"],[1,[22,[\"model\",\"interoutevdcConfig\",\"apikey\"]],false],[0,\"\\n                \"],[9],[0,\"\\n\"]],\"parameters\":[]}],[0,\"        \"],[9],[0,\"\\n\\n\"],[0,\"        \"],[6,\"div\"],[11,\"class\",[27,[\"row \",[26,\"if\",[[26,\"eq\",[[22,[\"step\"]],1],null],\"inline-form\"],null]]]],[8],[0,\"\\n            \"],[6,\"div\"],[10,\"class\",\"col span-2 col-inline\"],[8],[0,\"\\n                \"],[6,\"label\"],[8],[0,\"Secret Key\"],[9],[0,\"\\n            \"],[9],[0,\"\\n\"],[4,\"if\",[[26,\"eq\",[[22,[\"step\"]],1],null]],null,{\"statements\":[[0,\"                \"],[6,\"div\"],[10,\"class\",\"col span-10\"],[8],[0,\"\\n                    \"],[1,[26,\"input\",null,[[\"type\",\"name\",\"classNames\",\"placeholder\",\"value\",\"autocomplete\"],[\"password\",\"secretkey\",\"form-control\",\"Paste your API secret key here...\",[22,[\"model\",\"interoutevdcConfig\",\"secretkey\"]],\"on\"]]],false],[0,\"\\n\\n                \"],[9],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"                \"],[6,\"div\"],[10,\"class\",\"form-control-static\"],[8],[0,\"\\n                    **************************************************************************************\\n                \"],[9],[0,\"\\n\"]],\"parameters\":[]}],[0,\"        \"],[9],[0,\"\\n\\n\"],[0,\"        \"],[6,\"div\"],[11,\"class\",[27,[\"row \",[26,\"if\",[[26,\"eq\",[[22,[\"step\"]],1],null],\"inline-form\"],null]]]],[8],[0,\"\\n            \"],[6,\"div\"],[10,\"class\",\"col span-2 col-inline\"],[8],[0,\"\\n                \"],[6,\"label\"],[8],[0,\"VDC Zone\"],[1,[26,\"unless\",[[26,\"eq\",[[22,[\"step\"]],1],null],\":\"],null],false],[9],[0,\"\\n            \"],[9],[0,\"\\n\"],[4,\"if\",[[26,\"eq\",[[22,[\"step\"]],1],null]],null,{\"statements\":[[0,\"                \"],[6,\"div\"],[10,\"class\",\"col span-4\"],[8],[0,\"\\n                    \"],[1,[26,\"new-select\",null,[[\"classNames\",\"value\",\"content\",\"optionValuePath\",\"optionLabelPath\",\"optionGroupPath\",\"selected\"],[\"form-control\",[22,[\"model\",\"interoutevdcConfig\",\"zoneid\"]],[22,[\"zones\"]],\"id\",\"name\",\"region\",\"selected\"]]],false],[0,\"\\n                \"],[9],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"                \"],[6,\"div\"],[10,\"class\",\"form-control-static\"],[8],[0,\"\\n                    \"],[1,[22,[\"model\",\"interoutevdcConfig\",\"location\"]],false],[0,\"\\n                \"],[9],[0,\"\\n\"]],\"parameters\":[]}],[0,\"        \"],[9],[0,\"\\n\\n\"],[0,\"        \"],[6,\"div\"],[11,\"class\",[27,[\"row \",[26,\"if\",[[26,\"eq\",[[22,[\"step\"]],1],null],\"inline-form\"],null]]]],[8],[0,\"\\n            \"],[6,\"div\"],[10,\"class\",\"col span-2 col-inline\"],[8],[0,\"\\n                \"],[6,\"label\"],[8],[0,\"Template Type\"],[1,[26,\"unless\",[[26,\"eq\",[[22,[\"step\"]],1],null],\":\"],null],false],[9],[0,\"\\n            \"],[9],[0,\"\\n\"],[4,\"if\",[[26,\"eq\",[[22,[\"step\"]],1],null]],null,{\"statements\":[[0,\"                \"],[6,\"div\"],[10,\"class\",\"col span-4\"],[8],[0,\"\\n                    \"],[1,[26,\"new-select\",null,[[\"classNames\",\"value\",\"content\",\"optionValuePath\",\"optionLabelPath\",\"selected\"],[\"form-control\",[22,[\"model\",\"interoutevdcConfig\",\"templatefilter\"]],[22,[\"templatetypes\"]],\"id\",\"name\",\"selected\"]]],false],[0,\"\\n                \"],[9],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"                \"],[6,\"div\"],[10,\"class\",\"form-control-static\"],[8],[0,\"\\n                    \"],[1,[22,[\"model\",\"interoutevdcConfig\",\"templatefiltername\"]],false],[0,\"\\n                \"],[9],[0,\"\\n\"]],\"parameters\":[]}],[0,\"        \"],[9],[0,\"\\n\"],[4,\"if\",[[26,\"eq\",[[22,[\"step\"]],1],null]],null,{\"statements\":[[0,\"            \"],[1,[26,\"top-errors\",null,[[\"errors\"],[[22,[\"errors\"]]]]],false],[0,\"\\n            \"],[6,\"div\"],[10,\"class\",\"footer-actions\"],[8],[0,\"\\n                \"],[6,\"button\"],[10,\"name\",\"submit\"],[10,\"class\",\"btn bg-primary\"],[3,\"action\",[[21,0,[]],\"interouteVDCLogin\"]],[8],[0,\"Submit\"],[9],[0,\"\\n                \"],[6,\"button\"],[10,\"class\",\"btn bg-transparent\"],[3,\"action\",[[21,0,[]],\"cancel\"]],[8],[1,[26,\"t\",[\"generic.cancel\"],null],false],[9],[0,\"\\n            \"],[9],[0,\"\\n\"]],\"parameters\":[]},{\"statements\":[[0,\"            \"],[6,\"div\"],[10,\"class\",\"footer-actions\"],[8],[0,\"\\n                \"],[6,\"button\"],[10,\"name\",\"submit\"],[10,\"class\",\"btn bg-primary\"],[3,\"action\",[[21,0,[]],\"changeZone\"]],[8],[0,\"Change\"],[9],[0,\"\\n            \"],[9],[0,\"\\n\"]],\"parameters\":[]}],[0,\"    \"],[9],[0,\"\\n\\n\\n\"],[0,\"    \"],[6,\"section\"],[11,\"class\",[27,[\"box \",[26,\"unless\",[[26,\"eq\",[[22,[\"step\"]],3],null],\"hide\"],null]]]],[8],[0,\"\\n\"],[0,\"        \"],[6,\"div\"],[10,\"class\",\"row inline-form\"],[8],[0,\"\\n            \"],[6,\"div\"],[10,\"class\",\"col span-2 col-inline\"],[8],[0,\"\\n                \"],[6,\"label\"],[8],[0,\"Network\"],[9],[0,\"\\n            \"],[9],[0,\"\\n            \"],[6,\"div\"],[10,\"class\",\"col span-10\"],[8],[0,\"\\n                \"],[1,[26,\"new-select\",null,[[\"classNames\",\"content\",\"optionLabelPath\",\"optionValuePath\",\"value\"],[\"form-control\",[22,[\"networks\"]],\"name\",\"id\",[22,[\"model\",\"interoutevdcConfig\",\"networkid\"]]]]],false],[0,\"\\n            \"],[9],[0,\"\\n        \"],[9],[0,\"\\n\\n\"],[0,\"        \"],[6,\"div\"],[10,\"class\",\"row inline-form\"],[8],[0,\"\\n            \"],[6,\"div\"],[10,\"class\",\"col span-2 col-inline\"],[8],[0,\"\\n                \"],[6,\"label\"],[8],[0,\"Template\"],[9],[0,\"\\n            \"],[9],[0,\"\\n            \"],[6,\"div\"],[10,\"class\",\"col span-10\"],[8],[0,\"\\n                \"],[1,[26,\"new-select\",null,[[\"classNames\",\"content\",\"optionLabelPath\",\"optionValuePath\",\"value\"],[\"form-control\",[22,[\"templates\"]],\"name\",\"id\",[22,[\"model\",\"interoutevdcConfig\",\"tempalteid\"]]]]],false],[0,\"\\n            \"],[9],[0,\"\\n        \"],[9],[0,\"\\n\\n\"],[0,\"        \"],[6,\"div\"],[10,\"class\",\"row inline-form\"],[8],[0,\"\\n            \"],[6,\"div\"],[10,\"class\",\"col span-2 col-inline\"],[8],[0,\"\\n                \"],[6,\"label\"],[8],[0,\"CPU\"],[9],[0,\"\\n            \"],[9],[0,\"\\n            \"],[6,\"div\"],[10,\"class\",\"col span-1 col-inline\"],[8],[0,\"\\n                \"],[1,[20,\"cpu\"],false],[0,\"\\n            \"],[9],[0,\"\\n            \"],[6,\"div\"],[10,\"class\",\"col span-3 col-inline\"],[8],[0,\"\\n                \"],[1,[26,\"input-slider\",null,[[\"value\",\"valueMin\",\"valueMax\",\"upFn\"],[[22,[\"cpu\"]],1,12,[26,\"action\",[[21,0,[]],\"updateServiceOffering\"],null]]]],false],[0,\"\\n            \"],[9],[0,\"\\n        \"],[9],[0,\"\\n        \"],[6,\"div\"],[10,\"class\",\"row inline-form\"],[8],[0,\"\\n            \"],[6,\"div\"],[10,\"class\",\"col span-2 col-inline\"],[8],[0,\"\\n                \"],[6,\"label\"],[8],[0,\"RAM\"],[9],[0,\"\\n            \"],[9],[0,\"\\n            \"],[6,\"div\"],[10,\"class\",\"col span-1 col-inline\"],[8],[0,\"\\n                \"],[1,[20,\"ram\"],false],[0,\"\\n            \"],[9],[0,\"\\n            \"],[6,\"div\"],[8],[0,\"\\n                \"],[6,\"button\"],[10,\"name\",\"1\"],[10,\"class\",\"btn bg-primary span-1 col-inline ram-button\"],[3,\"action\",[[21,0,[]],\"setRam\",1]],[8],[0,\"1\"],[9],[0,\"\\n                \"],[6,\"button\"],[10,\"name\",\"2\"],[10,\"class\",\"btn bg-primary span-1 col-inline ram-button\"],[3,\"action\",[[21,0,[]],\"setRam\",2]],[8],[0,\"2\"],[9],[0,\"\\n                \"],[6,\"button\"],[10,\"name\",\"4\"],[10,\"class\",\"btn bg-primary span-1 col-inline ram-button\"],[3,\"action\",[[21,0,[]],\"setRam\",4]],[8],[0,\"4\"],[9],[0,\"\\n                \"],[6,\"button\"],[10,\"name\",\"8\"],[10,\"class\",\"btn bg-primary span-1 col-inline ram-button\"],[3,\"action\",[[21,0,[]],\"setRam\",8]],[8],[0,\"8\"],[9],[0,\"\\n                \"],[6,\"button\"],[10,\"name\",\"16\"],[10,\"class\",\"btn bg-primary span-1 col-inline ram-button\"],[3,\"action\",[[21,0,[]],\"setRam\",16]],[8],[0,\"16\"],[9],[0,\"\\n                \"],[6,\"button\"],[10,\"name\",\"32\"],[10,\"class\",\"btn bg-primary span-1 col-inline ram-button\"],[3,\"action\",[[21,0,[]],\"setRam\",32]],[8],[0,\"32\"],[9],[0,\"\\n                \"],[6,\"button\"],[10,\"name\",\"64\"],[10,\"class\",\"btn bg-primary span-1 col-inline ram-button\"],[3,\"action\",[[21,0,[]],\"setRam\",64]],[8],[0,\"64\"],[9],[0,\"\\n            \"],[9],[0,\"\\n        \"],[9],[0,\"\\n\\n\"],[0,\"        \"],[6,\"div\"],[10,\"class\",\"container-fluid\"],[8],[0,\"\\n            \"],[6,\"div\"],[10,\"class\",\"row form-group\"],[8],[0,\"\\n                \"],[6,\"div\"],[10,\"class\",\"col span-2 col-inline\"],[8],[0,\"\\n                    \"],[6,\"label\"],[10,\"class\",\"form-control-static\"],[8],[0,\"Disc Type\"],[9],[0,\"\\n                \"],[9],[0,\"\\n                \"],[6,\"div\"],[10,\"class\",\"col span-10\"],[8],[0,\"\\n                    \"],[1,[26,\"new-select\",null,[[\"content\",\"optionLabelPath\",\"optionValuePath\",\"value\"],[[22,[\"diskofferings\"]],\"name\",\"id\",[22,[\"model\",\"interoutevdcConfig\",\"diskofferingid\"]]]]],false],[0,\"\\n                \"],[9],[0,\"\\n            \"],[9],[0,\"\\n            \"],[6,\"div\"],[10,\"class\",\"row form-group\"],[8],[0,\"\\n                \"],[6,\"div\"],[10,\"class\",\"col span-2 col-inline\"],[8],[0,\"\\n                    \"],[6,\"label\"],[10,\"class\",\"form-control-static\"],[8],[0,\"Disk Size (GB)\"],[9],[0,\"\\n                \"],[9],[0,\"\\n                \"],[6,\"div\"],[10,\"class\",\"col span-10\"],[8],[0,\"\\n                    \"],[1,[26,\"input\",null,[[\"type\",\"value\",\"placeholder\"],[\"text\",[22,[\"model\",\"interoutevdcConfig\",\"disksize\"]],\"Disk size (GB)\"]]],false],[0,\"\\n                \"],[9],[0,\"\\n            \"],[9],[0,\"\\n        \"],[9],[0,\"\\n    \"],[9],[0,\"\\n\\n    \"],[2,\" Loading API request \"],[0,\"\\n    \"],[6,\"section\"],[11,\"class\",[27,[\"horizontal-form r-pt0 \",[26,\"unless\",[[26,\"eq\",[[22,[\"step\"]],2],null],\"hide\"],null]]]],[8],[0,\"\\n        \"],[6,\"div\"],[10,\"class\",\"text-center\"],[8],[0,\"\\n            \"],[6,\"i\"],[10,\"class\",\"icon icon-spinner icon-spin\"],[8],[9],[6,\"i\"],[8],[0,\"  Please wait...\"],[9],[0,\"\\n        \"],[9],[0,\"\\n    \"],[9],[0,\"\\n\\n\"],[0,\"    \"],[6,\"div\"],[10,\"class\",\"over-hr\"],[8],[6,\"span\"],[8],[1,[20,\"templateOptionsTitle\"],false],[9],[9],[0,\"\\n\\n    \"],[1,[26,\"form-name-description\",null,[[\"model\",\"nameRequired\"],[[22,[\"model\"]],true]]],false],[0,\"\\n\\n    \"],[1,[26,\"form-user-labels\",null,[[\"initialLabels\",\"setLabels\",\"expandAll\",\"expand\"],[[22,[\"labelResource\",\"labels\"]],[26,\"action\",[[21,0,[]],\"setLabels\"],null],[22,[\"expandAll\"]],[26,\"action\",[[21,0,[]],[21,2,[]]],null]]]],false],[0,\"\\n\\n    \"],[1,[26,\"form-engine-opts\",null,[[\"machine\",\"showEngineUrl\"],[[22,[\"model\"]],[22,[\"showEngineUrl\"]]]]],false],[0,\"\\n\"]],\"parameters\":[1,2]},null],[0,\"\\n\"],[0,\"  \"],[1,[26,\"save-cancel\",null,[[\"save\",\"cancel\"],[\"save\",\"cancel\"]]],false],[0,\"\\n\"],[9]],\"hasEval\":false}","meta":{}});;

});
