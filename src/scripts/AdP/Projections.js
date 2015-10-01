/*
 Projections

 Implementation of various projection.

 Copyright (C) 2013, Andres del Pozo
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

#ifndef __ADP_PROJECTIONS_jsh
#define __ADP_PROJECTIONS_jsh

function ProjectionBase()
{
   "use strict";

   this.GetWCS = function ()
   {
      return this.wcs;
   };

   this.InitFromRefpoint = function (lng0, lat0, phip)
   {
      this.wcs = new WCSKeywords();
      this.wcs.ctype1 = "'RA---" + this.projCode + "'";
      this.wcs.ctype2 = "'DEC--" + this.projCode + "'";
      this.wcs.crval1 = lng0;
      this.wcs.crval2 = lat0;
      this.wcs.lonpole = phip;
      this.ra0 = lng0 * Math.PI / 180;
      this.dec0 = lat0 * Math.PI / 180;

      // Set default for native longitude of the celestial pole?
      if (phip == null || phip == 999.0)
      {
         phip = (lat0 < this.theta0) ? 180.0 : 0.0;
         phip += this.phi0;

         if (phip < -180.0)
            phip += 360.0;
         else if (phip > 180.0)
            phip -= 360.0;
      }

      this.sph = new SphericalRotation();
      this.sph.Init(lng0, lat0, this.phi0, this.theta0, phip, null);
   };

   this.InitFromWCS = function (wcs)
   {
      if (wcs.pv1_1 != null)
         this.phi0 = wcs.pv1_1;

      if (wcs.pv1_2 != null)
      {
         this.theta0 = wcs.pv1_2;
         if (Math.abs(this.theta0) > 90.0)
         {
            if (Math.abs(this.theta0) > 90.0 + 1e-5)
               throw "Invalid WCS coordinates: theta0 > 90";
            if (this.theta0 > 90.0)
               this.theta0 = 90.0;
            else
               this.theta0 = -90.0;
         }
      }

      var phip = wcs.lonpole;

      // Set default for native longitude of the celestial pole?
      if (phip === null)
      {
         phip = (wcs.crval2 < this.theta0) ? 180.0 : 0.0;
         phip += this.phi0;

         if (phip < -180.0)
            phip += 360.0;
         else if (phip > 180.0)
            phip -= 360.0;
      }

      this.sph = new SphericalRotation();
      this.sph.Init(wcs.crval1, wcs.crval2, this.phi0, this.theta0, phip, wcs.latpole);
      this.wcs = wcs;
      this.ra0 = wcs.crval1 * Math.PI / 180;
      this.dec0 = wcs.crval2 * Math.PI / 180;
   };

   this.Direct = function (p)
   {
      var np = this.sph.CelestialToNative(p);
      if (np == null)
         return null;
      if (!isFinite(np.x) || !isFinite(np.y))
      {
         //console.writeln("cp:", p.toString());
         return null;
      }
      //console.writeln("Direct np ", np.toString());
      return this.Project(np);
   };

   this.Inverse = function (p)
   {
      var np = this.Unproject(p);
      if (np == null)
         return null;
      if (!isFinite(np.x) || !isFinite(np.y))
      {
         //console.writeln("p:", p.toString());
         return null;
      }
      //console.writeln("Native: ", np.toString());
      return this.sph.NativeToCelestial(np);
   };

   this.CheckBrokenLine = function (cp1, cp2)
   {
      if (!cp1 || !cp2)
         return false;
      var np1 = this.sph.CelestialToNative(cp1);
      var np2 = this.sph.CelestialToNative(cp2);
      var dist = ImageMetadata.DistanceFast(np1,np2);
      return dist<150;
   };
}

function ProjectionZenithalBase()
{
   this.__base__ = ProjectionBase;
   this.phi0 = 0;
   this.theta0 = 90;

   this.Project = function (np)
   {
      var rTheta = this.GetRTheta(np);
      return new Point(rTheta * DMath.sin(np.x), -rTheta * DMath.cos(np.x));
   };

   this.Unproject = function (np)
   {
      var rTheta = Math.sqrt(np.x * np.x + np.y * np.y);
      return new Point(DMath.atan2(np.x, -np.y), this.GetTheta(rTheta));
   };
}
ProjectionZenithalBase.prototype = new ProjectionBase();

function ProjectionZenithalEqualArea()
{
   this.__base__ = ProjectionZenithalBase;
   this.projCode = "ZEA";
   this.name = "Zenithal Equal Area";

   this.GetRTheta = function (np)
   {
      return (360 / Math.PI) * DMath.sin((90 - np.y) / 2);
   };

   this.GetTheta = function (rTheta)
   {
      return 90 - 2 * DMath.asin(Math.PI * rTheta / 360);
   };

   this.CheckBrokenLine = function (cp1, cp2)
   {
      var np1 = this.sph.CelestialToNative(cp1);
      var np2 = this.sph.CelestialToNative(cp2);
      var y = (np1.y + np2.y) / 2;
      var dist = Math.min(Math.abs(np1.x - np2.x - 360) % 360, Math.abs(np1.x - np2.x + 360) % 360);
      return dist < DMath.sin(45 + y / 2) * 180;
   }
}
ProjectionZenithalEqualArea.prototype = new ProjectionZenithalBase();

function ProjectionStereographic()
{
   this.__base__ = ProjectionZenithalBase;
   this.projCode = "STG";
   this.name = "Stereographic";

   this.GetRTheta = function (np)
   {
      return (360 / Math.PI) * DMath.tan((90 - np.y) / 2);
   };

   this.GetTheta = function (rTheta)
   {
      return 90 - 2 * DMath.atan(Math.PI * rTheta / 360);
   };


   this.CheckBrokenLine = function (cp1, cp2)
   {
      return true;
   };
}
ProjectionStereographic.prototype = new ProjectionZenithalBase();

function ProjectionOrthographic()
{
   this.__base__ = ProjectionBase;

   this.phi0 = 0;
   this.theta0 = 90;
   this.r0 = 180 / Math.PI;
   this.x0 = 0.0;
   this.y0 = 0.0;
   this.w = [ 1 / this.r0, 0, 1, -1];

   this.projCode = "SIN";
   this.name = "Orthographic";

   this.CheckBrokenLine = function (cp1, cp2)
   {
      if (!cp1 || !cp2)
         return false;
      var np1 = this.sph.CelestialToNative(cp1);
      var np2 = this.sph.CelestialToNative(cp2);
      var dist = ImageMetadata.DistanceFast(np1,np2);
      return dist<150;
   };

   this.Project = function (np) // Native to projection plane
   {
      if (np.y < 0 || np.y > 180)
         return null;
      var sinphi = DMath.sin(np.x);
      var cosphi = DMath.cos(np.x);
      var res = new Point();
      res.x = sinphi;
      res.y = cosphi;
      var t = (90 - Math.abs(np.y)) * Math.PI / 180;
      var z, costhe;
      if (t < 1.0e-5)
      {
         if (np.y > 0.0)
            z = t * t / 2.0;
         else
            z = 2.0 - t * t / 2.0;
         costhe = t;
      }
      else
      {
         z = 1.0 - DMath.sin(np.y);
         costhe = DMath.cos(np.y);
      }
      var r = this.r0 * costhe;
      if (this.w[1] === 0)
      {
         res.x = r * res.x - this.x0;
         res.y = -r * res.y - this.y0;
         return res;
      }
      else
         throw "Unsupported Slant Orthographic projection";
   };


   this.Unproject = function (p)
   {
      var x0 = this.w[0] * (p.x + this.x0);
      var y0 = (p.y + this.y0) * this.w[0];
      var y02 = y0 * y0;
      var r2 = x0 * x0 + y02;
      if (this.w[1] === 0)
      {
         var res = new Point();
         if (r2 != 0)
            res.x = DMath.atan2(x0, -y0);
         else
            res.x = 0;
         if (r2 < 0.5)
            res.y = DMath.acos(Math.sqrt(r2));
         else if (r2 <= 1)
            res.y = DMath.asin(Math.sqrt(1 - r2));
         return res;
      }
      else
         throw "Unsupported Slant Orthographic projection";
   };
}

ProjectionOrthographic.prototype = new ProjectionBase();

function ProjectionMercator()
{
   this.__base__ = ProjectionBase;

   this.phi0 = 0;
   this.theta0 = 0;
   this.r0 = 180 / Math.PI;
   this.w = [1.0, 1.0];
   this.x0 = 0.0;
   this.y0 = 0.0;

   this.projCode = "MER";
   this.name = "Mercator";

   this.Project = function (np) // Native to projection plane
   {
      return new Point(np.x - this.x0, this.r0 * Math.log(DMath.tan((np.y + 90) / 2)) - this.y0);
   };


   this.Unproject = function (p)
   {
      var theta = 2 * DMath.atan(Math.exp((p.y + this.y0) / this.r0)) - 90;
      return new Point(p.x + this.x0, theta);
   };
}

ProjectionMercator.prototype = new ProjectionBase();

function ProjectionPlateCarree()
{
   this.__base__ = ProjectionBase;

   this.phi0 = 0;
   this.theta0 = 0;

   this.projCode = "CAR";
   this.name = "Plate-Carree";

   this.Project = function (np) // Native to projection plane
   {
      return new Point(np.x, np.y);
   };

   this.Unproject = function (p)
   {
      return new Point(p.x, p.y);
   };
}

ProjectionPlateCarree.prototype = new ProjectionBase();

function ProjectionHammerAitoff()
{
   this.__base__ = ProjectionBase;

   this.phi0 = 0;
   this.theta0 = 0;
   this.Zmin = 1/Math.sqrt(2);

   this.projCode = "AIT";
   this.name = "Hammer-Aitoff";

   this.Project = function (np) // Native to projection plane
   {
      var cosTheta = DMath.cos(np.y);
      var gamma = 180 / Math.PI * Math.sqrt(2 / (1 + cosTheta * DMath.cos(np.x / 2)));
      return new Point(2 * gamma * cosTheta * DMath.sin(np.x / 2), gamma * DMath.sin(np.y));
   };


   this.Unproject = function (p)
   {
      var X = Math.PI * p.x / 720;
      var Y = Math.PI * p.y / 360;
      var Z = Math.sqrt(1 - X * X - Y * Y);
      if(Z<this.Zmin) return null;
      return new Point(2 * DMath.atan2(2 * Z * X, 2 * Z * Z - 1), DMath.asin(Math.PI * p.y * Z / 180));
   };
}

ProjectionHammerAitoff.prototype = new ProjectionBase();

// ******************************************************************
// Gnomonic: Gnomonic projection
// ******************************************************************
function Gnomonic(scale, ra0, dec0)
{
   this.__base__ = ProjectionBase;

   this.scale = scale;
   this.ra0 = ra0 * Math.PI / 180;
   this.dec0 = dec0 * Math.PI / 180;
   this.projCode = "TAN";
   this.name = "Gnomonic";

   this.sinDec0 = Math.sin(this.dec0);
   this.cosDec0 = Math.cos(this.dec0);

   this.GetWCS = function ()
   {
      var wcs = new WCSKeywords();
      wcs.ctype1 = "'RA---TAN'";
      wcs.ctype2 = "'DEC--TAN'";
      wcs.crval1 = this.ra0 * 180 / Math.PI;
      wcs.crval2 = this.dec0 * 180 / Math.PI;

      return wcs;
   }

   this.Direct = function (p)
   {
      var ra = p.x * Math.PI / 180;
      var dec = p.y * Math.PI / 180;
      var sinDec = Math.sin(dec);
      var cosDec = Math.cos(dec);
      var cosRa = Math.cos(ra - this.ra0);

      // Coordinate validation
      if (this.ra0 - ra > Math.PI)
         ra += Math.PI * 2;
      else if (this.ra0 - ra < -Math.PI)
         ra -= Math.PI * 2;
      var dist = Math.acos(this.sinDec0 * sinDec + this.cosDec0 * cosDec * cosRa);
      if (dist > Math.PI / 2)
         return null;

      var A = cosDec * cosRa;
      var F = scale / ( this.sinDec0 * sinDec + A * this.cosDec0 );
      return new Point(F * cosDec * Math.sin(ra - this.ra0),
         F * (this.cosDec0 * sinDec - A * this.sinDec0));
   };

   this.Inverse = function (p)
   {
      var X = -p.x / this.scale;
      var Y = -p.y / this.scale;
      var D = Math.atan(Math.sqrt(X * X + Y * Y));
      var B = Math.atan2(-X, Y);
      var sinD = Math.sin(D);
      var cosD = Math.cos(D);
      var cosB = Math.cos(B);
      var XX = this.sinDec0 * sinD * cosB + this.cosDec0 * cosD;
      var YY = sinD * Math.sin(B);
      var ra = this.ra0 + Math.atan2(YY, XX);
      var dec = Math.asin(this.sinDec0 * cosD - this.cosDec0 * sinD * cosB);
      return new Point(ra * 180 / Math.PI, dec * 180 / Math.PI);
   };

   this.CheckBrokenLine = function (cp1, cp2)
   {
      //return true;
      //return ImageMetadata.Distance(cp1,cp2)<20;
      var gp1=this.Direct(cp1);
      if(!gp1) return false;
      var gp2=this.Direct(cp2);
      if(!gp2) return false;
      return (gp1.x-gp2.x)*(gp1.x-gp2.x)+(gp1.y-gp2.y)*(gp1.y-gp2.y)<45*45;
   }

}

Gnomonic.prototype = new ProjectionBase();

// ******************************************************************
// CLASS SphericalRotation
// ******************************************************************
function SphericalRotation()
{
   var tol = 1e-5;

   this.Init = function (lng0, lat0, phi0, theta0, phip, latpole)
   {
      var latpreq = 0;
      var lngp = null;
      var latp = latpole == null ? 90 : latpole;
      if (theta0 == 90.0)
      {
         // Fiducial point at the native pole.
         lngp = lng0;
         latp = lat0;
      }
      else
      {
         // Fiducial point away from the native pole.
         var slat0 = DMath.sin(lat0);
         var clat0 = DMath.cos(lat0);
         var sthe0 = DMath.sin(theta0);
         var cthe0 = DMath.cos(theta0);

         var sphip, cphip;
         var u, v;
         if (phip == phi0)
         {
            sphip = 0.0;
            cphip = 1.0;

            u = theta0;
            v = 90.0 - lat0;
         }
         else
         {
            sphip = DMath.sin(phip - phi0);
            cphip = DMath.cos(phip - phi0);

            var x = cthe0 * cphip;
            var y = sthe0;
            var z = Math.sqrt(x * x + y * y);
            if (z == 0.0)
            {
               if (slat0 != 0.0)
                  throw "Invalid WCS coordinates"; // nlat0 == 0 is required for |phip - phi0| = 90 and theta0 == 0

               // latp determined solely by LATPOLEa in this case.
               latpreq = 2;
               if (latp > 90.0)
                  latp = 90.0;
               else if (latp < -90.0)
                  latp = -90.0;
            }
            else
            {
               var slz = slat0 / z;
               if (Math.abs(slz) > 1.0)
               {
                  if ((Math.abs(slz) - 1.0) < 1e-5)
                  {
                     if (slz > 0.0)
                        slz = 1.0;
                     else
                        slz = -1.0;
                  }
                  else
                     throw format("Invalid WCS coordinates"); // |lat0| <= DMath.asin(z) is required  for these values of phip, phi0, and theta0"
               }

               u = DMath.atan2(y, x);
               v = DMath.acos(slz);
            }
         }

         if (latpreq == 0)
         {
            var latp1 = u + v;
            if (latp1 > 180.0)
               latp1 -= 360.0;
            else if (latp1 < -180.0)
               latp1 += 360.0;

            var latp2 = u - v;
            if (latp2 > 180.0)
               latp2 -= 360.0;
            else if (latp2 < -180.0)
               latp2 += 360.0;

            if (Math.abs(latp1) < 90.0 + 1e-5 &&
               Math.abs(latp2) < 90.0 + 1e-5)
            // There are two valid solutions for latp.
               latpreq = 1;

            if (Math.abs(latp - latp1) < Math.abs(latp - latp2))
            {
               if (Math.abs(latp1) < 90.0 + 1e-5)
                  latp = latp1;
               else
                  latp = latp2;
            }
            else
            {
               if (Math.abs(latp2) < 90.0 + 1e-5)
                  latp = latp2;
               else
                  latp = latp1;
            }

            // Account for rounding error.
            if (Math.abs(latp) < 90.0 + 1e-5)
            {
               if (latp > 90.0)
                  latp = 90.0;
               else if (latp < -90.0)
                  latp = -90.0;
            }
         }

         var z = DMath.cos(latp) * clat0;
         if (Math.abs(z) < 1e-5)
         {
            if (Math.abs(clat0) < 1e-5) // Celestial pole at the fiducial point.
               lngp = lng0;
            else if (latp > 0.0) // Celestial north pole at the native pole.
               lngp = lng0 + phip - phi0 - 180.0;
            else // Celestial south pole at the native pole.
               lngp = lng0 - phip + phi0;
         }
         else
         {
            var x = (sthe0 - DMath.sin(latp) * slat0) / z;
            var y = sphip * cthe0 / clat0;
            if (x == 0.0 && y == 0.0)// Sanity check (shouldn't be possible).
               throw "Invalid WCS coordinates: internal error";
            lngp = lng0 - DMath.atan2(y, x);
         }

         // Make celestial longitude of the native pole the same sign as at the fiducial point.
         if (lng0 >= 0.0)
         {
            if (lngp < 0.0)
               lngp += 360.0;
            else if (lngp > 360.0)
               lngp -= 360.0;
         }
         else
         {
            if (lngp > 0.0)
               lngp -= 360.0;
            else if (lngp < -360.0)
               lngp += 360.0;
         }
      }

      this.latpole = latp;
      this.alphaP = lngp;
      this.deltaP = 90 - latp;
      this.phiP = phip;
      this.cosdeltaP = DMath.cos(this.deltaP);
      this.sindeltaP = DMath.sin(this.deltaP);
   }

   var Adjust360 = function (x, min, max)
   {
      while (x >= max) x -= 360;
      while (x < min) x += 360;
      return x;
   };

   this.NativeToCelestial = function (np)
   {
      var cp = new Point();
      if (this.sindeltaP === 0.0)
      {
         if (this.deltaP === 0.0)
         {
            var dlng = Adjust360(this.alphaP + 180.0 - this.phiP, 0, 360);
            cp.x = np.x + dlng;
            cp.y = np.y;
         }
         else
         {
            var dlng = Adjust360(this.alphaP + this.phiP, 0, 360);
            cp.x = dlng - np.x;
            cp.y = -np.y;
         }
      }
      else
      {
         cp.x = np.x - this.phiP;

         var sinthe = DMath.sin(np.y);
         var costhe = DMath.cos(np.y);
         var costhe3 = costhe * this.cosdeltaP;

         var dphi = cp.x;
         var cosphi = DMath.cos(dphi);

         // Compute the celestial longitude.
         var x = sinthe * this.sindeltaP - costhe3 * cosphi;
         if (Math.abs(x) < tol)
         {
            // Rearrange formula to reduce roundoff errors.
            x = -DMath.cos(np.y + this.deltaP) + costhe3 * (1.0 - cosphi);
         }

         var y = -costhe * DMath.sin(dphi);
         var dlng;
         if (Math.abs(x) > tol || Math.abs(y) > tol)
         {
            dlng = DMath.atan2(y, x);
         }
         else
         {
            // Change of origin of longitude.
            if (this.deltaP < 90.0)
            {
               dlng = dphi + 180.0;
            }
            else
            {
               dlng = -dphi;
            }
         }
         cp.x = this.alphaP + dlng;

         // Compute the celestial latitude.
         if ((dphi % 180.0) == 0.0)
         {
            cp.y = np.y + cosphi * this.deltaP;
            if (cp.y > 90.0) cp.y = 180.0 - cp.y;
            if (cp.y < -90.0) cp.y = -180.0 - cp.y;
         }
         else
         {
            var z = sinthe * this.cosdeltaP + costhe * this.sindeltaP * cosphi;
            if (Math.abs(z) > 0.99)
            {
               // Use an alternative formula for greater accuracy.
               cp.y = DMath.acos(Math.sqrt(x * x + y * y));
               if (cp.y * z < 0)
                  cp.y *= -1;
            }
            else
               cp.y = DMath.asin(z);
         }
      }

      // Normalize the celestial longitude.
      if (this.alphaP >= 0.0)
      {
         if (cp.x < 0.0) cp.x += 360.0;
      }
      else
      {
         if (cp.x > 0.0) cp.x -= 360.0;
      }
      cp.x = Adjust360(cp.x, -360, 360);

      return cp;
   };

   this.CelestialToNative = function (cp)
   {
      // Check for a simple change in origin of longitude.
      var np = new Point();
      var dphi;
      if (this.sindeltaP === 0)
      {
         if (this.deltaP === 0.0)
         {
            dphi = Adjust360(this.phiP - 180.0 - this.alphaP, 0, 360.0);
            np.x = Adjust360(cp.x + dphi, -180, 180.0);
            np.y = cp.y;
         }
         else
         {
            dphi = Adjust360(this.phiP + this.alphaP, 0, 360);
            np.x = Adjust360(dphi - cp.x, -180, 180.0);
            np.y = -cp.y;
         }
      }
      else
      {
         np.x = cp.x - this.alphaP;

         var sinlat = DMath.sin(cp.y);
         var coslat = DMath.cos(cp.y);
         var coslat3 = coslat * this.cosdeltaP;

         var dlng = np.x;
         var coslng = DMath.cos(dlng);

         // Compute the native longitude.
         var x = sinlat * this.sindeltaP - coslat3 * coslng;
         if (Math.abs(x) < tol)
         {
            // Rearrange formula to reduce roundoff errors.
            x = -DMath.cos(cp.y + this.deltaP) + coslat3 * (1.0 - coslng);
         }

         var y = -coslat * DMath.sin(dlng);
         if (x != 0.0 || y != 0.0)
            dphi = DMath.atan2(y, x);
         else
            dphi = (this.deltaP < 90.0) ? dlng - 180.0 : -dlng;
         np.x = Adjust360(this.phiP + dphi, -180, 180.0);


         // Compute the native latitude.
         if ((dlng % 180.0) == 0.0)
         {
            np.y = cp.y + coslng * this.deltaP;
            if (np.y > 90.0) np.y = 180.0 - np.y;
            if (np.y < -90.0) np.y = -180.0 - np.y;
         }
         else
         {
            var z = sinlat * this.cosdeltaP + coslat * this.sindeltaP * coslng;
            if (Math.abs(z) > 0.99)
            {
               // Use an alternative formula for greater accuracy.
               np.y = DMath.acos(Math.sqrt(x * x + y * y));
               if (np.y * z < 0)
                  np.y *= -1;
            }
            else
               np.y = DMath.asin(z);
         }
      }

      return np;
   };
}

function ProjectionFactory(configObject, ra, dec)
{
   var orgRA = configObject.projectionOriginMode == 1 ? configObject.projectionOriginRA : ra;
   var orgDec = configObject.projectionOriginMode == 1 ? configObject.projectionOriginDec : dec;
   var projection = null;
   switch (configObject.projection)
   {
   case 0:
   case 'TAN':
      projection = new Gnomonic(180 / Math.PI, orgRA, orgDec);
      break;
   case 1: // stereographic
   case 'STG':
      projection = new ProjectionStereographic();
      projection.InitFromRefpoint(orgRA, orgDec);
      break;
   case 2: // plate-carree
   case 'CAR':
      projection = new ProjectionPlateCarree();
      projection.InitFromRefpoint(orgRA, orgDec);
      break;
   case 3: // mercator
   case 'MER':
      projection = new ProjectionMercator();
      projection.InitFromRefpoint(orgRA, orgDec);
      break;
   case 4: // HammerAitoff
   case 'AIT':
      projection = new ProjectionHammerAitoff();
      projection.InitFromRefpoint(orgRA, orgDec);
      break;
   case 5: // zenithal equal area
   case 'ZEA':
      projection = new ProjectionZenithalEqualArea();
      projection.InitFromRefpoint(orgRA, orgDec);
      break;
   case 6: // orthographic
   case 'SIN':
      projection = new ProjectionOrthographic();
      projection.InitFromRefpoint(orgRA, orgDec);
      break;
   default:
      throw "Invalid projection code";
   }
   return projection;
}

// ******************************************************************
// ConfigProjectionDialog: Online search of coordinates
// ******************************************************************
function ConfigProjectionDialog(object, projection)
{
   this.__base__ = Dialog;
   this.__base__();

   this.restyle();
   this.labelWidth = this.font.width("Right Ascension (hms):M");

   this.projectionOriginMode = object.projectionOriginMode;

   // ORIGIN
   this.origin_Group = new GroupBox(this);
   this.origin_Group.title = "Projection Origin:";
   this.origin_Group.sizer = new VerticalSizer;
   this.origin_Group.sizer.margin = 8;
   this.origin_Group.sizer.spacing = 6;

   this.originImage_Radio = new RadioButton(this);
   this.originImage_Radio.text = "Use the center of the image as the origin of the projection";
   this.originImage_Radio.checked = this.projectionOriginMode != 1;
   //this.originImage_Radio.toolTip = "<p></p>";
   this.originImage_Radio.onCheck = function (value)
   {
      this.dialog.projectionOriginMode = 0;
      this.dialog.EnableOriginControls();
   }
   this.origin_Group.sizer.add(this.originImage_Radio);

   this.EnableOriginControls = function ()
   {
      this.originCoords_Editor.enabled = this.projectionOriginMode == 1;
   }

   this.originCoords_Radio = new RadioButton(this);
   this.originCoords_Radio.text = "Use the following coordinates as the origin of the projection";
   this.originCoords_Radio.checked = this.projectionOriginMode == 1;
   //this.originCoords_Radio.toolTip = "<p></p>";
   this.originCoords_Radio.onCheck = function (value)
   {
      this.dialog.projectionOriginMode = 1;
      this.dialog.EnableOriginControls();
   }
   this.origin_Group.sizer.add(this.originCoords_Radio);

   var originCoords = null;
   if (object.projectionOriginRA != null && object.projectionOriginDec != null)
      originCoords = new Point(object.projectionOriginRA, object.projectionOriginDec);
   this.originCoords_Editor = new CoordinatesEditor(this, originCoords, this.labelWidth, null, "Coordinates of the origin of the projection");
   this.origin_Group.sizer.add(this.originCoords_Editor);


   this.EnableOriginControls();

   // Common Buttons
   this.ok_Button = new PushButton(this);
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function ()
   {
      object.projectionOriginMode = this.dialog.projectionOriginMode;
      var coords = this.dialog.originCoords_Editor.GetCoords();
      object.projectionOriginRA = coords.x;
      object.projectionOriginDec = coords.y;
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
   this.sizer.spacing = 8;
   //this.sizer.add(this.helpLabel);
   this.sizer.add(this.origin_Group);
   this.sizer.add(this.buttons_Sizer);

   this.windowTitle = "Projection configuration";
   this.adjustToContents();
   //this.setFixedSize();
}

ConfigProjectionDialog.prototype = new Dialog();

#endif