/*
 View Selection Dialog

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

#ifndef __ADP_VIEWDIALOG_js
#define __ADP_VIEWDIALOG_js


// ******************************************************************
// ViewDialog: Selection of image views
// ******************************************************************
function ViewDialog(onlyWindows)
{
   this.__base__ = Dialog;
   this.__base__();
   this.restyle();

   this.labelWidth = this.font.width("Object identifier:M");
   this.editWidth = this.font.width("MMMMMMMMMMMMMMMMMMMMMMMMMMMMM");

   // Views group
   this.views_Group = new GroupBox(this);
   this.views_Group.title = "Views";
   this.views_Group.sizer = new VerticalSizer;
   this.views_Group.sizer.margin = 8;
   this.views_Group.sizer.spacing = 6;


   // List of views
   this.views_List = new TreeBox(this);
   this.views_List.rootDecoration = false;
   this.views_List.alternateRowColor = true;
   this.views_List.multipleSelection = false;
   this.views_List.headerVisible = false;
   this.views_List.numberOfColumns = 1;

   this.views_List.toolTip = "<p>List of images which will be processed.</p>";

   var windows = ImageWindow.openWindows;
   for(var i=0; i<windows.length; i++)
   {
      var w=windows[i];
      var node = new TreeBoxNode(this.views_List);
      node.checkable=true;
      node.checked=false;
      node.setText(0, w.mainView.fullId);
      if(!onlyWindows)
      {
         var views = w.previews;
         for(var j=0; j<views.length; j++)
         {
            var node1 = new TreeBoxNode(this.views_List);
            node1.checkable=true;
            node1.checked=false;
            node1.setText(0, views[j].fullId);
         }
      }
   }
   this.views_Group.sizer.add(this.views_List);

   // Select all
   this.all_Button = new PushButton(this);
   this.all_Button.text = "Select all";
   this.all_Button.onClick = function ()
   {
      for(var i=0; i<this.dialog.views_List.numberOfChildren; i++)
      {
         var node = this.dialog.views_List.child(i);
         node.checked=true;
      }
   };

   // Unselect all
   this.unselect_Button = new PushButton(this);
   this.unselect_Button.text = "Unselect all";
   this.unselect_Button.onClick = function ()
   {
      for(var i=0; i<this.dialog.views_List.numberOfChildren; i++)
      {
         var node = this.dialog.views_List.child(i);
         node.checked=false;
      }
   };

   // Select sizer
   this.select_Sizer = new HorizontalSizer;
   this.select_Sizer.spacing = 6;
   this.select_Sizer.add(this.all_Button);
   this.select_Sizer.add(this.unselect_Button);
   this.select_Sizer.addStretch();
   this.views_Group.sizer.add(this.select_Sizer);


   // Common Buttons
   this.ok_Button = new PushButton(this);
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function ()
   {
      this.dialog.selectedViews = [];
      for(var i=0; i<this.dialog.views_List.numberOfChildren; i++)
      {
         var node = this.dialog.views_List.child(i);
         if(node.checked)
            this.dialog.selectedViews.push(node.text(0));
      }
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
   this.sizer.add(this.views_Group);
   this.buttons_Sizer.addSpacing(8);
   this.sizer.add(this.buttons_Sizer);

   this.windowTitle = "View selection";
   this.adjustToContents();
   //this.setFixedSize();
}

ViewDialog.prototype = new Dialog;


#endif