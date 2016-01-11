/*
 AlignByCoordinates

 Align by Coordinates: Alignment of astronomical images using their coordinates.

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

 1.3:  * Keep the keywords of the images
       * Better error management

 1.2:  * Optional faster algorithm for warping the images

 1.1:  * Removed the capability of creating mosaics

 1.0:  * Added the capability of aligning images in open windows

 0.2:  * Fixed error invoking engine

 0.1:  * Initial test version.

 */

#feature-id    Utilities > AlignByCoordinates

#feature-info  Alignment of astronomical images using their coordinates.<br/>\
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

#define VERSION "1.3"
#define TITLE "AlignByCoordinates"
#define SETTINGS_MODULE "AlignCoord"


#include "WCSmetadata.jsh"
#include "ViewDialog.js"
#include "WarpImage.js"
;

// -------------------------------------
// CLASS AlignByCoordsDialog

function AlignByCoordsDialog(engine)
{
   this.__base__ = Dialog;
   this.__base__();
   this.restyle();

   this.labelWidth = this.font.width("Maximum magnitude:M");
   this.editWidth = this.font.width("XXXXXXXXXXXXXXXXX");

   this.helpLabel = new Label(this);
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.minWidth = 45 * this.font.width('M');
   this.helpLabel.scaledMargin = 6;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text =
      "<p><b>" + TITLE + " v" + VERSION + "</b> &mdash; Alignment of astronomical images using their coordinates.<br/>" +
         "<br/>" +
         "Copyright &copy; 2013-2015 Andr&eacute;s del Pozo</p>";

   // Mode
   this.mode_Label = new Label(this);
   this.mode_Label.text = "Execution mode:";
   this.mode_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.mode_Label.minWidth = this.labelWidth;

   this.mode_Combo = new ComboBox(this);
   this.mode_Combo.editEnabled = false;
   this.mode_Combo.addItem("Align images against reference");
   this.mode_Combo.addItem("Undistort images");
   this.mode_Combo.currentItem = engine.alignMode;
   //this.mode_Combo.minWidth = this.editWidth;
   this.mode_Combo.toolTip = "<p>This parameter defines the execution mode of the script:</p>" +
      "<ul><li></li>" +
      "<li></li>" +
      "<li></li></ul>";
   this.mode_Combo.onItemSelected = function ()
   {
      engine.alignMode = this.currentItem;
      this.dialog.reference_Combo.enabled = engine.alignMode != AlignMode.prototype.Undistort;
      this.dialog.referBrowse_Button.enabled = engine.alignMode != AlignMode.prototype.Undistort;
   };

   this.mode_Sizer = new HorizontalSizer;
   this.mode_Sizer.scaledSpacing = 6;
   this.mode_Sizer.add(this.mode_Label);
   this.mode_Sizer.add(this.mode_Combo);
   this.mode_Sizer.addStretch();

   // Reference Image
   this.reference_Label = new Label(this);
   this.reference_Label.text = "Reference image:";
   this.reference_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.reference_Label.setFixedWidth(this.labelWidth);

   this.reference_Combo = new ComboBox(this);
   this.reference_Combo.editEnabled = false;
   if (engine.referPath && engine.referIsPath)
      this.reference_Combo.addItem("File: (" + engine.referPath + ")");
   else
      this.reference_Combo.addItem("File: (????????)");
   this.reference_Combo.currentItem = 0;
   this.reference_Combo.enabled = engine.alignMode != AlignMode.prototype.Undistort;
   var windows = ImageWindow.windows;
   for (var i = 0; i < windows.length; i++)
   {
      this.reference_Combo.addItem(windows[i].mainView.id);
      if (!engine.referIsPath && engine.referWindow == windows[i].mainView.id)
         this.reference_Combo.currentItem = i + 1;
   }
   //this.reference_Combo.minWidth = this.editWidth;
   this.reference_Combo.toolTip = "<p>This parameter defines the reference image used in the aligment.<br/>" +
      "You can select a file choosing the first entry in the list and clicking the Browse button.<br/>" +
      "You can select an open image choosing its identifier in the list.</p>";
   this.reference_Combo.onItemSelected = function ()
   {
      if (this.currentItem == 0)
      {
         engine.referIsPath = true;
      }
      else
      {
         engine.referIsPath = false;
         engine.referWindow = this.itemText(this.currentItem);
      }
   };

   this.referBrowse_Button = new ToolButton(this);
   this.referBrowse_Button.icon = this.scaledResource( ":/icons/select-file.png" );
   //this.referBrowse_Button.setScaledFixedSize( 20, 20 );
   this.referBrowse_Button.text = "Browse";
   this.referBrowse_Button.toolTip = "<p>Click to open the file dialog for selecting the path of the reference image.</p>";
   this.referBrowse_Button.enabled = engine.alignMode != AlignMode.prototype.Undistort;
   this.referBrowse_Button.onClick = function ()
   {
      var ofd = new OpenFileDialog;
      ofd.initialPath = engine.referPath;
      ofd.caption = "Select reference image path";
      ofd.filters = [
         [ "FITS Files", ".fit", ".fits", ".fts" ]
      ];
      if (ofd.execute())
      {
         engine.referPath = ofd.fileName;
         engine.referIsPath = true;
         this.dialog.reference_Combo.removeItem(0);
         this.dialog.reference_Combo.insertItem(0, "File: (" + engine.referPath + ")");
         this.dialog.reference_Combo.currentItem = 0;
      }
   };

   this.reference_Sizer = new HorizontalSizer;
   this.reference_Sizer.scaledSpacing = 6;
   this.reference_Sizer.add(this.reference_Label);
   this.reference_Sizer.add(this.reference_Combo);
   this.reference_Sizer.add(this.referBrowse_Button);

   // Target images
   this.target_Group = new GroupBox(this);
   this.target_Group.title = "Target images";
   this.target_Group.sizer = new VerticalSizer;
   this.target_Group.sizer.scaledMargin = 8;
   this.target_Group.sizer.scaledSpacing = 6;

   // Active image
   this.active_Radio = new RadioButton(this);
   this.active_Radio.text = "Active window";
   //this.active_Radio.styleSheet = "QRadioButton { padding-left: 24px;}";
   this.active_Radio.checked = engine.useActive == true;
   this.active_Radio.minWidth = this.labelWidth;
   this.active_Radio.toolTip = "<p>Use the active image as the target for the alignment process.</p>";
   this.active_Radio.onCheck = function (value)
   {
      engine.useActive = true;
      this.dialog.EnableFileControls();
   }
   this.target_Group.sizer.add(this.active_Radio);

   // Files radio
   this.files_Radio = new RadioButton(this);
   this.files_Radio.text = "Images:";
   this.files_Radio.checked = !engine.useActive;
   this.files_Radio.minWidth = this.labelWidth;
   this.files_Radio.toolTip = "<p>The script will process a list of files or views.</p>";
   this.files_Radio.onCheck = function (value)
   {
      engine.useActive = false;
      this.dialog.EnableFileControls();
   };
   this.target_Group.sizer.add(this.files_Radio);

   // List of files
   this.files_List = new TreeBox(this);
   this.files_List.rootDecoration = false;
   this.files_List.alternateRowColor = true;
   this.files_List.multipleSelection = true;
   this.files_List.headerVisible = false;
   this.files_List.toolTip = "<p>List of images which will be processed.</p>";
   if (engine.files)
   {
      for (var i = 0; i < engine.files.length; ++i)
      {
         if(engine.files[i].startsWith("window:"))
         {
            var windowId = engine.files[i].substr(7);
            try{
               var window = ImageWindow.windowById(windowId);
               if(window == null || window.isNull)
               {
                  engine.files.splice(i,1);
                  i--;
               } else
               {
                  var node = new TreeBoxNode(this.files_List);
                  node.setText(0, windowId);
               }
            } catch (ex) {
               engine.files.splice(i,1);
               i--;
            }
         }else
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
         [ "FITS Files", ".fit", ".fits", ".fts" ]
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
   }

   // Add file button
   this.addView_Button = new PushButton(this);
   this.addView_Button.text = "Add windows";
   this.addView_Button.toolTip = "Add windows to the list";
   this.addView_Button.onMousePress = function ()
   {
      var viewDlg = new ViewDialog(true);
      viewDlg.execute();
      for(var i=0; i<viewDlg.selectedViews.length; i++)
      {
         engine.files.push("window:"+viewDlg.selectedViews[i]);
         var node = new TreeBoxNode(this.dialog.files_List);
         node.checkable = false;
         node.setText(0, viewDlg.selectedViews[i]);
      }
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
   this.files_Buttons = new HorizontalSizer;
   this.files_Buttons.scaledSpacing = 6;
   this.files_Buttons.add(this.addFile_Button);
   this.files_Buttons.add(this.addView_Button);
   this.files_Buttons.add(this.remove_Button);
   this.files_Buttons.addSpacing(8);
   this.files_Buttons.add(this.clear_Button);
   this.files_Buttons.addStretch();

   this.files_Sizer = new VerticalSizer;
   this.files_Sizer.scaledSpacing = 6;
   this.files_Sizer.add(this.files_List);
   this.files_Sizer.add(this.files_Buttons);
   this.files_Sizer.addStretch();
   this.target_Group.sizer.add(this.files_Sizer);

   this.EnableFileControls = function ()
   {
      this.files_List.enabled = engine.useActive == false;
      this.addFile_Button.enabled = engine.useActive == false;
      this.addView_Button.enabled = engine.useActive == false;
      this.remove_Button.enabled = engine.useActive == false;
      this.clear_Button.enabled = engine.useActive == false;
   }

   this.EnableFileControls();

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
   //this.outDir_Button.setScaledFixedSize( 20, 20 );
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
   this.suffix_Edit.minWidth = this.editWidth;
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
   this.suffix_Sizer.addScaledSpacing(20);
   this.suffix_Sizer.add(this.errorPolicy_Label);
   this.suffix_Sizer.add(this.errorPolicy_Combo);
   this.suffix_Sizer.addStretch();
   this.output_Control.sizer.add(this.suffix_Sizer);

   // usual control buttons

   this.newInstanceButton = new ToolButton(this);
   this.newInstanceButton.icon = this.scaledResource( ":/process-interface/new-instance.png" );
   //this.newInstanceButton.setScaledFixedSize( 20, 20 );
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
   //this.reset_Button.setScaledFixedSize( 20, 20 );
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
   //this.help_Button.setScaledFixedSize( 120, 120 );
   this.help_Button.toolTip = "<p>Browse Documentation</p>";
   this.help_Button.onClick = function ()
   {
      Dialog.browseScriptDocumentation("AlignByCoordinates");
   };

   this.ok_Button = new PushButton(this);
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function ()
   {
      try
      {
         // Validation
         if (engine.alignMode != AlignMode.prototype.Undistort)
         {
            if (engine.referIsPath && (!engine.referPath || engine.referPath.trim().length == 0))
               throw "The reference image path is empty";
            if (!engine.referIsPath && !ImageWindow.windowById(engine.referWindow).isWindow)
               throw "The reference image window is not valid";
         }

         if (engine.useActive && (!ImageWindow.activeWindow || !ImageWindow.activeWindow.isWindow))
            throw "There is not active window";

         if (!engine.useActive && engine.files.length == 0)
            throw "The file list is empty";

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
   this.sizer.add(this.mode_Sizer);
   this.sizer.add(this.reference_Sizer);
   this.sizer.add(this.target_Group);
   this.sizer.add(this.options_Section);
   this.sizer.add(this.options_Control);
   this.sizer.add(this.output_Section);
   this.sizer.add(this.output_Control);
   this.sizer.addScaledSpacing(8);
   this.sizer.add(this.buttons_Sizer);

   this.windowTitle = TITLE;
   this.adjustToContents();
   this.setFixedSize();
}
AlignByCoordsDialog.prototype = new Dialog;

// -------------------------------------
// ENUMERATION AlignMode

function AlignMode()
{
}
AlignMode.prototype.Reference = 0;
AlignMode.prototype.Undistort = 1;

// -------------------------------------
// ENUMERATION ErrorPolicy

function ErrorPolicy()
{
}
ErrorPolicy.prototype.Continue = 0;
ErrorPolicy.prototype.Abort = 1;
ErrorPolicy.prototype.Ask = 2;


// -------------------------------------
// CLASS AlignByCoordsEngine

function AlignByCoordsEngine()
{
   this.__base__ = ObjectWithSettings;
   this.__base__(
      SETTINGS_MODULE,
      "engine",
      new Array(
         [ "referWindow", DataType_String ],
         [ "referPath", DataType_String ],
         [ "referIsPath", DataType_Boolean ],
         [ "useActive", DataType_Boolean ],
         [ "files", Ext_DataType_StringArray ],
         [ "alignMode", DataType_UInt32 ],
         [ "qualityHQ", DataType_Boolean ],
         [ "pixelInterpolation", DataType_Int32 ],
         [ "clampingThreshold", DataType_Double ],
         [ "suffix", DataType_String ],
         [ "overwrite", DataType_Boolean ],
         [ "errorPolicy", DataType_Int32 ],
         [ "outputDir", DataType_String ]
      )
   );

   this.referIsPath = true;
   this.referWindow = "";
   this.referPath = "";
   this.useActive = true;
   this.files = [];
   this.alignMode = AlignMode.prototype.Reference;
   this.suffix = "_registered";
   this.qualityHQ = true;
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

   this.LinealMetadata = function (metadata)
   {
      var metadata2 = new ImageMetadata();
      metadata2.useFocal = false;
      metadata2.xpixsz = metadata.xpixsz;
      metadata2.epoch = metadata.epoch;
      metadata2.ra = metadata.ra;
      metadata2.dec = metadata.dec;
      metadata2.projection = metadata.projection;

      metadata2.width = metadata.width;
      metadata2.height = metadata.height;

      var ref_I_G0;
      if (metadata.ref_I_G_lineal)
         ref_I_G0 = metadata.ref_I_G_lineal;
      else
         ref_I_G0 = metadata.ref_I_G;

      metadata2.ref_I_G_lineal = ref_I_G0.mul(Matrix.unitMatrix(3));
      metadata2.ref_I_G = ReferNPolyn.prototype.FromLinealMatrix(ref_I_G0);
      metadata2.ref_G_I = ReferNPolyn.prototype.FromLinealMatrix(ref_I_G0.inverse());

      var resx = Math.sqrt(metadata2.ref_I_G_lineal.at(0, 0) * metadata2.ref_I_G_lineal.at(0, 0) + metadata2.ref_I_G_lineal.at(0, 1) * metadata2.ref_I_G_lineal.at(0, 1));
      var resy = Math.sqrt(metadata2.ref_I_G_lineal.at(1, 0) * metadata2.ref_I_G_lineal.at(1, 0) + metadata2.ref_I_G_lineal.at(1, 1) * metadata2.ref_I_G_lineal.at(1, 1));
      metadata2.resolution = (resx + resy) / 2;
      if (metadata2.xpixsz && metadata2.xpixsz > 0)
         metadata2.focal = metadata2.FocalFromResolution(metadata2.resolution);

      return metadata2;
   };

   // Resizes the metadata of an image for making it cover the given area in pixels
   this.ResizeMetadata = function (metadata, areaPx)
   {
      var metadata2 = new ImageMetadata();
      metadata2.focal = metadata.focal;
      metadata2.useFocal = false;
      metadata2.xpixsz = metadata.xpixsz;
      metadata2.resolution = metadata.resolution;
      metadata2.epoch = metadata.epoch;
      metadata2.ra = metadata.ra;
      metadata2.dec = metadata.dec;
      metadata2.projection = metadata.projection;

      metadata2.width = Math.ceil(areaPx.width);
      metadata2.height = Math.ceil(areaPx.height);

      var offset = new Matrix(
         1, 0, areaPx.left,
         0, 1, areaPx.top,
         0, 0, 1);

      var ref_I_G0;
      if (metadata.ref_I_G_lineal)
         ref_I_G0 = metadata.ref_I_G_lineal;
      else
         ref_I_G0 = metadata.ref_I_G;
      metadata2.ref_I_G_lineal = ref_I_G0.mul(offset);
      metadata2.ref_I_G = ReferNPolyn.prototype.FromLinealMatrix(metadata2.ref_I_G_lineal);
      metadata2.ref_G_I = ReferNPolyn.prototype.FromLinealMatrix(metadata2.ref_I_G_lineal.inverse());

      return metadata2;
   };

   // Creates a new geometry using the geometry of an image as template and removing the distortions
   this.UndistortMetadata = function (metadata, areaPx)
   {
      var metadataLineal = this.ResizeMetadata(metadata, new Rect(0, 0, metadata.width, metadata.height));
      var newBounds = WarpImage.GetPixelBounds(metadataLineal, metadata);
      return this.ResizeMetadata(metadataLineal, newBounds);
   };

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
         File.extractCompleteSuffix(filePath);

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

   this.GetTargetMetadata = function ()
   {
      // Get the reference metadata
      var metadata0 = new ImageMetadata();
      if (this.referIsPath)
      {
         var window0 = ImageWindow.open(this.referPath)[0];
         if (!window0 || window0.isNull)
            throw "Error opening reference image '" + this.referPath + "'";
         metadata0.ExtractMetadata(window0);
         window0.close();
      }
      else
      {
         var window0 = ImageWindow.windowById(this.referWindow);
         if (!window0 || window0.isNull)
            throw "Error opening reference window";
         metadata0.ExtractMetadata(window0);
      }

      return metadata0;
   };

   this.Execute = function ()
   {
      var metadataTarget = null;
      if (this.alignMode != AlignMode.prototype.Undistort)
      {
         try
         {
            metadataTarget = this.GetTargetMetadata();
         } catch (exception)
         {
            console.writeln(exception);
            return;
         }
      }

      // Initialize WarpObject
      var warp = new WarpImage();
      warp.suffix = this.suffix;
      warp.pixelInterpolation = this.pixelInterpolation;
      warp.clampingThreshold = this.clampingThreshold;

      // Process the images
      if (this.useActive)
      {
         try
         {
            var resWindow = null;
            if (this.alignMode == AlignMode.prototype.Undistort)
            {
               var metadataOrg = new ImageMetadata();
               metadataOrg.ExtractMetadata(this.currentWindow);
               var metadataTarget = this.UndistortMetadata(metadataOrg);
               resWindow = this.qualityHQ ? warp.AdaptImageHQ(metadataTarget, this.currentWindow) : warp.AdaptImageLQ(metadataTarget, this.currentWindow);
            }
            else
               resWindow = this.qualityHQ ? warp.AdaptImageHQ(metadataTarget, this.currentWindow) : warp.AdaptImageLQ(metadataTarget, this.currentWindow);
            resWindow.show();
         }
         catch (exception)
         {
            console.writeln("**********************\n\x1b[38;2;255;128;128mError: " + exception.toString() + "\x1b[0m");
            new MessageBox(exception, TITLE, StdIcon_Error, StdButton_Ok).execute();
         }
      }
      else
      {
         var errors = [];
         for (var i = 0; i < this.files.length; i++)
         {
            console.writeln("\n----------------------\nAligning '", this.files[i], "'");
            var window1 = null;
            var srcIsFile=!this.files[i].startsWith("window:");
            if(srcIsFile)
               window1 = ImageWindow.open(this.files[i])[0];
            else
               window1 = ImageWindow.windowById(this.files[i].substr(7));
            var resWindow = null;
            try
            {
               if (!window1 || window1.isNull)
                  throw "Error opening image '" + this.files[i] + "'";

               if (this.alignMode == AlignMode.prototype.Undistort)
               {
                  var metadataOrg = new ImageMetadata();
                  metadataOrg.ExtractMetadata(window1);
                  var metadataTarget = this.UndistortMetadata(metadataOrg);
                  resWindow = this.qualityHQ ? warp.AdaptImageHQ(metadataTarget, window1) : warp.AdaptImageLQ(metadataTarget, window1);
               }
               else
                  resWindow = this.qualityHQ ? warp.AdaptImageHQ(metadataTarget, window1) : warp.AdaptImageLQ(metadataTarget, window1);
               if(srcIsFile)
               {
                  var newPath = this.GetOutputPath(window1.filePath);
                  resWindow.saveAs(newPath, false, false, true, false);
               } else
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
               if(srcIsFile)
               {
                  if (window1 && !window1.isNull)
                     window1.forceClose();
                  if (resWindow)
                     resWindow.forceClose();
               }
            }
         }
         if (errors.length == 0)
            console.writeln("\n<b>Process finished successfully.</b>");
         else
         {
            console.writeln(format("\n<b>\x1b[38;2;255;128;128mProcess finished with %d errors.\x1b[0m</b>", errors.length));
            for (var i = 0; i < errors.length; i++)
            {
               console.writeln(errors[i].file + ":");
               console.writeln("    " + errors[i].err);
            }
         }
      }
   };

}

AlignByCoordsEngine.prototype = new ObjectWithSettings;


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

   var engine = new AlignByCoordsEngine;
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
         var dialog = new AlignByCoordsDialog(engine);
         var res = dialog.execute();

         if (!res)
         {
            if (dialog.resetRequest)
               engine = new AlignByCoordsEngine();
            else
               return;
         }
      } while (!res);
      engine.SaveSettings();
   }

   engine.Execute();
}

main();