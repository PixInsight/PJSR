// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// pjsr/NoiseEvaluation.js - Released 2010/12/14 15:27:33 UTC
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
 * NoiseEvaluation v1.1
 *
 * Automatic evaluation of Gaussian noise by the iterative multiresolution
 * support and k-sigma thresholding methods.
 *
 * Copyright (C) 2006-2011 Pleiades Astrophoto S.L.
 * Written by Juan Conejero (PTeam)
 *
 * References:
 *
 * - Jean-Luc Starck, Fionn Murtagh, Automatic Noise Estimation from the
 *   Multiresolution Support, Publications of the Royal Astronomical Society
 *   of the Pacific, vol. 110, February 1998, pp. 193-199.
 *
 * - J.L. Starck, F. Murtagh, Astronomical Image and Data Analysis, Springer,
 *   1st ed., 2002, pp. 37-38.
*/

#feature-id    Image Analysis > NoiseEvaluation

#feature-info \
Automatic estimation of Gaussian noise by the iterative multiresolution \
support and k-sigma thresholding algorithms.<br>\
<br>\
Written by Juan Conejero (PTeam).<br>\
<br>\
References:<br>\
<br>\
Jean-Luc Starck, Fionn Murtagh, <i>Automatic Noise Estimation from the \
Multiresolution Support</i>, Publications of the Royal Astronomical Society \
of the Pacific, vol. 110, February 1998, pp. 193-199.<br>\
<br>\
J.L. Starck, F. Murtagh, <i>Astronomical Image and Data Analysis</i>, Springer, \
1st ed., 2002, pp. 37-38.<br>\
<br>\
Copyright (c) 2006-2011 Pleiades Astrophoto S.L.

/**
 * Estimation of the standard deviation of the noise, assuming a Gaussian
 * noise distribution.
 *
 * - Use MRS noise evaluation when the algorithm converges for 4 >= J >= 2
 *
 * - Use k-sigma noise evaluation when either MRS doesn't converge or the
 *   length of the noise pixels set is below a 1% of the image area.
 *
 * - Automatically iterate to find the highest layer where noise can be
 *   successfully evaluated, in the [1,3] range.
 */
function NoiseEvaluation( img )
{
   var a, n = 4, m = 0.01*img.selectedRect.area;
   for ( ;; )
   {
      a = img.noiseMRS( n );
      if ( a[1] >= m )
         break;
      if ( --n == 1 )
      {
         console.writeln( "<end><cbr>** Warning: No convergence in MRS noise evaluation routine - using k-sigma noise estimate." );
         a = img.noiseKSigma();
         break;
      }
   }
   this.sigma = a[0]; // estimated stddev of Gaussian noise
   this.count = a[1]; // number of pixels in the noise pixels set
   this.layers = n;   // number of layers used for noise evaluation
}

function main()
{
   // Get access to the current active image window.
   var window = ImageWindow.activeWindow;
   if ( window.isNull )
      throw new Error( "No active image" );

   console.show();
   console.writeln( "<end><cbr><br><b>" + window.currentView.fullId + "</b>" );
   console.writeln( "Calculating noise standard deviation..." );
   console.flush();

   console.abortEnabled = true;

   var img = window.currentView.image;
   for ( var c = 0; c < img.numberOfChannels; ++c )
   {
      console.writeln( "<end><cbr><br>* Channel #", c );
      console.flush();
      img.selectedChannel = c;
      var E = new NoiseEvaluation( img );
      console.writeln( format( "&sigma;<sub>%c</sub> = %.3e, N = %u (%.2f%%), J = %d",
                               img.isColor ? "RGB"[c] : 'K',
                               E.sigma, E.count, 100*E.count/img.selectedRect.area, E.layers ) );
      console.flush();
   }
}

main();

// ****************************************************************************
// EOF pjsr/NoiseEvaluation.js - Released 2010/12/14 15:27:33 UTC
