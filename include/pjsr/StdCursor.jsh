//     ____       __ _____  ____
//    / __ \     / // ___/ / __ \
//   / /_/ /__  / / \__ \ / /_/ /
//  / ____// /_/ / ___/ // _, _/   PixInsight JavaScript Runtime
// /_/     \____/ /____//_/ |_|    PJSR Version 1.0
// ----------------------------------------------------------------------------
// pjsr/StdCursor.jsh - Released 2015/07/23 10:07:13 UTC
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

#ifndef __PJSR_StdCursor_jsh
#define __PJSR_StdCursor_jsh

/*
 * Standard cursor shapes
 */
#define StdCursor_NoCursor              0                // no cursor is shown
#define StdCursor_Arrow                 1                // standard arrow cursor (pointing left)
#define StdCursor_InvArrow              2                // inverted arrow cursor (pointing right)
#define StdCursor_UpArrow               3                // upwards arrow
#define StdCursor_DownArrow             4                // downwards arrow
#define StdCursor_LeftArrow             5                // leftwards arrow
#define StdCursor_RightArrow            6                // rightwards arrow
#define StdCursor_Checkmark             7                // checkmark (ok) cursor
#define StdCursor_Crossmark             8                // crossmark (cancel) cursor
#define StdCursor_Accept                9                // arrow + checkmark
#define StdCursor_Reject               10                // arrow + crossmark
#define StdCursor_Add                  11                // arrow + plus sign
#define StdCursor_Copy                 12                // arrow + square
#define StdCursor_Cross                13                // crosshair
#define StdCursor_Hourglass            14                // hourglass (native Windows wait cursor)
#define StdCursor_Watch                15                // watch (native Macintosh wait cursor)
#define StdCursor_Wait                 StdCursor_Watch   // wait cursor: we like the watch! :)
#define StdCursor_ArrowWait            16                // arrow + hourglass/watch
#define StdCursor_ArrowQuestion        17                // arrow + question mark
#define StdCursor_IBeam                18                // I-beam cursor (text edition)
#define StdCursor_VerticalSize         19                // vertical resize
#define StdCursor_HorizontalSize       20                // horizontal resize
#define StdCursor_ForwardDiagonalSize  21                // forward diagonal resize (/)
#define StdCursor_BackwardDiagonalSize 22                // backward diagonal resize (\)
#define StdCursor_SizeAll              23                // resize in all directions
#define StdCursor_VerticalSplit        24                // split vertical
#define StdCursor_HorizontalSplit      25                // split horizontal
#define StdCursor_Hand                 26                // pointing hand cursor
#define StdCursor_PointingHand         StdCursor_Hand    // pointing hand cursor (same as Hand)
#define StdCursor_OpenHand             27                // open hand cursor
#define StdCursor_ClosedHand           28                // closed hand cursor
#define StdCursor_SquarePlus           29                // plus sign into a square (used for zoom in)
#define StdCursor_SquareMinus          30                // minus sign into a square (used for zoom out)
#define StdCursor_CirclePlus           31                // plus sign into a circle (used for zoom in)
#define StdCursor_CircleMinus          32                // minus sign into a circle (used for zoom out)
#define StdCursor_Forbidden            33                // stop cursor

#endif   // __PJSR_StdCursor_jsh

// ----------------------------------------------------------------------------
// EOF pjsr/StdCursor.jsh - Released 2015/07/23 10:07:13 UTC
