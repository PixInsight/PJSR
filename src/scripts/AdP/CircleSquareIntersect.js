/*
 Circle Square Intersection Area Calculator

 This file is part of the Photometry script

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

function CircleSquareIntersection(center, radius)
{
   this.radius2 = radius*radius;

   this.sqOrg = null;
   this.sqSize = null;

   this.ApertureArea = function()
   {
      return radius * radius * Math.PI;
   }

   this.ApertureRect = function()
   {
      return new Rect(center.x - radius, center.y - radius, center.x + radius, center.y + radius);
   }


   this.CheckPointInCircle=function(p)
   {
      return p.x * p.x + p.y * p.y < this.radius2;
   };

   this.SegmentAreaBy_angle = function (angle)
   {
      return this.radius2/2*(angle-Math.sin(angle));
   };

   this.SegmentAreaBy_h = function (h)
   {
      var angle=2*Math.acos(1-h/radius);
      //console.writeln(format("h:%f angle:%f",h,angle));
      return this.SegmentAreaBy_angle(angle);
   };

   this.TriangleArea = function (p1, p2, p3)
   {
      return 0.5*((p1.x-p3.x)*(p2.y-p1.y)-(p1.x-p2.x)*(p3.y-p1.y));
   }

   this.ProcessCase0 = function ()
   {
      // Test intersection
      if(this.sqOrg.y<=0 && this.sqOrg.y+this.sqSize>=0)
      {
         // To the right
         if(this.sqOrg.x<radius && this.sqOrg.x+this.sqSize>radius)
         {
            //console.writeln("A",radius-this.sqOrg.x);
            return this.SegmentAreaBy_h(radius-this.sqOrg.x);
         }

         // To the left
         if(this.sqOrg.x<-radius && this.sqOrg.x+this.sqSize>-radius)
         {
            //console.writeln("B",this.sqOrg.x+this.sqSize+radius);
            return this.SegmentAreaBy_h(this.sqOrg.x+this.sqSize+radius);
         }
      }

      if(this.sqOrg.x<=0 && this.sqOrg.x+this.sqSize>=0)
      {
         // To the botton
         if(this.sqOrg.y<radius && this.sqOrg.y+this.sqSize>radius)
         {
            //console.writeln("C",radius-this.sqOrg.y);
            return this.SegmentAreaBy_h(radius-this.sqOrg.y);
         }

         // To the top
         if(this.sqOrg.y<-radius && this.sqOrg.y+this.sqSize>-radius)
         {
            //console.writeln("D",this.sqOrg.y+this.sqSize-radius);
            return this.SegmentAreaBy_h(this.sqOrg.y+this.sqSize+radius);
         }
      }
      return 0;
   };

   this.ProcessCase1 = function (p1inside, p2inside, p3inside, p4inside)
   {
      // Rotate square around the center of the circle to normalize the case
      var org=null;
      if(p1inside)
         org=this.sqOrg;
      else if(p2inside)
         org=new Point(this.sqOrg.y, -(this.sqOrg.x+this.sqSize));
      else if(p3inside)
         org=new Point(-(this.sqOrg.x+this.sqSize), -(this.sqOrg.y+this.sqSize));
      else if(p4inside)
         org=new Point(-(this.sqOrg.y+this.sqSize), this.sqOrg.x);
      else
         throw "Invalid case 1";

      var angle1=Math.asin(org.y/radius);
      var angle2=Math.acos(org.x/radius);
//console.writeln("a1,a2:",angle1*180/Math.PI," ",angle2*180/Math.PI);
      var angle=Math.abs(angle2-angle1);
      var area0=this.SegmentAreaBy_angle(angle);

      var x1=radius*Math.cos(angle1);
      var y2=radius*Math.sin(angle2);
//console.writeln("org:",org.x," ",org.y);
//console.writeln("x1,y2:",x1," ",y2);
      var area1=(x1-org.x)*(y2-org.y)/2;
      return area0+area1;
   };

   this.ProcessCase2 = function (p1inside, p2inside, p3inside, p4inside)
   {
      // Rotate square around the center of the circle to normalize the case
      //console.writeln(p1inside, p2inside, p3inside, p4inside);
      var org=null;
      if(p1inside && p4inside)
         org=this.sqOrg;
      else if(p1inside && p2inside )
         org=new Point(this.sqOrg.y, -(this.sqOrg.x+this.sqSize));
      else if(p2inside && p3inside)
         org=new Point(-(this.sqOrg.x+this.sqSize), -(this.sqOrg.y+this.sqSize));
      else if(p3inside && p4inside)
         org=new Point(-(this.sqOrg.y+this.sqSize), this.sqOrg.x);
      else
         throw "Invalid case 2";

      //console.writeln("org:", org);
      if (org.y <= 0 && org.y + this.sqSize >= 0 &&
         org.x + this.sqSize < radius)
      {
         var angleA = Math.asin(org.y / radius);
         var angleB = -Math.acos((org.x + this.sqSize) / radius);
         var angleC = Math.acos((org.x + this.sqSize) / radius);
         var angleD = Math.asin((org.y + this.sqSize) / radius);
         //console.writeln("aA,aB,aC,aD:", angleA * 180 / Math.PI, " ", angleB * 180 / Math.PI, " ", angleC * 180 / Math.PI, " ", angleD * 180 / Math.PI);
         var area1 = this.TriangleArea(
            new Point(org.x + this.sqSize, org.y),
            new Point(org.x + this.sqSize, radius * Math.sin(angleB)),
            new Point(radius * Math.cos(angleA), org.y));
         var area2 = this.SegmentAreaBy_angle(angleB - angleA);

         var area3 = this.TriangleArea(
            new Point(org.x + this.sqSize, org.y + this.sqSize),
            new Point(radius * Math.cos(angleD), org.y + this.sqSize),
            new Point(org.x + this.sqSize, radius * Math.sin(angleC)));
         var area4 = this.SegmentAreaBy_angle(angleD - angleC);
         //console.writeln("a1,a2,a3,a4:", area1, " ", area2, " ", area3, " ", area4);
         //console.writeln("a1-a2,a3-a4:", area1 - area2, " ", area3 - area4);
         return this.sqSize * this.sqSize - (area1 - area2) - (area3 - area4);
      }
      else
      {
         var angle1 = Math.asin(org.y / radius);
         var angle2 = Math.asin((org.y + this.sqSize) / radius);
         //console.writeln("a1,a2:", angle1 * 180 / Math.PI, " ", angle2 * 180 / Math.PI);
         var angle = Math.abs(angle2 - angle1);
         var area0 = this.SegmentAreaBy_angle(angle);

         var pA = new Point(radius * Math.cos(angle1), org.y);
         var pB = new Point(radius * Math.cos(angle2), org.y + this.sqSize);
         //console.writeln("PA:", pA, " PB:", pB);
         var area1 = this.TriangleArea(org, pA, pB);
         var area2 = this.TriangleArea(org, pB, new Point(org.x, org.y + this.sqSize));
         return area0 + area1 + area2;
      }
   };

   this.ProcessCase3 = function (p1inside, p2inside, p3inside, p4inside)
   {
      // Rotate square around the center of the circle to normalize the case
      var org=null;
      if(!p1inside)
         org=this.sqOrg;
      else if(!p2inside )
         org=new Point(this.sqOrg.y, -(this.sqOrg.x+this.sqSize));
      else if(!p3inside)
         org=new Point(-(this.sqOrg.x+this.sqSize), -(this.sqOrg.y+this.sqSize));
      else if(!p4inside)
         org=new Point(-(this.sqOrg.y+this.sqSize), this.sqOrg.x);
      else
         throw "Invalid case 3";

      var angle1=-Math.PI-Math.asin(org.y/radius);
      var angle2=-Math.acos(org.x/radius);
      //console.writeln("a1,a2:",angle1*180/Math.PI," ",angle2*180/Math.PI);
      var angle=Math.abs(angle1-angle2);
      var area0=this.SegmentAreaBy_angle(angle);

      var pA=new Point(radius*Math.cos(angle1),org.y);
      var pB=new Point(org.x,radius*Math.sin(angle2));
      var p2=new Point(org.x+this.sqSize,org.y);
      var p3=new Point(org.x+this.sqSize,org.y+this.sqSize);
      var p4=new Point(org.x,org.y+this.sqSize);
      //console.writeln("PA:",pA," PB:",pB);
      var area1=this.TriangleArea(p3,pA,p2);
      var area2=this.TriangleArea(p3,pB,pA);
      var area3=this.TriangleArea(p3,p4,pB);
      //console.writeln("a1=",area1," a2=",area2, " a3=",area3);
      return area0+area1+area2+area3;
   };

   this.Calculate = function (org, size)
   {
      this.sqOrg = new Point(org.x - center.x, org.y - center.y);
      this.sqSize = size;

      // Check if the corners are inside the circle
      // 1 - 2
      // 4 - 3
      var p1inside = this.CheckPointInCircle(new Point(this.sqOrg));
      var p2inside = this.CheckPointInCircle(new Point(this.sqOrg.x + this.sqSize, this.sqOrg.y));
      var p3inside = this.CheckPointInCircle(new Point(this.sqOrg.x + this.sqSize, this.sqOrg.y + this.sqSize));
      var p4inside = this.CheckPointInCircle(new Point(this.sqOrg.x, this.sqOrg.y + this.sqSize));
      var numInside = p1inside + p2inside + p3inside + p4inside;
      //console.writeln("Num corner inside: ", numInside);
      var area=0;
      switch(numInside)
      {
      case 0:
         area=this.ProcessCase0();
         break;
      case 1:
         area=this.ProcessCase1(p1inside,p2inside,p3inside,p4inside);
         break;
      case 2:
         area=this.ProcessCase2(p1inside,p2inside,p3inside,p4inside);
         break;
      case 3:
         area=this.ProcessCase3(p1inside,p2inside,p3inside,p4inside);
         break;
      case 4:
         area=this.sqSize*this.sqSize;
         break;
      default:
         throw "Invalid intersection";
      }
      if(isNaN(area) || area/(this.sqSize*this.sqSize)>1+1e-10){
         console.writeln(format("intersect area:%f square area:%f inters/square:%f", area, this.sqSize*this.sqSize, area/this.sqSize*this.sqSize));
         console.writeln(format("center:%ls r:%f sqOrg:%ls sqSize:%f Case %d", center.toString(), radius, this.sqOrg.toString(), this.sqSize, numInside));
         throw "There is an error in the intersection circle/square";
      }

      return area;
   }
};

function SquareSquareIntersection(center, size)
{
   this.square = new Rect(center.x - size / 2, center.y - size / 2, center.x + size / 2, center.y + size / 2);

   this.Calculate = function(pixel, size)
   {
      var pixelRect = new Rect(pixel.x, pixel.y, pixel.x + 1, pixel.y + 1);
      var inters = this.square.intersection(pixelRect);
      return inters.width * inters.height;
   }

   this.ApertureArea = function()
   {
      return this.square.width * this.square.height;
   }

   this.ApertureRect = function()
   {
      return this.square;
   }
};

function TestCircle()
{
   var engine=new CircleSquareIntersection();

   // Case 0 - Out
   console.writeln("Case 0 - Out");
   engine.SetCircle(new Point(0,0), 5);
   engine.SetSquare(new Point(6,0), 2);
   console.writeln("Area=",engine.Calculate());

   // Case 0 - Intersect
   console.writeln("Case 0 - Intersect");
   engine.SetCircle(new Point(0,0), 5);
   engine.SetSquare(new Point(4.99,-1), 2);
   console.writeln("Area=",engine.Calculate());

   // Case 1
   console.writeln("Case 1");
   engine.SetCircle(new Point(0,0), 5);
   engine.SetSquare(new Point(4,2), 2);
   console.writeln("Area=",engine.Calculate());

   // Case 2
   console.writeln("Case 2");
   engine.SetCircle(new Point(0,0), 5);
   engine.SetSquare(new Point(3,1), 2);
   console.writeln("Area=",engine.Calculate());

   // Case 3
   console.writeln("Case 3");
   engine.SetCircle(new Point(0,0), 5);
   engine.SetSquare(new Point(2,2), 2);
   console.writeln("Area=",engine.Calculate());

   // Case 4
   console.writeln("Case 4");
   engine.SetCircle(new Point(0,0), 5);
   engine.SetSquare(new Point(1,1), 2);
   console.writeln("Area=",engine.Calculate());

   // Coverage
   console.writeln("Coverage");
   var rad=2;
   var cell=1;
   var totalArea=0;
   var center=new Point (3179.403267,3568.977920);
   engine.SetCircle(center, rad);
engine.SetSquare(new Point(3179,3566), 1);
console.writeln(engine.Calculate());
   for(var y=Math.floor(center.y-rad); y<center.y+rad; y+=cell)
   {
      for(var x=Math.floor(center.x-rad); x<center.x+rad; x+=cell)
      {
         engine.SetSquare(new Point(x,y), cell);
         var area=engine.Calculate();
         totalArea+=area;
         console.writeln(format("[%f,%f]=%f ",x,y,area));
      }
      console.writeln();
   }
   var realArea=rad*rad*Math.PI;
   console.writeln("Total Area: ",totalArea," (Real: ",realArea,") Error:",totalArea-realArea);
}
