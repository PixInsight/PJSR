// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// pjsr/PolarCoordinates.js - Released 2010/12/14 15:27:34 UTC
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
 * PolarCoordinates v1.0
 *
 * Transforms an image from Cartesian to polar coordinates.
 *
 * Copyright (C) 2005-2009 Pleiades Astrophoto S.L.
 * Written by Juan Conejero (PTeam)
 */

#feature-id    Coordinate Transformations > PolarCoordinates

#feature-info  An example script that transforms an image from Cartesian to \
               polar coordinates. In the polar coordinate system, the horizontal axis \
               represents the distance of an original pixel to the geometric center \
               of the image, and the vertical axis represents the position angle \
               in the range from zero degrees (top row) to 360 degrees (bottom row).

#feature-icon  PolarCoordinates.xpm

#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>

#define VERSION "1.0"
#define TITLE   "PolarCoordinates"

/*
 * Transformation of an image from Cartesian to polar coordinates.
 */
function CartesianToPolar( image )
{
   // Gather working parameters
   var n = image.numberOfChannels;
   var w = image.width;
   var h = image.height;
   var w2 = 0.5*w;
   var h2 = 0.5*h;
   var r0 = Math.sqrt( w2*w2 + h2*h2 ); // semi-diagonal

   // Create a working image to store one channel of the target image
   var tmp = new Image( w, h, 1 );

   // Initialize the status monitoring system for this image.
   // The status monitor will provide progress information on the console.
   image.statusEnabled = true;
   image.initializeStatus( "Polar coordinate transform", 2*w*h*n );

   // Don't allow other routines to re-initialize the status monitor
   image.statusInitializationEnabled = false;

   // Reset the rectangular selection to the whole image boundaries
   image.resetRectSelection();

   // For each channel
   for ( var c = 0; c < n; ++c )
   {
      tmp.fill( 0 ); // initialize working data with zeros

      // For each row
      for ( var i = 0; i < h; ++i )
      {
         // Polar angle for the current row
         var theta = 2*Math.PI*i/h;
         var stheta = Math.sin( theta );
         var ctheta = Math.cos( theta );

         // For each column
         for ( var j = 0; j < w; ++j )
         {
            // Radial distance for the current column
            var r = r0*j/w;

            // Horizontal coordinate on the source image
            var x = w2 + r*ctheta;

            if ( x >= 0 && x < w )
            {
               // Vertical coordinate on the source image
               var y = h2 - r*stheta;

               // Copy the source pixel to the polar-transformed location on
               // the working image.
               if ( y >= 0 && y < h )
                  tmp.setSample( image.interpolate( x, y, c ), j, i );
            }
         }

         // Update status monitoring (progress information)
         image.advanceStatus( w );
      }

      // Copy our working data to the channel c of image
      image.selectedChannel = c;
      image.apply( tmp );
   }

   tmp.free();
}

/*
 * The CartesianToPolarData object defines functional parameters for the
 * CartesianToPolar routine.
 */
function CartesianToPolarData()
{
   // Get access to the active image window
   var window = ImageWindow.activeWindow;

   if ( !window.isNull )
      this.targetView = window.currentView;
}

// Global CartesianToPolar parameters.
var data = new CartesianToPolarData;

/*
 * CartesianToPolarDialog is a graphical user interface to define
 * CartesianToPolar parameters.
 */
function CartesianToPolarDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   this.helpLabel = new Label( this );
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.margin = this.logicalPixelsToPhysical( 4 );
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = "<b>" + TITLE + " v" + VERSION + "</b> &mdash; This script transforms an " +
                         "image from Cartesian to polar coordinates. In the polar coordinate system, " +
                         "the horizontal axis represents the distance of an original pixel to the " +
                         "geometric center of the image, and the vertical axis represents the position " +
                         "angle in the range from zero degrees (top row) to 360&deg; (bottom row).";

   this.targetImage_Label = new Label( this );
   this.targetImage_Label.text = "Target image:";
   this.targetImage_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.targetImage_ViewList = new ViewList( this );
   this.targetImage_ViewList.scaledMinWidth = 300;
   this.targetImage_ViewList.getAll(); // include main views as well as previews
   this.targetImage_ViewList.currentView = data.targetView;
   this.targetImage_ViewList.toolTip = "Select the image that will be transformed to polar coordinates.";
   this.targetImage_ViewList.onViewSelected = function( view )
   {
      data.targetView = view;
   };

   this.targetImage_Sizer = new HorizontalSizer;
   this.targetImage_Sizer.spacing = 4;
   this.targetImage_Sizer.add( this.targetImage_Label );
   this.targetImage_Sizer.add( this.targetImage_ViewList, 100 );

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

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 8;
   this.sizer.add( this.helpLabel );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.targetImage_Sizer );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = TITLE + " Script";
   this.adjustToContents();
   this.setFixedSize();
}

// Our dialog inherits all properties and methods from the core Dialog object.
CartesianToPolarDialog.prototype = new Dialog;

/*
 * Script entry point.
 */
function main()
{
   console.hide();

   if ( !data.targetView )
   {
      (new MessageBox( "There is no active image window!",
                       TITLE, StdIcon_Error, StdButton_Ok )).execute();
      return;
   }

   var dialog = new CartesianToPolarDialog();
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

      console.abortEnabled = true;
      console.show();

      var t0 = new Date;

      data.targetView.beginProcess();

      CartesianToPolar( data.targetView.image );

      data.targetView.endProcess();

      var t1 = new Date;
      console.writeln( format( "<end><cbr>PolarCoordinates: %.2f s", (t1.getTime() - t0.getTime())/1000 ) );

      // Quit after successful execution.
      break;
   }
}

main();

// ****************************************************************************
// EOF pjsr/PolarCoordinates.js - Released 2010/12/14 15:27:34 UTC
