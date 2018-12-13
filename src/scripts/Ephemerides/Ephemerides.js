// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// Ephemerides.js - Released 2018-12-13T19:24:09Z
// ----------------------------------------------------------------------------
//
// This file is part of Ephemerides Script version 1.0
//
// Copyright (c) 2017-2018 Pleiades Astrophoto S.L.
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
 * An ephemeris generation script.
 *
 * Copyright (C) 2017-2018 Pleiades Astrophoto. All Rights Reserved.
 * Written by Juan Conejero (PTeam)
 */

#feature-id    Ephemerides > Ephemerides

#feature-info  A script for calculation of ephemerides of solar system bodies \
               and stars.<br/>\
               <br/>\
               Written by Juan Conejero (PTeam)<br/>\
               Copyright &copy; 2017-2018 Pleiades Astrophoto, S.L.

#iflt __PI_BUILD__ 1437
#error This script requires PixInsight version 1.8.6 or higher.
#endif

#define VERSION "1.0"
#define TITLE   "Ephemerides"

#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>

#include "EphemerisDialog.js"
#include "EphemerisEngine.js"

// ----------------------------------------------------------------------------

function main()
{
   console.hide();

   let engine = new EphemerisEngine;
   engine.load();

   let dialog = new EphemerisDialog( engine );

   for ( ;; )
   {
      if ( !dialog.execute() )
      {
         if ( (new MessageBox( "Do you really want to exit the " + TITLE + " script?",
              TITLE, StdIcon_Question, StdButton_No, StdButton_Yes )).execute() == StdButton_Yes )
            break;
         continue;
      }
      processEvents();
      gc();
   }
}

main();

// ----------------------------------------------------------------------------
// EOF Ephemerides.js - Released 2018-12-13T19:24:09Z
