"use strict";
/*
   TestPropagatePreviews.js
*/

//#define DEBUG_MODE true

#define TEST_MODE true

#include "../../src/PropagatePreviewsV2/PropagatePreviewsV2.js"


var vPtest_requiredViews = ["I128","I256","I256_3PV","rect","rectTarget"];
var vPtest_targetViews = ["I128","I256","rectTarget"];

var loadedGeometries = [
   [],[],
[
  {
    "name": "P_TL",
    "geometry": [
      0,
      0,
      50,
      25
    ],
    "position": [
      0,
      0
    ],
    "zoomFactor": 1
  },
  {
    "name": "P_BR",
    "geometry": [
      221,
      236,
      256,
      256
    ],
    "position": [
      0,
      0
    ],
    "zoomFactor": 1
  },
  {
    "name": "P_full",
    "geometry": [
      0,
      0,
      256,
      256
    ],
    "position": [
      0,
      0
    ],
    "zoomFactor": 1
  }
],
[
  {
    "name": "Preview01",
    "geometry": [
      125,
      35,
      205,
      100
    ],
    "position": [
      246,
      201
    ],
    "zoomFactor": 6
  }
],
[]
];




// ---------------------------------------------------------------------------------------------------------
// Support methods
// ---------------------------------------------------------------------------------------------------------


// Check that all views named in the array of string requiredViews are main views of some window in the project
function pP_checkPresenceOfViews(requiredViews) {

   var thereAreMissingViews = false;

#ifdef DEBUG
   var allValidWindows = ImageWindow.windows.filter(function (w) {return !w.isNull && pP_isOpenWindow(w)});
   Console.writeln("  pP_checkPresenceOfViews: " , allValidWindows.length," Window main views: ", allValidWindows.map(function(w){return w.mainView.id}));
#endif
   Console.writeln("    Checking presence of required views in current workspace");

   // Check that all required views are present
   for (var i=0; i<requiredViews.length; i++) {
      var viewId = requiredViews[i];
      var view = View.viewById(viewId);
#ifdef DEBUG
      Console.writeln("      pP_checkPresenceOfViews: View ", viewId , " is ", view);
#endif
   if (view.isNull || !view.window.isValidView(view)) {
         thereAreMissingViews = true;
         Console.writeln("View '" + viewId + "' not present in current project");
      } else {
         Console.writeln("      view " + viewId + " present, uniqueId: " + view.uniqueId);
      }
   }
   if (thereAreMissingViews) {
      throw "Some views are missing in the current project (see log above), reload the test project.";
   }

}

// Close all windows whose main view is not in the list of required views, assume that all required views are present
function pP_closeNonTestWindows(requiredViews) {

   var requiredViewsUniqueId = [];
   var allValidWindows = ImageWindow.windows.filter(function (w) {return !w.isNull && pP_isOpenWindow(w)});

   // build a list of the uniqueId of all required main views
   for (var i=0; i<requiredViews.length; i++) {
      var viewId = requiredViews[i];
      var view = View.viewById(viewId);
      if (view.isNull || !view.window.isValidView(view)) {
         throw "View '" + viewId + "' not present in current project";
      }
      requiredViewsUniqueId.push(view.uniqueId);
   }


   for (var i=0; i<allValidWindows.length; i++) {
      var currentMainView = allValidWindows[i].mainView;
      var currentViewUniqueId = currentMainView.uniqueId;
      var isRelevantWindow =  requiredViewsUniqueId.indexOf(currentViewUniqueId)>=0;
#ifdef DEBUG
      Console.writeln("    pP_checkPresenceOfViews: Window ", currentMainView.id, " isRelevantWindow: " + isRelevantWindow +",  has index ", requiredViewsUniqueId.indexOf(currentViewUniqueId));
#endif
      if (!isRelevantWindow) {
         // The user will be requested to confirm
         Console.writeln("    Closing unused window of view '" + currentMainView.id, "', uniqueId: " + currentMainView.uniqueId);
         allValidWindows[i].close();
      }
   }

}

// Close all previews of the window required views, assume that the views are present
function pP_closePreviewsOfTargetWindows(requiredViews) {
   Console.writeln("  Closing previews of test windows");
   for (var i=0; i<requiredViews.length; i++) {
      var viewId = requiredViews[i];
      var view = View.viewById(viewId);
      if (view.isNull || !view.window.isValidView(view)) {
         throw "View '" + viewId + "' not present in current project";
      }
      view.window.deletePreviews();
   }
}

// Hide some differences between 1.7 and 1.8
function pP_isOpenWindow(w) {
#ifgteq __PI_BUILD__ 932
    return ((!w.isClosed) && w.isValidView(w.mainView));
#else
    return (w.isValidView(w.mainView));
#endif
}

// From somehwre on the web
function equal (x, y) {
    if (typeof x !== typeof y) return false;
    if (x instanceof Array && y instanceof Array && x.length !== y.length) return false;
    if (typeof x === 'object') {
        for (var p in x) if (x.hasOwnProperty(p)) {
            if (typeof x[p] === 'function' && typeof y[p] === 'function') continue;
            if (x[p] instanceof Array && y[p] instanceof Array && x[p].length !== y[p].length) return false;
            if (typeof x[p] !== typeof y[p]) return false;
            if (typeof x[p] === 'object' && typeof y[p] === 'object') { if (!equal(x[p], y[p])) return false; } else
            if (x[p] !== y[p]) return false;
        }
    } else return x === y;
    return true;
};

function pPtest_checkEnvironment() {

   Console.writeln("pPtest_checkEnvironment: Check environment for tests, close non required windows and previews");
   pP_checkPresenceOfViews(vPtest_requiredViews);
   pP_closeNonTestWindows(vPtest_requiredViews);
   pP_closePreviewsOfTargetWindows(vPtest_targetViews);

   Console.writeln("pPtest_checkEnvironment: Completed");

}

function pPtest_checkCurrentGeometry(viewIds) {
   for (var i = 0; i<viewIds.length; i++) {
      var viewId = viewIds[i];
      var view = View.viewById(viewId);
      var g = geometryFromWindow(view.window);
      //Console.writeln(JSON.stringify(g, null, "  "));
      if (!equal(g,loadedGeometries[i])) {
            Console.writeln("NOT EXPECTED PREVIEW GEOMETRY " + JSON.stringify(g, null, "  "));
      }

   }
}




pPtest_checkEnvironment();
pPtest_checkCurrentGeometry(vPtest_requiredViews);

