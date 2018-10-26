/*
 Copy Coordinates

 Copies the coordinates from one image to another.

 Copyright (C) 2013-15, Andres del Pozo
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

/*
 Changelog:

 1.2:   * Copy the pixel size and focal length of the reference image when the resolution
          is the same as the target image

 1.1:   * Simple copy of coordinates

 1.0:   * Distortion correction using surface splines
        * Fixed the persistence of the parameters

 0.1:   * Initial test version.
 */


#feature-id    Utilities > CopyCoordinates

#feature-info  Script for copying the coordinates form one image to another.<br/>\
<br/>\
Copyright &copy; 2013-15 Andr&eacute;s del Pozo

#include <pjsr/DataType.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/NumericControl.jsh>


#define COPYCOORDSVERSION "1.2"

#define TITLE "Copy Coordinates"
#define SETTINGS_MODULE "COPYWCS"

#include "WCSmetadata.jsh"


// -------------------------------------
// CLASS CopyCoordsDialog

function CopyCoordsDialog(engine)
{
   this.__base__ = Dialog;
   this.__base__();
   this.restyle();

   var labelWidth = this.font.width("Maximum magnitude:M");
   //this.editWidth = this.font.width("XXXXXXXXXXXXXXXXX");
   var spinBoxWidth = 7 * this.font.width('M');

   this.helpLabel = new Label(this);
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.minWidth = 45 * this.font.width('M');
   this.helpLabel.scaledMargin = 6;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text =
      "<p><b>" + TITLE + " v" + COPYCOORDSVERSION + "</b> &mdash; Copies the coordinates from a source image to the active image.<br/>" +
         "<br/>" +
         "Copyright &copy; 2013-15 Andr&eacute;s del Pozo</p>";

   // Reference Image
   this.reference_Label = new Label(this);
   this.reference_Label.text = "Source image:";
   this.reference_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   //this.reference_Label.setFixedWidth(labelWidth);

   this.reference_Combo = new ComboBox(this);
   this.reference_Combo.editEnabled = false;
   this.reference_Combo.currentItem = 0;
   var windows = ImageWindow.windows;
   for (var i = 0; i < windows.length; i++)
   {
      this.reference_Combo.addItem(windows[i].mainView.id);
      if (engine.referWindow == windows[i].mainView.id)
         this.reference_Combo.currentItem = i;
   }
   if (this.reference_Combo.currentItem < 0)
      engine.referWindow = null;
   else
      engine.referWindow = this.reference_Combo.itemText(this.reference_Combo.currentItem);

   this.reference_Combo.toolTip = "<p>This parameter defines the source image for the coordinates.";
   this.reference_Combo.onItemSelected = function ()
   {
      engine.referWindow = this.itemText(this.currentItem);
   };

   this.reference_Sizer = new HorizontalSizer;
   this.reference_Sizer.scaledSpacing = 6;
   this.reference_Sizer.add(this.reference_Label);
   this.reference_Sizer.add(this.reference_Combo);
   this.reference_Sizer.addStretch();

   // Simple copy
   this.simple_Radio = new RadioButton(this);
   this.simple_Radio.text = "Simple copy. The source must have the same geometry as the target.";
   this.simple_Radio.checked = engine.simple == true;
   this.simple_Radio.minWidth = labelWidth;
   this.simple_Radio.toolTip = "<p>The script copies the coordinates of the source image to the target image without any transformation.</p>" +
      "<p>This only works when both images have the same geometry so it typically can only be used between cloned images.</p>";
   this.simple_Radio.onCheck = function (value)
   {
      engine.simple = true;
      this.dialog.EnableFileControls();
   }

   // Transform copy
   this.align_Radio = new RadioButton(this);
   this.align_Radio.text = "Transform copy. There is a lineal transform between the source and target.";
   this.align_Radio.checked = engine.simple == false;
   this.align_Radio.minWidth = labelWidth;
   this.align_Radio.toolTip = "<p>The script tries to register the target image against the source image. " +
      "If a transformation is found, the script applies it to the coordinates of the source image and" +
      " then sets the transformed coordinates on the target image.</p>" +
      "<p>This can be used when the target image is the result of cropping, scaling or rotating the source image " +
      "(or any combination of these processes and in general any affine transformation).</p>";
   this.align_Radio.onCheck = function (value)
   {
      engine.simple = false;
      this.dialog.EnableFileControls();
   }

   // Star detection (sensitivity)
   this.sensitivity_Control = new NumericControl(this);
   this.sensitivity_Control.real = true;
   this.sensitivity_Control.label.text = "Star detection sensitivity:";
   //this.sensitivity_Control.label.minWidth = labelWidth;
   this.sensitivity_Control.setRange(-3, 3);
   this.sensitivity_Control.slider.setRange(0, 1000);
   this.sensitivity_Control.slider.minWidth = 250;
   this.sensitivity_Control.setPrecision(2);
   this.sensitivity_Control.edit.scaledMinWidth = spinBoxWidth;
   this.sensitivity_Control.setValue(engine.sensitivity);
   this.sensitivity_Control.toolTip = "<p>Star detection sensitivity. Increase the value to detect less stars.</p>";
   this.sensitivity_Control.onValueUpdated = function (value)
   {
      engine.sensitivity = value;
   };

   this.sensitivity_Sizer = new HorizontalSizer;
   this.sensitivity_Sizer.addSpacing(30);
   this.sensitivity_Sizer.add(this.sensitivity_Control);

   this.EnableFileControls = function ()
   {
      this.sensitivity_Control.enabled = !engine.simple;
   }
   this.EnableFileControls();

   // usual control buttons

   this.newInstanceButton = new ToolButton(this);
   this.newInstanceButton.icon = this.scaledResource(":/process-interface/new-instance.png");
   this.newInstanceButton.setScaledFixedSize(20, 20);
   this.newInstanceButton.toolTip = "New Instance";
   this.newInstanceButton.onMousePress = function ()
   {
      this.hasFocus = true;

      engine.SaveParameters();

      this.pushed = false;
      this.dialog.newInstance();
   };

   this.reset_Button = new ToolButton(this);
   this.reset_Button.icon = this.scaledResource(":/icons/reload.png");
   this.reset_Button.setScaledFixedSize(20, 20);
   this.reset_Button.toolTip = "<p>Resets all settings to default values.<br />" +
      "This action closes the dialog, so the script has to be executed again for changes to take effect.</p>";
   this.reset_Button.onClick = function ()
   {
      var msg = new MessageBox("Do you really want to reset all settings to their default values?",
         TITLE, StdIcon_Warning, StdButton_Yes, StdButton_No);
      var res = msg.execute();
      if (res == StdButton_Yes)
      {
         Settings.remove(SETTINGS_MODULE);
         this.dialog.resetRequest = true;
         this.dialog.cancel();
      }
   };

   this.help_Button = new ToolButton(this);
   this.help_Button.icon = this.scaledResource(":/process-interface/browse-documentation.png");
   this.help_Button.setScaledFixedSize(20, 20);
   this.help_Button.toolTip = "<p>Browse Documentation</p>";
   this.help_Button.onClick = function ()
   {
      Dialog.browseScriptDocumentation("AlignByCoordinates");
   };

   this.ok_Button = new PushButton(this);
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource(":/icons/ok.png");
   this.ok_Button.onClick = function ()
   {
      try
      {
         // Validation
         if (!ImageWindow.activeWindow || !ImageWindow.activeWindow.isWindow)
            throw "There is not active window";

         if (!engine.referWindow)
            throw "There is not reference window";

         this.dialog.ok();
      } catch (ex)
      {
         new MessageBox(ex, TITLE, StdIcon_Error, StdButton_Ok).execute();
      }
   };

   this.cancel_Button = new PushButton(this);
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource(":/icons/cancel.png");
   this.cancel_Button.onClick = function ()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.scaledSpacing = 6;
   this.buttons_Sizer.add(this.newInstanceButton);
   this.buttons_Sizer.add(this.reset_Button);
   this.buttons_Sizer.add(this.help_Button);
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add(this.ok_Button);
   this.buttons_Sizer.add(this.cancel_Button);

   // Global sizer

   this.sizer = new VerticalSizer;
   this.sizer.scaledMargin = 8;
   this.sizer.scaledSpacing = 6;
   this.sizer.add(this.helpLabel);
   this.sizer.addScaledSpacing(4);
   this.sizer.add(this.reference_Sizer);
   this.sizer.add(this.simple_Radio);
   this.sizer.add(this.align_Radio);
   this.sizer.add(this.sensitivity_Sizer);
   this.sizer.addScaledSpacing(8);
   this.sizer.add(this.buttons_Sizer);

   this.windowTitle = TITLE;
   this.adjustToContents();
   this.setFixedSize();
}
CopyCoordsDialog.prototype = new Dialog;


// -------------------------------------
// CLASS CopyCoordsEngine

function CopyCoordsEngine()
{
   this.__base__ = ObjectWithSettings;
   this.__base__(
      SETTINGS_MODULE,
      "engine",
      new Array(
         [ "referWindow", DataType_UCString ],
         [ "simple", DataType_Boolean ],
         [ "sensitivity", DataType_Double ]
      )
   );

   this.SetDefaults = function ()
   {
      this.referWindow = null;
      this.simple = false;
      this.sensitivity = -1;
   }

   this.SetDefaults();

   this.Init = function (w)
   {
      if (!w || !w.isWindow)
         throw Error("The script requires an image");
      this.window = w;

      this.LoadSettings();
      this.LoadParameters();
   };

   this.GetGeometryTransformation = function (referView)
   {
      var align = new StarAlignment;
      align.referenceImage = this.referWindow;
      align.referenceIsFile = false;
      align.writeKeywords = false;
      //align.matcherTolerance = 0.01; //0.0030;
      //align.ransacTolerance = 8.0; //6.00;
      align.useSurfaceSplines = true;
      align.sensitivity = Math.pow(10, this.sensitivity);
      align.noGUIMessages = true;
      align.useTriangles = true;
      //align.onError = StarAlignment.prototype.Continue;
      align.undistortedReference = true;
      align.mode = StarAlignment.prototype.OutputMatrix;

      var res = align.executeOn(referView, false);
      if (!res)
         throw "The image could not be aligned with the reference image";

      var aligndata = align.outputData[0].slice(11, 17);
      aligndata[6] = 0;
      aligndata[7] = 0;
      aligndata[8] = 1;

      return new Matrix(aligndata, 3, 3);
   };

   this.CreateMetadata = function (metadata0, ref_RI_WI, targetWindow)
   {
      var newMetadata = new ImageMetadata();
      newMetadata.projection = metadata0.projection;
      newMetadata.width = targetWindow.mainView.image.width;
      newMetadata.height = targetWindow.mainView.image.height;
      if (metadata0.controlPoints && (metadata0.ref_I_G instanceof ReferSpline))
      {
         console.writeln("Transforming spline referentiation");
         var pWI = [];
         for (var i = 0; i < metadata0.controlPoints.pI.length; i++)
            pWI.push(ref_RI_WI.Apply(metadata0.controlPoints.pI[i]));

         var smoothing = metadata0.ref_I_G.smoothing;
         newMetadata.ref_I_G = new ReferSpline(pWI, metadata0.controlPoints.pG, metadata0.controlPoints.weights, 2, smoothing, 2000);
         newMetadata.ref_I_G_lineal = MultipleLinearRegression(1, pWI, metadata0.controlPoints.pG).ToLinealMatrix();
         processEvents();
         newMetadata.ref_G_I = new ReferSpline(metadata0.controlPoints.pG, pWI, metadata0.controlPoints.weights, 2, smoothing, 2000);
         processEvents();

         newMetadata.controlPoints = {
            pI:      pWI,
            pG:      metadata0.controlPoints.pG,
            weights: metadata0.controlPoints.weights,
         };
      }
      else if (metadata0.ref_I_G.polDegree && metadata0.ref_I_G.polDegree > 1)
      {
         console.writeln("Transforming polynomial referentiation");
         var numx = Math.min(100, newMetadata.width);
         var numy = Math.min(100, newMetadata.height);
         var apWI = [];
         var apG = [];
         var ref_WI_RI = ref_RI_WI.inverse();
         for (var y = 0; y <= numy; y++)
         {
            for (var x = 0; x <= numx; x++)
            {
               var pWI = new Point(x * newMetadata.width / numx, y * newMetadata.height / numy);
               var pRI = ref_WI_RI.Apply(pWI);
               var pG = metadata0.ref_I_G.Apply(pRI);
               apWI.push(pWI);
               apG.push(pG);
            }
         }
         newMetadata.ref_I_G = MultipleLinearRegression(metadata0.ref_I_G.polDegree, apWI, apG);
         newMetadata.ref_G_I = MultipleLinearRegression(metadata0.ref_I_G.polDegree, apG, apWI);
         newMetadata.ref_I_G_lineal = MultipleLinearRegression(1, apWI, apG).ToLinealMatrix();
      }
      else
      { // Lineal referentiation matrix
         console.writeln("Transforming lineal referentiation");
         var ref_RI_G = metadata0.ref_I_G_lineal;
         var ref_WI_G = ref_RI_G.mul(ref_RI_WI.inverse());
         newMetadata.ref_I_G_lineal = ref_WI_G;
         newMetadata.ref_I_G = ReferNPolyn.prototype.FromLinealMatrix(ref_WI_G);
         newMetadata.ref_G_I = ReferNPolyn.prototype.FromLinealMatrix(ref_WI_G.inverse());
      }

      // Find the celestial coordinates (RD) of the center of the original image
      var centerI = new Point(newMetadata.width / 2, newMetadata.height / 2);
      var centerG = newMetadata.ref_I_G.Apply(centerI);
      var centerRD = newMetadata.projection.Inverse(centerG);
      while (centerRD.x < 0)
         centerRD.x += 360;
      while (centerRD.x > 360)
         centerRD.x -= 360;
      newMetadata.ra = centerRD.x;
      newMetadata.dec = centerRD.y;
      var ref = newMetadata.ref_I_G_lineal;
      var resx = Math.sqrt(ref.at(0, 0) * ref.at(0, 0) + ref.at(0, 1) * ref.at(0, 1));
      var resy = Math.sqrt(ref.at(1, 0) * ref.at(1, 0) + ref.at(1, 1) * ref.at(1, 1));
      newMetadata.resolution = (resx + resy) / 2;
      // Check if the resolution has not changed
      if (metadata0.resolution > 0 && Math.abs(1 - newMetadata.resolution / metadata0.resolution) < 1e-4)
      {
         newMetadata.useFocal = metadata0.useFocal;
         newMetadata.xpixsz = metadata0.xpixsz;
         newMetadata.focal = newMetadata.FocalFromResolution(newMetadata.resolution);
      }
      else
      {
         newMetadata.useFocal = false;
         newMetadata.focal = 0;
      }

      return newMetadata;
   };

   this.Execute = function ()
   {
      // Get reference window
      if (!this.referWindow)
         throw "The reference image is not configured";
      var window0 = ImageWindow.windowById(this.referWindow);
      if (!window0 || window0.isNull)
         throw "Couldn't find the reference image";

      // Extract metadata
      var metadata0 = new ImageMetadata();
      metadata0.ExtractMetadata(window0);
      if (!metadata0.projection || !metadata0.ref_I_G)
         throw "The reference image has no WCS coordinates";

      // Generate the new metadata
      var newMetadata;
      if (this.simple)
      {
         if (metadata0.width != this.window.mainView.image.width || metadata0.height != this.window.mainView.image.height)
            throw "Cannot use the simple copy on images with different dimensions";
         newMetadata = metadata0;
      }
      else
      {
         var ref_RI_WI = this.GetGeometryTransformation(this.window.mainView);
         newMetadata = this.CreateMetadata(metadata0, ref_RI_WI, this.window);
      }

      // Set keywords
#ifgteq __PI_BUILD__ 1409 // core 1.8.6
         this.window.mainView.beginProcess( UndoFlag_Keywords|UndoFlag_AstrometricSolution );
#endif
      newMetadata.SaveKeywords(this.window,
#ifgteq __PI_BUILD__ 1409 // core 1.8.6
                               false/*beginProcess*/
#else
                               true/*beginProcess*/
#endif
                              );
      newMetadata.SaveProperties(this.window);
#ifgteq __PI_BUILD__ 1409 // core 1.8.6
      this.window.regenerateAstrometricSolution();
      this.window.mainView.endProcess();
#endif

      // Print result
      newMetadata.Print();
   };

};

function CheckVersion(major, minor, release)
{
   if (major == __PI_MAJOR__)
   {
      if (minor == __PI_MINOR__)
         return release <= __PI_RELEASE__;
      else
         return minor < __PI_MINOR__;
   }
   else
      return major < __PI_MAJOR__;
}

function main()
{
   try
   {
      if (!CheckVersion(1, 8, 4))
      {
         (new MessageBox("This script requires at least the version 1.8.4 of PixInsight",
            TITLE,
            StdIcon_Error,
            StdButton_Ok)).execute();
         return;
      }

      console.abortEnabled = true;

      var engine = new CopyCoordsEngine();
      if (Parameters.isViewTarget)
         engine.Init(Parameters.targetView.window);
      else
      {
         var res = false;
         while (!res)
         {
            engine.Init(ImageWindow.activeWindow);

            var dialog = new CopyCoordsDialog(engine);
            res = dialog.execute();
            if (!res)
            {
               if (dialog.resetRequest)
                  engine = new CopyCoordsEngine;
               else
                  return;
            }
         }
      }

      engine.SaveSettings();
      engine.Execute();

      console.show();
   }
   catch (error)
   {
      console.writeln(error.toString());
      var msgb = new MessageBox(error.toString(), TITLE, StdIcon_Error);
      msgb.execute();
   }
}

main();
