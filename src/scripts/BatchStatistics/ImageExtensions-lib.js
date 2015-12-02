// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// ImageExtensions-lib.js - Released 2015/11/30 00:00:00 UTC
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

#ifndef ImageExtensions_lib_js
#define ImageExtensions_lib_js
#endif

// Define as true for debug messages to console.
#ifndef DEBUGGING_MODE_ON
#define DEBUGGING_MODE_ON false
#endif

// ======== # Class extensions ===============================================

if ( typeof Image.prototype.count === "undefined" )
{
   /// Method to extend the Image object to return the count of pixels within the clipping range.
   ///
   /// @param {Rect} rect optional selection rectangle to apply to image.
   /// @param {Integer} firstChannel optional first channel to process in image.
   /// @param {Integer} lastChannel optional last channel to process in image.
   Image.prototype.count = function( rect, firstChannel, lastChannel )
   {
      var count = 0;

      this.pushSelections();

      if ( rect != undefined && rect.isRect )
      {
         this.selectedRect = rect;
      }
      if ( firstChannel != undefined && firstChannel >= 0 )
      {
         this.firstSelectedChannel = firstChannel;
      }
      if ( lastChannel != undefined && lastChannel >= 0 )
      {
         this.lastSelectedChannel = lastChannel;
      }
      if ( this.rangeClippingEnabled )
      {
         var x = new Vector;
         this.initPixelIterator();
         do
         {
            this.getPixelValue( x );
            for ( var i = 0; i < x.length; ++i )
            {
               var v = x.at( i );
               if ( v > this.rangeClipLow && v < this.rangeClipHigh )
               {
                  ++count;
               }
            }
         }
         while ( this.nextPixel() );
      }
      else
      {
         count = this.numberOfSelectedSamples;
      }

      this.popSelections();

      return count;
   }
}
else if ( typeof Image.prototype.count !== "function" )
{
   // Abort script as .count exists as something other than a method.
   console.warningln( TITLE + " script aborted as Image.prototype.count already exists." );
   console.flush();
   throw TITLE + " script aborted as Image.prototype.count already exists.";
}

if ( typeof Image.prototype.variance === "undefined" )
{
   /// Method to extend the Image object to return the variance of the image.
   ///
   /// @param {Rect} rect optional selection rectangle to apply to image.
   /// @param {Integer} firstChannel optional first channel to process in image.
   /// @param {Integer} lastChannel optional last channel to process in image.
   Image.prototype.variance = function( rect, firstChannel, lastChannel )
   {
      if ( lastChannel == undefined )
      {
         lastChannel = -1;
      }
      if ( firstChannel == undefined )
      {
         firstChannel = -1;
      }
      if ( rect == undefined )
      {
         rect = new Rect;
      }
      var sigma = this.stdDev( rect, firstChannel, lastChannel );

      return sigma * sigma;
   }
}
else if ( typeof Image.prototype.variance !== "function" )
{
   // Abort script as .variance exists as something other than a method.
   console.warningln( TITLE + " script aborted as Image.prototype.variance already exists." );
   console.flush();
   throw TITLE + " script aborted as Image.prototype.variance already exists.";
}

// ----------------------------------------------------------------------------
// EOF ImageExtensions-lib.js - Released 2015/11/30 00:00:00 UTC
