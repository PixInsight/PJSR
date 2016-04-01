#ifndef _Testing_jsh
#define _Testing_jsh

// use global namespace Testing
var Testing = Testing || {}

// logger class
function Logger() {
   this.logStr ="";
}

Logger.prototype.log = function(message) {
      this.logStr=this.logStr + message;
}

Logger.prototype.reset = function() {
      this.logStr="";
}

Logger.prototype.toString = function(){
      return this.logStr;
}

// create a global logger object
Testing.logger =  new Logger();

function MainTest(name){
   this.name      = name;
   this.tests     = [];
};

MainTest.prototype.addTest = function (test){
   this.tests.push(test);
}

MainTest.prototype.run = function(){
   Testing.logger.log("<br>======================================================================");
   Testing.logger.log("<br>Test suite:" + this.name);
   Testing.logger.log("<br>======================================================================");

   for (test in this.tests){
      var testObject=this.tests[test];
      testObject.setUp();
      testObject.runTests();
      testObject.tearDown();
   }
}

function TestCase(name){
   this.name      = name;
   this.testCases = [];
};

TestCase.prototype.setUp = function() {
}

TestCase.prototype.tearDown = function() {
}

TestCase.prototype.addTestCase = function(testCase) {
   this.testCases.push(testCase);
}

TestCase.prototype.runTests = function() {
   var testSuccess=true;
   var numOfTests=0;
   var testNr=0;
   Testing.logger.log("<br><u>Test:" + this.name+"</u>");
   numOfTests=this.testCases.length;
   for (testCase in this.testCases){
      try {
         this.testCases[testCase].call();
         Testing.logger.log("<br><b>PASSED:</b> Test case " + this.testCases[testCase].name);
      } catch (err) {
         Testing.logger.log("<br><b>FAILED:</b> Test case " + this.testCases[testCase].name + ":" + " ---- " + err);
       console.criticalln(err.stack);
       testSuccess=false;
     }
     testNr++;
   }
   Testing.logger.log("<br>======================================================================");
   if (testSuccess) {
      console.writeln(Testing.logger.toString());
      console.noteln("SUCCESS");
      console.noteln(testNr + "/" + numOfTests + " tests successfully passed.");

   } else {
      console.writeln(Testing.logger.toString());
      console.criticalln("FAILURE");
      console.criticalln(testNr + "/" + numOfTests + " tests failed.");
   }
   Testing.logger.reset();
}
#endif //_Testing_jsh
