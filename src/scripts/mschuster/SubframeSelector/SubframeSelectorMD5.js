// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// SubframeSelectorMD5.js - Released 2016/04/06 00:00:00 UTC
// ****************************************************************************
//
// This file is part of SubframeSelector Script version 1.5
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

var MD5HexChar = "0123456789abcdef".split("");

function MD5HexCode(n) {
   var s = "";
   for(var j = 0; j != 4; ++j) {
      s +=
         MD5HexChar[(n >> (j * 8 + 4)) & 0x0f] +
         MD5HexChar[(n >> (j * 8)) & 0x0f];
   }
   return s;
}

function MD5Hex(x) {
   var y = [];
   for (var i = 0; i != x.length; ++i) {
      y.push(MD5HexCode(x[i]));
   }
   return y.join("");
}

function MD5Add32(a, b) {
   return (a + b) & 0xffffffff;
}

function MD5F(a, b, c, d, x, s, t) {
   var p = a + ((b & c) | ((~b) & d)) + x + t;
   return ((p << s) | (p >>> (32 - s))) + b;
}

function MD5G(a, b, c, d, x, s, t) {
   var p = a + ((b & d) | (c & (~d))) + x + t;
   return ((p << s) | (p >>> (32 - s))) + b;
}

function MD5H(a, b, c, d, x, s, t) {
   var p = a + (b ^ c ^ d) + x + t;
   return ((p << s) | (p >>> (32 - s))) + b;
}

function MD5I(a, b, c, d, x, s, t) {
   var p = a + (c ^ (b | (~d))) + x + t;
   return ((p << s) | (p >>> (32 - s))) + b;
}

function MD5Cycle(x, k) {
   var a = x[0];
   var b = x[1];
   var c = x[2];
   var d = x[3];

   a = MD5F(a, b, c, d, k[0], 7, -680876936);
   d = MD5F(d, a, b, c, k[1], 12, -389564586);
   c = MD5F(c, d, a, b, k[2], 17,  606105819);
   b = MD5F(b, c, d, a, k[3], 22, -1044525330);
   a = MD5F(a, b, c, d, k[4], 7, -176418897);
   d = MD5F(d, a, b, c, k[5], 12,  1200080426);
   c = MD5F(c, d, a, b, k[6], 17, -1473231341);
   b = MD5F(b, c, d, a, k[7], 22, -45705983);
   a = MD5F(a, b, c, d, k[8], 7,  1770035416);
   d = MD5F(d, a, b, c, k[9], 12, -1958414417);
   c = MD5F(c, d, a, b, k[10], 17, -42063);
   b = MD5F(b, c, d, a, k[11], 22, -1990404162);
   a = MD5F(a, b, c, d, k[12], 7,  1804603682);
   d = MD5F(d, a, b, c, k[13], 12, -40341101);
   c = MD5F(c, d, a, b, k[14], 17, -1502002290);
   b = MD5F(b, c, d, a, k[15], 22,  1236535329);

   a = MD5G(a, b, c, d, k[1], 5, -165796510);
   d = MD5G(d, a, b, c, k[6], 9, -1069501632);
   c = MD5G(c, d, a, b, k[11], 14,  643717713);
   b = MD5G(b, c, d, a, k[0], 20, -373897302);
   a = MD5G(a, b, c, d, k[5], 5, -701558691);
   d = MD5G(d, a, b, c, k[10], 9,  38016083);
   c = MD5G(c, d, a, b, k[15], 14, -660478335);
   b = MD5G(b, c, d, a, k[4], 20, -405537848);
   a = MD5G(a, b, c, d, k[9], 5,  568446438);
   d = MD5G(d, a, b, c, k[14], 9, -1019803690);
   c = MD5G(c, d, a, b, k[3], 14, -187363961);
   b = MD5G(b, c, d, a, k[8], 20,  1163531501);
   a = MD5G(a, b, c, d, k[13], 5, -1444681467);
   d = MD5G(d, a, b, c, k[2], 9, -51403784);
   c = MD5G(c, d, a, b, k[7], 14,  1735328473);
   b = MD5G(b, c, d, a, k[12], 20, -1926607734);

   a = MD5H(a, b, c, d, k[5], 4, -378558);
   d = MD5H(d, a, b, c, k[8], 11, -2022574463);
   c = MD5H(c, d, a, b, k[11], 16,  1839030562);
   b = MD5H(b, c, d, a, k[14], 23, -35309556);
   a = MD5H(a, b, c, d, k[1], 4, -1530992060);
   d = MD5H(d, a, b, c, k[4], 11,  1272893353);
   c = MD5H(c, d, a, b, k[7], 16, -155497632);
   b = MD5H(b, c, d, a, k[10], 23, -1094730640);
   a = MD5H(a, b, c, d, k[13], 4,  681279174);
   d = MD5H(d, a, b, c, k[0], 11, -358537222);
   c = MD5H(c, d, a, b, k[3], 16, -722521979);
   b = MD5H(b, c, d, a, k[6], 23,  76029189);
   a = MD5H(a, b, c, d, k[9], 4, -640364487);
   d = MD5H(d, a, b, c, k[12], 11, -421815835);
   c = MD5H(c, d, a, b, k[15], 16,  530742520);
   b = MD5H(b, c, d, a, k[2], 23, -995338651);

   a = MD5I(a, b, c, d, k[0], 6, -198630844);
   d = MD5I(d, a, b, c, k[7], 10,  1126891415);
   c = MD5I(c, d, a, b, k[14], 15, -1416354905);
   b = MD5I(b, c, d, a, k[5], 21, -57434055);
   a = MD5I(a, b, c, d, k[12], 6,  1700485571);
   d = MD5I(d, a, b, c, k[3], 10, -1894986606);
   c = MD5I(c, d, a, b, k[10], 15, -1051523);
   b = MD5I(b, c, d, a, k[1], 21, -2054922799);
   a = MD5I(a, b, c, d, k[8], 6,  1873313359);
   d = MD5I(d, a, b, c, k[15], 10, -30611744);
   c = MD5I(c, d, a, b, k[6], 15, -1560198380);
   b = MD5I(b, c, d, a, k[13], 21,  1309151649);
   a = MD5I(a, b, c, d, k[4], 6, -145523070);
   d = MD5I(d, a, b, c, k[11], 10, -1120210379);
   c = MD5I(c, d, a, b, k[2], 15,  718787259);
   b = MD5I(b, c, d, a, k[9], 21, -343485551);

   x[0] = MD5Add32(a, x[0]);
   x[1] = MD5Add32(b, x[1]);
   x[2] = MD5Add32(c, x[2]);
   x[3] = MD5Add32(d, x[3]);
}

function MD5Block(s, j) {
   var block = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
   for (var i = 0; i != 64; i += 4) {
      block[i >> 2] =
         s.at(j + i) +
         (s.at(j + i + 1) << 8) +
         (s.at(j + i + 2) << 16) +
         (s.at(j + i + 3) << 24);
   }
   return block;
}

function MD5Initialize() {
   var state = [1732584193, -271733879, -1732584194, 271733878];
   var s = new ByteArray;
   var l = 0;
   return [state, s, l];
}

function MD5Append(c, postfix) {
   var state = c[0];
   var s = c[1];
   var l = c[2] + postfix.length;
   s.add(postfix);
   var n = s.length;
   var i = 64;
   for (; i <= n; i += 64) {
      MD5Cycle(state, MD5Block(s, i - 64));
   }

   var m = n - (i - 64);
   if (s.length != 0) {
      s.remove(0, s.length - m);
   }
   return [state, s, l];
}

function MD5AppendByteArray(c, bytearray) {
   return MD5Append(c, bytearray);
}

function MD5AppendString(c, string) {
   return MD5Append(c, string);
}

function MD5AppendFile(c, file_path) {
   var file = new File;
   file.openForReading(file_path);
   var length = 1024 * 1024;
   for (var j = 0; j < file.size; j += length) {
      var byteArray = file.read(
         DataType_ByteArray,
         Math.min(file.size - file.position, length)
      );
      c = MD5AppendByteArray(c, byteArray);
   }
   file.close();
   return c;
}

function MD5AppendFileMaxBytes(c, file_path, max_bytes) {
   var file = new File;
   file.openForReading(file_path);
   if (file.size <= max_bytes + 16) {
      var length = 1024 * 1024;
      for (var j = 0; j < file.size; j += length) {
         var byteArray = file.read(
            DataType_ByteArray,
            Math.min(file.size - file.position, length)
         );
         c = MD5AppendByteArray(c, byteArray);
      }
   }
   else {
      var length = Math.ceil(max_bytes / 3);
      var offset = Math.ceil((file.size - max_bytes) / 2);
      for (var i = 0; i != 3; ++i) {
         var byteArray = file.read(
            DataType_ByteArray,
            Math.min(file.size - file.position, length)
         );
         c = MD5AppendByteArray(c, byteArray);
         file.seek(Math.min(file.size - file.position, offset), 1);
      }
   }
   file.close();
   return c;
}

function MD5Finalize(c) {
   var state = c[0];
   var s = c[1];
   var l = c[2];
   var n = s.length;
   var i = 64;

   var m = n - (i - 64);
   var block = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
   var j = 0;
   for (; j != m; ++j) {
      block[j >> 2] |= s.at(i - 64 + j) << ((j & 0x0f) << 3);
   }
   block[j >> 2] |= 0x80 << ((j & 0x0f) << 3);

   if (j > 55) {
      MD5Cycle(state, block);
      block = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
   }
   block[14] = (8 * l) & 0xffffffff;
   block[15] = Math.floor((8 * l) / 4294967296) & 0xffffffff;
   MD5Cycle(state, block);

   return state;
}

function MD5String(s) {
   var c = MD5Initialize();
   c = MD5AppendString(c, s);
   return MD5Finalize(c);
}

function MD5ByteArray(s) {
   var c = MD5Initialize();
   c = MD5AppendByteArray(c, s);
   return MD5Finalize(c);
}

function MD5Equal(state1, state2) {
   return state1 != null && state2 != null &&
      state1[0] == state2[0] &&
      state1[1] == state2[1] &&
      state1[2] == state2[2] &&
      state1[3] == state2[3];
}

// ****************************************************************************
// EOF SubframeSelectorMD5.js - Released 2016/04/06 00:00:00 UTC
