// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// BatchStatistics.js - Released 2015/11/30 00:00:00 UTC
// ----------------------------------------------------------------------------
//
// This file is part of BatchStatistics Script version 1.2.2
//
// Copyright (C) 2014-2015 Ian Lauwerys. (www.blackwaterskies.co.uk)
//
// Based on BatchFormatConversion.js, NoiseEvaluation.js and other work.
// Copyright (c) 2009-2014 Pleiades Astrophoto S.L.
// Written by Juan Conejero (PTeam)
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
// ----------------------------------------------------------------------------

/*
   Changelog:
   1.2.2: Bug fix release
   1.2.1: Bug fix release
   1.2:   Third (full) release.
          Relocated call to dialog.updateUI to resize exit button on launch.
   1.1b:  Second (beta) release.
   1.0b:  First (beta) release.
*/

// ======== # features =========================================================

// For script feature preprocessor directives see:
// http://pixinsight.com/forum/index.php?topic=1933.0

#feature-id Batch Processing > BatchStatistics

#feature-info \
Runs statistics on a set of images and writes them to the console and\
optionally to a specified file in a variety of delimited formats:<br>\
<br/>\
V1.2 Copyright (C) 2014-2015 Ian Lauwerys

#feature-icon Batch_Statistics.png

// ========= # defines / includes ==============================================

/// Define as true for debug messages to console.
#ifndef DEBUGGING_MODE_ON
#define DEBUGGING_MODE_ON false
#endif

#define TITLE "BatchStatistics"
#define VERSION "1.2.2"
#define COMPILE_DATE "2015/11/23"

// Includes.
#include "BatchStatistics-Engine.js"   // Engine part.
#include "BatchStatistics-GUI.js"         // GUI part.

// ======== # main =============================================================

function main()
{
   if ( DEBUGGING_MODE_ON )
   {
      console.noteln( TITLE, " script started. Version: ", VERSION, " Date: ", COMPILE_DATE );
      console.noteln( "PixInsight Version: ", coreId, ", ", coreVersionBuild, ", ", coreVersionMajor,
                      ", ", coreVersionMinor, ", ", coreVersionRelease );
   }

   // Don't allow console interruption by user, must use Abort or dialog close button.
   console.show();
   console.abortEnabled = false;

   // Check which version of PI and warn if untested.
#iflt __PI_VERSION__ 01.08.03
   console.warningln( "WARNING: BatchStatistics script only tested with PixInsight 1.8.03 or later. Proceed at your own risk." );
#endif

   // Enable automatic garbage collection.
   jsAutoGC = true;

   // Instantiate object to manage statistics.
   var engine = new StatisticsEngine();
   // Instantiate object to display the user interface dialog and execute it.
   var dialog = new BatchStatisticsDialog( engine );

   if ( Parameters.isGlobalTarget || Parameters.isViewTarget )
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "Script instance - importing parameters." );
      }
      // Script was executed as script instance so import the saved parameters.
      dialog.importParameters();
      engine.importParameters();
   }
   dialog.updateUI();

   // Launch the dialog.
   if ( DEBUGGING_MODE_ON )
   {
      console.noteln( "Starting dialog." );
   }
   dialog.execute();

   if (DEBUGGING_MODE_ON)
   {
      console.noteln( TITLE, " script finished." );
   }

   console.hide();
} // main()

// ======== # execution ========================================================

main();

// ----------------------------------------------------------------------------
// EOF BatchStatistics.js - Released 2015/11/30 00:00:00 UTC
