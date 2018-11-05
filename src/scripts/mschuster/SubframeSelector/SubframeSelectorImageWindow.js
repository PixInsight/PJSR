// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// SubframeSelectorImageWindow.js - Released 2018-11-05T16:53:08Z
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

function uniqueViewId(baseId) {
   var id = baseId;
   for (var i = 1; !View.viewById(id).isNull; ++i) {
      id = baseId + format("%02d", i);
   }
   return id;
}

function filterViewId(id) {
   var fId = "";
   if (id.length == 0) {
      return "_";
   }
   var c = id.charAt(0);
   if ("0" <= c && c <= "9") {
      fId = fId + "_";
   }
   for (var i = 0; i != id.length; ++i) {
      c = id.charAt(i);
      fId = fId + ((
         ("0" <= c && c <= "9") ||
         ("a" <= c && c <= "z") ||
         ("A" <= c && c <= "Z")
      ) ? c : "_");
      if (fId.length > 3 && fId.substring(fId.length - 4, fId.length) == "____") {
         fId = fId.substring(0, fId.length - 1);
      }
   }
   return fId;
}

function generatePlotImageWindow(bitmap, id) {
   var plotImageWindow = new ImageWindow(
      bitmap.width,
      bitmap.height,
      3,
      8,
      false,
      true,
      uniqueViewId(TITLE + "_" + id)
   );

   var backgroundBitmap = new Bitmap(bitmap.width, bitmap.height);
   backgroundBitmap.fill(0xffffffff);

   with (plotImageWindow.mainView) {
      beginProcess(UndoFlag_NoSwapFile);
      with (image) {
         blend(backgroundBitmap);
         blend(bitmap);
      }
      endProcess();
   }

   return plotImageWindow;
}

function generateStarMapImageWindow(imageWindow, id, starDescriptions) {
   var residuals = [];
   for (var i = 0; i != starDescriptions.length; ++i) {
      var description = starDescriptions[i];
      residuals.push(description.residual);
   }
   var residualMedianDispersion = medianMeanDeviationOfArray(residuals);
   if (residualMedianDispersion[1] == 0.0) {
      residualMedianDispersion[1] = 1.0;
   }
   //console.writeln("StarResidual median: ", residualMedianDispersion[0]);
   //console.writeln("StarResidual dispersion: ", residualMedianDispersion[1]);

   var targetImage = imageWindow.mainView.image;
   var starMapImageWindow = new ImageWindow(
      targetImage.width,
      targetImage.height,
      targetImage.numberOfChannels,
      32,
      true,
      targetImage.colorSpace != ColorSpace_Gray,
      uniqueViewId(imageWindow.mainView.id + "_" + id)
   );

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
   for (var i = 0; i != starDescriptions.length; ++i) {
      var description = starDescriptions[i];
      bounds.moveTo(
         Math.round(description.x),
         Math.round(description.y)
      );
      bounds.moveBy(
         -0.5 * (barycenterBitmap.width - 1),
         -0.5 * (barycenterBitmap.height - 1)
      );
      graphics.drawScaledBitmap(bounds, barycenterBitmap);
      var label = format(
         "%.0f",
         (residuals[i] - residualMedianDispersion[0]) / residualMedianDispersion[1]
      );
      graphics.drawText(description.x + 2, description.y - 1, label);
   }
   graphics.end();

   imageWindow.createPreview(targetImage.bounds, "_");
   with (starMapImageWindow.mainView) {
      beginProcess(UndoFlag_NoSwapFile);
      with (image) {
         selectedPoint = new Point(0, 0);
         apply(imageWindow.previewById("_").image);
         blend(overlayBitmap);
         resetSelections();
      }
      endProcess();
   }
   imageWindow.deletePreview(imageWindow.previewById("_"));

   return starMapImageWindow;
}

// ----------------------------------------------------------------------------
// EOF SubframeSelectorImageWindow.js - Released 2018-11-05T16:53:08Z
