// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// EstimateWavefront.js - Released 2016/12/30 00:00:00 UTC
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

function EstimateWavefront(model, view, controller) {
   // Intra-focal estimation image.
   this.intraFocalEstimationImage = new FrameReal(new Matrix(0, 0, 0));
   this.intraFocalEstimationFrameCount = 0;

   // Extra-focal estimation image (inverted).
   this.extraFocalEstimationImage = new FrameReal(new Matrix(0, 0, 0));
   this.extraFocalEstimationFrameCount = 0;

   // Rescale ratio threshold.
   this.rescaleRatioThreshold = 1.02;
   this.formatRescaleRatioFormat = "%.3f";

   // Noise threshold in normalized units RMS.
   this.scaleNoiseThreshold = model.DNPerNormalizedUnit;
   this.formatNoiseThreshold = "%.1f";
   this.noiseThreshold = 0;

   // Residual aberration.
   this.scaleResidualAberration = model.DNPerNormalizedUnit;
   this.formatResidualAberration = "%.1f";

   // Defocus pixel size projected on aperture in meters.
   this.defocusPixelSize = 0;

   // Detector mesh spacing in normalized units.
   this.detectorMeshSpacing = 0;

   // Defocus mesh spacing in normalized units.
   this.defocusMeshSpacing = 0;

   // Defocus mesh in normalized units.
   this.defocusMesh = {
      x: new FrameReal(new Matrix(0, 0, 0)),
      y: new FrameReal(new Matrix(0, 0, 0))
   };

   // Defocus boundary mesh spacing factor.
   this.defocusBoundaryMeshSpacingFactor = 1.0;

   // Defocus boundary mesh in normalized units.
   this.defocusBoundaryMesh = {
      x: new FrameReal(new Matrix(0, 0, 0)),
      y: new FrameReal(new Matrix(0, 0, 0))
   };
   this.defocusBoundaryMeshApertureLow = 1.0;
   this.defocusBoundaryMeshApertureHigh = 1.3;
   this.defocusBoundaryMeshObstructionLow =
      2 - this.defocusBoundaryMeshApertureHigh;
   this.defocusBoundaryMeshObstructionHigh =
      2 - this.defocusBoundaryMeshApertureLow;

   // Defocus boundary distance mesh in normalized units.
   this.defocusBoundaryDistanceMesh = {
      x: new FrameReal(new Matrix(0, 0, 0)),
      y: new FrameReal(new Matrix(0, 0, 0))
   };

   // Defocus boundary blend in normalized units.
   this.defocusBoundaryBlend = new FrameReal(new Matrix(0, 0, 0));
   this.defocusBoundaryBlendWidth = 0.05;

   // Self consistency wavefront.
   this.selfConsistencyWavefront = new FrameReal(new Matrix(0, 0, 0));

   // The Laplacian operator Fourier (u, v) domain -(u^2 + v^2) scaling term.
   this.laplacianScale = new FrameReal(new Matrix(0, 0, 0));

   // Wavefront scaling term.
   this.wavefrontScale = 1e-9;

   // Detector signal denoising threshold.
   this.detectorSignalThreshold = 0.5;

   // Poisson solver iteration count.
   this.poissonSolverInterationCount = 4;

   // Maximum compensation iteration count.
   this.maximumCompensationIterationCount = 40;

   // Compensation aggressiveness factor.
   this.compensationAggressivenessFactor = 0.9;

   // Aberratioin labels.
   this.aberrationLabels = (new ZernikeAberrations()).aberrationLabels();

   // Generates the defocus mesh.
   this.generateDefocusMesh = function() {
      var rows = this.intraFocalEstimationImage.rows();
      var cols = this.intraFocalEstimationImage.cols();
      var matrixX = new Matrix(rows, cols);
      var matrixY = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            matrixX.at(
               row,
               col,
               (col - 1 / this.detectorMeshSpacing) * this.defocusMeshSpacing
            );
            matrixY.at(
               row,
               col,
               (row - 1 / this.detectorMeshSpacing) * this.defocusMeshSpacing
            );
         }
      }

      return {
         x: new FrameReal(matrixX),
         y: new FrameReal(matrixY)
      };
   };

   // Generates the defocus boundary mesh.
   this.generateDefocusBoundaryMesh = function() {
      var apertureLow = this.defocusBoundaryMeshApertureLow;
      var apertureHigh = this.defocusBoundaryMeshApertureHigh;
      var obstructionLow = model.defocusObstructionRatioEstimate *
         this.defocusBoundaryMeshObstructionLow;
      var obstructionHigh = model.defocusObstructionRatioEstimate *
         this.defocusBoundaryMeshObstructionHigh;

      var dmx = this.defocusMesh.x.matrix();
      var dmy = this.defocusMesh.y.matrix();

      var rows = dmx.rows;
      var cols = dmx.cols;
      var matrixX = new Matrix(rows, cols);
      var matrixY = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var x = dmx.at(row, col);
            var y = dmy.at(row, col);
            var r = Math.sqrt(x * x + y * y);
            var a = x == 0 && y == 0 ? 0 : Math.atan2(y, x);
            var rb =
               apertureHigh >= r && r > apertureLow ?
                  apertureLow -
                  this.defocusBoundaryMeshSpacingFactor *
                     this.defocusMeshSpacing :
               obstructionHigh > r && r >= obstructionLow ?
                  obstructionHigh +
                  this.defocusBoundaryMeshSpacingFactor *
                     this.defocusMeshSpacing :
               r;
            matrixX.at(row, col, rb * Math.cos(a));
            matrixY.at(row, col, rb * Math.sin(a));
         }
      }

      return {
         x: new FrameReal(matrixX),
         y: new FrameReal(matrixY)
      };
   };

   // Generates the defocus boundary distance mesh.
   this.generateDefocusBoundaryDistanceMesh = function() {
      var apertureLow = this.defocusBoundaryMeshApertureLow;
      var apertureHigh = this.defocusBoundaryMeshApertureHigh;
      var obstructionLow = model.defocusObstructionRatioEstimate *
         this.defocusBoundaryMeshObstructionLow;
      var obstructionHigh = model.defocusObstructionRatioEstimate *
         this.defocusBoundaryMeshObstructionHigh;

      var dmx = this.defocusMesh.x.matrix();
      var dmy = this.defocusMesh.y.matrix();

      var rows = dmx.rows;
      var cols = dmx.cols;
      var matrixX = new Matrix(rows, cols);
      var matrixY = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var x = dmx.at(row, col);
            var y = dmy.at(row, col);
            var r = Math.sqrt(x * x + y * y);
            var a = x == 0 && y == 0 ? 0 : Math.atan2(y, x);
            var rb =
               apertureHigh >= r && r > apertureLow ?
                  apertureLow -
                  this.defocusBoundaryMeshSpacingFactor *
                     this.defocusMeshSpacing :
               obstructionHigh > r && r >= obstructionLow ?
                  obstructionHigh +
                  this.defocusBoundaryMeshSpacingFactor *
                     this.defocusMeshSpacing :
               r;
            matrixX.at(row, col, (r - rb) * Math.cos(a));
            matrixY.at(row, col, (r - rb) * Math.sin(a));
         }
      }

      return {
         x: new FrameReal(matrixX),
         y: new FrameReal(matrixY)
      };
   };

   // Generate the defocus boundary blend.
   this.generateDefocusBoundaryBlend = function() {
      var apertureLow = 1.0;
      var apertureHigh = apertureLow + this.defocusBoundaryBlendWidth;
      var obstructionHigh = model.defocusObstructionRatioEstimate;
      var obstructionLow =
         Math.max(0, obstructionHigh - this.defocusBoundaryBlendWidth);

      var dmx = this.defocusMesh.x.matrix();
      var dmy = this.defocusMesh.y.matrix();

      var rows = dmx.rows;
      var cols = dmx.cols;
      var matrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var x = dmx.at(row, col);
            var y = dmy.at(row, col);
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
            matrix.at(row, col, r);
         }
      }

      return new FrameReal(matrix);
   };

   // Generates the defocus domain.
   this.generateDefocusDomain = function() {
      var dmx = this.defocusMesh.x.matrix();
      var dmy = this.defocusMesh.y.matrix();

      var rows = dmx.rows;
      var cols = dmx.cols;
      var matrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var x = dmx.at(row, col);
            var y = dmy.at(row, col);
            var r = Math.sqrt(x * x + y * y);
            matrix.at(
               row,
               col,
               r > 1 || r < model.defocusObstructionRatioEstimate ? 0 : 1
            );
         }
      }

      return new FrameReal(matrix);
   };

   // Generates the self consistency wavefront.
   this.generateSelfConsistencyWavefront = function() {
      var dmx = this.defocusMesh.x.matrix();
      var dmy = this.defocusMesh.y.matrix();

      var rows = dmx.rows;
      var cols = dmx.cols;
      var matrix = new Matrix(rows, cols);
      var e2 = square(model.defocusObstructionRatioEstimate);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var x = dmx.at(row, col);
            var y = dmy.at(row, col);
            var r2 = x * x + y * y;
            matrix.at(row, col, Math.sqrt(3) * (-2 * r2 + e2 + 1) / (e2 - 1));
         }
      }

      return new FrameReal(matrix);
   };

   // Generates the Laplacian operator Fourier (u, v) domain -(u^2 + v^2)
   // scaling term.
   // A discrete Fourier transform of N (fourierSize) samples spaced S
   // (this.defocusPixelSize) apart gives frequency samples i / (N * S) in
   // cycles per length for i = -N / 2, ..., N / 2 - 1, with the zero frequency
   // term in the center of the array.
   // Multiply by 2 Pi to convert from cycles per length to radians per length.
   // Force a solution with the desired zero mean by setting the center of the
   // array to infinity.
   this.generateLaplacianScale = function() {
      var fourierSize = this.intraFocalEstimationImage.rows();
      var rows = fourierSize;
      var cols = fourierSize;
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(
               row,
               col,
               -square(
                  2 * Math.PI * (col / fourierSize - 0.5) /
                  this.defocusPixelSize
               )
            );
         }
      }

      return (new FrameReal(newMatrix)).stagePipeline([
         function(frame) {
            var frameTranspose = frame.transpose();
            var uv = frame.sum(frameTranspose);
            frameTranspose.clear();
            uv.matrix().at(
               fourierSize / 2, fourierSize / 2, Number.POSITIVE_INFINITY
            );
            return uv;
         }
      ]);
   };

   // Generates defocus threshold.
   this.generateDefocusThreshold = function() {
      if (model.useDefocusThresholdHistogram) {
         var medianIntraFocalEstimationImage =
            this.intraFocalEstimationImage.medianFilter(
               model.hotPixelRemovalRadius
            );
         var intraFocalDefocusThreshold = Math.max(
            model.minimumDefocusThreshold,
            medianIntraFocalEstimationImage.defocusThresholdHistogram(
               model.defocusThresholdHistogramBins,
               model.defocusThresholdHistogramMinimumBins,
               model.defocusThresholdHistogramNeighborhood,
               model.defocusThresholdHistogramSigma
            )
         );
         medianIntraFocalEstimationImage.clear();
      }
      else {
         var intraFocalDefocusThreshold = model.minimumDefocusThreshold;
      }
      for (var k = 0; k != model.defocusSignalFixedPointIterations; ++k) {
         if (intraFocalDefocusThreshold == 0) {
            throw new Error(model.defocusThresholdEstimationDidNotConverge);
         }
         var intraFocalApertureMetrics =
            this.intraFocalEstimationImage.apertureMetrics(
               intraFocalDefocusThreshold, model.hotPixelRemovalRadius
            );
         var intraFocalDefocusMetrics = intraFocalApertureMetrics.metrics;
         intraFocalApertureMetrics.mask.clear();
         if (intraFocalDefocusMetrics.radius == 0) {
            throw new Error(model.defocusThresholdEstimationDidNotConverge);
         }
         intraFocalDefocusThreshold = Math.max(
            0,
            model.defocusSignalThresholdFactor *
               intraFocalDefocusMetrics.signal
         );
         view.throwAbort();
      }

      if (model.useDefocusThresholdHistogram) {
         var medianExtraFocalEstimationImage =
            this.extraFocalEstimationImage.medianFilter(
               model.hotPixelRemovalRadius
            );
         var extraFocalDefocusThreshold = Math.max(
            model.minimumDefocusThreshold,
            medianExtraFocalEstimationImage.defocusThresholdHistogram(
               model.defocusThresholdHistogramBins,
               model.defocusThresholdHistogramMinimumBins,
               model.defocusThresholdHistogramNeighborhood,
               model.defocusThresholdHistogramSigma
            )
         );
         medianExtraFocalEstimationImage.clear();
      }
      else {
         var extraFocalDefocusThreshold = model.minimumDefocusThreshold;
      }
      for (var k = 0; k != model.defocusSignalFixedPointIterations; ++k) {
         if (extraFocalDefocusThreshold == 0) {
            throw new Error(model.defocusThresholdEstimationDidNotConverge);
         }
         var extraFocalApertureMetrics =
            this.extraFocalEstimationImage.apertureMetrics(
               extraFocalDefocusThreshold, model.hotPixelRemovalRadius
            );
         var extraFocalDefocusMetrics = extraFocalApertureMetrics.metrics;
         extraFocalApertureMetrics.mask.clear();
         if (extraFocalDefocusMetrics.radius == 0) {
            throw new Error(model.defocusThresholdEstimationDidNotConverge);
         }
         extraFocalDefocusThreshold = Math.max(
            0,
            model.defocusSignalThresholdFactor *
               extraFocalDefocusMetrics.signal
         );
         view.throwAbort();
      }

      var defocusThreshold = Math.sqrt(
         intraFocalDefocusThreshold * extraFocalDefocusThreshold
      );

      if (defocusThreshold == 0) {
         throw new Error(model.defocusThresholdEstimationDidNotConverge);
      }
      var intraFocalApertureMetrics =
         this.intraFocalEstimationImage.apertureMetrics(
            defocusThreshold, model.hotPixelRemovalRadius
         );
      var intraFocalDefocusMetrics = intraFocalApertureMetrics.metrics;
      intraFocalApertureMetrics.mask.clear();
      if (intraFocalDefocusMetrics.radius == 0) {
         throw new Error(model.defocusThresholdEstimationDidNotConverge);
      }

      if (defocusThreshold == 0) {
         throw new Error(model.defocusThresholdEstimationDidNotConverge);
      }
      var extraFocalApertureMetrics =
         this.extraFocalEstimationImage.apertureMetrics(
            defocusThreshold, model.hotPixelRemovalRadius
         );
      var extraFocalDefocusMetrics = extraFocalApertureMetrics.metrics;
      extraFocalApertureMetrics.mask.clear();
      if (extraFocalDefocusMetrics.radius == 0) {
         throw new Error(model.defocusThresholdEstimationDidNotConverge);
      }

      defocusThreshold = Math.max(
         0,
         model.defocusSignalThresholdFactor *
            Math.sqrt(
               intraFocalDefocusMetrics.signal *
               extraFocalDefocusMetrics.signal
            )
      );
      view.throwAbort();

      return defocusThreshold;
   };

   // Generates defocus metrics.
   this.generateDefocusMetrics = function(defocusThreshold) {
      function writeDefocusMetrics(defocusMetrics, defocusNoise, frameCount) {
         console.writeln("Defocus threshold: ", format(
            model.formatDefocusThreshold + " DN",
            model.scaleDefocusThreshold * defocusThreshold
         ));
         console.writeln("Defocus barycenter.x: ", format(
            model.formatDefocusBarycenter + " px",
            defocusMetrics.barycenter.x
         ));
         console.writeln("Defocus barycenter.y: ", format(
            model.formatDefocusBarycenter + " px",
            defocusMetrics.barycenter.y
         ));
         console.writeln("Defocus diameter: ", format(
            model.formatDefocusDiameter + " px",
            2 * defocusMetrics.radius
         ));
         console.writeln("Defocus obstruction diameter: ", format(
            model.formatDefocusDiameter + " px",
            2 * defocusMetrics.obstructionRadius
         ));
         console.writeln("Defocus exposure: ",
            format(
               model.formatDefocusSignal + " DN",
               model.scaleDefocusSignal * defocusMetrics.signal
            ),
            format(
               ", " + model.formatDefocusExposure + " e-",
               model.scaleDefocusExposure * frameCount * model.gain *
               model.scaleDefocusSignal * defocusMetrics.signal
            )
         );
         console.writeln("Defocus noise: ", format(
            model.formatDefocusNoise + " DN RMS",
            model.scaleDefocusNoise * defocusNoise
         ));
      }

      var intraFocalApertureMetrics =
         this.intraFocalEstimationImage.apertureMetrics(
            defocusThreshold, model.hotPixelRemovalRadius
         );
      var intraFocalDefocusMetrics = intraFocalApertureMetrics.metrics;
      intraFocalApertureMetrics.mask.clear();
      if (intraFocalDefocusMetrics.radius == 0) {
         throw new Error(model.defocusThresholdEstimationDidNotConverge);
      }
      if (2 * intraFocalDefocusMetrics.radius < model.minimumDefocusDiameter) {
         throw new Error(model.defocusedImageDiameterTooSmall);
      }
      if (2 * intraFocalDefocusMetrics.radius > model.maximumDefocusDiameter) {
         throw new Error(model.defocusedImageDiameterTooLarge);
      }
      if (intraFocalDefocusMetrics.signal < model.minimumDefocusSignal) {
         throw new Error(model.defocusedImageSignalTooSmall);
      }
      if (intraFocalDefocusMetrics.signal > model.maximumDefocusSignal) {
         throw new Error(model.defocusedImageSignalTooLarge);
      }
      var intraFocalDefocusNoise =
         Math.sqrt(intraFocalDefocusMetrics.signal / (
            model.DNPerNormalizedUnit *
            model.gain *
            this.intraFocalEstimationFrameCount
         ));
      console.writeln();
      console.writeln("<b>Intra-focal combined image:</b>");
      writeDefocusMetrics(
         intraFocalDefocusMetrics,
         intraFocalDefocusNoise,
         this.intraFocalEstimationFrameCount
      );
      console.flush();

      var extraFocalApertureMetrics =
         this.extraFocalEstimationImage.apertureMetrics(
            defocusThreshold, model.hotPixelRemovalRadius
         );
      var extraFocalDefocusMetrics = extraFocalApertureMetrics.metrics;
      extraFocalApertureMetrics.mask.clear();
      if (extraFocalDefocusMetrics.radius == 0) {
         throw new Error(model.defocusThresholdEstimationDidNotConverge);
      }
      if (2 * extraFocalDefocusMetrics.radius < model.minimumDefocusDiameter) {
         throw new Error(model.defocusedImageDiameterTooSmall);
      }
      if (2 * extraFocalDefocusMetrics.radius > model.maximumDefocusDiameter) {
         throw new Error(model.defocusedImageDiameterTooLarge);
      }
      if (extraFocalDefocusMetrics.signal < model.minimumDefocusSignal) {
         throw new Error(model.defocusedImageSignalTooSmall);
      }
      if (extraFocalDefocusMetrics.signal > model.maximumDefocusSignal) {
         throw new Error(model.defocusedImageSignalTooLarge);
      }
      var extraFocalDefocusNoise =
         Math.sqrt(extraFocalDefocusMetrics.signal / (
            model.DNPerNormalizedUnit *
            model.gain *
            this.extraFocalEstimationFrameCount
         ));
      console.writeln();
      console.writeln("<b>Inverted extra-focal combined image:</b>");
      writeDefocusMetrics(
         extraFocalDefocusMetrics,
         extraFocalDefocusNoise,
         this.extraFocalEstimationFrameCount
      );
      console.flush();

      var noiseThreshold = Math.sqrt(
         intraFocalDefocusNoise * intraFocalDefocusNoise +
         extraFocalDefocusNoise * extraFocalDefocusNoise
      );

      return {
         intraFocalDefocusMetrics: intraFocalDefocusMetrics,
         extraFocalDefocusMetrics: extraFocalDefocusMetrics,
         noiseThreshold: noiseThreshold
      };
   };

   // Rescales images.
   this.rescaleImages = function(
      intraFocalDefocusMetrics, extraFocalDefocusMetrics
   ) {
      var rescaleRatio = Math.sqrt(
         extraFocalDefocusMetrics.radius / intraFocalDefocusMetrics.radius
      );

      console.writeln(
         "Defocus diameter ratio: ",
         format(
            this.formatRescaleRatioFormat,
            Math.max(rescaleRatio, 1 / rescaleRatio)
         )
      );

      if (
         Math.max(rescaleRatio, 1 / rescaleRatio) >
         this.rescaleRatioThreshold
      ) {
         this.intraFocalEstimationImage =
            this.intraFocalEstimationImage.stagePipeline([
               function(frame) {
                  return frame.rescaleConserveFlux(rescaleRatio);
               }
            ]);

         this.extraFocalEstimationImage =
            this.extraFocalEstimationImage.stagePipeline([
               function(frame) {
                  return frame.rescaleConserveFlux(1 / rescaleRatio);
               }
            ]);
      }
   };

   // Generates basis estimates.
   this.generateBasicEstimates = function(
      intraFocalDefocusMetrics, extraFocalDefocusMetrics
   ) {
      model.defocusDiameterEstimate =
         2 * Math.sqrt(
            intraFocalDefocusMetrics.radius *
            extraFocalDefocusMetrics.radius
         );
      model.defocusObstructionDiameterEstimate =
         2 * Math.sqrt(
            intraFocalDefocusMetrics.obstructionRadius *
            extraFocalDefocusMetrics.obstructionRadius
         );
      model.defocusObstructionRatioEstimate =
         model.defocusObstructionDiameterEstimate /
         model.defocusDiameterEstimate;

      model.defocusDistanceEstimate =
         model.effectivePixelSize() *
         model.focalLength *
         model.defocusDiameterEstimate /
         model.apertureDiameter;

      model.corrugationResolutionEstimate = model.apertureDiameter / Math.sqrt(
         (2 * ( model.focalLength - model.defocusDistanceEstimate) *
         model.focalLength *
         model.observationWavelength) /
         model.defocusDistanceEstimate
      );

      console.writeln(format(
         "Defocus distance: " +
         model.formatDefocusDistanceEstimate +
         " mm",
         model.scaleDefocusDistanceEstimate * model.defocusDistanceEstimate
      ));
      console.writeln(format(
         "Corrugation resolution: " +
         model.formatCorrugationResolutionEstimate +
         " cycles per aperture diameter",
         model.scaleCorrugationResolutionEstimate *
            model.corrugationResolutionEstimate
      ));
      console.writeln(format(
         "Obstruction ratio: " +
         model.formatDefocusObstructionRatioEstimate +
         " %%",
         model.scaleDefocusObstructionRatioEstimate *
            model.defocusObstructionRatioEstimate
      ));
      console.flush();
   };

   // Generates estimation constants.
   this.generateEstimationConstants = function() {
      this.defocusPixelSize =
         model.apertureDiameter / model.defocusDiameterEstimate;
      this.detectorMeshSpacing = 2 / this.intraFocalEstimationImage.rows();
      this.defocusMeshSpacing = 2 / model.defocusDiameterEstimate;

      this.defocusMesh.x.clear();
      this.defocusMesh.y.clear();
      this.defocusMesh = this.generateDefocusMesh();
      model.defocusMesh.x.clear();
      model.defocusMesh.y.clear();
      model.defocusMesh.x = this.defocusMesh.x.clone();
      model.defocusMesh.y = this.defocusMesh.y.clone();

      this.defocusBoundaryMesh.x.clear();
      this.defocusBoundaryMesh.y.clear();
      this.defocusBoundaryMesh = this.generateDefocusBoundaryMesh();

      this.defocusBoundaryDistanceMesh.x.clear();
      this.defocusBoundaryDistanceMesh.y.clear();
      this.defocusBoundaryDistanceMesh =
         this.generateDefocusBoundaryDistanceMesh();

      var self = this;
      this.defocusBoundaryBlend = this.defocusBoundaryBlend.stagePipeline([
         function(frame) {return self.generateDefocusBoundaryBlend();}
      ]);

      var self = this;
      model.defocusDomain = model.defocusDomain.stagePipeline([
         function(frame) {return self.generateDefocusDomain();}
      ]);

      var self = this;
      this.selfConsistencyWavefront =
         this.selfConsistencyWavefront.stagePipeline([
            function(frame) {return self.generateSelfConsistencyWavefront();}
         ]);

      var self = this;
      this.laplacianScale = this.laplacianScale.stagePipeline([
         function(frame) {return self.generateLaplacianScale();}
      ]);
   };

   // Initializes the wavefront estimation.
   // Sets model.defocusDiameterEstimate.
   // Sets model.defocusObstructionDiameterEstimate.
   // Sets model.defocusObstructionRatioEstimate.
   // Sets model.defocusDistanceEstimate.
   // Sets model.corrugationResolutionEstimate.
   // Sets model.defocusDomain.
   this.initializeEstimate = function() {
      this.intraFocalEstimationImage =
         this.intraFocalEstimationImage.stagePipeline([
            function(frame) {return model.intraFocalCombinedImage.clone();}
         ]);
      this.intraFocalEstimationFrameCount =
         model.intraFocalEffectiveFrameCount;

      this.extraFocalEstimationImage =
         this.extraFocalEstimationImage.stagePipeline([
            function(frame) {return model.extraFocalCombinedImage.reverse();}
         ]);
      this.extraFocalEstimationFrameCount =
         model.extraFocalEffectiveFrameCount;

      var defocusThreshold = this.generateDefocusThreshold();

      var defocusMetrics = this.generateDefocusMetrics(defocusThreshold);
      var intraFocalDefocusMetrics = defocusMetrics.intraFocalDefocusMetrics;
      var extraFocalDefocusMetrics = defocusMetrics.extraFocalDefocusMetrics;
      this.noiseThreshold = defocusMetrics.noiseThreshold;

      console.writeln();
      console.writeln("<b>Wavefront estimation:</b>");

      this.rescaleImages(intraFocalDefocusMetrics, extraFocalDefocusMetrics);

      this.generateBasicEstimates(
         intraFocalDefocusMetrics, extraFocalDefocusMetrics
      );

      this.generateEstimationConstants();

      console.writeln("Noise threshold: ", format(
         this.formatNoiseThreshold + " DN RMS",
         this.scaleNoiseThreshold * this.noiseThreshold
      ));
      console.flush();
   };

   // Gives the Jacobian of the compensation transformation of the wavefront,
   // as described in Roddier (1993), with the specified coefficient.
   this.jacobianWavefront = function(wavefront, coefficient) {
      var wavefrontMatrix = wavefront.matrix();
      var rows = wavefrontMatrix.rows;
      var cols = wavefrontMatrix.cols;

      var xxFrame = wavefront.partialDerivativeXX(this.defocusMeshSpacing);
      var yyFrame = wavefront.partialDerivativeYY(this.defocusMeshSpacing);
      var xyFrame = wavefront.partialDerivativeXY(this.defocusMeshSpacing);
      var xx = xxFrame.matrix();
      var yy = yyFrame.matrix();
      var xy = xyFrame.matrix();

      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(
               row, col,
               Math.max(0,
                  1 +
                  coefficient * (xx.at(row, col) + yy.at(row, col)) +
                  square(coefficient) * (
                     xx.at(row, col) * yy.at(row, col) -
                     square(xy.at(row, col))
                  )
               )
            );
         }
      }

      xxFrame.clear();
      yyFrame.clear();
      xyFrame.clear();

      return new FrameReal(newMatrix);
   };

   // Gives the image resampled by the compensation transformation of the
   // wavefront, as described in Roddier (1993), with the specified
   // coefficient.
   this.resampleWavefront = function(wavefront, coefficient, image) {
      var wavefrontMatrix = wavefront.matrix();
      var rows = wavefrontMatrix.rows;
      var cols = wavefrontMatrix.cols;

      var dmx = this.defocusMesh.x.matrix();
      var dmy = this.defocusMesh.y.matrix();

      var xFrame = wavefront.partialDerivativeX(this.defocusMeshSpacing);
      var yFrame = wavefront.partialDerivativeY(this.defocusMeshSpacing);
      var x = xFrame.matrix();
      var y = yFrame.matrix();

      // Division by defocusMeshSpacing transforms normalized aperture
      // coordinates into wavefront indices with an on-axis origin.
      // Addition of 1 / detectorMeshSpacing transforms wavefront indicies with
      // an on-axis origin into nominal wavefront indices.
      var rowMatrix = new Matrix(rows, cols);
      var colMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            rowMatrix.at(
               row, col,
               1 / this.detectorMeshSpacing +
               (dmy.at(row, col) + coefficient * y.at(row, col)) /
                  this.defocusMeshSpacing
            );
            colMatrix.at(
               row, col,
               1 / this.detectorMeshSpacing +
               (dmx.at(row, col) + coefficient * x.at(row, col)) /
                  this.defocusMeshSpacing
            );
         }
      }

      xFrame.clear();
      yFrame.clear();

      var rowFrame = new FrameReal(rowMatrix);
      var colFrame = new FrameReal(colMatrix);
      var imageResample = image.bilinearInterpolate(rowFrame, colFrame);
      rowFrame.clear();
      colFrame.clear();

      return imageResample;
   };

   // Gives an estimate of the wavefront corresponding to the specified
   // detector signal by applying a Fourier technique. The Laplacian operator
   // translates into a multiplication by -(u^2 + v^2) in the Fourier (u, v)
   // domain. Hence taking the Fourier transform of the wavefront Laplacian,
   // dividing it by -(u^2 + v^2), and taking the inverse Fourier transform
   // one should be able to retrieve the wavefront.
   this.fourierSolveWavefront = function(signal) {
      var laplacianScale = this.laplacianScale;
      return signal.clone().stagePipeline([
         function(frame) {return frame.toComplex();},
         function(frame) {
            return frame.fourier(true, function() {view.throwAbort();});
         },
         function(frame) {return frame.quotientReal(laplacianScale);},
         function(frame) {
            return frame.inverseFourier(true, function() {view.throwAbort();});
         },
         function(frame) {return frame.real();}
      ]);
   };

   // Gives the imposition of boundary conditions on the wavefront.
   this.imposeBoundary = function(
      wavefront, defocusBoundaryMesh, defocusBoundaryDistanceMesh
   ) {
      var wavefrontMatrix = wavefront.matrix();

      var bmx = defocusBoundaryMesh.x.matrix();
      var bmy = defocusBoundaryMesh.y.matrix();

      // Division by defocusMeshSpacing transforms normalized aperture
      // coordinates into wavefront indices with an on-axis origin.
      // Addition of 1 / detectorMeshSpacing transforms wavefront indicies
      // with an on-axis origin into nominal wavefront indices.
      var rows = wavefrontMatrix.rows;
      var cols = wavefrontMatrix.cols;
      var rowMatrix = new Matrix(rows, cols);
      var colMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            rowMatrix.at(
               row, col,
               1 / this.detectorMeshSpacing + bmy.at(row, col) /
                  this.defocusMeshSpacing
            );
            colMatrix.at(
               row, col,
               1 / this.detectorMeshSpacing + bmx.at(row, col) /
                  this.defocusMeshSpacing
            );
         }
      }

      var dxFrame = wavefront.partialDerivativeX(this.defocusMeshSpacing);
      var dyFrame = wavefront.partialDerivativeY(this.defocusMeshSpacing);

      var rowFrame = new FrameReal(rowMatrix);
      var colFrame = new FrameReal(colMatrix);
      var wavefrontBoundary =
         wavefront.bilinearInterpolate(rowFrame, colFrame);
      var wavefrontBoundaryDx =
         dxFrame.bilinearInterpolate(rowFrame, colFrame).stagePipeline([
            function(frame) {
               return frame.product(defocusBoundaryDistanceMesh.x);
            }
         ]);
      var wavefrontBoundaryDy =
         dyFrame.bilinearInterpolate(rowFrame, colFrame).stagePipeline([
            function(frame) {
               return frame.product(defocusBoundaryDistanceMesh.y);
            }
         ]);
      rowFrame.clear();
      colFrame.clear();

      dxFrame.clear();
      dyFrame.clear();

      wavefrontBoundary = wavefrontBoundary.stagePipeline([
         function(frame) {return frame.sum(wavefrontBoundaryDx);},
         function(frame) {return frame.sum(wavefrontBoundaryDy);}
      ]);

      wavefrontBoundaryDx.clear();
      wavefrontBoundaryDy.clear();

      return wavefrontBoundary;
   };

   // Gives a wavefront estimate for the specified detector signal using a
   // fixed number of Fourier iterations.
   this.poissonSolveWavefront = function(
      signal, defocusDomain, defocusBoundaryMesh, defocusBoundaryDistanceMesh
   ) {
      var wavefrontEstimate = defocusDomain.clone();
      var signalRefined = signal.product(defocusDomain);

      for (var i = 0; i != this.poissonSolverInterationCount; ++i) {
         wavefrontEstimate.clear();
         wavefrontEstimate = this.fourierSolveWavefront(signalRefined);
         var wavefrontRefined = this.imposeBoundary(
            wavefrontEstimate, defocusBoundaryMesh, defocusBoundaryDistanceMesh
         );

         var signalEstimate =
            wavefrontRefined.laplacian(this.defocusPixelSize);
         wavefrontRefined.clear();
         signalRefined.clear();
         signalRefined = signal.blend(signalEstimate, defocusDomain);
         signalEstimate.clear();

         view.throwAbort();
      }

      signalRefined.clear();

      return wavefrontEstimate;
   };

   // Gives the detector signal of the specified intra-focal and extra-focal
   // images. For robustness, clips the denominator of the detector signal
   // equation by a fraction of its median.
   this.detectorSignal = function(intraFocal, extraFocal, defocusDomain) {
      var n = intraFocal.difference(extraFocal);
      var d = intraFocal.sum(extraFocal);
      var e = d.labeledElements(defocusDomain);
      var t = d.truncate(
         this.detectorSignalThreshold * e.median(), Number.POSITIVE_INFINITY
      );

      var s = n.quotient(t);

      n.clear();
      d.clear();
      e.clear();
      t.clear();

      return s;
   };

   // Generates compensated images.
   this.generateCompensatedImages = function(wavefront) {
      var intraFocalCoefficient = -(
         model.focalLength *
         (model.focalLength - model.defocusDistanceEstimate)
      ) / (
         model.defocusDistanceEstimate * square(0.5 * model.apertureDiameter)
      );
      var extraFocalCoefficient = (
         model.focalLength *
         (model.focalLength + model.defocusDistanceEstimate)
      ) / (
         model.defocusDistanceEstimate * square(0.5 * model.apertureDiameter)
      );

      var wavefrontScale = wavefront.scale(this.wavefrontScale);

      var intraFocalJacobian = this.jacobianWavefront(
         wavefrontScale,
         intraFocalCoefficient
      );
      var intraFocalResample = this.resampleWavefront(
         wavefrontScale,
         intraFocalCoefficient,
         this.intraFocalEstimationImage
      );
      var intraFocalCompensatedImage =
         intraFocalResample.product(intraFocalJacobian);
      intraFocalResample.clear();
      intraFocalJacobian.clear();
      var self = this;
      model.intraFocalCompensatedImage =
         model.intraFocalCompensatedImage.stagePipeline([
            function(frame) {
               return intraFocalCompensatedImage.blend(
                  self.intraFocalEstimationImage, self.defocusBoundaryBlend
               );
            }
         ]);

      var extraFocalJacobian = this.jacobianWavefront(
         wavefrontScale,
         extraFocalCoefficient
      );
      var extraFocalResample = this.resampleWavefront(
         wavefrontScale,
         extraFocalCoefficient,
         this.extraFocalEstimationImage
      );
      var extraFocalCompensatedImage =
         extraFocalResample.product(extraFocalJacobian);
      extraFocalResample.clear();
      extraFocalJacobian.clear();
      var self = this;
      model.extraFocalCompensatedImage =
         model.extraFocalCompensatedImage.stagePipeline([
            function(frame) {
               return extraFocalCompensatedImage.blend(
                  self.extraFocalEstimationImage, self.defocusBoundaryBlend
               );
            }
         ]);

      wavefrontScale.clear();

      var residualAberration =
         intraFocalCompensatedImage.difference(
            extraFocalCompensatedImage
         ).stagePipeline([
            function(frame) {
               return frame.labeledElements(model.defocusDomain);
            },
            function(frame) {return frame.stdDev();}
         ]);

      console.writeln("Residual aberration: ", format(
         this.formatResidualAberration + " DN RMS",
         this.scaleResidualAberration * residualAberration
      ));
      console.flush();

      return {
         intraFocalCompensatedImage: intraFocalCompensatedImage,
         extraFocalCompensatedImage: extraFocalCompensatedImage,
         residualAberration: residualAberration
      };
   };

   // Generates the wavefront estimate.
   this.generateWavefrontEstimate = function(
      intraFocalCompensatedImage, extraFocalCompensatedImage
   ) {
      var self = this;
      var detectorSignal = this.detectorSignal(
         intraFocalCompensatedImage,
         extraFocalCompensatedImage,
         model.defocusDomain
      ).stagePipeline([
         function(frame) {
            return frame.scale(
               model.defocusDistanceEstimate / (
                  self.wavefrontScale *
                  model.focalLength *
                  (model.focalLength - model.defocusDistanceEstimate)
               )
            );
         }
      ]);

      var selfConsistencyOffset = detectorSignal.clone().stagePipeline([
         function(frame) {return frame.labeledElements(model.defocusDomain);},
         function(frame) {return frame.mean();}
      ]);
      var selfConsistencyScale =
         selfConsistencyOffset *
         square(this.defocusPixelSize) /
         square(this.defocusMeshSpacing) /
         (8 * Math.sqrt(3));

      var self = this;
      var selfConsistencyWavefront =
         this.selfConsistencyWavefront.scale(selfConsistencyScale);
      var wavefrontEstimate = detectorSignal.stagePipeline([
         function(frame) {return frame.offset(-selfConsistencyOffset);},
         function(frame) {
            return self.poissonSolveWavefront(
               frame,
               model.defocusDomain,
               self.defocusBoundaryMesh,
               self.defocusBoundaryDistanceMesh
            );
         },
         function(frame) {return frame.sum(selfConsistencyWavefront);}
      ]);
      selfConsistencyWavefront.clear();

      return wavefrontEstimate;
   };

   // Generates the Zernike 4 residual.
   this.generateZernike4Residual = function(wavefront) {
      var self = this;
      var zernike4Fit = wavefront.clone().stagePipeline([
         function(frame) {
            return (new ZernikeAberrations()).zernike4Fit(
               self.defocusMesh,
               model.defocusDomain,
               frame,
               model.defocusObstructionRatioEstimate
            );
         }
      ]);

      for (var row = 0; row != zernike4Fit.coefficients.rows(); ++row) {
         model.aberrationCoefficientsEstimate.push(
            this.wavefrontScale * zernike4Fit.coefficients.matrix().at(row, 0)
         );
      }
      zernike4Fit.coefficients.clear();

      view.throwAbort();

      return zernike4Fit.residual;
   };

   // Generates the Zernike residual.
   this.generateZernikeResidual = function(wavefront) {
      var self = this;
      var zernikeFit = wavefront.clone().stagePipeline([
         function(frame) {
            return (new ZernikeAberrations()).zernikeFit(
               self.defocusMesh,
               model.defocusDomain,
               frame,
               model.defocusObstructionRatioEstimate
            );
         }
      ]);

      for (var row = 4; row != zernikeFit.coefficients.rows(); ++row) {
         model.aberrationCoefficientsEstimate.push(
            this.wavefrontScale * zernikeFit.coefficients.matrix().at(row, 0)
         );
      }
      zernikeFit.coefficients.clear();

      view.throwAbort();

      return zernikeFit.residual;
   };

   this.generateInterferogramEstimate = function(
      angle, fringeCount, fringePhase
   ) {
      var cosAngle = Math.cos(angle);
      var sinAngle = Math.sin(angle);

      var defocusMeshX = this.defocusMesh.x.matrix();
      var defocusMeshY = this.defocusMesh.y.matrix();
      var wavefront = model.wavefrontEstimate.matrix();
      var rows = wavefront.rows;
      var cols = wavefront.cols;
      var interferogram = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            interferogram.at(
               row,
               col,
               0.5 * (1 + Math.cos(2 * Math.PI * (
                  0.5 * fringeCount *
                  (
                     cosAngle * defocusMeshX.at(row, col) +
                     sinAngle * defocusMeshY.at(row, col)
                  ) -
                  wavefront.at(row, col) / model.observationWavelength -
                  fringePhase
               )))
            );
         }
      }

      return new FrameReal(interferogram);
   };

   // Performs the wavefront estimation processes.
   // Sets model.intraFocalCompensatedImage.
   // Sets model.extraFocalCompensatedImage.
   // Sets model.aberrationCoefficientsEstimate.
   // Sets model.wavefrontEstimate.
   // Sets model.wavefrontErrorEstimate.
   // Sets model.interferogramEstimateSagittal.
   // Sets model.interferogramEstimateMeridional.
   this.refineEstimate = function() {
      var totalWavefrontEstimate = model.defocusDomain.scale(0);
      var residualAberration = Number.POSITIVE_INFINITY;

      for (
         var i = 0;
         i != this.maximumCompensationIterationCount &&
            residualAberration > this.noiseThreshold;
         ++i
      ) {
         var compensatedImages =
            this.generateCompensatedImages(totalWavefrontEstimate);
         var intraFocalCompensatedImage =
            compensatedImages.intraFocalCompensatedImage;
         var extraFocalCompensatedImage =
            compensatedImages.extraFocalCompensatedImage;
         residualAberration = compensatedImages.residualAberration;

         var wavefrontEstimate = this.generateWavefrontEstimate(
            intraFocalCompensatedImage, extraFocalCompensatedImage
         );
         intraFocalCompensatedImage.clear();
         extraFocalCompensatedImage.clear();

         var self = this;
         totalWavefrontEstimate = wavefrontEstimate.stagePipeline([
            function(frame) {
               return frame.scale(self.compensationAggressivenessFactor);
            },
            function(estimateFrame) {
               return totalWavefrontEstimate.stagePipeline([
                  function(frame) {return frame.sum(estimateFrame);}
               ]);
             }
         ]);

         view.throwAbort();
      }

      if (i == this.maximumCompensationIterationCount) {
         throw new Error(model.wavefrontRefinementDidNotConverge);
      }

      var compensatedImages =
         this.generateCompensatedImages(totalWavefrontEstimate);
      compensatedImages.intraFocalCompensatedImage.clear();
      compensatedImages.extraFocalCompensatedImage.clear();

      model.aberrationCoefficientsEstimate = new Array();

      var self = this;
      totalWavefrontEstimate = totalWavefrontEstimate.stagePipeline([
         function(frame) {return self.generateZernike4Residual(frame);}
      ]);

      model.wavefrontEstimate = model.wavefrontEstimate.stagePipeline([
         function(frame) {
            return totalWavefrontEstimate.scale(
               self.wavefrontScale
            ).stagePipeline([
               function(frame) {
                  return frame.product(self.defocusBoundaryBlend);
               }
            ]);
         }
      ]);
      model.wavefrontErrorEstimate =
         model.wavefrontEstimate.clone().stagePipeline([
            function(frame) {
               return frame.labeledElements(model.defocusDomain);
            },
            function(frame) {return frame.rms();}
         ]);
      view.throwAbort();

      var fringeCount = Math.max(4, Math.min(30,
         2 * Math.round(
            0.5 * model.fringeCountScale * model.corrugationResolutionEstimate
         )
      ));
      var fringePhase = 0.5 - 0.5 * fringeCount;
      model.interferogramEstimateSagittal =
         model.interferogramEstimateSagittal.stagePipeline([
            function(frame) {
               return self.generateInterferogramEstimate(
                  0.0 * Math.PI, fringeCount, fringePhase
               );
            }
         ]);
      model.interferogramEstimateMeridional =
         model.interferogramEstimateMeridional.stagePipeline([
            function(frame) {
               return self.generateInterferogramEstimate(
                  -0.5 * Math.PI, fringeCount, fringePhase
               );
            }
         ]);
      view.throwAbort();

      var residualRMS = totalWavefrontEstimate.stagePipeline([
         function(frame) {return self.generateZernikeResidual(frame);},
         function(frame) {return frame.labeledElements(model.defocusDomain);},
         function(frame) {return frame.rms();}
      ]);
      model.aberrationCoefficientsEstimate.push(
         this.wavefrontScale * residualRMS
      );
      view.throwAbort();

      console.write(format(
         "Wavefront error: " +
         model.formatWavefrontErrorEstimate +
         " nm RMS",
         model.scaleWavefrontErrorEstimate * model.wavefrontErrorEstimate
      ));
      if (
         model.observationWavelength < 10000.0 * model.wavefrontErrorEstimate
      ) {
         console.writeln(format(
            ", 1/" +
            model.formatWavefrontErrorEstimateFraction +
            " λ RMS",
            model.observationWavelength / model.wavefrontErrorEstimate
         ));
      }
      else {
         console.writeln(", 0.0 λ RMS");
      }

      console.writeln();
      console.writeln("<b>Aberration estimation:</b>");

      if (false) {
         for (var i = 0; i != 4; ++i) {
            console.writeln(format(
               this.aberrationLabels[i] +
               ": " +
               model.formatAberrationCoefficientsEstimate +
               " nm RMS",
               model.scaleAberrationCoefficientsEstimate *
                  model.aberrationCoefficientsEstimate[i]
            ));
         }
      }

      for (var i = 4; i != this.aberrationLabels.length; ++i) {
         console.writeln(format(
            this.aberrationLabels[i] +
            ": " +
            model.formatAberrationCoefficientsEstimate +
            " nm RMS",
            model.scaleAberrationCoefficientsEstimate *
               model.aberrationCoefficientsEstimate[i]
         ));
      }
      console.flush();
   };

   // Finalizes the wavefront estimation.
   this.finalizeEstimate = function() {
      this.defocusMesh.x.clear();
      this.defocusMesh.y.clear();
      this.defocusBoundaryMesh.x.clear();
      this.defocusBoundaryMesh.y.clear();
      this.defocusBoundaryDistanceMesh.x.clear();
      this.defocusBoundaryDistanceMesh.y.clear();
      this.defocusBoundaryBlend.clear();
      this.selfConsistencyWavefront.clear();
      this.laplacianScale.clear();

      this.intraFocalEstimationImage.clear();
      this.extraFocalEstimationImage.clear();
   };

   this.estimateWavefront = function() {
      this.initializeEstimate();
      this.refineEstimate();
      this.finalizeEstimate();

      controller.wavefrontTabController.setWavefrontPane();
      controller.wavefrontTabController.setAberrationsPane();
   };
}

// ****************************************************************************
// EOF EstimateWavefront.js - Released 2016/12/30 00:00:00 UTC
