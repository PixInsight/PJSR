// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// FlatSNREstimator.js - Released 2015/12/02 00:00:00 UTC
// ****************************************************************************
//
// This file is part of FlatSNREstimator Script version 1.4
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

#define TITLE "FlatSNREstimator"
#define VERSION "1.4"

#feature-id Image Analysis > FlatSNREstimator

#feature-info <b>FlatSNREstimator Version 1.4</b><br/>\
   <br/>\
   This script estimates the signal to temporal noise ratio and \
   gain of flat subframes or integrations.<br/>\
   <br/>\
   Copyright &copy; 2012-2015 Mike Schuster. All Rights Reserved.<br/>\
   Copyright &copy; 2003-2015 Pleiades Astrophoto S.L. All Rights Reserved.

#include <pjsr/DataType.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/UndoFlag.jsh>

function defaultNullMinMaxValue(value, min, max, def) {
   return value != null && !isNaN(value) && value >= min && value <= max ?
      value : def;
}

function uniqueViewId(baseId) {
   var id = baseId;
   for (var i = 1; !View.viewById(id).isNull; ++i) {
      id = baseId + format("_%d", i);
   }
   return id;
}

function Pair(first, last) {
   this.first = first;
   this.last = last;
}

/*!
 * Returns the Sn scale estimator of Rousseeuw and Croux:
 *
 * Sn = c * low_median( high_median( |x_i - x_j| ) )
 *
 * where low_median() is the order statistic of rank (n + 1)/2, and
 * high_median() is the order statistic of rank n/2 + 1.
 *
 * For vectors with less than two components, this function returns zero.
 *
 * The constant c = 1.1926 must be used to make the Sn estimator converge to
 * the standard deviation of a pure normal distribution. However, this
 * implementation does not apply it (it uses c=1 implicitly), for
 * consistency with other implementations of scale estimators.
 *
 * This implementation includes finite sample corrections, which can be
 * significant for relatively small vector lengths.
 *
 * \b References
 *
 * P.J. Rousseeuw and C. Croux (1993), <em>Alternatives to the Median Absolute
 * Deviation,</em> Journal of the American Statistical Association, Vol. 88,
 * pp. 1273-1283.
 *
 * C. Croux and P.J. Rousseeuw (1992), <em>Time-Efficient Algorithms for Two
 * Highly Robust Estimators of Scale, Computational Statistics, Vol. 1,
 * pp. 411-428.
 */
function Sn(x1) {
   var x = x1.slice(0, x1.length);
   x.sort(function(a, b) {return a - b;});

   var n = x.length;
   if (n < 2) {
      return 0;
   }

   var y = new Array(n);
   y[0] = x[n >> 1] - x[0];

   for (var i = 2; i <= (n + 1) >> 1; ++i) {
      var nA = i - 1;
      var nB = n - i;
      var diff = nB - nA;
      var leftA = 1;
      var leftB = 1;
      var rightA = nB;
      var rightB = nB;
      var Amin = (diff >> 1) + 1;
      var Amax = (diff >> 1) + nA;

      while (leftA < rightA) {
         var length = rightA - leftA + 1;
         var even = 1 - (length & 1);
         var half = (length - 1) >> 1;
         var tryA = leftA + half;
         var tryB = leftB + half;

         if (tryA < Amin) {
            rightB = tryB;
            leftA = tryA + even;
         }
         else {
            if (tryA > Amax) {
               rightA = tryA;
               leftB = tryB + even;
            }
            else {
               var medA = x[i - 1] - x[i - tryA + Amin - 2];
               var medB = x[tryB + i - 1] - x[i - 1];
               if (medA >= medB) {
                  rightA = tryA;
                  leftB = tryB + even;
               }
               else {
                  rightB = tryB;
                  leftA = tryA + even;
               }
            }
         }
      }
      if (leftA > Amax) {
         y[i - 1] = x[leftB + i - 1] - x[i - 1];
      }
      else {
         var medA = x[i - 1] - x[i - leftA + Amin - 2];
         var medB = x[leftB + i - 1] - x[i - 1];
         y[i - 1] = medA < medB ? medA : medB;
      }
   }

   for (var i = ((n + 1) >> 1) + 1; i <= n - 1; ++i) {
      var nA = n - i;
      var nB = i - 1;
      var diff = nB - nA;
      var leftA = 1;
      var leftB = 1;
      var rightA = nB;
      var rightB = nB;
      var Amin = (diff >> 1) + 1;
      var Amax = (diff >> 1) + nA;

      while (leftA < rightA) {
         var length = rightA - leftA + 1;
         var even = 1 - (length & 1);
         var half = (length - 1) >> 1;
         var tryA = leftA + half;
         var tryB = leftB + half;

         if (tryA < Amin) {
            rightB = tryB;
            leftA = tryA + even;
         }
         else {
            if (tryA > Amax) {
               rightA = tryA;
               leftB = tryB + even;
            }
            else {
               var medA = x[i + tryA - Amin] - x[i - 1];
               var medB = x[i - 1] - x[i - tryB - 1];
               if (medA >= medB) {
                  rightA = tryA;
                  leftB = tryB + even;
               }
               else {
                  rightB = tryB;
                  leftA = tryA + even;
               }
            }
         }
      }
      if (leftA > Amax) {
         y[i - 1] = x[i - 1] - x[i - leftB - 1];
      }
      else {
         var medA = x[i + leftA - Amin] - x[i - 1];
         var medB = x[i - 1] - x[i - leftB - 1];
         y[i - 1] = medA < medB ? medA : medB;
      }
   }

   y[n - 1] = x[n - 1] - x[((n + 1) >> 1) - 1];

   var cn;
   switch (n) {
      case  2: cn = 0.743; break;
      case  3: cn = 1.851; break;
      case  4: cn = 0.954; break;
      case  5: cn = 1.351; break;
      case  6: cn = 0.993; break;
      case  7: cn = 1.198; break;
      case  8: cn = 1.005; break;
      case  9: cn = 1.131; break;
      default: cn = (n & 1) ? n / (n - 0.9) : 1.0; break;
   }

   return cn * Math.select(((n + 1) >> 1) - 1, y);
}

function signalNoiseEstimatorPrototype() {
   this.abort = null;

   this.blockSize = 8;
   this.normalization = 1.1926;
   // this.normalization = 1.0 / 0.9948;
   this.cycleSpins = new Array(
      new Pair(new Point(0, 0), "1"),
      new Pair(new Point(4, 4), "2"),
      new Pair(new Point(0, 4), "3"),
      new Pair(new Point(4, 0), "4")
   );

   this.quantileLow = 0.0;
   this.quantileHigh = 1.0;

   this.blocksOfImageCycleSpin = function(image, cycleSpin) {
      var minY = cycleSpin.first.y;
      var maxY = cycleSpin.first.y +
         this.blockSize *
         Math.floor((image.height - cycleSpin.first.y) / this.blockSize);
      var minX = cycleSpin.first.x;
      var maxX = cycleSpin.first.x +
         this.blockSize *
         Math.floor((image.width - cycleSpin.first.x) / this.blockSize);

      image.statusEnabled = true;
      image.initializeStatus("Cycle-spin " + cycleSpin.last, maxY - minY);
      try {
         var blocks = new Array();
         var vector = new Vector(this.blockSize * this.blockSize);
         for (var y = minY; y != maxY; y += this.blockSize) {
            for (var x = minX; x != maxX; x += this.blockSize) {
               var block = new Array();
               image.getSamples(
                  block,
                  new Rect(
                     x, y,
                     x + this.blockSize, y + this.blockSize
                  ),
                  0
               );
               vector.assign(block, 0, this.blockSize * this.blockSize);
               blocks.push(
                  new Pair(
                     new Pair(vector.median(), Sn(block)), // ? vector.Sn()),
                     // new Pair(vector.mean(), vector.stdDev()),
                     new Point(x, y)
                  )
               );
            }
            image.advanceStatus(this.blockSize);
            this.abort.throwAbort();
         }
      }
      finally {
         image.completeStatus();
      }

      return blocks;
   }

   this.signalNoiseOfImagesCycleSpin = function(
      signalImage, noiseImage, cycleSpin
   ) {
      if (
         Math.min(signalImage.width, signalImage.height) <
         2 * this.blockSize
      ) {
         return new Pair(0.0, 0.0);
      }

      if (noiseImage != null) {
         var signalBlocks = this.blocksOfImageCycleSpin(
            signalImage, new Pair(cycleSpin.first, cycleSpin.last + ".1")
         );
         var noiseBlocks = this.blocksOfImageCycleSpin(
            noiseImage, new Pair(cycleSpin.first, cycleSpin.last + ".2")
         );

         var signalNoiseBlocks = new Array();
         for (var i = 0; i != signalBlocks.length; ++i) {
            signalNoiseBlocks.push(
               new Pair(
                  new Pair(signalBlocks[i].first.first, noiseBlocks[i].first.last),
                  signalBlocks[i].last
               )
            );
         }
      }
      else {
         var signalNoiseBlocks = this.blocksOfImageCycleSpin(signalImage, cycleSpin);
      }
      signalNoiseBlocks.sort(function (a, b) {return a.first.first - b.first.first;});

      var thresholdLow = Math.round(this.quantileLow * (signalNoiseBlocks.length - 1));
      var thresholdHigh = Math.round(this.quantileHigh * (signalNoiseBlocks.length - 1));

      var signals = new Array();
      var noises = new Array();
      for (var i = thresholdLow; i != thresholdHigh + 1; ++i) {
         signals.push(signalNoiseBlocks[i].first.first);
         noises.push(signalNoiseBlocks[i].first.last);
      }
      var signalsVector = new Vector(signals.length);
      signalsVector.assign(signals, 0, signals.length);
      var noisesVector = new Vector(noises.length);
      noisesVector.assign(noises, 0, signals.length);

      return new Pair(
         signalsVector.median(),
         this.normalization * noisesVector.median()
      );
   }

   this.signalNoiseOfImages = function(
      signalImage, noiseImage
   ) {
      var signals = new Array;
      var noises = new Array;

      for (var i = 0; i != this.cycleSpins.length; ++i) {
         var signalNoise = this.signalNoiseOfImagesCycleSpin(
            signalImage,
            noiseImage,
            this.cycleSpins[i]
         );
         signals.push(signalNoise.first);
         noises.push(signalNoise.last);
         gc();
      }
      var signalsVector = new Vector(signals.length);
      signalsVector.assign(signals, 0, signals.length);
      var noisesVector = new Vector(noises.length);
      noisesVector.assign(noises, 0, signals.length);

      return new Pair(signalsVector.mean(), noisesVector.mean());
   }
   this.foregroundMaskOfImagesCycleSpin = function(
      signalImage, noiseImage, foregroundMask, cycleSpin
   ) {
      if (
         Math.min(signalImage.width, signalImage.height) <
         2 * this.blockSize
      ) {
         return;
      }

      if (noiseImage != null) {
         var signalBlocks = this.blocksOfImageCycleSpin(
            signalImage, new Pair(cycleSpin.first, cycleSpin.last + ".1")
         );
         var noiseBlocks = this.blocksOfImageCycleSpin(
            noiseImage, new Pair(cycleSpin.first, cycleSpin.last + ".2")
         );

         var signalNoiseBlocks = new Array();
         for (var i = 0; i != signalBlocks.length; ++i) {
            signalNoiseBlocks.push(
               new Pair(
                  new Pair(signalBlocks[i].first.first, noiseBlocks[i].first.last),
                  signalBlocks[i].last
               )
            );
         }
      }
      else {
         var signalNoiseBlocks = this.blocksOfImageCycleSpin(signalImage, cycleSpin);
      }
      signalNoiseBlocks.sort(function (a, b) {return a.first.first - b.first.first;});

      var thresholdLow = Math.round(this.quantileLow * (signalNoiseBlocks.length - 1));
      var thresholdHigh = Math.round(this.quantileHigh * (signalNoiseBlocks.length - 1));

      var signals = new Array();
      var noises = new Array();
      for (var i = thresholdLow; i != thresholdHigh + 1; ++i) {
         var x = signalNoiseBlocks[i].last.x;
         var y = signalNoiseBlocks[i].last.y;
         for (var y0 = 0; y0 != this.blockSize; ++y0) {
            var row = signalImage.width * (y + y0);
            for (var x0 = 0; x0 != this.blockSize; ++x0) {
               foregroundMask[row + x + x0] = 0.5;
            }
         }
      }
   }

   this.foregroundMaskOfImages = function(
      signalImage, noiseImage, foregroundMask
   ) {
      var length = signalImage.height * signalImage.width;
      for (var i = 0; i != length; ++i) {
         foregroundMask.push(1.0);
      }

      for (var i = 0; i != this.cycleSpins.length; ++i) {
         this.foregroundMaskOfImagesCycleSpin(
            signalImage,
            noiseImage,
            foregroundMask,
            this.cycleSpins[i]
         );
         gc();
      }
   }
}

function parametersPrototype() {
   this.dialog = null;

   this.flat1View = null;
   this.flat2View = null;
   this.flatDarkBiasView = null;

   this.foregroundQuantileLabels = new Array(
      "10%",
      "20%",
      "50%",
      "100%"
   );
   this.defaultForegroundQuantile = 1;
   this.foregroundQuantileComboBox = this.defaultForegroundQuantile;

   this.resolution = 65535;

   this.signalNoiseEstimator = new signalNoiseEstimatorPrototype();

   this.validResults = false;
   this.signal = 0.0;
   this.noise = 0.0;
   this.SNR = 0.0;
   this.gain = 0.0;

   this.storeSettings = function() {
      Settings.write(
         TITLE + "." + VERSION + "_foregroundQuantileComboBox" ,
         DataType_Int32,
         this.foregroundQuantileComboBox
      );
   }

   this.loadSettings = function() {
      var value = Settings.read(
         TITLE + "." + VERSION + "_foregroundQuantileComboBox",
         DataType_Int32
      );
      this.foregroundQuantileComboBox = defaultNullMinMaxValue(
         value,
         0,
         this.foregroundQuantileLabels.length - 1,
         this.defaultForegroundQuantile
      );
   }
}
var parameters = new parametersPrototype();

function getSignal() {
   if (!parameters.validResults) {
      return "-";
   }
   return format("%.2f DN", parameters.signal);
}

function getNoise() {
   if (!parameters.validResults) {
      return "-";
   }
   return format("%.2f DN", parameters.noise);
}

function getSNR() {
   if (!parameters.validResults) {
      return "-";
   }
   return format("%.1f", parameters.SNR);
}

function getGain() {
   if (!parameters.validResults) {
      return "-";
   }
   return format("%.3f e-/DN", parameters.gain);
}

function enable() {
   parameters.dialog.flat1ViewList.enabled = true;
   parameters.dialog.flat2ViewList.enabled = true;
   parameters.dialog.flatDarkBiasViewList.enabled = true;
   parameters.dialog.foregroundQuantileComboBox.enabled = true;

   parameters.dialog.browseDocumentationButton.enabled = true;
   parameters.dialog.resetButton.enabled = true;
   parameters.dialog.estimateButton.enabled =
      parameters.flat1View != null &&
      !parameters.flat1View.isNull &&
      parameters.flat2View != null &&
      !parameters.flat2View.isNull;
   parameters.dialog.foregroundMaskButton.enabled = parameters.validResults;

   parameters.dialog.signalNode.setText(1, getSignal());
   parameters.dialog.noiseNode.setText(1, getNoise());
   parameters.dialog.SNRNode.setText(1, getSNR());
   parameters.dialog.gainNode.setText(1, getGain());
}

function disable() {
   parameters.dialog.flat1ViewList.enabled = false;
   parameters.dialog.flat2ViewList.enabled = false;
   parameters.dialog.flatDarkBiasViewList.enabled = false;
   parameters.dialog.foregroundQuantileComboBox.enabled = false;

   parameters.dialog.browseDocumentationButton.enabled = false;
   parameters.dialog.resetButton.enabled = false;
   parameters.dialog.estimateButton.enabled = false;
   parameters.dialog.foregroundMaskButton.enabled = false;
}

function globalClear() {
   parameters.validResults = false;

   enable();
}

function globalReset() {
   parameters.flat1View = null;
   parameters.dialog.flat1ViewList.currentView =
      parameters.dialog.flat1ViewListNullCurrentView;

   parameters.flat2View = null;
   parameters.dialog.flat2ViewList.currentView =
      parameters.dialog.flat2ViewListNullCurrentView;

   parameters.flatDarkBiasView = null;
   parameters.dialog.flatDarkBiasViewList.currentView =
      parameters.dialog.flatDarkBiasViewListNullCurrentView;

   parameters.foregroundQuantileComboBox =
      parameters.defaultForegroundQuantile;
   parameters.dialog.foregroundQuantileComboBox.currentItem =
      parameters.foregroundQuantileComboBox;

   globalClear();
}

function globalEstimate() {
   disable();

   if (
      parameters.flat1View == null ||
      parameters.flat1View.isNull
   ) {
      enable();
      return;
   }
   if (
      parameters.flat2View == null ||
      parameters.flat2View.isNull
   ) {
      enable();
      return;
   }

   if (
      parameters.flat1View.image.numberOfChannels != 1 ||
      parameters.flat2View.image.numberOfChannels != 1 || (
         !(parameters.flatDarkBiasView == null || parameters.flatDarkBiasView.isNull) &&
         parameters.flatDarkBiasView.image.numberOfChannels != 1
      )
   ) {
      (new MessageBox(
         "<p><b>Error</b>: Images must be single channel.</p>",
         TITLE,
         StdIcon_Error,
         StdButton_Ok
      )).execute();
      enable();
      return;
   }
   if (
      parameters.flat1View.image.width !=
         parameters.flat2View.image.width ||
      parameters.flat1View.image.height !=
         parameters.flat2View.image.height || (
         !(parameters.flatDarkBiasView == null || parameters.flatDarkBiasView.isNull) && (
         parameters.flat1View.image.width !=
            parameters.flatDarkBiasView.image.width ||
         parameters.flat1View.image.height !=
            parameters.flatDarkBiasView.image.height
         )
      )
   ) {
      (new MessageBox(
         "<p><b>Error</b>: Images must be identically sized.</p>",
         TITLE,
         StdIcon_Error,
         StdButton_Ok
      )).execute();
      enable();
      return;
   }

   parameters.flat1View.image.resetSelections();
   parameters.flat2View.image.resetSelections();
   if (!(parameters.flatDarkBiasView == null || parameters.flatDarkBiasView.isNull)) {
      parameters.flatDarkBiasView.image.resetSelections();
   }

   if (
      Math.min(parameters.flat1View.image.mean(), parameters.flat2View.image.mean()) /
      Math.max(parameters.flat1View.image.mean(), parameters.flat2View.image.mean()) < 0.95
   ) {
      if (
         (new MessageBox(
            "<p><b>Warning</b>: Image exposures differ by more than 5%.  Estimation " +
            "accuracy may be compromised.</p>" +
            "<p><b>Estimate anyway?</b></p>",
            TITLE,
            StdIcon_Warning,
            StdButton_Yes,
            StdButton_No
         )).execute() == StdButton_No
      ) {
         enable();
         return;
      }

   }

   console.show();
   parameters.dialog.enableAbort();

   var signalView = null;
   var noiseView = null;
   try {
      var pixelMath = new PixelMath;
      pixelMath.createNewImage = true;
      if (parameters.flatDarkBiasView == null || parameters.flatDarkBiasView.isNull) {
         pixelMath.expression =
            "0.5 * (" +
            parameters.flat1View.fullId +
            " + " +
            parameters.flat2View.fullId +
            ")";
      }
      else {
         pixelMath.expression =
            "0.5 * (" +
            parameters.flat1View.fullId +
            " + " +
            parameters.flat2View.fullId +
            ") - " +
            parameters.flatDarkBiasView.fullId;
      }
      pixelMath.generateOutput = true;
      pixelMath.newImageAlpha = false;
      pixelMath.newImageColorSpace = PixelMath.prototype.Gray;
      pixelMath.newImageHeight = parameters.flat1View.image.height;
      pixelMath.newImageId = uniqueViewId("flat_signal");
      pixelMath.newImageSampleFormat = PixelMath.prototype.f32;
      pixelMath.newImageWidth = parameters.flat1View.image.width;
      pixelMath.rescale = false;
      pixelMath.showNewImage = false;
      pixelMath.truncate = true;
      pixelMath.truncateLower = 0.0;
      pixelMath.truncateUpper = 1.0;
      pixelMath.useSingleExpression = true;
      pixelMath.executeGlobal(); // executeOn(parameters.flat1View, false);
      signalView = View.viewById(pixelMath.newImageId);

      parameters.dialog.throwAbort();

      var pixelMath = new PixelMath;
      pixelMath.createNewImage = true;
      pixelMath.expression =
         "sqrt(0.5) * (" +
         parameters.flat1View.fullId +
         " - " +
         parameters.flat2View.fullId +
         ") + 0.5";
      pixelMath.generateOutput = true;
      pixelMath.newImageAlpha = false;
      pixelMath.newImageColorSpace = PixelMath.prototype.Gray;
      pixelMath.newImageHeight = parameters.flat1View.image.height;
      pixelMath.newImageId = uniqueViewId("flat_noise");
      pixelMath.newImageSampleFormat = PixelMath.prototype.f32;
      pixelMath.newImageWidth = parameters.flat1View.image.width;
      pixelMath.rescale = false;
      pixelMath.showNewImage = false;
      pixelMath.truncate = true;
      pixelMath.truncateLower = 0.0;
      pixelMath.truncateUpper = 1.0;
      pixelMath.useSingleExpression = true;
      pixelMath.executeGlobal(); // executeOn(parameters.flat1View, false);
      noiseView = View.viewById(pixelMath.newImageId);

      parameters.dialog.throwAbort();

      console.writeln();
      if (parameters.flatDarkBiasView == null || parameters.flatDarkBiasView.isNull) {
         console.writeln(
            "<b>Signal and temporal noise estimation</b>: Processing views: ",
            parameters.flat1View.fullId,
            ", ",
            parameters.flat2View.fullId
         );
      }
      else {
         console.writeln(
            "<b>Signal and temporal noise estimation</b>: Processing views: ",
            parameters.flat1View.fullId,
            ", ",
            parameters.flat2View.fullId,
            ", ",
            parameters.flatDarkBiasView.fullId
         );
      }
      console.flush();
      var startTime = new Date();

      parameters.signalNoiseEstimator.quantileLow = 1.0 - 0.01 * parseInt(
         parameters.foregroundQuantileLabels[parameters.foregroundQuantileComboBox]
      );
      parameters.signalNoiseEstimator.quantileHigh = 1.0;

      var signalNoise = parameters.signalNoiseEstimator.signalNoiseOfImages(
         signalView.image,
         noiseView.image
      );
      parameters.signal =
         parameters.resolution * signalNoise.first;
      parameters.noise =
         parameters.resolution * signalNoise.last;

      if (parameters.noise == 0.0) {
         parameters.SNR = 0.0;
      }
      else {
         parameters.SNR = parameters.signal / parameters.noise;
      }

      if (parameters.noise == 0.0) {
         parameters.gain = 0.0;
      }
      else {
         parameters.gain =
            parameters.signal / (parameters.noise * parameters.noise);
      }

      var endTime = new Date();
      console.writeln(
         format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime()))
      );

      parameters.validResults = true;
   }
   catch (exception) {
      parameters.validResults = false;
      console.criticalln("abort");
   }
   finally {
      if (signalView != null) {
         signalView.window.close();
      }
      if (noiseView != null) {
         noiseView.window.close();
      }
   }
   console.flush();

   parameters.dialog.disableAbort();
   console.hide();

   enable();
}

function globalForegroundMask() {
   disable();

   if (
      parameters.flat1View == null ||
      parameters.flat1View.isNull
   ) {
      enable();
      return;
   }
   if (
      parameters.flat2View == null ||
      parameters.flat2View.isNull
   ) {
      enable();
      return;
   }

   if (
      parameters.flat1View.image.numberOfChannels != 1 ||
      parameters.flat2View.image.numberOfChannels != 1 || (
         !(parameters.flatDarkBiasView == null || parameters.flatDarkBiasView.isNull) &&
         parameters.flatDarkBiasView.image.numberOfChannels != 1
      )
   ) {
      (new MessageBox(
         "<p><b>Error</b>: Images must be single channel.</p>",
         TITLE,
         StdIcon_Error,
         StdButton_Ok
      )).execute();
      enable();
      return;
   }
   if (
      parameters.flat1View.image.width !=
         parameters.flat2View.image.width ||
      parameters.flat1View.image.height !=
         parameters.flat2View.image.height || (
         !(parameters.flatDarkBiasView == null || parameters.flatDarkBiasView.isNull) && (
         parameters.flat1View.image.width !=
            parameters.flatDarkBiasView.image.width ||
         parameters.flat1View.image.height !=
            parameters.flatDarkBiasView.image.height
         )
      )
   ) {
      (new MessageBox(
         "<p><b>Error</b>: Images must be identically sized.</p>",
         TITLE,
         StdIcon_Error,
         StdButton_Ok
      )).execute();
      enable();
      return;
   }

   parameters.flat1View.image.resetSelections();
   parameters.flat2View.image.resetSelections();
   if (!(parameters.flatDarkBiasView == null || parameters.flatDarkBiasView.isNull)) {
      parameters.flatDarkBiasView.image.resetSelections();
   }

   console.show();
   parameters.dialog.enableAbort();

   var signalView = null;
   var noiseView = null;
   try {
      var pixelMath = new PixelMath;
      pixelMath.createNewImage = true;
      if (parameters.flatDarkBiasView == null || parameters.flatDarkBiasView.isNull) {
         pixelMath.expression =
            "0.5 * (" +
            parameters.flat1View.fullId +
            " + " +
            parameters.flat2View.fullId +
            ")";
      }
      else {
         pixelMath.expression =
            "0.5 * (" +
            parameters.flat1View.fullId +
            " + " +
            parameters.flat2View.fullId +
            ") - " +
            parameters.flatDarkBiasView.fullId;
      }
      pixelMath.generateOutput = true;
      pixelMath.newImageAlpha = false;
      pixelMath.newImageColorSpace = PixelMath.prototype.Gray;
      pixelMath.newImageHeight = parameters.flat1View.image.height;
      pixelMath.newImageId = uniqueViewId("flat_signal");
      pixelMath.newImageSampleFormat = PixelMath.prototype.f32;
      pixelMath.newImageWidth = parameters.flat1View.image.width;
      pixelMath.rescale = false;
      pixelMath.showNewImage = false;
      pixelMath.truncate = true;
      pixelMath.truncateLower = 0.0;
      pixelMath.truncateUpper = 1.0;
      pixelMath.useSingleExpression = true;
      pixelMath.executeGlobal(); // executeOn(parameters.flat1View, false);
      signalView = View.viewById(pixelMath.newImageId);

      parameters.dialog.throwAbort();

      var pixelMath = new PixelMath;
      pixelMath.createNewImage = true;
      pixelMath.expression =
         "sqrt(0.5) * (" +
         parameters.flat1View.fullId +
         " - " +
         parameters.flat2View.fullId +
         ") + 0.5";
      pixelMath.generateOutput = true;
      pixelMath.newImageAlpha = false;
      pixelMath.newImageColorSpace = PixelMath.prototype.Gray;
      pixelMath.newImageHeight = parameters.flat1View.image.height;
      pixelMath.newImageId = uniqueViewId("flat_noise");
      pixelMath.newImageSampleFormat = PixelMath.prototype.f32;
      pixelMath.newImageWidth = parameters.flat1View.image.width;
      pixelMath.rescale = false;
      pixelMath.showNewImage = false;
      pixelMath.truncate = true;
      pixelMath.truncateLower = 0.0;
      pixelMath.truncateUpper = 1.0;
      pixelMath.useSingleExpression = true;
      pixelMath.executeGlobal(); // executeOn(parameters.flat1View, false);
      noiseView = View.viewById(pixelMath.newImageId);

      parameters.dialog.throwAbort();

      console.writeln();
      if (parameters.flatDarkBiasView == null || parameters.flatDarkBiasView.isNull) {
         console.writeln(
            "<b>Foreground mask generation</b>: Processing views: ",
            parameters.flat1View.fullId,
            ", ",
            parameters.flat2View.fullId
         );
      }
      else {
         console.writeln(
            "<b>Foreground mask generation</b>: Processing views: ",
            parameters.flat1View.fullId,
            ", ",
            parameters.flat2View.fullId,
            ", ",
            parameters.flatDarkBiasView.fullId
         );
      }
      console.flush();
      var startTime = new Date();

      parameters.signalNoiseEstimator.quantileLow = 1.0 - 0.01 * parseInt(
         parameters.foregroundQuantileLabels[parameters.foregroundQuantileComboBox]
      );
      parameters.signalNoiseEstimator.quantileHigh = 1.0;

      var foregroundMask = new Array();
      parameters.signalNoiseEstimator.foregroundMaskOfImages(
         signalView.image,
         noiseView.image,
         foregroundMask
      );

      var foregroundMaskImageWindow = new ImageWindow(
         parameters.flat1View.image.width,
         parameters.flat1View.image.height,
         1,
         32,
         true,
         false,
         uniqueViewId(parameters.flat1View.fullId + "_foreground_mask")
      );
      foregroundMaskImageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);
      foregroundMaskImageWindow.mainView.image.setPixels(foregroundMask);
      foregroundMaskImageWindow.mainView.endProcess();
      foregroundMaskImageWindow.show();

      var endTime = new Date();
      console.writeln(
         format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime()))
      );
   }
   catch (exception) {
      console.criticalln("abort");
   }
   finally {
      if (signalView != null) {
         signalView.window.close();
      }
      if (noiseView != null) {
         noiseView.window.close();
      }
   }
   console.flush();

   parameters.dialog.disableAbort();
   console.hide();

   enable();
}

function parametersDialogPrototype(parameters) {
   this.__base__ = Dialog;
   this.__base__();

   // Workaround to avoid scaledResource failure in 1.8.4.1190
   this.displayPixelRatio;

   this.parameters = parameters;

   this.abortEnabled = false;
   this.abortRequested = false;

   this.enableAbort = function() {
      this.abortEnabled = true;
      this.abortRequested = false;
      this.dismissAbortButton.text = "Abort";
      this.dismissAbortButton.toolTip = "<p>Aborts the estimation.</p>";
   };

   this.disableAbort = function () {
      this.abortEnabled = false;
      this.abortRequested = false;
      this.dismissAbortButton.text = "Dismiss";
      this.dismissAbortButton.toolTip = "<p>Dismisses the dialog.</p>";
   }

   this.throwAbort = function() {
      if (this.abortEnabled && this.abortRequested) {
         throw new Error("abort");
      }
   }

   this.windowTitle = TITLE;

   this.flat1TargetPane = new HorizontalSizer;

   this.flat1TargetPane.spacing = 6;

   this.flat1Label = new Label(this);

   this.flat1Label.text = "Flat 1:";
   this.flat1Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.flat1Label.setFixedWidth(this.font.width("Foreground quantile:"));
   this.flat1Label.toolTip =
      "<p>Specifies a flat subframe or integration.</p>";

   this.flat1TargetPane.add(this.flat1Label);

   this.flat1ViewList = new ViewList(this);
   this.flat1ViewList.setMinWidth(30 * this.font.width("M"));
   this.flat1ViewListNullCurrentView = this.flat1ViewList.currentView;

   this.flat1ViewList.getMainViews();
   this.flat1ViewList.toolTip = this.flat1Label.toolTip;
   this.flat1ViewList.onViewSelected = function(view) {
      this.dialog.parameters.flat1View = view;
      globalClear();
   }

   this.flat1TargetPane.add(this.flat1ViewList);

   this.flat2TargetPane = new HorizontalSizer;

   this.flat2TargetPane.spacing = 6;

   this.flat2Label = new Label(this);

   this.flat2Label.text = "Flat 2:";
   this.flat2Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.flat2Label.setFixedWidth(this.font.width("Foreground quantile:"));
   this.flat2Label.toolTip =
      "<p>Specifies a flat subframe or integration.</p>";

   this.flat2TargetPane.add(this.flat2Label);

   this.flat2ViewList = new ViewList(this);
   this.flat2ViewList.setMinWidth(30 * this.font.width("M"));
   this.flat2ViewListNullCurrentView = this.flat2ViewList.currentView;

   this.flat2ViewList.getMainViews();
   this.flat2ViewList.toolTip = this.flat2Label.toolTip;
   this.flat2ViewList.onViewSelected = function(view) {
      this.dialog.parameters.flat2View = view;
      globalClear();
   }

   this.flat2TargetPane.add(this.flat2ViewList);

   this.flatDarkTargetPane = new HorizontalSizer;

   this.flatDarkTargetPane.spacing = 6;

   this.flatDarkLabel = new Label(this);

   this.flatDarkLabel.text = "Flat dark or bias:";
   this.flatDarkLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.flatDarkLabel.setFixedWidth(this.font.width("Foreground quantile:"));
   this.flatDarkLabel.toolTip =
      "<p>If the flats are uncalibrated (i.e. not flat dark or bias subtracted), " +
      "specifies a flat dark or bias subframe or integration.</p>" +
      "<p>If the flats are calibrated (i.e. flat dark or bias subtracted), " +
      "no view must be selected.</p>";

   this.flatDarkTargetPane.add(this.flatDarkLabel);

   this.flatDarkBiasViewList = new ViewList(this);
   this.flatDarkBiasViewList.setMinWidth(30 * this.font.width("M"));
   this.flatDarkBiasViewListNullCurrentView = this.flatDarkBiasViewList.currentView;

   this.flatDarkBiasViewList.getMainViews();
   this.flatDarkBiasViewList.toolTip = this.flatDarkLabel.toolTip;
   this.flatDarkBiasViewList.onViewSelected = function(view) {
      this.dialog.parameters.flatDarkBiasView = view;
      globalClear();
   }

   this.flatDarkTargetPane.add(this.flatDarkBiasViewList);

   this.foregroundQuantilePane = new HorizontalSizer;

   this.foregroundQuantilePane.spacing = 6;

   this.foregroundQuantileLabel = new Label(this);

   this.foregroundQuantileLabel.text = "Foreground quantile:";
   this.foregroundQuantileLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.foregroundQuantileLabel.setFixedWidth(this.font.width("Foreground quantile:"));
   this.foregroundQuantileLabel.toolTip =
      "<p>Foreground quantile specifies the brightest quantile of local " +
      "regions in the flats used to estimate the signal to temporal noise " +
      "ratio and gain.</p>" +
      "<p>To use all local regions in the estimation, set this " +
      "parameter to 100%.</p>";

   this.foregroundQuantilePane.add(this.foregroundQuantileLabel);

   this.foregroundQuantileComboBox = new ComboBox(this);

   for (var i = 0; i != this.parameters.foregroundQuantileLabels.length; ++i) {
      this.foregroundQuantileComboBox.addItem(" " + this.parameters.foregroundQuantileLabels[i]);
   }
   this.foregroundQuantileComboBox.currentItem = this.parameters.foregroundQuantileComboBox;
   this.foregroundQuantileComboBox.toolTip = this.foregroundQuantileLabel.toolTip;
   this.foregroundQuantileComboBox.onItemSelected = function(item) {
      if (this.dialog.parameters.foregroundQuantileComboBox != item) {
         this.dialog.parameters.foregroundQuantileComboBox = item;
         globalClear();
      }
   };

   this.foregroundQuantilePane.add(this.foregroundQuantileComboBox);
   this.foregroundQuantilePane.addStretch();

   this.resultsPane = new VerticalSizer;

   var treeBox = new TreeBox(this);
   this.treeBox = treeBox;

   this.treeBox.alternateRowColor = true;
   this.treeBox.headerVisible = false;
   this.treeBox.indentSize = 0;
   this.treeBox.numberOfColumns = 2;
   this.treeBox.setScaledFixedHeight(100);

   this.treeBox.setHeaderAlignment(0, Align_Left | TextAlign_VertCenter);
   this.treeBox.setColumnWidth(
      0,
      this.treeBox.font.width("Temporal noise") + 3 * this.treeBox.font.width("M")
   );
   this.treeBox.setHeaderAlignment(1, Align_Left | TextAlign_VertCenter);
   this.treeBox.setColumnWidth(1, this.treeBox.columnWidth(0));

   this.signalNode = new TreeBoxNode(treeBox);

   this.signalNode.setText(0, "Signal");
   this.signalNode.setText(1, "-");
   this.signalNode.setToolTip(
      0,
      "<p>Signal is an estimate of the exposure of the flats, in data " +
      "number (DN 16-bit [0,65535]) units.</p>"
   );
   this.signalNode.setToolTip(1, this.signalNode.toolTip(0));
   this.signalNode.selectable = false;

   this.noiseNode = new TreeBoxNode(treeBox);

   this.noiseNode.setText(0, "Temporal noise");
   this.noiseNode.setText(1, "-");
   this.noiseNode.setToolTip(
      0,
      "<p>Temporal noise is an estimate of the standard deviation of " +
      "temporal noise (e.g. photon noise, read noise, and dark noise) in the " +
      "flats, in data number (DN 16-bit [0,65535]) units.</p>"
   );
   this.noiseNode.setToolTip(1, this.noiseNode.toolTip(0));
   this.noiseNode.selectable = false;

   this.SNRNode = new TreeBoxNode(treeBox);

   this.SNRNode.setText(0, "SNR");
   this.SNRNode.setText(1, "-");
   this.SNRNode.setToolTip(
      0,
      "<p>SNR is an estimate of the signal to temporal noise ratio of " +
      "the flats.</p>"
   );
   this.SNRNode.setToolTip(1, this.SNRNode.toolTip(0));
   this.SNRNode.selectable = false;

   this.gainNode = new TreeBoxNode(treeBox);

   this.gainNode.setText(0, "Gain");
   this.gainNode.setText(1, "-");
   this.gainNode.setToolTip(
      0,
      "<p>Gain is an estimate of the gain of the flats, defined by " +
      "the signal to squared temporal noise ratio of the flats, in electron " +
      "per data number (e-/DN 16-bit [0,65535]) units. For flat subframes, " +
      "Gain is an estimate of detector gain. For flat integrations, Gain is an " +
      "estimate of the product of detector gain and the number of subframes " +
      "combined in the integrations.</p>"
   );
   this.gainNode.setToolTip(1, this.gainNode.toolTip(0));
   this.gainNode.selectable = false;

   this.resultsPane.add(this.treeBox);

   this.buttonPane = new HorizontalSizer;

   this.buttonPane.spacing = 6;

   this.aboutButton = new ToolButton(this);

   this.browseDocumentationButton = new ToolButton(this);
   this.browseDocumentationButton.icon = this.scaledResource( ":/process-interface/browse-documentation.png" );
   this.browseDocumentationButton.setScaledFixedSize( 20, 20 );
   this.browseDocumentationButton.toolTip =
      "<p>Opens a browser to view the script's documentation.</p>";
   this.browseDocumentationButton.onClick = function () {
      if (!Dialog.browseScriptDocumentation(TITLE)) {
         (new MessageBox(
            "<p>Documentation has not been installed.</p>",
            TITLE,
            StdIcon_Warning,
            StdButton_Ok
         )).execute();
      }
   };

   this.buttonPane.add(this.browseDocumentationButton);

   this.resetButton = new ToolButton(this);
   this.resetButton.icon = this.scaledResource( ":/images/icons/reset.png" );
   this.resetButton.setScaledFixedSize( 20, 20 );
   this.resetButton.toolTip = "<p>Resets the dialog's parameters.";
   this.resetButton.onClick = function() {
      globalReset();
   };

   this.buttonPane.add(this.resetButton);

   this.versionLabel = new Label(this);
   this.versionLabel.text = "Version " + VERSION;
   this.versionLabel.toolTip =
         "<p><b>" + TITLE + " Version " + VERSION + "</b></p>" +

         "<p>This script estimates the signal to temporal noise ratio and gain " +
         "of flat subframes or integrations. The information is useful for " +
         "flat frame quality evaluation and detector characterization.</p>" +

         "<p>This script requires as inputs two flats and, if the flats are " +
         "uncalibrated (i.e. not flat dark or bias subtracted), either a flat " +
         "dark or a bias, all equally sized, single " +
         "channel subframes or integrations, and a foreground quantile parameter. " +
         "Flat subframes must be similarly exposed within the linear operating " +
         "region of the detector. Flat integrations must be similar combinations " +
         "of the same number of similarly exposed subframes. The flats and " +
         "flat dark or bias may be monochrome detector images, raw Bayer CFA detector " +
         "images, or a CFA channel extracted from raw Bayer CFA detector images. " +
         "Estimation accuracy will be compromised on RGB channels extracted from " +
         "de-Bayered CFA images due to channel interpolation.</p>" +

         "<p>Copyright &copy; 2012-2015 Mike Schuster. All Rights Reserved.<br/>" +
            "Copyright &copy; 2003-2015 Pleiades Astrophoto S.L. All Rights Reserved.</p>";
   this.versionLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;

   this.buttonPane.add(this.versionLabel);
   this.buttonPane.addStretch();

   this.estimateButton = new PushButton(this);

   this.estimateButton.text = "Estimate";
   this.estimateButton.toolTip =
      "<p>Estimates the signal to temporal noise ratio and gain of the " +
      "flats.</p>";
   this.estimateButton.onClick = function() {
      globalEstimate();
   };

   this.buttonPane.add(this.estimateButton);

   this.foregroundMaskButton = new PushButton(this);

   this.foregroundMaskButton.text = "Generate Mask";
   this.foregroundMaskButton.toolTip =
      "<p>Generates a foreground mask, which identifies the brightest quantile " +
      "of local regions in the flats used to estimate the signal to temporal " +
      "noise ratio and gain.</p>";
   this.foregroundMaskButton.onClick = function() {
      globalForegroundMask();
   };

   this.buttonPane.add(this.foregroundMaskButton);

   this.dismissAbortButton = new PushButton(this);

   this.dismissAbortButton.text = "Dismiss";
   this.dismissAbortButton.toolTip = "<p>Dismisses the dialog.</p>";
   this.dismissAbortButton.onClick = function() {
      if (this.dialog.abortEnabled) {
         this.dialog.abortRequested = true;
      }
      else {
         this.dialog.ok();
      }
   };
   this.dismissAbortButton.defaultButton = true;
   this.dismissAbortButton.hasFocus = true;

   this.buttonPane.add(this.dismissAbortButton);

   this.onClose = function() {
      if (this.dialog.abortEnabled) {
         this.dialog.abortRequested = true;
      }
   }

   this.sizer = new VerticalSizer;

   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add(this.flat1TargetPane);
   this.sizer.add(this.flat2TargetPane);
   this.sizer.add(this.flatDarkTargetPane);
   this.sizer.add(this.foregroundQuantilePane);
   this.sizer.add(this.resultsPane);
   this.sizer.add(this.buttonPane);

   this.adjustToContents();
   this.setMinWidth(this.width + this.logicalPixelsToPhysical(40));
   this.setFixedHeight();

   this.disableAbort(); // PushButton.text update may force an adjustToContents()
}
parametersDialogPrototype.prototype = new Dialog;

function main() {
   console.hide();
   parameters.loadSettings();

   var parametersDialog = new parametersDialogPrototype(parameters);
   parameters.dialog = parametersDialog;
   parameters.signalNoiseEstimator.abort = parametersDialog;

   globalClear();

   parametersDialog.execute();

   parameters.storeSettings();
}

main();

// ****************************************************************************
// EOF FlatSNREstimator.js - Released 2015/12/02 00:00:00 UTC
