// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// MainModel.js - Released 2016/12/12 00:00:00 UTC
// ****************************************************************************
//
// This file is part of MureDenoise Script Version 1.16
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

function MainModel() {
   // Image view.
   this.imageViewFormat = "%s";
   this.imageView = null;

   // Minimum image size.
   this.imageSizeMinimum = 256;

   // Flatfield view.
   this.flatfieldScaleFormat = "%.1f";
   this.flatfieldScaleUnits = "%%";
   this.flatfieldScaleNormalization = 100;
   this.flatfieldViewFormat = "%s";
   this.flatfieldView = null;

   // Minimum flatfield size.
   this.flatfieldSizeMinimum = 1024;

   // Count of layers to remove for flatfield smoothing.
   this.smoothFlatfieldLayerCount = 8;

   // Combination count of the image.
   this.imageCombinationCountMinimum = 1;
   this.imageCombinationCountMaximum = 10000;
   this.imageCombinationCountDefault = 1;
   this.imageCombinationCountFormat = "%d";
   this.imageCombinationCountUnits = "";
   this.imageCombinationCount = this.imageCombinationCountDefault;

   // Interpolation method names.
   this.imageInterpolationMethodNames = [
      "Nearest Neighbor",
      "Bilinear",
      "Bicubic Spline",
      "Lanczos-3",
      "Lanczos-4"
   ];

   // Subband variance scalings.
   this.subbandVarianceScalings = [
      // Nearest Neighbor
         [1, 4, 16, 64, 256, 1024],
      // Bilinear
         [4 / 9, 2.78632, 13.4632, 58.8079, 245.504, 1002.73],
      // Bicubic Spline
         [3249 / 4900, 3.5393, 15.0356, 62.0577, 252.053, 1016.59],
      // Lanczos-3
         [0.798660, 3.94876, 15.6062, 63.217, 254.434, 1020.38],
      // Lanczos-4
         [0.835437, 3.93833, 15.6542, 63.2285, 254.462, 1021.0]
   ];

   // Base gain variance scaling function.
   this.baseGainVarianceScale = function() {
      return this.denoiseVarianceScale;
   };

   // Base Gaussian noise variance scaling function.
   this.baseGaussianNoiseVarianceScale = function() {
      if (
         this.darkfieldCombinationCount == 0 ||
         this.denoiseMethod == this.denoiseMethodLate2016
      ) {
         return this.denoiseVarianceScale / this.imageCombinationCount;
      }

      return this.denoiseVarianceScale / (
         (this.imageCombinationCount * this.darkfieldCombinationCount) /
         (this.imageCombinationCount + this.darkfieldCombinationCount)
      );
   };

   // Base subband variance scaling.
   this.baseSubbandVarianceScaling = function() {
      var r = this.subbandVarianceScalings[
         this.imageInterpolationMethod
      ][0];
      var n = this.imageCombinationCount;

      return (1 + (n - 1) * r) / n;
   };

   // Subband variance scaling ratio.
   this.subbandVarianceScalingRatio = function(level) {
      if (this.denoiseMethod == this.denoiseMethodLate2016) {
         return 1;
      }

      var q0 = this.subbandVarianceScalings[
         0
      ][level - 1];
      var q1 = this.subbandVarianceScalings[
         0
      ][level];
      var r0 = this.subbandVarianceScalings[
         this.imageInterpolationMethod
      ][level - 1];
      var r1 = this.subbandVarianceScalings[
         this.imageInterpolationMethod
      ][level];
      var n = this.imageCombinationCount;

      return (q1 + (n - 1) * r1) / (q0 + (n - 1) * r0) / 4;
   }

   // Interpolation method of the combination.
   this.imageInterpolationMethodMinimum = 0;
   this.imageInterpolationMethodMaximum =
      this.imageInterpolationMethodNames.length - 1;
   this.imageInterpolationMethodDefault = 3;
   this.imageInterpolationMethodFormat = "%s";
   this.imageInterpolationMethodUnits = "";
   this.imageInterpolationMethod = this.imageInterpolationMethodDefault;

   // Combination count of the darkfield.
   this.darkfieldCombinationCountMinimum = 0;
   this.darkfieldCombinationCountMaximum = 10000;
   this.darkfieldCombinationCountDefault = 0;
   this.darkfieldCombinationCountFormat = "%d";
   this.darkfieldCombinationCountUnits = "";
   this.darkfieldCombinationCount =
      this.darkfieldCombinationCountDefault;

   // Gain of the detector in e-/DN.
   this.detectorGainMinimum = 0;
   this.detectorGainMaximum = 65535;
   this.detectorGainDefault = 0;
   this.detectorGainFormat = "%.3f";
   this.detectorGainUnits = "e-/DN";
   this.detectorGain = this.detectorGainDefault;

   // Base gain.
   this.baseGain = function() {
      if (this.denoiseMethod == this.denoiseMethodLate2016) {
         // Note: the lack of Math.sqrt on the variance product is a bug.
         // Note: this bug is maintained for legacy compatibility reasons.
         return this.detectorGain * this.imageCombinationCount /
            (
               this.baseGainVarianceScale() *
               this.baseSubbandVarianceScaling()
            );
      }

      return this.detectorGain * this.imageCombinationCount /
         Math.sqrt(
            this.baseGainVarianceScale() *
            this.baseSubbandVarianceScaling()
         );
   };

   // Standard deviation of additive white Gaussian noise of the detector in
   // DN.
   this.detectorGaussianNoiseMinimum = 0;
   this.detectorGaussianNoiseMaximum = 65535;
   this.detectorGaussianNoiseDefault = 0;
   this.detectorGaussianNoiseFormat = "%.2f";
   this.detectorGaussianNoiseUnits = "DN";
   this.detectorGaussianNoise = this.detectorGaussianNoiseDefault;

   // Base standard deviation of additive white Gaussian noise.
   this.baseGaussianNoise = function() {
      return this.detectorGaussianNoise *
         Math.sqrt(
            this.baseGaussianNoiseVarianceScale() *
            this.baseSubbandVarianceScaling()
         );
   };

   // Offset of the detector in DN.
   this.detectorOffsetMinimum = 0;
   this.detectorOffsetMaximum = 65535;
   this.detectorOffsetDefault = 0;
   this.detectorOffsetFormat = "%.1f";
   this.detectorOffsetUnits = "DN";
   this.detectorOffset = this.detectorOffsetDefault;

   // Base offset.
   this.baseOffset = function() {
      return this.detectorOffset;
   };

   // Denoise method names.
   this.denoiseMethodNames = [
      "Current",
      "Legacy late 2016 (Version 1.15)"
   ];
   this.denoiseMethodCurrent = 0;
   this.denoiseMethodLate2016 = 1;

   // Denoise method.
   this.denoiseMethodMinimum = 0;
   this.denoiseMethodMaximum =
      this.denoiseMethodNames.length - 1;
   this.denoiseMethodDefault = 0;
   this.denoiseMethodFormat = "%s";
   this.denoiseMethodUnits = "";
   this.denoiseMethod = this.denoiseMethodDefault;

   // Denoise variance scale.
   this.denoiseVarianceScaleMinimum = 0.1;
   this.denoiseVarianceScaleMaximum = 10;
   this.denoiseVarianceScaleDefault = 1;
   this.denoiseVarianceScaleFormat = "%.3f";
   this.denoiseVarianceScaleUnits = "";
   this.denoiseVarianceScale = this.denoiseVarianceScaleDefault;

   // Denoise cycle-spin count.
   this.denoiseCycleSpinCountMinimum = 1;
   this.denoiseCycleSpinCountMaximum = 32;
   this.denoiseCycleSpinCountDefault = 8;
   this.denoiseCycleSpinCountFormat = "%d";
   this.denoiseCycleSpinCountUnits = "";
   this.denoiseCycleSpinCount = this.denoiseCycleSpinCountDefault;

   // Generate method noise image option.
   this.generateMethodNoiseImageDefault = false;
   this.generateMethodNoiseImageQuantileResolution = Math.round(Math.pow2(16));
   this.generateMethodNoiseImageQuantileLow = 0.001;
   this.generateMethodNoiseImageQuantileHigh = 0.999;
   this.generateMethodNoiseImage = this.generateMethodNoiseImageDefault;

   // Gives numeric if well defined and within range, otherwise a default.
   this.defaultNumeric = function(numeric, min, max, def) {
      return numeric != null &&
         !isNaN(numeric) &&
         numeric >= min && numeric <= max ? numeric : def;
   };

   // Gives boolean if well defined, otherwise a default.
   this.defaultBoolean = function(bool, def) {
      return bool != null && (bool == false || bool == true) ? bool : def;
   };

   // Gives string if well defined, otherwise a default.
   this.defaultString = function(str, def) {
      return str != null ? str : def;
   }

   // Loads core settings.
   this.loadSettings = function() {
      this.flatfieldView = View.viewById(this.defaultString(
         Settings.read("flatfieldView", DataType_String8),
         ""
      ));

      this.imageCombinationCount = this.defaultNumeric(
         Settings.read("imageCombinationCount", DataType_Int32),
         this.imageCombinationCountMinimum,
         this.imageCombinationCountMaximum,
         this.imageCombinationCountDefault
      );
      this.imageInterpolationMethod = this.defaultNumeric(
         Settings.read("imageInterpolationMethod", DataType_Int32),
         this.imageInterpolationMethodMinimum,
         this.imageInterpolationMethodMaximum,
         this.imageInterpolationMethodDefault
      );

      this.darkfieldCombinationCount = this.defaultNumeric(
         Settings.read("darkfieldCombinationCount", DataType_Int32),
         this.darkfieldCombinationCountMinimum,
         this.darkfieldCombinationCountMaximum,
         this.darkfieldCombinationCountDefault
      );

      this.detectorGain = this.defaultNumeric(
         Settings.read("detectorGain", DataType_Real32),
         this.detectorGainMinimum,
         this.detectorGainMaximum,
         this.detectorGainDefault
      );
      this.detectorGaussianNoise = this.defaultNumeric(
         Settings.read("detectorGaussianNoise", DataType_Real32),
         this.detectorGaussianNoiseMinimum,
         this.detectorGaussianNoiseMaximum,
         this.detectorGaussianNoiseDefault
      );
      this.detectorOffset = this.defaultNumeric(
         Settings.read("detectorOffset", DataType_Real32),
         this.detectorOffsetMinimum,
         this.detectorOffsetMaximum,
         this.detectorOffsetDefault
      );

      this.denoiseMethod = this.defaultNumeric(
         Settings.read("denoiseMethod", DataType_Int32),
         this.denoiseMethodMinimum,
         this.denoiseMethodMaximum,
         this.denoiseMethodDefault
      );
      this.denoiseVarianceScale = this.defaultNumeric(
         Settings.read("denoiseVarianceScale", DataType_Real32),
         this.denoiseVarianceScaleMinimum,
         this.denoiseVarianceScaleMaximum,
         this.denoiseVarianceScaleDefault
      );
      this.denoiseCycleSpinCount = this.defaultNumeric(
         Settings.read("denoiseCycleSpinCount", DataType_Int32),
         this.denoiseCycleSpinCountMinimum,
         this.denoiseCycleSpinCountMaximum,
         this.denoiseCycleSpinCountDefault
      );
      this.generateMethodNoiseImage = this.defaultBoolean(
         Settings.read("generateMethodNoiseImage", DataType_Boolean),
         this.generateMethodNoiseImageDefault
      );
   };

   // Stores core settings.
   this.storeSettings = function() {
      Settings.write(
         "flatfieldView",
         DataType_String8,
         this.flatfieldView != null && this.flatfieldView.isView ?
            this.flatfieldView.fullId :
            ""
      );
      Settings.write(
         "imageCombinationCount",
         DataType_Int32,
         this.imageCombinationCount
      );
      Settings.write(
         "imageInterpolationMethod",
         DataType_Int32,
         this.imageInterpolationMethod
      );

      Settings.write(
         "darkfieldCombinationCount",
         DataType_Int32,
         this.darkfieldCombinationCount
      );

      Settings.write(
         "detectorGain",
         DataType_Real32,
         this.detectorGain
      );
      Settings.write(
         "detectorGaussianNoise",
         DataType_Real32,
         this.detectorGaussianNoise
      );
      Settings.write(
         "detectorOffset",
         DataType_Real32,
         this.detectorOffset
      );

      Settings.write(
         "denoiseMethod",
         DataType_Int32,
         this.denoiseMethod
      );
      Settings.write(
         "denoiseVarianceScale",
         DataType_Real32,
         this.denoiseVarianceScale
      );
      Settings.write(
         "denoiseCycleSpinCount",
         DataType_Int32,
         this.denoiseCycleSpinCount
      );
      Settings.write(
         "generateMethodNoiseImage",
         DataType_Boolean,
         this.generateMethodNoiseImage
      );
   };

   // Loads instance parameters.
   this.loadParameters = function() {
      if (Parameters.has("flatfieldView")) {
         this.flatfieldView = View.viewById(this.defaultString(
            Parameters.getString("flatfieldView"),
            ""
         ));
      }

      if (Parameters.has("imageCombinationCount")) {
         this.imageCombinationCount = this.defaultNumeric(
            Parameters.getInteger("imageCombinationCount"),
            this.imageCombinationCountMinimum,
            this.imageCombinationCountMaximum,
            this.imageCombinationCountDefault
         );
      }
      if (Parameters.has("imageInterpolationMethod")) {
         this.imageInterpolationMethod = this.defaultNumeric(
            Parameters.getInteger("imageInterpolationMethod"),
            this.imageInterpolationMethodMinimum,
            this.imageInterpolationMethodMaximum,
            this.imageInterpolationMethodDefault
         );
      }

      if (Parameters.has("darkfieldCombinationCount")) {
         this.darkfieldCombinationCount = this.defaultNumeric(
            Parameters.getInteger("darkfieldCombinationCount"),
            this.darkfieldCombinationCountMinimum,
            this.darkfieldCombinationCountMaximum,
            this.darkfieldCombinationCountDefault
         );
      }

      if (Parameters.has("detectorGain")) {
         this.detectorGain = this.defaultNumeric(
            Parameters.getReal("detectorGain"),
            this.detectorGainMinimum,
            this.detectorGainMaximum,
            this.detectorGainDefault
         );
      }
      if (Parameters.has("detectorGaussianNoise")) {
         this.detectorGaussianNoise = this.defaultNumeric(
            Parameters.getReal("detectorGaussianNoise"),
            this.detectorGaussianNoiseMinimum,
            this.detectorGaussianNoiseMaximum,
            this.detectorGaussianNoiseDefault
         );
      }
      if (Parameters.has("detectorOffset")) {
         this.detectorOffset = this.defaultNumeric(
            Parameters.getReal("detectorOffset"),
            this.detectorOffsetMinimum,
            this.detectorOffsetMaximum,
            this.detectorOffsetDefault
         );
      }

      if (Parameters.has("denoiseMethod")) {
         this.denoiseMethod = this.defaultNumeric(
            Parameters.getInteger("denoiseMethod"),
            this.denoiseMethodMinimum,
            this.denoiseMethodMaximum,
            this.denoiseMethodDefault
         );
      }
      if (Parameters.has("denoiseVarianceScale")) {
         this.denoiseVarianceScale = this.defaultNumeric(
            Parameters.getReal("denoiseVarianceScale"),
            this.denoiseVarianceScaleMinimum,
            this.denoiseVarianceScaleMaximum,
            this.denoiseVarianceScaleDefault
         );
      }
      if (Parameters.has("denoiseCycleSpinCount")) {
         this.denoiseCycleSpinCount = this.defaultNumeric(
            Parameters.getInteger("denoiseCycleSpinCount"),
            this.denoiseCycleSpinCountMinimum,
            this.denoiseCycleSpinCountMaximum,
            this.denoiseCycleSpinCountDefault
         );
      }
      if (Parameters.has("generateMethodNoiseImage")) {
         this.generateMethodNoiseImage = this.defaultBoolean(
            Parameters.getBoolean("generateMethodNoiseImage"),
            this.generateMethodNoiseImageDefault
         );
      }
   };

   // Stores instance parameters.
   this.storeParameters = function() {
      Parameters.clear();

      Parameters.set("version", VERSION);

      Parameters.set(
         "flatfieldView",
         this.flatfieldView != null && this.flatfieldView.isView ?
            this.flatfieldView.fullId :
            ""
      );

      Parameters.set("imageCombinationCount", this.imageCombinationCount);
      Parameters.set(
         "imageInterpolationMethod", this.imageInterpolationMethod
      );

      Parameters.set(
         "darkfieldCombinationCount", this.darkfieldCombinationCount
      );

      Parameters.set("detectorGain", this.detectorGain);
      Parameters.set("detectorGaussianNoise", this.detectorGaussianNoise);
      Parameters.set("detectorOffset", this.detectorOffset);

      Parameters.set(
         "denoiseMethod", this.denoiseMethod
      );
      Parameters.set("denoiseVarianceScale", this.denoiseVarianceScale);
      Parameters.set("denoiseCycleSpinCount", this.denoiseCycleSpinCount);
      Parameters.set(
         "generateMethodNoiseImage", this.generateMethodNoiseImage
      );
   };

   // Clears the model.
   this.clear = function() {
      this.imageView = null;
      this.flatfieldView = null;
   };
}

// ****************************************************************************
// EOF MainModel.js - Released 2016/12/12 00:00:00 UTC
