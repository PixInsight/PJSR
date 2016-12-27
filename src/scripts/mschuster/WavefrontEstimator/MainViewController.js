// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// MainViewController.js - Released 2016/12/30 00:00:00 UTC
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

function MainController(model) {
   this.view = null;

   this.framesTabController = new FramesTabController(model, this);
   this.parametersTabController = new ParametersTabController(model, this);
   this.wavefrontTabController = new WavefrontTabController(model, this);
   this.exposureTabController = new ExposureTabController(model, this);

   this.setView = function(view) {
      this.view = view;

      this.framesTabController.setView(this.view.framesTabView);
      this.parametersTabController.setView(this.view.parametersTabView);
      this.wavefrontTabController.setView(this.view.wavefrontTabView);
      this.exposureTabController.setView(this.view.exposureTabView);

      var displayPixelRatio =
         Math.min(2, Math.round(this.view.displayPixelRatio));
      var resourcePixelRatio =
         Math.min(2, Math.round(this.view.resourcePixelRatio));
      var maxPixelRatio = Math.max(displayPixelRatio, resourcePixelRatio);

      model.plotResolution = 96 * maxPixelRatio;
      model.plotZoomFactor = resourcePixelRatio == 1 ? 1 : -resourcePixelRatio;
      model.fontResolution = 96 * (
         displayPixelRatio >= resourcePixelRatio ? displayPixelRatio : 1
      );
   };

   this.execute = function() {
      this.enableControls();
      this.view.execute();
   };

   this.resetOutput = function() {
      this.framesTabController.resetOutput();
      this.parametersTabController.resetOutput();
      this.wavefrontTabController.resetOutput();
      this.exposureTabController.resetOutput();
   };

   this.resetOutputEstimate = function() {
      this.framesTabController.resetOutput();
      this.parametersTabController.resetOutput();
      this.wavefrontTabController.resetOutput();
   };

   this.reset = function() {
      this.framesTabController.reset();
      this.parametersTabController.reset();
      this.wavefrontTabController.reset();
      this.exposureTabController.reset();

      this.resetOutput();
      this.enableControls();
   };

   this.disableControls = function() {
      this.view.newInstanceButton.enabled = false;
      this.view.browseDocumentationButton.enabled = false;
      this.view.resetButton.enabled = false;

      this.view.estimateButton.enabled = false;

      this.framesTabController.disableControls();
      this.parametersTabController.disableControls();
      this.wavefrontTabController.disableControls();
      this.exposureTabController.disableControls();
   };

   this.enableControls = function() {
      this.view.newInstanceButton.enabled = true;
      this.view.browseDocumentationButton.enabled = true;
      this.view.resetButton.enabled = true;

      this.view.estimateButton.enabled =
         model.intraFocalFramePaths.length != 0 &&
         model.extraFocalFramePaths.length != 0 &&
         model.apertureDiameter != model.minimumApertureDiameter &&
         model.focalLength != model.minimumFocalLength &&
         model.gain != model.minimumGain &&
         model.pixelSize != model.minimumPixelSize;

      this.framesTabController.enableControls();
      this.parametersTabController.enableControls();
      this.wavefrontTabController.enableControls();
      this.exposureTabController.enableControls();
   };

   this.registerCombineFrames = function() {
      //console.writeln();
      //console.writeln(
      //   "<b>Frame registration and combination:</b>"
      //);
      console.flush();
      var startTime = new Date();

      (new RegisterCombineFrames(
         model, this.view, this
      )).registerCombineFrames();

      var endTime = new Date();
      console.writeln(
         format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime()))
      );
      console.flush();
   };

   this.estimateWavefront = function() {
      //console.writeln();
      //console.writeln(
      //   "<b>Wavefront estimation:</b>"
      //);
      console.flush();
      var startTime = new Date();

      (new EstimateWavefront(model, this.view, this)).estimateWavefront();

      var endTime = new Date();
      console.writeln(
         format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime()))
      );
      console.flush();
   };

   this.estimatePointSpreadFunction = function() {
      console.writeln();
      console.writeln(
         "<b>Point spread function estimation:</b>"
      );
      console.flush();
      var startTime = new Date();

      (new EstimatePointSpreadFunction(
         model, this.view, this
      )).estimatePointSpreadFunction();

      var endTime = new Date();
      console.writeln(
         format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime()))
      );
      console.flush();
   };

   this.estimateEncircledEnergyFunction = function() {
      console.writeln();
      console.writeln(
         "<b>Encircled energy function estimation:</b>"
      );
      console.flush();
      var startTime = new Date();

      (new EstimateEncircledEnergyFunction(
         model
      )).estimateEncircledEnergyFunction();

      var endTime = new Date();
      console.writeln(
         format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime()))
      );
      console.flush();
   };

   this.estimateModulationTransferFunction = function() {
      console.writeln();
      console.writeln(
         "<b>Modulation transfer function estimation:</b>"
      );
      console.flush();
      var startTime = new Date();

      (new EstimateModulationTransferFunction(
         model, this.view, this
      )).estimateModulationTransferFunction();

      var endTime = new Date();
      console.writeln(
         format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime()))
      );
      console.flush();
   };

   this.estimate = function() {
      this.disableControls();
      this.resetOutputEstimate();
      this.view.enableAbort();
      console.show();
      if (false) {
         console.writeln();
         console.writeln(
            "Matrix count: ", globalFrameRealCount,
            ", ", globalFrameComplexCount
         );
      }
      console.flush();

      console.beginLog();
      console.writeln();
      console.writeln("<b>" + TITLE + " Version " + VERSION + "</b>");
      console.flush();

      try {
         var outputDirectoryController = new OutputDirectoryController(model);

         outputDirectoryController.logParameters();
         this.view.throwAbort();

         this.registerCombineFrames();
         this.view.throwAbort();

         {
            if (model.generateViews || model.outputDirectoryPath != null) {
               outputDirectoryController.generateCombinedImages();
               this.view.throwAbort();
            }
            if (model.generateViews || model.outputDirectoryPath != null) {
               outputDirectoryController.generateRejectionMaps();
               this.view.throwAbort();
            }
         }

         this.estimateWavefront();
         this.view.throwAbort();

         {
            //if (model.generateViews || model.outputDirectoryPath != null) {
            //   outputDirectoryController.generateCompensatedImages();
            //   this.view.throwAbort();
            //}
            if (model.generateViews || model.outputDirectoryPath != null) {
               outputDirectoryController.generateWavefrontImage();
               this.view.throwAbort();
            }
            if (model.generateViews || model.outputDirectoryPath != null) {
               (new WavefrontPlot(model)).generateWavefrontPlot();
               this.view.throwAbort();
               outputDirectoryController.generateWavefrontPlot();
               this.view.throwAbort();
            }
            if (model.generateViews || model.outputDirectoryPath != null) {
               (new InterferogramPlot(model)).generateInterferogramPlot();
               this.view.throwAbort();
               outputDirectoryController.generateInterferogramPlot();
               this.view.throwAbort();
            }
            if (model.outputDirectoryPath != null) {
               outputDirectoryController.saveAberrationEstimate();
               this.view.throwAbort();
            }
         }

         this.estimatePointSpreadFunction();
         this.view.throwAbort();

         {
            if (model.generateViews || model.outputDirectoryPath != null) {
               outputDirectoryController.generatePointSpreadFunctionImage();
               this.view.throwAbort();
            }
            if (model.outputDirectoryPath != null) {
               outputDirectoryController.saveWavefrontEstimate();
               this.view.throwAbort();
            }
         }

         if (model.generateViews || model.outputDirectoryPath != null) {
            this.estimateEncircledEnergyFunction();
            this.view.throwAbort();

            {
               if (model.generateViews || model.outputDirectoryPath != null) {
                  (new EncircledEnergyFunctionPlot(
                     model
                  )).generateEncircledEnergyFunctionPlot();
                  this.view.throwAbort();
                  outputDirectoryController.generateEncircledEnergyFunctionPlot();
                  this.view.throwAbort();
               }
               if (model.outputDirectoryPath != null) {
                  outputDirectoryController.saveEncircledEnergyFunction();
                  this.view.throwAbort();
               }
            }
         }

         if (model.generateViews || model.outputDirectoryPath != null) {
            this.estimateModulationTransferFunction();
            this.view.throwAbort();

            {
               if (model.generateViews || model.outputDirectoryPath != null) {
                  outputDirectoryController.generateModulationTransferFunctionImage();
                  this.view.throwAbort();
               }
               if (model.generateViews || model.outputDirectoryPath != null) {
                  (new ModulationTransferFunctionPlot(
                     model
                  )).generateModulationTransferFunctionPlot();
                  this.view.throwAbort();
                  outputDirectoryController.generateModulationTransferFunctionPlot();
                  this.view.throwAbort();
               }
               if (model.outputDirectoryPath != null) {
                  outputDirectoryController.saveModulationTransferFunction();
                  this.view.throwAbort();
               }
            }
         }

         if (model.outputDirectoryPath != null) {
            outputDirectoryController.saveConsoleLog();
            this.view.throwAbort();
         }

         this.view.tabBox.currentPageIndex = this.view.wavefrontPageIndex;
      }
      catch (exception) {
         this.resetOutputEstimate();
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
         console.writeln(
            "Matrix count: ", globalFrameRealCount,
            ", ", globalFrameComplexCount
         );
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
         "<p>Abort the estimation.</p>";
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

   this.addPane = function(group) {
      var buttonPane = new HorizontalSizer;
      buttonPane.spacing = 6;
      group.sizer.add(buttonPane);

      return buttonPane;
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

   this.addLabel = function(pane, text, toolTip) {
      var label = new Label(this);
      pane.add(label);

      //label.setFixedWidth(this.labelWidth);
      label.text = text;
      label.toolTip = toolTip;
      label.textAlignment = TextAlign_Right | TextAlign_VertCenter;

      return label;
   };

   this.sizer = new VerticalSizer;
   this.sizer.margin = 6;
   this.sizer.spacing = 6;

   {
      this.tabBox = new TabBox(this);
      this.tabBox.onPageSelected = function() {
         if (controller.view != null) {
            controller.view.dismissAbortButton.hasFocus = true;
         }
      };
      this.sizer.add(this.tabBox);

      this.parametersTabView =
         new ParametersTabView(
            this, model, controller.parametersTabController
         );
      this.tabBox.addPage(this.parametersTabView, "Parameters");
      this.parametersPageIndex = 0;

      this.framesTabView =
         new FramesTabView(this, model, controller.framesTabController);
      this.tabBox.addPage(this.framesTabView, "Frames");
      this.framesPageIndex = 1;

      this.wavefrontTabView =
         new WavefrontTabView(this, model, controller.wavefrontTabController);
      this.tabBox.addPage(this.wavefrontTabView, "Wavefront");
      this.wavefrontPageIndex = 2;

      this.exposureTabView =
         new ExposureTabView(this, model, controller.exposureTabController);
      this.tabBox.addPage(this.exposureTabView, "Exposure");
      this.exposurePageIndex = 3;
   }

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
         ":/images/icons/reset.png", // ":/web-browser/reload.png",
         "<p>Reset all parameters.</p>",
         function() {
            controller.reset();
         }
      );

      this.versionLabel = this.addLabel(
         this.buttonPane,
         "Version " + VERSION,
         "<p><b>" + TITLE + " Version " + VERSION + "</b></p>" +

         "<p>Script for testing the on-axis optical quality of " +
         "telescopes.</p>" +

         "<p>WavefrontEstimator estimates the on-axis optical wavefront of " +
         "a telescope from long-exposure defocused stellar images. " +
         "Exposure differences between an intra-focal image and an " +
         "inverted (rotated by 180&deg;) extra-focal image of the same " +
         "bright star reflect local changes in the curvature of the " +
         "wavefront. WavefrontEstimator measures the " +
         "defocused image exposure differences, reconstructs the " +
         "wavefront, and provides a diagnosis of wavefront aberrations. " +
         "WavefrontEstimator relies on long combined exposures of at least " +
         "100 seconds and 100,000 e- to average out the effects of " +
         "atmospheric turbulence and provide sufficient signal-to-noise " +
         "ratio. The telescope must be in thermal equilibrium.</p>" +

         "<p>The estimated wavefront defines a map of optical phase on the " +
         "aperture plane, normalized to zero mean phase. Non-zero estimates " +
         "correspond to wavefront aberrations and lower image quality. An " +
         "estimate <i>d</i> in meters at a point in the wavefront defines a " +
         "phase of -<i>k</i> <i>d</i> radians at the corresponding point on " +
         "the aperture plane, with wavenumber <i>k</i> given by 2π / " +
         "<i>λ</i> radians per meter, where <i>λ</i> is the observation " +
         "wavelength in meters.</p>" +

         "<p>WavefrontEstimator resolves wavefront deformations or " +
         "corrugations at a maximum spatial frequency that depends on the " +
         "degree of defocus, the aperture diameter and focal length of the " +
         "telescope, and the observation wavelength. The maximum " +
         "corrugation spatial frequency measured is denoted the corrugation " +
         "resolution. Typical values range from 10 to 15 cycles per " +
         "aperture diameter.</p>" +

         "<p>Copyright &copy; 2012-2015 Mike Schuster. All Rights " +
         "Reserved.<br>" +
         "Copyright &copy; 2003-2015 Pleiades Astrophoto S.L. All Rights " +
         "Reserved.</p>"
      );

      this.buttonPane.addStretch();

      this.estimateButton = this.addPushButton(
         this.buttonPane,
         "Estimate",
         "<p>Estimate the wavefront.</p>" +

         "<p>To enable, set the parameters in the Parameters tab and select " +
         "intra-focal and extra-focal frames for combination in the Frames " +
         "tab.</p>",
         function() {controller.estimate();}
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

#iflt __PI_BUILD__ 1168
   // this.setScaledMinSize(520, 600);
   this.setScaledMinWidth(520);
#endif
   this.adjustToContents();
#iflt __PI_BUILD__ 1168
#else
   this.setMinWidth(this.width + this.logicalPixelsToPhysical(20));
#endif
   this.setFixedHeight(this.height + this.logicalPixelsToPhysical(20));

   this.disableAbort();
}
MainView.prototype = new Dialog;

// ****************************************************************************
// EOF MainViewController.js - Released 2016/12/30 00:00:00 UTC
