// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// BatchStatistics-GUI.js - Released 2015/11/30 00:00:00 UTC
// ----------------------------------------------------------------------------
//
// This file is part of BatchStatistics Script version 1.2.2
//
// Copyright (C) 2014-2015 Ian Lauwerys. (www.blackwaterskies.co.uk)
//
// Based on BatchFormatConversion.js, NoiseEvaluation.js and other work.
// Copyright (c) 2009-2014 Pleiades Astrophoto S.L.
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
          Mainly to enabling / disabling controls when processing.
   1.2.1: Bug fix release
          Fixed problem where saving a script instance with no input files and
          relaunching it created an empty file name in the input file list.
   1.2:   Third (full) release.
          Fixed script not aborting processing when dialog close button used.
          Fixed re-sizing of file list so that scroll-bars appear when needed.
   1.1b:  Second (beta) release.
          Fixed incorrect restoration of settings from process icon.
          Fixed problems with reentrant controls crashing script.
          Added abort processing button/functionality.
          Added PIDOC documentation and help button.
   1.0b:  First (beta) release.
*/

// ========= # defines / includes ==============================================

#ifndef BatchStatistics_GUI_js
#define BatchStatistics_GUI_js
#endif

// Define as true for debug messages to console.
#ifndef DEBUGGING_MODE_ON
#define DEBUGGING_MODE_ON false
#endif

// Includes.
#ifndef GUIFactory_lib_js
#include "GUIFactory-lib.js" // Factory for UI widgets.
#endif

// ======== # UI classes =======================================================

/// @class Modal dialog for user interaction with BatchStatistics script.
///
/// @param {object} engine The object for conducting the actual processing work.
function BatchStatisticsDialog( engine )
{
   if ( DEBUGGING_MODE_ON )
   {
      console.noteln( "{ BatchStatisticsDialog" );
   }
   this.__base__ = Dialog;
   this.__base__();

   // Instantiate factory for creating UI widgets.
   this.UIFactory = new GUIFactory();

   // Deal with cross-platform UI layout issues if needed.
   // See: http://pixinsight.com/forum/index.php?topic=5337.0
   this.restyle();

   // Reference to the engine for this instance of the script.
   this.engine = engine;

	// Flag to indicate when processing is taking place and so any user input except Abort to be ignored.
	this.isProcessing = false;
	// Flag to indicate when user has pressed dialog's abort button.
	this.abortRequested = false;

   // Global options properties.
   this.outputToConsole = true;    ///< Output statistics to console if true.
   this.outputToFile = true;       ///< Output statistics to file if true.
   this.outputFile = "";           ///< File name for file output.
   this.overwriteExisting = false; ///< Overwrote existing file if true.
   this.appendExisting = false;    ///< Append to any existing file if true.
   this.includeHeader = true;      ///< Output column headers as first row of file if true.

   // Files to be analysed.
   this.inputFiles = new Array;
   this.inputImageWindow = null;

   /// Method to retrieve parameters from previous instantiation.
   ///
   this.importParameters = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ BatchStatisticsDialog.importParameters" );
      }
      this.outputToConsole = ( Parameters.has( "outputToConsole" ) ) ? Parameters.getBoolean( "outputToConsole" ) : this.outputToConsole;
      this.dialog.consoleOutputCheckBox.checked = this.outputToConsole;
      this.outputToFile = ( Parameters.has( "outputToFile" ) ) ? Parameters.getBoolean( "outputToFile" ) : this.outputToFile;
      this.dialog.fileOutputCheckBox.checked = this.outputToFile;
      // Update other controls based on the state of this one.
      this.dialog.fileOutputCheckBox.onClick( this.outputToFile );
      this.outputFile = ( Parameters.has( "outputFile" ) ) ? Parameters.getString( "outputFile" ) : this.outputFile;
      this.dialog.outputFileEdit.text = this.outputFile;
      this.overwriteExisting = ( Parameters.has( "overwriteExisting" ) ) ? Parameters.getBoolean( "overwriteExisting" ) : this.overwriteExisting;
      this.dialog.overwriteExistingCheckBox.checked = this.overwriteExisting;
      // Update other controls based on the state of this one.
      this.dialog.overwriteExistingCheckBox.onClick( this.overwriteExisting );
      this.appendExisting = ( Parameters.has( "appendExisting" ) ) ? Parameters.getBoolean( "appendExisting" ) : this.appendExisting;
      this.dialog.appendExistingCheckBox.checked = this.appendExisting;
      this.includeHeader = ( Parameters.has( "includeHeader" ) ) ? Parameters.getBoolean( "includeHeader" ) : this.includeHeader;
      this.dialog.includeHeaderCheckBox.checked = this.includeHeader;
      if ( Parameters.has( "inputFiles" ) )
      {
         // Add the comma separated list of file names as elements in the InputFiles array.
         // Also add them to the Tree box in the UI dialog.
         var inputFilesList = Parameters.getString( "inputFiles" ).split( "," );
         this.dialog.filesTreeBox.canUpdate = false;
         for ( var i in inputFilesList )
         {
            var node = new TreeBoxNode( this.dialog.filesTreeBox );
            node.setText( 0, inputFilesList[i] );
            this.inputFiles.push( inputFilesList[i] );
         }
         this.dialog.filesTreeBox.canUpdate = true;
      }
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} BatchStatisticsDialog.importParameters" );
      }
   }

   /// Method to store current parameters for use in subsequent instantiations.
   ///
   this.exportParameters = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ BatchStatisticsDialog.exportParameters" );
      }
      Parameters.set( "outputToConsole", this.outputToConsole );
      Parameters.set( "outputToFile", this.outputToFile );
      Parameters.set( "outputFile", this.outputFile );
      Parameters.set( "overwriteExisting", this.overwriteExisting );
      Parameters.set( "appendExisting", this.appendExisting );
      Parameters.set( "includeHeader", this.includeHeader );
      if ( this.inputFiles.length > 0 )
      {
         // If inputFiles is empty, then Parameters.set will create a parameter with a single space.
         // This then causes .importParameters to create an empty file name as the first input file leading to issues.
         Parameters.set( "inputFiles", this.inputFiles );
      }
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} BatchStatisticsDialog.exportParameters" );
      }
   };

   /// Method to update all UI elements to reflect current dialog and engine object's settings.
   ///
   this.updateUI = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ BatchStatisticsDialog.updateUI" );
      }

      if ( this.dialog.isProcessing )
      {
         this.dialog.cancelButton.text = "Abort";
         this.dialog.cancelButton.icon = this.scaledResource( ":/icons/stop.png" );
         this.dialog.cancelButton.toolTip = "<p>Abort image analysis.</p>";

         // Disable all UI elements relating to this object's properties.
         this.dialog.filesTreeBox.adjustColumnWidthToContents( 0 );
         this.dialog.consoleOutputCheckBox.enabled = false;
         this.dialog.fileOutputCheckBox.enabled = false;
         this.dialog.overwriteExistingCheckBox.enabled = false;
         this.dialog.appendExistingCheckBox.enabled = false;
         this.dialog.includeHeaderCheckBox.enabled = false;
         this.dialog.outputFileEdit.enabled = false;
         this.dialog.outputFileButton.enabled = false;
         this.dialog.filesAddButton.enabled = false;
         this.dialog.filesClearButton.enabled = false;
         this.dialog.filesInvertButton.enabled = false;
         this.dialog.filesRemoveButton.enabled = false;
         this.dialog.newInstanceButton.enabled = false;
         this.dialog.helpButton.enabled = false;
         this.dialog.okButton.enabled = false;

         // Disable all UI elements relating to engine object's properties.
         this.dialog.numericFormatComboBox.enabled = false;
         this.dialog.numericNotationCheckBox.enabled = false;
         this.dialog.normalizedCheckBox.enabled = false;
         this.dialog.precisionSpinBox.enabled = false;
         this.dialog.outputFormatComboBox.enabled = false;
         this.dialog.unclippedCheckBox.enabled = false;
         this.dialog.unclippedCheckBox.enabled = false;
         this.dialog.clippingLowControl.enabled = false;
         this.dialog.clippingHighControl.enabled = false;
         this.dialog.filePathCheckBox.enabled = false;
         this.dialog.fileNameCheckBox.enabled = false;
         this.dialog.fileFullCheckBox.enabled = false;
         this.dialog.imageNumberCheckBox.enabled = false;
         this.dialog.clippingLowCheckBox.enabled = false;
         this.dialog.clippingHighCheckBox.enabled = false;
         this.dialog.widthCheckBox.enabled = false;
         this.dialog.heightCheckBox.enabled = false;
         this.dialog.numberOfChannelsCheckBox.enabled = false;
         this.dialog.countPctCheckBox.enabled = false;
         this.dialog.countPxCheckBox.enabled = false;
         this.dialog.meanCheckBox.enabled = false;
         this.dialog.modulusCheckBox.enabled = false;
         this.dialog.normCheckBox.enabled = false;
         this.dialog.sumOfSquaresCheckBox.enabled = false;
         this.dialog.meanOfSquaresCheckBox.enabled = false;
         this.dialog.medianCheckBox.enabled = false;
         this.dialog.varianceCheckBox.enabled = false;
         this.dialog.stdDevCheckBox.enabled = false;
         this.dialog.avgDevCheckBox.enabled = false;
         this.dialog.madCheckBox.enabled = false;
         this.dialog.bwmvCheckBox.enabled = false;
         this.dialog.pbmvCheckBox.enabled = false;
         this.dialog.snCheckBox.enabled = false;
         this.dialog.qnCheckBox.enabled = false;
         this.dialog.minimumCheckBox.enabled = false;
         this.dialog.maximumCheckBox.enabled = false;
         this.dialog.minimumPosCheckBox.enabled = false;
         this.dialog.maximumPosCheckBox.enabled = false;
         this.dialog.noiseEvaluationCheckBox.enabled = false;
         this.dialog.selectAllButton.enabled = false;
         this.dialog.selectNoneButton.enabled = false;
      }
      else
      {
         this.dialog.cancelButton.text = "Exit";
         this.dialog.cancelButton.icon = this.scaledResource( ":/icons/cancel.png" );
         this.dialog.cancelButton.toolTip = "<p>Exit the Batch Statistics script.</p>";

         // Update UI elements relating to this object's properties.
         this.dialog.filesTreeBox.adjustColumnWidthToContents( 0 );
         this.dialog.consoleOutputCheckBox.enabled = true;
         this.dialog.consoleOutputCheckBox.checked = this.outputToConsole;
         this.dialog.fileOutputCheckBox.enabled = true;
         this.dialog.fileOutputCheckBox.checked = this.outputToFile;
         // Update other controls based on the state of this one.
         this.dialog.fileOutputCheckBox.onClick( this.outputToFile );
         // Enabling done by fileOutputCheckBox.onClick.
         this.dialog.overwriteExistingCheckBox.checked = this.overwriteExisting;
         // Update other controls based on the state of this one.
         // Enabling done by fileOutputCheckBox.onClick.
         this.dialog.overwriteExistingCheckBox.onClick( this.overwriteExisting );
         // Enabling done by fileOutputCheckBox.onClick and overwriteExistingCheckBox.onClick.
         this.dialog.appendExistingCheckBox.checked = this.appendExisting;
         this.dialog.includeHeaderCheckBox.enabled = true;
         this.dialog.includeHeaderCheckBox.checked = this.includeHeader;
         // Enabling done by fileOutputCheckBox.onClick, also done for outputFileButton.
         this.dialog.outputFileEdit.text = this.dialog.outputFile;
         this.dialog.filesAddButton.enabled = true;
         this.dialog.filesClearButton.enabled = true;
         this.dialog.filesInvertButton.enabled = true;
         this.dialog.filesRemoveButton.enabled = true;
         this.dialog.newInstanceButton.enabled = true;
         this.dialog.helpButton.enabled = true;
         this.dialog.okButton.enabled = true;

         // Update UI elements relating to engine object's properties.
         // onItemSelected updates its own control and other controls based on this control's state.
         this.dialog.numericFormatComboBox.enabled = true;
         this.dialog.numericFormatComboBox.onItemSelected( this.engine.numericFormat );
         // Enabling done by numericFormatComboBox.onItemSelected.
         this.dialog.numericNotationCheckBox.checked = this.engine.numericNotation;
         this.dialog.normalizedCheckBox.enabled = true;
         this.dialog.normalizedCheckBox.checked = this.engine.normalizeScale;
         this.dialog.precisionSpinBox.enabled = true;
         this.dialog.precisionSpinBox.value = this.engine.precision;
         this.dialog.outputFormatComboBox.enabled = true;
         // onItemSelected updates its own control based on its state.
         this.dialog.outputFormatComboBox.onItemSelected( this.engine.outputFormat );
         // onClick changes internal state of engine plus updates other controls based on this control's state.
         this.dialog.unclippedCheckBox.enabled = true;
         this.dialog.unclippedCheckBox.checked = this.engine.unclipped;
         this.dialog.unclippedCheckBox.onClick( this.engine.unclipped );
         // Enabling done by unclippedCheckBox.onClick.
         // setValue changes state of slider and numeric input.
         this.dialog.clippingLowControl.setValue( this.engine.clippingLow );
         // onValueupdated updates other controls based on this control's state.
         this.dialog.clippingLowControl.onValueUpdated( this.engine.clippingLow );
         // Enabling done by unclippedCheckBox.onClick.
         // setValue changes state of slider and numeric input.
         this.dialog.clippingHighControl.setValue( this.engine.clippingHigh );
         // onValueupdated updates other controls based on this control's state.
         this.dialog.clippingHighControl.onValueUpdated( this.engine.clippingHigh );
         this.dialog.filePathCheckBox.enabled = true;
         this.dialog.filePathCheckBox.checked = this.engine.showFilePath;
         this.dialog.fileNameCheckBox.enabled = true;
         this.dialog.fileNameCheckBox.checked = this.engine.showFileName;
         this.dialog.fileFullCheckBox.enabled = true;
         this.dialog.fileFullCheckBox.checked = this.engine.showFileFull;
         this.dialog.imageNumberCheckBox.enabled = true;
         this.dialog.imageNumberCheckBox.checked = this.engine.showImageNumber;
         this.dialog.clippingLowCheckBox.enabled = true;
         this.dialog.clippingLowCheckBox.checked = this.engine.showClippingLow;
         this.dialog.clippingHighCheckBox.enabled = true;
         this.dialog.clippingHighCheckBox.checked = this.engine.showClippingHigh;
         this.dialog.widthCheckBox.enabled = true;
         this.dialog.widthCheckBox.checked = this.engine.showWidth;
         this.dialog.heightCheckBox.enabled = true;
         this.dialog.heightCheckBox.checked = this.engine.showHeight;
         this.dialog.numberOfChannelsCheckBox.enabled = true;
         this.dialog.numberOfChannelsCheckBox.checked = this.engine.showNumberOfChannels;
         this.dialog.countPctCheckBox.enabled = true;
         this.dialog.countPctCheckBox.checked = this.engine.showCountPct;
         this.dialog.countPxCheckBox.enabled = true;
         this.dialog.countPxCheckBox.checked = this.engine.showCountPx;
         this.dialog.meanCheckBox.enabled = true;
         this.dialog.meanCheckBox.checked = this.engine.showMean;
         this.dialog.modulusCheckBox.enabled = true;
         this.dialog.modulusCheckBox.checked = this.engine.showModulus;
         this.dialog.normCheckBox.enabled = true;
         this.dialog.normCheckBox.checked = this.engine.showNorm;
         this.dialog.sumOfSquaresCheckBox.enabled = true;
         this.dialog.sumOfSquaresCheckBox.checked = this.engine.showSumOfSquares;
         this.dialog.meanOfSquaresCheckBox.enabled = true;
         this.dialog.meanOfSquaresCheckBox.checked = this.engine.showMeanOfSquares;
         this.dialog.medianCheckBox.enabled = true;
         this.dialog.medianCheckBox.checked = this.engine.showMedian;
         this.dialog.varianceCheckBox.enabled = true;
         this.dialog.varianceCheckBox.checked = this.engine.showVariance;
         this.dialog.stdDevCheckBox.enabled = true;
         this.dialog.stdDevCheckBox.checked = this.engine.showStdDev;
         this.dialog.avgDevCheckBox.enabled = true;
         this.dialog.avgDevCheckBox.checked = this.engine.showAvgDev;
         this.dialog.madCheckBox.enabled = true;
         this.dialog.madCheckBox.checked = this.engine.showMad;
         this.dialog.bwmvCheckBox.enabled = true;
         this.dialog.bwmvCheckBox.checked = this.engine.showBwmv;
         this.dialog.pbmvCheckBox.enabled = true;
         this.dialog.pbmvCheckBox.checked = this.engine.showPbmv;
         this.dialog.snCheckBox.enabled = true;
         this.dialog.snCheckBox.checked = this.engine.showSn;
         this.dialog.qnCheckBox.enabled = true;
         this.dialog.qnCheckBox.checked = this.engine.showQn;
         this.dialog.minimumCheckBox.enabled = true;
         this.dialog.minimumCheckBox.checked = this.engine.showMinimum;
         this.dialog.maximumCheckBox.enabled = true;
         this.dialog.maximumCheckBox.checked = this.engine.showMaximum;
         this.dialog.minimumPosCheckBox.enabled = true;
         this.dialog.minimumPosCheckBox.checked = this.engine.showMinimumPos;
         this.dialog.maximumPosCheckBox.enabled = true;
         this.dialog.maximumPosCheckBox.checked = this.engine.showMaximumPos;
         this.dialog.noiseEvaluationCheckBox.enabled = true;
         this.dialog.noiseEvaluationCheckBox.checked = this.engine.showNoiseEvaluation;
         this.dialog.selectAllButton.enabled = true;
         this.dialog.selectNoneButton.enabled = true;
      }

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} BatchStatisticsDialog.updateUI" );
      }
   }

   /// Method to read an image from a file in to this.inputImageWindow .
   ///
   /// @param {string} filePath path to image file.
   this.readImage = function( filePath )
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ BatchStatisticsDialog.readImage" );
      }
      // Check that filePath exists.
      if ( !File.exists( filePath ) )
      {
         this.inputImageWindow = null;
         console.warningln("WARNING: Image file not found: " + filePath );
      }
      else
      {
         // Open the image file.
         try
         {
            this.inputImageWindow = ImageWindow.open( filePath );
         }
         catch ( error )
         {
            this.inputImageWindow = null;
            console.warningln( "WARNING: Unable to open image file: " + filePath + " (" + error.message + ")." );
         }
      }
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} BatchStatisticsDialog.readImage" );
      }
      return ( !this.inputImageWindow.isNull );
  };

   /// Method to close current image window.
   ///
   this.closeImage = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ BatchStatisticsDialog.closeImage" );
      }
      try
      {
         if ( this.inputImageWindow != null )
         {
            this.inputImageWindow[0].close();
            this.inputImageWindow  = null;
         }
      }
      catch ( error )
      {
         (new MessageBox( error.message, TITLE, StdIcon_Error, StdButton_Yes, StdButton_No )).execute();
      }
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} BatchStatisticsDialog.closeImage" );
      }
   };

   /// Method to process all of the input images and output stats to console/file.
   ///
   this.processInputImages = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ BatchStatisticsDialog.processInputImages" );
      }

		console.show();
      // Handle aborting through dialog's own button.
		console.abortEnabled = false;
      processEvents();

      var textFile = null;
      var outString = "";
      var previousChannels = null;
      var filesProcessed = 0;
      var filesErrors = 0;
      var writeHeader = this.includeHeader;

      // Open output file if needed.
      if ( this.outputToFile &&  this.outputFile != "" && this.outputFile != null )
      {
         // Check that output directory still exists.
         if ( !File.directoryExists( File.extractDrive( this.outputFile ) + File.extractDirectory( this.outputFile ) ) )
         {
            // Unable to find directory.
            console.warningln( "WARNING: Unable to find directory: " + File.extractDrive( this.outputFile ) + File.extractDirectory( this.outputFile ) + " Outputting to console only." );
         }
         else
         {
            if ( !File.exists( this.outputFile ) )
            {
               // Writing to a new file so create it.
               try
               {
                  textFile = new File;
                  textFile.createForWriting( this.outputFile );
               }
               catch ( error )
               {
                  // Unable to create file.
                  console.warningln( "WARNING: Unable to create file: " + this.outputFile + " Outputting to console only. (" + error.message + ")." );
                  textFile = null;
               }
            }
            else if ( this.overwriteExisting )
            {
               // Overwriting file, so delete existing file.
               console.noteln( "Overwriting existing file: " + this.outputFile );
               try
               {
                  File.remove( this.outputFile );
                  textFile = new File;
                  try
                  {
                     textFile = new File;
                     textFile.createForWriting( this.outputFile );
                  }
                  catch ( error )
                  {
                     // Unable to create file.
                     console.warningln( "WARNING: Unable to create file: " + this.outputFile + " Outputting to console only. (" + error.message + ")." );
                     textFile = null;
                  }
               }
               catch ( error )
               {
                  console.warningln( "WARNING: Unable to overwriting existing file: " + this.outputFile + " Outputting to console only. (" + error.message + ")." );
               }
            }
            else if ( this.appendExisting )
            {
               // Appending to an existing file so don't add a new header.
               writeHeader = false;
               console.noteln( "Appending to existing file: " + this.outputFile );
               try
               {
                  textFile = new File;
                  textFile.openOrCreate( this.outputFile );
                  textFile.seekEnd();
               }
               catch ( error )
               {
                  // Unable to create file.
                  console.warningln( "WARNING: Unable to append to file: " + this.outputFile + " Outputting to console only. (" + error.message + ")." );
                  textFile = null;
               }
            }
            else
            {
               // Settings assume file doesn't exist, but it does so leave it alone.
               console.warningln( "WARNING: File already exists: " + this.outputFile + " Overwrite or Append not selected, outputting to console only." );
            }
         }
      }
      else if ( this.outputToFile )
      {
         // Output file is blank.
         console.warningln( "WARNING: No output file specified. Outputting to console only." );
      }

      // Process each of the input files.
      for ( var i = 0; i < this.inputFiles.length; ++i )
      {
         this.readImage( this.inputFiles[i] );
         filesProcessed++;

         // Update status bar.
         this.setStatus( "Analysing: " + filesProcessed + "/" + this.inputFiles.length + " Failed: " + filesErrors );

         if ( this.inputImageWindow != null )
         {
            // Process each image inputImageWindow[0..n] for multi-image file formats.
            for ( var j = 0; j < this.inputImageWindow.length; ++j )
            {
               // Keep the GUI responsive.
               processEvents();

               // Check for user wanting to abort script.
               if ( this.abortRequested )
               {
                  // First close any open files.
                  if ( textFile != null )
                  {
                     textFile.close();
                     textFile = null;
                  }
                  if ( this.inputImageWindow != null )
                  {
                     this.closeImage();
                  }

                  // Now abort script.
						this.abortRequested = false;
                  console.noteln( "Processing aborted by user." );
                  this.setStatus( "Processing aborted by user." );
                  processEvents();
                  if ( DEBUGGING_MODE_ON )
                  {
                     console.noteln( "} BatchStatisticsDialog.processInputImages" );
                  }
                  console.flush();
                  return;
               }

               // Set the target image; also calculate the currently enabled set of statistics.
               this.engine.setTargetImage( this.inputImageWindow[j].currentView.image, this.inputFiles[i], j );
               this.engine.calculateAllStats();

               // If there is a header, presumably user cares that columns in data rows should match it.
               // Thus check if number of channels is different to previous image and warn if necessary.
               // (This is far from foolproof if appending to an existing file, but the best we can do).
               if ( this.includeHeader )
               {
                  if ( previousChannels == null )
                  {
                     previousChannels = this.engine.numberOfChannels;
                  }
                  else if ( this.engine.numberOfChannels != previousChannels )
                  {
                     console.warningln( "WARNING: Previous image had " + previousChannels + " channel" + ( ( previousChannels == 1 ) ? "" : "s" ) + ". Image: " + this.inputFiles[i] + " (Part " + j + ")" + " has " + this.engine.numberOfChannels + " channel" + ( ( this.engine.numberOfChannels == 1 ) ? "" : "s" ) + ". Header row and data columns may not match as a consequence." );
                     previousChannels = this.engine.numberOfChannels;
                  }
               }

               // Write header to file and console once if required.
               if ( writeHeader ) {
                  outString = this.engine.getResultHeaderString();
                  if (this.outputToConsole) {
                     console.writeln( outString );
                  }
                  if ( textFile != null ) {
                     textFile.outText( outString + String.fromCharCode( 13, 10 ) );
                  }
                  writeHeader = false;
               }

               // Write statistics to file and console.
               outString = this.engine.getResultString();
               if (this.outputToConsole) {
                  console.writeln( outString );
               }
               if ( textFile != null ) {
                  textFile.outText( outString + String.fromCharCode( 13, 10 ) );
               }
            }  // Done with this image.

            this.closeImage(); // Done with this file.
         }
         else
         {
            filesErrors++;
         }
      }

      // Close statistics output file.
      if ( textFile != null )
      {
         textFile.close();
         textFile = null;
      }

      // Update status bar and console.
      this.setStatus( "Analysed: " + filesProcessed + "/" + this.inputFiles.length + " Failed: " + filesErrors );
      console.noteln( "Image files analysed: " + filesProcessed + ". Successful: " + (filesProcessed - filesErrors) + ". Failed: " + filesErrors + "." );
      processEvents();

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} BatchStatisticsDialog.processInputImages" );
      }
      console.flush();
   };

   // -------- # UI begin -------------------------------------------------------

   // Determine correct label and control sizes based on font used by dialog.
   this.labelWidth1 = this.font.width( "Number Format :" + 'T' );

   /// Method to process all of the input images and output stats to console/file.
   ///
   /// @param {object} sectionBar section bar being toggled.
   /// @param {boolean} beginToggle true if toggle is starting, false if ending.
   this.onToggleSection = function( sectionBar, beginToggle )
   {
      if ( beginToggle )
      {
         this.dialog.filesTreeBox.setFixedSize();
      }
      else
      {
         this.dialog.filesTreeBox.setVariableSize();
      }
    };

   // -------- # Help label begin -----------------------------------------------

   // Help label.
   this.helpLabel = this.UIFactory.defaultHelpLabel( this,
                                                     "<p><b>" + TITLE + " v" + VERSION + "</b> &mdash; A script to measure " +
                                                     "statistics on a batch of images and write them to a file.<br/>" +
                                                     "Copyright &copy; 2014 Ian Lauwerys (www.blackwaterskies.co.uk)</p>" );

   // -------- # Help label end -------------------------------------------------

   // -------- # Tree box begin -------------------------------------------------

   // Tree box to hold files for analysis.
   this.filesTreeBox = this.UIFactory.simpleTreeBox( this, this.inputFiles, 200, 200 );

   // Tree box Add button.
   this.filesAddButton = this.UIFactory.fullPushButton ( this, "Add Files...", ":/icons/add.png", "<p>Add images to the analysis list.</p>" );

   this.filesAddButton.onClick = function()
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}

      var fileDialog = new OpenFileDialog;
      fileDialog.multipleSelections = true;
      fileDialog.caption = TITLE + " : Select Images to Analyse";
      fileDialog.loadImageFilters();

      if ( fileDialog.execute() )
      {
         this.dialog.filesTreeBox.canUpdate = false;
         for ( var i = 0; i < fileDialog.fileNames.length; ++i )
         {
            // Add nodes to the tree box.
            var node = new TreeBoxNode( this.dialog.filesTreeBox );
            node.setText( 0, fileDialog.fileNames[i] );
            // Also update the inputFiles property of the GUI object.
            this.dialog.inputFiles.push( fileDialog.fileNames[i] );
         }
         this.dialog.filesTreeBox.canUpdate = true;
         this.dialog.filesTreeBox.adjustColumnWidthToContents( 0 );
      }
   };

   // Tree box clear button.
   this.filesClearButton = this.UIFactory.fullPushButton ( this, "Clear", ":/icons/list-delete.png", "<p>Clear the analysis list.</p>" );

   this.filesClearButton.onClick = function()
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}

      this.dialog.filesTreeBox.canUpdate = false;
      this.dialog.filesTreeBox.clear();
      this.dialog.filesTreeBox.canUpdate = true;
      this.dialog.filesTreeBox.adjustColumnWidthToContents( 0 );
      this.dialog.inputFiles.length = 0;
   };

   // Tree box Invert Selection button.
   this.filesInvertButton = this.UIFactory.fullPushButton ( this, "Invert Selection", ":/icons/select-invert", "<p>Invert the current selection of images.</p>" );

   this.filesInvertButton.onClick = function()
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.filesTreeBox.canUpdate = false;
      for ( var i = 0; i < this.dialog.filesTreeBox.numberOfChildren; ++i )
      {
         this.dialog.filesTreeBox.child(i).selected = !this.dialog.filesTreeBox.child(i).selected;
      }
      this.dialog.filesTreeBox.canUpdate = true;
      this.dialog.filesTreeBox.adjustColumnWidthToContents( 0 );

      this.dialog.isProcessing = false;
   };

   // Tree box Remove Selected button.
   this.filesRemoveButton = this.UIFactory.fullPushButton ( this, "Remove Selected", ":/icons/remove.png", "<p>Remove the selected images from the analysis list.</p>" );

   this.filesRemoveButton.onClick = function()
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.filesTreeBox.canUpdate = false;
      this.dialog.inputFiles.length = 0;
      for ( var i = 0; i < this.dialog.filesTreeBox.numberOfChildren; ++i )
      {
         if ( !this.dialog.filesTreeBox.child(i).selected )
         {
            this.dialog.inputFiles.push( this.dialog.filesTreeBox.child(i).text(0) );
         }
      }
      for ( var i = this.dialog.filesTreeBox.numberOfChildren; --i >= 0; )
      {
         if ( this.dialog.filesTreeBox.child( i ).selected )
         {
            this.dialog.filesTreeBox.remove( i );
         }
      }
      this.dialog.filesTreeBox.canUpdate = true;
      this.dialog.filesTreeBox.adjustColumnWidthToContents( 0 );
      
      this.dialog.isProcessing = false;
   };

   // Sizer for Tree box buttons.
   this.filesButtonsSizer = new HorizontalSizer;
   this.filesButtonsSizer.spacing = 4;
   this.filesButtonsSizer.add( this.filesAddButton );
   this.filesButtonsSizer.addStretch();
   this.filesButtonsSizer.add( this.filesClearButton );
   this.filesButtonsSizer.addStretch();
   this.filesButtonsSizer.add( this.filesInvertButton );
   this.filesButtonsSizer.add( this.filesRemoveButton );

   // Group Tree box and its buttons.
   this.filesGroupBox = this.UIFactory.groupBox( this, "Images to Analyse" );
   this.filesGroupBox.sizer = new VerticalSizer;
   this.filesGroupBox.sizer.margin = 6;
   this.filesGroupBox.sizer.spacing = 4;
   // Ensure that Tree box takes any extra space as dialog expands vertically.
   this.filesGroupBox.sizer.add( this.filesTreeBox );
   this.filesGroupBox.sizer.add( this.filesButtonsSizer );

   // -------- # Tree box end ---------------------------------------------------

   // -------- # Statistics options begin ---------------------------------------

   // Numeric Format Combo.
   this.numericFormatLabel = this.UIFactory.defaultLabel( this, "Number Format :", this.labelWidth1 );
   this.numericFormatComboBox = this.UIFactory.fullComboBox( this, [ "Normalized Real [0,1]", "8 Bit [0,255]", "10 Bit [0,1023]", "12 Bit [0,4095]", "14 Bit [0,16383]", "16 Bit [0,65535]" ], this.engine.numericFormat, "<p>Numeric format of statistics.</p>" );

   this.numericFormatComboBox.onItemSelected = function( item )
   {
 		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.setNumericFormat( item );
      // Update control in case item has been changed by setNumericFormat.
      this.dialog.numericFormatComboBox.currentItem = this.dialog.engine.numericFormat;
      this.dialog.numericNotationCheckBox.enabled = (this.dialog.engine.numericFormat == 0);

      this.dialog.isProcessing = false;
   };

   this.numericFormatSizer = new HorizontalSizer;
   this.numericFormatSizer.spacing = 4;
   this.numericFormatSizer.add(this.numericFormatLabel);
   this.numericFormatSizer.add(this.numericFormatComboBox );

   // Numeric notation Check Box.
   this.numericNotationCheckBox = this.UIFactory.fullCheckBox( this, "Scientific Notation", this.engine.numericNotation, "<p>Use scientific notation for Normalized Real format.</p>" );

   this.numericNotationCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}

      this.dialog.engine.numericNotation = checked;
   };

   // Precision Spin Box.
   this.precisionLabel = this.UIFactory.defaultLabel( this, "Precision :", this.font.width( "Precision :" + 'T' ) );
   this.precisionSpinBox = this.UIFactory.spinBox( this, this.engine.precision, 0, 17, "<p>Precision (in digits) of real numbers.</p>" );

   this.precisionSpinBox.onValueUpdated = function( value )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.precision = value;

      this.dialog.isProcessing = false;
};

   this.precisionSizer = new HorizontalSizer;
   this.precisionSizer.spacing = 4;
   this.precisionSizer.add(this.precisionLabel);
   this.precisionSizer.add(this.precisionSpinBox );

   // Normalized notation Check Box.
   this.normalizedCheckBox = this.UIFactory.fullCheckBox( this, "Normalize", this.engine.normalizeScale, "<p>When this option is enabled, all scale estimates are consistent with the standard deviation of a normal distribution.</p>" );

   this.normalizedCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.normalizeScale = checked;

      this.dialog.isProcessing = false;
   };

   // Unclipped Check Box.
   this.unclippedCheckBox = this.UIFactory.fullCheckBox( this, "Unclipped", this.engine.unclipped, "<p>By default, the BatchStatistics script computes statistics for the subset of pixel sample values within the ]0,1[ normalized range, this is, <i>excluding</i> pure black and white pixels. Enable this option to compute statistics for the [0,1] unclipped range.</p>" );

   this.unclippedCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }
      
      this.dialog.engine.unclipped = checked;
      this.dialog.clippingLowControl.enabled = !checked;
      this.dialog.clippingHighControl.enabled = !checked;

      this.dialog.isProcessing = false;
   };

   // Clipping Low control.
   this.clippingLowControl = this.UIFactory.fullNumericControl( this, this.engine.clippingLow, true, 6, 0, 1, 0, 1000000, 250, "Clipping Low :", this.labelWidth1, "<p>Set the lower limit for pixel samples in the normalized ]0..1[ range. Samples with values below this limit will be excluded.</p>" );

   this.clippingLowControl.onValueUpdated = function( value )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.clippingLow = value;
      if ( value > this.dialog.clippingHighControl.value )
      {
         this.dialog.clippingHighControl.setValue( value );
         this.dialog.engine.clippingHigh = value;
      }

      this.dialog.isProcessing = false;
   }

   // Clipping High control.
   this.clippingHighControl = this.UIFactory.fullNumericControl( this, this.engine.clippingHigh, true, 6, 0, 1, 0, 1000000, 250, "Clipping High :", this.labelWidth1, "<p>Set the upper limit for pixel samples on the normalized ]0..1[ range. Samples with values above this limit will be excluded.</p>" );

   this.clippingHighControl.onValueUpdated = function( value )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.clippingHigh = value;
      if ( value < this.dialog.clippingLowControl.value )
      {
         this.dialog.clippingLowControl.setValue( value );
         this.dialog.engine.clippingLow = value;
      }

      this.dialog.isProcessing = false;
   }

   // Group statistics options.
   this.statsNumberFormat = new HorizontalSizer;
   this.statsNumberFormat.spacing = 8;
   this.statsNumberFormat.add( this.numericFormatSizer );
   this.statsNumberFormat.add( this.precisionSizer );
   this.statsNumberFormat.add( this.numericNotationCheckBox );
   this.statsNumberFormat.add( this.normalizedCheckBox );
   this.statsNumberFormat.add( this.unclippedCheckBox );
   // Stop columns of buttons moving as dialog expands horizontally.
   this.statsNumberFormat.addStretch();

   this.statsOptionsGroupBox = this.UIFactory.groupBox( this );
   this.statsOptionsGroupBox.sizer = new VerticalSizer;
   this.statsOptionsGroupBox.sizer.margin = 8;
   this.statsOptionsGroupBox.sizer.spacing = 8;
   this.statsOptionsGroupBox.sizer.add( this.statsNumberFormat );
   this.statsOptionsGroupBox.sizer.add( this.clippingLowControl );
   this.statsOptionsGroupBox.sizer.add( this.clippingHighControl );

   // Section bar for statistics options.
   this.statsOptionsSectionBar = this.UIFactory.sectionBar( this, "Statistics Options" )
   this.statsOptionsSectionBar.setSection( this.statsOptionsGroupBox );
   this.statsOptionsSectionBar.onToggleSection = this.onToggleSection;

   // -------- # Statistics options end -----------------------------------------

   // -------- # Statistics begin -----------------------------------------------

   // Per image statistics controls.

   // File Path Check Box.
   this.filePathCheckBox = this.UIFactory.fullCheckBox( this, "File Path", this.engine.showFilePath, "<p>Output file path. (Per image).</p>" );

   this.filePathCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showFilePath = checked;

      this.dialog.isProcessing = false;
   };

   // File Name Check Box.
   this.fileNameCheckBox = this.UIFactory.fullCheckBox( this, "File Name", this.engine.showFileName, "<p>Output file name. (Per image).</p>" );

   this.fileNameCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showFileName = checked;

      this.dialog.isProcessing = false;
   };

   // File Full Check Box.
   this.fileFullCheckBox = this.UIFactory.fullCheckBox( this, "Full File Name", this.engine.showFileFull, "<p>Output full file name including path. (Per image).</p>" );

   this.fileFullCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showFileFull = checked;

      this.dialog.isProcessing = false;
   };

   // Image Number Check Box.
   this.imageNumberCheckBox = this.UIFactory.fullCheckBox( this, "Image Number", this.engine.showImageNumber, "<p>Output image number within file (for multi-image file formats). (Per image).</p>" );

   this.imageNumberCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showImageNumber = checked;

      this.dialog.isProcessing = false;
   };

   // Clipping Low Check Box.
   this.clippingLowCheckBox = this.UIFactory.fullCheckBox( this, "Clipping Low", this.engine.showClippingLow, "<p>Output low sample value clipping limit. (Per image).</p>");

   this.clippingLowCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showClippingLow = checked;

      this.dialog.isProcessing = false;
   };

   // Clipping High Check Box.
   this.clippingHighCheckBox = this.UIFactory.fullCheckBox( this, "Clipping High", this.engine.showClippingHigh, "<p>Output high sample value clipping limit. (Per image).</p>" );

   this.clippingHighCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showClippingHigh = checked;

      this.dialog.isProcessing = false;
   };

   // Show Width Check Box.
   this.widthCheckBox = this.UIFactory.fullCheckBox( this, "Image Width", this.engine.showWidth, "<p>Output image width in pixels. (Per image).</p>" );

   this.widthCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showWidth = checked;

      this.dialog.isProcessing = false;
   };

   // Show Height Check Box.
   this.heightCheckBox = this.UIFactory.fullCheckBox( this, "Image Height", this.engine.showHeight, "<p>Output image height in pixels. (Per image).</p>" );

   this.heightCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showHeight = checked;

      this.dialog.isProcessing = false;
   };

   // Show Number of Channels Check Box.
   this.numberOfChannelsCheckBox = this.UIFactory.fullCheckBox( this, "Number of Channels", this.engine.showNumberOfChannels, "<p>Output number of channels analysed in image (First Channel analysed, Last Channel analysed, Number of Channels analysed). (Per image).</p>" );

   this.numberOfChannelsCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showNumberOfChannels = checked;

      this.dialog.isProcessing = false;
   };

   // Per channel statistics.

   // Show countPct Check Box.
   this.countPctCheckBox = this.UIFactory.fullCheckBox( this, "Count Percent", this.engine.showCountPct, "<p>Pixel samples used for statistics as a percentage of total pixels in the image. (Per channel).</p>" );

   this.countPctCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showCountPct = checked;

      this.dialog.isProcessing = false;
   };

   // Show countPx Check Box.
   this.countPxCheckBox = this.UIFactory.fullCheckBox( this, "Count Pixels", this.engine.showCountPx, "<p>Count of pixel samples used for statistics. (Per channel).</p>" );

   this.countPxCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showCountPx = checked;

      this.dialog.isProcessing = false;
   };

   // Show Mean Check Box.
   this.meanCheckBox = this.UIFactory.fullCheckBox( this, "Mean", this.engine.showMean, "<p>The arithmetic mean, i.e. the average of sample values. (Per channel).</p>" );

   this.meanCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showMean = checked;

      this.dialog.isProcessing = false;
   };

   // Show Modulus Check Box.
   this.modulusCheckBox = this.UIFactory.fullCheckBox( this, "Modulus", this.engine.showModulus, "<p>The modulus, i.e. the sum of absolute sample values. (Per channel).</p>" );

   this.modulusCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showModulus = checked;

      this.dialog.isProcessing = false;
   };

   // Show Norm Check Box.
   this.normCheckBox = this.UIFactory.fullCheckBox( this, "Norm", this.engine.showNorm, "<p>The norm, i.e. the sum of sample values. (Only differs from Modulus if there are negative values). (Per channel).</p>" );

   this.normCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showNorm = checked;

      this.dialog.isProcessing = false;
   };

   // Show Sum of Squares Check Box.
   this.sumOfSquaresCheckBox = this.UIFactory.fullCheckBox( this, "Sum of Squares", this.engine.showSumOfSquares, "<p>The sum of the squares of sample values. (Per channel).</p>" );

   this.sumOfSquaresCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showSumOfSquares = checked;

      this.dialog.isProcessing = false;
   };

   // Show Mean of Squares Check Box.
   this.meanOfSquaresCheckBox = this.UIFactory.fullCheckBox( this, "Mean of Squares", this.engine.showMeanOfSquares, "<p>The mean of the squares of sample values. (Per channel).</p>" );

   this.meanOfSquaresCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showMeanOfSquares = checked;

      this.dialog.isProcessing = false;
   };

   // Show Median Check Box.
   this.medianCheckBox = this.UIFactory.fullCheckBox( this, "Median", this.engine.showMedian, "<p>The median of sample values. (Per channel).</p>" );

   this.medianCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showMedian = checked;

      this.dialog.isProcessing = false;
   };

   // Show Variance Check Box.
   this.varianceCheckBox = this.UIFactory.fullCheckBox( this, "Variance", this.engine.showVariance, "<p>The variance from the mean of sample values. (Per channel).</p>" );

   this.varianceCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showVariance = checked;

      this.dialog.isProcessing = false;
   };

   // Show StdDev Check Box.
   this.stdDevCheckBox = this.UIFactory.fullCheckBox( this, "Standard Deviation", this.engine.showStdDev, "<p>The standard deviation from the mean of sample values. (Per channel).</p>" );

   this.stdDevCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showStdDev = checked;

      this.dialog.isProcessing = false;
   };

   // Show AvgDev Check Box.
   this.avgDevCheckBox = this.UIFactory.fullCheckBox( this, "Average Absolute Deviation", this.engine.showAvgDev, "<p>The average absolute deviation from the median of sample values. (Per channel). (Center = median).</p>" );

   this.avgDevCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showAvgDev = checked;

      this.dialog.isProcessing = false;
   };

   // Show MAD Check Box.
   this.madCheckBox = this.UIFactory.fullCheckBox( this, "Median Absolute Deviation (MAD)", this.engine.showMad, "<p>The median absolute deviation from the median (MAD) of sample values. (Per channel). (Center = median).</p>" );

   this.madCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showMad = checked;

      this.dialog.isProcessing = false;
   };

   // Show Bwmv Check Box.
   this.bwmvCheckBox = this.UIFactory.fullCheckBox( this, "Biweight Midvariance (BWMV)", this.engine.showBwmv, "<p>The square root of the biweight midvariance of sample values. (Per channel). (Center = median, sigma = MAD, k = 9).</p>" );

   this.bwmvCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showBwmv = checked;

      this.dialog.isProcessing = false;
   };

   // Show Pbmv Check Box.
   this.pbmvCheckBox = this.UIFactory.fullCheckBox( this, "Percentage Bend Midvariance (PBMV)", this.engine.showPbmv, "<p>The square root of the percentage bend midvariance of sample values. (Per channel). (Center = median, beta = 0.2).</p>" );

   this.pbmvCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showPbmv = checked;

      this.dialog.isProcessing = false;
   };

   // Show Sn Check Box.
   this.snCheckBox = this.UIFactory.fullCheckBox( this, "Sn", this.engine.showSn, "<p>The Sn scale estimator of Rousseeuw and Croux of sample values. (Per channel).</p>" );

   this.snCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showSn = checked;

      this.dialog.isProcessing = false;
   };

   // Show Qn Check Box.
   this.qnCheckBox = this.UIFactory.fullCheckBox( this, "Qn", this.engine.showQn, "<p>The Qn scale estimator of Rousseeuw and Croux of sample values. (Per channel).</p>" );

   this.qnCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showQn = checked;

      this.dialog.isProcessing = false;
   };

   // Show Minimum Check Box.
   this.minimumCheckBox = this.UIFactory.fullCheckBox( this, "Minimum", this.engine.showMinimum, "<p>The minimum sample value. (Per channel).</p>" );

   this.minimumCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showMinimum = checked;

      this.dialog.isProcessing = false;
   };

   // Show Maximum Check Box.
   this.maximumCheckBox = this.UIFactory.fullCheckBox( this, "Maximum", this.engine.showMaximum, "<p>The maximum sample value. (Per channel).</p>" );

   this.maximumCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showMaximum = checked;

      this.dialog.isProcessing = false;
   };

   // Show MinimumPos Check Box.
   this.minimumPosCheckBox = this.UIFactory.fullCheckBox( this, "Minimum Position", this.engine.showMinimumPos, "<p>The image coordinates of the first ocurrence of the minimum sample value. (X,Y per channel).</p>" );

   this.minimumPosCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showMinimumPos = checked;

      this.dialog.isProcessing = false;
   };

   // Show MaximumPos Check Box.
   this.maximumPosCheckBox = this.UIFactory.fullCheckBox( this, "Maximum Position", this.engine.showMaximumPos, "<p>The image coordinates of the first ocurrence of the maximum sample value. (X,Y per channel).</p>" );

   this.maximumPosCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showMaximumPos = checked;

      this.dialog.isProcessing = false;
   };

   // Show Noise Evaluation Check Box.
   this.noiseEvaluationCheckBox = this.UIFactory.fullCheckBox( this, "Noise Evaluation", this.engine.showMaximumPos, "<p>The noise standard deviation. (MRS Sigma, Noise Pixel Count and Layers if convergent or empty otherwise. K-Sigma Sigma and Noise Pixel Count. See NoiseEvaluation script for details). (Per channel).</p>" );

   this.noiseEvaluationCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showNoiseEvaluation = checked;

      this.dialog.isProcessing = false;
   };

   // Select All button
   this.selectAllButton = this.UIFactory.fullPushButton ( this, "Select All", ":/icons/platform-windows.png", "<p>Select all statistics and metadata options. WARNING: May be very slow on large sets of images.</p>" );

   this.selectAllButton.onClick = function()
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showFilePath = true;
      this.dialog.engine.showFileName = true;
      this.dialog.engine.showFileFull = true;
      this.dialog.engine.showImageNumber = true;
      this.dialog.engine.showClippingLow = true;
      this.dialog.engine.showClippingHigh = true;
      this.dialog.engine.showWidth = true;
      this.dialog.engine.showHeight = true;
      this.dialog.engine.showNumberOfChannels = true;
      this.dialog.engine.showCountPct = true;
      this.dialog.engine.showCountPx = true;
      this.dialog.engine.showMean = true;
      this.dialog.engine.showModulus = true;
      this.dialog.engine.showNorm = true;
      this.dialog.engine.showSumOfSquares = true;
      this.dialog.engine.showMeanOfSquares = true;
      this.dialog.engine.showMedian = true;
      this.dialog.engine.showVariance = true;
      this.dialog.engine.showStdDev = true;
      this.dialog.engine.showAvgDev = true;
      this.dialog.engine.showMad = true;
      this.dialog.engine.showBwmv = true;
      this.dialog.engine.showPbmv = true;
      this.dialog.engine.showSn = true;
      this.dialog.engine.showQn = true;
      this.dialog.engine.showMinimum = true;
      this.dialog.engine.showMaximum = true;
      this.dialog.engine.showMinimumPos = true;
      this.dialog.engine.showMaximumPos = true;
      this.dialog.engine.showNoiseEvaluation = true;

      this.dialog.isProcessing = false;

      this.dialog.updateUI();
   };

   // Select None button
   this.selectNoneButton = this.UIFactory.fullPushButton ( this, "Select None", ":/icons/select-none.png", "<p>Clear all statistics and metadata options.</p>" );

   this.selectNoneButton.onClick = function()
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.showFilePath = false;
      this.dialog.engine.showFileName = false;
      this.dialog.engine.showFileFull = false;
      this.dialog.engine.showImageNumber = false;
      this.dialog.engine.showClippingLow = false;
      this.dialog.engine.showClippingHigh = false;
      this.dialog.engine.showWidth = false;
      this.dialog.engine.showHeight = false;
      this.dialog.engine.showNumberOfChannels = false;
      this.dialog.engine.showCountPct = false;
      this.dialog.engine.showCountPx = false;
      this.dialog.engine.showMean = false;
      this.dialog.engine.showModulus = false;
      this.dialog.engine.showNorm = false;
      this.dialog.engine.showSumOfSquares = false;
      this.dialog.engine.showMeanOfSquares = false;
      this.dialog.engine.showMedian = false;
      this.dialog.engine.showVariance = false;
      this.dialog.engine.showStdDev = false;
      this.dialog.engine.showAvgDev = false;
      this.dialog.engine.showMad = false;
      this.dialog.engine.showBwmv = false;
      this.dialog.engine.showPbmv = false;
      this.dialog.engine.showSn = false;
      this.dialog.engine.showQn = false;
      this.dialog.engine.showMinimum = false;
      this.dialog.engine.showMaximum = false;
      this.dialog.engine.showMinimumPos = false;
      this.dialog.engine.showMaximumPos = false;
      this.dialog.engine.showNoiseEvaluation = false;

      this.dialog.isProcessing = false;

      this.dialog.updateUI();
   };

   // Statistics set 1.
   this.statsSet1 = new VerticalSizer;
   this.statsSet1.margin = 6;
   this.statsSet1.spacing = 4;
   this.statsSet1.add( this.filePathCheckBox );
   this.statsSet1.add( this.fileNameCheckBox );
   this.statsSet1.add( this.fileFullCheckBox );
   this.statsSet1.add( this.imageNumberCheckBox );
   this.statsSet1.add( this.widthCheckBox );
   this.statsSet1.add( this.heightCheckBox );
   this.statsSet1.add( this.numberOfChannelsCheckBox );
   this.statsSet1.add( this.noiseEvaluationCheckBox );

   // Statistics set 2.
   this.statsSet2 = new VerticalSizer;
   this.statsSet2.margin = 6;
   this.statsSet2.spacing = 4;
   this.statsSet2.add( this.clippingLowCheckBox );
   this.statsSet2.add( this.clippingHighCheckBox );
   this.statsSet2.add( this.countPctCheckBox );
   this.statsSet2.add( this.countPxCheckBox );
   this.statsSet2.add( this.meanCheckBox );
   this.statsSet2.add( this.medianCheckBox );
   this.statsSet2.add( this.modulusCheckBox );
   this.statsSet2.add( this.normCheckBox );

   // Statistics set 3.
   this.statsSet3 = new VerticalSizer;
   this.statsSet3.margin = 6;
   this.statsSet3.spacing = 4;
   this.statsSet3.add( this.sumOfSquaresCheckBox );
   this.statsSet3.add( this.meanOfSquaresCheckBox );
   this.statsSet3.add( this.varianceCheckBox );
   this.statsSet3.add( this.stdDevCheckBox );
   this.statsSet3.add( this.avgDevCheckBox );
   this.statsSet3.add( this.madCheckBox );
   this.statsSet3.add( this.bwmvCheckBox );
   this.statsSet3.add( this.pbmvCheckBox );

   // Statistics set 4.
   this.statsSet4 = new VerticalSizer;
   this.statsSet4.margin = 6;
   this.statsSet4.spacing = 4;
   this.statsSet4.add( this.snCheckBox );
   this.statsSet4.add( this.qnCheckBox );
   this.statsSet4.add( this.minimumCheckBox );
   this.statsSet4.add( this.maximumCheckBox );
   this.statsSet4.add( this.minimumPosCheckBox );
   this.statsSet4.add( this.maximumPosCheckBox );
   this.statsSet4.add( this.selectAllButton );
   this.statsSet4.add( this.selectNoneButton );
   this.statsSet4.addStretch();

   // Group statistics.
   this.statsGroupBox = this.UIFactory.groupBox( this );
   this.statsGroupBox.sizer = new HorizontalSizer;
   this.statsGroupBox.sizer.margin = 6;
   this.statsGroupBox.sizer.spacing = 4;
   this.statsGroupBox.sizer.add( this.statsSet1 );
   this.statsGroupBox.sizer.add( this.statsSet2 );
   this.statsGroupBox.sizer.add( this.statsSet3 );
   this.statsGroupBox.sizer.add( this.statsSet4 );
   // Stop columns of buttons moving as dialog expands horizontally.
   this.statsGroupBox.sizer.addStretch();

   // Section bar for statistics.
   this.statsSectionBar = this.UIFactory.sectionBar( this, "Metadata and Statistics to Output" )
   this.statsSectionBar.setSection( this.statsGroupBox );
   this.statsSectionBar.onToggleSection = this.onToggleSection;

   // -------- # Statistics end -------------------------------------------------

   // -------- # Output options begin -------------------------------------------

   // Output Format Combo.
   this.outputFormatLabel = this.UIFactory.defaultLabel( this, "File Format :", this.labelWidth1 );
   this.outputFormatComboBox = this.UIFactory.fullComboBox( this, [ "TAB", "PIPE", "COLON", "SPACE", "COMMA", "CSV" ], this.engine.outputFormat, "<p>Output format of statistics: Columns delimited with Tab, Pipe, Colon, Space or Comma (aka CSV) characters.</p>" );

   this.outputFormatComboBox.onItemSelected = function( item )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.setOutputFormat( item );
      // Update ontrol in case value has been changed by setOutputFormat.
      this.currentItem = this.dialog.engine.outputFormat;

      this.dialog.isProcessing = false;
   };

   this.outputFormatSizer = new HorizontalSizer;
   this.outputFormatSizer.spacing = 4;
   this.outputFormatSizer.add( this.outputFormatLabel );
   this.outputFormatSizer.add( this.outputFormatComboBox );

   // Console Output Check Box.
   this.consoleOutputCheckBox = this.UIFactory.fullCheckBox( this, "To Console", this.outputToConsole, "<p>Output results to console.</p>" );

   this.consoleOutputCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.outputToConsole = checked;

      this.dialog.isProcessing = false;
   };

   // File Output Check Box.
   this.fileOutputCheckBox = this.UIFactory.fullCheckBox( this, "To File", this.outputToFile, "<p>Output results to file.</p>" );

   this.fileOutputCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.outputToFile = checked;
      this.dialog.outputFileEdit.enabled = checked;
      this.dialog.outputFileButton.enabled = checked;
      this.dialog.overwriteExistingCheckBox.enabled = checked;
      this.dialog.appendExistingCheckBox.enabled = checked;

      this.dialog.isProcessing = false;
   };

   // Overwrite Existing Check Box.
   this.overwriteExistingCheckBox = this.UIFactory.fullCheckBox( this, "Overwrite", this.overwriteExisting, "<p>Overwrite existing file.</p>" );

   this.overwriteExistingCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.overwriteExisting = checked;
      this.dialog.appendExistingCheckBox.enabled = !checked;

      this.dialog.isProcessing = false;
   };

   // Append Existing Check Box.
   this.appendExistingCheckBox = this.UIFactory.fullCheckBox( this, "Append", this.appendExisting, "<p>Append output to existing file.</p>" );

   this.appendExistingCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.appendExisting = checked;

      this.dialog.isProcessing = false;
   };

   // Include Header Check Box.
   this.includeHeaderCheckBox = this.UIFactory.fullCheckBox( this, "Include Header", this.includeHeader, "<p>Include header row containing column labels.</p>" );

   this.includeHeaderCheckBox.onClick = function( checked )
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.includeHeader = checked;

      this.dialog.isProcessing = false;
   };

   this.outputOptionsSizer = new HorizontalSizer;
   this.outputOptionsSizer.spacing = 8;
   this.outputOptionsSizer.add( this.outputFormatSizer );
   this.outputOptionsSizer.add( this.consoleOutputCheckBox );
   this.outputOptionsSizer.add( this.fileOutputCheckBox );
   this.outputOptionsSizer.add( this.overwriteExistingCheckBox );
   this.outputOptionsSizer.add( this.appendExistingCheckBox );
   this.outputOptionsSizer.add( this.includeHeaderCheckBox );
   // Stop columns of buttons moving as dialog expands horizontally.
   this.outputOptionsSizer.addStretch();

   // Output File Name input box (read only).
   this.outputFileLabel = this.UIFactory.defaultLabel( this, "Output File :", this.labelWidth1 );
   this.outputFileEdit = this.UIFactory.editBox ( this, this.outputFile, true, "<p>Output file name and location.</p>" );

   this.outputFileEditSizer = new HorizontalSizer;
   this.outputFileEditSizer.spacing = 4;
   this.outputFileEditSizer.add( this.outputFileLabel );
   this.outputFileEditSizer.add( this.outputFileEdit );

   // Output File Name button.
   this.outputFileButton = this.UIFactory.fullPushButton ( this, "Output File...", ":/icons/document-save.png", "<p>Choose output file name and location.</p>" );

   this.outputFileButton.onClick = function()
   {
 		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

     // Show a dialog to select a directory and set a file name for output.
      var outputFileDialog = new SaveFileDialog();
      outputFileDialog.overwritePrompt = false;
      outputFileDialog.caption = TITLE + " : Set Output File";
      outputFileDialog.filters = [ [ "Text Files", "*.prn, *.txt, *.csv" ], [ "All Files", "*.*" ] ];
      if ( this.dialog.outputFile != "" && File.exists( this.dialog.outputFile ) )
      {
         if ( DEBUGGING_MODE_ON )
         {
            console.noteln( "File exists, using as starting location." );
         }
         // Current file exists so use it as starting location.
         outputFileDialog.initialPath = this.dialog.outputFile;
      }
      else if ( this.dialog.outputFile != "" && File.directoryExists( File.extractDrive( this.dialog.outputFile ) + File.extractDirectory( this.dialog.outputFile ) ) )
      {
         // Directory exists so use it as starting location.
         if (File.extractName( this.dialog.outputFile ) != "" ) {
            if ( DEBUGGING_MODE_ON )
            {
               console.noteln( "Directory exists, file doesn't but file name is not blank so using it." );
            }
            // File doesn't exist but it isn't blank so keep it.
            outputFileDialog.initialPath = this.dialog.outputFile;
         }
         else
         {
            if ( DEBUGGING_MODE_ON )
            {
               console.noteln( "Directory exists, file file name is blank so using default." );
            }
            // File is blank so use default filename.
            outputFileDialog.initialPath = File.extractDrive( this.dialog.outputFile ) + File.extractDirectory( this.dialog.outputFile ) + "/batchstatistics.txt";
         }
      }
      else
      {
         if ( DEBUGGING_MODE_ON )
         {
            console.noteln( "Directory doesn't exist, using default directory and file name." );
         }
         // Directory doesn't exist so use default location and filename.
         outputFileDialog.initialPath = File.systemTempDirectory + "/batchstatistics.txt";
      }

      // Get user to select directory and file.
      if ( outputFileDialog.execute() )
      {
         if ( DEBUGGING_MODE_ON )
         {
            console.noteln( "User selected a file." );
         }
         this.dialog.outputFile = outputFileDialog.fileName;
      }
      this.dialog.outputFileEdit.text = this.dialog.outputFile;

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "File name chosen is: " + this.dialog.outputFile );
      }

      this.dialog.isProcessing = false;
   };

   this.outputFileSizer = new HorizontalSizer;
   this.outputFileSizer.spacing = 8;
   this.outputFileSizer.add( this.outputFileEditSizer );
   this.outputFileSizer.add( this.outputFileButton );

   // Group output options.
   this.outputOptionsGroupBox = this.UIFactory.groupBox( this );
   this.outputOptionsGroupBox.sizer = new VerticalSizer;
   this.outputOptionsGroupBox.sizer.margin = 8;
   this.outputOptionsGroupBox.sizer.spacing = 8;
   this.outputOptionsGroupBox.sizer.add( this.outputOptionsSizer );
   this.outputOptionsGroupBox.sizer.add( this.outputFileSizer );

   // Section bar for output options.
   this.outputOptionsSectionBar = this.UIFactory.sectionBar( this, "Output Options" )
   this.outputOptionsSectionBar.setSection( this.outputOptionsGroupBox );
   this.outputOptionsSectionBar.onToggleSection = this.onToggleSection;

   // -------- # Output options end ---------------------------------------------

   // -------- # Buttons begin --------------------------------------------------

   // New Instance button.
   this.newInstanceButton = this.UIFactory.fullToolButton( this, ":/images/interface/dragObject.png", "New Instance" );

   this.newInstanceButton.onMousePress = function()
   {
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      this.hasFocus = true;
      this.pushed = false;
      this.dialog.engine.exportParameters();
      this.dialog.exportParameters();
      this.dialog.newInstance();

      this.dialog.isProcessing = false;
   };

   // Help button.
	var helpText =
			"<p><strong>Click to view documentation</strong><br /><br />" +

         "Summary of instructions:<br /><br />" +


         "<strong>Images to Analyse</strong><br /><br />" +

			"Click the <strong>&quot;Add&quot;</strong> button to choose image " +
			"files to analyse. Any image file format supported by PixInsight " +
			"should be suitable. <strong>Important:</strong> When working with " +
			"multi-channel images, it is best to try to work with sets of images " +
			"that have the same number of channels and in the same order so that " +
			"file headers and data match.<br /><br />" +

			"<strong>Statistics Options</strong><br /><br />" +

			"The number formatting options function in the same manner as the " +
			"existing Statistics process, with the addition of a <strong>&quot;" +
			"Precision&quot;</strong> option to set the number of digits in " +
			"floating point numbers. Also, if the <strong>&quot;Unclipped&quot;" +
			"</strong> box is not checked, you can change the <strong>&quot;" +
			"Clipping Low&quot;</strong> and <strong>&quot;Clipping High&quot;" +
			"</strong> controls so that pixels with values outside the chosen " +
			"clipping range are be ignored in statistics calculations.<br />" +
			"<br />" +

			"<strong>Metadata and Statistics to Output</strong><br /><br />" +

			"Select the appropriate check boxes to choose which statistics to " +
			"output. Except for <strong>&quot;Noise Evaluation&quot;</strong>, " +
			"all options function in the same manner as the Statistics process. " +
			"<strong>Important:</strong> Selecting all statistics may lead to " +
			"long pauses between images whilst they are evaluated.<br /><br />" +

			"<strong>Output Options</strong><br /><br />" +

			"The <strong>&quot;File Format&quot;</strong> combo box allows you " +
			"to select various delimited output formats from Tab, Pipe, Colon, " +
			"Space, Comma or CSV. Check the <strong>&quot;To Console&quot;" +
			"</strong> checkbox to output results to the PixInsight Console and " +
			"the <strong>&quot;To File&quot;</strong> checkbox to output then to " +
			"a test file, specified using the <strong&quot;Output File&quot;" +
			"</strong> button." +

			"The <strong>&quot;Analyse&quot;</strong> button analyses all images " +
			"in the file list.</p>";

	this.helpButton = this.UIFactory.fullToolButton( this, ":/process-interface/browse-documentation.png", helpText )

   this.helpButton.onClick = function()
	{
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
      }

      if ( !Dialog.browseScriptDocumentation( "BatchStatistics" ) )
      {
         ( new MessageBox( "<p>Documentation has not been installed.</p>", TITLE + "." + VERSION, StdIcon_Error, StdButton_Ok ) ).execute();
      }

      this.dialog.isProcessing = false;
   };

   // OK button.
   this.okButton = this.UIFactory.specialPushButton( this, "Analyse", ":/icons/power.png", "<p>Analyse images in the list.</p>" );
   this.okButton.enabled = true;

   this.okButton.onClick = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "Running analysis." );
      }
		if ( this.dialog.isProcessing )
		{
			return;
		}
      else
      {
         this.dialog.isProcessing = true;
         this.dialog.updateUI();
      }

      this.dialog.processInputImages();

      this.dialog.isProcessing = false;
      this.dialog.updateUI();

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "Analysis complete." );
      }
   };

   // Cancel button.
   this.cancelButton = this.UIFactory.specialPushButton( this, "Exit", ":/icons/cancel.png", "<p>Exit the Batch Statistics script.</p>" );

   this.cancelButton.onClick = function()
   {
		if ( this.dialog.isProcessing )
		{
         if ( DEBUGGING_MODE_ON )
         {
            console.noteln( "Abort requested." );
         }
         this.dialog.abortRequested = true;
         return;
		}
      else
      {
         if ( DEBUGGING_MODE_ON )
         {
            console.noteln( "Exiting dialog." );
         }
         this.dialog.cancel();
      }
   };

   // Text label used for progress reporting.
   this.statusLabel = this.UIFactory.fullLabel( this, "", FrameStyle_Flat, 4, null, null, TextAlign_Left | TextAlign_VertCenter, null, "<p>Progress reporting</p>" );

   // Method to update text of info label.
   this.setStatus = function( text )
   {
      this.statusLabel.text = "Status: " + text;
   };

   // Blank status for now.
   this.setStatus( "" );

   // Sizer for buttons.
   this.buttonsSizer = new HorizontalSizer;
   this.buttonsSizer.spacing = 4;
   this.buttonsSizer.add( this.newInstanceButton );
   this.buttonsSizer.add( this.helpButton );
	this.buttonsSizer.add( this.statusLabel );
	this.buttonsSizer.addStretch();
   this.buttonsSizer.add( this.okButton );
   this.buttonsSizer.add( this.cancelButton );

   // -------- # Buttons end ----------------------------------------------------

   // -------- # Dialog begin ---------------------------------------------------

   // Method to deal with closing of dialog (e.g. via dialog close button).
   this.onClose = function()
   {
      if ( this.dialog.isProcessing )
      {
         if ( DEBUGGING_MODE_ON )
         {
            console.noteln( "Abort requested." );
         }
         this.dialog.abortRequested = true;
         return;
      }
      else
      {
         if ( DEBUGGING_MODE_ON )
         {
            console.noteln( "Exiting dialog." );
         }
      }
   };

   // Lay out dialog.
   this.sizer = new VerticalSizer;
   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add( this.helpLabel );
   this.sizer.addSpacing( 4 );
   // Ensure that Tree box takes any extra space as dialog expands vertically.
   this.sizer.add( this.filesGroupBox );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.statsOptionsSectionBar );
   this.sizer.add( this.statsOptionsGroupBox );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.statsSectionBar );
   this.sizer.add( this.statsGroupBox );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.outputOptionsSectionBar );
   this.sizer.add( this.outputOptionsGroupBox );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.buttonsSizer );

   // Dialog options.
   this.windowTitle = TITLE + " Script v" + VERSION;
   this.userResizable = true;
   this.adjustToContents();
   this.helpLabel.setFixedHeight();
   this.statsOptionsGroupBox.setFixedHeight();
   this.statsGroupBox.setFixedHeight();
   this.outputOptionsGroupBox.setFixedHeight();

   // -------- # Dialog end -----------------------------------------------------
   if ( DEBUGGING_MODE_ON )
   {
      console.noteln( "} BatchStatisticsDialog" );
   }

} // class BatchStatisticsDialog

// Inherit all properties and methods from the core Dialog object.
BatchStatisticsDialog.prototype = new Dialog;

// ----------------------------------------------------------------------------
// EOF BatchStatistics-GUI.js - Released 2015/11/30 00:00:00 UTC
