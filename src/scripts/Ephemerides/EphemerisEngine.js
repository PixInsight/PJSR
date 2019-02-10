// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// EphemerisEngine.js - Released 2018-12-13T19:24:09Z
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
 * Ephemeris document generation.
 */

#include "EphUtility.jsh"

// ----------------------------------------------------------------------------

function EphemerisEngine()
{
   if ( Parameters.isViewTarget )
      throw new Error( TITLE + " cannot be executed on views." );

   /*
    * Initialize script parameters.
    */
   this.initialize = function()
   {
      this.title = "";
      this.bodyType = "planet"; // 'planet', 'asteroid' or 'star'
      this.bodyId = "Me";
      this.planetId = "Me";
      this.asteroidId = "1";
      this.star = new StarPosition( 0, 0 );
      this.starName = "";
      this.topocentric = false;
      this.observer = new ObserverPosition( 0, 0, 0 );
      this.polarMotionEnabled = true;
      this.coordinateType = "spherical"; // 'spherical' or 'rectangular'
      this.positionType = "apparent";
      this.precision = 2;
      this.startTime = new Date( format( "%d-%02d-%02dT00:00:00Z", (new Date).getUTCFullYear()+1, 1, 1 ) );
      this.timescale = "TT";
      this.timeStep = 1.0; // in days
      this.stepCount = 30;
   };

   /*
    * Import script parameters.
    */
   this.load = function()
   {
      if ( Parameters.has( "title" ) )
         this.title = Parameters.getString( "title" );
      if ( Parameters.has( "bodyType" ) )
         this.bodyType = Parameters.getString( "bodyType" );
      if ( Parameters.has( "bodyId" ) )
         this.bodyId = Parameters.getString( "bodyId" );
      if ( Parameters.has( "planetId" ) )
         this.planetId = Parameters.getString( "planetId" );
      if ( Parameters.has( "asteroidId" ) )
         this.asteroidId = Parameters.getString( "asteroidId" );

      if ( Parameters.has( "starAlpha" ) )
         this.star.alpha = Parameters.getReal( "starAlpha" );
      if ( Parameters.has( "starDelta" ) )
         this.star.delta = Parameters.getReal( "starDelta" );
      if ( Parameters.has( "starMuAlpha" ) )
         this.star.muAlpha = Parameters.getReal( "starMuAlpha" );
      if ( Parameters.has( "starMuDelta" ) )
         this.star.muDelta = Parameters.getReal( "starMuDelta" );
      if ( Parameters.has( "starParallax" ) )
         this.star.parallax = Parameters.getReal( "starParallax" );
      if ( Parameters.has( "starRadialVelocity" ) )
         this.star.radialVelocity = Parameters.getReal( "starRadialVelocity" );
      if ( Parameters.has( "starEpoch" ) )
         this.star.epoch = new Date( Parameters.getString( "starEpoch" ) );
      if ( Parameters.has( "starName" ) )
         this.starName = Parameters.getString( "starName" );

      if ( Parameters.has( "topocentric" ) )
         this.topocentric = Parameters.getBoolean( "topocentric" );

      if ( Parameters.has( "observerEquatorialRadius" ) )
         this.observer.equatorialRadius = Parameters.getReal( "observerEquatorialRadius" );
      if ( Parameters.has( "observerFlattening" ) )
         this.observer.flattening = Parameters.getReal( "observerFlattening" );
      if ( Parameters.has( "observerHeight" ) )
         this.observer.height = Parameters.getReal( "observerHeight" );
      if ( Parameters.has( "observerLatitude" ) )
         this.observer.latitude = Parameters.getReal( "observerLatitude" );
      if ( Parameters.has( "observerLongitude" ) )
         this.observer.longitude = Parameters.getReal( "observerLongitude" );

      if ( Parameters.has( "polarMotionEnabled" ) )
         this.polarMotionEnabled = Parameters.getBoolean( "polarMotionEnabled" );

      if ( Parameters.has( "coordinateType" ) )
         this.coordinateType = Parameters.getString( "coordinateType" );
      if ( Parameters.has( "positionType" ) )
         this.positionType = Parameters.getString( "positionType" );
      if ( Parameters.has( "precision" ) )
         this.precision = Parameters.getUInt( "precision" );

      if ( Parameters.has( "startTime" ) )
         this.startTime = new Date( Parameters.getString( "startTime" ) );
      if ( Parameters.has( "timescale" ) )
         this.timescale = Parameters.getString( "timescale" );
      if ( Parameters.has( "timeStep" ) )
         this.timeStep = Parameters.getReal( "timeStep" );
      if ( Parameters.has( "stepCount" ) )
         this.stepCount = Parameters.getUInt( "stepCount" );
   };

   /*
    * Export script parameters.
    */
   this.save = function()
   {
      Parameters.set( "title", this.title );
      Parameters.set( "bodyType", this.bodyType );
      Parameters.set( "bodyId", this.bodyId );
      Parameters.set( "planetId", this.planetId );
      Parameters.set( "asteroidId", this.asteroidId );

      Parameters.set( "starAlpha", this.star.alpha );
      Parameters.set( "starDelta", this.star.delta );
      Parameters.set( "starMuAlpha", this.star.muAlpha );
      Parameters.set( "starMuDelta", this.star.muDelta );
      Parameters.set( "starParallax", this.star.parallax );
      Parameters.set( "starRadialVelocity", this.star.radialVelocity );
      Parameters.set( "starEpoch", this.star.epoch.toISOString() );
      Parameters.set( "starName", this.starName );

      Parameters.set( "topocentric", this.topocentric );

      Parameters.set( "observerEquatorialRadius", this.observer.equatorialRadius );
      Parameters.set( "observerFlattening", this.observer.flattening );
      Parameters.set( "observerHeight", this.observer.height );
      Parameters.set( "observerLatitude", this.observer.latitude );
      Parameters.set( "observerLongitude", this.observer.longitude );

      Parameters.set( "polarMotionEnabled", this.polarMotionEnabled );

      Parameters.set( "coordinateType", this.coordinateType );
      Parameters.set( "positionType", this.positionType );
      Parameters.set( "precision", this.precision );

      Parameters.set( "startTime", this.startTime.toISOString() );
      Parameters.set( "timescale", this.timescale );
      Parameters.set( "timeStep", this.timeStep );
      Parameters.set( "stepCount", this.stepCount );
   };

   /*
    * Main ephemeris generation routine.
    */
   this.generate = function()
   {
      /*
       * Select a suitable ephemerides file for solar system bodies.
       */
      let E;
      switch ( this.bodyType )
      {
      case "planet":
         E = EphemerisFile.fundamentalEphemerides;
         break;
      case "asteroid":
         E = EphemerisFile.asteroidEphemerides;
         break;
      case "star":
         E = null;
         break;
      default:
         throw new Error( "EphemerisEngine.generate(): Internal error: Unknown body type \'" + this.bodyType + "\'."  );
      }

      /*
       * Define the target object, either an ephemeris file handle for solar
       * system bodies, or a reference to our star data.
       */
      let O;
      let objectName = "";
      let isMoon = false;
      if ( E )
      {
         if ( this.bodyId == "Mn" || this.bodyId.toLowerCase() == "moon" )
         {
            isMoon = true;
            O = new EphemerisHandle( E, this.bodyId, "Ea" );
         }
         else
            O = new EphemerisHandle( E, this.bodyId, "SSB" );

         if ( this.bodyType == "asteroid" )
            objectName = O.objectId + ' ';
         objectName += O.objectName;
      }
      else
      {
         O = this.star;
         objectName = this.starName.trim();
         if ( objectName.length == 0 )
            objectName = "&lt;* unnamed star *&gt;";
      }

      /*
       * Starting time of calculation as a Julian date. Calculate the JD as
       * separate integer and fractional components for improved time
       * representation accuracy.
       */
      let T = Math.complexTimeToJD2(
                     this.startTime.getUTCFullYear(),
                     this.startTime.getUTCMonth()+1,
                     this.startTime.getUTCDate(),
                     (this.startTime.getUTCHours()
                        + (this.startTime.getUTCMinutes()
                           + this.startTime.getUTCSeconds()/60.0)/60.0)/24.0 );

      // Precalculate the width of each table column in characters.
      let wTime  = EphUtility.timeString( T[0], T[1] ).length;
      let wAlpha = EphUtility.angleString( 0, 0, false, this.precision+1 ).length;
      let wDelta = EphUtility.angleString( 0, 0, true, this.precision ).length;
      let wXYZ   = isMoon ? 11 : 13;
      let wDist  = E ? (isMoon ? 10 : 11) : 0;
      let wMag   = (E && (new Position( T[0], T[1], "TT" )).canComputeApparentVisualMagnitude( O )) ? 5 : 0;
      let width  = wTime + 2 + (this.isSpherical() ? wAlpha+2+wDelta+(wDist ? 2+wDist : 0)+(wMag ? 2+wMag : 0) : wXYZ+2+wXYZ+2+wXYZ);

      let document = [];

      /*
       * Document headers.
       */
      if ( this.title.length > 0 )
      {
         document.push( '='.repeat( width ) );
         document.push( "<b>" + this.title + "</b>" );
      }
      document.push( '='.repeat( width ) );
      document.push( "Target body : " + objectName );
      document.push( "Ephemeris   : " + (this.isSpherical() ? "Spherical" : "Rectangular") + " equatorial coordinates." );
      document.push( "Observer    : " + (this.topocentric ? "Topocentric" : "Geocentric") );

      if ( this.topocentric )
      {
         let lon = this.observer.longitude;
         if ( lon > 180 )
            lon -= 360;
      document.push( "Longitude   : " + EphUtility.angleString( Math.abs( lon ), 0, false/*sign*/, 2, true/*units*/ ) + ((lon < 0) ? " W" : " E") );
      document.push( "Latitude    : " + EphUtility.angleString( Math.abs( this.observer.latitude ), 0, false/*sign*/, 2, true/*units*/ ) + ((this.observer.latitude < 0) ? " S" : " N") );
      document.push( "Height      : " + format( "%5.0f m", this.observer.height ) );
      }

      if ( this.timescale == "UT1" )
      {
      document.push( "DeltaT      : " + format( "%+.2f -> %+.2f s",
                                                   EphemerisFile.deltaT( T[0], T[1] ),
                                                   EphemerisFile.deltaT( T[0], T[1] + this.stepCount*this.timeStep ) ) );
      }
      document.push( '='.repeat( width ) );

      /*
       * Table headers.
       */
      let sTime = EphUtility.centerJustified( "Date - " + EphUtility.centerJustified( this.timescale, 3 ), wTime );
      if ( this.isSpherical() )
      {
         /*
          * Table headers for spherical coordinates.
          */
         // First header line.
         document.push(   ' '.repeat( wTime )
                        + "  "
                        + EphUtility.centerJustified( EphUtility.capitalized( this.positionType ), wAlpha + 2 + wDelta, '-' )
                        + "  "
                        + (wDist ? EphUtility.centerJustified( "True", wDist ) : '')
                        + (wMag ? "  " : '')
                        + (wMag ? EphUtility.centerJustified( "Vis.", wMag ) : '') );
         // Second header line.
         document.push(   sTime
                        + "  "
                        + EphUtility.centerJustified( "R.A.", wAlpha )
                        + "  "
                        + EphUtility.centerJustified( "Dec.", wDelta )
                        + "  "
                        + (wDist ? EphUtility.centerJustified( "Distance", wDist ) : '')
                        + (wMag ? "  " : '')
                        + (wMag ? EphUtility.centerJustified( "Mag.", wMag ) : '') );
         // Third line of separators.
         document.push(   '-'.repeat( wTime )
                        + "  "
                        + '-'.repeat( wAlpha )
                        + "  "
                        + '-'.repeat( wDelta )
                        + (wDist ? "  " : '')
                        + '-'.repeat( wDist )
                        + (wMag ? "  " : '')
                        + '-'.repeat( wMag ) );
         // Fourth line of unit specifiers.
         document.push(   ' '.repeat( wTime )
                        + "  "
                        + "  h  m  s" + ' '.repeat( this.precision+1 )
                        + "  "
                        + "   \u00B0  \u2032  \u2033" + ' '.repeat( this.precision )
                        + (wDist ? "  " : '')
                        + (wDist ? (isMoon ? "      km" : "  au") : '') );
      }
      else
      {
         /*
          * Table headers for rectangular coordinates.
          */
         // First header line.
         document.push(   ' '.repeat( wTime )
                        + "  "
                        + EphUtility.centerJustified( this.positionType, 3*wXYZ + 4, '-' ) );
         // Second header line.
         document.push(   sTime
                        + "  "
                        + EphUtility.centerJustified( "X", wXYZ )
                        + "  "
                        + EphUtility.centerJustified( "Y", wXYZ )
                        + "  "
                        + EphUtility.centerJustified( "Z", wXYZ ) );
         // Third line of separators.
         document.push( '-'.repeat( wTime )
                        + "  "
                        + '-'.repeat( wXYZ )
                        + "  "
                        + '-'.repeat( wXYZ )
                        + "  "
                        + '-'.repeat( wXYZ ) );
         // Fourth line of unit specifiers.
         document.push( ' '.repeat( wTime ) + "  "
                        + (isMoon ? "       km  " : "   au        ")
                        + "  "
                        + (isMoon ? "       km  " : "   au        ")
                        + "  "
                        + (isMoon ? "       km" : "   au") );
      }

      /*
       * Table contents, i.e., the ephemeris.
       */
      for ( let step = 0; step < this.stepCount; ++step, T[1] += this.timeStep )
      {
         /*
          * Create a new Position object for calculation at the current time.
          */
         let P = new Position( T[0], T[1], this.timescale );
         if ( this.topocentric )
         {
            P.polarMotionEnabled = this.polarMotionEnabled;
            P.observer = this.observer;
         }

         /*
          * Compute rectangular equatorial coordinates.
          */
         let r;
         switch ( this.positionType )
         {
         case "true":
            r = P.true( O );
            break;
         case "geometric":
            r = P.geometric( O );
            break;
         case "astrometric":
            r = P.astrometric( O );
            break;
         case "proper":
            r = P.proper( O );
            break;
         case "apparent":
            r = P.apparent( O );
            break;
         case "intermediate":
            r = P.intermediate( O );
            break;
         default:
            throw new Error( "EphemerisEngine.generate(): Internal error: Unknown position type \'" + this.positionType + "\'."  );
         }

         /*
          * Form a new line of the output document.
          */
         let line = EphUtility.timeString( T[0], T[1] ) + "  ";

         if ( this.isSpherical() )
         {
            let s = r.toSpherical2Pi();
            line += EphUtility.angleString( Math.deg( s[0] )/15, 24/*range*/, false/*sign*/, this.precision+1 )
                  + "  "
                  + EphUtility.angleString( Math.deg( s[1] ), 0/*range*/, true/*sign*/, this.precision );

            if ( wDist )
               line += "  " + format( isMoon ? "%10.3f" : "%11.8f", P.trueDistance( O ) );

            if ( wMag )
            {
               let V = P.apparentVisualMagnitude( O );
               line += "  " + ((V != null) ? format( "%5.2f", V ) : "-----");
            }
         }
         else
         {
            line += format( isMoon ? "%c%10.3f  %c%10.3f  %c%10.3f" : "%c%12.9f  %c%12.9f  %c%12.9f",
                            (r.at( 0 ) < 0) ? '-' : '+', Math.abs( r.at( 0 ) ),
                            (r.at( 1 ) < 0) ? '-' : '+', Math.abs( r.at( 1 ) ),
                            (r.at( 2 ) < 0) ? '-' : '+', Math.abs( r.at( 2 ) ) );
         }

         document.push( line );
      }

      for ( let i = 0; i < document.length; ++i )
         document[i] = document[i].trimRight();
      return document;
   };

   this.isPlanet = function()
   {
      return this.bodyType == "planet";
   };

   this.isAsteroid = function()
   {
      return this.bodyType == "asteroid";
   };

   this.isStar = function()
   {
      return this.bodyType == "star";
   };

   this.isSpherical = function()
   {
      return this.coordinateType == "spherical";
   };

   this.initialize();
   this.load();
}

// ----------------------------------------------------------------------------
// EOF EphemerisEngine.js - Released 2018-12-13T19:24:09Z
