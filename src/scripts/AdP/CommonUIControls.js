/*
 Common User Interface Controls

 Copyright (C) 2015-16, Andres del Pozo
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 1. Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.
 2. Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


#ifndef __ADP_COMMONUICONTROLS_js
#define __ADP_COMMONUICONTROLS_js

function fieldLabel(parent, text, width)
{
   this.label = new Label(parent);
   this.label.text = text;
   this.label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   if (width != null)
      this.label.setFixedWidth(width);
   return this.label;
}

function coordSpinBox(parent, value, maxVal, width, tooltip, onValueUpdated)
{
   this.spinBox = new SpinBox(parent);
   this.spinBox.minValue = 0;
   this.spinBox.maxValue = maxVal;
   if (value)
      this.spinBox.value = value;
   this.spinBox.toolTip = tooltip;
   this.spinBox.setFixedWidth(width);
   this.spinBox.onValueUpdated = onValueUpdated;
   return this.spinBox;
}

// ******************************************************************
// CoordinatesEditor: Editor of RA/Dec coordinates
// ******************************************************************
function CoordinatesEditor(parent, coords, // Point in deg/deg
   labelWidth, spinBoxWidth, tooltip)
{
   this.__base__ = Control;
   this.__base__(parent);

   var spinBoxWidth1,spinBoxWidth2;
   if (spinBoxWidth == null)
   {
      spinBoxWidth1 = parent.font.width("888888");
      spinBoxWidth2 = parent.font.width("88888888");
   } else {
      spinBoxWidth1=spinBoxWidth2=spinBoxWidth;
   }

   this.ra = (coords != null && coords.x != null) ? DMSangle.FromAngle(coords.x / 15) : new DMSangle;
   this.dec = (coords != null && coords.y != null) ? DMSangle.FromAngle(coords.y) : new DMSangle;
   var thisObj = this;

   var onChange = function()
   {
      if(thisObj.onChangeCallback)
         thisObj.onChangeCallback.call(thisObj.onChangeCallbackScope, thisObj.GetCoords());
   };

   // RA

   this.ra_Label = new fieldLabel(this, "Right Ascension (hms):", labelWidth);

   this.ra_h_SpinBox = new coordSpinBox(this, this.ra.deg, 23, spinBoxWidth1, tooltip,
      function (value)
      {
         thisObj.ra.deg = value;
         onChange();
      });
   this.ra_min_SpinBox = new coordSpinBox(this, this.ra.min, 59, spinBoxWidth1, tooltip,
      function (value)
      {
         thisObj.ra.min = value;
         onChange();
      });
   this.ra_sec_Edit = new Edit(this);
   this.ra_sec_Edit.text = format("%.3f", this.ra.sec);
   this.ra_sec_Edit.toolTip = tooltip;
   this.ra_sec_Edit.setFixedWidth(spinBoxWidth2);
   this.ra_sec_Edit.onTextUpdated = function (value)
   {
      thisObj.ra.sec = parseFloat(value);
      onChange();
   };

   /*this.search_Button = new PushButton( this );
    this.search_Button.text = "Search";
    this.search_Button.icon = this.scaledResource( ":/icons/find.png" );*/

   this.ra_Sizer = new HorizontalSizer;
   this.ra_Sizer.spacing = 4;
   this.ra_Sizer.add(this.ra_Label);
   this.ra_Sizer.add(this.ra_h_SpinBox);
   this.ra_Sizer.add(this.ra_min_SpinBox);
   this.ra_Sizer.add(this.ra_sec_Edit);
   this.ra_Sizer.addStretch();
   //this.ra_Sizer.add( this.search_Button );

   // DEC

   this.dec_Label = new fieldLabel(this, "Declination (dms):", labelWidth);

   this.dec_h_SpinBox = new coordSpinBox(this, this.dec.deg, 90, spinBoxWidth1, tooltip,
      function (value)
      {
         thisObj.dec.deg = value;
         onChange();
      });
   this.dec_min_SpinBox = new coordSpinBox(this, this.dec.min, 59, spinBoxWidth1, tooltip,
      function (value)
      {
         thisObj.dec.min = value;
         onChange();
      });
   this.dec_sec_Edit = new Edit(this);
   this.dec_sec_Edit.text = format("%.2f", this.dec.sec);
   this.dec_sec_Edit.toolTip = tooltip;
   this.dec_sec_Edit.setFixedWidth(spinBoxWidth2);
   this.dec_sec_Edit.onTextUpdated = function (value)
   {
      thisObj.dec.sec = parseFloat(value);
      onChange();
   };

   this.isSouth_CheckBox = new CheckBox(this);
   this.isSouth_CheckBox.text = "S";
   this.isSouth_CheckBox.checked = this.dec.sign < 0;
   this.isSouth_CheckBox.toolTip = "<p>When checked, the declination is negative (Southern hemisphere).</p>";
   //this.isSouth_CheckBox.setScaledFixedWidth(40);
   this.isSouth_CheckBox.onCheck = function (checked)
   {
      thisObj.dec.sign = checked ? -1 : 1;
      onChange();
   };

   this.dec_Sizer = new HorizontalSizer;
   this.dec_Sizer.spacing = 4;
   this.dec_Sizer.add(this.dec_Label);
   this.dec_Sizer.add(this.dec_h_SpinBox);
   this.dec_Sizer.add(this.dec_min_SpinBox);
   this.dec_Sizer.add(this.dec_sec_Edit);
   this.dec_Sizer.add(this.isSouth_CheckBox);
   this.dec_Sizer.addStretch();

   this.sizer = new VerticalSizer;
   this.sizer.margin = 0;
   this.sizer.spacing = 4;
   this.sizer.add(this.ra_Sizer);
   this.sizer.add(this.dec_Sizer);
}
CoordinatesEditor.prototype = new Control();

CoordinatesEditor.prototype.SetCoords = function (coords)
{
   this.ra = (coords != null && coords.x != null) ? DMSangle.FromAngle(coords.x / 15) : new DMSangle;
   this.ra_h_SpinBox.value = this.ra.deg;
   this.ra_min_SpinBox.value = this.ra.min;
   this.ra_sec_Edit.text = format("%.3f", this.ra.sec);

   this.dec = (coords != null && coords.y != null) ? DMSangle.FromAngle(coords.y) : new DMSangle;
   this.dec_h_SpinBox.value = this.dec.deg;
   this.dec_min_SpinBox.value = this.dec.min;
   this.dec_sec_Edit.text = format("%.2f", this.dec.sec);
   this.isSouth_CheckBox.checked = this.dec.sign < 0;
};

CoordinatesEditor.prototype.GetCoords = function (validate)
{
   var raVal = this.ra.GetValue();
   if ((validate == null || validate) && (raVal < 0 || raVal > 24))
   {
      new MessageBox("Invalid right ascension", TITLE, StdIcon_Error).execute();
      return null;
   }

   var decVal = this.dec.GetValue();
   if ((validate == null || validate) && (decVal < -90 || decVal > +90))
   {
      new MessageBox("Invalid declination", TITLE, StdIcon_Error).execute();
      return null;
   }

   return new Point(raVal * 15, decVal);
};

CoordinatesEditor.prototype.setLabels = function(raText, decText)
{
   this.ra_Label.text = raText;
   this.dec_Label.text = decText;
};

CoordinatesEditor.prototype.setOnChange = function(callback, scope)
{
   this.onChangeCallback = callback;
   this.onChangeCallbackScope = scope;
};

// ******************************************************************
// TransparentColorControl: Configuration control for colors
// ******************************************************************
function TransparentColorControl(parent, initialValue, toolTip)
{
   this.__base__ = Control;
   if (parent)
      this.__base__(parent);
   else
      this.__base__();

   this.color = initialValue;
   this.onColorChanged = null;

   this.color_ComboBox = new ColorComboBox(parent);
   this.color_ComboBox.setCurrentColor(this.color);
   this.color_ComboBox.toolTip = toolTip;
   this.color_ComboBox.onColorSelected = function (rgba)
   {
      this.parent.color = Color.setAlpha(rgba, Color.alpha(this.parent.color));
      if (this.parent.onColorChanged)
         this.parent.onColorChanged(this.parent.color);
   };

   this.transparency_SpinBox = new SpinBox(parent);
   this.transparency_SpinBox.minValue = 0;
   this.transparency_SpinBox.maxValue = 255;
   this.transparency_SpinBox.setFixedWidth(parent.font.width("8888888"))
   this.transparency_SpinBox.value = Color.alpha(this.color);
   this.transparency_SpinBox.toolTip = toolTip + ": Alpha value (0=transparent, 255=opaque)";
   this.transparency_SpinBox.onValueUpdated = function (value)
   {
      this.parent.color = Color.setAlpha(this.parent.color, value);
      if (this.parent.onColorChanged)
         this.parent.onColorChanged(this.parent.color);
   };

   this.color_Button = new ToolButton(parent);
   this.color_Button.icon = this.scaledResource(":/icons/select-color.png");
   this.color_Button.setScaledFixedSize(20, 20);
   this.color_Button.toolTip = toolTip + ": Define a custom color.";
   this.color_Button.onClick = function ()
   {
      //console.writeln( format("%x",this.parent.color),  this.parent.color_ComboBox);
      var scd = new SimpleColorDialog(this.parent.color);
      scd.windowTitle = toolTip + ": Custom RGBA Color";
      if (scd.execute())
      {
         this.parent.color = scd.color;
         this.parent.color_ComboBox.setCurrentColor(scd.color);
         this.parent.transparency_SpinBox.value = Color.alpha(scd.color);
         if (this.parent.onColorChanged)
            this.parent.onColorChanged(this.parent.color);
      }
   };

   this.sizer = new HorizontalSizer;
   this.sizer.scaledSpacing = 4;
   this.sizer.add(this.color_ComboBox);
   this.sizer.add(this.transparency_SpinBox);
   this.sizer.add(this.color_Button);
}

TransparentColorControl.prototype = new Control;


function FontControl(parent, callbackScope, fontDef)
{
   this.__base__ = Control;
   if (parent)
      this.__base__(parent);
   else
      this.__base__();

   this.fontDef = fontDef;
   this.onChanged = null;
   this.callbackScope = callbackScope;
   var self = this;

   var raiseOnChanged = function ()
   {
      if (self.onChanged)
      {
         if (self.callbackScope)
            self.onChanged.call(self.callbackScope, self.fontDef);
         else
            self.onChanged(self.fontDef);
      }
   };

   // Face
   var labelFace_Combo = new ComboBox(parent);
   labelFace_Combo.editEnabled = false;
   labelFace_Combo.addItem("SansSerif");
   labelFace_Combo.addItem("Serif");
   labelFace_Combo.addItem("Script");
   labelFace_Combo.addItem("TypeWriter");
   labelFace_Combo.addItem("Decorative");
   labelFace_Combo.addItem("Symbol");
   labelFace_Combo.currentItem = this.fontDef.face - 1;
   labelFace_Combo.onItemSelected = function ()
   {
      self.fontDef.face = labelFace_Combo.currentItem + 1;
      raiseOnChanged();
   }

   var labelSize_SpinBox = new SpinBox(parent);
   labelSize_SpinBox.minValue = 6;
   labelSize_SpinBox.maxValue = 72;
   labelSize_SpinBox.setFixedWidth(parent.font.width("888888"));
   labelSize_SpinBox.value = this.fontDef.size;
   labelSize_SpinBox.toolTip = "<p>Font size.</p>";
   labelSize_SpinBox.onValueUpdated = function (value)
   {
      self.fontDef.size = value;
      raiseOnChanged();
   };

   var labelBold_Check = new CheckBox(parent);
   labelBold_Check.checked = this.fontDef.bold;
   labelBold_Check.text = "Bold";
   labelBold_Check.toolTip = "<p>Bold font.</p>";
   labelBold_Check.onCheck = function (checked)
   {
      self.fontDef.bold = checked;
      raiseOnChanged();
   };

   var labelItalic_Check = new CheckBox(parent);
   labelItalic_Check.checked = this.fontDef.italic;
   labelItalic_Check.text = "Italic";
   labelItalic_Check.toolTip = "<p>Italic font.</p>";
   labelItalic_Check.onCheck = function (checked)
   {
      self.fontDef.italic = checked;
      raiseOnChanged();
   };

   this.sizer = new HorizontalSizer;
   this.sizer.scaledSpacing = 4;
   this.sizer.add(labelFace_Combo);
   this.sizer.add(labelSize_SpinBox);
   this.sizer.add(labelBold_Check);
   this.sizer.add(labelItalic_Check);
}

FontControl.prototype = new Control;


// ******************************************************************
// EpochEditor
// ******************************************************************
function EpochEditor(parent, epochJD, // Julian date of the epoch
   labelWidth, spinBoxWidth)
{
   this.__base__ = Control;
   this.__base__(parent);

   var self = this;

   var epochTooltip =
      "<p>Date of the star field. This value is used for computing the proper motion of the stars.</p>";

   this.epoch_Label = new fieldLabel(this, "Epoch (ymd):", labelWidth);

   this.epoch_year_SpinBox = new SpinBox(this);
   this.epoch_year_SpinBox.minValue = 0;
   this.epoch_year_SpinBox.maxValue = 3000;
   this.epoch_year_SpinBox.toolTip = epochTooltip;
   this.epoch_year_SpinBox.setFixedWidth(spinBoxWidth);
   this.epoch_year_SpinBox.onValueUpdated = function (value)
   {
      self.epoch.setFullYear(value);
   };

   this.epoch_mon_SpinBox = new SpinBox(this);
   this.epoch_mon_SpinBox.minValue = 1;
   this.epoch_mon_SpinBox.maxValue = 12;
   this.epoch_mon_SpinBox.toolTip = epochTooltip;
   this.epoch_mon_SpinBox.setFixedWidth(spinBoxWidth);
   this.epoch_mon_SpinBox.onValueUpdated = function (value)
   {
      self.epoch.setMonth(value - 1);
   };

   this.epoch_day_SpinBox = new SpinBox(this);
   this.epoch_day_SpinBox.minValue = 1;
   this.epoch_day_SpinBox.maxValue = 31;
   this.epoch_day_SpinBox.toolTip = epochTooltip;
   this.epoch_day_SpinBox.setFixedWidth(spinBoxWidth);
   this.epoch_day_SpinBox.onValueUpdated = function (value)
   {
      self.epoch.setDate(value);
   };

   this.sizer = new HorizontalSizer();
   this.sizer.spacing = 4;
   this.sizer.add(this.epoch_Label);
   this.sizer.add(this.epoch_year_SpinBox);
   this.sizer.add(this.epoch_mon_SpinBox);
   this.sizer.add(this.epoch_day_SpinBox);
   this.sizer.addStretch();

   this.setEpoch(epochJD);
}

EpochEditor.prototype = new Control();

EpochEditor.prototype.getEpoch = function ()
{
   return Math.complexTimeToJD(this.epoch.getFullYear(), this.epoch.getMonth() + 1, this.epoch.getDate());
};

EpochEditor.prototype.setEpoch = function (epochJD)
{
   var epochArray = epochJD == null ? [ 2000, 1, 1] : Math.jdToComplexTime(epochJD);
   this.epoch = new Date(epochArray[0], epochArray[1] - 1, epochArray[2]);
   this.epoch_year_SpinBox.value = this.epoch.getFullYear();
   this.epoch_mon_SpinBox.value = this.epoch.getMonth() + 1;
   this.epoch_day_SpinBox.value = this.epoch.getDate();
};

#endif