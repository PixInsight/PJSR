// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// FFTRegistration.js - Released 2017-09-18T09:18:17Z
// ----------------------------------------------------------------------------
//
// This file is part of FFTRegistration Script version 1.21
//
// Copyright (c) 2005-2017 Pleiades Astrophoto S.L.
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
 * FFTRegistration v1.21
 *
 * Fourier-based image registration.
 *
 * Copyright (C) 2005-2017 Pleiades Astrophoto S.L.
 * Written by Juan Conejero (PTeam)
 *
 * References:
 *
 * - Araiza, R., Xie, H. & al., 2002. Automatic referencing of multi-spectral
 *   images. Proceedings of 15th IEEE Southwest Symposium on Image Analysis and
 *   Interpretation, Santa Fe, USA, 21-25.
 *
 * - Xie, H. & al., 2000. Automatic image registration based on a FFT algorithm
 *   and IDL/ENVI. Proceedings of the ICORG-2000 International Conference on
 *   Remote Sensing and GIS/GPS, Hyderabad, India, I-397~I-402.
 *
 * - Harold S., Stone T. & al., 2003. Analysis of image registration noise due
 *   to rotationally dependent aliasing. Journal of Visual Communication and
 *   Image Representation 14, 114-135.
 *
 * - DeCastro, E., Morandi, C., 1987. Registration of translated and rotated
 *   images using finite Fourier transforms. IEEE Transactions on Pattern
 *   Analysis and Machine Intelligence 95, 700-703.
 */

#feature-id    Utilities > FFTRegistration

#feature-info \
FFT-based image registration with corrections for translation, rotation and \
scaling. This script provides a graphical interface where the user can select \
a reference image and a set of target images. Target images are registered with \
respect to the reference image. Registered images can optionally be written to \
disk files and/or averaged with the reference image to form an integrated result.<br>\
<br>\
Written by Juan Conejero (PTeam).<br>\
<br>\
References:<br>\
<br>\
* Araiza, R., Xie, H. & al., 2002. Automatic referencing of multi-spectral \
  images. Proceedings of 15th IEEE Southwest Symposium on Image Analysis and \
  Interpretation, Santa Fe, USA, 21-25.<br>\
<br>\
* Xie, H. & al., 2000. Automatic image registration based on a FFT algorithm \
  and IDL/ENVI. Proceedings of the ICORG-2000 International Conference on \
  Remote Sensing and GIS/GPS, Hyderabad, India, I-397~I-402.<br>\
<br>\
* Harold S., Stone T. & al., 2003. Analysis of image registration noise due \
  to rotationally dependent aliasing. Journal of Visual Communication and \
  Image Representation 14, 114-135.<br>\
<br>\
* DeCastro, E., Morandi, C., 1987. Registration of translated and rotated \
  images using finite Fourier transforms. IEEE Transactions on Pattern \
  Analysis and Machine Intelligence 95, 700-703.<br>\
<br>\
Copyright &copy; 2005-2017 Pleiades Astrophoto S.L.

#feature-icon  FFTRegistration.xpm

#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/NumericControl.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/ImageOp.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/Interpolation.jsh>

#define VERSION "1.21"
#define TITLE "FFTRegistration"

/*
 * Gradient operator
 */

// Kroon's optimized 5x5 filter
// Dirk-Jan Kroon, 2009, Numerical Optimization of Kernel Based Image Derivatives.
var Derivative_Filter = new Matrix(
   [+0.0007, +0.0052, +0.0370, +0.0052, +0.0007,
    +0.0037, +0.1187, +0.2589, +0.1187, +0.0037,
     0,       0,       0,       0,       0,
    -0.0037, -0.1187, -0.2589, -0.1187, -0.0037,
    -0.0007, -0.0052, -0.0370, -0.0052, -0.0007], 5, 5 );

var Derivative_Filter_tr = Derivative_Filter.transpose();

Image.prototype.gradient = function()
{
   // Working images
   var Ix = new Image;
   this.getIntensity( Ix );

   // Fill black areas with the median value to prevent detection of rotated
   // image borders in the gradient.
   var m = Ix.median();
   Ix.initSampleIterator();
   do
      if ( Ix.sampleValue() == 0 )
         Ix.setSampleValue( m );
   while ( Ix.nextSample() );

   var Iy = new Image( Ix );

   // Derivative in the X direction
   Ix.convolve( Derivative_Filter );
   // Ix = Ix^2
   Ix.apply( Ix, ImageOp_Mul );

   // Derivative in the Y direction
   Iy.convolve( Derivative_Filter_tr );
   // Iy = Iy^2
   Iy.apply( Iy, ImageOp_Mul );

   // Ix = Ix^2 + Iy^2
   Ix.apply( Iy, ImageOp_Add );

   // Ix = (Ix^2 + Iy^2)^0.5
   Ix.apply( 0.5, ImageOp_Pow );

   Ix.rescale();

#ifdef __DEBUG__
   this.count = 0;
   if ( this.count == 0 )
   {
      var w = new ImageWindow( Ix.width, Ix.height, 1, 32, true, false, "Gradient" );
      var v = w.mainView;
      v.beginProcess( UndoFlag_NoSwapFile );
      v.image.apply( Ix );
      v.endProcess();
      w.show();
   }
#endif

   return Ix;
};

Image.prototype.binarized = function()
{
   var I = new Image( this );
   I.binarize();
   return I;
};

/*
 * FFT Registration: Translation
 */

function FFTTranslation()
{
   this.width                  = 0;
   this.height                 = 0;
   this.size                   = 0;
   this.allowLargeTranslations = false;
   this.c0                     = null;
   this.dx                     = 0;
   this.dy                     = 0;
   this.count                  = 0;

   /*
    * Perform the DFT of the reference and target images.
    */
   this.fft = function( image )
   {
      var C = Image.newComplexImage();
      C.allocate( this.size, this.size );
      C.fill( 0 );
      C.apply( image.gradient(), ImageOp_Mov,
               new Point( (this.size - image.selectedRect.width) >> 1,
                          (this.size - image.selectedRect.height) >> 1 ) );
      C.FFT();

      /*
       * In the current PixInsight platform, the FFT has the freedom to change
       * the dimensions of the transformed image, for optimization purposes. We
       * must keep track of the possibly changed size at this point.
       */
      this.size = C.width;

      return C;
   };

   /*
    * Initialization of the FFT translation engine.
    */
   this.initialize = function( image )
   {
      console.writeln( "<end><cbr><b>* Initializing FFT translation:</b>" );

      this.width = image.selectedRect.width;
      this.height = image.selectedRect.height;

      // We work with square matrices
      this.size = Math.max( this.width, this.height );

      // Double dimensions to allow for translations >= size/2
      if ( this.allowLargeTranslations )
         this.size <<= 1;

      this.c0 = this.fft( image );
   };

   /*
    * Evaluation of translation corrections.
    */
   this.evaluate = function( image )
   {
      console.writeln( "<end><cbr><b>* Evaluating FFT translation:</b>" );
      console.flush();

      // DFT of target image
      var c1 = this.fft( image );

      // Evaluate the cross power spectrum matrix (CPSM)
      var P = Image.crossPowerSpectrumMatrix( this.c0, c1 );
      //var P = Image.phaseCorrelationMatrix( this.c0, c1 );

      c1.free(); // c1 no longer needed

      // Inverse DFT of the CPSM
      P.inverseFFT();

      // Normalized absolute value of CPSM
      var R = Image.newFloatImage();
      R.assign( P );
      R.rescale();

      P.free(); // P is no longer needed

#ifdef __DEBUG__
      if ( this.count == 0 )
      {
         var w = new ImageWindow( R.width, R.height, 1, 16, false, false, "TPCM" );
         var v = w.mainView;
         v.beginProcess( UndoFlag_NoSwapFile );
         v.image.apply( R );
         v.image.rescale();
         v.endProcess();
         w.show();
      }
#endif

      // Location of the PCM peak value
      var p = R.maximumPosition();

      /*
       * We interpolate the coordinates of the maximum peak in the phase matrix
       * from a square neighborhood of nine pixels centered at the maximum
       * location.
       */

      var p0 = new Point( (p.x > 0) ? p.x-1 : this.size-1, (p.y > 0) ? p.y-1 : this.size-1 );
      var p1 = new Point( (p.x < this.size-1) ? p.x+1 : 0, (p.y < this.size-1) ? p.y+1 : 0 );

      var f00 = 0.7071*R.sample( p0.x, p0.y );
      var f01 =        R.sample( p.x,  p0.y );
      var f02 = 0.7071*R.sample( p1.x, p0.y );

      var f10 =        R.sample( p0.x, p.y );
    //var f11 =      0*R.sample( p.x,  p.y );  // = 1 due to normalization of sample values
      var f12 =        R.sample( p1.x, p.y );

      var f20 = 0.7071*R.sample( p0.x, p1.y );
      var f21 =        R.sample( p.x,  p1.y );
      var f22 = 0.7071*R.sample( p1.x, p1.y );

      R.free();  // R is no longer needed

      // Interpolate horizontal and vertical displacements
      this.dx = p.x - f00 - f10 - f20 + f02 + f12 + f22;
      this.dy = p.y - f00 - f01 - f02 + f20 + f21 + f22;

      /*
       * Obtain displacements in the correct directions.
       *
       * If an x or y coordinate is greater than the actual working space
       * (size/2), then it corresponds to a negative displacement.
       *
       * Remember that for this to work with large displacements >= size/2 in
       * absolute value, the working size has to be doubled.
       */

      if ( this.dx >= this.size/2 )
         this.dx -= this.size;
      if ( this.dy >= this.size/2 )
         this.dy -= this.size;

      console.writeln( "<end><cbr><b>* Translation corrections:</b>" );
      console.writeln( format( "dx : %+8.2f px", this.dx ) );
      console.writeln( format( "dy : %+8.2f px", this.dy ) );

      ++this.count;
   };

   /*
    * Apply translation corrections.
    */
   this.applyTo = function( image )
   {
      console.writeln( "<end><cbr><b>* Applying translation:</b>" );

      image.statusEnabled = true;
      image.translate( this.dx, this.dy );
   };
}

/*
 * FFT Registration: Rotation and Scaling
 */

function FFTRotationAndScaling()
{
   this.evaluateScaling    = false;
   this.lowFrequencyCutoff = 0;
   this.width              = 0;
   this.height             = 0;
   this.size               = 0;
   this.c0                 = null;
   this.rotationAngle      = 0;
   this.scalingRatio       = 1;
   this.count              = 0;

   /*
    * DFT of the reference and target images in the polar or log-polar
    * coordinate systems. For rotation evaluation without scaling, we use polar
    * coordinates to encode position angles and radial distances linearly. For
    * rotation+scaling, we use a log-polar system to encode position angle and
    * scale linearly.
    */
   this.fft = function( image )
   {
      // Low-pass cutoff to reduce rotational aliasing.
      // (See e.g. H.Stone et al., Fourier-Based Image Registration Techniques)
      function LowFrequencyCutoff( image, cutoffRadius )
      {
         var w = image.width;
         var w2 = 0.5*w;
         var r2 = w2*w2;
         image.statusEnabled = true;
         image.initializeStatus( "Low-frequency cutoff", image.bounds.area );
         image.initSampleIterator();
         for ( var y = 0; y < image.height; ++y )
         {
            for ( var x = 0; x < image.width; ++x, image.nextSample() )
            {
               var dx = x - w2;
               var dy = y - w2;
               if ( dx*dx + dy*dy < r2 )
                  image.setSampleValue( 0 );
            }
            image.advanceStatus( image.width );
         }
         image.statusEnabled = false;
      }

      // Place real data centered within our working space
      var C = Image.newComplexImage();
      C.allocate( this.size, this.size );
      C.fill( 0 );
      C.apply( image.gradient(), ImageOp_Mov,
               new Point( (this.size - image.selectedRect.width) >> 1,
                          (this.size - image.selectedRect.height) >> 1 ) );

      // Obtain the DFT symmetric with respect to the center of its transform
      // matrix: zero frequency will correspond to the geometric center of the
      // 2D Fourier transform.
      C.FFT( true/*centered*/ );

      // In the current PixInsight platform, the FFT has the freedom to change the
      // dimensions of the transformed image, for optimization purposes. So we
      // have to grab the possibly new dimension now.
      this.size = C.width;

      // Normalized sbsolute value of the DFT
      var R = Image.newFloatImage();
      R.assign( C );

      if ( this.lowFrequencyCutoff > 0 )
         LowFrequencyCutoff( R, this.lowFrequencyCutoff );

      R.rescale();

#ifdef __DEBUG__
      if ( this.count == 0 )
      {
         var w = new ImageWindow( C.width, C.height, 1, 32, true, false, "RFFT" );
         var v = w.mainView;
         v.beginProcess( UndoFlag_NoSwapFile );
         v.image.apply( R );
         v.endProcess();
         w.show();
      }
#endif

      // Polar (or log-polar) transform
      R.interpolation = Interpolation_Bilinear;
      if ( this.evaluateScaling )
         R.logPolarTransform( 0, Math.PI );
      else
         R.polarTransform( 0, Math.PI );

#ifdef __DEBUG__
      if ( this.count == 0 )
      {
         var w = new ImageWindow( C.width, C.height, 1, 32, true, false, "RPOLAR" );
         var v = w.mainView;
         v.beginProcess( UndoFlag_NoSwapFile );
         v.image.apply( R );
         v.endProcess();
         w.show();
      }
#endif

      // DFT of the (log-)polar transform
      C.apply( R );
      R.free();   // R is no longer needed
      C.FFT();

      return C;
   };

   /*
    * Initialization of the FFT rotation/scaling engine.
    */
   this.initialize = function( image )
   {
      console.writeln( "<end><cbr><b>* Initializing FFT rotation/scaling:</b>" );
      console.flush();

      this.width = image.selectedRect.width;
      this.height = image.selectedRect.height;

      // We work with square matrices
      this.size = Math.max( this.width, this.height );

      // DFT of the polar/log-polar transform of the reference image
      this.c0 = this.fft( image );
   };

   /*
    * Evaluation of rotation and scaling corrections.
    */
   this.evaluate = function( image )
   {
      console.writeln( "<end><cbr><b>* Evaluating FFT rotation/scaling:</b>" );
      console.flush();

      // DFT of the polar or log-polar transform of the target image
      var c1 = this.fft( image );

      // Evaluate the phase correlation matrix (PCM)
      var P = Image.phaseCorrelationMatrix( this.c0, c1 );
      //var P = Image.crossPowerSpectrumMatrix( this.c0, c1 );

      // Inverse DFT of the PCM
      P.inverseFFT();

      // Absolute value of the PCM
      var R = Image.newFloatImage();
      R.assign( P );

      P.free();  // P is no longer needed
      c1.free(); // ditto c1

      // Normalized real PCM
      R.rescale();

#ifdef __DEBUG__
      if ( this.count == 0 )
      {
         var w = new ImageWindow( R.width, R.height, 1, 16, false, false, "RPCM" );
         var v = w.mainView;
         v.beginProcess( UndoFlag_NoSwapFile );
         v.image.apply( R );
         v.image.rescale();
         v.endProcess();
         w.show();
      }
#endif

      /*
       * The position of the maximum matrix element gives us the displacement
       * of the target image w.r.t. the reference image. Since we have encoded
       * position angles linearly on the vertical axis, we can measure angular
       * differences as coordinate differences.
       */
      var p = R.maximumPosition();

      /*
       * Extract the rotation angle from the correlation matrix. We interpolate
       * from three adjacent elements on the initial column of the/ maximum,
       * using wrapped locations when necessary.
       */

      // Get top and bottom interpolation elements (or their wrapped counterparts)
      var y0 = R.sample( p.x, (p.y > 0) ? p.y-1 : this.size-1 );
      var y1 = R.sample( p.x, (p.y < this.size-1) ? p.y+1 : 0 );

      // Interpolate vertical position of maximum
      var y = p.y - y0 + y1;  // because R is normalized to [0,1]

      // The distribution of angle increments is linear on the vertical axis.
      this.rotationAngle = Math.PI*y/this.size;

      // Keep rotation angle in the proper range and direction: +/- 90 degrees.
      if ( this.rotationAngle > Math.PI2 )
         this.rotationAngle = Math.PI - this.rotationAngle;
      else if ( this.rotationAngle < Math.PI2 )
         this.rotationAngle = -this.rotationAngle;

      /*
       * Obtain the scaling ratio, if requested. Again, we interpolate from
       * three adjacent elements on the initial row of the maximum, reading at
       * wrapped locations when needed.
       */

      if ( this.evaluateScaling )
      {
         // Get the left and right interpolation elements (or their wrapped
         // counterparts).
         var x0 = R.sample( (p.x > 0) ? p.x-1 : this.size-1, p.y );
         var x1 = R.sample( (p.x < this.size-1) ? p.x+1 : 0, p.y );

         // Interpolate horizontal position of maximum.
         var x = p.x - x0 + x1;  // because R is normalized to [0,1]

         // Logarithmic size increment corresponding to one pixel on the
         // horizontal axis.
         // ### N.B.: The logarithm base must be the same used in log-polar
         //           conversions (natural logarithms in PixInsight).
         var dX = Math.exp( Math.ln( this.size )/this.size );

         /*
          * Scaling ratios on log-polar phase matrices are deduced as follows:
          *
          * Columns 0 and size-1 both correspond to 1:1 ratio.
          *
          * Ratios increase logarithmically from the leftmost column up to the
          * central column of the PCM.
          *
          * Ratios decrease logarithmically from the rightmost column down to
          * the central column of the PCM.
          */

         if ( x >= this.size/2 )
            x -= this.size-1;

         this.scalingRatio = Math.pow( dX, x );
      }

      R.free();  // R no longer needed

      console.writeln( "<end><cbr><b>* Rotation and scaling corrections:</b>" );
      console.writeln( format( "Rotation angle : %+7.2f deg", Math.deg( this.rotationAngle ) ) );
      console.writeln( format( "Scaling ratio  : %7.2f", this.scalingRatio ) );

      ++this.count;
   };

   /*
    * Apply rotation and scaling corrections.
    */
   this.applyTo = function( image )
   {
      // Largest dimension of the target image
      var size = Math.max( image.width, image.height );

      // Largest image dimension after rotation
      var rotatedSize = (this.scalingRatio > 1) ? size*this.scalingRatio : size;

      // Rotation is required if the rotation angle subtends 0.5 pixels or more
      // along the largest dimension of the (possibly rescaled) image.
      var rotationNeeded = Math.abs( this.rotationAngle ) >= Math.asin( 0.5/rotatedSize );

      // Rescaling is required if the computed scaling ratio would change the
      // size of the image by one pixel or more.
      var resampleNeeded = 1 <= Math.abs( this.scalingRatio*size - size );

      if ( resampleNeeded || rotationNeeded )
      {
         console.writeln( "<end><cbr><b>* Applying rotation/scaling:</b>" );

         image.statusEnabled = true;

         // To improve accuracy: if resampling up, resample before rotation.
         if ( resampleNeeded && this.scalingRatio > 1 )
            image.resample( this.scalingRatio );

         if ( rotationNeeded )
            image.rotate( -this.rotationAngle, image.width/2, image.height/2 );

         // If resampling down, rotate first.
         if ( resampleNeeded && this.scalingRatio < 1 )
            image.resample( this.scalingRatio );

         // Crop or expand to match reference image dimensions
         var dx2 = (image.width - this.width) >> 1;
         var dy2 = (image.width - this.width) >> 1;
         image.cropBy( -dx2, -dy2, -(image.width-this.width-dx2), -(image.height-this.height-dx2) );

#ifdef __DEBUG__
   this.count = 0;
   if ( this.count == 0 )
   {
      var w = new ImageWindow( 1, 1, 1, 32, true, false, "Rotated" );
      var v = w.mainView;
      v.beginProcess( UndoFlag_NoSwapFile );
      v.image.assign( image );
      v.endProcess();
      w.show();
      w.zoomToOptimalFit();
   }
#endif
      }
   };
}

// ----------------------------------------------------------------------------
// FFT Registration Engine
// ----------------------------------------------------------------------------

function FFTRegistrationEngine()
{
   this.referenceImage = "";
   this.targetImages = new Array;
   this.outputDirectory = "";

   // Region of interest (ROI) for evaluation of registration parameters.
   // When the ROI is not a proper rectange (as by default), the whole
   // image is used to evaluate translation and rotation/scaling.
   this.roi = new Rect( 0 );

   // By default, don't correct for rotation. This is the best option for
   // large series of planetary images.
   this.rotate = false;

   // By default, integrate all registered images.
   this.integrate = true;

   // By default, don't write registered images to disk files.
   this.writeRegistered = false;

   this.translation = new FFTTranslation;
   this.rotationAndScaling = new FFTRotationAndScaling;

   this.register = function()
   {
      console.writeln();
      console.writeln( "<b>=== Initializing FFT registration engine ===</b>" );

      // Open the reference image as a copy (disable Save As)
      var w = ImageWindow.open( this.referenceImage,
            this.integrate ? format( "Integration_of_%d", this.targetImages.length + 1 ) :
                             "RegistrationReference", ""/*formatHints*/, true/*asCopy*/ );

      if ( w.length == 0 )
         throw Error( TITLE + ": Unable to load the reference image: " + this.referenceImage );

      if ( w.length > 1 )
      {
         for ( var j = 1; j < w.length; ++j )
            w[j].forceClose();
         console.writeln( format( "** Warning: Ignoring %d additional image(s): ", w.length-1 ) + this.referenceImage );
      }

      var referenceWindow = w[0];

      var useROI = this.roi.isRect;

      var referenceView = new View( referenceWindow.mainView );

      if ( useROI )
         referenceView.image.selectedRect = this.roi;

      if ( this.rotate )
         this.rotationAndScaling.initialize( referenceView.image );

      this.translation.initialize( referenceView.image );

      if ( useROI )
         referenceView.image.resetSelections();

      if ( this.integrate )
      {
         referenceWindow.setSampleFormat( 32, true );
         referenceView.beginProcess();
      }
      else
         referenceWindow.close();

      if ( this.outputDirectory.length > 0 &&
           this.outputDirectory[this.outputDirectory.length-1] != '/' )
         this.outputDirectory += '/';

      var count = 1;

      for ( var i = 0; i < this.targetImages.length; ++i )
      {
         console.writeln();
         console.writeln( format( "<b>=== Registering image %d of %d ===</b>", i+1, this.targetImages.length ) );

         // Open this target image.
         var w = ImageWindow.open( this.targetImages[i], "RegistrationTarget" );

         if ( w.length == 0 )
            throw Error( TITLE + ": Unable to load target image: " + this.targetImages[i] );

         if ( w.length > 1 )
         {
            for ( var j = 1; j < w.length; ++j )
               w[j].forceClose();
            console.writeln( format( "** Warning: Ignoring %d additional image(s): ", w.length-1 ) + this.targetImages[i] );
         }

         var targetWindow = w[0];
         var targetView = new View( targetWindow.mainView );

         targetView.beginProcess( UndoFlag_NoSwapFile );

         // If requested, evaluate and apply rotation/scaling corrections
         if ( this.rotate )
         {
            if ( useROI )
               targetView.image.selectedRect = this.roi;

            this.rotationAndScaling.evaluate( targetView.image );

            if ( useROI )
               targetView.image.resetSelections();

            this.rotationAndScaling.applyTo( targetView.image );
         }

         // Always evaluate and apply translation corrections

         if ( useROI )
            targetView.image.selectedRect = this.roi;

         this.translation.evaluate( targetView.image );

         if ( useROI )
            targetView.image.resetSelections();

         this.translation.applyTo( targetView.image );

         targetView.endProcess();

         // If seleted, add this target image to the accumulator (which is the
         // reference image in memory).
         if ( this.integrate )
            referenceView.image.apply( targetView.image, ImageOp_Add );

         // If requested, write the registered image.
         if ( this.writeRegistered )
         {
            // Don't write anything with less than 16-bit accuracy
            if ( targetWindow.bitsPerSample < 16 )
               targetWindow.setSampleFormat( 16, false );

            // Build up the output path. To use another output file format
            // (TIFF, etc) simply change the .xisf file extension below.
            var name = File.extractName( this.targetImages[i] );
            var outputPath = "";
            if ( this.outputDirectory.length > 0 )
               outputPath = this.outputDirectory + name + "_r.xisf";
            else
            {
               var drive = File.extractDrive( this.targetImages[i] );
               var dir = File.extractDirectory( this.targetImages[i] );
               if ( dir.length > 0 && dir[dir.length-1] != '/' )
                  dir += '/';
               outputPath = drive + dir + name + "_r.xisf";
            }

            // Write the image. We don't want to ask for format options, neither
            // warning messages, strict mode, nor overwrite checks.
            if ( !targetWindow.saveAs( outputPath, false, false, false, false ) )
               throw Error( TITLE + ": Error writing output image:\n" + outputPath );
         }

         // Done with this target image.
         targetWindow.close();

         ++count;

         gc();
      }

      if ( this.integrate )
      {
         referenceView.image.apply( count, ImageOp_Div );
         referenceView.endProcess();
         referenceWindow.show();
      }
   };
}

/*
 * Global FFT registration engine.
 */
var engine = new FFTRegistrationEngine;

/*
 * FFT Registration Dialog
 */
function FFTRegistrationDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   //

   this.helpLabel = new Label( this );
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.margin = 4;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = "<b>" + TITLE + " v" + VERSION + "</b> &mdash; A script for Fourier-based image registration.<br>" +
             "Written by Juan Conejero (PTeam). See the script source code for references.<br>" +
             "Copyright &copy; 2005-2017 Pleiades Astrophoto";

   //

   this.reference_Edit = new Edit( this );
   this.reference_Edit.readOnly = true;
   this.reference_Edit.text = engine.referenceImage;
   this.reference_Edit.toolTip = "<p>Reference image. All target images will be registered to match this image.</p>";

   this.referenceSelect_Button = new PushButton( this );
   this.referenceSelect_Button.text = "Select";
   this.referenceSelect_Button.toolTip = "<p>Select the registration reference image file.</p>";
   this.referenceSelect_Button.onClick = function()
   {
      var ofd = new OpenFileDialog;
      ofd.initialPath = engine.referenceImage;
      ofd.multipleSelections = false;
      ofd.caption = "Select Reference Image";
      ofd.loadImageFilters();

      if ( ofd.execute() )
      {
         engine.referenceImage = ofd.fileName;
         this.dialog.reference_Edit.text = ofd.fileName;
      }
   };

   this.reference_GroupBox = new GroupBox( this );
   this.reference_GroupBox.title = "Reference Image";
   this.reference_GroupBox.sizer = new HorizontalSizer;
   this.reference_GroupBox.sizer.margin = 4;
   this.reference_GroupBox.sizer.spacing = 4;
   this.reference_GroupBox.sizer.add( this.reference_Edit, 100 );
   this.reference_GroupBox.sizer.add( this.referenceSelect_Button );

   //

   this.target_List = new TreeBox( this );
   this.target_List.alternateRowColor = true;
   this.target_List.setScaledMinSize( 500, 200 );
   this.target_List.numberOfColumns = 1;
   this.target_List.headerVisible = false;

   for ( var i = 0; i < engine.targetImages.length; ++i )
   {
      var node = new TreeBoxNode( this.target_List );
      node.checkable = true;
      node.checked = true;
      node.setText( 0, engine.targetImages[i] );
   }

   this.targetAdd_Button = new PushButton( this );
   this.targetAdd_Button.text = "Add";
   this.targetAdd_Button.toolTip = "<p>Add registration target images.</p>";
   this.targetAdd_Button.onClick = function()
   {
      var ofd = new OpenFileDialog;
      ofd.multipleSelections = true;
      ofd.caption = "Select Target Images";
      ofd.loadImageFilters();

      if ( ofd.execute() )
         for ( var i = 0; i < ofd.fileNames.length; ++i )
         {
            var node = new TreeBoxNode( this.dialog.target_List );
            node.checkable = true;
            node.checked = true;
            node.setText( 0, ofd.fileNames[i] );
            engine.targetImages.push( ofd.fileNames[i] );
         }
   };

   this.targetClear_Button = new PushButton( this );
   this.targetClear_Button.text = "Clear";
   this.targetClear_Button.toolTip = "<p>Clear the list of registration target images.</p>";
   this.targetClear_Button.onClick = function()
   {
      this.dialog.target_List.clear();
      engine.targetImages.length = 0;
   };

   this.targetDisableAll_Button = new PushButton( this );
   this.targetDisableAll_Button.text = "Disable All";
   this.targetDisableAll_Button.toolTip = "<p>Disable all registration target images.</p>";
   this.targetDisableAll_Button.onClick = function()
   {
      for ( var i = 0; i < this.dialog.target_List.numberOfChildren; ++i )
         this.dialog.target_List.child( i ).checked = false;
   };

   this.targetEnableAll_Button = new PushButton( this );
   this.targetEnableAll_Button.text = "Enable All";
   this.targetEnableAll_Button.toolTip = "<p>Enable all registration target images.</p>";
   this.targetEnableAll_Button.onClick = function()
   {
      for ( var i = 0; i < this.dialog.target_List.numberOfChildren; ++i )
         this.dialog.target_List.child( i ).checked = true;
   };

   this.targetRemoveDisabled_Button = new PushButton( this );
   this.targetRemoveDisabled_Button.text = "Remove Disabled";
   this.targetRemoveDisabled_Button.toolTip = "<p>Remove all disabled registration target images.</p>";
   this.targetRemoveDisabled_Button.onClick = function()
   {
      engine.targetImages.length = 0;
      for ( var i = 0; i < this.dialog.target_List.numberOfChildren; ++i )
         if ( this.dialog.target_List.child( i ).checked )
            engine.targetImages.push( this.dialog.target_List.child( i ).text( 0 ) );
      for ( var i = this.dialog.target_List.numberOfChildren; --i >= 0; )
         if ( !this.dialog.target_List.child( i ).checked )
            this.dialog.target_List.remove( i );
   };

   this.targetButtons_Sizer = new HorizontalSizer;
   this.targetButtons_Sizer.spacing = 4;
   this.targetButtons_Sizer.add( this.targetAdd_Button );
   this.targetButtons_Sizer.addStretch();
   this.targetButtons_Sizer.add( this.targetClear_Button );
   this.targetButtons_Sizer.addStretch();
   this.targetButtons_Sizer.add( this.targetDisableAll_Button );
   this.targetButtons_Sizer.add( this.targetEnableAll_Button );
   this.targetButtons_Sizer.add( this.targetRemoveDisabled_Button );

   this.target_GroupBox = new GroupBox( this );
   this.target_GroupBox.title = "Target Images";
   this.target_GroupBox.sizer = new VerticalSizer;
   this.target_GroupBox.sizer.margin = 4;
   this.target_GroupBox.sizer.spacing = 4;
   this.target_GroupBox.sizer.add( this.target_List, 100 );
   this.target_GroupBox.sizer.add( this.targetButtons_Sizer );

   //

   this.output_Edit = new Edit( this );
   this.output_Edit.readOnly = true;
   this.output_Edit.text = engine.outputDirectory;
   this.output_Edit.toolTip = "<p>If specified, all registered images will be written to the output directory.</p>";

   this.outputSelect_Button = new PushButton( this );
   this.outputSelect_Button.text = "Select";
   this.outputSelect_Button.toolTip = "<p>Select the output directory.</p>";
   this.outputSelect_Button.onClick = function()
   {
      var gdd = new GetDirectoryDialog;
      gdd.initialPath = engine.outputDirectory;
      gdd.caption = "Select Output Directory";

      if ( gdd.execute() )
      {
         engine.outputDirectory = gdd.directory;
         this.dialog.output_Edit.text = engine.outputDirectory;
      }
   };

   this.output_GroupBox = new GroupBox( this );
   this.output_GroupBox.title = "Output Directory";
   this.output_GroupBox.sizer = new HorizontalSizer;
   this.output_GroupBox.sizer.margin = 4;
   this.output_GroupBox.sizer.spacing = 4;
   this.output_GroupBox.sizer.add( this.output_Edit, 100 );
   this.output_GroupBox.sizer.add( this.outputSelect_Button );
   this.output_GroupBox.enabled = engine.writeRegistered;

   //

   this.integrate_CheckBox = new CheckBox( this );
   this.integrate_CheckBox.text = "Integrate registered images";
   this.integrate_CheckBox.checked = engine.integrate;
   this.integrate_CheckBox.toolTip = "<p>Integrate the set of registered images and the reference image by " +
             "calculating their average. The result is generated as a new image window.</p>";
   this.integrate_CheckBox.onClick = function( checked )
   {
      engine.integrate = checked;
   };

   this.writeRegistered_CheckBox = new CheckBox( this );
   this.writeRegistered_CheckBox.text = "Write registered images";
   this.writeRegistered_CheckBox.checked = engine.writeRegistered;
   this.writeRegistered_CheckBox.toolTip = "<p>Write each registered image to a disk file (FITS format, " +
             "16-bit minimum). Registered image files are created on the output " +
             "directory, or on their source directories if no output directory is specified.</p>";
   this.writeRegistered_CheckBox.onClick = function( checked )
   {
      engine.writeRegistered = checked;
      this.dialog.output_GroupBox.enabled = engine.writeRegistered;
   };

   this.rotation_CheckBox = new CheckBox( this );
   this.rotation_CheckBox.text = "Correct for rotation";
   this.rotation_CheckBox.checked = engine.rotate;
   this.rotation_CheckBox.toolTip = "<p>Use a Fourier-Mellin transform to evaluate rotation angles.</p>";
   this.rotation_CheckBox.onClick = function( checked )
   {
      engine.rotate = checked;
      this.dialog.scaling_CheckBox.enabled = engine.rotate;
      this.dialog.cutOff_NumericControl.enabled = engine.rotate;
   };

   this.scaling_CheckBox = new CheckBox( this );
   this.scaling_CheckBox.text = "Correct for scaling";
   this.scaling_CheckBox.checked = engine.rotationAndScaling.evaluateScaling;
   this.scaling_CheckBox.enabled = engine.rotate;
   this.scaling_CheckBox.toolTip = "<p>Use a Fourier-Mellin transform to evaluate scaling ratios.</p>";
   this.scaling_CheckBox.onClick = function( checked )
   {
      engine.rotationAndScaling.evaluateScaling = checked;
   };

   this.largeTranslations_CheckBox = new CheckBox( this );
   this.largeTranslations_CheckBox.text = "Enable large translations";
   this.largeTranslations_CheckBox.checked = engine.translation.allowLargeTranslations;
   this.largeTranslations_CheckBox.toolTip = "<p>Enable evaluation and correction for displacements larger " +
             "than one half of the image size.<br>" +
             "<b>Warning:</b> Requires four times more working space in memory.</p>";
   this.largeTranslations_CheckBox.onClick = function( checked )
   {
      engine.translation.allowLargeTranslations = checked;
   };

   this.cutOff_NumericControl = new NumericControl( this );
   this.cutOff_NumericControl.label.text = "Low-frequency cutoff:";
   this.cutOff_NumericControl.slider.setRange( 0, 100 );
   this.cutOff_NumericControl.slider.scaledMinWidth = 150;
   this.cutOff_NumericControl.setRange( 0.0, 0.5 );
   this.cutOff_NumericControl.setPrecision( 3 );
   this.cutOff_NumericControl.setValue( engine.rotationAndScaling.lowFrequencyCutoff );
   this.cutOff_NumericControl.enabled = engine.rotate;
   this.cutOff_NumericControl.toolTip = "<p>Radius of the central cutoff applied to DFTs, relative to the largest " +
             "dimension of the image. Low-frequency cutoffs reduce rotational aliasing, which may improve the " +
             "accuracy of rotation evaluation.</p>";
   this.cutOff_NumericControl.onValueUpdated = function( value )
   {
      engine.rotationAndScaling.lowFrequencyCutoff = value;
   };

   this.optionsLeft_Sizer = new VerticalSizer;
   this.optionsLeft_Sizer.spacing = 4;
   this.optionsLeft_Sizer.add( this.integrate_CheckBox );
   this.optionsLeft_Sizer.add( this.rotation_CheckBox );
   this.optionsLeft_Sizer.add( this.scaling_CheckBox );

   this.optionsRight_Sizer = new VerticalSizer;
   this.optionsRight_Sizer.spacing = 4;
   this.optionsRight_Sizer.add( this.writeRegistered_CheckBox );
   this.optionsRight_Sizer.add( this.largeTranslations_CheckBox );
   this.optionsRight_Sizer.add( this.cutOff_NumericControl );

   this.options_GroupBox = new GroupBox( this );
   this.options_GroupBox.title = "Registration Options";
   this.options_GroupBox.sizer = new HorizontalSizer;
   this.options_GroupBox.sizer.margin = 4;
   this.options_GroupBox.sizer.spacing = 16;
   this.options_GroupBox.sizer.add( this.optionsLeft_Sizer );
   this.options_GroupBox.sizer.add( this.optionsRight_Sizer );

   //

   this.ok_Button = new PushButton( this );
   this.ok_Button.text = "OK";
   this.ok_Button.onClick = function()
   {
      this.dialog.ok();
   };

   this.cancel_Button = new PushButton( this );
   this.cancel_Button.text = "Cancel";
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
   this.sizer.add( this.reference_GroupBox );
   this.sizer.add( this.target_GroupBox, 100 );
   this.sizer.add( this.output_GroupBox );
   this.sizer.add( this.options_GroupBox );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = TITLE + " Script";
   this.adjustToContents();
}

// Our dialog inherits all properties and methods from the core Dialog object.
FFTRegistrationDialog.prototype = new Dialog;

/*
 * Script entry point
 */
function main()
{
   console.hide();

   var dialog = new FFTRegistrationDialog();
   for ( ;; )
   {
      if ( !dialog.execute() )
         break;

      if ( engine.referenceImage.length == 0 )
      {
         (new MessageBox( "No reference image has been selected.",
                          TITLE, StdIcon_Error, StdButton_Ok )).execute();
         continue;
      }

      if ( engine.targetImages.length == 0 )
      {
         (new MessageBox( "No target images have been selected.",
                          TITLE, StdIcon_Error, StdButton_Ok )).execute();
         continue;
      }

      // Allow users to abort the registration procedure.
      console.abortEnabled = true;

      console.show();

      console.writeln( "<end><cbr><br>*****************************************"    );
      console.writeln(               "FFT Image Registration Script"                );
      console.writeln(               "Copyright &copy; 2005-2017 Pleiades Astrophoto" );
      console.writeln(               "*****************************************"    );

      // Perform the image registration procedure.
      engine.register();

      // Terminate after successful completion.
      break;
   }
}

main();

// ----------------------------------------------------------------------------
// EOF FFTRegistration.js - Released 2017-09-18T09:18:17Z
