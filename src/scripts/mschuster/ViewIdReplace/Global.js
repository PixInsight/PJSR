// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// Global.js - Released 2017/01/15 00:00:00 UTC
// ****************************************************************************
//
// This file is part of ViewIdReplace Script Version 1.4
//
// Copyright (C) 2012-2017 Mike Schuster. All Rights Reserved.
// Copyright (C) 2003-2017 Pleiades Astrophoto S.L. All Rights Reserved.
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

// Throws an error if assertion does not hold.
function assert(assertion, message) {
   if (!assertion) {
      throw new Error("Assertion failed: " + message);
   }
}

// Filters a view id to match ^[_a-zA-Z][_a-zA-Z0-9]*$ by replacing invalid
// characters by "_".
function filterViewId(viewId) {
   return viewId.trim() == "" ?
      "_" :
      viewId.trim().replace(/[^_a-zA-Z0-9]/g, '_').replace(/^[^_a-zA-Z]/, '_');
}

// Dynamic methods for core Control object.
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

if (!Control.prototype.scaledResource) {
   Control.prototype.scaledResource = function(r) {
      return r;
   };
}

// Dynamic methods for core Sizer object.
if (!Sizer.prototype.addUnscaledSpacing) {
   Sizer.prototype.addUnscaledSpacing = function(s) {
      this.addSpacing(s);
   };
}

// ****************************************************************************
// EOF Global.js - Released 2017/01/15 00:00:00 UTC
