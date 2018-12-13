// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// EphUtility.jsh - Released 2018-12-13T19:24:09Z
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
 *
 * Utility routines.
 */

#ifndef __EphUtility_jsh
#define __EphUtility_jsh

// ----------------------------------------------------------------------------

function EphUtility()
{
   this.__base__ = Object;
   this.__base__();
}

EphUtility.prototype = new Object;

// ----------------------------------------------------------------------------

EphUtility.angleString = function( angle, range, sign, precision, units )
{
   let d = Math.decimalToSexagesimal( angle );
   let dd = d[1];
   let mm = d[2];
   let ss = d[3];
   ss = Math.roundTo( ss, precision );
   if ( ss == 60 )
   {
      ss = 0;
      if ( ++mm == 60 )
      {
         mm = 0;
         if ( ++dd == range )
            dd = 0;
      }
   }
   let dw = (range >= 100) ? 3 : 2;
   let sw = 2 + ((precision > 0) ? 1 : 0) + precision;
   let du = ' ', mu = ' ', su = '';
   if ( units )
   {
      du = '\u00B0';
      mu = '\u2032';
      su = '\u2033';
   }
   let result = format( "%c%" + dw.toString() + "d%c%02d%c%0" + sw.toString() + "." + precision.toString() + "f",
                        sign ? ((d[0] < 0) ? '-' : '+') : '', dd, du, mm, mu, ss );
   if ( units )
   {
      if ( precision > 0 )
         result = result.replace( '.', su+'.' );
      else
         result += su;
   }
   return result;
};

// ----------------------------------------------------------------------------

EphUtility.timeString = function( jd1, jd2 )
{
   let t = Math.jdToComplexTime( jd1, jd2 );
   let yr = t[0];
   let mn = t[1];
   let dd = t[2];
   let hh = t[3]*24;
   let mm = Math.frac( hh )*60;
   hh = Math.trunc( hh );
   let ss = Math.round( Math.frac( mm )*60, 0 );
   mm = Math.trunc( mm );
   if ( ss == 60 )
   {
      ss = 0;
      if ( ++mm == 60 )
      {
         mm = 0;
         if ( ++hh == 24 )
         {
            hh = 0;
            t = Math.jdToComplexTime( Math.complexTimeToJD( yr, mn, dd+1 ) );
            yr = t[0];
            mn = t[1];
            dd = t[2];
         }
      }
   }
   return format( "%4d %s %02d %02d:%02d:%02d", yr, EphUtility.month3Char( mn ), dd, hh, mm, ss );
};

// ----------------------------------------------------------------------------

EphUtility.month3Char = function( m )
{
   switch ( m % 12 )
   {
   case  1: return "JAN";
   case  2: return "FEB";
   case  3: return "MAR";
   case  4: return "APR";
   case  5: return "MAY";
   case  6: return "JUN";
   case  7: return "JUL";
   case  8: return "AUG";
   case  9: return "SEP";
   case 10: return "OCT";
   case 11: return "NOV";
   case  0: return "DEC";
   default: return ""; // to remove compiler warning
   }
};

// ----------------------------------------------------------------------------

EphUtility.centerJustified = function( text, width, fill )
{
   if ( !fill )
      fill = ' ';
   let l = text.length;
   if ( l >= width )
      return text;
   let n = width - l;
   let n2 = n >> 1;
   return fill.repeat( n2 ) + text + fill.repeat( n2 + (n & 1) );
};

// ----------------------------------------------------------------------------

EphUtility.capitalized = function( text )
{
   let words = text.split( ' ' );
   let result = "";
   if ( words.length > 0 )
      for ( let i = 0;; )
         if ( words[i].length > 0 )
         {
            if ( words[i].length > 1 )
               result += words[i][0].toUpperCase() + words[i].substring( 1 );
            else
               result += words[i];
            if ( ++i == words.length )
               break;
            result += ' ';
         }
   return result;
}

// ----------------------------------------------------------------------------

#endif // __EphUtility_jsh

// ----------------------------------------------------------------------------
// EOF EphUtility.jsh - Released 2018-12-13T19:24:09Z
