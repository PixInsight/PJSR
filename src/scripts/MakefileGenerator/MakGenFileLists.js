// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// MakGenFileLists.js - Released 2015/11/26 08:53:10 UTC
// ----------------------------------------------------------------------------
//
// This file is part of PixInsight Makefile Generator Script version 1.100
//
// Copyright (c) 2009-2015 Pleiades Astrophoto S.L.
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
 * Copyright (c) 2009-2015, Pleiades Astrophoto S.L. All Rights Reserved.
 * Written by Juan Conejero (PTeam)
 *
 * Directory search routines.
 */

/*
 * File classification.
 *
 * - Header, resource and image file classification are invariants, so they
 *   are implemented as global functions.
 *
 * - Classification of C++, C and Objective C source code files is
 *   platform-dependent, hence, it is provided by the object who knows the
 *   platform being generated. See: GeneratorParameters.isSourceFile().
 */

function isHeaderFileExtension( e )
{
   for ( var i = 0; i < headerFileExtensions.length; ++i )
      if ( e == headerFileExtensions[i] )
         return true;
   return false;
}

function isHeaderFile( n )
{
   return isHeaderFileExtension( File.extractExtension( n ) );
}

function isResourceFileExtension( e )
{
   e = e.toLowerCase(); // for resources, use case-insensitive file extensions
   for ( var i = 0; i < resourceFileExtensions.length; ++i )
      if ( e == resourceFileExtensions[i] )
         return true;
   return false;
}

function isResourceFile( n )
{
   return isResourceFileExtension( File.extractExtension( n ) );
}

function isImageFileExtension( e )
{
   e = e.toLowerCase(); // for images, use case-insensitive file extensions
   for ( var i = 0; i < imageFileExtensions.length; ++i )
      if ( e == imageFileExtensions[i] )
         return true;
   return false;
}

function isImageFile( n )
{
   return isImageFileExtension( File.extractExtension( n ) );
}

/*
 * Item of a directory search list
 */
function DirectoryItem( d )
{
   this.directory = d;
   this.files = new Array;
   this.cppFileCount = 0;
   this.cxxFileCount = 0;
   this.cFileCount = 0;
   this.mmFileCount = 0;
   this.hFileCount = 0;
   this.resFileCount = 0;
   this.imgFileCount = 0;
   this.defFileCount = 0;

   this.addFile = function( f )
   {
      var e = File.extractExtension( f );
      if ( e == ".cpp" )
         ++this.cppFileCount;
      else if ( e == ".cxx" )
         ++this.cxxFileCount;
      else if ( e == ".c" )
         ++this.cFileCount;
      else if ( e == ".mm" )
         ++this.mmFileCount;
      else if ( isHeaderFileExtension( e ) )
         ++this.hFileCount;
      else if ( isResourceFileExtension( e ) )
         ++this.resFileCount;
      else if ( isImageFileExtension( e ) )
         ++this.imgFileCount;
      else if ( e == ".def" )
         ++this.defFileCount;
      else
         return; // ?!
      this.files.push( File.extractName( f ) + e );
   };

   this.hasSourceFiles = function()
   {
      return this.cppFileCount > 0 || this.cxxFileCount > 0 || this.cFileCount > 0;
   };

   this.hasCppSourceFiles = function()
   {
      return this.cppFileCount > 0 || this.cxxFileCount > 0;
   };

   this.hasCSourceFiles = function()
   {
      return this.cFileCount > 0;
   };

   this.hasMMSourceFiles = function()
   {
      return this.mmFileCount > 0;
   };

   this.hasHeaderFiles = function()
   {
      return this.hFileCount > 0;
   };

   this.hasResourceFiles = function()
   {
      return this.resFileCount > 0;
   };

   this.hasImageFiles = function()
   {
      return this.imgFileCount > 0;
   };

   this.hasDefFiles = function()
   {
      return this.defFileCount > 0;
   };
}

/*
 * Directory search list
 */
function FileLists( dirPath, noImages )
{
   // The base directory is the root of our project.
   this.baseDirectory = File.fullPath( dirPath );
   if ( this.baseDirectory.length == 0 )
      throw new Error( "No base directory has been specified." );
   if ( this.baseDirectory[this.baseDirectory.length-1] == '/' )
      if ( this.baseDirectory != "/" )
         this.baseDirectory.slice( this.baseDirectory.length-1, -1 );

   console.writeln( "<end><cbr><br>==> Finding files for project directory:" );
   console.writeln( this.baseDirectory );

   // Find all source, header and resource files in our base tree recursively.
   var sourceFiles = new Array;
   for ( var i = 0; i < sourceFileExtensions.length; ++i )
      sourceFiles = sourceFiles.concat( searchDirectory( this.baseDirectory + "/*" + sourceFileExtensions[i], true ) );
   for ( var i = 0; i < headerFileExtensions.length; ++i )
      sourceFiles = sourceFiles.concat( searchDirectory( this.baseDirectory + "/*" + headerFileExtensions[i], true ) );
   for ( var i = 0; i < resourceFileExtensions.length; ++i )
      sourceFiles = sourceFiles.concat( searchDirectory( this.baseDirectory + "/*" + resourceFileExtensions[i], true ) );
   if ( !noImages )
      for ( var i = 0; i < imageFileExtensions.length; ++i )
         sourceFiles = sourceFiles.concat( searchDirectory( this.baseDirectory + "/*" + imageFileExtensions[i], true ) );

   console.writeln();
   for ( var i = 0; i < sourceFiles.length; ++i )
      console.writeln( sourceFiles[i] );
   console.writeln();

   // Delete baseDirectory + separator from the beginning of all source files.
   var d = this.baseDirectory + '/';
   for ( var i = 0; i < sourceFiles.length; ++i )
   {
      if ( sourceFiles[i].indexOf( d ) != 0 )
         throw new Error( "<* Panic *> Inconsistent directory search!" );
      sourceFiles[i] = sourceFiles[i].slice( d.length, sourceFiles[i].length );
   }

   // Sort all source files to ensure that all files in a given directory are
   // contiguous in the sourceFiles array.
   sourceFiles.sort(); // ensure that the next sort will be stable
   sourceFiles.sort( new Function( "a", "b", "{ var d1 = File.extractDirectory( a ); " +
                                               "var d2 = File.extractDirectory( b ); " +
                                               "return (d1 < d2) ? -1 : ((d1 > d2) ? +1 : 0); }" ) );
   gc();

   // Build the source list.
   this.sources = new Array;
   this.sources.push( new DirectoryItem( "" ) ); // root item
   for ( var i = 0, n = 0; i < sourceFiles.length; ++i )
   {
      var d = File.extractDirectory( sourceFiles[i] );
      if ( d != this.sources[n].directory )
      {
         this.sources.push( new DirectoryItem( d ) );
         ++n;
      }

      this.sources[n].addFile( sourceFiles[i] );
   }

   // Global file counts.
   this.cppFileCount = 0;
   this.cxxFileCount = 0;
   this.cFileCount = 0;
   this.mmFileCount = 0;
   this.hFileCount = 0;
   this.resFileCount = 0;
   this.imgFileCount = 0;
   for ( var i = 0; i < this.sources.length; ++i )
   {
      this.cppFileCount += this.sources[i].cppFileCount;
      this.cxxFileCount += this.sources[i].cxxFileCount;
      this.cFileCount += this.sources[i].cFileCount;
      this.mmFileCount += this.sources[i].mmFileCount;
      this.hFileCount += this.sources[i].hFileCount;
      this.resFileCount += this.sources[i].resFileCount;
      this.imgFileCount += this.sources[i].imgFileCount;
   }

   console.writeln( format( "Source files       : %5d", this.cppFileCount + this.cxxFileCount + this.cFileCount + this.mmFileCount ) );
   console.writeln( format( "Header files       : %5d", this.hFileCount ) );
   console.writeln( format( "Resource files     : %5d", this.resFileCount ) );
if ( !noImages )
   console.writeln( format( "Image files        : %5d", this.imgFileCount ) );
   console.writeln( format( "Source directories : %5d", this.sources.length ) );
   console.flush();
}

// ----------------------------------------------------------------------------
// EOF MakGenFileLists.js - Released 2015/11/26 08:53:10 UTC
