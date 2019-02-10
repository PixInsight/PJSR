// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// CoordinateSearchDialog.jsh - Released 2018-12-13T19:24:09Z
// ----------------------------------------------------------------------------
//
// This file is part of Ephemerides Script version 1.0
//
// Copyright (c) 2017-2018 Pleiades Astrophoto S.L.
//
// Redistribution and use in both source and binary forms, with or without
// modification, is permitted provided that the following conditions are met:
//
// 1. All redistributions of source code must retain the above copyright
//    notice, this list of conditions and the following disclaimer.
//
// 2. All redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
//
// 3. Neither the names "PixInsight" and "Pleiades Astrophoto", nor the names
//    of their contributors, may be used to endorse or promote products derived
//    from this software without specific prior written permission. For written
//    permission, please contact info@pixinsight.com.
//
// 4. All products derived from this software, in any form whatsoever, must
//    reproduce the following acknowledgment in the end-user documentation
//    and/or other materials provided with the product:
//
//    "This product is based on software from the PixInsight project, developed
//    by Pleiades Astrophoto and its contributors (http://pixinsight.com/)."
//
//    Alternatively, if that is where third-party acknowledgments normally
//    appear, this acknowledgment must be reproduced in the product itself.
//
// THIS SOFTWARE IS PROVIDED BY PLEIADES ASTROPHOTO AND ITS CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
// TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
// PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL PLEIADES ASTROPHOTO OR ITS
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
// EXEMPLARY OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, BUSINESS
// INTERRUPTION; PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; AND LOSS OF USE,
// DATA OR PROFITS) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
// ----------------------------------------------------------------------------

/*
 * An ephemeris generation script.
 *
 * Copyright (C) 2017-2018 Pleiades Astrophoto. All Rights Reserved.
 * Written by Juan Conejero (PTeam)
 *
 * Online coordinate search dialog.
 */

#ifndef __CoordinateSearchDialog_jsh
#define __CoordinateSearchDialog_jsh

#ifndef __PJSR_NumericControl_jsh
#include <pjsr/NumericControl.jsh>
#endif

#ifndef __PJSR_TextAlign_jsh
#include <pjsr/TextAlign.jsh>
#endif

#include "EphUtility.jsh"

// ----------------------------------------------------------------------------

function CoordinateSearchDialog( parent )
{
   this.__base__ = Dialog;
   if ( parent )
      this.__base__( parent );
   else
      this.__base__();

   this.objectName = "";
   this.objectType = "";
   this.spectralType = "";
   this.vmag = null;
   this.RA = null;
   this.Dec = null;
   this.muRA = null;
   this.muDec = null;
   this.parallax = null;
   this.radVel = null;
   this.valid = false;
   this.downloading = false;
   this.abort = false;

   // -------------------------------------------------------------------------

   let emWidth = this.font.width( 'm' );

   // -------------------------------------------------------------------------

   let objectNameToolTip = "<p>Name or identifier of the object to search for. "
      + "Examples: Antares, alpha Lyr, M31, NGC 253.</p>";

   this.search_Label = new Label( this );
   this.search_Label.text = "Object:";
   this.search_Label.toolTip = objectNameToolTip;
   this.search_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.search_Edit = new Edit( this );
   this.search_Edit.setMinWidth( 20*emWidth );
   this.search_Edit.toolTip = objectNameToolTip;
   this.search_Edit.onGetFocus = function()
   {
      this.dialog.search_Button.defaultButton = true;
   };
   this.search_Edit.onLoseFocus = function()
   {
      this.dialog.get_Button.defaultButton = true;
   };

   this.search_Button = new PushButton( this );
   this.search_Button.text = "Search";
   this.search_Button.icon = this.scaledResource( ":/icons/find.png" );
   this.search_Button.toolTip = "<p>Perform online coordinate search.</p>";
   this.search_Button.onClick = function()
   {
      let objectName = this.dialog.search_Edit.text.trim();
      this.dialog.search_Edit.text = objectName;
      if ( objectName.length == 0 )
      {
         this.dialog.searchInfo_TextBox.text = "\x1b[31m*** Error: No object has been specified.\x1b[39m<br>";
         this.dialog.search_Edit.hasFocus = true;
         return;
      }

      //let url = "http://vizier.cfa.harvard.edu/viz-bin/nph-sesame/-oI/A?" += objectName;
      let url = "http://simbad.u-strasbg.fr/simbad/sim-tap/sync?request=doQuery&lang=adql&format=TSV&query="
              + "SELECT oid, ra, dec, pmra, pmdec, plx_value, rvz_radvel, main_id, otype_txt, sp_type, flux "
                     + "FROM basic "
                     + "JOIN ident ON ident.oidref = oid "
                     + "LEFT OUTER JOIN flux ON flux.oidref = oid AND flux.filter = 'V' "
                     + "WHERE id = '" + objectName + "';";

      let transfer = new NetworkTransfer;
      transfer.setURL( url );
      transfer.dialog = this.dialog;
      transfer.downloadData = new ByteArray;
      transfer.onDownloadDataAvailable = function( moreData )
      {
         if ( this.dialog.abort )
            return false;
         this.downloadData.add( moreData );
         return true;
      };
      transfer.onTransferProgress = function( downloadTotal, downloadCurrent, uploadTotal, uploadCurrent )
      {
         if ( this.dialog.abort )
            return false;
         if ( downloadTotal > 0 )
            this.dialog.searchInfo_TextBox.insert( format( "<end><clrbol>%u of %u bytes transferred (%d%%)<flush>",
                                                           downloadCurrent, downloadTotal,
                                                           Math.round( 100.0*downloadCurrent/downloadTotal ) ) );
         else
            this.dialog.searchInfo_TextBox.insert( format( "<end><clrbol>%u bytes transferred (unknown size)<flush>",
                                                           downloadCurrent ) );
         this.dialog.searchInfo_TextBox.hasFocus = true;
         processEvents();
         return true;
      };

      this.dialog.searchInfo_TextBox.text = "<wrap><raw>" + url + "</raw><br><br><flush>";
      processEvents();

      this.dialog.valid = false;
      this.dialog.get_Button.enabled = false;

      this.dialog.downloading = true;
      this.dialog.abort = false;

      let ok = transfer.download();

      this.dialog.downloading = false;

      if ( ok )
      {
         this.dialog.searchInfo_TextBox.insert( format( "<end><clrbol>%d bytes downloaded @ %.3g KiB/s<br>",
                                                        transfer.bytesTransferred, transfer.totalSpeed ) );
         //this.dialog.searchInfo_TextBox.insert( "<end><cbr><br><raw>" + transfer.downloadData + "</raw>" );

         this.dialog.objectName = "";
         this.dialog.objectType = "";
         this.dialog.spectralType = "";
         this.dialog.vmag = null;
         this.dialog.RA = null;
         this.dialog.Dec = null;
         this.dialog.muRA = null;
         this.dialog.muDec = null;
         this.dialog.parallax = null;
         this.dialog.radVel = null;

         let lines = transfer.downloadData.toString().split( '\n' );
         if ( lines.length >= 2 )
         {
            // The first line has column titles. The second line has values.
            let tokens = lines[1].split( '\t' );
            if ( tokens.length == 11 )
            {
               if ( tokens[1].length > 0 )
                  this.dialog.RA = tokens[1].toNumber()/15;  // degrees -> hours
               if ( tokens[2].length > 0 )
                  this.dialog.Dec = tokens[2].toNumber();    // degrees
               if ( tokens[3].length > 0 )
                  this.dialog.muRA = tokens[3].toNumber();   // mas/yr * cos(delta)
               if ( tokens[4].length > 0 )
                  this.dialog.muDec = tokens[4].toNumber();  // mas/yr
               if ( tokens[5].length > 0 )
                  this.dialog.parallax = tokens[5].toNumber(); // mas
               if ( tokens[6].length > 0 )
                  this.dialog.radVel = tokens[6].toNumber(); // km/s
               this.dialog.objectName = tokens[7].unquote().trim();
               this.dialog.objectType = tokens[8].unquote().trim();
               this.dialog.spectralType = tokens[9].unquote().trim();
               if ( tokens[10].length > 0 )
                  this.dialog.vmag = tokens[10].toNumber();

               if ( this.dialog.RA != null && this.dialog.Dec != null )
               {
                  let info = "<end><cbr><br><b>Object            :</b> "
                           + this.dialog.objectName
                           +           "<br><b>Object type       :</b> "
                           + this.dialog.objectType
                           +           "<br><b>Right Ascension   :</b> "
                           + ' ' + EphUtility.angleString( this.dialog.RA, 24/*range*/, false/*sign*/, 3/*precision*/ )
                           +           "<br><b>Declination       :</b> "
                           + EphUtility.angleString( this.dialog.Dec, 0/*range*/, true/*sign*/, 2/*precision*/ );
                  if ( this.dialog.muRA != null )
                     info +=           "<br><b>Proper motion RA* :</b> "
                          + format( "%+8.2f mas/year &times; cos(delta)", this.dialog.muRA );
                  if ( this.dialog.muDec != null )
                     info +=           "<br><b>Proper motion Dec :</b> "
                          + format( "%+8.2f mas/year", this.dialog.muDec );
                  if ( this.dialog.parallax != null )
                     info +=           "<br><b>Parallax          :</b> "
                          + format( "%8.2f mas", this.dialog.parallax );
                  if ( this.dialog.radVel != null )
                     info +=           "<br><b>Radial velocity   :</b> "
                          + format( "%+7.1f km/s", this.dialog.radVel );
                  if ( !this.dialog.spectralType.length > 0 )
                     info +=           "<br><b>Spectral type     :</b> "
                          + this.dialog.spectralType;
                  if ( this.dialog.vmag != null )
                     info +=           "<br><b>V Magnitude       :</b> "
                          + format( "%.4g", this.dialog.vmag );
                  info += "<br>";

                  this.dialog.searchInfo_TextBox.insert( info );
                  this.dialog.get_Button.enabled = true;
                  this.dialog.valid = true;
               }
            }
         }

         if ( !this.dialog.valid )
            this.dialog.searchInfo_TextBox.insert( "<end><cbr><br>\x1b[31m*** Error: Unable to acquire valid coordinate information.\x1b[39m<br>" );
      }
      else
      {
         if ( this.dialog.abort )
            this.dialog.searchInfo_TextBox.insert( "<end><cbr><br>\x1b[31m<raw><* abort *></raw>\x1b[39m<br>" );
         else
            this.dialog.searchInfo_TextBox.insert( "<end><cbr><br>\x1b[31m*** Error: Download failed: <raw>" + transfer.errorInformation + "</raw>\x1b[39m<br>" );
      }

      // ### FIXME: Workaround to force visibility of TextBox focus.
      this.dialog.searchInfo_TextBox.hasFocus = false;
      processEvents();
      this.dialog.searchInfo_TextBox.hasFocus = true;
   };

   this.search_Sizer = new HorizontalSizer;
   this.search_Sizer.spacing = 4;
   this.search_Sizer.add( this.search_Label );
   this.search_Sizer.add( this.search_Edit, 100 );
   this.search_Sizer.add( this.search_Button );

   //

   this.searchInfo_TextBox = new TextBox( this );
   this.searchInfo_TextBox.readOnly = true;
   this.searchInfo_TextBox.styleSheet = this.scaledStyleSheet(
         "* {"
       +    "font-family: DejaVu Sans Mono, Monospace;"
       +    "font-size: 8pt;"
       +    "background: #141414;" // borrowed from /rsc/qss/core-standard.qss
       +    "color: #E8E8E8;"
       + "}" );
   this.searchInfo_TextBox.setMinSize( 60*emWidth, 22*this.font.height );

   //

   this.get_Button = new PushButton( this );
   this.get_Button.text = "Get";
   this.get_Button.icon = this.scaledResource( ":/icons/window-import.png" );
   this.get_Button.toolTip = "<p>Acquire object coordinates.</p>";
   this.get_Button.enabled = false;
   this.get_Button.onClick = function()
   {
      this.dialog.ok();
   };

   this.cancel_Button = new PushButton( this );
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function()
   {
      if ( this.dialog.m_downloading )
         this.dialog.m_abort = true;
      else
         this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 8;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.get_Button );
   this.buttons_Sizer.add( this.cancel_Button );

   //

   this.sizer = new VerticalSizer;
   this.sizer.spacing = 8;
   this.sizer.margin = 8;
   this.sizer.add( this.search_Sizer );
   this.sizer.add( this.searchInfo_TextBox, 100 );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = "Online Coordinate Search";

   this.adjustToContents();
   this.setMinSize();
}

CoordinateSearchDialog.prototype = new Dialog;

// ----------------------------------------------------------------------------

#endif // __CoordinateSearchDialog_jsh

// ----------------------------------------------------------------------------
// EOF CoordinateSearchDialog.jsh - Released 2018-12-13T19:24:09Z
