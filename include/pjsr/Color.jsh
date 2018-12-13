//     ____       __ _____  ____
//    / __ \     / // ___/ / __ \
//   / /_/ /__  / / \__ \ / /_/ /
//  / ____// /_/ / ___/ // _, _/   PixInsight JavaScript Runtime
// /_/     \____/ /____//_/ |_|    PJSR Version 1.0
// ----------------------------------------------------------------------------
// pjsr/Color.jsh - Released 2018-11-30T21:30:59Z
// ----------------------------------------------------------------------------
// This file is part of the PixInsight JavaScript Runtime (PJSR).
// PJSR is an ECMA-262-5 compliant framework for development of scripts on the
// PixInsight platform.
//
// Copyright (c) 2003-2018 Pleiades Astrophoto S.L. All Rights Reserved.
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

#ifndef __PJSR_Color_jsh
#define __PJSR_Color_jsh

/*
 * Color
 *
 * Provides static methods and constants for dealing with 32-bit ARGB colors.
 */
function Color()
{
   this.__base__ = Object;
   this.__base__();
}

Color.prototype = new Object;

Color.alpha = function( rgba )
{
   return (rgba >> 24) & 0xff;
};

Color.alphaF = function( rgba )
{
   return Color.alpha( rgba )/255.0;
};

Color.red = function( rgba )
{
   return (rgba >> 16) & 0xff;
};

Color.redF = function( rgba )
{
   return Color.red( rgba )/255.0;
};

Color.green = function( rgba )
{
   return (rgba >> 8) & 0xff;
};

Color.greenF = function( rgba )
{
   return Color.green( rgba )/255.0;
};

Color.blue = function( rgba )
{
   return rgba & 0xff;
};

Color.blueF = function( rgba )
{
   return Color.blue( rgba )/255.0;
};

Color.isGray = function( rgba )
{
   let r = Color.red( rgba );
   return r == Color.green( rgba ) && r == Color.blue( rgba );
};

Color.hue = function( rgba )
{
   return RGBColorSystem.hue( Color.redF( rgba ), Color.greenF( rgba ), Color.blueF( rgba ) );
};

Color.value = function( rgba )
{
   return RGBColorSystem.value( Color.redF( rgba ), Color.greenF( rgba ), Color.blueF( rgba ) );
};

Color.hsvSaturation = function( rgba )
{
   return RGBColorSystem.hsvSaturation( Color.redF( rgba ), Color.greenF( rgba ), Color.blueF( rgba ) );
};

Color.hsiSaturation = function( rgba )
{
   return RGBColorSystem.hsiSaturation( Color.redF( rgba ), Color.greenF( rgba ), Color.blueF( rgba ) );
};

Color.clearAlpha = function( rgba )
{
   return rgba & 0x00ffffff;
};

Color.clearRed = function( rgba )
{
   return rgba & 0xff00ffff;
};

Color.clearGreen = function( rgba )
{
   return rgba & 0xffff00ff;
};

Color.clearBlue = function( rgba )
{
   return rgba & 0xffffff00;
};

Color.setAlpha = function( rgba, a )
{
   return Color.clearAlpha( rgba ) | ((a & 0xff) << 24);
};

Color.setRed = function( rgba, r )
{
   return Color.clearRed( rgba ) | ((r & 0xff) << 16);
};

Color.setGreen = function( rgba, g )
{
   return Color.clearGreen( rgba ) | ((g & 0xff) << 8);
};

Color.setBlue = function( rgba, b )
{
   return Color.clearBlue( rgba ) | (b & 0xff);
};

Color.rgbaColor = function( r, g, b, a )
{
   return (a ? ((a & 0xff) << 24) : 0xff000000)
             | ((r & 0xff) << 16)
             | ((g & 0xff) <<  8)
             |  (b & 0xff);
};

Color.rgbaColorF = function( r, g, b, a )
{
   if ( a )
      return Color.rgbaColor( Math.round( 255*r ),
                              Math.round( 255*g ),
                              Math.round( 255*b ), Math.round( 255*a ) );
   return Color.rgbaColor( Math.round( 255*r ),
                           Math.round( 255*g ),
                           Math.round( 255*b ) );
};

Color.rgbColorToHexString = function( c )
{
   return format( "#%02X%02X%02X", Color.red( c ), Color.green( c ), Color.blue( c ) );
};

Color.rgbaColorToHexString = function( c )
{
   return format( "#%02X%02X%02X%02X", Color.red( c ), Color.green( c ), Color.blue( c ), Color.alpha( c ) );
};

Color.TRANSPARENT = 0x00000000;
Color.BLACK       = 0xff000000;
Color.WHITE       = 0xffffffff;
Color.GRAY        = 0xff808080;
Color.RED         = 0xffff0000;
Color.GREEN       = 0xff00ff00;
Color.BLUE        = 0xff0000ff;

#endif   // __PJSR_Color_jsh

// ----------------------------------------------------------------------------
// EOF pjsr/Color.jsh - Released 2018-11-30T21:30:59Z
