/*
 Aperture Photometry script

 Script for measuring the flux of the known stars in astronomical images.

 Copyright (C) 2013-2014, Andres del Pozo, Vicent Peris (OAUV)
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

 1.2.1: * Fixed button "Browse output directory"

 1.2:   * The script now measures all the stars in an area 50% bigger than the field
          of view of the first image.
        * The queries to the catalog are now more efficient and the cache is kept
          between executions.
        * Option for saving the diagnostic images
        * Configuration of the prefix of the name of the output tables
        * New option "non-interactive" for non-interactive execution

 1.1.1: * Changes required by changes in ImageSolver

 1.1:   * Extract stars directly from the catalog
        * Force solve image
        * User defined objects
        * Use of new control for collapsible panels
        * Several Spectrophotometric Catalogs
            * III/126 Burnashev
            * II/183A Landolt
            * III/201 Pulkovo
            * III/202 Kharitonov
            * J/A+AS/92/1 Glushneva+
 1.0:   * Initial version.
 */

#feature-id    Image Analysis > AperturePhotometry

#feature-info  Script for measuring the flux of the known stars in astronomical images.<br/>\
<br/>\
Copyright &copy;2013 Andr&eacute;s del Pozo, Vicent Peris (OAUV)

#define VERSION "1.2.1"
#define TITLE "Aperture Photometry"
#define SETTINGS_MODULE "PHOT"
#ifndef STAR_CSV_FILE
#define STAR_CSV_FILE   File.systemTempDirectory + "/stars.csv"
#endif

//#define ACTIVATE_EXPERIMENTAL 1

#include <pjsr/DataType.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/TextAlign.jsh>

#ifndef __PJSR_SectionBar_jsh
#include <pjsr/SectionBar.jsh>
#endif

#include "WCSmetadata.jsh"
#include "AstronomicalCatalogs.jsh"
#include "SpectrophotometricCatalogs.js"
//#include "CollapsibleFrame.js"

#define USE_SOLVER_LIBRARY true
#include "ImageSolver.js"
#include "CircleSquareIntersect.js"
#include "SearchCoordinatesDialog.js"
#include "AutoStretch.js"

#define STARFLAG_MULTIPLE   0x01
#define STARFLAG_OVERLAPPED 0x02
#define STARFLAG_BADPOS     0x04
#define STARFLAG_LOWSNR     0x08
#define STARFLAG_SATURATED  0x10

#define BKGWINDOW_RING        0
#define BKGWINDOW_PHOTOMETRIC 1

#define BKGMODEL_SOURCE  0
#define BKGMODEL_MMT     1
#define BKGMODEL_ABE     2

#define EXTRACTMODE_IMAGE     0
#define EXTRACTMODE_REFERENCE 1
#define EXTRACTMODE_CATALOG   2

function StarCatalog()
{
   this.name = null;
   this.posEq = null;
}

function StarReference()
{
   this.orgPosPx = null; // Original position after aplying the referentiation matrix
   this.imgPosPx = null; // Position measured on the image
   this.flags = 0;
}

function StarImage()
{
   //   this.orgPosPx=null; // Original position after aplying the referentiation matrix
   this.imgPosPx = null; // Position measured on the image
   this.flux = null;
   //   this.centroidPx=null;
   this.flags = 0;
   this.hfd = null;
}

var ShowObject = function (msg, obj)
{
   console.write(msg, ":");
   for (var key in obj)
      console.write(" ", key);
   console.writeln();
}

function ImagesTab(parent, engine)
{
   this.__base__ = Frame;
   this.__base__(parent);

   this.Validate = function ()
   {
      if (engine.useActive && engine.currentWindow == null)
      {
         new MessageBox("There is not any active window", TITLE, StdIcon_Error, StdButton_Ok).execute();
         return false;
      }
      if (!engine.useActive && (engine.files == null || engine.files.length == 0))
      {
         new MessageBox("The list of files is empty", TITLE, StdIcon_Error, StdButton_Ok).execute();
         return false;
      }
      return true;
   }

   this.selected_Radio = new RadioButton(parent);
   this.selected_Radio.text = "Active image";
   this.selected_Radio.checked = engine.useActive == true;
   this.selected_Radio.minWidth = parent.labelWidth;
   this.selected_Radio.toolTip = "<p>The photometry is only computed for the active image in Pixinsight.</p>";
   this.selected_Radio.onCheck = function (value)
   {
      engine.useActive = true;
      this.parent.EnableFileControls();
   }

   this.files_Radio = new RadioButton(parent);
   this.files_Radio.text = "Local files:";
   this.files_Radio.checked = !engine.useActive;
   this.files_Radio.minWidth = parent.labelWidth;
   this.files_Radio.toolTip = "<p>The photometry is computed for the selected files.</p>";
   this.files_Radio.onCheck = function (value)
   {
      engine.useActive = false;
      this.parent.EnableFileControls();
   }

   // List of files
   this.files_List = new TreeBox(parent);
   this.files_List.rootDecoration = false;
   this.files_List.alternateRowColor = true;
   this.files_List.multipleSelection = true;
   this.files_List.headerVisible = false;
   this.files_List.numberOfColumns = 2;
   this.files_List.showColumn(1, false);
   this.files_List.toolTip = "<p>List of files for which the photometry will be computed.</p>";
   if (engine.files)
   {
      for (var i = 0; i < engine.files.length; ++i)
      {
         var node = new TreeBoxNode(this.files_List);
         node.setText(0, engine.files[i]);
      }
   }
   else
      engine.files = new Array();

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
            engine.files.push(ofd.fileNames[i]);
            var node = new TreeBoxNode(this.parent.files_List);
            node.checkable = false;
            node.setText(0, ofd.fileNames[i]);
         }
         this.parent.files_List.adjustColumnWidthToContents(1);
      }
   }

   // Remove file button
   this.remove_Button = new PushButton(this);
   this.remove_Button.text = "Remove files";
   this.remove_Button.toolTip = "Removes the selected files from the list";
   this.remove_Button.onMousePress = function ()
   {
      for (var i = this.parent.files_List.numberOfChildren - 1; i >= 0; i--)
      {
         if (this.parent.files_List.child(i).selected)
         {
            engine.files.splice(i, 1);
            this.parent.files_List.remove(i);
         }
      }
   }

   // Clear files button
   this.clear_Button = new PushButton(this);
   this.clear_Button.text = "Clear files";
   this.clear_Button.toolTip = "Clears the list of files";
   this.clear_Button.onMousePress = function ()
   {
      this.parent.files_List.clear();
      engine.files = new Array();
   }

   // Buttons for managing the list of files
   this.files_Buttons = new HorizontalSizer;
   this.files_Buttons.spacing = 6;
   this.files_Buttons.add(this.add_Button);
   this.files_Buttons.add(this.remove_Button);
   this.files_Buttons.addSpacing(8);
   this.files_Buttons.add(this.clear_Button);
   this.files_Buttons.addStretch();

   this.files_Sizer = new VerticalSizer;
   this.files_Sizer.spacing = 6;
   this.files_Sizer.add(this.files_List);
   this.files_Sizer.add(this.files_Buttons);
   this.files_Sizer.addStretch();

   this.EnableFileControls = function ()
   {
      this.files_List.enabled = engine.useActive == false;
      this.add_Button.enabled = engine.useActive == false;
      this.remove_Button.enabled = engine.useActive == false;
      this.clear_Button.enabled = engine.useActive == false;
   }

   this.EnableFileControls();

   this.EnableSolveControls = function ()
   {
      this.saveSolve_Check.enabled = engine.autoSolve || engine.forceSolve;
      this.suffix_Edit.enabled = (engine.autoSolve || engine.forceSolve) && engine.saveSolve;
      this.configSolver_Button.enabled = engine.autoSolve || engine.forceSolve;
   }

   //
   this.autoSolve_Check = new CheckBox(this);
   this.autoSolve_Check.text = "Plate-solve the unsolved images";
   this.autoSolve_Check.toolTip = "<p>When this option is active, the unsolved images are solved using the script ImageSolver.</p>";
   this.autoSolve_Check.checked = engine.autoSolve;
   this.autoSolve_Check.onCheck = function (checked)
   {
      engine.autoSolve = checked;
      this.dialog.images_Tab.EnableSolveControls();
   };

   this.configSolver_Button = new PushButton(this);
   this.configSolver_Button.text = "Configure solver";
   this.configSolver_Button.toolTip = "<p>Opens the configuration dialog for the script ImageSolver</p>";
   this.configSolver_Button.enabled = engine.autoSolve || engine.forceSolve;
   this.configSolver_Button.onClick = function ()
   {
      var solver = new ImageSolver();

      do {
         var solverWindow = null;
         if (engine.useActive)
            solverWindow = ImageWindow.activeWindow;
         else if (engine.files != null && engine.files.length > 0)
            solverWindow = ImageWindow.open(engine.files[0])[0];
         if (solverWindow == null)
            return new MessageBox("There is not any selected file or window", TITLE, StdIcon_Error, StdButton_Ok).execute();
         solver.Init(solverWindow);
         var dialog = new ImageSolverDialog(solver.solverCfg, solver.metadata, false);
         var res = dialog.execute();
         if (!res)
         {
            if (dialog.resetRequest)
               solver = new ImageSolver();
            else
               return null;
         }
         solver.solverCfg.SaveSettings();
         solver.metadata.SaveSettings();
         if (!engine.useActive)
            solverWindow.close();
      } while (!res);
      return null;
   };

   this.solver_Sizer = new HorizontalSizer;
   this.solver_Sizer.spacing = 6;
   this.solver_Sizer.add(this.autoSolve_Check);
   this.solver_Sizer.add(this.configSolver_Button);
   this.solver_Sizer.addStretch();

   //
   this.forceSolve_Check = new CheckBox(this);
   this.forceSolve_Check.text = "Force plate-solving the already solved images";
   this.forceSolve_Check.toolTip = "<p>When this option is active, all the images are solved using the script ImageSolver.<br/>" +
      "This option can be used when the current referentiation is not good enough and you desire to improve it.</p>";
   this.forceSolve_Check.checked = engine.forceSolve!=null && engine.forceSolve;
   this.forceSolve_Check.onCheck = function (checked)
   {
      engine.forceSolve = checked;
      this.dialog.images_Tab.EnableSolveControls();
   };

   //
   this.saveSolve_Check = new CheckBox(this);
   this.saveSolve_Check.text = "Save the solution of the plate solving";
   this.saveSolve_Check.toolTip = "<p>When this option is active, the solution of the plate solving is saved in the file of the image.</p>";
   this.saveSolve_Check.checked = engine.saveSolve;
   this.saveSolve_Check.enabled = engine.autoSolve || engine.forceSolve;
   this.saveSolve_Check.onCheck = function (checked)
   {
      engine.saveSolve = checked;
      this.dialog.images_Tab.EnableSolveControls();
   };

   //
   this.suffix_Label = new Label(this);
   this.suffix_Label.text = "Output file suffix:";
   this.suffix_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;

   this.suffix_Edit = new Edit(parent);
   this.suffix_Edit.text = engine.solveSuffix ? engine.solveSuffix : "";
   this.suffix_Edit.minWidth = parent.editWidth;
   this.suffix_Edit.toolTip = "<p>This suffix will be appended to the filename when saving the plate-solving solution.<br/>" +
      "If it is empty, the original file will be overwritten.</p>";
   this.suffix_Edit.enabled = (engine.autoSolve || engine.forceSolve) && engine.saveSolve;
   this.suffix_Edit.onTextUpdated = function (value)
   {
      engine.solveSuffix = value ? value.Trim() : "";
   };

   this.suffix_Sizer = new HorizontalSizer;
   this.suffix_Sizer.spacing = 6;
   this.suffix_Sizer.addSpacing(20);
   this.suffix_Sizer.add(this.suffix_Label);
   this.suffix_Sizer.add(this.suffix_Edit);
   this.suffix_Sizer.addStretch();

   // SOLVER FRAME
   this.solve_Section = new SectionBar(this, "Plate-solve parameters");
   this.solve_Section.toolTip = "This section contains the options for plate-solving the images.";
   this.solve_Section.onToggleSection = function(bar, toggleBegin )
   {
      if(!toggleBegin)
      {
         this.dialog.images_Tab.setFixedWidth();
         this.dialog.setVariableHeight();
         this.dialog.adjustToContents();
         this.dialog.images_Tab.adjustToContents();
         this.dialog.images_Tab.setVariableWidth();
         this.dialog.setFixedHeight();
      }
   }

   this.solve_Control = new Control(this);
   this.solve_Section.setSection(this.solve_Control);
   this.solve_Control.hide();
   this.solve_Control.sizer = new VerticalSizer;
   this.solve_Control.sizer.spacing = 4;
   this.solve_Control.sizer.add(this.solver_Sizer);
   this.solve_Control.sizer.add(this.forceSolve_Check);
   this.solve_Control.sizer.add(this.saveSolve_Check);
   this.solve_Control.sizer.add(this.suffix_Sizer);

   // Global sizer
   this.sizer = new VerticalSizer();
   this.sizer.margin = 8;
   this.sizer.spacing = 6;
   this.sizer.add(this.selected_Radio);
   this.sizer.add(this.files_Radio);
   this.sizer.add(this.files_Sizer);
   this.sizer.add(this.solve_Section);
   this.sizer.add(this.solve_Control);
   this.sizer.addStretch();
}
ImagesTab.prototype = new Frame;

function StarsTab(parent, engine)
{
   this.__base__ = Frame;
   this.__base__(parent);

   var FillFilterCombo = function (combo, catalog, filter)
   {
      combo.clear();
      for (var f = 0; f < catalog.filters.length; f++)
      {
         combo.addItem(catalog.filters[f]);
         if (catalog.filters[f] == filter)
            combo.currentItem = combo.numberOfItems - 1;
      }
   }

   // Stars source

   //
   this.magnitudeFilter_Combo = new ComboBox(parent);
   this.magnitudeFilter_Combo.editEnabled = false;
   this.magnitudeFilter_Combo.toolTip = "<p>Filter used in the magnitude test.</p>";
   this.magnitudeFilter_Combo.onItemSelected = function ()
   {
      engine.catalogFilter = this.itemText(this.currentItem)
   };

   //
   this.catalog_label = new Label(parent);
   this.catalog_label.text = "Catalog:";
   this.catalog_label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.catalog_label.minWidth = parent.labelWidth;

   this.catalog_Combo = new ComboBox(this);
   this.catalog_Combo.editEnabled = false;
   this.catalog_Combo.magnitudeCombo = this.magnitudeFilter_Combo;
   for (var i = 0; i < __catalogRegister__.catalogs.length; i++)
   {
      var catalog = __catalogRegister__.GetCatalog(i);
      if (catalog.filters)
      {
         this.catalog_Combo.addItem(catalog.name);
         if (engine.catalogName == catalog.name)
         {
            this.catalog_Combo.currentItem = this.catalog_Combo.numberOfItems - 1;
            FillFilterCombo(this.magnitudeFilter_Combo, catalog, engine.catalogFilter);
         }
      }
   }
   this.catalog_Combo.minWidth = parent.editWidth;
   this.catalog_Combo.toolTip = "<p>Catalog that contains the coordinates of the stars that are going to be measured.</p>";
   this.catalog_Combo.onItemSelected = function ()
   {
      engine.catalogName = this.itemText(this.currentItem)
      var catalog = __catalogRegister__.GetCatalog(engine.catalogName);
      FillFilterCombo(this.magnitudeCombo, catalog, catalog.magnitudeFilter);
      engine.catalogFilter = catalog.magnitudeFilter;
   };

   this.catalog_Sizer = new HorizontalSizer;
   this.catalog_Sizer.spacing = 6;
   this.catalog_Sizer.add(this.catalog_label);
   this.catalog_Sizer.add(this.catalog_Combo);
   this.catalog_Sizer.addStretch();

   //
   this.server_label = new Label(parent);
   this.server_label.text = "VizieR server:";
   this.server_label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.server_label.minWidth = parent.labelWidth;

   this.mirror_Combo = new ComboBox(this);
   this.mirror_Combo.editEnabled = false;
   this.mirror_Combo.toolTip = "<p>Select the best VizieR server for your location</p>";
   this.mirror_Combo.setFixedWidth(this.font.width("Mnananai") * 5);
   for (var m = 0; m < VizierCatalog.mirrors.length; m++)
   {
      this.mirror_Combo.addItem(VizierCatalog.mirrors[m].name);
      if (VizierCatalog.mirrors[m].address == engine.vizierServer)
         this.mirror_Combo.currentItem = parseInt(m);
   }
   this.mirror_Combo.onItemSelected = function ()
   {
      engine.vizierServer = VizierCatalog.mirrors[this.currentItem].address;
   };
   this.server_Sizer = new HorizontalSizer;
   this.server_Sizer.spacing = 6;
   this.server_Sizer.add(this.server_label);
   this.server_Sizer.add(this.mirror_Combo);
   this.server_Sizer.addStretch();

   //
   this.maxMag_Label = new Label(parent);
   this.maxMag_Label.text = "Maximum magnitude:";
   this.maxMag_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.maxMag_Label.minWidth = parent.labelWidth;

   this.maxMag_Edit = new Edit(parent);
   if (engine.maxMagnitude != null)
      this.maxMag_Edit.text = format("%f", engine.maxMagnitude);
   this.maxMag_Edit.minWidth = parent.editWidth;
   this.maxMag_Edit.toolTip = "<p>Maximum magnitude extracted from the catalog.</p>";
   this.maxMag_Edit.onTextUpdated = function (value)
   {
      engine.maxMagnitude = parseFloat(value);
   };

   this.maxMag_Sizer = new HorizontalSizer;
   this.maxMag_Sizer.spacing = 6;
   this.maxMag_Sizer.add(this.maxMag_Label);
   this.maxMag_Sizer.add(this.maxMag_Edit);
   this.maxMag_Sizer.add(this.magnitudeFilter_Combo);
   this.maxMag_Sizer.addStretch();

   this.starsSource_Group = new GroupBox(parent);
   this.starsSource_Group.title = "Stars Catalog";
   this.starsSource_Group.sizer = new VerticalSizer;
   this.starsSource_Group.sizer.margin = 8;
   this.starsSource_Group.sizer.spacing = 6;
   this.starsSource_Group.sizer.add(this.catalog_Sizer);
   this.starsSource_Group.sizer.add(this.server_Sizer);
   this.starsSource_Group.sizer.add(this.maxMag_Sizer);

   // MANUAL OBJECTS
   this.manual_SectionBar = new SectionBar(this, "User defined objects");
   this.manual_SectionBar.toolTip = "This panel contains objects that will be measured but aren't in the catalog.";
   this.manual_SectionBar.onToggleSection = function(bar, toggleBegin )
   {
      var tab = this.dialog.stars_Tab;
      if (!toggleBegin)
      {
         tab.setFixedWidth();
         this.dialog.setVariableHeight();
         this.dialog.adjustToContents();
         tab.adjustToContents();
         tab.setVariableWidth();
         this.dialog.setFixedHeight();
      }
   }
   this.manual_Control = new Control(this);
   this.manual_SectionBar.setSection(this.manual_Control);
   this.manual_Control.hide();
   this.manual_Control.sizer = new HorizontalSizer;
   this.manual_Control.sizer.spacing = 4;

   this.AddObjectNode = function (object, node)
   {
      if(node==null)
         node = new TreeBoxNode(this.manual_List);
      node.setText(0,object.name?object.name:"");
      node.setText(1,DMSangle.FromAngle(object.posEq.x/15).ToString(true));
      node.setText(2,DMSangle.FromAngle(object.posEq.y).ToString());
      return node;
   }

   //engine.manualObjects = [ {name:"Test1", posEq:{x:238.1234567890123456789,y:-17}},{name:"Test2", posEq:{x:18,y:88}}];
   this.manual_List = new TreeBox(parent);
   this.manual_List.rootDecoration = false;
   this.manual_List.alternateRowColor = true;
   this.manual_List.multipleSelection = true;
   this.manual_List.headerVisible = true;
   this.manual_List.numberOfColumns = 3;
   this.manual_List.setScaledFixedHeight(120);
   this.manual_List.setHeaderText(0,"Name");
   this.manual_List.setHeaderText(1,"RA");
   this.manual_List.setHeaderText(2,"Dec");
   if(engine.manualObjects)
   {
      for(var i=0; i<engine.manualObjects.length; i++)
         this.AddObjectNode(engine.manualObjects[i], null);
   } else
      engine.manualObjects = [];
   this.manual_List.onNodeSelectionUpdated = function()
   {
      var numSelected = this.dialog.stars_Tab.manual_List.selectedNodes.length;
      this.dialog.stars_Tab.manualDelete_Button.enabled = numSelected>0;
      this.dialog.stars_Tab.manualEdit_Button.enabled = numSelected==1;
   }

   this.manualAdd_Button = new ToolButton(parent);
   this.manualAdd_Button.icon = this.scaledResource( ":/icons/add.png" );
   this.manualAdd_Button.setScaledFixedSize( 20, 20 );
   this.manualAdd_Button.toolTip = "<p>Add a new object</p>";
   this.manualAdd_Button.onMousePress = function ()
   {
      var coordsDlg = new SearchCoordinatesDialog(null,true,true);
      if(coordsDlg.execute())
      {
         var object = coordsDlg.object;
         if (object == null)
            return;
         this.dialog.stars_Tab.AddObjectNode(object, null);
         engine.manualObjects.push(object);
      }
   }

   this.manualDelete_Button = new ToolButton(parent);
   this.manualDelete_Button.icon = this.scaledResource( ":/icons/delete.png" );
   this.manualDelete_Button.setScaledFixedSize( 20, 20 );
   this.manualDelete_Button.toolTip = "<p>Delete the selected objects</p>";
   this.manualDelete_Button.enabled = false;
   this.manualDelete_Button.onMousePress = function ()
   {
      var manual_List = this.dialog.stars_Tab.manual_List;
      for (var i = manual_List.numberOfChildren - 1; i >= 0; i--)
      {
         if (manual_List.child(i).selected)
         {
            engine.manualObjects.splice(i, 1);
            manual_List.remove(i);
         }
      }
   }

   this.manualEdit_Button = new ToolButton(parent);
   this.manualEdit_Button.icon = this.scaledResource( ":/icons/list-edit.png" );
   this.manualEdit_Button.setScaledFixedSize( 20, 20 );
   this.manualEdit_Button.toolTip = "<p>Edit the coordinates of the selected object</p>";
   this.manualEdit_Button.enabled = false;
   this.manualEdit_Button.onMousePress = function ()
   {
      var frame = this.dialog.stars_Tab;
      if (frame.manual_List.selectedNodes.length==1)
      {
         var objectIdx = frame.manual_List.childIndex(frame.manual_List.selectedNodes[0]);
         var coordsDlg = new SearchCoordinatesDialog(engine.manualObjects[objectIdx],true,true);
         if(coordsDlg.execute())
         {
            var object = coordsDlg.object;
            if (object == null)
               return;
            this.dialog.stars_Tab.AddObjectNode(object, frame.manual_List.selectedNodes[0]);
            engine.manualObjects[objectIdx]=object;
         }
      }
   }

   this.manualButtons_Sizer = new VerticalSizer;
   this.manualButtons_Sizer.spacing = 6;
   this.manualButtons_Sizer.addSpacing(20);
   this.manualButtons_Sizer.add(this.manualAdd_Button);
   this.manualButtons_Sizer.add(this.manualDelete_Button);
   this.manualButtons_Sizer.add(this.manualEdit_Button);
   this.manualButtons_Sizer.addStretch();

   this.manual_Control.sizer.add(this.manual_List);
   this.manual_Control.sizer.add(this.manualButtons_Sizer);

   //
   this.image_Label = new Label(parent);
   this.image_Label.text = "Extract stars from:";
   this.image_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;

   this.catalog_Radio = new RadioButton(parent);
   this.catalog_Radio.text = "catalog";
   this.catalog_Radio.styleSheet = "QRadioButton { padding-left: 24px;}";
   this.catalog_Radio.checked = engine.extractMode == EXTRACTMODE_CATALOG;
   //this.each_Radio.minWidth = parent.labelWidth;
   this.catalog_Radio.toolTip = "<p>The position of the stars is calculated by projecting the catalog coordinates " +
      "to image coordinates using the referentiation stored in the image.<br/>" +
      "This option is only valid when the referentiation is very good. However, if the referentiation " +
      "is good enough, it allows to predict the position of stars in the image with very low SNR.</p>";
   this.catalog_Radio.onCheck = function (value)
   {
      engine.extractMode = EXTRACTMODE_CATALOG;
      this.dialog.stars_Tab.reference_Combo.enabled = false;
   }


   this.each_Radio = new RadioButton(parent);
   this.each_Radio.text = "each image";
   this.each_Radio.styleSheet = "QRadioButton { padding-left: 24px;}";
   this.each_Radio.checked = engine.extractMode == EXTRACTMODE_IMAGE;
   //this.each_Radio.minWidth = parent.labelWidth;
   this.each_Radio.toolTip = "<p>The stars are extracted from each image searching for the best position " +
      "using the catalog coordinates as a starting point.</p>";
   this.each_Radio.onCheck = function (value)
   {
      engine.extractMode = EXTRACTMODE_IMAGE;
      this.dialog.stars_Tab.reference_Combo.enabled = false;
   }

   this.reference_Radio = new RadioButton(parent);
   this.reference_Radio.text = "reference image (EXPERIMENTAL)";
   this.reference_Radio.styleSheet = "QRadioButton { padding-left: 24px;}";
   this.reference_Radio.checked = engine.extractMode == EXTRACTMODE_REFERENCE;
   //this.reference_Radio.minWidth = parent.labelWidth;
   this.reference_Radio.toolTip = "<p>The stars are extracted from a reference image and then mapped to each image.<br/>" +
      "If the reference image is the integration of several images the SNR is better and the star extraction process " +
      "<i>should</i> be more precise.<br/><b>THIS OPTION IS EXPERIMENTAL</b></p>";
   this.reference_Radio.onCheck = function (value)
   {
      engine.extractMode = EXTRACTMODE_REFERENCE;
      this.dialog.stars_Tab.reference_Combo.enabled = true;
   }

   this.reference_Combo = new ComboBox(this);
   this.reference_Combo.styleSheet = "QComboBox { margin-left: 48px;}";
   var windowList = ImageWindow.windows;
   this.reference_Combo.addItem("<None>");
   for (var i = 0; i < windowList.length; i++)
   {
      if (windowList[i].mainView.image.numberOfChannels == 1 /*&&
       windowList[i].mainView.image.width == engine.window.mainView.image.width &&
       windowList[i].mainView.image.height == engine.window.mainView.image.height*/)
      {
         this.reference_Combo.addItem(windowList[i].mainView.id);
         if (engine.starsReference == windowList[i].mainView.id)
            this.reference_Combo.currentItem = this.reference_Combo.numberOfItems - 1;
      }
   }
   this.reference_Combo.enabled = engine.extractMode == EXTRACTMODE_REFERENCE;
   this.reference_Combo.toolTip = "<p>Reference image used in the star extraction process.</p>";
   this.reference_Combo.onItemSelected = function ()
   {
      if (this.currentItem == 0)
         engine.starsReference = null;
      else
         engine.starsReference = this.itemText(this.currentItem);
   };

   //
   this.starExtraction_SectionBar = new SectionBar(this, "Source for star extraction");
   this.starExtraction_SectionBar.toolTip = "This panel configures how are the stars found on the image.";
   this.starExtraction_SectionBar.onToggleSection = function(bar, toggleBegin )
   {
      var tab = this.dialog.stars_Tab;
      if (!toggleBegin)
      {
         tab.setFixedWidth();
         this.dialog.setVariableHeight();
         this.dialog.adjustToContents();
         tab.adjustToContents();
         tab.setVariableWidth();
         this.dialog.setFixedHeight();
      }
   }

   this.starExtraction_Control = new Frame(this);
   this.starExtraction_SectionBar.setSection(this.starExtraction_Control);
   this.starExtraction_Control.hide();
   this.starExtraction_Control.sizer = new VerticalSizer;
   this.starExtraction_Control.sizer.spacing = 4;
   this.starExtraction_Control.sizer.add(this.image_Label, 100, Align_Left);
   this.starExtraction_Control.sizer.add(this.catalog_Radio);
   this.starExtraction_Control.sizer.add(this.each_Radio);
   this.starExtraction_Control.sizer.add(this.reference_Radio);
   this.starExtraction_Control.sizer.add(this.reference_Combo);

   //
   this.starsOptions_Group = new GroupBox(parent);
   this.starsOptions_Group.title = "Star extraction options";
   this.starsOptions_Group.sizer = new VerticalSizer;
   this.starsOptions_Group.sizer.margin = 8;
   this.starsOptions_Group.sizer.spacing = 6;

   ///
   this.margin_Label = new Label(parent);
   this.margin_Label.text = "Margin:";
   this.margin_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.margin_Label.minWidth = parent.labelWidth;

   this.margin_Edit = new Edit(parent);
   if (engine.margin != null)
      this.margin_Edit.text = format("%d", engine.margin);
   this.margin_Edit.toolTip = "<p>Minimum distance in pixels to the borders.</p>";
   this.margin_Edit.minWidth = parent.editWidth;
   this.margin_Edit.onTextUpdated = function (value)
   {
      var margin = parseInt(value);
      if (margin > 0)
         engine.margin = margin;
      else
         (new MessageBox("The margin must be greater than 0", TITLE, StdIcon_Error, StdButton_Ok)).execute();
   };

   this.marginUnits_Label = new Label(parent);
   this.marginUnits_Label.text = "pixels";
   this.marginUnits_Label.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.margin_Sizer = new HorizontalSizer;
   this.margin_Sizer.spacing = 6;
   this.margin_Sizer.add(this.margin_Label);
   this.margin_Sizer.add(this.margin_Edit);
   this.margin_Sizer.add(this.marginUnits_Label);
   this.margin_Sizer.addStretch();
   this.starsOptions_Group.sizer.add(this.margin_Sizer);

   // Global sizer
   this.sizer = new VerticalSizer();
   this.sizer.margin = 8;
   this.sizer.spacing = 6;
   this.sizer.add(this.starsSource_Group);
   this.sizer.add(this.manual_SectionBar);
   this.sizer.add(this.manual_Control);
   this.sizer.add(this.starExtraction_SectionBar);
   this.sizer.add(this.starExtraction_Control);
   this.sizer.add(this.starsOptions_Group);
   this.sizer.addStretch();

}
StarsTab.prototype = new Frame;

function FluxTab(parent, engine)
{
   this.__base__ = Frame;
   this.__base__(parent);

   this.Validate = function ()
   {
      if (engine.manualFilter && (engine.filter == null || engine.filter.length == 0))
      {
         new MessageBox("The filter field is empty", TITLE, StdIcon_Error, StdButton_Ok).execute();
         return false;
      }
      if (!engine.manualFilter && (engine.filterKeyword == null || engine.filterKeyword.length == 0))
      {
         new MessageBox("The filter keyword is empty", TITLE, StdIcon_Error, StdButton_Ok).execute();
         return false;
      }

      if (engine.minimumAperture < 2)
      {
         new MessageBox("The minimum aperture can not be less than 2", TITLE, StdIcon_Error, StdButton_Ok).execute();
         return false;
      }

      if (engine.apertureSteps < 1)
      {
         new MessageBox("The number of aperture steps must be 1 or more.", TITLE, StdIcon_Error, StdButton_Ok).execute();
         return false;
      }

      if (engine.apertureSteps >= 2 && engine.apertureStepSize <= 0)
      {
         new MessageBox("The aperture step size must be greater than 0", TITLE, StdIcon_Error, StdButton_Ok).execute();
         return false;
      }

      return true;
   }

   //
   this.filter_Label = new RadioButton(this);
   this.filter_Label.text = "Filter:";
   this.filter_Label.checked = engine.manualFilter;
   this.filter_Label.textAlignment = TextAlign_Left | TextAlign_VertCenter;
   this.filter_Label.minWidth = parent.labelWidth;
   this.filter_Label.onCheck = function (value)
   {
      engine.manualFilter = true;
      this.parent.EnableFilterControls();
   }

   this.filter_Combo = new ComboBox(this);
   this.filter_Combo.editEnabled = true;
   this.filter_Combo.addItem("R");
   this.filter_Combo.addItem("G");
   this.filter_Combo.addItem("B");
   this.filter_Combo.addItem("Johnson U");
   this.filter_Combo.addItem("Johnson B");
   this.filter_Combo.addItem("Johnson V");
   this.filter_Combo.addItem("Johnson R");
   this.filter_Combo.addItem("Johnson I");
   this.filter_Combo.addItem("SDSS u'");
   this.filter_Combo.addItem("SDSS g'");
   this.filter_Combo.addItem("SDSS r'");
   this.filter_Combo.addItem("SDSS i'");
   this.filter_Combo.addItem("SDSS z'");
   this.filter_Combo.minWidth = parent.editWidth;
   if (engine.filter)
      this.filter_Combo.editText = engine.filter;

   this.filter_Combo.toolTip = "<p>Filter used in the images.</p>";
   this.filter_Combo.onItemSelected = function ()
   {
      engine.filter = this.itemText(this.currentItem)
   };
   this.filter_Combo.onEditTextUpdated = function ()
   {
      engine.filter = this.editText;
   };

   this.filter_Sizer = new HorizontalSizer;
   this.filter_Sizer.spacing = 6;
   this.filter_Sizer.add(this.filter_Label);
   this.filter_Sizer.add(this.filter_Combo);
   this.filter_Sizer.addStretch();

   //
   this.filterKey_Label = new RadioButton(this);
   this.filterKey_Label.text = "Filter keyword:";
   this.filterKey_Label.checked = !engine.manualFilter;
   this.filterKey_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.filterKey_Label.minWidth = parent.labelWidth;
   this.filterKey_Label.onCheck = function (value)
   {
      engine.manualFilter = false;
      this.parent.EnableFilterControls();
   }

   this.filterKey_Combo = new ComboBox(this);
   this.filterKey_Combo.editEnabled = true;
   this.filterKey_Combo.addItem("FILTER");
   this.filterKey_Combo.minWidth = parent.editWidth;
   if (engine.filterKeyword)
      this.filterKey_Combo.editText = engine.filterKeyword;

   this.filterKey_Combo.toolTip = "<p>FITS keyword that contains the filter used in the image.</p>";
   this.filterKey_Combo.onItemSelected = function ()
   {
      engine.filterKeyword = this.itemText(this.currentItem)
   };
   this.filterKey_Combo.onEditTextUpdated = function ()
   {
      engine.filterKeyword = this.editText;
   };

   this.filterKey_Sizer = new HorizontalSizer;
   this.filterKey_Sizer.spacing = 6;
   this.filterKey_Sizer.add(this.filterKey_Label);
   this.filterKey_Sizer.add(this.filterKey_Combo);
   this.filterKey_Sizer.addStretch();

   this.filter_Frame = new Frame(this);
   this.filter_Frame.sizer = new VerticalSizer;
   this.filter_Frame.sizer.margin = 0;
   this.filter_Frame.sizer.spacing = 4;
   this.filter_Frame.style = FrameStyle_Flat;
   this.filter_Frame.sizer.add(this.filter_Sizer);
   this.filter_Frame.sizer.add(this.filterKey_Sizer);
   this.filter_Frame.tabControl = this;
   this.filter_Frame.EnableFilterControls = function ()
   {
      this.tabControl.filter_Combo.enabled = engine.manualFilter;
      this.tabControl.filterKey_Combo.enabled = !engine.manualFilter;
   }

   this.filter_Frame.EnableFilterControls();

   //
   this.apertureShape_Label = new Label(this);
   this.apertureShape_Label.text = "Aperture Shape:";
   this.apertureShape_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.apertureShape_Label.minWidth = parent.labelWidth;

   this.apertureSquare_Radio = new RadioButton(this);
   this.apertureSquare_Radio.text = "Square";
   this.apertureSquare_Radio.checked = engine.apertureShape == 0;
   //this.apertureSquare_Radio.minWidth = parent.labelWidth;
   this.apertureSquare_Radio.toolTip = "<p>The photometry is computed using an square window.<br/>The aperture size is the side of the square.</p>";
   this.apertureSquare_Radio.onCheck = function (value)
   {
      engine.apertureShape = 0;
   }

   this.apertureCircle_Radio = new RadioButton(this);
   this.apertureCircle_Radio.text = "Circle";
   this.apertureCircle_Radio.checked = engine.apertureShape == 1;
   //this.apertureCircle_Radio.minWidth = parent.labelWidth;
   this.apertureCircle_Radio.toolTip = "<p>The photometry is computed using a circular window.<br/>The aperture size is the diameter of the circle.</p>";
   this.apertureCircle_Radio.onCheck = function (value)
   {
      engine.apertureShape = 1;
   }

   this.apertureShape_Frame = new Frame(this);
   this.apertureShape_Frame.sizer = new HorizontalSizer;
   this.apertureShape_Frame.sizer.margin = 0;
   this.apertureShape_Frame.sizer.spacing = 6;
   this.apertureShape_Frame.style = FrameStyle_Flat;
   this.apertureShape_Frame.sizer.add(this.apertureShape_Label);
   this.apertureShape_Frame.sizer.add(this.apertureSquare_Radio);
   this.apertureShape_Frame.sizer.add(this.apertureCircle_Radio);
   this.apertureShape_Frame.sizer.addStretch();

   //
   this.minimumAperture_Label = new Label(this);
   this.minimumAperture_Label.text = "Minimum Aperture:";
   this.minimumAperture_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.minimumAperture_Label.minWidth = parent.labelWidth;

   this.minimumAperture_Edit = new Edit(this);
   if (engine.minimumAperture != null)
      this.minimumAperture_Edit.text = format("%g", engine.minimumAperture);
   this.minimumAperture_Edit.toolTip = "<p>Minimum aperture used for computing the flux.<br/>It is the side of a square or the diameter of a circle centered on the star.</p>";
   this.minimumAperture_Edit.minWidth = parent.editWidth;
   this.minimumAperture_Edit.onTextUpdated = function (value)
   {
      engine.minimumAperture = parseFloat(value);
   };

   this.minimumApertureUnits_Label = new Label(this);
   this.minimumApertureUnits_Label.text = "pixels";
   this.minimumApertureUnits_Label.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.minimumAperture_Sizer = new HorizontalSizer;
   this.minimumAperture_Sizer.spacing = 6;
   this.minimumAperture_Sizer.add(this.minimumAperture_Label);
   this.minimumAperture_Sizer.add(this.minimumAperture_Edit);
   this.minimumAperture_Sizer.add(this.minimumApertureUnits_Label);
   this.minimumAperture_Sizer.addStretch();

   //
   this.apertureSteps_Label = new Label(this);
   this.apertureSteps_Label.text = "Aperture Steps:";
   this.apertureSteps_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.apertureSteps_Label.minWidth = parent.labelWidth;

   this.apertureSteps_Edit = new Edit(this);
   if (engine.apertureSteps != null)
      this.apertureSteps_Edit.text = format("%d", engine.apertureSteps);
   this.apertureSteps_Edit.toolTip = "<p>Number of aperture steps in the photometry calculation.</p>";
   this.apertureSteps_Edit.minWidth = parent.editWidth;
   this.apertureSteps_Edit.onTextUpdated = function (value)
   {
      var steps = parseInt(value);
      if (steps > 0)
         engine.apertureSteps = steps;
      else
         (new MessageBox("The number of steps must be greater than 0", TITLE, StdIcon_Error, StdButton_Ok)).execute();
   };

   this.apertureSteps_Sizer = new HorizontalSizer;
   this.apertureSteps_Sizer.spacing = 6;
   this.apertureSteps_Sizer.add(this.apertureSteps_Label);
   this.apertureSteps_Sizer.add(this.apertureSteps_Edit);
   this.apertureSteps_Sizer.addStretch();

   //
   this.apertureStepSize_Label = new Label(this);
   this.apertureStepSize_Label.text = "Aperture Step Size:";
   this.apertureStepSize_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.apertureStepSize_Label.minWidth = parent.labelWidth;

   this.apertureStepSize_Edit = new Edit(this);
   if (engine.apertureStepSize != null)
      this.apertureStepSize_Edit.text = format("%g", engine.apertureStepSize);
   this.apertureStepSize_Edit.toolTip = "<p>When doing multiaperture photometry (Aperture Steps > 1), this field defines the increment of the aperture size in each step.</p>";
   this.apertureStepSize_Edit.minWidth = parent.editWidth;
   this.apertureStepSize_Edit.onTextUpdated = function (value)
   {
      engine.apertureStepSize = parseFloat(value);
   };

   this.apertureStepSizeUnits_Label = new Label(this);
   this.apertureStepSizeUnits_Label.text = "pixels";
   this.apertureStepSizeUnits_Label.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.apertureStepSize_Sizer = new HorizontalSizer;
   this.apertureStepSize_Sizer.spacing = 6;
   this.apertureStepSize_Sizer.add(this.apertureStepSize_Label);
   this.apertureStepSize_Sizer.add(this.apertureStepSize_Edit);
   this.apertureStepSize_Sizer.add(this.apertureStepSizeUnits_Label);
   this.apertureStepSize_Sizer.addStretch();

   //
   this.gain_Label = new Label(this);
   this.gain_Label.text = "CCD gain:";
   this.gain_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.gain_Label.minWidth = parent.labelWidth;

   this.gain_Edit = new Edit(this);
   if (engine.gain != null)
      this.gain_Edit.text = format("%f", engine.gain);
   this.gain_Edit.minWidth = parent.editWidth;
   this.gain_Edit.toolTip = "<p>Gain of the camera in e-/ADU.</p>";
   this.gain_Edit.onTextUpdated = function (value)
   {
      engine.gain = parseFloat(value);
   };

   this.gainUnits_Label = new Label(this);
   this.gainUnits_Label.text = "e-/ADU";
   this.gainUnits_Label.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.gainLoad_Button = new ToolButton(this);
   this.gainLoad_Button.icon = this.scaledResource( ":/icons/window-export.png" );
   this.gainLoad_Button.setScaledFixedSize( 20, 20 );
   this.gainLoad_Button.toolTip = "Get the gain value from the FITS keyword 'EGAIN'";
   this.gainLoad_Button.onMousePress = function ()
   {
      var window = null;
      if (engine.useActive)
         window = ImageWindow.activeWindow;
      else if (engine.files && engine.files.length > 0)
         window = ImageWindow.open(engine.files[0])[0];
      if (window)
      {
         var gainOk = false;
         var keywords = window.keywords;
         for (var i = 0; i < keywords.length && !gainOk; i++)
         {
            var key = keywords[i];
            if (key && key.name == "EGAIN")
            {
               engine.gain = parseFloat(key.value);
               this.dialog.flux_Tab.gain_Edit.text = format("%f", engine.gain);
               gainOk = true;
            }
         }
         if (!gainOk)
            new MessageBox("The image has not a 'EGAIN' keyword", TITLE, StdIcon_Error, StdButton_Ok).execute();
         if (!engine.useActive)
            window.close();
      }
   };

   this.gain_Sizer = new HorizontalSizer;
   this.gain_Sizer.spacing = 6;
   this.gain_Sizer.add(this.gain_Label);
   this.gain_Sizer.add(this.gain_Edit);
   this.gain_Sizer.add(this.gainUnits_Label);
   this.gain_Sizer.add(this.gainLoad_Button);
   this.gain_Sizer.addStretch();

   //
   this.minSNR_Label = new Label(this);
   this.minSNR_Label.text = "SNR threshold:";
   this.minSNR_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.minSNR_Label.minWidth = parent.labelWidth;

   this.minSNR_Edit = new Edit(this);
   if (engine.minSNR != null)
      this.minSNR_Edit.text = format("%g", engine.minSNR);
   this.minSNR_Edit.minWidth = parent.editWidth;
   this.minSNR_Edit.toolTip = "<p>The stars with a Signal to Noise Ratio (SNR) less than this threshold are measured but the value 4 (LOWSNR) is added to the flags.</p>";
   this.minSNR_Edit.onTextUpdated = function (value)
   {
      engine.minSNR = parseFloat(value);
   };

   this.minSNR_Sizer = new HorizontalSizer;
   this.minSNR_Sizer.spacing = 6;
   this.minSNR_Sizer.add(this.minSNR_Label);
   this.minSNR_Sizer.add(this.minSNR_Edit);
   this.minSNR_Sizer.addStretch();

   //
   this.saturation_Label = new Label(this);
   this.saturation_Label.text = "Saturation threshold:";
   this.saturation_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.saturation_Label.minWidth = parent.labelWidth;

   this.saturation_Edit = new Edit(this);
   if (engine.saturationThreshold != null)
      this.saturation_Edit.text = format("%g", engine.saturationThreshold * 100);
   this.saturation_Edit.minWidth = parent.editWidth;
   this.saturation_Edit.toolTip = "<p>The stars that have a pixel with a value over this threshold are measured but the value 8 (SATURATED) is added to the flags.</p>";
   this.saturation_Edit.onTextUpdated = function (value)
   {
      engine.saturationThreshold = parseFloat(value) / 100;
   };

   this.saturationUnits_Label = new Label(this);
   this.saturationUnits_Label.text = "%";
   this.saturationUnits_Label.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.saturation_Sizer = new HorizontalSizer;
   this.saturation_Sizer.spacing = 6;
   this.saturation_Sizer.add(this.saturation_Label);
   this.saturation_Sizer.add(this.saturation_Edit);
   this.saturation_Sizer.add(this.saturationUnits_Label);
   this.saturation_Sizer.addStretch();

   /////
   this.photometry_Group = new GroupBox(this);
   this.photometry_Group.title = "Photometry";
   this.photometry_Group.sizer = new VerticalSizer;
   this.photometry_Group.sizer.margin = 8;
   this.photometry_Group.sizer.spacing = 8;
   this.photometry_Group.sizer.add(this.filter_Frame);
   this.photometry_Group.sizer.add(this.apertureShape_Frame);
   this.photometry_Group.sizer.add(this.minimumAperture_Sizer);
   this.photometry_Group.sizer.add(this.apertureSteps_Sizer);
   this.photometry_Group.sizer.add(this.apertureStepSize_Sizer);
   this.photometry_Group.sizer.add(this.gain_Sizer);
   this.photometry_Group.sizer.add(this.minSNR_Sizer);
   this.photometry_Group.sizer.add(this.saturation_Sizer);

   // Global sizer
   this.sizer = new VerticalSizer();
   this.sizer.margin = 8;
   this.sizer.spacing = 6;
   this.sizer.add(this.photometry_Group);
   this.sizer.addStretch();
}
FluxTab.prototype = new Frame;

function BackgroundTab(parent, engine)
{
   this.__base__ = Frame;
   this.__base__(parent);

   var EnableBkgControls = function (frame)
   {
      frame.bkgRing_Edit1.enabled = engine.bkgWindowMode == BKGWINDOW_RING;
      frame.bkgRing_Edit2.enabled = engine.bkgWindowMode == BKGWINDOW_RING;
      frame.bkgMMTLayers_Combo.enabled = engine.bkgModel == BKGMODEL_MMT;
      frame.backgroundSigmaLow_Edit.enabled = engine.bkgModel == BKGMODEL_SOURCE;
      frame.backgroundSigmaHigh_Edit.enabled = engine.bkgModel == BKGMODEL_SOURCE;
      frame.bkgSourceModel_Radio.enabled = engine.bkgWindowMode != BKGWINDOW_PHOTOMETRIC;
      frame.bkgPhoto_Radio.enabled = engine.bkgModel != BKGMODEL_SOURCE;
   }

   //
   this.window_Group = new GroupBox(parent);
   this.window_Group.title = "Background aperture:";
   this.window_Group.sizer = new VerticalSizer();
   this.window_Group.sizer.margin = 8;
   this.window_Group.sizer.spacing = 6;

   //
   this.ring_Radio = new RadioButton(this);
   this.ring_Radio.text = "Square ring:";
   this.ring_Radio.checked = engine.bkgWindowMode == BKGWINDOW_RING;
   this.ring_Radio.minWidth = parent.labelWidth;
   this.ring_Radio.toolTip = "<p>The background is extracted from an square ring around each star</p>";
   this.ring_Radio.onCheck = function (value)
   {
      if (value)
      {
         engine.bkgWindowMode = BKGWINDOW_RING;
         EnableBkgControls(this.dialog.background_Tab);
      }
   }

   this.bkgRing_Label1 = new Label(this);
   this.bkgRing_Label1.text = "internal=";
   this.bkgRing_Label1.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.bkgRing_Edit1 = new Edit(this);
   if (engine.bkgAperture1 != null)
      this.bkgRing_Edit1.text = format("%d", engine.bkgAperture1);
   this.bkgRing_Edit1.setFixedWidth(parent.editWidth2);
   this.bkgRing_Edit1.toolTip = "<p>Width of the internal hole in the background window.</p>";
   this.bkgRing_Edit1.onTextUpdated = function (value)
   {
      engine.bkgAperture1 = parseInt(value);
   };

   this.bkgRing_Label2 = new Label(this);
   this.bkgRing_Label2.text = "external=";
   this.bkgRing_Label2.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.bkgRing_Edit2 = new Edit(this);
   if (engine.bkgAperture2 != null)
      this.bkgRing_Edit2.text = format("%d", engine.bkgAperture2);
   this.bkgRing_Edit2.setFixedWidth(parent.editWidth2);
   this.bkgRing_Edit2.toolTip = "<p>Width of the background window.</p>";
   this.bkgRing_Edit2.onTextUpdated = function (value)
   {
      engine.bkgAperture2 = parseInt(value);
   };

   this.bkgRingUnits_Label = new Label(this);
   this.bkgRingUnits_Label.text = "pixels";
   this.bkgRingUnits_Label.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.bkgRing_Sizer = new HorizontalSizer;
   this.bkgRing_Sizer.spacing = 6;
   this.bkgRing_Sizer.add(this.ring_Radio);
   this.bkgRing_Sizer.add(this.bkgRing_Label1);
   this.bkgRing_Sizer.add(this.bkgRing_Edit1);
   this.bkgRing_Sizer.add(this.bkgRing_Label2);
   this.bkgRing_Sizer.add(this.bkgRing_Edit2);
   this.bkgRing_Sizer.add(this.bkgRingUnits_Label);
   this.bkgRing_Sizer.addStretch();
   this.window_Group.sizer.add(this.bkgRing_Sizer);

   //
   this.bkgPhoto_Radio = new RadioButton(this);
   this.bkgPhoto_Radio.text = "Photometric aperture";
   this.bkgPhoto_Radio.checked = engine.bkgWindowMode == BKGWINDOW_PHOTOMETRIC;
   this.bkgPhoto_Radio.minWidth = parent.labelWidth;
   this.bkgPhoto_Radio.toolTip = "<p>The background is extracted from the same window as the flux calculation.<br/>" +
      "This option requires an MMT or ABE model.</p>";
   this.bkgPhoto_Radio.onCheck = function (value)
   {
      if (value)
      {
         engine.bkgWindowMode = BKGWINDOW_PHOTOMETRIC;
         if (engine.bkgModel == BKGMODEL_SOURCE)
         {
            engine.bkgModel = BKGMODEL_MMT;
            this.dialog.background_Tab.bkgMMTModel_Radio.checked = true;
         }
         EnableBkgControls(this.dialog.background_Tab);
      }
   }
   this.window_Group.sizer.add(this.bkgPhoto_Radio);

   //
   this.bkgModel_Group = new GroupBox(parent);
   this.bkgModel_Group.title = "Background model:";
   this.bkgModel_Group.sizer = new VerticalSizer();
   this.bkgModel_Group.sizer.margin = 8;
   this.bkgModel_Group.sizer.spacing = 6;

   //
   this.bkgSourceModel_Radio = new RadioButton(this);
   this.bkgSourceModel_Radio.text = "Source image";
   this.bkgSourceModel_Radio.checked = engine.bkgModel == BKGMODEL_SOURCE;
   this.bkgSourceModel_Radio.minWidth = parent.labelWidth;
   this.bkgSourceModel_Radio.toolTip = "<p>The background is extracted from the same window as the flux calculation.<br/>" +
      "This option can not be used with the option 'Photometric window'.</p>";
   this.bkgSourceModel_Radio.onCheck = function (value)
   {
      if (value)
      {
         engine.bkgModel = BKGMODEL_SOURCE;
         if (engine.bkgWindowMode == BKGWINDOW_PHOTOMETRIC)
         {
            engine.bkgWindowMode = BKGWINDOW_RING;
            this.dialog.background_Tab.ring_Radio.checked = true;
         }
         EnableBkgControls(this.dialog.background_Tab);
      }
   }

   this.sigma1_Label = new Label(this);
   this.sigma1_Label.text = "Sigma low=";
   this.sigma1_Label.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.backgroundSigmaLow_Edit = new Edit(this);
   if (engine.backgroundSigmaLow != null)
      this.backgroundSigmaLow_Edit.text = format("%g", engine.backgroundSigmaLow);
   this.backgroundSigmaLow_Edit.setFixedWidth(parent.editWidth2);
   this.backgroundSigmaLow_Edit.toolTip = "<p>Rejection factor in the 'Median Sigma Clipping' used for computing the background around a star.</p>";
   this.backgroundSigmaLow_Edit.onTextUpdated = function (value)
   {
      engine.backgroundSigmaLow = parseFloat(value);
   };

   this.sigma2_Label = new Label(this);
   this.sigma2_Label.text = "high=";
   this.sigma2_Label.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.backgroundSigmaHigh_Edit = new Edit(this);
   if (engine.backgroundSigmaHigh != null)
      this.backgroundSigmaHigh_Edit.text = format("%g", engine.backgroundSigmaHigh);
   this.backgroundSigmaHigh_Edit.setFixedWidth(parent.editWidth2);
   this.backgroundSigmaHigh_Edit.toolTip = "<p>Rejection factor in the 'Median Sigma Clipping' used for computing the background around a star.</p>";
   this.backgroundSigmaHigh_Edit.onTextUpdated = function (value)
   {
      engine.backgroundSigmaHigh = parseFloat(value);
   };

   this.bkgSourceModel_Sizer = new HorizontalSizer;
   this.bkgSourceModel_Sizer.spacing = 6;
   this.bkgSourceModel_Sizer.add(this.bkgSourceModel_Radio);
   this.bkgSourceModel_Sizer.add(this.sigma1_Label);
   this.bkgSourceModel_Sizer.add(this.backgroundSigmaLow_Edit);
   this.bkgSourceModel_Sizer.add(this.sigma2_Label);
   this.bkgSourceModel_Sizer.add(this.backgroundSigmaHigh_Edit);
   this.bkgSourceModel_Sizer.addStretch();

   this.bkgModel_Group.sizer.add(this.bkgSourceModel_Sizer);

   //
   this.bkgMMTModel_Radio = new RadioButton(this);
   this.bkgMMTModel_Radio.text = "Multiscale Median Transform";
   this.bkgMMTModel_Radio.checked = engine.bkgModel == BKGMODEL_MMT;
   this.bkgMMTModel_Radio.minWidth = parent.labelWidth;
   this.bkgMMTModel_Radio.toolTip = "<p>The background is extracted from a model image generated using the" +
      "process Multiscale Median Transform. This process removes the smaller scale layers in order to elminate the stars.</p>";
   this.bkgMMTModel_Radio.onCheck = function (value)
   {
      if (value)
      {
         engine.bkgModel = BKGMODEL_MMT;
         EnableBkgControls(this.dialog.background_Tab);
      }
   }

   this.bkgMMTLayers_Label = new Label(this);
   this.bkgMMTLayers_Label.text = "Layers to remove:";
   this.bkgMMTLayers_Label.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.bkgMMTLayers_Combo = new ComboBox(this);
   this.bkgMMTLayers_Combo.editEnabled = false;
   //this.bkgMMTLayers_Combo.setFixedWidth(this.font.width("8MMM"));
   this.bkgMMTLayers_Combo.toolTip = "<p>Select the number of layers to remove to obtain the background.<br/>" +
      "This parameter can be fine tuned using the option '<i>Show MultiscaleMedianTransform background</i>' " +
      "in the output tab.</p>";
   for (var i = 1; i <= 8; i++)
      this.bkgMMTLayers_Combo.addItem(i.toString());
   this.bkgMMTLayers_Combo.currentItem = engine.bkgMMTlayers - 1;
   this.bkgMMTLayers_Combo.onItemSelected = function ()
   {
      engine.bkgMMTlayers = this.currentItem + 1;
   };

   this.bkgMMT_Sizer = new HorizontalSizer;
   this.bkgMMT_Sizer.spacing = 6;
   this.bkgMMT_Sizer.add(this.bkgMMTModel_Radio);
   this.bkgMMT_Sizer.add(this.bkgMMTLayers_Label);
   this.bkgMMT_Sizer.add(this.bkgMMTLayers_Combo);
   this.bkgMMT_Sizer.addStretch();
   this.bkgModel_Group.sizer.add(this.bkgMMT_Sizer);

   //
   this.bkgABEModel_Radio = new RadioButton(this);
   this.bkgABEModel_Radio.text = "Automatic Background Extraction";
   this.bkgABEModel_Radio.checked = engine.bkgModel == BKGMODEL_ABE;
   this.bkgABEModel_Radio.minWidth = parent.labelWidth;
   this.bkgABEModel_Radio.toolTip = "<p>The background is extracted from a model image generated using the " +
      "process Automatic Background Extraction.</p>";
   this.bkgABEModel_Radio.onCheck = function (value)
   {
      if (value)
      {
         engine.bkgModel = BKGMODEL_ABE;
         EnableBkgControls(this.dialog.background_Tab);
      }
   }
   this.bkgModel_Group.sizer.add(this.bkgABEModel_Radio);

   EnableBkgControls(this);

   // Global sizer
   this.sizer = new VerticalSizer();
   this.sizer.margin = 8;
   this.sizer.spacing = 6;
   this.sizer.add(this.window_Group);
   this.sizer.add(this.bkgModel_Group);
   //this.sizer.add(this.background_Group);
   this.sizer.addStretch();
}
BackgroundTab.prototype = new Frame;

function OutputTab(parent, engine)
{
   this.__base__ = Frame;
   this.__base__(parent);

   //
   this.outDir_Label = new Label(parent);
   this.outDir_Label.text = "Output Directory:";
   this.outDir_Label.textAlignment = TextAlign_Left | TextAlign_VertCenter;
   //this.outDir_Label.minWidth = parent.labelWidth;

   this.outDir_Edit = new Edit(this);
   if (engine.outputDir)
      this.outDir_Edit.text = engine.outputDir;
   this.outDir_Edit.setScaledMinWidth(300);
   this.outDir_Edit.toolTip = "<p>Path of the directory where the output tables will be written.<br/>" +
      "If it is empty, the tables will be written in the directory of the first image.</p>";
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
   this.outDir_Button.toolTip = "<p>Select a directory for the output tables.</p>";
   this.outDir_Button.onClick = function ()
   {
      var gdd = new GetDirectoryDialog();
      if (engine.outputDir)
         gdd.initialPath = engine.outputDir;
      gdd.caption = "Select the output directory";
      if (gdd.execute())
      {
         engine.outputDir = gdd.directory;
         this.parent.outDir_Edit.text = gdd.directory;
      }
   };

   this.outDir_Sizer = new HorizontalSizer;
   this.outDir_Sizer.spacing = 4;
   this.outDir_Sizer.add(this.outDir_Label);
   this.outDir_Sizer.add(this.outDir_Edit, 100);
   this.outDir_Sizer.add(this.outDir_Button);

   //
   this.foundStars_Check = new CheckBox(this);
   this.foundStars_Check.text = "Generate images with detected stars";
   this.foundStars_Check.toolTip = "<p>Generates images the with detected stars.</p>"+
      "<p>The images are shown in new windows or saved in files depending on the value of the option 'Save debug images'.</p>";
   this.foundStars_Check.checked = engine.showFoundStars;
   this.foundStars_Check.onCheck = function (checked)
   {
      engine.showFoundStars = checked;
   };

   //
   this.backModel_Check = new CheckBox(this);
   this.backModel_Check.text = "Show background model";
   this.backModel_Check.toolTip = "<p>Generates images the with the background model for each target image.</p>"+
      "<p>The images are shown in new windows or saved in files depending on the value of the option 'Save debug images'.</p>";
   this.backModel_Check.checked = engine.showBackgroundModel;
   this.backModel_Check.onCheck = function (checked)
   {
      engine.showBackgroundModel = checked;
   };

   //
   this.saveDiag_Check = new CheckBox(this);
   this.saveDiag_Check.text = "Save debug images";
   this.saveDiag_Check.toolTip = "<p>Saves the debug images (detected stars and background model).</p>"+
      "<p>The images are saved in the output directory or, if it is not set in the directory of the images.</p>";
   this.saveDiag_Check.checked = engine.saveDiagnostic;
   this.saveDiag_Check.onCheck = function (checked)
   {
      engine.saveDiagnostic = checked;
   };

   // Debug images group
   this.debug_Group = new GroupBox(this);
   this.debug_Group.title = "Debug images:";
   this.debug_Group.sizer = new VerticalSizer;
   this.debug_Group.sizer.margin = 6;
   this.debug_Group.sizer.spacing = 4;
   this.debug_Group.sizer.add(this.foundStars_Check);
   this.debug_Group.sizer.add(this.backModel_Check);
   this.debug_Group.sizer.add(this.saveDiag_Check);

   //
   this.outPrefix_Label = new Label(parent);
   this.outPrefix_Label.text = "Table Prefix:";
   this.outPrefix_Label.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.outPrefix_Edit = new Edit(this);
   if (engine.outputPrefix)
      this.outPrefix_Edit.text = engine.outputPrefix;
   this.outPrefix_Edit.minWidth = 20 * this.font.width('M');
   this.outPrefix_Edit.toolTip = "<p>Prefix used in the names of the output tables.</p>";
   this.outPrefix_Edit.onTextUpdated = function (value)
   {
      if (value.trim().length > 0)
         engine.outputPrefix = value.trim();
      else
         engine.outputPrefix = null;
   };

   this.outPrefix_Sizer = new HorizontalSizer;
   this.outPrefix_Sizer.spacing = 4;
   this.outPrefix_Sizer.add(this.outPrefix_Label);
   this.outPrefix_Sizer.add(this.outPrefix_Edit);
   this.outPrefix_Sizer.addStretch();

   //
   this.fileTable_Check = new CheckBox(this);
   this.fileTable_Check.text = "Generate a table for each image with its information";
   this.fileTable_Check.toolTip = "This tables contains all the information available for the image, including catalog data and photometry calculations";
   this.fileTable_Check.checked = engine.generateFileTable;
   this.fileTable_Check.onCheck = function (checked)
   {
      engine.generateFileTable = checked;
   };

   //
   this.fluxTable_Check = new CheckBox(this);
   this.fluxTable_Check.text = "Generate flux tables";
   this.fluxTable_Check.toolTip = "The flux tables contains a summary of the measured fluxes of all the stars and images. The table will be generated in the output directory.";
   this.fluxTable_Check.checked = engine.generateFluxTable;
   this.fluxTable_Check.onCheck = function (checked)
   {
      engine.generateFluxTable = checked;
   };

   //
   this.backgTable_Check = new CheckBox(this);
   this.backgTable_Check.text = "Generate background table";
   this.backgTable_Check.toolTip = "The background table contains a summary of the measured backgrounds of all the stars and images. The table will be generated in the output directory.";
   this.backgTable_Check.checked = engine.generateBackgTable;
   this.backgTable_Check.onCheck = function (checked)
   {
      engine.generateBackgTable = checked;
   };

   //
   this.snrTable_Check = new CheckBox(this);
   this.snrTable_Check.text = "Generate SNR table";
   this.snrTable_Check.toolTip = "The SNR table contains a summary of the measured SNR (Signal to Noise Ratio) of all the stars and images. The table will be generated in the output directory.";
   this.snrTable_Check.checked = engine.generateSNRTable;
   this.snrTable_Check.onCheck = function (checked)
   {
      engine.generateSNRTable = checked;
   };

   //
   this.flagTable_Check = new CheckBox(this);
   this.flagTable_Check.text = "Generate flags table";
   this.flagTable_Check.toolTip = "The flags table contains a summary of the flags of all the stars and images. The table will be generated in the output directory.";
   this.flagTable_Check.checked = engine.generateFlagTable;
   this.flagTable_Check.onCheck = function (checked)
   {
      engine.generateFlagTable = checked;
   };

   //
   this.errorLog_Check = new CheckBox(this);
   this.errorLog_Check.text = "Generate error file";
   this.errorLog_Check.toolTip = "The error file contains all the errors that occurred in the process. It is only written if there is at least one error.";
   this.errorLog_Check.checked = engine.generateErrorLog;
   this.errorLog_Check.onCheck = function (checked)
   {
      engine.generateErrorLog = checked;
   };

   // Photometry tables group
   this.tables_Group = new GroupBox(this);
   this.tables_Group.title = "Photometry tables:";
   this.tables_Group.sizer = new VerticalSizer;
   this.tables_Group.sizer.margin = 6;
   this.tables_Group.sizer.spacing = 4;
   this.tables_Group.sizer.add(this.outPrefix_Sizer);
   this.tables_Group.sizer.add(this.fileTable_Check);
   this.tables_Group.sizer.add(this.fluxTable_Check);
   this.tables_Group.sizer.add(this.backgTable_Check);
   this.tables_Group.sizer.add(this.snrTable_Check);
   this.tables_Group.sizer.add(this.flagTable_Check);
   this.tables_Group.sizer.addSpacing(6);
   this.tables_Group.sizer.add(this.errorLog_Check);

   // Global sizer
   this.sizer = new VerticalSizer();
   this.sizer.margin = 8;
   this.sizer.spacing = 6;
   this.sizer.add(this.outDir_Sizer);
   this.sizer.add(this.debug_Group);
   this.sizer.add(this.tables_Group);
   this.sizer.addStretch();
}
OutputTab.prototype = new Frame;

function PhotometryDialog(engine)
{
   this.__base__ = Dialog;
   this.__base__();
   this.restyle();

   this.labelWidth = this.font.width("Maximum magnitude:M");
   this.editWidth = this.font.width("MMMMMMMMMMM");
   this.editWidth2 = this.font.width("M2.5M");

   this.helpLabel = new Label(this);
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.minWidth = 45 * this.font.width('M');
   this.helpLabel.margin = 6;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text =
      "<p><b>" + TITLE + " v" + VERSION + "</b> &mdash; A script for measuring the flux of the known stars in astronomical images.<br/>" +
         "<br/>" +
         "Copyright &copy; 2013-2014 Andr&eacute;s del Pozo, Vicent Peris (OAUV)</p>";


   this.images_Tab = new ImagesTab(this, engine);
   this.stars_Tab = new StarsTab(this, engine);
   this.flux_Tab = new FluxTab(this, engine);
   this.background_Tab = new BackgroundTab(this, engine);
   this.output_Tab = new OutputTab(this, engine);

   // Tab control
   this.tabs = new TabBox(this);
   this.tabs.addPage(this.images_Tab, "Images");
   this.tabs.addPage(this.stars_Tab, "Stars");
   this.tabs.addPage(this.flux_Tab, "Star flux");
   this.tabs.addPage(this.background_Tab, "Background");
   this.tabs.addPage(this.output_Tab, "Output");

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
      Dialog.browseScriptDocumentation( "AperturePhotometry" );
   };

   this.ok_Button = new PushButton(this);
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function ()
   {
      if (!this.parent.images_Tab.Validate())
         return;
      if (!this.parent.flux_Tab.Validate())
         return;
      this.dialog.ok();
   };

   this.cancel_Button = new PushButton(this);
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function ()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.add(this.newInstanceButton);
   this.buttons_Sizer.add(this.reset_Button);
   this.buttons_Sizer.add(this.help_Button);
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add(this.ok_Button);
   this.buttons_Sizer.add(this.cancel_Button);

   // Global sizer

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 6;
   //this.sizer.add( this.helpLabel );
   //this.sizer.addSpacing( 4 );
   this.sizer.add(this.helpLabel);
   this.sizer.add(this.tabs);

   this.sizer.addSpacing(8);
   this.sizer.add(this.buttons_Sizer);

   this.windowTitle = TITLE;
   this.adjustToContents();
   this.setFixedSize();
}
PhotometryDialog.prototype = new Dialog;



// *********
// This object has been copied from the NoiseEvaluation script by Pleiades Astrophoto
// *********
/**
 * Estimation of the standard deviation of the noise, assuming a Gaussian
 * noise distribution.
 *
 * - Use MRS noise evaluation when the algorithm converges for 4 >= J >= 2
 *
 * - Use k-sigma noise evaluation when either MRS doesn't converge or the
 *   length of the noise pixels set is below a 1% of the image area.
 *
 * - Automatically iterate to find the highest layer where noise can be
 *   successfully evaluated, in the [1,3] range.
 */
function NoiseEvaluation(img)
{
   var a, n = 4, m = 0.01 * img.selectedRect.area;
   for (; ;)
   {
      a = img.noiseMRS(n);
      if (a[1] >= m)
         break;
      if (--n == 1)
      {
         //console.writeln( "<end><cbr>** Warning: No convergence in MRS noise evaluation routine - using k-sigma noise estimate." );
         a = img.noiseKSigma();
         break;
      }
   }
   this.sigma = a[0]; // estimated stddev of Gaussian noise
   this.count = a[1]; // number of pixels in the noise pixels set
   this.layers = n;   // number of layers used for noise evaluation
}

function MedianSigmaClipping(values, nsigmaLow, nsigmaHigh)
{
   this.Iteration = function (median, stdDev, sigmaLow, sigmaHigh)
   {
      var rangeMin = median - stdDev * sigmaLow;
      var rangeMax = median + stdDev * sigmaHigh;
      var validValues = [];
      for (var i = 0; i < values.length; i++)
         if (values[i] >= rangeMin && values[i] <= rangeMax)
            validValues.push(values[i]);
      var result;
      if (validValues.length > 0)
      {
         result = {};
         result.median = Math.median(validValues);
         result.stdDev = this.StdDev(validValues, result.median);
         result.rejection = (values.length - validValues.length) / values.length;
         // console.writeln("NumValid:",validValues.length," median:",result.median," stdDev:",result.stdDev);
      }
      return result;
   };

   this.StdDev = function (values, reference)
   {
      return Math.stdDev(values);
   };

   var state = {};
   state.median = Math.median(values);
   state.stdDev = this.StdDev(values, state.median);
   state.rejection = 0;
   // console.writeln("NumOrg:",values.length," median:",state.median," stdDev:",state.stdDev);
   for (var it = 0; it < 5; it++)
   {
      var result = this.Iteration(state.median, state.stdDev, nsigmaLow, nsigmaHigh);
      if (result == null)
      {
         state.rejection = 1;
         return state;
      }

      if (state.median == result.median && state.stdDev == result.stdDev)
         return state;
      state = result;
   }

   return state;
}

function PhotometryEngine(w)
{
   this.__base__ = ObjectWithSettings;
   this.__base__(
      SETTINGS_MODULE,
      "phot",
      new Array(
         ["apertureShape", DataType_UInt32],
         ["minimumAperture", DataType_Double],
         ["apertureSteps", DataType_UInt32],
         ["apertureStepSize", DataType_Double],
         ["bkgWindowMode", DataType_UInt32],
         ["bkgModel", DataType_UInt32],
         ["backgroundSigmaLow", DataType_Double],
         ["backgroundSigmaHigh", DataType_Double],
         ["bkgAperture1", DataType_UInt32],
         ["bkgAperture2", DataType_UInt32],
         ["bkgMMTlayers", DataType_UInt32],
         ["minSNR", DataType_Double],
         ["showFoundStars", DataType_Boolean],
         ["maxMagnitude", DataType_Double],
         ["defaultFocal", DataType_Double],
         ["gain", DataType_Double],
         ["saturationThreshold", DataType_Double],
         ["manualFilter", DataType_Boolean],
         ["filter", DataType_UCString],
         ["filterKeyword", DataType_UCString],
         ["margin", DataType_UInt32],
         ["catalogName", DataType_UCString],
         ["catalogFilter", DataType_UCString],
         ["vizierServer", DataType_UCString],

         ["useActive", DataType_Boolean],
         ["extractMode", DataType_UInt32],
         ["starsReference", DataType_UCString],
         ["manualObjects", Ext_DataType_JSON],
         ["outputDir", DataType_UCString],
         ["outputPrefix", DataType_UCString],
         ["generateFileTable", DataType_Boolean],
         ["generateFluxTable", DataType_Boolean],
         ["generateBackgTable", DataType_Boolean],
         ["generateSNRTable", DataType_Boolean],
         ["generateFlagTable", DataType_Boolean],
         ["saveDiagnostic", DataType_Boolean],
         ["autoSolve", DataType_Boolean],
         ["forceSolve", DataType_Boolean],
         ["saveSolve", DataType_Boolean],
         ["solveSuffix", DataType_UCString],
         ["generateErrorLog", DataType_Boolean],
         ["showBackgroundModel", DataType_Boolean],
         ["files", Ext_DataType_StringArray]
      )
   );

   //this.backgroundMode = BKGMODE_FIXED;

   this.bkgWindowMode = BKGWINDOW_PHOTOMETRIC;
   this.bkgModel = BKGMODEL_MMT;
   this.minimumAperture = 8;
   this.apertureShape = 0;
   this.apertureSteps = 1;
   this.apertureStepSize = 1;
   this.backgroundSigmaLow = 5;
   this.backgroundSigmaHigh = 2.5;
   this.bkgFlatten = false;
   this.bkgAperture1 = 30;
   this.bkgAperture2 = 60;
   this.bkgMMTlayers = 8;
   this.showBackgroundModel = false;
   this.outputDir = null;
   this.outputPrefix = "Table_";
   this.files = [];

   this.minSNR = 4;
   this.showFoundStars = false;
   this.window = null;
   this.catalogName = "PPMX";
   this.catalogFilter = "Rmag";
   this.vizierServer = "http://vizier.u-strasbg.fr/";
   this.maxMagnitude = 10;
   this.defaultFocal = 105; // It is only used when the image is not solved
   this.gain = 1.45;
   this.saturationThreshold = 0.95;
   this.manualFilter = true;
   this.filter = "R";
   this.filterKeyword = "FILTER";
   this.margin = 200;
   this.manualObjects = [];

   this.useActive = true;
   this.extractMode = EXTRACTMODE_IMAGE;
   this.starsReference = null;
   this.generateFileTable = true;
   this.generateFluxTable = true;
   this.generateBackgTable = false;
   this.generateSNRTable = false;
   this.generateFlagTable = false;
   this.generateErrorLog = true;
   this.saveDiagnostic = false;
   this.autoSolve = true;
   this.forceSolve = false;
   this.saveSolve = false;
   this.solveSuffix = "_WCS";

   this.ConvertADUtoe = function (pixels)
   {
      if (this.gain == null)
         return;
      for (var i = 0; i < pixels.length; i++)
         pixels[i] *= 65535 * this.gain;
   }

   this.FlattenBackground = function (window)
   {
      var ABE = new AutomaticBackgroundExtractor;
      ABE.polyDegree = 5;
      ABE.boxSize = 5;
      ABE.boxSeparation = 5;
      ABE.modelImageSampleFormat = AutomaticBackgroundExtractor.prototype.f32;
      ABE.abeDownsample = 2.00;
      ABE.targetCorrection = AutomaticBackgroundExtractor.prototype.Subtract;
      ABE.normalize = false;
      ABE.discardModel = true;
      ABE.replaceTarget = false;
      ABE.correctedImageId = window.mainView.id + "_Flattened";
      ABE.correctedImageSampleFormat = AutomaticBackgroundExtractor.prototype.SameAsTarget;
      ABE.executeOn(window.mainView, false);
      var flattenedWindow = ImageWindow.windowById(ABE.correctedImageId);
      var autoSTF = new AutoStretch()
      autoSTF.Apply(flattenedWindow.mainView, false);
      flattenedWindow.keywords = window.keywords;
      flattenedWindow.metadataWCS = window.metadataWCS;
      return flattenedWindow;
   }

   this.LoadStars = function (imgMetadata)
   {
      this.catalog.magMax = this.maxMagnitude;
      this.catalog.queryMargin = 1.5; // It loads all the stars in an area 50% bigger than the first image
      this.catalog.Load(imgMetadata, this.vizierServer);
      var stars = new Array();
      var margin = Math.max(0, this.margin - 5);
      for (var i = 0; i < this.catalog.objects.length; i++)
      {
         var star = new StarCatalog();
         star.name = this.catalog.objects[i].name;
         for (var f = 0; f < this.catalog.filters.length; f++)
         {
            var filter = this.catalog.filters[f];
            if (this.catalog.objects[i][filter])
               star[filter] = parseFloat(this.catalog.objects[i][filter]);
         }
         star.posEq = this.catalog.objects[i].posRD;
         stars.push(star);
      }

      // Add manual objects
      for(var i=0; i<this.manualObjects.length; i++)
      {
         var star = new StarCatalog();
         star.name = this.manualObjects[i].name;
         star.posEq = new Point(this.manualObjects[i].posEq.x, this.manualObjects[i].posEq.y);
         star.manual = true;
         stars.push(star);
      }

      return stars;
   }

   // Get stars
   this.FindStars = function (catalogStars, window)
   {
      var imageStars = [];
      var margin = Math.max(0, this.margin - 5);
      var metadata = window.metadataWCS;
      for (var i = 0; i < catalogStars.length; i++)
      {
         var posPx = metadata.Convert_RD_I(catalogStars[i].posEq);
         var star = null;
         if (posPx.x >= margin && posPx.x <= metadata.width - margin && posPx.y >= margin && posPx.y <= metadata.height - margin)
         {
            star = new StarReference();
            star.orgPosPx = posPx;
         }
         imageStars.push(star);
         // if(stars.length>20) return stars;
      }
      return imageStars;
   };

   this.MultipleLinearRegression = function (coords1, coords2)
   {
      if (coords1.length != coords2.length)
         throw "Input arrays of different size in Multiple Linear Regression";

      // Uses independent multiple linear regression for x and y
      // The model is: Y = X * B + err
      // The regresand Y contains the x (or y) of the predicted coordinates coords2
      // The regresors X contains the vectors (x,y,1) with the source coordinates coords1
      // The parameter vector B contains the factors of the expression xc = xi*B0 + yi*B1 + B2
      var Y1 = new Matrix(coords1.length, 1);
      var Y2 = new Matrix(coords1.length, 1);
      var X1 = new Matrix(coords1.length, 3);
      var X2 = new Matrix(coords1.length, 3);
      for (var i = 0; i < coords1.length; i++)
      {
         Y1.at(i, 0, coords2[i].x);
         X1.at(i, 0, coords1[i].x);
         X1.at(i, 1, coords1[i].y);
         X1.at(i, 2, 1);

         Y2.at(i, 0, coords2[i].y);
         X2.at(i, 0, coords1[i].x);
         X2.at(i, 1, coords1[i].y);
         X2.at(i, 2, 1);
      }

      // Solve the two multiple regressions
      var X1T = X1.transpose();
      var B1 = (X1T.mul(X1)).inverse().mul(X1T).mul(Y1);

      var X2T = X2.transpose();
      var B2 = (X2T.mul(X2)).inverse().mul(X2T).mul(Y2);

      // Create the correction matrix that transform from image coordinates to catalog coordinates
      var ref_1_2 = new Matrix(
         B1.at(0, 0), B1.at(1, 0), B1.at(2, 0),
         B2.at(0, 0), B2.at(1, 0), B2.at(2, 0),
         0, 0, 1);
      console.writeln("Correction matrix:");
      ref_1_2.Print();
      return ref_1_2;
   };

   this.RegisterStarsAgainstImage = function (imgWindow, refStars, imgStars)
   {
      // Find the position of the stars in imgWindow
      var refStars2=this.FindStars(this.catalogStars, imgWindow);
      this.FindStarCentersDPSF(imgWindow, refStars2);
      this.MarkDisplacedStars(refStars2);

      // Find the transformation between refWindow and imgWindow using a Multiple Linear Regression
      var coordsReference=[];
      var coordsImage=[];
      for(var i=0; i<refStars.length; i++)
      {
         if(refStars[i] && refStars[i].flags==0 && refStars2[i] && refStars2[i].flags==0)
         {
            coordsReference.push(refStars[i].imgPosPx);
            coordsImage.push(refStars2[i].imgPosPx);
         }
      }
      if(coordsImage.length==0)
         throw "There are not enough valid stars";
      var ref_R_I = this.MultipleLinearRegression(coordsReference,coordsImage);

      // Get the predicted position of the stars in the image
      for (var i = 0; i < imgStars.length; i++)
      {
         if (refStars[i])
         {
            //console.writeln(refStars[i][refField], " -> ", ref_R_I.Apply(refStars[i][refField]));
            imgStars[i].imgPosPx = ref_R_I.Apply(refStars[i].imgPosPx);
         }
         if(refStars2[i])
            imgStars[i].psf=refStars2[i].psf;
      }
   };

   this.GenerateMMTBackgroundModel = function (referenceWindow)
   {
      var imageOrg = referenceWindow.mainView.image;
      var mmtWindow = new ImageWindow(imageOrg.width, imageOrg.height, imageOrg.numberOfChannels,
         32, true, imageOrg.isColor, referenceWindow.mainView.id + "_MMTbkg");

      var mmt = new MultiscaleMedianTransform;
      var layers = [];
      for (var i = 0; i < this.bkgMMTlayers; i++)
         layers.push([false, true, 0.000, false, 1.0000, 1.00, 0.0000]);
      layers.push([true, true, 0.000, false, 1.0000, 1.00, 0.0000]);
      mmt.layers = layers;

      mmtWindow.mainView.beginProcess(UndoFlag_NoSwapFile);
      mmtWindow.mainView.image.apply(imageOrg);
      mmt.executeOn(mmtWindow.mainView, false);
      mmtWindow.mainView.endProcess();

      if (this.showBackgroundModel)
      {
         mmtWindow.mainView.stf = referenceWindow.mainView.stf;

         if (this.saveDiagnostic)
         {
            var outDir = this.GetOutputDir();
            var filename;
            if (referenceWindow.filePath)
               filename = File.extractName(referenceWindow.filePath) + "_MMTbkg.fit";
            else
               filename = mmtWindow.mainView.id + ".fit";
            var path = outDir + "/" + filename;
            mmtWindow.saveAs(path, false, false, true, false);
         }
         else
            mmtWindow.show();
      }
      return mmtWindow;
   }

   this.GenerateABEModel = function (window)
   {
      var ABE = new AutomaticBackgroundExtractor;
      ABE.polyDegree = 5;
      ABE.boxSize = 5;
      ABE.boxSeparation = 5;
      ABE.modelImageSampleFormat = AutomaticBackgroundExtractor.prototype.f32;
      ABE.abeDownsample = 1.00;
      ABE.targetCorrection = AutomaticBackgroundExtractor.prototype.None;
      ABE.executeOn(window.mainView, false);

      var abeWindow = ImageWindow.windowById(window.mainView.id + "_ABE_background");
      if (this.showBackgroundModel)
      {
         abeWindow.mainView.stf = window.mainView.stf;
         if (this.saveDiagnostic)
         {
            var outDir = this.GetOutputDir();
            var filename;
            if (window.filePath)
               filename = File.extractName(window.filePath) + "_ABE_background.fit";
            else
               filename = abeWindow.mainView.id + ".fit";
            var path = outDir + "/" + filename;
            abeWindow.saveAs(path, false, false, true, false);
         }
         else
            abeWindow.show();
      }
      return abeWindow;
   }

   this.ExtractBackgroundAperture = function (metadata, pixels, aperture1, aperture2, pos)
   {
      var ox = Math.floor(pos.x);
      var oy = Math.floor(pos.y);
      var left = Math.max(ox - aperture2, 0);
      var right = Math.min(ox + aperture2, metadata.width - 1);
      var top = Math.max(oy - aperture2, 0);
      var bottom = Math.min(oy + aperture2, metadata.height - 1);
      var values = new Array();
      aperture1 = Math.ceil(aperture1);
      var internalLeft = ox - aperture1;
      var internalRight = ox + aperture1;
      var internalTop = oy - aperture1;
      var internalBottom = oy + aperture1;
      for (var y = top; y <= bottom; ++y)
      {
         var yOrg = y * metadata.width;
         if (y <= internalTop || y >= internalBottom)
         {
            for (var x = left; x <= right; ++x)
            {
               var v = pixels[x + yOrg];
               values.push(v);
            }
         }
         else
         {
            for (var x = left; x <= internalLeft; ++x)
            {
               var v = pixels[x + yOrg];
               values.push(v);
            }
            for (var x = internalRight; x <= right; ++x)
            {
               var v = pixels[x + yOrg];
               values.push(v);
            }
         }
      }
      return values;
   }

   this.FindMMTBackground = function (window, pixels, pos)
   {
      var metadata = window.metadataWCS;
      var ox = Math.floor(pos.x);
      var oy = Math.floor(pos.y);
      var left = Math.max(ox - this.bkgAperture2, 0);
      var right = Math.min(ox + this.bkgAperture2, metadata.width - 1);
      var top = Math.max(oy - this.bkgAperture2, 0);
      var bottom = Math.min(oy + this.bkgAperture2, metadata.height - 1);
      var sum = 0;
      var num = 0;
      for (var y = top; y <= bottom; ++y)
      {
         var yOrg = y * metadata.width;
         for (var x = left; x <= right; ++x)
         {
            sum += pixels[x + yOrg];
            num++;
         }
      }
      return {
         median:   num > 0 ? sum / num : 0,
         stdDev:   window.globalBackground.stdDev,
         rejection:0
      };
   }

   this.FindStarCentersDPSF = function (referenceWindow, referenceStars)
   {
      var DPSF = new DynamicPSF;
      DPSF.views = [
         // id
         [referenceWindow.mainView.id]
      ];
      var stars = [];
      var psf = [];
      var translateIdx = {};
      for (var i = 0; i < referenceStars.length; i++)
      {
         if (referenceStars[i])
         {
            stars.push(
               [0, 0, DynamicPSF.prototype.Star_DetectedOk,
                  referenceStars[i].orgPosPx.x - 2, referenceStars[i].orgPosPx.y - 2,
                  referenceStars[i].orgPosPx.x + 2, referenceStars[i].orgPosPx.y + 2,
                  referenceStars[i].orgPosPx.x, referenceStars[i].orgPosPx.y]);
            translateIdx[psf.length] = i;
            psf.push(
               [psf.length, DynamicPSF.prototype.Function_Moffat4, false, DynamicPSF.prototype.PSF_FittedOk,
                  0.022934, 1.190503,
                  referenceStars[i].orgPosPx.x, referenceStars[i].orgPosPx.y,
                  3.174, 3.043, 166.57, 4.00, 3.826e-003]);
         }
      }
      DPSF.stars = stars;
      DPSF.psf = psf;
      DPSF.searchRadius = 8;
      DPSF.autoPSF = false;
      DPSF.gaussianPSF = true;
      DPSF.circularPSF = false;
      DPSF.moffatPSF = false;
      DPSF.moffat10PSF = false;
      DPSF.moffat8PSF = false;
      DPSF.moffat6PSF = false;
      DPSF.moffat4PSF = false;
      DPSF.moffat25PSF = false;
      DPSF.moffat15PSF = false;
      DPSF.lorentzianPSF = false;
      //console.writeln(DPSF.toSource());
      var res = DPSF.executeGlobal();
      psf = DPSF.psf;
      //console.writeln("OK imgX imgY dpsfX dpsfY sigma starX starY");
      for (var i = 0; i < psf.length; i++)
      {
         var starIdx = translateIdx[psf[i][0]];
         if (psf[i][3] == DynamicPSF.prototype.PSF_FittedOk)
         {
            var center = new Point(psf[i][6], psf[i][7]);
            referenceStars[starIdx].imgPosPx = center;
            // starIndex, function, circular, status, B, A, cx, cy, sx, sy, theta, beta, mad
            referenceStars[starIdx].psf = {
               sigmaX:psf[i][8] * 2.354820045 * referenceWindow.metadataWCS.resolution * 3600,
               sigmaY:psf[i][9] * 2.354820045 * referenceWindow.metadataWCS.resolution * 3600,
               A:     psf[i][5],
               theta: psf[i][10],
               MAD:   psf[i][12]
            };
            referenceStars[starIdx].centerDelta = referenceStars[starIdx].orgPosPx.distanceTo(center);
         }
      }

      // Remove stars that could not be fitted
      for (var i = 0; i < referenceStars.length; i++)
         if (referenceStars[i] && !referenceStars[i].imgPosPx)
         {
            //console.writeln(referenceStars[i].orgPosPx);
            referenceStars[i] = null;
         }
   }

   this.MarkDisplacedStars = function (referenceStars)
   {
      var numBadPos = 0;
      for (var i = 0; i < 5; i++)
      {
         var deltas = [];
         for (var s = 0; s < referenceStars.length; s++)
         {
            if (referenceStars[s] && referenceStars[s].flags == 0)
               deltas.push(referenceStars[s].centerDelta);
         }
         if(deltas.length<3)
            return;
         var stdDev = Math.stdDev(deltas);
         var tolerance = Math.max(1,stdDev*5);

         for (var s = 0; s < referenceStars.length; s++)
         {
            if (referenceStars[s] && referenceStars[s].flags == 0 && referenceStars[s].centerDelta > tolerance)
            {
               referenceStars[s].flags |= STARFLAG_BADPOS;
               numBadPos++;
            }
         }
      }
      console.writeln(format("<end><clrbol>Found %d stars with invalid position", numBadPos));
   }

   this.ApplySTF = function (view, stf, channels)
   {
      var low = (channels == 1) ? stf[0][1] : (stf[0][1] + stf[1][1] + stf[2][1]) / 3;
      var mtf = (channels == 1) ? stf[0][0] : (stf[0][0] + stf[1][0] + stf[2][0]) / 3;
      var hgh = (channels == 1) ? stf[0][2] : (stf[0][2] + stf[1][2] + stf[2][2]) / 3;
      if (low > 0 || mtf != 0.5 || hgh != 1) // if not an identity transformation
      {
         console.writeln(format("<b>Applying STF to '%ls'</b>:\x1b[38;2;100;100;100m",view.id));
         var HT = new HistogramTransformation;
         HT.H = [
            [  0, 0.5, 1, 0, 1],
            [  0, 0.5, 1, 0, 1],
            [  0, 0.5, 1, 0, 1],
            [low, mtf, hgh, 0, 1],
            [  0, 0.5, 1, 0, 1]
         ];

         HT.executeOn(view, false); // no swap file
         console.write("\x1b[0m");
      }
   }

   this.DrawStars = function (window, imageStars, suffix, positionField)
   {
      console.writeln("Generating detected stars image");
      var width = window.mainView.image.width;
      var height = window.mainView.image.height;

      var newid = window.mainView.fullId + suffix;

      var bmp = new Bitmap(width, height);

      var tmpW = new ImageWindow(width, height, 3, window.bitsPerSample, window.isFloatSample, true, newid);
      tmpW.mainView.beginProcess(UndoFlag_NoSwapFile);
      tmpW.mainView.image.selectedChannel = 0;
      tmpW.mainView.image.apply(window.mainView.image);
      tmpW.mainView.image.selectedChannel = 1;
      tmpW.mainView.image.apply(window.mainView.image);
      tmpW.mainView.image.selectedChannel = 2;
      tmpW.mainView.image.apply(window.mainView.image);
      this.ApplySTF(tmpW.mainView, window.mainView.stf, window.mainView.image.numberOfChannels);
      var conv = new SampleFormatConversion();
      conv.format = SampleFormatConversion.prototype.To8Bit;
      conv.executeOn(tmpW.mainView, false);
      tmpW.mainView.endProcess();
      bmp.assign(tmpW.mainView.image.render());
      tmpW.close();

      var g = new VectorGraphics(bmp);
      g.antialiasing = true;
      g.textAntialiasing = true;
      g.transparentBackground = true;
      var normalPen = new Pen(0xff00ff00, 1);
      var multiplePen = new Pen(0xffff0000, 1);
      var overlappedPen = new Pen(0xffffff00, 1);
      var dimPen = new Pen(0xff80ffff, 1);
      var saturatedPen = new Pen(0xffff8080, 1);
      var backgroundPen = new Pen(0xff0000A0, 1);

      //console.writeln("Rendering");
      var radius = this.minimumAperture / 2 + 0.5;
      var radius2 = (this.minimumAperture + this.apertureStepSize * (this.apertureSteps - 1)) / 2 + 0.5;
      for (var s = 0; s < imageStars.length; s++)
      {
         if (imageStars[s] == null)
            continue;
         if (imageStars[s].flags == null || imageStars[s].flags == 0)
            g.pen = normalPen;
         else if (imageStars[s].flags & STARFLAG_MULTIPLE)
            g.pen = multiplePen;
         else if ((imageStars[s].flags & STARFLAG_OVERLAPPED) || (imageStars[s].flags & STARFLAG_BADPOS))
            g.pen = overlappedPen;
         else if (imageStars[s].flags & STARFLAG_LOWSNR)
            g.pen = dimPen;
         else
            g.pen = saturatedPen;

         var pos = imageStars[s][positionField];
         if (this.apertureShape == 0)
         {
            g.drawRect(pos.x - radius, pos.y - radius, pos.x + radius, pos.y + radius);
            if (this.apertureSteps > 1)
               g.drawRect(pos.x - radius2, pos.y - radius2, pos.x + radius2, pos.y + radius2);
         }
         else
         {
            g.drawEllipse(pos.x - radius, pos.y - radius, pos.x + radius, pos.y + radius);
            if (this.apertureSteps > 1)
               g.drawEllipse(pos.x - radius2, pos.y - radius2, pos.x + radius2, pos.y + radius2);
         }
         if(this.catalogStars[s].manual)
         {
            g.drawLine(pos.x - radius2, pos.y , pos.x - radius2 - 6, pos.y);
            g.drawLine(pos.x + radius2, pos.y, pos.x + radius2 + 6, pos.y);
            g.drawLine(pos.x, pos.y - radius2, pos.x, pos.y - radius2 - 6);
            g.drawLine(pos.x, pos.y + radius2, pos.x, pos.y + radius2 + 6);
         }
         if (this.bkgWindowMode == BKGWINDOW_RING)
         {
            g.pen = backgroundPen;
            g.drawRect(pos.x - this.bkgAperture1 / 2, pos.y - this.bkgAperture1 / 2,
               pos.x + this.bkgAperture1 / 2, pos.y + this.bkgAperture1 / 2);
            g.drawRect(pos.x - this.bkgAperture2 / 2, pos.y - this.bkgAperture2 / 2,
               pos.x + this.bkgAperture2 / 2, pos.y + this.bkgAperture2 / 2);
         }
      }
      g.end();

      var targetW = new ImageWindow(width, height, 3, 8, false, true, newid);

      targetW.mainView.beginProcess(UndoFlag_NoSwapFile);

      // Blend annotation with target image
      targetW.mainView.image.blend(bmp);

      // Copy keywords to target image
      targetW.keywords = window.keywords;

      targetW.mainView.endProcess();

      if (this.saveDiagnostic)
      {
         var outDir = this.GetOutputDir();
         var filename;
         if (window.filePath)
            filename = File.extractName(window.filePath) + suffix + ".fit";
         else
            filename = newid + ".fit";
         var path = outDir + "/" + filename;
         targetW.saveAs(path, false, false, true, false);
         targetW.close();
      }
      else
         targetW.show();
   }

   this.CreateBackgroundMap = function (window, imageStars)
   {
      var dbe = new DynamicBackgroundExtraction;

      var data = new Array();
      for (var i = 0; i < imageStars.length; i++)
      {
         if (imageStars[i] == null)
            continue;
         var sample = new Array();
         sample[0] = imageStars[i].imgPosPx.x / window.metadataWCS.width;
         sample[1] = imageStars[i].imgPosPx.y / window.metadataWCS.height;
         sample[2] = imageStars[i].background.median / (65535 * this.gain);
         sample[3] = 1;
         sample[4] = 0;
         sample[5] = 1;
         sample[6] = 0;
         sample[7] = 1;
         data.push(sample);
      }
      dbe.data = data;

      dbe.numberOfChannels = 1;
      dbe.derivativeOrder = 2;
      dbe.smoothing = 0.001;
      dbe.ignoreWeights = true;
      dbe.modelId = window.mainView.id + "_BackgroundMap";
      // dbe.modelWidth = 0;
      // dbe.modelHeight = 0;
      dbe.downsample = 1;
      dbe.modelSampleFormat = DynamicBackgroundExtraction.prototype.f32;
      dbe.targetCorrection = DynamicBackgroundExtraction.prototype.None;
      dbe.normalize = false;
      dbe.discardModel = false;
      dbe.replaceTarget = false;
      dbe.imageWidth = window.metadataWCS.width;
      dbe.imageHeight = window.metadataWCS.height;
      dbe.symmetryCenterX = 0.500000;
      dbe.symmetryCenterY = 0.500000;


      dbe.executeOn(window.mainView, false);
      var dbeWindow = ImageWindow.windowById(dbe.modelId);
      dbeWindow.mainView.stf = window.mainView.stf;

      if (this.saveDiagnostic)
      {
         var outDir = this.GetOutputDir();
         var filename;
         if (window.filePath)
            filename = File.extractName(window.filePath) + "_BackgroundMap.fit";
         else
            filename = dbeWindow.mainView.id + ".fit";
         var path = outDir + "/" + filename;
         dbeWindow.saveAs(path, false, false, true, false);
         dbeWindow.close();
      }
   }

   this.ValidateStars = function (imageStars)
   {
      var maxAperture = this.minimumAperture + this.apertureStepSize * (this.apertureSteps - 1);
      for (var i = 0; i < imageStars.length - 1; i++)
      {
         var star1 = imageStars[i];
         if (star1 == null)
            continue;

         for (var j = i + 1; j < imageStars.length; j++)
         {
            var star2 = imageStars[j];
            if (star2 == null)
               continue;

            var dist2 = (star1.imgPosPx.x - star2.imgPosPx.x) * (star1.imgPosPx.x - star2.imgPosPx.x) + (star1.imgPosPx.y - star2.imgPosPx.y) * (star1.imgPosPx.y - star2.imgPosPx.y);
            if (dist2 < 1)
            { // Two stars have been detected at the same point
               imageStars[i].flags = imageStars[i].flags | STARFLAG_MULTIPLE;
               imageStars[j].flags = imageStars[j].flags | STARFLAG_MULTIPLE;
            }
            else if (dist2 < maxAperture * maxAperture)
            {
               imageStars[i].flags = imageStars[i].flags | STARFLAG_OVERLAPPED;
               imageStars[j].flags = imageStars[j].flags | STARFLAG_OVERLAPPED;
            }
         }
      }
      var numProblems = imageStars.reduce(function (num, star)
      {
         return (star && star.flags != 0) ? num + 1 : num;
      }, 0);
      console.writeln("Stars with problems: ", numProblems);
   }

   this.AperturePhotometry = function (pixels, pixelsBkg, star, intersection, imageWidth)
   {
      var saturation = this.saturationThreshold * 65535 * this.gain;
      var apertureRect = intersection.ApertureRect();
      var left = Math.floor(apertureRect.left);
      var top = Math.floor(apertureRect.top);
      var right = Math.floor(apertureRect.right);
      var bottom = Math.floor(apertureRect.bottom);
      var totalArea = 0;
      var rawFlux = 0;
      var backFlux = 0;
      for (var y = top; y <= bottom; y++)
         for (var x = left; x <= right; x++)
         {
            var area = intersection.Calculate(new Point(x, y), 1);

            var pixelValue = pixels[ x + y * imageWidth ];
            if (pixelValue > saturation)
               star.flags = star.flags | STARFLAG_SATURATED;
            totalArea += area;
            rawFlux += pixelValue * area;
            //console.writeln(area," ",pixelValue);
            if (this.bkgWindowMode == BKGWINDOW_PHOTOMETRIC)
               backFlux += pixelsBkg[x + y * imageWidth] * area;
         }
      var apertureArea = intersection.ApertureArea();
      // ASSERT: Checks that the square/circle intersection algorithm is OK.
      if (Math.abs(totalArea - apertureArea) > 1e-5)
      {
         console.writeln("\x1b[35mWarning: Precision problem in the aperture algorithm\x1b[0m");
         console.writeln(totalArea, " ", apertureArea);
         //console.writeln(left," ",top," ",right," ",bottom);
         //console.writeln(star.imgPosPx," ",aperture/2);
      }
      //console.writeln("TOTAL:",totalArea, " FLUX", flux, "\n");
      if (this.bkgWindowMode == BKGWINDOW_PHOTOMETRIC)
         return {
            flux:      Math.max(1e-20, rawFlux - backFlux),
            background:backFlux / totalArea };
      else
         return {
            flux:      Math.max(1e-20, rawFlux - apertureArea * star.background.median),
            background:star.background.median};
   }

   this.CalculatePhotometry = function (window, imageStars)
   {
      var pixels = [];
      window.mainView.image.getPixels(pixels);
      this.ConvertADUtoe(pixels);

      console.write("Calculating image noise: ");
      var noise = new NoiseEvaluation(window.mainView.image);
      window.globalNoise = noise.sigma * 65535 * this.gain;
      console.writeln(format("sigma=%.3f count=%.2f%% layers=%d", window.globalNoise, noise.count * 100 / pixels.length, noise.layers));

      var bkgPixels = null;
      if (this.bkgModel == BKGMODEL_SOURCE)
      {
         bkgPixels = pixels;
      }
      else
      {
         var bkgWindow;
         if (this.bkgModel == BKGMODEL_MMT)
            bkgWindow = this.GenerateMMTBackgroundModel(window);
         else if (this.bkgModel == BKGMODEL_ABE)
            bkgWindow = this.GenerateABEModel(window);
         else
            throw "Unknown background model type";
         bkgPixels = [];
         bkgWindow.mainView.image.getPixels(bkgPixels);
         this.ConvertADUtoe(bkgPixels);
         if (!this.showBackgroundModel || this.saveDiagnostic)
            bkgWindow.close();
      }

      console.write("Calculating Photometry: ");
      processEvents();

      var lastProcess = (new Date).getTime();
      var startTime = lastProcess;
      for (var i = 0; i < imageStars.length; i++)
      {
         var star = imageStars[i];
         if (star == null)
            continue;

         if (this.bkgWindowMode == BKGWINDOW_RING)
         {
            var bkgValues = this.ExtractBackgroundAperture(window.metadataWCS, bkgPixels, this.bkgAperture1 / 2, this.bkgAperture2 / 2, star.imgPosPx);
            if (bkgValues.length == 0)
            {
               imageStars[i] = null;
               continue;
            }
            if (this.bkgModel == BKGMODEL_SOURCE)
               star.background = MedianSigmaClipping(bkgValues, this.backgroundSigmaLow, this.backgroundSigmaHigh);
            else
            {
               star.background = {
                  median:   Math.mean(bkgValues),
                  stdDev:   window.globalNoise,
                  rejection:1 - noise.count / pixels.length
               };
            }
         }

         star.flux = new Array(this.apertureSteps);
         star.SNR = new Array(this.apertureSteps);
         for (var a = 0; a < this.apertureSteps; a++)
         {
            var aperture = this.minimumAperture + this.apertureStepSize * a;
            var backNoise2;
            var intersection;

            if (this.apertureShape == 0)
               intersection = new SquareSquareIntersection(star.imgPosPx, aperture);
            else
               intersection = new CircleSquareIntersection(star.imgPosPx, aperture / 2);

            var photometry = this.AperturePhotometry(pixels, bkgPixels, star, intersection, window.metadataWCS.width);
            star.flux[a] = photometry.flux;
            if (this.bkgWindowMode == BKGWINDOW_RING)
               backNoise2 = intersection.ApertureArea() * star.background.stdDev * star.background.stdDev;
            else
            {
               backNoise2 = intersection.ApertureArea() * window.globalNoise * window.globalNoise;
               if (a == 0)
                  star.background = {
                     median:   photometry.background,
                     stdDev:   window.globalNoise,
                     rejection:1 - noise.count / pixels.length
                  };
            }
            star.SNR[a] = star.flux[a] / Math.sqrt(star.flux[a] + backNoise2);
            if (star.SNR[a] < this.minSNR)
               star.flags |= STARFLAG_LOWSNR;
         }

         var time = (new Date).getTime();
         if (time - lastProcess > 1000)
         {
            lastProcess = time;
            console.write(format("<end><clrbol>Calculating Photometry: Processing stars (%.2f%%)", i * 100 / imageStars.length));
            processEvents();
            if (console.abortRequested)
               throw "Abort!!";
         }
      }
      var endTime = (new Date).getTime();
      var numProc = imageStars.reduce(function (num, star)
      {
         return star && star.flux ? num + 1 : num;
      }, 0);
      console.writeln(format("<end><clrbol>Calculating Photometry: Processed %d stars in %f seconds", numProc, (endTime - startTime) / 1000));
      gc();
   }

   this.FindBounds = function (catalogStars, imageStars)
   {
      var area = null;
      for (var s = 0; s < imageStars.length; s++)
      {
         if (imageStars[s])
         {
            var posEq = catalogStars[s].posEq;
            if (area)
               area = area.union(posEq.x, posEq.y, posEq.x, posEq.y);
            else
               area = new Rect(posEq.x, posEq.y, posEq.x, posEq.y);
         }
      }

      return area;
   }

   this.FormatFloat = function (field, number, size, decimals)
   {
      if (typeof(number) != "number")
         console.writeln("Error writing: ", field, " ", number);
      var str = format("%" + size + "." + decimals + "f", number);
      if (str.length > size)
         return str.substr(0, size);
      else
         return str;
   }

   this.GetWindowFilter = function (window)
   {
      if (this.manualFilter)
         return this.filter;
      else
      {
         var keywords = window.keywords;
         for (var i = 0; i < keywords.length; i++)
         {
            var key = keywords[i];
            if (key && key.name == this.filterKeyword)
            {
               var value = key.value;
               // Remove the enclosing '' if necessary
               if (value[0] == "'" && value[value.length - 1] == "'")
                  value = value.substr(1, value.length - 2);
               return value.trim();
            }
         }
         return "UNK";
      }
   }

   this.WriteResult = function (window, metadataWCS, catalogStars, imageStars)
   {
      var filePath = window.filePath;
      if (catalogStars.length != imageStars.length)
         throw "Internal error: catalogStars.length != imageStars.length";

      if (filePath.length == 0)
      {
         console.writeln("Output file path empty");
         return;
      }

      var outPath = null;
      if (this.outputDir && this.outputDir.length > 0)
      {
         var filename = File.extractName(filePath);
         outPath = this.outputDir + "/" + filename + ".csv";
      }
      else
         outPath = File.changeExtension(filePath, ".csv");
      console.writeln("Writing output file: ", outPath);

      var file = new File;
      var printHeader = true;
      file.createForWriting(outPath);

      // Find filter value
      var filter = this.GetWindowFilter(window);
      var filterColWidth = Math.max(6, filter.length);

      var separator = ";";
      var warning = false;
      var lineLength = 195 + filterColWidth + 19 * this.apertureSteps;
      if (printHeader)
      {
         var area = this.FindBounds(catalogStars, imageStars);
         var boundsStr = format("Bounds;%f;%f;%f;%f\n", area.x0, area.y0, area.x1, area.y1);
         var apertureStr = format("Aperture;%g;%d;%g\n", this.minimumAperture, this.apertureSteps, this.apertureStepSize);
         var backgroundStr;
         if (this.bkgWindowMode == BKGWINDOW_RING)
            backgroundStr = format("Background ring window;%d;%d\n", this.bkgAperture1, this.bkgAperture2);
         else
            backgroundStr = "Background photometric window\n";

         file.outText(format("%04d;%04d\n", boundsStr.length + apertureStr.length + backgroundStr.length + lineLength, lineLength));

         var columns = "DATE_OBS     ;NAME                     ;";
         columns += format("%-" + filterColWidth + "ls", "FILTER");
         columns += ";CATRA     ;CATDEC    ;";
         columns += "IMGRA     ;IMGDEC    ;";
         columns += "IMGX    ;IMGY    ;";
         //for (var f = 0; f < this.catalog.filters.length; f++)
         //   columns += format("%-6ls;", this.catalog.filters[f]);
         columns += format("%-6ls;", this.catalogFilter);
         columns += "BKGROUND;BGSTDDEV;BGRJCT;";
         columns += "PSF_A    ;PSF_SIGMAX;PSF_SIGMAY;PSF_THETA;PSF_MAD     ;"
         for (var a = 0; a < this.apertureSteps; a++)
            columns += format("%-9ls", "FLUX" + format("%g", this.minimumAperture + this.apertureStepSize * a)) + separator;
         for (var a = 0; a < this.apertureSteps; a++)
            columns += format("%-8ls", "SNR" + format("%g", this.minimumAperture + this.apertureStepSize * a)) + separator;
         columns += "FLAG\n";

         file.outText(boundsStr);
         file.outText(apertureStr);
         file.outText(backgroundStr);
         file.outText(columns);
         //console.writeln(lineLength, " ", columns.length);
      }
      for (var i = 0; i < imageStars.length; i++)
      {
         if (imageStars[i])
         {
            var line = "";
            if (metadataWCS.epoch)
               line += this.FormatFloat("DATE_OBS", metadataWCS.epoch, 13, 5) + separator;
            else
               line += "             " + separator;

            if (catalogStars[i].name >= 0 || catalogStars[i].name < 0)
               line += format("%-25ls", "_" + catalogStars[i].name) + separator;
            else
               line += format("%-25ls", catalogStars[i].name) + separator;
            line += format("%-" + filterColWidth + "ls", filter) + separator;
            line += this.FormatFloat("CATRA", catalogStars[i].posEq.x, 10, 6) + separator;
            line += this.FormatFloat("CATDEC", catalogStars[i].posEq.y, 10, 6) + separator;
            var imgEq = metadataWCS.Convert_I_RD(imageStars[i].imgPosPx);
            line += this.FormatFloat("IMGRA", imgEq.x, 10, 6) + separator;
            line += this.FormatFloat("IMGDEC", imgEq.y, 10, 6) + separator;
            line += this.FormatFloat("imgPosPx.x", imageStars[i].imgPosPx.x, 8, 3) + separator;
            line += this.FormatFloat("imgPosPx.y", imageStars[i].imgPosPx.y, 8, 3) + separator;

            if (catalogStars[i][this.catalogFilter])
               line += this.FormatFloat(filter, catalogStars[i][this.catalogFilter], 6, 3) + separator;
            else
               line += "      " + separator;

            if (imageStars[i].background)
            {
               line += this.FormatFloat("median", imageStars[i].background.median, 8, 6) + separator;
               line += this.FormatFloat("stdDev", imageStars[i].background.stdDev, 8, 6) + separator;
               line += this.FormatFloat("rejection", imageStars[i].background.rejection, 6, 4) + separator;
            } else
               line += "        " + separator + "        " + separator + "      " + separator;

            if(imageStars[i].psf)
            {
               line += this.FormatFloat("psf.A", imageStars[i].psf.A, 9, 7) + separator;
               line += this.FormatFloat("psf.sigmaX", imageStars[i].psf.sigmaX, 10, 8) + separator;
               line += this.FormatFloat("psf.sigmaY", imageStars[i].psf.sigmaY, 10, 8) + separator;
               line += this.FormatFloat("psf.theta", imageStars[i].psf.theta, 9, 6) + separator;
               //line += this.FormatFloat("psf.MAD", imageStars[i].psf.MAD, 9, 7) + separator;
               line += format("%.5E",imageStars[i].psf.MAD) + separator;
            } else
               line+="         ;          ;          ;         ;            ;";

            for (var a = 0; a < this.apertureSteps; a++)
               line += this.FormatFloat("flux" + a, imageStars[i].flux[a], 9, 6) + separator;
            for (var a = 0; a < this.apertureSteps; a++)
               line += this.FormatFloat("SNR" + a, imageStars[i].SNR[a], 8, 5) + separator;
            line += format("%04x\n", imageStars[i].flags);

            if (line.length != lineLength)
               warning = true;

            file.outText(line);
         }
      }
      file.close();
      if (warning)
         console.writeln("Invalid out format");
   }

   this.ValidateWindow = function (window)
   {
      if (window == null || !window.isWindow)
         throw "The image could not be opened";
      if (window.mainView.image.numberOfChannels != 1)
         throw "The image should have only one channel";
   };

   this.CreateImageData = function (window, imageStars)
   {
      var imageData = {};
      imageData.id = window.mainView.id;
      imageData.dateObs = window.metadataWCS.epoch;
      imageData.stars = imageStars;
      imageData.filter = this.GetWindowFilter(window);

      return imageData;
   };

   this.GetOutputDir = function ()
   {
      // Get table path
      var outDir = this.outputDir;
      if (outDir == null || outDir.length == 0)
      {
         var firstFilePath;
         if (this.useActive)
            firstFilePath = this.currentWindow.filePath;
         else
            firstFilePath = this.files[0];
         if (firstFilePath == null || firstFilePath.length == 0)
            throw "The first file has not file path";
         var drive = File.extractDrive(firstFilePath);
         var dir = File.extractDirectory(firstFilePath);
         outDir = drive + dir;
      }
      return outDir;
   }

   this.WriteTable = function (field, fieldName, snrField)
   {
      // Get table path
      var prefix = this.outputPrefix == null ? "Table_" : this.outputPrefix;
      var outDir = this.GetOutputDir();
      var filename = prefix + fieldName + ".csv";
      var path = outDir + "/" + filename;
      console.writeln("Writing table: ", path);

      try
      {
         // Create file
         var file = new File;
         file.createForWriting(path);

         // Write image ID row
         if (snrField)
            file.outText(";");
         file.outText(";;;;ImageId");
         for (var i = 0; i < this.imagesData.length; i++)
            file.outText(";" + this.imagesData[i].id);
         file.outText("\n");

         // Write image DATE_OBS row
         if (snrField)
            file.outText(";");
         file.outText(";;;;DATE_OBS");
         for (var i = 0; i < this.imagesData.length; i++)
            if (this.imagesData[i].dateObs == null)
               file.outText(";");
            else
               file.outText(format(";%.5f", this.imagesData[i].dateObs));
         file.outText("\n");

         // Write image FILTER row
         if (snrField)
            file.outText(";");
         file.outText(";;;;FILTER");
         for (var i = 0; i < this.imagesData.length; i++)
            file.outText(format(";%ls", this.imagesData[i].filter));
         file.outText("\n");

         // Write stars header
         if (snrField)
            file.outText("StarId;RA;Dec;Flags;Catalog_" + this.catalogFilter + ";MinSNR");
         else
            file.outText("StarId;RA;Dec;Flags;Catalog_" + this.catalogFilter);
         for (var i = 0; i < this.imagesData.length; i++)
            file.outText(format(";%ls_%d", fieldName, i + 1));
         file.outText("\n");

         // Write stars info
         for (var s = 0; s < this.catalogStars.length; s++)
         {
            if (this.catalogStars[s])
            {
               // Check for numeric id
               if (this.catalogStars[s].name >= 0 || this.catalogStars[s].name < 0)
                  file.outText("_" + this.catalogStars[s].name + ";");
               else
                  file.outText(this.catalogStars[s].name + ";");
               file.outText(this.catalogStars[s].posEq.x + ";");
               file.outText(this.catalogStars[s].posEq.y + ";");
               var flags = 0;
               var minSNR = null;
               for (var i = 0; i < this.imagesData.length; i++)
                  if (this.imagesData[i].stars[s])
                  {
                     if (this.imagesData[i].stars[s].flags)
                        flags = flags | this.imagesData[i].stars[s].flags;
                     if (snrField)
                     {
                        if (minSNR == null)
                           minSNR = snrField(this.imagesData[i].stars[s]);
                        else
                           minSNR = Math.min(minSNR, snrField(this.imagesData[i].stars[s]));
                     }
                  }
                  else
                     flags |= STARFLAG_LOWSNR;
               file.outText(format("%d;", flags));
               if (this.catalogStars[s][this.catalogFilter] != null)
                  file.outText(format("%f", this.catalogStars[s][this.catalogFilter]));
               if (snrField)
               {
                  file.outText(";");
                  if (minSNR != null)
                     file.outText(format("%f", minSNR));
               }
               for (var i = 0; i < this.imagesData.length; i++)
                  if (this.imagesData[i].stars[s])
                     file.outText(format(";%f", field(this.imagesData[i].stars[s])));
                  else
                     file.outText(";");
               file.outText("\n");
            }
         }
         file.close();
      } catch (ex)
      {
         console.flush();
         console.writeln("\x1b[31mError writing table\x1b[0m");
         console.flush();
         this.errorList.push({id: filename, message: ex});
      }
   }

   this.LoadMetadata = function (window)
   {
      if (window.metadataWCS == null)
      {
         window.metadataWCS = new ImageMetadata();
         window.metadataWCS.ExtractMetadata(window);

         if ((window.metadataWCS.ref_I_G == null && this.autoSolve) || this.forceSolve)
         {
            if (window.metadataWCS.ref_I_G == null)
               console.writeln("<end><cbr><br>* The image has no WCS coordinates -> SOLVING");
            else
               console.writeln("<end><cbr><br>* Forced image solving");
            var solver = new ImageSolver();

            solver.Init(window, true);
            solver.solverCfg.showStars = false;
            solver.solverCfg.showDistortion = false;
            solver.solverCfg.generateErrorImg = false;

            if (solver.SolveImage(window))
            {
               // Print result
               console.writeln("===============================================================================");
               solver.metadata.Print();
               console.writeln("===============================================================================");

               window.metadataWCS.ExtractMetadata(window);

               if (this.saveSolve)
               {
                  if (this.solveSuffix.length == 0)
                     window.save();
                  else
                  {
                     var newPath = File.extractDrive(window.filePath) +
                        File.extractDirectory(window.filePath) + "/" +
                        File.extractName(window.filePath) +
                        this.solveSuffix +
                        File.extractCompleteSuffix(window.filePath);
                     window.saveAs(newPath, false, false, true, false);
                  }
               }
            }
            else
            {
               var errMsg = "The image could not be solved. It will be processed using the existing referentiation.";
               console.writeln("<b>Warning: </b>" + errMsg);
               if (window.metadataWCS.ref_I_G != null)
                  this.errorList.push({id:window.filePath, message:errMsg});
            }

            if (window.metadataWCS.ref_I_G == null)
               throw "The image hasn't coordinates";

         }
         if (window.metadataWCS.ref_I_G == null)
            throw "The image hasn't coordinates";
      }
   }

   this.WriteErrorList = function (errorList)
   {
      // Get log path
      var prefix = this.outputPrefix == null ? "Table_" : this.outputPrefix;
      var outDir = this.GetOutputDir();
      var path = outDir + "/" + prefix + "Errors.txt";
      console.writeln("\x1b[31mWriting error log: ", path, "\x1b[0m");

      // Create file
      var file = new File;
      file.createForWriting(path);

      // Write errors
      for (var i = 0; i < errorList.length; i++)
         file.outText(errorList[i].id + ": " + errorList[i].message + "\n");

      file.close();
   }

   this.ComputeAstrometryError = function (window, imageStars)
   {
      var errX = 0;
      var errY = 0;
      var num = 0;

      for (var i = 0; i < imageStars.length; i++)
      {
         if (imageStars[i] && imageStars[i].flags == 0)
         {
            var imgPosEq = window.metadataWCS.Convert_I_RD(imageStars[i].imgPosPx);
            var eX = (imgPosEq.x - this.catalogStars[i].posEq.x) * 3600 * Math.cos(imgPosEq.y);
            var eY = (imgPosEq.y - this.catalogStars[i].posEq.y) * 3600;
            errX += eX * eX;
            errY += eY * eY;
            num++;
         }
      }
      if (num > 0)
         console.writeln(format("Astrometric error: RMSx=%.4f\" RMSy=%.4f\" RMS=%.4f\"",
            Math.sqrt(errX) / num, Math.sqrt(errY) / num, Math.sqrt(errX + errY) / num));
   }

   this.ProcessWindow = function (window)
   {
      this.LoadMetadata(window);

      // Get reference image
      var referenceWindow = null;
      if (this.extractMode != EXTRACTMODE_REFERENCE)
         referenceWindow = window;
      else
         referenceWindow = ImageWindow.windowById(this.starsReference);
      this.LoadMetadata(referenceWindow);

      console.writeln("Reference image: " + referenceWindow.mainView.id);

      // Extract stars from reference image
      if (this.catalogStars == null)
      {
         // Load stars from the catalog
         this.catalog = __catalogRegister__.GetCatalog(this.catalogName);
         if (this.catalogFilter)
            this.catalog.magnitudeFilter = this.catalogFilter;
         this.catalogStars = this.LoadStars(referenceWindow.metadataWCS);
         if (this.catalogStars.length == 0)
            throw "Could not find any stars in the catalog";
         if (this.catalogFilter)
         {
            var filter = this.catalogFilter;
            // Sort the stars by catalog ascending magnitude
            this.catalogStars.sort(
               function (s1, s2)
               {
                  var v1=s1[filter]?s1[filter]:0;
                  var v2=s2[filter]?s2[filter]:0;
                  return v1-v2;
               });
         }
         console.writeln("Catalog stars: ", this.catalogStars.length);
      }

      // Find the centroids of the stars in the reference image
      if (this.referenceStars == null)
//      if (this.extractMode == EXTRACTMODE_IMAGE ||
//         (this.extractMode == EXTRACTMODE_REFERENCE && this.referenceStars == null))
      {
         this.referenceStars = this.FindStars(this.catalogStars, referenceWindow);
         if (this.extractMode == EXTRACTMODE_CATALOG)
         {
            for(var i=0; i<this.referenceStars.length; i++)
               if (this.referenceStars[i])
                  this.referenceStars[i].imgPosPx = this.referenceStars[i].orgPosPx;
         }
         else
         {
            this.FindStarCentersDPSF(referenceWindow, this.referenceStars);
            this.MarkDisplacedStars(this.referenceStars);
         }

         var numImageStars = this.referenceStars.reduce(function (num, star)
         {
            return star ? num + 1 : num;
         }, 0);
         if (numImageStars == 0)
            throw "Could not locate any stars in the image";
         console.writeln("Reference stars: ", numImageStars);

         // Validate stars
         console.writeln("Validating reference stars");
         processEvents();
         this.ValidateStars(this.referenceStars);

         //this.DrawStars(referenceWindow, this.referenceStars, "_CAT", "orgPosPx");
         if (this.extractMode == EXTRACTMODE_REFERENCE && this.showFoundStars)
            this.DrawStars(referenceWindow, this.referenceStars, "_DetectedStars", "imgPosPx");
      }

      // Find the centroids of the stars in the target image
      var imageStars = new Array(this.referenceStars.length);
      if (window.mainView.id == referenceWindow.mainView.id)
      {
         for (var i = 0; i < imageStars.length; i++)
            if (this.referenceStars[i])
            {
               imageStars[i] = new StarImage();
               imageStars[i].imgPosPx = this.referenceStars[i].imgPosPx;
               //imageStars[i].background = this.referenceStars[i].background;
               imageStars[i].flags = this.referenceStars[i].flags;
               imageStars[i].psf = this.referenceStars[i].psf;
            }
      }
      else
      {
         console.writeln("Register image against reference");
         for (var i = 0; i < imageStars.length; i++)
            if (this.referenceStars[i])
            {
               imageStars[i] = new StarImage();
               imageStars[i].flags = this.referenceStars[i].flags;
            }
         this.RegisterStarsAgainstImage(window, this.referenceStars, imageStars);

         // Validate stars
         console.writeln("Validating Stars");
         processEvents();
         this.ValidateStars(imageStars);
      }

      // The reference stars are not longer needed but when extractMode==EXTRACTMODE_REFERENCE
      if (this.extractMode != EXTRACTMODE_REFERENCE)
         this.referenceStars = null;

      // Calculate photometry
      this.CalculatePhotometry(window, imageStars);

      if (this.extractMode != EXTRACTMODE_CATALOG)
         this.ComputeAstrometryError(window, imageStars);

      if (this.showFoundStars)
         this.DrawStars(window, imageStars, "_DetectedStars", "imgPosPx");
      if (this.showBackgroundModel && this.bkgModel == BKGMODEL_SOURCE)
         this.CreateBackgroundMap(window, imageStars);

      if (this.generateFileTable)
      {
         this.WriteResult(window, window.metadataWCS, this.catalogStars, imageStars);
      }

      this.imagesData.push(this.CreateImageData(window, imageStars));
   }

   this.CloseTemporalWindows = function ()
   {
      if (this.temporalWindows)
      {
         for (var i = 0; i < this.temporalWindows.length; i++)
            if (this.temporalWindows[i].isWindow)
               this.temporalWindows[i].forceClose();
         this.temporalWindows = [];
      }
   }

   this.RemoveEmptyStars = function ()
   {
      for (var s = 0; s < this.catalogStars.length; s++)
      {
         if (this.catalogStars[s])
         {
            var empty=true;
            for (var i = 0; empty && i < this.imagesData.length; i++)
            {
               if (this.imagesData[i].stars[s])
                  empty=false;
            }
            if(empty)
               this.catalogStars[s] = null;
         }
      }
   };


   this.Calculate = function ()
   {
      this.imagesData = [];
      this.temporalWindows = [];
      var numImagesOK = 0;
      var numImages;
      this.errorList = [];

      if (this.useActive)
      {
         try
         {
            numImages = 1;
            this.ProcessWindow(this.currentWindow);
            numImagesOK++;
         } catch (ex)
         {
            console.writeln("\x1b[31m*******************************")
            console.writeln("Error in image " + this.currentWindow.mainView.id + ": " + ex);
            console.write("\x1b[0m");
            this.errorList.push({id:this.currentWindow.mainView.id, message:ex});
         }
         this.CloseTemporalWindows();
      }
      else
      {
         if (this.files.length == 0)
            throw "There is not any image selected";
         numImages = this.files.length;
         for (var i = 0; i < this.files.length; i++)
         {
            try
            {
               console.writeln("\n\x1b[36m*******************************\x1b[0m")
               console.writeln("Processing image ", this.files[i]);
               var fileWindow = ImageWindow.open(this.files[i])[0];
               this.temporalWindows.push(fileWindow);
               this.ValidateWindow(fileWindow);
               var autoSTF = new AutoStretch();
               autoSTF.Apply(fileWindow.mainView, false);
               this.ProcessWindow(fileWindow);
               fileWindow.forceClose();
               numImagesOK++;
            } catch (ex)
            {
               console.writeln("\x1b[31m*******************************")
               console.writeln("Error in image " + this.files[i] + ": " + ex);
               console.write("\x1b[0m");
               this.errorList.push({id:this.files[i], message:ex});
            }
            this.CloseTemporalWindows();
            gc(true);
         }
      }

      this.imagesData.sort(
         function (i1, i2)
         {
            if (i1.dateObs && i2.dateObs)
               return i1.dateObs - i2.dateObs;
            else
               return i1.id < i2.id ? -1 : (i1.id == i2.id ? 0 : 1);
         }
      );

      if (numImagesOK > 0)
      {
         this.RemoveEmptyStars();

         if (this.generateFluxTable)
            for (var f = 0; f < this.apertureSteps; f++)
               this.WriteTable(
                  function (star)
                  {
                     return star.flux[f];
                  },
                  format("Flux_Ap%g", this.minimumAperture + f * this.apertureStepSize),
                  function (star)
                  {
                     return star.SNR[f];
                  }
               );
         if (this.generateBackgTable)
            this.WriteTable(function (star)
            {
               return star.background.median;
            }, "Background");
         if (this.generateSNRTable)
            for (var f = 0; f < this.apertureSteps; f++)
               this.WriteTable(
                  function (star)
                  {
                     return star.SNR[f];
                  },
                  format("SNR_Ap%g", this.minimumAperture + f * this.apertureStepSize));
         if (this.generateFlagTable)
            this.WriteTable(function (star)
            {
               return star.flags;
            }, "Flags");
      }

      console.writeln("\n\x1b[36m*******************************\x1b[0m")
      console.writeln("\x1b[0mPhotometry process finished:");
      console.writeln("   <b>" + numImagesOK, " of ", numImages, " images processed successfully.</b>");
      console.writeln("   <b>", numImages - numImagesOK, " images with errors.</b>");
      if(this.errorList.length>0)
         console.writeln("\x1b[31m   <b>", this.errorList.length, " errors and warnings.</b>\x1b[0m");
      if (this.generateErrorLog && this.errorList.length > 0)
         this.WriteErrorList(this.errorList);
   }

   // Select image and get metadata
   this.Init = function (w)
   {
      this.currentWindow = w;

      this.LoadSettings();
      this.LoadParameters();
   }
}

PhotometryEngine.prototype = new ObjectWithSettings;

function main()
{
   console.abortEnabled = true;

   if (!CheckVersion(1, 8, 3))
   {
      new MessageBox("This script requires at least the version 1.8 of PixInsight", TITLE, StdIcon_Error, StdButton_Ok).execute();
      return;
   }

   var engine = new PhotometryEngine;
   if (Parameters.isViewTarget)
   {
      engine.Init(Parameters.targetView.window);

      // When executing on a target the debug windows are not necessary
      //engine.showBackgroundModel = false;
      //engine.showFoundStars = false;
   }
   else
   {
      if(Parameters.getBoolean("non_interactive"))
         engine.Init(ImageWindow.activeWindow);
      else {
         do {
            engine.Init(ImageWindow.activeWindow);
            var dialog = new PhotometryDialog(engine);
            var res = dialog.execute();

            if (!res)
            {
               if (dialog.resetRequest)
                  engine = new PhotometryEngine();
               else
                  return;
            }
         } while (!res);
         engine.SaveSettings();
      }
   }

   engine.Calculate();
}

main();
