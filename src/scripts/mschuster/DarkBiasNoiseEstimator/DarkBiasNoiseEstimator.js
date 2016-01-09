// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// DarkBiasNoiseEstimator.js - Released 2015/11/21 00:00:00 UTC
// ****************************************************************************
//
// This file is part of DarkBiasNoiseEstimator Script version 1.4
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

#define TITLE "DarkBiasNoiseEstimator"
#define VERSION "1.4"

#feature-id Image Analysis > DarkBiasNoiseEstimator

#feature-info <b>DarkBiasNoiseEstimator Version 1.4</b><br/>\
   <br/>\
   This script estimates the offset and the standard deviation \
   of temporal noise (e.g. read noise and dark noise) in dark or bias \
   subframes or integrations.<br/>\
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
                  new Pair(
                     signalBlocks[i].first.first, noiseBlocks[i].first.last
                  ),
                  signalBlocks[i].last
               )
            );
         }
      }
      else {
         var signalNoiseBlocks = this.blocksOfImageCycleSpin(
            signalImage, cycleSpin
         );
      }
      signalNoiseBlocks.sort(
         function (a, b) {
            return a.first.first - b.first.first;
         }
      );

      var thresholdLow = Math.round(
         this.quantileLow * (signalNoiseBlocks.length - 1)
      );
      var thresholdHigh = Math.round(
         this.quantileHigh * (signalNoiseBlocks.length - 1)
      );

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
}

function parametersPrototype() {
   this.dialog = null;

   this.darkBias1View = null;
   this.darkBias2View = null;

   this.resolution = 65535;

   this.signalNoiseEstimator = new signalNoiseEstimatorPrototype();

   this.validResults = false;
   this.offset = 0.0;
   this.noise = 0.0;

   this.storeSettings = function() {
   }

   this.loadSettings = function() {
   }
}
var parameters = new parametersPrototype();

function getOffset() {
   if (!parameters.validResults) {
      return "-";
   }
   return format("%.2f DN", parameters.offset);
}

function getNoise() {
   if (!parameters.validResults) {
      return "-";
   }
   return format("%.2f DN", parameters.noise);
}

function enable() {
   parameters.dialog.darkBias1ViewList.enabled = true;
   parameters.dialog.darkBias2ViewList.enabled = true;

   parameters.dialog.browseDocumentationButton.enabled = true;
   parameters.dialog.resetButton.enabled = true;
   parameters.dialog.estimateButton.enabled =
      parameters.darkBias1View != null &&
      !parameters.darkBias1View.isNull &&
      parameters.darkBias2View != null &&
      !parameters.darkBias2View.isNull;

   parameters.dialog.offsetNode.setText(1, getOffset());
   parameters.dialog.noiseNode.setText(1, getNoise());
}

function disable() {
   parameters.dialog.darkBias1ViewList.enabled = false;
   parameters.dialog.darkBias2ViewList.enabled = false;

   parameters.dialog.browseDocumentationButton.enabled = false;
   parameters.dialog.resetButton.enabled = false;
   parameters.dialog.estimateButton.enabled = false;
}

function globalClear() {
   parameters.validResults = false;

   enable();
}

function globalReset() {
   parameters.darkBias1View = null;
   parameters.dialog.darkBias1ViewList.currentView =
      parameters.dialog.darkBias1ViewListNullCurrentView;

   parameters.darkBias2View = null;
   parameters.dialog.darkBias2ViewList.currentView =
      parameters.dialog.darkBias2ViewListNullCurrentView;

   globalClear();
}

function globalEstimate() {
   disable();

   if (
      parameters.darkBias1View == null ||
      parameters.darkBias1View.isNull
   ) {
      enable();
      return;
   }
   if (
      parameters.darkBias2View == null ||
      parameters.darkBias2View.isNull
   ) {
      enable();
      return;
   }

   if (
      parameters.darkBias1View.image.numberOfChannels != 1 ||
      parameters.darkBias2View.image.numberOfChannels != 1
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
      parameters.darkBias1View.image.width !=
         parameters.darkBias2View.image.width ||
      parameters.darkBias1View.image.height !=
         parameters.darkBias2View.image.height
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

   parameters.darkBias1View.image.resetSelections();
   parameters.darkBias2View.image.resetSelections();

   console.show();
   parameters.dialog.enableAbort();

   var offsetView = null;
   var noiseView = null;
   try {
      var pixelMath = new PixelMath;
      pixelMath.createNewImage = true;
      pixelMath.expression =
         "0.5 * (" +
         parameters.darkBias1View.fullId +
         " + " +
         parameters.darkBias2View.fullId +
         ")";
      pixelMath.generateOutput = true;
      pixelMath.newImageAlpha = false;
      pixelMath.newImageColorSpace = PixelMath.prototype.Gray;
      pixelMath.newImageHeight = parameters.darkBias1View.image.height;
      pixelMath.newImageId = uniqueViewId("dark_bias_offset");
      pixelMath.newImageSampleFormat = PixelMath.prototype.f32;
      pixelMath.newImageWidth = parameters.darkBias1View.image.width;
      pixelMath.rescale = false;
      pixelMath.showNewImage = false;
      pixelMath.truncate = true;
      pixelMath.truncateLower = 0.0;
      pixelMath.truncateUpper = 1.0;
      pixelMath.useSingleExpression = true;
      pixelMath.executeGlobal(); // executeOn(parameters.darkBias1View, false);
      offsetView = View.viewById(pixelMath.newImageId);

      parameters.dialog.throwAbort();

      var pixelMath = new PixelMath;
      pixelMath.createNewImage = true;
      pixelMath.expression =
         "sqrt(0.5) * (" +
         parameters.darkBias1View.fullId +
         " - " +
         parameters.darkBias2View.fullId +
         ") + 0.5";
      pixelMath.generateOutput = true;
      pixelMath.newImageAlpha = false;
      pixelMath.newImageColorSpace = PixelMath.prototype.Gray;
      pixelMath.newImageHeight = parameters.darkBias1View.image.height;
      pixelMath.newImageId = uniqueViewId("dark_bias_noise");
      pixelMath.newImageSampleFormat = PixelMath.prototype.f32;
      pixelMath.newImageWidth = parameters.darkBias1View.image.width;
      pixelMath.rescale = false;
      pixelMath.showNewImage = false;
      pixelMath.truncate = true;
      pixelMath.truncateLower = 0.0;
      pixelMath.truncateUpper = 1.0;
      pixelMath.useSingleExpression = true;
      pixelMath.executeGlobal(); // executeOn(parameters.darkBias1View, false);
      noiseView = View.viewById(pixelMath.newImageId);

      parameters.dialog.throwAbort();

      console.writeln();
      console.writeln(
         "<b>Offset and temporal noise estimation</b>: Processing views: ",
         parameters.darkBias1View.fullId +
         ", ",
         parameters.darkBias2View.fullId
      );
      console.flush();
      var startTime = new Date();

      parameters.signalNoiseEstimator.quantileLow = 0.0;
      parameters.signalNoiseEstimator.quantileHigh = 1.0;

      var offsetNoise = parameters.signalNoiseEstimator.signalNoiseOfImages(
         offsetView.image,
         noiseView.image
      );
      parameters.offset =
         parameters.resolution * offsetNoise.first;
      parameters.noise =
         parameters.resolution * offsetNoise.last;

      var endTime = new Date();
      console.writeln(
         format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime()))
      );

      parameters.validResults = true;
   }
   catch (exception) {
      parameters.validResults = false;
      console.criticalln(exception.message);
      if (!(new RegExp("^abort")).test(exception.message)) {
         (new MessageBox(
            "<p><b>Error</b>: " + exception.message + "</p>" +
            "<p>Estimation aborted.</p>",
            TITLE,
            StdIcon_Error,
            StdButton_Ok
         )).execute();
      }
   }
   finally {
      if (offsetView != null) {
         offsetView.window.close();
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

   this.darkBias1TargetPane = new HorizontalSizer;

   this.darkBias1TargetPane.spacing = 6;

   this.darkBias1Label = new Label(this);

   this.darkBias1Label.text = "Dark or bias 1:";
   this.darkBias1Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.darkBias1Label.setFixedWidth(this.font.width("Dark or bias 2:"));
   this.darkBias1Label.toolTip =
      "<p>Specifies a dark or bias subframe or integration.</p>";

   this.darkBias1TargetPane.add(this.darkBias1Label);

   this.darkBias1ViewList = new ViewList(this);
   this.darkBias1ViewList.setMinWidth(30 * this.font.width("M"));
   this.darkBias1ViewListNullCurrentView = this.darkBias1ViewList.currentView;

   this.darkBias1ViewList.getMainViews();
   this.darkBias1ViewList.toolTip = this.darkBias1Label.toolTip;
   this.darkBias1ViewList.onViewSelected = function(view) {
      this.dialog.parameters.darkBias1View = view;
      globalClear();
   }

   this.darkBias1TargetPane.add(this.darkBias1ViewList);

   this.darkBias2TargetPane = new HorizontalSizer;

   this.darkBias2TargetPane.spacing = 6;

   this.darkBias2Label = new Label(this);

   this.darkBias2Label.text = "Dark or bias 2:";
   this.darkBias2Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.darkBias2Label.setFixedWidth(this.font.width("Dark or bias 2:"));
   this.darkBias2Label.toolTip =
      "<p>Specifies a dark or bias subframe or integration.</p>";

   this.darkBias2TargetPane.add(this.darkBias2Label);

   this.darkBias2ViewList = new ViewList(this);
   this.darkBias2ViewList.setMinWidth(30 * this.font.width("M"));
   this.darkBias2ViewListNullCurrentView = this.darkBias2ViewList.currentView;

   this.darkBias2ViewList.getMainViews();
   this.darkBias2ViewList.toolTip = this.darkBias2Label.toolTip;
   this.darkBias2ViewList.onViewSelected = function(view) {
      this.dialog.parameters.darkBias2View = view;
      globalClear();
   }

   this.darkBias2TargetPane.add(this.darkBias2ViewList);

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
      this.treeBox.font.width("Temporal noise") +
      3 * this.treeBox.font.width("M")
   );
   this.treeBox.setHeaderAlignment(1, Align_Left | TextAlign_VertCenter);
   this.treeBox.setColumnWidth(1, this.treeBox.columnWidth(0));

   this.offsetNode = new TreeBoxNode(treeBox);

   this.offsetNode.setText(0, "Offset");
   this.offsetNode.setText(1, "-");
   this.offsetNode.setToolTip(
      0,
      "<p>Offset is an estimate of the offset of the darks or biases, " +
      "in data number (DN 16-bit [0,65535]) units.</p>"
   );
   this.offsetNode.setToolTip(1, this.offsetNode.toolTip(0));
   this.offsetNode.selectable = false;

   this.noiseNode = new TreeBoxNode(treeBox);

   this.noiseNode.setText(0, "Temporal noise");
   this.noiseNode.setText(1, "-");
   this.noiseNode.setToolTip(
      0,
      "<p>Temporal noise is an estimate of the standard deviation of " +
      "temporal noise (e.g. read noise and dark noise) in the darks or " +
      "biases, in data number (DN 16-bit [0,65535]) units.</p>"
   );
   this.noiseNode.setToolTip(1, this.noiseNode.toolTip(0));
   this.noiseNode.selectable = false;

   this.resultsPane.add(this.treeBox);

   this.buttonPane = new HorizontalSizer;

   this.buttonPane.spacing = 6;

   this.browseDocumentationButton = new ToolButton(this);
   this.browseDocumentationButton.icon =
      this.scaledResource( ":/process-interface/browse-documentation.png" );
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

      "<p>This script estimates the offset and the standard deviation of " +
      "temporal noise (e.g. read noise and dark noise) in dark or bias " +
      "subframes or integrations. The information is useful for dark and " +
      "bias frame quality evaluation and detector characterization.</p>" +

      "<p>This script requires as inputs two darks or biases, both " +
      "equally sized, single channel subframes or integrations. " +
      "Subframes must be similarly exposed. Integrations must be similar " +
      "combinations of the same number of similarly exposed subframes. " +
      "The darks or biases may be monochrome detector images, raw Bayer " +
      "CFA detector images, or a CFA channel extracted from raw Bayer " +
      "CFA detector images. Estimation accuracy will be compromised for " +
      "RGB channels extracted from de-Bayered CFA images due to channel " +
      "interpolation.</p>" +

      "<p>Copyright &copy; 2012-2015 Mike Schuster. All Rights " +
      "Reserved.<br/>" +
      "Copyright &copy; 2003-2015 Pleiades Astrophoto S.L. All Rights " +
      "Reserved.</p>";
   this.versionLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;

   this.buttonPane.add(this.versionLabel);
   this.buttonPane.addStretch();

   this.estimateButton = new PushButton(this);

   this.estimateButton.text = "Estimate";
   this.estimateButton.toolTip =
      "<p>Estimates the offset and the standard deviation of temporal " +
      "noise (e.g. read noise and dark noise) in the darks or biases.</p>";
   this.estimateButton.onClick = function() {
      globalEstimate();
   };

   this.buttonPane.add(this.estimateButton);

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
   this.sizer.add(this.darkBias1TargetPane);
   this.sizer.add(this.darkBias2TargetPane);
   this.sizer.add(this.resultsPane);
   this.sizer.add(this.buttonPane);

   this.adjustToContents();
   this.setMinWidth(this.width + this.logicalPixelsToPhysical(20));
   this.setFixedHeight();

   // PushButton.text update may force an adjustToContents()
   this.disableAbort();
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

gc();

// ****************************************************************************
// EOF DarkBiasNoiseEstimator.js - Released 2015/11/21 00:00:00 UTC
