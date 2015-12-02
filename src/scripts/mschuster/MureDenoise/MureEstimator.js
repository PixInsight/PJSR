// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// MureEstimator.js - Released 2015/12/04 00:00:00 UTC
// ****************************************************************************
//
// This file is part of MureDenoise Script Version 1.14
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

function MureEstimator(model, view) {
   // Random seed for cycle spin location generation.
   this.cycleSpinRandomSeed = [967133899, 2024758679];

   // Locations to log.
   this.logLocations = [
      // new Point(x, y), ...
   ];

   // Gives padded and shifted locations to log.
   this.padShiftLogLocations = function(
      logLocations, pad, shiftRows, shiftCols
   ) {
      var locations = new Array(logLocations.length);
      for (var i = 0; i != locations.length; ++i) {
         locations[i] = new Point(
            logLocations[i].x + pad + shiftCols,
            logLocations[i].y + pad + shiftRows
         );
      }

      return locations;
   };

   // Gives levels of refinement as a function of image size.
   this.generateLevelsOfRefinement = function() {
      return 5;
   };

   // Gives randomized cycle spin locations as a function of levels of
   // refinement and cycle spin count.
   this.generateCycleSpinLocations = function(
      levelsOfRefinement, cycleSpinCount, cycleSpinRandomSeed
   ) {
      // Gives a random integer in the range [0, size].
      function randomInteger(size) {
         return Math.min(size, Math.floor((size + 1) * Math.random()));
      }

      // Gives the minimum distance between point and locations.
      function poissonDiskDistance(point, locations) {
         var distance = Infinity;
         for (var i = 0; i != locations.length; ++i) {
            var dx = point.x - locations[i].x;
            var dy = point.y - locations[i].y;

            distance = Math.min(distance, Math.sqrt(dx * dx + dy * dy));
         }

         return distance;
      }

      // Gives Poisson disk locations given domain size, desired count, and
      // radius.
      function poissonDiskLocations(size, count, radius) {
         var active = new Array();
         var locations = new Array();

         locations.push(new Point(
            randomInteger(size - 1), randomInteger(size - 1)
         ));
         active.push(locations.length - 1);

         for (; active.length != 0 && locations.length < count;) {
            var index = randomInteger(active.length - 1);
            var value = active[active.length - 1];
            active[active.length - 1] = active[index];
            active[index] = value;

            var center = locations[active[active.length - 1]];

            var samples = 64;
            for (var sample = 0; sample != samples; ++sample) {
               var theta = 2 * Math.PI * Math.random();
               var delta = radius * (Math.random() + 1);
               var point = new Point(
                  center.x + Math.round(delta * Math.cos(theta)),
                  center.y + Math.round(delta * Math.sin(theta))
               );
               if (point.x < 0 || size <= point.x) {
                  continue;
               }
               if (point.y < 0 || size <= point.y) {
                  continue;
               }
               if (poissonDiskDistance(point, locations) < radius) {
                  continue;
               }
               break;
            }

            if (sample == samples) {
               active = active.slice(0, active.length - 1);
            }
            else {
               locations.push(point);
               active.push(locations.length - 1);
            }
         }

         return locations;
      }

      Math.initRandomGenerator(cycleSpinRandomSeed);

      var size = Math.round(Math.pow2(levelsOfRefinement));
      var radius = 0.9 * (size - 1) / Math.sqrt(cycleSpinCount);
      var locations = poissonDiskLocations(size, cycleSpinCount, radius);

      for (var i = 0; i != 4 && locations.length < cycleSpinCount; ++i) {
         if ((i % 2) == 1) {
            radius *= 0.95;
         }
         locations = poissonDiskLocations(size, cycleSpinCount, radius);
      }

      return locations.slice(0, Math.min(locations.length, cycleSpinCount));
   };

   // Gives alpha threshold coefficients as a function of detail coefficients
   // d, coarse coefficients c, gradient coefficients p, and standard
   // deviation of Gaussian noise s.
   this.alphaThresholds = function(d, c, p, s) {
      var dm = d.matrix();
      var cm = c.matrix();
      var pm = p.matrix();
      var s2 = s * s;

      var rows = dm.rows;
      var cols = dm.cols;
      var r = new Matrix(rows * cols, 3);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var dv = dm.at(row, col);
            var cv = cm.at(row, col);
            var pv = pm.at(row, col);

            var tcs2 = Math.tanh(100 * cv) * cv + s2;

            var t1 = dv;
            var t2 = (1 - Math.exp(-dv * dv / (12 * tcs2))) * dv;
            var t3 = pv;

            var elm = row * cols + col;
            r.at(elm, 0, t1);
            r.at(elm, 1, t2);
            r.at(elm, 2, t3);
          }
      }

      return new FrameMatrix(r);
   };

   // Gives beta threshold coefficients as a function of detail coefficients
   // d, coarse coefficients c, gradient coefficients p, and standard
   // deviation of Gaussian noise s.
   this.betaThresholds = function(d, c, p, s) {
      var dm = d.matrix();
      var cm = c.matrix();
      var pm = p.matrix();
      var s2 = s * s;

      var rows = dm.rows;
      var cols = dm.cols;
      var t1 = 0;
      var t2 = 0;
      var t3 = 0;
      var r = new Matrix(3, 1);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var dv = dm.at(row, col);
            var cv = cm.at(row, col);
            var pv = pm.at(row, col);

            var dvm1 = dv - 1;
            var dvp1 = dv + 1;
            var cvm1 = cv - 1;
            var cvp1 = cv + 1;
            var tcm1 = Math.tanh(100 * cvm1);
            var tcp1 = Math.tanh(100 * cvp1);
            var scm1 = 1 / Math.cosh(100 * cvm1);
            var scp1 = 1 / Math.cosh(100 * cvp1);
            var tcm1s2 = cvm1 * tcm1 + s2;
            var tcp1s2 = cvp1 * tcp1 + s2;
            var etcm1s2 = Math.exp(-dvm1 * dvm1 / (12 * tcm1s2));
            var etcp1s2 = Math.exp(-dvp1 * dvp1 / (12 * tcp1s2));
            var stcm1 = 100 * cvm1 * scm1 * scm1 + tcm1;
            var stcp1 = 100 * cvp1 * scp1 * scp1 + tcp1;

            t1 += dv * dv - cv - s2;
            t2 +=
               0.5 * (
                  (dv + cv) * dvm1 * (1 - etcm1s2) +
                  (dv - cv) * dvp1 * (1 - etcp1s2)
               ) -
               0.5 * (
                  2 - etcm1s2 - etcp1s2 +
                  (2 * dvm1 * dvm1 * etcm1s2) / (12 * tcm1s2) +
                  (2 * dvp1 * dvp1 * etcp1s2) / (12 * tcp1s2) -
                  (dvm1 * dvm1 * dvm1 * etcm1s2 * stcm1) /
                     (12 * tcm1s2 * tcm1s2) +
                  (dvp1 * dvp1 * dvp1 * etcp1s2 * stcp1) /
                     (12 * tcp1s2 * tcp1s2)
               ) * s2;
            t3 += dv * pv;
         }
      }
      r.at(0, 0, t1);
      r.at(1, 0, t2);
      r.at(2, 0, t3);

      return new FrameMatrix(r);
   };

   // Logs denoise image information.
   this.logDenoiseImage = function(
      levelsOfRefinement,
      level,
      locations,
      vw,
      hw,
      dw,
      c1,
      v1,
      h1,
      d1,
      c2,
      v2,
      h2,
      d2,
      vp,
      hp,
      dp,
      gaussianNoise
   ) {
      console.writeln(format("logDenoiseImage%d = {", level));
      console.writeln(format("{\"image\", \"%s\"},", model.imageView.fullId));
      console.writeln(format("{\"level\", %d},", level));

      console.write(format("{\"vw\", "));
      for (var row = 0; row != vw.matrix().rows; ++row) {
         console.write(format("%.6e%s",
            vw.matrix().at(row, 0), row == vw.matrix().rows - 1 ? "" : ", "
         ).replace(/e/g, "*^"));
      }
      console.writeln(format("},"));

      console.write(format("{\"hw\", "));
      for (var row = 0; row != hw.matrix().rows; ++row) {
         console.write(format("%.6e%s",
            hw.matrix().at(row, 0), row == hw.matrix().rows - 1 ? "" : ", "
         ).replace(/e/g, "*^"));
      }
      console.writeln(format("},"));

      console.write(format("{\"dw\", "));
      for (var row = 0; row != dw.matrix().rows; ++row) {
         console.write(format("%.6e%s",
            dw.matrix().at(row, 0), row == dw.matrix().rows - 1 ? "" : ", "
         ).replace(/e/g, "*^"));
      }
      console.writeln(format("},"));

      console.writeln(format("{"));
      for (var i = 0; i != locations.length; ++i) {
         var row0 = locations[i].y;
         var col0 = locations[i].x;
         var row = Math.floor(locations[i].y / Math.round(Math.pow2(level)));
         var col = Math.floor(locations[i].x / Math.round(Math.pow2(level)));
         console.writeln(format("{"));

         console.writeln(format("{\"location\", %d, %d},", col0, row0));
         console.writeln(format("{\"position\", %d, %d},", col, row));

         var c1p = c1.matrix().at(row, col);
         var v1p = v1.matrix().at(row, col);
         var h1p = h1.matrix().at(row, col);
         var d1p = d1.matrix().at(row, col);
         console.writeln(format(
            "{\"c1v1h1d1\", %.3f, %.3f, %.3f, %.3f},", c1p, v1p, h1p, d1p
         ).replace(/e/g, "*^"));

         var c2p = c2.matrix().at(row, col);
         var v2p = v2.matrix().at(row, col);
         var h2p = h2.matrix().at(row, col);
         var d2p = d2.matrix().at(row, col);
         console.writeln(format(
            "{\"c2v2h2p2\", %.3f, %.3f, %.3f, %.3f},", c2p, v2p, h2p, d2p
         ).replace(/e/g, "*^"));

         var vpp = vp.matrix().at(row, col);
         var hpp = hp.matrix().at(row, col);
         var dpp = dp.matrix().at(row, col);
         console.writeln(format(
            "{\"vphpdp\", %.3f, %.3f, %.3f},", vpp, hpp, dpp
         ).replace(/e/g, "*^"));

         console.writeln(format(
            "{\"noisE\", %.3f},", gaussianNoise
         ).replace(/e/g, "*^"));

         console.writeln(format(
            "{\"v1c1vpfnoisE\", %.3f, %.3f, %.3f, %.3f},",
            v1p, c1p, vpp, gaussianNoise
         ).replace(/e/g, "*^"));

         console.writeln(format(
            "{\"h1c1hpfnoisE\", %.3f, %.3f, %.3f, %.3f},",
            h1p, c1p, hpp, gaussianNoise
         ).replace(/e/g, "*^"));

         console.writeln(format(
            "{\"d1c1dpfnoisE\", %.3f, %.3f, %.3f, %.3f}",
            d1p, c1p, dpp, gaussianNoise
         ).replace(/e/g, "*^"));

         console.writeln(format("}%s", i == locations.length - 1 ? "" : ", "));
      }
      console.writeln(format("}"));

      console.writeln(format("};"));
      console.flush();
   };

   // Denoises the image.
   this.denoiseImage = function(
      image, gaussianNoise, levelsOfRefinement, level, locations
   ) {
      var imageDecompose = image.unnormalizedHaarDecompose();
      view.throwAbort();

      var s = imageDecompose[0];
      var c1 = imageDecompose[1];
      var v1 = imageDecompose[2];
      var h1 = imageDecompose[3];
      var d1 = imageDecompose[4];
      view.throwAbort();

      {
         var vp = c1.filterColumns([-1, 0, 1]);
         var hp = c1.filterRows([-1, 0, 1]);
         var dp = hp.filterColumns([-1, 0, 1]);
         view.throwAbort();

         var vat = this.alphaThresholds(v1, c1, vp, 2 * gaussianNoise);
         var hat = this.alphaThresholds(h1, c1, hp, 2 * gaussianNoise);
         var dat = this.alphaThresholds(d1, c1, dp, 2 * gaussianNoise);
         view.throwAbort();

         var vbt = this.betaThresholds(v1, c1, vp, 2 * gaussianNoise);
         var hbt = this.betaThresholds(h1, c1, hp, 2 * gaussianNoise);
         var dbt = this.betaThresholds(d1, c1, dp, 2 * gaussianNoise);
         view.throwAbort();
      }

      {
         var vatt = vat.transpose();
         var hatt = hat.transpose();
         var datt = dat.transpose();
         view.throwAbort();

         var vtm = vatt.productFrame(vat);
         var htm = hatt.productFrame(hat);
         var dtm = datt.productFrame(dat);
         view.throwAbort();

         vatt.clear();
         hatt.clear();
         datt.clear();
      }

      {
         var vtmi = vtm.pseudoInverse(1);
         var htmi = htm.pseudoInverse(1);
         var dtmi = dtm.pseudoInverse(1);
         view.throwAbort();

         vtm.clear();
         htm.clear();
         dtm.clear();

         var vw = vtmi.productFrame(vbt);
         var hw = htmi.productFrame(hbt);
         var dw = dtmi.productFrame(dbt);
         view.throwAbort();

         vtmi.clear();
         htmi.clear();
         dtmi.clear();

         vbt.clear();
         hbt.clear();
         dbt.clear();
      }

      {
         var v2m = vat.productFrame(vw);
         var h2m = hat.productFrame(hw);
         var d2m = dat.productFrame(dw);
         view.throwAbort();

         vat.clear();
         hat.clear();
         dat.clear();

         var v2 = v2m.reshape(v1.matrix().rows, v1.matrix().cols);
         var h2 = h2m.reshape(h1.matrix().rows, h1.matrix().cols);
         var d2 = d2m.reshape(d1.matrix().rows, d1.matrix().cols);
         view.throwAbort();

         v2m.clear();
         h2m.clear();
         d2m.clear();
      }

      {
         if (level == levelsOfRefinement) {
            var c2 = c1.clone();
         }
         else {
            var c2 = this.denoiseImage(
               c1,
               2 * gaussianNoise,
               levelsOfRefinement,
               level + 1,
               locations
            );
         }
         view.throwAbort();

         var reconstruct =
            s.unnormalizedHaarReconstruct([s, c2, v2, h2, d2]);
         view.throwAbort();

         if (locations.length != 0) {
            this.logDenoiseImage(
               levelsOfRefinement,
               level,
               locations,
               vw,
               hw,
               dw,
               c1,
               v1,
               h1,
               d1,
               c2,
               v2,
               h2,
               d2,
               vp,
               hp,
               dp,
               2 * gaussianNoise
            );
         }

         vw.clear();
         hw.clear();
         dw.clear();

         c1.clear();
         v1.clear();
         h1.clear();
         d1.clear();

         vp.clear();
         hp.clear();
         dp.clear();

         c2.clear();
         v2.clear();
         h2.clear();
         d2.clear();

         s.clear();
      }

      return reconstruct;
   };

   // Performs one cycle-spin of denoising.
   this.denoiseCycleSpin = function(
      flatfield, cycleSpinLocation, levelsOfRefinement
   ) {
      var baseGain = model.baseGain();
      var baseGaussianNoise = model.baseGaussianNoise();
      var baseOffset = model.baseOffset();
      var pad = 2 * Math.round(Math.pow2(levelsOfRefinement));

      var self = this;
      var image = (
         new FrameMatrix(model.imageView.image.toMatrix())
      ).pipeline([
         flatfield == null ? null :
            function(frame) {
               return frame.multiplyFrame(flatfield);
            },
         function(frame) {
            return frame.fusedMultiplyAddScalar(
               65535 * baseGain, -baseGain * baseOffset
            );
         },
         function(frame) {
            return frame.fusedPadShift(
               pad, cycleSpinLocation.x, cycleSpinLocation.y
            );
         },

         function(frame) {
            view.throwAbort();
            return self.denoiseImage(
               frame,
               baseGain * baseGaussianNoise,
               levelsOfRefinement,
               1,
               self.padShiftLogLocations(
                  self.logLocations,
                  pad,
                  cycleSpinLocation.x,
                  cycleSpinLocation.y
               )
           );
         },

         function(frame) {
            return frame.fusedShiftPad(
               -cycleSpinLocation.x, -cycleSpinLocation.y, -pad
            );
         },
         function(frame) {
            return frame.fusedAddMultiplyScalar(
               baseGain * baseOffset, 1 / (65535 * baseGain)
            );
         },
         flatfield == null ? null :
            function(frame) {
               return frame.divideFrame(flatfield);
            }
      ]);

      if (!image.isFinite()) {
         throw new Error(
            "The denoise process did not find a representable result"
         );
      }

      return image;
   };

   // Generates the method noise image.
   this.generateMethodNoiseImage = function(estimate) {
      return (
         new FrameMatrix(model.imageView.image.toMatrix())
      ).pipeline([
         function(frame) {
            return frame.subtractFrame(estimate);
         },
         function(frame) {
            return frame.addScalar(0.5);
         },
         function(frame) {
            return frame.truncate(0, 1);
         }
      ]);
   };

   // Gives a display function as a function of midtone, shadow, and highlight.
   this.generateDisplayFunction = function(midtone, shadow, highlight) {
      return [
         [midtone, shadow, highlight, 0, 1],
         [midtone, shadow, highlight, 0, 1],
         [midtone, shadow, highlight, 0, 1],
         [midtone, shadow, highlight, 0, 1]
      ];
   };

   // Generates the method noise image window.
   this.generateMethodNoiseImageWindow = function(methodNoise) {
      var imageWindow =
         methodNoise.toImageWindow(model.imageView.fullId + "_method_noise");

      var quantiles = methodNoise.histogramQuantiles(
         model.generateMethodNoiseImageQuantileResolution,
         model.generateMethodNoiseImageQuantileLow,
         model.generateMethodNoiseImageQuantileHigh
      );
      imageWindow.mainView.stf = this.generateDisplayFunction(
         0.5, quantiles[0], quantiles[1]
      );

      imageWindow.show();

      return imageWindow;
   };

   // Logs the base parameters.
   this.logBaseParameters = function() {
      var baseGain = model.baseGain();
      console.writeln(format(
         "Base gain: " + model.detectorGainFormat +
         " " + model.detectorGainUnits,
         baseGain
      ));

      var baseGaussianNoise = model.baseGaussianNoise();
      console.writeln(format(
         "Base Gaussian noise: " + model.detectorGaussianNoiseFormat +
         " " + model.detectorGaussianNoiseUnits,
         baseGaussianNoise
      ));

      var baseOffset = model.baseOffset();
      console.writeln(format(
         "Base offset: " + model.detectorOffsetFormat +
         " " + model.detectorOffsetUnits,
         baseOffset
      ));

      console.flush();
   };

   // Logs the method noise.
   this.logMethodNoise = function(methodNoise) {
      var methodNoiseStdDev = methodNoise.matrix().stdDev();
      console.writeln(format(
         "Method noise: " + model.detectorGaussianNoiseFormat +
         " " + model.detectorGaussianNoiseUnits,
         65535 * methodNoiseStdDev
      ));
      console.flush();
   };

   // Assigns the estimate.
   this.assignEstimate = function(estimate) {
      var estimateImage = estimate.matrix().toImage();
      model.imageView.beginProcess();
      model.imageView.image.assign(estimateImage);
      model.imageView.endProcess();
      estimateImage.free();
   };

   // Generates the smooth flatfield.
   this.generateSmoothFlatfield = function() {
      var flatfield = null;
      if (model.flatfieldView != null && model.flatfieldView.isView) {
         var image = new Image(model.flatfieldView.image);

         var layers = [];
         for (
            var layer = 0;
            layer != model.smoothFlatfieldLayerCount + 1;
            ++layer
         ) {
            layers.push([
               layer == model.smoothFlatfieldLayerCount,
               true, 0.000, false, 3.000, 1.00, 1
            ]);
         }

         var MLT = new MultiscaleLinearTransform;
         MLT.layers = layers;
         MLT.transform =
            MultiscaleLinearTransform.prototype.MultiscaleLinearTransform;
         MLT.executeOn(image);

         var flatfield = (new FrameMatrix(image.toMatrix())).pipeline([
            function(frame) {
               return frame.multiplyScalar(1 / frame.matrix().mean());
            }
         ]);

         image.free();
      }

      return flatfield;
   };

   // Logs the smooth flatfield scale.
   this.logSmoothFlatfieldScale = function(flatfield) {
      var flatfieldStdDev = flatfield.matrix().stdDev();
      console.writeln(format(
         "Flatfield scale: " + model.flatfieldScaleFormat +
         " " + model.flatfieldScaleUnits,
         model.flatfieldScaleNormalization * flatfieldStdDev
      ));
      console.flush();
   };

   // Denoises the image.
   this.denoise = function() {
      if (model.flatfieldView != null && model.flatfieldView.isView) {
         console.writeln();
         console.writeln(format(
            "<b>Smooth:</b> Processing view: " + model.flatfieldViewFormat,
            model.flatfieldView.fullId
         ));
         console.flush();
      }

      var flatfield = this.generateSmoothFlatfield();

      if (flatfield != null) {
         this.logSmoothFlatfieldScale(flatfield);
      }

      console.writeln();
      console.writeln(format(
         "<b>Denoise:</b> Processing view: " + model.imageViewFormat,
         model.imageView.fullId
      ));
      console.flush();

      // this.logBaseParameters();

      var levelsOfRefinement = this.generateLevelsOfRefinement();
      var cycleSpinCount = model.denoiseCycleSpinCount;
      var cycleSpinLocations = this.generateCycleSpinLocations(
         levelsOfRefinement, cycleSpinCount, this.cycleSpinRandomSeed
      );

      var estimate = new FrameMatrix(new Matrix(
         0, model.imageView.image.height, model.imageView.image.width
      ));

      for (var i = 0; i != cycleSpinLocations.length; ++i) {
         console.writeln(format(
            "Cycle-spin: " + model.denoiseCycleSpinCountFormat,
            i + 1
         ));
         console.flush();

         var addition = this.denoiseCycleSpin(
            flatfield, cycleSpinLocations[i], levelsOfRefinement
         );
         estimate = estimate.pipeline([
            function(frame) {
               return frame.addFrame(addition);
            }
         ]);
         addition.clear();
         view.throwAbort();
      }

      estimate = estimate.pipeline([
         function(frame) {
            return frame.multiplyScalar(1 / cycleSpinLocations.length);
         },
         function(frame) {
            return frame.truncate(0, 1);
         }
      ]);

      if (!estimate.isFinite()) {
         throw new Error(
            "The denoise process did not find a representable result"
         );
      }

      if (model.generateMethodNoiseImage) {
         var self = this;
         (this.generateMethodNoiseImage(estimate)).pipeline([
            function(frame) {
               self.logMethodNoise(frame);

               return self.generateMethodNoiseImageWindow(frame);
            }
         ]);
      }

      this.assignEstimate(estimate);
      estimate.clear();

      if (flatfield != null) {
         flatfield.clear();
      }
   };
};

// ****************************************************************************
// EOF MureEstimator.js - Released 2015/12/04 00:00:00 UTC
