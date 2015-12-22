//     ____       __ _____  ____
//    / __ \     / // ___/ / __ \
//   / /_/ /__  / / \__ \ / /_/ /
//  / ____// /_/ / ___/ // _, _/   PixInsight JavaScript Runtime
// /_/     \____/ /____//_/ |_|    PJSR Version 1.0
// ----------------------------------------------------------------------------
// pjsr/ResizeMode.jsh - Released 2015/11/09 15:21:11 UTC
// ----------------------------------------------------------------------------
// This file is part of the PixInsight JavaScript Runtime (PJSR).
// PJSR is an ECMA-262-5 compliant framework for development of scripts on the
// PixInsight platform.
//
// Copyright (c) 2003-2015 Pleiades Astrophoto S.L. All Rights Reserved.
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

#ifndef __PJSR_ResizeMode_jsh
#define __PJSR_ResizeMode_jsh

/*
 * Resizing modes for Image.resample()
 */
#define ResizeMode_RelativeDimensions  0  // Resize relative to current image dimensions
#define ResizeMode_AbsolutePixels      1  // Resize to absolute dimensions in pixels
#define ResizeMode_AbsoluteCentimeters 2  // Resize to absolute dimensions in centimeters
#define ResizeMode_AbsoluteInches      3  // Resize to absolute dimensions in inches
#define ResizeMode_ForceArea           4  // Force the total number of pixels and keep existing aspect ratio
#define ResizeMode_Default             ResizeMode_RelativeDimensions

/*
 * Absolute resizing modes for Image.resample()
 *
 * These modes are only applicable when the main resize mode is
 * ResizeMode_AbsolutePixels, ResizeMode_AbsoluteCentimeters or
 * ResizeMode_AbsoluteInches.
 */
#define AbsoluteResizeMode_ForceWidthAndHeight  0  // Force both dimensions
#define AbsoluteResizeMode_ForceWidth           1  // Force width, preserve aspect ratio
#define AbsoluteResizeMode_ForceHeight          2  // Force height, preserve aspect ratio
#define AbsoluteResizeMode_Default = AbsoluteResizeMode_ForceWidthAndHeight

#endif   // __PJSR_ResizeMode_jsh

// ----------------------------------------------------------------------------
// EOF pjsr/ResizeMode.jsh - Released 2015/11/09 15:21:11 UTC
