// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// EstimatePointSpreadFunction.js - Released 2016/12/30 00:00:00 UTC
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

function EstimatePointSpreadFunction(model, view, controller) {

   // Estimates the point spread function, Strehl ratio, and Strehl diameter.
   // The point spread function equals the norm of the fourier transform of the
   // wavefront.
   // Sets model.pointSpreadFunctionIdeal.
   // Sets model.pointSpreadFunctionEstimate.
   // Sets model.strehlRatioEstimate.
   // Sets model.pointSpreadFunctionPixelSize.
   // Sets model.strehlDiameterEstimate.
   // Sets model.strehlDiameterAngleEstimate.
   this.estimatePointSpreadFunction = function() {
      // Padding required.
      var fourierSize = 8 * model.wavefrontEstimate.rows();
      var fourierPad = 0.5 * (fourierSize - model.wavefrontEstimate.rows());

      // Ideal point spread function.
      view.throwAbort();
      model.pointSpreadFunctionIdeal =
         model.pointSpreadFunctionIdeal.stagePipeline([
            function(frame) {return model.defocusDomain.toComplex();},
            function(frame) {return frame.padRows(fourierPad, fourierPad, 0);},
            function(frame) {return frame.padCols(fourierPad, fourierPad, 0);},
            function(frame) {
               return frame.fourier(true, function() {view.throwAbort();});
            },
            function(frame) {return frame.norm();}
         ]);
      view.throwAbort();

      // Estimate point spread function.
      view.throwAbort();
      model.pointSpreadFunctionEstimate =
         model.pointSpreadFunctionEstimate.stagePipeline([
            function(frame) {
               return model.wavefrontEstimate.scale(
                  1 / model.observationWavelength
               );
            },
            function(frame) {return frame.toComplexExp2PiI();},
            function(frame) {return frame.productReal(model.defocusDomain);},
            function(frame) {return frame.padRows(fourierPad, fourierPad, 0);},
            function(frame) {return frame.padCols(fourierPad, fourierPad, 0);},
            function(frame) {
               return frame.fourier(true, function() {view.throwAbort();});
            },
            function(frame) {return frame.norm();}
         ]);
      view.throwAbort();

      // Strehl ratio estimate.
      model.strehlRatioEstimate =
         model.pointSpreadFunctionEstimate.max() /
         model.pointSpreadFunctionIdeal.max();

      // Point spread function pixel size in meters.
      model.pointSpreadFunctionPixelSize =
         (
            model.observationWavelength * model.focalLength /
            model.apertureDiameter
         ) /
         (fourierSize / model.defocusDiameterEstimate);

      // Strehl diameter estimate in meters.
      model.strehlDiameterEstimate =
         2 * model.pointSpreadFunctionPixelSize * Math.sqrt(
            square(fourierSize) * model.pointSpreadFunctionEstimate.mean() /
            (Math.PI * model.pointSpreadFunctionEstimate.max())
         );

      // Strehl diameter angle estimate in arcseconds.
      model.strehlDiameterAngleEstimate =
         model.arcsecondsPerRadian * model.strehlDiameterEstimate /
            model.focalLength;

      console.writeln(format(
         "Strehl ratio: " +
         model.formatStrehlRatioEstimate,
         model.scaleStrehlRatioEstimate * model.strehlRatioEstimate
      ));
      console.writeln(format(
         "Strehl diameter: " +
         model.formatStrehlDiameterEstimate +
         " μm, " +
         model.formatStrehlDiameterAngleEstimate +
         " arcsec",
         model.scaleStrehlDiameterEstimate *
            model.strehlDiameterEstimate,
         model.scaleStrehlDiameterAngleEstimate *
            model.strehlDiameterAngleEstimate
      ));
      console.flush();

      controller.wavefrontTabController.setPointSpreadFunctionPane();
   };
};

// ****************************************************************************
// EOF EstimatePointSpreadFunction.js - Released 2016/12/30 00:00:00 UTC
