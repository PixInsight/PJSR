// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// BatchFormatConversion.js - Released 2013/07/30 20:16:05 UTC
// ****************************************************************************
//
// This file is part of BatchFormatConversion Script version 1.3.1
//
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
// ****************************************************************************

/*
 * BatchFormatConversion v1.3.1
 *
 * A batch image format conversion utility.
 *
 * This script allows you to define a set of input image files, an optional
 * output directory, and output file and sample formats. The script then
 * iterates reading each input file, converting it to the selected sample
 * format if necessary, and saving it on the output directory with the
 * specified output file format.
 *
 * Copyright (C) 2009-2013 Pleiades Astrophoto S.L.
 * Written by Juan Conejero (PTeam)
 *
 * Thanks to Rob Pfile for encouraging us to add the format hints feature, and
 * for helping us to find bugs in FileFormat and other related PJSR objects.
 */

#feature-id    Batch Processing > BatchFormatConversion

#feature-info  A batch image format conversion utility.<br/>\
   <br/> \
   This script allows you to define a set of input image files, an optional output \
   directory, and output file and sample formats. The script then iterates reading \
   each input file, converting it to the selected sample format if necessary, and \
   saving it on the output directory with the specified output file format.<br>\
   <br>\
   This script is very useful when you have to convert several images &mdash;no \
   matter if dozens or hundreds&mdash; from one format to another automatically. \
   It saves you the work of opening and saving each file manually one at a time.<br/>\
   <br/> \
   Written by Juan Conejero (PTeam)<br/>\
   Copyright &copy; 2009-2013 Pleiades Astrophoto S.L.<br/>\
   <br/>\
   Thanks to Rob Pfile for encouraging us to add the format hints feature, and for \
   helping us to find bugs in FileFormat and other related PJSR objects.

#feature-icon  BatchFormatConversion.xpm

#include <pjsr/ColorSpace.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/SampleType.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/TextAlign.jsh>

#define DEFAULT_INPUT_HINTS      "raw cfa"
#define DEFAULT_OUTPUT_HINTS     "up-bottom unsigned"
#define DEFAULT_OUTPUT_EXTENSION ".fit"

#define WARN_ON_NO_OUTPUT_DIRECTORY 1

#define VERSION "1.3.1"
#define TITLE   "BatchFormatConversion"

/*
 * Batch Format Conversion engine
 */
function BatchFormatConversionEngine()
{
   this.inputFiles = new Array;
   this.outputDirectory = "";
   this.outputExtension = DEFAULT_OUTPUT_EXTENSION;
   this.inputHints = DEFAULT_INPUT_HINTS;
   this.outputHints = DEFAULT_OUTPUT_HINTS;
   this.bitsPerSample = 0; // same as input file
   this.floatSample = false;
   this.overwriteExisting = false;
   this.outputFormat = null;

   function FileData( image, description, instance, outputFormat )
   {
      this.image = image;
      this.description = description;
      this.filePath = instance.filePath;

      if ( outputFormat.canStoreICCProfiles && instance.format.canStoreICCProfiles )
         this.iccProfile = instance.iccProfile;
      else
         this.iccProfile = undefined;

      if ( outputFormat.canStoreKeywords && instance.format.canStoreKeywords )
         this.keywords = instance.keywords;
      else
         this.keywords = undefined;

      if ( outputFormat.canStoreMetadata && instance.format.canStoreMetadata )
         this.metadata = instance.metadata;
      else
         this.metadata = undefined;

      if ( outputFormat.canStoreThumbnails && instance.format.canStoreThumbnails )
         this.thumbnail = instance.thumbnail;
      else
         this.thumbnail = undefined;
   };

   this.readImage = function( filePath )
   {
      var suffix = File.extractExtension( filePath ).toLowerCase();
      var F = new FileFormat( suffix, true/*toRead*/, false/*toWrite*/ );
      if ( F.isNull )
         throw new Error( "No installed file format can read \'" + suffix + "\' files." );

      var f = new FileFormatInstance( F );
      if ( f.isNull )
         throw new Error( "Unable to instantiate file format: " + F.name );

      var d = f.open( filePath, this.inputHints );
      if ( d.length < 1 )
         throw new Error( "Unable to open file: " + filePath );
      if ( d.length > 1 )
         throw new Error( "Multi-image files are not supported by this script: " + filePath );

      var bitsPerSample = (this.bitsPerSample > 0) ? this.bitsPerSample : d[0].bitsPerSample;
      var floatSample = (this.bitsPerSample > 0) ? this.floatSample : d[0].ieeefpSampleFormat;
      var image = new Image( 1, 1, 1, ColorSpace_Gray, bitsPerSample, floatSample ? SampleType_Real : SampleType_Integer );
      if ( !f.readImage( image ) )
         throw new Error( "Unable to read file: " + filePath );

      var data = new FileData( image, d[0], f, this.outputFormat );

      f.close();

      return data;
   };

   this.writeImage = function( fileData )
   {
      var fileDir = (this.outputDirectory.length > 0) ? this.outputDirectory :
                    File.extractDrive( fileData.filePath ) + File.extractDirectory( fileData.filePath );
      if ( !fileDir.endsWith( '/' ) )
         fileDir += '/';
      var fileName = File.extractName( fileData.filePath );
      var outputFilePath = fileDir + fileName + this.outputExtension;

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

      var f = new FileFormatInstance( this.outputFormat );
      if ( f.isNull )
         throw new Error( "Unable to instantiate file format: " + this.outputFormat.name );

      if ( !f.create( outputFilePath, this.outputHints ) )
         throw new Error( "Error creating output file: " + outputFilePath );

      var d = new ImageDescription( fileData.description );
      d.bitsPerSample = fileData.image.bitsPerSample;
      d.ieeefpSampleFormat = fileData.image.isReal;
      if ( !f.setOptions( d ) )
         throw new Error( "Unable to set output file options: " + outputFilePath );

      if ( fileData.iccProfile != undefined )
         f.iccProfile = fileData.iccProfile;
      if ( fileData.keywords != undefined )
         f.keywords = fileData.keywords;
      if ( fileData.metadata != undefined )
         f.metadata = fileData.metadata;
      if ( fileData.thumbnail != undefined )
         f.thumbnail = fileData.thumbnail;

      if ( !f.writeImage( fileData.image ) )
         throw new Error( "Error writing output file: " + outputFilePath );

      f.close();

      fileData.image.free();
   };

   this.convertFiles = function()
   {
      try
      {
         this.outputFormat = new FileFormat( this.outputExtension, false/*toRead*/, true/*toWrite*/ );
         if ( this.outputFormat.isNull )
            throw new Error( "No installed file format can write \'" + this.outputExtension + "\' files." );

         var succeeded = 0;
         var errored = 0;

         for ( var i = 0; i < this.inputFiles.length; ++i )
         {
            try
            {
               console.writeln( format( "<end><cbr><br><b>Converting file %u of %u:</b>", i+1, this.inputFiles.length ) );
               console.writeln( "<raw>" + this.inputFiles[i] + "</raw>" );
               this.writeImage( this.readImage( this.inputFiles[i] ) );
               gc();
               ++succeeded;
            }
            catch ( error )
            {
               ++errored;
               if ( i+1 == this.inputFiles.length )
                  throw error;
               var errorMessage = "<p>" + error.message + ":</p>" +
                                  "<p>" + this.inputFiles[i] + "</p>" +
                                  "<p><b>Continue batch format conversion?</b></p>";
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
   };
}

var engine = new BatchFormatConversionEngine;

/*
 * Batch Format Conversion dialog
 */
function BatchFormatConversionDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   //

   var labelWidth1 = this.font.width( "Output format hints:" + 'T' );

   //

   this.helpLabel = new Label( this );
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.margin = 4;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = "<p><b>" + TITLE + " v" + VERSION + "</b> &mdash; " +
                         "A batch image format conversion utility.</p>" +
                         "<p>Copyright &copy; 2009-2013 Pleiades Astrophoto</p>";
   //

   this.files_TreeBox = new TreeBox( this );
   this.files_TreeBox.multipleSelection = true;
   this.files_TreeBox.rootDecoration = false;
   this.files_TreeBox.alternateRowColor = true;
   this.files_TreeBox.setMinSize( 500, 200 );
   this.files_TreeBox.numberOfColumns = 1;
   this.files_TreeBox.headerVisible = false;

   for ( var i = 0; i < engine.inputFiles.length; ++i )
   {
      var node = new TreeBoxNode( this.files_TreeBox );
      node.setText( 0, engine.inputFiles[i] );
   }

   this.filesAdd_Button = new PushButton( this );
   this.filesAdd_Button.text = "Add";
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
   this.filesClear_Button.toolTip = "<p>Clear the list of input images.</p>";

   this.filesClear_Button.onClick = function()
   {
      this.dialog.files_TreeBox.clear();
      engine.inputFiles.length = 0;
   };

   this.filesInvert_Button = new PushButton( this );
   this.filesInvert_Button.text = "Invert Selection";
   this.filesInvert_Button.toolTip = "<p>Invert the current selection of input images.</p>";

   this.filesInvert_Button.onClick = function()
   {
      for ( var i = 0; i < this.dialog.files_TreeBox.numberOfChildren; ++i )
         this.dialog.files_TreeBox.child( i ).selected =
               !this.dialog.files_TreeBox.child( i ).selected;
   };

   this.filesRemove_Button = new PushButton( this );
   this.filesRemove_Button.text = "Remove Selected";
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
   this.files_GroupBox.sizer.add( this.files_TreeBox, 100 );
   this.files_GroupBox.sizer.add( this.filesButtons_Sizer );

   // pfile 2011/10/16 - addition of input format hint UI elements

   var fmtHintToolTip = "<p>Format hints allow you to override global file format settings for " +
      "image files used by specific processes. In BatchFormatConversion, input hints change " +
      "the way input images of some particular file formats are read.</p>" +
      "<p>For example, you can use the \"raw\" input hint to force the DSLR_RAW format to load a pure " +
      "raw image without applying any deBayering, interpolation, white balance or black point " +
      "correction. Most standard file format modules support hints; each format supports a " +
      "number of input and/or output hints that you can use for different purposes with tools and " +
      "scripts that give you access to format hints.</p>";

   this.inputHints_Label = new Label( this );
   this.inputHints_Label.text = "Input format hints";
   this.inputHints_Label.minWidth = labelWidth1;
   this.inputHints_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.inputHints_Label.toolTip = fmtHintToolTip;

   this.inputHints_Edit = new Edit( this );
   this.inputHints_Edit.text = engine.inputHints;
   this.inputHints_Edit.toolTip = fmtHintToolTip;

   this.inputHints_Edit.onEditCompleted = function()
   {
       // Format hints are case-sensitive.
       var hint = this.text.trim();
       this.text = engine.inputHints = hint;
   };

   this.inputHints_Sizer = new HorizontalSizer;
   this.inputHints_Sizer.spacing = 4;
   this.inputHints_Sizer.add( this.inputHints_Label );
   this.inputHints_Sizer.add( this.inputHints_Edit, 100 );

   this.inputOptions_GroupBox = new GroupBox( this );
   this.inputOptions_GroupBox.title = "Input File Options";
   this.inputOptions_GroupBox.sizer = new VerticalSizer;
   this.inputOptions_GroupBox.sizer.margin = 6;
   this.inputOptions_GroupBox.sizer.spacing = 4;
   this.inputOptions_GroupBox.sizer.add( this.inputHints_Sizer );

   //

   this.outputDir_Edit = new Edit( this );
   this.outputDir_Edit.readOnly = true;
   this.outputDir_Edit.text = engine.outputDirectory;
   this.outputDir_Edit.toolTip =
      "<p>If specified, all converted images will be written to the output directory.</p>" +
      "<p>If not specified, converted images will be written to the same directories " +
      "of their corresponding input images.</p>";


   this.outputDirSelect_Button = new ToolButton( this );
   this.outputDirSelect_Button.icon = new Bitmap( ":/browser/select-file.png" );
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

   this.outputDir_GroupBox = new GroupBox( this );
   this.outputDir_GroupBox.title = "Output Directory";
   this.outputDir_GroupBox.sizer = new HorizontalSizer;
   this.outputDir_GroupBox.sizer.margin = 6;
   this.outputDir_GroupBox.sizer.spacing = 4;
   this.outputDir_GroupBox.sizer.add( this.outputDir_Edit, 100 );
   this.outputDir_GroupBox.sizer.add( this.outputDirSelect_Button );

   //

   var outExtToolTip = "<p>Specify a file extension to identify the output file format.</p>" +
      "<p>Be sure the selected output format is able to write images, or the batch conversion " +
      "process will fail upon attempting to write the first output image.</p>" +
      "<p>Also be sure that the output format can generate images with the specified output " +
      "sample format (see below), if you change the default setting.</p>";

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
   this.options_Sizer.addStretch();

   //

   var bpsToolTip = "<p>Sample format for output images.</p>" +
      "<p>Note that these settings are just a <i>hint</i>. The script will convert all " +
      "input images to the specified sample format, if necessary, but it can be ignored " +
      "by the output format if it is unable to write images with the specified bit depth " +
      "and sample type.</p>";

   this.sampleFormat_Label = new Label( this );
   this.sampleFormat_Label.text = "Sample format:";
   this.sampleFormat_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.sampleFormat_Label.minWidth = labelWidth1;
   this.sampleFormat_Label.toolTip = bpsToolTip;

   this.sampleFormat_ComboBox = new ComboBox( this );
   this.sampleFormat_ComboBox.addItem( "Same as input images" );
   this.sampleFormat_ComboBox.addItem( "8-bit integer" );
   this.sampleFormat_ComboBox.addItem( "16-bit integer" );
   this.sampleFormat_ComboBox.addItem( "32-bit integer" );
   this.sampleFormat_ComboBox.addItem( "32-bit IEEE 754 floating point" );
   this.sampleFormat_ComboBox.addItem( "64-bit IEEE 754 floating point" );
   this.sampleFormat_ComboBox.toolTip = bpsToolTip;

   this.sampleFormat_ComboBox.onItemSelected = function( index )
   {
      switch ( index )
      {
      case 0:
         engine.bitsPerSample = 0; // same as input
         break;
      case 1:
         engine.bitsPerSample = 8;
         engine.floatSample = false;
         break;
      case 2:
         engine.bitsPerSample = 16;
         engine.floatSample = false;
         break;
      case 3:
         engine.bitsPerSample = 32;
         engine.floatSample = false;
         break;
      case 4:
         engine.bitsPerSample = 32;
         engine.floatSample = true;
         break;
      case 5:
         engine.bitsPerSample = 64;
         engine.floatSample = true;
         break;
      default: // ?
         break;
      }
   };

   this.sampleFormat_Sizer = new HorizontalSizer;
   this.sampleFormat_Sizer.spacing = 4;
   this.sampleFormat_Sizer.add( this.sampleFormat_Label );
   this.sampleFormat_Sizer.add( this.sampleFormat_ComboBox );
   this.sampleFormat_Sizer.addStretch();

   //

   this.outputHints_Label = new Label( this );
   this.outputHints_Label.text = "Output format hints:";
   this.outputHints_Label.minWidth = labelWidth1;
   this.outputHints_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.outputHints_Label.toolTip = fmtHintToolTip;

   this.outputHints_Edit = new Edit( this );
   this.outputHints_Edit.text = engine.outputHints;
   this.outputHints_Edit.toolTip = fmtHintToolTip;

   this.outputHints_Edit.onEditCompleted = function()
   {
       // Format hints are case-sensitive.
       var hint = this.text.trim();
       this.text = engine.outputHints = hint;
   };

   this.outputHints_Sizer = new HorizontalSizer;
   this.outputHints_Sizer.spacing = 4;
   this.outputHints_Sizer.add( this.outputHints_Label );
   this.outputHints_Sizer.add( this.outputHints_Edit, 100 );

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
   this.overwriteExisting_Sizer.addSpacing( labelWidth1 + 4 );
   this.overwriteExisting_Sizer.add( this.overwriteExisting_CheckBox );
   this.overwriteExisting_Sizer.addStretch();

   //

   this.outputOptions_GroupBox = new GroupBox( this );
   this.outputOptions_GroupBox.title = "Output File Options";
   this.outputOptions_GroupBox.sizer = new VerticalSizer;
   this.outputOptions_GroupBox.sizer.margin = 6;
   this.outputOptions_GroupBox.sizer.spacing = 4;
   this.outputOptions_GroupBox.sizer.add( this.options_Sizer );
   this.outputOptions_GroupBox.sizer.add( this.sampleFormat_Sizer );
   this.outputOptions_GroupBox.sizer.add( this.outputHints_Sizer );
   this.outputOptions_GroupBox.sizer.add( this.overwriteExisting_Sizer );

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
   this.sizer.add( this.files_GroupBox, 100 );
   this.sizer.add( this.inputOptions_GroupBox ); // pfile 2011/10/16
   this.sizer.add( this.outputDir_GroupBox );
   this.sizer.add( this.outputOptions_GroupBox );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = TITLE + " Script";
   this.userResizable = true;
   this.adjustToContents();
}

// Our dialog inherits all properties and methods from the core Dialog object.
BatchFormatConversionDialog.prototype = new Dialog;

/*
 * Script entry point.
 */
function main()
{
   console.hide();

   // Show our dialog box, quit if cancelled.
   var dialog = new BatchFormatConversionDialog();
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
                                  "<p>Each converted image will be written to the directory of " +
                                  "its corresponding input file.<br>" +
                                  "<b>Are you sure?</b></p>",
                                  TITLE, StdIcon_Warning, StdButton_Yes, StdButton_No )).execute() != StdButton_Yes )
               continue;
#endif
         // Perform batch file format conversion and quit.
         console.show();
         console.abortEnabled = true;
         engine.convertFiles();

         if ( (new MessageBox( "Do you want to perform another format conversion?",
                               TITLE, StdIcon_Question, StdButton_Yes, StdButton_No )).execute() == StdButton_Yes )
            continue;
      }

      break;
   }
}

main();

// ****************************************************************************
// EOF BatchFormatConversion.js - Released 2013/07/30 20:16:05 UTC
