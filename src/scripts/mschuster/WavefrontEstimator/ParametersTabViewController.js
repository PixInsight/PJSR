// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// ParametersTabViewController.js - Released 2016/12/30 00:00:00 UTC
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

function ParametersTabController(model, controller) {
   this.view = null;

   this.setView = function(view) {
      this.view = view;
   };

   this.resetOutput = function() {
   };

   this.reset = function() {
      model.apertureDiameter = model.defaultApertureDiameter;
      this.view.apertureDiameterEdit.text = format(
         model.formatApertureDiameter,
         model.scaleApertureDiameter * model.apertureDiameter
      );

      model.focalLength = model.defaultFocalLength;
      this.view.focalLengthEdit.text = format(
         model.formatApertureDiameter,
         model.scaleFocalLength * model.focalLength
      );

      model.detectorType = model.defaultDetectorType;
      this.view.detectorTypeComboBox.currentItem = model.detectorType;

      model.gain = model.defaultGain;
      this.view.gainEdit.text = format(
         model.formatGain,
         model.scaleGain * model.gain
      );

      model.pixelSize = model.defaultPixelSize;
      this.view.pixelSizeEdit.text = format(
         model.formatPixelSize,
         model.scalePixelSize * model.pixelSize
      );

      model.observationWavelength = model.defaultObservationWavelength;
      this.view.observationWavelengthEdit.text = format(
         model.formatObservationWavelength,
         model.scaleObservationWavelength * model.observationWavelength
      );

      model.rejectionMethod = model.defaultRejectionMethod;
      this.view.rejectionMethodComboBox.currentItem = model.rejectionMethod;

      model.rejectionScale = model.defaultRejectionScale;
      this.view.rejectionScaleEdit.text =
         model.rejectionMethod == model.noRejectionMethod ? "-" : format(
            model.formatRejectionScale,
            model.scaleRejectionScale * model.rejectionScale
         );

      model.identifierPrefix = model.defaultIdentifierPrefix;
      this.view.identifierPrefixEdit.text = model.identifierPrefix;

      model.fringeCountScale = model.defaultFringeCountScale;
      this.view.fringeCountScaleEdit.text =
         format(
            model.formatFringeCountScale,
            model.scaleFringeCountScale * model.fringeCountScale
         );

      model.generateViews = model.defaultGenerateViews;
      this.view.generateViewsCheckBox.checked = model.generateViews;
   };

   this.disableControls = function() {
      this.view.apertureDiameterEdit.enabled = false;
      this.view.focalLengthEdit.enabled = false;

      this.view.detectorTypeComboBox.enabled = false;
      this.view.gainEdit.enabled = false;
      this.view.pixelSizeEdit.enabled = false;

      this.view.observationWavelengthEdit.enabled = false;
      this.view.observationWavelengthTypicalValuesComboBox.enabled = false;

      this.view.rejectionMethodComboBox.enabled = false;
      this.view.rejectionScaleEdit.enabled = false;

      this.view.identifierPrefixEdit.enabled = false;
      this.view.fringeCountScaleEdit.enabled = false;
      this.view.generateViewsCheckBox.enabled = false;
   };

   this.enableControls = function() {
      this.view.apertureDiameterEdit.enabled = true;
      this.view.focalLengthEdit.enabled = true;

      this.view.detectorTypeComboBox.enabled = true;
      this.view.gainEdit.enabled = true;
      this.view.pixelSizeEdit.enabled = true;

      this.view.observationWavelengthEdit.enabled = true;
      this.view.observationWavelengthTypicalValuesComboBox.enabled = true;

      this.view.rejectionMethodComboBox.enabled = true;
      this.view.rejectionScaleEdit.enabled =
         model.rejectionMethod == model.scaleRejectionMethod;

      this.view.identifierPrefixEdit.enabled = true;
      this.view.fringeCountScaleEdit.enabled = true;
      this.view.generateViewsCheckBox.enabled = true;
   };

   this.apertureDiameterOnTextUpdated = function(text) {
      model.apertureDiameter = defaultNumeric(
         parseFloat(text) / model.scaleApertureDiameter,
         model.minimumApertureDiameter,
         model.maximumApertureDiameter,
         model.defaultApertureDiameter
      );
      controller.resetOutput();
      controller.enableControls();
   };

   this.focalLengthOnTextUpdated = function(text) {
      model.focalLength = defaultNumeric(
         parseFloat(text) / model.scaleFocalLength,
         model.minimumFocalLength,
         model.maximumFocalLength,
         model.defaultFocalLength
      );
      controller.resetOutput();
      controller.enableControls();
   };

   this.detectorTypeOnItemSelected = function(item) {
      model.detectorType = item;
      controller.resetOutput();
      controller.enableControls();
   };

   this.gainOnTextUpdated = function(text) {
      model.gain = defaultNumeric(
         parseFloat(text) / model.scaleGain,
         model.minimumGain,
         model.maximumGain,
         model.defaultGain
      );
      controller.resetOutput();
      controller.enableControls();
   };

   this.pixelSizeOnTextUpdated = function(text) {
      model.pixelSize = defaultNumeric(
         parseFloat(text) / model.scalePixelSize,
         model.minimumPixelSize,
         model.maximumPixelSize,
         model.defaultPixelSize
      );
      controller.resetOutput();
      controller.enableControls();
   };

   this.observationWavelengthOnTextUpdated = function(text) {
      model.observationWavelength = defaultNumeric(
         parseFloat(text) /  model.scaleObservationWavelength,
         model.minimumObservationWavelength,
         model.maximumObservationWavelength,
         model.defaultObservationWavelength
      );
      controller.resetOutput();
      controller.enableControls();
   };

   this.observationWavelengthTypicalValuesOnItemSelected = function(item) {
      this.view.observationWavelengthTypicalValuesComboBox.currentItem = 0;
      if (item != 0) {
         model.observationWavelength =
            this.view.observationWavelengthTypicalValues[item][1];
         this.view.observationWavelengthEdit.text = format(
            model.formatObservationWavelength,
            model.scaleObservationWavelength * model.observationWavelength
         );
         controller.resetOutput();
         controller.enableControls();
      }
   };

   this.rejectionMethodOnItemSelected = function(item) {
      model.rejectionMethod = item;

      this.view.rejectionScaleEdit.text =
         model.rejectionMethod == model.noRejectionMethod ? "-" : format(
            model.formatRejectionScale,
            model.scaleRejectionScale * model.rejectionScale
         );
      this.view.rejectionScaleEdit.enabled =
         model.rejectionMethod == model.scaleRejectionMethod;
      controller.resetOutput();
      controller.enableControls();
   };

   this.rejectionScaleOnTextUpdated = function(text) {
      model.rejectionScale = defaultNumeric(
         parseFloat(text) / model.scaleRejectionScale,
         model.minimumRejectionScale,
         model.maximumRejectionScale,
         model.defaultRejectionScale
      );
      controller.resetOutput();
      controller.enableControls();
   };

   this.identifierPrefixOnTextUpdated = function(text) {
      model.identifierPrefix = text;
      controller.resetOutput();
      controller.enableControls();
   };

   this.fringeCountScaleOnTextUpdated = function(text) {
      model.fringeCountScale = defaultNumeric(
         parseFloat(text) / model.scaleFringeCountScale,
         model.minimumFringeCountScale,
         model.maximumFringeCountScale,
         model.defaultFringeCountScale
      );
      controller.resetOutput();
      controller.enableControls();
   };

   this.generateViewsOnCheck = function(checked) {
      model.generateViews = checked;
      controller.resetOutput();
      controller.enableControls();
   };
}

function ParametersTabView(parent, model, controller) {
   this.__base__ = Frame;
   this.__base__(parent);

   // Gives observation wavelength typical values.
   this.observationWavelengthTypicalValues = new Array(
      new Array(" Wavelengths:", 0),
      new Array(" L-band", 546.0e-9),
      new Array(" R-band", 656.0e-9),
      new Array(" G-band", 526.0e-9),
      new Array(" B-band", 456.0e-9)
   );

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

   this.labelWidth = this.parent.font.width("Observation wavelength:");
#iflt __PI_BUILD__ 1168
   this.editWidth = this.parent.font.width("00000000000");
#else
   this.editWidth = this.parent.font.width("0000000000");
#endif
   this.unitWidth = this.parent.font.width("DN RMS ");

   {
      this.telescopeGroupBox = this.addGroupBox("Telescope");

      this.apertureDiameterPane = this.addPane(this.telescopeGroupBox);

      this.apertureDiameterLabel = this.addLabel(
         this.apertureDiameterPane,
         "Aperture diameter:",
         "<p>The aperture diameter of the telescope in mm. Aperture " +
         "diameter must be at most 1,000 mm.</p>"
      );

      this.apertureDiameterEdit = this.addEdit(
         this.apertureDiameterPane,
         format(
            model.formatApertureDiameter,
            model.scaleApertureDiameter * model.apertureDiameter
         ),
         this.apertureDiameterLabel.toolTip,
         function(text) {controller.apertureDiameterOnTextUpdated(text);},
         function() {
            this.text = format(
               model.formatApertureDiameter,
               model.scaleApertureDiameter * model.apertureDiameter
            );
         }
      );

      this.apertureDiameterUnits = this.addUnits(
         this.apertureDiameterPane,
         "mm"
      );

      this.apertureDiameterPane.addStretch();

      this.focalLengthPane = this.addPane(this.telescopeGroupBox);

      this.focalLengthLabel = this.addLabel(
         this.focalLengthPane,
         "Focal length:",
         "<p>The focal length of the telescope in mm. Focal length must be " +
         "at most 10,000 mm.</p>"
      );

      this.focalLengthEdit = this.addEdit(
         this.focalLengthPane,
         format(
            model.formatApertureDiameter,
            model.scaleFocalLength * model.focalLength
         ),
         this.focalLengthLabel.toolTip,
         function(text) {controller.focalLengthOnTextUpdated(text);},
         function() {
            this.text = format(
               model.formatApertureDiameter,
               model.scaleFocalLength * model.focalLength
            );
         }
      );

      this.focalLengthUnits = this.addUnits(
         this.focalLengthPane,
         "mm"
      );

      this.focalLengthPane.addStretch();
   }

   {
      this.detectorGroupBox = this.addGroupBox("Detector");

      this.detectorTypePane = this.addPane(this.detectorGroupBox);

      this.detectorTypeLabel = this.addLabel(
         this.detectorTypePane,
         "Detector type:",
         "<p>The type of the detector, either monochrome or color filter " +
         "array.</p>"
      );

      this.detectorTypeComboBox = this.addComboBox(
         this.detectorTypePane,
         [" Monochrome", " Color filter array"],
         model.detectorType,
         this.detectorTypeLabel.toolTip,
         function(item) {controller.detectorTypeOnItemSelected(item);}
      );

      this.detectorTypePane.addStretch();

      this.gainPane = this.addPane(this.detectorGroupBox);

      this.gainLabel = this.addLabel(
         this.gainPane,
         "Gain:",
         "<p>The gain of the detector in e-/DN. Gain must be at most " +
         "100 e-/DN.</p>" +

         "<p>If detector binning is used for the observation, gain must be " +
         "set to the detector's binned gain.</p>" +

         "<p>If the detector supports multiple ISO values, gain must be set " +
         "to the gain of the observation ISO.</p>"
      );

      this.gainEdit = this.addEdit(
         this.gainPane,
         format(
            model.formatGain,
            model.scaleGain * model.gain
         ),
         this.gainLabel.toolTip,
         function(text) {controller.gainOnTextUpdated(text);},
         function() {
            this.text = format(
               model.formatGain,
               model.scaleGain * model.gain
            );
         }
      );

      this.gainUnits = this.addUnits(
         this.gainPane,
         "e-/DN"
      );

      this.gainPane.addStretch();

      this.pixelSizePane = this.addPane(this.detectorGroupBox);

      this.pixelSizeLabel = this.addLabel(
         this.pixelSizePane,
         "Pixel size:",
         "<p>The pixel size of the detector in μm. Pixel size must be at " +
         "most 50 μm.</p>" +

         "<p>If detector binning is used for the observation, pixel size " +
         "must be set to the detector's binned pixel size.</p>"
      );

      this.pixelSizeEdit = this.addEdit(
         this.pixelSizePane,
         format(
            model.formatPixelSize,
            model.scalePixelSize * model.pixelSize
         ),
         this.pixelSizeLabel.toolTip,
         function(text) {controller.pixelSizeOnTextUpdated(text);},
         function() {
            this.text = format(
               model.formatPixelSize,
               model.scalePixelSize * model.pixelSize
            );
         }
      );

      this.pixelSizeUnits = this.addUnits(
         this.pixelSizePane,
         "μm"
      );

      this.pixelSizePane.addStretch();
   }

   {
      this.filterGroupBox = this.addGroupBox("Filter");

      this.observationWavelengthPane = this.addPane(this.filterGroupBox);

      this.observationWavelengthLabel = this.addLabel(
         this.observationWavelengthPane,
         "Observation wavelength:",
         "<p>The wavelength of the observation in nm, typically equal to " +
         "the central wavelength of the observation band. Observation " +
         "wavelength must be between 300 and 800 nm.</p>"
      );

      this.observationWavelengthEdit = this.addEdit(
         this.observationWavelengthPane,
         format(
            model.formatObservationWavelength,
            model.scaleObservationWavelength * model.observationWavelength
         ),
         this.observationWavelengthLabel.toolTip,
         function(text) {controller.observationWavelengthOnTextUpdated(text);},
         function() {
            this.text = format(
               model.formatObservationWavelength,
               model.scaleObservationWavelength * model.observationWavelength
            );
         }
      );

      this.observationWavelengthUnits = this.addUnits(
         this.observationWavelengthPane,
         "nm"
      );

      this.observationWavelengthPane.addSpacing(6);

      var items = new Array();
      for (
         var i = 0;
         i != this.observationWavelengthTypicalValues.length;
         ++i
      ) {
         items.push(
            this.observationWavelengthTypicalValues[i][0] +
            format(
               i == 0 ? "" : " " + model.formatObservationWavelength + " nm",
               model.scaleObservationWavelength *
                  this.observationWavelengthTypicalValues[i][1]
            )
         );
      }
      this.observationWavelengthTypicalValuesComboBox = this.addComboBox(
         this.observationWavelengthPane,
         items,
         0,
         "<p>Typical observation wavelengths for selected filters in nm.</p>",
         function(item) {
            controller.observationWavelengthTypicalValuesOnItemSelected(item);
         }
      );

      this.observationWavelengthPane.addStretch();
   }

   {
      this.frameCombinationGroupBox = this.addGroupBox("Frame combination");

      this.rejectionMethodPane = this.addPane(this.frameCombinationGroupBox);

      this.rejectionMethodLabel = this.addLabel(
         this.rejectionMethodPane,
         "Rejection method:",
         "<p>The pixel rejection method used to exclude outliers from the " +
         "set of pixels that are to be combined.</p>" +

         "<p><b>No rejection</b>. No pixel rejection will be performed.</p>" +

         "<p><b>Scale rejection</b>. Pixels whose distance from the pixel " +
         "set location exceeds a prescribed value in pixel set scale units " +
         "are rejected. The location and scale measures are defined by the " +
         "median and the Rousseeuw/Croux S<sub>n</sub> scale parameter. " +
         "The scale rejection method requires a set of 5 or more frames.</p>"
      );

      this.rejectionMethodComboBox = this.addComboBox(
         this.rejectionMethodPane,
         [" No rejection", " Scale rejection"],
         model.rejectionMethod,
         this.rejectionMethodLabel.toolTip,
         function(item) {controller.rejectionMethodOnItemSelected(item);}
      );

      this.rejectionMethodPane.addStretch();

      this.rejectionScalePane = this.addPane(this.frameCombinationGroupBox);

      this.rejectionScaleLabel = this.addLabel(
         this.rejectionScalePane,
         "Rejection scale:",
         "<p>The pixel outlier rejection coefficient, in units of the scale " +
         "of the set of pixels to be combined. Pixels whose distance from " +
         "the pixel set location exceeds the product of the coefficient and " +
         "the pixel set scale will be rejected. Rejection scale must be " +
         "between 0.5 and 5.</p>"
      );

      this.rejectionScaleEdit = this.addEdit(
         this.rejectionScalePane,
         model.rejectionMethod == model.noRejectionMethod ? "-" : format(
            model.formatRejectionScale,
            model.scaleRejectionScale * model.rejectionScale
         ),
         this.rejectionScaleLabel.toolTip,
         function(text) {controller.rejectionScaleOnTextUpdated(text);},
         function() {
            this.text = format(
               model.formatRejectionScale,
               model.scaleRejectionScale * model.rejectionScale
            );
         }
      );

      this.rejectionScalePane.addStretch();
   }

   {
      this.visualizationGroupBox = this.addGroupBox("Visualization");

      this.identifierPrefixPane = this.addPane(this.visualizationGroupBox);

      this.identifierPrefixLabel = this.addLabel(
         this.identifierPrefixPane,
         "Identifier prefix:",
         "<p>A prefix that will be prepended to all output view identifiers " +
         "and file names.</p>"
      );

      this.identifierPrefixEdit = this.addEdit(
         this.identifierPrefixPane,
         model.identifierPrefix,
         this.identifierPrefixLabel.toolTip,
         function(text) {controller.identifierPrefixOnTextUpdated(text);},
         function() {}
      );
      this.identifierPrefixEdit.setVariableWidth();

      this.fringeCountScalePane = this.addPane(this.visualizationGroupBox);

      this.fringeCountScaleLabel = this.addLabel(
         this.fringeCountScalePane,
         "Fringe count scale:",
         "<p>The interferogram fringe count scaling coefficient. Set the " +
         "coefficient to a value less than (or greater than) 1 to reduce " +
         "(or increase) the number of fringes in interferograms. Fringe " +
         "count scale must be between 0.25 and 4.</p>" +

         "<p>The number of fringes equals the product of the coefficient " +
         "and the estimated corrugation resolution, rounded to an even " +
         "integer.</p>"
      );

      this.fringeCountScaleEdit = this.addEdit(
         this.fringeCountScalePane,
         format(
            model.formatFringeCountScale,
            model.scaleFringeCountScale * model.fringeCountScale
         ),
         this.fringeCountScaleLabel.toolTip,
         function(text) {controller.fringeCountScaleOnTextUpdated(text);},
         function() {
            this.text = format(
               model.formatFringeCountScale,
               model.scaleFringeCountScale * model.fringeCountScale
            );
         }
      );

      this.fringeCountScalePane.addStretch();

      this.generateViewsPane = this.addPane(this.visualizationGroupBox);

      this.generateViewsPane.addUnscaledSpacing(this.labelWidth);

      this.generateViewsPane.addSpacing(this.generateViewsPane.spacing);

      this.generateViewsCheckBox = this.addCheckBox(
         this.generateViewsPane,
         "Generate views",
         "<p>If this option is enabled, views of output images and plots " +
         "will be generated.</p>",
         model.generateViews,
         function(checked) {controller.generateViewsOnCheck(checked);}
      );

      this.generateViewsPane.addStretch();
   }

   this.sizer.addStretch();
}
ParametersTabView.prototype = new Frame;

// ****************************************************************************
// EOF ParametersTabViewController.js - Released 2016/12/30 00:00:00 UTC
