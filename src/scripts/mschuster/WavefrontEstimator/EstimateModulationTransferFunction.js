// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// EstimateModulationTransferFunction.js - Released 2016/12/30 00:00:00 UTC
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

function EstimateModulationTransferFunction(model, view, controller) {

   // Gives the sagittal modulation.
   this.generateSagittalModulation = function(modulation, scale, angle) {
      var matrix = modulation.matrix();
      var rows = matrix.rows;
      var cols = matrix.cols;
      var max = modulation.max();
      var cos = Math.cos(angle);
      var sin = Math.sin(angle);
      var sagittal = new Array();
      for (
         var i = 0;
         i <= model.defocusDiameterEstimate &&
         (sagittal.length == 0 || sagittal[sagittal.length - 1].y > 0);
         ++i
      ) {
         var pRow = rows / 2 + i * sin;
         var pCol = cols / 2 + i * cos;
         var iRow = Math.floor(pRow);
         var iCol = Math.floor(pCol);
         var fRow = pRow - iRow;
         var fCol = pCol - iCol;
         sagittal.push(new Point(
            model.maximumSpatialFrequencyOptics * i /
               model.defocusDiameterEstimate,
            scale * (
               (1 - fRow) * (1 - fCol) * matrix.at(iRow, iCol) +
               (1 - fRow) * fCol * matrix.at(iRow, iCol + 1) +
               fRow * (1 - fCol) * matrix.at(iRow + 1, iCol) +
               fRow * fCol * matrix.at(iRow + 1, iCol + 1)
            ) / max
         ));
      }

      if (sagittal.length > 1 && sagittal[sagittal.length - 1].y < 0) {
         var p0 = sagittal[sagittal.length - 2];
         var p1 = sagittal[sagittal.length - 1];
         sagittal[sagittal.length - 1] = new Point(
            (p1.y - 0) / (p1.y - p0.y) * (p1.x - p0.x) + p0.x, 0
         );
      }

      return sagittal;
   };

   // Gives the meridional modulation.
   this.generateMeridionalModulation = function(modulation, scale, angle) {
      var matrix = modulation.matrix();
      var rows = matrix.rows;
      var cols = matrix.cols;
      var max = modulation.max();
      var cos = Math.cos(angle);
      var sin = Math.sin(angle);
      var meridional = new Array();
      for (
         var i = 0;
         i <= model.defocusDiameterEstimate &&
         (meridional.length == 0 || meridional[meridional.length - 1].y > 0);
         ++i
      ) {
         var pRow = rows / 2 - i * cos;
         var pCol = cols / 2 + i * sin;
         var iRow = Math.floor(pRow);
         var iCol = Math.floor(pCol);
         var fRow = pRow - iRow;
         var fCol = pCol - iCol;
         meridional.push(new Point(
            model.maximumSpatialFrequencyOptics * i /
               model.defocusDiameterEstimate,
            scale * (
               (1 - fRow) * (1 - fCol) * matrix.at(iRow, iCol) +
               (1 - fRow) * fCol * matrix.at(iRow, iCol + 1) +
               fRow * (1 - fCol) * matrix.at(iRow + 1, iCol) +
               fRow * fCol * matrix.at(iRow + 1, iCol + 1)
            ) / max
         ));
      }

      if (meridional.length > 1 && meridional[meridional.length - 1].y < 0) {
         var p0 = meridional[meridional.length - 2];
         var p1 = meridional[meridional.length - 1];
         meridional[meridional.length - 1] = new Point(
            (p1.y - 0) / (p1.y - p0.y) * (p1.x - p0.x) + p0.x, 0
         );
      }

      return meridional;
   };

   // Gives the detector modulation.
   this.generateDetectorModulation = function(opticsModulation) {
      function sinc(z) {
         return z == 0 ? 1 : Math.sin(z) / z;
      }

      var detectorModulation = new Array();
      for (
         var i = 0;
         i != opticsModulation.length &&
         (detectorModulation.length == 0 ||
            detectorModulation[detectorModulation.length - 1].y > 0);
         ++i
      ) {
         var z = (
            opticsModulation[i].x / model.maximumSpatialFrequencyDetector
         ) * Math.PI;
         detectorModulation.push(new Point(
            opticsModulation[i].x,
            sinc(z) * opticsModulation[i].y
         ));
      }

      if (
         detectorModulation.length > 1 &&
         detectorModulation[detectorModulation.length - 1].y < 0
      ) {
         var p0 = detectorModulation[detectorModulation.length - 2];
         var p1 = detectorModulation[detectorModulation.length - 1];
         detectorModulation[detectorModulation.length - 1] = new Point(
            (p1.y - 0) / (p1.y - p0.y) * (p1.x - p0.x) + p0.x, 0
         );
      }

      return detectorModulation;
   }

   // Gives the resolution of a specified modulation transfer.
   this.generateModulationTransferResolution = function(
      modulationTransferFunction, modulation
   ) {
      if (modulationTransferFunction.length == 0) {
         return 0;
      }

      for (var i = 1; i != modulationTransferFunction.length; ++i) {
         if (
            modulationTransferFunction[i - 1].y > modulation &&
            modulation >= modulationTransferFunction[i].y
         ) {
            var e0 = modulationTransferFunction[i - 1];
            var e1 = modulationTransferFunction[i];
            return (modulation - e0.y) / (e1.y - e0.y) *
               (e1.x - e0.x) + e0.x;
         }
      }

      return 0;
   };

   // Estimates the modulation transfer function, which equals the real part of
   // the fourier transform of the point spread function.
   // Sets model.modulationTransferFunctionIdeal.
   // Sets model.modulationTransferFunctionEstimate.
   // Sets model.maximumSpatialFrequencyOptics.
   // Sets model.maximumSpatialFrequencyDetector.
   // Sets model.modulationTransferFunctionOpticsIdeal.
   // Sets model.modulationTransferFunctionOpticsSagittal.
   // Sets model.modulationTransferFunctionOpticsMeridional.
   // Sets model.modulationTransferFunctionDetectorIdeal.
   // Sets model.modulationTransferFunctionDetectorSagittal.
   // Sets model.modulationTransferFunctionDetectorMeridional.
   this.estimateModulationTransferFunction = function() {
      // Ideal modulation transfer function.
      view.throwAbort();
      model.modulationTransferFunctionIdeal =
         model.modulationTransferFunctionIdeal.stagePipeline([
         function(frame) {return model.pointSpreadFunctionIdeal.toComplex();},
         function(frame) {
            return frame.fourier(true, function() {view.throwAbort();});
         },
         function(frame) {return frame.modulus();}
      ]);
      view.throwAbort();

      // Estimate modulation transfer function.
      view.throwAbort();
      model.modulationTransferFunctionEstimate =
         model.modulationTransferFunctionEstimate.stagePipeline([
         function(frame) {
            return model.pointSpreadFunctionEstimate.toComplex();
         },
         function(frame) {
            return frame.fourier(true, function() {view.throwAbort();});
         },
         function(frame) {return frame.modulus();}
      ]);
      view.throwAbort();

      // Generate maximum spatial frequency optics in lp/mm.
      // Maximum spatial frequency optics is 1 cycle per lambda /
      // apertureDiameter radians.
      model.maximumSpatialFrequencyOptics =
         1e-3 / (
            model.observationWavelength * model.focalLength /
               model.apertureDiameter
         );

      // Generate maximum spatial frequency detector in lp/mm.
      // Maximum spatial frequency detector is 1 cycle per detector pixel size.
      model.maximumSpatialFrequencyDetector =
         1e-3 / model.effectivePixelSize();

      // Generate ideal, ideal obstructed, and estimate optics functions.
      model.modulationTransferFunctionOpticsIdeal =
         this.generateSagittalModulation(
            model.modulationTransferFunctionIdeal, 1, 0
         );
      model.modulationTransferFunctionOpticsSagittal =
         this.generateSagittalModulation(
            model.modulationTransferFunctionEstimate, 1, 0
         );
      model.modulationTransferFunctionOpticsMeridional =
         this.generateMeridionalModulation(
            model.modulationTransferFunctionEstimate, 1, 0
         );

      // Generate ideal, ideal obstructed, and estimate detector functions.
      model.modulationTransferFunctionDetectorIdeal =
         this.generateDetectorModulation(
            model.modulationTransferFunctionOpticsIdeal
         );
      model.modulationTransferFunctionDetectorSagittal =
         this.generateDetectorModulation(
            model.modulationTransferFunctionOpticsSagittal
         );
      model.modulationTransferFunctionDetectorMeridional =
         this.generateDetectorModulation(
            model.modulationTransferFunctionOpticsMeridional
         );

      var modulations = [0.8, 0.5];
      console.writeln("Telescope:");
      for (var i = 0; i != modulations.length; ++i) {
         var modulation = modulations[i];
         console.write(
            format("MTF %.0f%% spatial frequency: ", 100 * modulation)
         );
         var resolution = this.generateModulationTransferResolution(
            model.modulationTransferFunctionOpticsSagittal, modulation
         );
         var sagittal = resolution != 0;
         if (sagittal) {
            console.write(format("Sagittal %.1f lp/mm", resolution));
         }
         var resolution = this.generateModulationTransferResolution(
            model.modulationTransferFunctionOpticsMeridional, modulation
         );
         var meridional = resolution != 0;
         if (meridional) {
            if (sagittal) {
               console.write(", ");
            }
            console.write(format("Meridional %.1f lp/mm", resolution));
         }
         console.writeln();
      }
      console.writeln("Telescope and Detector:");
      for (var i = 0; i != modulations.length; ++i) {
         var modulation = modulations[i];
         console.write(
            format("MTF %.0f%% spatial frequency: ", 100 * modulation)
         );
         var resolution = this.generateModulationTransferResolution(
            model.modulationTransferFunctionDetectorSagittal, modulation
         );
         var sagittal = resolution != 0;
         if (sagittal) {
            console.write(format("Sagittal %.1f lp/mm", resolution));
         }
         var resolution = this.generateModulationTransferResolution(
            model.modulationTransferFunctionDetectorMeridional, modulation
         );
         var meridional = resolution != 0;
         if (meridional) {
            if (sagittal) {
               console.write(", ");
            }
            console.write(format("Meridional %.1f lp/mm", resolution));
         }
         console.writeln();
      }
   };
};

// ****************************************************************************
// EOF EstimateModulationTransferFunction.js - Released 2016/12/30 00:00:00 UTC
