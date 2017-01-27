// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// AcquisitionPlanner.js - Released 2016/xx/xx 15:01:20 UTC
// ----------------------------------------------------------------------------
//
//
// Copyright (c) 2009-2015 Pleiades Astrophoto S.L.
// Written by Juan Conejero (PTeam)
//
// Redistribution and use in both source and binary forms, with or without
// modification, is permitted provided that the following conditions are met:
//
// 1. All redistributions of source code must retain the above copyright
//    notice, this list of conditions and the following disclaimer.
//
// 2. All redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
//
// 3. Neither the names "PixInsight" and "Pleiades Astrophoto", nor the names
//    of their contributors, may be used to endorse or promote products derived
//    from this software without specific prior written permission. For written
//    permission, please contact info@pixinsight.com.
//
// 4. All products derived from this software, in any form whatsoever, must
//    reproduce the following acknowledgment in the end-user documentation
//    and/or other materials provided with the product:
//
//    "This product is based on software from the PixInsight project, developed
//    by Pleiades Astrophoto and its contributors (http://pixinsight.com/)."
//
//    Alternatively, if that is where third-party acknowledgments normally
//    appear, this acknowledgment must be reproduced in the product itself.
//
// THIS SOFTWARE IS PROVIDED BY PLEIADES ASTROPHOTO AND ITS CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
// TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
// PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL PLEIADES ASTROPHOTO OR ITS
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
// EXEMPLARY OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, BUSINESS
// INTERRUPTION; PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; AND LOSS OF USE,
// DATA OR PROFITS) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
// ----------------------------------------------------------------------------

/*
 * TODO
 *  - add coordinate search dialog to target list
 *  - add synch action
 */


#feature-id    Batch Processing > Batch Frame Acquisition

#feature-info  An acquisition planner utility.

#include <pjsr/FrameStyle.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/DataType.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/UndoFlag.jsh>
//#include <pjsr/NumericControl.jsh>

#define USE_SOLVER_LIBRARY true
#define SETTINGS_MODULE "ACQUISITION"
#define STAR_CSV_FILE   File.systemTempDirectory + "/stars.csv"
#define TITLE "Batch Frame Acquisition"
#include "../AdP/WCSmetadata.jsh"
#include "../AdP/AstronomicalCatalogs.jsh"
#include "../AdP/CommonUIControls.js"
#include "../AdP/ImageSolver.js"
#include "../AdP/SearchCoordinatesDialog.js"


#include "CoordUtils.jsh"
#include "INDI-helper.jsh"

#define VERSION "0.1.0"


/*
 * Batch Format Conversion engine
 */
function BatchFrameAcquisitionEngine()
{
   this.deviceController = new INDIDeviceController;

   this.timer = new ElapsedTime;

   this.mountDevice          = "";
   this.ccdDevice            = "";
   this.filterWheelDevice    = "";
   this.extFilterWheelDevice = ""; // external filter wheel device
   this.focuserDevice        = "";

   // mount parameters
   this.doMove                   = false;
   this.automaticMove            = false;
   this.center                   = false;
   this.align                    = false;
   this.computeApparentPos       = false;
   this.alignModelFile           = "";
   this.telescopeFocalLen        = 0;

   // camera parameters
   this.ccdPixelSize         = 0;
   this.binningX             = { idx:0, text:"1" };
   this.binningY             = { idx:0, text:"1" };
   this.frameType            = { idx:0, text:"Light" };
   this.filterKeys           = [];
   this.filterDict           = {};
   this.exposureTime         = 0.001;
   this.exposureDelay        = 0.0;
   this.numOfFrames          = 1;
   this.openClientImages     = true;
   this.saveClientImages     = true;
   this.clientDownloadDir    = "";
   this.clientFileTemplate   = "";
   this.clientOutputHints    = "";
   this.overwriteClientFiles = false;
   this.serverDownloadDir    = "";
   this.serverFileTemplate   = "";
   this.uploadMode           = { idx:0, text:"Client only" };

   // processing parameters
   // fraction of exposure time spent for the image used to center the object
   this.centerImageExpTimeFraction = 10;

   // target list
   this.targets = [];

   // worklist
   this.worklist = [];



   this.executeController = function()
   {
      if ( !this.deviceController.executeGlobal() ){
        console.criticalln("INDIDeviceController.executeGlobal() failed");
        throw new Error( "INDIDeviceController.executeGlobal() failed" );
      }
   };

   this.restartTimer = function()
   {
      this.timer.reset();
   };

   this.timeout = function()
   {
      if ( this.timer.value > 3 )planne
      {
         return true;
      }
      return false;
   };

   this.supportsFilter = function()
   {
      return this.filterWheelDevice != "" || this.extFilterWheelDevice != "";
   }

   this.getFilterWheelDeviceName = function ()
   {
      return (this.extFilterWheelDevice != "" ) ? this.extFilterWheelDevice : this.filterWheelDevice;
   }

   this.doesNotNeedFilter = function() {
      if (this.frameType.text == "Dark" || this.frameType.text == "Bias"){
         return true;
      }
      return false;
   }

   this.print = function ()
   {
      console.writeln("================================================");
      console.noteln("INDI devices:");
      console.writeln("Mount device:              " + this.mountDevice);
      console.writeln("Camera device:             " + this.ccdDevice);
      console.writeln("Filter device:             " + this.getFilterWheelDeviceName());
      console.writeln("Focus device:              " + this.focuserDevice);
      console.writeln("------------------------------------------------");
      console.noteln("Mount parameters:");
      console.writeln("Center:                    " + (this.center ? "true" : "false"));
      console.writeln("Compute apparent pos:      " + (this.computeApparentPos ? "true" : "false"));
      console.writeln("Alignment corr:            " + (this.align ? "true" : "false"));
      console.writeln("Alignment file:            " + this.alignModelFile);
      console.writeln("Telescope focal length:    " + this.telescopeFocalLen);
      console.writeln("------------------------------------------------");
      console.noteln("Camera parameters:");
      console.writeln("CCD pixel size             " + this.ccdPixelSize);
      console.writeln("Binning X:                 " + this.binningX.text);
      console.writeln("Binning Y:                 " + this.binningY.text);
      console.writeln("Frame type:                " + this.frameType.text);
      console.writeln("Exposure time:             " + this.exposureTime);
      console.writeln("Exposure delay:            " + this.exposureDelay);
      console.writeln("Save frames:               " + (this.saveClientImages ? "true" : "false"));
      console.writeln("Open frames:               " + (this.openClientImages ? "true" : "false"));
      console.writeln("Client download directory: " + this.clientDownloadDir);
      console.writeln("Client file template:      " + this.clientFileTemplate);
      console.writeln("Client output hints:       " + this.clientOutputHints);
      console.writeln("Overwrite client file:     " + (this.overwriteClientFiles ? "true" : "false"));
      console.writeln("Upload mode:               " + this.uploadMode.text);
      console.writeln("Server download directory: " + this.serverDownloadDir);
      console.writeln("Server file template:      " + this.serverFileTemplate);
      console.writeln("------------------------------------------------");
      console.noteln("Filter wheel parameters:");
      console.write(  "Filter:               ");
      for (var i = 0; i < this.filterKeys.length; ++i){
         console.write(this.filterKeys[i] + "("+  this.filterDict[this.filterKeys[i]]+  ")" + ", ");
      }
      console.writeln(" ");
      console.writeln("------------------------------------------------");
      console.noteln("Targets:");
      console.writeln(format("%-15s|%-15s|%-15s|","Name","Rightascension","Declination"));
      console.writeln("------------------------------------------------")
      for (var i = 0; i < this.targets.length; ++i){
         console.writeln(format("%-15s|% 2.12f|% 3.11f|",this.targets[i].name,this.targets[i].ra,this.targets[i].dec));
      }
      console.writeln("================================================");
   }

   this.createWorklist = function ()
   {
      if (this.targets.length == 0){
         (new MessageBox("You must specify at least one target", "Error",  StdIcon_Error)).execute();
         return [];
      }

      if (!this.doesNotNeedFilter() && this.filterKeys.length == 0){
         (new MessageBox("You must specify at least one filter", "Error",StdIcon_Error)).execute();
         return [];
      }

      if (this.doesNotNeedFilter()){
         this.filterKeys[0]             = "<no filter>";
         this.filterDict["<no filter>"] = -1;

      }

      this.worklist = [];
      var count = 0;
      for (var t = 0; t < this.targets.length; ++t){
         for (var f = 0; f < this.filterKeys.length; ++f){
            var item = {"targetName":"", "ra":0, "dec":0, "filterName":"", "filterID":-1, "binningX":0, "binningY":0, "expTime":0, "numOfFrames":0};
            item.targetName  = this.targets[t].name;
            item.ra          = this.targets[t].ra;
            item.dec         = this.targets[t].dec;
            item.filterName  = this.filterKeys[f];
            item.filterID    = this.filterDict[item.filterName];
            item.binningX    = this.binningX.idx + 1;
            item.binningY    = this.binningY.idx + 1;
            item.expTime     = this.exposureTime;
            item.numOfFrames = this.numOfFrames;
            this.worklist[count]  = item;
            count = count + 1;
         }
      }
      return this.worklist;
   }

   this.centerImage = function (window,mountController,currentBinningX)
   {

      var solver = new ImageSolver();

      solver.Init(window);
      solver.solverCfg.showStars = false;
      solver.solverCfg.showDistortion = false;
      solver.solverCfg.generateErrorImg = false;

      solver.metadata.xpixsz = currentBinningX * this.ccdPixelSize;
      solver.metadata.focal  = this.telescopeFocalLen;
      solver.metadata.resolution = (solver.metadata.focal > 0) ? solver.metadata.xpixsz / solver.metadata.focal * 0.18 / Math.PI : 0;
      if (solver.SolveImage(window))
      {
         // Print result
         console.writeln("===============================================================================");
         solver.metadata.Print();
         console.writeln("===============================================================================");

         // center object
         if (!mountController.executeOn(window.mainView)){
            return false;
         }
         return true;
      } else {
         return false;
      }
   }

   this.startProcessing = function (treeBox)
   {
      // configure mount controller
      var mountController = new INDIMount();
      mountController.deviceName                = this.mountDevice;
      mountController.computeApparentPosition   = this.computeApparentPos;
      mountController.enableAlignmentCorrection = this.align;
      mountController.alignmentModelFile        = this.alignModelFile;
      if (this.alignModelFile!=""){
         mountController.alignmentConfig = 127;
      }
      // unpark mount
      mountController.Command                   = 0; // Unpark
      mountController.executeGlobal();
      mountController.Command                   = 10; // Goto

      // configure camera controller
      var cameraController = new INDICCDFrame();
      cameraController.deviceName                = this.ccdDevice;
      cameraController.telescopeDeviceName       = this.mountDevice;
      cameraController.openClientImages          = this.openClientImages;
      cameraController.overwriteClientImages     = this.overwriteClientFiles;
      cameraController.saveClientImages          = this.saveClientImages;
      cameraController.clientDownloadDirectory   = this.clientDownloadDir;
      cameraController.serverUploadDirectory     = this.serverDownloadDir;
      cameraController.clientFileNameTemplate    = this.clientFileTemplate;
      cameraController.clientOutputFormatHints   = this.clientOutputHints;
      cameraController.uploadMode                = this.uploadMode.idx;

      // loop worklist items
      var previousTarget = "";
      for (var i = 0 ; i < this.worklist.length ; ++i){
         var node = treeBox.child(i);
         node.setIcon(5,":/bullets/bullet-ball-glass-yellow.png");
         // move to target
         mountController.targetRA  = this.worklist[i].ra;
         mountController.targetDec = this.worklist[i].dec;
         console.writeln(format("Moving to target %s", this.worklist[i].targetName));


         var isDifferentTarget = previousTarget!=this.worklist[i].targetName;
         if (isDifferentTarget && this.doMove  && !this.automaticMove && !(new MessageBox( "Goto next object ?", "Message", StdIcon_Question, StdButton_Yes, StdButton_No).execute() )) {
            break;
         }

         if (isDifferentTarget && this.doMove && !mountController.executeGlobal()){
            node.setIcon(5,":/bullets/bullet-ball-glass-red.png");
            break;
         }


         // start frame acquisition
         cameraController.objectName          = this.worklist[i].targetName;
         cameraController.binningX            = this.worklist[i].binningX;
         cameraController.binningY            = this.worklist[i].binningY;
         cameraController.exposureTime        = this.worklist[i].expTime;
         cameraController.exposureCount       = this.worklist[i].numOfFrames;
         cameraController.newImageIdTemplate  = format("%s_",this.worklist[i].targetName);
         cameraController.clientFileNameTemplate = format("%s_%s",this.worklist[i].targetName,this.clientFileTemplate);
         cameraController.serverFileNameTemplate = format("%s_%s",this.worklist[i].targetName,this.serverFileTemplate);
         if (this.supportsFilter() && this.worklist[i].filterID != -1){
            cameraController.externalFilterWheelDeviceName = this.extFilterWheelDevice;
            cameraController.filterSlot                    = this.worklist[i].filterID;
            cameraController.newImageIdTemplate            = format("%s_%s_",this.worklist[i].targetName,this.worklist[i].filterName);
            cameraController.clientFileNameTemplate        = format("%s_%s_%s",this.worklist[i].targetName,this.worklist[i].filterName,this.clientFileTemplate);
            cameraController.serverFileNameTemplate        = format("%s_%s_%s",this.worklist[i].targetName,this.worklist[i].filterName,this.serverFileTemplate);
         }
         if (isDifferentTarget && this.center){
            cameraController.saveClientImages = false;
            cameraController.openClientImages = true;
            cameraController.uploadMode.idx   = 0;
            cameraController.exposureTime     = this.worklist[i].expTime * this.centerImageExpTimeFraction;
            cameraController.exposureCount    = 1;

            if (!cameraController.executeGlobal()){
               node.setIcon(5,":/bullets/bullet-ball-glass-red.png");
               break;
            }

            var window = ImageWindow.activeWindow;
            if (!this.centerImage(window,mountController,this.worklist[i].binningX)){
               node.setIcon(5,":/bullets/bullet-ball-glass-red.png");
               //window.close();
               break;
            }

            cameraController.saveClientImages = this.saveClientImages;
            cameraController.openClientImages = this.openClientImages;
            cameraController.uploadMode       = this.uploadMode.idx;
            cameraController.exposureTime     = this.worklist[i].expTime ;
            cameraController.exposureCount    = this.worklist[i].numOfFrames;
            cameraController.binningX         = this.worklist[i].binningX;
            cameraController.binningY         = this.worklist[i].binningY;

            //window.close();
         }
         if (!cameraController.executeGlobal()){
            node.setIcon(5,":/bullets/bullet-ball-glass-red.png");
            break;
         }

         node.setIcon(5,":/bullets/bullet-ball-glass-green.png");
         previousTarget = this.worklist[i].targetName;
      }
   }
}
var engine = new BatchFrameAcquisitionEngine();

/*
 * Mount parameters dialog
 */
function MountParametersDialog(dialog)
{
   this.__base__ = Dialog;
   this.__base__();

   this.telescopeInfoFocalLength = 0;
   this.CCDInfoPixelSize         = 0;


   var labelWidth1 = this.font.width( "Apparent position correction" + 'T' );

   this.gotoMode_Label = new Label(this);
   this.gotoMode_Label.text = "Mount Goto mode:";
   this.gotoMode_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.gotoMode_Label.minWidth = labelWidth1;
   this.gotoMode_Label.toolTip = "<p>There are three Goto modes:</p> \
                                   <p><i>None:</i>  Do not move telescope if the target has changed. Especially do not move telescope for first target.</p> \
                                   <p><i>Interactive:</i>  Always ask the user before moving to the next object.</p>\
                                   <p><i>Automatic:</i>  Move to the next object automatically without asking the user.</p>";

   this.gotoMode_ComboBox = new ComboBox(this);
   this.gotoMode_ComboBox.addItem("None");
   this.gotoMode_ComboBox.addItem("Interactive");
   this.gotoMode_ComboBox.addItem("Automatic");
   this.gotoMode_ComboBox.toolTip = this.gotoMode_Label.toolTip ;
   this.gotoMode_ComboBox.onItemSelected = function ( index ) {
      this.dialog.enableGotoServices(index != "0");
      engine.doMove = (index != "0");
      engine.automaticMove = (index == "2");
   }



   this.centering_Label = new Label(this);
   this.centering_Label.text = "Center object:";
   this.centering_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.centering_Label.minWidth = labelWidth1;
   this.centering_Label.toolTip = "<p>Enable centering of targets by applying differential alignment correction.</p>";

   this.centering_Checkbox = new CheckBox(this);
   this.centering_Checkbox.toolTip = this.centering_Label.toolTip;


   this.centering_exposureTimeEdit = new NumericEdit( this );
   this.centering_exposureTimeEdit.label.text = "Center exposure time fraction:";
   this.centering_exposureTimeEdit.label.minWidth = labelWidth1;
   this.centering_exposureTimeEdit.setRange( 0.01, 1 );
   this.centering_exposureTimeEdit.setPrecision( 2 );
   this.centering_exposureTimeEdit.setValue( 0.1 );
   this.centering_exposureTimeEdit.toolTip = "<p>Fraction of exposure time applied for the image used to center the object</p>";
   this.centering_exposureTimeEdit.sizer.addStretch();
   this.centering_exposureTimeEdit.onValueUpdated = function( value )
   {
      engine.centerImageExpTimeFraction = value;
   };


   this.alignmentCorrection_Label = new Label(this);
   this.alignmentCorrection_Label.text = "Alignment correction:";
   this.alignmentCorrection_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.alignmentCorrection_Label.minWidth = labelWidth1;
   this.alignmentCorrection_Label.toolTip = "<p>Enable correction of telescope pointing misalignment.</p>";

   this.alignmentCorrection_Checkbox = new CheckBox(this);
   this.alignmentCorrection_Checkbox.toolTip = this.alignmentCorrection_Label.toolTip;

   this.computeApparentPos_Label = new Label(this);
   this.computeApparentPos_Label.text = "Apparent position correction";
   this.computeApparentPos_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.computeApparentPos_Label.minWidth = labelWidth1;
   this.computeApparentPos_Label.toolTip = "<p>Computes the apparent position of the target and corrects the target coordinates accordingly.</p>";

   this.computeApparentPos_Checkbox = new CheckBox(this);
   this.computeApparentPos_Checkbox.checked = true;
   this.computeApparentPos_Checkbox.toolTip = this.computeApparentPos_Label.toolTip;

   this.alignmentModel_Edit = new Edit(this);
   this.alignmentModel_Edit.text = "<select an alignment model file>";
   this.alignmentModel_Edit.toolTip = "<p>Specify file that defines the alignment model.</p>"

   this.alignmentFile_ToolButton = new ToolButton(this);
   this.alignmentFile_ToolButton.icon = ":/icons/select-file.png";
   this.alignmentFile_ToolButton.setScaledFixedSize(22, 22);
   this.alignmentFile_ToolButton.toolTip = "<p>Select the alignment file:</p>";
   this.alignmentFile_ToolButton.onClick = function ()
   {
      var ofd = new OpenFileDialog;
      ofd.multipleSelections = false;
      ofd.caption = "Select Alignment Model";
      ofd.filters = [["Alignment Model","*.csv"]];

      if ( ofd.execute() )
      {
         dialog.mountDialog.alignmentModel_Edit.text = ofd.fileNames[0];
      }
   }

   this.gotoMode_Sizer = new HorizontalSizer;
   this.gotoMode_Sizer.margin = 6;
   this.gotoMode_Sizer.spacing = 4;
   this.gotoMode_Sizer.add( this.gotoMode_Label );
   this.gotoMode_Sizer.add( this.gotoMode_ComboBox );

   this.centering_Sizer = new HorizontalSizer;
   this.centering_Sizer.margin = 6;
   this.centering_Sizer.spacing = 4;
   this.centering_Sizer.add( this.centering_Label );
   this.centering_Sizer.add( this.centering_Checkbox );

   this.alignmentCorrection_Sizer = new HorizontalSizer;
   this.alignmentCorrection_Sizer.margin = 6;
   this.alignmentCorrection_Sizer.spacing = 4;
   this.alignmentCorrection_Sizer.add( this.alignmentCorrection_Label );
   this.alignmentCorrection_Sizer.add( this.alignmentCorrection_Checkbox );

   this.apparentPosCorrection_Sizer = new HorizontalSizer;
   this.apparentPosCorrection_Sizer.margin = 6;
   this.apparentPosCorrection_Sizer.spacing = 4;
   this.apparentPosCorrection_Sizer.add( this.computeApparentPos_Label );
   this.apparentPosCorrection_Sizer.add( this.computeApparentPos_Checkbox );

   this.alignmentModel_Sizer = new HorizontalSizer;
   this.alignmentModel_Sizer.margin = 6;
   this.alignmentModel_Sizer.spacing = 4;
   this.alignmentModel_Sizer.add( this.alignmentModel_Edit );
   this.alignmentModel_Sizer.add( this.alignmentFile_ToolButton );
   //this.alignmentModel_Sizer.addStretch();


   this.mountParameters_GroupBox = new GroupBox(this);
   this.mountParameters_GroupBox.title = "Mount Device Parameters";
   this.mountParameters_GroupBox.sizer = new VerticalSizer;
   this.mountParameters_GroupBox.sizer.margin = 6;
   this.mountParameters_GroupBox.sizer.spacing = 4;
   this.mountParameters_GroupBox.sizer.add( this.gotoMode_Sizer);
   this.mountParameters_GroupBox.sizer.add( this.centering_Sizer);
   this.mountParameters_GroupBox.sizer.add( this.centering_exposureTimeEdit);
   this.mountParameters_GroupBox.sizer.add( this.apparentPosCorrection_Sizer );
   this.mountParameters_GroupBox.sizer.add( this.alignmentCorrection_Sizer );
   this.mountParameters_GroupBox.sizer.add( this.alignmentModel_Sizer );

   this.ok_Button = new PushButton( this );
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function()
   {
      this.dialog.ok();
   };

   this.cancel_Button = new PushButton( this );
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.ok_Button );
   this.buttons_Sizer.add( this.cancel_Button );

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 8;
   this.sizer.add( this.mountParameters_GroupBox );
   this.sizer.add( this.buttons_Sizer );


   this.windowTitle = "Mount Device Parameters";
   this.userResizable = true;
   this.adjustToContents();


   // methods
   this.enableGotoServices = function(enable) {
      this.centering_Label.enabled              = enable;
      this.centering_Checkbox.enabled           = enable;
      this.centering_exposureTimeEdit.enabled   = enable;
      this.alignmentCorrection_Label.enabled    = enable;
      this.alignmentCorrection_Checkbox.enabled = enable;
      this.computeApparentPos_Label.enabled     = enable;
      this.computeApparentPos_Checkbox.enabled  = enable;
      this.alignmentModel_Edit.enabled          = enable;
   }
   this.enableGotoServices(false);
}

// Our dialog inherits all properties and methods from the core Dialog object.
MountParametersDialog.prototype = new Dialog;

function CameraParametersDialog(dialog)
{
   this.__base__ = Dialog;
   this.__base__();

   //

   var labelWidth1 = this.font.width( "Upload Mode:" + 'T' );

   this.binningX_Label = new Label( this );
   this.binningX_Label.text = "Binning X:";
   this.binningX_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.binningX_Label.minWidth = labelWidth1;
   this.binningX_Label.toolTip = "<p>...</p>";

//
   this.binningX_ComboBox = new ComboBox(this);
   this.binningX_ComboBox.addItem("1");
   this.binningX_ComboBox.addItem("2");
   this.binningX_ComboBox.addItem("3");
   this.binningX_ComboBox.addItem("4");
   this.binningX_ComboBox.toolTip = "<p>...</p>";

//
   this.binningY_Label = new Label( this );
   this.binningY_Label.text = "Binning Y:";
   this.binningY_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.binningY_Label.minWidth = labelWidth1;
   this.binningY_Label.toolTip = "<p>...</p>";

//

   this.binningY_ComboBox = new ComboBox(this);
   this.binningY_ComboBox.addItem("1");
   this.binningY_ComboBox.addItem("2");
   this.binningY_ComboBox.addItem("3");
   this.binningY_ComboBox.addItem("4");
   this.binningY_ComboBox.toolTip = "<p>...</p>";
//

   this.binningX_Sizer = new HorizontalSizer;
   this.binningX_Sizer.spacing = 4;
   this.binningX_Sizer.add( this.binningX_Label );
   this.binningX_Sizer.add( this.binningX_ComboBox );
   this.binningX_Sizer.addStretch();

//

   this.binningY_Sizer = new HorizontalSizer;
   this.binningY_Sizer.spacing = 4;
   this.binningY_Sizer.add( this.binningY_Label );
   this.binningY_Sizer.add( this.binningY_ComboBox );
   this.binningY_Sizer.addStretch();

//
   this.frameType_Label = new Label( this );
   this.frameType_Label.text = "Frame Type";
   this.frameType_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.frameType_Label.minWidth = labelWidth1;
   this.frameType_Label.toolTip = "<p>...</p>";

//

   this.frameType_ComboBox = new ComboBox(this);
   this.frameType_ComboBox.addItem("Light");
   this.frameType_ComboBox.addItem("Bias");
   this.frameType_ComboBox.addItem("Dark");
   this.frameType_ComboBox.addItem("Flat");
   this.frameType_ComboBox.toolTip = "<p>...</p>";

//

   this.frameType_Sizer = new HorizontalSizer;
   this.frameType_Sizer.spacing = 4;
   this.frameType_Sizer.add( this.frameType_Label );
   this.frameType_Sizer.add( this.frameType_ComboBox );
   this.frameType_Sizer.addStretch();

//
   this.uploadMode_Label = new Label( this );
   this.uploadMode_Label.text = "Upload Mode";
   this.uploadMode_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.uploadMode_Label.minWidth = labelWidth1;
   this.uploadMode_Label.toolTip = "<p>...</p>";

//

   this.uploadMode_ComboBox = new ComboBox(this);
   this.uploadMode_ComboBox.addItem("Client only");
   this.uploadMode_ComboBox.addItem("Server only");
   this.uploadMode_ComboBox.addItem("Client and server");
   this.uploadMode_ComboBox.toolTip = "<p>...</p>";
   this.uploadMode_ComboBox.onItemSelected = function ( index ) {

      if ( index == 1 ) {
         this.dialog.openImages_Checkbox.checked  = false;
         this.dialog.client_GroupBox.enabled      = false;
      } else {
         this.dialog.client_GroupBox.enabled      = true;
         this.dialog.openImages_Checkbox.checked  = true;
      }

   }
   //

//

   this.uploadMode_Sizer = new HorizontalSizer;
   this.uploadMode_Sizer.spacing = 4;
   this.uploadMode_Sizer.add( this.uploadMode_Label );
   this.uploadMode_Sizer.add( this.uploadMode_ComboBox );
   this.uploadMode_Sizer.addStretch();

//
   this.exposureTimeEdit = new NumericEdit( this );
   this.exposureTimeEdit.label.text = "Exposure time:";
   this.exposureTimeEdit.label.minWidth = labelWidth1;
   this.exposureTimeEdit.setRange( 0.001, 60000 );
   this.exposureTimeEdit.setPrecision( 3 );
   this.exposureTimeEdit.setValue( 0.001 );
   this.exposureTimeEdit.toolTip = "<p>Exposure time in seconds.</p>";
   this.exposureTimeEdit.sizer.addStretch();
   this.exposureTimeEdit.onValueUpdated = function( value )
   {
      engine.exposureTime = value;
   };

   this.exposureDelayEdit = new NumericEdit( this );
   this.exposureDelayEdit.label.text = "Exposure delay:";
   this.exposureDelayEdit.label.minWidth = labelWidth1;
   this.exposureDelayEdit.setRange( 0, 600 );
   this.exposureDelayEdit.setPrecision( 3 );
   this.exposureDelayEdit.setValue( 0 );
   this.exposureDelayEdit.toolTip = "<p>Exposure delay in seconds.</p>";
   this.exposureDelayEdit.sizer.addStretch();
   this.exposureDelayEdit.onValueUpdated = function( value )
   {
      engine.exposureDelay = value;
   };

//
   this.numOfFramesEdit = new NumericEdit( this );
   this.numOfFramesEdit.label.text = "Number of frames:";
   this.numOfFramesEdit.label.minWidth = labelWidth1;
   this.numOfFramesEdit.setRange( 0, 600 );
   this.numOfFramesEdit.setReal( false );
   this.numOfFramesEdit.setValue( 1 );
   this.numOfFramesEdit.toolTip = "<p>Number of frames to be acquired.</p>";
   this.numOfFramesEdit.sizer.addStretch();
   this.numOfFramesEdit.onValueUpdated = function( value )
   {
      engine.numOfFrames = value;
   };

//

   this.exposureParameters_GroupBox = new GroupBox(this);
   this.exposureParameters_GroupBox.title = "Exposure";
   this.exposureParameters_GroupBox.sizer = new VerticalSizer;
   this.exposureParameters_GroupBox.sizer.margin = 6;
   this.exposureParameters_GroupBox.sizer.spacing = 4;
   this.exposureParameters_GroupBox.sizer.add( this.exposureTimeEdit);
   this.exposureParameters_GroupBox.sizer.add( this.exposureDelayEdit);
   this.exposureParameters_GroupBox.sizer.add( this.numOfFramesEdit);

   this.frameParameters_GroupBox = new GroupBox(this);
   this.frameParameters_GroupBox.title = "Frames";
   this.frameParameters_GroupBox.sizer = new VerticalSizer;
   this.frameParameters_GroupBox.sizer.margin = 6;
   this.frameParameters_GroupBox.sizer.spacing = 4;
   this.frameParameters_GroupBox.sizer.add( this.binningX_Sizer);
   this.frameParameters_GroupBox.sizer.add( this.binningY_Sizer);
   this.frameParameters_GroupBox.sizer.add( this.frameType_Sizer);
   this.frameParameters_GroupBox.sizer.add( this.uploadMode_Sizer);


//
   var labelWidth2 = this.font.width( "Download directory" + 'T' );

   this.openImages_Label = new Label( this );
   this.openImages_Label.text = "Open frames";
   this.openImages_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.openImages_Label.minWidth = labelWidth2;
   this.openImages_Label.toolTip = "<p>Load newly acquired frames as image windows.</p>";

   this.openImages_Checkbox = new CheckBox(this);
   this.openImages_Checkbox.checked = true;
   this.openImages_Checkbox.toolTip = "<p>Load newly acquired frames as image windows.</p>"

   this.openImages_Sizer = new HorizontalSizer;
   this.openImages_Sizer.margin = 6;
   this.openImages_Sizer.spacing = 4;
   this.openImages_Sizer.add(this.openImages_Label);
   this.openImages_Sizer.add(this.openImages_Checkbox);
   this.openImages_Sizer.addStretch();

//
   this.saveImages_Label = new Label( this );
   this.saveImages_Label.text = "Save frames";
   this.saveImages_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.saveImages_Label.minWidth = labelWidth2;
   this.saveImages_Label.toolTip = "<p>Save newly acquired frames to loal images files in XISF format.</p>";

   this.saveImages_Checkbox = new CheckBox(this);
   this.saveImages_Checkbox.toolTip = "<p>Save newly acquired frames to loal images files in XISF format.</p>";

   this.saveImages_Sizer = new HorizontalSizer;
   this.saveImages_Sizer.margin = 6;
   this.saveImages_Sizer.spacing = 4;
   this.saveImages_Sizer.add(this.saveImages_Label);
   this.saveImages_Sizer.add(this.saveImages_Checkbox);
   this.saveImages_Sizer.addStretch();
//

   this.clientDownloadDir_Label = new Label( this );
   this.clientDownloadDir_Label.text = "Download directory";
   this.clientDownloadDir_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.clientDownloadDir_Label.minWidth = labelWidth2;
   this.clientDownloadDir_Label.toolTip = "<p>The directory where newly acquired frames will be stored on the local filesystem.</p> \
                                           <p>If you leave this parameter empty, new files will be created on the current downloads directory, as defined by global settings.</p>";


   this.clientDownloadDir_Edit = new Edit(this);
   this.clientDownloadDir_Edit.toolTip = "<p>The directory where newly acquired frames will be stored on the local filesystem.</p> \
                                          <p>If you leave this parameter empty, new files will be created on the current downloads directory, as defined by global settings.</p>";

   this.clientDownloadDir_ToolButton = new ToolButton(this);
   this.clientDownloadDir_ToolButton.icon = ":/icons/select-file.png";
   this.clientDownloadDir_ToolButton.setScaledFixedSize(22, 22);
   this.clientDownloadDir_ToolButton.toolTip = "<p>Select download directory</p>";
   this.clientDownloadDir_ToolButton.onClick = function ()
   {
      var gdd = new GetDirectoryDialog;
      gdd.multipleSelections = false;
      gdd.caption = "Select download directory";


      if ( gdd.execute() )
      {
         dialog.cameraDialog.clientDownloadDir_Edit.text = gdd.directory;
      }
   }

   this.clientDownloadDir_Sizer = new HorizontalSizer;
   this.clientDownloadDir_Sizer.margin = 6;
   this.clientDownloadDir_Sizer.spacing = 4;
   this.clientDownloadDir_Sizer.add(this.clientDownloadDir_Label);
   this.clientDownloadDir_Sizer.add(this.clientDownloadDir_Edit);
   this.clientDownloadDir_Sizer.add(this.clientDownloadDir_ToolButton);


   this.clientFileTemplate_Label = new Label( this );
   this.clientFileTemplate_Label.text = "File template";
   this.clientFileTemplate_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.clientFileTemplate_Label.minWidth = labelWidth2;

   var clientFileTemplate_toolTip =  "<p>A file name template can be any valid text suitable to specify file names on the target filesystem, and may include \
      one or more <i>template specifiers</i>. Template specifiers are replaced automatically with selected tokens when \
      new frames are acquired. Supported template specifiers are the following:</p>\
      <p><table border=\"1\" cellspacing=\"1\" cellpadding=\"4\">\
      <tr>\
         <td><i>Template specifier</i></td>\
         <td width=\"90%\"><i>Will be replaced by</i></td>\
      </tr>\
      <tr>\
         <td>%f</td>\
         <td>Frame type (light, flat, dark, bias).</td>\
      </tr>\
      <tr>\
         <td>%b</td>\
         <td>CCD binning with the format HxV, where H and V are, respectively, the horizontal and vertical binning factors.</td>\
      </tr>\
      <tr>\
         <td>%e</td>\
         <td>Exposure time in seconds.</td>\
      </tr>\
      <tr>\
         <td>%F</td>\
         <td>Filter name</td>\
      </tr>\
      <tr>\
         <td>%T</td>\
         <td>CCD temperature in degrees Celsius.</td>\
      </tr>\
      <tr>\
         <td>%t</td>\
         <td>Acquisition date and time in the UTC time scale, ISO 8601 format.</td>\
      </tr>\
      <tr>\
         <td>%d</td>\
         <td>Acquisition date in the UTC time scale, yyyy-mm-dd format.</td>\
      </tr>\
      <tr>\
         <td>%n</td>\
         <td>The frame number starting from one, with three digits and left-padded with zeros.</td>\
      </tr>\
      <tr>\
         <td>%u</td>\
         <td>A universally unique identifier (UUID) in canonical form (36 characters).</td>\
      </tr>\
      </table></p>\
      <p>For example, the default template %f_B%b_E%e_%n would produce the following file name:</p>\
      <p>LIGHT_B2x2_E300.00_002.fits</p>\
      <p>for the second light frame of a series with exposure time of 300 seconds at binning 2x2.</p>";

   this.clientFileTemplate_Label.toolTip = clientFileTemplate_toolTip;

   this.clientFileTemplate_Edit = new Edit(this);
   this.clientFileTemplate_Edit.text = "%f_B%b_E%e_%n";
   this.clientFileTemplate_Edit.toolTip = clientFileTemplate_toolTip;

   this.clientFileTemplate_Sizer = new HorizontalSizer;
   this.clientFileTemplate_Sizer.margin  = 6;
   this.clientFileTemplate_Sizer.spacing = 4;
   this.clientFileTemplate_Sizer.add(this.clientFileTemplate_Label);
   this.clientFileTemplate_Sizer.add(this.clientFileTemplate_Edit);

   this.clientFileHints_Label = new Label( this );
   this.clientFileHints_Label.text = "Output hints";
   this.clientFileHints_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.clientFileHints_Label.minWidth = labelWidth2;

   var clientFileHints_toolTip =  "<p><i>Format hints</i> allow you to override global file format settings for image files used by specific processes. \
      In INDICCDFrame, output hints allow you to control the way newly acquired image files are generated on the INDI client.</p>\
      <p>For example, you can use the \"compression-codec zlib\" hint to force the XISF format support module to compress \
      images using the Zlib data compression algorithm. To gain more control on compression, you can use the \"compression-level <i>n</i>\"\
      hint to specify a compression level <i>n</i> in the range from 0 (default compression) to 100 (maximum compression). See the XISF \
      format documentation for detailed information on supported XISF format hints.</p>";

   this.clientFileHints_Label.toolTip = clientFileHints_toolTip;

   this.clientFileHints_Edit = new Edit(this);
   this.clientFileHints_Edit.text = "compression-codec zlib+sh";
   this.clientFileHints_Edit.toolTip = clientFileHints_toolTip;

   this.clientFileHints_Sizer = new HorizontalSizer;
   this.clientFileHints_Sizer.margin = 6;
   this.clientFileHints_Sizer.spacing = 4;
   this.clientFileHints_Sizer.add(this.clientFileHints_Label);
   this.clientFileHints_Sizer.add(this.clientFileHints_Edit);


   this.overwriteImages_Label = new Label( this );
   this.overwriteImages_Label.text = "Overwrite files";
   this.overwriteImages_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.overwriteImages_Label.minWidth = labelWidth2;
   this.overwriteImages_Label.toolTip = "<p>Overwrite files on local file system</p>";

   this.overwriteImages_Checkbox = new CheckBox(this);
   this.overwriteImages_Checkbox.toolTip = "<p>Overwrite files on local file system</p>"

   this.overwriteImages_Sizer = new HorizontalSizer;
   this.overwriteImages_Sizer.margin = 6;
   this.overwriteImages_Sizer.spacing = 4;
   this.overwriteImages_Sizer.add(this.overwriteImages_Label);
   this.overwriteImages_Sizer.add(this.overwriteImages_Checkbox);
   this.overwriteImages_Sizer.addStretch();


//

   this.client_GroupBox = new GroupBox(this);
   this.client_GroupBox.title = "Client";
   this.client_GroupBox.sizer = new VerticalSizer;
   this.client_GroupBox.sizer.margin = 0;
   this.client_GroupBox.sizer.spacing = 0;
   this.client_GroupBox.sizer.add( this.openImages_Sizer);
   this.client_GroupBox.sizer.add( this.saveImages_Sizer);
   this.client_GroupBox.sizer.add( this.clientDownloadDir_Sizer);
   this.client_GroupBox.sizer.add( this.clientFileTemplate_Sizer);
   this.client_GroupBox.sizer.add( this.clientFileHints_Sizer);
   this.client_GroupBox.sizer.add( this.overwriteImages_Sizer);

//


   this.serverDownloadDir_Label = new Label( this );
   this.serverDownloadDir_Label.text = "Download directory";
   this.serverDownloadDir_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.serverDownloadDir_Label.minWidth = labelWidth2;
   this.serverDownloadDir_Label.toolTip = "<p>The directory where newly acquired frames will be stored on the server filesystem.</p>";


   this.serverDownloadDir_Edit = new Edit(this);
   this.serverDownloadDir_Edit.toolTip = "<p>The directory where newly acquired frames will be stored on the local filesystem.</p>";

   this.serverDownloadDir_Sizer = new HorizontalSizer;
   this.serverDownloadDir_Sizer.margin = 6;
   this.serverDownloadDir_Sizer.spacing = 4;
   this.serverDownloadDir_Sizer.add(this.serverDownloadDir_Label);
   this.serverDownloadDir_Sizer.add(this.serverDownloadDir_Edit);


   this.serverFileTemplate_Label = new Label( this );
   this.serverFileTemplate_Label.text = "File template";
   this.serverFileTemplate_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.serverFileTemplate_Label.minWidth = labelWidth2;

   var serverFileTemplate_toolTip =  "<p>A file name template can be any valid text suitable to specify file names on the target filesystem, and may include \
      one or more <i>template specifiers</i>. Template specifiers are replaced automatically with selected tokens when \
      new frames are acquired. Supported template specifiers are the following:</p>\
      <p><table border=\"1\" cellspacing=\"1\" cellpadding=\"4\">\
      <tr>\
         <td><i>Template specifier</i></td>\
         <td width=\"90%\"><i>Will be replaced by</i></td>\
      </tr>\
      <tr>\
         <td>%f</td>\
         <td>Frame type (light, flat, dark, bias).</td>\
      </tr>\
      <tr>\
         <td>%b</td>\
         <td>CCD binning with the format HxV, where H and V are, respectively, the horizontal and vertical binning factors.</td>\
      </tr>\
      <tr>\
         <td>%e</td>\
         <td>Exposure time in seconds.</td>\
      </tr>\
      <tr>\
         <td>%F</td>\
         <td>Filter name</td>\
      </tr>\
      <tr>\
         <td>%T</td>\
         <td>CCD temperature in degrees Celsius.</td>\
      </tr>\
      <tr>\
         <td>%t</td>\
         <td>Acquisition date and time in the UTC time scale, ISO 8601 format.</td>\
      </tr>\
      <tr>\
         <td>%d</td>\
         <td>Acquisition date in the UTC time scale, yyyy-mm-dd format.</td>\
      </tr>\
      <tr>\
         <td>%n</td>\
         <td>The frame number starting from one, with three digits and left-padded with zeros.</td>\
      </tr>\
      <tr>\
         <td>%u</td>\
         <td>A universally unique identifier (UUID) in canonical form (36 characters).</td>\
      </tr>\
      </table></p>\
      <p>For example, the default template %f_B%b_E%e_%n would produce the following file name:</p>\
      <p>LIGHT_B2x2_E300.00_002.fits</p>\
      <p>for the second light frame of a series with exposure time of 300 seconds at binning 2x2.</p>";

   this.serverFileTemplate_Label.toolTip = serverFileTemplate_toolTip;

   this.serverFileTemplate_Edit = new Edit(this);
   this.serverFileTemplate_Edit.text = "%f_B%b_E%e_%n";
   this.serverFileTemplate_Edit.toolTip = serverFileTemplate_toolTip;

   this.serverFileTemplate_Sizer = new HorizontalSizer;
   this.serverFileTemplate_Sizer.margin = 6;
   this.serverFileTemplate_Sizer.spacing = 4;
   this.serverFileTemplate_Sizer.add(this.serverFileTemplate_Label);
   this.serverFileTemplate_Sizer.add(this.serverFileTemplate_Edit);

   this.server_GroupBox = new GroupBox(this);
   this.server_GroupBox.title = "Server";
   this.server_GroupBox.sizer = new VerticalSizer;
   this.server_GroupBox.sizer.margin = 0;
   this.server_GroupBox.sizer.spacing = 0;
   this.server_GroupBox.sizer.add( this.serverDownloadDir_Sizer );
   this.server_GroupBox.sizer.add( this.serverFileTemplate_Sizer );

//

   this.ok_Button = new PushButton( this );
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function()
   {
      this.dialog.ok();
   };

   this.cancel_Button = new PushButton( this );
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.ok_Button );
   this.buttons_Sizer.add( this.cancel_Button );

   this.firstRow_Sizer = new HorizontalSizer;
   this.firstRow_Sizer.margin = 8;
   this.firstRow_Sizer.spacing = 8;
   this.firstRow_Sizer.add( this.exposureParameters_GroupBox );
   this.firstRow_Sizer.add( this.frameParameters_GroupBox );

   this.secondRow_Sizer = new HorizontalSizer;
   this.secondRow_Sizer.margin = 8;
   this.secondRow_Sizer.spacing = 8;
   this.secondRow_Sizer.add( this.client_GroupBox );

   this.thirdRow_Sizer = new HorizontalSizer;
   this.thirdRow_Sizer.margin = 8;
   this.thirdRow_Sizer.spacing = 8;
   this.thirdRow_Sizer.add( this.server_GroupBox );

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 8;
   this.sizer.add( this.firstRow_Sizer );
   this.sizer.add( this.secondRow_Sizer );
   this.sizer.add( this.thirdRow_Sizer );
   this.sizer.add( this.buttons_Sizer );


   this.windowTitle = "Camera Device Parameters";
   this.userResizable = true;
   this.adjustToContents();

}

// Our dialog inherits all properties and methods from the core Dialog object.
CameraParametersDialog.prototype = new Dialog;

/*
 * Mount parameters dialog
 */

function FilerNameDialog(dialog)
{
   this.__base__ = Dialog;
   this.__base__();

   var labelWidth = this.font.width( "Filter name" + 'T' );

   this.filterName_Label = new Label( this );
   this.filterName_Label.text = "Filter name";
   this.filterName_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.filterName_Label.minWidth = labelWidth;
   this.filterName_Label.toolTip = "<p>Specify a filter name.</p>";

   this.filterName_Edit = new Edit(this);
   this.filterName_Edit.toolTip = "<p>Specify a filter name.</p>";

   this.filterName_Sizer = new HorizontalSizer;
   this.filterName_Sizer.margin = 6;
   this.filterName_Sizer.spacing = 4;
   this.filterName_Sizer.add(this.filterName_Label);
   this.filterName_Sizer.add(this.filterName_Edit);

   this.ok_Button = new PushButton( this );
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function()
   {
      this.dialog.ok();
   };

   this.cancel_Button = new PushButton( this );
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.ok_Button );
   this.buttons_Sizer.add( this.cancel_Button );

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 8;
   this.sizer.add( this.filterName_Sizer );
   this.sizer.add( this.buttons_Sizer );


   this.windowTitle = "Filter name";
   this.userResizable = true;
   this.adjustToContents();

}

FilerNameDialog.prototype = new Dialog;

function FilterWheelParametersDialog(dialog)
{
   this.__base__ = Dialog;
   this.__base__();

   this.filterNameDialog = new FilerNameDialog(this);

//
   this.filterType_TreeBox = new TreeBox(this);
   this.filterType_TreeBox.rootDecoration = false;
   this.filterType_TreeBox.multipleSelection = false;
   this.filterType_TreeBox.alternateRowColor = true;
   this.filterType_TreeBox.setFixedSize( 200, 100 );
   this.filterType_TreeBox.numberOfColumns = 2;
   this.filterType_TreeBox.showColumn(1,false);
   this.filterType_TreeBox.setHeaderText(0, "Filter");
   this.filterType_TreeBox.headerVisible = true;

   this.filterDelete_ToolButton = new ToolButton(this);
   this.filterDelete_ToolButton.icon = ":/browser/disabled.png";
   this.filterDelete_ToolButton.setScaledFixedSize(22, 22);
   this.filterDelete_ToolButton.toolTip = "<p>Remove filter</p>";
   this.filterDelete_ToolButton.onClick = function ()
   {
      if (this.dialog.filterType_TreeBox.selectedNodes.length==1){
         var selectedNode = this.dialog.filterType_TreeBox.selectedNodes[0];
         var idx = this.dialog.filterType_TreeBox.childIndex(selectedNode);
         this.dialog.filterType_TreeBox.remove(idx);
      }
   }

   this.filterAdd_ToolButton = new ToolButton(this);
   this.filterAdd_ToolButton.icon = ":/icons/add.png";
   this.filterAdd_ToolButton.setScaledFixedSize(22, 22);
   this.filterAdd_ToolButton.toolTip = "<p>Add filter</p>";
   this.filterAdd_ToolButton.onClick = function ()
   {
      if (this.dialog.filterNameDialog.execute()){
         var node = new TreeBoxNode( this.dialog.filterType_TreeBox );
         node.setText(0,this.dialog.filterNameDialog.filterName_Edit.text);
      }
   }


   this.filterMoveUp_ToolButton = new ToolButton(this);
   this.filterMoveUp_ToolButton.icon = ":/arrows/arrow-up.png";
   this.filterMoveUp_ToolButton.setScaledFixedSize(22, 22);
   this.filterMoveUp_ToolButton.toolTip = "<p>Move filter up</p>";
   this.filterMoveUp_ToolButton.onClick = function ()
   {
      if (this.dialog.filterType_TreeBox.selectedNodes.length == 1){
         var selectedNode = this.dialog.filterType_TreeBox.selectedNodes[0];
         var idx = this.dialog.filterType_TreeBox.childIndex(selectedNode);
         if (idx > 0) {
            this.dialog.filterType_TreeBox.remove(idx);
            this.dialog.filterType_TreeBox.insert(idx - 1,selectedNode);
         }
      }
   }

   this.filterMoveDown_ToolButton = new ToolButton(this);
   this.filterMoveDown_ToolButton.icon = ":/arrows/arrow-down.png";
   this.filterMoveDown_ToolButton.setScaledFixedSize(22, 22);
   this.filterMoveDown_ToolButton.toolTip = "<p>Move filter down</p>";
   this.filterMoveDown_ToolButton.onClick = function ()
   {
      if (this.dialog.filterType_TreeBox.selectedNodes.length == 1){
         var selectedNode = this.dialog.filterType_TreeBox.selectedNodes[0];
         var idx = this.dialog.filterType_TreeBox.childIndex(selectedNode);
         if (idx < this.dialog.filterType_TreeBox.numberOfChildren - 1){
            this.dialog.filterType_TreeBox.remove(idx);
            this.dialog.filterType_TreeBox.insert(idx + 1,selectedNode);
         }
      }
   }

//
   this.filterTool_Sizer = new VerticalSizer;
   this.filterTool_Sizer.spacing = 4;
   this.filterTool_Sizer.add( this.filterAdd_ToolButton );
   this.filterTool_Sizer.add( this.filterDelete_ToolButton );
   this.filterTool_Sizer.add( this.filterMoveUp_ToolButton );
   this.filterTool_Sizer.add( this.filterMoveDown_ToolButton );
   this.filterTool_Sizer.addStretch();


//
   this.filter_Sizer = new HorizontalSizer;
   this.filter_Sizer.spacing = 4;
   this.filter_Sizer.add( this.filterType_TreeBox );
   this.filter_Sizer.add( this.filterTool_Sizer );
   this.filter_Sizer.addStretch();

//

   this.filterParameters_GroupBox = new GroupBox(this);
   this.filterParameters_GroupBox.title = "Filterwheel Device Parameters";
   this.filterParameters_GroupBox.sizer = new VerticalSizer;
   this.filterParameters_GroupBox.sizer.margin = 6;
   this.filterParameters_GroupBox.sizer.spacing = 4;
   this.filterParameters_GroupBox.sizer.add( this.filter_Sizer);

//
   this.ok_Button = new PushButton( this );
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function()
   {
      for (var i = 0 ; i < this.dialog.filterType_TreeBox.numberOfChildren; ++i){
         var childNode = this.dialog.filterType_TreeBox.child(i);
         engine.filterKeys[i] = childNode.text(0);
         engine.filterDict[childNode.text(0)] = parseInt(childNode.text(1));
      }
      this.dialog.ok();
   };

   this.cancel_Button = new PushButton( this );
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.ok_Button );
   this.buttons_Sizer.add( this.cancel_Button );

//
   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 8;
   this.sizer.add( this.filterParameters_GroupBox );
   this.sizer.add( this.buttons_Sizer );
//
   this.windowTitle = "Filterwheel Device Parameters";
   this.userResizable = true;
   this.adjustToContents();

}


// Our dialog inherits all properties and methods from the core Dialog object.
FilterWheelParametersDialog.prototype = new Dialog;

function UpdateWorklistDialog(dialog, selectedIdx)
{
   this.__base__ = Dialog;
   this.__base__();

   this.selectedItemIdx = selectedIdx;

   var labelWidth1 = this.font.width( "Upload Mode:" + 'T' );

   this.binningX_Label = new Label( this );
   this.binningX_Label.text = "Binning X:";
   this.binningX_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.binningX_Label.minWidth = labelWidth1;
   this.binningX_Label.toolTip = "<p>...</p>";

//
   this.binningX_ComboBox = new ComboBox(this);
   this.binningX_ComboBox.addItem("1");
   this.binningX_ComboBox.addItem("2");
   this.binningX_ComboBox.addItem("3");
   this.binningX_ComboBox.addItem("4");
   this.binningX_ComboBox.currentItem = engine.worklist[this.dialog.selectedItemIdx].binningX - 1;
   this.binningX_ComboBox.toolTip = "<p>...</p>";

//
   this.binningY_Label = new Label( this );
   this.binningY_Label.text = "Binning Y:";
   this.binningY_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.binningY_Label.minWidth = labelWidth1;
   this.binningY_Label.toolTip = "<p>...</p>";

//

   this.binningY_ComboBox = new ComboBox(this);
   this.binningY_ComboBox.addItem("1");
   this.binningY_ComboBox.addItem("2");
   this.binningY_ComboBox.addItem("3");
   this.binningY_ComboBox.addItem("4");
   this.binningY_ComboBox.currentItem = engine.worklist[this.dialog.selectedItemIdx].binningY - 1;
   this.binningY_ComboBox.toolTip = "<p>...</p>";
//

   this.binningX_Sizer = new HorizontalSizer;
   this.binningX_Sizer.spacing = 4;
   this.binningX_Sizer.add( this.binningX_Label );
   this.binningX_Sizer.add( this.binningX_ComboBox );
   this.binningX_Sizer.addStretch();

//

   this.binningY_Sizer = new HorizontalSizer;
   this.binningY_Sizer.spacing = 4;
   this.binningY_Sizer.add( this.binningY_Label );
   this.binningY_Sizer.add( this.binningY_ComboBox );
   this.binningY_Sizer.addStretch();

   //

   this.exposureTimeEdit = new NumericEdit( this );
   this.exposureTimeEdit.label.text = "Exposure time:";
   this.exposureTimeEdit.label.minWidth = labelWidth1;
   this.exposureTimeEdit.setRange( 0.001, 60000 );
   this.exposureTimeEdit.setPrecision( 3 );
   this.exposureTimeEdit.setValue( engine.worklist[this.dialog.selectedItemIdx].expTime );
   this.exposureTimeEdit.toolTip = "<p>Exposure time in seconds.</p>";
   this.exposureTimeEdit.sizer.addStretch();

//
   this.numOfFramesEdit = new NumericEdit( this );
   this.numOfFramesEdit.label.text = "Number of frames:";
   this.numOfFramesEdit.label.minWidth = labelWidth1;
   this.numOfFramesEdit.setRange( 0, 600 );
   this.numOfFramesEdit.setReal( false );
   this.numOfFramesEdit.setValue( engine.worklist[this.dialog.selectedItemIdx].numOfFrames );
   this.numOfFramesEdit.toolTip = "<p>Number of frames to be acquired.</p>";
   this.numOfFramesEdit.sizer.addStretch();

   this.workItem_GroupBox = new GroupBox(this);
   this.workItem_GroupBox.title = "Update worklist";
   this.workItem_GroupBox.sizer = new VerticalSizer;
   this.workItem_GroupBox.sizer.margin = 6;
   this.workItem_GroupBox.sizer.spacing = 4;
   this.workItem_GroupBox.sizer.add( this.binningX_Sizer);
   this.workItem_GroupBox.sizer.add( this.binningY_Sizer);
   this.workItem_GroupBox.sizer.add( this.exposureTimeEdit);
   this.workItem_GroupBox.sizer.add( this.numOfFramesEdit);

   this.ok_Button = new PushButton( this );
   this.ok_Button.text = "OK";
   this.ok_Button.icon = this.scaledResource( ":/icons/ok.png" );
   this.ok_Button.onClick = function()
   {
      engine.worklist[this.dialog.selectedItemIdx].binningX    = this.dialog.binningX_ComboBox.currentItem + 1;
      engine.worklist[this.dialog.selectedItemIdx].binningY    = this.dialog.binningY_ComboBox.currentItem + 1;
      engine.worklist[this.dialog.selectedItemIdx].expTime     = this.dialog.exposureTimeEdit.value;
      engine.worklist[this.dialog.selectedItemIdx].numOfFrames = this.dialog.numOfFramesEdit.value;
      this.dialog.ok();
   };

   this.cancel_Button = new PushButton( this );
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.ok_Button );
   this.buttons_Sizer.add( this.cancel_Button );

//
   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 8;
   this.sizer.add( this.workItem_GroupBox );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = "Update Worklist";
   this.userResizable = true;
   this.adjustToContents();

}

// Our dialog inherits all properties and methods from the core Dialog object.
UpdateWorklistDialog.prototype = new Dialog;

/*
 * Batch Frame Acquisition dialog
 */
function BatchFrameAcquisitionDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   //this.computeApparentPos_Checkbox.
   this.mountDialog  = new MountParametersDialog(this);

   this.cameraDialog = new CameraParametersDialog(this);
   this.filterDialog = new FilterWheelParametersDialog(this);
   this.updateDialog = {};
   this.filter = [];
   //

   this.getFilterParameters = function() {
      var filter = [];
      for (var i = 0; i < 10; ++i){
         var filterIndex = i + 1;
         let filterPropertyKey = "/" + engine.getFilterWheelDeviceName() + "/FILTER_NAME/FILTER_SLOT_NAME_" + filterIndex;
         engine.deviceController.getCommandParameters = filterPropertyKey;
         engine.deviceController.serverCommand = "TRY_GET";

         engine.executeController();
         if (engine.deviceController.getCommandResult.length != 0){
            filter[i] = engine.deviceController.getCommandResult;
         }
      }
      return filter;
   }

   this.getServerDownloadDir = function() {
      var serverDir = "";
      let propertyKey = "/" + engine.ccdDevice + "/UPLOAD_SETTINGS/UPLOAD_DIR";
      engine.deviceController.getCommandParameters = propertyKey;
      engine.deviceController.serverCommand = "TRY_GET";

      engine.executeController();
      if (engine.deviceController.getCommandResult.length != 0){
         serverDir = engine.deviceController.getCommandResult;
      }
      return serverDir;
   }

   this.getTelescopeAndCCDInfo = function() {
      var info = { "pixSize" : 0, "focalLen" : 0 };

      // get pixelsize from CCD device
      let propertyKey = "/" + engine.ccdDevice + "/CCD_INFO/CCD_PIXEL_SIZE";
      engine.deviceController.getCommandParameters = propertyKey;
      engine.deviceController.serverCommand = "TRY_GET";

      engine.executeController();
      if (engine.deviceController.getCommandResult.length != 0){
         info.pixSize = parseFloat(engine.deviceController.getCommandResult);
      }

      // get telescope focal length from mount device
      let propertyKey = "/" + engine.mountDevice + "/TELESCOPE_INFO/TELESCOPE_FOCAL_LENGTH";
      engine.deviceController.getCommandParameters = propertyKey;
      engine.deviceController.serverCommand = "TRY_GET";

      engine.executeController();
      if (engine.deviceController.getCommandResult.length != 0){
         info.focalLen = parseFloat(engine.deviceController.getCommandResult);
      }
      return info;
   }

   //

   this.serverhost_Edit = new Edit(this);
   this.serverhost_Edit.text = "localhost";
   this.serverhost_Edit.setFixedWidth(485);
   this.serverhost_Edit.toolTip = "<p>Enter INDI server host.</p>";
   this.connect_PushButton = new PushButton(this);
   this.connect_PushButton.icon = this.scaledResource( ":/icons/power.png" );
   this.connect_PushButton.text = "Connect";
   this.connect_PushButton.toolTip = "<p>Connect to INDI server.</p>";
   this.connect_PushButton.onClick = function()
   {

      engine.deviceController.serverConnect = true;
      engine.deviceController.serverHostName = this.dialog.serverhost_Edit.text;
      engine.executeController();

      // Wait until device names are receialignmentModel_Editved from server
      console.note( "<p>Getting device information ... " );
      for ( engine.restartTimer(); !engine.timeout(); )
      {
         msleep( 100 );
         processEvents();
      }
      console.noteln( "done. </p>" );
      // Connecting to devices
      for ( var i = 0 ; i < engine.deviceController.devices.length ; ++i){

         let device = engine.deviceController.devices[i].toString().replace(',','');
         console.note("<p>Connecting to device '" + device + "' ...")
         let propertyKey = "/" + device + "/CONNECTION/CONNECT";
         engine.deviceController.newProperties = [[propertyKey, "INDI_SWITCH", "ON"]];
         engine.deviceController.serverCommand = "SET";
         engine.executeController();
         engine.deviceController.serverCommand = "";

         // Wait until device is connected
         for ( engine.restartTimer(); !engine.timeout(); )
         {
            msleep( 100 );
            processEvents();
            if ( propertyEquals( (new INDIDeviceController).properties, propertyKey, "ON" ) )
               break;
         }
         console.noteln("<p>Connecting to device '" + device + "' ... done. </p>");

         // determine type of device
         // -- mount device
         let mountPropertyKey = "/" + device + "/EQUATORIAL_EOD_COORD/RA";
         engine.deviceController.getCommandParameters = mountPropertyKey;
         engine.deviceController.serverCommand = "TRY_GET";

         engine.executeController();
         if (engine.deviceController.getCommandResult.length != 0){
            engine.mountDevice = device;
            this.dialog.mountparam_PushButton.enabled = true;
            this.dialog.mountparam_PushButton.icon = this.scaledResource( ":/bullets/bullet-ball-glass-green.png" );
         }

         // -- ccd device
         let ccdPropertyKey = "/" + device + "/CCD_EXPOSURE/CCD_EXPOSURE_VALUE";
         engine.deviceController.getCommandParameters = ccdPropertyKey;
         engine.deviceController.serverCommand = "TRY_GET";

         engine.executeController();
         if (engine.deviceController.getCommandResult.length != 0){
            engine.ccdDevice = device;
            this.dialog.cameraparam_PushButton.enabled = true;
            this.dialog.cameraparam_PushButton.icon = this.scaledResource( ":/bullets/bullet-ball-glass-green.png" );
         }

         // -- filter wheel device
         let filterWheelPropertyKey = "/" + device + "/FILTER_SLOT/FILTER_SLOT_VALUE";
         engine.deviceController.getCommandParameters = filterWheelPropertyKey;
         engine.deviceController.serverCommand = "TRY_GET";

         engine.executeController();
         if (engine.deviceController.getCommandResult.length != 0){
            engine.filterWheelDevice = device;
            this.dialog.filterparam_PushButton.enabled = true;
            this.dialog.filterparam_PushButton.icon = this.scaledResource( ":/bullets/bullet-ball-glass-green.png" );

            engine.extFilterWheelDevice = ( engine.ccdDevice != device ) ? device : "";
         }
      }
   }

   this.serverConnection_Sizer = new HorizontalSizer;
   this.serverConnection_Sizer.margin = 6;
   this.serverConnection_Sizer.spacing = 4;
   this.serverConnection_Sizer.add( this.serverhost_Edit);
   this.serverConnection_Sizer.add( this.connect_PushButton );

   this.mountparam_PushButton = new PushButton(this);
   this.mountparam_PushButton.icon = this.scaledResource( ":/bullets/bullet-ball-glass-grey.png" );
   this.mountparam_PushButton.text = "Mount Parameters  ";
   this.mountparam_PushButton.toolTip = "<p>Set mount device parameters</p>";
   this.mountparam_PushButton.adjustToContents();
   this.mountparam_PushButton.enabled = false;
   this.mountparam_PushButton.onClick = function()
   {
      var telescopeAndCCDInfo = this.dialog.getTelescopeAndCCDInfo();

      this.dialog.mountDialog.CCDInfoPixelSize         = telescopeAndCCDInfo.pixSize;
      this.dialog.mountDialog.telescopeInfoFocalLength = telescopeAndCCDInfo.focalLen;
      if (this.dialog.mountDialog.execute()){
         engine.center             = this.dialog.mountDialog.centering_Checkbox.checked;
         engine.align              = this.dialog.mountDialog.alignmentCorrection_Checkbox.checked;
         engine.alignModelFile     = this.dialog.mountDialog.alignmentModel_Edit.text;
         engine.computeApparentPos = this.dialog.mountDialog.computeApparentPos_Checkbox.checked;
      }
      engine.telescopeFocalLen    = this.dialog.mountDialog.telescopeInfoFocalLength;
      engine.ccdPixelSize         = this.dialog.mountDialog.CCDInfoPixelSize;
   }

   this.cameraparam_PushButton = new PushButton(this);
   this.cameraparam_PushButton.icon = this.scaledResource( ":/bullets/bullet-ball-glass-grey.png" );
   this.cameraparam_PushButton.text = "Camera Parameters";
   this.cameraparam_PushButton.toolTip = "<p>Set camera device parameters</p>";
   this.cameraparam_PushButton.enabled = false;
   this.cameraparam_PushButton.onClick = function()
   {
      var serverDir = this.dialog.getServerDownloadDir();
      this.dialog.cameraDialog.serverDownloadDir_Edit.text = serverDir;
      if (this.dialog.cameraDialog.execute()){
         engine.binningX.idx         = this.dialog.cameraDialog.binningX_ComboBox.currentItem;
         engine.binningX.text        = this.dialog.cameraDialog.binningX_ComboBox.itemText(engine.binningX.idx);
         engine.binningY.idx         = this.dialog.cameraDialog.binningY_ComboBox.currentItem;
         engine.binningY.text        = this.dialog.cameraDialog.binningY_ComboBox.itemText(engine.binningY.idx);
         engine.frameType.idx        = this.dialog.cameraDialog.frameType_ComboBox.currentItem;
         engine.frameType.text       = this.dialog.cameraDialog.frameType_ComboBox.itemText(engine.frameType.idx);
         engine.openClientImages     = this.dialog.cameraDialog.openImages_Checkbox.checked;
         engine.saveClientImages     = this.dialog.cameraDialog.saveImages_Checkbox.checked;
         engine.clientDownloadDir    = this.dialog.cameraDialog.clientDownloadDir_Edit.text;
         engine.clientFileTemplate   = this.dialog.cameraDialog.clientFileTemplate_Edit.text;
         engine.clientFileHints      = this.dialog.cameraDialog.clientFileHints_Edit.text;
         engine.overwriteClientFiles = this.dialog.cameraDialog.overwriteImages_Checkbox.checked;
         engine.serverDownloadDir    = this.dialog.cameraDialog.serverDownloadDir_Edit.text;
         engine.serverFileTemplate   = this.dialog.cameraDialog.serverFileTemplate_Edit.text;
         engine.uploadMode.idx       = this.dialog.cameraDialog.uploadMode_ComboBox.currentItem;
         engine.uploadMode.text      = this.dialog.cameraDialog.uploadMode_ComboBox.itemText(engine.uploadMode.idx);


         // diable target treebox if frame type not "LIGHT"
         if ( engine.frameType.idx  != 0) {
            this.dialog.mountParam_TreeBox.enabled     = false;
            this.dialog.loadTargetCoord_Button.enabled = false;
            engine.targets[0] = {"name" : engine.frameType.text, "ra" : 0.0, "dec" : 0.0};
         } else {
            this.dialog.mountParam_TreeBox.enabled     = true;
            this.dialog.loadTargetCoord_Button.enabled = true;
         }
      }
   }

   this.filterparam_PushButton = new PushButton(this);
   this.filterparam_PushButton.icon = this.scaledResource( ":/bullets/bullet-ball-glass-grey.png" );
   this.filterparam_PushButton.text = "Filter Parameters    ";
   this.filterparam_PushButton.toolTip = "<p>Set filterwheel device parameters</p>";
   this.filterparam_PushButton.enabled = false;
   this.filterparam_PushButton.onClick = function()
   {
      var filterList = this.dialog.getFilterParameters();
      // fill table
      this.dialog.filterDialog.filterType_TreeBox.clear();
      for (var i = 0; i < filterList.length ; ++i) {
         var filterIdx = i + 1;
         var node = new TreeBoxNode( this.dialog.filterDialog.filterType_TreeBox );
         node.setText(0,filterList[i]);
         node.setText(1,filterIdx.toString());
      }
      if (this.dialog.filterDialog.execute()){
      }
   }

   this.serverDevicesButton_Sizer = new HorizontalSizer;
   this.serverDevicesButton_Sizer.margin = 6;
   this.serverDevicesButton_Sizer.spacing = 4;
   this.serverDevicesButton_Sizer.add( this.mountparam_PushButton );
   this.serverDevicesButton_Sizer.add( this.cameraparam_PushButton );
   this.serverDevicesButton_Sizer.add( this.filterparam_PushButton );
   this.serverDevicesButton_Sizer.addStretch();

   this.serverDevices_Sizer = new HorizontalSizer;
   this.serverDevices_Sizer.margin = 6;
   this.serverDevices_Sizer.spacing = 4;
   //this.serverDevices_Sizer.add( this.serverDevices_TreeBox);
   this.serverDevices_Sizer.add( this.serverDevicesButton_Sizer );

   this.connection_GroupBox = new GroupBox(this);
   this.connection_GroupBox.title = "Server connection";
   this.connection_GroupBox.sizer = new VerticalSizer;
   this.connection_GroupBox.sizer.margin = 6;
   this.connection_GroupBox.sizer.spacing = 4;
   this.connection_GroupBox.sizer.add( this.serverConnection_Sizer);
   this.connection_GroupBox.sizer.add( this.serverDevices_Sizer );
   //

   this.helpLabel = new Label( this );
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.margin = this.logicalPixelsToPhysical( 4 );
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = "<p><b>" + TITLE + " v" + VERSION + "</b> &mdash; " +
                         "An acquisition batch processing utility.</p>" +
                         "<p>Copyright &copy; 2009-2015 Klaus Kretzschmar</p>";
   //

   this.mountParam_TreeBox = new TreeBox( this );
   this.mountParam_TreeBox.multipleSelection = false;
   this.mountParam_TreeBox.rootDecoration = false;
   this.mountParam_TreeBox.alternateRowColor = true;
   this.mountParam_TreeBox.setScaledMinSize( 500, 200 );
   this.mountParam_TreeBox.numberOfColumns = 4;
   this.mountParam_TreeBox.setHeaderText(0, "Target");
   this.mountParam_TreeBox.setHeaderText(1, "Rightascension");
   this.mountParam_TreeBox.setHeaderText(2, "Declination");
   this.mountParam_TreeBox.setHeaderText(3, "Rotation");
   this.mountParam_TreeBox.headerVisible = true;

   //

   this.updateTargets  = function (targetTreeBox) {
      for (var i = 0 ; i < targetTreeBox.numberOfChildren; ++i){
         var childNode = targetTreeBox.child(i);
         var targetItem = {"name": "", "ra" : 0.0, "dec": 0.0};
         targetItem.name = childNode.text(0);
         targetItem.ra   = sexadecimalStringToDouble(childNode.text(1),":");
         targetItem.dec  = sexadecimalStringToDouble(childNode.text(2),":");
         engine.targets[i] = targetItem;
      }
   }

   this.loadTargetCoord_Button = new ToolButton( this );
   this.loadTargetCoord_Button.icon = this.scaledResource( ":/icons/add.png" );
   this.loadTargetCoord_Button.toolTip = "<p>Add target coordinates from csv file.</p>";
   this.loadTargetCoord_Button.onClick = function()
   {
      var ofd = new OpenFileDialog;
      ofd.multipleSelections = true;
      ofd.caption = "Select CSV";
      ofd.filters = [["Targets","*.csv"]];

     if ( ofd.execute() )
      {
         this.dialog.mountParam_TreeBox.canUpdate = false;
         for ( var i = 0; i < ofd.fileNames.length; ++i )
         {
            var f = new File;
            f.openForReading( ofd.fileNames[i] );
            let buffer = f.read( DataType_ByteArray, f.size );
            f.close();
            var content = buffer.utf8ToString();
            var lines = content.split("\n");
            for (var lineIndex = 0 ; lineIndex < lines.length; lineIndex++){
               var line = lines[lineIndex];
               var tokens = line.split(",");
               if (tokens.length < 3)
                  continue;
               var node = new TreeBoxNode( this.dialog.mountParam_TreeBox );
               var targetItem = {"name": "", "ra" : 0.0, "dec": 0.0};
               for (var j = 0; j < 4 ; ++j){
                  if (tokens.length == 3 && j == 3)
                     continue;
                  node.setText( j, tokens[j].toString() );
               }
               targetItem.name = tokens[0].toString();
               targetItem.ra   = sexadecimalStringToDouble(tokens[1].toString(),":");
               targetItem.dec  = sexadecimalStringToDouble(tokens[2].toString(),":");
               engine.targets[lineIndex] = targetItem;
            }
         }
         this.dialog.mountParam_TreeBox.canUpdate = true;
      }
   };

   //

   this.moveUpTargetCoord_Button = new ToolButton( this );
   this.moveUpTargetCoord_Button.icon = this.scaledResource( ":/arrows/arrow-up.png" );
   this.moveUpTargetCoord_Button.toolTip = "<p>Move up target.</p>";
   this.moveUpTargetCoord_Button.onClick = function()
   {
      if (this.dialog.mountParam_TreeBox.selectedNodes.length == 1){
         var selectedNode = this.dialog.mountParam_TreeBox.selectedNodes[0];
         var idx = this.dialog.mountParam_TreeBox.childIndex(selectedNode);
         if (idx > 0) {
            this.dialog.mountParam_TreeBox.remove(idx);
            this.dialog.mountParam_TreeBox.insert(idx - 1,selectedNode);
         }
         this.dialog.updateTargets(this.dialog.mountParam_TreeBox);
      }
   }

   //

   this.moveDownTargetCoord_Button = new ToolButton( this );
   this.moveDownTargetCoord_Button.icon = this.scaledResource( ":/arrows/arrow-down.png" );
   this.moveDownTargetCoord_Button.toolTip = "<p>Move down target.</p>";
   this.moveDownTargetCoord_Button.onClick = function()
   {
      if (this.dialog.mountParam_TreeBox.selectedNodes.length == 1){
         var selectedNode = this.dialog.mountParam_TreeBox.selectedNodes[0];
         var idx = this.dialog.mountParam_TreeBox.childIndex(selectedNode);
         if (idx < this.dialog.mountParam_TreeBox.numberOfChildren - 1){
            this.dialog.mountParam_TreeBox.remove(idx);
            this.dialog.mountParam_TreeBox.insert(idx + 1,selectedNode);
         }
         this.dialog.updateTargets(this.dialog.mountParam_TreeBox);
      }
   }

   //

   this.clearTargetCoord_Button = new ToolButton( this );
   this.clearTargetCoord_Button.icon = this.scaledResource( ":/icons/clear.png" );
   this.clearTargetCoord_Button.toolTip = "<p>Clear targets.</p>";
   this.clearTargetCoord_Button.onClick = function()
   {
      if (this.dialog.mountParam_TreeBox.selectedNodes.length == 0)
      {
         this.dialog.mountParam_TreeBox.clear();
      } else {
         var selectedNode = this.dialog.mountParam_TreeBox.selectedNodes[0];
         var idx = this.dialog.mountParam_TreeBox.childIndex(selectedNode);
         this.dialog.mountParam_TreeBox.remove(idx);
      }
      this.dialog.updateTargets(this.dialog.mountParam_TreeBox);
   }




   this.mountParam_ButtonSizer = new VerticalSizer;
   this.mountParam_ButtonSizer.margin = 6;
   this.mountParam_ButtonSizer.spacing = 4;
   this.mountParam_ButtonSizer.add(this.loadTargetCoord_Button);
   this.mountParam_ButtonSizer.add(this.moveUpTargetCoord_Button);
   this.mountParam_ButtonSizer.add(this.moveDownTargetCoord_Button);
   this.mountParam_ButtonSizer.add(this.clearTargetCoord_Button);
   this.mountParam_ButtonSizer.addStretch();

   //

   this.mountParam_GroupBox = new GroupBox( this );
   this.mountParam_GroupBox.title = "Targets";
   this.mountParam_GroupBox.sizer = new HorizontalSizer;
   this.mountParam_GroupBox.sizer.margin = 6;
   this.mountParam_GroupBox.sizer.spacing = 4;
   this.mountParam_GroupBox.sizer.add( this.mountParam_TreeBox, 100 );
   this.mountParam_GroupBox.sizer.add( this.mountParam_ButtonSizer );

   //

   // acquisition queue treebox

   this.worklist_TreeBox = new TreeBox( this );
   this.worklist_TreeBox.multipleSelection = false;
   this.worklist_TreeBox.rootDecoration = false;
   this.worklist_TreeBox.alternateRowColor = true;
   this.worklist_TreeBox.setScaledMinSize( 500, 300 );
   this.worklist_TreeBox.numberOfColumns = 6;
   this.worklist_TreeBox.setHeaderText(0, "Target");
   this.worklist_TreeBox.setHeaderText(1, "Filter");
   this.worklist_TreeBox.setHeaderText(2, "Binning");
   this.worklist_TreeBox.setHeaderText(3, "Exp. time");
   this.worklist_TreeBox.setHeaderText(4, "#frames");
   this.worklist_TreeBox.setHeaderText(5, "Status");
   this.worklist_TreeBox.headerVisible = true;

   //

   this.createWorklist_Button = new PushButton( this );
   this.createWorklist_Button.text = "Worklist";
   this.createWorklist_Button.icon = this.scaledResource( ":/icons/add.png" );
   this.createWorklist_Button.toolTip = "<p>Create worklist</p>";
   this.createWorklist_Button.onClick = function()
   {
      engine.print();
      var worklist = engine.createWorklist();
      for (var i = 0; i < worklist.length; ++i){
         var node = new TreeBoxNode( this.dialog.worklist_TreeBox );
         node.setText(0,worklist[i].targetName);
         node.setText(1,worklist[i].filterName);
         node.setText(2,format("%dx%d",worklist[i].binningX,worklist[i].binningY));
         node.setText(3,worklist[i].expTime.toString());
         node.setText(4,worklist[i].numOfFrames.toString());
         node.setIcon(5,":/bullets/bullet-ball-glass-grey.png");
      }
   };


   this.updateWorklist_Button = new PushButton( this );
   this.updateWorklist_Button.text = "Update";
   this.updateWorklist_Button.icon = this.scaledResource( ":/icons/write.png" );
   this.updateWorklist_Button.toolTip = "<p>Update worklist</p>";
   this.updateWorklist_Button.onClick = function()
   {
      var selectedNode = this.dialog.worklist_TreeBox.selectedNodes[0];
      var idx = this.dialog.worklist_TreeBox.childIndex(selectedNode);
      this.dialog.updateDialog = new UpdateWorklistDialog(this,idx);
      if (this.dialog.updateDialog.execute()){
         this.dialog.worklist_TreeBox.clear();
         for (var i = 0; i < engine.worklist.length; ++i){
            var node = new TreeBoxNode( this.dialog.worklist_TreeBox );
            node.setText(0,engine.worklist[i].targetName);
            node.setText(1,engine.worklist[i].filterName);
            node.setText(2,format("%dx%d",engine.worklist[i].binningX,engine.worklist[i].binningY));
            node.setText(3,engine.worklist[i].expTime.toString());
            node.setText(4,engine.worklist[i].numOfFrames.toString());
            node.setIcon(5,":/bullets/bullet-ball-glass-grey.png");
         }
      }
   };

   this.clearWorklist_Button = new PushButton( this );
   this.clearWorklist_Button.text = "Clear";
   this.clearWorklist_Button.icon = this.scaledResource( ":/icons/clear.png" );
   this.clearWorklist_Button.toolTip = "<p>Clear worklist</p>";
   this.clearWorklist_Button.onClick = function()
   {
      if (this.dialog.worklist_TreeBox.selectedNodes.length == 0)
      {
         this.dialog.worklist_TreeBox.clear();
      } else {
         var selectedNode = this.dialog.worklist_TreeBox.selectedNodes[0];
         var idx = this.dialog.worklist_TreeBox.childIndex(selectedNode);
         this.dialog.worklist_TreeBox.remove(idx);
      }
   };

   this.startProcessing_Button = new PushButton( this );
   this.startProcessing_Button.text = "Start";
   this.startProcessing_Button.icon = this.scaledResource( ":/icons/power.png" );
   this.startProcessing_Button.toolTip = "<p>Start processing.</p>";
   this.startProcessing_Button.onClick = function()
   {
      engine.startProcessing(this.dialog.worklist_TreeBox);
   };

   this.cancelProcessing_Button = new PushButton( this );
   this.cancelProcessing_Button.text = "Cancel";
   this.cancelProcessing_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancelProcessing_Button.onClick = function()
   {

      this.dialog.cancel();
   };

   this.worklist_ButtonSizer = new HorizontalSizer;
   this.worklist_ButtonSizer.margin = 6;
   this.worklist_ButtonSizer.spacing = 4;
   this.worklist_ButtonSizer.add(this.createWorklist_Button);
   this.worklist_ButtonSizer.add(this.updateWorklist_Button);
   this.worklist_ButtonSizer.add(this.clearWorklist_Button);
   this.worklist_ButtonSizer.addStretch();
   this.worklist_ButtonSizer.add(this.startProcessing_Button);
   this.worklist_ButtonSizer.add(this.cancelProcessing_Button);

   this.worklist_GroupBox = new GroupBox( this );
   this.worklist_GroupBox.title = "Acquisition queue";
   this.worklist_GroupBox.sizer = new VerticalSizer;
   this.worklist_GroupBox.sizer.margin = 6;
   this.worklist_GroupBox.sizer.spacing = 4;
   this.worklist_GroupBox.sizer.add( this.worklist_TreeBox, 100 );
   this.worklist_GroupBox.sizer.add( this.worklist_ButtonSizer );

   //

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 8;
   this.sizer.add( this.helpLabel );
   this.sizer.add( this.connection_GroupBox);
   this.sizer.add( this.mountParam_GroupBox );
   this.sizer.add( this.worklist_GroupBox );

   this.sizer.addSpacing( 4 );
   this.windowTitle = TITLE + " Script";
   this.userResizable = true;
   this.adjustToContents();
}

// Our dialog inherits all properties and methods from the core Dialog object.
BatchFrameAcquisitionDialog.prototype = new Dialog;

/*
 * Script entry point.
 */
function main()
{
   //console.hide();
   // Show our dialog box, quit if cancelled.
   console.abortEnabled = true;
   var dialog = new BatchFrameAcquisitionDialog();
   for ( ;; )
   {
      if ( dialog.execute() )
      {
/*         if ( engine.inputFiles.length == 0 )
         {
            (new MessageBox( "No input files have been specified!", TITLE, StdIcon_Error, StdButton_Ok )).execute();
            continue;
         }

#ifneq WARN_ON_NO_OUTPUT_DIRECTORY 0
         if ( engine.outputDirectory.length == 0 )
            if ( (new MessageBox( "<p>No output directory has been specified.</p>" +
                                  "<p>Each converted image will be written to the directory of " +
                                  "its corresponding input file.<br>" +
                                  "<b>Are you sure?</b></p>",
                                  TITLE, StdIcon_Warning, StdButton_Yes, StdButton_No )).execute() != StdButton_Yes )
               continue;
#endif
         // Perform batch file format conversion and quit.
         console.show();
         console.abortEnabled = true;
         engine.convertFiles();

         if ( (new MessageBox( "Do you want to perform another format conversion?",
                               TITLE, StdIcon_Question, StdButton_Yes, StdButton_No )).execute() == StdButton_Yes )
            continue;*/
      }

      break;
   }
}

main();
