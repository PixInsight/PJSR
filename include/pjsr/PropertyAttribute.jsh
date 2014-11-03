// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// pjsr/PropertyAttribute.jsh - Released 2014/10/29 08:14:02 UTC
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

#ifndef __PJSR_PropertyAttribute_jsh
#define __PJSR_PropertyAttribute_jsh

/*
 * Property attributes recognized by View.setPropertyValue() and
 * View.propertyAttributes().
 */
#define PropertyAttribute_WriteProtected  0x00000001 // Only the module that has created the property can modify it.
#define PropertyAttribute_ReadProtected   0x00000002 // Only the module that has created the property can read its value (implies write protection).
#define PropertyAttribute_Volatile        0x00000010 // Volatile properties are not stored in processing histories, so they get lost across undo/redo operations.
#define PropertyAttribute_Permanent       0x00000020 // Permanent properties are not stored in processing histories, but unlike volatile properties, they are preserved across undo/redo operations.
#define PropertyAttribute_NotSerializable 0x00000040 // The property will not be stored in projects.
#define PropertyAttribute_Storable        0x00000080 // The property can be stored in image files (when using image formats able to store data properties).
#define PropertyAttribute_Reserved        0x10000000 // The property has been reserved by the PixInsight Core application.
#define PropertyAttribute_NoChange        0x80000000 // Special flag used to preserve the existing property attributes in function calls.

#endif   // __PJSR_PropertyAttribute_jsh

// ****************************************************************************
// EOF pjsr/PropertyAttribute.jsh - Released 2014/10/29 08:14:02 UTC
