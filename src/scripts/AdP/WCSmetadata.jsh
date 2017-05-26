/*
   WCS metadata class

   This file is part of ImageSolver and AnnotateImage scripts

   Copyright (C) 2012, Andres del Pozo
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

#define Ext_DataType_Complex     1000  // Complex object with settings
#define Ext_DataType_StringArray 1001  // Array of strings
#define Ext_DataType_JSON        1002  // Serializable object

#include "Projections.js"
#include <pjsr/PropertyType.jsh>
#include <pjsr/PropertyAttribute.jsh>
;

// ******************************************************************
// ObjectWithSettings: Base class for persistent classes
// ******************************************************************
function ObjectWithSettings( module, prefix, properties )
{
   this.module = module;
   this.prefix = prefix;
   this.properties = properties;

   this.MakeSettingsKey = function( property )
   {
      var key = "";
      if( this.module && this.module.length>0 )
         key = this.module + "/";
      if( this.prefix && prefix.length>0 )
         key = key + this.prefix + "/";
      return key + property;
   }

   this.LoadSettings = function()
   {
      for ( var i=0; i<this.properties.length; i++ )
      {
         var property = this.properties[i][0];
         //console.writeln("Reading ", this.MakeSettingsKey( property ) );
         if(property)
         {
            if( this.properties[i][1] == Ext_DataType_Complex ){
               if(this[property] && typeof(this[property].LoadSettings)==='function')
                  this[property].LoadSettings();
            }
            else if( this.properties[i][1] == Ext_DataType_JSON )
            {
               var value = Settings.read( this.MakeSettingsKey( property ), DataType_UCString );
               //console.writeln(Settings.lastReadOK, " ", value );
               if ( Settings.lastReadOK )
                  this[property] = JSON.parse(value);
            }
            else if( this.properties[i][1] == Ext_DataType_StringArray )
            {
               var value = Settings.read( this.MakeSettingsKey( property ), DataType_UCString );
               //console.writeln("Reading ", this.MakeSettingsKey( property ), " ", value );
               if ( Settings.lastReadOK )
                  this[property] = value.split("|");
            }
            else
            {
               var value = Settings.read( this.MakeSettingsKey( property ), this.properties[i][1] );
               // console.writeln(Settings.lastReadOK, " ", value );
               if ( Settings.lastReadOK )
                  this[property] = value;
            }
         }
      }
   };

   this.SaveSettings = function()
   {
      for ( var i=0; i<this.properties.length; i++ )
      {
         var property = this.properties[i][0];
         //console.writeln("Writing ", this.MakeSettingsKey( property ) );
         if ( this[property] != null )
         {
            if( this.properties[i][1] == Ext_DataType_Complex )
               this[property].SaveSettings();
            else if( this.properties[i][1] == Ext_DataType_JSON )
               Settings.write( this.MakeSettingsKey( property ), DataType_UCString, JSON.stringify(this[property]) );
            else if (this.properties[i][1] == Ext_DataType_StringArray)
            {
               var concatString = this.CreateStringArray(this[property]);
               if (concatString != null)
                  Settings.write(this.MakeSettingsKey(property), DataType_UCString, concatString);
            }
            else
               Settings.write( this.MakeSettingsKey( property ), this.properties[i][1], this[property] );
         }
         else
            Settings.remove( this.MakeSettingsKey( property ) );
      }
   };

   this.DeleteSettings = function()
   {
      Settings.remove( this.prefix );
   };

   this.MakeParamsKey = function( property )
   {
      var key = "";
      if( this.prefix && this.prefix.length>0 )
         key = this.prefix.replace("-","") + "_";

      return key + property;
   }

   this.LoadParameters = function()
   {
      for ( var i=0; i<this.properties.length; i++ )
      {
         var property = this.properties[i][0];
         // console.writeln("Reading ", this.MakeParamsKey( property ) );
         if(property)
         {
            if( this.properties[i][1] == Ext_DataType_Complex )
               this[property].LoadParameters();
            else
            {
               var key = this.MakeParamsKey( property );
               if( Parameters.has(key) ){
                  // console.writeln(key," = ", Parameters.get( key ));
                  switch(this.properties[i][1])
                  {
                     case DataType_Boolean:
                        this[property] = Parameters.getBoolean( key );
                        break;
                     case DataType_Int8:
                     case DataType_UInt8:
                     case DataType_Int16:
                     case DataType_UInt16:
                     case DataType_Int32:
                     case DataType_UInt32:
                     case DataType_Int64:
                     case DataType_UInt64:
                        this[property] = parseInt( Parameters.get( key ) );
                        break;
                     case DataType_Double:
                     case DataType_Float:
                        this[property] = Parameters.getReal( key );
                        break;
                     case DataType_String:
                     case DataType_UCString:
                        this[property] = Parameters.getString( key );
                        break;
                  case Ext_DataType_JSON:
                        var valStrEscaped = Parameters.getString(key);
                        // TODO: This is necessary because PI 1.8 doesn't allow " in strings
                        var valStr = valStrEscaped.replace( /\'\'/g, "\"" );
                        this[property] = JSON.parse(valStr);
                        break;
                     case Ext_DataType_StringArray:
                        var value = Parameters.getString( key );
                        if ( value )
                           this[property] = value.split("|");
                        break;
                     default:
                        console.writeln("Unknown type ",this.properties[i][1]);
                  }
               }
            }
         }
      }
   }

   this.SaveParameters = function()
   {
      for ( var i=0; i<this.properties.length; i++ )
      {
         var property = this.properties[i][0];
         // console.writeln("Writing ", this.MakeParamsKey( property ) );
         if ( this[property] != null )
         {
            if( this.properties[i][1] == Ext_DataType_Complex )
               this[property].SaveParameters();
            else if( this.properties[i][1] == Ext_DataType_JSON )
            {
               var valStr = JSON.stringify(this[property]);
               // TODO: This is necessary because PI 1.8 doesn't allow " in strings
               var valStrEscaped = valStr.replace( /\"/g, "\'\'" );
               Parameters.set(this.MakeParamsKey(property), valStrEscaped);
            }
            else if( this.properties[i][1] == Ext_DataType_StringArray )
            {
               var array = this.CreateStringArray(this[property]);
               if (array != null)
                  Parameters.set(this.MakeParamsKey(property), array);
            }
            else
               Parameters.set( this.MakeParamsKey( property ), this[property] );
         }
      }
   };

   this.CreateStringArray = function( array )
   {
      var str = null;
      for(var j=0; j<array.length; j++)
         if( array[j] )
            str = ( str==null) ? array[j] : str+"|"+array[j];
         else
            str = ( str==null) ? "" : str+"|";
      return str;
   }
}

function WCSKeywords()
{
   this.objctra=null;
   this.objctdec=null;
   this.focallen=null;
   this.xpixsz=null;
   this.crval1=null;
   this.crval2=null;
   this.crpix1=null;
   this.crpix2=null;
   this.cd1_1=null;
   this.cd1_2=null;
   this.cd2_1=null;
   this.cd2_2=null;
   this.cdelt1=null;
   this.cdelt2=null;
   this.crota1=null;
   this.crota2=null;
   this.ctype1=null;
   this.ctype2=null;
   this.pv1_1=null;
   this.pv1_2=null;
   this.lonpole=null;
   this.latpole=null;
   this.polDegree=null;

   this.Read=function(keywords)
   {
      for( var i=0; i<keywords.length; i++ )
      {
         var key = keywords[i];
#ifdef DEBUG
         Console.writeln(key.name,": ",key.value);
#endif
         if ( key.name == "OBJCTRA")
         {
            var angle = DMSangle.FromString(key.value, 0, 24);
            if(angle)
               this.objctra = angle.GetValue()*360/24;
         }
         if ( key.name == "OBJCTDEC" )
         {
            var angle = DMSangle.FromString(key.value, 0, 90);
            if(angle)
               this.objctdec = angle.GetValue();
         }
         if ( key.name == "FOCALLEN" )
            this.focallen = parseFloat(key.value);
         if ( key.name == "XPIXSZ" )
            this.xpixsz = parseFloat(key.value);
         if ( key.name == "DATE-OBS" )
         {
            var date = this.ExtractDate(key.value);
            if( date )
               this.epoch = date;
         }

         // if ( key.name == "EPOCH" )
         // epoch=parseFloat(key.value);
         if ( key.name == "CTYPE1" )
            this.ctype1 = key.value.trim();
         if ( key.name == "CTYPE2" )
            this.ctype2 = key.value.trim();
         if ( key.name == "CRVAL1" )
            this.crval1 = parseFloat(key.value);
         if ( key.name == "CRVAL2" )
            this.crval2 = parseFloat(key.value);
         if ( key.name == "CRPIX1" )
            this.crpix1 = parseFloat(key.value);
         if ( key.name == "CRPIX2" )
            this.crpix2 = parseFloat(key.value);
         if ( key.name == "CD1_1" )
            this.cd1_1 = parseFloat(key.value);
         if ( key.name == "CD1_2" )
            this.cd1_2 = parseFloat(key.value);
         if ( key.name == "CD2_1" )
            this.cd2_1 = parseFloat(key.value);
         if ( key.name == "CD2_2" )
            this.cd2_2 = parseFloat(key.value);

         if ( key.name == "CDELT1" )
            this.cdelt1 = parseFloat(key.value);
         if ( key.name == "CDELT2" )
            this.cdelt2 = parseFloat(key.value);
         if ( key.name == "CROTA1" )
            this.crota1 = parseFloat(key.value);
         if ( key.name == "CROTA2" )
            this.crota2 = parseFloat(key.value);

         if ( key.name == "PV1_1" )
            this.pv1_1 = parseFloat(key.value);
         if ( key.name == "PV1_2" )
            this.pv1_2 = parseFloat(key.value);
         if ( key.name == "PV1_3" || key.name == "LONPOLE")
            this.lonpole = parseFloat(key.value);
         if ( key.name == "PV1_4" || key.name == "LATPOLE")
            this.latpole = parseFloat(key.value);

         if ( key.name == "POLYNDEG" )
            this.polDegree = parseInt(key.value);

         if (key.name == "REFSPLINE")
            this.refSpline = key.value !=null && key.value.length>0;
      }
   }

   this.ExtractDate = function( timeStr )
   {
      var match = timeStr.match("'?([0-9]*)-([0-9]*)-([0-9]*)(T([0-9]*):([0-9]*):([0-9]*(\.[0-9]*)?))?'?");
      if( match==null)
         return null;
      var year = parseInt( match[1], 10 );
      var month = parseInt( match[2], 10 );
      var day = parseInt( match[3], 10 );
      var hour = match[5] ? parseInt( match[5], 10 ) : 0;
      var min = match[6] ? parseInt( match[6], 10 ) : 0;
      var sec = match[7] ? parseFloat( match[7] ) : 0;
      var frac = (hour+min/60+sec/3600) / 24;

      return Math.complexTimeToJD( year, month, day, frac );
   };


   this.CreateProjection = function ()
   {
      var ptype1 = this.ctype1.substr(6, 3);
      var ptype2 = this.ctype2.substr(6, 3);
      if (ptype1 != ptype2)
         throw "Invalid WCS coordinates: Axis with different projection";
      if (ptype1 == "TAN")
         return new Gnomonic(180 / Math.PI, this.crval1, this.crval2);
      var proj = null;
      if (ptype1 == "MER")
         proj = new ProjectionMercator();
      else if (ptype1 == "STG")
         proj = new ProjectionStereographic();
      else if (ptype1 == "CAR")
         proj = new ProjectionPlateCarree();
      else if (ptype1 == "ZEA")
         proj = new ProjectionZenithalEqualArea();
      else if (ptype1 == "AIT")
         proj = new ProjectionHammerAitoff();
      else if (ptype1 == "SIN")
         proj = new ProjectionOrthographic();
      else
         throw "Invalid WCS coordinates: Unsuported projection " + ptype1;
      proj.InitFromWCS(this);
      return proj;
   }
}

function DMath()
{
}
//DMath.prototype = new DMath();
DMath.DEG2RAD = Math.PI / 180;
DMath.RAD2DEG = 180 / Math.PI;
DMath.sin = function (x)
{
   return Math.sin(x * this.DEG2RAD);
}
DMath.cos = function (x)
{
   return Math.cos(x * this.DEG2RAD);
}
DMath.tan = function (x)
{
   return Math.tan(x * this.DEG2RAD);
}
DMath.asin = function (x)
{
   return Math.asin(x) * this.RAD2DEG;
}
DMath.acos = function (x)
{
   return Math.acos(x) * this.RAD2DEG;
}
DMath.atan = function (x)
{
   return Math.atan(x) * this.RAD2DEG;
}
DMath.atan2 = function (y, x)
{
   return Math.atan2(y, x) * this.RAD2DEG;
}

// ******************************************************************
// ImageMetadata: Metadata of an image including WCS coordinates
// ******************************************************************
function ImageMetadata(module)
{
   this.__base__ = ObjectWithSettings;
   this.__base__(
      module ? module : SETTINGS_MODULE,
      "metadata",
      new Array(
         ["focal", DataType_Double],
         ["hasFocal", DataType_Boolean],
         ["xpixsz", DataType_Float],
         // ["ypixsz", DataType_Float],
         ["resolution", DataType_Double],
         ["ra", DataType_Double],
         ["dec", DataType_Double],
         ["epoch", DataType_Double]
      )
   );

   this.focal = 1000;
   this.useFocal = true;
   this.xpixsz = 7.4;
   // this.ypixsz = 7.4;
   this.epoch = null; // 2451545.0; // J2000
   this.ra = null;
   this.dec = null;

   this.Clone = function()
   {
      var clone = new ImageMetadata();
      for ( var field in this )
         clone[field] = this[field];
      return clone;
   };

   this.ExtractMetadata = function (window)
   {
      var wcs = new WCSKeywords();
      wcs.Read(window.keywords);

      if(wcs.xpixsz)
         this.xpixsz = wcs.xpixsz;
      this.epoch = wcs.epoch;
      this.width = window.mainView.image.width;
      this.height = window.mainView.image.height;
      this.ref_I_G_lineal = null;
      this.ref_I_G = null;
      this.ref_G_I = null;

      if (wcs.ctype1 && wcs.ctype1.substr(0, 5) == "'RA--" &&
         wcs.ctype2 && wcs.ctype2.substr(0, 5) == "'DEC-" &&
         wcs.crpix1 != null && wcs.crpix2 != null && wcs.crval1 != null && wcs.crval2 != null)
      {
         try
         {
            this.projection = wcs.CreateProjection();

            var ref_F_G;
            if (wcs.cd1_1 != null && wcs.cd1_2 != null && wcs.cd2_1 != null && wcs.cd2_2 != null)
            {
               ref_F_G = new Matrix(
                  wcs.cd1_1, wcs.cd1_2, -wcs.cd1_1 * wcs.crpix1 - wcs.cd1_2 * wcs.crpix2,
                  wcs.cd2_1, wcs.cd2_2, -wcs.cd2_1 * wcs.crpix1 - wcs.cd2_2 * wcs.crpix2,
                  0, 0, 1);
            }
            else if (wcs.cdelt1 != null && wcs.cdelt2 != null /*&& crota2 != null*/)
            {
               if (wcs.crota2 == null)
                  wcs.crota2 = 0;
               var rot = wcs.crota2 * Math.PI / 180;
               var cd1_1 = wcs.cdelt1 * Math.cos(rot);
               var cd1_2 = -wcs.cdelt2 * Math.sin(rot);
               var cd2_1 = wcs.cdelt1 * Math.sin(rot);
               var cd2_2 = wcs.cdelt2 * Math.cos(rot);
               ref_F_G = new Matrix(
                  cd1_1, cd1_2, -cd1_1 * wcs.crpix1 - cd1_2 * wcs.crpix2,
                  cd2_1, cd2_2, -cd2_1 * wcs.crpix1 - cd2_2 * wcs.crpix2,
                  0, 0, 1);
            }
            if (ref_F_G != null)
            {
               var ref_F_I = new Matrix(
                  1, 0, -0.5,
                  0, -1, this.height + 0.5,
                  0, 0, 1
               );

               var controlPointsBArray = window.mainView.propertyValue("Transformation_ImageToProjection");
               if(wcs.refSpline && (controlPointsBArray==null || !(controlPointsBArray instanceof ByteArray)))
                  console.warningln("WARNING: The astrometric solution has lost the distortion correction.")
               if (wcs.refSpline && controlPointsBArray && controlPointsBArray instanceof ByteArray)
               {
                  this.loadControlPoints(controlPointsBArray);
               }
               else if (wcs.polDegree != null && wcs.polDegree > 1)
               {
                  this.ref_I_G_lineal = ref_F_G.mul(ref_F_I.inverse());
                  this.ref_I_G = new ReferNPolyn(wcs.polDegree);
                  this.ref_G_I = new ReferNPolyn(wcs.polDegree);

                  try
                  {
                     var idx = 0;
                     var keywords = window.keywords;
                     for (var o = 0; o <= this.ref_I_G.polDegree; o++)
                     {
                        for (var yi = 0; yi <= o; yi++)
                        {
                           var xi = o - yi;
                           this.ref_I_G.at(0, idx, this.GetKeywordFloat(keywords, format("REFX_%d%d", xi, yi), true));
                           this.ref_I_G.at(1, idx, this.GetKeywordFloat(keywords, format("REFY_%d%d", xi, yi), true));
                           this.ref_G_I.at(0, idx, this.GetKeywordFloat(keywords, format("INVX_%d%d", xi, yi), true));
                           this.ref_G_I.at(1, idx, this.GetKeywordFloat(keywords, format("INVY_%d%d", xi, yi), true));
                           idx++;
                        }
                     }
                  } catch (ex)
                  {
                     console.writeln("Invalid advanced referentiation: ", ex);
                     this.ref_I_G = this.ref_I_G_lineal;
                     this.ref_G_I = this.ref_I_G.inverse();
                  }
               }
               else
               {
                  this.ref_I_G_lineal = ref_F_G.mul(ref_F_I.inverse());
                  this.ref_I_G = this.ref_I_G_lineal;
                  this.ref_G_I = this.ref_I_G.inverse();
               }

               var centerG = this.ref_I_G.Apply(new Point(this.width / 2, this.height / 2));
               var center = this.projection.Inverse(centerG);
               this.ra = center.x;
               this.dec = center.y;

               var resx = Math.sqrt(ref_F_G.at(0, 0) * ref_F_G.at(0, 0) + ref_F_G.at(0, 1) * ref_F_G.at(0, 1));
               var resy = Math.sqrt(ref_F_G.at(1, 0) * ref_F_G.at(1, 0) + ref_F_G.at(1, 1) * ref_F_G.at(1, 1));
               this.resolution = (resx + resy) / 2;
               this.useFocal = false;
               if (this.xpixsz > 0)
                  this.focal = this.FocalFromResolution(this.resolution);
            }
         } catch (ex)
         {
            console.writeln(ex);
         }
      }

      if (this.ref_I_G == null)
      {
         if (wcs.objctra != null)
            this.ra = wcs.objctra;
         if (wcs.objctdec != null)
            this.dec = wcs.objctdec;
         if (wcs.focallen > 0)
         {
            this.focal = wcs.focallen;
            this.useFocal = true;
         }
         if (this.useFocal && this.xpixsz > 0)
            this.resolution = this.ResolutionFromFocal(this.focal);
      }
   }

   this.GetDateString = function( epoch )
   {
      var dateArray = Math.jdToComplexTime(epoch);
      var hours=Math.floor(dateArray[3]*24);
      var min=Math.floor(dateArray[3]*24*60)-hours*60;
      var sec=dateArray[3]*24*3600-hours*3600-min*60;
      var dateStr=format("%04d-%02d-%02dT%02d:%02d:%0.2f",dateArray[0],dateArray[1],dateArray[2],hours,min,sec);
      return dateStr;
   }

   this.ResolutionFromFocal = function( focal )
   {
      return (focal > 0) ? this.xpixsz/focal*0.18/Math.PI : 0;
   };

   this.FocalFromResolution = function( resolution )
   {
      return (resolution > 0) ? this.xpixsz/resolution*0.18/Math.PI : 0;
   };

   this.GetWCSvalues = function ()
   {
      var ref_F_I = new Matrix(
         1, 0, -0.5,
         0, -1, this.height + 0.5,
         0, 0, 1
      );
      var ref_F_G;
      if(this.ref_I_G instanceof ReferSpline)
         ref_F_G = this.ref_I_G_lineal.mul(ref_F_I);
      else if (this.ref_I_G.polDegree && this.ref_I_G.polDegree != 1)
         ref_F_G = this.ref_I_G_lineal.mul(ref_F_I);
      else
      {
         if (this.ref_I_G.ToLinealMatrix)
            ref_F_G = this.ref_I_G.ToLinealMatrix().mul(ref_F_I);
         else
            ref_F_G = this.ref_I_G.mul(ref_F_I);
      }

      //ref_F_G.Print();

      var wcs = this.projection.GetWCS();

      wcs.cd1_1 = ref_F_G.at(0, 0);
      wcs.cd1_2 = ref_F_G.at(0, 1);
      wcs.cd2_1 = ref_F_G.at(1, 0);
      wcs.cd2_2 = ref_F_G.at(1, 1);

      var orgF = ref_F_G.inverse().Apply(new Point(0, 0));
      wcs.crpix1 = orgF.x;
      wcs.crpix2 = orgF.y;

      // CDELT1, CDELT2 and CROTA2 are computed using the formulas
      // in section 6.2 of http://fits.gsfc.nasa.gov/fits_wcs.html
      // "Representations of celestial coordinates in FITS"
      var rot1, rot2;

      if (wcs.cd2_1 > 0)
         rot1 = Math.atan2(wcs.cd2_1, wcs.cd1_1);
      else if (wcs.cd2_1 < 0)
         rot1 = Math.atan2(-wcs.cd2_1, -wcs.cd1_1);
      else
         rot1 = 0;

      if (wcs.cd1_2 > 0)
         rot2 = Math.atan2(wcs.cd1_2, -wcs.cd2_2);
      else if (wcs.cd1_2 < 0)
         rot2 = Math.atan2(-wcs.cd1_2, wcs.cd2_2);
      else
         rot2 = 0;

      var rot = (rot1 + rot2) / 2;
      rot2 = rot1 = rot;

      if (Math.abs(Math.cos(rot)) > Math.abs(Math.sin(rot)))
      {
         wcs.cdelt1 = wcs.cd1_1 / Math.cos(rot);
         wcs.cdelt2 = wcs.cd2_2 / Math.cos(rot);
      }
      else
      {
         wcs.cdelt1 = wcs.cd2_1 / Math.sin(rot);
         wcs.cdelt2 = -wcs.cd1_2 / Math.sin(rot);
      }

      wcs.crota1 = rot1 * 180 / Math.PI;
      wcs.crota2 = rot2 * 180 / Math.PI;

      return wcs;
   };

   this.GetRotation = function ()
   {
      if (this.ref_I_G_lineal)
      {
         var ref = this.ref_I_G_lineal ? this.ref_I_G_lineal : this.ref_I_G;
         var det = ref.at(0, 1) * ref.at(1, 0) - ref.at(0, 0) * ref.at(1, 1);
         var rot = Math.atan2(ref.at(0, 0) + ref.at(0, 1), ref.at(1, 0) + ref.at(1, 1)) * 180 / Math.PI + 135;
         if (det > 0)
            rot = -90 - rot;
         if (rot < -180)
            rot += 360;
         if (rot > 180)
            rot -= 360;
         return [rot, det > 0];
      }
      else
         return null;
   };

   this.Print = function()
   {
      var ref = this.ref_I_G_lineal ? this.ref_I_G_lineal : this.ref_I_G;
      console.writeln( "Referentiation Matrix (Gnomonic projection = Matrix * Coords[x,y]):" );
      ref.Print();
      var projOrgPx=this.ref_G_I.Apply(new Point(0,0));
      var projOrgRD = new Point(this.projection.ra0*180/Math.PI, this.projection.dec0*180/Math.PI);
      console.writeln( format(    "Projection origin.. [%.6f %.6f]px -> [RA:%ls Dec:%ls]",
         projOrgPx.x,projOrgPx.y,
         DMSangle.FromAngle(projOrgRD.x*24/360).ToString(),DMSangle.FromAngle(projOrgRD.y).ToString()) );
      if(this.ref_I_G.polDegree && this.ref_I_G.polDegree>1)
         console.writeln(  format("Polynomial degree.. %d", this.ref_I_G.polDegree) );
      if (this.controlPoints && (this.ref_I_G instanceof ReferSpline))
      {
         console.writeln(  format("Spline order ...... %d", this.ref_I_G.order));
         console.writeln(  format("Num. ControlPoints. %d", this.controlPoints.pI.length));
      }
      console.writeln( format(    "Resolution ........ %.3f arcsec/px", this.resolution*3600 ) );
      var rotation = this.GetRotation();
      console.writeln( format(    "Rotation .......... %.3f deg", rotation[0] ), rotation[1] ? " (flipped)" : "" );

      if ( this.xpixsz > 0 && this.focal)
      {
         console.writeln( format( "Focal ............. %.2f mm", this.focal ) );
         console.writeln( format( "Pixel size ........ %.2f um", this.xpixsz ) );
      }

      console.writeln( "Field of view ..... ",     this.FieldString( this.width*this.resolution ), " x ", this.FieldString( this.height*this.resolution ) );

      console.write(   "Image center ...... ");  this.PrintCoords( new Point( this.width/2, this.height/2) );
      console.writeln( "Image bounds:" );
      console.write(   "   top-left ....... " ); this.PrintCoords( new Point( 0,          0           ) );
      console.write(   "   top-right ...... " ); this.PrintCoords( new Point( this.width, 0           ) );
      console.write(   "   bottom-left .... " ); this.PrintCoords( new Point( 0,          this.height ) );
      console.write(   "   bottom-right ... " ); this.PrintCoords( new Point( this.width, this.height ) );
   }

   this.PrintCoords = function ( pI )
   {
      var pRD = this.Convert_I_RD( pI );
      if(pRD)
      {
         var ra_val = pRD.x;
         if ( ra_val < 0 )
            ra_val += 360;
         var ra = DMSangle.FromAngle( ra_val*24/360 );
         var dec = DMSangle.FromAngle( pRD.y );
         console.writeln( "RA: ", ra.ToString( true/*hours*/ ), "  Dec: ", dec.ToString() );
      } else
         console.writeln( "------" );
   }

   this.FieldString = function( field )
   {
      var dms = DMSangle.FromAngle( field );
      if ( dms.deg > 0 )
         return format( "%dd %d' %.1f\"", dms.deg, dms.min, dms.sec );
      if ( dms.min > 0 )
         return format( "%d' %.1f\"", dms.min, dms.sec );
      return format( "%.2f\"", dms.sec );
   }

   this.ModifyKeyword = function( keywords, name, value, comment )
   {
      for ( var i=0; i<keywords.length; i++ )
      {
         if ( keywords[i].name == name )
         {
            keywords[i].value = value;
            if ( comment != null )
               keywords[i].comment = comment;
            return;
         }
      }
      keywords.push( new FITSKeyword( name, value, (comment == null) ? "" : comment ) );
   }

   this.RemoveKeyword = function (keywords, name)
   {
      for (var i = 0; i < keywords.length; i++)
      {
         if (keywords[i].name == name)
         {
            keywords.splice(i, 1);
            return;
         }
      }
   };

   this.GetKeywordFloat = function (keywords, name, exception)
   {
      for (var i = 0; i < keywords.length; i++)
         if (keywords[i].name == name)
            return parseFloat(keywords[i].value);
      if (exception)
         throw format("Keyword %ls not found", name);
      return null;
   }

   this.UpdateBasicKeywords = function(keywords)
   {
      if(this.focal>0)
         this.ModifyKeyword( keywords, "FOCALLEN", format( "%.2f", this.focal ),                                        "Focal Length (mm)");
      if(this.xpixsz>0)
      {
         this.ModifyKeyword( keywords, "XPIXSZ",   format( "%.3f", this.xpixsz ),                                       "Pixel size, X-axis (um)" );
         this.ModifyKeyword( keywords, "YPIXSZ",   format( "%.3f", this.xpixsz ),                                       "Pixel size, Y-axis (um)" );
      }
      this.ModifyKeyword( keywords, "OBJCTRA",  '\'' + DMSangle.FromAngle( this.ra*24/360 ).ToString( true ) + '\'', "Image center R.A. (hms)" );
      this.ModifyKeyword( keywords, "OBJCTDEC", '\'' + DMSangle.FromAngle( this.dec ).ToString()             + '\'', "Image center declination (dms)" );
   }

   this.UpdateWCSKeywords = function(keywords)
   {
      var wcs = this.GetWCSvalues();

      this.ModifyKeyword( keywords, "EQUINOX", "2000",                            "Equatorial equinox" );
      this.ModifyKeyword( keywords, "CTYPE1",  wcs.ctype1,                        "Axis1 projection: "+ this.projection.name );
      this.ModifyKeyword( keywords, "CTYPE2",  wcs.ctype2,                        "Axis2 projection: "+ this.projection.name );
      this.ModifyKeyword( keywords, "CRPIX1",  format( "%.6f", wcs.crpix1 ),      "Axis1 reference pixel" );
      this.ModifyKeyword( keywords, "CRPIX2",  format( "%.6f", wcs.crpix2 ),      "Axis2 reference pixel" );
      if(wcs.crval1!=null)
         this.ModifyKeyword( keywords, "CRVAL1",  format( "%.12g", wcs.crval1 ),  "Axis1 reference value" );
      if(wcs.crval2!=null)
         this.ModifyKeyword( keywords, "CRVAL2",  format( "%.12g", wcs.crval2 ),  "Axis2 reference value" );
      if(wcs.pv1_1!=null)
         this.ModifyKeyword( keywords, "PV1_1",  format( "%.12g", wcs.pv1_1 ),    "Native longitude of the reference point" );
      if(wcs.pv1_2!=null)
         this.ModifyKeyword( keywords, "PV1_2",  format( "%.12g", wcs.pv1_2 ),    "Native latitude of the reference point" );
      if(wcs.lonpole!=null)
         this.ModifyKeyword( keywords, "LONPOLE",  format( "%.12g", wcs.lonpole ),"Longitude of the celestial pole" );
      if(wcs.latpole!=null)
         this.ModifyKeyword( keywords, "LATPOLE",  format( "%.12g", wcs.latpole ),"Latitude of the celestial pole" );

      this.ModifyKeyword( keywords, "CD1_1",   format( "%.12g", wcs.cd1_1 ),     "Scale matrix (1,1)" );
      this.ModifyKeyword( keywords, "CD1_2",   format( "%.12g", wcs.cd1_2 ),     "Scale matrix (1,2)" );
      this.ModifyKeyword( keywords, "CD2_1",   format( "%.12g", wcs.cd2_1 ),     "Scale matrix (2,1)" );
      this.ModifyKeyword( keywords, "CD2_2",   format( "%.12g", wcs.cd2_2 ),     "Scale matrix (2,2)" );

      // deprecated
      //this.ModifyKeyword( keywords, "EPOCH",   format( "%.3f", this.epoch ),        "Epoch of coordinates" );

      // AIPS keywords (CDELT1, CDELT2, CROTA1, CROTA2)
      this.ModifyKeyword( keywords, "CDELT1",  format( "%.12g", wcs.cdelt1 ),    "Axis1 scale" );
      this.ModifyKeyword( keywords, "CDELT2",  format( "%.12g", wcs.cdelt2 ),    "Axis2 scale" );
      this.ModifyKeyword( keywords, "CROTA1",  format( "%.12g", wcs.crota1 ),    "Axis1 rotation angle (deg)" );
      this.ModifyKeyword( keywords, "CROTA2",  format( "%.12g", wcs.crota2 ),    "Axis2 rotation angle (deg)" );
   }

   this.UpdateReferKeywords = function (keywords)
   {
      if (this.controlPoints && (this.ref_I_G instanceof ReferSpline))
      {
         this.ModifyKeyword(keywords, "REFSPLINE", "TRUE", "Coordinates stored in properties as splines");
         this.RemoveKeyword(keywords, "POLYNDEG");
         return;
      }
      this.RemoveKeyword(keywords, "REFSPLINE");
      if (!this.ref_I_G.polDegree || this.ref_I_G.polDegree == 1)
      {
         this.RemoveKeyword(keywords, "POLYNDEG");
         return;
      }

      this.ModifyKeyword(keywords, "POLYNDEG", this.ref_I_G.polDegree.toString(), "Polynomial degree");
      var idx = 0;
      for (var o = 0; o <= this.ref_I_G.polDegree; o++)
      {
         for (var yi = 0; yi <= o; yi++)
         {
            var xi = o - yi;
            this.ModifyKeyword(keywords, format("REFX_%d%d", xi, yi), format("%.12g", this.ref_I_G.at(0, idx)), format("CoefX * x^%d * y^%d", xi, yi));
            this.ModifyKeyword(keywords, format("REFY_%d%d", xi, yi), format("%.12g", this.ref_I_G.at(1, idx)), format("CoefY * x^%d * y^%d", xi, yi));
            this.ModifyKeyword(keywords, format("INVX_%d%d", xi, yi), format("%.12g", this.ref_G_I.at(0, idx)), format("InvCoefX * x^%d * y^%d", xi, yi));
            this.ModifyKeyword(keywords, format("INVY_%d%d", xi, yi), format("%.12g", this.ref_G_I.at(1, idx)), format("InvCoefY * x^%d * y^%d", xi, yi));
            idx++;
         }
      }
   }

   this.SaveKeywords = function (imageWindow, beginProcess)
   {
      console.writeln("Save keywords");
      if (beginProcess != false)
         imageWindow.mainView.beginProcess(UndoFlag_Keywords);
      var keywords = imageWindow.keywords;

      this.UpdateBasicKeywords(keywords);
      this.UpdateWCSKeywords(keywords);
      this.UpdateReferKeywords(keywords);

      imageWindow.keywords = keywords;
      if (beginProcess != false)
         imageWindow.mainView.endProcess();
   };

   this.SaveProperties = function (imageWindow)
   {
      console.writeln("Save properties");
      if (this.controlPoints && (this.ref_I_G instanceof ReferSpline))
         this.saveControlPoints(imageWindow);
      else
         imageWindow.mainView.deleteProperty("Transformation_ImageToProjection");
   };

   this.saveControlPoints = function (imageWindow)
   {
      console.writeln("Save controlpoints");
      var lines = ["VERSION:1", "TYPE:SurfaceSpline"];
      lines.push(format("ORDER:%d", this.ref_I_G.order));
      lines.push(format("SMOOTHING:%f", this.ref_I_G.smoothing));
      lines.push("CONTROLPOINTS:[");
      for (var i = 0; i < this.controlPoints.pI.length; i++)
         if (this.controlPoints.pI[i] && this.controlPoints.pG[i])
         {
            if (this.controlPoints.weights)
               lines.push(format("%.16f;%.16f;%.16f;%.16f;%.16f",
                  this.controlPoints.pI[i].x, this.controlPoints.pI[i].y,
                  this.controlPoints.pG[i].x, this.controlPoints.pG[i].y,
                  this.controlPoints.weights[i]));
            else
               lines.push(format("%.16f;%.16f;%.16f;%.16f",
                  this.controlPoints.pI[i].x, this.controlPoints.pI[i].y,
                  this.controlPoints.pG[i].x, this.controlPoints.pG[i].y));
         }
      lines.push("]");

      var byteArray = new ByteArray(lines.join('\n'));
      //console.writeln(byteArray.toString());
      imageWindow.mainView.setPropertyValue("Transformation_ImageToProjection", byteArray,
         PropertyType_ByteArray, PropertyAttribute_Storable | PropertyAttribute_Permanent);
   };

   this.loadControlPoints = function (byteArray)
   {
      console.writeln("Load controlpoints");
      var lines = byteArray.toString().split("\n");
      if (lines.length == 0)
         throw "Invalid coordinates transformation data";
      var tokens = lines[0].split(':');
      if (tokens.length != 2 || tokens[0] != "VERSION" || tokens[1] != 1)
         throw "Invalid coordinates transformation version";

      var order = 2,
         smoothing = 0,
         controlPoints = null;

      for (var i = 1; i < lines.length; i++)
      {
         tokens = lines[i].split(':');
         if (tokens.length != 2)
            continue;
         switch (tokens[0])
         {
         case 'ORDER':
            order = parseInt(tokens[1]);
            break;
         case 'SMOOTHING':
            smoothing = parseFloat(tokens[1]);
            break;
         case 'CONTROLPOINTS':
            if (tokens[1].trim() != '[')
               throw "Invalid coordinates transformation control points";
            i++;
            controlPoints = {
               pI:      [],
               pG:      [],
               weights: null
            };
            for (; i < lines.length && lines[i] != ']'; i++)
            {
               var coords = lines[i].split(';');
               if (coords.length < 4)
                  throw "Invalid coordinates transformation control points";
               if (coords.length < 5 && controlPoints.weights != null)
                  throw "Invalid coordinates transformation control points";
               if (coords.length > 5)
                  throw "Invalid coordinates transformation control points";
               controlPoints.pI.push(new Point(parseFloat(coords[0]), parseFloat(coords[1])));
               controlPoints.pG.push(new Point(parseFloat(coords[2]), parseFloat(coords[3])));
               if (coords.length == 5)
               {
                  if (controlPoints.weights == null)
                     controlPoints.weights = [];
                  controlPoints.weights.push(parseFloat(coords[4]));
               }
            }
            if (controlPoints.weights && controlPoints.pI.length != controlPoints.weights.length)
               throw "Invalid coordinates transformation control points: Mismatched weights";
            break;
         }
      }

      if (controlPoints == null)
         throw "Invalid coordinates transformation: there are not any control points";
      this.controlPoints = controlPoints;
      this.ref_I_G = new ReferSpline(controlPoints.pI, controlPoints.pG, controlPoints.weights, order, smoothing, 2000);
      this.ref_I_G_lineal = MultipleLinearRegression(1, controlPoints.pI, controlPoints.pG).ToLinealMatrix();
      this.ref_G_I = new ReferSpline(controlPoints.pG, controlPoints.pI, controlPoints.weights, order, smoothing, 2000);
      console.writeln(format("Loaded %d control points", controlPoints.pI.length));
   };

   this.RectExpand = function( r, p )
   {
      if(p)
      {
         var x = p.x;
         if (x < this.projection.ra0*180/Math.PI - 180)
            x += 360;
         if (x > this.projection.ra0*180/Math.PI + 180)
            x -= 360;
         //console.writeln(format("%f %f ; %f", x, p.x, p.y));

         if(r)
         {
            r.x0 = Math.min(r.x0, x);
            r.x1 = Math.max(r.x1, x);
            r.y0 = Math.min(r.y0, p.y, 90);
            r.y1 = Math.max(r.y1, p.y, -90);
         } else
            r=new Rect(x, p.y, x, p.y);
      }
      return r;
   }

   this.FindImageBounds = function ()
   {
      var bounds = null;

      var numSteps = 32;
      var sx = this.width / (numSteps - 1);
      var sy = this.height / (numSteps - 1);
      for (var y = 0; y < numSteps; y++)
         for (var x = 0; x < numSteps; x++)
            bounds = this.RectExpand(bounds, this.Convert_I_RD(new Point(x * sx, y * sy)));

      // Check North Pole
      var north_I = this.Convert_RD_I(new Point(this.projection.ra0 * 180 / Math.PI, 90));
      if (north_I && north_I.x >= 0 && north_I.x < this.width && north_I.y >= 0 && north_I.y < this.height)
      {
         bounds.x0 = 0;
         bounds.x1 = 360;
         bounds.y1 = 90;
      }
      // Check South Pole
      var south_I = this.Convert_RD_I(new Point(this.projection.ra0 * 180 / Math.PI, -90));
      if (south_I && south_I.x >= 0 && south_I.x < this.width && south_I.y >= 0 && south_I.y < this.height)
      {
         bounds.x0 = 0;
         bounds.x1 = 360;
         bounds.y0 = -90;
      }

      bounds.x0 /= 15;
      bounds.x1 /= 15;

      return bounds;
   }


   this.Convert_I_RD = function( pI )
   {
      return this.projection.Inverse( this.ref_I_G.Apply( pI ) );
   };

   this.Convert_RD_I = function( pRD )
   {
      var pG = this.projection.Direct( pRD );
      return pG ? this.ref_G_I.Apply( pG ) : null;
   };

   this.DistanceI = function(p1, p2)
   {
      return ImageMetadata.Distance(this.Convert_I_RD(p1),this.Convert_I_RD(p2));
   };

   this.CheckOscillation = function(pRD, pI)
   {
      if(!pI)
         pI=this.Convert_RD_I(pRD);
      var pG = this.projection.Direct(pRD);
      var pIl = this.ref_I_G_lineal.inverse().Apply(pG);
      return (pIl.x-pI.x)*(pIl.x-pI.x)+(pIl.y-pI.y)*(pIl.y-pI.y)<this.width*this.height/4;
   }
}

ImageMetadata.prototype = new ObjectWithSettings;

ImageMetadata.Distance = function(cp1, cp2)
{
   if(!cp1 || !cp2)
      return NaN;
//   return DMath.acos(
//      DMath.sin(cp1.y)*DMath.sin(cp2.y)+
//         DMath.cos(cp1.y)*DMath.cos(cp2.y)*DMath.cos(cp1.x-cp2.x));
   var dX=Math.abs(cp1.x-cp2.x);
   var cosX = DMath.cos(dX);
   var sinX = DMath.sin(dX);
   var cosY1 = DMath.cos(cp1.y);
   var cosY2 = DMath.cos(cp2.y);
   var sinY1 = DMath.sin(cp1.y);
   var sinY2 = DMath.sin(cp2.y);
   var K=cosY1*sinY2-sinY1*cosY2*cosX;
   return DMath.atan2(
      Math.sqrt(cosY2*sinX*cosY2*sinX + K*K),
      (sinY1*sinY2+cosY1*cosY2*cosX)
   );
};

ImageMetadata.DistanceFast = function(cp1, cp2)
{
   if(!cp1 || !cp2)
      return NaN;
   return DMath.acos(
      DMath.sin(cp1.y) * DMath.sin(cp2.y) +
      DMath.cos(cp1.y) * DMath.cos(cp2.y) * DMath.cos(cp1.x - cp2.x));
};


// ******************************************************************
// DMSangle: Helper class for simplifying the use of angles in DMS format
// ******************************************************************
function DMSangle()
{
   this.deg = 0;
   this.min = 0;
   this.sec = 0;
   this.sign = 1;

   this.GetValue = function()
   {
      return this.sign*(this.deg + this.min/60 + this.sec/3600);
   };

   this.ToString = function( hours )
   {
      var plus = hours ? "" : "+";
      if ( this.deg != null && this.min != null && this.sec != null && this.sign != null )
         return ((this.sign < 0) ? "-": plus) +
               format( "%02d %02d %0*.*f", this.deg, this.min, hours ? 6 : 5, hours ? 3 : 2, this.sec );
      return "<* invalid *>";
   };
}

DMSangle.FromString = function( coordStr, mindeg, maxdeg )
{
   var match = coordStr.match( "'?([+-]?)([0-9]*)[ :]([0-9]*)[ :]([0-9]*(.[0-9]*)?)'?" );
   if( match==null )
      return null;
   var coord = new DMSangle();
   if ( match.length < 4 )
      throw new Error( "Invalid coordinates" );
   coord.deg = parseInt( match[2], 10 );
   if ( coord.deg < mindeg || coord.deg > maxdeg )
      throw new Error( "Invalid coordinates" );
   coord.min = parseInt( match[3], 10 );
   if ( coord.min < 0 || coord.min >= 60 )
      throw new Error( "Invalid coordinates (minutes)" );
   coord.sec = parseFloat( match[4] );
   if ( coord.sec < 0 || coord.sec >= 60 )
      throw new Error( "Invalid coordinates (seconds)" );
   coord.sign = (match[1] == '-') ? -1 : 1;
   return coord;
}

DMSangle.FromAngle = function (angle)
{
   var coord = new DMSangle();
   if (angle < 0)
   {
      coord.sign = -1;
      angle = -angle;
   }
   coord.deg = Math.floor(angle);
   coord.min = Math.floor((angle - coord.deg) * 60);
   coord.sec = (angle - coord.deg - coord.min / 60) * 3600;

   if (coord.sec > 59.999)
   {
      coord.sec = 0;
      coord.min++;
      if (coord.min == 60)
      {
         coord.min = 0;
         coord.deg++;
      }
   }

   return coord;
}


Point.prototype.PrintAsRaDec = function()
{
   console.writeln("RA: ",DMSangle.FromAngle(this.x*24/360).ToString(),
      "  Dec: ",DMSangle.FromAngle(this.y).ToString());
};

Point.prototype.Print = function()
{
   console.writeln( format( "%f %f", this.x, this.y ) );
};

Matrix.prototype.Apply = function( p )
{
   var matrixP = new Matrix( [p.x, p.y, 1], 3, 1 );
   var p1 = this.mul( matrixP );
   return new Point( p1.at( 0, 0 ), p1.at( 1, 0 ) );
};

Matrix.prototype.Print = function Print()
{
   for ( var y = 0; y < this.rows; y++ )
   {
      console.write( "   " );
      for ( var x = 0; x < this.cols; x++ )
         //console.write( format( "%+20.12f", this.at( y, x ) ) );
         console.write( format( "%+20g", this.at( y, x ) ) );
      console.writeln( "" );
   }
};

function ReferNPolyn(polDegree)
{
   this.__base__ = Matrix;
   this.__base__(2, ((polDegree + 1) * (polDegree + 2)) / 2);
   this.polDegree = polDegree;
};
ReferNPolyn.prototype = new Matrix;

ReferNPolyn.prototype.Apply = function (p)
{
/*   var matrixP = new Matrix(this.GetPointCoef(p), this.GetNumCoef(), 1);
   var p1 = this.mul(matrixP);
   //console.writeln(p,"||",matrixP.toString(),"||",p1.toString());
   return new Point(p1.at(0, 0), p1.at(1, 0));*/
   var coef=this.GetPointCoef(p);
   var x=0;
   var y=0;
   for(var i=0; i<coef.length; i++)
   {
      x+=coef[i]*this.at(0,i);
      y+=coef[i]*this.at(1,i);
   }
   return new Point(x,y);
}

ReferNPolyn.prototype.GetPointCoef = function (p)
{
   var values = Array(this.GetNumCoef());
   var idx=0;
   for(var o=0; o<=this.polDegree; o++)
   {
      var x= 1;
      for(var i=0; i<=o; i++)
      {
         values[idx+o-i]=x;
         x*= p.x;
      }
      var y=1;
      for(var i=0; i<=o; i++)
      {
         values[idx+i]*=y;
         y*= p.y;
      }
      idx+=o+1;
   }
   return values;
}

ReferNPolyn.prototype.GetNumCoef = function (degree)
{
   if(degree==null)
      return ((this.polDegree + 1) * (this.polDegree + 2)) / 2;
   else
      return ((degree + 1) * (degree + 2)) / 2;
}

ReferNPolyn.prototype.ToLinealMatrix = function()
{
   var m=new Matrix(3,3);
   m.at(0,0, this.at(0,1)); m.at(0,1, this.at(0,2)); m.at(0,2, this.at(0,0));
   m.at(1,0, this.at(1,1)); m.at(1,1, this.at(1,2)); m.at(1,2, this.at(1,0));
   m.at(2,0, 0);            m.at(2,1, 0);            m.at(2,2, 1);
   return m;
}

ReferNPolyn.prototype.FromLinealMatrix = function(m)
{
   var ref=new ReferNPolyn(1);
   ref.at(0, 0, m.at(0,2)); ref.at(0, 1, m.at(0,0)); ref.at(0, 2, m.at(0,1));
   ref.at(1, 0, m.at(1,2)); ref.at(1, 1, m.at(1,0)); ref.at(1, 2, m.at(1,1));
   return ref;
}

function ReferSpline(p1, p2, weights, order, smoothing, limit)
{
   this.order = order!=null ? order : 2;
   this.smoothing = smoothing!=null ? smoothing : 0.25;
   this.limit = limit != null ? limit : 1500;

   if(p1 && p2)
      this.InitFromControlPoints(p1, p2, weights);
}
//ReferSpline.prototype = new ReferSpline();

ReferSpline.prototype.InitFromControlPoints = function(p1, p2, weights, limit)
{
//   var maxErr=0;
//   if(error)
//      for(var i=0; i<error.length; i++)
//      {
//         if(p1[i] && p2[i] && error[i] && error[i]>maxErr)
//            maxErr=error[i];
//      }
//   maxErr*=1.01;

   var x = [];
   var y = [];
   var zx = [];
   var zy = [];
   var w = weights ? [] : null;
   var actualLimit = limit!=null ? limit : this.limit;
   var numItems= Math.min(p1.length, actualLimit ? actualLimit : p1.length);
//console.writeln("o,s: ",this.order, this.smoothing);
//console.writeln("L,tL,aL,nI: ",limit, " ", this.limit, " ", actualLimit, " ", numItems);
   for (var i = 0; i < p1.length && numItems > 0; i++)
   {
      if(p1[i] && p2[i])
      {
         x.push(p1[i].x);
         y.push(p1[i].y);
         zx.push(p2[i].x);
         zy.push(p2[i].y);
//         if(error)
//            w.push(1-error[i]/maxErr);
         if(weights)
            w.push(weights[i]);
         numItems--;
      }
   }
//console.writeln("spline length=", x.length);
   this.splineX = new SurfaceSpline();
   this.splineX.smoothing = this.smoothing;
   this.splineX.order = this.order;
   if(w)
      this.splineX.initialize(new Vector(x), new Vector(y), new Vector(zx), new Vector(w));
   else
      this.splineX.initialize(new Vector(x), new Vector(y), new Vector(zx));

   this.splineY = new SurfaceSpline();
   this.splineY.smoothing = this.smoothing;
   this.splineY.order = this.order;
   if(w)
      this.splineY.initialize(new Vector(x), new Vector(y), new Vector(zy), new Vector(w));
   else
      this.splineY.initialize(new Vector(x), new Vector(y), new Vector(zy));
};

ReferSpline.prototype.Apply = function(p)
{
   return new Point(this.splineX.evaluate(p),this.splineY.evaluate(p));
}


Matrix.prototype.toString = function()
{
   var str="[";
   for(var row=0; row<this.rows; row++)
   {
      var rowStr="[";
      for(var col=0; col<this.columns; col++)
      {
         if(col>0)
            rowStr+=";";
         rowStr+=this.at(row,col).toString();
      }
      str+=rowStr+"]";
   }
   return str+="]";
}

function MultipleLinearRegression(polDegree, coords1, coords2)
{
   if (coords1.length != coords2.length)
      throw "Input arrays of different size in Multiple Linear Regression";
   var numSamples =0;
   for(var i=0; i<coords1.length; i++)
      if(coords1[i] && coords2[i])
         numSamples++;
   //console.writeln("Samples: ", numSamples);
   if(numSamples<4)
      throw "There are too few valid samples";
   // Uses independent multiple linear regression for x and y
   // The model is: Y = X * B + err
   // The regresand Y contains the x (or y) of the predicted coordinates coords2
   // The regresors X contains the vectors (x,y,1) with the source coordinates coords1
   // The parameter vector B contains the factors of the expression xc = xi*B0 + yi*B1 + B2
   var ref_1_2 = new ReferNPolyn(polDegree);
   var numCoefs=ref_1_2.GetNumCoef();
   var Y1 = new Matrix(numSamples, 1);
   var Y2 = new Matrix(numSamples, 1);
   var X = new Matrix(numSamples, numCoefs);
   var row=0;
   for (var i = 0; i < coords1.length; i++)
   {
      if(coords1[i] && coords2[i])
      {
         //console.writeln(coords1[i]," ",coords2[i]);
         Y1.at(row, 0, coords2[i].x);
         Y2.at(row, 0, coords2[i].y);

         var Xval = ref_1_2.GetPointCoef(coords1[i]);
         for(var c=0; c<numCoefs; c++)
            X.at(row, c, Xval[c]);
         row++;
      }
   }

   // Solve the two multiple regressions
   var XT = X.transpose();
   var XT_X_inv_XT=(XT.mul(X)).inverse().mul(XT);
   var B1 = XT_X_inv_XT.mul(Y1);
   var B2 = XT_X_inv_XT.mul(Y2);

   // Create the correction matrix that transform from coords1 to coords2
   //console.writeln("B1:"); B1.Print();
   //console.writeln("B2:"); B2.Print();
   for(var i=0; i<numCoefs; i++)
   {
      ref_1_2.at(0, i, B1.at(i,0));
      ref_1_2.at(1, i, B2.at(i,0));
   }
   //console.writeln("Correction matrix:");
   //ref_1_2.Print();

   // Calculate R2 and RMS
/*   var SSR=0;
   for(var i=0; i<coords1.length; i++)
   {
      if(coords1[i] && coords2[i])
      {
         var c2 = ref_1_2.Apply(coords1[i]);
         var errX=c2.x-coords2[i].x;
         var errY=c2.y-coords2[i].y;
         //console.writeln(format("%f;%f;%f;%f",coords1[i].x,coords1[i].y,errX,errY));
         SSR+=errX*errX+errY*errY;
      }
   }
   var RMSerr=Math.sqrt(SSR/numSamples);*/

   //return { ref_1_2: ref_1_2, rms: RMSerr};
   return ref_1_2;
};

function MultipleLinearRegressionHelmert(coords1, coords2, ref1, ref2)
{
   if (coords1.length != coords2.length)
      throw "Input arrays of different size in Multiple Linear Regression";
   var numSamples =0;
   for(var i=0; i<coords1.length; i++)
      if(coords1[i] && coords2[i])
         numSamples++;
   //console.writeln("Samples: ", numSamples);
   if(numSamples<4)
      throw "There are too few valid samples";

   // Detect mirror case
   var refMirror = MultipleLinearRegression(1, coords1, coords2).ToLinealMatrix();
   var mirrorFactor = refMirror.at(0,1)*refMirror.at(1,0) >0 ? 1 : -1;


   // Uses independent multiple linear regression for x and y
   // The model is: Y = X * B + err
   // The regresand Y contains the x (or y) of the predicted coordinates coords2
   // The regresors X contains the vectors (x,y,1) with the source coordinates coords1
   // The parameter vector B contains the factors of the expression xc = xi*B0 + yi*B1 + B2
   var Y = new Matrix(numSamples*2, 1);
   var X = new Matrix(numSamples*2, 2);
   var row=0;
   for (var i = 0; i < coords1.length; i++)
   {
      if(coords1[i] && coords2[i])
      {
         //console.writeln(coords1[i]," ",coords2[i]);
         Y.at(row*2, 0, coords2[i].x-ref2.x);
         Y.at(row*2+1, 0, coords2[i].y-ref2.y);

         X.at(row*2, 0, coords1[i].x-ref1.x);
         X.at(row*2, 1, coords1[i].y-ref1.y);
         X.at(row*2+1, 1, mirrorFactor * (coords1[i].x-ref1.x));
         X.at(row*2+1, 0, -mirrorFactor * (coords1[i].y-ref1.y));

         row++;
      }
   }

   // Solve the two multiple regressions
   var XT = X.transpose();
   var XT_X_inv_XT=(XT.mul(X)).inverse().mul(XT);
   var B = XT_X_inv_XT.mul(Y);

   // Create the correction matrix that transform from coords1 to coords2
   var m=new Matrix(3,3);
   m.at(0,0, B.at(0,0)); m.at(0,1, B.at(1,0)); m.at(0,2, 0);
   m.at(1,0, mirrorFactor * B.at(1,0)); m.at(1,1, -mirrorFactor * B.at(0,0)); m.at(1,2, 0);
   m.at(2,0, 0);          m.at(2,1, 0);          m.at(2,2, 1);
   //console.writeln("m"); m.Print();

   var t1=new Matrix(
      1, 0, -ref1.x,
      0, 1, -ref1.y,
      0, 0, 1);
   var t2 = new Matrix(
      1, 0, ref2.x,
      0, 1, ref2.y,
      0, 0, 1);
   var ref_1_2 = t2.mul(m.mul(t1));
   //console.writeln("ref_1_2"); ref_1_2.Print();

   //console.writeln("refMirror"); refMirror.Print();

   return ref_1_2;
};

function ApplySTF(view, stf)
{
   var HT = new HistogramTransformation;
   if(view.image.isColor){
      var stfActive = false;
      for(var i=0; i<3 && !stfActive; i++)
         stfActive |= stf[i][1]!=0 || stf[i][0]!=0.5 || stf[i][2]!=1;
      if(!stfActive)
         return;
      HT.H = [
         [stf[0][1], stf[0][0], stf[0][2], 0, 1],
         [stf[1][1], stf[1][0], stf[1][2], 0, 1],
         [stf[2][1], stf[2][0], stf[2][2], 0, 1],
         [  0, 0.5, 1, 0, 1],
         [  0, 0.5, 1, 0, 1]
      ];
   } else {
      if(stf[0][1]==0 && stf[0][0]==0.5 && stf[0][2]==1)
         return;
      HT.H = [
         [  0, 0.5, 1, 0, 1],
         [  0, 0.5, 1, 0, 1],
         [  0, 0.5, 1, 0, 1],
         [stf[0][1], stf[0][0], stf[0][2], 0, 1],
         [  0, 0.5, 1, 0, 1]
      ];
   }

   console.writeln(format("<b>Applying STF to '%ls'</b>:\x1b[38;2;100;100;100m",view.id));
   HT.executeOn(view, false); // no swap file
   console.write("\x1b[0m");
}
