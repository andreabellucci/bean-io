'use strict';

var SerialPort = require('bean-serial').SerialPort;
var firmata = require('firmata');
var util = require('util');


function Board(options){
  options = options || {};
  var self = this;
  self.exit = false;
  self.Bean = require('ble-bean');
  self.name = options.name || 'bean';
  self.pins = []; //j5 is a bit aggressive on wanting this ready

  self.Bean.is(function(peripheral) {
      peripheral.advertisement.localName === self.name;
    });

  self.Bean.discoverById(options.uuid, discoveryService);

  function reconnect(bean){
      console.log('>> [BEAN] Reconnecting...', self.connectedBean.toString());
      self.Bean.discoverById(options.uuid, discoveryService);
   };


   function discoveryService(bean){
     if(options.uuid === undefined || options.uuid == bean._peripheral.id){
        self.connectedBean = bean;
        console.log(">> [BEAN] Discovered", self.connectedBean.toString());
        bean.connectAndSetup(function(){
          bean.unGate(function(){
              self.connectedBean.setColor(new Buffer([0, 64, 64]), function(err){
                  //console.log('set color', err);
              });

            setTimeout(function() {
              self.connectedBean.setColor(new Buffer([0, 0, 0]), function(err){
                //console.log('set color off', err);
              });
          }.bind(this), 2000);


            var serialPort = new SerialPort(self.connectedBean);

            Board.super_.call(self, serialPort, {skipHandshake: true, samplingInterval:60000});
            self.isReady = true;
            self.emit('connect');

          });

        });

        bean.on("disconnect", function(){
            console.log(">> [BEAN] Disconnected", self.connectedBean.toString());
            if(!self.exit) reconnect(bean);
        });
    }

    };

  //turns off led before disconnecting
  function exitHandler() {
    if (self.connectedBean) {
      console.log('>> [BEAN] Disconnecting from Device...', self.connectedBean.toString());
      self.connectedBean.setColor(new Buffer([0x00,0x00,0x00]), function(){
        //does it hit here?
        //console.log('set color reply');
        self.exit = true;
        self.connectedBean.disconnect( function(){
          console.log('disconnected');
          process.exit();
        });

      });

    } else {
      process.exit();
    }
  }

  process.on('SIGINT', exitHandler.bind({peripheral:self.beanPeripheral, connectedBean: self.connectedBean}));

}

util.inherits(Board, firmata.Board);

module.exports = {
  Board: Board
};
