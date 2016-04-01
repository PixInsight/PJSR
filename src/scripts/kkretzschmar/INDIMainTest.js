// Main Testing module
#include "Testing.jsh"

// include tests
#include "INDICCDControllerTests.js"


// Create  main test suite
Testing.main = new MainTest("INDI Controller");
// add tests to test suite
Testing.main.addTest(INDICCDControllerTests);

// run tests
Testing.main.run();
