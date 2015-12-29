var request = require("request");
var Service, Characteristic;

module.exports = function(homebridge){
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-zway-switch", "ZWayBinarySwitch", ZWayBinarySwitchAccessory);
}

function ZWayBinarySwitchAccessory(log, config) {
  this.log = log;

  // url info
  this.ip_address  = config["ip_address"];
  this.username    = config["username"];
  this.password    = config["password"];
  this.name        = config["name"];
  this.zway_device_id = config["zway_device_id"];
  this.session_cookie = config["session_cookie"];
}

ZWayBinarySwitchAccessory.prototype = {

  httpRequest: function(url, method, callback) {
    request({
      url: "http://" + this.ip_address + "/thermostats/1.json",
      method: method,
      'auth': { 'username': this.username, 'password': this.password }
    },
    function (error, response, body) {

      var data = JSON.parse(body);

      callback(error, response, data)
    })
  },

  getSwitchState: function(callback) {
    this.log("getSwitchState");

    //response.headers['content-type']

	var self = this;

    request({
      url: "http://" + self.ip_address + "/ZAutomation/api/v1/devices/" + self.zway_device_id + "/command/update",
      method: "GET",
      //'auth': { 'username': this.username, 'password': this.password },
      'headers': { 'Cookie' : "ZWAYSession=" + self.session_cookie }
    },
    function (error, response, body) {

      request({
        url: "http://" + self.ip_address + "/ZAutomation/api/v1/devices/" + self.zway_device_id + "",
        method: "GET",
        //'auth': { 'username': this.username, 'password': this.password },
        'headers': { 'Cookie' : "ZWAYSession=" + self.session_cookie }
      },
      function (error, response, body) {
        var data = JSON.parse(body);

		self.log( body )
		self.log( data["data"] )

        var level = data["data"]["metrics"]["level"];

        if (level == "on") {
          callback( null, true );
        }else{
          callback( null, false );
        }
      });
    });
  },

  setSwitchState: function(switchState, callback){
    this.log("setSwitchState");

    var command = "";

    if (switchState) {
      command = "on";
    }else{
      command = "off";
    }

	var self = this;

    request({
      url: "http://" + self.ip_address + "/ZAutomation/api/v1/devices/" + self.zway_device_id + "/command/" + command,
      method: "GET",
      //'auth': { 'username': this.username, 'password': this.password },
      'headers': { 'Cookie' : "ZWAYSession=" + self.session_cookie }
    },
    function (error, response, body) {
      callback(null);//No error
      // var data = JSON.parse(body);
      //
      // var level = data["data"]["metrics"]["level"];
      //
      // if (level == "on") {
      //   callback(null);//No error
      // }else{
      //   callback(null);//No error
      // }
    });
  },


  identify: function(callback) {
    this.log("Identify requested!");
    callback(); // success
  },

  getServices: function() {

    // you can OPTIONALLY create an information service if you wish to override
    // the default values for things like serial number, model, etc.
    var informationService = new Service.AccessoryInformation();

    informationService
      .setCharacteristic(Characteristic.Manufacturer, "Jeff McFadden")
      .setCharacteristic(Characteristic.Model, "ZWaySwitch")
      .setCharacteristic(Characteristic.SerialNumber, "ZW-S-1");

    var switchService = new Service.Switch();

    switchService.getCharacteristic( Characteristic.On ).on( 'get', this.getSwitchState.bind(this) );
    switchService.getCharacteristic( Characteristic.On ).on( 'set', this.setSwitchState.bind(this) );

    return [informationService, switchService];
  }
};
