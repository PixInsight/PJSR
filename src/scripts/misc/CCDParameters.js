/*
   CCDParameters.js v0.3.3
   Determine basic parameters of your CCD camera.

   Copyright (C) 2009 Georg Viehoever

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

/*
   Changelog:

   0.3.3  * (tstibor) Fixed warning reference to undefined property this.x0

   0.3.2  * (jconejero) Fixed 'onvalueUpdated' typos (replaced with
            'onValueUpdated'), which were raising 'assignment to undeclared
            variable onvalueUpdated' warnings.
          * (jconejero) Changed 'ImageStatistics' function name to
            'DoImageStatistics'. PJSR core objects cannot be replaced with
            external implementations.

   0.3.1  (jconejero) several GUI fixes (mainly sizer spacings). Fixed null
          view checks (View.isNull property).

   0.3.0: (ruediger) added second dark input to enable measurement of dark noise rate
          added input box for camera's maximum ADU value
          compute dynamic range (fullwell / readout noise)
          GUI improvements

   0.2.0: (ruediger) nearly totally rewritten to handle cfa data, grayscale, rgb data,
          computation moved to javascript ImageStatistics function
          reading exposure time and iso speed from FITS header, if available
          region of interest can be defined
          USE TABSTOP=2 FOR PROPER FORMATTING

   0.1.0: Initial version
*/

// ======== #features ==============================================================
#feature-id    Instrumentation > BasicCCDParameters

#feature-info  Determines some basic parameters for CCD cameras.<br/>\
   <br/>\
   Uses the procedure described in <i>The Handbook of Astronomical Image Processing</i> \
   by Richard Berry and James Burnell, Second Printing, Errata for chapter \
   &quot;8.2 Basic CCD Testing&quot;:<br/>\
   <br/>\
   http:&#47;&#47;www.willbell.com/aip4win/Errata%20to%202nd%20%20Printing%202nd%20Edition%20of%20HAIP.pdf<br/>\
   <br/>\
   Other useful resources:<br/>\
   <br/>\
   Methodology, Sensor Data: http:&#47;&#47;www.clarkvision.com/imagedetail/digital.sensor.performance.summary/<br/>\
   Canon EOS 40d data: http:&#47;&#47;astrosurf.com/buil/eos40d/test.htm<br/>\
   <br/>\
   Copyright (C) 2010 Georg Viehoever

// #feature-icon  Batch_BasicCCDParameters.xpm


// ========= # defines =============================================================

/// define for debugging output
//#define __DEBUG__

#define TITLE   "Basic CCD Parameters"
#define VERSION "0.3.1"
#define TOOLTIP "<p>Determines some basic parameters for CCD cameras<br/>\
   <br/>\
   Uses the procedure described in <i>The Handbook of Astronomical Image Processing</i> \
   by Richard Berry and James Burnell, Second Printing, Errata for chapter \
   \"8.2 Basic CCD Testing\". See:<br/>\
   <br/>\
   http:&#47;&#47;www.willbell.com/aip4win/Errata%20to%202nd%20%20Printing%202nd%20Edition%20of%20HAIP.pdf</p>"

#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/NumericControl.jsh>
#include <pjsr/FontFamily.jsh>

// include constants
#include <pjsr/ImageOp.jsh>
#include <pjsr/SampleType.jsh>
#include <pjsr/UndoFlag.jsh>

// --
// DoImageStatistics:
// Utility function to compute mean and stdDev within a rectangle of a single given image
// or a combination of two images. mean and stdDev are computed for each color channel
// or in case of CFA grayscale images, for each bayer matrix subchannel as follows:
// +--+--+
// |C0|C1|
// +--+--+
// |C2|C3|
// +--+--+
//
// img: Array of either one or two images
// imgFunc: if two images are provided, callback function for combination of img0 and img1
//
// params: {
//   x0    :
//   y0    : upper left corner of analysis rectangle
//   width :
//   height: dimension of analysis rectangle
//   isCFA : true in case of grayscale(!) CFA images
//   scale : factor for transforming normalized [0,1] range to ADU values
// }
// returns: {
//   mean  : array of mean, indexed by colorplane (isCFA=false), bayer matrix subchannel otherwise
//   stddev: same for stddev
// }
function DoImageStatistics( img, imgFunc, params )
{
	if ( img.length < 1 || img.length > 2 ) {
		throw( "DoImageStatistics: one image or two images with supplied image operator function required" );
	}
	var x0		= params.x0	|| 0;
	var y0		= params.y0	|| 0;
	var width	= params.width	|| ( img[0].width  - x0 );
	var height= params.height	|| ( img[0].height - y0 );
	var isCFA	= params.isCFA	|| false;
	var scale = params.scale	|| 1.0;

#ifdef __DEBUG__
	Console.writeln( "DoImageStatistics: enter" );
	Console.writeln( "DoImageStatistics: x0,y0=" + x0 + "," + y0 + ", width x height = " + width + " x " + height );
	Console.writeln( "DoImageStatistics: isCFA   = " + isCFA + ", scale = " + scale );
	Console.writeln( "DoImageStatistics: #images = " + img.length );
	Console.writeln( "DoImageStatistics: img.width x img.height = " + img[0].width + " x " + img[0].height );

	Console.flush();
#endif

	if ( width < 2 || height < 2 ) {
		throw( "DoImageStatistics: width x height too small" );
	}
	if ( img.length == 2 ) {
		if ( img[0].width != img[1].width || img[0].height != img[1].height ) {
			throw( "DoImageStatistics: incompatible image dimensions (width/height)" );
		}
		if ( img[0].numberOfChannels != img[1].numberOfChannels || img[0].colorSpace != img[1].colorSpace ) {
			throw( "DoImageStatistics: incompatible colorspaces or number of channels" );
		}
		if ( x0 + width > img[0].width || y0 + height > img[0].height ) {
			throw( "DoImageStatistics: image rectangle out of bounds" );
		}
		if ( typeof( imgFunc ) != 'function' ) {
			throw( "DoImageStatistics: no image function supplied" );
		}
	}
	// indexed by channel (R/G/B) in case of color/gray images, Bayer matrix subchannel (C0/C1/C2/C3) otherwise
	var imgMean		= [];
	var imgStdDev	= [];

	if ( isCFA ) {
		// =====================
		// === CFA grayscale ===
		// =====================
		for ( var c = 0; c < 4; c++ ) {
			var n = 0;	// counting pixel, useful if in further versions bad pixels (cold, hot etc.) are rejected
			var s = 0;

			var xOffset = c & 1;
			var yOffset = c >> 1;

			for ( var x = x0 + xOffset; x < x0 + width; x += 2 ) {
				for ( var y = y0 + yOffset; y < y0 + height; y += 2 ) {
					// TODO: reject bad pixel
					s += ( img.length == 1 ) ? img[0].sample( x, y ) : imgFunc( img[0].sample( x, y ), img[1].sample( x, y ) );
					n++;
				}
			}
			imgMean[c] = s / n;

			n = 0;
			s = 0;

			for ( var x = x0 + xOffset; x < x0 + width; x += 2 ) {
				for ( var y = y0 + yOffset; y < y0 + height; y += 2 ) {
					// TODO: reject bad pixel
					var pix = ( img.length == 1 ) ? img[0].sample( x, y ) : imgFunc( img[0].sample( x, y ), img[1].sample( x, y ) );
					s += ( pix - imgMean[c] ) * ( pix - imgMean[c] );
					n++;
				}
			}
			imgStdDev[c] = Math.sqrt( s / ( n - 1 ) );
		}
	}
	else {
		// ===================================
		// === monochrome grayscale or RGB ===
		// ===================================
		for ( var c = 0; c < img[0].numberOfChannels; c++ ) {
			var n = 0;
			var s = 0;

			for ( var x = x0; x < x0 + width; x++ ) {
				for ( var y = y0; y < y0 + height; y++ ) {
					s += ( img.length == 1 ) ? img[0].sample( x, y, c ) : imgFunc( img[0].sample( x, y, c ), img[1].sample( x, y, c ) );
					n++;
				}
			}
			imgMean[c] = s / n;

			s = 0;
			n = 0;

			for ( var x = x0; x < x0 + width; x++ ) {
				for ( var y = y0; y < y0 + height; y++ ) {
					var pix = ( img.length == 1 ) ? img[0].sample( x, y, c ) : imgFunc( img[0].sample( x, y, c ), img[1].sample( x, y, c ) );
					s += ( pix - imgMean[c] ) * ( pix - imgMean[c] );
					n++;
				}
			}
			imgStdDev[c] = Math.sqrt( s / ( n - 1 ) );
		}
	}
#ifdef __DEBUG__
	for ( var c = 0; c < imgMean.length; c++ ) {
		Console.writeln( "DoImageStatistics: imgMean[" + c + "] = " + format( "%.3f", imgMean[c] ) );
		Console.flush();
	}
#endif

	for ( var c = 0; c < imgMean.length; c++ ) {
		imgMean[c]	 *= scale;
		imgStdDev[c] *= scale;
	}
	return {
		mean		: imgMean,
		stddev	: imgStdDev
	};
}

function CCDData()
{
	var self = this;

	// images to be used for estimates
	this.flat1 = null;
	this.flat2 = null;
	this.bias1 = null;
	this.bias2 = null;
	this.dark1 = null;
	this.dark2 = null;

	this.dark1ExposureTime	=  30;
	this.dark2ExposureTime	= 300;		// should be about 10 times the exposure time of dark1

	this.readoutBits				=  16;
	this.adConverterBits		=  14;
	this.maximumADU					= Math.pow2( this.adConverterBits ) - 1;
	this.isCFAData					= false;

	// dimension width/height of last set image
	this.imageDimension		= null;

	// area used for analysis
	this.analysisRect			= null;

	this.reportHeaderNames		= [ "Measurement", "R/C0", "G/C1", "B/C2", "-/C3", "Units" ];
	this.reportHeaderLengths	= [ 130,           50,     50,     50,     50,     60      ];

	this.getReportHeaderNames = function() {
		return self.reportHeaderNames;
	}
	this.getReportHeaderLengths = function() {
		return self.reportHeaderLengths;
	}
	this.setFlat1 = function( flat1 ) { self.setImageDimension( self.flat1 = flat1 ); }
	this.setFlat2 = function( flat2 ) { self.setImageDimension( self.flat2 = flat2 ); }
	this.setBias1 = function( bias1 ) { self.setImageDimension( self.bias1 = bias1 ); }
	this.setBias2 = function( bias2 ) { self.setImageDimension( self.bias2 = bias2 ); }
	this.setDark1	= function( dark1 ) { self.setImageDimension( self.dark1 = dark1 ); }
	this.setDark2	= function( dark2 ) { self.setImageDimension( self.dark2 = dark2 ); }

	this.setImageDimension = function( img ) {
		if ( null != img && img.width > 0 && img.height > 0 ) {
			self.imageDimension = new Rect( img.width, img.height );
		}
	}
	this.clearAnalysisRectangle = function() {
		self.analysisRect = null;
	}
	this.setAnalysisRectangle = function( analysisRect ) {
		self.analysisRect = analysisRect;
	}
	this.getCFA = function() {
		return self.isCFAData;
	}
	this.setCFA = function( cfa ) {
		self.isCFAData = cfa;
	}
	this.getDark1ExposureTime = function() {
		return self.dark1ExposureTime;
	}
	this.setDark1ExposureTime = function( darkExposureTime ) {
		self.dark1ExposureTime = darkExposureTime;
	}
	this.getDark2ExposureTime = function() {
		return self.dark2ExposureTime;
	}
	this.setDark2ExposureTime = function( darkExposureTime ) {
		self.dark2ExposureTime = darkExposureTime;
	}
	this.setReadoutBits = function( readoutBits ) {
		self.readoutBits = readoutBits;
	}
	this.getReadoutBits = function() {
		return self.readoutBits;
	}
	this.setReadoutBits = function( readoutBits ) {
		self.readoutBits = readoutBits;
	}
	this.getAdConverterBits = function() {
		return self.adConverterBits;
	}
	this.setAdConverterBits = function( adConverterBits ) {
		self.adConverterBits = adConverterBits;
	}
	this.getMaximumADU = function() {
		return self.maximumADU;
	}
	this.setMaximumADU = function( maximumADU ) {
		self.maximumADU = maximumADU;
	}
	this.allImagesValid = function() {
		// for most of the Report to work, dark2 is optional
		return self.flat1 && self.flat2 && self.bias1 && self.bias2 && self.dark1;
	}
	this.report = function() {
		// Image statistics
		var bias1Mean					= [ "---", "---", "---", "---" ];
		var bias1StdDev				= [ "---", "---", "---", "---" ];
		var dark1Mean					= [ "---", "---", "---", "---" ];
		var dark1StdDev				= [ "---", "---", "---", "---" ];
		var dark2Mean					= [ "---", "---", "---", "---" ];
		var dark2StdDev				= [ "---", "---", "---", "---" ];

		var flatSumMean				= [ "---", "---", "---", "---" ];
		var flatDiffStdDev		= [ "---", "---", "---", "---" ];
		var biasSumMean				= [ "---", "---", "---", "---" ];
		var biasDiffStdDev		= [ "---", "---", "---", "---" ];
		var darkMinusBiasMean	= [ "---", "---", "---", "---" ];

		// derived CCD statistics
		var gain							= [ "---", "---", "---", "---" ];
		var readoutADU				= [ "---", "---", "---", "---" ];
		var readoutE					= [ "---", "---", "---", "---" ];
		var darkCurrent				= [ "---", "---", "---", "---" ];
		var fullwell					= [ "---", "---", "---", "---" ];
		var dynamicRange			= [ "---", "---", "---", "---" ];

		if ( self.allImagesValid() ) {
			// if no user supplied preview is given, analysis rect is taken from
			// image dimensions, inner center with 1/9th of image size
			if ( null == self.analysisRect ) {
				var xw = Math.floor( self.imageDimension.width  / 3 ) & ~3;
				var yw = Math.floor( self.imageDimension.height / 3 ) & ~3;

				self.analysisRect = new Rect( xw, yw, xw + xw, yw + yw );
			}
			// Parameters for DoImageStatistics function call
			var params = {
					x0:			self.analysisRect.x0,
					y0:			self.analysisRect.y0,
					width:	self.analysisRect.width,
					height:	self.analysisRect.height,
					isCFA:	self.isCFAData,
					scale:	Math.pow2( self.readoutBits ) - 1
			};
			var stats;

			stats = DoImageStatistics( [ self.bias1 ], null, params );
			bias1Mean		= stats.mean;
			bias1StdDev	= stats.stddev;

			stats = DoImageStatistics( [ self.dark1 ], null, params );
			dark1Mean		= stats.mean;
			dark1StdDev	= stats.stddev;

			if ( null != self.dark2 ) {
				stats = DoImageStatistics( [ self.dark2 ], null, params );
				dark2Mean		= stats.mean;
				dark2StdDev	= stats.stddev;
			}
			stats = DoImageStatistics( [ self.flat1, self.flat2 ], function( p1, p2 ) { return p1 + p2; }, params );
			flatSumMean = stats.mean;

			stats = DoImageStatistics( [ self.flat1, self.flat2 ], function( p1, p2 ) { return p1 - p2; }, params );
			flatDiffStdDev = stats.stddev;

			stats = DoImageStatistics( [ self.bias1, self.bias2 ], function( p1, p2 ) { return p1 + p2; }, params );
			biasSumMean = stats.mean;

			stats = DoImageStatistics( [ self.bias1, self.bias2 ], function( p1, p2 ) { return p1 - p2; }, params );
			biasDiffStdDev = stats.stddev;

			stats = DoImageStatistics( [ self.dark1, self.bias1 ], function( p1, p2 ) { return p1 - p2; }, params );
			darkMinusBiasMean = stats.mean;

			for ( var c = 0; c < flatSumMean.length; c++ ) {
				gain[c]					= ( flatSumMean[c] - biasSumMean[c] ) / ( flatDiffStdDev[c] * flatDiffStdDev[c] - biasDiffStdDev[c] * biasDiffStdDev[c] );

				fullwell[c]			= gain[c] * self.maximumADU;

				readoutADU[c]		= biasDiffStdDev[c] / Math.sqrt( 2.0 );
				readoutE[c]			= gain[c] * readoutADU[c];

				dynamicRange[c]	= fullwell[c] / readoutE[c];

				if ( darkMinusBiasMean[c] > dark1StdDev[c] ) {
					// darkCurrent only gets computed from darkMinusBiasMean if
					// the dark noise really accumulates inside the camera and is not internally subtracted like e.g. in Canon DSLR
					darkCurrent[c] = gain[c] * darkMinusBiasMean[c] / self.dark1ExposureTime;
				}
				else {
					// darkCurrent must be computed from two darks, with exactly the same temperature,
					// but different exposure times.
					if ( null != self.dark2 && self.dark2ExposureTime > self.dark1ExposureTime ) {
						// dark noise is composed of readout noise and heat noise, so we must extract the sigma of the heat noise alone:
						var heat1_noise = Math.sqrt( dark1StdDev[c] * dark1StdDev[c] - bias1StdDev[c] * bias1StdDev[c] );
						var heat2_noise = Math.sqrt( dark2StdDev[c] * dark2StdDev[c] - bias1StdDev[c] * bias1StdDev[c] );

						// "n" units of additional read noise increase sigma(heat noise) by sqrt(n),
						// so too measure the darkCurrent per second:
						var sbq = heat2_noise / heat1_noise;

						darkCurrent[c] = gain[c] * ( sbq * sbq ) / ( self.dark2ExposureTime - self.dark1ExposureTime );
					}
				}
			}
		}
		var formatLine = function( measureString, maxLength, data, formatString, unitString ) {
			var line = [ measureString ];

			for ( var col = 0;col < maxLength; col++ ) {
				if ( col < data.length && data[col] != "---" ) {
					line.push( format( formatString, data[col] ) );
				}
				else {
					line.push( "---" );
				}
			}
			line.push( unitString );

			return line;
   }
   var report = [];

   report.push( formatLine( "mean   B1",		4, bias1Mean,			"%.3f", "ADU" ) );
   report.push( formatLine( "stddev B1",		4, bias1StdDev,		"%.3f", "ADU" ) );
   report.push( formatLine( "mean   D1",		4, dark1Mean,		   "%.3f", "ADU" ) );
   report.push( formatLine( "stddev D1",		4, dark1StdDev,		"%.3f", "ADU" ) );
   report.push( formatLine( "mean   D2",		4, dark2Mean,			"%.3f", "ADU" ) );
   report.push( formatLine( "stddev D2",		4, dark2StdDev,		"%.3f", "ADU" ) );
   report.push( formatLine( "mean   F1+F2",	4, flatSumMean,		"%.3f", "ADU" ) );
   report.push( formatLine( "stddev F1-F2",	4, flatDiffStdDev,	"%.3f", "ADU" ) );
   report.push( formatLine( "mean   B1+B2",	4, biasSumMean,		"%.3f", "ADU" ) );
   report.push( formatLine( "stddev B1-B2",	4, biasDiffStdDev,	"%.3f", "ADU" ) );
   report.push( formatLine( "mean   D1-B1",	4, darkMinusBiasMean,"%.3f", "ADU" ) );
   report.push( formatLine( "gain",				4, gain,					"%.3f", "e/ADU" ) );
   report.push( formatLine( "readout noise",	4, readoutE,			"%.3f", "e" ) );
   report.push( formatLine( "readout noise",	4, readoutADU,			"%.3f", "ADU" ) );
   report.push( formatLine( "dark current",	4, darkCurrent,		"%.3f", "e/sec" ) );
   report.push( formatLine( "fullwell cap.",	4, fullwell,			"%.3f", "e" ) );
   report.push( formatLine( "dynamic range",	4, dynamicRange,		"%.3f", "steps" ) );
   return report;
	}
}

/// dialog for getting params and starting process
function CCDDialog( theCCDData )
{
	var self = this;

	this.__base__ = Dialog;
	this.__base__();

	// init values
	this.ccdData = theCCDData;

	// ----- HELP LABEL
	this.helpLabel = new Label( this );

	this.helpLabel.frameStyle		= FrameStyle_Box;
	this.helpLabel.margin				= 4;
	this.helpLabel.wordWrapping	= true;
	this.helpLabel.useRichText	= true;
	this.helpLabel.text					= "<b>" + TITLE + " v" + VERSION + "</b> &mdash; A script to determine basic CCD Parameters";
	this.helpLabel.toolTip			= TOOLTIP;

	// function for defining view selection control

	// @param labelText text of label
	// @param toolTipText text for tooltip
	// @param setFunction function called when value is changed
	// @return horizontal sizer
	this.createViewSelectionControl = function( labelText, toolTipText, setFunction ) {
		var image_Label = new Label( this );

		image_Label.scaledMinWidth = 50;
		image_Label.text = labelText;
		image_Label.textAlignment = TextAlign_Right | TextAlign_VertCenter;

		var image_ViewList = new ViewList( this );

		image_ViewList.scaledMinWidth = 100;
		image_ViewList.getMainViews();

		image_ViewList.toolTip = toolTipText;

		var imageProperties = new Label( this );

		imageProperties.scaledMinWidth = 150;
		imageProperties.text = "";
		imageProperties.textAlignment = TextAlign_Left | TextAlign_VertCenter;

		image_ViewList.onViewSelected = function( view ) {
			if ( view.isNull ) {
				imageProperties.text = "";
				setFunction( null, 0 );
				return;
			}
			// trying to read ISO and exposure time from FITS Header
			var isoSpeed	= null;
			var expTime		= null;

			for ( var i = 0; i < view.window.keywords.length; i++ ) {
			  var key = view.window.keywords[i];

			  if ( key.name == "EXPTIME" ) {
			  	expTime = parseFloat( key.value );
			  }
				else if ( key.name == "ISOSPEED" ) {
					isoSpeed = parseInt( key.value );
				}
			}
			imageProperties.text = "";

			if ( null != isoSpeed ) {
				imageProperties.text += "ISO:" + isoSpeed;
			}
			if ( null != expTime ) {
				imageProperties.text += " Exp[s]:" + format( "%.6f", expTime );
			}
			setFunction( view.image, expTime );
		}
		var image_Sizer = new HorizontalSizer;

    image_Sizer.spacing = 4;

    image_Sizer.add( image_Label );
    image_Sizer.add( image_ViewList, 100 );
    image_Sizer.add( imageProperties );

    return image_Sizer;
	}
	// create GUI
	this.flat1Image_Sizer = this.createViewSelectionControl( "F1:", "<p>Select the first flat frame.</p>",  self.ccdData.setFlat1 );
	this.flat2Image_Sizer = this.createViewSelectionControl( "F2:", "<p>Select the second flat frame.</p>", self.ccdData.setFlat2 );

	this.bias1Image_Sizer = this.createViewSelectionControl( "B1:", "<p>Select the first bias frame.</p>",  self.ccdData.setBias1 );
	this.bias2Image_Sizer = this.createViewSelectionControl( "B2:", "<p>Select the second bias frame.</p>", self.ccdData.setBias2 );

	this.dark1Image_Sizer = this.createViewSelectionControl( "D1:", "<p>Select the first dark frame.</p>",
		function( img, expTime ) {
			if ( null != expTime ) {
			  self.ccdData.setDark1ExposureTime( expTime );
			  self.dark1TimeControl.setValue( Math.ceil( expTime ) );
			}
			else {
				// value unknown, user must set it
				self.ccdData.setDark1ExposureTime( 99 );
				self.dark1TimeControl.setValue( 99 );
			}
			self.ccdData.setDark1( img );
		}
	);
	this.dark2Image_Sizer = this.createViewSelectionControl( "D2:", "<p>Select the second dark frame. This dark frame is needed for computation of dark current "
																																+ "for cameras with internal dark current subtraction, e.g. Canon DSLR. The exposure time of D2 should be "
																																+ "about 10 times larger than that of D1.</p>",
		function( img, expTime ) {
			if ( null != expTime ) {
			  self.ccdData.setDark2ExposureTime( expTime );
			  self.dark2TimeControl.setValue( Math.ceil( expTime ) );
			}
			else {
				// value unknown, user must set it
				self.ccdData.setDark2ExposureTime( 99 );
				self.dark2TimeControl.setValue( 99 );
			}
			self.ccdData.setDark2( img );
		}
	);
	this.dark1TimeControl = new NumericEdit( this );

	with ( this.dark1TimeControl ) {
		toolTip = "<p>Exposure time of dark frame D1</p>";

		setRange( 1, 999 );
		setPrecision( 0 );

		label.text = "Exposure[s] D1:";

		setValue( self.ccdData.getDark1ExposureTime() );

		onValueUpdated = function( value ) {
			self.ccdData.setDark1ExposureTime( value );
		}
	}
	this.dark2TimeControl = new NumericEdit( this );

	with ( this.dark2TimeControl ) {
		toolTip = "<p>Exposure time of dark frame D2</p>";

		setRange( 1, 999 );
		setPrecision( 0 );

		label.text = "Exposure[s] D2:";

		setValue( self.ccdData.getDark2ExposureTime() );

		onValueUpdated = function( value ) {
			self.ccdData.setDark2ExposureTime( value );
		}
	}
	this.cfaCheckBox = new CheckBox( this );

	with ( this.cfaCheckBox ) {
		toolTip = "<p>When checked, input is treated as gray scale CFA image</p>";

		text = "CFA";
		checked = self.ccdData.getCFA();

		onCheck = function( checked ) {
			self.ccdData.setCFA( checked );
		};
	}
	this.readoutBitsControl = new NumericEdit( this );

	with ( this.readoutBitsControl ) {
		toolTip = "<p>bit depth for scaling standardized [0,1] range to ADU range, e.g. 16 for Canon EOS.</p>";

		setRange( 2, 32 );
		setPrecision( 0 );

    label.text = "Readout depth:";
		label.minWidth = this.font.width( 'x' ) * label.text.length;

		setValue( self.ccdData.getReadoutBits() );

		onValueUpdated = function( value ) {
			self.ccdData.setReadoutBits( value );
		}
	}
	this.bitDepthControl = new NumericEdit( this );

	with ( this.bitDepthControl ) {
		toolTip = "<p>bit depth of camera A/D resolution, e.g. 14 for Canon EOS 40D, 8 for WebCams.</p>";

		setRange( 2, 32 );
		setPrecision( 0 );

		label.text = "A/D bits:";
		label.minWidth = this.font.width( 'x' ) * label.text.length;

		setValue( self.ccdData.getAdConverterBits() );

		onValueUpdated = function( value ) {
			self.ccdData.setAdConverterBits( value );

			var maxADU = Math.pow2( value ) - 1;
			self.ccdData.setMaximumADU( maxADU );
			self.maximumADUControl.setValue( maxADU );
		}
	}
	this.maximumADUControl = new NumericEdit( this );

	with ( this.maximumADUControl ) {
		toolTip = "<p>maximum ADU value the camera can output, to be measured with an oversaturated light frame</p>";

		setRange( 1, 999999 );
		setPrecision( 0 );

		label.text = "Maximum ADU:";
		label.minWidth = this.font.width( 'x' ) * label.text.length;

		setValue( self.ccdData.getMaximumADU() );

		onValueUpdated = function( value ) {
			self.ccdData.setMaximumADU( value );
		}
	}
	this.darkExposurePanel = new HorizontalSizer();

	with ( this.darkExposurePanel ) {
		addSpacing( 55 );

		add( this.dark1TimeControl );
		addSpacing( 10 );
		add( this.dark2TimeControl );

		addStretch();
	}
	this.cameraPanel = new HorizontalSizer();

	with( this.cameraPanel ) {
		addSpacing( 55 );

		add( this.cfaCheckBox );

		addSpacing( 20 );
		add( this.readoutBitsControl );

		addSpacing( 20 );
		add( this.bitDepthControl );

		addSpacing( 20 );
		add( this.maximumADUControl );

		addStretch();
	}
	// == region of interest ==
	var regionLabel = new Label( this );

	regionLabel.text = "ROI:";
	regionLabel.textAlignment = TextAlign_Right | TextAlign_VertCenter;
	regionLabel.scaledMinWidth = 50;

	var previewList = new ViewList( this );

	previewList.scaledMinWidth = 100;
	previewList.getPreviews();

	var previewDimensions = new Label( this );

	previewDimensions.scaledMinWidth = 150;
	previewDimensions.text = "";
	previewDimensions.textAlignment = TextAlign_Left | TextAlign_VertCenter;

	previewList.onViewSelected = function( preview ) {
#ifdef __DEBUG__
		Console.writeln( preview );
		Console.writeln( preview.uniqueId );
#endif
		if ( !preview.isNull ) {
			var r = preview.window.previewRect( preview );
			previewDimensions.text = "x0: " + r.x0 + ", y0: " + r.y0 + ", " + r.width + " x " + r.height;
			self.ccdData.setAnalysisRectangle( r );
		}
		else {
			previewDimensions.text = "(using default area)";
			self.ccdData.clearAnalysisRectangle();
		}
	}
	this.regionPanel = new HorizontalSizer();

	this.regionPanel.spacing = 4;

  this.regionPanel.add( regionLabel );
	this.regionPanel.add( previewList, 100 );
	this.regionPanel.add( previewDimensions );

	// -- Report Button --
	this.report_Button = new PushButton( this );
	this.report_Button.text = "Report";
	this.report_Button.toolTip = "<p>Generate Report for currently selected views.</p>";

	this.report_Button.onClick = function() {
		if ( !self.ccdData.allImagesValid() ) {
			new MessageBox( "Not all images are set or valid.", "Warning", StdIcon_Information, StdButton_Ok ).execute();
			return;
		}
		try {
			self.report_Button.text = "Computing";
			self.report_Button.enabled = false;

			var ccdReport = self.ccdData.report();

			this.parent.displayReport( ccdReport );
		}
		catch ( e ) {
			new MessageBox( e.toString(), "Warning", StdIcon_Information, StdButton_Ok ).execute();
		}
		self.report_Button.text = "Report";
		self.report_Button.enabled = true;
	}
	// -- Quit Button --
	this.quit_Button = new PushButton( this );
	this.quit_Button.text = "Quit";

	this.quit_Button.onClick = function() {
		this.dialog.cancel();
	}
	// -- Button Panel --
	this.buttons_Sizer = new HorizontalSizer;
	this.buttons_Sizer.addStretch();
	this.buttons_Sizer.add( this.report_Button );
   this.buttons_Sizer.addSpacing( 8 );
	this.buttons_Sizer.add( this.quit_Button );

	// -- result report Table --
	this.reportControl = new TreeBox( this );

	with ( this.reportControl ) {
		toolTip = "<p>Output of computed characteristics for your CCD. Press Report button to generate it it.</p>";

		alternateRowColor = true;

		font = new Font( FontFamily_Monospace, 8 );

		var reportHeaderNames		= self.ccdData.getReportHeaderNames();
		var reportHeaderLengths	= self.ccdData.getReportHeaderLengths();

		for ( var i = 0; i < reportHeaderNames.length; ++i ) {
			setColumnWidth( i, reportHeaderLengths[i] );
			setHeaderText( i, reportHeaderNames[i] );
		}
		headerVisible = true;

		setScaledMinSize( 680, 270 );
	}
	// pack everything
	this.sizer = new VerticalSizer;

	with ( this.sizer ) {
		margin = 8;
		spacing = 6;

		add( this.helpLabel );

		var flatGroupBox = new GroupBox( self );
		flatGroupBox.title = "Flat frames";
		flatGroupBox.sizer = new VerticalSizer();
		flatGroupBox.sizer.margin = 4;
		flatGroupBox.sizer.add( self.flat1Image_Sizer );
		flatGroupBox.sizer.addSpacing( 4 );
		flatGroupBox.sizer.add( self.flat2Image_Sizer );

		addSpacing( 4 );
		add( flatGroupBox );

		var biasGroupBox = new GroupBox( self );
		biasGroupBox.title = "Bias frames";
		biasGroupBox.sizer = new VerticalSizer();
		biasGroupBox.sizer.margin = 4;
		biasGroupBox.sizer.add( self.bias1Image_Sizer );
		biasGroupBox.sizer.addSpacing( 4 );
		biasGroupBox.sizer.add( self.bias2Image_Sizer );

		addSpacing( 4 );
		add( biasGroupBox );

		var darkGroupBox = new GroupBox( self );
		darkGroupBox.title = "Dark frames";
		darkGroupBox.sizer = new VerticalSizer();
		darkGroupBox.sizer.margin = 4;
		darkGroupBox.sizer.add( self.dark1Image_Sizer );
		darkGroupBox.sizer.addSpacing( 4 );
		darkGroupBox.sizer.add( self.dark2Image_Sizer );
		darkGroupBox.sizer.addSpacing( 8 );
		darkGroupBox.sizer.add( this.darkExposurePanel );

		addSpacing( 4 );
		add( darkGroupBox );

		var cameraGroupBox = new GroupBox( self );
		cameraGroupBox.title = "Camera properties";
		cameraGroupBox.sizer = self.cameraPanel;
		cameraGroupBox.sizer.margin = 4;

		addSpacing( 8 );
		add( cameraGroupBox );

		var regionGroupBox = new GroupBox( self );
		regionGroupBox.title = "Region of interest";
		regionGroupBox.sizer = self.regionPanel;
		regionGroupBox.sizer.margin = 4;

		addSpacing( 8 );
		add( regionGroupBox );

		addSpacing( 8 );
		add( this.buttons_Sizer );

		addSpacing( 4 );
		add( this.reportControl );
	}
 	// view ccdData.report() in reportControl
 	this.displayReport = function( ccdReport ) {
 		self.reportControl.clear();

 		for ( var i = 0; i < ccdReport.length; ++i ) {
 			var row = ccdReport[i];
 			var treeNode = new TreeBoxNode();

 			for ( var col = 0; col < row.length; ++col ) {
 				var text = row[col].toString();
 				treeNode.setText( col, text );

 				// right align numbers, left align text:
 				if ( text.match( /^[-0-9\. ]+/ ) ) {
 					treeNode.setAlignment( col, Align_Right );
 				}
 				else {
 					treeNode.setAlignment( col, Align_Left );
 				}
 			}
 			self.reportControl.add( treeNode );
 		}
 	}
  // initial report
  var ccdReport = self.ccdData.report();
  this.displayReport( ccdReport );

	this.windowTitle = TITLE + " v" + VERSION;
	this.adjustToContents();
}

CCDDialog.prototype = new Dialog;

function main()
{
	// to display progress
	console.show();
	console.writeln( "CCD Parameters Script started" );

	// allow stop
	console.abortEnabled = true;

#ifdef __DEBUG__
	console.writeln( "Version Info:", coreId, ",", coreVersionBuild, ",", coreVersionMajor, ",", coreVersionMinor, ",", coreVersionRelease );
#endif

	var ccdData		= new CCDData;
	var ccdDialog	= new CCDDialog( ccdData );

	ccdDialog.execute();
	// console.hide();
}

main();
