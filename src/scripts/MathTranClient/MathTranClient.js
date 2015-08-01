// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// MathTranClient.js - Released 2015/07/22 16:37:17 UTC
// ----------------------------------------------------------------------------
//
// This file is part of MathTran Client Script version 1.2
//
// Copyright (c) 2009-2015 Pleiades Astrophoto S.L.
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
 * MathTranClient v1.2
 *
 * A script to render mathematical TeX content as images through the MathTran
 * public web service. MathTran is funded by the Joint Information Systems
 * Committee (JISC) and is run by the Open University in the United Kingdom.
 *
 * Copyright (C) 2009-2015 Pleiades Astrophoto S.L.
 * Written by Juan Conejero (PTeam)
 *
 * ****************************************************************************
 *
 * Changelog:
 *
 * 1.2:  Fixed transparent image generation for PI 1.8.0 RC2.
 * 1.1:  Instantiable version for PI >= 1.5.8.
 * 1.0:  Initial version published as an official PixInsight script.
 */

#feature-id    Render > MathTranClient

#feature-info  A script to render mathematical TeX content as images through \
   the MathTran public web service. MathTran is funded by the Joint Information \
   Systems Committee (JISC) and run by the Open University in the United Kingdom.<br>\
   <br>\
   The MathTranClient script includes a plain text editor to write TeX source code. \
   It allows you to submit the TeX code to MathTran's public service and draws the \
   generated bitmap rendition on the script's dialog window. You can transform the \
   rendition into an image window.<br/>\
   <br/>\
   Written by Juan Conejero (PTeam)<br/>\
   Copyright &copy; 2009-2015 Pleiades Astrophoto S.L.

#feature-icon  MathTranClient.xpm

#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/FontFamily.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/StdCursor.jsh>
#include <pjsr/UndoFlag.jsh>

#define VERSION "1.2"
#define TITLE   "MathTranClient"

function validViewId( s )
{
   return s.replace( /[^A-Za-z0-9_]+/g, '_' ).replace( /^[0-9]/, '_' );
}

// ----------------------------------------------------------------------------

function MathTranClientEngine()
{
   this.texBitmap = new Bitmap;

   this.initialize = function()
   {
      if ( Parameters.isViewTarget )
         throw new Error( TITLE + " cannot be executed on views." );

      // Default parameters
      this.TeX = "";
      this.fontSize = 3;
      this.transparent = false;
      this.imageId = "";

      if ( Parameters.isGlobalTarget )
      {
         if ( Parameters.has( "TeX" ) )
            this.TeX = Parameters.get( "TeX" );
         if ( Parameters.has( "fontSize" ) )
            this.fontSize = Parameters.getInteger( "fontSize" );
         if ( Parameters.has( "transparent" ) )
            this.transparent = Parameters.getBoolean( "transparent" );
         if ( Parameters.has( "imageId" ) )
            this.imageId = Parameters.get( "imageId" );
      }
   };

   this.exportParameters = function()
   {
      Parameters.set( "TeX", this.TeX );
      Parameters.set( "fontSize", this.fontSize );
      Parameters.set( "transparent", this.transparent );
      Parameters.set( "imageId", this.imageId );
   };

   this.generate = function()
   {
      if ( this.texBitmap.isEmpty() )
         throw new Error( "No valid TeX rendition!" );

      var w = new ImageWindow(
         this.texBitmap.width, this.texBitmap.height, this.transparent ? 2 : 1, 8, false, false,
         (this.imageId.length == 0) ? "MathTran" : this.imageId );

      this.exportParameters();

      w.mainView.beginProcess( UndoFlag_NoSwapFile );

      if ( this.transparent )
      {
         var transparentBitmap = new Bitmap( this.texBitmap.width, this.texBitmap.height );
         transparentBitmap.fill( 0 );
         transparentBitmap.setAlpha( this.texBitmap, true/*invert*/ );
         w.mainView.image.blend( transparentBitmap );
      }
      else
         w.mainView.image.blend( this.texBitmap );

      w.mainView.endProcess();

      w.show();
   };

   this.render = function()
   {
      if ( this.TeX.length == 0 )
         throw new Error( "Empty TeX source code!" );

      // Build MathTran CGI request URL
      var queryURL = "http://mathtran.org/cgi-bin/mathtran?D=" +
                     this.fontSize.toString() +
                     ";tex=%5Cdisplaystyle%20" +
                     toPercentEncoding( this.TeX );

      // MathTran web renditions are PNG images
      var outputFileName = File.systemTempDirectory + "/MathTran.png";

      console.show();
      console.writeln( "<end><cbr><b>Downloading MathTran formula image:</b>" );
      console.writeln( queryURL );
      console.abortEnabled = true;
      console.flush();

      // Send request
      var download = new FileDownload( queryURL, outputFileName );
      try
      {
         download.perform();
      }
      catch ( e )
      {
         (new MessageBox( e.toString(), TITLE, StdIcon_Error, StdButton_Ok )).execute();
      }

      console.abortEnabled = false;
      console.hide();

      if ( download.ok )
      {
         /*
         var fileExtensions = Image.fileExtensionsForMimeType( download.contentType );
         if ( fileExtensions.length > 0 )
         {
            var tmpFilename = outputFileName;
            outputFileName = File.changeExtension( tmpFilename, fileExtensions[0] );
            File.move( tmpFilename, outputFileName );
         }
         */

         this.texBitmap.load( outputFileName );

         // On error, MathTran generates a 1x1 bitmap.
         if ( this.texBitmap.bounds.area < 2 )
         {
            (new MessageBox( "Invalid TeX source code.", TITLE, StdIcon_Error, StdButton_Ok )).execute();
            this.texBitmap.assign( new Bitmap );
         }
      }
   };

   this.clear = function()
   {
      this.TeX = "";
      this.texBitmap.assign( new Bitmap );
   };
}

var engine = new MathTranClientEngine;

// ----------------------------------------------------------------------------

function TeXAsCSS( where )
{
   return "<i>T</i><sub style=\"font-size:" +
          Math.round( where.font.pixelSize * 1.55 ).toString() +
          "px;\">E</sub><i>X</i>";
}

function nibbleToHex( n )
{
   const hexDigits = "0123456789ABCDEF";
   return hexDigits[n & 0xf];
}

function toPercentEncoding( s )
{
   var e = new String;
   for ( var i = 0, n = s.length; i < n; ++i )
   {
      var c = s.charCodeAt( i );
      if (   c >= 0x61 && c <= 0x7A  // a ... z
          || c >= 0x41 && c <= 0x5A  // A ... Z
          || c >= 0x30 && c <= 0x39  // 0 ... 9
          || c == 0x2D               // -
          || c == 0x2E               // .
          || c == 0x5F               // _
          || c == 0x7E )             // ~
      {
         e += s[i];
      }
      else
      {
         e += '%';
         e += nibbleToHex( (c & 0xf0) >> 4 );
         e += nibbleToHex( c & 0x0f );
      }
   }

   return e;
}

function TeXRenderControl( parent )
{
   this.__base__ = ScrollBox;
   this.__base__( parent );

   this.autoScroll = true;
   this.tracking = true;

   this.render = function()
   {
      this.initScrollBars();
      this.viewport.repaint();
   };

   this.initScrollBars = function()
   {
      this.pageWidth = engine.texBitmap.width;
      this.pageHeight = engine.texBitmap.height;
      this.setHorizontalScrollRange( 0, Math.max( 0, engine.texBitmap.width - this.viewport.width ) );
      this.setVerticalScrollRange( 0, Math.max( 0, engine.texBitmap.height - this.viewport.height ) );
      this.viewport.update();
   };

   this.viewport.onResize = function()
   {
      this.parent.initScrollBars();
   };

   this.onHorizontalScrollPosUpdated = function( x )
   {
      this.viewport.update();
   };

   this.onVerticalScrollPosUpdated = function( y )
   {
      this.viewport.update();
   };

   this.viewport.onPaint = function( x0, y0, x1, y1 )
   {
      var g = new Graphics( this );
      g.fillRect( x0, y0, x1, y1, new Brush( 0xffffffff ) );
      g.drawBitmap( this.parent.scrollPosition.symmetric().movedBy( 4, 4 ), engine.texBitmap );
      g.end();
   };

   this.initScrollBars();
}

TeXRenderControl.prototype = new ScrollBox;

function MathTranClientDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   this.help_Label = new Label( this );
   this.help_Label.frameStyle = FrameStyle_Box;
   this.help_Label.margin = 6;
   this.help_Label.wordWrapping = true;
   this.help_Label.useRichText = true;
   this.help_Label.text = "<p><b>" + TITLE + " v" + VERSION + "</b> &mdash; A PixInsight " +
         "script to render " + TeXAsCSS( this.help_Label ) + " content as images through " +
         "the MathTran public web service. MathTran is funded by the Joint Information " +
         "Systems Committee (JISC) and run by the Open University in the United Kingdom.</p>" +
         "<p>Copyright &copy; 2009-2015 Pleiades Astrophoto</p>";

   this.texRender_Control = new TeXRenderControl( this );
   this.texRender_Control.setScaledMinSize( 450, 200 );

   this.new_Button = new PushButton( this );
   this.new_Button.text = "New Image";
   this.new_Button.toolTip = "<p>Generate a new image window with the current TeX rendition.</p>"
   this.new_Button.onClick = function()
   {
      if ( engine.texBitmap.isEmpty() )
      {
         (new MessageBox( "There is no valid TeX rendition.",
                          TITLE, StdIcon_Error, StdButton_Ok )).execute();
         return;
      }

      engine.generate();
   };

   this.imageId_Label = new Label( this );
   this.imageId_Label.text = "View identifier:";
   this.imageId_Label.toolTip = "<p>Identifier of the TeX rendition image.</p>";
   this.imageId_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.imageId_Edit = new Edit( this );
   this.imageId_Edit.onGetFocus = function()
   {
      var s = this.text.trim();
      this.text = (s == "<Auto>") ? "" : validViewId( s );
   };
   this.imageId_Edit.onLoseFocus = function()
   {
      var s = this.text.trim();
      this.text = (s.length == 0) ? "<Auto>" : validViewId( s );
   };
   this.imageId_Edit.onEditCompleted = function()
   {
      this.onGetFocus();
      engine.imageId = this.text;
   };
   this.imageId_Edit.text = engine.imageId;
   this.imageId_Edit.toolTip = "<p>Identifier of the TeX rendition image.</p>";
   this.imageId_Edit.onLoseFocus();

   this.transparent_CheckBox = new CheckBox( this );
   this.transparent_CheckBox.text = "Transparent";
   this.transparent_CheckBox.checked = engine.transparent;
   this.transparent_CheckBox.toolTip = "<p>If this option is selected, the image will " +
      "be made transparent with an alpha channel. Otherwise the image will be opaque " +
      "with black text over a white background.</p>";
   this.transparent_CheckBox.onClick = function( checked )
   {
      engine.transparent = checked;
      this.parent.texRender_Control.render();
   };

   this.buttons1_Sizer = new HorizontalSizer;
   this.buttons1_Sizer.spacing = 4;
   this.buttons1_Sizer.add( this.new_Button );
   this.buttons1_Sizer.addSpacing( 8 );
   this.buttons1_Sizer.add( this.imageId_Label );
   this.buttons1_Sizer.add( this.imageId_Edit, 100 );
   this.buttons1_Sizer.addSpacing( 8 );
   this.buttons1_Sizer.add( this.transparent_CheckBox );
   this.buttons1_Sizer.addStretch();

   this.texEditor_Label = new Label( this );
   this.texEditor_Label.useRichText = true;
   this.texEditor_Label.text = TeXAsCSS( this.texEditor_Label ) + " Source Code";

   this.texEditor_TextBox = new TextBox( this );
   this.texEditor_TextBox.text = engine.TeX;
   this.texEditor_TextBox.setScaledMinSize( 450, 200 );
   this.texEditor_TextBox.styleSheet = this.scaledStyleSheet(
      "QWidget { font-family: DejaVu Sans Mono, monospace; font-size: 10pt; }" );

   this.newInstance_Button = new ToolButton( this );
   this.newInstance_Button.icon = this.scaledResource( ":/process-interface/new-instance.png" );
   this.newInstance_Button.setScaledFixedSize( 24, 24 );
   this.newInstance_Button.toolTip = "New Instance";
   this.newInstance_Button.onMousePress = function()
   {
      this.hasFocus = true;
      engine.TeX = this.parent.texEditor_TextBox.text.trim();
      engine.exportParameters();
      this.pushed = false;
      this.dialog.newInstance();
   };

   this.render_Button = new PushButton( this );
   this.render_Button.text = "Render";
   this.render_Button.toolTip = "<p>Render the current TeX source code by sending a " +
      "request to the MathTran public web service.</p>"
   this.render_Button.defaultButton = true;
   this.render_Button.onClick = function()
   {
      // Get TeX source code from the contents of the editor
      // Remove all leading and trailing whitespace
      engine.TeX = this.parent.texEditor_TextBox.text.trim();

      // Check for empty TeX source code
      if ( engine.TeX.length == 0 )
      {
         (new MessageBox( "Empty TeX source code.", TITLE, StdIcon_Error, StdButton_Ok )).execute();
         return;
      }

      // Render TeX source code as a bitmap
      engine.render();

      // Update onscreen TeX rendition
      this.parent.texRender_Control.render();

      gc();
   };

   this.size_Label = new Label( this );
   this.size_Label.text = "Size:";
   this.size_Label.toolTip = "<p>Font size</p>";
   this.size_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.size_SpinBox = new SpinBox( this );
   this.size_SpinBox.minValue = 0;
   this.size_SpinBox.maxValue = 10;
   this.size_SpinBox.value = engine.fontSize;
   this.size_SpinBox.toolTip = "<p>Font size</p>";
   this.size_SpinBox.onValueUpdated = function( value )
   {
      engine.fontSize = value;
   };

   this.clear_Button = new PushButton( this );
   this.clear_Button.text = "Clear";
   this.clear_Button.toolTip = "<p>Clear the current TeX rendition and source code.</p>";
   this.clear_Button.onClick = function()
   {
      this.parent.texEditor_TextBox.clear();
      engine.clear();
      this.parent.texRender_Control.render();
   };

   this.exit_Button = new PushButton( this );
   this.exit_Button.text = "Exit";
   this.exit_Button.onClick = function()
   {
      this.dialog.ok();
   };

   this.buttons2_Sizer = new HorizontalSizer;
   this.buttons2_Sizer.spacing = 4;
   this.buttons2_Sizer.add( this.newInstance_Button );
   this.buttons2_Sizer.add( this.render_Button );
   this.buttons2_Sizer.addSpacing( 8 );
   this.buttons2_Sizer.add( this.size_Label );
   this.buttons2_Sizer.add( this.size_SpinBox );
   this.buttons2_Sizer.addStretch();
   this.buttons2_Sizer.add( this.clear_Button );
   this.buttons2_Sizer.addSpacing( 4 );
   this.buttons2_Sizer.add( this.exit_Button );

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.add( this.help_Label );
   this.sizer.addSpacing( 10 );
   this.sizer.add( this.texRender_Control );
   this.sizer.addSpacing( 6 );
   this.sizer.add( this.buttons1_Sizer );
   this.sizer.addSpacing( 6 );
   this.sizer.add( this.texEditor_Label );
   this.sizer.add( this.texEditor_TextBox );
   this.sizer.addSpacing( 6 );
   this.sizer.add( this.buttons2_Sizer );

   this.windowTitle = TITLE + " Script";
   this.adjustToContents();
   this.setMinSize();

   this.texEditor_TextBox.hasFocus = true;
}

MathTranClientDialog.prototype = new Dialog;

/*
 * Script entry point.
 */
function main()
{
   console.hide();
   engine.initialize();
   (new MathTranClientDialog()).execute();
}

main();

// ----------------------------------------------------------------------------
// EOF MathTranClient.js - Released 2015/07/22 16:37:17 UTC
