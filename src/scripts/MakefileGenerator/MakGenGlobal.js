// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// MakGenGlobal.js - Released 2017-04-14T16:45:58Z
// ----------------------------------------------------------------------------
//
// This file is part of PixInsight Makefile Generator Script version 1.104
//
// Copyright (c) 2009-2017 Pleiades Astrophoto S.L.
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
 * PixInsight Makefile Generator
 *
 * Automatic generation of PCL makefiles and projects for FreeBSD, Linux,
 * Mac OS X and Windows platforms.
 *
 * Copyright (c) 2009-2017, Pleiades Astrophoto S.L. All Rights Reserved.
 * Written by Juan Conejero (PTeam)
 *
 * Global variables and definitions.
 */

#define VERSION "1.104"
#define TITLE   "Makefile Generator"

/*
 * Default GCC versions
 * Set these to empty strings to use the system GCC compiler
 */
#define DEFAULT_GCC_VERSION_SUFFIX_LINUX ""
#define DEFAULT_GCC_VERSION_SUFFIX_HOST  "-4.9.1" // core version 1.8.5

/*
 * Default OS X sysroot SDK version
 */
#define DEFAULT_OSX_SDK_VERSION "10.12"

/*
 * - PixInsight Core 1.7.x Starbuck uses the SpiderMonkey engine version 1.8.5
 * - PixInsight Core 1.8.0 Ripley uses the SpiderMonkey engine 17.0
 * - PixInsight Core 1.8.1+ Ripley uses the SpiderMonkey engine 24.2
 */
#iflt __PI_VERSION__ 01.08.00
#define CORE_JS_ENGINE_VERSION "185"
#else
#define CORE_JS_ENGINE_VERSION "-24"
#endif

/*
 * PixInsight/PCL build environment
 * All variables are mandatory since PCL 1.0.73
 */
#ifeq __PI_PLATFORM__ MSWINDOWS
var PCLDIR      = File.windowsPathToUnix( getEnvironmentVariable( "PCLDIR" ) );
var PCLSRCDIR   = File.windowsPathToUnix( getEnvironmentVariable( "PCLSRCDIR" ) );
var PCLINCDIR   = File.windowsPathToUnix( getEnvironmentVariable( "PCLINCDIR" ) );
var PCLLIBDIR32 = File.windowsPathToUnix( getEnvironmentVariable( "PCLLIBDIR32" ) );
var PCLLIBDIR64 = File.windowsPathToUnix( getEnvironmentVariable( "PCLLIBDIR64" ) );
var PCLBINDIR32 = File.windowsPathToUnix( getEnvironmentVariable( "PCLBINDIR32" ) );
var PCLBINDIR64 = File.windowsPathToUnix( getEnvironmentVariable( "PCLBINDIR64" ) );
#else
var PCLDIR      = getEnvironmentVariable( "PCLDIR" );
var PCLSRCDIR   = getEnvironmentVariable( "PCLSRCDIR" );
var PCLINCDIR   = getEnvironmentVariable( "PCLINCDIR" );
var PCLLIBDIR32 = getEnvironmentVariable( "PCLLIBDIR32" );
var PCLLIBDIR64 = getEnvironmentVariable( "PCLLIBDIR64" );
var PCLBINDIR32 = getEnvironmentVariable( "PCLBINDIR32" );
var PCLBINDIR64 = getEnvironmentVariable( "PCLBINDIR64" );
#endif

/*
 * Input file types
 */
var sourceFileExtensions =
[ ".cpp", ".c", ".cxx", ".mm" ];
var headerFileExtensions =
[ ".h", ".hpp", ".hxx" ];
var resourceFileExtensions =
[ ".rc", ".rc2", ".resx" ];
var imageFileExtensions =
[ ".png", ".svg", ".bmp", ".jpg", ".jpeg", ".tif", ".tiff" ];

/*
 * Dialog selections
 */

// Project types
#define TYPE_MODULE              0
#define TYPE_DYNAMIC_LIBRARY     1
#define TYPE_STATIC_LIBRARY      2
#define TYPE_EXECUTABLE          3
#define TYPE_PCL                 4
#define TYPE_CORE                5
#define TYPE_CORE_AUX            6
#define TYPE_STANDARD_MODULES    7
#define TYPE_PLATFORM            8

// Platforms
#define PLATFORM_FREEBSD         0
#define PLATFORM_LINUX           1
#define PLATFORM_MACOSX          2
#define PLATFORM_WINDOWS         3
#define PLATFORM_HOST            4

// Architectures
#define ARCH_X86                 0
#define ARCH_X64                 1

// GCC optimizations
#define OPTIMIZATION_O0          0
#define OPTIMIZATION_O1          1
#define OPTIMIZATION_O2          2
#define OPTIMIZATION_O3          3
#define OPTIMIZATION_Os          4
#define OPTIMIZATION_Ofast       5
#define OPTIMIZATION_DEFAULT     OPTIMIZATION_O3
#define OPTIMIZATION_DEFAULT_STR "3"

// ----------------------------------------------------------------------------
// EOF MakGenGlobal.js - Released 2017-04-14T16:45:58Z
