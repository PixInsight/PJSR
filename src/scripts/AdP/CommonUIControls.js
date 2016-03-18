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
