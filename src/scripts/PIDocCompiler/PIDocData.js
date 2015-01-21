// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// PIDocData.js - Released 2015/01/18 20:22:19 UTC
// ****************************************************************************
//
// This file is part of PixInsight Documentation Compiler Script version 1.6.1
//
// Copyright (c) 2010-2015 Pleiades Astrophoto S.L.
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

/*
 * PixInsight Documentation Compiler
 *
 * Copyright (C) 2010-2015 Pleiades Astrophoto. All Rights Reserved.
 * Written by Juan Conejero (PTeam)
 *
 * Compiler Working Data.
 */

/*
 * PIDoc Compiler Working Data
 */
function PIDocCompilerWorkingData()
{
   this.__base__ = Object;
   this.__base__();

   this.inputFiles = new Array;           // The list of input source files
   this.baseDirectory = "";               // If empty, integrate with the running platform

   this.resetCompilerOptions = function()
   {
      this.generateNewSystem = false;     // Generate a new PIDoc system on an *empty* base directory
      this.generateOutput = true;         // Generate output XHTML documents
      this.generateHTML5 = true;          // Generate HTML5 or XHTML 1.0 Strict documents
      this.renderEquations = true;        // Render LaTeX equations and inline math
      this.highlightCode = true;          // Use syntax highlighting for \code blocks
      this.numberSections = true;         // Number document sections and subsections
      this.numberAllEquations = false;    // Number equations by default
      this.numberAllFigures = true;       // Number figures by default
      this.numberAllTables = true;        // Number tables by default
      this.backupExistingFiles = false;   // Backup existing files; overwrite otherwise
      this.treatWarningsAsErrors = false; // Abort on the first warning
   };

   this.saveSettings = function()
   {
      function save( key, type, value )
      {
         Settings.write( SETTINGS_KEY_BASE + key, type, value );
      }

      save( "baseDirectory", DataType_String, this.baseDirectory );
   };

   this.loadSettings = function()
   {
      function load( key, type )
      {
         return Settings.read( SETTINGS_KEY_BASE + key, type );
      }

      let o = load( "baseDirectory", DataType_String );
      if ( o != null )
         this.baseDirectory = o;
   };

   this.resetCompilerOptions();
}

PIDocCompilerWorkingData.prototype = new Object;

/*
 * Global working data object
 */
var workingData = new PIDocCompilerWorkingData;

// ****************************************************************************
// EOF PIDocData.js - Released 2015/01/18 20:22:19 UTC
