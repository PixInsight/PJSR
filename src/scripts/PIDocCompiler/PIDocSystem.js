// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// PIDocSystem.js - Released 2015/01/18 20:22:19 UTC
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
 * PIDoc system static data and routines.
 */

function PIDocSystem()
{
   this.__base__ = Object;
   this.__base__();
}

PIDocSystem.prototype = new Object;

/*
 * PIDoc system required directories
 */
PIDocSystem.systemDirectories = function()
{
   /*
    * PIDoc system directories as of version 1.6.0.
    * N.B. Update when a new system version is released.
    */
   return [ "docs",
            "pidoc",
            "pidoc/css",
            "pidoc/graphics",
            "pidoc/icons",
            "pidoc/images",
            "pidoc/scripts",
            "pidoc/titles",
            "pjsr",
            "pjsr/objects",
            "scripts",
            "tools" ];
};

/*
 * PIDoc system validation
 */
PIDocSystem.isValidSystem = function( baseDir )
{
   let sysDirs = PIDocSystem.systemDirectories();
   for ( let i = 0; i < sysDirs.length; ++i )
      if ( !File.directoryExists( baseDir + '/' + sysDirs[i] ) )
         return false;
   return true;
};

/*
 * PIDoc system generation
 */
PIDocSystem.generateNewSystem = function( baseDir )
{
   function isEmptyDirectory( dir )
   {
      let f = new FileFind;
      if ( f.begin( dir + "/*" ) )
         do
            if ( f.name != "." && f.name != ".." )
            {
               f.end();
               return false;
            }
         while( f.next() );
      return true;
   }

   function copyFiles( targetDir, sourceDir, patterns )
   {
      let f = new FileFind;
      for ( let i = 0; i < patterns.length; ++i )
         if ( f.begin( sourceDir + '/' + patterns[i] ) )
            do
               if ( f.isFile )
                  File.copyFile( targetDir + '/' + f.name, sourceDir + '/' + f.name );
            while( f.next() );
   }

   document.actionMessage( "Generating PIDoc system..." );

   baseDir = baseDir.trim();
   if ( baseDir.isEmpty() )
      throw new Error( "Missing target system directory." + baseDir );
   if ( baseDir == '/'
#ifeq __PI_PLATFORM__ MSWINDOWS // Windows drive letters
        || baseDir.length >= 3 && baseDir[baseDir.length-2] == ':' && baseDir.endsWith( '/' )
#endif
      )
      throw new Error( "Attempt to generate a PIDoc system on the root directory." + baseDir );
   if ( baseDir.endsWith( '/' ) )
      baseDir = baseDir.substring( 0, baseDir.length-1 );
   if ( !File.directoryExists( baseDir ) )
      throw new Error( "The target system directory does not exist: " + baseDir );
   if ( !isEmptyDirectory( baseDir ) )
      throw new Error( "Cannot create a new PIDoc system because the target directory is not empty: " + baseDir );

   let sysDir = getEnvironmentVariable( "PXI_DOCDIR" );
   if ( sysDir.isEmpty() )
      throw new Error( "Unable to retrieve the platform documentation system directory." );
   if ( !File.directoryExists( sysDir ) )
      throw new Error( "The platform documentation system directory does not exist: " + sysDir );

   let sysDirs = PIDocSystem.systemDirectories();
   for ( let i = 0; i < sysDirs.length; ++i )
      File.createDirectory( baseDir + '/' + sysDirs[i] );

   copyFiles( baseDir + "/pidoc/css",      sysDir + "/pidoc/css",      ["*.css"                  ] );
   copyFiles( baseDir + "/pidoc/graphics", sysDir + "/pidoc/graphics", ["*.png", "*.svg"         ] );
   copyFiles( baseDir + "/pidoc/icons",    sysDir + "/pidoc/icons",    ["*.png", "*.svg"         ] );
   copyFiles( baseDir + "/pidoc/images",   sysDir + "/pidoc/images",   ["*.png", "*.svg", "*.jpg"] );
   copyFiles( baseDir + "/pidoc/scripts",  sysDir + "/pidoc/scripts",  ["*.js"                   ] );
   copyFiles( baseDir + "/pidoc/titles",   sysDir + "/pidoc/titles",   ["*.png", "*.svg"         ] );

   document.message( "New PIDoc system generated: " + baseDir );
};

// ****************************************************************************
// EOF PIDocSystem.js - Released 2015/01/18 20:22:19 UTC
