// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// EphemerisDialog.js - Released 2018-12-13T19:24:09Z
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
 * Main script dialog.
 */

#include <pjsr/NumericControl.jsh>
#include <pjsr/SectionBar.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/TextAlign.jsh>

#include "CoordinateSearchDialog.jsh"

// ----------------------------------------------------------------------------

function EphemerisDialog( engine )
{
   this.__base__ = Dialog;
   this.__base__();

   this.engine = engine;

   this.planets = [
      ["Me", "SSB", "Mercury"],
      ["Ve", "SSB", "Venus"  ],
      ["Ma", "SSB", "Mars"   ],
      ["Ju", "SSB", "Jupiter"],
      ["Sa", "SSB", "Saturn" ],
      ["Ur", "SSB", "Uranus" ],
      ["Ne", "SSB", "Neptune"],
      ["Pl", "SSB", "Pluto"  ],
      ["Mn", "Ea",  "Moon"   ],
      ["Sn", "SSB", "Sun"    ]
   ];

   this.asteroids = EphemerisFile.asteroidEphemerides.objects;
   this.asteroids.sort( function( a, b )
                        {
                           let x = parseInt( a[0] );
                           let y = parseInt( b[0] );
                           return (x < y) ? -1 : ((y < x) ? +1 : 0);
                        } );

   this.coordinateTypes = [ "spherical", "rectangular" ];
   this.coordinateSystems = [ "equatorial", "ecliptical", "galactic" ];
   this.positionTypes = [ "true", "geometric", "astrometric", "proper", "apparent", "intermediate" ];

   this.timescales = [ "TT", "TDB", "Teph", "UTC", "TAI", "UT1" ];

   // -------------------------------------------------------------------------

   let emWidth = this.font.width( 'm' );
   let labelWidth1 = this.font.width( "Longitude:" ) + 2*emWidth;
   let labelWidth2 = Math.round( this.font.width( "M" ) + 0.1*emWidth );
   let editWidth1 = Math.round( 4.75*emWidth );
   let editWidth2 = Math.round( 5.75*emWidth );
   let editWidth3 = Math.round( 7.75*emWidth );
   let comboWidth1 = Math.round( 12*emWidth );
   let ui4 = this.logicalPixelsToPhysical( 4 );

   // -------------------------------------------------------------------------

   let planet_ToolTip = "<p>Objects available in core fundamental ephemerides.</p>";

   this.planet_CheckBox = new CheckBox( this );
   this.planet_CheckBox.text = "Planet";
   this.planet_CheckBox.toolTip = planet_ToolTip;
   this.planet_CheckBox.onCheck = function( checked )
   {
      this.dialog.engine.bodyType = checked ? "planet" : "asteroid";
      this.dialog.updateControls();
   };

   this.planet1_Sizer = new HorizontalSizer;
   this.planet1_Sizer.addUnscaledSpacing( labelWidth1 + ui4 );
   this.planet1_Sizer.add( this.planet_CheckBox );
   this.planet1_Sizer.addStretch();

   this.planet_ComboBox = new ComboBox( this );
   for ( let i = 0; i < this.planets.length; ++i )
      this.planet_ComboBox.addItem( this.planets[i][2] );
   this.planet_ComboBox.setFixedWidth( comboWidth1 );
   this.planet_ComboBox.toolTip = planet_ToolTip;
   this.planet_ComboBox.onItemSelected = function( item )
   {
      this.dialog.engine.bodyId = this.dialog.engine.planetId = this.dialog.planets[item][0];
   };

   this.planet2_Sizer = new HorizontalSizer;
   this.planet2_Sizer.addUnscaledSpacing( labelWidth1 + ui4 );
   this.planet2_Sizer.add( this.planet_ComboBox );
   this.planet2_Sizer.addStretch();

   //

   let asteroid_ToolTip = "<p>Objects available in core asteroid ephemerides.</p>";

   this.asteroid_CheckBox = new CheckBox( this );
   this.asteroid_CheckBox.text = "Asteroid";
   this.asteroid_CheckBox.toolTip = asteroid_ToolTip;
   this.asteroid_CheckBox.onCheck = function( checked )
   {
      this.dialog.engine.bodyType = checked ? "asteroid" : "planet";
      this.dialog.updateControls();
   };

   this.asteroid1_Sizer = new HorizontalSizer;
   this.asteroid1_Sizer.addUnscaledSpacing( labelWidth1 + ui4 );
   this.asteroid1_Sizer.add( this.asteroid_CheckBox );
   this.asteroid1_Sizer.addStretch();

   this.asteroid_ComboBox = new ComboBox( this );
   for ( let i = 0; i < this.asteroids.length; ++i )
      this.asteroid_ComboBox.addItem( this.asteroids[i][0] + ' ' + this.asteroids[i][2] );
   this.asteroid_ComboBox.setFixedWidth( comboWidth1 );
   this.asteroid_ComboBox.toolTip = asteroid_ToolTip;
   this.asteroid_ComboBox.onItemSelected = function( item )
   {
      this.dialog.engine.bodyId = this.dialog.engine.asteroidId = this.dialog.asteroids[item][0];
   };

   this.asteroid2_Sizer = new HorizontalSizer;
   this.asteroid2_Sizer.addUnscaledSpacing( labelWidth1 + ui4 );
   this.asteroid2_Sizer.add( this.asteroid_ComboBox );
   this.asteroid2_Sizer.addStretch();

   //

   this.solarSystem_Control = new Control( this );
   this.solarSystem_Control.sizer = new VerticalSizer;
   this.solarSystem_Control.sizer.spacing = 4;
   this.solarSystem_Control.sizer.add( this.planet1_Sizer );
   this.solarSystem_Control.sizer.add( this.planet2_Sizer );
   this.solarSystem_Control.sizer.add( this.asteroid1_Sizer );
   this.solarSystem_Control.sizer.add( this.asteroid2_Sizer );

   this.solarSystem_Section = new SectionBar( this, "Solar System" );
   this.solarSystem_Section.setSection( this.solarSystem_Control );

   // -------------------------------------------------------------------------

   this.star_CheckBox = new CheckBox( this );
   this.star_CheckBox.text = "Star";
   this.star_CheckBox.toolTip = "<p>Compute star positions.</p>";
   this.star_CheckBox.onCheck = function( checked )
   {
      this.dialog.engine.bodyType = checked ? "star" : "planet";
      if ( !checked )
         this.dialog.solarSystem_Control.visible = true;
      this.dialog.updateControls();
   };

   this.star_Sizer = new HorizontalSizer;
   this.star_Sizer.addUnscaledSpacing( labelWidth1 + ui4 );
   this.star_Sizer.add( this.star_CheckBox );
   this.star_Sizer.addStretch();

   //

   this.starName_Label = new Label( this );
   this.starName_Label.text = "Name:";
   this.starName_Label.toolTip = "<p>Star name (optional).</p>";
   this.starName_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.starName_Label.setFixedWidth( labelWidth1 );

   this.starName_Edit = new Edit( this );
   this.starName_Edit.setMinWidth( 22*emWidth );

   this.starName_Sizer = new HorizontalSizer;
   this.starName_Sizer.spacing = 4;
   this.starName_Sizer.add( this.starName_Label );
   this.starName_Sizer.add( this.starName_Edit );
   this.starName_Sizer.addStretch();

   //

   this.alpha_Label = new Label( this );
   this.alpha_Label.text = "R.A.:";
   this.alpha_Label.toolTip = "<p>Star position, right ascension in hours, "
      + "minutes and seconds.</p>";
   this.alpha_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.alpha_Label.setFixedWidth( labelWidth1 );

   this.alpha_H_SpinBox = new SpinBox( this );
   this.alpha_H_SpinBox.setRange( 0, 23 );
   this.alpha_H_SpinBox.setFixedWidth( editWidth1 );
   this.alpha_H_SpinBox.toolTip = "<p>Right ascension, hours.</p>";

   this.alpha_H_Label = new Label( this );
   this.alpha_H_Label.text = "h";
   this.alpha_H_Label.setFixedWidth( labelWidth2 );

   this.alpha_M_SpinBox = new SpinBox( this );
   this.alpha_M_SpinBox.setRange( 0, 59 );
   this.alpha_M_SpinBox.setFixedWidth( editWidth1 );
   this.alpha_M_SpinBox.toolTip = "<p>Right ascension, minutes.</p>";

   this.alpha_M_Label = new Label( this );
   this.alpha_M_Label.text = "m";
   this.alpha_M_Label.setFixedWidth( labelWidth2 );

   this.alpha_S_NumericEdit = new NumericEdit( this );
   this.alpha_S_NumericEdit.setReal( true );
   this.alpha_S_NumericEdit.setPrecision( 7 );
   this.alpha_S_NumericEdit.setRange( 0, 60 );
   this.alpha_S_NumericEdit.enableFixedPrecision( true );
   this.alpha_S_NumericEdit.label.visible = false;
   this.alpha_S_NumericEdit.edit.setFixedWidth( editWidth3 );
   this.alpha_S_NumericEdit.toolTip = "<p>Right ascension, seconds.</p>";

   this.alpha_S_Label = new Label( this );
   this.alpha_S_Label.text = "s";
   this.alpha_S_Label.setFixedWidth( labelWidth2 );

   this.alpha_Sizer = new HorizontalSizer;
   this.alpha_Sizer.spacing = 4;
   this.alpha_Sizer.add( this.alpha_Label );
   this.alpha_Sizer.add( this.alpha_H_SpinBox );
   this.alpha_Sizer.add( this.alpha_H_Label );
   this.alpha_Sizer.add( this.alpha_M_SpinBox );
   this.alpha_Sizer.add( this.alpha_M_Label );
   this.alpha_Sizer.add( this.alpha_S_NumericEdit );
   this.alpha_Sizer.add( this.alpha_S_Label );
   this.alpha_Sizer.addStretch();

   //

   this.delta_Label = new Label( this );
   this.delta_Label.text = "Declination:";
   this.delta_Label.toolTip = "<p>Star position, declination in "
      + "degrees, minutes and seconds or arc.</p>";
   this.delta_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.delta_Label.setFixedWidth( labelWidth1 );

   this.delta_D_SpinBox = new SpinBox( this );
   this.delta_D_SpinBox.setRange( 0, 89 );
   this.delta_D_SpinBox.setFixedWidth( editWidth1 );
   this.delta_D_SpinBox.toolTip = "<p>Declination, degrees.</p>";

   this.delta_D_Label = new Label( this );
   this.delta_D_Label.text = "\u00B0";
   this.delta_D_Label.setFixedWidth( labelWidth2 );

   this.delta_M_SpinBox = new SpinBox( this );
   this.delta_M_SpinBox.setRange( 0, 59 );
   this.delta_M_SpinBox.setFixedWidth( editWidth1 );
   this.delta_M_SpinBox.toolTip = "<p>Declination, arcminutes.</p>";

   this.delta_M_Label = new Label( this );
   this.delta_M_Label.text = "'";
   this.delta_M_Label.setFixedWidth( labelWidth2 );

   this.delta_S_NumericEdit = new NumericEdit( this );
   this.delta_S_NumericEdit.setReal( true );
   this.delta_S_NumericEdit.setPrecision( 6 );
   this.delta_S_NumericEdit.setRange( 0, 60 );
   this.delta_S_NumericEdit.enableFixedPrecision( true );
   this.delta_S_NumericEdit.label.visible = false;
   this.delta_S_NumericEdit.edit.setFixedWidth( editWidth3 );
   this.delta_S_NumericEdit.toolTip = "<p>Declination, arcseconds.</p>";

   this.delta_S_Label = new Label( this );
   this.delta_S_Label.text = "\"";
   this.delta_S_Label.setFixedWidth( labelWidth2 );

   this.deltaIsSouth_CheckBox = new CheckBox( this );
   this.deltaIsSouth_CheckBox.text = "South";
   this.deltaIsSouth_CheckBox.toolTip = "<p>When checked, the declination is "
      + "negative (southern celestial hemisphere).</p>";

   this.delta_Sizer = new HorizontalSizer;
   this.delta_Sizer.spacing = 4;
   this.delta_Sizer.add( this.delta_Label );
   this.delta_Sizer.add( this.delta_D_SpinBox );
   this.delta_Sizer.add( this.delta_D_Label );
   this.delta_Sizer.add( this.delta_M_SpinBox );
   this.delta_Sizer.add( this.delta_M_Label );
   this.delta_Sizer.add( this.delta_S_NumericEdit );
   this.delta_Sizer.add( this.delta_S_Label );
   this.delta_Sizer.add( this.deltaIsSouth_CheckBox );
   this.delta_Sizer.addStretch();

   //

   this.muAlpha_NumericEdit = new NumericEdit( this );
   this.muAlpha_NumericEdit.setReal( true );
   this.muAlpha_NumericEdit.setPrecision( 3 );
   this.muAlpha_NumericEdit.setRange( -12000, +12000 );
   this.muAlpha_NumericEdit.enableFixedPrecision( true );
   this.muAlpha_NumericEdit.label.text = "\u03BC\u03B1*:";
   this.muAlpha_NumericEdit.label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.muAlpha_NumericEdit.label.setFixedWidth( labelWidth1 );
   this.muAlpha_NumericEdit.edit.setFixedWidth( editWidth3 );
   this.muAlpha_NumericEdit.toolTip = "<p>Proper motion in right ascension, "
      + "in mas/year*cos(delta).</p>";

   this.muAlpha_Label = new Label( this );
   this.muAlpha_Label.text = "mas/year\u00D7cos\u03B4";

   this.muAlpha_Sizer = new HorizontalSizer;
   this.muAlpha_Sizer.spacing = 4;
   this.muAlpha_Sizer.add( this.muAlpha_NumericEdit );
   this.muAlpha_Sizer.add( this.muAlpha_Label );
   this.muAlpha_Sizer.addStretch();

   //

   this.muDelta_NumericEdit = new NumericEdit( this );
   this.muDelta_NumericEdit.setReal( true );
   this.muDelta_NumericEdit.setPrecision( 3 );
   this.muDelta_NumericEdit.setRange( -12000, +12000 );
   this.muDelta_NumericEdit.enableFixedPrecision( true );
   this.muDelta_NumericEdit.label.text = "\u03BC\u03B4:";
   this.muDelta_NumericEdit.label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.muDelta_NumericEdit.label.setFixedWidth( labelWidth1 );
   this.muDelta_NumericEdit.edit.setFixedWidth( editWidth3 );
   this.muDelta_NumericEdit.toolTip = "<p>Proper motion in declination, "
      + "in mas/year.</p>";

   this.muDelta_Label = new Label( this );
   this.muDelta_Label.text = "mas/year";

   this.muDelta_Sizer = new HorizontalSizer;
   this.muDelta_Sizer.spacing = 4;
   this.muDelta_Sizer.add( this.muDelta_NumericEdit );
   this.muDelta_Sizer.add( this.muDelta_Label );
   this.muDelta_Sizer.addStretch();

   //

   this.parallax_NumericEdit = new NumericEdit( this );
   this.parallax_NumericEdit.setReal( true );
   this.parallax_NumericEdit.setPrecision( 3 );
   this.parallax_NumericEdit.setRange( 0, 1000 );
   this.parallax_NumericEdit.enableFixedPrecision( true );
   this.parallax_NumericEdit.label.text = "Parallax:";
   this.parallax_NumericEdit.label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.parallax_NumericEdit.label.setFixedWidth( labelWidth1 );
   this.parallax_NumericEdit.edit.setFixedWidth( editWidth3 );
   this.parallax_NumericEdit.toolTip = "<p>Parallax in mas.</p>";

   this.parallax_Label = new Label( this );
   this.parallax_Label.text = "mas";

   this.parallax_Sizer = new HorizontalSizer;
   this.parallax_Sizer.spacing = 4;
   this.parallax_Sizer.add( this.parallax_NumericEdit );
   this.parallax_Sizer.add( this.parallax_Label );
   this.parallax_Sizer.addStretch();

   //

   this.radialVelocity_NumericEdit = new NumericEdit( this );
   this.radialVelocity_NumericEdit.setReal( true );
   this.radialVelocity_NumericEdit.setPrecision( 3 );
   this.radialVelocity_NumericEdit.setRange( -1000, +1000 );
   this.radialVelocity_NumericEdit.enableFixedPrecision( true );
   this.radialVelocity_NumericEdit.label.text = "Rad. velocity:";
   this.radialVelocity_NumericEdit.label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.radialVelocity_NumericEdit.label.setFixedWidth( labelWidth1 );
   this.radialVelocity_NumericEdit.edit.setFixedWidth( editWidth3 );
   this.radialVelocity_NumericEdit.toolTip = "<p>Radial velocity in km/s, "
      + "positive away from the Earth.</p>";

   this.radialVelocity_Label = new Label( this );
   this.radialVelocity_Label.text = "km/s";

   this.radialVelocity_Sizer = new HorizontalSizer;
   this.radialVelocity_Sizer.spacing = 4;
   this.radialVelocity_Sizer.add( this.radialVelocity_NumericEdit );
   this.radialVelocity_Sizer.add( this.radialVelocity_Label );
   this.radialVelocity_Sizer.addStretch();

   //

   this.epoch_Label = new Label( this );
   this.epoch_Label.text = "Epoch:";
   this.epoch_Label.toolTip = "<p>Epoch of catalog coordinates.</p>";
   this.epoch_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.epoch_Label.setFixedWidth( labelWidth1 );

   this.epoch_Y_SpinBox = new SpinBox( this );
   this.epoch_Y_SpinBox.setRange( -4000, +4000 );
   this.epoch_Y_SpinBox.setFixedWidth( editWidth2 );

   this.epoch_Y_Label = new Label( this );
   this.epoch_Y_Label.text = "Y";
   this.epoch_Y_Label.setFixedWidth( labelWidth2 );

   this.epoch_M_SpinBox = new SpinBox( this );
   this.epoch_M_SpinBox.setRange( 1, 12 );
   this.epoch_M_SpinBox.setFixedWidth( editWidth1 );

   this.epoch_M_Label = new Label( this );
   this.epoch_M_Label.text = "M";
   this.epoch_M_Label.setFixedWidth( labelWidth2 );

   this.epoch_D_SpinBox = new SpinBox( this );
   this.epoch_D_SpinBox.setRange( 0, 31 );
   this.epoch_D_SpinBox.setFixedWidth( editWidth1 );

   this.epoch_D_Label = new Label( this );
   this.epoch_D_Label.text = "d";
   this.epoch_D_Label.setFixedWidth( labelWidth2 );

   this.onlineSearch_Button = new PushButton( this );
   this.onlineSearch_Button.text = "Search";
   this.onlineSearch_Button.icon = this.scaledResource( ":/icons/internet.png" );
   this.onlineSearch_Button.toolTip = "<p>Open the Online Coordinate Search dialog.</p>";
   this.onlineSearch_Button._searchDialog = null;
   this.onlineSearch_Button.onClick = function()
   {
      if ( this._searchDialog == null )
         this._searchDialog = new CoordinateSearchDialog( this.dialog );
      if ( this._searchDialog.execute() )
         if ( this._searchDialog.valid )
         {
            this.dialog.engine.star =
               new StarPosition( this._searchDialog.RA,
                                 this._searchDialog.Dec,
                                 this._searchDialog.muRA ? this._searchDialog.muRA : 0,
                                 this._searchDialog.muDec ? this._searchDialog.muDec : 0,
                                 this._searchDialog.parallax ? this._searchDialog.parallax/1000 : 0, // mas -> arcsec
                                 this._searchDialog.radVel ? this._searchDialog.radVel : 0 );
            this.dialog.engine.starName = this._searchDialog.objectName;
            this.dialog.updateControls();
         }
   };

   this.epoch_Sizer = new HorizontalSizer;
   this.epoch_Sizer.spacing = 4;
   this.epoch_Sizer.add( this.epoch_Label );
   this.epoch_Sizer.add( this.epoch_Y_SpinBox );
   this.epoch_Sizer.add( this.epoch_Y_Label );
   this.epoch_Sizer.add( this.epoch_M_SpinBox );
   this.epoch_Sizer.add( this.epoch_M_Label );
   this.epoch_Sizer.add( this.epoch_D_SpinBox );
   this.epoch_Sizer.add( this.epoch_D_Label );
   this.epoch_Sizer.addStretch();
   this.epoch_Sizer.add( this.onlineSearch_Button );

   //

   this.starData_Control = new Control( this );
   this.starData_Control.sizer = new VerticalSizer;
   this.starData_Control.sizer.spacing = 4;
   this.starData_Control.sizer.add( this.starName_Sizer );
   this.starData_Control.sizer.add( this.alpha_Sizer );
   this.starData_Control.sizer.add( this.delta_Sizer );
   this.starData_Control.sizer.add( this.muAlpha_Sizer );
   this.starData_Control.sizer.add( this.muDelta_Sizer );
   this.starData_Control.sizer.add( this.parallax_Sizer );
   this.starData_Control.sizer.add( this.radialVelocity_Sizer );
   this.starData_Control.sizer.add( this.epoch_Sizer );

   this.stars_Control = new Control( this );
   this.stars_Control.sizer = new VerticalSizer;
   this.stars_Control.sizer.spacing = 4;
   this.stars_Control.sizer.add( this.star_Sizer );
   this.stars_Control.sizer.add( this.starData_Control );

   this.stars_Section = new SectionBar( this, "Stars" );
   this.stars_Section.setSection( this.stars_Control );

   // -------------------------------------------------------------------------

   this.geocentric_CheckBox = new CheckBox( this );
   this.geocentric_CheckBox.text = "Geocentric";
   this.geocentric_CheckBox.toolTip = "<p>Compute geocentric positions.</p>";
   this.geocentric_CheckBox.onCheck = function( checked )
   {
      this.dialog.engine.topocentric = !checked;
      this.dialog.updateControls();
   };

   this.geocentric_Sizer = new HorizontalSizer;
   this.geocentric_Sizer.addUnscaledSpacing( labelWidth1 + ui4 );
   this.geocentric_Sizer.add( this.geocentric_CheckBox );
   this.geocentric_Sizer.addStretch();

   //

   this.topocentric_CheckBox = new CheckBox( this );
   this.topocentric_CheckBox.text = "Topocentric";
   this.topocentric_CheckBox.toolTip = "<p>Compute topocentric positions.</p>"
      + "<p>If this option is selected, subsequently calculated geometric, "
      + "proper, astrometric, apparent and intermediate places will be "
      + "topocentric, that is, will be referred to the location of the observer "
      + "with respect to the center of the Earth, as defined by the following "
      + "geodetic longitude, latitude and height parameters.</p>";
   this.topocentric_CheckBox.onCheck = function( checked )
   {
      this.dialog.engine.topocentric = checked;
      this.dialog.updateControls();
   };

   this.topocentric_Sizer = new HorizontalSizer;
   this.topocentric_Sizer.addUnscaledSpacing( labelWidth1 + ui4 );
   this.topocentric_Sizer.add( this.topocentric_CheckBox );
   this.topocentric_Sizer.addStretch();

   //

   this.longitude_Label = new Label( this );
   this.longitude_Label.text = "Longitude:";
   this.longitude_Label.toolTip = "<p>Observer position, geodetic longitude "
      + "(degrees, minutes and seconds or arc).</p>";
   this.longitude_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.longitude_Label.setFixedWidth( labelWidth1 );

   this.longitude_D_SpinBox = new SpinBox( this );
   this.longitude_D_SpinBox.setRange( 0, 179 );
   this.longitude_D_SpinBox.setFixedWidth( editWidth1 );
   this.longitude_D_SpinBox.toolTip = "<p>Geodetic longitude of the observer, degrees.</p>";

   this.longitude_D_Label = new Label( this );
   this.longitude_D_Label.text = "\u00B0";
   this.longitude_D_Label.setFixedWidth( labelWidth2 );

   this.longitude_M_SpinBox = new SpinBox( this );
   this.longitude_M_SpinBox.setRange( 0, 59 );
   this.longitude_M_SpinBox.setFixedWidth( editWidth1 );
   this.longitude_M_SpinBox.toolTip = "<p>Geodetic longitude of the observer, arcminutes.</p>";

   this.longitude_M_Label = new Label( this );
   this.longitude_M_Label.text = "'";
   this.longitude_M_Label.setFixedWidth( labelWidth2 );

   this.longitude_S_NumericEdit = new NumericEdit( this );
   this.longitude_S_NumericEdit.setReal( true );
   this.longitude_S_NumericEdit.setPrecision( 2 );
   this.longitude_S_NumericEdit.setRange( 0, 60 );
   this.longitude_S_NumericEdit.enableFixedPrecision( true );
   this.longitude_S_NumericEdit.label.visible = false;
   this.longitude_S_NumericEdit.edit.setFixedWidth( editWidth1 );
   this.longitude_S_NumericEdit.toolTip = "<p>Geodetic longitude of the observer, arcseconds.</p>";

   this.longitude_S_Label = new Label( this );
   this.longitude_S_Label.text = "\"";
   this.longitude_S_Label.setFixedWidth( labelWidth2 );

   this.longitudeIsWest_CheckBox = new CheckBox( this );
   this.longitudeIsWest_CheckBox.text = "West";
   this.longitudeIsWest_CheckBox.toolTip = "<p>When checked, the longitude is "
      + "negative (to the west of the reference meridian).</p>";

   this.longitude_Sizer = new HorizontalSizer;
   this.longitude_Sizer.spacing = 4;
   this.longitude_Sizer.add( this.longitude_Label );
   this.longitude_Sizer.add( this.longitude_D_SpinBox );
   this.longitude_Sizer.add( this.longitude_D_Label );
   this.longitude_Sizer.add( this.longitude_M_SpinBox );
   this.longitude_Sizer.add( this.longitude_M_Label );
   this.longitude_Sizer.add( this.longitude_S_NumericEdit );
   this.longitude_Sizer.add( this.longitude_S_Label );
   this.longitude_Sizer.add( this.longitudeIsWest_CheckBox );
   this.longitude_Sizer.addStretch();

   //

   this.latitude_Label = new Label( this );
   this.latitude_Label.text = "Latitude:";
   this.latitude_Label.toolTip = "<p>Observer position, geodetic latitude "
      + "(degrees, minutes and seconds or arc).</p>";
   this.latitude_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.latitude_Label.setFixedWidth( labelWidth1 );

   this.latitude_D_SpinBox = new SpinBox( this );
   this.latitude_D_SpinBox.setRange( 0, 89 );
   this.latitude_D_SpinBox.setFixedWidth( editWidth1 );
   this.latitude_D_SpinBox.toolTip = "<p>Geodetic latitude of the observer, degrees.</p>";

   this.latitude_D_Label = new Label( this );
   this.latitude_D_Label.text = "\u00B0";
   this.latitude_D_Label.setFixedWidth( labelWidth2 );

   this.latitude_M_SpinBox = new SpinBox( this );
   this.latitude_M_SpinBox.setRange( 0, 59 );
   this.latitude_M_SpinBox.setFixedWidth( editWidth1 );
   this.latitude_M_SpinBox.toolTip = "<p>Geodetic latitude of the observer, arcminutes.</p>";

   this.latitude_M_Label = new Label( this );
   this.latitude_M_Label.text = "'";
   this.latitude_M_Label.setFixedWidth( labelWidth2 );

   this.latitude_S_NumericEdit = new NumericEdit( this );
   this.latitude_S_NumericEdit.setReal( true );
   this.latitude_S_NumericEdit.setPrecision( 2 );
   this.latitude_S_NumericEdit.setRange( 0, 60 );
   this.latitude_S_NumericEdit.enableFixedPrecision( true );
   this.latitude_S_NumericEdit.label.visible = false;
   this.latitude_S_NumericEdit.edit.setFixedWidth( editWidth1 );
   this.latitude_S_NumericEdit.toolTip = "<p>Geodetic latitude of the observer, arcseconds.</p>";

   this.latitude_S_Label = new Label( this );
   this.latitude_S_Label.text = "\"";
   this.latitude_S_Label.setFixedWidth( labelWidth2 );

   this.latitudeIsSouth_CheckBox = new CheckBox( this );
   this.latitudeIsSouth_CheckBox.text = "South";
   this.latitudeIsSouth_CheckBox.toolTip = "<p>When checked, the latitude is "
      + "negative (southern hemisphere).</p>";

   this.latitude_Sizer = new HorizontalSizer;
   this.latitude_Sizer.spacing = 4;
   this.latitude_Sizer.add( this.latitude_Label );
   this.latitude_Sizer.add( this.latitude_D_SpinBox );
   this.latitude_Sizer.add( this.latitude_D_Label );
   this.latitude_Sizer.add( this.latitude_M_SpinBox );
   this.latitude_Sizer.add( this.latitude_M_Label );
   this.latitude_Sizer.add( this.latitude_S_NumericEdit );
   this.latitude_Sizer.add( this.latitude_S_Label );
   this.latitude_Sizer.add( this.latitudeIsSouth_CheckBox );
   this.latitude_Sizer.addStretch();

   //

   let height_ToolTip = "<p>Observer position, geodetic height in meters.</p>";

   this.height_M_Label = new Label( this );
   this.height_M_Label.text = "m";
   this.height_M_Label.textAlignment = TextAlign_Left|TextAlign_VertCenter;
   this.height_M_Label.setFixedWidth( labelWidth2 );
   this.height_M_Label.toolTip = height_ToolTip;

   this.height_NumericEdit = new NumericEdit( this );
   this.height_NumericEdit.setReal( false );
   this.height_NumericEdit.setRange( 0, 1e+07 );
   this.height_NumericEdit.label.text = "Height:";
   this.height_NumericEdit.label.setFixedWidth( labelWidth1 );
   this.height_NumericEdit.sizer.add( this.height_M_Label );
   this.height_NumericEdit.sizer.addStretch();
   this.height_NumericEdit.toolTip = height_ToolTip;

   //

   this.observerData_Control = new Control( this );
   this.observerData_Control.sizer = new VerticalSizer;
   this.observerData_Control.sizer.spacing = 4;
   this.observerData_Control.sizer.add( this.longitude_Sizer );
   this.observerData_Control.sizer.add( this.latitude_Sizer );
   this.observerData_Control.sizer.add( this.height_NumericEdit );

   this.observer_Control = new Control( this );
   this.observer_Control.sizer = new VerticalSizer;
   this.observer_Control.sizer.spacing = 4;
   this.observer_Control.sizer.add( this.geocentric_Sizer );
   this.observer_Control.sizer.add( this.topocentric_Sizer );
   this.observer_Control.sizer.add( this.observerData_Control );

   this.observer_Section = new SectionBar( this, "Observer" );
   this.observer_Section.setSection( this.observer_Control );

   // -------------------------------------------------------------------------

   let title_ToolTip = "<p>Optional single-line text that will be written at "
      + "the top of the ephemeris document.</p>"

   this.title_Label = new Label( this );
   this.title_Label.text = "Title:";
   this.title_Label.toolTip = title_ToolTip;
   this.title_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.title_Label.setFixedWidth( labelWidth1 );

   this.title_Edit = new Edit( this );
   this.title_Edit.setMinWidth( 40*emWidth );
   this.title_Edit.toolTip = title_ToolTip;
   this.title_Edit.onEditCompleted = function()
   {
      let text = this.text.trim();
      this.dialog.engine.title = text;
      this.text = text;
   };

   this.title_Sizer = new HorizontalSizer;
   this.title_Sizer.spacing = 4;
   this.title_Sizer.add( this.title_Label );
   this.title_Sizer.add( this.title_Edit );
   this.title_Sizer.addStretch();

   //

   let coordinateType_ToolTip = "<p>The type of coordinates to be shown.</p>"
      + "<p>Spherical equatorial coordinates: Geocentric or topocentric right "
      + "ascension and declination.</p>"
      + "<p>Rectangular equatorial coordinates: X, Y and Z components of the "
      + "geocentric or topocentric position vector.</p>"

   this.coordinateType_Label = new Label( this );
   this.coordinateType_Label.text = "Coordinates:";
   this.coordinateType_Label.toolTip = coordinateType_ToolTip;
   this.coordinateType_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.coordinateType_Label.setFixedWidth( labelWidth1 );

   this.coordinateType_ComboBox = new ComboBox( this );
   for ( let i = 0; i < this.coordinateTypes.length; ++i )
      this.coordinateType_ComboBox.addItem( this.coordinateTypes[i] );
   this.coordinateType_ComboBox.setFixedWidth( comboWidth1 );
   this.coordinateType_ComboBox.toolTip = coordinateType_ToolTip;
   this.coordinateType_ComboBox.onItemSelected = function( item )
   {
      this.dialog.engine.coordinateType = this.dialog.coordinateTypes[item];
      this.dialog.updateControls();
   };

   this.coordinateType_Sizer = new HorizontalSizer;
   this.coordinateType_Sizer.spacing = 4;
   this.coordinateType_Sizer.add( this.coordinateType_Label );
   this.coordinateType_Sizer.add( this.coordinateType_ComboBox );
   this.coordinateType_Sizer.addStretch();

   //

   let positionType_ToolTip = "<p>The type of positions to be calculated.</p>"
      + "<p>True: Positions of the object calculated <em>without accounting for "
      + "light-travel time</em>. These coordinates are only useful for "
      + "calculation verification purposes.</p>"
      + "<p>Geometric: Includes light-travel time corrections for solar system "
      + "bodies, space motion corrections for stars (parallax, radial velocity "
      + "and proper motions).</p>"
      + "<p>Astrometric: Like geometric positions, plus correction for "
      + "relativistic deflection of light due to solar gravitation, when "
      + "applicable.</p>"
      + "<p>Proper: Like astrometric positions, plus corrections for the "
      + "aberration of light, including relativistic terms.</p>"
      + "<p>Apparent: Like proper positions, plus corrections for frame bias, "
      + "precession and nutation. The origin of right ascension is the true "
      + "equinox of date.</p>"
      + "<p>Intermediate: Like proper positions, plus corrections for frame bias, "
      + "precession and nutation. The origin of right ascension is the Celestial "
      + "Intermediate Origin (CIO).</p>";

   this.positionType_Label = new Label( this );
   this.positionType_Label.text = "Positions:";
   this.positionType_Label.toolTip = positionType_ToolTip;
   this.positionType_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.positionType_Label.setFixedWidth( labelWidth1 );

   this.positionType_ComboBox = new ComboBox( this );
   for ( let i = 0; i < this.positionTypes.length; ++i )
      this.positionType_ComboBox.addItem( this.positionTypes[i] );
   this.positionType_ComboBox.setFixedWidth( comboWidth1 );
   this.positionType_ComboBox.toolTip = positionType_ToolTip;
   this.positionType_ComboBox.onItemSelected = function( item )
   {
      this.dialog.engine.positionType = this.dialog.positionTypes[item];
   };

   this.positionType_Sizer = new HorizontalSizer;
   this.positionType_Sizer.spacing = 4;
   this.positionType_Sizer.add( this.positionType_Label );
   this.positionType_Sizer.add( this.positionType_ComboBox );
   this.positionType_Sizer.addStretch();

   //

   let precision_ToolTip = "<p>Precision of spherical coordinates in arcseconds.</p>";

   this.precision_Label = new Label( this );
   this.precision_Label.text = "Precision:";
   this.precision_Label.toolTip = precision_ToolTip;
   this.precision_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.precision_Label.setFixedWidth( labelWidth1 );

   this.precision_ComboBox = new ComboBox( this );
   this.precision_ComboBox.addItem( "1\"" );
   this.precision_ComboBox.addItem( "0\".1" );
   this.precision_ComboBox.addItem( "0\".01" );
   this.precision_ComboBox.addItem( "0\".001" );
   this.precision_ComboBox.addItem( "0\".0001" );
   this.precision_ComboBox.setFixedWidth( comboWidth1 );
   this.precision_ComboBox.toolTip = precision_ToolTip;
   this.precision_ComboBox.onItemSelected = function( item )
   {
      this.dialog.engine.precision = item;
   };

   this.precision_Sizer = new HorizontalSizer;
   this.precision_Sizer.spacing = 4;
   this.precision_Sizer.add( this.precision_Label );
   this.precision_Sizer.add( this.precision_ComboBox );
   this.precision_Sizer.addStretch();

   //

   this.polarMotion_CheckBox = new CheckBox( this );
   this.polarMotion_CheckBox.text = "Polar motion corrections";
   this.polarMotion_CheckBox.toolTip = "<p>When this option is enabled, topocentric "
      + "places take into account polar motion corrections to compute the geocentric "
      + "position and velocity of the observer. This involves calculation of CIP "
      + "coordinates with respect to the ITRS, as well as access to a database of "
      + "CIP/ITRS positions which is part of the core PixInsight distribution.</p>"
      + "<p>Polar motion introduces changes at the mas level for calculation of "
      + "topocentric coordinates of the Moon. For the rest of objects, the effect "
      + "of polar motion corrections is completely negligible, although the required "
      + "computation time is also negligible.</p>";
   this.polarMotion_CheckBox.onCheck = function( checked )
   {
      this.dialog.engine.polarMotionEnabled = checked;
   };

   this.polarMotion_Sizer = new HorizontalSizer;
   this.polarMotion_Sizer.addUnscaledSpacing( labelWidth1 + ui4 );
   this.polarMotion_Sizer.add( this.polarMotion_CheckBox );
   this.polarMotion_Sizer.addStretch();

   //

   this.ephemeris_Control = new Control( this );
   this.ephemeris_Control.sizer = new VerticalSizer;
   this.ephemeris_Control.sizer.spacing = 4;
   this.ephemeris_Control.sizer.add( this.title_Sizer );
   this.ephemeris_Control.sizer.add( this.coordinateType_Sizer );
   this.ephemeris_Control.sizer.add( this.positionType_Sizer );
   this.ephemeris_Control.sizer.add( this.precision_Sizer );
   this.ephemeris_Control.sizer.add( this.polarMotion_Sizer );

   this.ephemeris_Section = new SectionBar( this, "Ephemeris" );
   this.ephemeris_Section.setSection( this.ephemeris_Control );

   // -------------------------------------------------------------------------

   let timescale_ToolTip = "<p>Timescale for ephemeris calculations.</p>"
      + "<p>TT - Terrestrial Time. This is the default timescale.</p>"
      + "<p>TDB - Barycentric Dynamical Time.</p>"
      + "<p>Teph - Ephemeris time, as defined by JPL DE/LE numerical "
      + "integrations. For all purposes, this is equivalent to TDB.</p>"
      + "<p>UTC - Coordinated Universal Time.</p>"
      + "<p>TAI - Atomic International Time.</p>"
      + "<p>UT1 - Universal Time.</p>";

   this.timescale_Label = new Label( this );
   this.timescale_Label.text = "Timescale:";
   this.timescale_Label.toolTip = timescale_ToolTip;
   this.timescale_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.timescale_Label.setFixedWidth( labelWidth1 );

   this.timescale_ComboBox = new ComboBox( this );
   for ( let i = 0; i < this.timescales.length; ++i )
      this.timescale_ComboBox.addItem( this.timescales[i] );
   this.timescale_ComboBox.toolTip = timescale_ToolTip;
   this.timescale_ComboBox.onItemSelected = function( item )
   {
      this.dialog.engine.timescale = this.dialog.timescales[item];
   };

   this.timescale_Sizer = new HorizontalSizer;
   this.timescale_Sizer.spacing = 4;
   this.timescale_Sizer.add( this.timescale_Label );
   this.timescale_Sizer.add( this.timescale_ComboBox );
   this.timescale_Sizer.addStretch();

   //

   this.startTime_Label = new Label( this );
   this.startTime_Label.text = "Start time:";
   this.startTime_Label.toolTip = "<p>Ephemeris start time.</p>";
   this.startTime_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.startTime_Label.setFixedWidth( labelWidth1 );

   this.startTime_Y_SpinBox = new SpinBox( this );
   this.startTime_Y_SpinBox.setRange( -4000, +4000 );
   this.startTime_Y_SpinBox.setFixedWidth( editWidth2 );

   this.startTime_Y_Label = new Label( this );
   this.startTime_Y_Label.text = "Y";
   this.startTime_Y_Label.setFixedWidth( labelWidth2 );

   this.startTime_N_SpinBox = new SpinBox( this );
   this.startTime_N_SpinBox.setRange( 1, 12 );
   this.startTime_N_SpinBox.setFixedWidth( editWidth1 );

   this.startTime_N_Label = new Label( this );
   this.startTime_N_Label.text = "M";
   this.startTime_N_Label.setFixedWidth( labelWidth2 );

   this.startTime_D_SpinBox = new SpinBox( this );
   this.startTime_D_SpinBox.setRange( 0, 31 );
   this.startTime_D_SpinBox.setFixedWidth( editWidth1 );

   this.startTime_D_Label = new Label( this );
   this.startTime_D_Label.text = "d";
   this.startTime_D_Label.setFixedWidth( labelWidth2 );

   this.startTime_H_SpinBox = new SpinBox( this );
   this.startTime_H_SpinBox.setRange( 0, 23 );
   this.startTime_H_SpinBox.setFixedWidth( editWidth1 );

   this.startTime_H_Label = new Label( this );
   this.startTime_H_Label.text = "h";
   this.startTime_H_Label.setFixedWidth( labelWidth2 );

   this.startTime_M_SpinBox = new SpinBox( this );
   this.startTime_M_SpinBox.setRange( 0, 59 );
   this.startTime_M_SpinBox.setFixedWidth( editWidth1 );

   this.startTime_M_Label = new Label( this );
   this.startTime_M_Label.text = "m";
   this.startTime_M_Label.setFixedWidth( labelWidth2 );

   this.startTime_S_SpinBox = new SpinBox( this );
   this.startTime_S_SpinBox.setRange( 0, 59 );
   this.startTime_S_SpinBox.setFixedWidth( editWidth1 );

   this.startTime_S_Label = new Label( this );
   this.startTime_S_Label.text = "s";
   this.startTime_S_Label.setFixedWidth( labelWidth2 );

   this.startTime_Sizer = new HorizontalSizer;
   this.startTime_Sizer.spacing = 4;
   this.startTime_Sizer.add( this.startTime_Label );
   this.startTime_Sizer.add( this.startTime_Y_SpinBox );
   this.startTime_Sizer.add( this.startTime_Y_Label );
   this.startTime_Sizer.add( this.startTime_N_SpinBox );
   this.startTime_Sizer.add( this.startTime_N_Label );
   this.startTime_Sizer.add( this.startTime_D_SpinBox );
   this.startTime_Sizer.add( this.startTime_D_Label );
   this.startTime_Sizer.add( this.startTime_H_SpinBox );
   this.startTime_Sizer.add( this.startTime_H_Label );
   this.startTime_Sizer.add( this.startTime_M_SpinBox );
   this.startTime_Sizer.add( this.startTime_M_Label );
   this.startTime_Sizer.add( this.startTime_S_SpinBox );
   this.startTime_Sizer.add( this.startTime_S_Label );
   this.startTime_Sizer.addStretch();

   //

   this.timeStep_Label = new Label( this );
   this.timeStep_Label.text = "Time step:";
   this.timeStep_Label.toolTip = "<p>Time elapsed between two successive calculation steps.</p>";
   this.timeStep_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.timeStep_Label.setFixedWidth( labelWidth1 );

   this.timeStep_D_SpinBox = new SpinBox( this );
   this.timeStep_D_SpinBox.setRange( 0, 1000 );
   this.timeStep_D_SpinBox.setFixedWidth( editWidth2 );

   this.timeStep_D_Label = new Label( this );
   this.timeStep_D_Label.text = "d";
   this.timeStep_D_Label.setFixedWidth( labelWidth2 );

   this.timeStep_H_SpinBox = new SpinBox( this );
   this.timeStep_H_SpinBox.setRange( 0, 23 );
   this.timeStep_H_SpinBox.setFixedWidth( editWidth1 );

   this.timeStep_H_Label = new Label( this );
   this.timeStep_H_Label.text = "h";
   this.timeStep_H_Label.setFixedWidth( labelWidth2 );

   this.timeStep_M_SpinBox = new SpinBox( this );
   this.timeStep_M_SpinBox.setRange( 0, 59 );
   this.timeStep_M_SpinBox.setFixedWidth( editWidth1 );

   this.timeStep_M_Label = new Label( this );
   this.timeStep_M_Label.text = "m";
   this.timeStep_M_Label.setFixedWidth( labelWidth2 );

   this.timeStep_S_SpinBox = new SpinBox( this );
   this.timeStep_S_SpinBox.setRange( 0, 59 );
   this.timeStep_S_SpinBox.setFixedWidth( editWidth1 );

   this.timeStep_S_Label = new Label( this );
   this.timeStep_S_Label.text = "s";
   this.timeStep_S_Label.setFixedWidth( labelWidth2 );

   this.timeStep_Sizer = new HorizontalSizer;
   this.timeStep_Sizer.spacing = 4;
   this.timeStep_Sizer.add( this.timeStep_Label );
   this.timeStep_Sizer.add( this.timeStep_D_SpinBox );
   this.timeStep_Sizer.add( this.timeStep_D_Label );
   this.timeStep_Sizer.add( this.timeStep_H_SpinBox );
   this.timeStep_Sizer.add( this.timeStep_H_Label );
   this.timeStep_Sizer.add( this.timeStep_M_SpinBox );
   this.timeStep_Sizer.add( this.timeStep_M_Label );
   this.timeStep_Sizer.add( this.timeStep_S_SpinBox );
   this.timeStep_Sizer.add( this.timeStep_S_Label );
   this.timeStep_Sizer.addStretch();

   //

   this.stepCount_Label = new Label( this );
   this.stepCount_Label.text = "Step count:";
   this.stepCount_Label.toolTip = "<p>Number of ephemeris calculation steps.</p>";
   this.stepCount_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.stepCount_Label.setFixedWidth( labelWidth1 );

   this.stepCount_SpinBox = new SpinBox( this );
   this.stepCount_SpinBox.setRange( 1, 1000 );
   this.stepCount_SpinBox.setFixedWidth( editWidth2 );
   this.stepCount_SpinBox.onValueUpdated = function( value )
   {
      this.dialog.engine.stepCount = value;
   }

   this.stepCount_Sizer = new HorizontalSizer;
   this.stepCount_Sizer.spacing = 4;
   this.stepCount_Sizer.add( this.stepCount_Label );
   this.stepCount_Sizer.add( this.stepCount_SpinBox );
   this.stepCount_Sizer.addStretch();

   //

   this.time_Control = new Control( this );
   this.time_Control.sizer = new VerticalSizer;
   this.time_Control.sizer.spacing = 4;
   this.time_Control.sizer.add( this.timescale_Sizer );
   this.time_Control.sizer.add( this.startTime_Sizer );
   this.time_Control.sizer.add( this.timeStep_Sizer );
   this.time_Control.sizer.add( this.stepCount_Sizer );

   this.time_Section = new SectionBar( this, "Time" );
   this.time_Section.setSection( this.time_Control );

   // -------------------------------------------------------------------------

   this.newInstance_Button = new ToolButton( this );
   this.newInstance_Button.icon = this.scaledResource( ":/process-interface/new-instance.png" );
   this.newInstance_Button.setScaledFixedSize( 24, 24 );
   this.newInstance_Button.toolTip = "New Instance";
   this.newInstance_Button.onMousePress = function()
   {
      this.hasFocus = true;
      this.dialog.captureComplexParameters();
      this.dialog.engine.save();
      this.pushed = false;
      this.dialog.newInstance();
   };

   //

   this.reset_Button = new PushButton( this );
   this.reset_Button.text = "Reset";
   this.reset_Button.icon = this.scaledResource( ":/icons/reload.png" );
   this.reset_Button.toolTip = "<p>Reset all script parameters to default values.</p>";
   this.reset_Button.onClick = function()
   {
      if ( (new MessageBox( "<p>About to reset all script parameters to default values.</p>" +
                            "<p><b>This cannot be undone. Are you sure?</b></p>"  ,
                            TITLE, StdIcon_Warning, StdButton_Yes, StdButton_No ).execute()) == StdButton_Yes )
      {
         this.dialog.engine.initialize();
         this.dialog.updateControls();
      }
   };

   this.generate_Button = new PushButton( this );
   this.generate_Button.text = "Generate";
   this.generate_Button.icon = this.scaledResource( ":/icons/function.png" );
   this.generate_Button.toolTip = "<p>Compute ephemerides and present the "
      + "result as a plain text document.</p>";
   this.generate_Button.defaultButton = true;
   this.generate_Button.onClick = function()
   {
      this.dialog.captureComplexParameters();
      let document = this.dialog.engine.generate();

      let text = this.dialog.output_TextBox.text;
      if ( text.length > 0 )
         text += '\n';
      for ( let i = 0; i < document.length; ++i )
         text += document[i] + '\n';
      this.dialog.output_TextBox.text = text;
      this.dialog.output_TextBox.end();
   };

   this.dismiss_Button = new PushButton( this );
   this.dismiss_Button.text = "Dismiss";
   this.dismiss_Button.icon = this.scaledResource( ":/icons/window-close.png" );
   this.dismiss_Button.toolTip = "<p>Terminate script execution.</p>";
   this.dismiss_Button.onClick = function()
   {
      this.dialog.cancel();
   };

   this.globalActions_Sizer = new HorizontalSizer;
   this.globalActions_Sizer.spacing = 6;
   this.globalActions_Sizer.add( this.newInstance_Button );
   this.globalActions_Sizer.add( this.reset_Button );
   this.globalActions_Sizer.addStretch();
   this.globalActions_Sizer.add( this.generate_Button );
   this.globalActions_Sizer.add( this.dismiss_Button );

   // -------------------------------------------------------------------------

   this.output_TextBox = new TextBox( this );
   this.output_TextBox.readOnly = true;
   this.output_TextBox.styleSheet =
   "* { font-family: DejaVu Sans Mono, \"M+ 1m\", Vera Sans Mono, Courier New, Courier, Monospace;" +
#ifeq __PI_PLATFORM__ MACOSX
       "font-size: 12pt;"
#else
       "font-size: 9.5pt;"
#endif
   + " }";
   this.output_TextBox.setMinSize( 60*emWidth, 30*emWidth );

   // -------------------------------------------------------------------------

   this.clear_Button = new PushButton( this );
   this.clear_Button.text = "Clear";
   this.clear_Button.icon = this.scaledResource( ":/icons/clear.png" );
   this.clear_Button.toolTip = "<p>Clear all generated ephemeris output, leaving "
      + "an empty document.</p>";
   this.clear_Button.onClick = function()
   {
      this.dialog.output_TextBox.clear();
   };

   this.saveAs_Button = new PushButton( this );
   this.saveAs_Button.text = "Save";
   this.saveAs_Button.icon = this.scaledResource( ":/icons/save.png" );
   this.saveAs_Button.toolTip = "<p>Write the current ephemeris output as a new "
      + "plain text document.</p>";
   this.saveAs_Button.onClick = function()
   {
      var sfd = new SaveFileDialog;
      sfd.caption = "Save Ephemerides";
      sfd.filters = [
         ["Plain Text Files", "*.txt"],
         ["Any Files", "*"]
      ];
      if ( sfd.execute() )
         File.writeTextFile( sfd.fileName, this.dialog.output_TextBox.text );
   };

   this.textActions_Sizer = new HorizontalSizer;
   this.textActions_Sizer.spacing = 6;
   this.textActions_Sizer.add( this.clear_Button );
   this.textActions_Sizer.addStretch();
   this.textActions_Sizer.add( this.saveAs_Button );

   // -------------------------------------------------------------------------

   this.solarSystem_Section.onToggleSection =
   this.stars_Section.onToggleSection =
   this.observer_Section.onToggleSection =
   this.ephemeris_Section.onToggleSection =
   this.time_Section.onToggleSection = function( bar, toggleBegin )
   {
      if ( toggleBegin )
         this.dialog.output_TextBox.setFixedSize();
      else
      {
         this.dialog.output_TextBox.setVariableSize();
         this.dialog.output_TextBox.setMinSize( 60*emWidth, 30*emWidth );
      }
   };

   // -------------------------------------------------------------------------

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 9;
   this.sizer.add( this.solarSystem_Section );
   this.sizer.add( this.solarSystem_Control );
   this.sizer.add( this.stars_Section );
   this.sizer.add( this.stars_Control );
   this.sizer.add( this.observer_Section );
   this.sizer.add( this.observer_Control );
   this.sizer.add( this.ephemeris_Section );
   this.sizer.add( this.ephemeris_Control );
   this.sizer.add( this.time_Section );
   this.sizer.add( this.time_Control );
   this.sizer.addSpacing( 8 );
   this.sizer.add( this.globalActions_Sizer );
   this.sizer.addSpacing( 8 );
   this.sizer.add( this.output_TextBox );
   this.sizer.add( this.textActions_Sizer );

   this.windowTitle = "Ephemerides";

   this.solarSystem_Control.visible = this.engine.bodyType != "star";
   this.stars_Control.visible = this.engine.bodyType == "star";
   this.observer_Control.visible = this.engine.topocentric;
   this.ephemeris_Control.visible = false;

   this.adjustToContents();
   this.setMinSize();

   // -------------------------------------------------------------------------

   this.captureComplexParameters = function()
   {
      if ( this.engine.isPlanet() )
         this.engine.bodyId = this.engine.planetId = this.planets[this.planet_ComboBox.currentItem][0];
      else if ( this.engine.isAsteroid() )
         this.engine.bodyId = this.engine.asteroidId = this.asteroids[this.asteroid_ComboBox.currentItem][0];

      this.engine.starName = this.starName_Edit.text.trim();

      this.engine.star = new StarPosition(
            this.alpha_H_SpinBox.value
                 + (this.alpha_M_SpinBox.value
                   + this.alpha_S_NumericEdit.value/60)/60,
            (this.delta_D_SpinBox.value
                 + (this.delta_M_SpinBox.value
                   + this.delta_S_NumericEdit.value/60)/60) * (this.deltaIsSouth_CheckBox.checked ? -1 : 1),
            this.muAlpha_NumericEdit.value,
            this.muDelta_NumericEdit.value,
            this.parallax_NumericEdit.value/1000, // mas -> arcsec
            this.radialVelocity_NumericEdit.value,
            format( "%d-%02d-%02dT00:00:00Z",
                    this.epoch_Y_SpinBox.value,
                    this.epoch_M_SpinBox.value,
                    this.epoch_D_SpinBox.value ) );

      this.engine.observer = new ObserverPosition(
            (this.longitude_D_SpinBox.value
               + (this.longitude_M_SpinBox.value
                 + this.longitude_S_NumericEdit.value/60)/60) * (this.longitudeIsWest_CheckBox.checked ? -1 : 1),
            (this.latitude_D_SpinBox.value
               + (this.latitude_M_SpinBox.value
                 + this.latitude_S_NumericEdit.value/60)/60) * (this.latitudeIsSouth_CheckBox.checked ? -1 : 1),
            this.height_NumericEdit.value );

      this.engine.startTime = new Date( format( "%d-%02d-%02dT%02d:%02d:%06.3fZ",
                                        this.startTime_Y_SpinBox.value,
                                        this.startTime_N_SpinBox.value,
                                        this.startTime_D_SpinBox.value,
                                        this.startTime_H_SpinBox.value,
                                        this.startTime_M_SpinBox.value,
                                        this.startTime_S_SpinBox.value ) );

      this.engine.timeStep = this.timeStep_D_SpinBox.value
                             + (this.timeStep_H_SpinBox.value
                               + (this.timeStep_M_SpinBox.value
                                 + this.timeStep_S_SpinBox.value/60)/60)/24;

      this.updateControls();
   };

   // -------------------------------------------------------------------------

   this.updateControls = function()
   {
      this.planet_CheckBox.checked = this.engine.isPlanet();
      this.planet_ComboBox.enabled = this.engine.isPlanet();
      for ( let i = 0; i < this.planets.length; ++i )
         if ( this.planets[i][0] == this.engine.planetId )
         {
            this.planet_ComboBox.currentItem = i;
            break;
         }

      this.asteroid_CheckBox.checked = this.engine.isAsteroid();
      this.asteroid_ComboBox.enabled = this.engine.isAsteroid();
      for ( let i = 0; i < this.asteroids.length; ++i )
         if ( this.asteroids[i][0] == this.engine.asteroidId )
         {
            this.asteroid_ComboBox.currentItem = i;
            break;
         }

      this.star_CheckBox.checked = this.engine.isStar();

      this.starData_Control.enabled = this.engine.isStar();

      this.starName_Edit.text = this.engine.starName;

      let s = Math.decimalToSexagesimal( this.engine.star.alpha );
      s[3] = Math.roundTo( s[3], 7 );
      if ( s[3] > 59.9999999 )
      {
         s[3] = 0;
         if ( ++s[2] == 60 )
         {
            s[2] = 0;
            if ( ++s[1] == 24 )
               s[1] = 0;
         }
      }
      this.alpha_H_SpinBox.value = s[1];
      this.alpha_M_SpinBox.value = s[2];
      this.alpha_S_NumericEdit.setValue( s[3] );

      let s = Math.decimalToSexagesimal( this.engine.star.delta );
      s[3] = Math.roundTo( s[3], 6 );
      if ( s[3] > 59.999999 )
      {
         s[3] = 0;
         if ( ++s[2] == 60 )
         {
            s[2] = 0;
            ++s[1];
         }
      }
      this.delta_D_SpinBox.value = s[1];
      this.delta_M_SpinBox.value = s[2];
      this.delta_S_NumericEdit.setValue( s[3] );
      this.deltaIsSouth_CheckBox.checked = s[0] < 0;

      this.muAlpha_NumericEdit.setValue( this.engine.star.muAlpha );
      this.muDelta_NumericEdit.setValue( this.engine.star.muDelta );
      this.parallax_NumericEdit.setValue( this.engine.star.parallax*1000 ); // arcsec -> mas
      this.radialVelocity_NumericEdit.setValue( this.engine.star.radialVelocity );

      this.epoch_Y_SpinBox.value = this.engine.star.epoch.getUTCFullYear();
      this.epoch_M_SpinBox.value = this.engine.star.epoch.getUTCMonth()+1;
      this.epoch_D_SpinBox.value = this.engine.star.epoch.getUTCDate();

      this.geocentric_CheckBox.checked = !this.engine.topocentric;
      this.topocentric_CheckBox.checked = this.engine.topocentric;

      this.observerData_Control.enabled = this.engine.topocentric;

      let l = this.engine.observer.longitude;
      if ( l > 180 )
         l -= 360;
      let s = Math.decimalToSexagesimal( l );
      s[3] = Math.roundTo( s[3], 2 );
      if ( s[3] > 59.99 )
      {
         s[3] = 0;
         if ( ++s[2] == 60 )
         {
            s[2] = 0;
            ++s[1];
         }
      }
      this.longitude_D_SpinBox.value = s[1];
      this.longitude_M_SpinBox.value = s[2];
      this.longitude_S_NumericEdit.setValue( s[3] );
      this.longitudeIsWest_CheckBox.checked = s[0] < 0;

      let s = Math.decimalToSexagesimal( this.engine.observer.latitude );
      s[3] = Math.roundTo( s[3], 2 );
      if ( s[3] > 59.99 )
      {
         s[3] = 0;
         if ( ++s[2] == 60 )
         {
            s[2] = 0;
            ++s[1];
         }
      }
      this.latitude_D_SpinBox.value = s[1];
      this.latitude_M_SpinBox.value = s[2];
      this.latitude_S_NumericEdit.setValue( s[3] );
      this.latitudeIsSouth_CheckBox.checked = s[0] < 0;

      this.height_NumericEdit.setValue( this.engine.observer.height );

      for ( let i = 0; i < this.coordinateTypes.length; ++i )
         if ( this.coordinateTypes[i] == this.engine.coordinateType )
         {
            this.coordinateType_ComboBox.currentItem = i;
            break;
         }

      for ( let i = 0; i < this.positionTypes.length; ++i )
         if ( this.positionTypes[i] == this.engine.positionType )
         {
            this.positionType_ComboBox.currentItem = i;
            break;
         }

      this.precision_ComboBox.currentItem = this.engine.precision;
      this.precision_Label.enabled =
      this.precision_ComboBox.enabled = this.engine.isSpherical();

      this.polarMotion_CheckBox.checked = this.engine.polarMotionEnabled;
      this.polarMotion_CheckBox.enabled = this.engine.topocentric;

      for ( let i = 0; i < this.timescales.length; ++i )
         if ( this.timescales[i] == this.engine.timescale )
         {
            this.timescale_ComboBox.currentItem = i;
            break;
         }

      this.startTime_Y_SpinBox.value = this.engine.startTime.getUTCFullYear();
      this.startTime_N_SpinBox.value = this.engine.startTime.getUTCMonth()+1;
      this.startTime_D_SpinBox.value = this.engine.startTime.getUTCDate();
      this.startTime_H_SpinBox.value = this.engine.startTime.getUTCHours();
      this.startTime_M_SpinBox.value = this.engine.startTime.getUTCMinutes();
      this.startTime_S_SpinBox.value = this.engine.startTime.getUTCSeconds();

      let h = Math.frac( this.engine.timeStep )*24;
      let m = Math.frac( h )*60;
      this.timeStep_D_SpinBox.value = Math.trunc( this.engine.timeStep );
      this.timeStep_H_SpinBox.value = Math.trunc( h );
      this.timeStep_M_SpinBox.value = Math.trunc( m );
      this.timeStep_S_SpinBox.value = Math.trunc( Math.frac( m )*60 );

      this.stepCount_SpinBox.value = this.engine.stepCount;
   };

   this.updateControls();
}

EphemerisDialog.prototype = new Dialog;

// ----------------------------------------------------------------------------
// EOF EphemerisDialog.js - Released 2018-12-13T19:24:09Z
