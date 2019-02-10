// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// SubframeSelectorContourPlot.js - Released 2018-11-05T16:53:08Z
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

function partitionStarDescriptions(descriptions, width, height, rows, columns) {
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
         for (var k = 0; k != descriptions.length; ++k) {
            var description = descriptions[k];
            if (
               bounds.left <= description.x && description.x < bounds.right &&
               bounds.top <= description.y && description.y < bounds.bottom
            ) {
               tileDescriptions.push(description);
            }
         }
         row.push(tileDescriptions);
      }
      partition.push(row);
   }

   return partition;
}

function minimumStarDescriptionPartitionTileSize(partition, rows, columns) {
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
         var descriptions = partition[i][j];
         var FWHMs = [];
         for (var k = 0; k != descriptions.length; ++k) {
            var description = descriptions[k];
            FWHMs.push(
               parameters.actualSubframeScale() *
               parameters.modelScaleFactors[parameters.modelFunction] *
               Math.sqrt(description.sx * description.sy)
            );
         }
         row.push(medianMeanDeviationOfArray(FWHMs)[0]);
      }
      FWHMPartition.push(row);
   }
   return FWHMPartition;
}

function generateEccentricityPartition(partition, rows, columns) {
   var EccentricityPartition = [];
   for (var i = 0; i != rows; ++i) {
      var row = [];
      for (var j = 0; j != columns; ++j) {
         var descriptions = partition[i][j];
         var Eccentricitys = [];
         for (var k = 0; k != descriptions.length; ++k) {
            var description = descriptions[k];
            Eccentricitys.push(
               Math.sqrt(1.0 - Math.pow(description.sy / description.sx, 2.0))
            );
         }
         row.push(medianMeanDeviationOfArray(Eccentricitys)[0]);
      }
      EccentricityPartition.push(row);
   }
   return EccentricityPartition;
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

function applyToImageWindowImages(imageWindow, images) {
   with (imageWindow.mainView) {
      beginProcess(UndoFlag_NoSwapFile);
      with (image) {
         fill(1.0);
         for (var i = 0; i != images.length; ++i) {
            selectedPoint = images[i][0];
            apply(images[i][1]);
         }
         resetSelections();
      }
      endProcess();
   }
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
      columns, rows, 1, 32, true, false, uniqueViewId(id + "_map")
   );
   applyToImageWindowImages(resampleImageWindow, [[new Point(0, 0), resampleImage]]);

   var marginWidth = Math.round(resampleWidth / (columns - 1));
   var marginHeight = Math.round(resampleHeight / (rows - 1));
   var resample = new Resample;
   with (resample) {
      absoluteMode = ForceWidthAndHeight;
      clampingThreshold = 0.3;
      interpolation = BicubicSpline;
      mode = AbsolutePixels;
      xSize = resampleWidth + marginWidth;
      ySize = resampleHeight + marginHeight;
   }
   resample.executeOn(resampleImageWindow.mainView, false);
   console.abortEnabled = true;

   var crop = new Crop;
   with (crop) {
      leftMargin = 0;
      rightMargin = -marginWidth;
      topMargin = 0;
      bottomMargin = -marginHeight;
      mode = AbsolutePixels;
   }
   crop.executeOn(resampleImageWindow.mainView, false);
   console.abortEnabled = true;

   return resampleImageWindow;
}

function quantizeImageWindow(
   imageWindow, minTick, maxTick, delta, colorBias, colorScale
) {
   var pixelMath = new PixelMath;
   with (pixelMath) {
      var pixelScale = colorScale / (maxTick - minTick);
      var pixelBias = colorBias - pixelScale * minTick;
      expression =
         format("%f + %f * floor(%f * $target)", pixelBias, pixelScale, 1.0 / delta);
      rescale = false;
      truncate = true;
      truncateLower = 0.0;
      truncateUpper = 1.0;
      useSingleExpression = true;
   }
   pixelMath.executeOn(imageWindow.mainView, false);
   console.abortEnabled = true;

   return imageWindow;
}

function createTitleImage(width, height, font, title) {
   var bitmap = new Bitmap(width, height);
   bitmap.fill(0);

   var graphics = new Graphics(bitmap);
   graphics.font = font;
   with (graphics) {
      drawText(0.5 * (bitmap.width -font.width(title)), font.ascent, title);
      end();
   }

   var titleImage = new Image(
      bitmap.width, bitmap.height, 1, ColorSpace_Gray, 32, SampleType_Real
   );
   with (titleImage) {
      fill(1.0);
      blend(bitmap);
   }

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
   with (graphics) {
      var rects = new Array;
      for (var i = 0; i != labelCandidates.length; ++i) {
         for (var j = 0; j != labelCandidates[i].length; ++j) {
            var candidate = labelCandidates[i][j];
            var text = format(
               ordinateFormat(delta),
               delta * (candidate[2] - pixelBias) / pixelScale
            );

            var halfWidth = Math.round(0.5 * font.width(text));
            var halfAscent = Math.round(0.5 * font.ascent);
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

            drawText(
               candidate[0] - halfWidth,
               candidate[1] + halfAscent - 1,
               text
            );
            rects.push(rect);
            //strokeRect(rect);
            break;
         }
      }
      end();
   }

   var contourImage = new Image(
      bitmap.width, bitmap.height, 1, ColorSpace_Gray, 32, SampleType_Real
   );
   with(contourImage) {
      assign(targetImage);
      blend(bitmap);
   }

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
      contourWidth, contourHeight, 1, 32, true, false, uniqueViewId(id)
   );
   applyToImageWindowImages(contourImageWindow, [
      [new Point(separationSize, separationSize), titleImage],
      [new Point(separationSize, titleHeight + 2 * separationSize), contourImage],
   ]);

   resampleImageWindow.forceClose();

   return contourImageWindow;
}

// ----------------------------------------------------------------------------
// EOF SubframeSelectorContourPlot.js - Released 2018-11-05T16:53:08Z
