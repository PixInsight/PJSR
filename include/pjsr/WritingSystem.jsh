//     ____       __ _____  ____
//    / __ \     / // ___/ / __ \
//   / /_/ /__  / / \__ \ / /_/ /
//  / ____// /_/ / ___/ // _, _/   PixInsight JavaScript Runtime
// /_/     \____/ /____//_/ |_|    PJSR Version 1.0
// ----------------------------------------------------------------------------
// pjsr/WritingSystem.jsh - Released 2018-10-18T17:24:41Z
// ----------------------------------------------------------------------------
// This file is part of the PixInsight JavaScript Runtime (PJSR).
// PJSR is an ECMA-262-5 compliant framework for development of scripts on the
// PixInsight platform.
//
// Copyright (c) 2003-2018 Pleiades Astrophoto S.L. All Rights Reserved.
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

#ifndef __PJSR_WritingSystem_jsh
#define __PJSR_WritingSystem_jsh

/*
 * Writing systems recognized by Font.families()
 */
#define WritingSystem_Any                  0
#define WritingSystem_Latin                1
#define WritingSystem_Greek                2
#define WritingSystem_Cyrillic             3
#define WritingSystem_Armenian             4
#define WritingSystem_Hebrew               5
#define WritingSystem_Arabic               6
#define WritingSystem_Syriac               7
#define WritingSystem_Thaana               8
#define WritingSystem_Devanagari           9
#define WritingSystem_Bengali             10
#define WritingSystem_Gurmukhi            11
#define WritingSystem_Gujarati            12
#define WritingSystem_Oriya               13
#define WritingSystem_Tamil               14
#define WritingSystem_Telugu              15
#define WritingSystem_Kannada             16
#define WritingSystem_Malayalam           17
#define WritingSystem_Sinhala             18
#define WritingSystem_Thai                19
#define WritingSystem_Lao                 20
#define WritingSystem_Tibetan             21
#define WritingSystem_Myanmar             22
#define WritingSystem_Georgian            23
#define WritingSystem_Khmer               24
#define WritingSystem_SimplifiedChinese   25
#define WritingSystem_TraditionalChinese  26
#define WritingSystem_Japanese            27
#define WritingSystem_Korean              28
#define WritingSystem_Vietnamese          29
#define WritingSystem_Symbol              30

#endif   // __PJSR_WritingSystem_jsh

// ----------------------------------------------------------------------------
// EOF pjsr/WritingSystem.jsh - Released 2018-10-18T17:24:41Z
