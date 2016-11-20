/*
 Mosaic Planner

 Tool for planning mosaics.

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

/*
 Changelog:

 1.2.1:* Added test for too big images (>0.5GigaPixels)

 1.2:  * Use downloaded catalogs

 1.1.1:* Fixed: The script didn't include two files

 1.1:  * Configuration of graphical properties
       * Option for drawing the coordinates of the tiles on the image

 1.0:  * Initial version

*/

#feature-id   Utilities > MosaicPlanner

#feature-info Tool for helping to define the tiles of a mosaic. <br/>\
              <br/>\
              Copyright &copy; 2015-16 Andr&eacute;s del Pozo


#include <pjsr/DataType.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/NumericControl.jsh>
#include <pjsr/ColorComboBox.jsh>

#ifndef __PJSR_SectionBar_jsh
#include <pjsr/SectionBar.jsh>
#endif


#define VERSION "1.2.1"
#define TITLE "Mosaic Planner"
#define SETTINGS_MODULE "MosaicPlan"
#define STAR_CSV_FILE   File.systemTempDirectory + "/stars.csv"

#include "WCSmetadata.jsh"
#include "AstronomicalCatalogs.jsh"
#include "PreviewControl.js"
#include "SearchCoordinatesDialog.js"
#include "CommonUIControls.js"
#include "CatalogDownloader.js"
;

// ******************************************************************
// CameraGeometry: Configuration of the geometry of the camera
// ******************************************************************
function CameraGeometry(focal, mainSensor, guideSensor)
{
   this.__base__ = ObjectWithSettings;
   this.__base__(
      SETTINGS_MODULE,
      "engine",
      new Array(
         [ "mainSensor", Ext_DataType_JSON ],
         [ "guideSensor", Ext_DataType_JSON ],
         [ "focal", DataType_Double ]
      )
   );

   this.focal = focal;
   this.mainSensor = mainSensor;
   this.guideSensor = guideSensor;

   this.UpdateGeometry = function ()
   {
      this.mainSensorPolygon = this.RectangleToPolygon(new Rect(0, 0, this.mainSensor.width, this.mainSensor.height), 8);
      this.mainSensorCenter = new Point(this.mainSensor.width / 2, this.mainSensor.height / 2);
      if (this.guideSensor && this.guideSensor.active)
      {
         var guiderCenter = new Point(
            this.mainSensorCenter.x + this.guideSensor.offsetX * 1000 / this.mainSensor.pixelSize,
            this.mainSensorCenter.y + this.guideSensor.offsetY * 1000 / this.mainSensor.pixelSize);
         var guiderWidthPx = this.guideSensor.width * 1000 / this.mainSensor.pixelSize;
         var guiderHeightPx = this.guideSensor.height * 1000 / this.mainSensor.pixelSize;
         var guideRect = new Rect(
            guiderCenter.x - guiderWidthPx / 2,
            guiderCenter.y - guiderHeightPx / 2,
            guiderCenter.x + guiderWidthPx / 2,
            guiderCenter.y + guiderHeightPx / 2
         );
         this.guideSensorPolygon = this.RectangleToPolygon(guideRect, 8);
         this.guideSensorCenter = guiderCenter;
      }
      else
         this.guideSensorPolygon = null;
   };

   this.RectangleToPolygon = function (rect, N)
   {
      var points = [];
      for (var x = 0; x < N; x++)
         points.push(new Point(rect.x0 + x / N * rect.width, rect.y0));
      for (var y = 0; y < N; y++)
         points.push(new Point(rect.x1, rect.y0 + y / N * rect.height));
      for (var x = 0; x < N; x++)
         points.push(new Point(rect.x1 - x / N * rect.width, rect.y1));
      for (var y = 0; y <= N; y++)
         points.push(new Point(rect.x0, rect.y1 - y / N * rect.height));
      return points;
   };

   this.UpdateGeometry();
}
CameraGeometry.prototype = new ObjectWithSettings;
CameraGeometry.prototype = new ObjectWithSettings;

// ******************************************************************
// TileGeometry: Definition the geometry of a tile of the mosaic
// ******************************************************************
function TileGeometry(data)
{
   this.center = data.center;
   this.baseRotation = data.rotation;
   this.customRotation = 0;

   this.GetRotation = function ()
   {
      var actualRotation = this.baseRotation + this.customRotation;
      while (actualRotation < 0) actualRotation += 360;
      while (actualRotation >= 360) actualRotation -= 360;
      return actualRotation;
   };

   this.UpdateGeometry = function (cameraGeometry, windowMetadata)
   {
      // Create metadata
      var metadata = new ImageMetadata();
      metadata.ra = this.center.x;
      metadata.dec = this.center.y;
      var epoch = new Date(Date.now());
      metadata.epoch = Math.complexTimeToJD(epoch.getFullYear(), epoch.getMonth() + 1, epoch.getDate());
      metadata.focal = cameraGeometry.focal;
      metadata.xpixsz = cameraGeometry.mainSensor.pixelSize;
      metadata.resolution = (metadata.focal > 0) ? metadata.xpixsz / metadata.focal * 0.18 / Math.PI : 0;
      metadata.width = cameraGeometry.mainSensor.width;
      metadata.height = cameraGeometry.mainSensor.height;
      metadata.rotation = this.GetRotation();
      metadata.projection = new Gnomonic(180 / Math.PI, this.center.x, this.center.y);

      var rot = -metadata.rotation * Math.PI / 180;
      var cd1_1 = -metadata.resolution * Math.cos(rot);
      var cd1_2 = -metadata.resolution * Math.sin(rot);
      var cd2_1 = -metadata.resolution * Math.sin(rot);
      var cd2_2 = metadata.resolution * Math.cos(rot);
      var crpix1 = metadata.width / 2 + 0.5;
      var crpix2 = metadata.height / 2 + 0.5;
      var ref_F_G = new Matrix(
         cd1_1, cd1_2, -cd1_1 * crpix1 - cd1_2 * crpix2,
         cd2_1, cd2_2, -cd2_1 * crpix1 - cd2_2 * crpix2,
         0, 0, 1);

      var ref_F_I = new Matrix(
         1, 0, -0.5,
         0, -1, metadata.height + 0.5,
         0, 0, 1
      );
      metadata.ref_I_G = ref_F_G.mul(ref_F_I.inverse());
      metadata.ref_G_I = metadata.ref_I_G.inverse();
      this.metadata = metadata;

      // Create polygons
      this.polylinesMain = [];
      this.polylinesGuider = [];
      if (cameraGeometry.mainSensor.active){
         this.PolygonToPolylines(this.polylinesMain, cameraGeometry.mainSensorPolygon, windowMetadata);
         this.centerI = windowMetadata.Convert_RD_I(this.center);
      }
      if (cameraGeometry.guideSensor && cameraGeometry.guideSensor.active)
      {
         this.PolygonToPolylines(this.polylinesGuider, cameraGeometry.guideSensorPolygon, windowMetadata);
         var pRD0 = this.metadata.Convert_I_RD(cameraGeometry.mainSensorCenter);
         var p0 = null;
         if (pRD0)
            p0 = windowMetadata.Convert_RD_I(pRD0);
         var pRD1 = this.metadata.Convert_I_RD(cameraGeometry.guideSensorCenter);
         var p1 = null;
         if (pRD1)
            p1 = windowMetadata.Convert_RD_I(pRD1);
         if (p0 && p1 && windowMetadata.projection.CheckBrokenLine(pRD0, pRD1))
            this.polylinesGuider.push([p0, p1]);
      }
   };

   this.PolygonToPolylines = function (polylineArray, polygon, windowMetadata)
   {
      var polyline = [];
      var pRD0 = this.metadata.Convert_I_RD(polygon[0]);
      var p0 = windowMetadata.Convert_RD_I(pRD0);
      if (p0)
         polyline.push(p0);
      for (var i = 1; i < polygon.length; i++)
      {
         var pRD1 = this.metadata.Convert_I_RD(polygon[i]);
         var p1 = windowMetadata.Convert_RD_I(pRD1);
         if (!(p0 && p1 && windowMetadata.projection.CheckBrokenLine(pRD0, pRD1)))
         {
            if (polyline.length > 1)
               polylineArray.push(polyline);
            polyline = [];
         }
         if (p1)
            polyline.push(p1);
         p0 = p1;
         pRD0 = pRD1;
      }
      if (polyline.length > 1)
         polylineArray.push(polyline);
   };
}


// ******************************************************************
// LabelEditLabel: Control composed of a label, a text box and a second label
// ******************************************************************
function LabelEditLabel(parent, label1Text, editText, tooltip, label2Text, labelWidth, editWidth, onChange, onChangeScope)
{
   this.__base__ = Control;
   if (parent)
      this.__base__(parent);
   else
      this.__base__();

   this.Label1 = new Label(this);
   this.Label1.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   if (labelWidth > 0)
      this.Label1.setFixedWidth(labelWidth);
   this.Label1.text = label1Text;

   this.valueEdit = new Edit(this);
   this.valueEdit.text = editText;
   this.valueEdit.toolTip = tooltip;
   if (editWidth > 0)
      this.valueEdit.setFixedWidth(editWidth);
   this.valueEdit.onTextUpdated = function (value)
   {
      onChange.call(onChangeScope, value)
   };

   this.Label2 = new Label(this);
   this.Label2.text = label2Text;
   this.Label2.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.sizer = new HorizontalSizer;
   this.sizer.scaledSpacing = 4;
   this.sizer.add(this.Label1);
   this.sizer.add(this.valueEdit);
   this.sizer.add(this.Label2);
   this.sizer.addStretch();

   this.getText = function ()
   {
      return this.valueEdit.text;
   };
   this.setText = function (newText)
   {
      this.valueEdit.text = newText;
   };
   this.setUnit = function (newText)
   {
      this.Label2.text = newText;
   };
}
LabelEditLabel.prototype = new Control;

// ******************************************************************
// MosaicDialog: Dialog qith the user interface of the planner
// ******************************************************************
function MosaicDialog(engine)
{
   this.__base__ = Dialog;
   this.__base__();
   //this.restyle();

   this.engine = engine;
   this.imageBmp = this.GetWindowBmp(engine.imageWindow);

   var scriptDir = File.extractDrive( #__FILE__ ) + File.extractDirectory( #__FILE__ );
   var labelWidth1 = Math.max(this.font.width("Pixel size:"),this.font.width("Dec(dms):"));
   var editWidth = this.font.width("8888.8888");
   var editWidth2 = this.font.width("8888.8888");

   this.UpdateMosaic = function ()
   {
      engine.GenerateMosaic();
      this.previewControl.forceRedraw();
      this.fillTileList();
   };

   engine.GenerateMosaic();

   this.previewControl = new PreviewControl(this);
   this.previewControl.SetImage(this.imageBmp, engine.metadata);
   this.previewControl.onCustomPaintScope = this;
   this.previewControl.onCustomPaint = function (graphics, x0, y0, x1, y1)
   {
      engine.PaintGuideStars(graphics);
      engine.PaintTiles(graphics);

      var tilesList = this.tiles_List;
      var selectedTilePen = new Pen(0xffffff20, engine.tileLineWidth);
      tilesList.selectedNodes.forEach(function (node)
      {
         var tileIdx = tilesList.childIndex(node);
         graphics.pen = selectedTilePen;
         var tile = engine.tiles[tileIdx];
         if (engine.showMain)
            tile.polylinesMain.forEach(function (polyline)
               {
                  graphics.drawPolyline(polyline);
               }
            );
         tile.polylinesGuider.forEach(function (polyline)
            {
               graphics.drawPolyline(polyline);
            }
         );
      });
   };


   // Focal
   this.FocalControl = new LabelEditLabel(
      this,
      "Focal length:",
      format("%g", engine.cameraGeometry.focal),
      "<p>Effective focal length of the optical system in millimeters.</p>",
      "mm", 0, editWidth,
      function (value)
      {
         engine.cameraGeometry.focal = parseFloat(value);
         engine.cameraGeometry.UpdateGeometry();
         this.dialog.UpdateMosaic();
      }, this);
   this.FocalControl.sizer.insertScaledSpacing(0, 7);

   // Main sensor
   this.MainWidthLabel = new Label(this);
   this.MainWidthLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.MainWidthLabel.setMinWidth(labelWidth1);
   this.MainWidthLabel.text = "Width:";

   this.MainWidthEdit = new Edit(this);
   this.MainWidthEdit.text = format("%g", engine.cameraGeometry.mainSensor.width);
   this.MainWidthEdit.toolTip = "<p>Width of the main sensor of the camera in millimeters or pixels.</p>";
   this.MainWidthEdit.setFixedWidth(editWidth);
   this.MainWidthEdit.onTextUpdated = function (value)
   {
      // TODO: Validation
      var dlg = this.dialog;
      if (dlg.MainWidthUnit.currentItem == 0)
         engine.cameraGeometry.mainSensor.width = parseFloat(value);
      else
         engine.cameraGeometry.mainSensor.width = parseFloat(value) / engine.cameraGeometry.mainSensor.pixelSize * 1000;
      engine.cameraGeometry.UpdateGeometry();
      this.dialog.UpdateMosaic();
   };

   this.MainWidthUnit = new ComboBox(this);
   this.MainWidthUnit.editEnabled = false;
   this.MainWidthUnit.addItem("pixels");
   this.MainWidthUnit.addItem("mm");
   this.MainWidthUnit.currentItem = 0;
   this.MainWidthUnit.toolTip = "<p>Units used for defining the size of the main sensor</p>" +
      "<p>If 'pixels' is selected the pixel size must be configured.</p>";
   this.MainWidthUnit.onItemSelected = function ()
   {
      var dlg = this.dialog;
      if (dlg.MainWidthUnit.currentItem == 0)
      {
         // mm->pixels
         dlg.MainWidthEdit.text = format("%g", engine.cameraGeometry.mainSensor.width);
         dlg.MainSensorHeight.setText(format("%g", engine.cameraGeometry.mainSensor.height));
         dlg.MainSensorHeight.setUnit("pixels");
         dlg.MainSensorPixel.show();
      }
      else
      {
         //pixels->mm
         dlg.MainWidthEdit.text = format("%g", engine.cameraGeometry.mainSensor.width * engine.cameraGeometry.mainSensor.pixelSize / 1000);
         dlg.MainSensorHeight.setText(format("%g", engine.cameraGeometry.mainSensor.height * engine.cameraGeometry.mainSensor.pixelSize / 1000));
         dlg.MainSensorHeight.setUnit("mm");
         dlg.MainSensorPixel.hide();
      }
   };
   this.MainWidthSizer = new HorizontalSizer;
   this.MainWidthSizer.scaledSpacing = 4;
   this.MainWidthSizer.add(this.MainWidthLabel);
   this.MainWidthSizer.add(this.MainWidthEdit);
   this.MainWidthSizer.add(this.MainWidthUnit);
   this.MainWidthSizer.addStretch();

   this.MainSensorHeight = new LabelEditLabel(
      this,
      "Height:",
      format("%g", engine.cameraGeometry.mainSensor.height),
      "<p>Height of the main sensor of the camera in millimeters or pixels.</p>",
      "pixels", labelWidth1, editWidth,
      function (value)
      {
         // TODO: Validation
         var dlg = this.dialog;
         if (dlg.MainWidthUnit.currentItem == 0)
            engine.cameraGeometry.mainSensor.height = parseFloat(value);
         else
            engine.cameraGeometry.mainSensor.height = parseFloat(value) / engine.cameraGeometry.mainSensor.pixelSize * 1000;
         engine.cameraGeometry.UpdateGeometry();
         this.dialog.UpdateMosaic();
      }, this);
   this.MainSensorPixel = new LabelEditLabel(
      this,
      "Pixel Size:",
      format("%g", engine.cameraGeometry.mainSensor.pixelSize),
      "<p>Size of the pixels of the main sensor in microns (1/1000mm).</p>",
      "um", labelWidth1, editWidth,
      function (value)
      {
         // TODO: Validation
         engine.cameraGeometry.mainSensor.pixelSize = parseFloat(value);
         engine.cameraGeometry.UpdateGeometry();
         this.dialog.UpdateMosaic();
      }, this);

   this.mainSensorGroup = new GroupBox(this);
   this.mainSensorGroup.titleCheckBox = true;
   this.mainSensorGroup.title = "Main sensor";
   this.mainSensorGroup.checked = engine.cameraGeometry.mainSensor.active ? true : false;

   this.mainSensorGroup.sizer = new VerticalSizer;
   this.mainSensorGroup.sizer.scaledMargin = 6;
   this.mainSensorGroup.sizer.scaledSpacing = 4;
   this.mainSensorGroup.sizer.add(this.MainWidthSizer);
   this.mainSensorGroup.sizer.add(this.MainSensorHeight);
   this.mainSensorGroup.sizer.add(this.MainSensorPixel);
   this.mainSensorGroup.onCheck = function (checked)
   {
      engine.cameraGeometry.mainSensor.active = checked;
      //this.dialog.guideSensorGroup.enabled = checked;
      engine.cameraGeometry.UpdateGeometry();
      this.dialog.UpdateMosaic();
   };

   // Guide sensor
   this.GuideSensorWidth = new LabelEditLabel(
      this,
      "Width:",
      format("%g", engine.cameraGeometry.guideSensor.width),
      "<p>Width of the main sensor of the camera in millimeters.</p>",
      "mm", labelWidth1, editWidth2,
      function (value)
      {
         // TODO: Validation
         engine.cameraGeometry.guideSensor.width = parseFloat(value);
         engine.cameraGeometry.UpdateGeometry();
         this.dialog.UpdateMosaic();
      }, this);
   this.GuideSensorHeight = new LabelEditLabel(
      this,
      "Height:",
      format("%g", engine.cameraGeometry.guideSensor.height),
      "<p>Height of the main sensor of the camera in millimeters.</p>",
      "mm", labelWidth1, editWidth2,
      function (value)
      {
         // TODO: Validation
         engine.cameraGeometry.guideSensor.height = parseFloat(value);
         engine.cameraGeometry.UpdateGeometry();
         this.dialog.UpdateMosaic();
      }, this);
   this.GuideSensorOffsetX = new LabelEditLabel(
      this,
      "OffsetX:",
      format("%g", engine.cameraGeometry.guideSensor.offsetX),
      "<p>Horizontal position of the center of the guider sensor relative to the center of the main sensor.</p>",
      "mm", this.font.width("OffsetX:"), editWidth2,
      function (value)
      {
         // TODO: Validation
         engine.cameraGeometry.guideSensor.offsetX = parseFloat(value);
         engine.cameraGeometry.UpdateGeometry();
         this.dialog.UpdateMosaic();
      }, this);
   this.GuideSensorOffsetY = new LabelEditLabel(
      this,
      "OffsetY:",
      format("%g", engine.cameraGeometry.guideSensor.offsetY),
      "<p>Vertical position of the center of the guider sensor relative to the center of the main sensor.</p>",
      "mm", this.font.width("OffsetX:"), editWidth2,
      function (value)
      {
         // TODO: Validation
         engine.cameraGeometry.guideSensor.offsetY = parseFloat(value);
         engine.cameraGeometry.UpdateGeometry();
         this.dialog.UpdateMosaic();
      }, this);

   this.guideSensorGroup = new GroupBox(this);
   this.guideSensorGroup.titleCheckBox = true;
   this.guideSensorGroup.title = "Guider sensor";
   this.guideSensorGroup.checked = engine.cameraGeometry.guideSensor.active;

   this.guideSensorSizer1 = new VerticalSizer;
   //   this.guideSensorSizer1.scaledMargin = 3;
   this.guideSensorSizer1.scaledSpacing = 4;
   this.guideSensorSizer1.add(this.GuideSensorWidth);
   this.guideSensorSizer1.add(this.GuideSensorHeight);
   this.guideSensorSizer2 = new VerticalSizer;
   //   this.guideSensorSizer2.scaledMargin = 3;
   this.guideSensorSizer2.scaledSpacing = 4;
   this.guideSensorSizer2.add(this.GuideSensorOffsetX);
   this.guideSensorSizer2.add(this.GuideSensorOffsetY);

   this.guideSensorGroup.sizer = new HorizontalSizer;
   this.guideSensorGroup.sizer.scaledMargin = 6;
   this.guideSensorGroup.sizer.add(this.guideSensorSizer1);
   this.guideSensorGroup.sizer.addScaledSpacing(6);
   this.guideSensorGroup.sizer.add(this.guideSensorSizer2);
   this.guideSensorGroup.sizer.addStretch();
   this.guideSensorGroup.onCheck = function (checked)
   {
      engine.cameraGeometry.guideSensor.active = checked;
      //this.dialog.guideSensorGroup.enabled = checked;
      engine.cameraGeometry.UpdateGeometry();
      this.dialog.UpdateMosaic();
   };


   // System Geometry
   this.geometry_Section = new SectionBar(this, "System geometry");
   this.geometry_Control = new Control(this);
   this.geometry_Control.sizer = new VerticalSizer;
   this.geometry_Control.sizer.scaledMargin = 6;
   this.geometry_Control.sizer.scaledSpacing = 4;
   this.geometry_Section.setSection(this.geometry_Control);
   this.geometry_Control.hide();
   this.geometry_Control.sizer.add(this.FocalControl);
   this.geometry_Control.sizer.add(this.mainSensorGroup);
   this.geometry_Control.sizer.add(this.guideSensorGroup);
   this.geometry_Section.toggleSection = function ()
   {
      if (this.section.visible)
         this.section.hide();
      else
      {
         this.section.adjustToContents();
         this.section.show();
      }
   };

   var coordinatesTooltip = "<p>Coordinates of the center of the origin tile.</p>";
   //var coordsLabelWidth = this.font.width("Dec(dms): ");
   var coordsWidth = this.font.width("88.888M");
   this.coords_Editor = new CoordinatesEditor(this, new Point(engine.originRA, engine.originDec), labelWidth1, null, coordinatesTooltip);
   this.coords_Editor.setLabels("RA(hms):", "Dec(dms):");
   this.coords_Editor.setOnChange(function (coords)
   {
      engine.originRA = coords.x;
      engine.originDec = coords.y;
      this.UpdateMosaic();
   }, this);

   this.search_Button = new ToolButton(this);
   //this.search_Button.text = "Search";
   this.search_Button.toolTip = "Opens a window for searching the coordinates of astronomical objects from an online catalog.";
   this.search_Button.icon = this.scaledResource(":/icons/find.png");
   this.search_Button.onClick = function ()
   {
      var search = new SearchCoordinatesDialog(null, true, false);
      search.windowTitle = "Online Coordinates Search"
      if (search.execute())
      {
         var object = search.object;
         if (object == null)
            return;
         engine.originRA = object.posEq.x;
         engine.originDec = object.posEq.y;
         this.dialog.coords_Editor.SetCoords(object.posEq);
         this.dialog.UpdateMosaic();
      }
   };

   this.center_Button = new ToolButton(this);
   //this.center_Button.text = "Image center";
   this.center_Button.toolTip = "Sets the origin of the mosaic at the center of the reference image.";
   this.center_Button.icon = this.scaledResource(":/toolbar/image-mode-center.png");
   this.center_Button.onClick = function ()
   {
      var origin = engine.metadata.Convert_I_RD(new Point(engine.metadata.width / 2, engine.metadata.height / 2));
      engine.originRA = origin.x;
      engine.originDec = origin.y;
      this.dialog.coords_Editor.SetCoords(origin);

      this.dialog.UpdateMosaic();
   };

   this.fromImage_Button = new ToolButton(this);
   //this.fromImage_Button.text = "Image center";
   this.fromImage_Button.toolTip = "Sets the mosaic origin at the center of another image.";
   this.fromImage_Button.icon = this.scaledResource(":/icons/document-arrow-right.png");
   this.fromImage_Button.onClick = function ()
   {
      var dlg = new SelectImageWithCoordsDialog();
      if (dlg.execute() && dlg.selectedMetadata)
      {
         engine.originRA = dlg.selectedMetadata.ra;
         engine.originDec = dlg.selectedMetadata.dec;
         this.dialog.coords_Editor.SetCoords(new Point(engine.originRA, engine.originDec));

         var rotation = dlg.selectedMetadata.GetRotation();
         if (rotation)
         {
            engine.rotation = rotation[0];
            this.dialog.RotationControl.setValue(engine.rotation);
            engine.InvalidateCustomRotation();
         }

         this.dialog.UpdateMosaic();
      }
   };

   this.up_Button = new ToolButton(this);
   this.up_Button.toolTip = "<p>Move the origin up</p>";
   this.up_Button.icon = this.scaledResource(":/arrows/arrow-up.png");
   //this.up_Button.setScaledFixedSize(20, 20);
   this.up_Button.onMousePress = function ()
   {
      engine.MoveOrigin(0, -4 / this.dialog.previewControl.scale);
      this.dialog.coords_Editor.SetCoords(new Point(engine.originRA, engine.originDec));
      this.dialog.UpdateMosaic();
   };

   this.down_Button = new ToolButton(this);
   this.down_Button.toolTip = "<p>Move the origin down</p>";
   this.down_Button.icon = this.scaledResource(":/arrows/arrow-down.png");
   //this.down_Button.setScaledFixedSize(20, 20);
   this.down_Button.onMousePress = function ()
   {
      engine.MoveOrigin(0, 4 / this.dialog.previewControl.scale);
      this.dialog.coords_Editor.SetCoords(new Point(engine.originRA, engine.originDec));
      this.dialog.UpdateMosaic();
   };

   this.left_Button = new ToolButton(this);
   this.left_Button.toolTip = "<p>Move the origin left</p>";
   this.left_Button.icon = this.scaledResource(":/arrows/arrow-left.png");
   //this.left_Button.setScaledFixedSize(20, 20);
   this.left_Button.onMousePress = function ()
   {
      engine.MoveOrigin(-4 / this.dialog.previewControl.scale, 0);
      this.dialog.coords_Editor.SetCoords(new Point(engine.originRA, engine.originDec));
      this.dialog.UpdateMosaic();
   };

   this.right_Button = new ToolButton(this);
   this.right_Button.toolTip = "<p>Move the origin right</p>";
   this.right_Button.icon = this.scaledResource(":/arrows/arrow-right.png");
   //this.right_Button.setScaledFixedSize(20, 20);
   this.right_Button.onMousePress = function ()
   {
      engine.MoveOrigin(4 / this.dialog.previewControl.scale, 0);
      this.dialog.coords_Editor.SetCoords(new Point(engine.originRA, engine.originDec));
      this.dialog.UpdateMosaic();
   };

   this.originButtonsSizer = new HorizontalSizer;
   this.originButtonsSizer.addStretch();
   this.originButtonsSizer.scaledSpacing = 4;
   this.originButtonsSizer.add(this.left_Button);
   this.originButtonsSizer.add(this.right_Button);
   this.originButtonsSizer.add(this.up_Button);
   this.originButtonsSizer.add(this.down_Button);
   this.originButtonsSizer.addStretch();

   this.originButtonsSizer2 = new VerticalSizer;
   this.originButtonsSizer2.scaledSpacing = 4;
   this.originButtonsSizer2.add(this.search_Button);
   this.originButtonsSizer2.add(this.center_Button);
   this.originButtonsSizer2.add(this.fromImage_Button);
   this.originButtonsSizer2.addStretch();

   this.originSizer1 = new VerticalSizer;
   this.originSizer1.scaledSpacing = 4;
   this.originSizer1.add(this.coords_Editor);
   this.originSizer1.add(this.originButtonsSizer);

   // Origin groupbox
   this.originGroup = new GroupBox(this);
   this.originGroup.title = "Origin";
   this.originGroup.sizer = new HorizontalSizer;
   this.originGroup.sizer.scaledMargin = 6;
   this.originGroup.sizer.scaledSpacing = 4;
   this.originGroup.sizer.add(this.originSizer1, 100);
   this.originGroup.sizer.add(this.originButtonsSizer2);

   // Columns
   this.colsLabel = new Label(this);
   this.colsLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.colsLabel.setMinWidth(labelWidth1);
   this.colsLabel.text = "Columns:";

   var spinBoxWidth = this.font.width('888888');
   this.colsLeftSpinBox = new coordSpinBox(this, engine.colsLeft, 20, spinBoxWidth,
      "Number of columns of tiles to the left of the reference tile",
      function (value)
      {
         engine.colsLeft = value;
         engine.InvalidateCustomRotation();
         this.dialog.UpdateMosaic();
      });
   this.colsEdit = new Edit(this);
   this.colsEdit.text = "1";
   this.colsEdit.setFixedWidth(spinBoxWidth);
   this.colsEdit.readOnly = true;

   this.colsRightSpinBox = new coordSpinBox(this, engine.colsRight, 20, spinBoxWidth,
      "Number of columns of tiles to the right of the reference tile",
      function (value)
      {
         engine.colsRight = value;
         engine.InvalidateCustomRotation();
         this.dialog.UpdateMosaic();
      });

   this.colsSizer = new HorizontalSizer;
   this.colsSizer.scaledSpacing = 4;
   this.colsSizer.add(this.colsLabel);
   this.colsSizer.add(this.colsLeftSpinBox);
   this.colsSizer.add(this.colsEdit);
   this.colsSizer.add(this.colsRightSpinBox);
   this.colsSizer.addStretch();

   // Columns
   this.rowsLabel = new Label(this);
   this.rowsLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.rowsLabel.setMinWidth(labelWidth1);
   this.rowsLabel.text = "Rows:";

   this.rowsLeftSpinBox = new coordSpinBox(this, engine.rowsTop, 20, spinBoxWidth,
      "Number of rows of tiles upside of the reference tile",
      function (value)
      {
         engine.rowsTop = value;
         engine.InvalidateCustomRotation();
         this.dialog.UpdateMosaic();
      });
   this.rowsEdit = new Edit(this);
   this.rowsEdit.text = "1";
   this.rowsEdit.setFixedWidth(spinBoxWidth);
   this.rowsEdit.readOnly = true;

   this.rowsRightSpinBox = new coordSpinBox(this, engine.rowsBottom, 20, spinBoxWidth,
      "Number of rows of tiles downside of the reference tile",
      function (value)
      {
         engine.rowsBottom = value;
         engine.InvalidateCustomRotation();
         this.dialog.UpdateMosaic();
      });

   this.rowsSizer = new HorizontalSizer;
   this.rowsSizer.scaledSpacing = 4;
   this.rowsSizer.add(this.rowsLabel);
   this.rowsSizer.add(this.rowsLeftSpinBox);
   this.rowsSizer.add(this.rowsEdit);
   this.rowsSizer.add(this.rowsRightSpinBox);
   this.rowsSizer.addStretch();

   // Overlap
/*   this.OverlapControl = new LabelEditLabel(
      this,
      "Overlap:",
      format("%g", engine.overlap * 100),
      "<p>Percentage of overlapping between tiles.</p>",
      "%", labelWidth1, editWidth,
      function (value)
      {
         engine.overlap = parseFloat(value) / 100;
         this.dialog.UpdateMosaic();
      }, this);*/
   this.OverlapControl = new NumericControl(this);
   this.OverlapControl.real = false;
   this.OverlapControl.label.text = "Overlap:";
   this.OverlapControl.label.minWidth = labelWidth1;
   this.OverlapControl.setRange(0, 50);
   this.OverlapControl.slider.setRange(0, 50);
   this.OverlapControl.slider.scaledMinWidth = 50;
   //this.OverlapControl.setPrecision(1);
   this.OverlapControl.edit.minWidth = editWidth;
   this.OverlapControl.setValue(engine.overlap * 100);
   this.OverlapControl.toolTip = "<p>Percentage of overlapping between tiles.</p>";
   this.OverlapControl.onValueUpdated = function (value)
   {
      engine.overlap = parseFloat(value) / 100;
      this.dialog.UpdateMosaic();
   };

   // Rotation
   this.RotationControl = new NumericControl(this);
   this.RotationControl.real = true;
   this.RotationControl.label.text = "Rotation:";
   this.RotationControl.label.minWidth = labelWidth1;
   this.RotationControl.setRange(0, 360);
   this.RotationControl.slider.setRange(0, 720);
   //this.RotationControl.slider.scaledMinWidth = 250;
   this.RotationControl.setPrecision(1);
   this.RotationControl.precisionForValue = function (prec, val)
   {
      return prec;
   };
   this.RotationControl.edit.minWidth = editWidth;
   this.RotationControl.setValue(engine.rotation);
   this.RotationControl.toolTip = "<p>Camera rotation.</p>";
   this.RotationControl.onValueUpdated = function (value)
   {
      engine.rotation = parseFloat(value);
      engine.InvalidateCustomRotation();
      this.dialog.UpdateMosaic();
   };


   // Adjust Rotation
   this.fixedRot_RadioButton = new RadioButton(this);
   this.fixedRot_RadioButton.text = "Fixed tile rotation";
   this.fixedRot_RadioButton.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.fixedRot_RadioButton.setMinWidth(labelWidth1);
   this.fixedRot_RadioButton.checked = engine.adjustRotation != true;
   this.fixedRot_RadioButton.toolTip = "<p>All the tiles have the same rotation.</p>";
   this.fixedRot_RadioButton.onCheck = function (value)
   {
      engine.adjustRotation = false;
      engine.InvalidateCustomRotation();
      this.dialog.UpdateMosaic();
   };
   this.adjustRot_RadioButton = new RadioButton(this);
   this.adjustRot_RadioButton.text = "Adjust tile rotation";
   this.adjustRot_RadioButton.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.adjustRot_RadioButton.setMinWidth(labelWidth1);
   this.adjustRot_RadioButton.checked = engine.adjustRotation == true;
   this.adjustRot_RadioButton.toolTip = "<p>The rotation of the tiles is adjusted in order that the " +
      "tiles have the same orientation respect the reference tile.</p>" +
      "<p>This option is usually required for short focal length mosaics (&lt;300mm).</p>";
   this.adjustRot_RadioButton.onCheck = function (value)
   {
      engine.adjustRotation = true;
      engine.InvalidateCustomRotation();
      this.dialog.UpdateMosaic();
   };

   this.adjustRotSizer = new HorizontalSizer();
   this.adjustRotSizer.scaledSpacing = 4;
   this.adjustRotSizer.add(this.fixedRot_RadioButton);
   this.adjustRotSizer.add(this.adjustRot_RadioButton);

   // Dimensions groupbox
   this.dimensionsGroup = new GroupBox(this);
   this.dimensionsGroup.title = "Dimensions";
   this.dimensionsGroup.sizer = new VerticalSizer;
   this.dimensionsGroup.sizer.scaledMargin = 6;
   this.dimensionsGroup.sizer.scaledSpacing = 4;
   this.dimensionsGroup.sizer.add(this.colsSizer);
   this.dimensionsGroup.sizer.add(this.rowsSizer);
   this.dimensionsGroup.sizer.add(this.OverlapControl);
   this.dimensionsGroup.sizer.add(this.RotationControl);
   this.dimensionsGroup.sizer.add(this.adjustRotSizer);

   // Mosaic Definition Section
   this.mosaic_Section = new SectionBar(this, "Mosaic definition");
   this.mosaic_Control = new Control(this);
   this.mosaic_Control.sizer = new VerticalSizer;
   this.mosaic_Control.sizer.scaledMargin = 6;
   this.mosaic_Control.sizer.scaledSpacing = 4;
   this.mosaic_Section.setSection(this.mosaic_Control);
   //this.mosaic_Control.show();
   this.mosaic_Control.sizer.add(this.originGroup);
   this.mosaic_Control.sizer.add(this.dimensionsGroup);
   this.mosaic_Section.toggleSection = function ()
   {
      if (this.section.visible)
         this.section.hide();
      else
      {
         this.section.adjustToContents();
         this.section.show();
      }
   };

   // Tiles
   this.tiles_List = new TreeBox(this);
   this.tiles_List.rootDecoration = false;
   this.tiles_List.alternateRowColor = true;
   this.tiles_List.multipleSelection = true;
   this.tiles_List.headerVisible = true;
   this.tiles_List.numberOfColumns = 3;
   this.tiles_List.setHeaderText(0, "#");
   this.tiles_List.setHeaderText(1, "Coordinates");
   this.tiles_List.setHeaderText(2, "Rotation");
   this.tiles_List.toolTip = "<p>List of tiles that compose the mosaic.</p>";
   this.tiles_List.setScaledMinWidth(300);
   this.tiles_List.onNodeSelectionUpdated = function ()
   {
      this.dialog.previewControl.forceRedraw();
   }

   this.fillTileList = function ()
   {
      var selectedTiles = [];

      this.tiles_List.selectedNodes.forEach(function (node)
      {
         selectedTiles.push(this.tiles_List.childIndex(node));
      }, this);

      this.tiles_List.clear();
      if (engine.tiles)
      {
         for (var i = 0; i < engine.tiles.length; i++)
         {
            var center = engine.tiles[i].center;
            var coords = "RA:" + DMSangle.FromAngle(center.x * 24 / 360).ToString(true) +
               "  Dec:" + DMSangle.FromAngle(center.y).ToString();

            var node = new TreeBoxNode(this.tiles_List);
            node.setText(0, format("%d", i + 1));
            node.setText(1, coords);
            node.setText(2, format("%g", engine.tiles[i].GetRotation()));
            node.selected = selectedTiles.indexOf(i) >= 0;
         }
         this.tiles_List.adjustColumnWidthToContents(0);
         this.tiles_List.adjustColumnWidthToContents(1);
         this.tiles_List.adjustColumnWidthToContents(2);
      }
   };
   this.fillTileList();

   // Tile rotation CW
   this.tile_CW = new ToolButton(this);
   this.tile_CW.toolTip = "Rotate the selected tiles clockwise";
   this.tile_CW.icon = this.scaledResource(":/icons/picture-rotate-right.png");
   this.tile_CW.setScaledFixedSize(24, 24);
   this.tile_CW.onClick = function ()
   {
      var tilesList = this.dialog.tiles_List;
      tilesList.selectedNodes.forEach(function (node)
      {
         var tileIdx = tilesList.childIndex(node);
         var tileCustomRot = engine.GetCustomTileRotation(tileIdx);
         tileCustomRot -= 90;
         while (tileCustomRot < 0) tileCustomRot += 360;
         engine.SetCustomTileRotation(tileIdx, tileCustomRot);
         engine.tiles[tileIdx].customRotation = tileCustomRot;
         engine.tiles[tileIdx].UpdateGeometry(engine.cameraGeometry, engine.metadata);
      });
      this.dialog.previewControl.forceRedraw();
      this.dialog.fillTileList();
   };

   this.tile_CCW = new ToolButton(this);
   this.tile_CCW.toolTip = "Rotate the selected tiles counter-clockwise";
   this.tile_CCW.icon = this.scaledResource(":/icons/picture-rotate-left.png");
   this.tile_CCW.setScaledFixedSize(24, 24);
   this.tile_CCW.onClick = function ()
   {
      var tilesList = this.dialog.tiles_List;
      tilesList.selectedNodes.forEach(function (node)
      {
         var tileIdx = tilesList.childIndex(node);
         var tileCustomRot = engine.GetCustomTileRotation(tileIdx);
         tileCustomRot += 90;
         while (tileCustomRot >= 360) tileCustomRot -= 360;
         engine.SetCustomTileRotation(tileIdx, tileCustomRot);
         engine.tiles[tileIdx].customRotation = tileCustomRot;
         engine.tiles[tileIdx].UpdateGeometry(engine.cameraGeometry, engine.metadata);
      });
      this.dialog.previewControl.forceRedraw();
      this.dialog.fillTileList();
   };

   // Tiles buttons
   this.tilesButtonsSizer = new HorizontalSizer;
   this.tilesButtonsSizer.scaledSpacing = 4;
   this.tilesButtonsSizer.addStretch();
   this.tilesButtonsSizer.add(this.tile_CW);
   this.tilesButtonsSizer.add(this.tile_CCW);
   this.tilesButtonsSizer.addStretch();

   // Tiles section
   this.tiles_Section = new SectionBar(this, "Tiles");
   this.tiles_Control = new Control(this);
   this.tiles_Control.sizer = new VerticalSizer;
   this.tiles_Control.sizer.scaledMargin = 6;
   this.tiles_Control.sizer.scaledSpacing = 4;
   this.tiles_Section.setSection(this.tiles_Control);
   //this.tiles_Control.show();
   this.tiles_Control.sizer.add(this.tiles_List);
   this.tiles_Control.sizer.add(this.tilesButtonsSizer);
   this.tiles_Section.toggleSection = function ()
   {
      if (this.section.visible)
         this.section.hide();
      else
      {
         this.section.adjustToContents();
         this.section.show();
      }
   };


   // Local Catalog
   this.dbPath_RadioButton = new RadioButton(this);
   this.dbPath_RadioButton.text = "Local catalog:";
   this.dbPath_RadioButton.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.dbPath_RadioButton.setMinWidth(labelWidth1);
   this.dbPath_RadioButton.checked = engine.catalogMode == 0;
   this.dbPath_RadioButton.toolTip = "Use an locally stored star catalog";
   this.dbPath_RadioButton.onCheck = function (value)
   {
      this.dialog.dbPath_Edit.enabled = value;
      this.dialog.dbPath_Button.enabled = value;
      engine.catalogMode = 0;
      if (value)
      {
         engine.LoadCatalog();
         this.dialog.previewControl.forceRedraw();
      }
   }

   this.dbPath_Edit = new Edit(this);
   if (engine.databasePath)
      this.dbPath_Edit.text = engine.databasePath;
   this.dbPath_Edit.setScaledMinWidth(150);
   this.dbPath_Edit.enabled = engine.catalogMode == 0;
   this.dbPath_Edit.toolTip = "<p>Path to a star database file in StarGenerator or text formats.</p>" +
      "<p>The text files can be downloaded from an online server using the download button.</p>" +
      "<p>The StarGenerator database file can be downloaded from: http://pixinsight.com/download/</p>";
   this.dbPath_Edit.onTextUpdated = function (value)
   {
      engine.databasePath = value;
      engine.LoadCatalog();
      this.dialog.previewControl.forceRedraw();
   };

   this.dbPath_Button = new ToolButton(this);
   this.dbPath_Button.icon = this.scaledResource(":/icons/select-file.png");
   this.dbPath_Button.setScaledFixedSize(20, 20);
   this.dbPath_Button.toolTip = "<p>Select a catalog file.</p>";
   this.dbPath_Button.enabled = engine.catalogMode == 0;
   this.dbPath_Button.onClick = function ()
   {
      var gdd = new OpenFileDialog;
      gdd.initialPath = this.dialog.dbPath_Edit.text;
      gdd.caption = "Select Star Database Path";
      gdd.filters = [["All supported catalog files", "*.bin,*.txt"],
         ["Star database files", "*.bin"],
         ["Custom catalog files", "*.txt"]
      ];
      if (gdd.execute())
      {
         engine.databasePath = gdd.fileName;
         this.dialog.dbPath_Edit.text = gdd.fileName;
         engine.LoadCatalog();
         this.dialog.previewControl.forceRedraw();
      }
   };

   this.download_Button = new ToolButton(this);
   this.download_Button.icon = this.scaledResource(":/icons/download.png");
   this.download_Button.setScaledFixedSize(20, 20);
   this.download_Button.toolTip = "<p>Download from an online catalog.</p>";
   this.download_Button.onClick = function ()
   {
      var mosaicMetadata = engine.metadata ? engine.metadata.Clone() : new ImageMetadata();
      mosaicMetadata.ra = engine.originRA;
      mosaicMetadata.dec = engine.originDec;
      var dlg = new CatalogDownloaderDialog(mosaicMetadata, engine.vizierServer);
      if (dlg.execute())
      {
         this.dialog.dbPath_Edit.text = dlg.path;
         engine.databasePath = dlg.path;
         engine.LoadCatalog();
         this.dialog.previewControl.forceRedraw();
      }
   };


   this.dbPath_Sizer = new HorizontalSizer;
   this.dbPath_Sizer.spacing = 4;
   this.dbPath_Sizer.add(this.dbPath_RadioButton);
   this.dbPath_Sizer.add(this.dbPath_Edit, 100);
   this.dbPath_Sizer.add(this.dbPath_Button);
   this.dbPath_Sizer.add(this.download_Button);

   // VizieR Catalog
   this.vizier_RadioButton = new RadioButton(this);
   this.vizier_RadioButton.text = "Online catalog:";
   this.vizier_RadioButton.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.vizier_RadioButton.checked = engine.catalogMode == 1;
   this.vizier_RadioButton.toolTip = "Use an online VizieR catalog server";
   this.vizier_RadioButton.onCheck = function (value)
   {
      //this.dialog.mirror_Combo.enabled = value;
      this.dialog.catalog_Combo.enabled = value;
      this.dialog.magnitudeFilter_Combo.enabled = value;
      this.dialog.server_Button.enabled = value;
      engine.catalogMode = 1;
      if (value)
      {
         engine.LoadCatalog();
         this.dialog.previewControl.forceRedraw();
      }
   }

   // Stars
   var FillFilterCombo = function (combo, catalog, filter)
   {
      combo.clear();
      for (var f = 0; f < catalog.filters.length; f++)
      {
         combo.addItem(catalog.filters[f]);
         if (catalog.filters[f] == filter)
            combo.currentItem = combo.numberOfItems - 1;
      }
   }

   //
   this.magnitudeFilter_Combo = new ComboBox(this);
   this.magnitudeFilter_Combo.enabled = engine.catalogMode == 1;
   this.magnitudeFilter_Combo.editEnabled = false;
   this.magnitudeFilter_Combo.toolTip = "<p>Filter used in the magnitude test.</p>";
   this.magnitudeFilter_Combo.minWidth = this.font.width("r1magMMM");
   this.magnitudeFilter_Combo.onItemSelected = function ()
   {
      engine.catalog.magnitudeFilter = this.itemText(this.currentItem);
      engine.LoadCatalog();
      this.dialog.previewControl.forceRedraw();
   };

   this.catalog_Combo = new ComboBox(this);
   this.catalog_Combo.enabled = engine.catalogMode == 1;
   this.catalog_Combo.editEnabled = false;
   this.catalog_Combo.setFixedWidth(this.font.width("PPMXLMMMMM"));
   var toolTip = "<p>Available catalogs:</p><ul>";
   for (var i = 0; i < engine.availableCatalogs.length; i++)
   {
      this.catalog_Combo.addItem(engine.availableCatalogs[i].name);
      if (engine.availableCatalogs[i].name == engine.catalog.name)
         this.catalog_Combo.currentItem = i;
      toolTip += "<li>" + engine.availableCatalogs[i].description + "</li>";
   }
   toolTip += "</ul>";
   this.catalog_Combo.toolTip = toolTip;
   this.catalog_Combo.filterCombo = this.magnitudeFilter_Combo;
   this.catalog_Combo.onItemSelected = function ()
   {
      //engine.catalog = engine.availableCatalogs[this.dialog.catalog_Combo.currentItem].name;
      var catalogName = this.itemText(this.currentItem)
      engine.catalog = __catalogRegister__.GetCatalog(catalogName);
      FillFilterCombo(this.filterCombo, engine.catalog, engine.catalog.magnitudeFilter);
      engine.LoadCatalog();
      this.dialog.previewControl.forceRedraw();
   }

   FillFilterCombo(this.magnitudeFilter_Combo, engine.catalog, engine.catalog.magnitudeFilter);


   this.server_Button = new ToolButton(this);
   this.server_Button.icon = this.scaledResource(":/icons/network-database.png");
   this.server_Button.setScaledFixedSize(20, 20);
   this.server_Button.toolTip = "<p>Select the best VizieR server for your location</p>";
   this.server_Button.enabled = engine.catalogMode == 1;
   this.server_Button.onClick = function ()
   {
      var dlg = new VizierMirrorDialog(engine.vizierServer);
      if (dlg.execute())
         engine.vizierServer = dlg.server;
   };

   this.vizierSizer = new HorizontalSizer;
   this.vizierSizer.spacing = 4;
   this.vizierSizer.add(this.vizier_RadioButton);
   this.vizierSizer.add(this.catalog_Combo);
   this.vizierSizer.add(this.magnitudeFilter_Combo);
   this.vizierSizer.add(this.server_Button);
   this.vizierSizer.addStretch();

   // maxMagnitude
   this.maxMag_Control = new NumericControl(this);
   this.maxMag_Control.real = true;
   this.maxMag_Control.label.text = "Max magnitude:";
   this.maxMag_Control.label.minWidth = labelWidth1;
   this.maxMag_Control.setRange(2, 12);
   this.maxMag_Control.slider.setRange(0, 100);
   this.maxMag_Control.slider.scaledMinWidth = 100;
   this.maxMag_Control.setPrecision(2);
   this.maxMag_Control.edit.minWidth = editWidth;
   this.maxMag_Control.setValue(engine.maxMagnitude);
   this.maxMag_Control.toolTip =
      "<p>This value is used for limiting the maximum magnitude of the stars extracted from the catalog.</p>";
   this.maxMag_Control.onValueUpdated = function (value)
   {
      engine.maxMagnitude = value;
      if (engine.catalogStars != null && engine.catalogStars.magnitude < engine.maxMagnitude)
      {
         if (this.catalogTimer)
         {
            this.catalogTimer.stop();
         }
         else
         {
            this.catalogTimer = new Timer(2, false);
            var dlg = this.dialog;
            this.catalogTimer.onTimeout = function ()
            {
               dlg.catalogTimer = null;
               engine.LoadCatalog();
               dlg.previewControl.forceRedraw();
            };
         }
         this.catalogTimer.start();
      }
      else
         this.dialog.previewControl.forceRedraw();
   };
   this.catalogTimer = null;

   // Guide stars section
   this.guideStars_Control = new Control(this);
   this.guideStars_Control.enabled = engine.showGuideStars == true;
   this.guideStars_Control.sizer = new VerticalSizer;
   this.guideStars_Control.sizer.scaledMargin = 6;
   this.guideStars_Control.sizer.scaledSpacing = 4;
   this.guideStars_Control.hide();
   this.guideStars_Control.sizer.add(this.dbPath_Sizer);
   this.guideStars_Control.sizer.add(this.vizierSizer);
   this.guideStars_Control.sizer.add(this.maxMag_Control);
   this.guide_Section = new SectionBar(this, "Guide stars");
   this.guide_Section.setSection(this.guideStars_Control);
   this.guide_Section.enableCheckBox(true);
   this.guide_Section.checkBox.checked = engine.showGuideStars == true;
   this.guide_Section.toggleSection = function ()
   {
      if (this.section.visible)
         this.section.hide();
      else
      {
         this.section.adjustToContents();
         this.section.show();
      }
   };
   this.guide_Section.onCheckSection = function (sectionbar)
   {
      engine.showGuideStars = sectionbar.checkBox.checked;
      engine.LoadCatalog();
      this.dialog.guideGraphics.enabled = engine.showGuideStars;
      this.dialog.previewControl.forceRedraw();
   };


   // Tile Font
   this.tileText_CheckBox = new CheckBox(this);
   this.tileText_CheckBox.checked = engine.showTileCoords;
   this.tileText_CheckBox.text = "Coordinates:";
   this.tileText_CheckBox.minWidth = labelWidth1;
   this.tileText_CheckBox.toolTip = "<p>If checked it draws on the image the coordinates of the center of the tiles.</p>"
   this.tileText_CheckBox.onCheck = function (checked)
   {
      engine.showTileCoords = checked;
      this.dialog.tile_FontControl.enabled = checked;
      this.dialog.previewControl.forceRedraw();
   };

   this.tile_FontControl = new FontControl(this, this, engine.tileFont);
   this.tile_FontControl.enabled = engine.showTileCoords;
   this.tile_FontControl.onChanged = function (fontDef)
   {
      engine.tileFont = fontDef;
      this.dialog.previewControl.forceRedraw();
   };

   this.tileFont_Sizer = new HorizontalSizer;
   this.tileFont_Sizer.scaledSpacing = 4;
   this.tileFont_Sizer.add(this.tileText_CheckBox);
   this.tileFont_Sizer.add(this.tile_FontControl);
   this.tileFont_Sizer.addStretch();

   // Color
   this.tileColor_Label = new Label(this);
   this.tileColor_Label.text = "Color:";
   this.tileColor_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.tileColor_Label.minWidth = labelWidth1;

   this.tile_ColorControl = new TransparentColorControl(this, engine.tileColor, "Tile color");
   this.tile_ColorControl.onColorChanged = function (color)
   {
      engine.tileColor = color;
      this.dialog.previewControl.forceRedraw();
   };

   this.tileColor_Sizer = new HorizontalSizer;
   this.tileColor_Sizer.scaledSpacing = 4;
   this.tileColor_Sizer.add(this.tileColor_Label);
   this.tileColor_Sizer.add(this.tile_ColorControl);
   this.tileColor_Sizer.addStretch();

   // Line width
   this.tileLine_Label = new Label(this);
   this.tileLine_Label.text = "Line width:";
   this.tileLine_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.tileLine_Label.minWidth = labelWidth1;

   this.tileLine_SpinBox = new SpinBox(this);
   this.tileLine_SpinBox.minValue = 0;
   this.tileLine_SpinBox.maxValue = 20;
   this.tileLine_SpinBox.setFixedWidth(editWidth2);
   this.tileLine_SpinBox.value = engine.tileLineWidth;
   this.tileLine_SpinBox.toolTip = "<p>Width of the lines of the tiles</p>";
   this.tileLine_SpinBox.onValueUpdated = function (value)
   {
      engine.tileLineWidth = value;
      this.dialog.previewControl.forceRedraw();
   };

   this.tileLine_Sizer = new HorizontalSizer;
   this.tileLine_Sizer.scaledSpacing = 4;
   this.tileLine_Sizer.add(this.tileLine_Label);
   this.tileLine_Sizer.add(this.tileLine_SpinBox);
   this.tileLine_Sizer.addStretch();

   this.tileGraphics = new GroupBox(this);
   this.tileGraphics.title = "Tiles";
   this.tileGraphics.sizer = new VerticalSizer;
   this.tileGraphics.sizer.scaledMargin = 6;
   this.tileGraphics.sizer.scaledSpacing = 4;
   this.tileGraphics.sizer.add(this.tileFont_Sizer);
   this.tileGraphics.sizer.add(this.tileColor_Sizer);
   this.tileGraphics.sizer.add(this.tileLine_Sizer);

   // Tile Font
   this.guideFont_Label = new Label(this);
   this.guideFont_Label.text = "Font:";
   this.guideFont_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.guideFont_Label.minWidth = labelWidth1;

   this.guide_FontControl = new FontControl(this, this, engine.guideFont);
   this.guide_FontControl.onChanged = function (fontDef)
   {
      engine.guideFont = fontDef;
      this.dialog.previewControl.forceRedraw();
   };

   this.guideFont_Sizer = new HorizontalSizer;
   this.guideFont_Sizer.scaledSpacing = 4;
   this.guideFont_Sizer.add(this.guideFont_Label);
   this.guideFont_Sizer.add(this.guide_FontControl);
   this.guideFont_Sizer.addStretch();

   // Color
   this.guideColor_Label = new Label(this);
   this.guideColor_Label.text = "Color:";
   this.guideColor_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.guideColor_Label.minWidth = labelWidth1;

   this.guide_ColorControl = new TransparentColorControl(this, engine.guideColor, "Tile color");
   this.guide_ColorControl.onColorChanged = function (color)
   {
      engine.guideColor = color;
      this.dialog.previewControl.forceRedraw();
   };

   this.guideColor_Sizer = new HorizontalSizer;
   this.guideColor_Sizer.scaledSpacing = 4;
   this.guideColor_Sizer.add(this.guideColor_Label);
   this.guideColor_Sizer.add(this.guide_ColorControl);
   this.guideColor_Sizer.addStretch();

   this.guideGraphics = new GroupBox(this);
   this.guideGraphics.title = "Guide stars";
   this.guideGraphics.sizer = new VerticalSizer;
   this.guideGraphics.sizer.scaledMargin = 6;
   this.guideGraphics.sizer.scaledSpacing = 4;
   this.guideGraphics.sizer.add(this.guideFont_Sizer);
   this.guideGraphics.sizer.add(this.guideColor_Sizer);
   this.guideGraphics.enabled = engine.showGuideStars

   // GraphicProps section
   this.graphicProps_Control = new Control(this);
   this.graphicProps_Control.sizer = new VerticalSizer;
   this.graphicProps_Control.sizer.scaledMargin = 6;
   this.graphicProps_Control.sizer.scaledSpacing = 4;
   this.graphicProps_Control.hide();
   this.graphicProps_Control.sizer.add(this.tileGraphics);
   this.graphicProps_Control.sizer.add(this.guideGraphics);
   this.graphicProps_Section = new SectionBar(this, "Graphic properties");
   this.graphicProps_Section.setSection(this.graphicProps_Control);
   this.graphicProps_Section.toggleSection = function ()
   {
      if (this.section.visible)
         this.section.hide();
      else
      {
         this.section.adjustToContents();
         this.section.show();
      }
   };


   this.config_Frame = new Control(this);
   //this.config_Frame.setFixedWidth(320);
   //   this.config_Frame.setScaledFixedHeight(200);
   //this.config_Frame.setScaledMinSize(200, 200);

   this.config_Frame.sizer = new VerticalSizer;
   this.config_Frame.sizer.scaledMargin = 6;
   this.config_Frame.sizer.scaledSpacing = 4;
   this.config_Frame.sizer.add(this.geometry_Section);
   this.config_Frame.sizer.add(this.geometry_Control);
   this.config_Frame.sizer.add(this.mosaic_Section);
   this.config_Frame.sizer.add(this.mosaic_Control);
   this.config_Frame.sizer.add(this.tiles_Section);
   this.config_Frame.sizer.add(this.tiles_Control);
   this.config_Frame.sizer.add(this.guide_Section);
   this.config_Frame.sizer.add(this.guideStars_Control);
   this.config_Frame.sizer.add(this.graphicProps_Section);
   this.config_Frame.sizer.add(this.graphicProps_Control);
   this.config_Frame.sizer.addStretch();


   // Buttons
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
   this.reset_Button.toolTip = "<p>Resets the settings to the default values.</p>";
   this.reset_Button.onClick = function ()
   {
      var msg = new MessageBox("Do you really want to reset the settings to their default value?",
         TITLE, StdIcon_Warning, StdButton_Yes, StdButton_No);
      if (msg.execute() == StdButton_Yes)
      {
         this.dialog.engine.ResetSettings();
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
      Dialog.browseScriptDocumentation("MosaicPlanner");
   };

   this.ok_Button = new PushButton(this);
   this.ok_Button.defaultButton = true;
   this.ok_Button.text = "Generate";
   this.ok_Button.icon = this.scaledResource(":/icons/ok.png");
   this.ok_Button.onClick = function ()
   {
      this.dialog.ok();
   };

   this.cancel_Button = new PushButton(this);
   this.cancel_Button.defaultButton = true;
   this.cancel_Button.text = "Close";
   this.cancel_Button.icon = this.scaledResource(":/icons/close.png");
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

   // Content sizer
   this.content_sizer = new HorizontalSizer;
   this.content_sizer.add(this.previewControl, 100);
   this.content_sizer.add(this.config_Frame);

   // Global sizer
   this.sizer = new VerticalSizer;
   this.sizer.scaledMargin = 8;
   this.sizer.scaledSpacing = 6;
   this.sizer.add(this.content_sizer);
   this.sizer.addSpacing(2);
   this.sizer.add(this.buttons_Sizer);

   this.windowTitle = TITLE + " v" + VERSION;

   this.resize(900, 800);
   //this.adjustToContents();

   this.config_Frame.adjustToContents();
}

MosaicDialog.prototype = new Dialog;

MosaicDialog.prototype.GetWindowBmp = function (window)
{
   var imageOrg = window.mainView.image;
   var tmpW = null;
   try
   {
      tmpW = new ImageWindow(imageOrg.width, imageOrg.height, imageOrg.numberOfChannels,
         window.bitsPerSample, window.isFloatSample, imageOrg.isColor, "Aux");
      tmpW.mainView.beginProcess(UndoFlag_NoSwapFile);
      tmpW.mainView.image.apply(imageOrg);
      ApplySTF(tmpW.mainView, window.mainView.stf);
      tmpW.mainView.endProcess();
      var bmp = new Bitmap(imageOrg.width, imageOrg.height);
      bmp.assign(tmpW.mainView.image.render());
      return bmp;
   } finally
   {
      tmpW.forceClose();
   }
};

// ******************************************************************
// MosaicPlannerEngine: Implementation of the mosaic planner
// ******************************************************************
function MosaicPlannerEngine()
{
   this.__base__ = ObjectWithSettings;
   this.__base__(
      SETTINGS_MODULE,
      "engine",
      [
         ["cameraGeometry", Ext_DataType_Complex],
         ["originRA", DataType_Double ],
         ["originDec", DataType_Double ],
         ["colsLeft", DataType_Int32 ],
         ["colsRight", DataType_Int32 ],
         ["rowsTop", DataType_Int32 ],
         ["rowsBottom", DataType_Int32 ],
         ["rotation", DataType_Double ],
         ["overlap", DataType_Double ],
         ["showMain", DataType_Boolean ],
         ["showGuideStars", DataType_Boolean ],
         ["adjustRotation", DataType_Boolean ],
         ["catalogMode", DataType_UInt8],
         ["databasePath", DataType_UCString],
         ["vizierServer", DataType_UCString],
         ["maxMagnitude", DataType_Double],
         ["customTileRot", Ext_DataType_JSON],
         ["tileColor", DataType_UInt32 ],
         ["tileLineWidth", DataType_Int32 ],
         ["showTileCoords", DataType_Boolean ],
         ["tileFont", Ext_DataType_JSON],
         ["guideColor", DataType_UInt32 ],
         ["guideFont", Ext_DataType_JSON]
      ]
   );

   this.cameraGeometry = new CameraGeometry(1368,
      {
         active:    true,
         pixelSize: 7.3975, // um
         width:     2048, // pixels
         height:    2048 // pixels
      },
      {
         active:  true,
         offsetX: 16.65, // mm
         offsetY: -0.5, // mm
         width:   6.4, // mm
         height:  4.75 // mm
      });

   this.originRA = 0;
   this.originDec = 0;
   this.colsLeft = 1;
   this.colsRight = 1;
   this.rowsTop = 1;
   this.rowsBottom = 1;
   this.rotation = 0;
   this.overlap = 0.15;
   this.showMain = true;
   this.customTileRot = null;
   this.adjustRotation = false;

   this.showGuideStars = false;
   this.vizierServer = "http://cdsarc.u-strasbg.fr/";
   this.catalog = new GSCCatalog();
   this.catalog.magnitudeFilter = "Vmag";
   this.catalogMode = 1;
   this.maxMagnitude = 7;
   this.catalogStars = null;
   this.tileColor = 0xff80ffff;
   this.tileLineWidth = 2;
   this.showTileCoords = false;
   this.tileFont = {face: 1, size: 10, bold: false, italic: false};
   this.guideColor = 0xC0FFFF00;
   this.guideFont = {face: 1, size: 8, bold: false, italic: false};

   this.availableCatalogs = [new PPMXLCatalog(), new GSCCatalog(), new TychoCatalog(), new HR_Catalog()];

   this.cameraGeometry.UpdateGeometry();

   // Select image and get metadata
   this.Init = function (imageWindow, load)
   {
      if (!imageWindow || !imageWindow.isWindow)
         throw Error("The script requires an image");

      if (load)
      {
         this.LoadSettings();
         this.LoadParameters();
      }
      this.cameraGeometry.UpdateGeometry();

      this.imageWindow = imageWindow;
      this.metadata = new ImageMetadata();
      this.metadata.ExtractMetadata(imageWindow);

      if (this.metadata.ref_I_G == null)
         throw Error("The image has not WCS coordinates");

      if (this.metadata.width * this.metadata.height * 4 >= 2 * 1024 * 1024 * 1024)
         throw Error("The script can not work with images bigger than 536,870,912 pixels");

      if (this.showGuideStars)
         this.LoadCatalog();
   };

   this._base_LoadSettings = this.LoadSettings;
   this.LoadSettings = function ()
   {
      var catalogName = Settings.read(this.MakeSettingsKey("catalogName"), DataType_UCString);
      if (Settings.lastReadOK && catalogName)
      {
         var catalog = __catalogRegister__.FindByName(catalogName);
         if (catalog)
            this.catalog = eval(catalog.constructor);
      }

      this._base_LoadSettings();

      return true;
   }

   this._base_SaveSettings = this.SaveSettings;
   this.SaveSettings = function ()
   {
      Settings.write(this.MakeSettingsKey("catalogName"), DataType_UCString, this.catalog.name);
      this._base_SaveSettings();
   }

   this.ResetSettings = function ()
   {
      Settings.remove(SETTINGS_MODULE);
   };

   this.InvalidateCustomRotation = function ()
   {
      this.customTileRot = null;
   };

   this.SetCustomTileRotation = function (idx, rotation)
   {
      if (this.customTileRot == null)
         this.customTileRot = new Array((this.colsRight + this.colsLeft + 1) * (this.rowsBottom + this.rowsBottom + 1));
      this.customTileRot[idx] = rotation;
   };

   this.GetCustomTileRotation = function (idx)
   {
      if (this.customTileRot == null || this.customTileRot[idx] === undefined || this.customTileRot[idx] === null)
         return 0;
      else
         return this.customTileRot[idx];
   };

   this.MoveOrigin = function (deltaX, deltaY)
   {
      var pRD0 = new Point(this.originRA, this.originDec);
      var pI = this.metadata.Convert_RD_I(pRD0);
      pI.moveBy(deltaX, deltaY);
      var pRD1 = this.metadata.Convert_I_RD(pI);
      this.originRA = pRD1.x;
      this.originDec = pRD1.y;
   };

   var Azimuth = function (p1, p2)
   {
      var L = p2.x - p1.x;
      return DMath.atan2(
         DMath.sin(L),
         DMath.cos(p1.y) * DMath.tan(p2.y) - DMath.sin(p1.y) * DMath.cos(L)
      );
   };

   var GridDeclination = function (pRD, metadata)
   {
      var pI = metadata.Convert_RD_I(pRD);
      if (pI == null)
         return null;
      var offsetI = new Point(pI.x, pI.y - 0.1);
      var offsetRD = metadata.Convert_I_RD(offsetI);
      if (offsetRD == null)
         return null;
      return Azimuth(pRD, offsetRD);
   }

   this.GenerateMosaic = function ()
   {
      this.tiles = [];

      var p0RD = new Point(this.originRA, this.originDec);
      var tileOrg = new TileGeometry({
         center:   new Point(this.originRA, this.originDec),
         rotation: this.rotation
      });
      tileOrg.UpdateGeometry(this.cameraGeometry, this.metadata);

      var grd0 = GridDeclination(p0RD, this.metadata);

      var p1RD = tileOrg.metadata.Convert_I_RD(new Point(this.cameraGeometry.mainSensor.width, this.cameraGeometry.mainSensor.height / 2));
      var p2RD = tileOrg.metadata.Convert_I_RD(new Point(this.cameraGeometry.mainSensor.width / 2, this.cameraGeometry.mainSensor.height));

      var p0I = this.metadata.Convert_RD_I(p0RD);
      var p1I = this.metadata.Convert_RD_I(p1RD);
      var p2I = this.metadata.Convert_RD_I(p2RD);
      if (p0I == null || p1I == null || p2I == null)
         return;
      var d1x = (p1I.x - p0I.x) * 2 * (1 - this.overlap);
      var d1y = (p1I.y - p0I.y) * 2 * (1 - this.overlap);
      var d2x = (p2I.x - p0I.x) * 2 * (1 - this.overlap);
      var d2y = (p2I.y - p0I.y) * 2 * (1 - this.overlap);

      for (var row = -this.rowsTop; row <= this.rowsBottom; row++)
      {
         for (var col = -this.colsLeft; col <= this.colsRight; col++)
         {
            var tileOrgI = new Point(p0I.x + d1x * col + d2x * row, p0I.y + d1y * col + d2y * row);
            var tileOrgRD = this.metadata.Convert_I_RD(tileOrgI);
            if (tileOrgRD == null)
               continue;

            var rotation = this.rotation;
            if (this.customTileRot && this.customTileRot.length >= this.tiles.length && this.customTileRot[this.tiles.length] != null)
               rotation += this.customTileRot[this.tiles.length];

            if (this.adjustRotation)
            {
               var grd = GridDeclination(tileOrgRD, this.metadata);
               var angleCorrection = grd - grd0;
               rotation += angleCorrection;
            }

            var newTile = new TileGeometry({
               center:   tileOrgRD,
               rotation: rotation
            });
            newTile.UpdateGeometry(this.cameraGeometry, this.metadata);
            this.tiles.push(newTile);
         }
      }
   };

   this.PaintTiles = function (graphics)
   {
      if (this.tiles)
      {
         var tilePen = new Pen(this.tileColor, this.tileLineWidth);
         graphics.pen = tilePen;
         if(this.showTileCoords){
            var font = new Font( this.tileFont.face, this.tileFont.size );
            font.bold = this.tileFont.bold;
            font.italic = this.tileFont.italic;
            graphics.font = font;
         }

         this.tiles.forEach(function (tile)
         {
            if (this.showMain)
            {
               tile.polylinesMain.forEach(function (polyline)
                  {
                     graphics.drawPolyline(polyline);
                  }
               );

               if (this.showTileCoords)
               {
                  var coords1 = DMSangle.FromAngle(tile.center.x * 24 / 360).ToString(true);
                  var coords2 = DMSangle.FromAngle(tile.center.y).ToString();
                  var bounds = graphics.font.tightBoundingRect(coords1);
                  graphics.drawText(tile.centerI.x - bounds.width / 2, tile.centerI.y, coords1);
                  graphics.drawText(tile.centerI.x - bounds.width / 2, tile.centerI.y + bounds.height, coords2);
               }
            }
            tile.polylinesGuider.forEach(function (polyline)
               {
                  graphics.drawPolyline(polyline);
               }
            );
         }, this);
      }
   };

   this.Render = function ()
   {
      var width = this.imageWindow.mainView.image.width;
      var height = this.imageWindow.mainView.image.height;

      console.writeln("Rendering mosaic plan");
      if (width * height * 4 >= 2 * 1024 * 1024 * 1024)
      {
         console.warningln("Cannot draw the image: The size is too big");
         return;
      }

      var bmp = new Bitmap(width, height);
      var imageOrg = this.imageWindow.mainView.image;
      var tmpW = new ImageWindow(width, height, imageOrg.numberOfChannels, this.imageWindow.bitsPerSample, this.imageWindow.isFloatSample, imageOrg.isColor, "MosaicPlan");
      tmpW.mainView.beginProcess(UndoFlag_NoSwapFile);
      tmpW.mainView.image.apply(imageOrg);
      ApplySTF(tmpW.mainView, this.imageWindow.mainView.stf);
      tmpW.mainView.endProcess();
      bmp.assign(tmpW.mainView.image.render());
      tmpW.close();

      var g = new VectorGraphics(bmp);

      this.PaintGuideStars(g);

      this.PaintTiles(g);

      g.end();

      var newid = "Mosaic_Plan";
      console.writeln("<end><cbr>Generating output image: ", newid);
      var targetW = new ImageWindow(width, height, 3, 16, false, true, newid);

      targetW.mainView.beginProcess(UndoFlag_NoSwapFile);

      // Blend annotation with target image
      targetW.mainView.image.blend(bmp);

      // Copy keywords to target image
      targetW.keywords = this.imageWindow.keywords;

      targetW.mainView.endProcess();
      this.metadata.SaveProperties(targetW);

      targetW.show();
   }

   this.PaintGuideStars = function (g)
   {
      if (!this.showGuideStars)
         return;
      if (this.catalogStars == null)
         this.LoadCatalog();
      if (this.catalogStars == null)
         return;
      var stars = this.catalogStars.stars;
      var size = Math.max(4, this.guideFont.size / 2);
      var hole = Math.max(4, this.guideFont.size / 3);

      g.pen = new Pen(this.guideColor, Math.max(1, this.guideFont.size / 8));
      for (var i = 0; i < Math.min(stars.length, 10000); i++)
      {
         if (stars[i].magnitude > this.maxMagnitude)
            continue;
         var pI = stars[i].catPosPx;
         g.drawLine(pI.x - size - hole, pI.y, pI.x - hole, pI.y);
         g.drawLine(pI.x + size + hole, pI.y, pI.x + hole, pI.y);
         g.drawLine(pI.x, pI.y + hole + size, pI.x, pI.y + hole);
         g.drawLine(pI.x, pI.y - hole - size, pI.x, pI.y - hole);
      }

      g.pen = new Pen(this.guideColor, 0);
      var font =new Font(this.guideFont.face, this.guideFont.size);
      font.bold = this.guideFont.bold;
      font.italic= this.guideFont.italic;
      g.font = font;
      for (var i = 0; i < Math.min(stars.length, 10000); i++)
      {
         if (stars[i].magnitude > this.maxMagnitude)
            continue;
         var pI = stars[i].catPosPx;
         g.drawText(pI.x + size + hole, pI.y + 3.5, format("%.1f", stars[i].magnitude));
      }
   };

   this.LoadCatalog = function ()
   {
      if (!this.showGuideStars)
      {
         this.catalogStars = null;
         return;
      }

      this.catalogStars = {
         magnitude: this.maxMagnitude,
         stars:     []
      };

      if (this.catalogMode == 1)
      {
         this.catalog.magMax = this.maxMagnitude;
         this.catalog.Load(this.metadata, this.vizierServer);

         for (var i = 0; i < this.catalog.objects.length; i++)
         {
            if (this.catalog.objects[i] == null)
               continue;
            var posPx = this.metadata.Convert_RD_I(this.catalog.objects[i].posRD);
            if (posPx && posPx.x >= 0 && posPx.x <= this.metadata.width && posPx.y >= 0 && posPx.y <= this.metadata.height)
            {
               var star = {};
               //               star.name = catalog.objects[i].name;
               //               star.catPosEq = catalog.objects[i].posRD;
               star.catPosPx = posPx;
               star.magnitude = this.catalog.objects[i].magnitude;
               this.catalogStars.stars.push(star);
            }
            // if(stars.length>200) break;
         }
      }
      else
      {
         if (this.databasePath == null || this.databasePath == "")
            return;
         if (File.extractExtension(this.databasePath) == ".bin")
         {
            // Local catalog in StarGenerator format
            // var mag = -1.5 -2.5 * Math.log10(flux);

            var generator = new StarGenerator;
            generator.starDatabasePath = this.databasePath;
            generator.centerRA = this.metadata.ra;
            generator.centerDec = this.metadata.dec;
            if (!this.metadata.epoch)
            {
               var epoch = new Date(Date.now());
               generator.epoch = Math.complexTimeToJD(epoch.getFullYear(), epoch.getMonth() + 1, epoch.getDate());
            }
            else
               generator.epoch = this.metadata.epoch;
            generator.projectionSystem = StarGenerator.prototype.Gnomonic;

            var resolution = this.metadata.resolution;
            if (this.metadata.xpixsz > 0)
            {
               generator.pixelSize = this.metadata.xpixsz;
               generator.focalLength = this.metadata.FocalFromResolution(resolution);
            }
            else
            {
               generator.pixelSize = 10;
               generator.focalLength = generator.pixelSize / resolution * 0.18 / Math.PI;
            }

            generator.limitMagnitude = this.maxMagnitude;
            generator.outputMode = StarGenerator.prototype.Output_CSVFile;
            generator.outputFilePath = STAR_CSV_FILE;
            generator.sensorWidth = Math.max(this.metadata.width, this.metadata.height) * 1.45;
            generator.sensorHeight = generator.sensorWidth;
            generator.executeGlobal();
            generator.starDatabasePath = null;

            var projection = new Gnomonic(180 / Math.PI, this.metadata.ra, this.metadata.dec);
            var ref_S_G = new Matrix(
               -resolution, 0, resolution * generator.sensorWidth / 2,
               0, -resolution, resolution * generator.sensorHeight / 2,
               0, 0, 1);

            // Read the positions of the stars from the file written by StarGenerator
            var lines = File.readLines(STAR_CSV_FILE);
            for (var i = 0; i < lines.length; i++)
            {
               //console.writeln("Line: ", lines[i]);
               var tokens = lines[i].split(",");
               if (tokens.length != 3)
                  continue;

               var posS = new Point(parseFloat(tokens[0]), parseFloat(tokens[1]));
               var flux = parseFloat(tokens[2]);
               var posG = ref_S_G.Apply(posS);
               var posRD = projection.Inverse(posG);
               var mag = -1.5 - 2.5 * Math.log10(flux);
               var star = {
                  catPosPx:  this.metadata.Convert_RD_I(posRD),
                  magnitude: -1.5 - 2.5 * Math.log10(flux)
               };
               this.catalogStars.stars.push(star);
            }
         }
         else
         { // Catalog in CustomCatalog format
            var catalog = new CustomCatalog();
            catalog.catalogPath = this.databasePath;

            // catalog.magMax = this.maxMagnitude;
            //catalog.Load(this.metadata, this.vizierServer);
            catalog.Load();

            for (var i = 0; i < catalog.objects.length; i++)
            {
               if (catalog.objects[i] == null)
                  continue;
               var posPx = this.metadata.Convert_RD_I(catalog.objects[i].posRD);
               if (posPx && posPx.x >= 0 && posPx.x <= this.metadata.width && posPx.y >= 0 && posPx.y <= this.metadata.height)
               {
                  var star = {};
                  //               star.name = catalog.objects[i].name;
                  //               star.catPosEq = catalog.objects[i].posRD;
                  star.catPosPx = posPx;
                  star.magnitude = catalog.objects[i].magnitude;
                  this.catalogStars.stars.push(star);
               }
               // if(stars.length>200) break;
            }

         }
      }
      this.catalogStars.stars.sort(function (a, b)
      {
         return a.magnitude - b.magnitude;
      });
   };

   this.PrintTiles = function ()
   {
      for (var i = 0; i < this.tiles.length; i++)
      {
         var tile = this.tiles[i];
         console.writeln("-------------");
         console.writeln(format("Tile #%d", i + 1));
         console.writeln(format("Center:   RA:%ls Dec:%ls", DMSangle.FromAngle(tile.center.x * 24 / 360).ToString(), DMSangle.FromAngle(tile.center.y).ToString()));
         console.writeln(format("Rotation: %.2f", tile.GetRotation()));
      }
      console.writeln("-------------");
   };
}

MosaicPlannerEngine.prototype = new ObjectWithSettings;

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
   if (!CheckVersion(1, 8, 4))
   {
      new MessageBox("This script requires at least the version 1.8 of PixInsight", TITLE, StdIcon_Error, StdButton_Ok).execute();
      return;
   }

   try
   {
      var engine = new MosaicPlannerEngine;
      engine.Init(ImageWindow.activeWindow, true);
      do {
         var dialog = new MosaicDialog(engine);
         var res = dialog.execute();

         if (!res)
         {
            if (dialog.resetRequest)
            {
               engine = new MosaicPlannerEngine();
               engine.Init(ImageWindow.activeWindow, false);
            }
            else
            {
               engine.SaveSettings();
               return;
            }
         }
      } while (!res);
      engine.SaveSettings();

      engine.Render();
      engine.PrintTiles();
   } catch (ex)
   {
      console.writeln(ex);
      new MessageBox(ex.toString(), TITLE, StdIcon_Error, StdButton_Ok).execute();
   }
}

main();
