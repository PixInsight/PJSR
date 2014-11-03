// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// pjsr/ColorComboBox.jsh - Released 2014/10/29 08:14:02 UTC
// ****************************************************************************
// This file is part of the PixInsight JavaScript Runtime (PJSR).
// PJSR is an ECMA-262-5 compliant framework for development of scripts on the
// PixInsight platform.
//
// Copyright (c) 2003-2014, Pleiades Astrophoto S.L. All Rights Reserved.
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

#ifndef __PJSR_ColorComboBox_jsh
#define __PJSR_ColorComboBox_jsh

#ifndef __PJSR_Color_jsh
#include <pjsr/Color.jsh>
#endif

#define ICONSIZE   16
#define ICONMARGIN  2

/**
 * ColorComboBox is a utility class that provides a simple list with the full
 * set of CSS3 standard colors. This includes 143 ComboBox items that are
 * automatically shared by all existing ColorComboBox objects. Thanks to this
 * implicit sharing mechanism, a script can define a large number of
 * ColorComboBox controls without consuming too much resources on any
 * supported platform.
 *
 * The list of items corresponding to CSS3 colors is sorted by hue value (in
 * the HSV or HSI color ordering systems). This makes it much easier the task
 * of selecting colors since similar hues are grouped visually.
 *
 * In addition to CSS3 standard colors, a single custom color item can be
 * defined for a ColorComboBox object. The custom color item is automatically
 * managed by ColorComboBox and appended to the end of standard items.
 */

// ----------------------------------------------------------------------------

/**
 * ComboColor - A collection of CSS3 color/name items sorted by hue/value.
 */
function ComboColor( value, name )
{
   Object();

   this.value = value;
   this.name = name;
   this.icon = new Bitmap( ICONSIZE, ICONSIZE );

   this.icon.fill( 0 ); // transparent

   var p = new Graphics( this.icon );
   p.pen = new Pen( 0xff000000 ); // black

   if ( this.value != 0 )
   {
      p.brush = new Brush( this.value );
      p.drawRect( ICONMARGIN, ICONMARGIN, ICONSIZE-ICONMARGIN-1, ICONSIZE-ICONMARGIN-1 );
   }
   else
   {
      p.brush = new Brush( 0xffffffff ); // white
      p.drawRect( ICONMARGIN, ICONMARGIN, ICONSIZE-ICONMARGIN-1, ICONSIZE-ICONMARGIN-1 );
      p.drawLine( ICONMARGIN, ICONMARGIN, ICONSIZE-ICONMARGIN, ICONSIZE-ICONMARGIN );
      p.drawLine( ICONSIZE-ICONMARGIN+1, ICONMARGIN, ICONMARGIN+1, ICONSIZE-ICONMARGIN );
   }

   p.end();

   function myHue( rgb )
   {
      var r = Color.red( rgb );
      var g = Color.green( rgb );
      var b = Color.blue( rgb );

      if ( r == g && r == b ) // if this is a gray color
         return -1;

      var max = Math.max( Math.max( r, g ), b );
      var delta = 255.0*(max - Math.min( Math.min( r, g ), b ));
      var h;
      if ( r == max )
         h = 60*(g - b)/delta; // between yellow & magenta
      else if ( g == max )
         h = 120 + 60*(b - r)/delta; // between cyan & yellow
      else
         h = 240 + 60*(r - g)/delta; // between magenta & cyan

      if ( h < 0 )
         h += 360;

      return h;
   };

   function myValue( rgb )
   {
      return Color.red( rgb ) + Color.green( rgb ) + Color.blue( rgb );
   }

   this.H = myHue( this.value );
   this.V = myValue( this.value );

   this.isEqualTo = function( c )
   {
      return this.value == c.value;
   };

   this.isLessThan = function( c )
   {
      if ( this.H != c.H )
         return this.H < c.H;
      if ( this.V != c.V )
         return this.V < c.V;
      return this.V < c.V;
   };
}

ComboColor.prototype = new Object;

ComboColor.colors = new Array;

ComboColor.isInitialized = function()
{
   return ComboColor.colors.length != 0;
};

ComboColor.initColors = function()
{
   ComboColor.colors.length = 0;

#ifdef __COMBOCOLOR_USE_WEB_COLORS
   // Standard web color set
   ComboColor.colors.push( new ComboColor( 0xFF00FFFF, "Aqua"      ) );
   ComboColor.colors.push( new ComboColor( 0xFF000000, "Black"     ) );
   ComboColor.colors.push( new ComboColor( 0xFF0000FF, "Blue"      ) );
   ComboColor.colors.push( new ComboColor( 0xFF00FFFF, "Cyan"      ) );
   ComboColor.colors.push( new ComboColor( 0xFF808080, "Gray"      ) );
   ComboColor.colors.push( new ComboColor( 0xFF008000, "Green"     ) );
   ComboColor.colors.push( new ComboColor( 0xFFADD8E6, "LightBlue" ) );
   ComboColor.colors.push( new ComboColor( 0xFF00FF00, "Lime"      ) );
   ComboColor.colors.push( new ComboColor( 0xFFFF00FF, "Magenta"   ) );
   ComboColor.colors.push( new ComboColor( 0xFF800000, "Maroon"    ) );
   ComboColor.colors.push( new ComboColor( 0xFF000080, "Navy"      ) );
   ComboColor.colors.push( new ComboColor( 0xFF808000, "Olive"     ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFA500, "Orange"    ) );
   ComboColor.colors.push( new ComboColor( 0xFF800080, "Purple"    ) );
   ComboColor.colors.push( new ComboColor( 0xFFFF0000, "Red"       ) );
   ComboColor.colors.push( new ComboColor( 0xFFC0C0C0, "Silver"    ) );
   ComboColor.colors.push( new ComboColor( 0xFF008080, "Teal"      ) );
   ComboColor.colors.push( new ComboColor( 0xFFEE82EE, "Violet"    ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFFFFF, "White"     ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFFF00, "Yellow"    ) );
#else
   // CSS3 standard color set
   ComboColor.colors.push( new ComboColor( 0xFFF0F8FF, "AliceBlue"              ) );
   ComboColor.colors.push( new ComboColor( 0xFFFAEBD7, "AntiqueWhite"           ) );
   ComboColor.colors.push( new ComboColor( 0xFF00FFFF, "Aqua"                   ) );
   ComboColor.colors.push( new ComboColor( 0xFF7FFFD4, "Aquamarine"             ) );
   ComboColor.colors.push( new ComboColor( 0xFFF0FFFF, "Azure"                  ) );
   ComboColor.colors.push( new ComboColor( 0xFFF5F5DC, "Beige"                  ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFE4C4, "Bisque"                 ) );
   ComboColor.colors.push( new ComboColor( 0xFF000000, "Black"                  ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFEBCD, "BlanchedAlmond"         ) );
   ComboColor.colors.push( new ComboColor( 0xFF0000FF, "Blue"                   ) );
   ComboColor.colors.push( new ComboColor( 0xFF8A2BE2, "BlueViolet"             ) );
   ComboColor.colors.push( new ComboColor( 0xFFA52A2A, "Brown"                  ) );
   ComboColor.colors.push( new ComboColor( 0xFFDEB887, "BurlyWood"              ) );
   ComboColor.colors.push( new ComboColor( 0xFF5F9EA0, "CadetBlue"              ) );
   ComboColor.colors.push( new ComboColor( 0xFF7FFF00, "Chartreuse"             ) );
   ComboColor.colors.push( new ComboColor( 0xFFD2691E, "Chocolate"              ) );
   ComboColor.colors.push( new ComboColor( 0xFFFF7F50, "Coral"                  ) );
   ComboColor.colors.push( new ComboColor( 0xFF6495ED, "CornflowerBlue"         ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFF8DC, "Cornsilk"               ) );
   ComboColor.colors.push( new ComboColor( 0xFFDC143C, "Crimson"                ) );
   ComboColor.colors.push( new ComboColor( 0xFF00FFFF, "Cyan"                   ) );
   ComboColor.colors.push( new ComboColor( 0xFF00008B, "DarkBlue"               ) );
   ComboColor.colors.push( new ComboColor( 0xFF008B8B, "DarkCyan"               ) );
   ComboColor.colors.push( new ComboColor( 0xFFB8860B, "DarkGoldenRod"          ) );
   ComboColor.colors.push( new ComboColor( 0xFFA9A9A9, "DarkGray"               ) );
   ComboColor.colors.push( new ComboColor( 0xFF006400, "DarkGreen"              ) );
   ComboColor.colors.push( new ComboColor( 0xFFBDB76B, "DarkKhaki"              ) );
   ComboColor.colors.push( new ComboColor( 0xFF8B008B, "DarkMagenta"            ) );
   ComboColor.colors.push( new ComboColor( 0xFF556B2F, "DarkOliveGreen"         ) );
   ComboColor.colors.push( new ComboColor( 0xFFFF8C00, "DarkOrange"             ) );
   ComboColor.colors.push( new ComboColor( 0xFF9932CC, "DarkOrchid"             ) );
   ComboColor.colors.push( new ComboColor( 0xFF8B0000, "DarkRed"                ) );
   ComboColor.colors.push( new ComboColor( 0xFFE9967A, "DarkSalmon"             ) );
   ComboColor.colors.push( new ComboColor( 0xFF8FBC8F, "DarkSeaGreen"           ) );
   ComboColor.colors.push( new ComboColor( 0xFF483D8B, "DarkSlateBlue"          ) );
   ComboColor.colors.push( new ComboColor( 0xFF2F4F4F, "DarkSlateGray"          ) );
   ComboColor.colors.push( new ComboColor( 0xFF00CED1, "DarkTurquoise"          ) );
   ComboColor.colors.push( new ComboColor( 0xFF9400D3, "DarkViolet"             ) );
   ComboColor.colors.push( new ComboColor( 0xFFFF1493, "DeepPink"               ) );
   ComboColor.colors.push( new ComboColor( 0xFF00BFFF, "DeepSkyBlue"            ) );
   ComboColor.colors.push( new ComboColor( 0xFF696969, "DimGray"                ) );
   ComboColor.colors.push( new ComboColor( 0xFF1E90FF, "DodgerBlue"             ) );
   ComboColor.colors.push( new ComboColor( 0xFFD19275, "Feldspar"               ) );
   ComboColor.colors.push( new ComboColor( 0xFFB22222, "FireBrick"              ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFFAF0, "FloralWhite"            ) );
   ComboColor.colors.push( new ComboColor( 0xFF228B22, "ForestGreen"            ) );
   ComboColor.colors.push( new ComboColor( 0xFFFF00FF, "Fuchsia"                ) );
   ComboColor.colors.push( new ComboColor( 0xFFDCDCDC, "Gainsboro"              ) );
   ComboColor.colors.push( new ComboColor( 0xFFF8F8FF, "GhostWhite"             ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFD700, "Gold"                   ) );
   ComboColor.colors.push( new ComboColor( 0xFFDAA520, "GoldenRod"              ) );
   ComboColor.colors.push( new ComboColor( 0xFF808080, "Gray"                   ) );
   ComboColor.colors.push( new ComboColor( 0xFF008000, "Green"                  ) );
   ComboColor.colors.push( new ComboColor( 0xFFADFF2F, "GreenYellow"            ) );
   ComboColor.colors.push( new ComboColor( 0xFFF0FFF0, "HoneyDew"               ) );
   ComboColor.colors.push( new ComboColor( 0xFFFF69B4, "HotPink"                ) );
   ComboColor.colors.push( new ComboColor( 0xFFCD5C5C, "IndianRed"              ) );
   ComboColor.colors.push( new ComboColor( 0xFF4B0082, "Indigo"                 ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFFFF0, "Ivory"                  ) );
   ComboColor.colors.push( new ComboColor( 0xFFF0E68C, "Khaki"                  ) );
   ComboColor.colors.push( new ComboColor( 0xFFE6E6FA, "Lavender"               ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFF0F5, "LavenderBlush"          ) );
   ComboColor.colors.push( new ComboColor( 0xFF7CFC00, "LawnGreen"              ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFFACD, "LemonChiffon"           ) );
   ComboColor.colors.push( new ComboColor( 0xFFADD8E6, "LightBlue"              ) );
   ComboColor.colors.push( new ComboColor( 0xFFF08080, "LightCoral"             ) );
   ComboColor.colors.push( new ComboColor( 0xFFE0FFFF, "LightCyan"              ) );
   ComboColor.colors.push( new ComboColor( 0xFFFAFAD2, "LightGoldenRodYellow"   ) );
   ComboColor.colors.push( new ComboColor( 0xFFD3D3D3, "LightGray"              ) );
   ComboColor.colors.push( new ComboColor( 0xFF90EE90, "LightGreen"             ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFB6C1, "LightPink"              ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFA07A, "LightSalmon"            ) );
   ComboColor.colors.push( new ComboColor( 0xFF20B2AA, "LightSeaGreen"          ) );
   ComboColor.colors.push( new ComboColor( 0xFF87CEFA, "LightSkyBlue"           ) );
   ComboColor.colors.push( new ComboColor( 0xFF8470FF, "LightSlateBlue"         ) );
   ComboColor.colors.push( new ComboColor( 0xFF778899, "LightSlateGray"         ) );
   ComboColor.colors.push( new ComboColor( 0xFFB0C4DE, "LightSteelBlue"         ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFFFE0, "LightYellow"            ) );
   ComboColor.colors.push( new ComboColor( 0xFF00FF00, "Lime"                   ) );
   ComboColor.colors.push( new ComboColor( 0xFF32CD32, "LimeGreen"              ) );
   ComboColor.colors.push( new ComboColor( 0xFFFAF0E6, "Linen"                  ) );
   ComboColor.colors.push( new ComboColor( 0xFFFF00FF, "Magenta"                ) );
   ComboColor.colors.push( new ComboColor( 0xFF800000, "Maroon"                 ) );
   ComboColor.colors.push( new ComboColor( 0xFF66CDAA, "MediumAquaMarine"       ) );
   ComboColor.colors.push( new ComboColor( 0xFF0000CD, "MediumBlue"             ) );
   ComboColor.colors.push( new ComboColor( 0xFFBA55D3, "MediumOrchid"           ) );
   ComboColor.colors.push( new ComboColor( 0xFF9370D8, "MediumPurple"           ) );
   ComboColor.colors.push( new ComboColor( 0xFF3CB371, "MediumSeaGreen"         ) );
   ComboColor.colors.push( new ComboColor( 0xFF7B68EE, "MediumSlateBlue"        ) );
   ComboColor.colors.push( new ComboColor( 0xFF00FA9A, "MediumSpringGreen"      ) );
   ComboColor.colors.push( new ComboColor( 0xFF48D1CC, "MediumTurquoise"        ) );
   ComboColor.colors.push( new ComboColor( 0xFFC71585, "MediumVioletRed"        ) );
   ComboColor.colors.push( new ComboColor( 0xFF191970, "MidnightBlue"           ) );
   ComboColor.colors.push( new ComboColor( 0xFFF5FFFA, "MintCream"              ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFE4E1, "MistyRose"              ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFE4B5, "Moccasin"               ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFDEAD, "NavajoWhite"            ) );
   ComboColor.colors.push( new ComboColor( 0xFF000080, "Navy"                   ) );
   ComboColor.colors.push( new ComboColor( 0xFFFDF5E6, "OldLace"                ) );
   ComboColor.colors.push( new ComboColor( 0xFF808000, "Olive"                  ) );
   ComboColor.colors.push( new ComboColor( 0xFF6B8E23, "OliveDrab"              ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFA500, "Orange"                 ) );
   ComboColor.colors.push( new ComboColor( 0xFFFF4500, "OrangeRed"              ) );
   ComboColor.colors.push( new ComboColor( 0xFFDA70D6, "Orchid"                 ) );
   ComboColor.colors.push( new ComboColor( 0xFFEEE8AA, "PaleGoldenRod"          ) );
   ComboColor.colors.push( new ComboColor( 0xFF98FB98, "PaleGreen"              ) );
   ComboColor.colors.push( new ComboColor( 0xFFAFEEEE, "PaleTurquoise"          ) );
   ComboColor.colors.push( new ComboColor( 0xFFD87093, "PaleVioletRed"          ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFEFD5, "PapayaWhip"             ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFDAB9, "PeachPuff"              ) );
   ComboColor.colors.push( new ComboColor( 0xFFCD853F, "Peru"                   ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFC0CB, "Pink"                   ) );
   ComboColor.colors.push( new ComboColor( 0xFFDDA0DD, "Plum"                   ) );
   ComboColor.colors.push( new ComboColor( 0xFFB0E0E6, "PowderBlue"             ) );
   ComboColor.colors.push( new ComboColor( 0xFF800080, "Purple"                 ) );
   ComboColor.colors.push( new ComboColor( 0xFFFF0000, "Red"                    ) );
   ComboColor.colors.push( new ComboColor( 0xFFBC8F8F, "RosyBrown"              ) );
   ComboColor.colors.push( new ComboColor( 0xFF4169E1, "RoyalBlue"              ) );
   ComboColor.colors.push( new ComboColor( 0xFF8B4513, "SaddleBrown"            ) );
   ComboColor.colors.push( new ComboColor( 0xFFFA8072, "Salmon"                 ) );
   ComboColor.colors.push( new ComboColor( 0xFFF4A460, "SandyBrown"             ) );
   ComboColor.colors.push( new ComboColor( 0xFF2E8B57, "SeaGreen"               ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFF5EE, "SeaShell"               ) );
   ComboColor.colors.push( new ComboColor( 0xFFA0522D, "Sienna"                 ) );
   ComboColor.colors.push( new ComboColor( 0xFFC0C0C0, "Silver"                 ) );
   ComboColor.colors.push( new ComboColor( 0xFF87CEEB, "SkyBlue"                ) );
   ComboColor.colors.push( new ComboColor( 0xFF6A5ACD, "SlateBlue"              ) );
   ComboColor.colors.push( new ComboColor( 0xFF708090, "SlateGray"              ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFFAFA, "Snow"                   ) );
   ComboColor.colors.push( new ComboColor( 0xFF00FF7F, "SpringGreen"            ) );
   ComboColor.colors.push( new ComboColor( 0xFF4682B4, "SteelBlue"              ) );
   ComboColor.colors.push( new ComboColor( 0xFFD2B48C, "Tan"                    ) );
   ComboColor.colors.push( new ComboColor( 0xFF008080, "Teal"                   ) );
   ComboColor.colors.push( new ComboColor( 0xFFD8BFD8, "Thistle"                ) );
   ComboColor.colors.push( new ComboColor( 0xFFFF6347, "Tomato"                 ) );
   ComboColor.colors.push( new ComboColor( 0xFF40E0D0, "Turquoise"              ) );
   ComboColor.colors.push( new ComboColor( 0xFFEE82EE, "Violet"                 ) );
   ComboColor.colors.push( new ComboColor( 0xFFD02090, "VioletRed"              ) );
   ComboColor.colors.push( new ComboColor( 0xFFF5DEB3, "Wheat"                  ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFFFFF, "White"                  ) );
   ComboColor.colors.push( new ComboColor( 0xFFF5F5F5, "WhiteSmoke"             ) );
   ComboColor.colors.push( new ComboColor( 0xFFFFFF00, "Yellow"                 ) );
   ComboColor.colors.push( new ComboColor( 0xFF9ACD32, "YellowGreen"            ) );
#endif   // __COMBOCOLOR_USE_WEB_COLORS

   // Sort colors by hue
   ComboColor.colors.sort( new Function( "a", "b",
         "return a.isEqualTo( b ) ? 0 : (a.isLessThan( b ) ? -1 : +1);" ) );
};

ComboColor.searchColor = function( rgba )
{
   for ( var v = new ComboColor( rgba ), n = ComboColor.colors.length, i = 0, j = n; ; )
   {
      if ( j <= i )
         return (i < n && v.isEqualTo( ComboColor.colors[i] )) ? i : -1;
      var m = (i + j) >> 1;
      if ( ComboColor.colors[m].isLessThan( v ) )
         i = m+1;
      else
         j = m;
   }
};

// ----------------------------------------------------------------------------

/*
 * ColorComboBox
 */
function ColorComboBox( parent )
{
   this.__base__ = ComboBox;
   if ( parent )
      this.__base__( parent );
   else
      this.__base__();

   this.customRGBA = null;
   this.onCurrentColorChanged = null;
   this.onColorSelected = null;

   if ( !ComboColor.isInitialized() )
      ComboColor.initColors();

   for ( var i = 0; i < ComboColor.colors.length; ++i )
      this.addItem( ComboColor.colors[i].name, ComboColor.colors[i].icon );

   this.setMinWidth( this.font.width( "Custom (255,255,255)" ) + 60 );

   this.colorForIndex = function( index )
   {
      return (index < ComboColor.colors.length) ?
               ComboColor.colors[index].value : this.customRGBA;
   }

   this.currentColor = function()
   {
      return this.colorForIndex( this.currentItem );
   };

   this.setCurrentColor = function( rgba )
   {
      this.canUpdate = false;

      rgba |= 0xff000000; // we only deal with opaque colors

      var i = ComboColor.searchColor( rgba );

      if ( i < 0 )
      {
         if ( rgba != this.customRGBA )
         {
            if ( this.numberOfItems > ComboColor.colors.length )
               this.removeItem( this.numberOfItems - 1 );
            this.customRGBA = rgba;
            var item = new ComboColor( rgba, format( "Custom (%3d,%3d,%3d)",
                                       Color.red( rgba ), Color.green( rgba ), Color.blue( rgba ) ) );
            this.addItem( item.name, item.icon );
         }

         i = this.numberOfItems - 1;
      }

      this.currentItem = i;

      this.canUpdate = true;
   };

   this.onItemHighlighted = function( index )
   {
      var rgba = this.colorForIndex( index );
      this.popupToolTip = format( "%3d,%3d,%3d",
                  Color.red( rgba ), Color.green( rgba ), Color.blue( rgba ) );
      if ( this.onCurrentColorChanged )
         this.onCurrentColorChanged( rgba );
   };

   this.onItemSelected = function( index )
   {
      if ( this.onColorSelected )
         this.onColorSelected( this.colorForIndex( index ) );
   };
}

ColorComboBox.prototype = new ComboBox;

// ----------------------------------------------------------------------------

#undef ICONSIZE
#undef ICONMARGIN

#endif   // __PJSR_ColorComboBox_jsh

// ****************************************************************************
// EOF pjsr/ColorComboBox.jsh - Released 2014/10/29 08:14:02 UTC
