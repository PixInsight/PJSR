// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// FramesTabViewController.js - Released 2016/12/30 00:00:00 UTC
// ****************************************************************************
//
// This file is part of WavefrontEstimator Script Version 1.19
//
// Copyright (C) 2012-2015 Mike Schuster. All Rights Reserved.
// Copyright (C) 2003-2015 Pleiades Astrophoto S.L. All Rights Reserved.
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

function FramesTabController(model, controller) {
   this.view = null;

   this.intraFocalInitialPath = null;
   this.extraFocalInitialPath = null;

   this.getInitialPath = function(path) {
      var unixPath = File.windowsPathToUnix(path);
      return File.extractDrive(unixPath) + File.extractDirectory(unixPath);
   };

   this.setView = function(view) {
      this.view = view;
   };

   this.resetOutput = function() {
      var title = "Intra-focal frames";
      if (model.intraFocalFramePaths.length != 0) {
         title += format(" (%d)", model.intraFocalFramePaths.length);
      }
      this.view.intraFocalFramesGroupBox.title = title;

      var title = "Extra-focal frames";
      if (model.extraFocalFramePaths.length != 0) {
         title += format(" (%d)", model.extraFocalFramePaths.length);
      }
      this.view.extraFocalFramesGroupBox.title = title;
   };

   this.reset = function() {
      this.intraFocalImagesClear();

      model.framesFullPaths = model.defaultFramesFullPaths;
      this.view.framesFullPathsCheckBox.checked = model.framesFullPaths;

      this.extraFocalImagesClear();

      this.outputDirectoryClear();

      model.outputDirectoryFullPath = model.defaultOutputDirectoryFullPath;
      this.view.outputDirectoryFullPathCheckBox.checked =
         model.outputDirectoryFullPath;
   };

   this.disableControls = function() {
      this.view.intraFocalFramesAddFramesButton.enabled = false;
      this.view.intraFocalFramesRemoveSelectedButton.enabled = false;
      this.view.intraFocalFramesClearButton.enabled = false;

      this.view.framesFullPathsCheckBox.enabled = false;

      this.view.extraFocalFramesAddFramesButton.enabled = false;
      this.view.extraFocalFramesRemoveSelectedButton.enabled = false;
      this.view.extraFocalFramesClearButton.enabled = false;

      this.view.outputDirectoryChooseDirectoryButton.enabled = false;
      this.view.outputDirectoryClearButton.enabled = false;

      this.view.outputDirectoryFullPathCheckBox.enabled = false;
   };

   this.enableControls = function() {
      this.view.intraFocalFramesAddFramesButton.enabled = true;
      this.view.intraFocalFramesRemoveSelectedButton.enabled = true;
      this.view.intraFocalFramesClearButton.enabled = true;

      this.view.framesFullPathsCheckBox.enabled = true;

      this.view.extraFocalFramesAddFramesButton.enabled = true;
      this.view.extraFocalFramesRemoveSelectedButton.enabled = true;
      this.view.extraFocalFramesClearButton.enabled = true;

      this.view.outputDirectoryChooseDirectoryButton.enabled = true;
      this.view.outputDirectoryClearButton.enabled = true;

      this.view.outputDirectoryFullPathCheckBox.enabled = true;
   };

   this.intraFocalImagesAddFrames = function() {
      var openFileDialog = new OpenFileDialog;
      openFileDialog.multipleSelections = true;
      openFileDialog.caption = "Select intra-focal frames";
      openFileDialog.filters = [
         ["All supported formats", ".fit", ".fits", ".fts", ".xisf"],
         ["FITS Files", ".fit", ".fits", ".fts"],
         ["XISF Files", ".xisf"]
      ];
      if (this.intraFocalInitialPath == null) {
         //this.intraFocalInitialPath = Settings.read(
         //   TITLE + "_intraFocalFramePath",
         //   DataType_String
         //);
      }
      if (
         this.intraFocalInitialPath != null &&
         File.directoryExists(this.intraFocalInitialPath)
      ) {
         //openFileDialog.initialPath = this.intraFocalInitialPath;
      }
      if (openFileDialog.execute()) {
         for (var i = 0; i < openFileDialog.fileNames.length; ++i) {
            model.intraFocalFramePaths.push(openFileDialog.fileNames[i]);
            this.intraFocalInitialPath =
               this.getInitialPath(openFileDialog.fileNames[i]);
            //Settings.write(
            //   TITLE + "_intraFocalFramePath",
            //   DataType_String,
            //   this.getInitialPath(openFileDialog.fileNames[i])
            //);

            var node = new TreeBoxNode(this.view.intraFocalFramesTreeBox);
            node.setText(
               0,
               model.framesFullPaths ?
                  openFileDialog.fileNames[i] :
                  File.extractNameAndExtension(openFileDialog.fileNames[i])
            );
         }
         this.view.intraFocalFramesTreeBox.adjustColumnWidthToContents(0);
         controller.resetOutputEstimate();
         controller.enableControls();
      }
   };

   this.intraFocalImagesRemoveSelected = function() {
      if (this.view.intraFocalFramesTreeBox.numberOfChildren != 0) {
         for (
            var i = this.view.intraFocalFramesTreeBox.numberOfChildren - 1;
            i > -1;
            --i
         ) {
            if (this.view.intraFocalFramesTreeBox.child(i).selected) {
               model.intraFocalFramePaths.splice(i, 1);
               this.view.intraFocalFramesTreeBox.remove(i);
            }
         }
         this.view.intraFocalFramesTreeBox.adjustColumnWidthToContents(0);
         controller.resetOutputEstimate();
         controller.enableControls();
      }
   };

   this.intraFocalImagesClear = function() {
      if (this.view.intraFocalFramesTreeBox.numberOfChildren != 0) {
         model.intraFocalFramePaths = new Array();
         this.view.intraFocalFramesTreeBox.clear();
         this.view.intraFocalFramesTreeBox.adjustColumnWidthToContents(0);
         controller.resetOutputEstimate();
         controller.enableControls();
      }
   };

   this.framesFullPathsOnCheck = function(checked) {
      model.framesFullPaths = checked;
      if (this.view.intraFocalFramesTreeBox.numberOfChildren != 0) {
         for (var i = 0; i != model.intraFocalFramePaths.length; ++i) {
            this.view.intraFocalFramesTreeBox.child(i).setText(
               0,
               model.framesFullPaths ?
                  model.intraFocalFramePaths[i] :
                  File.extractNameAndExtension(model.intraFocalFramePaths[i])
            );
         }
         this.view.intraFocalFramesTreeBox.adjustColumnWidthToContents(0);
      }

      if (this.view.extraFocalFramesTreeBox.numberOfChildren != 0) {
         for (var i = 0; i != model.extraFocalFramePaths.length; ++i) {
            this.view.extraFocalFramesTreeBox.child(i).setText(
               0,
               model.framesFullPaths ?
                  model.extraFocalFramePaths[i] :
                  File.extractNameAndExtension(model.extraFocalFramePaths[i])
            );
         }
         this.view.extraFocalFramesTreeBox.adjustColumnWidthToContents(0);
      }
   };

   this.extraFocalImagesAddFrames = function() {
      var openFileDialog = new OpenFileDialog;
      openFileDialog.multipleSelections = true;
      openFileDialog.caption = "Select extra-focal frames";
      openFileDialog.filters = [
         ["All supported formats", ".fit", ".fits", ".fts", ".xisf"],
         ["FITS Files", ".fit", ".fits", ".fts"],
         ["XISF Files", ".xisf"]
      ];
      if (this.extraFocalInitialPath == null) {
         //this.extraFocalInitialPath = Settings.read(
         //   TITLE + "_extraFocalFramePath",
         //   DataType_String
         //);
      }
      if (
         this.extraFocalInitialPath != null &&
         File.directoryExists(this.extraFocalInitialPath)
      ) {
         //openFileDialog.initialPath = this.extraFocalInitialPath;
      }
      if (openFileDialog.execute()) {
         for (var i = 0; i < openFileDialog.fileNames.length; ++i) {
            model.extraFocalFramePaths.push(openFileDialog.fileNames[i]);
            this.extraFocalInitialPath =
               this.getInitialPath(openFileDialog.fileNames[i]);
            //Settings.write(
            //   TITLE + "_extraFocalFramePath",
            //   DataType_String,
            //   this.getInitialPath(openFileDialog.fileNames[i])
            //);

            var node = new TreeBoxNode(this.view.extraFocalFramesTreeBox);
            node.setText(
               0,
               model.framesFullPaths ?
                  openFileDialog.fileNames[i] :
                  File.extractNameAndExtension(openFileDialog.fileNames[i])
            );
         }
         this.view.extraFocalFramesTreeBox.adjustColumnWidthToContents(0);
         controller.resetOutputEstimate();
         controller.enableControls();
      }
   };

   this.extraFocalImagesRemoveSelected = function() {
      if (this.view.extraFocalFramesTreeBox.numberOfChildren != 0) {
         for (
            var i = this.view.extraFocalFramesTreeBox.numberOfChildren - 1;
            i > -1;
            --i
         ) {
            if (this.view.extraFocalFramesTreeBox.child(i).selected) {
               model.extraFocalFramePaths.splice(i, 1);
               this.view.extraFocalFramesTreeBox.remove(i);
            }
         }
         this.view.extraFocalFramesTreeBox.adjustColumnWidthToContents(0);
         controller.resetOutputEstimate();
         controller.enableControls();
      }
   };

   this.extraFocalImagesClear = function() {
      if (this.view.extraFocalFramesTreeBox.numberOfChildren != 0) {
         model.extraFocalFramePaths = new Array();
         this.view.extraFocalFramesTreeBox.clear();
         this.view.extraFocalFramesTreeBox.adjustColumnWidthToContents(0);
         controller.resetOutputEstimate();
         controller.enableControls();
      }
   };

   this.outputDirectoryChooseDirectory = function() {
      var getDirectoryDialog = new GetDirectoryDialog;
      getDirectoryDialog.caption = "Select output directory";
      if (getDirectoryDialog.execute()) {
         model.outputDirectoryPath = getDirectoryDialog.directory;

         this.view.outputDirectoryTreeBox.clear();
         var node = new TreeBoxNode(this.view.outputDirectoryTreeBox);
         node.selectable = false;
         node.setText(
            0,
            model.outputDirectoryFullPath ?
               getDirectoryDialog.directory :
               File.extractNameAndExtension(getDirectoryDialog.directory)
         );
         this.view.outputDirectoryTreeBox.adjustColumnWidthToContents(0);
         controller.resetOutputEstimate();
         controller.enableControls();
      }
   };

   this.outputDirectoryClear = function() {
      if (this.view.outputDirectoryTreeBox.numberOfChildren != 0) {
         model.outputDirectoryPath = null;
         this.view.outputDirectoryTreeBox.clear();
         this.view.outputDirectoryTreeBox.adjustColumnWidthToContents(0);
         controller.resetOutputEstimate();
         controller.enableControls();
      }
   };

   this.outputDirectoryFullPathOnCheck = function(checked) {
      model.outputDirectoryFullPath = checked;
      if (this.view.outputDirectoryTreeBox.numberOfChildren != 0) {
         this.view.outputDirectoryTreeBox.child(0).setText(
            0,
            model.outputDirectoryFullPath ?
               model.outputDirectoryPath :
               File.extractNameAndExtension(model.outputDirectoryPath)
         );
         this.view.outputDirectoryTreeBox.adjustColumnWidthToContents(0);
      }
   };
}

function FramesTabView(parent, model, controller) {
   this.__base__ = Frame;
   this.__base__(parent);

   this.addGroupBox = function(title) {
      var groupBox = new GroupBox(this);
      this.sizer.add(groupBox);

      groupBox.sizer = new VerticalSizer;
      groupBox.sizer.margin = 6;
      groupBox.sizer.spacing = 6;
      groupBox.title = title;
      groupBox.styleSheet = "*{}";

#ifeq __PI_PLATFORM__ MACOSX
      if (coreVersionBuild < 1168) {
         groupBox.sizer.addSpacing(-6);
      }
#endif

      return groupBox;
   };

   this.addPane = function(group) {
      var buttonPane = new HorizontalSizer;
      buttonPane.spacing = 6;
      group.sizer.add(buttonPane);

      return buttonPane;
   };

   this.treeBoxHeight = function(treeBox, header, rows, scrollBar) {
#iflt __PI_BUILD__ 1168
      var rowHeight = 6;
#else
      var rowHeight = 4;
#endif
#ifeq __PI_PLATFORM__ MACOSX
      if (coreVersionBuild < 1168) {
         rowHeight = 5;
      }
#endif

      var height =
         2 * treeBox.logicalPixelsToPhysical(0.5 * treeBox.borderWidth) +
         treeBox.logicalPixelsToPhysical(2);

      if (header) {
         height +=
            treeBox.logicalPixelsToPhysical(0.5 * treeBox.borderWidth) +
            treeBox.font.height + treeBox.logicalPixelsToPhysical(rowHeight);
      }

      height +=
         Math.round(
            rows *
            (treeBox.font.height + treeBox.logicalPixelsToPhysical(rowHeight))
         );

      if (scrollBar) {
         height +=
            2 * treeBox.logicalPixelsToPhysical(2) +
            treeBox.logicalPixelsToPhysical(11);
      }

      return height;
   };

   this.addTreeBox = function(group, rows, paths, fullPaths) {
      var treeBox = new TreeBox(this);
      group.sizer.add(treeBox);

      treeBox.alternateRowColor = true;
      treeBox.headerVisible = false;
      treeBox.horizontalScrollBarVisible = true;
      treeBox.indentSize = 0;
      treeBox.multipleSelection = true;
      treeBox.numberOfColumns = 2;
      treeBox.setHeaderAlignment(0, TextAlign_Left | TextAlign_VertCenter);
      treeBox.setFixedHeight(this.treeBoxHeight(treeBox, false, rows, true));
      treeBox.showColumn(1, false);

      for (var i = 0; i < paths.length; ++i) {
         var node = new TreeBoxNode(treeBox);
         node.selectable = rows != 1;
         node.setText(
            0, fullPaths ? paths[i] : File.extractNameAndExtension(paths[i])
         );
      }
      treeBox.adjustColumnWidthToContents(0);

      return treeBox;
   };

   this.addPushButton = function(pane, text, toolTip, onClick) {
      var pushButton = new PushButton(this);
      pane.add(pushButton);

      pushButton.text = text;
      pushButton.toolTip = toolTip;
      pushButton.onClick = onClick;

      return pushButton;
   };

   this.addCheckBox = function(pane, text, toolTip, checked, onCheck) {
      var checkBox = new CheckBox(this);
      pane.add(checkBox);

      checkBox.text = text;
      checkBox.toolTip = toolTip;
      checkBox.checked = checked;
      checkBox.onCheck = onCheck;

      return checkBox;
   };

   this.sizer = new VerticalSizer();
   this.sizer.margin = 6;
   this.sizer.spacing = 6;

   this.framesTreeBoxRows = 5.5;

   {
      this.intraFocalFramesGroupBox = this.addGroupBox("Intra-focal frames");
      this.intraFocalFramesGroupBox.toolTip =
         "<p>The list of intra-focal frames selected for combination.</p>" +

         "<p>The frames must be bias-subtracted and must not be otherwise " +
         "processed. Frames from color filter array detectors must not be " +
         "demosaiced.</p>";

      this.intraFocalFramesTreeBox = this.addTreeBox(
         this.intraFocalFramesGroupBox,
         this.framesTreeBoxRows,
         model.intraFocalFramePaths,
         model.framesFullPaths
      );

      this.intraFocalFramesButtonPane = this.addPane(
         this.intraFocalFramesGroupBox
      );

      this.intraFocalFramesAddFramesButton = this.addPushButton(
         this.intraFocalFramesButtonPane,
         "Add Frames",
         "<p>Add frames to the list of intra-focal frames.</p>",
         function() {controller.intraFocalImagesAddFrames();}
      );

      this.intraFocalFramesRemoveSelectedButton = this.addPushButton(
         this.intraFocalFramesButtonPane,
         "Remove Selected",
         "<p>Removes currently selected intra-focal frames from the list.</p>",
         function() {controller.intraFocalImagesRemoveSelected();}
      );

      this.intraFocalFramesClearButton = this.addPushButton(
         this.intraFocalFramesButtonPane,
         "Clear",
         "<p>Clear the list of intra-focal frames.</p>",
         function() {controller.intraFocalImagesClear();}
      );

      this.intraFocalFramesButtonPane.addStretch();

      this.framesFullPathsCheckBox = this.addCheckBox(
         this.intraFocalFramesButtonPane,
         "Full paths",
         "<p>Show full paths for the intra-focal and extra-focal frames.</p>",
         model.framesFullPaths,
         function(checked) {controller.framesFullPathsOnCheck(checked);}
      );
   }

   {
      this.extraFocalFramesGroupBox = this.addGroupBox("Extra-focal frames");
      this.extraFocalFramesGroupBox.toolTip =
         "<p>The list of extra-focal frames selected for combination.</p>" +

         "<p>The frames must be bias-subtracted and must not be otherwise " +
         "processed. Frames from color filter array detectors must not be " +
         "demosaiced.</p>";

      this.extraFocalFramesTreeBox = this.addTreeBox(
         this.extraFocalFramesGroupBox,
         this.framesTreeBoxRows,
         model.extraFocalFramePaths,
         model.framesFullPaths
      );

      this.extraFocalFramesButtonPane = this.addPane(
         this.extraFocalFramesGroupBox
      );

      this.extraFocalFramesAddFramesButton = this.addPushButton(
         this.extraFocalFramesButtonPane,
         "Add Frames",
         "<p>Add frames to the list of extra-focal frames.</p>",
         function() {controller.extraFocalImagesAddFrames();}
      );

      this.extraFocalFramesRemoveSelectedButton = this.addPushButton(
         this.extraFocalFramesButtonPane,
         "Remove Selected",
         "<p>Removes currently selected extra-focal frames from the list.</p>",
         function() {controller.extraFocalImagesRemoveSelected();}
      );

      this.extraFocalFramesClearButton = this.addPushButton(
         this.extraFocalFramesButtonPane,
         "Clear",
         "<p>Clear the list of extra-focal frames.</p>",
         function() {controller.extraFocalImagesClear();}
      );

      this.extraFocalFramesButtonPane.addStretch();
   }

   {
      this.outputDirectoryGroupBox = this.addGroupBox("Output directory");
      this.outputDirectoryGroupBox.toolTip =
         "<p>The output directory.</p>" +

         "<p>If specified, output images, plots, csv files, and the log " +
         "file will be saved in this directory.</p>";

      this.outputDirectoryTreeBox = this.addTreeBox(
         this.outputDirectoryGroupBox,
         1,
         model.outputDirectoryPath != null ? [model.outputDirectoryPath] : [],
         model.outputDirectoryFullPath
      );

      this.outputDirectoryButtonPane = this.addPane(
         this.outputDirectoryGroupBox
      );

      this.outputDirectoryChooseDirectoryButton = this.addPushButton(
         this.outputDirectoryButtonPane,
         "Select Directory",
         "<p>Select an output directory.</p>",
         function() {controller.outputDirectoryChooseDirectory();}
      );

      this.outputDirectoryClearButton = this.addPushButton(
         this.outputDirectoryButtonPane,
         "Clear",
         "<p>Clear the selection of an output directory.</p>",
         function() {controller.outputDirectoryClear();}
      );

      this.outputDirectoryButtonPane.addStretch();

      this.outputDirectoryFullPathCheckBox = this.addCheckBox(
         this.outputDirectoryButtonPane,
         "Full path",
         "<p>Show full path for the output directory.</p>",
         model.outputDirectoryFullPath,
         function(checked) {
            controller.outputDirectoryFullPathOnCheck(checked);
         }
      );
   }

   this.sizer.addStretch();
}
FramesTabView.prototype = new Frame;

// ****************************************************************************
// EOF FramesTabViewController.js - Released 2016/12/30 00:00:00 UTC
