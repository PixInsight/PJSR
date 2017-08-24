/*
   3DPlot v1.31

   A script to generate three-dimensional image renditions.

   Copyright (C) 2009 Andrés del Pozo, David Serrano, Juan Conejero

   This program is free software: you can redistribute it and/or modify it
   under the terms of the GNU General Public License as published by the
   Free Software Foundation, version 3 of the License.

   This program is distributed in the hope that it will be useful, but WITHOUT
   ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
   FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
   more details.

   You should have received a copy of the GNU General Public License along with
   this program.  If not, see <http://www.gnu.org/licenses/>.
*/

#define TITLE "3DPlot"
#define VERSION "1.31"

#include <pjsr/ColorSpace.jsh>
#include <pjsr/FillRule.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/NumericControl.jsh>
#include <pjsr/ColorComboBox.jsh>
#include <pjsr/SimpleColorDialog.jsh>
#include <pjsr/StdCursor.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/SampleType.jsh>

#feature-id    Render > 3DPlot

#feature-info  A script to generate three-dimensional image renditions. \
               Optional output as a new image or as a SVG file.<br/> \
               <br/> \
               Copyright &copy; 2009 Andr&eacute;s Pozo, David Serrano (PTeam), \
               Juan Conejero (PTeam)

#feature-icon 3DPlot.xpm

// Creates the parameters object.
function _3dplot_params()
{
   this.srcView = ImageWindow.activeWindow.currentView;
   this.svgOutput = false;
   this.svgFileName = File.systemTempDirectory + "/3dplot.svg";
   this.azimuth = 30;            // Perspective angle in degrees
   this.elevation = 20;          // Perspective elevation angle
   this.scaleXY = 6;             // Scale factor for X and Y axis
   this.scaleZ = 50;             // Scale factor for Z axis
   this.backgroundColor = 0xff403000;
   this.polygonBorder = 0x80000000;
   this.useShading = true;       // Apply shading effect
   this.lightBrightness = 2000;  // Light intensity for the shading effect
   this.paletteElems = 256;
   this.palette = [ [0x80,0,0] , [0,0x80,0] , [0,0,0xC0], [0x80,0,0x80], [0x80,0x80,0], [0,0x80,0x80], [0x80,0x80,0x80] ];
}
var perspecParams = new _3dplot_params;

// Applies the perspective transformation to all the pixels in the image
function _3dplot_xform(src, perspecParams)
{
   // Calculates the coordinates of each pixel applying the perspective transformation
   this.points=new Array;
   this.limits=new Rect( 1e10, 1e10, -1e10, -1e10 );

   // Projection matrix
   var alpha=Math.rad(90-perspecParams.elevation);
   var beta=Math.rad(perspecParams.azimuth);
   var m00=Math.cos(beta);
   var m10=-Math.sin(beta);
   var m20=0;
   var m01=Math.cos(alpha)*Math.sin(beta);
   var m11=Math.cos(alpha)*Math.cos(beta);
   var m21=-Math.sin(alpha)*perspecParams.scaleZ;

   src.initializeStatus( "Computing 3D coordinates", src.height );

   for (var y = 0; y < src.height; y++) {
      this.points[y]=new Array;
      var m10y = m10*y;
      var m11y = m11*y;
      for (var x = 0; x < src.width; x++){
         var z = src.sample(x,y);
         var p = new Point( m00*x + m10y, m01*x + m11y + m21*z );
         p.mul( perspecParams.scaleXY );
         this.points[y][x] = p;
         if (p.x < this.limits.left)   this.limits.left = p.x;
         if (p.x > this.limits.right)  this.limits.right = p.x;
         if (p.y < this.limits.top)    this.limits.top = p.y;
         if (p.y > this.limits.bottom) this.limits.bottom = p.y;
      }
      src.advanceStatus( 1 );
   }

   gc();
}

function ApplySTF(src, stf)
{
#ifdef DEBUG
   console.writeln(stf[0]);
   console.writeln(stf[1]);
   console.writeln(stf[2]);
   console.writeln(stf[3]);
#endif
   var low=(stf[0][1]+stf[1][1]+stf[2][1])/3;
   var mtf=(stf[0][0]+stf[1][0]+stf[2][0])/3;
   var hgh=(stf[0][2]+stf[1][2]+stf[2][2])/3;

   if ( low > 0 || mtf != 0.5 || hgh != 1 ) // if not an identity transformation
   {
      // Faster solution using a process instance
      var HT = new HistogramTransformation;
      HT.H = [[  0, 0.5,   1, 0, 1],
              [  0, 0.5,   1, 0, 1],
              [  0, 0.5,   1, 0, 1],
              [low, mtf, hgh, 0, 1],
              [  0, 0.5,   1, 0, 1]];

      var wtmp = new ImageWindow( 1, 1, 1,
         src.bitsPerSample, src.sampleType == SampleType_Real, src.colorSpace != ColorSpace_Gray );
      var v = wtmp.mainView;

      v.beginProcess( UndoFlag_NoSwapFile );
      v.image.assign( src );
      v.endProcess();

      HT.executeOn( v, false ); // no swap file
      src.assign( v.image );

      wtmp.close();
   }
}

function DieError(message)
{
   var msgb=new MessageBox(message,"Error generating 3D view");
   msgb.execute();
   throw Error( message );
}

function ApplyLighting(basecolor, light)
{
   var r=(basecolor[0]*light/1000);
   r=r>255?255:r;
   var g=(basecolor[1]*light/1000);
   g=g>255?255:g;
   var b=(basecolor[2]*light/1000);
   b=b>255?255:b;
   return 0xFF000000 | (r<<16)| (g<<8) | b;
}

// the resulting palette doesn't have to be exactly 'num' elements long.
function ExpandPalette(params)
{
   var p = params.palette;
   var num = params.paletteElems;
   var expanded = new Array;
   var steps = Math.round (num / p.length);  // steps between two provided palette elements

   for (var c = 0; c < p.length - 1; c++) {
      var from = p[c];
      var to = p[c+1];
      var step_red   = (to[0] - from[0]) / steps;
      var step_green = (to[1] - from[1]) / steps;
      var step_blue  = (to[2] - from[2]) / steps;
      for (var s = 0; s < steps; s++) {
         var new_red   = from[0] + s * step_red;
         var new_green = from[1] + s * step_green;
         var new_blue  = from[2] + s * step_blue;
         expanded.push ([ new_red, new_green, new_blue ]);
      }
   }
   // add last user-supplied palette element
   expanded.push (p[p.length-1]);

   params.palette = expanded;
}

function Render( src, g, limits, xform, perspecParams)
{
   g.antialiasing=true;

   // Applies a translation to the graphics to center the image
   g.translateTransformation(-limits.left,-limits.top);

   ExpandPalette (perspecParams);

   var fillbrush=[];
   if(!perspecParams.useShading){
      for(var c=0;c<perspecParams.palette.length;c++)
         fillbrush[c]=new Brush(0xFF000000 | (perspecParams.palette[c][0]<<16) | (perspecParams.palette[c][1]<<8) | perspecParams.palette[c][2]);
   }

   g.pen = new Pen( perspecParams.polygonBorder, 0 );

   src.initializeStatus( "Rendering 3D profile", src.height-1 );
   // Paint the polygons from back to front
   for (var n = 0; n < src.height-1; n++) {
      for (var m = 0; m < src.width-1; m++) {
         var  z1=src.sample(m,n),
              z2=src.sample(m+1,n),
              z3=src.sample(m,n+1),
              z4=src.sample(m+1,n+1);

         // Get the palette index
         //var z=(z1+z2+z3+z4)/4;
         var zM=Math.max(Math.max(z1,z2),Math.max(z3,z4));
         var zm=Math.min(Math.min(z1,z2),Math.min(z3,z4));
         var z=(zm+zM)/2;
         var palidx=Math.round(z*perspecParams.palette.length);
         palidx=palidx<0 ? 0 : (palidx>=perspecParams.palette.length ? perspecParams.palette.length-1 : palidx);

         if(perspecParams.useShading){
            // Get the lighting factor
            var slope=z1-z2+z3-z4;
            var lighting=(slope+0.5)*perspecParams.lightBrightness;
            lighting=lighting<0 ? 0 : Math.round(lighting);

            g.brush=new Brush(ApplyLighting(perspecParams.palette[palidx], lighting));
         } else
            g.brush=fillbrush[palidx];

         var polygon=new Array(
            xform[n][m],
            xform[n][m+1],
            xform[n+1][m+1],
            xform[n+1][m]);
         g.drawPolygon (polygon);
      }
      src.advanceStatus( 1 );
      gc( false ); // soft GC
   }
}

function RenderImage( src, img, limits, xform, perspecParams)
{
   var bmp = new Bitmap( img.width, img.height );
   bmp.fill( perspecParams.backgroundColor );
   var g = new Graphics( bmp );
   Render( src, g, limits, xform, perspecParams);
   g.end();
   img.blend( bmp );
}

function RenderSVG( src, svg, limits, xform, perspecParams )
{
   var g = new Graphics( svg );
   g.fillRect( svg.size, new Brush( perspecParams.backgroundColor ) );
   Render( src, g, limits, xform, perspecParams );
   g.end();
}

function _3dplot_dialog() {
   this.__base__ = Dialog;
   this.__base__();

   var labelWidth1 = this.font.width( "Polygon border color:" ) + 8;
   var editWidth1 = 9*this.font.width( "0" );
   var editWidth2 = 12*this.font.width( "0" );

   // help label
   this.helpLabel = new Label (this);
   with (this.helpLabel) {
      frameStyle = FrameStyle_Box;
       margin = this.logicalPixelsToPhysical( 4 );
       wordWrapping = true;
       useRichText = true;
       text = "<p><b>" + TITLE + " v" + VERSION + "</b> &mdash; A " +
          "script to generate 3D image renditions.</p>" +
          "<p>Copyright &copy; 2009 Andr&eacute;s Pozo / David Serrano / Juan Conejero</p>";
   }

   // source image

   this.srcImage_Label = new Label( this );
   this.srcImage_Label.minWidth = labelWidth1;
   this.srcImage_Label.text = "Source image:";
   this.srcImage_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.srcImage_ViewList = new ViewList( this );
   this.srcImage_ViewList.scaledMinWidth = 250;
   this.srcImage_ViewList.getAll(); // include main views as well as previews
   this.srcImage_ViewList.currentView = perspecParams.srcView;
   this.srcImage_ViewList.toolTip = "<p>Select the image to be rendered.</p>";
   this.srcImage_ViewList.onViewSelected = function( view )
   {
      perspecParams.srcView = view;
   };

   this.srcImage_Sizer = new HorizontalSizer;
   this.srcImage_Sizer.spacing = 4;
   this.srcImage_Sizer.add( this.srcImage_Label );
   this.srcImage_Sizer.add( this.srcImage_ViewList, 100 );

   // SVG Output

   this.svgOutput_CB = new CheckBox (this);
   with (this.svgOutput_CB) {
      text = "SVG Format";
      checked = perspecParams.svgOutput;
      onCheck = function (checked) {
         perspecParams.svgOutput = checked;
         this.dialog.svgFileName_Label.enabled = checked;
         this.dialog.svgFileName_Edit.enabled = checked;
         this.dialog.svgFileName_Button.enabled = checked;
      };
      toolTip = "<p>Select this option to generate the 3D rendition in Scalable Vector Graphics " +
                "format (SVG). Otherwise the rendition will be generated as a new image window.</p>" +
                "<p><b>* Warning *</b> SVG files can be very large even for relatively small images.</p>";
   }

   this.svgOutput_Sizer = new HorizontalSizer;
   this.svgOutput_Sizer.addSpacing( labelWidth1+4 );
   this.svgOutput_Sizer.add( this.svgOutput_CB );
   this.svgOutput_Sizer.addStretch();

   // SVG Filename

   this.svgFileName_Label = new Label( this );
   with ( this.svgFileName_Label ) {
      text = "SVG output file:";
      textAlignment = TextAlign_Right|TextAlign_VertCenter;
      minWidth = labelWidth1;
      enabled = perspecParams.svgOutput;
   }

   this.svgFileName_Edit = new Edit( this );
   with ( this.svgFileName_Edit ) {
      text = perspecParams.svgFileName;
      enabled = perspecParams.svgOutput;
      onEditCompleted = function() { perspecParams.svgFileName = this.text; };
   }

   this.svgFileName_Button = new ToolButton( this );
   with ( this.svgFileName_Button ) {
      icon = this.scaledResource( ":/browser/select-file.png" );
      this.svgFileName_Button.setScaledFixedSize( 20, 20 );
      toolTip = "<p>Select a SVG output file.</p>";
      enabled = perspecParams.svgOutput;
      onClick = function() {
         var gdd = new SaveFileDialog;
         gdd.initialPath = perspecParams.svgFileName;
         gdd.caption = "Select SVG Output File";
         gdd.overwritePrompt = true;
         gdd.filters = [["SVG Files", "*.svg"]];

         if ( gdd.execute() )
         {
            perspecParams.svgFileName = gdd.fileName;
            this.dialog.svgFileName_Edit.text = perspecParams.svgFileName;
         }
      };
   }

   this.svgFileName_Sizer = new HorizontalSizer;
   with ( this.svgFileName_Sizer ) {
      spacing = 4;
      add( this.svgFileName_Label );
      add( this.svgFileName_Edit, 100 );
      add( this.svgFileName_Button );
   }

   // azimuth
   this.azimuth_NC = new NumericControl (this);
   with (this.azimuth_NC) {
      real = false;
      label.text = "Azimuth:";
      label.minWidth = labelWidth1;
      setRange (0, 90);
      slider.setRange (0, 90);
      slider.scaledMinWidth = 250;
      edit.minWidth = editWidth1;;
      setValue (perspecParams.azimuth);
      toolTip = "<p>Azimuth angle in degrees.</p>";
      onValueUpdated = function (value) {
        perspecParams.azimuth = value;
      }
   }

   // elevation
   this.elevation_NC = new NumericControl (this);
   with (this.elevation_NC) {
      real = false;
      label.text = "Elevation:";
      label.minWidth = labelWidth1;
      setRange (0, 90);
      slider.setRange (0, 90);
      slider.scaledMinWidth = 250;
      edit.minWidth = editWidth1;;
      setValue (perspecParams.elevation);
      toolTip = "<p>Observer's elevation angle above the ground, in degrees.</p>";
      onValueUpdated = function (value) {
         perspecParams.elevation = value;
      }
   }

   // scaleXY
   this.scaleXY_NC = new NumericControl (this);
   with (this.scaleXY_NC) {
      real = false;
      label.text = "X-Y plane scale:";
      label.minWidth = labelWidth1;
      setRange (1, 10);
      slider.setRange (1, 10);
      slider.scaledMinWidth = 250;
      edit.minWidth = editWidth1;;
      setValue (perspecParams.scaleXY);
      toolTip = "<p>Scale of X and Y coordinates in rendition pixels per image pixels.</p>";
      onValueUpdated = function (value) {
         perspecParams.scaleXY = value;
      }
   }

   // scaleZ
   this.scaleZ_NC = new NumericControl (this);
   with (this.scaleZ_NC) {
      real = false;
      label.text = "Z-axis scale:";
      label.minWidth = labelWidth1;
      setRange (1, 100);
      slider.setRange (1, 100);
      slider.scaledMinWidth = 250;
      edit.minWidth = editWidth1;;
      setValue (perspecParams.scaleZ);
      toolTip = "<p>Scaling factor of Z-axis coordinates.</p>";
      onValueUpdated = function (value) {
         perspecParams.scaleZ = value;
      }
   }

   // mtf
   /*this.mtf_NC = new NumericControl (this);
   with (this.mtf_NC) {
      label.text = "Midtones balance:";
      label.minWidth = labelWidth1;
      setRange (0, 1);
      slider.setRange (1, 500);
      slider.scaledMinWidth = 250;
      setPrecision (3);
      edit.minWidth = editWidth1;;
      setValue (perspecParams.mtf);
      toolTip = "<p>This parameter is part of a histogram transformation applied to " +
                "improve faint detail visualization.</p>";
      onValueUpdated = function (value) {
         perspecParams.mtf = value;
      }
   }*/

   // lightBrightness
   this.brightness_NC = new NumericControl (this);
   with (this.brightness_NC) {
      real = false;
      label.text = "Brightness:";
      label.minWidth = labelWidth1;
      setRange (100, 5000);
      slider.setRange (1, 50);
      slider.scaledMinWidth = 250;
      edit.minWidth = editWidth1;;
      setValue (perspecParams.lightBrightness);
      toolTip = "<p>Intensity of incident light.</p>";
      onValueUpdated = function (value) {
         perspecParams.lightBrightness = value;
      }
   }

   // useShading
   this.shading_CB = new CheckBox (this);
   with (this.shading_CB) {
      text = "Use shading";
      checked = perspecParams.useShading;
      onCheck = function (checked) { perspecParams.useShading = checked; }
      toolTip = "<p>If this option is selected, a special shading algorithm will be used " +
                "to enhance the 3-D rendition.</p>";
   }

   this.shading_Sizer = new HorizontalSizer;
   this.shading_Sizer.addSpacing( labelWidth1+4 );
   this.shading_Sizer.add( this.shading_CB );
   this.shading_Sizer.addStretch();

   // background color

   this.backgroundColor_Label = new Label( this );
   this.backgroundColor_Label.text = "Background color:";
   this.backgroundColor_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.backgroundColor_Label.minWidth = labelWidth1;

   this.backgroundColor_ComboBox = new ColorComboBox( this );
   this.backgroundColor_ComboBox.setCurrentColor( perspecParams.backgroundColor );
   this.backgroundColor_ComboBox.toolTip = "<p>Background color.</p>";
   this.backgroundColor_ComboBox.onColorSelected = function( rgba )
   {
      perspecParams.backgroundColor =
         Color.setAlpha( rgba, Color.alpha( perspecParams.backgroundColor ) );
   };

   this.backgroundTransparency_SpinBox = new SpinBox( this );
   this.backgroundTransparency_SpinBox.minValue = 0;
   this.backgroundTransparency_SpinBox.maxValue = 255;
   this.backgroundTransparency_SpinBox.value = Color.alpha( perspecParams.backgroundColor );
   this.backgroundTransparency_SpinBox.toolTip = "<p>Alpha value of the background color: 0=transparent, 255=opaque.</p>";
   this.backgroundTransparency_SpinBox.onValueUpdated = function( value )
   {
      perspecParams.backgroundColor =
         Color.setAlpha( perspecParams.backgroundColor, value );
   };

   this.backgroundColor_Button = new ToolButton( this );
   with ( this.backgroundColor_Button ) {
      icon = this.scaledResource( ":/icons/select-color.png" );
      this.backgroundColor_Button.setScaledFixedSize( 20, 20 );
      toolTip = "<p>Define a custom background color.</p>";
      onClick = function() {
         var scd = new SimpleColorDialog( perspecParams.backgroundColor );
         scd.windowTitle = "Custom RGBA Color: Background";
         if ( scd.execute() )
         {
            perspecParams.backgroundColor = scd.color;
            this.dialog.backgroundColor_ComboBox.setCurrentColor( perspecParams.backgroundColor );
            this.dialog.backgroundTransparency_SpinBox.value = Color.alpha( perspecParams.backgroundColor );
         }
      };
   }

   this.backgroundColor_Sizer = new HorizontalSizer;
   this.backgroundColor_Sizer.spacing = 4;
   this.backgroundColor_Sizer.add( this.backgroundColor_Label );
   this.backgroundColor_Sizer.add( this.backgroundColor_ComboBox );
   this.backgroundColor_Sizer.add( this.backgroundTransparency_SpinBox );
   this.backgroundColor_Sizer.add( this.backgroundColor_Button );
   this.backgroundColor_Sizer.addStretch();

   // polygon border color

   this.polygonBorderColor_Label = new Label( this );
   this.polygonBorderColor_Label.text = "Polygon border color:";
   this.polygonBorderColor_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.polygonBorderColor_Label.minWidth = labelWidth1;

   this.polygonBorderColor_ComboBox = new ColorComboBox( this );
   this.polygonBorderColor_ComboBox.setCurrentColor( perspecParams.polygonBorder );
   this.polygonBorderColor_ComboBox.toolTip = "<p>Polygon border color.</p>";
   this.polygonBorderColor_ComboBox.onColorSelected = function( rgba )
   {
      perspecParams.polygonBorder =
         Color.setAlpha( rgba, Color.alpha( perspecParams.polygonBorder ) );
   };

   this.polygonBorderTransparency_SpinBox = new SpinBox( this );
   this.polygonBorderTransparency_SpinBox.minValue = 0;
   this.polygonBorderTransparency_SpinBox.maxValue = 255;
   this.polygonBorderTransparency_SpinBox.value = Color.alpha( perspecParams.polygonBorder );
   this.polygonBorderTransparency_SpinBox.toolTip = "<p>Alpha value of the polygon border color: 0=transparent, 255=opaque.</p>";
   this.polygonBorderTransparency_SpinBox.onValueUpdated = function( value )
   {
      perspecParams.polygonBorder = Color.setAlpha( perspecParams.polygonBorder, value );
   };

   this.polygonBorderColor_Button = new ToolButton( this );
   with ( this.polygonBorderColor_Button ) {
      icon = this.scaledResource( ":/icons/select-color.png" );
      this.polygonBorderColor_Button.setScaledFixedSize( 20, 20 );
      toolTip = "<p>Define a custom polygon border color.</p>";
      onClick = function() {
         var scd = new SimpleColorDialog( perspecParams.polygonBorder );
         scd.windowTitle = "Custom RGBA Color: Polygon Border";
         if ( scd.execute() )
         {
            perspecParams.polygonBorder = scd.color;
            this.dialog.polygonBorderColor_ComboBox.setCurrentColor( perspecParams.polygonBorder );
            this.dialog.polygonBorderTransparency_SpinBox.value = Color.alpha( perspecParams.polygonBorder );
         }
      };
   }

   this.polygonBorderColor_Sizer = new HorizontalSizer;
   this.polygonBorderColor_Sizer.spacing = 4;
   this.polygonBorderColor_Sizer.add( this.polygonBorderColor_Label );
   this.polygonBorderColor_Sizer.add( this.polygonBorderColor_ComboBox );
   this.polygonBorderColor_Sizer.add( this.polygonBorderTransparency_SpinBox );
   this.polygonBorderColor_Sizer.add( this.polygonBorderColor_Button );
   this.polygonBorderColor_Sizer.addStretch();

   // ### TODO: Allow selecting palettes

   // buttons
   this.ok_Button = new PushButton (this);
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function() { this.dialog.ok(); };

   this.cancel_Button = new PushButton (this);
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function() { this.dialog.cancel(); };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 8;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add (this.ok_Button);
   this.buttons_Sizer.add (this.cancel_Button);

   // pack everything
   this.sizer = new VerticalSizer;
   with (this.sizer) {
      margin = 8;
      spacing = 6;
      add (this.helpLabel);
      addSpacing (4);
      add (this.srcImage_Sizer);
      add (this.svgOutput_Sizer);
      add (this.svgFileName_Sizer);
      add (this.azimuth_NC);
      add (this.elevation_NC);
      add (this.scaleXY_NC);
      add (this.scaleZ_NC);
      //add (this.mtf_NC);
      add (this.brightness_NC);
      add (this.shading_Sizer);
      add (this.backgroundColor_Sizer);
      add (this.polygonBorderColor_Sizer);
      addSpacing( 8 );
      add (this.buttons_Sizer);
   }

   this.windowTitle = TITLE + " v" + VERSION;
   this.adjustToContents();
   this.setFixedSize();
}
_3dplot_dialog.prototype = new Dialog;

function FullViewIdAsValidViewId( fullId )
{
   return fullId.replace( "->", "_" );
}

function main()
{
   if ( ImageWindow.activeWindow.isNull )
      DieError("There is no active image");

   console.hide();

   for ( ;; )
   {
      if (!(new _3dplot_dialog).execute())
         return;

      if ( !perspecParams.srcView.isNull )
         break;

      (new MessageBox( "No source view has been selected!",
                       TITLE, StdIcon_Error, StdButton_Ok )).execute();
   }

   console.show();
   console.writeln( "<end><cbr><br>***** 3D Profiling Script *****" );
   console.flush();

   var startts = new Date;

   // Extract the luminance of the source image
   var src = new Image();
   perspecParams.srcView.image.extractLuminance(src);

   ApplySTF(src, perspecParams.srcView.stf);

   // Allow the user to abort this script
   console.abortEnabled = true;

   // Allow status monitoring for our working image
   src.statusEnabled = true;

   // Create the perspective
   var xform=new _3dplot_xform(src, perspecParams);

   try
   {
      var width = Math.round( xform.limits.width );
      var height = Math.round( xform.limits.height );

      if ( perspecParams.svgOutput )
      {
         console.writeln( "<end><cbr>Generating SVG output: ", perspecParams.svgFileName );
         var svg = new SVG( perspecParams.svgFileName, width, height );
         RenderSVG( src, svg, xform.limits, xform.points, perspecParams );
      }
      else
      {
         var newid = FullViewIdAsValidViewId( perspecParams.srcView.fullId ) + "_3dplot";
         console.writeln( "<end><cbr>Generating image output: ", newid );
         var isTransparent = ((perspecParams.backgroundColor >> 24) & 0xff) != 0xff;
         var w = new ImageWindow( width, height, isTransparent ? 4 : 3, 8, false, true, newid );
         var v = w.mainView;
         var i = v.image;

         v.beginProcess( UndoFlag_NoSwapFile );
         RenderImage( src, i, xform.limits, xform.points, perspecParams );
         v.endProcess();

         w.show();
      }

      var endts = new Date;
      console.writeln( format( "<end><cbr>3D view: %.2f s", (endts.getTime() - startts.getTime())/1000 ) );
   }
   catch(err)
   {
      console.writeln( err );
   }
}

main();
