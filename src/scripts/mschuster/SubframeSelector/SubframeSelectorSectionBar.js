// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// SubframeSelectorSectionBar.js - Released 2016/04/06 00:00:00 UTC
// ****************************************************************************
//
// This file is part of SubframeSelector Script version 1.5
//
// Copyright (C) 2012-2016 Mike Schuster. All Rights Reserved.
// Copyright (C) 2003-2016 Pleiades Astrophoto S.L. All Rights Reserved.
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

function SectionBar(parent) {
   this.__base__ = Control;
   if (parent != null) {
      this.__base__(parent);
   }
   else {
      this.__base__();
   }

   this.section = null;

//#ifgteq __PI_BUILD__ 854
//   var bgColor =
//      Settings.readGlobal("InterfaceWindow/SectionBarColor", DataType_UInt32);
//   var fgColor =
//      Settings.readGlobal("InterfaceWindow/SectionBarTextColor", DataType_UInt32);
//#else
   // PJSR access to global settings is broken in PI 1.7
   var bgColor = Color.rgbaColor(192, 192, 168, 255);
   var fgColor = Color.rgbaColor(0, 0, 255, 255);
//#endif

   var contractIcon = this.scaledResource(":/process-interface/contract-vert.png");
   var expandIcon = this.scaledResource(":/process-interface/expand-vert.png");

   this.backgroundColor = bgColor;
   this.focusStyle = FocusStyle_NoFocus;

   this.label = new Label(this);
   with (this.label) {
      textAlignment = TextAlign_Left | TextAlign_VertCenter;
      styleSheet =
         "QLabel {" +
            "color: " + Color.rgbColorToHexString(fgColor) + "; " +
            "background: " + Color.rgbColorToHexString(bgColor) + ";" +
         "}" +
         "QLabel:disabled { " +
            "color: gray;" +
         "}";
   }

   this.button = new ToolButton(this);
   with (this.button) {
      icon = contractIcon;
      setScaledFixedSize(17, 17);
      focusStyle = FocusStyle_NoFocus;
      onClick = function() {
         this.parent.toggleSection();
      };
   }

   var hSizer = new HorizontalSizer;
   with (hSizer) {
      addSpacing(4);
      add(this.label);
      addStretch();
      add(this.button);
      addSpacing(4);
   }

   this.sizer = new VerticalSizer;
   with (this.sizer) {
      addSpacing(1);
      add(hSizer);
      addSpacing(1);
   }

   this.adjustToContents();
   this.setFixedHeight();

   this.onMousePress = function(x, y, button, buttonState, modifiers) {
      if (button == MouseButton_Left) {
         this.button.onClick();
      }
   };

   this.onShow = function() {
      this.updateIcon();
   };

   this.toggleSection = function() {
      if (this.section != null) {
         // workaround for dialog width layout issue
         // without this patch dialog width may be reduced on section show/hide
         var dialogIsFixedWidth = this.dialog.isFixedWidth;
         var dialogMinWidth = this.dialog.minWidth;
         this.dialog.setFixedWidth();

         this.setFixedWidth();

         if (this.section.visible) {
            this.section.hide();
         }
         else {
            this.section.show();
         }

         this.updateIcon();

         // workaround for dialog height layout issue
         // without this patch on MacOSX section children may be squished or overlapped
         // on section show/hide
         // without this patch section children height (if variable) may be reduced on
         // section show/hide
         // children minHeight (if variable) may be modified by this patch (this is an
         // unwanted side effect)
         var dialogIsFixedHeight = this.dialog.isFixedHeight;
         var sectionHeight = this.section.height + this.dialog.sizer.spacing;
         this.dialog.setMinHeight(
            this.dialog.height + (this.section.visible ? sectionHeight : -sectionHeight)
         );

         this.dialog.adjustToContents();

         // workaround for dialog height layout issue
         if (dialogIsFixedHeight) {
            this.dialog.setFixedHeight();
         }

         this.setVariableWidth();

         // workaround for dialog width layout issue
         if (!dialogIsFixedWidth) {
            this.dialog.setVariableWidth();
         }
         this.dialog.minWidth = dialogMinWidth;
      }
   };

   this.updateIcon = function() {
      if (this.section != null) {
         if (this.section.visible) {
            this.button.icon = contractIcon;
         }
         else {
            this.button.icon = expandIcon;
         }
      }
   };

   this.setTitle = function(title) {
      this.label.text = title;
   };

   this.setSection = function(section) {
      this.section = section;
      this.updateIcon();
   };
}
SectionBar.prototype = new Control;

// ****************************************************************************
// EOF SubframeSelectorSectionBar.js - Released 2016/04/06 00:00:00 UTC
