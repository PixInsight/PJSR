// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// OutputDirectoryController.js - Released 2016/12/30 00:00:00 UTC
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

function OutputDirectoryController(model) {
   this.aberrationLabels = (new ZernikeAberrations()).aberrationLabels();

   // Fourier size.
   this.fourierSize = 1024;

   // STF midtone for point spread function.
   this.pointSpreadFunctionSTFMidtone = 0.005;

   // Logs parameters.
   this.logParameters = function() {
      console.writeln();
      console.writeln("<b>Parameters:</b>");

      console.writeln(format(
         "Aperture diameter: " +
         model.formatApertureDiameter +
         " mm",
         model.scaleApertureDiameter * model.apertureDiameter
      ));
      console.writeln(format(
         "Focal length: " +
         model.formatApertureDiameter +
         " mm",
         model.scaleFocalLength * model.focalLength
      ));

      console.writeln(
         "Detector type: ",
         model.detectorType == model.monochromeDetectorType ?
            "Monochrome" :
         model.detectorType == model.colorFilterArrayDetectorType ?
            "Color filter array" : "None"
      );
      console.writeln(format(
         "Gain: " +
         model.formatGain +
         " e-/DN",
         model.scaleGain * model.gain
      ));
      console.writeln(format(
         "Pixel size: " +
         model.formatPixelSize +
         " μm",
         model.scalePixelSize * model.pixelSize
      ));

      console.writeln(format(
         "Observation wavelength: " +
         model.formatObservationWavelength +
         " nm",
         model.scaleObservationWavelength * model.observationWavelength
      ));

      console.writeln(
         "Rejection method: ",
         model.rejectionMethod == model.noRejectionMethod ?
            "No rejection" :
         model.rejectionMethod == model.scaleRejectionMethod ?
            "Scale rejection" : "None"
      );
      if (model.rejectionMethod == model.scaleRejectionMethod) {
         console.writeln("Rejection scale: ", format(
            model.formatRejectionScale,
            model.scaleRejectionScale * model.rejectionScale
         ));
      }

      console.writeln(format(
         "Identifier prefix: " +
         model.identifierPrefix
      ));
      console.writeln("Fringe count scale: ", format(
         model.formatFringeCountScale,
         model.scaleFringeCountScale * model.fringeCountScale
      ));
      console.writeln(format(
         "Generate views: " +
         (model.generateViews ? "true" : "false")
      ));
   };

   // Gives the save image file extension.
   this.saveImageExtension = function() {
      // Gives the majority file extension of the intra-focal and extra-focal
      // image paths.
      var extensions = new Array();
      for (var i = 0; i != model.intraFocalFramePaths.length; ++i) {
         var extension = File.extractExtension(model.intraFocalFramePaths[i]);
         for (
            var j = 0;
            j != extensions.length && extensions[j][0] != extension;
            ++j
         ) {
         }
         if (j == extensions.length) {
            extensions.push(new Array(extension, 0));
         }
         ++extensions[j][1];
      }
      for (var i = 0; i != model.extraFocalFramePaths.length; ++i) {
         var extension = File.extractExtension(model.extraFocalFramePaths[i]);
         for (
            var j = 0;
            j != extensions.length && extensions[j][0] != extension;
            ++j
         ) {
         }
         if (j == extensions.length) {
            extensions.push(new Array(extension, 0));
         }
         ++extensions[j][1];
      }
      var j = 0;
      for (var i = 0; i != extensions.length; ++i) {
         if (extensions[j][1] < extensions[i][1]) {
            j = i;
         }
      }

      return extensions[j][0];
   };

   // Gives save image hints.
   this.saveImageHints = function() {
      return "";
   };

   // Saves imageWindow.mainView.image to path with hints.
   this.saveImage = function(imageWindow, path, hints) {
      var fileFormat = new FileFormat(
         File.extractExtension(path), false, true
      );
      if (fileFormat.isNull) {
         throw new Error("Internal error: saveImage: fileFormat.isNull");
      }

      var fileFormatInstance = new FileFormatInstance(fileFormat);
      if (fileFormatInstance.isNull) {
         throw new Error(
            "Internal error: saveImage: fileFormatInstance.isNull"
         );
      }

      try {
         var uniquePath = uniqueFullPath(path);

         console.writeln();
         console.writeln("<b>Writing image:</b>");
         console.writeln(uniquePath);

         if (!fileFormatInstance.create(uniquePath, hints)) {
            throw new Error(
               "Internal error: saveImage: " +
               "!fileFormatInstance.create(uniquePath, hints)"
            );
         }

         var description = new ImageDescription;
         description.bitsPerSample = 32;
         if (File.extractExtension(path) != ".png") {
            description.ieeefpSampleFormat = true;
         }
         if (!fileFormatInstance.setOptions(description)) {
            throw new Error(
               "Internal error: saveImage: " +
               "!fileFormatInstance.setOptions(description)"
            );
         }

         if (File.extractExtension(path) != ".png") {
            fileFormatInstance.keywords = imageWindow.keywords;
         }
#ifgteq __PI_BUILD__ 1189
         if (File.extractExtension(path) == ".xisf") {
            fileFormatInstance.displayFunction =
               imageWindow.mainView.stf;
         }
#endif

         if (!fileFormatInstance.writeImage(imageWindow.mainView.image)) {
            throw new Error(
               "Internal error: " +
               "saveImage: error writing file: " + uniquePath
            );
         }
      }
      finally {
         fileFormatInstance.close();
      }
   };

   // Saves stf to path.
   this.saveSTF = function(stf, name, path) {
      var string = new String();
      var xpos = 1000;
      var ypos = Math.round(100 + 600 * Math.random());

      string +=
         "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n";
      string +=
         "<xpsm " +
         "version=\"1.0\" " +
         "xmlns=\"http:\/\/www.pixinsight.com\" " +
         "xmlns:xsi=\"http:\/\/www.w3.org/2001/XMLSchema-instance\" " +
         "xsi:schemaLocation=" +
         "\"http:\/\/www.pixinsight.com " +
         "http:\/\/pixinsight.com/xsd/xpsm-1.0.xsd\"" +
         ">\n";

      string +=
         "<instance class=\"ScreenTransferFunction\" id=\"" +
         name + "_instance" +
         "\">\n"

      string +=
         "<table id=\"STF\" rows=\"4\">\n";

      for (var i = 0; i != 4; ++i) {
         string +=
            "<tr>\n";
         string +=
            "<td id=\"c0\" value=\"" +
            format("%.5f", stf[i][1]) +
            "\"/>\n";
         string +=
            "<td id=\"c1\" value=\"" +
            format("%.5f", stf[i][2]) +
            "\"/>\n";
         string +=
            "<td id=\"m\" value=\"" +
            format("%.5f", stf[i][0]) +
            "\"/>\n";
         string +=
            "<td id=\"r0\" value=\"" +
            format("%.5f", stf[i][3]) +
            "\"/>\n";
         string +=
            "<td id=\"r1\" value=\"" +
            format("%.5f", stf[i][4]) +
            "\"/>\n";
         string +=
            "</tr>\n";
      }

      string +=
         "</table>\n";

      string +=
        "<parameter id=\"interaction\" value=\"SeparateChannels\"/>\n";

      string +=
         "</instance>\n";

      string +=
         "<icon id=\"" +
         name +
         "\" instance=\"" +
         name + "_instance" +
         "\" " +
         "xpos=\"" +
         format("%d", xpos) +
         "\" " +
         "ypos=\"" +
         format("%d", ypos) +
         "\"" +
         "/>\n";

      string +=
         "</xpsm>\n";

      console.writeln();
      console.writeln(
         "<b>Writing ScreenTransferFunction process icon: </b>", name
      );
      console.writeln(path);
      console.flush();

      File.writeFile(path, ByteArray.stringToUTF8(string));
   };

   // Gives a screen transfer function with specified midtone, shadow, and
   // highlight.
   this.generateScreenTransferFunction = function(midtone, shadow, highlight) {
      return [
         [midtone, shadow, highlight, 0, 1],
         [midtone, shadow, highlight, 0, 1],
         [midtone, shadow, highlight, 0, 1],
         [midtone, shadow, highlight, 0, 1]
      ];
   };

   // Generates rejection maps.
   this.generateRejectionMaps = function() {
      var identifierPrefix = model.identifierPrefix.trim() == "" ?
         "" : filterViewId(model.identifierPrefix);
      var stf = this.generateScreenTransferFunction(
         0.5,
         Math.min(
            model.intraFocalRejectionMap.min(),
            model.extraFocalRejectionMap.min()
         ),
         Math.max(
            model.intraFocalRejectionMap.max(),
            model.extraFocalRejectionMap.max()
         )
      );

      if (model.outputDirectoryPath != null) {
         var intraFocalRejectionMapPath = uniqueViewIdFullPath(
            identifierPrefix + "intra_focal_rejection",
            model.outputDirectoryPath + "/" +
            identifierPrefix + "intra_focal_rejection" +
            this.saveImageExtension()
         );
         var extraFocalRejectionMapPath = uniqueViewIdFullPath(
            identifierPrefix + "extra_focal_rejection",
            model.outputDirectoryPath + "/" +
            identifierPrefix + "extra_focal_rejection" +
            this.saveImageExtension()
         );
      }
      else {
         var intraFocalRejectionMapPath = {
            id: uniqueViewId(identifierPrefix + "intra_focal_rejection")
         };
         var extraFocalRejectionMapPath = {
            id: uniqueViewId(identifierPrefix + "extra_focal_rejection")
         };
      }

      if (
         model.rejectionMethod == model.scaleRejectionMethod &&
         model.intraFocalActualFrameCount >=
            model.scaleRejectionMinimumPixels
      ) {
         var imageWindow = model.intraFocalRejectionMap.toImageWindow(
            intraFocalRejectionMapPath.id
         );
         imageWindow.mainView.stf = stf;
         if (model.outputDirectoryPath != null) {
            this.saveImage(
               imageWindow,
               intraFocalRejectionMapPath.path,
               this.saveImageHints()
            );
            this.saveSTF(
               stf,
               "intra_focal_rejection_stf",
               uniqueFullPath(
                  File.changeExtension(File.appendToName(
                     intraFocalRejectionMapPath.path, "_stf"
                  ), ".xpsm")
               )
            );
            if (model.generateViews) {
               imageWindow.forceClose();
               var imageWindows = ImageWindow.open(
                  intraFocalRejectionMapPath.path //,
                  //intraFocalRejectionMapPath.id
               );
               console.abortEnabled = false; // workaround for 1123 bug.
               if (imageWindows.length != 1) {
                  throw new Error(
                     "Internal error: " +
                     "generateRejectionMaps: imageWindows.length != 1"
                  );
               }
               imageWindow = imageWindows[0];
               imageWindow.mainView.stf = stf;
            }
         }
         if (model.generateViews) {
            imageWindow.show();
         }
         else {
            imageWindow.forceClose();
         }
      }

      if (
         model.rejectionMethod == model.scaleRejectionMethod &&
         model.extraFocalActualFrameCount >=
            model.scaleRejectionMinimumPixels
      ) {
         var imageWindow = model.extraFocalRejectionMap.toImageWindow(
            extraFocalRejectionMapPath.id
         );
         imageWindow.mainView.stf = stf;
         if (model.outputDirectoryPath != null) {
            this.saveImage(
               imageWindow,
               extraFocalRejectionMapPath.path,
               this.saveImageHints()
            );
            this.saveSTF(
               stf,
               "extra_focal_rejection_stf",
               uniqueFullPath(
                  File.changeExtension(File.appendToName(
                     extraFocalRejectionMapPath.path, "_stf"
                  ), ".xpsm")
               )
            );
            if (model.generateViews) {
               imageWindow.forceClose();
               var imageWindows = ImageWindow.open(
                  extraFocalRejectionMapPath.path //,
                  //extraFocalRejectionMapPath.id
               );
               console.abortEnabled = false; // workaround for 1123 bug.
               if (imageWindows.length != 1) {
                  throw new Error(
                     "Internal error: " +
                     "generateRejectionMaps: imageWindows.length != 1"
                  );
               }
               imageWindow = imageWindows[0];
               imageWindow.mainView.stf = stf;
            }
         }
         if (model.generateViews) {
            imageWindow.show();
         }
         else {
            imageWindow.forceClose();
         }
      }
   };

   // Generates combined images.
   this.generateCombinedImages = function() {
      var identifierPrefix = model.identifierPrefix.trim() == "" ?
         "" : filterViewId(model.identifierPrefix);
      var stf = this.generateScreenTransferFunction(
         0.5,
         Math.min(
            model.intraFocalCombinedImage.min(),
            model.extraFocalCombinedImage.min()
         ),
         Math.max(
            model.intraFocalCombinedImage.max(),
            model.extraFocalCombinedImage.max()
         )
      );

      if (model.outputDirectoryPath != null) {
         var intraFocalIdPath = uniqueViewIdFullPath(
            identifierPrefix + "intra_focal_combined",
            model.outputDirectoryPath + "/" +
            identifierPrefix + "intra_focal_combined" +
            this.saveImageExtension()
         );
         var extraFocalIdPath = uniqueViewIdFullPath(
            identifierPrefix + "extra_focal_combined",
            model.outputDirectoryPath + "/" +
            identifierPrefix + "extra_focal_combined" +
            this.saveImageExtension()
         );
      }
      else {
         var intraFocalIdPath = {
            id: uniqueViewId(identifierPrefix + "intra_focal_combined")
         };
         var extraFocalIdPath = {
            id: uniqueViewId(identifierPrefix + "extra_focal_combined")
         };
      }

      var imageWindow = model.intraFocalCombinedImage.toImageWindow(
         intraFocalIdPath.id
      );
      imageWindow.keywords = new Array(
         new FITSKeyword(
            "WECFCNT",
            format(
               model.formatCombinedFrameCount,
               model.intraFocalCombinedFrameCount
            ),
            TITLE + " combined frame count"
         ),
         new FITSKeyword(
            "WEEFCNT",
            format(
               model.formatEffectiveFrameCount,
               model.intraFocalEffectiveFrameCount
            ),
            TITLE + " effective frame count"
         )
      );
      imageWindow.mainView.stf = stf;
      if (model.outputDirectoryPath != null) {
         this.saveImage(
            imageWindow, intraFocalIdPath.path, this.saveImageHints()
         );
         this.saveSTF(
            stf,
            "intra_focal_combined_stf",
            uniqueFullPath(
               File.changeExtension(File.appendToName(
                  intraFocalIdPath.path, "_stf"
               ), ".xpsm")
            )
         );
         if (model.generateViews) {
            imageWindow.forceClose();
            var imageWindows = ImageWindow.open(
               intraFocalIdPath.path //, intraFocalIdPath.id
            );
            console.abortEnabled = false; // workaround for 1123 bug.
            if (imageWindows.length != 1) {
               throw new Error(
                  "Internal error: " +
                  "generateCombinedImages: imageWindows.length != 1"
               );
            }
            imageWindow = imageWindows[0];
            imageWindow.mainView.stf = stf;
         }
      }
      if (model.generateViews) {
         imageWindow.show();
      }
      else {
         imageWindow.forceClose();
      }

      var imageWindow = model.extraFocalCombinedImage.toImageWindow(
         extraFocalIdPath.id
      );
      imageWindow.keywords = new Array(
         new FITSKeyword(
            "WECFCNT",
            format(
               model.formatCombinedFrameCount,
               model.extraFocalCombinedFrameCount
            ),
            TITLE + " combined frame count"
         ),
         new FITSKeyword(
            "WEEFCNT",
            format(
               model.formatEffectiveFrameCount,
               model.extraFocalEffectiveFrameCount
            ),
            TITLE + " effective frame count"
         )
      );
      imageWindow.mainView.stf = stf;
      if (model.outputDirectoryPath != null) {
         this.saveImage(
            imageWindow, extraFocalIdPath.path, this.saveImageHints()
         );
         this.saveSTF(
            stf,
            "extra_focal_combined_stf",
            uniqueFullPath(
               File.changeExtension(File.appendToName(
                  extraFocalIdPath.path, "_stf"
               ), ".xpsm")
            )
         );
         if (model.generateViews) {
            imageWindow.forceClose();
            var imageWindows = ImageWindow.open(
               extraFocalIdPath.path //, extraFocalIdPath.id
            );
            console.abortEnabled = false; // workaround for 1123 bug.
            if (imageWindows.length != 1) {
               throw new Error(
                  "Internal error: " +
                  "generateCombinedImages: imageWindows.length != 1"
               );
            }
            imageWindow = imageWindows[0];
            imageWindow.mainView.stf = stf;
         }
      }
      if (model.generateViews) {
         imageWindow.show();
      }
      else {
         imageWindow.forceClose();
      }
   };

   // Generate compensated images.
   this.generateCompensatedImages = function() {
      var identifierPrefix = model.identifierPrefix.trim() == "" ?
         "" : filterViewId(model.identifierPrefix);
      var stf = this.generateScreenTransferFunction(
         0.5,
         Math.min(
            model.intraFocalCompensatedImage.min(),
            model.extraFocalCompensatedImage.min()
         ),
         Math.max(
            model.intraFocalCompensatedImage.max(),
            model.extraFocalCompensatedImage.max()
         )
      );

      if (model.outputDirectoryPath != null) {
         var intraFocalIdPath = uniqueViewIdFullPath(
            identifierPrefix + "intra_focal_compensated",
            model.outputDirectoryPath + "/" +
            identifierPrefix + "intra_focal_compensated" +
            this.saveImageExtension()
         );
         var extraFocalIdPath = uniqueViewIdFullPath(
            identifierPrefix + "extra_focal_compensated",
            model.outputDirectoryPath + "/" +
            identifierPrefix + "extra_focal_compensated" +
            this.saveImageExtension()
         );
      }
      else {
         var intraFocalIdPath = {
            id: uniqueViewId(identifierPrefix + "intra_focal_compensated")
         };
         var extraFocalIdPath = {
            id: uniqueViewId(identifierPrefix + "extra_focal_compensated")
         };
      }

      var imageWindow = model.intraFocalCompensatedImage.toImageWindow(
         intraFocalIdPath.id
      );
      imageWindow.keywords = new Array(
         new FITSKeyword(
            "WECFCNT",
            format(
               model.formatCombinedFrameCount,
               model.intraFocalCombinedFrameCount
            ),
            TITLE + " combined frame count"
         ),
         new FITSKeyword(
            "WEEFCNT",
            format(
               model.formatEffectiveFrameCount,
               model.intraFocalEffectiveFrameCount
            ),
            TITLE + " effective frame count"
         )
      );
      imageWindow.mainView.stf = stf;
      if (model.outputDirectoryPath != null) {
         this.saveImage(
            imageWindow, intraFocalIdPath.path, this.saveImageHints()
         );
         this.saveSTF(
            stf,
            "intra_focal_compensated_stf",
            uniqueFullPath(
               File.changeExtension(File.appendToName(
                  intraFocalIdPath.path, "_stf"
               ), ".xpsm")
            )
         );
         if (model.generateViews) {
            imageWindow.forceClose();
            var imageWindows = ImageWindow.open(
               intraFocalIdPath.path //, intraFocalIdPath.id
            );
            console.abortEnabled = false; // workaround for 1123 bug.
            if (imageWindows.length != 1) {
               throw new Error(
                  "Internal error: " +
                  "generateCompensatedImages: imageWindows.length != 1"
               );
            }
            imageWindow = imageWindows[0];
            imageWindow.mainView.stf = stf;
         }
      }
      if (model.generateViews) {
         imageWindow.show();
      }
      else {
         imageWindow.forceClose();
      }

      var imageWindow = model.extraFocalCompensatedImage.toImageWindow(
         extraFocalIdPath.id
      );
      imageWindow.keywords = new Array(
         new FITSKeyword(
            "WECFCNT",
            format(
               model.formatCombinedFrameCount,
               model.extraFocalCombinedFrameCount
            ),
            TITLE + " combined frame count"
         ),
         new FITSKeyword(
            "WEEFCNT",
            format(
               model.formatEffectiveFrameCount,
               model.extraFocalEffectiveFrameCount
            ),
            TITLE + " effective frame count"
         )
      );
      imageWindow.mainView.stf = stf;
      if (model.outputDirectoryPath != null) {
         this.saveImage(
            imageWindow, extraFocalIdPath.path, this.saveImageHints()
         );
         this.saveSTF(
            stf,
            "extra_focal_compensated_stf",
            uniqueFullPath(
               File.changeExtension(File.appendToName(
                  extraFocalIdPath.path, "_stf"
               ), ".xpsm")
            )
         );
         if (model.generateViews) {
            imageWindow.forceClose();
            var imageWindows = ImageWindow.open(
               extraFocalIdPath.path //, extraFocalIdPath.id
            );
            console.abortEnabled = false; // workaround for 1123 bug.
            if (imageWindows.length != 1) {
               throw new Error(
                  "Internal error: " +
                  "generateCompensatedImages: imageWindows.length != 1"
               );
            }
            imageWindow = imageWindows[0];
            imageWindow.mainView.stf = stf;
         }
      }
      if (model.generateViews) {
         imageWindow.show();
      }
      else {
         imageWindow.forceClose();
      }
   };

   // Generates wavefront image.
   this.generateWavefrontImage = function() {
      var identifierPrefix = model.identifierPrefix.trim() == "" ?
         "" : filterViewId(model.identifierPrefix);
      var stf = this.generateScreenTransferFunction(
         0.5,
         model.wavefrontSaveScale * model.wavefrontEstimate.min() +
            model.wavefrontSaveOffset,
         model.wavefrontSaveScale * model.wavefrontEstimate.max() +
            model.wavefrontSaveOffset
      );

      if (model.outputDirectoryPath != null) {
         var wavefrontIdPath = uniqueViewIdFullPath(
            identifierPrefix + "wavefront",
            model.outputDirectoryPath + "/" +
            identifierPrefix + "wavefront" + this.saveImageExtension()
         );
         var wavefrontDomainIdPath = uniqueViewIdFullPath(
            identifierPrefix + "wavefront_domain",
            model.outputDirectoryPath + "/" +
            identifierPrefix + "wavefront_domain" + this.saveImageExtension()
         );
      }
      else {
         var wavefrontIdPath = {
            id: uniqueViewId(identifierPrefix + "wavefront")
         };
         var wavefrontDomainIdPath = {
            id: uniqueViewId(identifierPrefix + "wavefront_domain")
         };
      }

      var imageWindow = model.wavefrontEstimate.clone().stagePipeline([
         function(frame) {return frame.scale(model.wavefrontSaveScale);},
         function(frame) {return frame.offset(model.wavefrontSaveOffset);},
         function(frame) {return frame.toImageWindow(wavefrontIdPath.id);}
      ]);
      imageWindow.keywords = new Array(
         new FITSKeyword(
            "WEWSCALE",
            format("%.1f", model.wavefrontSaveScale),
            TITLE + " wavefront scale 1/meters"
         ),
         new FITSKeyword(
            "WEWOFFST",
            format("%.1f", model.wavefrontSaveOffset),
            TITLE + " wavefront offset"
         ),
         new FITSKeyword(
            "WEDEFDIA",
            format("%.6f", model.defocusDiameterEstimate),
            TITLE + " defocus diameter px"
         ),
         new FITSKeyword(
            "WEDEFOBS",
            format("%.6f", model.defocusObstructionDiameterEstimate),
            TITLE + " defocus obstruction diameter px"
         ),
         new FITSKeyword(
            "WEOBWVLN",
            format(
               model.formatObservationWavelength,
               model.scaleObservationWavelength * model.observationWavelength
            ),
            TITLE + " observation wavelength nm"
         )
      );
      imageWindow.mainView.stf = stf;
      if (model.outputDirectoryPath != null) {
         this.saveImage(
            imageWindow, wavefrontIdPath.path, this.saveImageHints()
         );
         this.saveSTF(
            stf,
            "wavefront_stf",
            uniqueFullPath(
               File.changeExtension(File.appendToName(
                  wavefrontIdPath.path, "_stf"
               ), ".xpsm")
            )
         );
         if (model.generateViews) {
            imageWindow.forceClose();
            var imageWindows = ImageWindow.open(
               wavefrontIdPath.path //, wavefrontIdPath.id
            );
            console.abortEnabled = false; // workaround for 1123 bug.
            if (imageWindows.length != 1) {
               throw new Error(
                  "Internal error: " +
                  "generateWavefrontImage: imageWindows.length != 1"
               );
            }
            imageWindow = imageWindows[0];
            imageWindow.mainView.stf = stf;
         }
      }
      if (model.generateViews) {
         imageWindow.show();
      }
      else {
         imageWindow.forceClose();
      }

      var red = model.defocusDomain.clone();
      var green = model.defocusMesh.x.clone().stagePipeline([
         function(frame) {return frame.scale(0.5);},
         function(frame) {return frame.offset(0.5);},
         function(frame) {return frame.product(model.defocusDomain);}
      ]);
      var blue = model.defocusMesh.y.clone().stagePipeline([
         function(frame) {return frame.scale(-0.5);},
         function(frame) {return frame.offset(0.5);},
         function(frame) {return frame.product(model.defocusDomain);}
      ]);
      var imageWindow = model.defocusDomain.toImageWindowRGB(
         wavefrontDomainIdPath.id,
         red,
         green,
         blue
      );
      red.clear();
      green.clear();
      blue.clear();
      imageWindow.keywords = new Array(
         new FITSKeyword(
            "WEDEFDIA",
            format("%.6f", model.defocusDiameterEstimate),
            TITLE + " defocus diameter px"
         ),
         new FITSKeyword(
            "WEDEFOBS",
            format("%.6f", model.defocusObstructionDiameterEstimate),
            TITLE + " defocus obstruction diameter px"
         )
      );
      if (model.outputDirectoryPath != null) {
         this.saveImage(
            imageWindow, wavefrontDomainIdPath.path, this.saveImageHints()
         );
         if (model.generateViews) {
            imageWindow.forceClose();
            var imageWindows = ImageWindow.open(
               wavefrontDomainIdPath.path //, wavefrontDomainIdPath.id
            );
            console.abortEnabled = false; // workaround for 1123 bug.
            if (imageWindows.length != 1) {
               throw new Error(
                  "Internal error: " +
                  "generateWavefrontImage: imageWindows.length != 1"
               );
            }
            imageWindow = imageWindows[0];
         }
      }
      if (model.generateViews) {
         imageWindow.show();
      }
      else {
         imageWindow.forceClose();
      }
   };

   // Generate point spread function image.
   this.generatePointSpreadFunctionImage = function() {
      var identifierPrefix = model.identifierPrefix.trim() == "" ?
         "" : filterViewId(model.identifierPrefix);
      var scale = 1 / model.pointSpreadFunctionIdeal.max();
      var stf = this.generateScreenTransferFunction(
         this.pointSpreadFunctionSTFMidtone,
         scale * model.pointSpreadFunctionEstimate.min(),
         scale * model.pointSpreadFunctionEstimate.max()
      );

      if (model.outputDirectoryPath != null) {
         var pointSpreadFunctionIdPath = uniqueViewIdFullPath(
            identifierPrefix + "point_spread_function",
            model.outputDirectoryPath + "/" +
            identifierPrefix + "point_spread_function" +
            this.saveImageExtension()
         );
      }
      else {
         var pointSpreadFunctionIdPath = {
            id: uniqueViewId(identifierPrefix + "point_spread_function")
         };
      }

      var fourierPad = 0.5 * (
         model.pointSpreadFunctionEstimate.rows() - this.fourierSize
      );
      var imageWindow =
         model.pointSpreadFunctionEstimate.clone().stagePipeline([
            function(frame) {
               return frame.padRows(-fourierPad - 0, -fourierPad, 0);
            },
            function(frame) {
               return frame.padCols(-fourierPad - 0, -fourierPad, 0);
            },
            function(frame) {return frame.scale(scale);},
            function(frame) {
               return frame.toImageWindow(pointSpreadFunctionIdPath.id);
            }
         ]);
      imageWindow.keywords = new Array(
         new FITSKeyword(
            "WEPSFPXS",
            format("%.6f", 1e6 * model.pointSpreadFunctionPixelSize),
            TITLE + " pixel size microns"
         ),
         new FITSKeyword(
            "WEOBWVLN",
            format(
               model.formatObservationWavelength,
               model.scaleObservationWavelength * model.observationWavelength
            ),
            TITLE + " observation wavelength nm"
         )
      );
      imageWindow.mainView.stf = stf;
      if (model.outputDirectoryPath != null) {
         this.saveImage(
            imageWindow, pointSpreadFunctionIdPath.path, this.saveImageHints()
         );
         this.saveSTF(
            stf,
            "point_spread_function_stf",
            uniqueFullPath(
               File.changeExtension(File.appendToName(
                  pointSpreadFunctionIdPath.path, "_stf"
               ), ".xpsm")
            )
         );
         if (model.generateViews) {
            imageWindow.forceClose();
            var imageWindows = ImageWindow.open(
               pointSpreadFunctionIdPath.path //, pointSpreadFunctionIdPath.id
            );
            console.abortEnabled = false; // workaround for 1123 bug.
            if (imageWindows.length != 1) {
               throw new Error(
                  "Internal error: " +
                  "generatePointSpreadFunctionImage: imageWindows.length != 1"
               );
            }
            imageWindow = imageWindows[0];
            imageWindow.mainView.stf = stf;
         }
      }
      if (model.generateViews) {
          imageWindow.show();
      }
      else {
         imageWindow.forceClose();
      }
   };

   // Generate modulation transfer function image.
   this.generateModulationTransferFunctionImage = function() {
      var identifierPrefix = model.identifierPrefix.trim() == "" ?
         "" : filterViewId(model.identifierPrefix);
      var scale = 1 / model.modulationTransferFunctionEstimate.max();
      var stf = this.generateScreenTransferFunction(
         0.5,
         0,
         1
      );

      if (model.outputDirectoryPath != null) {
         var modulationTransferFunctionIdPath = uniqueViewIdFullPath(
            identifierPrefix + "modulation_transfer_function",
            model.outputDirectoryPath + "/" +
            identifierPrefix + "modulation_transfer_function" +
            this.saveImageExtension()
         );
      }
      else {
         var modulationTransferFunctionIdPath = {
            id: uniqueViewId(identifierPrefix + "modulation_transfer_function")
         };
      }

      var fourierPad = 0.5 * (
         model.modulationTransferFunctionEstimate.rows() - this.fourierSize
      );
      var imageWindow =
         model.modulationTransferFunctionEstimate.clone().stagePipeline([
            function(frame) {
               return frame.padRows(-fourierPad - 0, -fourierPad, 0);
            },
            function(frame) {
               return frame.padCols(-fourierPad - 0, -fourierPad, 0);
            },
            function(frame) {return frame.scale(scale);},
            function(frame) {
               return frame.toImageWindow(modulationTransferFunctionIdPath.id);
            }
         ]);
      imageWindow.keywords = new Array(
         new FITSKeyword(
            "WEMTFPXS",
            format(
               "%.6f",
               model.maximumSpatialFrequencyOptics /
                  model.defocusDiameterEstimate
            ),
            TITLE + " pixel size lp/mm"
         ),
         new FITSKeyword(
            "WEOBWVLN",
            format(
               model.formatObservationWavelength,
               model.scaleObservationWavelength * model.observationWavelength
            ),
            TITLE + " observation wavelength nm"
         )
      );
      imageWindow.mainView.stf = stf;
      if (model.outputDirectoryPath != null) {
         this.saveImage(
            imageWindow,
            modulationTransferFunctionIdPath.path,
            this.saveImageHints()
         );
         this.saveSTF(
            stf,
            "modulation_transfer_function_stf",
            uniqueFullPath(
               File.changeExtension(File.appendToName(
                  modulationTransferFunctionIdPath.path, "_stf"
               ), ".xpsm")
            )
         );
         if (model.generateViews) {
            imageWindow.forceClose();
            var imageWindows = ImageWindow.open(
               modulationTransferFunctionIdPath.path //,
               //modulationTransferFunctionIdPath.id
            );
            console.abortEnabled = false; // workaround for 1123 bug.
            if (imageWindows.length != 1) {
               throw new Error(
                  "Internal error: " +
                  "generateModulationTransferFunctionImage: " +
                  "imageWindows.length != 1"
               );
            }
            imageWindow = imageWindows[0];
            imageWindow.mainView.stf = stf;
         }
      }
      if (model.generateViews) {
         imageWindow.show();
      }
      else {
         imageWindow.forceClose();
      }
   };

   // Generates wavefront plot.
   this.generateWavefrontPlot = function() {
      var identifierPrefix = model.identifierPrefix.trim() == "" ?
         "" : filterViewId(model.identifierPrefix);

      if (model.outputDirectoryPath != null) {
         var wavefrontContourPlotIdPath = uniqueViewIdFullPath(
            identifierPrefix + "wavefront_plot",
            model.outputDirectoryPath + "/" +
            identifierPrefix + "wavefront_plot" + ".png"
         );
      }
      else {
         var wavefrontContourPlotIdPath = {
            id: uniqueViewId(identifierPrefix + "wavefront_plot")
         };
      }

      var imageWindow = model.wavefrontEstimateContourPlot
         .toImageWindow8Bit(wavefrontContourPlotIdPath.id);
      if (model.outputDirectoryPath != null) {
         this.saveImage(
            imageWindow,
            wavefrontContourPlotIdPath.path,
            this.saveImageHints()
         );
         if (model.generateViews) {
            imageWindow.forceClose();
            var imageWindows = ImageWindow.open(
               wavefrontContourPlotIdPath.path //, wavefrontContourPlotIdPath.id
            );
            console.abortEnabled = false; // workaround for 1123 bug.
            if (imageWindows.length != 1) {
               throw new Error(
                  "Internal error: " +
                  "generateWavefrontPlot: imageWindows.length != 1"
               );
            }
            imageWindow = imageWindows[0];
         }
      }
      if (model.generateViews) {
         imageWindow.zoomFactor = model.plotZoomFactor;
         imageWindow.fitWindow();
         imageWindow.show();
      }
      else {
         imageWindow.forceClose();
      }
   };

   // Generates interferogram plot.
   this.generateInterferogramPlot = function() {
      var identifierPrefix = model.identifierPrefix.trim() == "" ?
         "" : filterViewId(model.identifierPrefix);

      if (model.outputDirectoryPath != null) {
         var interferogramPlotIdPath = uniqueViewIdFullPath(
            identifierPrefix + "interferogram_sagittal_plot",
            model.outputDirectoryPath + "/" +
            identifierPrefix + "interferogram_sagittal_plot" + ".png"
         );
      }
      else {
         var interferogramPlotIdPath = {
            id: uniqueViewId(identifierPrefix + "interferogram_sagittal_plot")
         };
      }

      var imageWindow = model.interferogramEstimateSagittalPlot
         .toImageWindow8Bit(interferogramPlotIdPath.id);
      if (model.outputDirectoryPath != null) {
         this.saveImage(
            imageWindow, interferogramPlotIdPath.path, this.saveImageHints()
         );
         if (model.generateViews) {
            imageWindow.forceClose();
            var imageWindows = ImageWindow.open(
               interferogramPlotIdPath.path //, interferogramPlotIdPath.id
            );
            console.abortEnabled = false; // workaround for 1123 bug.
            if (imageWindows.length != 1) {
               throw new Error(
                  "Internal error: " +
                  "generateInterferogramPlot: imageWindows.length != 1"
               );
            }
            imageWindow = imageWindows[0];
         }
      }
      if (model.generateViews) {
         imageWindow.zoomFactor = model.plotZoomFactor;
         imageWindow.fitWindow();
         imageWindow.show();
      }
      else {
         imageWindow.forceClose();
      }

      if (model.outputDirectoryPath != null) {
         var interferogramPlotIdPath = uniqueViewIdFullPath(
            identifierPrefix + "interferogram_meridional_plot",
            model.outputDirectoryPath + "/" +
            identifierPrefix + "interferogram_meridional_plot" + ".png"
         );
      }
      else {
         var interferogramPlotIdPath = {
            id: uniqueViewId(
               identifierPrefix + "interferogram_meridional_plot"
            )
         };
      }

      var imageWindow = model.interferogramEstimateMeridionalPlot
         .toImageWindow8Bit(interferogramPlotIdPath.id);
      if (model.outputDirectoryPath != null) {
         this.saveImage(
            imageWindow, interferogramPlotIdPath.path, this.saveImageHints()
         );
         if (model.generateViews) {
            imageWindow.forceClose();
            var imageWindows = ImageWindow.open(
               interferogramPlotIdPath.path //, interferogramPlotIdPath.id
            );
            console.abortEnabled = false; // workaround for 1123 bug.
            if (imageWindows.length != 1) {
               throw new Error(
                  "Internal error: " +
                  "generateInterferogramPlot: imageWindows.length != 1"
               );
            }
            imageWindow = imageWindows[0];
         }
      }
      if (model.generateViews) {
         imageWindow.zoomFactor = model.plotZoomFactor;
         imageWindow.fitWindow();
         imageWindow.show();
      }
      else {
         imageWindow.forceClose();
      }
   };

   // Generates encircled energy function plot.
   this.generateEncircledEnergyFunctionPlot = function() {
      var identifierPrefix = model.identifierPrefix.trim() == "" ?
         "" : filterViewId(model.identifierPrefix);

      if (model.outputDirectoryPath != null) {
         var encircledEnergyPlotIdPath = uniqueViewIdFullPath(
            identifierPrefix + "encircled_energy_function_plot",
            model.outputDirectoryPath + "/" +
            identifierPrefix + "encircled_energy_function_plot" + ".png"
         );
      }
      else {
         var encircledEnergyPlotIdPath = {
            id: uniqueViewId(
               identifierPrefix + "encircled_energy_function_plot"
            )
         };
      }

      var imageWindow = new ImageWindow(
         model.encircledEnergyPlot.width,
         model.encircledEnergyPlot.height,
         model.encircledEnergyPlot.numberOfChannels,
         8, // model.encircledEnergyPlot.bitsPerSample,
         false, // model.encircledEnergyPlot.isReal,
         model.encircledEnergyPlot.isColor,
         encircledEnergyPlotIdPath.id
      );
      imageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);
      imageWindow.mainView.image.assign(model.encircledEnergyPlot);
      imageWindow.mainView.endProcess();

      if (model.outputDirectoryPath != null) {
         this.saveImage(
            imageWindow, encircledEnergyPlotIdPath.path, this.saveImageHints()
         );
         if (model.generateViews) {
            imageWindow.forceClose();
            var imageWindows = ImageWindow.open(
               encircledEnergyPlotIdPath.path //, encircledEnergyPlotIdPath.id
            );
            console.abortEnabled = false; // workaround for 1123 bug.
            if (imageWindows.length != 1) {
               throw new Error(
                  "Internal error: " +
                  "generateEncircledEnergyFunctionPlot: " +
                  "imageWindows.length != 1"
               );
            }
            imageWindow = imageWindows[0];
         }
      }
      if (model.generateViews) {
         imageWindow.zoomFactor = model.plotZoomFactor;
         imageWindow.fitWindow();
         imageWindow.show();
      }
      else {
         imageWindow.forceClose();
      }
   };

   // Save encircled energy function.
   this.saveEncircledEnergyFunction = function() {
      var identifierPrefix = model.identifierPrefix.trim() == "" ?
         "" : filterViewId(model.identifierPrefix);

      var path = uniqueFullPath(
         model.outputDirectoryPath + "/" + identifierPrefix +
         "encircled_energy_function.csv"
      );

      var string = new String();

      string += "Diameter μm, Encircled energy\n";
      for (var i = 0; i != model.encircledEnergyFunctionEstimate.length; ++i) {
         string +=
            format("%.6f", 1e6 * model.encircledEnergyFunctionEstimate[i].x) +
            ", " +
            format("%.6f", model.encircledEnergyFunctionEstimate[i].y) +
            "\n";
      }

      console.writeln();
      console.writeln("<b>Writing encircled energy function file:</b>");
      console.writeln(path);
      console.flush();

      File.writeFile(path, ByteArray.stringToUTF8(string));
   };

   // Generate modulation transfer function plot.
   this.generateModulationTransferFunctionPlot = function() {
      var identifierPrefix = model.identifierPrefix.trim() == "" ?
         "" : filterViewId(model.identifierPrefix);

      if (model.outputDirectoryPath != null) {
         var modulationTransferFunctionPlotIdPath = uniqueViewIdFullPath(
            identifierPrefix + "modulation_transfer_function_plot",
            model.outputDirectoryPath + "/" +
            identifierPrefix + "modulation_transfer_function_plot" + ".png"
         );
      }
      else {
         var modulationTransferFunctionPlotIdPath = {
            id: uniqueViewId(
               identifierPrefix + "modulation_transfer_function_plot"
            )
         };
      }

      var imageWindow = new ImageWindow(
         model.modulationTransferFunctionPlot.width,
         model.modulationTransferFunctionPlot.height,
         model.modulationTransferFunctionPlot.numberOfChannels,
         8, // model.modulationTransferFunctionPlot.bitsPerSample,
         false, // model.modulationTransferFunctionPlot.isReal,
         model.modulationTransferFunctionPlot.isColor,
         modulationTransferFunctionPlotIdPath.id
      );
      imageWindow.mainView.beginProcess(UndoFlag_NoSwapFile);
      imageWindow.mainView.image.assign(model.modulationTransferFunctionPlot);
      imageWindow.mainView.endProcess();

      if (model.outputDirectoryPath != null) {
         this.saveImage(
            imageWindow,
            modulationTransferFunctionPlotIdPath.path,
            this.saveImageHints()
         );
         if (model.generateViews) {
            imageWindow.forceClose();
            var imageWindows = ImageWindow.open(
               modulationTransferFunctionPlotIdPath.path //,
               //modulationTransferFunctionPlotIdPath.id
            );
            console.abortEnabled = false; // workaround for 1123 bug.
            if (imageWindows.length != 1) {
               throw new Error(
                  "Internal error: " +
                  "generateModulationTransferFunctionPlot: " +
                  "imageWindows.length != 1"
               );
            }
            imageWindow = imageWindows[0];
         }
      }
      if (model.generateViews) {
         imageWindow.zoomFactor = model.plotZoomFactor;
         imageWindow.fitWindow();
         imageWindow.show();
      }
      else {
         imageWindow.forceClose();
      }
   };

   // Saves module transfer function.
   this.saveModulationTransferFunction = function() {
      var identifierPrefix = model.identifierPrefix.trim() == "" ?
         "" : filterViewId(model.identifierPrefix);

      var path = uniqueFullPath(
         model.outputDirectoryPath + "/" + identifierPrefix +
         "modulation_transfer_function_telescope.csv"
      );

      var string = new String();

      string += "Spatial frequency lp/mm, Sagittal modulation transfer, " +
         "Meridional modulation transfer\n";

      for (
         var i = 0;
         i != model.modulationTransferFunctionOpticsSagittal.length;
         ++i
      ) {
         string +=
            format(
               "%.6f", model.modulationTransferFunctionOpticsSagittal[i].x
            ) +
            ", " +
            format(
               "%.6f", model.modulationTransferFunctionOpticsSagittal[i].y
            ) +
            ", " +
            format("%.6f",
               i < model.modulationTransferFunctionOpticsMeridional.length ?
                  model.modulationTransferFunctionOpticsMeridional[i].y :
                  0
            ) +
            "\n";
      }

      console.writeln();
      console.writeln(
         "<b>Writing modulation transfer function telescope file:</b>"
      );
      console.writeln(path);
      console.flush();

      File.writeFile(path, ByteArray.stringToUTF8(string));

      var identifierPrefix = model.identifierPrefix.trim() == "" ?
         "" : filterViewId(model.identifierPrefix);

      var path = uniqueFullPath(
         model.outputDirectoryPath + "/" + identifierPrefix +
            "modulation_transfer_function_telescope_and_detector.csv"
      );

      var string = new String();

      string += "Spatial frequency lp/mm, Sagittal modulation transfer, " +
         "Meridional modulation transfer\n";

      for (
         var i = 0;
         i != model.modulationTransferFunctionDetectorSagittal.length;
         ++i
      ) {
         string +=
            format(
               "%.6f", model.modulationTransferFunctionDetectorSagittal[i].x
            ) +
            ", " +
            format(
               "%.6f", model.modulationTransferFunctionDetectorSagittal[i].y
            ) +
            ", " +
            format("%.6f",
               i < model.modulationTransferFunctionDetectorMeridional.length ?
                  model.modulationTransferFunctionDetectorMeridional[i].y :
                  0
            ) +
            "\n";
      }

      console.writeln();
      console.writeln(
         "<b>Writing modulation transfer function telescope and detector " +
         "file:</b>"
      );
      console.writeln(path);
      console.flush();

      File.writeFile(path, ByteArray.stringToUTF8(string));
   };

   // Saves wavefront estimate.
   this.saveWavefrontEstimate = function() {
      var identifierPrefix = model.identifierPrefix.trim() == "" ?
         "" : filterViewId(model.identifierPrefix);

      var path = uniqueFullPath(
         model.outputDirectoryPath + "/" + identifierPrefix +
         "wavefront_estimate.csv"
      );

      var string = new String();

      string +=
         "Observation wavelength, " +
         format(
            "%.6f, nm",
            model.scaleObservationWavelength * model.observationWavelength
         ) +
         "\n";
      string +=
         "Defocus distance, " +
         format(
            "%.6f, mm",
            model.scaleDefocusDistanceEstimate * model.defocusDistanceEstimate
         ) +
         "\n";
      string +=
         "Corrugation resolution, " +
         format(
            "%.6f, cycles per aperture diameter",
            model.scaleCorrugationResolutionEstimate *
               model.corrugationResolutionEstimate
         ) +
         "\n";
      string +=
         "Wavefront error, " +
         format(
            "%.6f, nm RMS",
            model.scaleWavefrontErrorEstimate * model.wavefrontErrorEstimate
         ) +
         "\n";
      string +=
         "Strehl ratio, " +
         format(
            "%.6f",
            model.scaleStrehlRatioEstimate * model.strehlRatioEstimate
         ) +
         "\n";
      string +=
         "Strehl diameter, " +
         format(
            "%.6f, μm",
            model.scaleStrehlDiameterEstimate * model.strehlDiameterEstimate
         ) +
         "\n";

      console.writeln();
      console.writeln("<b>Writing wavefront estimate file:</b>");
      console.writeln(path);
      console.flush();

      File.writeFile(path, ByteArray.stringToUTF8(string));
   }

   // Saves aberration estimate.
   this.saveAberrationEstimate = function() {
      var identifierPrefix = model.identifierPrefix.trim() == "" ?
         "" : filterViewId(model.identifierPrefix);

      var path = uniqueFullPath(
         model.outputDirectoryPath + "/" + identifierPrefix +
         "aberration_estimate.csv"
      );

      var string = new String();

      string += "Zernike aberration polynomial, Coefficient nm RMS\n";
      for (var i = 4; i != this.aberrationLabels.length; ++i) {
         string += format(
            this.aberrationLabels[i].replace(",", ";", "g") +
            ", " +
            "%.6f" +
            "\n",
            model.scaleAberrationCoefficientsEstimate *
               model.aberrationCoefficientsEstimate[i]
         );
      }

      console.writeln();
      console.writeln("<b>Writing aberrations file:</b>");
      console.writeln(path);
      console.flush();

      File.writeFile(path, ByteArray.stringToUTF8(string));
   };

   // Saves console log.
   this.saveConsoleLog = function() {
      var identifierPrefix = model.identifierPrefix.trim() == "" ?
         "" : filterViewId(model.identifierPrefix);

      var path = uniqueFullPath(
         model.outputDirectoryPath + "/" + identifierPrefix + "console_log.txt"
      );

      console.writeln();
      console.writeln("<b>Writing console log file:</b>");
      console.writeln(path);
      console.flush();

      File.writeFile(path, console.endLog());
   };
}

// ****************************************************************************
// EOF OutputDirectoryController.js - Released 2016/12/30 00:00:00 UTC
