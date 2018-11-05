//     ____       __ _____  ____
//    / __ \     / // ___/ / __ \
//   / /_/ /__  / / \__ \ / /_/ /
//  / ____// /_/ / ___/ // _, _/   PixInsight JavaScript Runtime
// /_/     \____/ /____//_/ |_|    PJSR Version 1.0
// ----------------------------------------------------------------------------
// pjsr/StarDetector.jsh - Released 2018-10-18T17:24:41Z
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

#ifndef __PJSR_StarDetector_jsh
#define __PJSR_StarDetector_jsh

/******************************************************************************
 * StarDetector.jsh version 1.25 (April 2016)
 *
 * A JavaScript star detection engine. Adapted from the StarAlignment tool.
 * Written by Juan Conejero, PTeam
 *
 * Changelog:
 *
 * 1.25  - New applyHotPixelFilterToDetectionImage parameter for increased
 *         robustness to hot pixels and other spurious small-scale structures.
 *       - Fixed a bug in the generation of circular structural elements, used
 *         for hot pixel removal.
 *       - Fixed createStructureMapWindow() test routine, which was not giving
 *         reliable results.
 *
 * 1.24  - Language optimization: All occurrences of 'var' replaced with 'let'.
 *
 * 1.23  - Several optimizations.
 *
 * 1.22  - Fix performance degradation regression in PixInsight 1.8.1 / SM 24.
 *       - Faster detection engine.
 *
 * 1.20  - Support images with zero (or insignificant) backgrounds, such as
 *         synthetic star fields.
 *
 * 1.15  - New StarDetector.noiseReductionFilterRadius parameter.
 *       - New StarDetector.upperLimit parameter.
 *       - StarDetector's constructor takes no parameter. This is to prevent
 *         future incompatibilities when we add new parameters.
 *
 * 1.12  - Initial version
 *
 *****************************************************************************/

#define __PJSR_STAR_DETECTOR_VERSION   1.25

#include <pjsr/ImageOp.jsh>
#include <pjsr/MorphOp.jsh>

#ifndef __PJSR_NO_STAR_DETECTOR_TEST_ROUTINES
#include <pjsr/UndoFlag.jsh>
#endif

/*
 * Structure to store the parameters of a detected star.
 */
#ifndef __PJSR_STAR_OBJECT_DEFINED
#define __PJSR_STAR_OBJECT_DEFINED  1
function Star( pos, flux, size )
{
   // Centroid position in pixels, image coordinates.
   this.pos = new Point( pos.x, pos.y );
   // Total flux, normalized intensity units.
   this.flux = flux;
   // Area of detected star structure in square pixels.
   this.size = size;
}
#endif

/*
 * Star detection engine
 */
function StarDetector()
{
   this.__base__ = Object;
   this.__base__();

   /*
    * Number of wavelet layers for structure detection. (default=5)
    */
   this.structureLayers = 5;

   /*
    * ### DEPRECATED
    * Number of small-scale wavelet layers for noise suppression. (default=0)
    */
   this.noiseLayers = 0;

   /*
    * Half size in pixels of a morphological median filter, for hot pixel
    * removal. (default=1)
    */
   this.hotPixelFilterRadius = 1;

   /*
    * Whether the hot pixel filter removal should be applied to the image used
    * for star detection, or only to the working image used to build the
    * structure map. (default=false)
    *
    * By setting this parameter to true, the detection algorithm is completely
    * robust to hot pixels (of sizes not larger than hotPixelFilterRadius), but
    * it is also less sensitive, so less stars will in general be detected.
    * With the default value of false, some hot pixels may be wrongly detected
    * as stars but the number of true stars detected will generally be larger.
    */
   this.applyHotPixelFilterToDetectionImage = false;

   /*
    * Half size in pixels of a Gaussian convolution filter applied for noise
    * reduction. Useful for star detection in low-SNR images. (default=0)
    *
    * Setting the value of this parameter > 0 implies
    * applyHotPixelFilterToDetectionImage=true.
    */
   this.noiseReductionFilterRadius = 0;

   /*
    * Sensitivity of the star detector device - smaller values mean more
    * sensitivity. (default=0.1)
    */
   this.sensitivity = 0.1;

   /*
    * Peak response of the star detector device - larger values are more
    * tolerant with relatively flat structures. (default=0.8)
    */
   this.peakResponse = 0.8;

   /*
    * Maximum distortion allowed, relative to a perfect square. The distortion
    * of a perfect circle is pi/4. (default=0.5)
    */
   this.maxDistortion = 0.5;

   /*
    * Stars with peak values greater than this value won't be detected.
    * (default=1)
    */
   this.upperLimit = 1.0;

   /*
    * Detect dark structures over a bright background, instead of bright
    * structures over a dark background. (default=false)
    */
   this.invert = false;

   /*
    * Optional callback progress function with the following signature:
    *
    * Boolean progressCallback( int count, int total )
    *
    * If defined, this function will be called by the stars() method for each
    * row of its target image. The count argument is the current number of
    * processed pixel rows, and total is the height of the target image. If the
    * function returns false, the star detection task will be aborted. If the
    * function returns true, the task will continue. (default=undefined)
    */
   this.progressCallback = undefined;

   /*
    * Optional mask image. If defined, star detection will be restricted to
    * nonzero mask pixels. (default=undefined)
    */
   this.mask = undefined;

   /*
    * Local background is evaluated for each star on an inflated rectangular
    * region around the star detection structure. bkgDelta is the inflation
    * distance in pixels. (default=3)
    */
   this.bkgDelta = 3;

   /*
    * Stretch factor for the barycenter search algorithm, in sigma units.
    * Increase it to make the algorithm more robust to nearby structures, such
    * as multiple/crowded stars and small nebular features. However, too large
    * of a stretch factor will make the algorithm less accurate. (default=1.5)
    */
   this.xyStretch = 1.5;

   /*
    * Square structuring element
    */
   function BoxStructure( size )
   {
      let B = new Array( size*size );
      for ( let i = 0; i < B.length; ++i )
         B[i] = 1;
      let S = new Array;
      S.push( B );
      return S;
   }

   /*
    * Circular structuring element
    */
   function CircularStructure( size )
   {
      size |= 1;
      let C = new Array( size*size );
      let s2 = size >> 1;
      let n2 = size/2;
      let n22 = n2*n2;
      for ( let i = 0; i < s2; ++i )
      {
         let di = i+0.5 - n2;
         let di2 = di*di;
         let i2 = i*size;
         let i1 = i2 + size - 1;
         let i3 = (size - i - 1)*size;
         let i4 = i3 + size - 1;
         for ( let j = 0; j < s2; ++j )
         {
            let dj = j+0.5 - n2;
            C[i1-j] = C[i2+j] = C[i3+j] = C[i4-j] = (di2 + dj*dj <= n22) ? 1 : 0;
         }
      }
      for ( let i = 0; i < size; ++i )
         C[i*size + s2] = C[s2*size + i] = 1;
      let S = new Array;
      S.push( C );
      return S;
   }

   /*
    * Hot pixel removal with a median filter
    */
   this.hotPixelFilter = function( image )
   {
      if ( this.hotPixelFilterRadius > 0 )
         if ( this.hotPixelFilterRadius > 1 )
            image.morphologicalTransformation( MorphOp_Median, CircularStructure( 2*this.hotPixelFilterRadius + 1 ) );
         else
            image.morphologicalTransformation( MorphOp_Median, BoxStructure( 3 ) );
   };

   /*
    * Isolate star detection structures in an image. Replaces the specified map
    * image with its binary star detection map.
    */
   this.getStructureMap = function( map )
   {
      // Noise reduction with a low-pass filter
      if ( this.noiseLayers > 0 )
      {
         let G = Matrix.gaussianFilterBySize( 1 + (1 << this.noiseLayers) );
         map.convolveSeparable( G.rowVector( G.rows >> 1 ), G.rowVector( G.rows >> 1 ) );
      }

      // Flatten the image with a high-pass filter
      let s = new Image( map );
      let G = Matrix.gaussianFilterBySize( 1 + (1 << this.structureLayers) );
      s.convolveSeparable( G.rowVector( G.rows >> 1 ), G.rowVector( G.rows >> 1 ) );
      map.apply( s, ImageOp_Sub );
      s.free();
      map.truncate();
      map.rescale();

      // Strength the smallest structures with a dilation filter
      map.morphologicalTransformation( MorphOp_Dilation, BoxStructure( 3 ) );

      // Adaptive binarization based on noise evaluation
      let m = map.median();
      if ( 1 + m == 1 )
      {
         // Black background - probably a synthetic star field
         let wasRangeClippingEnabled = map.rangeClippingEnabled;
         let wasRangeClipLow = map.rangeClipLow;
         let wasRangeClipHigh = map.rangeClipHigh;
         map.rangeClippingEnabled = true;
         map.rangeClipLow = 0;
         map.rangeClipHigh = 1;
         if ( !wasRangeClippingEnabled || wasRangeClipLow != 0 || wasRangeClipHigh != 1 )
            m = map.median();
         map.binarize( m + map.MAD( m ) );
         map.rangeClippingEnabled = wasRangeClippingEnabled;
         map.rangeClipLow = wasRangeClipLow;
         map.rangeClipHigh = wasRangeClipHigh;
      }
      else
      {
         // A "natural" image
         let n = map.noiseKSigma( 1 )[0];
         map.binarize( m + 3*n );
      }

      // Optional star detection mask
      if ( this.mask != undefined )
         map.apply( this.mask, ImageOp_Mul );
   };

   /*
    * Compute star parameters
    */
   this.starParameters = function( image, rect, starPoints )
   {
      let params = { pos:  {x:0, y:0}, // barycenter image coordinates
                     bkg:  0,          // local background
                     norm: 0,          // detection level
                     flux: 0,          // total flux
                     peak: 0,          // peak value
                     size: 0 };        // structure size in square pixels

      // Calculate the mean local background as the median of background pixels
      let r = rect.inflatedBy( this.bkgDelta );
      let b = [[],[],[],[]];
      image.getSamples( b[0], new Rect(    r.x0,    r.y0,    r.x1, rect.y0 ) );
      image.getSamples( b[1], new Rect(    r.x0, rect.y0, rect.x0, rect.y1 ) );
      image.getSamples( b[2], new Rect(    r.x0, rect.y1,    r.x1,    r.y1 ) );
      image.getSamples( b[3], new Rect( rect.x1, rect.y0,    r.x1, rect.y1 ) );
      for ( let i = 1; i < b.length; ++i )
         for ( let j = 0; j < b[i].length; ++j )
            b[0].push( b[i][j] );
      params.bkg = Math.median( b[0] );

      // Compute barycenter coordinates
      let M = Matrix.fromImage( image, rect );
      M.truncate( Math.range( M.median() + this.xyStretch*M.stdDev(), 0.0, 1.0 ), 1.0 );
      M.rescale();
      let sx = 0, sy = 0, sz = 0;
      for ( let y = rect.y0, i = 0; i < M.rows; ++y, ++i )
         for ( let x = rect.x0, j = 0; j < M.cols; ++x, ++j )
         {
            let z = M.at( i, j );
            if ( z > 0 )
            {
               sx += z*x;
               sy += z*y;
               sz += z;
            }
         }
      params.pos.x = sx/sz + 0.5;
      params.pos.y = sy/sz + 0.5;

      // Total flux, peak value and structure size
      for ( let i = 0; i < starPoints.length; ++i )
      {
         let p = starPoints[i];
         let f = image.sample( p.x, p.y );
         params.flux += f;
         if ( f > params.peak )
            params.peak = f;
      }
      params.size = starPoints.length;

      // Detection level corrected for peak response
      params.norm = params.peak - (1 - this.peakResponse)*params.flux/params.size;

      return params;
   };

   /*
    * Finds all the stars in an image. Returns an array of Star objects.
    */
   this.stars = function( image )
   {
      // We work on a duplicate of the source grayscale image, or on its HSI
      // intensity component if it is a color image.
      let wrk = Image.newFloatImage();
      image.getIntensity( wrk );

      // Hot pixel removal, if applied to the image where we are going to find
      // stars, not just to the image used to build the structure map.
      // When noise reduction is enabled, always remove hot pixels first, or
      // hot pixels would be promoted to "stars".
      let alreadyFixedHotPixels = false;
      if ( this.applyHotPixelFilterToDetectionImage || this.noiseReductionFilterRadius > 0 )
      {
         this.hotPixelFilter( wrk );
         alreadyFixedHotPixels = true;
      }

      // If the invert flag is set, then we are looking for dark structures on
      // a bright background.
      if ( this.invert )
         wrk.invert();

      // Optional noise reduction
      if ( this.noiseReductionFilterRadius > 0 )
      {
         let G = Matrix.gaussianFilterBySize( (this.noiseReductionFilterRadius << 1)|1 );
         wrk.convolveSeparable( G.rowVector( G.rows >> 1 ), G.rowVector( G.rows >> 1 ) );
      }

      // Structure map
      let map = Image.newFloatImage();
      map.assign( wrk );
      // Hot pixel removal, if applied just to the image used to build the
      // structure map.
      if ( !alreadyFixedHotPixels )
         this.hotPixelFilter( map );
      this.getStructureMap( map );

      // Use matrices instead of images for faster access
      let M = map.toMatrix();
      map.free();
      //gc();

      // The detected stars
      let S = new Array;

      // Structure scanner
      for ( let y0 = 0, x1 = M.cols-1, y1 = M.rows-1; y0 < y1; ++y0 )
      {
         if ( this.progressCallback != undefined )
            if ( !this.progressCallback( y0, M.rows ) )
               return null;

         for ( let x0 = 0; x0 < x1; ++x0 )
         {
            // Exclude background pixels and already visited pixels
            if ( M.at( y0, x0 ) == 0 )
               continue;

            // Star pixel coordinates
            let starPoints = new Array;

            // Star bounding rectangle
            let r = new Rect( x0, y0, x0+1, y0+1 );

            // Grow star region downward
            for ( let y = y0, x = x0, xa, xb; ; )
            {
               // Add this pixel to the current star
               starPoints.push( { x:x, y:y } );

               // Explore the left segment of this row
               for ( xa = x; xa > 0; )
               {
                  if ( M.at( y, xa-1 ) == 0 )
                     break;
                  --xa;
                  starPoints.push( { x:xa, y:y } );
               }

               // Explore the right segment of this row
               for ( xb = x; xb < x1; )
               {
                  if ( M.at( y, xb+1 ) == 0 )
                     break;
                  ++xb;
                  starPoints.push( { x:xb, y:y } );
               }

               // xa and xb are now the left and right boundary limits,
               // respectively, of this row in the current star.

               if ( xa < r.x0 )  // update left boundary
                  r.x0 = xa;

               if ( xb >= r.x1 ) // update right boundary
                  r.x1 = xb + 1; // bottom-right corner excluded (PCL-specific)

               // Prepare for next row
               ++y;

               // Decide whether we are done with this star now, or if
               // there is at least one more row that must be explored.

               let nextRow = false;

               // Explore the next row from left to right. We'll continue
               // gathering pixels if we find at least one nonzero map pixel.
               for ( x = xa; x <= xb; ++x )
                  if ( M.at( y, x ) != 0 )
                  {
                     nextRow = true;
                     break;
                  }

               if ( !nextRow )
                  break;

               // Update bottom boundary
               r.y1 = y + 1;  // Rect *excludes* the bottom-right corner

               // Terminate if we reach the last row of the image
               if ( y == y1 )
                  break;
            }

            /*
             * If this is a reliable star, compute its barycenter coordinates
             * and add it to the star list.
             *
             * Rejection criteria:
             *
             * * Stars whose peak values are greater than the upperLimit
             *   parameter are rejected.
             *
             * * If this structure is touching a border of the image, reject
             *   it. We cannot compute an accurate position for a clipped star.
             *
             * * Too small structures are rejected. This mainly prevents
             *   inclusion of hot (or cold) pixels. This condition is enforced
             *   by the hot pixel removal and noise reduction steps performed
             *   during the structure detection phase.
             *
             * * Too large structures are rejected. This prevents inclusion of
             *   extended nonstellar objects and saturated bright stars. This
             *   is also part of the structure detection algorithm.
             *
             * * Too elongated stars are rejected. The maxDistortion parameter
             *   determines the maximum distortion allowed. A perfect square
             *   has distortion = 1. The distortion of a perfect circle is
             *   pi/4, or about 0.8.
             *
             * * We don't trust stars whose centroids are too misplaced with
             *   respect to their peak positions. This prevents detection of
             *   multiple stars, where an accurate position cannot be computed.
             *
             * * Too flat structures are rejected. The peakResponse parameter
             *   defines a peakedness threshold necessary for a structure to be
             *   idenfified as a valid star.
             */
            if ( r.width > 1 && r.height > 1 )
               if ( r.y0 > 0 && r.y1 <= y1 && r.x0 > 0 && r.x1 <= x1 )
               {
                  let d = Math.max( r.width, r.height );
                  if ( starPoints.length/d/d > this.maxDistortion )
                  {
                     let p = this.starParameters( wrk, r, starPoints );
                     if ( p.peak <= this.upperLimit )
                     {
                        let ix = Math.trunc( p.pos.x )|0;
                        let iy = Math.trunc( p.pos.y )|0;
                        if ( this.mask == undefined || this.mask.sample( ix, iy ) != 0 )
                           if ( p.bkg == 0 || (p.norm - p.bkg)/p.bkg > this.sensitivity )
                              if ( wrk.sample( ix, iy ) > 0.85*p.peak )
                              {
                                 let m = Matrix.fromImage( wrk, r );
                                 if ( m.median() < this.peakResponse*p.peak )
                                    S.push( new Star( p.pos, p.flux, p.size ) );
                              }
                     }
                  }
               }

            // Erase this structure.
            for ( let i = 0; i < starPoints.length; ++i )
            {
               let p = starPoints[i];
               M.at( p.y, p.x, 0 );
            }
         }
      }

      // Perform a soft garbage collection. This eases integration with very
      // long batch tasks and has no measurable performance penalty.
      gc( false/*hard*/ );

      if ( this.progressCallback != undefined )
         if ( !this.progressCallback( M.rows, M.rows ) )
            return null;

      return S;
   };

#ifndef __PJSR_NO_STAR_DETECTOR_TEST_ROUTINES

   // -------------------------------------------------------------------------
   // Test routines
   // -------------------------------------------------------------------------

   /*
    * Create a new image window with the binary star detection map for the
    * specified image (test function).
    */
   this.createStructureMapWindow = function( image )
   {
      let map = Image.newFloatImage();
      image.getIntensity( map );
      this.hotPixelFilter( map );
      if ( this.invert )
         map.invert();
      if ( this.noiseReductionFilterRadius > 0 )
      {
         let G = Matrix.gaussianFilterBySize( (this.noiseReductionFilterRadius << 1)|1 );
         map.convolveSeparable( G.rowVector( G.rows >> 1 ), G.rowVector( G.rows >> 1 ) );
      }
      this.getStructureMap( map );

      let w = new ImageWindow( 1, 1,
                               1,      // numberOfChannels
                               8,      // bitsPerSample
                               false,  // floatSample
                               false,  // color
                               "structure_map" );
      w.mainView.beginProcess( UndoFlag_NoSwapFile );
      w.mainView.image.assign( map );
      w.mainView.endProcess();
      w.show();
      w.zoomToFit();
   };

   /*
    * General test function, with optional star mask creation.
    */
   this.test = function( image, createStarMaskWindow )
   {
      function elapsedTime( t0 )
      {
         let ss = ((new Date).getTime() - t0.getTime())/1000;
         let mm = ss/60;
         ss = 60*Math.frac( mm );
         return format( "%02.0f:%02.2f", Math.trunc( mm ), ss );
      }

      let lastProgressPc = 0;
      function progressCallback( count, total )
      {
         if ( count == 0 )
         {
            console.write( "<end><cbr>Detecting stars:   0%" );
            lastProgressPc = 0;
            processEvents();
         }
         else
         {
            let pc = Math.round( 100*count/total );
            if ( pc > lastProgressPc )
            {
               console.write( format( "<end>\b\b\b\b%3d%%", pc ) );
               lastProgressPc = pc;
               processEvents();
            }
         }
         return true;
      }

      console.show();

      this.progressCallback = progressCallback;

      let t0 = new Date;
      let S = this.stars( image );
      let st = elapsedTime( t0 );
      console.writeln( format( "<end><cbr><br>* StarDetector: %d stars found ", S.length ) );
      console.writeln( st );

      if ( createStarMaskWindow )
      {
         let bmp = new Bitmap( image.width, image.height );
         bmp.fill( 0xffffffff );
         let G = new VectorGraphics( bmp );
         G.antialiasing = true;
         G.pen = new Pen( 0xff000000 );
         for ( let i = 0; i < S.length; ++i )
         {
            let s = S[i];
            G.strokeCircle( s.pos, Math.max( 3, Math.round( Math.sqrt( s.size ) )|1 ) );
         }
         G.end();

         let w = new ImageWindow( bmp.width, bmp.height,
                                  1,      // numberOfChannels
                                  8,      // bitsPerSample
                                  false,  // floatSample
                                  false,  // color
                                  "stars" );
         w.mainView.beginProcess( UndoFlag_NoSwapFile );
         w.mainView.image.blend( bmp );
         w.mainView.endProcess();
         w.show();
         w.zoomToFit();
      }
   };

#endif   // __PJSR_NO_STAR_DETECTOR_TEST_ROUTINES
}

StarDetector.prototype = new Object;

#endif   // __PJSR_StarDetector_jsh

// ----------------------------------------------------------------------------
// EOF pjsr/StarDetector.jsh - Released 2018-10-18T17:24:41Z
