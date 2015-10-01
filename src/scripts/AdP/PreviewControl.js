/*
 Preview Control

 This file is part of the AnnotateImage script

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

#include <pjsr/ButtonCodes.jsh>
#include <pjsr/StdCursor.jsh>
;

function PreviewControl(parent)
{
   this.__base__ = Frame;
   this.__base__(parent);

   this.SetImage = function(image, metadata)
   {
      this.image=image;
      this.metadata=metadata;
      this.scaledImage = null;
      this.SetZoomOutLimit();
      this.UpdateZoom(-100);
   }

   this.UpdateZoom = function (newZoom, refPoint)
   {
      newZoom = Math.max(this.zoomOutLimit, Math.min(2, newZoom));
      if (newZoom == this.zoom && this.scaledImage)
         return;

      if(refPoint==null)
         refPoint=new Point(this.scrollbox.viewport.width/2, this.scrollbox.viewport.height/2);
      var imgx=null;
      if(this.scrollbox.maxHorizontalScrollPosition>0)
         imgx=(refPoint.x+this.scrollbox.horizontalScrollPosition)/this.scale;
      var imgy=null;
      if(this.scrollbox.maxVerticalScrollPosition>0)
         imgy=(refPoint.y+this.scrollbox.verticalScrollPosition)/this.scale;

      this.zoom = newZoom;
      this.scaledImage = null;
      gc(true);
      if (this.zoom > 0)
      {
         this.scale = this.zoom;
         this.zoomVal_Label.text = format("%d:1", this.zoom);
      }
      else
      {
         this.scale = 1 / (-this.zoom + 2);
         this.zoomVal_Label.text = format("1:%d", -this.zoom + 2);
      }
      if (this.image)
         this.scaledImage = this.image.scaled(this.scale);
      else
         this.scaledImage = {width:this.metadata.width * this.scale, height:this.metadata.height * this.scale};
      this.scrollbox.maxHorizontalScrollPosition = Math.max(0, this.scaledImage.width - this.scrollbox.viewport.width);
      this.scrollbox.maxVerticalScrollPosition = Math.max(0, this.scaledImage.height - this.scrollbox.viewport.height);

      if(this.scrollbox.maxHorizontalScrollPosition>0 && imgx!=null)
         this.scrollbox.horizontalScrollPosition = (imgx*this.scale)-refPoint.x;
      if(this.scrollbox.maxVerticalScrollPosition>0 && imgy!=null)
         this.scrollbox.verticalScrollPosition = (imgy*this.scale)-refPoint.y;

      this.scrollbox.viewport.update();
   }

   this.zoomIn_Button = new ToolButton( this );
   this.zoomIn_Button.icon = this.scaledResource( ":/icons/zoom-in.png" );
   this.zoomIn_Button.setScaledFixedSize( 20, 20 );
   this.zoomIn_Button.toolTip = "Zoom in";
   this.zoomIn_Button.onMousePress = function()
   {
      this.parent.UpdateZoom(this.parent.zoom+1);
   };

   this.zoomOut_Button = new ToolButton( this );
   this.zoomOut_Button.icon = this.scaledResource( ":/icons/zoom-out.png" );
   this.zoomOut_Button.setScaledFixedSize( 20, 20 );
   this.zoomOut_Button.toolTip = "Zoom in";
   this.zoomOut_Button.onMousePress = function()
   {
      this.parent.UpdateZoom(this.parent.zoom-1);
   };


   this.zoom11_Button = new ToolButton( this );
   this.zoom11_Button.icon = this.scaledResource( ":/icons/zoom-1-1.png" );
   this.zoom11_Button.setScaledFixedSize( 20, 20 );
   this.zoom11_Button.toolTip = "Zoom 1:1";
   this.zoom11_Button.onMousePress = function()
   {
      this.parent.UpdateZoom(1);
   };

   this.buttons_Sizer = new HorizontalSizer;
   //this.buttons_Sizer.margin = 6;
   //this.buttons_Sizer.spacing = 4;
   this.buttons_Sizer.add( this.zoomIn_Button );
   this.buttons_Sizer.add( this.zoomOut_Button );
   this.buttons_Sizer.add( this.zoom11_Button );
   this.buttons_Sizer.addStretch();

   this.setScaledMinSize(300,200);
   this.zoom = 1;
   this.scale = 1;
   this.zoomOutLimit = -5;
   this.scrollbox = new ScrollBox(this);
   this.scrollbox.autoScroll = true;
   this.scrollbox.tracking = true;
   this.scrollbox.cursor = new Cursor(StdCursor_Arrow);

   this.scroll_Sizer = new HorizontalSizer;
   this.scroll_Sizer .add( this.scrollbox );

   this.SetZoomOutLimit = function()
   {
      var scaleX = Math.ceil(this.metadata.width/this.scrollbox.viewport.width);
      var scaleY = Math.ceil(this.metadata.height/this.scrollbox.viewport.height);
      var scale = Math.max(scaleX,scaleY);
      this.zoomOutLimit = -scale+2;
   }

   this.scrollbox.onHorizontalScrollPosUpdated = function (newPos)
   {
      this.viewport.update();
   }
   this.scrollbox.onVerticalScrollPosUpdated = function (newPos)
   {
      this.viewport.update();
   }

   this.forceRedraw = function()
   {
      this.scrollbox.viewport.update();
   };

   this.scrollbox.viewport.onMouseWheel = function (x, y, delta, buttonState, modifiers)
   {
      var preview = this.parent.parent;
      preview.UpdateZoom(preview.zoom + (delta > 0 ? -1 : 1), new Point(x,y));
   }

   this.scrollbox.viewport.onMousePress = function ( x, y, button, buttonState, modifiers )
   {
      var preview = this.parent.parent;
      if(preview.scrolling || button!=MouseButton_Left)
         return;
      preview.scrolling =
      {
         orgCursor: new Point(x,y),
         orgScroll: new Point(preview.scrollbox.horizontalScrollPosition,preview.scrollbox.verticalScrollPosition)
      };
      this.cursor = new Cursor(StdCursor_ClosedHand);
   }

   this.scrollbox.viewport.onMouseMove = function ( x, y, buttonState, modifiers )
   {
      var preview = this.parent.parent;
      if (preview.scrolling)
      {
         preview.scrollbox.horizontalScrollPosition = preview.scrolling.orgScroll.x - (x - preview.scrolling.orgCursor.x);
         preview.scrollbox.verticalScrollPosition = preview.scrolling.orgScroll.y - (y - preview.scrolling.orgCursor.y);
      }

      var ox= this.parent.maxHorizontalScrollPosition>0 ? -this.parent.horizontalScrollPosition : (this.width-preview.scaledImage.width)/2;
      var oy= this.parent.maxVerticalScrollPosition>0 ? -this.parent.verticalScrollPosition: (this.height-preview.scaledImage.height)/2;
      var coordPx = new Point((x - ox) / preview.scale, (y - oy) / preview.scale);
      if(coordPx.x<0 || coordPx.x>preview.metadata.width || coordPx.y<0 || coordPx.y>preview.metadata.height || !preview.metadata.projection)
      {
         preview.Xval_Label.text ="---";
         preview.Yval_Label.text ="---";
         preview.RAval_Label.text ="---";
         preview.Decval_Label.text ="---";
      }
      else
      {
         try{
            preview.Xval_Label.text = coordPx.x.toString();
            preview.Yval_Label.text = coordPx.y.toString();
            var coordRD=preview.metadata.Convert_I_RD(coordPx);
            if(coordRD.x<0) coordRD.x+=360;
            preview.RAval_Label.text = DMSangle.FromAngle(coordRD.x*24/360).ToString(true);
            preview.Decval_Label.text = DMSangle.FromAngle(coordRD.y).ToString(false);
         } catch(ex){}
      }
   }

   this.scrollbox.viewport.onMouseRelease = function (x, y, button, buttonState, modifiers)
   {
      var preview = this.parent.parent;
      if (preview.scrolling && button == MouseButton_Left)
      {
         preview.scrollbox.horizontalScrollPosition = preview.scrolling.orgScroll.x - (x - preview.scrolling.orgCursor.x);
         preview.scrollbox.verticalScrollPosition = preview.scrolling.orgScroll.y - (y - preview.scrolling.orgCursor.y);
         preview.scrolling = null;
         this.cursor = new Cursor(StdCursor_Arrow);
      }
   }

   this.scrollbox.viewport.onResize = function (wNew, hNew, wOld, hOld)
   {
      var preview = this.parent.parent;
      if(preview.metadata && preview.scaledImage)
      {
         this.parent.maxHorizontalScrollPosition = Math.max(0, preview.scaledImage.width - wNew);
         this.parent.maxVerticalScrollPosition = Math.max(0, preview.scaledImage.height - hNew);
         preview.SetZoomOutLimit();
         preview.UpdateZoom(preview.zoom);
      }
      this.update();
   }

   this.scrollbox.viewport.onPaint = function (x0, y0, x1, y1)
   {
      var preview = this.parent.parent;
      var graphics = new VectorGraphics(this);

      graphics.fillRect(x0,y0, x1, y1, new Brush(0xff202020));
      var offsetX = this.parent.maxHorizontalScrollPosition>0 ? -this.parent.horizontalScrollPosition : (this.width-preview.scaledImage.width)/2;
      var offsetY = this.parent.maxVerticalScrollPosition>0 ? -this.parent.verticalScrollPosition: (this.height-preview.scaledImage.height)/2;
      graphics.translateTransformation(offsetX, offsetY);
      if(preview.image)
         graphics.drawBitmap(0, 0, preview.scaledImage);
      else
         graphics.fillRect(0, 0, preview.scaledImage.width, preview.scaledImage.height, new Brush(0xff000000));

      graphics.pen = new Pen(0xffffffff,0);
      graphics.drawRect(-1, -1, preview.scaledImage.width + 1, preview.scaledImage.height + 1);

      if(preview.onCustomPaint)
      {
         graphics.antialiasing = true;
         graphics.scaleTransformation(preview.scale,preview.scale);
         preview.onCustomPaint.call(preview.onCustomPaintScope, graphics, x0, y0, x1, y1);
      }
      graphics.end();
   }

   this.zoomLabel_Label =new Label(this);
   this.zoomLabel_Label.text = "Zoom:";
   this.zoomVal_Label =new Label(this);
   this.zoomVal_Label.text = "1:1";

   this.Xlabel_Label = new Label(this);
   this.Xlabel_Label .text = "X:";
   this.Xval_Label = new Label(this);
   this.Xval_Label.text = "---";
   this.Ylabel_Label = new Label(this);
   this.Ylabel_Label.text = "Y:";
   this.Yval_Label = new Label(this);
   this.Yval_Label.text = "---";

   this.RAlabel_Label = new Label(this);
   this.RAlabel_Label.text = "RA:";
   this.RAval_Label = new Label(this);
   this.RAval_Label.text = "---";
   this.Declabel_Label = new Label(this);
   this.Declabel_Label.text = "Dec:";
   this.Decval_Label = new Label(this);
   this.Decval_Label.text = "---";

   this.coords_Frame = new Frame(this);
   this.coords_Frame.backgroundColor = 0xffffffff;
   this.coords_Frame.sizer = new HorizontalSizer;
   this.coords_Frame.sizer.margin = 2;
   this.coords_Frame.sizer.spacing = 4;
   this.coords_Frame.sizer.add(this.zoomLabel_Label);
   this.coords_Frame.sizer.add(this.zoomVal_Label);
   this.coords_Frame.sizer.addSpacing(6);
   this.coords_Frame.sizer.add(this.Xlabel_Label);
   this.coords_Frame.sizer.add(this.Xval_Label);
   this.coords_Frame.sizer.addSpacing(6);
   this.coords_Frame.sizer.add(this.Ylabel_Label);
   this.coords_Frame.sizer.add(this.Yval_Label);
   this.coords_Frame.sizer.addSpacing(6);
   this.coords_Frame.sizer.add(this.RAlabel_Label);
   this.coords_Frame.sizer.add(this.RAval_Label);
   this.coords_Frame.sizer.addSpacing(6);
   this.coords_Frame.sizer.add(this.Declabel_Label);
   this.coords_Frame.sizer.add(this.Decval_Label);
   this.coords_Frame.sizer.addStretch();


   this.sizer = new VerticalSizer;
   this.sizer.add(this.buttons_Sizer);
   this.sizer.add(this.scroll_Sizer);
   this.sizer.add(this.coords_Frame);
}

PreviewControl.prototype = new Frame;

