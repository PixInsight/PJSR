//     ____       __ _____  ____
//    / __ \     / // ___/ / __ \
//   / /_/ /__  / / \__ \ / /_/ /
//  / ____// /_/ / ___/ // _, _/   PixInsight JavaScript Runtime
// /_/     \____/ /____//_/ |_|    PJSR Version 1.0
// ----------------------------------------------------------------------------
// pjsr/FileAttribute.jsh - Released 2018-11-30T21:30:59Z
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

#ifndef __PJSR_FileAttribute_jsh
#define __PJSR_FileAttribute_jsh

/*
 * File information items reported by FileInfo.attributes
 */

/*
 * File type
 */
#define FileType_Block                 0x00000001  // Block special
#define FileType_Character             0x00000002  // Character special
#define FileType_FIFO                  0x00000004  // FIFO special
#define FileType_Regular               0x00000008  // Regular file
#define FileType_Directory             0x00000010  // Directory
#define FileType_SymbolicLink          0x00000020  // Symbolic link
#define FileType_Socket                0x00000040  // Socket
#define FileType_Mask                  0x000000FF

/*
 * File attributes
 * Windows-exclusive, except ReadOnly and Hidden, which we emulate on X.
 */
#define FileAttribute_Archive          0x00001000  // File is archived
#define FileAttribute_Compressed       0x00002000  // File is compressed
#define FileAttribute_Encrypted        0x00004000  // File is encrypted
#define FileAttribute_Hidden           0x00008000  // File is hidden
#define FileAttribute_ReadOnly         0x00010000  // File is read-only
#define FileAttribute_System           0x00020000  // File is a system file
#define FileAttribute_Temporary        0x00040000  // File is a temporary file
#define FileAttribute_Mask             0x000FF000

/*
 * File permissions
 */
#define FilePermission_Read            0x00100000  // Owner can read
#define FilePermission_Write           0x00200000  // Owner can write
#define FilePermission_Execute         0x00400000  // Owner can execute/search
#define FilePermission_ReadGroup       0x01000000  // Group can read
#define FilePermission_WriteGroup      0x02000000  // Group can write
#define FilePermission_ExecuteGroup    0x04000000  // Group can execute/search
#define FilePermission_ReadOthers      0x10000000  // Others can read
#define FilePermission_WriteOthers     0x20000000  // Others can write
#define FilePermission_ExecuteOthers   0x40000000  // Others can execute/search
#define FilePermission_Mask            0xFFF00000

#endif   // __PJSR_FileAttribute_jsh

// ----------------------------------------------------------------------------
// EOF pjsr/FileAttribute.jsh - Released 2018-11-30T21:30:59Z
