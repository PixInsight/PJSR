// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// SubframeSelectorParameters.js - Released 2018-11-05T16:53:08Z
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

function parametersPrototype() {
   this.scaleUnits = new Array(
      "Arcseconds (arcsec)",
      "Pixels (pixel)"
   );
   this.dataUnits = new Array(
      "Electrons (e-)",
      "Data Numbers (DN)"
   );

   this.cameraResolutions = new Array(
      "8-bit [0, 255]",
      "10-bit [0, 1023]",
      "12-bit [0, 4095]",
      "14-bit [0, 16383]",
      "16-bit [0, 65535]"
   );
   this.cameraResolutionValues = new Array(
      255,
      1023,
      4095,
      16383,
      65535
   );

   this.modelFunctions = new Array(
      "Gaussian",
      "Moffat 10",
      "Moffat 8",
      "Moffat 6",
      "Moffat 4",
      "Moffat 2.5",
      "Moffat 1.5",
      "Lorentzian"
   );
   this.modelScaleFactors = new Array(
      2.0 * Math.sqrt(2.0 * Math.log(2.0)), // Gaussian
      2.0 * Math.sqrt(Math.pow(2.0, 1.0 / 10.0) - 1.0), // Moffat 10
      2.0 * Math.sqrt(Math.pow(2.0, 1.0 / 8.0) - 1.0), // Moffat 8
      2.0 * Math.sqrt(Math.pow(2.0, 1.0 / 6.0) - 1.0), // Moffat 6
      2.0 * Math.sqrt(Math.pow(2.0, 1.0 / 4.0) - 1.0), // Moffat 4
      2.0 * Math.sqrt(Math.pow(2.0, 1.0 / 2.5) - 1.0), // Moffat 2.5
      2.0 * Math.sqrt(Math.pow(2.0, 1.0 / 1.5) - 1.0), // Moffat 1.5
      2.0 * Math.sqrt(Math.pow(2.0, 1.0 / 1.0) - 1.0) // Lorentzian
   );

   this.columnNames = new Array(
      "Index Name (0 approved/0)",
      "Weight",
      "FWHM (arcsec)",
      "Eccentricity",
      "SNRWeight",
      "Median (e-)",
      "MeanDeviation (e-)",
      "Noise (e-)",
      "StarSupport",
      "StarResidual",
      "NoiseSupport",
      "FWHMMeanDev (arcsec)",
      "EccentricityMeanDev",
      "StarResidualMeanDev",
      "Date (UTC)"
   );
   this.columnIndexNameApprovedTotal = function(approved, total) {
      return "Index Name (" +
         format("%d", approved) +
         " approved/" +
         format("%d", total) +
         ")";
   }
   this.columnName = function(index) {
      if (index == 2) {
         return parameters.scaleUnit == 0 ? "FWHM (arcsec)" : "FWHM (pixel)";
      }
      if (index == 5) {
         return parameters.dataUnit == 0 ? "Median (e-)" : "Median (DN)";
      }
      if (index == 6) {
         return parameters.dataUnit == 0 ? "MeanDeviation (e-)" : "MeanDeviation (DN)";
      }
      if (index == 7) {
         return parameters.dataUnit == 0 ? "Noise (e-)" : "Noise (DN)";
      }
      if (index == 11) {
         return parameters.scaleUnit == 0 ? "FWHMMeanDev (arcsec)" : "FWHMMeanDev (pixel)";
      }
      return this.columnNames[index];
   };
   this.columnToolTips = [
"<p>The <i>index</i> number and <i>file name</i> of the subframe in the target " +
"subframes list.</p>" +

"<p>See the tool tip messages of this row's columns for more information.</p>",

"<p>The <i>weight</i> of the subframe as determined by the " +
"subframe weighting expression.</p>",

"<p>The median star profile <i>full width at half maximum</i> (FWHM) " +
"estimate for the subframe in arcseconds or pixels.</p>",

"<p>The median star profile <i>eccentricity</i> estimate for " +
"the subframe.</p>",

"<p>The <i>signal to noise ratio weight</i> estimate for " +
"the subframe.</p>",

"<p>The <i>median</i> of the subframe in electrons or Data " +
"Numbers.</p>",

"<p>The <i>mean absolute deviation from the median</i> of " +
"the subframe in electrons or Data Numbers.</p>",

"<p>An estimate of the <i>standard deviation of Gaussian noise</i> " +
"for the subframe in electrons or Data Numbers.</p>",

"<p>The number of stars detected and fitted in the subframe and used to " +
"estimate <i>FWHM</i> and <i>Eccentricity</i>.</p>",

"<p>The median <i>residual</i> of the star fitting process " +
"for the subframe.</p>",

"<p>The fractional number of pixels in the subframe deemed " +
"free of image structure and used to estimate <i>Noise</i>.</p>",

"<p>The mean absolute deviation from the median star profile <i>full width at half " +
"maximum</i> (FWHM) estimate for the subframe in arcseconds or pixels.</p>",

"<p>The mean absolute deviation from the median star profile <i>eccentricity</i> " +
"estimate for the subframe.</p>",

"<p>The mean absolute deviation from the median <i>residual</i> of the star fitting " +
"process for the subframe.</p>",

"<p>The observation date and Coordinated Universal Time (UTC) of the " +
"subframe.</p>"
   ];

   this.medianRowTotal = function(total) {
      return "Subframe Median"
   }
   this.medianRowToolTip =
"<p>This row's columns contain the <i>median</i> of properties of across all " +
"subframes.</p>";

   this.meanDeviationRowTotal = function(total) {
      return "Subframe MeanDeviation"
   }
   this.meanDeviationRowToolTip =
"<p>This row's columns contain the <i>mean absolute deviation from the median</i> of " +
"properties of across all subframes.</p>";

   this.sortColumns = new Array(
      "Index",
      "Name",
      "Weight",
      "FWHM",
      "Eccentricity",
      "SNRWeight",
      "Median",
      "MeanDeviation",
      "Noise",
      "StarSupport",
      "StarResidual",
      "NoiseSupport",
      "FWHMMeanDev",
      "EccentricityMeanDev",
      "StarResidualMeanDev",
      "Date (UTC)"
   );
   this.sortColumnName = function(index) {
      if (index == 3) {
         return this.scaleUnit == 0 ? "FWHM (arcsec)" : "FWHM (pixel)";
      }
      if (index == 6) {
         return this.dataUnit == 0 ? "Median (e-)" : "Median (DN)";
      }
      if (index == 7) {
         return this.dataUnit == 0 ? "MeanDeviation (e-)" : "MeanDeviation (DN)";
      }
      if (index == 8) {
         return this.dataUnit == 0 ? "Noise (e-)" : "Noise (DN)";
      }
      if (index == 12) {
         return this.scaleUnit == 0 ? "FWHMMeanDev (arcsec)" : "FWHMMeanDev (pixel)";
      }
      return this.sortColumns[index];
   }

   this.sortOrderings = new Array(
      "Ascending",
      "Descending"
   );

   this.propertyPlotOrdinates = [
      "Weight",
      "FWHM",
      "Eccentricity",
      "SNRWeight",
      "Median",
      "MeanDeviation",
      "Noise",
      "StarSupport",
      "StarResidual",
      "NoiseSupport",
      "FWHMMeanDev",
      "EccentricityMeanDev",
      "StarResidualMeanDev"
   ];
   this.propertyPlotOrdinateName = function(index) {
      if (index == 1) {
         return this.scaleUnit == 0 ? "FWHM (arcsec)" : "FWHM (pixel)";
      }
      if (index == 4) {
         return this.dataUnit == 0 ? "Median (e-)" : "Median (DN)";
      }
      if (index == 5) {
         return this.dataUnit == 0 ? "MeanDeviation (e-)" : "MeanDeviation (DN)";
      }
      if (index == 6) {
         return this.dataUnit == 0 ? "Noise (e-)" : "Noise (DN)";
      }
      if (index == 10) {
         return this.scaleUnit == 0 ? "FWHMMeanDev (arcsec)" : "FWHMMeanDev (pixel)";
      }
      return this.propertyPlotOrdinates[index];
   }

   this.outputActions = new Array(
      "Copy",
      "Move",
      "None"
   );
   this.copyAction = 0;
   this.moveAction = 1;
   this.noneAction = 2;

   this.onErrors = new Array(
      "Continue",
      "Abort",
      "Ask User"
   );

   this.actualSubframeScale = function() {
      return this.scaleUnit == 0 ? this.subframeScale : 1.0;
   }
   this.actualCameraGain = function() {
      return this.dataUnit == 0 ? this.cameraGain : 1.0;
   }

   this.cacheSize = 2053;
   this.MD5MaxBytes = 1 * 1024 * 1024;

   this.minCropWidth = 256;
   this.minCropHeight = 256;

   this.minStarDescriptions = 300;
   this.minPartitionStarDescriptions = 30;
   this.maxPSFMAD = 0.1;

   this.currentPropertyPlotData = null;
   this.currentPropertyPlotDescripition = null;

   this.reset = function() {
      this.targetSubframeDescriptions = [];

      this.evaluationsDescriptions = [];

      for (var i = 0; i != this.parameterDescriptions.length; ++i) {
         var description = this.parameterDescriptions[i];
         var value = description.def;
         description.set(this, value);
       }
   };

   this.storeParameters = function() {
      Parameters.clear();

      this.targetSubframeDescriptionsLength = this.targetSubframeDescriptions.length;

      for (var i = 0; i != this.parameterDescriptions.length; ++i) {
         var description = this.parameterDescriptions[i];
         var value = description.get(this);
         description.storeParameters(description.name, value);
       }

      for (var i = 0; i != this.targetSubframeDescriptions.length; ++i) {
         var description = this.targetSubframeDescriptions[i];
         this.targetSubframeDescriptionChecked.storeParameters(
            this.targetSubframeDescriptionChecked.name + "_" + i, description.checked
         );
         this.targetSubframeDescriptionSelected.storeParameters(
            this.targetSubframeDescriptionSelected.name + "_" + i, description.selected
         );
         this.targetSubframeDescriptionFilePath.storeParameters(
            this.targetSubframeDescriptionFilePath.name + "_" + i, description.filePath
         );
      }
   };

   this.loadParameters = function() {
      this.targetSubframeDescriptions = [];

      this.evaluationsDescriptions = [];

      for (var i = 0; i != this.parameterDescriptions.length; ++i) {
         var description = this.parameterDescriptions[i];
         var value = description.loadParameters(description.name, description.def);
         description.set(this, value);
      }

      for (var i = 0; i != this.targetSubframeDescriptionsLength; ++i) {
         var checked = this.targetSubframeDescriptionChecked.loadParameters(
            this.targetSubframeDescriptionChecked.name + "_" + i
         );
         var selected = this.targetSubframeDescriptionSelected.loadParameters(
            this.targetSubframeDescriptionSelected.name + "_" + i
         );
         var filePath = this.targetSubframeDescriptionFilePath.loadParameters(
            this.targetSubframeDescriptionFilePath.name + "_" + i
         );
         if (filePath != "") {
            this.targetSubframeDescriptions.push(new targetSubframeDescription(
               checked,
               selected,
               filePath
            ));
         }
      }
   };

   this.storeSettings = function() {
      var prefix = TITLE + "." + VERSION + "_";

      this.targetSubframeDescriptionsLength = this.targetSubframeDescriptions.length;

      for (var i = 0; i != this.parameterDescriptions.length; ++i) {
         var description = this.parameterDescriptions[i];
         var value = description.get(this);
         description.storeSettings(prefix + description.name, value);
      }

      for (var i = 0; i != this.targetSubframeDescriptions.length; ++i) {
         var description = this.targetSubframeDescriptions[i];
         this.targetSubframeDescriptionChecked.storeSettings(
            prefix + this.targetSubframeDescriptionChecked.name + "_" + i,
            description.checked
         );
         this.targetSubframeDescriptionSelected.storeSettings(
            prefix + this.targetSubframeDescriptionSelected.name + "_" + i,
            description.selected
         );
         this.targetSubframeDescriptionFilePath.storeSettings(
            prefix + this.targetSubframeDescriptionFilePath.name + "_" + i,
            description.filePath
         );
      }
   };

   this.loadSettings = function() {
      var prefix = TITLE + "." + VERSION + "_";

      this.targetSubframeDescriptions = [];

      this.evaluationsDescriptions = [];

      for (var i = 0; i != this.parameterDescriptions.length; ++i) {
         var description = this.parameterDescriptions[i];
         var value = description.loadSettings(prefix + description.name, description.def);
         description.set(this, value);
      }

      for (var i = 0; i != this.targetSubframeDescriptionsLength; ++i) {
         var checked = this.targetSubframeDescriptionChecked.loadSettings(
            prefix + this.targetSubframeDescriptionChecked.name + "_" + i
         );
         var selected = this.targetSubframeDescriptionSelected.loadSettings(
            prefix + this.targetSubframeDescriptionSelected.name + "_" + i
         );
         var filePath = this.targetSubframeDescriptionFilePath.loadSettings(
            prefix + this.targetSubframeDescriptionFilePath.name + "_" + i
         );
         if (filePath != "") {
            this.targetSubframeDescriptions.push(new targetSubframeDescription(
               checked,
               selected,
               filePath
            ));
         }
      }
   };

   this.parameterDescriptions = [];
   this.insertParameterDescription = function(description) {
      this.parameterDescriptions.push(description);
   }
}
var parameters = new parametersPrototype();

// Parameter description
// name: parameter name
// def: default value
// set: function(parameters, value) {parameters.name = value;}
// get: function(parameters) {return parameters.name;}
// loadSettings: function(name, def) {load name from Settings with default;}
// storeSettings: function(name, value) {store name to Settings with value;}
// loadParameters: function(name, def) {load name from Parameters with default;}
// storeParameters: function(name, value) {store name to Parameters with value;}
function parameterDescription(
   name, def, get, set, loadSettings, storeSettings, loadParameters, storeParameters
) {
   this.name = name;
   this.def = def;
   this.get = get;
   this.set = set;
   this.loadSettings = loadSettings;
   this.storeSettings = storeSettings;
   this.loadParameters = loadParameters;
   this.storeParameters = storeParameters;
}

function defaultNullValue(value, def) {
   return value != null ? value : def;
}

function defaultNullMinMaxValue(value, min, max, def) {
   return value != null && !isNaN(value) && value >= min && value <= max ? value : def;
}

function loadSettingsDataTypeString() {
   return function(name, def) {
      return defaultNullValue(Settings.read(name, DataType_String), def);
   };
}

function storeSettingsDataTypeString() {
   return function(name, value) {
      Settings.write(name, DataType_String, value);
   };
}

function loadParametersDataTypeString() {
   return function(name, def) {
      return Parameters.has(name) ?
         defaultNullValue(Parameters.getString(name), def) :
         def;
   };
}

function storeParametersDataTypeString() {
   return function(name, value) {
      Parameters.set(name, value);
   };
}

function loadSettingsDataTypeBoolean() {
   return function(name, def) {
      return defaultNullValue(Settings.read(name, DataType_Boolean), def);
   };
}

function storeSettingsDataTypeBoolean() {
   return function(name, value) {
      Settings.write(name, DataType_Boolean, value);
   };
}

function loadParametersDataTypeBoolean() {
   return function(name, def) {
      return Parameters.has(name) ?
         defaultNullValue(Parameters.getBoolean(name), def) :
         def;
   };
}

function storeParametersDataTypeBoolean() {
   return function(name, value) {
      Parameters.set(name, value);
   };
}

function loadSettingsDataTypeInt32(min, max) {
   return function(name, def) {
      return defaultNullMinMaxValue(Settings.read(name, DataType_Int32), min, max, def);
   };
}

function storeSettingsDataTypeInt32() {
   return function(name, value) {
      Settings.write(name, DataType_Int32, value);
   };
}

function loadParametersDataTypeInt32(min, max) {
   return function(name, def) {
      return Parameters.has(name) ?
         defaultNullMinMaxValue(Parameters.getInteger(name), min, max, def) :
         def;
   };
}

function storeParametersDataTypeInt32() {
   return function(name, value) {
      Parameters.set(name, value);
   };
}

function loadSettingsDataTypeReal32(min, max) {
   return function(name, def) {
      return defaultNullMinMaxValue(Settings.read(name, DataType_Real32), min, max, def);
   };
}

function storeSettingsDataTypeReal32() {
   return function(name, value) {
      Settings.write(name, DataType_Real32, value);
   };
}

function loadParametersDataTypeReal32(min, max) {
   return function(name, def) {
      return Parameters.has(name) ?
         defaultNullMinMaxValue(Parameters.getReal(name), min, max, def) :
         def;
   };
}

function storeParametersDataTypeReal32() {
   return function(name, value) {
      Parameters.set(name, value);
   };
}

parameters.targetSubframeDescriptionChecked = new parameterDescription(
   "targetSubframeDescriptionChecked",
   true,
   function(parameters) {
      return true;
   },
   function(parameters, value) {
   },
   loadSettingsDataTypeBoolean(),
   storeSettingsDataTypeBoolean(),
   loadParametersDataTypeBoolean(),
   storeParametersDataTypeBoolean()
);

parameters.targetSubframeDescriptionSelected = new parameterDescription(
   "targetSubframeDescriptionSelected",
   false,
   function(parameters) {
      return false;
   },
   function(parameters, value) {
   },
   loadSettingsDataTypeBoolean(),
   storeSettingsDataTypeBoolean(),
   loadParametersDataTypeBoolean(),
   storeParametersDataTypeBoolean()
);

parameters.targetSubframeDescriptionFilePath = new parameterDescription(
   "targetSubframeDescriptionFilePath",
   "",
   function(parameters) {
      return "";
   },
   function(parameters, value) {
   },
   loadSettingsDataTypeString(),
   storeSettingsDataTypeString(),
   loadParametersDataTypeString(),
   storeParametersDataTypeString()
);

parameters.insertParameterDescription(new parameterDescription(
   "targetSubframeDescriptionsLength",
   0,
   function(parameters) {
      return parameters.targetSubframeDescriptionsLength;
   },
   function(parameters, value) {
      parameters.targetSubframeDescriptionsLength = value;
   },
   loadSettingsDataTypeInt32(0, 1024),
   storeSettingsDataTypeInt32(),
   loadParametersDataTypeInt32(0, 1024),
   storeParametersDataTypeInt32()
));

parameters.insertParameterDescription(new parameterDescription(
   "targetSubframesFullPaths",
   false,
   function(parameters) {
      return parameters.targetSubframesFullPaths;
   },
   function(parameters, value) {
      parameters.targetSubframesFullPaths = value;
   },
   loadSettingsDataTypeBoolean(),
   storeSettingsDataTypeBoolean(),
   loadParametersDataTypeBoolean(),
   storeParametersDataTypeBoolean()
));

parameters.insertParameterDescription(new parameterDescription(
   "useFileCache",
   false,
   function(parameters) {
      return false; // parameters.useFileCache;
   },
   function(parameters, value) {
      parameters.useFileCache = false; // value;
   },
   loadSettingsDataTypeBoolean(),
   storeSettingsDataTypeBoolean(),
   loadParametersDataTypeBoolean(),
   storeParametersDataTypeBoolean()
));

parameters.insertParameterDescription(new parameterDescription(
   "subframeScale",
   1.0,
   function(parameters) {
      return parameters.subframeScale;
   },
   function(parameters, value) {
      parameters.subframeScale = value;
   },
   loadSettingsDataTypeReal32(0.01, 100.0),
   storeSettingsDataTypeReal32(),
   loadParametersDataTypeReal32(0.01, 100.0),
   storeParametersDataTypeReal32()
));

parameters.insertParameterDescription(new parameterDescription(
   "cameraGain",
   1.0,
   function(parameters) {
      return parameters.cameraGain;
   },
   function(parameters, value) {
      parameters.cameraGain = value;
   },
   loadSettingsDataTypeReal32(0.01, 100.0),
   storeSettingsDataTypeReal32(),
   loadParametersDataTypeReal32(0.01, 100.0),
   storeParametersDataTypeReal32()
));

parameters.insertParameterDescription(new parameterDescription(
   "cameraResolution",
   4,
   function(parameters) {
      return parameters.cameraResolution;
   },
   function(parameters, value) {
      parameters.cameraResolution = value;
   },
   loadSettingsDataTypeInt32(0, parameters.cameraResolutions.length - 1),
   storeSettingsDataTypeInt32(),
   loadParametersDataTypeInt32(0, parameters.cameraResolutions.length - 1),
   storeParametersDataTypeInt32()
));

parameters.insertParameterDescription(new parameterDescription(
   "subframeRegionLeft",
   0,
   function(parameters) {
      return parameters.subframeRegionLeft;
   },
   function(parameters, value) {
      parameters.subframeRegionLeft = value;
   },
   loadSettingsDataTypeInt32(0, 1024 * 1024 * 1024 - 1),
   storeSettingsDataTypeInt32(),
   loadParametersDataTypeInt32(0, 1024 * 1024 * 1024 - 1),
   storeParametersDataTypeInt32()
));

parameters.insertParameterDescription(new parameterDescription(
   "subframeRegionTop",
   0,
   function(parameters) {
      return parameters.subframeRegionTop;
   },
   function(parameters, value) {
      parameters.subframeRegionTop = value;
   },
   loadSettingsDataTypeInt32(0, 1024 * 1024 * 1024 - 1),
   storeSettingsDataTypeInt32(),
   loadParametersDataTypeInt32(0, 1024 * 1024 * 1024 - 1),
   storeParametersDataTypeInt32()
));

parameters.insertParameterDescription(new parameterDescription(
   "subframeRegionWidth",
   0,
   function(parameters) {
      return parameters.subframeRegionWidth;
   },
   function(parameters, value) {
      parameters.subframeRegionWidth = value;
   },
   loadSettingsDataTypeInt32(0, 1024 * 1024 * 1024 - 1),
   storeSettingsDataTypeInt32(),
   loadParametersDataTypeInt32(0, 1024 * 1024 * 1024 - 1),
   storeParametersDataTypeInt32()
));

parameters.insertParameterDescription(new parameterDescription(
   "subframeRegionHeight",
   0,
   function(parameters) {
      return parameters.subframeRegionHeight;
   },
   function(parameters, value) {
      parameters.subframeRegionHeight = value;
   },
   loadSettingsDataTypeInt32(0, 1024 * 1024 * 1024 - 1),
   storeSettingsDataTypeInt32(),
   loadParametersDataTypeInt32(0, 1024 * 1024 * 1024 - 1),
   storeParametersDataTypeInt32()
));

parameters.insertParameterDescription(new parameterDescription(
   "pedestal",
   0,
   function(parameters) {
      return parameters.pedestal;
   },
   function(parameters, value) {
      parameters.pedestal = value;
   },
   loadSettingsDataTypeInt32(0, 65535),
   storeSettingsDataTypeInt32(),
   loadParametersDataTypeInt32(0, 65535),
   storeParametersDataTypeInt32()
));

parameters.insertParameterDescription(new parameterDescription(
   "siteLocalMidnight",
   24,
   function(parameters) {
      return parameters.siteLocalMidnight;
   },
   function(parameters, value) {
      parameters.siteLocalMidnight = value;
   },
   loadSettingsDataTypeInt32(0, 24),
   storeSettingsDataTypeInt32(),
   loadParametersDataTypeInt32(0, 24),
   storeParametersDataTypeInt32()
));

parameters.insertParameterDescription(new parameterDescription(
   "scaleUnit",
   1,
   function(parameters) {
      return parameters.scaleUnit;
   },
   function(parameters, value) {
      parameters.scaleUnit = value;
   },
   loadSettingsDataTypeInt32(0, parameters.scaleUnits.length - 1),
   storeSettingsDataTypeInt32(),
   loadParametersDataTypeInt32(0, parameters.scaleUnits.length - 1),
   storeParametersDataTypeInt32()
));

parameters.insertParameterDescription(new parameterDescription(
   "dataUnit",
   1,
   function(parameters) {
      return parameters.dataUnit;
   },
   function(parameters, value) {
      parameters.dataUnit = value;
   },
   loadSettingsDataTypeInt32(0, parameters.dataUnits.length - 1),
   storeSettingsDataTypeInt32(),
   loadParametersDataTypeInt32(0, parameters.dataUnits.length - 1),
   storeParametersDataTypeInt32()
));

parameters.insertParameterDescription(new parameterDescription(
   "starDetectionLayers",
   5,
   function(parameters) {
      return parameters.starDetectionLayers;
   },
   function(parameters, value) {
      parameters.starDetectionLayers = value;
   },
   loadSettingsDataTypeInt32(1, 8),
   storeSettingsDataTypeInt32(),
   loadParametersDataTypeInt32(1, 8),
   storeParametersDataTypeInt32()
));

parameters.insertParameterDescription(new parameterDescription(
   "noiseReductionLayers",
   1,
   function(parameters) {
      return parameters.noiseReductionLayers;
   },
   function(parameters, value) {
      parameters.noiseReductionLayers = value;
   },
   loadSettingsDataTypeInt32(0, 4),
   storeSettingsDataTypeInt32(),
   loadParametersDataTypeInt32(0, 4),
   storeParametersDataTypeInt32()
));

parameters.insertParameterDescription(new parameterDescription(
   "hotPixelFilterRadius",
   1,
   function(parameters) {
      return parameters.hotPixelFilterRadius;
   },
   function(parameters, value) {
      parameters.hotPixelFilterRadius = value;
   },
   loadSettingsDataTypeInt32(0, 2),
   storeSettingsDataTypeInt32(),
   loadParametersDataTypeInt32(0, 2),
   storeParametersDataTypeInt32()
));

parameters.insertParameterDescription(new parameterDescription(
   "starDetectionSensitivity",
   0.1,
   function(parameters) {
      return parameters.starDetectionSensitivity;
   },
   function(parameters, value) {
      parameters.starDetectionSensitivity = value;
   },
   loadSettingsDataTypeReal32(0.001, 1000.0),
   storeSettingsDataTypeReal32(),
   loadParametersDataTypeReal32(0.001, 1000.0),
   storeParametersDataTypeReal32()
));

parameters.insertParameterDescription(new parameterDescription(
   "starPeakResponse",
   0.8,
   function(parameters) {
      return parameters.starPeakResponse;
   },
   function(parameters, value) {
      parameters.starPeakResponse = value;
   },
   loadSettingsDataTypeReal32(0.0, 1.0),
   storeSettingsDataTypeReal32(),
   loadParametersDataTypeReal32(0.0, 1.0),
   storeParametersDataTypeReal32()
));

parameters.insertParameterDescription(new parameterDescription(
   "maximumStarDistortion",
   0.5,
   function(parameters) {
      return parameters.maximumStarDistortion;
   },
   function(parameters, value) {
      parameters.maximumStarDistortion = value;
   },
   loadSettingsDataTypeReal32(0.0, 1.0),
   storeSettingsDataTypeReal32(),
   loadParametersDataTypeReal32(0.0, 1.0),
   storeParametersDataTypeReal32()
));

parameters.insertParameterDescription(new parameterDescription(
   "upperLimit",
   1.0,
   function(parameters) {
      return parameters.upperLimit;
   },
   function(parameters, value) {
      parameters.upperLimit = value;
   },
   loadSettingsDataTypeReal32(0.0, 1.0),
   storeSettingsDataTypeReal32(),
   loadParametersDataTypeReal32(0.0, 1.0),
   storeParametersDataTypeReal32()
));

parameters.insertParameterDescription(new parameterDescription(
   "modelFunction",
   4,
   function(parameters) {
      return parameters.modelFunction;
   },
   function(parameters, value) {
      parameters.modelFunction = value;
   },
   loadSettingsDataTypeInt32(0, parameters.modelFunctions.length - 1),
   storeSettingsDataTypeInt32(),
   loadParametersDataTypeInt32(0, parameters.modelFunctions.length - 1),
   storeParametersDataTypeInt32()
));

parameters.insertParameterDescription(new parameterDescription(
   "circularModel",
   false,
   function(parameters) {
      return parameters.circularModel;
   },
   function(parameters, value) {
      parameters.circularModel = value;
   },
   loadSettingsDataTypeBoolean(),
   storeSettingsDataTypeBoolean(),
   loadParametersDataTypeBoolean(),
   storeParametersDataTypeBoolean()
));

parameters.insertParameterDescription(new parameterDescription(
   "applyHotPixelFilterToDetectionImage",
   false,
   function(parameters) {
      return parameters.applyHotPixelFilterToDetectionImage;
   },
   function(parameters, value) {
      parameters.applyHotPixelFilterToDetectionImage = value;
   },
   loadSettingsDataTypeBoolean(),
   storeSettingsDataTypeBoolean(),
   loadParametersDataTypeBoolean(),
   storeParametersDataTypeBoolean()
));

parameters.insertParameterDescription(new parameterDescription(
   "selectorExpression",
   "",
   function(parameters) {
      return parameters.selectorExpression;
   },
   function(parameters, value) {
      parameters.selectorExpression = value;
   },
   loadSettingsDataTypeString(),
   storeSettingsDataTypeString(),
   loadParametersDataTypeString(),
   storeParametersDataTypeString()
));

parameters.insertParameterDescription(new parameterDescription(
   "weightingExpression",
   "SNRWeight",
   function(parameters) {
      return parameters.weightingExpression;
   },
   function(parameters, value) {
      parameters.weightingExpression = value;
   },
   loadSettingsDataTypeString(),
   storeSettingsDataTypeString(),
   loadParametersDataTypeString(),
   storeParametersDataTypeString()
));

parameters.insertParameterDescription(new parameterDescription(
   "sortColumn",
   0,
   function(parameters) {
      return parameters.sortColumn;
   },
   function(parameters, value) {
      parameters.sortColumn = value;
   },
   loadSettingsDataTypeInt32(0, parameters.sortColumns.length - 1),
   storeSettingsDataTypeInt32(),
   loadParametersDataTypeInt32(0, parameters.sortColumns.length - 1),
   storeParametersDataTypeInt32()
));

parameters.insertParameterDescription(new parameterDescription(
   "sortOrdering",
   0,
   function(parameters) {
      return parameters.sortOrdering;
   },
   function(parameters, value) {
      parameters.sortOrdering = value;
   },
   loadSettingsDataTypeInt32(0, parameters.sortOrderings.length - 1),
   storeSettingsDataTypeInt32(),
   loadParametersDataTypeInt32(0, parameters.sortOrderings.length - 1),
   storeParametersDataTypeInt32()
));

parameters.insertParameterDescription(new parameterDescription(
   "propertyPlotOrdinate",
   1,
   function(parameters) {
      return parameters.propertyPlotOrdinate;
   },
   function(parameters, value) {
      parameters.propertyPlotOrdinate = value;
   },
   loadSettingsDataTypeInt32(0, parameters.propertyPlotOrdinates.length - 1),
   storeSettingsDataTypeInt32(),
   loadParametersDataTypeInt32(0, parameters.propertyPlotOrdinates.length - 1),
   storeParametersDataTypeInt32()
));

parameters.insertParameterDescription(new parameterDescription(
   "approvedAction",
   0,
   function(parameters) {
      return parameters.approvedAction;
   },
   function(parameters, value) {
      parameters.approvedAction = value;
   },
   loadSettingsDataTypeInt32(0, parameters.outputActions.length - 1),
   storeSettingsDataTypeInt32(),
   loadParametersDataTypeInt32(0, parameters.outputActions.length - 1),
   storeParametersDataTypeInt32()
));

parameters.insertParameterDescription(new parameterDescription(
   "approvedDirectory",
   "",
   function(parameters) {
      return parameters.approvedDirectory;
   },
   function(parameters, value) {
      parameters.approvedDirectory = value;
   },
   loadSettingsDataTypeString(),
   storeSettingsDataTypeString(),
   loadParametersDataTypeString(),
   storeParametersDataTypeString()
));

parameters.insertParameterDescription(new parameterDescription(
   "approvedPostfix",
   "_a",
   function(parameters) {
      return parameters.approvedPostfix;
   },
   function(parameters, value) {
      parameters.approvedPostfix = value;
   },
   loadSettingsDataTypeString(),
   storeSettingsDataTypeString(),
   loadParametersDataTypeString(),
   storeParametersDataTypeString()
));

parameters.insertParameterDescription(new parameterDescription(
   "rejectedAction",
   2,
   function(parameters) {
      return parameters.rejectedAction;
   },
   function(parameters, value) {
      parameters.rejectedAction = value;
   },
   loadSettingsDataTypeInt32(0, parameters.outputActions.length - 1),
   storeSettingsDataTypeInt32(),
   loadParametersDataTypeInt32(0, parameters.outputActions.length - 1),
   storeParametersDataTypeInt32()
));

parameters.insertParameterDescription(new parameterDescription(
   "rejectedDirectory",
   "",
   function(parameters) {
      return parameters.rejectedDirectory;
   },
   function(parameters, value) {
      parameters.rejectedDirectory = value;
   },
   loadSettingsDataTypeString(),
   storeSettingsDataTypeString(),
   loadParametersDataTypeString(),
   storeParametersDataTypeString()
));

parameters.insertParameterDescription(new parameterDescription(
   "rejectedPostfix",
   "_x",
   function(parameters) {
      return parameters.rejectedPostfix;
   },
   function(parameters, value) {
      parameters.rejectedPostfix = value;
   },
   loadSettingsDataTypeString(),
   storeSettingsDataTypeString(),
   loadParametersDataTypeString(),
   storeParametersDataTypeString()
));

parameters.insertParameterDescription(new parameterDescription(
   "starMapDirectory",
   "",
   function(parameters) {
      return parameters.starMapDirectory;
   },
   function(parameters, value) {
      parameters.starMapDirectory = value;
   },
   loadSettingsDataTypeString(),
   storeSettingsDataTypeString(),
   loadParametersDataTypeString(),
   storeParametersDataTypeString()
));

parameters.insertParameterDescription(new parameterDescription(
   "weightKeyword",
   "",
   function(parameters) {
      return parameters.weightKeyword;
   },
   function(parameters, value) {
      parameters.weightKeyword = value;
   },
   loadSettingsDataTypeString(),
   storeSettingsDataTypeString(),
   loadParametersDataTypeString(),
   storeParametersDataTypeString()
));

parameters.insertParameterDescription(new parameterDescription(
   "starMapPostfix",
   "_s_m",
   function(parameters) {
      return parameters.starMapPostfix;
   },
   function(parameters, value) {
      parameters.starMapPostfix = value;
   },
   loadSettingsDataTypeString(),
   storeSettingsDataTypeString(),
   loadParametersDataTypeString(),
   storeParametersDataTypeString()
));

parameters.insertParameterDescription(new parameterDescription(
   "overwriteExistingFiles",
   false,
   function(parameters) {
      return parameters.overwriteExistingFiles;
   },
   function(parameters, value) {
      parameters.overwriteExistingFiles = value;
   },
   loadSettingsDataTypeBoolean(),
   storeSettingsDataTypeBoolean(),
   loadParametersDataTypeBoolean(),
   storeParametersDataTypeBoolean()
));

parameters.insertParameterDescription(new parameterDescription(
   "onError",
   2,
   function(parameters) {
      return parameters.onError;
   },
   function(parameters, value) {
      parameters.onError = value;
   },
   loadSettingsDataTypeInt32(0, parameters.onErrors.length - 1),
   storeSettingsDataTypeInt32(),
   loadParametersDataTypeInt32(0, parameters.onErrors.length - 1),
   storeParametersDataTypeInt32()
));

parameters.reset();

// ----------------------------------------------------------------------------
// EOF SubframeSelectorParameters.js - Released 2018-11-05T16:53:08Z
