// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// PIDocGlobal.js - Released 2017/01/23 20:54:58 UTC
// ----------------------------------------------------------------------------
//
// This file is part of PixInsight Documentation Compiler Script version 1.6.2
//
// Copyright (c) 2010-2017 Pleiades Astrophoto S.L.
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
 * PixInsight Documentation Compiler
 *
 * Copyright (C) 2010-2017 Pleiades Astrophoto. All Rights Reserved.
 * Written by Juan Conejero (PTeam)
 *
 * Global definitions and auxiliary objects.
 */

#include <pjsr/DataType.jsh>

/*
 * Current compiler version.
 */

#define VERSION "1.6.2"
#define TITLE   "PixInsight Documentation Compiler"

/*
 * Settings root key.
 */

#define SETTINGS_KEY_BASE  "PIDocCompiler/"

/*
 * Character codes.
 */

#define HT        0x09
#define LF        0x0a
#define VT        0x0b
#define FF        0x0c
#define CR        0x0d

#define SP        0x20

#define NUMBER    0x23

#define PERCENT   0x25

#define LPAREN    0x28
#define RPAREN    0x29

#define COMMA     0x2c
#define HYPHEN    0x2d
#define PERIOD    0x2e

#define COLON     0x3a
#define SCOLON    0x3b
#define LT        0x3c
#define EQ        0x3d
#define GT        0x3e

#define LSQUARE   0x5b
#define BKSLASH   0x5c
#define RSQUARE   0x5d

#define USCORE    0x5f

#define LCURLY    0x7b
#define RCURLY    0x7d

#define CH0       0x30
#define CH9       0x39
#define CHA       0x41
#define CHZ       0x5a
#define CHa       0x61
#define CHz       0x7a

#define REFMARK   0x203B // used to signal symbolic references
#define SEPMARK   0x2058 // used to separate items in special marks

/*
 * Some useful custom extensions to the global String object.
 *
 * Many of these routines are already implemented in current PJSR core engine
 * versions. They are kept here for historical/reference purposes.
 */

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
 * Returns a copy of this string where each sequence of successive whitespace
 * characters has been replaced with a single space character.
 */
if ( !String.prototype.packWhitespace )
   String.prototype.packWhitespace = function()
   {
      return this.replace( /\s+/g, ' ' );
   };

/*
 * Returns a copy of this string where each occurrence of a whitespace
 * character has been replaced with the corresponding URL encoded form: '%20'.
 */
if ( !String.prototype.encodeWhitespace )
   String.prototype.encodeWhitespace = function()
   {
      return this.replace( /\s/g, "%20" );
   };

/*
 * Returns true if this string starts with the specified substring.
 *
 * *** Part of ECMA-262.5 - Available in PJSR Core since build 702.
 */
if ( !String.prototype.startsWith )
   String.prototype.startsWith = function( s )
   {
      return this.indexOf( s ) == 0;
   };

/*
 * Returns true if this string ends with the specified substring.
 *
 * *** Part of ECMA-262.5 - Available in PJSR Core since build 702.
 */
if ( !String.prototype.endsWith )
   String.prototype.endsWith = function( s )
   {
      let pos = this.lastIndexOf( s );
      return pos >= 0 && pos == this.length - s.length;
   };

/*
 * Returns true if this string is empty.
 */
if ( !String.prototype.isEmpty )
   String.prototype.isEmpty = function()
   {
      return this.length == 0;
   };

/*
 * Returns true if this string contains the specified substring.
 */
if ( !String.prototype.contains )
   String.prototype.contains = function( s )
   {
      return this.indexOf( s ) >= 0;
   };

/*
 * Returns true if this string begins with a punctuator character: .,:;
 */
if ( !String.prototype.isPunctuator )
   String.prototype.isPunctuator = function()
   {
      let b = this.charCodeAt( 0 );
      return b == PERIOD || b == COMMA || b == COLON || b == SCOLON;
   };

/*
 * Returns true if this string begins with a parenthesis character ( or ).
 */
if ( !String.prototype.isParenthesis )
   String.prototype.isParenthesis = function()
   {
      let b = this.charCodeAt( 0 );
      return b == LPAREN || b == RPAREN;
   };

/*
 * Returns true if this string ends with a line feed control character (LF).
 */
if ( !String.prototype.isLineBreak )
   String.prototype.isLineBreak = function()
   {
      return this.charCodeAt( this.length-1 ) == LF;
   };

/*
 * Returns true if the ith character of this string is a valid component of a C
 * identifier.
 */
if ( !String.prototype.isIdChar )
   String.prototype.isIdChar = function( i )
   {
      let c = this.charCodeAt( i );
      return c >= CHa && c <= CHz || c == USCORE || c >= CHA && c <= CHZ || i > 0 && c >= CH0 && c <= CH9;
   };

/*
 * Returns true if this string is a valid C identifier.
 */
if ( !String.prototype.isValidId )
   String.prototype.isValidId = function()
   {
      if ( this.isEmpty() )
         return false;
      for ( let i = 0; i < this.length; ++i )
         if ( !this.isIdChar( i ) )
            return false;
      return true;
   };

/*
 * Replace all escaped occurrences of members of the set of punctuators and
 * parenthesis characters:
 *
 *    {}[]().,:;\%
 *
 * with their respective plain (unescaped) characters.
 *
 * *** Note: This method is not used by the compiler because it already takes
 *     care of all escaped control characters in the tokenizer phase.
 */
if ( !String.prototype.unescape )
   String.prototype.unescape = function()
   {
      return this.replace( "\\{", "{", "g"
                     ).replace( "\\}", "}", "g"
                        ).replace( "\\[", "[", "g"
                           ).replace( "\\]", "]", "g"
                              ).replace( "\\(", "(", "g"
                                 ).replace( "\\)", ")", "g"
                                    ).replace( "\\.", ".", "g"
                                       ).replace( "\\,", ",", "g"
                                          ).replace( "\\:", ":", "g"
                                             ).replace( "\\;", ";", "g"
                                                ).replace( "\\%", "%", "g"
                                                   ).replace( "\\\\", "\\", "g" );
   };

/*
 * Returns a deep copy of this string.
 */
if ( !String.prototype.toPlainText )
   String.prototype.toPlainText = function()
   {
      return this.toString();
   };

/*
 * Replaces all occurrences of '<', '>', '"' and '&' with their respective
 * ISO/IEC 8859-1 character entities.
 *
 * Also replaces the sequences '---' and '--' with em and en dash entities,
 * respectively.
 */
if ( !String.prototype.toXhtml )
   String.prototype.toXhtml = function()
   {
      return this.replace( /&(?![A-Za-z]+[0-9]*;|#[0-9]+;|#x[0-9a-fA-F]+;)/g, "&amp;"
                     ).replace( "<", "&lt;", "g"
                        ).replace( ">", "&gt;", "g"
                           ).replace( "\"", "&quot;", "g"
                              ).replace( "---", "&mdash;", "g"
                                 ).replace( "--", "&ndash;", "g" );
   };

/*
 * Replaces all occurrences of '<', '>', '"' and '&' with their respective
 * ISO/IEC 8859-1 character entities.
 *
 * Unlike toXhtml(), this function does not generate em and en dash entities.
 */
if ( !String.prototype.toPlainXhtml )
   String.prototype.toPlainXhtml = function()
   {
      return this.replace( /&(?![A-Za-z]+[0-9]*;|#[0-9]+;|#x[0-9a-fA-F]+;)/g, "&amp;"
                     ).replace( "<", "&lt;", "g"
                        ).replace( ">", "&gt;", "g"
                           ).replace( "\"", "&quot;", "g" );
   };

/*
 * Removes all tags and replaces all occurrences of &lt; and &gt; entities with
 * their respective '<' and '>' characters, respectively.
 *
 * Adapted from original code by Robert Nyman | http://robertnyman.com/
 */
if ( !String.prototype.removeHtmlTags )
   String.prototype.removeHtmlTags = function()
   {
      return this.replace( /&(lt|gt);/g,
         function( strMatch, p1 ) { return (p1 == "lt") ? "<" : ">"; } ).replace( /<\/?[^>]+(>|$)/g, "" );
   };

/*
 * Removes all anchor tags in a section title and packs any duplicate
 * whitespace characters.
 */
if ( !String.prototype.removeTitleAnchorTags )
   String.prototype.removeTitleAnchorTags = function()
   {
      return this.replace( /<[aA]\s+[^>]*>/g, ""
                     ).replace( /<\/a>/g, ""
                        ).replace( /\s+/g, ' '
                           ).replace( /sp\;\s+/g, "sp;" );
   };

/*
 * UTF16 to UTF8 conversion.
 * Returns a UTF8 version of this string as a ByteArray object.
 *
 * *** Available in PJSR Core since build 630.
 */
if ( !String.prototype.toUTF8 )
   if ( ByteArray.stringToUTF8 )
      String.prototype.toUTF8 = function( p, n )
      {
         return ByteArray.stringToUTF8( this, p, n );
      };
   else
      String.prototype.toUTF8 = function( p, n )
      {
         function isHighSurrogate( c16 )
         {
            return (c16 & 0xfc00) == 0xd800;
         }

         function isLowSurrogate( c16 )
         {
            return (c16 & 0xfc00) == 0xdc00;
         }

         function surrogatePairToUTF32( high, low )
         {
            return (high << 10) + low - 0x035fdc00;
         }

         if ( p == undefined )
            p = 0;
         if ( n == undefined )
            n = this.length;

         if ( this.isEmpty() || n == 0 || p >= this.length )
            return new ByteArray;

         n = Math.min( n, this.length-p );

         let result = new ByteArray( n*3 + 1 ); // worst case

         let i = 0;
         for ( let p1 = p+n; p < p1; ++p )
         {
            let u = this.charCodeAt( p );

            if ( u < 0x80 )
               result.at( i++, u );
            else
            {
               if ( u < 0x0800 )
                  result.at( i++, 0xc0|(u >> 6) );
               else
               {
                  let c32 = u;

                  if ( isHighSurrogate( u ) && p < p1-1 )
                  {
                     let low = this.charCodeAt( p+1 );
                     if ( isLowSurrogate( low ) )
                     {
                        ++p;
                        c32 = surrogatePairToUTF32( u, low );
                     }
                  }

                  if ( c32 > 0xffff )
                  {
                     result.at( i++, 0xf0|(c32 >> 18) );
                     result.at( i++, 0x80|((c32 >> 12) & 0x3f) );
                  }
                  else
                     result.at( i++, 0xe0|(c32 >> 12) );

                  result.at( i++, 0x80|((c32 >> 6) & 0x3f) );
               }

               result.at( i++, 0x80|(u & 0x3f) );
            }
         }

         result.remove( i, result.length );
         return result;
      };

/*
 * UTF8 to UTF16 conversion.
 * Returns a UTF16 representation of this ByteArray, assuming that this
 * object contains a UTF8-encoded string.
 *
 * *** Available in PJSR Core since build 630.
 */
if ( !ByteArray.prototype.utf8ToString )
   ByteArray.prototype.utf8ToString = function( p, n )
   {
#define REPLACEMENT_CHARACTER  0xfffd

      function highSurrogate( c32 )
      {
         return (c32 >> 10) + 0xd7c0;
      }

      function lowSurrogate( c32 )
      {
         return (c32 % 0x400) + 0xdc00;
      }

      if ( this.isEmpty || n == 0 || p >= this.length )
         return new String;

      n = Math.min( n, this.length-p );

      let result = new String;
      let uc = 0;
      let min_uc = 0;
      let need = 0;
      let error = -1;
      let i = 0;

      // skip UTF8-encoded byte order mark (BOM)
      if ( n >= 3 && this.at( p ) == 0xef && this.at( p+1 ) == 0xbb && this.at( p+2 ) == 0xbf )
         i += 3;

      for ( ; i < n; ++i )
      {
         let ch = this.at( p+i );

         if ( need )
         {
            if ( (ch & 0xc0) == 0x80 )
            {
               uc = (uc << 6) | (ch & 0x3f);
               if ( --need == 0 )
               {
                  if ( uc > 0xffff && uc < 0x110000 )
                  {
                     // surrogate pair
                     result += String.fromCharCode( highSurrogate( uc ) );
                     uc = lowSurrogate( uc );
                  }
                  else if ( uc < min_uc || uc >= 0xd800 && uc <= 0xdfff || uc >= 0xfffe )
                  {
                     // overlong sequence, UTF16 surrogate or (wrong) BOM
                     uc = REPLACEMENT_CHARACTER;
                  }
                  result += String.fromCharCode( uc );
               }
            }
            else
            {
               i = error;
               need = 0;
               result += String.fromCharCode( REPLACEMENT_CHARACTER );
            }
         }
         else
         {
            if ( ch < 128 )
            {
               result += String.fromCharCode( ch );
            }
            else if ( (ch & 0xe0) == 0xc0 )
            {
               uc = ch & 0x1f;
               need = 1;
               error = i;
               min_uc = 0x80;
            }
            else if ( (ch & 0xf0) == 0xe0 )
            {
               uc = ch & 0x0f;
               need = 2;
               error = i;
               min_uc = 0x800;
            }
            else if ( (ch & 0xf8) == 0xf0 )
            {
               uc = ch & 0x07;
               need = 3;
               error = i;
               min_uc = 0x10000;
            }
            else
            {
               // error
               result += String.fromCharCode( REPLACEMENT_CHARACTER );
            }
         }
      }

      if ( need )
         // we have some invalid characters remaining we need to add to the string
         for ( let i = error; i < n; ++i )
            result += String.fromCharCode( REPLACEMENT_CHARACTER );

      return result;

#undef REPLACEMENT_CHARACTER
   };

/*
 * Static method to convert a UTF-16 String object into a UTF-8 ByteArray.
 *
 * *** Available in PJSR Core since build 630.
 */
if ( !ByteArray.stringToUTF8 )
   ByteArray.stringToUTF8 = function( str, p, n )
   {
      return str.toUTF8( p, n );
   };

// ----------------------------------------------------------------------------
// EOF PIDocGlobal.js - Released 2017/01/23 20:54:58 UTC
