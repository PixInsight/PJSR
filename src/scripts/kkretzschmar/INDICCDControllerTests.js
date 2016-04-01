#include "Testing.jsh"
#include "Asserts.jsh"
#include "INDI-helper.jsh"

/*
 * Initial steps
 * Prequisites:
 *  - a running INDI Device Controller which is connected
 *    to the INDI server which was started with a
 *    "CCD Simulator device"
 *  - a connected "CCD Simulator" device
 */
function CCDControllerTests() {
   // call base constructor
  TestCase.call(this,"CCDControllerTests");
  CCDController = new INDICCDFrame();
  CCDController.deviceName="CCD Simulator"

};

//create prototype from base class
CCDControllerTests.prototype = Object.create(TestCase.prototype);
CCDControllerTests.prototype.constructor = CCDControllerTests;

/*
 * Acquire a exposure with default settings
 */
CCDControllerTests.prototype.testAcquireExposureDefault = function testAcquireExposureDefault()  {
   // execute
   CCDController.executeGlobal()
   // check if there is an active window
   var active = ImageWindow.activeWindow;
   assertTrue(active && active.isWindow,"No active window found")
   console.writeln();
   // read and check fits keywordsMain
   var fitskeys=active.keywords;
   assertTrue(fitskeys.length!==0, "no FITS keywords");
   // check expected CCD device
   expectEquals("'CCD Simulator'",fitskeys[indexOfFITSKeyword(fitskeys,"INSTRUME")].value);

   // check image sizes
   var imgHeight=active.currentView.image.height;
   var imgWidth=active.currentView.image.width;
   expectEquals(imgWidth.toString(),fitskeys[indexOfFITSKeyword(fitskeys,"NAXIS1")].value);
   expectEquals(imgHeight.toString(),fitskeys[indexOfFITSKeyword(fitskeys,"NAXIS2")].value);

   // check EXPTIME
   expectEquals(CCDController.exposureTime.toString()+".",fitskeys[indexOfFITSKeyword(fitskeys,"EXPTIME")].value);

   // check XBINNING
   expectEquals(CCDController.binningX.toString(),fitskeys[indexOfFITSKeyword(fitskeys,"XBINNING")].value);
   // check YBINNING
   expectEquals(CCDController.binningY.toString(),fitskeys[indexOfFITSKeyword(fitskeys,"YBINNING")].value);

   // check frame type
   expectEquals("'Light'",fitskeys[indexOfFITSKeyword(fitskeys,"FRAME")].value.replace(/ /g,''));

   // close image
   active.close();
}

CCDControllerTests.prototype.testExposureTime = function testExposureTime() {
   // set exposureTime
   CCDController.exposureTime=2;
   // execute
   CCDController.executeGlobal()
   // check if there is an active window
   var active = ImageWindow.activeWindow;
   assertTrue(active && active.isWindow,"No active window found")
   console.writeln();
   // read and check fits keywordsMain
   var fitskeys=active.keywords;
   assertTrue(fitskeys.length!==0, "no FITS keywords");

    // check EXPTIME
   expectEquals(CCDController.exposureTime.toString()+".",fitskeys[indexOfFITSKeyword(fitskeys,"EXPTIME")].value);

   // close image
   active.close();
}

CCDControllerTests.prototype.testBinning = function testExposureTime() {
   // set exposureTime
   CCDController.exposureTime=1;
   // set XBinning
   CCDController.binningX=2;
   // set YBinning
   CCDController.binningY=2;
   // execute
   CCDController.executeGlobal()
   // check if there is an active window
   var active = ImageWindow.activeWindow;
   assertTrue(active && active.isWindow,"No active window found")
   console.writeln();
   // read and check fits keywordsMain
   var fitskeys=active.keywords;
   assertTrue(fitskeys.length!==0, "no FITS keywords");
   // check XBINNING
   expectEquals(CCDController.binningX.toString(),fitskeys[indexOfFITSKeyword(fitskeys,"XBINNING")].value);
   // check YBINNING
   expectEquals(CCDController.binningY.toString(),fitskeys[indexOfFITSKeyword(fitskeys,"YBINNING")].value);

   // close image
   active.close();
}


// create test instance
var INDICCDControllerTests = new CCDControllerTests();

// add test cases for test execution
INDICCDControllerTests.addTestCase(INDICCDControllerTests.testAcquireExposureDefault);
INDICCDControllerTests.addTestCase(INDICCDControllerTests.testExposureTime);
INDICCDControllerTests.addTestCase(INDICCDControllerTests.testBinning);




