// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// SubframeSelectorParametersDialog.js - Released 2018-11-05T16:53:08Z
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

function parametersDialogPrototype() {
   this.__base__ = Dialog;
   this.__base__();

   this.displayPixelRatio;

   this.normalCheckedColor = 0xffffffff;
   this.alternateCheckedColor = 0xfff6f6f6;
   this.normalUncheckedColor = 0xffd0d0b8;
   this.alternateUncheckedColor = 0xffe0e0c8;

   this.unlockIcon = new Bitmap(8, 9);
   this.unlockIcon.fill(0x00000000);
   this.lockIcon = new Bitmap(8, 9);
   this.lockIcon.fill(0x00000000);
   var graphics = new Graphics(this.lockIcon);
   with (graphics) {
      antialiasing = false;
      pen = new Pen(0xff000000, 2);
      drawLine(0, 5, 8, 5);
      end();
   }

   this.expressionBitmapSize = this.logicalPixelsToPhysical( 15 );
   this.validExpressionBitmap =
      new Bitmap(this.expressionBitmapSize, this.expressionBitmapSize);
   this.validExpressionBitmap.fill(0x00000000);

   this.invalidExpressionBitmap =
      new Bitmap(this.expressionBitmapSize, this.expressionBitmapSize);
   this.invalidExpressionBitmap.fill(0x00000000);
   var graphics = new Graphics(this.invalidExpressionBitmap);
   with (graphics) {
      antialiasing = true;
      transparentBackground = true;
      pen = new Pen(Color.rgbaColor(128, 32, 32, 255), 3);
      var s = this.expressionBitmapSize;
      drawLine(0, 0, s, s);
      drawLine(0, s, s, 0);
      end();
   }

   var platformFontWidthFactor = 1.0;
   var dialogMinWidth =
      Math.round(platformFontWidthFactor * 45.0 * this.font.width('M'));

   this.propertyPlotBitmapBoxHeight = 300;

   this.windowTitle = TITLE;

   this.measureProcess = false;
   this.outputMapsProcess = false;
   this.outputSubframesProcess = false;
   this.outputPropertyPlotsProcess = false;
   this.outputPropertyPlotsFilePath = null;

   this.dialog.onEditCompletedActive = false;

   var sizerMargin = 6;

   var targetSubframesSectionBar = new SectionBar( this, "Target Subframes");

   var targetSubframesSection = new Control(this);
   with (targetSubframesSection) {
      sizer = new HorizontalSizer;
      with (sizer) {
         spacing = 6;

         var treeBox = new TreeBox(this);
         with (treeBox) {
            alternateRowColor = false;
            headerVisible = false;
            indentSize = 0;
            multipleSelection = true;
            numberOfColumns = 1; //2;

            setHeaderText(0, "");
            setHeaderAlignment(0, Align_Left | TextAlign_VertCenter);
            //setHeaderText(1, "");
            //setHeaderAlignment(1, Align_Left | TextAlign_VertCenter);
            //setColumnWidth(1, 0);
            //hideColumn(1);

            onNodeSelectionUpdated = function() {
               targetSubframesSelectionUpdated(this.dialog);
            };
            onNodeUpdated = function() {
               targetSubframesNodeUpdated(this.dialog);
            };
         }
         var treeBoxRows = 10;
         treeBox.setMinHeight(
            this.displayPixelRatio * treeBoxRows * (treeBox.font.lineSpacing + 6) +
            treeBox.borderWidth
         );
         add(treeBox);
         this.targetSubframesTreeBox = treeBox;

         var controlPane = new VerticalSizer;
         with (controlPane) {
            spacing = 6;

            var addFilesButton = new PushButton(this);
            with (addFilesButton) {
               text = "Add Files...";
               onClick = function() {
                  targetSubframesAddFiles(this.dialog);
               };
               toolTip =
"<p>Add existing subframe files to the list of target subframes.</p>";
            }
            add(addFilesButton);
            this.targetSubframesAddFilesButton = addFilesButton;

            var toggleSelectedButton = new PushButton(this);
            with (toggleSelectedButton) {
               text = "Toggle Selected";
               onClick = function() {
                  targetSubframesToggleSelected(this.dialog);
               };
               toolTip =
"<p>Toggle the checked/unchecked state of the current selection of target " +
"subframes.</p>" +
"<p>Unchecked target subframes will be ignored during the measurement and output " +
"processes.</p>";
            }
            add(toggleSelectedButton);
            this.targetSubframesToggleSelectedButton = toggleSelectedButton;

            var removeSelectedButton = new PushButton(this);
            with (removeSelectedButton) {
               text = "Remove Selected";
               onClick = function() {
                  targetSubframesRemoveSelected(this.dialog);
               };
               toolTip =
"<p>Remove the current selection of target subframes.</p>"
            }
            add(removeSelectedButton);
            this.targetSubframesRemoveSelectedButton = removeSelectedButton;

            var clearButton = new PushButton(this);
            with (clearButton) {
               text = "Clear";
               onClick = function() {
                  targetSubframesClear(this.dialog);
               };
               toolTip =
"<p>Clear the list of target subframes.</p>";
            }
            add(clearButton);
            this.targetSubframesClearButton = clearButton;

            addStretch();

            var fullPathsCheckBox = new CheckBox(this);
            with (fullPathsCheckBox) {
               font = this.font;
               text = "Full paths";
               checked = parameters.targetSubframesFullPaths;
               onCheck = function(checked) {
                  parameters.targetSubframesFullPaths = checked;
                  targetSubframesUpdateTreeBox(dialog);
               };
               toolTip =
"<p>Enable to show full paths for target subframes.</p>";
            }
            add(fullPathsCheckBox);
            this.targetSubframesFullPathsCheckBox = fullPathsCheckBox;

            var useFileCacheCheckBox = new CheckBox(this);
            with (useFileCacheCheckBox) {
               font = this.font;
               text = "Use file cache";
               checked = parameters.useFileCache;
               onCheck = function(checked) {
                  parameters.useFileCache = checked;
                  subframeCacheFlush();
               };
               toolTip =
"<p>Enable to use a file cache. This cache usually improves performance when the same " +
"subframes are measured more than once.</p>" +
"<p>Note that the output maps process does not use the file cache. Additional " +
"subframe measurements may be required to complete this process.</p>";
            }
            add(useFileCacheCheckBox);
            this.targetSubframesUseFileCacheCheckBox = useFileCacheCheckBox;
            useFileCacheCheckBox.hide();
         }
         add(controlPane);
      }
   }
   targetSubframesSection.adjustToContents();
   this.targetSubframesSection = targetSubframesSection;
   targetSubframesSectionBar.setSection(targetSubframesSection);

   var systemParametersSectionBar = new SectionBar(this);
   systemParametersSectionBar.setTitle("System Parameters");

   var systemParametersSection = new Control(this);
   with (systemParametersSection) {
      sizer = new VerticalSizer;
      with (sizer) {
         spacing = 6;

         var labelMinWidth = Math.round(
            this.font.width("Camera resolution:M")
         );
         var editWidth = Math.round(
            platformFontWidthFactor * 6.0 * this.font.width('M')
         );
         var spinBoxWidth = Math.round(
            platformFontWidthFactor * 6.0 * this.font.width('M')
         );

         var subframeScale = new HorizontalSizer;
         with (subframeScale) {
            spacing = 4;
            var toolTipLocal =
"<p>This parameter specifies target subframe scale in arcseconds per pixel.</p>";

            var label = new Label(this);
            with (label) {
               text = "Subframe scale:";
               textAlignment = TextAlign_Right | TextAlign_VertCenter;
               setFixedWidth(labelMinWidth);
               toolTip = toolTipLocal;
            }
            add(label);

            var edit = new Edit(this);
            with (edit) {
               setFixedWidth(editWidth);
               text = format("%.3f", parameters.subframeScale);
               onEditCompleted = function() {
                  // workaround for recursive onEditCompleted
                  if (this.dialog.onEditCompletedActive) {
                     return;
                  }
                  this.dialog.onEditCompletedActive = true;
                  var value = parseFloat(this.text);
                  if (isNaN(value) || value < 0.01 || value > 100.0) {
                     (new MessageBox(
                        "<p>Invalid subframe scale value.</p>",
                        TITLE,
                        StdIcon_Error,
                        StdButton_Ok
                     )).execute();
                  }
                  else if (parameters.subframeScale != value) {
                     parameters.subframeScale = value;
                     if (true) {
                        tabulationEvaluate(this.dialog);
                     }
                  }
                  this.text = format("%.3f", parameters.subframeScale);
                  this.dialog.onEditCompletedActive = false;
               };
            }
            add(edit);
            this.subframeScaleEdit = edit;

            var unitsLabel = new Label(this);
            with (unitsLabel) {
               text = "arcseconds per pixel";
               textAlignment = TextAlign_Left | TextAlign_VertCenter;
            }
            add(unitsLabel);
            addStretch();
         }
         add(subframeScale);

         var cameraGain = new HorizontalSizer;
         with (cameraGain) {
            spacing = 4;
            var toolTipLocal =
"<p>This parameter specifies camera gain in electrons per Data Number.</p>";

            var label = new Label(this);
            with (label) {
               text = "Camera gain:";
               textAlignment = TextAlign_Right | TextAlign_VertCenter;
               setFixedWidth(labelMinWidth);
               toolTip = toolTipLocal;
            }
            add(label);

            var edit = new Edit(this);
            with (edit) {
               setFixedWidth(editWidth);
               text = format("%.3f", parameters.cameraGain);
               onEditCompleted = function() {
                  // workaround for recursive onEditCompleted
                  if (this.dialog.onEditCompletedActive) {
                     return;
                  }
                  this.dialog.onEditCompletedActive = true;
                  var value = parseFloat(this.text);
                  if (isNaN(value) || value < 0.01 || value > 100.0) {
                     (new MessageBox(
                        "<p>Invalid camera gain value.</p>",
                        TITLE,
                        StdIcon_Error,
                        StdButton_Ok
                     )).execute();
                  }
                  else if (parameters.cameraGain != value) {
                     parameters.cameraGain = value;
                     if (true) {
                        tabulationEvaluate(this.dialog);
                     }
                  }
                  this.text = format("%.3f", parameters.cameraGain);
                  this.dialog.onEditCompletedActive = false;
               };
            }
            add(edit);
            this.cameraGainEdit = edit;

            var unitsLabel = new Label(this);
            with (unitsLabel) {
               text = "electrons per Data Number";
               textAlignment = TextAlign_Left | TextAlign_VertCenter;
            }
            add(unitsLabel);
            addStretch();
         }
         add(cameraGain);

         var cameraResolution = new HorizontalSizer;
         with (cameraResolution) {
            spacing = 4;
            var localToolTip =
"<p>This parameter specifies camera resolution in bits per pixel.</p>";

            var label = new Label(this);
            with (label) {
               text = "Camera resolution:";
               textAlignment = TextAlign_Right | TextAlign_VertCenter;
               setFixedWidth(labelMinWidth);
               toolTip = localToolTip;
            }
            add(label);

            var comboBox = new ComboBox(this);
            with (comboBox) {
               for (var i = 0; i != parameters.cameraResolutions.length; ++i) {
                  addItem(parameters.cameraResolutions[i]);
               }
               maxVisibleItemCount = parameters.cameraResolutions.length;
               currentItem = parameters.cameraResolution;
               onItemSelected = function(item) {
                  if (parameters.cameraResolution != item) {
                     parameters.cameraResolution = item;
                     if (true) {
                        tabulationEvaluate(this.dialog);
                     }
                  }
               };
               toolTip = localToolTip;
            }
            add(comboBox);
            this.cameraResolutionComboBox = comboBox;
            addStretch();
         }
         add(cameraResolution);

         var siteLocalMidnight = new HorizontalSizer;
         with (siteLocalMidnight) {
            spacing = 4;
            var toolTipLocal =
"<p>This parameters specifies the Coordinated Universal Time (UTC) of local midnight " +
"at the site of target subframe observation, rounded to the nearest hour from 0 to " +
"23. If this time is unknown or varies by more than six hours, set this parameter " +
"to 24.</p> " +
"This parameter and the value of the FITS keyword DATE-OBS (if available) are used to " +
"identify sequences of subframe observations that occurred during the same night for " +
"data presentation purposes.</p>";

            var label = new Label(this);
            with (label) {
               text = "Site local midnight:";
               textAlignment = TextAlign_Right | TextAlign_VertCenter;
               setFixedWidth(labelMinWidth);
               toolTip = toolTipLocal;
            }
            add(label);

            var spinBox = new SpinBox(this);
            with (spinBox) {
               setRange(0, 24);
               setFixedWidth(spinBoxWidth);
               value = parameters.siteLocalMidnight;
               onValueUpdated = function(value) {
                  parameters.siteLocalMidnight = value;
                  if (true) {
                     tabulationEvaluate(this.dialog);
                  }
               };
               toolTip = toolTipLocal;
            }
            add(spinBox);
            this.siteLocalMidnightSpinBox = spinBox;

            var unitsLabel = new Label(this);
            with (unitsLabel) {
               text = "hours (UTC)";
               textAlignment = TextAlign_Left | TextAlign_VertCenter;
            }
            add(unitsLabel);
            addStretch();
         }
         add(siteLocalMidnight);

         var scaleUnit = new HorizontalSizer;
         with (scaleUnit) {
            spacing = 4;
            var localToolTip =
"<p>This parameter specifies the camera pixel scale unit used for measurement " +
"presentation.</p>";

            var label = new Label(this);
            with (label) {
               text = "Scale unit:";
               textAlignment = TextAlign_Right | TextAlign_VertCenter;
               setFixedWidth(labelMinWidth);
               toolTip = localToolTip;
            }
            add(label);

            var comboBox = new ComboBox(this);
            with (comboBox) {
               for (var i = 0; i != parameters.scaleUnits.length; ++i) {
                  addItem(parameters.scaleUnits[i]);
               }
               maxVisibleItemCount = parameters.scaleUnits.length;
               currentItem = parameters.scaleUnit;
               onItemSelected = function(item) {
                  if (parameters.scaleUnit != item) {
                     parameters.scaleUnit = item;
                     if (true) {
                        tabulationEvaluate(this.dialog);
                     }
                  }
               };
               toolTip = localToolTip;
            }
            add(comboBox);
            this.scaleUnitComboBox = comboBox;
            addStretch();
         }
         add(scaleUnit);

         var dataUnit = new HorizontalSizer;
         with (dataUnit) {
            spacing = 4;
            var localToolTip =
"<p>This parameter specifies the camera pixel data unit used for measurement " +
"presentation.</p>";

            var label = new Label(this);
            with (label) {
               text = "Data unit:";
               textAlignment = TextAlign_Right | TextAlign_VertCenter;
               setFixedWidth(labelMinWidth);
               toolTip = localToolTip;
            }
            add(label);

            var comboBox = new ComboBox(this);
            with (comboBox) {
               for (var i = 0; i != parameters.dataUnits.length; ++i) {
                  addItem(parameters.dataUnits[i]);
               }
               maxVisibleItemCount = parameters.dataUnits.length;
               currentItem = parameters.dataUnit;
               onItemSelected = function(item) {
                  if (parameters.dataUnit != item) {
                     parameters.dataUnit = item;
                     if (true) {
                        tabulationEvaluate(this.dialog);
                     }
                  }
               };
               toolTip = localToolTip;
            }
            add(comboBox);
            this.dataUnitComboBox = comboBox;
            addStretch();
         }
         add(dataUnit);
      }
   }
   systemParametersSection.adjustToContents();
   systemParametersSection.setFixedHeight();
   systemParametersSection.hide();
   systemParametersSectionBar.setSection(systemParametersSection);

   var starDetectionAndFittingSectionBar = new SectionBar(this);
   starDetectionAndFittingSectionBar.setTitle("Star Detection and Fitting");

   var starDetectionAndFittingSection = new Control(this);
   with (starDetectionAndFittingSection) {
      sizer = new HorizontalSizer;
      with (sizer) {
         spacing = 6;

         var controlPane = new VerticalSizer;
         with (controlPane) {
            spacing = 6;

            var labelMinWidth = Math.round(
               this.font.width("Maximum star distortion:M")
            );
            var spinBoxWidth = Math.round(
               platformFontWidthFactor * 6.0 * this.font.width('M')
            );

            var starDetectionLayers = new HorizontalSizer;
            with (starDetectionLayers) {
               spacing = 4;
               var toolTipLocal =
"<p>This parameter specifies the number of wavelet layers used for star detection.</p>" +
"<p>With more wavelet layers larger stars and perhaps also some nonstellar objects " +
"will be detected.</p>" +
"<p>Fewer wavelet layers favors detection of smaller, and hence more, stars.</p>";

               var label = new Label(this);
               with (label) {
                  text = "Star detection layers:";
                  textAlignment = TextAlign_Right | TextAlign_VertCenter;
                  setFixedWidth(labelMinWidth);
                  toolTip = toolTipLocal;
               }
               add(label);

               var spinBox = new SpinBox(this);
               with (spinBox) {
                  setRange(1, 8);
                  setFixedWidth(spinBoxWidth);
                  value = parameters.starDetectionLayers;
                  onValueUpdated = function(value) {
                     parameters.starDetectionLayers = value;
                     tabulationClear(this.dialog);
                  };
                  toolTip = toolTipLocal;
               }
               add(spinBox);
               this.starDetectionLayersSpinBox = spinBox;
               addStretch();
            }
            add(starDetectionLayers);

            var noiseReductionLayers = new HorizontalSizer;
            with (noiseReductionLayers) {
               spacing = 4;
               var toolTipLocal =
"<p>This parameter specifies the number of wavelet layers used for noise reduction.</p>" +
"<p>Noise reduction prevents detection of bright noise structures as false stars, " +
"including hot pixels and cosmic rays.</p>" +
"<p>This parameter can also be used to control the sizes of the smallest detected " +
"stars (increase to exclude more stars).</p>";

               var label = new Label(this);
               with (label) {
                  text = "Noise reduction layers:";
                  textAlignment = TextAlign_Right | TextAlign_VertCenter;
                  setFixedWidth(labelMinWidth);
                  toolTip = toolTipLocal;
               }
               add(label);

               var spinBox = new SpinBox(this);
               with (spinBox) {
                  setRange(0, 4);
                  setFixedWidth(spinBoxWidth);
                  value = parameters.noiseReductionLayers;
                  onValueUpdated = function(value) {
                     parameters.noiseReductionLayers = value;
                     tabulationClear(this.dialog);
                  };
                  toolTip = toolTipLocal;
               }
               add(spinBox);
               this.noiseReductionLayersSpinBox = spinBox;
               addStretch();
            }
            add(noiseReductionLayers);

            var hotPixelFilterRadius = new HorizontalSizer;
            with (hotPixelFilterRadius) {
               spacing = 4;
               var toolTipLocal =
"<p>This parameter specifies the radius in pixels of median filter applied before " +
"star detection to remove hot pixels.</p>" +
"<p>To disable hot pixel removal, set this parameter to zero.</p>";

               var label = new Label(this);
               with (label) {
                  text = "Hot pixel filter radius:";
                  textAlignment = TextAlign_Right | TextAlign_VertCenter;
                  setFixedWidth(labelMinWidth);
                  toolTip = toolTipLocal;
               }
               add(label);

               var spinBox = new SpinBox(this);
               with (spinBox) {
                  setRange(0, 2);
                  setFixedWidth(spinBoxWidth);
                  value = parameters.hotPixelFilterRadius;
                  onValueUpdated = function(value) {
                     parameters.hotPixelFilterRadius = value;
                     tabulationClear(this.dialog);
                  };
                  toolTip = toolTipLocal;
               }
               add(spinBox);
               this.hotPixelFilterRadiusSpinBox = spinBox;

               var unitsLabel = new Label(this);
               with (unitsLabel) {
                  text = "pixels";
                  textAlignment = TextAlign_Left | TextAlign_VertCenter;
               }
               add(unitsLabel);
               addStretch();
            }
            add(hotPixelFilterRadius);

            var applyHotPixelFilterToDetectionImage = new HorizontalSizer;
            with (applyHotPixelFilterToDetectionImage) {
               spacing = 4;
               addSpacing(labelMinWidth);
               addSpacing(spacing);

               var checkBox = new CheckBox(this);
               with (checkBox) {
                  font = this.font;
                  text = "Apply hot pixel filter to detection image";
                  checked = parameters.applyHotPixelFilterToDetectionImage;
                  onCheck = function(checked) {
                     if (parameters.applyHotPixelFilterToDetectionImage != checked) {
                        parameters.applyHotPixelFilterToDetectionImage = checked;
                        tabulationClear(this.dialog);
                     }
                  };
                  toolTip =
"<p>Whether the hot pixel filter removal should be applied to the image " +
"used for star detection, or only to the working image used to build the " +
"structure map.</p>" +
"<p>By setting this parameter to true, the detection algorithm is completely " +
"robust to hot pixels (of sizes not larger than hot pixel filter radius), but " +
"it is also less sensitive, so less stars will in general be detected. " +
"With the default value of false, some hot pixels may be wrongly detected " +
"as stars but the number of true stars detected will generally be larger.</p>";
               }
               add(checkBox);
               this.applyHotPixelFilterToDetectionImageCheckBox = checkBox;
               addStretch();
            }
            add(applyHotPixelFilterToDetectionImage);

            var logStarDetectionSensitivity = new HorizontalSizer;
            with (logStarDetectionSensitivity) {
               spacing = 4;

               var numericControl = new NumericControl(this);
               with (numericControl) {
                  label.text = "Log(detection sensitivity):";
                  label.setMinWidth(labelMinWidth);
                  setRange(-3.0, 3.0);
                  setPrecision(2);
                  slider.setRange(0, 200);
                  slider.setScaledMinWidth(200 + 16);
                  setValue(Math.log10(parameters.starDetectionSensitivity));
                  onValueUpdated = function(value) {
                     parameters.starDetectionSensitivity = Math.pow(10.0, value);
                     tabulationClear(this.dialog);
                  };
                  toolTip =
"<p>This parameter specifies the logarithm of the star detection sensitivity.</p>" +
"<p>The sensitivity of the star detection algorithm is measured with respect to the " +
"<i>local background</i> of each detected star. Given a star with estimated " +
"brightness <i>s</i> and local background <i>b</i>, sensitivity is the minimum value " +
"of (<i>s</i> - <i>b</i>) / <i>b</i> necessary to trigger star detection.</p>" +
"<p>Decrease this parameter to favor detection of fainter stars or stars on brighter " +
"backgrounds. Increase it to restrict detection to brighter stars or stars on " +
"dimmer backgrounds.</p>";
               }
               add(numericControl);
               this.logStarDetectionSensitivityNumericControl = numericControl;
               addStretch();
            }
            add(logStarDetectionSensitivity);

            var starPeakResponse = new HorizontalSizer;
            with (starPeakResponse) {
               spacing = 4;

               var numericControl = new NumericControl(this);
               with (numericControl) {
                  label.text = "Star peak response:";
                  label.setMinWidth(labelMinWidth);;
                  setRange(0.0, 1.0);
                  setPrecision(2);
                  slider.setRange(0, 200);
                  slider.setScaledMinWidth(200 + 16);
                  setValue(parameters.starPeakResponse);
                  onValueUpdated = function(value) {
                     parameters.starPeakResponse = value;
                     tabulationClear(this.dialog);
                  };
                  toolTip =
"<p>This parameter specifies star peak response.</p>" +
"<p>If you decrease this parameter, stars will need to have more prominent peaks to " +
"be detected by the star detection algorithm. By increasing this parameter, the star " +
"detection algorithm will be more permissive with relatively flat stars.</p>";
               }
               add(numericControl);
               this.starPeakResponseNumericControl = numericControl;
               addStretch();
            }
            add(starPeakResponse);

            var maximumStarDistortion = new HorizontalSizer;
            with (maximumStarDistortion) {
               spacing = 4;

               var numericControl = new NumericControl(this);
               with (numericControl) {
                  label.text = "Maximum star distortion:";
                  label.setMinWidth(labelMinWidth);;
                  setRange(0.0, 1.0);
                  setPrecision(2);
                  slider.setRange(0, 200);
                  slider.setScaledMinWidth(200 + 16);
                  setValue(parameters.maximumStarDistortion);
                  onValueUpdated = function(value) {
                     parameters.maximumStarDistortion = value;
                     tabulationClear(this.dialog);
                  };
                  toolTip =
"<p>This parameter specifies maximum star distortion.</p>" +
"<p>Star distortion is the fractional area of the star's bounding box covered by the " +
"star. The distortion of a perfectly circular star is about 0.75 (actually, π/4). " +
"Decrease this parameter to detect stars with larger distortion.</p>";
               }
               add(numericControl);
               this.maximumStarDistortionNumericControl = numericControl;
               addStretch();
            }
            add(maximumStarDistortion);

            var upperLimit = new HorizontalSizer;
            with (upperLimit) {
               spacing = 4;

               var numericControl = new NumericControl(this);
               with (numericControl) {
                  label.text = "Upper limit:";
                  label.setMinWidth(labelMinWidth);;
                  setRange(0.0, 1.0);
                  setPrecision(2);
                  slider.setRange(0, 200);
                  slider.setScaledMinWidth(200 + 16);
                  setValue(parameters.upperLimit);
                  onValueUpdated = function(value) {
                     parameters.upperLimit = value;
                     tabulationClear(this.dialog);
                  };
                  toolTip =
      "<p>Stars with peak values larger than this value won't be measured.</p>" +
      "<p>This feature may be used to avoid the measurement of saturated and bloomed stars.</p>" +
      "<p>To disable this feature, set this parameter to one.</p>" +
      "<p>To disable star detection entirely, set this parameter to zero.</p>";
               }
               add(numericControl);
               this.upperLimitNumericControl = numericControl;
               addStretch();
            }
            add(upperLimit);

            var subframeRegion = new HorizontalSizer;
            with (subframeRegion) {
               spacing = 4;
               var toolTipLocal =
"<p>This parameter defines a rectangular region of each target subframe that will be " +
"measured.</p>" +
"<p>The successive values specify the left, top, width and height of the region.</p>" +
"<p>To measure the entire area of each subframe set all four values to zero.</p>";

               var label = new Label(this);
               with (label) {
                  text = "Subframe region:";
                  textAlignment = TextAlign_Right | TextAlign_VertCenter;
                  setFixedWidth(labelMinWidth);
                  toolTip = toolTipLocal;
               }
               add(label);

               var edit = new Edit(this);
               with (edit) {
                  setFixedWidth(editWidth);
                  text = format("%d", parameters.subframeRegionLeft);
                  onEditCompleted = function() {
                     // workaround for recursive onEditCompleted
                     if (this.dialog.onEditCompletedActive) {
                        return;
                     }
                     this.dialog.onEditCompletedActive = true;
                     var value = parseInt(this.text);
                     if (isNaN(value) || value < 0 || value > 1024 * 1024 * 1024 - 1) {
                        (new MessageBox(
                           "<p>Invalid subframe region value.</p>",
                           TITLE,
                           StdIcon_Error,
                           StdButton_Ok
                        )).execute();
                     }
                     else if (parameters.subframeRegionLeft != value) {
                        parameters.subframeRegionLeft = value;
                        tabulationClear(this.dialog);
                     }
                     this.text = format("%d", parameters.subframeRegionLeft);
                     this.dialog.onEditCompletedActive = false;
                  };
               }
               add(edit);
               this.subframeRegionLeftEdit = edit;

               var edit = new Edit(this);
               with (edit) {
                  setFixedWidth(editWidth);
                  text = format("%d", parameters.subframeRegionTop);
                  onEditCompleted = function() {
                     // workaround for recursive onEditCompleted
                     if (this.dialog.onEditCompletedActive) {
                        return;
                     }
                     this.dialog.onEditCompletedActive = true;
                     var value = parseInt(this.text);
                     if (isNaN(value) || value < 0 || value > 1024 * 1024 * 1024 - 1) {
                        (new MessageBox(
                           "<p>Invalid subframe region value.</p>",
                           TITLE,
                           StdIcon_Error,
                           StdButton_Ok
                        )).execute();
                     }
                     else if (parameters.subframeRegionTop != value) {
                        parameters.subframeRegionTop = value;
                        tabulationClear(this.dialog);
                     }
                     this.text = format("%d", parameters.subframeRegionTop);
                     this.dialog.onEditCompletedActive = false;
                  };
               }
               add(edit);
               this.subframeRegionTopEdit = edit;

               var edit = new Edit(this);
               with (edit) {
                  setFixedWidth(editWidth);
                  text = format("%d", parameters.subframeRegionWidth);
                  onEditCompleted = function() {
                     // workaround for recursive onEditCompleted
                     if (this.dialog.onEditCompletedActive) {
                        return;
                     }
                     this.dialog.onEditCompletedActive = true;
                     var value = parseInt(this.text);
                     if (isNaN(value) || value < 0 || value > 1024 * 1024 * 1024 - 1) {
                        (new MessageBox(
                           "<p>Invalid subframe region value.</p>",
                           TITLE,
                           StdIcon_Error,
                           StdButton_Ok
                        )).execute();
                     }
                     else if (parameters.subframeRegionWidth != value) {
                        parameters.subframeRegionWidth = value;
                        tabulationClear(this.dialog);
                     }
                     this.text = format("%d", parameters.subframeRegionWidth);
                     this.dialog.onEditCompletedActive = false;
                  };
               }
               add(edit);
               this.subframeRegionWidthEdit = edit;

               var edit = new Edit(this);
               with (edit) {
                  setFixedWidth(editWidth);
                  text = format("%d", parameters.subframeRegionHeight);
                  onEditCompleted = function() {
                     // workaround for recursive onEditCompleted
                     if (this.dialog.onEditCompletedActive) {
                        return;
                     }
                     this.dialog.onEditCompletedActive = true;
                     var value = parseInt(this.text);
                     if (isNaN(value) || value < 0 || value > 1024 * 1024 * 1024 - 1) {
                        (new MessageBox(
                           "<p>Invalid subframe region value.</p>",
                           TITLE,
                           StdIcon_Error,
                           StdButton_Ok
                        )).execute();
                     }
                     else if (parameters.subframeRegionHeight != value) {
                        parameters.subframeRegionHeight = value;
                        tabulationClear(this.dialog);
                     }
                     this.text = format("%d", parameters.subframeRegionHeight);
                     this.dialog.onEditCompletedActive = false;
                  };
               }
               add(edit);
               this.subframeRegionHeightEdit = edit;

               var unitsLabel = new Label(this);
               with (unitsLabel) {
                  text = "pixels";
                  textAlignment = TextAlign_Left | TextAlign_VertCenter;
               }
               add(unitsLabel);

               addStretch();
            }
            add(subframeRegion);

            var pedestal = new HorizontalSizer;
            with (pedestal) {
               spacing = 4;
               var toolTipLocal =
"<p>This parameter specifies a (usually small) quantity that is subtracted " +
"from each target subframe prior to the measurement process.</p>";

               var label = new Label(this);
               with (label) {
                  text = "Pedestal:";
                  textAlignment = TextAlign_Right | TextAlign_VertCenter;
                  setFixedWidth(labelMinWidth);
                  toolTip = toolTipLocal;
               }
               add(label);

               var edit = new Edit(this);
               with (edit) {
                  setFixedWidth(editWidth);
                  text = format("%d", parameters.pedestal);
                  onEditCompleted = function() {
                     // workaround for recursive onEditCompleted
                     if (this.dialog.onEditCompletedActive) {
                        return;
                     }
                     this.dialog.onEditCompletedActive = true;
                     var value = parseInt(this.text);
                     if (isNaN(value) || value < 0 || value > 65535) {
                        (new MessageBox(
                           "<p>Invalid pedestal value.</p>",
                           TITLE,
                           StdIcon_Error,
                           StdButton_Ok
                        )).execute();
                     }
                     else if (parameters.pedestal != value) {
                        parameters.pedestal = value;
                        tabulationClear(this.dialog);
                     }
                     this.text = format("%d", parameters.pedestal);
                     this.dialog.onEditCompletedActive = false;
                  };
               }
               add(edit);
               this.pedestalEdit = edit;

               var unitsLabel = new Label(this);
               with (unitsLabel) {
                  text = "Data Numbers";
                  textAlignment = TextAlign_Left | TextAlign_VertCenter;
               }
               add(unitsLabel);
               addStretch();
            }
            add(pedestal);

            var modelFunction = new HorizontalSizer;
            with (modelFunction) {
               spacing = 4;
               var localToolTip =
"<p>This parameter specifies the <i>point spread function</i> (PSF) used to fit star " +
"images.</p>" +
"<p>The function may be either an elliptical <i>Gaussian</i>, an elliptical " +
"<i>Moffat</i> with a selected <i>β</i> parameter or an elliptical " +
"<i>Lorentzian</i>.</p>";

               var label = new Label(this);
               with (label) {
                  font = this.font;
                  text = "Point spread function:";
                  textAlignment = TextAlign_Right | TextAlign_VertCenter;
                  setFixedWidth(labelMinWidth);
                  toolTip = localToolTip;
               }
               add(label);

               var comboBox = new ComboBox(this);
               with (comboBox) {
                  font = this.font;
                  for (var i = 0; i != parameters.modelFunctions.length; ++i) {
                     addItem(parameters.modelFunctions[i]);
                  }
                  maxVisibleItemCount = parameters.modelFunctions.length;
                  currentItem = parameters.modelFunction;
                  onItemSelected = function(item) {
                     if (parameters.modelFunction != item) {
                        parameters.modelFunction = item;
                        tabulationClear(this.dialog);
                     }
                  };
                  toolTip = localToolTip;
               }
               add(comboBox);
               this.modelFunctionComboBox = comboBox;
               addStretch();
            }
            add(modelFunction);

            var circularModel = new HorizontalSizer;
            with (circularModel) {
               spacing = 4;
               addSpacing(labelMinWidth);
               addSpacing(spacing);

               var checkBox = new CheckBox(this);
               with (checkBox) {
                  font = this.font;
                  text = "Circular point spread function";
                  checked = parameters.circularModel;
                  onCheck = function(checked) {
                     if (parameters.circularModel != checked) {
                        parameters.circularModel = checked;
                        tabulationClear(this.dialog);
                     }
                  };
                  toolTip =
"<p>Enable this option to fit circular point spread functions. Disable it to fit " +
"elliptical functions.</p>" +
"Circular functions can provide more robust and useful results in cases of strong " +
"undersampling or high noise levels.</p>";
               }
               add(checkBox);
               this.circularModelCheckBox = checkBox;
               addStretch();
            }
            add(circularModel);

         }
         add(controlPane);
      }
   }
   starDetectionAndFittingSection.adjustToContents();
   starDetectionAndFittingSection.setFixedHeight();
   starDetectionAndFittingSection.hide();
   starDetectionAndFittingSectionBar.setSection(starDetectionAndFittingSection);

   var expressionsSectionBar = new SectionBar(this);
   expressionsSectionBar.setTitle("Expressions");

   var expressionsSection = new Control(this);
   with (expressionsSection) {
      sizer = new VerticalSizer;
      with (sizer) {
         spacing = 6;

         var labelMinWidth = Math.round(
            this.font.width("Weighting:M")
         );

         var selectorExpression = new HorizontalSizer;
         with (selectorExpression) {
            spacing = 4;

            var state = new ToolButton(this);
            with (state) {
               icon = selectorExpressionIsValid(parameters.selectorExpression) ?
                  this.validExpressionBitmap : this.invalidExpressionBitmap;
               toolTip =
"<p>A cross icon indicates that the subframe approval expression is invalid and that " +
"all unlocked subframes will be approved.</p>";
            }
            add(state);
            this.selectorExpressionState = state;

            var label = new Label(this);
            with (label) {
               text = "Approval:";
               textAlignment = TextAlign_Right | TextAlign_VertCenter;
               setFixedWidth(labelMinWidth);
               toolTip =
"<p>Subframe approval expression, a boolean combination of constraints. A blank " +
"expression will approve all subframes.</p>" +
"<i>approval</i> = [ <i>constraint</i> [ [ && | || ] <i>constraint</i> ]... ]<br>" +
"<i>constraint</i> = [ <i>weighting</i> [ &lt; | &gt; | &lt;= | &gt;= | == | != ] " +
"<i>weighting</i> | true | false | [ ! ] (<i>approval</i>) ]<br>" +
"<i>weighting</i> = <i>term</i> [ [ + | - | * | / | ^ ] <i>term</i> ]...<br>" +
"<i>term</i> = [ - ] [ <i>number</i> | <i>property</i> | (<i>weighting</i>) ]<br>" +
"<i>property</i> = [ Index | Weight | WeightSigma | FWHM | FWHMSigma | Eccentricity | " +
"EccentricitySigma | SNRWeight | SNRWeightSigma | Median | MedianSigma | " +
"MeanDeviation | MeanDeviationSigma | Noise | NoiseSigma | StarSupport | " +
"StarSupportSigma | StarResidual | StarResidualSigma | NoiseSupport | " +
"NoiseSupportSigma | FWHMMeanDev | FWHMMeanDevSigma | EccentricityMeanDev | " +
"EccenricityMeanDevSigma | StarResidualMeanDev | StarResidualMeanDevSigma ]";
            }
            add(label);

            var edit = new Edit(this);
            with (edit) {
               text = parameters.selectorExpression;
               onEditCompleted = function(text) {
                  parameters.selectorExpression = this.text;
                  this.dialog.selectorExpressionState.icon =
                     selectorExpressionIsValid(parameters.selectorExpression) ?
                        this.dialog.validExpressionBitmap :
                        this.dialog.invalidExpressionBitmap;
                  if (true) {
                     tabulationEvaluate(this.dialog);
                  }
               };
            }
            add(edit);
            this.selectorExpressionEdit = edit;

            var button = new PushButton(this);
            with (button) {
               text = "Edit";
               onClick = function() {
                  if (editSelectorExpression(this.dialog)) {
                     this.dialog.selectorExpressionState.icon =
                        selectorExpressionIsValid(parameters.selectorExpression) ?
                           this.dialog.validExpressionBitmap :
                           this.dialog.invalidExpressionBitmap;
                     if (true) {
                        tabulationEvaluate(this.dialog);
                     }
                  }
               };
               toolTip =
"<p>Edit the subframe approval expression.</p>";
            }
            add(button);
         }
         add(selectorExpression);

         var weightingExpression = new HorizontalSizer;
         with (weightingExpression) {
            spacing = 4;

            var state = new ToolButton(this);
            with (state) {
               icon = weightingExpressionIsValid(parameters.weightingExpression) ?
                  this.validExpressionBitmap : this.invalidExpressionBitmap;
               toolTip =
"<p>A cross icon indicates that the subframe weighting expression is invalid and that " +
"a zero weight will be assigned to all subframes.</p>";
            }
            add(state);
            this.weightingExpressionState = state;

            var label = new Label(this);
            with (label) {
               text = "Weighting:";
               textAlignment = TextAlign_Right | TextAlign_VertCenter;
               setFixedWidth(labelMinWidth);
               toolTip =
"<p>Subframe weighting expression, an arithmetic combination of " +
"properties. A blank expression will assign a zero weight to all subframes.</p>" +
"<i>weighting</i> = [ <i>term</i> [ [ + | - | * | / | ^ ] <i>term</i> ]... ]<br>" +
"<i>term</i> = [ - ] [ <i>number</i> | <i>property</i> | (<i>weighting</i>) ]<br>" +
"<i>property</i> = [ Index | FWHM | FWHMSigma | Eccentricity | EccentricitySigma | " +
"SNRWeight | SNRWeightSigma | Median | MedianSigma | MeanDeviation | " +
"MeanDeviationSigma | Noise | NoiseSigma | StarSupport | StarSupportSigma | " +
"StarResidual | StarResidualSigma | NoiseSupport | NoiseSupportSigma | FWHMMeanDev | " +
"FWHMMeanDevSigma | EccentricityMeanDev | EccentricityMeanDevSigma | " +
"StarResidualMeanDev | StarResidualMeanDevSigma ]";
            }
            add(label);

            var edit = new Edit(this);
            with (edit) {
               text = parameters.weightingExpression;
               onEditCompleted = function() {
                  parameters.weightingExpression = this.text;
                  this.dialog.weightingExpressionState.icon =
                     weightingExpressionIsValid(parameters.weightingExpression) ?
                        this.dialog.validExpressionBitmap :
                        this.dialog.invalidExpressionBitmap;
                  if (true) {
                     tabulationEvaluate(this.dialog);
                  }
               };
            }
            add(edit);
            this.weightingExpressionEdit = edit;

            var button = new PushButton(this);
            with (button) {
               text = "Edit";
               onClick = function() {
                  if (editWeightingExpression(this.dialog)) {
                     this.dialog.weightingExpressionState.icon =
                        weightingExpressionIsValid(parameters.weightingExpression) ?
                           this.dialog.validExpressionBitmap :
                           this.dialog.invalidExpressionBitmap;
                     if (true) {
                        tabulationEvaluate(this.dialog);
                     }
                  }
               };
               toolTip =
"<p>Edit the subframe weighting expression.</p>";
            }
            add(button);
         }
         add(weightingExpression);
      }
   }
   expressionsSection.adjustToContents();
   expressionsSection.setFixedHeight();
   expressionsSection.hide();
   expressionsSectionBar.setSection(expressionsSection);

   var tabulationSectionBar = new SectionBar(this);
   tabulationSectionBar.setTitle("Table");

   var tabulationSection = new Control(this);
   with (tabulationSection) {
      sizer = new HorizontalSizer;
      with (sizer) {
         spacing = 6;

         var treeBox = new TreeBox(this);
         with (treeBox) {
            alternateRowColor = false;
            headerVisible = true;
            indentSize = 0;
            multipleSelection = true;
            numberOfColumns = 12; //13;
            var padString = "MMMMM";

            var column = 0; // Index Name
            setHeaderText(column, parameters.columnNames[column]);
            setHeaderAlignment(column, Align_Left | TextAlign_VertCenter);
            // setColumnWidth(column, 2 * columnWidth(column));
            setColumnWidth(column, this.displayPixelRatio * (treeBox.font.width(headerText(column) + padString)));

            ++column; // Weight
            setHeaderText(column, parameters.columnNames[column]);
            setHeaderAlignment(column, Align_Left | TextAlign_VertCenter);
            setColumnWidth(column, this.displayPixelRatio * (treeBox.font.width(headerText(column) + padString)));

            ++column; // FWHM
            setHeaderText(column, parameters.columnNames[column]);
            setHeaderAlignment(column, Align_Left | TextAlign_VertCenter);
            setColumnWidth(column, this.displayPixelRatio * treeBox.font.width(headerText(column) + padString));

            ++column; // Eccentricity
            setHeaderText(column, parameters.columnNames[column]);
            setHeaderAlignment(column, Align_Left | TextAlign_VertCenter);
            setColumnWidth(column, this.displayPixelRatio * (treeBox.font.width(headerText(column) + padString)));

            ++column; // SNRWeight
            setHeaderText(column, parameters.columnNames[column]);
            setHeaderAlignment(column, Align_Left | TextAlign_VertCenter);
            setColumnWidth(column, this.displayPixelRatio * (treeBox.font.width(headerText(column) + padString)));

            ++column; // Median
            setHeaderText(column, parameters.columnNames[column]);
            setHeaderAlignment(column, Align_Left | TextAlign_VertCenter);
            setColumnWidth(column, this.displayPixelRatio * (treeBox.font.width(headerText(column) + padString)));

            ++column; // MeanDeviation
            setHeaderText(column, parameters.columnNames[column]);
            setHeaderAlignment(column, Align_Left | TextAlign_VertCenter);
            // setColumnWidth(column, 1.5 * columnWidth(column));
            setColumnWidth(column, this.displayPixelRatio * (treeBox.font.width(headerText(column) + padString)));

            ++column; // Noise
            setHeaderText(column, parameters.columnNames[column]);
            setHeaderAlignment(column, Align_Left | TextAlign_VertCenter);
            setColumnWidth(column, this.displayPixelRatio * (treeBox.font.width(headerText(column) + padString)));

            ++column; // StarSupport
            setHeaderText(column, parameters.columnNames[column]);
            setHeaderAlignment(column, Align_Left | TextAlign_VertCenter);
            setColumnWidth(column, this.displayPixelRatio * (treeBox.font.width(headerText(column) + padString)));

            ++column; // StarResidual
            setHeaderText(column, parameters.columnNames[column]);
            setHeaderAlignment(column, Align_Left | TextAlign_VertCenter);
            setColumnWidth(column, this.displayPixelRatio * (treeBox.font.width(headerText(column) + padString)));

            ++column; // NoiseSupport
            setHeaderText(column, parameters.columnNames[column]);
            setHeaderAlignment(column, Align_Left | TextAlign_VertCenter);
            setColumnWidth(column, this.displayPixelRatio * (treeBox.font.width(headerText(column) + padString)));

            ++column; // FWHMMeanDev
            setHeaderText(column, parameters.columnNames[column]);
            setHeaderAlignment(column, Align_Left | TextAlign_VertCenter);
            // setColumnWidth(column, 1.5 * columnWidth(column));
            setColumnWidth(column, this.displayPixelRatio * (treeBox.font.width(headerText(column) + padString)));

            ++column; // EccentricityMeanDev
            setHeaderText(column, parameters.columnNames[column]);
            setHeaderAlignment(column, Align_Left | TextAlign_VertCenter);
            // setColumnWidth(column, 1.5 * columnWidth(column));
            setColumnWidth(column, this.displayPixelRatio * (treeBox.font.width(headerText(column) + padString)));

            ++column; // StarResidualMeanDev
            setHeaderText(column, parameters.columnNames[column]);
            setHeaderAlignment(column, Align_Left | TextAlign_VertCenter);
            // setColumnWidth(column, 1.5 * columnWidth(column));
            setColumnWidth(column, this.displayPixelRatio * (treeBox.font.width(headerText(column) + padString)));

            ++column; // Date
            setHeaderText(column, parameters.columnNames[column]);
            setHeaderAlignment(column, Align_Left | TextAlign_VertCenter);
            // setColumnWidth(column, 2 * columnWidth(column));
            setColumnWidth(column, this.displayPixelRatio * (treeBox.font.width(headerText(column) + padString + padString + padString)));

            //++column; // Null
            //setHeaderText(column, "");
            //setHeaderAlignment(column, Align_Left | TextAlign_VertCenter);
            //setColumnWidth(column, 0);
            //hideColumn(column);

            onNodeSelectionUpdated = function() {
               tabulationNodeUpdated(this.dialog);
            };
            onNodeUpdated = function() {
               tabulationNodeUpdated(this.dialog);
            };
         }
         var treeBoxRows = 10;
         treeBox.setMinHeight(
            this.displayPixelRatio * treeBoxRows * (treeBox.font.lineSpacing + 6) +
            treeBox.borderWidth
         );
         add(treeBox);
         this.evaluationsTreeBox = treeBox;

         var buttonPane = new VerticalSizer;
         with (buttonPane) {
            spacing = 6;

            var toggleSelectedButton = new PushButton(this);
            with (toggleSelectedButton) {
               text = "Toggle Selected";
               onClick = function() {
                  tabulationToggleSelected(this.dialog);
               };
               toolTip =
"<p>Toggle the approved/rejected state of the current selection of subframes. The " +
"toggled subframes will also be locked.</p>" +
"<p>Rejected subframes will be ignored during the output subframes process. The " +
"subframe approval expression will not modify the approved/rejected state of locked " +
"subframes.</p>";
            }
            add(toggleSelectedButton);
            this.evaluationsToggleSelectedButton = toggleSelectedButton;

            var unlockSelectedButton = new PushButton(this);
            with (unlockSelectedButton) {
               text = "Unlock Selected";
               onClick = function() {
                  tabulationUnlockedSelected(this.dialog);
               };
               toolTip =
"<p>Unlock the current selection of subframes.</p>";
            }
            add(unlockSelectedButton);
            this.evaluationsUnlockSelectedButton = unlockSelectedButton;

            var saveAsButton = new PushButton(this);
            with (saveAsButton) {
               text = "Save Table As...";
               onClick = function() {
                  tabulationSaveAs(dialog);
               };
               toolTip =
"<p>Save the table as a <i>comma separated value</> .csv file.</p>";
            }
            add(saveAsButton);
            this.evaluationsSaveAsButton = saveAsButton;

            addStretch();

            var sort = new Label(this);
            with (sort) {
               text = "Sort table by:";
               textAlignment = TextAlign_Left | TextAlign_VertCenter;
               toolTip =
"<p>These parameters specify a table sort column and sort ordering.</p>";
            }
            add(sort);

            var sortColumn = new ComboBox(this);
            with (sortColumn) {
               for (var i = 0; i != parameters.sortColumns.length; ++i) {
                  addItem(parameters.sortColumns[i]);
               }
               maxVisibleItemCount = parameters.sortColumns.length;
               currentItem = parameters.sortColumn;
               onItemSelected = function(item) {
                  parameters.sortColumn = item;
                  tabulationSort(this.dialog);
               };
               toolTip =
"<p>This parameter specifies a table sort column.</p>";
            }
            add(sortColumn);
            this.sortColumn = sortColumn;

            var sortOrdering = new ComboBox(this);
            with (sortOrdering) {
               for (var i = 0; i != parameters.sortOrderings.length; ++i) {
                  addItem(parameters.sortOrderings[i]);
               }
               maxVisibleItemCount = parameters.sortOrderings.length;
               currentItem = parameters.sortOrdering;
               onItemSelected = function(item) {
                  parameters.sortOrdering = item;
                  tabulationSort(this.dialog);
               };
               toolTip =
"<p>This parameter specifies a table sort ordering.</p>";
            }
            add(sortOrdering);
            this.sortOrdering = sortOrdering;
         }
         add(buttonPane);
      }
   }
   tabulationSection.adjustToContents();
   tabulationSection.show();
   tabulationSectionBar.setSection(tabulationSection);

   var propertyPlotSectionBar = new SectionBar(this);
   propertyPlotSectionBar.setTitle("Plots");

   var propertyPlotSection = new Control(this);
   with (propertyPlotSection) {
      sizer = new VerticalSizer;
      with (sizer) {
         spacing = 6;

         var controlPane = new HorizontalSizer;
         with (controlPane) {
            spacing = 6;

            var labelMinWidth = Math.round(
               this.font.width("Ordinate:M")
            );

            var propertyPlotOrdinate = new HorizontalSizer;
            with (propertyPlotOrdinate) {
               spacing = 4;
               var localToolTip =
"<p>This parameter specifies the plot ordinate.</p>";

               var label = new Label(this);
               with (label) {
                  font = this.font;
                  text = "Ordinate:";
                  textAlignment = TextAlign_Right | TextAlign_VertCenter;
                  setFixedWidth(labelMinWidth);
                  toolTip = localToolTip;
               }
               add(label);

               var comboBox = new ComboBox(this);
               with (comboBox) {
                  font = this.font;
                  for (var i = 0; i != parameters.propertyPlotOrdinates.length; ++i) {
                     addItem(parameters.propertyPlotOrdinates[i]);
                  }
                  maxVisibleItemCount = parameters.propertyPlotOrdinates.length;
                  currentItem = parameters.propertyPlotOrdinate;
                  onItemSelected = function(item) {
                     parameters.propertyPlotOrdinate = item;
                     propertyPlotUpdate(this.dialog);
                  };
                  toolTip = localToolTip;
               }
               add(comboBox);
               this.propertyPlotOrdinate = comboBox;
               addStretch();
            }
            add(propertyPlotOrdinate);
            addStretch();

            var unlockAllButton = new PushButton(this);
            with (unlockAllButton) {
               text = "Unlock All";
               onClick = function() {
                  propertyPlotUnlockAll(this.dialog);
               };
               toolTip =
"<p>Unlock all locked subframes.</p>";
            };
            add(unlockAllButton);
            this.propertyPlotUnlockAllButton = unlockAllButton;

            var saveAsButton = new PushButton(this);
            with (saveAsButton) {
               text = "Save Plots As...";
               onClick = function() {
                  this.dialog.outputPropertyPlotsFilePath =
                     propertyPlotSaveAs(this.dialog);
                  if (this.dialog.outputPropertyPlotsFilePath != null) {
                     this.dialog.outputPropertyPlotsProcess = true;
                     this.dialog.ok();
                  }
               };
               toolTip =
"<p>Save the plots as a multiple image FITS file.</p>";
            }
            add(saveAsButton);
            this.propertyPlotSaveAsButton = saveAsButton;
         }
         add(controlPane);

         var bitmapPane = new HorizontalSizer;
         with (bitmapPane) {
            var bitmapBox = new BitmapBox(this);
            with (bitmapBox) {
               setFixedHeight(this.displayPixelRatio * (this.propertyPlotBitmapBoxHeight + scrollBarHeight));
               setBitmap(null);

               onResize = function() {
                  propertyPlotOnResize(this.dialog);
               };
               onMouseRelease = function(x, y, button, buttons, modifiers) {
                  propertyPlotOnMouseRelease(
                     this.dialog, x, y, button, buttons, modifiers
                  );
               };
            }
            add(bitmapBox);
            this.propertyPlotBitmapBox = bitmapBox;
         }
         add(bitmapPane);
      }
   }
   propertyPlotSection.adjustToContents();
   propertyPlotSection.setFixedHeight();
   propertyPlotSection.hide();
   propertyPlotSectionBar.setSection(propertyPlotSection);

   var outputSectionBar = new SectionBar(this);
   outputSectionBar.setTitle("Output");

   var outputSection = new Control(this);
   with (outputSection) {
      sizer = new VerticalSizer;
      with (sizer) {
         spacing = 6;

         var labelMinWidth =
            Math.round(this.font.width("Approved directory:M"));
         var editMinWidth =
            Math.round(platformFontWidthFactor * 10.0 * this.font.width('M'));

         var approvedAction = new HorizontalSizer;
         with (approvedAction) {
            spacing = 4;
            var localToolTip =
"<p>This parameter specifies the approved subframe output action, either copy, " +
"move or none.</p>";

            var label = new Label(this);
            with (label) {
               text = "Approved action:";
               textAlignment = TextAlign_Right | TextAlign_VertCenter;
               setFixedWidth(labelMinWidth);
               toolTip = localToolTip;
            }
            add(label);

            var comboBox = new ComboBox(this);
            with (comboBox) {
               for (var i = 0; i != parameters.outputActions.length; ++i) {
                  addItem(parameters.outputActions[i]);
               }
               maxVisibleItemCount = parameters.outputActions.length;
               currentItem = parameters.approvedAction;
               onItemSelected = function(item) {
                  parameters.approvedAction = item;
               };
               toolTip = localToolTip;
            }
            add(comboBox);
            this.approvedActionComboBox = comboBox;
            addStretch();
         }
         add(approvedAction);

         var approvedDirectory = new HorizontalSizer;
         with (approvedDirectory) {
            spacing = 4;
            var toolTipLocal =
"<p>This is the directory where all approved subframe files will be copied or " +
"moved.</p>" +
"<p>If this field is left blank, approved files will be copied or moved to the same " +
"directories as their corresponding target files.</p>";

            var label = new Label(this);
            with (label) {
               text = "Approved directory:";
               textAlignment = TextAlign_Right | TextAlign_VertCenter;
               setFixedWidth(labelMinWidth);
               toolTip = toolTipLocal;
            }
            add(label);

            var edit = new Edit(this);
            with (edit) {
               text = parameters.approvedDirectory;
               onEditCompleted = function() {
                  var dir = File.windowsPathToUnix(this.text.trim());
                  if (dir.length != 0 && dir.charAt(dir.length - 1) == "/") {
                     dir = dir.substring(0, dir.length - 1);
                  }
                  parameters.approvedDirectory = dir;
                  this.text = parameters.approvedDirectory;
               };
            }
            add(edit);
            this.approvedDirectoryEdit = edit;

            var button = new ToolButton(this);
            with (button) {
               icon = this.scaledResource(":/browser/select-file.png");
               setScaledFixedSize(20, 20);
               onClick = function() {
                  var getDirectoryDialog = new GetDirectoryDialog;
                  with (getDirectoryDialog) {
                     initialPath = parameters.approvedDirectory;
                     caption = "Select Approved Directory";
                     if (execute()) {
                        var dir = directory;
                        if (dir.length != 0 && dir.charAt(dir.length - 1) == "/") {
                           dir = dir.substring(0, dir.length - 1);
                        }
                        parameters.approvedDirectory = dir;
                        this.dialog.approvedDirectoryEdit.text =
                           parameters.approvedDirectory;
                     }
                  }
               };
               toolTip =
"<p>Select the approved directory.</p>";
            }
            add(button);
         }
         add(approvedDirectory);

         var approvedPostfix = new HorizontalSizer;
         with (approvedPostfix) {
            spacing = 4;
            var toolTipLocal =
"<p>This is a postfix that will be appended to the file name of each copied or moved " +
"approved subframe.</p>";

            var label = new Label(this);
            with (label) {
               text = "Approved postfix:";
               textAlignment = TextAlign_Right | TextAlign_VertCenter;
               setFixedWidth(labelMinWidth);
               toolTip = toolTipLocal;
            }
            add(label);

            var edit = new Edit(this);
            with (edit) {
               setFixedWidth(editMinWidth);
               text = parameters.approvedPostfix;
               onEditCompleted = function() {
                  parameters.approvedPostfix = this.text;
               };
            }
            add(edit);
            this.approvedPostfixEdit = edit;
            addStretch();
         }
         add(approvedPostfix);

         var rejectedAction = new HorizontalSizer;
         with (rejectedAction) {
            spacing = 4;
            var localToolTip =
"<p>This parameter specifies the rejected subframe output action, either copy, " +
"move or none.</p>";

            var label = new Label(this);
            with (label) {
               text = "Rejected action:";
               textAlignment = TextAlign_Right | TextAlign_VertCenter;
               setFixedWidth(labelMinWidth);
               toolTip = localToolTip;
            }
            add(label);

            var comboBox = new ComboBox(this);
            with (comboBox) {
               for (var i = 0; i != parameters.outputActions.length; ++i) {
                  addItem(parameters.outputActions[i]);
               }
               maxVisibleItemCount = parameters.outputActions.length;
               currentItem = parameters.rejectedAction;
               onItemSelected = function(item) {
                  parameters.rejectedAction = item;
               };
               toolTip = localToolTip;
            }
            add(comboBox);
            this.rejectedActionComboBox = comboBox;
            addStretch();
         }
         add(rejectedAction);

         var rejectedDirectory = new HorizontalSizer;
         with (rejectedDirectory) {
            spacing = 4;
            var toolTipLocal =
"<p>This is the directory where all rejected subframe files will be copied or " +
"moved.</p>" +
"<p>If this field is left blank, rejected files will be copied or moved to the same " +
"directories as their corresponding target files.</p>";

            var label = new Label(this);
            with (label) {
               text = "Rejected directory:";
               textAlignment = TextAlign_Right | TextAlign_VertCenter;
               setFixedWidth(labelMinWidth);
               toolTip = toolTipLocal;
            }
            add(label);

            var edit = new Edit(this);
            with (edit) {
               text = parameters.rejectedDirectory;
               onEditCompleted = function() {
                  var dir = File.windowsPathToUnix(this.text.trim());
                  if (dir.length != 0 && dir.charAt(dir.length - 1) == "/") {
                     dir = dir.substring(0, dir.length - 1);
                  }
                  parameters.rejectedDirectory = dir;
                  this.text = parameters.rejectedDirectory;
               };
            }
            add(edit);
            this.rejectedDirectoryEdit = edit;

            var button = new ToolButton(this);
            with (button) {
               icon = this.scaledResource(":/browser/select-file.png");
               setScaledFixedSize( 20, 20 );
               onClick = function() {
                  var getDirectoryDialog = new GetDirectoryDialog;
                  with (getDirectoryDialog) {
                     initialPath = parameters.rejectedDirectory;
                     caption = "Select Rejected Directory";
                     if (execute()) {
                        var dir = directory;
                        if (dir.length != 0 && dir.charAt(dir.length - 1) == "/") {
                           dir = dir.substring(0, dir.length - 1);
                        }
                        parameters.rejectedDirectory = dir;
                        this.dialog.rejectedDirectoryEdit.text =
                           parameters.rejectedDirectory;
                     }
                  }
               };
               toolTip =
"<p>Select the rejected directory.</p>";
            }
            add(button);
         }
         add(rejectedDirectory);

         var rejectedPostfix = new HorizontalSizer;
         with (rejectedPostfix) {
            spacing = 4;
            var toolTipLocal =
"<p>This is a postfix that will be appended to the file name of each copied or moved " +
"rejected subframe.</p>";

            var label = new Label(this);
            with (label) {
               text = "Rejected postfix:";
               textAlignment = TextAlign_Right | TextAlign_VertCenter;
               setFixedWidth(labelMinWidth);
               toolTip = toolTipLocal;
            }
            add(label);

            var edit = new Edit(this);
            with (edit) {
               setFixedWidth(editMinWidth);
               text = parameters.rejectedPostfix;
               onEditCompleted = function() {
                  parameters.rejectedPostfix = this.text;
               };
            }
            add(edit);
            this.rejectedPostfixEdit = edit;
            addStretch();
         }
         add(rejectedPostfix);

         var starMapDirectory = new HorizontalSizer;
         with (starMapDirectory) {
            spacing = 4;
            var toolTipLocal =
"<p>This is the directory where all star map files will be written.</p>" +
"<p>If this field is left blank, star map files will be written to the same directories " +
"as their corresponding target files.</p>";

            var label = new Label(this);
            with (label) {
               text = "Star map directory:";
               textAlignment = TextAlign_Right | TextAlign_VertCenter;
               setFixedWidth(labelMinWidth);
               toolTip = toolTipLocal;
            }
            add(label);

            var edit = new Edit(this);
            with (edit) {
               text = parameters.starMapDirectory;
               onEditCompleted = function() {
                  var dir = File.windowsPathToUnix(this.text.trim());
                  if (dir.length != 0 && dir.charAt(dir.length - 1) == "/") {
                     dir = dir.substring(0, dir.length - 1);
                  }
                  parameters.starMapDirectory = dir;
                  this.text = parameters.starMapDirectory;
               };
            }
            add(edit);
            this.starMapDirectoryEdit = edit;

            var button = new ToolButton(this);
            with (button) {
               icon = this.scaledResource(":/browser/select-file.png");
               setScaledFixedSize( 20, 20 );
               onClick = function() {
                  var getDirectoryDialog = new GetDirectoryDialog;
                  with (getDirectoryDialog) {
                     initialPath = parameters.starMapDirectory;
                     caption = "Select Star Map Directory";
                     if (execute()) {
                        var dir = directory;
                        if (dir.length != 0 && dir.charAt(dir.length - 1) == "/") {
                           dir = dir.substring(0, dir.length - 1);
                        }
                        parameters.starMapDirectory = dir;
                        this.dialog.starMapDirectoryEdit.text =
                           parameters.starMapDirectory;
                     }
                  }
               };
               toolTip =
"<p>Select the star map directory.</p>";
            }
            add(button);
         }
         add(starMapDirectory);

         var starMapPostfix = new HorizontalSizer;
         with (starMapPostfix) {
            spacing = 4;
            var toolTipLocal =
"<p>This is a postfix that will be appended to the file name of each " +
"star map.</p>";

            var label = new Label(this);
            with (label) {
               text = "Star map postfix:";
               textAlignment = TextAlign_Right | TextAlign_VertCenter;
               setFixedWidth(labelMinWidth);
               toolTip = toolTipLocal;
            }
            add(label);

            var edit = new Edit(this);
            with (edit) {
               setFixedWidth(editMinWidth);
               text = parameters.starMapPostfix;
               onEditCompleted = function() {
                  parameters.starMapPostfix = this.text;
               };
            }
            add(edit);
            this.starMapPostfixEdit = edit;
            addStretch();
         }
         add(starMapPostfix);

         var weightKeyword = new HorizontalSizer;
         with (weightKeyword) {
            spacing = 4;
            var toolTipLocal =
"<p>This is the custom FITS keyword used to record subframe weights in copied " +
"subframes.</p>" +
"<p>If this field is left blank or if the subframe is moved, subframe weights will not " +
"be recorded.</p>";

            var label = new Label(this);
            with (label) {
               text = "Weight keyword:";
               textAlignment = TextAlign_Right | TextAlign_VertCenter;
               setFixedWidth(labelMinWidth);
               toolTip = toolTipLocal;
            }
            add(label);

            var edit = new Edit(this);
            with (edit) {
               setFixedWidth(editMinWidth);
               text = parameters.weightKeyword;
               onEditCompleted = function() {
                  parameters.weightKeyword = this.text;
               };
            }
            add(edit);
            this.weightKeywordEdit = edit;
            addStretch();
         }
         add(weightKeyword);

         var overwriteExistingFiles = new HorizontalSizer;
         with (overwriteExistingFiles) {
            spacing = 4;
            addSpacing(labelMinWidth);
            addSpacing(spacing);

            var checkBox = new CheckBox(this);
            with (checkBox) {
               font = this.font;
               text = "Overwrite existing files";
               checked = parameters.overwriteExistingFiles;
               onCheck = function(checked) {
                  parameters.overwriteExistingFiles = checked;
               };
               toolTip =
"<p>If this option is enabled the script will overwrite existing files with the " +
"same names as generated output files. This can be dangerous because the original " +
"contents of the overwritten files will be lost.</p>" +
"<p><b>Warning: Use this option <u>at your own risk</u></b>.</p>";
            }
            add(checkBox);
            this.overwriteExistingFilesCheckBox = checkBox;
            addStretch();
         }
         add(overwriteExistingFiles);

         var onError = new HorizontalSizer;
         with (onError) {
            spacing = 4;
            var localToolTip =
"<p>This parameter specifies what to do if there are errors during the measurement " +
"and output processes.</p>";

            var label = new Label(this);
            with (label) {
               text = "On error:";
               textAlignment = TextAlign_Right | TextAlign_VertCenter;
               setFixedWidth(labelMinWidth);
               toolTip = localToolTip;
            }
            add(label);

            var comboBox = new ComboBox(this);
            with (comboBox) {
               for (var i = 0; i != parameters.onErrors.length; ++i) {
                  addItem(parameters.onErrors[i]);
               }
               maxVisibleItemCount = parameters.onErrors.length;
               currentItem = parameters.onError;
               onItemSelected = function(item) {
                  parameters.onError = item;
               };
               toolTip = localToolTip;
            }
            add(comboBox);
            this.onErrorComboBox = comboBox;
            addStretch();
         }
         add(onError);
         addSpacing(4);
      }
   }
   outputSection.adjustToContents();
   outputSection.setFixedHeight();
   outputSection.hide();
   outputSectionBar.setSection(outputSection);

   var buttonPane = new HorizontalSizer;
   with (buttonPane) {
      spacing = 4;

      var newInstance = new ToolButton(this);
      with (newInstance) {
         icon = this.scaledResource(":/process-interface/new-instance.png");
         setScaledFixedSize( 20, 20 );
         toolTip =
            "<p>New instance.</p>";
         onMousePress = function() {
            this.hasFocus = true;
            this.pushed = false;
            parameters.storeParameters();
            parent.newInstance();
         };
      }
      add(newInstance);

      this.browseDocButton = new ToolButton(this);
      this.browseDocButton.icon = this.scaledResource(":/process-interface/browse-documentation.png");
      this.browseDocButton.setScaledFixedSize( 20, 20 );
      this.browseDocButton.toolTip = "<p>Browse Documentation</p>";
      this.browseDocButton.onClick = function ()
      {
         if ( !Dialog.browseScriptDocumentation( "SubframeSelector" ) )
            (new MessageBox( "<p>Documentation has not been installed.</p>",
               TITLE,
               StdIcon_Error,
               StdButton_Ok
            )).execute();
      };
      add( this.browseDocButton );

   this.addLabel = function(pane, text, toolTip) {
      var label = new Label(this);
      pane.add(label);

      label.text = text;
      label.toolTip = toolTip;
      label.textAlignment = TextAlign_Right | TextAlign_VertCenter;

      return label;
   };

      this.versionLabel = this.addLabel(
         buttonPane,
         "Version " + VERSION,
         "<p><b>" + TITLE + " Version " + VERSION + "</b></p>" +

"<p>Facilitates subframe evaluation, selection and weighting based on several subframe " +
"quality related measurements, including estimates of star profile <i>full width at " +
"half maximum</i> (FWHM), star profile <i>eccentricity</i> and subframe " +
"<i>signal to noise ratio weight</i>. Approved/rejected subframes may be copied/moved " +
"to output directories for postprocessing. Subframe weights may be recorded in the " +
"FITS header of the copies.</p>" +

         "<p>Copyright &copy; 2012-2018 Mike Schuster. All Rights " +
         "Reserved.<br>" +
         "Copyright &copy; 2003-2018 Pleiades Astrophoto S.L. All Rights " +
         "Reserved.</p>"
      );

      addStretch();

      var measureButton = new PushButton(this);
      with (measureButton) {
         text = "Measure";
         onClick = function() {
            this.dialog.measureProcess = true;
            this.dialog.ok();
         };
         toolTip =
"<p>Measure the properties of the target subframes.</p>";
      };
      add(measureButton);
      this.measureButton = measureButton;

      var outputSubframesButton = new PushButton(this);
      with (outputSubframesButton) {
         text = "Output Subframes";
         onClick = function() {
            this.dialog.outputSubframesProcess = true;
            this.dialog.ok();
         };
         toolTip =
"<p>Copy/move the approved/rejected subframes to output directories.</p>";
      };
      add(outputSubframesButton);
      this.outputSubframesButton = outputSubframesButton;

      var outputMapsButton = new PushButton(this);
      with (outputMapsButton) {
         text = "Output Maps";
         onClick = function() {
            this.dialog.outputMapsProcess = true;
            this.dialog.ok();
         };
         toolTip =
"<p>Output target subframe star maps.</p>";
      };
      add(outputMapsButton);
      this.outputMapsButton = outputMapsButton;

      var resetButton = new PushButton(this);
      with (resetButton) {
         text = "Reset";
         onClick = function() {
            parameters.reset();

            this.dialog.targetSubframesFullPathsCheckBox.checked =
               parameters.targetSubframesFullPaths;
            this.dialog.targetSubframesUseFileCacheCheckBox.checked =
               parameters.useFileCache;
            subframeCacheFlush();

            this.dialog.subframeScaleEdit.text =
               format("%.3f", parameters.subframeScale);
            this.dialog.cameraGainEdit.text =
               format("%.3f", parameters.cameraGain);
            this.dialog.cameraResolutionComboBox.currentItem =
               parameters.cameraResolution;
            this.dialog.siteLocalMidnightSpinBox.value =
               parameters.siteLocalMidnight;
            this.dialog.scaleUnitComboBox.currentItem =
               parameters.scaleUnit;
            this.dialog.dataUnitComboBox.currentItem =
               parameters.dataUnit;

            this.dialog.starDetectionLayersSpinBox.value =
               parameters.starDetectionLayers;
            this.dialog.noiseReductionLayersSpinBox.value =
               parameters.noiseReductionLayers;
            this.dialog.hotPixelFilterRadiusSpinBox.value =
               parameters.hotPixelFilterRadius;
            this.dialog.applyHotPixelFilterToDetectionImageCheckBox.checked =
               parameters.applyHotPixelFilterToDetectionImage;
            this.dialog.logStarDetectionSensitivityNumericControl.setValue(
               Math.log10(parameters.starDetectionSensitivity
            ));
            this.dialog.starPeakResponseNumericControl.setValue(
               parameters.starPeakResponse
            );
            this.dialog.maximumStarDistortionNumericControl.setValue(
               parameters.maximumStarDistortion
            );
            this.dialog.upperLimitNumericControl.setValue(
               parameters.upperLimit
            );
            this.dialog.subframeRegionLeftEdit.text =
               format("%d", parameters.subframeRegionLeft);
            this.dialog.subframeRegionTopEdit.text =
               format("%d", parameters.subframeRegionTop);
            this.dialog.subframeRegionWidthEdit.text =
               format("%d", parameters.subframeRegionWidth);
            this.dialog.subframeRegionHeightEdit.text =
               format("%d", parameters.subframeRegionHeight);
            this.dialog.pedestalEdit.text =
               format("%d", parameters.pedestal);
            this.dialog.modelFunctionComboBox.currentItem =
               parameters.modelFunction;
            this.dialog.circularModelCheckBox.checked =
               parameters.circularModel;

            this.dialog.selectorExpressionEdit.text =
               parameters.selectorExpression;
            this.dialog.selectorExpressionState.icon =
               this.dialog.validExpressionBitmap;
            this.dialog.weightingExpressionEdit.text =
               parameters.weightingExpression;
            this.dialog.weightingExpressionState.icon =
               this.dialog.validExpressionBitmap;

            this.dialog.sortColumn.currentItem =
               parameters.sortColumn;
            this.dialog.sortOrdering.currentItem =
               parameters.sortOrdering;

            this.dialog.approvedActionComboBox.currentItem =
               parameters.approvedAction;
            this.dialog.approvedDirectoryEdit.text =
               parameters.approvedDirectory;
            this.dialog.approvedPostfixEdit.text =
               parameters.approvedPostfix;
            this.dialog.rejectedActionComboBox.currentItem =
               parameters.rejectedAction;
            this.dialog.rejectedDirectoryEdit.text =
               parameters.rejectedDirectory;
            this.dialog.rejectedPostfixEdit.text =
               parameters.rejectedPostfix;
            this.dialog.starMapDirectoryEdit.text =
               parameters.starMapDirectory;
            this.dialog.starMapPostfixEdit.text =
               parameters.starMapPostfix;
            this.dialog.weightKeywordEdit.text =
               parameters.weightKeyword;
            this.dialog.overwriteExistingFilesCheckBox.checked =
               parameters.overwriteExistingFiles;
            this.dialog.onErrorComboBox.currentItem =
               parameters.onError;

            this.dialog.propertyPlotOrdinate.currentItem =
               parameters.propertyPlotOrdinate;
            this.dialog.propertyPlotBitmapBox.setBitmap(null);

            resetDialog(this.dialog);
         };
         toolTip =
"<p>Resets all parameters to their default values.</p>";
      }
      add(resetButton);
      this.resetButton = resetButton;

      var dismissButton = new PushButton(this);
      with (dismissButton) {
         defaultButton = true;
         text = "Dismiss";
         onClick = function() {
            this.dialog.cancel();
         };
         toolTip =
"<p>Dismiss the script.</p>";
      }
      add(dismissButton);
      this.dismissButton = dismissButton;
   }

   this.sizer = new VerticalSizer;
   with (this.sizer) {
      margin = sizerMargin;
      spacing = 6;
      add(targetSubframesSectionBar);
      add(targetSubframesSection);
      add(systemParametersSectionBar);
      add(systemParametersSection);
      add(starDetectionAndFittingSectionBar);
      add(starDetectionAndFittingSection);
      add(expressionsSectionBar);
      add(expressionsSection);
      add(tabulationSectionBar);
      add(tabulationSection);
      add(propertyPlotSectionBar);
      add(propertyPlotSection);
      add(outputSectionBar);
      add(outputSection);
      add(buttonPane);
   }

   this.adjustToContents();

   this.setScaledMinWidth(800);

   targetSubframesUpdateTreeBox(this);
   tabulationUpdateTreeBox(this);
}
parametersDialogPrototype.prototype = new Dialog;

// ----------------------------------------------------------------------------
// EOF SubframeSelectorParametersDialog.js - Released 2018-11-05T16:53:08Z
