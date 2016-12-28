// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// WavefrontTabViewController.js - Released 2016/12/30 00:00:00 UTC
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

function WavefrontTabController(model, controller) {
   this.view = null;

   this.aberrationLabels = (new ZernikeAberrations()).aberrationLabels();

   this.setView = function(view) {
      this.view = view;
   };

   this.resetOutput = function() {
      this.view.defocusDistanceValue.text = " -";
      this.view.corrugationResolutionEstimateValue.text = " -";

      this.view.wavefrontErrorEstimateValue.text = " -";
      this.view.wavefrontErrorEstimateFractionValue.text = " -";

      this.view.strehlRatioEstimateValue.text = " -";

      this.view.strehlDiameterEstimateValue.text = " -";
      this.view.strehlDiameterAngleEstimateValue.text = " -";

      for (var i = 4; i != this.aberrationLabels.length; ++i) {
         var node = this.view.aberrationEstimateTreeBox.child(i - 4);
         node.setText(0, this.aberrationLabels[i]);
         node.setText(1, " -");
         node.setText(2, " -");
         node.setText(3, " -");
      }
   };

   this.reset = function() {
      model.aberrationOrdering = model.defaultAberrationOrdering;
      this.view.aberrationOrderingComboBox.currentItem =
         model.aberrationOrdering;
   };

   this.setWavefrontPane = function() {
      this.view.defocusDistanceValue.text = format(
         " " + model.formatDefocusDistanceEstimate,
         model.scaleDefocusDistanceEstimate * model.defocusDistanceEstimate
      );

      this.view.corrugationResolutionEstimateValue.text = format(
         " " + model.formatCorrugationResolutionEstimate,
         model.scaleCorrugationResolutionEstimate *
            model.corrugationResolutionEstimate
      );

      this.view.wavefrontErrorEstimateValue.text = format(
         " " + model.formatWavefrontErrorEstimate,
         model.scaleWavefrontErrorEstimate * model.wavefrontErrorEstimate
      );
      if (
         model.observationWavelength < 10000.0 * model.wavefrontErrorEstimate
      ) {
         this.view.wavefrontErrorEstimateFractionValue.text = format(
            " 1/" + model.formatWavefrontErrorEstimateFraction,
            model.observationWavelength / model.wavefrontErrorEstimate
         );
      }
      else {
         this.view.wavefrontErrorEstimateFractionValue.text = "0.0";
      }
   };

   this.setPointSpreadFunctionPane = function() {
      this.view.strehlRatioEstimateValue.text = format(
         " " + model.formatStrehlRatioEstimate,
         model.scaleStrehlRatioEstimate * model.strehlRatioEstimate
      );

      this.view.strehlDiameterEstimateValue.text = format(
         " " + model.formatStrehlDiameterEstimate,
         model.scaleStrehlDiameterEstimate * model.strehlDiameterEstimate
      );
      this.view.strehlDiameterAngleEstimateValue.text = format(
         " " + model.formatStrehlDiameterAngleEstimate,
         model.scaleStrehlDiameterAngleEstimate *
            model.strehlDiameterAngleEstimate
      );
   };

   this.setAberrationsPane = function() {
      var aberrations = new Array();
      for (var i = 4; i != this.aberrationLabels.length; ++i) {
         aberrations.push({
            name: this.aberrationLabels[i],
            value: model.aberrationCoefficientsEstimate[i]
         });
      }

      if (model.aberrationOrdering == model.magnitudeAberrationOrdering) {
         aberrations.sort(function(a, b) {
            return Math.abs(b.value) - Math.abs(a.value);}
         );
      };

      var totalAberrationVarianceEstimate = 0;
      for (var i = 4; i != this.aberrationLabels.length; ++i) {
         totalAberrationVarianceEstimate +=
            square(model.aberrationCoefficientsEstimate[i]);
      }

      var cumulativeAberrationVarianceEstimate = 0;
      for (var i = 4; i != this.aberrationLabels.length; ++i) {
         var aberration = aberrations[i - 4];
         var node = this.view.aberrationEstimateTreeBox.child(i - 4);
         cumulativeAberrationVarianceEstimate += square(aberration.value);
         node.setText(0, aberration.name);
         node.setText(1, format(
            model.formatAberrationCoefficientsEstimate,
            model.scaleAberrationCoefficientsEstimate * aberration.value
         ));
         node.setText(2, format(
            model.formatAberrationCoefficientsFVEEstimate,
            model.scaleAberrationCoefficientsFVEEstimate * (
               totalAberrationVarianceEstimate == 0 ? 0 :
                  square(aberration.value) / totalAberrationVarianceEstimate
            )
         ));
         node.setText(3, format(
            model.formatAberrationCoefficientsFVEEstimate,
            model.scaleAberrationCoefficientsFVEEstimate * (
               totalAberrationVarianceEstimate == 0 ? 0 :
                  cumulativeAberrationVarianceEstimate /
                     totalAberrationVarianceEstimate
            )
         ));
      }
   };

   this.disableControls = function() {
      this.view.aberrationOrderingComboBox.enabled = false;
   };

   this.enableControls = function() {
      this.view.aberrationOrderingComboBox.enabled = true;
   };

   this.aberrationOrderingOnItemSelected = function(item) {
      model.aberrationOrdering = item;
      if (this.view.aberrationEstimateTreeBox.child(0).text(1) != " -") {
         this.setAberrationsPane();
      }
   };
}

function WavefrontTabView(parent, model, controller) {
   this.__base__ = Frame;
   this.__base__(parent);

   this.aberrationLabels = (new ZernikeAberrations()).aberrationLabels();

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

   this.sizer = new VerticalSizer();
   this.sizer.margin = 6;
   this.sizer.spacing = 6;

   this.labelWidth = this.parent.font.width("Corrugation resolution:")
#iflt __PI_BUILD__ 1168
   this.editWidth = this.parent.font.width("00000000000");
#else
   this.editWidth = this.parent.font.width("0000000000");
#endif
   this.unitWidth = this.parent.font.width("DN RMS ");

#iflt __PI_BUILD__ 1168
   this.aberrationEstimateTreeBoxRows = 12.5;
#else
   this.aberrationEstimateTreeBoxRows = 11.5;
#endif

   {
      this.wavefrontEstimateGroupBox = this.addGroupBox("Wavefront estimate");

      this.defocusDistancePane = this.addPane(this.wavefrontEstimateGroupBox);

      this.defocusDistanceLabel = this.addLabel(
         this.defocusDistancePane,
         "Defocus distance:",
         "<p>The estimated defocus distance in mm.</p>"
      );

      this.defocusDistanceValue = this.addValue(
         this.defocusDistancePane,
         " -",
         this.defocusDistanceLabel.toolTip
      );

      this.defocusDistanceUnits = this.addUnits(
         this.defocusDistancePane,
         "mm"
      );

      this.defocusDistancePane.addStretch();

      this.corrugationResolutionEstimatePane = this.addPane(
         this.wavefrontEstimateGroupBox
      );

      this.corrugationResolutionEstimateLabel = this.addLabel(
         this.corrugationResolutionEstimatePane,
         "Corrugation resolution:",
         "<p>The maximum wavefront corrugation spatial frequency in cycles " +
         "per aperture diameter measured by the wavefront estimation.</p>"
      );

      this.corrugationResolutionEstimateValue = this.addValue(
         this.corrugationResolutionEstimatePane,
         " -",
         this.corrugationResolutionEstimateLabel.toolTip
      );

      this.corrugationResolutionEstimateUnits = this.addUnits(
         this.corrugationResolutionEstimatePane,
         "cycles per aperture diameter"
      );
      this.corrugationResolutionEstimateUnits.setVariableWidth();

      this.corrugationResolutionEstimatePane.addStretch();

      this.wavefrontErrorEstimatePane = this.addPane(
         this.wavefrontEstimateGroupBox
      );

      this.wavefrontErrorEstimateLabel = this.addLabel(
         this.wavefrontErrorEstimatePane,
         "Wavefront error:",
         "<p>The wavefront error in nm RMS and as a fraction of the " +
         "observation wavelength RMS.</p>"
      );

      this.wavefrontErrorEstimateValue = this.addValue(
         this.wavefrontErrorEstimatePane,
         " -",
         "<p>The wavefront error in nm RMS.</p>"
      );

      this.wavefrontErrorEstimateUnits = this.addUnits(
         this.wavefrontErrorEstimatePane,
         "nm RMS"
      );

      this.wavefrontErrorEstimatePane.addSpacing(12);

      this.wavefrontErrorEstimateFractionValue = this.addValue(
         this.wavefrontErrorEstimatePane,
         " -",
         "<p>The wavefront error as a fraction of the observation " +
         "wavelength RMS.</p>"
      );

      this.wavefrontErrorEstimateFractionUnits = this.addUnits(
         this.wavefrontErrorEstimatePane,
         "λ RMS"
      );

      this.wavefrontErrorEstimatePane.addStretch();

      this.strehlRatioEstimatePane = this.addPane(
         this.wavefrontEstimateGroupBox
      );

      this.strehlRatioEstimateLabel = this.addLabel(
         this.strehlRatioEstimatePane,
         "Strehl ratio:",
         "<p>The Strehl ratio at the observation wavelength, defined as the " +
         "ratio of the peak aberrated image exposure from a point source " +
         "compared to the maximum obtainable exposure using an ideal " +
         "optical system with the same aperture diameter, obstruction " +
         "diameter, and focal length limited only by diffraction over the " +
         "system's aperture.</p>" +

         "<p>The Strehl ratio indicates the degree of image quality in the " +
         "presence of wavefront aberrations. The conventional maximum " +
         "acceptable level of wavefront aberrations, the " +
         "<i>diffraction-limited</i> level, is set at 0.8."
      );

      this.strehlRatioEstimateValue = this.addValue(
         this.strehlRatioEstimatePane,
         " -",
         "<p>Ths Strehl ratio at the observation wavelength.</p>"
      );

      this.strehlRatioEstimateUnits = this.addUnits(
         this.strehlRatioEstimatePane,
         ""
      );

      this.strehlRatioEstimatePane.addStretch();

      this.strehlDiameterEstimatePane = this.addPane(
         this.wavefrontEstimateGroupBox
      );

      this.strehlDiameterEstimateLabel = this.addLabel(
         this.strehlDiameterEstimatePane,
         "Strehl diameter:",
         "<p>The Strehl diameter at the observation wavelength in μm and in " +
         "arcseconds, defined as the diameter of a uniformly illuminated " +
         "disk with the same peak exposure and the same total energy as " +
         "the aberrated point spread function.</p>"
      );

      this.strehlDiameterEstimateValue = this.addValue(
         this.strehlDiameterEstimatePane,
         " -",
         "<p>The Strehl diameter at the observation wavelength in μm.</p>"
      );

      this.strehlDiameterEstimateUnits = this.addUnits(
         this.strehlDiameterEstimatePane,
         "μm"
      );

      this.strehlDiameterEstimatePane.addSpacing(12);

      this.strehlDiameterAngleEstimateValue = this.addValue(
         this.strehlDiameterEstimatePane,
         " -",
         "<p>The Strehl diameter at the observation wavelength in " +
         "arcseconds.</p>"
      );

      this.strehlDiameterAngleEstimateUnits = this.addUnits(
         this.strehlDiameterEstimatePane,
         "arcsec"
      );

      this.strehlDiameterEstimatePane.addStretch();
   }

   this.labelWidth = this.parent.font.width("Corrugation resolution:")

   {
      this.aberrationEstimateGroupBox = this.addGroupBox(
         "Aberration estimate"
      );
      this.aberrationEstimateGroupBox.toolTip =
         "<p>A table of orthogonal Zernike aberration polynomial " +
         "coefficients in nm RMS, the fraction of wavefront error variance " +
         "explained (FVE) by the coefficients, and the cumulative fraction " +
         "of wavefront error variance explained (CVE) by the " +
         "coefficients.</p>" +

         "<p>The table shows the coefficients of a least squares fit of a " +
         "system of 18 circular or annular Zernike aberration polynomials " +
         "Z5, Z6, ..., and Z22 to the estimated wavefront. Circular " +
         "polynomials are used for unobstructed telescopes, and annular " +
         "polynomials are used for obstructed telescopes. The residual RMS " +
         "error not explained by the least squares fit is given in the " +
         "residual aberration row.</p>" +

         "<p>Zernike polynomials are labeled Z<i>S</i> (<i>n</i>, " +
         "<i>m</i>), where <i>S</i> is Noll's sequential index, <i>n</i> " +
         "is the polynomial order, and <i>m</i> is the angular frequency. " +
         "The estimated wavefront is orthogonal to polynomials Z1, Z2, Z3, " +
         "and Z4.</p>";

      this.aberrationEstimateTreeBox = new TreeBox(this);
      this.aberrationEstimateGroupBox.sizer.add(
         this.aberrationEstimateTreeBox
      );

      this.aberrationEstimateTreeBox.alternateRowColor = true;
      this.aberrationEstimateTreeBox.headerVisible = true;
      this.aberrationEstimateTreeBox.horizontalScrollBarVisible = false;
      this.aberrationEstimateTreeBox.indentSize = 0;
      this.aberrationEstimateTreeBox.multipleSelection = false;
      this.aberrationEstimateTreeBox.numberOfColumns = 5;
      this.aberrationEstimateTreeBox.setHeaderText(0, "Zernike aberration");
      this.aberrationEstimateTreeBox.setHeaderAlignment(
         0, TextAlign_Left | TextAlign_VertCenter
      );
      this.aberrationEstimateTreeBox.setHeaderText(1, "nm RMS");
      this.aberrationEstimateTreeBox.setColumnWidth(1, this.editWidth);
      this.aberrationEstimateTreeBox.setHeaderAlignment(
         1, TextAlign_Right | TextAlign_VertCenter
      );
      this.aberrationEstimateTreeBox.setHeaderText(2, "% FVE");
      this.aberrationEstimateTreeBox.setColumnWidth(2, this.editWidth);
      this.aberrationEstimateTreeBox.setHeaderAlignment(
         2, TextAlign_Right | TextAlign_VertCenter
      );
      this.aberrationEstimateTreeBox.setHeaderText(3, "% CVE");
      this.aberrationEstimateTreeBox.setColumnWidth(3, this.editWidth);
      this.aberrationEstimateTreeBox.setHeaderAlignment(
         3, TextAlign_Right | TextAlign_VertCenter
      );
      this.aberrationEstimateTreeBox.setHeaderText(4, "");
      this.aberrationEstimateTreeBox.setFixedHeight(
         this.treeBoxHeight(
            this.aberrationEstimateTreeBox,
            true,
            this.aberrationEstimateTreeBoxRows,
            false
         )
      );

      for (var i = 4; i != this.aberrationLabels.length; ++i) {
         var node = new TreeBoxNode(this.aberrationEstimateTreeBox);
         node.selectable = false;
         node.setText(0, this.aberrationLabels[i]);
         node.setText(1, " -");
         node.setAlignment(1, Align_Right);
         node.setText(2, " -");
         node.setAlignment(2, Align_Right);
         node.setText(3, " -");
         node.setAlignment(3, Align_Right);
      }
      this.aberrationEstimateTreeBox.adjustColumnWidthToContents(0);

      this.aberrationOrderingPane = this.addPane(
         this.aberrationEstimateGroupBox
      );

      this.aberrationOrderingPane.addStretch();

      this.aberrationOrderingLabel = this.addLabel(
         this.aberrationOrderingPane,
         "Sort rows by:",
         "<p>The ordering of the rows in the Zernike aberration polynomial " +
         "table.</p>" +

         "<p><b>Name</b>. Sorts the rows by the name of the aberration " +
         "polynomial.</p>" +

         "<p><b>Magnitude</b>. Sorts the rows by the magnitude of the " +
         "aberration polynomial coefficient.</p>"
      );
      this.aberrationOrderingLabel.setVariableWidth();

      this.aberrationOrderingComboBox = this.addComboBox(
         this.aberrationOrderingPane,
         [" Name", " Magnitude"],
         model.aberrationOrdering,
         this.aberrationOrderingLabel.toolTip,
         function(item) {controller.aberrationOrderingOnItemSelected(item);}
      );
   }

   this.sizer.addStretch();
}
WavefrontTabView.prototype = new Frame;

// ****************************************************************************
// EOF WavefrontTabViewController.js - Released 2016/12/30 00:00:00 UTC
