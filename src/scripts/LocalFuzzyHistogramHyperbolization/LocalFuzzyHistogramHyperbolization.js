// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.1
// ----------------------------------------------------------------------------
// LocalFuzzyHistogramHyperbolization.js - Released 2018-10-26T11:23:18Z
// ----------------------------------------------------------------------------
//
// This file is part of LocalFuzzyHistogramHyperbolization Script version 1.10
//
// Copyright (c) 2017-2018 Frank Weidenbusch
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

#define TITLE "LocalFuzzyHistogramHyperbolization Script"
#define VERSION "1.10"

#feature-id Utilities > LocalFuzzyHistogramHyperbolization
#feature-info  A script for contrast enhancement

#include <pjsr/ColorSpace.jsh>
#include <pjsr/DataType.jsh>
#include <pjsr/FontFamily.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/SampleType.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/NumericControl.jsh>
#include <pjsr/SectionBar.jsh>

#define USE_STAR_DETECTOR true
#define __PJSR_NO_STAR_DETECTOR_TEST_ROUTINES
#include <pjsr/StarDetector.jsh>


//==================================================================

function parametersPrototype() {
   this.dialog = null;
   this.targetView = null;
   this.maskView = null;

   this.algorithmLabels = new Array(
      "Linear",
      "MTF",
      "Sigmoid",
      "Gauss",
      "Masked MTF (linear stretch)"
   );

   this.segmentationLabels = new Array(
      "5 x 5",
      "6 x 6",
      "7 x 7",
      "8 x 8",
      "9 x 9",
      "10 x 10",
      "11 x 11",
      "12 x 12",
      "13 x 13",
      "14 x 14",
      "15 x 15",
      "16 x 16",
      "17 x 17",
      "18 x 18",
      "19 x 19",
      "20 x 20",
      "21 x 21",
      "22 x 22",
      "23 x 23",
      "24 x 24",
      "25 x 25"
   );

   this.defClustering = 0.05;
   this.clustering = this.defClustering;

   this.defAutoBeta = 1.2;
   this.autoBeta = this.defAutoBeta;

   this.defBeta = 1.2;
   this.beta = this.defBeta;

   this.defLowerLimit = 0.35;
   this.lowerLimit = this.defLowerLimit;

   this.defUpperLimit = 0.85;
   this.upperLimit = this.defUpperLimit;

   this.defGamma = 5;
   this.gamma = this.defGamma;

   this.defMidtone = 0.5;
   this.midtone = this.defMidtone;

   this.defSigma = 0.55;
   this.sigma = this.defSigma;

   this.defMmtf = 1.15;
   this.mmtf = this.defMmtf;

   this.defMedianSTF = 0.25;
   this.medianSTF = this.defMedianSTF;

   this.defAlgorithm_CBIndex = 3;
   this.algorithm_CBIndex = this.defAlgorithm_CBIndex;

   this.defSegmentation_CBIndex = 10;
   this.segmentation_CBIndex = this.defSegmentation_CBIndex;

   this.defCbClustering = true;
   this.cbClustering = this.defCbClustering;

   this.defCbAutoBeta = true;
   this.cbAutoBeta = this.defCbAutoBeta;

   this.defCbSTF = true;
   this.cbSTF = this.defCbSTF;

   this.defReplace = false;
   this.replace = this.defReplace;

   this.defGaussFlag = true;
   this.gaussFlag = this.defGaussFlag;

   this.defSigmoidFlag = false;
   this.sigmoidFlag = this.defSigmoidFlag;

   this.defMtfFlag = false;
   this.mtfFlag = this.defMtfFlag;

   this.defMmtfFlag = false;
   this.mmtfFlag = this.defMmtfFlag;

   this.defNormalized = false;
   this.normalized = this.defNormalized;

   this.defMaskFlag = false;
   this.maskFlag = this.defMaskFlag;


   this.storeSettings = function() {
      Settings.write(
         TITLE + "." + VERSION + "_autoBeta" ,
         DataType_Real32,
         this.autoBeta
      );

      Settings.write(
         TITLE + "." + VERSION + "_clustering" ,
         DataType_Real32,
         this.clustering
      );

      Settings.write(
         TITLE + "." + VERSION + "_beta" ,
         DataType_Real32,
         this.beta
      );

      Settings.write(
         TITLE + "." + VERSION + "_lowerLimit" ,
         DataType_Real32,
         this.lowerLimit
      );

      Settings.write(
         TITLE + "." + VERSION + "_upperLimit" ,
         DataType_Real32,
         this.upperLimit
      );

      Settings.write(
         TITLE + "." + VERSION + "_gamma" ,
         DataType_Real32,
         this.gamma
      );

      Settings.write(
         TITLE + "." + VERSION + "_midtone" ,
         DataType_Real32,
         this.midtone
      );

      Settings.write(
         TITLE + "." + VERSION + "_sigma" ,
         DataType_Real32,
         this.sigma
      );

      Settings.write(
         TITLE + "." + VERSION + "_mmtf" ,
         DataType_Real32,
         this.mmtf
      );

      Settings.write(
         TITLE + "." + VERSION + "_medianSTF" ,
         DataType_Real32,
         this.medianSTF
      );

      Settings.write(
         TITLE + "." + VERSION + "_algorithm_CBIndex" ,
         DataType_Int32,
         this.algorithm_CBIndex
      );

      Settings.write(
         TITLE + "." + VERSION + "_segmentation_CBIndex" ,
         DataType_Int32,
         this.segmentation_CBIndex
      );

      Settings.write(
         TITLE + "." + VERSION + "_cbAutoBeta" ,
         DataType_Boolean,
         this.cbAutoBeta
      );

      Settings.write(
         TITLE + "." + VERSION + "_cbClustering" ,
         DataType_Boolean,
         this.cbClustering
      );

      Settings.write(
         TITLE + "." + VERSION + "_cbSTF" ,
         DataType_Boolean,
         this.cbSTF
      );

      Settings.write(
         TITLE + "." + VERSION + "_replace" ,
         DataType_Boolean,
         this.replace
      );

      Settings.write(
         TITLE + "." + VERSION + "_gaussFlag" ,
         DataType_Boolean,
         this.gaussFlag
      );

      Settings.write(
         TITLE + "." + VERSION + "_sigmoidFlag" ,
         DataType_Boolean,
         this.sigmoidFlag
      );

      Settings.write(
         TITLE + "." + VERSION + "_mtfFlag" ,
         DataType_Boolean,
         this.mtfFlag
      );

      Settings.write(
         TITLE + "." + VERSION + "_mmtfFlag" ,
         DataType_Boolean,
         this.mmtfFlag
      );

      Settings.write(
         TITLE + "." + VERSION + "_normalized" ,
         DataType_Boolean,
         this.normalized
      );
   };


   this.loadSettings = function() {
      var value = Settings.read(
         TITLE + "." + VERSION + "_clustering",
         DataType_Real32
      );
      this.clustering = ((value != null) ? value : this.defClustering);

      var value = Settings.read(
         TITLE + "." + VERSION + "_autoBeta",
         DataType_Real32
      );
      this.autoBeta = ((value != null) ? value : this.defAutoBeta);

      var value = Settings.read(
         TITLE + "." + VERSION + "_beta",
         DataType_Real32
      );
      this.beta = ((value != null) ? value : this.defBeta);

      var value = Settings.read(
         TITLE + "." + VERSION + "_lowerLimit",
         DataType_Real32
      );
      this.lowerLimit = ((value != null) ? value : this.defLowerLimit);

      var value = Settings.read(
         TITLE + "." + VERSION + "_upperLimit",
         DataType_Real32
      );
      this.upperLimit = ((value != null) ? value : this.defUpperLimit);

      var value = Settings.read(
         TITLE + "." + VERSION + "_gamma",
         DataType_Real32
      );
      this.gamma = ((value != null) ? value : this.defGamma);

      var value = Settings.read(
         TITLE + "." + VERSION + "_midtone",
         DataType_Real32
      );
      this.midtone = ((value != null) ? value : this.defMidtone);

      var value = Settings.read(
         TITLE + "." + VERSION + "_sigma",
         DataType_Real32
      );
      this.sigma = ((value != null) ? value : this.defSigma);

      var value = Settings.read(
         TITLE + "." + VERSION + "_mmtf",
         DataType_Real32
      );
      this.mmtf = ((value != null) ? value : this.defMmtf);

      var value = Settings.read(
         TITLE + "." + VERSION + "_medianSTF",
         DataType_Real32
      );
      this.medianSTF = ((value != null) ? value : this.defMedianSTF);

      var value = Settings.read(
         TITLE + "." + VERSION + "_algorithm_CBIndex",
         DataType_Int32
      );
      this.algorithm_CBIndex = ((value != null) ? value : this.defAlgorithm_CBIndex);

      var value = Settings.read(
         TITLE + "." + VERSION + "_segmentation_CBIndex",
         DataType_Int32
      );
      this.segmentation_CBIndex = ((value != null) ? value : this.defSegmentation_CBIndex);

      var value = Settings.read(
         TITLE + "." + VERSION + "_cbClustering",
         DataType_Boolean
      );
      this.cbClustering = ((value != null) ? value : this.defCbClustering);

      var value = Settings.read(
         TITLE + "." + VERSION + "_cbAutoBeta",
         DataType_Boolean
      );
      this.cbAutoBeta = ((value != null) ? value : this.defCbAutoBeta);

      var value = Settings.read(
         TITLE + "." + VERSION + "_cbSTF",
         DataType_Boolean
      );
      this.cbSTF = ((value != null) ? value : this.defCbSTF);

      var value = Settings.read(
         TITLE + "." + VERSION + "_replace",
         DataType_Boolean
      );
      this.replace = ((value != null) ? value : this.defReplace);

      var value = Settings.read(
         TITLE + "." + VERSION + "_gaussFlag",
         DataType_Boolean
      );
      this.gaussFlag = ((value != null) ? value : this.defGaussFlag);

      var value = Settings.read(
         TITLE + "." + VERSION + "_sigmoidFlag",
         DataType_Boolean
      );
      this.sigmoidFlag = ((value != null) ? value : this.defSigmoidFlag);

      var value = Settings.read(
         TITLE + "." + VERSION + "_mtfFlag",
         DataType_Boolean
      );
      this.mtfFlag = ((value != null) ? value : this.defMtfFlag);

      var value = Settings.read(
         TITLE + "." + VERSION + "_mmtfFlag",
         DataType_Boolean
      );
      this.mmtfFlag = ((value != null) ? value : this.defMmtfFlag);

      var value = Settings.read(
         TITLE + "." + VERSION + "_normalized",
         DataType_Boolean
      );
      this.normalized = ((value != null) ? value : this.defNormalized);
   };
}

var parameters = new parametersPrototype();


//------------------------------------------------------------------

function disable() {
   parameters.dialog.viewList1.enabled = false;
   parameters.dialog.viewList1_Label.enabled = false;
   parameters.dialog.viewList2.enabled = false;
   parameters.dialog.viewList2_Label.enabled = false;
   parameters.dialog.clustering_NC.enabled = false;
   parameters.dialog.autoBeta_NC.enabled = false;
   parameters.dialog.beta_NC.enabled = false;
   parameters.dialog.lowerLimit_NC.enabled = false;
   parameters.dialog.upperLimit_NC.enabled = false;
   parameters.dialog.normalized_CheckBox.enabled = false;
   parameters.dialog.midtone_NC.enabled = false;
   parameters.dialog.gamma_NC.enabled = false;
   parameters.dialog.sigma_NC.enabled = false;
   parameters.dialog.mmtf_NC.enabled = false;
   parameters.dialog.medianSTF_NC.enabled = false;
   parameters.dialog.algorithm_CB.enabled = false;
   parameters.dialog.algorithm_Label.enabled = false;
   parameters.dialog.segmentation_CB.enabled = false;
   parameters.dialog.segmentation_Label.enabled = false;
   parameters.dialog.cbClustering_CheckBox.enabled = false;
   parameters.dialog.cbClustering_Label.enabled = false;
   parameters.dialog.cbAutoBeta_CheckBox.enabled = false;
   parameters.dialog.cbAutoBeta_Label.enabled = false;
   parameters.dialog.cbSTF_CheckBox.enabled = false;
   parameters.dialog.cbSTF_Label.enabled = false;
   parameters.dialog.replace_CheckBox.enabled = false;
   parameters.dialog.replace_Label.enabled = false;
   parameters.dialog.resetButton.enabled = false;
   parameters.dialog.documentationButton.enabled = false;
   parameters.dialog.okButton.enabled = false;
   parameters.dialog.cancelButton.enabled = false;
   parameters.dialog.adjustToContents();
}


//------------------------------------------------------------------

function enable() {
   parameters.dialog.viewList1.enabled = true;
   parameters.dialog.viewList1_Label.enabled = true;
   parameters.dialog.viewList2.enabled = true;
   parameters.dialog.viewList2_Label.enabled = true;
   parameters.dialog.clustering_NC.enabled = parameters.cbClustering;
   parameters.dialog.autoBeta_NC.enabled = parameters.cbAutoBeta;
   parameters.dialog.beta_NC.enabled = !(parameters.cbAutoBeta);
   parameters.dialog.lowerLimit_NC.enabled = !(parameters.mmtfFlag);
   parameters.dialog.upperLimit_NC.enabled = !(parameters.mmtfFlag);
   parameters.dialog.normalized_CheckBox.enabled = parameters.sigmoidFlag || parameters.gaussFlag;
   parameters.dialog.midtone_NC.enabled = parameters.sigmoidFlag || parameters.mtfFlag;
   parameters.dialog.gamma_NC.enabled = parameters.sigmoidFlag;
   parameters.dialog.sigma_NC.enabled = parameters.gaussFlag;
   parameters.dialog.mmtf_NC.enabled = parameters.mmtfFlag;
   parameters.dialog.medianSTF_NC.enabled = parameters.cbSTF;
   parameters.dialog.algorithm_CB.enabled = true;
   parameters.dialog.algorithm_Label.enabled = true;
   parameters.dialog.segmentation_CB.enabled = true;
   parameters.dialog.segmentation_Label.enabled = true;
   parameters.dialog.cbClustering_CheckBox.enabled = true;
   parameters.dialog.cbClustering_Label.enabled = true;
   parameters.dialog.cbAutoBeta_CheckBox.enabled = true;
   parameters.dialog.cbAutoBeta_Label.enabled = true;
   parameters.dialog.cbSTF_CheckBox.enabled = true;
   parameters.dialog.cbSTF_Label.enabled = true;
   parameters.dialog.replace_CheckBox.enabled = true;
   parameters.dialog.replace_Label.enabled = true;
   parameters.dialog.resetButton.enabled = true;
   parameters.dialog.documentationButton.enabled = true;
   parameters.dialog.okButton.enabled =
      parameters.targetView != null;
   parameters.dialog.cancelButton.enabled = true;
}


//------------------------------------------------------------------

function globalReset() {
   parameters.clustering = parameters.defClustering;
   parameters.autoBeta = parameters.defAutoBeta;
   parameters.beta = parameters.defBeta;
   parameters.lowerLimit = parameters.defLowerLimit;
   parameters.upperLimit = parameters.defUpperLimit;
   parameters.normalized = parameters.defNormalized;
   parameters.midtone = parameters.defMidtone;
   parameters.gamma = parameters.defGamma;
   parameters.sigma = parameters.defSigma;
   parameters.mmtf = parameters.defMmtf;
   parameters.medianSTF = parameters.defMedianSTF;
   parameters.algorithm_CBIndex = parameters.defAlgorithm_CBIndex;
   parameters.segmentation_CBIndex = parameters.defSegmentation_CBIndex;
   parameters.cbClustering = parameters.defCbClustering;
   parameters.cbAutoBeta = parameters.defCbAutoBeta;
   parameters.cbSTF = parameters.defCbSTF;
   parameters.replace = parameters.defReplace;
   parameters.gaussFlag = parameters.defGaussFlag;
   parameters.sigmoidFlag = parameters.defSigmoidFlag;
   parameters.mmtfFlag = parameters.defMmtfFlag;
   parameters.maskFlag = parameters.defMaskFlag;

   parameters.storeSettings();
   parameters.dialog.cancel();
   main();
}


//------------------------------------------------------------------

function uniqueViewIdNoLeadingZero(baseId) {
   var id = baseId;
   for (var i = 1; !View.viewById(id).isNull; ++i) {
      id = baseId + format("%d", i);
   }
   return id;
}


//------------------------------------------------------------------

function lc(image) {
   var segments = parameters.segmentation_CBIndex + 5;
   var segmentSizeX = Math.round(image.width / segments - 0.5);
   var segmentSizeY = Math.round(image.height / segments - 0.5);

   var contrast = new Array();

   for (var i = 1; i <= segments; ++i){
      for (var j = 1;  j <= segments; ++j){

         var startX = (i - 1) * segmentSizeX;
         var endX = i * segmentSizeX
         if (i == segments) {
            endX = image.width - 1;
         }

         var startY = (j - 1) * segmentSizeY;
         var endY = j * segmentSizeY;
         if (j == segments) {
            endY = image.height - 1;
         }

         var seg = new Rect(startX, startY, endX, endY)
         var gMin = image.minimum(seg);
         var gMax = image.maximum(seg);

         contrast[i - 1 + segments * (j - 1)] = (gMax - gMin) / (gMax + gMin);
      }
   }

   contrast.sort();

   var med = Math.round(contrast.length / 2) - 1;
   var c = contrast[med];

   return c;
}


//------------------------------------------------------------------

function snr(image) {
   var noise, n = 4, m = 0.01 * image.selectedRect.area;

   for ( ;; ) {
      noise = image.noiseMRS(n);
      if ( noise[1] >= m ) {
         break;
      }
      if ( --n == 1 ) {
         noise = image.noiseKSigma();
         break;
      }
   }

   var noiseSigma = noise[0];
   var snr = image.avgDev() / Math.pow(noiseSigma, 2);
   var db = 10 * Math.log10(snr);

   return db;
}


//------------------------------------------------------------------

function imageQuality(iqImage, iqImageId) {
   var LC = lc(iqImage);
   var SNR = snr(iqImage);

   console.writeln();
   console.writeln("<b>Image Quality</b>: Processing View: " + iqImageId);
   console.writeln("Local Contrast: " + format("%5.2f", LC * 100) + "% | SNR: " + format("%3.2f", SNR) + "db");
}


//------------------------------------------------------------------

function FHH(sample, mask, gmin, gmax, gmed, gmedmed) {
   sample = Math.max(gmin, Math.min(gmax, sample));

   var c = 1 / (Math.exp(-1) - 1);
   var f = parameters.autoBeta / 1.414;


// *** Linar Membership Function ***

   if (parameters.algorithm_CBIndex == 0) {
      if (parameters.cbAutoBeta == true) {
         var beta = 1.5 - 0.75 * (gmed - gmin) / (gmax - gmin);
         beta = f * beta;
      }
      else {
         var beta = parameters.beta;
      }

      var fuzzy = c * (Math.exp(-Math.pow((sample - gmin) / (gmax - gmin), beta)) - 1);
   }


// *** MTF Membership Function ***

   if (parameters.algorithm_CBIndex == 1) {
      if (parameters.cbAutoBeta == true) {
         var beta = 1.5 - 0.75 * (gmed - gmin) / (gmax - gmin);
         beta = f * beta;
      }
      else {
         var beta = parameters.beta;
      }

      var fuzzy = c * (Math.exp(-Math.pow((parameters.midtone - 1) * (sample - gmin) / (gmax - gmin) / ((2 * parameters.midtone - 1) * (sample - gmin) / (gmax - gmin) - parameters.midtone), beta)) - 1);
   }


// *** Sigmoid Membership Function ***

   else if ((parameters.algorithm_CBIndex == 2) && (parameters.normalized == false)) {
      if (parameters.cbAutoBeta == true) {
         var beta = 1.5 - 0.75 * (1 / (1 + Math.exp(parameters.gamma * (-(gmed - gmin) / (gmax - gmin) + parameters.midtone))));
         beta = f * beta;
      }
      else {
         var beta = parameters.beta;
      }

      var fuzzy = c * (Math.exp(-Math.pow(1 / (1 + Math.exp(parameters.gamma * (-(sample - gmin) / (gmax - gmin) + parameters.midtone))), beta)) - 1);
   }


// *** Noramlized Sigmoid Membership Function ***

   else if ((parameters.algorithm_CBIndex == 2) && (parameters.normalized == true)) {
      var sig0 = -(1 / (1 + Math.exp(parameters.gamma * (-(0 - gmin) / (gmax - gmin) + parameters.midtone))));
      var sig1 = 1 - 1 / (1 + Math.exp(parameters.gamma * (-(1 - gmin) / (gmax - gmin) + parameters.midtone)));

      var w = (sig1 * parameters.midtone - sig0 * (1 - parameters.midtone)) / (Math.pow(parameters.midtone, 2) * (1 - parameters.midtone) + parameters.midtone * Math.pow(1 - parameters.midtone, 2));
      var v = (w * Math.pow(parameters.midtone, 2) - sig0) / parameters.midtone;

      var sigNorm = v * (sample - parameters.midtone) + w * Math.pow(sample - parameters.midtone, 2);

      if (parameters.cbAutoBeta == true) {
         var beta = 1.5 - 0.75 * (1 / (1 + Math.exp(parameters.gamma * (-(gmed - gmin) / (gmax - gmin) + parameters.midtone))) + sigNorm);
         beta = f * beta;
      }
      else {
         var beta = parameters.beta;
      }

      var fuzzy = c * (Math.exp(-Math.pow(1 / (1 + Math.exp(parameters.gamma * (-(sample - gmin) / (gmax - gmin) + parameters.midtone))) + sigNorm, beta)) - 1);
   }


 // *** Gaussian Membership Function ***

   else if ((parameters.algorithm_CBIndex == 3) && (parameters.normalized == false)) {
      if (parameters.cbAutoBeta == true) {
         var beta = 1.5 - 0.75 * Math.exp(-0.5 * Math.pow((gmed - gmax) / parameters.sigma / (gmax - gmin), 2));
         beta = f * beta;
      }
      else {
         var beta = parameters.beta;
      }

      var fuzzy = c * (Math.exp(-Math.pow(Math.exp(-0.5 * Math.pow((sample - gmax) / parameters.sigma / (gmax - gmin), 2)), beta)) - 1);
   }


// *** Normalized Gaussian Membership Function ***

   else if ((parameters.algorithm_CBIndex == 3) && (parameters.normalized == true)) {
      var y0 = Math.exp(-Math.pow(Math.exp(-0.5 / Math.pow(parameters.sigma, 2)), parameters.beta)) - 1;
      var c0 = 1 / (Math.exp(-1) - 1 - y0);

      if (parameters.cbAutoBeta == true) {
         var beta = 1.5 - 0.75 * Math.exp(-0.5 * Math.pow((gmed - gmax) / parameters.sigma / (gmax - gmin), 2));
         beta = f * beta;
      }
      else {
         var beta = parameters.beta;
      }

      var fuzzy = c0 * (Math.exp(-Math.pow(Math.exp(-0.5 * Math.pow((sample - gmax) / parameters.sigma / (gmax - gmin), 2)), beta)) - 1 - y0);
   }


// *** MMTF Membership Function ***

   else {
      gmed = Math.min(20 * gmedmed, Math.max(0.0001, gmed));

      var M = (3 * gmedmed - 1) / (6 * gmedmed - 4);
      var m = Math.mtf(M, gmed);
      var mm = 0.52036 * Math.pow(3 * gmedmed, 0.18794);

      mm = mm * parameters.mmtf;

      var ss = Math.mtf(m, sample);

      var s0 = sample;
      var s1 = Math.mtf(mm, s0) * (1 - s0) + (s0 * s0);
      var s2 = Math.mtf(mm, s1) * (1 - s1) + (s1 * s1);
      var s3 = Math.mtf(mm, s2) * (1 - s2) + (s2 * s2);
      var s4 = Math.mtf(mm, s3) * (1 - s3) + (s3 * s3);

      var s = Math.min(ss, s4);

      if (parameters.cbAutoBeta == true) {
         var beta = 1.5 - 0.75 * (gmed - gmin) / (gmax - gmin);
         beta = f * beta;
      }
      else {
         var beta = parameters.beta;
      }

      var fuzzy = c * (Math.exp(-Math.pow(s, beta)) - 1);
   }

   fuzzy = Math.max(0, Math.min(1, fuzzy));

   return fuzzy;
}


//------------------------------------------------------------------

function generateFuzzyImageWindow(targetImage, maskImage, id) {
   var fuzzyImageWindow = new ImageWindow(
      targetImage.width,
      targetImage.height,
      targetImage.numberOfChannels,
      32,
      true,
      targetImage.colorSpace != ColorSpace_Gray,
      uniqueViewIdNoLeadingZero(id)
   );

   var cloneImageWindow = new ImageWindow(
      targetImage.width,
      targetImage.height,
      targetImage.numberOfChannels,
      32,
      true,
      targetImage.colorSpace != ColorSpace_Gray,
      uniqueViewIdNoLeadingZero("clone")
   );

   cloneImageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);
   cloneImageWindow.mainView.image.apply(targetImage);
   cloneImageWindow.mainView.endProcess();

   var cloneImage = cloneImageWindow.mainView.image;


// *** Shadow Clipping (only for MMTF) ***

   if (parameters.mmtfFlag) {
      var clip = cloneImage.minimum();

      var P = new HistogramTransformation;
      P.H = [ // c0, m, c1, r0, r1
         [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000],
         [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000],
         [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000],
         [clip, 0.50000000, 1.00000000, 0.00000000, 1.00000000],
         [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000]
      ];

      P.executeOn(cloneImageWindow.mainView);
   }


// *** Console Output ***

   console.writeln();
   console.writeln("<b>FuzzyContrastEnhance</b>: Processing View: " + fuzzyImageWindow.mainView.id);
   if (parameters.normalized && (parameters.sigmoidFlag || parameters.gaussFlag)) {
      var normalized = "Normalized ";
   }
   else {
      var normalized = "";
   }
   console.writeln("Fuzzy membership function: " + normalized + parameters.algorithmLabels[parameters.algorithm_CBIndex]);
   console.writeln("Image segmentation: " + parameters.segmentationLabels[parameters.segmentation_CBIndex]);
   if (parameters.cbClustering == true) {
      console.writeln("Clustering threshold: "+ format("%4.2f", parameters.clustering));
   }
   if (parameters.cbAutoBeta == true) {
      console.writeln("Automatic FHH beta strength: "+ format("%4.2f", parameters.autoBeta));
   }
   else {
      console.writeln("Constant FHH beta: "+ format("%4.2f", parameters.beta));
   }
   if (parameters.mmtfFlag == false) {
      console.writeln("FHH lower bound: "+ format("%4.2f", parameters.lowerLimit));
      console.writeln("FHH upper bound: "+ format("%4.2f", parameters.upperLimit));
   }
   if (parameters.mtfFlag == true) {
      console.writeln("MTF midtone: " + format("%4.2f", parameters.midtone));
   }
   if (parameters.sigmoidFlag == true) {
      console.writeln("Sigmoid gamma: " + format("%4.2f", parameters.gamma));
      console.writeln("Sigmoid midtone: " + format("%4.2f", parameters.midtone));
   }
   if (parameters.gaussFlag == true) {
      console.writeln("Gauss sigma: "+ format("%4.2f", parameters.sigma));
   }
   if (parameters.mmtfFlag == true) {
      console.writeln("Masked MTF strength: "+ format("%4.2f", parameters.mmtf));
   }
   console.flush();


// *** Segmentation ***

   var segments = parameters.segmentation_CBIndex + 5;
   var segmentSizeX = Math.round(cloneImage.width / segments - 0.5);
   var segmentSizeY = Math.round(cloneImage.height / segments - 0.5);

   var gMin = new Array();
   var gMax = new Array();
   var gMed = new Array();
   var gMean = new Array();

   var gMinBitmap = new Bitmap(segments, segments);
   var gMaxBitmap = new Bitmap(segments, segments);
   var gMedBitmap = new Bitmap(segments, segments);
   var gMeanBitmap = new Bitmap(segments, segments);

   for (var i = 1; i <= segments; ++i){
      for (var j = 1;  j <= segments; ++j){

         var startX = (i - 1) * segmentSizeX;
         var endX = i * segmentSizeX
         if (i == segments) {
            endX = cloneImage.width - 1;
         }

         var startY = (j - 1) * segmentSizeY;
         var endY = j * segmentSizeY;
         if (j == segments) {
            endY = cloneImage.height - 1;
         }

         var seg = new Rect(startX, startY, endX, endY)

         if (parameters.cbClustering == true) {
            gMinBitmap.setPixel(i - 1, j - 1, Math.round(cloneImage.minimum(seg) * 10000));
            gMaxBitmap.setPixel(i - 1, j - 1, Math.round(cloneImage.maximum(seg) * 10000));
            gMedBitmap.setPixel(i - 1, j - 1, Math.round(cloneImage.median(seg) * 10000));
            gMeanBitmap.setPixel(i - 1, j - 1, Math.round(cloneImage.mean(seg) * 10000));

         }
         else {
            if (parameters.mmtfFlag == true) {
               gMin[i - 1 + segments * (j - 1)] = cloneImage.minimum(seg);
               gMax[i - 1 + segments * (j - 1)] = cloneImage.maximum(seg);
            }
            else {
               gMin[i - 1 + segments * (j - 1)] = Math.min(parameters.lowerLimit, cloneImage.minimum(seg));
               gMax[i - 1 + segments * (j - 1)] = Math.max(parameters.upperLimit, cloneImage.maximum(seg));
            }
            gMed[i - 1 + segments * (j - 1)] = cloneImage.median(seg);
            gMean[i - 1 + segments * (j - 1)] = cloneImage.mean(seg);
         }
      }
   }


// *** Clustering ***

   if (parameters.cbClustering == true) {
      var ggMinBitmap = new Bitmap(segments, segments);
      var ggMaxBitmap = new Bitmap(segments, segments);
      var ggMedBitmap = new Bitmap(segments, segments);
      var ggMeanBitmap = new Bitmap(segments, segments);

      for(var count = 0; count < 100; ++count){
         for (var i = 1; i <= segments; ++i){
            for (var j = 1;  j <= segments; ++j){
               var sumMin = 0;
               var sumMax = 0;
               var sumMed = 0;
               var sumMean = 0;
               var num = 0;

               for (var k = -1; k <= 1; ++k){
                  for (var l = -1; l <= 1; ++l){
                     if(i - 1 + k >= 0 && i - 1 + k < segments && j - 1 + l >= 0 && j - 1 + l < segments) {
                        if (Math.abs(gMedBitmap.pixel(i - 1 + k, j - 1 + l) - gMedBitmap.pixel(i - 1, j - 1)) <= parameters.clustering * gMedBitmap.pixel(i - 1, j - 1)) {
                           sumMin = sumMin + gMinBitmap.pixel(i - 1 + k, j - 1 + l);
                           sumMax = sumMax + gMaxBitmap.pixel(i - 1 + k, j - 1 + l);
                           sumMed = sumMed + gMedBitmap.pixel(i - 1 + k, j - 1 + l);
                           sumMean = sumMean + gMeanBitmap.pixel(i - 1 + k, j - 1 + l);
                           num = num + 1;
                        }
                     }
                  }
               }
               ggMinBitmap.setPixel(i - 1, j - 1, Math.round(sumMin / num));
               ggMaxBitmap.setPixel(i - 1, j - 1, Math.round(sumMax / num));
               ggMedBitmap.setPixel(i - 1, j - 1, Math.round(sumMed / num));
               ggMeanBitmap.setPixel(i - 1, j - 1, Math.round(sumMean / num));
            }
         }
         gMinBitmap = ggMinBitmap;
         gMaxBitmap = ggMaxBitmap;
         gMedBitmap = ggMedBitmap;
         gMeanBitmap = ggMeanBitmap;
      }

      for (var i = 1; i <= segments; ++i){
         for (var j = 1;  j <= segments; ++j){
            if (parameters.mmtfFlag == true) {
               gMin[i - 1 + segments * (j - 1)] = gMinBitmap.pixel(i - 1, j - 1) / 10000;
               gMax[i - 1 + segments * (j - 1)] = gMaxBitmap.pixel(i - 1, j - 1) / 10000;
            }
            else {
               gMin[i - 1 + segments * (j - 1)] = Math.min(parameters.lowerLimit, gMinBitmap.pixel(i - 1, j - 1) / 10000);
               gMax[i - 1 + segments * (j - 1)] = Math.max(parameters.upperLimit, gMaxBitmap.pixel(i - 1, j - 1) / 10000);
            }
            gMed[i - 1 + segments * (j - 1)] = gMedBitmap.pixel(i - 1, j - 1) / 10000;
            gMean[i - 1 + segments * (j - 1)] = gMeanBitmap.pixel(i - 1, j - 1) / 10000;

            gMedBitmap.setPixel(i - 1, j - 1,  255*256*256*256 + Math.round(gMedBitmap.pixel(i - 1, j - 1) / 100 * 255) * (1 + 256 + 256*256));
         }
      }
/*
      var gMedImageWindow = new ImageWindow(
         segments,
         segments,
         cloneImage.numberOfChannels,
         32,
         true,
         cloneImage.colorSpace != ColorSpace_Gray,
         uniqueViewIdNoLeadingZero("Clusters")
      );

      gMedImageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);

      gMedImageWindow.mainView.image.selectedPoint = new Point(0, 0);
      gMedImageWindow.mainView.image.blend(gMedBitmap);
      gMedImageWindow.mainView.image.resetSelections();

      gMedImageWindow.mainView.endProcess();
      gMedImageWindow.show();
*/
   }

   var gMedSort = new Array();

   for (var i = 1; i <= segments; ++i){
      for (var j = 1;  j <= segments; ++j){
         gMedSort[i - 1 + segments * (j - 1)] = gMed[i - 1 + segments * (j - 1)];
      }
   }

   gMedSort.sort();

   var med = Math.round(gMedSort.length / 2) - 1;
   var gMedMed = gMedSort[med];


// *** FHH & Interpolation of Segments ***

   var overlayBitmap = new Bitmap(cloneImage.width, cloneImage.height);
   overlayBitmap.fill(0);

   for (var ix = 0; ix != Math.round(segmentSizeX / 2 - 0.5); ++ix) {
      var segmentXi = Math.round(Math.max(0, ix - Math.round(segmentSizeX / 2 - 0.5)) / segmentSizeX - 0.5);
      for (var iy = 0; iy != Math.round(segmentSizeY / 2 - 0.5); ++iy) {
         var fuzzy = FHH(cloneImage.sample(ix, iy), maskImage.sample(ix, iy), gMin[0], gMax[0], gMed[0], gMedMed);
         fuzzy = (1 - maskImage.sample(ix, iy)) * fuzzy + maskImage.sample(ix, iy) * cloneImage.sample(ix, iy);
         overlayBitmap.setPixel(ix, iy, 255*256*256*256 + Math.round(fuzzy * 255) * (1 + 256 + 256*256));
      }
      for (var iy = Math.round(segmentSizeY / 2 - 0.5); iy != Math.round(segmentSizeY / 2 - 0.5) + (segments - 1) * segmentSizeY; ++iy) {
         var segmentYi = Math.round(Math.max(0, iy - Math.round(segmentSizeY / 2 - 0.5)) / segmentSizeY - 0.5);
         var fuzzy1 = FHH(cloneImage.sample(ix, iy), maskImage.sample(ix, iy), gMin[segmentXi + segments * segmentYi], gMax[segmentXi + segments * segmentYi], gMed[segmentXi + segments * segmentYi], gMedMed);
         var fuzzy2 = FHH(cloneImage.sample(ix, iy), maskImage.sample(ix, iy), gMin[segmentXi + segments * (segmentYi + 1)], gMax[segmentXi + segments * (segmentYi + 1)], gMed[segmentXi + segments * (segmentYi + 1)], gMedMed);
         var v = (iy - Math.round(segmentSizeY / 2 - 0.5)) / segmentSizeY - segmentYi;
         var fuzzy = (1 - v) * fuzzy1 + v * fuzzy2;
         fuzzy = (1 - maskImage.sample(ix, iy)) * fuzzy + maskImage.sample(ix, iy) * cloneImage.sample(ix, iy);
         overlayBitmap.setPixel(ix, iy, 255*256*256*256 + Math.round(fuzzy * 255) * (1 + 256 + 256*256));
      }
      for (var iy = Math.round(segmentSizeY / 2 - 0.5) + (segments - 1) * segmentSizeY; iy != cloneImage.height; ++iy) {
         var fuzzy = FHH(cloneImage.sample(ix, iy), maskImage.sample(ix, iy), gMin[segments * (segments - 1)], gMax[segments * (segments - 1)], gMed[segments * (segments - 1)], gMedMed);
         fuzzy = (1 - maskImage.sample(ix, iy)) * fuzzy + maskImage.sample(ix, iy) * cloneImage.sample(ix, iy);
         overlayBitmap.setPixel(ix, iy, 255*256*256*256 + Math.round(fuzzy * 255) * (1 + 256 + 256*256));
      }
   }

   for (var ix = Math.round(segmentSizeX / 2 - 0.5); ix != Math.round(segmentSizeX / 2 - 0.5) + (segments - 1) * segmentSizeX; ++ix) {
      var segmentXi = Math.round(Math.max(0, ix - Math.round(segmentSizeX / 2 - 0.5)) / segmentSizeX - 0.5);
      for (var iy = 0; iy != Math.round(segmentSizeY / 2 - 0.5); ++iy) {
         var segmentYi = Math.round(Math.max(0, iy - Math.round(segmentSizeY / 2 - 0.5)) / segmentSizeY - 0.5);
         var fuzzy1 = FHH(cloneImage.sample(ix, iy), maskImage.sample(ix, iy), gMin[segmentXi + segments * segmentYi], gMax[segmentXi + segments * segmentYi], gMed[segmentXi + segments * segmentYi], gMedMed);
         var fuzzy2 = FHH(cloneImage.sample(ix, iy), maskImage.sample(ix, iy), gMin[segmentXi + 1 + segments * segmentYi], gMax[segmentXi + 1 + segments * segmentYi], gMed[segmentXi + 1 + segments * segmentYi], gMedMed);
         var w = (ix - Math.round(segmentSizeX / 2 - 0.5)) / segmentSizeX - segmentXi;
         var fuzzy = (1 - w) * fuzzy1 + w * fuzzy2;
         fuzzy = (1 - maskImage.sample(ix, iy)) * fuzzy + maskImage.sample(ix, iy) * cloneImage.sample(ix, iy);
         overlayBitmap.setPixel(ix, iy, 255*256*256*256 + Math.round(fuzzy * 255) * (1 + 256 + 256*256));
      }
      for (var iy = Math.round(segmentSizeY / 2 - 0.5); iy != Math.round(segmentSizeY / 2 - 0.5) + (segments - 1) * segmentSizeY; ++iy) {
         var segmentYi = Math.round(Math.max(0, iy - Math.round(segmentSizeY / 2 - 0.5)) / segmentSizeY - 0.5);
         var fuzzy1 = FHH(cloneImage.sample(ix, iy), maskImage.sample(ix, iy), gMin[segmentXi + segments * segmentYi], gMax[segmentXi + segments * segmentYi], gMed[segmentXi + segments * segmentYi], gMedMed);
         var fuzzy2 = FHH(cloneImage.sample(ix, iy), maskImage.sample(ix, iy), gMin[segmentXi + segments * (segmentYi + 1)], gMax[segmentXi + segments * (segmentYi + 1)], gMed[segmentXi + segments * (segmentYi + 1)], gMedMed);
         var fuzzy3 = FHH(cloneImage.sample(ix, iy), maskImage.sample(ix, iy), gMin[segmentXi + 1 + segments * segmentYi], gMax[segmentXi + 1 + segments * segmentYi], gMed[segmentXi + 1 + segments * segmentYi], gMedMed);
         var fuzzy4 = FHH(cloneImage.sample(ix, iy), maskImage.sample(ix, iy), gMin[segmentXi + 1 + segments * (segmentYi + 1)], gMax[segmentXi + 1 + segments * (segmentYi + 1)], gMed[segmentXi + 1 + segments * (segmentYi + 1)], gMedMed);
         var v = (iy - Math.round(segmentSizeY / 2 - 0.5)) / segmentSizeY - segmentYi;
         var fuzzy12 = (1 - v) * fuzzy1 + v * fuzzy2;
         var fuzzy34 = (1 - v) * fuzzy3 + v * fuzzy4;
         var w = (ix - Math.round(segmentSizeX / 2 - 0.5)) / segmentSizeX - segmentXi;
         var fuzzy = (1 - w) * fuzzy12 + w * fuzzy34;
         fuzzy = (1 - maskImage.sample(ix, iy)) * fuzzy + maskImage.sample(ix, iy) * cloneImage.sample(ix, iy);
         overlayBitmap.setPixel(ix, iy, 255*256*256*256 + Math.round(fuzzy * 255) * (1 + 256 + 256*256));
      }
      for (var iy = Math.round(segmentSizeY / 2 - 0.5) + (segments - 1) * segmentSizeY; iy != cloneImage.height; ++iy) {
         var segmentYi = Math.round(Math.max(0, iy - Math.round(segmentSizeY / 2 - 0.5)) / segmentSizeY - 0.5);
         var fuzzy1 = FHH(cloneImage.sample(ix, iy), maskImage.sample(ix, iy), gMin[segmentXi + segments * segmentYi], gMax[segmentXi + segments * segmentYi], gMed[segmentXi + segments * segmentYi], gMedMed);
         var fuzzy2 = FHH(cloneImage.sample(ix, iy), maskImage.sample(ix, iy), gMin[segmentXi + 1 + segments * segmentYi], gMax[segmentXi + 1 + segments * segmentYi], gMed[segmentXi + 1 + segments * segmentYi], gMedMed);
         var w = (ix - Math.round(segmentSizeX / 2 - 0.5)) / segmentSizeX - segmentXi;
         var fuzzy = (1 - w) * fuzzy1 + w * fuzzy2;
         fuzzy = (1 - maskImage.sample(ix, iy)) * fuzzy + maskImage.sample(ix, iy) * cloneImage.sample(ix, iy);
         overlayBitmap.setPixel(ix, iy, 255*256*256*256 + Math.round(fuzzy * 255) * (1 + 256 + 256*256));
      }
   }

   for (var ix = Math.round(segmentSizeX / 2 - 0.5) + (segments - 1) * segmentSizeX; ix != cloneImage.width; ++ix) {
      var segmentXi = Math.round(Math.max(0, ix - Math.round(segmentSizeX / 2 - 0.5)) / segmentSizeX - 0.5);
      for (var iy = 0; iy != Math.round(segmentSizeY / 2 - 0.5); ++iy) {
         var fuzzy = FHH(cloneImage.sample(ix, iy), maskImage.sample(ix, iy), gMin[segments -1], gMax[segments - 1], gMed[segments - 1], gMedMed);
         fuzzy = (1 - maskImage.sample(ix, iy)) * fuzzy + maskImage.sample(ix, iy) * cloneImage.sample(ix, iy);
         overlayBitmap.setPixel(ix, iy, 255*256*256*256 + Math.round(fuzzy * 255) * (1 + 256 + 256*256));
      }
      for (var iy = Math.round(segmentSizeY / 2 - 0.5); iy != Math.round(segmentSizeY / 2 - 0.5) + (segments - 1) * segmentSizeY; ++iy) {
         var segmentYi = Math.round(Math.max(0, iy - Math.round(segmentSizeY / 2 - 0.5)) / segmentSizeY - 0.5);
         var fuzzy1 = FHH(cloneImage.sample(ix, iy), maskImage.sample(ix, iy), gMin[segmentXi + segments * segmentYi], gMax[segmentXi + segments * segmentYi], gMed[segmentXi + segments * segmentYi], gMedMed);
         var fuzzy2 = FHH(cloneImage.sample(ix, iy), maskImage.sample(ix, iy), gMin[segmentXi + segments * (segmentYi + 1)], gMax[segmentXi + segments * (segmentYi + 1)], gMed[segmentXi + segments * (segmentYi + 1)], gMedMed);
         var v = (iy - Math.round(segmentSizeY / 2 - 0.5)) / segmentSizeY - segmentYi;
         var fuzzy = (1 - v) * fuzzy1 + v * fuzzy2;
         fuzzy = (1 - maskImage.sample(ix, iy)) * fuzzy + maskImage.sample(ix, iy) * cloneImage.sample(ix, iy);
         overlayBitmap.setPixel(ix, iy, 255*256*256*256 + Math.round(fuzzy * 255) * (1 + 256 + 256*256));
      }
      for (var iy = Math.round(segmentSizeY / 2 - 0.5) + (segments - 1) * segmentSizeY; iy != cloneImage.height; ++iy) {
         var fuzzy = FHH(cloneImage.sample(ix, iy), maskImage.sample(ix, iy), gMin[segments * segments - 1], gMax[segments * segments - 1], gMed[segments * segments - 1], gMedMed);
         fuzzy = (1 - maskImage.sample(ix, iy)) * fuzzy + maskImage.sample(ix, iy) * cloneImage.sample(ix, iy);
         overlayBitmap.setPixel(ix, iy, 255*256*256*256 + Math.round(fuzzy * 255) * (1 + 256 + 256*256));
      }
   }

   fuzzyImageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);

   fuzzyImageWindow.mainView.image.selectedPoint = new Point(0, 0);
   fuzzyImageWindow.mainView.image.blend(overlayBitmap);
   fuzzyImageWindow.mainView.image.resetSelections();

   fuzzyImageWindow.mainView.endProcess();

   cloneImageWindow.forceClose();

   return fuzzyImageWindow;
}


//------------------------------------------------------------------

function stretchLRGB(targetImageWindow_RGB_L, fuzzyImageWindow_RGB_L) {
   var targetMedian = targetImageWindow_RGB_L.mainView.image.median();

   var median = fuzzyImageWindow_RGB_L.mainView.image.median();
   var avgDev = fuzzyImageWindow_RGB_L.mainView.image.avgDev();
   var min = fuzzyImageWindow_RGB_L.mainView.image.minimum();

   var c0 = Math.max(0.7 * min , Math.range(median - 2.8 * avgDev, 0.0, 1.0));
   var m = Math.mtf(1.33 * targetMedian, median - c0);

   var P = new HistogramTransformation;
   P.H = [ // c0, m, c1, r0, r1
      [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000],
      [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000],
      [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000],
      [c0, m, 1.00000000, 0.00000000, 1.00000000],
      [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000]
   ];

   P.executeOn(fuzzyImageWindow_RGB_L.mainView);


   var startTime = new Date;

   var fuzzyImageWindow = new ImageWindow(
      parameters.targetView.image.width,
      parameters.targetView.image.height,
      parameters.targetView.image.numberOfChannels,
      32,
      true,
      parameters.targetView.image.colorSpace != ColorSpace_Gray,
      uniqueViewIdNoLeadingZero("LFHH")
   );

   var overlayBitmap = new Bitmap(parameters.targetView.image.width, parameters.targetView.image.height);
   overlayBitmap.fill(0);

   var targetImage_RGB_L = targetImageWindow_RGB_L.mainView.image;
   var fuzzyImage_RGB_L = fuzzyImageWindow_RGB_L.mainView.image;

   console.writeln();
   console.writeln("<b>RGB ContrastEnhancement</b>: Processing View: " + fuzzyImageWindow.mainView.id);
   console.flush();

   for (var i = 0; i < targetImage_RGB_L.width; ++i){
      for (var j = 0;  j < targetImage_RGB_L.height; ++j){
         var f = fuzzyImage_RGB_L.sample(i, j) / targetImage_RGB_L.sample(i, j);

         var red = Math.min(1, f * parameters.targetView.image.sample(i, j, 0));
         var green = Math.min(1, f * parameters.targetView.image.sample(i, j, 1));
         var blue = Math.min(1, f * parameters.targetView.image.sample(i, j, 2));

         overlayBitmap.setPixel(i, j, 255*256*256*256 + Math.round(red * 255) * 256 * 256 + Math.round(green * 255) * 256 + Math.round(blue * 255));
      }
   }

   fuzzyImageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);

   fuzzyImageWindow.mainView.image.selectedPoint = new Point(0, 0);
   fuzzyImageWindow.mainView.image.blend(overlayBitmap);
   fuzzyImageWindow.mainView.image.resetSelections();

   fuzzyImageWindow.mainView.endProcess();

   var endTime = new Date;

   console.writeln(format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime())));

   return fuzzyImageWindow;
}


//------------------------------------------------------------------

function combineLRGB(targetImageWindow_RGB_L, fuzzyImageWindow_RGB_L) {
   var targetMedian = targetImageWindow_RGB_L.mainView.image.median();

   var median = fuzzyImageWindow_RGB_L.mainView.image.median();
   var avgDev = fuzzyImageWindow_RGB_L.mainView.image.avgDev();
   var min = fuzzyImageWindow_RGB_L.mainView.image.minimum();

   var c0 = Math.max(0.7 * min , Math.range(median - 2.8 * avgDev, 0.0, 1.0));
   var m = Math.mtf(1.33 * targetMedian, median - c0);

   var P = new HistogramTransformation;
   P.H = [ // c0, m, c1, r0, r1
      [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000],
      [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000],
      [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000],
      [c0, m, 1.00000000, 0.00000000, 1.00000000],
      [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000]
   ];

   P.executeOn(fuzzyImageWindow_RGB_L.mainView);

   var fuzzyImageWindow = new ImageWindow(
      parameters.targetView.image.width,
      parameters.targetView.image.height,
      parameters.targetView.image.numberOfChannels,
      32,
      true,
      parameters.targetView.image.colorSpace != ColorSpace_Gray,
      uniqueViewIdNoLeadingZero("LFHH")
   );

   fuzzyImageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);
   fuzzyImageWindow.mainView.image.apply(parameters.targetView.image);
   fuzzyImageWindow.mainView.endProcess();

   var P = new LRGBCombination;
   P.channels = [ // enabled, id, k
      [false, "", 1.00000],
      [false, "", 1.00000],
      [false, "", 1.00000],
      [true, "LFHH_fuzzyRGB_L", 1.00000]
   ];
   P.mL = 0.500;
   P.mc = 0.500;
   P.clipHighlights = true;
   P.noiseReduction = true;
   P.layersRemoved = 4;
   P.layersProtected = 2;

   P.executeOn(fuzzyImageWindow.mainView);

   return fuzzyImageWindow;
}


//------------------------------------------------------------------

function writeFITSHeader(fuzzyImageWindow) {
   var param1 = " - ";
   var param2 = " - ";
   var param3 = " - ";
   var param4 = " - ";
   var param5 = " - ";

   if (parameters.maskView == null) {
      var maskName = "none";
   }
   else {
      var maskName = parameters.maskView.id;
   }
   if (parameters.cbClustering == true) {
      var clusterYN ="yes";
      var clusterThreshold = format("%4.2f", parameters.clustering);
   }
   else {
      var clusterYN = "no";
      var clusterThreshold = " - ";
   }
   if (parameters.mmtfFlag == false) {
      var glb = format("%4.2f", parameters.lowerLimit);
      var lub = format("%4.2f", parameters.upperLimit);
   }
   else {
      var glb = " - ";
      var lub = " - ";
   }
   if (parameters.cbAutoBeta == true) {
      var autoBetaYN = "yes";
      var aBeta = format("%4.2f", parameters.autoBeta);
      var cBeta = " - ";
   }
   else {
      var autoBetaYN = "no";
      var aBeta = " - ";
      var cBeta = format("%4.2f", parameters.beta);
   }
   if (parameters.normalized == true) {
      var normalYN = "yes";
   }
   else {
      var normalYN = "no";
   }
   if (parameters.mtfFlag == true) {
      param1 = format("%4.2f", parameters.midtone);
   }
   if (parameters.sigmoidFlag == true) {
      param2 = format("%4.2f", parameters.gamma);
      param3 = format("%4.2f", parameters.midtone);
   }
   if (parameters.gaussFlag == true) {
      param4 = format("%4.2f", parameters.sigma);
   }
   if (parameters.mmtfFlag == true) {
      param5 = format("%4.2f", parameters.mmtf);
   }
   if (parameters.cbSTF == true) {
      var autoHTYN  = "yes";
      var medHT = format("%4.2f", parameters.medianSTF);
   }
   else {
      var autoHTYN  = "no";
      var medHT = " - ";
   }

   var P = new FITSHeader;
   P.keywords = [ // name, value, comment
      ["Script", TITLE, ""],
      ["Version", VERSION, ""],
      ["Target Image", parameters.targetView.id, ""],
      ["Mask", maskName, ""],
      ["Segmentation", parameters.segmentationLabels[parameters.segmentation_CBIndex], ""],
      ["Clustering", clusterYN, ""],
      ["Clustering thres", clusterThreshold, ""],
      ["FHH lower bound", glb, ""],
      ["FHH upper bound", lub, ""],
      ["Local FHH beta", autoBetaYN, ""],
      ["Auto FHH beta", aBeta, ""],
      ["Const FHH beta", cBeta, ""],
      ["Algorithm", parameters.algorithmLabels[parameters.algorithm_CBIndex], ""],
      ["Normalized", normalYN, ""],
      ["MTF midtone", param1, ""],
      ["Sigmoid gamma", param2, ""],
      ["Sigmoid midtone", param3, ""],
      ["Gauss sigma", param4, ""],
      ["MMTF strength", param5, ""],
      ["Automatic HT", autoHTYN, ""],
      ["HT target median", medHT, ""]
   ];

   P.executeOn(fuzzyImageWindow.mainView);
}


//------------------------------------------------------------------

function mainFunction() {
   disable();

   if (parameters.targetView == null) {
      enable();
      return;
   }

   var targetImage = parameters.targetView.image;
   var targetWindow = parameters.targetView.window;

   if (!targetImage.isGrayscale && targetImage.median() < 0.01) {
      enable();
      console.hide();

      (new MessageBox(
         "<p>Error: Signal stregth too low for RGB stretch.</p>",
         TITLE + "." + VERSION,
         StdIcon_Warning,
         StdButton_Ok
      )).execute();
      return;
   }

   if (!targetImage.isGrayscale) {
      var P = new ChannelExtraction;
      P.colorSpace = ChannelExtraction.prototype.CIELab;
      P.channels = [ // enabled, id
         [true, "LFHH_targetRGB_L"],
         [false, ""],
         [false, ""]
      ];
      P.sampleFormat = ChannelExtraction.prototype.SameAsSource;

      P.executeOn(parameters.targetView);

      var targetView_RGB_L = View.viewById("LFHH_targetRGB_L");

      targetView_RGB_L.window.hide();
   }

   if (parameters.maskView == null) {
      parameters.maskFlag = false;

      var maskWindow = new ImageWindow(
         targetImage.width,
         targetImage.height,
         targetImage.numberOfChannels,
         32,
         true,
         targetImage.colorSpace != ColorSpace_Gray,
         uniqueViewIdNoLeadingZero("zero")
      );

      var maskView = maskWindow.mainView;
      var maskImage = maskWindow.mainView.image;
   }
   else {
      parameters.maskFlag = true;

      var maskView = parameters.maskView;
      var maskImage = parameters.maskView.image;
      var maskWindow = parameters.maskView.window;
   }


// *** LFHH ***

   var startTime = new Date;

   if (!targetImage.isGrayscale) {
      var fuzzyImageWindow_RGB_L = generateFuzzyImageWindow(targetView_RGB_L.image, maskImage, "LFHH_fuzzyRGB_L");

      var endTime = new Date;

      console.writeln(format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime())));

      fuzzyImageWindow_RGB_L.hide();

      var fuzzyImageWindow = stretchLRGB(targetView_RGB_L.window, fuzzyImageWindow_RGB_L);

      fuzzyImageWindow_RGB_L.forceClose();
      targetView_RGB_L.window.forceClose();
   }
   else {
      var fuzzyImageWindow = generateFuzzyImageWindow(targetImage, maskImage, "LFHH");

      var endTime = new Date;

      console.writeln(format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime())));
   }

   if (!parameters.maskFlag) {
      maskWindow.forceClose();
   }

   writeFITSHeader(fuzzyImageWindow);


// *** Auto STF-HT ***

   if (parameters.cbSTF == true) {
      if (parameters.maskFlag) {
         fuzzyImageWindow.mask = maskWindow;
         fuzzyImageWindow.maskVisible = false;
         fuzzyImageWindow.maskInverted = true;
      }

      var n = fuzzyImageWindow.mainView.image.isColor ? 3 : 1;

      var c0 = 1.0;
      var m = 0.5;

      for ( var c = 0; c < n; ++c )
      {
         fuzzyImageWindow.mainView.image.selectedChannel = c;

         var median = fuzzyImageWindow.mainView.image.median();
         var avgDev = fuzzyImageWindow.mainView.image.avgDev();
         var min = fuzzyImageWindow.mainView.image.minimum();

         c0 = Math.min(c0, Math.max(0.7 * min , Math.range(median - 2.8 * avgDev, 0.0, 1.0)));
         m = Math.min(m, Math.mtf(parameters.medianSTF, median - c0));
      }

      var P = new HistogramTransformation;
      P.H = [ // c0, m, c1, r0, r1
         [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000],
         [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000],
         [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000],
         [c0, m, 1.00000000, 0.00000000, 1.00000000],
         [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000]
      ];

      P.executeOn(fuzzyImageWindow.mainView);

      if (parameters.maskFlag) {
         fuzzyImageWindow.removeMask();
      }
   }


// *** Image Quality ***

   var startTime = new Date;
   imageQuality(fuzzyImageWindow.mainView.image, fuzzyImageWindow.mainView.id);
   var endTime = new Date;

   console.writeln(format("%.03f s", 0.001 * (endTime.getTime() - startTime.getTime())));


// *** Replace Target Image ***

   if (parameters.replace == true) {
      var P = new PixelMath;
      P.expression = fuzzyImageWindow.mainView.id;
      P.expression1 = "";
      P.expression2 = "";
      P.expression3 = "";
      P.useSingleExpression = true;
      P.symbols = "";
      P.generateOutput = true;
      P.singleThreaded = false;
      P.use64BitWorkingImage = false;
      P.rescale = false;
      P.rescaleLower = 0;
      P.rescaleUpper = 1;
      P.truncate = true;
      P.truncateLower = 0;
      P.truncateUpper = 1;
      P.createNewImage = false;
      P.showNewImage = true;
      P.newImageId = "";
      P.newImageWidth = 0;
      P.newImageHeight = 0;
      P.newImageAlpha = false;
      P.newImageColorSpace = PixelMath.prototype.SameAsTarget;
      P.newImageSampleFormat = PixelMath.prototype.SameAsTarget;

      P.executeOn(targetWindow.mainView);

      fuzzyImageWindow.forceClose();
      targetWindow.bringToFront();
   }
   else {
      fuzzyImageWindow.show();
   }

   enable();
}


//==================================================================

function parametersDialogPrototype() {
   this.__base__ = Dialog;
   this.__base__();

   this.windowTitle = TITLE;

   this.onEditCompletedActive = false;

   var alignmentWidth = this.font.width("Fuzzy membership function:" + "M");
   var editWidth = this.font.width("000000");


//===== Help Label =====

   this.helpLabel = new Label( this );
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.margin = 6;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text =
      "<p><b>LocalFuzzyHistogramHyperbolization Script " + VERSION + "</b> &mdash; A script for contrast enhancement.</p>"
      + "<p>The script applies a Fuzzy Histogram Hyperbolization (FHH) algorithm locally to the target image. "
      + "Different membership functions can be chosen for the FHH algorithm. "
      + "The intensity of the FHH algorithm as well as the shape of the membership functions can be modified individually by the user. "
      + "An automatic Histogram Transformation is available to adjust the brigthness of the final image. </p>"
      + "<p>The local algorithm divides the image into discrete segments and applies the FHH algorithm separately to each segment. "
      + "A user-defined specification of the segmentation offers the possibility to consider the target image characteristics. "
      + "Additionally, a special clustering algorithm can be chosen to qualify the impact of the segmentation. "
      + "An optional star protection is provided by selecting a star mask.</p>"
      + "<p>Copyright &copy; 2018 Frank Weidenbusch</p>";


//===== Select Target Image =====

   this.viewList1_Label = new Label( this );
   this.viewList1_Label.setFixedWidth(alignmentWidth);
   this.viewList1_Label.text = "Target Image:";
   this.viewList1_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.viewList1_Label.toolTip = "<p>The image targeted for enhancement.</p>";

   this.viewList1 = new ViewList(this);
   this.viewList1.getMainViews();
   this.viewList1.onViewSelected = function(view) {
      parameters.targetView = view;
      this.currentView = parameters.targetView;
      enable();
   }
   this.viewList1.toolTip = this.viewList1_Label.toolTip;

   this.viewList1_Sizer = new HorizontalSizer;
   this.viewList1_Sizer.spacing = 4;
   this.viewList1_Sizer.add( this.viewList1_Label);
   this.viewList1_Sizer.add(this.viewList1);


//===== Select Mask Image =====

   this.viewList2_Label = new Label( this );
   this.viewList2_Label.setFixedWidth(alignmentWidth);
   this.viewList2_Label.text = "Star Mask Image:";
   this.viewList2_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.viewList2_Label.toolTip = "<p>Optional star mask for star protection.</p>"
      + "<p>Do not use a star mask for MMTF linear stretch!</p>";

   this.viewList2 = new ViewList(this);
   this.viewList2.getMainViews();
   this.viewList2.onViewSelected = function(view) {
      parameters.maskView = view;
      this.currentView = parameters.maskView;
      enable();
   }
   this.viewList2.toolTip = this.viewList2_Label.toolTip;

   this.viewList2_Sizer = new HorizontalSizer;
   this.viewList2_Sizer.spacing = 4;
   this.viewList2_Sizer.add( this.viewList2_Label);
   this.viewList2_Sizer.add(this.viewList2);


//===== Section Bar for Fuzzy Parameters =====

   this.imageSection = new Control(this);
   with (this.imageSection) {
      sizer = new HorizontalSizer;
      with (sizer) {
         spacing = 6;
         this.imageSectionVSizer = new VerticalSizer;
         with (this.imageSectionVSizer) {
            margin = 6;
            spacing = 4;
            add(this.viewList1_Sizer);
            add(this.viewList2_Sizer);
         }
         add(this.imageSectionVSizer);
      }
   }

   this.imageSection.adjustToContents();
   this.imageSection.setFixedHeight();
   this.imageSection.show();

   this.imageSectionBar = new SectionBar(this);
   this.imageSectionBar.setTitle("Image Selection");
   this.imageSectionBar.setSection(this.imageSection);


//===== Define Segmentation =====

   this.segmentation_Sizer = new HorizontalSizer;
   this.segmentation_Sizer.spacing = 4;

   this.segmentation_Label = new Label(this);
   this.segmentation_Label.setFixedWidth(alignmentWidth);
   this.segmentation_Label.text = "Image segmentation:";
   this.segmentation_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.segmentation_Label.toolTip = "<p>Segmentation of the target image used for the local FHH algorithm.</p>";

   this.segmentation_Sizer.add(this.segmentation_Label);
   this.segmentation_CB = new ComboBox(this);

   for (var i = 0; i != parameters.segmentationLabels.length; ++i) {
      this.segmentation_CB.addItem(parameters.segmentationLabels[i]);
   }
   this.segmentation_CB.currentItem = parameters.segmentation_CBIndex;
   this.segmentation_CB.toolTip = this.segmentation_Label.toolTip;
   this.segmentation_CB.onItemSelected = function(item) {
      if (parameters.segmentation_CBIndex != item) {
         parameters.segmentation_CBIndex = item;
      }
   };

   this.segmentation_Sizer.add(this.segmentation_CB);
   this.segmentation_Sizer.addStretch();


//===== Define CB Clustering =====

   this.cbClustering_Label = new Label (this);
   this.cbClustering_Label.setFixedWidth(alignmentWidth);
   this.cbClustering_Label.text = "Clustering:";
   this.cbClustering_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.cbClustering_Label.toolTip =
      "<p>Configuration of the image segmentation.</p>" +
      "<p>With this option selected, the fuzzy parameters of bordering segments with similar characteristics will be harmonized. "+
      "If this option is not selected, individual fuzzy parameters will be applied to each segment.</p>";

   this.cbClustering_CheckBox = new CheckBox( this );
   this.cbClustering_CheckBox.checked = parameters.cbClustering;
   this.cbClustering_CheckBox.onClick = function( checked )
   {
      parameters.cbClustering = checked;
      parameters.dialog.clustering_NC.enabled = !(parameters.dialog.clustering_NC.enabled);
   }
   this.cbClustering_CheckBox.toolTip = this.cbClustering_Label.toolTip;
   this.cbClustering_Sizer = new HorizontalSizer;
   this.cbClustering_Sizer.spacing = 4;
   this.cbClustering_Sizer.add( this.cbClustering_Label );
   this.cbClustering_Sizer.add( this.cbClustering_CheckBox );
   this.cbClustering_Sizer.addStretch();


//===== Define Clustering Threshold =====

   this.clustering_NC = new NumericControl (this);
   with ( this.clustering_NC )
   {
      label.text = "Clustering threshold:";
      label.setFixedWidth(alignmentWidth);
      enabled = parameters.cbAutoBeta;
      enableScientificNotation = false;
      setRange (0, 0.5);
      slider.setRange (0, 100);
      slider.minWidth = 300;
      setPrecision (2);
      setValue (parameters.clustering);
      edit.setFixedWidth(editWidth);
      onValueUpdated = function (value)
      {
         parameters.clustering = value;
      };
   }
   this.clustering_NC.toolTip =
      "<p>Configuration of the image segmentation.</p>" +
      "<p>This parameter is used to define the threshold of the clustering method. " +
      "Values between 0.05 and 0.15 are typical.</p>";

   this.clustering_Sizer = new HorizontalSizer;
   this.clustering_Sizer.spacing = 4;
   this.clustering_Sizer.add(this.clustering_NC);
   this.clustering_Sizer.addStretch();


//===== Section Bar for Segmentation Parameters =====

   this.setSegmentParameterSection = new Control(this);
   with (this.setSegmentParameterSection) {
      sizer = new HorizontalSizer;
      with (sizer) {
         spacing = 6;
         this.setSegmentParameterSectionVSizer = new VerticalSizer;
         with (this.setSegmentParameterSectionVSizer) {
            margin = 6;
            spacing = 4;
            add(this.segmentation_Sizer);
            add(this.cbClustering_Sizer);
            add(this.clustering_Sizer);
         }
         add(this.setSegmentParameterSectionVSizer);
      }
   }

   this.setSegmentParameterSection.adjustToContents();
   this.setSegmentParameterSection.setFixedHeight();
   this.setSegmentParameterSection.show();

   this.setSegmentParameterSectionBar = new SectionBar(this);
   this.setSegmentParameterSectionBar.setTitle("Segmentation Parameters");
   this.setSegmentParameterSectionBar.setSection(this.setSegmentParameterSection);


//===== Define CB Automatic Beta =====

   this.cbAutoBeta_Label = new Label (this);
   this.cbAutoBeta_Label.setFixedWidth(alignmentWidth);
   this.cbAutoBeta_Label.text = "Local FHH beta:";
   this.cbAutoBeta_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.cbAutoBeta_Label.toolTip =
      "<p>Configuration of the fuzzy function.</p>" +
      "<p>This parameter is used to control the intensity of the fuzzy function localy. "+
      "With this option selected, an individual beta will be calculated for each segment. "+
      "If this option is not selected, a constant value for beta can be chosen, which will be applied to all segments.</p>";

   this.cbAutoBeta_CheckBox = new CheckBox( this );
   this.cbAutoBeta_CheckBox.checked = parameters.cbAutoBeta;
   this.cbAutoBeta_CheckBox.onClick = function( checked )
   {
      parameters.cbAutoBeta = checked;
      parameters.dialog.autoBeta_NC.enabled = parameters.dialog.beta_NC.enabled;
      parameters.dialog.beta_NC.enabled = !(parameters.dialog.beta_NC.enabled);
   }
   this.cbAutoBeta_CheckBox.toolTip = this.cbAutoBeta_Label.toolTip;
   this.cbAutoBeta_Sizer = new HorizontalSizer;
   this.cbAutoBeta_Sizer.spacing = 4;
   this.cbAutoBeta_Sizer.add( this.cbAutoBeta_Label );
   this.cbAutoBeta_Sizer.add( this.cbAutoBeta_CheckBox );
   this.cbAutoBeta_Sizer.addStretch();


//===== Define Fuzzy auto beta =====

   this.autoBeta_NC = new NumericControl (this);
   with ( this.autoBeta_NC )
   {
      label.text = "Local FHH beta strength:";
      label.setFixedWidth(alignmentWidth);
      enabled = parameters.cbAutoBeta;
      enableScientificNotation = false;
      setRange (0, 2);
      slider.setRange (0, 200);
      slider.minWidth = 300;
      setPrecision (2);
      setValue (parameters.autoBeta);
      edit.setFixedWidth(editWidth);
      onValueUpdated = function (value)
      {
         parameters.autoBeta = value;
      };
   }
   this.autoBeta_NC.toolTip =
      "<p>Configuration of the fuzzy function.</p>" +
      "<p>This parameter is used to control the strength of the local beta method. " +
      "Values between 1.1 and 1.5 are typical.</p>";

   this.autoBeta_Sizer = new HorizontalSizer;
   this.autoBeta_Sizer.spacing = 4;
   this.autoBeta_Sizer.add(this.autoBeta_NC);
   this.autoBeta_Sizer.addStretch();


//===== Define Fuzzy beta =====

   this.beta_NC = new NumericControl (this);
   with ( this.beta_NC )
   {
      label.text = "Constant FHH beta:";
      label.setFixedWidth(alignmentWidth);
      enabled = !(parameters.cbAutoBeta);
      enableScientificNotation = false;
      setRange (0, 2);
      slider.setRange (0, 200);
      slider.minWidth = 300;
      setPrecision (2);
      setValue (parameters.beta);
      edit.setFixedWidth(editWidth);
      onValueUpdated = function (value)
      {
         parameters.beta = value;
      };
   }
   this.beta_NC.toolTip =
      "<p>Configuration of the fuzzy function.</p>" +
      "<p>This parameter is used to control the intensity of the fuzzy function globaly. " +
      "Use beta > 1 to lower respectively beta \&lt; 1 to liftlower the fuzzy function. " +
      "Values between 1.1 and 1.5 are typical.</p>";

   this.beta_Sizer = new HorizontalSizer;
   this.beta_Sizer.spacing = 4;
   this.beta_Sizer.add(this.beta_NC);
   this.beta_Sizer.addStretch();


//===== Define Lower Limit =====

   this.lowerLimit_NC = new NumericControl (this);
   with ( this.lowerLimit_NC )
   {
      label.text = "FHH greatest lower bound:";
      label.setFixedWidth(alignmentWidth);
      enabled = !(parameters.mmtfFlag);
      enableScientificNotation = false;
      setRange (0, 0.5);
      slider.setRange (0, 100);
      slider.minWidth = 300;
      setPrecision (2);
      setValue (parameters.lowerLimit);
      edit.setFixedWidth(editWidth);
      onValueUpdated = function (value)
      {
         parameters.lowerLimit = value;
      };
   }
   this.lowerLimit_NC.toolTip =
      "<p>Configuration of the fuzzy function.</p>" +
      "<p>Greatest lower bound for the minimum sample value of a segment . "+
      "Values between 0.2 and 0.4 are typical.</p>";

   this.lowerLimit_Sizer = new HorizontalSizer;
   this.lowerLimit_Sizer.spacing = 4;
   this.lowerLimit_Sizer.add(this.lowerLimit_NC);
   this.lowerLimit_Sizer.addStretch();


//===== Define Upper Limit =====

   this.upperLimit_NC = new NumericControl (this);
   with ( this.upperLimit_NC )
   {
      label.text = "FHH least upper bound:";
      label.setFixedWidth(alignmentWidth);
      enabled = !(parameters.mmtfFlag);
      enableScientificNotation = false;
      setRange (0.5, 1);
      slider.setRange (0, 100);
      slider.minWidth = 300;
      setPrecision (2);
      setValue (parameters.upperLimit);
      edit.setFixedWidth(editWidth);
      onValueUpdated = function (value)
      {
         parameters.upperLimit = value;
      };
   }
   this.upperLimit_NC.toolTip =
      "<p>Configuration of the fuzzy function.</p>" +
      "<p>Least upper bound for the maximum sample value of a segment . "+
      "Values between 0.7 and 0.9 are typical.</p>";

   this.upperLimit_Sizer = new HorizontalSizer;
   this.upperLimit_Sizer.spacing = 4;
   this.upperLimit_Sizer.add(this.upperLimit_NC);
   this.upperLimit_Sizer.addStretch();


//===== Section Bar for Fuzzy Parameters =====

   this.setFuzzyParameterSection = new Control(this);
   with (this.setFuzzyParameterSection) {
      sizer = new HorizontalSizer;
      with (sizer) {
         spacing = 6;
         this.setFuzzyParameterSectionVSizer = new VerticalSizer;
         with (this.setFuzzyParameterSectionVSizer) {
            margin = 6;
            spacing = 4;
            add(this.lowerLimit_Sizer);
            add(this.upperLimit_Sizer);
            add(this.cbAutoBeta_Sizer);
            add(this.autoBeta_Sizer);
            add(this.beta_Sizer);
         }
         add(this.setFuzzyParameterSectionVSizer);
      }
   }

   this.setFuzzyParameterSection.adjustToContents();
   this.setFuzzyParameterSection.setFixedHeight();
   this.setFuzzyParameterSection.show();

   this.setFuzzyParameterSectionBar = new SectionBar(this);
   this.setFuzzyParameterSectionBar.setTitle("Fuzzy Parameters");
   this.setFuzzyParameterSectionBar.setSection(this.setFuzzyParameterSection);


//===== Define Fuzzy Membership Function =====

   this.algorithm_Sizer = new HorizontalSizer;
   this.algorithm_Sizer.spacing = 4;

   this.algorithm_Label = new Label(this);
   this.algorithm_Label.setFixedWidth(alignmentWidth);
   this.algorithm_Label.text = "Fuzzy membership function:";
   this.algorithm_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.algorithm_Label.toolTip = "<p>Fuzzy membership function used for the local FHH algorithm.</p>";

   this.algorithm_Sizer.add(this.algorithm_Label);
   this.algorithm_CB = new ComboBox(this);

   for (var i = 0; i != parameters.algorithmLabels.length; ++i) {
      this.algorithm_CB.addItem(parameters.algorithmLabels[i]);
   }
   this.algorithm_CB.currentItem = parameters.algorithm_CBIndex;
   this.algorithm_CB.toolTip = this.algorithm_Label.toolTip;
   this.algorithm_CB.onItemSelected = function(item) {
      if (parameters.algorithm_CBIndex != item) {
         parameters.algorithm_CBIndex = item;
         parameters.mtfFlag = false;
         parameters.sigmoidFlag = false;
         parameters.gaussFlag = false;
         parameters.mmtfFlag = false;
         if (item == 1) {
            parameters.mtfFlag = true;
         }
         else if (item == 2) {
            parameters.sigmoidFlag = true;
         }
         else if (item == 3) {
            parameters.gaussFlag = true;
         }
         else if (item == 4) {
            parameters.mmtfFlag = true;
         }
         parameters.dialog.normalized_CheckBox.enabled = parameters.sigmoidFlag || parameters.gaussFlag;
         if (!(parameters.sigmoidFlag || parameters.gaussFlag)) {
            parameters.normalized = true;
         }
         else {
            parameters.normalized = false;
         }
         parameters.dialog.normalized_CheckBox.checked = parameters.normalized;
         parameters.dialog.midtone_NC.enabled = parameters.sigmoidFlag || parameters.mtfFlag;
         parameters.dialog.gamma_NC.enabled = parameters.sigmoidFlag;
         parameters.dialog.sigma_NC.enabled = parameters.gaussFlag;
         parameters.dialog.mmtf_NC.enabled = parameters.mmtfFlag;
         parameters.dialog.lowerLimit_NC.enabled = !(parameters.mmtfFlag);
         parameters.dialog.upperLimit_NC.enabled = !(parameters.mmtfFlag);
      }
   };

   this.algorithm_Sizer.add(this.algorithm_CB);


//===== Define CB Normalized =====

   this.normalized_Label = new Label (this);
   this.normalized_Label.text = "   Normalized:";
   this.normalized_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.normalized_Label.toolTip =
      "<p>Configuration of the fuzzy membership function.</p>" +
      "<p>The Sigmoid and Gaussian membership functions are not normalized, that means that the pixel values of the resulting image not fully utilize the range from zero to one. " +
      "With this option selected a normalization will be imposed to achieve a stronger contrast enhancement.</p>";

   this.normalized_CheckBox = new CheckBox( this );
   this.normalized_CheckBox.enabled = (parameters.sigmoidFlag == true) || (parameters.gaussFlag == true);
   if (!((parameters.sigmoidFlag == true) || (parameters.gaussFlag == true))) {
      parameters.normalized = true;
   }
   this.normalized_CheckBox.checked = parameters.normalized;
   this.normalized_CheckBox.onClick = function( checked )
   {
      parameters.normalized = checked;
   }
   this.normalized_CheckBox.toolTip = this.normalized_Label.toolTip;

   this.algorithm_Sizer.add(this.normalized_Label);
   this.algorithm_Sizer.add(this.normalized_CheckBox);
   this.algorithm_Sizer.addStretch();


//===== Define Sigmoid gamma =====

   this.gamma_NC = new NumericControl (this);
   with ( this.gamma_NC )
   {
      label.text = "Sigmoid gamma:";
      label.setFixedWidth(alignmentWidth);
      enabled = parameters.sigmoidFlag;
      enableScientificNotation = false;
      setRange (1, 10);
      slider.setRange (0, 100);
      slider.minWidth = 300;
      setPrecision (2);
      setValue (parameters.gamma);
      edit.setFixedWidth(editWidth);
      onValueUpdated = function (value)
      {
         parameters.gamma = value;
      };
   }
   this.gamma_NC.toolTip =
      "<p>Configuration of the fuzzy membership function.</p>" +
      "<p>This parameter is used to strengthen the Sigmoid membership function. "+
      "Values between 5 and 8 are typical.</p>";

   this.gamma_Sizer = new HorizontalSizer;
   this.gamma_Sizer.spacing = 4;
   this.gamma_Sizer.add(this.gamma_NC);
   this.gamma_Sizer.addStretch();


//===== Define midtone =====

   this.midtone_NC = new NumericControl (this);
   with ( this.midtone_NC )
   {
      label.text = "MTF / Sigmoid midtone:";
      label.setFixedWidth(alignmentWidth);
      enabled = parameters.sigmoidFlag;
      enableScientificNotation = false;
      setRange (0.25, 0.75);
      slider.setRange (0, 100);
      slider.minWidth = 300;
      setPrecision (2);
      setValue (parameters.midtone);
      edit.setFixedWidth(editWidth);
      onValueUpdated = function (value)
      {
         parameters.midtone = value;
      };
   }
   this.midtone_NC.toolTip =
      "<p>Configuration of the fuzzy membership function.</p>" +
      "<p>This parameter is used to stretch the MTF / Sigmoid membership function. "+
      "Values between 0.4 and 0.6 are typical.</p>";

   this.midtone_Sizer = new HorizontalSizer;
   this.midtone_Sizer.spacing = 4;
   this.midtone_Sizer.add(this.midtone_NC);
   this.midtone_Sizer.addStretch();


//===== Define Gauss sigma =====

   this.sigma_NC = new NumericControl (this);
   with ( this.sigma_NC )
   {
      label.text = "Gauss sigma:";
      label.setFixedWidth(alignmentWidth);
      enabled = parameters.gaussFlag;
      enableScientificNotation = false;
      setRange (0, 1);
      slider.setRange (0, 100);
      slider.minWidth = 300;
      setPrecision (2);
      setValue (parameters.sigma);
      edit.setFixedWidth(editWidth);
      onValueUpdated = function (value)
      {
         parameters.sigma = value;
      };
   }
   this.sigma_NC.toolTip =
      "<p>Configuration of the fuzzy membership function.</p>" +
      "<p>This parameter is used to stretch the Gaussian membership functions. "+
      "Values between 0.4 and 0.6 are typical.</p>";

   this.sigma_Sizer = new HorizontalSizer;
   this.sigma_Sizer.spacing = 4;
   this.sigma_Sizer.add(this.sigma_NC);
   this.sigma_Sizer.addStretch();


//===== Define MMTF Strength =====

   this.mmtf_NC = new NumericControl (this);
   with ( this.mmtf_NC )
   {
      label.text = "Masked MTF strength:";
      label.setFixedWidth(alignmentWidth);
      enabled = parameters.mmtfFlag;
      enableScientificNotation = false;
      setRange (0.5, 1.5);
      slider.setRange (0, 100);
      slider.minWidth = 300;
      setPrecision (2);
      setValue (parameters.mmtf);
      edit.setFixedWidth(editWidth);
      onValueUpdated = function (value)
      {
         parameters.mmtf = value;
      };
   }
   this.mmtf_NC.toolTip =
      "<p>Configuration of the fuzzy membership function.</p>" +
      "<p>This parameter is used to define the strength of the masked MTF linear stretch. "+
      "Values between 1.0 and 1.2 are typical.</p>";

   this.mmtf_Sizer = new HorizontalSizer;
   this.mmtf_Sizer.spacing = 4;
   this.mmtf_Sizer.add(this.mmtf_NC);
   this.mmtf_Sizer.addStretch();


//===== Section Bar for Membership Function Parameters =====

   this.setMSFParameterSection = new Control(this);
   with (this.setMSFParameterSection) {
      sizer = new HorizontalSizer;
      with (sizer) {
         spacing = 6;
         this.setMSFParameterSectionVSizer = new VerticalSizer;
         with (this.setMSFParameterSectionVSizer) {
            margin = 6;
            spacing = 4;
            add(this.algorithm_Sizer);
            add(this.midtone_Sizer);
            add(this.gamma_Sizer);
            add(this.midtone_Sizer);
            add(this.sigma_Sizer);
            add(this.mmtf_Sizer);
         }
         add(this.setMSFParameterSectionVSizer);
      }
   }

   this.setMSFParameterSection.adjustToContents();
   this.setMSFParameterSection.setFixedHeight();
   this.setMSFParameterSection.show();

   this.setMSFParameterSectionBar = new SectionBar(this);
   this.setMSFParameterSectionBar.setTitle("Membership Function Parameters");
   this.setMSFParameterSectionBar.setSection(this.setMSFParameterSection);


//===== Define CB STF =====

   this.cbSTF_Label = new Label (this);
   this.cbSTF_Label.setFixedWidth(alignmentWidth);
   this.cbSTF_Label.text = "Automatic HT:";
   this.cbSTF_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.cbSTF_Label.toolTip =
      "<p>Apply an automatic Histogram Transformation.</p>" +
      "<p>With this option selected, an automatic Histogram Transformation will be applied to the final Image.</p>";

   this.cbSTF_CheckBox = new CheckBox( this );
   this.cbSTF_CheckBox.checked = parameters.cbSTF;
   this.cbSTF_CheckBox.onClick = function( checked )
   {
      parameters.cbSTF = checked;
      parameters.dialog.medianSTF_NC.enabled = !(parameters.dialog.medianSTF_NC.enabled);
   }
   this.cbSTF_CheckBox.toolTip = this.cbSTF_Label.toolTip;
   this.cbSTF_Sizer = new HorizontalSizer;
   this.cbSTF_Sizer.spacing = 4;
   this.cbSTF_Sizer.add( this.cbSTF_Label );
   this.cbSTF_Sizer.add( this.cbSTF_CheckBox );
   this.cbSTF_Sizer.addStretch();


//===== Define Median STF =====

   this.medianSTF_NC = new NumericControl (this);
   with ( this.medianSTF_NC )
   {
      label.text = "HT target median:";
      label.setFixedWidth(alignmentWidth);
      enabled = parameters.cbAutoBeta;
      enableScientificNotation = false;
      setRange (0, 1);
      slider.setRange (0, 100);
      slider.minWidth = 300;
      setPrecision (2);
      setValue (parameters.medianSTF);
      edit.setFixedWidth(editWidth);
      onValueUpdated = function (value)
      {
         parameters.medianSTF = value;
      };
   }
   this.medianSTF_NC.toolTip =
      "<p>Configuration of the automatic HT enhancement.</p>" +
      "<p>This parameter is used to define the HT target median.</p>";

   this.medianSTF_Sizer = new HorizontalSizer;
   this.medianSTF_Sizer.spacing = 4;
   this.medianSTF_Sizer.add(this.medianSTF_NC);
   this.medianSTF_Sizer.addStretch();


//===== Define CB Replace =====

   this.replace_Label = new Label (this);
   this.replace_Label.setFixedWidth(alignmentWidth);
   this.replace_Label.text = "Replace Target Image:";
   this.replace_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.replace_Label.toolTip =
      "<p>Perform an in-place contrast enhancement.</p>" +
      "<p>With this option selected, the script will replace the target image by the modified image. " +
      "If this option is not selected, the modified image will be provided " +
      "as a newly created image window and the target image won't be affected.</p>";

   this.replace_CheckBox = new CheckBox( this );
   this.replace_CheckBox.checked = parameters.replace;
   this.replace_CheckBox.onClick = function( checked )
   {
      parameters.replace = checked;
   }
   this.replace_CheckBox.toolTip = this.replace_Label.toolTip;
   this.replace_Sizer = new HorizontalSizer;
   this.replace_Sizer.spacing = 4;
   this.replace_Sizer.add( this.replace_Label );
   this.replace_Sizer.add( this.replace_CheckBox );
   this.replace_Sizer.addStretch();


//===== Section Bar for Output Options =====

   this.outputOptionsSection = new Control(this);
   with (this.outputOptionsSection) {
      sizer = new HorizontalSizer;
      with (sizer) {
         spacing = 6;
         this.outputOptionsSectionVSizer = new VerticalSizer;
         with (this.outputOptionsSectionVSizer) {
            margin = 6;
            spacing = 4;
            add(this.cbSTF_Sizer);
            add(this.medianSTF_Sizer);
            add(this.replace_Sizer);
         }
         add(this.outputOptionsSectionVSizer);
      }
   }

   this.outputOptionsSection.adjustToContents();
   this.outputOptionsSection.setFixedHeight();
   this.outputOptionsSection.show();

   this.outputOptionsSectionBar = new SectionBar(this);
   this.outputOptionsSectionBar.setTitle("Output Options");
   this.outputOptionsSectionBar.setSection(this.outputOptionsSection);


//===== Buttons =====

   this.buttonPane = new HorizontalSizer;

   this.buttonPane.spacing = 6;

   this.resetButton = new ToolButton(this);

   this.resetButton.icon = this.scaledResource( ":/process-interface/reset.png" );
   this.resetButton.toolTip =
      "<p>Reset all settings to default values.</p>";
   this.resetButton.onClick = function() {
      globalReset();
   };

   this.buttonPane.add(this.resetButton);

   this.documentationButton = new ToolButton(this);

   this.documentationButton.icon = this.scaledResource( ":/process-interface/browse-documentation.png" );
   this.documentationButton.toolTip =
      "<p>Show script documentaion.</p>";
   this.documentationButton.onClick = function() {
      Dialog.browseScriptDocumentation( "LocalFuzzyHistogramHyperbolization" )
   };

   this.buttonPane.add(this.documentationButton);
   this.buttonPane.addStretch();

   this.okButton = new PushButton(this);

   this.okButton.text = "Execute";
   this.okButton.icon = this.scaledResource( ":/icons/power.png" );
   this.okButton.onClick = function() {
      console.show();
      mainFunction();
   };

   this.buttonPane.add(this.okButton);

   this.cancelButton = new PushButton(this);

   this.cancelButton.text = "Exit";
   this.cancelButton.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancelButton.onClick = function() {
      console.hide();
      this.dialog.ok();
   };
   this.cancelButton.defaultButton = true;

   this.buttonPane.add(this.cancelButton);


//===== Vertical Sizer =====

   this.sizer = new VerticalSizer;

   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add(this.helpLabel);
   this.sizer.add(this.imageSectionBar);
   this.sizer.add(this.imageSection);
   this.sizer.add(this.setSegmentParameterSectionBar);
   this.sizer.add(this.setSegmentParameterSection);
   this.sizer.add(this.setFuzzyParameterSectionBar);
   this.sizer.add(this.setFuzzyParameterSection);
   this.sizer.add(this.setMSFParameterSectionBar);
   this.sizer.add(this.setMSFParameterSection);
   this.sizer.add(this.outputOptionsSectionBar);
   this.sizer.add(this.outputOptionsSection);
   this.sizer.add(this.buttonPane);

   this.adjustToContents();
   this.setFixedSize();

   parameters.dialog = this;

   enable();
}

parametersDialogPrototype.prototype = new Dialog;


//==================================================================

function main() {
   console.hide();
   parameters.loadSettings();

   var parametersDialog = new parametersDialogPrototype();
   parametersDialog.execute();

   parameters.storeSettings();
}

main();

// ----------------------------------------------------------------------------
// EOF LocalFuzzyHistogramHyperbolization.js - Released 2018-10-26T11:23:18Z
