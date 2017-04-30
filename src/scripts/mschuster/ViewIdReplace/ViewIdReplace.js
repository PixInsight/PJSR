// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// ViewIdReplace.js - Released 2017/01/15 00:00:00 UTC
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

#define TITLE "ViewIdReplace"
#define VERSION "1.4"

#feature-id Utilities > ViewIdReplace

#feature-info <b>ViewIdReplace Version 1.4</b><br/>\
   <br/>\
   Script that renames a view with some or all matches of a pattern replaced \
   by a replacement.<br/>\
   <br/>\
   Copyright &copy; 2012-2017 Mike Schuster. All Rights Reserved.<br/>\
   Copyright &copy; 2003-2017 Pleiades Astrophoto S.L. All Rights Reserved.

#include <pjsr/DataType.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/TextAlign.jsh>

#include "MainModel.js"
#include "MainViewController.js"

function main() {
   console.hide();

   var model = new MainModel();
   model.loadSettings();
   model.loadParameters();

   var controller = new MainController(model);

   var view = new MainView(model, controller);
   controller.setView(view);

   controller.execute();

   model.storeSettings();
   model.clear();
}

main();

gc();

// ****************************************************************************
// EOF ViewIdReplace.js - Released 2017/01/15 00:00:00 UTC
