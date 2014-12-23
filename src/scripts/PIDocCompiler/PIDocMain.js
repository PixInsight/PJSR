// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// PIDocMain.js - Released 2014/12/09 21:37:52 UTC
// ****************************************************************************
//
// This file is part of PixInsight Documentation Compiler Script version 1.5.4
//
// Copyright (c) 2010-2014 Pleiades Astrophoto S.L.
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
 * Copyright (C) 2010-2014 Pleiades Astrophoto. All Rights Reserved.
 * Written by Juan Conejero (PTeam)
 *
 * Compiler entry point.
 */

#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>

function main()
{
   workingData.loadSettings();

   /*
    * Command-line mode
    */
   if ( jsArguments.length > 0 )
   {
      for ( var i in jsArguments )
      {
         console.writeln( "<end><cbr>" );

         var arg = jsArguments[i];
         if ( arg[0] == '-' )
         {
            switch ( arg )
            {
            case "--generate":
               workingData.generateOutput = true;
               break;
            case "--no-generate":
               workingData.generateOutput = false;
               break;

            case "--render-equations":
               workingData.renderEquations = true;
               break;
            case "--no-render-equations":
               workingData.renderEquations = false;
               break;

            case "--code-highlighting":
               workingData.highlightCode = true;
               break;
            case "--no-code-highlighting":
               workingData.highlightCode = false;
               break;

            case "--number-equations":
               workingData.numberAllEquations = true;
               break;
            case "--no-number-equations":
               workingData.numberAllEquations = false;
               break;

            case "--number-figures":
               workingData.numberAllFigures = true;
               break;
            case "--no-number-figures":
               workingData.numberAllFigures = false;
               break;

            case "--number-tables":
               workingData.numberAllTables = true;
               break;
            case "--no-number-tables":
               workingData.numberAllTables = false;
               break;

            case "--backup":
               workingData.backupExistingFiles = true;
               break;
            case "--no-backup":
               workingData.backupExistingFiles = false;
               break;

            case "--warnings-as-errors":
               workingData.treatWarningsAsErrors = true;
               break;
            case "--no-warnings-as-errors":
               workingData.treatWarningsAsErrors = false;
               break;

            case "--version":
               console.writeln( TITLE + " version " + VERSION );
               return 0;

            default:
               console.criticalln( "<end><cbr><raw>*** Error: Unknown argument \'" + arg + "\'</raw>" );
               return -1;
            }
         }
         else
         {
            if ( workingData.generateNewSystem )
               PIDocSystem.generateNewSystem( workingData.baseDirectory );

            var filePath = arg.trim();
            if ( filePath.beginsWith( '\"' ) )
               filePath = filePath.slice( 1 );
            if ( filePath.endsWith( '\"' ) )
               filePath = filePath.substring( 0, filePath.length-1 );
            if ( !filePath.isEmpty() )
            {
               try
               {
                  (new PIDocCompiler).compile( filePath );
                  if ( workingData.generateOutput )
                     if ( document.hasXhtmlDocument() )
                        document.writeXhtmlDocument();
                  console.noteln( format( "<end><cbr><br>* Compiled successfully with %u warning(s)", document.warningCount ) );
                  gc();
               }
               catch ( x )
               {
                  if ( x instanceof ParseError )
                  {
                     console.criticalln( "<end><cbr><raw>" + x.toString() + "</raw>" );
                     return -1;
                  }
                  else
                     throw x;
               }
            }
         }
      }

      return 0;
   }

   /*
    * GUI mode
    */
   var dialog = new PIDocCompilerDialog();
   for ( ;; )
   {
      console.hide();

      if ( dialog.execute() )
      {
         if ( workingData.generateNewSystem )
         {
            try
            {
               PIDocSystem.generateNewSystem( workingData.baseDirectory );
               (new MessageBox( "<p>A new PIDoc system has been created on the specified target directory:</p>" +
                                "<p>" + workingData.baseDirectory + "</p>",
                                TITLE, StdIcon_Information, StdButton_Ok )).execute();
            }
            catch ( x )
            {
               (new MessageBox( x.toString(), TITLE, StdIcon_Error, StdButton_Ok )).execute();
               continue;
            }

            if ( workingData.inputFiles.length == 0 )
               continue;
         }

         if ( workingData.inputFiles.length == 0 )
         {
            (new MessageBox( "No input files have been specified!",
                             TITLE, StdIcon_Error, StdButton_Ok )).execute();
            continue;
         }

         document.noBackups = !workingData.backupExistingFiles;
         document.abortOnWarning = workingData.treatWarningsAsErrors;

         console.show();
         console.abortEnabled = true;

         var success = 0;
         var warnings = 0;

         for ( var i in workingData.inputFiles )
         {
            try
            {
               var P = new PIDocCompiler;
               P.compile( workingData.inputFiles[i] );

               if ( workingData.generateOutput )
                  if ( document.hasXhtmlDocument() )
                     document.writeXhtmlDocument();

               ++success;
               warnings += document.warningCount;

               gc();
            }
            catch ( x )
            {
               if ( x instanceof ParseError )
                  console.criticalln( "<end><cbr><raw>" + x.toString() + "</raw>" );
               else
                  throw x;
            }
         }

         console.noteln( format(
            "<end><cbr><br>===== PIDocCompiler: %u succeeded, %u failed, %u warning(s) =====",
            success, workingData.inputFiles.length-success, warnings ) );
         console.writeln();
         console.flush();

         workingData.saveSettings();

         if ( (new MessageBox( "Do you want to perform another compilation ?",
              TITLE, StdIcon_Question, StdButton_Yes, StdButton_No )).execute() == StdButton_Yes )
            continue;
      }

      break;
   }
}

// ****************************************************************************
// EOF PIDocMain.js - Released 2014/12/09 21:37:52 UTC
