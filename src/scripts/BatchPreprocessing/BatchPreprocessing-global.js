// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// BatchPreprocessing-global.js - Released 2017-07-04T17:05:20Z
// ----------------------------------------------------------------------------
//
// This file is part of Batch Preprocessing Script version 1.46
//
// Copyright (c) 2012 Kai Wiechen
// Copyright (c) 2012-2017 Pleiades Astrophoto S.L.
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

/*
 * Global declarations and variables
 */

// ----------------------------------------------------------------------------

#define VERSION            "1.46"

#define TITLE              "Batch Preprocessing Script"

#define SETTINGS_KEY_BASE  "BatchPreprocessing/"

var ImageType = { UNKNOWN : -1, BIAS : 0, DARK : 1, FLAT : 2, LIGHT : 3 };

// Default parameters
#define DEFAULT_OUTPUT_DIRECTORY             ""
#define DEFAULT_CFA_IMAGES                   false
#define DEFAULT_UP_BOTTOM_FITS               true
#define DEFAULT_EXPORT_CALIBRATION_FILES     true
#define DEFAULT_SAVE_PROCESS_LOG             true
#define DEFAULT_GENERATE_REJECTION_MAPS      true
#define DEFAULT_INTEGRATE                    true
#define DEFAULT_DARK_OPTIMIZATION_WINDOW     1024
#define DEFAULT_DARK_EXPOSURE_TOLERANCE      10
#define DEFAULT_CFA_PATTERN                  Debayer.prototype.Auto
#define DEFAULT_DEBAYER_METHOD               Debayer.prototype.VNG
#define DEFAULT_OPTIMIZE_DARKS               true
#define DEFAULT_DARK_OPTIMIZATION_LOW        3.0
#define DEFAULT_EVALUATE_NOISE               true
#define DEFAULT_FLATS_LARGE_SCALE_REJECTION  false
#define DEFAULT_FLATS_LARGE_SCALE_LAYERS     2
#define DEFAULT_FLATS_LARGE_SCALE_GROWTH     2
#define DEFAULT_COSMETIC_CORRECTION          false
#define DEFAULT_COSMETIC_CORRECTION_TEMPLATE ""
#define DEFAULT_CALIBRATE_ONLY               false
#define DEFAULT_GENERATE_DRIZZLE_DATA        true
#define DEFAULT_SA_PIXEL_INTERPOLATION       StarAlignment.prototype.Auto
#define DEFAULT_SA_CLAMPING_THRESHOLD        0.3
#define DEFAULT_SA_MAX_STARS                 500
#define DEFAULT_SA_NOISE_REDUCTION           0
#define DEFAULT_SA_USE_TRIANGLE_SIMILARITY   true

// ----------------------------------------------------------------------------
// EOF BatchPreprocessing-global.js - Released 2017-07-04T17:05:20Z
