/*
 Photometry script

 Script for the measurement of the apparent brightnesses of multiple objects relative to each other.

 Copyright (C) 2013, Andres del Pozo, Vicent Peris (OAUV)
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

/*
 Changelog:

 0.1:   * Test version
 */

#feature-id    Image Analysis > DifferentialPhotometry

#feature-info  Script for measuring the flux of the known stars in astronomical images.<br/>\
<br/>\
Copyright &copy;2013 Andr&eacute;s del Pozo, Vicent Peris (OAUV)

#define VERSION "0.1"
#define TITLE "Differential Photometry"
#define SETTINGS_MODULE "DPHOT"

#include <pjsr/DataType.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/UndoFlag.jsh>

#include "WCSmetadata.jsh"
#include "PreviewControl.js"
#include "AutoStretch.js"
;

function fieldLabel(parent, text, width)
{
   this.label = new Label(parent);
   this.label.text = text;
   this.label.textAlignment = TextAlign_Right | TextAlign_VertCenter;
   if (width != null)
      this.label.setFixedWidth(width);
   return this.label;
}

function CreateSimpleSizer(vertical, obj1, obj2, obj3, obj4, obj5, obj6)
{
   var sizer = new Sizer(vertical);
   if (obj1)
      sizer.add(obj1);
   if (obj2)
      sizer.add(obj2);
   if (obj3)
      sizer.add(obj3);
   if (obj4)
      sizer.add(obj4);
   if (obj5)
      sizer.add(obj5);
   if (obj6)
      sizer.add(obj6);
   return sizer;
}

function WizardPage(title, back, next)
{
   this.__base__ = Dialog;
   this.__base__();
   this.restyle();

   this.container = new Control(this);

   // usual control buttons

   this.newInstanceButton = new ToolButton(this);
   this.newInstanceButton.icon = ":/process-interface/new-instance.png";
   this.newInstanceButton.toolTip = "New Instance";
   this.newInstanceButton.onMousePress = function ()
   {
      this.hasFocus = true;

      engine.SaveParameters();

      this.pushed = false;
      this.dialog.newInstance();
   };

   this.reset_Button = new ToolButton(this);
   this.reset_Button.icon = ":/icons/reload.png";
   this.reset_Button.toolTip = "<p>Resets all settings to default values.<br />" +
      "This action closes the dialog, so the script has to be executed again for changes to take effect.</p>";
   this.reset_Button.onClick = function ()
   {
      var msg = new MessageBox("Do you really want to reset all settings to their default values?",
         TITLE, StdIcon_Warning, StdButton_Yes, StdButton_No);
      var res = msg.execute();
      if (res == StdButton_Yes)
      {
         Settings.remove(SETTINGS_MODULE);
         this.dialog.resetRequest = true;
         this.dialog.cancel();
      }
   };

   this.help_Button = new ToolButton(this);
   this.help_Button.icon = ":/process-interface/browse-documentation.png";
   this.help_Button.toolTip = "<p>Browse Documentation</p>";
   this.help_Button.onClick = function ()
   {
      Dialog.browseScriptDocumentation( "DifferentialPhotometry" );
   };

   if(back)
   {
      this.back_Button = new PushButton(this);
      this.back_Button.text = "Back";
      this.back_Button.icon = ":/icons/goto-previous.png";
      this.back_Button.onClick = function ()
      {
         //this.dialog.ok();
         this.dialog.done(2);
      };
   }

   this.next_Button = new PushButton(this);
   if(next)
   {
      this.next_Button.text = "Next";
      this.next_Button.icon = ":/icons/goto-next.png";
   } else {
      this.next_Button.text = "Finish";
      this.next_Button.icon = ":/icons/ok.png";
   }
   this.next_Button.onClick = function ()
   {
      //this.dialog.ok();
      this.dialog.done(1);
   };

   this.cancel_Button = new PushButton(this);
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = ":/icons/cancel.png";
   this.cancel_Button.onClick = function ()
   {
      //this.dialog.cancel();
      this.dialog.done(0);
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.add(this.newInstanceButton);
   this.buttons_Sizer.add(this.reset_Button);
   this.buttons_Sizer.add(this.help_Button);
   this.buttons_Sizer.addStretch();
   if(back)
      this.buttons_Sizer.add(this.back_Button);
   this.buttons_Sizer.add(this.next_Button);
   this.buttons_Sizer.add(this.cancel_Button);

   // Global sizer

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 6;
   //this.sizer.add( this.helpLabel );
   //this.sizer.addSpacing( 4 );
   this.sizer.add(this.container);

   this.sizer.addSpacing(8);
   this.sizer.add(this.buttons_Sizer);

   if(title)
      this.windowTitle = title;
}
WizardPage.prototype = new Dialog;

function FilesPage(engine)
{
   this.__base__ = WizardPage;
   this.__base__("Differential Photometry: Flux tables selection", false, true);
   this.restyle();

   //
   this.helpLabel = new Label(this);
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.minWidth = 45 * this.font.width('M');
   this.helpLabel.margin = 6;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text =
      "<p><b>" + TITLE + " v" + VERSION + "</b> &mdash;  Script for the measurement of the apparent brightnesses of multiple objects relative to each other.<br/>" +
         "<br/>" +
         "Copyright &copy; 2013 Andr&eacute;s del Pozo, Vicent Peris (OAUV)</p>";

   // Flux dir
   this.fluxDir_Label = new fieldLabel(this, "Flux tables directory:");

   this.fluxDir_Edit = new Edit( this );
   this.fluxDir_Edit.setMinWidth( 300 );
   this.fluxDir_Edit.toolTip = "<p>Path to the directory where the flux tables are stored.</p>";
   this.fluxDir_Edit.onTextUpdated = function( value )
   {
      engine.fluxDir = value;
   };

   this.fluxDir_Button = new ToolButton( this );
   this.fluxDir_Button.icon = ":/icons/select-file.png";
   this.fluxDir_Button.toolTip = "<p>Select the directory of the flux tables.</p>";
   this.fluxDir_Button.onClick = function()
   {
      var gdd = new GetDirectoryDialog;
      gdd.initialPath = this.dialog.fluxDir_Edit.text;
      gdd.caption = "Select Flux Tables Path";
      if ( gdd.execute() )
      {
         engine.fluxDir = gdd.directory;
         this.dialog.fluxDir_Edit.text = engine.fluxDir;
      }
   };

   this.fluxDir_Sizer = new HorizontalSizer;
   this.fluxDir_Sizer.spacing = 4;
   this.fluxDir_Sizer.add( this.fluxDir_Label );
   this.fluxDir_Sizer.add( this.fluxDir_Edit, 100 );
   this.fluxDir_Sizer.add( this.fluxDir_Button );

   // Files info
   this.tables_Label = new fieldLabel(this, "Contents of the detected tables:");
   this.info_Label = new Label(this);
   this.info_Label.useRichText = true;
   this.info_Label.styleSheet = "QLabel{"
      + "border: 1px solid gray;"
      + "background-color: #ffffff;"
      + "}";
   //this.info_Label.setMinSize(400, 0);
   this.info_Label.text = "<p><b>Aquí iría la información detectada en las tablas del directorio seleccionado.</b></p>"
      + "<p>Directory /home/user/photometry/data/<br>"
      + "Apertures:"
      + "<ul><li>Flux&SNR 8px</li>"
      + "<li>Flux&SNR 8.5px</li>"
      + "<li>Flux&SNR 9px</li>"
      + "</ul>"
      + "Background table detected<br/>"
      + "Flags table detected</p>";

   // Reference Image
   this.refImage_Label = new fieldLabel(this, "Optional reference image:");

   this.refImage_Edit = new Edit( this );
   this.refImage_Edit.setMinWidth( 300 );
   this.refImage_Edit.toolTip = "<p>This image is used in the next page for painting the detected objects over it.</p>";
   this.refImage_Edit.onTextUpdated = function( value )
   {
      engine.referenceImage = value;
   };

   this.refImage_Button = new ToolButton(this);
   this.refImage_Button.icon = ":/icons/select-file.png";
   this.refImage_Button.toolTip = "<p>Select the directory of the flux tables.</p>";
   this.refImage_Button.onClick = function ()
   {
      var ofd = new OpenFileDialog;
      ofd.initialPath = this.dialog.refImage_Edit.text;
      ofd.caption = "Select Flux Tables Path";
      ofd.filters = [
         [ "FITS Files", ".fit", ".fits", ".fts" ]
      ];
      if (ofd.execute())
      {
         engine.referenceImage = ofd.fileName;
         this.dialog.refImage_Edit.text = engine.referenceImage;
      }
   };

   this.refImage_Sizer = new HorizontalSizer;
   this.refImage_Sizer.spacing = 4;
   this.refImage_Sizer.add( this.refImage_Label );
   this.refImage_Sizer.add( this.refImage_Edit, 100 );
   this.refImage_Sizer.add( this.refImage_Button );

   this.container.sizer = new VerticalSizer;
   this.container.sizer.margin = 6;
   this.container.sizer.spacing = 4;
   this.container.sizer.add(this.helpLabel);
   this.container.sizer.addSpacing( 4 );
   this.container.sizer.add(this.fluxDir_Sizer);
   this.container.sizer.add(this.tables_Label, 100, Align_Left);
   this.container.sizer.add(this.info_Label);
   this.container.sizer.add(this.refImage_Sizer);

   this.adjustToContents();
   this.setFixedSize();
}
FilesPage.prototype = new WizardPage;

function ObjectsPage(engine)
{
   this.__base__ = WizardPage;
   this.__base__("Differential Photometry: Objects selection", true, true);
   this.restyle();

   // Aperture
   this.aperture_Label = new fieldLabel(this, "Aperture:");
   this.aperture_Combo = new ComboBox(this);
   this.aperture_Combo.editEnabled = false;
   this.aperture_Combo.addItem("8 pixels");
   this.aperture_Combo.addItem("8.5 pixels");
   this.aperture_Combo.addItem("9 pixels");
   this.aperture_Combo.toolTip = "<p>Select the desired aperture between the apertures available in the flux tables</p>";
   this.aperture_Combo.onItemSelected = function ()
   {
      engine.aperture = this.dialog.catalog_Combo.currentItem;
   }
   this.aperture_Sizer = new HorizontalSizer;
   this.aperture_Sizer.spacing = 4;
   this.aperture_Sizer.add(this.aperture_Label);
   this.aperture_Sizer.add(this.aperture_Combo);
   this.aperture_Sizer.addStretch();

   // Object Tables

   this.CreateObjectTree = function(parent)
   {
      var tree = new TreeBox(this);
      tree.rootDecoration = false;
      //tree.alternateRowColor = false;
      tree.multipleSelection = true;
      tree.headerVisible = true;
      tree.numberOfColumns = 5;
      tree.setHeaderText(0,"Name");
      tree.setHeaderText(1,"MinSNR");
      tree.setHeaderText(2,"103P_L_Light_018");
      tree.setHeaderText(3,"103P_L_Light_019");
      tree.setHeaderText(4,"103P_L_Light_020");
      return tree;
   }

   this.objects_Label = new fieldLabel(this, "Available objects:");
   this.objects_Tree = this.CreateObjectTree(this);
   this.objects_Tree.setVariableSize();
   this.objects_Tree.toolTip = "<p>Table of the fluxes of the available objects.</p>";
   {
      var node = new TreeBoxNode(this.objects_Tree);
      node.setText(0, "005038.2+552938");
      node.setText(1, "125.65"); node.setAlignment(1,TextAlign_Right);
      node.setText(2, "2939894.118"); node.setAlignment(2,TextAlign_Right);
      node.setText(3, "2936456.435"); node.setAlignment(3,TextAlign_Right);
      node.setText(4, "2933445.345"); node.setAlignment(4,TextAlign_Right);
      node.setBackgroundColor(2,0xFFFFFF00);
   }
   {
      var node = new TreeBoxNode(this.objects_Tree);
      node.setText(0, "005220.6+553735");
      node.setText(1, "10.25"); node.setAlignment(1,TextAlign_Right);
      node.setText(2, "39894.118"); node.setAlignment(2,TextAlign_Right);
      node.setText(3, "36456.435"); node.setAlignment(3,TextAlign_Right);
      node.setText(4, "33445.345"); node.setAlignment(4,TextAlign_Right);
   }
   {
      var node = new TreeBoxNode(this.objects_Tree);
      node.setText(0, "005249.5+553312");
      node.setText(1, "168.35"); node.setAlignment(1,TextAlign_Right);
      node.setText(2, "3939894.118"); node.setAlignment(2,TextAlign_Right);
      node.setText(3, "3936456.435"); node.setAlignment(3,TextAlign_Right);
      node.setText(4, "3933445.345"); node.setAlignment(4,TextAlign_Right);
      node.setBackgroundColor(3,0xFFFF0000);
   }
   {
      var node = new TreeBoxNode(this.objects_Tree);
      node.setText(0, "005056.5+552138");
      node.setText(1, "65.35"); node.setAlignment(1,TextAlign_Right);
      node.setText(2, "939894.118"); node.setAlignment(2,TextAlign_Right);
      node.setText(3, "936456.435"); node.setAlignment(3,TextAlign_Right);
      node.setText(4, "933445.345"); node.setAlignment(4,TextAlign_Right);
      node.setBackgroundColor(4,0xFF0000FF);
   }
   for(var i=0; i<this.objects_Tree.numberOfColumns; i++)
      this.objects_Tree.adjustColumnWidthToContents(i);

   this.objects_Sizer = new VerticalSizer;
   this.objects_Sizer.spacing = 4;
   this.objects_Sizer.add(this.objects_Label,0,Align_Left);
   this.objects_Sizer.add(this.objects_Tree,100);

   // Selected objects
   this.addTargetButton = new ToolButton(this);
   this.addTargetButton.icon = ":/icons/arrow-right.png";
   this.addTargetButton.toolTip = "<p>Select the target object.</p>";
   this.addTargetButton.onMousePress = function ()
   {
   }
   this.deleteTargetButton = new ToolButton(this);
   this.deleteTargetButton.icon = ":/icons/arrow-left.png";
   this.deleteTargetButton.toolTip = "<p>Deselect the target object.</p>";
   this.deleteTargetButton.onMousePress = function ()
   {
   }
   this.targetButtons_Sizer = CreateSimpleSizer(true,this.addTargetButton,this.deleteTargetButton);
   this.targetButtons_Sizer.insertStretch(0);
   this.targetButtons_Sizer.insertStretch(3);
   this.target_Label = new fieldLabel(this, "Target object:");
   this.target_Tree = this.CreateObjectTree(this);
   this.target_Tree.setFixedHeight(60);
   this.targetTable_Sizer = new VerticalSizer;
   this.targetTable_Sizer.add(this.target_Label,0,Align_Left);
   this.targetTable_Sizer.add(this.target_Tree,100);
   this.target_Sizer = CreateSimpleSizer(false,this.targetButtons_Sizer,this.targetTable_Sizer);

   this.addReferButton = new ToolButton(this);
   this.addReferButton.icon = ":/icons/arrow-right.png";
   this.addReferButton.toolTip = "<p>Select reference objects.</p>";
   this.addReferButton.onMousePress = function ()
   {
   }
   this.deleteReferButton = new ToolButton(this);
   this.deleteReferButton.icon = ":/icons/arrow-left.png";
   this.deleteReferButton.toolTip = "<p>Deselect reference objects.</p>";
   this.deleteReferButton.onMousePress = function ()
   {
   }
   this.referButtons_Sizer = CreateSimpleSizer(true,this.addReferButton,this.deleteReferButton);
   this.referButtons_Sizer.insertStretch(0);
   this.referButtons_Sizer.insertStretch(3);

   this.reference_Label = new fieldLabel(this, "Reference objects");
   this.reference_Tree = this.CreateObjectTree(this);
   this.referTable_Sizer = new VerticalSizer;
   this.referTable_Sizer.add(this.reference_Label,0,Align_Left);
   this.referTable_Sizer.add(this.reference_Tree,100);
   this.reference_Sizer = CreateSimpleSizer(false,this.referButtons_Sizer,this.referTable_Sizer);

   this.selected_Sizer = new VerticalSizer;
   this.selected_Sizer.spacing = 4;
   this.selected_Sizer.add(this.target_Sizer,0);
   this.selected_Sizer.add(this.reference_Sizer,100);

   this.tables_Sizer = new HorizontalSizer;
   this.tables_Sizer.spacing = 4;
   this.tables_Sizer.add(this.objects_Sizer,67);
   this.tables_Sizer.add(this.selected_Sizer,33);


   this.mapControl = new PreviewControl(this);
   this.mapControl.setMinSize(400,400);

   this.setTargetButton = new ToolButton(this);
   this.setTargetButton.icon = ":/icons/pin-red.png";
   this.setTargetButton.toolTip = "<p>Activates the selection of the target object by clicking on the image.</p>";
   this.setTargetButton.onMousePress = function ()
   {
   }

   this.setReferenceButton = new ToolButton(this);
   this.setReferenceButton.icon = ":/icons/pin-green.png";
   this.setReferenceButton.toolTip = "<p>Activates the selection of reference objects by clicking on the image.</p>";
   this.setReferenceButton.onMousePress = function ()
   {
   }
   this.mapControl.buttons_Sizer.insert(3,this.setTargetButton);
   this.mapControl.buttons_Sizer.insert(4,this.setReferenceButton);

   this.container.sizer = new VerticalSizer;
   this.container.sizer.margin = 6;
   this.container.sizer.spacing = 4;
   this.container.sizer.add(this.aperture_Sizer);
   this.container.sizer.add(this.tables_Sizer);
   this.container.sizer.add(this.mapControl,50);

   this.onExecute = function()
   {
      this.image = null;
      this.metadata = new ImageMetadata();
      if(engine.referenceImage && engine.referenceImage.length>0)
      {
         try{
            var window = ImageWindow.open(engine.referenceImage)[0];
            this.metadata.ExtractMetadata(window);
            if(this.metadata.ref_I_G)
            {
               window.mainView.beginProcess(UndoFlag_NoSwapFile);
               var autoStretch = new AutoStretch();
               autoStretch.HardApply(window.mainView,false);
               window.mainView.endProcess();

               this.image = new Bitmap(this.metadata.width, this.metadata.height);
               this.image.assign(window.mainView.image.render());
            }
         } catch(ex) { console.writeln(ex);}
      }
      if(!this.image)
      {
         this.metadata.width = 1200;
         this.metadata.height = 1200;
         // Calculate bounds, projection & resolution
      }
      this.mapControl.SetImage(this.image, this.metadata);
   }

   this.adjustToContents();
}
ObjectsPage.prototype = new WizardPage;

function GraphPage(engine)
{
   this.__base__ = WizardPage;
   this.__base__("Differential Photometry: Graph configuration", true, false);
   this.restyle();

   // Option1
   this.option1_Check = new CheckBox(this);
   this.option1_Check.text = "Ejemplo de opción 1";
   this.option2_Check = new CheckBox(this);
   this.option2_Check.text = "Option 2";
   this.option3_Check = new CheckBox(this);
   this.option3_Check.text = "Option 3";
   this.option4_Check = new CheckBox(this);
   this.option4_Check.text = "Option 4";
   this.option5_Check = new CheckBox(this);
   this.option5_Check.text = "Option 5";
   this.option6_Check = new CheckBox(this);
   this.option6_Check.text = "Option 6";
   this.col1Sizer= CreateSimpleSizer(true, this.option1_Check, this.option2_Check, this.option3_Check);
   this.col2Sizer= CreateSimpleSizer(true, this.option4_Check, this.option5_Check, this.option6_Check);
   this.options_Group = new GroupBox(this);
   this.options_Group.title = "Graph options:";
   this.options_Group.sizer = CreateSimpleSizer(false,this.col1Sizer,this.col2Sizer);
   this.options_Group.sizer.margin = 8;
   this.options_Group.sizer.spacing = 4;
   this.options_Group.sizer.addStretch();
   this.options_Group.adjustToContents();
   this.options_Group.setFixedHeight();

   // Buttons
   this.refresh_Button = new ToolButton(this);
   this.refresh_Button.icon = ":/icons/refresh.png";
   this.refresh_Button.toolTip = "<p>Refresh the graph using the current options</p>";
   this.refresh_Button.onMousePress = function ()
   {
   }

   this.save_Button = new ToolButton(this);
   this.save_Button.icon = ":/icons/save.png";
   this.save_Button.toolTip = "<p>Save the graph to a SVG file</p>";
   this.save_Button.onMousePress = function ()
   {
   }

   this.buttons_Sizer = CreateSimpleSizer(false, this.refresh_Button, this.save_Button);
   this.buttons_Sizer.addStretch();

   // Graph
   this.graph_Control = new Control(this);
   this.graph_Control.backgroundColor = 0xffffffff;
   this.graph_Control.setMinSize(400,300);

   var plotScript = "# Select the SVG output format\n" +
      "set terminal svg size 1024,768 enhanced\n" +
      "set output '"+ File.systemTempDirectory + "/dphot_graph.svg'\n" +
      "set samples 51, 51\n" +
      "set isosamples 60, 60\n" +
      "set hidden3d back offset 1 trianglepattern 3 undefined 1 altdiagonal bentover\n" +
      "set style data lines\n" +
      "set title \"Mandelbrot function\"\n" +
      "set xlabel \"X axis\"\n" +
      "set xlabel  offset character -3, -2, 0 font \"\" textcolor lt -1 norotate\n" +
      "set ylabel \"Y axis\"\n" +
      "set ylabel  offset character 3, -2, 0 font \"\" textcolor lt -1 rotate by -270\n" +
      "set zlabel \"Z axis\"\n" +
      "set zlabel  offset character -5, 0, 0 font \"\" textcolor lt -1 norotate\n" +
      "sinc(u,v) = sin(sqrt(u**2+v**2)) / sqrt(u**2+v**2)\n" +
      "compl(a,b)=a*{1,0}+b*{0,1}\n" +
      "mand(z,a,n) = n<=0 || abs(z)>100 ? 1:mand(z*z+a,a,n-1)+1\n" +
      "GPFUN_sinc = \"sinc(u,v) = sin(sqrt(u**2+v**2)) / sqrt(u**2+v**2)\"\n" +
      "xx = 6.08888888888889\n" +
      "dx = 1.11\n" +
      "x0 = -5\n" +
      "x1 = -3.89111111111111\n" +
      "x2 = -2.78222222222222\n" +
      "x3 = -1.67333333333333\n" +
      "x4 = -0.564444444444444\n" +
      "x5 = 0.544444444444445\n" +
      "x6 = 1.65333333333333\n" +
      "x7 = 2.76222222222222\n" +
      "x8 = 3.87111111111111\n" +
      "x9 = 4.98\n" +
      "xmin = -4.99\n" +
      "xmax = 5\n" +
      "n = 10\n" +
      "zbase = -1\n" +
      "GPFUN_compl = \"compl(a,b)=a*{1,0}+b*{0,1}\"\n" +
      "GPFUN_mand = \"mand(z,a,n) = n<=0 || abs(z)>100 ? 1:mand(z*z+a,a,n-1)+1\"\n" +
      "splot [-2:1][-1.5:1.5] mand({0,0},compl(x,y),30)";
   var scriptPath = File.systemTempDirectory + "/dphot_graph.gnu";
   var file = new File;
   file.createForWriting( scriptPath );
   file.outTextLn( plotScript );
   file.close();

   var res = ExternalProcess.execute("gnuplot", [scriptPath]);
   this.graph = new Bitmap(File.systemTempDirectory + "/dphot_graph.svg");
   this.graph_Control.onPaint = function (x0, y0, x1, y1)
   {
      var graph = this.dialog.graph;
      var graphics = new VectorGraphics(this);
      graphics.fillRect(x0,y0, x1, y1, new Brush(0xffffffff));
      var sx = this.width / graph.width;
      var sy = this.height / graph.height;
      var rect;
      if(sx>sy)
         rect = new Rect((this.width-sy*graph.width)/2, 0, (this.width+sy*graph.width)/2, sy*graph.height);
      else
         rect = new Rect(0, (this.height-sx*graph.height)/2, sx*graph.width, (this.height+sx*graph.height)/2);
      graphics.drawScaledBitmap(rect,graph);
      graphics.end();
   }

   this.container.sizer = new VerticalSizer;
   this.container.sizer.margin = 6;
   this.container.sizer.spacing = 4;
   this.container.sizer.add(this.options_Group);
   this.container.sizer.add(this.buttons_Sizer);
   this.container.sizer.add(this.graph_Control);

   this.adjustToContents();
}
GraphPage.prototype = new WizardPage;

function TestWizard(engine)
{
   this.dialogs = [new FilesPage(engine), new ObjectsPage(engine), new GraphPage(engine)];

   var cur=0;
   while(cur!=this.dialogs.length)
   {
      var result = this.dialogs[cur].execute();
      if(result==0)
         return;
      if(result==1)
         cur++;
      else if(result==2 && cur>0)
         cur--;
   }
}

function main()
{
   //var dlg = new DifferentialPhotometryDialog();
   //dlg.execute();
   var engine={};
   TestWizard(engine);

}

main();