#include "Testing.jsh"
#include "Asserts.jsh"
#include "INDI-helper.jsh"

/*
 * Initial steps
 * Prequisites:
 *  - a running INDI server on localhost
 */

var CCDDeviceName="CCD Simulator";


// A test should be a subclass of class TestCase
function CCDControllerTests() {
   // call base constructor
  TestCase.call(this,"CCDControllerTests");
  CCDController = new INDICCDFrame();
  CCDController.deviceName=CCDDeviceName;
};

//create prototype from base class
CCDControllerTests.prototype = Object.create(TestCase.prototype);
CCDControllerTests.prototype.constructor = CCDControllerTests;

// Overwrite tearDown method of TestCase class
CCDControllerTests.prototype.tearDown = function () {
   // set to default values

   // set exposureTime
   CCDController.exposureTime=1;
   // set XBinning
   CCDController.binningX=1;
   // set YBinning
   CCDController.binningY=1;
   // set exposureCount
   CCDController.exposureCount=1;
   // set frameType
   CCDController.frameType=0; // FrameType_Light
   // set uploadMode
   CCDController.uploadMode=0; // UploadMode_Client
}


/*
 * Acquire a exposure with default settings
 */
CCDControllerTests.prototype.testAcquireExposureDefault = function testAcquireExposureDefault()  {
   // execute
   CCDController.executeGlobal();
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

   // check XBINNINGCCD
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
   CCDController.executeGlobal();
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

CCDControllerTests.prototype.testBinning = function testBinning() {
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

CCDControllerTests.prototype.testFrameTypeBias = function testFrameTypeBias() {

   // set FrameTye
   CCDController.frameType=1;
   // execute
   CCDController.executeGlobal()
   // check if there is an active window
   var active = ImageWindow.activeWindow;
   assertTrue(active && active.isWindow,"No active window found")
   console.writeln();
   // read and check fits keywordsMain
   var fitskeys=active.keywords;
   assertTrue(fitskeys.length!==0, "no FITS keywords");
   // check frame type
   expectEquals("'Bias'",fitskeys[indexOfFITSKeyword(fitskeys,"FRAME")].value.replace(/ /g,''));

   // close image
   active.close();
}

CCDControllerTests.prototype.testFrameTypeDark = function testFrameTypeDark() {

   // set FrameTye
   CCDController.frameType=2;
   // execute
   CCDController.executeGlobal()
   // check if there is an active window
   var active = ImageWindow.activeWindow;
   assertTrue(active && active.isWindow,"No active window found")
   console.writeln();
   // read and check fits keywords
   var fitskeys=active.keywords;
   assertTrue(fitskeys.length!==0, "no FITS keywords");// set exposureTime
   CCDController.exposureTime=1;
   // check frame type
   expectEquals("'Dark'",fitskeys[indexOfFITSKeyword(fitskeys,"FRAME")].value.replace(/ /g,''));

   // close image
   active.close();
}

CCDControllerTests.prototype.testFrameTypeFlat = function testFrameTypeFlat() {
   // set FrameTye
   CCDController.frameType=3;
   // execute
   CCDController.executeGlobal()
   // check if there is an active window
   var active = ImageWindow.activeWindow;
   assertTrue(active && active.isWindow,"No active window found")
   console.writeln();
   // read and check fits keywordsMain
   var fitskeys=active.keywords;
   assertTrue(fitskeys.length!==0, "no FITS keywords");
   // check frame type
   expectEquals("'FlatField'",fitskeys[indexOfFITSKeyword(fitskeys,"FRAME")].value.replace(/ /g,''));

   // close image
   active.close();
}


CCDControllerTests.prototype.testExposureCount = function testExposureCount() {
   // set exposureCount
   CCDController.exposureCount=2;

   CCDController.executeGlobal();
   // check that there are two windows
   var windows = ImageWindow.windows;
   expectEquals(CCDController.exposureCount,windows.length);

   // close images
   windows[0].close();
   windows[1].close();
}

CCDControllerTests.prototype.testuploadModeServer = function testuploadModeServer() {
   // set server upload directory to value in global settings
   CCDController.serverUploadDirectory=Settings.readGlobal( "ImageWindow/DownloadsDirectory", DataType_UCString );
   // set uploadMode
   CCDController.uploadMode=1; // UploadMode_Server

   CCDController.executeGlobal();
   var DefaultServerFilename="LIGHT_B1x1_E1.000_001.fits";
   expectEquals(true,File.exists(CCDController.serverUploadDirectory+"/"+DefaultServerFilename));
   // remove uploaded file
   File.remove(CCDController.serverUploadDirectory+"/"+DefaultServerFilename);
}

CCDControllerTests.prototype.testuploadModeServerAndClient = function testuploadModeServerAndClient() {
   // set server upload directory to value in global settings
   CCDController.serverUploadDirectory=Settings.readGlobal( "ImageWindow/DownloadsDirectory", DataType_UCString );
   // set uploadMode
   CCDController.uploadMode=2; // UploadMode_ServerAndClient

   CCDController.executeGlobal();
   var DefaultServerFilename="LIGHT_B1x1_E1.000_001.fits";
   expectEquals(true,File.exists(CCDController.serverUploadDirectory+"/"+DefaultServerFilename));
   // remove uploaded file
   File.remove(CCDController.serverUploadDirectory+"/"+DefaultServerFilename);

   // check if there is an active window
   var active = ImageWindow.activeWindow;
   assertTrue(active && active.isWindow,"No active window found");

   // close active window
   active.close();

}

CCDControllerTests.prototype.testuploadServerFileNameTemplate = function testuploadServerFileNameTemplate() {
   // set server upload directory to value in global settings
   CCDController.serverUploadDirectory=Settings.readGlobal( "ImageWindow/DownloadsDirectory", DataType_UCString );
   // set uploadMode
   CCDController.uploadMode=1; // UploadMode_Server

   // set server file template
   CCDController.serverFileNameTemplate="MyObject_%f_B%b_E%e_%n"
   // set FrameType Bias
   CCDController.frameType=1;
   // set exposureTime
   CCDController.exposureTime=2;
   // set exposureCount
   CCDController.exposureCount=2;

   CCDController.executeGlobal();
   expectEquals(true,File.exists(CCDController.serverUploadDirectory + "/MyObject_BIAS_B1x1_E2.000_001.fits"));
   expectEquals(true,File.exists(CCDController.serverUploadDirectory + "/MyObject_BIAS_B1x1_E2.000_002.fits"));
   // remove uploaded file
   File.remove(CCDController.serverUploadDirectory+"/MyObject_BIAS_B1x1_E2.000_001.fits");
   File.remove(CCDController.serverUploadDirectory+"/MyObject_BIAS_B1x1_E2.000_002.fits");
}


// create test instance
var INDICCDControllerTests = new CCDControllerTests();

// add test cases for test executionCCDController = new INDICCDFrame();
INDICCDControllerTests.addTestCase(INDICCDControllerTests.testAcquireExposureDefault);
INDICCDControllerTests.addTestCase(INDICCDControllerTests.testExposureTime);
INDICCDControllerTests.addTestCase(INDICCDControllerTests.testBinning);
INDICCDControllerTests.addTestCase(INDICCDControllerTests.testExposureCount);
INDICCDControllerTests.addTestCase(INDICCDControllerTests.testFrameTypeBias);
INDICCDControllerTests.addTestCase(INDICCDControllerTests.testFrameTypeDark);
INDICCDControllerTests.addTestCase(INDICCDControllerTests.testFrameTypeFlat);
INDICCDControllerTests.addTestCase(INDICCDControllerTests.testuploadModeServer);
INDICCDControllerTests.addTestCase(INDICCDControllerTests.testuploadModeServerAndClient);
INDICCDControllerTests.addTestCase(INDICCDControllerTests.testuploadServerFileNameTemplate);





