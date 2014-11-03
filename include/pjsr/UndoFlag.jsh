// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// pjsr/UndoFlag.jsh - Released 2014/10/29 08:14:02 UTC
// ****************************************************************************
// This file is part of the PixInsight JavaScript Runtime (PJSR).
// PJSR is an ECMA-262-5 compliant framework for development of scripts on the
// PixInsight platform.
//
// Copyright (c) 2003-2014, Pleiades Astrophoto S.L. All Rights Reserved.
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

#ifndef __PJSR_UndoFlag_jsh
#define __PJSR_UndoFlag_jsh

/*
 * Undo flags recognized by View.beginProcess()
 */
#define UndoFlag_DefaultMode           0x00000000  // Save pixel data and previews
#define UndoFlag_PixelData             0x00000001  // Save pixel data
#define UndoFlag_RGBWS                 0x00000002  // RGB Working Space data
#define UndoFlag_ICCProfile            0x00000004  // ICC profile
#define UndoFlag_Keywords              0x00000008  // FITS keywords
#define UndoFlag_Metadata              0x00000010  // Metadata
#define UndoFlag_IPTCPhotoInfo         0x00000020  // IPTC Photo Info data
#define UndoFlag_FormatData            0x00000040  // Format-specific data
#define UndoFlag_ImageId               0x00000080  // Image identifier
#define UndoFlag_Resolution            0x00000100  // Image resolution
#define UndoFlag_All                   0x0000FFFF  // Save all data items
#define UndoFlag_ExcludePreviews       0x80000000  // Don't save state of previews
#define UndoFlag_ExcludeMaskRelations  0x40000000  // Don't save masking dependencies
#define UndoFlag_NoSwapFile            0xFFFFFFFF  // Don't create a swap file

#endif   // __PJSR_UndoFlag_jsh

// ****************************************************************************
// EOF pjsr/UndoFlag.jsh - Released 2014/10/29 08:14:02 UTC
