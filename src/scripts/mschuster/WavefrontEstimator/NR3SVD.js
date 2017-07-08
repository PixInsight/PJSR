// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// NR3SVD.js - Released 2016/12/30 00:00:00 UTC
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

// Numerical Recipes 3rd Edition, Webnote No. 2, Rev. 1, SVD Implementation.
// www.nr.com/webnotes?2
// Modified to include isFinite tests to handle denormalized numbers that have
// no representable inverse.
// Gives [u, w, v, tsh]
function NR3SVD(a) {
   var eps = Math.pow2(-52);
   var itsmax = 30;
   var convergeError = "The NR3SVD process did not converge";
   var representError = "The NR3SVD process did not find representable result";
   var m = a.rows;
   var n = a.cols;
#iflt __PI_BUILD__ 1168
   var z = new Matrix(0, m, n);
   var u = z.add(a);
   z.assign(0, 0, 0);
#else
   var u = new Matrix(a);
#endif
   var w = new Vector(n);
   var v = new Matrix(n, n);

   function square(a) {
      return a * a;
   }

   function sign(a, b) {
      return b >= 0 ? (a >= 0 ? a : -a) : (a >= 0 ? -a : a);
   }

   function pythag(a, b) {
      var absa = Math.abs(a);
      var absb = Math.abs(b);
      return (
         absa > absb ?
            absa * Math.sqrt(1 + square(absb / absa)) :
            (absb == 0 ? 0 : absb * Math.sqrt(1 + square(absa / absb)))
      );
   }

   function decompose() {
      var flag;
      var i;
      var its;
      var j;
      var jj;
      var k;
      var l;
      var nm;
      var anorm;
      var c;
      var f;
      var g;
      var ig;
      var h;
      var s;
      var scale;
      var x;
      var y;
      var z;
      var rv1 = new Vector(n);
      g = 0;
      scale = 0;
      anorm = 0;
      for (i = 0; i < n; i++) {
         l = i + 2;
         rv1.at(i, scale * g);
         g = 0;
         s = 0;
         scale = 0;
         if (i < m) {
            for (k = i; k < m; k++) {
               scale += Math.abs(u.at(k, i));
            }
            if (scale != 0) {
               for (k = i; k < m; k++) {
                  u.at(k, i, u.at(k, i) / scale);
                  s += u.at(k, i) * u.at(k, i);
               }
               f = u.at(i, i);
               g = -sign(Math.sqrt(s), f);
               h = f * g - s;
               u.at(i, i, f - g);
               for (j = l - 1; j < n; j++) {
                  s = 0;
                  for (k = i; k < m; k++) {
                     s += u.at(k, i) * u.at(k, j);
                  }
                  f = s / h;
                  for (k = i; k < m; k++) {
                     u.at(k, j, u.at(k, j) + f * u.at(k, i))
                  }
               }
               for (k = i; k < m; k++) {
                  u.at(k, i, u.at(k, i) * scale);
               }
            }
         }
         w.at(i, scale * g);
         g = 0;
         s = 0;
         scale = 0;
         if (i + 1 <= m && i + 1 != n) {
            for (k = l - 1; k < n; k++) {
               scale += Math.abs(u.at(i, k));
            }
            if (scale != 0) {
               for (k = l - 1; k < n; k++) {
                  u.at(i, k, u.at(i, k) / scale);
                  s += u.at(i, k) * u.at(i, k);
               }
               f = u.at(i, l - 1);
               g = -sign(Math.sqrt(s), f);
               h = f * g - s;
               u.at(i, l - 1, f - g);
               for (k = l - 1; k < n; k++) {
                  rv1.at(k, u.at(i, k) / h);
               }
               for (j = l - 1; j < m; j++) {
                  s = 0;
                  for (k = l - 1; k < n; k++) {
                     s += u.at(j, k) * u.at(i, k);
                  }
                  for (k = l - 1; k < n; k++) {
                     u.at(j, k, u.at(j, k) + s * rv1.at(k));
                  }
               }
               for (k = l - 1; k < n; k++) {
                  u.at(i, k, u.at(i, k) * scale);
               }
            }
         }
         anorm = Math.max(anorm, Math.abs(w.at(i)) + Math.abs(rv1.at(i)));
      }
      for (i = n - 1; i >= 0; i--) {
         if (i < n - 1) {
            if (g != 0 && isFinite(1 / g)) {
               ig = 1 / g;
               for (j = l; j < n; j++) {
                  v.at(j, i, (u.at(i, j) / u.at(i, l)) * ig);
               }
               for (j = l; j < n; j++) {
                  s = 0;
                  for (k = l; k < n; k++) {
                     s += u.at(i, k) * v.at(k, j);
                  }
                  for (k = l; k < n; k++ ) {
                     v.at(k, j, v.at(k, j) + s * v.at(k, i));
                  }
               }
            }
            for (j = l; j < n; j++) {
               v.at(i, j, 0);
               v.at(j, i, 0);
            }
         }
         v.at(i, i, 1);
         g = rv1.at(i);
         l = i;
      }
      for (i = Math.min(m, n) - 1; i >= 0; i--) {
         l = i + 1;
         g = w.at(i);
         for (j = l; j < n; j++) {
            u.at(i, j, 0);
         }
         if (g != 0 && isFinite(1 / g)) {
            g = 1 / g;
            for (j = l; j < n; j++) {
               s = 0;
               for (k = l; k < m; k++) {
                  s += u.at(k, i) * u.at(k, j);
               }
               f = (s / u.at(i, i)) * g;
               for (k = i; k < m; k++) {
                  u.at(k, j, u.at(k, j) + f * u.at(k, i));
               }
            }
            for (j = i; j < m; j++) {
               u.at(j, i, u.at(j, i) * g);
            }
         }
         else {
            for (j = i; j < m; j++) {
               u.at(j, i, 0);
            }
         }
         u.at(i, i, u.at(i, i) + 1);
      }
      for (k = n - 1; k >= 0; k--) {
         for (its = 0; its < itsmax; its++) {
            flag = true;
            for (l = k; l >= 0; l--) {
               nm = l - 1;
               if (l == 0 || Math.abs(rv1.at(l)) <= eps * anorm) {
                  flag = false;
                  break;
               }
               if (Math.abs(w.at(nm)) <= eps * anorm) {
                  break;
               }
            }
            if (flag) {
               c = 0;
               s = 1;
               for (i = l; i < k + 1; i++) {
                  f = s * rv1.at(i);
                  rv1.at(i, c * rv1.at(i));
                  if (Math.abs(f) <= eps * anorm) {
                     break;
                  }
                  g = w.at(i);
                  h = pythag(f, g);
                  w.at(i, h);
                  h = 1 / h;
                  c = g * h;
                  s = -f * h;
                  for (j = 0; j < m; j++) {
                     y = u.at(j, nm);
                     z = u.at(j, i);
                     u.at(j, nm, y * c + z * s);
                     u.at(j, i, z * c - y * s);
                  }
               }
            }
            z = w.at(k);
            if (l == k) {
               if (z < 0) {
                  w.at(k, -z);
                  for (j = 0; j < n; j++) {
                     v.at(j, k, -v.at(j, k));
                  }
               }
               break;
            }
            if (its == itsmax - 1) {
               throw new Error(convergeError);
            }
            x = w.at(l);
            nm = k - 1;
            y = w.at(nm);
            g = rv1.at(nm);
            h = rv1.at(k);
            f = ((y - z) * (y + z) + (g - h) * (g + h)) / (2 * h * y);
            g = pythag(f, 1);
            f = ((x - z) * (x + z) + h * ((y / (f + sign(g, f))) - h)) / x;
            c = 1;
            s = 1;
            for (j = l; j <= nm; j++) {
               i = j + 1;
               g = rv1.at(i);
               y = w.at(i);
               h = s * g;
               g = c * g;
               z = pythag(f, h);
               rv1.at(j, z);
               c = f / z;
               s = h / z;
               f = x * c + g * s;
               g = g * c - x * s;
               h = y * s;
               y *= c;
               for (jj = 0; jj < n; jj++) {
                  x = v.at(jj, j);
                  z = v.at(jj, i);
                  v.at(jj, j, x * c + z * s);
                  v.at(jj, i, z * c - x * s);
               }
               z = pythag(f, h);
               w.at(j, z);
               if (z != 0 && isFinite(1 / z)) {
                  z = 1 / z;
                  c = f * z;
                  s = h * z;
               }
               f = c * g + s * y;
               x = c * y - s * g;
               for (jj = 0; jj < m; jj++) {
                  y = u.at(jj, j);
                  z = u.at(jj, i);
                  u.at(jj, j, y * c + z * s);
                  u.at(jj, i, z * c - y * s);
               }
            }
            rv1.at(l, 0);
            rv1.at(k, f);
            w.at(k, x);
         }
      }

      rv1.assign(0, 0);
   }

   function reorder() {
      var i;
      var j;
      var k;
      var s;
      var inc = 1;
      var sw;
      var su = new Vector(m);
      var sv = new Vector(n);
      for (;;) {
         inc *= 3;
         inc++;
         if (!(inc <= n)) {
            break;
         }
      }
      for (;;) {
         inc = Math.floor(inc / 3);
         for (i = inc; i < n; i++) {
            sw = w.at(i);
            for (k = 0; k < m; k++) {
               su.at(k, u.at(k, i));
            }
            for (k = 0; k < n; k++ ) {
               sv.at(k, v.at(k, i));
            }
            j = i;
            for (; w.at(j - inc) < sw;) {
               w.at(j, w.at(j - inc));
               for (k = 0; k < m; k++) {
                  u.at(k, j, u.at(k, j - inc));
               }
               for (k = 0; k < n; k++) {
                  v.at(k, j, v.at(k, j - inc));
               }
               j -= inc;
               if (j < inc) {
                  break;
               }
            }
            w.at(j, sw);
            for (k = 0; k < m; k++) {
               u.at(k, j, su.at(k));
            }
            for (k = 0; k < n; k++) {
               v.at(k, j, sv.at(k));
            }
         }
         if (!(inc > 1)) {
            break;
         }
      }
      for (k = 0; k < n; k++) {
         s = 0;
         for (i = 0; i < m; i++) {
            if (u.at(i, k) < 0) {
               s++;
            }
         }
         for (j = 0; j < n; j++) {
            if (v.at(j, k) < 0) {
               s++;
            }
         }
         if (s > Math.floor((m + n) / 2)) {
            for (i = 0; i < m; i++) {
               u.at(i, k, -u.at(i, k));
            }
            for (j = 0; j < n; j++) {
               v.at(j, k, -v.at(j, k));
            }
         }
      }
      su.assign(0, 0);
      sv.assign(0, 0);
   }

   function check() {
      var i;
      var j;

      for (i = 0; i < m; ++i) {
         for (j = 0; j < n; ++j) {
            if (!isFinite(u.at(i, j))) {
               throw new Error(representError);
            }
         }
      }
      for (i = 0; i < n; ++i) {
         if (!isFinite(w.at(i))) {
            throw new Error(representError);
         }
         for (j = 0; j < n; ++j) {
            if (!isFinite(v.at(i, j))) {
               throw new Error(representError);
            }
         }
      }
   }

   decompose();
   reorder();
   check();

   var tsh = 0.5 * Math.sqrt(m + n + 1) * Math.abs(w.at(0)) * eps;

   return [u, w, v, tsh];
};

// ****************************************************************************
// EOF NR3SVD.js - Released 2016/12/30 00:00:00 UTC
