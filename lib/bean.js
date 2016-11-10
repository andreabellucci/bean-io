'use strict';

var SerialPort = require('bean-serial').SerialPort;
var firmata = require('firmata');
var util = require('util');


function Board(options){
  options = options || {};
  var self = this;
  self.Bean = require('ble-bean');
  self.name = options.name || 'bean';
  self.pins = []; //j5 is a bit aggressive on wanting this ready

  self.Bean.is(function(peripheral) {
      peripheral.advertisement.localName === self.name;
    });

  self.Bean.discoverAll(function(bean){
    console.log("discover ", bean._peripheral.id);
    bean.on("disconnect", function(){
      process.exit();
    });

    if(options.uuid === undefined || options.uuid == bean._peripheral.id){
        self.connectedBean = bean;
        bean.connectAndSetup(function(){
          //console.log("connect to ", bean._peripheral.id);
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
    }

  });

  this.writeOne = function(){
      function randomInt (low, high) {
          return Math.floor(Math.random() * (high - low) + low);
      }

      setInterval(function(){
          self.connectedBean.writeOne(Buffer.from([randomInt(0,255), randomInt(0,255), randomInt(0,255), randomInt(0,50), randomInt(0,50), randomInt(0,50)]),function(res){
             //console.log(res);
          });
      }, 500);

    };




  //turns off led before disconnecting
  function exitHandler() {
    if (self.connectedBean) {
      console.log('Disconnecting from Device...');
      self.connectedBean.setColor(new Buffer([0x00,0x00,0x00]), function(){
        //does it hit here?
        console.log('set color reply');
        self.beanPeripheral.disconnect( function(){
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
