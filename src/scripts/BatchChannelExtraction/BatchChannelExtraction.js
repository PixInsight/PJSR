/*
                              Batch Channel Extraction Script

   A script for automating the channel extraction of RGB image files.

   Copyright (C) 2010-2017 S J Brown
   Contributions: Copyright (C) 2017 Michael Covington

   This program is free software: you can redistribute it and/or modify it
   under the terms of the GNU General Public License as published by the
   Free Software Foundation, version 3 of the License.

   This program is distributed in the hope that it will be useful, but WITHOUT
   ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
   FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
   more details.

   You should have received a copy of the GNU General Public License along with
   this program.  If not, see <http://www.gnu.org/licenses/>.
*/

#feature-id    Batch Processing > BatchChannelExtraction

#feature-info  An automated channel extraction utility.<br/>\
   <br/>\
   A script designed to extract the color channels from RGB images and save \
   them to selected directories.<br/>\
   <br/>\
   Copyright &copy; 2010-2017 S J Brown<br/>\
   Contributions: Copyright &copy; 2017 Michael Covington

#feature-icon  BatchChannelExtraction.xpm

#include <pjsr/NumericControl.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/DataType.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/StdCursor.jsh>
#include <pjsr/UndoFlag.jsh>

#define VERSION "1.2.4"
#define TITLE   "Batch Channel Extraction"

#define DEFAULT_EXTENSION     ".xisf"
#define DEFAULT_REDPREFIX     "R_"
#define DEFAULT_GRNPREFIX     "G_"
#define DEFAULT_BLUPREFIX     "B_"
#define DEFAULT_REDPOSTFIX    "_R"
#define DEFAULT_GRNPOSTFIX    "_G"
#define DEFAULT_BLUPOSTFIX    "_B"


// ### TODO: 2018/12/27 - This script requires a complete code revision.

//////////// Reusable Code %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

//string arrays
var btnText = new Array(
"Add Files",         // 0
"Cancel",            // 1
"Clear",             // 2
"Delete Selected",   // 3
"Execute",           // 4
"Invert Selection",  // 5
"OK",                // 6
"Remove Selected",   // 7
"Select",            // 8
"Select All",        // 9
"Enter",             //10
"Add Img Set",       //11
"Move Up",           //12
"Move Down",         //13
"Calibrate",         //14
"DeBayer",           //15
"Register",          //16
"Crop",              //17
"Integrate",         //18
"Set Parameters",    //19
"Edit",              //20
"Edit Value",        //21
"Toggle",            //22
"Toggle Up",         //23
"Toggle Down",       //24
"Selection",         //25
"Selection Up",      //26
"Selection Down",    //27
"Set True",          //28
"Set False",         //29
"Accept",            //30
"Verify Paths");     //

var btnIcon = new Array(
":/icons/arrow-up.png",                   // 0
":/icons/arrow-down.png",                 // 1
":/icons/arrow-left.png",                 // 2
":/icons/arrow-right.png",                // 3
":/browser/select.png",                   // 4
":/process-interface/expand.png",         // 5
":/process-interface/expand_vert.png",    // 6
":/process-interface/contract.png",       // 7
":/process-interface/contract_vert.png",  // 8
":/bullets/bullet-blue.png",              // 9
":/bullets/bullet-green.png",             //10
":/bullets/bullet-grey.png",              //11
":/bullets/bullet-red.png",               //12
":/bullets/bullet-yellow.png",            //13
":/auto-hide/close.png",                  //14
":/");

// Add FITS information if not exists, otherwise update information.
function updateKeyword( keywords, name, value, comment )
{
    for ( var i=0; i<keywords.length; i++ )
    {
	if ( keywords[i].name == name )
	{
	    keywords[i].value = value;
	    if ( comment != null )
		keywords[i].comment = comment;
	    return;
	}
    }
    keywords.push( new FITSKeyword( name, value, (comment == null) ? "" : comment ) );
}

//label object constructor
function labelBox(parent, elText, tAlign, elWidth)
{
   this.label = new Label(parent);
   this.label.text = elText;
   this.label.textAlignment = tAlign;
   this.label.setMaxWidth(elWidth);

   return this.label;
}

//push button object constructor
function pushButton(parent, bText, bIcon, bToolTip)
{
   this.button = new PushButton(parent);
   if(bText != '')
      this.button.text = bText;
   if(bIcon != '')
      this.button.icon = this.button.scaledResource( bIcon );
   if(bToolTip != '')
      this.button.toolTip = bToolTip;

   return this.button;
}

//tool button object constructor
function toolButton(parent, tbIcon, tbToolTip)
{
   this.toolButton = new ToolButton(parent);
   if(tbIcon != '')
      this.toolButton.icon = this.toolButton.scaledResource( tbIcon );
   if(tbToolTip != '')
      this.toolButton.toolTip = tbToolTip;

      return this.toolButton;
}

//radio button object constructor
function radioButton(parent, rbText, rbChecked, rbToolTip)
{
   this.radioButton = new RadioButton(parent);
   this.radioButton.text = rbText;
   this.radioButton.checked = rbChecked;
   if(rbToolTip.length != 0)
      this.radioButton.toolTip = rbToolTip;

   return this.radioButton;
}

//checkbox object constructor
function checkBox(parent, cbText, cbChecked, cbToolTip)
{
   this.checkbox = new CheckBox(parent);
   this.checkbox.text = cbText;
   this.checkbox.checked = cbChecked;
   if(cbToolTip.length != 0)
      this.checkbox.toolTip = cbToolTip;

   return this.checkbox;
}

//edit box object constructor
function editBox(parent, eText, readWrite, eStyle, eMinWidth)
{
   this.edit = new Edit(parent);
   if(eText != '')
      this.edit.text = eText;
   this.edit.readOnly = readWrite;
   this.edit.style = eStyle;
   this.edit.setMinWidth(eMinWidth);

   return this.edit;
}

//spin box object constructor
function spinBox(parent, sbValue, sbMinVal, sbMaxVal, sbStep, sbCanEdit)
{
   this.spinbox = new SpinBox(parent);
   this.spinbox.value = sbValue;
   this.spinbox.setRange(sbMinVal, sbMaxVal);
   this.spinbox.stepSize = sbStep;
   this.spinbox.editable = sbCanEdit;

   return this.spinbox;
}

//numeric control object constructor
function numericControl(parent, ncVal, ncPrec, ncLow, ncHigh, slLow, slHigh, minW, lText, tTip)
{
   this.nc = new NumericControl(parent);
   this.nc.setValue(ncVal);
   this.nc.setPrecision(ncPrec);
   this.nc.setRange(ncLow, ncHigh);
   this.nc.slider.setRange(slLow, slHigh);
   this.nc.slider.scaledMinWidth = minW;
   if(lText.length != 0)
      this.nc.label.text = lText;
   if(tTip.length != 0)
      this.nc.toolTip = tTip;

   return this.nc;
}

function GlobalData()
{
   this.inputFiles = new Array;
   this.ipCount = 0;
   this.clearConsole = false;
   this.extractRed = true;
   this.extractGrn = true;
   this.extractBlu = true;
   this.redOPD = "";
   this.grnOPD = "";
   this.bluOPD = "";
   this.opfExt = DEFAULT_EXTENSION;
   this.bitsPerSample = 16;
   this.floatSample = false;
   this.redOPFPrefix = "";
   this.grnOPFPrefix = "";
   this.bluOPFPrefix = "";
   this.redOPFPostfix = DEFAULT_REDPOSTFIX;
   this.grnOPFPostfix = DEFAULT_GRNPOSTFIX;
   this.bluOPFPostfix = DEFAULT_BLUPOSTFIX;
}
var data = new GlobalData();  //variable for global access to script data

var sampFrmt = ["Same As Target", "8-bit Integer", "16-bit Integer",
                  "32-bit Integer", "32-bit Float", "64-bit Float"];

//script engine
function ChannelExtractionEngine()
{
   this.execute = function()
   {
      var errors = 0;
      var T = new ElapsedTime;

      if(data.clearConsole)
         console.clear();
      //console.writeln("<br>");
      //console.execute("memory");
      //console.writeln("<br>");

      console.writeln("<br>#################===========================#################");
      console.writeln("################# <b>Channel Extraction Engine</b> #################");
      console.writeln("#################===========================#################<br>");
      console.writeln("\tProcessing ", data.ipCount, " image files...");

      for(var i = 0, n = data.ipCount; i < n; ++i)
      {
         console.writeln("<br>File #", (i+1));
         //check that the file exists
         if(!File.exists(data.inputFiles[i]))
         {
            ++errors;
            console.writeln("<br>Failed to locate :");
            console.writeln(File.extractName(data.inputFiles[i]));
            continue;
         }

         //try to open the file
         var srcWin = ImageWindow.open(data.inputFiles[i]);
         if(srcWin.isNull)
         {
            ++errors;
            console.writeln("<br>Failed to open :");
            console.writeln(File.extractName(data.inputFiles[i]));
            continue;
         }

         //check that the image is RGB, continue if not
         if(!srcWin[0].mainView.image.isColor)
         {
            ++errors;
            var str = File.extractName(data.inputFiles[i]) + "<br>is not an RGB image";
            console.writeln("<br>", str);
            srcWin[0].forceClose();
            continue;
         }

         //try to create the separate color channel image windows
         var imgW = srcWin[0].mainView.image.width;
         var imgH = srcWin[0].mainView.image.height;
         var numC = 1;
         var bps;
         var fs;
         if (data.forceSampleFormat)
         {
            bps = data.bitsPerSample;
            fs = data.floatSample;
         }
         else
         {
            bps = srcWin[0].bitsPerSample;
            fs = srcWin[0].isFloatSample
         }
         if(data.extractRed)
         {
            var redWin = new ImageWindow(imgW, imgH, numC, bps, fs, false, "");
            if(redWin.isNull)
            {
               ++errors;
               if(srcWin)
                  srcWin[0].forceClose();
               console.writeln("<br>Failed to create Red Image window for");
               console.writeln(File.extractName(data.inputFiles[i]));
               continue;
            }
         }
         if(data.extractGrn)
         {
            var grnWin = new ImageWindow(imgW, imgH, numC, bps, fs, false, "");
            if(grnWin.isNull)
            {
               ++errors;
               if(srcWin)
                  srcWin[0].forceClose();
               if(redWin)
                  redWin.forceClose();
               console.writeln("<br>Failed to create Red Image window for");
               console.writeln(File.extractName(data.inputFiles[i]));
               continue;
            }
         }
         if(data.extractBlu)
         {
            var bluWin = new ImageWindow(imgW, imgH, numC, bps, fs, false, "");
            if(bluWin.isNull)
            {
               ++errors;
               if(srcWin)
                  srcWin[0].forceClose();
               if(redWin)
                  redWin.forceClose();
               if(grnWin)
                  grnWin.forceClose();
               console.writeln("<br>Failed to create Red Image window for");
               console.writeln(File.extractName(data.inputFiles[i]));
               continue;
            }
         }

         //separate the channels
         if(data.extractRed)
         {
            srcWin[0].mainView.image.selectedChannel = 0;
            redWin.mainView.beginProcess(UndoFlag_NoSwapFile);
            redWin.mainView.image.assign(srcWin[0].mainView.image);
            redWin.mainView.endProcess();
         }

         if(data.extractGrn)
         {
            srcWin[0].mainView.image.selectedChannel = 1;
            grnWin.mainView.beginProcess(UndoFlag_NoSwapFile);
            grnWin.mainView.image.assign(srcWin[0].mainView.image);
            grnWin.mainView.endProcess();
         }

         if(data.extractBlu)
         {
            srcWin[0].mainView.image.selectedChannel = 2;
            bluWin.mainView.beginProcess(UndoFlag_NoSwapFile);
            bluWin.mainView.image.assign(srcWin[0].mainView.image);
            bluWin.mainView.endProcess();
         }

         //build the output file paths
         var drv = "";
         var dir = "";
         var ext = data.opfExt;
         var prefix = data.redOPFPrefix;
         var postfix = data.redOPFPostfix;
         var name = "";
         var redPath = "";
         var grnPath = "";
         var bluPath = "";

         if(data.extractRed)
         {
            if(data.redOPD.length == 0)
            {
               drv = File.extractDrive(data.inputFiles[i]);
               dir = drv + File.extractDirectory(data.inputFiles[i]);
            }
            else
               dir = data.redOPD;
            if(dir.charAt(dir.length-1) != '/')
               dir += "/";
            name = File.extractName(data.inputFiles[i]);
            redPath = dir + prefix + name + postfix + ext;
         }

         if(data.extractGrn)
         {
            if(data.grnOPD.length == 0)
            {
               drv = File.extractDrive(data.inputFiles[i]);
               dir = drv + File.extractDirectory(data.inputFiles[i]);
            }
            else
               dir = data.grnOPD;
            if(dir.charAt(dir.length-1) != '/')
               dir += "/";
            prefix = data.grnOPFPrefix;
            postfix = data.grnOPFPostfix;
            name = File.extractName(data.inputFiles[i]);
            grnPath = dir + prefix + name + postfix + ext;
         }

         if(data.extractBlu)
         {
            if(data.bluOPD.length == 0)
            {
               drv = File.extractDrive(data.inputFiles[i]);
               dir = drv + File.extractDirectory(data.inputFiles[i]);
            }
            else
               dir = data.bluOPD;
            if(dir.charAt(dir.length-1) != '/')
               dir += "/";
            prefix = data.bluOPFPrefix;
            postfix = data.bluOPFPostfix;
            name = File.extractName(data.inputFiles[i]);
            bluPath = dir + prefix + name + postfix + ext;
         }

         var keywords = srcWin[0].keywords;

         if ( data.extractRed )
         {
            updateKeyword( keywords, "FILTER", "R", "BatchChannelExtraction: Red channel" );
            redWin.keywords = keywords;
            redWin.saveAs( redPath, false, false, false, false );
            redWin.forceClose();
         }

         if ( data.extractGrn )
         {
            updateKeyword( keywords, "FILTER", "G", "BatchChannelExtraction: Green channel" );
            grnWin.keywords = keywords;
            grnWin.saveAs( grnPath, false, false, false, false );
            grnWin.forceClose();
         }

         if ( data.extractBlu )
         {
            updateKeyword( keywords, "FILTER", "B", "BatchChannelExtraction: Blue channel" );
            bluWin.keywords = keywords;
            bluWin.saveAs( bluPath, false, false, false, false );
            bluWin.forceClose();
         }

         srcWin[0].forceClose();
      }

      console.writeln( "<end><cbr><br>Channel extraction complete: ", (data.ipCount - errors), " succeeded, ", errors, " failed" );
      console.writeln( "Process time: ", T.text );
   }
}
var engine = new ChannelExtractionEngine();

//////////// Main Dialog %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

function mainDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   var ttStr = "";

   //script info label
   this.helpLabel = new Label(this);
   with(this.helpLabel)
   {
      frameStyle = FrameStyle_Box;
      margin = 4;
      wordWrapping = true;
      useRichText = true;
      text = "<p><b>" + TITLE + " v" + VERSION + "</b><br/>" +
            "A script to extract and save the red,  green and blue " +
            "channels of multiple RGB images.</p>" +
            "<p>Copyright &copy; 2010-2017 S J Brown<br/>" +
            "Contributions: Copyright &copy; 2017 Michael Covington</p>"
   }

   //input controls
   this.inputFiles_TreeBox = new TreeBox(this);
   with(this.inputFiles_TreeBox)
   {
      alternateRowColor = true;
      multipleSelection = false;
      headerVisible = false;
      numberOfColumns = 3;
      showColumn(2, false);
      rootDecoration = false;
      //setScaledMinSize(500, 200);  // width, height
      setScaledFixedSize(500, 150);
      setColumnWidth(0, this.logicalPixelsToPhysical( 50 ));
      setColumnWidth(1, this.logicalPixelsToPhysical( 500 ));
   }

   ttStr = "Add files to the input list.";
   this.addFiles_PushButton = new pushButton(this, btnText[0], "", ttStr);
   this.addFiles_PushButton.onClick = function()
   {
      var ofd = new OpenFileDialog;
      ofd.multipleSelections = true;
      ofd.caption = "Select Images";
      ofd.loadImageFilters();

      if (ofd.execute())
      {
         this.dialog.inputFiles_TreeBox.clear();
         this.dialog.inputFiles_TreeBox.canUpdate = false;
         for(var i = 0, n = ofd.fileNames.length; i < n; ++i)
         {
            data.inputFiles.push(ofd.fileNames[i]);
            ++data.ipCount;
         }

         data.inputFiles.sort();

         for(var i = 0, n = data.ipCount; i < n; ++i)
         {
            var node = new TreeBoxNode(this.dialog.inputFiles_TreeBox);
            node.checkable = true;
            node.checked = false;
            node.setText(0, (i+1).toString());
            node.setText(1, File.extractName(data.inputFiles[i]));
            node.setText(2, data.inputFiles[i]);
         }
         this.dialog.inputFiles_TreeBox.canUpdate = true;
      }
   }

   ttStr = "Select all of the listed input files.";
   this.selectAll_PushButton = new pushButton(this, btnText[9], "", ttStr);
   this.selectAll_PushButton.onClick = function()
   {
      for(var i = 0, n = this.dialog.inputFiles_TreeBox.numberOfChildren; i < n; ++i)
         this.dialog.inputFiles_TreeBox.child(i).checked = true;
   }

   ttStr = "Invert the input files selection.";
   this.invertSelected_PushButton = new pushButton(this, btnText[5], "", ttStr);
   this.invertSelected_PushButton.onClick = function()
   {
      for(var i = 0, n = this.dialog.inputFiles_TreeBox.numberOfChildren; i < n; ++i)
         this.dialog.inputFiles_TreeBox.child(i).checked =
            !this.dialog.inputFiles_TreeBox.child(i).checked;
   }

   ttStr = "Remove the selected files from the input list.";
   this.removeSelected_PushButton = new pushButton(this, btnText[7], "", ttStr);
   this.removeSelected_PushButton.onClick = function()
   {
      for(var i = this.dialog.inputFiles_TreeBox.numberOfChildren; --i >= 0; )
         if(this.dialog.inputFiles_TreeBox.child(i).checked)
            this.dialog.inputFiles_TreeBox.remove(i);

      data.inputFiles.length = 0;
      data.ipCount = 0;
      for(var i = 0, n = this.dialog.inputFiles_TreeBox.numberOfChildren; i < n; ++i)
      {
         this.dialog.inputFiles_TreeBox.child(i).setText(0, (i+1).toString());
         data.inputFiles.push(this.dialog.inputFiles_TreeBox.child(i).text(2));
         ++data.ipCount;
      }
   }

   ttStr = "Remove all of the input files from the list.";
   this.clear_PushButton = new pushButton(this, btnText[2], "", ttStr);
   this.clear_PushButton.onClick = function()
   {
      this.dialog.inputFiles_TreeBox.clear();
      data.inputFiles.length = 0;
      data.ipCount = 0;
   }

   this.inputBtns_Sizer = new VerticalSizer;
   with(this.inputBtns_Sizer)
   {
      margin = 4;
      spacing = 6;
      add(this.addFiles_PushButton);
      add(this.selectAll_PushButton);
      add(this.invertSelected_PushButton);
      add(this.removeSelected_PushButton);
      add(this.clear_PushButton);
      addStretch();
   }

   this.inputControls_GroupBox = new GroupBox(this);
   with(this.inputControls_GroupBox)
   {
      title = "Input Controls";
      sizer = new HorizontalSizer;
      sizer.margin = 4;
      sizer.spacing = 6;
      sizer.add(this.inputFiles_TreeBox);
      sizer.add(this.inputBtns_Sizer);
   }

   //clear console option checkbox
   ttStr = "Enabling this option will clear the console of all previous output"+
               " leaving only the output from the extraction engine.<br>";
   this.clearConsole_CheckBox = new checkBox(this, "Clear Console", false, ttStr);
   this.clearConsole_CheckBox.checked = data.clearConsole;
   this.clearConsole_CheckBox.onCheck = function()
   {  data.clearConsole = !data.clearConsole;   }

   this.clearConsoleCheckBox_Sizer = new HorizontalSizer;
   with(this.clearConsoleCheckBox_Sizer)
   {
      margin = 4;
      spacing = 6;
      add(this.clearConsole_CheckBox);
      addStretch();
   }

   //output controls
   this.redOPD_Label = new labelBox(this, "Red Output Dir", TextAlign_VertCenter, 100);
   ttStr = "Red channel output directory.";
   this.redOPD_Edit = new editBox(this, "", true, FrameStyle_Box, 450);
   this.redOPD_Edit.toolTip = ttStr;
   ttStr = "Select the red channel output directory.<br>" +
            "If none is selected output will be placed in the " +
            "input file directory.";
   this.redOPDEdit_Button = new toolButton(this, btnIcon[4], ttStr);
   this.redOPDEdit_Button.onClick = function()
   {
      var gdd = new GetDirectoryDialog;
      gdd.caption = "Select Red Output Directory";
      gdd.initialPath = data.redOPD;

      if ( gdd.execute() )
      {
         var dir = gdd.directory;
         if(dir.charAt(dir.length-1) != '/')
            dir += "/";
         data.redOPD = dir;
         this.dialog.redOPD_Edit.text = dir;
      }
   }

   this.redOPD_Sizer = new HorizontalSizer;
   with(this.redOPD_Sizer)
   {
      margin = 0; // was 4;
      spacing = 6;
      addStretch();
      add(this.redOPD_Label);
      add(this.redOPD_Edit);
      add(this.redOPDEdit_Button);
   }

   ttStr = "Select the default red output file prefix.";
   this.defaultRedOPFPrefix_Button = new radioButton(this, "Default Prefix", false, ttStr);
   this.defaultRedOPFPrefix_Button.onClick = function(checked)
   {
      if(checked)
      {
         data.redOPFPrefix = DEFAULT_REDPREFIX;
         this.dialog.redOPFPrefix_Edit.text = data.redOPFPrefix;
         data.redOPFPostfix = "";
         this.dialog.redOPFPostfix_Edit.text = data.redOPFPostfix;
      }
   }

   ttStr = "Select the default red output file postfix.";
   this.defaultRedOPFPostfix_Button = new radioButton(this, "Default Postfix", true, ttStr);
   this.defaultRedOPFPostfix_Button.onClick = function(checked)
   {
      if(checked)
      {
         data.redOPFPrefix = "";
         this.dialog.redOPFPrefix_Edit.text = data.redOPFPrefix;
         data.redOPFPostfix = DEFAULT_REDPOSTFIX;
         this.dialog.redOPFPostfix_Edit.text = data.redOPFPostfix;
      }
   }

   this.defaultRedOPFPP_GroupBox = new GroupBox(this);
   with(this.defaultRedOPFPP_GroupBox)
   {
      sizer = new HorizontalSizer;
      sizer.margin = 4;
      sizer.spacing = 6;
      sizer.add(this.defaultRedOPFPrefix_Button);
      sizer.addSpacing(10);
      sizer.add(this.defaultRedOPFPostfix_Button);
   }

   this.redOPFPrefix_Label = new labelBox(this, "Prefix:", TextAlign_VertCenter, 120);
   this.redOPFPrefix_Edit = new editBox(this, "", false, FrameStyle_Box, 50);
   this.redOPFPrefix_Edit.setScaledFixedWidth(80);
   this.redOPFPrefix_Edit.text = data.redOPFPrefix;
   ttStr = "Red output file prefix."
   this.redOPFPrefix_Edit.toolTip = ttStr;
   this.redOPFPrefix_Edit.onTextUpdated = function(text)
   {  data.redOPFPrefix = text;   }

   this.redOPFPostfix_Label = new labelBox(this, "Postfix:", TextAlign_VertCenter, 120);
   this.redOPFPostfix_Edit = new editBox(this, "", false, FrameStyle_Box, 50);
   this.redOPFPostfix_Edit.setScaledFixedWidth(80);
   this.redOPFPostfix_Edit.text = data.redOPFPostfix;
   ttStr = "Red output file postfix."
   this.redOPFPostfix_Edit.toolTip = ttStr;
   this.redOPFPostfix_Edit.onTextUpdated = function(text)
   {  data.redOPFPostfix = text;   }

   this.redOPFPP_Sizer = new HorizontalSizer;
   with(this.redOPFPP_Sizer)
   {
      margin = 0; // was 4;
      spacing = 6;
      addSpacing(4); // new
      add(this.defaultRedOPFPP_GroupBox);
      addStretch();
      add(this.redOPFPrefix_Label);
      add(this.redOPFPrefix_Edit);
      addSpacing(30);
      add(this.redOPFPostfix_Label);
      add(this.redOPFPostfix_Edit);
      addSpacing(31);
   }

   this.redOutput_GroupBox = new GroupBox(this);
   with(this.redOutput_GroupBox)
   {
      title = "Enable Red Channel";
      titleCheckBox = true;
      checked = data.extractRed;
      sizer = new VerticalSizer;
      sizer.margin = 4;
      sizer.spacing = 6;
      sizer.add(this.redOPD_Sizer);
      sizer.addSpacing(-10); // new
      sizer.add(this.redOPFPP_Sizer);

      onCheck = function()
      {  data.extractRed = !data.extractRed; }
   }

   this.grnOPD_Label = new labelBox(this, "Green Output Dir", TextAlign_VertCenter, 120);
   ttStr = "Green channel output directory.";
   this.grnOPD_Edit = new editBox(this, "", true, FrameStyle_Box, 450);
   this.grnOPD_Edit.toolTip = ttStr;
   ttStr = "Select the green channel output directory.<br>" +
            "If none is selected output will be placed in the " +
            "input file directory.";
   this.grnOPDEdit_Button = new toolButton(this, btnIcon[4], ttStr);
   this.grnOPDEdit_Button.onClick = function()
   {
      var gdd = new GetDirectoryDialog;
      gdd.caption = "Select Green Output Directory";
      gdd.initialPath = data.grnOPD;

      if ( gdd.execute() )
      {
         var dir = gdd.directory;
         if(dir.charAt(dir.length-1) != '/')
            dir += "/";
         data.grnOPD = dir;
         this.dialog.grnOPD_Edit.text = dir;
      }
   }

   this.grnOPD_Sizer = new HorizontalSizer;
   with(this.grnOPD_Sizer)
   {
      margin = 4;
      spacing = 6;
      addStretch();
      add(this.grnOPD_Label);
      add(this.grnOPD_Edit);
      add(this.grnOPDEdit_Button);
   }

   ttStr = "Select the default green output file prefix.";
   this.defaultGrnOPFPrefix_Button = new radioButton(this, "Default Prefix", false, ttStr);
   this.defaultGrnOPFPrefix_Button.onClick = function(checked)
   {
      if(checked)
      {
         data.grnOPFPrefix = DEFAULT_GRNPREFIX;
         this.dialog.grnOPFPrefix_Edit.text = data.grnOPFPrefix;
         data.grnOPFPostfix = "";
         this.dialog.grnOPFPostfix_Edit.text = data.grnOPFPostfix;
      }
   }

   ttStr = "Select the default green output file postfix.";
   this.defaultGrnOPFPostfix_Button = new radioButton(this, "Default Postfix", true, ttStr);
   this.defaultGrnOPFPostfix_Button.onClick = function(checked)
   {
      if(checked)
      {
         data.grnOPFPrefix = "";
         this.dialog.grnOPFPrefix_Edit.text = data.grnOPFPrefix;
         data.grnOPFPostfix = DEFAULT_GRNPOSTFIX;
         this.dialog.grnOPFPostfix_Edit.text = data.grnOPFPostfix;
      }
   }

   this.defaultGrnOPFPP_GroupBox = new GroupBox(this);
   with(this.defaultGrnOPFPP_GroupBox)
   {
      sizer = new HorizontalSizer;
      sizer.margin = 4;
      sizer.spacing = 6;
      sizer.add(this.defaultGrnOPFPrefix_Button);
      sizer.addSpacing(10);
      sizer.add(this.defaultGrnOPFPostfix_Button);
   }

   this.grnOPFPrefix_Label = new labelBox(this, "Prefix:", TextAlign_VertCenter, 120);
   this.grnOPFPrefix_Edit = new editBox(this, "", false, FrameStyle_Box, 50);
   this.grnOPFPrefix_Edit.setScaledFixedWidth(80);
   this.grnOPFPrefix_Edit.text = data.grnOPFPrefix;
   ttStr = "Green output file prefix."
   this.grnOPFPrefix_Edit.toolTip = ttStr;
   this.grnOPFPrefix_Edit.onTextUpdated = function(text)
   {  data.grnOPFPrefix = text;   }

   this.grnOPFPostfix_Label = new labelBox(this, "Postfix:", TextAlign_VertCenter, 120);
   this.grnOPFPostfix_Edit = new editBox(this, "", false, FrameStyle_Box, 50);
   this.grnOPFPostfix_Edit.setScaledFixedWidth(80);
   this.grnOPFPostfix_Edit.text = data.grnOPFPostfix;
   ttStr = "Green output file postfix."
   this.grnOPFPostfix_Edit.toolTip = ttStr;
   this.grnOPFPostfix_Edit.onTextUpdated = function(text)
   {  data.grnOPFPostfix = text;   }

   this.grnOPFPP_Sizer = new HorizontalSizer;
   with(this.grnOPFPP_Sizer)
   {
      margin = 0; // was 4;
      spacing = 6;
      addSpacing(4); // new
      add(this.defaultGrnOPFPP_GroupBox);
      addStretch();
      add(this.grnOPFPrefix_Label);
      add(this.grnOPFPrefix_Edit);
      addSpacing(30);
      add(this.grnOPFPostfix_Label);
      add(this.grnOPFPostfix_Edit);
      addSpacing(31);
   }

   this.grnOutput_GroupBox = new GroupBox(this);
   with(this.grnOutput_GroupBox)
   {
      title = "Enable Green Channel";
      titleCheckBox = true;
      checked = data.extractGrn;
      sizer = new VerticalSizer;
      sizer.margin = 4;
      sizer.spacing = 6;
      sizer.add(this.grnOPD_Sizer);
      sizer.addSpacing(-10); // new
      sizer.add(this.grnOPFPP_Sizer);

      onCheck = function()
      {  data.extractGrn = !data.extractGrn; }
   }

   this.bluOPD_Label = new labelBox(this, "Blue Output Dir", TextAlign_VertCenter, 100);
   ttStr = "Blue channel output directory.";
   this.bluOPD_Edit = new editBox(this, "", true, FrameStyle_Box, 450);
   this.bluOPD_Edit.toolTip = ttStr;
   ttStr = "Select the blue channel output directory.<br>" +
            "If none is selected output will be placed in the " +
            "input file directory.";
   this.bluOPDEdit_Button = new toolButton(this, btnIcon[4], ttStr);
   this.bluOPDEdit_Button.onClick = function()
   {
      var gdd = new GetDirectoryDialog;
      gdd.caption = "Select Blue Output Directory";
      gdd.initialPath = data.bluOPD;

      if ( gdd.execute() )
      {
         var dir = gdd.directory;
         if(dir.charAt(dir.length-1) != '/')
            dir += "/";
         data.bluOPD = dir;
         this.dialog.bluOPD_Edit.text = dir;
      }
   }

   this.bluOPD_Sizer = new HorizontalSizer;
   with(this.bluOPD_Sizer)
   {
      margin = 4;
      spacing = 6;
      addStretch();
      add(this.bluOPD_Label);
      add(this.bluOPD_Edit);
      add(this.bluOPDEdit_Button);
   }

   ttStr = "Select the default blue output file prefix.";
   this.defaultBluOPFPrefix_Button = new radioButton(this, "Default Prefix", false, ttStr);
   this.defaultBluOPFPrefix_Button.onClick = function(checked)
   {
      if(checked)
      {
         data.bluOPFPrefix = DEFAULT_BLUPREFIX;
         this.dialog.bluOPFPrefix_Edit.text = data.bluOPFPrefix;
         data.bluOPFPostfix = "";
         this.dialog.bluOPFPostfix_Edit.text = data.bluOPFPostfix;
      }
   }

   ttStr = "Select the default blue output file postfix.";
   this.defaultBluOPFPostfix_Button = new radioButton(this, "Default Postfix", true, ttStr);
   this.defaultBluOPFPostfix_Button.onClick = function(checked)
   {
      if(checked)
      {
         data.bluOPFPrefix = "";
         this.dialog.bluOPFPrefix_Edit.text = data.bluOPFPrefix;
         data.bluOPFPostfix = DEFAULT_BLUPOSTFIX;
         this.dialog.bluOPFPostfix_Edit.text = data.bluOPFPostfix;
      }
   }

   this.defaultBluOPFPP_GroupBox = new GroupBox(this);
   with(this.defaultBluOPFPP_GroupBox)
   {
      sizer = new HorizontalSizer;
      sizer.margin = 4;
      sizer.spacing = 6;
      sizer.add(this.defaultBluOPFPrefix_Button);
      sizer.addSpacing(10);
      sizer.add(this.defaultBluOPFPostfix_Button);
   }

   this.bluOPFPrefix_Label = new labelBox(this, "Prefix:", TextAlign_VertCenter, 120);
   this.bluOPFPrefix_Edit = new editBox(this, "", false, FrameStyle_Box, 50);
   this.bluOPFPrefix_Edit.setScaledFixedWidth(80);
   this.bluOPFPrefix_Edit.text = data.bluOPFPrefix;
   ttStr = "Blue output file prefix."
   this.bluOPFPrefix_Edit.toolTip = ttStr;
   this.bluOPFPrefix_Edit.onTextUpdated = function(text)
   {  data.bluOPFPrefix = text;   }

   this.bluOPFPostfix_Label = new labelBox(this, "Postfix:", TextAlign_VertCenter, 120);
   this.bluOPFPostfix_Edit = new editBox(this, "", false, FrameStyle_Box, 50);
   this.bluOPFPostfix_Edit.setScaledFixedWidth(80);
   this.bluOPFPostfix_Edit.text = data.bluOPFPostfix;
   ttStr = "Blue output file postfix."
   this.bluOPFPostfix_Edit.toolTip = ttStr;
   this.bluOPFPostfix_Edit.onTextUpdated = function(text)
   {  data.bluOPFPostfix = text;   }

   this.bluOPFPP_Sizer = new HorizontalSizer;
   with(this.bluOPFPP_Sizer)
   {
      margin = 0; // was 4;
      spacing = 6;
      addSpacing(4); // new
      add(this.defaultBluOPFPP_GroupBox);
      addStretch();
      add(this.bluOPFPrefix_Label);
      add(this.bluOPFPrefix_Edit);
      addSpacing(30);
      add(this.bluOPFPostfix_Label);
      add(this.bluOPFPostfix_Edit);
      addSpacing(31);
   }

   this.bluOutput_GroupBox = new GroupBox(this);
   with(this.bluOutput_GroupBox)
   {
      title = "Enable Blue Channel";
      titleCheckBox = true;
      checked = data.extractBlu;
      sizer = new VerticalSizer;
      sizer.margin = 4;
      sizer.spacing = 6;
      sizer.add(this.bluOPD_Sizer);
      sizer.addSpacing(-10); // new
      sizer.add(this.bluOPFPP_Sizer);

      onCheck = function()
      {  data.extractBlu = !data.extractBlu; }
   }

   this.sampleFormat_Label = new labelBox(this, "Sample Format :", TextAlign_VertCenter, 120);
   this.sampleFormat_ComboBox = new ComboBox(this);
   with(this.sampleFormat_ComboBox)
   {
      editEnabled = false;
      setScaledFixedWidth(150);
      for(var i = 0, n = sampFrmt.length; i < n; ++i)
         addItem(sampFrmt[i]);
      ttStr = "Select the output file format.";
      toolTip = ttStr;

      //borrowed from 'BatchFormatConversion' script
      onItemSelected = function( index )
      {
         if ( (data.forceSampleFormat = index > 0) != false )
            switch ( index )
            {
            case 1:
               data.bitsPerSample = 8;
               data.floatSample = false;
               break;
            case 2:
               data.bitsPerSample = 16;
               data.floatSample = false;
               break;
            case 3:
               data.bitsPerSample = 32;
               data.floatSample = false;
               break;
            case 4:
               data.bitsPerSample = 32;
               data.floatSample = true;
               break;
            case 5:
               data.bitsPerSample = 64;
               data.floatSample = true;
               break;
            default: // ?
               break;
            }
      }
   }

   this.opfExt_Label = new labelBox(this, "Extension:", TextAlign_VertCenter, 120);
   this.opfExt_Edit = new editBox(this, "", false, FrameStyle_Box, 50);
   this.opfExt_Edit.setScaledFixedWidth(80);
   this.opfExt_Edit.text = data.opfExt;
   ttStr = "Output file extension."
   this.opfExt_Edit.toolTip = ttStr;
   //borrowed from 'BatchFormatConversion' script
   this.opfExt_Edit.onEditCompleted = function()
   {
      // Image extensions are always lowercase in PI/PCL.
      var ext = this.text.trim().toLowerCase();

      // Use the default extension if empty.
      // Ensure that ext begins with a dot character.
      if ( ext.length == 0 || ext == '.' )
         ext = DEFAULT_EXTENSION;
      else if ( ext.charAt( 0 ) != '.' )
         ext = '.' + ext;

      this.text = data.opfExt = ext;
   }

   this.sampleFormat_Sizer = new HorizontalSizer;
   with(this.sampleFormat_Sizer)
   {
      margin = 4;
      spacing = 6;
      addStretch();
      add(this.sampleFormat_Label);
      add(this.sampleFormat_ComboBox);
      addSpacing(30);
      add(this.opfExt_Label);
      add(this.opfExt_Edit);
       addSpacing(35);
   }

   this.outputControls_GroupBox = new GroupBox(this);
   with(this.outputControls_GroupBox)
   {
      title = "Output Controls";
      sizer = new VerticalSizer;
      sizer.margin = 4;
      sizer.spacing = 6;
      sizer.add(this.redOutput_GroupBox);
      sizer.add(this.grnOutput_GroupBox);
      sizer.add(this.bluOutput_GroupBox);
      sizer.add(this.sampleFormat_Sizer);
   }

   //dialog control buttons
   ttStr = "Run the extraction engine for the selected input files.";
   this.ok_Button = new pushButton(this, btnText[4], "", ttStr);
   this.ok_Button.onClick = function()
   {
      this.dialog.ok();
   }

   ttStr = "Close the Batch File Extraction script.";
   this.cancel_Button = new pushButton(this, btnText[1], "", ttStr);
   this.cancel_Button.onClick = function()
   {
      this.dialog.cancel();
   }

   //dialog control buttons sizer
   this.buttons_Sizer = new HorizontalSizer;
   with(this.buttons_Sizer)
   {
      spacing = 6;
      addStretch();
      add( this.ok_Button );
      add( this.cancel_Button );
   }

   //main dialog sizers

   this.sizer = new VerticalSizer;
   with(this.sizer)
   {
      margin = 6;
      spacing = 6;
      add( this.helpLabel );
      addSpacing( 4 );
      add(this.inputControls_GroupBox);
      add(this.clearConsoleCheckBox_Sizer);
      addSpacing(10);
      add(this.outputControls_GroupBox);
      //this.imgSetAccess_GroupBox.hide();
      add(this.buttons_Sizer);
   }

   this.windowTitle = TITLE + " Script";
   this.adjustToContents();

   /*this.onShow = function()
   {
      var p = new Point(this.dialog.position);
      //console.writeln(p);
      p.moveBy(-100, -150);
      this.dialog.position = p;
      this.dialog.update();
      //console.writeln(p);
   }*/
}
mainDialog.prototype = new Dialog;
var maindlg = new mainDialog();

function main()
{
   console.hide();

   // Show our dialog box, quit if cancelled.
   for ( ;; )
   {
      if (maindlg.execute())
      {
         if(data.inputFiles.length == 0)
         {
            var msgStr = "<p>There are no input files listed.</p>" +
                           "<p>Do you wish to continue?</p>";
            var msg = new MessageBox(msgStr, TITLE, StdIcon_Error, StdButton_Yes, StdButton_No);
            if(msg.execute() == StdButton_Yes)
               continue;
            else
               break;
         }
         else
         {
            console.show();
            processEvents();
            engine.execute();
            break;
         }
      }

      break;
   }

   //console.hide();
}

main();

// ----------------------------------------------------------------------------
// EOF BatchChannelExtraction.js - Released 2018-12-27T15:17:02Z
