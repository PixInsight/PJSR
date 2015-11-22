// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// MureDenoise.js - Released 2015/11/20 00:00:00 UTC
// ****************************************************************************
//
// This file is part of MureDenoise Script Version 1.11
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

#define TITLE "MureDenoise"
#define VERSION "1.11"

#feature-id Noise Reduction > MureDenoise

#feature-info <b>MureDenoise Version 1.11</b><br/>\
   <br/>\
   Script for denoising linear monochannel images corrupted by mixed \
   Poisson-Gaussian noise. Applicable to single frame images and average \
   combinations of equally exposed and registered frames.<br/>\
   <br/>\
   The script supports an astronomical image processing workflow in which \
   the denoising step occurs immediately after the calibration and optional \
   average combination steps and prior to other linear or nonlinear \
   processing steps.<br/>\
   <br/>\
   The script applies an interscale wavelet mixed noise unbiased risk \
   estimator (MURE) to find a denoised output image that minimizes an \
   estimate of the oracle mean-squared error (MSE), or &quot;risk&quot;, \
   between the denoised output image and the unknown noise-free image.<br/>\
   <br/>\
   <b>Note</b>: For linear multichannel images, run the monochannel denoiser \
   on each channel separately. For linear one shot color (OSC) images, \
   denoise the color filter array (CFA) channels not the debayered RGB \
   channels.<br/>\
   <br/>\
   <b>Warning</b>: The script is adapted to denoise linear monochannel images \
   mainly corrupted by shot noise, read noise, and dark current noise which \
   is typically the case for astronomical data. The script does not work \
   properly for other noise distributions, for saturated images, for linearly \
   or nonlinearly processed images, for median combinations, or for drizzle \
   combinations.<br/>\
   <br/>\
   <b>Warning</b>: Do not combine denoised images. Signal-to-noise ratio \
   (SNR) will be enhanced by combining noisy images and denoising the \
   result. Combined images must be equally exposed, have the same pixel \
   resolution, and be registered by projective transformation with no \
   distortion correction. When denoising combinations, the script is unable \
   to remove correlated noise introduced by the image registration \
   process.<br/>\
   <br/>\
   Copyright &copy; 2012-2015 Mike Schuster. All Rights Reserved.<br/>\
   Copyright &copy; 2003-2015 Pleiades Astrophoto S.L. All Rights Reserved.

#include <pjsr/ColorSpace.jsh>
#include <pjsr/DataType.jsh>
#include <pjsr/FontFamily.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/PenStyle.jsh>
#include <pjsr/SampleType.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/UndoFlag.jsh>

#include "FrameMatrix.js"
#include "Global.js"
#include "MainModel.js"
#include "MainViewController.js"
#include "MureEstimator.js"
#include "NR3SVD.js"

function main() {
   console.hide();

   var model = new MainModel();
   model.loadSettings();
   model.loadParameters();

   var controller = new MainController(model);

   var view = new MainView(model, controller);
   controller.setView(view);

   if (Parameters.isViewTarget) {
      controller.setImageView(Parameters.targetView);
   }
   else {
      controller.setImageView(ImageWindow.activeWindow.currentView);
   }

   for (;;) {
      controller.execute();
      if (true || (new MessageBox(
         "Do you really want to dismiss " + TITLE + "?",
         TITLE,
         StdIcon_Question,
         StdButton_No,
         StdButton_Yes
      )).execute() == StdButton_Yes) {
         break;
      }
   }

   model.storeSettings();
   model.clear();
}

main();

gc();

// ****************************************************************************
// EOF MureDenoise.js - Released 2015/11/20 00:00:00 UTC
