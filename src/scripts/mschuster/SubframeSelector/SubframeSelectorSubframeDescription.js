// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// SubframeSelectorSubframeDescription.js - Released 2016/04/06 00:00:00 UTC
// ****************************************************************************
//
// This file is part of SubframeSelector Script version 1.5
//
// Copyright (C) 2012-2016 Mike Schuster. All Rights Reserved.
// Copyright (C) 2003-2016 Pleiades Astrophoto S.L. All Rights Reserved.
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

function targetSubframeDescription(checked, selected, filePath) {
   this.checked = checked;
   this.selected = selected;
   this.filePath = filePath;

   this.newCheckedSelected = function(checked, selected) {
      return new targetSubframeDescription(
         checked,
         selected,
         this.filePath
      );
   };
}
var nullTargetSubframeDescription = new targetSubframeDescription(false, false, "");

function evaluationDescription(
   MD5,
   checked,
   selected,
   locked,
   index,
   weight,
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
) {
   this.MD5 = MD5;
   this.checked = checked;
   this.selected = selected;
   this.locked = locked;
   this.index = index;
   this.weight = weight;
   this.FWHM = FWHM;
   this.FWHMMeanDeviation = FWHMMeanDeviation;
   this.eccentricity = eccentricity;
   this.eccentricityMeanDeviation = eccentricityMeanDeviation;
   this.SNRWeight = SNRWeight;
   this.median = median;
   this.noise = noise;
   this.dispersion = dispersion;
   this.starSupport = starSupport;
   this.starResidual = starResidual;
   this.starResidualMeanDeviation = starResidualMeanDeviation;
   this.noiseSupport = noiseSupport;
   this.date = date;
   this.starDescriptions = starDescriptions;

   this.newCheckedSelectedLocked = function(checked, selected, locked) {
      return new evaluationDescription(
         this.MD5,
         checked,
         selected,
         locked,
         this.index,
         this.weight,
         this.FWHM,
         this.FWHMMeanDeviation,
         this.eccentricity,
         this.eccentricityMeanDeviation,
         this.SNRWeight,
         this.median,
         this.noise,
         this.dispersion,
         this.starSupport,
         this.starResidual,
         this.starResidualMeanDeviation,
         this.noiseSupport,
         this.date,
         this.starDescriptions
      );
   }
}
var nullEvaluationDescription = new evaluationDescription(
   null,
   false,
   false,
   false,
   0,
   0.0,
   0.0,
   0.0,
   0.0,
   0.0,
   0.0,
   0.0,
   0.0,
   0.0,
   0,
   0.0,
   0.0,
   0.0,
   "",
   []
);

function evaluationDescriptionIndexAscendingCompare(a, b) {
   return a.index < b.index ? -1 : a.index > b.index ? 1 : 0;
}
function evaluationDescriptionIndexDescendingCompare(a, b) {
   return evaluationDescriptionIndexAscendingCompare(b, a);
}

function evaluationDescriptionNameAscendingCompare(a, b) {
   var aName = File.extractName(parameters.targetSubframeDescriptions[a.index].filePath);
   var bName = File.extractName(parameters.targetSubframeDescriptions[b.index].filePath);
   return aName < bName ? -1 : aName > bName ? 1 :
      evaluationDescriptionIndexAscendingCompare(a, b);
}
function evaluationDescriptionNameDescendingCompare(a, b) {
   return evaluationDescriptionNameAscendingCompare(b, a);
}

function evaluationDescriptionWeightAscendingCompare(a, b) {
   return a.weight < b.weight ? -1 : a.weight > b.weight ? 1 :
      evaluationDescriptionIndexAscendingCompare(a, b);
}
function evaluationDescriptionWeightDescendingCompare(a, b) {
   return evaluationDescriptionWeightAscendingCompare(b, a);
}

function evaluationDescriptionFWHMAscendingCompare(a, b) {
   return a.FWHM < b.FWHM ? -1 : a.FWHM > b.FWHM ? 1 :
      evaluationDescriptionIndexAscendingCompare(a, b);
}
function evaluationDescriptionFWHMDescendingCompare(a, b) {
   return evaluationDescriptionFWHMAscendingCompare(b, a);
}

function evaluationDescriptionFWHMMeanDeviationAscendingCompare(a, b) {
   return a.FWHMMeanDeviation < b.FWHMMeanDeviation ? -1 :
      a.FWHMMeanDeviation > b.FWHMMeanDeviation ? 1 :
      evaluationDescriptionIndexAscendingCompare(a, b);
}
function evaluationDescriptionFWHMMeanDeviationDescendingCompare(a, b) {
   return evaluationDescriptionFWHMMeanDeviationAscendingCompare(b, a);
}

function evaluationDescriptionEccentricityAscendingCompare(a, b) {
   return a.eccentricity < b.eccentricity ? -1 : a.eccentricity > b.eccentricity ? 1 :
      evaluationDescriptionIndexAscendingCompare(a, b);
}
function evaluationDescriptionEccentricityDescendingCompare(a, b) {
   return evaluationDescriptionEccentricityAscendingCompare(b, a);
}

function evaluationDescriptionEccentricityMeanDeviationAscendingCompare(a, b) {
   return a.eccentricityMeanDeviation < b.eccentricityMeanDeviation ? -1 :
      a.eccentricityMeanDeviation > b.eccentricityMeanDeviation ? 1 :
      evaluationDescriptionIndexAscendingCompare(a, b);
}
function evaluationDescriptionEccentricityMeanDeviationDescendingCompare(a, b) {
   return evaluationDescriptionEccentricityMeanDeviationAscendingCompare(b, a);
}

function evaluationDescriptionSNRWeightAscendingCompare(a, b) {
   return a.SNRWeight < b.SNRWeight ? -1 : a.SNRWeight > b.SNRWeight ? 1 :
      evaluationDescriptionIndexAscendingCompare(a, b);
}
function evaluationDescriptionSNRWeightDescendingCompare(a, b) {
   return evaluationDescriptionSNRWeightAscendingCompare(b, a);
}

function evaluationDescriptionMedianAscendingCompare(a, b) {
   return a.median < b.median ? -1 : a.median > b.median ? 1 :
      evaluationDescriptionIndexAscendingCompare(a, b);
}
function evaluationDescriptionMedianDescendingCompare(a, b) {
   return evaluationDescriptionMedianAscendingCompare(b, a);
}

function evaluationDescriptionNoiseAscendingCompare(a, b) {
   return a.noise < b.noise ? -1 : a.noise > b.noise ? 1 :
      evaluationDescriptionIndexAscendingCompare(a, b);
}
function evaluationDescriptionNoiseDescendingCompare(a, b) {
   return evaluationDescriptionNoiseAscendingCompare(b, a);
}

function evaluationDescriptionDispersionAscendingCompare(a, b) {
   return a.dispersion < b.dispersion ? -1 : a.dispersion > b.dispersion ? 1 :
      evaluationDescriptionIndexAscendingCompare(a, b);
}
function evaluationDescriptionDispersionDescendingCompare(a, b) {
   return evaluationDescriptionDispersionAscendingCompare(b, a);
}

function evaluationDescriptionStarSupportAscendingCompare(a, b) {
   return a.starSupport < b.starSupport ? -1 : a.starSupport > b.starSupport ? 1 :
      evaluationDescriptionIndexAscendingCompare(a, b);
}
function evaluationDescriptionStarSupportDescendingCompare(a, b) {
   return evaluationDescriptionStarSupportAscendingCompare(b, a);
}

function evaluationDescriptionStarResidualAscendingCompare(a, b) {
   return a.starResidual < b.starResidual ? -1 : a.starResidual > b.starResidual ? 1 :
      evaluationDescriptionIndexAscendingCompare(a, b);
}
function evaluationDescriptionStarResidualDescendingCompare(a, b) {
   return evaluationDescriptionStarResidualAscendingCompare(b, a);
}

function evaluationDescriptionStarResidualMeanDeviationAscendingCompare(a, b) {
   return a.starResidualMeanDeviation < b.starResidualMeanDeviation ? -1 :
      a.starResidualMeanDeviation > b.starResidualMeanDeviation ? 1 :
      evaluationDescriptionIndexAscendingCompare(a, b);
}
function evaluationDescriptionStarResidualMeanDeviationDescendingCompare(a, b) {
   return evaluationDescriptionStarResidualMeanDeviationAscendingCompare(b, a);
}

function evaluationDescriptionNoiseSupportAscendingCompare(a, b) {
   return a.noiseSupport < b.noiseSupport ? -1 : a.noiseSupport > b.noiseSupport ? 1 :
      evaluationDescriptionIndexAscendingCompare(a, b);
}
function evaluationDescriptionNoiseSupportDescendingCompare(a, b) {
   return evaluationDescriptionNoiseSupportAscendingCompare(b, a);
}

function evaluationDescriptionDateAscendingCompare(a, b) {
   return a.date < b.date ? -1 : a.date > b.date ? 1 :
      evaluationDescriptionIndexAscendingCompare(a, b);
}
function evaluationDescriptionDateDescendingCompare(a, b) {
   return evaluationDescriptionDateAscendingCompare(b, a);
}

var evaluationDescriptionCompare = [
   [
      evaluationDescriptionIndexAscendingCompare,
      evaluationDescriptionIndexDescendingCompare
   ],
   [
      evaluationDescriptionNameAscendingCompare,
      evaluationDescriptionNameDescendingCompare
   ],
   [
      evaluationDescriptionWeightAscendingCompare,
      evaluationDescriptionWeightDescendingCompare
   ],
   [
      evaluationDescriptionFWHMAscendingCompare,
      evaluationDescriptionFWHMDescendingCompare
   ],
   [
      evaluationDescriptionEccentricityAscendingCompare,
      evaluationDescriptionEccentricityDescendingCompare
   ],
   [
      evaluationDescriptionSNRWeightAscendingCompare,
      evaluationDescriptionSNRWeightDescendingCompare
   ],
   [
      evaluationDescriptionMedianAscendingCompare,
      evaluationDescriptionMedianDescendingCompare
   ],
   [
      evaluationDescriptionDispersionAscendingCompare,
      evaluationDescriptionDispersionDescendingCompare
   ],
   [
      evaluationDescriptionNoiseAscendingCompare,
      evaluationDescriptionNoiseDescendingCompare
   ],
   [
      evaluationDescriptionStarSupportAscendingCompare,
      evaluationDescriptionStarSupportDescendingCompare
   ],
   [
      evaluationDescriptionStarResidualAscendingCompare,
      evaluationDescriptionStarResidualDescendingCompare
   ],
   [
      evaluationDescriptionNoiseSupportAscendingCompare,
      evaluationDescriptionNoiseSupportDescendingCompare
   ],
   [
      evaluationDescriptionFWHMMeanDeviationAscendingCompare,
      evaluationDescriptionFWHMMeanDeviationDescendingCompare
   ],
   [
      evaluationDescriptionEccentricityMeanDeviationAscendingCompare,
      evaluationDescriptionEccentricityMeanDeviationDescendingCompare
   ],
   [
      evaluationDescriptionStarResidualMeanDeviationAscendingCompare,
      evaluationDescriptionStarResidualMeanDeviationDescendingCompare
   ],
   [
      evaluationDescriptionDateAscendingCompare,
      evaluationDescriptionDateDescendingCompare
   ]
];

function SNRWeightFunction(meanDeviation, noise, cameraGain, cameraResolution) {
   return Math.pow(meanDeviation, 2.0) / Math.pow(noise, 2.0);
}

function pedestalFunction(value) {
   return value - Math.min(
      1.0,
      parameters.pedestal /
      parameters.cameraResolutionValues[parameters.cameraResolution]
   );
}

function subframeCacheMD5(filePath) {
   if (!parameters.useFileCache) {
      return null;
   }

   var c = MD5Initialize();

   c = MD5AppendString(
      c, TITLE + "." + VERSION
   );

   try {
      c = MD5AppendFileMaxBytes(c, filePath, parameters.MD5MaxBytes);
   }
   catch (error) {
      return null;
   }

   c = MD5AppendString(
      c, format("%d", parameters.subframeRegionLeft)
   );
   c = MD5AppendString(
      c, format("%d", parameters.subframeRegionTop)
   );
   c = MD5AppendString(
      c, format("%d", parameters.subframeRegionWidth)
   );
   c = MD5AppendString(
      c, format("%d", parameters.subframeRegionHeight)
   );
   c = MD5AppendString(
      c, format("%d", parameters.pedestal)
   );

   c = MD5AppendString(
      c, format("%d", parameters.starDetectionLayers)
   );
   c = MD5AppendString(
      c, format("%d", parameters.noiseReductionLayers)
   );
   c = MD5AppendString(
      c, format("%d", parameters.hotPixelFilterRadius)
   );
   c = MD5AppendString(
      c, format("%.2f", Math.log10(parameters.starDetectionSensitivity))
   );
   c = MD5AppendString(
      c, format("%.2f", parameters.starPeakResponse)
   );
   c = MD5AppendString(
      c, format("%.2f", parameters.maximumStarDistortion
   ));
   c = MD5AppendString(
      c, format("%.2f", parameters.upperLimit
   ));
   c = MD5AppendString(
      c, "\"" + parameters.modelFunctions[parameters.modelFunction] + "\""
   );
   c = MD5AppendString(
      c, format("%d", parameters.circularModel ? 1 : 0)
   );

   return MD5Finalize(c);
}

function subframeCacheLine(MD5) {
   var cacheLine = 0;
   for (var i = 0; i != 4; ++i) {
      cacheLine = 64 * cacheLine + MD5[i];
   }
   //console.writeln("cacheLine: ", Math.abs(cacheLine) % parameters.cacheSize);
   return Math.abs(cacheLine) % parameters.cacheSize;
}

function subframeCacheStore(description) {
   if (!parameters.useFileCache) {
      return;
   }

   var prefix =
      TITLE + "." + VERSION + "_cache_" + subframeCacheLine(description.MD5) + "_";

   var i = 0;
   for (; i != 4; ++i) {
      Settings.write(prefix + i, DataType_Int32, description.MD5[i]);
   }
   Settings.write(prefix + i, DataType_Float, description.FWHM);
   ++i;
   Settings.write(prefix + i, DataType_Float, description.FWHMMeanDeviation);
   ++i;
   Settings.write(prefix + i, DataType_Float, description.eccentricity);
   ++i;
   Settings.write(prefix + i, DataType_Float, description.eccentricityMeanDeviation);
   ++i;
   Settings.write(prefix + i, DataType_Float, description.median);
   ++i;
   Settings.write(prefix + i, DataType_Float, description.noise);
   ++i;
   Settings.write(prefix + i, DataType_Float, description.dispersion);
   ++i;
   Settings.write(prefix + i, DataType_Int32, description.starSupport);
   ++i;
   Settings.write(prefix + i, DataType_Float, description.starResidual);
   ++i;
   Settings.write(prefix + i, DataType_Float, description.starResidualMeanDeviation);
   ++i;
   Settings.write(prefix + i, DataType_Float, description.noiseSupport);
   ++i;
   Settings.write(prefix + i, DataType_String, description.date);
   ++i;
}

function subframeCacheLoad(MD5) {
   if (!parameters.useFileCache) {
      return null;
   }
   if (MD5 == null) {
      return null;
   }

   var prefix =
      TITLE + "." + VERSION + "_cache_" + subframeCacheLine(MD5) + "_";

   var i = 0;
   for (; i != 4; ++i) {
      var value = Settings.read(prefix + i, DataType_Int32);
      if (value == null) {
         return null;
      }
      if (value != MD5[i]) {
         return null;
      }
   }
   var value = Settings.read(prefix + i, DataType_Float);
   if (value == null) {
      return null;
   }
   var FWHM = value;
   ++i;
   var value = Settings.read(prefix + i, DataType_Float);
   if (value == null) {
      return null;
   }
   var FWHMMeanDeviation = value;
   ++i;
   var value = Settings.read(prefix + i, DataType_Float);
   if (value == null) {
      return null;
   }
   var eccentricity = value;
   ++i;
   var value = Settings.read(prefix + i, DataType_Float);
   if (value == null) {
      return null;
   }
   var eccentricityMeanDeviation = value;
   ++i;
   var value = Settings.read(prefix + i, DataType_Float);
   if (value == null) {
      return null;
   }
   var median = value;
   ++i;
   var value = Settings.read(prefix + i, DataType_Float);
   if (value == null) {
      return null;
   }
   var noise = value;
   ++i;
   var value = Settings.read(prefix + i, DataType_Float);
   if (value == null) {
      return null;
   }
   var dispersion = value;
   ++i;
   var value = Settings.read(prefix + i, DataType_Int32);
   if (value == null) {
      return null;
   }
   var starSupport = value;
   ++i;
   var value = Settings.read(prefix + i, DataType_Float);
   if (value == null) {
      return null;
   }
   var starResidual = value;
   ++i;
   var value = Settings.read(prefix + i, DataType_Float);
   if (value == null) {
      return null;
   }
   var starResidualMeanDeviation = value;
   ++i;
   var value = Settings.read(prefix + i, DataType_Float);
   if (value == null) {
      return null;
   }
   var noiseSupport = value;
   ++i;
   var value = Settings.read(prefix + i, DataType_String);
   if (value == null) {
      return null;
   }
   var date = value;
   ++i;

   var SNRWeight = SNRWeightFunction(
      dispersion,
      noise,
      parameters.cameraGain,
      parameters.cameraResolutionValues[parameters.cameraResolution]
   );

   return new evaluationDescription(
      MD5,
      true,
      false,
      false,
      0,
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
      []
   );
}

function subframeCacheFlush() {
   for (var cacheLine = 0; cacheLine != parameters.cacheSize; ++cacheLine) {
      var prefix = TITLE + "." + VERSION + "_cache_" + cacheLine + "_";
      Settings.remove(prefix + "0");
   }
}

// ****************************************************************************
// EOF SubframeSelectorSubframeDescription.js - Released 2016/04/06 00:00:00 UTC
