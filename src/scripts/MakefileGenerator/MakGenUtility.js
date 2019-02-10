// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// MakGenUtility.js - Released 2019-01-20T14:05:16Z
// ----------------------------------------------------------------------------
//
// This file is part of PixInsight Makefile Generator Script version 1.109
//
// Copyright (c) 2009-2019 Pleiades Astrophoto S.L.
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
 * Copyright (c) 2009-2019, Pleiades Astrophoto S.L. All Rights Reserved.
 * Written by Juan Conejero (PTeam)
 *
 * Utility routines.
 */

function createDirectoryIfNotExists( dir, createIntermediateDirectories )
{
   function createDirectory( d )
   {
      if ( File.exists( d ) )
         throw new Error( "Should create a directory, but a file already exists with the same name: " + d );
      File.createDirectory( d, false );
   }

   dir = File.windowsPathToUnix( dir ); // Required on Windows, no-op on Linux/UNIX

   if ( !File.directoryExists( dir ) )
   {
      if ( createIntermediateDirectories )
         for ( let p0 = 0; ; )
         {
            let p = dir.indexOf( '/', p0 );
            if ( p < 0 )
               break;
            if ( p > 0 )
            {
               let d = dir.substring( 0, p );
               if ( !File.directoryExists( d ) )
                  createDirectory( d );
            }
            p0 = p + 1;
         }

      createDirectory( dir );

      console.noteln( "<end><cbr>* Directory created: " + dir );
      console.flush();
   }
}

/*
 * Secure directory removal routine.
 */
function removeDirectory( dirPath )
{
   function removeDirectory_recursive( dirPath, baseDir )
   {
      if ( dirPath.indexOf( ".." ) >= 0 )
         throw new Error( "removeDirectory(): Attempt to climb up the filesystem." );
      if ( dirPath.indexOf( baseDir ) != 0 )
         throw new Error( "removeDirectory(): Attempt to redirect outside the base directory." );
      if ( !File.directoryExists( dirPath ) )
         throw new Error( "removeDirectory(): Attempt to remove a nonexistent directory." );

      let currentDir = dirPath;
      if ( currentDir[currentDir.length-1] != '/' )
         currentDir += '/';

      let f = new FileFind;
      if ( f.begin( currentDir + "*" ) )
         do
         {
            let itemPath = currentDir + f.name;
            if ( f.isDirectory )
            {
               if ( f.name != "." && f.name != ".." )
               {
                  removeDirectory_recursive( itemPath, baseDir );
                  File.removeDirectory( itemPath );
               }
            }
            else
            {
               File.remove( itemPath );
            }
         }
         while ( f.next() );
   }

   if ( dirPath.indexOf( '/' ) != 0 )
      throw new Error( "removeDirectory(): Relative directory." );
   if ( !File.directoryExists( dirPath ) )
      throw new Error( "removeDirectory(): Nonexistent directory." );

   // Remove all files and subdirectories recursively
   removeDirectory_recursive( dirPath, dirPath );

   File.removeDirectory( dirPath );
}

/*
 * Returns a universally unique identifier (UUID) version 4 (truly random UUID)
 * in canonical form.
 * http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
 */
function UUID()
{
   return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace( /[xy]/g,
      function( c )
      {
         let r = Math.random()*16|0, v = (c == 'x') ? r : (r&0x3|0x8);
         return v.toString( 16 );
      } );
}

// ----------------------------------------------------------------------------
// EOF MakGenUtility.js - Released 2019-01-20T14:05:16Z
