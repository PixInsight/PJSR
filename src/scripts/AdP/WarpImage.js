function WarpImage()
{
   this.suffix = "_warped";
   this.pixelInterpolation = 2;
   this.clampingThreshold = 0.3;

   this.AdaptImageFast = function (metadata0, window1)
   {
      console.writeln("<br><b>Fast image warping</b>");
      var metadata1 = new ImageMetadata();
      metadata1.ExtractMetadata(window1);

      var startTime = (new Date).getTime();

      // Generate control points
      var points = [];
      var cpoints = [];
      var incx = (metadata1.width - 0.1) / Math.min(25, Math.round(metadata1.width / 150));
      var incy = (metadata1.height - 0.1) / Math.min(25, Math.round(metadata1.height / 150));
      for (var y = 0; y < metadata1.height; y += incy)
         for (var x = 0; x < metadata1.width; x += incx)
         {
            var p_px1 = new Point(x, y);
            var p_RD = metadata1.Convert_I_RD(new Point(x + 0.5, y + 0.5));
            var p_px0 = null;
            if(p_RD)
            {
               p_px0 = metadata0.Convert_RD_I(p_RD);
               if(p_px0)
                  p_px0.moveBy(-0.5);
            }
            //console.writeln(format("[%f %f] -> [%f %f]",p_px1.x,p_px1.y,p_px0.x,p_px0.y))
            if (p_px0 && p_px0.x >= 0 && p_px0.x < metadata0.width && p_px0.y >= 0 && p_px0.y < metadata0.height)
            {
               points.push(
                  [true, false, p_px0.x, p_px0.y, 10, p_px1.x, p_px1.y, 10 ]
               );
               cpoints.push(
                  [p_px0.x / metadata0.width, p_px0.y / metadata0.height,
                     (p_px1.x - p_px0.x) / metadata0.width, (p_px1.y - p_px0.y) / metadata0.height]
               );
            }
         }
      console.writeln("Number of control points: ", cpoints.length);

      // Create the DynamicAlignment process
      var srcTmW = new ImageWindow(metadata0.width, metadata0.height, 1, 8, false, false, "___tmp");
      var dynAlign = new DynamicAlignment;
      dynAlign.data = cpoints;
      dynAlign.sourceImageId = srcTmW.mainView.id;
      dynAlign.registeredImageId = "__tmpCoordAlign";
      dynAlign.registeredImageSampleFormat = DynamicAlignment.prototype.SameAsTarget;
      dynAlign.points = points;
      dynAlign.sourceImageWidth = metadata0.width;
      dynAlign.sourceImageHeight = metadata0.height;
      dynAlign.targetImageWidth = metadata1.width;
      dynAlign.targetImageHeight = metadata1.height;

      try
      {
         dynAlign.executeOn(window1.mainView);
         var resWindow = ImageWindow.windowById("__tmpCoordAlign");
         resWindow.mainView.id = window1.mainView.id + this.suffix;

         //this.SetWCSKeywords(resWindow, metadata0);
         metadata0.SaveKeywords(resWindow, true);
         metadata0.SaveProperties(resWindow);


         console.writeln("<up><up><up><up><up><up><up><up></up><clrbol><clrend>Dynamic alignment ok.");
         console.writeln(format("Process time: %.2fs", ((new Date).getTime() - startTime) / 1000));
         return resWindow;
      } finally
      {
         srcTmW.close();
      }
   };

   this.AdaptImageLQ = function (metadata0, window1)
   {
      if(!metadata0.projection)
         throw "The reference image has no coordinates";
      console.writeln("<br><b>Fast image warping</b>");
      var metadata1 = new ImageMetadata();
      metadata1.ExtractMetadata(window1);
      if(!metadata1.projection)
         throw "The target image has no coordinates";

      var bounds = WarpImage.GetPixelBounds(metadata0, metadata1);
      //console.writeln("Image1 bounds: ", bounds);
      bounds = new Rect(Math.floor(bounds.left), Math.floor(bounds.top), Math.ceil(bounds.right), Math.ceil(bounds.bottom));
      //console.writeln("Image1 bounds rounded: ", bounds);
      bounds.intersect(0, 0, metadata0.width, metadata0.height);
      console.writeln(format("Target area: [%d,%d,%d,%d]", bounds.left, bounds.top, bounds.right, bounds.bottom));


      var imageOrg = window1.mainView.image;
      imageOrg.interpolation = this.pixelInterpolation;
      imageOrg.clampingThreshold = this.clampingThreshold;
      var imageRect = new Rect(imageOrg.width, imageOrg.height);

      //for(var k in imageOrg)
      //console.writeln(k,": ",imageOrg[k]);

      var lastProcess = (new Date).getTime();
      var startTime = lastProcess;

      var numChannels = imageOrg.numberOfChannels;

      var values = new Array(numChannels);
      for (var c = 0; c < numChannels; c++)
      {
         //console.writeln(bounds.width, " ", bounds.height);
         values[c] = new Array(bounds.width * bounds.height);
         for (var i = 0; i < values[c].length; i++)
            values[c][i] = 0;
      }


      var numSamples = 25;
      var inc = Math.floor(Math.max(bounds.width, bounds.height) / numSamples);
      var numx = Math.ceil(bounds.width / inc);
      var numy = Math.ceil(bounds.height / inc);
      var resWindow = null;

      try
      {
         for (var by = 0; by < numy; by++)
         {
            for (var bx = 0; bx < numx; bx++)
            {
               var points0 = [];
               var points1 = [];
               for (var yi = -1; yi <= 2; yi++)
               {
                  for (var xi = -1; xi <= 2; xi++)
                  {
                     var p0 = new Point(bounds.left + (bx + xi) * inc + 0.5, bounds.top + (by + yi) * inc + 0.5);
                     var p_RD = metadata0.Convert_I_RD(p0);
                     if (p_RD)
                     {
                        var p1 = metadata1.Convert_RD_I(p_RD);
                        if (p1)
                        {
                           p1.moveBy(-0.5);
                           points0.push(p0);
                           points1.push(p1);
                        }
                     }
                  }
               }

               var ref_0_1 = points0.length == 16 ? new ReferSpline(points0, points1, null, 2, 0) : null;
               var p_px0 = new Point();
               for (var y = 0; y < inc; y++)
               {
                  //resWindow.mainView.beginProcess( UndoFlag_NoSwapFile );
                  p_px0.y = by * inc + y + bounds.top + 0.5;
                  var offset = (by * inc + y) * bounds.width + bx * inc;
                  for (var x = 0; x < inc; x++)
                  {
                     p_px0.x = bx * inc + x + bounds.left + 0.5;
                     var p_px1 = null;
                     if(ref_0_1)
                        p_px1 = ref_0_1.Apply(p_px0);
                     else{
                        var p_RD = metadata0.Convert_I_RD(p_px0);
                        if (p_RD)
                           p_px1 = metadata1.Convert_RD_I(p_RD);
                     }

                     if (p_px1)
                     {
                        p_px1.x-=0.5;
                        p_px1.y-=0.5;
                        if(p_px1.x >= 0 && p_px1.y >= 0 && p_px1.x < metadata1.width && p_px1.y < metadata1.height)
                           for (var c = 0; c < numChannels; c++)
                              values[c][offset] = imageOrg.interpolate(p_px1.x, p_px1.y, c);
                     }
                     offset++;
                  }

               }

               var time = (new Date).getTime();
               if (time - lastProcess > 2000)
               {
                  lastProcess = time;
                  console.write(format("<end><clrbol>Reprojecting image: (%.2f%%)", by * inc / bounds.height * 100));
                  processEvents();
                  if (console.abortRequested)
                     throw "Abort!!";
               }
            }
         }

         console.writeln("<end><clrbol>Reprojecting image: (100%)");

         resWindow = new ImageWindow(metadata0.width, metadata0.height,
            imageOrg.numberOfChannels, imageOrg.bitsPerSample, imageOrg.isReal, imageOrg.isColor,
            window1.mainView.id + this.suffix);
         var resImage = resWindow.mainView.image;
         resWindow.mainView.beginProcess(UndoFlag_NoSwapFile);

         // Copy keywords to target image
         resWindow.keywords = window1.keywords;

         for (var c = 0; c < numChannels; c++)
            resImage.setSamples(values[c], bounds, c);
         metadata0.SaveKeywords(resWindow, false);
         resWindow.mainView.endProcess();
         metadata0.SaveProperties(resWindow);

         console.writeln(format("Process time: %.2fs", ((new Date).getTime() - startTime) / 1000));
         return resWindow;
      } catch (ex)
      {
         console.writeln(ex);
         if(resWindow)
            resWindow.forceClose();
         return null;
      }
   };

   this.AdaptImageHQ = function (metadata0, window1)
   {
      if(!metadata0.projection)
         throw "The reference image has no coordinates";
      console.writeln("<br><b>High quality image warping</b>");
      var metadata1 = new ImageMetadata();
      metadata1.ExtractMetadata(window1);
      if(!metadata1.projection)
         throw "The target image has no coordinates";

      var bounds = WarpImage.GetPixelBounds(metadata0, metadata1);
      //console.writeln("Image1 bounds: ", bounds);
      bounds = new Rect(Math.floor(bounds.left), Math.floor(bounds.top), Math.ceil(bounds.right), Math.ceil(bounds.bottom));
      //console.writeln("Image1 bounds rounded: ", bounds);
      bounds.intersect(0, 0, metadata0.width, metadata0.height);
      console.writeln(format("Target area: [%d,%d,%d,%d]", bounds.left, bounds.top, bounds.right, bounds.bottom));

      var imageOrg = window1.mainView.image;
      imageOrg.interpolation = this.pixelInterpolation;
      imageOrg.clampingThreshold = this.clampingThreshold;
      var imageRect = new Rect(imageOrg.width, imageOrg.height);

      //for(var k in imageOrg)
      //console.writeln(k,": ",imageOrg[k]);

      var lastProcess = (new Date).getTime();
      var startTime = lastProcess;

      var numChannels = imageOrg.numberOfChannels;

      var values = new Array(numChannels);
      for (var c = 0; c < numChannels; c++)
      {
         //console.writeln(bounds.width, " ", bounds.height);
         values[c] = new Array(bounds.width * bounds.height);
         for (var i = 0; i < values[c].length; i++)
            values[c][i] = 0;
      }

      var resWindow = null;
      var p_px0 = new Point(0, 0);
      try
      {
         for (var y = 0; y <= bounds.height; y++)
         {
            //resWindow.mainView.beginProcess( UndoFlag_NoSwapFile );
            p_px0.y = y + bounds.top + 0.5;
            var offset = y * bounds.width;
            for (var x = 0; x <= bounds.width; x++)
            {
               p_px0.x = x + bounds.left + 0.5;
               var p_RD = metadata0.Convert_I_RD(p_px0);
               var p_px1 = null;
               if (p_RD)
               {
                  p_px1 = metadata1.Convert_RD_I(p_RD);
                  if (p_px1){
                     p_px1.x-=0.5;
                     p_px1.y-=0.5;
                     if (p_px1.x >= 0 && p_px1.y >= 0 && p_px1.x < metadata1.width && p_px1.y < metadata1.height)
                        for (var c = 0; c < numChannels; c++)
                           values[c][offset] = imageOrg.interpolate(p_px1.x, p_px1.y, c);
                  }
               }
               offset++;
            }
            var time = (new Date).getTime();
            if (time - lastProcess > 2000)
            {
               lastProcess = time;
               console.write(format("<end><clrbol>Reprojecting image: (%.2f%%)", y / bounds.height * 100));
               processEvents();
               if (console.abortRequested)
                  throw "Abort!!";
            }
         }
         console.writeln("<end><clrbol>Reprojecting image: (100%)");

         resWindow = new ImageWindow(metadata0.width, metadata0.height,
            imageOrg.numberOfChannels, imageOrg.bitsPerSample, imageOrg.isReal, imageOrg.isColor,
            window1.mainView.id + this.suffix);
         var resImage = resWindow.mainView.image;
         resWindow.mainView.beginProcess(UndoFlag_NoSwapFile);

         // Copy keywords to target image
         resWindow.keywords = window1.keywords;

         for (var c = 0; c < numChannels; c++)
            resImage.setSamples(values[c], bounds, c);
         metadata0.SaveKeywords(resWindow, false);
         resWindow.mainView.endProcess();
         metadata0.SaveProperties(resWindow);

         console.writeln(format("Process time: %.2fs", ((new Date).getTime() - startTime) / 1000));
         return resWindow;
      } catch (ex)
      {
         console.writeln(ex);
         if(resWindow)
            resWindow.forceClose();
         return null;
      }
   };
}

// Returns the bounds in pixels of the image of metadata1 after projecting it
// to the geometry of metadata0
WarpImage.GetPixelBounds = function (metadata0, metadata1)
{
   var numx = Math.min(100, metadata1.width);
   var numy = Math.min(100, metadata1.height);
   var bounds = null;
   for (var yi = 0; yi <= numy; yi++)
   {
      var y = yi * metadata1.height / numy;
      for (var xi = 0; xi <= numx; xi++)
      {
         var x = xi * metadata1.width / numx;

         var pRD = metadata1.Convert_I_RD(new Point(x, y));
//if(pRD)console.writeln(pRD.toString());
         var pPx0 = null;
         if (pRD && !isNaN(pRD.x) && !isNaN(pRD.y) )
            pPx0 = metadata0.Convert_RD_I(pRD);
//if(pPx0)console.writeln(pPx0.toString());
         if (pPx0 && !isNaN(pPx0.x) && !isNaN(pPx0.y))
         {
            if (bounds == null)
               bounds = new Rect(pPx0.x, pPx0.y, pPx0.x, pPx0.y);
            else
            {
               bounds.left = Math.min(bounds.left, pPx0.x);
               bounds.top = Math.min(bounds.top, pPx0.y);
               bounds.right = Math.max(bounds.right, pPx0.x);
               bounds.bottom = Math.max(bounds.bottom, pPx0.y);
            }
         }
      }
   }
   return bounds;
};