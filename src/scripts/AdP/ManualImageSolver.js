/*
 ManualImageSolver

 Manual Image Solver: User assisted image solver

 Copyright (C) 2013-2015, Andres del Pozo
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

 1.1:  * Can solve images using a reference image with projection different to Gnomonic
       * Distortion correction using surface splines
       * Improved generation of distortion models

 1.0:  * New option "Generate distortion model" compatible with StarAlignment
       * Polynomial degree limited to 5

 0.2:  * Added option "Show distortion map"
       * Fixed computation of WCS solution when degree>1

 0.1:  * Initial test version.
 */

#feature-id    Image Analysis > ManualImageSolver

#feature-info  Alignment of astronomical images using their coordinates.<br/>\
<br/>\
Copyright &copy; 2013-2015 Andr&eacute;s del Pozo

#include <pjsr/DataType.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/ColorSpace.jsh>
#include <pjsr/SampleType.jsh>

#define VERSION "1.1"
#define TITLE "Manual Image Solver"
#define SETTINGS_MODULE "ManualIS"


#include "WCSmetadata.jsh"
#include "SearchCoordinatesDialog.js"
;

// -------------------------------------
// CLASS ManualSolverDialog

function ManualSolverDialog(engine)
{
   this.__base__ = Dialog;
   this.__base__();
   this.restyle();

   this.labelWidth = this.font.width("Maximum magnitude:M");

   this.helpLabel = new Label(this);
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.minWidth = 45 * this.font.width('M');
   this.helpLabel.margin = 6;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text =
      "<p><b>" + TITLE + " v" + VERSION + "</b> &mdash; This script calculates the coordinates of an image using " +
         "a transformation defined with DynamicAligment between the image and an image with known coordinates.<br/>" +
         "<br/>" +
         "Copyright &copy; 2013-2015 Andr&eacute;s del Pozo</p>";

   // icon image
   this.icon_Label = new fieldLabel(this, "Control points icon:", this.labelWidth);

   this.icon_Combo = new ComboBox(this);
   this.icon_Combo.editEnabled = false;
   this.icon_Combo.toolTip = "<p>The solver uses this icon of a DynamicAlignment process " +
      "to define the transformation between the target image and the reference image.</p>";
   var icons = ProcessInstance.icons();
   for (var i = 0; i < icons.length; i++)
   {
      var process=ProcessInstance.fromIcon(icons[i]);
      if (process.processId()=="DynamicAlignment")
      {
         this.icon_Combo.addItem(icons[i]);
         if(engine.icon && engine.icon==icons[i])
            this.icon_Combo.currentItem = this.icon_Combo.numberOfItems - 1;
      }
   }
   if (this.icon_Combo.currentItem>=0)
      engine.icon = this.icon_Combo.itemText(this.icon_Combo.currentItem);
   else
      engine.icon =null;
   this.icon_Combo.onItemSelected = function ()
   {
      engine.icon = this.itemText(this.currentItem);
   }

   this.icon_Sizer = new HorizontalSizer;
   this.icon_Sizer.spacing = 4;
   this.icon_Sizer.add(this.icon_Label);
   this.icon_Sizer.add(this.icon_Combo);
   this.icon_Sizer.addStretch();

   // Reference image
   this.reference_Label = new fieldLabel(this, "Reference image:", this.labelWidth);

   this.reference_Combo = new ComboBox(this);
   this.reference_Combo.editEnabled = false;
   this.reference_Combo.toolTip = "<p>Reference image. It must have its coordinates computed with a good solution.</p>"
   var windows = ImageWindow.windows;
   for (var i = 0; i < windows.length; i++)
   {
      this.reference_Combo.addItem(windows[i].mainView.id);
      if (engine.referWindow && windows[i].mainView.id == engine.referWindow)
            this.reference_Combo.currentItem = this.reference_Combo.numberOfItems - 1;
   }
   if (this.reference_Combo.currentItem>=0)
      engine.referWindow = this.reference_Combo.itemText(this.reference_Combo.currentItem);
   else
      engine.referWindow =null;
   this.reference_Combo.onItemSelected = function ()
   {
      engine.referWindow = this.itemText(this.currentItem);
   }

   this.reference_Sizer = new HorizontalSizer;
   this.reference_Sizer.spacing = 4;
   this.reference_Sizer.add(this.reference_Label);
   this.reference_Sizer.add(this.reference_Combo);
   this.reference_Sizer.addStretch();

   // Distortion correction
   this.distortion_Check = new CheckBox(this);
   this.distortion_Check.text = "Distortion correction";
   this.distortion_Check.styleSheet = "QCheckBox { padding-left: " + (this.labelWidth + 4) + "px;}";
   this.distortion_Check.toolTip = "<p>When the distortion correction is activated the solution" +
      "uses surface splines for modelling the distortion in the image. The solution data is stored in " +
      "non-standard properties of the image so it can only be used inside PixInsight. For compatibility" +
      "with other applications, a lineal solution is also calculated and stored in the WCS keywords.</p>";
   this.distortion_Check.checked = engine.distortion;
   this.distortion_Check.onCheck = function (checked)
   {
      engine.distortion = checked;
      this.dialog.showDistortion_Check.enabled = checked;
      this.dialog.genDistortModel_Check.enabled = checked;
   };

   // Generate residuals image
   this.errors_Check = new CheckBox(this);
   this.errors_Check.text = "Generate residuals image";
   this.errors_Check.styleSheet = "QCheckBox { padding-left: "+(this.labelWidth+4)+"px;}";
   this.errors_Check.toolTip = "<p>Generates an image with the predicted position of the control points (green)" +
      "and arrows (red) pointing the actual position.<br/>" +
      "This image can be used to analyze the errors of the solution.</p>";
   this.errors_Check.checked = engine.showErrors;
   this.errors_Check.onCheck = function (checked)
   {
      engine.showErrors = checked;
   };

   // Show distortion map
   this.showDistortion_Check = new CheckBox(this);
   this.showDistortion_Check.text = "Show distortion map";
   this.showDistortion_Check.styleSheet = "QCheckBox { padding-left: "+(this.labelWidth+4)+"px;}";
   this.showDistortion_Check.toolTip = "<p>When the distortion correction is enabled this option generates a distortion map that "+
      "shows the difference between the lineal solution and the splines solution.</p>";
   this.showDistortion_Check.checked = engine.showDistortion;
   this.showDistortion_Check.enabled = engine.distortion;
   this.showDistortion_Check.onCheck = function (checked)
   {
      engine.showDistortion = checked;
   };

   // Generate distortion model
   this.genDistortModel_Check = new CheckBox( this );
   this.genDistortModel_Check.text = "Generate distortion model";
   this.genDistortModel_Check.styleSheet = "QCheckBox { padding-left: "+(this.labelWidth+4)+"px;}";
   this.genDistortModel_Check.checked = engine.generateDistortModel!=null && engine.generateDistortModel;
   this.genDistortModel_Check.enabled = engine.distortion;
   this.genDistortModel_Check.toolTip = "<p>Generates a distortion model in CSV format compatible with StarAlignment.</p>";
   this.genDistortModel_Check.onCheck = function( checked )
   {
      engine.generateDistortModel = checked;
   };

   // usual control buttons

   this.newInstanceButton = new ToolButton(this);
   this.newInstanceButton.icon = this.scaledResource( ":/process-interface/new-instance.png" );
   this.newInstanceButton.setScaledFixedSize( 20, 20 );
   this.newInstanceButton.toolTip = "New Instance";
   this.newInstanceButton.onMousePress = function ()
   {
      this.hasFocus = true;

      engine.SaveParameters();

      this.pushed = false;
      this.dialog.newInstance();
   };

   this.reset_Button = new ToolButton(this);
   this.reset_Button.icon = this.scaledResource( ":/icons/reload.png" );
   this.reset_Button.setScaledFixedSize( 20, 20 );
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
    this.help_Button.icon = this.scaledResource( ":/process-interface/browse-documentation.png" );
    this.help_Button.setScaledFixedSize( 20, 20 );
    this.help_Button.toolTip = "<p>Browse Documentation</p>";
    this.help_Button.onClick = function ()
    {
      Dialog.browseScriptDocumentation( "ManualImageSolver" );
    };

   this.ok_Button = new PushButton(this);
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function ()
   {
      try
      {
         // Validation
         if (engine.referWindow == null || engine.referWindow.length==0)
            throw "There is not any reference window selected";
         var refW=ImageWindow.windowById(engine.referWindow);
         if(!refW || !refW.isWindow)
            throw "Couldn't access to the selected reference window";
         var refMetadata=new ImageMetadata();
         refMetadata.ExtractMetadata(refW);
         if(!refMetadata.projection || !refMetadata.ref_I_G)
            throw "The reference window has not coordinates";
         if (engine.icon == null || engine.icon.length==0)
            throw "There is not any DynamicAlignment process selected";

         this.dialog.ok();
      } catch (ex)
      {
         new MessageBox(ex, TITLE, StdIcon_Error, StdButton_Ok).execute();
      }
   };

   this.cancel_Button = new PushButton(this);
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function ()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.add(this.newInstanceButton);
   this.buttons_Sizer.add(this.reset_Button);
   this.buttons_Sizer.add(this.help_Button);
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add(this.ok_Button);
   this.buttons_Sizer.add(this.cancel_Button);

   // Global sizer

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 6;
   this.sizer.add(this.helpLabel);
   this.sizer.addSpacing(4);
   this.sizer.add(this.icon_Sizer);
   this.sizer.add(this.reference_Sizer);
   this.sizer.add(this.errors_Check);
   this.sizer.add(this.distortion_Check);
   this.sizer.add(this.showDistortion_Check);
   this.sizer.add(this.genDistortModel_Check);
   this.sizer.addSpacing(8);
   this.sizer.add(this.buttons_Sizer);

   this.windowTitle = TITLE;
   this.adjustToContents();
   this.setFixedSize();
}
ManualSolverDialog.prototype = new Dialog;

// -------------------------------------
// CLASS ManualImageSolverEngine
function ManualImageSolverEngine()
{
   this.__base__ = ObjectWithSettings;
   this.__base__(
      SETTINGS_MODULE,
      "engine",
      new Array(
         [ "referWindow", DataType_String ],
         [ "icon", DataType_String ],
         [ "distortion", DataType_Boolean ],
         [ "generateDistortModel", DataType_Boolean ],
         [ "showErrors", DataType_Boolean ],
         [ "showDistortion", DataType_Boolean ]
      )
   );

   this.referWindow = "";
   this.icon = "";
   this.distortion = false;
   this.generateDistortModel = false;
   this.showErrors = true;
   this.showDistortion = true;

   // Select image and get metadata
   this.Init = function (w)
   {
      if(!w || !w.isWindow)
         throw "There isn't any window active";
      this.currentWindow = w;

      this.LoadSettings();
      this.LoadParameters();
   }

   this.GenerateMetadataFromControlPoints = function (dynAlignIcon, metadata0, window1, distortion)
   {
      var window1centerI = new Point(window1.mainView.image.width / 2, window1.mainView.image.height / 2);

      // Calculate coordinates of the control points
      var cpI0 = [];
      var cpI1 = [];
      var cpRD = [];
      var points = dynAlignIcon.points;
      var boundsRD = null;
      for (var i = 0; i < points.length; i++)
      {
         if (!points[i][0]) // Invalid point
            continue;
         var pI0 = new Point(points[i][2], points[i][3]);
         cpI0.push(pI0);
         cpI1.push(new Point(points[i][5], points[i][6]));
         var pRD = metadata0.Convert_I_RD(pI0);
         cpRD.push(pRD);
         if (boundsRD)
            boundsRD = boundsRD.union(pRD.x, pRD.y, pRD.x, pRD.y);
         else
            boundsRD = new Rect(pRD.x, pRD.y, pRD.x, pRD.y);
      }

      var centerRD = boundsRD.center;
      var cornerRD = new Point(boundsRD.left, boundsRD.top);
      console.write("Center: ");
      centerRD.PrintAsRaDec();
      var ref_I1_G;
      var ref_G_I1;
      var ref_I1_G_lineal;
      var projection;
      var offset = 1000;
      var cpG;
      for (var it = 0; it < 15 && offset > 1e-4; it++)
      {
         //projection = new Gnomonic(180 / Math.PI, centerRD.x, centerRD.y);
         projection = ProjectionFactory({
               projectionOriginMode:0,
               projection: metadata0.projection.projCode
            }, centerRD.x, centerRD.y);

         // Coordinates of the control points in Gnomonic space
         cpG = new Array(cpRD.length)
         for (var i = 0; i < cpRD.length; i++)
            cpG[i] = projection.Direct(cpRD[i]);

         if (!distortion)
         {
            ref_I1_G = MultipleLinearRegression(1, cpI1, cpG);
            ref_I1_G_lineal = ref_I1_G.ToLinealMatrix();
            ref_G_I1 = ref_I1_G_lineal.inverse();
         }
         else
         {
            ref_I1_G = new ReferSpline(cpI1, cpG, null, 2, 0);
            ref_I1_G_lineal = MultipleLinearRegression(1, cpI1, cpG).ToLinealMatrix();
            processEvents();
            ref_G_I1 = new ReferSpline(cpG, cpI1, null, 2, 0);
            processEvents();
         }

         var prevCenterRD = centerRD;
         var prevCornerRD = cornerRD;
         var centerG = ref_I1_G.Apply(window1centerI);
         centerRD = projection.Inverse(centerG);
         cornerRD = projection.Inverse(ref_I1_G.Apply(new Point(0,0)));

         // Calculate RMS
         var rms = 0;
         for (var i = 0; i < cpRD.length; i++)
         {
            var pI1 = ref_G_I1.Apply(cpG[i]);
            var errx = pI1.x - cpI1[i].x;
            var erry = pI1.y - cpI1[i].y;
            rms += errx * errx + erry * erry;
         }

         var delta1 = Math.sqrt(
            Math.pow((centerRD.x - prevCenterRD.x) * Math.cos(centerRD.y * Math.PI / 180),2) +
            Math.pow(centerRD.y - prevCenterRD.y,2) );
         var delta2 = Math.sqrt(
            Math.pow((cornerRD.x - prevCornerRD.x) * Math.cos(cornerRD.y * Math.PI / 180),2) +
            Math.pow(cornerRD.y - prevCornerRD.y,2) );
         offset = Math.max(delta1, delta2) * 3600;
         console.writeln("------------------");
         console.writeln(format("Offset: %.5f \"", offset));
         console.writeln(format("RMS: %.3f px", rms));
         console.write("Center: ");
         centerRD.PrintAsRaDec();
      }

      var metadata1 = new ImageMetadata();
      metadata1.epoch = metadata0.epoch;
      metadata1.ra = projection.ra0 * 180 / Math.PI;
      metadata1.dec = projection.dec0 * 180 / Math.PI;
      metadata1.projection = projection;
      metadata1.ref_I_G_lineal = ref_I1_G_lineal;
      metadata1.ref_I_G = ref_I1_G;
      metadata1.ref_G_I = ref_G_I1;
      if(distortion)
         metadata1.controlPoints = { pI: cpI1, pG: cpG };

      metadata1.width = window1.mainView.image.width;
      metadata1.height = window1.mainView.image.height;
      var ref = metadata1.ref_I_G_lineal;
      var resx = Math.sqrt(ref.at(0, 0) * ref.at(0, 0) + ref.at(0, 1) * ref.at(0, 1));
      var resy = Math.sqrt(ref.at(1, 0) * ref.at(1, 0) + ref.at(1, 1) * ref.at(1, 1));
      metadata1.resolution = (resx + resy) / 2;
      metadata1.xpixsz = metadata0.xpixsz;
      metadata1.focal = metadata1.FocalFromResolution(metadata1.resolution);
      metadata1.useFocal = false;

      return {metadata: metadata1, cpI: cpI1, cpRD: cpRD};
   }

   this.ApplySTF = function(view, stf)
   {
      var low=(stf[0][1]+stf[1][1]+stf[2][1])/3;
      var mtf=(stf[0][0]+stf[1][0]+stf[2][0])/3;
      var hgh=(stf[0][2]+stf[1][2]+stf[2][2])/3;

      if ( low > 0 || mtf != 0.5 || hgh != 1 ) // if not an identity transformation
      {
         console.writeln(format("<b>Applying STF to '%ls'</b>:\x1b[38;2;100;100;100m",view.id));
         var HT = new HistogramTransformation;
         HT.H = [[  0, 0.5,   1, 0, 1],
            [  0, 0.5,   1, 0, 1],
            [  0, 0.5,   1, 0, 1],
            [low, mtf, hgh, 0, 1],
            [  0, 0.5,   1, 0, 1]];

         HT.executeOn( view, false ); // no swap file
         console.write("\x1b[0m");
      }
   }

   this.DrawErrors = function (result)
   {
      // Draw errors in a new bitmap
      var bmp = new Bitmap(result.metadata.width, result.metadata.height);

      //Copy the source image to the error image
      var imageOrg = this.currentWindow.mainView.image;

      var imageL = new Image( imageOrg.width, imageOrg.height, 1, ColorSpace_Gray, 32, SampleType_Real );
      imageOrg.getLightness(imageL);
      var tmpW = new ImageWindow(imageL.width, imageL.height, imageL.numberOfChannels, imageL.bitsPerSample, imageL.isReal, imageL.isColor, this.currentWindow.mainView.id + "_Errors");
      try
      {
         tmpW.mainView.beginProcess(UndoFlag_NoSwapFile);
         tmpW.mainView.image.apply(imageL);
         this.ApplySTF(tmpW.mainView, this.currentWindow.mainView.stf);
         tmpW.mainView.endProcess();
         bmp.assign(tmpW.mainView.image.render());
      } finally
      {
         tmpW.close();
      }

      //bmp.fill(0xff000000);
      var g = new VectorGraphics(bmp);
      g.antialiasing = true;
      var linePen = new Pen(0xffff4040, 2);
      var starPen = new Pen(0xff40ff40, 3);
      var crossSize = 20;
      for (var i = 0; i < result.cpI.length; i++)
      {
         if (result.cpI[i] && result.cpRD[i])
         {
            var predicted = result.metadata.Convert_RD_I(result.cpRD[i]);
            var arrow = new Point(
               predicted.x + (result.cpI[i].x - predicted.x) * 1,
               predicted.y + (result.cpI[i].y - predicted.y) * 1);
            g.pen = linePen;
            g.drawLine(predicted, arrow);
            g.pen = starPen;
            g.drawLine(predicted.x - crossSize, predicted.y, predicted.x - crossSize/2, predicted.y);
            g.drawLine(predicted.x + crossSize, predicted.y, predicted.x + crossSize/2, predicted.y);
            g.drawLine(predicted.x, predicted.y - crossSize, predicted.x, predicted.y - crossSize/2);
            g.drawLine(predicted.x, predicted.y + crossSize, predicted.x, predicted.y + crossSize/2);
         }
      }
      g.end();

      // Create an ImageWindow for showing the bitmap
      var errW = new ImageWindow(bmp.width, bmp.height,
         3, 8, false, true, this.currentWindow.mainView.id + "_Errors");
      errW.mainView.beginProcess(UndoFlag_NoSwapFile);

      // Blend annotation with target image
      errW.mainView.image.blend(bmp);

      // Copy keywords to target image
      errW.keywords = this.currentWindow.keywords;

      errW.mainView.endProcess();
      errW.show();
   }

   this.DrawDistortions = function(metadata)
   {
      console.writeln("Creating distortion map");

      var ref_I_G_lineal = metadata.ref_I_G_lineal;
      if(metadata.controlPoints){
         var centerI = new Point(metadata.width / 2, metadata.height / 2);
         var centerG = metadata.ref_I_G.Apply(centerI);
         ref_I_G_lineal = MultipleLinearRegressionHelmert(metadata.controlPoints.pI, metadata.controlPoints.pG, centerI, centerG);
      }

      // Draw errors in a new bitmap
      var bmp = new Bitmap(metadata.width, metadata.height);

      bmp.fill(0xffffffff);
      var g = new VectorGraphics(bmp);
      g.antialiasing = true;
      var linePen = new Pen(0xff000000, 2);
      var starPen = new Pen(0xff800000, 2);
      g.pen=starPen;
      var cellSize=Math.min(metadata.width, metadata.height)/40;
      cellSize=Math.max(40,cellSize);

      var arrowFactor=1; // Distortion magnification
      for(var y=0; y<metadata.height; y+=cellSize)
         for(var x=0; x<metadata.width; x+=cellSize)
         {
            var posLinealI = new Point(x+cellSize/2,y+cellSize/2);
            var posG = ref_I_G_lineal.Apply(posLinealI);
            var posDistortI = metadata.ref_G_I.Apply(posG);
            if(!posDistortI)
               continue;
            var arrow = new Point(posDistortI.x+(posLinealI.x-posDistortI.x)*arrowFactor, posDistortI.y+(posLinealI.y-posDistortI.y)*arrowFactor);
            g.drawLine(posDistortI, arrow);
            g.drawEllipse(posDistortI.x-1,posDistortI.y-1,posDistortI.x+1,posDistortI.y+1);
         }
      g.pen=linePen;
      for (var y = 0; y-cellSize <= metadata.height; y += cellSize)
      {
         var pts = [];
         for (var x = 0; x-cellSize <= metadata.width; x += cellSize)
         {
            var posLinealI = new Point(x, y);
            var posG = ref_I_G_lineal.Apply(posLinealI);
            pts.push(metadata.ref_G_I.Apply(posG));
         }
         g.drawPolyline(pts);
      }
      for (var x = 0; x-cellSize <= metadata.width; x += cellSize)
      {
         var pts = [];
         for (var y = 0; y-cellSize <= metadata.height; y += cellSize)
         {
            var posLinealI = new Point(x, y);
            var posG = ref_I_G_lineal.Apply(posLinealI);
            pts.push(metadata.ref_G_I.Apply(posG));
         }
         g.drawPolyline(pts);
      }
      g.end();

      // Create an ImageWindow for showing the bitmap
      var errW = new ImageWindow(metadata.width, metadata.height,
         3, 8, false, true, this.currentWindow.mainView.id+ "_Distortions");
      errW.mainView.beginProcess(UndoFlag_NoSwapFile);

      // Blend annotation with target image
      errW.mainView.image.blend(bmp);

      // Copy keywords to target image
      errW.keywords = this.currentWindow.keywords;

      errW.mainView.endProcess();
      errW.show();
   };

   this.GenerateDistortionModel = function (metadata, points, path)
   {
      console.writeln("Generating distortion model: ", path);

      var file = new File();
      try
      {
         file.create(path);
         file.outTextLn("ThinPlate,2");

         var ref_I_G_lineal = metadata.ref_I_G_lineal;
         if (metadata.controlPoints)
         {
            var centerI = new Point(metadata.width / 2, metadata.height / 2);
            var centerG = metadata.ref_I_G.Apply(centerI);
            ref_I_G_lineal = MultipleLinearRegressionHelmert(metadata.controlPoints.pI, metadata.controlPoints.pG, centerI, centerG);
         }

         for (var i = 0; i < points.length; i++)
         {
            var posLinealI = points[i];
            var posG = ref_I_G_lineal.Apply(posLinealI);
            var posDistortI = metadata.ref_G_I.Apply(posG);
            var dx = posDistortI.x - posLinealI.x;
            var dy = posDistortI.y - posLinealI.y;

            file.outTextLn(format("%f,%f,%f,%f", posLinealI.x, posLinealI.y, dx, dy));
         }
      } finally
      {
         file.close();
      }
   }

   this.Execute = function()
   {
      if(!this.icon || this.icon.trim().length==0)
         throw "There is not any process icon selected";
      var da = ProcessInstance.fromIcon(this.icon);
      if(!da)
         throw "Couldn't open the process icon '"+this.icon+"'";

      var window0 = ImageWindow.windowById(this.referWindow);
      if(!window0 || !window0.isWindow)
         throw "Couldn't find the window '"+this.referWindow+"'";

      var metadata0 = new ImageMetadata();
      metadata0.ExtractMetadata(window0);

      var result = this.GenerateMetadataFromControlPoints(da, metadata0, this.currentWindow, this.distortion);
      result.metadata.SaveKeywords(this.currentWindow);
      result.metadata.SaveProperties(this.currentWindow);

      // Distortion model
      if(this.generateDistortModel && this.distortion)
      {
         var modelPath = null;
         var filePath = this.currentWindow.filePath;
         if (filePath)
         {
            var modelPath = File.extractDrive(filePath) + File.extractDirectory(filePath) + "/" +
               File.extractName(filePath) + "_model.csv";
         } else {
            var ofd = new SaveFileDialog;
            ofd.caption = "Select Star Database Path";
            ofd.filters = [["Distortion models", "*.csv"]];
            if ( ofd.execute() )
               modelPath = ofd.fileName;
         }
         if(modelPath)
            this.GenerateDistortionModel(result.metadata, result.cpI, modelPath);
      }

      if(this.showErrors)
         this.DrawErrors(result);

      if(this.showDistortion && this.distortion)
         this.DrawDistortions(result.metadata);

      // Print result
      console.writeln( "<end><cbr><br>Manual Image Plate Solver script version ", VERSION );
      console.writeln( "===============================================================================" );
      result.metadata.Print();
      console.writeln( "===============================================================================" );
   }
};

function CheckVersion( major, minor, release )
{
   if( major == __PI_MAJOR__ )
   {
      if( minor == __PI_MINOR__ )
         return release <= __PI_RELEASE__;
      else
         return minor < __PI_MINOR__;
   }
   else
      return major < __PI_MAJOR__;
}

function main()
{
   try{
      if (!CheckVersion(1, 8, 4))
         throw "This script requires at least the version 1.8.4 of PixInsight";

      var engine = new ManualImageSolverEngine();
      if (Parameters.isViewTarget)
      {
         engine.Init(Parameters.targetView.window);
      }
      else
      {
         do {
            engine.Init(ImageWindow.activeWindow);
            var dialog = new ManualSolverDialog(engine);
            var res = dialog.execute();

            if (!res)
            {
               if (dialog.resetRequest)
                  engine = new ManualImageSolverEngine();
               else
                  return;
            }
         } while (!res);
         engine.SaveSettings();
      }
      engine.Execute();
   }
   catch ( error )
   {
      console.writeln( error.toString() );
      var msgb=new MessageBox( error.toString(), TITLE, StdIcon_Error );
      msgb.execute();
   }
}

main();
