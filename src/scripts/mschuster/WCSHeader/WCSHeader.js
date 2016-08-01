// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// WCSHeader.js - Released 2016/07/31 00:00:00 UTC
// ****************************************************************************
//
// This file is part of WCSHeader Script version 1.6
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

#define TITLE "WCSHeader"
#define VERSION "1.6"

#feature-id Utilities > WCSHeader

#feature-info <b>WCSHeader Version 1.6</b><br/>\
   <br/>\
   Script for displaying an image's FITS World Coordinate System (WCS) \
   astrometric header information.<br/>\
   <br/>\
   Copyright &copy; 2012-2016 Mike Schuster. All Rights Reserved.<br/>\
   Copyright &copy; 2003-2016 Pleiades Astrophoto S.L. All Rights Reserved.

#include <pjsr/FrameStyle.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/TextAlign.jsh>

// The script's parameters prototype.
function parametersPrototype() {
   this.targetView = null;
   this.dialog = null;
}
var parameters = new parametersPrototype();

function rightAscensionOfAngle(angle) {
   var hour = 24.0 * angle / 360.0;
   var minute = 60.0 * (hour - Math.floor(hour));
   var second = 60.0 * (minute - Math.floor(minute));
   hour = Math.floor(hour);
   minute = Math.floor(minute);
   second = Math.round(100.0 * second);
   if (second == 6000.0) {
      second -= 6000.0;
      minute += 1.0;
   }
   if (minute == 60.0) {
      minute -= 60.0;
      hour += 1.0;
   }
   return format("%02dh %02dm %02d.%02ds",
      hour, minute, Math.floor(second / 100.0), Math.mod(second, 100)
   );
}

function declinationOfAngle(angle) {
   var degree = Math.abs(angle);
   var minute = 60.0 * (degree - Math.floor(degree));
   var second = 60.0 * (minute - Math.floor(minute));
   degree = Math.floor(degree);
   minute = Math.floor(minute);
   second = Math.round(10.0 * second);
   if (second == 600.0) {
      second -= 600.0;
      minute += 1.0;
   }
   if (minute == 60.0) {
      minute -= 60.0;
      degree += 1.0;
   }
   var sign = "+";
   if (angle < 0.0) {
      var sign = "-";
   }
   return sign + format("%02d° %02d' %02d.%01d\"",
      degree, minute, Math.floor(second / 10.0), Math.mod(second, 10)
   );
}

function fieldOfAngle(angle) {
   var degree = Math.abs(angle);
   var minute = 60.0 * (degree - Math.floor(degree));
   var second = 60.0 * (minute - Math.floor(minute));
   degree = Math.floor(degree);
   minute = Math.floor(minute);
   second = Math.round(10.0 * second);
   if (second == 600.0) {
      second -= 600.0;
      minute += 1.0;
   }
   if (minute == 60.0) {
      minute -= 60.0;
      degree += 1.0;
   }
   return format("%d° %02d' %02d.%01d\"",
      degree, minute, Math.floor(second / 10.0), Math.mod(second, 10)
   );
}

function positionAngleOfAngle(angle, mirrored) {
   if (mirrored) {
      angle = 180.0 - angle;
   }
   for (; angle < 0.0;) {
      angle += 360.0;
   }
   for (; angle > 360.0;) {
      angle -= 360.0;
   }
   var degree = Math.abs(angle);
   var minute = 60.0 * (degree - Math.floor(degree));
   degree = Math.floor(degree);
   minute = Math.round(10.0 * minute);
   if (minute == 600.0) {
      minute -= 600.0;
      degree += 1.0;
   }
   var result = format(
      "%03d° %02d.%01d'",
      degree,
      Math.floor(minute / 10.0),
      Math.mod(minute, 10)
   );
   if (mirrored) {
      result = result + " (mirrored)";
   }
   return result;
}

function getEquinox() {
   if (parameters.targetView.isNull) {
      return "-";
   }

   var keywords = parameters.targetView.window.keywords;
   var equinox = null;
   for (var i = 0; i != keywords.length; ++i) {
      if (keywords[i].name == "EQUINOX") {
         equinox = keywords[i];
      }
   }
   if (equinox == null) {
      return "-";
   }

   return "J" + equinox.value;
}

function getRightAscension() {
   if (parameters.targetView.isNull) {
      return "-";
   }

   var keywords = parameters.targetView.window.keywords;
   var ctype1 = null;
   var crval1 = null;
   for (var i = 0; i != keywords.length; ++i) {
      if (keywords[i].name == "CTYPE1") {
         ctype1 = keywords[i];
      }
      if (keywords[i].name == "CRVAL1") {
         crval1 = keywords[i];
      }
   }
   if (ctype1 == null || crval1 == null) {
      return "-";
   }
   if (ctype1.value != "'RA---TAN'") {
      return "-";
   }

   var crval1Value = parseFloat(crval1.value);

   return rightAscensionOfAngle(crval1Value);
}

function getDeclination() {
   if (parameters.targetView.isNull) {
      return "-";
   }

   var keywords = parameters.targetView.window.keywords;
   var ctype2 = null;
   var crval2 = null;
   for (var i = 0; i != keywords.length; ++i) {
      if (keywords[i].name == "CTYPE2") {
         ctype2 = keywords[i];
      }
      if (keywords[i].name == "CRVAL2") {
         crval2 = keywords[i];
      }
   }
   if (ctype2 == null || crval2 == null) {
      return "-";
   }
   if (ctype2.value != "'DEC--TAN'") {
      return "-";
   }

   var crval2Value = parseFloat(crval2.value);

   return declinationOfAngle(crval2Value);
}

function getPositionAngle() {
   if (parameters.targetView.isNull) {
      return "-";
   }

   var keywords = parameters.targetView.window.keywords;
   var cd11 = null;
   var cd12 = null;
   var cd21 = null;
   var cd22 = null;
   for (var i = 0; i != keywords.length; ++i) {
      if (keywords[i].name == "CD1_1") {
         cd11 = keywords[i];
      }
      if (keywords[i].name == "CD1_2") {
         cd12 = keywords[i];
      }
      if (keywords[i].name == "CD2_1") {
         cd21 = keywords[i];
      }
      if (keywords[i].name == "CD2_2") {
         cd22 = keywords[i];
      }
   }
   if (cd11 == null || cd12 == null || cd21 == null || cd22 == null) {
      return "-";
   }

   var cd11Value = parseFloat(cd11.value);
   var cd12Value = parseFloat(cd12.value);
   var cd21Value = parseFloat(cd21.value);
   var cd22Value = parseFloat(cd22.value);

   //console.writeln("cd11Value: ", cd11Value);
   //console.writeln("cd12Value: ", cd12Value);
   //console.writeln("cd21Value: ", cd21Value);
   //console.writeln("cd22Value: ", cd22Value);
   //console.writeln("angle: ",
   //    Math.atan2(-cd12Value, -cd11Value) * 360.0 / (2.0 * Math.PI)
   //);
   //console.writeln("cross: ", cd11Value * cd22Value - cd12Value * cd21Value);

   var angle = Math.atan2(-cd12Value, -cd11Value) * 360.0 / (2.0 * Math.PI);
   return positionAngleOfAngle(
      angle, cd11Value * cd22Value - cd12Value * cd21Value < 0.0
   );
}

function getImageScale() {
   if (parameters.targetView.isNull) {
      return "-";
   }

   var keywords = parameters.targetView.window.keywords;
   var cd11 = null;
   var cd12 = null;
   var cd21 = null;
   var cd22 = null;
   for (var i = 0; i != keywords.length; ++i) {
      if (keywords[i].name == "CD1_1") {
         cd11 = keywords[i];
      }
      if (keywords[i].name == "CD1_2") {
         cd12 = keywords[i];
      }
      if (keywords[i].name == "CD2_1") {
         cd21 = keywords[i];
      }
      if (keywords[i].name == "CD2_2") {
         cd22 = keywords[i];
      }
   }
   if (cd11 == null || cd12 == null || cd21 == null || cd22 == null) {
      return "-";
   }

   var cd11Value = parseFloat(cd11.value);
   var cd12Value = parseFloat(cd12.value);
   var cd21Value = parseFloat(cd21.value);
   var cd22Value = parseFloat(cd22.value);
   var res1 = Math.sqrt(cd11Value * cd11Value + cd12Value * cd12Value);
   var res2 = Math.sqrt(cd21Value * cd21Value + cd22Value * cd22Value);
   if (res1 * res2 <= 0.0) {
      return "-";
   }

   return format("%.2f\"/pixel", 3600.0 * Math.sqrt(res1 * res2));
}

function getFieldWidth() {
   if (parameters.targetView.isNull) {
      return "-";
   }

   var keywords = parameters.targetView.window.keywords;
   var cd11 = null;
   var cd12 = null;
   var cd21 = null;
   var cd22 = null;
   for (var i = 0; i != keywords.length; ++i) {
      if (keywords[i].name == "CD1_1") {
         cd11 = keywords[i];
      }
      if (keywords[i].name == "CD1_2") {
         cd12 = keywords[i];
      }
      if (keywords[i].name == "CD2_1") {
         cd21 = keywords[i];
      }
      if (keywords[i].name == "CD2_2") {
         cd22 = keywords[i];
      }
   }
   if (cd11 == null || cd12 == null || cd21 == null || cd22 == null) {
      return "-";
   }

   var cd11Value = parseFloat(cd11.value);
   var cd12Value = parseFloat(cd12.value);
   var cd21Value = parseFloat(cd21.value);
   var cd22Value = parseFloat(cd22.value);
   var res1 = Math.sqrt(cd11Value * cd11Value + cd12Value * cd12Value);
   var res2 = Math.sqrt(cd21Value * cd21Value + cd22Value * cd22Value);
   if (res1 * res2 <= 0.0) {
      return "-";
   }

   return fieldOfAngle(
      parameters.targetView.image.width * Math.sqrt(res1 * res2)
   );
}

function getFieldHeight() {
   if (parameters.targetView.isNull) {
      return "-";
   }

   var keywords = parameters.targetView.window.keywords;
   var cd11 = null;
   var cd12 = null;
   var cd21 = null;
   var cd22 = null;
   for (var i = 0; i != keywords.length; ++i) {
      if (keywords[i].name == "CD1_1") {
         cd11 = keywords[i];
      }
      if (keywords[i].name == "CD1_2") {
         cd12 = keywords[i];
      }
      if (keywords[i].name == "CD2_1") {
         cd21 = keywords[i];
      }
      if (keywords[i].name == "CD2_2") {
         cd22 = keywords[i];
      }
   }
   if (cd11 == null || cd12 == null || cd21 == null || cd22 == null) {
      return "-";
   }

   var cd11Value = parseFloat(cd11.value);
   var cd12Value = parseFloat(cd12.value);
   var cd21Value = parseFloat(cd21.value);
   var cd22Value = parseFloat(cd22.value);
   var res1 = Math.sqrt(cd11Value * cd11Value + cd12Value * cd12Value);
   var res2 = Math.sqrt(cd21Value * cd21Value + cd22Value * cd22Value);
   if (res1 * res2 <= 0.0) {
      return "-";
   }

   return fieldOfAngle(
      parameters.targetView.image.height * Math.sqrt(res1 * res2)
   );
}

function updateResults() {
   parameters.dialog.equinoxNode.setText(1, getEquinox());
   parameters.dialog.rightAscensionNode.setText(1, getRightAscension());
   parameters.dialog.declinationNode.setText(1, getDeclination());
   parameters.dialog.positionAngleNode.setText(1, getPositionAngle());
   parameters.dialog.imageScaleNode.setText(1, getImageScale());
   parameters.dialog.fieldWidthNode.setText(1, getFieldWidth());
   parameters.dialog.fieldHeightNode.setText(1, getFieldHeight());
}

// The script's parameters dialog prototype.
function parametersDialogPrototype() {
   this.__base__ = Dialog;
   this.__base__();

   this.windowTitle = TITLE;

   this.targetView = new HorizontalSizer;

   this.viewList = new ViewList(this);
   this.viewListNullCurrentView = this.viewList.currentView;

   this.viewList.getMainViews();
   if (parameters.targetView.isMainView) {
      this.viewList.currentView = parameters.targetView;
   }
   else {
      parameters.targetView = this.viewList.currentView;
   }
   this.viewList.onViewSelected = function(view) {
      parameters.targetView = view;
      parameters.dialog = this.dialog;
      updateResults();
   }

   this.targetView.add(this.viewList);

   this.resultsPane = new VerticalSizer;

   this.treeBox = new TreeBox(this);

   this.treeBox.alternateRowColor = true;
   this.treeBox.headerVisible = false;
   this.treeBox.indentSize = 0;
   this.treeBox.numberOfColumns = 2;

   // Workaround to avoid setColumnWidth failure in 1.8.4.1171
   this.displayPixelRatio;

   this.treeBox.setHeaderAlignment(0, Align_Left | TextAlign_VertCenter);
   this.treeBox.setColumnWidth(
      0, this.treeBox.font.width("Right ascensionMM")
   );
   this.treeBox.setHeaderAlignment(1, Align_Left | TextAlign_VertCenter);
   this.treeBox.setColumnWidth(
      1, this.treeBox.font.width("00h 00m 00.00s (mirrored)MM")
   );
   this.treeBox.setMinHeight(
      8 *(this.treeBox.font.ascent + 3 * this.treeBox.font.descent)
   );

   this.equinoxNode = new TreeBoxNode(this.treeBox);

   this.equinoxNode.setText(0, "Equinox");
   this.equinoxNode.setText(1, "-");

   this.rightAscensionNode = new TreeBoxNode(this.treeBox);

   this.rightAscensionNode.setText(0, "Right ascension");
   this.rightAscensionNode.setText(1, "-");

   this.declinationNode = new TreeBoxNode(this.treeBox);

   this.declinationNode.setText(0, "Declination");
   this.declinationNode.setText(1, "-");

   this.positionAngleNode = new TreeBoxNode(this.treeBox);

   this.positionAngleNode.setText(0, "Position angle");
   this.positionAngleNode.setText(1, "-");

   this.imageScaleNode = new TreeBoxNode(this.treeBox);

   this.imageScaleNode.setText(0, "Image scale");
   this.imageScaleNode.setText(1, "-");

   this.fieldWidthNode = new TreeBoxNode(this.treeBox);

   this.fieldWidthNode.setText(0, "Field width");
   this.fieldWidthNode.setText(1, "-");

   this.fieldHeightNode = new TreeBoxNode(this.treeBox);

   this.fieldHeightNode.setText(0, "Field height");
   this.fieldHeightNode.setText(1, "-");

   this.resultsPane.add(this.treeBox);

   this.buttonPane = new HorizontalSizer;
   this.buttonPane.spacing = 6;

   this.versionLabel = new Label(this);
   this.buttonPane.add(this.versionLabel);

   this.versionLabel.text = "Version " + VERSION;
   this.versionLabel.toolTip =
      "<p><b>" + TITLE + " Version " + VERSION + "</b></p>" +

      "<p>Script for displaying an image's FITS World Coordinate System " +
      "(WCS) astrometric header information.</p>" +

      "<p>Copyright &copy; 2012-2016 Mike Schuster. All Rights " +
      "Reserved.<br>" +
      "Copyright &copy; 2003-2016 Pleiades Astrophoto S.L. All Rights " +
      "Reserved.</p>";
   this.versionLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;

   this.buttonPane.addStretch();

   this.dismissButton = new PushButton(this);

   this.dismissButton.text = "Dismiss";
   this.dismissButton.onClick = function() {
      this.dialog.ok();
   };
   this.dismissButton.defaultButton = true;
   this.dismissButton.hasFocus = true;

   this.buttonPane.add(this.dismissButton);

   this.sizer = new VerticalSizer;

   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add(this.targetView);
   this.sizer.add(this.resultsPane);
   // this.sizer.addStretch();
   this.sizer.add(this.buttonPane);

   this.adjustToContents();
   this.setMinWidth(this.width + this.logicalPixelsToPhysical(120));
   this.setFixedHeight();

   parameters.dialog = this;
   updateResults();
}
parametersDialogPrototype.prototype = new Dialog;

function main() {
   console.hide();
   if (Parameters.isGlobalTarget) {
      parameters.targetView = ImageWindow.activeWindow.currentView;
   }
   else if (Parameters.isViewTarget) {
      parameters.targetView = Parameters.targetView;
   }
   else {
      parameters.targetView = ImageWindow.activeWindow.currentView;
   }
   var parametersDialog = new parametersDialogPrototype();
   parametersDialog.execute();

   // Workaround to avoid image window close crash in 1.8 RC7.
   parametersDialog.viewList.currentView =
      parametersDialog.viewListNullCurrentView;
}

main();

gc();

// ****************************************************************************
// EOF WCSHeader.js - Released 2016/07/31 00:00:00 UTC
