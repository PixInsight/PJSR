// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// Global.js - Released 2016/12/30 00:00:00 UTC
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

// Gives x squared.
function square(x) {
   return x * x;
}

// Swaps ith and jth element of the array a.
function swapArray(a, i, j) {
   var r = a[i];
   a[i] = a[j];
   a[j] = r;
}

// Gives the index of the kth largest element of the array a in the range
// [i, j), swaps elements of array a as a side effect.
function selectArraySideEffect(a, i, j, k) {
   var n = j - i;
   if (k < 0 || n < 1 || n <= k) {
      return j;
   }

   var l = 0;
   var r = n - 1;
   for (; l + 1 < r;) {
      //assert(l <= k && k <= r, "l <= k && k <= r");
      //assert(true, "kth element lies within range [i + l, i + r]");
      //assert(true, "loop body accesses values within range [i + l, i + r]");
      //assert(true, "loop body strictly decreases r - l");
      var x0 = i + l;
      var x = x0 + 1;
      var y = i + r;

      swapArray(a, x, i + ((l + r) >> 1));

      if (a[y] < a[x0]) {
         swapArray(a, x0, y);
      }
      if (a[y] < a[x]) {
         swapArray(a, x, y);
      }
      if (a[x] < a[x0]) {
         swapArray(a, x, x0);
      }
      //assert(x0 + 1 == x && x < y && a[x0] <= a[x] && a[x] <= a[y]);

      var v = a[x];

      swapArray(a, x, y);
      for (; x < y;) {
         swapArray(a, x, y);
         //assert(i + l < x && x < y && y <= i + r, "i + l < x && x < y && y <= i + r");
         //assert(true, "loop body accesses values within range [x, y]");
         //assert(true, "loop body strictly decreases y - x");
         while (a[++x] < v) {
         }
         //assert(i + l < x && x <= y && y <= i + r, "i + l < x && x <= y && y <= i + r");
         while (v < a[--y]) {
         }
         //assert(i + l <= x - 1 && x - 1 <= y && x0 < y && y <= i + r, "i + l <= x - 1 && x - 1 <= y && x0 < y && y <= i + r");
      }
      //assert(i + l < y && y < i + r, "i + l < y && y < i + r");

      a[x0 + 1] = a[y];
      a[y] = v;
      //assert(true, "a[i + l, y] <= a[y]");
      //for (var q = i + l; q != y + 1; ++q) {
      //   assert(a[q] <= a[y]);
      //}
      //assert(true, "a[y] <= a[y, i + r]");
      //for (var q = y; q != i + r + 1; ++q) {
      //   assert(a[y] <= a[q]);
      //}

      var dy = y - i;
      //assert(l < dy && dy < r, "l < dy && dy < r");
      if (dy >= k) {
         r = dy;
      }
      if (dy <= k) {
         l = dy;
      }
   }

   if (r == l + 1 && a[i + r] < a[i + l]) {
      swapArray(a, i + l, i + r);
   }
   return i + k;
}

// Gives the mean of array.
function meanArray(array) {
   var count = array.length;
   if (count == 0) {
      return 0;
   }
   var sum = 0;
   for (var i = 0; i != count; ++i) {
      sum += array[i];
   }

   return sum / count;
}

// Gives the median of array, sorts array as a side effect.
function medianArraySideEffect(array) {
   var count = array.length;
   if (count == 0) {
      return 0;
   }
   if (count == 1) {
      return array[0];
   }
   array.sort(function(a, b) {return a - b;});
   var count2 = count >> 1;
   if ((count % 2) == 0) {
      return 0.5 * (array[count2 - 1] + array[count2]);
   }

   return array[count2];
}

// Gives the numeric value if defined and within the range [min, max],
// otherwise gives default.
function defaultNumeric(numeric, min, max, def) {
   return numeric != null &&
      !isNaN(numeric) &&
      numeric >= min && numeric <= max ? numeric : def;
}

// Gives the boolean value if defined, otherwise gives default.
function defaultBoolean(bool, def) {
   return bool != null && (bool == false || bool == true) ? bool : def;
}

// Gives the string value if defined, otherwise gives default.
function defaultString(string, def) {
   return string != null ? string : def;
}

// Filters a view id to match ^[_a-zA-Z][_a-zA-Z0-9]*$ by replacing invalid
// characters by "_".
function filterViewId(id) {
   return id.trim() == "" ?
      "_" :
      id.trim().replace(/[^_a-zA-Z0-9]/g, '_').replace(/^[^_a-zA-Z]/, '_');
}

// Gives a unique view id with base id by appending a suffix.
function uniqueViewId(baseId) {
   var id = baseId.replace("->", "_");
   for (var i = 1; !View.viewById(id).isNull; ++i) {
      id = baseId.replace("->", "_") + format("_%d", i);
   }

   return id;
}

// Gives a unique full path with base path by appending a suffix.
function uniqueFullPath(basePath) {
   var path = basePath;
   for (var i = 1; File.exists(path); ++i) {
      path = File.appendToName(basePath, format("_%d", i));
   }

   return path;
}

// Gives a unique view id and a unique full path pair with base id and base
// path by appending an common suffix.
function uniqueViewIdFullPath(baseId, basePath) {
   var id = baseId.replace("->", "_");
   var path = basePath;
   for (var i = 1; !View.viewById(id).isNull || File.exists(path); ++i) {
      id = baseId.replace("->", "_") + format("_%d", i);
      path = File.appendToName(basePath, format("_%d", i));
   }

   return {
      id: id,
      path: path
   };
}

// Gives the set containing element i, updates the disjoint-set data structure.
function disjointSetFind(sets, i) {
   var j = i;
   for (; sets[j] != j; j = sets[j]) {
   }
   for (; i != j;) {
      var k = sets[i];
      sets[i] = j;
      i = k;
   }
   return j;
}

// Unions sets containing elements i and j, updates the disjoint-set data
// structure.
function disjointSetUnion(sets, i, j) {
   i = this.disjointSetFind(sets, i);
   j = this.disjointSetFind(sets, j);
   sets[i] = j;
}

// Perlin smoother step.
function perlinSmootherStep(r) {
   var c = Math.max(0, Math.min(1, r));

   return c * c * c * (10 - 15 * c + 6 * c * c);
}

// Gives an array, count pair. A component of the array is true if its
// corresponding element in data is greater than the nearest lower neighbor
// not equal to the element. Neighbors beyond the ends of data are assumed to
// be equal to -infinity. The returned count equals the number of true values.
function peakDetectorStart(data) {
   var peaks = new Array();
   var count = 0;
   for (var i = 0; i != data.length;) {
      for (var j = i + 1; j != data.length && data[i] == data[j]; ++j) {
      }
      for (var k = i; k != j; ++k) {
         var peak = i == 0 || data[i - 1] < data[k];
         peaks.push(peak);
         if (peak) {
            ++count;
         }
      }
      i = j;
   }

   return new Array(peaks, count);
}

// Gives an array, count pair. A component of the array is true if its
// corresponding element in data is greater than or equal to a lower neighbor
// and greater than an upper neighbor. Neighbors are located at a distance of
// k elements in data. Neighbors beyond the ends of data are assumed to be
// equal to -infinity. The returned count equals the number of true values.
function peakDetectorProbe(data, k) {
   var peaks = new Array();
   var count = 0;
   for (var i = 0; i != data.length; ++i) {
      var peak =
         (i < k || data[i] >= data[i - k]) &&
         (i >= data.length - k || data[i] > data[i + k]);
      peaks.push(peak);
      if (peak) {
         ++count;
      }
   }

   return new Array(peaks, count);
}

// Gives an array, count pair with array equal to the element-wise logical
// and of the array components of the arguments and count equal to the number
// of true values.
function peakDetectorUnion(t, s) {
   var peaks = new Array();
   var count = 0;
   for (var i = 0; i != t[0].length; ++i) {
      var peak = t[0][i] && s[0][i];
      peaks.push(peak);
      if (peak) {
         ++count;
      }
   }

   return new Array(peaks, count);
}

// Gives the indicies of the highest local peaks in data with specified
// neighborhood. Attempts to give no fewer than minimum peaks.
function peakDetectorNeighborhood(data, neighborhood, minimum) {
   var k = 1;
   var t = peakDetectorUnion(
      peakDetectorStart(data), peakDetectorProbe(data, k)
   );
   for (++k; k < neighborhood && t[1] > minimum; ++k) {
      var s = peakDetectorUnion(t, peakDetectorProbe(data, k));
      if (s[1] < minimum) {
         break;
      }
      t = s;
   }

   var indices = new Array();
   for (var i = 0; i != data.length; ++i) {
      if (t[0][i]) {
         indices.push(i);
      }
   }

   return indices;
}

// Static methods for core Parameters object.
if (!Parameters.indexedId) {
   Parameters.indexedId = function(id, index) {
      return id + '_' + (index + 1).toString(); // make indexes one-based
   };
}

if (!Parameters.hasIndexed) {
   Parameters.hasIndexed = function(id, index) {
      return Parameters.has(Parameters.indexedId(id, index));
   };
}

if (!Parameters.setIndexed) {
   Parameters.setIndexed = function(id, index, value) {
      return Parameters.set(Parameters.indexedId(id, index), value);
   };
}

if (!Parameters.getStringIndexed) {
   Parameters.getStringIndexed = function(id, index) {
      return Parameters.getString(Parameters.indexedId(id, index));
   };
}

// Static methods for core Console object.
if (!Console.beginLog) {
   Console.beginLog = function() {
   };
}

if (!Console.endLog) {
   Console.endLog = function() {
      return ByteArray.stringToUTF8("Console log not available.");
   };
}

if (!Console.logText) {
   Console.logText = function() {
      return ByteArray.stringToUTF8("Console log not available.");
   };
}

// Dynamic methods for core Control object.
#iflt __PI_BUILD__ 1168
if (!Control.prototype.displayPixelRatio) {
   Control.prototype.displayPixelRatio = 1;
}
#endif

#iflt __PI_BUILD__ 1168
if (!Control.prototype.resourcePixelRatio) {
   Control.prototype.resourcePixelRatio = 1;
}
#endif

if (!Control.prototype.logicalPixelsToPhysical) {
   Control.prototype.logicalPixelsToPhysical = function(s) {
      return Math.round(s);
   };
}

if (!Control.prototype.setScaledFixedSize) {
   Control.prototype.setScaledFixedSize = function(w, h) {
      this.setFixedSize(w, h);
   };
}

if (!Control.prototype.setScaledMinSize) {
   Control.prototype.setScaledMinSize = function(w, h) {
      this.setMinSize(w, h);
   };
}

if (!Control.prototype.setScaledMinWidth) {
   Control.prototype.setScaledMinWidth = function(w) {
      this.setMinWidth(w);
   };
}

if (!Control.prototype.scaledResource) {
   Control.prototype.scaledResource = function(r) {
      return r;
   };
}

if (!Control.prototype.scaledStyleSheet) {
   Control.prototype.scaledStyleSheet = function(s) {
      return s;
   };
}

// Dynamic methods for core Sizer object.
if (!Sizer.prototype.addUnscaledSpacing) {
   Sizer.prototype.addUnscaledSpacing = function(s) {
      this.addSpacing(s);
   };
}

// ****************************************************************************
// EOF Global.js - Released 2016/12/30 00:00:00 UTC
