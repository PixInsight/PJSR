//     ____       __ _____  ____
//    / __ \     / // ___/ / __ \
//   / /_/ /__  / / \__ \ / /_/ /
//  / ____// /_/ / ___/ // _, _/   PixInsight JavaScript Runtime
// /_/     \____/ /____//_/ |_|    PJSR Version 1.0
// ----------------------------------------------------------------------------
// pjsr/NumericControl.jsh - Released 2018-11-30T21:30:58Z
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
   this.fixed = false;
   this.scientific = false;
   this.sciTriggerExp = -1;
   this.autoEditWidth = true;
   this.onValueUpdated = null;

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

   this.setValue = function( value )
   {
      this.value = Math.range( this.real ? value : Math.round( value ), this.lowerBound, this.upperBound );
      this.updateControls();
   };

   this.updateControls = function()
   {
      this.edit.text = this.valueAsString( this.value );
   };

   this.valueAsString = function( value )
   {
      value = Math.range( value, this.lowerBound, this.upperBound );

      if ( this.real )
      {
         if ( this.scientific )
            if ( this.sciTriggerExp < 0 || value != 0 && (Math.abs( value ) > Math.pow10( +this.sciTriggerExp ) ||
                                                          Math.abs( value ) < Math.pow10( -this.sciTriggerExp )) )
               return format( "%.*e", this.precision, value );

         return format( "%.*f", this.precisionForValue( this.precision, value ), value );
      }

      return format( "%.0f", value );
   };

   this.minEditWidth = function()
   {
      let n = Math.trunc( Math.max( this.valueAsString( this.lowerBound ).length,
                                    this.valueAsString( this.upperBound ).length ) );
      return this.edit.font.width( '0'.repeat( n+1 ) ) + this.logicalPixelsToPhysical( 1+2+2+1 );
   };

   this.adjustEditWidth = function()
   {
      this.edit.setFixedWidth( this.minEditWidth() );
      this.adjustToContents();
   };

   this.setReal = function( real )
   {
      if ( this.real != real )
      {
         this.real = real;
         if ( !this.real )
            this.value = Math.round( this.value );
         if ( this.autoEditWidth )
            this.adjustEditWidth();
         this.setValue( this.value );
      }
   };

   this.setRange = function( lr, ur )
   {
      this.lowerBound = Math.min( lr, ur );
      this.upperBound = Math.max( lr, ur );
      if ( this.autoEditWidth )
         this.adjustEditWidth();
      this.setValue( this.value );
   };

   this.setPrecision = function( precision )
   {
      this.precision = Math.range( precision, 0, 15 );
      if ( this.autoEditWidth )
         this.adjustEditWidth();
      this.updateControls();
   };

   this.enableFixedPrecision = function( enable )
   {
      this.fixed = enable;
      if ( this.autoEditWidth )
         this.adjustEditWidth();
      this.updateControls();
   };

   this.enableScientificNotation = function( enable )
   {
      this.scientific = enable;
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

   this.precisionForValue = function( precision, value )
   {
      if ( !this.fixed )
      {
         value = Math.abs( value );
         if ( value >= 10 )
            return Math.max( 0, precision - Math.max( 0, Math.trunc( Math.log10( value ) ) ) )|0;
      }
      return precision;
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
            newValue = this.edit.text.toNumber();
            newValue = Math.roundTo( newValue, this.precisionForValue( this.precision, newValue ) );
         }
         else
            newValue = this.edit.text.toInt();

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

   this.exponential = false;

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
   this.slider.onValueUpdated = function( sliderValue )
   {
      let newValue = this.parent.sliderValueToControl( sliderValue );
      if ( newValue != this.parent.value )
      {
         this.parent.value = newValue;
         this.parent.edit.text = this.parent.valueAsString( newValue );
         if ( this.parent.onValueUpdated )
            this.parent.onValueUpdated( newValue );
      }
   };

   this.sizer.add( this.slider, 100 );
   this.adjustToContents();

   this.sliderValueToControl = function( sliderValue )
   {
      let sliderMinValue = this.slider.minValue;
      let sliderMaxValue = this.slider.maxValue;
      let sliderDelta = sliderMaxValue - sliderMinValue;
      let sliderNormValue = (sliderValue - sliderMinValue)/sliderDelta;
      return Math.range( Math.roundTo( this.exponential ?
                                 (1 + this.lowerBound)*Math.exp( Math.ln( (1 + this.upperBound)/(1 + this.lowerBound) )*sliderNormValue ) - 1 :
                                 this.lowerBound + (this.upperBound - this.lowerBound)*sliderNormValue,
                              this.real ? Math.max( 0, Math.trunc( Math.log10( sliderDelta ) ) ) : 0 ), this.lowerBound, this.upperBound );
   };

   this.controlValueToSlider = function( value )
   {
      let sliderMinValue = this.slider.minValue;
      let sliderMaxValue = this.slider.maxValue;
      let sliderDelta = sliderMaxValue - sliderMinValue;
      return Math.range( Math.round( sliderMinValue + sliderDelta*(this.exponential ?
                                 Math.ln( (1 + value)/(1 + this.lowerBound) )/Math.ln( (1 + this.upperBound)/(1 + this.lowerBound) ) :
                                 (value - this.lowerBound)/(this.upperBound - this.lowerBound)) ),
                              sliderMinValue, sliderMaxValue );
   };

   // Override NumericEdit.updateControls
   this.updateEditControls = this.updateControls;
   this.updateControls = function()
   {
      this.updateEditControls();
      this.slider.value = this.controlValueToSlider( this.value );
   };
}

NumericControl.prototype = new NumericEdit;

// ----------------------------------------------------------------------------

#endif   // __PJSR_NumericControl_jsh

// ----------------------------------------------------------------------------
// EOF pjsr/NumericControl.jsh - Released 2018-11-30T21:30:58Z
