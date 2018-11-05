// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// SubframeSelectorBitmapBox.js - Released 2018-11-05T16:53:08Z
// ----------------------------------------------------------------------------
//
// This file is part of SubframeSelector Script version 1.12
//
// Copyright (C) 2012-2018 Mike Schuster. All Rights Reserved.
// Copyright (C) 2003-2018 Pleiades Astrophoto S.L. All Rights Reserved.
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

function BitmapBox(parent) {
   this.__base__ = ScrollBox;
   this.__base__(parent);

   this.useHorizontalScrollBar = true;
   this.useVerticalScrollBar = false;

   this.autoScroll = false;
   this.horizontalScrollBarVisible = this.useHorizontalScrollBar;
   this.horizontalTracking = this.useHorizontalScrollBar;
   this.verticalScrollBarVisible = this.useVerticalScrollBar;
   this.verticalTracking = this.useVerticalScrollBar;

   this.bitmap = null;
   this.bitmapPosition = new Point(0, 0);
   this.scrollBarWidth = this.useVerticalScrollBar ? 24 : 0;
   this.scrollBarHeight = this.useHorizontalScrollBar ? 24 : 0;

   this.onResize = function() {
   };

   this.onMouseRelease = function(x, y, button, buttons, modifiers) {
   };

   this.onHorizontalScrollPosUpdated = function() {
      this.viewport.update();
   };

   this.setBitmap = function(bitmap) {
      //console.writeln("this.width: ", this.width);
      //console.writeln("this.height: ", this.height);
      //console.writeln("this.viewport.width: ", this.viewport.width);
      //console.writeln("this.viewport.height: ", this.viewport.height);

      this.bitmap = bitmap;
      this.bitmapPosition = this.bitmap != null ?
         new Point(
            Math.max(0, Math.round(
               0.5 * (this.width - this.scrollBarWidth - this.bitmap.width)
            )),
            Math.max(0, Math.round(
               0.5 * (this.height - this.scrollBarHeight - this.bitmap.height)
            ))
         ) :
         new Point(0, 0);

      this.lineWidth = this.useHorizontalScrollBar && this.bitmap != null ?
         Math.min(10, this.bitmap.width) : 0;
      this.lightHeight = 0;
      this.pageWidth = this.useHorizontalScrollBar && this.bitmap != null ?
         this.bitmap.width : 0;
      this.pageHeight = 0;
      this.setHorizontalScrollRange(
         0,
         this.useHorizontalScrollBar && this.bitmap != null ?
            Math.max(0, this.bitmap.width - this.width) : 0
      );
      this.setVerticalScrollRange(0, 0);

      this.viewport.update();
   };

   // viewport coordinate system is
   // positive x-axis to rightward,
   // positive y-axis downward
   this.viewport.onPaint = function(x0, y0, x1, y1) {
      var graphics = new Graphics(this);

      graphics.fillRect(x0, y0, x1, y1, new Brush(this.dialog.backgroundColor));
      if (this.parent.bitmap != null) {
         graphics.drawBitmap(
            this.parent.bitmapPosition.x - this.parent.scrollPosition.x,
            this.parent.bitmapPosition.y - this.parent.scrollPosition.y,
            this.parent.bitmap
         );
      }

      try {
         graphics.end();
      }
      catch (error) {
      }
   };

   this.viewport.onResize = function() {
      this.parent.onResize();
   };

   this.viewport.onMouseRelease = function(x, y, button, buttons, modifiers) {
      this.parent.onMouseRelease(
         x - this.parent.bitmapPosition.x + this.parent.scrollPosition.x,
         y - this.parent.bitmapPosition.y + this.parent.scrollPosition.y,
         button,
         buttons,
         modifiers
      );
   };

   this.setBitmap(null);
}
BitmapBox.prototype = new ScrollBox;

// ----------------------------------------------------------------------------
// EOF SubframeSelectorBitmapBox.js - Released 2018-11-05T16:53:08Z
