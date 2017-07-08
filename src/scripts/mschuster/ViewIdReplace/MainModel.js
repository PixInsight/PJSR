// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// MainModel.js - Released 2017/01/15 00:00:00 UTC
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

function MainModel() {
   // Pattern, can be a string or a regular expression as a string.
   this.patternDefault = "";
   this.pattern = this.patternDefault;

   // Replacement, a string.
   this.replacementDefault = "";
   this.replacement = this.replacementDefault;

   // Gives string if well defined, otherwise a default.
   this.defaultString = function(str, def) {
      return str != null ? str : def;
   }

   // Loads core settings.
   this.loadSettings = function() {
      this.pattern = this.defaultString(
         Settings.read("pattern", DataType_String8), this.patternDefault
      );
      this.replacement = this.defaultString(
         Settings.read("replacement", DataType_String8), this.replacementDefault
      );
   };

   // Stores core settings.
   this.storeSettings = function() {
      Settings.write("pattern", DataType_String8, this.pattern);
      Settings.write("replacement", DataType_String8, this.replacement);
   };

   // Loads instance parameters.
   this.loadParameters = function() {
      if (Parameters.has("pattern")) {
         this.pattern = this.defaultString(
            Parameters.getString("pattern"), this.patternDefault
         );
      }
      if (Parameters.has("replacement")) {
         this.replacement = this.defaultString(
            Parameters.getString("replacement"), this.replacementDefault
         );
      }
   };

   // Stores instance parameters.
   this.storeParameters = function() {
      Parameters.clear();

      Parameters.set("version", VERSION);

      if (coreVersionBuild < 1205) {
         Parameters.set("pattern", this.pattern.replace(/\$/g, "\\$"));
         Parameters.set("replacement", this.replacement.replace(/\$/g, "\\$"));
      }
      else {
         Parameters.set("pattern", this.pattern);
         Parameters.set("replacement", this.replacement);
      }
   };

   // Clears the model.
   this.clear = function() {
   };
}

// ****************************************************************************
// EOF MainModel.js - Released 2017/01/15 00:00:00 UTC
