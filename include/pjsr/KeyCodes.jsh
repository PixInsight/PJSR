//     ____       __ _____  ____
//    / __ \     / // ___/ / __ \
//   / /_/ /__  / / \__ \ / /_/ /
//  / ____// /_/ / ___/ // _, _/   PixInsight JavaScript Runtime
// /_/     \____/ /____//_/ |_|    PJSR Version 1.0
// ----------------------------------------------------------------------------
// pjsr/KeyCodes.jsh - Released 2017-08-01T14:29:08Z
// ----------------------------------------------------------------------------
// This file is part of the PixInsight JavaScript Runtime (PJSR).
// PJSR is an ECMA-262-5 compliant framework for development of scripts on the
// PixInsight platform.
//
// Copyright (c) 2003-2017 Pleiades Astrophoto S.L. All Rights Reserved.
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

#ifndef __PJSR_KeyCodes_jsh
#define __PJSR_KeyCodes_jsh

/*
 * Key codes on the PixInsight/PCL platform
 */
#define Key_Backspace         0x00000008
#define Key_Tab               0x00000009
#define Key_Clear             0x0000000c
#define Key_Return            0x0000000d
#define Key_Enter             0x0000000d
#define Key_Escape            0x0000001b
#define Key_Shift             0x70000001
#define Key_Control           0x70000002
#define Key_Alt               0x70000003
#define Key_Meta              0x70000004
#define Key_CapsLock          0x70000010
#define Key_NumLock           0x70000020
#define Key_ScrollLock        0x70000030
#define Key_Pause             0x70000100
#define Key_Print             0x70000200
#define Key_Help              0x70000300
#define Key_SysReq            0x70000400
#define Key_Left              0x10000001
#define Key_Up                0x10000002
#define Key_Right             0x10000003
#define Key_Down              0x10000004
#define Key_Insert            0x10000010
#define Key_Delete            0x10000020
#define Key_Home              0x10000100
#define Key_End               0x10000200
#define Key_PageUp            0x10000300
#define Key_PageDown          0x10000400
#define Key_F1                0x08000001
#define Key_F2                0x08000002
#define Key_F3                0x08000003
#define Key_F4                0x08000004
#define Key_F5                0x08000005
#define Key_F6                0x08000006
#define Key_F7                0x08000007
#define Key_F8                0x08000008
#define Key_F9                0x08000009
#define Key_F10               0x0800000a
#define Key_F11               0x0800000b
#define Key_F12               0x0800000c
#define Key_F13               0x0800000d
#define Key_F14               0x0800000e
#define Key_F15               0x0800000f
#define Key_F16               0x08000010
#define Key_F17               0x08000020
#define Key_F18               0x08000030
#define Key_F19               0x08000040
#define Key_F20               0x08000050
#define Key_F21               0x08000060
#define Key_F22               0x08000070
#define Key_F23               0x08000080
#define Key_F24               0x08000090
#define Key_Space             0x00000020
#define Key_Exclamation       0x00000021
#define Key_DoubleQuote       0x00000022
#define Key_NumberSign        0x00000023
#define Key_Dollar            0x00000024
#define Key_Percent           0x00000025
#define Key_Ampersand         0x00000026
#define Key_Apostrophe        0x00000027
#define Key_LeftParenthesis   0x00000028
#define Key_RightParenthesis  0x00000029
#define Key_Asterisk          0x0000002a
#define Key_Plus              0x0000002b
#define Key_Comma             0x0000002c
#define Key_Minus             0x0000002d
#define Key_Period            0x0000002e
#define Key_Slash             0x0000002f
#define Key_Zero              0x00000030
#define Key_One               0x00000031
#define Key_Two               0x00000032
#define Key_Three             0x00000033
#define Key_Four              0x00000034
#define Key_Five              0x00000035
#define Key_Six               0x00000036
#define Key_Seven             0x00000037
#define Key_Eight             0x00000038
#define Key_Nine              0x00000039
#define Key_Colon             0x0000003a
#define Key_Semicolon         0x0000003b
#define Key_Less              0x0000003c
#define Key_Equal             0x0000003d
#define Key_Greater           0x0000003e
#define Key_Question          0x0000003f
#define Key_At                0x00000040
#define Key_A                 0x00000041
#define Key_B                 0x00000042
#define Key_C                 0x00000043
#define Key_D                 0x00000044
#define Key_E                 0x00000045
#define Key_F                 0x00000046
#define Key_G                 0x00000047
#define Key_H                 0x00000048
#define Key_I                 0x00000049
#define Key_J                 0x0000004a
#define Key_K                 0x0000004b
#define Key_L                 0x0000004c
#define Key_M                 0x0000004d
#define Key_N                 0x0000004e
#define Key_O                 0x0000004f
#define Key_P                 0x00000050
#define Key_Q                 0x00000051
#define Key_R                 0x00000052
#define Key_S                 0x00000053
#define Key_T                 0x00000054
#define Key_U                 0x00000055
#define Key_V                 0x00000056
#define Key_W                 0x00000057
#define Key_X                 0x00000058
#define Key_Y                 0x00000059
#define Key_Z                 0x0000005a
#define Key_LeftBracket       0x0000005b
#define Key_Backslash         0x0000005c
#define Key_RightBracket      0x0000005d
#define Key_Circumflex        0x0000005e
#define Key_Underscore        0x0000005f
#define Key_LeftQuote         0x00000060
#define Key_LeftBrace         0x0000007b
#define Key_Bar               0x0000007c
#define Key_RightBrace        0x0000007d
#define Key_Tilde             0x0000007e
#define Key_Unknown           0x7fffffff

#endif   // __PJSR_KeyCodes_jsh

// ----------------------------------------------------------------------------
// EOF pjsr/KeyCodes.jsh - Released 2017-08-01T14:29:08Z
