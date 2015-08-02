/*
   Image Plate Solver

   Plate solving of astronomical images.

   Copyright (C) 2012-2015, Andres del Pozo
   All rights reserved.

   Redistribution and use in source and binary forms, with or without
   modification, are permitted provided that the following conditions are met:

   1. Redistributions of source code must retain the above copyright notice, this
      list of conditions and the following disclaimer.
   2. Redistributions in binary form must reproduce the above copyright notice,
      this list of conditions and the following disclaimer in the documentation
      and/or other materials provided with the distribution.

   THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
   ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
   (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
   LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
   ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
   (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*
   Changelog:

   4.0:   * Improved the algorithm for distorted images
          * Added option for noise reduction
          * Selection of the projection of the image
          * Stores the distortion as the control points of a surface spline.
          * Better star detection
          * Improved support for distortion models

   3.5.1: * Fixed: It can now solve images already solved with incompatible tags

   3.5:   * Updated the URL of one of the VizieR mirrors
          * Use of weighted splines to improve the convergence of the algorithm
          * The queries to the catalog are now more efficient and the cache is kept
            between executions.
          * New option "non-interactive" for non-interactive execution

   3.4.1: * Small fixes

   3.4:   * Improved the solutions using distortion models
          * Improved the calculation of nonlinear solutions using splines. Now it should be
            less prone to wild oscillations.

   3.3:   * The script can now solve a list of files
          * Removed several unnecessary parameters
          * Fixed error when trying to solve images of very wide field

   3.2.1: * Fixed: when reading invalid OBJCTRA and OBJCTDEC tags the script no longer stops
          * Added support for coordinate format DDD:MM:SS in OBJCTRA and OBJCTDEC

   3.2:   * Fixed initialization of "Align Algorithm" parameter in the configuration window.
          * Options for using and generating distortion models compatible with StarAlignment
          * Polynomial degree limited to 5

   3.1:   * Added parameter "Align Algorithm"

   3.0.1: * Fixed the validation of the value of the resolution

   3.0:   * Use of a distortion template
          * New "Only optimize" option

   2.0.1: * Removed all the usages of "with" in order to run the script in strict mode

   2.0:   * Support for higher degree polynomials
          * Optimization by least squares lineal regression
          * Catalogs TYCHO-2 and BrightStars
          * Advanced parameters collapsible panel

   1.7.4: * Improved error management

   1.7.3: * Fixed layout problems in PixInsight 1.8RC4
          * Another fix that increases the precision of the coordinates
          * Changed all icons to standard PI Core 1.8 resources
          * Button icons also shown on Mac OS X
          * Fixed copyright years (2012-2013)

   1.7.2: * Fixed the selection of catalogs
          * Better precision of the coordinates

   1.7.1: * Temporal fix for bug because StarAlignment uses a non-standard origin of coordinates

   1.7:   * Validated for PixInsight 1.8

   1.6:   * Refactored to allow its use in other scripts.

   1.51:  * 2012 Apr 19 - Released as an official update.
          * Removed all instances of the 'with' JavaScript statement.
          * Fixed some text messsages.

   1.5:   * Search online of initial coordinates by name or identifier

   1.4:   * Adds support for saving the parameters as an icon.
          * It can be applied to an image container.
          * When Reset is pressed now it is not necessary to reopen the script
          * Fixed problem with incomplete values in DATE-OBS
          * The algorithm stops when the number of iterations is reached or the
            delta between iterations is less than 0.1 pixels
          * Code clean up

   1.3:   * Support for online catalogs (PPMXL and UCAC3)
          * ransacTolerance reverted to its default value
          * Added control for the sensitivity of the star detector
          * Reset button

   1.2:   * Modified for sharing code with Annotation Script
          * matcherTolerance reverted to its default value
          * Decreased to 0.05" the condition of convergence

   1.1:   * Adapted to use CSV star lists with newer versions of the
            StarGenerator and StarAlignment processes.
          * General code cleanup.

   1.0:   * Writes the WCS coordinates in the file
          * More accurate algorithm

   0.2:   * Much better precision and speed.
          * It uses the formulas of the gnomonic projection.

   0.1.1: * Fixed error in databasePath

   0.1:   * Initial test version.
*/

/* Coordinate spaces:
   Image Pixels (I): Pixels of the image in PixInsight.
         Increases from left to right and top to bottom
         The center of the top left pixel has the coordinates (0.5, 0.5)
   Star Field (S): Pixels of the reference image generated by StarGenerator.
         The axis are the same as I.
   Gnomonic projected space (G): Projected space result of projecting the celestial
         coordinates with a Gnomonic projection.
         It coincides with the World Intermediate Coordinates of WCS.
         Increases from right to left and bottom to top
         The center of the image has coordinates (0,0).
   FITS WCS pixels (F): Pixels of the image using WCS conventions
         http://fits.gsfc.nasa.gov/fits_wcs.html "Representations of World Coordinates in FITS" (Sections 2.1.4 and 5.1)
         http://fits.gsfc.nasa.gov/fits_wcs.html "Representations of celestial coordinates in FITS" (Section 5, page 1085)
         Increases from left to right and bottom to top
         The center of the bottom left pixel has the coordinates (1,1)
*/

#feature-id    Image Analysis > ImageSolver

#feature-info  A script for plate-solving astronomical images.<br/>\
               <br/>\
               Copyright &copy; 2012-2015 Andr&eacute;s del Pozo

#include <pjsr/DataType.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/StdCursor.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/ColorSpace.jsh>
#include <pjsr/NumericControl.jsh>

#ifndef __PJSR_SectionBar_jsh
#include <pjsr/SectionBar.jsh>
#endif

#define SOLVERVERSION "4.0"

#ifndef USE_SOLVER_LIBRARY
#define TITLE "Image Solver"
#define SETTINGS_MODULE "SOLVER"
//#define DEBUG

#include "WCSmetadata.jsh"
#include "AstronomicalCatalogs.jsh"
#include "SearchCoordinatesDialog.js"
#include "OptimizeSplineCoordinates.js"

#define STAR_CSV_FILE   File.systemTempDirectory + "/stars.csv"
#endif

#define SETTINGS_MODULE_SCRIPT "SOLVER"

// -------------------------------------
// ENUMERATION AlignMode

function AlignAlgorithm()
{
}
AlignAlgorithm.prototype.Triangles = 0;
AlignAlgorithm.prototype.Polygons = 1;

// ******************************************************************
// SolverConfiguration: Configuration information of Solver engine
// ******************************************************************
function SolverConfiguration(module)
{
   this.__base__ = ObjectWithSettings;
   this.__base__(
      module,
      "solver",
      new Array(
         ["magnitude", DataType_Float],
         //["polyDegree", DataType_UInt8],
         ["noiseLayers", DataType_UInt8],
         ["databasePath", DataType_UCString],
         ["generateErrorImg", DataType_Boolean],
         ["sensitivity", DataType_Double],
         ["catalogMode", DataType_UInt8],
         ["vizierServer", DataType_UCString],
         ["showStars", DataType_Boolean],
         ["showDistortion", DataType_Boolean],
         ["generateDistortModel", DataType_Boolean],
         ["catalog", DataType_UCString],
         ["distortionCorrection", DataType_Boolean],
         ["splineSmoothing", DataType_Float],
         ["useDistortionModel", DataType_Boolean],
         ["distortionModelPath", DataType_UCString],
         ["onlyOptimize", DataType_Boolean],
         ["alignAlgorithm", DataType_UInt8],
         ["useActive", DataType_Boolean],
         ["outSuffix", DataType_UCString],
         ["files", Ext_DataType_StringArray],
         ["projection", DataType_UInt8],
         ["projectionOriginMode", DataType_UInt8]
      )
   );

   this.useActive = true;
   this.files = [];
   this.availableCatalogs = [new UCAC3Catalog(),new PPMXLCatalog(),new TychoCatalog(),new HR_Catalog()];
   this.catalogMode = 1;
   this.vizierServer = "http://vizier.u-strasbg.fr/";
   this.magnitude = 12;
   this.noiseLayers = 0;
   this.maxIterations = 100;
   this.sensitivity = -1;
   this.generateErrorImg = false;
   this.templateSizeFactor = 1.5;
   this.showStars = false;
   this.catalog = "PPMXL";
   //this.polyDegree = 1;
   this.showDistortion=false;
   this.distortionCorrection = false;
   this.splineSmoothing = 0.05;
   this.generateDistortModel = false;
   this.onlyOptimize = false;
   this.useDistortionModel = false;
   this.distortionModelPath = null;
   this.alignAlgorithm = AlignAlgorithm.prototype.Triangles;
   this.outSuffix = "_WCS";
   this.projection = 0;
   this.projectionOriginMode = 0;

   this.ResetSettings = function()
   {
      Settings.remove( SETTINGS_MODULE );
   }
}

SolverConfiguration.prototype = new ObjectWithSettings;

// ******************************************************************
// ImageSolverDialog: Configuration dialog of the solver
// ******************************************************************
function ImageSolverDialog( solverCfg, metadata, showTargetImage )
{
   this.__base__ = Dialog;
   this.__base__();

   var labelWidth1 = this.font.width( "Right Ascension (hms):" + "M" );
   var radioLabelWidth = this.font.width( "Resolution (arcsec/px):" );
   var spinBoxWidth = 7*this.font.width( 'M' );

   this.solverCfg = solverCfg;

   this.helpLabel = new Label( this );
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.minWidth = 45*this.font.width( 'M' );
   this.helpLabel.margin = 6;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text =
      "<p><b>Image Plate Solver v" + SOLVERVERSION + "</b> &mdash; A script for plate-solving astronomical images.<br/>" +
      "Copyright &copy; 2012-2015 Andr&eacute;s del Pozo</p>";

   if(showTargetImage)
   {
      var hasActiveWindow = ImageWindow.activeWindow && ImageWindow.activeWindow.isWindow;
      if(!hasActiveWindow)
         solverCfg.useActive = false;

      this.selected_Radio = new RadioButton(this);
      this.selected_Radio.text = "Active window";
      this.selected_Radio.checked = solverCfg.useActive == true;
      this.selected_Radio.minWidth = labelWidth1;
      this.selected_Radio.toolTip = "<p>The script solves the geometry of the image of the active window.</p>";
      this.selected_Radio.enabled = hasActiveWindow;
      this.selected_Radio.onCheck = function (value)
      {
         solverCfg.useActive = true;
         this.dialog.EnableFileControls();
      }

      this.files_Radio = new RadioButton(this);
      this.files_Radio.text = "List of files";
      this.files_Radio.checked = !solverCfg.useActive;
      this.files_Radio.minWidth = labelWidth1;
      this.files_Radio.toolTip = "<p>The solves the geometry of the images of a list of files.</p>";
      this.files_Radio.onCheck = function (value)
      {
         solverCfg.useActive = false;
         this.dialog.EnableFileControls();
      }

      // List of files
      this.files_List = new TreeBox(this);
      this.files_List.rootDecoration = false;
      this.files_List.alternateRowColor = true;
      this.files_List.multipleSelection = true;
      this.files_List.headerVisible = false;
      //this.files_List.setScaledMinHeight(80);
      this.files_List.setScaledFixedHeight(120);
      this.files_List.numberOfColumns = 2;
      this.files_List.showColumn(1, false);
      this.files_List.toolTip = "<p>List of files for which the geometry will be computed.</p>";
      if (solverCfg.files)
      {
         for (var i = 0; i < solverCfg.files.length; ++i)
         {
            var node = new TreeBoxNode(this.files_List);
            node.setText(0, solverCfg.files[i]);
         }
      }
      else
         solverCfg.files = new Array();

      // Add file button
      this.add_Button = new PushButton(this);
      this.add_Button.text = "Add files";
      this.add_Button.toolTip = "Add files to the list";
      this.add_Button.onMousePress = function ()
      {
         var ofd = new OpenFileDialog;
         ofd.multipleSelections = true;
         ofd.caption = "Select files";
         //ofd.loadImageFilters();
         ofd.filters = [
            [ "FITS Files", ".fit", ".fits", ".fts" ]
         ];
         if (ofd.execute())
         {
            for (var i = 0; i < ofd.fileNames.length; ++i)
            {
               solverCfg.files.push(ofd.fileNames[i]);
               var node = new TreeBoxNode(this.dialog.files_List);
               node.checkable = false;
               node.setText(0, ofd.fileNames[i]);
            }
            this.dialog.files_List.adjustColumnWidthToContents(1);
         }
      }

      // Remove file button
      this.remove_Button = new PushButton(this);
      this.remove_Button.text = "Remove files";
      this.remove_Button.toolTip = "Removes the selected files from the list";
      this.remove_Button.onMousePress = function ()
      {
         for (var i = this.dialog.files_List.numberOfChildren - 1; i >= 0; i--)
         {
            if (this.dialog.files_List.child(i).selected)
            {
               solverCfg.files.splice(i, 1);
               this.dialog.files_List.remove(i);
            }
         }
      }

      // Clear files button
      this.clear_Button = new PushButton(this);
      this.clear_Button.text = "Clear files";
      this.clear_Button.toolTip = "Clears the list of files";
      this.clear_Button.onMousePress = function ()
      {
         this.dialog.files_List.clear();
         solverCfg.files = new Array();
      }

      // Buttons for managing the list of files
      this.files_Buttons = new VerticalSizer;
      this.files_Buttons.spacing = 6;
      this.files_Buttons.add(this.add_Button);
      this.files_Buttons.add(this.remove_Button);
      this.files_Buttons.addSpacing(8);
      this.files_Buttons.add(this.clear_Button);
      this.files_Buttons.addStretch();

      // Output file suffix
      this.suffix_Label = new fieldLabel( this, "Output file suffix:", labelWidth1-4 );

      this.suffix_Edit = new Edit(this);
      this.suffix_Edit.text = solverCfg.outSuffix ? solverCfg.outSuffix : "";
      this.suffix_Edit.toolTip = "<p>This suffix will be appended to the filename when saving the plate-solving solution.<br/>" +
         "If it is empty, the original file will be overwritten.</p>";
      this.suffix_Edit.onTextUpdated = function (value)
      {
         solverCfg.outSuffix = value ? value.trim() : "";
      };

      this.suffix_Sizer = new HorizontalSizer;
      this.suffix_Sizer.spacing = 6;
      this.suffix_Sizer.add(this.suffix_Label);
      this.suffix_Sizer.add(this.suffix_Edit);
      this.suffix_Sizer.addStretch();

      // Files group
      this.files_Sizer2 = new HorizontalSizer;
      this.files_Sizer2.spacing = 6;
      this.files_Sizer2.add(this.files_List, 100);
      this.files_Sizer2.add(this.files_Buttons);

      this.files_Control = new Control(this);
      this.files_Sizer = new VerticalSizer;
      this.files_Sizer.spacing = 6;
      this.files_Sizer.add(this.files_Sizer2, 100);
      this.files_Sizer.add(this.suffix_Sizer);
      this.files_Control.sizer=this.files_Sizer;

      this.EnableFileControls = function ()
      {
         this.files_List.enabled = solverCfg.useActive == false;
         this.add_Button.enabled = solverCfg.useActive == false;
         this.remove_Button.enabled = solverCfg.useActive == false;
         this.clear_Button.enabled = solverCfg.useActive == false;
         this.files_Control.visible = solverCfg.useActive == false;

         this.setVariableHeight();
         this.targetImageGroup.adjustToContents();
         this.adjustToContents();
         if ( solverCfg.useActive )
            this.setFixedSize();
         else
            this.setMinHeight();
      };

      //this.targetImageGroup = new GroupBox(this);
      //this.targetImageGroup.title = "Target image";
      this.targetImageGroup = new Frame(this)
      //this.targetImageGroup.frameStyle = FrameStyle_Styled;
      this.targetImageGroup.sizer = new VerticalSizer;
      this.targetImageGroup.sizer.margin = 6;
      this.targetImageGroup.sizer.spacing = 4;
      this.targetImageGroup.sizer.add(this.selected_Radio);
      this.targetImageGroup.sizer.add(this.files_Radio);
      this.targetImageGroup.sizer.add(this.files_Control, 100);

      this.targetImage_Section = new SectionBar(this, "Target Image");
      this.targetImage_Section.onToggleSection = function (section, toggleBegin)
      {
         if (!toggleBegin)
         {
            this.dialog.setVariableSize();
            this.dialog.adjustToContents();
            this.dialog.setFixedSize();
         }
      }
      this.targetImage_Section.setSection(this.targetImageGroup);
   }

   // Only optimize

   this.optimize_CheckBox = new CheckBox( this );
   this.optimize_CheckBox.text = "Only apply optimization";
   this.optimize_CheckBox.checked = this.solverCfg.onlyOptimize != null && this.solverCfg.onlyOptimize;
   this.optimize_CheckBox.toolTip = "<p>The solver assumes that the image is already solved and " +
      "it only optimizes the result using the current parameters.</p>";
   this.optimize_CheckBox.onCheck = function( checked )
   {
      solverCfg.onlyOptimize = checked;
      this.dialog.dmParPanel.enabled = !checked;
   };

   this.optimize_Sizer = new HorizontalSizer;
   this.optimize_Sizer.spacing = 4;
   //this.optimize_Sizer.addSpacing(labelWidth1);
   this.optimize_Sizer.add( this.optimize_CheckBox );
   this.optimize_Sizer.addStretch();

   // Target object specifications

   var coordinatesTooltip = "<p>Initial equatorial coordinates. Must be inside the image.</p>";

   // CoordsEditor
   this.coords_Editor = new CoordinatesEditor(this, new Point(metadata.ra, metadata.dec), labelWidth1, spinBoxWidth, coordinatesTooltip);

   this.search_Button = new PushButton( this );
   this.search_Button.text = "Search";
   this.search_Button.icon = this.scaledResource( ":/icons/find.png" );
   this.search_Button.onClick = function ()
   {
      var search = new SearchCoordinatesDialog(null,true,false);
      search.windowTitle = "Online Coordinates Search"
      if (search.execute())
      {
         var object = search.object;
         if (object == null)
            return;
         this.dialog.coords_Editor.SetCoords(object.posEq);
      }
   };

   this.coords_Sizer=new HorizontalSizer;
   this.coords_Sizer.spacing = 8;
   this.coords_Sizer.add( this.coords_Editor);
   this.coords_Sizer.add( this.search_Button);
   this.coords_Sizer.addStretch();

   // Epoch

   var epochTooltip = "<p>Date on which the image was taken.<br/>It is initialized from the DATE_OBS keyword.</p>";

   this.epoch_Label = new fieldLabel( this, "Epoch (ymd):", labelWidth1 );

   var epochArray = metadata.epoch == null ? [ 2000, 1, 1] : Math.jdToComplexTime( metadata.epoch );
   var epoch = new Date( epochArray[0], epochArray[1]-1, epochArray[2] );

   this.epoch_year_SpinBox = new SpinBox( this );
   this.epoch_year_SpinBox.minValue = 0;
   this.epoch_year_SpinBox.maxValue = 3000;
   this.epoch_year_SpinBox.value = epoch.getFullYear();
   this.epoch_year_SpinBox.toolTip = epochTooltip;
   this.epoch_year_SpinBox.setFixedWidth( spinBoxWidth );
   this.epoch_year_SpinBox.onValueUpdated = function( value )
   {
      epoch.setFullYear( value );
   };

   this.epoch_mon_SpinBox = new SpinBox( this );
   this.epoch_mon_SpinBox.minValue = 1;
   this.epoch_mon_SpinBox.maxValue = 12;
   this.epoch_mon_SpinBox.value = epoch.getMonth() + 1;
   this.epoch_mon_SpinBox.toolTip = epochTooltip;
   this.epoch_mon_SpinBox.setFixedWidth( spinBoxWidth );
   this.epoch_mon_SpinBox.onValueUpdated = function( value )
   {
      epoch.setMonth( value - 1 );
   };

   this.epoch_day_SpinBox = new SpinBox( this );
   this.epoch_day_SpinBox.minValue = 1;
   this.epoch_day_SpinBox.maxValue = 31;
   this.epoch_day_SpinBox.value = epoch.getDate();
   this.epoch_day_SpinBox.toolTip = epochTooltip;
   this.epoch_day_SpinBox.setFixedWidth( spinBoxWidth );
   this.epoch_day_SpinBox.onValueUpdated = function( value )
   {
      epoch.setDate( value );
   };

   this.epoch_Sizer = new HorizontalSizer;
   this.epoch_Sizer.spacing = 4;
   this.epoch_Sizer.add( this.epoch_Label );
   this.epoch_Sizer.add( this.epoch_year_SpinBox );
   this.epoch_Sizer.add( this.epoch_mon_SpinBox );
   this.epoch_Sizer.add( this.epoch_day_SpinBox );
   this.epoch_Sizer.addStretch();

   metadata.useFocal = metadata.useFocal && metadata.xpixsz!=null && metadata.xpixsz>0;

   this.focal_RadioButton = new RadioButton( this );
   this.focal_RadioButton.checked = metadata.useFocal;
   this.focal_RadioButton.enabled = metadata.xpixsz!=null && metadata.xpixsz>0;
   this.focal_RadioButton.onCheck = function( value )
   {
      this.dialog.focal_Edit.enabled = value;
      metadata.useFocal = true;
   }

   this.focal_Label = new Label(this);
   this.focal_Label.textAlignment = TextAlign_Left | TextAlign_VertCenter;
   this.focal_Label.text = "Focal distance (mm):";
   this.focal_Label.setMinWidth(radioLabelWidth);
   this.focal_Label.mouseTracking = true;
   this.focal_Label.onMouseRelease = function ()
   {
      if (this.dialog.focal_RadioButton.enabled)
      {
         this.dialog.focal_RadioButton.checked = true;
         this.dialog.focal_RadioButton.onCheck(true);
      }
   };

   this.focal_Edit = new Edit( this );
   this.focal_Edit.text = format( "%g", metadata.focal );
   this.focal_Edit.toolTip = "<p>Effective focal length of the optical system in millimeters.<br />" +
      "It doesn't need to be the exact value, but it should not be more than 50% off (the closer the better).</p>";
   this.focal_Edit.setFixedWidth( spinBoxWidth );
   this.focal_Edit.enabled = metadata.useFocal;
   this.focal_Edit.onTextUpdated = function( value )
   {
      metadata.focal = parseFloat( value );
      if ( metadata.xpixsz )
      {
         metadata.resolution = (metadata.focal > 0) ? metadata.xpixsz/metadata.focal*0.18/Math.PI : 0;
         this.dialog.resolution_Edit.text = format( "%g", metadata.resolution*3600 );
      }
   };

   this.resolution_RadioButton = new RadioButton( this );
   this.resolution_RadioButton.checked = !metadata.useFocal;
   this.resolution_RadioButton.onCheck = function( value )
   {
      this.dialog.resolution_Edit.enabled = value;
      metadata.useFocal = false;
   };

   this.resolution_Label = new Label( this );
   this.resolution_Label.textAlignment = TextAlign_Left|TextAlign_VertCenter;
   this.resolution_Label.text = "Resolution (arcsec/px):";
   this.resolution_Label.setMinWidth( radioLabelWidth );
   this.resolution_Label.mouseTracking = true;
   this.resolution_Label.onMouseRelease = function()
   {
      this.dialog.resolution_RadioButton.checked = true;
      this.dialog.resolution_RadioButton.onCheck( true );
   };

   this.resolution_Edit = new Edit( this );
   if ( metadata.resolution != null )
      this.resolution_Edit.text = format( "%g", metadata.resolution*3600 );
   this.resolution_Edit.toolTip = "<p>Resolution of the image in arcseconds per pixel.<br />"+
      "It doesn't need to be the exact value, but it should not be more than 50% off (the closer the better).</p>";
   this.resolution_Edit.setFixedWidth( spinBoxWidth );
   this.resolution_Edit.enabled = !metadata.useFocal;
   this.resolution_Edit.onTextUpdated = function( value )
   {
      metadata.resolution = parseFloat( value )/3600;
      if ( metadata.xpixsz )
      {
         metadata.focal = (metadata.resolution > 0) ? metadata.xpixsz/metadata.resolution*0.18/Math.PI : 0;
         this.dialog.focal_Edit.text = format( "%g", metadata.focal );
      }
   };

   this.focal_Sizer = new HorizontalSizer;
   this.focal_Sizer.spacing = 4;
   this.focal_Sizer.add( this.focal_RadioButton );
   this.focal_Sizer.add( this.focal_Label );
   this.focal_Sizer.add( this.focal_Edit);
   this.focal_Sizer.addStretch();

   this.resol_Sizer = new HorizontalSizer;
   this.resol_Sizer.spacing = 4;
   this.resol_Sizer.add( this.resolution_RadioButton );
   this.resol_Sizer.add( this.resolution_Label );
   this.resol_Sizer.add( this.resolution_Edit);
   this.resol_Sizer.addStretch();

   this.scaleStack = new VerticalSizer;
   this.scaleStack.spacing = 4;
   this.scaleStack.add( this.focal_Sizer );
   this.scaleStack.add( this.resol_Sizer);

   this.scale_Label = new fieldLabel( this, "Image scale:", labelWidth1 );
   this.scale_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.scale_Control = new Label( this );
   this.scale_Control.textAlignment = TextAlign_VertCenter;
   this.scale_Control.text = '[';
   this.scale_Control.font = new Font( "DejaVu Sans Mono", this.font.pointSize*2 );

   this.scale_Sizer = new HorizontalSizer;
   this.scale_Sizer.spacing = 4;
   this.scale_Sizer.add( this.scale_Label );
   this.scale_Sizer.add( this.scale_Control );
   this.scale_Sizer.add( this.scaleStack );
   this.scale_Sizer.addStretch();

   // Pixel Size
   this.pixelSize_Label = new fieldLabel( this, "Pixel size (um):", labelWidth1 );

   this.pixelSizeX_Edit = new Edit(this);
   this.pixelSizeX_Edit.text = metadata.xpixsz == null ? "7" : format("%g", metadata.xpixsz);
   this.pixelSizeX_Edit.toolTip = "<p>Pixel size in micrometers. The image is assumed to have square pixels.</p>";
   this.pixelSizeX_Edit.setFixedWidth(spinBoxWidth);
   this.pixelSizeX_Edit.onTextUpdated = function (value)
   {
      metadata.xpixsz = value != null ? parseFloat(value) : 0;
      if (metadata.xpixsz > 0 && metadata.xpixsz < 3600)
      {
         this.dialog.focal_RadioButton.enabled = true;
         if (metadata.useFocal)
         {
            metadata.resolution = (metadata.focal > 0) ? metadata.xpixsz / metadata.focal * 0.18 / Math.PI : 0;
            this.dialog.resolution_Edit.text = format("%g", metadata.resolution * 3600);
         }
         else
         {
            metadata.focal = (metadata.resolution > 0) ? metadata.xpixsz / metadata.resolution * 0.18 / Math.PI : 0;
            this.dialog.focal_Edit.text = format("%g", metadata.focal);
         }
      }
      else
      {
         this.dialog.focal_RadioButton.enabled = false;
         metadata.useFocal = false;
         this.dialog.resolution_RadioButton.checked = true;
         this.dialog.resolution_Edit.enabled = true;
      }
   };

   this.pixelSize_Sizer = new HorizontalSizer;
   this.pixelSize_Sizer.spacing = 4;
   this.pixelSize_Sizer.add( this.pixelSize_Label );
   this.pixelSize_Sizer.add( this.pixelSizeX_Edit );
   // this.pixelSize_Sizer.add( this.pixelSize1_Label );
   // this.pixelSize_Sizer.add( this.pixelSize1_Label );
   // this.pixelSize_Sizer.add( this.pixelSizeY_Edit );
   this.pixelSize_Sizer.addStretch();

   this.dmParPanel = new Control(this);
   this.dmParPanel.sizer = new VerticalSizer;
   this.dmParPanel.sizer.margin = 0;
   this.dmParPanel.sizer.spacing = 4;
   this.dmParPanel.sizer.add( this.coords_Sizer );
   this.dmParPanel.sizer.add( this.epoch_Sizer );
   this.dmParPanel.sizer.add( this.scale_Sizer );
   this.dmParPanel.sizer.add( this.pixelSize_Sizer );
   this.dmParPanel.enabled = !solverCfg.onlyOptimize;

   //this.dmParGroupBox = new GroupBox( this );
   //this.dmParGroupBox.title = "Image parameters";
   this.dmParGroupBox = new Frame(this)
   this.dmParGroupBox.sizer = new VerticalSizer;
   this.dmParGroupBox.sizer.margin = 6;
   this.dmParGroupBox.sizer.spacing = 4;
   this.dmParGroupBox.sizer.add( this.optimize_Sizer );
   this.dmParGroupBox.sizer.add( this.dmParPanel );

   this.dmPar_Section = new SectionBar(this, "Image parameters");
   this.dmPar_Section.onToggleSection = function (section, toggleBegin)
   {
      if (!toggleBegin)
      {
         this.dialog.setVariableSize();
         this.dialog.adjustToContents();
         this.dialog.setFixedSize();
      }
   }
   this.dmPar_Section.setSection(this.dmParGroupBox);

   // Model options

   // Local Catalog
   //this.dbPath_Label = new fieldLabel( this, "Star database:", labelWidth1 );
   this.dbPath_RadioButton = new RadioButton( this );
   this.dbPath_RadioButton.text = "Local star catalog:";
   this.dbPath_RadioButton.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.dbPath_RadioButton.setMinWidth( labelWidth1 );
   this.dbPath_RadioButton.checked = this.solverCfg.catalogMode==0;
   this.dbPath_RadioButton.toolTip = "Use an locally stored star catalog";
   this.dbPath_RadioButton.onCheck = function( value )
   {
      this.dialog.dbPath_Edit.enabled = value;
      this.dialog.dbPath_Button.enabled = value;
      this.dialog.solverCfg.catalogMode = 0;
   }

   this.dbPath_Edit = new Edit( this );
   if ( this.solverCfg.databasePath )
      this.dbPath_Edit.text = this.solverCfg.databasePath;
   this.dbPath_Edit.setScaledMinWidth( 300 );
   this.dbPath_Edit.enabled = this.solverCfg.catalogMode==0;
   this.dbPath_Edit.toolTip = "<p>Path to a star database file in StarGenerator format.<br />" +
      "The currently available star database files can be downloaded from: http://pixinsight.com/download/</p>";
   this.dbPath_Edit.onTextUpdated = function( value )
   {
     solverCfg.databasePath = value;
   };

   this.dbPath_Button = new ToolButton( this );
   this.dbPath_Button.icon = this.scaledResource( ":/icons/select-file.png" );
   this.dbPath_Button.setScaledFixedSize( 20, 20 );
   this.dbPath_Button.toolTip = "<p>Select a StarGenerator database file.</p>";
   this.dbPath_Button.enabled = this.solverCfg.catalogMode==0;
   this.dbPath_Button.onClick = function()
   {
      var gdd = new OpenFileDialog;
      gdd.initialPath = this.dialog.dbPath_Edit.text;
      gdd.caption = "Select Star Database Path";
      gdd.filters = [["Star database files", "*.bin"]];
      if ( gdd.execute() )
      {
         solverCfg.databasePath = gdd.fileName;
         this.dialog.dbPath_Edit.text = gdd.fileName;
      }
   };

   this.dbPath_Sizer = new HorizontalSizer;
   this.dbPath_Sizer.spacing = 4;
   this.dbPath_Sizer.add( this.dbPath_RadioButton );
   this.dbPath_Sizer.add( this.dbPath_Edit, 100 );
   this.dbPath_Sizer.add( this.dbPath_Button );

   // VizieR Catalog
   //this.dbPath_Label = new fieldLabel( this, "Star database:", labelWidth1 );
   this.vizier_RadioButton = new RadioButton( this );
   this.vizier_RadioButton.text = "VizieR star catalog:";
   this.vizier_RadioButton.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.vizier_RadioButton.setMinWidth( labelWidth1 );
   this.vizier_RadioButton.checked = this.solverCfg.catalogMode==1;
   this.vizier_RadioButton.toolTip = "Use an online VizieR catalog server";
   this.vizier_RadioButton.onCheck = function( value )
   {
      this.dialog.mirror_Combo.enabled = value;
      this.dialog.catalog_Combo.enabled = value;
      this.dialog.solverCfg.catalogMode = 1;
   }

   this.catalog_Combo = new ComboBox(this);
   this.catalog_Combo.enabled = this.solverCfg.catalogMode==1;
   this.catalog_Combo.editEnabled = false;
   var toolTip = "<p>Available catalogs:</p><ul>";
   for(var i=0; i<this.solverCfg.availableCatalogs.length; i++){
      this.catalog_Combo.addItem(this.solverCfg.availableCatalogs[i].name);
      if(this.solverCfg.availableCatalogs[i].name==this.solverCfg.catalog)
         this.catalog_Combo.currentItem = i;
      toolTip+="<li>" + this.solverCfg.availableCatalogs[i].description + "</li>";
   }
   toolTip+="</ul>";

   this.catalog_Combo.toolTip = toolTip;
   this.catalog_Combo.onItemSelected = function ()
   {
      this.dialog.solverCfg.catalog = this.dialog.solverCfg.availableCatalogs[this.dialog.catalog_Combo.currentItem].name;
   }

   this.mirror_Combo = new ComboBox(this);
   this.mirror_Combo.enabled = this.solverCfg.catalogMode==1;
   this.mirror_Combo.editEnabled = false;
   this.mirror_Combo.toolTip = "<p>Select the best VizieR server for your location</p>";
   for ( var m = 0; m < VizierCatalog.mirrors.length; m++ )
   {
      this.mirror_Combo.addItem( VizierCatalog.mirrors[m].name );
      if ( VizierCatalog.mirrors[m].address == this.solverCfg.vizierServer )
         this.mirror_Combo.currentItem = parseInt( m );
   }
   this.mirror_Combo.onItemSelected = function()
   {
      this.dialog.solverCfg.vizierServer = VizierCatalog.mirrors[this.dialog.mirror_Combo.currentItem].address;
   };

   this.vizierSizer = new HorizontalSizer;
   this.vizierSizer.spacing = 4;
   this.vizierSizer.add( this.vizier_RadioButton );
   this.vizierSizer.add( this.catalog_Combo );
   this.vizierSizer.add( this.mirror_Combo );
   this.vizierSizer.addStretch();

   // Magnitude

   this.magnitude_Label = new fieldLabel( this, "Limit magnitude:", labelWidth1 );

   this.magnitude_SpinBox = new SpinBox( this );
   this.magnitude_SpinBox.minValue = 0;
   this.magnitude_SpinBox.maxValue = 30;
   this.magnitude_SpinBox.value = this.solverCfg.magnitude;
   this.magnitude_SpinBox.toolTip = "<p>Maximum star magnitude to use in the algorithm.<br/>" +
      "For wider fields, use lower values.</p>";
   this.magnitude_SpinBox.setFixedWidth( spinBoxWidth );
   this.magnitude_SpinBox.onValueUpdated = function( value )
   {
      solverCfg.magnitude = value;
   };

   this.magnitude_Sizer = new HorizontalSizer;
   this.magnitude_Sizer.spacing = 4;
   this.magnitude_Sizer.add( this.magnitude_Label );
   this.magnitude_Sizer.add( this.magnitude_SpinBox );
   this.magnitude_Sizer.addStretch();

   // Advanced controls
   this.advanced_Section = new SectionBar(this, "Advanced parameters");
   this.advanced_Control = new Control(this);
   this.advanced_Control.sizer = new VerticalSizer;
   this.advanced_Control.sizer.margin = 6;
   this.advanced_Control.sizer.spacing = 4;
   this.advanced_Section.setSection(this.advanced_Control);
   this.advanced_Control.hide();
   this.advanced_Section.onToggleSection = function(section,toggleBegin)
   {
      if(!toggleBegin){
         this.dialog.setVariableSize();
         this.dialog.adjustToContents();
         this.dialog.setFixedSize();
      }
   }


   // PROJECTION
   this.projection_Label = new fieldLabel(this, "Projection:", labelWidth1);

   this.projection_Combo = new ComboBox(this);
   this.projection_Combo.editEnabled = false;
   this.projection_Combo.toolTip = "<p>Projection used in the image.</p>";
   //this.projection_Combo.minWidth = catalogComboWidth;
   this.projection_Combo.addItem("Gnomonic");
   this.projection_Combo.addItem("Stereographic");
   this.projection_Combo.addItem("Plate-carrée");
   this.projection_Combo.addItem("Mercator");
   this.projection_Combo.addItem("Hammer-Aitoff");
   this.projection_Combo.addItem("Zenithal equal area");
   this.projection_Combo.addItem("Orthographic");
   if (solverCfg.projection != null)
      this.projection_Combo.currentItem = solverCfg.projection;
   this.projection_Combo.onItemSelected = function ()
   {
      solverCfg.projection = this.currentItem;
      solverCfg.projectionOriginMode = 0;
   };

   this.projection_Button = new PushButton(this);
   this.projection_Button.text = "Advanced";
   this.projection_Button.onClick = function ()
   {
      var projectionConfig = new ConfigProjectionDialog(solverCfg, solverCfg.projection);
      projectionConfig.execute();
   }

   this.projection_Sizer = new HorizontalSizer;
   this.projection_Sizer.spacing = 4;
   this.projection_Sizer.add(this.projection_Label);
   this.projection_Sizer.add(this.projection_Combo);
   this.projection_Sizer.add(this.projection_Button);
   this.projection_Sizer.addStretch();

   // Align Algorithm
   this.alignAlgorithm_Label = new fieldLabel(this, "Align algorithm:", labelWidth1);

   this.alignAlgorithm_Combo = new ComboBox(this);
   this.alignAlgorithm_Combo.editEnabled = false;
   this.alignAlgorithm_Combo.addItem("Triangles");
   this.alignAlgorithm_Combo.addItem("Polygons");
   this.alignAlgorithm_Combo.currentItem = solverCfg.alignAlgorithm == AlignAlgorithm.prototype.Polygons ? 1 : 0;
   this.alignAlgorithm_Combo.toolTip = "<p>This parameter sets the algorithm used by the alignment step. There are two options:</p>" +
      "<ul><li><b>Triangles</b>: Uses a triangle similarity algorithm which is fast, works in most images but have problems in images with strong distortions.</li>" +
      "<li><b>Polygons</b>: Uses an algorithm based on the comparison of polygons which is more tolerant to distortions and scale differences, but <i><u>it doesn't work with mirrored images</u></i>.</li></ul>";
   this.alignAlgorithm_Combo.onItemSelected = function ()
   {
      this.dialog.solverCfg.alignAlgorithm = this.dialog.alignAlgorithm_Combo.currentItem;
   }

   this.alignAlgorithm_Sizer = new HorizontalSizer;
   this.alignAlgorithm_Sizer.spacing = 4;
   this.alignAlgorithm_Sizer.add( this.alignAlgorithm_Label );
   this.alignAlgorithm_Sizer.add( this.alignAlgorithm_Combo );
   this.alignAlgorithm_Sizer.addStretch();

   // Noise reduction

   this.noise_Label = new fieldLabel(this, "Noise reduction:", labelWidth1);

   this.noise_SpinBox = new SpinBox( this );
   this.noise_SpinBox.minValue = 0;
   this.noise_SpinBox.maxValue = 5;
   this.noise_SpinBox.value = this.solverCfg.noiseLayers;
   this.noise_SpinBox.toolTip = "<p>Number of wavelet layers that will be removed for noise reduction. Use 0 for no noise reduction.</p>";
   this.noise_SpinBox.setFixedWidth( spinBoxWidth );
   this.noise_SpinBox.onValueUpdated = function( value )
   {
      solverCfg.noiseLayers = value;
   };

   this.noise_Sizer = new HorizontalSizer;
   this.noise_Sizer.spacing = 4;
   this.noise_Sizer.add( this.noise_Label );
   this.noise_Sizer.add( this.noise_SpinBox );
   this.noise_Sizer.addStretch();


   // Advanced controls
/*   this.distortionCorrection_Check = new CheckBox( this );
   this.distortionCorrection_Check.text = "Distortion correction";
   this.distortionCorrection_Check.checked = this.solverCfg.distortionCorrection == true;
   this.distortionCorrection_Check.toolTip = "<p>This option tries to model the distortion of the image using surface splines.</p>";
   this.distortionCorrection_Check.onCheck = function( checked )
   {
      solverCfg.distortionCorrection = checked;
      this.dialog.showDistortion_Check.enabled = checked;
      this.dialog.genDistortModel_Check.enabled = checked;
   };
   this.distortionCorrection_Sizer = new HorizontalSizer;
   this.distortionCorrection_Sizer.spacing = 4;
   //this.distortionCorrection_Sizer.addSpacing(labelWidth1);
   this.distortionCorrection_Sizer.add( this.distortionCorrection_Check );
   this.distortionCorrection_Sizer.addStretch();*/

   // Star detection (sensitivity)
   this.splineSmooth_Control = new NumericControl( this );
   this.splineSmooth_Control.real = true;
   this.splineSmooth_Control.label.text = "Spline smoothing:";
   this.splineSmooth_Control.label.minWidth = labelWidth1;
   this.splineSmooth_Control.setRange( 0, 0.5 );
   this.splineSmooth_Control.slider.setRange( 0, 1000 );
   this.splineSmooth_Control.slider.scaledMinWidth = 250;
   this.splineSmooth_Control.setPrecision(2);
   this.splineSmooth_Control.edit.minWidth = spinBoxWidth;
   this.splineSmooth_Control.setValue( this.solverCfg.splineSmoothing );
   //this.splineSmooth_Control.toolTip = "<p>Smoothing .</p>";
   this.splineSmooth_Control.onValueUpdated = function (value) { solverCfg.splineSmoothing = value; };

//   this.detection_Sizer = new HorizontalSizer;
//   this.detection_Sizer.spacing = 4;
//   this.detection_Sizer.add( this.sensitivity_Control );
//   this.detection_Sizer.add( this.showStars_Check );
//   this.detection_Sizer.addStretch();

   this.showDistortion_Check = new CheckBox( this );
   this.showDistortion_Check.text = "Show distortion map";
   this.showDistortion_Check.checked = this.solverCfg.showDistortion!=null && this.solverCfg.showDistortion;
   this.showDistortion_Check.enabled = this.solverCfg.distortionCorrection == true;
   this.showDistortion_Check.toolTip = "<p>This option generates a image that shows the distortion map of the image. "+
      "It shows the difference between the final solution and a lineal solution.</p>";
   this.showDistortion_Check.onCheck = function( checked )
   {
      solverCfg.showDistortion = checked;
   };
   /*this.showDistortion_Sizer = new HorizontalSizer;
   this.showDistortion_Sizer.spacing = 4;
   //this.showDistortion_Sizer.addSpacing(labelWidth1);
   this.showDistortion_Sizer.add( this.showDistortion_Check );
   this.showDistortion_Sizer.addStretch();*/
   this.showDistortion_Sizer = this.showDistortion_Check;

      this.genDistortModel_Check = new CheckBox(this);
   this.genDistortModel_Check.text = "Generate distortion model";
   this.genDistortModel_Check.checked = this.solverCfg.generateDistortModel != null && this.solverCfg.generateDistortModel;
   this.genDistortModel_Check.enabled = this.solverCfg.distortionCorrection == true;
   this.genDistortModel_Check.toolTip = "<p>Generates a distortion model in CSV format compatible with StarAlignment.</p>";
   this.genDistortModel_Check.onCheck = function (checked)
   {
      solverCfg.generateDistortModel = checked;
      this.dialog.useDistortModel_Check.checked = false;
   };

   this.genDistortModel_Sizer = new HorizontalSizer;
   this.genDistortModel_Sizer.spacing = 4;
   //this.genDistortModel_Sizer.addSpacing(labelWidth1);
   this.genDistortModel_Sizer.add( this.genDistortModel_Check );
   this.genDistortModel_Sizer.addStretch();

   //this.distortion_Label = new fieldLabel(this, "Distortion model:", labelWidth1);
   var distortionToolTip = "<p>When a distortion model is selected, the solver uses it " +
      "for modeling the distortion of the image. This model uses the same format as StarAlignment and " +
      "can be generated using ManualImageSolver or ImageSolver. The model should be generated using an image taken " +
      "with the same camera and lenses at the same focal and aperture.</p>";
   this.useDistortModel_Check = new CheckBox(this);
   this.useDistortModel_Check.text = "Use distortion model:";
   this.useDistortModel_Check.checked = this.solverCfg.useDistortionModel;
   this.useDistortModel_Check.enabled = this.solverCfg.distortionCorrection;
   this.useDistortModel_Check.toolTip = distortionToolTip;
   this.useDistortModel_Check.onCheck = function (checked)
   {
      solverCfg.useDistortionModel = checked;
      this.dialog.distortion_Edit.enabled = checked;
   };

   this.distortion_Edit = new Edit(this);
   if (this.solverCfg.distortionModelPath)
      this.distortion_Edit.text = this.solverCfg.distortionModelPath;
   this.distortion_Edit.setScaledMinWidth(300);
   this.distortion_Edit.enabled = this.solverCfg.distortionCorrection && this.useDistortModel_Check.checked;
   this.distortion_Edit.toolTip = distortionToolTip;
   this.distortion_Edit.onTextUpdated = function (value)
   {
      solverCfg.distortionModelPath = value;
   };


   this.distortClear_Button = new ToolButton(this);
   this.distortClear_Button.icon = this.scaledResource( ":/icons/clear.png" );
   this.distortClear_Button.setScaledFixedSize( 20, 20 );
   this.distortClear_Button.toolTip = "<p>Select a StarGenerator database file.</p>";
   this.distortClear_Button.enabled = this.solverCfg.distortionCorrection;
   this.distortClear_Button.onClick = function ()
   {
      solverCfg.distortionModelPath = null;
      this.dialog.distortion_Edit.text = "";
   };

   this.distortPath_Button = new ToolButton(this);
   this.distortPath_Button.icon = this.scaledResource( ":/icons/select-file.png" );
   this.distortPath_Button.setScaledFixedSize( 20, 20 );
   this.distortPath_Button.toolTip = "<p>Select a StarGenerator database file.</p>";
   this.distortPath_Button.enabled = this.solverCfg.distortionCorrection;
   this.distortPath_Button.onClick = function ()
   {
      var ofd = new OpenFileDialog;
      ofd.initialPath = this.dialog.distortion_Edit.text;
      ofd.caption = "Select a distortion model";
      ofd.filters = [
         ["Distortion models (*.csv)", "*.csv"]
      ];
      if (ofd.execute())
      {
         solverCfg.distortionModelPath = ofd.fileName;
         this.dialog.distortion_Edit.text = ofd.fileName;
      }
   };

   this.distortModel_Sizer = new HorizontalSizer;
   this.distortModel_Sizer.spacing = 4;
   this.distortModel_Sizer.add(this.useDistortModel_Check);
   this.distortModel_Sizer.add(this.distortion_Edit, 100);
   this.distortModel_Sizer.add(this.distortClear_Button);
   this.distortModel_Sizer.add(this.distortPath_Button);

   // Star detection (sensitivity)
   this.sensitivity_Control = new NumericControl( this );
   this.sensitivity_Control.real = true;
   this.sensitivity_Control.label.text = "Star sensitivity:";
   this.sensitivity_Control.label.minWidth = labelWidth1;
   this.sensitivity_Control.setRange( -3, 3 );
   this.sensitivity_Control.slider.setRange( 0, 1000 );
   this.sensitivity_Control.slider.scaledMinWidth = 250;
   this.sensitivity_Control.setPrecision(2);
   this.sensitivity_Control.edit.minWidth = spinBoxWidth;
   this.sensitivity_Control.setValue( this.solverCfg.sensitivity );
   this.sensitivity_Control.toolTip = "<p>Star detection sensitivity. Increase the value to detect less stars.</p>";
   this.sensitivity_Control.onValueUpdated = function (value) { solverCfg.sensitivity = value; };

   this.showStars_Check = new CheckBox( this );
   this.showStars_Check.text = "Show stars";
   this.showStars_Check.checked = this.solverCfg.showStars;
   this.showStars_Check.toolTip = "<p>When marked generates a new image with marks on the position of the detected stars in the original image.<br />It is useful for evaluating the value of the sensitivity</p>";
   this.showStars_Check.onCheck = function( checked )
   {
      solverCfg.showStars = checked;
   };


   this.detection_Sizer = new HorizontalSizer;
   this.detection_Sizer.spacing = 4;
   this.detection_Sizer.add( this.sensitivity_Control );
   this.detection_Sizer.add( this.showStars_Check );
   this.detection_Sizer.addStretch();

   // Error image

   this.residualsImg_CheckBox = new CheckBox( this );
   this.residualsImg_CheckBox .text = "Generate residuals image";
   this.residualsImg_CheckBox.checked = this.solverCfg.generateErrorImg != null && this.solverCfg.generateErrorImg;
   this.residualsImg_CheckBox.toolTip = "<p>Generates an image with the predicted position of the stars (green)" +
      "and arrows (red) pointing the actual position.<br/>" +
      "This image can be used to analyze the errors of the solution.</p>";
   this.residualsImg_CheckBox.onCheck = function( checked )
   {
      solverCfg.generateErrorImg = checked;
   };

   this.residualsImg_Sizer = new HorizontalSizer;
   this.residualsImg_Sizer.spacing = 4;
   //this.residualsImg_Sizer.addSpacing(labelWidth1);
   this.residualsImg_Sizer.add( this.residualsImg_CheckBox );
   this.residualsImg_Sizer.addStretch();

   this.advanced_Control.sizer.add(this.projection_Sizer);
   this.advanced_Control.sizer.add(this.alignAlgorithm_Sizer);
   this.advanced_Control.sizer.add(this.detection_Sizer);
   this.advanced_Control.sizer.add(this.noise_Sizer);
   //this.advanced_Control.sizer.add(this.degree_Sizer);
   this.advanced_Control.sizer.add(this.residualsImg_Sizer);

   // DISTORTION SECTION
   this.distortion_Section = new SectionBar(this, "Distortion correction");
   this.distortion_Section.enableCheckBox(true);
   this.distortion_Section.checkBox.checked = this.solverCfg.distortionCorrection == true;
   this.distortion_Section.checkBox.toolTip = "<p>This option tries to model the distortion of the image using surface splines.</p>";
   this.distortion_Section.onCheckSection = function(sectionbar)
   {
      solverCfg.distortionCorrection = sectionbar.checkBox.checked;
      this.dialog.showDistortion_Check.enabled = sectionbar.checkBox.checked;
      this.dialog.genDistortModel_Check.enabled = sectionbar.checkBox.checked;
      this.dialog.useDistortModel_Check.enabled = solverCfg.distortionCorrection;
      this.dialog.distortion_Edit.enabled = solverCfg.distortionCorrection && this.dialog.useDistortModel_Check.checked;
      this.dialog.distortClear_Button.enabled = solverCfg.distortionCorrection;
      this.dialog.distortPath_Button.enabled = solverCfg.distortionCorrection;

      if(sectionbar.isCollapsed())
         sectionbar.toggleSection();
   };
   this.distortion_Section.onToggleSection = function(section,toggleBegin)
   {
      if(!toggleBegin){
         this.dialog.setVariableSize();
         this.dialog.adjustToContents();
         this.dialog.setFixedSize();
      }
   }

   this.distortion_Control = new Frame(this);
   //this.distortion_Control.frameStyle =  FrameStyle_Styled;
   this.distortion_Control.sizer = new VerticalSizer;
   this.distortion_Control.sizer.margin = 6;
   this.distortion_Control.sizer.spacing = 4;
   this.distortion_Section.setSection(this.distortion_Control);
   this.distortion_Control.hide();
   this.distortion_Control.sizer.add(this.splineSmooth_Control);
   this.distortion_Control.sizer.add(this.showDistortion_Sizer);
   this.distortion_Control.sizer.add(this.distortModel_Sizer);
   this.distortion_Control.sizer.add(this.genDistortModel_Sizer);

//   this.dseParGroupBox = new GroupBox(this);
//   this.dseParGroupBox.title = "Model Parameters";
   this.dseParGroupBox = new Frame(this)
   this.dseParGroupBox.sizer = new VerticalSizer;
   this.dseParGroupBox.sizer.margin = 6;
   this.dseParGroupBox.sizer.spacing = 4;
   this.dseParGroupBox.sizer.add(this.dbPath_Sizer);
   this.dseParGroupBox.sizer.add(this.vizierSizer);
   this.dseParGroupBox.sizer.add(this.magnitude_Sizer);

   this.dsePar_Section = new SectionBar(this, "Model Parameters");
   this.dsePar_Section.onToggleSection = function (section, toggleBegin)
   {
      if (!toggleBegin)
      {
         this.dialog.setVariableSize();
         this.dialog.adjustToContents();
         this.dialog.setFixedSize();
      }
   }
   this.dsePar_Section.setSection(this.dseParGroupBox);

   this.Validate = function()
   {
      try{
         if (metadata.useFocal)
         {
            if ( metadata.focal <= 0 )
             throw "Invalid focal length";

            if ( metadata.xpixsz <= 0 || metadata.xpixsz > 120 )
               throw "Invalid pixel size";
         }

         if (!solverCfg.onlyOptimize  && (metadata.resolution == null || metadata.resolution <= 0 || metadata.resolution > 1800/3600) )
            throw "Invalid image resolution";

         var coords = this.coords_Editor.GetCoords();
         if ( coords.x < 0 || coords.x > 360 )
            throw "Invalid right ascension";
         if ( coords.y < -90 || coords.y > +90 )
          throw "Invalid declination";

         if(solverCfg.useDistortionModel && (solverCfg.distortionModelPath == null || solverCfg.distortionModelPath.trim().length==0))
            throw "The distortion model path is empty";

         metadata.ra = coords.x;
         metadata.dec = coords.y;

         metadata.epoch = Math.complexTimeToJD( epoch.getFullYear(), epoch.getMonth()+1, epoch.getDate() );

         return true;
      } catch (ex){
         new MessageBox( ex, TITLE, StdIcon_Error ).execute();
         return false;
      }
   };

   // usual control buttons

   this.newInstanceButton = new ToolButton( this );
   this.newInstanceButton.icon = this.scaledResource( ":/process-interface/new-instance.png" );
   this.newInstanceButton.setScaledFixedSize( 20, 20 );
   this.newInstanceButton.toolTip = "New Instance";
   this.newInstanceButton.onMousePress = function()
   {
      if( !this.dialog.Validate() )
         return;

      this.hasFocus = true;

      metadata.SaveParameters();
      solverCfg.SaveParameters();

      this.pushed = false;
      this.dialog.newInstance();
   };


   this.reset_Button = new ToolButton( this );
   //this.reset_Button.text = "Reset";
   this.reset_Button.icon = this.scaledResource( ":/icons/reload.png" );
   this.reset_Button.setScaledFixedSize( 20, 20 );
   this.reset_Button.toolTip = "<p>Resets the settings to the default values.<br />"+
      "It closes the dialog and the script must be executed again.</p>";
   this.reset_Button.onClick = function()
   {
      var msg = new MessageBox( "Do you really want to reset the settings to their default value?",
         TITLE, StdIcon_Warning, StdButton_Yes, StdButton_No );
      var res = msg.execute();
      if( res == StdButton_Yes )
      {
         this.dialog.solverCfg.ResetSettings();
         this.dialog.resetRequest = true;
         this.dialog.cancel();
      }
   };

   this.help_Button = new ToolButton(this);
   this.help_Button.icon = this.scaledResource( ":/process-interface/browse-documentation.png" );
   this.help_Button.setScaledFixedSize( 20, 20 );
   this.help_Button.toolTip = "<p>Browse Documentation</p>";
   this.help_Button.onClick = function ()
   {
      Dialog.browseScriptDocumentation("ImageSolver");
   };

   this.ok_Button = new PushButton( this );
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function()
   {
      if( !this.dialog.Validate() )
         return;

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
   this.buttons_Sizer.add( this.newInstanceButton );
   this.buttons_Sizer.add( this.reset_Button );
   this.buttons_Sizer.add(this.help_Button);
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.ok_Button );
   this.buttons_Sizer.add( this.cancel_Button );

   // Global sizer

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 6;
   this.sizer.add(this.helpLabel);
   this.sizer.addSpacing(4);
   if (showTargetImage)
   {
      this.sizer.add(this.targetImage_Section);
      this.sizer.add(this.targetImageGroup, 100);
   }
   this.sizer.add(this.dmPar_Section);
   this.sizer.add(this.dmParGroupBox);
   this.sizer.add(this.dsePar_Section);
   this.sizer.add(this.dseParGroupBox);
   this.sizer.add(this.advanced_Section);
   this.sizer.add(this.advanced_Control);
   this.sizer.add(this.distortion_Section);
   this.sizer.add(this.distortion_Control);

   this.sizer.add(this.buttons_Sizer);

   this.windowTitle = "Image Plate Solver Script";
   if (showTargetImage)
      this.EnableFileControls(); // which changes size constraints
   else
   {
      this.adjustToContents();
      this.setFixedSize();
   }
}

ImageSolverDialog.prototype = new Dialog;

// ******************************************************************
// ImageSolver: It implements the plate solving algorithm
// ******************************************************************
function ImageSolver()
{
   //var activeWindow;
   var error;
   this.solverCfg = new SolverConfiguration(SETTINGS_MODULE_SCRIPT);
   this.metadata = new ImageMetadata(SETTINGS_MODULE_SCRIPT);

   // Initializes the image solver
   // If the parameter prioritizeSettings is defined and true the solver uses the values
   // stored in the preferences instead the values obtained from the image.
   this.Init = function (w, prioritizeSettings)
   {
      this.solverCfg.LoadSettings();
      this.solverCfg.LoadParameters();

      if (prioritizeSettings)
      {
         if (w && w.isWindow)
            this.metadata.ExtractMetadata(w);
         this.metadata.LoadSettings();
         this.metadata.LoadParameters();
      }
      else
      {
         this.metadata.LoadSettings();
         this.metadata.LoadParameters();
         if (w && w.isWindow)
            this.metadata.ExtractMetadata(w);
      }
   };

   this.DoAlign = function( view )
   {
      var align = new StarAlignment;
      align.referenceImage = STAR_CSV_FILE;
      align.referenceIsFile = true;
      align.writeKeywords = false;
      //align.matcherTolerance = 0.01; //0.0030;
      //align.ransacTolerance = 8.0; //6.00;
      align.useSurfaceSplines = true;
      align.sensitivity = Math.pow(10, this.solverCfg.sensitivity);
      align.noGUIMessages = true;
      align.useTriangles = this.solverCfg.alignAlgorithm != AlignAlgorithm.prototype.Polygons;
      align.polygonSides = 5;
      //align.onError = StarAlignment.prototype.Continue;
      if(this.solverCfg.useDistortionModel)
         align.distortionModel = this.solverCfg.distortionModelPath;
      if(this.solverCfg.distortionCorrection)
      {
         align.distortionCorrection = true;
         align.distortionMaxIterations = 50;
         //align.distortionTolerance = 0.005;
         align.distortionTolerance = 0.25;
      }
      align.undistortedReference = true;
      if(this.solverCfg.noiseLayers>0)
         align.noiseLayers = this.solverCfg.noiseLayers;

      if ( this.solverCfg.showStars && !this.starsShown)
      {
         align.mode = StarAlignment.prototype.DrawStars;
         align.executeOn( view, false );
         this.starsShown = true;
      }

      align.mode = StarAlignment.prototype.OutputMatrix;

      if(align.useTriangles)
         console.writeln("Using Triangle similarity algorithm");
      else
         console.writeln("Using Polygon algorithm with ", align.polygonSides, " sides");

      var res=align.executeOn( view, false );
      if(!res)
         throw "The image could not be aligned with the reference star field";

      var aligndata = align.outputData[0].slice( 11, 17 );
      aligndata[6] = 0;
      aligndata[7] = 0;
      aligndata[8] = 1;

      // TEMPORAL: StarAlignment uses a different convention for the origin
      // of the coordinates of the stars.
      // BugReport: http://pixinsight.com/forum/index.php?topic=4371.0
      aligndata[2] += 0.5;
      aligndata[5] += 0.5;
      // ***

      var oldMatrix = new Matrix( aligndata, 3, 3 );

      var numPairs = align.outputData[0][2];
      var pairs = {
         oldMatrix: oldMatrix,
         pS: [],
         pI: []
      };
      for(var i=0; i<numPairs; i++){
         pairs.pS.push(new Point(align.outputData[0][29][i],
            align.outputData[0][30][i]));
         pairs.pI.push(new Point(align.outputData[0][31][i],
            align.outputData[0][32][i]));
      }
      return pairs;
   };

   this.GenerateTemplate = function( metadata )
   {
      var templateWidth, templateHeight;
 /*     if ( this.solverCfg.templateSizeFactor > 1 )
      {*/
         //var templateSize = Math.floor( Math.max( metadata.width, metadata.height )*this.solverCfg.templateSizeFactor );
         var templateSize = Math.max( metadata.width, metadata.height );
         templateWidth = templateSize;
         templateHeight = templateSize;
/*      }
      else
      {
         templateWidth = Math.max( 256, metadata.width );
         templateHeight = Math.max( 256, metadata.height );
      }*/

      metadata.ref_S_G = new Matrix(
         -metadata.resolution,  0,                   metadata.resolution*templateWidth/2,
          0,                   -metadata.resolution, metadata.resolution*templateHeight/2,
          0,                    0,                   1 );

      metadata.projection = ProjectionFactory(this.solverCfg, metadata.ra, metadata.dec );

      if ( this.solverCfg.catalogMode==0 )
      {
         var generator = new StarGenerator;

         if ( this.solverCfg.databasePath )
            generator.starDatabasePath = this.solverCfg.databasePath;
         generator.centerRA = metadata.ra;
         generator.centerDec = metadata.dec;
         if (!metadata.epoch)
         {
            var epoch = new Date(Date.now());
            generator.epoch = Math.complexTimeToJD(epoch.getFullYear(), epoch.getMonth() + 1, epoch.getDate());
         }
         else
            generator.epoch = metadata.epoch;
         if(this.solverCfg.projection!=0)
            throw "The local catalog only supports the Gnomonic projection. Please select an only catalog.";
         generator.projectionSystem = StarGenerator.prototype.Gnomonic;

         if ( metadata.useFocal )
         {
            generator.focalLength = metadata.focal;
            generator.pixelSize = metadata.xpixsz;
            metadata.resolution = metadata.ResolutionFromFocal( metadata.focal );
         }
         else
         {
            if ( metadata.xpixsz > 0 )
            {
               generator.focalLength = metadata.FocalFromResolution( metadata.resolution );
               generator.pixelSize = metadata.xpixsz;
            }
            else
            {
               generator.pixelSize = 10;
               generator.focalLength = generator.pixelSize/metadata.resolution*0.18/Math.PI;
            }
         }

         generator.limitMagnitude = this.solverCfg.magnitude;
         generator.outputMode = StarGenerator.prototype.Output_CSVFile;
         generator.outputFilePath = STAR_CSV_FILE;
         generator.sensorWidth = templateWidth;
         generator.sensorHeight = templateHeight;
         generator.executeGlobal();
      } else {
         if( !this.catalog )
            this.catalog = __catalogRegister__.GetCatalog(this.solverCfg.catalog);

         this.catalog.magMax = this.solverCfg.magnitude;
         this.catalog.Load( metadata, this.solverCfg.vizierServer );
         var ref_G_S = metadata.ref_S_G.inverse();

         var file = new File;
         file.createForWriting( STAR_CSV_FILE );
         file.outTextLn( templateWidth+","+templateHeight );
         var elements = this.catalog.objects;
         for( var i=0; i<elements.length; i++ )
         {
            if ( elements[i] )
            {
               var flux = Math.pow(2.512, -1.5 - elements [i].magnitude);
               var pos_G = metadata.projection.Direct(elements [i].posRD);
               if (pos_G)
               {
                  var pos_S = ref_G_S.Apply(metadata.projection.Direct(elements [i].posRD));
                  if (pos_S.x > 0 && pos_S.x < templateWidth && pos_S.y > 0 && pos_S.y < templateHeight)
                     file.outTextLn(format("%f,%f,%g", pos_S.x, pos_S.y, flux));
               }
            }
         }
         file.close();
      }
   };

   this.DoIterationSA = function (window, metadata)
   {
      console.writeln("Starting StarAlignment iteration");
      // Render a star field around the original coordinates
      this.GenerateTemplate(metadata);

      try
      {
         var pairs = this.DoAlign(window.currentView);
         var newMetadata = metadata.Clone();
         var pG = [];
         for (var i = 0; i < pairs.pS.length; i++)
            pG.push(metadata.ref_S_G.Apply(pairs.pS[i]));
         if (this.distortionModel)
            this.MetadataFromDistortionModel(newMetadata, pairs.pI, pG, null);
         else if (this.solverCfg.distortionCorrection)
         {
            newMetadata.ref_I_G_lineal = MultipleLinearRegression(1, pairs.pI, pG).ToLinealMatrix();
            newMetadata.ref_I_G = new ReferSpline(pairs.pI, pG, null, 2, this.solverCfg.splineSmoothing);
            //newMetadata.ref_I_G_lineal.Print();
            //metadata.ref_S_G.mul(pairs.oldMatrix.inverse()).Print();
            processEvents();
            newMetadata.ref_G_I = new ReferSpline(pG, pairs.pI, null, 2, this.solverCfg.splineSmoothing);
            processEvents();

            newMetadata.controlPoints = {
               pI: pairs.pI,
               pG: pG
            };
         }
         else
         {
            newMetadata.ref_I_G = MultipleLinearRegression(1, pairs.pI, pG);
            newMetadata.ref_I_G_lineal = newMetadata.ref_I_G.ToLinealMatrix();
            newMetadata.ref_G_I = newMetadata.ref_I_G_lineal.inverse();
            newMetadata.controlPoints = null;
         }

         // Find the celestial coordinates (RD) of the center of the original image
         // First transform from I to G and then unprojects the gnomonic coords (G) to celestial (RD)
         var centerI = new Point(metadata.width / 2, metadata.height / 2);
         var centerG = newMetadata.ref_I_G.Apply(centerI);
         //newMetadata.ref_I_G_lineal = MultipleLinearRegressionHelmert(pairs.pI, pG, centerI, centerG);

         var centerRD = newMetadata.projection.Inverse(centerG);
         if (centerRD.x < 0)
            centerRD.x += 360;
         else if (centerRD.x > 360)
            centerRD.x -= 360;
         newMetadata.ra = centerRD.x;
         newMetadata.dec = centerRD.y;
         var ref = newMetadata.ref_I_G_lineal;
         var resx = Math.sqrt(ref.at(0, 0) * ref.at(0, 0) + ref.at(0, 1) * ref.at(0, 1));
         var resy = Math.sqrt(ref.at(1, 0) * ref.at(1, 0) + ref.at(1, 1) * ref.at(1, 1));
         newMetadata.resolution = (resx + resy) / 2;
         newMetadata.focal = newMetadata.FocalFromResolution(newMetadata.resolution);
         newMetadata.useFocal = false;

         return newMetadata;
      }
      catch (ex)
      {
         console.criticalln("*** Error: ", ex);
         console.writeln("<html>Please check the following items:<ul>" +
            "<li>The initial coordinates should be inside the image.</li>" +
            "<li>The initial resolution should be in a factor of 2 of the correct value.</li>" +
            "<li>Adjust the sensitivity so the script detects most of the stars in the image without mistaking noise for stars.</li>" +
            "<li>The catalog should be matched to the image. Choose the catalog and magnitude filter so the number of" +
            "stars extracted from the catalog is similar to the number of stars detected in the image.</li>" +
            "</ul></html>")
         return null;
      }
   };

   this.MetadataFromDistortionModel = function (newMetadata, pI, pG, weights)
   {
      var starsU = [];
      for (var i = 0; i < pI.length; i++)
      {
         var pointU = null;
         if (pI[i])
         {
            var offset = this.distortModel.ref_D_offset.Apply(pI[i]);
            pointU = new Point(pI[i].x - offset.x, pI[i].y - offset.y);
         }
         starsU.push(pointU);
      }

      var ref_U_G = MultipleLinearRegression(1, starsU, pG).ToLinealMatrix();

      var cpG = [];
      for (var i = 0; i < this.distortModel.pU.length; i++)
         cpG.push(ref_U_G.Apply(this.distortModel.pU[i]));

      newMetadata.ref_I_G = new ReferSpline(this.distortModel.pD, cpG, null, 2, 0, 2000);
      newMetadata.ref_I_G_lineal = MultipleLinearRegression(1, this.distortModel.pD, cpG).ToLinealMatrix();
      processEvents();
      newMetadata.ref_G_I = new ReferSpline(cpG, this.distortModel.pD, null, 2, 0, 2000);
      processEvents();
      newMetadata.controlPoints = {
         pI:      this.distortModel.pD,
         pG:      cpG,
         weights: null
      };
   };

   this.LoadDistortionModel = function (path)
   {
      var lines = File.readLines(path);
      if (lines == null || lines.length < 1)
         throw "Couldn't read the distortion model";

      var pD = [];
      var pU = [];
      var offset = [];
      for (var i = 1; i < lines.length; i++)
      {
         var tokens = lines[i].split(",");
         if (tokens == null || tokens.length != 4)
            continue;
         pD.push(new Point(parseFloat(tokens[0]), parseFloat(tokens[1])));
         pU.push(new Point(parseFloat(tokens[0]) - parseFloat(tokens[2]), parseFloat(tokens[1]) - parseFloat(tokens[3])));
         offset.push(new Point(parseFloat(tokens[2]), parseFloat(tokens[3])));
      }
      return {
         pD:           pD,
         pU:           pU,
         ref_D_U:      new ReferSpline(pD, pU, null, 2, 0),
         ref_U_D:      new ReferSpline(pU, pD, null, 2, 0),
         ref_D_offset: new ReferSpline(pD, offset, null, 2, 0)
      };
   }

   this.FindStarsInImage = function (window, predictedCoords, tolerance)
   {
      console.writeln("Fit known stars")
      var DPSF = new DynamicPSF;
      DPSF.views = [
         // id
         [window.mainView.id]
      ];

      var searchRadius = 2;
      var stars = [];
      var psf = [];
      var translateIdx = {};
      for (var i = 0; i < predictedCoords.length; i++)
      {
         //var pI=new Point(predictedCoords[i].x+Math.random()*6-3,predictedCoords[i].y+Math.random()*6-3);
         var pI=predictedCoords[i];

         stars.push(
            [0, 0, DynamicPSF.prototype.Star_DetectedOk,
               pI.x - searchRadius, pI.y - searchRadius,
               pI.x + searchRadius, pI.y + searchRadius,
               pI.x, pI.y]);
         translateIdx[psf.length] = i;
         psf.push(
            [psf.length, DynamicPSF.prototype.Function_Moffat4, false, DynamicPSF.prototype.PSF_FittedOk,
               0.022934, 1.190503,
               pI.x, pI.y,
               3.174, 3.043, 166.57, 4.00, 3.826e-003]);
      }
      DPSF.stars = stars;
      DPSF.psf = psf;
      DPSF.autoAperture = true;
      DPSF.searchRadius = searchRadius;
      DPSF.autoPSF = false;
      DPSF.gaussianPSF = true;
      DPSF.circularPSF = false;
      DPSF.moffatPSF = DPSF.moffat10PSF = DPSF.moffat8PSF = DPSF.moffat6PSF =
         DPSF.moffat4PSF = DPSF.moffat25PSF = DPSF.moffat15PSF =
            DPSF.lorentzianPSF = false;
      //console.writeln(DPSF.toSource());
      var res = DPSF.executeGlobal();
      psf = DPSF.psf;
      //console.writeln("OK imgX imgY dpsfX dpsfY sigma starX starY");
      var actualCoords = Array(predictedCoords.length);
      var valid =0;
      for (var i = 0; i < psf.length; i++)
      {
         var starIdx = translateIdx[psf[i][0]];
         if (psf[i][3] == DynamicPSF.prototype.PSF_FittedOk){
            var B = psf[i][4];
            var A = psf[i][5];
            if(A>B*0.25){
               actualCoords[starIdx] = new Point(psf[i][6], psf[i][7]);
               valid++;
            }
         //console.writeln(format("idx:%d Pred:%ls Act:%ls", starIdx, predictedCoords[starIdx].toString(),actualCoords[starIdx].toString()));
            //console.writeln(format("%f %f", A, B));
         }
         //else console.writeln("0 0");
      }
      console.writeln("Valid fittings:", valid);

      if(!this.solverCfg.distortionCorrection)
         return actualCoords;

      // ------------
      console.writeln(format("Search stars in a radius of %.0f pixels", tolerance));
      searchRadius = tolerance;
      stars = [];
      psf = [];
      translateIdx = {};
      for (var i = 0; i < predictedCoords.length; i++)
      {
         //var pI=new Point(predictedCoords[i].x+Math.random()*6-3,predictedCoords[i].y+Math.random()*6-3);
         if(actualCoords[i])
            continue;
         var pI=predictedCoords[i];

         stars.push(
            [0, 0, DynamicPSF.prototype.Star_DetectedOk,
               pI.x - searchRadius, pI.y - searchRadius,
               pI.x + searchRadius, pI.y + searchRadius,
               pI.x, pI.y]);
         translateIdx[psf.length] = i;
         psf.push(
            [psf.length, DynamicPSF.prototype.Function_Moffat4, false, DynamicPSF.prototype.PSF_FittedOk,
               0.022934, 1.190503,
               pI.x, pI.y,
               3.174, 3.043, 166.57, 4.00, 3.826e-003]);
      }
      DPSF.stars = stars;
      DPSF.psf = psf;
      DPSF.autoAperture = true;
      DPSF.searchRadius = searchRadius;
      DPSF.autoPSF = false;
      DPSF.gaussianPSF = true;
      DPSF.circularPSF = false;
      DPSF.moffatPSF = DPSF.moffat10PSF = DPSF.moffat8PSF = DPSF.moffat6PSF =
         DPSF.moffat4PSF = DPSF.moffat25PSF = DPSF.moffat15PSF =
            DPSF.lorentzianPSF = false;
      //console.writeln(DPSF.toSource());
      res = DPSF.executeGlobal();
      psf = DPSF.psf;
      //console.writeln("OK imgX imgY dpsfX dpsfY sigma starX starY");
      valid = 0;
      for (var i = 0; i < psf.length; i++)
      {
         var starIdx = translateIdx[psf[i][0]];
         if (psf[i][3] == DynamicPSF.prototype.PSF_FittedOk)
         {
            var B = psf[i][4];
            var A = psf[i][5];
            if (A < B * 0.25)
               continue;
            var p = new Point(psf[i][6], psf[i][7]);
            var foundSimilar = false;
            for (var k = 0; !foundSimilar && k < actualCoords.length; k++)
               if (actualCoords[k])
                  foundSimilar = Math.abs(actualCoords[k].x - p.x) < 0.5 && Math.abs(actualCoords[k].y - p.y) < 0.5;
            if (!foundSimilar)
            {
               actualCoords[starIdx] = p;
               valid++;
            }
         }
      }
      console.writeln("Valid fittings:", valid);

      return actualCoords;
   }

   this.ApplySTF = function(view, stf)
   {
      var low=(stf[0][1]+stf[1][1]+stf[2][1])/3;
      var mtf=(stf[0][0]+stf[1][0]+stf[2][0])/3;
      var hgh=(stf[0][2]+stf[1][2]+stf[2][2])/3;

      if ( low > 0 || mtf != 0.5 || hgh != 1 ) // if not an identity transformation
      {
         console.writeln(format("<b>Applying STF to '%ls'</b>:\x1b[38;2;100;100;100m",view.id));
         var HT = new HistogramTransformation;
         HT.H = [[  0, 0.5,   1, 0, 1],
            [  0, 0.5,   1, 0, 1],
            [  0, 0.5,   1, 0, 1],
            [low, mtf, hgh, 0, 1],
            [  0, 0.5,   1, 0, 1]];

         HT.executeOn( view, false ); // no swap file
         console.write("\x1b[0m");
      }
   }

   this.DrawErrors = function(targetWindow, metadata, stars)
   {
      if(!stars)
         return;
      console.writeln("Creating error map");

      // Draw errors in a new bitmap
      var bmp = new Bitmap(metadata.width, metadata.height);

      //Copy the source image to the error image
      var imageOrg = targetWindow.mainView.image;
      var tmpW = new ImageWindow(metadata.width, metadata.height, imageOrg.numberOfChannels, targetWindow.bitsPerSample, targetWindow.isFloatSample, imageOrg.isColor, targetWindow.mainView.id+ "_Errors");
      tmpW.mainView.beginProcess(UndoFlag_NoSwapFile);
      tmpW.mainView.image.apply(imageOrg);
      this.ApplySTF(tmpW.mainView, targetWindow.mainView.stf);
      tmpW.mainView.endProcess();
      bmp.assign(tmpW.mainView.image.render());
      tmpW.close();

      //bmp.fill(0xff000000);
      var g = new VectorGraphics(bmp);
      g.antialiasing = true;
      var linePen = new Pen(0xffff4040, 1);
      var starPen = new Pen(0xff40ff40, 1);
      var badStarPen = new Pen(0xffff4040, 1);
      for(var i=0; i<stars.actualCoords.length; i++)
      {
         var predicted = metadata.Convert_RD_I(stars.starCoords[i]);
         if(predicted)
         {
            if(stars.actualCoords[i])
            {
               var arrow= new Point(
                  predicted.x+(stars.actualCoords[i].x-predicted.x)*1,
                  predicted.y+(stars.actualCoords[i].y-predicted.y)*1);
               g.pen=linePen;
               g.drawLine(predicted,arrow);
               g.pen=starPen;
            } else {
               g.pen=badStarPen;
            }
            g.drawLine(predicted.x-10,predicted.y,predicted.x-5,predicted.y);
            g.drawLine(predicted.x+10,predicted.y,predicted.x+5,predicted.y);
            g.drawLine(predicted.x,predicted.y-10,predicted.x,predicted.y-5);
            g.drawLine(predicted.x,predicted.y+10,predicted.x,predicted.y+5);
         }
      }

      /* Debugging: Paint position of the control points
      if(metadata.controlPoints){
         g.pen = new Pen(0xffffff00);
         for(var i=0; i<metadata.controlPoints.pI.length; i++){
            var pI = metadata.controlPoints.pI[i];
            if(pI)
               g.strokeEllipse(pI.x-5, pI.y-5, pI.x+5, pI.y+5, g.pen);
         }
      }*/
      g.end();

      // Create an ImageWindow for showing the bitmap
      var errW = new ImageWindow(metadata.width, metadata.height,
         3, 8, false, true, targetWindow.mainView.id+ "_Errors");
      errW.mainView.beginProcess(UndoFlag_NoSwapFile);

      // Blend annotation with target image
      errW.mainView.image.blend(bmp);

      // Copy keywords to target image
      errW.keywords = targetWindow.keywords;

      errW.mainView.endProcess();
      errW.show();
   };

   this.DrawDistortions = function(targetWindow, metadata)
   {
      console.writeln("Creating distortion map");

      var ref_I_G_lineal = metadata.ref_I_G_lineal;
      if(metadata.controlPoints){
         var centerI = new Point(metadata.width / 2, metadata.height / 2);
         var centerG = metadata.ref_I_G.Apply(centerI);
         ref_I_G_lineal = MultipleLinearRegressionHelmert(metadata.controlPoints.pI, metadata.controlPoints.pG, centerI, centerG);
      }

      // Draw errors in a new bitmap
      var bmp = new Bitmap(metadata.width, metadata.height);

      bmp.fill(0xffffffff);
      var g = new VectorGraphics(bmp);
      g.antialiasing = true;
      var linePen = new Pen(0xff000000, 2);
      var starPen = new Pen(0xff800000, 2);
      g.pen=starPen;
      var cellSize=Math.min(metadata.width, metadata.height)/40;
      cellSize=Math.max(40,cellSize);

      var errorScale = 1;
      for(var y=0; y<metadata.height; y+=cellSize)
         for(var x=0; x<metadata.width; x+=cellSize)
         {
            var posLinealI = new Point(x+cellSize/2,y+cellSize/2);
            var posG = ref_I_G_lineal.Apply(posLinealI);
            var posDistortI = metadata.ref_G_I.Apply(posG);
            if(!posDistortI)
               continue;
            var arrow = new Point(posDistortI.x+(posLinealI.x-posDistortI.x)*errorScale, posDistortI.y+(posLinealI.y-posDistortI.y)*errorScale);
            g.drawLine(posDistortI, arrow);
            g.drawEllipse(posDistortI.x-1,posDistortI.y-1,posDistortI.x+1,posDistortI.y+1);
         }
      g.pen=linePen;
      for (var y = 0; y-cellSize <= metadata.height; y += cellSize)
      {
         var pts = [];
         for (var x = 0; x-cellSize <= metadata.width; x += cellSize)
         {
            var posLinealI = new Point(x, y);
            var posG = ref_I_G_lineal.Apply(posLinealI);
            pts.push(metadata.ref_G_I.Apply(posG));
         }
         g.drawPolyline(pts);
      }
      for (var x = 0; x-cellSize <= metadata.width; x += cellSize)
      {
         var pts = [];
         for (var y = 0; y-cellSize <= metadata.height; y += cellSize)
         {
            var posLinealI = new Point(x, y);
            var posG = ref_I_G_lineal.Apply(posLinealI);
            pts.push(metadata.ref_G_I.Apply(posG));
         }
         g.drawPolyline(pts);
      }
      g.end();

      // Create an ImageWindow for showing the bitmap
      var errW = new ImageWindow(metadata.width, metadata.height,
         3, 8, false, true, targetWindow.mainView.id+ "_Distortions");
      errW.mainView.beginProcess(UndoFlag_NoSwapFile);

      // Blend annotation with target image
      errW.mainView.image.blend(bmp);

      // Copy keywords to target image
      errW.keywords = targetWindow.keywords;

      errW.mainView.endProcess();
      errW.show();
   };

   this.GenerateDistortionModel = function (metadata, path)
   {
      console.writeln("Generating distortion model: ", path);

      var file = new File();
      try
      {
         file.create(path);
         file.outTextLn("ThinPlate,2");

         var ref_I_G_lineal = metadata.ref_I_G_lineal;
         if (metadata.controlPoints)
         {
            var centerI = new Point(metadata.width / 2, metadata.height / 2);
            var centerG = metadata.ref_I_G.Apply(centerI);
            ref_I_G_lineal = MultipleLinearRegressionHelmert(metadata.controlPoints.pI, metadata.controlPoints.pG, centerI, centerG);
         }

         for(var y=0; y<=30; y++)
         {
            for(var x=0; x<=30; x++)
            {
               var posLinealI = new Point(metadata.width/30*x, metadata.height/30*y);
               var posG = ref_I_G_lineal.Apply(posLinealI);
               var posDistortI = metadata.ref_G_I.Apply(posG);
               var dx = posDistortI.x - posLinealI.x;
               var dy = posDistortI.y - posLinealI.y;

               file.outTextLn(format("%f,%f,%f,%f", posLinealI.x, posLinealI.y, dx, dy));
            }
         }
      } finally
      {
         file.close();
      }
   }

   this.DetectStars = function (window, metadata, clipArea, tolerance)
   {
      if (clipArea == null)
         clipArea = new Rect(0, 0, metadata.width, metadata.height);
      // Load stars
      var catalogObjects;
      if ( this.solverCfg.catalogMode==0 )
      {
         var templateSize = Math.max(metadata.width, metadata.height) * Math.sqrt(2);
         var generator = new StarGenerator;

         if ( this.solverCfg.databasePath )
            generator.starDatabasePath = this.solverCfg.databasePath;
         generator.centerRA = metadata.ra;
         generator.centerDec = metadata.dec;
         if (!metadata.epoch)
         {
            var epoch = new Date(Date.now());
            generator.epoch = Math.complexTimeToJD(epoch.getFullYear(), epoch.getMonth() + 1, epoch.getDate());
         }
         else
            generator.epoch = metadata.epoch;
         generator.projectionSystem = StarGenerator.prototype.Gnomonic;
         generator.pixelSize = 10;
         generator.focalLength = generator.pixelSize/metadata.resolution*0.18/Math.PI;
         generator.limitMagnitude = this.solverCfg.magnitude;
         generator.outputMode = StarGenerator.prototype.Output_CSVFile;
         generator.outputFilePath = STAR_CSV_FILE;
         generator.sensorWidth = templateSize;
         generator.sensorHeight = templateSize;
         generator.executeGlobal();

         var ref_S_G = new Matrix(
            -metadata.resolution, 0,                   metadata.resolution*templateSize/2,
            0,                   -metadata.resolution, metadata.resolution*templateSize/2,
            0,                    0,                   1 );

         var projection = new Gnomonic( 180/Math.PI, metadata.ra, metadata.dec );

         // Read the positions of the stars from the file written by StarGenerator
         var lines= File.readLines(STAR_CSV_FILE);
         catalogObjects=[];
         for(var i=0; i<lines.length; i++)
         {
            //console.writeln("Line: ", lines[i]);
            var tokens=lines[i].split(",");
            if(tokens.length!=3)
               continue;

            var posS = new Point(parseFloat(tokens[0]), parseFloat(tokens[1]));
            var posG = ref_S_G.Apply(posS);
            var posRD = projection.Inverse(posG);
            var flux = parseFloat(tokens[2]);
            var mag = -1.5-2.5*Math.log10(flux);
            catalogObjects.push({posRD:posRD, magnitude:mag});
         }
      } else {
         if (!this.catalog)
            this.catalog = __catalogRegister__.GetCatalog(this.solverCfg.catalog);

         //catalog.magMin = 15;
         this.catalog.magMax = this.solverCfg.magnitude;
         this.catalog.Load(metadata, this.solverCfg.vizierServer);
         catalogObjects = this.catalog.objects;
      }
      if(catalogObjects==null || catalogObjects.length<10)
         throw "The solver has found too few stars in the catalog";
      catalogObjects.sort(function(a,b) {
         if(a.magnitude && b.magnitude)
            return a.magnitude - b.magnitude;
         else if(a.magnitude)
            return 1;
         else
            return b.magnitude ? -1 : 0;
      });

      // Create the arrays starCoords, coordsG and predictedCoords
      var result = {starCoords:[], coordsG:[], magnitudes:[]};
      var predictedCoords = []; // Pixel coordinates of the catalog stars obtained using the current referentiation
      //result.projection = new Gnomonic(180 / Math.PI, metadata.ra, metadata.dec); // New projection using the new center
      result.projection = ProjectionFactory(this.solverCfg, metadata.ra, metadata.dec);
      for (var i = 0; i < catalogObjects.length; i++)
      {
         if (catalogObjects[i])
         {
            var posI = metadata.Convert_RD_I(catalogObjects[i].posRD);
            if(posI && posI.x>=clipArea.left && posI.y>=clipArea.top && posI.x<=clipArea.right && posI.y<=clipArea.bottom)
            {
               predictedCoords.push(posI);
               result.coordsG.push(result.projection.Direct(catalogObjects[i].posRD));
               result.starCoords.push(catalogObjects[i].posRD);
               result.magnitudes.push(catalogObjects[i].magnitude);

               //console.writeln(catalogObjects[i].magnitude);
            }
         }
      }

      // Find the stars in the image using predictedCoords as starting point
      result.actualCoords = this.FindStarsInImage(window, predictedCoords, tolerance);
      //result.actualCoords = predictedCoords; // TEMPORAL - DEBUG

      // Calculate errors
      result.errors2 = Array(predictedCoords.length);
      var stddev2=0;
      var numFitted=0;
      for (var i = 0; i < predictedCoords.length; i++)
      {
         if (result.actualCoords[i])
         {
            var errx = predictedCoords[i].x - result.actualCoords[i].x;
            var erry = predictedCoords[i].y - result.actualCoords[i].y;
            numFitted++;
            stddev2 += errx * errx + erry * erry;
            result.errors2[i]=errx * errx + erry * erry;
         }
      }
      stddev2/=numFitted;

      // Remove stars with too high error (>3*sigma)
      var sum = 0;
      var nsigma = 1.5;
      var nsigma2 = nsigma * nsigma;
      var maxTolerance = tolerance * tolerance;
      result.numValid = 0;
      result.numRejected = 0;
      console.writeln(format("Error StdDev=%.2f pixels", Math.sqrt(stddev2)));
      var tolerance2 = Math.min(stddev2 * nsigma2, maxTolerance);
      console.writeln(format("Tolerance for rejecting stars: %.2f pixels", Math.sqrt(tolerance2)));
      for (var i = 0; i < predictedCoords.length; i++)
      {
         if (result.actualCoords[i])
         {
            if (result.errors2[i] > tolerance2)
            {
               result.actualCoords[i] = null;
               result.numRejected++;
            }
            else
            {
               sum += result.errors2[i];
               result.numValid++;
            }
         }
      }
      if (result.numValid > 0)
         result.rms = Math.sqrt(sum / result.numValid);

      this.CalculateSplineWeights(metadata, result, tolerance2);

      console.writeln("Stars: valid=", result.numValid, " rejected=", result.numRejected);

      result.score = result.numValid * 2 / (1 + result.rms)

      return result;
   }

   this.CalculateSplineWeights = function (metadata, stars, tolerance2)
   {
      stars.weights = new Array(stars.length);
      var maxRadius = Math.sqrt(metadata.width*metadata.width+metadata.height*metadata.height)/2;
      for(var i=0; i<stars.actualCoords.length; i++)
      {
         if(!stars.actualCoords[i])
            continue;
         var dx = stars.actualCoords[i].x-metadata.width/2;
         var dy = stars.actualCoords[i].y-metadata.height/2;
         var radius = Math.sqrt(dx*dx+dy*dy)/maxRadius;
         var radiusWeight = radius*radius*0.75+0.25;
         var errorWeight = 1/(Math.sqrt(stars.errors2[i])+1); //1-stars.errors2[i]/tolerance2;
         //var errorWeight = Math.sqrt(stars.errors2[i])+1; //1-stars.errors2[i]/tolerance2;
//         stars.weights[i] = Math.sqrt(radiusWeight * errorWeight);
         stars.weights[i] = radiusWeight; // * errorWeight;
         //stars.weights[i] = errorWeight;// *stars.magnitudes[i];
      }
   }

   this.GetDistortion = function (metadata)
   {
      var incx = (metadata.width - 0.01) / Math.round(metadata.width / 20);
      var incy = (metadata.height - 0.01) / Math.round(metadata.height / 20);
      var pD = []; // DistortedCoords
      var pL = []; // LinealCoords
      var ref_G_I_lineal = metadata.ref_I_G_lineal.inverse();
      for (var y = 0; y <= metadata.height; y += incy)
         for (var x = 0; x <= metadata.width; x += incx)
         {
            var p = new Point(x, y);
            var pG = metadata.ref_I_G.Apply(p);
            var pLineal = ref_G_I_lineal.Apply(pG);
            pD.push(p);
            pL.push(pLineal);
         }
      console.writeln("nump: ", pD.length);
      var distortion = {
         ref_D_L:MultipleLinearRegression(metadata.ref_I_G.polDegree, pD, pL),
         ref_L_D:MultipleLinearRegression(metadata.ref_I_G.polDegree, pL, pD)
      };

      console.writeln(distortion.ref_D_L.toString());
      console.writeln(distortion.ref_L_D.toString());
      return distortion;
   }

   this.DoIterationLineal = function (metadata, stars)
   {
      console.writeln("Starting Lineal iteration.");
      console.flush();
      processEvents();

      // Find referentiation matrices
      var newMetadata = metadata.Clone();
      newMetadata.projection = stars.projection;
      newMetadata.ref_I_G = MultipleLinearRegression(1,stars.actualCoords, stars.coordsG).ToLinealMatrix();
      newMetadata.ref_I_G_lineal = newMetadata.ref_I_G;
      newMetadata.ref_G_I = newMetadata.ref_I_G.inverse();
      newMetadata.controlPoints = null;

      // Find the celestial coordinates (RD) of the center of the original image
      // First transform from I to G and then unprojects the gnomonic coords (G) to celestial (RD)
      var centerI = new Point(metadata.width / 2, metadata.height / 2);
      var centerG = newMetadata.ref_I_G.Apply(centerI);
      //newMetadata.ref_I_G_lineal = MultipleLinearRegressionHelmert(stars.actualCoords, stars.coordsG, centerI, centerG);
      var centerRD = newMetadata.projection.Inverse(centerG);
      while (centerRD.x < 0)
         centerRD.x += 360;
      while (centerRD.x > 360)
         centerRD.x -= 360;
      newMetadata.ra = Math.abs(metadata.ra-centerRD.x)<1 ? (metadata.ra+centerRD.x*2)/3: centerRD.x;
      newMetadata.dec = Math.abs(metadata.dec-centerRD.y)<1 ? (metadata.dec+centerRD.y*2)/3: centerRD.y;
      var ref = newMetadata.ref_I_G_lineal;
      var resx = Math.sqrt(ref.at(0, 0) * ref.at(0, 0) + ref.at(0, 1) * ref.at(0, 1));
      var resy = Math.sqrt(ref.at(1, 0) * ref.at(1, 0) + ref.at(1, 1) * ref.at(1, 1));
      newMetadata.resolution = (resx + resy) / 2;
      newMetadata.focal = newMetadata.FocalFromResolution(newMetadata.resolution);
      newMetadata.useFocal = false;

      return newMetadata;
   }

   this.DoIterationSpline = function (metadata, stars, smoothing, useDistortionModel)
   {
      console.flush();
      processEvents();

      // Find referentiation matrices
      var newMetadata = metadata.Clone();
      newMetadata.projection = stars.projection;
      if(useDistortionModel){
         console.writeln("Starting Spline iteration with distortion model.");
         this.MetadataFromDistortionModel(newMetadata, stars.actualCoords, stars.coordsG, stars.weights);
      } else /*if(this.solverCfg.distortionCorrection)*/{
         console.writeln("Starting Spline iteration.");
         newMetadata.ref_I_G = new ReferSpline(stars.actualCoords, stars.coordsG, stars.weights, 2, smoothing, 2000);
         newMetadata.ref_I_G_lineal = MultipleLinearRegression(1,stars.actualCoords, stars.coordsG).ToLinealMatrix();
         processEvents();
         newMetadata.ref_G_I = new ReferSpline(stars.coordsG, stars.actualCoords, stars.weights, 2, smoothing, 2000);
         processEvents();

         newMetadata.controlPoints = {
            pI: stars.actualCoords,
            pG: stars.coordsG,
            weights: stars.weights
         };
      } /*else {
         newMetadata.ref_I_G = MultipleLinearRegression(1,stars.actualCoords, stars.coordsG);
         newMetadata.ref_I_G_lineal = newMetadata.ref_I_G.ToLinealMatrix();
         newMetadata.ref_G_I = newMetadata.ref_I_G_lineal.inverse();
         newMetadata.controlPoints = null;
      }*/

      // Find the celestial coordinates (RD) of the center of the original image
      // First transform from I to G and then unprojects the gnomonic coords (G) to celestial (RD)
      var centerI = new Point(metadata.width / 2, metadata.height / 2);
      var centerG = newMetadata.ref_I_G.Apply(centerI);
      //newMetadata.ref_I_G_lineal = MultipleLinearRegressionHelmert(stars.actualCoords, stars.coordsG, centerI, centerG);
      var centerRD = newMetadata.projection.Inverse(centerG);
      while (centerRD.x < 0)
         centerRD.x += 360;
      while (centerRD.x > 360)
         centerRD.x -= 360;
      newMetadata.ra = Math.abs(metadata.ra-centerRD.x)<1 ? (metadata.ra+centerRD.x*2)/3: centerRD.x;
      newMetadata.dec = Math.abs(metadata.dec-centerRD.y)<1 ? (metadata.dec+centerRD.y*2)/3: centerRD.y;
      var ref = newMetadata.ref_I_G_lineal;
      var resx = Math.sqrt(ref.at(0, 0) * ref.at(0, 0) + ref.at(0, 1) * ref.at(0, 1));
      var resy = Math.sqrt(ref.at(1, 0) * ref.at(1, 0) + ref.at(1, 1) * ref.at(1, 1));
      newMetadata.resolution = (resx + resy) / 2;
      newMetadata.focal = newMetadata.FocalFromResolution(newMetadata.resolution);
      newMetadata.useFocal = false;

      return newMetadata;
   }

   this.GenerateDenoisedImage = function(targetWindow)
   {
      "use strict";

      var imageOrg = targetWindow.mainView.image;
      var denoisedWindow = new ImageWindow(imageOrg.width, imageOrg.height, imageOrg.numberOfChannels,
         32, true, imageOrg.isColor, targetWindow.mainView.id + "_denoised");

      denoisedWindow.mainView.beginProcess(UndoFlag_NoSwapFile);
      denoisedWindow.mainView.image.apply(imageOrg);

      if(targetWindow.mainView.image.isColor)
      {
         var toGreyscale = new ConvertToGrayscale();
         toGreyscale.executeOn(denoisedWindow.mainView, false);
      }

      var wavelets = new MultiscaleLinearTransform;
      var layers = [];
      for (var i = 0; i < this.solverCfg.noiseLayers; i++)
         layers.push([false, true, 0.000, false, 3.000, 1.00, 1]);
      layers.push([true, true, 0.000, false, 3.000, 1.00, 1]);
      wavelets.layers = layers;
      wavelets.transform = MultiscaleLinearTransform.prototype.StarletTransform;
      wavelets.executeOn(denoisedWindow.mainView, false);

      denoisedWindow.mainView.endProcess();

      return denoisedWindow;
   };

   this.CalculateMetadataDelta = function(metadata1, metadata2)
   {
      // Calculate the difference between the last two iterations using the displacement of the center and one corner
      var cornerI = new Point(0,0);
      var cornerRD2 = metadata2.Convert_I_RD(cornerI);
      var cornerRD1 = metadata1.ref_I_G ? metadata1.Convert_I_RD(cornerI) : cornerRD2;
      var delta1 = 0;
      if(cornerRD1)
         delta1 = Math.sqrt(Math.pow((cornerRD1.x - cornerRD2.x) * Math.cos(cornerRD2.y * Math.PI / 180), 2) +
               Math.pow((cornerRD1.y - cornerRD2.y), 2)) * 3600;
      var delta2 = Math.sqrt(Math.pow((metadata2.ra - metadata1.ra) * Math.cos(metadata2.dec * Math.PI / 180), 2) +
         Math.pow(metadata2.dec - metadata1.dec, 2)) * 3600;
      return Math.max(delta1, delta2);
   }

   this.SolveImage = function (targetWindow)
   {
      var abortableBackup = jsAbortable;
      jsAbortable = true;
      var auxWindow = null;
      try
      {
         console.show();
         console.abortEnabled = true;

         var denoisedWindow = targetWindow;
         if (this.solverCfg.noiseLayers > 0)
            auxWindow = denoisedWindow = this.GenerateDenoisedImage(targetWindow);

         console.writeln("Seed parameters for the plate solving:");
         console.writeln("   Image coordinates: RA=",
            DMSangle.FromAngle(this.metadata.ra * 24 / 360).ToString(true), ", Dec=",
            DMSangle.FromAngle(this.metadata.dec).ToString());
         console.writeln("   Resolution: ", this.metadata.resolution * 3600);

         var clipRect = null;
         if (targetWindow.numberOfPreviews > 0)
         {
            clipRect = targetWindow.previewRect(targetWindow.previews[0]);
            console.writeln("ClipRect: ", clipRect);
         }

         this.solverCfg.templateSizeFactor = 1.5;
         var iteration = 1;
         var stars = null;
         var finish = false;
         var deltaTolerance = this.metadata.resolution * 3600 * 0.05;

         var iterationDegree = 1;

         var bestMetadata = null;
         var bestScore = 0;
         var bestStars = null;
         var lastImprovement = 0;
         var prevDelta = 0;
         var tolerance = this.solverCfg.distortionCorrection ? 20 : 8;
         var maxItersNoImprovement = this.solverCfg.distortionCorrection /*&& !this.distortModel*/ ? 9 : 2;

         if (this.solverCfg.distortionCorrection && this.solverCfg.useDistortionModel)
         {
            if (this.solverCfg.distortionModelPath == null || this.solverCfg.distortionModelPath.length == 0)
               throw "The distortion model path is empty";
            this.distortModel = this.LoadDistortionModel(this.solverCfg.distortionModelPath);
         } else
            this.distortModel = null;

         //FIRST ITERATION
         var iterationHistory =[];
         if (this.solverCfg.onlyOptimize)
         {
            try
            {
               this.metadata.ExtractMetadata(targetWindow);
               stars = this.DetectStars(denoisedWindow, this.metadata, null, tolerance);
               clipRect = null;
               if (this.metadata.ref_I_G.polDegree)
                  iterationDegree = this.metadata.ref_I_G.polDegree;

               // Show iteration info
               console.writeln("<end><cbr><br>*****");
               console.writeln("Original coordinates:");
               console.writeln("Image center ...... RA: ", DMSangle.FromAngle(this.metadata.ra * 24 / 360).ToString(true),
                  "  Dec: ", DMSangle.FromAngle(this.metadata.dec).ToString());
               console.writeln(format("Resolution ........ %.2f arcsec/pix", this.metadata.resolution * 3600));
               console.writeln(format("RMS ............... %.4f pix (%d stars)", stars.rms, stars.numValid));
               console.writeln(format("Score ............. %.4f", stars.score));
               console.writeln("*****");
               bestMetadata = this.metadata;
               bestScore = stars.score;
               bestStars = stars;
               iterationHistory.push({score: stars.score, numValid: stars.numValid});
            } catch (ex)
            {
               console.writeln("Error solving the image: " + ex);
               return false;
            }
         }
         else
         {
            var result = null;
            try
            {
               result = this.DoIterationSA(targetWindow, this.metadata);
               if (result)
                  stars = this.DetectStars(denoisedWindow, result, clipRect, tolerance);
            } catch (ex)
            {
               console.writeln("Error solving the image: " + ex);
               return false;
            }
            if (result == null)
            {
               console.writeln("*** The image could not be solved.");
               console.writeln("This is usually because the initial parameters are too far from the real metadata of the image");
               return false;
            }
            iterationDegree = result.ref_I_G.polDegree;

            var delta = this.CalculateMetadataDelta(this.metadata, result);
            prevDelta = delta;

            // Show iteration info
            console.writeln("<end><cbr><br>*****");
            console.writeln(format("Iteration 1, delta = %.3f arcsec (%.2f pixels)", delta, delta / (result.resolution * 3600)));
            console.writeln("Image center ...... RA: ", DMSangle.FromAngle(result.ra * 24 / 360).ToString(true),
               "  Dec: ", DMSangle.FromAngle(result.dec).ToString());
            console.writeln(format("Resolution ........ %.2f arcsec/pix", result.resolution * 3600));
            console.writeln(format("RMS ............... %.4f pix (%d stars)", stars.rms, stars.numValid));
            console.writeln(format("Score ............. %.4f", stars.score));
            console.writeln("*****");
            this.metadata = result;
            iterationHistory.push({score: stars.score, numValid: stars.numValid});
            iteration++;
            finish = this.solverCfg.maxIterations == 1;
            bestMetadata = result;
            bestScore = stars.score;
            bestStars = stars;
         }

         while (!finish)
         {
            console.abortEnabled = true;

            var result;
            try
            {
               if (prevDelta > 3600 && !this.solverCfg.onlyOptimize)
                  result = this.DoIterationSA(targetWindow, this.metadata);
               else if(this.solverCfg.distortionCorrection)
                  result = this.DoIterationSpline(this.metadata, stars, this.solverCfg.splineSmoothing, this.distortModel!=null);
               else
                  result = this.DoIterationLineal(this.metadata, stars);
               if (result == null)
               {
                  console.writeln(" *** The image could not be fully solved. The image has been tagged using the last good solution");
                  break;
               }
            } catch(ex){
               console.abortEnabled = false;
               console.writeln(" *** The image could not be fully solved: " + ex +
                  "\nThe image has been tagged using the last good solution");
               break;
            }

            stars = this.DetectStars(denoisedWindow, result, clipRect, tolerance);
            if (clipRect != null)
            {
               clipRect = new Rect(clipRect.x0 - clipRect.width * 0.1, clipRect.y0 - clipRect.height * 0.1,
                  clipRect.x1 + clipRect.width * 0.1, clipRect.y1 + clipRect.height * 0.1);
               clipRect.intersect(0, 0, this.metadata.width, this.metadata.height);
               console.writeln("ClipRect: ", clipRect);
               if (clipRect.width == this.metadata.width && clipRect.height == this.metadata.height)
                  clipRect = null;
            }

            // Calculate the difference between the last two iterations using the displacement of the center and one corner
            var delta = this.CalculateMetadataDelta(this.metadata, result);
            prevDelta = delta;

            // Show iteration info
            console.writeln("<end><cbr><br>*****");
            console.writeln(format("Iteration %d, delta = %.3f arcsec (%.2f pixels)", iteration, delta, delta / (result.resolution * 3600)));
            console.writeln("Image center ...... RA: ", DMSangle.FromAngle(result.ra * 24 / 360).ToString(true),
               "  Dec: ", DMSangle.FromAngle(result.dec).ToString());
            console.writeln(format("Resolution ........ %.2f arcsec/pix", result.resolution * 3600));
            console.writeln(format("RMS ............... %.4f pix (%d stars)", stars.rms, stars.numValid));
            if (stars.score > bestScore)
               console.writeln(format("Score ............. \x1b[38;2;128;255;128m%.4f\x1b[0m", stars.score));
            else
               console.writeln(format("Score ............. %.4f", stars.score));
            console.writeln("*****");
            this.metadata = result;

            var lastIteration = iterationHistory[iterationHistory.length-1];
            iterationHistory.push({score: stars.score, numValid: stars.numValid});

            if (stars.score > bestScore)
            {
               if (stars.score > bestScore*1.001)
                  lastImprovement = 0;
               else
                  lastImprovement++;
               bestMetadata = result;
               bestScore = stars.score;
            }
            else{
               lastImprovement++;
            }

            if(this.distortModel && lastImprovement>2)
            {
               lastImprovement = 0;
               this.distortModel = null;
               console.writeln("\x1b[38;2;128;255;128mThe solution with distortion model has converged. Trying to optimize it without the model.\x1b[0m");
            }

            // Finish condition
            finish = true;
            if (iteration > this.solverCfg.maxIterations)
               console.writeln("\x1b[38;2;255;128;128mMaximum number of iterations reached\x1b[0m");
            else if (lastImprovement > maxItersNoImprovement)
               console.writeln("Maximum number of iterations without improvement reached");
            else
               finish = false;

            iteration++;
            this.solverCfg.templateSizeFactor = 1;
            this.solverCfg.showStars = false;

            processEvents();
            if (console.abortRequested)
            {
               finish = true;
               console.writeln("**** User requested abort ****");
            }
            gc(true);
         }

         console.writeln(format("Image solved with an score of %.2f", bestScore));
         console.writeln();
         this.metadata = bestMetadata;

         if (this.solverCfg.distortionCorrection)
         {
            var optimizer = new OptimizeSplineCoordinates(this.metadata.width, this.metadata.height, this.metadata.ref_I_G, this.metadata.ref_G_I, 1);
            var res = optimizer.Optimize();
            if (!this.metadata.controlPoints || this.metadata.controlPoints.pI.length > res.controlPoints.pA.length)
            {
               this.metadata.ref_I_G = res.ref_A_B;
               this.metadata.ref_G_I = res.ref_B_A;
               this.metadata.controlPoints = {
                  pI: res.controlPoints.pA,
                  pG: res.controlPoints.pB};
               console.writeln("Applying simplified spline");
            }
         }

         // Set FITS keywords
         this.metadata.SaveKeywords(targetWindow);
         this.metadata.SaveProperties(targetWindow);

         // Distortion model
         if (this.solverCfg.distortionCorrection && this.solverCfg.generateDistortModel)// && this.metadata.ref_I_G.polDegree != null && this.metadata.ref_I_G.polDegree > 1)
         {
            var modelPath = null;
            var filePath = targetWindow.filePath;
            if (filePath)
            {
               var modelPath = File.extractDrive(filePath) + File.extractDirectory(filePath) + "/" +
                  File.extractName(filePath) + "_model.csv";
            }
            else
            {
               var ofd = new SaveFileDialog;
               ofd.caption = "Select distortion model path";
               ofd.filters = [
                  ["Distortion models", "*.csv"]
               ];
               if (ofd.execute())
                  modelPath = ofd.fileName;
            }
            if (modelPath)
               this.GenerateDistortionModel(this.metadata, modelPath);
         }

         // Debug windows
         if (this.solverCfg.distortionCorrection && this.solverCfg.showDistortion)// && this.metadata.ref_I_G.polDegree != null && this.metadata.ref_I_G.polDegree > 1)
            this.DrawDistortions(targetWindow, this.metadata);

         if (this.solverCfg.generateErrorImg){
            stars = this.DetectStars(denoisedWindow, this.metadata, null, tolerance);
            this.DrawErrors(targetWindow, this.metadata, stars);
         }

         return true;
      } finally
      {
         jsAbortable = abortableBackup;
         if (auxWindow)
            auxWindow.forceClose();
      }
   }

   this.SaveImage = function(window)
   {
      if(this.solverCfg.outSuffix.length==0)
         window.save();
      else
      {
         var newPath = File.extractDrive(window.filePath) +
            File.extractDirectory(window.filePath) + "/" +
            File.extractName(window.filePath) +
            this.solverCfg.outSuffix +
            File.extractCompleteSuffix(window.filePath);
         window.saveAs(newPath, false, false, true, false);
      }
   }

}


function CheckVersion( major, minor, release )
{
   if( major == __PI_MAJOR__ )
   {
      if( minor == __PI_MINOR__ )
         return release <= __PI_RELEASE__;
      else
         return minor < __PI_MINOR__;
   }
   else
      return major < __PI_MAJOR__;
}

#ifndef USE_SOLVER_LIBRARY
function main()
{
   //console.hide();
   if (!CheckVersion(1, 8, 4))
   {
      new MessageBox("This script requires at least the version 1.8.4 of PixInsight", TITLE, StdIcon_Error, StdButton_Ok).execute();
      return;
   }

   var solver = new ImageSolver();

   if (Parameters.isViewTarget)
   {
      var targetWindow = Parameters.targetView.window;
      solver.Init(Parameters.targetView.window);

      if (solver.SolveImage(targetWindow))
      {
         solver.metadata.SaveSettings();

         // Print result
         console.writeln("<end><cbr><br>Image Plate Solver script version ", SOLVERVERSION);
         console.writeln("===============================================================================");
         solver.metadata.Print();
         console.writeln("===============================================================================");
      }
   }
   else
   {
      if(Parameters.getBoolean("non_interactive"))
         solver.Init(ImageWindow.activeWindow, false);
      else {
         do {
            solver.Init(ImageWindow.activeWindow, false);
            var dialog = new ImageSolverDialog(solver.solverCfg, solver.metadata, true);
            var res = dialog.execute();
            if (!res)
            {
               if (dialog.resetRequest)
               {
                  solver = new ImageSolver();
               }
               else
                  return;
            }
         } while (!res);

         if (solver.error)
         {
            console.writeln(solver.error);
            return;
         }

         solver.solverCfg.SaveSettings();
         solver.metadata.SaveSettings();
      }

      if(solver.solverCfg.useActive)
      {
         if (solver.SolveImage(ImageWindow.activeWindow))
         {
            solver.metadata.SaveSettings();

            // Print result
            console.writeln("<end><cbr><br>Image Plate Solver script version ", SOLVERVERSION);
            console.writeln("===============================================================================");
            solver.metadata.Print();
            console.writeln("===============================================================================");
         }
      } else {
         if (solver.solverCfg.files.length == 0)
            throw "There is not any image selected";
         var errorList = [];
         for (var i = 0; i < solver.solverCfg.files.length; i++)
         {
            var filePath = solver.solverCfg.files[i];
            var fileWindow = null;
            try
            {
               console.writeln("\n*******************************")
               console.writeln("Processing image ", filePath);
               fileWindow = ImageWindow.open(filePath)[0];
               solver.metadata.width = fileWindow.mainView.image.width;
               solver.metadata.height = fileWindow.mainView.image.height;
               if (solver.SolveImage(fileWindow))
               {
                  solver.SaveImage(fileWindow);

                  // Print result
                  console.writeln("<end><cbr><br>", filePath);
                  console.writeln("===============================================================================");
                  solver.metadata.Print();
                  console.writeln("===============================================================================");
               } else
                  errorList.push({
                     id:File.extractNameAndExtension(filePath),
                     message:"The image could not be solved"
                  });
            } catch (ex)
            {
               console.writeln("*******************************")
               console.writeln("Error in image " + filePath + ": " + ex);
               errorList.push({
                  id:File.extractNameAndExtension(filePath),
                  message:ex
               });
            }
            if(fileWindow)
               fileWindow.forceClose();
            gc(true);
         }

         console.writeln("");
         if(errorList.length > 0)
            for (var i = 0; i < errorList.length; i++)
               console.writeln(errorList[i].id + ": " + errorList[i].message);
         else
            console.writeln("Process finished without errors");
      }
   }
}

main();
#endif

#undef USE_SOLVER_LIBRARY
