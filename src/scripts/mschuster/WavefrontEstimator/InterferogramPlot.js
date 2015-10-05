// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// InterferogramPlot.js - Released 2015/10/05 00:00:00 UTC
// ****************************************************************************
//
// This file is part of WavefrontEstimator Script Version 1.16
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

function InterferogramPlot(model) {
   // Interferogram plot size.
   this.interferogramPlotSize = 501;

   // Boundary thresholds.
   this.boundaryWidth = 0.01;

   // Crop interferogram threshold.
   this.cropInterferogramAperture = 1.1;

   // Gives the cropped interferogram.
   this.cropInterferogram = function(interferogram) {
      var radius = Math.round(
         0.5 * this.cropInterferogramAperture * model.defocusDiameterEstimate
      );
      var pad = interferogram.rows() - 2 * radius - 1;
      var low = Math.round(0.5 * pad);
      var high = pad - low;

      var cropRows = interferogram.padRows(-low + 1 * 1, -high, 0);
      var cropCols = cropRows.padCols(-low + 1 * 1, -high, 0);
      cropRows.clear();

      return cropCols;
   };

   // Gives the resampled interferogram.
   this.resampleInterferogram = function(interferogram) {
      var scale = model.plotResolution / 96;
      var resample = new Resample();
      resample.absoluteMode = Resample.prototype.ForceWidthAndHeight;
      resample.interpolation = Resample.prototype.MitchellNetravaliFilter;
      resample.mode = Resample.prototype.AbsolutePixels;
      resample.smoothness = 1.5;
      resample.xSize = Math.ceil(scale * this.interferogramPlotSize);
      resample.ySize = Math.ceil(scale * this.interferogramPlotSize);

      var identifierPrefix = model.identifierPrefix.trim() == "" ?
         "" :
         filterViewId(model.identifierPrefix);
      var imageWindow =
         interferogram.toImageWindow(
            uniqueViewId(identifierPrefix + "interferogram_plot")
         );
      resample.executeOn(imageWindow.mainView, false);
      var resampleInterferogram = new FrameReal(
         imageWindow.mainView.image.toMatrix()
      );
      imageWindow.close();

      return resampleInterferogram;
   };

   // Gives the interferogram boundary blending function.
   this.boundary = function(interferogram, scale) {
      var apertureLow = 1.0;
      var apertureHigh = apertureLow + this.boundaryWidth;
      var obstructionHigh = model.defocusObstructionRatioEstimate;
      var obstructionLow = Math.max(0, obstructionHigh - this.boundaryWidth);

      var matrix = interferogram.matrix();
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
                  perlinSmootherStep(
                     (apertureHigh - r) / (apertureHigh - apertureLow)
                  ) :
               obstructionHigh > r && r >= obstructionLow ?
                  perlinSmootherStep(
                     (r - obstructionLow) / (obstructionHigh - obstructionLow)
                  ) :
               1;
            newMatrix.at(row, col, r);
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives the boundary blended interferogram.
   this.blendBoundaryInterferogram = function(interferogram, scale) {
      var boundary = this.boundary(interferogram, scale);
      var one = new FrameReal(
         new Matrix(1, interferogram.rows(), interferogram.cols())
      );
      var blend = interferogram.blend(one, boundary);
      one.clear();
      boundary.clear();

      return blend;
   };

   // Generates the interferogram plot.
   // Sets model.interferogramEstimateSagittalPlot.
   // Sets model.interferogramEstimateMeridionalPlot.
   this.generateInterferogramPlot = function() {
      var self = this;
      var scale = 1;
      model.interferogramEstimateSagittalPlot =
         model.interferogramEstimateSagittalPlot.stagePipeline([
            function(frame) {
               return self.cropInterferogram(
                  model.interferogramEstimateSagittal
               );
            },
            function(frame) {
               scale = Math.ceil(
                  (model.plotResolution / 96) * self.interferogramPlotSize
               ) / frame.rows();
               return self.resampleInterferogram(frame);
            },
            function(frame) {
               return self.blendBoundaryInterferogram(frame, scale);
            }
         ]);
      model.interferogramEstimateMeridionalPlot =
         model.interferogramEstimateMeridionalPlot.stagePipeline([
            function(frame) {
               return self.cropInterferogram(
                  model.interferogramEstimateMeridional
               );
            },
            function(frame) {
               scale = Math.ceil(
                  (model.plotResolution / 96) * self.interferogramPlotSize
               ) / frame.rows();
               return self.resampleInterferogram(frame);
            },
            function(frame) {
               return self.blendBoundaryInterferogram(frame, scale);
            }
         ]);
   };
}

// ****************************************************************************
// EOF InterferogramPlot.js - Released 2015/10/05 00:00:00 UTC
