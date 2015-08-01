// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// TranslucentPlanets.js - Released 2015/07/23 07:51:42 UTC
// ----------------------------------------------------------------------------
//
// This file is part of TranslucentPlanets Script version 1.2
//
// Copyright (C) 2005-2015 Pleiades Astrophoto S.L. All Rights Reserved.
// Written by Juan Conejero, PTeam.
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
 * TranslucentPlanets
 *
 * Generates a 3D network graphic over a background populated with random
 * translucent spheres.
 *
 * Copyright (C) 2005-2015 Pleiades Astrophoto S.L.
 * Written by Juan Conejero (PTeam)
 */

#feature-id    Render > TranslucentPlanets

#feature-info  An example script that generates a 3D network graphic over a \
               background populated with random translucent spheres. The user \
               can define a number of parameters that control the generated \
               rendition, as colors, number of spheres, their maximum diameter, \
               the frequency of network lines, and the size of the generated image.

#feature-icon  TranslucentPlanets.xpm

#include <pjsr/BitmapFormat.jsh>
#include <pjsr/ColorComboBox.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdCursor.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/UndoFlag.jsh>

#define VERSION "1.2"
#define TITLE   "TranslucentPlanets"

function TranslucentPlanetsEngine()
{
   this.initialize = function()
   {
      if ( Parameters.isViewTarget )
         throw new Error( TITLE + " cannot be executed on views." );

      // Default parameters
      this.size = 800;                   // Size in pixels of the generated image
      this.maxRadius = 60;               // Maximum planet radius
      this.numberOfPlanets = 120;        // Number of translucent planets
      this.networkFrequency = 25;        // Frequency of network lines
      this.skyTopColor = 0xFF000000;     // Top background color (solid black by default)
      this.skyBottomColor = 0xFF00008B;  // Bottom background color (dark blue by default)
      this.networkColor = 0xFFFF8000;    // Network color (solid orange by default)
      this.networkBkgColor = 0xFF000000; // Network background color (solid black by default)
      this.planetTransparency = 0xC0;    // Alpha value of all random planet colors

      if ( Parameters.isGlobalTarget )
      {
         if ( Parameters.has( "size" ) )
            this.size = Parameters.getUInt( "size" );
         if ( Parameters.has( "maxRadius" ) )
            this.maxRadius = Parameters.getUInt( "maxRadius" );
         if ( Parameters.has( "numberOfPlanets" ) )
            this.numberOfPlanets = Parameters.getUInt( "numberOfPlanets" );
         if ( Parameters.has( "networkFrequency" ) )
            this.networkFrequency = Parameters.getUInt( "networkFrequency" );
         if ( Parameters.has( "skyTopColor" ) )
            this.skyTopColor = Parameters.getUInt( "skyTopColor" );
         if ( Parameters.has( "skyBottomColor" ) )
            this.skyBottomColor = Parameters.getUInt( "skyBottomColor" );
         if ( Parameters.has( "networkColor" ) )
            this.networkColor = Parameters.getUInt( "networkColor" );
         if ( Parameters.has( "networkBkgColor" ) )
            this.networkBkgColor = Parameters.getUInt( "networkBkgColor" );
         if ( Parameters.has( "planetTransparency" ) )
            this.planetTransparency = Parameters.getUInt( "planetTransparency" );
      }
   };

   this.exportParameters = function()
   {
      Parameters.set( "size", this.size );
      Parameters.set( "maxRadius", this.maxRadius );
      Parameters.set( "numberOfPlanets", this.numberOfPlanets );
      Parameters.set( "networkFrequency", this.networkFrequency );
      Parameters.set( "skyTopColor", format( "0x%x", this.skyTopColor ) );
      Parameters.set( "skyBottomColor", format( "0x%x", this.skyBottomColor ) );
      Parameters.set( "networkColor", format( "0x%x", this.networkColor ) );
      Parameters.set( "networkBkgColor", format( "0x%x", this.networkBkgColor ) );
      Parameters.set( "planetTransparency", format( "0x%x", this.planetTransparency ) );
   };

   /**
    * Renders a TranslucentPlanets scene as a newly created image window.
    */
   this.generate = function()
   {
      // Working bitmap
      var bmp = new Bitmap( this.size, this.size, BitmapFormat_RGB32 );

      // Create a graphics context to draw on our working bitmap
      var g = new Graphics( bmp );

      // We want high-quality antialiased graphics
      g.antialiasing = true;

      // Fill the background with a linear gradient
      var lg = new LinearGradientBrush( new Point( 0 ), new Point( bmp.height ),
                                        [[0, this.skyTopColor], [1, this.skyBottomColor]] );
      g.fillRect( bmp.bounds, lg );

      // Draw random circles
      for ( var i = 0; i < this.numberOfPlanets; ++i )
      {
         // Random colors in the range [0,255]
         var red = Math.round( 255*Math.random() );
         var green = Math.round( 255*Math.random() );
         var blue = Math.round( 255*Math.random() );

         // Avoid too dark circles
         if ( red < 24 && green < 24 && blue < 24 )
         {
            --i;
            continue;
         }

         // 32-bit AARRGGBB color values
         var color1 = Color.rgbaColor( red, green, blue, this.planetTransparency );
         var color2 = Color.rgbaColor( red >> 1, green >> 1, blue >> 1, this.planetTransparency );

         // Random center and radius
         var center = new Point( this.size*Math.random(), this.size*Math.random() );
         var radius = this.maxRadius*Math.random();

         // Define working objects
         g.pen = new Pen( color2 );
         g.brush = new RadialGradientBrush( center, radius, center, [[0, color1], [1, color2]] );

         // Draw this planet
         g.drawCircle( center, radius );
      }

      // Erase the network region by drawing a dense network
      g.antialiasing = false;
      g.pen = new Pen( this.networkBkgColor );
      for ( var i = 0; i < this.size; ++i )
         g.drawLine( i-1, this.size, -1, i+1 );

      // Generate the network
      g.antialiasing = true;
      g.pen = new Pen( this.networkColor );
      for ( var i = 0; i < this.size; i += this.networkFrequency )
         g.drawLine( i, this.size-1, 0, i );
      g.drawLine( this.size-1, this.size-1, 0, this.size-1 );

      // End painting
      g.end();

      // Export parameters. In this way, the newly created image window will
      // store a copy of this script instance in its initial state.
      this.exportParameters();

      // Now create a new image window and blend our working bitmap
      var window = new ImageWindow( this.size, this.size, 3, 16, false, true, "Planets" );
      var view = window.mainView;
      view.beginProcess( UndoFlag_NoSwapFile ); // do not generate a swap file
      view.image.blend( bmp );
      view.endProcess();

      // Generated image windows must be explicitly shown
      window.bringToFront();
   };
}

// Global TranslucentPlanets engine.
var engine = new TranslucentPlanetsEngine;

/**
 * TranslucentPlanetsDialog is a graphical user interface to define
 * TranslucentPlanets parameters.
 */
function TranslucentPlanetsDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   //

   var emWidth = this.font.width( 'M' );
   var labelWidth1 = this.font.width( "Maximum planet radius (px):" ) + emWidth;
   var spinWidth1 = 8*emWidth;

   //

   this.helpLabel = new Label( this );
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.margin = 4;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = "<b>" + TITLE + " v" + VERSION + "</b> &mdash; This script generates " +
      "a 3D network graphic over a background populated with random translucent circles. " +
      "The rendition is generated as a new image window."

   //

   this.size_Label = new Label( this );
   this.size_Label.text = "Rendition size (px):";
   this.size_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.size_Label.minWidth = labelWidth1;

   this.size_SpinBox = new SpinBox( this );
   this.size_SpinBox.minValue = 256;
   this.size_SpinBox.maxValue = 16384;
   this.size_SpinBox.value = engine.size;
   this.size_SpinBox.setFixedWidth( spinWidth1 );
   this.size_SpinBox.toolTip = "<p>The size in pixels of the generated image.</p>";
   this.size_SpinBox.onValueUpdated = function( value )
   {
      engine.size = value;
   };

   this.size_Sizer = new HorizontalSizer;
   this.size_Sizer.spacing = 4;
   this.size_Sizer.add( this.size_Label );
   this.size_Sizer.add( this.size_SpinBox );
   this.size_Sizer.addStretch();

   //

   this.maxRadius_Label = new Label( this );
   this.maxRadius_Label.text = "Maximum planet radius (px):";
   this.maxRadius_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.maxRadius_Label.minWidth = labelWidth1;

   this.maxRadius_SpinBox = new SpinBox( this );
   this.maxRadius_SpinBox.minValue = 10;
   this.maxRadius_SpinBox.maxValue = 400;
   this.maxRadius_SpinBox.value = engine.maxRadius;
   this.maxRadius_SpinBox.setFixedWidth( spinWidth1 );
   this.maxRadius_SpinBox.toolTip = "<p>The maximum radius in pixels of a translucent planet.</p>";
   this.maxRadius_SpinBox.onValueUpdated = function( value )
   {
      engine.maxRadius = value;
   };

   this.maxRadius_Sizer = new HorizontalSizer;
   this.maxRadius_Sizer.spacing = 4;
   this.maxRadius_Sizer.add( this.maxRadius_Label );
   this.maxRadius_Sizer.add( this.maxRadius_SpinBox );
   this.maxRadius_Sizer.addStretch();

   //

   this.numberOfPlanets_Label = new Label( this );
   this.numberOfPlanets_Label.text = "Number of planets:";
   this.numberOfPlanets_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.numberOfPlanets_Label.minWidth = labelWidth1;

   this.numberOfPlanets_SpinBox = new SpinBox( this );
   this.numberOfPlanets_SpinBox.minValue = 0;
   this.numberOfPlanets_SpinBox.maxValue = 1000;
   this.numberOfPlanets_SpinBox.value = engine.numberOfPlanets;
   this.numberOfPlanets_SpinBox.setFixedWidth( spinWidth1 );
   this.numberOfPlanets_SpinBox.toolTip = "<p>Number of translucent planets.</p>";
   this.numberOfPlanets_SpinBox.onValueUpdated = function( value )
   {
      engine.numberOfPlanets = value;
   };

   this.numberOfPlanets_Sizer = new HorizontalSizer;
   this.numberOfPlanets_Sizer.spacing = 4;
   this.numberOfPlanets_Sizer.add( this.numberOfPlanets_Label );
   this.numberOfPlanets_Sizer.add( this.numberOfPlanets_SpinBox );
   this.numberOfPlanets_Sizer.addStretch();

   //

   this.networkFrequency_Label = new Label( this );
   this.networkFrequency_Label.text = "Network frequency (px):";
   this.networkFrequency_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.networkFrequency_Label.minWidth = labelWidth1;

   this.networkFrequency_SpinBox = new SpinBox( this );
   this.networkFrequency_SpinBox.minValue = 8;
   this.networkFrequency_SpinBox.maxValue = 1024;
   this.networkFrequency_SpinBox.value = engine.networkFrequency;
   this.networkFrequency_SpinBox.setFixedWidth( spinWidth1 );
   this.networkFrequency_SpinBox.toolTip = "<p>Distance in pixels between network lines.</p>";
   this.networkFrequency_SpinBox.onValueUpdated = function( value )
   {
      engine.networkFrequency = value;
   };

   this.networkFrequency_Sizer = new HorizontalSizer;
   this.networkFrequency_Sizer.spacing = 4;
   this.networkFrequency_Sizer.add( this.networkFrequency_Label );
   this.networkFrequency_Sizer.add( this.networkFrequency_SpinBox );
   this.networkFrequency_Sizer.addStretch();

   //

   this.planetTransparency_Label = new Label( this );
   this.planetTransparency_Label.text = "Planet transparency:";
   this.planetTransparency_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.planetTransparency_Label.minWidth = labelWidth1;

   this.planetTransparency_SpinBox = new SpinBox( this );
   this.planetTransparency_SpinBox.minValue = 0;
   this.planetTransparency_SpinBox.maxValue = 255;
   this.planetTransparency_SpinBox.value = engine.planetTransparency;
   this.planetTransparency_SpinBox.setFixedWidth( spinWidth1 );
   this.planetTransparency_SpinBox.toolTip = "<p>Alpha value of random planet colors: 0=transparent, 255=opaque.</p>";
   this.planetTransparency_SpinBox.onValueUpdated = function( value )
   {
      engine.planetTransparency = value;
   };

   this.planetTransparency_Sizer = new HorizontalSizer;
   this.planetTransparency_Sizer.spacing = 4;
   this.planetTransparency_Sizer.add( this.planetTransparency_Label );
   this.planetTransparency_Sizer.add( this.planetTransparency_SpinBox );
   this.planetTransparency_Sizer.addStretch();

   //

   this.skyTopColor_Label = new Label( this );
   this.skyTopColor_Label.text = "Background top color:";
   this.skyTopColor_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.skyTopColor_Label.minWidth = labelWidth1;

   this.skyTopColor_ComboBox = new ColorComboBox( this );
   this.skyTopColor_ComboBox.setCurrentColor( engine.skyTopColor );
   this.skyTopColor_ComboBox.toolTip = "<p>Background top color.</p>";
   this.skyTopColor_ComboBox.onColorSelected = function( rgba )
   {
      engine.skyTopColor = rgba;
   };

   this.skyTopColor_Sizer = new HorizontalSizer;
   this.skyTopColor_Sizer.spacing = 4;
   this.skyTopColor_Sizer.add( this.skyTopColor_Label );
   this.skyTopColor_Sizer.add( this.skyTopColor_ComboBox );
   this.skyTopColor_Sizer.addStretch();

   //

   this.skyBottomColor_Label = new Label( this );
   this.skyBottomColor_Label.text = "Background bottom color:";
   this.skyBottomColor_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.skyBottomColor_Label.minWidth = labelWidth1;

   this.skyBottomColor_ComboBox = new ColorComboBox( this );
   this.skyBottomColor_ComboBox.setCurrentColor( engine.skyBottomColor );
   this.skyBottomColor_ComboBox.toolTip = "<p>Background bottom color.</p>";
   this.skyBottomColor_ComboBox.onColorSelected = function( rgba )
   {
      engine.skyBottomColor = rgba;
   };

   this.skyBottomColor_Sizer = new HorizontalSizer;
   this.skyBottomColor_Sizer.spacing = 4;
   this.skyBottomColor_Sizer.add( this.skyBottomColor_Label );
   this.skyBottomColor_Sizer.add( this.skyBottomColor_ComboBox );
   this.skyBottomColor_Sizer.addStretch();

   //

   this.networkColor_Label = new Label( this );
   this.networkColor_Label.text = "Network color:";
   this.networkColor_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.networkColor_Label.minWidth = labelWidth1;

   this.networkColor_ComboBox = new ColorComboBox( this );
   this.networkColor_ComboBox.setCurrentColor( engine.networkColor );
   this.networkColor_ComboBox.toolTip = "<p>Network line color.</p>";
   this.networkColor_ComboBox.onColorSelected = function( rgba )
   {
      engine.networkColor = rgba;
   };

   this.networkColor_Sizer = new HorizontalSizer;
   this.networkColor_Sizer.spacing = 4;
   this.networkColor_Sizer.add( this.networkColor_Label );
   this.networkColor_Sizer.add( this.networkColor_ComboBox );
   this.networkColor_Sizer.addStretch();

   //

   this.networkBkgColor_Label = new Label( this );
   this.networkBkgColor_Label.text = "Network background color:";
   this.networkBkgColor_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.networkBkgColor_Label.minWidth = labelWidth1;

   this.networkBkgColor_ComboBox = new ColorComboBox( this );
   this.networkBkgColor_ComboBox.setCurrentColor( engine.networkBkgColor );
   this.networkBkgColor_ComboBox.toolTip = "<p>Network background color.</p>";
   this.networkBkgColor_ComboBox.onColorSelected = function( rgba )
   {
      engine.networkBkgColor = rgba;
   };

   this.networkBkgColor_Sizer = new HorizontalSizer;
   this.networkBkgColor_Sizer.spacing = 4;
   this.networkBkgColor_Sizer.add( this.networkBkgColor_Label );
   this.networkBkgColor_Sizer.add( this.networkBkgColor_ComboBox );
   this.networkBkgColor_Sizer.addStretch();

   //

   this.newInstance_Button = new ToolButton( this );
   this.newInstance_Button.icon = this.scaledResource( ":/process-interface/new-instance.png" );
   this.newInstance_Button.setScaledFixedSize( 24, 24 );
   this.newInstance_Button.toolTip = "New Instance";
   this.newInstance_Button.onMousePress = function()
   {
      this.hasFocus = true;
      engine.exportParameters();
      this.pushed = false;
      this.dialog.newInstance();
   };

   this.exec_Button = new PushButton( this );
   this.exec_Button.text = "New Rendition";
   this.exec_Button.icon = this.scaledResource( ":/icons/execute.png" );
   this.exec_Button.onClick = function()
   {
      this.dialog.ok();
   };

   this.close_Button = new PushButton( this );
   this.close_Button.text = "Close";
   this.close_Button.icon = this.scaledResource( ":/icons/close.png" );
   this.close_Button.onClick = function()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.add( this.newInstance_Button );
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.exec_Button );
   this.buttons_Sizer.add( this.close_Button );

   //

   this.sizer = new VerticalSizer;
   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add( this.helpLabel );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.size_Sizer );
   this.sizer.add( this.maxRadius_Sizer );
   this.sizer.add( this.numberOfPlanets_Sizer );
   this.sizer.add( this.networkFrequency_Sizer );
   this.sizer.add( this.planetTransparency_Sizer );
   this.sizer.add( this.skyTopColor_Sizer );
   this.sizer.add( this.skyBottomColor_Sizer );
   this.sizer.add( this.networkColor_Sizer );
   this.sizer.add( this.networkBkgColor_Sizer );
   this.sizer.addSpacing( 6 );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = TITLE + " Script";
   this.adjustToContents();
   this.setFixedSize();
}

// Our dialog inherits all properties and methods from the core Dialog object.
TranslucentPlanetsDialog.prototype = new Dialog;

/*
 * Script entry point.
 */
function main()
{
   console.hide();
   engine.initialize();
   var dialog = new TranslucentPlanetsDialog();
   while ( dialog.execute() )
      engine.generate();
}

main();

// ----------------------------------------------------------------------------
// EOF TranslucentPlanets.js - Released 2015/07/23 07:51:42 UTC
