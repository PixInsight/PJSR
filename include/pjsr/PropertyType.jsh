// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// pjsr/PropertyType.jsh - Released 2014/10/29 08:14:02 UTC
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

#ifndef __PJSR_PropertyType_jsh
#define __PJSR_PropertyType_jsh

/*
 * Data types recognized by View.setPropertyValue(), View.propertyType() and
 * FileFormatInstance.writeProperty().
 */
#define PropertyType_Invalid      0 // Invalid value type
#define PropertyType_Auto         0 // Automatic type detection
#define PropertyType_Boolean      1 // Native Boolean type
#define PropertyType_Int8         2 // 8-bit signed integer
#define PropertyType_Int16        3 // 16-bit signed integer
#define PropertyType_Int32        4 // 32-bit signed integer
#define PropertyType_Int64        5 // 64-bit signed integer
#define PropertyType_UInt8        6 // 8-bit unsigned integer
#define PropertyType_UInt16       7 // 16-bit unsigned integer
#define PropertyType_UInt32       8 // 32-bit unsigned integer
#define PropertyType_UInt64       9 // 64-bit unsigned integer
#define PropertyType_Real32      10 // 32-bit IEEE 754 floating point (float)
#define PropertyType_Float       PropertyType_Real32
#define PropertyType_Real64      11 // 64-bit IEEE 754 floating point (double)
#define PropertyType_Double      PropertyType_Real64
#define PropertyType_ByteArray   36 // Native ByteArray type
#define PropertyType_IVector     22 // Vector of 32-bit signed integers
#define PropertyType_UIVector    23 // Vector of 32-bit unsigned integers
#define PropertyType_I64Vector   24 // Vector of 64-bit signed integers
#define PropertyType_UI64Vector  25 // Vector of 64-bit unsigned integers
#define PropertyType_FVector     26 // Vector of 32-bit floating point values
#define PropertyType_DVector     27 // Vector of 64-bit floating point values
#define PropertyType_ByteMatrix  29 // Matrix of 8-bit unsigned integers
#define PropertyType_IMatrix     30 // Matrix of 32-bit signed integers
#define PropertyType_UIMatrix    31 // Matrix of 32-bit unsigned integers
#define PropertyType_I64Matrix   32 // Matrix of 64-bit signed integers
#define PropertyType_UI64Matrix  33 // Matrix of 64-bit unsigned integers
#define PropertyType_FMatrix     34 // Matrix of 32-bit floating point values
#define PropertyType_DMatrix     35 // Matrix of 64-bit floating point values
#define PropertyType_String8     38 // ISO 8859-1 or UTF-8 string (8-bit characters)
#define PropertyType_UCString    37 // Unicode string (16-bit characters)

#endif   // __PJSR_PropertyType_jsh

// ****************************************************************************
// EOF pjsr/PropertyType.jsh - Released 2014/10/29 08:14:02 UTC
