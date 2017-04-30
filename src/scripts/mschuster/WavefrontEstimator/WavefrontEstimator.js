// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// WavefrontEstimator.js - Released 2016/12/30 00:00:00 UTC
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

#define TITLE "WavefrontEstimator"
#define VERSION "1.19"

#feature-id Instrumentation > WavefrontEstimator

#feature-info <b>WavefrontEstimator Version 1.19</b><br/>\
   <br/>\
   Script for testing the on-axis optical quality of telescopes.<br/>\
   <br/>\
   WavefrontEstimator estimates the on-axis optical wavefront of \
   a telescope from long-exposure defocused stellar images. \
   Exposure differences between an intra-focal image and an \
   inverted (rotated by 180&deg;) extra-focal image of the same \
   bright star reflect local changes in the curvature of the \
   wavefront. WavefrontEstimator measures the \
   defocused image exposure differences, reconstructs the \
   wavefront, and provides a diagnosis of wavefront aberrations. \
   WavefrontEstimator relies on long combined exposures of at least \
   100 seconds and 100,000 e- to average out the effects of \
   atmospheric turbulence and provide sufficient signal-to-noise \
   ratio. The telescope must be in thermal equilibrium.<br/>\
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

#include "EncircledEnergyFunctionPlot.js"
#include "EstimateEncircledEnergyFunction.js"
#include "EstimateModulationTransferFunction.js"
#include "EstimatePointSpreadFunction.js"
#include "EstimateWavefront.js"
#include "ExposureTabViewController.js"
#include "FrameMatrix.js"
#include "FramesTabViewController.js"
#include "Global.js"
#include "InterferogramPlot.js"
#include "MainModel.js"
#include "MainViewController.js"
#include "ModulationTransferFunctionPlot.js"
#include "NR3SVD.js"
#include "OutputDirectoryController.js"
#include "ParametersTabViewController.js"
#include "RegisterCombineFrames.js"
#include "RousseeuwCrouxSn.js"
#include "WavefrontPlot.js"
#include "WavefrontTabViewController.js"
#include "ZernikeAberrations.js"

function main() {
   if (Parameters.isViewTarget) {
      throw new Error(
         TITLE + " Version " + VERSION +
         " can only be executed in the global context."
      );
   }

   console.hide();

   var model = new MainModel();
   model.loadSettings();
   model.loadParameters();

   var controller = new MainController(model);

   var view = new MainView(model, controller);
   controller.setView(view);

   controller.resetOutput();
   for (;;) {
      controller.execute();
      if ((new MessageBox(
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
// EOF WavefrontEstimator.js - Released 2016/12/30 00:00:00 UTC
