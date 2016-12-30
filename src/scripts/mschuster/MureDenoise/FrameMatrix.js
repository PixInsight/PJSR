// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// FrameMatrix.js - Released 2016/12/31 00:00:00 UTC
// ****************************************************************************
//
// This file is part of MureDenoise Script Version 1.19
//
// Copyright (C) 2012-2016 Mike Schuster. All Rights Reserved.
// Copyright (C) 2003-2016 Pleiades Astrophoto S.L. All Rights Reserved.
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

// Counts FrameMatrix objects neither cleared nor released.
var globalFrameMatrixCount = 0;

// Provides a frame of real values using a matrix representation.
function FrameMatrix(matrix) {
   ++globalFrameMatrixCount;

   // Clears matrix.
   this.clear = function() {
      --globalFrameMatrixCount;
      matrix.assign(0, 0, 0);
   };

   // Gives matrix.
   this.matrix = function() {
      return matrix;
   };

   // Gives a matrix clone.
   this.cloneMatrix = function() {
#iflt __PI_BUILD__ 1168
      var z = new Matrix(0, matrix.rows, matrix.cols);
      var r = z.add(matrix);
      z.assign(0, 0, 0);
      return r;
#else
      return new Matrix(matrix);
#endif
   };

   // Gives a clone frame.
   this.clone = function() {
      return new FrameMatrix(this.cloneMatrix());
   };

   // Gives an image window with view id.
   this.toImageWindow = function(viewId) {
      var imageWindow = new ImageWindow(
         matrix.cols,
         matrix.rows,
         1,
         32,
         true,
         false,
         uniqueViewId(filterViewId(viewId))
      );

      var imageFrame = this.truncate(0, 1);
      var image = imageFrame.matrix().toImage();

      imageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);
      imageWindow.mainView.image.assign(image);
      imageWindow.mainView.endProcess();

      image.free();
      imageFrame.clear();

      return imageWindow;
   };

   // Gives the pipeline result frame.
   this.pipeline = function(stages) {
      var a = this;
      for (var i = 0; i != stages.length; ++i) {
         if (stages[i] != null) {
            try {
               var b = stages[i](a);
            }
            finally {
               a.clear();
            }
            a = b;
         }
      }

      return a;
   };

   // Gives true if isFinite frame.
   this.isFinite = function() {
      var a = matrix;
      var rows = a.rows;
      var cols = a.cols;

      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            if (!isFinite(a.at(row, col))) {
               return false;
            }
         }
      }

      return true;
   }

   // Gives a reshaped frame.
   this.reshape = function(rows, cols) {
      var a = matrix;
      var acols = a.cols;

      var r = new Matrix(rows, cols);
      var arow = 0;
      var acol = 0;
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            r.at(row, col, a.at(arow, acol));
            ++acol;
            if (acol == acols) {
               ++arow;
               acol = 0;
            }
         }
      }

      return new FrameMatrix(r);
   };

   // Gives a truncated frame.
   this.truncate = function(low, high) {
      var r = this.cloneMatrix();
      r.truncate(low, high);
      return new FrameMatrix(r);
   };

   // Gives a transposed frame.
   this.transpose = function() {
      return new FrameMatrix(matrix.transpose());
   };

   // Gives a frame add scalar result.
   this.addScalar = function(scalar) {
      var r = this.cloneMatrix();
      r.add(scalar);
      return new FrameMatrix(r);
   };

   // Gives a frame multiply scalar result.
   this.multiplyScalar = function(scalar) {
      var r = this.cloneMatrix();
      r.mul(scalar);
      return new FrameMatrix(r);
   };

   // Gives a frame fused multiply add scalar result.
   this.fusedMultiplyAddScalar = function(multiplyScalar, addScalar) {
      var r = this.cloneMatrix();
      r.mul(multiplyScalar);
      r.add(addScalar);
      return new FrameMatrix(r);
   };

   // Gives a frame fused add multiply scalar result.
   this.fusedAddMultiplyScalar = function(addScalar, multiplyScalar) {
      var r = this.cloneMatrix();
      r.add(addScalar);
      r.mul(multiplyScalar);
      return new FrameMatrix(r);
   };

   // Gives a frame add frame result.
   this.addFrame = function(frame) {
      return new FrameMatrix(matrix.add(frame.matrix()));
   };

   // Gives a frame subtract frame result.
   this.subtractFrame = function(frame) {
      return new FrameMatrix(matrix.sub(frame.matrix()));
   };

   // Gives a multiply frame.
   this.multiplyFrame = function(frame) {
#ifgteq __PI_BUILD__ 1189
      var r = this.cloneMatrix();
      r.mulElementWise(frame.matrix());
      return new FrameMatrix(r);
#else
      var a = matrix;
      var rows = a.rows;
      var cols = a.cols;
      var b = frame.matrix();

      var r = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            r.at(row, col, a.at(row, col) * b.at(row, col));
         }
      }

      return new FrameMatrix(r);
#endif
   };

   // Gives a divide frame.
   this.divideFrame = function(frame) {
#ifgteq __PI_BUILD__ 1189
      var r = this.cloneMatrix();
      r.divElementWise(frame.matrix());
      return new FrameMatrix(r);
#else
      var a = matrix;
      var rows = a.rows;
      var cols = a.cols;
      var b = frame.matrix();

      var r = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            r.at(row, col, a.at(row, col) / b.at(row, col));
         }
      }

      return new FrameMatrix(r);
#endif
   };

   // Gives a product frame.
   this.productFrame = function(frame) {
      return new FrameMatrix(matrix.mul(frame.matrix()));
   };

   // Gives a row filtered frame, array kernel must have odd length.
   this.filterRows = function(kernel) {
      var a = matrix;
      var rows = a.rows;
      var cols = a.cols;
      var coes = kernel.length;
      var coes2 = Math.floor(coes / 2);
      function low(col) {
         return 0 <= col ? col : cols + col;
      }
      function high(col) {
         return col < cols ? col : col - cols;
      }

      var r = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != coes2; ++col) {
            var sum = 0;
            for (var coe = 0; coe != coes; ++coe) {
               sum += kernel[coes - 1 - coe] *
                  a.at(row, low(col + (coe - coes2)));
            }
            r.at(row, col, sum);
         }
         for (var col = coes2; col != cols - coes2; ++col) {
            var sum = 0;
            for (var coe = 0; coe != coes; ++coe) {
               sum += kernel[coes - 1 - coe] *
                  a.at(row, col + (coe - coes2));
            }
            r.at(row, col, sum);
         }
         for (var col = cols - coes2; col != cols; ++col) {
            var sum = 0;
            for (var coe = 0; coe != coes; ++coe) {
               sum += kernel[coes - 1 - coe] *
                  a.at(row, high(col + (coe - coes2)));
            }
            r.at(row, col, sum);
         }
      }

      return new FrameMatrix(r);
   };

   // Gives a column filtered frame, kernel must have odd length.
   this.filterColumns = function(kernel) {
      return this.transpose().pipeline([
         function(frame) {
            return frame.filterRows(kernel);
         },
         function(frame) {
            return frame.transpose();
         }
      ]);
   };

   // Gives a row and column filtered frame, kernel must have odd length.
   this.filterRowsColumns = function(kernel) {
      return this.filterRows(kernel).pipeline([
         function(frame) {
            return frame.filterColumns(kernel);
         }
      ]);
   };

   // Gives a fused reflection padded and periodic shifted frame.
   this.fusedPadShift = function(pad, shiftRows, shiftCols) {
      assert(
         pad > 0 &&
         Math.max(Math.abs(shiftRows), Math.abs(shiftCols)) <= pad,
         "fusedPadShift"
      );
      var a = matrix;
      var rows = a.rows;
      var cols = a.cols;
      var rows1p = rows + pad;
      var cols1p = cols + pad;
      var rows2p = rows1p + pad;
      var cols2p = cols1p + pad;

      var index = new Array(rows2p);
      for (var row = 0; row != pad; ++row) {
         index[row] = pad - row;
      }
      for (var row = pad; row != rows1p; ++row) {
         index[row] = row - pad;
      }
      for (var row = rows1p; row != rows2p; ++row) {
         index[row] = 2 * (rows - 1) - (row - pad);
      }
      var rowIndex = new Array(rows2p);
      if (0 <= shiftRows) {
         for (var row = 0; row != shiftRows; ++row) {
            rowIndex[row] = index[row + (rows2p - shiftRows)];
         }
         for (var row = shiftRows; row != rows2p; ++row) {
            rowIndex[row] = index[row - shiftRows];
         }
      }
      else {
         for (var row = 0; row != rows2p + shiftRows; ++row) {
            rowIndex[row] = index[row - shiftRows];
         }
         for (var row = rows2p + shiftRows; row != rows2p; ++row) {
            rowIndex[row] = index[row - (rows2p + shiftRows)];
         }
      }

      var index = new Array(rows2p);
      for (var col = 0; col != pad; ++col) {
         index[col] = pad - col;
      }
      for (var col = pad; col != cols1p; ++col) {
         index[col] = col - pad;
      }
      for (var col = cols1p; col != cols2p; ++col) {
         index[col] = 2 * (cols - 1) - (col - pad);
      }
      var colIndex = new Array(cols2p);
      if (0 <= shiftCols) {
         for (var col = 0; col != shiftCols; ++col) {
            colIndex[col] = index[col + (cols2p - shiftCols)];
         }
         for (var col = shiftCols; col != cols2p; ++col) {
            colIndex[col] = index[col - shiftCols];
         }
      }
      else {
         for (var col = 0; col != cols2p + shiftCols; ++col) {
            colIndex[col] = index[col - shiftCols];
         }
         for (var col = cols2p + shiftCols; col != cols2p; ++col) {
            colIndex[col] = index[col - (cols2p + shiftCols)];
         }
      }

      var r = new Matrix(rows2p, cols2p);
      for (var row = 0; row != rows2p; ++row) {
         for (var col = 0; col != cols2p; ++col) {
            r.at(row, col, a.at(rowIndex[row], colIndex[col]));
         }
      }

      return new FrameMatrix(r);
   };

   // Gives a fused periodic shifted and reflection padded frame.
   this.fusedShiftPad = function(shiftRows, shiftCols, pad) {
      assert(
         pad < 0 &&
         Math.max(Math.abs(shiftRows), Math.abs(shiftCols)) <= -pad,
         "fusedShiftPad"
      );
      var a = matrix;
      var rows = a.rows;
      var cols = a.cols;
      var rows2p = rows + 2 * pad;
      var cols2p = cols + 2 * pad;

      var r = new Matrix(rows2p, cols2p);
      for (var row = 0; row != rows2p; ++row) {
         for (var col = 0; col != cols2p; ++col) {
            r.at(row, col, a.at(row - pad - shiftRows, col - pad - shiftCols));
         }
      }

      return new FrameMatrix(r);
   };

   // Gives the frame low and high quantiles.
   this.histogramQuantiles = function(resolution, low, high) {
      var a = matrix;
      var rows = a.rows;
      var cols = a.cols;

      var minElement = a.minElement();
      var maxElement = a.maxElement();
      if ((maxElement - minElement) < 1e-6) {
         return [minElement, maxElement];
      }

      var norm = this.fusedAddMultiplyScalar(
         -minElement, 1 / (maxElement - minElement)
      );
      var b = norm.matrix();

      var histogram = new Vector(0, resolution);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var bin = Math.round(
               (resolution - 1) * Math.max(0, Math.min(1, b.at(row, col)))
            );
            histogram.at(bin, histogram.at(bin) + 1);
         }
      }

      var sum = 0;
      for (var bin = 0; bin != resolution && sum <= low * rows * cols; ++bin) {
         sum += histogram.at(bin);
      }
      low = Math.max(0, (bin - 1) / (resolution - 1));

      var sum = 0;
      for (var bin = 0; bin != resolution && sum < high * rows * cols; ++bin) {
         sum += histogram.at(bin);
      }
      high = Math.min(1, bin / (resolution - 1));

      histogram.assign(0, 0);
      norm.clear();

      return [
         (maxElement - minElement) * low + minElement,
         (maxElement - minElement) * high + minElement
      ];
   };

   // Gives the row unnormalized Haar wavelet decomposition.
   this.unnormalizedHaarDecomposeRows = function() {
      var a = matrix;
      var rows = a.rows;
      var cols = a.cols;
      var cols2f = Math.floor(cols / 2);
      var cols2c = Math.ceil(cols / 2);
      var cole = 0;

      var c = new Matrix(rows, cols2c);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols2f; ++col) {
            var col2 = 2 * col;
            c.at(row, col, a.at(row, col2) + a.at(row, col2 + 1));
         }
         if (cols2f != cols2c) {
            c.at(row, cols2f, a.at(row, 2 * cols2f) + a.at(row, cole));
         }
      }

      var d = new Matrix(rows, cols2c);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols2f; ++col) {
            var col2 = 2 * col;
            d.at(row, col, a.at(row, col2) - a.at(row, col2 + 1));
         }
         if (cols2f != cols2c) {
            d.at(row, cols2f, a.at(row, 2 * cols2f) - a.at(row, cole));
         }
      }

      return [
         new FrameMatrix(new Matrix([rows, cols], 1, 2)),
         new FrameMatrix(c),
         new FrameMatrix(d)
      ];
   };

   // Gives the row unnormalized Haar wavelet reconstruction.
   this.unnormalizedHaarReconstructRows = function(decompose) {
      var s = decompose[0].matrix();
      var c = decompose[1].matrix();
      var d = decompose[2].matrix();
      var rows = s.at(0, 0);
      var cols = s.at(0, 1);
      var cols2f = Math.floor(cols / 2);
      var cols2c = Math.ceil(cols / 2);

      var r = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols2f; ++col) {
            var col2 = 2 * col;
            r.at(row, col2, 0.5 * (c.at(row, col) + d.at(row, col)));
            r.at(row, col2 + 1, 0.5 * (c.at(row, col) - d.at(row, col)));
         }
         if (cols2f != cols2c) {
            r.at(
               row, 2 * cols2f, 0.5 * (c.at(row, cols2f) + d.at(row, cols2f))
            );
         }
      }

      return new FrameMatrix(r);
   };

   // Gives the unnormalized haar wavelet decomposition.
   this.unnormalizedHaarDecompose = function() {
      var decompose = this.unnormalizedHaarDecomposeRows();
      decompose[0].clear();
      var c1 = decompose[1];
      var d1 = decompose[2];

      var c1t = c1.transpose();
      c1.clear();
      var decompose = c1t.unnormalizedHaarDecomposeRows();
      c1t.clear();
      decompose[0].clear();
      var c2t = decompose[1];
      var v2t = decompose[2];
      var c2 = c2t.transpose();
      c2t.clear();
      var v2 = v2t.transpose();
      v2t.clear();

      var d1t = d1.transpose();
      d1.clear();
      var decompose = d1t.unnormalizedHaarDecomposeRows();
      d1t.clear();
      decompose[0].clear();
      var h2t = decompose[1];
      var d2t = decompose[2];
      var h2 = h2t.transpose();
      h2t.clear();
      var d2 = d2t.transpose();
      d2t.clear();

      return [
         new FrameMatrix(new Matrix([matrix.rows, matrix.cols], 1, 2)),
         c2,
         v2,
         h2,
         d2
      ];
   };

   // Gives the unnormalized Haar wavelet reconstruction.
   this.unnormalizedHaarReconstruct = function(decompose) {
      var s = decompose[0];
      var c2 = decompose[1];
      var v2 = decompose[2];
      var h2 = decompose[3];
      var d2 = decompose[4];
      var rows = s.matrix().at(0, 0);
      var cols = s.matrix().at(0, 1);
      var cols2c = Math.ceil(cols / 2);

      var h2t = h2.transpose();
      var d2t = d2.transpose();
      var s = new FrameMatrix(new Matrix([cols2c, rows], 1, 2));
      var d1t = s.unnormalizedHaarReconstructRows([s, h2t, d2t]);
      s.clear();
      h2t.clear();
      d2t.clear();

      var c2t = c2.transpose();
      var v2t = v2.transpose();
      var s = new FrameMatrix(new Matrix([cols2c, rows], 1, 2));
      var c1t = s.unnormalizedHaarReconstructRows([s, c2t, v2t]);
      s.clear();
      c2t.clear();
      v2t.clear();

      var c1 = c1t.transpose();
      c1t.clear();
      var d1 = d1t.transpose();
      d1t.clear();
      var s = new FrameMatrix(new Matrix([rows, cols], 1, 2));
      var r = s.unnormalizedHaarReconstructRows([s, c1, d1]);
      s.clear();
      c1.clear();
      d1.clear();

      return r;
   };

   // Gives the pseudo inverse frame, singular values smaller than the product
   // of thresholdScale and a default based on expected roundoff error will be
   // dropped.
   this.pseudoInverse = function(thresholdScale) {
      var svdt = NR3SVD(matrix);
      var u = svdt[0];
      var w = svdt[1];
      var v = svdt[2];
      var tsd = svdt[3];
      var threshold = thresholdScale * tsd;

      var iw = new Matrix(w.length, w.length);
      for (var row = 0; row != w.length; ++row) {
         for (var col = 0; col != w.length; ++col) {
            iw.at(
               row,
               col,
               row == col ?
                  Math.abs(w.at(row)) < threshold ? 0 : 1 / w.at(row) :
                  0
            );
         }
      }

      var ut = u.transpose();
      var viw = v.mul(iw);
      var r = viw.mul(ut);

      iw.assign(0, 0, 0);
      ut.assign(0, 0, 0);
      viw.assign(0, 0, 0);

      u.assign(0, 0, 0);
      w.assign(0, 0);
      v.assign(0, 0, 0);

      return new FrameMatrix(r);
   };
}

// ****************************************************************************
// EOF FrameMatrix.js - Released 2016/12/31 00:00:00 UTC
