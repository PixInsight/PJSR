// Main Testing module
#include "Testing.jsh"

// include tests
#include "INDICCDControllerTests.js"


// Timeout handling
var timeout=false;

// The INDI test suite
function INDITestSuite() {
   // call base constructor
  MainTest.call(this,"INDI Controller");
  deviceController = new INDIDeviceController();
  this.timeoutTimer = new Timer();
  this.timeoutTimer.singleShot=true;
  this.timeoutTimer.interval=5; // wait 5 seconds before raising timeout event
  this.timeoutTimer.onTimeout= function () {
      timeout=true;
      console.criticalln("Timeout reached");
  };
};

//create prototype from base class
INDITestSuite.prototype = Object.create(MainTest.prototype);
INDITestSuite.prototype.constructor = INDITestSuite;

// Overwrite setUp method of TestCase class
INDITestSuite.prototype.setUp = function () {
   deviceController.executeGlobal();
   // wait until device names are reveived from server
   this.timeoutTimer.start();
   while (indexOfDevice(deviceController.devices,CCDDeviceName)===-1 && !timeout){
      console.flush();
      processEvents();
   }
   this.timeoutTimer.stop();
   // connect to CCD device
   var propertyKey="/"+CCDDeviceName+"/CONNECTION/CONNECT";
   var connectProperty=[propertyKey,"INDI_SWITCH","ON"];
   deviceController.newProperties=[connectProperty];
   deviceController.executeGlobal();
   // wait until device is connected
   this.timeoutTimer.start();
   while (!propertyEquals(deviceController.properties,propertyKey,"ON") && !timeout) {
      console.flush();
      processEvents();
   }
   this.timeoutTimer.stop();
}

// Overwrite tearDown method of TestCase class
INDITestSuite.prototype.tearDown = function () {
   // disconnect from server
   deviceController.serverConnect=false;
   deviceController.executeGlobal();
}


// Create  main test suite
Testing.main = new INDITestSuite();
// add tests to test suite
Testing.main.addTest(INDICCDControllerTests);

// run tests
Testing.main.run();
