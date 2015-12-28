// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// BatchLinearFit.js - Released 2015/07/22 16:24:26 UTC
// ----------------------------------------------------------------------------
//
// This file is part of BatchLinearFit Script version 0.1.0
//
// Copyright (c) 2013 Antti Kuntsi
// 
// Based on BatchFormatConversion.js
// Copyright (c) 2009-2013 Pleiades Astrophoto S.L.
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
 * BatchLinearFit v0.1.0
 *
 * A batch image format conversion utility.
 *
 * This script allows you to define a set of input image files, a reference
 * image file, an optional output directory, and output file and sample formats.
 * The script then iterates reading each input file, applying linear fits with
 * the reference image, converting to the selected sample format if necessary,
 * and saving into the output directory with the specified output file format.
 *
 * Copyright (C) 2013 Antti Kuntsi
 *
 * Based on BatchFormatConversion.js
 * Copyright 2009-2013 Pleiades Astrophoto S.L.
 */

#feature-id    Batch Processing > BatchLinearFit

#feature-info  A batch linear fit utility.<br/>\
   <br/> \
   This script allows you to define a set of input image files, a reference \
   image file, an optional output directory, and output file and sample formats. \
   The script then iterates reading each input file, applying linear fits with \
   the reference image, converting to the selected sample format if necessary, \
   and saving into the output directory with the specified output file format.\
   <br>\
   <br>\
   This script is very useful when you have to linear fit several images e.g. \
   for a large mosaics. It saves you the work of opening, linear fitting and \
   saving each file manually one at a time. It is recommended to run this script \
   for each filter separately, using a hand-made filter specific target mosaic.<br/>\
   <br/> \
   Copyright &copy; 2013 Antti Kuntsi<br/><br/>\
   Based on BatchFormatConversion.js <br/>\
   Copyright &copy; 2009-2013 Pleiades Astrophoto S.L.

#feature-icon  BatchLinearFit.xpm

#include <pjsr/ColorSpace.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/SampleType.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/NumericControl.jsh>
#include <pjsr/UndoFlag.jsh>

#define DEFAULT_OUTPUT_EXTENSION ".xisf"

#define WARN_ON_NO_OUTPUT_DIRECTORY 0

#define VERSION "0.1.1"
#define TITLE   "BatchLinearFit"

/*
 * Batch Format Conversion engine
 */
function BatchLinearFitEngine()
{
   this.inputFiles = new Array;
   this.referenceImage = "";
   this.referenceImageWindow = null;
   this.referenceView = null;
   this.outputDirectory = "";
   this.outputPrefix = "";
   this.outputPostfix = "_f";
   this.rejectLow = 0.0000;
   this.rejectHigh = 0.92000;
   this.outputExtension = DEFAULT_OUTPUT_EXTENSION;
   this.overwriteExisting = false;
   this.outputFormat = null;
   this.showImages = false;

   this.readImage = function( filePath )
   {
      var inputImageWindow = ImageWindow.open(filePath);

      return inputImageWindow[0];
   };

   this.writeImage = function( imageWindow, filePath )
   {
      var fileDir = (this.outputDirectory.length > 0) ? this.outputDirectory :
                    File.extractDrive( filePath ) + File.extractDirectory( filePath );
      if ( !fileDir.endsWith( '/' ) )
         fileDir += '/';
      var fileName = File.extractName( filePath );
      var outputFilePath = fileDir + this.outputPrefix + fileName + this.outputPostfix + this.outputExtension;

      console.writeln( "<end><cbr><br>Output file:" );

      if ( File.exists( outputFilePath ) )
      {
         if ( this.overwriteExisting )
         {
            console.writeln( "<end><cbr>** Overwriting existing file: " + outputFilePath );
         }
         else
         {
            console.writeln( "<end><cbr>* File already exists: " + outputFilePath );
            for ( var u = 1; ; ++u )
            {
               var tryFilePath = File.appendToName( outputFilePath, '_' + u.toString() );
               if ( !File.exists( tryFilePath ) )
               {
                  outputFilePath = tryFilePath;
                  break;
               }
            }
            console.writeln( "<end><cbr>* Writing to: <raw>" + outputFilePath + "</raw>" );
         }
      }
      else
      {
         console.writeln( "<raw>" + outputFilePath + "</raw>" );
      }

      // write the output image to disk using
      // Boolean ImageWindow.saveAs(
      //    String filePath[,
      //    Boolean queryOptions[,
      //    Boolean allowMessages[,
      //    Boolean strict[,
      //    Boolean verifyOverwrite]]]] )
      imageWindow.saveAs( outputFilePath, false, false, false, false );
      // this statement will force ImageWindow to disable all format and security features, as follows
      //    disable query format-specific options
      //    disable warning messages on missing format features (icc profiles, etc)
      //    disable strict image writing mode (ignore lossy image generation)
      //    disable overwrite verification/protection

   };

   this.loadReference = function() {
      try
      {
         this.referenceImageWindow = this.readImage(this.referenceImage);
         this.referenceView = this.referenceImageWindow.mainView;
      }
      catch ( error )
      {
         console.writeln( error.message );
         console.writeln( error.stack.replace(/^[^\(]+?[\n$]/gm, '')
            .replace(/^\s+at\s+/gm, '')
            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
            .split('\n'));

         (new MessageBox( error.message + " Continue?", TITLE, StdIcon_Error, StdButton_Yes, StdButton_No )).execute();
      }
   };
   this.freeReference = function() {
      try
      {
         this.referenceView = null;
         if ( this.referenceImageWindow != null )
         {
            this.referenceImageWindow.purge();
            this.referenceImageWindow.close();
         }
         this.referenceImageWindow  = null;
      }
      catch ( error )
      {
         (new MessageBox( error.message, TITLE, StdIcon_Error, StdButton_Yes, StdButton_No )).execute();
      }
   };

   this.linearFitFiles = function()
   {
      var currentImage = null;
      try
      {
         this.outputFormat = new FileFormat( this.outputExtension, false/*toRead*/, true/*toWrite*/ );
         if ( this.outputFormat.isNull )
            throw new Error( "No installed file format can write \'" + this.outputExtension + "\' files." );

         this.loadReference();
         if (this.referenceView == null)
         {
            throw new Error("Unable to read the reference file, cannot continue.");
         }
         if (this.showImages)
            this.referenceImageWindow.show();

         var succeeded = 0;
         var errored = 0;


         for ( var i = 0; i < this.inputFiles.length; ++i )
         {
            try
            {
               console.writeln( format( "<end><cbr><br><b>Linear fitting file %u of %u:</b>", i+1, this.inputFiles.length ) );
               console.writeln( "<raw>" + this.inputFiles[i] + "</raw>" );
               currentImage = this.readImage( this.inputFiles[i] )
               var outputView = currentImage.mainView;
               outputView.beginProcess( UndoFlag_NoSwapFile );

               if (this.showImages)
                  currentImage.show();

               var linearFitProcess = new LinearFit;
               with (linearFitProcess){
                  referenceViewId = this.referenceView.id;
                  rejectLow = this.rejectLow;
                  rejectHigh = this.rejectHigh;
                  executeOn( outputView );
               }
               outputView.endProcess();
               this.writeImage(currentImage, this.inputFiles[i]);
               currentImage.purge();
               currentImage.close();
               currentImage = null;
               gc();
               ++succeeded;
            }
            catch ( error )
            {
               ++errored;
               if (currentImage != null)
               {
                  currentImage.purge();
                  currentImage.close();
                  currentImage = null;
               }
               if ( i+1 == this.inputFiles.length )
                  throw error;
               var errorMessage = "<p>" + error.message + ":</p>" +
                                  "<p>" + this.inputFiles[i] + "</p>" +
                                  "<p><b>Continue batch linear fitting?</b></p>";
               if ( (new MessageBox( errorMessage, TITLE, StdIcon_Error, StdButton_Yes, StdButton_No )).execute() != StdButton_Yes )
                  break;
            }
         }
         console.writeln( format( "<end><cbr><br>===== %d succeeded, %u error%s, %u skipped =====",
                                  succeeded, errored, (errored == 1) ? "" : "s", this.inputFiles.length-succeeded-errored ) );
      }
      catch ( error )
      {
         (new MessageBox( error.message, TITLE, StdIcon_Error, StdButton_Yes, StdButton_No )).execute();
      }
      finally
      {
         this.freeReference();
         if (currentImage != null)
         {
            currentImage.purge();
            currentImage.close();
         }
      }
   };
}

var engine = new BatchLinearFitEngine;

/*
 * Batch Linear Fit dialog
 */
function BatchLinearFitDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   //

   var labelWidth1 = this.font.width( "Output format hints:" + 'T' );
   this.textEditWidth = 25 * this.font.width( "M" );
   this.numericEditWidth = 6 * this.font.width( "0" );
   //

   this.helpLabel = new Label( this );
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.margin = this.logicalPixelsToPhysical( 4 );
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = "<p><b>" + TITLE + " v" + VERSION + "</b> &mdash; " +
                         "A batch image linear fitting utility.</p>" +
                         "<p>Copyright &copy; 2013 Antti Kuntsi</p>";
   //

   this.files_TreeBox = new TreeBox( this );
   this.files_TreeBox.multipleSelection = true;
   this.files_TreeBox.rootDecoration = false;
   this.files_TreeBox.alternateRowColor = true;
   this.files_TreeBox.setScaledMinSize( 300, 200 );
   this.files_TreeBox.numberOfColumns = 1;
   this.files_TreeBox.headerVisible = false;

   for ( var i = 0; i < engine.inputFiles.length; ++i )
   {
      var node = new TreeBoxNode( this.files_TreeBox );
      node.setText( 0, engine.inputFiles[i] );
   }

   this.filesAdd_Button = new PushButton( this );
   this.filesAdd_Button.text = "Add";
   this.filesAdd_Button.icon = this.scaledResource( ":/icons/add.png" );
   this.filesAdd_Button.toolTip = "<p>Add image files to the input images list.</p>";
   this.filesAdd_Button.onClick = function()
   {
      var ofd = new OpenFileDialog;
      ofd.multipleSelections = true;
      ofd.caption = "Select Images";
      ofd.loadImageFilters();

      if ( ofd.execute() )
      {
         this.dialog.files_TreeBox.canUpdate = false;
         for ( var i = 0; i < ofd.fileNames.length; ++i )
         {
            var node = new TreeBoxNode( this.dialog.files_TreeBox );
            node.setText( 0, ofd.fileNames[i] );
            engine.inputFiles.push( ofd.fileNames[i] );
         }
         this.dialog.files_TreeBox.canUpdate = true;
      }
   };

   this.filesClear_Button = new PushButton( this );
   this.filesClear_Button.text = "Clear";
   this.filesClear_Button.icon = this.scaledResource( ":/icons/clear.png" );
   this.filesClear_Button.toolTip = "<p>Clear the list of input images.</p>";
   this.filesClear_Button.onClick = function()
   {
      this.dialog.files_TreeBox.clear();
      engine.inputFiles.length = 0;
   };

   this.filesInvert_Button = new PushButton( this );
   this.filesInvert_Button.text = "Invert Selection";
   this.filesInvert_Button.icon = this.scaledResource( ":/icons/select-invert.png" );
   this.filesInvert_Button.toolTip = "<p>Invert the current selection of input images.</p>";
   this.filesInvert_Button.onClick = function()
   {
      for ( var i = 0; i < this.dialog.files_TreeBox.numberOfChildren; ++i )
         this.dialog.files_TreeBox.child( i ).selected =
               !this.dialog.files_TreeBox.child( i ).selected;
   };

   this.filesRemove_Button = new PushButton( this );
   this.filesRemove_Button.text = "Remove Selected";
   this.filesRemove_Button.icon = this.scaledResource( ":/icons/delete.png" );
   this.filesRemove_Button.toolTip = "<p>Remove all selected images from the input images list.</p>";
   this.filesRemove_Button.onClick = function()
   {
      engine.inputFiles.length = 0;
      for ( var i = 0; i < this.dialog.files_TreeBox.numberOfChildren; ++i )
         if ( !this.dialog.files_TreeBox.child( i ).selected )
            engine.inputFiles.push( this.dialog.files_TreeBox.child( i ).text( 0 ) );
      for ( var i = this.dialog.files_TreeBox.numberOfChildren; --i >= 0; )
         if ( this.dialog.files_TreeBox.child( i ).selected )
            this.dialog.files_TreeBox.remove( i );
   };

   this.filesButtons_Sizer = new HorizontalSizer;
   this.filesButtons_Sizer.spacing = 4;
   this.filesButtons_Sizer.add( this.filesAdd_Button );
   this.filesButtons_Sizer.addStretch();
   this.filesButtons_Sizer.add( this.filesClear_Button );
   this.filesButtons_Sizer.addStretch();
   this.filesButtons_Sizer.add( this.filesInvert_Button );
   this.filesButtons_Sizer.add( this.filesRemove_Button );

   this.files_GroupBox = new GroupBox( this );
   this.files_GroupBox.title = "Input Images";
   this.files_GroupBox.sizer = new VerticalSizer;
   this.files_GroupBox.sizer.margin = 6;
   this.files_GroupBox.sizer.spacing = 4;
   this.files_GroupBox.sizer.add( this.files_TreeBox, this.textEditWidth );
   this.files_GroupBox.sizer.add( this.filesButtons_Sizer );

   // Reference image
   this.referenceImageLabel = new Label( this );
   with (this.referenceImageLabel) {
      text = "Reference image:";
      minWidth = labelWidth1;
      textAlignment = TextAlign_Right|TextAlign_VertCenter;
      }

   this.referenceImageEdit = new Edit( this );
   this.referenceImageEdit.minWidth = this.textEditWidth;
   this.referenceImageEdit.text = engine.referenceImage;
   this.referenceImageEdit.toolTip = "<p>Reference image for linear fitting.</p>";
   this.referenceImageEdit.onEditCompleted = function()
   {
      engine.referenceImage = this.text = File.windowsPathToUnix( this.text.trim() );
   };

   this.referenceImageSelectButton = new ToolButton( this );
   this.referenceImageSelectButton.icon = this.scaledResource( ":/icons/select-file.png" );
   this.referenceImageSelectButton.setScaledFixedSize( 20, 20 );
   this.referenceImageSelectButton.toolTip = "<p>Select the linear fit reference image file.</p>";
   this.referenceImageSelectButton.onClick = function()
   {
      var ofd = new OpenFileDialog;
      ofd.multipleSelections = false;
      ofd.caption = "Select linear fit reference image";
      ofd.loadImageFilters();
      if ( ofd.execute() )
      {
         this.dialog.referenceImageEdit.text = engine.referenceImage = ofd.fileName;
      }
   };

   this.referenceImageSizer = new HorizontalSizer;
   this.referenceImageSizer.add( this.referenceImageLabel );
   this.referenceImageSizer.addSpacing( 4 );
   this.referenceImageSizer.add( this.referenceImageEdit, this.textEditWidth );
   this.referenceImageSizer.addSpacing( 2 );
   this.referenceImageSizer.add( this.referenceImageSelectButton );



   // Fit parameters
   this.rejectLowLabel = new Label( this );
   with (this.rejectLowLabel) {
      text = "Reject low:";
      minWidth = labelWidth1;
      textAlignment = TextAlign_Right|TextAlign_VertCenter;
      }

   this.rejectLowEdit = new NumericControl( this );
   with (this.rejectLowEdit)
      {
         sizer.remove(label);
         label = null;
         setRange(0,1.0);
         slider.setRange(0,1000);
         slider.scaledMinWidth = 50;
         setPrecision = 6;
         setValue(engine.rejectLow);
         toolTip = "Low rejection limit. All image values less than or equal to this value are ignored when calculating the linear fit.";
         onValueUpdated = function (value) { engine.rejectLow = value; return;}
      }
   this.rejectLowSizer = new HorizontalSizer;
   with (this.rejectLowSizer) {
      spacing = 4;
      add( this.rejectLowLabel );
      add( this.rejectLowEdit );
      }

   this.rejectHighLabel = new Label( this );
   with (this.rejectHighLabel) {
      text = "Reject high:";
      minWidth = labelWidth1;
      textAlignment = TextAlign_Right|TextAlign_VertCenter;
      }

   this.rejectHighEdit = new NumericControl( this );
   with (this.rejectHighEdit)
      {
         sizer.remove(label);
         label = null;
         setRange(0,1.0);
         slider.setRange(0,1000);
         slider.scaledMinWidth = 50;
         setPrecision = 6;
         setValue(engine.rejectHigh);
         toolTip = "High rejection limit. All image values greater than or equal to this value are ignored when calculating the linear fit.";
         onValueUpdated = function (value) { engine.rejectHigh = value; return;}
      }
   this.rejectHighSizer = new HorizontalSizer;
   with (this.rejectHighSizer) {
      spacing = 4;
      add( this.rejectHighLabel );
      add( this.rejectHighEdit );
      }

   this.showImages_CheckBox = new CheckBox( this );
   this.showImages_CheckBox.text = "Show images while processing";
   this.showImages_CheckBox.checked = engine.showImages;
   this.showImages_CheckBox.toolTip =
      "<p>Provide visual feedback by showing current image.</p>";
   this.showImages_CheckBox.onClick = function( checked )
   {
      engine.showImages = checked;
   };

   this.showImages_Sizer = new HorizontalSizer;
   this.showImages_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.showImages_Sizer.add( this.showImages_CheckBox );
   this.showImages_Sizer.addStretch();

   this.linearFit_GroupBox = new GroupBox( this );
   with ( this.linearFit_GroupBox ) {
      title = "Linear fit parameters";
      sizer =  new VerticalSizer ;
      sizer.margin = 6;
      sizer.spacing = 4;
      sizer.add ( this.referenceImageSizer );
      sizer.add ( this.rejectLowSizer );
      sizer.add ( this.rejectHighSizer );
      sizer.add ( this.showImages_Sizer );
   }

   // Output

   this.outputDir_Edit = new Edit( this );
   this.outputDir_Edit.readOnly = true;
   this.outputDir_Edit.text = engine.outputDirectory;
   this.outputDir_Edit.toolTip =
      "<p>If specified, all converted images will be written to the output directory.</p>" +
      "<p>If not specified, converted images will be written to the same directories " +
      "of their corresponding input images.</p>";

   this.outputDirSelect_Button = new ToolButton( this );
   this.outputDirSelect_Button.icon = this.scaledResource( ":/browser/select-file.png" );
   this.outputDirSelect_Button.setScaledFixedSize( 20, 20 );
   this.outputDirSelect_Button.toolTip = "<p>Select the output directory.</p>";
   this.outputDirSelect_Button.onClick = function()
   {
      var gdd = new GetDirectoryDialog;
      gdd.initialPath = engine.outputDirectory;
      gdd.caption = "Select Output Directory";

      if ( gdd.execute() )
      {
         engine.outputDirectory = gdd.directory;
         this.dialog.outputDir_Edit.text = engine.outputDirectory;
      }
   };

   this.outputDir_Label = new Label( this );
   this.outputDir_Label.text = "Output Directory:";
   this.outputDir_Label.minWidth = labelWidth1;
   this.outputDir_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.outputDir_Sizer = new HorizontalSizer;
   this.outputDir_Sizer.spacing = 4;
   this.outputDir_Sizer.add( this.outputDir_Label );
   this.outputDir_Sizer.add( this.outputDir_Edit, this.textEditWidth );
   this.outputDir_Sizer.add( this.outputDirSelect_Button );

   this.outputPrefix_Label = new Label (this);
   this.outputPrefix_Label.text = "Prefix:";
   this.outputPrefix_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.outputPrefix_Edit = new Edit( this );
   this.outputPrefix_Edit.text = engine.outputPrefix;
   this.outputPrefix_Edit.setFixedWidth( this.font.width( "MMMMMM" ) );
   this.outputPrefix_Edit.toolTip = "";
   this.outputPrefix_Edit.onEditCompleted = function()
   {
      engine.outputPrefix = this.text;
   };

   this.outputPostfix_Label = new Label (this);
   this.outputPostfix_Label.text = "Postfix:";
   this.outputPostfix_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.outputPostfix_Edit = new Edit( this );
   this.outputPostfix_Edit.text = engine.outputPostfix;
   this.outputPostfix_Edit.setFixedWidth( this.font.width( "MMMMMM" ) );
   this.outputPostfix_Edit.toolTip = "";
   this.outputPostfix_Edit.onEditCompleted = function()
   {
      engine.outputPostfix = this.text;
   };

   var outExtToolTip = "<p>Specify a file extension to identify the output file format.</p>" +
      "<p>Be sure the selected output format is able to write images, or the batch linear fit " +
      "process will fail upon attempting to write the first output image.</p>";

   this.outputExt_Label = new Label( this );
   this.outputExt_Label.text = "Output extension:";
   this.outputExt_Label.minWidth = labelWidth1;
   this.outputExt_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.outputExt_Label.toolTip = outExtToolTip;

   this.outputExt_Edit = new Edit( this );
   this.outputExt_Edit.text = engine.outputExtension;
   this.outputExt_Edit.setFixedWidth( this.font.width( "MMMMMM" ) );
   this.outputExt_Edit.toolTip = outExtToolTip;
   this.outputExt_Edit.onEditCompleted = function()
   {
      // Image extensions are always lowercase in PI/PCL.
      var ext = this.text.trim().toLowerCase();

      // Use the default extension if empty.
      // Ensure that ext begins with a dot character.
      if ( ext.length == 0 || ext == '.' )
         ext = DEFAULT_OUTPUT_EXTENSION;
      else if ( !ext.startsWith( '.' ) )
         ext = '.' + ext;

      this.text = engine.outputExtension = ext;
   };

   this.options_Sizer = new HorizontalSizer;
   this.options_Sizer.spacing = 4;
   this.options_Sizer.add( this.outputExt_Label );
   this.options_Sizer.add( this.outputExt_Edit );
   this.options_Sizer.addSpacing( 8 );
   this.options_Sizer.add( this.outputPrefix_Label );
   this.options_Sizer.add( this.outputPrefix_Edit );
   this.options_Sizer.addSpacing( 8 );
   this.options_Sizer.add( this.outputPostfix_Label );
   this.options_Sizer.add( this.outputPostfix_Edit );
   this.options_Sizer.addStretch();

   //

   this.overwriteExisting_CheckBox = new CheckBox( this );
   this.overwriteExisting_CheckBox.text = "Overwrite existing files";
   this.overwriteExisting_CheckBox.checked = engine.overwriteExisting;
   this.overwriteExisting_CheckBox.toolTip =
      "<p>Allow overwriting of existing image files.</p>" +
      "<p><b>* Warning *</b> This option may lead to irreversible data loss - enable it at your own risk.</p>";
   this.overwriteExisting_CheckBox.onClick = function( checked )
   {
      engine.overwriteExisting = checked;
   };

   this.overwriteExisting_Sizer = new HorizontalSizer;
   this.overwriteExisting_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.overwriteExisting_Sizer.add( this.overwriteExisting_CheckBox );
   this.overwriteExisting_Sizer.addStretch();

   //

   this.outputOptions_GroupBox = new GroupBox( this );
   this.outputOptions_GroupBox.title = "Output File Options";
   this.outputOptions_GroupBox.sizer = new VerticalSizer;
   this.outputOptions_GroupBox.sizer.margin = 6;
   this.outputOptions_GroupBox.sizer.spacing = 4;
   this.outputOptions_GroupBox.sizer.add( this.options_Sizer );
   this.outputOptions_GroupBox.sizer.add( this.overwriteExisting_Sizer );
   this.outputOptions_GroupBox.sizer.add( this.outputDir_Sizer );

   //

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

   //

   this.sizer = new VerticalSizer;
   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add( this.helpLabel );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.files_GroupBox, 100 );
   this.sizer.add( this.linearFit_GroupBox );
   this.sizer.add( this.outputOptions_GroupBox );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = TITLE + " Script";
   this.userResizable = true;
   this.adjustToContents();
}

// Our dialog inherits all properties and methods from the core Dialog object.
BatchLinearFitDialog.prototype = new Dialog;

/*
 * Script entry point.
 */
function main()
{
   console.hide();

   // Show our dialog box, quit if cancelled.
   var dialog = new BatchLinearFitDialog();
   for ( ;; )
   {
      if ( dialog.execute() )
      {
         if ( engine.inputFiles.length == 0 )
         {
            (new MessageBox( "No input files have been specified!", TITLE, StdIcon_Error, StdButton_Ok )).execute();
            continue;
         }

#ifneq WARN_ON_NO_OUTPUT_DIRECTORY 0
         if ( engine.outputDirectory.length == 0 )
            if ( (new MessageBox( "<p>No output directory has been specified.</p>" +
                                  "<p>Each fitted image will be written to the directory of " +
                                  "its corresponding input file.<br>" +
                                  "<b>Are you sure?</b></p>",
                                  TITLE, StdIcon_Warning, StdButton_Yes, StdButton_No )).execute() != StdButton_Yes )
               continue;
#endif
         // Perform batch file format conversion and quit.
         console.show();
         console.abortEnabled = true;
         engine.linearFitFiles();

         if ( (new MessageBox( "Do you want to perform another linear fit batch?",
                               TITLE, StdIcon_Question, StdButton_Yes, StdButton_No )).execute() == StdButton_Yes )
            continue;
      }

      break;
   }
}

main();

// ----------------------------------------------------------------------------
// EOF BatchLinearFit.js - Released 2015/07/22 16:24:26 UTC
