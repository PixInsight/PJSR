// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// ZernikeAberrations.js - Released 2015/10/05 00:00:00 UTC
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

function ZernikeAberrations() {
   // Singular values smaller than this threshold will be dropped.
   this.pseudoInverseThreshold = 1e-10;

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
         "Residual aberration"
      );
   };

   // Gives the Zernike [z1, z4] basis for mesh and no obstruction.
   this.zernike4BasisNoObstruction = function(mesh) {
      var mx = mesh.x.matrix();
      var my = mesh.y.matrix();

      var newMatrix = new Matrix(mesh.x.rows() * mesh.x.cols(), 4);
      var newRow = 0;
      for (var row = 0; row != mesh.x.rows(); ++row) {
         for (var col = 0; col != mesh.x.cols(); ++col) {
            var x = mx.at(row, col);
            var y = my.at(row, col);
            var r = Math.sqrt(x * x + y * y);
            var a = x == 0 && y == 0 ? 0 : Math.atan2(-y, x);
            var r2 = r * r;

            newMatrix.at(newRow, 0, 1);
            newMatrix.at(newRow, 1, 2 * r * Math.cos(a));
            newMatrix.at(newRow, 2, 2 * r * Math.sin(a));
            newMatrix.at(newRow, 3, Math.sqrt(3) * (-1 + 2 * r2));
            ++newRow;
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives the Zernike [z1, z4] basis for mesh and obstruction.
   this.zernike4BasisObstruction = function(mesh, obstruction) {
      var mx = mesh.x.matrix();
      var my = mesh.y.matrix();

      var e = obstruction;
      var e2 = e * e;
      var e2p1 = e2 + 1;
      var e2m1 = e2 - 1;

      var newMatrix = new Matrix(mesh.x.rows() * mesh.x.cols(), 4);
      var newRow = 0;
      for (var row = 0; row != mesh.x.rows(); ++row) {
         for (var col = 0; col != mesh.x.cols(); ++col) {
            var x = mx.at(row, col);
            var y = my.at(row, col);
            var r = Math.sqrt(x * x + y * y);
            var a = x == 0 && y == 0 ? 0 : Math.atan2(-y, x);
            var r2 = r * r;

            newMatrix.at(newRow, 0, 1);
            newMatrix.at(newRow, 1, 2 * r * Math.cos(a) / Math.sqrt(e2p1));
            newMatrix.at(newRow, 2, 2 * r * Math.sin(a) / Math.sqrt(e2p1));
            newMatrix.at(newRow, 3, Math.sqrt(3) * (e2p1 - 2 * r2) / e2m1);
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

   // Gives the Zernike [z1, z22] basis for mesh and no obstruction.
   this.zernike22BasisNoObstruction = function(mesh) {
      var mx = mesh.x.matrix();
      var my = mesh.y.matrix();

      var newMatrix = new Matrix(mesh.x.rows() * mesh.x.cols(), 22);
      var newRow = 0;
      for (var row = 0; row != mesh.x.rows(); ++row) {
         for (var col = 0; col != mesh.x.cols(); ++col) {
            var x = mx.at(row, col);
            var y = my.at(row, col);
            var r = Math.sqrt(x * x + y * y);
            var a = x == 0 && y == 0 ? 0 : Math.atan2(-y, x);
            var r2 = r * r;
            var r3 = r2 * r;
            var r4 = r3 * r;
            var r5 = r4 * r;
            var r6 = r5 * r;

            newMatrix.at(newRow, 0, 1);
            newMatrix.at(newRow, 1, 2 * r * Math.cos(a));
            newMatrix.at(newRow, 2, 2 * r * Math.sin(a));
            newMatrix.at(newRow, 3, Math.sqrt(3) * (-1 + 2 * r2));
            newMatrix.at(newRow, 4, Math.sqrt(6) * r2 * Math.sin(2 * a));
            newMatrix.at(newRow, 5, Math.sqrt(6) * r2 * Math.cos(2 * a));
            newMatrix.at(newRow, 6,
               2 * Math.sqrt(2) * r * (-2 + 3 * r2) * Math.sin(a
            ));
            newMatrix.at(newRow, 7,
               2 * Math.sqrt(2) * r * (-2 + 3 * r2) * Math.cos(a)
            );
            newMatrix.at(newRow, 8, 2 * Math.sqrt(2) * r3 * Math.sin(3 * a));
            newMatrix.at(newRow, 9, 2 * Math.sqrt(2) * r3 * Math.cos(3 * a));
            newMatrix.at(newRow, 10, Math.sqrt(5) * (1 - 6 * r2 + 6 * r4));
            newMatrix.at(newRow, 11,
               Math.sqrt(10) * r2 * (-3 + 4 * r2) * Math.cos(2 * a)
            );
            newMatrix.at(newRow, 12,
               Math.sqrt(10) * r2 * (-3 + 4 * r2) * Math.sin(2 * a)
            );
            newMatrix.at(newRow, 13, Math.sqrt(10) * r4 * Math.cos(4 * a));
            newMatrix.at(newRow, 14, Math.sqrt(10) * r4 * Math.sin(4 * a));
            newMatrix.at(newRow, 15,
               2 * Math.sqrt(3) * r * (3 - 12 * r2 + 10 * r4) * Math.cos(a)
            );
            newMatrix.at(newRow, 16,
               2 * Math.sqrt(3) * r * (3 - 12 * r2 + 10 * r4) * Math.sin(a)
            );
            newMatrix.at(newRow, 17,
               2 * Math.sqrt(3) * r3 * (-4 + 5 * r2) * Math.cos(3 * a)
            );
            newMatrix.at(newRow, 18,
               2 * Math.sqrt(3) * r3 * (-4 + 5 * r2) * Math.sin(3 * a)
            );
            newMatrix.at(newRow, 19, 2 * Math.sqrt(3) * r5 * Math.cos(5 * a));
            newMatrix.at(newRow, 20, 2 * Math.sqrt(3) * r5 * Math.sin(5 * a));
            newMatrix.at(newRow, 21,
               Math.sqrt(7) * (-1 + 12 * r2 - 30 * r4 + 20 * r6)
            );
            ++newRow;
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives the Zernike [z1, z22] basis for mesh and obstruction.
   this.zernike22BasisObstruction = function(mesh, obstruction) {
      var mx = mesh.x.matrix();
      var my = mesh.y.matrix();

      var e = obstruction;
      var e2 = e * e;
      var e4 = e2 * e2;
      var e6 = e4 * e2;
      var e8 = e6 * e2;
      var e10 = e8 * e2;
      var e12 = e10 * e2;
      var e14 = e12 * e2;
      var e16 = e14 * e2;
      var e2p1 = e2 + 1;
      var e2m1 = e2 - 1;
      var e2m1u3 = e2m1 * e2m1 * e2m1;
      var e2m1u4 = e2m1u3 * e2m1;
      var e2m1u6 = e2m1u4 * e2m1 * e2m1;
      var e4p1 = e4 + 1;
      var e4pe2p1 = e4 + e2p1;
      var e6p5e4p5e2p1 = e6 + 5 * e4 + 5 * e2 + 1;
      var e6pe4pe2p1 = e6 + e4pe2p1;
      var e4p4e2p1 = e4 + 4 * e2 + 1;
      var e8p4e6p10e4p4e2p1 = e8 + 4 * e6 + 10 * e4 + 4 * e2 + 1;
      var e8pe6pe4pe2p1 = e8 + e6 + e4 + e2 + 1;
      var e6p4e4p4e2p1 = e6 + 4 * e4 + 4 * e2 + 1;
      var e6p9e4p9e2p1 = e6 + 9 * e4 + 9 * e2 + 1;
      var e12p4e10p10e8p20e6p10e4p4e2p1 =
         e12 + 4 * e10 + 10 * e8 + 20 * e6 + 10 * e4 + 4 * e2 + 1;
      var e10pe8pe6pe4pe2p1 = e10 + e8 + e6 + e4 + e2 + 1;
      var e4p3e2p1 = e4 + 3 * e2 + 1;

      var newMatrix = new Matrix(mesh.x.rows() * mesh.x.cols(), 22);
      var newRow = 0;
      for (var row = 0; row != mesh.x.rows(); ++row) {
         for (var col = 0; col != mesh.x.cols(); ++col) {
            var x = mx.at(row, col);
            var y = my.at(row, col);
            var r = Math.sqrt(x * x + y * y);
            var a = x == 0 && y == 0 ? 0 : Math.atan2(-y, x);
            var r2 = r * r;
            var r3 = r2 * r;
            var r4 = r3 * r;
            var r5 = r4 * r;
            var r6 = r5 * r;

            newMatrix.at(newRow, 0, 1);
            newMatrix.at(newRow, 1, 2 * r * Math.cos(a) / Math.sqrt(e2p1));
            newMatrix.at(newRow, 2, 2 * r * Math.sin(a) / Math.sqrt(e2p1));
            newMatrix.at(newRow, 3, Math.sqrt(3) * (e2p1 - 2 * r2) / e2m1);
            newMatrix.at(newRow, 4,
               Math.sqrt(6) * r2 * Math.sin(2 * a) / Math.sqrt(e4pe2p1)
            );
            newMatrix.at(newRow, 5,
               Math.sqrt(6) * r2 * Math.cos(2 * a) / Math.sqrt(e4pe2p1)
            );
            newMatrix.at(newRow, 6, 2 * Math.sqrt(2) * r * (
               2 * e4pe2p1 - 3 * r2 * e2p1
            ) * Math.sin(a) / (e2m1 * Math.sqrt(e6p5e4p5e2p1))
            );
            newMatrix.at(newRow, 7, 2 * Math.sqrt(2) * r * (
               2 * e4pe2p1 - 3 * r2 * e2p1
            ) * Math.cos(a) / (e2m1 * Math.sqrt(e6p5e4p5e2p1))
            );
            newMatrix.at(newRow, 8,
               2 * Math.sqrt(2) * r3 * Math.sin(3 * a) / Math.sqrt(e6pe4pe2p1)
            );
            newMatrix.at(newRow, 9,
               2 * Math.sqrt(2) * r3 * Math.cos(3 * a) / Math.sqrt(e6pe4pe2p1)
            );
            newMatrix.at(newRow, 10,
               Math.sqrt(5) * (e4p4e2p1 - 6 * r2 * e2p1 + 6 * r4) /
               (e2m1 * e2m1)
            );
            newMatrix.at(newRow, 11, Math.sqrt(10) * r2 * (
               3 * e6pe4pe2p1 - 4 * r2 * e4pe2p1
            ) * Math.cos(2 * a) /
               (e2m1 *  Math.sqrt(e4pe2p1 * e8p4e6p10e4p4e2p1))
            );
            newMatrix.at(newRow, 12, Math.sqrt(10) * r2 * (
               3 * e6pe4pe2p1 - 4 * r2 * e4pe2p1
            ) * Math.sin(2 * a) /
               (e2m1 *  Math.sqrt(e4pe2p1 * e8p4e6p10e4p4e2p1))
            );
            newMatrix.at(newRow, 13,
               Math.sqrt(10) * r4 * Math.cos(4 * a) / Math.sqrt(e8pe6pe4pe2p1)
            );
            newMatrix.at(newRow, 14,
               Math.sqrt(10) * r4 * Math.sin(4 * a) / Math.sqrt(e8pe6pe4pe2p1)
            );
            newMatrix.at(newRow, 15, 2 * Math.sqrt(3) * r * (
               3 * e8p4e6p10e4p4e2p1 - 12 * r2 * e6p4e4p4e2p1 +
               10 * r4 * e4p4e2p1
            ) * Math.cos(a) /
               (e2m1 * e2m1 * Math.sqrt(e4p4e2p1 * e6p9e4p9e2p1))
            );
            newMatrix.at(newRow, 16, 2 * Math.sqrt(3) * r * (
               3 * e8p4e6p10e4p4e2p1 - 12 * r2 * e6p4e4p4e2p1 +
               10 * r4 * e4p4e2p1
            ) * Math.sin(a) /
               (e2m1 * e2m1 * Math.sqrt(e4p4e2p1 * e6p9e4p9e2p1))
            );
            newMatrix.at(newRow, 17, 2 * Math.sqrt(3) * r3 * (
               -4 * e8pe6pe4pe2p1 + 5 * r2 * e6pe4pe2p1
            ) * Math.sqrt(e2m1u6 * e6pe4pe2p1) * Math.cos(3 * a) /
            (e2m1u4 * e2p1 * e4p1 * Math.sqrt(e12p4e10p10e8p20e6p10e4p4e2p1))
            );
            newMatrix.at(newRow, 18, 2 * Math.sqrt(3) * r3 * (
               -4 * e8pe6pe4pe2p1 + 5 * r2 * e6pe4pe2p1
            ) * Math.sqrt(e2m1u6 * e6pe4pe2p1) * Math.sin(3 * a) /
            (e2m1u4 * e2p1 * e4p1 * Math.sqrt(e12p4e10p10e8p20e6p10e4p4e2p1))
            );
            newMatrix.at(newRow, 19, 2 * Math.sqrt(3) * r5 * Math.cos(5 * a) /
               Math.sqrt(e10pe8pe6pe4pe2p1)
            );
            newMatrix.at(newRow, 20, 2 * Math.sqrt(3) * r5 * Math.sin(5 * a) /
               Math.sqrt(e10pe8pe6pe4pe2p1)
            );
            newMatrix.at(newRow, 21, Math.sqrt(7) * (
               e6p9e4p9e2p1 - 12 * r2 * e4p3e2p1 + 30 * r4 * e2p1 - 20 * r6
            ) / e2m1u3
            );
            ++newRow;
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives the Zernike [z1, z22] basis for mesh and obstruction.
   this.zernike22Basis = function(mesh, obstruction) {
      return obstruction == 0 ?
         this.zernike22BasisNoObstruction(mesh) :
         this.zernike22BasisObstruction(mesh, obstruction);
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

   // Gives coefficients and residual of a [z1, z22] least square error fit to
   // wavefront within mask for mesh and obstruction.
   this.zernike22Fit = function(mesh, mask, wavefront, obstruction) {
      var basis = this.zernike22Basis(mesh, obstruction);

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
// EOF ZernikeAberrations.js - Released 2015/10/05 00:00:00 UTC
