// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// MainModel.js - Released 2016/12/30 00:00:00 UTC
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

function MainModel() {
   // Data numbers per normalized unit.
   this.DNPerNormalizedUnit = 65535;

   // Arcseconds per radian.
   this.arcsecondsPerRadian = 6.48e5 / Math.PI;

   // Intra-focal frame paths.
   this.intraFocalFramePaths = new Array();

   // Extra-focal frame paths.
   this.extraFocalFramePaths = new Array();

   // Output directory path.
   this.outputDirectoryPath = null;

   // Show full paths for the frames.
   this.defaultFramesFullPaths = false;
   this.framesFullPaths = this.defaultFramesFullPaths;

   // Show full path for the output directory.
   this.defaultOutputDirectoryFullPath = false;
   this.outputDirectoryFullPath = this.defaultOutputDirectoryFullPath;

   // Aperture diameter in meters.
   this.minimumApertureDiameter = 0;
   this.maximumApertureDiameter = 1;
   this.defaultApertureDiameter = 0;
   this.scaleApertureDiameter = 1000;
   this.formatApertureDiameter = "%.1f";
   this.apertureDiameter = this.defaultApertureDiameter;

   // Focal length in meters.
   this.minimumFocalLength = 0;
   this.maximumFocalLength = 10;
   this.defaultFocalLength = 0;
   this.scaleFocalLength = 1000;
   this.formatApertureDiameter = "%.1f";
   this.focalLength = this.defaultFocalLength;

   // Detector type.
   this.monochromeDetectorType = 0;
   this.colorFilterArrayDetectorType = 1;
   this.minimumDetectorType = this.monochromeDetectorType;
   this.maximumDetectorType = this.colorFilterArrayDetectorType;
   this.defaultDetectorType = this.monochromeDetectorType;
   this.detectorType = this.defaultDetectorType;

   // Gain in e-/DN.
   this.minimumGain = 0;
   this.maximumGain = 100;
   this.defaultGain = 0;
   this.scaleGain = 1;
   this.formatGain = "%.3f";
   this.gain = this.defaultGain;

   // Pixel size in meters.
   this.minimumPixelSize = 0;
   this.maximumPixelSize = 50e-6;
   this.defaultPixelSize = 0;
   this.scalePixelSize = 1e6;
   this.formatPixelSize = "%.2f";
   this.pixelSize = this.defaultPixelSize;
   this.effectivePixelSize = function() {
      return this.pixelSize;
   };

   // Observation wavelength in meters.
   this.minimumObservationWavelength = 300e-9;
   this.maximumObservationWavelength = 800e-9;
   this.defaultObservationWavelength = 546e-9;
   this.scaleObservationWavelength = 1e9;
   this.formatObservationWavelength = "%.1f";
   this.observationWavelength = this.defaultObservationWavelength;

   // Rejection method.
   this.noRejectionMethod = 0;
   this.scaleRejectionMethod = 1;
   this.scaleRejectionMinimumPixels = 5;
   this.minimumRejectionMethod = this.noRejectionMethod;
   this.maximumRejectionMethod = this.scaleRejectionMethod;
   this.defaultRejectionMethod = this.noRejectionMethod;
   this.rejectionMethod = this.defaultRejectionMethod;

   // Rejection factor in scale units.
   this.minimumRejectionScale = 0.5;
   this.maximumRejectionScale = 5;
   this.defaultRejectionScale = 2;
   this.scaleRejectionScale = 1;
   this.formatRejectionScale = "%.2f";
   this.rejectionScale = this.defaultRejectionScale;
   this.minimumRejectionCount = 3;

   // Identifier prefix.
   this.defaultIdentifierPrefix = "";
   this.identifierPrefix = this.defaultIdentifierPrefix;

   // Fringe count scale in scale units.
   this.minimumFringeCountScale = 0.25;
   this.maximumFringeCountScale = 4.0;
   this.defaultFringeCountScale = 1.0;
   this.scaleFringeCountScale = 1;
   this.formatFringeCountScale = "%.2f";
   this.fringeCountScale = this.defaultFringeCountScale;

   // Plot resolution in dpi.
   this.plotResolution = 96;

   // Plot zoom factor.
   this.plotZoomFactor = 1;

   // Font resolution in dpi.
   this.fontResolution = 96;

   // Generate views.
   this.defaultGenerateViews = true;
   this.generateViews = this.defaultGenerateViews;

   // Aberration ordering.
   this.nameAberrationOrdering = 0;
   this.magnitudeAberrationOrdering = 1;
   this.minimumAberrationOrdering = this.nameAberrationOrdering;
   this.maximumAberrationOrdering = this.magnitudeAberrationOrdering;
   this.defaultAberrationOrdering = this.magnitudeAberrationOrdering;
   this.aberrationOrdering = this.defaultAberrationOrdering;

   // Defocus exposure in e-/px.
   this.minimumDefocusExposure = 1000;
   this.maximumDefocusExposure = 100000;
   this.defaultDefocusExposure = 10000;
   this.scaleDefocusExposure = 1;
   this.formatDefocusExposure = "%.0f";
   this.defocusExposure = this.defaultDefocusExposure;

   // Observation bandwidth in nm.
   this.broadband300nmObservationBandwidth = 0;
   this.broadband100nmObservationBandwidth = 1;
   this.narrowband4nmObservationBandwidth = 2;
   this.minimumObservationBandwidth = this.broadband300nmObservationBandwidth;
   this.maximumObservationBandwidth = this.broadband100nmObservationBandwidth;
   this.defaultObservationBandwidth = this.broadband300nmObservationBandwidth;
   this.observationBandwidth = this.defaultObservationBandwidth;

   // Corrugation resolution in cycles per aperture diameter.
   this.minimumCorrugationResolution = 5;
   this.maximumCorrugationResolution = 30;
   this.defaultCorrugationResolution = 10;
   this.scaleCorrugationResolution = 1;
   this.formatCorrugationResolution = "%.2f";
   this.corrugationResolution = this.defaultCorrugationResolution;

   // Exposure time in seconds.
   this.minimumExposureTime = 0.1;
   this.maximumExposureTime = 1000;
   this.defaultExposureTime = 5;
   this.scaleExposureTime = 1;
   this.formatExposureTime = "%.1f";
   this.exposureTime = this.defaultExposureTime;

   // Defocus diameter estimate in pixels.
   this.defocusDiameterEstimate = 0;

   // Defocus obstruction diameter estimate in pixels.
   this.defocusObstructionDiameterEstimate = 0;

   // Defocus obstruction ratio estimate.
   this.scaleDefocusObstructionRatioEstimate = 100;
   this.formatDefocusObstructionRatioEstimate = "%.1f";
   this.defocusObstructionRatioEstimate = 0;

   // Defocus distance estimate in meters.
   this.scaleDefocusDistanceEstimate = 1000;
   this.formatDefocusDistanceEstimate = "%.3f";
   this.defocusDistanceEstimate = 0;

   // Corrugation resolution estimate in cycles per aperture diameter.
   this.scaleCorrugationResolutionEstimate = 1;
   this.formatCorrugationResolutionEstimate = "%.2f";
   this.corrugationResolutionEstimate = 0;

   // Wavefront error estimate in meters RMS.
   this.scaleWavefrontErrorEstimate = 1e9;
   this.formatWavefrontErrorEstimate = "%.1f";
   this.formatWavefrontErrorEstimateFraction = "%.1f";
   this.wavefrontErrorEstimate = 0;

   // Strehl ratio estimate.
   this.scaleStrehlRatioEstimate = 1;
   this.formatStrehlRatioEstimate = "%.3f";
   this.strehlRatioEstimate = 0;

   // Strehl diameter estimate in meters.
   this.scaleStrehlDiameterEstimate = 1e6;
   this.formatStrehlDiameterEstimate = "%.2f";
   this.strehlDiameterEstimate = 0;

   // Strehl diameter angle estimate in arcseconds.
   this.scaleStrehlDiameterAngleEstimate = 1;
   this.formatStrehlDiameterAngleEstimate = "%.2f";
   this.strehlDiameterAngleEstimate = 0;

   // Aberration coefficients estimate.
   this.scaleAberrationCoefficientsEstimate = 1e9;
   this.formatAberrationCoefficientsEstimate = "%.1f";
   this.scaleAberrationCoefficientsFVEEstimate = 100;
   this.formatAberrationCoefficientsFVEEstimate = "%.1f";
   this.aberrationCoefficientsEstimate = new Array();

   // Exposure estimate star magnitude.
   this.formatStarMagnitudeEstimate = "%.1f";
   this.scaleStarMagnitudeEstimate = 1;

   // Intra-focal combined image, combined frame count, and effective fram
   // count.
   this.intraFocalCombinedImage = new FrameReal(new Matrix(0, 0, 0));
   this.intraFocalActualFrameCount = 0;
   this.intraFocalCombinedFrameCount = 0;
   this.intraFocalEffectiveFrameCount = 0;

   // Intra-focal rejection map.
   this.intraFocalRejectionMap = new FrameReal(new Matrix(0, 0, 0));

   // Extra-focal combined image, combined frame count, and effective frame
   // count.
   this.extraFocalCombinedImage = new FrameReal(new Matrix(0, 0, 0));
   this.extraFocalActualFrameCount = 0;
   this.extraFocalCombinedFrameCount = 0;
   this.extraFocalEffectiveFrameCount = 0;

   // Extra-focal rejection map.
   this.extraFocalRejectionMap = new FrameReal(new Matrix(0, 0, 0));

   // Defocus threshold histogram bins.
   this.useDefocusThresholdHistogram = true;
   this.defocusThresholdHistogramBins = 128;
   this.defocusThresholdHistogramMinimumBins = 32;

   // Defocus threshold histogram neighborhood.
   this.defocusThresholdHistogramNeighborhood = 4;

   // Defocus threshold histogram sigma.
   this.defocusThresholdHistogramSigma = 3;

   // Defocus threshold fixed point iterations.
   this.defocusSignalFixedPointIterations = 3;

   // Defocus signal threshold factor and minimum defocus threshold.
   this.defocusSignalThresholdFactor = 0.15;
   this.minimumDefocusThreshold = 0.25 * this.defocusSignalThresholdFactor;

   // Intra-focal compensated image.
   this.intraFocalCompensatedImage = new FrameReal(new Matrix(0, 0, 0));

   // Extra-focal compensated image (inverted).
   this.extraFocalCompensatedImage = new FrameReal(new Matrix(0, 0, 0));

   // Defocus mesh in normalized units.
   this.defocusMesh = {
      x: new FrameReal(new Matrix(0, 0, 0)),
      y: new FrameReal(new Matrix(0, 0, 0))
   };

   // Wavefront estimate.
   this.wavefrontEstimate = new FrameReal(new Matrix(0, 0, 0));

   // Interferogram estimate.
   this.interferogramEstimateSagittal = new FrameReal(new Matrix(0, 0, 0));
   this.interferogramEstimateMeridional = new FrameReal(new Matrix(0, 0, 0));

   // Wavefront save scale and offset.
   this.wavefrontSaveScale = 5e5;
   this.wavefrontSaveOffset = 0.5;

   // Wavefront estimate contour plot.
   this.wavefrontEstimateContourPlot = new FrameReal(new Matrix(0, 0, 0));

   // Interferogram estimate plots.
   this.interferogramEstimateSagittalPlot =
      new FrameReal(new Matrix(0, 0, 0));
   this.interferogramEstimateMeridionalPlot =
      new FrameReal(new Matrix(0, 0, 0));

   // Point spread function ideal and estimate.
   this.pointSpreadFunctionIdeal = new FrameReal(new Matrix(0, 0, 0));
   this.pointSpreadFunctionEstimate = new FrameReal(new Matrix(0, 0, 0));

   // Point spread function pixel size in meters.
   this.pointSpreadFunctionPixelSize = 0;

   // Encircled energy function maximum diameter in meters.
   this.encircledEnergyFunctionMaximumDiameter = 0;

   // Encircled energy function ideal and estimate.
   this.encircledEnergyFunctionIdeal = new Array();
   this.encircledEnergyFunctionEstimate = new Array();

   // Encircled energy function EE50 and EE80 diameters in meters.
   this.encircledEnergyFunctionEE50Diameter = 0;
   this.encircledEnergyFunctionEE80Diameter = 0;

   // Encircled energy plot.
   this.encircledEnergyPlot = new Image();

   // Modulation transfer function ideal and estimate.
   this.modulationTransferFunctionIdeal =
      new FrameReal(new Matrix(0, 0, 0));
   this.modulationTransferFunctionEstimate =
      new FrameReal(new Matrix(0, 0, 0));

   // Maximum spatial frequency optics and detector in lp/mm.
   this.maximumSpatialFrequencyOptics = 0;
   this.maximumSpatialFrequencyDetector = 0;

   // Modulation transfer function optics ideal and estimate.
   this.modulationTransferFunctionOpticsIdeal = new Array();
   this.modulationTransferFunctionOpticsSagittal = new Array();
   this.modulationTransferFunctionOpticsMeridional = new Array();

   // Modulation transfer function detector ideal and estimate.
   this.modulationTransferFunctionDetectorIdeal = new Array();
   this.modulationTransferFunctionDetectorSagittal = new Array();
   this.modulationTransferFunctionDetectorMeridional = new Array();

   // Modulation transfer function plot.
   this.modulationTransferFunctionPlot = new Image();

   // Metrics formats.
   this.formatCombinedFrameCount = "%d";
   this.formatEffectiveFrameCount = "%.2f";
   this.scaleDefocusThreshold = this.DNPerNormalizedUnit;
   this.formatDefocusThreshold = "%.1f";
   this.formatDefocusThresholdScale = "%.2f";
   this.scaleDefocusBarycenter = 1;
   this.formatDefocusBarycenter = "%.2f";
   this.formatDefocusBarycenterScale = "%.3f";
   this.scaleDefocusDiameter = 1;
   this.formatDefocusDiameter = "%.2f";
   this.formatDefocusDiameterScale = "%.3f";
   this.scaleDefocusSignal = this.DNPerNormalizedUnit;
   this.formatDefocusSignal = "%.1f";
   this.formatDefocusSignalScale = "%.2f";
   this.scaleDefocusSignalElectrons = 1;
   this.formatDefocusSignalElectrons = "%.0f";
   this.scaleDefocusNoise = this.DNPerNormalizedUnit;
   this.formatDefocusNoise = "%.2f";

   // Defocus domain.
   this.defocusDomain = new FrameReal(new Matrix(0, 0, 0));

   // Hot pixel removal radius in pixels.
   this.hotPixelRemovalRadius = 1;

   // Defocus diameter limits in pixels.
   this.minimumDefocusDiameter = 32;
   this.maximumDefocusDiameter = 320;

   // Defocus signal limits in normalized units.
   this.minimumDefocusSignal = 0.05;
   this.maximumDefocusSignal = 0.8;

   // Errors.
   this.frameIsNotMonochrome =
      "The frame is not monochrome.";
   this.defocusedImageDiameterTooSmall =
      "The defocused image diameter is too small.";
   this.defocusedImageDiameterTooLarge =
      "The defocused image diameter is too large.";
   this.defocusedImageSignalTooSmall =
      "The defocused image signal is too small.";
   this.defocusedImageSignalTooLarge =
      "The defocused image signal is too large.";
   this.defocusThresholdEstimationDidNotConverge =
      "The defocus threshold estimation process did not converge.";
   this.wavefrontRefinementDidNotConverge =
      "The wavefront estimation process did not converge.";

   // Loads core settings.
   this.loadSettings = function() {
      this.framesFullPaths = defaultBoolean(
         Settings.read("framesFullPaths", DataType_Boolean),
         this.defaultFramesFullPaths
      );

      this.outputDirectoryFullPath = defaultBoolean(
         Settings.read("outputDirectoryFullPath", DataType_Boolean),
         this.defaultOutputDirectoryFullPath
      );

      this.apertureDiameter = defaultNumeric(
         Settings.read("apertureDiameter", DataType_Real32),
         this.minimumApertureDiameter,
         this.maximumApertureDiameter,
         this.defaultApertureDiameter
      );
      this.focalLength = defaultNumeric(
         Settings.read("focalLength", DataType_Real32),
         this.minimumFocalLength,
         this.maximumFocalLength,
         this.defaultFocalLength
      );

      this.detectorType = defaultNumeric(
         Settings.read("detectorType", DataType_Int32),
         this.minimumDetectorType,
         this.maximumDetectorType,
         this.defaultDetectorType
      );
      this.gain = defaultNumeric(
         Settings.read("gain", DataType_Real32),
         this.minimumGain,
         this.maximumGain,
         this.defaultGain
      );
      this.pixelSize = defaultNumeric(
         Settings.read("pixelSize", DataType_Real32),
         this.minimumPixelSize,
         this.maximumPixelSize,
         this.defaultPixelSize
      );

      this.observationWavelength = defaultNumeric(
         Settings.read("observationWavelength", DataType_Real32),
         this.minimumObservationWavelength,
         this.maximumObservationWavelength,
         this.defaultObservationWavelength
      );

      this.rejectionMethod = defaultNumeric(
         Settings.read("rejectionMethod", DataType_Int32),
         this.minimumRejectionMethod,
         this.maximumRejectionMethod,
         this.defaultRejectionMethod
      );
      this.rejectionScale = defaultNumeric(
         Settings.read("rejectionScale", DataType_Real32),
         this.minimumRejectionScale,
         this.maximumRejectionScale,
         this.defaultRejectionScale
      );

      this.identifierPrefix =
         Settings.read("identifierPrefix", DataType_String);
      if (this.identifierPrefix == null) {
         this.identifierPrefix = this.defaultIdentifierPrefix;
      }
      this.fringeCountScale = defaultNumeric(
         Settings.read("fringeCountScale", DataType_Real32),
         this.minimumFringeCountScale,
         this.maximumFringeCountScale,
         this.defaultFringeCountScale
      );
      this.generateViews = defaultBoolean(
         Settings.read("generateViews", DataType_Boolean),
         this.defaultGenerateViews
      );

      this.aberrationOrdering = defaultNumeric(
         Settings.read("aberrationOrdering", DataType_Int32),
         this.minimumAberrationOrdering,
         this.maximumAberrationOrdering,
         this.defaultAberrationOrdering
      );

      this.defocusExposure = defaultNumeric(
         Settings.read("defocusExposure", DataType_Real32),
         this.minimumDefocusExposure,
         this.maximumDefocusExposure,
         this.defaultDefocusExposure
      );
      this.observationBandwidth = defaultNumeric(
         Settings.read("observationBandwidth", DataType_Int32),
         this.minimumObservationBandwidth,
         this.maximumObservationBandwidth,
         this.defaultObservationBandwidth
      );
      this.corrugationResolution = defaultNumeric(
         Settings.read("corrugationResolution", DataType_Real32),
         this.minimumCorrugationResolution,
         this.maximumCorrugationResolution,
         this.defaultCorrugationResolution
      );
      this.exposureTime = defaultNumeric(
         Settings.read("exposureTime", DataType_Real32),
         this.minimumExposureTime,
         this.maximumExposureTime,
         this.defaultExposureTime
      );
   };

   // Stores core settings.
   this.storeSettings = function() {
      Settings.write(
         "version",
         DataType_String,
         VERSION
      );

      Settings.write(
         "framesFullPaths",
         DataType_Boolean,
         this.framesFullPaths
      );

      Settings.write(
         "outputDirectoryFullPath",
         DataType_Boolean,
         this.outputDirectoryFullPath
      );

      Settings.write(
         "apertureDiameter",
         DataType_Real32,
         this.apertureDiameter
      );
      Settings.write(
         "focalLength",
         DataType_Real32,
         this.focalLength
      );

      Settings.write(
         "detectorType",
         DataType_Int32,
         this.detectorType
      );
      Settings.write(
         "gain",
         DataType_Real32,
         this.gain
      );
      Settings.write(
         "pixelSize",
         DataType_Real32,
         this.pixelSize
      );

      Settings.write(
         "observationWavelength",
         DataType_Real32,
         this.observationWavelength
      );

      Settings.write(
         "rejectionMethod",
         DataType_Int32,
         this.rejectionMethod
      );
      Settings.write(
         "rejectionScale",
         DataType_Real32,
         this.rejectionScale
      );

      Settings.write(
         "identifierPrefix",
         DataType_String,
         this.identifierPrefix
      );
      Settings.write(
         "fringeCountScale",
         DataType_Real32,
         this.fringeCountScale
      );
      Settings.write(
         "generateViews",
         DataType_Boolean,
         this.generateViews
      );

      Settings.write(
         "aberrationOrdering",
         DataType_Int32,
         this.aberrationOrdering
      );

      Settings.write(
         "defocusExposure",
         DataType_Real32,
         this.defocusExposure
      );
      Settings.write(
         "observationBandwidth",
         DataType_Int32,
         this.observationBandwidth
      );
      Settings.write(
         "corrugationResolution",
         DataType_Real32,
         this.corrugationResolution
      );
      Settings.write(
         "exposureTime",
         DataType_Real32,
         this.exposureTime
      );
   };

   // Loads instance parameters.
   this.loadParameters = function() {
      this.intraFocalFramePaths = new Array();
      for (var i = 0; Parameters.hasIndexed("intraFocalFramePath", i); ++i) {
         var string = Parameters.getStringIndexed("intraFocalFramePath", i);
         if (string != null) {
            this.intraFocalFramePaths.push(string);
         }
      }
      if (Parameters.has("framesFullPaths")) {
         this.framesFullPaths = defaultBoolean(
            Parameters.getBoolean("framesFullPaths"),
            this.defaultFramesFullPaths
         );
      }

      this.extraFocalFramePaths = new Array();
      for (var i = 0; Parameters.hasIndexed("extraFocalFramePath", i); ++i) {
         var string = Parameters.getStringIndexed("extraFocalFramePath", i);
         if (string != null) {
            this.extraFocalFramePaths.push(string);
         }
      }

      if (Parameters.has("outputDirectoryPath")) {
         var string = Parameters.getString("outputDirectoryPath");
         if (string != null) {
            this.outputDirectoryPath = string;
         }
      }
      if (Parameters.has("outputDirectoryFullPath")) {
         this.outputDirectoryFullPath = defaultBoolean(
            Parameters.getBoolean("outputDirectoryFullPath"),
            this.defaultOutputDirectoryFullPath
         );
      }

      if (Parameters.has("apertureDiameter")) {
         this.apertureDiameter = defaultNumeric(
            Parameters.getReal("apertureDiameter"),
            this.minimumApertureDiameter,
            this.maximumApertureDiameter,
            this.defaultApertureDiameter
         );
      }
      if (Parameters.has("focalLength")) {
         this.focalLength = defaultNumeric(
            Parameters.getReal("focalLength"),
            this.minimumFocalLength,
            this.maximumFocalLength,
            this.defaultFocalLength
         );
      }

      if (Parameters.has("detectorType")) {
         this.detectorType = defaultNumeric(
            Parameters.getInteger("detectorType"),
            this.minimumDetectorType,
            this.maximumDetectorType,
            this.defaultDetectorType
         );
      }
      if (Parameters.has("gain")) {
         this.gain = defaultNumeric(
            Parameters.getReal("gain"),
            this.minimumGain,
            this.maximumGain,
            this.defaultGain
         );
      }
      if (Parameters.has("pixelSize")) {
         this.pixelSize = defaultNumeric(
            Parameters.getReal("pixelSize"),
            this.minimumPixelSize,
            this.maximumPixelSize,
            this.defaultPixelSize
         );
      }

      if (Parameters.has("observationWavelength")) {
         this.observationWavelength = defaultNumeric(
            Parameters.getReal("observationWavelength"),
            this.minimumObservationWavelength,
            this.maximumObservationWavelength,
            this.defaultObservationWavelength
         );
      }

      if (Parameters.has("rejectionMethod")) {
         this.rejectionMethod = defaultNumeric(
            Parameters.getInteger("rejectionMethod"),
            this.minimumRejectionMethod,
            this.maximumRejectionMethod,
            this.defaultRejectionMethod
         );
      }
      if (Parameters.has("rejectionScale")) {
         this.rejectionScale = defaultNumeric(
            Parameters.getReal("rejectionScale"),
            this.minimumRejectionScale,
            this.maximumRejectionScale,
            this.defaultRejectionScale
         );
      }

      if (Parameters.has("identifierPrefix")) {
         var string = Parameters.getString("identifierPrefix");
         if (string != null) {
            this.identifierPrefix = string;
         }
      }
      if (Parameters.has("fringeCountScale")) {
         this.fringeCountScale = defaultNumeric(
            Parameters.getReal("fringeCountScale"),
            this.minimumFringeCountScale,
            this.maximumFringeCountScale,
            this.defaultFringeCountScale
         );
      }
      if (Parameters.has("generateViews")) {
         this.generateViews = defaultBoolean(
            Parameters.getBoolean("generateViews"),
            this.defaultGenerateViews
         );
      }

      if (Parameters.has("aberrationOrdering")) {
         this.aberrationOrdering = defaultNumeric(
            Parameters.getInteger("aberrationOrdering"),
            this.minimumAberrationOrdering,
            this.maximumAberrationOrdering,
            this.defaultAberrationOrdering
         );
      }

      if (Parameters.has("defocusExposure")) {
         this.defocusExposure = defaultNumeric(
            Parameters.getReal("defocusExposure"),
            this.minimumDefocusExposure,
            this.maximumDefocusExposure,
            this.defaultDefocusExposure
         );
      }
      if (Parameters.has("observationBandwidth")) {
         this.observationBandwidth = defaultNumeric(
            Parameters.getInteger("observationBandwidth"),
            this.minimumObservationBandwidth,
            this.maximumObservationBandwidth,
            this.defaultObservationBandwidth
         );
      }
      if (Parameters.has("corrugationResolution")) {
         this.corrugationResolution = defaultNumeric(
            Parameters.getReal("corrugationResolution"),
            this.minimumCorrugationResolution,
            this.maximumCorrugationResolution,
            this.defaultCorrugationResolution
         );
      }
      if (Parameters.has("exposureTime")) {
         this.exposureTime = defaultNumeric(
            Parameters.getReal("exposureTime"),
            this.minimumExposureTime,
            this.maximumExposureTime,
            this.defaultExposureTime
         );
      }
   };

   // Stores instance parameters.
   this.storeParameters = function() {
      Parameters.clear();

      Parameters.set("version", VERSION);

      for (var i = 0; i != this.intraFocalFramePaths.length; ++i) {
         Parameters.setIndexed(
            "intraFocalFramePath", i, this.intraFocalFramePaths[i]
         );
      }
      Parameters.set("framesFullPaths", this.framesFullPaths);

      for (var i = 0; i != this.extraFocalFramePaths.length; ++i) {
         Parameters.setIndexed(
            "extraFocalFramePath", i, this.extraFocalFramePaths[i]
         );
      }

      if (this.outputDirectoryPath != null) {
         Parameters.set("outputDirectoryPath", this.outputDirectoryPath);
      }
      Parameters.set("outputDirectoryFullPath", this.outputDirectoryFullPath);

      Parameters.set("apertureDiameter", this.apertureDiameter);
      Parameters.set("focalLength", this.focalLength);

      Parameters.set("detectorType", this.detectorType);
      Parameters.set("gain", this.gain);
      Parameters.set("pixelSize", this.pixelSize);

      Parameters.set("observationWavelength", this.observationWavelength);

      Parameters.set("rejectionMethod", this.rejectionMethod);
      Parameters.set("rejectionScale", this.rejectionScale);

      Parameters.set("identifierPrefix", this.identifierPrefix);
      Parameters.set("fringeCountScale", this.fringeCountScale);
      Parameters.set("generateViews", this.generateViews);

      Parameters.set("aberrationOrdering", this.aberrationOrdering);

      Parameters.set("defocusExposure", this.defocusExposure);
      Parameters.set("observationBandwidth", this.observationBandwidth);
      Parameters.set("corrugationResolution", this.corrugationResolution);
      Parameters.set("exposureTime", this.exposureTime);
   };

   // Clears the model.
   this.clear = function() {
      this.intraFocalCombinedImage.clear();
      this.intraFocalRejectionMap.clear();
      this.extraFocalCombinedImage.clear();
      this.extraFocalRejectionMap.clear();
      this.intraFocalCompensatedImage.clear();
      this.extraFocalCompensatedImage.clear();
      this.defocusMesh.x.clear();
      this.defocusMesh.y.clear();
      this.wavefrontEstimate.clear();
      this.interferogramEstimateSagittal.clear();
      this.interferogramEstimateMeridional.clear();
      this.wavefrontEstimateContourPlot.clear();
      this.interferogramEstimateSagittalPlot.clear();
      this.interferogramEstimateMeridionalPlot.clear();
      this.pointSpreadFunctionIdeal.clear();
      this.pointSpreadFunctionEstimate.clear();
      this.modulationTransferFunctionIdeal.clear();
      this.modulationTransferFunctionEstimate.clear();
      this.defocusDomain.clear();
   };
}

// ****************************************************************************
// EOF MainModel.js - Released 2016/12/30 00:00:00 UTC
