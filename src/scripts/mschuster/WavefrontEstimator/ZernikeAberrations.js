// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// ZernikeAberrations.js - Released 2016/12/30 00:00:00 UTC
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

function ZernikeAberrations() {
   // Singular values smaller than the product of this threshold and a
   // default will be dropped.
   this.pseudoInverseThreshold = 1;

   // Gives the aberration labels.
   this.aberrationLabels = function() {
      return new Array(
         "Z1 (0, 0) Piston",
         "Z2 (1, 1) Tilt horizontal",
         "Z3 (1, -1) Tilt vertical",
         "Z4 (2, 0) Defocus",
         "Z5 (2, -2) Primary astigmatism oblique",
         "Z6 (2, 2) Primary astigmatism vertical",
         "Z7 (3, -1) Primary coma vertical",
         "Z8 (3, 1) Primary coma horizontal",
         "Z9 (3, -3) Primary trefoil vertical",
         "Z10 (3, 3) Primary trefoil oblique",
         "Z11 (4, 0) Primary spherical",
         "Z12 (4, 2) Secondary astigmatism vertical",
         "Z13 (4, -2) Secondary astigmatism oblique",
         "Z14 (4, 4) Primary tetrafoil vertical",
         "Z15 (4, -4) Primary tetrafoil oblique",
         "Z16 (5, 1) Secondary coma horizontal",
         "Z17 (5, -1) Secondary coma vertical",
         "Z18 (5, 3) Secondary trefoil oblique",
         "Z19 (5, -3) Secondary trefoil vertical",
         "Z20 (5, 5) Primary pentafoil oblique",
         "Z21 (5, -5) Primary pentafoil vertical",
         "Z22 (6, 0) Secondary spherical",
         // "Z23 (6, -2) Tertiary astigmatism oblique",
         // "Z24 (6, 2) Tertiary astigmatism vertical",
         // "Z29 (7, -1) Tertiary coma vertical",
         // "Z30 (7, 1) Tertiary coma horizontal",
         // "Z37 (8, 0) Tertiary spherical",
         "Residual aberration"
      );
   };

   // Gives the Zernike basis size.
   this.zernikeBasisSize = this.aberrationLabels().length - 1;

   // Gives the Zernike [z1, z4] basis for mesh and no obstruction.
   this.zernike4BasisNoObstruction = function(mesh) {
      var mx = mesh.x.matrix();
      var my = mesh.y.matrix();
      var rows = mx.rows;
      var cols = mx.cols;

      var newMatrix = new Matrix(rows * cols, 4);
      var newRow = 0;
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var x = mx.at(row, col);
            var y = my.at(row, col);
            var r = Math.sqrt(x * x + y * y);
            var r2 = r * r;
            var a = x == 0 && y == 0 ? 0 : Math.atan2(-y, x);

            newMatrix.at(newRow, 0, 1);
            newMatrix.at(newRow, 1, 2 * Math.cos(a) * r);
            newMatrix.at(newRow, 2, 2 * Math.sin(a) * r);
            newMatrix.at(newRow, 3, Math.sqrt(3) * (2 * r2 - 1));
            ++newRow;
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives the Zernike [z1, z4] basis for mesh and obstruction.
   this.zernike4BasisObstruction = function(mesh, obstruction) {
      var mx = mesh.x.matrix();
      var my = mesh.y.matrix();
      var rows = mx.rows;
      var cols = mx.cols;

      var e2 = obstruction * obstruction;
      var e2p1 = e2 + 1;
      var e2m1 = e2 - 1;

      var newMatrix = new Matrix(rows * cols, 4);
      var newRow = 0;
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var x = mx.at(row, col);
            var y = my.at(row, col);
            var r = Math.sqrt(x * x + y * y);
            var r2 = r * r;
            var a = x == 0 && y == 0 ? 0 : Math.atan2(-y, x);

            newMatrix.at(newRow, 0, 1);
            newMatrix.at(newRow, 1, 2 * Math.cos(a) / Math.sqrt(e2p1) * r);
            newMatrix.at(newRow, 2, 2 * Math.sin(a) / Math.sqrt(e2p1) * r);
            newMatrix.at(newRow, 3, -Math.sqrt(3) / e2m1 * (2 * r2 - e2p1));
            ++newRow;
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives the Zernike [z1, z4] basis for mesh and obstruction.
   this.zernike4Basis = function(mesh, obstruction) {
      return obstruction == 0 ?
         this.zernike4BasisNoObstruction(mesh) :
         this.zernike4BasisObstruction(mesh, obstruction);
   };

   // Gives the Zernike basis for mesh and no obstruction.
   this.zernikeBasisNoObstruction = function(mesh) {
      var mx = mesh.x.matrix();
      var my = mesh.y.matrix();
      var rows = mx.rows;
      var cols = mx.cols;

      var newMatrix = new Matrix(rows * cols, this.zernikeBasisSize);
      var newRow = 0;
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var x = mx.at(row, col);
            var y = my.at(row, col);
            var r = Math.sqrt(x * x + y * y);
            var r2 = r * r;
            var a = x == 0 && y == 0 ? 0 : Math.atan2(-y, x);

            newMatrix.at(newRow, 0, 1);
            newMatrix.at(newRow, 1, 2 * Math.cos(a) * r);
            newMatrix.at(newRow, 2, 2 * Math.sin(a) * r);
            newMatrix.at(newRow, 3, Math.sqrt(3) * (2 * r2 - 1));
            newMatrix.at(newRow, 4, Math.sqrt(6) * Math.sin(2 * a) * r2);
            newMatrix.at(newRow, 5, Math.sqrt(6) * Math.cos(2 * a) * r2);
            newMatrix.at(newRow, 6,
               2 * Math.sqrt(2) * Math.sin(a) * (3 * r2 - 2) * r
            );
            newMatrix.at(newRow, 7,
               2 * Math.sqrt(2) * Math.cos(a) * (3 * r2 - 2) * r
            );
            newMatrix.at(newRow, 8,
               2 * Math.sqrt(2) * Math.sin(3 * a) * r2 * r
            );
            newMatrix.at(newRow, 9,
               2 * Math.sqrt(2) * Math.cos(3 * a) * r2 * r
            );
            newMatrix.at(newRow, 10, Math.sqrt(5) * ((6 * r2 - 6) * r2 + 1));

            newMatrix.at(newRow, 11,
               Math.sqrt(10) * Math.cos(2 * a) * (4 * r2 - 3) * r2
            );
            newMatrix.at(newRow, 12,
               Math.sqrt(10) * Math.sin(2 * a) * (4 * r2 - 3) * r2
            );
            newMatrix.at(newRow, 13,
               Math.sqrt(10) * Math.cos(4 * a) * r2 * r2
            );
            newMatrix.at(newRow, 14,
               Math.sqrt(10) * Math.sin(4 * a) * r2 * r2
            );
            newMatrix.at(newRow, 15,
               2 * Math.sqrt(3) * Math.cos(a) * ((10 * r2 - 12) * r2 + 3) * r
            );
            newMatrix.at(newRow, 16,
               2 * Math.sqrt(3) * Math.sin(a) * ((10 * r2 - 12) * r2 + 3) * r
            );
            newMatrix.at(newRow, 17,
               2 * Math.sqrt(3) * Math.cos(3 * a) * (5 * r2 - 4) * r2 * r
            );
            newMatrix.at(newRow, 18,
               2 * Math.sqrt(3) * Math.sin(3 * a) * (5 * r2 - 4) * r2 * r
            );
            newMatrix.at(newRow, 19,
               2 * Math.sqrt(3) * Math.cos(5 * a) * r2 * r2 * r
            );
            newMatrix.at(newRow, 20,
               2 * Math.sqrt(3) * Math.sin(5 * a) * r2 * r2 * r
            );
            newMatrix.at(newRow, 21,
               Math.sqrt(7) * (((20 * r2 - 30) * r2 + 12) * r2 - 1)
            );
         if (this.zernikeBasisSize > 22) {
            newMatrix.at(newRow, 22,
               Math.sqrt(14) * Math.sin(2 * a) * ((15 * r2 - 20) * r2 + 6) * r2
            );
            newMatrix.at(newRow, 23,
               Math.sqrt(14) * Math.cos(2 * a) * ((15 * r2 - 20) * r2 + 6) * r2
            );

            newMatrix.at(newRow, 24,
               4 * Math.sin(a) * (((35 * r2 - 60) * r2 + 30) * r2 - 4) * r
            );
            newMatrix.at(newRow, 25,
               4 * Math.cos(a) * (((35 * r2 - 60) * r2 + 30) * r2 - 4) * r
            );
            newMatrix.at(newRow, 26,
               3 * ((((70 * r2 - 140) * r2 + 90) * r2 - 20) * r2 + 1)
            );
         }
            ++newRow;
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives the Zernike basis for mesh and obstruction.
   this.zernikeBasisObstruction = function(mesh, obstruction) {
      var mx = mesh.x.matrix();
      var my = mesh.y.matrix();
      var rows = mx.rows;
      var cols = mx.cols;

      var e = obstruction;
      var e2 = e * e;

      var e2m1 = e2 - 1;
      var e2m1u2 = e2m1 * e2m1;
      var e2m1u3 = e2m1u2 * e2m1;
      var e2m1u4 = e2m1u3 * e2m1;
      var e2p1 = e2 + 1;

      var e4p1 = e2 * e2 + 1;
      var e4pe2p1 = (e2 + 1) * e2 + 1;
      var e4p3e2p1 = (e2 + 3) * e2 + 1;
      var e4p4e2p1 = (e2 + 4) * e2 + 1;
      var c3e4p8e2p3 = (3 * e2 + 8) * e2 + 3;

      var e6pe4pe2p1 = ((e2 + 1) * e2 + 1) * e2 + 1;
      var e6p4e4p4e2p1 = ((e2 + 4) * e2 + 4) * e2 + 1;
      var e6p5e4p5e2p1 = ((e2 + 5) * e2 + 5) * e2 + 1;
      var e6p6e4p6e2p1 = ((e2 + 6) * e2 + 6) * e2 + 1;
      var e6p9e4p9e2p1 = ((e2 + 9) * e2 + 9) * e2 + 1;

      var e8pe6pe4pe2p1 = (((e2 + 1) * e2 + 1) * e2 + 1) * e2 + 1;
      var e8p4e6p10e4p4e2p1 = (((e2 + 4) * e2 + 10) * e2 + 4) * e2 + 1;
      var e8p9e6p15e4p9e2p1 = (((e2 + 9) * e2 + 15) * e2 + 9) * e2 + 1;
      var e8p16e6p36e4p16e2p1 = (((e2 + 16) * e2 + 36) * e2 + 16) * e2 + 1;

      var e10pe8pe6pe4pe2p1 =
         ((((e2 + 1) * e2 + 1) * e2 + 1) * e2 + 1) * e2 + 1;
      var e10p4e8p10e6p10e4p4e2p1 =
         ((((e2 + 4) * e2 + 10) * e2 + 10) * e2 + 4) * e2 + 1;
      var e10p9e8p25e6p25e4p9e2p1 =
         ((((e2 + 9) * e2 + 25) * e2 + 25) * e2 + 9) * e2 + 1;

      var e12p4e10p10e8p20e6p10e4p4e2p1 =
         (((((e2 + 4) * e2 + 10) * e2 + 20) * e2 + 10) * e2 + 4) * e2 + 1;
      var e12p9e10p45e8p65e6p45e4p9e2p1 =
         (((((e2 + 9) * e2 + 45) * e2 + 65) * e2 + 45) * e2 + 9) * e2 + 1;

      var e16m16e10p30e8m16e6p1 =
         (((e2 * e2 * e2 - 16) * e2 + 30) * e2 - 16) * e2 * e2 * e2 + 1;

      var newMatrix = new Matrix(rows * cols, this.zernikeBasisSize);
      var newRow = 0;
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var x = mx.at(row, col);
            var y = my.at(row, col);
            var r = Math.sqrt(x * x + y * y);
            var r2 = r * r;
            var a = x == 0 && y == 0 ? 0 : Math.atan2(-y, x);

            newMatrix.at(newRow, 0, 1);
            newMatrix.at(newRow, 1, 2 * Math.cos(a) / Math.sqrt(e2p1) * r);
            newMatrix.at(newRow, 2, 2 * Math.sin(a) / Math.sqrt(e2p1) * r);
            newMatrix.at(newRow, 3, -Math.sqrt(3) / e2m1 * (2 * r2 - e2p1));
            newMatrix.at(newRow, 4,
               Math.sqrt(6) * Math.sin(2 * a) / Math.sqrt(e4pe2p1) * r2
            );
            newMatrix.at(newRow, 5,
               Math.sqrt(6) * Math.cos(2 * a) / Math.sqrt(e4pe2p1) * r2
            );
            newMatrix.at(newRow, 6,
               -2 * Math.sqrt(2) * Math.sin(a) /
               (e2m1 * Math.sqrt(e6p5e4p5e2p1)) *
               (3 * r2 * e2p1 - 2 * e4pe2p1) * r
            );
            newMatrix.at(newRow, 7,
               -2 * Math.sqrt(2) * Math.cos(a) /
               (e2m1 * Math.sqrt(e6p5e4p5e2p1)) *
               (3 * r2 * e2p1 - 2 * e4pe2p1) * r
            );
            newMatrix.at(newRow, 8,
               2 * Math.sqrt(2) * Math.sin(3 * a) / Math.sqrt(e6pe4pe2p1) *
               r2 * r
            );
            newMatrix.at(newRow, 9,
               2 * Math.sqrt(2) * Math.cos(3 * a) / Math.sqrt(e6pe4pe2p1) *
               r2 * r
            );
            newMatrix.at(newRow, 10,
               Math.sqrt(5) / e2m1u2 *
               ((6 * r2 - 6 * e2p1) * r2 + e4p4e2p1)
            );
            newMatrix.at(newRow, 11,
               -Math.sqrt(10) * Math.cos(2 * a) /
               (e2m1 *  Math.sqrt(e4pe2p1 * e8p4e6p10e4p4e2p1)) *
               (4 * e4pe2p1 * r2 - 3 * e6pe4pe2p1) * r2
            );
            newMatrix.at(newRow, 12,
               -Math.sqrt(10) * Math.sin(2 * a) /
               (e2m1 *  Math.sqrt(e4pe2p1 * e8p4e6p10e4p4e2p1)) *
               (4 * e4pe2p1 * r2 - 3 * e6pe4pe2p1) * r2
            );
            newMatrix.at(newRow, 13,
               Math.sqrt(10) * Math.cos(4 * a) / Math.sqrt(e8pe6pe4pe2p1) *
               r2 * r2
            );
            newMatrix.at(newRow, 14,
               Math.sqrt(10) * Math.sin(4 * a) / Math.sqrt(e8pe6pe4pe2p1) *
               r2 * r2
            );
            newMatrix.at(newRow, 15,
               2 * Math.sqrt(3) * Math.cos(a) /
               (e2m1u2 * Math.sqrt(e4p4e2p1 * e6p9e4p9e2p1)) *
               (
                  (10 * e4p4e2p1 * r2 - 12 * e6p4e4p4e2p1) * r2 +
                  3 * e8p4e6p10e4p4e2p1
               ) * r
            );
            newMatrix.at(newRow, 16,
               2 * Math.sqrt(3) * Math.sin(a) /
               (e2m1u2 * Math.sqrt(e4p4e2p1 * e6p9e4p9e2p1)) *
               (
                  (10 * e4p4e2p1 * r2 - 12 * e6p4e4p4e2p1) * r2 +
                  3 * e8p4e6p10e4p4e2p1
               ) * r
            );
            newMatrix.at(newRow, 17,
               -2 * Math.sqrt(3) * e2m1u3 * Math.sqrt(e6pe4pe2p1) *
               Math.cos(3 * a) /
               (
                  e2m1u4 * e2p1 * e4p1 *
                  Math.sqrt(e12p4e10p10e8p20e6p10e4p4e2p1)
               ) *
               (5 * r2 * e6pe4pe2p1 - 4 * e8pe6pe4pe2p1) * r2 * r
            );
            newMatrix.at(newRow, 18,
               -2 * Math.sqrt(3) * e2m1u3 * Math.sqrt(e6pe4pe2p1) *
               Math.sin(3 * a) /
               (
                  e2m1u4 * e2p1 * e4p1 *
                  Math.sqrt(e12p4e10p10e8p20e6p10e4p4e2p1)
               ) *
               (5 * r2 * e6pe4pe2p1 - 4 * e8pe6pe4pe2p1) * r2 * r
            );
            newMatrix.at(newRow, 19,
               2 * Math.sqrt(3) * Math.cos(5 * a) * r2 * r2 * r /
               Math.sqrt(e10pe8pe6pe4pe2p1)
            );
            newMatrix.at(newRow, 20,
               2 * Math.sqrt(3) * Math.sin(5 * a) * r2 * r2 * r /
               Math.sqrt(e10pe8pe6pe4pe2p1)
            );
            newMatrix.at(newRow, 21,
               -Math.sqrt(7) / e2m1u3 *
               (
                  ((20 * r2 - 30 * e2p1) * r2 + 12 * e4p3e2p1) * r2 -
                  e6p9e4p9e2p1
               )
            );
         if (this.zernikeBasisSize > 22) {
            newMatrix.at(newRow, 22,
               Math.sqrt(14) * Math.sin(2 * a) /
               Math.sqrt(
                  e12p9e10p45e8p65e6p45e4p9e2p1 * e16m16e10p30e8m16e6p1
               ) *
               (
                  (15 * e8p4e6p10e4p4e2p1 * r2 - 20 * e10p4e8p10e6p10e4p4e2p1) *
                  r2 +
                  6 * e12p4e10p10e8p20e6p10e4p4e2p1
               ) * r2
            );
            newMatrix.at(newRow, 23,
               Math.sqrt(14) * Math.cos(2 * a) /
               Math.sqrt(
                  e12p9e10p45e8p65e6p45e4p9e2p1 * e16m16e10p30e8m16e6p1
               ) *
               (
                  (15 * e8p4e6p10e4p4e2p1 * r2 - 20 * e10p4e8p10e6p10e4p4e2p1) *
                  r2 +
                  6 * e12p4e10p10e8p20e6p10e4p4e2p1
               ) * r2
            );
            newMatrix.at(newRow, 24,
               -4 * Math.sin(a) /
               (e2m1u3 * Math.sqrt(e6p9e4p9e2p1 * e8p16e6p36e4p16e2p1)) *
               (
                  ((35 * e6p9e4p9e2p1 * r2 - 60 * e8p9e6p15e4p9e2p1) * r2 +
                  30 * e10p9e8p25e6p25e4p9e2p1) * r2 -
                  4 * e12p9e10p45e8p65e6p45e4p9e2p1
               ) * r
            );
            newMatrix.at(newRow, 25,
               -4 * Math.cos(a) /
               (e2m1u3 * Math.sqrt(e6p9e4p9e2p1 * e8p16e6p36e4p16e2p1)) *
               (
                  ((35 * e6p9e4p9e2p1 * r2 - 60 * e8p9e6p15e4p9e2p1) * r2 +
                  30 * e10p9e8p25e6p25e4p9e2p1) * r2 -
                  4 * e12p9e10p45e8p65e6p45e4p9e2p1
               ) * r
            );
            newMatrix.at(newRow, 26,
               3 / e2m1u4 *
               (
                  (((70 * r2 - 140 * e2p1) * r2 + 30 * c3e4p8e2p3) * r2 -
                  20 * e6p6e4p6e2p1) * r2 + e8p16e6p36e4p16e2p1
               )
            );
         }
            ++newRow;
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives the Zernike basis for mesh and obstruction.
   this.zernikeBasis = function(mesh, obstruction) {
      return obstruction == 0 ?
         this.zernikeBasisNoObstruction(mesh) :
         this.zernikeBasisObstruction(mesh, obstruction);
   };

   // Gives coefficients and residual of a [z1, z4] least square error fit to
   // wavefront within mask for mesh and obstruction.
   this.zernike4Fit = function(mesh, mask, wavefront, obstruction) {
      var basis = this.zernike4Basis(mesh, obstruction);

      var wavefrontElements = wavefront.labeledElements(mask);
      var pseudoInverseThreshold = this.pseudoInverseThreshold;
      var coefficients = basis.clone().stagePipeline([
         function(frame) {return frame.labeledRows(mask);},
         function(frame) {return frame.pseudoInverse(pseudoInverseThreshold);},
         function(frame) {
            return new FrameReal(
               frame.matrix().mul(wavefrontElements.matrix())
            );
         }
      ]);
      wavefrontElements.clear();

      var residual = basis.stagePipeline([
         function(frame) {
            return new FrameReal(frame.matrix().mul(coefficients.matrix()));
         },
         function(frame) {
            return frame.reshape(wavefront.rows(), wavefront.cols());
         },
         function(frame) {return wavefront.difference(frame);}
      ]);

      return {
         coefficients: coefficients,
         residual: residual
      };
   };

   // Gives coefficients and residual of a least square error fit to
   // wavefront within mask for mesh and obstruction.
   this.zernikeFit = function(mesh, mask, wavefront, obstruction) {
      var basis = this.zernikeBasis(mesh, obstruction);

      var wavefrontElements = wavefront.labeledElements(mask);
      var pseudoInverseThreshold = this.pseudoInverseThreshold;
      var coefficients = basis.clone().stagePipeline([
         function(frame) {return frame.labeledRows(mask);},
         function(frame) {return frame.pseudoInverse(pseudoInverseThreshold);},
         function(frame) {
            return new FrameReal(
               frame.matrix().mul(wavefrontElements.matrix())
            );
         }
      ]);
      wavefrontElements.clear();

      var residual = basis.stagePipeline([
         function(frame) {
            return new FrameReal(frame.matrix().mul(coefficients.matrix()));
         },
         function(frame) {
            return frame.reshape(wavefront.rows(), wavefront.cols());
         },
         function(frame) {return wavefront.difference(frame);}
      ]);

      return {
         coefficients: coefficients,
         residual: residual
      };
   };
};

// ****************************************************************************
// EOF ZernikeAberrations.js - Released 2016/12/30 00:00:00 UTC
