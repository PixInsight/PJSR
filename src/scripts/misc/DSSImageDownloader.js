/*
   DSSImageDownloader v1.03

   A utility script to download Digitized Sky Survey images in PixInsight.

   Copyright (C) 2009, 2010 Oriol Lehmkuhl (PTeam) and Ivette Rodríguez (PTeam)

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

#feature-id    Utilities > DSSImageDownloader

#feature-info  A utility script to download Digitized Sky Survey images in PixInsight<br/>\
   <br/>\
   Original idea and JavaScript/PixInsight implementation by Oriol Lehmkuhl and \
   Ivette Rodr&iacute;guez (PTeam).<br/>\
   <br/>\
   Copyright &copy; 2009 Oriol Lehmkuhl (PTeam) and Ivette Rodr&iacute;guez (PTeam)

#feature-icon  DSSImageDownloader.xpm

#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/StdCursor.jsh>
#include <pjsr/UndoFlag.jsh>
#include <pjsr/ColorSpace.jsh>
#include <pjsr/NumericControl.jsh>

#define VERSION "1.03"
#define TITLE  "DSSImageDownloader"

var catalog = new Array;

catalog [0] = "By Coordinates";
catalog [1] = "Messier";
catalog [2] = "NGC";
catalog [3] = "IC";

function showImage( data )
{
   console.show();

   if ( !data.north )
      data.dec_h = -data.dec_h;

   var queryURL = "http://archive.eso.org/dss/dss/image?"
                  + (data.catalog ? ("name=" + catalog[data.catalog] + data.id) :
                                 ("ra=" + data.ra_h + "+" + data.ra_min + "+" + data.ra_sec +
                                  "&dec=" + data.dec_h + "+" + data.dec_min + "+" + data.dec_sec))
                  + "&equinox=J2000"
                  + "&x=" + data.fovX
                  + "&y=" + data.fovY
                  + "&Sky-Survey=DSS1"
                  + "&mime-type="
#ifoneof __PI_PLATFORM__ MSWINDOWS MACOSX
// CFITSIO does not provide gzip compression on Windows and Mac OS X
                  + "download-fits";
#else
                  + "download-gz-fits";
#endif

   var outputFileName = File.systemTempDirectory + "/DSS_image.fits";

   console.writeln( "<end><cbr><b>Downloading DSS image:</b>" );
   console.writeln( queryURL );
   console.abortEnabled = true;
   console.show();

   // Send request
   var download = new FileDownload( queryURL, outputFileName );
   try
   {
      download.perform();
   }
   catch ( e )
   {
      (new MessageBox( e.toString(), TITLE, StdIcon_Error, StdButton_Ok )).execute();
   }

   console.abortEnabled = false;
   console.hide();

   if ( download.ok )
   {
      var w = ImageWindow.open( outputFileName )[0];

      var ah = new AutoHistogram;
      with ( ah )
      {
         clipLowR = 0.100;
         clipHighR = 0.000;
         medianR = 0.70000000;
         clipLowG = 0.100;
         clipHighG = 0.000;
         medianG = 0.70000000;
         clipLowB = 0.100;
         clipHighB = 0.000;
         medianB = 0.70000000;
         isHistogramClipEnabled = true;
         isGammaEnabled = true;
         isGlobalHistogramClip = false;
         isGlobalGamma = false;
      }

      w.mainView.beginProcess( UndoFlag_NoSwapFile );
      ah.executeOn( w.mainView );
      w.mainView.endProcess();

      w.show();
      w.zoomToOptimalFit();
   }
}

function DSSImageDownloaderSkinData()
{
    this.catalog = 1;
    this.id = 1;
    this.fovX = 60;
    this.fovY = 60;
    this.ra_h = 1;
    this.ra_min = 1;
    this.ra_sec = 1;
    this.dec_h = 1;
    this.dec_min = 1;
    this.dec_sec = 1;
    this.north = true;
}

var data = new DSSImageDownloaderSkinData;

function DSSImageDownloaderSkinDialog()
{
    this.__base__ = Dialog;
    this.__base__();

    var emWidth = this.font.width( 'M' );
    var labelWidth1 = 16*emWidth;
    var spinBoxWidth = 6*emWidth;

    this.helpLabel = new Label( this );
    this.helpLabel.frameStyle = FrameStyle_Box;
    this.helpLabel.minWidth = 45*emWidth;
    this.helpLabel.margin = this.logicalPixelsToPhysical( 6 );
    this.helpLabel.wordWrapping = true;
    this.helpLabel.useRichText = true;
    this.helpLabel.text =
      "<b>" + TITLE + " v" + VERSION + "</b> &mdash; A script to download "
      + "Digitized Sky Survey images in PixInsight.<br/>"
      + "Copyright &copy; 2008 Oriol Lehmkuhl and Ivette Rodr&iacute;guez (PTeam)";

    // Target object specifications

    this.catalog_Label = new Label( this );
    this.catalog_Label.text = "Object designation:";
    this.catalog_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
    this.catalog_Label.minWidth = labelWidth1;

    this.catalog_ComboBox = new ComboBox( this );
    for ( var i = 0; i < catalog.length; ++i )
        this.catalog_ComboBox.addItem( catalog[i] );
    this.catalog_ComboBox.currentItem = data.catalog;
    this.catalog_ComboBox.toolTip = "";

   this.updateCatalogMaxId = function()
   {
      var maxId ;
      switch( data.catalog )
      {
      case 0: maxId = 9999; break;
      case 1: maxId =  110; break;
      case 2: maxId = 7840; break;
      case 3: maxId = 5386; break;
      default: throw Error( "Hmmm, bad data.catalog value!" );
      }
      this.dialog.catalog_SpinBox.maxValue = maxId;
   };

    this.catalog_ComboBox.onItemSelected = function( index )
    {
        data.catalog = index;
        if(index==0) {
            this.dialog.ra_h_SpinBox.enabled    = true;
            this.dialog.ra_min_SpinBox.enabled  = true;
            this.dialog.ra_sec_SpinBox.enabled  = true;
            this.dialog.dec_h_SpinBox.enabled   = true;
            this.dialog.dec_min_SpinBox.enabled = true;
            this.dialog.dec_sec_SpinBox.enabled = true;
            this.dialog.catalog_SpinBox.enabled = false;
        } else {
            this.dialog.ra_h_SpinBox.enabled    = false;
            this.dialog.ra_min_SpinBox.enabled  = false;
            this.dialog.ra_sec_SpinBox.enabled  = false;
            this.dialog.dec_h_SpinBox.enabled   = false;
            this.dialog.dec_min_SpinBox.enabled = false;
            this.dialog.dec_sec_SpinBox.enabled = false;
            this.dialog.catalog_SpinBox.enabled = true;
        }
        this.dialog.updateCatalogMaxId();
    };

    this.catalog_SpinBox = new SpinBox( this );
    this.catalog_SpinBox.minValue = 1;
    this.updateCatalogMaxId(); //this.catalog_SpinBox.maxValue = ???;
    this.catalog_SpinBox.value = data.id;
    this.catalog_SpinBox.toolTip = "";
    this.catalog_SpinBox.enabled = true;
    this.catalog_SpinBox.setFixedWidth( spinBoxWidth );
    this.catalog_SpinBox.autoAdjustWidth = false;
    this.catalog_SpinBox.onValueUpdated = function( value )
    {
        data.id = value;
    };

    this.catalog_Sizer = new HorizontalSizer;
    this.catalog_Sizer.spacing = 4;
    this.catalog_Sizer.add( this.catalog_Label );
    this.catalog_Sizer.add( this.catalog_ComboBox, 100 );
    this.catalog_Sizer.add( this.catalog_SpinBox);


    // RA
    this.ra_Label = new Label( this );
    this.ra_Label.text = "Right Ascension:";
    this.ra_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

    this.ra_h_SpinBox = new SpinBox( this );
    this.ra_h_SpinBox.minValue = 0;
    this.ra_h_SpinBox.maxValue = 23;
    this.ra_h_SpinBox.value = data.ra_h;
    this.ra_h_SpinBox.toolTip = "";
    this.ra_h_SpinBox.enabled = false;
    this.ra_h_SpinBox.setFixedWidth( spinBoxWidth );
    this.ra_h_SpinBox.onValueUpdated = function( value )
    {
        data.ra_h = value;
    };

    this.ra_min_SpinBox = new SpinBox( this );
    this.ra_min_SpinBox.minValue = 0;
    this.ra_min_SpinBox.maxValue = 59;
    this.ra_min_SpinBox.value = data.ra_min;
    this.ra_min_SpinBox.toolTip = "";
    this.ra_min_SpinBox.enabled = false;
    this.ra_min_SpinBox.setFixedWidth( spinBoxWidth );
    this.ra_min_SpinBox.onValueUpdated = function( value )
    {
        data.ra_min = value;
    };

    this.ra_sec_SpinBox = new SpinBox( this );
    this.ra_sec_SpinBox.minValue = 0;
    this.ra_sec_SpinBox.maxValue = 59;
    this.ra_sec_SpinBox.value = data.ra_sec;
    this.ra_sec_SpinBox.toolTip = "";
    this.ra_sec_SpinBox.enabled = false;
    this.ra_sec_SpinBox.setFixedWidth( spinBoxWidth );
    this.ra_sec_SpinBox.onValueUpdated = function( value )
    {
        data.ra_sec = value;
    };

    this.ra_Sizer = new HorizontalSizer;
    this.ra_Sizer.spacing = 4;
    this.ra_Sizer.add( this.ra_Label );
    this.ra_Sizer.add( this.ra_h_SpinBox );
    this.ra_Sizer.add( this.ra_min_SpinBox );
    this.ra_Sizer.add( this.ra_sec_SpinBox );

    // DEC

    this.isNorth_CheckBox = new CheckBox(this);
    this.isNorth_CheckBox.text = "South";
    this.isNorth_CheckBox.checked = !data.north;
    this.isNorth_CheckBox.toolTip = "";
    this.isNorth_CheckBox.onCheck = function( checked )
    {
        data.north = !checked;
    };

    this.dec_Label = new Label( this );
    this.dec_Label.text = "Declination:";
    this.dec_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

    this.dec_h_SpinBox = new SpinBox( this );
    this.dec_h_SpinBox.minValue = 0;
    this.dec_h_SpinBox.maxValue = 90;
    this.dec_h_SpinBox.value = data.dec_h;
    this.dec_h_SpinBox.toolTip = "";
    this.dec_h_SpinBox.enabled = false;
    this.dec_h_SpinBox.setFixedWidth( spinBoxWidth );
    this.dec_h_SpinBox.onValueUpdated = function( value )
    {
        data.dec_h = value;
    };

    this.dec_min_SpinBox = new SpinBox( this );
    this.dec_min_SpinBox.minValue = 0;
    this.dec_min_SpinBox.maxValue = 59;
    this.dec_min_SpinBox.value = data.dec_min;
    this.dec_min_SpinBox.toolTip = "";
    this.dec_min_SpinBox.enabled = false;
    this.dec_min_SpinBox.setFixedWidth( spinBoxWidth );
    this.dec_min_SpinBox.onValueUpdated = function( value )
    {
        data.dec_min = value;
    };

    this.dec_sec_SpinBox = new SpinBox( this );
    this.dec_sec_SpinBox.minValue = 0;
    this.dec_sec_SpinBox.maxValue = 59;
    this.dec_sec_SpinBox.value = data.dec_sec;
    this.dec_sec_SpinBox.toolTip = "";
    this.dec_sec_SpinBox.enabled = false;
    this.dec_sec_SpinBox.setFixedWidth( spinBoxWidth );
    this.dec_sec_SpinBox.onValueUpdated = function( value )
    {
        data.dec_sec = value;
    };

    this.dec_Sizer = new HorizontalSizer;
    this.dec_Sizer.spacing = 4;
    this.dec_Sizer.add( this.isNorth_CheckBox );
    this.dec_Sizer.add( this.dec_Label );
    this.dec_Sizer.add( this.dec_h_SpinBox );
    this.dec_Sizer.add( this.dec_min_SpinBox );
    this.dec_Sizer.add( this.dec_sec_SpinBox );

    this.dmParGroupBox = new GroupBox( this );
    this.dmParGroupBox.title = "Target Selection";
    this.dmParGroupBox.sizer = new VerticalSizer;
    this.dmParGroupBox.sizer.margin = 6;
    this.dmParGroupBox.sizer.spacing = 4;
    this.dmParGroupBox.sizer.add( this.catalog_Sizer );
    this.dmParGroupBox.sizer.add( this.ra_Sizer );
    this.dmParGroupBox.sizer.add( this.dec_Sizer );

    // Eyepice options
    this.fovX_Label = new Label( this );
    this.fovX_Label.text = "Horizontal:";
    this.fovX_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
    this.fovX_Label.minWidth = labelWidth1;

    this.fovX_SpinBox = new SpinBox( this );
    this.fovX_SpinBox.minValue = 1;
    this.fovX_SpinBox.maxValue = 120;
    this.fovX_SpinBox.value = data.fovX;
    this.fovX_SpinBox.toolTip = "";
    this.fovX_SpinBox.onValueUpdated = function( value )
    {
        data.fovX = value;
    };

    this.fovX_Sizer = new HorizontalSizer;
    this.fovX_Sizer.spacing = 4;
    this.fovX_Sizer.add( this.fovX_Label );
    this.fovX_Sizer.add( this.fovX_SpinBox );
    this.fovX_Sizer.addStretch();

    this.fovY_Label = new Label( this );
    this.fovY_Label.text = "Vertical:";
    this.fovY_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
    this.fovY_Label.minWidth = labelWidth1;

    this.fovY_SpinBox = new SpinBox( this );
    this.fovY_SpinBox.minValue = 1;
    this.fovY_SpinBox.maxValue = 120;
    this.fovY_SpinBox.value = data.fovY;
    this.fovY_SpinBox.toolTip = "";
    this.fovY_SpinBox.onValueUpdated = function( value )
    {
        data.fovY = value;
    };

    this.fovY_Sizer = new HorizontalSizer;
    this.fovY_Sizer.spacing = 4;
    this.fovY_Sizer.add( this.fovY_Label );
    this.fovY_Sizer.add( this.fovY_SpinBox );
    this.fovY_Sizer.addStretch();

    this.dseParGroupBox = new GroupBox( this );
    this.dseParGroupBox.title = "Field Of View (arcmin)";
    this.dseParGroupBox.sizer = new VerticalSizer;
    this.dseParGroupBox.sizer.margin = 6;
    this.dseParGroupBox.sizer.spacing = 4;
    this.dseParGroupBox.sizer.add( this.fovX_Sizer );
    this.dseParGroupBox.sizer.add( this.fovY_Sizer );

    // usual control buttons
    this.ok_Button = new PushButton( this );
    this.ok_Button.text = "OK";
    this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
    this.ok_Button.onClick = function()
    {
        this.dialog.ok();
    };

    this.cancel_Button = new PushButton( this );
    this.cancel_Button.text = "Cancel";
    this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
    this.cancel_Button.onClick = function()
    {
        this.dialog.cancel();
    };

    this.buttons_Sizer = new HorizontalSizer;
    this.buttons_Sizer.spacing = 6;
    this.buttons_Sizer.addStretch();
    this.buttons_Sizer.add( this.ok_Button );
    this.buttons_Sizer.add( this.cancel_Button );

    this.sizer = new VerticalSizer;
    this.sizer.margin = 8;
    this.sizer.spacing = 6;
    this.sizer.add( this.helpLabel );
    this.sizer.addSpacing( 4 );
    this.sizer.add( this.dmParGroupBox);
    this.sizer.add( this.dseParGroupBox);
    this.sizer.add( this.buttons_Sizer );

    this.windowTitle = TITLE + " Script";
    this.adjustToContents();
    this.setFixedSize();
}

DSSImageDownloaderSkinDialog.prototype = new Dialog;

/*
 * Script entry point.
 */
function main()
{
    console.hide();

    var dialog = new DSSImageDownloaderSkinDialog();
    for ( ;; )
    {
        if ( !dialog.execute() )
            break;

        // main routine.
        showImage( data );

        // Quit after successful execution.
        break;
    }
}

main();
