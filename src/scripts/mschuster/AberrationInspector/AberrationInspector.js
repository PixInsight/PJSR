// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// AberrationInspector.js - Released 2015/08/06 00:00:00 UTC
// ****************************************************************************
//
// This file is part of AberrationInspector Script version 1.3
//
// Copyright (C) 2012-2015 Mike Schuster. All Rights Reserved.
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

#define TITLE "AberrationInspector"
#define VERSION "1.3"

#feature-id Image Analysis > AberrationInspector

#feature-info An aberration inspector utility.<br/>\
   <br/>\
   This script generates a n x n panel mosaic of subsections of a view. Subsections are\
   organized along horizontal and vertical bands across the view, including its corners,\
   edges and central areas.\
   <br/>\
   Copyright &copy; 2012-2015 Mike Schuster. All Rights Reserved.

#include <pjsr/ColorSpace.jsh>
#include <pjsr/DataType.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/NumericControl.jsh>
#include <pjsr/SampleType.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/UndoFlag.jsh>

// Clips value to the given range
function clipValueRange(value, min, max) {
   return value < min ? min : value > max ? max : value;
}

// Returns a unique view id with the given base id prefix.
function uniqueViewId(baseId) {
   var id = baseId;
   for (var i = 1; !View.viewById(id).isNull; ++i) {
      id = baseId + format("%02d", i);
   }
   return id;
}

// Returns a main view id of a view.
function mainViewIdOfView(view) {
   return view.isMainView ? view.id : view.window.mainView.id + "_" + view.id;
}

// Creates an image window with the given parameters.
function createImageWindow(width, height, viewId, baseImage) {
   return new ImageWindow(
      width,
      height,
      baseImage.numberOfChannels,
      baseImage.bitsPerSample,
      baseImage.sampleType == SampleType_Real,
      baseImage.colorSpace != ColorSpace_Gray,
      viewId
   );
}

// The script's parameters prototype.
function parametersPrototype() {
   this.targetView = null;
   this.mosaicSize = 3;
   this.panelSize = 256;
   this.separationSize = 4;
   this.separationColor = 0.0;

   this.setParameters = function() {
      Parameters.clear();
      Parameters.set("mosaicSize", this.mosaicSize);
      Parameters.set("panelSize", this.panelSize);
      Parameters.set("separationSize", this.separationSize);
      Parameters.set("separationColor", this.separationColor);
   }

   this.getParameters = function() {
      this.mosaicSize = Parameters.has("mosaicSize") ? Parameters.getInteger("mosaicSize") : 3;
      this.mosaicSize = clipValueRange(this.mosaicSize, 2, 9);
      this.panelSize = Parameters.has("panelSize") ? Parameters.getInteger("panelSize") : 256;
      this.panelSize = clipValueRange(this.panelSize, 1, 1024);
      this.separationSize = Parameters.has("separationSize") ? Parameters.getInteger("separationSize") : 4;
      this.separationSize = clipValueRange(this.separationSize, 0, 16);
      this.separationColor = Parameters.has("separationColor") ? Parameters.getReal("separationColor") : 0.0;
      this.separationColor = clipValueRange(this.separationColor, 0.0, 1.0);
   }
}
var parameters = new parametersPrototype();

// Returns a push button with given text and onClick function.
function pushButtonWithTextOnClick(parent, text_, onClick_) {
   var button = new PushButton(parent);

   button.text = text_;
   button.onClick = onClick_;

   return button;
}

// The script's parameters dialog prototype.
function parametersDialogPrototype() {
   this.__base__ = Dialog;
   this.__base__();

   var labelMinWidth = Math.round(this.font.width("Separation color:") + 2.0 * this.font.width('M'));

   var sliderMaxValue = 256;
   var sliderMinWidth = 256;

   var spinBoxWidth = Math.round(6.0 * this.font.width('M'));

   this.windowTitle = TITLE;

   this.titlePane = new Label (this);

   this.titlePane.frameStyle = FrameStyle_Box;
   this.titlePane.margin = 4;
   this.titlePane.wordWrapping = true;
   this.titlePane.useRichText = true;
   this.titlePane.text =
      "<p><b>" + TITLE + " Version " + VERSION + "</b> &mdash; " +
      "This script generates a <i>n</i> x <i>n</i> panel mosaic of subsections of a view. Subsections are " +
      "organized along horizontal and vertical bands across the view, including its corners, " +
      "edges and central areas.</p>" +
      "<p>Copyright &copy; 2012-2015 Mike Schuster. All Rights Reserved.</p>";

   this.targetView = new HorizontalSizer;

   this.viewList = new ViewList(this);
   this.viewListNullCurrentView = this.viewList.currentView;

   this.viewList.getAll();
   if (parameters.targetView.isView) {
      this.viewList.currentView = parameters.targetView;
   }
   else {
      parameters.targetView = this.viewList.currentView;
   }
   this.viewList.onViewSelected = function(view) {parameters.targetView = view;}

   this.targetView.add(this.viewList);

   this.parameterPane = new VerticalSizer;

   this.parameterPane.margin = 6;
   this.parameterPane.spacing = 4;

   this.mosaicSize = new HorizontalSizer;

   this.mosaicSize.spacing = 4;

   this.mosaicLabel = new Label(this);

   this.mosaicLabel.text = "Mosaic size:";
   this.mosaicLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.mosaicLabel.setFixedWidth(labelMinWidth);
   this.mosaicLabel.toolTip =
      "<p>Number of rows and columns in the mosaic.</p>";

   this.mosaicSize.add(this.mosaicLabel);

   this.mosaicSpinBox = new SpinBox(this);

   this.mosaicSpinBox.setRange(2, 9);
   this.mosaicSpinBox.setFixedWidth(spinBoxWidth);
   this.mosaicSpinBox.value = parameters.mosaicSize;
   this.mosaicSpinBox.onValueUpdated = function(value) {parameters.mosaicSize = value;}
   this.mosaicSpinBox.toolTip =
      "<p>Number of rows and columns in the mosaic.</p>";

   this.mosaicSize.add(this.mosaicSpinBox);
   this.mosaicSize.addStretch();

   this.parameterPane.add(this.mosaicSize);

   this.panelSize = new NumericControl(this);

   this.panelSize.label.text = "Panel size:";
   this.panelSize.label.minWidth = labelMinWidth;
   this.panelSize.slider.setRange(0, sliderMaxValue);
   this.panelSize.slider.minWidth = sliderMinWidth;
   this.panelSize.setRange(1.0, 1024.0);
   this.panelSize.setPrecision(0);
   this.panelSize.setValue(parameters.panelSize);
   this.panelSize.onValueUpdated = function(value) {parameters.panelSize = Math.round(value);}
   this.panelSize.toolTip =
      "<p>Width and height in pixels of each panel in the mosaic.</p>";

   this.parameterPane.add(this.panelSize);

   this.separationSize = new NumericControl(this);

   this.separationSize.label.text = "Separation size:";
   this.separationSize.label.minWidth = labelMinWidth;
   this.separationSize.slider.setRange(0, sliderMaxValue);
   this.separationSize.slider.minWidth = sliderMinWidth;
   this.separationSize.setRange(0.0, 16.0);
   this.separationSize.setPrecision(0);
   this.separationSize.setValue(parameters.separationSize);
   this.separationSize.onValueUpdated = function(value) {parameters.separationSize = Math.round(value);}
   this.separationSize.toolTip =
      "<p>Separation in pixels between each panel in the mosaic.</p>";

   this.parameterPane.add(this.separationSize);

   this.separationColor = new NumericControl(this);

   this.separationColor.label.text = "Separation color:";
   this.separationColor.label.minWidth = labelMinWidth;
   this.separationColor.slider.setRange(0, sliderMaxValue);
   this.separationColor.slider.minWidth = sliderMinWidth;
   this.separationColor.setRange(0.0, 1.0);
   this.separationColor.setPrecision(2);
   this.separationColor.setValue(parameters.separationColor);
   this.separationColor.onValueUpdated = function(value) {parameters.separationColor = value;}
   this.separationColor.toolTip =
      "<p>Color of separation between each panel in the mosaic, where 0 is black and 1 is white.</p>";

   this.parameterPane.add(this.separationColor);

   this.buttonPane = new HorizontalSizer;

   this.buttonPane.spacing = 6;

   this.buttonPane.addStretch();
   this.buttonPane.add(pushButtonWithTextOnClick(this, "OK", function() {this.dialog.ok();}));
   this.buttonPane.add(pushButtonWithTextOnClick(this, "Cancel", function() {this.dialog.cancel();}));

   this.sizer = new VerticalSizer;

   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add(this.titlePane);
   this.sizer.add(this.targetView);
   this.sizer.add(this.parameterPane);
   this.sizer.add(this.buttonPane);

   this.adjustToContents();
   this.setFixedSize();
}
parametersDialogPrototype.prototype = new Dialog;

// The script's process prototype.
function processPrototype() {

   this.writeParameters = function(parameters) {
      console.writeln("Target view: ", parameters.targetView.fullId);
      console.writeln("Mosaic size: ", format("%d", parameters.mosaicSize));
      console.writeln("Panel size: ", format("%dpx", parameters.panelSize));
      console.writeln("Separation size: ", format("%dpx", parameters.separationSize));
      console.writeln("Separation color: ", format("%.2f", parameters.separationColor));
   }

   this.createImageWindowOfView = function(view) {
      var imageWindow = createImageWindow(
         view.image.width, view.image.height, uniqueViewId(mainViewIdOfView(view)), view.image
      );

      imageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);

      imageWindow.mainView.image.selectedPoint = new Point(0, 0);
      imageWindow.mainView.image.apply(view.image);
      imageWindow.mainView.image.resetSelections();

      imageWindow.mainView.endProcess();

      return imageWindow;
   }

   this.createMosaicImageWindowOfImageWindow = function(targetImageWindow) {
      var targetWidth = targetImageWindow.mainView.image.width;
      var targetHeight = targetImageWindow.mainView.image.height;

      var panelSize = parameters.panelSize;
      panelSize = Math.min(panelSize, Math.floor(targetWidth / parameters.mosaicSize));
      panelSize = Math.min(panelSize, Math.floor(targetHeight / parameters.mosaicSize));
      if (panelSize < 16) {
         (new MessageBox(
            "<p>Source view is too small for the given mosaic generation parameters.</p>",
            TITLE,
            StdIcon_Error,
            StdButton_Ok
         )).execute();
         return null;
      }

      var mosaicSize = parameters.mosaicSize * panelSize + (parameters.mosaicSize - 1) * parameters.separationSize;

      var mosaicImageWindow = createImageWindow(
         mosaicSize, mosaicSize, uniqueViewId(mainViewIdOfView(parameters.targetView) + "_mosaic"), targetImageWindow.mainView.image
      );

      var columnPositions = new Array(parameters.mosaicSize);
      for (var i = 0; i != columnPositions.length; ++i) {
         columnPositions[i] = Math.round((i / (parameters.mosaicSize - 1)) * (targetWidth - panelSize));
      }
      var rowPositions = new Array(parameters.mosaicSize);
      for (var i = 0; i != rowPositions.length; ++i) {
         rowPositions[i] = Math.round((i / (parameters.mosaicSize - 1)) * (targetHeight - panelSize));
      }

      var targetBounds = new Rect(0, 0, panelSize, panelSize);
      var targetViewId = "_";

      mosaicImageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);

      mosaicImageWindow.mainView.image.fill(parameters.separationColor);

      for (var x = 0; x != parameters.mosaicSize; ++x) {
         for (var y = 0; y != parameters.mosaicSize; ++y) {
            targetBounds.moveTo(new Point(columnPositions[x], rowPositions[y]));
            targetImageWindow.createPreview(targetBounds, targetViewId);

            mosaicImageWindow.mainView.image.selectedPoint = new Point(
               x * (panelSize + parameters.separationSize),
               y * (panelSize + parameters.separationSize)
            );
            mosaicImageWindow.mainView.image.apply(targetImageWindow.previewById(targetViewId).image);

            targetImageWindow.deletePreview(targetImageWindow.previewById(targetViewId));
         }
      }
      mosaicImageWindow.mainView.image.resetSelections();

      mosaicImageWindow.mainView.endProcess();

      mosaicImageWindow.mainView.stf = parameters.targetView.stf;
      mosaicImageWindow.show();

      return mosaicImageWindow;
   }

   this.execute = function() {
      var targetImageWindow = this.createImageWindowOfView(parameters.targetView);
      var mosaicImageWindow = this.createMosaicImageWindowOfImageWindow(targetImageWindow);
      targetImageWindow.forceClose();
   }
}
var process = new processPrototype();

function main() {
   console.hide();

   if (Parameters.isGlobalTarget) {
      parameters.targetView = ImageWindow.activeWindow.currentView;
      parameters.getParameters();

      var parametersDialog = new parametersDialogPrototype();
      if (!parametersDialog.execute()) {
         return;
      }
   }
   else if (Parameters.isViewTarget) {
      parameters.targetView = Parameters.targetView;
      parameters.getParameters();
   }
   else {
      parameters.targetView = ImageWindow.activeWindow.currentView;

      var parametersDialog = new parametersDialogPrototype();
      if (!parametersDialog.execute()) {
         return;
      }
   }

   if (parameters.targetView.isNull) {
      return;
   }
   process.execute();

   // Workaround to avoid image window close crash in 1.8 RC7.
   parametersDialog.viewList.currentView = parametersDialog.viewListNullCurrentView;
}

main();

// ****************************************************************************
// EOF AberrationInspector.js - Released 2015/08/06 00:00:00 UTC
