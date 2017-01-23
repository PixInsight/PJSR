// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// PIDocGUI.js - Released 2017/01/23 20:54:58 UTC
// ----------------------------------------------------------------------------
//
// This file is part of PixInsight Documentation Compiler Script version 1.6.2
//
// Copyright (c) 2010-2017 Pleiades Astrophoto S.L.
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
 * PixInsight Documentation Compiler
 *
 * Copyright (C) 2010-2017 Pleiades Astrophoto. All Rights Reserved.
 * Written by Juan Conejero (PTeam)
 *
 * Graphical user interface for the PIDoc compiler.
 */

#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>

#define DEFAULT_BASE_DIR_TEXT "<integrate with running platform>"

/*
 * PIDoc Compiler Dialog
 */
function PIDocCompilerDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   //

   let emWidth = this.font.width( 'M' );
   let labelWidth1 = this.font.width( "Output extension:" ) + emWidth;

   //

   this.helpLabel = new Label( this );
   this.helpLabel.styleSheet = this.scaledStyleSheet(
      "QWidget#" + this.helpLabel.uniqueId + " {"
   +     "border: 1px solid gray;"
   +     "padding: 0.25em;"
   +  "}" );
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = "<p><strong>" + TITLE + " version " + VERSION + "</strong><br/>" +
                         "Copyright &copy; 2010-2017 Pleiades Astrophoto. All Rights Reserved.</p>";
   //

   this.files_TreeBox = new TreeBox( this );
   this.files_TreeBox.multipleSelection = true;
   this.files_TreeBox.rootDecoration = false;
   this.files_TreeBox.alternateRowColor = true;
   this.files_TreeBox.setScaledMinSize( 600, 120 );
   this.files_TreeBox.numberOfColumns = 1;
   this.files_TreeBox.headerVisible = false;

   for ( let i = 0; i < workingData.inputFiles.length; ++i )
   {
      let node = new TreeBoxNode( this.files_TreeBox );
      node.setText( 0, workingData.inputFiles[i] );
   }

   this.filesAdd_Button = new PushButton( this );
   this.filesAdd_Button.text = "Add Files";
   this.filesAdd_Button.icon = this.scaledResource( ":/icons/add.png" );
   this.filesAdd_Button.toolTip = "<p>Add pidoc source files to the list.</p>";

   this.filesAdd_Button.onClick = function()
   {
      let ofd = new OpenFileDialog;
      ofd.multipleSelections = true;
      ofd.caption = "Select PIDoc Source Files";
      ofd.filters = [ ["PIDoc source files", "*.pidoc"], ["Any files", "*"] ];

      if ( ofd.execute() )
      {
         let newFiles = 0;
         for ( let i = 0; i < ofd.fileNames.length; ++i )
            if ( workingData.inputFiles.indexOf( ofd.fileNames[i] ) < 0 )
            {
               if ( ++newFiles == 1 )
                  this.dialog.files_TreeBox.canUpdate = false;
               let node = new TreeBoxNode( this.dialog.files_TreeBox );
               node.setText( 0, ofd.fileNames[i] );
               workingData.inputFiles.push( ofd.fileNames[i] );
            }
         if ( newFiles > 0 )
         {
            this.dialog.files_TreeBox.canUpdate = true;
            if ( newFiles < ofd.fileNames.length )
               (new MessageBox( format( "<p>Only %d PIDoc files (out of %d) have been added to the input list; %d files were already selected.</p>",
                                        newFiles, ofd.fileNames.length, ofd.fileNames.length-newFiles ),
                                TITLE, StdIcon_Warning, StdButton_Ok )).execute();
         }
         else
            (new MessageBox( "<p>No PIDoc files have been added to the input list: all of the specified files were already selected.</p>",
                             TITLE, StdIcon_Warning, StdButton_Ok )).execute();
      }
   };

   this.filesAddDirectory_Button = new PushButton( this );
   this.filesAddDirectory_Button.text = "Add Directory";
   this.filesAddDirectory_Button.icon = this.scaledResource( ":/icons/add.png" );
   this.filesAddDirectory_Button.toolTip = "<p>Recursively search a directory tree and add all pidoc source files found to the list.</p>";

   this.filesAddDirectory_Button.onClick = function()
   {
      let gdd = new GetDirectoryDialog;
      gdd.caption = "Select PIDoc Source Directory";
      if ( gdd.execute() )
      {
         let baseDirectory = File.fullPath( gdd.directory );
         if ( baseDirectory[baseDirectory.length-1] == '/' ) // remove a terminating slash
            if ( baseDirectory != "/" )
               baseDirectory.slice( baseDirectory.length-1, -1 );

         let sourceFiles = searchDirectory( baseDirectory + "/*.pidoc", true/*recursive*/ );
         if ( sourceFiles.length > 0 )
         {
            let newFiles = 0;
            for ( let i = 0; i < sourceFiles.length; ++i )
               if ( workingData.inputFiles.indexOf( sourceFiles[i] ) < 0 )
               {
                  if ( ++newFiles == 1 )
                     this.dialog.files_TreeBox.canUpdate = false;
                  let node = new TreeBoxNode( this.dialog.files_TreeBox );
                  node.setText( 0, sourceFiles[i] );
                  workingData.inputFiles.push( sourceFiles[i] );
               }
            if ( newFiles > 0 )
            {
               this.dialog.files_TreeBox.canUpdate = true;
               if ( newFiles < sourceFiles.length )
                  (new MessageBox( format( "<p>Only %d PIDoc files (out of %d) have been added to the input list; %d files were already selected.</p>",
                                           newFiles, sourceFiles.length, sourceFiles.length-newFiles ),
                                   TITLE, StdIcon_Warning, StdButton_Ok )).execute();
            }
            else
               (new MessageBox( "<p>No PIDoc files have been added to the input list: all of the files found were already selected.</p>",
                                TITLE, StdIcon_Warning, StdButton_Ok )).execute();
         }
         else
            (new MessageBox( "<p>No source PIDoc files were found on the specified directory:</p>" +
                             "<p>" + baseDirectory + "</p>",
                             TITLE, StdIcon_Warning, StdButton_Ok )).execute();
      }
   };

   this.filesClear_Button = new PushButton( this );
   this.filesClear_Button.text = "Clear";
   this.filesClear_Button.icon = this.scaledResource( ":/icons/clear.png" );
   this.filesClear_Button.toolTip = "<p>Clear the list of input source files.</p>";

   this.filesClear_Button.onClick = function()
   {
      this.dialog.files_TreeBox.clear();
      workingData.inputFiles = new Array;
   };

   this.filesInvert_Button = new PushButton( this );
   this.filesInvert_Button.text = "Invert Selection";
   this.filesInvert_Button.icon = this.scaledResource( ":/icons/select-invert.png" );
   this.filesInvert_Button.toolTip = "<p>Invert the current selection of input files.</p>";

   this.filesInvert_Button.onClick = function()
   {
      for ( let i = 0; i < this.dialog.files_TreeBox.numberOfChildren; ++i )
         this.dialog.files_TreeBox.child( i ).selected =
               !this.dialog.files_TreeBox.child( i ).selected;
   };

   this.filesRemove_Button = new PushButton( this );
   this.filesRemove_Button.text = "Remove Selected";
   this.filesRemove_Button.icon = this.scaledResource( ":/icons/delete.png" );
   this.filesRemove_Button.toolTip = "<p>Remove all selected files from the list.</p>";

   this.filesRemove_Button.onClick = function()
   {
      workingData.inputFiles = new Array;
      for ( let i = 0; i < this.dialog.files_TreeBox.numberOfChildren; ++i )
         if ( !this.dialog.files_TreeBox.child( i ).selected )
            workingData.inputFiles.push( this.dialog.files_TreeBox.child( i ).text( 0 ) );
      for ( let i = this.dialog.files_TreeBox.numberOfChildren; --i >= 0; )
         if ( this.dialog.files_TreeBox.child( i ).selected )
            this.dialog.files_TreeBox.remove( i );
   };

   this.filesButtons_Sizer = new HorizontalSizer;
   this.filesButtons_Sizer.spacing = 8;
   this.filesButtons_Sizer.add( this.filesAdd_Button );
   this.filesButtons_Sizer.add( this.filesAddDirectory_Button );
   this.filesButtons_Sizer.addSpacing( 8 );
   this.filesButtons_Sizer.addStretch();
   this.filesButtons_Sizer.add( this.filesClear_Button );
   this.filesButtons_Sizer.addSpacing( 8 );
   this.filesButtons_Sizer.addStretch();
   this.filesButtons_Sizer.add( this.filesInvert_Button );
   this.filesButtons_Sizer.add( this.filesRemove_Button );

   this.files_GroupBox = new GroupBox( this );
   this.files_GroupBox.title = "PIDoc Source Files";
   this.files_GroupBox.sizer = new VerticalSizer;
   this.files_GroupBox.sizer.margin = 8;
   this.files_GroupBox.sizer.spacing = 8;
   this.files_GroupBox.sizer.add( this.files_TreeBox, 100 );
   this.files_GroupBox.sizer.add( this.filesButtons_Sizer );

   //

   this.baseDir_Edit = new Edit( this );
   this.baseDir_Edit.toolTip = "<p>Root directory of the target PixInsight documentation system.</p>" +
      "<p>If this field is left blank (or with its default \"&lt;integrate...&gt;\" value), the compiler output " +
      "will be integrated with the running PixInsight platform.</p>" +
      "<p>Specify a custom directory to generate documentation on a separate documentation system. This can be " +
      "useful to compile documents for public distribution.</p>";

   this.baseDir_Edit.onEditCompleted = function()
   {
      let dir = File.windowsPathToUnix( this.text.trim() );
      if ( dir == DEFAULT_BASE_DIR_TEXT )
         dir = "";
      else if ( dir.endsWith( '/' ) )
         dir = dir.substring( 0, dir.length-1 );
      workingData.baseDirectory = dir;
      if ( dir.isEmpty() )
         this.text = DEFAULT_BASE_DIR_TEXT;
      else
         this.text = dir;
   };

   this.baseDir_Edit.onGetFocus = function()
   {
      if ( this.text.trim() == DEFAULT_BASE_DIR_TEXT )
         this.clear();
   };

   this.baseDir_Edit.onLoseFocus = function()
   {
      if ( this.text.trim().isEmpty() )
         this.text = DEFAULT_BASE_DIR_TEXT;
   };

   this.baseDirClear_Button = new ToolButton( this );
   this.baseDirClear_Button.icon = this.scaledResource( ":/icons/clear.png" );
   this.baseDirClear_Button.setScaledFixedSize( 20, 20 );
   this.baseDirClear_Button.toolTip = "<p>Clear target system directory.</p>";
   this.baseDirClear_Button.onClick = function()
   {
      this.dialog.baseDir_Edit.clear();
      this.dialog.baseDir_Edit.onEditCompleted();
   };

   this.baseDirSelect_Button = new ToolButton( this );
   this.baseDirSelect_Button.icon = this.scaledResource( ":/icons/select-file.png" );
   this.baseDirSelect_Button.setScaledFixedSize( 20, 20 );
   this.baseDirSelect_Button.toolTip = "<p>Select the target PIDoc system directory.</p>";
   this.baseDirSelect_Button.onClick = function()
   {
      let gdd = new GetDirectoryDialog;
      gdd.initialPath = workingData.baseDirectory;
      gdd.caption = "Select Target PIDoc System Directory";
      if ( gdd.execute() )
      {
         let dir = gdd.directory;
         if ( dir.endsWith( '/' ) )
            dir = dir.substring( 0, dir.length-1 );
         this.dialog.baseDir_Edit.text = workingData.baseDirectory = dir;
      }
   };

   this.baseDir_Sizer = new HorizontalSizer;
   this.baseDir_Sizer.add( this.baseDir_Edit, 100 );
   this.baseDir_Sizer.addSpacing( 4 );
   this.baseDir_Sizer.add( this.baseDirClear_Button );
   this.baseDir_Sizer.addSpacing( 2 );
   this.baseDir_Sizer.add( this.baseDirSelect_Button );

   //

   this.generateNewSystem_CheckBox = new CheckBox( this );
   this.generateNewSystem_CheckBox.text = "Generate new PIDoc system";
   this.generateNewSystem_CheckBox.toolTip =
      "<p>Generate a new PIDoc system directory tree on the target directory. This option is useful to generate a new " +
      "documentation system for authoring and testing purposes.</p>" +
      "<p><b>Important:</b> For security reasons, the target directory must be empty for this option to work. If a " +
      "nonempty directory is specified, the compiler will refuse to work until this option is disabled.</p>";

   this.generateNewSystem_CheckBox.onClick = function( checked )
   {
      workingData.generateNewSystem = checked;
   };

   this.generateNewSystem_Sizer = new HorizontalSizer;
   this.generateNewSystem_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.generateNewSystem_Sizer.add( this.generateNewSystem_CheckBox );
   this.generateNewSystem_Sizer.addStretch();

   //

   this.baseDir_GroupBox = new GroupBox( this );
   this.baseDir_GroupBox.title = "Target System";
   this.baseDir_GroupBox.sizer = new VerticalSizer;
   this.baseDir_GroupBox.sizer.margin = 8;
   this.baseDir_GroupBox.sizer.spacing = 4;
   this.baseDir_GroupBox.sizer.add( this.baseDir_Sizer );
   this.baseDir_GroupBox.sizer.add( this.generateNewSystem_Sizer );

   //

   let documentType_ToolTip = "<p>The type of generated documents: either HTML 5 or XHTML 1.0 Strict.</p>"

   this.documentType_Label = new Label( this );
   this.documentType_Label.text = "Document type:";
   this.documentType_Label.minWidth = labelWidth1;
   this.documentType_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.documentType_Label.toolTip = documentType_ToolTip;

   this.documentType_ComboBox = new ComboBox( this );
   this.documentType_ComboBox.addItem( "HTML 5" );
   this.documentType_ComboBox.addItem( "XHTML 1.0 Strict" );
   this.documentType_ComboBox.toolTip = documentType_ToolTip;

   this.documentType_ComboBox.onItemSelected = function( item )
   {
      workingData.generateHTML5 = item == 0;
   };

   this.documentType_Sizer = new HorizontalSizer;
   this.documentType_Sizer.spacing = 4;
   this.documentType_Sizer.add( this.documentType_Label );
   this.documentType_Sizer.add( this.documentType_ComboBox, 100 );

   //

   this.generateOutput_CheckBox = new CheckBox( this );
   this.generateOutput_CheckBox.text = "Generate output documents";
   this.generateOutput_CheckBox.toolTip =
      "<p>If this option is enabled, the PIDoc compiler will generate output documentation files in " +
      "HTML 5 or XHTML format, integrated with the specified PIDoc target system. Otherwise, source " +
      "files will be compiled but no output will be generated. Disabling this option can be useful " +
      "for syntax verification purposes.</p>" +
      "<p>This option is enabled by default.</p>";

   this.generateOutput_CheckBox.onClick = function( checked )
   {
      workingData.generateOutput = checked;
   };

   this.generateOutput_Sizer = new HorizontalSizer;
   this.generateOutput_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.generateOutput_Sizer.add( this.generateOutput_CheckBox );
   this.generateOutput_Sizer.addStretch();

   //

   this.renderEquations_CheckBox = new CheckBox( this );
   this.renderEquations_CheckBox.text = "Render LaTeX equations";
   this.renderEquations_CheckBox.toolTip =
      "<p>When this option is enabled, the PIDoc compiler will render in SVG format all LaTeX equations " +
      "specified with \\equation and \\im commands. Note that you can also control equation rendering from " +
      "PIDoc source code using \\pragma command parameters.</p>" +
      "<p>This option is enabled by default.</b></p>";

   this.renderEquations_CheckBox.onClick = function( checked )
   {
      workingData.renderEquations = checked;
   };

   this.renderEquations_Sizer = new HorizontalSizer;
   this.renderEquations_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.renderEquations_Sizer.add( this.renderEquations_CheckBox );
   this.renderEquations_Sizer.addStretch();

   //

   this.highlightCode_CheckBox = new CheckBox( this );
   this.highlightCode_CheckBox.text = "Apply syntax highlighting";
   this.highlightCode_CheckBox.toolTip =
      "<p>If this option is enabled, the PIDoc compiler will apply syntax highlighting to source code blocks " +
      "specified with \\code commands. You can also control syntax highlighting from PIDoc source code using " +
      "\\pragma command parameters.</p>" +
      "<p>This option is enabled by default.</b></p>";

   this.highlightCode_CheckBox.onClick = function( checked )
   {
      workingData.highlightCode = checked;
   };

   this.highlightCode_Sizer = new HorizontalSizer;
   this.highlightCode_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.highlightCode_Sizer.add( this.highlightCode_CheckBox );
   this.highlightCode_Sizer.addStretch();

   //

   this.numberAllEquations_CheckBox = new CheckBox( this );
   this.numberAllEquations_CheckBox.text = "Default numbered equations";
   this.numberAllEquations_CheckBox.toolTip =
      "<p>Number all equations by default. If this option is enabled, all equations will be numbered unless the " +
      "\\equation[unnumbered] parameter is specified. If this option is disabled, only equations with the " +
      "\\equation[numbered] parameter will be numbered. Note that you can also control default equation numbering from " +
      "PIDoc source code using \\pragma command parameters.</p>" +
      "<p>This option is disabled by default.</b></p>";

   this.numberAllEquations_CheckBox.onClick = function( checked )
   {
      workingData.numberAllEquations = checked;
   };

   this.numberAllEquations_Sizer = new HorizontalSizer;
   //this.numberAllEquations_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.numberAllEquations_Sizer.add( this.numberAllEquations_CheckBox );
   this.numberAllEquations_Sizer.addStretch();

   //

   this.numberAllFigures_CheckBox = new CheckBox( this );
   this.numberAllFigures_CheckBox.text = "Default numbered figures";
   this.numberAllFigures_CheckBox.toolTip =
      "<p>Number all figures by default. If this option is enabled, all figures will be numbered unless the " +
      "\\figure[unnumbered] parameter is specified. If this option is disabled, only figures with the " +
      "\\figure[numbered] parameter will be numbered. Note that you can also control default figure numbering from " +
      "PIDoc source code using \\pragma command parameters.</p>" +
      "<p>This option is enabled by default.</b></p>";

   this.numberAllFigures_CheckBox.onClick = function( checked )
   {
      workingData.numberAllFigures = checked;
   };

   this.numberAllFigures_Sizer = new HorizontalSizer;
   //this.numberAllFigures_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.numberAllFigures_Sizer.add( this.numberAllFigures_CheckBox );
   this.numberAllFigures_Sizer.addStretch();

   //

   this.numberAllTables_CheckBox = new CheckBox( this );
   this.numberAllTables_CheckBox.text = "Default numbered tables";
   this.numberAllTables_CheckBox.toolTip =
      "<p>Number all tables by default. If this option is enabled, all tables will be numbered unless the " +
      "\\table[unnumbered] parameter is specified. If this option is disabled, only tables with the " +
      "\\table[numbered] parameter will be numbered. Note that you can also control default table numbering from " +
      "PIDoc source code using \\pragma command parameters.</p>" +
      "<p>This option is enabled by default.</b></p>";

   this.numberAllTables_CheckBox.onClick = function( checked )
   {
      workingData.numberAllTables = checked;
   };

   this.numberAllTables_Sizer = new HorizontalSizer;
   //this.numberAllTables_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.numberAllTables_Sizer.add( this.numberAllTables_CheckBox );
   this.numberAllTables_Sizer.addStretch();

   //

   this.backupExistingFiles_CheckBox = new CheckBox( this );
   this.backupExistingFiles_CheckBox.text = "Backup existing files";
   this.backupExistingFiles_CheckBox.toolTip =
      "<p>When this option is enabled, the PIDoc compiler will create backup duplicates of all existing " +
      "output files (e.g. XHTML documents and images). If this option is disabled, all existing files " +
      "will be overwritten and <b>their original contents will be permanently lost.</b></p>" +
      "<p>This option is <b>disabled by default.</b></p>";

   this.backupExistingFiles_CheckBox.onClick = function( checked )
   {
      workingData.backupExistingFiles = checked;
   };

   this.backupExistingFiles_Sizer = new HorizontalSizer;
   //this.backupExistingFiles_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.backupExistingFiles_Sizer.add( this.backupExistingFiles_CheckBox );
   this.backupExistingFiles_Sizer.addStretch();

   //

   this.treatWarningsAsErrors_CheckBox = new CheckBox( this );
   this.treatWarningsAsErrors_CheckBox.text = "Treat warnings as errors";
   this.treatWarningsAsErrors_CheckBox.toolTip =
      "<p>When this option is enabled, the compiler will abort compilation after emitting the first " +
      "warning message.</p>" +
      "By default, this option is disabled and the compiler continues working after showing warning " +
      "messages. Enabling this option can be useful for debugging purposes.</p>";

   this.treatWarningsAsErrors_CheckBox.onClick = function( checked )
   {
      workingData.treatWarningsAsErrors = checked;
   };

   this.treatWarningsAsErrors_Sizer = new HorizontalSizer;
   //this.treatWarningsAsErrors_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.treatWarningsAsErrors_Sizer.add( this.treatWarningsAsErrors_CheckBox );
   this.treatWarningsAsErrors_Sizer.addStretch();

   //

   this.compilerOptionsLeft_Sizer = new VerticalSizer;
   this.compilerOptionsLeft_Sizer.spacing = 4;
   this.compilerOptionsLeft_Sizer.add( this.documentType_Sizer );
   this.compilerOptionsLeft_Sizer.addStretch();
   this.compilerOptionsLeft_Sizer.add( this.generateOutput_Sizer );
   this.compilerOptionsLeft_Sizer.add( this.renderEquations_Sizer );
   this.compilerOptionsLeft_Sizer.add( this.highlightCode_Sizer );

   this.compilerOptionsRight_Sizer = new VerticalSizer;
   this.compilerOptionsRight_Sizer.spacing = 4;
   this.compilerOptionsRight_Sizer.add( this.numberAllEquations_Sizer );
   this.compilerOptionsRight_Sizer.add( this.numberAllFigures_Sizer );
   this.compilerOptionsRight_Sizer.add( this.numberAllTables_Sizer );
   this.compilerOptionsRight_Sizer.add( this.backupExistingFiles_Sizer );
   this.compilerOptionsRight_Sizer.add( this.treatWarningsAsErrors_Sizer );

   //

   this.compilerOptions_GroupBox = new GroupBox( this );
   this.compilerOptions_GroupBox.title = "Compiler Options";
   this.compilerOptions_GroupBox.sizer = new HorizontalSizer;
   this.compilerOptions_GroupBox.sizer.margin = 8;
   this.compilerOptions_GroupBox.sizer.add( this.compilerOptionsLeft_Sizer );
   this.compilerOptions_GroupBox.sizer.addSpacing( 24 );
   this.compilerOptions_GroupBox.sizer.add( this.compilerOptionsRight_Sizer );

   //

   this.reset_Button = new PushButton( this );
   this.reset_Button.text = "Reset";
   this.reset_Button.icon = this.scaledResource( ":/icons/reload.png" );
   this.reset_Button.toolTip = "<p>Reset all compiler options to factory-default settings.</p>";
   this.reset_Button.onClick = function()
   {
      workingData.resetCompilerOptions();
      this.dialog.updateCompilerOptionControls();
   };

   this.run_Button = new PushButton( this );
   this.run_Button.text = "Run";
   this.run_Button.icon = this.scaledResource( ":/icons/power.png" );
   this.run_Button.onClick = function()
   {
      this.dialog.ok();
   };

   this.exit_Button = new PushButton( this );
   this.exit_Button.text = "Exit";
   this.exit_Button.icon = this.scaledResource( ":/icons/close.png" );
   this.exit_Button.onClick = function()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 8;
   this.buttons_Sizer.add( this.reset_Button );
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.run_Button );
   this.buttons_Sizer.add( this.exit_Button );

   //

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 8;
   this.sizer.add( this.helpLabel );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.files_GroupBox, 100 );
   this.sizer.add( this.baseDir_GroupBox );
   this.sizer.add( this.compilerOptions_GroupBox );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = TITLE;
   this.userResizable = true;
   this.adjustToContents();
   this.setMinWidth();

   this.updateCompilerOptionControls = function()
   {
      this.baseDir_Edit.text = workingData.baseDirectory;
      this.baseDir_Edit.onLoseFocus();
      this.generateNewSystem_CheckBox.checked = workingData.generateNewSystem;
      this.documentType_ComboBox.currentItem = workingData.generateHTML5 ? 0 : 1;
      this.generateOutput_CheckBox.checked = workingData.generateOutput;
      this.renderEquations_CheckBox.checked = workingData.renderEquations;
      this.highlightCode_CheckBox.checked = workingData.highlightCode;
      this.numberAllEquations_CheckBox.checked = workingData.numberAllEquations;
      this.numberAllFigures_CheckBox.checked = workingData.numberAllFigures;
      this.numberAllTables_CheckBox.checked = workingData.numberAllTables;
      this.backupExistingFiles_CheckBox.checked = workingData.backupExistingFiles;
      this.treatWarningsAsErrors_CheckBox.checked = workingData.treatWarningsAsErrors;
   };

   this.updateCompilerOptionControls();
}

PIDocCompilerDialog.prototype = new Dialog;

// ----------------------------------------------------------------------------
// EOF PIDocGUI.js - Released 2017/01/23 20:54:58 UTC
