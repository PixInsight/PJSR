//     ____       __ _____  ____
//    / __ \     / // ___/ / __ \
//   / /_/ /__  / / \__ \ / /_/ /
//  / ____// /_/ / ___/ // _, _/   PixInsight JavaScript Runtime
// /_/     \____/ /____//_/ |_|    PJSR Version 1.0
// ----------------------------------------------------------------------------
// pjsr/SimpleColorDialog.jsh - Released 2015/07/23 10:07:13 UTC
// ----------------------------------------------------------------------------
// This file is part of the PixInsight JavaScript Runtime (PJSR).
// PJSR is an ECMA-262-5 compliant framework for development of scripts on the
// PixInsight platform.
//
// Copyright (c) 2003-2015 Pleiades Astrophoto S.L. All Rights Reserved.
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

#ifndef __PJSR_SimpleColorDialog_jsh
#define __PJSR_SimpleColorDialog_jsh

#ifndef __PJSR_Color_jsh
#include <pjsr/Color.jsh>
#endif

#ifndef __PJSR_NumericControl_jsh
#include <pjsr/NumericControl.jsh>
#endif

#ifndef __PJSR_StdDialogCode_jsh
#include <pjsr/StdDialogCode.jsh>
#endif

#ifndef __PJSR_StdCursor_jsh
#include <pjsr/StdCursor.jsh>
#endif

// ----------------------------------------------------------------------------

/*
 * SimpleColorDialog
 *
 * A modal dialog with three edit/slider compound controls and a color sample,
 * useful for selection of 32-bit ARGB colors.
 */
function SimpleColorDialog( color )
{
   this.__base__ = Dialog;
   this.__base__();

   this.color = color ? color : 0xff000000;
   this.grayscale = false;
   this.alphaEnabled = true;

   this.savedColor = this.color;

   var labelWidth1 = this.font.width( "Green:" ) + 8;

   this.V0 = new NumericControl( this );
   this.V0.real = false;
   this.V0.label.text = "Red:";
   this.V0.label.minWidth = labelWidth1;
   this.V0.setRange( 0, 255 );
   this.V0.slider.setRange( 0, 255 );
   this.V0.slider.scaledMinWidth = 300;
   this.V0.setValue( Color.red( this.color ) );
   this.V0.onValueUpdated = function( value )
   {
      this.dialog.color = Color.setRed( this.dialog.color, value );
      this.dialog.sample_Control.update();
   };

   this.V1 = new NumericControl( this );
   this.V1.real = false;
   this.V1.label.text = "Green:";
   this.V1.label.minWidth = labelWidth1;
   this.V1.setRange( 0, 255 );
   this.V1.slider.setRange( 0, 255 );
   this.V1.slider.scaledMinWidth = 300;
   this.V1.setValue( Color.green( this.color ) );
   this.V1.onValueUpdated = function( value )
   {
      this.dialog.color = Color.setGreen( this.dialog.color, value );
      this.dialog.sample_Control.update();
   };

   this.V2 = new NumericControl( this );
   this.V2.real = false;
   this.V2.label.text = "Blue:";
   this.V2.label.minWidth = labelWidth1;
   this.V2.setRange( 0, 255 );
   this.V2.slider.setRange( 0, 255 );
   this.V2.slider.scaledMinWidth = 300;
   this.V2.setValue( Color.blue( this.color ) );
   this.V2.onValueUpdated = function( value )
   {
      this.dialog.color = Color.setBlue( this.dialog.color, value );
      this.dialog.sample_Control.update();
   };

   this.V3 = new NumericControl( this );
   this.V3.real = false;
   this.V3.label.text = "Alpha:";
   this.V3.label.minWidth = labelWidth1;
   this.V3.setRange( 0, 255 );
   this.V3.slider.setRange( 0, 255 );
   this.V3.slider.scaledMinWidth = 300;
   this.V3.setValue( Color.alpha( this.color ) );
   this.V3.onValueUpdated = function( value )
   {
      this.dialog.color = Color.setAlpha( this.dialog.color, value );
      this.dialog.sample_Control.update();
   };

   this.sample_Control = new Control( this );
   this.sample_Control.scaledMinWidth = 100;
   this.sample_Control.onPaint = function()
   {
      var g = new Graphics( this );
      if ( Color.alpha( this.dialog.color ) != 0xff )
         g.drawTiledBitmap( this.boundsRect, new Bitmap( this.scaledResource( ":/image-window/transparent-small.png" ) ) );
      g.pen = new Pen( 0xff000000 );
      g.brush = new Brush( this.dialog.color|0 );
      g.drawRect( this.boundsRect );
      g.end();
   };

   this.colors_Sizer = new VerticalSizer;
   this.colors_Sizer.spacing = 6;
   this.colors_Sizer.add( this.V0 );
   this.colors_Sizer.add( this.V1 );
   this.colors_Sizer.add( this.V2 );
   this.colors_Sizer.add( this.V3 );

   this.ok_Button = new PushButton( this );
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function() { this.dialog.ok(); };

   this.cancel_Button = new PushButton( this );
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function() { this.dialog.cancel(); };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 8;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.ok_Button );
   this.buttons_Sizer.add( this.cancel_Button );

   this.top_Sizer = new HorizontalSizer;
   this.top_Sizer.spacing = 6;
   this.top_Sizer.add( this.colors_Sizer );
   this.top_Sizer.add( this.sample_Control );

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 6;
   this.sizer.add( this.top_Sizer );
   this.sizer.add( this.buttons_Sizer );

   this.onExecute = function()
   {
      this.V0.label.text = this.grayscale ? "Gray:" : "Red:";
      this.V1.visible = !this.grayscale;
      this.V2.visible = !this.grayscale;
      this.V3.visible = this.alphaEnabled;

      if ( this.alphaEnabled )
         this.V3.setValue( Color.alpha( this.color ) );
      else
         this.color = Color.setAlpha( this.color, 0xff );

      if ( this.grayscale )
      {
         var k = Color.red( this.color );
         this.color = Color.rgbaColor( k, k, k, Color.alpha( this.color ) );
         this.V0.setValue( k );
      }
      else
      {
         this.V0.setValue( Color.red( this.color ) );
         this.V1.setValue( Color.green( this.color ) );
         this.V2.setValue( Color.blue( this.color ) );
      }

      this.savedColor = this.color;
   };

   this.onReturn = function( returnCode )
   {
      if ( returnCode != StdDialogCode_Ok )
         this.color = this.savedColor;
   };

   this.windowTitle = "Select Color";
   this.adjustToContents();
   this.userResizable = true;
   this.setFixedHeight();
}

SimpleColorDialog.prototype = new Dialog;

// ----------------------------------------------------------------------------

#endif   // __PJSR_SimpleColorDialog_jsh

// ----------------------------------------------------------------------------
// EOF pjsr/SimpleColorDialog.jsh - Released 2015/07/23 10:07:13 UTC
