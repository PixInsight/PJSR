// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// SubframeSelectorEvaluator.js - Released 2018-11-05T16:53:08Z
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

function numberCompare(a, b) {
   return a < b ? -1 : a > b ? 1 : 0;
}

function medianMeanDeviationOfArray(values) {
   if (values.length == 0) {
      return [0.0, 0.0];
   }

   values.sort(numberCompare);

   var i = Math.floor(0.5 * values.length);
   var median = (2 * i == values.length) ?
      0.5 * (values[i - 1] + values[i]) :
      values[i];

   var deviations = new Array(values.length);
   for (var i = 0; i != values.length; ++i) {
      deviations[i] = Math.abs(median - values[i]);
   }

   var dispersion = 0.0;
   for (var i = 0; i != deviations.length; ++i) {
      dispersion += deviations[i];
   }
   dispersion = dispersion / deviations.length;

   return [median, dispersion];
}

function medianMedianDeviationOfArray(values) {
   if (values.length == 0) {
      return [0.0, 0.0];
   }

   values.sort(numberCompare);

   var i = Math.floor(0.5 * values.length);
   var median = (2 * i == values.length) ?
      0.5 * (values[i - 1] + values[i]) :
      values[i];

   var deviations = new Array(values.length);
   for (var i = 0; i != values.length; ++i) {
      deviations[i] = Math.abs(median - values[i]);
   }

   deviations.sort(numberCompare);

   var i = Math.floor(0.5 * deviations.length);
   var dispersion = (2 * i == deviations.length) ?
      0.5 * (deviations[i - 1] + deviations[i]) :
      deviations[i];

   return [median, dispersion];
}

function sigmaNormalize(value, median, dispersion) {
   return (value - median) / (dispersion != 0.0 ? dispersion : 1.0);
}

function sigmaDenormalize(value, median, dispersion) {
   return value * (dispersion != 0.0 ? dispersion : 1.0) + median;
}

function findMedianDispersionDescription(descriptions) {
   var values = [];
   for (var i = 0; i != descriptions.length; ++i) {
      values.push(descriptions[i].weight);
   }
   var weight = medianMeanDeviationOfArray(values);
   var values = [];
   for (var i = 0; i != descriptions.length; ++i) {
      values.push(descriptions[i].FWHM);
   }
   var FWHM = medianMeanDeviationOfArray(values);
   var values = [];
   for (var i = 0; i != descriptions.length; ++i) {
      values.push(descriptions[i].FWHMMeanDeviation);
   }
   var FWHMMeanDeviation = medianMeanDeviationOfArray(values);
   var values = [];
   for (var i = 0; i != descriptions.length; ++i) {
      values.push(descriptions[i].eccentricity);
   }
   var eccentricity = medianMeanDeviationOfArray(values);
   var values = [];
   for (var i = 0; i != descriptions.length; ++i) {
      values.push(descriptions[i].eccentricityMeanDeviation);
   }
   var eccentricityMeanDeviation = medianMeanDeviationOfArray(values);
   var values = [];
   for (var i = 0; i != descriptions.length; ++i) {
      values.push(descriptions[i].SNRWeight);
   }
   var SNRWeight = medianMeanDeviationOfArray(values);
   var values = [];
   for (var i = 0; i != descriptions.length; ++i) {
      values.push(descriptions[i].median);
   }
   var median = medianMeanDeviationOfArray(values);
   var values = [];
   for (var i = 0; i != descriptions.length; ++i) {
      values.push(descriptions[i].noise);
   }
   var noise = medianMeanDeviationOfArray(values);
   var values = [];
   for (var i = 0; i != descriptions.length; ++i) {
      values.push(descriptions[i].dispersion);
   }
   var dispersion = medianMeanDeviationOfArray(values);
   var values = [];
   for (var i = 0; i != descriptions.length; ++i) {
      values.push(descriptions[i].starSupport);
   }
   var starSupport = medianMeanDeviationOfArray(values);
   var values = [];
   for (var i = 0; i != descriptions.length; ++i) {
      values.push(descriptions[i].starResidual);
   }
   var starResidual = medianMeanDeviationOfArray(values);
   var values = [];
   for (var i = 0; i != descriptions.length; ++i) {
      values.push(descriptions[i].starResidualMeanDeviation);
   }
   var starResidualMeanDeviation = medianMeanDeviationOfArray(values);
   var values = [];
   for (var i = 0; i != descriptions.length; ++i) {
      values.push(descriptions[i].noiseSupport);
   }
   var noiseSupport = medianMeanDeviationOfArray(values);

   return new evaluationDescription(
      null,
      true,
      false,
      false,
      0,
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
      "",
      []
   );
}

function selectorExpressionEvaluator(
   expression, description, descriptions, subframeScale, cameraGain, cameraResolution, statistics
) {
   this.expression = expression;
   this.description = description;
   this.descriptions = descriptions;
   this.subframeScale = subframeScale;
   this.cameraGain = cameraGain;
   this.cameraResolution = cameraResolution;
   this.position = 0;
   this.value = true;
   this.errorPosition = 0;
   this.error = null;

   this.savePosition = function() {
      return [this.position, this.errorPosition, this.error];
   }
   this.restorePosition = function(description) {
      this.position = description[0];
      this.errorPosition = description[1];
      this.error = description[2];
   }

   this.medianDispersionDescription =
      findMedianDispersionDescription(this.descriptions);

   this.scaleMedianDispersion = function(medianDispersion, scale) {
      return [scale * medianDispersion[0], scale * medianDispersion[1]];
   }

   this.setError = function(error) {
      if (this.error != null) {
         return;
      }
      this.errorPosition = this.position;
      this.error = error;
   };
   this.setErrorContext = function(error) {
      if (this.error != null) {
         return;
      }
      var prefixMaxLength = 5;
      var prefix = this.expression.substring(0, this.position);
      if (prefix.length > prefixMaxLength) {
         prefix =
            "..." +
            prefix.substring(prefix.length - prefixMaxLength, prefix.length);
      }
      var suffixMaxLength = 20;
      var suffix = this.expression.substring(this.position, this.expression.length);
      if (suffix.length > suffixMaxLength) {
         suffix = suffix.substring(0, suffixMaxLength) + "...";
      }
      this.errorPosition = this.position;
      this.error = error + ": " + prefix + "|" + suffix;
   }

   this.isChar = function(character) {
      return this.position != this.expression.length &&
         this.expression.charAt(this.position) == character;
   };
   this.isString = function(string) {
      return this.position <= this.expression.length - string.length &&
         this.expression.substring(this.position, this.position + string.length) ==
         string;
   };
   this.isDigit = function() {
      if (this.position == this.expression.length) {
         return false;
      }
      return "0" <= this.expression.charAt(this.position) &&
         this.expression.charAt(this.position) <= "9";
   };
   this.isLetter = function() {
      if (this.position == this.expression.length) {
         return false;
      }
      return "a" <= this.expression.charAt(this.position) &&
         this.expression.charAt(this.position) <= "z" ||
         "A" <= this.expression.charAt(this.position) &&
         this.expression.charAt(this.position) <= "Z";
   };
   this.isLetterString = function(string) {
      if (!this.isString(string)) {
         return false;
      }
      this.position += string.length;
      var isLetter = this.isLetter();
      this.position -= string.length;
      return !isLetter;
   }
   this.skipWhiteSpace = function() {
      for (; this.position != this.expression.length;) {
         var c = this.expression.charAt(this.position);
         if (c == " " || c == "\n" || c == "\r" || c == "\t") {
            ++this.position;
         }
         else {
            break;
         }
      }
   };
   this.evaluateNumber = function() {
      var digits = 0;
      var number = 0.0;
      for (; this.isDigit();) {
         ++digits;
         number = number * 10 +
            this.expression.charCodeAt(this.position) - "0".charCodeAt(0);
         ++this.position;
      }
      var dotExponent = 0;
      if (this.isChar(".")) {
         ++this.position;
         for (; this.isDigit();) {
            ++digits;
            number = number * 10 +
               this.expression.charCodeAt(this.position) - "0".charCodeAt(0);
            --dotExponent;
            ++this.position;
         }
      }
      if (digits == 0) {
         this.setErrorContext("number expected");
         return 0.0;
      }
      var eExponent = 0;
      if (this.isChar("e") || this.isChar("E")) {
         ++this.position;
         var sign = 1.0;
         if (this.isChar("-")) {
            sign = -1.0;
            ++this.position;
         }
         else if (this.isChar("+")) {
            sign = 1.0;
            ++this.position;
         }
         else {
            sign = 1.0;
         }
         if (!this.isDigit()) {
            this.setErrorContext("exponent expected");
            return 0.0;
         }
         for (; this.isDigit();) {
            eExponent = eExponent * 10 +
               this.expression.charCodeAt(this.position) - "0".charCodeAt(0);
            ++this.position;
         }
         eExponent = sign * eExponent;
      }
      return number * Math.pow(10.0, dotExponent + eExponent);
   };
   this.evaluateProperty = function(isSelector) {
      var property = "";
      for (; this.isLetter();) {
         property = property + this.expression.charAt(this.position);
         ++this.position;
      }
      this.skipWhiteSpace();
      var value;
      var medianDispersion;
      if (property == "Index") {
         return this.description.index + 1;
      }
      else if (isSelector && property == "Weight") {
         return this.description.weight;
      }
      else if (isSelector && property == "WeightSigma") {
         value = this.description.weight;
         medianDispersion = this.medianDispersionDescription.weight;
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "FWHM") {
         return this.subframeScale * this.description.FWHM;
      }
      else if (property == "FWHMMaximum") {
         return this.subframeScale * statistics.FWHMMaximum;
      }
      else if (property == "FWHMMinimum") {
         return this.subframeScale * statistics.FWHMMinimum;
      }
      else if (property == "FWHMSigma") {
         value = this.subframeScale * this.description.FWHM;
         medianDispersion = this.scaleMedianDispersion(
            this.medianDispersionDescription.FWHM, this.subframeScale
         );
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "FWHMMeanDev") {
         return this.subframeScale * this.description.FWHMMeanDeviation;
      }
      else if (property == "FWHMMeanDevSigma") {
         value = this.subframeScale * this.description.FWHMMeanDeviation;
         medianDispersion = this.scaleMedianDispersion(
            this.medianDispersionDescription.FWHMMeanDeviation, this.subframeScale
         );
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "Eccentricity") {
         return this.description.eccentricity;
      }
      else if (property == "EccentricityMaximum") {
         return statistics.eccentricityMaximum;
      }
      else if (property == "EccentricityMinimum") {
         return statistics.eccentricityMinimum;
      }
      else if (property == "EccentricitySigma") {
         value = this.description.eccentricity;
         medianDispersion = this.medianDispersionDescription.eccentricity;
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "EccentricityMeanDev") {
         return this.description.eccentricityMeanDeviation;
      }
      else if (property == "EccentricityMeanDevSigma") {
         value = this.description.eccentricityMeanDeviation;
         medianDispersion = this.medianDispersionDescription.eccentricityMeanDeviation;
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "SNRWeight") {
         return this.description.SNRWeight;
      }
      else if (property == "SNRWeightMaximum") {
         return statistics.SNRWeightMaximum;
      }
      else if (property == "SNRWeightMinimum") {
         return statistics.SNRWeightMinimum;
      }
      else if (property == "SNRWeightSigma") {
         value = this.description.SNRWeight;
         medianDispersion = this.medianDispersionDescription.SNRWeight;
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "Median") {
         return this.cameraResolution * this.cameraGain *
            pedestalFunction(this.description.median);
      }
      else if (property == "MedianSigma") {
         value = this.cameraResolution * this.cameraGain *
            pedestalFunction(this.description.median);
         medianDispersion = this.scaleMedianDispersion(
            [
               pedestalFunction(this.medianDispersionDescription.median[0]),
               this.medianDispersionDescription.median[1]
            ],
            this.cameraResolution * this.cameraGain
         );
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "Noise") {
         return this.cameraResolution * this.cameraGain * this.description.noise;
      }
      else if (property == "NoiseSigma") {
         value = this.cameraResolution * this.cameraGain * this.description.noise;
         medianDispersion = this.scaleMedianDispersion(
            this.medianDispersionDescription.noise,
            this.cameraResolution * this.cameraGain
         );
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "MeanDeviation") {
         return this.cameraResolution * this.cameraGain * this.description.dispersion;
      }
      else if (property == "MeanDeviationSigma") {
         value = this.cameraResolution * this.cameraGain * this.description.dispersion;
         medianDispersion = this.scaleMedianDispersion(
            this.medianDispersionDescription.dispersion,
            this.cameraResolution * this.cameraGain
         );
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "StarSupport") {
         return this.description.starSupport;
      }
      else if (property == "StarSupportSigma") {
         value = this.description.starSupport;
         medianDispersion = this.medianDispersionDescription.starSupport;
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "StarResidual") {
         return this.description.starResidual;
      }
      else if (property == "StarResidualSigma") {
         value = this.description.starResidual;
         medianDispersion = this.medianDispersionDescription.starResidual;
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "StarResidualMeanDev") {
         return this.description.starResidualMeanDeviation;
      }
      else if (property == "StarResidualMeanDevSigma") {
         value = this.description.starResidualMeanDeviation;
         medianDispersion = this.medianDispersionDescription.starResidualMeanDeviation;
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "NoiseSupport") {
         return this.description.noiseSupport;
      }
      else if (property == "NoiseSupportSigma") {
         value = this.description.noiseSupport;
         medianDispersion = this.medianDispersionDescription.noiseSupport;
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property != "") {
         this.setError("unknown property: " + property);
         return 0.0;
      }
      else {
         this.setErrorContext("property expected");
         return 0.0;
      }
   };
   this.evaluateTerm = function(isSelector) {
      if (this.isDigit() || this.isChar(".")) {
         var number = this.evaluateNumber();
         this.skipWhiteSpace();
         return number;
      }
      else {
         var property = this.evaluateProperty(isSelector);
         this.skipWhiteSpace();
         return property;
      }
   };
   this.evaluateWeight = function(isSelector) {
      var sign = 1.0;
      if (this.isChar("-")) {
         sign = -1.0;
         ++this.position;
         this.skipWhiteSpace();
      }
      var value;
      if (this.isChar("(")) {
         ++this.position;
         this.skipWhiteSpace();
         value = this.evaluateAddWeight(isSelector);
         this.skipWhiteSpace();
         if (!this.isChar(")")) {
            this.setErrorContext(") expected");
            return 0.0;
         }
         ++this.position;
         this.skipWhiteSpace();
      }
      else {
         value = this.evaluateTerm(isSelector);
         this.skipWhiteSpace();
      }
      var exponent = 1.0;
      if (this.isChar("^")) {
         ++this.position;
         this.skipWhiteSpace();
         exponent = this.evaluateWeight(isSelector);
         this.skipWhiteSpace();
      }
      return sign * (exponent == 1.0 ? value : Math.pow(value, exponent));
   };
   this.evaluateMultiplyWeight = function(isSelector) {
      var value = this.evaluateWeight(isSelector);
      this.skipWhiteSpace();
      for (; this.isChar("*") || this.isChar("/");) {
         var multiply = this.isChar("*");
         ++this.position;
         this.skipWhiteSpace();
         var weight = this.evaluateWeight(isSelector);
         this.skipWhiteSpace();
         value = multiply ? value * weight : value / weight;
      }
      return value;
   };
   this.evaluateAddWeight = function(isSelector) {
      var value = this.evaluateMultiplyWeight(isSelector);
      this.skipWhiteSpace();
      for (; this.isChar("+") || this.isChar("-");) {
         var add = this.isChar("+");
         ++this.position;
         this.skipWhiteSpace();
         var multiplyWeight = this.evaluateMultiplyWeight(isSelector);
         this.skipWhiteSpace();
         value = add ? value + multiplyWeight : value - multiplyWeight;
      }
      return !isNaN(value) && isFinite(value) ? value : 0.0;
   };

   this.evaluateRelation = function() {
      var left = this.evaluateAddWeight(true);
      this.skipWhiteSpace();
      var relation = 0;
      if (this.isString("<=")) {
         ++this.position;
         ++this.position;
         this.skipWhiteSpace();
         relation = 0;
      }
      else if (this.isString(">=")) {
         ++this.position;
         ++this.position;
         this.skipWhiteSpace();
         relation = 1;
      }
      else if (this.isString("==")) {
         ++this.position;
         ++this.position;
         this.skipWhiteSpace();
         relation = 2;
      }
      else if (this.isString("!=")) {
         ++this.position;
         ++this.position;
         this.skipWhiteSpace();
         relation = 3;
      }
      else if (this.isChar("<")) {
         ++this.position;
         this.skipWhiteSpace();
         relation = 5;
      }
      else if (this.isChar(">")) {
         ++this.position;
         this.skipWhiteSpace();
         relation = 6;
      }
      else {
         this.setErrorContext("relational operator expected");
         return false;
      }
      var right = this.evaluateAddWeight(true);
      this.skipWhiteSpace();
      if (relation == 0) {
         return left <= right;
      }
      else if (relation == 1) {
         return left >= right;
      }
      else if (relation == 2) {
         return left == right;
      }
      else if (relation == 3) {
         return left != right;
      }
      else if (relation == 4) {
         return false;
      }
      else if (relation == 5) {
         return left < right;
      }
      else if (relation == 6) {
         return left > right;
      }
      else if (relation == 7) {
         return true;
      }
      else {
         this.setErrorContext("relational operator expected");
         return false;
      }
   }
   this.evaluateConstraint = function() {
      if (this.isChar("!")) {
         ++this.position;
         this.skipWhiteSpace();
         if (!this.isChar("(")) {
            this.setErrorContext("( expected");
            return false;
         }
         ++this.position;
         this.skipWhiteSpace();
         var orSelector = this.evaluateOrSelector();
         this.skipWhiteSpace();
         if (this.isChar(")")) {
            ++this.position;
            this.skipWhiteSpace();
         }
         else {
            this.setErrorContext(") expected");
            return false;
         }
         return !orSelector;
      }
      else if (this.isChar("(")) {
         var position = this.savePosition();
         ++this.position;
         this.skipWhiteSpace();
         var orSelector = this.evaluateOrSelector();
         if (this.error != null) {
            this.restorePosition(position);
            var relation = this.evaluateRelation();
            this.skipWhiteSpace();
            return relation;
         }
         this.skipWhiteSpace();
         if (this.isChar(")")) {
            ++this.position;
            this.skipWhiteSpace();
         }
         else {
            this.setErrorContext(") expected");
            return false;
         }
         return orSelector;
      }
      else if (this.isLetterString("true")) {
         this.position += 4;
         this.skipWhiteSpace();
         return true;
      }
      else if (this.isLetterString("false")) {
         this.position += 5;
         this.skipWhiteSpace();
         return false;
      }
      else {
         var relation = this.evaluateRelation();
         this.skipWhiteSpace();
         return relation;
      }
   };
   this.evaluateAndSelector = function() {
      var value = this.evaluateConstraint();
      this.skipWhiteSpace();
      for (; this.isString("&&");) {
         ++this.position;
         ++this.position;
         this.skipWhiteSpace();
         var constraint = this.evaluateConstraint();
         this.skipWhiteSpace();
         value = value && constraint;
      }
      return value;
   };
   this.evaluateOrSelector = function() {
      var value = this.evaluateAndSelector();
      this.skipWhiteSpace();
      for (; this.isString("||");) {
         ++this.position;
         ++this.position;
         this.skipWhiteSpace();
         var andSelector = this.evaluateAndSelector();
         this.skipWhiteSpace();
         value = value || andSelector;
      }
      return value;
   };

   this.evaluate = function() {
      this.position = 0;
      this.errorPosition = 0;
      this.error = null;

      var value = true;
      this.skipWhiteSpace();
      if (this.position != this.expression.length) {
         value = this.evaluateOrSelector();
         this.skipWhiteSpace();
         if (this.position != this.expression.length) {
            this.setErrorContext("end of expression expected");
         }
      }

      this.value = this.error == null ? value : true;
      return this.value;
   };
}

function weightingExpressionEvaluator(
   expression, description, descriptions, subframeScale, cameraGain, cameraResolution, statistics
) {
   this.expression = expression;
   this.description = description;
   this.descriptions = descriptions;
   this.subframeScale = subframeScale;
   this.cameraGain = cameraGain;
   this.cameraResolution = cameraResolution;
   this.position = 0;
   this.value = 1.0;
   this.errorPosition = 0;
   this.error = null;

   this.medianDispersionDescription =
      findMedianDispersionDescription(this.descriptions);

   this.scaleMedianDispersion = function(medianDispersion, scale) {
      return [scale * medianDispersion[0], scale * medianDispersion[1]];
   }

   this.setError = function(error) {
      if (this.error != null) {
         return;
      }
      this.errorPosition = this.position;
      this.error = error;
   };
   this.setErrorContext = function(error) {
      if (this.error != null) {
         return;
      }
      var prefixMaxLength = 5;
      var prefix = this.expression.substring(0, this.position);
      if (prefix.length > prefixMaxLength) {
         prefix =
            "..." +
            prefix.substring(prefix.length - prefixMaxLength, prefix.length);
      }
      var suffixMaxLength = 20;
      var suffix = this.expression.substring(this.position, this.expression.length);
      if (suffix.length > suffixMaxLength) {
         suffix = suffix.substring(0, suffixMaxLength) + "...";
      }
      this.errorPosition = this.position;
      this.error = error + ": " + prefix + "|" + suffix;
   }

   this.isChar = function(character) {
      return this.position != this.expression.length &&
         this.expression.charAt(this.position) == character;
   };
   this.isString = function(string) {
      return this.position <= this.expression.length - string.length &&
         this.expression.substring(this.position, this.position + string.length) ==
         string;
   };
   this.isDigit = function() {
      if (this.position == this.expression.length) {
         return false;
      }
      return "0" <= this.expression.charAt(this.position) &&
         this.expression.charAt(this.position) <= "9";
   };
   this.isLetter = function() {
      if (this.position == this.expression.length) {
         return false;
      }
      return "a" <= this.expression.charAt(this.position) &&
         this.expression.charAt(this.position) <= "z" ||
         "A" <= this.expression.charAt(this.position) &&
         this.expression.charAt(this.position) <= "Z";
   };
   this.isLetterString = function(string) {
      if (!this.isString(string)) {
         return false;
      }
      this.position += string.length;
      var isLetter = this.isLetter();
      this.position -= string.length;
      return !isLetter;
   }
   this.skipWhiteSpace = function() {
      for (; this.position != this.expression.length;) {
         var c = this.expression.charAt(this.position);
         if (c == " " || c == "\n" || c == "\r" || c == "\t") {
            ++this.position;
         }
         else {
            break;
         }
      }
   };
   this.evaluateNumber = function() {
      var digits = 0;
      var number = 0.0;
      for (; this.isDigit();) {
         ++digits;
         number = number * 10 +
            this.expression.charCodeAt(this.position) - "0".charCodeAt(0);
         ++this.position;
      }
      var dotExponent = 0;
      if (this.isChar(".")) {
         ++this.position;
         for (; this.isDigit();) {
            ++digits;
            number = number * 10 +
               this.expression.charCodeAt(this.position) - "0".charCodeAt(0);
            --dotExponent;
            ++this.position;
         }
      }
      if (digits == 0) {
         this.setErrorContext("number expected");
         return 0.0;
      }
      var eExponent = 0;
      if (this.isChar("e") || this.isChar("E")) {
         ++this.position;
         var sign = 1.0;
         if (this.isChar("-")) {
            sign = -1.0;
            ++this.position;
         }
         else if (this.isChar("+")) {
            sign = 1.0;
            ++this.position;
         }
         else {
            sign = 1.0;
         }
         if (!this.isDigit()) {
            this.setErrorContext("exponent expected");
            return 0.0;
         }
         for (; this.isDigit();) {
            eExponent = eExponent * 10 +
               this.expression.charCodeAt(this.position) - "0".charCodeAt(0);
            ++this.position;
         }
         eExponent = sign * eExponent;
      }
      return number * Math.pow(10.0, dotExponent + eExponent);
   };
   this.evaluateProperty = function(isSelector) {
      var property = "";
      for (; this.isLetter();) {
         property = property + this.expression.charAt(this.position);
         ++this.position;
      }
      this.skipWhiteSpace();
      var value;
      var medianDispersion;
      if (property == "Index") {
         return this.description.index + 1;
      }
      else if (isSelector && property == "Weight") {
         return this.description.weight;
      }
      else if (isSelector && property == "WeightSigma") {
         value = this.description.weight;
         medianDispersion = this.medianDispersionDescription.weight;
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "FWHM") {
         return this.subframeScale * this.description.FWHM;
      }
      else if (property == "FWHMMaximum") {
         return this.subframeScale * statistics.FWHMMaximum;
      }
      else if (property == "FWHMMinimum") {
         return this.subframeScale * statistics.FWHMMinimum;
      }
      else if (property == "FWHMSigma") {
         value = this.subframeScale * this.description.FWHM;
         medianDispersion = this.scaleMedianDispersion(
            this.medianDispersionDescription.FWHM, this.subframeScale
         );
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "FWHMMeanDev") {
         return this.subframeScale * this.description.FWHMMeanDeviation;
      }
      else if (property == "FWHMMeanDevSigma") {
         value = this.subframeScale * this.description.FWHMMeanDeviation;
         medianDispersion = this.scaleMedianDispersion(
            this.medianDispersionDescription.FWHMMeanDeviation, this.subframeScale
         );
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "Eccentricity") {
         return this.description.eccentricity;
      }
      else if (property == "EccentricityMaximum") {
         return statistics.eccentricityMaximum;
      }
      else if (property == "EccentricityMinimum") {
         return statistics.eccentricityMinimum;
      }
      else if (property == "EccentricitySigma") {
         value = this.description.eccentricity;
         medianDispersion = this.medianDispersionDescription.eccentricity;
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "EccentricityMeanDev") {
         return this.description.eccentricityMeanDeviation;
      }
      else if (property == "EccentricityMeanDevSigma") {
         value = this.description.eccentricityMeanDeviation;
         medianDispersion = this.medianDispersionDescription.eccentricityMeanDeviation;
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "SNRWeight") {
         return this.description.SNRWeight;
      }
      else if (property == "SNRWeightMaximum") {
         return statistics.SNRWeightMaximum;
      }
      else if (property == "SNRWeightMinimum") {
         return statistics.SNRWeightMinimum;
      }
      else if (property == "SNRWeightSigma") {
         value = this.description.SNRWeight;
         medianDispersion = this.medianDispersionDescription.SNRWeight;
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "Median") {
         return this.cameraResolution * this.cameraGain *
            pedestalFunction(this.description.median);
      }
      else if (property == "MedianSigma") {
         value = this.cameraResolution * this.cameraGain *
            pedestalFunction(this.description.median);
         medianDispersion = this.scaleMedianDispersion(
            [
               pedestalFunction(this.medianDispersionDescription.median[0]),
               this.medianDispersionDescription.median[1]
            ],
            this.cameraResolution * this.cameraGain
         );
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "Noise") {
         return this.cameraResolution * this.cameraGain * this.description.noise;
      }
      else if (property == "NoiseSigma") {
         value = this.cameraResolution * this.cameraGain * this.description.noise;
         medianDispersion = this.scaleMedianDispersion(
            this.medianDispersionDescription.noise,
            this.cameraResolution * this.cameraGain
         );
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "MeanDeviation") {
         return this.cameraResolution * this.cameraGain * this.description.dispersion;
      }
      else if (property == "MeanDeviationSigma") {
         value = this.cameraResolution * this.cameraGain * this.description.dispersion;
         medianDispersion = this.scaleMedianDispersion(
            this.medianDispersionDescription.dispersion,
            this.cameraResolution * this.cameraGain
         );
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "StarSupport") {
         return this.description.starSupport;
      }
      else if (property == "StarSupportSigma") {
         value = this.description.starSupport;
         medianDispersion = this.medianDispersionDescription.starSupport;
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "StarResidual") {
         return this.description.starResidual;
      }
      else if (property == "StarResidualSigma") {
         value = this.description.starResidual;
         medianDispersion = this.medianDispersionDescription.starResidual;
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "StarResidualMeanDev") {
         return this.description.starResidualMeanDeviation;
      }
      else if (property == "StarResidualMeanDevSigma") {
         value = this.description.starResidualMeanDeviation;
         medianDispersion = this.medianDispersionDescription.starResidualMeanDeviation;
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property == "NoiseSupport") {
         return this.description.noiseSupport;
      }
      else if (property == "NoiseSupportSigma") {
         value = this.description.noiseSupport;
         medianDispersion = this.medianDispersionDescription.noiseSupport;
         return sigmaNormalize(value, medianDispersion[0], medianDispersion[1]);
      }
      else if (property != "") {
         this.setError("unknown property: " + property);
         return 0.0;
      }
      else {
         this.setErrorContext("property expected");
         return 0.0;
      }
   };
   this.evaluateTerm = function(isSelector) {
      if (this.isDigit() || this.isChar(".")) {
         var number = this.evaluateNumber();
         this.skipWhiteSpace();
         return number;
      }
      else {
         var property = this.evaluateProperty(isSelector);
         this.skipWhiteSpace();
         return property;
      }
   };
   this.evaluateWeight = function(isSelector) {
      var sign = 1.0;
      if (this.isChar("-")) {
         sign = -1.0;
         ++this.position;
         this.skipWhiteSpace();
      }
      var value;
      if (this.isChar("(")) {
         ++this.position;
         this.skipWhiteSpace();
         value = this.evaluateAddWeight(isSelector);
         this.skipWhiteSpace();
         if (!this.isChar(")")) {
            this.setErrorContext(") expected");
            return 0.0;
         }
         ++this.position;
         this.skipWhiteSpace();
      }
      else {
         value = this.evaluateTerm(isSelector);
         this.skipWhiteSpace();
      }
      var exponent = 1.0;
      if (this.isChar("^")) {
         ++this.position;
         this.skipWhiteSpace();
         exponent = this.evaluateWeight(isSelector);
         this.skipWhiteSpace();
      }
      return sign * (exponent == 1.0 ? value : Math.pow(value, exponent));
   };
   this.evaluateMultiplyWeight = function(isSelector) {
      var value = this.evaluateWeight(isSelector);
      this.skipWhiteSpace();
      for (; this.isChar("*") || this.isChar("/");) {
         var multiply = this.isChar("*");
         ++this.position;
         this.skipWhiteSpace();
         var weight = this.evaluateWeight(isSelector);
         this.skipWhiteSpace();
         value = multiply ? value * weight : value / weight;
      }
      return value;
   };
   this.evaluateAddWeight = function(isSelector) {
      var value = this.evaluateMultiplyWeight(isSelector);
      this.skipWhiteSpace();
      for (; this.isChar("+") || this.isChar("-");) {
         var add = this.isChar("+");
         ++this.position;
         this.skipWhiteSpace();
         var multiplyWeight = this.evaluateMultiplyWeight(isSelector);
         this.skipWhiteSpace();
         value = add ? value + multiplyWeight : value - multiplyWeight;
      }
      return !isNaN(value) && isFinite(value) ? value : 0.0;
   };

   this.evaluate = function() {
      this.position = 0;
      this.errorPosition = 0;
      this.error = null;

      var value = 0.0;
      this.skipWhiteSpace();
      if (this.position != this.expression.length) {
         value = this.evaluateAddWeight(false);
         this.skipWhiteSpace();
         if (this.position != this.expression.length) {
            this.setErrorContext("end of expression expected");
         }
      }

      this.value = this.error == null ? value : 0.0;
      return this.value;
   };
}

function selectorExpressionIsValid(expression) {
   var selectorEvaluator = new selectorExpressionEvaluator(
      expression,
      nullEvaluationDescription,
      [nullEvaluationDescription],
      parameters.actualSubframeScale(),
      parameters.actualCameraGain(),
      parameters.cameraResolutionValues[parameters.cameraResolution],
      nullEvaluationDescriptionStatistics
   );
   selectorEvaluator.evaluate();
   return selectorEvaluator.error == null;
}

function weightingExpressionIsValid(expression) {
   var weightEvaluator = new weightingExpressionEvaluator(
      expression,
      nullEvaluationDescription,
      [nullEvaluationDescription],
      parameters.actualSubframeScale(),
      parameters.actualCameraGain(),
      parameters.cameraResolutionValues[parameters.cameraResolution],
      nullEvaluationDescriptionStatistics
   );
   weightEvaluator.evaluate();
   return weightEvaluator.error == null;
}

// ----------------------------------------------------------------------------
// EOF SubframeSelectorEvaluator.js - Released 2018-11-05T16:53:08Z
