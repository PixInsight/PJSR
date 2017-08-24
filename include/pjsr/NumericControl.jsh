//     ____       __ _____  ____
//    / __ \     / // ___/ / __ \
//   / /_/ /__  / / \__ \ / /_/ /
//  / ____// /_/ / ___/ // _, _/   PixInsight JavaScript Runtime
// /_/     \____/ /____//_/ |_|    PJSR Version 1.0
// ----------------------------------------------------------------------------
// pjsr/NumericControl.jsh - Released 2017-08-01T14:29:08Z
// ----------------------------------------------------------------------------
// This file is part of the PixInsight JavaScript Runtime (PJSR).
// PJSR is an ECMA-262-5 compliant framework for development of scripts on the
// PixInsight platform.
//
// Copyright (c) 2003-2017 Pleiades Astrophoto S.L. All Rights Reserved.
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

#ifndef __PJSR_NumericControl_jsh
#define __PJSR_NumericControl_jsh

#ifndef __PJSR_Sizer_jsh
#include <pjsr/Sizer.jsh>
#endif

#ifndef __PJSR_Slider_jsh
#include <pjsr/Slider.jsh>
#endif

#ifndef __PJSR_TextAlign_jsh
#include <pjsr/TextAlign.jsh>
#endif

#ifndef __PJSR_FocusStyle_jsh
#include <pjsr/FocusStyle.jsh>
#endif

#ifndef __PJSR_StdButton_jsh
#include <pjsr/StdButton.jsh>
#endif

#ifndef __PJSR_StdIcon_jsh
#include <pjsr/StdIcon.jsh>
#endif

// ----------------------------------------------------------------------------

/*
 * NumericEdit
 *
 * A label/edit compound control to edit numeric parameters.
 */
function NumericEdit( parent )
{
   this.__base__ = Control;
   if ( parent )
      this.__base__( parent );
   else
      this.__base__();

   this.value = 0.0;
   this.lowerBound = 0.0;
   this.upperBound = 1.0;
   this.real = true;
   this.precision = 6;
   this.scientific = false;
   this.sciTriggerExp = -1;
   this.autoEditWidth = true;
   this.onValueUpdated = null;

   this.precisionForValue = function( precision, value )
   {
      value = Math.abs( value );
      if ( value < 10 )
         return precision;
      return Math.max( 0, precision - Math.max( 0, Math.trunc( Math.log10( value ) ) ) )|0;
   };

   this.label = new Label( this );
   this.label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.label.onMousePress = function()
   {
      if ( !this.parent.edit.readOnly )
      {
         this.parent.evaluate();
         this.parent.edit.hasFocus = true;
         this.parent.edit.selectAll();
      }
   };

   this.edit = new Edit( this );

   this.edit.onEditCompleted = function()
   {
      this.parent.evaluate();
   };

   this.edit.onGetFocus = function()
   {
      //if ( !this.readOnly )
      //   this.selectAll();
   };

   this.edit.onLoseFocus = function()
   {
      if ( !this.readOnly )
         this.parent.evaluate();
   };

   this.sizer = new HorizontalSizer;
   this.sizer.spacing = 4;
   this.sizer.add( this.label );
   this.sizer.add( this.edit );

   this.adjustToContents();
   this.setFixedHeight();
   this.childToFocus = this.edit;

   this.backgroundColor = 0; // transparent

   this.setValue = function( val )
   {
      this.value = Math.range( this.real ? val : Math.round( val ), this.lowerBound, this.upperBound );
      this.updateControls();
   };

   this.updateControls = function()
   {
      this.edit.text = this.valueAsString( this.value );
   };

   this.valueAsString = function( val )
   {
      let v = Math.range( val, this.lowerBound, this.upperBound );

      if ( this.real )
      {
         if ( this.scientific )
            if ( this.sciTriggerExp < 0 || v != 0 && (Math.abs( v ) > Math.pow10( +this.sciTriggerExp ) ||
                                                      Math.abs( v ) < Math.pow10( -this.sciTriggerExp )) )
               return format( "%.*e", this.precision, v );

         return format( "%.*f", this.precisionForValue( this.precision, v ), v );
      }

      return format( "%.0f", v );
   };

   this.minEditWidth = function()
   {
      let n = Math.trunc( Math.max( this.valueAsString( this.lowerBound ).length,
                                    this.valueAsString( this.upperBound ).length ) );
      let s = '';
      for ( let i = 0; i <= n; ++i )
         s += '0';
      return this.edit.font.width( s ) + this.logicalPixelsToPhysical( 1+2+2+1 );
   };

   this.adjustEditWidth = function()
   {
      this.edit.setFixedWidth( this.minEditWidth() );
      this.adjustToContents();
   };

   this.setReal = function( r )
   {
      if ( this.real != r )
      {
         this.real = r;
         if ( !this.real )
            this.value = Math.round( this.value );
         if ( this.autoEditWidth )
            this.adjustEditWidth();
         this.setValue( this.value );
      }
   };

   this.setRange = function( l, u )
   {
      this.lowerBound = Math.min( l, u );
      this.upperBound = Math.max( l, u );
      if ( this.autoEditWidth )
         this.adjustEditWidth();
      this.setValue( this.value );
   };

   this.setPrecision = function( n )
   {
      this.precision = Math.range( n, 0, 15 );
      if ( this.autoEditWidth )
         this.adjustEditWidth();
      this.updateControls();
   };

   this.enableScientificNotation = function( s )
   {
      this.scientific = s;
      if ( this.autoEditWidth )
         this.adjustEditWidth();
      this.updateControls();
   };

   this.setScientificNotationTriggerExponent = function( exp10 )
   {
      this.sciTriggerExp = exp10;
      if ( this.autoEditWidth )
         this.adjustEditWidth();
      this.updateControls();
   };

   this.evaluate = function()
   {
      if ( this.edit.readOnly ) // ?!
         return;

      try
      {
         let newValue;
         if ( this.real )
         {
            newValue = parseFloat( this.edit.text );
            newValue = Math.roundTo( newValue, this.precisionForValue( this.precision, newValue ) );
         }
         else
            newValue = parseInt( this.edit.text );

         if ( this.lowerBound < this.upperBound )
            if ( newValue < this.lowerBound || newValue > this.upperBound )
               throw new Error( format( "Numeric value out of range: %.16g - valid range is [%.16g,%.16g]",
                                        newValue, this.lowerBound, this.upperBound ) );
         let changed = newValue != this.value;
         if ( changed )
            this.value = newValue;
         this.updateControls();
         if ( changed )
            if ( this.onValueUpdated )
               this.onValueUpdated( this.value );
         return;
      }
      catch ( x )
      {
         (new MessageBox( x.message, "Evaluation Error", StdIcon_Error, StdButton_Ok )).execute();
         this.updateControls();
      }
   };
}

NumericEdit.prototype = new Control;

// ----------------------------------------------------------------------------

/*
 * NumericControl
 *
 * A label/edit/slider compound control to edit numeric parameters.
 */
function NumericControl( parent )
{
   this.__base_1__ = NumericEdit;
   this.__base_1__( parent );

   this.slider = new HorizontalSlider( this );
   this.slider.setRange( 0, 50 );
   this.slider.setScaledMinWidth( 50+16 );
   this.slider.setFixedHeight( this.edit.height );
   this.slider.pageSize = 5;
   this.slider.tickInterval = 5;
   this.slider.tickStyle = TickStyle_NoTicks;
   this.slider.focusStyle = FocusStyle_Click;

   this.slider.onGetFocus = function()
   {
      if ( !this.parent.edit.readOnly )
      {
         this.parent.edit.hasFocus = true;
         this.parent.edit.selectAll();
      }
   };

   this.slider.onValueUpdated = function( val )
   {
      let d = this.maxValue - this.minValue;
      let newValue = Math.roundTo(
         this.parent.lowerBound + (this.parent.upperBound - this.parent.lowerBound)*((val - this.minValue)/d),
         this.parent.real ? Math.max( 0, Math.trunc( Math.log10( d ) ) ) : 0 );

      if ( newValue != this.parent.value )
      {
         this.parent.setValue( newValue );
         if ( this.parent.onValueUpdated )
            this.parent.onValueUpdated( this.parent.value );
      }
   };

   this.sizer.add( this.slider, 100 );
   this.adjustToContents();

   // Override NumericEdit.updateControls
   this.updateEditControls = this.updateControls;
   this.updateControls = function()
   {
      this.updateEditControls();
      this.slider.value = this.slider.minValue +
               Math.round( (this.value - this.lowerBound)/(this.upperBound - this.lowerBound)*
                           (this.slider.maxValue - this.slider.minValue) );
   };
}

NumericControl.prototype = new NumericEdit;

// ----------------------------------------------------------------------------

#endif   // __PJSR_NumericControl_jsh

// ----------------------------------------------------------------------------
// EOF pjsr/NumericControl.jsh - Released 2017-08-01T14:29:08Z
