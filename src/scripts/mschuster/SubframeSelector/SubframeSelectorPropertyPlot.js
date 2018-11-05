// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// SubframeSelectorPropertyPlot.js - Released 2018-11-05T16:53:08Z
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

function julianDay(date) {
   if (date == "") {
      return 0.5;
   }

   // "yyyy-mm-dd hh:mm:ss"
   var year = parseInt(date.substring(0, 4), 10);
   var month = parseInt(date.substring(5, 7), 10);
   var day = parseInt(date.substring(8, 10), 10);
   var hour = parseInt(date.substring(11, 13), 10);
   var minute = parseInt(date.substring(14, 16), 10);
   var second = parseInt(date.substring(17, 19), 10);

   return 367.0 * year -
      Math.floor(7.0 * (year + Math.floor((month + 9.0) / 12.0)) / 4.0) +
      Math.floor(275.0 * month / 9.0) +
      day +
      1721013.5 +
      hour / 24.0 +
      minute / (24.0 * 60.0) +
      second / (24.0 * 3600.0) -
      0.5 * Math.sign(100.0 * year + month - 190002.5) +
      0.5;
}

function dayOfDate(date) {
   return Math.floor(julianDay(date) - parameters.siteLocalMidnight / 24.0);
}

function floatFormat(fmt, value) {
   if (value == 0.0) {
      return "0.0";
   }
   var logValue = Math.floor(Math.log10( Math.abs(value)));
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

function filterExponentZeros(s) {
   var f = "";
   var i = 0;
   for (; i != s.length && s.charAt(i) != "e" && s.charAt(i) != "E";) {
      f = f + s.charAt(i);
      ++i;
   }
   if (i == s.length) {
      return f;
   }
   f = f + s.charAt(i);
   ++i;
   if (i != s.length && s.charAt(i) == "+") {
      f = f + s.charAt(i);
      ++i;
   }
   else if (i != s.length && s.charAt(i) == "-") {
      f = f + s.charAt(i);
      ++i;
   }
   for (; i != s.length && s.charAt(i) == "0"; ++i) {
   }
   var d = 0;
   for (; i != s.length;) {
      f = f + s.charAt(i);
      ++i;
      ++d;
   }
   if (d == 0) {
      f = f + "0";
   }
   return f;
}

function fractionZeroCount(s) {
   var i = 0;
   for (; i != s.length && s.charAt(i) != "."; ++i) {
   }
   if (i == s.length) {
      return 0;
   }
   ++i;
   var z = 0;
   for (; i != s.length && "0" <= s.charAt(i) && s.charAt(i) <= "9"; ++i) {
      if (s.charAt(i) == "0") {
         ++z;
      }
      else {
         z = 0;
      }
   }
   return z;
}

function trimFractionZeros(s, z) {
   var f = "";
   var i = 0;
   for (; i != s.length && s.charAt(i) != ".";) {
      f = f + s.charAt(i);
      ++i;
   }
   if (i == s.length) {
      return f;
   }
   f = f + s.charAt(i);
   ++i;
   for (; i != s.length && "0" <= s.charAt(i) && s.charAt(i) <= "9";) {
      f = f + s.charAt(i);
      ++i;
   }
   var d = z;
   for (; f.length != 0 && f.charAt(f.length - 1) == "0" && d != 0; --d) {
      f = f.substring(0, f.length - 1);
   }
   for (; i != s.length;) {
      f = f + s.charAt(i);
      ++i;
   }
   return f;
}

function propertyPlotAxisDescription(minTick, maxTick, deltaTick, perTick) {
   // major tick data values: i * deltaTick for minTick <= i <= maxTick
   // minor ticks per major ticks: perTick
   // minor ticks: countTick
   // pixel spacing between minor ticks: spacingTick
   this.minTick = minTick;
   this.maxTick = maxTick;
   this.deltaTick = deltaTick;
   this.perTick = perTick;
   this.countTick = this.perTick * (this.maxTick - this.minTick);
   this.spacingTick = 20;

   this.format = "";

   this.minorTickSize = 2;
   this.majorTickSize = 4;

   this.useMinorTicks = true;

   this.minAxisExtension = 6;
   this.maxAxisExtension = 6;

   this.xTickOffset = 0;
   this.yTickOffset = 0;
   this.xLabelOffset = 0;
   this.yLabelOffset = 0;

   this.fractionZeroCount = 0;
}

function generatePropertyPlotAxisDescription(minimum, maximum, levels) {
   var min = minimum;
   var max = maximum;
   if (0.0 < min && min / (max - min) <= 1.0) {
      min = 0.0;
   }
   if (max < 0 && -max / (max - min) <= 1.0) {
      max = 0.0;
   }

   var delta = Math.pow(10.0, Math.floor(Math.log10((max - min) / levels)));
   var thresholds = [1.0, 2.0, 5.0, 10.0];
   var steps = [5, 4, 5, 5];

   var i = 0;
   var iDelta = thresholds[[i]] * delta;
   var iLevels = Math.ceil(max / iDelta) - Math.floor(min / iDelta) + 1;
   for (var j = 1; j != thresholds.length; ++j) {
      var jDelta = thresholds[[j]] * delta;
      var jLevels = Math.ceil(max / jDelta) - Math.floor(min / jDelta) + 1;

      if (Math.abs(jLevels - levels) <= Math.abs(iLevels - levels)) {
         i = j;
         iDelta = jDelta;
         iLevels = jLevels;
      }
   }

   return new propertyPlotAxisDescription(
      Math.floor(min / iDelta),
      Math.ceil(max / iDelta),
      iDelta,
      steps[[i]]
   );
}

function propertyPlotDescription(font) {
   this.bitmapWidth = 0;
   this.bitmapHeight = 0;

   this.xAxisDescription = null;
   this.yAxisDescription = null;
   this.sAxisDescription = null;

   this.xAxisOrigin = 0;
   this.yAxisOrigin = 0;

   this.xAxisSize = 0;
   this.yAxisSize = 0;

   this.xMinMarginSize = 0;
   this.xMaxMarginSize = 0;
   this.yMinMarginSize = 0;
   this.yMaxMarginSize = 0;
   this.sAxisMargin = 0;

   this.font = font;
   this.capHeight = Math.round(0.75 * font.ascent);

   this.lineWidth = 1;
   this.dotRadius = 2;
   this.crossRadius = 3;
   this.crossWidth = 2;
   this.lockedApprovedOffset = -4;
   this.lockedRejectedOffset = -6;

   this.maxLocateDistance = 20.0;

   this.ordinatePoint = function(index, ordinate) {
      var dx = this.xAxisDescription;
      var dy = this.yAxisDescription;
      return new Point(
         this.xAxisOrigin + ((index + 1) / dx.deltaTick - dx.minTick) *
            dx.perTick * dx.spacingTick,
         this.bitmapHeight - (
            this.yAxisOrigin + (ordinate / dy.deltaTick - dy.minTick) *
               dy.perTick * dy.spacingTick
         )
      );
   }
}

function propertyPlotPoint(approved, locked, index, ordinate, date) {
   this.approved = approved;
   this.locked = locked;
   this.index = index;
   this.ordinate = ordinate;
   this.date = date;
}

function propertyPlotPointCompare(a, b) {
   return a.index < b.index ? -1 : a.index > b.index ? 1 : 0;
}

function propertyPlotData(points, median, dispersion, minimum, maximum, items, name) {
   this.points = points;
   this.median = median;
   this.dispersion = dispersion;
   this.minimum = minimum;
   this.maximum = maximum;
   this.items = items;
   this.name = name;

   this.approved = 0;
   for (var i = 0; i != points.length; ++i) {
      if (points[i].approved) {
         ++this.approved;
      }
   }
}

function generateXAxisDescription(plotDescription, data, maxBitmapWidth) {
   var pd = plotDescription;
   var pdy = pd.yAxisDescription;

   var minIndex = data.points[0].index;
   var maxIndex = data.points[data.points.length - 1].index;
   var pdx = generatePropertyPlotAxisDescription(minIndex + 0, maxIndex + 1, 7);

   pdx.format = ordinateFormat(pdx.deltaTick);
   if (pdx.deltaTick < 1.0) {
      pdx.format = "%.0f";
   }

   pdx.useMinorTicks = pdx.deltaTick >= 5;

   pdx.xTickOffset = 0;
   pdx.yTickOffset = -Math.round(pd.font.lineSpacing);
   pdx.xLabelOffset = Math.round(0.7 * pd.font.width("M"));
   pdx.yLabelOffset = -Math.round(0.4 * pd.font.ascent);

   pd.xMinMarginSize = 0;
   pdy.fractionZeroCount = 3;
   for (var i = 1; i != pdy.maxTick - pdy.minTick + 1; ++i) {
      var text = filterExponentZeros(
         format(pdy.format, (i + pdy.minTick) * pdy.deltaTick)
      );
      pdy.fractionZeroCount = Math.min(pdy.fractionZeroCount, fractionZeroCount(text));
      pd.xMinMarginSize = Math.max(
         pd.xMinMarginSize, pd.font.width(text) - pdy.yTickOffset
      );
   }
   pd.xMinMarginSize = Math.max(
      pd.xMinMarginSize - pdy.fractionZeroCount * pd.font.width("0"),
      0.5 * pd.font.width(data.name)
   );
   pd.xMinMarginSize = Math.round(pd.xMinMarginSize + 1 * pd.font.width("M"));
   pd.xMaxMarginSize = Math.round(
      pdx.maxAxisExtension + pdx.xLabelOffset +
      pd.font.width("Index") + 1 * pd.font.width("M")
   );

   // perTick * spacingTick / deltaTick equals pixels per index
   var minPixelsPerIndex = 6;
   var maxPixelsPerIndex = 160;
   pdx.spacingTick = Math.min(
      pdx.spacingTick,
      Math.round(maxPixelsPerIndex * pdx.deltaTick / pdx.perTick)
   );
   pdx.spacingTick = Math.max(
      pdx.spacingTick,
      Math.round(minPixelsPerIndex * pdx.deltaTick / pdx.perTick)
   );
   for (;;) {
      pd.xAxisSize = pdx.countTick * pdx.spacingTick;
      pd.xAxisOrigin = pd.xMinMarginSize;
      pd.bitmapWidth = pd.xMinMarginSize + pd.xAxisSize + pd.xMaxMarginSize;
      if (
         pd.bitmapWidth <= maxBitmapWidth ||
         pdx.spacingTick == 1 ||
         pdx.spacingTick == Math.round(minPixelsPerIndex * pdx.deltaTick / pdx.perTick)
      ) {
         break;
      }
      --pdx.spacingTick;
   }
   //console.writeln("pixels per index: ", pdx.perTick * pdx.spacingTick / pdx.deltaTick);

   pd.xAxisDescription = pdx;
}

function generateYAxisDescription(plotDescription, data, maxBitmapHeight) {
   var pd = plotDescription;
   var pdy = generatePropertyPlotAxisDescription(data.minimum, data.maximum, 7);

   pdy.format = ordinateFormat(pdy.deltaTick);

   pdy.xTickOffset = -Math.round(pd.font.width(" ") + 1);
   pdy.yTickOffset = -Math.round(0.4 * pd.font.ascent);
   pdy.xLabelOffset = 0;
   pdy.yLabelOffset = pd.capHeight;

   pd.yMinMarginSize = Math.round(pd.font.lineSpacing + pd.capHeight);
   pd.yMaxMarginSize = Math.round(
      pdy.maxAxisExtension + pdy.yLabelOffset + 2.0 * pd.capHeight
   );

   for (;;) {
      pd.yAxisSize = pdy.countTick * pdy.spacingTick;
      pd.yAxisOrigin = pd.yMinMarginSize;
      pd.bitmapHeight = pd.yMinMarginSize + pd.yAxisSize + pd.yMaxMarginSize;
      if (pd.bitmapHeight <= maxBitmapHeight || pdy.spacingTick == 1) {
         break;
      }
      --pdy.spacingTick;
   }

   pd.yAxisDescription = pdy;
}

function generateSAxisDescription(plotDescription, data, maxBitmapHeight) {
   var pd = plotDescription;
   var pdy = pd.yAxisDescription;

   var pds;
   for (var levels = 6; levels != 8; ++levels) {
      pds = generatePropertyPlotAxisDescription(
         sigmaNormalize(data.minimum, data.median, data.dispersion),
         sigmaNormalize(data.maximum, data.median, data.dispersion),
         levels
      );
      pds.format = ordinateFormat(pds.deltaTick);

      for (;
         pds.minTick * pds.deltaTick >
         sigmaNormalize(pdy.minTick * pdy.deltaTick, data.median, data.dispersion);
         --pds.minTick
      ) {
      }
      for (;
         pds.minTick != pds.maxTick + 1 &&
         pds.minTick * pds.deltaTick <=
         sigmaNormalize(pdy.minTick * pdy.deltaTick, data.median, data.dispersion);
         ++pds.minTick
      ) {
      }

      for (;
         pds.maxTick * pds.deltaTick <
         sigmaNormalize(pdy.maxTick * pdy.deltaTick, data.median, data.dispersion);
         ++pds.maxTick
      ) {
      }
      for (;
         pds.maxTick != pds.minTick - 1 &&
         pds.maxTick * pds.deltaTick >
         sigmaNormalize(pdy.maxTick * pdy.deltaTick, data.median, data.dispersion);
         --pds.maxTick
      ) {
      }

      if (pds.maxTick - pds.minTick + 1 > 2) {
         break;
      }
   }

   pds.xTickOffset = Math.round(pd.font.width(" ") + 2);
   pds.yTickOffset = -Math.round(0.4 * pd.font.ascent);
   pds.xLabelOffset = 0;
   pds.yLabelOffset = Math.round(4.0 * pd.font.descent);

   pd.sAxisMargin = Math.round(pd.font.lineSpacing - pd.font.descent);

   pd.sAxisDescription = pds;
}

function generatePropertyPlotDescription(font, maxBitmapWidth, maxBitmapHeight, data) {
   var pd = new propertyPlotDescription(font);

   generateYAxisDescription(pd, data, maxBitmapHeight);
   generateXAxisDescription(pd, data, maxBitmapWidth);
   generateSAxisDescription(pd, data, maxBitmapHeight);

   return pd;
}

function locatePropertyPlot(plotDescription, data, locatePoint) {
   var minIndex = 0;
   var minDistance = Infinity;
   for (var i = 0; i != data.points.length; ++i) {
      var description = data.points[i];
      var point = plotDescription.ordinatePoint(description.index, description.ordinate);
      var distance = Math.sqrt(
         Math.pow(point.x - locatePoint.x, 2.0) +
         Math.pow(point.y - locatePoint.y, 2.0)
      );
      if (distance < minDistance) {
         minIndex = description.index;
         minDistance = distance;
      }
   }
   return minDistance < plotDescription.maxLocateDistance ? minIndex : null;
}

function chop(x) {
   return Math.abs(x) < 1.0e-6 ? 0 : x;
}

function generateXAxisFillingLines(plotDescription, data, graphics) {
   var pd = plotDescription;
   var bh = pd.bitmapHeight;
   var pdx = pd.xAxisDescription;

   graphics.antialiasing = false;
   graphics.pen = new Pen(0xffd8d8d8, pd.lineWidth, PenStyle_Dash);

   for (var i = 0; i != data.points.length; ++i) {
      var value = (data.points[i].index + 1) / pdx.deltaTick;
      if (chop(Math.round(value) - value) == 0) {
         var point = pd.ordinatePoint(data.points[i].index, data.points[i].ordinate);
         graphics.drawLine(point.x, point.y, point.x, bh - (pd.yAxisOrigin));
      }
   }
}

function generateMedianDispersionLines(plotDescription, data, graphics) {
   var pd = plotDescription;
   var bh = pd.bitmapHeight;
   var pdx = pd.xAxisDescription;

   graphics.antialiasing = false;
   graphics.pen = new Pen(0xffc0c0c0, pd.lineWidth, PenStyle_Dash);

   graphics.drawLine(
      pd.ordinatePoint(pdx.minTick * pdx.deltaTick - 1, data.median),
      pd.ordinatePoint(pdx.maxTick * pdx.deltaTick - 1, data.median)
   );
   graphics.drawLine(
      pd.ordinatePoint(pdx.minTick * pdx.deltaTick - 1, data.median + data.dispersion),
      pd.ordinatePoint(pdx.maxTick * pdx.deltaTick - 1, data.median + data.dispersion)
   );
   graphics.drawLine(
      pd.ordinatePoint(pdx.minTick * pdx.deltaTick - 1, data.median - data.dispersion),
      pd.ordinatePoint(pdx.maxTick * pdx.deltaTick - 1, data.median - data.dispersion)
   );
}

function generateXAxis(plotDescription, data, graphics) {
   var pd = plotDescription;
   var bh = pd.bitmapHeight;
   var pdx = pd.xAxisDescription;

   graphics.antialiasing = false;
   graphics.pen = new Pen(0xff000000, pd.lineWidth);

   graphics.drawLine(
      pd.xAxisOrigin - pdx.minAxisExtension, bh - (pd.yAxisOrigin),
      pd.xAxisOrigin + pd.xAxisSize + pdx.maxAxisExtension, bh - (pd.yAxisOrigin)
   );

   for (var i = 1; i != pdx.countTick + 1; ++i) {
      var phase = i % pdx.perTick;
      var value = ((i / pdx.perTick) + pdx.minTick) * pdx.deltaTick;
      if (chop(Math.round(value) - value) == 0 && (pdx.useMinorTicks || phase == 0)) {
         graphics.drawLine(
            pd.xAxisOrigin + i * pdx.spacingTick,
            bh - (pd.yAxisOrigin),
            pd.xAxisOrigin + i * pdx.spacingTick,
            bh - (pd.yAxisOrigin + (phase != 0 ? pdx.minorTickSize : pdx.majorTickSize))
         );
      }
   }

   for (var i = 1; i != pdx.maxTick - pdx.minTick + 1; ++i) {
      var value = (i + pdx.minTick) * pdx.deltaTick;
      if (chop(Math.round(value) - value) == 0) {
         var text = filterExponentZeros(format(pdx.format, value));
         graphics.drawText(
            pd.xAxisOrigin + i * pdx.spacingTick * pdx.perTick + pdx.xTickOffset -
               0.5 * pd.font.width(text),
            bh - (pd.yAxisOrigin + pdx.yTickOffset),
            text
         );
      }
   }

   var text = "Index";
   graphics.drawText(
      pd.xAxisOrigin + pd.xAxisSize + pdx.maxAxisExtension + pdx.xLabelOffset,
      bh - (pd.yAxisOrigin + pdx.yLabelOffset),
      text
   );
}

function generateYAxis(plotDescription, data, graphics) {
   var pd = plotDescription;
   var bh = pd.bitmapHeight;
   var pdy = pd.yAxisDescription;

   graphics.antialiasing = false;
   graphics.pen = new Pen(0xff000000, pd.lineWidth);

   graphics.drawLine(
      pd.xAxisOrigin,
      bh - (pd.yAxisOrigin - pdy.minAxisExtension),
      pd.xAxisOrigin,
      bh - (pd.yAxisOrigin + pd.yAxisSize + pdy.maxAxisExtension)
   );

   for (var i = 1; i != pdy.countTick + 1; ++i) {
      var phase = i % pdy.perTick;
      if (pdy.useMinorTicks || phase == 0) {
         graphics.drawLine(
            pd.xAxisOrigin,
            bh - (pd.yAxisOrigin + i * pdy.spacingTick),
            pd.xAxisOrigin + (phase != 0 ? pdy.minorTickSize : pdy.majorTickSize),
            bh - (pd.yAxisOrigin + i * pdy.spacingTick)
         );
      }
   }

   for (var i = 1; i != pdy.maxTick - pdy.minTick + 1; ++i) {
      var value = (i + pdy.minTick) * pdy.deltaTick;
      var text = trimFractionZeros(
         filterExponentZeros(format(pdy.format, value)),
         pdy.fractionZeroCount
      );
      graphics.drawText(
         pd.xAxisOrigin - pd.font.width(text) + pdy.xTickOffset,
         bh - (pd.yAxisOrigin + i * pdy.spacingTick * pdy.perTick + pdy.yTickOffset),
         text
      );
   }

   graphics.drawText(
      pd.xAxisOrigin - 0.5 * pd.font.width(data.name) + pdy.xLabelOffset,
      bh - (pd.yAxisOrigin + pd.yAxisSize + pdy.maxAxisExtension + pdy.yLabelOffset),
      data.name +
         " (" +
         format("%d", data.approved) +
         " approved/" +
         format("%d", data.points.length) +
         ")"
   );
}

function generateSAxis(plotDescription, data, graphics) {
   var pd = plotDescription;
   var bh = pd.bitmapHeight;
   var pdx = pd.xAxisDescription;
   var pdy = pd.yAxisDescription;
   var pds = pd.sAxisDescription;

   graphics.antialiasing = false;
   graphics.pen = new Pen(0xff000000, pd.lineWidth);

   graphics.drawLine(
      pd.xAxisOrigin + pd.xAxisSize,
      bh - (pd.yAxisOrigin),
      pd.xAxisOrigin + pd.xAxisSize,
      bh - (pd.yAxisOrigin + pd.yAxisSize + pdy.maxAxisExtension)
   );

   for (var i = 0; i != pds.maxTick - pds.minTick + 1; ++i) {
      var value = (i + pds.minTick) * pds.deltaTick;
      var text = trimFractionZeros(
         filterExponentZeros(format(pds.format, value)),
         pds.fractionZeroCount
      );
      var valueDenormalized = sigmaDenormalize(value, data.median, data.dispersion);
      var point = pd.ordinatePoint(pdx.maxTick * pdx.deltaTick - 1, valueDenormalized);
      graphics.drawLine(
         point.x - pds.majorTickSize, point.y,
         point.x, point.y
      );
      if (point.y < bh - (pd.yAxisOrigin + pd.sAxisMargin)) {
         graphics.drawText(
            point.x + pds.xTickOffset,
            point.y - pds.yTickOffset,
            text
         );
      }
   }

   var text = "Sigma";
   graphics.drawText(
      pd.xAxisOrigin + pd.xAxisSize - 0.5 * pd.font.width(text) + pds.xLabelOffset,
      bh - (pd.yAxisOrigin + pd.yAxisSize + pds.maxAxisExtension + pds.yLabelOffset),
      text
   );
}

function generateDataLines(plotDescription, data, graphics) {
   var pd = plotDescription;

   graphics.antialiasing = true;
   var darkPen = new Pen(0xff909090, pd.lineWidth);
   var lightPen = new Pen(0xffd8d8d8, pd.lineWidth);

   for (var i = 0; i != data.points.length - 1; ++i) {
      graphics.pen = parameters.siteLocalMidnight == 24 ||
         dayOfDate(data.points[i].date) == dayOfDate(data.points[i + 1].date) ?
         darkPen :
         lightPen;
      graphics.drawLine(
         pd.ordinatePoint(data.points[i].index, data.points[i].ordinate),
         pd.ordinatePoint(data.points[i + 1].index, data.points[i + 1].ordinate)
      );
   }
}

function generateDataPoints(plotDescription, data, graphics) {
   var pd = plotDescription;

   graphics.antialiasing = true;
   graphics.pen = new Pen(0xff000000, pd.crossWidth);
   var brush = new Brush(0xff000000);

   for (var i = 0; i != data.points.length; ++i) {
      var point = pd.ordinatePoint(data.points[i].index, data.points[i].ordinate);
      if (data.points[i].approved) {
         graphics.fillCircle(point, pd.dotRadius, brush);
         if (data.points[i].locked) {
            graphics.drawLine(
               point.x - pd.crossRadius + 1, point.y + pd.lockedApprovedOffset,
               point.x + pd.crossRadius, point.y + pd.lockedApprovedOffset
            );
         }
      }
      if (!data.points[i].approved) {
         graphics.drawLine(
            point.x - pd.crossRadius, point.y - pd.crossRadius,
            point.x + pd.crossRadius, point.y + pd.crossRadius
         );
         graphics.drawLine(
            point.x - pd.crossRadius, point.y + pd.crossRadius,
            point.x + pd.crossRadius, point.y - pd.crossRadius
         );
         if (data.points[i].locked) {
            graphics.drawLine(
               point.x - pd.crossRadius, point.y + pd.lockedRejectedOffset,
               point.x + pd.crossRadius, point.y + pd.lockedRejectedOffset
            );
         }
      }
   }
}

function generatePropertyPlotBitmap(plotDescription, data) {
   var bitmap = new Bitmap(plotDescription.bitmapWidth, plotDescription.bitmapHeight);
   bitmap.fill(0x00000000);

   var graphics = new Graphics(bitmap);
   graphics.transparentBackground = true;
   graphics.font = plotDescription.font;

   generateXAxisFillingLines(plotDescription, data, graphics);
   generateMedianDispersionLines(plotDescription, data, graphics);
   generateXAxis(plotDescription, data, graphics);
   generateYAxis(plotDescription, data, graphics);
   generateSAxis(plotDescription, data, graphics);
   generateDataLines(plotDescription, data, graphics);
   generateDataPoints(plotDescription, data, graphics);

   graphics.end();

   return bitmap;
}

function generatePropertyPlotData(propertyPlotOrdinate) {
   var resolutionGain =
      parameters.cameraResolutionValues[parameters.cameraResolution] *
      parameters.actualCameraGain();

   var points = [];
   for (var i = 0; i != parameters.evaluationsDescriptions.length; ++i) {
      var description = parameters.evaluationsDescriptions[i];
      points.push(new propertyPlotPoint(
         description.checked,
         description.locked,
         description.index,
         [
         function(d) {return d.weight;},
         function(d) {return parameters.actualSubframeScale() * d.FWHM;},
         function(d) {return d.eccentricity;},
         function(d) {return d.SNRWeight;},
         function(d) {return resolutionGain * pedestalFunction(d.median);},
         function(d) {return resolutionGain * d.dispersion;},
         function(d) {return resolutionGain * d.noise;},
         function(d) {return d.starSupport;},
         function(d) {return d.starResidual;},
         function(d) {return d.noiseSupport;},
         function(d) {return parameters.actualSubframeScale() * d.FWHMMeanDeviation;},
         function(d) {return d.eccentricityMeanDeviation;},
         function(d) {return d.starResidualMeanDeviation;}
         ][propertyPlotOrdinate](description),
         description.date
      ))
   }
   points.sort(propertyPlotPointCompare);

   var minimum = points[0].ordinate;
   var maximum = points[0].ordinate;
   var ordinates = [];
   for (var i = 0; i != points.length; ++i) {
      minimum = Math.min(minimum, points[i].ordinate);
      maximum = Math.max(maximum, points[i].ordinate);
      ordinates.push(points[i].ordinate);
   }
   if (minimum == maximum) {
      var delta = minimum == 0.0 ? 0.05 : 0.05 * minimum;
      minimum -= delta;
      maximum += delta;
   }

   var medianDispersion = medianMeanDeviationOfArray(ordinates);
   minimum = Math.min(minimum, medianDispersion[0] - medianDispersion[1]);
   maximum = Math.max(maximum, medianDispersion[0] + medianDispersion[1]);

   return new propertyPlotData(
      points,
      medianDispersion[0],
      medianDispersion[1],
      minimum,
      maximum,
      parameters.targetSubframeDescriptions.length,
      parameters.propertyPlotOrdinateName(propertyPlotOrdinate)
   );
}

// ----------------------------------------------------------------------------
// EOF SubframeSelectorPropertyPlot.js - Released 2018-11-05T16:53:08Z
