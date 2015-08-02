function OptimizeSplineCoordinates(width, height, ref_A_B, ref_B_A, tolerance)
{
   "use strict";

   this.AddControlPoint = function (pA)
   {
      this.cpA.push(pA);
      this.cpB.push(ref_A_B.Apply(pA));
   };

   var CalculateBlocksError = function (blocks, optimal_A_B)
   {
      var maxErr = 0;
      for (var i = 0; i < blocks.length; i++)
      {
         var block = blocks[i];
         var pA0 = new Point((block.x0 + block.x1) / 2, (block.y0 + block.y1) / 2);
         var pB = optimal_A_B.Apply(pA0);
         var pA1 = ref_B_A.Apply(pB);
         var dx = pA0.x - pA1.x;
         var dy = pA0.y - pA1.y;
         block.err = Math.sqrt(dx * dx + dy * dy);
         if (block.err > maxErr)
            maxErr = block.err;
      }
      return maxErr;
   };

   this.Optimize = function ()
   {
      this.cpA = [];
      this.cpB = [];
      var blocks = [];

      var numX = 10;
      var blockSizeX = width / numX;
      var numY = Math.ceil(height / blockSizeX);
      var blockSizeY = height / numY;
      for (var by = 0; by <= numY; by++){
         for (var bx = 0; bx <= numX; bx++)
         {
            this.AddControlPoint(new Point(bx * blockSizeX, by * blockSizeY));
            if (bx > 0 && by > 0)
               blocks.push({
                  x0: (bx - 1) * blockSizeX,
                  y0: (by - 1) * blockSizeY,
                  x1: bx * blockSizeX,
                  y1: by * blockSizeY});
         }
      }

      var optimal_A_B = new ReferSpline(this.cpA, this.cpB, null, null);
      var maxErr = CalculateBlocksError(blocks, optimal_A_B);

      console.writeln(format("NumCP: %d  MaxErr:%f", this.cpA.length, maxErr));
      var newPoints = true;
      while (newPoints && maxErr > tolerance && this.cpA.length < 2000)
      {
         newPoints = false;
         var newBlocks = [];
         maxErr = 0;
         blocks = blocks.sort(function(b1,b2){return b1.err<b2.err;});
         for (var i = 0; i < blocks.length; i++)
         {
            var block = blocks[i];
            if (i>50 || block.err < tolerance)
               newBlocks.push(block);
            else
            {
               var pA0 = new Point((block.x0 + block.x1) / 2, (block.y0 + block.y1) / 2);
               this.AddControlPoint(pA0);
               newBlocks.push({x0: block.x0, y0: block.y0, x1: pA0.x, y1: pA0.y});
               newBlocks.push({x0: pA0.x, y0: block.y0, x1: block.x1, y1: pA0.y});
               newBlocks.push({x0: block.x0, y0: pA0.y, x1: pA0.x, y1: block.y1});
               newBlocks.push({x0: pA0.x, y0: pA0.y, x1: block.x1, y1: block.y1});
               newPoints = true;
            }
         }
         blocks = newBlocks;
         optimal_A_B = new ReferSpline(this.cpA, this.cpB, null, null);
         maxErr = CalculateBlocksError(blocks, optimal_A_B);
         console.writeln(format("NumCP: %d  MaxErr:%f", this.cpA.length, maxErr));
         console.flush();
         processEvents();
      }
      //for(var i=0; i<this.cpA.length; i++) console.writeln(format("%f;%f",this.cpA[i].x,this.cpA[i].y));

      return {
         ref_A_B: optimal_A_B,
         ref_B_A: new ReferSpline(this.cpB, this.cpA, null, null),
         controlPoints: { pA: this.cpA, pB:this.cpB}
      };
   };
}