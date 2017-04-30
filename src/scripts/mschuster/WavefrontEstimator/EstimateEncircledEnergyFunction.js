// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// EstimateEncircledEnergyFunction.js - Released 2016/12/30 00:00:00 UTC
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

function EstimateEncircledEnergyFunction(model) {

   // The number of 3 element moving average smoothing interations.
   this.smoothingIterations = 8;

   this.generateEncircledEnergyFunction = function(pointSpreadFunction) {
      var encircledEnergyFunction = new Array();
      encircledEnergyFunction.push(new Point(0, 0));

      // Generates encircled energy elements.
      var matrix = pointSpreadFunction.matrix();
      var rows = matrix.rows;
      var cols = matrix.cols;
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var x = col - 0.5 * cols;
            var y = row - 0.5 * rows;
            var r = model.pointSpreadFunctionPixelSize *
               Math.sqrt(x * x + y * y);
            if (r <= 0.5 * model.encircledEnergyFunctionMaximumDiameter) {
               encircledEnergyFunction.push(
                  new Point(2 * r, matrix.at(row, col))
               );
            }
         }
      }

      // Sort the elements by diameter.
      encircledEnergyFunction.sort(function(a, b) {return a.x - b.x;});

      // Generates cumulative encircled energy elements.
      var cumulativeEncircledEnergy = 0;
      for (var i = 0; i != encircledEnergyFunction.length; ++i) {
         var energy = encircledEnergyFunction[i].y;
         encircledEnergyFunction[i].y += cumulativeEncircledEnergy;
         cumulativeEncircledEnergy += energy;
      }

      // Normalizes elements by total energy.
      var totalEncircledEnergy = rows * cols * pointSpreadFunction.mean();
      for (var i = 0; i != encircledEnergyFunction.length; ++i) {
         encircledEnergyFunction[i].y /= totalEncircledEnergy;
      }

      // Filters duplicate elements.
      var filterFunction = new Array();
      filterFunction.push(encircledEnergyFunction[0]);
      for (var i = 1; i != encircledEnergyFunction.length; ++i) {
         if (
            filterFunction[filterFunction.length - 1].x ==
               encircledEnergyFunction[i].x
         ) {
            filterFunction[filterFunction.length - 1].y =
               encircledEnergyFunction[i].y;
         }
         else {
            filterFunction.push(encircledEnergyFunction[i]);
         }
      }
      encircledEnergyFunction = filterFunction;

      // Performs multiple 3 element moving average smoothings.
      for (var j = 0; j != this.smoothingIterations; ++j) {
         var filterFunction = new Array();
         filterFunction.push(encircledEnergyFunction[0]);
         for (var i = 1; i != encircledEnergyFunction.length - 1; ++i) {
            filterFunction.push(new Point(
               (
                  encircledEnergyFunction[i - 1].x +
                  encircledEnergyFunction[i].x +
                  encircledEnergyFunction[i + 1].x
               ) / 3,
               (
                  encircledEnergyFunction[i - 1].y +
                  encircledEnergyFunction[i].y +
                  encircledEnergyFunction[i + 1].y
               ) / 3
            ));
         }
         filterFunction.push(
            encircledEnergyFunction[encircledEnergyFunction.length - 1]
         );
         encircledEnergyFunction = filterFunction;
      }

      if (false) {
         console.writeln("encircledEnergyFunction = {");
         for (var i = 0; i != encircledEnergyFunction.length; ++i) {
            console.writeln(
               "{",
               encircledEnergyFunction[i].x,
               ", ",
               encircledEnergyFunction[i].y,
               i != encircledEnergyFunction.length - 1 ? "}," : "}"
            );
         }
         console.writeln("};");
      }

      return encircledEnergyFunction;
   };

   // Gives the diameter of a specified encircled energy.
   this.generateEncircledEnergyDiameter = function(
      encircledEnergyFunction, encircledEnergy
   ) {
      if (encircledEnergyFunction.length == 0) {
         return 0;
      }

      for (var i = 1; i != encircledEnergyFunction.length; ++i) {
         if (
            encircledEnergyFunction[i - 1].y < encircledEnergy &&
            encircledEnergy <= encircledEnergyFunction[i].y
         ) {
            var e0 = encircledEnergyFunction[i - 1];
            var e1 = encircledEnergyFunction[i];
            return (encircledEnergy - e0.y) / (e1.y - e0.y) *
               (e1.x - e0.x) + e0.x;
         }
      }

      return 0;
   };

   // Estimates the encircled energy function.
   // Sets model.encircledEnergyFunctionMaximumDiameter.
   // Sets model.encircledEnergyFunctionIdeal.
   // Sets model.encircledEnergyFunctionEstimate.
   // Sets model.encircledEnergyFunctionEE50Diameter.
   // Sets model.encircledEnergyFunctionEE80Diameter.
   this.estimateEncircledEnergyFunction = function() {
      // Unobstructed airy disk diameter in meters.
      // Constant (2 / Pi) * (x /. FindRoot[BesselJ[1, x], {x, 1.22 * Pi}]).
      var airyDiskDiameter =
         2.43934 * model.observationWavelength * model.focalLength /
            model.apertureDiameter;
      if (model.defocusObstructionDiameterEstimate == 0) {
         model.encircledEnergyFunctionMaximumDiameter =
            (model.strehlRatioEstimate > 0.6 ?
               2.5 :
               model.strehlRatioEstimate > 0.4 ? 3.5 : 4.5
            ) *
            airyDiskDiameter;
      }
      else {
         model.encircledEnergyFunctionMaximumDiameter =
            (model.strehlRatioEstimate > 0.6 ?
               3.5 :
               model.strehlRatioEstimate > 0.4 ? 4.5 : 5.5
            ) *
            airyDiskDiameter;
      }

      model.encircledEnergyFunctionIdeal =
         this.generateEncircledEnergyFunction(
            model.pointSpreadFunctionIdeal
         );

      model.encircledEnergyFunctionEstimate =
         this.generateEncircledEnergyFunction(
            model.pointSpreadFunctionEstimate
         );

      model.encircledEnergyFunctionEE50Diameter =
         this.generateEncircledEnergyDiameter(
            model.encircledEnergyFunctionEstimate, 0.5
         );

      model.encircledEnergyFunctionEE80Diameter =
         this.generateEncircledEnergyDiameter(
            model.encircledEnergyFunctionEstimate, 0.8
         );

      if (model.encircledEnergyFunctionEE50Diameter != 0) {
         console.writeln(format(
            "EE 50%% diameter: " +
            model.formatStrehlDiameterEstimate +
            " μm, " +
            model.formatStrehlDiameterAngleEstimate +
            " arcsec",
            model.scaleStrehlDiameterEstimate *
               model.encircledEnergyFunctionEE50Diameter,
            model.scaleStrehlDiameterAngleEstimate *
               model.arcsecondsPerRadian *
               model.encircledEnergyFunctionEE50Diameter / model.focalLength
         ));
      }
      if (model.encircledEnergyFunctionEE80Diameter != 0) {
         console.writeln(format(
            "EE 80%% diameter: " +
            model.formatStrehlDiameterEstimate +
            " μm, " +
            model.formatStrehlDiameterAngleEstimate +
            " arcsec",
            model.scaleStrehlDiameterEstimate *
               model.encircledEnergyFunctionEE80Diameter,
            model.scaleStrehlDiameterAngleEstimate *
               model.arcsecondsPerRadian *
               model.encircledEnergyFunctionEE80Diameter / model.focalLength
         ));
      }
   };
}

// ****************************************************************************
// EOF EstimateEncircledEnergyFunction.js - Released 2016/12/30 00:00:00 UTC
