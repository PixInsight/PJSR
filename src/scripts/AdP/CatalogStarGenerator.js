/*
 Catalog Star Generator script

 Script for generating a simulation of an star field using Internet catalogs.

 Copyright (C) 2013-2018, Andres del Pozo
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

 2.1.5: * The persistence to Parameters (icons) was incomplete

 2.1.4: * Better error management in the online catalogs

 2.1.3: * Changed the ambiguous term "Epoch" by "Obs date"

 2.1.2: * Added Gaia DR1 catalog

 2.1.1: * Increased the maximum size of the output image

 2.1:   * Orthographic projection

 2.0.2: * Fixed: When executed in the global context it didn't restore the parameters
          from the icon

 2.0.1: * The queries to the catalog are now more efficient and the cache is kept
          between executions.
        * New option "non-interactive" for non-interactive execution

 2.0:   * The generated image can have different projections (TAN, CAR, MER, AIT, STG, ZEA)
        * The stars can be selected from two catalogs at the same time

 1.1.1: * Modified HDR warning for reminding the user of the 24bit STF.

 1.1:   * Automatic selection of parameters
        * Fixed magnitude filter in USNO B1 catalog

 1.0.2: * Increased the resolution limit to 300"/px and the FWHM to 100"

 1.0.1: * The script didn't allow to set 0 as the value for the rotation angle
        * New catalog Bright Star Catalog, 5th ed. (Hoffleit+)

 1.0:   * Added Copy geometry button
        * Layout fixes for PixInsight 1.8
        * Changed all icons to standard PI Core 1.8 resources
        * Button icons also shown on Mac OS X
        * The 'Copy' and 'Search' buttons have now the same width (CSS)
        * Improved border of the scaleStack control with CSS
        * The default dialog button is now 'OK' (defaultButton property)
        * Fixed the 'Stars:' GroupBox title - yes, I am a maniac :) (Juan)

 0.1.1: * Fixed Search Coordinates button
        * Fixed window ID
        * Fixed FITS tags for user defined geometry

 0.1:   * Initial version.
 */

#feature-id    Render > CatalogStarGenerator

#feature-info  Script for generating a simulation of an star field using Internet catalogs.<br/>\
<br/>\
Copyright &copy;2013-18 Andr&eacute;s del Pozo

#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/DataType.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdCursor.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/NumericControl.jsh>

#define CSG_VERSION "2.1.5"
#define CSG_TITLE "Catalog Star Generator"
#define CSG_SETTINGS_MODULE "CSGEN"

#ifndef USE_CATSTARGEN_LIBRARY
#define SETTINGS_MODULE "CSGEN"
#include "WCSmetadata.jsh"
#include "AstronomicalCatalogs.jsh"
#include "SearchCoordinatesDialog.js"
#endif


function CatStarGeneratorDialog(engine)
{
   this.__base__ = Dialog;
   this.__base__();
   this.restyle();

   this.labelWidth = this.font.width("Background magnitude:MM");
   this.labelWidth2 = this.font.width("Focal distance (mm):");
   this.editWidth = this.font.width("MMMMMMMMMMM");
   this.editWidth2 = this.font.width("M2.5000M");
   var spinBoxWidth = 7 * this.font.width('M');
   var catalogComboWidth = this.font.width("Named StarsMMMMMM");

   this.helpLabel = new Label(this);
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.minWidth = 45 * this.font.width('M');
   this.helpLabel.margin = 6;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text =
      "<p><b>Catalog Star Generator v" + CSG_VERSION +
         "</b> &mdash; A script for generating a simulation of an star field using Internet catalogs.<br/>" +
         "<br/>" +
         "Copyright &copy; 2013-18 Andr&eacute;s del Pozo</p>";

   // GEOMETRY
   this.sourceGeom_Frame = new Frame(this);
   this.sourceGeom_Frame.sizer = new VerticalSizer;
   this.sourceGeom_Frame.sizer.margin = 0;
   this.sourceGeom_Frame.sizer.spacing = 4;
   this.sourceGeom_Frame.style = FrameStyle_Flat;

   this.imageGeom_RadioButton = new RadioButton(this);
   this.imageGeom_RadioButton.text = "Use active image geometry";
   this.imageGeom_RadioButton.checked = engine.useImageMetadata;
   this.imageGeom_RadioButton.toolTip = "<p>Generates an star field with the same geometry as the active image.<br/>" +
      "The image must be plate-solved and it must have the coordinates " +
      "stored in FITS keywords using the WCS convention.</p>";
   this.imageGeom_RadioButton.enabled = engine.window != null;
   this.imageGeom_RadioButton.onCheck = function (value)
   {
      //this.dialog.resolution_Edit.enabled = value;
      engine.useImageMetadata = true;
      this.dialog.customGeom_Frame.enabled = false;
   };
   this.sourceGeom_Frame.sizer.add(this.imageGeom_RadioButton);

   //
   this.customGeom_RadioButton = new RadioButton(this);
   this.customGeom_RadioButton.text = "Use user defined geometry:";
   this.customGeom_RadioButton.checked = engine.useImageMetadata == false;
   this.customGeom_RadioButton.toolTip = "Generates an star field with geometry defined by the user.";
   this.customGeom_RadioButton.onCheck = function (value)
   {
      //this.dialog.resolution_Edit.enabled = value;
      engine.useImageMetadata = false;
      this.dialog.customGeom_Frame.enabled = true;
   };
   this.sourceGeom_Frame.sizer.add(this.customGeom_RadioButton);

   //
   this.customGeom_Frame = new Frame(this);
   this.customGeom_Frame.enabled = !engine.useImageMetadata;
   this.customGeom_Frame.sizer = new VerticalSizer;
   this.customGeom_Frame.sizer.margin = 3;
   this.customGeom_Frame.sizer.spacing = 4;
   this.customGeom_Frame.style = FrameStyle_Flat;

   //
   var coordinatesTooltip = "<p>Equatorial coordinates of the center of the image.</p>";

   // CoordsEditor
   this.coords_Editor = new CoordinatesEditor(this, new Point(engine.ra, engine.dec), this.labelWidth, spinBoxWidth, coordinatesTooltip);

   //
   this.copyGeom_Button = new PushButton(this);
   this.copyGeom_Button.text = "Copy";
   this.copyGeom_Button.toolTip = "<p>Copies the geometry of the active image to the user defined geometry.<br/><br/>" +
      "The copied geometry can be different from the geometry of the image because the image has some parameters that" +
      " cannot be copied.</p>";
   this.copyGeom_Button.enabled = engine.window != null;
   this.copyGeom_Button.icon = this.scaledResource( ":/icons/window-export.png" );
   this.copyGeom_Button.onClick = function ()
   {
      this.dialog.coords_Editor.SetCoords(new Point(engine.metadata.ra, engine.metadata.dec));

      if (engine.metadata.projection && engine.metadata.projection.projCode)
      {
         switch (engine.metadata.projection.projCode)
         {
         case "TAN":
            engine.projection = 0;
            break;
         case "STG":
            engine.projection = 1;
            break;
         case "CAR":
            engine.projection = 2;
            break;
         case "MER":
            engine.projection = 3;
            break;
         case "AIT":
            engine.projection = 4;
            break;
         case "ZEA":
            engine.projection = 5;
            break;
         case "SIN":
            engine.projection = 6;
            break;
         }
         this.dialog.projection_Combo.currentItem = engine.projection;
      }

      this.dialog.epoch_Editor.setEpoch(engine.metadata.epoch);

      engine.width = engine.metadata.width;
      this.dialog.width_Edit.text = format("%d", engine.width);
      engine.height = engine.metadata.height;
      this.dialog.height_Edit.text = format("%d", engine.height);

      engine.rotation = engine.metadata.GetRotation()[0];
      this.dialog.rotation_Edit.text = format("%g", engine.rotation);

      engine.focal = engine.metadata.focal;
      this.dialog.focal_Edit.text = format("%g", engine.focal);
      engine.resolution = engine.metadata.resolution;
      this.dialog.resolution_Edit.text = format("%g", engine.resolution * 3600);
      engine.xpixsz = engine.metadata.xpixsz;
      this.dialog.pixelsz_Edit.text = format("%g", engine.xpixsz);
   };

   //
   this.search_Button = new PushButton(this);
   this.search_Button.text = "Search";
   this.search_Button.icon = this.scaledResource( ":/icons/find.png" );
   this.search_Button.onClick = function ()
   {
      var search = new SearchCoordinatesDialog(null, true, false);
      search.windowTitle = "Online Coordinates Search";
      if (search.execute())
      {
         var object = search.object;
         if (object == null)
            return;
         this.dialog.coords_Editor.SetCoords(object.posEq);
      }
   };

   // Force both buttons to have the same width
   this.search_Button.restyle();
   this.search_Button.styleSheet = this.copyGeom_Button.styleSheet =
      "* { min-width:"
         + (this.search_Button.font.width(this.search_Button.text + "M") + this.search_Button.icon.width).toString()
         + "px; }";

   this.coordsButtonsSizer = new VerticalSizer;
   this.coordsButtonsSizer.spacing = 4;
   this.coordsButtonsSizer.add(this.copyGeom_Button);
   this.coordsButtonsSizer.add(this.search_Button);
   this.coordsButtonsSizer.addStretch();

   this.coordsSizer = new HorizontalSizer;
   this.coordsSizer.spacing = 4;
   this.coordsSizer.add(this.coords_Editor);
   this.coordsSizer.add(this.coordsButtonsSizer);
   this.coordsSizer.addStretch();
   this.customGeom_Frame.sizer.add(this.coordsSizer);

   // Epoch
   this.epoch_Editor = new EpochEditor(this, engine.epoch, this.labelWidth, spinBoxWidth);
   this.customGeom_Frame.sizer.add(this.epoch_Editor);

   //
   this.dimensions_label = new Label(this);
   this.dimensions_label.text = "Dimensions (pixels):";
   this.dimensions_label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.dimensions_label.minWidth = this.labelWidth;

   this.width_Edit = new Edit(this);
   if (engine.width)
      this.width_Edit.text = format("%d", engine.width);
   this.width_Edit.setFixedWidth(this.editWidth2);
   this.width_Edit.toolTip = "<p>Width of the output image.</p>"
   this.width_Edit.onTextUpdated = function (value)
   {
      engine.width = parseInt(value);
   };

   this.height_Edit = new Edit(this);
   if (engine.height)
      this.height_Edit.text = format("%d", engine.height);
   this.height_Edit.setFixedWidth(this.editWidth2);
   this.height_Edit.toolTip = "<p>height of the output image.</p>"
   this.height_Edit.onTextUpdated = function (value)
   {
      engine.height = parseInt(value);
   };

   this.dimensions_Sizer = new HorizontalSizer;
   this.dimensions_Sizer.spacing = 4;
   this.dimensions_Sizer.add(this.dimensions_label);
   this.dimensions_Sizer.add(this.width_Edit);
   this.dimensions_Sizer.add(this.height_Edit);
   this.dimensions_Sizer.addStretch();
   this.customGeom_Frame.sizer.add(this.dimensions_Sizer);

   // ROTATION
   this.rotation_label = new Label(this);
   this.rotation_label.text = "Rotation (deg):";
   this.rotation_label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.rotation_label.minWidth = this.labelWidth;

   this.rotation_Edit = new Edit(this);
   if (engine.rotation > -90 && engine.rotation < 360)
      this.rotation_Edit.text = format("%g", engine.rotation);
   this.rotation_Edit.setFixedWidth(this.editWidth2);
   this.rotation_Edit.toolTip = "<p>Rotation angle of the image.</p>"
   this.rotation_Edit.onTextUpdated = function (value)
   {
      var rotation = parseFloat(value);
      if (rotation != null)
         engine.rotation = rotation;
   };

   this.rotation_Sizer = new HorizontalSizer;
   this.rotation_Sizer.spacing = 4;
   this.rotation_Sizer.add(this.rotation_label);
   this.rotation_Sizer.add(this.rotation_Edit);
   this.rotation_Sizer.addStretch();
   this.customGeom_Frame.sizer.add(this.rotation_Sizer);

   // IMAGE SCALE

   //
   this.focal_RadioButton = new RadioButton(this);
   this.focal_RadioButton.text = "Focal distance (mm):";
   this.focal_RadioButton.setMinWidth(this.labelWidth2 + 20);
   this.focal_RadioButton.checked = false;
   this.focal_RadioButton.onCheck = function (value)
   {
      this.dialog.focal_Edit.enabled = value;
      this.dialog.pixelsz_Edit.enabled = value;
   }

   this.focal_Edit = new Edit(this);
   if (engine.focal)
      this.focal_Edit.text = format("%g", engine.focal);
   this.focal_Edit.toolTip = "<p>Focal length of the optical system in millimeters.</p>";
   this.focal_Edit.setFixedWidth(this.editWidth2);
   this.focal_Edit.enabled = false;
   this.focal_Edit.onTextUpdated = function (value)
   {
      engine.focal = parseFloat(value);
      if (engine.xpixsz)
      {
         engine.resolution = (engine.focal > 0) ? engine.xpixsz / engine.focal * 0.18 / Math.PI : 0;
         this.dialog.resolution_Edit.text = format("%g", engine.resolution * 3600);
         if (engine.autoGraphics)
            this.dialog.CalculateParameters();
      }
   };

   this.pixelsz_Label = new Label(this);
   this.pixelsz_Label.textAlignment = TextAlign_Left | TextAlign_VertCenter;
   this.pixelsz_Label.text = "Pixel size (um):";
   this.pixelsz_Label.setMinWidth(this.labelWidth2);

   this.pixelsz_Edit = new Edit(this);
   if (engine.xpixsz)
      this.pixelsz_Edit.text = format("%g", engine.xpixsz);
   this.pixelsz_Edit.toolTip = "<p>Pixel size in micrometers. The image is assumed to have square pixels.</p>";
   this.pixelsz_Edit.setFixedWidth(this.editWidth2);
   this.pixelsz_Edit.enabled = false;
   this.pixelsz_Edit.onTextUpdated = function (value)
   {
      if (value != null)
      {
         var val = parseFloat(value);
         engine.xpixsz = val;
         if (val > 0 && val < 120)
         {
            if (this.dialog.focal_RadioButton.checked)
            {
               engine.resolution = (engine.focal > 0) ? engine.xpixsz / engine.focal * 0.18 / Math.PI : 0;
               this.dialog.resolution_Edit.text = format("%g", engine.resolution * 3600);
            }
            else
            {
               engine.focal = (engine.resolution > 0) ? engine.xpixsz / engine.resolution * 0.18 / Math.PI : 0;
               this.dialog.focal_Edit.text = format("%g", engine.focal);
            }
         }
         if (engine.autoGraphics)
            this.dialog.CalculateParameters();
      }
   };
   //
   this.resolution_RadioButton = new RadioButton(this);
   this.resolution_RadioButton.text = "Resolution (\"/px):";
   this.resolution_RadioButton.checked = true;
   this.resolution_RadioButton.setMinWidth(this.labelWidth2 + 20);
   this.resolution_RadioButton.onCheck = function (value)
   {
      this.dialog.resolution_Edit.enabled = value;
   };

   this.resolution_Edit = new Edit(this);
   if (engine.resolution != null)
      this.resolution_Edit.text = format("%g", engine.resolution * 3600);
   this.resolution_Edit.toolTip = "<p>Resolution of the image in arcseconds per pixel.</p>";
   this.resolution_Edit.setFixedWidth(this.editWidth2);
   this.resolution_Edit.enabled = true;
   this.resolution_Edit.onTextUpdated = function (value)
   {
      engine.resolution = parseFloat(value) / 3600;
      if (engine.xpixsz)
      {
         engine.focal = (engine.resolution > 0) ? engine.xpixsz / engine.resolution * 0.18 / Math.PI : 0;
         this.dialog.focal_Edit.text = format("%g", engine.focal);
      }
      if (engine.autoGraphics)
         this.dialog.CalculateParameters();
   };

   this.focal_Sizer = new HorizontalSizer;
   this.focal_Sizer.spacing = 4;
   this.focal_Sizer.add(this.focal_RadioButton);
   //this.focal_Sizer.add( this.focal_Label );
   this.focal_Sizer.add(this.focal_Edit);
   this.focal_Sizer.addStretch();

   this.pixelsz_Sizer = new HorizontalSizer;
   this.pixelsz_Sizer.spacing = 4;
   this.pixelsz_Sizer.addSpacing(20);
   this.pixelsz_Sizer.add(this.pixelsz_Label);
   this.pixelsz_Sizer.add(this.pixelsz_Edit);
   this.pixelsz_Sizer.addStretch();

   this.resol_Sizer = new HorizontalSizer;
   this.resol_Sizer.spacing = 4;
   this.resol_Sizer.add(this.resolution_RadioButton);
   //this.resol_Sizer.add( this.resolution_Label );
   this.resol_Sizer.add(this.resolution_Edit);
   this.resol_Sizer.addStretch();

   this.scaleStack = new Frame(this);
   //this.scaleStack.frameStyle = FrameStyle_Box; //--> better with CSS:
   this.scaleStack.styleSheet = "*#" + this.scaleStack.uniqueId + " { border: 1px solid gray; }";
   this.scaleStack.sizer = new VerticalSizer;
   this.scaleStack.sizer.margin = 4;
   this.scaleStack.sizer.spacing = 4;
   this.scaleStack.sizer.add(this.focal_Sizer);
   this.scaleStack.sizer.add(this.pixelsz_Sizer);
   this.scaleStack.sizer.add(this.resol_Sizer);

   //
   this.scale_Label = new Label(this);
   this.scale_Label.text = "Image scale:";
   this.scale_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.scale_Label.minWidth = this.labelWidth;

   this.scale_Sizer = new HorizontalSizer;
   this.scale_Sizer.spacing = 4;
   this.scale_Sizer.add(this.scale_Label);
   this.scale_Sizer.add(this.scaleStack);
   this.scale_Sizer.addStretch();
   this.customGeom_Frame.sizer.add(this.scale_Sizer);

   // PROJECTION
   this.projection_Label = new Label(this);
   this.projection_Label.text = "Projection:";
   this.projection_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.projection_Label.minWidth = this.labelWidth;

   this.projection_Combo = new ComboBox(this);
   this.projection_Combo.editEnabled = false;
   this.projection_Combo.toolTip = "<p>Projection used in the image.</p>";
   //this.projection_Combo.minWidth = ;
   this.projection_Combo.addItem("Gnomonic");
   this.projection_Combo.addItem("Stereographic");
   this.projection_Combo.addItem("Plate-carrée");
   this.projection_Combo.addItem("Mercator");
   this.projection_Combo.addItem("Hammer-Aitoff");
   this.projection_Combo.addItem("Zenithal equal area");
   this.projection_Combo.addItem("Orthographic");
   if (engine.projection != null)
      this.projection_Combo.currentItem = engine.projection;
   this.projection_Combo.onItemSelected = function ()
   {
      engine.projection = this.currentItem;
      engine.projectionOriginMode = 0;
   };

   this.projection_Button = new PushButton(this);
   this.projection_Button.text = "Advanced";
   this.projection_Button.onClick = function ()
   {
      var projectionConfig = new ConfigProjectionDialog(engine, engine.projection);
      projectionConfig.execute();
   }

   this.projection_Sizer = new HorizontalSizer;
   this.projection_Sizer.spacing = 4;
   this.projection_Sizer.add(this.projection_Label);
   this.projection_Sizer.add(this.projection_Combo);
   this.projection_Sizer.add(this.projection_Button);
   this.projection_Sizer.addStretch();
   this.customGeom_Frame.sizer.add(this.projection_Sizer);

   ///
   this.geometry_Group = new GroupBox(this);
   this.geometry_Group.title = "Geometry";
   this.geometry_Group.sizer = new VerticalSizer;
   this.geometry_Group.sizer.margin = 6;
   this.geometry_Group.sizer.spacing = 4;
   this.geometry_Group.sizer.add(this.sourceGeom_Frame);
   this.geometry_Group.sizer.add(this.customGeom_Frame);
   //this.geometry_Group.frameStyle = FrameStyle_Box;

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

   // Stars source

   //
   this.server_Label = new Label(this);
   this.server_Label.text = "Catalog server:";
   this.server_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.server_Label.minWidth = this.labelWidth;

   this.mirror_Combo = new ComboBox(this);
   this.mirror_Combo.editEnabled = false;
   this.mirror_Combo.toolTip = "<p>Select the best VizieR server for your location</p>";
   this.mirror_Combo.setFixedWidth(this.font.width("Mnananai") * 5);
   for (var m = 0; m < VizierCatalog.mirrors.length; m++)
   {
      this.mirror_Combo.addItem(VizierCatalog.mirrors[m].name);
      if (VizierCatalog.mirrors[m].address == engine.vizierServer)
         this.mirror_Combo.currentItem = parseInt(m);
   }
   this.mirror_Combo.onItemSelected = function ()
   {
      engine.vizierServer = VizierCatalog.mirrors[this.dialog.mirror_Combo.currentItem].address;
   };

   this.server_Sizer = new HorizontalSizer;
   this.server_Sizer.spacing = 6;
   this.server_Sizer.add(this.server_Label);
   this.server_Sizer.add(this.mirror_Combo);
   this.server_Sizer.addStretch();

   //
   this.magnitudeFilter_Combo = new ComboBox(this);
   this.magnitudeFilter_Combo.editEnabled = false;
   this.magnitudeFilter_Combo.toolTip = "<p>Filter used in the magnitude test.</p>";
   this.magnitudeFilter_Combo.minWidth = catalogComboWidth;
   this.magnitudeFilter_Combo.onItemSelected = function ()
   {
      engine.catalog.magnitudeFilter = this.itemText(this.currentItem);
   };

   this.catalog_label = new Label(this);
   this.catalog_label.text = "Catalog1:";
   this.catalog_label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.catalog_label.minWidth = this.labelWidth;

   this.catalog_Combo = new ComboBox(this);
   this.catalog_Combo.editEnabled = false;
   this.catalog_Combo.filterCombo = this.magnitudeFilter_Combo;
   for (var i = 0; i < __catalogRegister__.catalogs.length; i++)
   {
      var catalog = __catalogRegister__.GetCatalog(i);
      if (catalog.filters)
      {
         this.catalog_Combo.addItem(catalog.name);
         if (engine.catalog.name == catalog.name)
         {
            this.catalog_Combo.currentItem = this.catalog_Combo.numberOfItems - 1;
            FillFilterCombo(this.magnitudeFilter_Combo, catalog, engine.catalog.magnitudeFilter);
         }
      }
   }
   this.catalog_Combo.setFixedWidth(catalogComboWidth);
   this.catalog_Combo.toolTip = "<p>Catalog that contains the coordinates of the stars that are going to be drawn.</p>";
   this.catalog_Combo.onItemSelected = function ()
   {
      var catalogName = this.itemText(this.currentItem)
      engine.catalog = __catalogRegister__.GetCatalog(catalogName);
      FillFilterCombo(this.filterCombo, engine.catalog, engine.catalog.magnitudeFilter);
   };

   //
   this.filter_label = new Label(this);
   this.filter_label.text = "Filter:";
   this.filter_label.textAlignment = TextAlign_Left | TextAlign_VertCenter;
   //this.filter_label.minWidth = this.labelWidth;

   this.catalog_Sizer = new HorizontalSizer;
   this.catalog_Sizer.spacing = 6;
   this.catalog_Sizer.add(this.catalog_label);
   this.catalog_Sizer.add(this.catalog_Combo);
   this.catalog_Sizer.add(this.filter_label);
   this.catalog_Sizer.add(this.magnitudeFilter_Combo);
   this.catalog_Sizer.addStretch();

   //
   this.magnitudeFilter2_Combo = new ComboBox(this);
   this.magnitudeFilter2_Combo.editEnabled = false;
   this.magnitudeFilter2_Combo.toolTip = "<p>Filter used in the magnitude test.</p>";
   this.magnitudeFilter2_Combo.minWidth = catalogComboWidth;
   this.magnitudeFilter2_Combo.enabled = engine.catalog2 != null && engine.catalog2.name!="null";
   this.magnitudeFilter2_Combo.onItemSelected = function ()
   {
      engine.catalog2.magnitudeFilter = this.itemText(this.currentItem);
   };
   this.catalog2_label = new Label(this);
   this.catalog2_label.text = "Catalog2:";
   this.catalog2_label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.catalog2_label.minWidth = this.labelWidth;

   this.catalog2_Combo = new ComboBox(this);
   this.catalog2_Combo.editEnabled = false;
   this.catalog2_Combo.filterCombo = this.magnitudeFilter2_Combo;
   this.catalog2_Combo.addItem("* Not used *");
   this.catalog2_Combo.currentItem = 0;
   for (var i = 0; i < __catalogRegister__.catalogs.length; i++)
   {
      var catalog = __catalogRegister__.GetCatalog(i);
      if (catalog.filters)
      {
         this.catalog2_Combo.addItem(catalog.name);
         if (engine.catalog2 && engine.catalog2.name == catalog.name)
         {
            this.catalog2_Combo.currentItem = this.catalog2_Combo.numberOfItems - 1;
            FillFilterCombo(this.magnitudeFilter2_Combo, catalog, engine.catalog2.magnitudeFilter);
         }
      }
   }
   this.catalog2_Combo.setFixedWidth(catalogComboWidth);
   this.catalog2_Combo.toolTip = "<p>Catalog that contains the coordinates of the stars that are going to be drawn.</p>";
   this.catalog2_Combo.onItemSelected = function ()
   {
      if (this.currentItem == 0)
      {
         engine.catalog2 = new NullCatalog();
         this.filterCombo.enabled = false;
      }
      else
      {
         var catalogName = this.itemText(this.currentItem)
         engine.catalog2 = __catalogRegister__.GetCatalog(catalogName);
         this.filterCombo.enabled = true;
         FillFilterCombo(this.filterCombo, engine.catalog2, engine.catalog2.magnitudeFilter);
      }
   };

   //
   this.filter2_label = new Label(this);
   this.filter2_label.text = "Filter:";
   this.filter2_label.textAlignment = TextAlign_Left | TextAlign_VertCenter;
   //this.filter_label.minWidth = this.labelWidth;

   this.catalog2_Sizer = new HorizontalSizer;
   this.catalog2_Sizer.spacing = 6;
   this.catalog2_Sizer.add(this.catalog2_label);
   this.catalog2_Sizer.add(this.catalog2_Combo);
   this.catalog2_Sizer.add(this.filter2_label);
   this.catalog2_Sizer.add(this.magnitudeFilter2_Combo);
   this.catalog2_Sizer.addStretch();

   // maxMagnitude
   this.maxMag_Control = new NumericControl(this);
   this.maxMag_Control.real = true;
   this.maxMag_Control.label.text = "Maximum magnitude:";
   this.maxMag_Control.label.minWidth = this.labelWidth;
   this.maxMag_Control.setRange(-5, 25);
   this.maxMag_Control.slider.setRange(0, 60);
   this.maxMag_Control.slider.scaledMinWidth = 60;
   this.maxMag_Control.setPrecision(2);
   this.maxMag_Control.edit.minWidth = this.editWidth2;
   this.maxMag_Control.setValue(engine.maxMagnitude);
   this.maxMag_Control.toolTip =
      "<p>This value is used for limiting the maximum magnitude of the stars extracted from the catalog.</p>";
   this.maxMag_Control.onValueUpdated = function (value)
   {
      engine.maxMagnitude = value;
      if (engine.autoGraphics)
         this.dialog.CalculateParameters();
   };

   // Noise
   this.auto_Check = new CheckBox(this);
   this.auto_Check.styleSheet = format("QCheckBox { padding-left: %dpx;}", this.labelWidth + 4);
   this.auto_Check.checked = engine.autoGraphics;
   this.auto_Check.text = "Automatic appearance";
   this.auto_Check.toolTip =
      "<p>When this option is selected the script calculates the best parameters for achieving a good visualization.</p>" +
         "<p>The parameters are calculated using the resolution and maximum magnitude.</p>";
   this.auto_Check.onCheck = function (checked)
   {
      engine.autoGraphics = checked;
      if (engine.autoGraphics)
         this.dialog.CalculateParameters();
      this.dialog.minMag_Control.enabled = !engine.autoGraphics;
      this.dialog.backMag_Control.enabled = !engine.autoGraphics;
      this.dialog.PSF_Combo.enabled = !engine.autoGraphics;
      this.dialog.MoffatBeta_Edit.enabled = !engine.autoGraphics;
      this.dialog.fwhm_Control.enabled = !engine.autoGraphics;
   };

   // minMagnitude
   this.minMag_Control = new NumericControl(this);
   this.minMag_Control.real = true;
   this.minMag_Control.label.text = "Saturation magnitude:";
   this.minMag_Control.label.minWidth = this.labelWidth;
   this.minMag_Control.setRange(-5, 25);
   this.minMag_Control.slider.setRange(0, 60);
   this.minMag_Control.slider.scaledMinWidth = 60;
   this.minMag_Control.setPrecision(2);
   this.minMag_Control.edit.minWidth = this.editWidth2;
   this.minMag_Control.setValue(engine.minMagnitude);
   this.minMag_Control.enabled = !engine.autoGraphics;
   this.minMag_Control.toolTip = "<p>The stars with a magnitude below this value will be saturated.<br/>" +
      "It is important to choose the highest possible value for this property in order " +
      "to reduce the dynamic range necessary to represent the star field.</p>";
   this.minMag_Control.onValueUpdated = function (value)
   {
      engine.minMagnitude = value;
   };

   // backgroundMagnitude
   this.backMag_Control = new NumericControl(this);
   this.backMag_Control.real = true;
   this.backMag_Control.label.text = "Background magnitude:";
   this.backMag_Control.label.minWidth = this.labelWidth;
   this.backMag_Control.setRange(-5, 25);
   this.backMag_Control.slider.setRange(0, 60);
   this.backMag_Control.slider.scaledMinWidth = 60;
   this.backMag_Control.setPrecision(2);
   this.backMag_Control.edit.minWidth = this.editWidth2;
   this.backMag_Control.setValue(engine.backgroundMagnitude);
   this.backMag_Control.enabled = !engine.autoGraphics;
   this.backMag_Control.toolTip = "<p>This parameter is the magnitude fo the sky background.<br/>" +
      "It is important to choose the lowest possible value for this property in order " +
      "to reduce the dynamic range necessary to represent the star field.</p>";
   this.backMag_Control.onValueUpdated = function (value)
   {
      engine.backgroundMagnitude = value;
   };

   //
   this.PSF_label = new Label(this);
   this.PSF_label.text = "PSF Model:";
   this.PSF_label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.PSF_label.minWidth = this.labelWidth;

   this.PSF_Combo = new ComboBox(this);
   this.PSF_Combo.editEnabled = false;
   this.PSF_Combo.toolTip = "<p>Point Spread Function (PSF) used for drawing the stars.</p>";
   this.PSF_Combo.minWidth = catalogComboWidth;
   this.PSF_Combo.addItem("Gauss");
   this.PSF_Combo.addItem("Moffat");
   this.PSF_Combo.currentItem = engine.PSF;
   this.PSF_Combo.enabled = !engine.autoGraphics;
   this.PSF_Combo.onItemSelected = function ()
   {
      engine.PSF = this.currentItem;
      this.dialog.MoffatBeta_Edit.visible = engine.PSF == 1;
      this.dialog.MoffatBeta_label.visible = engine.PSF == 1;
   };

   this.MoffatBeta_label = new Label(this);
   this.MoffatBeta_label.text = "beta:";
   this.MoffatBeta_label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.MoffatBeta_label.visible = engine.PSF == 1;
   this.MoffatBeta_Edit = new Edit(this);
   this.MoffatBeta_Edit.text = format("%g", engine.beta);
   this.MoffatBeta_Edit.toolTip = "Moffat PSF beta parameter";
   this.MoffatBeta_Edit.setFixedWidth(this.editWidth2);
   this.MoffatBeta_Edit.visible = engine.PSF == 1;
   this.MoffatBeta_Edit.enabled = !engine.autoGraphics;
   this.MoffatBeta_Edit.onTextUpdated = function (value)
   {
      engine.beta = parseFloat(value);
   };

   this.PSF_Sizer = new HorizontalSizer;
   this.PSF_Sizer.spacing = 4;
   this.PSF_Sizer.add(this.PSF_label);
   this.PSF_Sizer.add(this.PSF_Combo);
   this.PSF_Sizer.add(this.MoffatBeta_label);
   this.PSF_Sizer.add(this.MoffatBeta_Edit);
   this.PSF_Sizer.addStretch();


   // FWHM
   this.fwhm_Control = new NumericControl(this);
   this.fwhm_Control.real = true;
   this.fwhm_Control.label.text = "FWHM (arcSec):";
   this.fwhm_Control.label.minWidth = this.labelWidth;
   this.fwhm_Control.setRange(0.2, 100);
   this.fwhm_Control.slider.setRange(0, 499);
   this.fwhm_Control.slider.scaledMinWidth = 60;
   this.fwhm_Control.setPrecision(2);
   this.fwhm_Control.edit.minWidth = this.editWidth2;
   this.fwhm_Control.setValue(engine.FWHM);
   this.fwhm_Control.enabled = !engine.autoGraphics;
   this.fwhm_Control.toolTip = "<p>FWHM in arcseconds of the stars.</p>";
   this.fwhm_Control.onValueUpdated = function (value)
   {
      engine.FWHM = value;
   };

   this.CalculateParameters = function (setControls)
   {
      engine.CalculateGraphicParams();

      if(setControls)
      {
         this.minMag_Control.setValue(engine.minMagnitude);
         this.backMag_Control.setValue(engine.backgroundMagnitude);
         this.PSF_Combo.currentItem = engine.PSF;
         this.MoffatBeta_label.visible = engine.PSF == 1;
         this.MoffatBeta_Edit.visible = engine.PSF == 1;
         this.MoffatBeta_Edit.text = format("%g", engine.beta);
         this.fwhm_Control.setValue(engine.FWHM);
      }
   }
   if (engine.autoGraphics)
      this.CalculateParameters();

   // Noise
   this.noise_Check = new CheckBox(this);
   this.noise_Check.checked = engine.generateNoise;
   this.noise_Check.text = "Generate noise";
   this.noise_Check.toolTip =
      "<p>When this option is selected noise is added to the image using an uniform distribution.</p>";
   this.noise_Check.onCheck = function (checked)
   {
      engine.generateNoise = checked;
   };

   //
   this.stars_Group = new GroupBox(this);
   this.stars_Group.title = "Stars";
   this.stars_Group.sizer = new VerticalSizer;
   this.stars_Group.sizer.margin = 6;
   this.stars_Group.sizer.spacing = 4;
   this.stars_Group.sizer.add(this.server_Sizer);
   this.stars_Group.sizer.add(this.catalog_Sizer);
   this.stars_Group.sizer.add(this.catalog2_Sizer);
   this.stars_Group.sizer.add(this.maxMag_Control);
   this.stars_Group.sizer.add(this.auto_Check);
   this.stars_Group.sizer.add(this.minMag_Control);
   this.stars_Group.sizer.add(this.backMag_Control);
   this.stars_Group.sizer.add(this.PSF_Sizer);
   this.stars_Group.sizer.add(this.fwhm_Control);
   this.stars_Group.sizer.add(this.noise_Check);
   //this.geometry_Group.frameStyle = FrameStyle_Box;

   // usual control buttons

   this.newInstanceButton = new ToolButton(this);
   this.newInstanceButton.icon = this.scaledResource( ":/process-interface/new-instance.png" );
   this.newInstanceButton.setScaledFixedSize( 20, 20 );
   this.newInstanceButton.toolTip = "New Instance";
   this.newInstanceButton.onMousePress = function ()
   {
      this.hasFocus = true;

      if (this.dialog.Validate())
      {
         var coords = this.dialog.coords_Editor.GetCoords();
         engine.ra = coords.x;
         engine.dec = coords.y;
         engine.epoch = this.dialog.epoch_Editor.getEpoch();
         engine.SaveParameters();
      }

      this.pushed = false;
      this.dialog.newInstance();
   };

   this.reset_Button = new ToolButton(this);
   //this.reset_Button.text = "Reset";
   this.reset_Button.icon = this.scaledResource( ":/icons/reload.png" );
   this.reset_Button.setScaledFixedSize( 20, 20 );
   this.reset_Button.toolTip = "<p>Resets the settings to the default values.<br />" +
      "It closes the dialog and the script must be executed again.</p>";
   this.reset_Button.onClick = function ()
   {
      var msg = new MessageBox("Do you really want to reset the settings to their default value?",
         CSG_TITLE, StdIcon_Warning, StdButton_Yes, StdButton_No);
      var res = msg.execute();
      if (res == StdButton_Yes)
      {
         Settings.remove(CSG_SETTINGS_MODULE);
         this.dialog.resetRequest = true;
         this.dialog.cancel();
      }
   };

   this.ok_Button = new PushButton(this);
   this.ok_Button.defaultButton = true;
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function ()
   {
      if (this.dialog.Validate())
      {
         var coords = this.dialog.coords_Editor.GetCoords();
         engine.ra = coords.x;
         engine.dec = coords.y;
         engine.epoch = this.dialog.epoch_Editor.getEpoch();
         this.dialog.ok();
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
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add(this.ok_Button);
   this.buttons_Sizer.add(this.cancel_Button);

   // Global sizer

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 6;
   this.sizer.add(this.helpLabel);
   this.sizer.addSpacing(4);
   this.sizer.add(this.geometry_Group);
   this.sizer.add(this.stars_Group);

   this.sizer.addSpacing(8);
   this.sizer.add(this.buttons_Sizer);

   this.windowTitle = CSG_TITLE;
   this.adjustToContents();
   this.setFixedSize();

   this.Validate = function ()
   {
      if (engine.resolution == null || engine.resolution <= 0 || engine.resolution > 1)
      {
         new MessageBox("Invalid image resolution", CSG_TITLE, StdIcon_Error).execute();
         return false;
      }

      var coords = this.coords_Editor.GetCoords(false);
      if (coords.x < 0 || coords.x > 360)
      {
         new MessageBox("Invalid right ascension", CSG_TITLE, StdIcon_Error).execute();
         return false;
      }

      if (coords.y < -90 || coords.y > +90)
      {
         new MessageBox("Invalid declination", CSG_TITLE, StdIcon_Error).execute();
         return false;
      }

      // Validate parsing of epoch
      var epochJD = this.epoch_Editor.getEpoch();

      if (engine.backgroundMagnitude - engine.minMagnitude > 10)
         new MessageBox("The resulting image will have a very high dynamic range.\n" +
            "The ScreenTransferFunction will not work properly on this image.\n\n" +
            "You can activate the 24bit STF (Menu \"Image/Screen Transfer Functions\") or " +
            "you can reduce the dynamic range increasing the saturation magnitude or decreasing the background magnitude."
            , CSG_TITLE, StdIcon_Warning).execute();

      return true;
   };
}
CatStarGeneratorDialog.prototype = new Dialog;

function PSF(A, B)
{
   this.__base__ = Object;
   this.__base__();

   this.A = A;
   this.B = B;
}
PSF.prototype = new Object;

function MoffatPSF(A, B, sigma, beta)
{
   this.__base__ = PSF;
   this.__base__(A, B);

   this.sigma = sigma;
   this.beta = beta;

   this.Evaluate = function (p0, x, y)
   {
      var dx = x - p0.x;
      var dy = y - p0.y;
      return this.B + this.A * Math.pow(1 + (dx * dx + dy * dy) / (this.sigma * this.sigma), -this.beta);
   }

   this.SetFWHM = function (fwhm)
   {
      this.sigma = fwhm / (2 * Math.sqrt(Math.pow(2, 1 / this.beta) - 1));
   }

   this.FindRadiusByLevel = function (level)
   {
      return this.sigma * Math.sqrt(Math.pow((level - this.B) / this.A, 1 / -this.beta) - 1);
   }
}
MoffatPSF.prototype = new PSF;

function GaussPSF(A, B, sigma)
{
   this.__base__ = PSF;
   this.__base__(A, B);

   this.sigma = sigma;

   this.Evaluate = function (p0, x, y)
   {
      var dx = x - p0.x;
      var dy = y - p0.y;
      return this.B + this.A * Math.exp((dx * dx + dy * dy) / (-2 * this.sigma * this.sigma));
   }

   this.SetFWHM = function (fwhm)
   {
      this.sigma = fwhm / (2 * Math.sqrt(-2 * Math.log(0.5)));
   }

   this.FindRadiusByLevel = function (level)
   {
      return this.sigma * Math.sqrt(-2 * Math.log((level - this.B) / this.A));
   }
}
GaussPSF.prototype = new PSF;

function CatalogStarGenerator()
{
   this.__base__ = ObjectWithSettings;
   this.__base__(
      CSG_SETTINGS_MODULE,
      "sgen",
      new Array(
         ["useImageMetadata", DataType_Boolean],
         ["width", DataType_UInt32],
         ["height", DataType_UInt32],
         ["projection", DataType_UInt32],
         ["ra", DataType_Double],
         ["dec", DataType_Double],
         ["epoch", DataType_Double],
         ["rotation", DataType_Double],
         ["resolution", DataType_Double],
         ["xpixsz", DataType_Double],
         ["catalog", Ext_DataType_Complex ],
         ["catalog2", Ext_DataType_Complex ],
         ["projectionOriginMode", DataType_UInt32],
         ["projectionOriginRA", DataType_UInt32],
         ["projectionOriginDec", DataType_UInt32],
         ["vizierServer", DataType_UCString],
         ["autoGraphics", DataType_Boolean],
         ["minMagnitude", DataType_Double],
         ["maxMagnitude", DataType_Double],
         ["backgroundMagnitude", DataType_Double],
         ["PSF", DataType_UInt32],
         ["FWHM", DataType_Double],
         ["beta", DataType_Double],
         ["generateNoise", DataType_Boolean]
      )
   );

   this.useImageMetadata = true;
   this.ra = 0;
   this.dec = 0;
   this.epoch = Math.complexTimeToJD(2015, 1, 1);
   this.width = 1024;
   this.height = 1024;
   this.rotation = 0;
   this.resolution = +1 / 3600;
   this.xpixsz = 5;
   this.projection = 0;
   this.projectionOriginMode = 0;

   this.vizierServer = "http://vizier.u-strasbg.fr/";
   this.catalog = new PPMXLCatalog();
   this.catalog.magnitudeFilter = "r1mag";
   this.catalog2 = new NullCatalog();
   this.autoGraphics = true;
   this.minMagnitude = 10;
   this.maxMagnitude = 15;
   this.PSF = 1;
   this.beta = 4;
   this.FWHM = 2.5;
   this.supersample = 3;
   this.backgroundMagnitude = 16;
   this.generateNoise = true;

   // TODO: Add implementation of LoadParameters and SaveParameters

   this._base_LoadSettings = this.LoadSettings;
   this.LoadSettings = function ()
   {
      var version = Settings.read(this.MakeSettingsKey("version"), DataType_UCString);
      if (!Settings.lastReadOK || version != CSG_VERSION)
         return false;

      var catalogName = Settings.read(this.MakeSettingsKey("catalogName"), DataType_UCString);
      if (!Settings.lastReadOK || !catalogName)
         return false;
      var catalog = __catalogRegister__.FindByName(catalogName);
      if (catalog)
         this.catalog = eval(catalog.constructor);

      var catalog2Name = Settings.read(this.MakeSettingsKey("catalog2Name"), DataType_UCString);
      if(!Settings.lastReadOK || !catalog2Name || catalog2Name=="null")
         this.catalog2 = new NullCatalog();
      else{
         var catalog = __catalogRegister__.FindByName(catalog2Name);
         if (catalog)
            this.catalog2 = eval(catalog.constructor);
      }

      this._base_LoadSettings();
      if (this.xpixsz > 0 && this.resolution > 0)
         this.focal = this.xpixsz / this.resolution * 0.18 / Math.PI;
      return true;
   }

   this._base_SaveSettings = this.SaveSettings;
   this.SaveSettings = function ()
   {
      Settings.write(this.MakeSettingsKey("version"), DataType_UCString, CSG_VERSION);
      Settings.write(this.MakeSettingsKey("catalogName"), DataType_UCString, this.catalog.name);
      Settings.write(this.MakeSettingsKey("catalog2Name"), DataType_UCString, this.catalog2.name);
      this._base_SaveSettings();
   }

   this.ResetSettings = function ()
   {
      Settings.remove(CSG_SETTINGS_MODULE);
   }

   this._base_LoadParameters = this.LoadParameters;
   this.LoadParameters = function ()
   {
      var catalogName = Parameters.getString(this.MakeParamsKey("catalogName"));
      var catalog = __catalogRegister__.FindByName(catalogName);
      if (catalog)
         this.catalog = eval(catalog.constructor);

      var catalog2Name = Parameters.getString(this.MakeParamsKey("catalog2Name"));
      var catalog2 = __catalogRegister__.FindByName(catalog2Name);
      if (catalog2)
         this.catalog2 = eval(catalog2.constructor);

      this._base_LoadParameters();
   }

   this._base_SaveParameters = this.SaveParameters;
   this.SaveParameters = function ()
   {
      this._base_SaveParameters();
      Parameters.set(this.MakeParamsKey("version"), CSG_VERSION);
      Parameters.set(this.MakeParamsKey("catalogName"), this.catalog.name);
      Parameters.set(this.MakeParamsKey("catalog2Name"), this.catalog2.name);
   }


   this.LoadStars = function (catalog)
   {
      catalog.magMax = this.maxMagnitude;
      catalog.Load(this.metadata, this.vizierServer);
      if(catalog.objects == null)
         throw "Catalog error";
      var stars = new Array();
      for (var i = 0; i < catalog.objects.length; i++)
      {
         if (catalog.objects[i] == null)
            continue;
         var posPx = this.metadata.Convert_RD_I(catalog.objects[i].posRD);
         if (posPx && posPx.x >= 0 && posPx.x <= this.metadata.width && posPx.y >= 0 && posPx.y <= this.metadata.height)
         {
            var star = {};
            star.name = catalog.objects[i].name;
            star.catPosEq = catalog.objects[i].posRD;
            star.catPosPx = posPx;
            star.magnitude = catalog.objects[i].magnitude;
            stars.push(star);
         }
         // if(stars.length>200) break;
      }
      console.writeln("Loaded\n");
      processEvents();
      return stars;
   }

   this.PaintStar =function(image, star, fluxFactor, PSFObj)
   {
      PSFObj.A = fluxFactor * Math.pow(100, (this.minMagnitude - star.magnitude) / 5);

      var backgroundFactor = this.generateNoise ? 0.5 : 0.1;
      var aperture = PSFObj.FindRadiusByLevel(backgroundFactor * this.backgroundLevel) * 2;
      //console.writeln(star.magnitude,":",aperture);
      aperture = Math.ceil(Math.max(5, aperture)) | 0;

      var left = Math.max(Math.round(star.catPosPx.x - aperture), 0);
      var right = Math.min(Math.round(star.catPosPx.x + aperture), this.metadata.width);
      var top = Math.max(Math.round(star.catPosPx.y - aperture), 0);
      var bottom = Math.min(Math.round(star.catPosPx.y + aperture), this.metadata.height);

      var pixels = [];
      var rect = new Rect(left,top, right, bottom);
      image.getSamples(pixels, rect);
      var pixelsWidth = rect.width;

      var offset = 1 / this.supersample;
      for (var y = top + offset / 2; y < bottom; y += offset)
      {
         var pixely = Math.floor(y-top) * pixelsWidth;
         for (var x = left + offset / 2; x < right; x += offset)
         {
            var val = PSFObj.Evaluate(star.catPosPx, x, y);
            val /= this.supersample * this.supersample;
            //console.write(val," ");
            var pixelx = Math.floor(x-left);
            pixels[pixelx + pixely] = Math.min(1, pixels[pixelx + pixely] + val);
         }
         //console.writeln();processEvents();
      }
      image.setSamples(pixels, rect);
   };


   this.CalibrateSaturation = function (PSFObj)
   {
      var rect = new Rect(-0.5, -0.5, 0.5, 0.5);
      var samples = 100;
      var offset = 1 / samples;
      PSFObj.A = 1;

      var maxFlux = 0;
      var p0 = new Point(0, 0);
      for (var y = rect.top + offset / 2; y < rect.bottom; y += offset)
      {
         for (var x = rect.left + offset / 2; x < rect.right; x += offset)
         {
            var val = PSFObj.Evaluate(p0, x, y);
            val /= samples * samples;
            maxFlux += val;
         }
      }

      return maxFlux;
   }

   this.CreateUserMetadata = function ()
   {
      var metadata = new ImageMetadata();
      metadata.ra = this.ra;
      metadata.dec = this.dec;
      metadata.epoch = this.epoch;
      metadata.resolution = this.resolution;
      metadata.focal = this.focal;
      metadata.xpixsz = this.xpixsz;
      metadata.width = this.width;
      metadata.height = this.height;
      metadata.rotation = this.rotation;
      metadata.projection = ProjectionFactory(this, this.ra, this.dec );

      var rot = -this.rotation * Math.PI / 180;
      var cd1_1 = -this.resolution * Math.cos(rot);
      var cd1_2 = -this.resolution * Math.sin(rot);
      var cd2_1 = -this.resolution * Math.sin(rot);
      var cd2_2 = this.resolution * Math.cos(rot);
      var crpix1 = this.width / 2 + 0.5;
      var crpix2 = this.height / 2 + 0.5;
      if (this.projectionOriginMode == 1)
      {
         var centerG = metadata.projection.Direct(new Point(this.ra, this.dec));
         if (centerG == null)
            throw "Invalid projection origin";
         var Kx = cd1_1 * crpix1 + cd1_2 * crpix2 - centerG.x;
         var Ky = cd2_1 * crpix1 + cd2_2 * crpix2 - centerG.y;
         var det = cd1_2 * cd2_1 - cd1_1 * cd2_2;
         crpix1 = (Ky * cd1_2 - Kx * cd2_2) / det;
         crpix2 = (Kx * cd2_1 - Ky * cd1_1) / det;
      }
      var ref_F_G = new Matrix(
         cd1_1, cd1_2, -cd1_1 * crpix1 - cd1_2 * crpix2,
         cd2_1, cd2_2, -cd2_1 * crpix1 - cd2_2 * crpix2,
         0, 0, 1);


      var ref_F_I = new Matrix(
         1, 0, -0.5,
         0, -1, this.height + 0.5,
         0, 0, 1
      );
      metadata.ref_I_G = ref_F_G.mul(ref_F_I.inverse());
      metadata.ref_G_I = metadata.ref_I_G.inverse();
      return metadata;
   }

   this.RemoveDuplicates = function (layers, metadata)
   {
      var startts = new Date;
      var abortableBackup = jsAbortable;
      jsAbortable = true;
      console.writeln("\nRemoving duplicate objects:");
      console.flush();
      var numDuplicates = 0;
      var checks = 0;
      var numChecks = 0;

      // Sort objects in each catalog by declination
      for (var c = 0; c < layers.length; c++)
      {
         layers[c].sort(function (a, b)
            {
               if (a && b)
                  return ( a.catPosEq.y == b.catPosEq.y ) ? 0 : ((a.catPosEq.y < b.catPosEq.y) ? -1 : 1);
               else
                  return (a) ? -1 : ((b) ? 1 : 0);
            });
      }

      // Calculate the maximum number of checks
      for (var c = 0; c < layers.length - 1; c++)
      {
         var objects1 = layers[c];
         if (objects1)
            for (var c2 = c + 1; c2 < layers.length; c2++)
            {
               var objects2 = layers[c2];
               if (objects2)
                  numChecks += objects1.length * objects2.length;
            }
      }

      var lastProcess = (new Date).getTime();
      var tolerancePuntual = Math.max(metadata.resolution, 3 / 3600);
      var toleranceExtense = Math.max(metadata.resolution, 10 / 3600);
      for (var c1 = 0; c1 < layers.length - 1; c1++)
      {
         var objects1 = layers[c1];
         if (!objects1)
            continue;

         //Find a coincident object in the other layers
         for (var c2 = c1 + 1; c2 < layers.length; c2++)
         {
            var objects2 = layers[c2];
            if (!objects2)// || this.layers[c1].layerName == this.layers[c2].layerName)
               continue;

            var j0 = 0;
            for (var i = 0; i < objects1.length; i++)
            {
               var obj1 = objects1[i];
               if (!obj1)
                  continue;
               var cosDec = Math.cos(obj1.catPosEq.y * Math.PI / 180);
               var minDec = obj1.catPosEq.y - tolerancePuntual;
               var maxDec = obj1.catPosEq.y + tolerancePuntual;

               for (var j = j0; j < objects2.length; j++)
               {
                  var obj2 = objects2[j];
                  if (!obj2)
                     continue;
                  if (obj2.catPosEq.y < minDec)
                  {
                     j0 = j;
                     continue;
                  }
                  if (obj2.catPosEq.y > maxDec)
                     break;
                  var effectiveTolerance = tolerancePuntual;
                  var dx = (obj1.catPosEq.x - obj2.catPosEq.x) * cosDec;
                  var dy = obj1.catPosEq.y - obj2.catPosEq.y;
                  var dist2 = dx * dx + dy * dy;
                  if (dist2 < effectiveTolerance * effectiveTolerance)
                  {
                     if (numDuplicates <= 50)
                     {
                        console.writeln("<clrbol>   ", obj1.name, " = ", obj2.name, " (", Math.sqrt(dist2) * 3600, "\")");
                        if (numDuplicates == 50)
                           console.writeln("<clrbol>.... [Too many to show]");
                     }
                     objects2[j] = null;
                     numDuplicates++;
                  }
               }

               checks += objects2.length
               var time = (new Date).getTime();
               if (time - lastProcess > 1000)
               {
                  lastProcess = time;
                  console.write(format("<end><clrbol>Found %d duplicate objects (%.2f%%)", numDuplicates, checks / numChecks * 100));
                  processEvents();
               }
            }
         }
      }
      var endts = new Date;
      console.writeln(format("<clrbol>Found %d duplicate objects in %.2f s", numDuplicates, (endts.getTime() - startts.getTime()) / 1000));
      jsAbortable = abortableBackup;
   };

   this.CalculateGraphicParams = function()
   {
      this.minMagnitude = this.maxMagnitude - 9;
      this.backgroundMagnitude = this.maxMagnitude + 1;
      this.PSF = 1;
      if (this.resolution * 3600 > 15)
         this.beta = 1.5;
      else
         this.beta = 2;
      this.FWHM = Math.min(100,this.resolution * 3600);
   }

   this.Generate = function ()
   {
      if(this.autoGraphics)
         this.CalculateGraphicParams();

      if (!this.useImageMetadata)
         this.metadata = this.CreateUserMetadata();
      else if (this.metadata == null)
         throw "The target image has no WCS coordinates.";


      var stars = this.LoadStars(this.catalog);
      if(this.catalog2 && this.catalog2.name!="null")
      {
         var stars2 = this.LoadStars(this.catalog2);
         this.RemoveDuplicates([stars,stars2], this.metadata);
         stars=stars.concat(stars2);
      }

      var PSFObj = null;
      if (this.PSF == 0)
         PSFObj = new GaussPSF(1, 0, 1);
      else if (this.PSF == 1)
         PSFObj = new MoffatPSF(1, 0, 1, this.beta);
      else
         throw "Unknown PSF model";

      // Convert FWHM(arcsec) to sigma(pixels)
      var fwhm_pix = this.FWHM / (this.metadata.resolution * 3600);
      PSFObj.SetFWHM(fwhm_pix);

      // Calibrate de flux intensity to achieve the desired saturation point
      console.write("Calibrating saturation flux:");
      var fluxFactor = 1 / this.CalibrateSaturation(PSFObj);
      this.backgroundLevel = Math.pow(100, (this.minMagnitude - this.backgroundMagnitude) / 5);
      console.writeln(" OK");
      processEvents();

      // Create pixels vector and initialize it
      var width = this.metadata.width;
      var height = this.metadata.height;
      var hdr = this.backgroundMagnitude - this.minMagnitude > 10;

      var newid = this.useImageMetadata ? this.window.mainView.fullId + "_stars" : "CatalogStars";

      var targetW = new ImageWindow(width, height, 1, hdr ? 64 : 32, true, false, newid);
      targetW.mainView.beginProcess(UndoFlag_NoSwapFile);

      var clearProc = new PixelMath;
      clearProc.expression = this.backgroundLevel.toString();
      clearProc.executeOn(targetW.mainView, false);

      var abortableBackup = jsAbortable;
      jsAbortable = true;
      console.abortEnabled = true;
      console.writeln("Painting ", stars.length, " stars");
      processEvents();
      for (var s = 0; s < stars.length; s++)
      {
         if(stars[s]!=null)
            this.PaintStar(targetW.mainView.image, stars[s], fluxFactor, PSFObj);

         if(s%1000==0)
         {
            console.write(format("<end><clrbol>Painting: %.2f%%", s / stars.length * 100));
            processEvents();
            if (console.abortRequested)
               throw "Abort";
         }
      }
      console.writeln("<end><clrbol>Painting end\n");
      processEvents();

      if (this.generateNoise)
      {
         var P = new NoiseGenerator;
         P.amount = this.backgroundLevel;
         P.distribution = NoiseGenerator.prototype.Uniform;
         P.preserveBrightness = NoiseGenerator.prototype.PreserveMedian;
         P.executeOn(targetW.mainView, false);
      }

      // Copy keywords to target image
      if (this.useImageMetadata)
      {
         targetW.keywords = this.window.keywords;
         this.metadata.SaveProperties(targetW);
      }
      else
      {
         this.metadata.SaveKeywords(targetW, false);
         var keywords = targetW.keywords;
         this.metadata.ModifyKeyword(keywords, "DATE-OBS", this.metadata.GetDateString(this.metadata.epoch),
            "YYYY-MM-DDThh:mm:ss.ss observation start, UT");
         targetW.keywords = keywords;
         this.metadata.SaveProperties(targetW);
      }

      targetW.mainView.endProcess();
#ifgteq __PI_BUILD__ 1409 // core 1.8.6
      targetW.regenerateAstrometricSolution();
#endif

      jsAbortable = abortableBackup;
      return targetW;
   }

   // Select image and get metadata
   this.Init = function (w)
   {
      this.window = w;
      this.metadata = new ImageMetadata();
      if (w != null)
      {
         this.metadata.ExtractMetadata(w);
         if (this.metadata.ref_I_G == null)
         {
            this.window = null;
            this.metadata = null;
         }
      }
      if (this.window == null)
         this.useImageMetadata = false;

      this.LoadSettings();
      this.LoadParameters();
   }
}
CatalogStarGenerator.prototype = new ObjectWithSettings;

#ifndef USE_CATSTARGEN_LIBRARY
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
   if (!CheckVersion(1, 8, 3))
   {
      (new MessageBox( "This script requires at least the version 1.8.0 of PixInsight",
         CSG_TITLE, StdIcon_Error, StdButton_Ok )).execute();
      return;
   }

   console.abortEnabled = true;
   try
   {
      var generator = new CatalogStarGenerator();
      if (Parameters.isViewTarget)
         generator.Init(Parameters.targetView.window);
      else
      {
         if(Parameters.getBoolean("non_interactive"))
            generator.Init(ImageWindow.activeWindow);
         else {
            do {
               generator.Init(ImageWindow.activeWindow);
               var dialog = new CatStarGeneratorDialog(generator);
               var res = dialog.execute();

               if (!res)
               {
                  if (dialog.resetRequest)
                     generator = new CatalogStarGenerator();
                  else
                     return;
               }
            } while (!res);
            generator.SaveSettings();
         }
      }

      var targetW = generator.Generate();
      targetW.show();
   } catch (ex)
   {
      new MessageBox("Error:" + ex, CSG_TITLE, StdIcon_Error).execute();
   }
}

main();
#endif
