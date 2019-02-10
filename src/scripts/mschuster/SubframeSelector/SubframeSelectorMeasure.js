// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// SubframeSelectorMeasure.js - Released 2018-11-05T16:53:08Z
// ----------------------------------------------------------------------------
//
// This file is part of SubframeSelector Script version 1.12
//
// Copyright (C) 2012-2018 Mike Schuster. All Rights Reserved.
// Copyright (C) 2003-2018 Pleiades Astrophoto S.L. All Rights Reserved.
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
// ----------------------------------------------------------------------------

#define USE_STAR_DETECTOR true
#define __PJSR_NO_STAR_DETECTOR_TEST_ROUTINES
#include <pjsr/StarDetector.jsh>

function noiseOfImage(image) {
   for (var layer = 4; layer != 1; --layer) {
      var estimate = image.noiseMRS(layer);
      if (estimate[1] >= 0.01 * image.bounds.area) {
         return [estimate[0], estimate[1] / image.bounds.area];
      }
   }
   console.writeln("");
   console.writeln(
      "** Warning: No convergence in MRS noise evaluation routine: ",
      "using k-sigma noise estimate"
   );
   var estimate = image.noiseKSigma();
   return [estimate[0], estimate[1] / image.bounds.area];
}

function meanDeviationOfImageWindow(imageWindow) {
   return imageWindow.mainView.image.avgDev();
}

function medianDeviationOfImageWindow(imageWindow) {
   var pixelMath = new PixelMath;
   with (pixelMath) {
      createNewImage = true;
      newImageId = uniqueViewId(imageWindow.mainView.fullId + "_medianDeviation");
      expression = "abs($target - med($target))";
      rescale = false;
      truncate = false;
      useSingleExpression = true;
   }
   //console.abortEnabled = false;
   pixelMath.executeOn(imageWindow.mainView, false);
   console.abortEnabled = true;

   var medianDeviationImageWindow = ImageWindow.windowById(pixelMath.newImageId);
   if (medianDeviationImageWindow.isNull) {
      console.writeln("");
      console.writeln(
         "*** Error: PixelMath result image not found: ",
         pixelMath.newImageId
      );
      return 0.0;
   }
   medianDeviationImageWindow.hide();
   var medianDeviation = medianDeviationImageWindow.mainView.image.median();
   medianDeviationImageWindow.forceClose();

   return medianDeviation;
}

function starDescription(b, a, x, y, sx, sy, theta, residual) {
   this.b = b;
   this.a = a;
   this.x = x;
   this.y = y;
   this.sx = sx;
   this.sy = sy;
   this.theta = theta;
   this.residual = residual;
}

function starDescriptionCompare(a, b) {
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

function FWHMEccentricityResidualOfStarsImageWindow(imageWindow) {
   var starsViewId = uniqueViewIdNoLeadingZero(imageWindow.mainView.id + "_stars");

   var barycenters = new Array;
   var threshold = 1.0;
   var maximumDetectedStars = 100000;
   if (parameters.upperLimit == 0.0) {
   }
   else if (USE_STAR_DETECTOR) {
      console.writeln();
      console.writeln("<b>StarDetector ", #__PJSR_STAR_DETECTOR_VERSION, "</b>: Processing view: ", imageWindow.mainView.fullId);
      console.flush();
      var startTime = new Date();

      var starDetector = new StarDetector();
      starDetector.structureLayers = parameters.starDetectionLayers;
      starDetector.noiseLayers = Math.min(
         parameters.noiseReductionLayers, parameters.starDetectionLayers - 1
      );
      starDetector.hotPixelFilterRadius = parameters.hotPixelFilterRadius;
      starDetector.applyHotPixelFilterToDetectionImage = parameters.applyHotPixelFilterToDetectionImage;
      starDetector.sensitivity = parameters.starDetectionSensitivity;
      starDetector.peakResponse = parameters.starPeakResponse;
      starDetector.maxDistortion = parameters.maximumStarDistortion;
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
      with (starAlignment) {
         referenceImage = imageWindow.mainView.id;
         referenceIsFile = false;

         mode = StarAlignment.prototype.DrawStars;
         onError = StarAlignment.prototype.Continue;

         structureLayers = parameters.starDetectionLayers;
         noiseLayers = Math.min(
            parameters.noiseReductionLayers, parameters.starDetectionLayers - 1
         );
         hotPixelFilterRadius = parameters.hotPixelFilterRadius;
         sensitivity = parameters.starDetectionSensitivity;
         peakResponse = parameters.starPeakResponse;
         maxStarDistortion = parameters.maximumStarDistortion;
      }
      //console.abortEnabled = false;
      starAlignment.executeOn(imageWindow.mainView);
      console.abortEnabled = true;

      var starsView = View.viewById(starsViewId);
      if (starsView.isNull) {
         console.writeln("");
         console.writeln("*** Error: StarAlignment star map not found: ", starsViewId);
         return [0.0, 0.0, 0];
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
         uniqueViewId(imageWindow.mainView.id + "_barycenters")
      );

      starsImageWindow.createPreview(starsImageWindow.mainView.image.bounds, "_");
      with (barycentersImageWindow.mainView) {
         beginProcess(UndoFlag_NoSwapFile);
         with (image) {
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
            selectedPoint = new Point(0, 0);
            apply(starsImageWindow.previewById("_").image);
            binarize(0.5);
            convolve(new Matrix(barycenterKernel, 11, 11));
            binarize(1.0);
            resetSelections();
         }
         endProcess();
      }
      starsImageWindow.deletePreview(starsImageWindow.previewById("_"));
      starsImageWindow.forceClose();

      var radius = Math.round(0.75 * (new DynamicPSF).searchRadius);
      var barycentersImage = barycentersImageWindow.mainView.image;
      for (;;) {
         for (
            var i = 0;
            i != barycentersImage.width && barycenters.length != maximumDetectedStars;
            ++i
         ) {
            for (
               var j = 0;
               j != barycentersImage.height && barycenters.length != maximumDetectedStars;
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
   //   console.writeln("");
   //   console.writeln("** Warning: excessive number of detected stars");
   //}

   var dynamicPSF = new DynamicPSF;
   with (dynamicPSF) {
      autoPSF = false;
      circularPSF = parameters.circularModel;
      gaussianPSF = parameters.modelFunction == 0;
      moffatPSF = false;
      moffat10PSF = parameters.modelFunction == 1;
      moffat8PSF = parameters.modelFunction == 2;
      moffat6PSF = parameters.modelFunction == 3;
      moffat4PSF = parameters.modelFunction == 4;
      moffat25PSF = parameters.modelFunction == 5;
      moffat15PSF = parameters.modelFunction == 6;
      lorentzianPSF = parameters.modelFunction == 7;
      regenerate = true;
   }

   var views = new Array;
   views.push(new Array(imageWindow.mainView.id));
   dynamicPSF.views = views;

   var radius = Math.round(1.5 * dynamicPSF.searchRadius);
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

   //console.abortEnabled = false;
   // Workaround for 1195 Win 7 DynamicPSF failure on images with clipped backgrounds
   if (imageWindow.mainView.image.median() != 0) {
      dynamicPSF.executeGlobal();
   }
   else {
      console.writeln("0 PSF fittings");
   }
   console.abortEnabled = true;

   #define DYNAMICPSF_PSF_StarIndex 0
   #define DYNAMICPSF_PSF_Status 3
   #define DYNAMICPSF_PSF_b 4
   #define DYNAMICPSF_PSF_a 5
   #define DYNAMICPSF_PSF_cx 6
   #define DYNAMICPSF_PSF_cy 7
   #define DYNAMICPSF_PSF_sx 8
   #define DYNAMICPSF_PSF_sy 9
   #define DYNAMICPSF_PSF_theta 10
   #define DYNAMICPSF_PSF_mad 12

   var starDescriptions = new Array;
   var psfTable = dynamicPSF.psf;
   var starsTable = dynamicPSF.stars;
   for (var i = 0; i != psfTable.length; ++i) {
      var psfRow = psfTable[i];
      if (
         psfRow[DYNAMICPSF_PSF_Status] == DynamicPSF.prototype.PSF_FittedOk &&
         psfRow[DYNAMICPSF_PSF_mad] < parameters.maxPSFMAD &&
         !fitted[psfRow[DYNAMICPSF_PSF_StarIndex]]
      ) {
         var starsRow = starsTable[psfRow[DYNAMICPSF_PSF_StarIndex]];
         starDescriptions.push(new starDescription(
            psfRow[DYNAMICPSF_PSF_b],
            psfRow[DYNAMICPSF_PSF_a],
            psfRow[DYNAMICPSF_PSF_cx],
            psfRow[DYNAMICPSF_PSF_cy],
            psfRow[DYNAMICPSF_PSF_sx],
            psfRow[DYNAMICPSF_PSF_sy],
            psfRow[DYNAMICPSF_PSF_theta],
            psfRow[DYNAMICPSF_PSF_mad]
         ));
         fitted[psfRow[DYNAMICPSF_PSF_StarIndex]] = true;
      }
   }
   starDescriptions = uniqueArray(starDescriptions, starDescriptionCompare);

   var FWHMs = [];
   var eccentricities = [];
   var residuals = [];
   for (var i = 0; i != starDescriptions.length; ++i) {
      var description = starDescriptions[i];
      FWHMs.push(Math.sqrt(description.sx * description.sy));
      eccentricities.push(
         Math.sqrt(1.0 - Math.pow(description.sy / description.sx, 2.0))
      );
      residuals.push(description.residual);
   }

   return [
      medianMeanDeviationOfArray(FWHMs),
      medianMeanDeviationOfArray(eccentricities),
      medianMeanDeviationOfArray(residuals),
      starDescriptions
   ];
}

// ----------------------------------------------------------------------------
// EOF SubframeSelectorMeasure.js - Released 2018-11-05T16:53:08Z
