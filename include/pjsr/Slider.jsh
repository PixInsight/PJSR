//     ____       __ _____  ____
//    / __ \     / // ___/ / __ \
//   / /_/ /__  / / \__ \ / /_/ /
//  / ____// /_/ / ___/ // _, _/   PixInsight JavaScript Runtime
// /_/     \____/ /____//_/ |_|    PJSR Version 1.0
// ----------------------------------------------------------------------------
// pjsr/Slider.jsh - Released 2015/11/09 15:21:11 UTC
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

#ifndef __PJSR_Slider_jsh
#define __PJSR_Slider_jsh

/*
 * Horizontal slider class
 */
function HorizontalSlider( parent )
{
   this.__base__ = Slider;
   this.__base__( parent, false );
}
HorizontalSlider.prototype = new Slider;

/*
 * Vertical slider class
 */
function VerticalSlider( parent )
{
   this.__base__ = Slider;
   this.__base__( parent, true );
}
VerticalSlider.prototype = new Slider;

/*
 * Slider tick styles
 */
#define TickStyle_NoTicks     0x00                           // The slider has no ticks
#define TickStyle_Top         0x01                           // Ticks are drawn at the top edge of a horizontal slider
#define TickStyle_Left        TickStyle_Top                  // Ticks are drawn at the left edge of a vertical slider
#define TickStyle_Bottom      0x02                           // Ticks are drawn at the bottom edge of a horizontal slider
#define TickStyle_Right       TickStyle_Bottom               // Ticks are drawn at the right edge of a vertical slider
#define TickStyle_BothSides   TickStyle_Top|TickStyle_Bottom // Ticks are drawn at both edges of the slider

#endif   // __PJSR_Slider_jsh

// ----------------------------------------------------------------------------
// EOF pjsr/Slider.jsh - Released 2015/11/09 15:21:11 UTC
