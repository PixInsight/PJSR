// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// BatchStatistics-Engine.js - Released 2015/11/30 00:00:00 UTC
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
   1.1b:  Second (beta) release.
   1.0b:  First (beta) release.
*/

// ========= # defines / includes ==============================================

#ifndef BatchStatistics_Engine_js
#define BatchStatistics_Engine_js
#endif

// Define as true for debug messages to console.
#ifndef DEBUGGING_MODE_ON
#define DEBUGGING_MODE_ON false
#endif

// Includes.
#ifndef NoiseEvaluation_Engine_js
#include "NoiseEvaluation-Engine.js" // Engine to evaluate noise in images.
#endif
#ifndef ImageExtensions_lib_js
#include "ImageExtensions-lib.js"    // Library to extend the Image object with additional stats.
#endif
#ifndef __PJSR_DataType_jsh
#include <pjsr/DataType.jsh>
#endif

// ======== # processing classes ===============================================

/// @class StatisticsEngine manages statistics calculations and formatting of output for a target image.
///
///   Use as follows:
///    - Read/write properties may be accessed or updated directly.
///    - Read only properties must only be updated using public .set*() methods
///      (where they exist) in order to ensure correct operation.
///    - Private properties and methods should not be updated nor relied upon
///      as they may change in subsequent releasses.
///
///    - Use .setTargetImage() method to set the image to analyse.
///    - EITHER use .calculateAllStats() method to calculate image statistics
///      for all channels and the entire image area. NOTE: This method ignores
///      any current channel or rect selections, and applies range clipping
///      according to the engine settings.
///    - OR use .calculateStats() method to calculate image statistics for the
///      current .selectedChannel and/or .selectedRect.
///    - Use .getResultHeaderString () method to return a set of column headers
///      for the last calculated metadata and statistics as a delimted string.
///    - Use .getResultString() method to return the last calculated metadata
///      and statistics as a delimited string.
function StatisticsEngine()
{
   if ( DEBUGGING_MODE_ON )
   {
      console.noteln( "{ StatisticsEngine" );
   }
   // ******* Public read/write properties. *************************************

   // Instantiate object for evaluating noise.
   this.noiseEngine = new NoiseEvaluationEngine();

   // Statistics options.
   this.numericNotation = false; ///< Use scientific notation if true and Normalized Real format selected.
   this.normalizeScale = true;   ///< Normalize scale estimates if true.
   this.precision = 7;           ///< Precision of floating point output.
   this.unclipped = false;       ///< Unclipped means sample clipping limits are disabled.
   this.clippingLow = 0;         ///< Low sample clipping limit, 0..1
   this.clippingHigh = 1;        ///< High sample clipping limit, 0..1

   // Per image metadata to output.
   this.showFilePath = false;    ///< Include the source file path.
   this.showFileName = false;    ///< Include the source file name.
   this.showFileFull = true;     ///< Include the source file path and file name.
   this.showImageNumber = true;  ///< Include the number of the image 0..n within multi-image files.
   this.showClippingLow = true;  ///< Include the low sample value clipping limit.
   this.showClippingHigh = true; ///< Include the high sample value clipping limit.

   // Per image statistics to output.
   this.showWidth = false;            ///< Include target image width.
   this.showHeight = false;           ///< Include target image height.
   this.showNumberOfChannels = false; ///< Include target image number of channels.

   // Per channel statistics to output.
   this.showCountPct = true;         ///< Include the percentage of pixel samples used.
   this.showCountPx = true;          ///< Include the number of pixel samples used.
   this.showMean = true;             ///< Include the arithmetic mean, i.e. the average of sample values.
   this.showModulus = false;         ///< Include the modulus, i.e. the sum of absolute sample values.
   this.showNorm = false;            ///< Include the norm, i.e. the sum of sample values. (Only differs from Modulus if there are negative values).
   this.showSumOfSquares = false;    ///< Include the sum of square sample values.
   this.showMeanOfSquares = false;   ///< Include the mean of square sample values.
   this.showMedian = true;           ///< Include the median of sample values.
   this.showVariance = true;         ///< Include the variance from the mean.
   this.showStdDev = true;           ///< Include the standard deviation from the mean.
   this.showAvgDev = true;           ///< Include the average absolute deviation from the median.
   this.showMad = true;              ///< Include the median absolute deviation from the median (MAD).
   this.showBwmv = false;            ///< Include the square root of the biweight midvariance.
   this.showPbmv = false;            ///< Include the square root of the percentage bend midvariance.
   this.showSn = false;              ///< Include the Sn scale estimator of Rousseeuw and Croux.
   this.showQn = false;              ///< Include the Qn scale estimator of Rousseeuw and Croux.
   this.showMinimum = true;          ///< Include the minimum sample value.
   this.showMaximum = true;          ///< Include target image maximum sample value.
   this.showMinimumPos = false;      ///< Include the X/Y location of the first instance of the minimum sample value.
   this.showMaximumPos = false;      ///< Include the X/Y location of the first instance of the maximum sample value.
   this.showNoiseEvaluation = false; ///< Include Gaussian noise estimates.

   // ******* Public read only properties. **************************************

   // Statistics options.
   this.targetImage = null; ///< Image to be measured.
   this.numericFormat = 0;  ///< Numeric range for statistics output.
   this.outputFormat = 5;   ///< Output format for file.
   this.unclipped = false;  ///< Unclipped means sample clipping limits are disabled.

   // Metadata of target image, all are single values for targetImage.
   this.filePath = null;    ///< Target image source file directory.
   this.fileName = null;    ///< Target image source file name.
   this.fileFull = null;    ///< Target image source full file path and name.
   this.imageNumber = null; ///< Target image number within file (for multi-image file formats).

   // Whole image statistics, all are single values for targetImage.
   this.width = null;              ///< Target image width.
   this.height = null;             ///< Target image height.
   this.firstResultChannel = null; ///< Target image first channel analysed.
   this.lastResultChannel = null;  ///< Target image last channel analysed.
   this.numberOfChannels = null;   ///< Target image number of channels analysed (may be less than total number of channels).

   // Per channel statistics of target image, all are sparse arrays of [this.firstResultChannel]..[this.lastResultChannel].
   this.countPct = [];      ///< The percentage of pixel samples used.
   this.countPx = [];       ///< The number of pixel samples used.
   this.mean = [];          ///< The arithmetic mean, i.e. the average of sample values.
   this.modulus = [];       ///< The modulus, i.e. the sum of absolute sample values.
   this.norm = [];          ///< The norm, i.e. the sum of sample values. (Only differs from Modulus if there are negative values).
   this.sumOfSquares = [];  ///< The sum of square sample values.
   this.meanOfSquares = []; ///< The mean of square sample values.
   this.median = [];        ///< The median of sample values.
   this.variance = [];      ///< The variance from the mean.
   this.stdDev = [];        ///< The standard deviation from the mean.
   this.avgDev = [];        ///< The average absolute deviation from the median.
   this.mad = [];           ///< The median absolute deviation from the median (MAD).
   this.bwmv = [];          ///< The square root of the biweight midvariance.
   this.pbmv = [];          ///< The square root of the percentage bend midvariance.
   this.sn = [];            ///< The Sn scale estimator of Rousseeuw and Croux.
   this.qn = [];            ///< the Qn scale estimator of Rousseeuw and Croux.
   this.minimum = [];       ///< Target image minimum pixel value.
   this.maximum = [];       ///< Target image maximum pixel value.
   this.minimumPos = [];    ///< Target image minimum pixel location. Point.
   this.maximumPos = [];    ///< Target image maximum pixel location. Point.
   this.sigmaMRS = [];      ///< Target image estimated standard deviation of Gaussian noise based on the MRS method. May be null if no convergence.
   this.countMRS = [];      ///< Target image number of pixels in the noise pixels set based on the MRS method. May be null if no convergence.
   this.layersMRS = [];     ///< Target image number of layers used for noise evaluation based on the MRS method. May be null if no convergence.
   this.sigmaKSigma = [];   ///< Target image estimated standard deviation of Gaussian noise based on the K-Sigma method.
   this.countKSigma = [];   ///< Target image number of pixels in the noise pixels set based on the K-Sigma method.

   // ******* Private properties. ***********************************************

   this.delimiter = ",";     ///< Delimiter added by delimit(), set using .setOutputFormat()
   this.mustDelimit = false; ///< Tracks when to add a delimiter for the .delimit() method.

   // ******* Public methods. ***************************************************

   /// Method to set the target image.
   /// Caller must also call calculaterStates whenever the image changes.
   ///
   /// @param {string} targetImage target image object.
   /// @param {string} fileFull full file path and name for target image object.
   /// @param {integer} imageNumber number of image within file (for multi-image file formats).
   this.setTargetImage = function( targetImage, fileFull, imageNumber )
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ StatisticsEngine.setTargetImage" );
      }
      if ( this.targetImage != targetImage )
      {
         if ( DEBUGGING_MODE_ON )
         {
            console.noteln( "Setting targetImage to: ", fileFull );
         }
         this.targetImage = targetImage;
         this.filePath = File.extractDrive( fileFull ) + File.extractDirectory( fileFull );
         this.fileName = File.extractNameAndSuffix( fileFull );
         this.fileFull = fileFull;
         this.imageNumber = imageNumber;

         // Set target image for noise evaluation engine too.
         this.noiseEngine.setTargetImage( this.targetImage );
      }
      else
      {
         if ( DEBUGGING_MODE_ON )
         {
            console.noteln( "Target image was already set to: ", targetImage );
         }
      }
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} StatisticsEngine.setTargetImage" );
      }
   }; // setTargetImage()

   /// Method to set numeric output format.
   /// 0: Normalized Real [0,1]
   /// 1: 8 Bit [0,255]
   /// 2: 10 Bit [0,1023]
   /// 3: 12 Bit [0,4095]
   /// 4: 14 Bit [0,16383]
   /// 5: 16 Bit [0,65535]
   ///
   /// @param {string} numericFormat format of output 0..5
   this.setNumericFormat = function( numericFormat )
   {
		switch ( numericFormat )
      {
      case 1: // 8 Bit [0,255]
      case 2: // 10 Bit [0,1023]
      case 3: // 12 Bit [0,4095]
      case 4: // 14 Bit [0,16383]
      case 5: // 16 Bit [0,65535]
         this.numericFormat = numericFormat;
         break;
      case 0: // Normalized Real [0,1]
      default:
         this.numericFormat = 0;
      }
   }; // setNumericFormat()

   /// Method to set output file format.
   /// O: TAB
   /// 1: PIPE
   /// 2: COLON
   /// 3: SPACE
   /// 4: COMMA
   /// 5: CSV
   ///
   /// @param {string} outputFormat format of file 0..5
   this.setOutputFormat = function( outputFormat )
   {
      this.outputFormat = outputFormat;
      switch ( outputFormat ) {
      case 0: // TAB
         this.delimiter = "\t";
         break;
      case 1: // PIPE
         this.delimiter = "|";
         break;
      case 2: // COLON
         this.delimiter = ":";
         break;
      case 3: // SPACE
         this.delimiter = " ";
         break;
      case 4: // COMMA
      case 5: // CSV
         this.delimiter = ",";
         break;
      default:
         // Default to CSV.
         this.delimiter = ",";
         this.outputFormat = 5;
      }
   };

   /// Method to retrieve parameters from previous run.
   ///
   this.importParameters = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ StatisticsEngine.importParameters" );
      }

      this.numericFormat = ( Parameters.has( "numericFormat" ) ) ? Parameters.getInteger( "numericFormat" ) : this.numericFormat;
      this.numericNotation = ( Parameters.has( "numericNotation" ) ) ? Parameters.getBoolean( "numericNotation" ) : this.numericNotation;
      this.normalizeScale = ( Parameters.has( "normalizeScale" ) ) ? Parameters.getBoolean( "normalizeScale" ) : this.normalizeScale;
      this.precision = ( Parameters.has( "precision" ) ) ? Parameters.getInteger( "precision" ) : this.precision;
      this.outputFormat = ( Parameters.has( "outputFormat" ) ) ? Parameters.getInteger( "outputFormat" ) : this.outputFormat;
      this.unclipped = ( Parameters.has( "unclipped" ) ) ? Parameters.getBoolean( "unclipped" ) : this.unclipped;

      this.clippingLow = ( Parameters.has( "clippingLow" ) ) ? Parameters.getReal( "clippingLow" ) : this.clippingLow;
      this.clippingHigh = ( Parameters.has( "clippingHigh" ) ) ? Parameters.getReal( "clippingHigh" ) : this.clippingHigh;

      this.showFilePath = ( Parameters.has( "showFilePath" ) ) ? Parameters.getBoolean( "showFilePath" ) : this.showFilePath;
      this.showFileName = ( Parameters.has( "showFileName" ) ) ? Parameters.getBoolean( "showFileName" ) : this.showFileName;
      this.showFileFull = ( Parameters.has( "showFileFull" ) ) ? Parameters.getBoolean( "showFileFull" ) : this.showFileFull;
      this.showImageNumber = ( Parameters.has( "showImageNumber" ) ) ? Parameters.getBoolean( "showImageNumber" ) : this.showImageNumber;
      this.showClippingLow = ( Parameters.has( "showClippingLow" ) ) ? Parameters.getBoolean( "showClippingLow" ) : this.showClippingLow;
      this.showClippingHigh = ( Parameters.has( "showClippingHigh" ) ) ? Parameters.getBoolean( "showClippingHigh" ) : this.showClippingHigh;

      this.showWidth = ( Parameters.has( "showWidth" ) ) ? Parameters.getBoolean( "showWidth" ) : this.showWidth;
      this.showHeight = ( Parameters.has( "showHeight" ) ) ? Parameters.getBoolean( "showHeight" ) : this.showHeight;
      this.showNumberOfChannels = ( Parameters.has( "showNumberOfChannels" ) ) ? Parameters.getBoolean( "showNumberOfChannels" ) : this.showNumberOfChannels;

      this.showCountPct = ( Parameters.has( "showCountPct" ) ) ? Parameters.getBoolean( "showCountPct" ) : this.showCountPct;
      this.showCountPx = ( Parameters.has( "showCountPx" ) ) ? Parameters.getBoolean( "showCountPx" ) : this.showCountPx;
      this.showMean = ( Parameters.has( "showMean" ) ) ? Parameters.getBoolean( "showMean" ) : this.showMean;
      this.showModulus = ( Parameters.has( "showModulus" ) ) ? Parameters.getBoolean( "showModulus" ) : this.showModulus;
      this.showNorm = ( Parameters.has( "showNorm" ) ) ? Parameters.getBoolean( "showNorm" ) : this.showNorm;
      this.showSumOfSquares = ( Parameters.has( "showSumOfSquares" ) ) ? Parameters.getBoolean( "showSumOfSquares" ) : this.showSumOfSquares;
      this.showMeanOfSquares = ( Parameters.has( "showMeanOfSquares" ) ) ? Parameters.getBoolean( "showMeanOfSquares" ) : this.showMeanOfSquares;
      this.showMedian = ( Parameters.has( "showMedian" ) ) ? Parameters.getBoolean( "showMedian" ) : this.showMedian;
      this.showVariance = ( Parameters.has( "showVariance" ) ) ? Parameters.getBoolean( "showVariance" ) : this.showVariance;
      this.showStdDev = ( Parameters.has( "showStdDev" ) ) ? Parameters.getBoolean( "showStdDev" ) : this.showStdDev;
      this.showAvgDev = ( Parameters.has( "showAvgDev" ) ) ? Parameters.getBoolean( "showAvgDev" ) : this.showAvgDev;
      this.showMad = ( Parameters.has( "showMad" ) ) ? Parameters.getBoolean( "showMad" ) : this.showMad;
      this.showBwmv = ( Parameters.has( "showBwmv" ) ) ? Parameters.getBoolean( "showBwmv" ) : this.showBwmv;
      this.showPbmv = ( Parameters.has( "showPbmv" ) ) ? Parameters.getBoolean( "showPbmv" ) : this.showPbmv;
      this.showSn = ( Parameters.has( "showSn" ) ) ? Parameters.getBoolean( "showSn" ) : this.showSn;
      this.showQn = ( Parameters.has( "showQn" ) ) ? Parameters.getBoolean( "showQn" ) : this.showQn;
      this.showMinimum = ( Parameters.has( "showMinimum" ) ) ? Parameters.getBoolean( "showMinimum" ) : this.showMinimum;
      this.showMaximum = ( Parameters.has( "showMaximum" ) ) ? Parameters.getBoolean( "showMaximum" ) : this.showMaximum;
      this.showMinimumPos = ( Parameters.has( "showMinimumPos" ) ) ? Parameters.getBoolean( "showMinimumPos" ) : this.showMinimumPos;
      this.showMaximumPos = ( Parameters.has( "showMaximumPos" ) ) ? Parameters.getBoolean( "showMaximumPos" ) : this.showMaximumPos;
      this.showNoiseEvaluation = ( Parameters.has( "showNoiseEvaluation" ) ) ? Parameters.getBoolean( "showNoiseEvaluation" ) : this.showNoiseEvaluation;

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "this.numericFormat == " + this.numericFormat );
         console.noteln( "} StatisticsEngine.importParameters" );
      }
   };

   /// Method to store current parameters for use in subsequent runs.
   ///
   this.exportParameters = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ StatisticsEngine.exportParameters" );
      }

      Parameters.set( "numericFormat", this.numericFormat );
      Parameters.set( "numericNotation", this.numericNotation );
      Parameters.set( "normalizeScale", this.normalizeScale );
      Parameters.set( "precision", this.precision );
      Parameters.set( "outputFormat", this.outputFormat );
      Parameters.set( "unclipped", this.unclipped );

      Parameters.set( "clippingLow", this.clippingLow );
      Parameters.set( "clippingHigh", this.clippingHigh );

      Parameters.set( "showFilePath", this.showFilePath );
      Parameters.set( "showFileName", this.showFileName );
      Parameters.set( "showFileFull", this.showFileFull );
      Parameters.set( "showImageNumber", this.showImageNumber );
      Parameters.set( "showClippingLow", this.showClippingLow );
      Parameters.set( "showClippingHigh", this.showClippingHigh );

      Parameters.set( "showWidth", this.showWidth );
      Parameters.set( "showHeight", this.showHeight );
      Parameters.set( "showNumberOfChannels", this.showNumberOfChannels );

      Parameters.set( "showCountPct", this.showCountPct );
      Parameters.set( "showCountPx", this.showCountPx );
      Parameters.set( "showMean", this.showMean );
      Parameters.set( "showModulus", this.showModulus );
      Parameters.set( "showNorm", this.showNorm );
      Parameters.set( "showSumOfSquares", this.showSumOfSquares );
      Parameters.set( "showMeanOfSquares", this.showMeanOfSquares );
      Parameters.set( "showMedian", this.showMedian );
      Parameters.set( "showVariance", this.showVariance );
      Parameters.set( "showStdDev", this.showStdDev );
      Parameters.set( "showAvgDev", this.showAvgDev );
      Parameters.set( "showMad", this.showMad );
      Parameters.set( "showBwmv", this.showBwmv );
      Parameters.set( "showPbmv", this.showPbmv );
      Parameters.set( "showSn", this.showSn );
      Parameters.set( "showQn", this.showQn );
      Parameters.set( "showMinimum", this.showMinimum );
      Parameters.set( "showMaximum", this.showMaximum );
      Parameters.set( "showMinimumPos", this.showMinimumPos );
      Parameters.set( "showMaximumPos", this.showMaximumPos );
      Parameters.set( "showNoiseEvaluation", this.showNoiseEvaluation );

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} StatisticsEngine.exportParameters" );
      }
   };

   /// Method to caculate the enabled set of stats on all channels of the whole target image.
   /// NOTE: Disregards any channel or rect selections and applies range clipping as required by engine settings.
   /// NOTE: Disabled stats are reset to null to avoid mistakes!
   ///
   this.calculateAllStats = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ StatisticsEngine.calculateAllStats" );
      }

      if ( this.targetImage.isNull )
      {
         // No target image!
         if ( DEBUGGING_MODE_ON )
         {
            console.warningln( "WARNING: Tried to calcuate statistics on a null target image." );
         }

            // Clear metadata and stats.
         this.clearAll();
         return;
      }
      else
      {
         // Using direct image statistics and the ImageStatistics object is described here:
         // http://pixinsight.com/forum/index.php?topic=1118.0
         // For more background on the above methods, the PCL ImageStatistics class is described here:
         // https://pixinsight.com/developer/pcl/doc/html/classpcl_1_1ImageStatistics.html
         // See this for using Image object statistics which is the preferred method:
         // http://pixinsight.com/forum/index.php?topic=7837.msg51872#msg51872

         this.targetImage.pushSelections();

         // Set appropriate selection parameters on target image.
         this.targetImage.resetSelections();
         this.setClipping();

         // Calculate whole image statistics.
         this.calculateImageStats();
         this.firstResultChannel = 0;
         this.lastResultChannel = this.targetImage.numberOfChannels - 1;
         this.numberOfChannels = this.targetImage.numberOfChannels;

         for ( var channel=0; channel < this.targetImage.numberOfChannels; ++channel )
         {
            // Calculate per channel statistics.
            this.calculateChannelStats( channel );
         }

         this.targetImage.popSelections();
      }

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} StatisticsEngine.calculateAllStats" );
      }
   }; // this.calculateAllStats()

   /// Method to caculate the enabled set of stats on the selected channel(s) and area of the target image.
   /// NOTE: Any .selectedChannel and/or .selectedRect are respected on the image.
   /// NOTE: Disabled stats are reset to null to avoid mistakes!
   ///
   this.calculateStats = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ StatisticsEngine.calculateStats" );
      }

      if ( this.targetImage.isNull )
      {
         // No target image!
         if ( DEBUGGING_MODE_ON )
         {
            console.warningln( "WARNING: Tried to calcuate statistics on a null target image." );
         }

         // Clear metadata and stats.
         this.clearAll();
         return;
      }
      else
      {
         this.targetImage.pushSelections();

         // Set appropriate selection parameters on target image.
         this.setClipping();

         // Calculate whole image statistics.
         this.calculateImageStats();
         this.firstResultChannel = this.targetImage.firstSelectedChannel;
         this.lastResultChannel = this.targetImage.lastSelectedChannel;
         this.numberOfChannels = this.lastResultChannel - this.firstResultChannel + 1;

         // Calculate per channel statistics.
         for ( var channel = this.firstResultChannel; channel <= this.lastResultChannel; ++channel )
         {
            // Calculate per channel statistics.
            this.calculateChannelStats( channel );
         }

         this.targetImage.popSelections();
      }

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} StatisticsEngine.calculateStats" );
      }
   }; // this.calculateStats()

   /// Method to return a string containing the delimited column headers for the
   /// metadata and statistics last calculated.
   ///
   this.getResultHeaderString = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ StatisticsEngine.getResultHeader" );
      }
      // Start of a new line, so reset mustDelimit flag.
      this.mustDelimit = false;

      // Metadata to output.
      var resultHeader = ( this.showFilePath ? this.delimit( "File_Path" ) : "" ) +
                         ( this.showFileName ? this.delimit( "File_Name" ) : "" ) +
                         ( this.showFileFull ? this.delimit( "File_Full_Name" ) : "" ) +
                         ( this.showImageNumber ? this.delimit( "Image_Number" ) : "" ) +
                         ( this.showClippingLow ? this.delimit( "Clipping_Low" ) : "" ) +
                         ( this.showClippingHigh ? this.delimit( "Clipping_High" ) : "" );

      // Whole image statistics to output.
      resultHeader = resultHeader +
                     ( this.showWidth ? this.delimit( "Width" ) : "" ) +
                    ( this.showHeight ? this.delimit( "Height" ) : "" ) +
                    ( this.showNumberOfChannels ? this.delimit( "Channels_First_Analysed" ) : "" ) +
                     ( this.showNumberOfChannels ? this.delimit( "Channels_Last_Analysed" ) : "" ) +
                     ( this.showNumberOfChannels ? this.delimit( "Channels_Analysed" ) : "" );

      // Per channel statistics to output.
      for ( var channel = this.firstResultChannel; channel <= this.lastResultChannel; ++channel )
      {
         resultHeader = resultHeader +
                        ( this.showCountPct ? this.delimit( "Count_Pct_" + channel ) : "" ) +
                        ( this.showCountPx ? this.delimit( "Count_Px_" + channel ) : "" ) +
                        ( this.showMean ? this.delimit( "Mean_" + channel ) : "" ) +
                        ( this.showMedian ? this.delimit( "Median_" + channel ) : "" ) +
                        ( this.showModulus ? this.delimit( "Modulus_" + channel ) : "" ) +
                        ( this.showNorm ? this.delimit( "Norm_" + channel ) : "" ) +
                        ( this.showSumOfSquares ? this.delimit( "Sum_Of_Squares_" + channel ) : "" ) +
                        ( this.showMeanOfSquares ? this.delimit( "Mean_Of_Squares_" + channel ) : "" ) +
                        ( this.showVariance ? this.delimit( "Variance_" + channel ) : "" ) +
                        ( this.showStdDev ? this.delimit( "StdDev_" + channel ) : "" ) +
                        ( this.showAvgDev ? this.delimit( "AvgDev_" + channel ) : "" ) +
                        ( this.showMad ? this.delimit( "MAD_" + channel ) : "" ) +
                        ( this.showBwmv ? this.delimit( "SQRT_BWMV_" + channel ) : "" ) +
                        ( this.showPbmv ? this.delimit( "SQRT_PBMV_" + channel ) : "" ) +
                        ( this.showSn ? this.delimit( "Sn_" + channel ) : "" ) +
                        ( this.showQn ? this.delimit( "Qn_" + channel ) : "" ) +
                        ( this.showMinimum ? this.delimit( "Min_" + channel ) : "" ) +
                        ( this.showMaximum ? this.delimit( "Max_" + channel ) : "" ) +
                        ( this.showMinimumPos ? this.delimit( "Min_Pos_X_" + channel ) : "" ) +
                        ( this.showMinimumPos ? this.delimit( "Min_Pos_Y_" + channel ) : "" ) +
                        ( this.showMaximumPos ? this.delimit( "Max_Pos_X_" + channel ) : "" ) +
                        ( this.showMaximumPos ? this.delimit( "Max_Pos_Y_" + channel ) : "" ) +
                        ( this.showNoiseEvaluation ? this.delimit( "Sigma_MRS_" + channel) +
                                                     this.delimit( "Count_MRS_" + channel) +
                                                     this.delimit( "Layers_MRS_" + channel) +
                                                     this.delimit( "Sigma_K_Sigma_" + channel) +
                                                     this.delimit( "Count_K_Sigma_" + channel)
                                                     : "" );
      }

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} StatisticsEngine.getResultHeader" );
      }
      return resultHeader;
   }; // this.getResultHeader

   /// Method to return a string containing the formatted and delimited metadata
   /// and statistics last calculated.
   ///
   this.getResultString = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ StatisticsEngine.getResultString" );
      }
      // Start of a new line, so reset mustDelimit flag.
      this.mustDelimit = false;

      // Metadata to output.
      var resultString = ( this.showFilePath ? this.delimit( this.filePath ) : "" ) +
                         ( this.showFileName ? this.delimit( this.fileName ) : "" ) +
                         ( this.showFileFull ? this.delimit( this.fileFull ) : "" ) +
                         ( this.showImageNumber ? this.delimit( this.imageNumber ) : "" ) +
                         ( this.showClippingLow ? this.delimit( this.unclipped ? "" : this.floatFormatDepth( this.clippingLow ) ) : "" ) +
                         ( this.showClippingHigh ? this.delimit( this.unclipped ? "" : this.floatFormatDepth( this.clippingHigh ) ) : "" );

      // Whole image statistics to output.
      resultString = resultString +
                     ( this.showWidth ? this.delimit( this.intFormat( this.width ) ) : "" ) +
                     ( this.showHeight ? this.delimit( this.intFormat( this.height ) ) : "" ) +
                     ( this.showNumberOfChannels ? this.delimit( this.intFormat( this.firstResultChannel ) ) : "" ) +
                     ( this.showNumberOfChannels ? this.delimit( this.intFormat( this.lastResultChannel ) ) : "" ) +
                     ( this.showNumberOfChannels ? this.delimit( this.intFormat( this.numberOfChannels ) ) : "" );

      // Per channel statistics to output.
      for ( var channel = this.firstResultChannel; channel <= this.lastResultChannel; ++channel )
      {

         resultString = resultString +
                        ( this.showCountPct ? this.delimit( this.floatFormat( this.countPct[channel] ) ) : "" ) +
                        ( this.showCountPx ? this.delimit( this.intFormat( this.countPx[channel] ) ) : "" ) +
                        ( this.showMean ? this.delimit( this.floatFormatDepth( this.mean[channel] ) ) : "" ) +
                        ( this.showMedian ? this.delimit( this.floatFormatDepth( this.median[channel] ) ) : "" ) +
                        ( this.showModulus ? this.delimit( this.floatFormatDepth( this.modulus[channel] ) ) : "" ) +
                        ( this.showNorm ? this.delimit( this.floatFormatDepth( this.norm[channel] ) ) : "" ) +
                        ( this.showSumOfSquares ? this.delimit( this.floatFormatDepth( this.sumOfSquares[channel] ) ) : "" ) +
                        ( this.showMeanOfSquares ? this.delimit( this.floatFormatDepth( this.meanOfSquares[channel] ) ) : "" ) +
                        ( this.showVariance ? this.delimit( this.floatFormatDepth( this.variance[channel] ) ) : "" ) +
                        ( this.showStdDev ? this.delimit( this.floatFormatDepth( this.stdDev[channel] ) ) : "" ) +
                        // Normalize scale estimates by multiplying with constants as described here:
                        // http://pixinsight.com/forum/index.php?topic=6328.0
                        ( this.showAvgDev ? this.delimit( this.floatFormatDepth( this.avgDev[channel] * ( ( this.normalizeScale ) ? 1.2533 : 1 ) ) ) : "" ) +
                        ( this.showMad ? this.delimit( this.floatFormatDepth( this.mad[channel] * ( ( this.normalizeScale ) ? 1.4826 : 1 ) ) ) : "" ) +
                        ( this.showBwmv ? this.delimit( this.floatFormatDepth( this.bwmv[channel] * ( ( this.normalizeScale ) ? 0.9901 : 1 ) ) ) : "" ) +
                        ( this.showPbmv ? this.delimit( this.floatFormatDepth( this.pbmv[channel] * ( ( this.normalizeScale ) ? 0.9709 : 1 ) ) ) : "" ) +
                        ( this.showSn ? this.delimit( this.floatFormatDepth( this.sn[channel] * ( ( this.normalizeScale ) ? 1.1926 : 1 ) ) ) : "" ) +
                        ( this.showQn ? this.delimit( this.floatFormatDepth( this.qn[channel] * ( ( this.normalizeScale ) ? 2.2191 : 1 ) ) ) : "" ) +
                        ( this.showMinimum ? this.delimit( this.floatFormatDepth( this.minimum[channel] ) ) : "" ) +
                        ( this.showMaximum ? this.delimit( this.floatFormatDepth( this.maximum[channel] ) ) : "" ) +
                        ( this.showMinimumPos ? this.delimit( this.intFormat( this.minimumPos[channel].x ) ) : "" ) +
                        ( this.showMinimumPos ? this.delimit( this.intFormat( this.minimumPos[channel].y ) ) : "" ) +
                        ( this.showMaximumPos ? this.delimit( this.intFormat( this.maximumPos[channel].x ) ) : "" ) +
                        ( this.showMaximumPos ? this.delimit( this.intFormat( this.maximumPos[channel].y ) ) : "" ) +
                        ( this.showNoiseEvaluation ?
                          (
                             ( this.sigmaMRS[channel] == null ?
                               (
                                  this.delimit( "" ) +
                                  this.delimit( "" ) +
                                  this.delimit( "" )
                               )
                               :
                               (
                                  this.delimit( this.floatFormatDepth( this.sigmaMRS[channel] ) ) +
                                  this.delimit( this.intFormat( this.countMRS[channel] ) ) +
                                  this.delimit( this.intFormat( this.layersMRS[channel] ) )
                               )
                             ) +
                             this.delimit( this.floatFormatDepth( this.sigmaKSigma[channel] ) ) +
                             this.delimit( this.intFormat( this.countKSigma[channel] ) )
                          )
                          :
                          ""
                        );
      }

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} StatisticsEngine.getResultString" );
      }
      return resultString;
   }; // this.getResultString

   // ******* Private methods. **************************************************

   /// Method to clear all stored metadata and statistics.
   ///
   this.clearAll = function()
   {
         // Clear metadata.
         this.filePath = null;
         this.fileName = null;
         this.fileFull = null;
         this.imageNumber = null;

         // Clear whole image statistics.
         this.height = null;
         this.width = null;
         this.firstResultChannel = null;
         this.lastResultChannel = null;
         this.numberOfChannels = null;

         // Clear per channel statistics.
         this.countPct.length = 0;
         this.countPx.length = 0;
         this.mean.length = 0;
         this.modulus.length = 0;
         this.norm.length = 0;
         this.sumOfSquares.length = 0;
         this.meanOfSquares.length = 0;
         this.median.length = 0;
         this.variance.length = 0;
         this.stdDev.length = 0;
         this.avgDev.length = 0;
         this.mad.length = 0;
         this.bwmv.length = 0;
         this.pbmv.length = 0;
         this.sn.length = 0;
         this.qn.length = 0;
         this.minimum.length = 0;
         this.maximum.length = 0;
         this.minimumPos.length = 0;
         this.maximumPos.length = 0;
         this.sigmaMRS.length = 0;
         this.countMRS.length = 0;
         this.layersMRS.length = 0;
         this.sigmaKSigma.length = 0;
         this.countKSigma.length = 0;
   }

   /// Method to set range clipping parameters on target image.
   ///
   this.setClipping = function()
   {
      if ( this.unclipped )
      {
         this.targetImage.rangeClippingEnabled = false;
      }
      else
      {
         this.targetImage.rangeClippingEnabled = true;
         if ( this.clippingLow >= 0 && this.clippingLow <= 1 )
         {
            this.targetImage.rangeClipLow = this.clippingLow;
         }
         else
         {
            this.targetImage.rangeClipLow = 0;
         }
         if ( this.clippingHigh >= 0 && this.clippingHigh <= 1 )
         {
            this.targetImage.rangeClipHigh = this.clippingHigh;
         }
         else
         {
            this.targetImage.rangeClipHigh = 0;
         }
      }
   }

   /// Method to calculate whole image statistics for target image.
   ///
   this.calculateImageStats = function()
   {
      // Calculate whole image statistics.
      this.height = ( this.showHeight ) ? this.targetImage.height : null;
      this.width = ( this.showWidth ) ? this.targetImage.width : null;
   }

   /// Method to calculate whole image statistics for target image.
   ///
   /// @param {Integer} channel the channel for which the stats will be calculated.
   this.calculateChannelStats = function( channel )
   {
      this.targetImage.selectedChannel = channel;

      // Store calculated stats.
      this.countPct[channel] = ( this.showCountPct ) ? this.targetImage.count() / (this.targetImage.height * this.targetImage.width) * 100 : null;
      this.countPx[channel] = ( this.showCountPx ) ? this.targetImage.count() : null;
      this.mean[channel] = ( this.showMean ) ? this.targetImage.mean() : null;
      this.modulus[channel] = ( this.showModulus ) ? this.targetImage.modulus() : null;
      this.norm[channel] = ( this.showNorm ) ? this.targetImage.norm() : null;
      this.sumOfSquares[channel] = ( this.showSumOfSquares ) ? this.targetImage.sumOfSquares() : null;
      this.meanOfSquares[channel] = ( this.showMeanOfSquares ) ? this.targetImage.meanOfSquares() : null;
      this.median[channel] = ( this.showMedian ) ? this.targetImage.median() : null;
      this.variance[channel] = ( this.showVariance ) ? this.targetImage.variance() : null;
      this.stdDev[channel] = ( this.showStdDev ) ? this.targetImage.stdDev() : null;
      this.avgDev[channel] = ( this.showAvgDev ) ? this.targetImage.avgDev() : null;
      this.mad[channel] = ( this.showMad ) ? this.targetImage.MAD() : null;
      this.bwmv[channel] = ( this.showBwmv ) ? Math.sqrt( this.targetImage.BWMV() ) : null;
      this.pbmv[channel] = ( this.showPbmv ) ? Math.sqrt( this.targetImage.PBMV() ) : null;
      this.sn[channel] = ( this.showSn ) ? this.targetImage.Sn() : null;
      this.qn[channel] = ( this.showQn ) ? this.targetImage.Qn() : null;
      this.minimum[channel] = ( this.showMinimum ) ? this.targetImage.minimum() : null;
      this.maximum[channel] = ( this.showMaximum ) ? this.targetImage.maximum() : null;
      this.minimumPos[channel] = ( this.showMinimumPos ) ? this.targetImage.minimumPosition() : null;
      this.maximumPos[channel] = ( this.showMaximumPos ) ? this.targetImage.maximumPosition() : null;
      if ( this.showNoiseEvaluation )
      {
         // Calculate noise estimates.
         this.noiseEngine.evaluateNoise();
         // Retrieve all noise estimator values.
         this.sigmaMRS[channel] = this.noiseEngine.sigmaMRS;   // May be null if no convergence.
         this.countMRS[channel] = this.noiseEngine.countMRS;   // May be null if no convergence.
         this.layersMRS[channel] = this.noiseEngine.layersMRS; // May be null if no convergence.
         this.sigmaKSigma[channel] = this.noiseEngine.sigmaKSigma;
         this.countKSigma[channel] = this.noiseEngine.countKSigma;
      }
      else
      {
         // Set all noise estimator values to null.
         this.sigmaMRS[channel] = null;
         this.countMRS[channel] = null;
         this.layersMRS[channel] = null;
         this.sigmaKSigma[channel] = null;
         this.countKSigma[channel] = null;
      }
   }

   /// Method to format a floating point number in accordance with the engine's settings.
   ///
   /// @param {real} floatValue is the value to be formatted.
   this.floatFormat = function( floatValue )
   {
      // See http://en.wikipedia.org/wiki/Printf_format_string#Format_placeholders
      if ( this.numericNotation )
      {
         return format( "%.*e", this.precision, floatValue);
      }
      else
      {
         return format( "%.*f", this.precision, floatValue);
      }
   }

   /// Method to convert a floating point number to an integer bit depth or real in accordance with the engine's settings.
   ///
   /// @param {real} floatValue is the value to be formatted.
   this.floatFormatDepth = function( floatValue )
   {
      switch ( this.numericFormat )
      {
      case 1: // 8 Bit [0,255]
         return format( "%d", Math.round( floatValue * 255 ) );
      case 2: // 10 Bit [0,1023]
         return format( "%d", Math.round( floatValue * 1023 ) );
      case 3: // 12 Bit [0,4095]
         return format( "%d", Math.round( floatValue * 4095 ) );
      case 4: // 14 Bit [0,16383]
         return format( "%d", Math.round( floatValue * 16383 ) );
      case 5: // 16 Bit [0,65535]
         return format( "%d", Math.round( floatValue * 65535 ) );
      case 0: // Normalized Real [0,1]
      default:
         if ( this.numericNotation )
         {
            return format( "%.*e", this.precision, floatValue);
         }
         else
         {
            return format( "%.*f", this.precision, floatValue);
         }
      }
   }

   /// Method to format an integer number in accordance with the engine's settings.
   /// No purpose right now, but may extend to enable fixed column width file formats later.
   ///
   /// @param {integer} intValue is the value to be formatted.
   this.intFormat = function( intValue )
   {
      return format( "%d", intValue);
   }

   /// Method to return an output value with the required resultFormat delimiters.
   /// The caller must reset the .mustDelimit property to false at the start of each new line!
   ///
   /// @param {string} outputValue is the value to be delimited.
   this.delimit = function( outputValue )
   {
      if ( this.outputFormat == 5 || outputValue.search(this.delimiter) != -1 )
      {
         // CSV Format or contains the delimiter so add quotes.
         var delimitedValue = "\"" + outputValue + "\"";
      }
      else
      {
         var delimitedValue = outputValue;
      }
      if ( this.mustDelimit )
      {
         // This is not the first item in the output string, so prepend a delimiter.
         delimitedValue = this.delimiter + delimitedValue;
      }
      else
      {
         // This is the first item in the output string, so flag to delimit subsequent items.
         this.mustDelimit = true;
      }
      return delimitedValue;
   }

   if ( DEBUGGING_MODE_ON )
   {
      console.noteln( "} StatisticsEngine" );
   }
}  // class StatisticsEngine

// ----------------------------------------------------------------------------
// EOF BatchStatistics-Engine.js - Released 2015/11/30 00:00:00 UTC
