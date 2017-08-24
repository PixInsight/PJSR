// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// pjsr/ExtractWaveletLayers.js - Released 2010/12/14 15:27:33 UTC
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
 * ExtractWaveletLayers v1.0
 *
 * A utility script that splits the selected image into a number of  wavelet
 * layers. Each wavelet layer is provided as a new image  window that is
 * generated dynamically. The user can select the  number of wavelet layers to
 * extract and the wavelet scaling function used to perform the wavelet
 * decomposition.
 *
 * Copyright (C) 2009 Pleiades Astrophoto S.L.
 * Written by Juan Conejero (PTeam)
 */

#feature-id    Image Analysis > ExtractWaveletLayers

#feature-info  A utility script that splits the selected image into a number of \
               wavelet layers. Each wavelet layer is provided as a new image \
               window that is generated dynamically. The user can select the \
               number of wavelet layers to extract and the wavelet scaling \
               function used to perform the wavelet decomposition.

#feature-icon  ExtractWaveletLayers.xpm

#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/StdCursor.jsh>
#include <pjsr/UndoFlag.jsh>

#define VERSION "1.0"
#define TITLE "ExtractWaveletLayers"

/**
 * Scaling functions
 *
 * A wavelet scaling function can be any positive function discretized on a
 * square filter kernel.
 */
function ScalingFunction( kernel, name )
{
   this.kernel = kernel;
   this.name = name;
}

var scalingFunctions = new Array;

scalingFunctions[0] = new ScalingFunction( [ 0.29289322, 0.5, 0.29289322,
                                             0.5,        1.0, 0.5,
                                             0.29289322, 0.5, 0.29289322 ],
                                           "3x3 Linear Interpolation" );

scalingFunctions[1] = new ScalingFunction( [ 1/256, 1/64, 3/128, 1/64, 1/256,
                                             1/64,  1/16, 3/32,  1/16, 1/64,
                                             3/128, 3/32, 9/64,  3/32, 3/128,
                                             1/64,  1/16, 3/32,  1/16, 1/64,
                                             1/256, 1/64, 3/128, 1/64, 1/256 ],
                                           "5x5 B3 Spline" );

/**
 * Performs a wavelet decomposition and extracts the resulting wavelet layers
 * as a set of independent images.
 *
 * The data argument provides operating parameters:
 *
 * data.targetView         The image that will be decomposed.
 *
 * data.scalingFunction    Index of a wavelet scaling function in the global
 *                   scalingFunctions array.
 *
 * data.numberOfLayers     Number of wavelet layers (numberOfLayers >= 1). The
 *                   routine can generate n+1 images for the n detail layers
 *                   plus the large-scale residual layer.
 *
 * data.extractResidual    Whether to extract or not the large-scale residual
 *                   layer. If this member is true, the routine will generate
 *                   n+1 images, for the n detail layers plus the large-scale
 *                   residual layer. If this member is false, only n detail
 *                   layer images will be generated.
 */
function ExtractWaveletLayers( data )
{
   // Get access to the target view's image.
   var image = data.targetView.image;

   // Perform a wavelet transform with the specified scaling function and
   // number of layers. W will be assigned with an array of images
   // corresponding to the generated wavelet layers.
   var W = image.aTrousWaveletTransform( scalingFunctions[data.scalingFunction].kernel,
                                         data.numberOfLayers );

   // Actual number of layer images that will be generated.
   var n = data.numberOfLayers;
   if ( !data.extractResidual )
      --n;

   // Extract wavelet layers. Layer j = data.numberOfLayers is the residual
   // large-scale image. For j < n, we have detail wavelet layers.
   for ( var j = 0; j <= n; ++j )
   {
      // Identifier of the layer image
      var id = (j < data.numberOfLayers) ? format( "layer%02d", j ) : "residual";

      // New window for this layer image.
      // Initially, we create a one-pixel grayscale image (1x1x1).
      var window = new ImageWindow( 1, 1, 1, 32, true, false, id );

      // The main view of this image window
      var view = window.mainView;

      // Inform the core application that we are going to modify this view's
      // image. UndoFlag_NoSwapFile avoids generation of a swap file. Since we
      // are working with a new image, a swap file is not needed because we
      // don't want to undo anything for this window.
      view.beginProcess( UndoFlag_NoSwapFile );

      // Transfer the image corresponding to the j-th wavelet layer to the main
      // view of this image window.
      view.image.transfer( W[j] );

      // Rescale detail layers to the normalized [0,1] range. This is necessary
      // because detail wavelet layers contain wavelet difference coefficients
      // that can be positive or negative real values outside the [0,1] range
      // in absolute value. This script is for visualization purposes.
      if ( j < n )
         view.image.rescale();

      // Inform the core application that we have finished processing the view.
      view.endProcess();

      // Show the image window.
      window.show();

      // Ensure that the whole image is visible on the workspace.
      window.zoomToFit();
   }
}

/**
 * The ExtractWaveletLayersData object defines functional parameters for the
 * ExtractWaveletLayers routine.
 */
function ExtractWaveletLayersData()
{
   // Get access to the active image window
   var window = ImageWindow.activeWindow;

   if ( !window.isNull )
   {
      this.targetView = window.currentView;
      this.numberOfLayers = 5;
      this.scalingFunction = 1; // B3 Spline
      this.extractResidual = true;
   }
}

// Global ExtractWaveletLayers parameters.
var data = new ExtractWaveletLayersData;

/**
 * ExtractWaveletLayersDialog is a graphical user interface to define
 * ExtractWaveletLayers parameters.
 */
function ExtractWaveletLayersDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   var emWidth = this.font.width( 'M' );
   var labelWidth1 = this.font.width( "Number of layers:" );

   this.helpLabel = new Label( this );
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.margin = this.logicalPixelsToPhysical( 4 );
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = "<p><b>" + TITLE + " v" + VERSION + "</b> &mdash; A script that splits an image into " +
      "a number of <i>wavelet layers</i>. Each wavelet layer is provided as a new image " +
      "window generated dynamically. This script does not modify the target image.</p>";

   this.targetImage_Label = new Label( this );
   this.targetImage_Label.text = "Target image:";
   this.targetImage_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.targetImage_Label.minWidth = labelWidth1;

   this.targetImage_ViewList = new ViewList( this );
   this.targetImage_ViewList.scaledMinWidth = 300;
   this.targetImage_ViewList.getAll(); // include main views as well as previews
   this.targetImage_ViewList.currentView = data.targetView;
   this.targetImage_ViewList.onViewSelected = function( view )
   {
      data.targetView = view;
   };

   this.targetImage_Sizer = new HorizontalSizer;
   this.targetImage_Sizer.spacing = 4;
   this.targetImage_Sizer.add( this.targetImage_Label );
   this.targetImage_Sizer.add( this.targetImage_ViewList, 100 );

   this.numberOfLayers_Label = new Label( this );
   this.numberOfLayers_Label.text = "Number of layers:";
   this.numberOfLayers_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.numberOfLayers_Label.minWidth = labelWidth1;

   this.numberOfLayers_SpinBox = new SpinBox( this );
   this.numberOfLayers_SpinBox.minValue = 1;
   this.numberOfLayers_SpinBox.maxValue = 10;
   this.numberOfLayers_SpinBox.value = data.numberOfLayers;
   this.numberOfLayers_SpinBox.toolTip = "<p>Number of wavelet layers that will be extracted as new images.</p>";
   this.numberOfLayers_SpinBox.onValueUpdated = function( value )
   {
      data.numberOfLayers = value;
   };

   this.extractResidual_CheckBox = new CheckBox( this );
   this.extractResidual_CheckBox.text = "Extract residual layer";
   this.extractResidual_CheckBox.checked = data.extractResidual;
   this.extractResidual_CheckBox.toolTip = "<p>If checked, the large-scale residual layer will also be extracted.</p>";
   this.extractResidual_CheckBox.onCheck = function( checked )
   {
      data.extractResidual = checked;
   };

   this.numberOfLayers_Sizer = new HorizontalSizer;
   this.numberOfLayers_Sizer.spacing = 4;
   this.numberOfLayers_Sizer.add( this.numberOfLayers_Label );
   this.numberOfLayers_Sizer.add( this.numberOfLayers_SpinBox );
   this.numberOfLayers_Sizer.addSpacing( 12 );
   this.numberOfLayers_Sizer.add( this.extractResidual_CheckBox );
   this.numberOfLayers_Sizer.addStretch();

   this.scalingFunction_Label = new Label( this );
   this.scalingFunction_Label.text = "Scaling function:";
   this.scalingFunction_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.scalingFunction_Label.minWidth = labelWidth1;

   this.scalingFunction_ComboBox = new ComboBox( this );
   for ( var i = 0; i < scalingFunctions.length; ++i )
      this.scalingFunction_ComboBox.addItem( scalingFunctions[i].name );
   this.scalingFunction_ComboBox.currentItem = data.scalingFunction;
   this.scalingFunction_ComboBox.toolTip = "<p>Select a scaling function to perform the wavelet decomposition.</p>";
   this.scalingFunction_ComboBox.onItemSelected = function( index )
   {
      data.scalingFunction = index;
   };

   this.scalingFunction_Sizer = new HorizontalSizer;
   this.scalingFunction_Sizer.spacing = 4;
   this.scalingFunction_Sizer.add( this.scalingFunction_Label );
   this.scalingFunction_Sizer.add( this.scalingFunction_ComboBox, 100 );

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
   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add( this.helpLabel );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.targetImage_Sizer );
   this.sizer.add( this.numberOfLayers_Sizer );
   this.sizer.add( this.scalingFunction_Sizer );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = TITLE + " Script";
   this.adjustToContents();
   this.setFixedSize();
}

// Our dialog inherits all properties and methods from the core Dialog object.
ExtractWaveletLayersDialog.prototype = new Dialog;

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

   var dialog = new ExtractWaveletLayersDialog();
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

      // Call the layer extraction routine.
      ExtractWaveletLayers( data );

      // Quit after successful execution.
      break;
   }
}

main();

// ****************************************************************************
// EOF pjsr/ExtractWaveletLayers.js - Released 2010/12/14 15:27:33 UTC
