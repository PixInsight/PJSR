// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// EncircledEnergyFunctionPlot.js - Released 2016/12/30 00:00:00 UTC
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

function EncircledEnergyFunctionPlot(model) {
   // Graphics.
   this.generateSVG = false;
   this.graphics = null;

   // Plot size and margin.
   this.plotWidth = 530;
   this.plotHeight = 372;
   this.plotMargin = new Rect(50, 50, 60, 50);

   // Tick size.
   this.smallTickSize = 2;
   this.largeTickSize = 4;

   // Axis offset.
   this.axisOffset = 10;

   // Encircled energy axis.
   this.encircledEnergyAxisMax = 1;

   // Diameter micron axis.
   this.diameterMicronAxisMax = 0;

   // Diameter arcsec axis.
   this.diameterArcsecAxisMax = 0;

   // Colors
   this.meshColor = 0xffe8e8e8;
   this.idealColor = 0xff8080cf;
   this.estimateColor = 0xffcf8080;
   this.encircledEnergyColor = 0xffb0b0b0;

   // Plot bounds.
   this.plotBounds = new Rect(
      this.plotMargin.x0, this.plotMargin.y0,
      this.plotWidth - this.plotMargin.x1, this.plotHeight - this.plotMargin.y1
   );

   // Gives the vertical plot position of an encircled energy axis value.
   this.energyAxisPosition = function(value) {
      return (1 - value / this.encircledEnergyAxisMax) *
         (this.plotBounds.y1 - this.plotBounds.y0) +
         this.plotBounds.y0;
   };

   // Gives the horizontal plot position of a diameter micron axis value.
   this.micronAxisPosition = function(value) {
      return (value / this.diameterMicronAxisMax) *
         (this.plotBounds.x1 - this.plotBounds.x0 - this.axisOffset) +
         this.plotBounds.x0 + this.axisOffset;
   };

   // Gives the horizontal plot position of a diameter arcsec axis value.
   this.arcsecAxisPosition = function(value) {
      return (value / this.diameterArcsecAxisMax) *
         (this.plotBounds.x1 - this.plotBounds.x0 - this.axisOffset) +
         this.plotBounds.x0 + this.axisOffset;
   };

   // Draws the encircled energy mesh.
   this.drawEncircledEnergyMesh = function(metrics) {
      this.graphics.antialiasing = false;
      this.graphics.pen = new Pen(this.meshColor, 1);

      // mesh.
      for (
         var value = 0;
         value <= this.encircledEnergyAxisMax;
         value += metrics.largeDelta
      ) {
         var y = this.energyAxisPosition(value, this);
         this.graphics.drawLine(
            this.plotBounds.x0, y,
            this.plotBounds.x1, y
         );
      }
      var y = this.energyAxisPosition(0.5 * this.encircledEnergyAxisMax, this);
      this.graphics.drawLine(
         this.plotBounds.x0, y,
         this.plotBounds.x1, y
      );
   };

   // Gives axis metrics.
   this.axisMetrics = function(maximum) {
      var p = Math.log10(maximum / 4);
      var ip = Math.floor(p);
      var fp = p - ip;
      var jp = Math.pow10(ip);
      if (fp >= Math.log10(4)) {
         return {smallDelta: jp * 1, largeDelta: jp * 5};
      }
      if (fp >= Math.log10(2)) {
         return {smallDelta: jp * 0.5, largeDelta: jp * 2};
      }
      return {smallDelta: jp * 0.2, largeDelta: jp * 1};
   };

   // Gives axis label format.
   this.axisLabelFormat = function(metrics) {
      return "%." + format(
         "%d", Math.max(0, -Math.floor(Math.log10(metrics.largeDelta)))
      ) + "f";
   };

   // Draws the encircled energy axis.
   this.drawEncircledEnergyAxis = function(metrics) {
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
         value <= this.encircledEnergyAxisMax;
         value += metrics.smallDelta
      ) {
         var y = this.energyAxisPosition(value);
         this.graphics.drawLine(
            this.plotBounds.x0, y,
            this.plotBounds.x0 + this.smallTickSize, y
         );
      }

      // Draw large ticks.
      for (
         var value = 0;
         value <= this.encircledEnergyAxisMax;
         value += metrics.largeDelta
      ) {
         var y = this.energyAxisPosition(value, this);
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
         value <= this.encircledEnergyAxisMax;
         value += metrics.largeDelta
      ) {
         var text = format(
            value == 1 ?
               "%.0f%%" :
               "%.0f", 100 * (value / this.encircledEnergyAxisMax)
         );
         var xOffset = this.graphics.font.width(text + " ") + 1;
         var y = this.energyAxisPosition(value);
         this.graphics.drawText(
            this.plotBounds.x0 - xOffset, y - yOffset,
            text
         );
      }

      this.graphics.pushState();
      this.graphics.rotateTransformation(90 * Math.PI / 180);
      var xOffset = 2.0 * this.graphics.font.height;
      var text = "Encircled Energy";
      this.graphics.drawText(
         -this.energyAxisPosition(0.5) - 0.5 * this.graphics.font.width(text),
         this.plotBounds.x0 - xOffset,
         text
      );
      this.graphics.resetTransformation();
      this.graphics.popState();
   };

   // Draws the diameter micron mesh.
   this.drawDiameterMicronMesh = function(metrics) {
      this.graphics.antialiasing = false;
      this.graphics.pen = new Pen(this.meshColor, 1);

      // Draw mesh.
      for (
         var value = 0;
         value <= this.diameterMicronAxisMax;
         value += metrics.largeDelta
      ) {
         var x = this.micronAxisPosition(value);
         this.graphics.drawLine(
            x, this.plotBounds.y1,
            x, this.plotBounds.y0
         );
      }
   };

   // Draws the diameter micron axis.
   this.drawDiameterMicronAxis = function(metrics) {
      this.graphics.antialiasing = false;
      this.graphics.pen = new Pen(0xff000000, 1);

      // Draw axis.
      this.graphics.drawLine(
         this.plotBounds.x0, this.plotBounds.y1,
         this.plotBounds.x1, this.plotBounds.y1
      );

      // Draw small ticks.
      for (
         var value = 0;
         value <= this.diameterMicronAxisMax;
         value += metrics.smallDelta
      ) {
         var x = this.micronAxisPosition(value);
         this.graphics.drawLine(
            x, this.plotBounds.y1,
            x, this.plotBounds.y1 - this.smallTickSize
         );
      }

      // Draw large ticks.
      for (
         var value = 0;
         value <= this.diameterMicronAxisMax;
         value += metrics.largeDelta
      ) {
         var x = this.micronAxisPosition(value);
         this.graphics.drawLine(
            x, this.plotBounds.y1,
            x, this.plotBounds.y1 - this.largeTickSize
         );
      }

      // Draw labels.
      var yOffset = -(
         0.25 * this.graphics.font.height + this.graphics.font.ascent
      );
      for (
         var value = 0;
         value <= this.diameterMicronAxisMax;
         value += metrics.largeDelta
      ) {
         var text = format(this.axisLabelFormat(metrics), value);
         var xOffset = 0.5 * this.graphics.font.width(text) - 1;
         var x = this.micronAxisPosition(value);
         this.graphics.drawText(
            x - xOffset, this.plotBounds.y1 - yOffset,
            text
         );
      }

      var xOffset = -this.graphics.font.width("m");
#iflt __PI_BUILD__ 1168
      var yOffset = -2 * this.graphics.font.descent;
#else
      var yOffset = -1 * this.graphics.font.descent;
#endif
      this.graphics.drawText(
         this.plotBounds.x1 - xOffset, this.plotBounds.y1 - yOffset,
         "μm"
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
      var text = "Diameter";
      this.graphics.drawText(
         this.micronAxisPosition(0.5 * this.diameterMicronAxisMax) -
            0.5 * this.graphics.font.width(text),
         this.plotBounds.y1 - yOffset,
         text
      );
   };

   // Draws the diameter arcsec axis.
   this.drawDiameterArcsecAxis = function(metrics) {
      this.graphics.antialiasing = false;
      this.graphics.pen = new Pen(0xff000000, 1);

      // Draw axis.
      this.graphics.drawLine(
         this.plotBounds.x0, this.plotBounds.y0,
         this.plotBounds.x1, this.plotBounds.y0
      );

      // Draw small ticks.
      for (
         var value = 0;
         value <= this.diameterArcsecAxisMax;
         value += metrics.smallDelta
      ) {
         var x = this.arcsecAxisPosition(value);
         this.graphics.drawLine(
            x, this.plotBounds.y0,
            x, this.plotBounds.y0 + this.smallTickSize
         );
      }

      // Draw large ticks.
      for (
         var value = 0;
         value <= this.diameterArcsecAxisMax;
         value += metrics.largeDelta
      ) {
         var x = this.arcsecAxisPosition(value);
         this.graphics.drawLine(
            x, this.plotBounds.y0,
            x, this.plotBounds.y0 + this.largeTickSize
         );
      }

      // Draw labels.
      var yOffset =
         0.25 * this.graphics.font.height + this.graphics.font.descent;
      for (
         var value = 0;
         value <= this.diameterArcsecAxisMax;
         value += metrics.largeDelta
      ) {
         var text = format(this.axisLabelFormat(metrics), value);
         var xOffset = 0.5 * this.graphics.font.width(text) - 1;
         var x = this.arcsecAxisPosition(value);
         this.graphics.drawText(
            x - xOffset, this.plotBounds.y0 - yOffset,
            text
         );
      }

      var xOffset = -this.graphics.font.width("m");
#iflt __PI_BUILD__ 1168
      var yOffset = -2 * this.graphics.font.descent;
#else
      var yOffset = -1 * this.graphics.font.descent;
#endif
      this.graphics.drawText(
         this.plotBounds.x1 - xOffset, this.plotBounds.y0 - yOffset,
         "arcsec"
      );

      var yOffset = 1.75 * this.graphics.font.height;
      var text = "Encircled Energy Function";
      this.graphics.drawText(
         this.arcsecAxisPosition(0.5 * this.diameterArcsecAxisMax) -
            0.5 * this.graphics.font.width(text),
         this.plotBounds.y0 - yOffset,
         text
      );
   };

   // Draws an encircled energy function.
   this.drawEncircledEnergyFunction = function(energyFunction, color) {
      this.graphics.antialiasing = true;
      this.graphics.pen = new Pen(color, 1);

      var polyline = new Array();
      for (var i = 0; i != energyFunction.length; ++i) {
         polyline.push(new Point(
            this.micronAxisPosition(1e6 * energyFunction[i].x),
            this.energyAxisPosition(energyFunction[i].y)
         ));
      }
      this.graphics.drawPolyline(polyline);
   };

   // Draws the encircled energy marker.
   this.drawEncircledEnergyMarker = function(diameter, label, color, percent) {
      if (diameter == 0) {
         return;
      }

      this.graphics.antialiasing = false;
      this.graphics.pen = new Pen(color, 1, PenStyle_Dash);

      // Draw lines.
      var x = this.micronAxisPosition(1e6 * diameter);
      this.graphics.drawLine(x, this.plotBounds.y0, x, this.plotBounds.y1);

      this.graphics.pen = new Pen(0xff000000, 1);

      // Draw label.
      var xOffset = 0.5 * this.graphics.font.width(label);
      if (percent) {
         var yOffset = this.graphics.font.height;
         this.graphics.drawText(
            x - xOffset, this.plotBounds.y1 - yOffset, label + "%"
         );
      }
      else {
         var yOffset = this.graphics.font.height + this.graphics.font.ascent;
         this.graphics.drawText(
#iflt __PI_BUILD__ 1168
            x - xOffset + 1.5, this.plotBounds.y0 + yOffset - 2, label
#else
            x - xOffset + 0.5, this.plotBounds.y0 + yOffset - 2, label
#endif
         );
      }
   };

   // Draws the legend.
   this.drawLegend = function() {
      this.graphics.antialiasing = false;

      var x0Line = this.micronAxisPosition(this.diameterMicronAxisMax * 0.75);
      var x1Line = this.micronAxisPosition(this.diameterMicronAxisMax * 0.80);
      var xText = x1Line;

      var yIdeal = this.energyAxisPosition(0.35);
      var yEstimate = this.energyAxisPosition(0.25);

      this.graphics.pen = new Pen(this.idealColor, 1);
      this.graphics.drawLine(x0Line, yIdeal, x1Line, yIdeal);

      this.graphics.pen = new Pen(this.estimateColor, 1);
      this.graphics.drawLine(x0Line, yEstimate, x1Line, yEstimate);

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
         xText - xOffset, yEstimate - yOffset, "Telescope"
      );
   };

   // Generates the encircled energy function plot.
   // Sets model.encircledEnergyPlot.
   this.generateEncircledEnergyFunctionPlot = function() {
      this.diameterMicronAxisMax =
         1e6 * model.encircledEnergyFunctionMaximumDiameter;
      this.diameterArcsecAxisMax =
         model.arcsecondsPerRadian *
         model.encircledEnergyFunctionMaximumDiameter / model.focalLength;

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

      this.drawEncircledEnergyMesh(this.axisMetrics(1));
      this.drawDiameterMicronMesh(this.axisMetrics(this.diameterMicronAxisMax));

      this.drawEncircledEnergyFunction(
         model.encircledEnergyFunctionIdeal, this.idealColor
      );
      this.drawEncircledEnergyFunction(
         model.encircledEnergyFunctionEstimate, this.estimateColor
      );

      this.drawEncircledEnergyMarker(
         model.strehlDiameterEstimate, "S D", this.encircledEnergyColor, false
      );
      this.drawEncircledEnergyMarker(
         model.encircledEnergyFunctionEE50Diameter,
         "EE 50",
         this.encircledEnergyColor,
         true
      );
      this.drawEncircledEnergyMarker(
         model.encircledEnergyFunctionEE80Diameter,
         "EE 80",
         this.encircledEnergyColor,
         true
      );

      this.drawEncircledEnergyAxis(this.axisMetrics(1));

      this.drawDiameterMicronAxis(
         this.axisMetrics(this.diameterMicronAxisMax)
      );
      this.drawDiameterArcsecAxis(
         this.axisMetrics(this.diameterArcsecAxisMax)
      );

      this.drawLegend();

      this.graphics.end();

      var image = new Image(
         bitmap.width, bitmap.height, 3, ColorSpace_RGB, 32, SampleType_Real
      );
      image.fill(1);
      image.blend(bitmap);
      bitmap.assign(new Bitmap());

      model.encircledEnergyPlot.free();
      model.encircledEnergyPlot = image;
   };
}

// ****************************************************************************
// EOF EncircledEnergyFunctionPlot.js - Released 2016/12/30 00:00:00 UTC
