/*
 Photometric catalogs

 This file is part of the Photometry script

 Copyright (C) 2013-2014, Andres del Pozo, Vicent Peris
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

// ******************************************************************
// III_126_Catalog
// ******************************************************************
function III_126_Catalog()
{
   this.name = "III/126 Burnashev";
   this.description = "Spectrophotometry of 1588 stars";

   this.__base__ = VizierCatalog;
   this.__base__(this.name);

   this.catalogMagnitude = 7;

   this.fields = [ "Name", "Coordinates", "Vmag1", "Vmag2", "Vmag3", "SpType1", "SpType2", "SpType3" ];

   this.properties.push(["magMin", DataType_Double]);
   this.properties.push(["magMax", DataType_Double]);
   this.properties.push(["magnitudeFilter", DataType_UCString ]);

   this.filters = [ "Vmag1", "Vmag2", "Vmag3" ];
   this.magnitudeFilter = "Vmag1";

   this.GetConstructor = function ()
   {
      return "new III_126_Catalog()";
   }

   this.UrlBuilder = function(center, fov, mirrorServer)
   {
      var url = mirrorServer + "viz-bin/asu-tsv?-source=III/126/stars III/126/part1 III/126/part2 III/126/part3&" +
         "-joincol=III/126/stars.Name&-joincol=Name&-c=" +
         format("%f %f",center.x, center.y) +
         "&-c.r=" + format("%f",fov) +
         "&-c.u=deg&-out.form=|" +
         //"&-out=Name&-out=RA2000&-out=DE2000" +
         "&-out.add=_RAJ,_DEJ" +
         "&-out=Name&-out=Vmag&-out=SpType" +
         this.CreateMagFilter(this.magnitudeFilter, this.magMin, this.magMax);
      return url;
   }

   this.ParseRecord = function (tokens, epoch)
   {
      if (tokens.length >= 2 && parseFloat(tokens[0]) > 0)
      {
         var x = parseFloat(tokens[1]);
         var y = parseFloat(tokens[0]);
         if (!(x >= 0 && x <= 360 && y >= -90 && y <= 90))
            return null;

         var record = new CatalogRecord(new Point(x, y), 0, tokens[2].trim());
         record["Name"] = tokens[2].trim();
         record["Vmag1"] = tokens[4].trim();
         record["Vmag2"] = tokens[6].trim();
         record["Vmag3"] = tokens[8].trim();
         record["SpType1"] = tokens[5].trim();
         record["SpType2"] = tokens[7].trim();
         record["SpType3"] = tokens[9].trim();
         record.magnitude = parseFloat(record[this.magnitudeFilter]);
         return record;
      }
      else
         return null;
   };

   this.PostProcessObjects = function (objects)
   {
      // Remove the objects with the same name
      var prev = null;
      for (var i = 0; i < objects.length; i++)
      {
         if (objects[i] == null)
            continue;
         for (var j = i + 1; j < objects.length; j++)
         {
            if (objects[j] == null)
               continue;
            if (objects[i].name == objects[j].name)
               objects[j] = null;
         }
      }
   };

}

III_126_Catalog.prototype = new VizierCatalog;
__catalogRegister__.Register(new III_126_Catalog);

// ******************************************************************
// II_183A_Catalog
// ******************************************************************
function II_183A_Catalog()
{
   this.name = "II/183A Landolt";
   this.description = "UBVRI Photometric Standard Stars (526 stars)";

   this.__base__ = VizierCatalog;
   this.__base__(this.name);

   this.catalogMagnitude = 16;

   this.fields = [ "Name", "Coordinates", "Vmag", "B-V", "U-B", "V-R", "R-I", "V-I", "B", "U", "R", "I" ];

   this.properties.push(["magMin", DataType_Double]);
   this.properties.push(["magMax", DataType_Double]);
   this.properties.push(["magnitudeFilter", DataType_UCString ]);

   this.filters = [ "Vmag", "B", "U", "R", "I" ];
   this.magnitudeFilter = "Vmag";

   this.GetConstructor = function ()
   {
      return "new II_183A_Catalog()";
   }

   this.UrlBuilder = function(center, fov, mirrorServer)
   {
      var url = mirrorServer + "viz-bin/asu-tsv?-source=II/183A/table2&-c=" +
         format("%f %f",center.x, center.y) +
         "&-c.r=" + format("%f",fov) +
         "&-c.u=deg&-out.form=|" +
         "&-out=SimbadName&-out.add=_RAJ,_DEJ&-out=Vmag&-out=B-V&-out=U-B&-out=V-R&-out=R-I&-out=V-I" +
         this.CreateMagFilter(this.magnitudeFilter, this.magMin, this.magMax);
      return url;
   }

   this.ParseRecord = function (tokens, epoch)
   {
      if (tokens.length >= 2 && parseFloat(tokens[0]) > 0)
      {
         var x = parseFloat(tokens[0]);
         var y = parseFloat(tokens[1]);
         if (!(x >= 0 && x <= 360 && y >= -90 && y <= 90))
            return null;

         var record = new CatalogRecord(new Point(x, y), 0, tokens[2].trim());
         record["Name"] = tokens[2].trim();
         record["Vmag"] = tokens[3].trim();
         record["B-V"] = tokens[4].trim();
         record["U-B"] = tokens[5].trim();
         record["V-R"] = tokens[6].trim();
         record["R-I"] = tokens[7].trim();
         record["V-I"] = tokens[8].trim();
         // B, U, R and I magnitudes implemetation by Colin McGill
         record["B"] = record["B-V"] * 1.0 + record["Vmag"] * 1.0;
         record["U"] = record["U-B"] * 1.0 + record["B"] * 1.0;
         record["R"] = - record["V-R"] * 1.0 + record["Vmag"] * 1.0;
         record["I"] = - record["V-I"] * 1.0 + record["Vmag"] * 1.0;
         record.magnitude = parseFloat(record[this.magnitudeFilter]);
         return record;
      }
      else
         return null;
   }
}

II_183A_Catalog.prototype = new VizierCatalog;
__catalogRegister__.Register(new II_183A_Catalog);

// ******************************************************************
// III_201_Catalog
// ******************************************************************
function III_201_Catalog()
{
   this.name = "III/201 Pulkovo";
   this.description = "Pulkovo Spectrophotometric Catalog (Alekseeva+ 609 stars)";

   this.__base__ = VizierCatalog;
   this.__base__(this.name);

   this.catalogMagnitude = 7;

   this.fields = [ "Name", "Coordinates", "Vmag", "B-V", "SpType", "HD" ];

   this.properties.push(["magMin", DataType_Double]);
   this.properties.push(["magMax", DataType_Double]);
   this.properties.push(["magnitudeFilter", DataType_UCString ]);

   this.filters = [ "Vmag" ];
   this.magnitudeFilter = "Vmag";

   this.GetConstructor = function ()
   {
      return "new III_201_Catalog()";
   }

   this.UrlBuilder = function(center, fov, mirrorServer)
   {
      var url = mirrorServer + "viz-bin/asu-tsv?-source=III/201/stars&-c=" +
         format("%f %f",center.x, center.y) +
         "&-c.r=" + format("%f",fov) +
         "&-c.u=deg&-out.form=|" +
         "&-out.add=_RAJ,_DEJ&-out=Vmag&-out=B-V&-out=SpType&-out=HR&-out=HD" +
         this.CreateMagFilter(this.magnitudeFilter, this.magMin, this.magMax);
      return url;
   }

   this.ParseRecord = function (tokens, epoch)
   {
      if (tokens.length >= 2 && parseFloat(tokens[0]) > 0)
      {
         var x = parseFloat(tokens[0]);
         var y = parseFloat(tokens[1]);
         if (!(x >= 0 && x <= 360 && y >= -90 && y <= 90))
            return null;

         var record = new CatalogRecord(new Point(x, y), 0, "HR" + tokens[5].trim());
         record["Name"] = "HR" + tokens[5].trim();
         record["Vmag"] = tokens[2].trim();
         record["B-V"] = tokens[3].trim();
         record["SpType"] = tokens[4].trim();
         record["HD"] = "HD" + tokens[6].trim();
         record.magnitude = parseFloat(record[this.magnitudeFilter]);
         return record;
      }
      else
         return null;
   }
}

III_201_Catalog.prototype = new VizierCatalog;
__catalogRegister__.Register(new III_201_Catalog);

// ******************************************************************
// III_202_Catalog
// ******************************************************************
function III_202_Catalog()
{
   this.name = "III/202 Kharitonov";
   this.description = "Spectrophotometric Catalogue of Stars (1147 stars)";

   this.__base__ = VizierCatalog;
   this.__base__(this.name);

   this.catalogMagnitude = 10;

   this.fields = [ "Name", "Coordinates", "Vmag", "Sp", "HR" ];

   this.properties.push(["magMin", DataType_Double]);
   this.properties.push(["magMax", DataType_Double]);
   this.properties.push(["magnitudeFilter", DataType_UCString ]);

   this.filters = [ "Vmag" ];
   this.magnitudeFilter = "Vmag";

   this.GetConstructor = function ()
   {
      return "new III_202_Catalog()";
   }

   this.UrlBuilder = function(center, fov, mirrorServer)
   {
      var url = mirrorServer + "viz-bin/asu-tsv?-source=III/202/catalog&-c=" +
         format("%f %f",center.x, center.y) +
         "&-c.r=" + format("%f",fov) +
         "&-c.u=deg&-out.form=|" +
         "&-out.add=_RAJ,_DEJ&-out=Vmag&-out=Sp&-out=HD&-out=HR" +
         this.CreateMagFilter(this.magnitudeFilter, this.magMin, this.magMax);
      return url;
   }

   this.ParseRecord = function (tokens, epoch)
   {
      if (tokens.length >= 2 && parseFloat(tokens[0]) > 0)
      {
         var x = parseFloat(tokens[0]);
         var y = parseFloat(tokens[1]);
         if (!(x >= 0 && x <= 360 && y >= -90 && y <= 90))
            return null;

         var record = new CatalogRecord(new Point(x, y), 0, "HD" + tokens[4].trim());
         record["Name"] = "HD" + tokens[4].trim();
         record["Vmag"] = tokens[2].trim();
         record["Sp"] = tokens[3].trim();
         record["HR"] = "HR" + tokens[5].trim();
         record.magnitude = parseFloat(record[this.magnitudeFilter]);
         return record;
      }
      else
         return null;
   }
}

III_202_Catalog.prototype = new VizierCatalog;
__catalogRegister__.Register(new III_202_Catalog);

// ******************************************************************
// J/A+AS/92/1 Catalog
// ******************************************************************
function JA_AS_92_1_Catalog()
{
   this.name = "J/A+AS/92/1 Glushneva+";
   this.description = "Spectrophotometric Catalogue of Stars (238 stars)";

   this.__base__ = VizierCatalog;
   this.__base__(this.name);

   this.catalogMagnitude = 7;

   this.fields = [ "Name", "Coordinates", "Vmag", "Bmag", "SpType" ];

   this.properties.push(["magMin", DataType_Double]);
   this.properties.push(["magMax", DataType_Double]);
   this.properties.push(["magnitudeFilter", DataType_UCString ]);

   this.filters = [ "Vmag", "Bmag" ];
   this.magnitudeFilter = "Vmag";

   this.GetConstructor = function ()
   {
      return "new JA_AS_92_1_Catalog()";
   }

   this.UrlBuilder = function(center, fov, mirrorServer)
   {
      var url = mirrorServer + "viz-bin/asu-tsv?-source=J/A+AS/92/1/stars&-c=" +
         format("%f %f",center.x, center.y) +
         "&-c.r=" + format("%f",fov) +
         "&-c.u=deg&-out.form=|" +
         "&-out.add=_RAJ,_DEJ&-out=HR&-out=Vmag&-out=Bmag&-out=SpType" +
         this.CreateMagFilter(this.magnitudeFilter, this.magMin, this.magMax);
      return url;
   }

   this.ParseRecord = function (tokens, epoch)
   {
      if (tokens.length >= 2 && parseFloat(tokens[0]) > 0)
      {
         var x = parseFloat(tokens[0]);
         var y = parseFloat(tokens[1]);
         if (!(x >= 0 && x <= 360 && y >= -90 && y <= 90))
            return null;

         var record = new CatalogRecord(new Point(x, y), 0, "HR" + tokens[2].trim());
         record["Name"] = "HR" + tokens[2].trim();
         record["Vmag"] = tokens[3].trim();
         record["Bmag"] = tokens[4].trim();
         record["SpType"] = tokens[5].trim();
         record.magnitude = parseFloat(record[this.magnitudeFilter]);
         return record;
      }
      else
         return null;
   }
}

JA_AS_92_1_Catalog.prototype = new VizierCatalog;
__catalogRegister__.Register(new JA_AS_92_1_Catalog);
