// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// SubframeSelector.js - Released 2018-11-05T16:53:08Z
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

#define TITLE "SubframeSelector"
#define VERSION "1.12"

#feature-id Batch Processing > SubframeSelector

#feature-info \
Facilitates subframe evaluation, selection and weighting based on several subframe \
quality related measurements, including estimates of star profile <i>full width at \
half maximum</i> (FWHM), star profile <i>eccentricity</i> and subframe \
<i>signal to noise ratio weight</i>. Approved/rejected subframes may be copied/moved \
to output directories for postprocessing. Subframe weights may be recorded in the \
FITS header of the copies.<br/>\
For more information see the script documentation and the dialog tool tip \
messages.<br/>\
Copyright &copy; 2012-2018 Mike Schuster. All Rights Reserved.<br>\
Copyright &copy; 2003-2018 Pleiades Astrophoto S.L. All Rights Reserved.

#include <pjsr/ButtonCodes.jsh>
#include <pjsr/Color.jsh>
#include <pjsr/ColorSpace.jsh>
#include <pjsr/CryptographicHash.jsh>
#include <pjsr/DataType.jsh>
#include <pjsr/FocusStyle.jsh>
#include <pjsr/FontFamily.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/NumericControl.jsh>
#include <pjsr/PenStyle.jsh>
#include <pjsr/SampleType.jsh>
#include <pjsr/SectionBar.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/UndoFlag.jsh>

#include "SubframeSelectorBitmapBox.js"
#include "SubframeSelectorContourPlot.js"
#include "SubframeSelectorEditDialog.js"
#include "SubframeSelectorEvaluator.js"
#include "SubframeSelectorImageWindow.js"
#include "SubframeSelectorMeasure.js"
#include "SubframeSelectorParameters.js"
#include "SubframeSelectorParametersDialog.js"
#include "SubframeSelectorPropertyPlot.js"
#include "SubframeSelectorReadWriteImage.js"
#include "SubframeSelectorSubframeDescription.js"

// Dynamic methods for core Control object.
#iflt __PI_BUILD__ 1168
if (!Control.prototype.displayPixelRatio) {
   Control.prototype.displayPixelRatio = 1;
}
#endif

if (!Control.prototype.logicalPixelsToPhysical) {
   Control.prototype.logicalPixelsToPhysical = function(p) {
      return p;
   };
}

if (!Control.prototype.physicalPixelsToLogical) {
   Control.prototype.physicalPixelsToLogical = function(p) {
      return p;
   };
}

if (!Control.prototype.setScaledFixedHeight) {
   Control.prototype.setScaledFixedHeight = function(h) {
      this.setFixedHeight(h);
   };
}

if (!Control.prototype.setScaledFixedSize) {
   Control.prototype.setScaledFixedSize = function(w, h) {
      this.setFixedSize(w, h);
   };
}

if (!Control.prototype.setScaledFixedWidth) {
   Control.prototype.setScaledFixedWidth = function(w) {
      this.setFixedWidth(w);
   };
}

if (!Control.prototype.setScaledMinHeight) {
   Control.prototype.setScaledMinHeight = function(h) {
      this.setMinHeight(h);
   };
}

if (!Control.prototype.setScaledMinSize) {
   Control.prototype.setScaledMinSize = function(w, h) {
      this.setMinSize(w, h);
   };
}

if (!Control.prototype.setScaledMinWidth) {
   Control.prototype.setScaledMinWidth = function(w) {
      this.setMinWidth(w);
   };
}

if (!Control.prototype.scaledResource) {
   Control.prototype.scaledResource = function(r) {
      return r;
   };
}

function enableButtons(dialog) {
   var numberOfTargetSubframes = parameters.targetSubframeDescriptions.length;
   var numberOfCheckedTargetSubframes = 0;
   var numberOfSelectedTargetSubframes = 0;
   for (var i = 0; i != parameters.targetSubframeDescriptions.length; ++i) {
      if (parameters.targetSubframeDescriptions[i].checked) {
         ++numberOfCheckedTargetSubframes;
      }
      if (parameters.targetSubframeDescriptions[i].selected) {
         ++numberOfSelectedTargetSubframes;
      }
   }

   var numberOfEvaluations = parameters.evaluationsDescriptions.length;
   var numberOfCheckedEvaluations = 0;
   var numberofSelectedEvaluations = 0;
   var numberofLockedEvaluations = 0;
   var numberofSelectedLockedEvaluations = 0;
   for (var i = 0; i != parameters.evaluationsDescriptions.length; ++i) {
      if (parameters.evaluationsDescriptions[i].checked) {
         ++numberOfCheckedEvaluations;
      }
      if (parameters.evaluationsDescriptions[i].selected) {
         ++numberofSelectedEvaluations;
      }
      if (parameters.evaluationsDescriptions[i].locked) {
         ++numberofLockedEvaluations;
      }
      if (
         parameters.evaluationsDescriptions[i].selected &&
         parameters.evaluationsDescriptions[i].locked
      ) {
         ++numberofSelectedLockedEvaluations;
      }
   }

   dialog.targetSubframesToggleSelectedButton.enabled =
      numberOfSelectedTargetSubframes != 0;
   dialog.targetSubframesRemoveSelectedButton.enabled =
      numberOfSelectedTargetSubframes != 0;
   dialog.targetSubframesClearButton.enabled =
      numberOfTargetSubframes != 0;

   dialog.evaluationsToggleSelectedButton.enabled =
      numberofSelectedEvaluations != 0;
   dialog.evaluationsUnlockSelectedButton.enabled =
      numberofSelectedLockedEvaluations != 0;
   dialog.evaluationsSaveAsButton.enabled =
      numberOfEvaluations != 0;

   dialog.propertyPlotUnlockAllButton.enabled =
      numberofLockedEvaluations != 0;
   dialog.propertyPlotSaveAsButton.enabled =
      numberOfEvaluations != 0;

   dialog.measureButton.enabled =
      numberOfCheckedTargetSubframes != 0;
   dialog.outputMapsButton.enabled =
      numberOfEvaluations != 0;
   dialog.outputSubframesButton.enabled =
      numberOfEvaluations != 0;
}

function backgroundColorSelection(dialog, checked, index) {
   return checked ?
      (index % 2 == 0 ? dialog.normalCheckedColor : dialog.alternateCheckedColor) :
      (index % 2 == 0 ? dialog.normalUncheckedColor : dialog.alternateUncheckedColor);
}

function targetSubframesUpdateTreeBox(dialog) {
   try {
      dialog.targetSubframesTreeBox.clear();
      for (var i = 0; i != parameters.targetSubframeDescriptions.length; ++i) {
         var description = parameters.targetSubframeDescriptions[i];
         var treeBoxNode = new TreeBoxNode(dialog.targetSubframesTreeBox);
         with (treeBoxNode) {
            checkable = true;
            //try {
               checked = description.checked;
            //}
            //catch (error) {
            //   checked = true;
            //}
            //try {
               selected = description.selected;
            //}
            //catch (error) {
            //   selected = false;
            //}
            var filePath = description.filePath;
            setText(
               0,
               format("%d ", i + 1) +
               (parameters.targetSubframesFullPaths ? filePath : File.extractName(filePath))
            );
            if (!parameters.targetSubframesFullPaths) {
               setToolTip(0, filePath);
            }
            setBackgroundColor(0, backgroundColorSelection(dialog, description.checked, i));
         }
      }
   }
   catch (error) {
      // handle corrupted script settings and parameters.
      parameters.targetSubframeDescriptions = [];
      dialog.targetSubframesTreeBox.clear();
      tabulationClear(dialog);
      subframeCacheFlush();
   }
   enableButtons(dialog);
}

function targetSubframesSelectionUpdated(dialog) {
   var targetSubframeDescriptions = [];
   for (var i = 0; i != parameters.targetSubframeDescriptions.length; ++i) {
      var description = parameters.targetSubframeDescriptions[i];
      var child = dialog.targetSubframesTreeBox.child(i);
      targetSubframeDescriptions.push(description.newCheckedSelected(
         child.checked,
         child.selected
      ));
      child.setBackgroundColor(0, backgroundColorSelection(dialog, child.checked, i));
   }
   parameters.targetSubframeDescriptions = targetSubframeDescriptions;
   enableButtons(dialog);
}

function targetSubframesNodeUpdated(dialog) {
   targetSubframesSelectionUpdated(dialog);
   tabulationClear(dialog);
}

function targetSubframesAddFiles(dialog) {
   //var directory = Settings.read(
   //   TITLE + "." + VERSION + "_" + "targetSubframesAddFilesDirectory", DataType_String
   //);
   //if (!Settings.lastReadOK || directory == null || !File.directoryExists(directory)) {
   //   directory = File.systemTempDirectory;
   //}
   var openFileDialog = new OpenFileDialog();
   with (openFileDialog) {
      caption = TITLE + ": Select Target Images";
      loadImageFilters();
      multipleSelections = true;
      //initialPath = directory;
      if (!execute()) {
         return;
      }
   }
   //if (openFileDialog.fileNames.length != 0) {
   //   Settings.write(
   //      TITLE + "." + VERSION + "_" + "targetSubframesAddFilesDirectory",
   //      DataType_String,
   //      File.extractDrive(openFileDialog.fileNames[0]) +
   //         File.extractDirectory(openFileDialog.fileNames[0])
   //   );
   //}

   for (var i = 0; i != openFileDialog.fileNames.length; ++i) {
      parameters.targetSubframeDescriptions.push(
         new targetSubframeDescription(true, false, openFileDialog.fileNames[i])
      );
   }
   targetSubframesUpdateTreeBox(dialog);
   tabulationClear(dialog);
}

function targetSubframesToggleSelected(dialog) {
   var targetSubframeDescriptions = [];
   for (var i = 0; i != parameters.targetSubframeDescriptions.length; ++i) {
      var description = parameters.targetSubframeDescriptions[i];
      var child = dialog.targetSubframesTreeBox.child(i);
      if (!child.selected) {
         targetSubframeDescriptions.push(description);
      }
      else {
         targetSubframeDescriptions.push(description.newCheckedSelected(
            !description.checked,
            description.selected
         ));
      }
   }
   parameters.targetSubframeDescriptions = targetSubframeDescriptions;
   targetSubframesUpdateTreeBox(dialog);
   tabulationClear(dialog);
}

function targetSubframesRemoveSelected(dialog) {
   var targetSubframeDescriptions = [];
   for (var i = 0; i != parameters.targetSubframeDescriptions.length; ++i) {
      var description = parameters.targetSubframeDescriptions[i];
      var child = dialog.targetSubframesTreeBox.child(i);
      if (!child.selected) {
         targetSubframeDescriptions.push(description);
      }
   }
   parameters.targetSubframeDescriptions = targetSubframeDescriptions;
   targetSubframesUpdateTreeBox(dialog);
   tabulationClear(dialog);
}

function targetSubframesClear(dialog) {
   parameters.targetSubframeDescriptions = [];
   targetSubframesUpdateTreeBox(dialog);
   tabulationClear(dialog);
}

function tabulationUpdateMedianMeanDeviation(
   dialog, medianTreeBoxNode, meanDeviationTreeBoxNode
) {
   var resolutionGain =
      parameters.cameraResolutionValues[parameters.cameraResolution] *
      parameters.actualCameraGain();

   for (var j = 1; j != parameters.columnNames.length - 1; ++j) {
      var values = [];
      for (var i = 0; i != parameters.evaluationsDescriptions.length; ++i) {
         var description = parameters.evaluationsDescriptions[i];
         if (true) {
            values.push([
               description.weight,
               description.FWHM,
               description.eccentricity,
               description.SNRWeight,
               description.median,
               description.dispersion,
               description.noise,
               description.starSupport,
               description.starResidual,
               description.noiseSupport,
               description.FWHMMeanDeviation,
               description.eccentricityMeanDeviation,
               description.starResidualMeanDeviation
            ][j - 1]);
         }
      }

      var medianMeanDeviation = medianMeanDeviationOfArray(values);
      medianTreeBoxNode.setText(
         j,
         [
            values.length == 0 ? "-" : floatFormat("%.3e", medianMeanDeviation[0]),
            values.length == 0 ? "-" :
               floatFormat("%.3f",
                  parameters.actualSubframeScale() * medianMeanDeviation[0]
               ),
            values.length == 0 ? "-" : floatFormat("%.3f", medianMeanDeviation[0]),
            values.length == 0 ? "-" : floatFormat("%.3e", medianMeanDeviation[0]),
            values.length == 0 ? "-" :
               floatFormat("%.3e",
                  resolutionGain * pedestalFunction(medianMeanDeviation[0])
               ),
            values.length == 0 ? "-" :
               floatFormat("%.3e", resolutionGain * medianMeanDeviation[0]),
            values.length == 0 ? "-" :
               floatFormat("%.3e", resolutionGain * medianMeanDeviation[0]),
            values.length == 0 ? "-" : format("%.0f", medianMeanDeviation[0]),
            values.length == 0 ? "-" : floatFormat("%.3e", medianMeanDeviation[0]),
            values.length == 0 ? "-" : floatFormat("%.3f", medianMeanDeviation[0]),

            values.length == 0 ? "-" :
               floatFormat("%.3f",
                  parameters.actualSubframeScale() * medianMeanDeviation[0]
               ),
            values.length == 0 ? "-" : floatFormat("%.3f", medianMeanDeviation[0]),
            values.length == 0 ? "-" : floatFormat("%.3e", medianMeanDeviation[0])
         ][j - 1]
      );
      meanDeviationTreeBoxNode.setText(
         j,
         [
            values.length == 0 ? "-" : floatFormat("%.3e", medianMeanDeviation[1]),
            values.length == 0 ? "-" :
               floatFormat("%.3e",
                  parameters.actualSubframeScale() * medianMeanDeviation[1]
               ),
            values.length == 0 ? "-" : floatFormat("%.3e", medianMeanDeviation[1]),
            values.length == 0 ? "-" : floatFormat("%.3e", medianMeanDeviation[1]),
            values.length == 0 ? "-" :
               floatFormat("%.3e", resolutionGain * medianMeanDeviation[1]),
            values.length == 0 ? "-" :
               floatFormat("%.3e", resolutionGain * medianMeanDeviation[1]),
            values.length == 0 ? "-" :
               floatFormat("%.3e", resolutionGain * medianMeanDeviation[1]),
            values.length == 0 ? "-" : format("%.0f", medianMeanDeviation[1]),
            values.length == 0 ? "-" : floatFormat("%.3e", medianMeanDeviation[1]),
            values.length == 0 ? "-" : floatFormat("%.3e", medianMeanDeviation[1]),

            values.length == 0 ? "-" :
               floatFormat("%.3e",
                  parameters.actualSubframeScale() * medianMeanDeviation[1]
               ),
            values.length == 0 ? "-" : floatFormat("%.3e", medianMeanDeviation[1]),
            values.length == 0 ? "-" : floatFormat("%.3e", medianMeanDeviation[1])
         ][j - 1]
      );
   }
}

function tabulationUpdateUnits(dialog) {
   for (var i = 0; i != parameters.columnNames.length; ++i) {
      dialog.evaluationsTreeBox.setHeaderText(i, parameters.columnName(i));
   }
   //for (var i = 0; i != parameters.sortColumns.length; ++i) {
   //   dialog.sortColumn.setItemText(i, parameters.sortColumnName(i));
   //}
   //for (var i = 0; i != parameters.propertyPlotOrdinates.length; ++i) {
   //   dialog.propertyPlotOrdinate.setItemText(i, parameters.propertyPlotOrdinateName(i));
   //}
}

function tabulationUpdateTreeBox(dialog) {
   var resolutionGain =
      parameters.cameraResolutionValues[parameters.cameraResolution] *
      parameters.actualCameraGain();

   tabulationUpdateUnits(dialog);

   dialog.evaluationsTreeBox.clear();
   for (var i = 0; i != parameters.evaluationsDescriptions.length; ++i) {
      var description = parameters.evaluationsDescriptions[i];
      var treeBoxNode = new TreeBoxNode(dialog.evaluationsTreeBox);
      with (treeBoxNode) {
         checked = description.checked;
         selected = description.selected;
         var index = description.index;
         for (var j = 0; j != parameters.columnNames.length; ++j) {
            setText(
               j,
               [
                  format("%d ", index + 1) + File.extractName(
                     parameters.targetSubframeDescriptions[index].filePath
                  ),
                  floatFormat("%.3e", description.weight),
                  floatFormat("%.3f",
                     parameters.actualSubframeScale() * description.FWHM
                  ),
                  floatFormat("%.3f", description.eccentricity),
                  floatFormat("%.3e", description.SNRWeight),
                  floatFormat("%.3e",
                     resolutionGain * pedestalFunction(description.median)
                  ),
                  floatFormat("%.3e", resolutionGain * description.dispersion),
                  floatFormat("%.3e", resolutionGain * description.noise),
                  format("%d", description.starSupport),
                  floatFormat("%.3e", description.starResidual),
                  floatFormat("%.3f", description.noiseSupport),
                  floatFormat("%.3f",
                     parameters.actualSubframeScale() * description.FWHMMeanDeviation
                  ),
                  floatFormat("%.3f", description.eccentricityMeanDeviation),
                  floatFormat("%.3e", description.starResidualMeanDeviation),
                  description.date
               ][j]
            );
         }

         setIcon(0, description.locked ? dialog.lockIcon : dialog.unlockIcon);
         for (var j = 0; j != dialog.evaluationsTreeBox.numberOfColumns; ++j) {
            setBackgroundColor(
               j, backgroundColorSelection(dialog, description.checked, i)
            );
         }
         setToolTip(0, parameters.targetSubframeDescriptions[index].filePath);
         for (var j = 1; j != dialog.evaluationsTreeBox.numberOfColumns; ++j) {
            setToolTip(j, text(0));
         }
      }
   }

   if (parameters.evaluationsDescriptions.length != 0) {
      var emptyTreeBoxNode = new TreeBoxNode(dialog.evaluationsTreeBox);
      with (emptyTreeBoxNode) {
         checkable = false;
         setText(0, "");
         for (var j = 0; j != dialog.evaluationsTreeBox.numberOfColumns; ++j) {
            setBackgroundColor(
               j,
               backgroundColorSelection(
                  dialog, true, dialog.evaluationsTreeBox.numberOfChildren - 1
               )
            );
         }

         for (var j = 0; j != parameters.columnNames.length; ++j) {
            setToolTip(j, parameters.columnToolTips[j]);
         }
      }

      var medianAllTreeBoxNode = new TreeBoxNode(dialog.evaluationsTreeBox);
      with (medianAllTreeBoxNode) {
         checkable = false;
         setText(0, parameters.medianRowTotal(
            parameters.evaluationsDescriptions.length
         ));
         for (var j = 0; j != dialog.evaluationsTreeBox.numberOfColumns; ++j) {
            setBackgroundColor(
               j,
               backgroundColorSelection(
                  dialog, true, dialog.evaluationsTreeBox.numberOfChildren - 1
               )
            );
         }
         setToolTip(0, parameters.medianRowToolTip);
      }

      var meanDeviationAllTreeBoxNode = new TreeBoxNode(dialog.evaluationsTreeBox);
      with (meanDeviationAllTreeBoxNode) {
         checkable = false;
         setText(0, parameters.meanDeviationRowTotal(
            parameters.evaluationsDescriptions.length
         ));
         for (var j = 0; j != dialog.evaluationsTreeBox.numberOfColumns; ++j) {
            setBackgroundColor(
               j,
               backgroundColorSelection(
                  dialog, true, dialog.evaluationsTreeBox.numberOfChildren - 1
               )
            );
         }
         setToolTip(0, parameters.meanDeviationRowToolTip);
      }

      tabulationUpdateMedianMeanDeviation(
         dialog, medianAllTreeBoxNode, meanDeviationAllTreeBoxNode
      );

      var numberOfCheckedEvaluations = 0;
      for (var i = 0; i != parameters.evaluationsDescriptions.length; ++i) {
         if (parameters.evaluationsDescriptions[i].checked) {
            ++numberOfCheckedEvaluations;
         }
      }

      dialog.evaluationsTreeBox.setHeaderText(
         0,
         parameters.columnIndexNameApprovedTotal(
            numberOfCheckedEvaluations, parameters.evaluationsDescriptions.length
         )
      );
   }
   else {
      dialog.evaluationsTreeBox.setHeaderText(
         0,
         parameters.columnIndexNameApprovedTotal(0, 0)
      );
   }

   enableButtons(dialog);
}

function tabulationUpdateCheckedSelectedLockedTreeBox(dialog) {
   for (var i = 0; i != parameters.evaluationsDescriptions.length; ++i) {
      var description = parameters.evaluationsDescriptions[i];
      var child = dialog.evaluationsTreeBox.child(i);
      with (child) {
         checked = description.checked;

         setIcon(0, description.locked ? dialog.lockIcon : dialog.unlockIcon);

         for (var j = 0; j != dialog.evaluationsTreeBox.numberOfColumns; ++j) {
            setBackgroundColor(
               j,
               backgroundColorSelection(dialog, description.checked, i)
            );
         }
      }
   }

   if (parameters.evaluationsDescriptions.length != 0) {
   /*
      var medianAllTreeBoxNode =
         dialog.evaluationsTreeBox.child(parameters.evaluationsDescriptions.length + 1);
      medianAllTreeBoxNode.setText(0, parameters.medianRowTotal(
         parameters.evaluationsDescriptions.length
      ));

      var meanDeviationAllTreeBoxNode =
         dialog.evaluationsTreeBox.child(parameters.evaluationsDescriptions.length + 2);
      meanDeviationAllTreeBoxNode.setText(0, parameters.meanDeviationRowTotal(
         parameters.evaluationsDescriptions.length
      ));

      tabulationUpdateMedianMeanDeviation(
         dialog, medianAllTreeBoxNode, meanDeviationAllTreeBoxNode
      );
   */

      var numberOfCheckedEvaluations = 0;
      for (var i = 0; i != parameters.evaluationsDescriptions.length; ++i) {
         if (parameters.evaluationsDescriptions[i].checked) {
            ++numberOfCheckedEvaluations;
         }
      }

      dialog.evaluationsTreeBox.setHeaderText(
         0,
         parameters.columnIndexNameApprovedTotal(
            numberOfCheckedEvaluations, parameters.evaluationsDescriptions.length
         )
      );
   }
   else {
      dialog.evaluationsTreeBox.setHeaderText(
         0,
         parameters.columnIndexNameApprovedTotal(0, 0)
      );
   }
}

function tabulationNodeUpdated(dialog) {
   var evaluationsDescriptions = [];
   for (var i = 0; i != parameters.evaluationsDescriptions.length; ++i) {
      var description = parameters.evaluationsDescriptions[i];
      var child = dialog.evaluationsTreeBox.child(i);
      evaluationsDescriptions.push(description.newCheckedSelectedLocked(
         child.checked,
         child.selected,
         description.locked || description.checked != child.checked
      ));
   }
   parameters.evaluationsDescriptions = evaluationsDescriptions;
   tabulationUpdateCheckedSelectedLockedTreeBox(dialog);
   propertyPlotUpdate(dialog);
   enableButtons(dialog);
}

function tabulationSort(dialog) {
   parameters.evaluationsDescriptions.sort(
      evaluationDescriptionCompare[parameters.sortColumn][parameters.sortOrdering]
   );

   tabulationUpdateTreeBox(dialog);
   propertyPlotUpdate(dialog);
}

function tabulationEvaluate(dialog) {
   tabulationUpdateUnits(dialog);
   if (parameters.evaluationsDescriptions.length == 0) {
      return;
   }

   var evaluationsDescriptions = [];
   for (var i = 0; i != parameters.evaluationsDescriptions.length; ++i) {
      var description = parameters.evaluationsDescriptions[i];

      description.SNRWeight = SNRWeightFunction(
         description.dispersion,
         description.noise,
         parameters.cameraGain,
         parameters.cameraResolutionValues[parameters.cameraResolution]
      );

      evaluationsDescriptions.push(description);
   }
   parameters.evaluationsDescriptions = evaluationsDescriptions;

   var evaluationsDescriptions = [];
   var descriptionStatistics = generateEvaluationDescriptionStatistics(parameters.evaluationsDescriptions);
   for (var i = 0; i != parameters.evaluationsDescriptions.length; ++i) {
      var description = parameters.evaluationsDescriptions[i];

      var weightEvaluator = new weightingExpressionEvaluator(
         parameters.weightingExpression,
         description,
         parameters.evaluationsDescriptions,
         parameters.actualSubframeScale(),
         parameters.actualCameraGain(),
         parameters.cameraResolutionValues[parameters.cameraResolution],
         descriptionStatistics
      );
      var weight = weightEvaluator.evaluate();
      if (weight != null) {
         description.weight = weight;
      }

      evaluationsDescriptions.push(description);
   }
   parameters.evaluationsDescriptions = evaluationsDescriptions;

   var evaluationsDescriptions = [];
   var descriptionStatistics = generateEvaluationDescriptionStatistics(parameters.evaluationsDescriptions);
   for (var i = 0; i != parameters.evaluationsDescriptions.length; ++i) {
      var description = parameters.evaluationsDescriptions[i];

      var selectorEvaluator = new selectorExpressionEvaluator(
         parameters.selectorExpression,
         description,
         parameters.evaluationsDescriptions,
         parameters.actualSubframeScale(),
         parameters.actualCameraGain(),
         parameters.cameraResolutionValues[parameters.cameraResolution],
         descriptionStatistics
      );
      var checked = selectorEvaluator.evaluate();
      if (checked != null && !description.locked) {
         description.checked = checked;
      }

      evaluationsDescriptions.push(description);
   }
   parameters.evaluationsDescriptions = evaluationsDescriptions;

   tabulationSort(dialog);
}

function tabulationToggleSelected(dialog) {
   var evaluationsDescriptions = [];
   for (var i = 0; i != parameters.evaluationsDescriptions.length; ++i) {
      var description = parameters.evaluationsDescriptions[i];
      var child = dialog.evaluationsTreeBox.child(i);
      if (!child.selected) {
         evaluationsDescriptions.push(description);
      }
      else {
         evaluationsDescriptions.push(description.newCheckedSelectedLocked(
            !description.checked,
            description.selected,
            true
         ));
      }
   }
   parameters.evaluationsDescriptions = evaluationsDescriptions;
   tabulationUpdateTreeBox(dialog);
   propertyPlotUpdate(dialog);
}

function tabulationUnlockedSelected(dialog) {
   var evaluationsDescriptions = [];
   for (var i = 0; i != parameters.evaluationsDescriptions.length; ++i) {
      var description = parameters.evaluationsDescriptions[i];
      var child = dialog.evaluationsTreeBox.child(i);
      if (!child.selected) {
         evaluationsDescriptions.push(description);
      }
      else {
         evaluationsDescriptions.push(description.newCheckedSelectedLocked(
            !description.checked,
            description.selected,
            false
         ));
      }
   }
   parameters.evaluationsDescriptions = evaluationsDescriptions;
   tabulationEvaluate(dialog);
}

function tabulationClear(dialog) {
   parameters.evaluationsDescriptions = [];
   tabulationUpdateTreeBox(dialog);
   propertyPlotUpdate(dialog);
}

function tabulationSaveAs(dialog) {
   //var directory = parameters.starMapDirectory;
   //if (directory == "" || !File.directoryExists(directory)) {
   //   directory = Settings.read(
   //      TITLE + "." + VERSION + "_" + "saveAsDirectory", DataType_String
   //   );
   //   if (
   //      !Settings.lastReadOK ||
   //      directory == null ||
   //      !File.directoryExists(directory)
   //   ) {
   //      directory = File.systemTempDirectory;
   //   }
   //}
   var saveFileDialog = new SaveFileDialog();
   with (saveFileDialog) {
      caption = TITLE + ": Save Table .csv File As";
      filters = [[".csv files", "*.csv"]];
      //initialPath = directory + "/" + "SubframeSelector_table.csv";
      initialPath = "SubframeSelector_table.csv";
      if (!execute()) {
         return;
      }
   }
   //Settings.write(
   //   TITLE + "." + VERSION + "_" + "saveAsDirectory",
   //   DataType_String,
   //   File.extractDrive(saveFileDialog.fileName) +
   //      File.extractDirectory(saveFileDialog.fileName)
   //);

   console.writeln("");
   console.writeln("<b>Save table as</b>: ", saveFileDialog.fileName);
   var startTime = new Date;

   parameters.evaluationsDescriptions.sort(
      evaluationDescriptionCompare[0][0]
   );

   try {
      var file = new File();
      file.createForWriting(saveFileDialog.fileName);

      file.outTextLn(TITLE + " Version " + VERSION);

      file.outTextLn("Subframe scale," +
         format("%.3f", parameters.subframeScale)
      );
      file.outTextLn("Camera gain," +
         format("%.3f", parameters.cameraGain)
      );
      file.outTextLn("Camera resolution," +
         "\"" + parameters.cameraResolutions[parameters.cameraResolution] + "\""
      );
      file.outTextLn("Site local midnight," +
         format("%d", parameters.siteLocalMidnight)
      );
      file.outTextLn("Scale unit," +
         "\"" + parameters.scaleUnits[parameters.scaleUnit] + "\""
      );
      file.outTextLn("Data unit," +
         "\"" + parameters.dataUnits[parameters.dataUnit] + "\""
      );

      file.outTextLn("Star detection layers," +
         format("%d", parameters.starDetectionLayers)
      );
      file.outTextLn("Noise reduction layers," +
         format("%d", parameters.noiseReductionLayers)
      );
      file.outTextLn("Hot pixel filter radius," +
         format("%d", parameters.hotPixelFilterRadius)
      );
      file.outTextLn("Log(detection sensitivity)," +
         format("%.2f", Math.log10(parameters.starDetectionSensitivity))
      );
      file.outTextLn("Star peak response," +
         format("%.2f", parameters.starPeakResponse)
      );
      file.outTextLn("Maximum star distortion," +
         format("%.2f", parameters.maximumStarDistortion)
      );
      file.outTextLn("Upper limit," +
         format("%.2f", parameters.upperLimit)
      );

      file.outTextLn("Subframe region," +
         format("%d,", parameters.subframeRegionLeft) +
         format("%d,", parameters.subframeRegionTop) +
         format("%d,", parameters.subframeRegionWidth) +
         format("%d", parameters.subframeRegionHeight)
      );
      file.outTextLn("Pedestal," +
         format("%d", parameters.pedestal)
      );

      file.outTextLn("Point spread function," +
         "\"" + parameters.modelFunctions[parameters.modelFunction] + "\""
      );
      file.outTextLn("Circular PSF," +
         format("%d", parameters.circularModel ? 1 : 0)
      );

      file.outTextLn("Approval expression," +
         "\"" + parameters.selectorExpression + "\""
      );
      file.outTextLn("Weighting expression," +
         "\"" + parameters.weightingExpression + "\""
      );

      file.outTextLn(
"SubframeHeader,Approved,Index,Name,Weight,FWHM,Eccentricity,SNRWeight,Median,MeanDeviation," +
"Noise,StarSupport,StarResidual,NoiseSupport,FWHMMeanDev,EccentricityMeanDev," +
"StarResidualMeanDev,Date"
      );
      var resolutionGain =
         parameters.cameraResolutionValues[parameters.cameraResolution] *
         parameters.actualCameraGain();

      for (var i = 0; i != parameters.evaluationsDescriptions.length; ++i) {
         var description = parameters.evaluationsDescriptions[i];
         file.outTextLn(
            "Subframe," +
            (description.checked ? "1," : "0,") +
            format("%d,", description.index + 1) +
            "\"" +
               parameters.targetSubframeDescriptions[description.index].filePath +
               "\"," +
            format("%.6e,", description.weight) +
            format("%.6e,", parameters.actualSubframeScale() * description.FWHM) +
            format("%.6e,", description.eccentricity) +
            format("%.6e,", description.SNRWeight) +
            format("%.6e,",
               resolutionGain * pedestalFunction(description.median)
            ) +
            format("%.6e,", resolutionGain * description.dispersion) +
            format("%.6e,", resolutionGain * description.noise) +
            format("%d,", description.starSupport) +
            format("%.6e,", description.starResidual) +
            format("%.6e,", description.noiseSupport) +
            format("%.6e,",
               parameters.actualSubframeScale() * description.FWHMMeanDeviation
            ) +
            format("%.6e,", description.eccentricityMeanDeviation) +
            format("%.6e,", description.starResidualMeanDeviation) +
            "\"" + description.date + "\""
         );
      }

      file.close();
   }
   catch (error) {
      (new MessageBox(
         "<p>Error: Can't write output .csv file: " + saveFileDialog.fileName + "</p>",
         TITLE,
         StdIcon_Warning,
         StdButton_Ok
      )).execute();
   }

   parameters.evaluationsDescriptions.sort(
      evaluationDescriptionCompare[parameters.sortColumn][parameters.sortOrdering]
   );

   var endTime = new Date;
   console.writeln(format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime())));
   console.flush();
}

function editSelectorExpression(dialog) {
   var editDialog = new editSelectorExpressionDialogPrototype();
   editDialog.expression = parameters.selectorExpression;
   editDialog.update();
   if (!editDialog.execute()) {
      return false;
   }
   parameters.selectorExpression = editDialog.expression;
   dialog.selectorExpressionEdit.text = editDialog.expression;
   return true;
}

function editWeightingExpression(dialog) {
   var editDialog = new editWeightingExpressionDialogPrototype();
   editDialog.expression = parameters.weightingExpression;
   editDialog.update();
   if (!editDialog.execute()) {
      return false;
   }
   parameters.weightingExpression = editDialog.expression;
   dialog.weightingExpressionEdit.text = editDialog.expression;
   return true;
}

function propertyPlotUpdate(dialog) {
   if (parameters.evaluationsDescriptions.length == 0) {
      dialog.propertyPlotBitmapBox.setBitmap(null);
      return;
   }

   parameters.currentPropertyPlotData =
      generatePropertyPlotData(parameters.propertyPlotOrdinate);
   parameters.currentPropertyPlotDescripition =
      generatePropertyPlotDescription(
         new Font(FontFamily_Helvetica, dialog.targetSubframesSection.font.pointSize),
         dialog.propertyPlotBitmapBox.width -
            dialog.propertyPlotBitmapBox.scrollBarWidth,
         dialog.propertyPlotBitmapBox.height -
            dialog.propertyPlotBitmapBox.scrollBarHeight,
         parameters.currentPropertyPlotData
      );

   dialog.propertyPlotBitmapBox.setBitmap(generatePropertyPlotBitmap(
      parameters.currentPropertyPlotDescripition,
      parameters.currentPropertyPlotData
   ));
}

function propertyPlotUnlockAll(dialog) {
   var evaluationsDescriptions = [];
   for (var i = 0; i != parameters.evaluationsDescriptions.length; ++i) {
      var description = parameters.evaluationsDescriptions[i];
      if (!description.locked) {
         evaluationsDescriptions.push(description);
      }
      else {
         evaluationsDescriptions.push(description.newCheckedSelectedLocked(
            description.checked,
            description.selected,
            false
         ));
      }
   }
   parameters.evaluationsDescriptions = evaluationsDescriptions;
   tabulationEvaluate(dialog);
}

function propertyPlotExport(dialog) {
   var id = parameters.propertyPlotOrdinates[parameters.propertyPlotOrdinate];
   if (id.indexOf(" ") != -1) {
      id = id.substring(0, id.indexOf(" "));
   }

   var plotImageWindow =
      generatePlotImageWindow(dialog.propertyPlotBitmapBox.bitmap, id);
   plotImageWindow.show();
}

function propertyPlotSaveAs(dialog) {
   //var directory = parameters.starMapDirectory;
   //if (directory == "" || !File.directoryExists(directory)) {
   //   directory = Settings.read(
   //      TITLE + "." + VERSION + "_" + "saveAsDirectory", DataType_String
   //   );
   //   if (
   //      !Settings.lastReadOK ||
   //      directory == null ||
   //      !File.directoryExists(directory)
   //   ) {
   //      directory = File.systemTempDirectory;
   //   }
   //}
   var saveFileDialog = new SaveFileDialog();
   with (saveFileDialog) {
      caption = TITLE + ": Save Plots Image File As";
      filters = [["FITS files", "*.fit", "*.fits", "*.fts"]];
      //initialPath = directory + "/" + "SubframeSelector_plots.fit";
      initialPath = "SubframeSelector_plots.fit";
      if (!execute()) {
         return null;
      }
   }
   //Settings.write(
   //   TITLE + "." + VERSION + "_" + "saveAsDirectory",
   //   DataType_String,
   //   File.extractDrive(saveFileDialog.fileName) +
   //      File.extractDirectory(saveFileDialog.fileName)
   //);

   return saveFileDialog.fileName;
}

function outputPropertyPlotsProcess(dialog) {
   console.writeln("");
   console.writeln("<b>Save plots as</b>: ", dialog.outputPropertyPlotsFilePath);
   var startTime = new Date;

   var imageWindows = [];
   for (var i = 0; i != parameters.propertyPlotOrdinates.length; ++i) {
      var id = parameters.propertyPlotOrdinateName(i);
      if (id.indexOf(" ") != -1) {
         id = id.substring(0, id.indexOf(" "));
      }
      console.writeln("Generating plot: ", id);

      var propertyPlotData =
         generatePropertyPlotData(i);
      var propertyPlotDescripition =
         generatePropertyPlotDescription(
            new Font(FontFamily_Helvetica, dialog.targetSubframesSection.font.pointSize),
            dialog.propertyPlotBitmapBox.width,
            dialog.propertyPlotBitmapBox.height,
            propertyPlotData
         );
      var propertyPlotBitmap = generatePropertyPlotBitmap(
         propertyPlotDescripition,
         propertyPlotData
      );

      var plotImageWindow = generatePlotImageWindow(propertyPlotBitmap, id);
      imageWindows.push(plotImageWindow);
   }

   console.writeln("");
   console.writeln(
      "<b>Writing plots image file as</b>: ",
      dialog.outputPropertyPlotsFilePath
   );

   if (writeImage(dialog.outputPropertyPlotsFilePath, imageWindows, false, "") == null) {
      cantWriteImageAbort(dialog.outputPropertyPlotsFilePath);
   }

   for (var i = 0; i != imageWindows.length; ++i) {
      imageWindows[i].forceClose();
   }

   var endTime = new Date;
   console.writeln(format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime())));
   console.flush();
}

function propertyPlotOnResize(dialog) {
   propertyPlotUpdate(dialog);
}

function propertyPlotOnMouseRelease(dialog, x, y, button, buttons, modifiers) {
   var shiftKey = (modifiers & 1) != 0;

   if (parameters.evaluationsDescriptions.length == 0) {
      return;
   }

   var index = locatePropertyPlot(
      parameters.currentPropertyPlotDescripition,
      parameters.currentPropertyPlotData,
      new Point(x, y)
   );
   if (index == null) {
      return;
   }
   //console.writeln("index: ", index);

   var evaluationsDescriptions = [];
   for (var i = 0; i != parameters.evaluationsDescriptions.length; ++i) {
      var description = parameters.evaluationsDescriptions[i];
      var child = dialog.evaluationsTreeBox.child(i);
      if (description.index != index) {
         evaluationsDescriptions.push(description);
      }
      else {
         evaluationsDescriptions.push(description.newCheckedSelectedLocked(
            !description.checked,
            description.selected,
            !shiftKey
         ));
      }
   }
   parameters.evaluationsDescriptions = evaluationsDescriptions;
   if (!shiftKey) {
      tabulationUpdateCheckedSelectedLockedTreeBox(dialog);
      propertyPlotUpdate(dialog);
      enableButtons(dialog);
   }
   else {
      tabulationEvaluate(dialog);
   }
}

function parseDate(date) {
   var position = 0;
   var valid = true;

   function isChar(character) {
      return position != date.length && date.charAt(position) == character;
   }
   function parseInteger(digits) {
      var value = 0;
      var digit = 0;
      for (;
         position != date.length &&
         digit != digits &&
         "0" <= date.charAt(position) && date.charAt(position) <= "9";
         ++position
      ) {
         value = 10 * value + date.charCodeAt(position) - "0".charCodeAt(0);
         ++digit;
      }
      if (digit != digits) {
         valid = false;
      }
      return value;
   }

   if (isChar("'")) {
      ++position;
   }
   var year = parseInteger(4);
   if (isChar("-")) {
      ++position;
   }
   var month = parseInteger(2);
   if (isChar("-")) {
      ++position;
   }
   var day = parseInteger(2);
   if (isChar("T")) {
      ++position;
   }
   else {
      valid = false;
   }
   var hour = parseInteger(2);
   if (isChar(":")) {
      ++position;
   }
   var minute = parseInteger(2);
   if (isChar(":")) {
      ++position;
   }
   var second = parseInteger(2);

   if (!valid) {
      return "";
   }
   return format(
      "%04d-%02d-%02d %02d:%02d:%02d", year, month, day, hour, minute, second
   );
}

function measureProcess(dialog) {
   tabulationClear(dialog);

   var evaluationsDescriptions = [];
   var i = 0;
   for (; i != parameters.targetSubframeDescriptions.length; ++i) {
      if (console.abortRequested) {
         console.writeln("");
         console.writeln("Process aborted");
         evaluationsDescriptions = [];
         break;
      }

      var description = parameters.targetSubframeDescriptions[i];
      if (!description.checked) {
         continue;
      }
      var filePath = description.filePath;

      console.writeln("");
      console.writeln(
         "<b>Measure</b>: Processing subframe: ",
         format("%d ", i + 1) + filePath
      );
      var startTime = new Date;

      var MD5 = subframeCacheMD5(filePath);
      if (parameters.useFileCache && MD5 == null) {
         console.writeln("");
         console.writeln("*** Error: Can't read subframe: ", filePath);
         if (parameters.onError == 1) {
            cantReadImageAbort(filePath);
            evaluationsDescriptions = [];
            break;
         }
         else if (parameters.onError == 2) {
            if (cantReadImageAskUser(filePath) == StdButton_Yes) {
               evaluationsDescriptions = [];
               break;
            }
         }
         continue;
      }

      var description = subframeCacheLoad(MD5);
      if (description != null) {
         description.index = i;
      }
      else {
         var imageWindow = readImage(filePath, "");
         if (imageWindow == null) {
            console.writeln("");
            console.writeln("*** Error: Can't read subframe: ", filePath);
            if (parameters.onError == 1) {
               cantReadImageAbort(filePath);
               evaluationsDescriptions = [];
               break;
            }
            else if (parameters.onError == 2) {
               if (cantReadImageAskUser(filePath) == StdButton_Yes) {
                  evaluationsDescriptions = [];
                  break;
               }
            }
            continue;
         }

         if (imageWindow.mainView.image.colorSpace != ColorSpace_Gray) {
            var convertToGrayscale = new ConvertToGrayscale;
            //console.abortEnabled = false;
            convertToGrayscale.executeOn(imageWindow.mainView, false);
            console.abortEnabled = true;
         }

         if (
            parameters.subframeRegionLeft != 0 ||
            parameters.subframeRegionTop != 0 ||
            parameters.subframeRegionWidth != 0 ||
            parameters.subframeRegionHeight != 0
         ) {
            var width = imageWindow.mainView.image.width;
            var height = imageWindow.mainView.image.height;
            var crop = new Crop;
            with (crop) {
               leftMargin = -Math.max(0, parameters.subframeRegionLeft);
               rightMargin = Math.min(
                  parameters.subframeRegionLeft + parameters.subframeRegionWidth,
                  width
               ) - width;
               topMargin = -Math.max(0, parameters.subframeRegionTop);
               bottomMargin = Math.min(
                  parameters.subframeRegionTop + parameters.subframeRegionHeight,
                  height
               ) - height;
               mode = AbsolutePixels;
               noGUIMessages = true;
            }
            if (
               width + crop.leftMargin + crop.rightMargin >= parameters.minCropWidth &&
               height + crop.topMargin + crop.bottomMargin >= parameters.minCropHeight
            ) {
               crop.executeOn(imageWindow.mainView, false);
               console.abortEnabled = true;
            }
            else {
               console.writeln("");
               console.writeln(
"** Warning: The cropped subframe region is too small, the entire area of the subframe " +
"will be measured."
               );
            }
         }

         var imageFWHMEccentricityResidualStars =
            FWHMEccentricityResidualOfStarsImageWindow(imageWindow);
         var FWHM = parameters.modelScaleFactors[parameters.modelFunction] *
            imageFWHMEccentricityResidualStars[0][0];
         var FWHMMeanDeviation = parameters.modelScaleFactors[parameters.modelFunction] *
            imageFWHMEccentricityResidualStars[0][1];
         var eccentricity = imageFWHMEccentricityResidualStars[1][0];
         var eccentricityMeanDeviation = imageFWHMEccentricityResidualStars[1][1];
         var starResidual = imageFWHMEccentricityResidualStars[2][0];
         var starResidualMeanDeviation = imageFWHMEccentricityResidualStars[2][1];
         var starSupport = imageFWHMEccentricityResidualStars[3].length;
         var starDescriptions = imageFWHMEccentricityResidualStars[3];

         // if (starDescriptions.length < parameters.minStarDescriptions) {
         //    console.writeln("");
         //    console.writeln("** Warning: insufficient number of fitted stars.");
         // }

         var median = imageWindow.mainView.image.median();
         var dispersion = meanDeviationOfImageWindow(imageWindow);

         var imageNoise = noiseOfImage(imageWindow.mainView.image);
         var noise = imageNoise[0];
         var noiseSupport = imageNoise[1];

         var SNRWeight = SNRWeightFunction(
            dispersion,
            noise,
            parameters.cameraGain,
            parameters.cameraResolutionValues[parameters.cameraResolution]
         );

         var date = "";
         var keywords = imageWindow.keywords;
         for (var j = 0; j != keywords.length; ++j) {
            var keyword = keywords[j];
            if (keyword.name == "DATE-OBS") {
               date = parseDate(keyword.value);
            }
         }

         imageWindow.forceClose();

         description = new evaluationDescription(
            MD5,
            true,
            false,
            false,
            i,
            0.0,
            FWHM,
            FWHMMeanDeviation,
            eccentricity,
            eccentricityMeanDeviation,
            SNRWeight,
            median,
            noise,
            dispersion,
            starSupport,
            starResidual,
            starResidualMeanDeviation,
            noiseSupport,
            date,
            starDescriptions
         );
         subframeCacheStore(description);
      }

      var endTime = new Date;
      console.writeln(
         format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime()))
      );
      console.flush();

      evaluationsDescriptions.push(description);
   }
   parameters.evaluationsDescriptions = evaluationsDescriptions;
   tabulationEvaluate(dialog);
}

function makeApprovedSubframeFilePath(filePath, extension) {
   var outputFilePath = parameters.approvedDirectory == "" ?
      filePath :
      parameters.approvedDirectory +
         "/" +
         File.extractName(filePath) +
         File.extractExtension(filePath);

   outputFilePath = File.appendToName(outputFilePath, parameters.approvedPostfix);
   outputFilePath = File.changeExtension(outputFilePath, extension);

   return outputFilePath;
}

function makeRejectedSubframeFilePath(filePath, extension) {
   var outputFilePath = parameters.rejectedDirectory == "" ?
      filePath :
      parameters.rejectedDirectory +
         "/" +
         File.extractName(filePath) +
         File.extractExtension(filePath);

   outputFilePath = File.appendToName(outputFilePath, parameters.rejectedPostfix);
   outputFilePath = File.changeExtension(outputFilePath, extension);

   return outputFilePath;
}

function makeStarMapFilePath(filePath, extension) {
   var outputFilePath = parameters.starMapDirectory == "" ?
      filePath :
      parameters.starMapDirectory +
         "/" +
         File.extractName(filePath) +
         File.extractExtension(filePath);

   outputFilePath = File.appendToName(outputFilePath, parameters.starMapPostfix);
   outputFilePath = File.changeExtension(outputFilePath, extension);

   return outputFilePath;
}

function writeStarMapCSV(filePath, description) {
   try {
      var file = new File();
      file.createForWriting(filePath);

      file.outTextLn(TITLE + " Version " + VERSION);

      file.outTextLn("Star detection layers," +
         format("%d", parameters.starDetectionLayers)
      );
      file.outTextLn("Noise reduction layers," +
         format("%d", parameters.noiseReductionLayers)
      );
      file.outTextLn("Hot pixel filter radius," +
         format("%d", parameters.hotPixelFilterRadius)
      );
      file.outTextLn("Log(detection sensitivity)," +
         format("%.2f", Math.log10(parameters.starDetectionSensitivity))
      );
      file.outTextLn("Star peak response," +
         format("%.2f", parameters.starPeakResponse)
      );
      file.outTextLn("Maximum star distortion," +
         format("%.2f", parameters.maximumStarDistortion)
      );
      file.outTextLn("Upper limit," +
         format("%.2f", parameters.upperLimit)
      );

      file.outTextLn("Subframe region," +
         format("%d,", parameters.subframeRegionLeft) +
         format("%d,", parameters.subframeRegionTop) +
         format("%d,", parameters.subframeRegionWidth) +
         format("%d", parameters.subframeRegionHeight)
      );
      file.outTextLn("Pedestal," +
         format("%d", parameters.pedestal)
      );

      file.outTextLn("Point spread function," +
         "\"" + parameters.modelFunctions[parameters.modelFunction] + "\""
      );
      file.outTextLn("Circular PSF," +
         format("%d", parameters.circularModel ? 1 : 0)
      );

      file.outTextLn(
         "StarHeader,b,a,cx,cy,sx,sy,theta,MAD"
      );

      for (var i = 0; i != description.starDescriptions.length; ++i) {
         var star = description.starDescriptions[i];
         file.outTextLn(
            "Star," +
            format("%.6e,", star.b) +
            format("%.6e,", star.a) +
            format("%.2f,", star.x) +
            format("%.2f,", star.y) +
            format("%.2f,", star.sx) +
            format("%.2f,", star.sy) +
            format("%.2f,", star.theta) +
            format("%.6e", star.residual)
         );
      }

      file.close();
   }
   catch (error) {
      return null;
   }

   return description;
}

function recordSubframeWeight(imageWindow, weight) {
   var filteredKeywords = [];
   var keywords = imageWindow.keywords;
   for (var i = 0; i != keywords.length; ++i) {
      var keyword = keywords[i];
      if (keyword.name != parameters.weightKeyword) {
         filteredKeywords.push(keyword);
      }
   }
   imageWindow.keywords = filteredKeywords.concat([
      new FITSKeyword(
         parameters.weightKeyword,
         format("%.3e", weight).replace("e", "E"),
         "Image weight, " + TITLE
      )
   ]);
}

function outputMapsProcess(dialog) {
   if (parameters.starMapDirectory != "") {
      if (!File.directoryExists(parameters.starMapDirectory)) {
         (new MessageBox(
            "<p>Star map output directory does not exist. Aborting process.</p>",
            TITLE,
            StdIcon_Warning,
            StdButton_Ok
         )).execute();
         return;
      }
   }

   parameters.evaluationsDescriptions.sort(
      evaluationDescriptionCompare[0][0]
   );

   for (var i = 0; i != parameters.evaluationsDescriptions.length; ++i) {
      if (console.abortRequested) {
         console.writeln("");
         console.writeln("Process aborted");
         break;
      }
      var description = parameters.evaluationsDescriptions[i];
      if (!true) {
         continue;
      }

      var filePath = parameters.targetSubframeDescriptions[description.index].filePath;

      console.writeln("");
      console.writeln(
         "<b>Output star map</b>: Processing subframe: ",
         format("%d ", description.index + 1) + filePath
      );
      var startTime = new Date;

      var imageWindow = readImage(filePath, "");
      if (imageWindow == null) {
         console.writeln("");
         console.writeln("*** Error: Can't read subframe: ", filePath);
         if (parameters.onError == 1) {
            cantReadImageAbort(filePath);
            break;
         }
         else if (parameters.onError == 2) {
            if (cantReadImageAskUser(filePath) == StdButton_Yes) {
               break;
            }
         }
         continue;
      }

      if (
         parameters.subframeRegionLeft != 0 ||
         parameters.subframeRegionTop != 0 ||
         parameters.subframeRegionWidth != 0 ||
         parameters.subframeRegionHeight != 0
      ) {
         var width = imageWindow.mainView.image.width;
         var height = imageWindow.mainView.image.height;
         var crop = new Crop;
         with (crop) {
            leftMargin = -Math.max(0, parameters.subframeRegionLeft);
            rightMargin = Math.min(
               parameters.subframeRegionLeft + parameters.subframeRegionWidth,
               width
            ) - width;
            topMargin = -Math.max(0, parameters.subframeRegionTop);
            bottomMargin = Math.min(
               parameters.subframeRegionTop + parameters.subframeRegionHeight,
               height
            ) - height;
            mode = AbsolutePixels;
            noGUIMessages = true;
         }
         if (
            width + crop.leftMargin + crop.rightMargin >= parameters.minCropWidth &&
            height + crop.topMargin + crop.bottomMargin >= parameters.minCropHeight
         ) {
            crop.executeOn(imageWindow.mainView, false);
            console.abortEnabled = true;
         }
         else {
            console.writeln("");
            console.writeln(
"** Warning: The cropped subframe region is too small, the entire area of the subframe " +
"will be measured."
            );
         }
      }

      if (true) {
         var starMapImageWindow = generateStarMapImageWindow(
            imageWindow, "star_map", description.starDescriptions
         );

         var imageWindows = [starMapImageWindow];

         var rows = 5;
         var columns = 5;
         var partition;
         for (; rows != 2 && columns != 2;) {
            partition = partitionStarDescriptions(
               description.starDescriptions,
               imageWindow.mainView.image.width,
               imageWindow.mainView.image.height,
               rows,
               columns
            );
            if (
               minimumStarDescriptionPartitionTileSize(partition, rows, columns) >=
               parameters.minPartitionStarDescriptions
            ) {
               break;
            }
            --rows;
            --columns;
         }

         if (rows > 2 && columns > 2) {
            //console.writeln("Contour map size: ", rows);
            var propertyPartition = generateFWHMPartition(partition, rows, columns);
            var contourImageWindow = createContourImageWindow(
               dialog.displayPixelRatio,
               propertyPartition,
               rows,
               columns,
               imageWindow.mainView.image.width,
               imageWindow.mainView.image.height,
               new Font(FontFamily_Helvetica, dialog.targetSubframesSection.font.pointSize),
               "FWHM (" +
                  parameters.modelFunctions[parameters.modelFunction] +
                  ", Median " +
                  floatFormat("%.3f",
                     parameters.actualSubframeScale() * description.FWHM) +
                  (parameters.scaleUnit == 0 ? " arcsec," : " pixel,") +
                  " MeanDeviation " +
                  floatFormat("%.3f",
                     parameters.actualSubframeScale() * description.FWHMMeanDeviation) +
                  (parameters.scaleUnit == 0 ? " arcsec)" : " pixel)"),
               filterViewId(File.extractName(filePath)) + "_FWHM"
            );
            imageWindows.push(contourImageWindow);

            var propertyPartition =
               generateEccentricityPartition(partition, rows, columns);
            var contourImageWindow = createContourImageWindow(
               dialog.displayPixelRatio,
               propertyPartition,
               rows,
               columns,
               imageWindow.mainView.image.width,
               imageWindow.mainView.image.height,
               new Font(FontFamily_Helvetica, dialog.targetSubframesSection.font.pointSize),
               "Eccentricity (" +
                  parameters.modelFunctions[parameters.modelFunction] +
                  ", Median " +
                  floatFormat("%.3f", description.eccentricity) +
                  ", MeanDeviation " +
                  floatFormat("%.3f", description.eccentricityMeanDeviation) +
                  ")",
               filterViewId(File.extractName(filePath)) + "_Eccentricity"
            );
            imageWindows.push(contourImageWindow);
         }
         else {
            console.writeln("");
            console.writeln(
"** Warning: insufficient number of fitted stars in at least one subregion of the " +
"subframe to output FWHM and Eccentricity maps."
            );
         }

         var starMapImageFilePath = makeStarMapFilePath(filePath, ".fit");

         console.writeln("");
         console.writeln("<b>Writing star map image file</b>: ", starMapImageFilePath);

         if (File.exists(starMapImageFilePath)) {
            if (parameters.overwriteExistingFiles) {
               console.writeln("** Warning: Overwriting existing file.");
            }
            else {
               var j = 1;
               for (
                  ;
                  File.exists(File.appendToName(starMapImageFilePath, format("_%d", j)));
                  ++j
               ) {
               }
               starMapImageFilePath =
                  File.appendToName(starMapImageFilePath, format("_%d", j));
               console.writeln(
                  "File already exists, writing to: ", starMapImageFilePath
               );
            }
         }

         if (writeImage(starMapImageFilePath, imageWindows, true, "") == null) {
            console.writeln("");
            console.writeln(
               "*** Error: Can't write output image: ", starMapImageFilePath
            );
            if (parameters.onError == 1) {
               cantWriteImageAbort(starMapImageFilePath);
               starMapImageWindow.forceClose();
               imageWindow.forceClose();
               break;
            }
            else if (parameters.onError == 2) {
               if (cantWriteImageAskUser(starMapImageFilePath) == StdButton_Yes) {
                  starMapImageWindow.forceClose();
                  imageWindow.forceClose();
                  break;
               }
            }
         }

         for (var j = 0; j != imageWindows.length; ++j) {
            imageWindows[j].forceClose();
         }

         var starMapCSVFilePath = makeStarMapFilePath(filePath, ".csv");

         console.writeln("");
         console.writeln("<b>Writing star map .csv file</b>: ", starMapCSVFilePath);

         if (File.exists(starMapCSVFilePath)) {
            if (parameters.overwriteExistingFiles) {
               console.writeln("** Warning: Overwriting existing file.");
            }
            else {
               var j = 1;
               for (
                  ;
                  File.exists(File.appendToName(starMapCSVFilePath, format("_%d", j)));
                  ++j
               ) {
               }
               starMapCSVFilePath =
                  File.appendToName(starMapCSVFilePath, format("_%d", j));
               console.writeln("File already exists, writing to: ", starMapCSVFilePath);
            }
         }

         if (writeStarMapCSV(starMapCSVFilePath, description) == null) {
            console.writeln("");
            console.writeln(
               "*** Error: Can't write output .csv file: ", starMapCSVFilePath
            );
            if (parameters.onError == 1) {
               cantWriteCSVFileAbort(starMapCSVFilePath);
               imageWindow.forceClose();
               break;
            }
            else if (parameters.onError == 2) {
               if (cantWriteCSVFileAskUser(starMapCSVFilePath) == StdButton_Yes) {
                  imageWindow.forceClose();
                  break;
               }
            }
         }
      }

      imageWindow.forceClose();

      var endTime = new Date;
      console.writeln(
         format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime()))
      );
      console.flush();
   }

   parameters.evaluationsDescriptions.sort(
      evaluationDescriptionCompare[parameters.sortColumn][parameters.sortOrdering]
   );
}

function copyWeightKeywordExtension(extension) {
   var regExp = /^\.(?:fit)|(?:fits)|(?:fts)|(?:xisf)$/;
   if (regExp.test(extension)) {
      return extension;
   }
   extension = Settings.readGlobal("ImageWindow/DefaultFileExtension", DataType_UCString);
   if (regExp.test(extension)) {
      return extension;
   }
   extension = (new Preferences).ImageWindow_defaultFileExtension;
   if (regExp.test(extension)) {
      return extension;
   }
   return ".xisf";
}

function outputSubframesProcess(dialog) {
   if (parameters.approvedDirectory != "") {
      if (!File.directoryExists(parameters.approvedDirectory)) {
         (new MessageBox(
            "<p>Approved subframe output directory does not exist. Aborting process.</p>",
            TITLE,
            StdIcon_Warning,
            StdButton_Ok
         )).execute();
         return;
      }
   }
   if (parameters.rejectedDirectory != "") {
      if (!File.directoryExists(parameters.rejectedDirectory)) {
         (new MessageBox(
            "<p>Rejected subframe output directory does not exist. Aborting process.</p>",
            TITLE,
            StdIcon_Warning,
            StdButton_Ok
         )).execute();
         return;
      }
   }

   parameters.evaluationsDescriptions.sort(
      evaluationDescriptionCompare[0][0]
   );

   for (var i = 0; i != parameters.evaluationsDescriptions.length; ++i) {
      if (console.abortRequested) {
         console.writeln("");
         console.writeln("Process aborted");
         break;
      }
      var description = parameters.evaluationsDescriptions[i];
      var action = description.checked ?
         parameters.approvedAction : parameters.rejectedAction;
      if (action == parameters.noneAction) {
         continue;
      }
      var filePath = parameters.targetSubframeDescriptions[description.index].filePath;

      console.writeln("");
      console.writeln(
         "<b>" +
         parameters.outputActions[action] +
         (description.checked ? " approved" : " rejected") +
         " subframe</b>: " +
         format("%d ", description.index + 1) + filePath
      );
      var startTime = new Date;

      if (action == parameters.moveAction) {
         var moveFilePath = description.checked ?
            makeApprovedSubframeFilePath(filePath, File.extractExtension(filePath)) :
            makeRejectedSubframeFilePath(filePath, File.extractExtension(filePath));

         if (File.exists(moveFilePath)) {
            if (parameters.overwriteExistingFiles) {
               console.writeln("** Warning: Overwriting existing file.");
            }
            else {
               var j = 1;
               for (
                  ;
                  File.exists(File.appendToName(moveFilePath, format("_%d", j)));
                  ++j
               ) {
               }
               moveFilePath =
                  File.appendToName(moveFilePath, format("_%d", j));
               console.writeln(
                  "File already exists, moving to: ", moveFilePath
               );
            }
         }

         try {
            try {
               if (parameters.overwriteExistingFiles) {
                  File.remove(moveFilePath);
               }
            }
            catch (error) {
            }
            console.writeln("");
            console.writeln("<b>Moving file</b>: ", moveFilePath);
            File.move(filePath, moveFilePath);
         }
         catch (error) {
            console.writeln("");
            console.writeln(
               "*** Error: Can't move subframe: ", moveFilePath
            );
            if (parameters.onError == 1) {
               cantMoveImageAbort(moveFilePath);
               break;
            }
            else if (parameters.onError == 2) {
               if (cantMoveImageAskUser(moveFilePath) == StdButton_Yes) {
                  break;
               }
            }
         }
      }

      if (action == parameters.copyAction && parameters.weightKeyword == "") {
         var copyFilePath = description.checked ?
            makeApprovedSubframeFilePath(filePath, File.extractExtension(filePath)) :
            makeRejectedSubframeFilePath(filePath, File.extractExtension(filePath));

         if (File.exists(copyFilePath)) {
            if (parameters.overwriteExistingFiles) {
               console.writeln("** Warning: Overwriting existing file.");
            }
            else {
               var j = 1;
               for (
                  ;
                  File.exists(File.appendToName(copyFilePath, format("_%d", j)));
                  ++j
               ) {
               }
               copyFilePath =
                  File.appendToName(copyFilePath, format("_%d", j));
               console.writeln(
                  "File already exists, copying to: ", copyFilePath
               );
            }
         }

         try {
            try {
               if (parameters.overwriteExistingFiles) {
                  File.remove(copyFilePath);
               }
            }
            catch (error) {
            }
            console.writeln("");
            console.writeln("<b>Copying file</b>: ", copyFilePath);
            File.copy(filePath, copyFilePath);
         }
         catch (error) {
            console.writeln("");
            console.writeln(
               "*** Error: Can't copy subframe: ", copyFilePath
            );
            if (parameters.onError == 1) {
               cantMoveImageAbort(copyFilePath);
               break;
            }
            else if (parameters.onError == 2) {
               if (cantMoveImageAskUser(copyFilePath) == StdButton_Yes) {
                  break;
               }
            }
         }
      }

      if (action == parameters.copyAction && parameters.weightKeyword != "") {
         var copyFilePath = description.checked ?
            makeApprovedSubframeFilePath(filePath, copyWeightKeywordExtension(File.extractExtension(filePath))) :
            makeRejectedSubframeFilePath(filePath, copyWeightKeywordExtension(File.extractExtension(filePath)));

         var imageWindow = readImage(filePath, "");
         if (imageWindow == null) {
            console.writeln("");
            console.writeln("*** Error: Can't read subframe: ", filePath);
            if (parameters.onError == 1) {
               cantReadImageAbort(filePath);
               break;
            }
            else if (parameters.onError == 2) {
               if (cantReadImageAskUser(filePath) == StdButton_Yes) {
                  break;
               }
            }
            continue;
         }

         console.writeln("");
         console.writeln("<b>Writing file</b>: ", copyFilePath);
         if (parameters.weightKeyword != "") {
            recordSubframeWeight(imageWindow, description.weight);
         }
         if (parameters.weightKeyword != "") {
            console.writeln(
               parameters.weightKeyword,
               " keyword: ",
               floatFormat("%.3e", description.weight)
            );
         }

         if (File.exists(copyFilePath)) {
            if (parameters.overwriteExistingFiles) {
               console.writeln("** Warning: Overwriting existing file.");
            }
            else {
               var j = 1;
               for (
                  ;
                  File.exists(File.appendToName(copyFilePath, format("_%d", j)));
                  ++j
               ) {
               }
               copyFilePath =
                  File.appendToName(copyFilePath, format("_%d", j));
               console.writeln(
                  "File already exists, copying to: ", copyFilePath
               );
            }
         }

         if (writeImage(copyFilePath, [imageWindow], true, "") == null) {
            console.writeln("");
            console.writeln(
               "*** Error: Can't copy subframe: ", copyFilePath
            );
            if (parameters.onError == 1) {
               cantWriteImageAbort(copyFilePath);
               imageWindow.forceClose();
               break;
            }
            else if (parameters.onError == 2) {
               if (cantWriteImageAskUser(copyFilePath) == StdButton_Yes) {
                  imageWindow.forceClose();
                  break;
               }
            }
         }

         imageWindow.forceClose();
      }

      var endTime = new Date;
      console.writeln(
         format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime()))
      );
      console.flush();
   }

   parameters.evaluationsDescriptions.sort(
      evaluationDescriptionCompare[parameters.sortColumn][parameters.sortOrdering]
   );
}

function resetDialog(dialog) {
   targetSubframesUpdateTreeBox(dialog);
   tabulationUpdateTreeBox(dialog);
   propertyPlotUpdate(dialog);
}

function main() {
   console.hide();

   parameters.loadSettings();

   if (Parameters.isGlobalTarget) {
      parameters.loadParameters();
   }
   else if (Parameters.isViewTarget) {
      console.writeln("");
      console.writeln(
         "*** Error: " + TITLE +
         " can only be executed in the global context."
      );
      console.flush();
      console.show();
      return;
   }
   else {
   }

   var parametersDialog = new parametersDialogPrototype();
   console.abortEnabled = true;
   for (; !console.abortRequested;) {
      //console.show(); // ? debugging

      console.abortEnabled = true;
      if (!parametersDialog.execute()) {
         if ((new MessageBox(
            "Do you really want to dismiss " + TITLE + "?",
            TITLE,
            StdIcon_Question,
            StdButton_No,
            StdButton_Yes
         )).execute() == StdButton_Yes) {
            console.abortEnabled = false;
            break;
         }
      }

      parameters.storeSettings();

      console.abortEnabled = true;
      console.show();
      console.writeln();
      console.writeln("<b>" + TITLE + " Version " + VERSION + "</b>:");
      if (parametersDialog.measureProcess) {
         measureProcess(parametersDialog);
         parametersDialog.measureProcess = false;
      }
      if (parametersDialog.outputMapsProcess) {
         var measure = false;
         for (var i = 0; i != parameters.evaluationsDescriptions.length; ++i) {
            var description = parameters.evaluationsDescriptions[i];
            measure = measure || description.starDescriptions.length == 0;
         }
         if (measure && parameters.useFileCache) {
            parameters.useFileCache = false;
            measureProcess(parametersDialog);
            parameters.useFileCache = true;
         }
         if (!console.abortRequested) {
            outputMapsProcess(parametersDialog);
         }
         parametersDialog.outputMapsProcess = false;
      }
      if (parametersDialog.outputSubframesProcess) {
         outputSubframesProcess(parametersDialog);
         parametersDialog.outputSubframesProcess = false;
      }
      if (parametersDialog.outputPropertyPlotsProcess) {
         outputPropertyPlotsProcess(parametersDialog);
         parametersDialog.outputPropertyPlotsProcess = false;
      }
      console.flush();
      console.hide();
   }

   parameters.storeSettings();
}

main();

// ----------------------------------------------------------------------------
// EOF SubframeSelector.js - Released 2018-11-05T16:53:08Z
