// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// MainViewController.js - Released 2015/11/20 00:00:00 UTC
// ****************************************************************************
//
// This file is part of MureDenoise Script Version 1.11
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

function MainController(model) {
   this.view = null;

   this.setView = function(view) {
      this.view = view;
   };

   this.setImageView = function(view) {
      if (view.isView) {
         model.imageView = view;
         this.view.imageViewList.currentView = model.imageView;
         this.enableControls();
         this.checkImageView();
      }
   };

   this.checkImageView = function() {
      var message = null;
      if (
         model.imageView != null &&
         model.imageView.isView &&
         !(model.imageView.image.numberOfChannels == 1)
      ) {
         message = "<p><b>Warning</b>: A monochannel image must be " +
            "selected for denoising.</p>";
      }
      else if (
         model.imageView != null &&
         model.imageView.isView &&
         !(model.imageSizeMinimum <= Math.min(
            model.imageView.image.width, model.imageView.image.height
         ))
      ) {
         message = "<p><b>Warning</b>: The size of the selected image must " +
            "be at least " +
            format("%d ", model.imageSizeMinimum) +
            "pixels in width and height.</p>";
      }
      else if (
         model.imageView != null &&
         model.imageView.isView &&
         model.flatfieldView != null &&
         model.flatfieldView.isView &&
         !(
            model.imageView.image.width == model.flatfieldView.image.width &&
            model.imageView.image.height == model.flatfieldView.image.height
         )
      ) {
         message = "<p><b>Warning</b>: The sizes of the image selected for " +
            "denoising and the flatfield must be equal.";
      }
      if (message != null) {
         (new MessageBox(
            message, TITLE, StdIcon_Warning, StdButton_Ok
         )).execute();
      }
   };

   this.checkFlatfieldView = function() {
      var message = null;
      if (
         model.flatfieldView != null &&
         model.flatfieldView.isView &&
         !(model.flatfieldView.image.numberOfChannels == 1)
      ) {
         message = "<p><b>Warning</b>: A monochannel image must be " +
            "selected for a flatfield.</p>";
      }
      else if (
         model.flatfieldView != null &&
         model.flatfieldView.isView &&
         !(model.flatfieldSizeMinimum <= Math.min(
            model.flatfieldView.image.width, model.flatfieldView.image.height
         ))
      ) {
         message = "<p><b>Warning</b>: The size of the flatfield image must " +
            "be at least " +
            format("%d ", model.flatfieldSizeMinimum) +
            "pixels in width and height.</p>";
      }
      else if (
         model.imageView != null &&
         model.imageView.isView &&
         model.flatfieldView != null &&
         model.flatfieldView.isView &&
         !(
            model.imageView.image.width == model.flatfieldView.image.width &&
            model.imageView.image.height == model.flatfieldView.image.height
         )
      ) {
         message = "<p><b>Warning</b>: The sizes of the image selected for " +
            "denoising and the flatfield must be equal.";
      }
      if (message != null) {
         (new MessageBox(
            message, TITLE, StdIcon_Warning, StdButton_Ok
         )).execute();
      }
   };

   this.execute = function() {
      this.enableControls();
      this.view.execute();
   };

   this.reset = function() {
      model.imageView = null;
      this.view.imageViewList.currentView = this.view.imageViewListNull;

      model.imageCombinationCount = model.imageCombinationCountDefault;
      this.view.imageCombinationCountEdit.text = format(
         model.imageCombinationCountFormat,
         model.imageCombinationCount
      );
      model.imageInterpolationMethod = model.imageInterpolationMethodDefault;
      this.view.imageInterpolationMethodComboBox.currentItem =
         model.imageInterpolationMethod;

      model.flatfieldView = null;
      this.view.flatfieldViewList.currentView = this.view.flatfieldViewListNull;

      model.detectorGain = model.detectorGainDefault;
      this.view.detectorGainEdit.text = format(
         model.detectorGainFormat,
         model.detectorGain
      );
      model.detectorGaussianNoise = model.detectorGaussianNoiseDefault;
      this.view.detectorGaussianNoiseEdit.text = format(
         model.detectorGaussianNoiseFormat,
         model.detectorGaussianNoise
      );
      model.detectorOffset = model.detectorOffsetDefault;
      this.view.detectorOffsetEdit.text = format(
         model.detectorOffsetFormat,
         model.detectorOffset
      );

      model.denoiseVarianceScale = model.denoiseVarianceScaleDefault;
      this.view.denoiseVarianceScaleEdit.text = format(
         model.denoiseVarianceScaleFormat,
         model.denoiseVarianceScale
      );
      model.denoiseCycleSpinCount = model.denoiseCycleSpinCountDefault;
      this.view.denoiseCycleSpinCountEdit.text = format(
         model.denoiseCycleSpinCountFormat,
         model.denoiseCycleSpinCount
      );
      model.generateMethodNoiseImage = model.generateMethodNoiseImageDefault;
      this.view.generateMethodNoiseImageCheckBox.checked =
         model.generateMethodNoiseImage;

      this.enableControls();
   };

   this.disableControls = function() {
      this.view.imageViewList.enabled = false;

      this.view.imageCombinationCountEdit.enabled = false;
      this.view.imageInterpolationMethodComboBox.enabled = false;

      this.view.flatfieldViewList.enabled = false;

      this.view.detectorGainEdit.enabled = false;
      this.view.detectorGaussianNoiseEdit.enabled = false;
      this.view.detectorOffsetEdit.enabled = false;

      this.view.denoiseVarianceScaleEdit.enabled = false;
      this.view.loadVarianceScaleButton.enabled = false;
      this.view.denoiseCycleSpinCountEdit.enabled = false;
      this.view.generateMethodNoiseImageCheckBox.enabled = false;

      this.view.newInstanceButton.enabled = false;
      this.view.browseDocumentationButton.enabled = false;
      this.view.resetButton.enabled = false;

      this.view.denoiseButton.enabled = false;
   };

   this.enableControls = function() {
      this.view.imageViewList.enabled = true;

      this.view.imageCombinationCountEdit.enabled = true;
      this.view.imageInterpolationMethodComboBox.enabled =
         model.imageCombinationCount != 1;

      this.view.flatfieldViewList.enabled = true;

      this.view.detectorGainEdit.enabled = true;
      this.view.detectorGaussianNoiseEdit.enabled = true;
      this.view.detectorOffsetEdit.enabled = true;

      this.view.denoiseVarianceScaleEdit.enabled = true;
      this.view.loadVarianceScaleButton.enabled = true;
      this.view.denoiseCycleSpinCountEdit.enabled = true;
      this.view.generateMethodNoiseImageCheckBox.enabled = true;

      this.view.newInstanceButton.enabled = true;
      this.view.browseDocumentationButton.enabled = true;
      this.view.resetButton.enabled = true;

      this.view.denoiseButton.enabled =
         model.detectorGain != 0 &&
         model.detectorGaussianNoise != 0 &&
         model.imageView != null &&
         model.imageView.isView &&
         model.imageView.image.numberOfChannels == 1 &&
         model.imageSizeMinimum <= Math.min(
            model.imageView.image.width, model.imageView.image.height
         ) && (
            model.flatfieldView == null ||
            !model.flatfieldView.isView || (
               model.flatfieldView.image.numberOfChannels == 1 &&
               model.flatfieldSizeMinimum <= Math.min(
                  model.flatfieldView.image.width,
                  model.flatfieldView.image.height
               ) &&
               model.imageView.image.width ==
                  model.flatfieldView.image.width &&
               model.imageView.image.height ==
                  model.flatfieldView.image.height
            )
         );
   };

   this.imageViewOnViewSelected = function(view) {
      model.imageView = view;
      this.enableControls();
      this.checkImageView();
   };

   this.imageCombinationCountOnTextUpdated = function(text) {
      model.imageCombinationCount = model.defaultNumeric(
         parseInt(text),
         model.imageCombinationCountMinimum,
         model.imageCombinationCountMaximum,
         model.imageCombinationCountDefault
      );
      this.enableControls();
   };

   this.imageInterpolationMethodOnItemSelected = function(item) {
      model.imageInterpolationMethod = item;
      this.enableControls();
   };

   this.flatfieldViewOnViewSelected = function(view) {
      model.flatfieldView = view;
      this.enableControls();
      this.checkFlatfieldView();
   };

   this.detectorGainOnTextUpdated = function(text) {
      model.detectorGain = model.defaultNumeric(
         parseFloat(text),
         model.detectorGainMinimum,
         model.detectorGainMaximum,
         model.detectorGainDefault
      );
      this.enableControls();
   };

   this.detectorGaussianNoiseOnTextUpdated = function(text) {
      model.detectorGaussianNoise = model.defaultNumeric(
         parseFloat(text),
         model.detectorGaussianNoiseMinimum,
         model.detectorGaussianNoiseMaximum,
         model.detectorGaussianNoiseDefault
      );
      this.enableControls();
   };

   this.detectorOffsetOnTextUpdated = function(text) {
      model.detectorOffset = model.defaultNumeric(
         parseFloat(text),
         model.detectorOffsetMinimum,
         model.detectorOffsetMaximum,
         model.detectorOffsetDefault
      );
      this.enableControls();
   };

   this.denoiseVarianceScaleOnTextUpdated = function(text) {
      model.denoiseVarianceScale = model.defaultNumeric(
         parseFloat(text),
         model.denoiseVarianceScaleMinimum,
         model.denoiseVarianceScaleMaximum,
         model.denoiseVarianceScaleDefault
      );
      this.enableControls();
   };

   this.loadVarianceScale = function() {
      var openFileDialog = new OpenFileDialog;
      openFileDialog.multipleSelections = false;
      openFileDialog.caption = "Select ImageIntegration process log file";
      openFileDialog.filters = [
         ["Plain text files", ".txt"]
      ];

      if (openFileDialog.execute() && openFileDialog.fileNames.length == 1) {
         try {
            var lines = File.readLines(openFileDialog.fileNames[0]);

            var scaleFactors = [];
            var zeroOffsets = [];
            var weights = [];
            var outputNormalization = null;
            var weightingMode = null;
            for (var i = 0; i != lines.length; ++i) {
               var line = lines[i];

               var prefix = /^Scale factors *: */;
               if (line.search(prefix) >= 0) {
                  scaleFactors.push(parseFloat(line.replace(prefix, "")));
               }

               var prefix = /^Zero offset *: */;
               if (line.search(prefix) >= 0) {
                  zeroOffsets.push(parseFloat(line.replace(prefix, "")));
               }

               var prefix = /^Weight *: */;
               if (line.search(prefix) >= 0) {
                  weights.push(parseFloat(line.replace(prefix, "")));
               }

               var prefix = /^Output normalization \.* /;
               if (line.search(prefix) >= 0) {
                  outputNormalization = line.replace(prefix, "").trim();
               }

               var prefix = /^Weighting mode \.* /;
               if (line.search(prefix) >= 0) {
                  weightingMode = line.replace(prefix, "").trim();
               }
            }

            var imageCombinationCount = scaleFactors.length;
            if (
               imageCombinationCount != zeroOffsets.length ||
               imageCombinationCount != weights.length ||
               imageCombinationCount == 0
            ) {
               throw new Error(
                  "Can't load variance scale, the log file appears incomplete."
               );
            }

            if (
               outputNormalization != null &&
               outputNormalization != "additive + scaling"
            ) {
               for (var i = 0; i != imageCombinationCount; ++i) {
                  scaleFactors[i] = 1;
                  zeroOffsets[i] = 1;
               }
            }
            if (
               weightingMode != null &&
               weightingMode != "noise evaluation"
            ) {
               for (var i = 0; i != imageCombinationCount; ++i) {
                  weights[i] = 1;
               }
            }

            var denoiseVarianceScale = 0;
            var denoiseOffsetCounterpoise = 0;
            var sumWeights = 0
            for (var i = 0; i != imageCombinationCount; ++i) {
               sumWeights += weights[i];
            }
            for (var i = 0; i != imageCombinationCount; ++i) {
               var weight =  weights[i] * scaleFactors[i] / sumWeights;
               denoiseVarianceScale += weight * weight;
               denoiseOffsetCounterpoise += weight * zeroOffsets[i];
            }
            denoiseVarianceScale *= imageCombinationCount;
            denoiseOffsetCounterpoise *= 65535;

            model.denoiseVarianceScale = model.defaultNumeric(
               denoiseVarianceScale,
               model.denoiseVarianceScaleMinimum,
               model.denoiseVarianceScaleMaximum,
               model.denoiseVarianceScaleDefault
            );
            this.view.denoiseVarianceScaleEdit.text = format(
               model.denoiseVarianceScaleFormat,
               model.denoiseVarianceScale
            );

            (new MessageBox(
               "<p>Variance scale of " +
               format(
                  model.denoiseVarianceScaleFormat,
                  model.denoiseVarianceScale
               ) +
               " for a combination of " +
               format(
                  model.imageCombinationCountFormat, imageCombinationCount
               ) +
               " images loaded.<p>",
               TITLE,
               StdIcon_Information,
               StdButton_Ok
            )).execute();
         }
         catch (exception) {
            console.criticalln(exception.message);
            (new MessageBox(
               "<p><b>Error</b>: " + exception.message + "</p>" +
               "<p>Load variance scale aborted.</p>",
               TITLE,
               StdIcon_Error,
               StdButton_Ok
            )).execute();
         }
      }
      this.enableControls();
   };

   this.denoiseCycleSpinCountOnTextUpdated = function(text) {
      model.denoiseCycleSpinCount = model.defaultNumeric(
         parseInt(text),
         model.denoiseCycleSpinCountMinimum,
         model.denoiseCycleSpinCountMaximum,
         model.denoiseCycleSpinCountDefault
      );
      this.enableControls();
   };

   this.generateMethodNoiseImageOnCheck = function(checked) {
      model.generateMethodNoiseImage = checked;
      this.enableControls();
   };

   this.logParameters = function() {
      console.writeln();
      console.writeln("<b>Parameters:</b>");

      console.writeln(format(
         "Image: " + model.imageViewFormat,
         model.imageView.fullId
      ));

      console.writeln(format(
         "Image combination count: " + model.imageCombinationCountFormat,
         model.imageCombinationCount
      ));
      if (model.imageCombinationCount != 1) {
         console.writeln(format(
            "Image interpolation method: " +
            model.imageInterpolationMethodFormat,
            model.imageInterpolationMethodNames[model.imageInterpolationMethod]
         ));
      }

      if (model.flatfieldView != null && model.flatfieldView.isView) {
         console.writeln(format(
            "Flatfield: " + model.flatfieldViewFormat,
            model.flatfieldView.fullId
         ));
      }

      console.writeln(format(
         "Detector gain: " + model.detectorGainFormat +
         " " + model.detectorGainUnits,
         model.detectorGain
      ));
      console.writeln(format(
         "Detector Gaussian noise: " + model.detectorGaussianNoiseFormat +
         " " + model.detectorGaussianNoiseUnits,
         model.detectorGaussianNoise
      ));
      console.writeln(format(
         "Detector offset: " + model.detectorOffsetFormat +
         " " + model.detectorOffsetUnits,
         model.detectorOffset
      ));

      console.writeln(format(
         "Denoise variance scale: " + model.denoiseVarianceScaleFormat,
         model.denoiseVarianceScale
      ));
      console.writeln(format(
         "Denoise cycle-spin count: " + model.denoiseCycleSpinCountFormat,
         model.denoiseCycleSpinCount
      ));
      console.writeln(format(
         "Generate method noise image: " +
         (model.generateMethodNoiseImage ? "true" : "false")
      ));

      console.flush();
   };

   this.denoise = function() {
      this.disableControls();
      this.view.enableAbort();
      console.show();
      if (false) {
         console.writeln();
         console.writeln("FrameMatrix count: ", globalFrameMatrixCount);
      }
      console.flush();

      console.beginLog();
      console.writeln();
      console.writeln("<b>" + TITLE + " Version " + VERSION + "</b>");
      console.flush();

      try {
         this.logParameters();

         var time = -(new Date()).getTime();

         (new MureEstimator(model, this.view)).denoise();

         time += (new Date()).getTime();
         console.writeln(format("%.03f s", 0.001 * time));
         console.flush();
      }
      catch (exception) {
         console.criticalln(exception.message);
         if (!(new RegExp("^abort")).test(exception.message)) {
            (new MessageBox(
               "<p><b>Error</b>: " + exception.message + "</p>" +
               "<p>Estimation aborted.</p>",
               TITLE,
               StdIcon_Error,
               StdButton_Ok
            )).execute();
         }
      }

      if (false) {
         console.writeln();
         console.writeln("FrameMatrix count: ", globalFrameMatrixCount);
      }
      console.flush();
      console.hide();
      gc();
      this.view.disableAbort();
      this.enableControls();
   };

   this.dismiss = function() {
      this.view.ok();
   };

   this.newInstance = function() {
      model.storeParameters();
   };

   this.browseDocumentation = function() {
      if (!Dialog.browseScriptDocumentation(TITLE)) {
         (new MessageBox(
            "<p>Documentation has not been installed.</p>",
            TITLE,
            StdIcon_Warning,
            StdButton_Ok
         )).execute();
      }
   };
}

function MainView(model, controller) {
   this.__base__ = Dialog;
   this.__base__();

   this.abortEnabled = false;
   this.abortRequested = false;

   this.enableAbort = function() {
      this.abortEnabled = true;
      this.abortRequested = false;
      this.dismissAbortButton.text =
         "Abort";
      this.dismissAbortButton.toolTip =
         "<p>Abort the denoising.</p>";
   };

   this.disableAbort = function () {
      this.abortEnabled = false;
      this.abortRequested = false;
      this.dismissAbortButton.text =
         "Dismiss";
      this.dismissAbortButton.toolTip =
         "<p>Dismiss the dialog.</p>";
   };

   this.throwAbort = function() {
      processEvents();
      if (this.abortEnabled && this.abortRequested) {
         throw new Error("abort");
      }
   };

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

   this.addViewList = function(pane, onViewSelected) {
      var viewList = new ViewList(this);
      pane.add(viewList);

      viewList.getAll();
      viewList.onViewSelected = onViewSelected;

      return viewList;
   }

   this.addLabel = function(pane, text, toolTip) {
      var label = new Label(this);
      pane.add(label);

      label.setFixedWidth(this.labelWidth);
      label.text = text;
      label.toolTip = toolTip;
      label.textAlignment = TextAlign_Right | TextAlign_VertCenter;

      return label;
   };

   this.addEdit = function(
      pane, text, toolTip, onTextUpdated, onEditCompleted
   ) {
      var edit = new Edit(this);
      pane.add(edit);

      edit.setFixedWidth(this.editWidth);
      edit.text = text;
      edit.toolTip = toolTip;
      edit.onTextUpdated = onTextUpdated;
      edit.onEditCompleted = onEditCompleted;

      return edit;
   };

   this.addUnits = function(pane, text) {
      var label = new Label(this);
      pane.add(label);

      label.setFixedWidth(this.unitWidth);
      label.text = text;
      label.textAlignment = TextAlign_Left | TextAlign_VertCenter;

      return label;
   };

   this.addComboBox = function(
      pane, items, currentItem, toolTip, onItemSelected
   ) {
      var comboBox = new ComboBox(this);
      pane.add(comboBox);

      for (var i = 0; i != items.length; ++i) {
         comboBox.addItem(items[i]);
      }
      comboBox.currentItem = currentItem;
      comboBox.toolTip = toolTip;
      comboBox.onItemSelected = onItemSelected;

      return comboBox;
   };

   this.addPushButton = function(pane, text, toolTip, onClick) {
      var pushButton = new PushButton(this);
      pane.add(pushButton);

      pushButton.text = text;
      pushButton.toolTip = toolTip;
      pushButton.onClick = onClick;

      return pushButton;
   };

   this.addToolButtonMousePress = function(pane, icon, toolTip, onMousePress) {
      var toolButton = new ToolButton(this);
      pane.add(toolButton);

      toolButton.icon = this.scaledResource(icon);
      toolButton.setScaledFixedSize(20, 20);
      toolButton.toolTip = toolTip;
      toolButton.onMousePress = onMousePress;

      return toolButton;
   };

   this.addToolButton = function(pane, icon, toolTip, onClick) {
      var toolButton = new ToolButton(this);
      pane.add(toolButton);

      toolButton.icon = this.scaledResource(icon);
      toolButton.setScaledFixedSize(20, 20);
      toolButton.toolTip = toolTip;
      toolButton.onClick = onClick;

      return toolButton;
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

   this.sizer = new VerticalSizer;
   this.sizer.margin = 6;
   this.sizer.spacing = 6;

   this.labelWidth = this.font.width("Interpolation method:")
   this.editWidth = this.font.width("0000000000");
   this.unitWidth = this.font.width(model.detectorGainUnits);

   {
      this.imageGroupBox = this.addGroupBox("Image");

      {
         this.imageViewPane = this.addPane(this.imageGroupBox);

         this.imageViewList = this.addViewList(
            this.imageViewPane,
            function(view) {
               controller.imageViewOnViewSelected(view);
            }
         );
         this.imageViewListNull = this.imageViewList.currentView;

         this.imageViewHelpButton = this.addToolButton(
            this.imageViewPane,
            ":/icons/comment.png",
            "<p>The view of the linear monochannel image selected for " +
            "denoising. The image must be a single frame image or an " +
            "average combination of similarly exposed and registered " +
            "frames. The size of the image must be at least 256 pixels " +
            "in width and height.</p>" +

            "<p>For linear multichannel images, run the monochannel " +
            "denoiser on each channel separately. For linear one shot " +
            "color (OSC) images, denoise the color filter array (CFA) " +
            "channels not the debayered RGB channels.</p>",
            function() {}
         );
      }

      {
         this.imageCombinationCountPane = this.addPane(this.imageGroupBox);

         this.imageCombinationCountLabel = this.addLabel(
            this.imageCombinationCountPane,
            "Combination count:",
            "<p>The average combination count of the image.</p>" +

            "<p>Combination count must be set to 1 for single " +
            "frame images.</p>" +

            "<p>Combination count must be set to &eta; for average " +
            "combinations of &eta; equally exposed and registered frames.</p>"
         );

         this.imageCombinationCountEdit = this.addEdit(
            this.imageCombinationCountPane,
            format(
               model.imageCombinationCountFormat,
               model.imageCombinationCount
            ),
            this.imageCombinationCountLabel.toolTip,
            function(text) {
               controller.imageCombinationCountOnTextUpdated(text);
            },
            function() {
               this.text = format(
                  model.imageCombinationCountFormat,
                  model.imageCombinationCount
               );
            }
         );

         this.imageCombinationCountUnits = this.addUnits(
            this.imageCombinationCountPane,
            model.imageCombinationCountUnits
         );

         this.imageCombinationCountPane.addStretch();
      }

      {
         this.imageInterpolationMethodPane = this.addPane(this.imageGroupBox);

         this.imageInterpolationMethodLabel = this.addLabel(
            this.imageInterpolationMethodPane,
            "Interpolation method:",
            "<p>The interpolation method used to register images for " +
            "combination, as defined by the <i>StarAlignment</i> " +
            "process.</p>" +

            "<p>Interpolation method must be set equal to the " +
            "<i>StarAlignment</i> process parameter <i>Interpolation</i> > " +
            "<i>Pixel interpolation</i>. When <i>Auto</i> was selected as " +
            "the <i>StarAlignment</i> pixel interpolation parameter, " +
            "interpolation method must be set equal to the value recorded " +
            "in the <i>StarAlignment</i> process log.</p>"
         );

         this.imageInterpolationMethodComboBox = this.addComboBox(
            this.imageInterpolationMethodPane,
            model.imageInterpolationMethodNames,
            model.imageInterpolationMethod,
            this.imageInterpolationMethodLabel.toolTip,
            function(item) {
               controller.imageInterpolationMethodOnItemSelected(item)
            }
         );

         this.imageInterpolationMethodPane.addStretch();
      }
   }

   {
      this.flatfieldGroupBox = this.addGroupBox("Flatfield");

      {
         this.flatfieldViewPane = this.addPane(this.flatfieldGroupBox);

         this.flatfieldViewList = this.addViewList(
            this.flatfieldViewPane,
            function(view) {
               controller.flatfieldViewOnViewSelected(view);
            }
         );
         this.flatfieldViewListNull = this.flatfieldViewList.currentView;

         this.flatfieldViewHelpButton = this.addToolButton(
            this.flatfieldViewPane,
            ":/icons/comment.png",
            "<p>To enable large spatial scale flatfield compensation, the " +
            "view of the monochannel image used for flatfield calibration. " +
            "To disable flatfield compensation, do not select a view.</p>" +

            "<p>Flatfield compensation is useful for telescopes with more " +
            "than ~10% optical vignetting. For telescopes with less " +
            "vignetting, flatfield compensation results in negligible " +
            "denoising quality improvement.</p>",
            function() {}
         );
      }
   }

   {
      this.detectorGroupBox = this.addGroupBox("Detector");

      {
         this.detectorGainPane = this.addPane(this.detectorGroupBox);

         this.detectorGainLabel = this.addLabel(
            this.detectorGainPane,
            "Gain:",
            "<p>The gain of the detector in " + model.detectorGainUnits +
            ".</p>" +

            "<p>If detector gain is unknown, the <i>FlatSNREstimator</i> " +
            "script can provide an estimate.</p>"
         );

         this.detectorGainEdit = this.addEdit(
            this.detectorGainPane,
            format(
               model.detectorGainFormat,
               model.detectorGain
            ),
            this.detectorGainLabel.toolTip,
            function(text) {
               controller.detectorGainOnTextUpdated(text);
            },
            function() {
               this.text = format(
                  model.detectorGainFormat,
                  model.detectorGain
               );
            }
         );

         this.detectorGainUnits = this.addUnits(
            this.detectorGainPane,
            model.detectorGainUnits
         );

         this.detectorGainPane.addStretch();
      }

      {
         this.detectorGaussianNoisePane = this.addPane(this.detectorGroupBox);

         this.detectorGaussianNoiseLabel = this.addLabel(
            this.detectorGaussianNoisePane,
            "Gaussian noise:",
            "<p>The standard deviation of additive white Gaussian noise of " +
            "the detector in " + model.detectorGaussianNoiseUnits + ".</p>" +

            "<p>Gaussian noise should be set to an estimate of detector " +
            "read noise or an estimate of the quadrature sum of read noise " +
            "and dark current noise.</p>" +

            "<p>If detector Gaussian noise is unknown, the " +
            "<i>DarkBiasNoiseEstimator</i> script can provide an estimate.</p>"
         );

         this.detectorGaussianNoiseEdit = this.addEdit(
            this.detectorGaussianNoisePane,
            format(
               model.detectorGaussianNoiseFormat,
               model.detectorGaussianNoise
            ),
            this.detectorGaussianNoiseLabel.toolTip,
            function(text) {
               controller.detectorGaussianNoiseOnTextUpdated(text);
            },
            function() {
               this.text = format(
                  model.detectorGaussianNoiseFormat,
                  model.detectorGaussianNoise
               );
            }
         );

         this.detectorGaussianNoiseUnits = this.addUnits(
            this.detectorGaussianNoisePane,
            model.detectorGaussianNoiseUnits
         );

         this.detectorGaussianNoisePane.addStretch();
      }

      {
         this.detectorOffsetPane = this.addPane(this.detectorGroupBox);

         this.detectorOffsetLabel = this.addLabel(
            this.detectorOffsetPane,
            "Offset:",
            "<p>The offset of the detector in " + model.detectorOffsetUnits +
            ".</p>" +

            "<p>Offset must be set to 0 for bias or dark-subtracted " +
            "images.</p>" +

            "<p>If detector offset is unknown, the " +
            "<i>DarkBiasNoiseEstimator</i> script can provide an estimate.</p>"
         );

         this.detectorOffsetEdit = this.addEdit(
            this.detectorOffsetPane,
            format(
               model.detectorOffsetFormat,
               model.detectorOffset
            ),
            this.detectorOffsetLabel.toolTip,
            function(text) {
               controller.detectorOffsetOnTextUpdated(text);
            },
            function() {
               this.text = format(
                  model.detectorOffsetFormat,
                  model.detectorOffset
               );
            }
         );

         this.detectorOffsetUnits = this.addUnits(
            this.detectorOffsetPane,
            model.detectorOffsetUnits
         );

         this.detectorOffsetPane.addStretch();
      }
   }

   {
      this.denoiseGroupBox = this.addGroupBox("Denoise");

      {
         this.denoiseVarianceScalePane = this.addPane(this.denoiseGroupBox);

         this.denoiseVarianceScaleLabel = this.addLabel(
            this.denoiseVarianceScalePane,
            "Variance scale:",
            "<p>This parameter scales hypothesis noise variance. A value of " +
            "one corresponds to nominal hypothesis noise variance and a " +
            "cooresponding nominal amount of denoising. A value less than " +
            "one will reduce the amount of denoising. A value greater than " +
            "one will increase the amount of denoising.</p>" +

            "<p><b>Warning</b>: Excessively large variance scale values " +
            "risk the generation of denoising artifacts and the loss of " +
            "signal-to-noise ratio (SNR).</p>" +

            "<p>To account for the effects of average combination image " +
            "normalization and weighting, variance scale may be loaded from " +
            "<i>ImageIntegration</i> process log information.</p>"
         );

         this.denoiseVarianceScaleEdit = this.addEdit(
            this.denoiseVarianceScalePane,
            format(
               model.denoiseVarianceScaleFormat,
               model.denoiseVarianceScale
            ),
            this.denoiseVarianceScaleLabel.toolTip,
            function(text) {
               controller.denoiseVarianceScaleOnTextUpdated(text);
            },
            function() {
               this.text = format(
                  model.denoiseVarianceScaleFormat,
                  model.denoiseVarianceScale
               );
            }
         );

         this.denoiseVarianceScaleUnits = this.addUnits(
            this.denoiseVarianceScalePane,
            model.denoiseVarianceScaleUnits
         );

         this.denoiseVarianceScalePane.addStretch();

         this.loadVarianceScaleButton = this.addPushButton(
            this.denoiseVarianceScalePane,
            "Load variance scale...",
            "<p>Loads the variance scale from information in an " +
            "<i>ImageIntegration</i> process log file.</p>" +

            "<p>The log file is a manually created .txt file containing a " +
            "copy of the Process Console log generated by the " +
            "<i>ImageIntegration</i> process.</p>",
            function() {
               controller.loadVarianceScale();
            }
         );
      }

      {
         this.denoiseCycleSpinCountPane = this.addPane(this.denoiseGroupBox);

         this.denoiseCycleSpinCountLabel = this.addLabel(
            this.denoiseCycleSpinCountPane,
            "Cycle-spin count:",
            "<p>Cycle-spin count provides an adjustable trade-off between " +
            "denoising quality and processing time. Increasing the number " +
            "of cycle-spins improves denoising quality, but also " +
            "increases (nearly linearly) processing time.</p>" +

            "<p>The default cycle-spin count of 8 typically provides very " +
            "good quality results in reasonable time.</p>"
         );

         this.denoiseCycleSpinCountEdit = this.addEdit(
            this.denoiseCycleSpinCountPane,
            format(
               model.denoiseCycleSpinCountFormat,
               model.denoiseCycleSpinCount
            ),
            this.denoiseCycleSpinCountLabel.toolTip,
            function(text) {
               controller.denoiseCycleSpinCountOnTextUpdated(text);
            },
            function() {
               this.text = format(
                  model.denoiseCycleSpinCountFormat,
                  model.denoiseCycleSpinCount
               );
            }
         );

         this.denoiseCycleSpinCountUnits = this.addUnits(
            this.denoiseCycleSpinCountPane,
            model.denoiseCycleSpinCountUnits
         );

         this.denoiseCycleSpinCountPane.addStretch();
      }

      {
         this.generateMethodNoiseImagePane = this.addPane(this.denoiseGroupBox);

         this.generateMethodNoiseImagePane.addUnscaledSpacing(this.labelWidth);

         this.generateMethodNoiseImagePane.addSpacing(
            this.generateMethodNoiseImagePane.spacing
         );

         this.generateMethodNoiseImageCheckBox = this.addCheckBox(
            this.generateMethodNoiseImagePane,
            "Generate method noise image",
            "<p>Generate the method noise of the denoising process as a new " +
            "image window. Method noise is the noise guessed by the " +
            "denoising method, defined as the difference between the noisy " +
            "input and the denoised output. Method noise should track " +
            "hypothesis noise statistics, and is strongly signal dependent " +
            "due to the presence of Poisson noise.</p>",
            model.generateMethodNoiseImage,
            function(checked) {
               controller.generateMethodNoiseImageOnCheck(checked);
            }
         );

         this.generateMethodNoiseImagePane.addStretch();
      }
   }

   this.sizer.addStretch();

   {
      this.buttonPane = this.addPane(this);

      this.newInstanceButton = this.addToolButtonMousePress(
         this.buttonPane,
         ":/process-interface/new-instance.png",
         "<p>Create a new instance.</p>",
         function() {
            this.hasFocus = true;
            controller.newInstance();
            this.pushed = false;
            this.dialog.newInstance();
         }
      );

      this.browseDocumentationButton = this.addToolButton(
         this.buttonPane,
         ":/process-interface/browse-documentation.png",
         "<p>Open a browser to view documentation.</p>",
         function() {
            controller.browseDocumentation();
         }
      );

      this.resetButton = this.addToolButton(
         this.buttonPane,
         ":/images/icons/reset.png",
         "<p>Reset all parameters.</p>",
         function() {
            controller.reset();
         }
      );

      this.versionLabel = this.addLabel(
         this.buttonPane,
         "Version " + VERSION,
         "<p><b>" + TITLE + " Version " + VERSION + "</b></p>" +

         "<p>Script for denoising linear monochannel images corrupted by " +
         "mixed Poisson-Gaussian noise. Applicable to single frame images " +
         "and average combinations of equally exposed and registered " +
         "frames.</p>" +

         "<p>The script supports an astronomical image processing workflow " +
         "in which the denoising step occurs immediately after the " +
         "calibration and optional average combination steps and prior to " +
         "other linear or nonlinear processing steps.</p>" +

         "<p>The script applies an interscale wavelet mixed noise unbiased " +
         "eisk estimator (MURE) to find a denoised output image that " +
         "minimizes an estimate of the oracle mean-squared error (MSE), or  " +
         "\"risk\", between the denoised output image and the unknown " +
         "noise-free image.</p>" +

         "<p><b>Note</b>: For linear multichannel images, run the " +
         "monochannel denoiser on each channel separately. For linear one " +
         "shot color (OSC) images, denoise the color filter array (CFA) " +
         "channels not the debayered RGB channels.</p>" +

         "<p><b>Warning</b>: The script is adapted to denoise linear " +
         "monochannel images mainly corrupted by shot noise, read noise, " +
         "and dark current noise which is typically the case for " +
         "astronomical data. The script does not work properly for other " +
         "noise distributions, for saturated images, for linearly or " +
         "nonlinearly processed images, for median combinations, or for " +
         "drizzle combinations.</p>" +

         "<p><b>Warning</b>: Do not combine denoised images. Signal-to-" +
         "noise ratio (SNR) will be enhanced by combining noisy images and " +
         "denoising the result. Combined images must be equally exposed, " +
         "have the same pixel resolution, and be registered by projective " +
         "transformation with no distortion correction. When denoising " +
         "combinations, the script is unable to remove correlated noise " +
         "introduced by the image registration process.</p>" +

         "<p>Copyright &copy; 2012-2015 Mike Schuster. All Rights " +
         "Reserved.<br>" +
         "Copyright &copy; 2003-2015 Pleiades Astrophoto S.L. All Rights " +
         "Reserved.</p>"
      );
      this.versionLabel.setVariableWidth();

      this.buttonPane.addStretch();

      this.denoiseButton = this.addPushButton(
         this.buttonPane,
         "Denoise",
         "<p>Denoise the image.</p>",
         function() {
            controller.denoise();
         }
      );

      this.dismissAbortButton = this.addPushButton(
         this.buttonPane,
         "Dismiss",
         "<p>Dismiss the dialog.</p>",
         function() {
            if (this.dialog.abortEnabled) {
               this.dialog.abortRequested = true;
            }
            else {
               controller.dismiss();
            }
         }
      );
      this.dismissAbortButton.defaultButton = true;
      this.dismissAbortButton.hasFocus = true;
   }

   this.onClose = function() {
      if (this.dialog.abortEnabled) {
         this.dialog.abortRequested = true;
      }
   }

   this.windowTitle = TITLE;

   this.adjustToContents();
   this.setMinWidth(this.width + this.logicalPixelsToPhysical(40));
   this.setFixedHeight(this.height + this.logicalPixelsToPhysical(20));

   this.disableAbort();
}
MainView.prototype = new Dialog;

// ****************************************************************************
// EOF MainViewController.js - Released 2015/11/20 00:00:00 UTC
