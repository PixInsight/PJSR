/*
 MosaicByCoordinates

 Mosaic by Coordinates: Construction of mosaics of astronomical images using
 their coordinates.

 Copyright (C) 2013-2015, Andres del Pozo
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

  1.2.1:* Added support for XISF files

  1.2:  * Keep the keywords of the images
        * Better error management

  1.1:  * Optional faster algorithm for warping the images

  1.0:  * Orthographic projection
        * Fixed a couple of bugs found by Tomáš Maruška

  0.1:  * Initial test version.

 */

#feature-id    Utilities > MosaicByCoordinates

#feature-info  Construction of mosaics of astronomical images using their coordinates.<br/>\
<br/>\
Copyright &copy; 2013-2015 Andr&eacute;s del Pozo

#include <pjsr/DataType.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/NumericControl.jsh>

#ifndef __PJSR_SectionBar_jsh
#include <pjsr/SectionBar.jsh>
#endif

#define VERSION "1.2.1"
#define TITLE "MosaicByCoordinates"
#define SETTINGS_MODULE "MosaicCoord"


#include "WCSmetadata.jsh"
#include "SearchCoordinatesDialog.js"
#include "ViewDialog.js"
#include "WarpImage.js"
;

// -------------------------------------
// CLASS MosaicByCoordsDialog

function MosaicByCoordsDialog(engine)
{
   this.__base__ = Dialog;
   this.__base__();
   this.restyle();

   this.labelWidth = this.font.width("Dimensions (pixels):MMM");
   this.editWidth = this.font.width("888888888");

   this.helpLabel = new Label(this);
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.minWidth = 45 * this.font.width('M');
   this.helpLabel.scaledMargin = 6;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text =
      "<p><b>" + TITLE + " v" + VERSION + "</b> &mdash; Construction of mosaics of astronomical images using their coordinates.<br/>" +
         "<br/>" +
         "Copyright &copy; 2013-2015 Andr&eacute;s del Pozo</p>";

   this.CreateTargetGroup = function ()
   {
      // Target images
      this.target_Group = new GroupBox(this);
      this.target_Group.title = "Tiles:";
      this.target_Group.sizer = new HorizontalSizer;
      this.target_Group.sizer.scaledMargin = 8;
      this.target_Group.sizer.scaledSpacing = 6;

      // List of files
      this.files_List = new TreeBox(this);
      this.files_List.rootDecoration = false;
      this.files_List.alternateRowColor = true;
      this.files_List.multipleSelection = true;
      this.files_List.headerVisible = false;
      this.files_List.toolTip = "<p>List of images which compose the mosaic.</p>";
      this.files_List.onNodeSelectionUpdated = function ()
      {
         this.dialog.EnableFileControls();
      }
      if (engine.files)
      {
         for (var i = 0; i < engine.files.length; ++i)
         {
            if (engine.files[i].startsWith("window:"))
            {
               var windowId = engine.files[i].substr(7);
               try
               {
                  var window = ImageWindow.windowById(windowId);
                  if (window == null || window.isNull)
                  {
                     engine.files.splice(i, 1);
                     i--;
                  }
                  else
                  {
                     var node = new TreeBoxNode(this.files_List);
                     node.setText(0, windowId);
                  }
               } catch (ex)
               {
                  engine.files.splice(i, 1);
                  i--;
               }
            }
            else
            {
               var node = new TreeBoxNode(this.files_List);
               node.setText(0, engine.files[i]);
            }
         }
      }
      else
         engine.files = new Array();

      // Add file button
      this.addFile_Button = new PushButton(this);
      this.addFile_Button.text = "Add files";
      this.addFile_Button.toolTip = "Add files to the list";
      this.addFile_Button.onMousePress = function ()
      {
         var ofd = new OpenFileDialog;
         ofd.multipleSelections = true;
         ofd.caption = "Select files";
         //ofd.loadImageFilters();
         ofd.filters = [
            [ "All supported formats", ".xisf", ".fit", ".fits", ".fts" ],
            [ "FITS Files", ".fit", ".fits", ".fts" ],
            [ "XISF Files",  ".xisf"]
         ];
         if (ofd.execute())
         {
            for (var i = 0; i < ofd.fileNames.length; ++i)
            {
               engine.files.push(ofd.fileNames[i]);
               var node = new TreeBoxNode(this.dialog.files_List);
               node.checkable = false;
               node.setText(0, ofd.fileNames[i]);
            }
            this.dialog.files_List.adjustColumnWidthToContents(1);
         }
         this.dialog.EnableFileControls();
      }

      // Add file button
      this.addView_Button = new PushButton(this);
      this.addView_Button.text = "Add windows";
      this.addView_Button.toolTip = "Add windows to the list";
      this.addView_Button.onMousePress = function ()
      {
         var viewDlg = new ViewDialog(true);
         viewDlg.execute();
         if (!viewDlg.selectedViews)
            return;
         for (var i = 0; i < viewDlg.selectedViews.length; i++)
         {
            engine.files.push("window:" + viewDlg.selectedViews[i]);
            var node = new TreeBoxNode(this.dialog.files_List);
            node.checkable = false;
            node.setText(0, viewDlg.selectedViews[i]);
         }
         this.dialog.EnableFileControls();
      }

      // Remove file button
      this.remove_Button = new PushButton(this);
      this.remove_Button.text = "Remove images";
      this.remove_Button.toolTip = "Removes the selected images from the list";
      this.remove_Button.onMousePress = function ()
      {
         for (var i = this.dialog.files_List.numberOfChildren - 1; i >= 0; i--)
         {
            if (this.dialog.files_List.child(i).selected)
            {
               engine.files.splice(i, 1);
               this.dialog.files_List.remove(i);
            }
            this.dialog.EnableFileControls();
         }
      }

      // Clear files button
      this.clear_Button = new PushButton(this);
      this.clear_Button.text = "Clear list";
      this.clear_Button.toolTip = "Clears the list of images";
      this.clear_Button.onMousePress = function ()
      {
         this.dialog.files_List.clear();
         engine.files = new Array();
      }

      // Buttons for managing the list of files
      this.files_Buttons = new VerticalSizer;
      this.files_Buttons.scaledSpacing = 6;
      this.files_Buttons.add(this.addFile_Button);
      this.files_Buttons.add(this.addView_Button);
      this.files_Buttons.add(this.remove_Button);
      this.files_Buttons.addSpacing(8);
      this.files_Buttons.add(this.clear_Button);
      this.files_Buttons.addStretch();

      this.target_Group.sizer.add(this.files_List);
      this.target_Group.sizer.add(this.files_Buttons);
   }

   this.EnableFileControls = function ()
   {
      this.remove_Button.enabled = this.files_List.selectedNodes.length > 0;
      this.clear_Button.enabled = this.files_List.numberOfChildren > 0;
   }

   this.CreateTargetGroup();
   this.EnableFileControls();

   this.CreateGeometryGroup = function ()
   {
      this.geometry_Group = new GroupBox(this);
      this.geometry_Group.title = "Mosaic geometry";
      this.geometry_Group.sizer = new HorizontalSizer;
      this.geometry_Group.sizer.scaledMargin = 8;
      this.geometry_Group.sizer.scaledSpacing = 6;

      this.geometryParams_Sizer = new VerticalSizer;
      this.geometryParams_Sizer.scaledSpacing = 6;
      this.geometry_Group.sizer.add(this.geometryParams_Sizer);
      this.geometry_Group.sizer.addStretch();

      // Recalc
      this.calculate_Button = new PushButton(this);
      this.calculate_Button.text = "Calculate";
      this.calculate_Button.toolTip = "<p>This button calculates the values of the parameters set to automatic.<br/>" +
         "It uses the geometry of the tiles of the mosaic.</p>"
      this.calculate_Button.onClick = function ()
      {
         if (!engine.centerCoordsAuto)
         {
            var coords = this.dialog.center_Editor.GetCoords();
            engine.centerRA = coords.x;
            engine.centerDec = coords.y;
         }
         try
         {
            engine.CalculateAutoParameters();

            if (engine.centerCoordsAuto)
               this.dialog.center_Editor.SetCoords(new Point(engine.centerRA, engine.centerDec));

            if (engine.projectionAuto)
               this.dialog.projection_Combo.currentItem = engine.projection;

            if (engine.resolutionAuto)
               this.dialog.resolution_Edit.text = format("%g", engine.resolution * 3600);

            if (engine.rotationAuto)
               this.dialog.rotation_Edit.text = format("%g", engine.rotation);

            if (engine.dimensionsAuto)
            {
               this.dialog.width_Edit.text = engine.width.toString();
               this.dialog.height_Edit.text = engine.height.toString();
            }
         } catch (ex)
         {
            console.writeln(ex);
            new MessageBox(ex.toString(), TITLE, StdIcon_Error, StdButton_Ok).execute();
         }
      }
      this.geometry_Group.sizer.add(this.calculate_Button);

      // Projection
      this.projection_Check = new CheckBox(this);
      this.projection_Check.setMinWidth(this.labelWidth);
      this.projection_Check.checked = engine.projectionAuto != null ? !engine.projectionAuto : false;
      this.projection_Check.text = "Projection:";
      this.projection_Check.toolTip = "<p>Projection class of the resulting image.<br/>" +
         "If the box is not checked, the script will select the projection most suitable to the area of the mosaic.</p>";
      this.projection_Check.onCheck = function (checked)
      {
         engine.projectionAuto = !checked;
         this.dialog.projection_Combo.enabled = checked;
         this.dialog.projection_Button.enabled = checked;
      };

      this.projection_Combo = new ComboBox(this);
      this.projection_Combo.enabled = this.projection_Check.checked;
      this.projection_Combo.toolTip = "<p>Projection used in the image.</p>";
      this.projection_Combo.addItem("Gnomonic");
      this.projection_Combo.addItem("Stereographic");
      this.projection_Combo.addItem("Plate-carrée");
      this.projection_Combo.addItem("Mercator");
      this.projection_Combo.addItem("Hammer-Aitoff");
      this.projection_Combo.addItem("Zenithal equal area");
      this.projection_Combo.addItem("Orthographic");
      if (engine.projection != null)
         this.projection_Combo.currentItem = engine.projection;
      this.projection_Combo.onItemSelected = function ()
      {
         engine.projection = this.currentItem;
         engine.projectionOriginMode = 0;
      };

      this.projection_Button = new PushButton(this);
      this.projection_Button.enabled = this.projection_Check.checked
      this.projection_Button.text = "Advanced";
      this.projection_Button.onClick = function ()
      {
         var projectionConfig = new ConfigProjectionDialog(engine, engine.projection);
         projectionConfig.execute();
      }

      this.projection_Sizer = new HorizontalSizer;
      this.projection_Sizer.scaledSpacing = 4;
      this.projection_Sizer.add(this.projection_Check);
      this.projection_Sizer.add(this.projection_Combo);
      this.projection_Sizer.add(this.projection_Button);
      this.projection_Sizer.addStretch();
      this.geometryParams_Sizer.add(this.projection_Sizer);

      // Center
      this.center_Check = new CheckBox(this);
      this.center_Check.setMinWidth(this.labelWidth);
      this.center_Check.checked = engine.centerCoordsAuto != null ? !engine.centerCoordsAuto : false;
      this.center_Check.text = "Coordinates of the center of the mosaic:";
      this.center_Check.toolTip = "<p>The mosaic will put these coordinates at the center of the image.<br/>" +
         "If the box is not checked, the coordinates will be computed from the images of the mosaic</p>";
      this.center_Check.onCheck = function (checked)
      {
         engine.centerCoordsAuto = !checked;
         this.dialog.center_Editor.enabled = checked;
      };
      this.geometryParams_Sizer.add(this.center_Check);

      this.center_Editor = new CoordinatesEditor(this, new Point(engine.centerRA, engine.centerDec), this.labelWidth, null, this.center_Check.toolTip);
      this.center_Editor.enabled = this.center_Check.checked;
      this.geometryParams_Sizer.add(this.center_Editor);

      // Resolution
      this.resol_Check = new CheckBox(this);
      this.resol_Check.setMinWidth(this.labelWidth);
      this.resol_Check.checked = engine.resolutionAuto != null ? !engine.resolutionAuto : false;
      this.resol_Check.text = "Resolution (\"/pixel):";
      this.resol_Check.toolTip = "<p>Resolution in arcseconds/pixel of the resulting image.<br/>" +
         "If the box is not checked, the resolution will be computed from the images of the mosaic</p>";
      this.resol_Check.onCheck = function (checked)
      {
         engine.resolutionAuto = !checked;
         this.dialog.resolution_Edit.enabled = checked;
      };

      this.resolution_Edit = new Edit(this);
      if (engine.resolution != null)
         this.resolution_Edit.text = format("%g", engine.resolution * 3600);
      this.resolution_Edit.toolTip = this.resol_Check.toolTip;
      this.resolution_Edit.setFixedWidth(this.editWidth);
      this.resolution_Edit.enabled = this.resol_Check.checked;
      this.resolution_Edit.onTextUpdated = function (value)
      {
         if(value<=0)
         {
            new MessageBox("The resolution must be greater than 0", TITLE, StdIcon_Error, StdButton_Ok).execute();
            this.dialog.resolution_Edit.text = format("%g", engine.resolution * 3600);
         } else
            engine.resolution = parseFloat(value) / 3600;
      };

      this.resolution_Sizer = new HorizontalSizer;
      this.resolution_Sizer.scaledSpacing = 4;
      this.resolution_Sizer.add(this.resol_Check);
      this.resolution_Sizer.add(this.resolution_Edit);
      this.resolution_Sizer.addStretch();
      this.geometryParams_Sizer.add(this.resolution_Sizer);

      // Rotation
      this.rotation_Check = new CheckBox(this);
      this.rotation_Check.setMinWidth(this.labelWidth);
      this.rotation_Check.checked = engine.rotationAuto != null ? !engine.rotationAuto : false;
      this.rotation_Check.text = "Rotation (deg):";
      this.rotation_Check.toolTip = "<p>Rotation of the resulting image.<br/>" +
         "If the box is not checked, the rotation will be computed from the images of the mosaic</p>";
      this.rotation_Check.onCheck = function (checked)
      {
         engine.rotationAuto = !checked;
         this.dialog.rotation_Edit.enabled = checked;
      };

      this.rotation_Edit = new Edit(this);
      if (engine.rotation != null)
         this.rotation_Edit.text = format("%g", engine.rotation);
      this.rotation_Edit.toolTip = this.rotation_Check.toolTip;
      this.rotation_Edit.setFixedWidth(this.editWidth);
      this.rotation_Edit.enabled = this.rotation_Check.checked;
      this.rotation_Edit.onTextUpdated = function (value)
      {
         engine.rotation = parseFloat(value);
      };

      this.rotation_Sizer = new HorizontalSizer;
      this.rotation_Sizer.scaledSpacing = 4;
      this.rotation_Sizer.add(this.rotation_Check);
      this.rotation_Sizer.add(this.rotation_Edit);
      this.rotation_Sizer.addStretch();
      this.geometryParams_Sizer.add(this.rotation_Sizer);

      /// Dimensions
      this.dimensions_Check = new CheckBox(this);
      this.dimensions_Check.setMinWidth(this.labelWidth);
      this.dimensions_Check.checked = engine.dimensionsAuto != null ? !engine.dimensionsAuto : false;
      this.dimensions_Check.text = "Dimensions (pixels):";
      this.dimensions_Check.toolTip = "<p>Width and height in pixels of the resulting image.<br/>" +
         "If the box is not checked, the script will compute the dimensions of the mosaic.</p>";
      this.dimensions_Check.onCheck = function (checked)
      {
         engine.dimensionsAuto = !checked;
         this.dialog.width_Edit.enabled = checked;
         this.dialog.height_Edit.enabled = checked;
      };

      this.width_Edit = new Edit(this);
      this.width_Edit.setFixedWidth(this.editWidth);
      this.width_Edit.text = engine.width.toString();
      this.width_Edit.toolTip = this.dimensions_Check.toolTip;
      this.width_Edit.enabled = this.dimensions_Check.checked;
      this.width_Edit.onTextUpdated = function (value)
      {
         if(value<=0)
         {
            new MessageBox("The width must be greater than 0", TITLE, StdIcon_Error, StdButton_Ok).execute();
            this.dialog.width_Edit.text = engine.width.toString();
         }else
            engine.width = value;
      };

      this.dimensionsX_Label = new Label(this);
      this.dimensionsX_Label.text = " x ";

      this.height_Edit = new Edit(this);
      this.height_Edit.setFixedWidth(this.editWidth);
      this.height_Edit.text = engine.height.toString();
      this.height_Edit.toolTip = this.dimensions_Check.toolTip;
      this.height_Edit.enabled = this.dimensions_Check.checked;
      this.height_Edit.onTextUpdated = function (value)
      {
         if(value<=0)
         {
            new MessageBox("The height must be greater than 0", TITLE, StdIcon_Error, StdButton_Ok).execute();
            this.dialog.height_Edit.text = engine.height.toString();
         }else
            engine.height = value;
      };

      this.dimensions_Sizer = new HorizontalSizer;
      this.dimensions_Sizer.scaledSpacing = 4;
      this.dimensions_Sizer.add(this.dimensions_Check);
      this.dimensions_Sizer.add(this.width_Edit);
      this.dimensions_Sizer.add(this.dimensionsX_Label);
      this.dimensions_Sizer.add(this.height_Edit);
      this.dimensions_Sizer.addStretch();
      this.geometryParams_Sizer.add(this.dimensions_Sizer);
   }

   this.CreateGeometryGroup();

   // Options
   this.options_Section = new SectionBar(this, "Options");
   this.options_Control = new Control(this);
   this.options_Control.sizer = new VerticalSizer;
   this.options_Control.sizer.scaledSpacing = 4;
   this.options_Section.setSection(this.options_Control);
   this.options_Control.hide();
   this.options_Control.onToggleSection = function (bar, toggleBegin)
   {
      if (!toggleBegin)
      {
         this.dialog.setVariableHeight();
         this.dialog.adjustToContents();
         this.dialog.setFixedHeight();
      }
   }

   // Quality
    this.quality_Label = new Label(this);
    this.quality_Label.text = "Quality:";
    this.quality_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
    this.quality_Label.minWidth = this.labelWidth;

    this.qualityFast_Radio = new RadioButton(this);
    this.qualityFast_Radio.text = "Fast";
    this.qualityFast_Radio.checked = !engine.qualityHQ;
    //this.each_Radio.minWidth = parent.labelWidth;
    this.qualityFast_Radio.toolTip = "<p>The result image is generated using DynamicAligment." +
    "The script generates a small number of control points that transform points from the " +
    "target image to the reference image. DynamicAligment interpolates the values of the " +
    "points between the control points.</p>";
    this.qualityFast_Radio.onCheck = function (value)
    {
       engine.qualityHQ = false;
    };

    this.qualityHQ_Radio = new RadioButton(this);
    this.qualityHQ_Radio.text = "High quality";
    this.qualityHQ_Radio.checked = engine.qualityHQ != null && engine.qualityHQ == true;
    //this.each_Radio.minWidth = parent.labelWidth;
    this.qualityHQ_Radio.toolTip = "<p>The values of points of the result image are generated " +
    "transforming the coordinates of each point from the target image to the reference image.</p>";
    this.qualityHQ_Radio.onCheck = function (value)
    {
       engine.qualityHQ = true;
    };
    this.quality_Sizer = new HorizontalSizer;
    this.quality_Sizer.scaledSpacing = 6;
    this.quality_Sizer.add(this.quality_Label);
    this.quality_Sizer.add(this.qualityFast_Radio);
    this.quality_Sizer.add(this.qualityHQ_Radio);
    this.quality_Sizer.addStretch();
    this.options_Control.sizer.add(this.quality_Sizer);

   // Pixel interpolation
   this.interpol_Label = new Label(this);
   this.interpol_Label.text = "Pixel interpolation:";
   this.interpol_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.interpol_Label.minWidth = this.labelWidth;

   this.interpol_Combo = new ComboBox(this);
   this.interpol_Combo.editEnabled = false;
   this.interpol_Combo.addItem("NearestNeighbor");
   this.interpol_Combo.addItem("Bilinear");
   this.interpol_Combo.addItem("BicubicSpline");
   this.interpol_Combo.addItem("BicubicBSpline");
   this.interpol_Combo.addItem("Lanczos3");
   this.interpol_Combo.addItem("Lanczos4");
   this.interpol_Combo.addItem("Lanczos5");
   this.interpol_Combo.addItem("MitchellNetravaliFilter");
   this.interpol_Combo.addItem("CatmullRomSplineFilter");
   this.interpol_Combo.addItem("CubicBSplineFilter");
   this.interpol_Combo.currentItem = engine.pixelInterpolation;
   //this.mode_Combo.minWidth = this.editWidth;
   this.interpol_Combo.onItemSelected = function ()
   {
      engine.pixelInterpolation = this.currentItem;
   };

   this.interpol_Sizer = new HorizontalSizer;
   this.interpol_Sizer.scaledSpacing = 6;
   this.interpol_Sizer.add(this.interpol_Label);
   this.interpol_Sizer.add(this.interpol_Combo);
   this.interpol_Sizer.addStretch();
   this.options_Control.sizer.add(this.interpol_Sizer);

   // Clamping threshold
   this.clamping_Control = new NumericControl(this);
   this.clamping_Control.real = true;
   this.clamping_Control.label.text = "Clamping threshold:";
   this.clamping_Control.label.minWidth = this.labelWidth;
   this.clamping_Control.setRange(0, 1);
   this.clamping_Control.slider.setRange(0, 100);
   this.clamping_Control.slider.setScaledFixedWidth(250);
   this.clamping_Control.setPrecision(2);
   //this.clamping_Control.edit.minWidth = spinBoxWidth;
   this.clamping_Control.setValue(engine.clampingThreshold);
   this.clamping_Control.sizer.addStretch();
   this.clamping_Control.onValueUpdated = function (value)
   {
      engine.clampingThreshold = value;
   };
   this.options_Control.sizer.add(this.clamping_Control);


   // Output images
   this.output_Section = new SectionBar(this, "Output Images");
   this.output_Control = new Control(this);
   this.output_Control.sizer = new VerticalSizer;
   this.output_Control.sizer.scaledSpacing = 4;
   this.output_Section.setSection(this.output_Control);
   this.output_Control.hide();
   this.output_Control.onToggleSection = function (bar, toggleBegin)
   {
      if (!toggleBegin)
      {
         this.dialog.setVariableHeight();
         this.dialog.adjustToContents();
         this.dialog.setFixedHeight();
      }
   }

   // Directory
   this.outDir_Label = new Label(this);
   this.outDir_Label.text = "Output Directory:";
   this.outDir_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.outDir_Label.setFixedWidth(this.labelWidth);

   this.outDir_Edit = new Edit(this);
   if (engine.outputDir)
      this.outDir_Edit.text = engine.outputDir;
   this.outDir_Edit.setScaledMinWidth(300);
   this.outDir_Edit.toolTip = "<p>Path of the directory where the aligned images will be written.<br/>" +
      "If it is empty, the images will be written at the same directories as the source images.</p>";
   this.outDir_Edit.onTextUpdated = function (value)
   {
      if (value.trim().length > 0)
         engine.outputDir = value.trim();
      else
         engine.outputDir = null;
   };

   this.outDir_Button = new ToolButton(this);
   this.outDir_Button.icon = this.scaledResource( ":/icons/select-file.png" );
   this.outDir_Button.setScaledFixedSize( 20, 20 );
   this.outDir_Button.toolTip = "<p>Select the output directory.</p>";
   this.outDir_Button.onClick = function ()
   {
      var gdd = new GetDirectoryDialog();
      if (engine.outputDir)
         gdd.initialPath = engine.outputDir;
      gdd.caption = "Select the output directory";
      if (gdd.execute())
      {
         engine.outputDir = gdd.directory;
         this.dialog.outDir_Edit.text = gdd.directory;
      }
   };

   this.outDir_Sizer = new HorizontalSizer;
   this.outDir_Sizer.scaledSpacing = 4;
   this.outDir_Sizer.add(this.outDir_Label);
   this.outDir_Sizer.add(this.outDir_Edit, 100);
   this.outDir_Sizer.add(this.outDir_Button);
   this.output_Control.sizer.add(this.outDir_Sizer);

   // IMAGE SUFFIX
   this.suffix_Label = new Label(this);
   this.suffix_Label.text = "Output file suffix:";
   this.suffix_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.suffix_Label.setFixedWidth(this.labelWidth);

   this.suffix_Edit = new Edit(this);
   this.suffix_Edit.text = engine.suffix ? engine.suffix : "";
   this.suffix_Edit.minWidth = this.font.width("_mosaicXXXXX");
   this.suffix_Edit.toolTip = "<p>This suffix will be appended to the filename when saving each image.</p>";
   this.suffix_Edit.onTextUpdated = function (value)
   {
      engine.suffix = value ? value.trim() : "";
   };

   this.suffix_Sizer = new HorizontalSizer;
   this.suffix_Sizer.scaledSpacing = 4;
   this.suffix_Sizer.add(this.suffix_Label);
   this.suffix_Sizer.add(this.suffix_Edit);
   this.suffix_Sizer.addStretch();
   this.output_Control.sizer.add(this.suffix_Sizer);

   // Overwrite
   this.overwrite_Check = new CheckBox(this);
   this.overwrite_Check.text = "Overwrite existing files";
   this.overwrite_Check.checked = engine.overwrite;
   this.overwrite_Check.onCheck = function (checked)
   {
      engine.overwrite = checked;
   };

   this.errorPolicy_Label = new Label(this);
   this.errorPolicy_Label.text = "On error:";
   this.errorPolicy_Label.textAlignment = TextAlign_Left | TextAlign_VertCenter;
   this.errorPolicy_Combo = new ComboBox(this);
   this.errorPolicy_Combo.editEnabled = false;
   this.errorPolicy_Combo.toolTip = "<p>Specify what to do if there are errors during the process.</p>";
   this.errorPolicy_Combo.addItem("Continue");
   this.errorPolicy_Combo.addItem("Abort");
   this.errorPolicy_Combo.addItem("Ask User");
   this.errorPolicy_Combo.currentItem = engine.errorPolicy ? engine.errorPolicy : 0;
   this.errorPolicy_Combo.onItemSelected = function ()
   {
      engine.errorPolicy = this.currentItem;
   };

   this.suffix_Sizer = new HorizontalSizer;
   this.suffix_Sizer.scaledSpacing = 4;
   this.suffix_Sizer.addSpacing(this.labelWidth + 4);
   this.suffix_Sizer.add(this.overwrite_Check);
   this.suffix_Sizer.addSpacing(20);
   this.suffix_Sizer.add(this.errorPolicy_Label);
   this.suffix_Sizer.add(this.errorPolicy_Combo);
   this.suffix_Sizer.addStretch();
   this.output_Control.sizer.add(this.suffix_Sizer);

   // usual control buttons

   this.newInstanceButton = new ToolButton(this);
   this.newInstanceButton.icon = this.scaledResource( ":/process-interface/new-instance.png" );
   this.newInstanceButton.setScaledFixedSize( 20, 20 );
   this.newInstanceButton.toolTip = "New Instance";
   this.newInstanceButton.onMousePress = function ()
   {
      this.hasFocus = true;

      engine.SaveParameters();

      this.pushed = false;
      this.dialog.newInstance();
   };

   this.reset_Button = new ToolButton(this);
   this.reset_Button.icon = this.scaledResource( ":/icons/reload.png" );
   this.reset_Button.setScaledFixedSize( 20, 20 );
   this.reset_Button.toolTip = "<p>Resets all settings to default values.<br />" +
      "This action closes the dialog, so the script has to be executed again for changes to take effect.</p>";
   this.reset_Button.onClick = function ()
   {
      var msg = new MessageBox("Do you really want to reset all settings to their default values?",
         TITLE, StdIcon_Warning, StdButton_Yes, StdButton_No);
      var res = msg.execute();
      if (res == StdButton_Yes)
      {
         Settings.remove(SETTINGS_MODULE);
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
      Dialog.browseScriptDocumentation("MosaicByCoordinates");
   };

   this.ok_Button = new PushButton(this);
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function ()
   {
      try
      {
         // Validation
         if (engine.dimensionsAuto && engine.width * engine.height > 25e6)
         {
            var res = new MessageBox("The resulting image will be very big.\nDo you want to continue?", TITLE, StdIcon_Warning, StdButton_Yes, StdButton_No).execute();
            if (res != StdButton_Yes)
               return;
         }
         if (!engine.centerCoordsAuto)
         {
            var coords = this.dialog.center_Editor.GetCoords();
            engine.centerRA = coords.x;
            engine.centerDec = coords.y;
         }

         this.dialog.ok();
      } catch (ex)
      {
         new MessageBox(ex, TITLE, StdIcon_Error, StdButton_Ok).execute();
      }
   };

   this.cancel_Button = new PushButton(this);
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function ()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.scaledSpacing = 6;
   this.buttons_Sizer.add(this.newInstanceButton);
   this.buttons_Sizer.add(this.reset_Button);
   this.buttons_Sizer.add(this.help_Button);
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add(this.ok_Button);
   this.buttons_Sizer.add(this.cancel_Button);

   // Global sizer

   this.sizer = new VerticalSizer;
   this.sizer.scaledMargin = 8;
   this.sizer.scaledSpacing = 6;
   this.sizer.add(this.helpLabel);
   this.sizer.addSpacing(4);
   this.sizer.add(this.target_Group);
   this.sizer.add(this.geometry_Group);
   this.sizer.add(this.options_Section);
   this.sizer.add(this.options_Control);
   this.sizer.add(this.output_Section);
   this.sizer.add(this.output_Control);
   this.sizer.addSpacing(8);
   this.sizer.add(this.buttons_Sizer);

   this.windowTitle = TITLE;
   this.adjustToContents();
   this.setFixedSize();
}
MosaicByCoordsDialog.prototype = new Dialog;

// -------------------------------------
// ENUMERATION ErrorPolicy

function ErrorPolicy()
{
}
ErrorPolicy.prototype.Continue = 0;
ErrorPolicy.prototype.Abort = 1;
ErrorPolicy.prototype.Ask = 2;


// -------------------------------------
// CLASS MosaicByCoordsEngine

function MosaicByCoordsEngine()
{
   this.__base__ = ObjectWithSettings;
   this.__base__(
      SETTINGS_MODULE,
      "engine",
      new Array(
         [ "files", Ext_DataType_StringArray ],
         [ "centerCoordsAuto", DataType_Boolean ],
         [ "centerRA", DataType_Double ],
         [ "centerDec", DataType_Double ],
         [ "resolutionAuto", DataType_Boolean ],
         [ "resolution", DataType_Double ],
         [ "rotationAuto", DataType_Boolean ],
         [ "rotation", DataType_Double ],
         [ "projectionAuto", DataType_Boolean ],
         [ "projection", DataType_Int32 ],
         [ "projectionOriginMode", DataType_UInt32],
         [ "projectionOriginRA", DataType_UInt32],
         [ "projectionOriginDec", DataType_UInt32],
         [ "dimensionsAuto", DataType_Boolean ],
         [ "width", DataType_UInt32 ],
         [ "height", DataType_UInt32 ],
         [ "qualityHQ", DataType_Boolean ],
         [ "pixelInterpolation", DataType_Int32 ],
         [ "clampingThreshold", DataType_Double ],
         [ "suffix", DataType_String ],
         [ "overwrite", DataType_Boolean ],
         [ "errorPolicy", DataType_Int32 ],
         [ "outputDir", DataType_String ]
      )
   );

   this.files = [];
   this.centerCoordsAuto = true;
   this.centerRA = 0;
   this.centerDec = 0;
   this.resolutionAuto = true;
   this.resolution = 60;
   this.rotationAuto = true;
   this.rotation = 0;
   this.projectionAuto = true;
   this.projection = 3;
   this.projectionOriginMode = 0;
   this.projectionOriginRA = 0;
   this.projectionOriginDec = 0;
   this.dimensionsAuto = true;
   this.width = 1000;
   this.height = 1000;
   this.suffix = "_registered";
   this.qualityHQ = false;
   this.pixelInterpolation = 2;
   this.clampingThreshold = 0.3;
   this.outputDir = "";
   this.overwrite = false;
   this.errorPolicy = ErrorPolicy.prototype.Ask;

   // Select image and get metadata
   this.Init = function (w)
   {
      this.currentWindow = w;

      this.LoadSettings();
      this.LoadParameters();
   };

   this.LoadMetadataCache = function ()
   {
      if (!this.metadataCache)
         this.metadataCache = {};
      console.writeln("<br/><b>Loading files metadata...</b>");

      var numErrors = 0;
      for (var i = 0; i < this.files.length; i++)
      {
         if (!this.metadataCache[this.files[i]])
         {
            var window = null;
            var srcIsFile = !this.files[i].startsWith("window:");
            if (srcIsFile)
               window = ImageWindow.open(this.files[i])[0];
            else
               window = ImageWindow.windowById(this.files[i].substr(7));
            if (!window || window.isNull)
               throw "Error opening image '" + this.files[i] + "'";
            try
            {
               var metadata = new ImageMetadata();
               metadata.ExtractMetadata(window);
               if (!metadata.projection || !metadata.ref_I_G_lineal)
                  throw "The image has no WCS coordinates";
               this.metadataCache[this.files[i]] = metadata;
               console.writeln(format("Metadata of '%ls' OK.", this.files[i]));
            } catch (exception)
            {
               console.writeln(format("Metadata of '%ls': %ls", this.files[i], exception));
               numErrors++;
            }
            finally
            {
               if (srcIsFile)
                  window.close();
            }
         }
         else
            console.writeln(format("Metadata of '%ls' OK.", this.files[i]));
      }
      return numErrors;
   };

   this.CalculateAutoParameters = function ()
   {
      if (this.files.length == 0)
         throw "The file list is empty";

      var numErrs = this.LoadMetadataCache();
      if (numErrs > 0)
         throw "There where errors reading the coordinates of the images";


      if (this.resolutionAuto)
         this.CalculateResolution();
      if (!this.resolution || this.resolution <= 0)
         throw "The resolution must be greater than 0";

      if (this.rotationAuto)
         this.rotation = this.metadataCache[this.files[0]].GetRotation()[0];

      if (this.centerCoordsAuto || this.projectionAuto)
         this.CalculateMosaicCenterAndProjection();

      if (this.dimensionsAuto)
      {
         var metadata = this.CreateMetadata(0, 0);
         this.CalculateDimensions(metadata);
      }
   };

   this.CalculateMosaicCenterAndProjection = function ()
   {
      console.writeln("\nOptimizing the center and area of the mosaic:");
      var x0 = this.centerCoordsAuto ? this.metadataCache[this.files[0]].ra : this.centerRA;
      var y1 = this.centerCoordsAuto ? this.metadataCache[this.files[0]].dec : this.centerDec;

      //console.writeln("x0:",x0);
      var x1 = x0;
      var x2 = x0;
      var y2 = y1;
      var maxField = 0;

      for (var f = 0; f < this.files.length; f++)
      {
         var metadata = this.metadataCache[this.files[f]];
         var x = metadata.ra;
         while (x < x0 - 180) x += 360;
         while (x > x0 + 180) x -= 360;
         //console.writeln(format("%d: %f=>%f",f,metadata.ra,x));
         if (x < x1) x1 = x;
         if (x > x2) x2 = x;
         if (metadata.dec < y1) y1 = metadata.dec;
         if (metadata.dec > y2) y2 = metadata.dec;

         var field1 = metadata.DistanceI(new Point(0, 0), new Point(metadata.width, metadata.height));
         var field2 = metadata.DistanceI(new Point(metadata.width, 0), new Point(0, metadata.height));
         //console.writeln(format("Field: %f %f", field1, field2));
         if (isNaN(field1) || isNaN(field2))
         {
            maxField = 360;
            //console.writeln("*");
         }
         else
            maxField = Math.max(maxField, field1, field2);
      }
      maxField += Math.max(x2 - x1, y2 - y1);

      if (this.projectionAuto)
      {
         //console.writeln("MaxField: ", maxField);
         if (maxField >= 180)
            this.projection = 4;
         else if (maxField > 90)
            this.projection = 1;
         else if (maxField > 10)
            this.projection = 3;
         else
            this.projection = 0;
      }

      if (this.centerCoordsAuto)
      {
         //console.writeln(format("x1:%f x2:%f y1:%f y2:%f", x1, x2, y1, y2));
         this.centerRA = (x1 + x2) / 2;
         this.centerDec = (y1 + y2) / 2;

         //var minArea = null;
         //var bestCenter = null;

         var dist = 1e6;
         for (var i = 0; i < 20 && dist > 0.5; i++)
         {
            var metadata0 = this.CreateMetadata(0, 0);
            var bounds = null;
            for (var f = 0; f < this.files.length; f++)
            {
               var metadata1 = this.metadataCache[this.files[f]];
               var fileBounds = WarpImage.GetPixelBounds(metadata0, metadata1);
               //console.writeln(format("%d: %ls",f, fileBounds.toString()));
               if (bounds)
                  bounds.unite(fileBounds);
               else
                  bounds = fileBounds
            }
            //console.writeln(format("Total: %ls", bounds.toString()));
            var centerI = new Point((bounds.x0 + bounds.x1) / 2, (bounds.y0 + bounds.y1) / 2);
            var centerRD = metadata0.Convert_I_RD(centerI);
            if (!centerRD)
               break;

            //dist=Math.sqrt((this.centerRA-centerRD.x)*(this.centerRA-centerRD.x)+(this.centerDec-centerRD.y)*(this.centerDec-centerRD.y));
            dist = Math.sqrt(centerI.x * centerI.x + centerI.y * centerI.y);
            this.centerRA = (centerRD.x*2+this.centerRA)/3;
            this.centerDec = (centerRD.y*2+this.centerDec)/3;
            var width = Math.ceil(2 * Math.max(Math.abs(bounds.x0), Math.abs(bounds.x1)));
            var height = Math.ceil(2 * Math.max(Math.abs(bounds.y0), Math.abs(bounds.y1)));
            console.writeln(format("Center:%ls Dist=%fpx Width=%d, Height=%d", centerRD.toString(), dist, width, height));
            console.flush();

            //if (!bestCenter || minArea > width * height)
            //{
            //   bestCenter = new Point(this.centerRA, this.centerDec);
            //   minArea = width * height;
            //}
         }
      }
      //if (bestCenter)
      //{
      //   this.centerRA = bestCenter.x;
      //   this.centerDec = bestCenter.y;
      //}

      while (this.centerRA < 0)
         this.centerRA += 360;
      while (this.centerRA >= 360)
         this.centerRA -= 360;
   };

   this.CalculateResolution = function ()
   {
      var minRes = this.metadataCache[this.files[0]].resolution;
      for (var f = 0; f < this.files.length; f++)
         minRes = Math.min(minRes, this.metadataCache[this.files[f]].resolution);
      this.resolution = minRes;
   };

   this.CalculateDimensions = function (metadata0)
   {
      var bounds = null;
      for (var f = 0; f < this.files.length; f++)
      {
         var metadata1 = this.metadataCache[this.files[f]];
         var fileBounds = WarpImage.GetPixelBounds(metadata0, metadata1);
         //console.writeln(format("%d: %ls",f, fileBounds.toString()));
         if (bounds)
            bounds.unite(fileBounds);
         else
            bounds = fileBounds
      }
      //console.writeln(format("Total: %ls", bounds.toString()));
      this.width = Math.ceil(2 * Math.max(Math.abs(bounds.x0), Math.abs(bounds.x1)));
      this.height = Math.ceil(2 * Math.max(Math.abs(bounds.y0), Math.abs(bounds.y1)));
   };

   this.CreateMetadata = function (width, height)
   {
      var metadata = new ImageMetadata();
      metadata.ra = this.centerRa;
      metadata.dec = this.centerDec;
      metadata.resolution = this.resolution;
      metadata.width = width;
      metadata.height = height;
      metadata.rotation = this.rotation;
      metadata.projection = ProjectionFactory(this, this.centerRA, this.centerDec );

      var rot = -this.rotation * Math.PI / 180;
      var cd1_1 = -this.resolution * Math.cos(rot);
      var cd1_2 = -this.resolution * Math.sin(rot);
      var cd2_1 = -this.resolution * Math.sin(rot);
      var cd2_2 = this.resolution * Math.cos(rot);
      var crpix1 = width / 2 + 0.5;
      var crpix2 = height / 2 + 0.5;
      if (this.projectionOriginMode == 1)
      {
         var centerG = metadata.projection.Direct(new Point(this.centerRA, this.centerDec));
         if (centerG == null)
            throw "Invalid projection origin";
         var Kx = cd1_1 * crpix1 + cd1_2 * crpix2 - centerG.x;
         var Ky = cd2_1 * crpix1 + cd2_2 * crpix2 - centerG.y;
         var det = cd1_2 * cd2_1 - cd1_1 * cd2_2;
         crpix1 = (Ky * cd1_2 - Kx * cd2_2) / det;
         crpix2 = (Kx * cd2_1 - Ky * cd1_1) / det;
      }
      var ref_F_G = new Matrix(
         cd1_1, cd1_2, -cd1_1 * crpix1 - cd1_2 * crpix2,
         cd2_1, cd2_2, -cd2_1 * crpix1 - cd2_2 * crpix2,
         0, 0, 1);

      var ref_F_I = new Matrix(
         1, 0, -0.5,
         0, -1, height + 0.5,
         0, 0, 1
      );
      metadata.ref_I_G = ref_F_G.mul(ref_F_I.inverse());
      metadata.ref_G_I = metadata.ref_I_G.inverse();
      return metadata;
   }

   this.GetOutputPath = function (filePath)
   {
      var outDir = null;
      if (!this.outputDir || this.outputDir.length == 0)
         outDir = File.extractDrive(filePath) + File.extractDirectory(filePath);
      else
         outDir = this.outputDir;
      var newPath = outDir + "/" +
         File.extractName(filePath) +
         this.suffix +
         File.extractSuffix(filePath);

      if (!this.overwrite && File.exists(newPath))
      {
         if (this.errorPolicy == ErrorPolicy.prototype.Ask)
         {
            var msg = new MessageBox("The file '" + newPath + "' already exists." + "\nDo you want to overwrite it?",
               TITLE, StdIcon_Error, StdButton_Yes, StdButton_No);
            var res = msg.execute();
            if (res != StdButton_Yes)
               throw "The file '" + newPath + "' already exists.";
         }
         else
            throw "The file '" + newPath + "' already exists.";
      }
      return newPath;
   };

   this.Execute = function ()
   {
      this.CalculateAutoParameters();
      var metadataTarget = this.CreateMetadata(this.width, this.height);

      // Initialize WarpObject
      var warp = new WarpImage();
      warp.suffix = this.suffix;
      warp.pixelInterpolation = this.pixelInterpolation;
      warp.clampingThreshold = this.clampingThreshold;

      // Process the images
      var errors = [];
      for (var i = 0; i < this.files.length; i++)
      {
         console.writeln("\n----------------------\nAligning '", this.files[i], "'");
         var window1 = null;
         var srcIsFile = !this.files[i].startsWith("window:");
         if (srcIsFile)
            window1 = ImageWindow.open(this.files[i])[0];
         else
            window1 = ImageWindow.windowById(this.files[i].substr(7));
         var resWindow = null;
         try
         {
            if (!window1 || window1.isNull)
               throw "Error opening image '" + this.files[i] + "'";

            resWindow = this.qualityHQ ? warp.AdaptImageHQ(metadataTarget, window1) : warp.AdaptImageLQ(metadataTarget, window1);

            if (srcIsFile)
            {
               var newPath = this.GetOutputPath(window1.filePath);
               resWindow.saveAs(newPath, false, false, true, false);
            }
            else
            {
               console.writeln("Result window: ", resWindow.mainView.fullId);
               resWindow.show();
            }
         } catch (exception)
         {
            console.writeln("**********************\nError: ", exception);
            errors.push({file:this.files[i], err:exception});
            if (this.errorPolicy == ErrorPolicy.prototype.Abort)
               return;
            else if (this.errorPolicy == ErrorPolicy.prototype.Ask)
            {
               var msg = new MessageBox(exception + "\nDo you want to continue with the process?",
                  TITLE, StdIcon_Error, StdButton_Yes, StdButton_No);
               var res = msg.execute();
               if (res == StdButton_No)
               {
                  console.writeln("<b>Process aborted!!</b>");
                  return;
               }
            }
         }
         finally
         {
            if (srcIsFile)
            {
               if (window1 && !window1.isNull)
                  window1.forceClose();
               if (resWindow)
                  resWindow.forceClose();
            }
         }
         if (errors.length == 0)
            console.writeln("\n<b>Process finished successfully.</b>");
         else
         {
            console.writeln(format("\n<b>Process finished with %d errors.</b>", errors.length));
            for (var i = 0; i < errors.length; i++)
            {
               console.writeln(errors[i].file + ":");
               console.writeln("    " + errors[i].err);
            }
         }
      }
   };
}

MosaicByCoordsEngine.prototype = new ObjectWithSettings;


function CheckVersion(major, minor, release)
{
   if (major == __PI_MAJOR__)
   {
      if (minor == __PI_MINOR__)
         return release <= __PI_RELEASE__;
      else
         return minor < __PI_MINOR__;
   }
   else
      return major < __PI_MAJOR__;
}

function main()
{
   console.abortEnabled = true;

   if (!CheckVersion(1, 8, 4))
   {
      new MessageBox("This script requires at least the version 1.8.4 of PixInsight", TITLE, StdIcon_Error, StdButton_Ok).execute();
      return;
   }

   var engine = new MosaicByCoordsEngine;
   if (Parameters.isViewTarget)
   {
      engine.Init(Parameters.targetView.window);

      // When executing on a target the debug windows are not necessary
      engine.useActive = true;
   }
   else
   {
      do {
         engine.Init(ImageWindow.activeWindow);
         var dialog = new MosaicByCoordsDialog(engine);
         var res = dialog.execute();

         if (!res)
         {
            if (dialog.resetRequest)
               engine = new MosaicByCoordsEngine();
            else
               return;
         }
      } while (!res);
      engine.SaveSettings();
   }

   engine.Execute();
}

main();
