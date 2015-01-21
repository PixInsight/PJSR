// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// pidoc.js - Released 2015/01/18 20:22:19 UTC
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
 * Executable file.
 */

#feature-id    Development > Documentation Compiler

#feature-info  PixInsight Documentation Compiler. This script parses a PIDoc source file and generates an \
   HTML5/XHTML document integrated with a target PixInsight reference documentation system.<br/>\
   <br/>\
   PIDoc is a powerful markup language to generate PixInsight documentation easily and efficiently. \
   By writing their documentation in the PIDoc language, developers on the PixInsight platform can concentrate \
   exclusively on documentation contents, without having to think on the appearance of their documents. The \
   documentation compiler automatically generates correctly structured and organized documents that integrate \
   seamlessly with the PixInsight reference documentation system.<br/>\
   <br/>\
   Written by Juan Conejero (PTeam)<br/>\
   Copyright &copy; 2010-2015 Pleiades Astrophoto, S.L.

#feature-icon  pidoc.xpm

#include "PIDocGlobal.js"
#include "PIDocData.js"
#include "PIDocSystem.js"
#include "PIDocDocument.js"
#include "PIDocSyntaxHighlighters.js"
#include "PIDocCommands.js"
#include "PIDocCompiler.js"
#include "PIDocGUI.js"
#include "PIDocMain.js"

main();

// ****************************************************************************
// EOF pidoc.js - Released 2015/01/18 20:22:19 UTC
