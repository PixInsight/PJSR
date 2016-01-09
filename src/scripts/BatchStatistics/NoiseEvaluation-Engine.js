// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// NoiseEvaluation-Engine.js - Released 2015/11/30 00:00:00 UTC
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

#ifndef NoiseEvaluation_Engine_js
#define NoiseEvaluation_Engine_js
#endif

// Define as true for debug messages to console.
#ifndef DEBUGGING_MODE_ON
#define DEBUGGING_MODE_ON false
#endif

// ======== # processing classes ===============================================

/// @class NoiseEvaluationEngine manages evaluation of noise for a target image.
///        Estimation of the standard deviation of the noise, assuming a Gaussian
///        noise distribution.
///
///   Use as follows:
///    - Read/write properties may be accessed or updated directly.
///    - Read only properties must only be updated using public .set*() methods
///      (where they exist) in order to ensure correct operation.
///    - Private properties and methods should not be updated nor relied upon
///      as they may change in subsequent releasses.
///
///    - Use .setTargetImage() method to set the image to evaluate.
///      Note: Calls .evaluateNoise() so configure the options first to
///      avoid redundant recalculations.
///    - Use .evaluateNoise() method to update the noise evaluation results.
function NoiseEvaluationEngine()
{
   if ( DEBUGGING_MODE_ON )
   {
      console.noteln( "{ NoiseEvaluationEngine" );
   }
   // ******* Public read/write properties. *************************************

   this.evaluateMRS = true;    ///< Evaluate noise using the MRS method.
   this.numberOfLayersMRS = 4; ///< Number of layers (2..n) to use in MRS method (default is 4).
   this.percentNoiseMRS = 1;   ///< Minimum percentage (0..100) of pixels in the noise set for MRS to have converged (default is 1%).

   this.fallBackKSigma = true; ///< Evaluate noise using the K-Sigma method if the MRS method fails to converge.
   this.evaluateKSigma = true; ///< Evaluate noise using the K-Sigma method as well as or instead of MRS method.

   // ******* Public read only properties. **************************************

   this.targetImage = null;    ///< Image to be measured.

   this.MRSIsValid = false;    ///< True if the properties below contain a result based on the MRS method.
   this.sigmaMRS = null;       ///< Estimated standard deviation of Gaussian noise based on the MRS method.
   this.countMRS = null;       ///< Number of pixels in the noise pixels set based on the MRS method.
   this.layersMRS = null;      ///< Number of layers used for noise evaluation based on the MRS method.

   this.KSigmaIsValid = false; ///< True if the properties below contain a result based on the K-Sigma method.
   this.sigmaKSigma = null;    ///< Estimated standard deviation of Gaussian noise based on the K-Sigma method.
   this.countKSigma = null;    ///< Number of pixels in the noise pixels set based on the K-Sigma method.

   // ******* Public methods. ***************************************************

   /// Method to set the target image.
   /// Caller must also call evaluateNoise whenever the image changes.
   ///
   /// @param {string} targetImage target image object.
   this.setTargetImage = function( targetImage )
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ NoiseEvaluationEngine.setTargetImage" );
      }
      if ( this.targetImage != targetImage )
      {
         if ( DEBUGGING_MODE_ON )
         {
            console.noteln( "Changing target image." );
         }
         this.targetImage = targetImage;
         // Invalidate results for safety.
         this.MRSIsValid = false;
         this.sigmaMRS = null;
         this.countMRS = null;
         this.layersMRS = null;
         this.KSigmaIsValid = false;
         this.sigmaSigma = null;
         this.countKSigma = null;
      }
      else
      {
         if ( DEBUGGING_MODE_ON )
         {
            console.noteln( "Target image was already set to the one referenced." );
         }
      }
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} NoiseEvaluationEngine.setTargetImage" );
      }
   }; // setTargetImage()

   /// Method to perform noise evaluation on the target image.
   ///
   this.evaluateNoise = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ NoiseEvaluationEngine.evaluateNoise" );
      }
      // Invalidate results for safety in case evaluation properties are wrong.
      this.MRSIsValid = false;
      this.sigmaMRS = null;
      this.countMRS = null;
      this.layersMRS = null;
      this.KSigmaIsValid = false;
      this.sigmaSigma = null;
      this.countKSigma = null;

      if (this.targetImage != null ) {
         var MRSResult = null,
               minPixels = (this.percentNoiseMRS / 100) * this.targetImage.selectedRect.area;

         if ( DEBUGGING_MODE_ON )
         {
            console.noteln( "MRS minPixels: " + minPixels );
         }

         if (this.evaluateMRS) {
            // If required, determine if MRS method will converge.
            for ( var layer = this.numberOfLayersMRS ; layer > 2 ; layer-- )
            {
            if ( DEBUGGING_MODE_ON )
            {
               console.noteln( "MRS Layer: " + layer );
            }

               MRSResult = this.targetImage.noiseMRS( layer );
               if ( MRSResult[1] >= minPixels )
               {
                  // MRS converged.
                  this.MRSIsValid = true;
                  this.sigmaMRS = MRSResult[0];
                  this.countMRS = MRSResult[1];
                  this.layersMRS = layer;
                  if ( DEBUGGING_MODE_ON )
                  {
                     console.noteln( "Sigma MRS: " + this.sigmaMRS + " Count: " + this.countMRS + " Layers: " + this.layersMRS );
                  }
                  break;
               }
            }
         }

         if (this.evaluateKSigma || ( !this.MRSIsValid && this.fallBackKSigma ) )
         // Use K-Sigma if required.
         {
            var KSResult = this.targetImage.noiseKSigma();
            this.KSigmaIsValid = true;
            this.sigmaKSigma = KSResult[0];
            this.countKSigma = KSResult[1];
            if ( DEBUGGING_MODE_ON )
            {
               console.noteln( "Sigma K-Signma: " + this.sigmaKSigma + " Count: " + this.countKSigma );
            }
         }
      }

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} NoiseEvaluationEngine.evaluateNoise" );
      }
   }

   if ( DEBUGGING_MODE_ON )
   {
      console.noteln( "} NoiseEvaluationEngine" );
   }
}  // class NoiseEvaluationEngine

// ----------------------------------------------------------------------------
// EOF NoiseEvaluation-Engine.js - Released 2015/11/30 00:00:00 UTC
