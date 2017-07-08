// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// RousseeuwCrouxSn.js - Released 2016/12/30 00:00:00 UTC
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

/*!
 * Gives the Sn scale estimator of Rousseeuw and Croux:
 *
 * Sn = c * low_median( high_median( |x_i - x_j| ) )
 *
 * where low_median() is the order statistic of rank (n + 1)/2, and
 * high_median() is the order statistic of rank n/2 + 1.
 *
 * For vectors with less than two components, this function returns zero.
 *
 * The constant c = 1.1926 must be used to make the Sn estimator converge to
 * the standard deviation of a pure normal distribution. However, this
 * implementation does not apply it (it uses c=1 implicitly), for
 * consistency with other implementations of scale estimators.
 *
 * This implementation includes finite sample corrections, which can be
 * significant for relatively small vector lengths.
 *
 * \b References
 *
 * P.J. Rousseeuw and C. Croux (1993), <em>Alternatives to the Median Absolute
 * Deviation,</em> Journal of the American Statistical Association, Vol. 88,
 * pp. 1273-1283.
 *
 * C. Croux and P.J. Rousseeuw (1992), <em>Time-Efficient Algorithms for Two
 * Highly Robust Estimators of Scale, Computational Statistics, Vol. 1,
 * pp. 411-428.
 */
// Swaps elements of array as a side effect
function SnArraySideEffect(x) {
   x.sort(function(a, b) {return a - b;});

   var n = x.length;
   if (n < 2) {
      return 0;
   }

   var y = new Array(n);
   y[0] = x[n >> 1] - x[0];

   for (var i = 2; i <= (n + 1) >> 1; ++i) {
      var nA = i - 1;
      var nB = n - i;
      var diff = nB - nA;
      var leftA = 1;
      var leftB = 1;
      var rightA = nB;
      var rightB = nB;
      var Amin = (diff >> 1) + 1;
      var Amax = (diff >> 1) + nA;

      while (leftA < rightA) {
         var length = rightA - leftA + 1;
         var even = 1 - (length & 1);
         var half = (length - 1) >> 1;
         var tryA = leftA + half;
         var tryB = leftB + half;

         if (tryA < Amin) {
            rightB = tryB;
            leftA = tryA + even;
         }
         else {
            if (tryA > Amax) {
               rightA = tryA;
               leftB = tryB + even;
            }
            else {
               var medA = x[i - 1] - x[i - tryA + Amin - 2];
               var medB = x[tryB + i - 1] - x[i - 1];
               if (medA >= medB) {
                  rightA = tryA;
                  leftB = tryB + even;
               }
               else {
                  rightB = tryB;
                  leftA = tryA + even;
               }
            }
         }
      }
      if (leftA > Amax) {
         y[i - 1] = x[leftB + i - 1] - x[i - 1];
      }
      else {
         var medA = x[i - 1] - x[i - leftA + Amin - 2];
         var medB = x[leftB + i - 1] - x[i - 1];
         y[i - 1] = medA < medB ? medA : medB;
      }
   }

   for (var i = ((n + 1) >> 1) + 1; i <= n - 1; ++i) {
      var nA = n - i;
      var nB = i - 1;
      var diff = nB - nA;
      var leftA = 1;
      var leftB = 1;
      var rightA = nB;
      var rightB = nB;
      var Amin = (diff >> 1) + 1;
      var Amax = (diff >> 1) + nA;

      while (leftA < rightA) {
         var length = rightA - leftA + 1;
         var even = 1 - (length & 1);
         var half = (length - 1) >> 1;
         var tryA = leftA + half;
         var tryB = leftB + half;

         if (tryA < Amin) {
            rightB = tryB;
            leftA = tryA + even;
         }
         else {
            if (tryA > Amax) {
               rightA = tryA;
               leftB = tryB + even;
            }
            else {
               var medA = x[i + tryA - Amin] - x[i - 1];
               var medB = x[i - 1] - x[i - tryB - 1];
               if (medA >= medB) {
                  rightA = tryA;
                  leftB = tryB + even;
               }
               else {
                  rightB = tryB;
                  leftA = tryA + even;
               }
            }
         }
      }
      if (leftA > Amax) {
         y[i - 1] = x[i - 1] - x[i - leftB - 1];
      }
      else {
         var medA = x[i + leftA - Amin] - x[i - 1];
         var medB = x[i - 1] - x[i - leftB - 1];
         y[i - 1] = medA < medB ? medA : medB;
      }
   }

   y[n - 1] = x[n - 1] - x[((n + 1) >> 1) - 1];

   var cn;
   switch (n) {
      case  2: cn = 0.743; break;
      case  3: cn = 1.851; break;
      case  4: cn = 0.954; break;
      case  5: cn = 1.351; break;
      case  6: cn = 0.993; break;
      case  7: cn = 1.198; break;
      case  8: cn = 1.005; break;
      case  9: cn = 1.131; break;
      default: cn = (n & 1) ? n / (n - 0.9) : 1.0; break;
   }

   return cn * y[selectArraySideEffect(y, 0, y.length, ((n + 1) >> 1) - 1)];
}

// ****************************************************************************
// EOF RousseeuwCrouxSn.js - Released 2016/12/30 00:00:00 UTC
