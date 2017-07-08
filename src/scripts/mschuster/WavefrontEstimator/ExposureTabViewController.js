// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// ExposureTabViewController.js - Released 2016/12/30 00:00:00 UTC
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

function ExposureTabController(model, controller) {
   this.view = null;

   // Exposure calibration constants.
   this.exposureCalibration = new Array(
      (1 / 3) * 1.5e-6, // ~300 nm broadband
      1.5e-6,           // ~50-100 nm broadband
      25 * 1.5e-6       // ~3-6 nm narrowband
   );

   this.setView = function(view) {
      this.view = view;
   };

   this.resetOutput = function() {
      this.resetOutputDefocusDistanceDiameterEstimate();
      this.resetOutputStarMagnitudeEstimate();
      this.resetOutputMeasurement();
   };

   this.resetOutputDefocusDistanceDiameterEstimate = function() {
      this.view.defocusDistanceEstimateValue.text = " -";
      this.view.defocusDiameterEstimateValue.text = " -";
   };

   this.resetOutputStarMagnitudeEstimate = function() {
      this.view.starMagnitudeEstimateValue.text = " -";
   };

   this.resetOutputMeasurement = function() {
      this.view.measurementDefocusDistanceValue.text = " -";
      this.view.measurementDefocusDiameterValue.text = " -";
      this.view.measurementDefocusSignalValue.text = " -";
      this.view.measurementDefocusSignalElectronsValue.text = " -";
   };

   this.reset = function() {
      model.defocusExposure = model.defaultDefocusExposure;
      this.view.defocusExposureEdit.text = format(
         model.formatDefocusExposure,
         model.scaleDefocusExposure * model.defocusExposure
      );

      model.observationBandwidth = model.defaultObservationBandwidth;
      this.view.observationBandwidthComboBox.currentItem =
         model.observationBandwidth;

      model.corrugationResolution = model.defaultCorrugationResolution;
      this.view.corrugationResolutionEdit.text = format(
         model.formatCorrugationResolution,
         model.scaleCorrugationResolution * model.corrugationResolution
      );

      model.exposureTime = model.defaultExposureTime;
      this.view.exposureTimeEdit.text = format(
         model.formatExposureTime,
         model.scaleExposureTime * model.exposureTime
      );

      this.view.measurementViewList.currentView =
         this.view.measurementViewListNullView;
   };

   this.disableControls = function() {
      this.view.defocusExposureEdit.enabled = false;
      this.view.observationBandwidthComboBox.enabled = false;
      this.view.corrugationResolutionEdit.enabled = false;
      this.view.exposureTimeEdit.enabled = false;
      this.view.estimateCalculateButton.enabled = false;

      this.view.measurementViewList.enabled = false;
      this.view.measurementCalculateButton.enabled = false;
   };

   this.enableControls = function() {
      this.view.defocusExposureEdit.enabled = true;
      this.view.observationBandwidthComboBox.enabled = true;
      this.view.corrugationResolutionEdit.enabled = true;
      this.view.exposureTimeEdit.enabled = true;
      this.view.estimateCalculateButton.enabled =
         model.apertureDiameter != model.minimumApertureDiameter &&
         model.focalLength != model.minimumFocalLength &&
         model.gain != model.minimumGain &&
         model.pixelSize != model.minimumPixelSize;

      this.view.measurementViewList.enabled = true;
      this.view.measurementCalculateButton.enabled =
         this.view.measurementViewList.currentView.isView &&
         model.apertureDiameter != model.minimumApertureDiameter &&
         model.focalLength != model.minimumFocalLength &&
         model.gain != model.minimumGain &&
         model.pixelSize != model.minimumPixelSize;
   };

   this.defocusExposureOnTextUpdated = function(text) {
      model.defocusExposure = defaultNumeric(
         parseFloat(text) / model.scaleDefocusExposure,
         model.minimumDefocusExposure,
         model.maximumDefocusExposure,
         model.defaultDefocusExposure
      );
      this.resetOutputDefocusDistanceDiameterEstimate();
      this.resetOutputStarMagnitudeEstimate();
   };

   this.observationBandwidthOnItemSelected = function(item) {
      model.observationBandwidth = item;
      this.resetOutputDefocusDistanceDiameterEstimate();
      this.resetOutputStarMagnitudeEstimate();
   };

   this.corrugationResolutionOnTextUpdated = function(text) {
      model.corrugationResolution = defaultNumeric(
         parseFloat(text) / model.scaleCorrugationResolution,
         model.minimumCorrugationResolution,
         model.maximumCorrugationResolution,
         model.defaultCorrugationResolution
      );
      this.resetOutputDefocusDistanceDiameterEstimate();
      this.resetOutputStarMagnitudeEstimate();
   };

   this.exposureTimeOnTextUpdated = function(text) {
      model.exposureTime = defaultNumeric(
         parseFloat(text) / model.scaleExposureTime,
         model.minimumExposureTime,
         model.maximumExposureTime,
         model.defaultExposureTime
      );
      this.resetOutputStarMagnitudeEstimate();
   };

   this.estimateCalculate = function() {
      var spatialPeriod = model.apertureDiameter / model.corrugationResolution;
      var defocusDistanceEstimate =
         (2 * square(model.focalLength) * model.observationWavelength) /
         (
            2 * model.focalLength * model.observationWavelength +
            square(spatialPeriod)
         );
      var defocusDiameterEstimate =
         defocusDistanceEstimate /
         (model.focalLength / model.apertureDiameter) /
         model.effectivePixelSize();

      this.view.defocusDistanceEstimateValue.text = format(
         " " + model.formatDefocusDistanceEstimate,
         model.scaleDefocusDistanceEstimate * defocusDistanceEstimate
      );
      this.view.defocusDiameterEstimateValue.text = format(
         " " + model.formatDefocusDiameter,
         model.scaleDefocusDiameter * defocusDiameterEstimate
      );

      var starMagnitudeEstimate = 2.5 * Math.log10(
         (10000 / model.defocusExposure) *
         (model.exposureTime * square(model.apertureDiameter)) /
         (
            this.exposureCalibration[
               model.detectorType == model.monochromeDetectorType ?
                  model.observationBandwidth :
                  1
            ] *
            square(defocusDiameterEstimate)
         )
      );

      this.view.starMagnitudeEstimateValue.text = format(
         " " + model.formatStarMagnitudeEstimate,
         model.scaleStarMagnitudeEstimate * starMagnitudeEstimate
      );
   };

   this.measurementViewListOnViewSelected = function(view) {
      this.resetOutputMeasurement();
      this.enableControls();
   };

   this.measurementCalculate = function() {
      function writeRegisteredFrameMetrics(
         metrics, defocusThreshold, effectiveFrameCount
      ) {
         console.writeln("Defocus threshold: ", format(
            model.formatDefocusThreshold + " DN",
            model.scaleDefocusThreshold * defocusThreshold
         ));
         console.writeln("Defocus barycenter.x: ", format(
            model.formatDefocusBarycenter + " px", metrics.barycenter.x
         ));
         console.writeln("Defocus barycenter.y: ", format(
            model.formatDefocusBarycenter + " px", metrics.barycenter.y
         ));
         console.writeln("Defocus diameter: ", format(
            model.formatDefocusDiameter + " px", 2 * metrics.radius
         ));
         console.writeln("Defocus obstruction diameter: ", format(
            model.formatDefocusDiameter + " px", 2 * metrics.obstructionRadius
         ));
         console.writeln("Defocus exposure: ",
            format(
               model.formatDefocusSignal + " DN",
               model.scaleDefocusSignal * metrics.signal
            ),
            format(
               ", " + model.formatDefocusExposure + " e-",
               model.scaleDefocusExposure * model.gain *
                  model.scaleDefocusSignal *
                  effectiveFrameCount * metrics.signal
            )
         );
      }

      controller.disableControls();
      this.resetOutputMeasurement();
      controller.view.enableAbort();
      console.show();
      if (false) {
         console.writeln();
         console.writeln(
            "Matrix count: ", globalFrameRealCount,
            ", ", globalFrameComplexCount
         );
      }
      console.flush();

      console.writeln();
      console.writeln(
         "<b>Exposure estimation: view:</b>"
      );
      console.writeln(this.view.measurementViewList.currentView.fullId);
      console.flush();
      var startTime = new Date();

      try {
         var registerCombineFrames = new RegisterCombineFrames(
            model, controller.view, controller
         );

         var image = new FrameReal(
            this.view.measurementViewList.currentView.image.toMatrix()
         );

         var pedestal = 0;
         var effectiveFrameCount = 1;

         var keywords =
            this.view.measurementViewList.currentView.window.keywords;
         for (var i = 0; i != keywords.length; ++i) {
            var keyword = keywords[i];
            if (keyword.name == "PEDESTAL") {
               pedestal = defaultNumeric(
                  parseFloat(keyword.value), 0, model.DNPerNormalizedUnit, 0
               ) / model.DNPerNormalizedUnit;
            }
            if (keyword.name == "WEEFCNT") {
               effectiveFrameCount =
                  defaultNumeric(parseFloat(keyword.value), 1, 1000, 1);
            }
         }

         var cropFrameMetrics = image.stagePipeline([
            function(frame) {return frame.offset(-pedestal);},
            function(frame) {return frame.truncate(0, 1);},
            function(frame) {
               return registerCombineFrames.cropFrame(frame);
            }
         ]);
         var frame = cropFrameMetrics.frame;

         if (model.useDefocusThresholdHistogram) {
            var medianFrame = frame.medianFilter(model.hotPixelRemovalRadius);
            var defocusThreshold = Math.max(
               model.minimumDefocusThreshold,
               medianFrame.defocusThresholdHistogram(
                  model.defocusThresholdHistogramBins,
                  model.defocusThresholdHistogramMinimumBins,
                  model.defocusThresholdHistogramNeighborhood,
                  model.defocusThresholdHistogramSigma
               )
            );
            medianFrame.clear();
         }
         else {
            var defocusThreshold = model.minimumDefocusThreshold;
         }

         for (
            var k = 0;
            k != Math.max(1, model.defocusSignalFixedPointIterations);
            ++k
         ) {
            if (defocusThreshold == 0) {
               throw new Error(model.defocusThresholdEstimationDidNotConverge);
            }
            var apertureMetrics = frame.apertureMetrics(
               defocusThreshold, model.hotPixelRemovalRadius
            );
            var metrics = apertureMetrics.metrics;
            apertureMetrics.mask.clear();
            if (metrics.radius == 0) {
               throw new Error(model.defocusThresholdEstimationDidNotConverge);
            }
            defocusThreshold = Math.max(
               0,
               model.defocusSignalThresholdFactor * metrics.signal
            );
            controller.view.throwAbort();
         }

         apertureMetrics = frame.apertureMetrics(
            defocusThreshold, model.hotPixelRemovalRadius
         );
         metrics = apertureMetrics.metrics;
         apertureMetrics.mask.clear();
         if (metrics.radius == 0) {
            throw new Error(model.defocusThresholdEstimationDidNotConverge);
         }
         if (2 * metrics.radius < model.minimumDefocusDiameter) {
            throw new Error(model.defocusedImageDiameterTooSmall);
         }
         if (2 * metrics.radius > model.maximumDefocusDiameter) {
            throw new Error(model.defocusedImageDiameterTooLarge);
         }
         if (metrics.signal < model.minimumDefocusSignal) {
            throw new Error(model.defocusedImageSignalTooSmall);
         }
         if (metrics.signal > model.maximumDefocusSignal) {
            throw new Error(model.defocusedImageSignalTooLarge);
         }
         frame.clear();

         metrics.barycenter.x += cropFrameMetrics.metrics.translation.x;
         metrics.barycenter.y += cropFrameMetrics.metrics.translation.y;
         writeRegisteredFrameMetrics(
            metrics, defocusThreshold, effectiveFrameCount
         );
         console.flush();

         var defocusDiameterEstimate =
            2 * metrics.radius;
         var defocusDistanceEstimate =
            model.effectivePixelSize() *
            model.focalLength *
            defocusDiameterEstimate /
            model.apertureDiameter;

         this.view.measurementDefocusDistanceValue.text = format(
            " " + model.formatDefocusDistanceEstimate,
            model.scaleDefocusDistanceEstimate * defocusDistanceEstimate
         );
         this.view.measurementDefocusDiameterValue.text = format(
            " " + model.formatDefocusDiameter,
            model.scaleDefocusDiameter * defocusDiameterEstimate
         );
         this.view.measurementDefocusSignalValue.text = format(
            " " + model.formatDefocusSignal,
            model.scaleDefocusSignal * metrics.signal
         );
         this.view.measurementDefocusSignalElectronsValue.text = format(
            " " + model.formatDefocusSignalElectrons,
            model.scaleDefocusSignalElectrons * model.DNPerNormalizedUnit *
               model.gain * effectiveFrameCount * metrics.signal
         );
      }
      catch (exception) {
         this.resetOutputMeasurement();
         console.criticalln(exception);
         if (!(new RegExp("^abort")).test(exception)) {
            (new MessageBox(
               "<p><b>Error</b>: " + exception + "</p>" +
               "<p>Measurement aborted.</p>",
               TITLE,
               StdIcon_Error,
               StdButton_Ok
            )).execute();
         }
      };

      var endTime = new Date();
      console.writeln(
         format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime()))
      );
      console.flush();

      if (false) {
         console.writeln();
         console.writeln(
            "Matrix count: ", globalFrameRealCount,
            ", ", globalFrameComplexCount
         );
      }
      console.flush();
      console.hide();
      controller.view.disableAbort();
      controller.enableControls();
   };
}

function ExposureTabView(parent, model, controller) {
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

   this.addLabel = function(pane, text, toolTip) {
      var label = new Label(this);
      pane.add(label);

      label.setFixedWidth(this.labelWidth);
      label.text = text;
      label.toolTip = toolTip;
      label.textAlignment = TextAlign_Right | TextAlign_VertCenter;

      return label;
   };

   this.addUnits = function(pane, text) {
      var label = new Label(this);
      pane.add(label);

      label.setFixedWidth(this.unitWidth);
      label.text = text;
      label.textAlignment = TextAlign_Left | TextAlign_VertCenter;

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

   this.addValue = function(pane, text, toolTip) {
      var value = new Label(this);
      pane.add(value);

      value.setFixedWidth(this.editWidth);
      value.text = text;
      value.toolTip = toolTip;
      value.styleSheet = this.scaledStyleSheet("QLabel {" +
         "border-top: 1px solid gray;" +
         "border-left: 1px solid gray;" +
         "border-bottom: 1px solid white;" +
         "border-right: 1px solid white;" +
         "}");

      return value;
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

   this.addToolButton = function(pane, icon, toolTip, onMousePress) {
      var toolButton = new ToolButton(this);
      pane.add(toolButton);

      toolButton.icon = this.scaledResource(icon);
      toolButton.setScaledFixedSize(20, 20);
      toolButton.toolTip = toolTip;
      toolButton.onMousePress = onMousePress;

      return toolButton;
   };

   this.addViewList = function(pane, toolTip, onViewSelected) {
      var viewList = new ViewList(this);
      pane.add(viewList);

      viewList.getMainViews();
      viewList.toolTip = toolTip;
      viewList.onViewSelected = onViewSelected;

      return viewList;
   };

   this.sizer = new VerticalSizer();
   this.sizer.margin = 6;
   this.sizer.spacing = 6;

   this.labelWidth = this.parent.font.width("Observation bandwidth:");
#iflt __PI_BUILD__ 1168
   this.editWidth = this.parent.font.width("00000000000");
#else
   this.editWidth = this.parent.font.width("0000000000");
#endif
   this.unitWidth = this.parent.font.width("cycles per aperture diameter ");

   {
      this.estimateGroupBox = this.addGroupBox("Exposure estimation");

      this.defocusExposurePane = this.addPane(this.estimateGroupBox);

      this.defocusExposureLabel = this.addLabel(
         this.defocusExposurePane,
         "Defocus exposure:",
         "<p>The desired defocused image exposure in e-. Defocus exposure " +
         "must be between 1,000 and 100,000 e-.</p>"
      );

      this.defocusExposureEdit = this.addEdit(
         this.defocusExposurePane,
         format(
            model.formatDefocusExposure,
            model.scaleDefocusExposure * model.defocusExposure
         ),
         this.defocusExposureLabel.toolTip,
         function(text) {controller.defocusExposureOnTextUpdated(text);},
         function() {
            this.text = format(
               model.formatDefocusExposure,
               model.scaleDefocusExposure * model.defocusExposure
            );
         }
      );

      this.defocusExposureUnits = this.addUnits(
         this.defocusExposurePane,
         "e-"
      );

      this.defocusExposurePane.addStretch();

      this.estimateHelpButton = this.addToolButton(
         this.defocusExposurePane,
         ":/icons/comment.png",
         "<p>The exposure estimation tool provides parameters required to " +
         "achieve the specified defocused image exposure.</p>" +

         "<p><b>1.</b> Set the telescope, detector, and filter parameters " +
         "in the Parameters tab.</p>" +

         "<p><b>2.</b> Set the desired defocused image exposure to " +
         "approximately 50% of the detector's full-well capacity in e-.</p>" +

         "<p><b>3.</b> Set the observation bandwidth and click the Estimate " +
         "button.</p>" +

         "<p><b>4.</b> Adjust the corrugation resolution to achieve a " +
         "defocus distance within the available mechanical backfocus " +
         "adjustment range and a defocused image diameter between 48 and " +
         "320 pixels.</p>" +

         "<p><b>5.</b> Adjust the desired exposure time to achieve an " +
         "acceptable star apparent magnitude. Longer exposures are prefered " +
         "to average out the effects of atmospheric turbulence as long as " +
         "tracking errors remain negligible.</p>" +

         "<p><b>6.</b> If an acceptable star apparent magnitude cannot be " +
         "achieved, change the corrugation resolution and the desired " +
         "exposure time iteratively until an acceptable solution is " +
         "found.</p>" +

         "<p><b>7.</b> The solution is an estimate for achieving the " +
         "specified defocused image exposure. Factors affecting accuracy " +
         "include telescope optical efficiency, detector quantum " +
         "efficiency, filter transmissivity, star spectral type, and " +
         "atmospheric extinction variations. The actual exposure achieved " +
         "will vary and should be checked to verify that the median " +
         "exposure is at least 5% and at most 80% of the detector's " +
         "dynamic range, and that the brightest defocused image structures " +
         "lie within the linear operating region of the detector.</p>",
         function() {}
      );

      this.estimateObservationBandwidthPane = this.addPane(
         this.estimateGroupBox
      );

      this.estimateObservationBandwidthLabel = this.addLabel(
         this.estimateObservationBandwidthPane,
         "Observation bandwidth:",
         "<p>The bandwidth of the observation in nm.</p>"
      );

      this.observationBandwidthComboBox = this.addComboBox(
         this.estimateObservationBandwidthPane,
         [" ~300 nm L-bandwidth", " ~50 to 100 nm RGB-bandwidth"],
         model.observationBandwidth,
         this.estimateObservationBandwidthLabel.toolTip,
         function(item) {controller.observationBandwidthOnItemSelected(item);}
      );

      this.estimateObservationBandwidthPane.addStretch();

      this.corrugationResolutionPane = this.addPane(this.estimateGroupBox);

      this.corrugationResolutionLabel = this.addLabel(
         this.corrugationResolutionPane,
         "Corrugation resolution:",
         "<p>The maximum wavefront corrugation spatial frequency in cycles " +
         "per aperture diameter to be measured. Corrugation resolution " +
         "must be between 5 and 30 cycles per aperture diameter.</p>"
      );

      this.corrugationResolutionEdit = this.addEdit(
         this.corrugationResolutionPane,
         format(
            model.formatCorrugationResolution,
            model.scaleCorrugationResolution * model.corrugationResolution
         ),
         this.corrugationResolutionLabel.toolTip,
         function(text) {controller.corrugationResolutionOnTextUpdated(text);},
         function() {
            this.text = format(
               model.formatCorrugationResolution,
               model.scaleCorrugationResolution * model.corrugationResolution
            );
         }
      );

      this.corrugationResolutionUnits = this.addUnits(
         this.corrugationResolutionPane,
         "cycles per aperture diameter"
      );

      this.corrugationResolutionPane.addStretch();

      this.defocusDistanceEstimatePane = this.addPane(this.estimateGroupBox);

      this.defocusDistanceEstimateLabel = this.addLabel(
         this.defocusDistanceEstimatePane,
         "Defocus distance:",
         "<p>The required defocus distance in mm.</p>"
      );

      this.defocusDistanceEstimateValue = this.addValue(
         this.defocusDistanceEstimatePane,
         " -",
         this.defocusDistanceEstimateLabel.toolTip
      );

      this.defocusDistanceEstimateUnits = this.addUnits(
         this.defocusDistanceEstimatePane,
         "mm"
      );

      this.defocusDistanceEstimatePane.addStretch();

      this.defocusDiameterEstimatePane = this.addPane(this.estimateGroupBox);

      this.defocusDiameterEstimateLabel = this.addLabel(
         this.defocusDiameterEstimatePane,
         "Defocus diameter:",
         "<p>The required defocused image diameter in px.</p>"
      );

      this.defocusDiameterEstimateValue = this.addValue(
         this.defocusDiameterEstimatePane,
         " -",
         this.defocusDiameterEstimateLabel.toolTip
      );

      this.defocusDiameterEstimateUnits = this.addUnits(
         this.defocusDiameterEstimatePane,
         "px"
      );

      this.defocusDiameterEstimatePane.addStretch();

      this.exposureTimePane = this.addPane(this.estimateGroupBox);

      this.exposureTimeLabel = this.addLabel(
         this.exposureTimePane,
         "Exposure time:",
         "<p>The desired exposure time in seconds. Exposure time must be " +
         "between 0.1 and 1,000 seconds.</p>"
      );

      this.exposureTimeEdit = this.addEdit(
         this.exposureTimePane,
         format(
            model.formatExposureTime,
            model.scaleExposureTime * model.exposureTime
         ),
         this.exposureTimeLabel.toolTip,
         function(text) {controller.exposureTimeOnTextUpdated(text);},
         function() {
            this.text = format(
               model.formatExposureTime,
               model.scaleExposureTime * model.exposureTime
            );
         }
      );

      this.exposureTimeUnits = this.addUnits(
         this.exposureTimePane,
         "seconds"
      );

      this.exposureTimePane.addStretch();

      this.starMagnitudeEstimatePane = this.addPane(this.estimateGroupBox);

      this.starMagnitudeEstimateLabel = this.addLabel(
         this.starMagnitudeEstimatePane,
         "Star magnitude:",
         "<p>The required star apparent magnitude.</p>"
      );

      this.starMagnitudeEstimateValue = this.addValue(
         this.starMagnitudeEstimatePane,
         " -",
         this.starMagnitudeEstimateLabel.toolTip
      );

      this.starMagnitudeEstimateUnits = this.addUnits(
         this.starMagnitudeEstimatePane,
         "m"
      );

      this.starMagnitudeEstimatePane.addStretch();

      this.estimateCalculateButton = this.addPushButton(
         this.starMagnitudeEstimatePane,
         "Estimate",
         "<p>Estimate the exposure parameters.</p>" +

         "<p>To enable, set the telescope, detector, and filter parameters " +
         "in the Parameters tab.</p>",
         function() {controller.estimateCalculate();}
      );
   }

   this.unitWidth = this.parent.font.width("DN RMS ");

   {
      this.measurementGroupBox = this.addGroupBox("Exposure measurement");

      this.measurementViewListPane = this.addPane(this.measurementGroupBox);

      this.measurementViewList = this.addViewList(
         this.measurementViewListPane,
         "<p>The intra-focal or extra-focal frame view to measure.</p>" +

         "<p>The frame must be bias-subtracted and not otherwise " +
         "processed. Frames from color filter array detectors must not be " +
         "demosaiced.</p>",
         function(view) {controller.measurementViewListOnViewSelected(view);}
      );
      this.measurementViewListNullView = this.measurementViewList.currentView;

      this.measurementHelpButton = this.addToolButton(
         this.measurementViewListPane,
         ":/icons/comment.png",
         "<p>The exposure measurement tool measures the exposure parameters " +
         "of the selected frame view. The frame must be bias-subtracted and " +
         "not otherwise processed. Frames from color filter array detectors " +
         "must not be demosaiced.</p>" +

         "<p><b>1.</b> Set the telescope, detector, and filter parameters " +
         "in the Parameters tab.</p>" +

         "<p><b>2.</b> Select an intra-focal or extra-focal frame view and " +
         "click the Measure button. The frame must be bias-subtracted and " +
         "not otherwise processed. Frames from color filter array detectors " +
         "must not be demosaiced.</p>" +

         "<p><b>3.</b> The measured defocus distance, defocused image " +
         "diameter, and median defocused image exposure are displayed.</p>",
         function() {}
      );

      this.measurementDefocusDistancePane = this.addPane(
         this.measurementGroupBox
      );

      this.measurementDefocusDistanceLabel = this.addLabel(
         this.measurementDefocusDistancePane,
         "Defocus distance:",
         "<p>The measured defocus distance in mm.</p>"
      );

      this.measurementDefocusDistanceValue = this.addValue(
         this.measurementDefocusDistancePane,
         " -",
         this.measurementDefocusDistanceLabel.toolTip
      );

      this.measurementDefocusDistanceUnits = this.addUnits(
         this.measurementDefocusDistancePane,
         "mm"
      );

      this.measurementDefocusDistancePane.addStretch();

      this.measurementDefocusDiameterPane = this.addPane(
         this.measurementGroupBox
      );

      this.measurementDefocusDiameterLabel = this.addLabel(
         this.measurementDefocusDiameterPane,
         "Defocus diameter:",
         "<p>The measured defocused image diameter in px.</p>"
      );

      this.measurementDefocusDiameterValue = this.addValue(
         this.measurementDefocusDiameterPane,
         " -",
         this.measurementDefocusDiameterLabel.toolTip
      );

      this.measurementDefocusDiameterUnits = this.addUnits(
         this.measurementDefocusDiameterPane,
         "px"
      );

      this.measurementDefocusDiameterPane.addStretch();

      this.measurementDefocusSignalPane = this.addPane(
         this.measurementGroupBox
      );

      this.measurementDefocusSignalLabel = this.addLabel(
         this.measurementDefocusSignalPane,
         "Defocus exposure:",
         "<p>The measured median defocused image exposure in DN and e-.</p>"
      );

      this.measurementDefocusSignalValue = this.addValue(
         this.measurementDefocusSignalPane,
         " -",
         "<p>The measured median defocused image exposure in DN.</p>"
      );

      this.measurementDefocusSignalUnits = this.addUnits(
         this.measurementDefocusSignalPane,
         "DN"
      );

      this.measurementDefocusSignalElectronsValue = this.addValue(
         this.measurementDefocusSignalPane,
         " -",
         "<p>The measured median defocused image exposure in e-.</p>"
      );

      this.unitWidth = this.parent.font.width("e- ");

      this.measurementDefocusSignalElectronsUnits = this.addUnits(
         this.measurementDefocusSignalPane,
         "e-"
      );

      this.measurementDefocusSignalPane.addStretch();

      this.measurementCalculateButton = this.addPushButton(
         this.measurementDefocusSignalPane,
         "Measure",
         "<p>Measure the exposure parameters of the selected frame view.</p>" +

         "<p>To enable, set the telescope, detector, and filter parameters " +
         "in the Parameters tab and select a frame view.</p>",
         function() {controller.measurementCalculate();}
      );
   }

   this.sizer.addStretch();
}
ExposureTabView.prototype = new Frame;

// ****************************************************************************
// EOF ExposureTabViewController.js - Released 2016/12/30 00:00:00 UTC
