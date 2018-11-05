// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// SubframeSelectorEditDialog.js - Released 2018-11-05T16:53:08Z
// ----------------------------------------------------------------------------
//
// This file is part of SubframeSelector Script version 1.12
//
// Copyright (C) 2012-2018 Mike Schuster. All Rights Reserved.
// Copyright (C) 2003-2018 Pleiades Astrophoto S.L. All Rights Reserved.
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
// ----------------------------------------------------------------------------

function editSelectorExpressionDialogPrototype() {
   this.__base__ = Dialog;
   this.__base__();

   if (__PI_BUILD__ >= 990) {
      this.restyle();
   }

   var platformFontWidthFactor = corePlatform == "MSWindows" ? 1.0 : 1.3;
   var dialogMinWidth =
      Math.round(platformFontWidthFactor * 60.0 * this.font.width('M'));

   this.windowTitle = TITLE + "." + VERSION + ": Edit Subframe Approval Expression";

   this.expression = "";

   var expressionTextBox = new TextBox(this);
   with (expressionTextBox) {
      text = "<raw>" + this.expression.trim() + "</raw>";
   }
   this.expressionTextBox = expressionTextBox;
   var sizerMargin = this.logicalPixelsToPhysical(6);
   expressionTextBox.setMinWidth(dialogMinWidth - 2 * sizerMargin);
   expressionTextBox.adjustToContents();
   expressionTextBox.setFixedHeight(0.5 * expressionTextBox.height);

   var label = new Label(this);
   with (label) {
      margin = 4;
      useRichText = true;
      wordWrapping = true;
      text =
"<p>Subframe approval expression, a boolean combination of constraints. A blank " +
"expression will approve all subframes.</p>" +
"<i>approval</i> = [ <i>constraint</i> [ [ && | || ] <i>constraint</i> ]... ]<br>" +
"<i>constraint</i> = [ <i>weighting</i> [ &lt; | &gt; | &lt;= | &gt;= | == | != ] " +
"<i>weighting</i> | true | false | [ ! ] (<i>approval</i>) ]<br>" +
"<i>weighting</i> = <i>term</i> [ [ + | - | * | / | ^ ] <i>term</i> ]...<br>" +
"<i>term</i> = [ - ] [ <i>number</i> | <i>property</i> | (<i>weighting</i>) ]<br>" +
"<i>property</i> = [ Index | Weight | WeightSigma | FWHM | FWHMSigma | FWHMMaximum | FWHMMinimum | " +
"Eccentricity | EccentricitySigma | EccentricityMaximum | EccentricityMinimum | " +
"SNRWeight | SNRWeightSigma | SNRWeightMaximum | SNRWeightMinimum | Median | MedianSigma | " +
"MeanDeviation | MeanDeviationSigma | Noise | NoiseSigma | StarSupport | " +
"StarSupportSigma | StarResidual | StarResidualSigma | NoiseSupport | " +
"NoiseSupportSigma | FWHMMeanDev | FWHMMeanDevSigma | EccentricityMeanDev | " +
"EccenricityMeanDevSigma | StarResidualMeanDev | StarResidualMeanDevSigma ]";
   }

   var buttonPane = new HorizontalSizer;
   with (buttonPane) {
      spacing = 6;

      var parseButton = new PushButton(this);
      with (parseButton) {
         text = "Parse";
         onClick = function() {
            var selectorEvaluator = new selectorExpressionEvaluator(
               this.dialog.expressionTextBox.text,
               nullEvaluationDescription,
               [nullEvaluationDescription],
               parameters.actualSubframeScale(),
               parameters.actualCameraGain(),
               parameters.cameraResolutionValues[parameters.cameraResolution],
               nullEvaluationDescriptionStatistics
            );
            selectorEvaluator.evaluate();
            if (selectorEvaluator.error != null) {
               (new MessageBox(
                  "<p>Invalid subframe approval expression: " +
                     selectorEvaluator.error + "</p>",
                  TITLE + "." + VERSION,
                  StdIcon_Error,
                  StdButton_Ok
               )).execute();
            }
            else {
               (new MessageBox(
                  "<p>The subframe approval expression has no errors.</p>",
                  TITLE + "." + VERSION,
                  StdIcon_Information,
                  StdButton_Ok
               )).execute();
            }
         };
         toolTip = "<p>Parses the subframe approval expression for errors.</p>";
      }
      add(parseButton);
      addStretch();

      var okButton = new PushButton(this);
      with (okButton) {
         text = "OK";
         onClick = function() {
            this.dialog.expression = this.dialog.expressionTextBox.text.trim();
            this.dialog.ok();
         };
      };
      add(okButton);

      var cancelButton = new PushButton(this);
      with (cancelButton) {
         text = "Cancel";
         onClick = function() {
            this.dialog.cancel();
         };
      }
      add(cancelButton);
   }

   this.sizer = new VerticalSizer;
   with (this.sizer) {
      margin = 6;
      spacing = 6;
      add(expressionTextBox);
      addSpacing(4);
      add(label);
      addSpacing(4);
      addStretch();
      add(buttonPane);
   }

   this.setMinWidth(dialogMinWidth);
   this.adjustToContents();
   this.setFixedHeight();

   this.update = function() {
      this.expressionTextBox.text = "<raw>" + this.expression.trim() + "</raw>";
   };
}
editSelectorExpressionDialogPrototype.prototype = new Dialog;

function editWeightingExpressionDialogPrototype() {
   this.__base__ = Dialog;
   this.__base__();

   if (__PI_BUILD__ >= 990) {
      this.restyle();
   }

   var platformFontWidthFactor = corePlatform == "MSWindows" ? 1.0 : 1.3;
   var dialogMinWidth =
      Math.round(platformFontWidthFactor * 60.0 * this.font.width('M'));

   this.windowTitle = TITLE + "." + VERSION + ": Edit Subframe Weighting Expression";

   this.expression = "";

   var expressionTextBox = new TextBox(this);
   with (expressionTextBox) {
      text = "<raw>" + this.expression.trim() + "</raw>";
   }
   this.expressionTextBox = expressionTextBox;
   var sizerMargin = this.logicalPixelsToPhysical(6);
   expressionTextBox.setMinWidth(dialogMinWidth - 2 * sizerMargin);
   expressionTextBox.adjustToContents();
   expressionTextBox.setFixedHeight(0.5 * expressionTextBox.height);

   var label = new Label(this);
   with (label) {
      margin = 4;
      useRichText = true;
      wordWrapping = true;
      text =
"<p>Subframe weighting expression, an arithmetic combination of " +
"properties. A blank expression will assign a zero weight to all subframes.</p>" +
"<i>weighting</i> = [ <i>term</i> [ [ + | - | * | / | ^ ] <i>term</i> ]... ]<br>" +
"<i>term</i> = [ - ] [ <i>number</i> | <i>property</i> | (<i>weighting</i>) ]<br>" +
"<i>property</i> = [ Index | FWHM | FWHMSigma | FWHMMaximum | FWHMMinimum | " +
"Eccentricity | EccentricitySigma | EccentricityMaximum | EccentricityMinimum | " +
"SNRWeight | SNRWeightSigma | SNRWeightMaximum | SNRWeightMinimum | Median | MedianSigma | MeanDeviation | " +
"MeanDeviationSigma | Noise | NoiseSigma | StarSupport | StarSupportSigma | " +
"StarResidual | StarResidualSigma | NoiseSupport | NoiseSupportSigma | FWHMMeanDev | " +
"FWHMMeanDevSigma | EccentricityMeanDev | EccentricityMeanDevSigma | " +
"StarResidualMeanDev | StarResidualMeanDevSigma ]";
   }

   var buttonPane = new HorizontalSizer;
   with (buttonPane) {
      spacing = 6;

      var parseButton = new PushButton(this);
      with (parseButton) {
         text = "Parse";
         onClick = function() {
            var weightEvaluator = new weightingExpressionEvaluator(
               this.dialog.expressionTextBox.text,
               nullEvaluationDescription,
               [nullEvaluationDescription],
               parameters.actualSubframeScale(),
               parameters.actualCameraGain(),
               parameters.cameraResolutionValues[parameters.cameraResolution],
               nullEvaluationDescriptionStatistics
            );
            weightEvaluator.evaluate();
            if (weightEvaluator.error != null) {
               (new MessageBox(
                  "<p>Invalid subframe weighting expression: " +
                     weightEvaluator.error + "</p>",
                  TITLE + "." + VERSION,
                  StdIcon_Error,
                  StdButton_Ok
               )).execute();
            }
            else {
               (new MessageBox(
                  "<p>The subframe weighting expression has no errors.</p>",
                  TITLE + "." + VERSION,
                  StdIcon_Information,
                  StdButton_Ok
               )).execute();
            }
         };
         toolTip = "<p>Parses the subframe weighting expression for errors.</p>";
      }
      add(parseButton);
      addStretch();

      var okButton = new PushButton(this);
      with (okButton) {
         text = "OK";
         onClick = function() {
            this.dialog.expression = this.dialog.expressionTextBox.text.trim();
            this.dialog.ok();
         };
      };
      add(okButton);

      var cancelButton = new PushButton(this);
      with (cancelButton) {
         text = "Cancel";
         onClick = function() {
            this.dialog.cancel();
         };
      }
      add(cancelButton);
   }

   this.sizer = new VerticalSizer;
   with (this.sizer) {
      margin = 6;
      spacing = 6;
      add(expressionTextBox);
      addSpacing(4);
      add(label);
      addSpacing(4);
      addStretch();
      add(buttonPane);
   }

   this.setMinWidth(dialogMinWidth);
   this.adjustToContents();
   this.setFixedHeight();

   this.update = function() {
      this.expressionTextBox.text = "<raw>" + this.expression.trim() + "</raw>";
   };
}
editWeightingExpressionDialogPrototype.prototype = new Dialog;

// ----------------------------------------------------------------------------
// EOF SubframeSelectorEditDialog.js - Released 2018-11-05T16:53:08Z
