// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// GUIFactory-lib.js - Released 2015/11/30 00:00:00 UTC
// ----------------------------------------------------------------------------
//
// This file is part of BatchStatistics Script version 1.2.2
//
// Copyright (C) 2014-2015 Ian Lauwerys. (www.blackwaterskies.co.uk)
//
// Based on BatchFormatConversion.js, NoiseEvaluation.js and other work.
// Copyright (c) 2009-2014 Pleiades Astrophoto S.L.
// Written by Juan Conejero (PTeam)
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
   1.2.2: Bug fix release
   1.2.1: Bug fix release
   1.2:   Third (full) release.
   1.1:   Second (full) release.
   1.0b:  First (beta) release.
*/

// ========= # defines / includes ==============================================

#ifndef GUIFactory_lib_js
#define GUIFactory_lib_js
#endif

// Define as true for debug messages to console.
#ifndef DEBUGGING_MODE_ON
#define DEBUGGING_MODE_ON false
#endif

// Includes.
#ifndef __PJSR_FrameStyle_jsh
#include <pjsr/FrameStyle.jsh>
#endif
#ifndef __PJSR_TextAlign_jsh
#include <pjsr/TextAlign.jsh>
#endif
#ifndef __PJSR_NumericControl_jsh
#include <pjsr/NumericControl.jsh>
#endif
#ifndef __PJSR_Sizer_jsh
#include <pjsr/Sizer.jsh>
#endif
#ifndef __PJSR_SectionBar_jsh
#include <pjsr/SectionBar.jsh>
#endif

// ======== # Factory classes =======================================================

/// @class Factory for creating UI widgets.
///
function GUIFactory()
{
   if ( DEBUGGING_MODE_ON )
   {
      console.noteln( "{ GUIFactory" );
   }

   /// Method to create a new label.
   ///
   /// @param {object} parent UI object to which this widget belongs.
   /// @param {string} labelText string to be shown in the label.
   /// @param {integer} frameStyle optional frame style from FrameStyle.jsh.
   /// @param {integer} margin optional margin in pixels.
   /// @param {boolean} wordWrapping optional true to word wrap.
   /// @param {boolean} useRchText optional true to use rich text.
   /// @param {integer} textalignment optional text alignment options from TextAlign.jsh ORed together.
   /// @param {integer} minWidth optional minimum label width for alignment purposes.
   /// @param {string} toolTip optional string to be shown in the label tooltip.
   this.fullLabel = function( parent, labelText, frameStyle, margin, wordWrapping, useRichText, textAlignment, minWidth, toolTip )
   {
      var widget = new Label( parent );
      widget.text = labelText;
      if ( typeof frameStyle !== 'undefined' && frameStyle != null ) { widget.frameStyle = frameStyle; }
      if ( typeof margin !== 'undefined' && margin != null ) { widget.margin = widget.logicalPixelsToPhysical( margin ); }
      if ( typeof wordWrapping !== 'undefined' && wordWrapping != null ) { widget.wordWrapping = wordWrapping; }
      if ( typeof useRichText !== 'undefined' && useRichText != null ) { widget.useRichText = useRichText; }
      if ( typeof textAlignment !== 'undefined' | textAlignment != null ) { widget.textAlignment = textAlignment; }
      if ( typeof minWidth !== 'undefined' && minWidth != null ) { widget.setScaledMinWidth( minWidth ); }
      if ( typeof toolTip !== 'undefined' && toolTip != null ) { widget.toolTip = toolTip; }

      return widget;
   }

   /// Method to create a new default help label.
   ///
   /// @param {object} parent UI object to which this widget belongs.
   /// @param {string} labelText rich text string to be shown in the help label.
   this.defaultHelpLabel = function( parent, labelText )
   {
      return this.fullLabel( parent, labelText, FrameStyle_Box, 4, true, true )
   }

   /// Method to create a new default label.
   ///
   /// @param {object} parent UI object to which this widget belongs.
   /// @param {string} labelText string to be shown in the label.
   /// @param {integer} minWidth optional minimum label width for alignment purposes.
   this.defaultLabel = function( parent, labelText, minWidth )
   {
      return this.fullLabel( parent, labelText, null, null, null, null, TextAlign_Right | TextAlign_VertCenter, minWidth );
   }

   /// Method to create a new pushbutton.
   ///
   /// @param {object} parent UI object to which this widget belongs.
   /// @param (string) buttonText optional string to be shown on the button.
   /// @param {string} buttonIcon optional string to icon (from PI resource file).
   /// @param {string} toolTip optional string to be shown in the pushbutton tooltip.
   this.fullPushButton = function( parent, buttonText, buttonIcon, toolTip )
   {
      var widget = new PushButton( parent );
      if ( typeof buttonText !== 'undefined' && buttonText != null ) { widget.text = buttonText; }
      if ( typeof buttonIcon !== 'undefined' && buttonIcon != null ) { widget.icon = new Bitmap( buttonIcon ); }
      if ( typeof toolTip !== 'undefined' && toolTip != null ) { widget.toolTip = toolTip; }

      return widget;
   }

   /// Method to create a new pushbutton of a type considered 'special' on Mac OSX, e.g. OK or Cancel.
   ///
   /// @param {object} parent UI object to which this widget belongs.
   /// @param (string) buttonText optional string to be shown on the button.
   /// @param {string} buttonIcon optional string to icon (from PI resource file), ignored on Mac OSX.
   /// @param {string} toolTip optional string to be shown in the pushbutton tooltip.
   this.specialPushButton = function( parent, buttonText, buttonIcon, toolTip )
   {
      var widget = new PushButton( parent );
      if ( typeof buttonText !== 'undefined' && buttonText != null ) { widget.text = buttonText; }
      if ( typeof buttonIcon !== 'undefined' && buttonIcon != null ) { widget.icon = new Bitmap( buttonIcon ); }
      if ( typeof toolTip !== 'undefined' && toolTip != null ) { widget.toolTip = toolTip; }

      return widget;
   }

   /// Method to create a new tool button.
   ///
   /// @param {object} parent UI object to which this widget belongs.
   /// @param {string} buttonIcon optional string to icon (from PI resource file).
   /// @param {string} toolTip optional string to be shown in the tool button tooltip.
   this.fullToolButton = function( parent, buttonIcon, toolTip )
   {
      var widget = new ToolButton( parent );
      if ( typeof buttonIcon !== 'undefined' && buttonIcon != null ) { widget.icon = new Bitmap( buttonIcon ); }
      if ( typeof toolTip !== 'undefined' && toolTip != null ) { widget.toolTip = toolTip; }

      return widget;
   }

   /// Method to create a new checkbox.
   ///
   /// @param {object} parent UI object to which this widget belongs.
   /// @param (string) checkboxText string to be shown next to the checkbox.
   /// @param {boolean} checkboxState true if checked, false if not.
   /// @param {string} toolTip optional string to be shown in the checkbox tooltip.
   this.fullCheckBox = function( parent, checkboxText, checkboxState, toolTip )
   {
      var widget = new CheckBox( parent );
      widget.text = checkboxText;
      widget.checked = checkboxState;
      if ( typeof toolTip !== 'undefined' && toolTip != null ) { widget.toolTip = toolTip; }

      return widget;
   }

   /// Method to create a new combo box.
   ///
   /// @param {object} parent UI object to which this widget belongs.
   /// @param {array} comboItems optional non-sparse array of string items to add to the combo box.
   /// @param {integer} selectedItem optional selected combo item.
   /// @param {string} toolTip optional string to be shown in the Combo tooltip.
   this.fullComboBox = function( parent, comboItems, selectedItem, toolTip )
   {
      var widget = new ComboBox( parent );
      if ( typeof comboItems !== 'undefined' && comboItems != null ) {
         for (var i = 0; i < comboItems.length; ++i)
         {
            widget.addItem( comboItems[i] );
         }
      }
      if ( typeof selectedItem !== 'undefined' && selectedItem != null ) { widget.currentItem = selectedItem; }
      if ( typeof toolTip !== 'undefined' && toolTip != null ) { widget.toolTip = toolTip; }

      return widget;
   }

   /// Method to create a new tree box with a single column and default settings.
   ///
   /// @param {object} parent UI object to which this widget belongs.
   /// @param {array} treeBoxItems optional non-sparse array of string items to add to the combo box.
   /// @param {integer} minSizeW optional minimum tree box width.
   /// @param {integer} minSizeH optional minimum tree box height.
   /// @param {string} toolTip optional string to be shown in the TreeBox tooltip.
   this.simpleTreeBox = function( parent, treeBoxItems, minSizeW, minSizeH, toolTip )
   {
      var widget = new TreeBox( parent );
      widget.multipleSelection = true;
      widget.rootDecoration = false;
      widget.alternateRowColor = true;
      widget.numberOfColumns = 1;
      widget.headerVisible = false;
      if ( typeof minSizeW !== 'undefined' && minSizeW == null && typeof minSizeH !== 'undefined' && minSizeH == null )
      {
         widget.setScaledMinSize( minSizeW, minSizeH );
      }
      if ( typeof treeBoxItems !== 'undefined' && treeBoxItems != null ) {
         for ( var i = 0; i < treeBoxItems.length; ++i )
         {
            var node = new TreeBoxNode( widget );
            node.setText( 0, this.treeBoxItems[i] );
         }
      }
      if ( typeof toolTip !== 'undefined' && toolTip != null ) { widget.toolTip = toolTip; }

      return widget;
   }

   /// Method to create a new numeric control (input with slider).
   ///
   /// @param {object} parent UI object to which this widget belongs.
   /// @param {number} initialValue initial value of numeric control.
   /// @param {boolean} isReal true if control to use real numbers, false if integer.
   /// @param {integer} optional precision precision of real numbers 0..15 digits.
   /// @param {integer} rangeLow lowest allowed value in control.
   /// @param {integer} rangeHigh highest allowed value in control.
   /// @param {integer} sliderLow lowest slider value - interacts with sliderHigh and sliderMinWidth.
   /// @param {integer} sliderHigh highest slider value - interacts with sliderLow and sliderMinWidth.
   /// @param {integer} sliderMinWidth highest slider value - interacts with sliderLow and sliderHigh.
   /// @param {string} optional labelText string to be shown in the label.
   /// @param {integer} minWidth optional minimum label width for alignment purposes.
   /// @param {string} toolTip optional string to be shown in the TreeBox tooltip.
   this.fullNumericControl = function( parent, initialValue, isReal, precision, rangeLow, rangeHigh, sliderLow, sliderHigh, sliderMinWidth, labelText, minWidth, toolTip )
   {
      var widget = new NumericControl( parent );
      widget.setReal( isReal );
      if ( typeof precision !== 'undefined' && precision != null ) { widget.setPrecision( precision ); }
      widget.setRange( rangeLow, rangeHigh );
      widget.slider.setRange( sliderLow, sliderHigh );
      widget.slider.minWidth = sliderMinWidth;
      if ( typeof minWidth !== 'undefined' && minWidth != null ) { widget.label.minWidth = minWidth; }
      if ( typeof labelText !== 'undefined' && labelText != null ) { widget.label.text = labelText; }
      if ( typeof toolTip !== 'undefined' && toolTip != null ) { widget.toolTip = toolTip; }
      widget.setValue( initialValue );

      return widget;
   }

   /// Method to create a new edit box.
   ///
   /// @param {object} parent UI object to which this widget belongs.
   /// @param (string) editText optional default value in the edit box.
   /// @param {boolean} optional editBoxReadOnly true if edit box is read only, false if not.
   /// @param {string} toolTip optional string to be shown in the edit box tooltip.
   this.editBox = function( parent, editText, editBoxReadOnly, toolTip )
   {
      var widget = new Edit( parent );
      if ( typeof editText !== 'undefined' && editText != null ) { widget.text = editText; }
      if ( typeof editBoxReadOnly !== 'undefined' && editBoxReadOnly != null ) { widget.readOnly = editBoxReadOnly };
      if ( typeof toolTip !== 'undefined' && toolTip != null ) { widget.toolTip = toolTip; }

      return widget;
   }

   /// Method to create a new spin box.
   ///
   /// @param {object} parent UI object to which this widget belongs.
   /// @param (integer) spinboxValue default value in the spin box.
   /// @param {integer} spinboxMinValue minimum value for the spin box.
   /// @param {integer} spinboxMaxValue maximum value for the spin box.
   /// @param {integer} toolTip optional string to be shown in the spin box tooltip.
   this.spinBox = function( parent, spinboxValue, spinboxMinValue, spinboxMaxValue, toolTip )
   {
      var widget = new SpinBox( parent );
      widget.minValue = spinboxMinValue;
      widget.maxValue = spinboxMaxValue;
      widget.value = spinboxValue;
      if ( typeof toolTip !== 'undefined' && toolTip != null ) { widget.toolTip = toolTip; }

      return widget;
   }

   /// Method to create a new section bar.
   /// Described here: http://pixinsight.com/forum/index.php?topic=5443.msg37410#msg37410
   ///
   /// @param {object} parent UI object to which this widget belongs.
   /// @param (string) title optional title to be shown on the section bar.
   /// @param (boolean) hasCheckBox optional if true section bar has a checkbox.
   this.sectionBar = function( parent, title, hasCheckBox )
   {
      var widget = new SectionBar( parent );
      if ( typeof title !== 'undefined' && title != null ) { widget.setTitle( title ); }
      if ( typeof hasCheckBox !== 'undefined' && hasCheckBox ) { widget.enableCheckBox(); }

      return widget;
   }

   /// Method to create a new group box.
   ///
   /// @param {object} parent UI object to which this widget belongs.
   /// @param (string) title optional title to be shown on the group box.
   /// @param {integer} toolTip optional string to be shown in the group box tooltip.
   this.groupBox = function( parent, title, toolTip )
   {
      var widget = new GroupBox( parent );
      if ( typeof title !== 'undefined' && title != null ) { widget.title = title; }
      if ( typeof toolTip !== 'undefined' && toolTip != null ) { widget.toolTip = toolTip; }

      return widget;
   }

   if ( DEBUGGING_MODE_ON )
   {
      console.noteln( "} GUIFactory" );
   }

} // class GUIFactory

// ----------------------------------------------------------------------------
// EOF GUIFactory-lib.js - Released 2015/11/30 00:00:00 UTC
