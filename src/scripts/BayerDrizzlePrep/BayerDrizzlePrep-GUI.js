// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// BayerDrizzlePrep-GUI.js - Released 2015/11/06 00:00:00 UTC
// ----------------------------------------------------------------------------
//
// This file is part of BayerDrizzlePrep Script version 1.0
//
// Copyright (C) 2015 Ian Lauwerys. (www.blackwaterskies.co.uk)
//
// Based on BatchFormatConversion.js, FITSFileManager-helpers.jsh and other work.
// Copyright (c) 2009-2014 Pleiades Astrophoto S.L.
// Copyright (c) 2012-2013 Jean-Marc Lugrin
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
   1.0:  First release.
*/

// ========= # defines / includes ==============================================

#ifndef BayerDrizzlePrep_GUI_js
#define BayerDrizzlePrep_GUI_js
#endif

// Define as true for debug messages to console.
#ifndef DEBUGGING_MODE_ON
#define DEBUGGING_MODE_ON false
#endif

// Includes.
#ifndef GUIFactory_lib_js
#include "GUIFactory-lib.js" // Factory for UI widgets.
#endif

#include <pjsr/DataType.jsh>

// ======== # UI classes =======================================================

/// @class Modal dialog for user interaction with BayerDrizzlePrep script.
///
/// @param {object} engine The object for conducting the actual processing work.
function ConversionDialog( engine )
{
   if ( DEBUGGING_MODE_ON )
   {
      console.noteln( "{ ConversionDialog" );
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

   // Drizzle files to be converted.
   this.inputDRZFiles = new Array;
   // Files to be converted.
   this.inputImageFiles = new Array;

   // Output directory for converted files.
   this.outputDirectory = File.systemTempDirectory + "/bayerdrizzle";

   // Current input and output image windows.
   this.inputImageWindow = null;
   this.outputImageWindow = null;

   /// Method to retrieve parameters from previous instantiation.
   ///
   this.importParameters = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ ConversionDialog.importParameters" );
      }

      if ( Parameters.has( "inputImageFiles" ) )
      {
         // Add the comma separated list of file names as elements in the inputImageFiles array.
         // Also add them to the Tree box in the UI dialog.
         var inputImageFilesList = Parameters.getString( "inputImageFiles" ).split( "," );
         this.dialog.filesTreeBox.canUpdate = false;
         for ( var i in inputImageFilesList )
         {
            var node = new TreeBoxNode( this.dialog.filesTreeBox );
            node.setText( 0, inputImageFilesList[i] );
            this.inputImageFiles.push( inputImageFilesList[i] );
         }
      }
      if ( Parameters.has( "inputDRZFiles" ) )
      {
         // Add the comma separated list of file names as elements in the inputDRZFiles array.
         // Also add them to the Tree box in the UI dialog.
         var inputDRZFilesList = Parameters.getString( "inputDRZFiles" ).split( "," );
         this.dialog.drzTreeBox.canUpdate = false;
         for ( var i in inputDRZFilesList )
         {
            var node = new TreeBoxNode( this.dialog.drzTreeBox );
            node.setText( 0, inputImageDRZList[i] );
            this.inputDRZFiles.push( inputDRZFilesList[i] );
         }
         this.dialog.drzTreeBox.canUpdate = true;
      }
      this.outputDirectory = ( Parameters.has( "outputDirectory" ) ) ? Parameters.getString( "outputDirectory" ) : this.outputDirectory;
      this.dialog.outputDirectoryEdit.text = this.outputDirectory;

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} ConversionDialog.importParameters" );
      }
   }

   /// Method to store current parameters for use in subsequent instantiations.
   ///
   this.exportParameters = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ ConversionDialog.exportParameters" );
      }

      if ( this.inputImageFiles.length > 0 )
      {
         // If inputImageFiles is empty, then Parameters.set will create a parameter with a single space.
         // This would then cause .importParameters to create an empty file name as the first
         // input file leading to issues, so we have a check to not do it!
         Parameters.set( "inputImageFiles", this.inputImageFiles );
      }
      if ( this.inputDRZFiles.length > 0 )
      {
         // If inputDRZFiles is empty, then Parameters.set will create a parameter with a single space.
         // This would then cause .importParameters to create an empty file name as the first
         // input file leading to issues, so we have a check to not do it!
         Parameters.set( "inputDRZFiles", this.inputDRZFiles );
      }
      Parameters.set( "outputDirectory", this.outputDirectory );

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} ConversionDialog.exportParameters" );
      }
   };

   /// Method to update the OK button depending on whether the input lists have an equal number of entries.
   ///
   this.updateOKButton = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ ConversionDialog.updateOKButton" );
      }

      // Note: No check for isProcessing as this method is called from event handlers.

      // Enable or disable the OK button.
      this.dialog.okButton.enabled = this.inputImageFiles.length == this.inputDRZFiles.length;

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} ConversionDialog.updateOKButton" );
      }
   }
   
   /// Method to update all UI elements to reflect current dialog and engine object's settings.
   ///
   this.updateUI = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ ConversionDialog.updateUI" );
      }

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( " ConversionDialog.updateUI this.isProcessing: " + this.isProcessing );
      }
      
      // Check for correct use of this.dialog vs this.
      if ( this.isProcessing )
      {
         this.dialog.cancelButton.text = "Abort";
         this.dialog.cancelButton.icon = this.scaledResource( ":/icons/stop.png" );
         this.dialog.cancelButton.toolTip = "<p>Abort image conversion.</p>";

         // Disable all UI elements relating to this object's properties.
         this.dialog.filesTreeBox.adjustColumnWidthToContents( 0 );
         this.dialog.drzTreeBox.adjustColumnWidthToContents( 0 );
         this.dialog.bayerPatternComboBox.enabled = false;
         this.dialog.outputDirectoryButton.enabled = false;
         this.dialog.filesAddButton.enabled = false;
         this.dialog.filesClearButton.enabled = false;
         this.dialog.filesMoveUpButton.enabled = false;
         this.dialog.filesMoveDownButton.enabled = false;
         this.dialog.filesInvertButton.enabled = false;
         this.dialog.filesRemoveButton.enabled = false;
         this.dialog.drzAddButton.enabled = false;
         this.dialog.drzClearButton.enabled = false;
         this.dialog.drzMoveUpButton.enabled = false;
         this.dialog.drzMoveDownButton.enabled = false;
         this.dialog.drzInvertButton.enabled = false;
         this.dialog.drzRemoveButton.enabled = false;
         this.dialog.newInstanceButton.enabled = false;
         this.dialog.helpButton.enabled = false;
         this.dialog.okButton.enabled = false;
      }
      else
      {
         this.dialog.cancelButton.text = "Exit";
         this.dialog.cancelButton.icon = this.scaledResource( ":/icons/cancel.png" );
         this.dialog.cancelButton.toolTip = "<p>Exit the BayerDrizzlePrep script.</p>";

         // Update UI elements relating to this object's properties.
         this.dialog.filesTreeBox.adjustColumnWidthToContents( 0 );
         this.dialog.drzTreeBox.adjustColumnWidthToContents( 0 );
         this.dialog.bayerPatternComboBox.enabled = true;
         this.dialog.bayerPatternComboBox.currentItem = this.engine.bayerPattern;
         this.dialog.outputDirectoryButton.enabled = true;
         this.dialog.outputDirectoryEdit.text = this.outputDirectory;
         this.dialog.filesAddButton.enabled = true;
         this.dialog.filesClearButton.enabled = true;
         this.dialog.filesMoveUpButton.enabled = true;
         this.dialog.filesMoveDownButton.enabled = true;
         this.dialog.filesInvertButton.enabled = true;
         this.dialog.filesRemoveButton.enabled = true;
         this.dialog.drzAddButton.enabled = true;
         this.dialog.drzClearButton.enabled = true;
         this.dialog.drzMoveUpButton.enabled = true;
         this.dialog.drzMoveDownButton.enabled = true;
         this.dialog.drzInvertButton.enabled = true;
         this.dialog.drzRemoveButton.enabled = true;
         this.dialog.newInstanceButton.enabled = true;
         this.dialog.helpButton.enabled = true;
         // Enable or disable the OK button depending on whether lists have equal numbers of entries.
         this.updateOKButton();
      }
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} ConversionDialog.updateUI" );
      }
   }

   /// Method to read an image from a file in to this.inputImageWindow.
   /// Returns {boolean} true if image successfully read, false if not.
   ///
   /// @param {string} fullFilePath path to image file.
   this.readInputImage = function( fullFilePath )
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ ConversionDialog.readInputImage" );
      }

      // Check that file exists.
      if ( !File.exists( fullFilePath ) )
      {
         this.inputImageWindow = null;
         console.warningln( "WARNING: Image file not found: " + fullFilePath );
      }
      else
      {
         // Open the image file.
         try
         {
            this.inputImageWindow = ImageWindow.open( fullFilePath );
         }
         catch ( error )
         {
            this.inputImageWindow = null;
            console.warningln( "WARNING: Unable to open image file: " + fullFilePath + " (" + error.message + ")." );
         }
      }

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} ConversionDialog.readInputImage" );
      }
      
      return ( !this.inputImageWindow.isNull );
   };

   /// Method to save an image window to a file.
   /// Returns {boolean} true if image successfully saved, false if not.
   ///
   /// @param {string} fullFilePath path to image file to be written.
   /// @param {object} sourceImage image window to be written.
   /// @param {boolean} overwriteExisting overwrite existing file if true.
   this.saveImage = function( fullFilePath, sourceImage, overwriteExisting )
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ ConversionDialog.saveImage" );
      }

      var success = false;

      if ( File.exists( fullFilePath ) )
      {
         if ( overwriteExisting )
         {
            try
            {
               sourceImage.saveAs( fullFilePath, false, false, false, false );
               success = true;
            }
            catch ( error )
            {
               console.warningln( "WARNING: Unable to save image: " + fullFilePath + " (" + error.message + ")." );
            }
         }
         else
         {
            console.Warningln( "WARNING: File already exists, not overwriting: " + fullFilePath );
         }
      }
      else
      {
         console.writeln( "Saving file: " + fullFilePath );
         try
         {
            sourceImage.saveAs( fullFilePath, false, false, false, false );
            success = true;
         }
         catch ( error )
         {
            console.warningln( "WARNING: Unable to save image: " + fullFilePath + " (" + error.message + ")." );
         }
      }

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} ConversionDialog.saveImage" );
      }
      
      return ( success );
   };

   /// Method to close current input image window.
   ///
   this.closeInputImage = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ ConversionDialog.closeInputImage" );
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
         console.warningln( "WARNING: Unable to close input image window: " + error.message );
      }

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} ConversionDialog.closeInputImage" );
      }
   };

   /// Method to close current output image window.
   ///
   this.closeOutputImage = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ ConversionDialog.closeOutputImage" );
      }

      try
      {
         if ( this.outputImageWindow != null )
         {
            this.outputImageWindow.close();
            this.outputImageWindow  = null;
         }
      }
      catch ( error )
      {
         console.warningln( "WARNING: Unable to close output image window: " + error.message );
      }

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} ConversionDialog.closeOutputImage" );
      }
   };

   /// Method to generate an updated .DRZ file with the path to the RGB bayer image.
   /// Returns {boolean} true if .DRZ successfully updated, false if not.
   ///
   /// @param {string} inputDRZPath path to source DRZ file to be read.
   /// @param {string} outputDRZPath path to destination DRZ file to be (over)written.
   /// @param {string} bayerRGBPath path to replacement image (Bayer RGB).
   this.updateDrizzleFile = function( inputDRZPath, outputDRZPath, bayerRGBPath )
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ ConversionDialog.updateDrizzleFile" );
      }

      var success = false;

      try
      {
         var inputDRZFile = new File;
         inputDRZFile.openForReading( inputDRZPath );

         var inputDRZText = inputDRZFile.read( DataType_ByteArray, inputDRZFile.size ).utf8ToString();
         inputDRZFile.close();

         if ( inputDRZText.search( /P\{.*?\}/ ) < 0 )
         {
            console.warningln( "WARNING: Invalid or corrupted drizzle data file: " + inputDRZPath );
         }
         else
         {
            // Replace debayered not registered image path with RGB Bayer image path.
            var outputDRZText = inputDRZText.replace( /P\{.*?\}/, "P{" + bayerRGBPath + "}" );
            try
            {
               // Generate output drizzle file.
               if (File.exists ( outputDRZPath ) )
               {
                  console.warningln( "WARNING: Overwriting existing drizzle data file: " + outputDRZPath );
               }
               var outputDRZFile = new File;
               outputDRZFile.createForWriting( outputDRZPath );
               outputDRZFile.write( ByteArray.stringToUTF8( outputDRZText ) );
               outputDRZFile.close();
               success = true;
            }
            catch ( error )
            {
               console.warningln( "WARNING: Unable to write drizzle data file: " + outputDRZPath + " (" + error.message + ")." );
            }
         }
      }
      catch ( error )
      {
         console.warningln( "WARNING: Unable to read drizzle data file: " + inputDRZPath + " (" + error.message + ")." );
      }
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} ConversionDialog.updateDrizzleFile" );
      }
      return ( success );
   }

   /// Method to convert all of the mono CFA input images and drizzle files.
   ///
   this.processInputFiles = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "{ ConversionDialog.processInputFiles" );
      }

      console.show();
      // Handle aborting through dialog's own button.
      console.abortEnabled = false;
      processEvents();

      var filesProcessed = 0,
          filesErrors = 0,
          i = 0,
          j = 0,
          keywords = new Array,
          outputImagePath = "";

      // Create output directory if it doesn't exist.
      if ( !File.directoryExists( this.outputDirectory ) )
      {
         try
         {
            File.createDirectory( this.outputDirectory );
         }
         catch ( error )
         {
            console.warningln( "WARNING: Unable to create output directory: " + this.outputDirectory + " (" + error.message + ")." );
         }
      }

      // Did directory already exist or get created successfully?
      if ( !File.directoryExists( this.outputDirectory ) )
      {
         console.warningln( "WARNING: Output directory does not exist, no files converted: " + this.outputDirectory );
      }
      else
      {
         // Process each of the input files.
         for ( i = 0; i < this.inputImageFiles.length; ++i )
         {
            if ( DEBUGGING_MODE_ON )
            {
               console.noteln( "Attempting image file " + i + " : " + this.inputImageFiles[i] );
               console.noteln( "Attempting drizzle file " + i + " : " + this.inputDRZFiles[i] );
            }
   
            this.readInputImage( this.inputImageFiles[i] );
            filesProcessed++;
   
            // Update status bar.
            this.setStatus( "Converting: " + filesProcessed + "/" + this.inputImageFiles.length + " Failed: " + filesErrors );
   
            // Keep the GUI responsive.
            processEvents();
   
            // Check for user wanting to abort script.
            if ( this.abortRequested )
            {
               // First close any open files.
               if ( this.inputImageWindow != null )
               {
                  this.closeInputImage();
               }
               if ( this.outputImageWindow != null )
               {
                  this.closeOutputImage();
               }
   
               // Now abort script.
               this.abortRequested = false;
               console.noteln( "Conversion aborted by user." );
               this.setStatus( "Conversion aborted by user." );
               this.updateUI();
               processEvents();
               if ( DEBUGGING_MODE_ON )
               {
                  console.noteln( "} ConversionDialog.processInputImages" );
               }
               console.flush();
               return;
            }

            // Check whether we successfully opened an image.
            if ( this.inputImageWindow == null )
            {
               filesErrors++;
            }
            else
            {
               if ( this.inputImageWindow.length > 1 )
               {
                  console.warningln( "WARNING: Multiple images in file. Cannot convert: " + this.inputImageFiles[i] );
                  filesErrors++;
               }
               else if ( this.inputImageWindow[0].mainView.image.numberOfChannels > 1 )
               {
                  console.warningln( "WARNING: Multiple channels in image (probably not a mono CFA image). Cannot convert: " + this.inputImageFiles[i] );
                  filesErrors++;
               }
               else
               {
                  console.writeln( "Converting image: " + this.inputImageFiles[i] );
   
                  // Convert the mono CFA input image to a new RGB Bayer output image.
                  this.outputImageWindow = this.engine.convertImage( this.inputImageWindow[0] );
                  if (this.outputImageWindow == null )
                  {
                     filesErrors++;
                  }
                  else
                  {
                     // Copy amdended version of image keywords from input image to output image.
                     keywords = this.inputImageWindow[0].keywords;
                     this.closeInputImage(); // Done with input image window.
   
                     // Make any channel 0 noise estimates in the FITS/XISF keywords historical only as now have 3 channels.
                     // Not sure if this is a required step but better safe than sorry.
                     for ( j = 0; j < keywords.length; j++ )
                     {
                        if ( keywords[j].name === "NOISE00" || keywords[j].name === "NOISEF00" || keywords[j].name === "NOISEA00")
                        {
                           keywords[j].name = "HISTORY_" + keywords[j].name;
                        }
                     }
                     // Add a new history keyword.   
                     keywords.push( new FITSKeyword( "HISTORY", "", "BayerDrizzlePrep with pattern " + this.dialog.bayerPatternComboBox.itemText( this.dialog.bayerPatternComboBox.currentItem ) ) );
                     this.outputImageWindow.keywords = keywords;
                     outputImagePath = this.outputDirectory + "/" + File.extractName( this.inputImageFiles[i] ) + "_brgb" + File.extractExtension( this.inputImageFiles[i] );
   
                     // Save new RGB Bayer image to output directory.
                     if ( !this.saveImage( outputImagePath , this.outputImageWindow, true ) )
                     {
                        filesErrors++;
                     }
                     else
                     {
                        console.writeln( "Converting drizzle file: " + this.inputDRZFiles[i] );

                        // Read the mono CFA drizzle file, update it to point at new RGB Bayer image and write it to the output directory.
                        if ( !this.updateDrizzleFile( this.inputDRZFiles[i], this.outputDirectory + "/" + File.extractName( this.inputImageFiles[i] ) + "_brgb" + File.extractExtension( this.inputDRZFiles[i] ), outputImagePath ) )
                        {
                           filesErrors++;
                        }
                     }
                     this.closeOutputImage(); // Done with output image window.
                  }
               }
               if ( this.inputImageWindow != null )
               {
                  // Close the input image window if we haven't already done so.
                  this.closeInputImage();
               }
            }
         }
      }

      // Update status bar and console.
      this.setStatus( "Converted: " + filesProcessed + "/" + this.inputImageFiles.length + " Failed: " + filesErrors );
      console.noteln( "Image files converted: " + filesProcessed + ". Successful: " + (filesProcessed - filesErrors) + ". Failed: " + filesErrors + "." );
      processEvents();

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "} ConversionDialog.processInputFiles" );
      }
      console.flush();
   };

   // -------- # UI begin -------------------------------------------------------

   // Determine correct label and control sizes based on font used by dialog.
   this.labelWidth1 = this.font.width( "Output Directory :" + 'T' );

   /// Method to handle toggling of a section bar.
   ///
   /// @param {object} sectionBar section bar being toggled.
   /// @param {boolean} beginToggle true if toggle is starting, false if ending.
   this.onToggleSection = function( sectionBar, beginToggle )
   {
      if ( beginToggle )
      {
         // Freeze the size of some elements whilst toggling.
         this.dialog.filesTreeBox.setFixedSize();
      }
      else
      {
         // Allow resizing of some elements when toggling finished.
         this.dialog.filesTreeBox.setVariableSize();
      }
    };

   // -------- # Help label begin -----------------------------------------------

   // Help label.
   this.helpLabel = this.UIFactory.defaultHelpLabel( this,
                                                     "<p><b>" + TITLE + " v" + VERSION + "</b> &mdash; A script to convert " +
                                                     "a set of monochrome CFA images to RGB Bayer images and create a " +
                                                     "corresponding drizzle data file for use as part of a Bayer Drizzle "+
                                                     "workflow:<br/>" +
                                                     "Copyright &copy; 2015 Ian Lauwerys (www.blackwaterskies.co.uk)</p>" );

   // -------- # Help label end -------------------------------------------------

   // -------- # Images Tree box begin -------------------------------------------------

   // Tree box to hold images for conversion.
   this.filesTreeBox = this.UIFactory.simpleTreeBox( this, this.inputImageFiles, 600, 200 );

   // Tree box selection updated, so select same children in other tree box.
   this.filesTreeBox.onNodeSelectionUpdated = function()
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
      this.dialog.drzTreeBox.canUpdate = false;
      for ( var i = 0; i < this.dialog.filesTreeBox.numberOfChildren && i < this.dialog.drzTreeBox.numberOfChildren; ++i )
      {
         this.dialog.drzTreeBox.child(i).selected = this.dialog.filesTreeBox.child(i).selected;
      }
      this.dialog.filesTreeBox.canUpdate = true;
      this.dialog.drzTreeBox.canUpdate = true;
      this.dialog.filesTreeBox.adjustColumnWidthToContents( 0 );
      this.dialog.drzTreeBox.adjustColumnWidthToContents( 0 );

      this.dialog.isProcessing = false;
   };

   // Tree box Add button.
   this.filesAddButton = this.UIFactory.fullPushButton ( this, "Add Image Files...", this.scaledResource( ":/icons/add.png" ), "<p>Add images to the conversion list.</p>" );

   this.filesAddButton.onClick = function()
   {
      if ( this.dialog.isProcessing )
      {
         return;
      }
      else
      {
         this.dialog.isProcessing = true;
      }

      var fileDialog = new OpenFileDialog;
      fileDialog.multipleSelections = true;
      fileDialog.caption = TITLE + " : Select Images to Convert";
      fileDialog.loadImageFilters();

      if ( fileDialog.execute() )
      {
         this.dialog.filesTreeBox.canUpdate = false;
         for ( var i = 0; i < fileDialog.fileNames.length; ++i )
         {
            // Add nodes to the tree box.
            var node = new TreeBoxNode( this.dialog.filesTreeBox );
            node.setText( 0, fileDialog.fileNames[i] );
            // Also update the inputImageFiles property of the GUI object.
            this.dialog.inputImageFiles.push( fileDialog.fileNames[i] );
         }
         this.dialog.filesTreeBox.canUpdate = true;
         this.dialog.filesTreeBox.adjustColumnWidthToContents( 0 );

         // Enable or disable the OK button depending on whether lists have equal numbers of entries.
         this.dialog.updateOKButton();
      }

      this.dialog.isProcessing = false;
   };

   // Tree box clear button.
   this.filesClearButton = this.UIFactory.fullPushButton ( this, "Clear", this.scaledResource( ":/icons/list-delete.png" ), "<p>Clear the conversion list.</p>" );

   this.filesClearButton.onClick = function()
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
      this.dialog.filesTreeBox.clear();
      this.dialog.filesTreeBox.canUpdate = true;
      this.dialog.filesTreeBox.adjustColumnWidthToContents( 0 );
      this.dialog.inputImageFiles.length = 0;

      // Enable or disable the OK button depending on whether lists have equal numbers of entries.
      this.dialog.updateOKButton();

      this.dialog.isProcessing = false;
   };

   // Tree box Move Up button.
   this.filesMoveUpButton = this.UIFactory.fullPushButton ( this, "Move Up", this.scaledResource( ":/icons/up.png" ), "<p>Move the selected image file(s) up the conversion list.</p>" );

   this.filesMoveUpButton.onClick = function()
   {
      if ( this.dialog.isProcessing )
      {
         return;
      }
      else
      {
         this.dialog.isProcessing = true;
      }

      var holdFile = "",
          holdSelected = false;

      this.dialog.filesTreeBox.canUpdate = false;
      for ( var i = 0; i < this.dialog.filesTreeBox.numberOfChildren; i++ )
      {
         if ( this.dialog.filesTreeBox.child( i ).selected && i == 0 )
         {
            // First selected item is at the top of the list, so can't move any items up.
            break;
         }
         if ( this.dialog.filesTreeBox.child( i ).selected )
         {
            // Swap this item and the previous one, including selection state.
            holdFile = this.dialog.inputImageFiles[i];
            holdSelected = this.dialog.filesTreeBox.child( i ).selected;
            this.dialog.inputImageFiles[i] = this.dialog.inputImageFiles[i - 1];
            this.dialog.inputImageFiles[i - 1] = holdFile;
            this.dialog.filesTreeBox.child( i ).selected = this.dialog.filesTreeBox.child( i - 1 ).selected;
            this.dialog.filesTreeBox.child( i - 1 ).selected = holdSelected;
            this.dialog.filesTreeBox.child( i ).setText( 0, this.dialog.inputImageFiles[i] );
            this.dialog.filesTreeBox.child( i - 1 ).setText( 0, this.dialog.inputImageFiles[i - 1] );
         }
      }
      this.dialog.filesTreeBox.canUpdate = true;
      this.dialog.filesTreeBox.adjustColumnWidthToContents( 0 );

      this.dialog.isProcessing = false;

      this.dialog.filesTreeBox.onNodeSelectionUpdated();
   };

   // Tree box Move Down button.
   this.filesMoveDownButton = this.UIFactory.fullPushButton ( this, "Move Down", this.scaledResource( ":/icons/down.png" ), "<p>Move the selected image file(s) down the conversion list.</p>" );

   this.filesMoveDownButton.onClick = function()
   {
      if ( this.dialog.isProcessing )
      {
         return;
      }
      else
      {
         this.dialog.isProcessing = true;
      }

      var holdFile = "",
          holdSelected = false;

      this.dialog.filesTreeBox.canUpdate = false;
      for ( var i = this.dialog.filesTreeBox.numberOfChildren - 1; i >= 0; i-- )
      {
         if ( this.dialog.filesTreeBox.child( i ).selected && i == ( this.dialog.filesTreeBox.numberOfChildren - 1 ) )
         {
            // Last selected item is at the bottom of the list, so can't move any items down.
            break;
         }
         if ( this.dialog.filesTreeBox.child( i ).selected )
         {
            // Swap this item and the next one, including selection state.
            holdFile = this.dialog.inputImageFiles[i];
            holdSelected = this.dialog.filesTreeBox.child( i ).selected;
            this.dialog.inputImageFiles[i] = this.dialog.inputImageFiles[i + 1];
            this.dialog.inputImageFiles[i + 1] = holdFile;
            this.dialog.filesTreeBox.child( i ).selected = this.dialog.filesTreeBox.child( i + 1 ).selected;
            this.dialog.filesTreeBox.child( i + 1 ).selected = holdSelected;
            this.dialog.filesTreeBox.child( i ).setText( 0, this.dialog.inputImageFiles[i] );
            this.dialog.filesTreeBox.child( i + 1 ).setText( 0, this.dialog.inputImageFiles[i + 1] );
         }
      }
      this.dialog.filesTreeBox.canUpdate = true;
      this.dialog.filesTreeBox.adjustColumnWidthToContents( 0 );
      this.dialog.isProcessing = false;

      this.dialog.filesTreeBox.onNodeSelectionUpdated();
   };

   // Tree box Invert Selection button.
   this.filesInvertButton = this.UIFactory.fullPushButton ( this, "Invert Selection", this.scaledResource( ":/icons/select-invert" ), "<p>Invert the current selection of images.</p>" );

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
      this.dialog.filesTreeBox.onNodeSelectionUpdated();

      this.dialog.isProcessing = false;
   };

   // Tree box Remove Selected button.
   this.filesRemoveButton = this.UIFactory.fullPushButton ( this, "Remove Selected", this.scaledResource( ":/icons/remove.png" ), "<p>Remove the selected images from the conversion list.</p>" );

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
      this.dialog.inputImageFiles.length = 0;
      for ( var i = 0; i < this.dialog.filesTreeBox.numberOfChildren; ++i )
      {
         if ( !this.dialog.filesTreeBox.child(i).selected )
         {
            this.dialog.inputImageFiles.push( this.dialog.filesTreeBox.child(i).text(0) );
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

      // Enable or disable the OK button depending on whether lists have equal numbers of entries.
      this.dialog.updateOKButton();

      this.dialog.isProcessing = false;
   };

   // Sizer for Tree box buttons.
   this.filesButtonsSizer = new HorizontalSizer;
   this.filesButtonsSizer.spacing = 4;
   this.filesButtonsSizer.add( this.filesAddButton );
   this.filesButtonsSizer.addStretch();
   this.filesButtonsSizer.add( this.filesClearButton );
   this.filesButtonsSizer.addStretch();
   this.filesButtonsSizer.add( this.filesMoveUpButton );
   this.filesButtonsSizer.add( this.filesMoveDownButton );
   this.filesButtonsSizer.addStretch();
   this.filesButtonsSizer.add( this.filesInvertButton );
   this.filesButtonsSizer.add( this.filesRemoveButton );

   // Group Tree box and its buttons.
   this.filesGroupBox = this.UIFactory.groupBox( this, "Images to Convert" );
   this.filesGroupBox.sizer = new VerticalSizer;
   this.filesGroupBox.sizer.margin = 6;
   this.filesGroupBox.sizer.spacing = 4;
   // Ensure that Tree box takes any extra space as dialog expands vertically.
   this.filesGroupBox.sizer.add( this.filesTreeBox );
   this.filesGroupBox.sizer.add( this.filesButtonsSizer );

   // -------- # Images Tree box end ---------------------------------------------------
   
   // -------- # Drizzle File Tree box begin -------------------------------------------------

   // Tree box to hold drizzle files for conversion.
   this.drzTreeBox = this.UIFactory.simpleTreeBox( this, this.inputDRZFiles, 200, 200 );

   // Tree box selection updated, so select same children in other tree box.
   this.drzTreeBox.onNodeSelectionUpdated = function()
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
      this.dialog.drzTreeBox.canUpdate = false;
      for ( var i = 0; i < this.dialog.filesTreeBox.numberOfChildren && i < this.dialog.drzTreeBox.numberOfChildren; ++i )
      {
         this.dialog.filesTreeBox.child(i).selected = this.dialog.drzTreeBox.child(i).selected;
      }
      this.dialog.filesTreeBox.canUpdate = true;
      this.dialog.drzTreeBox.canUpdate = true;
      this.dialog.filesTreeBox.adjustColumnWidthToContents( 0 );
      this.dialog.drzTreeBox.adjustColumnWidthToContents( 0 );

      this.dialog.isProcessing = false;
   };

   // Tree box Add button.
   this.drzAddButton = this.UIFactory.fullPushButton ( this, "Add Drizzle Files...", this.scaledResource( ":/icons/add.png" ), "<p>Add drizzle files to the conversion list.</p>" );

   this.drzAddButton.onClick = function()
   {
      if ( this.dialog.isProcessing )
      {
         return;
      }
      else
      {
         this.dialog.isProcessing = true;
      }

      var fileDialog = new OpenFileDialog;
      fileDialog.multipleSelections = true;
      fileDialog.caption = TITLE + " : Select Drizzle FIles to Convert";
      fileDialog.filters = [ [ "DRZ Files", "*.drz" ] ];

      if ( fileDialog.execute() )
      {
         this.dialog.drzTreeBox.canUpdate = false;
         for ( var i = 0; i < fileDialog.fileNames.length; ++i )
         {
            // Add nodes to the tree box.
            var node = new TreeBoxNode( this.dialog.drzTreeBox );
            node.setText( 0, fileDialog.fileNames[i] );
            // Also update the inputDRZFiles property of the GUI object.
            this.dialog.inputDRZFiles.push( fileDialog.fileNames[i] );
         }
         this.dialog.drzTreeBox.canUpdate = true;
         this.dialog.drzTreeBox.adjustColumnWidthToContents( 0 );

         // Enable or disable the OK button depending on whether lists have equal numbers of entries.
         this.dialog.updateOKButton();
      }

      this.dialog.isProcessing = false;
   };

   // Tree box clear button.
   this.drzClearButton = this.UIFactory.fullPushButton ( this, "Clear", this.scaledResource( ":/icons/list-delete.png" ), "<p>Clear the conversion list.</p>" );

   this.drzClearButton.onClick = function()
   {
      if ( this.dialog.isProcessing )
      {
         return;
      }
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.drzTreeBox.canUpdate = false;
      this.dialog.drzTreeBox.clear();
      this.dialog.drzTreeBox.canUpdate = true;
      this.dialog.drzTreeBox.adjustColumnWidthToContents( 0 );
      this.dialog.inputDRZFiles.length = 0;

      // Enable or disable the OK button depending on whether lists have equal numbers of entries.
      this.dialog.updateOKButton();

      this.dialog.isProcessing = false;
   };

   // Tree box Move Up button.
   this.drzMoveUpButton = this.UIFactory.fullPushButton ( this, "Move Up", this.scaledResource( ":/icons/up.png" ), "<p>Move the selected drizzle file(s) up the conversion list.</p>" );

   this.drzMoveUpButton.onClick = function()
   {
      if ( this.dialog.isProcessing )
      {
         return;
      }
      else
      {
         this.dialog.isProcessing = true;
      }

      var holdFile = "",
          holdSelected = false;

      this.dialog.drzTreeBox.canUpdate = false;
      for ( var i = 0; i < this.dialog.drzTreeBox.numberOfChildren; i++ )
      {
         if ( this.dialog.drzTreeBox.child( i ).selected && i == 0 )
         {
            // First selected item is at the top of the list, so can't move any items up.
            break;
         }
         if ( this.dialog.drzTreeBox.child( i ).selected )
         {
            // Swap this item and the previous one, including selection state.
            holdFile = this.dialog.inputDRZFiles[i];
            holdSelected = this.dialog.drzTreeBox.child( i ).selected;
            this.dialog.inputDRZFiles[i] = this.dialog.inputDRZFiles[i - 1];
            this.dialog.inputDRZFiles[i - 1] = holdFile;
            this.dialog.drzTreeBox.child( i ).selected = this.dialog.drzTreeBox.child( i - 1 ).selected;
            this.dialog.drzTreeBox.child( i - 1 ).selected = holdSelected;
            this.dialog.drzTreeBox.child( i ).setText( 0, this.dialog.inputDRZFiles[i] );
            this.dialog.drzTreeBox.child( i - 1 ).setText( 0, this.dialog.inputDRZFiles[i - 1] );
         }
      }
      this.dialog.drzTreeBox.canUpdate = true;
      this.dialog.drzTreeBox.adjustColumnWidthToContents( 0 );

      this.dialog.isProcessing = false;

      this.dialog.drzTreeBox.onNodeSelectionUpdated();
   };

   // Tree box Move Down button.
   this.drzMoveDownButton = this.UIFactory.fullPushButton ( this, "Move Down", this.scaledResource( ":/icons/down.png" ), "<p>Move the selected drizzle file(s) down the conversion list.</p>" );

   this.drzMoveDownButton.onClick = function()
   {
      if ( this.dialog.isProcessing )
      {
         return;
      }
      else
      {
         this.dialog.isProcessing = true;
      }

      var holdFile = "",
          holdSelected = false;

      this.dialog.drzTreeBox.canUpdate = false;
      for ( var i = this.dialog.drzTreeBox.numberOfChildren - 1; i >= 0; i-- )
      {
         if ( this.dialog.drzTreeBox.child( i ).selected && i == ( this.dialog.drzTreeBox.numberOfChildren - 1 ) )
         {
            // Last selected item is at the bottom of the list, so can't move any items down.
            break;
         }
         if ( this.dialog.drzTreeBox.child( i ).selected )
         {
            // Swap this item and the next one, including selection state.
            holdFile = this.dialog.inputDRZFiles[i];
            holdSelected = this.dialog.drzTreeBox.child( i ).selected;
            this.dialog.inputDRZFiles[i] = this.dialog.inputDRZFiles[i + 1];
            this.dialog.inputDRZFiles[i + 1] = holdFile;
            this.dialog.drzTreeBox.child( i ).selected = this.dialog.drzTreeBox.child( i + 1 ).selected;
            this.dialog.drzTreeBox.child( i + 1 ).selected = holdSelected;
            this.dialog.drzTreeBox.child( i ).setText( 0, this.dialog.inputDRZFiles[i] );
            this.dialog.drzTreeBox.child( i + 1 ).setText( 0, this.dialog.inputDRZFiles[i + 1] );
         }
      }
      this.dialog.drzTreeBox.canUpdate = true;
      this.dialog.drzTreeBox.adjustColumnWidthToContents( 0 );
      this.dialog.isProcessing = false;

      this.dialog.drzTreeBox.onNodeSelectionUpdated();
   };

   // Tree box Invert Selection button.
   this.drzInvertButton = this.UIFactory.fullPushButton ( this, "Invert Selection", this.scaledResource( ":/icons/select-invert" ), "<p>Invert the current selection of drizzle files.</p>" );

   this.drzInvertButton.onClick = function()
   {
      if ( this.dialog.isProcessing )
      {
         return;
      }
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.drzTreeBox.canUpdate = false;
      for ( var i = 0; i < this.dialog.drzTreeBox.numberOfChildren; ++i )
      {
         this.dialog.drzTreeBox.child(i).selected = !this.dialog.drzTreeBox.child(i).selected;
      }
      this.dialog.drzTreeBox.canUpdate = true;
      this.dialog.drzTreeBox.adjustColumnWidthToContents( 0 );
      this.dialog.drzTreeBox.onNodeSelectionUpdated();

      this.dialog.isProcessing = false;
   };

   // Tree box Remove Selected button.
   this.drzRemoveButton = this.UIFactory.fullPushButton ( this, "Remove Selected", this.scaledResource( ":/icons/remove.png" ), "<p>Remove the selected drizzle files from the conversion list.</p>" );

   this.drzRemoveButton.onClick = function()
   {
      if ( this.dialog.isProcessing )
      {
         return;
      }
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.drzTreeBox.canUpdate = false;
      this.dialog.inputDRZFiles.length = 0;
      for ( var i = 0; i < this.dialog.drzTreeBox.numberOfChildren; ++i )
      {
         if ( !this.dialog.drzTreeBox.child(i).selected )
         {
            this.dialog.inputDRZFiles.push( this.dialog.drzTreeBox.child(i).text(0) );
         }
      }
      for ( var i = this.dialog.drzTreeBox.numberOfChildren; --i >= 0; )
      {
         if ( this.dialog.drzTreeBox.child( i ).selected )
         {
            this.dialog.drzTreeBox.remove( i );
         }
      }
      this.dialog.drzTreeBox.canUpdate = true;
      this.dialog.drzTreeBox.adjustColumnWidthToContents( 0 );

      // Enable or disable the OK button depending on whether lists have equal numbers of entries.
      this.dialog.updateOKButton();

      this.dialog.isProcessing = false;
   };

   // Sizer for Tree box buttons.
   this.drzButtonsSizer = new HorizontalSizer;
   this.drzButtonsSizer.spacing = 4;
   this.drzButtonsSizer.add( this.drzAddButton );
   this.drzButtonsSizer.addStretch();
   this.drzButtonsSizer.add( this.drzClearButton );
   this.drzButtonsSizer.addStretch();
   this.drzButtonsSizer.add( this.drzMoveUpButton );
   this.drzButtonsSizer.add( this.drzMoveDownButton );
   this.drzButtonsSizer.addStretch();
   this.drzButtonsSizer.add( this.drzInvertButton );
   this.drzButtonsSizer.add( this.drzRemoveButton );

   // Group Tree box and its buttons.
   this.drzGroupBox = this.UIFactory.groupBox( this, "Drizzle Files to Convert" );
   this.drzGroupBox.sizer = new VerticalSizer;
   this.drzGroupBox.sizer.margin = 6;
   this.drzGroupBox.sizer.spacing = 4;
   // Ensure that Tree box takes any extra space as dialog expands vertically.
   this.drzGroupBox.sizer.add( this.drzTreeBox );
   this.drzGroupBox.sizer.add( this.drzButtonsSizer );

   // -------- # Drizzle File Tree box end ---------------------------------------------------

   // -------- # Conversion options begin ---------------------------------------

   // Bayer Pattern Combo.
   this.bayerPatternLabel = this.UIFactory.defaultLabel( this, "Bayer Pattern :", this.labelWidth1 );
   this.bayerPatternComboBox = this.UIFactory.fullComboBox( this, [ "RGGB", "BGGR", "GRBG", "GBRG" ], this.engine.bayerPattern, "<p>Bayer pattern of mono CFA images to be converted.</p>" );

   this.bayerPatternComboBox.onItemSelected = function( item )
   {
      if ( this.dialog.isProcessing )
      {
         return;
      }
      else
      {
         this.dialog.isProcessing = true;
      }

      this.dialog.engine.setBayerPattern( item );
      // Update control in case item has been changed by .setBayerPattern.
      this.dialog.bayerPatternComboBox.currentItem = this.dialog.engine.bayerPattern;

      this.dialog.isProcessing = false;
   };

   this.bayerPatternSizer = new HorizontalSizer;
   this.bayerPatternSizer.spacing = 4;
   this.bayerPatternSizer.add(this.bayerPatternLabel);
   this.bayerPatternSizer.add(this.bayerPatternComboBox );
   this.bayerPatternSizer.addStretch();

   // Output Directory Input.
   this.outputDirectoryLabel = this.UIFactory.defaultLabel( this, "Output Directory :", this.labelWidth1 );
   this.outputDirectoryEdit = this.UIFactory.editBox ( this, this.outputDirectory, true, "<p>Output directory location.</p>" );

   this.outputDirectoryEditSizer = new HorizontalSizer;
   this.outputDirectoryEditSizer.spacing = 4;
   this.outputDirectoryEditSizer.add( this.outputDirectoryLabel );
   this.outputDirectoryEditSizer.add( this.outputDirectoryEdit, 100 );

   // Output Directory button.
   this.outputDirectoryButton = this.UIFactory.fullPushButton ( this, "Output Directory...", ":/icons/document-save.png", "<p>Choose output directory.</p>" );
   
   this.outputDirectoryButton.onClick = function()
   {
      if ( this.dialog.isProcessing )
      {
         return;
      }
      else
      {
         this.dialog.isProcessing = true;
      }

     // Show a dialog to select a directory for output.
      var outputDirectoryDialog = new GetDirectoryDialog();
      outputDirectoryDialog.overwritePrompt = false;
      outputDirectoryDialog.caption = TITLE + " : Set Output Directory";
      outputDirectoryDialog.filters = [ [ "All Files", "*.*" ] ];
      if ( this.dialog.outputDirectory != "" && File.directoryExists( this.dialog.outputDirectory ) )
      {
         if ( DEBUGGING_MODE_ON )
         {
            console.noteln( "Directory exists, using as starting location." );
         }
         // Current directory exists so use it as starting location.
         outputDirectoryDialog.initialPath = this.dialog.outputDirectory;
      }
      else
      {
         if ( DEBUGGING_MODE_ON )
         {
            console.noteln( "Directory doesn't exist, using default directory." );
         }
         // Directory doesn't exist so use default location and filename.
         outputDirectoryDialog.initialPath = File.systemTempDirectory + "/bayerdrizzle";
      }

      // Get user to select directory and file.
      if ( outputDirectoryDialog.execute() )
      {
         if ( DEBUGGING_MODE_ON )
         {
            console.noteln( "User selected a directory." );
         }
         this.dialog.outputDirectory = outputDirectoryDialog.directory;
      }
      this.dialog.outputDirectoryEdit.text = this.dialog.outputDirectory;

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "Directory name chosen is: " + this.dialog.outputDirectory );
      }

      this.dialog.isProcessing = false;
};

   this.outputDirectorySizer = new HorizontalSizer;
   this.outputDirectorySizer.spacing = 8;
   this.outputDirectorySizer.add( this.outputDirectoryEditSizer, 100 );
   this.outputDirectorySizer.add( this.outputDirectoryButton );   

   // Group conversion options.
   this.conversionOptions = new HorizontalSizer;
   this.conversionOptions.spacing = 8;
   this.conversionOptions.add( this.bayerPatternSizer );
   // this.conversionOptions.add (this.outputDirectorySizer );

   this.conversionOptionsGroupBox = this.UIFactory.groupBox( this );
   this.conversionOptionsGroupBox.sizer = new VerticalSizer;
   this.conversionOptionsGroupBox.sizer.margin = 8;
   this.conversionOptionsGroupBox.sizer.spacing = 8;
   this.conversionOptionsGroupBox.sizer.add( this.conversionOptions );
   this.conversionOptionsGroupBox.sizer.add (this.outputDirectorySizer );

   // Section bar for conversion options.
   this.conversionOptionsSectionBar = this.UIFactory.sectionBar( this, "Conversion Options" )
   this.conversionOptionsSectionBar.setSection( this.conversionOptionsGroupBox );
   this.conversionOptionsSectionBar.onToggleSection = this.onToggleSection;

   // -------- # Conversion options end -----------------------------------------

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

         "<strong>Summary of Instructions:</strong><br /><br />" +

         "This script is used as part of a Bayer Drizzle workflow. " +
         "Note the BatchPreprocessing script can also perform Bayer Drizzle " +
         "but this script enables you to use the separate calibration, "+
         "registration and integration processes instead of BPP.<br /><br />" +

         "Simply follow your standard calibration, debayer, registration and " +
         "integration workflow as usual, but ensure that you enable the Generate " +
         "/ Update Drizzle Data option in each tool.<br /><br />" +

         "Once you have complete .drz files follow the instructions below:<br /><br />" +
         
         "<strong>Images to Convert</strong><br /><br />" +

         "Click the <strong>&quot;Add&quot;</strong> button to choose the image " +
         "files to convert. These should be the OSC images used in the standard " +
         "workflow above that have been calibrated and cosmeticized, but not yet " +
         "debayered. i.e. single channel (monochrome) images with a CFA (Bayer) pattern.<br /><br />" +

         "<strong>Drizzle Files to Convert</strong><br /><br />" +

         "Click the second <strong>&quot;Add&quot;</strong> button to choose the drizzle " +
         "files to convert. These will be the drizzle files generated at the end of " +
         "the standard workflow above.<br /><br />" +

         "<strong>IMPORTANT: BayerDrizzlePrep cannot automatically determine which image " +
         "file relates to which drizzle file. Therefore you must ensure that each image " +
         "file has a corresponding drizzle file and that they are IN THE SAME ORDER IN " +
         "EACH LIST.</strong><br /><br />" +

         "<strong>Conversion Options</strong><br /><br />" +

         "Select the Bayer pattern that applies to the mono CFA images to be converted. " +
         "If you are working with different Bayer patterns, they must be converted " +
         "in separate batches as only one pattern can be used per run.<br /><br />" +

         "Select an <strong>Output Directory</strong> where the converted RGB Bayer images and the " +
         "new drizzle files will be written.  It is advisable to use an empty directory to avoid " +
         "accidentally overwriting images or drizzle files from the standard workflow " +
         "that you ran previously.  Beware of name clashes between files in different folders. " +
         "Again, this can be dealt with by converting different batches to different output directories.<br /><br />" +

         "<strong>Conversion</strong><br /><br />" +

         "The <strong>&quot;Convert&quot;</strong> button converts all selected " +
         "images and drizzle files in the list.<br /><br />" +

         "<strong>Bayer Drizzle</strong><br /><br />" +

         "Finally, run the DrizzleIntegration process with the new drizzle files that were " +
         "created in the Output Folder. Use scale = 1 and drop shrink = 1.  The result will be a " +
         "Bayer Drizzled integrated image. Note that you shouldn't use both Bayer " +
         "Drizzle and upscaling unless you have a very large amount of source images.</p>";

   this.helpButton = this.UIFactory.fullToolButton( this, this.scaledResource( ":/process-interface/browse-documentation.png" ), helpText )

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

      if ( !Dialog.browseScriptDocumentation( "BayerDrizzlePrep" ) )
      {
         ( new MessageBox( "<p>Documentation has not been installed.</p>", TITLE + "." + VERSION, StdIcon_Error, StdButton_Ok ) ).execute();
      }

      this.dialog.isProcessing = false;
   };

   // OK button.
   this.okButton = this.UIFactory.specialPushButton( this, "Convert", this.scaledResource( ":/icons/power.png" ), "<p>Convert images in the list.</p>" );
   this.okButton.enabled = true;

   this.okButton.onClick = function()
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "Running conversion from mono CFA to RGB Bayer." );
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

      if ( this.dialog.inputImageFiles.length != this.dialog.inputDRZFiles.length ) {
         console.warningln( "WARNING: Unable to run conversion, unequal numbers of image files and drizzle files." );
      } else {
         this.dialog.processInputFiles();
      }

      this.dialog.isProcessing = false;
      this.dialog.updateUI();

      if ( DEBUGGING_MODE_ON )
      {
         console.noteln( "Conversion complete." );
      }
   };

   // Cancel button.
   this.cancelButton = this.UIFactory.specialPushButton( this, "Exit", this.scaledResource( ":/icons/cancel.png" ), "<p>Exit the BayerDrizzlePrep script.</p>" );

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
   this.sizer.add( this.filesGroupBox );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.drzGroupBox );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.conversionOptionsSectionBar );
   this.sizer.add( this.conversionOptionsGroupBox );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.buttonsSizer );

   // Dialog options.
   this.windowTitle = TITLE + " Script v" + VERSION;
   this.userResizable = true;
   this.adjustToContents();

   // Ensure that Tree boxes take any extra space as dialog expands vertically.
   this.helpLabel.setFixedHeight();
   this.conversionOptionsGroupBox.setFixedHeight();

   // -------- # Dialog end -----------------------------------------------------

   if ( DEBUGGING_MODE_ON )
   {
      console.noteln( "} ConversionDialog" );
   }

} // class ConversionDialog

// Inherit all properties and methods from the core Dialog object.
ConversionDialog.prototype = new Dialog;

// ----------------------------------------------------------------------------
// EOF BayerDrizzlePrep-GUI.js - Released 2015/11/06 00:00:00 UTC
