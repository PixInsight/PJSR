// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// BayerDrizzlePrep-Engine.js - Released 2015/11/06 00:00:00 UTC
// ----------------------------------------------------------------------------
//
// This file is part of BayerDrizzlePrep Script version 1.0
//
// Copyright (C) 2015 Ian Lauwerys. (www.blackwaterskies.co.uk)
//
// Based on BatchFormatConversion.js, BatchPreprocessing.js and other work.
// Copyright (c) 2012 Kai Wiechen
// Copyright (c) 2009-2014 Pleiades Astrophoto S.L.
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
   Changelog:
   1.0:  First release.
*/

// ========= # defines / includes ==============================================

#ifndef BayerDrizzlePrep_Engine_js
#define BayerDrizzlePrep_Engine_js
#endif

// Define as true for debug messages to console.
#ifndef DEBUGGING_MODE_ON
#define DEBUGGING_MODE_ON false
#endif

// Includes.
#ifndef __PJSR_DataType_jsh
#include <pjsr/DataType.jsh>
#endif

// ======== # processing classes ===============================================

/// @class ConversionEngine manages conversion of input mono CFA image to output RGB Bayer image.
///
///   Use as follows:
///    - Read/write properties may be accessed or updated directly.
///    - Read only properties must only be updated using public .set*() methods
///      (where they exist) in order to ensure correct operation.
///    - Private properties and methods should not be updated nor relied upon
///      as they may change in subsequent releasses.
///
///    - Use .setBayerPattern() method to set the Bayer filter pattern of the input image.
///    - Use .convertImage() method to convert input image to output image.
function ConversionEngine()
{
   if ( DEBUGGING_MODE_ON )
   {
      console.noteln( "{ ConversionEngine" );
   }
   // ******* Public read/write properties. *************************************

   // ******* Public read only properties. **************************************

   this.bayerPattern = 0;   ///< Bayer filter pattern of the input image from 0 - RGGB | 1 - BGGR | 2 - BRBG | 3 - GBRG.

   // ******* Private properties. ***********************************************

   this.conversionPixelMath = new PixelMath; ///< PixelMath instance to convert mono CFA to RGB Bayer.

   this.conversionPixelMath.expression0 = "iif( x()%2 == 0 && y()%2 == 0, $T, 0 )";
   this.conversionPixelMath.expression1 = "iif( iif( y()%2 == 0, x()%2 == 1, x()%2 == 0 ), $T, 0 )";
   this.conversionPixelMath.expression2 = "iif( x()%2 == 1 && y()%2 == 1, $T, 0 )";

   this.conversionPixelMath.useSingleExpression = false;
   this.conversionPixelMath.createNewImage = true;
   this.conversionPixelMath.showNewImage = false;
   this.conversionPixelMath.newImageId = "__bayer_rgb__";
   this.conversionPixelMath.newImageWidth = 0;
   this.conversionPixelMath.newImageHeight = 0;
   this.conversionPixelMath.newImageColorSpace = PixelMath.prototype.RGB;
   this.conversionPixelMath.newImageSampleFormat = PixelMath.prototype.f32;

   // ******* Public methods. ***************************************************

   /// Method to set the Bayer pattern.
   ///
   /// @param {integer} bayerPattern Bayer pattern from 0 - RGGB | 1- BGGR | 2 - GRBG | 3 - GBRG
   this.setBayerPattern = function( bayerPattern )
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ ConversionEngine.setBayerPattern" );
      }
      if ( bayerPattern >= 0 && bayerPattern <=3 ) {
         if ( DEBUGGING_MODE_ON )
         {
            console.noteln( "Setting .bayerPattern to: ", bayerPattern );
         }

         this.bayerPattern = bayerPattern;

         // Variables to hold modulo 2 of x and y coordinates of R, G and B pixels.
         var Rx, Ry, Gx0, Gx1, Bx, By;

         // Set the modulo 2 values according to the selected Bayer pattern.
         switch ( this.bayerPattern )
         {
         //   0 1
         // 0 R G
         // 1 G B
         case 0: // RGGB
            Rx  = 0; Ry  = 0; // iif( x()%2 == 0 && y()%2 == 0, $T, 0 )
            Gx0 = 1; Gx1 = 0; // iif( iif( y()%2 == 0, x()%2 == 1, x()%2 == 0 ), $T, 0 )
            Bx  = 1; By  = 1; // iif( x()%2 == 1 && y()%2 == 1, $T, 0 )
            break;
         //   0 1
         // 0 B G
         // 1 G R
         case 1: // BGGR
            Rx  = 1; Ry  = 1; // iif( x()%2 == 1 && y()%2 == 1, $T, 0 )
            Gx0 = 1; Gx1 = 0; // iif( iif( y()%2 == 0, x()%2 == 1, x()%2 == 0 ), $T, 0 )
            Bx  = 0; By  = 0; // iif( x()%2 == 0 && y()%2 == 0, $T, 0 )
            break;
         //   0 1
         // 0 G R
         // 1 B G
         case 2: // GRBG
            Rx  = 1; Ry  = 0; // iif( x()%2 == 1 && y()%2 == 0, $T, 0 )
            Gx0 = 0; Gx1 = 1; // iif( iif( y()%2 == 0, x()%2 == 0, x()%2 == 1 ), $T, 0 )
            Bx  = 0; By  = 1; // iif( x()%2 == 0 && y()%2 == 1, $T, 0 )
            break;
         //   0 1
         // 0 G B
         // 1 R G
         case 3: // GBRG
            Rx  = 0; Ry  = 1; // iif( x()%2 == 0 && y()%2 == 1, $T, 0 )
            Gx0 = 0; Gx1 = 1; // iif( iif( y()%2 == 0, x()%2 == 0, x()%2 == 1 ), $T, 0 )
            Bx  = 1; By  = 0; // iif( x()%2 == 1 && y()%2 == 0, $T, 0 )
            break;
         }

         // Build conditional PixelMath expressions using the modulo 2 values.
         // For each block of four pixels, the expression pushes the correct pixel(s) from the input image to the R, G and B channels of the output image.
         this.conversionPixelMath.expression0 = "iif( x()%2 == " + Rx.toString() + " && y()%2 == " + Ry.toString() + ", $T, 0 )";
         this.conversionPixelMath.expression1 = "iif( iif( y()%2 == 0, x()%2 == " + Gx0.toString() + ", x()%2 == " + Gx1.toString() + " ), $T, 0 )";
         this.conversionPixelMath.expression2 = "iif( x()%2 == " + Bx.toString() + " && y()%2 == " + By.toString() + ", $T, 0 )";
      }
      else
      {
         if ( DEBUGGING_MODE_ON )
         {
            console.noteln( "Unrecognised bayer pattern: ", bayerPattern );
         }
      }
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} ConversionEngine.setBayerPattern" );
      }
   }; // setBayerPattern()

   /// Method to convert mono CFA image to RGB Bayer.
   /// Returns {object} ImageWindow with RGB Bayer image if successful, null if not.
   ///
   /// @param {object} inputImage ImageWindow with CFA image to be converted.
   this.convertImage = function( inputImage )
   {
      var returnImage = null;
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ ConversionEngine.convertImage" );
      }
      try
      {
         // Create a random ID for the output image.
         // There is a small risk of a name collision if the caller is leaving lots of these windows open.
         this.conversionPixelMath.newImageId = "__bayer_rgb__" + (Math.random().toString( 16 ) + "000000000").substr( 2, 8 );
         this.conversionPixelMath.executeOn( inputImage.mainView, false );
         returnImage = ImageWindow.windowById( this.conversionPixelMath.newImageId );
      }
      catch( error )
      {
         console.warningln( "WARNING: Unable to convert image: " + error.message + "." );
      }
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} ConversionEngine.convertImage" );
      }
      return( returnImage );
   } // convertImage()

   /// Method to retrieve parameters from previous run.
   ///
   this.importParameters = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ ConversionEngine.importParameters" );
      }

      this.bayerPattern = ( Parameters.has( "bayerPattern" ) ) ? Parameters.getInteger( "bayerPattern" ) : this.bayerPattern;

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} ConversionEngine.importParameters" );
      }
   };

   /// Method to store current parameters for use in subsequent runs.
   ///
   this.exportParameters = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ ConversionEngine.exportParameters" );
      }

      Parameters.set( "bayerPattern", this.bayerPattern );

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} ConversionEngine.exportParameters" );
      }
   };

   if ( DEBUGGING_MODE_ON )
   {
      console.noteln( "} ConversionEngine" );
   }
}  // class ConversionEngine

// ----------------------------------------------------------------------------
// EOF BayerDrizzlePrep-Engine.js - Released 2015/11/06 00:00:00 UTC
