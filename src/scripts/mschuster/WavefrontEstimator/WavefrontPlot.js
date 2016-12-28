// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// WavefrontPlot.js - Released 2016/12/30 00:00:00 UTC
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

function WavefrontPlot(model) {
   // Crop wavefront diameter scale.
   this.cropWavefrontDiameterScale = 1.1;

   // Resample wavefront size.
   this.resampleWavefrontSize = 501;

   // Wavefront boundary width.
   this.wavefrontBoundaryWidth = 0.01;

   // Contour quantile limits.
   this.contourQuantileMinimum = 0.001;
   this.contourQuantileMaximum = 0.999;

   // Contour shade limits.
   this.contourShadeMinimum = 0.15;
   this.contourShadeMaximum = 0.95;

   // Contour blend scale.
   this.contourBlendScale = 0.75;

   // Contour level count.
   this.contourLevels = 15;

   // Background contour level.
   this.backgroundContourLevel = 10;

   // Top and bottom legend bar pane margin size.
   this.legendBarMargin = 30;

   // Legend bar pane size.
   this.legendBarRows = this.resampleWavefrontSize;
   this.legendBarCols = 40;

   // Top and bottom label bar pane margin size.
   this.labelBarMargin = this.legendBarMargin;

   // Label bar pane size.
   this.labelBarRows = this.legendBarRows;
   this.labelBarCols = 60;

   // Label bar pane font and text offset.
   if (coreVersionBuild < 1189) {
      this.labelBarFont =
         new Font("Helvetica", 9 / (model.fontResolution / 96));
   }
   else {
      this.labelBarFont =
         new Font("Open Sans", 9 / (model.fontResolution / 96));
   }
#ifeq __PI_PLATFORM__ MACOSX
   if (coreVersionBuild < 1168) {
      this.labelBarFont =
         new Font("Helvetica", 12 / (model.fontResolution / 96));
   }
#endif
#iflt __PI_BUILD__ 1168
   this.labelBarTextOffset = new Point(5, this.labelBarFont.descent + 1);
#else
   this.labelBarTextOffset = new Point(5, this.labelBarFont.descent);
#endif

   // Gives the cropped wavefront.
   this.cropWavefront = function(wavefront, diameterScale) {
      var radius = Math.round(
         0.5 * diameterScale * model.defocusDiameterEstimate
      );
      var pad = wavefront.rows() - 2 * radius - 1;
      var low = Math.round(0.5 * pad);
      var high = pad - low;

      return wavefront.clone().stagePipeline([
         function(frame) {
            return frame.padRows(-low + 1, -high, 0);
         },
         function(frame) {
            return frame.padCols(-low + 1, -high, 0);
         }
      ]);
   };

   // Gives the resampled wavefront and scale.
   this.resampleWavefrontScale = function(wavefront, resampleSize) {
      var scale = model.plotResolution / 96;
      var resample = new Resample();
      resample.absoluteMode = Resample.prototype.ForceWidthAndHeight;
      resample.interpolation = Resample.prototype.Lanczos4;
      resample.mode = Resample.prototype.AbsolutePixels;
      resample.smoothness = 1.5;
      resample.xSize = Math.ceil(scale * resampleSize);
      resample.ySize = Math.ceil(scale * resampleSize);

      var identifierPrefix = model.identifierPrefix.trim() == "" ?
         "" :
         filterViewId(model.identifierPrefix);
      var imageWindow = wavefront.toImageWindow(
         uniqueViewId(identifierPrefix + "wavefront_contour_plot")
      );
      resample.executeOn(imageWindow.mainView, false);
      var resampleWavefront = new FrameReal(
         imageWindow.mainView.image.toMatrix()
      );
      imageWindow.close();

      return {
         wavefront: resampleWavefront,
         scale: Math.ceil(scale * resampleSize) / wavefront.rows()
      };
   };

   // Gives the wavefront boundary blend.
   this.wavefrontBoundary = function(wavefront, scale, width) {
      var apertureLow = 1.0;
      var apertureHigh = apertureLow + width;
      var obstructionHigh = model.defocusObstructionRatioEstimate;
      var obstructionLow = Math.max(0, obstructionHigh - width);

      var matrix = wavefront.matrix();
      var rows = matrix.rows;
      var cols = matrix.cols;
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var x = (col - 0.5 * (cols - 1)) /
               (scale * 0.5 * model.defocusDiameterEstimate);
            var y = (row - 0.5 * (rows - 1)) /
               (scale * 0.5 * model.defocusDiameterEstimate);
            var r = Math.sqrt(x * x + y * y);
            r =
               r > apertureHigh || r < obstructionLow ?
                  0 :
               apertureHigh >= r && r > apertureLow ?
                  perlinSmootherStep((apertureHigh - r) /
                     (apertureHigh - apertureLow)) :
               obstructionHigh > r && r >= obstructionLow ?
                  perlinSmootherStep((r - obstructionLow) /
                     (obstructionHigh - obstructionLow)) :
               1;
            newMatrix.at(row, col, r);
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives contour metrics.
   this.contourMetrics = function(
      wavefront, contourQuantileMinimum, contourQuantileMaximum, contourLevels
   ) {
      var array = wavefront.matrix().toArray();
      var min = array[selectArraySideEffect(
         array, 0, array.length,
         Math.round(contourQuantileMinimum * (array.length - 1))
      )];
      var max = array[selectArraySideEffect(
         array, 0, array.length,
         Math.round(contourQuantileMaximum * (array.length - 1))
      )];

      var scale = model.scaleWavefrontErrorEstimate / model.wavefrontSaveScale;
      var inverseScale = 1 / scale;
      var offset = model.wavefrontSaveOffset;

      var labelMin = Math.floor(scale * (min - offset));
      var labelMax = Math.ceil(scale * (max - offset));
      if (labelMin == labelMax) {
         --labelMin;
         ++labelMax;
      }
      var labelDelta = (labelMax - labelMin) / contourLevels;

      scale = Math.max(0.1, Math.min(
         1.0, Math.pow10(Math.floor(0.4 + Math.log10(labelDelta)))
      ));
      labelDelta = Math.ceil(labelDelta / scale) * scale;

      var offsetNm = Math.round(
         (labelMin + labelDelta * contourLevels - labelMax) / (2 * labelDelta)
      ) * labelDelta;
      labelMax = labelMin + labelDelta * contourLevels;
      labelMin -= offsetNm;
      labelMax -= offsetNm;

      if (labelMin < 0 && labelMax > 0) {
         var offsetNm = (-labelMin) % labelDelta;
         if (offsetNm > 0.5 * labelDelta) {
            offsetNm -= labelDelta;
         }
         labelMin += offsetNm;
         labelMax += offsetNm;
      }

      return {
         contourLevels: contourLevels,
         scale: scale,
         inverseScale: inverseScale,
         offset: offset,
         labelMin: labelMin,
         labelMax: labelMax,
         labelDelta: labelDelta,
         min: inverseScale * labelMin + offset,
         max: inverseScale * labelMax + offset,
         delta: inverseScale * labelDelta
      };
   };

   // Contour shading function.
   this.contourShade = function(metrics, x) {
      return (this.contourShadeMaximum - this.contourShadeMinimum) *
         Math.max(0, Math.min(metrics.contourLevels - 1,
            Math.floor((x - metrics.min) / metrics.delta)
         )) / (metrics.contourLevels - 1) + this.contourShadeMinimum;
   };

   // Inverse contour shading function.
   this.inverseContourShade = function(metrics, x) {
      return Math.round(
         (
            (x - this.contourShadeMinimum) /
            (this.contourShadeMaximum - this.contourShadeMinimum)
         ) * (metrics.contourLevels - 1)
      );
   };

   // Gives the quantized wavefront.
   this.quantizeWavefront = function(wavefront, metrics) {
      var matrix = wavefront.matrix();
      var rows = matrix.rows;
      var cols = matrix.cols;
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(
               row, col, this.contourShade(metrics, matrix.at(row, col))
            );
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives the wavefront contours.
   this.wavefrontContours = function(wavefront) {
      var matrix = wavefront.matrix();
      var rows = matrix.rows;
      var cols = matrix.cols;
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var e = matrix.at(row, col);
            if (row != 0 && e > matrix.at(row - 1, col)) {
               newMatrix.at(row, col, 1);
            }
            else if (col != 0 && e > matrix.at(row, col - 1)) {
               newMatrix.at(row, col, 1);
            }
            else if (row != rows - 1 && e > matrix.at(row + 1, col)) {
               newMatrix.at(row, col, 1);
            }
            else if (col != cols - 1 && e > matrix.at(row, col + 1)) {
               newMatrix.at(row, col, 1);
            }
            else {
               newMatrix.at(row, col, 0);
            }
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives the contour id map and count of the wavefront.
   this.contourIdMapCount = function(quantize, contours, boundary) {
      var quantizeMatrix = quantize.matrix();
      var contoursMatrix = contours.matrix();
      var boundaryMatrix = boundary.matrix();
      var rows = quantizeMatrix.rows;
      var cols = quantizeMatrix.cols;

      var idMap = new Array(rows * cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var c0 = contoursMatrix.at(row, col);
            var b0 = boundaryMatrix.at(row, col);
            idMap[cols * row + col] =
               (c0 == 1 && b0 == 1) ? cols * row + col : 0;
         }
      }

      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var c0 = contoursMatrix.at(row, col);
            var b0 = boundaryMatrix.at(row, col);
            if (c0 == 1 && b0 == 1) {
               var q0 = quantizeMatrix.at(row, col);
               if (row != 0 && col != 0) {
                  var q1 = quantizeMatrix.at(row - 1, col - 1);
                  var c1 = contoursMatrix.at(row - 1, col - 1);
                  var b1 = boundaryMatrix.at(row - 1, col - 1);
                  if (c1 == 1 && b1 == 1 && q0 == q1) {
                     disjointSetUnion(
                        idMap,
                        cols * row + col,
                        cols * (row - 1) + (col - 1)
                     );
                  }
               }
               if (row != 0) {
                  var q1 = quantizeMatrix.at(row - 1, col);
                  var c1 = contoursMatrix.at(row - 1, col);
                  var b1 = boundaryMatrix.at(row - 1, col);
                  if (c1 == 1 && b1 == 1 && q0 == q1) {
                     disjointSetUnion(
                        idMap,
                        cols * row + col,
                        cols * (row - 1) + col
                     );
                  }
               }
               if (row != 0 && col != cols - 1) {
                  var q1 = quantizeMatrix.at(row - 1, col + 1);
                  var c1 = contoursMatrix.at(row - 1, col + 1);
                  var b1 = boundaryMatrix.at(row - 1, col + 1);
                  if (c1 == 1 && b1 == 1 && q0 == q1) {
                     disjointSetUnion(
                        idMap,
                        cols * row + col,
                        cols * (row - 1) + (col + 1)
                     );
                  }
               }
               if (col != 0) {
                  var q1 = quantizeMatrix.at(row, col - 1);
                  var c1 = contoursMatrix.at(row, col - 1);
                  var b1 = boundaryMatrix.at(row, col - 1);
                  if (c1 == 1 && b1 == 1 && q0 == q1) {
                     disjointSetUnion(
                        idMap,
                        cols * row + col,
                        cols * row + (col - 1)
                     );
                  }
               }
            }
         }
      }

      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            disjointSetFind(idMap, cols * row + col);
         }
      }

      var idMask = new Array(rows * cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            idMask[cols * row + col] = -1;
         }
      }
      idMask[0] = 0;
      var count = 1;
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var id = idMap[cols * row + col];
            if (idMask[id] == -1) {
               idMask[id] = count;
               ++count;
            }
         }
      }
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            idMap[cols * row + col] =
               idMask[idMap[cols * row + col]];
         }
      }

      return {
         idMap: idMap,
         count: count
      }
   };

   // Gives the contour id metrics of the wavefront.
   this.contourIdMetrics = function(quantize, metrics, idMapCount) {
      var quantizeMatrix = quantize.matrix();
      var rows = quantizeMatrix.rows;
      var cols = quantizeMatrix.cols;

      var idLength = new Array(idMapCount.count);
      for (var i = 0; i != idMapCount.count; ++i) {
         idLength[i] = 0;
      }
      for (var i = 0; i != idMapCount.idMap.length; ++i) {
         ++idLength[idMapCount.idMap[i]];
      }
      idLength[0] = 0;

      var idMetrics = new Array(idMapCount.count);
      for (var i = 0; i != idMapCount.count; ++i) {
         idMetrics[i] = {
            points: new Array(idLength[i]),
            level: 0
         };
      }
      for (var i = 0; i != idMapCount.idMap.length; ++i) {
         var id = idMapCount.idMap[i];
         if (id != 0) {
            idMetrics[id].points[--idLength[id]] = i;
            idMetrics[id].level = this.inverseContourShade(
               metrics,
               quantizeMatrix.at(Math.floor(i / cols), i % cols)
            );
         }
      }

      for (var i = idMetrics.length - 1; i != 0; --i) {
         swapArray(idMetrics, i, Math.round(Math.random() * (i - 1)) + 1);
      }
      for (var j = 1; j != idMetrics.length; ++j) {
         for (var i = idMetrics[j].points.length - 1; i != 0; --i) {
            swapArray(idMetrics[j].points, i, Math.round(Math.random() * i));
         }
      }

      return idMetrics;
   };

   // Gives the contour label text and bounds.
   this.contourLabelTextBounds = function(point, level, metrics) {
      var labelFormat = metrics.labelDelta >= 1 ? "%.0f" : "%.1f";
      var labelValue = metrics.labelMin + level * metrics.labelDelta;

      var text = format(labelFormat, labelValue);

      var scale = model.plotResolution / 96;
      var width =
         scale * this.labelBarFont.width(text);
      if (coreVersionBuild < 1189) {
         var height =
            scale * (this.labelBarFont.ascent);
      }
      else {
         var height =
            scale * (this.labelBarFont.ascent - this.labelBarFont.descent);
      }
#ifeq __PI_PLATFORM__ MSWINDOWS
      if (coreVersionBuild < 1168) {
         var height =
            scale * (this.labelBarFont.ascent - this.labelBarFont.descent - 1);
      }
#endif
      var x = Math.round(point.x - 0.5 * width);
      var y = Math.round(point.y + 0.5 * height);

      return {
         text: text,
         bounds: new Rect(x, y - height, x + width, y)
      };
   };

   // Draws a contour label.
   this.drawContourLabel = function(graphics, point, level, metrics) {
      var textBounds = this.contourLabelTextBounds(point, level, metrics);
      var scale = model.plotResolution / 96;

      graphics.drawText(
         textBounds.bounds.x0 / scale,
         textBounds.bounds.y1 / scale,
         textBounds.text
      );
   };

   // Gives true if the contour label collides with another label.
   this.collidesContourLabel = function(
      boundary, collision, point, level, metrics
   ) {
      var bounds = this.contourLabelTextBounds(point, level, metrics).bounds;
      var scale = model.plotResolution / 96;

      bounds.x0 -= Math.round(scale * 1);
      bounds.y0 -= Math.round(scale * 1);
      bounds.x1 += Math.round(scale * 1);
      bounds.y1 += Math.round(scale * 1);

      var boundaryMatrix = boundary.matrix();
      var rows = boundaryMatrix.rows;
      var cols = boundaryMatrix.cols;

      for (var row = bounds.y0; row != bounds.y1; ++row) {
         for (var col = bounds.x0; col != bounds.x1; ++col) {
            if (row < 0 || row > rows - 1 || col < 0 || col > cols - 1) {
               return true;
            }
            if (
               (row == bounds.y0 || row == bounds.y1 - 1) &&
               (col == bounds.x0 || col == bounds.x1 - 1)
            ) {
               continue;
            }
            if (boundaryMatrix.at(row, col) != 1) {
               return true;
            }
         }
      }

      bounds.x0 -= Math.round(scale * 2);
      bounds.y0 -= Math.round(scale * 1);
      bounds.x1 += Math.round(scale * 2);
      bounds.y1 += Math.round(scale * 1);

      var collisionMatrix = collision.matrix();
      var rows = collisionMatrix.rows;
      var cols = collisionMatrix.cols;

      for (var row = bounds.y0; row != bounds.y1; ++row) {
         for (var col = bounds.x0; col != bounds.x1; ++col) {
            if (row < 0 || row > rows - 1 || col < 0 || col > cols - 1) {
               return true;
            }
            if (collisionMatrix.at(row, col) != 0) {
               return true;
            }
         }
      }

      return false;
   };

   // Updates the collision map with a contour label.
   this.collisionContourLabel = function(collision, point, level, metrics) {
      var bounds = this.contourLabelTextBounds(point, level, metrics).bounds;
      var scale = model.plotResolution / 96;

      bounds.x0 -= Math.round(scale * 3);
      bounds.y0 -= Math.round(scale * 2);
      bounds.x1 += Math.round(scale * 3);
      bounds.y1 += Math.round(scale * 2);

      var collisionMatrix = collision.matrix();
      var rows = collisionMatrix.rows;
      var cols = collisionMatrix.cols;

      for (var row = bounds.y0; row != bounds.y1; ++row) {
         for (var col = bounds.x0; col != bounds.x1; ++col) {
            if (row < 0 || row > rows - 1 || col < 0 || col > cols - 1) {
               continue;
            }
            collisionMatrix.at(row, col, 1);
         }
      }
   };

   // Updates the background map with a contour label.
   this.backgroundContourLabel = function(background, point, level, metrics) {
      var bounds = this.contourLabelTextBounds(point, level, metrics).bounds;
      var scale = model.plotResolution / 96;

      bounds.x0 -= Math.round(scale * 1);
      bounds.y0 -= Math.round(scale * 1);
      bounds.x1 += Math.round(scale * 1);
      bounds.y1 += Math.round(scale * 1);

      var backgroundMatrix = background.matrix();
      var rows = backgroundMatrix.rows;
      var cols = backgroundMatrix.cols;

      for (var row = bounds.y0; row != bounds.y1; ++row) {
         for (var col = bounds.x0; col != bounds.x1; ++col) {
            if (row < 0 || row > rows - 1 || col < 0 || col > cols - 1) {
               continue;
            }
            if (
               (row == bounds.y0 || row == bounds.y1 - 1) &&
               (col == bounds.x0 || col == bounds.x1 - 1)
            ) {
               continue;
            }
            backgroundMatrix.at(row, col, 1);
         }
      }
   };

   // Gives a bitmap graphics pair for labeling.
   this.newBitmapGraphicsLabeling = function(width, height) {
      var scale = model.plotResolution / 96;
      var bitmap = new Bitmap(
         Math.ceil(scale * width), Math.ceil(scale * height)
      );
      bitmap.fill(0);

      var graphics = new VectorGraphics(bitmap);
      graphics.scaleTransformation(scale);
      graphics.font = this.labelBarFont;
      graphics.textAntialiasing = true;

      return {
         bitmap: bitmap,
         graphics: graphics
      };
   };

   // Gives a frame of the bitmap graphics pair for labeling.
   this.frameBitmapGraphicsLabeling = function(bitmapGraphics) {
      bitmapGraphics.graphics.end();

      var image = new Image(
         bitmapGraphics.bitmap.width,
         bitmapGraphics.bitmap.height,
         1,
         ColorSpace_Gray,
         32,
         SampleType_Real
      );
      image.fill(1);
      image.blend(bitmapGraphics.bitmap);

      bitmapGraphics.bitmap.assign(new Bitmap());

      var frame = new FrameReal(image.toMatrix());
      image.free();

      return frame;
   };

   // Gives the contour labels.
   this.labelContours = function(quantize, contours, boundary, metrics) {
      var quantizeMatrix = quantize.matrix();
      var rows = quantizeMatrix.rows;
      var cols = quantizeMatrix.cols;

      var collision = new FrameReal(new Matrix(0, rows, cols));
      var background = new FrameReal(new Matrix(0, rows, cols));

      var bitmapGraphics = this.newBitmapGraphicsLabeling(cols, rows);

      var idMapCount = this.contourIdMapCount(quantize, contours, boundary);
      var idMetrics = this.contourIdMetrics(quantize, metrics, idMapCount);

      var scale = model.plotResolution / 96;
      var minimumLength = Math.round(
         4 * scale * (this.labelBarFont.ascent - this.labelBarFont.descent - 1)
      );
      var lengthScale = Math.round(
         2 * scale * (this.labelBarFont.ascent - this.labelBarFont.descent - 1)
      );
      var maximumCandidates = 20;
      var maximumContours = 200;
      for (var i = 0; i != idMetrics.length; ++i) {
         if (idMetrics[i].points.length >= minimumLength) {
            --maximumContours;
            if (maximumContours == 0) {
               break;
            }
            for (
               var j = 0;
               j != Math.min(
                  maximumCandidates,
                  Math.round(idMetrics[i].points.length / lengthScale)
               );
               ++j
            ) {
               var point =
                  new Point(
                     idMetrics[i].points[j] % cols,
                     Math.floor(idMetrics[i].points[j] / cols)
                  );
               var level = idMetrics[i].level;
               if (
                  !this.collidesContourLabel(
                     boundary, collision, point, level, metrics
                  )
               ) {
                  this.drawContourLabel(bitmapGraphics.graphics, point, level, metrics);
                  this.collisionContourLabel(
                     collision, point, level, metrics
                  );
                  this.backgroundContourLabel(
                     background, point, level, metrics
                  );
                  break;
               }
            }
         }
      }
      collision.clear();

      return {
         labels: this.frameBitmapGraphicsLabeling(bitmapGraphics),
         background: background
      };
   };

   // Gives the wavefront label blend.
   this.blendLabels = function(wavefront, labels) {
      var backgroundShade =
         (this.backgroundContourLevel / (this.contourLevels - 1)) *
         (this.contourShadeMaximum - this.contourShadeMinimum) +
         this.contourShadeMinimum;
      return wavefront.map(
         function(x) {
            return Math.max(backgroundShade, x);
         }
      ).stagePipeline([
         function(frame) {
            return frame.blend(wavefront, labels.background);
         },
         function(frame) {
            return frame.product(labels.labels);
         }
      ]);
   };

   // Gives the blend of the wavefront and the contours.
   this.blendContours = function(wavefront, contours) {
      return wavefront.scale(this.contourBlendScale).stagePipeline([
         function(frame) {
            return frame.blend(wavefront, contours);
         }
      ]);
   };

   // Gives the wavefront boundary blend.
   this.blendBoundary = function(wavefront, boundary) {
      var one = new FrameReal(
         new Matrix(1, wavefront.rows(), wavefront.cols())
      );
      var blend = wavefront.blend(one, boundary);
      one.clear();

      return blend;
   };

   // Gives the y coordinate for level in the label bar.
   this.labelBarLevelYCoordinate = function(level, metrics) {
      var label = metrics.labelMin + level * metrics.labelDelta;

      var location = metrics.inverseScale * label + metrics.offset;
      var location = (location - metrics.min) / (metrics.max - metrics.min);

      return this.labelBarTextOffset.y +
         (1 - location) * (this.labelBarRows - 2 * this.legendBarMargin) +
         this.legendBarMargin;
   };

   // Gives the wavefront notes.
   this.wavefrontNotes = function(wavefront, metrics) {
      var wavefrontMatrix = wavefront.matrix();
      var rows = wavefrontMatrix.rows;
      var cols = wavefrontMatrix.cols;

      var bitmapGraphics = this.newBitmapGraphicsLabeling(cols, rows);

      var x = this.labelBarFont.width("M");
      var y = this.labelBarLevelYCoordinate(metrics.contourLevels, metrics);
      var text = format(
         model.formatWavefrontErrorEstimate + " nm RMS",
         model.scaleWavefrontErrorEstimate * model.wavefrontErrorEstimate
      );

      bitmapGraphics.graphics.drawText(x, y, text);

      return this.frameBitmapGraphicsLabeling(bitmapGraphics);
   };

   // Gives the wavefront notes blend.
   this.blendNotes = function(wavefront, notes) {
      return wavefront.product(notes);
   };

   // Gives the legend bar pane.
   this.legendBar = function(metrics) {
      var scale = model.plotResolution / 96;
      var rows = Math.ceil(scale * this.legendBarRows);
      var cols = Math.ceil(scale * this.legendBarCols);
      var margin = Math.ceil(scale * this.legendBarMargin);
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != margin; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(row, col, 1);
         }
      }
      for (; row != rows - margin; ++row) {
         var v = ((rows - margin - 1 - row) / (rows - 2 * margin - 1)) *
            (metrics.max - metrics.min) + metrics.min;
         var e = this.contourShade(metrics, v);
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(row, col, e);
         }
      }
      for (; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(row, col, 1);
         }
      }

      for (var row = 0; row != rows; ++row) {
         newMatrix.at(row, 0, 1);
         newMatrix.at(row, cols - 1, 1);
      }

      return new FrameReal(newMatrix);
   };

   // Gives the label bar pane.
   this.labelBar = function(metrics) {
      var labelFormat = metrics.labelDelta >= 1 ? "%.0f" : "%.1f";
      var width = 0;
      for (var i = 0; i != metrics.contourLevels + 1; ++i) {
         var labelValue = metrics.labelMin + i * metrics.labelDelta;
         var text =
            format(labelFormat, labelValue) +
            (i == metrics.contourLevels ? " nm" : "");

         width = Math.max(width, this.labelBarFont.width(text));
      }
      width += this.labelBarTextOffset.x + this.labelBarFont.width("M");

      var bitmapGraphics = this.newBitmapGraphicsLabeling(width, this.labelBarRows);

      for (var i = 0; i != metrics.contourLevels + 1; ++i) {
         var x = this.labelBarTextOffset.x;
         var y = this.labelBarLevelYCoordinate(i, metrics);
         var labelValue = metrics.labelMin + i * metrics.labelDelta;
         var text =
            format(labelFormat, labelValue) +
            (i == metrics.contourLevels ? " nm" : "");

         bitmapGraphics.graphics.drawText(x, y, text);
      }

      return this.frameBitmapGraphicsLabeling(bitmapGraphics);
   };

   // Gives the pane combination.
   this.combinePanes = function(wavefrontPane, legendBarPane, labelBarPane) {
      var cols =
         wavefrontPane.cols() + legendBarPane.cols() + labelBarPane.cols();
      var rows =
         Math.max(
            wavefrontPane.rows(), legendBarPane.rows(), labelBarPane.rows()
         );

      var identifierPrefix = filterViewId(model.identifierPrefix);
      var imageWindow = new ImageWindow(
         cols,
         rows,
         1,
         32,
         true,
         false,
         uniqueViewId(identifierPrefix + "wavefront_contour_plot")
      );
      imageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);
      var x = 0;

      imageWindow.mainView.image.selectedPoint = new Point(x, 0);
      var image = wavefrontPane.matrix().toImage();
      imageWindow.mainView.image.apply(image);
      image.free();
      x += wavefrontPane.cols();

      imageWindow.mainView.image.selectedPoint = new Point(x, 0);
      var image = legendBarPane.matrix().toImage();
      imageWindow.mainView.image.apply(image);
      image.free();
      x += legendBarPane.cols();

      imageWindow.mainView.image.selectedPoint = new Point(x, 0);
      var image = labelBarPane.matrix().toImage();
      imageWindow.mainView.image.apply(image);
      image.free();
      x += labelBarPane.cols();

      imageWindow.mainView.endProcess();
      var combine = new FrameReal(imageWindow.mainView.image.toMatrix());
      imageWindow.close();

      return combine;
   };

   // Generates the wavefront plot.
   // Sets model.wavefrontEstimateContourPlot.
   this.generateWavefrontPlot = function() {
      Math.initRandomGenerator([3190634479, 777680007]);

      var self = this;
      var wavefrontScale = model.wavefrontEstimate.clone().stagePipeline([
         function(frame) {
            return frame.scale(model.wavefrontSaveScale);
         },
         function(frame) {
            return frame.offset(model.wavefrontSaveOffset);
         },
         function(frame) {
            return self.cropWavefront(
               frame, self.cropWavefrontDiameterScale
            );
         },
         function(frame) {
            return self.resampleWavefrontScale(
               frame, self.resampleWavefrontSize
            );
         }
      ]);

      var wavefrontBoundary = this.wavefrontBoundary(
         wavefrontScale.wavefront,
         wavefrontScale.scale,
         this.wavefrontBoundaryWidth
      );
      var contourMetrics = this.contourMetrics(
         wavefrontScale.wavefront,
         this.contourQuantileMinimum,
         this.contourQuantileMaximum,
         this.contourLevels
      );
      var wavefrontQuantize = this.quantizeWavefront(
         wavefrontScale.wavefront, contourMetrics
      );
      wavefrontScale.wavefront.clear();

      var wavefrontContours = this.wavefrontContours(wavefrontQuantize);
      var contourLabels = this.labelContours(
         wavefrontQuantize,
         wavefrontContours,
         wavefrontBoundary,
         contourMetrics
      );

      var wavefrontLabels = this.blendLabels(
         wavefrontQuantize, contourLabels
      );
      wavefrontQuantize.clear();
      contourLabels.labels.clear();
      contourLabels.background.clear();

      var wavefrontLabelsContours = this.blendContours(
         wavefrontLabels, wavefrontContours
      );
      wavefrontLabels.clear();
      wavefrontContours.clear();

      var wavefrontLabelsContoursBoundary = this.blendBoundary(
         wavefrontLabelsContours, wavefrontBoundary
      );
      wavefrontLabelsContours.clear();
      wavefrontBoundary.clear();

      var wavefrontNotes = this.wavefrontNotes(
         wavefrontLabelsContoursBoundary,
         contourMetrics
      );
      var wavefrontPane = this.blendNotes(
         wavefrontLabelsContoursBoundary,
         wavefrontNotes
      );
      wavefrontLabelsContoursBoundary.clear();
      wavefrontNotes.clear();

      var legendBar = this.legendBar(contourMetrics);
      var legendBarContours = this.wavefrontContours(legendBar);
      var legendBarPane = this.blendContours(legendBar, legendBarContours);
      legendBar.clear();
      legendBarContours.clear();

      var labelBarPane = this.labelBar(contourMetrics);

      var self = this;
      model.wavefrontEstimateContourPlot =
         model.wavefrontEstimateContourPlot.stagePipeline([
            function(frame) {
               return self.combinePanes(
                  wavefrontPane, legendBarPane, labelBarPane
               );
            }
         ]);
      wavefrontPane.clear();
      legendBarPane.clear();
      labelBarPane.clear();

      Math.initRandomGenerator(Math.randomSeed64());
   };
}

// ****************************************************************************
// EOF WavefrontPlot.js - Released 2016/12/30 00:00:00 UTC
