// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// BatchPreprocessing-helper.js - Released 2017-07-04T17:05:20Z
// ----------------------------------------------------------------------------
//
// This file is part of Batch Preprocessing Script version 1.46
//
// Copyright (c) 2012 Kai Wiechen
// Copyright (c) 2012-2017 Pleiades Astrophoto S.L.
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
 * Helper routines
 */

// ----------------------------------------------------------------------------
// Extensions to the Array object
//
// NB: Define new methods of the Array object as nonenumerable properties with
//     Object.defineProperty() to prevent problems with "for...in" constructs.
// ----------------------------------------------------------------------------

/*
 * Return new array with duplicate values removed
 * Copyright 2007 - 2009 Tavs Dokkedahl
 */
if ( !Array.prototype.removeDuplicateElements )
   Object.defineProperty( Array.prototype, "removeDuplicateElements",
      {
         value : function()
         {
            var a = [];
            var l = this.length;
            for ( var i = 0; i < l; i++ )
            {
               // If this[i] is found later in the array
               for ( var j = i+1; j < l; j++ )
                  if ( this[i] === this[j] )
                     j = ++i;
               a.push( this[i] );
            }
            return a;
         },
         enumerable : false
      }
   );

/*
 * Returns true if this array contains the specified element.
 */
if ( !Array.prototype.has )
   Object.defineProperty( Array.prototype, "has",
      {
         value : function( e )
         {
            return this.indexOf( e ) > -1;
         },
         enumerable : false
      }
   );

/*
 * Returns an array of enabled target frames.
 * Used to build the input for ImageCalibration/ImageIntegration/StarAlignment
 */
if ( !Array.prototype.enableTargetFrames )
   Object.defineProperty( Array.prototype, "enableTargetFrames",
      {
         value : function( ncolumns )
         {
            var target = new Array;
            for ( var i = 0; i < this.length; ++i )
            {
               target[i] = new Array( ncolumns );
               for ( var j = 0; j < ncolumns-1; ++j )
                  target[i][j] = true;
               target[i][ncolumns-1] = this[i];
            }
            return target;
         },
         enumerable : false
      }
   );

// ----------------------------------------------------------------------------
// Extensions to the String object
// ----------------------------------------------------------------------------

/*
 * Returns a copy of this string with all whitespace characters removed at both
 * ends of the string.
 *
 * *** Part of ECMA-262.5 - Available in PJSR Core since build 702.
 */
if ( !String.prototype.trim )
   String.prototype.trim = function()
   {
      return this.replace( /^\s*|\s*$/g, '' );
   };

/*
 * Returns a copy of this string with all leading whitespace characters removed.
 *
 * *** Part of ECMA-262.5 - Available in PJSR Core since build 702.
 */
if ( !String.prototype.trimLeft )
   String.prototype.trimLeft = function()
   {
      return this.replace( /^\s*/g, '' );
   };

/*
 * Returns a copy of this string with all trailing whitespace characters removed.
 *
 * *** Part of ECMA-262.5 - Available in PJSR Core since build 702.
 */
if ( !String.prototype.trimRight )
   String.prototype.trimRight = function()
   {
      return this.replace( /\s*$/g, '' );
   };

/*
 * Returns true if this string is empty.
 */
//if ( !String.prototype.isEmpty ) // ### FIXME: Doesn't work if uncommented... why?!
   String.prototype.isEmpty = function()
   {
      return this.length <= 0;
   };

/*
 * Returns true if this string contains the specified substring.
 */
if ( !String.prototype.has )
   String.prototype.has = function( s )
   {
      return this.indexOf( s ) > -1;
   };

/*
 * Returns true if this string begins with the specified substring.
 */
if ( !String.prototype.beginsWith )
   String.prototype.beginsWith = function( s )
   {
      return this.indexOf( s ) == 0;
   };

/*
 * Returns true if this string ends with the specified substring.
 */
if ( !String.prototype.endsWith )
   String.prototype.endsWith = function( s )
   {
      var pos = this.lastIndexOf( s );
      return pos >= 0 && pos == this.length - s.length;
   };

/*
 * Returns the Boolean value represented by this string, or undefined if this
 * string does not contain a valid literal representation of a Boolean value.
 */
if ( !String.prototype.toBoolean )
   String.prototype.toBoolean = function()
   {
      switch ( this.toLowerCase() )
      {
      case "true":
         return true;
      case "false":
         return false;
      default:
         return undefined;
      }
   };

// ----------------------------------------------------------------------------
// Extensions to the File object
// ----------------------------------------------------------------------------

/*
 * Creates a directory if it does not exist.
 * Returns the directory path.
 */
if ( !File.existingDirectory )
   File.existingDirectory = function( dir )
   {
      if ( !File.directoryExists( dir ) )
         File.createDirectory( dir );
      return dir;
   };

/*
 * Returns the name and extension components of a path specification.
 */
if ( !File.extractNameAndExtension )
   File.extractNameAndExtension = function( path )
   {
      return File.extractName( path ) + File.extractExtension( path );
   };

/*
 * Loads all FITS keywords from the first HDU of the specified FITS file and
 * returns them as an array.
 */
if ( !File.loadFITSKeywords )
   File.loadFITSKeywords = function( filePath )
   {
      function searchCommentSeparator( b )
      {
         var inString = false;
         for ( var i = 9; i < 80; ++i )
            switch ( b.at( i ) )
            {
            case 39: // single quote
               inString ^= true;
               break;
            case 47: // slash
               if ( !inString )
                  return i;
               break;
            }
         return -1;
      }

      var f = new File;
      f.openForReading( filePath );

      var keywords = new Array;
      for ( ;; )
      {
         var rawData = f.read( DataType_ByteArray, 80 );

         var name = rawData.toString( 0, 8 );
         if ( name.toUpperCase() == "END     " ) // end of HDU keyword list?
            break;

         if ( f.isEOF )
            throw new Error( "Unexpected end of file: " + filePath );

         var value;
         var comment;
         if ( rawData.at( 8 ) == 61 ) // value separator (an equal sign at byte 8) present?
         {
            // This is a valued keyword
            var cmtPos = searchCommentSeparator( rawData ); // find comment separator slash
            if ( cmtPos < 0 ) // no comment separator?
               cmtPos = 80;
            value = rawData.toString( 9, cmtPos-9 ); // value substring
            if ( cmtPos < 80 )
               comment = rawData.toString( cmtPos+1, 80-cmtPos-1 ); // comment substring
            else
               comment = new String;
         }
         else
         {
            // No value in this keyword
            value = new String;
            comment = rawData.toString( 8, 80-8 );
         }

         // Perform a naive sanity check: a valid FITS file must begin with a SIMPLE=T keyword.
         if ( keywords.length == 0 )
            if ( name != "SIMPLE  " && value.trim() != 'T' )
               throw new Error( "File does not seem a valid FITS file: " + filePath );

         // Add new keyword. Note: use FITSKeyword with PI >= 1.6.1
         keywords.push( new FITSKeyword( name.trim(), value.trim(), comment.trim() ) );
      }
      f.close();
      return keywords;
   };

// ----------------------------------------------------------------------------
// Extensions to the Parameters object
// ----------------------------------------------------------------------------

if ( !Parameters.indexedId )
   Parameters.indexedId = function( id, index )
   {
      return id + '_' + (index + 1).toString(); // make indexes one-based
   };

if ( !Parameters.hasIndexed )
   Parameters.hasIndexed = function( id, index )
   {
      return Parameters.has( Parameters.indexedId( id, index ) );
   };

if ( !Parameters.getBooleanIndexed )
   Parameters.getBooleanIndexed = function( id, index )
   {
      return Parameters.getBoolean( Parameters.indexedId( id, index ) );
   };

if ( !Parameters.getIntegerIndexed )
   Parameters.getIntegerIndexed = function( id, index )
   {
      return Parameters.getInteger( Parameters.indexedId( id, index ) );
   };

if ( !Parameters.getRealIndexed )
   Parameters.getRealIndexed = function( id, index )
   {
      return Parameters.getReal( Parameters.indexedId( id, index ) );
   };

if ( !Parameters.getStringIndexed )
   Parameters.getStringIndexed = function( id, index )
   {
      return Parameters.getString( Parameters.indexedId( id, index ) );
   };

if ( !Parameters.getUIntIndexed )
   Parameters.getUIntIndexed = function( id, index )
   {
      return Parameters.getUInt( Parameters.indexedId( id, index ) );
   };

if ( !Parameters.getStringList )
   Parameters.getStringList = function( id )
   {
      var list = new Array();
      if ( Parameters.has( id ) )
      {
         var s = Parameters.getString( id );
         list = s.split( ':' );
         for ( var i = 0; i < list.length; ++i )
            list[i] = list[i].trim();
      }
      return list;
   };

if ( !Parameters.getStringListIndexed )
   Parameters.getStringListIndexed = function( id, index )
   {
      return Parameters.getStringList( Parameters.indexedId( id, index ) );
   };

if ( !Parameters.setStringList )
   Parameters.setStringList = function( id, list )
   {
      var s = "";
      if ( list.length > 0 )
         for ( var i = 0;; )
         {
            s += list[i];
            if ( ++i == list.length )
               break;
            s += ':';
         }
      Parameters.set( id, s );
   };

if ( !Parameters.setStringListIndexed )
   Parameters.setStringListIndexed = function( id, index, list )
   {
      Parameters.setStringList( Parameters.indexedId( id, index ), list );
   };

if ( !Parameters.setIndexed )
   Parameters.setIndexed = function( id, index, value )
   {
      return Parameters.set( Parameters.indexedId( id, index ), value );
   };

// ----------------------------------------------------------------------------
// GUI helper routines
// ----------------------------------------------------------------------------

function ScaledBitmap( height, bitmap )
{
   var w = bitmap.width;
   var h = bitmap.height;
   var s = height/h;
   return bitmap.scaledTo( Math.round( s*w ), Math.round( s*h ) );
}

function ScaledButtonBitmap( parent, bitmap )
{
   return ScaledBitmap( parent.dialog.font.height, bitmap );
}

function ScaledButtonIcon( parent, iconFilePath )
{
   return ScaledButtonBitmap( parent, new Bitmap( iconFilePath ) );
}

// ----------------------------------------------------------------------------
// EOF BatchPreprocessing-helper.js - Released 2017-07-04T17:05:20Z
