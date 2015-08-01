// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// BatchPreprocessing-engine.js - Released 2015/07/22 16:32:44 UTC
// ----------------------------------------------------------------------------
//
// This file is part of Batch Preprocessing Script version 1.41
//
// Copyright (c) 2012 Kai Wiechen
// Copyright (c) 2012-2015 Pleiades Astrophoto S.L.
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

#include <pjsr/UndoFlag.jsh>
#include <pjsr/StdDialogCode.jsh>

/*
 * Stack engine
 */

// ----------------------------------------------------------------------------

function FileItem( filePath, exposureTime )
{
   this.__base__ = Object;
   this.__base__();

   this.filePath = filePath;
   this.exposureTime = exposureTime;
   this.enabled = true;
}

FileItem.prototype = new Object;

// ----------------------------------------------------------------------------

function FrameGroup( imageType, filter, binning, exposureTime, firstItem, masterFrame )
{
   this.__base__ = Object;
   this.__base__();

   this.imageType = imageType;
   this.filter = (imageType == ImageType.BIAS || imageType == ImageType.DARK) ? "" : filter;
   this.binning = binning;
   this.exposureTime = (imageType == ImageType.BIAS) ? 0 : exposureTime;
   this.masterFrame = masterFrame;
   this.enabled = true;
   this.fileItems = new Array;

   if ( firstItem != null ) // we pass null from importParameters()
      this.fileItems.push( firstItem );

   this.sameParameters = function( imageType, filter, binning, exposureTime, exposureTolerance )
   {
      if ( this.imageType != imageType )
         return false;
      if ( this.binning != binning )
         return false;
      if ( this.imageType == ImageType.BIAS )
         return true;
      if ( this.imageType == ImageType.DARK )
         return Math.abs( this.exposureTime - exposureTime ) <= exposureTolerance;
      return this.filter == filter;
   };

   this.cleanFilterName = function()
   {
      return this.filter.replace( /[^a-zA-Z0-9\+\-_]/g, '_' ).replace( /_+/g, '_' );
   };

   // Returns an array [good:Boolean,reason:String]
   this.rejectionIsGood = function( rejection )
   {
      // Invariants
      switch ( rejection )
      {
      case ImageIntegration.prototype.NoRejection:
         return [false, "No pixel rejection algorithm has been selected"];
      case ImageIntegration.prototype.MinMax:
         return [false, "Min/Max rejection should not be used for production work"];
      case ImageIntegration.prototype.CCDClip:
         return [false, "CCD clipping rejection has been deprecated"];
      default:
         break;
      }

      // Selections dependent on the number of frames
      var n = this.fileItems.length;
      switch ( rejection )
      {
      case ImageIntegration.prototype.PercentileClip:
         if ( n > 8 )
            return [false, "Percentile clipping should only be used for small sets of eight or less images"];
         break;
      case ImageIntegration.prototype.SigmaClip:
         if ( n < 8 )
            return [false, "Sigma clipping requires at least 8 images to provide minimally reliable results; consider using percentile clipping"];
         if ( n > 15 )
            return [false, "Winsorized sigma clipping will work better than sigma clipping for sets of 15 or more images"];
         break;
      case ImageIntegration.prototype.WinsorizedSigmaClip:
         if ( n < 8 )
            return [false, "Winsorized sigma clipping requires at least 8 images to provide minimally reliable results; consider using percentile clipping"];
         break;
      case ImageIntegration.prototype.AveragedSigmaClip:
         if ( n < 8 )
            return [false, "Averaged sigma clipping requires at least 8 images to provide minimally reliable results; consider using percentile clipping"];
         if ( n > 10 )
            return [false, "Sigma clipping or Winsorized sigma clipping will work better than averaged sigma clipping for sets of 10 or more images"];
         break;
      case ImageIntegration.prototype.LinearFit:
         if ( n < 8 )
            return [false, "Linear fit clipping requires at least 15 images to provide reliable results; consider using percentile clipping"];
         if ( n < 20 )
            return [false, "Linear fit clipping may not be better than Winsorized sigma clipping for sets of less than 15-20 images"];
         break;
      default: // ?!
         break;
      }

      return [true, ""];
   };

   this.toString = function()
   {
      var a = [];
      if ( !this.filter.isEmpty() )
         a.push( "filter=\"" + this.filter + "\"" );
      a.push( "binning=" + this.binning.toString() );
      if ( this.exposureTime > 0 )
         a.push( format( "exposure=%.2fs", this.exposureTime ) );
      a.push( "length=" + this.fileItems.length.toString() );
      var s = StackEngine.imageTypeToString( this.imageType ) + " frames (";
      s += a[0];
      for ( var i = 1; i < a.length; ++i )
         s += ", " + a[i];
      s += ")";
      return s;
   };
}

FrameGroup.prototype = new Object;

// ----------------------------------------------------------------------------

function OverscanRegions()
{
   this.__base__ = Object;
   this.__base__();

   this.enabled = false;            // whether to apply this overscan correction
   this.sourceRect = new Rect( 0 ); // source overscan region
   this.targetRect = new Rect( 0 ); // image region to be corrected

   this.isValid = function()
   {
      if ( !this.enabled )
         return true;
      if ( !this.sourceRect.isNormal || !this.targetRect.isNormal )
         return false;
      if ( this.sourceRect.x0 < 0 || this.sourceRect.y0 < 0 ||
           this.targetRect.x0 < 0 || this.targetRect.y0 < 0 )
         return false;
      return true;
   };
}

OverscanRegions.prototype = new Object;

// ----------------------------------------------------------------------------

function Overscan()
{
   this.__base__ = Object;
   this.__base__();

   this.enabled = false;            // whether overscan correction is globally enabled

   this.overscan = new Array;       // four overscan source and target regions
   this.overscan.push( new OverscanRegions );
   this.overscan.push( new OverscanRegions );
   this.overscan.push( new OverscanRegions );
   this.overscan.push( new OverscanRegions );

   this.imageRect = new Rect( 0 );  // image region (i.e. the cropping rectangle)

   this.isValid = function()
   {
      if ( !this.enabled )
         return true;
      for ( var i = 0; i < 4; ++i )
         if ( !this.overscan[i].isValid() )
            return false;
      if ( !this.imageRect.isNormal )
         return false;
      if ( this.imageRect.x0 < 0 || this.imageRect.y0 < 0 )
         return false;
      return true;
   };

   this.hasOverscanRegions = function()
   {
      for ( var i = 0; i < 4; ++i )
         if ( this.overscan[i].enabled )
            return true;
      return false;
   };
}

Overscan.prototype = new Object;

// ----------------------------------------------------------------------------

function StackEngine()
{
   this.__base__ = Object;
   this.__base__();

   this.diagnosticMessages = new Array;

   this.frameGroups = new Array;

   // General options
   this.outputSuffix = ".xisf";
   this.outputDirectory = "";
   this.cfaImages = false;
   this.upBottomFITS = true;
   this.exportCalibrationFiles = true;
   this.generateRejectionMaps = true;
   this.useAsMaster = new Array( 3 );

   // Calibration parameters
   this.optimizeDarks = true;
   this.darkOptimizationThreshold = 0;
   this.darkOptimizationWindow = 1024;
   this.darkExposureTolerance = 10; // in seconds
   this.overscan = new Overscan;
   this.evaluateNoise = true;

   // Image integration parameters
   this.combination = new Array( 4 );
   this.rejection = new Array( 4 );
   this.minMaxLow = new Array( 4 );
   this.minMaxHigh = new Array( 4 );
   this.percentileLow = new Array( 4 );
   this.percentileHigh = new Array( 4 );
   this.sigmaLow = new Array( 4 );
   this.sigmaHigh = new Array( 4 );
   this.linearFitLow = new Array( 4 );
   this.linearFitHigh = new Array( 4 );

   // Cosmetic correction
   this.cosmeticCorrection = false;
   this.cosmeticCorrectionTemplateId = ""; // id of a CC instance

   this.calibrateOnly = false; // skip the registration and integration tasks
   this.generateDrizzleData = false; // generate .drz files in the registration task
   this.bayerDrizzle = false; // apply drizzle to CFA Bayer data instead of deBayered images

   // Debayering options (only when cfaImages=true)
   this.bayerPattern = Debayer.prototype.RGGB;
   this.debayerMethod = Debayer.prototype.VNG;

   // Registration parameters
   this.pixelInterpolation = StarAlignment.prototype.Auto;
   this.clampingThreshold = 0.3;
   this.maxStars = 500;
   this.noiseReductionFilterRadius = 0;
   this.useTriangleSimilarity = true;
   this.referenceImage = "";   // registration reference image / CSV star list

   // Light integration parameters
   this.integrate = true;
}

StackEngine.prototype = new Object;

var engine = new StackEngine;

// ----------------------------------------------------------------------------
// StackEngine Methods
// ----------------------------------------------------------------------------

StackEngine.imageTypeFromKeyword = function( value )
{
   switch ( value.toLowerCase() )
   {
   case "bias frame":
   case "bias":
   case "master bias":
      return ImageType.BIAS;
   case "dark frame":
   case "dark":
   case "master dark":
      return ImageType.DARK;
   case "flat field":
   case "flat frame":
   case "flat":
   case "master flat":
      return ImageType.FLAT;
   case "light frame":
   case "light":
   case "science frame":
   case "science":
   case "master light":
      return ImageType.LIGHT;
   default:
      return ImageType.UNKNOWN;
   }
};

StackEngine.imageTypeToString = function( imageType )
{
   return ["bias", "dark", "flat", "light"][imageType];
};

StackEngine.imageTypeToFrameKeywordValue = function( imageType )
{
   return ["Bias Frame", "Dark Frame", "Flat Field", "Light Frame"][imageType];
};

StackEngine.imageTypeToMasterKeywordValue = function( imageType )
{
   return ["Master Bias", "Master Dark", "Master Flat", "Master Light"][imageType];
};

function DiagnosticInformationDialog( messages, cancelButton )
{
   this.__base__ = Dialog;
   this.__base__();

   var info = "";
   for ( var i = 0; i < messages.length; ++i )
      info += messages[i] + '\n\n';

   this.infoLabel = new Label( this );
   this.infoLabel.text = format( "%d message(s):", messages.length );

   this.infoBox = new TextBox( this );
   this.infoBox.readOnly = true;
   this.infoBox.styleSheet = this.scaledStyleSheet( "QWidget { font-family: DejaVu Sans Mono, monospace; font-size: 10pt; }" );
   this.infoBox.setScaledMinSize( 800, 300 );
   this.infoBox.text = info;

   this.okButton = new PushButton( this );
   this.okButton.defaultButton = true;
   this.okButton.text = cancelButton ? "Continue" : "OK";
   this.okButton.icon = this.scaledResource( ":/icons/ok.png" );
   this.okButton.onClick = function()
   {
      this.dialog.ok();
   };

   if ( cancelButton )
   {
      this.cancelButton = new PushButton( this );
      this.cancelButton.defaultButton = true;
      this.cancelButton.text = "Cancel";
      this.cancelButton.icon = this.scaledResource( ":/icons/cancel.png" );
      this.cancelButton.onClick = function()
      {
         this.dialog.cancel();
      };
   }

   this.buttonsSizer = new HorizontalSizer;
   this.buttonsSizer.addStretch();
   this.buttonsSizer.add( this.okButton );
   if ( cancelButton )
   {
      this.buttonsSizer.addSpacing( 8 );
      this.buttonsSizer.add( this.cancelButton );
   }

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.add( this.infoLabel );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.infoBox );
   this.sizer.addSpacing( 8 );
   this.sizer.add( this.buttonsSizer );

   this.adjustToContents();
   this.setMinSize();

   this.windowTitle = "Diagnostic Messages";
}

DiagnosticInformationDialog.prototype = new Dialog;

StackEngine.prototype.hasDiagnosticMessages = function()
{
   return this.diagnosticMessages.length > 0;
};

StackEngine.prototype.hasErrorMessages = function()
{
   for ( var i = 0; i < this.diagnosticMessages.length; ++i )
      if ( this.diagnosticMessages[i].beginsWith( "*** Error" ) )
         return true;
   return false;
};

StackEngine.prototype.showDiagnosticMessages = function( cancelButton )
{
   if ( this.hasDiagnosticMessages() )
   {
      if ( this.hasErrorMessages() )
      {
         (new DiagnosticInformationDialog( this.diagnosticMessages, false/*cancelButton*/ )).execute();
         return StdDialogCode_Cancel;
      }

      return (new DiagnosticInformationDialog( this.diagnosticMessages, cancelButton )).execute();
   }

   (new MessageBox( "There are no errors.", TITLE + " " + VERSION, StdIcon_Information, StdButton_Ok )).execute();
   return StdDialogCode_Ok;
};

StackEngine.prototype.clearDiagnosticMessages = function()
{
   this.diagnosticMessages = new Array;
};

function IntegrationWarningDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   this.infoLabel = new Label( this );
   this.infoLabel.scaledMinWidth = 550;
   this.infoLabel.useRichText = true;
   this.infoLabel.wordWrapping = true;
   this.infoLabel.styleSheet = this.scaledStyleSheet( "QWidget { font-size: 10pt; }" );
   this.infoLabel.text =
      "<p>You have selected to perform an integration of light frames with this script.</p>"
   +  "<p>Please keep in mind that the light frames integration functionality of this script is just "
   +  "a convenience feature, which we have included to let you take a quick look at the final "
   +  "image. It will give you an idea of the achievable image, but in general, it will <i>not</i> "
   +  "provide an optimal result. In most cases the integrated result of this script will be "
   +  "rather poor, compared with the image that can be achieved by optimizing image integration "
   +  "parameters.</p>"
   +  "<p>Image integration is a critical task that requires fine-tuning. Our ImageIntegration tool "
   +  "allows you to find optimal pixel rejection parameters to maximize signal-to-noise ratio with "
   +  "the appropriate rejection of spurious image data. In general, this requires some trial-error "
   +  "work that can't be done automatically from this script.</p>";

   this.noMoreCheckBox = new CheckBox( this );
   this.noMoreCheckBox.text = "Got it, don't show this anymore.";

   this.okButton = new PushButton( this );
   this.okButton.defaultButton = true;
   this.okButton.text = "Continue";
   this.okButton.icon = this.scaledResource( ":/icons/ok.png" );
   this.okButton.onClick = function()
   {
      this.dialog.ok();
   };

   this.cancelButton = new PushButton( this );
   this.cancelButton.defaultButton = true;
   this.cancelButton.text = "Cancel";
   this.cancelButton.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancelButton.onClick = function()
   {
      this.dialog.cancel();
   };

   this.buttonsSizer = new HorizontalSizer;
   this.buttonsSizer.add( this.noMoreCheckBox );
   this.buttonsSizer.addSpacing( 40 );
   this.buttonsSizer.addStretch();
   this.buttonsSizer.add( this.okButton );
   this.buttonsSizer.addSpacing( 8 );
   this.buttonsSizer.add( this.cancelButton );

   this.sizer = new VerticalSizer;
   this.sizer.margin = 16;
   this.sizer.add( this.infoLabel );
   this.sizer.addSpacing( 32 );
   this.sizer.add( this.buttonsSizer );

   this.adjustToContents();
   this.setMinSize();

   this.windowTitle = "Light Frames Integration Warning";
}

IntegrationWarningDialog.prototype = new Dialog;

StackEngine.prototype.showIntegrationWarning = function()
{
   var show = Settings.read( SETTINGS_KEY_BASE + "showIntegrationWarning", DataType_Boolean );
   if ( show == null )
      show = true;
   if ( show )
   {
      var d = new IntegrationWarningDialog;
      var result = d.execute();
      if ( d.noMoreCheckBox.checked )
         Settings.write( SETTINGS_KEY_BASE + "showIntegrationWarning", DataType_Boolean, false );
      return result;
   }
   return true;
};

StackEngine.prototype.findGroup = function( imageType, filter, binning, exposureTime )
{
   for ( var i = 0; i < this.frameGroups.length; ++i )
      if ( this.frameGroups[i].sameParameters( imageType, filter, binning, exposureTime, this.darkExposureTolerance ) )
         return i;
   return -1;
};

StackEngine.prototype.addGroup = function( imageType, filter, binning, exposureTime, fileItem, masterFrame )
{
   this.frameGroups.push( new FrameGroup( imageType, filter, binning, exposureTime, fileItem, masterFrame ) );
};

StackEngine.prototype.checkFile = function( filePath )
{
   try
   {
      if ( filePath.isEmpty() )
         throw new Error( "Empty file path" );

      if ( !File.exists( filePath ) )
         throw new Error( "No such file: " + filePath );

      for ( var i = 0; i < this.frameGroups.length; ++i )
         for ( var j = 0; j < this.frameGroups[i].fileItems.length; ++j )
            if ( this.frameGroups[i].fileItems[j].filePath == filePath )
               throw new Error( "File already selected: " + filePath );

      return true;
   }
   catch ( x )
   {
      this.diagnosticMessages.push( x.message );
      return false;
   }
};

StackEngine.prototype.addFile = function( filePath, imageType, filter, binning, exposureTime )
{
   filePath = filePath.trim();

   if ( !this.checkFile( filePath ) )
      return false;

   var forcedType = imageType != undefined && imageType > ImageType.UNKNOWN;
   if ( !forcedType )
      imageType = ImageType.UNKNOWN;

   var forcedFilter = filter != undefined && filter != "?"; // ### see Add Custom Frames dialog
   if ( !forcedFilter )
      filter = "";

   var forcedBinning = binning != undefined && binning > 0;
   if ( !forcedBinning )
      binning = 1;

   var forcedExposureTime = imageType == ImageType.BIAS || exposureTime != undefined && exposureTime > 0;
   if ( !forcedExposureTime || imageType == ImageType.BIAS )
      exposureTime = 0;

   if ( !forcedType || !forcedFilter || !forcedBinning || !forcedExposureTime )
   {
      var ext = File.extractExtension( filePath ).toLowerCase();
      var F = new FileFormat( ext, true/*toRead*/, false/*toWrite*/ );
      if ( F.isNull )
         throw new Error( "No installed file format can read \'" + ext + "\' files." ); // shouldn't happen
      var f = new FileFormatInstance( F );
      if ( f.isNull )
         throw new Error( "Unable to instantiate file format: " + F.name );

      var info = f.open( filePath, "verbosity 0" ); // do not fill the console with useless messages
      if ( info.length <= 0 )
         throw new Error( "Unable to open input file: " + filePath );

      var keywords = [];
      if ( F.canStoreKeywords )
         keywords = f.keywords;

      f.close();

      for ( var i = 0; i < keywords.length; ++i )
      {
         var value = keywords[i].strippedValue.trim();
         switch ( keywords[i].name )
         {
         case "IMAGETYP":
            if ( !forcedType )
               imageType = StackEngine.imageTypeFromKeyword( value );
            break;
         case "FILTER":
         case "INSFLNAM":
            if ( !forcedFilter )
               filter = value;
            break;
         case "XBINNING":
         case "BINNING":
         case "CCDBINX":
            if ( !forcedBinning )
               binning = parseInt( value );
            break;
         case "EXPTIME":
         case "EXPOSURE":
            if ( !forcedExposureTime )
               exposureTime = parseFloat( value );
            break;
         }
      }

      if ( !forcedExposureTime )
         if ( exposureTime <= 0 )
            if ( typeof( info[0].exposure ) == "number" && info[0].exposure > 0 )
               exposureTime = info[0].exposure;
   }

   if ( imageType == ImageType.UNKNOWN )
   {
      // If the image type still is unknown, try to infer it from the file name.
      var fileName = File.extractName( filePath ).toLowerCase();
      if ( fileName.has( "bias" ) )
         imageType = ImageType.BIAS;
      else if ( fileName.has( "dark" ) )
         imageType = ImageType.DARK;
      else if ( fileName.has( "flat" ) )
         imageType = ImageType.FLAT;
      else if ( fileName.has( "light" ) )
         imageType = ImageType.LIGHT;
      else
      {
         this.diagnosticMessages.push( "Unable to determine frame type: " + filePath );
         return false;
      }
   }

   var isMaster = false;
   switch ( imageType )
   {
   case ImageType.BIAS:
   case ImageType.DARK:
   case ImageType.FLAT:
      isMaster = this.useAsMaster[imageType];
   case ImageType.LIGHT:
      break;
   default:
      throw new Error( "StackEngine.addFile(): Internal error: Invalid image type: " + imageType.toString() );
      break;
   }

   var item = new FileItem( filePath, exposureTime );

   if ( this.frameGroups.length > 0 && !isMaster )
   {
      var i = this.findGroup( imageType, filter, binning, exposureTime, this.darkExposureTolerance );
      if ( i >= 0 )
      {
         this.frameGroups[i].fileItems.push( item );
         return true;
      }
   }

   this.addGroup( imageType, filter, binning, exposureTime, item, isMaster );
   return true;
};

StackEngine.prototype.addBiasFrame = function( filePath )
{
   return this.addFile( filePath, ImageType.BIAS );
};

StackEngine.prototype.addDarkFrame = function( filePath )
{
   return this.addFile( filePath, ImageType.DARK );
};

StackEngine.prototype.addFlatFrame = function( filePath )
{
   return this.addFile( filePath, ImageType.FLAT );
};

StackEngine.prototype.addLightFrame = function( filePath )
{
   return this.addFile( filePath, ImageType.LIGHT );
};

StackEngine.prototype.hasFrames = function( imageType )
{
   for ( var i = 0; i < this.frameGroups.length; ++i )
      if ( this.frameGroups[i].imageType == imageType )
         return true;
   return false;
};

StackEngine.prototype.hasBiasFrames = function()
{
   return this.hasFrames( ImageType.BIAS );
};

StackEngine.prototype.hasDarkFrames = function()
{
   return this.hasFrames( ImageType.DARK );
};

StackEngine.prototype.hasFlatFrames = function()
{
   return this.hasFrames( ImageType.FLAT );
};

StackEngine.prototype.hasLightFrames = function()
{
   return this.hasFrames( ImageType.LIGHT );
};

StackEngine.prototype.deleteFrameSet = function( imageType )
{
   for ( var i = 0; i < this.frameGroups.length; ++i )
      if ( this.frameGroups[i].imageType == imageType )
         this.frameGroups.splice( i--, 1 );
};

StackEngine.prototype.inputHints = function()
{
   // Input format hints:
   // * XISF: fits-keywords normalize
   // * FITS: signed-is-physical up-bottom|bottom-up
   // * DSLR_RAW: raw cfa
   return "fits-keywords normalize raw cfa signed-is-physical " + (this.upBottomFITS ? "up-bottom" : "bottom-up");
};

StackEngine.prototype.outputHints = function()
{
   // Output format hints:
   // * XISF: properties fits-keywords no-compress-data block-alignment 4096 max-inline-block-size 3072 no-embedded-data no-resolution
   // * FITS: up-bottom|bottom-up
   return "properties fits-keywords no-compress-data block-alignment 4096 max-inline-block-size 3072 no-embedded-data no-resolution " +
          (this.upBottomFITS ? "up-bottom" : "bottom-up");
};

StackEngine.prototype.readImage = function( filePath )
{
   var ext = File.extractExtension( filePath );
   var F = new FileFormat( ext, true/*toRead*/, false/*toWrite*/ );
   if ( F.isNull )
      throw new Error( "No installed file format can read \'" + ext + "\' files." ); // shouldn't happen

   var f = new FileFormatInstance( F );
   if ( f.isNull )
      throw new Error( "Unable to instantiate file format: " + F.name );

   var d = f.open( filePath, this.inputHints() );
   if ( d.length < 1 )
      throw new Error( "Unable to open file: " + filePath );
   if ( d.length > 1 )
      throw new Error( "Multi-image files are not supported by this script: " + filePath );

   var window = new ImageWindow( 1, 1, 1,/*numberOfChannels*/ 32,/*bitsPerSample*/ true/*floatSample*/ );

   var view = window.mainView;
   view.beginProcess( UndoFlag_NoSwapFile );
   if ( !f.readImage( view.image ) )
      throw new Error( "Unable to read file: " + filePath );
   window.keywords = f.keywords;
   view.endProcess();

   f.close();

   return window;
};

StackEngine.prototype.writeImage = function( filePath,
               imageWindow, rejectionLowWindow, rejectionHighWindow, slopeMapWindow, imageIdentifiers )
{
   var F = new FileFormat( this.outputSuffix, false/*toRead*/, true/*toWrite*/ );
   if ( F.isNull )
      throw new Error( "No installed file format can write " + this.outputSuffix + " files." ); // shouldn't happen

   var f = new FileFormatInstance( F );
   if ( f.isNull )
      throw new Error( "Unable to instantiate file format: " + F.name );

   var hints = this.outputHints();
#iflteq __PI_BUILD__ 1123
   if ( imageIdentifiers )
      hints += " image-ids integration,rejection_low,rejection_high,slope_map"; // ### See FIXME comment below
#endif
   if ( !f.create( filePath, hints ) )
      throw new Error( "Error creating output file: " + filePath );

   var d = new ImageDescription;
   d.bitsPerSample = 32;
   d.ieeefpSampleFormat = true;
   if ( !f.setOptions( d ) )
      throw new Error( "Unable to set output file options: " + filePath );

   // ### FIXME: Core 1.8.3.x: New FileFormatInstance.setImageId() method
   //            voids the need to add HDUNAME/EXTNAME keywords and the
   //            image-ids XISF format hint above.

#ifgt __PI_BUILD__ 1123
   if ( imageIdentifiers )
      f.setImageId( "integration" );
   f.keywords = imageWindow.keywords;
#else
   if ( imageIdentifiers )
      f.keywords = imageWindow.keywords.concat(
            [new FITSKeyword( "HDUNAME", "integration", "Integrated image" )] );
   else
      f.keywords = imageWindow.keywords;
#endif
   if ( !f.writeImage( imageWindow.mainView.image ) )
      throw new Error( "Error writing output file: " + filePath );

   if ( rejectionLowWindow && !rejectionLowWindow.isNull )
   {
#ifgt __PI_BUILD__ 1123
      if ( imageIdentifiers )
         f.setImageId( "rejection_low" );
      f.keywords = rejectionLowWindow.keywords;
#else
      if ( imageIdentifiers )
         f.keywords = rejectionLowWindow.keywords.concat(
            [new FITSKeyword( "EXTNAME", "rejection_low", "Pixel rejection map: Low clipped pixels" )] );
      else
         f.keywords = rejectionLowWindow.keywords;
#endif
      if ( !f.writeImage( rejectionLowWindow.mainView.image ) )
         throw new Error( "Error writing output file (low rejection map): " + filePath );
   }

   if ( rejectionHighWindow && !rejectionHighWindow.isNull )
   {
#ifgt __PI_BUILD__ 1123
      if ( imageIdentifiers )
         f.setImageId( "rejection_high" );
      f.keywords = rejectionHighWindow.keywords;
#else
      if ( imageIdentifiers )
         f.keywords = rejectionHighWindow.keywords.concat(
            [new FITSKeyword( "EXTNAME", "rejection_high", "Pixel rejection map: High clipped pixels" )] );
      else
         f.keywords = rejectionHighWindow.keywords;
#endif
      if ( !f.writeImage( rejectionHighWindow.mainView.image ) )
         throw new Error( "Error writing output file (high rejection map): " + filePath );
   }

   if ( slopeMapWindow && !slopeMapWindow.isNull )
   {
#ifgt __PI_BUILD__ 1123
      if ( imageIdentifiers )
         f.setImageId( "slope_map" );
      f.keywords = slopeMapWindow.keywords;
#else
      if ( imageIdentifiers )
         f.keywords = slopeMapWindow.keywords.concat(
            [new FITSKeyword( "EXTNAME", "slope_map", "Pixel rejection map: Linear fit slope" )] );
      else
         f.keywords = slopeMapWindow.keywords;
#endif
      if ( !f.writeImage( slopeMapWindow.mainView.image ) )
         throw new Error( "Error writing output file (slope map): " + filePath );
   }

   f.close();
};

StackEngine.prototype.doBias = function()
{
   for ( var i = 0; i < this.frameGroups.length; ++i )
      if ( this.frameGroups[i].imageType == ImageType.BIAS && !this.frameGroups[i].masterFrame )
      {
         var masterBiasPath = this.doIntegrate( this.frameGroups[i] );
         if ( masterBiasPath.isEmpty() )
            throw new Error( "Error integrating bias frames." );
         this.frameGroups[i].masterFrame = true;
         this.frameGroups[i].fileItems.unshift( new FileItem( masterBiasPath, 0 ) );
         this.useAsMaster[ImageType.BIAS] = true;

         processEvents();
         gc();
      }
};

StackEngine.prototype.doDark = function()
{
   for ( var i = 0; i < this.frameGroups.length; ++i )
      if ( this.frameGroups[i].imageType == ImageType.DARK && !this.frameGroups[i].masterFrame )
      {
         var masterDarkPath = this.doIntegrate( this.frameGroups[i] );
         if ( masterDarkPath.isEmpty() )
            throw new Error( "Error integrating dark frames." );
         this.frameGroups[i].masterFrame = true;
         this.frameGroups[i].fileItems.unshift( new FileItem( masterDarkPath, this.frameGroups[i].exposureTime ) );
         this.useAsMaster[ImageType.DARK] = true;

         processEvents();
         gc();
      }
};

StackEngine.prototype.doFlat = function()
{
   for ( var i = 0; i < this.frameGroups.length; ++i )
      if ( this.frameGroups[i].imageType == ImageType.FLAT && !this.frameGroups[i].masterFrame )
      {
         var outputData = this.doCalibrate( this.frameGroups[i] );
         if ( outputData == null )
            throw new Error( "Error calibrating flat frames." );

         var tmpGroup = new FrameGroup( ImageType.FLAT, this.frameGroups[i].filter, this.frameGroups[i].binning, 0, null, false );
         for ( var c = 0; c < outputData.length; ++c )
         {
            var filePath = outputData[c][0]; // outputData.outputImage
            if ( !filePath.isEmpty() )
               if ( File.exists( filePath ) )
                  tmpGroup.fileItems.push( new FileItem( filePath, 0 ) );
               else
                  console.warningln( "** Warning: File does not exist after image calibration: " + filePath );
         }
         if ( tmpGroup.fileItems.length < 1 )
            throw new Error( "All calibrated flat frame files have been removed or cannot be accessed." );
         var masterFlatPath = this.doIntegrate( tmpGroup );
         if ( masterFlatPath.isEmpty() )
            throw new Error( "Error integrating flat frames." );
         this.frameGroups[i].masterFrame = true;
         this.frameGroups[i].fileItems.unshift( new FileItem( masterFlatPath, 0 ) );
         this.useAsMaster[ImageType.FLAT] = true;

         processEvents();
         gc();
      }
};

StackEngine.prototype.doLight = function()
{
   /*
    * ### NB: If the registration reference image belongs to one of the light
    *         frame lists (e.g., because it was selected by double-clicking on
    *         a tree box element):
    *
    *         1. Replace it with its calibrated/cosmetized/debayered
    *            counterpart. See also doCalibrate().
    *
    *         2. Make sure that we calibrate/cosmetize/debayer the group that
    *            contains the reference image in first place.
    */

   this.actualReferenceImage = this.referenceImage;

   var indexOfGroupWithReferenceImage = -1;
   var groupIndex = new Array;
   for ( var i = 0; i < this.frameGroups.length && indexOfGroupWithReferenceImage < 0; ++i )
      for ( var j = 0; j < this.frameGroups[i].fileItems.length; ++j )
         if ( this.frameGroups[i].fileItems[j].filePath == this.referenceImage )
         {
            indexOfGroupWithReferenceImage = i;
            groupIndex.push( i );
            break;
         }
   for ( var i = 0; i < this.frameGroups.length; ++i )
      if ( i != indexOfGroupWithReferenceImage )
         groupIndex.push( i );

   for ( var g = 0; g < groupIndex.length; ++g )
   {
      var i = groupIndex[g];
      var registerFrames = new Array;
      if ( this.frameGroups[i].imageType == ImageType.LIGHT )
      {
         var outputData = this.doCalibrate( this.frameGroups[i] )
         if ( outputData == null )
            throw new Error( "Error calibrating light frames." );

         var images = new Array;
         for ( var c = 0; c < outputData.length; ++c )
         {
            var filePath = outputData[c][0]; // outputData.outputImage
            if ( !filePath.isEmpty() )
               if ( File.exists( filePath ) )
                  images.push( filePath );
               else
                  console.warningln( "** Warning: File does not exist after image calibration: " + filePath );
         }
         if ( images.length < 1 )
            throw new Error( "All calibrated light frame files have been removed or cannot be accessed." );

         if ( this.cosmeticCorrection )
         {
            console.noteln( "<end><cbr><br>",
                            "*********************************************************************" );
            console.noteln( "* Begin cosmetic correction of light frames" );
            console.noteln( "*********************************************************************" );

            var CC = ProcessInstance.fromIcon( this.cosmeticCorrectionTemplateId );
            if ( CC == null )
               throw new Error( "No such process icon: " + this.cosmeticCorrectionTemplateId );
            if ( !(CC instanceof CosmeticCorrection) )
               throw new Error( "The specified icon does not transport an instance " +
                                 "of CosmeticCorrection: " + this.cosmeticCorrectionTemplateId );

            var cosmetizedDirectory = File.existingDirectory( this.outputDirectory + "/calibrated/light/cosmetized" );

            CC.targetFrames    = images.enableTargetFrames( 2 );
            CC.outputDir       = cosmetizedDirectory;
            CC.outputExtension = this.outputSuffix;
            CC.prefix          = "";
            CC.postfix         = "_cc";
            CC.overwrite       = true;
            CC.cfa             = this.cfaImages;

            CC.executeGlobal();

            /*
             * ### FIXME: CosmeticCorrection should provide read-only output
             * data, including the full file path of each output image.
             */
            images = new Array;
            for ( var c = 0; c < this.frameGroups[i].fileItems.length; ++c )
            {
               var filePath = this.frameGroups[i].fileItems[c].filePath;
               var ccFilePath = cosmetizedDirectory + '/'
                              + File.extractName( filePath )
                              + "_c_cc" + this.outputSuffix;
               if ( filePath == this.referenceImage )
                  this.actualReferenceImage = ccFilePath;
               images.push( ccFilePath );
            }

            console.noteln( "<end><cbr><br>",
                            "*********************************************************************" );
            console.noteln( "* End cosmetic correction of light frames" );
            console.noteln( "*********************************************************************" );
         }

         if ( this.cfaImages )
         {
            if ( this.bayerDrizzle )
            {
               console.noteln( "<end><cbr><br>",
                               "*********************************************************************" );
               console.noteln( "* Begin generation of Bayer drizzle source frames" );
               console.noteln( "*********************************************************************" );

               var P = new PixelMath;

               var Rx, Ry, Gx0, Gx1, Bx, By;
               switch ( this.bayerPattern )
               {
               // R G
               // G B
               case Debayer.prototype.RGGB:
                  Rx  = 0; Ry  = 0;
                  Gx0 = 1; Gx1 = 0;
                  Bx  = 1; By  = 1;
                  break;
               // B G
               // G R
               case Debayer.prototype.BGGR:
                  Rx  = 1; Ry  = 1;
                  Gx0 = 1; Gx1 = 0;
                  Bx  = 0; By  = 0;
                  break;
               // G R
               // B G
               case Debayer.prototype.GRBG:
                  Rx  = 1; Ry  = 0;
                  Gx0 = 0; Gx1 = 1;
                  Bx  = 0; By  = 1;
                  break;
               // G B
               // R G
               case Debayer.prototype.GBRG:
                  Rx  = 0; Ry  = 1;
                  Gx0 = 0; Gx1 = 1;
                  Bx  = 1; By  = 0;
                  break;
               }
               P.expression0 = "iif( x()%2 == " + Rx.toString() + " && y()%2 == " + Ry.toString() + ", $T, 0 )";
               P.expression1 = "iif( iif( y()%2 == 0, x()%2 == " + Gx0.toString() + ", x()%2 == " + Gx1.toString() + " ), $T, 0 )";
               P.expression2 = "iif( x()%2 == " + Bx.toString() + " && y()%2 == " + By.toString() + ", $T, 0 )";

               P.useSingleExpression = false;
               P.createNewImage = true;
               P.showNewImage = false;
               P.newImageId = "__bayer_drizzle__";
               P.newImageWidth = 0;
               P.newImageHeight = 0;
               P.newImageColorSpace = PixelMath.prototype.RGB;
               P.newImageSampleFormat = PixelMath.prototype.f32;

               var bayerDirectory = File.existingDirectory( this.outputDirectory + "/calibrated/light/bayer" );

               this.bayerDrizzleFiles = [];

               for ( var j = 0; j < images.length; ++j )
               {
                  var window = this.readImage( images[j] );
                  P.executeOn( window.mainView, false/*swapFile*/ );
                  window.forceClose();
                  processEvents();

                  window = ImageWindow.windowById( "__bayer_drizzle__" );
                  var bFilePath = bayerDirectory
                                    + '/' + File.extractName( images[j] )
                                    + "_b" + this.outputSuffix;
                  this.writeImage( bFilePath, window );
                  window.forceClose();
                  processEvents();

                  this.bayerDrizzleFiles.push( bFilePath );
               }

               console.noteln( "<end><cbr><br>",
                               "*********************************************************************" );
               console.noteln( "* End generation of Bayer drizzle source frames" );
               console.noteln( "*********************************************************************" );
            }

            console.noteln( "<end><cbr><br>",
                            "*********************************************************************" );
            console.noteln( "* Begin deBayering of light frames" );
            console.noteln( "*********************************************************************" );

            var DB = new Debayer;

            DB.bayerPattern  = this.bayerPattern;
            DB.debayerMethod = this.debayerMethod;
            DB.evaluateNoise = this.evaluateNoise;
            DB.showImages    = false;

            var debayerImages = new Array;
            var debayerDirectory = File.existingDirectory( this.outputDirectory + "/calibrated/light/debayered" );

            for ( var j = 0; j < images.length; ++j )
            {
               var window = this.readImage( images[j] );
               DB.executeOn( window.mainView, false/*swapFile*/ );
               window.forceClose();
               processEvents();

               window = ImageWindow.windowById( DB.outputImage );
               var dFilePath = debayerDirectory
                                 + '/' + File.extractName( images[j] )
                                 + "_d" + this.outputSuffix;
               this.writeImage( dFilePath, window );
               window.forceClose();
               processEvents();

               debayerImages.push( dFilePath );

               if ( images[j] == this.actualReferenceImage )
                  this.actualReferenceImage = dFilePath;

               gc();
            }

            images = debayerImages;

            console.noteln( "<end><cbr><br>",
                            "*********************************************************************" );
            console.noteln( "* End deBayering of light frames" );
            console.noteln( "*********************************************************************" );
         }

         if ( !this.calibrateOnly )
         {
            console.noteln( "<end><cbr><br>",
                            "*********************************************************************" );
            console.noteln( "* Begin registration of light frames" );
            console.noteln( "*********************************************************************" );

            var SA = new StarAlignment;

            var registerDirectory = this.outputDirectory + "/registered";
            if ( !this.frameGroups[i].filter.isEmpty() )
               registerDirectory += '/' + this.frameGroups[i].cleanFilterName();
            registerDirectory = File.existingDirectory( registerDirectory );

            SA.inputHints                 = this.inputHints();
            SA.outputHints                = this.outputHints();
            SA.referenceImage             = this.actualReferenceImage;
            SA.referenceIsFile            = true;
            SA.targets                    = images.enableTargetFrames( 3 );
            SA.outputDirectory            = registerDirectory;
            SA.generateDrizzleData        = this.generateDrizzleData;
            SA.pixelInterpolation         = this.pixelInterpolation;
            SA.clampingThreshold          = this.clampingThreshold;
            SA.maxStars                   = this.maxStars;
            SA.noiseReductionFilterRadius = this.noiseReductionFilterRadius;
            SA.useTriangles               = this.useTriangleSimilarity;
            SA.outputExtension            = this.outputSuffix;
            SA.outputPrefix               = "";
            SA.outputPostfix              = "_r";
            SA.outputSampleFormat         = StarAlignment.prototype.f32;
            SA.overwriteExistingFiles     = true;

            if ( !SA.executeGlobal() )
               throw new Error( "Error registering light frames." );

            console.noteln( "<end><cbr><br>",
                            "*********************************************************************" );
            console.noteln( "* End registration of light frames" );
            console.noteln( "*********************************************************************" );

            if ( this.cfaImages )
               if ( this.generateDrizzleData )
                  if ( this.bayerDrizzle )
                  {
                     console.noteln( "<end><cbr><br>",
                                     "*********************************************************************" );
                     console.noteln( "* Begin generation of Bayer drizzle data files" );
                     console.noteln( "*********************************************************************" );

                     var bayerDrizzleDirectory = registerDirectory + "/bayer";
                     bayerDrizzleDirectory = File.existingDirectory( bayerDrizzleDirectory );

                     for ( var c = 0; c < SA.outputData.length; ++c )
                     {
                        var filePath = SA.outputData[c][0]; // outputData.outputImage
                        if ( !filePath.isEmpty() )
                        {
                           filePath = File.changeSuffix( filePath, ".drz" );
                           if ( !File.exists( filePath ) )
                           {
                              console.warningln( "** Warning: The drizzle data file does not exist after image registration: " + filePath );
                              continue;
                           }

                           var file = new File;
                           file.openForReading( filePath );
                           var text = file.read( DataType_ByteArray, file.size ).utf8ToString();
                           file.close();

                           if ( text.indexOf( images[c] ) < 0 )
                           {
                              console.warningln( "** Warning: Invalid or corrupted drizzle data file: " + filePath );
                              continue;
                           }

                           // Replace the alignment input image with our Bayer drizzle source image.
                           text = text.replace( images[c], this.bayerDrizzleFiles[c] );

                           filePath = bayerDrizzleDirectory
                                          + '/' + File.extractName( filePath )
                                          + "_b.drz";
                           file.createForWriting( filePath );
                           file.write( ByteArray.stringToUTF8( text ) );
                           file.close();

                           console.writeln( filePath );
                        }
                     }

                     console.noteln( "<end><cbr><br>",
                                     "*********************************************************************" );
                     console.noteln( "* End generation of Bayer drizzle data files" );
                     console.noteln( "*********************************************************************" );
                  }

            if ( this.integrate )
            {
               var tmpGroup = new FrameGroup( ImageType.LIGHT, this.frameGroups[i].filter, this.frameGroups[i].binning, 0, null, false );
               for ( var c = 0; c < SA.outputData.length; ++c )
               {
                  var filePath = SA.outputData[c][0]; // outputData.outputImage
                  if ( !filePath.isEmpty() )
                     if ( File.exists( filePath ) )
                        tmpGroup.fileItems.push( new FileItem( filePath, 0 ) );
                     else
                        console.warningln( "** Warning: File does not exist after image registration: " + filePath );
               }
               if ( tmpGroup.fileItems.length < 1 )
                  throw new Error( "All registered light frame files have been removed or cannot be accessed." );
               var masterLightPath = this.doIntegrate( tmpGroup );
               if ( masterLightPath.isEmpty() )
                  throw new Error( "Error integrating light frames." );
            }
         }

         processEvents();
         gc();
      }
   }
};

StackEngine.prototype.doIntegrate = function( frameGroup )
{
   var imageType = frameGroup.imageType;
   var frameSet = new Array;
   for ( var i = 0; i < frameGroup.fileItems.length; ++i )
      frameSet.push( frameGroup.fileItems[i].filePath );
   if ( frameSet.length < 3 )
      throw new Error( "Cannot integrate less than three frames." );

   console.noteln( "<end><cbr><br>",
                   "*********************************************************************" );
   console.noteln( "* Begin integration of ", StackEngine.imageTypeToString( imageType ), " frames" );
   console.noteln( "*********************************************************************" );

   var II = new ImageIntegration;

   II.inputHints            = this.inputHints();
   II.bufferSizeMB          = 16;
   II.stackSizeMB           = 1024;
   II.images                = frameSet.enableTargetFrames( 2 );
   II.combination           = this.combination[imageType];
   II.rejection             = this.rejection[imageType];
   II.generateRejectionMaps = this.generateRejectionMaps;
   II.minMaxLow             = this.minMaxLow[imageType];
   II.minMaxHigh            = this.minMaxHigh[imageType];
   II.pcClipLow             = this.percentileLow[imageType];
   II.pcClipHigh            = this.percentileHigh[imageType];
   II.sigmaLow              = this.sigmaLow[imageType];
   II.sigmaHigh             = this.sigmaHigh[imageType];
   II.linearFitLow          = this.linearFitLow[imageType];
   II.linearFitHigh         = this.linearFitHigh[imageType]
   II.clipLow               = true;
   II.clipHigh              = true;
   II.generate64BitResult   = false;

   switch ( imageType )
   {
   case ImageType.LIGHT:
      II.normalization          = ImageIntegration.prototype.AdditiveWithScaling;
      II.rejectionNormalization = ImageIntegration.prototype.Scale;
      II.weightScale            = ImageIntegration.prototype.WeightScale_IKSS;
      break;
   case ImageType.FLAT:
      II.normalization          = ImageIntegration.prototype.Multiplicative;
      II.rejectionNormalization = ImageIntegration.prototype.EqualizeFluxes;
      II.weightScale            = ImageIntegration.prototype.WeightScale_IKSS;
      break;
   default:
      II.normalization          = ImageIntegration.prototype.NoNormalization;
      II.rejectionNormalization = ImageIntegration.prototype.NoRejectionNormalization;
      II.weightScale            = ImageIntegration.prototype.WeightScale_MAD;
      break;
   }

   switch ( imageType )
   {
   case ImageType.LIGHT:
      II.weightMode    = ImageIntegration.prototype.NoiseEvaluation;
      II.evaluateNoise = this.evaluateNoise;
      II.rangeClipLow  = true;
      II.rangeLow      = 0;
      II.rangeClipHigh = true;
      II.rangeHigh     = 0.98;
      II.useCache      = true;
      break;
   default:
      II.weightMode    = ImageIntegration.prototype.DontCare;
      II.evaluateNoise = false;
      II.rangeClipLow  = false;
      II.rangeClipHigh = false;
      II.useCache      = false;
      break;
   }

   var ok = II.executeGlobal();

   console.noteln( "<end><cbr><br>",
                   "*********************************************************************" );
   console.noteln( "* End integration of ", StackEngine.imageTypeToString( imageType ), " frames" );
   console.noteln( "*********************************************************************" );

   if ( !ok )
      return "";

   // Write master frame FITS keywords
   // Build the file name postfix

   var keywords = new Array;

   keywords.push( new FITSKeyword( "COMMENT", "", "PixInsight image preprocessing pipeline" ) );
   keywords.push( new FITSKeyword( "COMMENT", "", "Master frame generated with " + TITLE + " v" + VERSION ) );

   keywords.push( new FITSKeyword( "IMAGETYP", StackEngine.imageTypeToMasterKeywordValue( imageType ), "Type of image" ) );

   var postfix = ""

   if ( !frameGroup.filter.isEmpty() )
   {
      // Make sure the filter postfix includes only valid file name characters.
      postfix += "-FILTER_" + frameGroup.cleanFilterName();
      keywords.push( new FITSKeyword( "FILTER", frameGroup.filter, "Filter used when taking image" ) );
   }

   postfix += format( "-BINNING_%d", frameGroup.binning );

   keywords.push( new FITSKeyword( "XBINNING", format( "%d", frameGroup.binning ), "Binning factor, horizontal axis" ) );
   keywords.push( new FITSKeyword( "YBINNING", format( "%d", frameGroup.binning ), "Binning factor, vertical axis" ) );

   if ( frameGroup.exposureTime > 0 )
   {
      postfix += format( "-EXPTIME_%g", frameGroup.exposureTime );
      keywords.push( new FITSKeyword( "EXPTIME",  format( "%.2f", frameGroup.exposureTime ), "Exposure time in seconds" ) );
   }

   var window = ImageWindow.windowById( II.integrationImageId );
   window.keywords = keywords.concat( window.keywords );

   var filePath = File.existingDirectory( this.outputDirectory + "/master" );
   filePath += '/' + StackEngine.imageTypeToString( imageType ) + postfix + this.outputSuffix;

   console.noteln( "<end><cbr><br>* Writing master " + StackEngine.imageTypeToString( imageType ) + " frame:" );
   console.noteln( "<raw>" + filePath + "</raw>" );

   if ( II.generateRejectionMaps )
   {
      var rejectionLowWindow = null;
      var rejectionHighWindow = null;
      var slopeMapWindow = null;

      if ( II.clipLow )
         rejectionLowWindow = ImageWindow.windowById( II.lowRejectionMapImageId );
      if ( II.clipHigh )
         rejectionHighWindow = ImageWindow.windowById( II.highRejectionMapImageId );
      if ( II.rejection == ImageIntegration.prototype.LinearFit )
         slopeMapWindow = ImageWindow.windowById( II.slopeMapImageId );

      this.writeImage( filePath, window, rejectionLowWindow, rejectionHighWindow, slopeMapWindow, true/*imageIdentifiers*/ );

      if ( rejectionLowWindow != null && !rejectionLowWindow.isNull )
         rejectionLowWindow.forceClose();
      if ( rejectionHighWindow != null && !rejectionHighWindow.isNull )
         rejectionHighWindow.forceClose();
      if ( slopeMapWindow != null && !slopeMapWindow.isNull )
         slopeMapWindow.forceClose();
   }
   else
   {
      this.writeImage( filePath, window, null, null, null, true/*imageIdentifiers*/ );
   }

   window.forceClose();

   return filePath;
};

/*
 * If a master dark frame with EXPTIME is not present, select the best matching
 * master dark frame.
 */
StackEngine.prototype.getMasterDarkFrame = function( binning, exposureTime )
{
   // Assume no binning when binning is unknown.
   if ( binning <= 0 )
      binning = 1;

   // Ensure we get the most exposed master dark frame when the exposure time
   // is unknown. This favors scaling down dark current during optimization.
   var knownTime = exposureTime > 0;
   if ( !knownTime )
      exposureTime = 1.0e+10;

   var frame = "";
   var foundTime = 0;
   var bestSoFar = 1.0e+20;
   for ( var i = 0; i < this.frameGroups.length; ++i )
      if ( this.frameGroups[i].masterFrame )
         if ( this.frameGroups[i].imageType == ImageType.DARK )
            if ( this.frameGroups[i].binning == binning )
            {
               var d = Math.abs( this.frameGroups[i].exposureTime - exposureTime );
               if ( d < bestSoFar )
               {
                  frame = this.frameGroups[i].fileItems[0].filePath;
                  foundTime = this.frameGroups[i].exposureTime;
                  if ( d == 0 ) // exact match?
                     break;
                  bestSoFar = d;
               }
            }

   if ( foundTime > 0 )
   {
      if ( knownTime )
         console.noteln( "<end><cbr><br>* Searching for a master dark frame with exposure time = ",
                         exposureTime, "s -- best match is ", foundTime, "s" );
      else
         console.noteln( "<end><cbr><br>* Using master dark frame with exposure time = ",
                         foundTime, "s to calibrate unknown exposure time frame(s)." );
   }
   else
   {
      if ( knownTime )
         console.noteln( "<end><cbr><br>* Searching for a master dark frame with exposure time = ",
                         exposureTime, "s -- best match is a master dark frame of unknown exposure time." );
      else
         console.noteln( "<end><cbr><br>* Unknown exposure time frames and dark frame in calibration." );
   }

   return frame;
};

StackEngine.prototype.doCalibrate = function( frameGroup )
{
   var imageType = frameGroup.imageType;

   var frameset = new Array;     // frames to calibrate
   var a_exp = new Array;        // all EXPTIME values
   var referenceImageIndex = -1; // index of registration reference frame

   for ( var i = 0; i < frameGroup.fileItems.length; ++i )
   {
      var filePath = frameGroup.fileItems[i].filePath;
      if ( filePath == this.referenceImage )
         referenceImageIndex = i;
      frameset.push( filePath );
      a_exp.push( frameGroup.fileItems[i].exposureTime );
   }

   var exptime = 0;
   a_exp = a_exp.removeDuplicateElements();
   if ( a_exp.length > 0 )
      exptime = (a_exp.length > 1) ? Math.maxElem( a_exp ) : a_exp[0];

   var binning = frameGroup.binning;
   var filter = frameGroup.filter;

   console.noteln( "<end><cbr><br>",
                   "*********************************************************************" );
   console.noteln( "* Begin calibration of ", StackEngine.imageTypeToString( imageType ), " frames" );
   console.noteln( "*********************************************************************" );

   var IC = new ImageCalibration;

   IC.inputHints                = this.inputHints();
   IC.outputHints               = this.outputHints();
   IC.targetFrames              = frameset.enableTargetFrames( 2 );
   IC.masterBiasEnabled         = false;
   IC.masterDarkEnabled         = false;
   IC.masterFlatEnabled         = false;
   IC.calibrateBias             = true;   // relevant if we define overscan areas
   IC.calibrateDark             = true;   // assume the master dark includes the bias signal
   IC.calibrateFlat             = false;  // assume we have calibrated each individual flat frame
   IC.optimizeDarks             = this.optimizeDarks;
   IC.darkCFADetectionMode      = this.cfaImages ? ImageCalibration.prototype.ForceCFA : ImageCalibration.prototype.DetectCFA;
   IC.darkOptimizationThreshold = this.darkOptimizationThreshold;
   IC.darkOptimizationWindow    = this.darkOptimizationWindow;
   IC.outputExtension           = this.outputSuffix;
   IC.outputPrefix              = "";
   IC.outputPostfix             = "_c";
   IC.evaluateNoise             = this.evaluateNoise && imageType == ImageType.LIGHT && !this.cfaImages; // for CFAs, evaluate noise after debayer
   IC.outputSampleFormat        = ImageCalibration.prototype.f32;
   IC.overwriteExistingFiles    = true;
   IC.onError                   = ImageCalibration.prototype.Abort;

   if ( this.overscan.enabled )
   {
      IC.overscanEnabled = true;
      IC.overscanImageX0 = this.overscan.imageRect.x0;
      IC.overscanImageY0 = this.overscan.imageRect.y0;
      IC.overscanImageX1 = this.overscan.imageRect.x1;
      IC.overscanImageY1 = this.overscan.imageRect.y1;
      IC.overscanRegions = [ // enabled, sourceX0, sourceY0, sourceX1, sourceY1, targetX0, targetY0, targetX1, targetY1
         [false, 0, 0, 0, 0, 0, 0, 0, 0],
         [false, 0, 0, 0, 0, 0, 0, 0, 0],
         [false, 0, 0, 0, 0, 0, 0, 0, 0],
         [false, 0, 0, 0, 0, 0, 0, 0, 0]
      ];
      for ( var i = 0; i < 4; ++i )
         if ( this.overscan.overscan[i].enabled )
         {
            IC.overscanRegions[i][0] = true;
            IC.overscanRegions[i][1] = this.overscan.overscan[i].sourceRect.x0;
            IC.overscanRegions[i][2] = this.overscan.overscan[i].sourceRect.y0;
            IC.overscanRegions[i][3] = this.overscan.overscan[i].sourceRect.x1;
            IC.overscanRegions[i][4] = this.overscan.overscan[i].sourceRect.y1;
            IC.overscanRegions[i][5] = this.overscan.overscan[i].targetRect.x0;
            IC.overscanRegions[i][6] = this.overscan.overscan[i].targetRect.y0;
            IC.overscanRegions[i][7] = this.overscan.overscan[i].targetRect.x1;
            IC.overscanRegions[i][8] = this.overscan.overscan[i].targetRect.y1;
         }
   }

   for ( var i = 0; i < this.frameGroups.length; ++i )
      if ( this.frameGroups[i].masterFrame )
         if ( this.frameGroups[i].imageType == ImageType.BIAS )
            if ( this.frameGroups[i].binning == binning )
            {
               IC.masterBiasEnabled = true;
               IC.masterBiasPath = this.frameGroups[i].fileItems[0].filePath;
            }

   IC.masterDarkPath = this.getMasterDarkFrame( binning, exptime );
   IC.masterDarkEnabled = !IC.masterDarkPath.isEmpty();

   if ( imageType == ImageType.FLAT )
   {
      IC.outputDirectory = File.existingDirectory( this.outputDirectory + "/calibrated/flat" );
   }
   else if ( imageType == ImageType.LIGHT )
   {
      // Get master flat with matching parameters
      for ( var i = 0; i < this.frameGroups.length; ++i )
         if ( this.frameGroups[i].masterFrame )
            if ( this.frameGroups[i].imageType == ImageType.FLAT )
               if ( this.frameGroups[i].binning == binning && this.frameGroups[i].filter == filter )
               {
                  IC.masterFlatEnabled = true;
                  IC.masterFlatPath = this.frameGroups[i].fileItems[0].filePath;
                  break;
               }
      IC.outputDirectory = File.existingDirectory( this.outputDirectory + "/calibrated/light" );
   }

   if ( IC.masterBiasEnabled )
      console.noteln( "* Master bias: " + IC.masterBiasPath );
   if ( IC.masterDarkEnabled )
      console.noteln( "* Master dark: " + IC.masterDarkPath );
   if ( IC.masterFlatEnabled )
      console.noteln( "* Master flat: " + IC.masterFlatPath );

   var ok = IC.executeGlobal();

   console.noteln( "<end><cbr><br>",
                   "*********************************************************************" );
   console.noteln( "* End calibration of ", StackEngine.imageTypeToString( imageType ), " frames" );
   console.noteln( "*********************************************************************" );

   if ( ok )
   {
      if ( referenceImageIndex >= 0 )
         this.actualReferenceImage = IC.outputData[referenceImageIndex][0]; // outputData.filePath
      return IC.outputData;
   }

   return null;
};

StackEngine.prototype.updateMasterFrames = function( imageType )
{
   for ( var i = 0; i < this.frameGroups.length; ++i )
      if ( this.frameGroups[i].imageType == imageType )
         this.frameGroups[i].masterFrame = this.useAsMaster[imageType];
};

StackEngine.prototype.purgeRemovedElements = function()
{
   for ( var i = this.frameGroups.length; --i >= 0; )
      if ( this.frameGroups[i] == null )
         this.frameGroups.splice( i, 1 );
      else
      {
         for ( var j = this.frameGroups[i].fileItems.length; --j >= 0; )
            if ( this.frameGroups[i].fileItems[j] == null )
               this.frameGroups[i].fileItems.splice( j, 1 );
         if ( this.frameGroups[i].fileItems.length == 0 )
            this.frameGroups.splice( i, 1 );
      }
};

StackEngine.prototype.loadSettings = function()
{
   function load( key, type )
   {
      return Settings.read( SETTINGS_KEY_BASE + key, type );
   }

   function loadIndexed( key, index, type )
   {
      return load( key + '_' + index.toString(), type );
   }

   var o;
   if ( (o = load( "cfaImages",                 DataType_Boolean )) != null )
      this.cfaImages = o;
   if ( (o = load( "upBottomFITS",              DataType_Boolean )) != null )
      this.upBottomFITS = o;
   if ( (o = load( "exportCalibrationFiles",    DataType_Boolean )) != null )
      this.exportCalibrationFiles = o;
   if ( (o = load( "generateRejectionMaps",     DataType_Boolean )) != null )
      this.generateRejectionMaps = o;
   if ( (o = load( "optimizeDarks",             DataType_Boolean )) != null )
      this.optimizeDarks = o;
   if ( (o = load( "darkOptimizationThreshold", DataType_Float )) != null )
      this.darkOptimizationThreshold = o;
   if ( (o = load( "darkOptimizationWindow",    DataType_Int32 )) != null )
      this.darkOptimizationWindow = o;
   if ( (o = load( "darkExposureTolerance",     DataType_Float )) != null )
      this.darkExposureTolerance = o;
   if ( (o = load( "evaluateNoise",             DataType_Boolean )) != null )
      this.evaluateNoise = o;

   if ( (o = load( "overscanEnabled",           DataType_Boolean )) != null )
      this.overscan.enabled = o;
   for ( var i = 0; i < 4; ++i )
   {
      if ( (o = loadIndexed( "overscanRegionEnabled", i, DataType_Boolean )) != null )
         this.overscan.overscan[i].enabled = o;
      if ( (o = loadIndexed( "overscanSourceX0",      i, DataType_Int32 )) != null )
         this.overscan.overscan[i].sourceRect.x0 = o;
      if ( (o = loadIndexed( "overscanSourceY0",      i, DataType_Int32 )) != null )
         this.overscan.overscan[i].sourceRect.y0 = o;
      if ( (o = loadIndexed( "overscanSourceX1",      i, DataType_Int32 )) != null )
         this.overscan.overscan[i].sourceRect.x1 = o;
      if ( (o = loadIndexed( "overscanSourceY1",      i, DataType_Int32 )) != null )
         this.overscan.overscan[i].sourceRect.y1 = o;
      if ( (o = loadIndexed( "overscanTargetX0",      i, DataType_Int32 )) != null )
         this.overscan.overscan[i].targetRect.x0 = o;
      if ( (o = loadIndexed( "overscanTargetY0",      i, DataType_Int32 )) != null )
         this.overscan.overscan[i].targetRect.y0 = o;
      if ( (o = loadIndexed( "overscanTargetX1",      i, DataType_Int32 )) != null )
         this.overscan.overscan[i].targetRect.x1 = o;
      if ( (o = loadIndexed( "overscanTargetY1",      i, DataType_Int32 )) != null )
         this.overscan.overscan[i].targetRect.y1 = o;
   }
   if ( (o = load( "overscanImageX0",           DataType_Int32 )) != null )
      this.overscan.imageRect.x0 = o;
   if ( (o = load( "overscanImageY0",           DataType_Int32 )) != null )
      this.overscan.imageRect.y0 = o;
   if ( (o = load( "overscanImageX1",           DataType_Int32 )) != null )
      this.overscan.imageRect.x1 = o;
   if ( (o = load( "overscanImageY1",           DataType_Int32 )) != null )
      this.overscan.imageRect.y1 = o;

   for ( var i = 0; i < 4; ++i )
   {
      if ( (o = loadIndexed( "combination",    i, DataType_Int32 )) != null )
         this.combination[i] = o;
      if ( (o = loadIndexed( "rejection",      i, DataType_Int32 )) != null )
         this.rejection[i] = o;
      if ( (o = loadIndexed( "minMaxLow",      i, DataType_Int32 )) != null )
         this.minMaxLow[i] = o;
      if ( (o = loadIndexed( "minMaxHigh",     i, DataType_Int32 )) != null )
         this.minMaxHigh[i] = o;
      if ( (o = loadIndexed( "percentileLow",  i, DataType_Float )) != null )
         this.percentileLow[i] = o;
      if ( (o = loadIndexed( "percentileHigh", i, DataType_Float )) != null )
         this.percentileHigh[i] = o;
      if ( (o = loadIndexed( "sigmaLow",       i, DataType_Float )) != null )
         this.sigmaLow[i] = o;
      if ( (o = loadIndexed( "sigmaHigh",      i, DataType_Float )) != null )
         this.sigmaHigh[i] = o;
      if ( (o = loadIndexed( "linearFitLow",   i, DataType_Float )) != null )
         this.linearFitLow[i] = o;
      if ( (o = loadIndexed( "linearFitHigh",  i, DataType_Float )) != null )
         this.linearFitHigh[i] = o;
   }

   if ( (o = load( "calibrateOnly",              DataType_Boolean )) != null )
      this.calibrateOnly = o;
   if ( (o = load( "generateDrizzleData",        DataType_Boolean )) != null )
      this.generateDrizzleData = o;
   if ( (o = load( "bayerDrizzle",               DataType_Boolean )) != null )
      this.bayerDrizzle = o;
   if ( (o = load( "bayerPattern",               DataType_Int32 )) != null )
      this.bayerPattern = o;
   if ( (o = load( "debayerMethod",              DataType_Int32 )) != null )
      this.debayerMethod = o;
   if ( (o = load( "pixelInterpolation",         DataType_Int32 )) != null )
      this.pixelInterpolation = o;
   if ( (o = load( "clampingThreshold",          DataType_Float )) != null )
      this.clampingThreshold = o;
   if ( (o = load( "maxStars",                   DataType_Int32 )) != null )
      this.maxStars = o;
   if ( (o = load( "noiseReductionFilterRadius", DataType_Int32 )) != null )
      this.noiseReductionFilterRadius = o;
   if ( (o = load( "useTriangleSimilarity",      DataType_Boolean )) != null )
      this.useTriangleSimilarity = o;
   if ( (o = load( "integrate",                  DataType_Boolean )) != null )
      this.integrate = o;
};

StackEngine.prototype.saveSettings = function()
{
   function save( key, type, value )
   {
      Settings.write( SETTINGS_KEY_BASE + key, type, value );
   }

   function saveIndexed( key, index, type, value )
   {
      save( key + '_' + index.toString(), type, value );
   }

   save( "cfaImages",                 DataType_Boolean, this.cfaImages );
   save( "upBottomFITS",              DataType_Boolean, this.upBottomFITS );
   save( "exportCalibrationFiles",    DataType_Boolean, this.exportCalibrationFiles );
   save( "generateRejectionMaps",     DataType_Boolean, this.generateRejectionMaps );
   save( "optimizeDarks",             DataType_Boolean, this.optimizeDarks );
   save( "darkOptimizationThreshold", DataType_Float,   this.darkOptimizationThreshold );
   save( "darkOptimizationWindow",    DataType_Int32,   this.darkOptimizationWindow );
   save( "darkExposureTolerance",     DataType_Float,   this.darkExposureTolerance );
   save( "evaluateNoise",             DataType_Boolean, this.evaluateNoise );

   save( "overscanEnabled",           DataType_Boolean, this.overscan.enabled );
   for ( var i = 0; i < 4; ++i )
   {
      saveIndexed( "overscanRegionEnabled", i, DataType_Boolean, this.overscan.overscan[i].enabled );
      saveIndexed( "overscanSourceX0",      i, DataType_Int32,   this.overscan.overscan[i].sourceRect.x0 );
      saveIndexed( "overscanSourceY0",      i, DataType_Int32,   this.overscan.overscan[i].sourceRect.y0 );
      saveIndexed( "overscanSourceX1",      i, DataType_Int32,   this.overscan.overscan[i].sourceRect.x1 );
      saveIndexed( "overscanSourceY1",      i, DataType_Int32,   this.overscan.overscan[i].sourceRect.y1 );
      saveIndexed( "overscanTargetX0",      i, DataType_Int32,   this.overscan.overscan[i].targetRect.x0 );
      saveIndexed( "overscanTargetY0",      i, DataType_Int32,   this.overscan.overscan[i].targetRect.y0 );
      saveIndexed( "overscanTargetX1",      i, DataType_Int32,   this.overscan.overscan[i].targetRect.x1 );
      saveIndexed( "overscanTargetY1",      i, DataType_Int32,   this.overscan.overscan[i].targetRect.y1 );
   }
   save( "overscanImageX0",        DataType_Int32, this.overscan.imageRect.x0 );
   save( "overscanImageY0",        DataType_Int32, this.overscan.imageRect.y0 );
   save( "overscanImageX1",        DataType_Int32, this.overscan.imageRect.x1 );
   save( "overscanImageY1",        DataType_Int32, this.overscan.imageRect.y1 );

   for ( var i = 0; i < 4; ++i )
   {
      saveIndexed( "combination",    i, DataType_Int32, this.combination[i] );
      saveIndexed( "rejection",      i, DataType_Int32, this.rejection[i] );
      saveIndexed( "minMaxLow",      i, DataType_Int32, this.minMaxLow[i] );
      saveIndexed( "minMaxHigh",     i, DataType_Int32, this.minMaxHigh[i] );
      saveIndexed( "percentileLow",  i, DataType_Float, this.percentileLow[i] );
      saveIndexed( "percentileHigh", i, DataType_Float, this.percentileHigh[i] );
      saveIndexed( "sigmaLow",       i, DataType_Float, this.sigmaLow[i] );
      saveIndexed( "sigmaHigh",      i, DataType_Float, this.sigmaHigh[i] );
      saveIndexed( "linearFitLow",   i, DataType_Float, this.linearFitLow[i] );
      saveIndexed( "linearFitHigh",  i, DataType_Float, this.linearFitHigh[i] );
   }

   save( "calibrateOnly",              DataType_Boolean, this.calibrateOnly );
   save( "generateDrizzleData",        DataType_Boolean, this.generateDrizzleData );
   save( "bayerDrizzle",               DataType_Boolean, this.bayerDrizzle );
   save( "bayerPattern",               DataType_Int32,   this.bayerPattern );
   save( "debayerMethod",              DataType_Int32,   this.debayerMethod );
   save( "pixelInterpolation",         DataType_Int32,   this.pixelInterpolation );
   save( "clampingThreshold",          DataType_Float,   this.clampingThreshold );
   save( "maxStars",                   DataType_Int32,   this.maxStars );
   save( "noiseReductionFilterRadius", DataType_Int32,   this.noiseReductionFilterRadius );
   save( "useTriangleSimilarity",      DataType_Boolean, this.useTriangleSimilarity );
   save( "integrate",                  DataType_Boolean, this.integrate );
};

StackEngine.prototype.setDefaultParameters = function()
{
   this.outputSuffix = ".xisf";
   this.outputDirectory = "";
   this.cfaImages = false;
   this.upBottomFITS = true;
   this.exportCalibrationFiles = true;
   this.generateRejectionMaps = true;

   this.optimizeDarks = true;
   this.darkOptimizationThreshold = 0;
   this.darkOptimizationWindow = 1024;
   this.darkExposureTolerance = 10;

   this.evaluateNoise = true;

   this.overscan.enabled = false;
   for ( var i = 0; i < 4; ++i )
   {
      this.overscan.overscan[i].enabled = false;
      this.overscan.overscan[i].sourceRect.assign( 0 );
      this.overscan.overscan[i].targetRect.assign( 0 );
   }
   this.overscan.imageRect.assign( 0 );

   for ( var i = 0; i < 4; ++i )
   {
      this.useAsMaster[i] = false;
      this.combination[i] = ImageIntegration.prototype.Average;
      this.rejection[i] = ImageIntegration.prototype.WinsorizedSigmaClip;
      this.minMaxLow[i] = 1;
      this.minMaxHigh[i] = 1;
      this.percentileLow[i] = 0.2;
      this.percentileHigh[i] = 0.1;
      this.sigmaLow[i] = 4.0;
      this.sigmaHigh[i] = 3.0;
      this.linearFitLow[i] = 5.0;
      this.linearFitHigh[i] = 3.5;
   }

   this.calibrateOnly = false;
   this.generateDrizzleData = false;
   this.bayerDrizzle = false;

   this.cosmeticCorrection = false;
   this.cosmeticCorrectionTemplateId = "";

   this.bayerPattern = Debayer.prototype.RGGB;
   this.debayerMethod = Debayer.prototype.VNG;

   this.pixelInterpolation = StarAlignment.prototype.Auto;
   this.clampingThreshold = 0.3;
   this.maxStars = 500;
   this.noiseReductionFilterRadius = 0;
   this.useTriangleSimilarity = true;
   this.referenceImage = "";

   this.integrate = true;
};

StackEngine.prototype.importParameters = function()
{
   this.setDefaultParameters();
   this.loadSettings();

   this.frameGroups.length = 0;

   if ( Parameters.has( "outputSuffix" ) )
      this.outputSuffix = Parameters.getString( "outputSuffix" );

   if ( Parameters.has( "outputDirectory" ) )
      this.outputDirectory = Parameters.getString( "outputDirectory" );

   if ( Parameters.has( "cfaImages" ) )
      this.cfaImages = Parameters.getBoolean( "cfaImages" );

   if ( Parameters.has( "upBottomFITS" ) )
      this.upBottomFITS = Parameters.getBoolean( "upBottomFITS" );

   if ( Parameters.has( "exportCalibrationFiles" ) )
      this.exportCalibrationFiles = Parameters.getBoolean( "exportCalibrationFiles" );

   if ( Parameters.has( "generateRejectionMaps" ) )
      this.generateRejectionMaps = Parameters.getBoolean( "generateRejectionMaps" );

   if ( Parameters.has( "optimizeDarks" ) )
      this.optimizeDarks = Parameters.getBoolean( "optimizeDarks" );

   if ( Parameters.has( "darkOptimizationThreshold" ) )
      this.darkOptimizationThreshold = Parameters.getReal( "darkOptimizationThreshold" );

   if ( Parameters.has( "darkOptimizationWindow" ) )
      this.darkOptimizationWindow = Parameters.getInteger( "darkOptimizationWindow" );

   if ( Parameters.has( "darkExposureTolerance" ) )
      this.darkExposureTolerance = Parameters.getReal( "darkExposureTolerance" );

   if ( Parameters.has( "evaluateNoise" ) )
      this.evaluateNoise = Parameters.getBoolean( "evaluateNoise" );

   if ( Parameters.has( "overscanEnabled" ) )
      this.overscan.enabled = Parameters.getBoolean( "overscanEnabled" );

   for ( var i = 0; i < 4; ++i )
   {
      if ( Parameters.has( "overscanRegionEnabled" ) )
         this.overscan.overscan[i].enabled = Parameters.getBooleanIndexed( "overscanRegionEnabled", i );

      if ( Parameters.has( "overscanSourceX0" ) )
         this.overscan.overscan[i].sourceRect.x0 = Parameters.getIntegerIndexed( "overscanSourceX0", i );

      if ( Parameters.has( "overscanSourceY0" ) )
         this.overscan.overscan[i].sourceRect.y0 = Parameters.getIntegerIndexed( "overscanSourceY0", i );

      if ( Parameters.has( "overscanSourceX1" ) )
         this.overscan.overscan[i].sourceRect.x1 = Parameters.getIntegerIndexed( "overscanSourceX1", i );

      if ( Parameters.has( "overscanSourceY1" ) )
         this.overscan.overscan[i].sourceRect.y1 = Parameters.getIntegerIndexed( "overscanSourceY1", i );

      if ( Parameters.has( "overscanTargetX0" ) )
         this.overscan.overscan[i].targetRect.x0 = Parameters.getIntegerIndexed( "overscanTargetX0", i );

      if ( Parameters.has( "overscanTargetY0" ) )
         this.overscan.overscan[i].targetRect.y0 = Parameters.getIntegerIndexed( "overscanTargetY0", i );

      if ( Parameters.has( "overscanTargetX1" ) )
         this.overscan.overscan[i].targetRect.x1 = Parameters.getIntegerIndexed( "overscanTargetX1", i );

      if ( Parameters.has( "overscanTargetY1" ) )
         this.overscan.overscan[i].targetRect.y1 = Parameters.getIntegerIndexed( "overscanTargetY1", i );
   }

   if ( Parameters.has( "overscanImageX0" ) )
      this.overscan.imageRect.x0 = Parameters.getInteger( "overscanImageX0" );

   if ( Parameters.has( "overscanImageY0" ) )
      this.overscan.imageRect.y0 = Parameters.getInteger( "overscanImageY0" );

   if ( Parameters.has( "overscanImageX1" ) )
      this.overscan.imageRect.x1 = Parameters.getInteger( "overscanImageX1" );

   if ( Parameters.has( "overscanImageY1" ) )
      this.overscan.imageRect.y1 = Parameters.getInteger( "overscanImageY1" );

   for ( var i = 0; i < 4; ++i )
   {
      if ( Parameters.hasIndexed( "useAsMaster", i ) )
         this.useAsMaster[i] = Parameters.getBooleanIndexed( "useAsMaster", i );

      if ( Parameters.hasIndexed( "combination", i ) )
         this.combination[i] = Parameters.getIntegerIndexed( "combination", i );

      if ( Parameters.hasIndexed( "rejection", i ) )
         this.rejection[i] = Parameters.getIntegerIndexed( "rejection", i );

      if ( Parameters.hasIndexed( "minMaxLow", i ) )
         this.minMaxLow[i] = Parameters.getRealIndexed( "minMaxLow", i );

      if ( Parameters.hasIndexed( "minMaxHigh", i ) )
         this.minMaxHigh[i] = Parameters.getRealIndexed( "minMaxHigh", i );

      if ( Parameters.hasIndexed( "percentileLow", i ) )
         this.percentileLow[i] = Parameters.getRealIndexed( "percentileLow", i );

      if ( Parameters.hasIndexed( "percentileHigh", i ) )
         this.percentileHigh[i] = Parameters.getRealIndexed( "percentileHigh", i );

      if ( Parameters.hasIndexed( "sigmaLow", i ) )
         this.sigmaLow[i] = Parameters.getRealIndexed( "sigmaLow", i );

      if ( Parameters.hasIndexed( "sigmaHigh", i ) )
         this.sigmaHigh[i] = Parameters.getRealIndexed( "sigmaHigh", i );

      if ( Parameters.hasIndexed( "linearFitLow", i ) )
         this.linearFitLow[i] = Parameters.getRealIndexed( "linearFitLow", i );

      if ( Parameters.hasIndexed( "linearFitHigh", i ) )
         this.linearFitHigh[i] = Parameters.getRealIndexed( "linearFitHigh", i );
   }

   if ( Parameters.has( "calibrateOnly" ) )
      this.calibrateOnly = Parameters.getBoolean( "calibrateOnly" );

   if ( Parameters.has( "generateDrizzleData" ) )
      this.generateDrizzleData = Parameters.getBoolean( "generateDrizzleData" );

   if ( Parameters.has( "bayerDrizzle" ) )
      this.bayerDrizzle = Parameters.getBoolean( "bayerDrizzle" );

   if ( Parameters.has( "cosmeticCorrection" ) )
      this.cosmeticCorrection = Parameters.getBoolean( "cosmeticCorrection" );

   if ( Parameters.has( "cosmeticCorrectionTemplateId" ) )
      this.cosmeticCorrectionTemplateId = Parameters.getString( "cosmeticCorrectionTemplateId" );

   if ( Parameters.has( "bayerPattern" ) )
      this.bayerPattern = Parameters.getInteger( "bayerPattern" );

   if ( Parameters.has( "debayerMethod" ) )
      this.debayerMethod = Parameters.getInteger( "debayerMethod" );

   if ( Parameters.has( "pixelInterpolation" ) )
      this.pixelInterpolation = Parameters.getInteger( "pixelInterpolation" );

   if ( Parameters.has( "clampingThreshold" ) )
      this.clampingThreshold = Parameters.getReal( "clampingThreshold" );

   if ( Parameters.has( "maxStars" ) )
      this.maxStars = Parameters.getInteger( "maxStars" );

   if ( Parameters.has( "noiseReductionFilterRadius" ) )
      this.noiseReductionFilterRadius = Parameters.getInteger( "noiseReductionFilterRadius" );

   if ( Parameters.has( "useTriangleSimilarity" ) )
      this.useTriangleSimilarity = Parameters.getBoolean( "useTriangleSimilarity" );

   if ( Parameters.has( "referenceImage" ) )
      this.referenceImage = Parameters.getString( "referenceImage" );

   if ( Parameters.has( "integrate" ) )
      this.integrate = Parameters.getBoolean( "integrate" );

   if ( this.exportCalibrationFiles )
      for ( var i = 0; ; ++i )
      {
         if ( !Parameters.hasIndexed( "group_imageType",    i ) ||
              !Parameters.hasIndexed( "group_filter",       i ) ||
              !Parameters.hasIndexed( "group_binning",      i ) ||
              !Parameters.hasIndexed( "group_exposureTime", i ) ||
              !Parameters.hasIndexed( "group_masterFrame",  i ) ||
              !Parameters.hasIndexed( "group_enabled",      i ) )
         {
            break;
         }

         var group = new FrameGroup( Parameters.getIntegerIndexed( "group_imageType",    i ),
                                     Parameters.getStringIndexed(  "group_filter",       i ),
                                     Parameters.getIntegerIndexed( "group_binning",      i ),
                                     Parameters.getRealIndexed(    "group_exposureTime", i ),
                                     null,
                                     Parameters.getBooleanIndexed( "group_masterFrame",  i ) );
         group.enabled =             Parameters.getBooleanIndexed( "group_enabled",      i );

         var groupIndexId = Parameters.indexedId( "group_frames", i );
         for ( var j = 0; ; ++j )
         {
            if ( !Parameters.hasIndexed( groupIndexId + "_filePath",     j ) ||
                 !Parameters.hasIndexed( groupIndexId + "_exposureTime", j ) ||
                 !Parameters.hasIndexed( groupIndexId + "_enabled",      j ) )
            {
               break;
            }

            var item = new FileItem( Parameters.getStringIndexed( groupIndexId + "_filePath",     j ),
                                     Parameters.getRealIndexed(   groupIndexId + "_exposureTime", j ) );
            item.enabled = Parameters.getBooleanIndexed(          groupIndexId + "_enabled",      j );
            group.fileItems.push( item );
         }

         if ( group.fileItems.length > 0 ) // don't add empy frame groups
            this.frameGroups.push( group );
      }
};

StackEngine.prototype.exportParameters = function()
{
   Parameters.clear();

   Parameters.set( "version", VERSION );

   Parameters.set( "outputSuffix",              this.outputSuffix );
   Parameters.set( "outputDirectory",           this.outputDirectory );
   Parameters.set( "cfaImages",                 this.cfaImages );
   Parameters.set( "upBottomFITS",              this.upBottomFITS );
   Parameters.set( "exportCalibrationFiles",    this.exportCalibrationFiles );
   Parameters.set( "generateRejectionMaps",     this.generateRejectionMaps );

   Parameters.set( "optimizeDarks",             this.optimizeDarks );
   Parameters.set( "darkOptimizationThreshold", this.darkOptimizationThreshold );
   Parameters.set( "darkOptimizationWindow",    this.darkOptimizationWindow );
   Parameters.set( "darkExposureTolerance",     this.darkExposureTolerance );

   Parameters.set( "evaluateNoise",             this.evaluateNoise );

   Parameters.set( "overscanEnabled",           this.overscan.enabled );

   for ( var i = 0; i < 4; ++i )
   {
      Parameters.setIndexed( "overscanRegionEnabled", i, this.overscan.overscan[i].enabled );
      Parameters.setIndexed( "overscanSourceX0",      i, this.overscan.overscan[i].sourceRect.x0 );
      Parameters.setIndexed( "overscanSourceY0",      i, this.overscan.overscan[i].sourceRect.y0 );
      Parameters.setIndexed( "overscanSourceX1",      i, this.overscan.overscan[i].sourceRect.x1 );
      Parameters.setIndexed( "overscanSourceY1",      i, this.overscan.overscan[i].sourceRect.y1 );
      Parameters.setIndexed( "overscanTargetX0",      i, this.overscan.overscan[i].targetRect.x0 );
      Parameters.setIndexed( "overscanTargetY0",      i, this.overscan.overscan[i].targetRect.y0 );
      Parameters.setIndexed( "overscanTargetX1",      i, this.overscan.overscan[i].targetRect.x1 );
      Parameters.setIndexed( "overscanTargetY1",      i, this.overscan.overscan[i].targetRect.y1 );
   }

   Parameters.set( "overscanImageX0", this.overscan.imageRect.x0 );
   Parameters.set( "overscanImageY0", this.overscan.imageRect.y0 );
   Parameters.set( "overscanImageX1", this.overscan.imageRect.x1 );
   Parameters.set( "overscanImageY1", this.overscan.imageRect.y1 );


   for ( var i = 0; i < 4; ++i )
   {
      Parameters.setIndexed( "useAsMaster",    i, this.useAsMaster[i] );
      Parameters.setIndexed( "combination",    i, this.combination[i] );
      Parameters.setIndexed( "rejection",      i, this.rejection[i] );
      Parameters.setIndexed( "minMaxLow",      i, this.minMaxLow[i] );
      Parameters.setIndexed( "minMaxHigh",     i, this.minMaxHigh[i] );
      Parameters.setIndexed( "percentileLow",  i, this.percentileLow[i] );
      Parameters.setIndexed( "percentileHigh", i, this.percentileHigh[i] );
      Parameters.setIndexed( "sigmaLow",       i, this.sigmaLow[i] );
      Parameters.setIndexed( "sigmaHigh",      i, this.sigmaHigh[i] );
      Parameters.setIndexed( "linearFitLow",   i, this.linearFitLow[i] );
      Parameters.setIndexed( "linearFitHigh",  i, this.linearFitHigh[i] );
   }

   Parameters.set( "calibrateOnly",                this.calibrateOnly );
   Parameters.set( "generateDrizzleData",          this.generateDrizzleData );
   Parameters.set( "bayerDrizzle",                 this.bayerDrizzle );

   Parameters.set( "cosmeticCorrection",           this.cosmeticCorrection );
   Parameters.set( "cosmeticCorrectionTemplateId", this.cosmeticCorrectionTemplateId );

   Parameters.set( "bayerPattern",                 this.bayerPattern );
   Parameters.set( "debayerMethod",                this.debayerMethod );

   Parameters.set( "pixelInterpolation",           this.pixelInterpolation );
   Parameters.set( "clampingThreshold",            this.clampingThreshold );
   Parameters.set( "maxStars",                     this.maxStars );
   Parameters.set( "noiseReductionFilterRadius",   this.noiseReductionFilterRadius );
   Parameters.set( "useTriangleSimilarity",        this.useTriangleSimilarity );
   Parameters.set( "referenceImage",               this.referenceImage );

   Parameters.set( "integrate",                    this.integrate );

   if ( this.exportCalibrationFiles )
      for ( var i = 0; i < this.frameGroups.length; ++i )
         if ( this.frameGroups[i].fileItems.length > 0 )
         {
            var group = this.frameGroups[i];
            Parameters.setIndexed( "group_imageType",    i, group.imageType );
            Parameters.setIndexed( "group_filter",       i, group.filter );
            Parameters.setIndexed( "group_binning",      i, group.binning );
            Parameters.setIndexed( "group_exposureTime", i, group.exposureTime );
            Parameters.setIndexed( "group_masterFrame",  i, group.masterFrame );
            Parameters.setIndexed( "group_enabled",      i, group.enabled );

            var groupIndexId = Parameters.indexedId( "group_frames", i );
            for ( var j = 0; j < group.fileItems.length; ++j )
            {
               var item = group.fileItems[j];
               Parameters.setIndexed( groupIndexId + "_filePath",     j, item.filePath );
               Parameters.setIndexed( groupIndexId + "_exposureTime", j, item.exposureTime );
               Parameters.setIndexed( groupIndexId + "_enabled",      j, item.enabled );
            }
         }
};

StackEngine.prototype.runDiagnostics = function()
{
   this.error = function( message )
   {
      this.diagnosticMessages.push( "*** Error: " + message );
   }

   this.warning = function( message )
   {
      this.diagnosticMessages.push( "** Warning: " + message );
   }

   this.clearDiagnosticMessages();

   try
   {
      if ( this.outputSuffix.isEmpty() )
         this.error( "No output file suffix specified." );
      else if ( !this.outputSuffix.startsWith( '.' ) )
         this.error( "Invalid output file suffix \'" + this.outputSuffix + "\'" );
      else
      {
         try
         {
            var F = new FileFormat( this.outputSuffix, false/*toRead*/, true/*toWrite*/ );
         }
         catch ( x )
         {
            this.error( "No installed file format can write " + this.outputSuffix + " files." );
         }
      }

      if ( this.outputDirectory.isEmpty() )
         this.error( "No output directory specified." );
      else if ( !File.directoryExists( this.outputDirectory ) )
         this.error( "The specified output directory does not exist: " + this.outputDirectory );
      else
      {
         try
         {
            var f = new File;
            var n = this.outputDirectory + "/__pixinsight_checking__";
            for ( var u = 1; ; ++u )
            {
               var nu = File.appendToName( n, u.toString() );
               if ( !File.exists( nu ) )
               {
                  n = nu;
                  break;
               }
            }
            f.createForWriting( n );
            f.close();
            File.remove( n );
         }
         catch ( x )
         {
            this.error( "Cannot access the output directory for writing: " + this.outputDirectory );
         }
      }

      if ( this.frameGroups.length == 0 )
         this.error( "No input frames have been specified." );

      for ( var i = 0; i < this.frameGroups.length; ++i )
         for ( var j = 0; j < this.frameGroups[i].fileItems.length; ++j )
            if ( !File.exists( this.frameGroups[i].fileItems[j].filePath ) )
               this.error( "Nonexistent input file: " + this.frameGroups[i].fileItems[j].filePath );

      for ( var i = 0; i < this.frameGroups.length; ++i )
         if ( !this.frameGroups[i].filter.isEmpty() )
            if ( this.frameGroups[i].cleanFilterName() != this.frameGroups[i].filter )
               this.warning( "Invalid file name characters will be replaced with underscores " +
                             "in filter name: \'" + this.frameGroups[i].filter + "\'" );

      if ( this.hasLightFrames() )
      {
         if ( this.cosmeticCorrection )
         {
            if ( this.cosmeticCorrectionTemplateId.isEmpty() )
               this.error( "No cosmetic correction template instance has been specified." );
            else
            {
               var CC = ProcessInstance.fromIcon( this.cosmeticCorrectionTemplateId );
               if ( CC == null )
                  this.error( "No such process process icon: " + this.cosmeticCorrectionTemplateId );
               else
               {
                  if ( !(CC instanceof CosmeticCorrection) )
                     this.error( "The specified process icon does not transport an instance " +
                                 "of CosmeticCorrection: " + this.cosmeticCorrectionTemplateId );
                  else
                  {
                     if ( this.cfaImages != CC.cfa )
                        this.warning( "The specified CosmeticCorrection instance is not congruent " +
                                      "with current script settings (CFA Images): " + this.cosmeticCorrectionTemplateId );
                     if ( !CC.useMasterDark && !CC.useAutoDetect && !CC.useDefectList )
                        this.warning( "The specified CosmeticCorrection instance does not define " +
                                      "a valid correction operation: " + this.cosmeticCorrectionTemplateId );
                  }
               }
            }
         }

         if ( !this.calibrateOnly )
            if ( this.referenceImage.isEmpty() )
               this.error( "No registration reference image has been specified." );
            else if ( !File.exists( this.referenceImage ) )
               this.error( "The specified registration reference file does not exist: " + this.referenceImage );
      }

      if ( !this.hasBiasFrames() )
         this.warning( "No bias frames have been selected." );

      if ( !this.hasDarkFrames() )
         this.warning( "No dark frames have been selected." );

      if ( !this.hasFlatFrames() )
         this.warning( "No flat frames have been selected." );

      if ( !this.hasLightFrames() )
         this.warning( "No light frames have been selected." );
      else
         for ( var i = 0; i < this.frameGroups.length; ++i )
            if ( this.frameGroups[i].imageType == ImageType.LIGHT )
            {
               var binning = this.frameGroups[i].binning;
               var filter = this.frameGroups[i].filter;
               var haveFlats = false;
               for ( var j = 0; j < this.frameGroups.length; ++j )
                  if ( this.frameGroups[j].imageType == ImageType.FLAT )
                     if ( this.frameGroups[j].binning == binning && this.frameGroups[j].filter == filter )
                     {
                        haveFlats = true;
                        break;
                     }
               if ( !haveFlats )
                  this.warning( "No flat frames have been selected to calibrate " + this.frameGroups[i].toString() );
            }

      for ( var i = 0; i < this.frameGroups.length; ++i )
      {
         if ( this.frameGroups[i].imageType == ImageType.LIGHT )
         {
            if ( this.calibrateOnly || !this.integrate )
               continue;
         }
         else
         {
            if ( this.frameGroups[i].masterFrame )
               continue;
         }

         var r = this.frameGroups[i].rejectionIsGood( this.rejection[this.frameGroups[i].imageType] );
         if ( !r[0] ) // if not good
            this.warning( "Integration of " + this.frameGroups[i].toString() + ": " + r[1] ); // reason
      }

      if ( !this.overscan.isValid() )
         this.error( "Invalid overscan region(s) defined." );
      else if ( this.overscan.enabled && !this.overscan.hasOverscanRegions() )
         this.warning( "Overscan correction has been enabled, but no overscan regions have been defined." );
   }
   catch ( x )
   {
      this.error( x.message );
   }
};

StackEngine.prototype.getPath = function( filePath, imageType )
{
   for ( var i = 0; i < this.frameGroups.length; ++i )
      if ( this.frameGroups[i].imageType == imageType )
         for ( var j = 0; j < this.frameGroups[i].fileItems.length; ++j )
            if ( this.frameGroups[i].fileItems[j].filePath == filePath )
               return filePath;
   return "";
};

// ----------------------------------------------------------------------------
// EOF BatchPreprocessing-engine.js - Released 2015/07/22 16:32:44 UTC
