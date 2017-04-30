// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// ModulationTransferFunctionPlot.js - Released 2016/12/30 00:00:00 UTC
// ****************************************************************************
//
// This file is part of WavefrontEstimator Script Version 1.19
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

function ModulationTransferFunctionPlot(model) {
   // Graphics.
   this.graphics = null;

   // Plot size and margin.
   this.plotWidth = 530;
   this.plotHeight = 372;
   this.plotMargin = new Rect(50, 50, 60, 50);

   // Tick size.
   this.smallTickSize = 2;
   this.largeTickSize = 4;

   // Axis offset.
   this.axisMargin = 10;

   // Modulation transfer axis.
   this.modulationAxisMax = 1;

   // Spatial frequency axis.
   this.frequencyOpticsAxisMin = 5;
   this.frequencyOpticsAxisMax = 1;
   this.frequencyDetectorAxisMax = 1;

   // Colors
   this.meshColor = 0xffe8e8e8;
   this.idealColor = 0xff8080cf;
   this.estimateColor = 0xffcf8080;

   // Plot bounds.
   this.plotBounds = new Rect(
      this.plotMargin.x0, this.plotMargin.y0,
      this.plotWidth - this.plotMargin.x1, this.plotHeight - this.plotMargin.y1
   );

   // Gives modulation transfer axis position.
   this.modulationAxisPosition = function(value) {
      return (1 - value / this.modulationAxisMax) *
         (this.plotBounds.y1 - this.plotBounds.y0) +
         this.plotBounds.y0;
   };

   // Gives spatial frequency axis position.
   this.frequencyAxisPosition = function(value) {
      return (
            (Math.log10(value) - Math.log10(this.frequencyOpticsAxisMin)) /
            (
               Math.log10(this.frequencyOpticsAxisMax) -
               Math.log10(this.frequencyOpticsAxisMin)
            )
         ) *
         (this.plotBounds.x1 - this.plotBounds.x0 - this.axisMargin) +
         this.plotBounds.x0 + this.axisMargin;
   };

   this.frequencyAxisOrigin = function() {
      return Math.pow10(
         (
            Math.log10(this.frequencyOpticsAxisMin) *
               (this.plotBounds.x1 - this.plotBounds.x0) -
            Math.log10(this.frequencyOpticsAxisMax) *
               this.axisMargin
         ) /
         (this.plotBounds.x1 - this.plotBounds.x0 - this.axisMargin)
      );
   };

   this.frequencyAxisValue = function(value) {
      return Math.pow10(
         value * (
            Math.log10(this.frequencyOpticsAxisMax) -
            Math.log10(this.frequencyOpticsAxisMin)
         ) +
         Math.log10(this.frequencyOpticsAxisMin)
      );
   };

   // Draws the modulation transfer mesh.
   this.drawModulationMesh = function(metrics) {
      this.graphics.antialiasing = false;
      this.graphics.pen = new Pen(this.meshColor, 1);

      // Draw mesh.
      for (
         var value = 0;
         value <= this.modulationAxisMax;
         value += metrics.largeDelta
      ) {
         var y = this.modulationAxisPosition(value);
         this.graphics.drawLine(
            this.plotBounds.x0, y,
            this.plotBounds.x1, y
         );
      }
      var y = this.modulationAxisPosition(0.5 * this.modulationAxisMax, this);
      this.graphics.drawLine(
         this.plotBounds.x0, y,
         this.plotBounds.x1, y
      );
   };

   // Draws the modulation transfer axis.
   this.drawModulationAxis = function(metrics) {
      this.graphics.antialiasing = false;
      this.graphics.pen = new Pen(0xff000000, 1);

      // Draw axis.
      this.graphics.drawLine(
         this.plotBounds.x0, this.plotBounds.y0,
         this.plotBounds.x0, this.plotBounds.y1
      );

      // Draw small ticks.
      for (
         var value = 0;
         value <= this.modulationAxisMax;
         value += metrics.smallDelta
      ) {
         var y = this.modulationAxisPosition(value);
         this.graphics.drawLine(
            this.plotBounds.x0, y,
            this.plotBounds.x0 + this.smallTickSize, y
         );
      }

      // Draw large ticks.
      for (
         var value = 0;
         value <= this.modulationAxisMax;
         value += metrics.largeDelta
      ) {
         var y = this.modulationAxisPosition(value);
         this.graphics.drawLine(
            this.plotBounds.x0, y,
            this.plotBounds.x0 + this.largeTickSize, y
         );
      }

      // Draw labels.
#iflt __PI_BUILD__ 1168
      var yOffset = -(2 * this.graphics.font.descent + 1);
#else
      var yOffset = -1 * this.graphics.font.descent;
#endif
      for (
         var value = 0;
         value <= this.modulationAxisMax;
         value += metrics.largeDelta
      ) {
         var text = format(
            value == 1 ?
               "%.0f%%" :
               "%.0f", 100 * (value / this.modulationAxisMax)
         );
         var xOffset = this.graphics.font.width(text + " ") + 1;
         var y = this.modulationAxisPosition(value);
         this.graphics.drawText(
            this.plotBounds.x0 - xOffset, y - yOffset,
            text
         );
      }

      this.graphics.pushState();
      this.graphics.rotateTransformation(90 * Math.PI / 180);
      var xOffset = 2.0 * this.graphics.font.height;
      var text = "Modulation Transfer";
      this.graphics.drawText(
         -this.modulationAxisPosition(0.5) -
            0.5 * this.graphics.font.width(text),
         this.plotBounds.x0 - xOffset,
         text
      );
      this.graphics.resetTransformation();
      this.graphics.popState();
   };

   // Draws spatial frequency mesh.
   this.drawFrequencyMesh = function(metrics) {
      this.graphics.antialiasing = false;
      this.graphics.pen = new Pen(this.meshColor, 1);

      // Draw mesh.
      var delta = metrics.delta;
      for (
         var value = this.frequencyOpticsAxisMin;
         value <= this.frequencyOpticsAxisMax;
      ) {
         var x = this.frequencyAxisPosition(value);
         var z = value / delta;
         if (z == 1 || z == 2 || z == 5) {
            this.graphics.drawLine(
               x, this.plotBounds.y1,
               x, this.plotBounds.y0
            );
         }
         value += delta;
         if (value == Math.pow10(Math.floor(Math.log10(value)))) {
            delta *= 10;
         }
      }
      var x = this.frequencyAxisPosition(40);
      this.graphics.drawLine(
         x, this.plotBounds.y1,
         x, this.plotBounds.y0
      );
   };

   // Draws spatial frequency axis.
   this.drawFrequencyAxis = function(metrics) {
      this.graphics.antialiasing = false;
      this.graphics.pen = new Pen(0xff000000, 1);

      // Draw axis.
      this.graphics.drawLine(
         this.plotBounds.x0, this.plotBounds.y1,
         this.plotBounds.x1, this.plotBounds.y1
      );

      // Draw small ticks.
      var delta = metrics.delta;
      for (
         var value = this.frequencyOpticsAxisMin;
         value <= this.frequencyOpticsAxisMax;
      ) {
         var x = this.frequencyAxisPosition(value);
         this.graphics.drawLine(
            x, this.plotBounds.y1,
            x, this.plotBounds.y1 - this.smallTickSize
         );
         value += delta;
         if (value == Math.pow10(Math.floor(Math.log10(value)))) {
            delta *= 5;
         }
         else if (value == 2 * Math.pow10(Math.floor(Math.log10(value)))) {
            delta *= 2;
         }
      }

      // Draw large ticks.
      var delta = metrics.delta;
      for (
         var value = this.frequencyOpticsAxisMin;
         value <= this.frequencyOpticsAxisMax;
      ) {
         var x = this.frequencyAxisPosition(value);
         var z = value / delta;
         if (z == 1 || z == 2 || z == 5) {
            this.graphics.drawLine(
               x, this.plotBounds.y1,
               x, this.plotBounds.y1 - this.largeTickSize
            );
         }
         value += delta;
         if (value == Math.pow10(Math.floor(Math.log10(value)))) {
            delta *= 10;
         }
      }

      // Draw labels.
      var delta = metrics.delta;
      var yOffset = -(
         0.25 * this.graphics.font.height + this.graphics.font.ascent
      );
      for (
         var value = this.frequencyOpticsAxisMin;
         value <= this.frequencyOpticsAxisMax;
      ) {
         var text = format("%.0f", value);
         var xOffset = 0.5 * this.graphics.font.width(text) - 1;
         var x = this.frequencyAxisPosition(value);
         var z = value / delta;
         if (z == 1 || z == 2 || z == 5) {
            this.graphics.drawText(
               x - xOffset, this.plotBounds.y1 - yOffset,
               text
            );
         }
         value += delta;
         if (value == Math.pow10(Math.floor(Math.log10(value)))) {
            delta *= 10;
         }
      }

      var xOffset = -this.graphics.font.width("m");
#iflt __PI_BUILD__ 1168
      var yOffset = -2 * this.graphics.font.descent;
#else
      var yOffset = -1 * this.graphics.font.descent;
#endif
      this.graphics.drawText(
         this.plotBounds.x1 - xOffset, this.plotBounds.y1 - yOffset,
         "lp/mm"
      );

#iflt __PI_BUILD__ 1168
      var yOffset = -(
         1.75 * this.graphics.font.height + this.graphics.font.ascent - 3
      );
#else
      var yOffset = -(
         1.5 * this.graphics.font.height + this.graphics.font.ascent - 3
      );
#endif
      var text = "Spatial Frequency";
      this.graphics.drawText(
         this.frequencyAxisPosition(this.frequencyAxisValue(0.5)) -
            0.5 * this.graphics.font.width(text),
         this.plotBounds.y1 - yOffset,
         text
      );

      var yOffset = 1.75 * this.graphics.font.height;
      var text = "Modulation Transfer Function";
      this.graphics.drawText(
         this.frequencyAxisPosition(this.frequencyAxisValue(0.5)) -
            0.5 * this.graphics.font.width(text),
         this.plotBounds.y0 - yOffset,
         text
      );
   };

   // Draws the modulation.
   this.drawModulation = function(modulation, color, style) {
      this.graphics.antialiasing = true;
      this.graphics.pen = new Pen(color, 1, style);

      var frequencyAxisOrigin = this.frequencyAxisOrigin();

      var polyline = new Array();
      for (var i = 0; i != modulation.length; ++i) {
         if (modulation[i].x >= frequencyAxisOrigin) {
            polyline.push(new Point(
               this.frequencyAxisPosition(modulation[i].x),
               this.modulationAxisPosition(modulation[i].y)
            ));
         }
         else if (
            i != modulation.length - 1 &&
            modulation[i + 1].x > frequencyAxisOrigin
         ) {
            var p0 = modulation[i];
            var p1 = modulation[i + 1];
            polyline.push(new Point(
               this.frequencyAxisPosition(frequencyAxisOrigin),
               this.modulationAxisPosition(
                  (frequencyAxisOrigin - p0.x) /
                     (p1.x - p0.x) * (p1.y - p0.y) +
                  p0.y
               )
            ));
         }
      }
      this.graphics.drawPolyline(polyline);
   };

   // Draws the legend.
   this.drawLegend = function(opticsModulation, detectorModulation) {
      this.graphics.antialiasing = false;

      var x0Line = this.frequencyAxisPosition(this.frequencyAxisValue(0.70));
      var x1Line = this.frequencyAxisPosition(this.frequencyAxisValue(0.75));
      var xText = x1Line;

      var yIdeal = this.modulationAxisPosition(0.95);
      var ySagittal = this.modulationAxisPosition(0.85);
      var yMeridional = this.modulationAxisPosition(0.75);

      var xLow = this.plotBounds.x0 + 0.5 * this.plotMargin.x0;
      var xHigh = this.plotBounds.x1 + 0.5 * this.plotMargin.x1;
      var yLow = 0.05;
      var yHigh = 0.70;

      this.graphics.pen = new Pen(this.idealColor, 1, PenStyle_Solid);
      this.graphics.drawLine(x0Line, yIdeal, x1Line, yIdeal);

      this.graphics.pen = new Pen(this.estimateColor, 1, PenStyle_Solid);
      this.graphics.drawLine(x0Line, ySagittal, x1Line, ySagittal);

      this.graphics.pen = new Pen(this.estimateColor, 1, PenStyle_Dash);
      this.graphics.drawLine(x0Line, yMeridional, x1Line, yMeridional);

      this.graphics.pen = new Pen(0xff000000, 1);
      var xOffset = -this.graphics.font.width("m");
#iflt __PI_BUILD__ 1168
      var yOffset = -2 * this.graphics.font.descent;
#else
      var yOffset = -1 * this.graphics.font.descent;
#endif
      this.graphics.drawText(
         xText - xOffset, yIdeal - yOffset, "Diffraction limit"
      );
      this.graphics.drawText(
         xText - xOffset, ySagittal - yOffset, "Telescope sagittal"
      );
      this.graphics.drawText(
         xText - xOffset, yMeridional - yOffset, "Telescope meridional"
      );

      var threshold = 0.5;
      for (
         var i = 0;
         i != opticsModulation.length &&
            opticsModulation[i].x < this.frequencyOpticsAxisMax * threshold;
         ++i
      ) {
      }
      if (i != 0) {
         var p0 = opticsModulation[i - 1];
         var p1 = opticsModulation[i];
         var x = this.frequencyOpticsAxisMax * threshold;
         var y = (x - p0.x) / (p1.x - p0.x) * (p1.y - p0.y) + p0.y;
         var xWidth = this.graphics.font.width("Telescope");
         var xLabel = this.frequencyAxisPosition(
            x + this.frequencyAxisValue(0.05)
         );
         var yLabel = this.modulationAxisPosition(
            Math.max(yLow, Math.min(yHigh, y + 0.1))
         );
         this.graphics.drawText(
            Math.min(xHigh, xLabel + xWidth) - xWidth,
            yLabel - yOffset,
            "Telescope"
         );
      }

      var threshold = 0.25;
      for (
         var i = 0;
         i != detectorModulation.length &&
            detectorModulation[i].x < this.frequencyDetectorAxisMax * threshold;
         ++i
      ) {
      }
      if (i != 0) {
         var p0 = detectorModulation[i - 1];
         var p1 = detectorModulation[i];
         var x = this.frequencyDetectorAxisMax * threshold;
         var y = (x - p0.x) / (p1.x - p0.x) * (p1.y - p0.y) + p0.y;
         var xWidth = this.graphics.font.width("Telescope and Detector");
         var xLabel = this.frequencyAxisPosition(
            x - this.frequencyAxisValue(0.05)
         );
         var yLabel = this.modulationAxisPosition(
            Math.max(yLow, Math.min(yHigh, y - 0.1))
         );
         this.graphics.drawText(
            Math.max(xLow, xLabel - xWidth),
            yLabel - yOffset,
            "Telescope and Detector"
         );
      }
   };

   // Generates the modulation transfer function plot.
   // Sets model.modulationTransferFunctionPlot.
   this.generateModulationTransferFunctionPlot = function() {
      this.frequencyOpticsAxisMax = model.maximumSpatialFrequencyOptics;
      this.frequencyDetectorAxisMax = model.maximumSpatialFrequencyDetector;

      var scale = model.plotResolution / 96;
      var bitmap = new Bitmap(
         Math.ceil(scale * this.plotWidth), Math.ceil(scale * this.plotHeight)
      );
      bitmap.fill(0);
      this.graphics = new VectorGraphics(bitmap);
      this.graphics.scaleTransformation(scale);

      if (coreVersionBuild < 1189) {
         this.graphics.font = new Font(
            "Helvetica", 9 / (model.fontResolution / 96)
         );
      }
      else {
         this.graphics.font = new Font(
            "Open Sans", 9 / (model.fontResolution / 96)
         );
      }
#ifeq __PI_PLATFORM__ MACOSX
      if (coreVersionBuild < 1168) {
         this.graphics.font = new Font(
            "Helvetica", 12 / (model.fontResolution / 96)
         );
      }
#endif
      this.graphics.textAntialiasing = true;

      this.drawModulationMesh(
         {smallDelta: 0.05, largeDelta: 0.2}
      );
      this.drawFrequencyMesh(
         {delta: 1}
      );

      this.drawModulation(
         model.modulationTransferFunctionOpticsIdeal,
         this.idealColor,
         PenStyle_Solid
      );
      this.drawModulation(
         model.modulationTransferFunctionOpticsSagittal,
         this.estimateColor,
         PenStyle_Solid
      );
      this.drawModulation(
         model.modulationTransferFunctionOpticsMeridional,
         this.estimateColor,
         PenStyle_Dash
      );

      this.drawModulation(
         model.modulationTransferFunctionDetectorIdeal,
         this.idealColor,
         PenStyle_Solid
      );
      this.drawModulation(
         model.modulationTransferFunctionDetectorSagittal,
         this.estimateColor,
         PenStyle_Solid
      );
      this.drawModulation(
         model.modulationTransferFunctionDetectorMeridional,
         this.estimateColor,
         PenStyle_Dash
      );

      this.drawModulationAxis(
         {smallDelta: 0.05, largeDelta: 0.2}
      );
      this.drawFrequencyAxis(
         {delta: 1}
      );

      this.drawLegend(
         model.modulationTransferFunctionOpticsIdeal,
         model.modulationTransferFunctionDetectorIdeal
      );

      this.graphics.end();

      var image = new Image(
         bitmap.width, bitmap.height, 3, ColorSpace_RGB, 32, SampleType_Real
      );
      image.fill(1);
      image.blend(bitmap);
      bitmap.assign(new Bitmap());

      model.modulationTransferFunctionPlot.free();
      model.modulationTransferFunctionPlot = image;
   };
}

// ****************************************************************************
// EOF ModulationTransferFunctionPlot.js - Released 2016/12/30 00:00:00 UTC
