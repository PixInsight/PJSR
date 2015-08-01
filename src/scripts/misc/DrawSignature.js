// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// pjsr/DrawSignature.js - Released 2010/12/14 15:27:33 UTC
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
 * DrawSignature v1.1
 *
 * An example script to draw an arbitrary text on a corner of the selected
 * image. This script provides a graphical user interface where the user can
 * select the text, font, size and colors of the text to be drawn, among other
 * parameters.
 *
 * Copyright (C) 2009 Pleiades Astrophoto S.L.
 * Written by Juan Conejero (PTeam)
 */

#feature-id    Render > DrawSignature

#feature-info  An example script to draw an arbitrary text on a corner of the \
               selected image. This script provides a graphical user interface \
               where the user can select the text, font, size and colors of the \
               text to be drawn, among other parameters.

#feature-icon  DrawSignature.xpm

#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>

#define VERSION   1.1
#define TITLE     DrawSignature

/**
 * The DrawSignatureEngine object defines and implements the DrawSignature
 * routine and its functional parameters.
 */
function DrawSignatureEngine()
{
   this.initialize = function()
   {
      // Default parameters
      this.text = "PixInsight";
      this.fontFace = "Helvetica";
      this.fontSize = 128; // px
      this.bold = false;
      this.italic = false;
      this.stretch = 100;
      this.textColor = 0xffff7f00;
      this.bkgColor = 0x80000000;
      this.margin = 8;
      this.softEdges = false;

      if ( Parameters.isViewTarget || Parameters.isGlobalTarget )
      {
         // Our script is being executed as a Script instance.

         // Retrieve instance parameters
         if ( Parameters.has( "text" ) )
            this.text = Parameters.getString( "text" );
         if ( Parameters.has( "fontFace" ) )
            this.fontFace = Parameters.getString( "fontFace" );
         if ( Parameters.has( "fontSize" ) )
            this.fontSize = Parameters.getUInt( "fontSize" );
         if ( Parameters.has( "bold" ) )
            this.bold = Parameters.getBoolean( "bold" );
         if ( Parameters.has( "italic" ) )
            this.italic = Parameters.getBoolean( "italic" );
         if ( Parameters.has( "stretch" ) )
            this.stretch = Parameters.getUInt( "stretch" );
         if ( Parameters.has( "textColor" ) )
            this.textColor = Parameters.getUInt( "textColor" );
         if ( Parameters.has( "bkgColor" ) )
            this.bkgColor = Parameters.getUInt( "bkgColor" );
         if ( Parameters.has( "margin" ) )
            this.margin = Parameters.getInteger( "margin" );
         if ( Parameters.has( "softEdges" ) )
            this.softEdges = Parameters.getBoolean( "softEdges" );
      }

      if ( Parameters.isViewTarget )
      {
         // View context: use the target view.
         this.targetView = Parameters.targetView;
      }
      else
      {
         // Direct or global contexts: use the active view.
         var window = ImageWindow.activeWindow;
         if ( !window.isNull )
            this.targetView = window.currentView;
      }
   };

   this.apply = function()
   {
      // Export script parameters. We must carry out this here, *before* applying
      // our routine to targetView, so that a newly created Script instance will
      // encapsulate our current set of working parameters.
      this.exportParameters();

      // Tell the core application that we are going to change this view.
      // Without doing this, we'd have just read-only access to the view's image.
      this.targetView.beginProcess();

      // Perform our drawing routine.
      this.draw();

      // Done with view.
      this.targetView.endProcess();
   };

   this.exportParameters = function()
   {
      Parameters.set( "text", this.text );
      Parameters.set( "fontFace", this.fontFace );
      Parameters.set( "fontSize", this.fontSize );
      Parameters.set( "bold", this.bold );
      Parameters.set( "italic", this.italic );
      Parameters.set( "stretch", this.stretch );
      Parameters.set( "textColor", format( "0x%x", this.textColor ) );
      Parameters.set( "bkgColor", format( "0x%x", this.bkgColor ) );
      Parameters.set( "margin", this.margin );
      Parameters.set( "softEdges", this.softEdges );
   };

   /**
    * A routine to draw an arbitrary text at the lower-left corner of an image.
    *
    * The data argument provides operating parameters:
    *
    * targetView  Image to draw the text over.
    *
    * text        The text to draw.
    *
    * fontFace    The font to draw with.
    *
    * pointSize   The font size in points.
    *
    * bold        Whether the text will be drawn with a bold font.
    *
    * italic      Whether the text will be drawn with an italic font.
    *
    * stretch     The font stretch factor. A stretch factor of 100 draws
    *             characters with their normal widths. stretch > 100 draws
    *             wider (extended) characters, and stretch < 100 draws
    *             compressed characters.
    *
    * textColor   The text color. Encoded as a 32-bit integer: AARRGGBB, where
    *             AA is the 8-bit alpha (transparency) value, and RR, GG, BB
    *             are the red, green and blue 8-bit values, respectively.
    *
    * bgColor     The background color, encoded as explained above.
    *
    * margin      The outer margin in pixels.
    *
    * softEdges   If true, the text will be drawn with extra soft edges;
    *             normal edges otherwise.
    */
   this.draw = function()
   {
      // To execute with diagnostics messages, #define the __DEBUG__ macro; e.g.:
      //    run -D=__DEBUG__ signature.js
#ifdef __DEBUG__
      console.writeln(         "text      : ",   this.text );
      console.writeln(         "font      : ",   this.fontFace );
      console.writeln(         "fontSize  : ",   this.fontSize );
      console.writeln(         "stretch   : ",   this.stretch );
      console.writeln(         "bold      : ",   this.bold );
      console.writeln(         "italic    : ",   this.italic );
      console.writeln( format( "textColor : %X", this.textColor ) );
      console.writeln( format( "bgColor   : %X", this.bkgColor ) );
      console.writeln(         "margin    : ",   this.margin );
      console.writeln(         "soft      : ",   this.softEdges );
#endif

      var image = this.targetView.image;

      // Create the font
      var font = new Font( this.fontFace );
      font.pixelSize = this.fontSize;
      if ( this.bold )
         font.bold = true;
      if ( this.italic )
         font.italic = true;
      font.stretchFactor = this.stretch;

#ifdef __DEBUG__
      console.writeln( "Exact font match : ", font.isExactMatch );
      console.writeln( "Font point size  : ", font.pointSize );
#endif

      // Calculate a reasonable inner margin in pixels
      var innerMargin = Math.round( font.pixelSize/5 );

      // Calculate the sizes of our drawing box
      var width = font.width( this.text ) + 2*innerMargin;
      var height = font.ascent + font.descent + 2*innerMargin;

#ifdef __DEBUG__
      console.writeln( "Drawing box sizes : w=", width, ", h=", height );
#endif

      // Create a bitmap where we'll perform all of our drawing work
      var bmp = new Bitmap( width, height );

      // Fill the bitmap with the background color
      bmp.fill( this.bkgColor );

      // Create a graphics context for the working bitmap
      var G = new Graphics( bmp );

      // Select the required drawing tools: font and pen.
      G.font = font;
      G.pen = new Pen( this.textColor );
      G.transparentBackground = true; // draw text with transparent bkg
      G.textAntialiasing = true;

      // Now draw the signature
      G.drawText( innerMargin, height - font.descent - innerMargin, this.text );

      // Finished drawing
      G.end();

      // If soft text has been requested, we apply a convolution with a mild
      // low-pass filter to soften text edges.
      if ( this.softEdges )
      {
         // Create a RGB image with an alpha channel. The alpha channel is
         // necessary to preserve bitmap transparency.
         var simg = new Image( width, height, 4, 1 );

         // Select all channels, including alpha.
         simg.firstSelectedChannel = 0;
         simg.lastSelectedChannel = 3;

         // Fill the whole image with transparent black
         simg.fill( 0 );

         // Blend the bitmap
         simg.blend( bmp );

         // Apply the low-pass filter (feel free to try out other kernel values)
         simg.convolve( [0.05, 0.15, 0.05,
                         0.15, 1.00, 0.15,
                         0.05, 0.15, 0.05] );

         // Render the resulting image back to our working bitmap
         bmp.assign( simg.render() );
      }

      // Blend our bitmap at the lower left corner of the image
      image.selectedPoint = new Point( this.margin,
                                       image.height - this.margin - height );
      image.blend( bmp );
   };

   this.initialize();
}

// Global DrawSignature parameters.
var engine = new DrawSignatureEngine;

/**
 * DrawSignatureDialog is a graphical user interface to define
 * DrawSignature parameters.
 */
function DrawSignatureDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   //

   var emWidth = this.font.width( 'M' );
   var labelWidth1 = this.font.width( "Target image:" );

   //

   this.helpLabel = new Label( this );
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.margin = 4;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = "<p><b>" + #TITLE + " v" + #VERSION +
      "</b> &mdash; This script draws an arbitrary text at the lower-left corner of " +
      "an image. You can enter the text to draw and select the font, along with a " +
      "number of operating parameters below.</p>" +
      "<p>To apply the script, click the OK button. To close this dialog without " +
      "making any changes, click the Cancel button.</p>";

   //

   this.targetImage_Label = new Label( this );
   this.targetImage_Label.text = "Target image:";
   this.targetImage_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.targetImage_Label.minWidth = labelWidth1;

   this.targetImage_ViewList = new ViewList( this );
   this.targetImage_ViewList.getAll();
   this.targetImage_ViewList.currentView = engine.targetView;
   this.targetImage_ViewList.toolTip = "Select the image to draw the text over";
   this.targetImage_ViewList.onViewSelected = function( view )
   {
      engine.targetView = view;
   };

   this.targetImage_Sizer = new HorizontalSizer;
   this.targetImage_Sizer.spacing = 4;
   this.targetImage_Sizer.add( this.targetImage_Label );
   this.targetImage_Sizer.add( this.targetImage_ViewList, 100 );

   //

   this.text_Label = new Label( this );
   this.text_Label.text = "Text:";
   this.text_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.text_Label.minWidth = labelWidth1;

   this.text_Edit = new Edit( this );
   this.text_Edit.text = engine.text;
   this.text_Edit.minWidth = 42*emWidth;
   this.text_Edit.toolTip = "Enter the text to draw";
   this.text_Edit.onEditCompleted = function()
   {
      engine.text = this.text;
   };

   this.text_Sizer = new HorizontalSizer;
   this.text_Sizer.spacing = 4;
   this.text_Sizer.add( this.text_Label );
   this.text_Sizer.add( this.text_Edit );

   //

   this.fontFace_Label = new Label( this );
   this.fontFace_Label.text = "Face:";
   this.fontFace_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.fontFace_Label.minWidth = labelWidth1 - this.logicalPixelsToPhysical( 4+1 );

   this.fontFace_ComboBox = new ComboBox( this );
   this.fontFace_ComboBox.addItem( "Helvetica" );
   this.fontFace_ComboBox.addItem( "Times" );
   this.fontFace_ComboBox.addItem( "Courier" );
   this.fontFace_ComboBox.addItem( "SansSerif" );
   this.fontFace_ComboBox.addItem( "Serif" );
   this.fontFace_ComboBox.addItem( "Monospace" );
   this.fontFace_ComboBox.editEnabled = true;
   this.fontFace_ComboBox.editText = engine.fontFace;
   this.fontFace_ComboBox.toolTip = "Type a font face to draw with, or select a standard font family.";
   this.fontFace_ComboBox.onEditTextUpdated = function()
   {
      engine.fontFace = this.editText;
   };
   this.fontFace_ComboBox.onItemSelected = function( index )
   {
      engine.fontFace = this.itemText( index );
   };

   this.fontFace_Sizer = new HorizontalSizer;
   this.fontFace_Sizer.spacing = 4;
   this.fontFace_Sizer.add( this.fontFace_Label );
   this.fontFace_Sizer.add( this.fontFace_ComboBox, 100 );

   //

   this.fontSize_Label = new Label( this );
   this.fontSize_Label.text = "Size (px):";
   this.fontSize_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.fontSize_Label.minWidth = labelWidth1 - this.logicalPixelsToPhysical( 4+1 );

   this.fontSize_SpinBox = new SpinBox( this );
   this.fontSize_SpinBox.minValue = 8;
   this.fontSize_SpinBox.maxValue = 4000;
   this.fontSize_SpinBox.value = engine.fontSize;
   this.fontSize_SpinBox.toolTip = "Font size in pixels.";
   this.fontSize_SpinBox.onValueUpdated = function( value )
   {
      engine.fontSize = value;
   };

   this.bold_CheckBox = new CheckBox( this );
   this.bold_CheckBox.text = "Bold";
   this.bold_CheckBox.checked = engine.bold;
   this.bold_CheckBox.toolTip = "Check to draw with a bold typeface.";
   this.bold_CheckBox.onCheck = function( checked )
   {
      engine.bold = checked;
   };

   this.italic_CheckBox = new CheckBox( this );
   this.italic_CheckBox.text = "Italic";
   this.italic_CheckBox.checked = engine.italic;
   this.italic_CheckBox.toolTip = "Check to draw with an italics typeface.";
   this.italic_CheckBox.onCheck = function( checked )
   {
      engine.italic = checked;
   };

   this.stretch_Label = new Label( this );
   this.stretch_Label.text = "Stretch:";
   this.stretch_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.stretch_SpinBox = new SpinBox( this );
   this.stretch_SpinBox.minValue = 50;
   this.stretch_SpinBox.maxValue = 200;
   this.stretch_SpinBox.value = engine.stretch;
   this.stretch_SpinBox.toolTip = "<p>Font stretch factor:</p>" +
      "<p>stretch = 100 draws characters with their normal widths.<br/>" +
      "stretch > 100 draws wider (extended) characters.<br/>" +
      "stretch < 100 draws compressed characters.</p>";
   this.stretch_SpinBox.onValueUpdated = function( value )
   {
      engine.stretch = value;
   };

   this.fontStyle_Sizer = new HorizontalSizer;
   this.fontStyle_Sizer.spacing = 4;
   this.fontStyle_Sizer.add( this.fontSize_Label );
   this.fontStyle_Sizer.add( this.fontSize_SpinBox );
   this.fontStyle_Sizer.addSpacing( 12 );
   this.fontStyle_Sizer.add( this.bold_CheckBox );
   this.fontStyle_Sizer.add( this.italic_CheckBox );
   this.fontStyle_Sizer.addSpacing( 12 );
   this.fontStyle_Sizer.add( this.stretch_Label );
   this.fontStyle_Sizer.add( this.stretch_SpinBox );
   this.fontStyle_Sizer.addStretch();

   //

   this.textColor_Label = new Label( this );
   this.textColor_Label.text = "Text color:";
   this.textColor_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.textColor_Label.minWidth = labelWidth1 - this.logicalPixelsToPhysical( 4+1 );

   this.textColor_Edit = new Edit( this );
   this.textColor_Edit.text = format( "%X", engine.textColor );
   this.textColor_Edit.minWidth = 14*emWidth;
   this.textColor_Edit.toolTip = "<p>The text color encoded as a 32-bit hexadecimal integer.<br/>" +
      "(AARRGGBB format: AA=alpha (transparency), RR=red, GG=green, BB=blue)</p>";
   this.textColor_Edit.onEditCompleted = function()
   {
      engine.textColor = parseInt( this.text, 16 );
      this.text = format( '%X', engine.textColor );
   };
   this.textColor_Edit.onLoseFocus = function()
   {
      this.onEditCompleted();
   }

   this.bkgColor_Label = new Label( this );
   this.bkgColor_Label.text = "Background:";
   this.bkgColor_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.bkgColor_Edit = new Edit( this );
   this.bkgColor_Edit.text = format( "%X", engine.bkgColor );
   this.bkgColor_Edit.minWidth = 14*emWidth;
   this.bkgColor_Edit.toolTip = "<p>The background color encoded as a 32-bit hexadecimal integer.<br/>" +
      "(AARRGGBB format: AA=alpha (transparency), RR=red, GG=green, BB=blue)</p>";
   this.bkgColor_Edit.onEditCompleted = function()
   {
      engine.bkgColor = parseInt( this.text, 16 );
      this.text = format( '%X', engine.bkgColor );
   };

   this.textColor_Sizer = new HorizontalSizer;
   this.textColor_Sizer.spacing = 4;
   this.textColor_Sizer.add( this.textColor_Label );
   this.textColor_Sizer.add( this.textColor_Edit );
   this.textColor_Sizer.addStretch();
   this.textColor_Sizer.add( this.bkgColor_Label );
   this.textColor_Sizer.add( this.bkgColor_Edit );

   //

   this.font_Sizer = new VerticalSizer;
   this.font_Sizer.margin = 4;
   this.font_Sizer.spacing = 4;
   this.font_Sizer.add( this.fontFace_Sizer );
   this.font_Sizer.add( this.fontStyle_Sizer );
   this.font_Sizer.add( this.textColor_Sizer );

   this.font_GroupBox = new GroupBox( this );
   this.font_GroupBox.title = "Font";
   this.font_GroupBox.sizer = this.font_Sizer;

   //

   this.margin_Label = new Label( this );
   this.margin_Label.text = "Margin (px):";
   this.margin_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.margin_Label.minWidth = labelWidth1;

   this.margin_SpinBox = new SpinBox( this );
   this.margin_SpinBox.minValue = 0;
   this.margin_SpinBox.maxValue = 250;
   this.margin_SpinBox.value = engine.margin;
   this.margin_SpinBox.toolTip = "The margin in pixels between the drawing rectangle and the borders of the image.";
   this.margin_SpinBox.onValueUpdated = function( value )
   {
      engine.margin = value;
   };

   this.softEdges_CheckBox = new CheckBox( this );
   this.softEdges_CheckBox.text = "Soft edges";
   this.softEdges_CheckBox.checked = engine.softEdges;
   this.softEdges_CheckBox.toolTip = "If checked, the text will be drawn with extra soft edges";
   this.softEdges_CheckBox.onCheck = function( checked )
   {
      engine.softEdges = checked;
   };

   this.renderOptions_Sizer = new HorizontalSizer;
   this.renderOptions_Sizer.spacing = 4;
   this.renderOptions_Sizer.add( this.margin_Label );
   this.renderOptions_Sizer.add( this.margin_SpinBox );
   this.renderOptions_Sizer.addSpacing( 12 );
   this.renderOptions_Sizer.add( this.softEdges_CheckBox );
   this.renderOptions_Sizer.addStretch();

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
   this.buttons_Sizer.add( this.newInstance_Button );
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
   this.sizer.add( this.text_Sizer );
   this.sizer.add( this.font_GroupBox );
   this.sizer.add( this.renderOptions_Sizer );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = #TITLE + " Script";
   this.adjustToContents();
   this.setFixedSize();
}

// Our dialog inherits all properties and methods from the core Dialog object.
DrawSignatureDialog.prototype = new Dialog;

/*
 * Script entry point.
 */
function main()
{
   // If the script is being executed as a Script instance on a view context,
   // then apply it and exit, without showing any graphical user interface.
   // This allows us to run a script just as a regular (module-defined) process
   // instance.
   if ( Parameters.isViewTarget )
   {
      engine.apply();
      return;
   }

#ifndef __DEBUG__
   console.hide();
#endif

   // If the script is being executed either directly or in the global context,
   // then we need a target view, so an image window must be available.
   if ( !engine.targetView )
   {
      var msg = new MessageBox( "There is no active image window!",
                                (#TITLE + " Script"), StdIcon_Error, StdButton_Ok );
      msg.execute();
      return;
   }

   var dialog = new DrawSignatureDialog();
   for ( ;; )
   {
      // Execute the DrawSignature dialog.
      if ( !dialog.execute() )
         break;

      // A view must be selected.
      if ( engine.targetView.isNull )
      {
         var msg = new MessageBox( "You must select a view to apply this script.",
                                   (#TITLE + " Script"), StdIcon_Error, StdButton_Ok );
         msg.execute();
         continue;
      }

      // Perform the DrawSignature routine.
      engine.apply();

      // Quit after successful execution.
      break;
   }
}

main();

// ****************************************************************************
// EOF pjsr/DrawSignature.js - Released 2010/12/14 15:27:33 UTC
