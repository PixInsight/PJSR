//     ____       __ _____  ____
//    / __ \     / // ___/ / __ \
//   / /_/ /__  / / \__ \ / /_/ /
//  / ____// /_/ / ___/ // _, _/   PixInsight JavaScript Runtime
// /_/     \____/ /____//_/ |_|    PJSR Version 1.0
// ----------------------------------------------------------------------------
// pjsr/DataType.jsh - Released 2018-10-18T17:24:41Z
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

#ifndef __PJSR_DataType_jsh
#define __PJSR_DataType_jsh

/*
 * Data types recognized by File.read() and File.write()
 */
#define DataType_Boolean            0  // Native Boolean type
#define DataType_Int8               1  // 8-bit signed integer
#define DataType_UInt8              2  // 8-bit unsigned integer
#define DataType_Int16              3  // 16-bit signed integer
#define DataType_UInt16             4  // 16-bit unsigned integer
#define DataType_Int32              5  // 32-bit signed integer
#define DataType_UInt32             6  // 32-bit unsigned integer
#define DataType_Int64              7  // 64-bit signed integer
#define DataType_UInt64             8  // 64-bit unsigned integer
#define DataType_Real32             9  // 32-bit IEEE 754 floating point
#define DataType_Float             DataType_Real32
#define DataType_Real64            10  // 64-bit IEEE 754 floating point
#define DataType_Double            DataType_Real64
#define DataType_Complex32         11  // native Complex type, 32-bit IEEE 754 floating point
#define DataType_Complex64         12  // native Complex type, 64-bit IEEE 754 floating point
#define DataType_String8           13  // ISO 8859-1 string (8-bit characters)
#define DataType_String            DataType_String8  // Deprecated (ambiguous)
#define DataType_UCString          14  // Unicode string (16-bit characters)
#define DataType_ByteArray         15  // Native ByteArray type
#define DataType_Vector            16  // Native Vector type
#define DataType_Matrix            17  // Native Matrix type
#define DataType_Float32Array      18  // Float32Array
#define DataType_Float64Array      19  // Float64Array
#define DataType_Int32Array        20  // Int32Array
#define DataType_Uint32Array       21  // Uint32Array
#define DataType_Int16Array        22  // Int16Array
#define DataType_Uint16Array       23  // Uint16Array
#define DataType_Int8Array         24  // Int8Array
#define DataType_Uint8Array        25  // Uint8Array
#define DataType_Uint8ClampedArray 26  // Uint8ClampedArray

#endif   // __PJSR_DataType_jsh

// ----------------------------------------------------------------------------
// EOF pjsr/DataType.jsh - Released 2018-10-18T17:24:41Z
