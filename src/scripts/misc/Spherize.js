// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// pjsr/Spherize.js - Released 2010/12/14 15:27:34 UTC
// ****************************************************************************
// This file is part of the PixInsight JavaScript Runtime (PJSR).
// PJSR is an ECMA-262 compliant framework for development of scripts on the
// PixInsight platform.
//
// Copyright (c) 2003-2010, Pleiades Astrophoto S.L. All Rights Reserved.
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
 * Spherize v1.0
 *
 * Renders an image as its projection on a sphere.
 *
 * Copyright (C) 2005-2009 Pleiades Astrophoto S.L.
 * Written by Juan Conejero (PTeam)
 */

#feature-id    Render > Spherize

#feature-info  An example script that renders the selected image projected on a \
               sphere. The spherical rendition is generated as a new image \
               window. The user can define the diameter of the sphere in pixels \
               and the background color used to fill unused pixels.

#feature-icon  Spherize.xpm

#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/ColorSpace.jsh>
#include <pjsr/Interpolation.jsh>
#include <pjsr/UndoFlag.jsh>

#define VERSION "1.0"
#define TITLE   "Spherize"

/**
 * Renders the specified image on a sphere by Cartesian projection on a
 * plane tangent to the equator.
 */
function Spherize( data )
{
   var img = data.targetView.image;

   var w = img.width;
   var h = img.height;
   var isColor = img.colorSpace != ColorSpace_Gray;

   var alphaBase = data.bkgColor & 0xff000000;

   // Interpolates color channels to produce a 32-bit AARRGGBB color
   function InterpolateColor( x, y )
   {
      var r = Math.round( 255*Math.range( img.interpolate( x, y, 0 ), 0, 1 ) );
      var g, b;

      if ( isColor )
      {
         g = Math.round( 255*Math.range( img.interpolate( x, y, 1 ), 0, 1 ) );
         b = Math.round( 255*Math.range( img.interpolate( x, y, 2 ), 0, 1 ) );
      }
      else
         b = g = r;

      return alphaBase | (r << 16) | (g << 8) | b;
   }

   img.statusEnabled = true;
   img.initializeStatus( "Rendering sphere", data.diameter*data.diameter );

   img.interpolation = Interpolation_BicubicSpline;
   img.interpolationXRadius = img.interpolationYRadius = 2;

   // Working bitmap
   var bmp = new Bitmap( data.diameter, data.diameter );

   // Fill with background color
   bmp.fill( data.bkgColor );

   // Sphere parameters
   var r   = 0.5*data.diameter;  // radius
   var cx  = r;                  // center
   var cy  = r;
   var icx = Math.trunc( cx );   // truncated center
   var icy = Math.trunc( cy );

   // Sphere-to-source mapping ratios
   var ri  = (h - 1)/Math.PI;    // vertical (latitude) translation ratio
   var rj  = (w - 1)/Math.PI;    // horizontal (longitude) translation ratio

   // Render the sphere
   for ( var dx = 0, x0 = icx, x1 = icx, n1 = 0, n2 = 0;
         x1 >= 0;
         ++dx, ++x0, --x1 )
   {
      for ( var dy = 0, y0 = icy, y1 = icy;
            y1 >= 0;
            ++dy, ++y0, --y1 )
      {
         // Distance to the center
         var rho = Math.sqrt( dx*dx + dy*dy );
         var d = rho/r;

         if ( d < 1 )
         {
            // Cartesian to spherical coordinates
            var c    = Math.asin( d );
            var sinc = Math.sin( c );
            var lat  = Math.asin( dy*sinc/rho );
            var lon  = Math.atan2( dx*sinc, rho*Math.cos( c ) );

            // Project longitude and latitude on the source image
            var i0   = ri*(lat + Math.PI2);
            var i1   = ri*(Math.PI2 - lat);
            var j0   = rj*(lon + Math.PI2);
            var j1   = rj*(Math.PI2 - lon);

            // Render one pixel on each quadrant of the projected circle.
            bmp.setPixel( x0, y0, InterpolateColor( j0, i0 ) );
            bmp.setPixel( x1, y0, InterpolateColor( j1, i0 ) );
            bmp.setPixel( x0, y1, InterpolateColor( j0, i1 ) );
            bmp.setPixel( x1, y1, InterpolateColor( j1, i1 ) );
         }

         // Run the garbage collector after each 4K pixels. This is necessary
         // for this script to work with large images because this routine
         // creates a large number of variables. Keep in mind that the
         // JavaScript engine never calls the garbage collector automatically
         // during script execution.
         if ( ++n1 == 1024 )
         {
            n1 = 0;
            gc();
         }

         // Update the status monitor for each 1K pixels
         if ( ++n2 == 256 )
         {
            n2 = 0;
            img.advanceStatus( 1024 );
         }
      }
   }

   img.completeStatus();

   // Smooth out the limb of our sphere.
   var g = new Graphics( bmp );
   g.antialiasing = true;
   g.pen = new Pen( data.bkgColor, 2 );
   g.drawCircle( icx, icy, r );
   g.end();

   // Now create a new image window and blend our working bitmap
   var window = new ImageWindow( data.diameter, data.diameter, 3, 8, false, true );
   var view = window.mainView;
   view.beginProcess( UndoFlag_NoSwapFile ); // do not generate any swap file
   view.image.blend( bmp );
   view.endProcess();

   // Generated image windows must be explicitly shown
   window.show();
}

/**
 * The SpherizeData object defines functional parameters for the Spherize routine.
 */
function SpherizeData()
{
   // Get access to the active image window
   var window = ImageWindow.activeWindow;

   if ( !window.isNull )
   {
      this.targetView = window.currentView;
      this.diameter = 801;
      this.bkgColor = 0xff000000; // solid black
   }
}

// Global Spherize parameters.
var data = new SpherizeData;

/**
 * ExtractWaveletLayersDialog is a graphical user interface to define
 * ExtractWaveletLayers parameters.
 */
function SpherizeDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   var emWidth = this.font.width( 'M' );
   var labelWidth1 = this.font.width( "Background color:" ) + emWidth;

   //

   this.helpLabel = new Label( this );
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.margin = 4;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = "<b>" + TITLE + " v" + VERSION + "</b> &mdash; This script renders the " +
      "selected image on a sphere. The script performs a Cartesian projection on a plane tangent " +
      "to the equator of a sphere of the specified diameter in pixels. The rendition is generated " +
      "as a new image window, so this script <i>does not modify the target image</i>."

   //

   this.targetImage_Label = new Label( this );
   this.targetImage_Label.text = "Target image:";
   this.targetImage_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.targetImage_Label.minWidth = labelWidth1;

   this.targetImage_ViewList = new ViewList( this );
   this.targetImage_ViewList.scaledMinWidth = 300;
   this.targetImage_ViewList.getAll(); // include main views as well as previews
   this.targetImage_ViewList.currentView = data.targetView;
   this.targetImage_ViewList.toolTip = "Select the image to spherize";

   this.targetImage_ViewList.onViewSelected = function( view )
   {
      data.targetView = view;
   };

   this.targetImage_Sizer = new HorizontalSizer;
   this.targetImage_Sizer.spacing = 4;
   this.targetImage_Sizer.add( this.targetImage_Label );
   this.targetImage_Sizer.add( this.targetImage_ViewList, 100 );

   //

   this.diameter_Label = new Label( this );
   this.diameter_Label.text = "Diameter (px):";
   this.diameter_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.diameter_Label.minWidth = labelWidth1;

   this.diameter_SpinBox = new SpinBox( this );
   this.diameter_SpinBox.minValue = 1;
   this.diameter_SpinBox.maxValue = 16384;
   this.diameter_SpinBox.value = data.diameter;
   this.diameter_SpinBox.toolTip = "The diameter in pixels of the spherical rendition.";

   this.diameter_SpinBox.onValueUpdated = function( value )
   {
      data.diameter = value;
   };

   this.diameter_Sizer = new HorizontalSizer;
   this.diameter_Sizer.spacing = 4;
   this.diameter_Sizer.add( this.diameter_Label );
   this.diameter_Sizer.add( this.diameter_SpinBox );
   this.diameter_Sizer.addStretch();

   //

   this.bkgColor_Label = new Label( this );
   this.bkgColor_Label.text = "Background color:";
   this.bkgColor_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.bkgColor_Label.minWidth = labelWidth1;

   this.bkgColor_Edit = new Edit( this );
   this.bkgColor_Edit.text = format( "%X", data.bkgColor );
   this.bkgColor_Edit.minWidth = 14*emWidth;
   this.bkgColor_Edit.toolTip = "The background color encoded as a 32-bit hexadecimal integer.\n" +
                                "(AARRGGBB format: AA=alpha (transparency), RR=red, GG=green, BB=blue)";
   this.bkgColor_Edit.onEditCompleted = function()
   {
      data.bkgColor = parseInt( this.text, 16 );
      this.text = format( '%X', data.bkgColor );
   };

   this.bkgColor_Sizer = new HorizontalSizer;
   this.bkgColor_Sizer.spacing = 4;
   this.bkgColor_Sizer.add( this.bkgColor_Label );
   this.bkgColor_Sizer.add( this.bkgColor_Edit );
   this.bkgColor_Sizer.addStretch();

   //

   this.ok_Button = new PushButton( this );
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function()
   {
      this.dialog.ok();
   };

   this.cancel_Button = new PushButton( this );
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.ok_Button );
   this.buttons_Sizer.add( this.cancel_Button );

   //

   this.sizer = new VerticalSizer;
   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add( this.helpLabel );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.targetImage_Sizer );
   this.sizer.add( this.diameter_Sizer );
   this.sizer.add( this.bkgColor_Sizer );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = TITLE + " Script";
   this.adjustToContents();
   this.setFixedSize();
}

// Our dialog inherits all properties and methods from the core Dialog object.
SpherizeDialog.prototype = new Dialog;

/*
 * Script entry point.
 */
function main()
{
   // Hide the console while our dialog is active.
   console.hide();

   if ( !data.targetView )
   {
      (new MessageBox( "There is no active image window!",
                       TITLE, StdIcon_Error, StdButton_Ok )).execute();
      return;
   }

   var dialog = new SpherizeDialog();
   for ( ;; )
   {
      if ( !dialog.execute() )
         break;

      // A view must be selected.
      if ( data.targetView.isNull )
      {
         (new MessageBox( "You must select a view to apply this script.",
                          TITLE, StdIcon_Error, StdButton_Ok )).execute();
         continue;
      }

      // Since this is a relatively slow process, show the console to provide
      // feedback to the user.
      console.show();

      // Allow users to abort execution of this script.
      console.abortEnabled = true;

      var t0 = new Date;

      // Render the active image on a sphere
      Spherize( data );

      var t1 = new Date;
      console.writeln( format( "<end><cbr>Spherize: %.2f s", (t1.getTime() - t0.getTime())/1000 ) );

      // Quit after successful execution.
      break;
   }
}

main();

// ****************************************************************************
// EOF pjsr/Spherize.js - Released 2010/12/14 15:27:34 UTC
