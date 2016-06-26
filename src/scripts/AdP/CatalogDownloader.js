/*
 Catalog Downloader Dialog

 This dialog downloads from a Vizier server an extract of a catalog

 Copyright (C) 2016, Andres del Pozo
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

#ifndef __ADP_CATALOGDOWNLOADER_js
#define __ADP_CATALOGDOWNLOADER_js

#ifndef TITLE
#define TITLE "Catalog downloader"
#endif

#include <pjsr/StdIcon.jsh>
#include <pjsr/FrameStyle.jsh>
;

var downloaderLastCatalog;
var downloaderLastFilter;
var downloaderLastMagnitude;
var downloaderLastRadius;

function CatalogDownloaderDialog(metadata, vizierServer)
{
   this.__base__ = Dialog;
   this.__base__();
   var thisObj = this;

   this.windowTitle = "Catalog Downloader";

   this.labelWidth = this.font.width("Background magnitude:MM");
   this.labelWidth2 = this.font.width("Focal distance (mm):");
   this.editWidth = this.font.width("MMMMMMMMMMM");
   this.editWidth2 = this.font.width("M2.5000M");
   this.spinBoxWidth = 7 * this.font.width('M');
   var catalogComboWidth = this.font.width("Named StarsMMMMMM");

   if(typeof downloaderLastCatalog === 'undefined')
      downloaderLastCatalog = null;
   if(typeof downloaderLastFilter === 'undefined')
      downloaderLastFilter = null;
   if(typeof downloaderLastMagnitude === 'undefined')
      downloaderLastMagnitude = 8;
   if(typeof downloaderLastRadius === 'undefined')
      downloaderLastRadius = 1;

   // Global sizer

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 6;

   this.helpLabel = new Label(this);
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.minWidth = 45 * this.font.width('M');
   this.helpLabel.margin = 6;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text =
      "<p>This tool downloads a circular area from the catalog. " +
         "The area is defined by the coordinates of the center and a radius.</p>";
   this.sizer.add(this.helpLabel);


   // GEOMETRY GROUP
   this.geometry_Group = new GroupBox(this);
   this.geometry_Group.title = "Geometry";
   this.geometry_Group.sizer = new VerticalSizer;
   this.geometry_Group.sizer.margin = 6;
   this.geometry_Group.sizer.spacing = 4;
   this.sizer.add(this.geometry_Group);

   // CoordsEditor
   var orgPoint = metadata == null ? new Point(0, 0) : new Point(metadata.ra, metadata.dec);
   this.coords_Editor = new CoordinatesEditor(this, orgPoint, this.labelWidth, this.spinBoxWidth,
      "Coordinates of the center of the area that will be downloaded.");

   //
   this.fromImage_Button = new PushButton(this);
   this.fromImage_Button.text = "From image";
   this.fromImage_Button.toolTip = "Sets the coordinates at the center of another image.";
   this.fromImage_Button.icon = this.scaledResource(":/icons/document-arrow-right.png");
   this.fromImage_Button.onClick = function ()
   {
      var dlg = new SelectImageWithCoordsDialog();
      if (dlg.execute() && dlg.selectedMetadata)
      {
         thisObj.coords_Editor.SetCoords(new Point(dlg.selectedMetadata.ra, dlg.selectedMetadata.dec));
         thisObj.epoch_Editor.setEpoch(dlg.selectedMetadata.epoch);
      }
   };

   //
   this.search_Button = new PushButton(this);
   this.search_Button.text = "Search";
   this.search_Button.icon = this.scaledResource(":/icons/find.png");
   this.search_Button.onClick = function ()
   {
      var search = new SearchCoordinatesDialog(null, true, false);
      search.windowTitle = "Online Coordinates Search";
      if (search.execute())
      {
         var object = search.object;
         if (object === null)
            return;
         thisObj.coords_Editor.SetCoords(object.posEq);
      }
   };

   this.coordsButtonsSizer = new VerticalSizer;
   this.coordsButtonsSizer.spacing = 4;
   this.coordsButtonsSizer.add(this.fromImage_Button);
   this.coordsButtonsSizer.add(this.search_Button);
   this.coordsButtonsSizer.addStretch();


   this.coordsSizer = new HorizontalSizer;
   this.coordsSizer.spacing = 4;
   this.coordsSizer.add(this.coords_Editor);
   this.coordsSizer.add(this.coordsButtonsSizer);
   this.coordsSizer.addStretch();
   this.geometry_Group.sizer.add(this.coordsSizer);

   // EPOCH
   this.epoch_Editor = new EpochEditor(this, metadata == null ? null : metadata.epoch, this.labelWidth, this.spinBoxWidth);
   this.geometry_Group.sizer.add(this.epoch_Editor);

   // RADIUS
   this.radius_Label = new fieldLabel(this, "Radius:", this.labelWidth);

   this.radius_Edit = new Edit(this);
   this.radius_Edit.text = downloaderLastRadius.toString();
   this.radius_Edit.setFixedWidth(this.spinBoxWidth);
   this.radius_Edit.toolTip = "<p>Radius of the area in degrees.</p>";

   //   this.radius_Units = new Label(this);
   //   this.radius_Units.text = "degrees";
   this.radius_Units = new fieldLabel(this, "degrees");

   this.radiusSizer = new HorizontalSizer;
   this.radiusSizer.scaledSpacing = 4;
   this.radiusSizer.add(this.radius_Label);
   this.radiusSizer.add(this.radius_Edit);
   this.radiusSizer.add(this.radius_Units);
   this.radiusSizer.addStretch();
   this.geometry_Group.sizer.add(this.radiusSizer);

   // CATALOG GROUP
   this.catalog_Group = new GroupBox(this);
   this.catalog_Group.title = "Catalog";
   this.catalog_Group.sizer = new VerticalSizer;
   this.catalog_Group.sizer.margin = 6;
   this.catalog_Group.sizer.spacing = 4;
   this.sizer.add(this.catalog_Group);

   var FillFilterCombo = function (combo, catalog, filter)
   {
      combo.clear();
      if(catalog.filters == null)
         return;
      if (filter == null && catalog.filters.length > 0)
         filter = catalog.filters[0];
      for (var f = 0; f < catalog.filters.length; f++)
      {
         combo.addItem(catalog.filters[f]);
         if (catalog.filters[f] == filter)
            combo.currentItem = combo.numberOfItems - 1;
      }
   };

   //
   this.server_Label = new fieldLabel(this, "Catalog server:", this.labelWidth);

   this.mirror_Combo = new ComboBox(this);
   this.mirror_Combo.editEnabled = false;
   this.mirror_Combo.toolTip = "<p>Select the best VizieR server for your location</p>";
   this.mirror_Combo.setFixedWidth(this.font.width("Mnananai") * 5);
   for (var m = 0; m < VizierCatalog.mirrors.length; m++)
   {
      this.mirror_Combo.addItem(VizierCatalog.mirrors[m].name);
      if (VizierCatalog.mirrors[m].address === vizierServer)
         this.mirror_Combo.currentItem = parseInt(m);
   }
   //   this.mirror_Combo.onItemSelected = function ()
   //   {
   //      thisObj.vizierServer = VizierCatalog.mirrors[thisObj.mirror_Combo.currentItem].address;
   //   };

   this.server_Sizer = new HorizontalSizer;
   this.server_Sizer.spacing = 6;
   this.server_Sizer.add(this.server_Label);
   this.server_Sizer.add(this.mirror_Combo);
   this.server_Sizer.addStretch();
   this.catalog_Group.sizer.add(this.server_Sizer);

   //
   this.magnitudeFilter_Combo = new ComboBox(this);
   this.magnitudeFilter_Combo.editEnabled = false;
   this.magnitudeFilter_Combo.toolTip = "<p>Filter used in the magnitude test.</p>";
   this.magnitudeFilter_Combo.minWidth = catalogComboWidth;
   this.magnitudeFilter_Combo.onItemSelected = function ()
   {
      downloaderLastFilter = this.itemText(this.currentItem);
   };

   this.catalog_label = new fieldLabel(this, "Catalog:", this.labelWidth);

   this.catalog_Combo = new ComboBox(this);
   this.catalog_Combo.editEnabled = false;
   this.catalog_Combo.filterCombo = this.magnitudeFilter_Combo;
   if (downloaderLastCatalog == null)
      downloaderLastCatalog = __catalogRegister__.GetCatalog(0).name;
   for (var i = 0; i < __catalogRegister__.catalogs.length; i++)
   {
      var catalog = __catalogRegister__.GetCatalog(i);
      if(!(catalog instanceof VizierCatalog))
         continue;
      this.catalog_Combo.addItem(catalog.name);
      if (downloaderLastCatalog === catalog.name)
         this.catalog_Combo.currentItem = this.catalog_Combo.numberOfItems - 1;
   }
   if(this.catalog_Combo.currentItem>=0)
   {
      downloaderLastCatalog = this.catalog_Combo.itemText(this.catalog_Combo.currentItem);
      var catalog = __catalogRegister__.GetCatalog(downloaderLastCatalog);
      FillFilterCombo(this.magnitudeFilter_Combo, catalog, downloaderLastFilter);
      downloaderLastFilter = this.magnitudeFilter_Combo.itemText(this.magnitudeFilter_Combo.currentItem);
   }
   this.catalog_Combo.setFixedWidth(catalogComboWidth);
   this.catalog_Combo.toolTip = "<p>Catalog that contains the coordinates of the stars that are going to be downloaded.</p>";
   this.catalog_Combo.onItemSelected = function ()
   {
      downloaderLastCatalog = this.itemText(this.currentItem)
      var catalog = __catalogRegister__.GetCatalog(downloaderLastCatalog);
      FillFilterCombo(this.filterCombo, catalog, downloaderLastFilter);
      if(this.filterCombo.currentItem>=0)
         downloaderLastFilter = this.filterCombo.itemText(this.filterCombo.currentItem);
      else
         downloaderLastFilter =null;
   };

   //
   this.filter_label = new fieldLabel(this, "Filter:");

   this.catalog_Sizer = new HorizontalSizer;
   this.catalog_Sizer.spacing = 6;
   this.catalog_Sizer.add(this.catalog_label);
   this.catalog_Sizer.add(this.catalog_Combo);
   this.catalog_Sizer.add(this.filter_label);
   this.catalog_Sizer.add(this.magnitudeFilter_Combo);
   this.catalog_Sizer.addStretch();

   this.catalog_Group.sizer.add(this.catalog_Sizer);

   // MAX MAGNITUDE
   this.maxMag_Control = new NumericControl(this);
   this.maxMag_Control.real = true;
   this.maxMag_Control.label.text = "Maximum magnitude:";
   this.maxMag_Control.label.minWidth = this.labelWidth;
   this.maxMag_Control.setRange(-5, 25);
   this.maxMag_Control.slider.setRange(0, 60);
   this.maxMag_Control.slider.scaledMinWidth = 60;
   this.maxMag_Control.setPrecision(2);
   this.maxMag_Control.edit.minWidth = this.editWidth2;
   this.maxMag_Control.setValue(downloaderLastMagnitude);
   this.maxMag_Control.toolTip =
      "<p>This value is used for limiting the maximum magnitude of the stars extracted from the catalog.</p>";
//   this.maxMag_Control.onValueUpdated = function (value)
//   {
//      downloaderLastMagnitude = value;
//   };
   this.catalog_Group.sizer.add(this.maxMag_Control);

   // NAME
   this.name_Check = new CheckBox(this);
   this.name_Check.text = "Save objects name";
   this.name_Check.checked = true;
   this.catalog_Group.sizer.add(this.name_Check);

   // DIAMETER
   this.diameter_Check = new CheckBox(this);
   this.diameter_Check.text = "Save objects diameter";
   this.diameter_Check.checked = true;
   this.catalog_Group.sizer.add(this.diameter_Check);

   // DIAMETER
   this.magnitude_Check = new CheckBox(this);
   this.magnitude_Check.text = "Save objects magnitude";
   this.magnitude_Check.checked = true;
   this.catalog_Group.sizer.add(this.magnitude_Check);

   // TERMS OF USE of VizieR catalogs
   this.terms_Button = new ToolButton(this);
   this.terms_Button.text = "Terms of use of VizieR data";
   this.terms_Font = new Font(this.font.family, this.font.pointSize);
   this.terms_Font.underline = true;
   this.terms_Button.font = this.terms_Font;
   this.terms_Button.onClick = function()
   {
      Dialog.openBrowser("http://cds.u-strasbg.fr/vizier-org/licences_vizier.html");
   }
   //this.sizer.add(this.terms_Button, 1, Align_Right);

   // BUTTONS
   this.ok_Button = new PushButton(this);
   this.ok_Button.defaultButton = true;
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource(":/icons/ok.png");
   this.ok_Button.onClick = function ()
   {
      try
      {
         var coords = thisObj.coords_Editor.GetCoords();
         var epoch = thisObj.epoch_Editor.getEpoch();
         var radius = parseFloat(thisObj.radius_Edit.text);
         if (radius <= 0 || radius > 180)
            throw Error("The radius must be a number between 0 and 180");
         downloaderLastRadius = radius;

         var vizierServer = VizierCatalog.mirrors[thisObj.mirror_Combo.currentItem].address;
         downloaderLastCatalog = thisObj.catalog_Combo.itemText(thisObj.catalog_Combo.currentItem);
         var catalog = __catalogRegister__.GetCatalog(downloaderLastCatalog);

         if(thisObj.magnitudeFilter_Combo.currentItem>=0)
         {
            downloaderLastFilter = thisObj.magnitudeFilter_Combo.itemText(thisObj.magnitudeFilter_Combo.currentItem);
            catalog.magnitudeFilter = downloaderLastFilter;
            downloaderLastMagnitude = thisObj.maxMag_Control.value;
            catalog.magMax = downloaderLastMagnitude;
         } else
            catalog.magnitudeFilter = null;

         if(catalog.maxFov && radius>catalog.maxFov)
            throw Error(format("This catalog doesn't allow to download a radius greater that %d", catalog.maxFov));

         var saveMaxRecords = catalog.maxRecords;
         catalog.maxRecords = 2000000;
         catalog.DoLoad(coords, epoch, radius, vizierServer);
         catalog.maxRecords = saveMaxRecords;

         if(catalog.objects.length==0)
            throw Error("The server has not returned any objects");

         if (thisObj.SaveCatalog(catalog))
            this.dialog.ok();
      } catch (ex)
      {
         new MessageBox(ex.toString(), TITLE, StdIcon_Error).execute();
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
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.add(this.terms_Button);
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add(this.ok_Button);
   this.buttons_Sizer.add(this.cancel_Button);
   this.sizer.add(this.buttons_Sizer);


   this.adjustToContents();
   this.setFixedSize();

}

CatalogDownloaderDialog.prototype = new Dialog();

CatalogDownloaderDialog.prototype.SaveCatalog = function (catalog)
{
   var sfd = new SaveFileDialog();
   sfd.caption = "Select the path for the catalog file";
   sfd.filters = [
      [ "TXT Files", ".txt" ]
   ];
   if (!sfd.execute())
      return false;

   this.path = sfd.fileName;

   var file = new File;
   file.createForWriting(this.path);

   // Write header
   file.outText("RA\tDEC");
   if (this.name_Check.checked)
      file.outText("\tNAME");
   if (this.diameter_Check.checked)
      file.outText("\tDIAMETER");
   if (this.magnitude_Check.checked)
      file.outText("\tMAGNITUDE");
   file.outText("\n");

   for (var i = 0; i < catalog.objects.length; i++)
   {
      var object = catalog.objects[i];
      if (!object)
         continue;
      file.outText(format("%f\t%f", object.posRD.x, object.posRD.y));
      if (this.name_Check.checked)
         file.outText("\t" + object.name);
      if (this.diameter_Check.checked)
      {
         file.outText("\t");
         if (object.diameter != null)
            file.outText(format("%f", object.diameter));
      }
      if (this.magnitude_Check.checked)
      {
         file.outText("\t");
         if (object.magnitude != null)
            file.outText(format("%f", object.magnitude));
      }
      file.outText("\n");
   }
   file.close();

   return true;
};

#endif