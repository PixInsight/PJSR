// *********
// This object has been copied and simplified from the AutoSTF script from Juan Conejero
// *********

function AutoStretch()
{
   // Default STF Parameters
   var SHADOWS_CLIP = -1.25; // Shadows clipping point measured in sigma units from the main histogram peak.
   var TARGET_BKG = 0.25; // Target background in the [0,1] range.

   /*
    * Find a midtones balance value that transforms v1 into v0 through a midtones
    * transfer function (MTF), within the specified tolerance eps.
    */
   this.findMidtonesBalance = function (v0, v1, eps)
   {
      if (v1 <= 0)
         return 0;

      if (v1 >= 1)
         return 1;

      v0 = Math.range(v0, 0.0, 1.0);

      if (eps)
         eps = Math.max(1.0e-15, eps);
      else
         eps = 5.0e-05;

      var m0, m1;
      if (v1 < v0)
      {
         m0 = 0;
         m1 = 0.5;
      }
      else
      {
         m0 = 0.5;
         m1 = 1;
      }

      for (; ;)
      {
         var m = (m0 + m1) / 2;
         var v = Math.mtf(m, v1);

         if (Math.abs(v - v0) < eps)
            return m;

         if (v < v0)
            m1 = m;
         else
            m0 = m;
      }
   }

   this.CalculateStretch = function(view, verbose, shadowsClipping, targetBackground)
   {
      if (shadowsClipping == undefined)
         shadowsClipping = SHADOWS_CLIP;
      if (targetBackground == undefined)
         targetBackground = TARGET_BKG;
      if (verbose == undefined)
         verbose = false;

      view.image.resetSelections();

      // Noninverted image

      var c0 = 0;
      var m = 0;
      view.image.selectedChannel = 0;
      var median = view.image.median();
      var avgDev = view.image.avgDev();
      c0 += median + shadowsClipping * avgDev;
      m += median;
      view.image.resetSelections();
      c0 = Math.range(c0, 0.0, 1.0);
      m = this.findMidtonesBalance(targetBackground, m - c0);

      return {m:m, c0:c0, c1:1};
   }
   /*
    * STF Auto Stretch routine
    */
   this.Apply = function (view, verbose, shadowsClipping, targetBackground)
   {
      var stretch = this.CalculateStretch(view, verbose, shadowsClipping, targetBackground);
      var stf = [
         // m, c0, c1, r0, r1
         [stretch.m, stretch.c0, stretch.c1, 0, 1],
         [stretch.m, stretch.c0, stretch.c1, 0, 1],
         [stretch.m, stretch.c0, stretch.c1, 0, 1],
         [0, 1, 0.5, 0, 1]
      ];

      if (verbose)
      {
         console.writeln("<end><cbr/><br/><b>", view.fullId, "</b>:");
         console.writeln(format("c0 = %.6f", stf[0][1]));
         console.writeln(format("m  = %.6f", stf[0][0]));
         console.writeln(format("c1 = %.6f", stf[0][2]));
         console.writeln("<end><cbr/><br/>");
      }

      view.stf = stf;
   }

   this.HardApply = function(view, verbose, shadowsClipping, targetBackground)
   {
      var stretch =  this.CalculateStretch(view, verbose, shadowsClipping, targetBackground);

      if ( stretch.c0 > 0 || stretch.m != 0.5 || stretch.c1 != 1 ) // if not an identity transformation
      {
         var HT = new HistogramTransformation;
         HT.H = [[  0, 0.5,   1, 0, 1],
            [  0, 0.5,   1, 0, 1],
            [  0, 0.5,   1, 0, 1],
            [stretch.c0, stretch.m, stretch.c1, 0, 1],
            [  0, 0.5,   1, 0, 1]];

         HT.executeOn( view, false ); // no swap file
      }
   }
};