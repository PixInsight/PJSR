// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// FWHMEccentricity.js - Released 2015/08/09 00:00:00 UTC
// ****************************************************************************
//
// This file is part of FWHMEccentricity Script version 1.5
//
// Copyright (C) 2012-2015 Mike Schuster. All Rights Reserved.
// Copyright (C) 2003-2015 Pleiades Astrophoto S.L. All Rights Reserved.
//
// Redistribution and use in both source and binary forms, with or without
// modification, is permitted provided that the following conditions are met:
//
// 1. All redistributions of source code must retain the above copyright
//    notice, this list of conditions and the following disclaimer.
//
// 2. All redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
//
// 3. Neither the names "PixInsight" and "Pleiades Astrophoto", nor the names
//    of their contributors, may be used to endorse or promote products derived
//    from this software without specific prior written permission. For written
//    permission, please contact info@pixinsight.com.
//
// 4. All products derived from this software, in any form whatsoever, must
//    reproduce the following acknowledgment in the end-user documentation
//    and/or other materials provided with the product:
//
//    "This product is based on software from the PixInsight project, developed
//    by Pleiades Astrophoto and its contributors (http://pixinsight.com/)."
//
//    Alternatively, if that is where third-party acknowledgments normally
//    appear, this acknowledgment must be reproduced in the product itself.
//
// THIS SOFTWARE IS PROVIDED BY PLEIADES ASTROPHOTO AND ITS CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
// TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
// PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL PLEIADES ASTROPHOTO OR ITS
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
// EXEMPLARY OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, BUSINESS
// INTERRUPTION; PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; AND LOSS OF USE,
// DATA OR PROFITS) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
// ****************************************************************************

#define TITLE "FWHMEccentricity"
#define VERSION "1.5"

#feature-id Image Analysis > FWHMEccentricity

#feature-info <b>FWHMEccentricity Version 1.5</b><br/>\
   <br/>\
   Estimates the median full width at half maximum (FWHM) and eccentricity \
   of the stars in a view.<br/>\
   <br/>\
   Copyright &copy; 2012-2015 Mike Schuster. All Rights Reserved.<br/>\
   Copyright &copy; 2003-2015 Pleiades Astrophoto S.L. All Rights Reserved.

#include <pjsr/ColorSpace.jsh>
#include <pjsr/DataType.jsh>
#include <pjsr/FontFamily.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/SampleType.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/UndoFlag.jsh>

#define USE_STAR_DETECTOR true
#define __PJSR_NO_STAR_DETECTOR_TEST_ROUTINES
#include <pjsr/StarDetector.jsh>

// Dynamic methods for core Control object.
#iflt __PI_BUILD__ 1168
if (!Control.prototype.displayPixelRatio) {
   Control.prototype.displayPixelRatio = 1;
}
#endif

if (!Control.prototype.logicalPixelsToPhysical) {
   Control.prototype.logicalPixelsToPhysical = function(p) {
      return p;
   };
}

if (!Control.prototype.physicalPixelsToLogical) {
   Control.prototype.physicalPixelsToLogical = function(p) {
      return p;
   };
}

if (!Control.prototype.setScaledFixedHeight) {
   Control.prototype.setScaledFixedHeight = function(h) {
      this.setFixedHeight(h);
   };
}

if (!Control.prototype.setScaledFixedSize) {
   Control.prototype.setScaledFixedSize = function(w, h) {
      this.setFixedSize(w, h);
   };
}

if (!Control.prototype.setScaledFixedWidth) {
   Control.prototype.setScaledFixedWidth = function(w) {
      this.setFixedWidth(w);
   };
}

if (!Control.prototype.setScaledMinHeight) {
   Control.prototype.setScaledMinHeight = function(h) {
      this.setMinHeight(h);
   };
}

if (!Control.prototype.setScaledMinSize) {
   Control.prototype.setScaledMinSize = function(w, h) {
      this.setMinSize(w, h);
   };
}

if (!Control.prototype.setScaledMinWidth) {
   Control.prototype.setScaledMinWidth = function(w) {
      this.setMinWidth(w);
   };
}

if (!Control.prototype.scaledResource) {
   Control.prototype.scaledResource = function(r) {
      return r;
   };
}

function defaultNullMinMaxValue(value, min, max, def) {
   return value != null &&
      !isNaN(value) && value >= min && value <= max ? value : def;
}

function parametersPrototype() {
   this.dialog = null;

   this.targetView = null;

   this.modelFunctionLabels = new Array(
      "Gaussian",
      "Moffat10",
      "Moffat8",
      "Moffat6",
      "Moffat4",
      "Moffat2.5",
      "Moffat1.5",
      "Lorentzian"
   );
   this.modelFunctionNormalizations = new Array(
      2.0 * Math.sqrt(2.0 * Math.log(2.0)), // Gaussian
      2.0 * Math.sqrt(Math.pow(2.0, 1.0 / 10.0) - 1.0), // Moffat 10
      2.0 * Math.sqrt(Math.pow(2.0, 1.0 / 8.0) - 1.0), // Moffat 8
      2.0 * Math.sqrt(Math.pow(2.0, 1.0 / 6.0) - 1.0), // Moffat 6
      2.0 * Math.sqrt(Math.pow(2.0, 1.0 / 4.0) - 1.0), // Moffat 4
      2.0 * Math.sqrt(Math.pow(2.0, 1.0 / 2.5) - 1.0), // Moffat 2.5
      2.0 * Math.sqrt(Math.pow(2.0, 1.0 / 1.5) - 1.0), // Moffat 1.5
      2.0 * Math.sqrt(Math.pow(2.0, 1.0 / 1.0) - 1.0) // Lorentzian
   );
   this.defModelFunctionIndex = 4;
   this.modelFunctionIndex = this.defModelFunctionIndex;

   this.resolution = 65535.0;

   this.minLogStarDetectionSensitivity = -3.0;
   this.maxLogStarDetectionSensitivity = 3.0;
   this.defLogStarDetectionSensitivity = -1.0;
   this.logStarDetectionSensitivity = this.defLogStarDetectionSensitivity;

   this.minUpperLimit = 0.0;
   this.maxUpperLimit = 1.0;
   this.defUpperLimit = 1.0;
   this.upperLimit = this.defUpperLimit;

   this.validResults = false;
   this.medianFWHM = 0.0;
   this.medianEccentricity = 0.0;
   this.medianResidual = 0.0;
   this.MADMedianFWHM = 0.0;
   this.MADMedianEccentricity = 0.0;
   this.MADMedianResidual = 0.0;
   this.starSupport = 0;
   this.starProfiles = new Array();

   this.storeSettings = function() {
      Settings.write(
         TITLE + "." + VERSION + "_modelFunctionIndex" ,
         DataType_Int32,
         this.modelFunctionIndex
      );

      Settings.write(
         TITLE + "." + VERSION + "_logStarDetectionSensitivity" ,
         DataType_Real32,
         this.logStarDetectionSensitivity
      );

      Settings.write(
         TITLE + "." + VERSION + "_upperLimit" ,
         DataType_Real32,
         this.upperLimit
      );
   };

   this.loadSettings = function() {
      var value = Settings.read(
         TITLE + "." + VERSION + "_modelFunctionIndex", DataType_Int32
      );
      this.modelFunctionIndex = defaultNullMinMaxValue(
         value,
         0,
         this.modelFunctionLabels.length - 1,
         this.defModelFunctionIndex
      );

      var value = Settings.read(
         TITLE + "." + VERSION + "_logStarDetectionSensitivity",
         DataType_Real32
      );
      this.logStarDetectionSensitivity = defaultNullMinMaxValue(
         value,
         this.minLogStarDetectionSensitivity,
         this.maxLogStarDetectionSensitivity,
         this.defLogStarDetectionSensitivity
      );

      var value = Settings.read(
         TITLE + "." + VERSION + "_upperLimit",
         DataType_Real32
      );
      this.upperLimit = defaultNullMinMaxValue(
         value,
         this.minUpperLimit,
         this.maxUpperLimit,
         this.defUpperLimit
      );
   };
}
var parameters = new parametersPrototype();

function Pair(first, last) {
   this.first = first;
   this.last = last;
}

function medianCompare(a, b) {
   return a < b ? -1 : a > b ? 1 : 0;
}

function medianMADMedianOfArray(array) {
   if (array.length < 1) {
      return new Pair(NaN, NaN);
   }
   if (array.length < 2) {
      return new Pair(array[0], 0.0);
   }
   var copy = new Array();
   for (var i = 0; i != array.length; ++i) {
      copy.push(array[i]);
   }
   copy.sort(medianCompare);

   var threshold = Math.floor(0.5 * copy.length);
   var median = (2 * threshold == copy.length) ?
      0.5 * (copy[threshold - 1] + copy[threshold]) :
      copy[threshold];

   var deviations = new Array(copy.length);
   for (var i = 0; i != copy.length; ++i) {
      deviations[i] = Math.abs(median - copy[i]);
   }

   var MADMedian = 0.0;
   for (var i = 0; i != deviations.length; ++i) {
      MADMedian += deviations[i];
   }
   MADMedian = MADMedian / deviations.length;

   return new Pair(median, MADMedian);
}

function starProfile(b, a, x, y, sx, sy, theta, residual) {
   this.b = b;
   this.a = a;
   this.x = x;
   this.y = y;
   this.sx = sx;
   this.sy = sy;
   this.theta = theta;
   this.residual = residual;
}

function starProfileCompare(a, b) {
   var ax = Math.round(a.x);
   var ay = Math.round(a.y);
   var bx = Math.round(b.x);
   var by = Math.round(b.y);
   return ax < bx ? -1 : ax > bx ? 1 : ay < by ? -1 : ay > by ? 1 : 0;
}

function uniqueViewIdNoLeadingZero(baseId) {
   var id = baseId;
   for (var i = 1; !View.viewById(id).isNull; ++i) {
      id = baseId + format("%d", i);
   }
   return id;
}

function uniqueArray(values, compareFunction) {
   if (values.length < 2) {
      return values;
   }
   values.sort(compareFunction);

   var j = 0;
   for (var i = 1; i != values.length; ++i) {
      if (compareFunction(values[j], values[i]) == -1) {
         ++j;
         values[j] = values[i];
      }
   }
   return values.slice(0, j + 1);
}

function starProfilesOfImageWindow(imageWindow) {
   var starsViewId = uniqueViewIdNoLeadingZero(
      imageWindow.mainView.id + "_stars"
   );

   var barycenters = new Array;
   var threshold = 1.0;
   var maximumDetectedStars = 100000;
   if (USE_STAR_DETECTOR) {
      console.writeln();
      console.writeln();
      console.writeln("<b>StarDetector ", #__PJSR_STAR_DETECTOR_VERSION, "</b>: Processing view: ", imageWindow.mainView.fullId);
      console.flush();
      var startTime = new Date();

      var starDetector = new StarDetector();
      starDetector.sensitivity = Math.pow(10.0, parameters.logStarDetectionSensitivity);
      starDetector.upperLimit = parameters.upperLimit;

      var stars = starDetector.stars(imageWindow.mainView.image);

      var endTime = new Date();
      console.writeln(stars.length, " star(s) found");
      console.writeln(format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime())));
      console.flush();

      for (;;) {
         for (var i = 0; i != stars.length && barycenters.length != maximumDetectedStars; ++i) {
            if (threshold == 1.0 || Math.random() <= threshold) {
               barycenters.push({
                  position: stars[i].pos,
                  radius: Math.max(3, Math.ceil(Math.sqrt(stars[i].size)))
               });
            }
         }
         if (barycenters.length != maximumDetectedStars) {
            break;
         }
         barycenters = new Array;
         threshold = 0.1 * threshold;
      }
   }
   else {
      var starAlignment = new StarAlignment;

      starAlignment.referenceImage = imageWindow.mainView.id;
      starAlignment.referenceIsFile = false;

      starAlignment.mode = StarAlignment.prototype.DrawStars;
      starAlignment.onError = StarAlignment.prototype.Continue;
      starAlignment.restrictToPreviews = false;

      starAlignment.structureLayers = 4;
      starAlignment.noiseLayers = 2;
      starAlignment.hotPixelFilterRadius = 1;
      starAlignment.sensitivity = Math.pow(10.0, parameters.logStarDetectionSensitivity);
      starAlignment.peakResponse = 0.8;
      starAlignment.maxStarDistortion = 0.5;

      starAlignment.executeOn(imageWindow.mainView);

      var starsView = View.viewById(starsViewId);
      if (starsView.isNull) {
         (new MessageBox(
            "<p>Error: StarAlignment star map not found.</p>",
            TITLE,
            StdIcon_Warning,
            StdButton_Ok
         )).execute();
         return new Array();
      }
      var starsImageWindow = starsView.window;
      starsImageWindow.hide();

      var barycentersImageWindow = new ImageWindow(
         starsImageWindow.mainView.image.width,
         starsImageWindow.mainView.image.height,
         starsImageWindow.mainView.image.numberOfChannels,
         32,
         true,
         starsImageWindow.mainView.image.colorSpace != ColorSpace_Gray,
         uniqueViewIdNoLeadingZero(imageWindow.mainView.id + "_barycenters")
      );

      starsImageWindow.createPreview(starsImageWindow.mainView.image.bounds, "_");

      barycentersImageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);

      var barycenterKernel = [
         0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
         0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
         0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
         0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
         0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
         1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1,
         0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
         0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
         0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
         0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
         0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0
      ];
      barycentersImageWindow.mainView.image.selectedPoint = new Point(0, 0);
      barycentersImageWindow.mainView.image.apply(starsImageWindow.previewById("_").image);
      barycentersImageWindow.mainView.image.binarize(0.5);
      barycentersImageWindow.mainView.image.convolve(new Matrix(barycenterKernel, 11, 11));
      barycentersImageWindow.mainView.image.binarize(1.0);
      barycentersImageWindow.mainView.image.resetSelections();

      barycentersImageWindow.mainView.endProcess();

      starsImageWindow.deletePreview(starsImageWindow.previewById("_"));
      starsImageWindow.forceClose();

      var radius = Math.round(0.75 * (new DynamicPSF).searchRadius);
      var barycentersImage = barycentersImageWindow.mainView.image;
      for (;;) {
         for (
            var i = 1;
            i != barycentersImage.width - 1 && barycenters.length != maximumDetectedStars;
            ++i
         ) {
            for (
               var j = 1;
               j != barycentersImage.height - 1 && barycenters.length != maximumDetectedStars;
               ++j
            ) {
               if (
                  barycentersImage.sample(i, j) == 1.0 &&
                  barycentersImage.sample(i - 1, j - 1) +
                  barycentersImage.sample(i - 1, j) +
                  barycentersImage.sample(i - 1, j + 1) +
                  barycentersImage.sample(i, j - 1) +
                  barycentersImage.sample(i, j + 1) +
                  barycentersImage.sample(i + 1, j - 1) +
                  barycentersImage.sample(i + 1, j) +
                  barycentersImage.sample(i + 1, j + 1) == 0.0 &&
                  (threshold == 1.0 || Math.random() <= threshold)
               ) {
                  barycenters.push({
                     position: new Point(i, j),
                     radius: radius
                  });
               }
            }
         }
         if (barycenters.length != maximumDetectedStars) {
            break;
         }
         barycenters = new Array;
         threshold = 0.1 * threshold;
      }
      barycentersImageWindow.forceClose();
   }

   var maximumFittedStars = 20000;
   if (barycenters.length > maximumFittedStars) {
      threshold = 0.1 * threshold;
      for (var i = barycenters.length - 1; i != 0; --i) {
         var j = Math.round(Math.random() * i);
         var x = barycenters[i];
         barycenters[i] = barycenters[j];
         barycenters[j] = x;
      }
      barycenters = barycenters.slice(0, maximumFittedStars);
   }

   //if (threshold < 1.0) {
   //   (new MessageBox(
   //      "<p>Warning: excessive number of detected stars.</p>",
   //      TITLE,
   //      StdIcon_Warning,
   //      StdButton_Ok
   //   )).execute();
   //}

   var dynamicPSF = new DynamicPSF;

   dynamicPSF.autoPSF = false;
   dynamicPSF.circularPSF = false;
   dynamicPSF.gaussianPSF = parameters.modelFunctionIndex == 0;
   dynamicPSF.moffatPSF = false;
   dynamicPSF.moffat10PSF = parameters.modelFunctionIndex == 1;
   dynamicPSF.moffat8PSF = parameters.modelFunctionIndex == 2;
   dynamicPSF.moffat6PSF = parameters.modelFunctionIndex == 3;
   dynamicPSF.moffat4PSF = parameters.modelFunctionIndex == 4;
   dynamicPSF.moffat25PSF = parameters.modelFunctionIndex == 5;
   dynamicPSF.moffat15PSF = parameters.modelFunctionIndex == 6;
   dynamicPSF.lorentzianPSF = parameters.modelFunctionIndex == 7;
   dynamicPSF.regenerate = true;

   var views = new Array;
   views.push(new Array(imageWindow.mainView.id));
   dynamicPSF.views = views;

   var radius = Math.round(0.75 * dynamicPSF.searchRadius);
   var stars = new Array;
   for (var i = 0; i != barycenters.length; ++i) {
      stars.push(new Array(
         0, 0, DynamicPSF.prototype.Star_DetectedOk,
         barycenters[i].position.x - barycenters[i].radius,
         barycenters[i].position.y - barycenters[i].radius,
         barycenters[i].position.x + barycenters[i].radius,
         barycenters[i].position.y + barycenters[i].radius,
         barycenters[i].position.x,
         barycenters[i].position.y
      ));
   }
   dynamicPSF.stars = stars;
   var fitted = new Array(stars.length);
   for (var i = 0; i != fitted.length; ++i) {
      fitted[i] = false;
   }
   dynamicPSF.executeGlobal();

   #define DYNAMICPSF_PSF_StarIndex 0
   #define DYNAMICPSF_PSF_Status 3
   #define DYNAMICPSF_PSF_b 4
   #define DYNAMICPSF_PSF_a 5
   #define DYNAMICPSF_PSF_cx 6
   #define DYNAMICPSF_PSF_cy 7
   #define DYNAMICPSF_PSF_sx 8
   #define DYNAMICPSF_PSF_sy 9
   #define DYNAMICPSF_PSF_theta 10
   #define DYNAMICPSF_PSF_residual 12

   var starProfiles = new Array;
   var psfTable = dynamicPSF.psf;
   var starsTable = dynamicPSF.stars;
   for (var i = 0; i != psfTable.length; ++i) {
      var psfRow = psfTable[i];
      if (
         psfRow[DYNAMICPSF_PSF_Status] == DynamicPSF.prototype.PSF_FittedOk &&
         psfRow[DYNAMICPSF_PSF_residual] < 0.1 &&
         !fitted[psfRow[DYNAMICPSF_PSF_StarIndex]]
      ) {
         var starsRow = starsTable[psfRow[DYNAMICPSF_PSF_StarIndex]];
         starProfiles.push(new starProfile(
            psfRow[DYNAMICPSF_PSF_b],
            psfRow[DYNAMICPSF_PSF_a],
            psfRow[DYNAMICPSF_PSF_cx],
            psfRow[DYNAMICPSF_PSF_cy],
            psfRow[DYNAMICPSF_PSF_sx],
            psfRow[DYNAMICPSF_PSF_sy],
            psfRow[DYNAMICPSF_PSF_theta],
            psfRow[DYNAMICPSF_PSF_residual]
         ));
         fitted[psfRow[DYNAMICPSF_PSF_StarIndex]] = true;
      }
   }
   return uniqueArray(starProfiles, starProfileCompare);
}

function formatFloat(value) {
   if (value == 0.0) {
      return "0.0";
   }
   var logValue = Math.floor(Math.log10(Math.abs(value)));
   if (logValue <= 4 && logValue >= -3) {
      return format(format("%%.%df", Math.max(0, 3 - logValue)), value);
   }
   return format("%.3e", value);
}

function ordinateFormat(delta) {
   var logDelta = Math.floor(Math.log10(delta));
   if (logDelta > 3) {
      return "%.3e";
   }
   else if (logDelta >= 0) {
      return "%.0f";
   }
   else if (logDelta >= -4) {
      return format("%%.%df", -logDelta);
   }
   else {
      return "%.3e";
   }
}

function getMedianFWHM() {
   if (!parameters.validResults) {
      return "-";
   }
   return formatFloat(parameters.medianFWHM) + " px";
}

function getMedianEccentricity() {
   if (!parameters.validResults) {
      return "-";
   }
   return formatFloat(parameters.medianEccentricity);
}

function getMedianResidual() {
   if (!parameters.validResults) {
      return "-";
   }
   return formatFloat(parameters.medianResidual) + " DN";
}

function getMADMedianFWHM() {
   if (!parameters.validResults) {
      return "-";
   }
   return formatFloat(parameters.MADMedianFWHM) + " px";
}

function getMADMedianEccentricity() {
   if (!parameters.validResults) {
      return "-";
   }
   return formatFloat(parameters.MADMedianEccentricity);
}

function getMADMedianResidual() {
   if (!parameters.validResults) {
      return "-";
   }
   return formatFloat(parameters.MADMedianResidual) + " DN";
}

function getStarSupport() {
   if (!parameters.validResults) {
      return "-";
   }
   return format("%d", parameters.starSupport);
}

function disable() {
   parameters.dialog.viewList.enabled = false;

   parameters.dialog.logStarDetectionSensitivity.enabled = false;
   parameters.dialog.upperLimit.enabled = false;
   parameters.dialog.modelFunction.enabled = false;

   parameters.dialog.medianFWHMNode.setText(1, "...");
   parameters.dialog.medianEccentricityNode.setText(1, "...");
   parameters.dialog.medianResidualNode.setText(1, "...");
   parameters.dialog.MADMedianFWHMNode.setText(1, "...");
   parameters.dialog.MADMedianEccentricityNode.setText(1, "...");
   parameters.dialog.MADMedianResidualNode.setText(1, "...");
   parameters.dialog.starSupportNode.setText(1, "...");

   //parameters.dialog.aboutButton.enabled = false;
   parameters.dialog.resetButton.enabled = false;
   //parameters.dialog.measureButton.text = "Measuring...";
   parameters.dialog.measureButton.enabled = false;
   parameters.dialog.saveAsButton.enabled = false;
   parameters.dialog.supportButton.enabled = false;
   parameters.dialog.dismissButton.enabled = false;

   //parameters.dialog.adjustToContents();
}

function enable() {
   parameters.dialog.viewList.enabled = true;

   parameters.dialog.logStarDetectionSensitivity.enabled = true;
   parameters.dialog.upperLimit.enabled = true;
   parameters.dialog.modelFunction.enabled = true;

   parameters.dialog.medianFWHMNode.setText(1, getMedianFWHM());
   parameters.dialog.medianEccentricityNode.setText(1, getMedianEccentricity());
   parameters.dialog.medianResidualNode.setText(1, getMedianResidual());
   parameters.dialog.MADMedianFWHMNode.setText(1, getMADMedianFWHM());
   parameters.dialog.MADMedianEccentricityNode.setText(1, getMADMedianEccentricity());
   parameters.dialog.MADMedianResidualNode.setText(1, getMADMedianResidual());
   parameters.dialog.starSupportNode.setText(1, getStarSupport());

   //parameters.dialog.aboutButton.enabled = true;
   parameters.dialog.resetButton.enabled = true;
   //parameters.dialog.measureButton.text = "Measure";
   parameters.dialog.measureButton.enabled =
      parameters.targetView != null && parameters.targetView.isMainView;
   parameters.dialog.saveAsButton.enabled = parameters.validResults;
   parameters.dialog.supportButton.enabled = parameters.validResults;
   parameters.dialog.dismissButton.enabled = true;
}

function globalClear() {
   parameters.validResults = false;
   enable();
}

function globalReset() {
   parameters.logStarDetectionSensitivity = parameters.defLogStarDetectionSensitivity;
   parameters.upperLimit = parameters.defUpperLimit;
   parameters.modelFunctionIndex = parameters.defModelFunctionIndex;

   parameters.dialog.logStarDetectionSensitivity.text = format("%.2f", parameters.logStarDetectionSensitivity);
   parameters.dialog.upperLimit.text = format("%.3f", parameters.upperLimit);
   parameters.dialog.modelFunction.currentItem = parameters.modelFunctionIndex;

   globalClear();
}

function globalMeasure() {
   disable();

   parameters.validResults = false;
   if (parameters.targetView == null || !parameters.targetView.isMainView) {
      enable();
      return;
   }
   var image = parameters.targetView.image;
   if (!image.isGrayscale) {
      enable();
      (new MessageBox(
         "<p>Error: Target view color space must be Grayscale.</p>",
         TITLE,
         StdIcon_Warning,
         StdButton_Ok
      )).execute();
      return;
   }

   var startTime = new Date;
   // console.writeln();
   // console.writeln("Processing view: ", parameters.targetView.fullId);

   console.show();
   var starProfiles = starProfilesOfImageWindow(parameters.targetView.window);
   console.hide();
   if (starProfiles.length == 0) {
      enable();
      return;
   }

   var FWHMs = new Array();
   var eccentricities = new Array();
   var residuals = new Array();
   for (var i = 0; i != starProfiles.length; ++i) {
      var starProfile = starProfiles[i];
      FWHMs.push(Math.sqrt(starProfile.sx * starProfile.sy));
      eccentricities.push(Math.sqrt(1.0 - Math.pow(starProfile.sy / starProfile.sx, 2.0)));
      residuals.push(starProfile.residual);
   }

   var endTime = new Date;
   // console.writeln(format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime())));

   parameters.validResults = true;
   var medianMADMedianFWHM = medianMADMedianOfArray(FWHMs);
   parameters.medianFWHM = parameters.modelFunctionNormalizations[parameters.modelFunctionIndex] * medianMADMedianFWHM.first;
   parameters.MADMedianFWHM = parameters.modelFunctionNormalizations[parameters.modelFunctionIndex] * medianMADMedianFWHM.last;
   var medianMADMedianEccentricity = medianMADMedianOfArray(eccentricities);
   parameters.medianEccentricity = medianMADMedianEccentricity.first;
   parameters.MADMedianEccentricity = medianMADMedianEccentricity.last;
   var medianMADMedianResidual = medianMADMedianOfArray(residuals);
   parameters.medianResidual = parameters.resolution * medianMADMedianResidual.first;
   parameters.MADMedianResidual = parameters.resolution * medianMADMedianResidual.last;
   parameters.starSupport = starProfiles.length;
   parameters.starProfiles = starProfiles;

   enable();
}

function globalSaveAs() {
   var directory = Settings.read(
      TITLE + "." + VERSION + "_" + "saveAsDirectory", DataType_String
   );
   if (!Settings.lastReadOK || directory == null || !File.directoryExists(directory)
   ) {
      directory = File.systemTempDirectory;
   }

   var saveFileDialog = new SaveFileDialog();

   saveFileDialog.caption = TITLE + ": Save Measurements File As";
   saveFileDialog.filters = [[".csv files", "*.csv"]];
   saveFileDialog.initialPath = directory + "/" + parameters.targetView.fullId + "_FWHME.csv";
   if (!saveFileDialog.execute()) {
      return;
   }

   Settings.write(
      TITLE + "." + VERSION + "_" + "saveAsDirectory",
      DataType_String,
      File.extractDrive(saveFileDialog.fileName) +
         File.extractDirectory(saveFileDialog.fileName)
   );

   try {
      var file = new File();
      file.createForWriting(saveFileDialog.fileName);

      file.outTextLn(TITLE + "." + VERSION);
      file.outTextLn("logStarDetectionSensitivity," +
         format("%e", parameters.logStarDetectionSensitivity)
      );
      file.outTextLn("upperLimit," +
         format("%e", parameters.upperLimit)
      );
      file.outTextLn("modelFunction," +
         parameters.modelFunctionLabels[parameters.modelFunctionIndex]
      );

      file.outTextLn(
         "Header,Target,Identifier,Median FWHM px,Median eccentricity,Median residual DN,MAD FWHM px,MAD eccentricity,MAD residual DN,Star support"
      );
      file.outTextLn(
         "Target," +
         parameters.targetView.fullId + "," +
         format("%e", parameters.medianFWHM) + "," +
         format("%e", parameters.medianEccentricity) + "," +
         format("%e", parameters.medianResidual) + "," +
         format("%e", parameters.MADMedianFWHM) + "," +
         format("%e", parameters.MADMedianEccentricity) + "," +
         format("%e", parameters.MADMedianResidual) + "," +
         format("%d", parameters.starSupport)
      );

      file.outTextLn(
         "Header,Star,b,a,x,y,sx,sy,theta,residual"
      );
      for (var i = 0; i != parameters.starProfiles.length; ++i) {
         var starProfile = parameters.starProfiles[i];
         file.outTextLn(
            "Star," +
            format("%e", starProfile.b) + "," +
            format("%e", starProfile.a) + "," +
            format("%e", starProfile.x) + "," +
            format("%e", starProfile.y) + "," +
            format("%e", starProfile.sx) + "," +
            format("%e", starProfile.sy) + "," +
            format("%e", starProfile.theta) + "," +
            format("%e", starProfile.residual)
         );
      }

      file.close();
   }
   catch (error) {
      (new MessageBox(
         "<p>Error: Can't write .csv file: " + saveFileDialog.fileName + "</p>",
         TITLE,
         StdIcon_Warning,
         StdButton_Ok
      )).execute();
   }
}

function generateStarsImageWindow(targetImageWindow, id, starProfiles) {
   var targetImage = targetImageWindow.mainView.image;
   var starsImageWindow = new ImageWindow(
      targetImage.width,
      targetImage.height,
      targetImage.numberOfChannels,
      32,
      true,
      targetImage.colorSpace != ColorSpace_Gray,
      uniqueViewIdNoLeadingZero(targetImageWindow.mainView.id + "_" + id)
   );

   var residuals = new Array();
   for (var i = 0; i != starProfiles.length; ++i) {
      var starProfile = starProfiles[i];
      residuals.push(starProfile.residual);
   }
   var medianMADMedianResidual = medianMADMedianOfArray(residuals);
   if (medianMADMedianResidual.last == 0.0) {
      medianMADMedianResidual.last = 1.0;
   }

   var barycenterKernel = [
      0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
      1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1,
      0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0
   ];
   var barycenterBitmap = new Bitmap(11, 11);
   barycenterBitmap.fill(0);
   for (var y = 0; y != barycenterBitmap.height; ++y) {
      for (var x = 0; x != barycenterBitmap.width; ++x) {
         if (barycenterKernel[y * barycenterBitmap.width + x] != 0) {
            barycenterBitmap.setPixel(x, y, 0xff808080);
         }
      }
   }

   var overlayBitmap = new Bitmap(targetImage.width, targetImage.height);
   overlayBitmap.fill(0);
   var graphics = new Graphics();
   graphics.begin(overlayBitmap);
   graphics.font = new Font(FontFamily_Helvetica, 8);
   graphics.antialiasing = false;
   graphics.textAntialiasing = false;
   graphics.transparentBackground = true;
   graphics.pen = new Pen(0xff808080);
   var bounds = barycenterBitmap.bounds;
   for (var i = 0; i != starProfiles.length; ++i) {
      var starProfile = starProfiles[i];
      bounds.moveTo(
         Math.round(starProfile.x),
         Math.round(starProfile.y)
      );
      bounds.moveBy(
         -0.5 * (barycenterBitmap.width - 1),
         -0.5 * (barycenterBitmap.height - 1)
      );
      graphics.drawScaledBitmap(bounds, barycenterBitmap);
      var label = format(
         "%.0f",
         (residuals[i] - medianMADMedianResidual.first) / medianMADMedianResidual.last
      );
      graphics.drawText(starProfile.x + 2, starProfile.y - 1, label);
   }
   graphics.end();

   targetImageWindow.createPreview(targetImage.bounds, "_");

   starsImageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);

   starsImageWindow.mainView.image.selectedPoint = new Point(0, 0);
   starsImageWindow.mainView.image.apply(targetImageWindow.previewById("_").image);
   starsImageWindow.mainView.image.blend(overlayBitmap);
   starsImageWindow.mainView.image.resetSelections();

   starsImageWindow.mainView.endProcess();

   targetImageWindow.deletePreview(targetImageWindow.previewById("_"));

   return starsImageWindow;
}

function partitionStarProfiles(starProfiles, width, height, rows, columns) {
   var tileWidth = width / columns;
   var tileHeight = height / rows;

   var partition = [];
   for (var i = 0; i != rows; ++i) {
      var row = [];
      for (var j = 0; j != columns; ++j) {
         var bounds = new Rect(
            Math.round(j * tileWidth),
            Math.round(i * tileHeight),
            Math.round((j + 1) * tileWidth),
            Math.round((i + 1) * tileHeight)
         );
         var tileDescriptions = [];
         for (var k = 0; k != starProfiles.length; ++k) {
            var starProfile = starProfiles[k];
            if (
               bounds.left <= starProfile.x && starProfile.x < bounds.right &&
               bounds.top <= starProfile.y && starProfile.y < bounds.bottom
            ) {
               tileDescriptions.push(starProfile);
            }
         }
         row.push(tileDescriptions);
      }
      partition.push(row);
   }

   return partition;
}

function minimumPartition(partition, rows, columns) {
   var minimum = Infinity;
   for (var i = 0; i != rows; ++i) {
      for (var j = 0; j != columns; ++j) {
         minimum = Math.min(minimum, partition[i][j]);
      }
   }
   return minimum;
}

function maximumPartition(partition, rows, columns) {
   var maximum = -Infinity;
   for (var i = 0; i != rows; ++i) {
      for (var j = 0; j != columns; ++j) {
         maximum = Math.max(maximum, partition[i][j]);
      }
   }
   return maximum;
}

function minimumStarProfilePartitionTileSize(partition, rows, columns) {
   var tileSize = Infinity;
   for (var i = 0; i != rows; ++i) {
      for (var j = 0; j != columns; ++j) {
         tileSize = Math.min(tileSize, partition[i][j].length);
      }
   }
   return tileSize;
}

function generateFWHMPartition(partition, rows, columns) {
   var FWHMPartition = [];
   for (var i = 0; i != rows; ++i) {
      var row = [];
      for (var j = 0; j != columns; ++j) {
         var starProfiles = partition[i][j];
         var FWHMs = [];
         for (var k = 0; k != starProfiles.length; ++k) {
            var starProfile = starProfiles[k];
            FWHMs.push(
               parameters.modelFunctionNormalizations[parameters.modelFunctionIndex] * Math.sqrt(starProfile.sx * starProfile.sy)
            );
         }
         row.push(medianMADMedianOfArray(FWHMs).first);
      }
      FWHMPartition.push(row);
   }
   return FWHMPartition;
}

function generateEccentricityPartition(partition, rows, columns) {
   var eccentricityPartition = [];
   for (var i = 0; i != rows; ++i) {
      var row = [];
      for (var j = 0; j != columns; ++j) {
         var starProfiles = partition[i][j];
         var eccentricitys = [];
         for (var k = 0; k != starProfiles.length; ++k) {
            var starProfile = starProfiles[k];
            eccentricitys.push(
               Math.sqrt(1.0 - Math.pow(starProfile.sy / starProfile.sx, 2.0))
            );
         }
         row.push(medianMADMedianOfArray(eccentricitys).first);
      }
      eccentricityPartition.push(row);
   }
   return eccentricityPartition;
}

function applyToImageWindowImages(imageWindow, images) {
   imageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);

   imageWindow.mainView.image.fill(1.0);
   for (var i = 0; i != images.length; ++i) {
      imageWindow.mainView.image.selectedPoint = images[i][0];
      imageWindow.mainView.image.apply(images[i][1]);
   }
   imageWindow.mainView.image.resetSelections();

   imageWindow.mainView.endProcess();
}

function createResampleImageWindow(
   partition, rows, columns, partitionScale, resampleWidth, resampleHeight, id
) {
   var resampleImage = new Image(
      columns, rows, 1, ColorSpace_Gray, 32, SampleType_Real
   );

   var scaledPartition = new Array;
   for (var i = 0; i != rows; ++i) {
      for (var j = 0; j != columns; ++j) {
       scaledPartition.push(partitionScale * partition[i][j]);
      }
   }
   resampleImage.setPixels(scaledPartition);

   var resampleImageWindow = new ImageWindow(
      columns, rows, 1, 32, true, false, uniqueViewIdNoLeadingZero(id + "_map")
   );
   applyToImageWindowImages(resampleImageWindow, [[new Point(0, 0), resampleImage]]);

   var marginWidth = Math.round(resampleWidth / (columns - 1));
   var marginHeight = Math.round(resampleHeight / (rows - 1));
   var resample = new Resample;

   resample.absoluteMode = Resample.prototype.ForceWidthAndHeight;
   resample.clampingThreshold = 0.3;
   resample.interpolation = Resample.prototype.BicubicSpline;
   resample.mode = Resample.prototype.AbsolutePixels;
   resample.xSize = resampleWidth + marginWidth;
   resample.ySize = resampleHeight + marginHeight;

   resample.executeOn(resampleImageWindow.mainView, false);

   var crop = new Crop;

   crop.leftMargin = 0;
   crop.rightMargin = -marginWidth;
   crop.topMargin = 0;
   crop.bottomMargin = -marginHeight;
   crop.mode = Crop.prototype.AbsolutePixels;

   crop.executeOn(resampleImageWindow.mainView, false);

   return resampleImageWindow;
}

function contourPlotAxisDescription(minTick, maxTick, delta) {
   this.minTick = minTick;
   this.maxTick = maxTick;
   this.delta = delta;
}

function generateContourPlotAxisDescription(minimum, maximum, levels) {
   var min = minimum;
   var max = maximum;

   var delta = Math.pow(10.0, Math.floor(Math.log10((max - min) / levels)));
   var thresholds = [1.0, 2.0, 5.0, 10.0];

   var i = 0;
   var iDelta = thresholds[[i]] * delta;
   var iLevels = Math.floor(max / iDelta) - Math.floor(min / iDelta) + 1;
   for (var j = 1; j != thresholds.length; ++j) {
      var jDelta = thresholds[[j]] * delta;
      var jLevels = Math.floor(max / jDelta) - Math.floor(min / jDelta) + 1;

      if (Math.abs(jLevels - levels) <= Math.abs(iLevels - levels)) {
         i = j;
         iDelta = jDelta;
         iLevels = jLevels;
      }
   }

   return new contourPlotAxisDescription(
      Math.floor(min / iDelta),
      Math.floor(max / iDelta),
      iDelta
   );
}

function quantizeImageWindow(
   imageWindow, minTick, maxTick, delta, colorBias, colorScale
) {
   var pixelMath = new PixelMath;

   var pixelScale = colorScale / (maxTick - minTick);
   var pixelBias = colorBias - pixelScale * minTick;
   pixelMath.expression =
      format("%f + %f * floor(%f * $target)", pixelBias, pixelScale, 1.0 / delta);
   pixelMath.rescale = false;
   pixelMath.truncate = true;
   pixelMath.truncateLower = 0.0;
   pixelMath.truncateUpper = 1.0;
   pixelMath.useSingleExpression = true;

   pixelMath.executeOn(imageWindow.mainView, false);

   return imageWindow;
}

function createTitleImage(width, height, font, title) {
   var bitmap = new Bitmap(width, height);
   bitmap.fill(0);

   var graphics = new Graphics(bitmap);
   graphics.font = font;

   graphics.drawText(0.5 * (bitmap.width -font.width(title)), font.ascent, title);
   graphics.end();

   var titleImage = new Image(
      bitmap.width, bitmap.height, 1, ColorSpace_Gray, 32, SampleType_Real
   );

   titleImage.fill(1.0);
   titleImage.blend(bitmap);

   return titleImage;
}

function findArray(array, i) {
    var j = i;
   for (; array[j][0] != j; j = array[j][0]) {
   }
   for (; i != j;) {
      var k = array[i][0];
      array[i][0] = j;
      i = k;
   }
   return j;
}

function unionArray(array, i, j) {
   i = findArray(array, i);
   j = findArray(array, j);
   array[i][0] = j;
}

function edgesCompare(a, b) {
   return a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0;
}

function labelCandidatesImageWindow(imageWindow, inset) {
   var image = imageWindow.mainView.image;
   var contour = new Array;
   for (var y = 0; y != image.height; ++y) {
      for (var x = 0; x != image.width; ++x) {
         var sample = image.sample(x, y);
         var edge = x >= inset &&
            x < image.width - inset &&
            y >= inset && y < image.height - inset && (
            sample > image.sample(x - 1, y) ||
            sample > image.sample(x + 1, y) ||
            sample > image.sample(x, y - 1) ||
            sample > image.sample(x, y + 1)
         );
         contour.push([edge ? contour.length : 0, sample]);
      }
   }

   for (var i = 0; i != contour.length; ++i) {
      var c0 = contour[i];
      if (c0[0] != 0) {
         var c1 = contour[i - 1];
         if (c1[0] != 0 && c0[1] == c1[1]) {
            unionArray(contour, i, i - 1);
         }
         c1 = contour[i - image.width + 1];
         if (c1[0] != 0 && c0[1] == c1[1]) {
            unionArray(contour, i, i - image.width + 1);
         }
         c1 = contour[i - image.width];
         if (c1[0] != 0 && c0[1] == c1[1]) {
            unionArray(contour, i, i - image.width);
         }
         c1 = contour[i - image.width - 1];
         if (c1[0] != 0 && c0[1] == c1[1]) {
            unionArray(contour, i, i - image.width - 1);
         }
      }
   }

   for (var i = 0; i != contour.length; ++i) {
      var c0 = contour[i];
      if (c0[0] != 0) {
         findArray(contour, i);
      }
   }

   var edges = new Array;
   for (var i = 0; i != contour.length; ++i) {
      var c0 = contour[i];
      if (c0[0] != 0) {
         edges.push([c0[0], c0[1], i]);
      }
   }
   //console.writeln("edges.length: ", edges.length);
   edges.sort(edgesCompare);

   var candidates = new Array;
   for (var i = 0; i != edges.length;) {
      var j = i;
      for (; j != edges.length && edges[j][0] == edges[i][0]; ++j) {
      }
      if (j - i > 2 * inset) {
         var candidate = new Array;
         for (var k = 0; k != 5; ++k) {
            var e0 = edges[Math.min(j - i - 1, Math.floor(Math.random() * (j - i))) + i];
            candidate.push(
               [e0[2] % image.width, Math.floor(e0[2] / image.width), e0[1]]
            );
         }
         candidates.push(candidate);
         //console.writeln("candidate: ", candidates[candidates.length - 1]);
      }
      i = j;
   }
   //console.writeln("candidates.length: ", candidates.length);

   return candidates;
}

function collidesRectangle(rects, rect) {
   for (var i = 0; i != rects.length; ++i) {
      if (rects[i].intersects(rect)) {
         return true;
      }
   }
   return false;
}

function createContourImage(
   targetImage,
   labelCandidates,
   minTick,
   maxTick,
   delta,
   colorBias,
   colorScale,
   font
) {
   var pixelScale = colorScale / (maxTick - minTick);
   var pixelBias = colorBias - pixelScale * minTick;

   var bitmap = new Bitmap(targetImage.width, targetImage.height);
   bitmap.fill(0);
   var graphics = new Graphics(bitmap);
   graphics.font = font;
   var rects = new Array;
   for (var i = 0; i != labelCandidates.length; ++i) {
      for (var j = 0; j != labelCandidates[i].length; ++j) {
         var candidate = labelCandidates[i][j];
         var text = format(
            ordinateFormat(delta),
            delta * (candidate[2] - pixelBias) / pixelScale
         );

         var halfWidth = Math.round(0.5 * graphics.font.width(text));
         var halfAscent = Math.round(0.5 * graphics.font.ascent);
         var rect = new Rect(
            candidate[0] - halfWidth - 2,
            candidate[1] - halfAscent + 1,
            candidate[0] + halfWidth + 1,
            candidate[1] + halfAscent + 1
         );
         if (
            !bitmap.bounds.includes(rect.leftTop) ||
            !bitmap.bounds.includes(rect.rightBottom)
         ) {
            continue;
         }
         if (collidesRectangle(rects, rect)) {
            continue;
         }

         graphics.drawText(
            candidate[0] - halfWidth,
            candidate[1] + halfAscent - 1,
            text
         );
         rects.push(rect);
         // graphics.strokeRect(rect);
         break;
      }
   }
   graphics.end();

   var contourImage = new Image(
      bitmap.width, bitmap.height, 1, ColorSpace_Gray, 32, SampleType_Real
   );

   contourImage.assign(targetImage);
   contourImage.blend(bitmap);

   return contourImage;
}

function createContourImageWindow(
   scale, partition, rows, columns, width, height, font, title, id
) {
   var partitionMaximum = maximumPartition(partition, rows, columns);
   var partitionScale = partitionMaximum != 0.0 ? 1.0 / partitionMaximum : 1.0;

   var resampleWidth = Math.round(scale * 384);
   var resampleHeight = Math.round(scale * 384);
   if (width > height) {
      resampleWidth = Math.round((width / height) * resampleWidth);
   }
   if (height > width) {
      resampleHeight = Math.round((height / width) * resampleHeight);
   }
   //console.writeln("resampleWidth: ", resampleWidth);
   //console.writeln("resampleHeight: ", resampleHeight);

   var resampleImageWindow = createResampleImageWindow(
      partition,
      rows,
      columns,
      partitionScale,
      resampleWidth,
      resampleHeight,
      id
   );

   var resampleMinimum = resampleImageWindow.mainView.image.minimum() / partitionScale;
   var resampleMaximum = resampleImageWindow.mainView.image.maximum() / partitionScale;
   if (resampleMinimum == resampleMaximum) {
      var resampleDelta = resampleMinimum == 0.0 ? 0.05 : 0.05 * resampleMinimum;
      resampleMinimum -= resampleDelta;
      resampleMaximum += resampleDelta;
   }
   var axisDescription =
      generateContourPlotAxisDescription(resampleMinimum, resampleMaximum, 7);
   //console.writeln(
   //   "minTick: ", axisDescription.minTick,
   //   ", maxTick: ", axisDescription.maxTick,
   //   ", delta: ", axisDescription.delta
   //);

   var colorBias = 0.3;
   var colorScale = 0.6;
   quantizeImageWindow(
      resampleImageWindow,
      axisDescription.minTick,
      axisDescription.maxTick,
      partitionScale * axisDescription.delta,
      colorBias,
      colorScale
   );

   var titleWidth = resampleWidth;
   var titleHeight = font.lineSpacing;
   var titleImage = createTitleImage(titleWidth, titleHeight, font, title);

   var labelCandidates = labelCandidatesImageWindow(resampleImageWindow, 1);

   var contourImage = createContourImage(
      resampleImageWindow.mainView.image,
      labelCandidates,
      axisDescription.minTick,
      axisDescription.maxTick,
      axisDescription.delta,
      colorBias,
      colorScale,
      font
   );

   var separationSize = 8;
   var contourWidth = resampleWidth + 2 * separationSize;
   var contourHeight = titleHeight + resampleHeight + 3 * separationSize;
   var contourImageWindow = new ImageWindow(
      contourWidth, contourHeight, 1, 32, true, false, uniqueViewIdNoLeadingZero(id)
   );
   applyToImageWindowImages(contourImageWindow, [
      [new Point(separationSize, separationSize), titleImage],
      [new Point(separationSize, titleHeight + 2 * separationSize), contourImage],
   ]);

   // resampleImageWindow.forceClose(); // RC6 Win7 exception
   resampleImageWindow.close(); // RC6 Win7 exception workaround

   return contourImageWindow;
}

function globalSupport(dialog) {
   disable();

   var starsImageWindow = generateStarsImageWindow(
      parameters.targetView.window, "stars", parameters.starProfiles
   );
   starsImageWindow.show();

   var rows = 5;
   var columns = 5;
   var partition;
   for (; rows != 2 && columns != 2;) {
      partition = partitionStarProfiles(
         parameters.starProfiles,
         parameters.targetView.window.mainView.image.width,
         parameters.targetView.window.mainView.image.height,
         rows,
         columns
      );
      if (
         minimumStarProfilePartitionTileSize(partition, rows, columns) >= 30
      ) {
         break;
      }
      --rows;
      --columns;
   }
   //console.writeln("rows: ", rows);
   //console.writeln("columns: ", columns);

   if (rows > 2 && columns > 2) {
      console.show();
      var FWHMPartition = generateFWHMPartition(partition, rows, columns);
      var FWHMContourImageWindow = createContourImageWindow(
         dialog.displayPixelRatio,
         FWHMPartition,
         rows,
         columns,
         parameters.targetView.image.width,
         parameters.targetView.image.height,
         new Font(FontFamily_Helvetica, 10),
         "FWHM (" +
         parameters.modelFunctionLabels[parameters.modelFunctionIndex] +
         ", Median " + formatFloat(parameters.medianFWHM) +
         " px, MAD " + formatFloat(parameters.MADMedianFWHM) + " px)",
         uniqueViewIdNoLeadingZero(parameters.targetView.id + "_FWHM")
       );
       FWHMContourImageWindow.show();

      var eccentricityPartition = generateEccentricityPartition(
         partition, rows, columns
      );
      var eccentricityContourImageWindow = createContourImageWindow(
         dialog.displayPixelRatio,
         eccentricityPartition,
         rows,
         columns,
         parameters.targetView.image.width,
         parameters.targetView.image.height,
         new Font(FontFamily_Helvetica, 10),
         "Eccentricity (" +
         parameters.modelFunctionLabels[parameters.modelFunctionIndex] +
         ", Median " + formatFloat(parameters.medianEccentricity) +
         ", MAD " + formatFloat(parameters.MADMedianEccentricity) + ")",
         uniqueViewIdNoLeadingZero(parameters.targetView.id + "_eccentricity")
       );
       eccentricityContourImageWindow.show();
       console.hide();
   }
   else {
      (new MessageBox(
         "<p>Error: Insufficient number of fitted stars for supporting " +
         "contour image generation.</p>",
         TITLE,
         StdIcon_Warning,
         StdButton_Ok
      )).execute();
   }

   enable();
}

function parametersDialogPrototype() {
   this.__base__ = Dialog;
   this.__base__();

   this.windowTitle = TITLE;

   this.onEditCompletedActive = false;

   this.targetPane = new HorizontalSizer;

   this.viewList = new ViewList(this);
   this.viewListNullCurrentView = this.viewList.currentView;

   this.viewList.getMainViews();
   if (ImageWindow.activeWindow.currentView.isMainView) {
      parameters.targetView = ImageWindow.activeWindow.currentView;
      this.viewList.currentView = parameters.targetView;
   }
   // this.viewList.toolTip = "<p>The view targeted for measurement.</p>";
   this.viewList.onViewSelected = function(view) {
      parameters.targetView = view;
      globalClear();
   }

   this.targetPane.add(this.viewList);

   this.settingsPane = new VerticalSizer;

   this.settingsPane.spacing = 6;

   var alignmentWidth = this.font.width("Log(star detection sensitivity):");

   this.logStarDetectionSensitivityPane = new HorizontalSizer;

   this.logStarDetectionSensitivityPane.spacing = 6;

   this.logStarDetectionSensitivityLabel = new Label(this);

   this.logStarDetectionSensitivityLabel.setFixedWidth(alignmentWidth);
   this.logStarDetectionSensitivityLabel.text =
      "Log(star detection sensitivity):";
   this.logStarDetectionSensitivityLabel.textAlignment =
      TextAlign_Right | TextAlign_VertCenter;
   this.logStarDetectionSensitivityLabel.toolTip =
      "<p>This parameter specifies the logarithm of the star detection " +
      "sensitivity.</p>" +
      "<p>Decrease this parameter to favor detection of fainter stars or " +
      "stars on brighter backgrounds. Increase it to restrict detection to " +
      "brighter stars or stars on dimmer backgrounds.</p>";

   this.logStarDetectionSensitivityPane.add(
      this.logStarDetectionSensitivityLabel
   );

   this.logStarDetectionSensitivity = new Edit(this);

   this.logStarDetectionSensitivity.setFixedWidth(
      this.font.width("-000000.00")
   );
   this.logStarDetectionSensitivity.text = format(
      "%.2f", parameters.logStarDetectionSensitivity
   );
   this.logStarDetectionSensitivity.toolTip =
      this.logStarDetectionSensitivityLabel.toolTip;
   this.logStarDetectionSensitivity.onEditCompleted = function() {
      // workaround for recursive onEditCompleted
      if (this.dialog.onEditCompletedActive) {
         return;
      }
      this.dialog.onEditCompletedActive = true;
      var value = parseFloat(this.text);
      if (
         isNaN(value) ||
         value < parameters.minLogStarDetectionSensitivity ||
         value > parameters.maxLogStarDetectionSensitivity
      ) {
         (new MessageBox(
            "<p>Invalid Log(star detection sensitivity) value.</p>",
            TITLE,
            StdIcon_Error,
            StdButton_Ok
         )).execute();
      }
      else if (parameters.logStarDetectionSensitivity != value) {
         parameters.logStarDetectionSensitivity = value;
         globalClear();
      }
      this.text = format("%.2f", parameters.logStarDetectionSensitivity);
      this.dialog.onEditCompletedActive = false;
   };

   this.logStarDetectionSensitivityPane.add(this.logStarDetectionSensitivity);
   this.logStarDetectionSensitivityPane.addStretch();

   this.settingsPane.add(this.logStarDetectionSensitivityPane);

   this.upperLimitPane = new HorizontalSizer;

   this.upperLimitPane.spacing = 6;

   this.upperLimitLabel = new Label(this);

   this.upperLimitLabel.setFixedWidth(alignmentWidth);
   this.upperLimitLabel.text = "Upper limit:";
   this.upperLimitLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.upperLimitLabel.toolTip =
      "<p>Stars with peak values larger than this value won't be " +
      "measured.</p>" +
      "<p>This feature may be used to avoid the measurement of saturated " +
      "and bloomed stars.</p>" +
      "<p>To disable this feature, set this parameter to one.</p>";

   this.upperLimitPane.add(this.upperLimitLabel);

   this.upperLimit = new Edit(this);

   this.upperLimit.setFixedWidth(this.font.width("-000000.00"));
   this.upperLimit.text = format("%.3f", parameters.upperLimit);
   this.upperLimit.toolTip = this.upperLimitLabel.toolTip;
   this.upperLimit.onEditCompleted = function() {
      // workaround for recursive onEditCompleted
      if (this.dialog.onEditCompletedActive) {
         return;
      }
      this.dialog.onEditCompletedActive = true;
      var value = parseFloat(this.text);
      if (
         isNaN(value) ||
         value < parameters.minUpperLimit ||
         value > parameters.maxUpperLimit
      ) {
         (new MessageBox(
            "<p>Invalid Upper limit value.</p>",
            TITLE,
            StdIcon_Error,
            StdButton_Ok
         )).execute();
      }
      else if (parameters.upperLimit != value) {
         parameters.upperLimit = value;
         globalClear();
      }
      this.text = format("%.3f", parameters.upperLimit);
      this.dialog.onEditCompletedActive = false;
   };

   this.upperLimitPane.add(this.upperLimit);
   this.upperLimitPane.addStretch();

   this.settingsPane.add(this.upperLimitPane);

   this.modelFunctionPane = new HorizontalSizer;

   this.modelFunctionPane.spacing = 6;

   this.modelFunctionLabel = new Label(this);

   this.modelFunctionLabel.setFixedWidth(alignmentWidth);
   this.modelFunctionLabel.text = "Model function:";
   this.modelFunctionLabel.textAlignment =
      TextAlign_Right | TextAlign_VertCenter;
   this.modelFunctionLabel.toolTip =
      "<p>This parameters specifies the star profile model function " +
      "used to fit star images.</p>";

   this.modelFunctionPane.add(this.modelFunctionLabel);

   this.modelFunction = new ComboBox(this);

   for (var i = 0; i != parameters.modelFunctionLabels.length; ++i) {
      this.modelFunction.addItem(" " + parameters.modelFunctionLabels[i]);
   }
   this.modelFunction.currentItem = parameters.modelFunctionIndex;
   this.modelFunction.toolTip = this.modelFunctionLabel.toolTip;
   this.modelFunction.onItemSelected = function(item) {
      if (parameters.modelFunctionIndex != item) {
         parameters.modelFunctionIndex = item;
         globalClear();
      }
   };

   this.modelFunctionPane.add(this.modelFunction);
   this.modelFunctionPane.addStretch();

   this.settingsPane.add(this.modelFunctionPane);

   this.resultsPane = new VerticalSizer;

   this.treeBox = new TreeBox(this);

   this.treeBox.alternateRowColor = true;
   this.treeBox.headerVisible = false;
   this.treeBox.indentSize = 0;
   this.treeBox.numberOfColumns = 2;

   // Workaround to avoid setColumnWidth failure in 1.8.4.1171
   this.displayPixelRatio;

   this.treeBox.setHeaderAlignment(0, Align_Left | TextAlign_VertCenter);
   this.treeBox.setColumnWidth(
      0, this.treeBox.font.width("Median eccentricityMM")
   );
   this.treeBox.setHeaderAlignment(1, Align_Left | TextAlign_VertCenter);
   this.treeBox.setColumnWidth(
      1, this.treeBox.columnWidth(0)
   );

   this.treeBox.setFixedHeight(
      8 *(this.treeBox.font.ascent + 3 * this.treeBox.font.descent)
   );

   this.medianFWHMNode = new TreeBoxNode(this.treeBox);

   this.medianFWHMNode.setText(0, "Median FWHM");
   this.medianFWHMNode.setText(1, "-");
   this.medianFWHMNode.setToolTip(
      0, "<p>Median FWHM equals the median full width at half maximum of " +
      "fitted star profiles in pixels.</p>");
   this.medianFWHMNode.setToolTip(
      1, this.medianFWHMNode.toolTip(0)
   );

   this.medianEccentricityNode = new TreeBoxNode(this.treeBox);

   this.medianEccentricityNode.setText(0, "Median eccentricity");
   this.medianEccentricityNode.setText(1, "-");
   this.medianEccentricityNode.setToolTip(
      0, "<p>Median eccentricity equals the median eccentricity of fitted " +
      "star profiles.</p>"
   );
   this.medianEccentricityNode.setToolTip(
      1, this.medianEccentricityNode.toolTip(0)
   );

   this.medianResidualNode = new TreeBoxNode(this.treeBox);

   this.medianResidualNode.setText(0, "Median residual");
   this.medianResidualNode.setText(1, "-");
   this.medianResidualNode.setToolTip(
      0, "<p>Median residual equals the median residual of fitted star " +
      "profiles in data number (DN) units.</p>"
   );
   this.medianResidualNode.setToolTip(
      1, this.medianResidualNode.toolTip(0)
   );

   this.MADMedianFWHMNode = new TreeBoxNode(this.treeBox);

   this.MADMedianFWHMNode.setText(0, "MAD FWHM");
   this.MADMedianFWHMNode.setText(1, "-");
   this.MADMedianFWHMNode.setToolTip(
      0, "<p>MAD FWHM equals the mean absolute deviation about the median " +
      "full width at half maximum of fitted star profiles in pixels.</p>"
   );
   this.MADMedianFWHMNode.setToolTip(
      1, this.MADMedianFWHMNode.toolTip(0)
   );

   this.MADMedianEccentricityNode = new TreeBoxNode(this.treeBox);

   this.MADMedianEccentricityNode.setText(0, "MAD eccentricity");
   this.MADMedianEccentricityNode.setText(1, "-");
   this.MADMedianEccentricityNode.setToolTip(
      0, "<p>MAD eccentricity equals the mean absolute deviation about the " +
      "median eccentricity of fitted star profiles.</p>"
   );
   this.MADMedianEccentricityNode.setToolTip(
      1, this.MADMedianEccentricityNode.toolTip(0)
   );

   this.MADMedianResidualNode = new TreeBoxNode(this.treeBox);

   this.MADMedianResidualNode.setText(0, "MAD residual");
   this.MADMedianResidualNode.setText(1, "-");
   this.MADMedianResidualNode.setToolTip(
      0, "<p>MAD residual equals the mean absolute deviation about the " +
      "median residual of fitted star profiles in data number (DN) units.</p>"
   );
   this.MADMedianResidualNode.setToolTip(
      1, this.MADMedianResidualNode.toolTip(0)
   );

   this.starSupportNode = new TreeBoxNode(this.treeBox);

   this.starSupportNode.setText(0, "Star support");
   this.starSupportNode.setText(1, "-");
   this.starSupportNode.setToolTip(
      0, "<p>Star support equals the number of star profiles fitted.</p>"
   );
   this.starSupportNode.setToolTip(
      1, this.starSupportNode.toolTip(0)
   );

   this.resultsPane.add(this.treeBox);

   this.buttonPane = new HorizontalSizer;

   this.buttonPane.spacing = 6;

   this.resetButton = new ToolButton(this);

   this.resetButton.icon =
      this.scaledResource(":/process-interface/reset.png");
   this.resetButton.setScaledFixedSize(20, 20);
   this.resetButton.toolTip =
      "<p>Resets all settings to default values.</p>";
   this.resetButton.onClick = function() {
      globalReset();
   };

   this.buttonPane.add(this.resetButton);

   this.versionLabel = new Label(this);
   this.versionLabel.text = "Version " + VERSION;
   this.versionLabel.toolTip =
      "<p><b>" + TITLE + " Version " + VERSION + "</b></p>" +
      "<p>Estimates the median full width at half maximim (FWHM) and " +
      "eccentricity of the stars in a view.</p>" +

      "<p>Copyright &copy; 2012-2015 Mike Schuster. All Rights " +
      "Reserved.<br>" +
      "Copyright &copy; 2003-2015 Pleiades Astrophoto S.L. All Rights " +
      "Reserved.</p>";
   this.versionLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;

   this.buttonPane.add(this.versionLabel);
   this.buttonPane.addStretch();

   this.measureButton = new PushButton(this);

   //this.measureButton.text = "Measuring...";
   this.measureButton.text = "Measure";
   this.measureButton.toolTip = "<p>Measures the target view.</p>";
   this.measureButton.onClick = function() {
      globalMeasure();
   };

   this.buttonPane.add(this.measureButton);

   this.saveAsButton = new PushButton(this);

   this.saveAsButton.text = "Save As...";
   this.saveAsButton.toolTip =
      "<p>Save the measurements in a comma separated value file.</p>";
   this.saveAsButton.onClick = function() {
      globalSaveAs();
   };

   this.buttonPane.add(this.saveAsButton);

   this.supportButton = new PushButton(this);

   this.supportButton.text = "Support";
   this.supportButton.toolTip =
      "<p>Generates supporting star and contour images.</p>";
   this.supportButton.onClick = function() {
      globalSupport(this);
   };

   this.buttonPane.add(this.supportButton);

   this.dismissButton = new PushButton(this);

   this.dismissButton.text = "Dismiss";
   this.dismissButton.toolTip = "<p>Dismisses the dialog.</p>";
   this.dismissButton.onClick = function() {
      this.dialog.ok();
   };
   this.dismissButton.defaultButton = true;
   this.dismissButton.hasFocus = true;

   this.buttonPane.add(this.dismissButton);

   this.sizer = new VerticalSizer;

   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add(this.targetPane);
   this.sizer.add(this.settingsPane);
   this.sizer.add(this.resultsPane);
   this.sizer.add(this.buttonPane);

   this.adjustToContents();
   this.setMinWidth(this.width + this.logicalPixelsToPhysical(40));
   this.setFixedHeight();

   parameters.dialog = this;
   globalClear();
}
parametersDialogPrototype.prototype = new Dialog;

function main() {
   console.hide();
   parameters.loadSettings();

   var parametersDialog = new parametersDialogPrototype();
   parametersDialog.execute();

   // Workaround to avoid image window close crash in 1.8 RC7.
   parametersDialog.viewList.currentView =
      parametersDialog.viewListNullCurrentView;

   parameters.storeSettings();
}

main();

// ****************************************************************************
// EOF FWHMEccentricity.js - Released 2015/08/09 00:00:00 UTC
