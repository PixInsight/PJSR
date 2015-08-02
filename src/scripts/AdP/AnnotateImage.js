/*
   Annotate Image

   Annotation of astronomical images.

   Copyright (C) 2012-2014, Andres del Pozo
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

   1.8.1:* New Messier catalog
         * Improved NamedStars catalog.
         * Improved "Constellation Lines" layer

   1.8:  * Optionally writes a text file with the catalog objects inside the image
         * New button for clearing the catalog cache


   1.7.4:* The queries to the catalog are now more efficient and the cache is kept
           between executions.
         * New option "non-interactive" for non-interactive execution

   1.7.3:* The images with polynomials of high degree had problems of oscillations in
           the layers with lines (constellations and grid)

   1.7.2:* Fixed the asterisms of Bootes and Ursa Major
         * Fixed problem drawing constellation lines around RA=0h/24h

   1.7.1:* Fixed magnitude filter in USNO B1 catalog

   1.7:  * Constellations layers

   1.6.3:* New catalog Bright Star Catalog, 5th ed. (Hoffleit+)
         * Fixed an error in the catalog cache when the epoch value changes

   1.6.2:* Provide a default path for the NGC/IC local catalog file if the
           stored script settings point to a nonexistent file (changes to the
           NGCICCatalog object, in AstronomicalCatalogs.jsh). For example, this
           happens if we move the script within the core application's
           directory tree.

   1.6.1:* Fixed rendering of the grid and NGC/IC catalog in images that cross the 0/24h boundary.

   1.6:  * Cursor coordinates in J2000 in PreviewDialog
         * Layout fixes for PixInsight 1.8
         * Changed all icons to standard PI Core 1.8 resources
         * Button icons also shown on Mac OS X
         * Fixed copyright years (2012-2013)
         * The default dialog button is now 'OK' (defaultButton property)

   1.5:  * Graphics scale: Allow to change the graphics properties of all elements at the same time
         * Preview dialog: Shows a previsualization of the annotation in an interactive image viewer
                           with zoom and scroll.

   1.4:  * Catalog ARP
         * Use of VectorGraphics object that allows using floating point coordinates
         * SVG overlay

   1.3:  * Fixed for PI v1.8
         * Better dialog for adding layers
         * Catalog CMC14

   1.2:  * The user can choose the filter used in the magnitude filter
         * Catalog SDSS Release 8 with object class filter (star/galaxy)
         * Catalog GSC 2.3 with object class filter (star/non-star)
         * Fixed the magnitude filter in some catalogs
         * Fixed problem in the combo OutputMode
         * After downloading a catalog it logs the number of objects inside the image

   1.11: * 2012 Apr 19 - Released as an official update.
         * Removed all instances of the 'with' JavaScript statement.
         * Fixed several GUI control dimension issues.
         * Fixed some text messages.

   1.1:  * Multiple labels per object
         * NOMAD-1 catalog with B-V filtering for white balance
         * Fields B, V and B-V in Tycho-2 catalog

   1.0:  * Label alignment.
         * Fixed grid around the poles
         * New field "NGC/IC code" in NGC/IC catalog. Cleaned name column in the catalog.
         * Hipparcos Main Catalog (VizieR I/239) with B-V and Spectral Type fields.
         * Catalog of Reflection Nebulae - Van den Bergh (VizieR VII/21)
         * Catalog of HII Regions - Sharpless (VizieR VII/20)
         * Barnard's Catalog of Dark Objects in the Sky (VizieR VII/220A)

   0.7:  * Layer management fixed. The delete button didn't work as expected.
         * Security fix in parameters persistence
         * Layout fixed when there are no layers


   0.65: * Fixed a couple problems with dialog dimensions.
         * Fixed a few message strings.
         * More robust method to compute the local path to the NGC/IC catalog.

   0.6:  * Fix for custom catalogs that cover the entire sky
         * Support of custom catalogs with line endings in Mac format [CR]
         * Fixed problem in the labels of the grid near RA=0h
         * More fields for the labels in the catalogs NamedStars and Tycho2
         * Shortened the names of the variables in the persistence. PI seems to have
           a limit in the length of the parameter list

   0.5:  * Buttons for adding, removing and moving layers
         * Custom catalog layer
         * Text layer

   0.4:  * Adds support for saving the parameters as an icon.
         * It can be applied to an image container.
         * When Reset is pressed now it is not necessary to reopen the script
         * Fixed problem with incomplete values in DATE-OBS
         * Better grid spacing
         * Code clean up

   0.3:  * Faster removing of duplicates (at most a few seconds in any case)
         * Warning when VizieR limit is reached

   0.2:  * New layout
         * Proper Motion in Tycho-2, PPMXL, UCAC3 and USNO-B1
         * Filter by magnitude (minimum and maximum)
         * The label can be chosen between name, coordinates and magnitude
         * New catalogs: Named Stars, UCAC3
         * Faster removing of duplicates
         * The font family can be changed

   0.1:  * Initial test version.
*/

#feature-id    Render > AnnotateImage

#feature-info  A script for annotating astronomical images.<br/>\
               <br/>\
               Copyright &copy; 2012-2013 Andr&eacute;s del Pozo

#include <pjsr/DataType.jsh>
#include <pjsr/FontFamily.jsh>

#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/StdCursor.jsh>
#include <pjsr/ColorComboBox.jsh>
#include <pjsr/SimpleColorDialog.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/SampleType.jsh>
#include <pjsr/ColorSpace.jsh>

#define VERSION "1.8.1"
#define TITLE "Annotate Image"
#define SETTINGS_MODULE "ANNOT"

#include "WCSmetadata.jsh"
#include "AstronomicalCatalogs.jsh"
//#include "SpectrophotometricCatalogs.js"
#include "PreviewControl.js"

// Output modes
#define Output_Image    0  // Image annotated
#define Output_Overlay  1  // Transparent overlay
#define Output_SVG      2  // Overlay in SVG format

var __layerRegister__ = new Array();

function RegisterLayer( layer )
{
   __layerRegister__.push( {id:layer.layerName, constructor:layer.GetConstructor() } );
}

function FindLayer( layerId )
{
   for( var i=0; i<__layerRegister__.length; i++)
      if( __layerRegister__[i].id == layerId )
         return __layerRegister__[i];
   return null;
}


// ******************************************************************
// TransparentColorControl: Configuration control for colors
// ******************************************************************
function TransparentColorControl( parent, initialValue, toolTip )
{
   this.__base__ = Control;
   if ( parent )
      this.__base__( parent );
   else
      this.__base__();

   this.color = initialValue;
   this.onColorChanged = null;

   this.color_ComboBox = new ColorComboBox( parent );
   this.color_ComboBox.setCurrentColor( this.color );
   this.color_ComboBox.toolTip = toolTip;
   this.color_ComboBox.onColorSelected = function( rgba )
   {
      this.parent.color = Color.setAlpha( rgba, Color.alpha( this.parent.color ) );
      if( this.parent.onColorChanged )
         this.parent.onColorChanged( this.parent.color );
   };

   this.transparency_SpinBox = new SpinBox( parent );
   this.transparency_SpinBox.minValue = 0;
   this.transparency_SpinBox.maxValue = 255;
   this.transparency_SpinBox.value = Color.alpha( this.color );
   this.transparency_SpinBox.toolTip = toolTip + ": Alpha value (0=transparent, 255=opaque)";
   this.transparency_SpinBox.onValueUpdated = function( value )
   {
      this.parent.color = Color.setAlpha( this.parent.color, value );
      if( this.parent.onColorChanged )
         this.parent.onColorChanged( this.parent.color );
   };

   this.color_Button = new ToolButton( parent );
   this.color_Button.icon = this.scaledResource( ":/icons/select-color.png" );
   this.color_Button.setScaledFixedSize( 20, 20 );
   this.color_Button.toolTip = toolTip + ": Define a custom color.";
   this.color_Button.onClick = function()
   {
      //console.writeln( format("%x",this.parent.color),  this.parent.color_ComboBox);
      var scd = new SimpleColorDialog( this.parent.color );
      scd.windowTitle = toolTip + ": Custom RGBA Color";
      if ( scd.execute() )
      {
         this.parent.color = scd.color;
         this.parent.color_ComboBox.setCurrentColor( scd.color );
         this.parent.transparency_SpinBox.value = Color.alpha( scd.color );
         if( this.parent.onColorChanged )
            this.parent.onColorChanged( this.parent.color );
      }
   };

   this.sizer = new HorizontalSizer;
   this.sizer.spacing = 4;
   this.sizer.add( this.color_ComboBox );
   this.sizer.add( this.transparency_SpinBox );
   this.sizer.add( this.color_Button );
}

TransparentColorControl.prototype = new Control;

// ******************************************************************
// LabelCombo: Label field selection
// ******************************************************************
function LabelCombo( parent, fields, labels, labelPos, width )
{
   this.__base__ = ComboBox;
   if ( parent )
      this.__base__( parent );
   else
      this.__base__();

   this.labels = labels;
   this.setFixedWidth( width );
   this.editEnabled = false;
   this.addItem( "" );
   for(var f=0; f<fields.length; f++)
   {
      this.addItem( fields[f] );
      if( fields[f]==labels[labelPos] )
         this.currentItem = f+1;
   }

   this.onItemSelected = function()
   {
      this.labels[labelPos] = this.itemText( this.currentItem );
   }

}

LabelCombo.prototype = new ComboBox;

// ******************************************************************
// GraphicProperties: Graphic properties of a layer
// ******************************************************************
function GraphicProperties( module, layer )
{
   this.__base__ = ObjectWithSettings;
   this.__base__(
      module,
      layer,
      new Array(
         ["showMarkers", DataType_Boolean],
         ["lineColor", DataType_UInt32],
         ["lineWidth", DataType_Double],
         ["showLabels", DataType_Boolean],
         ["labelSize", DataType_Double],
         ["labelBold", DataType_Boolean],
         ["labelItalic", DataType_Boolean],
         ["labelColor", DataType_UInt32],
         ["labelFace", DataType_UInt32],
         ["labelFields", Ext_DataType_StringArray]
      )
   );


   this.GetEditControls = function( parent, fields )
   {
      // Marker color
      var markerColor_Label = new Label( parent );
      markerColor_Label.text = "Color:";
      markerColor_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
      markerColor_Label.minWidth = parent.labelWidth2;

      var marker_ColorControl = new TransparentColorControl( parent, this.lineColor, "Marker color" );
      marker_ColorControl.onColorChanged = function( color ) { this.dialog.activeFrame.object.gprops.lineColor = color; };

      var markerColor_Sizer = new HorizontalSizer;
      markerColor_Sizer.spacing = 4;
      markerColor_Sizer.add( markerColor_Label );
      markerColor_Sizer.add( marker_ColorControl );
      markerColor_Sizer.addStretch( );

      // Line width
      var markerWidth_Label = new Label( parent );
      markerWidth_Label.text = "Width:";
      markerWidth_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
      markerWidth_Label.minWidth = parent.labelWidth2;

      var markerWidth_SpinBox = new SpinBox( parent );
      markerWidth_SpinBox.minValue = 0;
      markerWidth_SpinBox.maxValue = 20;
      markerWidth_SpinBox.value = this.lineWidth;
      markerWidth_SpinBox.toolTip = "<p>Line width of markers.</p>";
      markerWidth_SpinBox.onValueUpdated = function( value ) { this.dialog.activeFrame.object.gprops.lineWidth = value; };

      var markerWidth_Sizer = new HorizontalSizer;
      markerWidth_Sizer.spacing = 4;
      markerWidth_Sizer.add( markerWidth_Label );
      markerWidth_Sizer.add( markerWidth_SpinBox );
      markerWidth_Sizer.addStretch( );


      var showMarker_Frame = new GroupBox( parent );
      showMarker_Frame.title = "Show markers";
      showMarker_Frame.titleCheckBox = true;
      showMarker_Frame.checked = this.showMarkers;
      showMarker_Frame.onCheck = function( checked )
      {
         this.dialog.activeFrame.object.gprops.showMarkers = checked;
      };
      showMarker_Frame.sizer = new VerticalSizer;
      showMarker_Frame.sizer.margin=6;
      showMarker_Frame.sizer.spacing=4;
      showMarker_Frame.sizer.add(markerColor_Sizer);
      showMarker_Frame.sizer.add(markerWidth_Sizer);
      showMarker_Frame.frameStyle = FrameStyle_Box;

      // Font
      var labelSize_Label = new Label( parent );
      labelSize_Label.text = "Font:";
      labelSize_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
      labelSize_Label.minWidth = parent.labelWidth2;

      var labelFace_Combo = new ComboBox( parent );
      labelFace_Combo.editEnabled = false;
      labelFace_Combo.addItem("SansSerif");
      labelFace_Combo.addItem("Serif");
      labelFace_Combo.addItem("Script");
      labelFace_Combo.addItem("TypeWriter");
      labelFace_Combo.addItem("Decorative");
      labelFace_Combo.addItem("Symbol");
      labelFace_Combo.currentItem = this.labelFace-1;
      labelFace_Combo.onItemSelected = function()
      {
         this.dialog.activeFrame.object.gprops.labelFace = labelFace_Combo.currentItem+1;
      }

      var labelSize_SpinBox = new SpinBox( parent );
      labelSize_SpinBox.minValue = 6;
      labelSize_SpinBox.maxValue = 72;
      labelSize_SpinBox.value = this.labelSize;
      labelSize_SpinBox.toolTip = "<p>Font size of the labels.</p>";
      labelSize_SpinBox.onValueUpdated = function( value ) { this.dialog.activeFrame.object.gprops.labelSize = value; };

      var labelBold_Check = new CheckBox(parent);
      labelBold_Check.checked = this.labelBold;
      labelBold_Check.text = "Bold";
      labelBold_Check.toolTip = "<p>Bold font.</p>";
      labelBold_Check.onCheck = function( checked )
      {
         this.dialog.activeFrame.object.gprops.labelBold = checked;
      };

      var labelItalic_Check = new CheckBox(parent);
      labelItalic_Check.checked = this.labelItalic;
      labelItalic_Check.text = "Italic";
      labelItalic_Check.toolTip = "<p>Italic font.</p>";
      labelItalic_Check.onCheck = function( checked )
      {
         this.dialog.activeFrame.object.gprops.labelItalic = checked;
      };

      var font_Sizer = new HorizontalSizer;
      font_Sizer.spacing = 4;
      //font_Sizer.addSpacing( 25 );
      font_Sizer.add( labelSize_Label );
      font_Sizer.add( labelFace_Combo );
      font_Sizer.add( labelSize_SpinBox );
      font_Sizer.add( labelBold_Check );
      font_Sizer.add( labelItalic_Check );
      font_Sizer.addStretch( );

      // Label Color
      var labelColor_Label = new Label( parent );
      labelColor_Label.text = "Color:";
      labelColor_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
      labelColor_Label.minWidth = parent.labelWidth2;

      var label_ColorControl = new TransparentColorControl( parent, this.labelColor, "Label color" );
      label_ColorControl.onColorChanged = function( color ) { this.dialog.activeFrame.object.gprops.labelColor = color; };

      var labelColor_Sizer = new HorizontalSizer;
      labelColor_Sizer.spacing = 4;
      labelColor_Sizer.add( labelColor_Label );
      labelColor_Sizer.add( label_ColorControl );
      labelColor_Sizer.addStretch( );

      // Campo
      var fields_Sizer;
      if ( fields )
      {
         var comboWidth = parent.font.width( "Surface bright." + 'M' );

         var combo0 = new LabelCombo(parent, fields, this.labelFields, 0, comboWidth);
         var combo1 = new LabelCombo(parent, fields, this.labelFields, 1, comboWidth);
         var combo2 = new LabelCombo(parent, fields, this.labelFields, 2, comboWidth);
         var combo3 = new LabelCombo(parent, fields, this.labelFields, 3, comboWidth);
         var combo4 = new LabelCombo(parent, fields, this.labelFields, 4, comboWidth);
         var combo5 = new LabelCombo(parent, fields, this.labelFields, 5, comboWidth);
         var combo6 = new LabelCombo(parent, fields, this.labelFields, 6, comboWidth);
         var combo7 = new LabelCombo(parent, fields, this.labelFields, 7, comboWidth);

         var row1 = new HorizontalSizer;
         row1.spacing = 4;
         row1.add( combo0 );
         row1.add( combo1 );
         row1.add( combo2 );
         row1.addStretch( );

         var row2 = new HorizontalSizer;
         row2.spacing = 4;
         row2.add( combo3 );
         row2.addSpacing( comboWidth+4 );
         row2.add( combo4 );
         row2.addStretch( );

         var row3 = new HorizontalSizer;
         row3.spacing = 4;
         row3.add( combo5 );
         row3.add( combo6 );
         row3.add( combo7 );
         row3.addStretch( );

         var fields_Label = new Label( parent );
         fields_Label.text = "Label Text:";
         fields_Label.textAlignment = TextAlign_Right|TextAlign_Top;
         fields_Label.minWidth = parent.labelWidth2;

         var table_Sizer = new VerticalSizer;
         table_Sizer.spacing = 4;
         table_Sizer.add( row1 );
         table_Sizer.add( row2 );
         table_Sizer.add( row3 );

         fields_Sizer = new HorizontalSizer;
         fields_Sizer.spacing = 4;
         fields_Sizer.add( fields_Label );
         fields_Sizer.add( table_Sizer );
         fields_Sizer.addStretch( );
      }

      var showLabel_Frame = new GroupBox( parent );
      showLabel_Frame.title = "Show labels";
      showLabel_Frame.titleCheckBox = true;
      showLabel_Frame.setMinWidth( parent.font.width( 'M' )*35 );
      showLabel_Frame.checked = this.showLabels;
      showLabel_Frame.onCheck = function( checked )
      {
         this.dialog.activeFrame.object.gprops.showLabels = checked;
      };
      showLabel_Frame.sizer = new VerticalSizer;
      showLabel_Frame.sizer.margin=6;
      showLabel_Frame.sizer.spacing=4;
      showLabel_Frame.sizer.add(font_Sizer);
      showLabel_Frame.sizer.add(labelColor_Sizer);
      if(fields_Sizer)
         showLabel_Frame.sizer.add(fields_Sizer);
      showLabel_Frame.frameStyle = FrameStyle_Box;

      return [showMarker_Frame, showLabel_Frame];
   };

   this.showMarkers = true;
   this.lineColor = 0xffffffff;
   this.lineWidth = 1;
   this.showLabels = true;
   this.labelFace = 1;
   this.labelSize = 10;
   this.labelBold = false;
   this.labelItalic = false;
   this.labelColor = 0xffffffff;
   this.labelFields = new Array(8);
}


// ******************************************************************
// Layer: Base class for all layers
// ******************************************************************
function Layer()
{
   if(typeof this.layerName === "undefined")
      this.layerName = null;
   this.__base__ = ObjectWithSettings;
   this.__base__(
      SETTINGS_MODULE,
      this.layerName,
      new Array(
         [ "visible", DataType_Boolean ],
         [ "gprops", Ext_DataType_Complex ]
      )
   );

   this.visible = true;
   this.gprops = new GraphicProperties( SETTINGS_MODULE, this.layerName );

   this.GetObjects = function()
   {
      if( this.catalog )
         return this.catalog.objects;
      else
         return null;
   }

   this.SetId = function ( id )
   {
      this.id = id;
      this.prefix = "ly" + id;
      this.gprops.prefix = this.prefix;
   }

   this.GetConstructor = null;

   this.GetLayerType = function () { return this.GetLayerType.caller.name; }
}

Layer.prototype = new ObjectWithSettings;

function ConvertLines(metadata, points)
{
   var lineList=new Array();
   var line=new Array();
   var pI=metadata.Convert_RD_I(points[0]);
   if(pI && !metadata.CheckOscillation(points[0], pI))
      pI=null;
   if(pI)
      line.push(pI);
   var longLineDist=metadata.width*metadata.height/160;
   for(var p=1; p<points.length; p++)
   {
      var p1=points[p-1];
      var p2=points[p];
      var dx=p2.x-p1.x;
      var dy=p2.y-p1.y;
      var steps=Math.ceil(Math.max(Math.abs(dx),Math.abs(dy),1)*5);
      for(var i=1; i<=steps; i++)
      {
         var pA = new Point( p1.x+(i-1)*dx/steps, p1.y+(i-1)*dy/steps );
         var pB = new Point( p1.x+i*dx/steps, p1.y+i*dy/steps );
         var pI = null;
         if(metadata.projection.CheckBrokenLine(pA,pB))
            pI = metadata.Convert_RD_I( pB );
         if(pI && !metadata.CheckOscillation(pB, pI))
            pI=null;
         if(pI)
            line.push( pI );
         else
         {
            if(line.length>1)
               lineList.push(line);
            line=new Array;
         }
      }
   }
   if(line.length>1)
      lineList.push(line);
   return lineList;
}

// ******************************************************************
// GridLayer: Layer that draws the grid
// ******************************************************************
function GridLayer()
{
   this.layerName = "Grid";
   this.layerDescription = "Grid in J2000 equatorial coordinates";

   this.__base__ = Layer;
   this.__base__();

   this.density = 4;
   this.gprops.lineColor = 0x80ffffff;
   this.gprops.labelSize = 12;
   this.properties.push( [ "density", DataType_UInt16 ] );

   this.GetConstructor = function ()
   {
      return "new GridLayer()";
   }

   this.GetEditPanel = function (parent)
   {
      this.gpropsControls = this.gprops.GetEditControls(parent, null);

      // Grid density
      var density_Label = new Label(parent);
      density_Label.text = "Grid density:";
      density_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
      density_Label.minWidth = parent.labelWidth1;
      this.density_Label = density_Label;

      var density_Spin = new SpinBox(parent);
      density_Spin.minValue = 1;
      density_Spin.maxValue = 20;
      density_Spin.value = this.density;
      density_Spin.toolTip = "<p>Density of the grid.<br/>Higher values for a denser grid.</p>";
      density_Spin.onValueUpdated = function (value)
      {
         this.dialog.activeFrame.object.density = value;
      };
      this.density_Spin = density_Spin;

      var densitySizer = new HorizontalSizer;
      densitySizer.spacing = 4;
      densitySizer.add(density_Label);
      densitySizer.add(density_Spin);
      densitySizer.addStretch();
      this.densitySizer = densitySizer;

      var frame = new Frame(parent);
      frame.sizer = new VerticalSizer;
      frame.sizer.margin = 6;
      frame.sizer.spacing = 4;
      frame.style = FrameStyle_Flat;
      for (var i = 0; i < this.gpropsControls.length; i++)
         frame.sizer.add(this.gpropsControls[i]);
      frame.sizer.add(densitySizer);
      frame.sizer.addStretch();
      frame.object = this;
      return frame;
   };

   this.Draw = function ( g, metadata, bounds, imageWnd, graphicsScale )
   {
      // Will try to draw "density" lines in declination
      var targetScale = bounds.height / this.density;

      var cosDec = Math.cos( bounds.center.y *Math.PI/180 );
      var scalex = this.FindAxisScale( targetScale / cosDec *24/360);
      var scaley = this.FindAxisScale( targetScale );

      var orgx = Math.floor( bounds.left/scalex )*scalex;
      var orgy = Math.floor( bounds.top/scaley )*scaley;
      orgy=Math.max(-90,orgy);

      // Draw horizontal lines
      if( this.gprops.showMarkers )
      {
         g.pen = new Pen( this.gprops.lineColor, this.gprops.lineWidth*graphicsScale );
         for( var y=0; orgy+y*scaley<= bounds.bottom; y++ )
         {
            var yRD = orgy+y*scaley;
            var lines=ConvertLines(metadata, [new Point(orgx*15, yRD), new Point(bounds.right*15, yRD)]);
            for(var i=0; i<lines.length; i++)
               g.drawPolyline(lines[i]);
         }

         // Draw vertical lines
         for( var x=0; orgx+(x-0)*scalex <= bounds.right; x++ )
         {
            var xRD=orgx+x*scalex;
            var lines=ConvertLines(metadata, [new Point(xRD*15, orgy), new Point(xRD*15, bounds.bottom)]);
            for(var i=0; i<lines.length; i++)
               g.drawPolyline(lines[i]);
         }
      }

      if(this.gprops.showLabels)
      {
         g.pen = new Pen( this.gprops.labelColor, 1 );
         var font = new Font( FontFamily_SansSerif, this.gprops.labelSize*graphicsScale );
         font.bold = this.gprops.labelBold;
         font.italic = this.gprops.labelItalic;
         g.font = font;

         // Draw declination labels
         for( var y=0; orgy+y*scaley<= bounds.bottom; y++ )
         {
            var yRD=orgy+y*scaley;
            var xRD=orgx+Math.ceil(bounds.width/3/scalex)*scalex;
            var labelPos=metadata.Convert_RD_I(new Point(xRD*360/24,yRD));
            if( labelPos )
            {
               labelPos.y+=font.height;
               var label=this.GetLabelText(yRD,'\xb0','\'','\"',true);
               g.drawText(labelPos,label);
            }
         }

         // Draw R.A. labels
         for( var x=0; orgx+x*scalex < bounds.right; x++ )
         {
            var xRD=orgx+x*scalex;
            if(xRD<0)
               xRD+=24;
            else if(xRD>=24)
               xRD-=24;
            var yRD=orgy+Math.ceil(bounds.height/3/scaley)*scaley;
            var labelPos=metadata.Convert_RD_I(new Point(xRD*360/24,yRD));
            if( labelPos )
            {
               var label=this.GetLabelText(xRD,'h','m','s',false);
               g.drawText(labelPos,label);
            }
         }
      }
   }

   this.FindAxisScale = function( scaleTarget )
   {
      var scaleBase = Math.pow( 60, Math.floor(Math.log(scaleTarget)/Math.log(60)));
      var factors = [60, 45, 30, 20, 15, 10, 9, 6, 5, 4, 3, 2, 1.5, 1];

      var factor = scaleTarget / scaleBase;
      for( var i=0; i<factors.length; i++ )
         if( scaleBase*factors[i]<scaleTarget )
            return scaleBase*factors[i];
      return scaleBase;
   }

   this.GetLabelText=function( val, d, m, s, sign )
   {
      var dms = DMSangle.FromAngle(val);
      var signStr = sign ? (dms.sign<0 ? "\u2212" : "+") : "";
      if( dms.sec>0.001 )
         return signStr+format( "%d%c%d%c%.0f%c",dms.deg, d, dms.min, m, dms.sec, s);
      else if( dms.min>0 )
         return signStr+format( "%d%c%d%c", dms.deg, d, dms.min, m);
      else
         return signStr+format( "%d%c", dms.deg, d);
   }
}
GridLayer.prototype = new Layer;
RegisterLayer( new GridLayer );

// ******************************************************************
// ConstLinesLayer
// ******************************************************************
function ConstLinesLayer()
{
   this.layerName = "Constellation Lines";
   this.layerDescription = "Asterisms of the constellations";

   this.__base__ = Layer;
   this.__base__();

   this.margin = 8;
   this.gprops.lineColor = 0x80ffffff;
   this.gprops.labelSize = 12;
   this.properties.push( [ "margin", DataType_Double ] );

   this.GetConstructor = function ()
   {
      return "new ConstLinesLayer()";
   }

   this.GetEditPanel = function (parent)
   {
      this.gpropsControls = this.gprops.GetEditControls(parent, null);

      // Grid margin
      var margin_Label = new Label(parent);
      margin_Label.text = "Line margin:";
      margin_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
      margin_Label.minWidth = parent.labelWidth1;
      this.margin_Label = margin_Label;

      var margin_Spin = new SpinBox(parent);
      margin_Spin.minValue = 0;
      margin_Spin.maxValue = 40;
      margin_Spin.value = this.margin;
      margin_Spin.toolTip = "<p>Separation in pixels between adjacent lines.<br/>" +
         "The objective of this parameter is avoiding drawing the lines over the stars in the corners of the asterism.</p>";
      margin_Spin.onValueUpdated = function (value)
      {
         this.dialog.activeFrame.object.margin = value;
      };
      this.margin_Spin = margin_Spin;

      var marginSizer = new HorizontalSizer;
      marginSizer.spacing = 4;
      marginSizer.add(margin_Label);
      marginSizer.add(margin_Spin);
      marginSizer.addStretch();
      this.marginSizer = marginSizer;

      var frame = new Frame(parent);
      frame.sizer = new VerticalSizer;
      frame.sizer.margin = 6;
      frame.sizer.spacing = 4;
      frame.style = FrameStyle_Flat;
      for (var i = 0; i < this.gpropsControls.length; i++)
         frame.sizer.add(this.gpropsControls[i]);
      frame.sizer.add(marginSizer);
      frame.sizer.addStretch();
      frame.object = this;
      return frame;
   };

   this.Draw = function ( g, metadata, bounds, imageWnd, graphicsScale )
   {
      var dataPath = File.extractDrive( #__FILE__ ) + File.extractDirectory( #__FILE__ ) +"/ConstellationLines.json";
      var imgArea = new Rect(0,0,metadata.width, metadata.height);
      var data = JSON.parse(File.readFile(dataPath).toString());

      var boundsDeg=new Rect(bounds);
      boundsDeg.mul(15,1);
      if (this.gprops.showMarkers)
      {
         g.pen = new Pen(this.gprops.lineColor, this.gprops.lineWidth * graphicsScale);
         for (var i = 0; i < data.length; i++)
         {
            var pRD0 = new Point(data[i].pol[0].x * 15, data[i].pol[0].y);
            //this.NormalizeCoord(metadata, pRD0);
            var p0 = metadata.Convert_RD_I(pRD0);
            if(p0 && !metadata.CheckOscillation(pRD0,p0))
               p0=null;
            for (var p = 1; p < data[i].pol.length; p++)
            {
               var pRD = new Point(data[i].pol[p].x * 15, data[i].pol[p].y)
               //this.NormalizeCoord(metadata, pRD);
               var p1 = metadata.Convert_RD_I(pRD);
               if(p1 && !metadata.CheckOscillation(pRD,p1))
                  p1=null;

               if (p0 && p1 && metadata.projection.CheckBrokenLine(pRD0, pRD))
                  this.PaintSegment(g, p0, p1, this.margin, this.margin, imgArea);
               p0 = p1;
               pRD0 = pRD;
            }
         }
      }

      if(this.gprops.showLabels)
      {
         var centroids = {};
         for (var i = 0; i < data.length; i++)
         {
            for (var j = 0; j < data[i].pol.length; j++)
            {
               var pRD = new Point(data[i].pol[j].x * 15, data[i].pol[j].y)
               var p = metadata.Convert_RD_I(pRD);
               if(p && !metadata.CheckOscillation(pRD,p))
                  p=null;
               if (p && Math.abs(p.x) < 1e5 && Math.abs(p.y) < 1e5 && imgArea.inflatedBy(1000).includes(p))
               {
                  if (!centroids[data[i].c])
                     centroids[data[i].c] = {n:0, pos:{x:0, y:0}};
                  centroids[data[i].c].n++;
                  centroids[data[i].c].pos.x += p.x;
                  centroids[data[i].c].pos.y += p.y;
               }
            }
         }

         var labelPath = File.extractDrive( #__FILE__ ) + File.extractDirectory( #__FILE__ ) +"/ConstellationLabels.json";
         var labels = JSON.parse(File.readFile(labelPath).toString());

         g.pen = new Pen(this.gprops.labelColor, 1);
         var font = new Font(this.gprops.labelFace, this.gprops.labelSize * graphicsScale);
         font.bold = this.gprops.labelBold;
         font.italic = this.gprops.labelItalic;
         g.font = font;

         for (var k in centroids)
         {
            var p = new Point(centroids[k].pos.x / centroids[k].n, centroids[k].pos.y / centroids[k].n);
            if (p && imgArea.includes(p) && centroids[k].n > 2)
               g.drawText(p, labels[k.trim()]);
         }
      }
   }

   this.PaintSegment = function (g, p0, p1, margin0, margin1, imgArea)
   {
      if (p0 && p1 && Math.abs(p0.x) < 1e5 && Math.abs(p0.y) < 1e5 && Math.abs(p1.x) < 1e5 && Math.abs(p1.y) < 1e5 /*&& boundsDeg.includes(pRD)*/)
      {
         var segmentArea = new Rect(Math.min(p0.x, p1.x), Math.min(p0.y, p1.y), Math.max(p0.x, p1.x), Math.max(p0.y, p1.y));
         if (segmentArea.intersects(imgArea))
         {
            var vx = p1.x - p0.x;
            var vy = p1.y - p0.y;
            var len = Math.sqrt(vx * vx + vy * vy);
            if (len > margin0 + margin1 && len < Math.max(imgArea.width, imgArea.height))
            {
               var pA = new Point(p0.x + vx * margin0 / len, p0.y + vy * margin0 / len);
               var pB = new Point(p0.x + vx * (len - margin1) / len, p0.y + vy * (len - margin1) / len);
               g.drawLine(pA, pB);
            }
         }
      }
   }

   this.NormalizeCoord = function (metadata, pRD)
   {
      if (pRD.x < metadata.ra - 180)
         pRD.x += 360;
      if (pRD.x > metadata.ra + 180)
         pRD.x -= 360;
   }
}
ConstLinesLayer.prototype = new Layer;
RegisterLayer( new ConstLinesLayer );

// ******************************************************************
// ConstBordersLayer
// ******************************************************************
function ConstBordersLayer()
{
   this.layerName = "Constellation Borders";
   this.layerDescription = "Borders of the constellations";

   this.__base__ = Layer;
   this.__base__();

   this.gprops.lineColor = 0x80ffffff;
   this.gprops.labelSize = 12;

   this.GetConstructor = function ()
   {
      return "new ConstBordersLayer()";
   }

   this.GetEditPanel = function (parent)
   {
      this.gpropsControls = this.gprops.GetEditControls(parent, null);

      var frame = new Frame(parent);
      frame.sizer = new VerticalSizer;
      frame.sizer.margin = 6;
      frame.sizer.spacing = 4;
      frame.style = FrameStyle_Flat;
      for (var i = 0; i < this.gpropsControls.length; i++)
         frame.sizer.add(this.gpropsControls[i]);
      frame.sizer.addStretch();
      frame.object = this;
      return frame;
   };

   this.Draw = function ( g, metadata, bounds, imageWnd, graphicsScale )
   {
      var dataPath = File.extractDrive( #__FILE__ ) + File.extractDirectory( #__FILE__ ) +"/ConstellationBorders.json";
      var imgArea = new Rect(0, 0, metadata.width, metadata.height);
      var data = JSON.parse(File.readFile(dataPath).toString());
      if (this.gprops.showMarkers)
      {
         g.pen = new Pen(this.gprops.lineColor, this.gprops.lineWidth * graphicsScale);
         for (var i = 0; i < data.length; i++)
         {
            var lines = ConvertLines(metadata, data[i].pol);
            for (var l = 0; l < lines.length; l++)
               g.drawPolyline(lines[l]);
         }
      }

      // labels
      if (this.gprops.showLabels)
      {
         var centroids = {};
         for (var i = 0; i < data.length; i++)
         {
            for (var j = 0; j < data[i].pol.length; j++)
            {
               var p = metadata.Convert_RD_I(data[i].pol[j]);
               if (p && Math.abs(p.x) < 1e5 && Math.abs(p.y) < 1e5 && imgArea.inflatedBy(1000).includes(p))
               {
                  if (!centroids[data[i].c1])
                     centroids[data[i].c1] = {n:0, pos:{x:0, y:0}};
                  centroids[data[i].c1].n++;
                  centroids[data[i].c1].pos.x += p.x;
                  centroids[data[i].c1].pos.y += p.y;

                  if (!centroids[data[i].c2])
                     centroids[data[i].c2] = {n:0, pos:{x:0, y:0}};
                  centroids[data[i].c2].n++;
                  centroids[data[i].c2].pos.x += p.x;
                  centroids[data[i].c2].pos.y += p.y;
               }
            }
         }

         g.pen = new Pen(this.gprops.labelColor, 1);
         var font = new Font(this.gprops.labelFace, this.gprops.labelSize * graphicsScale);
         font.bold = this.gprops.labelBold;
         font.italic = this.gprops.labelItalic;
         g.font = font;

         var labelPath = File.extractDrive( #__FILE__ ) + File.extractDirectory( #__FILE__ ) +"/ConstellationLabels.json";
         var labels = JSON.parse(File.readFile(labelPath).toString());

         for (var k in centroids)
         {
            var p = new Point(centroids[k].pos.x / centroids[k].n, centroids[k].pos.y / centroids[k].n);
            if (p && imgArea.includes(p) && centroids[k].n > 2)
               g.drawText(p, labels[k.trim()]);
         }
      }
   }

}
ConstBordersLayer.prototype = new Layer;
RegisterLayer( new ConstBordersLayer );

// ******************************************************************
// CatalogLayer: Layer that draws a catalog
// ******************************************************************
function CatalogLayer(catalog)
{
   this.layerName = catalog.name;
   this.layerDescription = catalog.description;

   this.__base__ = Layer;
   this.__base__();

   this.catalog = catalog;
   this.properties.push([ "catalog", Ext_DataType_Complex ]);
   this.gprops.labelFields = catalog.GetDefaultLabels();

   this.GetConstructor = function ()
   {
      return "new CatalogLayer(" + catalog.GetConstructor() + ")";
   }


   this.SetId = function (id)
   {
      this.id = id;
      this.prefix = "ly" + id;
      this.gprops.prefix = this.prefix;
      this.catalog.prefix = this.prefix;
   }

   this.Load = function (metadata, mirrorServer)
   {
      this.catalog.Load(metadata, mirrorServer);
   }

   this.Validate = function ()
   {
      if (!this.visible)
         return true;
      if (this.catalog.Validate)
         return this.catalog.Validate();
      else
         return true;
   }

   this.GetEditPanel = function (parent)
   {
      var frame = new Frame(parent);
      frame.sizer = new VerticalSizer;
      frame.sizer.margin = 6;
      frame.sizer.spacing = 4;
      frame.style = FrameStyle_Flat;

      this.gpropsControls = this.gprops.GetEditControls(parent, this.catalog.fields);
      for (var i = 0; i < this.gpropsControls.length; i++)
         frame.sizer.add(this.gpropsControls[i]);

      this.catalogControls = this.catalog.GetEditControls(parent, this.catalog.fields);
      for (var i = 0; i < this.catalogControls.length; i++)
         frame.sizer.add(this.catalogControls[i]);

      frame.sizer.addStretch();
      frame.object = this;
      return frame;
   };

   this.Draw = function (g, metadata, bounds, imageWnd, graphicsScale)
   {
      var objects = this.catalog.objects;
      var penMarker = new Pen(this.gprops.lineColor, this.gprops.lineWidth * graphicsScale);
      var penLabel = new Pen(this.gprops.labelColor, 0);
      var font = new Font(this.gprops.labelFace, this.gprops.labelSize * graphicsScale);
      font.bold = this.gprops.labelBold;
      font.italic = this.gprops.labelItalic;
      g.font = font;
      var maglimit = 15;
      if (this.catalog.magMax != null && this.catalog.magMax != NULLMAG)
         maglimit = this.catalog.magMax
      else if (this.catalog.catalogMagnitude != null)
         maglimit = this.catalog.catalogMagnitude;

      var drawInfo = new Array(objects.length);
      for (var i = 0; i < objects.length; i++)
      {
         if (!objects[i])
            continue;

         //Coordinates validation
         if (!(objects[i].posRD.x >= 0 && objects[i].posRD.x <= 360))
            continue;
         if (!(objects[i].posRD.y >= -90 && objects[i].posRD.y <= 90))
            continue;

         var pI = metadata.Convert_RD_I(objects[i].posRD);
         if (pI == null)
            continue;
         if (g.clipping && (pI.x < g.clipRect.left || pI.y < g.clipRect.top || pI.x > g.clipRect.right || pI.y > g.clipRect.bottom))
            continue;

         var size = 5;
         if (objects[i].magnitude != null)
            size = Math.max(0, maglimit - objects[i].magnitude) + 1;
         size *= this.gprops.lineWidth * graphicsScale;
         drawInfo[i] = {pI:pI, size:size};
      }

      if (this.gprops.showMarkers)
      {
         g.pen = penMarker;
         for (var i = 0; i < objects.length; i++)
         {
            if (drawInfo[i] == null)
               continue;
            var pI = drawInfo[i].pI;
            var size = drawInfo[i].size;
            var diameter = objects[i].diameter / metadata.resolution;
            if (diameter > 10)
               g.strokeEllipse(pI.x - diameter / 2, pI.y - diameter / 2, pI.x + diameter / 2, pI.y + diameter / 2, penMarker);
            else
            {
               g.drawLine(pI.x - size - 5, pI.y, pI.x - 5, pI.y);
               g.drawLine(pI.x + size + 5, pI.y, pI.x + 5, pI.y);
               g.drawLine(pI.x, pI.y + size + 5, pI.x, pI.y + 5);
               g.drawLine(pI.x, pI.y - size - 5, pI.x, pI.y - 5);
            }
         }
      }
      if (this.gprops.showLabels)
      {
         g.pen = penLabel;
         for (var i = 0; i < objects.length; i++)
         {
            if (drawInfo[i])
               for (var l = 0; l < 8; l++)
                  this.DrawLabel(g, objects[i], this.gprops.labelFields[l], l, font, drawInfo[i].size + 5, drawInfo[i].pI, graphicsScale);
         }
      }
   }

   this.DrawLabel = function (g, object, field, align, font, size, pI, graphicsScale)
   {
      if (field == null || field.length == 0)
         return;
      var label = null;
      if (field == "Name")
      {
         if (object.name)
            label = [ object.name ];
      }
      else if (field == "Coordinates")
         label = [ DMSangle.FromAngle(object.posRD.x * 24 / 360).ToString(true), DMSangle.FromAngle(object.posRD.y).ToString() ];
      else if (field == "Magnitude" && object.magnitude != null)
         label = [ format("%.2f", object.magnitude) ];
      else if (object[field])
         label = [ object[field] ];
      else
         return;

      if (label == null)
         return;
      var labelHeight = label.length * this.gprops.labelSize * graphicsScale;
      for (var line = 0; line < label.length; line++)
      {
         var rect = font.tightBoundingRect(label[line]);

         var posX;
         if (align == 0 || align == 3 || align == 5) // Left
            posX = pI.x - size - rect.width;
         else if (align == 1 || align == 6) // HCenter
            posX = pI.x - rect.width / 2;
         else // Right
            posX = pI.x + size;

         //         var offsetY = (align==1 || align==6) ? size : 0;
         var offsetY = Math.max(size, this.gprops.labelSize * graphicsScale);
         var posY;
         if (align >= 0 && align <= 2) // Top
            posY = pI.y - offsetY - labelHeight + (line + 1) * this.gprops.labelSize * graphicsScale;
         else if (align == 3 || align == 4) // VCenter
            posY = pI.y - labelHeight / 2 + (line + 1) * this.gprops.labelSize * graphicsScale;
         else // Bottom
            posY = pI.y + offsetY + (line + 1) * this.gprops.labelSize * graphicsScale;

         g.drawText(posX, posY, label[line]);
      }
   }

   this.ToFile = function (file, metadata)
   {
      var objects = this.catalog.objects;
      if (objects.length == 0)
         return;

      // Write catalog header
      file.outTextLn(this.catalog.name);
      file.outTextLn(this.catalog.description);

      file.outText("Name;RA(deg);Dec(deg);PixelX;PixelY");
      for (var f = 0; f < this.catalog.fields.length; f++)
      {
         var field = this.catalog.fields[f];
         if (field != "Name" && field != "Coordinates")
            file.outText(";" + field);
      }
      file.outText("\n");

      // Write objects data
      for (var i = 0; i < objects.length; i++)
      {
         if (!objects[i])
            continue;

         //Coordinates validation
         if (!(objects[i].posRD.x >= 0 && objects[i].posRD.x <= 360))
            continue;
         if (!(objects[i].posRD.y >= -90 && objects[i].posRD.y <= 90))
            continue;

         var pI = metadata.Convert_RD_I(objects[i].posRD);
         if (pI == null)
            continue;
         if (pI.x < 0 || pI.y < 0 || pI.x > metadata.width || pI.y > metadata.height)
            continue;

         file.outText(format("%ls;%f;%f;%f;%f", objects[i].name, objects[i].posRD.x, objects[i].posRD.y, pI.x, pI.y));
         for (var f = 0; f < this.catalog.fields.length; f++)
         {
            var field = this.catalog.fields[f];
            if (field == "Magnitude")
            {
               file.outText(";");
               if (objects[i].magnitude != null)
                  file.outText(format("%.2f", objects[i].magnitude));
            }
            else if (field != "Name" && field != "Coordinates")
            {
               file.outText(";");
               if (field in objects[i])
                  file.outText(objects[i][field].toString());
            }
         }
         file.outText("\n");
      }
      file.outText("\n");
   }
}

CatalogLayer.prototype = new Layer;
for (var c = 0; c < __catalogRegister__.catalogs.length; c++)
{
   var catalog = __catalogRegister__.GetCatalog(c);
   RegisterLayer(new CatalogLayer(catalog));
}

// ******************************************************************
// TextLayer: Draws a text on the image
// ******************************************************************
function TextLayer()
{
   this.layerName = "Text";
   this.layerDescription = "User defined text";

   this.__base__ = Layer;
   this.__base__();

   this.positionX = 0;
   this.positionY = 100;
   this.text = "";
   this.gprops.lineColor = 0x30000000;
   this.gprops.labelColor = 0xffffffff;
   this.gprops.labelSize = 14;
   this.properties.push([ "positionX", DataType_Double ]);
   this.properties.push([ "positionY", DataType_Double ]);
   this.properties.push([ "text", DataType_UCString ]);

   this.GetConstructor = function ()
   {
      return "new TextLayer()";
   }

   this.GetEditPanel = function (parent)
   {
      // Font
      var labelSize_Label = new Label(parent);
      labelSize_Label.text = "Font:";
      labelSize_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
      labelSize_Label.minWidth = parent.labelWidth2;
      this.labelSize_Label = labelSize_Label;

      var labelFace_Combo = new ComboBox(parent);
      labelFace_Combo.editEnabled = false;
      labelFace_Combo.addItem("SansSerif");
      labelFace_Combo.addItem("Serif");
      labelFace_Combo.addItem("Script");
      labelFace_Combo.addItem("TypeWriter");
      labelFace_Combo.addItem("Decorative");
      labelFace_Combo.addItem("Symbol");
      labelFace_Combo.currentItem = this.gprops.labelFace - 1;
      labelFace_Combo.onItemSelected = function ()
      {
         this.dialog.activeFrame.object.gprops.labelFace = labelFace_Combo.currentItem + 1;
      }
      this.labelFace_Combo = labelFace_Combo;

      var labelSize_SpinBox = new SpinBox(parent);
      labelSize_SpinBox.minValue = 6;
      labelSize_SpinBox.maxValue = 72;
      labelSize_SpinBox.value = this.gprops.labelSize;
      labelSize_SpinBox.toolTip = "<p>Font size of the text.</p>";
      labelSize_SpinBox.onValueUpdated = function (value)
      {
         this.dialog.activeFrame.object.gprops.labelSize = value;
      };

      var labelBold_Check = new CheckBox(parent);
      labelBold_Check.checked = this.gprops.labelBold;
      labelBold_Check.text = "Bold";
      labelBold_Check.toolTip = "<p>Bold font.</p>";
      labelBold_Check.onCheck = function (checked)
      {
         this.dialog.activeFrame.object.gprops.labelBold = checked;
      };
      this.labelBold_Check = labelBold_Check;

      var labelItalic_Check = new CheckBox(parent);
      labelItalic_Check.checked = this.gprops.labelItalic;
      labelItalic_Check.text = "Italic";
      labelItalic_Check.toolTip = "<p>Italic font.</p>";
      labelItalic_Check.onCheck = function (checked)
      {
         this.dialog.activeFrame.object.gprops.labelItalic = checked;
      };
      this.labelItalic_Check = labelItalic_Check;

      var font_Sizer = new HorizontalSizer;
      font_Sizer.spacing = 4;
      font_Sizer.add(labelSize_Label);
      font_Sizer.add(labelFace_Combo);
      font_Sizer.add(labelSize_SpinBox);
      font_Sizer.add(labelBold_Check);
      font_Sizer.add(labelItalic_Check);
      font_Sizer.addStretch();
      this.font_Sizer = font_Sizer;

      // Foreground color
      var fcolor_Label = new Label(parent);
      fcolor_Label.text = "Text color:";
      fcolor_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
      fcolor_Label.minWidth = parent.labelWidth2;
      this.fcolor_Label = fcolor_Label;

      var fcolor_ColorControl = new TransparentColorControl(parent, this.gprops.labelColor, "Text color");
      fcolor_ColorControl.onColorChanged = function (color)
      {
         this.dialog.activeFrame.object.gprops.labelColor = color;
      };
      this.fcolor_ColorControl = fcolor_ColorControl;

      var fcolor_Sizer = new HorizontalSizer;
      fcolor_Sizer.spacing = 4;
      fcolor_Sizer.add(fcolor_Label);
      fcolor_Sizer.add(fcolor_ColorControl);
      fcolor_Sizer.addStretch();
      this.fcolor_Sizer = fcolor_Sizer;

      // Background color
      var bcolor_Label = new Label(parent);
      bcolor_Label.text = "Background:";
      bcolor_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
      bcolor_Label.minWidth = parent.labelWidth2;
      this.bcolor_Label = bcolor_Label;

      var bcolor_ColorControl = new TransparentColorControl(parent, this.gprops.lineColor, "Background color");
      bcolor_ColorControl.onColorChanged = function (color)
      {
         this.dialog.activeFrame.object.gprops.lineColor = color;
      };
      this.bcolor_ColorControl = bcolor_ColorControl;

      var bcolor_Sizer = new HorizontalSizer;
      bcolor_Sizer.spacing = 4;
      bcolor_Sizer.add(bcolor_Label);
      bcolor_Sizer.add(bcolor_ColorControl);
      bcolor_Sizer.addStretch();
      this.bcolor_Sizer = bcolor_Sizer;

      // Position
      var position_Label = new Label(parent);
      position_Label.text = "Position:";
      position_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
      position_Label.minWidth = parent.labelWidth2;
      this.position_Label = position_Label;

      var positionX_Label = new Label(parent);
      positionX_Label.text = "X=";
      positionX_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
      this.positionX_Label = positionX_Label;

      var positionX_Spin = new SpinBox(parent);
      positionX_Spin.minValue = 0;
      positionX_Spin.maxValue = 100;
      positionX_Spin.suffix = "%";
      positionX_Spin.value = this.positionX;
      positionX_Spin.toolTip = "<p>Horizontal position of the text.<br/>" +
         "Using 0% the text is drawn at the left of the image.<br/>" +
         "50% is the center of the image and 100% is the right.</p>";
      positionX_Spin.onValueUpdated = function (value)
      {
         this.dialog.activeFrame.object.positionX = value;
      };
      this.positionX_Spin = positionX_Spin;

      var positionY_Label = new Label(parent);
      positionY_Label.text = "  Y=";
      positionY_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
      this.positionY_Label = positionY_Label;

      var positionY_Spin = new SpinBox(parent);
      positionY_Spin.minValue = 0;
      positionY_Spin.maxValue = 100;
      positionY_Spin.value = this.positionY;
      positionY_Spin.suffix = "%";
      positionY_Spin.toolTip = "<p>Vertical position of the text.<br/>" +
         "Using 0% the text is drawn at the top of the image.<br/>" +
         "50% is the center of the image and 100% is the bottom.</p>";
      positionY_Spin.onValueUpdated = function (value)
      {
         this.dialog.activeFrame.object.positionY = value;
      };
      this.positionY_Spin = positionY_Spin;

      var positionSizer = new HorizontalSizer;
      positionSizer.spacing = 4;
      positionSizer.add(position_Label);
      positionSizer.add(positionX_Label);
      positionSizer.add(positionX_Spin);
      positionSizer.add(positionY_Label);
      positionSizer.add(positionY_Spin);
      positionSizer.addStretch();
      this.positionSizer = positionSizer;

      // Text
      var text_Label = new Label(parent);
      text_Label.text = "Text:";
      text_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
      text_Label.minWidth = parent.labelWidth2;
      this.text_Label = text_Label;
      var textLabel_Sizer = new HorizontalSizer;
      textLabel_Sizer.spacing = 4;
      textLabel_Sizer.add(text_Label);
      textLabel_Sizer.addStretch();
      this.textLabel_Sizer = textLabel_Sizer;

      var text_TextBox = new TextBox(parent);
      text_TextBox.text = this.text;
      //text_TextBox.font = text_Label.font;
      text_TextBox.styleSheet = "* { font-family: " + text_Label.font.face + "; font-size: " + text_Label.font.pointSize + "pt; }";
      text_TextBox.toolTip = "<p>User defined text. It supports the expansion of the following variables:</p>" +
         "<ul><li>%RA: Right Ascension of the center of the image.</li>" +
         "<li>%DEC: Declination of the center of the image.</li>" +
         "<li>%RESOLUTION: Resolution of the image in arcseconds/pixel.</li>" +
         "<li>%ROTATION: Rotation of the image in degrees.</li>" +
         "<li>%PROJECTION: Name of the projection.</li>" +
         "<li>%KEY-XXXX: Prints the value of the FITS keyword XXXX.<br/>" +
         "i.e. %KEY-FOCALLEN is substituted by the value of the keyword FOCALLEN.</li></ul>";
      text_TextBox.onTextUpdated = function ()
      {
         this.dialog.activeFrame.object.text = text_TextBox.text;
      }
      this.text_TextBox = text_TextBox;

      var frame = new Frame(parent);
      frame.sizer = new VerticalSizer;
      frame.sizer.margin = 6;
      frame.sizer.spacing = 4;
      frame.style = FrameStyle_Flat;
      frame.sizer.add(font_Sizer);
      frame.sizer.add(fcolor_Sizer);
      frame.sizer.add(bcolor_Sizer);
      frame.sizer.add(positionSizer);
      frame.sizer.add(textLabel_Sizer);
      frame.sizer.add(text_TextBox);
      frame.sizer.addStretch();
      frame.object = this;
      return frame;
   };

   this.Draw = function (g, metadata, bounds, imageWnd, graphicsScale)
   {
      var finalText = this.ExpandVariables(metadata, imageWnd.keywords);

      var margin = 3;
      var imageWidth = imageWnd.mainView.image.width - margin * 2;
      var imageHeight = imageWnd.mainView.image.height - margin * 2;

      var font = new Font(this.gprops.labelFace, this.gprops.labelSize * graphicsScale);
      font.bold = this.gprops.labelBold;
      font.italic = this.gprops.labelItalic;
      g.font = font;
      g.pen = new Pen(this.gprops.labelColor);

      var lines = finalText.trim().split("\n");


      // Dimensions of the text
      var lineHeight = font.ascent + font.descent;
      var height = lines.length * lineHeight;
      var orgY = (imageHeight - height) * this.positionY / 100;

      // Background
      if ((this.gprops.lineColor & 0xff000000) != 0)
      {
         var maxWidth = 0;
         for (var i = 0; i < lines.length; i++)
            maxWidth = Math.max(maxWidth, font.tightBoundingRect(lines[i]).width);
         var left = (imageWidth - maxWidth) * this.positionX / 100;
         var top = orgY;
         var brush = new Brush(this.gprops.lineColor);
         g.fillRect(left, top, left + maxWidth + margin * 2, top + height + margin * 2, brush);
      }

      // Draw text lines
      for (var i = 0; i < lines.length; i++)
      {
         var rect = font.tightBoundingRect(lines[i]);
         g.drawText(
            (imageWidth - rect.width) * this.positionX / 100 + margin,
            orgY + i * lineHeight + font.ascent + margin,
            lines[i]);
      }
   }

   this.ExpandVariables = function (metadata, keywords)
   {
      var expanded = this.text;

      // RA
      for (var pos = expanded.indexOf("%RA"); pos >= 0; pos = expanded.indexOf("%RA"))
         expanded = expanded.replace("%RA", DMSangle.FromAngle(metadata.ra * 24 / 360).ToString(true));

      // DEC
      for (var pos = expanded.indexOf("%DEC"); pos >= 0; pos = expanded.indexOf("%DEC"))
         expanded = expanded.replace("%DEC", DMSangle.FromAngle(metadata.dec).ToString());

      // Resolution
      for (var pos = expanded.indexOf("%RESOLUTION"); pos >= 0; pos = expanded.indexOf("%RESOLUTION"))
         expanded = expanded.replace("%RESOLUTION", format("%.3f", metadata.resolution * 3600));

      // Resolution
      for (var pos = expanded.indexOf("%PROJECTION"); pos >= 0; pos = expanded.indexOf("%PROJECTION"))
         expanded = expanded.replace("%PROJECTION", metadata.projection.name);

      // Rotation
      for (var pos = expanded.indexOf("%ROTATION"); pos >= 0; pos = expanded.indexOf("%ROTATION"))
      {
         var rotation = metadata.GetRotation();
         expanded = expanded.replace("%ROTATION", format("%.2f", rotation[0]) + (rotation[1] ? " (flipped)" : ""));
      }

      // FITS Keyword
      for (var pos = expanded.indexOf("%KEY-"); pos >= 0; pos = expanded.indexOf("%KEY-", pos))
      {
         var keyIdx = this.FindKeyword(expanded.substr(pos + 5), keywords);
         if (keyIdx >= 0)
         {
            var value = keywords[keyIdx].value.trim();
            if (value.charAt(0) == "'")
               value = value.substr(1);
            if (value.charAt(value.length - 1) == "'")
               value = value.substr(0, value.length - 1);
            expanded = expanded.replace("%KEY-" + keywords[keyIdx].name, value);
         }
         else
            pos++;
      }

      return expanded;
   }

   this.FindKeyword = function (str, keywords)
   {
      for (var i = 0; i < keywords.length; i++)
      {
         if (str.indexOf(keywords[i].name) == 0)
            return i;
      }
      return -1;
   }
}

TextLayer.prototype = new Layer;
RegisterLayer(new TextLayer);


// ******************************************************************
// AddLayerDialog: Selects the layer class to add
// ******************************************************************
function AddLayerDialog()
{
   this.__base__ = Dialog;
   this.__base__();
   this.restyle();

   this.helpLabel = new Label(this);
   this.helpLabel.text = "Select the layer class to add:"

   this.addLayer_List = new TreeBox(this);
   this.addLayer_List.alternateRowColor = false;
   this.addLayer_List.multipleSelection = false;
   this.addLayer_List.headerVisible = true;
   this.addLayer_List.numberOfColumns = 2;
   this.addLayer_List.setHeaderText(0, "Layer Class");
   this.addLayer_List.setHeaderText(1, "Description");
   this.addLayer_List.rootDecoration = false;
   this.addLayer_List.setMinSize(this.logicalPixelsToPhysical( 550 ), this.font.pixelSize * 30);
   for (var l = 0; l < __layerRegister__.length; l++)
   {
      var node = new TreeBoxNode(this.addLayer_List);
      node.layer = eval(__layerRegister__[l].constructor);
      node.checkable = false;
      node.setText(0, node.layer.layerName);
      node.setText(1, node.layer.layerDescription);
      this.addLayer_List.adjustColumnWidthToContents(1);
   }

   // Buttons

   this.ok_Button = new PushButton(this);
   this.ok_Button.defaultButton = true;
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function ()
   {
      if (this.dialog.addLayer_List.selectedNodes == 0)
      {
         var msg = new MessageBox("There is not any selected layer.",
            TITLE, StdIcon_Error, StdButton_Ok);
         msg.execute();
         return;
      }
      this.dialog.layer = this.dialog.addLayer_List.selectedNodes[0].layer;
      this.dialog.ok();
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
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add(this.ok_Button);
   this.buttons_Sizer.add(this.cancel_Button);

   // Global sizer
   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 6;
   this.sizer.add(this.helpLabel);
   this.sizer.add(this.addLayer_List);
   this.sizer.addSpacing(6);
   this.sizer.add(this.buttons_Sizer);

   this.windowTitle = "Add Layer";
   this.adjustToContents();
}

AddLayerDialog.prototype = new Dialog;

// ******************************************************************
// PreviewDialog: Shows a preview of the annotated image
// ******************************************************************
function PreviewDialog(image, metadata)
{
   this.__base__ = Dialog;
   this.__base__();
   this.restyle();

   this.previewControl = new PreviewControl(this);
   this.previewControl.SetImage(image, metadata);

   // Buttons

   this.ok_Button = new PushButton(this);
   this.ok_Button.defaultButton = true;
   this.ok_Button.text = "Close";
   this.ok_Button.icon = this.scaledResource( ":/icons/close.png" );
   this.ok_Button.onClick = function ()
   {
      this.dialog.ok();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add(this.ok_Button);

   // Global sizer
   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 6;
   this.sizer.add(this.previewControl);
   this.sizer.addSpacing(2);
   this.sizer.add(this.buttons_Sizer);

   this.windowTitle = "Preview annotation";
   this.adjustToContents();
   this.resize(800, 800);
}
PreviewDialog.prototype = new Dialog;

// ******************************************************************
// AnnotateDialog: Configuration dialog for annotation engine
// ******************************************************************
function AnnotateDialog(engine)
{
   this.__base__ = Dialog;
   this.__base__();
   this.restyle();

   this.labelWidth1 = this.font.width("Magnitude filter:" + 'M');
   this.labelWidth2 = this.font.width("Background:");
   //var radioLabelWidth = this.font.width( "Resolution (arcsec/px):" );
   this.editWidth = this.font.width("12.888");

   this.engine = engine;
   this.layers = engine.layers;

   this.ActivateLayer = function (node)
   {
      if (this.dialog.activeFrame)
      {
         this.dialog.paramsContainer.sizer.remove(this.dialog.activeFrame);
         this.dialog.activeFrame.visible = false;
      }
      if (node)
      {
         this.dialog.paramsContainer.sizer.add(node.frame);
         this.dialog.activeFrame = node.frame;
         this.dialog.activeFrame.visible = true;
         this.dialog.paramsContainer.title = node.text(0) + " Parameters";
      }
      this.dialog.adjustToContents();
   };

   this.AddLayerToTree = function (layer)
   {
      var node = new TreeBoxNode(this.layer_TreeBox);
      node.checkable = true;
      node.checked = layer.visible;
      node.setText(0, layer.layerName);
      node.setText(1, layer.layerDescription);
      node.frame = layer.GetEditPanel(this);
      node.frame.visible = false;
      this.layer_TreeBox.adjustColumnWidthToContents(1);
      return node;
   }

   this.helpLabel = new Label(this);
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.minWidth = 45 * this.font.width('M');
   this.helpLabel.margin = 6;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text =
      "<p><b>Image Annotation v" + VERSION + "</b> &mdash; A script for annotating astronomical images.<br/><br/>" +
         "This script draws on the image coordinate grids and symbols of objects extracted from different astronomical catalogs.<br/>" +
         "The script requires the image to have coordinates stored in FITS header keywords following the WCS convention.<br/>" +
         "The Image Plate Solver script can be used to generate these coordinates and keywords.<br/>" +
         "<br/>" +
         "Copyright &copy; 2012-2013 Andr&eacute;s del Pozo</p>";

   // Layers
   this.layer_TreeBox = new TreeBox(this);
   this.activeFrame = null;
   this.layer_TreeBox.alternateRowColor = false;
   this.layer_TreeBox.multipleSelection = false;
   this.layer_TreeBox.headerVisible = true;
   this.layer_TreeBox.numberOfColumns = 2;
   this.layer_TreeBox.setHeaderText(0, "Layer");
   this.layer_TreeBox.setHeaderText(1, "Description");
   this.layer_TreeBox.rootDecoration = false;
   this.layer_TreeBox.setMinSize(this.logicalPixelsToPhysical( 400 ), this.font.pixelSize * 22);
   this.layer_TreeBox.toolTip = "<p>Only checked layers are drawn on the result image.<br />" +
      "The panel at the right shows the configuration of the currently selected layer.</p>";
   this.layer_TreeBox.onCurrentNodeUpdated = function (node)
   {
      this.dialog.ActivateLayer(node);
   }

   this.addLayer_Button = new ToolButton(this);
   this.addLayer_Button.icon = this.scaledResource( ":/icons/add.png" );
   this.addLayer_Button.setScaledFixedSize( 20, 20 );
   this.addLayer_Button.toolTip = "Add layer";
   this.addLayer_Button.onMousePress = function ()
   {
      this.hasFocus = true;
      var dlg = new AddLayerDialog(this);
      if (dlg.execute())
      {
         var node = this.dialog.AddLayerToTree(dlg.layer);
         for (var i = 0; i < this.dialog.layer_TreeBox.numberOfChildren; i++)
         {
            var child = this.dialog.layer_TreeBox.child(i);
            child.selected = child == node;
         }
         this.dialog.layer_TreeBox.setNodeIntoView(node);
         this.dialog.ActivateLayer(node);
      }
      this.pushed = false;
   };

   this.deleteLayer_Button = new ToolButton(this);
   this.deleteLayer_Button.icon = this.scaledResource( ":/icons/delete.png" );
   this.deleteLayer_Button.setScaledFixedSize( 20, 20 );
   this.deleteLayer_Button.toolTip = "Delete layer";
   this.deleteLayer_Button.onMousePress = function ()
   {
      this.hasFocus = true;

      var lastRemoved = -1;
      var selected = this.dialog.layer_TreeBox.selectedNodes;
      for (var node = 0; node < selected.length; node++)
      {
         lastRemoved = this.dialog.layer_TreeBox.childIndex(selected[node]);
         this.dialog.layer_TreeBox.remove(lastRemoved);
      }

      if (this.dialog.layer_TreeBox.numberOfChildren > 0)
      {
         if (lastRemoved >= 0)
         {
            var nodeIdx = Math.min(lastRemoved, this.dialog.layer_TreeBox.numberOfChildren - 1);
            var node = this.dialog.layer_TreeBox.child(nodeIdx);
            this.dialog.ActivateLayer(node);
         }
      }
      else
      {
         this.dialog.ActivateLayer(null);
      }

      this.pushed = false;
   };

   this.moveUpLayer_Button = new ToolButton(this);
   this.moveUpLayer_Button.icon = this.scaledResource( ":/browser/move-up.png" );
   this.moveUpLayer_Button.setScaledFixedSize( 20, 20 );
   this.moveUpLayer_Button.toolTip = "Move layer up";
   this.moveUpLayer_Button.onMousePress = function ()
   {
      this.hasFocus = true;

      var lastRemoved = -1;
      if (this.dialog.layer_TreeBox.selectedNodes.length > 0)
      {
         var selected = this.dialog.layer_TreeBox.selectedNodes[0];
         var selectedIdx = this.dialog.layer_TreeBox.childIndex(selected);
         if (selectedIdx > 0)
         {
            this.dialog.layer_TreeBox.remove(selectedIdx);
            this.dialog.layer_TreeBox.insert(selectedIdx - 1, selected);
            this.dialog.ActivateLayer(selected);
            while (this.dialog.layer_TreeBox.selectedNodes.length > 0)
               this.dialog.layer_TreeBox.selectedNodes[0].selected = false;
            selected.selected = true;
         }
      }
      this.pushed = false;
   }

   this.moveDownLayer_Button = new ToolButton(this);
   this.moveDownLayer_Button.icon = this.scaledResource( ":/browser/move-down.png" );
   this.moveDownLayer_Button.setScaledFixedSize( 20, 20 );
   this.moveDownLayer_Button.toolTip = "Move layer down";
   this.moveDownLayer_Button.onMousePress = function ()
   {
      this.hasFocus = true;

      var lastRemoved = -1;
      if (this.dialog.layer_TreeBox.selectedNodes.length > 0)
      {
         var selected = this.dialog.layer_TreeBox.selectedNodes[0];
         var selectedIdx = this.dialog.layer_TreeBox.childIndex(selected);
         if (selectedIdx < this.dialog.layer_TreeBox.numberOfChildren - 1)
         {
            this.dialog.layer_TreeBox.remove(selectedIdx);
            this.dialog.layer_TreeBox.insert(selectedIdx + 1, selected);
            this.dialog.ActivateLayer(selected);
            while (this.dialog.layer_TreeBox.selectedNodes.length > 0)
               this.dialog.layer_TreeBox.selectedNodes[0].selected = false;
            selected.selected = true;
         }
      }
      this.pushed = false;
   }

   this.layerButtonsSizer = new HorizontalSizer;
   this.layerButtonsSizer.spacing = 6;
   this.layerButtonsSizer.add(this.addLayer_Button);
   this.layerButtonsSizer.add(this.deleteLayer_Button);
   this.layerButtonsSizer.addSpacing(6);
   this.layerButtonsSizer.add(this.moveUpLayer_Button);
   this.layerButtonsSizer.add(this.moveDownLayer_Button);
   this.layerButtonsSizer.addStretch();

   this.layersSizer = new VerticalSizer;
   this.layersSizer.spacing = 4;
   this.layersSizer.add(this.layer_TreeBox, 100);
   this.layersSizer.add(this.layerButtonsSizer);

   this.paramsContainer = new GroupBox(this);
   this.paramsContainer.sizer = new VerticalSizer;
   this.paramsContainer.minWidth = this.font.width("a") * 50;

   this.layerGroup = new GroupBox(this);
   this.layerGroup.title = "Layers";
   this.layerGroup.sizer = new HorizontalSizer;
   this.layerGroup.sizer.margin = 8;
   this.layerGroup.sizer.spacing = 8;
   this.layerGroup.sizer.add(this.layersSizer, 100);
   this.layerGroup.sizer.add(this.paramsContainer);

   for (var l = 0; l < this.layers.length; l++)
   {
      var node = this.AddLayerToTree(this.layers[l]);
      node.selected = l == 0;
   }

   this.layer_TreeBox.currentNode = this.layer_TreeBox.child(0);
   this.ActivateLayer(this.layer_TreeBox.child(0));

   // Epoch
   var epochToolTip = "<p>Date on which the image was taken.<br/>" +
      "It is used by the catalogs that support proper motion computation.</p>"
   this.epoch_Label = new Label(this);
   this.epoch_Label.text = "Epoch (ymd):";
   this.epoch_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.epoch_Label.setFixedWidth(this.labelWidth1);

   var epochArray = engine.epoch == null ? [ 2000, 1, 1] : Math.jdToComplexTime(engine.epoch);
   var epoch = new Date(epochArray[0], epochArray[1] - 1, epochArray[2]);

   this.epoch_year_SpinBox = new SpinBox(this);
   this.epoch_year_SpinBox.minValue = 0;
   this.epoch_year_SpinBox.maxValue = 3000;
   this.epoch_year_SpinBox.value = epoch.getFullYear();
   this.epoch_year_SpinBox.toolTip = epochToolTip;
   // this.epoch_year_SpinBox.setFixedWidth( this.editWidth );
   this.epoch_year_SpinBox.onValueUpdated = function (value)
   {
      epoch.setFullYear(value);
   };

   this.epoch_mon_SpinBox = new SpinBox(this);
   this.epoch_mon_SpinBox.minValue = 1;
   this.epoch_mon_SpinBox.maxValue = 12;
   this.epoch_mon_SpinBox.value = epoch.getMonth() + 1;
   this.epoch_mon_SpinBox.toolTip = epochToolTip;
   // this.epoch_mon_SpinBox.setFixedWidth( this.editWidth );
   this.epoch_mon_SpinBox.onValueUpdated = function (value)
   {
      epoch.setMonth(value - 1);
   };

   this.epoch_day_SpinBox = new SpinBox(this);
   this.epoch_day_SpinBox.minValue = 1;
   this.epoch_day_SpinBox.maxValue = 31;
   this.epoch_day_SpinBox.value = epoch.getDate();
   this.epoch_day_SpinBox.toolTip = epochToolTip;
   // this.epoch_day_SpinBox.setFixedWidth( this.editWidth );
   this.epoch_day_SpinBox.onValueUpdated = function (value)
   {
      epoch.setDate(value);
   };

   this.epoch_Sizer = new HorizontalSizer;
   this.epoch_Sizer.spacing = 4;
   this.epoch_Sizer.add(this.epoch_Label);
   this.epoch_Sizer.add(this.epoch_year_SpinBox);
   this.epoch_Sizer.add(this.epoch_mon_SpinBox);
   this.epoch_Sizer.add(this.epoch_day_SpinBox);
   this.epoch_Sizer.addStretch();

   // Server mirror
   this.mirror_Label = new Label(this);
   this.mirror_Label.text = "Vizier server:";
   this.mirror_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.mirror_Label.minWidth = this.labelWidth1;

   this.mirror_Combo = new ComboBox(this);
   this.mirror_Combo.editEnabled = false;
   for (var m = 0; m < VizierCatalog.mirrors.length; m++)
   {
      this.mirror_Combo.addItem(VizierCatalog.mirrors[m].name);
      if (VizierCatalog.mirrors[m].address == this.engine.vizierServer)
         this.mirror_Combo.currentItem = parseInt(m);
   }
   this.mirror_Combo.onItemSelected = function ()
   {
      this.dialog.engine.vizierServer = VizierCatalog.mirrors[this.dialog.mirror_Combo.currentItem].address;
   };

   this.clearCache = new PushButton(this);
   this.clearCache.text = "Clear cache";
   this.clearCache.toolTip = "<p>Clears the catalog cache. This makes the script to reload all the catalog data.<br>" +
      "This is useful when there has been any problem before.</p>";
   this.clearCache.onMousePress = function ()
   {
      if (__vizier_cache__)
         __vizier_cache__ = null;
      new MessageBox("VizieR cache cleared", TITLE, StdIcon_Information).execute();
   }

   this.mirrorSizer = new HorizontalSizer;
   this.mirrorSizer.spacing = 4;
   this.mirrorSizer.add(this.mirror_Label);
   this.mirrorSizer.add(this.mirror_Combo);
   this.mirrorSizer.add(this.clearCache);
   this.mirrorSizer.addStretch();

   // Output mode
   this.output_Label = new Label(this);
   this.output_Label.text = "Output mode:";
   this.output_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   this.output_Label.minWidth = this.labelWidth1;

   this.output_Combo = new ComboBox(this);
   this.output_Combo.editEnabled = false;
   this.output_Combo.addItem("Annotate image");
   this.output_Combo.addItem("Generate transparent overlay");
   this.output_Combo.addItem("Generate SVG overlay");
   this.output_Combo.toolTip = "<p>The output of the script can be:</p>" +
      "<ul><li><b>Annotate image</b>: Generates a new RGB image with the annotation drawn over the original data.</li>" +
      "<li><b>Generate transparent overlay</b>: Generates a new transparent image with the annotation. It can be saved and used in other applications.</li>" +
      "<li><b>Generate SVG overlay</b>: Generates a SVG file with the annotation.</ul>";
   this.output_Combo.currentItem = engine.outputMode;
   this.output_Combo.onItemSelected = function ()
   {
      this.dialog.engine.outputMode = this.dialog.output_Combo.currentItem;
      this.dialog.stf_Check.visible = this.dialog.output_Combo.currentItem == Output_Image;
      this.dialog.svgFile_Frame.visible = this.dialog.output_Combo.currentItem == Output_SVG;
   }

   this.stf_Check = new CheckBox(this);
   this.stf_Check.text = "Apply STF before annotation";
   this.stf_Check.toolTip = "<p>Applies the STF transformation to the image before the annotation.<br />" +
      "This is usually necessary when the original image is lineal.</p>";
   this.stf_Check.checked = this.engine.applySTF;
   this.stf_Check.visible = this.engine.outputMode == Output_Image;
   this.stf_Check.onCheck = function (checked)
   {
      this.dialog.engine.applySTF = checked;
   };

   //
   this.svgFile_Label = new Label(this);
   this.svgFile_Label.text = "SVG file path:";
   this.svgFile_Label.textAlignment = TextAlign_Left | TextAlign_VertCenter;

   this.svgFile_Edit = new Edit(this);
   if (engine.svgPath)
      this.svgFile_Edit.text = engine.svgPath;
   this.svgFile_Edit.setScaledMinWidth(250);
   this.svgFile_Edit.toolTip = "<p>Path where the SVG file is saved.</p>"
   this.svgFile_Edit.onTextUpdated = function (value)
   {
      engine.svgPath = value;
   };

   this.svgFile_Button = new ToolButton(this);
   this.svgFile_Button.icon = this.scaledResource( ":/icons/select-file.png" );
   this.svgFile_Button.setScaledFixedSize( 20, 20 );
   this.svgFile_Button.toolTip = "<p>Select the SVG file path.</p>";
   this.svgFile_Button.onClick = function ()
   {
      var sfd = new SaveFileDialog();
      if (engine.svgPath)
         sfd.initialPath = engine.svgPath;
      sfd.caption = "Select the SVG file path";
      sfd.filters = [
         [ "SVG Files", ".svg" ]
      ];
      if (sfd.execute())
      {
         engine.svgPath = sfd.fileName;
         this.dialog.svgFile_Edit.text = sfd.fileName;
      }
   };

   this.svgFile_Frame = new Frame(this);
   this.svgFile_Frame.sizer = new HorizontalSizer;
   this.svgFile_Frame.sizer.margin = 0;
   this.svgFile_Frame.sizer.spacing = 4;
   this.svgFile_Frame.style = FrameStyle_Flat;
   this.svgFile_Frame.sizer.add(this.svgFile_Label);
   this.svgFile_Frame.sizer.add(this.svgFile_Edit);
   this.svgFile_Frame.sizer.add(this.svgFile_Button);
   this.svgFile_Frame.visible = this.engine.outputMode == Output_SVG;

   this.outputSizer = new HorizontalSizer;
   this.outputSizer.spacing = 4;
   this.outputSizer.add(this.output_Label);
   this.outputSizer.add(this.output_Combo);
   this.outputSizer.add(this.stf_Check);
   this.outputSizer.add(this.svgFile_Frame);
   this.outputSizer.addStretch();


   // Remove duplicates
   this.duplicates_Check = new CheckBox(this);
   this.duplicates_Check.text = "Remove duplicate objects";
   this.duplicates_Check.checked = this.engine.removeDuplicates;
   this.duplicates_Check.onCheck = function (checked)
   {
      this.dialog.engine.removeDuplicates = checked;
   };

   this.duplicatesSizer = new HorizontalSizer;
   this.duplicatesSizer.spacing = 4;
   this.duplicatesSizer.addSpacing(this.labelWidth1 + 4);
   this.duplicatesSizer.add(this.duplicates_Check);
   this.duplicatesSizer.addStretch();

   // Write objects in text file
   this.writeObjects_Check = new CheckBox(this);
   this.writeObjects_Check.text = "Write objects to a text file";
   this.writeObjects_Check.toolTip = "<p>The script writes a text file with the catalog objects inside the image.<br/>"+
      "If the image has a file path, the text file will be saved using the same directory and filename "+
      "but with the extension .objects.txt.<br/>"+
      "If the image has not a file path the script will ask for the path of the text file using the standard file dialog.</p>";
   this.writeObjects_Check.checked = "writeObjects" in this.engine ? this.engine.writeObjects : false;
   this.writeObjects_Check.onCheck = function (checked)
   {
      this.dialog.engine.writeObjects = checked;
   };
   this.writeObjectsSizer = new HorizontalSizer;
   this.writeObjectsSizer.spacing = 4;
   this.writeObjectsSizer.addSpacing(this.labelWidth1 + 4);
   this.writeObjectsSizer.add(this.writeObjects_Check);
   this.writeObjectsSizer.addStretch();


   // SymbologyScale
   this.symbolScale_Control = new NumericControl(this);
   this.symbolScale_Control.real = true;
   this.symbolScale_Control.label.text = "Graphics scale:";
   this.symbolScale_Control.label.minWidth = this.labelWidth1;
   this.symbolScale_Control.setRange(0.1, 5);
   this.symbolScale_Control.slider.setRange(0, 49);
   this.symbolScale_Control.slider.scaledMinWidth = 250;
   this.symbolScale_Control.setPrecision(1);
   this.symbolScale_Control.edit.minWidth = this.editWidth;
   this.symbolScale_Control.setValue(this.engine.graphicsScale);
   this.symbolScale_Control.toolTip = "<p>Scale factor used when drawing elements on the image.<br/>" +
      "This parameter is usefull for changing the size of all the elements of the image at the same time.</p>";
   this.symbolScale_Control.onValueUpdated = function (value)
   {
      engine.graphicsScale = value;
   };

   this.symbolScaleSizer = new HorizontalSizer;
   this.symbolScaleSizer.spacing = 4;
   this.symbolScaleSizer.add(this.symbolScale_Control);
   this.symbolScaleSizer.addStretch();


   this.generalGroup = new GroupBox(this);
   this.generalGroup.title = "General Properties";
   this.generalGroup.sizer = new VerticalSizer;
   this.generalGroup.sizer.spacing = 4;
   this.generalGroup.sizer.margin = 6;
   this.generalGroup.sizer.add(this.outputSizer);
   this.generalGroup.sizer.add(this.epoch_Sizer);
   this.generalGroup.sizer.add(this.mirrorSizer);
   this.generalGroup.sizer.add(this.duplicatesSizer);
   this.generalGroup.sizer.add(this.writeObjectsSizer);
   this.generalGroup.sizer.add(this.symbolScaleSizer);

   // usual control buttons

   this.newInstanceButton = new ToolButton(this);
   this.newInstanceButton.icon = this.scaledResource( ":/process-interface/new-instance.png" );
   this.newInstanceButton.setScaledFixedSize( 20, 20 );
   this.newInstanceButton.toolTip = "New Instance";
   this.newInstanceButton.onMousePress = function ()
   {
      engine.layers = new Array();
      for (var i = 0; i < this.dialog.layer_TreeBox.numberOfChildren; i++)
      {
         var node = this.dialog.layer_TreeBox.child(i);
         node.frame.object.visible = node.checked;
         if (node.frame.object.Validate && !node.frame.object.Validate())
         {
            this.dialog.layer_TreeBox.currentNode = node;
            this.dialog.ActivateLayer(node);
            return;
         }
         engine.layers.push(node.frame.object);
      }

      this.dialog.engine.epoch = Math.complexTimeToJD(epoch.getFullYear(), epoch.getMonth() + 1, epoch.getDate());

      this.hasFocus = true;
      engine.SaveParameters();
      this.pushed = false;
      this.dialog.newInstance();
   };

   this.reset_Button = new ToolButton(this);
   this.reset_Button.icon = this.scaledResource( ":/icons/reload.png" );
   this.reset_Button.setScaledFixedSize( 20, 20 );
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

   this.preview_Button = new ToolButton(this);
   this.preview_Button.text = "Preview";
   this.preview_Button.icon = this.scaledResource( ":/icons/find.png" );
   this.preview_Button.setScaledFixedSize( 20, 20 );
   this.preview_Button.toolTip = "<p>Preview.</p>";
   this.preview_Button.onClick = function ()
   {
      // Set the missing parameters in the engine
      engine.layers = new Array();
      for (var i = 0; i < this.dialog.layer_TreeBox.numberOfChildren; i++)
      {
         var node = this.dialog.layer_TreeBox.child(i);
         node.frame.object.visible = node.checked;
         if (node.frame.object.Validate && !node.frame.object.Validate())
         {
            this.dialog.layer_TreeBox.currentNode = node;
            this.dialog.ActivateLayer(node);
            return;
         }
         engine.layers.push(node.frame.object);
      }
      engine.epoch = Math.complexTimeToJD(epoch.getFullYear(), epoch.getMonth() + 1, epoch.getDate());

      var image = engine.RenderPreview();
      var previewDlg = new PreviewDialog(image, engine.metadata);
      previewDlg.execute();
   };

   this.ok_Button = new PushButton(this);
   this.ok_Button.defaultButton = true;
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function ()
   {
      engine.layers = new Array();
      for (var i = 0; i < this.dialog.layer_TreeBox.numberOfChildren; i++)
      {
         var node = this.dialog.layer_TreeBox.child(i);
         node.frame.object.visible = node.checked;
         if (node.frame.object.Validate && !node.frame.object.Validate())
         {
            this.dialog.layer_TreeBox.currentNode = node;
            this.dialog.ActivateLayer(node);
            return;
         }
         engine.layers.push(node.frame.object);
      }

      this.dialog.engine.epoch = Math.complexTimeToJD(epoch.getFullYear(), epoch.getMonth() + 1, epoch.getDate());
      this.dialog.ok();
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
   this.buttons_Sizer.add(this.preview_Button);
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add(this.ok_Button);
   this.buttons_Sizer.add(this.cancel_Button);

   // Global sizer

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 6;
   this.sizer.add(this.helpLabel);
   this.sizer.addSpacing(4);
   this.sizer.add(this.layerGroup);
   this.sizer.add(this.generalGroup);
   this.sizer.add(this.buttons_Sizer);

   this.windowTitle = "Image Annotation Script";
   this.adjustToContents();
   //this.setMinSize(); /*###*/
}

AnnotateDialog.prototype = new Dialog;

// ******************************************************************
// AnnotationEngine: Annotation engine
// ******************************************************************
function AnnotationEngine()
{
   this.__base__ = ObjectWithSettings;
   this.__base__(
      SETTINGS_MODULE,
      "engine",
      new Array(
         [ "vizierServer", DataType_String ],
         [ "removeDuplicates", DataType_Boolean ],
         [ "outputMode", DataType_UInt8 ],
         [ "applySTF", DataType_Boolean ],
         [ "svgPath", DataType_String ],
         [ "graphicsScale", DataType_Double ],
         [ "writeObjects", DataType_Boolean ],
         [ "epoch", DataType_Double ]
      )
   );

   this.layers = new Array;
   this.vizierServer = "http://vizier.u-strasbg.fr/";
   this.removeDuplicates = true;
   this.outputMode = Output_Image;
   this.applySTF = true;
   this.svgPath = null;
   this.graphicsScale = 1;
   this.writeObjects = false;

   this.Init = function (w)
   {
      if (!w || !w.isWindow)
         throw Error("The script requires an image");
      this.window = w;

      if (!this.LoadParameters())
         if (!this.LoadSettings())
            this.SetDefaults();


      this.metadata = new ImageMetadata();
      this.metadata.ExtractMetadata(w);

      if (this.metadata.ref_I_G == null)
         throw Error("The image has not WCS coordinates");

      if (this.metadata.epoch)
         this.epoch = this.metadata.epoch;
      this.metadata.Print();
   };

   this.SetDefaults = function ()
   {
      this.layers = new Array;
      this.layers.push(new GridLayer);
      this.layers.push(new ConstBordersLayer);
      this.layers.push(new ConstLinesLayer);
      this.layers.push(new CatalogLayer(new NamedStarsCatalog));
      this.layers.push(new CatalogLayer(new MessierCatalog));
      this.layers.push(new CatalogLayer(new NGCICCatalog));
      this.layers.push(new CatalogLayer(new TychoCatalog));
      this.layers.push(new CatalogLayer(new PGCCatalog));

      // Set default parameters
      // GridLayer
      this.layers[0].visible = true;
      this.layers[0].gprops.lineColor = 0x80ffffff;

      // ConstellationBorders
      this.layers[1].visible = false;
      this.layers[1].gprops.lineColor = 0x8000ffff;
      this.layers[1].gprops.lineWidth = 4;
      this.layers[1].gprops.showLabels = false;
      this.layers[1].gprops.labelColor = 0xff00ffff;
      this.layers[1].gprops.labelSize = 32;

      // ConstellationLines
      this.layers[2].visible = true;
      this.layers[2].gprops.lineColor = 0x80ff8080;
      this.layers[2].gprops.lineWidth = 4;
      this.layers[2].gprops.labelColor = 0xffff8080;
      this.layers[2].gprops.labelSize = 32;

      // NamedStarsCatalog
      this.layers[3].visible = true;
      this.layers[3].gprops.lineColor = 0xffffd700;
      this.layers[3].gprops.lineWidth = 2;
      this.layers[3].gprops.labelColor = 0xffffd700;
      this.layers[3].gprops.labelSize = 14;

      // Messier
      this.layers[4].gprops.lineColor = 0xff8080ff;
      this.layers[4].gprops.labelColor = 0xff8080ff;
      this.layers[4].gprops.labelSize = 16;

      // NGC/IC
      this.layers[5].gprops.lineColor = 0xffff8080;
      this.layers[5].gprops.labelColor = 0xffff8080;
      this.layers[5].gprops.labelSize = 16;

      // Tycho2
      this.layers[6].gprops.lineColor = 0xffffff00;
      this.layers[6].gprops.labelColor = 0xffffff00;
      this.layers[6].gprops.labelSize = 12;

      // PGC
      this.layers[7].visible = false;
      this.layers[7].gprops.lineColor = 0xff00ffff;
      this.layers[7].gprops.labelColor = 0xff00ffff;
   }

   this._base_LoadSettings = this.LoadSettings;
   this.LoadSettings = function ()
   {
      this._base_LoadSettings();

      var version = Settings.read(this.MakeSettingsKey("version"), DataType_UCString);
      if (!Settings.lastReadOK || version != VERSION)
         return false;

      var layersStr = Settings.read(this.MakeSettingsKey("layers"), DataType_UCString);
      if (!Settings.lastReadOK || !layersStr)
         return false;

      var layerIds = layersStr.split("|");
      this.layers = new Array;
      for (var l = 0; l < layerIds.length; l++)
      {
         var layerDef = FindLayer(layerIds[l]);
         if (layerDef)
         {
            var layer = eval(layerDef.constructor);
            layer.SetId(l);
            layer.LoadSettings();
            this.layers.push(layer);
         }
      }

      return true;
   }

   this._base_SaveSettings = this.SaveSettings;
   this.SaveSettings = function ()
   {
      Settings.write(this.MakeSettingsKey("version"), DataType_UCString, VERSION);
      this._base_SaveSettings();

      var layerIds;
      for (var l = 0; l < this.layers.length; l++)
      {
         this.layers[l].SetId(l);
         this.layers[l].SaveSettings();
         if (layerIds)
            layerIds += "|" + this.layers[l].layerName;
         else
            layerIds = this.layers[l].layerName;
      }

      if (layerIds)
         Settings.write(this.MakeSettingsKey("layers"), DataType_UCString, layerIds);
   };

   this.ResetSettings = function ()
   {
      Settings.remove(SETTINGS_MODULE);
   }


   this._base_LoadParameters = this.LoadParameters;
   this.LoadParameters = function ()
   {
      this._base_LoadParameters();

      var key = this.MakeParamsKey("layers");
      if (!Parameters.has(key))
         return false;

      var layersStr = Parameters.getString(key);
      if (!layersStr)
         return false;

      var layerIds = layersStr.split("|");
      this.layers = new Array;
      for (var l = 0; l < layerIds.length; l++)
      {
         var layerDef = FindLayer(layerIds[l]);
         if (layerDef)
         {
            var layer = eval(layerDef.constructor);
            layer.SetId(l);
            layer.LoadSettings();
            this.layers.push(layer);
         }
      }

      return true;
   }

   this._base_SaveParameters = this.SaveParameters;
   this.SaveParameters = function ()
   {
      this._base_SaveParameters();

      var layerIds;
      for (var l = 0; l < this.layers.length; l++)
      {
         this.layers[l].SetId(l);
         this.layers[l].SaveParameters();
         if (layerIds)
            layerIds += "|" + this.layers[l].layerName;
         else
            layerIds = this.layers[l].layerName;
      }

      Parameters.set(this.MakeParamsKey("layers"), layerIds);
   }

   this.RenderGraphics = function (g, width, height)
   {
      var bounds = this.metadata.FindImageBounds();

      g.clipRect = new Rect(0, 0, width, height);
      g.antialiasing = true;
      g.textAntialiasing = true;
      g.transparentBackground = true;

      for (var c = 0; c < this.layers.length; c++)
         if (this.layers[c].visible)
            this.layers[c].Draw(g, this.metadata, bounds, this.window, this.graphicsScale);

      g.end();
   }

   this.Render = function ()
   {
      if (this.epoch)
         this.metadata.epoch = this.epoch;
      // Load data from catalogs
      for (var c = 0; c < this.layers.length; c++)
      {
         if (this.layers[c].visible && this.layers[c].Load)
            this.layers[c].objects = this.layers[c].Load(this.metadata, this.vizierServer);
      }

      try
      {
         if (this.removeDuplicates)
            this.RemoveDuplicates();
      } catch (ex)
      {
         console.writeln(ex);
      }

      var width = this.window.mainView.image.width;
      var height = this.window.mainView.image.height;

      if (this.outputMode == Output_SVG)
      {
         var svg = new SVG(this.svgPath);
         svg.viewBox = new Rect(width, height);
         g = new VectorGraphics(svg);
         console.writeln("Rendering SVG overlay: ", this.svgPath);

         this.RenderGraphics(g, width, height);
      }
      else
      {
         var bmp = new Bitmap(width, height);
         if (this.outputMode == Output_Image)
         {
            if (this.applySTF)
            {
               var imageOrg = this.window.mainView.image;
               var tmpW = new ImageWindow(width, height, imageOrg.numberOfChannels, this.window.bitsPerSample, this.window.isFloatSample, imageOrg.isColor, this.window.mainView.fullId + "_Annotated");
               tmpW.mainView.beginProcess(UndoFlag_NoSwapFile);
               tmpW.mainView.image.apply(imageOrg);
               this.ApplySTF(tmpW.mainView, this.window.mainView.stf);
               tmpW.mainView.endProcess();
               bmp.assign(tmpW.mainView.image.render());
               tmpW.close();
            }
            else
               bmp.assign(this.window.mainView.image.render());
         }
         else
            bmp.fill(0x00000000);
         var g = new VectorGraphics(bmp);

         console.writeln("Rendering annotation");
         this.RenderGraphics(g, width, height);

         if (Parameters.isViewTarget)
         {
            // if ( this.window.mainView.image.colorSpace != ColorSpace_RGB )
            // console.writeln("<end><cbr><b>WARNING</b>: The image is not RGB so the annotation will lose the colors");
            this.window.mainView.beginProcess(UndoFlag_All);
            if (this.window.mainView.image.colorSpace != ColorSpace_RGB)
            {
               var convertRGB = new ConvertToRGBColor();
               convertRGB.executeOn(this.window.mainView, false);
            }
            this.window.mainView.image.blend(bmp);
            this.window.mainView.endProcess();
         }
         else
         {
            var newid = this.window.mainView.fullId + "_Annotated";
            console.writeln("<end><cbr>Generating output image: ", newid);
            var targetW = new ImageWindow(width, height, (this.outputMode == Output_Overlay) ? 4 : 3, this.window.bitsPerSample, this.window.isFloatSample, true, newid);

            targetW.mainView.beginProcess(UndoFlag_NoSwapFile);

            // Blend annotation with target image
            targetW.mainView.image.blend(bmp);

            // Copy keywords to target image
            targetW.keywords = this.window.keywords;

            targetW.mainView.endProcess();
            this.metadata.SaveProperties(targetW);

            targetW.show();
         }
      }
      console.writeln("Rendering ok");

      if (this.writeObjects)
         this.WriteObjects();
   };

   this.RenderPreview = function ()
   {
      if (this.epoch)
         this.metadata.epoch = this.epoch;

      // Load data from catalogs
      for (var c = 0; c < this.layers.length; c++)
      {
         if (this.layers[c].visible && this.layers[c].Load)
            this.layers[c].objects = this.layers[c].Load(this.metadata, this.vizierServer);
      }

      try
      {
         if (this.removeDuplicates)
            this.RemoveDuplicates();
      } catch (ex)
      {
         console.writeln(ex);
      }

      var width = this.window.mainView.image.width;
      var height = this.window.mainView.image.height;


      var bmp = new Bitmap(width, height);
      if (this.outputMode == Output_Image)
      {
         if (this.applySTF)
         {
            var imageOrg = this.window.mainView.image;
            var tmpW = new ImageWindow(width, height, imageOrg.numberOfChannels, this.window.bitsPerSample, this.window.isFloatSample, imageOrg.isColor, this.window.mainView.fullId + "_Annotated");
            tmpW.mainView.beginProcess(UndoFlag_NoSwapFile);
            tmpW.mainView.image.apply(imageOrg);
            this.ApplySTF(tmpW.mainView, this.window.mainView.stf);
            tmpW.mainView.endProcess();
            bmp.assign(tmpW.mainView.image.render());
            tmpW.forceClose();
         }
         else
            bmp.assign(this.window.mainView.image.render());
      }
      else
         bmp.fill(0x00000000);
      var g = new VectorGraphics(bmp);

      console.writeln("Rendering annotation");
      this.RenderGraphics(g, width, height);
      console.writeln("Rendering ok");
      return bmp;
   };

   this.WriteObjects = function ()
   {
      var imagePath = this.window.filePath;
      var outPath;
      if (imagePath != null && imagePath.length > 0)
         outPath = File.changeExtension(imagePath, ".objects.txt");
      else
      {
         var sfd = new SaveFileDialog;
         sfd.caption = "Select objects file path";
         sfd.filters = [
            ["Text files", "*.txt"]
         ];
         sfd.initialPath = this.window.mainView.fullId + ".objects.txt";
         if (!sfd.execute())
            return;
         outPath = sfd.fileName;
      }
      console.writeln("Writing objects file: ", outPath);

      var file = new File();
      file.createForWriting(outPath);
      for (var c = 0; c < this.layers.length; c++)
         if (this.layers[c].visible && this.layers[c].ToFile)
            this.layers[c].ToFile(file, this.metadata);
      file.close();
   }

   this.ApplySTF = function (view, stf)
   {
      var low = (stf[0][1] + stf[1][1] + stf[2][1]) / 3;
      var mtf = (stf[0][0] + stf[1][0] + stf[2][0]) / 3;
      var hgh = (stf[0][2] + stf[1][2] + stf[2][2]) / 3;

      if (low > 0 || mtf != 0.5 || hgh != 1) // if not an identity transformation
      {
         console.writeln(format("<b>Applying STF to '%ls'</b>:\x1b[38;2;100;100;100m",view.id));
         var HT = new HistogramTransformation;
         HT.H = [
            [  0, 0.5, 1, 0, 1],
            [  0, 0.5, 1, 0, 1],
            [  0, 0.5, 1, 0, 1],
            [low, mtf, hgh, 0, 1],
            [  0, 0.5, 1, 0, 1]
         ];

         HT.executeOn(view, false); // no swap file
         console.write("\x1b[0m");
      }
   }

   this.RemoveDuplicates = function ()
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
      for (var c = 0; c < this.layers.length; c++)
      {
         if (this.layers[c].GetObjects())
            this.layers[c].GetObjects().sort(function (a, b)
            {
               if (a && b)
                  return ( a.posRD.y == b.posRD.y ) ? 0 : ((a.posRD.y < b.posRD.y) ? -1 : 1);
               else
                  return (a) ? -1 : ((b) ? 1 : 0);
            });
      }

      // Calculate the maximum number of checks
      for (var c = 0; c < this.layers.length - 1; c++)
      {
         var objects1 = this.layers[c].GetObjects();
         if (objects1)
            for (var c2 = c + 1; c2 < this.layers.length; c2++)
            {
               var objects2 = this.layers[c2].GetObjects();
               if (objects2)
                  numChecks += objects1.length * objects2.length;
            }
      }

      var lastProcess = (new Date).getTime();
      var tolerancePuntual = Math.max(this.metadata.resolution, 3 / 3600);
      var toleranceExtense = Math.max(this.metadata.resolution, 10 / 3600);
      for (var c1 = 0; c1 < this.layers.length - 1; c1++)
      {
         var objects1 = this.layers[c1].GetObjects();
         if (!objects1)
            continue;

         //Find a coincident object in the other layers
         for (var c2 = c1 + 1; c2 < this.layers.length; c2++)
         {
            var objects2 = this.layers[c2].GetObjects();
            if (!objects2 || this.layers[c1].layerName == this.layers[c2].layerName)
               continue;

            var j0 = 0;
            for (var i = 0; i < objects1.length; i++)
            {
               var obj1 = objects1[i];
               if (!obj1)
                  continue;
               var puntual1 = !(obj1.diameter > 5 / 3600);
               var cosDec = Math.cos(obj1.posRD.y * Math.PI / 180);
               var minDec = obj1.posRD.y - toleranceExtense;
               var maxDec = obj1.posRD.y + toleranceExtense;

               for (var j = j0; j < objects2.length; j++)
               {
                  var obj2 = objects2[j];
                  if (!obj2)
                     continue;
                  if (obj2.posRD.y < minDec)
                  {
                     j0 = j;
                     continue;
                  }
                  if (obj2.posRD.y > maxDec)
                     break;
                  var puntual2 = !(obj2.diameter > 5 / 3600);
                  var effectiveTolerance = (puntual1 || puntual2) ? tolerancePuntual : toleranceExtense;
                  var dx = (obj1.posRD.x - obj2.posRD.x) * cosDec;
                  var dy = obj1.posRD.y - obj2.posRD.y;
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
}

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
         /*###*/
         return;
      }

      console.abortEnabled = true;

      var engine = new AnnotationEngine;
      if (Parameters.isViewTarget)
         engine.Init(Parameters.targetView.window);
      else
      {
         if(Parameters.getBoolean("non_interactive"))
            engine.Init(ImageWindow.activeWindow);
         else {
            do {
               engine.Init(ImageWindow.activeWindow);

               var dialog = new AnnotateDialog(engine);
               var res = dialog.execute();
               if (!res)
               {
                  if (dialog.resetRequest)
                     engine = new AnnotationEngine;
                  else
                     return;
               }
            } while (!res);
            engine.SaveSettings();
         }
      }

      engine.Render();

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
