// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// FrameMatrix.js - Released 2016/12/30 00:00:00 UTC
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

// Counts FrameReal objects neither cleared nor released.
var globalFrameRealCount = 0;

// Provides a frame of real values using a matrix representation.
function FrameReal(matrix) {
   ++globalFrameRealCount;

   // Releases the matrix.
   this.release = function() {
      --globalFrameRealCount;
   };

   // Clears the matrix.
   this.clear = function() {
      --globalFrameRealCount;
      matrix.assign(0, 0, 0);
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

   // Gives a clone.
   this.clone = function() {
      return new FrameReal(this.cloneMatrix());
   };

   // Gives the result of a stage pipeline.
   this.stagePipeline = function(stages) {
      var a = this;
      for (var i = 0; i != stages.length; ++i) {
         var b = stages[i](a);
         a.clear();
         a = b;
      }

      return a;
   };

   // Gives an ImageWindow with identifier id.
   this.toImageWindow = function(id) {
      var imageWindow = new ImageWindow(
         matrix.cols, matrix.rows, 1, 32, true, false, uniqueViewId(id)
      );
      imageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);
      var imageFrame = this.truncate(0, 1);
      var image = imageFrame.matrix().toImage();
      imageWindow.mainView.image.assign(image);
      image.free();
      imageFrame.clear();
      imageWindow.mainView.endProcess();

      return imageWindow;
   }

   // Gives an RGB ImageWindow with identifier id.
   this.toImageWindowRGB = function(id, r, g, b) {
      var imageWindow = new ImageWindow(
         matrix.cols, matrix.rows, 3, 32, true, true, uniqueViewId(id)
      );
      imageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);
      var imageFrame = r.truncate(0, 1);
      var image = imageFrame.matrix().toImage();
      imageWindow.mainView.image.apply(image, 1, new Point(0, 0), 0);
      image.free();
      imageFrame.clear();
      var imageFrame = g.truncate(0, 1);
      var image = imageFrame.matrix().toImage();
      imageWindow.mainView.image.apply(image, 1, new Point(0, 0), 1);
      image.free();
      imageFrame.clear();
      var imageFrame = b.truncate(0, 1);
      var image = imageFrame.matrix().toImage();
      imageWindow.mainView.image.apply(image, 1, new Point(0, 0), 2);
      image.free();
      imageFrame.clear();
      imageWindow.mainView.endProcess();

      return imageWindow;
   }

   // Gives an 8 bit ImageWindow with identifier id.
   this.toImageWindow8Bit = function(id) {
      var imageWindow = new ImageWindow(
         matrix.cols, matrix.rows, 1, 8, false, false, uniqueViewId(id)
      );
      imageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);
      var imageFrame = this.truncate(0, 1);
      var image = imageFrame.matrix().toImage();
      imageWindow.mainView.image.assign(image);
      image.free();
      imageFrame.clear();
      imageWindow.mainView.endProcess();

      return imageWindow;
   }

   // Gives rows.
   this.rows = function() {
      return matrix.rows;
   };

   // Gives cols.
   this.cols = function() {
      return matrix.cols;
   };

   // Gives matrix.
   this.matrix = function() {
      return matrix;
   };

   // Gives the numerically minimum element of matrix.
   this.min = function() {
      return matrix.minElement();
   };

   // Gives the numerically minimum element of matrix.
   this.max = function() {
      return matrix.maxElement();
   };

   // Gives the statistical mean of matrix elements.
   this.mean = function() {
      return matrix.mean();
   };

   // Gives the statistical standard deviation of matrix elements.
   this.stdDev = function() {
      return matrix.stdDev();
   };

   // Gives the statistical root mean square of matrix elements.
   this.rms = function() {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var sum = 0;
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            sum += square(matrix.at(row, col));
         }
      }

      return Math.sqrt(sum / matrix.numberOfElements);
   };

   // Gives the statistical median of matrix elements.
   this.median = function() {
      // Workaround for PJSR Math.median(Array)/Matrix.median() bug in
      // Win 7 1123.
      // Use workaround on small problems only to mitigate loss of performance.
      if (matrix.numberOfElements < 1024 * 1024) {
         return medianArraySideEffect(matrix.toArray());
      }
      else {
         return matrix.median();
      }
   };

   // Gives the normalized Rousseeuw and Croux Sn scale estimate of matrix
   // elements.
   this.Sn = function() {
      // matrix.Sn() is broken, use PJSR implementation.
      return 1.1926 * SnArraySideEffect(matrix.toArray());
   };

   // Gives a truncated frame.
   this.truncate = function(low, high) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var element = matrix.at(row, col);
            newMatrix.at(
               row, col, element < low ? low : element > high ? high : element
            );
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives a normalized frame.
   this.normalize = function(low, high) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(
               row,
               col,
               low != high ? (matrix.at(row, col) - low) / (high - low) : 0
            );
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives the [min, max] normalized frame.
   this.minMaxNormalize = function() {
      return this.normalize(this.min(), this.max());
   };

   // Gives a column frame containing non-zero labeled elements.
   this.labeledElements = function(labeling) {
      var labelingMatrix = labeling.matrix();
      var labelingRows = labelingMatrix.rows;
      var labelingCols = labelingMatrix.cols;
      var newRows = 0;
      for (var row = 0; row != labelingRows; ++row) {
         for (var col = 0; col != labelingCols; ++col) {
            newRows += labelingMatrix.at(row, col) != 0 ? 1 : 0;
         }
      }

      var newMatrix = new Matrix(newRows, 1);
      var newRow = 0;
      for (var row = 0; row != labelingRows; ++row) {
         for (var col = 0; col != labelingCols; ++col) {
            if (labelingMatrix.at(row, col) != 0) {
               newMatrix.at(newRow, 0, matrix.at(row, col));
               ++newRow;
            }
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives a matrix frame containing non-zero labeled rows.
   this.labeledRows = function(labeling) {
      var labelingMatrix = labeling.matrix();
      var labelingRows = labelingMatrix.rows;
      var labelingCols = labelingMatrix.cols;
      var newRows = 0;
      for (var row = 0; row != labelingRows; ++row) {
         for (var col = 0; col != labelingCols; ++col) {
            newRows += labelingMatrix.at(row, col) != 0 ? 1 : 0;
         }
      }

      var newRow = 0;
      var cols = matrix.cols;
      var newMatrix = new Matrix(newRows, cols);
      for (var row = 0; row != labelingRows; ++row) {
         for (var col = 0; col != labelingCols; ++col) {
            if (labelingMatrix.at(row, col) != 0) {
               for (var newCol = 0; newCol != cols; ++newCol) {
                  newMatrix.at(
                     newRow,
                     newCol,
                     matrix.at(row * labelingCols + col, newCol)
                  );
               }
               ++newRow;
            }
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives labeling metrics for non-zero components.
   this.labelingMetrics = function(aperture, obstruction) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var barycenter = new Point();
      var signals = new Array();
      var count = 0;
      var obstructionCount = 0;
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            if (aperture.matrix().at(row, col) != 0) {
               barycenter.x += col;
               barycenter.y += row;
               if (obstruction.matrix().at(row, col) == 0) {
                  signals.push(matrix.at(row, col));
               }
               ++count;
            }
            if (obstruction.matrix().at(row, col) != 0) {
               ++obstructionCount;
            }
         }
      }

      if (count != 0) {
         barycenter.x /= count;
         barycenter.y /= count;
         var signalFrame = new FrameReal(
            new Matrix(signals, signals.length, 1)
         );
         var signal = signalFrame.median();
         signalFrame.clear();
      }
      else {
         var signal = 0;
      }
      var radius = Math.sqrt(count / Math.PI);
      var obstructionRadius = Math.sqrt(obstructionCount / Math.PI);

      return {
         barycenter: barycenter,
         radius: radius,
         obstructionRadius: obstructionRadius,
         signal: signal
      };
   };

   // Gives a frame scaled by a scalar.
   this.scale = function(scale) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(row, col, scale * matrix.at(row, col));
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives a frame offset by a scalar.
   this.offset = function(offset) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(row, col, offset + matrix.at(row, col));
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives a frame offset by a scalar and then negated.
   this.negativeOffset = function(offset) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(row, col, -(offset + matrix.at(row, col)));
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives a sum frame.
   this.sum = function(frame) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var frameMatrix = frame.matrix();
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(
               row, col, matrix.at(row, col) + frameMatrix.at(row, col)
            );
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives a difference frame.
   this.difference = function(frame) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var frameMatrix = frame.matrix();
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(
               row, col, matrix.at(row, col) - frameMatrix.at(row, col)
            );
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives a product frame.
   this.product = function(frame) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var frameMatrix = frame.matrix();
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(
               row, col, matrix.at(row, col) * frameMatrix.at(row, col)
            );
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives a quotient frame.
   this.quotient = function(frame) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var frameMatrix = frame.matrix();
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(
               row, col, matrix.at(row, col) / frameMatrix.at(row, col)
            );
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives the intersection frame.
   this.intersection = function(frame) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var frameMatrix = frame.matrix();
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(
               row,
               col,
               matrix.at(row, col) != 0 && frameMatrix.at(row, col) != 0 ?
                  1 : 0
            );
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives the union frame.
   this.union = function(frame) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var frameMatrix = frame.matrix();
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(
               row,
               col,
               matrix.at(row, col) != 0 || frameMatrix.at(row, col) != 0 ?
                  1 : 0
            );
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives a reshaped frame.
   this.reshape = function(rows, cols) {
      if (rows * cols != matrix.rows * matrix.cols) {
         throw new Error(
            "Internal error: " +
            "reshape: rows * cols != matrix.rows * matrix.cols"
         );
      }

      var oldRow = 0;
      var oldCol = 0;
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(row, col, matrix.at(oldRow, oldCol));
            ++oldCol;
            if (oldCol == matrix.cols) {
               ++oldRow;
               oldCol = 0;
            }
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives a transpose frame.
   this.transpose = function() {
      return new FrameReal(matrix.transpose());
   };

   // Gives a reverse matrix.
   this.reverse = function() {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(row, col, matrix.at(rows - 1 - row, cols - 1 - col));
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives a fouier shifted frame.
   this.fourierShift = function() {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var rows2 = rows / 2;
      var cols2 = cols / 2;
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var shiftRow = row < rows2 ? row + rows2 : row - rows2;
            var shiftCol = col < cols2 ? col + cols2 : col - cols2;
            newMatrix.at(row, col, matrix.at(shiftRow, shiftCol));
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives a complex frame with matrix real and zero imag components.
   this.toComplex = function() {
      return new FrameComplex(
         this.cloneMatrix(),
         new Matrix(0, matrix.rows, matrix.cols)
      );
   };

   // Gives a complex frame with cos(2 pi matrix) real and sin(2 Pi matrix)
   // imag components.
   this.toComplexExp2PiI = function() {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var real = new Matrix(rows, cols);
      var imag = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            real.at(row, col, Math.cos(2 * Math.PI * matrix.at(row, col)));
            imag.at(row, col, Math.sin(2 * Math.PI * matrix.at(row, col)));
         }
      }

      return new FrameComplex(real, imag);
   };

   // Gives a frame with low rows added or -low rows removed on the top and
   // high rows added or -high rows removed on the bottom.
   this.padRows = function(low, high, pad) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      if (low + rows + high < 1) {
         throw new Error("Internal error: padRows: low + rows + high < 1");
      }

      var newMatrix = new Matrix(low + rows + high, cols);
      var newRow = 0;
      if (low > 0) {
         for (var j = 0; j != low; ++j, ++newRow) {
            for (var col = 0; col != cols; ++col) {
               newMatrix.at(newRow, col, pad);
            }
         }
      }
      for (
         var row = Math.max(0, -low);
         row != rows - Math.max(0, -high);
         ++row, ++newRow
      ) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(newRow, col, matrix.at(row, col));
         }
      }
      if (high > 0) {
         for (var j = 0; j != high; ++j, ++newRow) {
            for (var col = 0; col != cols; ++col) {
               newMatrix.at(newRow, col, pad);
            }
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives a frame with low columns added or -low columns removed on the
   // left and high columns added or -high columns removed on the right.
   this.padCols = function(low, high, pad) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      if (low + cols + high < 1) {
         throw new Error("Internal error: padCols: low + cols + high < 1");
      }

      var newMatrix = new Matrix(rows, low + cols + high);
      for (var row = 0; row != rows; ++row) {
         var newCol = 0;
         if (low > 0) {
            for (var j = 0; j != low; ++j, ++newCol) {
               newMatrix.at(row, newCol, pad);
            }
         }
         for (
            var col = Math.max(0, -low);
            col != cols - Math.max(0, -high);
            ++col, ++newCol
         ) {
            newMatrix.at(row, newCol, matrix.at(row, col));
         }
         if (high > 0) {
            for (var j = 0; j != high; ++j, ++newCol) {
              newMatrix.at(row, newCol, pad);
            }
         }
      }

      return new FrameReal(newMatrix);
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

      return new FrameReal(r);
   };

   // Gives the bilinear interpolation frame with specified row and column
   // interpolation positions.
   this.bilinearInterpolate = function(rowFrame, colFrame) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var rowMatrix = rowFrame.matrix();
      var colMatrix = colFrame.matrix();
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var pRow = Math.min(rows - 1, Math.max(0, rowMatrix.at(row, col)));
            var iRow = Math.min(rows - 2, Math.floor(pRow));
            var fRow = pRow - iRow;
            var pCol = Math.min(cols - 1, Math.max(0, colMatrix.at(row, col)));
            var iCol = Math.min(cols - 2, Math.floor(pCol));
            var fCol = pCol - iCol;
            newMatrix.at(
               row, col,
               (1 - fRow) * (1 - fCol) * matrix.at(iRow, iCol) +
               (1 - fRow) * fCol * matrix.at(iRow, iCol + 1) +
               fRow * (1 - fCol) * matrix.at(iRow + 1, iCol) +
               fRow * fCol * matrix.at(iRow + 1, iCol + 1)
            );
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives a rescale frame with conserved flux.
   this.rescaleConserveFlux = function(scale) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var rows2 = Math.floor(0.5 * rows);
      var cols2 = Math.floor(0.5 * cols);
      var rowMatrix = new Matrix(rows, cols);
      var colMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var x = col - cols2;
            var y = row - rows2;
            var r = Math.sqrt(x * x + y * y);
            var t = x == 0 && y == 0 ? 0 : Math.atan2(y, x);
            var rp = r / scale;
            var xp = rp * Math.cos(t) + cols2;
            var yp = rp * Math.sin(t) + rows2;
            rowMatrix.at(row, col, yp);
            colMatrix.at(row, col, xp);
         }
      }

      var rowFrame = new FrameReal(rowMatrix);
      var colFrame = new FrameReal(colMatrix);
      var rescale = this.bilinearInterpolate(rowFrame, colFrame);
      rowFrame.clear();
      colFrame.clear();

      return rescale.stagePipeline([
         function(frame) {return frame.scale(1 / (scale * scale));}
      ]);
   };

   // Gives the laplacian with specified mesh spacing.
   this.laplacian = function(spacing) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var newMatrix = new Matrix(rows, cols);
      var row = 0;
      for (var col = 0; col != cols; ++col) {
         newMatrix.at(row, col, 0);
      }
      if (rows > 1) {
         for (++row; row != rows - 1; ++row) {
            var col = 0;
            newMatrix.at(row, col, 0);
            if (cols > 1) {
               for (++col; col != cols - 1; ++col) {
                  newMatrix.at(
                     row, col,
                     (
                        matrix.at(row - 1, col) +
                        matrix.at(row + 1, col) +
                        matrix.at(row, col - 1) +
                        matrix.at(row, col + 1) -
                        4 * matrix.at(row, col)
                     ) / (spacing * spacing)
                  );
               }
               newMatrix.at(row, col, 0);
            }
         }
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(row, col, 0);
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives the partial derivative in x with specified mesh spacing.
   this.partialDerivativeX = function(spacing) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         var col = 0;
         newMatrix.at(row, col, 0);
         if (cols > 1) {
            for (++col; col != cols - 1; ++col) {
               newMatrix.at(
                  row, col,
                  (
                     matrix.at(row, col + 1) -
                     matrix.at(row, col - 1)
                  ) / (2 * spacing)
               );
            }
            newMatrix.at(row, col, 0);
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives the partial derivative in y with specified mesh spacing.
   this.partialDerivativeY = function(spacing) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var newMatrix = new Matrix(rows, cols);
      var row = 0;
      for (var col = 0; col != cols; ++col) {
         newMatrix.at(row, col, 0);
      }
      if (rows > 1) {
         for (++row; row != rows - 1; ++row) {
            for (var col = 0; col != cols; ++col) {
               newMatrix.at(
                  row, col,
                  (
                     matrix.at(row + 1, col) -
                     matrix.at(row - 1, col)
                  ) / (2 * spacing)
               );
            }
         }
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(row, col, 0);
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives the partial derivative in x and x with specified mesh spacing.
   this.partialDerivativeXX = function(spacing) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         var col = 0;
         newMatrix.at(row, col, 0);
         if (cols > 1) {
            for (++col; col != cols - 1; ++col) {
               newMatrix.at(
                  row, col,
                  (
                     matrix.at(row, col + 1) +
                     matrix.at(row, col - 1)
                     - 2 * matrix.at(row, col)
                  ) / (spacing * spacing)
               );
            }
            newMatrix.at(row, col, 0);
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives the partial derivative in y and y with specified mesh spacing.
   this.partialDerivativeYY = function(spacing) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var newMatrix = new Matrix(rows, cols);
      var row = 0;
      for (var col = 0; col != cols; ++col) {
         newMatrix.at(row, col, 0);
      }
      if (rows > 1) {
         for (++row; row != rows - 1; ++row) {
            for (var col = 0; col != cols; ++col) {
               newMatrix.at(
                  row, col,
                  (
                     matrix.at(row + 1, col) +
                     matrix.at(row - 1, col)
                     - 2 * matrix.at(row, col)
                  ) / (spacing * spacing)
               );
            }
         }
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(row, col, 0);
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives the partial derivative in x and y with specified mesh spacing.
   this.partialDerivativeXY = function(spacing) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var newMatrix = new Matrix(rows, cols);
      var row = 0;
      for (var col = 0; col != cols; ++col) {
         newMatrix.at(row, col, 0);
      }
      if (rows > 1) {
         for (++row; row != rows - 1; ++row) {
            var col = 0;
            newMatrix.at(row, col, 0);
            if (cols > 1) {
               for (++col; col != cols - 1; ++col) {
                  newMatrix.at(
                     row, col,
                     (
                        matrix.at(row - 1, col - 1) -
                        matrix.at(row - 1, col + 1) -
                        matrix.at(row + 1, col - 1) +
                        matrix.at(row + 1, col + 1)
                     ) / (4 * spacing * spacing)
                  );
               }
               newMatrix.at(row, col, 0);
            }
         }
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(row, col, 0);
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives map(frame).
   this.map = function(map) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(
               row,
               col,
               map(matrix.at(row, col))
            );
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives blend * this + (1 - blend) * frame.
   this.blend = function(frame, blend) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var frameMatrix = frame.matrix();
      var blendMatrix = blend.matrix();
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var b = blendMatrix.at(row, col);
            newMatrix.at(
               row,
               col,
               b * matrix.at(row, col) + (1 - b) * frameMatrix.at(row, col)
            );
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives labeling for elements that exceed a threshold.
   // Elements exceeding the thresold are assigned label 1, all other elements
   // are assigned label 0.
   this.thresholdLabeling = function(threshold) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(row, col, matrix.at(row, col) > threshold ? 1 : 0);
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives labeling for foreground components.
   // Elements with non-zero labels are assigned component labels in the range
   // [0, rows * cols - 1].
   // Elements with zero labels are assigned the component label rows * cols.
   this.foregroundComponentLabeling = function(fullyConnected) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var components = new Array();
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            components.push(
               matrix.at(row, col) != 0 ? components.length : rows * cols
            );
         }
      }

      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var e = matrix.at(row, col);
            var i = row * cols + col;
            if (e != 0) {
               if (
                  fullyConnected &&
                  row != 0 &&
                  col != 0 &&
                  e == matrix.at(row - 1, col - 1)
               ) {
                  disjointSetUnion(components, i, i - cols - 1);
               }
               if (row != 0 && e == matrix.at(row - 1, col)) {
                  disjointSetUnion(components, i, i - cols);;
               }
               if (
                  fullyConnected &&
                  row != 0 &&
                  col != cols - 1 &&
                  e == matrix.at(row - 1, col + 1)
               ) {
                  disjointSetUnion(components, i, i - cols + 1);
               }
               if (col != 0 && e == matrix.at(row, col - 1)) {
                  disjointSetUnion(components, i, i - 1);
               }
            }
         }
      }

      for (var i = 0; i != components.length; ++i) {
         if (components[i] != components.length) {
            disjointSetFind(components, i);
         }
      }

      return new FrameReal(new Matrix(components, rows, cols));
   };

   // Gives labeling for specified component.
   // Elements with label equal to the specified value are assigned label 1,
   // all other elements are assigned label 0.
   this.specifiedComponentLabeling = function(component) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(row, col, matrix.at(row, col) == component ? 1 : 0);
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives labeling for not specified component.
   // Elements with label equal to the specified value are assigned label 0,
   // all other elements are assigned label 1.
   this.notSpecifiedComponentLabeling = function(component) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(row, col, matrix.at(row, col) != component ? 1 : 0);
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives labeling for maximum count component.
   // Elements with labels in the range [1, rows * cols - 1] and within the
   // maximum count component are assigned label 1, all other elements are
   // assigned label 0.
   this.maximumCountComponentLabeling = function() {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var counts = new Array();
      for (var i = 0; i != rows * cols + 1; ++i) {
         counts.push(0);
      }
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            ++counts[matrix.at(row, col)];
         }
      }

      var j = 1;
      for (var i = 1; i != counts.length - 1; ++i) {
         if (counts[j] < counts[i]) {
            j = i;
         }
      }

      return this.specifiedComponentLabeling(j);
   };

   // Gives labeling for maximum mean component.
   // Elements with labels in the range [1, rows * cols - 1] and within the
   // maximum mean component are assigned label 1, all other elements are
   // assigned label 0.
   this.maximumMeanComponentLabeling = function(frame) {
      var frameMatrix = frame.matrix();
      var rows = matrix.rows;
      var cols = matrix.cols;
      var counts = new Array();
      var means = new Array();
      for (var i = 0; i != rows * cols + 1; ++i) {
         counts.push(0);
         means.push(0);
      }
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var e = matrix.at(row, col);
            ++counts[e];
            means[e] += frameMatrix.at(row, col);
         }
      }

      for (var i = 1; i != counts.length - 1; ++i) {
         if (counts[i] != 0) {
            means[i] /= counts[i];
         }
      }

      var j = 1;
      for (var i = 1; i != counts.length - 1; ++i) {
         if (means[j] < means[i]) {
            j = i;
         }
      }

      return this.specifiedComponentLabeling(j);
   };

   // Gives labeling for interior component, initial labeling must have no
   // border components.
   // Elements within the interior component are assigned label 1, all other
   // elements are assigned label 0.
   this.interiorComponentLabeling = function() {
      return this.clone().stagePipeline([
         function(frame) {return frame.specifiedComponentLabeling(0);},
         function(frame) {return frame.foregroundComponentLabeling(false);},
         function(frame) {
            return frame.notSpecifiedComponentLabeling
               (frame.matrix().at(0, 0)
            );
         }
      ]);
   };

   // Gives labeling with border components deleted.
   // Elements within border components are assigned label 0, all other
   // elements have invariant labeling.
   this.deleteBorderComponentLabeling = function() {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var borders = new Array();
      for (var i = 0; i != rows * cols + 1; ++i) {
         borders.push(0);
      }

      for (var row = 0; row != rows; ++row) {
         borders[matrix.at(row, 0)] = 1;
         borders[matrix.at(row, cols - 1)] = 1;
      }
      for (var col = 0; col != cols; ++col) {
         borders[matrix.at(0, col)] = 1;
         borders[matrix.at(rows - 1, col)] = 1;
      }

      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(row, col, borders[matrix.at(row, col)] != 1 ?
               matrix.at(row, col) : 0);
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives the erosion.
   this.erosion = function(radius) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(row, col, matrix.at(row, col));
         }
      }

      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            if (matrix.at(row, col) == 0) {
               for (var subRow = -radius; subRow != radius + 1; ++subRow) {
                  for (var subCol = -radius; subCol != radius + 1; ++subCol) {
                     var totalRow = row + subRow;
                     var totalCol = col + subCol;
                     if (
                        0 <= totalRow &&
                        totalRow < rows &&
                        0 <= totalCol &&
                        totalCol < cols
                     ) {
                        newMatrix.at(totalRow, totalCol, 0);
                     }
                  }
               }
            }
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives the dilation.
   this.dilation = function(radius) {
      var rows = matrix.rows;
      var cols = matrix.cols;
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newMatrix.at(row, col, matrix.at(row, col));
         }
      }

      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            if (matrix.at(row, col) == 1) {
               for (var subRow = -radius; subRow != radius + 1; ++subRow) {
                  for (var subCol = -radius; subCol != radius + 1; ++subCol) {
                     var totalRow = row + subRow;
                     var totalCol = col + subCol;
                     if (
                        0 <= totalRow &&
                        totalRow < rows &&
                        0 <= totalCol &&
                        totalCol < cols
                     ) {
                        newMatrix.at(totalRow, totalCol, 1);
                     }
                  }
               }
            }
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives the aperture metrics.
   this.apertureMetrics = function(signalThreshold, hotPixelRemovalRadius) {
      var self = this;
      var aperture = self.medianFilter(hotPixelRemovalRadius).stagePipeline([
         function(frame) {return frame.thresholdLabeling(signalThreshold);},
         function(frame) {return frame.foregroundComponentLabeling(true);},
         function(frame) {return frame.deleteBorderComponentLabeling();},
         function(frame) {return frame.maximumMeanComponentLabeling(self);},
         function(frame) {return frame.interiorComponentLabeling();},
      ]);
      var obstruction = self.medianFilter(hotPixelRemovalRadius).stagePipeline([
         function(frame) {return frame.thresholdLabeling(signalThreshold);},
         function(frame) {return frame.negativeOffset(-1);},
         function(frame) {return frame.product(aperture);},
         function(frame) {return frame.foregroundComponentLabeling(true);},
         function(frame) {return frame.deleteBorderComponentLabeling();},
         function(frame) {return frame.maximumCountComponentLabeling(self);},
         function(frame) {return frame.interiorComponentLabeling();}
      ]);

      // aperture.toImageWindow(uniqueViewId("aperture")).show();
      // obstruction.toImageWindow(uniqueViewId("obstruction")).show();

      var metrics = self.labelingMetrics(aperture, obstruction);
      var mask = aperture.stagePipeline([
         function(frame) {return frame.difference(obstruction);}
      ]);
      obstruction.clear();

      return {
         metrics: metrics,
         mask : mask
      };
   };

   // Applies a median filter.
   this.medianFilter = function(radius) {
      var size = (2 * radius + 1) * (2 * radius + 1);
      var arrays = new Array();
      for (var i = 0; i != size; ++i) {
         arrays.push(new Array(i));
      }
      var array = new Array(size);

      var rows = matrix.rows;
      var cols = matrix.cols;
      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var n = 0;
            for (var krow = -radius; krow != radius + 1; ++krow) {
               for (var kcol = -radius; kcol != radius + 1; ++kcol) {
                  var lrow = row + krow;
                  var lcol = col + kcol;
                  if (0 <= lrow && lrow < rows && 0 <= lcol && lcol < cols) {
                     array[n] = matrix.at(lrow, lcol);
                     ++n;
                  }
               }
            }
            if (n == size) {
               newMatrix.at(row, col, medianArraySideEffect(array));
            }
            else {
               for (var i = 0; i != n; ++i) {
                  arrays[n][i] = array[i];
               }
               newMatrix.at(row, col, medianArraySideEffect(arrays[n]));
            }
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives a downsampled frame by factor size.
   this.downSample = function(size) {
      var rows = Math.floor(matrix.rows / size);
      if (rows < 1) {
         throw new Error("Internal error: downsample: rows < 1");
      }
      var cols = Math.floor(matrix.cols / size);
      if (cols < 1) {
         throw new Error("Internal error: downsample: cols < 1");
      }

      var newMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var sum = 0;
            for (var subRow = 0; subRow != size; ++subRow) {
               for (var subCol = 0; subCol != size; ++subCol) {
                  sum += matrix.at(size * row + subRow, size * col + subCol);
               }
            }
            newMatrix.at(row, col, sum / (size * size));
         }
      }

      return new FrameReal(newMatrix);
   };

   // Gives a histogram of elements in the range [min, max).
   this.histogram = function(min, max, bins) {
      var delimiters = new Array();
      for (var bin = 0; bin != bins + 1; ++bin) {
         delimiters.push(min + (bin / bins) * (max - min));
      }
      var values = new Array();
      for (var bin = 0; bin != bins; ++bin) {
         values.push(0);
      }

      var rows = matrix.rows;
      var cols = matrix.cols;
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var e = matrix.at(row, col);
            if (min <= e && e < max) {
               ++values[Math.floor(bins * (e - min) / (max - min))];
            }
         }
      }

      return {
         delimiters: delimiters,
         values: values
      };
   };

   this.defocusThresholdHistogram = function(
      bins, minimumBins, neighborhood, sigma
   ) {
      var min = this.min();
      var max = this.max();
      if (min == max) {
         return 0;
      }

      var zeros = true;
      for (; zeros && bins >= minimumBins;) {
         var histogram = this.histogram(min, max, bins);
         var delimiters = histogram.delimiters;
         var values = histogram.values;

         var peaks = peakDetectorNeighborhood(
            values, Math.round(bins / neighborhood) + 1, 2
         );
         if (peaks.length < 2) {
            return 0;
         }
         var minPeak = peaks[0];
         var maxPeak = peaks[peaks.length - 1];
         for (var i = peaks.length - 1; i != 0; --i) {
            if (values[maxPeak] < values[peaks[i]]) {
               maxPeak = peaks[i];
            }
         }

         if (false) {
            console.writeln("signalThresholdHistogramDelimiters = {");
            for (var i = 0; i != delimiters.length; ++i) {
               console.write(
                  delimiters[i], i == delimiters.length - 1 ? "" : ", "
               );
               if (((i + 1) % 8) == 0 || i == delimiters.length - 1) {
                  console.writeln();
               }
            }
            console.writeln("};");
            console.writeln("signalThresholdHistogramValues = {");
            for (var i = 0; i != values.length; ++i) {
               console.write(values[i], i == values.length - 1 ? "" : ", ");
               if (((i + 1) % 8) == 0 || i == values.length - 1) {
                  console.writeln();
               }
            }
            console.writeln("};");
            console.writeln("signalThresholdHistogramPeaks = {");
            for (var i = 0; i != peaks.length; ++i) {
               console.write(peaks[i], i == peaks.length - 1 ? "" : ", ");
               if (((i + 1) % 8) == 0 || i == peaks.length - 1) {
                  console.writeln();
               }
            }
            console.writeln("};");
         }

         delimiters.splice(0, minPeak);
         values.splice(0, minPeak);
         delimiters.splice(
            maxPeak - minPeak + 2, delimiters.length - (maxPeak - minPeak + 2)
         );
         values.splice(
            maxPeak - minPeak + 1, values.length - (maxPeak - minPeak + 1)
         );

         var count = 0;
         for (var i = 0; i != values.length; ++i) {
            if (values[i] == 0) {
               ++count;
            }
         }
         zeros = count > 0.1 * values.length;

         if (zeros) {
            bins = Math.round(bins / 2);
         }
      }
      if (zeros) {
         return 0;
      }

      var valuesCopy = values.slice(0, values.length);
      var threshold =
         medianArraySideEffect(valuesCopy) +
         sigma * 1.1926 * SnArraySideEffect(valuesCopy);
      for (
         var index = 0;
         index != values.length && threshold < values[index];
         ++index
      ) {
      }

      if (false) {
         console.writeln("signalThresholdHistogramDelimiters = {");
         for (var i = 0; i != delimiters.length; ++i) {
            console.write(
               delimiters[i], i == delimiters.length - 1 ? "" : ", "
            );
            if (((i + 1) % 8) == 0 || i == delimiters.length - 1) {
               console.writeln();
            }
         }
         console.writeln("};");
         console.writeln("signalThresholdHistogramValues = {");
         for (var i = 0; i != values.length; ++i) {
            console.write(values[i], i == values.length - 1 ? "" : ", ");
            if (((i + 1) % 8) == 0 || i == values.length - 1) {
               console.writeln();
            }
         }
         console.writeln("};");
         console.writeln(
            "signalThresholdHistogramThreshold = ", threshold, ";"
         );
         console.writeln("signalThresholdHistogramIndex = ", index, ";");
      }

      if (index - 1 < 0 || index + 1 >= delimiters.length) {
         return 0;
      }

      var d0 = 0.5 * (delimiters[index - 1] + delimiters[index]);
      var d1 = 0.5 * (delimiters[index] + delimiters[index + 1]);

      return (threshold - values[index - 1]) /
         (values[index] - values[index - 1]) * (d1 - d0) + d0;
   };
}

// Counts FrameComplex objects neither cleared nor released.
var globalFrameComplexCount = 0;

// Provides a frame of complex values using a matrix pair representation.
function FrameComplex(real, imag) {
   ++globalFrameComplexCount;

   // Releases the matricies.
   this.release = function() {
      --globalFrameComplexCount;
   };

   // Clears the matricies.
   this.clear = function() {
      --globalFrameComplexCount;
      real.assign(0, 0, 0);
      imag.assign(0, 0, 0);
   };

   // Gives a real matrix clone.
   this.cloneRealMatrix = function() {
#iflt __PI_BUILD__ 1168
      var z = new Matrix(0, real.rows, real.cols);
      var r = z.add(real);
      z.assign(0, 0, 0);
      return r;
#else
      return new Matrix(real);
#endif
   };

   // Gives a imag matrix clone.
   this.cloneImagMatrix = function() {
#iflt __PI_BUILD__ 1168
      var z = new Matrix(0, imag.rows, imag.cols);
      var r = z.add(imag);
      z.assign(0, 0, 0);
      return r;
#else
      return new Matrix(imag);
#endif
   };

   // Gives a clone.
   this.clone = function() {
      return new FrameComplex(
         this.cloneRealMatrix(),
         this.cloneImagMatrix()
      );
   };

   // Gives the result of a stage pipeline.
   this.stagePipeline = function(stages) {
      var a = this;
      for (var i = 0; i != stages.length; ++i) {
         var b = stages[i](a);
         a.clear();
         a = b;
      }

      return a;
   };

   // Gives the real frame.
   this.real = function() {
      return new FrameReal(this.cloneRealMatrix());
   };

   // Gives the imag frame.
   this.imag = function() {
      return new FrameReal(this.cloneImagMatrix());
   };

   // Gives rows.
   this.rows = function() {
      return real.rows;
   };

   // Gives cols.
   this.cols = function() {
      return real.cols;
   };

   // Gives the norm frame.
   this.norm = function() {
      var rows = real.rows;
      var cols = real.cols;
      var matrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            matrix.at(
               row, col, square(real.at(row, col)) + square(imag.at(row, col))
            );
         }
      }

      return new FrameReal(matrix);
   };

   // Gives the modulus frame.
   this.modulus = function() {
      var rows = real.rows;
      var cols = real.cols;
      var matrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            matrix.at(
               row,
               col,
               Math.sqrt(square(real.at(row, col)) + square(imag.at(row, col)))
            );
         }
      }

      return new FrameReal(matrix);
   };

   // With centered = false, gives the fourier transform of a complex frame,
   // using Mathematica FourierParameters {0, 1} conventions. With
   // centered = true, gives the centered equivalent.
   this.fourier = function(centered, throwAbort) {
      var rows = real.rows;
      var cols = real.cols;
      var image = new Image(
         cols, rows, 1, ColorSpace_Gray, 32, SampleType_Complex
      );

      var c = new Complex;
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            c.real = real.at(row, col);
            c.imag = -imag.at(row, col);
            image.setSample(c, col, row);
         }
      }

      //try {
         throwAbort();
      //}
      //catch (e) {
      //   image.free();
      //   throw e;
      //}
      image.FFT(centered);
      //try {
         throwAbort();
      //}
      //catch (e) {
      //   image.free();
      //   throw e;
      //}

      var n = 1 / Math.sqrt(rows * cols);
      var newReal = new Matrix(rows, cols);
      var newImag = new Matrix(rows, cols);
      var c = new Complex;
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            c = image.sample(col, row);
            var flip = centered && (row & 1) == (col & 1);
            newReal.at(row, col, flip ? -n * c.real : n * c.real);
            newImag.at(row, col, flip ? n * c.imag : -n * c.imag);
         }
      }

      image.free();

      return new FrameComplex(newReal, newImag);
   };

   // With centered = false, gives the inverse fourier transform of a complex
   // frame, using Mathematica FourierParameters {0, 1} conventions. With
   // centered = true, gives the centered equivalent.
   this.inverseFourier = function(centered, throwAbort) {
      var rows = real.rows;
      var cols = real.cols;
      var image = new Image(
         cols, rows, 1, ColorSpace_Gray, 32, SampleType_Complex
      );

      var c = new Complex;
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var flip = centered && (row & 1) == (col & 1);
            c.real = flip ? -real.at(row, col) : real.at(row, col);
            c.imag = flip ? imag.at(row, col) : -imag.at(row, col);
            image.setSample(c, col, row);
         }
      }

      //try {
         throwAbort();
      //}
      //catch (e) {
      //   image.free();
      //   throw e;
      //}
      image.inverseFFT(centered);
      //try {
         throwAbort();
      //}
      //catch (e) {
      //   image.free();
      //   throw e;
      //}

      var n = 1 / Math.sqrt(rows * cols);
      var newReal = new Matrix(rows, cols);
      var newImag = new Matrix(rows, cols);
      var c = new Complex;
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            c = image.sample(col, row);
            newReal.at(row, col, n * c.real);
            newImag.at(row, col, -n * c.imag);
         }
      }

      image.free();

      return new FrameComplex(newReal, newImag);
   };

   // Gives a fouier shifted frame.
   this.fourierShift = function() {
      var rows = real.rows;
      var cols = real.cols;
      var rows2 = rows / 2;
      var cols2 = cols / 2;
      var newReal = new Matrix(rows, cols);
      var newImag = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            var shiftRow = row < rows2 ? row + rows2 : row - rows2;
            var shiftCol = col < cols2 ? col + cols2 : col - cols2;
            newReal.at(row, col, real.at(shiftRow, shiftCol));
            newImag.at(row, col, imag.at(shiftRow, shiftCol));
         }
      }

      return new FrameComplex(newReal, newImag);
   };

   // Gives a frame with low rows added or -low rows removed on the top and
   // high rows added or -high rows removed on the bottom.
   this.padRows = function(low, high, pad) {
      var realFrame = new FrameReal(real);
      var imagFrame = new FrameReal(imag);
      var realPadFrame = realFrame.padRows(low, high, pad);
      var imagPadFrame = imagFrame.padRows(low, high, pad);
      realFrame.clear();
      imagFrame.clear();
      var complexFrame = new FrameComplex(
         realPadFrame.matrix(), imagPadFrame.matrix()
      );
      realPadFrame.release();
      imagPadFrame.release();

      return complexFrame;
   };

   // Gives a frame with low columns added or -low columns removed on the left
   // and high columns added or -high columns removed on the right.
   this.padCols = function(low, high, pad) {
      var realFrame = new FrameReal(real);
      var imagFrame = new FrameReal(imag);
      var realPadFrame = realFrame.padCols(low, high, pad);
      var imagPadFrame = imagFrame.padCols(low, high, pad);
      realFrame.clear();
      imagFrame.clear();
      var complexFrame = new FrameComplex(
         realPadFrame.matrix(), imagPadFrame.matrix()
      );
      realPadFrame.release();
      imagPadFrame.release();

      return complexFrame;
   };

   // Gives the product with real argument.
   this.productReal = function(frameReal) {
      var rows = real.rows;
      var cols = real.cols;
      var frameMatrix = frameReal.matrix();
      var newReal = new Matrix(rows, cols);
      var newImag = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newReal.at(row, col, frameMatrix.at(row, col) * real.at(row, col));
            newImag.at(row, col, frameMatrix.at(row, col) * imag.at(row, col));
         }
      }

      return new FrameComplex(newReal, newImag);
   };

   // Gives the quotient with real argument.
   this.quotientReal = function(frameReal) {
      var rows = real.rows;
      var cols = real.cols;
      var frameMatrix = frameReal.matrix();
      var newReal = new Matrix(rows, cols);
      var newImag = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            newReal.at(row, col, real.at(row, col) / frameMatrix.at(row, col));
            newImag.at(row, col, imag.at(row, col) / frameMatrix.at(row, col));
         }
      }

      return new FrameComplex(newReal, newImag);
   };
}

// ****************************************************************************
// EOF FrameMatrix.js - Released 2016/12/30 00:00:00 UTC
