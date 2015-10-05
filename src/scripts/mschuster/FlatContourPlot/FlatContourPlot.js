// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// FlatContourPlot.js - Released 2015/08/06 00:00:00 UTC
// ****************************************************************************
//
// This file is part of FlatContourPlot Script version 1.3
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

#define TITLE "FlatContourPlot"
#define VERSION "1.3"

#feature-id Image Analysis > FlatContourPlot

#feature-info Renders a contour plot of a flat subframe or integration.<br/>\
   <br/>\
   Copyright &copy; 2012-2015 Mike Schuster. All Rights Reserved.<br/>\
   Copyright &copy; 2003-2015 Pleiades Astrophoto S.L. All Rights Reserved.

#include <pjsr/DataType.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/UndoFlag.jsh>

function uniqueViewId(baseId) {
   var id = baseId;
   for (var i = 1; !View.viewById(id).isNull; ++i) {
      id = baseId + format("%02d", i);
   }
   return id;
}

function defaultNullMinMaxValue(value, min, max, def) {
   return value != null && !isNaN(value) && value >= min && value <= max ? value : def;
}

function applyToImageWindowImages(imageWindow, images) {
   imageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);

   imageWindow.mainView.image.fill(1.0);
   for (var i = 0; i != images.length; ++i) {
      imageWindow.mainView.image.selectedPoint = images[i][0];
      imageWindow.mainView.image.apply(images[i][1]);
   }
   imageWindow.mainView.image.resetSelections();

   imageWindow.mainView.endProcess();
}

function parametersPrototype() {
   this.dialog = null;

   this.targetView = null;

   this.resolution = 50;
   this.defResolution = 50;
   this.minResolution = 5;
   this.maxResolution = 100;

   this.contours = 15;
   this.defContours = 15;
   this.minContours = 4;
   this.maxContours = 20;

   this.sigma = 1.0;
   this.defSigma = 1.0;
   this.minSigma = 0.0;
   this.maxSigma = 10.0;

   this.gradient = 50;
   this.defGradient = 50;
   this.minGradient = 0;
   this.maxGradient = 200;

   this.minTone = 0.05;
   this.maxTone = 0.95;

   this.storeSettings = function() {
      Settings.write(
         TITLE + "." + VERSION + "_resolution", DataType_Float, this.resolution
      );

      Settings.write(
         TITLE + "." + VERSION + "_contours", DataType_Int32, this.contours
      );

      Settings.write(
         TITLE + "." + VERSION + "_sigma", DataType_Float, this.sigma
      );

      Settings.write(
         TITLE + "." + VERSION + "_gradient", DataType_Float, this.gradient
      );
   }

   this.loadSettings = function() {
      var value = Settings.read(TITLE + "." + VERSION + "_resolution", DataType_Float);
      this.resolution = defaultNullMinMaxValue(
         value, this.minResolution, this.maxResolution, this.defResolution
      );

      var value = Settings.read(TITLE + "." + VERSION + "_contours", DataType_Int32);
      this.contours = defaultNullMinMaxValue(
         value, this.minContours, this.maxContours, this.defContours
      );

      var value = Settings.read(TITLE + "." + VERSION + "_sigma", DataType_Float);
      this.sigma = defaultNullMinMaxValue(
         value, this.minSigma, this.maxSigma, this.defSigma
      );

      var value = Settings.read(TITLE + "." + VERSION + "_gradient", DataType_Float);
      this.gradient = defaultNullMinMaxValue(
         value, this.minGradient, this.maxGradient, this.defGradient
      );
   }
}
var parameters = new parametersPrototype();

function disable() {
   parameters.dialog.viewList.enabled = false;

   parameters.dialog.resolution.enabled = false;
   parameters.dialog.sigma.enabled = false;
   parameters.dialog.contours.enabled = false;
   parameters.dialog.gradient.enabled = false;

   parameters.dialog.aboutButton.enabled = false;
   parameters.dialog.resetButton.enabled = false;

   parameters.dialog.renderButton.text = "Rendering";
   parameters.dialog.renderButton.enabled = false;
   parameters.dialog.dismissButton.enabled = false;

   parameters.dialog.adjustToContents();
}

function enable() {
   parameters.dialog.viewList.enabled = true;

   parameters.dialog.resolution.enabled = true;
   parameters.dialog.sigma.enabled = true;
   parameters.dialog.contours.enabled = true;
   parameters.dialog.gradient.enabled = true;

   parameters.dialog.aboutButton.enabled = true;
   parameters.dialog.resetButton.enabled = true;

   parameters.dialog.renderButton.text = "Render";
   parameters.dialog.renderButton.enabled =
      parameters.targetView != null && parameters.targetView.isMainView;
   parameters.dialog.dismissButton.enabled = true;
}

function globalClear() {
   enable();
}

function createContourImageWindow(targetImage, fullId) {
   var renderImageWindow = new ImageWindow(
      targetImage.width, targetImage.height, 1, 32, true, false, fullId
   );

   renderImageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);
   renderImageWindow.mainView.image.assign(targetImage);
   renderImageWindow.mainView.endProcess();

   if (parameters.resolution != 100) {
      var image = renderImageWindow.mainView.image;

      var resample = new Resample;

      resample.absoluteMode = Resample.prototype.ForceWidthAndHeight;
      resample.clampingThreshold = 0.3;
      resample.interpolation = Resample.prototype.MitchellNetravaliFilter;
      resample.mode = Resample.prototype.AbsolutePixels;
      resample.xSize = Math.round(0.01 * parameters.resolution * image.width);
      resample.ySize = Math.round(0.01 * parameters.resolution * image.height);

      resample.executeOn(renderImageWindow.mainView, false);
   }

   {
      var image = renderImageWindow.mainView.image;

      var startTime = new Date;
      console.writeln();
      console.writeln("<b>PercentileClip</b>: Processing view: ", renderImageWindow.mainView.fullId);

      var data = new Array();
      image.getSamples(data);
      data.sort();

      var endTime = new Date;
      console.writeln(format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime())));

      var minQuantile = data[Math.round(0.01 * data.length)];
      var maxQuantile = data[Math.round(0.99 * data.length)];

      if (image.width < 128 || image.height < 128 || maxQuantile == minQuantile) {
         renderImageWindow.close();
         return {
            window: null,
            minQuantile: minQuantile,
            maxQuantile: maxQuantile
         };
      }

      var pixelMath = new PixelMath;

      pixelMath.expression = format(
         "($target - %f) / %f",
         minQuantile, maxQuantile - minQuantile
      );
      pixelMath.rescale = false;
      pixelMath.truncate = true;
      pixelMath.truncateLower = 0.0;
      pixelMath.truncateUpper = 1.0;
      pixelMath.useSingleExpression = true;

      pixelMath.executeOn(renderImageWindow.mainView, false);
   }

   if (parameters.sigma != 0.0) {
      var convolution = new Convolution;

      convolution.aspectRatio = 1.0;
      convolution.mode = Convolution.prototype.Parametric;
      convolution.shape = 2.0;
      convolution.sigma = parameters.sigma;

      convolution.executeOn(renderImageWindow.mainView, false);
   }

   {
      var pixelMath = new PixelMath;

      pixelMath.expression = format(
         "round(255 * (floor(%f * $target + 0.5) / %f * %f + %f)) / 255",
         parameters.contours, parameters.contours,
         parameters.maxTone - parameters.minTone, parameters.minTone
      );
      pixelMath.rescale = false;
      pixelMath.truncate = true;
      pixelMath.truncateLower = 0.0;
      pixelMath.truncateUpper = 1.0;
      pixelMath.useSingleExpression = true;

      pixelMath.executeOn(renderImageWindow.mainView, false);
   }

   {
      var image = renderImageWindow.mainView.image;

      var startTime = new Date;
      console.writeln();
      console.writeln("<b>GradientFilter</b>: Processing view: ", renderImageWindow.mainView.fullId);

      var gradientX = new Image(image);
      // First derivative in x of discrete Bessel approximation of Gaussian, sigma = 0.5
      // Mathematica: GaussianMatrix[{1, 0.5}, {1, 0}]
      var gradientXFilter = [
         0.0496902, 0.40062, 0.0496902,
         0.0, 0.0, 0.0,
         -0.0496902, -0.40062, -0.0496902
      ];
      gradientX.convolve(new Matrix(gradientXFilter, 3, 3), 2);

      var gradientY = new Image(image);
      // First derivative in y of discrete Bessel approximation of Gaussian, sigma = 0.5
      // Mathematica: GaussianMatrix[{1, 0.5}, {0, 1}]
      var gradientYFilter = [
         0.0496902, 0.0, -0.0496902,
         0.40062, 0.0, -0.40062,
         0.0496902, 0.0, -0.0496902
      ];
      gradientY.convolve(new Matrix(gradientYFilter, 3, 3), 2);

      var gradient = new Image(image);
      gradient.initSampleIterator();
      gradientX.initSampleIterator();
      gradientY.initSampleIterator();
      for (var y = 0; y != gradient.height; ++y) {
         for (var x = 0; x != gradient.width; ++x) {
            var gx = gradientX.sampleValue();
            var gy = gradientY.sampleValue();
            gradient.setSampleValue(Math.sqrt(gx * gx + gy * gy));
            gradient.nextSample();
            gradientX.nextSample();
            gradientY.nextSample();
         }
      }
      gradient.rescale();

      var gradientImageWindow = new ImageWindow(
         gradient.width, gradient.height, 1, 32, true, false,
         uniqueViewId(parameters.targetView.fullId + "_gradient")
      );

      gradientImageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);
      gradientImageWindow.mainView.image.assign(gradient);
      gradientImageWindow.mainView.endProcess();

      var endTime = new Date;
      console.writeln(format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime())));
   }

   {
      var pixelMath = new PixelMath;

      pixelMath.expression = format(
         "$target * (1 - %f * ",
         0.01 * parameters.gradient
      ) + gradientImageWindow.mainView.fullId + ")";
      pixelMath.rescale = false;
      pixelMath.truncate = true;
      pixelMath.truncateLower = 0.0;
      pixelMath.truncateUpper = 1.0;
      pixelMath.useSingleExpression = true;

      pixelMath.executeOn(renderImageWindow.mainView, false);
   }

   gradientImageWindow.close();

   return {
      window: renderImageWindow,
      minQuantile: minQuantile,
      maxQuantile: maxQuantile
   };
}

function createLegendImageWindow(contourImage, fullId, minQuantile, maxQuantile) {
   var swatchWidth = 48;
   var textOffset = swatchWidth + 8;
   var digits = 3 + Math.floor(-Math.log10(maxQuantile));
   var legendWidth = textOffset +
      (new Graphics()).font.width("0.") + digits * (new Graphics()).font.width("0") + 8;
   var legendHeight = contourImage.height;
   var textFormat = format("%%.%df", digits);

   var renderImageWindow = new ImageWindow(
      legendWidth, legendHeight, 1, 32, true, false, fullId
   );
   var image = renderImageWindow.mainView.image;

   var bitmap = new Bitmap(
      renderImageWindow.mainView.image.width,
      renderImageWindow.mainView.image.height
   );
   bitmap.fill(0xffffffff);
   var graphics = new Graphics(bitmap);

   for (var i = 0; i != parameters.contours + 1; ++i) {
      graphics.pen = new Pen();
      graphics.drawText(
         textOffset,
         Math.round(
            legendHeight * ((parameters.contours - i + 0.5) / (parameters.contours + 1)) +
            0.5 * graphics.font.pointSize
         ),
         format(textFormat, minQuantile + (maxQuantile - minQuantile) * (i / parameters.contours))
      );

      var tone = Math.round(
            255 * ((i / parameters.contours) * (parameters.maxTone - parameters.minTone) + parameters.minTone)
      );
      graphics.fillRect(
         new Rect(
            0,
            Math.round(legendHeight * ((parameters.contours - i + 0.0) / (parameters.contours + 1))),
            swatchWidth,
            Math.round(legendHeight * ((parameters.contours - i + 1.0) / (parameters.contours + 1)))
         ),
         new Brush(0xff000000 + (tone << 16) + (tone << 8) + (tone))
      );

      graphics.pen = new Pen(0x60000000);
      graphics.drawLine(
         0,
         Math.round(legendHeight * ((parameters.contours - i + 1.0) / (parameters.contours + 1))),
         swatchWidth - 1,
         Math.round(legendHeight * ((parameters.contours - i + 1.0) / (parameters.contours + 1)))
      )
   }
   graphics.end();

   renderImageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);
   renderImageWindow.mainView.image.blend(bitmap);
   renderImageWindow.mainView.endProcess();

   return renderImageWindow;
}

function globalRender() {
   disable();

   if (parameters.targetView == null || !parameters.targetView.isMainView) {
      enable();
      return false;
   }

   var image = parameters.targetView.image;
   if (!image.isGrayscale) {
      enable();
      (new MessageBox(
         "<p>Error: Target view color space must be grayscale.</p>",
         TITLE,
         StdIcon_Warning,
         StdButton_Ok
      )).execute();
      return false;
   }

   console.show();

   var contourImageWindow = createContourImageWindow(
      parameters.targetView.image,
      uniqueViewId(parameters.targetView.fullId + "_contour")
   );
   if (contourImageWindow.window == null) {
      console.hide();
      enable();
      (new MessageBox(
         "<p>Error: Resampled view is too small or has insufficient dynamic range.</p>",
         TITLE,
         StdIcon_Warning,
         StdButton_Ok
      )).execute();
      return false;
   }

   var legendImageWindow = createLegendImageWindow(
      contourImageWindow.window.mainView.image,
      uniqueViewId(parameters.targetView.fullId + "_legend"),
      contourImageWindow.minQuantile,
      contourImageWindow.maxQuantile
   );

   var spacing = 10;
   var renderImageWindow = new ImageWindow(
      contourImageWindow.window.mainView.image.width +
         spacing +
         legendImageWindow.mainView.image.width,
      contourImageWindow.window.mainView.image.height,
      1, 32, true, false, uniqueViewId(parameters.targetView.fullId + "_contourPlot")
   );

   applyToImageWindowImages(
      renderImageWindow,
      [
         [new Point(0, 0), contourImageWindow.window.mainView.image],
         [new Point(contourImageWindow.window.mainView.image.width + spacing, 0), legendImageWindow.mainView.image],
      ]
   );

   contourImageWindow.window.close();
   legendImageWindow.close();

   renderImageWindow.zoomToOptimalFit();
   renderImageWindow.show();

   console.hide();
   enable();

   return true;
}

function globalReset() {
   parameters.resolution = parameters.defResolution;
   parameters.sigma = parameters.defSigma;
   parameters.contours = parameters.defContours;
   parameters.gradient = parameters.defGradient;

   parameters.dialog.resolution.text = format("%.0f", parameters.resolution);
   parameters.dialog.sigma.text = format("%.1f", parameters.sigma);
   parameters.dialog.contours.text = format("%.0f", parameters.contours);
   parameters.dialog.gradient.text = format("%.0f", parameters.gradient);
}

function parametersDialogPrototype() {
   this.__base__ = Dialog;
   this.__base__();

   this.onEditCompletedActive = false;

   this.windowTitle = TITLE;

   this.targetPane = new HorizontalSizer;

   this.viewList = new ViewList(this);
   this.viewListNullCurrentView = this.viewList.currentView;

   this.viewList.getMainViews();
   if (ImageWindow.activeWindow.currentView.isMainView) {
      parameters.targetView = ImageWindow.activeWindow.currentView;
      this.viewList.currentView = parameters.targetView;
   }
   this.viewList.toolTip = "<p>The view targeted for rendering.</p>";
   this.viewList.onViewSelected = function(view) {
      parameters.targetView = view;
      globalClear();
   }

   this.targetPane.add(this.viewList);

   this.settingsPane = new VerticalSizer;

   this.settingsPane.spacing = 6;

   var alignmentWidth = this.font.width("Resolution:" + "M");

   this.resolutionPane = new HorizontalSizer;

   this.resolutionPane.spacing = 6;

   this.resolutionLabel = new Label(this);

   this.resolutionLabel.setFixedWidth(alignmentWidth);
   this.resolutionLabel.text = "Resolution:";
   this.resolutionLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.resolutionLabel.toolTip =
      "<p>The pixel dimensions of the contour plot, as a percentage of the target view.</p>";

   this.resolutionPane.add(this.resolutionLabel);

   this.resolution = new Edit(this);

   this.resolution.setFixedWidth(this.font.width("-0000.00"));
   this.resolution.text = format("%.0f", parameters.resolution);
   this.resolution.toolTip = this.resolutionLabel.toolTip;
   this.resolution.onEditCompleted = function() {
      // workaround for recursive onEditCompleted
      if (this.dialog.onEditCompletedActive) {
         return;
      }
      this.dialog.onEditCompletedActive = true;
      var value = Math.round(parseFloat(this.text));
      if (
         isNaN(value) ||
         value < parameters.minResolution ||
         value > parameters.maxResolution
      ) {
         (new MessageBox(
            "<p>Invalid resolution value.</p>",
            TITLE,
            StdIcon_Error,
            StdButton_Ok
         )).execute();
      }
      else if (parameters.resolution != value) {
         parameters.resolution = value;
         globalClear();
      }
      this.text = format("%.0f", parameters.resolution);
      this.dialog.onEditCompletedActive = false;
   };

   this.resolutionPane.add(this.resolution);

   this.resolutionUnit = new Label(this);

   this.resolutionUnit.text = "%";
   this.resolutionUnit.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.resolutionPane.add(this.resolutionUnit);
   this.resolutionPane.addStretch();

   this.settingsPane.add(this.resolutionPane);

   this.sigmaPane = new HorizontalSizer;

   this.sigmaPane.spacing = 6;

   this.sigmaLabel = new Label(this);

   this.sigmaLabel.setFixedWidth(alignmentWidth);
   this.sigmaLabel.text = "Sigma:";
   this.sigmaLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.sigmaLabel.toolTip =
      "<p>Standard deviation of a gaussian filter applied to reduce noise.</p>" +
      "<p>Subexposures typically require slightly larger sigmas than integrations.</p>";

   this.sigmaPane.add(this.sigmaLabel);

   this.sigma = new Edit(this);

   this.sigma.setFixedWidth(this.font.width("-0000.00"));
   this.sigma.text = format("%.1f", parameters.sigma);
   this.sigma.toolTip = this.sigmaLabel.toolTip;
   this.sigma.onEditCompleted = function() {
      // workaround for recursive onEditCompleted
      if (this.dialog.onEditCompletedActive) {
         return;
      }
      this.dialog.onEditCompletedActive = true;
      var value = parseFloat(this.text);
      if (
         isNaN(value) ||
         value < parameters.minSigma ||
         value > parameters.maxSigma
      ) {
         (new MessageBox(
            "<p>Invalid sigma value.</p>",
            TITLE,
            StdIcon_Error,
            StdButton_Ok
         )).execute();
      }
      else if (parameters.sigma != value) {
         parameters.sigma = value;
         globalClear();
      }
      this.text = format("%.1f", parameters.sigma);
      this.dialog.onEditCompletedActive = false;
   };

   this.sigmaPane.add(this.sigma);

   this.sigmaUnit = new Label(this);

   this.sigmaUnit.text = "px";
   this.sigmaUnit.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.sigmaPane.add(this.sigmaUnit);
   this.sigmaPane.addStretch();

   this.settingsPane.add(this.sigmaPane);

   this.contoursPane = new HorizontalSizer;

   this.contoursPane.spacing = 6;

   this.contoursLabel = new Label(this);

   this.contoursLabel.setFixedWidth(alignmentWidth);
   this.contoursLabel.text = "Contours:";
   this.contoursLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.contoursLabel.toolTip =
      "<p>How many contours to use.</p>";

   this.contoursPane.add(this.contoursLabel);

   this.contours = new Edit(this);

   this.contours.setFixedWidth(this.font.width("-0000.00"));
   this.contours.text = format("%.0f", parameters.contours);
   this.contours.toolTip = this.contoursLabel.toolTip;
   this.contours.onEditCompleted = function() {
      // workaround for recursive onEditCompleted
      if (this.dialog.onEditCompletedActive) {
         return;
      }
      this.dialog.onEditCompletedActive = true;
      var value = Math.round(parseFloat(this.text));
      if (
         isNaN(value) ||
         value < parameters.minContours ||
         value > parameters.maxContours
      ) {
         (new MessageBox(
            "<p>Invalid contours value.</p>",
            TITLE,
            StdIcon_Error,
            StdButton_Ok
         )).execute();
      }
      else if (parameters.contours != value) {
         parameters.contours = value;
         globalClear();
      }
      this.text = format("%.0f", parameters.contours);
      this.dialog.onEditCompletedActive = false;
   };

   this.contoursPane.add(this.contours);
   this.contoursPane.addStretch();

   this.settingsPane.add(this.contoursPane);

   this.gradientPane = new HorizontalSizer;

   this.gradientPane.spacing = 6;

   this.gradientLabel = new Label(this);

   this.gradientLabel.setFixedWidth(alignmentWidth);
   this.gradientLabel.text = "Gradient:";
   this.gradientLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.gradientLabel.toolTip =
      "<p>Amount of contour boundary emphasis, as a percentage of a gradient filter response.</p>" +
      "<p>Increase to darken the boundaries, decrease to lighten them.</p>";

   this.gradientPane.add(this.gradientLabel);

   this.gradient = new Edit(this);

   this.gradient.setFixedWidth(this.font.width("-0000.00"));
   this.gradient.text = format("%.0f", parameters.gradient);
   this.gradient.toolTip = this.gradientLabel.toolTip;
   this.gradient.onEditCompleted = function() {
      // workaround for recursive onEditCompleted
      if (this.dialog.onEditCompletedActive) {
         return;
      }
      this.dialog.onEditCompletedActive = true;
      var value = Math.round(parseFloat(this.text));
      if (
         isNaN(value) ||
         value < parameters.minGradient ||
         value > parameters.maxGradient
      ) {
         (new MessageBox(
            "<p>Invalid gradient value.</p>",
            TITLE,
            StdIcon_Error,
            StdButton_Ok
         )).execute();
      }
      else if (parameters.gradient != value) {
         parameters.gradient = value;
         globalClear();
      }
      this.text = format("%.0f", parameters.gradient);
      this.dialog.onEditCompletedActive = false;
   };

   this.gradientPane.add(this.gradient);

   this.gradientUnit = new Label(this);

   this.gradientUnit.text = "%";
   this.gradientUnit.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.gradientPane.add(this.gradientUnit);
   this.gradientPane.addStretch();

   this.settingsPane.add(this.gradientPane);

   this.buttonPane = new HorizontalSizer;

   this.buttonPane.spacing = 6;

   this.aboutButton = new ToolButton(this);
   this.aboutButton.icon = this.scaledResource( ":/icons/comment.png" );
   this.aboutButton.setScaledFixedSize( 20, 20 );
   this.aboutButton.toolTip =
      "<p>FlatContourPlot Version " + VERSION + "</p>" +
      "<p>Renders a contour plot of a flat subframe or integration.</p>" +
      "<p>Preprocessing includes resampling, clipping to the 1st and 99th percentiles, noise reduction and a rescale.</p>" +
      "<p>Copyright &copy; 2012-2015 Mike Schuster. All Rights Reserved.<br/>" +
      "Copyright &copy; 2003-2015 Pleiades Astrophoto S.L. All Rights Reserved.</p>";
   this.aboutButton.onClick = function() {
   };

   this.buttonPane.add(this.aboutButton);

   this.resetButton = new ToolButton(this);
   this.resetButton.icon = this.scaledResource( ":/process-interface/reset.png" );
   this.resetButton.setScaledFixedSize( 20, 20 );
   this.resetButton.toolTip =
      "<p>Resets all settings to default values.</p>";
   this.resetButton.onClick = function() {
      globalReset();
   };

   this.buttonPane.add(this.resetButton);

   this.versionLabel = new Label(this);
   this.versionLabel.text = "Version " + VERSION;
   this.versionLabel.toolTip =
      "<p>FlatContourPlot Version " + VERSION + "</p>" +
      "<p>Renders a contour plot of a flat subframe or integration.</p>" +
      "<p>Preprocessing includes resampling, clipping to the 1st and 99th percentiles, noise reduction and a rescale.</p>" +
      "<p>Copyright &copy; 2012-2015 Mike Schuster. All Rights Reserved.<br/>" +
      "Copyright &copy; 2003-2015 Pleiades Astrophoto S.L. All Rights Reserved.</p>";
   this.versionLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;

   this.buttonPane.add(this.versionLabel);
   this.buttonPane.addStretch();

   this.renderButton = new PushButton(this);

   this.renderButton.defaultButton = true;
   this.renderButton.text = "Render";
   this.renderButton.toolTip = "<p>Renders the target view.</p>";
   this.renderButton.onClick = function() {
      if (globalRender()) {
         this.dialog.ok();
      }
   };

   this.buttonPane.add(this.renderButton);

   this.dismissButton = new PushButton(this);

   this.dismissButton.text = "Dismiss";
   this.dismissButton.toolTip = "<p>Dismisses the dialog.</p>";
   this.dismissButton.onClick = function() {
      this.dialog.ok();
   };

   this.buttonPane.add(this.dismissButton);

   this.sizer = new VerticalSizer;

   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add(this.targetPane);
   this.sizer.add(this.settingsPane);
   this.sizer.add(this.buttonPane);

   this.setFixedWidth(this.displayPixelRatio * 356);
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
// EOF FlatContourPlot.js - Released 2015/08/06 00:00:00 UTC
