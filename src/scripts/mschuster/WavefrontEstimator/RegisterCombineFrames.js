// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// RegisterCombineFrames.js - Released 2016/12/30 00:00:00 UTC
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

function RegisterCombineFrames(model, view, controller) {
   // Maximum image size in pixels.
   this.maximumImageSize = 512;

   // Minimum crop size.
   this.minimumCropSize = 256;

   // Crop frame down sampling factor.
   this.cropFrameDownSampling = 16;

   // Crop frame up scaling factor.
   this.cropFrameUpScaling = 1.5;

   // Register frame padding in pixels.
   this.registerFramePadding = this.cropFrameDownSampling;

   // Gives open image hints.
   this.openImageHints = function() {
      return "";
   };

   this.openImage = function(path, hints) {
      var imageWindows = ImageWindow.open(path);
      console.abortEnabled = false; // workaround for 1123 bug.
      if (imageWindows.length == 0) {
         throw new Error("abort");
      }

      try {
         var image = imageWindows[0].mainView.image;
         var keywords = imageWindows[0].keywords;
         var pedestal = 0;
         if (!image.isGrayscale || image.isComplex) {
            throw new Error(model.frameIsNotMonochrome);
         }
         for (var i = 0; i != keywords.length; ++i) {
            var keyword = keywords[i];
            if (keyword.name == "PEDESTAL") {
               pedestal = defaultNumeric(
                  parseFloat(keyword.value), 0, model.DNPerNormalizedUnit, 0
               ) / model.DNPerNormalizedUnit;
            }
         }

         var frame = new FrameReal(image.toMatrix(image.bounds, 0));

         if (pedestal != 0) {
            frame = frame.stagePipeline([
               function(frame) {return frame.offset(-pedestal);}
            ]);
         }
      }
      finally {
         for (var i = 0; i != imageWindows.length; ++i) {
            imageWindows[i].forceClose();
         }
      }

      return {
         image: frame,
         keywords: keywords
      };
   };

   this.cropFrame = function(frame) {
      var median = frame.median();

      if (Math.max(frame.rows(), frame.cols()) > this.minimumCropSize) {
         var subFrame = frame.downSample(this.cropFrameDownSampling);
         if ((subFrame.rows() % 2) == 1) {
            subFrame = subFrame.stagePipeline([
               function(frame) {return frame.padRows(0, -1, 0);}
            ]);
         }
         if ((subFrame.cols() % 2) == 1) {
            subFrame = subFrame.stagePipeline([
               function(frame) {return frame.padCols(0, -1, 0);}
            ]);
         }

         var defocusThreshold =
            model.minimumDefocusThreshold /
            Math.sqrt(this.cropFrameDownSampling);
         if (defocusThreshold == 0) {
            throw new Error(model.defocusThresholdEstimationDidNotConverge);
         }
         var apertureMetrics = subFrame.apertureMetrics(
            defocusThreshold, model.hotPixelRemovalRadius
         );
         var metrics = apertureMetrics.metrics;
         apertureMetrics.mask.clear();
         if (metrics.radius == 0) {
            throw new Error(model.defocusThresholdEstimationDidNotConverge);
         }
         subFrame.clear();

         var radius = this.cropFrameUpScaling * metrics.radius;
         var bounds = new Rect(
            Math.floor(
               this.cropFrameDownSampling * (metrics.barycenter.x - radius)
            ),
            Math.floor(
               this.cropFrameDownSampling * (metrics.barycenter.y - radius)
            ),
            Math.ceil(
               this.cropFrameDownSampling * (metrics.barycenter.x + radius)
            ),
            Math.ceil(
               this.cropFrameDownSampling * (metrics.barycenter.y + radius)
            )
         );
         var size =
            Math.round(Math.pow2(Math.ceil(Math.log2(
               Math.max(bounds.width, bounds.height)
            )))) + 2 * this.registerFramePadding;

         if (bounds.width != size) {
            var low = Math.floor(0.5 * (size - bounds.width));
            var high = (size - bounds.width) - low;
            bounds.x0 -= low;
            bounds.x1 += high;
         }
         if (bounds.height != size) {
            var low = Math.floor(0.5 * (size - bounds.height));
            var high = (size - bounds.height) - low;
            bounds.y0 -= low;
            bounds.y1 += high;
         }

         var translation = new Point(bounds.x0, bounds.y0);
         var cropFrame = frame.clone().stagePipeline([
            function(frame) {
               return frame.padRows(
                  -bounds.y0, -(frame.rows() - bounds.y1), median
               );
            },
            function(frame) {
               return frame.padCols(
                  -bounds.x0, -(frame.cols() - bounds.x1), median
               );
            }
         ]);

         var defocusThreshold =
            model.minimumDefocusThreshold;
         if (defocusThreshold == 0) {
            throw new Error(model.defocusThresholdEstimationDidNotConverge);
         }
         var apertureMetrics = cropFrame.apertureMetrics(
            defocusThreshold, model.hotPixelRemovalRadius
         );
         var metrics = apertureMetrics.metrics;
         apertureMetrics.mask.clear();
         if (metrics.radius == 0) {
            throw new Error(model.defocusThresholdEstimationDidNotConverge);
         }
         cropFrame.clear();

         var radius = this.cropFrameUpScaling * metrics.radius;
         var bounds = new Rect(
            Math.floor(
               (metrics.barycenter.x + translation.x - radius)
            ),
            Math.floor(
               (metrics.barycenter.y + translation.y - radius)
            ),
            Math.ceil(
               (metrics.barycenter.x + translation.x + radius)
            ),
            Math.ceil(
               (metrics.barycenter.y + translation.y + radius)
            )
         );
         var size =
            Math.round(Math.pow2(Math.ceil(Math.log2(
               Math.max(bounds.width, bounds.height)
            )))) + 2 * this.registerFramePadding;

         if (bounds.width != size) {
            var low = Math.floor(0.5 * (size - bounds.width));
            var high = (size - bounds.width) - low;
            bounds.x0 -= low;
            bounds.x1 += high;
         }
         if (bounds.height != size) {
            var low = Math.floor(0.5 * (size - bounds.height));
            var high = (size - bounds.height) - low;
            bounds.y0 -= low;
            bounds.y1 += high;
         }

         var translation = new Point(bounds.x0, bounds.y0);
         var cropFrame = frame.clone().stagePipeline([
            function(frame) {
               return frame.padRows(
                  -bounds.y0, -(frame.rows() - bounds.y1), median
               );
            },
            function(frame) {
               return frame.padCols(
                  -bounds.x0, -(frame.cols() - bounds.x1), median
               );
            }
         ]);
      }
      else {
         var translation = new Point(
            -this.registerFramePadding, -this.registerFramePadding
         );
         var self = this;
         var cropFrame = frame.clone().stagePipeline([
            function(frame) {
               return frame.padRows(
                  self.registerFramePadding, self.registerFramePadding, median
               );
            },
            function(frame) {
               return frame.padCols(
                  self.registerFramePadding, self.registerFramePadding, median
               );
            }
         ]);
      }

      if (
         Math.max(cropFrame.rows(), cropFrame.cols()) -
            2 * this.registerFramePadding >
         this.maximumImageSize
      ) {
         throw new Error(model.defocusedImageDiameterTooLarge);
      }
      var size =
         Math.round(Math.pow2(Math.ceil(Math.log2(
            Math.max(cropFrame.rows(), cropFrame.cols()) -
            2 * this.registerFramePadding
         )))) + 2 * this.registerFramePadding;

      if (cropFrame.cols() != size) {
         var low = Math.floor(0.5 * (size - cropFrame.cols()));
         translation.x -= low;
         var high = (size - cropFrame.cols()) - low;
         cropFrame = cropFrame.stagePipeline([
            function(frame) {return frame.padCols(low, high, median);}
         ]);
      }
      if (cropFrame.rows() != size) {
         var low = Math.floor(0.5 * (size - cropFrame.rows()));
         translation.y -= low;
         var high = (size - cropFrame.rows()) - low;
         cropFrame = cropFrame.stagePipeline([
            function(frame) {return frame.padRows(low, high, median);}
         ]);
      }

      return {
         frame: cropFrame,
         metrics: {
            translation: translation,
            median: median
         }
      };
   };

   this.registerFrame = function(
      frame, defocusThreshold, centerOffset, quantizeTranslation
   ) {
      if (defocusThreshold == 0) {
         throw new Error(model.defocusThresholdEstimationDidNotConverge);
      }
      var apertureMetrics = frame.apertureMetrics(
         defocusThreshold, model.hotPixelRemovalRadius
      );
      var metrics = apertureMetrics.metrics;
      apertureMetrics.mask.clear();
      if (metrics.radius == 0) {
         throw new Error(model.defocusThresholdEstimationDidNotConverge);
      }
      if (2 * metrics.radius < model.minimumDefocusDiameter) {
         throw new Error(model.defocusedImageDiameterTooSmall);
      }
      if (2 * metrics.radius > model.maximumDefocusDiameter) {
         throw new Error(model.defocusedImageDiameterTooLarge);
      }
      if (metrics.signal < model.minimumDefocusSignal) {
         throw new Error(model.defocusedImageSignalTooSmall);
      }
      if (metrics.signal > model.maximumDefocusSignal) {
         throw new Error(model.defocusedImageSignalTooLarge);
      }

      var rows = frame.rows();
      var cols = frame.cols();
      var translation = new Point(
         metrics.barycenter.x - 0.5 * (cols - 1) - centerOffset,
         metrics.barycenter.y - 0.5 * (rows - 1) - centerOffset
      );
      if (quantizeTranslation) {
         translation.x = Math.round(translation.x);
         translation.y = Math.round(translation.y);
      }

      var rowMatrix = new Matrix(rows, cols);
      var colMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            rowMatrix.at(row, col, row + translation.y);
            colMatrix.at(row, col, col + translation.x);
         }
      }

      var rowFrame = new FrameReal(rowMatrix);
      var colFrame = new FrameReal(colMatrix);
      var interpolateBase = frame.bilinearInterpolate(rowFrame, colFrame);
      rowFrame.clear();
      colFrame.clear();

      var registerFramePadding = this.registerFramePadding;
      return {
         frame: interpolateBase.stagePipeline([
            function(frame) {
               return frame.padRows(
                  -registerFramePadding, -registerFramePadding, 0);
               },
            function(frame) {
               return frame.padCols(
                  -registerFramePadding, -registerFramePadding, 0
               );
            }
         ]),
         metrics: metrics
      };
   };

   this.registerFrames = function() {
      function writeRegisteredFrameMetrics(
         metrics, defocusThreshold, effectiveFrameCount
      ) {
         console.writeln("Defocus threshold: ", format(
            model.formatDefocusThreshold + " DN",
            model.scaleDefocusThreshold * defocusThreshold
         ));
         console.writeln("Defocus barycenter.x: ", format(
            model.formatDefocusBarycenter + " px", metrics.barycenter.x
         ));
         console.writeln("Defocus barycenter.y: ", format(
            model.formatDefocusBarycenter + " px", metrics.barycenter.y
         ));
         console.writeln("Defocus diameter: ", format(
            model.formatDefocusDiameter + " px", 2 * metrics.radius
         ));
         console.writeln("Defocus obstruction diameter: ", format(
            model.formatDefocusDiameter + " px", 2 * metrics.obstructionRadius
         ));
         console.writeln("Defocus exposure: ",
            format(
               model.formatDefocusSignal + " DN",
               model.scaleDefocusSignal * metrics.signal
            ),
            format(
               ", " + model.formatDefocusExposure + " e-",
               model.scaleDefocusExposure * model.gain *
                  model.scaleDefocusSignal *
                  effectiveFrameCount * metrics.signal
            )
         );
      }

      function writeRegisteredFramesMetricsSummary(
         metrics, defocusThresholds
      ) {
         var barycenterXs = new Array();
         var barycenterYs = new Array();
         var radiuses = new Array();
         var obstructionRadiuses = new Array();
         var signals = new Array();
         for (var i = 0; i != metrics.length; ++i) {
            barycenterXs.push(metrics[i].barycenter.x);
            barycenterYs.push(metrics[i].barycenter.y);
            radiuses.push(metrics[i].radius);
            obstructionRadiuses.push(metrics[i].obstructionRadius);
            signals.push(metrics[i].signal);
         }
         console.writeln("Defocus threshold: ",
            format(
               "location: " + model.formatDefocusThreshold + " DN",
               model.scaleDefocusThreshold *
                  medianArraySideEffect(defocusThresholds)
            ),
            format(
               ", scale: " + model.formatDefocusThresholdScale + " DN",
               model.scaleDefocusThreshold *
                  1.1926 * SnArraySideEffect(defocusThresholds)
            )
         );
         console.writeln("Defocus barycenter.x: ",
            format(
               "location: " + model.formatDefocusBarycenter + " px",
               medianArraySideEffect(barycenterXs)
            ),
            format(
               ", scale: " + model.formatDefocusBarycenterScale + " px",
               1.1926 * SnArraySideEffect(barycenterXs)
            )
         );
         console.writeln("Defocus barycenter.y: ",
            format(
               "location: " + model.formatDefocusBarycenter + " px",
               medianArraySideEffect(barycenterYs)
            ),
            format(
               ", scale: " + model.formatDefocusBarycenterScale + " px",
               1.1926 * SnArraySideEffect(barycenterYs)
            )
         );
         console.writeln("Defocus diameter: ",
            format(
               "location: " + model.formatDefocusDiameter + " px",
               2 * medianArraySideEffect(radiuses)
            ),
            format(
               ", scale: " + model.formatDefocusDiameterScale + " px",
               2 * 1.1926 * SnArraySideEffect(radiuses)
            )
         );
         console.writeln("Defocus obstruction diameter: ",
            format(
               "location: " + model.formatDefocusDiameter + " px",
               2 * medianArraySideEffect(obstructionRadiuses)
            ),
            format(
               ", scale: " + model.formatDefocusDiameterScale + " px",
               2 * 1.1926 * SnArraySideEffect(obstructionRadiuses)
            )
         );
         console.writeln("Defocus exposure: ",
            format(
               "location: " + model.formatDefocusSignal + " DN",
               model.scaleDefocusSignal * medianArraySideEffect(signals)
            ),
            format(
               ", scale: " + model.formatDefocusSignalScale + " DN",
               model.scaleDefocusSignal * 1.1926 * SnArraySideEffect(signals)
            )
         );
      }

      {
         var intraFocalFrames = new Array();
         var intraFocalKeywords = new Array();
         var intraFocalCropFrameMetrics = new Array();
         for (var i = 0; i != model.intraFocalFramePaths.length; ++i) {
            var frameKeywords = this.openImage(
               model.intraFocalFramePaths[i], this.openImageHints()
            );
            var intraFocalFrame = frameKeywords.image;
            var keywords = frameKeywords.keywords;

            var self = this;
            var cropFrameMetrics = intraFocalFrame.stagePipeline([
               function(frame) {return frame.truncate(0, 1);},
               function(frame) {return self.cropFrame(frame);}
            ]);

            intraFocalFrames.push(cropFrameMetrics.frame);
            intraFocalKeywords.push(keywords);
            intraFocalCropFrameMetrics.push(cropFrameMetrics.metrics);

            gc();
            view.throwAbort();
         }
      }

      {
         var extraFocalFrames = new Array();
         var extraFocalKeywords = new Array();
         var extraFocalCropFrameMetrics = new Array();
         for (var i = 0; i != model.extraFocalFramePaths.length; ++i) {
            var frameKeywords = this.openImage(
               model.extraFocalFramePaths[i], this.openImageHints()
            );
            var extraFocalFrame = frameKeywords.image;
            var keywords = frameKeywords.keywords;

            var self = this;
            var cropFrameMetrics = extraFocalFrame.stagePipeline([
               function(frame) {return frame.truncate(0, 1);},
               function(frame) {return self.cropFrame(frame);}
            ]);

            extraFocalFrames.push(cropFrameMetrics.frame);
            extraFocalKeywords.push(keywords);
            extraFocalCropFrameMetrics.push(cropFrameMetrics.metrics);

            gc();
            view.throwAbort();
         }
      }

      {
         var maxCols = intraFocalFrames[0].cols();
         var maxRows = intraFocalFrames[0].rows();
         for (var i = 0; i != intraFocalFrames.length; ++i) {
            maxCols = Math.max(maxCols, intraFocalFrames[i].cols());
            maxRows = Math.max(maxRows, intraFocalFrames[i].rows());
         }
         for (var i = 0; i != extraFocalFrames.length; ++i) {
            maxCols = Math.max(maxCols, extraFocalFrames[i].cols());
            maxRows = Math.max(maxRows, extraFocalFrames[i].rows());
         }

         for (var i = 0; i != intraFocalFrames.length; ++i) {
            var frame = intraFocalFrames[i];
            if (frame.cols() != maxCols) {
               var low = Math.floor(0.5 * (maxCols - frame.cols()));
               intraFocalCropFrameMetrics[i].translation.x -= low;
               var high = (maxCols - frame.cols()) - low;
               frame = frame.stagePipeline([
                  function(frame) {
                     return frame.padCols(
                        low, high, intraFocalCropFrameMetrics[i].median
                     );
                  }
               ]);
            }
            if (frame.rows() != maxRows) {
               var low = Math.floor(0.5 * (maxRows - frame.rows()));
               intraFocalCropFrameMetrics[i].translation.y -= low;
               var high = (maxRows - frame.rows()) - low;
               frame = frame.stagePipeline([
                  function(frame) {
                     return frame.padRows(
                        low, high, intraFocalCropFrameMetrics[i].median
                     );
                  }
               ]);
            }
            intraFocalFrames[i] = frame;
         }

         for (var i = 0; i != extraFocalFrames.length; ++i) {
            var frame = extraFocalFrames[i];
            if (frame.cols() != maxCols) {
               var low = Math.floor(0.5 * (maxCols - frame.cols()));
               extraFocalCropFrameMetrics[i].translation.x -= low;
               var high = (maxCols - frame.cols()) - low;
               frame = frame.stagePipeline([
                  function(frame) {
                     return frame.padCols(
                        low, high, extraFocalCropFrameMetrics[i].median
                     );
                  }
               ]);
            }
            if (frame.rows() != maxRows) {
               var low = Math.floor(0.5 * (maxRows - frame.rows()));
               extraFocalCropFrameMetrics[i].translation.y -= low;
               var high = (maxRows - frame.rows()) - low;
               frame = frame.stagePipeline([
                  function(frame) {
                     return frame.padRows(
                        low, high, extraFocalCropFrameMetrics[i].median
                     );
                  }
               ]);
            }
            extraFocalFrames[i] = frame;
         }
      }

      {
         var intraFocalThresholds = new Array();
         var intraFocalEffectiveFrameCounts = new Array();
         for (var i = 0; i != intraFocalFrames.length; ++i) {
            console.writeln();
            console.writeln("<b>Intra-focal frame defocus threshold:</b> ");
            console.writeln(model.intraFocalFramePaths[i]);
            console.flush();

            var intraFocalEffectiveFrameCount = 1;
            for (var j = 0; j != intraFocalKeywords[i].length; ++j) {
               var keyword = intraFocalKeywords[i][j];
               if (keyword.name == "WEEFCNT") {
                  intraFocalEffectiveFrameCount =
                     defaultNumeric(parseFloat(keyword.value), 1, 1000, 1);
               }
            }

            if (model.useDefocusThresholdHistogram) {
               var medianIntraFocalFrame =
                  intraFocalFrames[i].medianFilter(model.hotPixelRemovalRadius);
               var defocusThreshold = Math.max(
                  model.minimumDefocusThreshold,
                  medianIntraFocalFrame.defocusThresholdHistogram(
                     model.defocusThresholdHistogramBins,
                     model.defocusThresholdHistogramMinimumBins,
                     model.defocusThresholdHistogramNeighborhood,
                     model.defocusThresholdHistogramSigma
                  )
               );
               medianIntraFocalFrame.clear();
            }
            else {
               var defocusThreshold = model.minimumDefocusThreshold;
            }

            for (
               var k = 0;
               k != Math.max(1, model.defocusSignalFixedPointIterations);
               ++k
            ) {
               if (defocusThreshold == 0) {
                  throw new Error(
                     model.defocusThresholdEstimationDidNotConverge
                  );
               }
               var apertureMetrics =
                  intraFocalFrames[i].apertureMetrics(
                     defocusThreshold, model.hotPixelRemovalRadius
                  );
               var metrics = apertureMetrics.metrics;
               apertureMetrics.mask.clear();
               if (metrics.radius == 0) {
                  throw new Error(
                     model.defocusThresholdEstimationDidNotConverge
                  );
               }
               defocusThreshold = Math.max(
                  0,
                  model.defocusSignalThresholdFactor * metrics.signal
               );
               view.throwAbort();
            }
            intraFocalThresholds.push(defocusThreshold);
            intraFocalEffectiveFrameCounts.push(intraFocalEffectiveFrameCount);

            console.writeln("Defocus threshold: ", format(
               model.formatDefocusThreshold + " DN",
               model.scaleDefocusThreshold * defocusThreshold)
            );
            console.flush();

            view.throwAbort();
         }

         var extraFocalThresholds = new Array();
         var extraFocalEffectiveFrameCounts = new Array();
         for (var i = 0; i != extraFocalFrames.length; ++i) {
            console.writeln();
            console.writeln("<b>Extra-focal frame defocus threshold:</b> ");
            console.writeln(model.extraFocalFramePaths[i]);
            console.flush();

            var extraFocalEffectiveFrameCount = 1;
            for (var j = 0; j != extraFocalKeywords[i].length; ++j) {
               var keyword = extraFocalKeywords[i][j];
               if (keyword.name == "WEEFCNT") {
                  extraFocalEffectiveFrameCount =
                     defaultNumeric(parseFloat(keyword.value), 1, 1000, 1);
               }
            }

            if (model.useDefocusThresholdHistogram) {
               var medianExtraFocalFrame =
                  extraFocalFrames[i].medianFilter(model.hotPixelRemovalRadius);
               var defocusThreshold = Math.max(
                  model.minimumDefocusThreshold,
                  medianExtraFocalFrame.defocusThresholdHistogram(
                     model.defocusThresholdHistogramBins,
                     model.defocusThresholdHistogramMinimumBins,
                     model.defocusThresholdHistogramNeighborhood,
                     model.defocusThresholdHistogramSigma
                  )
               );
               medianExtraFocalFrame.clear();
            }
            else {
               var defocusThreshold = model.minimumDefocusThreshold;
            }

            for (
               var k = 0;
               k != Math.max(1, model.defocusSignalFixedPointIterations);
               ++k
            ) {
               if (defocusThreshold == 0) {
                  throw new Error(
                     model.defocusThresholdEstimationDidNotConverge
                  );
               }
               var apertureMetrics =
                  extraFocalFrames[i].apertureMetrics(
                     defocusThreshold, model.hotPixelRemovalRadius
                  );
               var metrics = apertureMetrics.metrics;
               apertureMetrics.mask.clear();
               if (metrics.radius == 0) {
                  throw new Error(
                     model.defocusThresholdEstimationDidNotConverge
                  );
               }
               defocusThreshold = Math.max(
                  0,
                  model.defocusSignalThresholdFactor * metrics.signal
               );
               view.throwAbort();
            }
            extraFocalThresholds.push(defocusThreshold);
            extraFocalEffectiveFrameCounts.push(extraFocalEffectiveFrameCount);

            console.writeln("Defocus threshold: ", format(
               model.formatDefocusThreshold + " DN",
               model.scaleDefocusThreshold * defocusThreshold)
            );
            console.flush();

            view.throwAbort();
         }

         var defocusThresholds = new Array();
         for (var i = 0; i != intraFocalThresholds.length; ++i) {
            defocusThresholds.push(intraFocalThresholds[i]);
         }
         for (var i = 0; i != extraFocalThresholds.length; ++i) {
            defocusThresholds.push(extraFocalThresholds[i]);
         }
         var defocusThreshold = medianArraySideEffect(defocusThresholds);

         view.throwAbort();
      }

      {
         var intraFocalRegisteredFrames = new Array();
         var intraFocalRegisteredFrameMetrics = new Array();
         for (var i = 0; i != intraFocalFrames.length; ++i) {
            console.writeln();
            console.writeln("<b>Intra-focal frame registration:</b> ");
            console.writeln(model.intraFocalFramePaths[i]);
            console.flush();

            var registerFrameMetrics = this.registerFrame(
               intraFocalFrames[i],
               defocusThreshold,
               0.5,
               intraFocalFrames.length == 1
            );
            intraFocalRegisteredFrames.push(registerFrameMetrics.frame);
            var metrics = registerFrameMetrics.metrics;
            metrics.barycenter.x +=
               intraFocalCropFrameMetrics[i].translation.x;
            metrics.barycenter.y +=
               intraFocalCropFrameMetrics[i].translation.y;
            intraFocalRegisteredFrameMetrics.push(metrics);

            writeRegisteredFrameMetrics(
               metrics, defocusThreshold, intraFocalEffectiveFrameCounts[i]
            );
            console.flush();

            view.throwAbort();
         }

         var extraFocalRegisteredFrames = new Array();
         var extraFocalRegisteredFrameMetrics = new Array();
         for (var i = 0; i != extraFocalFrames.length; ++i) {
            console.writeln();
            console.writeln("<b>Extra-focal frame registration:</b> ");
            console.writeln(model.extraFocalFramePaths[i]);
            console.flush();

            var registerFrameMetrics = this.registerFrame(
               extraFocalFrames[i],
               defocusThreshold,
               -0.5,
               extraFocalFrames.length == 1
            );
            extraFocalRegisteredFrames.push(registerFrameMetrics.frame);
            var metrics = registerFrameMetrics.metrics;
            metrics.barycenter.x +=
               extraFocalCropFrameMetrics[i].translation.x;
            metrics.barycenter.y +=
               extraFocalCropFrameMetrics[i].translation.y;
            extraFocalRegisteredFrameMetrics.push(metrics);

            writeRegisteredFrameMetrics(
               metrics, defocusThreshold, extraFocalEffectiveFrameCounts[i]
            );
            console.flush();

            view.throwAbort();
         }
      }

      {
         console.writeln();
         console.writeln("<b>Intra-focal frame registration summary:</b>");
         writeRegisteredFramesMetricsSummary(
            intraFocalRegisteredFrameMetrics, defocusThresholds
         );
         console.flush();

         console.writeln();
         console.writeln("<b>Extra-focal frame registration summary:</b>");
         writeRegisteredFramesMetricsSummary(
            extraFocalRegisteredFrameMetrics, defocusThresholds
         );
         console.flush();
      }

      {
         for (var i = 0; i != intraFocalFrames.length; ++i) {
            intraFocalFrames[i].clear();
         }
         for (var i = 0; i != extraFocalFrames.length; ++i) {
            extraFocalFrames[i].clear();
         }
      }

      return {
         intraFocalRegisteredFrames: intraFocalRegisteredFrames,
         intraFocalKeywords: intraFocalKeywords,
         extraFocalRegisteredFrames: extraFocalRegisteredFrames,
         extraFocalKeywords: extraFocalKeywords
      };
   };

   this.scaleRejection = function(pixels) {
      for (;;) {
         if (pixels.length < model.scaleRejectionMinimumPixels) {
            return pixels;
         }

         var location = medianArraySideEffect(pixels);
         var scale = 1.1926 * SnArraySideEffect(pixels);

         var acceptedPixels = new Array();
         for (var i = 0; i != pixels.length; ++i) {
            if (
               Math.abs(pixels[i] - location) <=
               model.rejectionScale * scale
            ) {
               acceptedPixels.push(pixels[i]);
            }
         }

         break;
      }

      return acceptedPixels.length != 0 ? acceptedPixels : pixels;
   };

   this.combineRegisteredFrames = function(frames) {
      var rejectionCount = 0;

      var rows = frames[0].rows();
      var cols = frames[0].cols();
      var mapMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            mapMatrix.at(row, col, 0);
         }
      }
      var rejectionMap = new FrameReal(mapMatrix);

      var pixels = new Array();
      for (var i = 0; i != frames.length; ++i) {
         pixels.push(0);
      }

      var combineMatrix = new Matrix(rows, cols);
      for (var row = 0; row != rows; ++row) {
         for (var col = 0; col != cols; ++col) {
            for (var i = 0; i != frames.length; ++i) {
               pixels[i] = frames[i].matrix().at(row, col);
            }

            if (model.rejectionMethod == model.scaleRejectionMethod) {
               var acceptedPixels = this.scaleRejection(pixels);
               rejectionCount += pixels.length - acceptedPixels.length;
               rejectionMap.matrix().at(
                  row,
                  col,
                  (pixels.length - acceptedPixels.length) / frames.length
               );
               combineMatrix.at(row, col, meanArray(acceptedPixels));
            }
            else {
               combineMatrix.at(row, col, meanArray(pixels));
            }
         }
      }

      var image = (new FrameReal(combineMatrix)).stagePipeline([
         function(frame) {return frame.truncate(0, 1);}
      ]);

      return {
         image: image,
         rejectionCount: rejectionCount,
         rejectionMap: rejectionMap
      };
   };

   this.combineFrames = function(registeredFrames) {
      {
         var intraFocalCombineMetrics =
            this.combineRegisteredFrames(
               registeredFrames.intraFocalRegisteredFrames
            );

         model.intraFocalCombinedImage.clear();
         model.intraFocalCombinedImage = intraFocalCombineMetrics.image;
         model.intraFocalRejectionMap.clear();
         model.intraFocalRejectionMap = intraFocalCombineMetrics.rejectionMap;

         var intraFocalCombinedFrameCount =
            registeredFrames.intraFocalRegisteredFrames.length;
         var intraFocalEffectiveFrameCount = intraFocalCombinedFrameCount;
         model.intraFocalActualFrameCount = intraFocalCombinedFrameCount;

         if (intraFocalCombinedFrameCount == 1) {
            for (
               var i = 0;
               i != registeredFrames.intraFocalKeywords[0].length;
               ++i
            ) {
               var keyword = registeredFrames.intraFocalKeywords[0][i];
               if (keyword.name == "WECFCNT") {
                  intraFocalCombinedFrameCount =
                     defaultNumeric(parseInt(keyword.value), 1, 1000, 1);
               }
               if (keyword.name == "WEEFCNT") {
                  intraFocalEffectiveFrameCount =
                     defaultNumeric(parseFloat(keyword.value), 1, 1000, 1);
               }
            }
         }

         model.intraFocalCombinedFrameCount = intraFocalCombinedFrameCount;
         model.intraFocalEffectiveFrameCount =
            intraFocalEffectiveFrameCount * (1 -
               intraFocalCombineMetrics.rejectionCount /
               (intraFocalCombinedFrameCount *
                  registeredFrames.intraFocalRegisteredFrames[0].cols() *
                  registeredFrames.intraFocalRegisteredFrames[0].rows()
               )
            );

         console.writeln();
         console.writeln("<b>Intra-focal frame combination summary:</b>");
         console.writeln("Combined frame count: ", format(
            model.formatCombinedFrameCount, model.intraFocalCombinedFrameCount
         ));

         console.writeln("Rejection count: ", format(
            "%d px, %.3f %%",
            intraFocalCombineMetrics.rejectionCount,
            100 * intraFocalCombineMetrics.rejectionCount /
               (model.intraFocalCombinedFrameCount *
                  registeredFrames.intraFocalRegisteredFrames[0].cols() *
                  registeredFrames.intraFocalRegisteredFrames[0].rows()
               )
         ));

         console.writeln("Effective frame count: ", format(
            model.formatEffectiveFrameCount,
            model.intraFocalEffectiveFrameCount
         ));
         console.flush();

         view.throwAbort();
      }

      {
         var extraFocalCombineMetrics =
            this.combineRegisteredFrames(
               registeredFrames.extraFocalRegisteredFrames
            );

         model.extraFocalCombinedImage.clear();
         model.extraFocalCombinedImage = extraFocalCombineMetrics.image;
         model.extraFocalRejectionMap.clear();
         model.extraFocalRejectionMap = extraFocalCombineMetrics.rejectionMap;

         var extraFocalCombinedFrameCount =
            registeredFrames.extraFocalRegisteredFrames.length;
         var extraFocalEffectiveFrameCount = extraFocalCombinedFrameCount;
         model.extraFocalActualFrameCount = extraFocalCombinedFrameCount;

         if (extraFocalCombinedFrameCount == 1) {
            for (
               var i = 0;
               i != registeredFrames.extraFocalKeywords[0].length;
               ++i
            ) {
               var keyword = registeredFrames.extraFocalKeywords[0][i];
               if (keyword.name == "WECFCNT") {
                  extraFocalCombinedFrameCount =
                     defaultNumeric(parseInt(keyword.value), 1, 1000, 1);
               }
               if (keyword.name == "WEEFCNT") {
                  extraFocalEffectiveFrameCount =
                     defaultNumeric(parseFloat(keyword.value), 1, 1000, 1);
               }
            }
         }

         model.extraFocalCombinedFrameCount = extraFocalCombinedFrameCount;
         model.extraFocalEffectiveFrameCount =
            extraFocalEffectiveFrameCount * (1 -
               extraFocalCombineMetrics.rejectionCount /
               (extraFocalCombinedFrameCount *
                  registeredFrames.extraFocalRegisteredFrames[0].cols() *
                  registeredFrames.extraFocalRegisteredFrames[0].rows()
               )
            );

         console.writeln();
         console.writeln("<b>Extra-focal frame combination summary:</b>");
         console.writeln("Combined frame count: ", format(
            model.formatCombinedFrameCount, model.extraFocalCombinedFrameCount
         ));

         console.writeln("Rejection count: ", format(
            "%d px, %.3f %%",
            extraFocalCombineMetrics.rejectionCount,
            100 * extraFocalCombineMetrics.rejectionCount /
               (model.extraFocalCombinedFrameCount *
                  registeredFrames.extraFocalRegisteredFrames[0].cols() *
                  registeredFrames.extraFocalRegisteredFrames[0].rows()
               )
         ));

         console.writeln("Effective frame count: ", format(
            model.formatEffectiveFrameCount,
            model.extraFocalEffectiveFrameCount
         ));
         console.flush();

         view.throwAbort();
      }
   };

   this.registerCombineFrames = function() {
      var registeredFrames = this.registerFrames();

      this.combineFrames(registeredFrames);

      for (
         var i = 0;
         i != registeredFrames.intraFocalRegisteredFrames.length;
         ++i
      ) {
         registeredFrames.intraFocalRegisteredFrames[i].clear();
      }
      for (
         var i = 0;
         i != registeredFrames.extraFocalRegisteredFrames.length;
         ++i
      ) {
         registeredFrames.extraFocalRegisteredFrames[i].clear();
      }
   };
}

// ****************************************************************************
// EOF RegisterCombineFrames.js - Released 2016/12/30 00:00:00 UTC
