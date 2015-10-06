// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// ContrastBackgroundNoiseRatio.js - Released 2013/09/02 18:24:46 UTC
// ****************************************************************************
//
// This file is part of ContrastBackgroundNoiseRatio Script version 0.6
//
// Copyright (C) 2012-2013 Mike Schuster. All Rights Reserved.
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

#define TITLE "ContrastBackgroundNoiseRatio"
#define VERSION "0.6"

#feature-id Image Analysis > ContrastBackgroundNoiseRatio

#feature-info Estimates the median, contrast, background mean, background noise and contrast-\
   background-noise ratio (CBNR) of a view.<br/>\
   <br/>\
   Copyright &copy; 2012-2013 Mike Schuster. All Rights Reserved.

#include <pjsr/DataType.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/UndoFlag.jsh>

function defaultNullMinMaxValue(value, min, max, def) {
   return value != null && !isNaN(value) && value >= min && value <= max ? value : def;
}

function parametersPrototype() {
   this.dialog = null;

   this.targetView = null;

   this.backgroundPercentileLabels = new Array(
      "1st",
      "2nd",
      "3rd",
      "5th",
      "10th",
      "20th",
      "30th",
      "50th",
      "100th"
   );
   this.backgroundCycleSpinsLabels = new Array(
      "1",
      "2",
      "4",
      "8"
   );

   this.backgroundBlockSize = 8;
   this.backgroundCycleSpins = new Array(
      new Point(0, 0),
      new Point(4, 4),
      new Point(0, 4),
      new Point(4, 0),
      new Point(2, 2),
      new Point(6, 6),
      new Point(2, 6),
      new Point(6, 2)
   );
   this.defBackgroundPercentileIndex = 1;
   this.backgroundPercentileIndex = this.defBackgroundPercentileIndex;
   this.defBackgroundCycleSpinsIndex = 1;
   this.backgroundCycleSpinsIndex = this.defBackgroundCycleSpinsIndex;
   this.quantile =
      0.01 * parseInt(this.backgroundPercentileLabels[this.backgroundPercentileIndex]);
   this.resolution = 65535;
   this.standardDeviationBias = 1.0 / 0.9948;

   this.validResults = false;
   this.median = 0.0;
   this.contrast = 0.0;
   this.backgroundMean = 0.0;
   this.backgroundNoise = 0.0;
   this.CBNR = 0.0;

   this.storeSettings = function() {
      Settings.write(
         TITLE + "." + VERSION + "_backgroundPercentile" ,
         DataType_Int32,
         this.backgroundPercentileIndex
      );

      Settings.write(
         TITLE + "." + VERSION + "_backgroundCycleSpins" ,
         DataType_Int32,
         this.backgroundCycleSpinsIndex
      );
   }

   this.loadSettings = function() {
      var value = Settings.read(TITLE + "." + VERSION + "_backgroundPercentile", DataType_Int32);
      this.backgroundPercentileIndex = defaultNullMinMaxValue(
         value, 0, this.backgroundPercentileLabels.length - 1, this.defBackgroundPercentileIndex
      );
      this.quantile =
         0.01 * parseInt(this.backgroundPercentileLabels[this.backgroundPercentileIndex]);

      var value = Settings.read(TITLE + "." + VERSION + "_backgroundCycleSpins", DataType_Int32);
      this.backgroundCycleSpinsIndex = defaultNullMinMaxValue(
         value, 0, this.backgroundCycleSpinsLabels.length - 1, this.defBackgroundCycleSpinsIndex
      );
   }
}
var parameters = new parametersPrototype();

function Pair(first, last) {
   this.first = first;
   this.last = last;
}

function meanOfArray(array) {
   if (array.length < 1) {
      return NaN;
   }
   var mean = 0.0;
   for (var i = 0; i != array.length; ++i) {
      mean += array[i];
   }
   return mean / array.length;
}

function meanStandardDeviationOfArray(array) {
   if (array.length < 1) {
      return new Pair(NaN, NaN);
   }
   if (array.length < 2) {
      return new Pair(array[0], NaN);
   }
   var mean = 0.0;
   for (var i = 0; i != array.length; ++i) {
      mean += array[i];
   }
   mean = mean / array.length;
   var variance = 0.0;
   for (var i = 0; i != array.length; ++i) {
      var deviation = array[i] - mean;
      variance += deviation * deviation;
   }
   return new Pair(mean, Math.sqrt(variance / (array.length - 1)));
}

function medianCompare(a, b) {
   return a < b ? -1 : a > b ? 1 : 0;
}

function medianOfArray(array) {
   if (array.length < 1) {
      return NaN;
   }
   var copy = new Array();
   for (var i = 0; i != array.length; ++i) {
      copy.push(array[i]);
   }
   copy.sort(medianCompare);

   var threshold = Math.floor(0.5 * copy.length);
   return (2 * threshold == copy.length) ?
      0.5 * (copy[threshold - 1] + copy[threshold]) :
      copy[threshold];
}

function medianOfImage(image) {
   return parameters.resolution * image.median();
}

function contrastOfImage(image) {
   return parameters.resolution * image.avgDev();
}

function blockMeanCompare(a, b) {
   return a.first.first < b.first.first ? -1 : a.first.first > b.first.first ? 1 : 0;
}

function blocksOfImageCycleSpin(image, cycleSpin) {
   var minY = cycleSpin.y;
   var maxY = cycleSpin.y +
      parameters.backgroundBlockSize *
      Math.floor((image.height - cycleSpin.y) / parameters.backgroundBlockSize);
   var minX = cycleSpin.x;
   var maxX = cycleSpin.x +
      parameters.backgroundBlockSize *
      Math.floor((image.width - cycleSpin.x) / parameters.backgroundBlockSize);
   //console.writeln("minY: ", minY, " maxY: ", maxY, ", minX:", minX, ", maxX:", maxX);

   var pixels = new Array;
   image.getPixels(pixels);
   var blocks = new Array();
   var block = new Array();
   for (var y = minY; y != maxY; y += parameters.backgroundBlockSize) {
      for (var x = minX; x != maxX; x += parameters.backgroundBlockSize) {
         for (var y0 = 0; y0 != parameters.backgroundBlockSize; ++y0) {
            var row = image.width * (y + y0);
            for (var x0 = 0; x0 != parameters.backgroundBlockSize; ++x0) {
               block.push(pixels[row + x + x0]);
            }
         }

         blocks.push(new Pair(meanStandardDeviationOfArray(block), new Point(x, y)));
         block.splice(0, block.length);
      }
   }
   blocks.sort(blockMeanCompare);
   //console.writeln("blocks.length: ", blocks.length);
   return blocks;
}

function backgroundMeanNoiseOfImageCycleSpin(image, cycleSpin) {
   if (Math.min(image.height, image.width) < 2 * parameters.backgroundBlockSize) {
      return new Pair(0.0, 0.0);
   }
   var blocks = blocksOfImageCycleSpin(image, cycleSpin);
   var threshold = Math.floor(parameters.quantile * blocks.length);

   var standardDeviations = new Array();
   for (var i = 0; i != Math.min(blocks.length, threshold + 1); ++i) {
      standardDeviations.push(blocks[i].first.last);
   }
   if (standardDeviations.length < 1) {
      return new Pair(0.0, 0.0);
   }
   return new Pair(
      parameters.resolution *
         blocks[Math.floor(0.5 * parameters.quantile * blocks.length)].first.first,
      parameters.resolution *
         parameters.standardDeviationBias * medianOfArray(standardDeviations)
   );
}

function backgroundMeanNoiseOfImage(image) {
   var means = new Array;
   var noises = new Array;
   for (var i = 0; i != Math.pow(2, parameters.backgroundCycleSpinsIndex); ++i) {
      var meanNoise =
         backgroundMeanNoiseOfImageCycleSpin(image, parameters.backgroundCycleSpins[i]);
      means.push(meanNoise.first);
      noises.push(meanNoise.last);
   }
   return new Pair(meanOfArray(means), meanOfArray(noises));
}

function supportOfImageCycleSpin(image, cycleSpin, lowSupport, highSupport, noise) {
   if (Math.min(image.height, image.width) < 2 * parameters.backgroundBlockSize) {
      return;
   }
   var blocks = blocksOfImageCycleSpin(image, cycleSpin);
   var threshold = Math.floor(parameters.quantile * blocks.length);

   var median = noise / (parameters.resolution * parameters.standardDeviationBias);
   for (var i = 0; i != Math.min(blocks.length, threshold + 1); ++i) {
      var x = blocks[i].last.x;
      var y = blocks[i].last.y;
      if (blocks[i].first.last <= median) {
         for (var y0 = 0; y0 != parameters.backgroundBlockSize; ++y0) {
            var row = image.width * (y + y0);
            for (var x0 = 0; x0 != parameters.backgroundBlockSize; ++x0) {
               lowSupport[row + x + x0] = 1;
            }
         }
      }
      if (blocks[i].first.last >= median) {
         for (var y0 = 0; y0 != parameters.backgroundBlockSize; ++y0) {
            var row = image.width * (y + y0);
            for (var x0 = 0; x0 != parameters.backgroundBlockSize; ++x0) {
               highSupport[row + x + x0] = 1;
            }
         }
      }
   }
}

function supportOfImage(image, lowSupport, highSupport) {
   var length = image.height * image.width;
   for (var i = 0; i != length; ++i) {
      lowSupport.push(0);
      highSupport.push(0);
   }

   for (var i = 0; i != Math.pow(2, parameters.backgroundCycleSpinsIndex); ++i) {
      supportOfImageCycleSpin(
         parameters.targetView.image,
         parameters.backgroundCycleSpins[i],
         lowSupport,
         highSupport,
         parameters.backgroundNoise
      );
   }
}

function disable() {
   parameters.dialog.measureButton.text = "Measuring...";
   parameters.dialog.measureButton.enabled = false;
   parameters.dialog.saveAsButton.enabled = false;
   parameters.dialog.supportButton.enabled = false;
   parameters.dialog.dismissButton.enabled = false;
   parameters.dialog.medianNode.setText(1, "...");
   parameters.dialog.contrastNode.setText(1, "...");
   parameters.dialog.backgroundMeanNode.setText(1, "...");
   parameters.dialog.backgroundNoiseNode.setText(1, "...");
   parameters.dialog.CBNRNode.setText(1, "...");
   parameters.dialog.viewList.enabled = false;
   parameters.dialog.backgroundPercentile.enabled = false;
   parameters.dialog.backgroundCycleSpins.enabled = false;
   parameters.dialog.adjustToContents();
}

function getMedian() {
   if (!parameters.validResults) {
      return "-";
   }
   return format("%.2f DN", parameters.median);
}


function getContrast() {
   if (!parameters.validResults) {
      return "-";
   }
   return format("%.2f DN", parameters.contrast);
}

function getBackgroundMean() {
   if (!parameters.validResults) {
      return "-";
   }
   return format("%.2f DN", parameters.backgroundMean);
}

function getBackgroundNoise() {
   if (!parameters.validResults) {
      return "-";
   }
   return format("%.2f DN RMS", parameters.backgroundNoise);
}

function getCBNR() {
   if (!parameters.validResults) {
      return "-";
   }
   return format("%.2f", parameters.CBNR);
}

function enable() {
   parameters.dialog.measureButton.text = "Measure";
   parameters.dialog.measureButton.enabled =
      parameters.targetView != null && !parameters.targetView.isNull;
   parameters.dialog.updateButton.enabled = parameters.validResults;
   parameters.dialog.saveAsButton.enabled = parameters.validResults;
   parameters.dialog.supportButton.enabled = parameters.validResults;
   parameters.dialog.dismissButton.enabled = true;
   parameters.dialog.medianNode.setText(1, getMedian());
   parameters.dialog.contrastNode.setText(1, getContrast());
   parameters.dialog.backgroundMeanNode.setText(1, getBackgroundMean());
   parameters.dialog.backgroundNoiseNode.setText(1, getBackgroundNoise());
   parameters.dialog.CBNRNode.setText(1, getCBNR());
   parameters.dialog.viewList.enabled = true;
   parameters.dialog.backgroundPercentile.enabled = true;
   parameters.dialog.backgroundCycleSpins.enabled = true;
}

function uniqueViewId(baseId) {
   var id = baseId;
   for (var i = 1; !View.viewById(id).isNull; ++i) {
      id = baseId + format("%02d", i);
   }
   return id;
}

function globalClear() {
   parameters.validResults = false;
   enable();
}

function globalMeasure() {
   disable();

   parameters.validResults = false;
   if (parameters.targetView == null || parameters.targetView.isNull) {
      enable();
      return;
   }
   var image = parameters.targetView.image;
   if (!image.isGrayscale) {
      enable();
      (new MessageBox(
         "<p>Error: Target view color space must be grayscale.</p>",
         TITLE + "." + VERSION,
         StdIcon_Warning,
         StdButton_Ok
      )).execute();
      return;
   }
   if (Math.min(image.height, image.width) < 2 * parameters.backgroundBlockSize) {
      enable();
      (new MessageBox(
         "<p>Error: Target view width and height must be at least " +
            format("%d", 2 * parameters.backgroundBlockSize) +
            " pixels.</p>",
         TITLE + "." + VERSION,
         StdIcon_Warning,
         StdButton_Ok
      )).execute();
      return;
   }

   var startTime = new Date;
   console.writeln();
   console.writeln("Processing view: ", parameters.targetView.fullId);

   parameters.validResults = true;
   parameters.median = medianOfImage(image);
   parameters.contrast = contrastOfImage(image);
   var backgroundMeanNoise = backgroundMeanNoiseOfImage(image);
   parameters.backgroundMean = backgroundMeanNoise.first;
   parameters.backgroundNoise = backgroundMeanNoise.last;
   parameters.CBNR = parameters.backgroundNoise != 0.0 ?
      parameters.contrast / parameters.backgroundNoise :
      0.0;

   var endTime = new Date;
   console.writeln(format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime())));

   enable();
}

function globalUpdate() {
   var filteredKeywords = [];
   var keywords = parameters.targetView.window.keywords;
   for (var i = 0; i != keywords.length; ++i) {
      var keyword = keywords[i];
      if (keyword.name != "IWEIGHT") {
         filteredKeywords.push(keyword);
      }
   }
   parameters.targetView.window.keywords = filteredKeywords.concat([
      new FITSKeyword(
         "IWEIGHT",
         format("%e", Math.pow(parameters.CBNR, 2.0)),
         TITLE + "." + VERSION
      )
   ]);
}

function globalSaveAs() {
   var directory = Settings.read(
      TITLE + "." + VERSION + "_" + "saveAsDirectory", DataType_String
   );
   if (!Settings.lastReadOK || directory == null || !File.directoryExists(directory)
   ) {
      directory = File.systemTempDirectory;
   }

   var saveFileDialog = new SaveFileDialog();

   saveFileDialog.caption = TITLE + "." + VERSION + ": Save Values File As";
   saveFileDialog.filters = [[".csv files", "*.csv"]];
   saveFileDialog.initialPath = directory + "/" + parameters.targetView.fullId + "_CBNR.csv";
   if (!saveFileDialog.execute()) {
      return;
   }

   Settings.write(
      TITLE + "." + VERSION + "_" + "saveAsDirectory",
      DataType_String,
      File.extractDrive(saveFileDialog.fileName) +
         File.extractDirectory(saveFileDialog.fileName)
   );

   try {
      var file = new File();
      file.createForWriting(saveFileDialog.fileName);

      file.outTextLn(TITLE + "." + VERSION);
      file.outTextLn("Percentile," +
         parameters.backgroundPercentileLabels[parameters.backgroundPercentileIndex]
      );
      file.outTextLn("Cycle-spins," +
         parameters.backgroundCycleSpinsLabels[parameters.backgroundCycleSpinsIndex]
      );

      file.outTextLn(
         "Header,Target,Identifier,Median DN,Contrast DN,Background mean DN,Background noise DN RMS,CBNR"
      );
      file.outTextLn(
         "Target," +
         parameters.targetView.fullId + "," +
         format("%e", parameters.median) + "," +
         format("%e", parameters.contrast) + "," +
         format("%e", parameters.backgroundMean) + "," +
         format("%e", parameters.backgroundNoise) + "," +
         format("%e", parameters.CBNR)
      );

      file.close();
   }
   catch (error) {
      (new MessageBox(
         "<p>Error: Can't write .csv file: " + saveFileDialog.fileName + "</p>",
         TITLE + "." + VERSION,
         StdIcon_Warning,
         StdButton_Ok
      )).execute();
   }
}

function globalSupport() {
   disable();

   var startTime = new Date;
   console.writeln();
   console.writeln("Processing view: ", parameters.targetView.fullId);

   var lowSupport = new Array();
   var highSupport = new Array();
   supportOfImage(parameters.targetView.image, lowSupport, highSupport);

   var lowSupportImageWindow = new ImageWindow(
      parameters.targetView.image.width,
      parameters.targetView.image.height,
      1,
      32,
      true,
      false,
      uniqueViewId(parameters.targetView.fullId + "_lowSupport")
   );
   lowSupportImageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);
   lowSupportImageWindow.mainView.image.setPixels(lowSupport);
   lowSupportImageWindow.mainView.endProcess();

   var highSupportImageWindow = new ImageWindow(
      parameters.targetView.image.width,
      parameters.targetView.image.height,
      1,
      32,
      true,
      false,
      uniqueViewId(parameters.targetView.fullId + "_highSupport")
   );
   highSupportImageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);
   highSupportImageWindow.mainView.image.setPixels(highSupport);
   highSupportImageWindow.mainView.endProcess();

   var supportImageWindow = new ImageWindow(
      parameters.targetView.image.width,
      parameters.targetView.image.height,
      3,
      32,
      true,
      true,
      uniqueViewId(
         parameters.targetView.fullId +
         "_" +
         parameters.backgroundPercentileLabels[parameters.backgroundPercentileIndex] +
         "_" +
         parameters.backgroundCycleSpinsLabels[parameters.backgroundCycleSpinsIndex] +
         "_support"
      )
   );

   var pixelMath = new PixelMath;
   pixelMath.rescale = false;
   pixelMath.truncate = false;
   pixelMath.useSingleExpression = false;

   pixelMath.expression0 =
      //parameters.targetView.fullId + " + 0.5 * " + highSupportImageWindow.mainView.fullId;
      highSupportImageWindow.mainView.fullId;
   pixelMath.expression1 =
      //parameters.targetView.fullId;
      "0";
   pixelMath.expression2 =
      //parameters.targetView.fullId + " + 0.5 * " + lowSupportImageWindow.mainView.fullId;
      lowSupportImageWindow.mainView.fullId;
   pixelMath.executeOn(supportImageWindow.mainView, false);

   var endTime = new Date;
   console.writeln(format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime())));

   lowSupportImageWindow.forceClose();
   highSupportImageWindow.forceClose();
   //supportImageWindow.mainView.stf = parameters.targetView.stf;
   supportImageWindow.show();

   enable();
}

function parametersDialogPrototype() {
   this.__base__ = Dialog;
   this.__base__();

   this.windowTitle = TITLE + "." + VERSION;

   this.targetPane = new HorizontalSizer;

   this.viewList = new ViewList(this);
   this.viewListNullCurrentView = this.viewList.currentView;

   this.viewList.getAll();
   if (ImageWindow.activeWindow.currentView.isMainView) {
      parameters.targetView = ImageWindow.activeWindow.currentView;
      this.viewList.currentView = parameters.targetView;
   }
   this.viewList.toolTip = "<p>The view targeted for measurement.</p>";
   this.viewList.onViewSelected = function(view) {
      parameters.targetView = view;
      globalClear();
   }

   this.targetPane.add(this.viewList);

   this.settingsPane = new VerticalSizer;

   this.settingsPane.spacing = 6;

   this.percentilePane = new HorizontalSizer;

   this.percentilePane.spacing = 6;

   this.backgroundPercentileLabel = new Label(this);

   this.backgroundPercentileLabel.text = "Background percentile:";
   this.backgroundPercentileLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.backgroundPercentileLabel.toolTip = "<p>Background mean and noise are measured in local regions of the view with " +
      "mean below the selected percentile.</p>" +
      "<p>Smaller percentile values risk biases due to undersampling the background.</p>" +
      "<p>Larger percentile values risk biases due to the inclusion of brighter, " +
      "non-homogeneous structures and intensity related variations of Poisson noise.</p>" +
      "<p>The percentile value should be fixed for a set of subframes of an integration " +
      "to increase the relative consistency of the measurements of the set.</p>";

   this.percentilePane.add(this.backgroundPercentileLabel);

   this.backgroundPercentile = new ComboBox(this);

   for (var i = 0; i != parameters.backgroundPercentileLabels.length; ++i) {
      this.backgroundPercentile.addItem(" " + parameters.backgroundPercentileLabels[i]);
   }
   this.backgroundPercentile.currentItem = parameters.backgroundPercentileIndex;
   this.backgroundPercentile.toolTip = this.backgroundPercentileLabel.toolTip;
   this.backgroundPercentile.onItemSelected = function(item) {
      if (parameters.backgroundPercentileIndex != item) {
         parameters.backgroundPercentileIndex = item;
         parameters.quantile =
            0.01 *
            parseInt(parameters.backgroundPercentileLabels[parameters.backgroundPercentileIndex]);
         globalClear();
      }
   };

   this.percentilePane.add(this.backgroundPercentile);
   this.percentilePane.addSpacing(18);

   this.backgroundCycleSpinsLabel = new Label(this);

   this.backgroundCycleSpinsLabel.text = "Cycle-spins:";
   this.backgroundCycleSpinsLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.backgroundCycleSpinsLabel.toolTip = "<p>Controls the number of measurements made to estimate background mean " +
      "and noise.</p>" +
      "<p>Larger cycle-spin values result in more robust estimations but require " +
      "more time.</p>";

   this.percentilePane.add(this.backgroundCycleSpinsLabel);

   this.backgroundCycleSpins = new ComboBox(this);

   for (var i = 0; i != parameters.backgroundCycleSpinsLabels.length; ++i) {
      this.backgroundCycleSpins.addItem(" " + parameters.backgroundCycleSpinsLabels[i]);
   }
   this.backgroundCycleSpins.currentItem = parameters.backgroundCycleSpinsIndex;
   this.backgroundCycleSpins.toolTip = this.backgroundCycleSpinsLabel.toolTip;
   this.backgroundCycleSpins.onItemSelected = function(item) {
      if (parameters.backgroundCycleSpinsIndex != item) {
         parameters.backgroundCycleSpinsIndex = item;
         globalClear();
      }
   };

   this.percentilePane.add(this.backgroundCycleSpins);
   this.percentilePane.addStretch();

   this.settingsPane.add(this.percentilePane);

   this.resultsPane = new VerticalSizer;

   var treeBox = new TreeBox(this);
   this.treeBox = treeBox;

   this.treeBox.alternateRowColor = true;
   this.treeBox.headerVisible = false;
   this.treeBox.indentSize = 0;
   this.treeBox.numberOfColumns = 2;

   this.treeBox.setHeaderAlignment(0, Align_Left | TextAlign_VertCenter);
   this.treeBox.setColumnWidth(0, this.treeBox.font.width("Background noise") + 4 * this.treeBox.font.width("M"));
   this.treeBox.setHeaderAlignment(1, Align_Left | TextAlign_VertCenter);
   this.treeBox.setColumnWidth(1, this.treeBox.columnWidth(0));

   this.medianNode = new TreeBoxNode(treeBox);

   this.medianNode.setText(0, "Median");
   this.medianNode.setText(1, "-");
   this.medianNode.setToolTip(0, "<p>Median equals the median of the view in data number (DN) units.</p>");
   this.medianNode.setToolTip(1, this.medianNode.toolTip(0));

   this.contrastNode = new TreeBoxNode(treeBox);

   this.contrastNode.setText(0, "Contrast");
   this.contrastNode.setText(1, "-");
   this.contrastNode.setToolTip(0, "<p>Contrast equals the mean absolute deviation about the median of the " +
      "view in data number (DN) units.</p>");
   this.contrastNode.setToolTip(1, this.contrastNode.toolTip(0));

   this.backgroundMeanNode = new TreeBoxNode(treeBox);

   this.backgroundMeanNode.setText(0, "Background mean");
   this.backgroundMeanNode.setText(1, "-");
   this.backgroundMeanNode.setToolTip(0, "<p>Background mean equals the mean of the local region in the view " +
      "with mean at half the selected percentile in data number (DN) units.</p>");
   this.backgroundMeanNode.setToolTip(1, this.backgroundMeanNode.toolTip(0));


   this.backgroundNoiseNode = new TreeBoxNode(treeBox);

   this.backgroundNoiseNode.setText(0, "Background noise");
   this.backgroundNoiseNode.setText(1, "-");
   this.backgroundNoiseNode.setToolTip(0, "<p>Background noise equals the median standard deviation of Gaussian " +
      "noise in local regions of the view with mean below the selected percentile " +
      "in data number (DN) units.</p>");
   this.backgroundNoiseNode.setToolTip(1, this.backgroundNoiseNode.toolTip(0));

   this.CBNRNode = new TreeBoxNode(treeBox);

   this.CBNRNode.setText(0, "CBNR");
   this.CBNRNode.setText(1, "-");
   this.CBNRNode.setToolTip(0, "<p>Contrast-background-noise ratio (CBNR).</p>");
   this.CBNRNode.setToolTip(1, this.CBNRNode.toolTip(0));

   this.resultsPane.add(this.treeBox);

   this.buttonPane = new HorizontalSizer;

   this.buttonPane.spacing = 6;

   this.aboutButton = new ToolButton(this);
   this.aboutButton.icon = this.scaledResource( ":/icons/comment.png" );
   this.aboutButton.setScaledFixedSize( 20, 20 );
   this.aboutButton.toolTip = "<p>Estimates the median, contrast, background mean, background noise and " +
      "contrast-background-noise ratio (CBNR) of a view.</p>" +
      "<p>Contrast equals the mean absolute deviation about the median of the view.</p>" +
      "<p>Background mean equals the mean of the local region in the view with mean at half " +
      "a selected percentile.</p>" +
      "<p>Background noise equals the median standard deviation of Gaussian noise in local " +
      "regions of the view with mean below a selected percentile.</p>" +
      "<p>Copyright &copy; 2012-2013 Mike Schuster. All Rights Reserved.</p>";
   this.aboutButton.onClick = function() {
   };

   this.buttonPane.add(this.aboutButton);
   this.buttonPane.addStretch();

   this.measureButton = new PushButton(this);

   this.measureButton.text = "Measuring...";
   this.measureButton.toolTip = "<p>Measures the target view.</p>";
   this.measureButton.onClick = function() {
      globalMeasure();
   };

   this.buttonPane.add(this.measureButton);

   this.updateButton = new PushButton(this);

   this.updateButton.text = "Update";
   this.updateButton.toolTip = "<p>Sets the target view's FITS IWEIGHT keyword equal to CBNR^2.</p>";
   this.updateButton.onClick = function() {
      globalUpdate();
   };
   this.updateButton.hide();

   this.buttonPane.add(this.updateButton);

   this.saveAsButton = new PushButton(this);

   this.saveAsButton.text = "Save As...";
   this.saveAsButton.toolTip = "<p>Save the values in a comma separated value file.</p>";
   this.saveAsButton.onClick = function() {
      globalSaveAs();
   };

   this.buttonPane.add(this.saveAsButton);

   this.supportButton = new PushButton(this);

   this.supportButton.text = "Support";
   this.supportButton.toolTip = "<p>Generates an overlay that identifies local regions of the view measured " +
      "for background noise.</p>" +
      "<p>Pixels within local regions with standard devation above and below the median are " +
      "colored red and blue, respectively. Pixels within both categories of regions on " +
      "different cycle-spins are colored purple.</p>";
   this.supportButton.onClick = function() {
      globalSupport();
   };

   this.buttonPane.add(this.supportButton);

   this.dismissButton = new PushButton(this);

   this.dismissButton.text = "Dismiss";
   this.dismissButton.toolTip = "<p>Dismisses the dialog.</p>";
   this.dismissButton.onClick = function() {
      this.dialog.ok();
   };
   this.dismissButton.defaultButton = true;

   this.buttonPane.add(this.dismissButton);

   this.sizer = new VerticalSizer;

   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add(this.targetPane);
   this.sizer.add(this.settingsPane);
   this.sizer.add(this.resultsPane);
   this.sizer.add(this.buttonPane);

   this.adjustToContents();
   this.setFixedSize();

   parameters.dialog = this;
   globalClear();
}
parametersDialogPrototype.prototype = new Dialog;

function main() {
   console.hide();
   parameters.loadSettings();

   var parametersDialog = new parametersDialogPrototype();
   parametersDialog.execute();

   // Workaround to avoid image window close crash in 1.8 RC7.
   parametersDialog.viewList.currentView = parametersDialog.viewListNullCurrentView;

   parameters.storeSettings();
}

main();

// ****************************************************************************
// EOF ContrastBackgroundNoiseRatio.js - Released 2013/09/02 18:24:46 UTC
