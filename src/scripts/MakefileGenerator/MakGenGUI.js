// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// MakGenGUI.js - Released 2019-01-20T14:05:16Z
// ----------------------------------------------------------------------------
//
// This file is part of PixInsight Makefile Generator Script version 1.109
//
// Copyright (c) 2009-2019 Pleiades Astrophoto S.L.
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
 * PixInsight Makefile Generator
 *
 * Automatic generation of PCL makefiles and projects for FreeBSD, Linux,
 * Mac OS X and Windows platforms.
 *
 * Copyright (c) 2009-2019, Pleiades Astrophoto S.L. All Rights Reserved.
 * Written by Juan Conejero (PTeam)
 *
 * Graphical user interface.
 */

/*
 * Makefile Generator Dialog
 */
function MakefileGeneratorDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   //

   let emWidth = this.font.width( 'M' );
   let labelWidth1 = this.font.width( "Preprocessor definitions:" ) + emWidth;

   //

   this.helpLabel = new Label( this );
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.margin = 4;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = "<b>" + TITLE + " v" + VERSION + "</b> &mdash; Automatic " +
          "generation of PCL makefiles and project files for PixInsight modules, " +
          "executables and libraries on Linux, FreeBSD, macOS and Windows platforms.";

   //

#define TOOLTIP_DIR \
"<p>The project directory contains all source files for your project.</p>" + \
"<p>The MakefileGenerator script will create several subdirectories on this directory, " + \
"where makefiles and project files will be generated.</p>"

   this.directory_Label = new Label( this );
   this.directory_Label.text = "Project directory:";
   this.directory_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.directory_Label.minWidth = labelWidth1;
   this.directory_Label.toolTip = TOOLTIP_DIR;

   this.directory_Edit = new Edit( this );
   this.directory_Edit.text = "";
   this.directory_Edit.minWidth = 60*emWidth;
   this.directory_Edit.toolTip = TOOLTIP_DIR;

   this.selectDirectory_Button = new ToolButton( this );
   this.selectDirectory_Button.icon = this.scaledResource( ":/browser/select-file.png" );
   this.selectDirectory_Button.setScaledFixedSize( 20, 20 );
   this.selectDirectory_Button.toolTip = "<p>Select the project directory.</p>";
   this.selectDirectory_Button.onClick = function()
   {
      let gdd = new GetDirectoryDialog;
      gdd.caption = "Select Project Directory";
      if ( gdd.execute() )
         this.dialog.directory_Edit.text = gdd.directory;
   };

   this.directory_Sizer = new HorizontalSizer;
   this.directory_Sizer.spacing = 4;
   this.directory_Sizer.add( this.directory_Label );
   this.directory_Sizer.add( this.directory_Edit, 100 );
   this.directory_Sizer.add( this.selectDirectory_Button );

   //

#define TOOLTIP_ID \
"<p>Identifier of the PixInsight project.</p>" + \
"<p>If you leave it blank, the name of the project directory that you have selected " + \
"will be used as the project's identifier.</p>"

   this.id_Label = new Label( this );
   this.id_Label.text = "Project identifier:";
   this.id_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.id_Label.minWidth = labelWidth1;
   this.id_Label.toolTip = TOOLTIP_ID;

   this.id_Edit = new Edit( this );
   this.id_Edit.text = "";
   this.id_Edit.minWidth = 40*emWidth;
   this.id_Edit.toolTip = TOOLTIP_ID;
   this.id_Edit.onEditCompleted = function()
   {
      this.text = this.text.trim();
   };

   this.id_Sizer = new HorizontalSizer;
   this.id_Sizer.spacing = 4;
   this.id_Sizer.add( this.id_Label );
   this.id_Sizer.add( this.id_Edit );
   this.id_Sizer.addStretch();

   //

#define TOOLTIP_TYPE \
"<p>Select the project type:</p>" + \
"<p><b>Module</b> generates makefiles and projects for a process or file format " + \
"support PixInsight module that uses the PCL static library. A PixInsight module is " + \
"a special dynamic library that carries the -pxm name suffix. File extensions are " + \
".so (Linux and FreeBSD), .dylib (macOS) and .dll (Windows).</p>" +  \
"<p><b>Dynamic library</b> generates makefiles and project files for a regular " + \
"dynamic library that carries the -pxi name suffix. PCL include and library " + \
"directories are used in these projects, but the PCL static library is not linked " + \
"automatically.</p>" + \
"<p><b>Static library</b> produces makefiles and project files for a static library " + \
"with the -pxi name suffix. These projects use PCL include directories.</p>" + \
"<p><b>Standalone executable</b> generates makefiles and project files for an executable " + \
"that uses the PCL static library. Other than PCL-pxi and the standard system libraries, " + \
"no objects are explicitly linked to these projects.</p>" + \
"<p><b>PixInsight Class Library</b> generates makefiles and project files for the PCL " + \
"static library (libPCL-pxi.a and PCL.lib).</p>" + \
"<p><strong>*** The following project types are intended for internal PTeam use exclusively.</strong></p>" + \
"<p><b>Core application</b> is a special project to build the PixInsight Core " + \
"application executable with PCL, Qt and other third-party libraries.</p>" + \
"<p><b>Core auxiliary program</b> is a special project to build PixInsight Core auxiliary " + \
"executables with PCL libraries and Qt-based graphical interfaces.</p>" + \
"<p><b>Standard PixInsight modules</b> is a special batch procedure to generate makefiles " + \
"for all standard PixInsight modules.</p>" + \
"<p><b>Entire PixInsight platform</b> is a special batch procedure to generate makefiles " + \
"for all applications, libraries and modules pertaining to the PixInsight platform.</p>"

   this.type_Label = new Label( this );
   this.type_Label.text = "Project type:";
   this.type_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.type_Label.minWidth = labelWidth1;
   this.type_Label.toolTip = TOOLTIP_TYPE;

   this.type_ComboBox = new ComboBox( this );
   this.type_ComboBox.addItem( "Module" );
   this.type_ComboBox.addItem( "Dynamic library" );
   this.type_ComboBox.addItem( "Static library" );
   this.type_ComboBox.addItem( "Standalone executable" );
   this.type_ComboBox.addItem( "PixInsight Class Library (PCL)" );
   this.type_ComboBox.addItem( "Core PixInsight application *" );
   this.type_ComboBox.addItem( "Core auxiliary program *" );
   this.type_ComboBox.addItem( "Standard PixInsight modules *" );
   this.type_ComboBox.addItem( "Entire PixInsight platform *" );
   this.type_ComboBox.toolTip = TOOLTIP_TYPE;
   this.type_ComboBox.setMinWidth( 40*emWidth );
   this.type_ComboBox.onItemSelected = function( index )
   {
      this.dialog.updateControls();
   };

   this.type_Sizer = new HorizontalSizer;
   this.type_Sizer.spacing = 4;
   this.type_Sizer.add( this.type_Label );
   this.type_Sizer.add( this.type_ComboBox, 100 );
   this.type_Sizer.addStretch();

   //

#define TOOLTIP_PLATFORM \
"<p>Select a platform to generate makefiles / project files:</p>" + \
"<p><b>X11 on FreeBSD</b> with the system Clang compiler.</p>" + \
"<p><b>X11 on Linux</b> with the GNU Compiler Collection version 4.8.5 or higher.</p>" + \
"<p><b>macOS 10.11 or later</b> with the Clang compiler - XCode 8.0 or later.</p>" + \
"<p><b>Windows</b> with Microsoft Visual C++ 2017 (.vcxproj project files)</p>" + \
"<p><b>Host development machine</b> is a Linux physical development workstation. <b>* for internal PTeam use *</b></p>"

   this.platform_Label = new Label( this );
   this.platform_Label.text = "Platform:";
   this.platform_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.platform_Label.minWidth = labelWidth1;
   this.platform_Label.toolTip = TOOLTIP_PLATFORM;

   this.platform_ComboBox = new ComboBox( this );
   this.platform_ComboBox.addItem( "FreeBSD/X11 with system Clang compiler" );
   this.platform_ComboBox.addItem( "Linux/X11 with GCC >= 4.8.5" );
   this.platform_ComboBox.addItem( "macOS 10.11 or later with Clang / Xcode >= 8.0" );
   this.platform_ComboBox.addItem( "Windows with MS Visual C++ 2017" );
   this.platform_ComboBox.addItem( "Host physical Linux development machine" );
   this.platform_ComboBox.toolTip = TOOLTIP_PLATFORM;
   this.platform_ComboBox.setMinWidth( 40*emWidth );

   this.platform_ComboBox.onItemSelected = function( index )
   {
      this.dialog.updateControls();
   };

#define TOOLTIP_ALLPLATF \
"<p>Generate makefiles and project files for all supported platforms: " + \
"X11/FreeBSD, X11/Linux, macOS, and Windows.</p>"

   this.allPlatforms_CheckBox = new CheckBox( this );
   this.allPlatforms_CheckBox.text = "All platforms";
   this.allPlatforms_CheckBox.checked = true;
   this.allPlatforms_CheckBox.toolTip = TOOLTIP_ALLPLATF;

   this.allPlatforms_CheckBox.onCheck = function( checked )
   {
      this.dialog.updateControls();
   };

   this.platform_Sizer = new HorizontalSizer;
   this.platform_Sizer.spacing = 4;
   this.platform_Sizer.add( this.platform_Label );
   this.platform_Sizer.add( this.platform_ComboBox, 100 );
   this.platform_Sizer.addSpacing( 6 );
   this.platform_Sizer.add( this.allPlatforms_CheckBox );
   this.platform_Sizer.addStretch();

   //

#define TOOLTIP_ARCH \
"<p>Select a platform to generate makefiles / project files:</p>" + \
"<p><b>x86</b> projects generate 32-bit code. " + \
"SSE2 instructions are generated on FreeBSD, Linux and Windows. SSE3 instructions are generated on macOS.</p>" + \
"<p><b>x64</b> projects generate 64-bit code compatible with AMD64 and Intel64 architectures. " + \
"SSE3 instructions are generated on all platforms.</p>" + \
"<p>This option is disabled for Windows platforms, since a VC++ project includes configurations " + \
"for both Win32 and x64 architectures.</p>" + \
"<p><b>Important:</b> PCL development on/for 32-bit architectures is deprecated. " + \
"All 32-bit versions of PixInsight are obsolete and unsupported.</p>"

   this.architecture_Label = new Label( this );
   this.architecture_Label.text = "Architecture:";
   this.architecture_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.architecture_Label.minWidth = labelWidth1;
   this.architecture_Label.toolTip = TOOLTIP_ARCH;

   this.architecture_ComboBox = new ComboBox( this );
   this.architecture_ComboBox.addItem( "x86 (32-bit) *** Deprecated ***" );
   this.architecture_ComboBox.addItem( "x64 (64-bit)" );
   this.architecture_ComboBox.toolTip = TOOLTIP_ARCH;
   this.architecture_ComboBox.setMinWidth( 40*emWidth );
   this.architecture_ComboBox.currentItem = ARCH_X64;

#define TOOLTIP_ALLARCH \
"<p>Generate makefiles and project files for all supported architectures: " + \
"x86 (32-bit) and x64 (64-bit).</p>" + \
"<p><b>Important:</b> PCL development on/for 32-bit architectures is deprecated. " + \
"All 32-bit versions of PixInsight are obsolete and unsupported.</p>"

   this.allArchitectures_CheckBox = new CheckBox( this );
   this.allArchitectures_CheckBox.text = "All architectures";
   this.allArchitectures_CheckBox.checked = false;
   this.allArchitectures_CheckBox.toolTip = TOOLTIP_ALLARCH;

   this.allArchitectures_CheckBox.onCheck = function( checked )
   {
      this.dialog.updateControls();
   };

   this.architecture_Sizer = new HorizontalSizer;
   this.architecture_Sizer.spacing = 4;
   this.architecture_Sizer.add( this.architecture_Label );
   this.architecture_Sizer.add( this.architecture_ComboBox, 100 );
   this.architecture_Sizer.addSpacing( 6 );
   this.architecture_Sizer.add( this.allArchitectures_CheckBox );
   this.architecture_Sizer.addStretch();

   //

#define TOOLTIP_HOST_MAKEFILES \
"<p>Generate makefiles for a host Linux machine. This option is useful when the development machine " + \
"runs a modern Linux distribution that is incompatible with the official PixInsight Linux distribution " + \
"because of a too modern glibc version. In these cases, typically a virtual machine is used to build " + \
"compatible Linux modules on a relatively old distribution such as RHEL 7, Fedora 24 or Ubuntu 16.</p>"

   this.hostMakefiles_CheckBox = new CheckBox( this );
   this.hostMakefiles_CheckBox.text = "Generate host Linux makefiles";
   this.hostMakefiles_CheckBox.checked = false;
   this.hostMakefiles_CheckBox.toolTip = TOOLTIP_HOST_MAKEFILES;

   this.hostMakefiles_Sizer = new HorizontalSizer;
   this.hostMakefiles_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.hostMakefiles_Sizer.add( this.hostMakefiles_CheckBox );
   this.hostMakefiles_Sizer.addStretch();

   //

#define TOOLTIP_OSX_ARCH_OPTIONS \
"<p>If this is checked, -arch xxx and -Xarch_xxx compiler and linker command line arguments will be " + \
"included in makefiles for macOS. This option is enabled by default.</p>"

   this.osxArchOptions_CheckBox = new CheckBox( this );
   this.osxArchOptions_CheckBox.text = "Generate architecture options on macOS";
   this.osxArchOptions_CheckBox.checked = true;
   this.osxArchOptions_CheckBox.toolTip = TOOLTIP_OSX_ARCH_OPTIONS;

   this.osxArchOptions_Sizer = new HorizontalSizer;
   this.osxArchOptions_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.osxArchOptions_Sizer.add( this.osxArchOptions_CheckBox );
   this.osxArchOptions_Sizer.addStretch();

   //

#define TOOLTIP_OSX_SDK_VERSION \
"<p>This is the version xx.yy of the MacOSXxx.yy.sdk directory specified with the -isysroot argument " + \
"for compilation on macOS. The SDK directory provides a complete set of compilers, headers, libraries, " + \
"frameworks, etc, necessary to build PCL-based modules on macOS. The default SDK version is 10.12.</p>"

   this.osxSDKVersion_Label = new Label( this );
   this.osxSDKVersion_Label.text = "macOS SDK version:";
   this.osxSDKVersion_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.osxSDKVersion_Label.minWidth = labelWidth1;
   this.osxSDKVersion_Label.toolTip = TOOLTIP_OSX_SDK_VERSION;

   this.osxSDKVersion_ComboBox = new ComboBox( this );
   this.osxSDKVersion_ComboBox.addItem( "10.11" );
   this.osxSDKVersion_ComboBox.addItem( "10.12" );
   this.osxSDKVersion_ComboBox.addItem( "10.13" );
   this.osxSDKVersion_ComboBox.addItem( "10.14" );
   this.osxSDKVersion_ComboBox.addItem( "10.15" );
   this.osxSDKVersion_ComboBox.toolTip = TOOLTIP_OSX_SDK_VERSION;
   this.osxSDKVersion_ComboBox.setMinWidth( 16*emWidth );
   this.osxSDKVersion_ComboBox.currentItem = this.osxSDKVersion_ComboBox.findItem( DEFAULT_OSX_SDK_VERSION );

   this.osxSDKVersion_Sizer = new HorizontalSizer;
   this.osxSDKVersion_Sizer.spacing = 4;
   this.osxSDKVersion_Sizer.add( this.osxSDKVersion_Label );
   this.osxSDKVersion_Sizer.add( this.osxSDKVersion_ComboBox, 100 );
   this.osxSDKVersion_Sizer.addStretch();

   //

#define TOOLTIP_SIGNED_CODE \
"<p>If this option is enabled, modules and executables will be signed with the codesign and signtool " + \
"utilities on macOS and Windows, respectively.</p>"

   this.signed_CheckBox = new CheckBox( this );
   this.signed_CheckBox.text = "Signed code";
   this.signed_CheckBox.checked = DEFAULT_SIGNED_CODE;
   this.signed_CheckBox.toolTip = TOOLTIP_SIGNED_CODE;

   this.signed_CheckBox.onCheck = function( checked )
   {
      this.dialog.updateControls();
   };

   this.signed_Sizer = new HorizontalSizer;
   this.signed_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.signed_Sizer.add( this.signed_CheckBox );
   this.signed_Sizer.addStretch();

   //

#define TOOLTIP_SIGNING_IDENTITY \
"<p>When code signing is enabled, this is the signing identity specified with the -s argument of the " + \
"codesign utility on macOS. With the signtool on Windows, signing identities are selected automatically.</p>"

   this.signingIdentity_Label = new Label( this );
   this.signingIdentity_Label.text = "Code signing identity:";
   this.signingIdentity_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.signingIdentity_Label.minWidth = labelWidth1;
   this.signingIdentity_Label.toolTip = TOOLTIP_SIGNING_IDENTITY;

   this.signingIdentity_Edit = new Edit( this );
   this.signingIdentity_Edit.text = DEFAULT_CODE_SIGNING_IDENTITY;
   this.signingIdentity_Edit.minWidth = 10*emWidth;
   this.signingIdentity_Edit.toolTip = TOOLTIP_SIGNING_IDENTITY;

   this.signingIdentity_Sizer = new HorizontalSizer;
   this.signingIdentity_Sizer.spacing = 4;
   this.signingIdentity_Sizer.add( this.signingIdentity_Label );
   this.signingIdentity_Sizer.add( this.signingIdentity_Edit );
   this.signingIdentity_Sizer.addStretch();

   //

#define TOOLTIP_DEBUG \
"<p>Select this option to generate makefiles for a debug configuration on FreeBSD, Linux " + \
"and macOS platforms. If this option is not selected, only release makefiles will be " + \
"generated. Note that release makefiles are always generated.</p>" + \
"<p>This option is ignored for Windows platforms, since VC++ project files always " + \
"include both release and debug configurations.</p>"

   this.gccDebug_CheckBox = new CheckBox( this );
   this.gccDebug_CheckBox.text = "Generate GCC debug makefiles";
   this.gccDebug_CheckBox.checked = false;
   this.gccDebug_CheckBox.toolTip = TOOLTIP_DEBUG;

   this.gccDebug_Sizer = new HorizontalSizer;
   this.gccDebug_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.gccDebug_Sizer.add( this.gccDebug_CheckBox );
   this.gccDebug_Sizer.addStretch();

   //

#define TOOLTIP_UNSTRIPPED \
"<p>Select this option to include the -rdynamic compiler flag in makefiles for " + \
"FreeBSD, Linux and macOS platforms. This enables generation of stack backtraces with " + \
"demangled function names. If this option is not selected, -rdynamic will not be " + \
"included and the -s flag will be used for linking to strip all symbols from binary files. " + \
"This option is disabled by default. It can be useful for debugging purposes on UNIX/Linux " + \
"platforms.</p>"

   this.gccUnstripped_CheckBox = new CheckBox( this );
   this.gccUnstripped_CheckBox.text = "Generate unstripped binaries";
   this.gccUnstripped_CheckBox.checked = false;
   this.gccUnstripped_CheckBox.toolTip = TOOLTIP_UNSTRIPPED;

   this.gccUnstripped_Sizer = new HorizontalSizer;
   this.gccUnstripped_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4 ) );
   this.gccUnstripped_Sizer.add( this.gccUnstripped_CheckBox );
   this.gccUnstripped_Sizer.addStretch();

   //

#define TOOLTIP_GCC_VERSION_SUFFIX \
"<p>This suffix allows you to control which version of the GCC compiler will be used to build " + \
"your project on Linux.</p>" + \
"<p>If this field is left blank the system default GCC compiler will be used (either g++ or gcc, " + \
"respectively to compile .cpp and .c files).</p>"

   this.gccSuffixLinux_Label = new Label( this );
   this.gccSuffixLinux_Label.text = "GCC version suffix:";
   this.gccSuffixLinux_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.gccSuffixLinux_Label.minWidth = labelWidth1;
   this.gccSuffixLinux_Label.toolTip = TOOLTIP_GCC_VERSION_SUFFIX;

   this.gccSuffixLinux_Edit = new Edit( this );
   this.gccSuffixLinux_Edit.text = DEFAULT_GCC_VERSION_SUFFIX_LINUX;
   this.gccSuffixLinux_Edit.minWidth = 10*emWidth;
   this.gccSuffixLinux_Edit.toolTip = TOOLTIP_GCC_VERSION_SUFFIX;

   this.gccSuffixLinux_Sizer = new HorizontalSizer;
   this.gccSuffixLinux_Sizer.spacing = 4;
   this.gccSuffixLinux_Sizer.add( this.gccSuffixLinux_Label );
   this.gccSuffixLinux_Sizer.add( this.gccSuffixLinux_Edit );
   this.gccSuffixLinux_Sizer.addStretch();

   //

#define TOOLTIP_OPTIMIZATION \
"<p>Optimization level for the GNU/GCC compilers (release builds). Excerpted from GCC's documentation:</p>" + \
"<ul>" + \
"<li>-O0 - Reduce compilation time and make debugging produce the expected results.</li>" + \
"<li>-O1 - Optimize. The compiler tries to reduce code size and execution time, without " + \
          "performing any optimizations that take a great deal of compilation time.</li>" + \
"<li>-O2 - Optimize even more. GCC performs nearly all supported optimizations that do " + \
          "not involve a space-speed tradeoff. This option increases both compilation " + \
          "time and the performance of the generated code.</li>" + \
"<li>-O3 - Optimize yet more. Turns on all optimizations specified by -O2 and also turns " + \
          "on the -finline-functions, -funswitch-loops, -fpredictive-commoning, " + \
          "-fgcse-after-reload, -ftree-vectorize and -fipa-cp-clone options.</li>" + \
"<li>-Ofast - Disregard strict standards compliance. -Ofast enables all -O3 optimizations. It " + \
          "also enables optimizations that are not valid for all standard-compliant programs. " + \
          "It turns on -ffast-math. This option requires GCC version 4.6 or later.</li>" + \
"<li>-Os - Optimize for size. Enables all -O2 optimizations that do not typically increase " + \
          "code size. It also performs further optimizations designed to reduce code size.</li>" + \
"</ul>" + \
"<p>This option is ignored for Windows platforms.</p>"

   this.gccOptimization_Label = new Label( this );
   this.gccOptimization_Label.text = "GCC optimization:";
   this.gccOptimization_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.gccOptimization_Label.minWidth = labelWidth1;
   this.gccOptimization_Label.toolTip = TOOLTIP_OPTIMIZATION;

   this.gccOptimization_ComboBox = new ComboBox( this );
   this.gccOptimization_ComboBox.addItem( "-00: Turn off optimizations" );
   this.gccOptimization_ComboBox.addItem( "-O1: Optimize" );
   this.gccOptimization_ComboBox.addItem( "-O2: Optimize more" );
   this.gccOptimization_ComboBox.addItem( "-O3: Optimize yet more" );
   this.gccOptimization_ComboBox.addItem( "-Os: Optimize for size" );
   this.gccOptimization_ComboBox.addItem( "-Ofast: -O3 + -ffast-math" );
   this.gccOptimization_ComboBox.toolTip = TOOLTIP_OPTIMIZATION;
   this.gccOptimization_ComboBox.setMinWidth( 40*emWidth );
   this.gccOptimization_ComboBox.currentItem = OPTIMIZATION_DEFAULT;

   this.gccOptimization_Sizer = new HorizontalSizer;
   this.gccOptimization_Sizer.spacing = 4;
   this.gccOptimization_Sizer.add( this.gccOptimization_Label );
   this.gccOptimization_Sizer.add( this.gccOptimization_ComboBox );
   this.gccOptimization_Sizer.addStretch();

   //

#define TOOLTIP_DIAGNOSTICS \
"<p>This parameter allows you to select a <i>diagnostics level</i> for PCL header files <u>in " + \
"debug builds</u>. To keep things simpler, and due to the fact that diagnostics code can have " + \
"a strong impact on performance, diagnostics are always disabled in release builds.</p>" + \
"Diagnostics code has been included in many PCL header files to verify internal consistency " + \
"and validity of function parameters. By defining a diagnostics level, you can disable or " + \
"enable diagnostics as follows:</p>" + \
"<p><b>Disabled (level 0)</b> suppresses all diagnostics code from PCL header files. This is " + \
"the default diagnostics level.</p>" + \
"<p><b>Checks only (level 1)</b> enables <i>check assertions</i>. Check assertions verify " + \
"consistency of PCL code and data at critical locations of PCL header files.</p>" + \
"<p><b>Checks + Preconditions (level 2)</b> enables also <i>precondition assertions</i>. " + \
"Preconditions verify validity of function parameters in PCL header files.</p>"

   this.diagnostics_Label = new Label( this );
   this.diagnostics_Label.text = "PCL diagnostics:";
   this.diagnostics_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.diagnostics_Label.minWidth = labelWidth1;
   this.diagnostics_Label.toolTip = TOOLTIP_DIAGNOSTICS;

   this.diagnostics_ComboBox = new ComboBox( this );
   this.diagnostics_ComboBox.addItem( "Level 0: Disabled" );
   this.diagnostics_ComboBox.addItem( "Level 1: Checks only" );
   this.diagnostics_ComboBox.addItem( "Level 2: Checks + Preconditions" );
   this.diagnostics_ComboBox.toolTip = TOOLTIP_DIAGNOSTICS;
   this.diagnostics_ComboBox.setMinWidth( 40*emWidth );

   this.diagnostics_Sizer = new HorizontalSizer;
   this.diagnostics_Sizer.spacing = 4;
   this.diagnostics_Sizer.add( this.diagnostics_Label );
   this.diagnostics_Sizer.add( this.diagnostics_ComboBox );
   this.diagnostics_Sizer.addStretch();

   //

#define TOOLTIP_EXTRADEFS \
"<p>Additional preprocessor definitions.</p>" + \
"<p>You can enter a list of definitions in the standard form &lt;id&gt;[=&lt;value&gt;]. " + \
"Note that standard PCL definitions are always included in all makefiles and project " + \
"files automatically (e.g., __PCL_FREEBSD, __PCL_LINUX, __PCL_MACOSX and __PCL_WINDOWS platform " + \
"definitions), so you don't have to specify them here.</p>" + \
"<p>Each definition must be written in a single text line.</p>"

   this.extraDefinitions_Label = new Label( this );
   this.extraDefinitions_Label.text = "Preprocessor definitions:";
   this.extraDefinitions_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.extraDefinitions_Label.minWidth = labelWidth1 - 1;
   this.extraDefinitions_Label.scaledMinHeight = 60;
   this.extraDefinitions_Label.toolTip = TOOLTIP_EXTRADEFS;

   this.extraDefinitions_TextBox = new TextBox( this );
   this.extraDefinitions_TextBox.toolTip = TOOLTIP_EXTRADEFS;
   this.extraDefinitions_TextBox.setScaledFixedHeight( 60 );

   this.extraDefinitions_Sizer = new HorizontalSizer;
   this.extraDefinitions_Sizer.spacing = 4;
   this.extraDefinitions_Sizer.add( this.extraDefinitions_Label );
   this.extraDefinitions_Sizer.add( this.extraDefinitions_TextBox, 100 );
   this.extraDefinitions_Sizer.addSpacing( 32+4 );

   //

#define TOOLTIP_EXTRAINCDIRS \
"<p>Additional include search directories.</p>" + \
"<p>This is a list of directories to find header files. Note that standard PCL " + \
"<i>include</i> directories are always included in all makefiles and project files, " + \
"as necessary, so you don't have to specify them here.</p>" + \
"<p>You can use the Add button to select directories on the filesystem. Each directory " + \
"must be defined in a single text line.</p>"

   this.extraIncludeDirs_Label = new Label( this );
   this.extraIncludeDirs_Label.text = "Include directories:";
   this.extraIncludeDirs_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.extraIncludeDirs_Label.minWidth = labelWidth1 - 1;
   this.extraIncludeDirs_Label.scaledMinHeight = 60;
   this.extraIncludeDirs_Label.toolTip = TOOLTIP_EXTRAINCDIRS;

   this.extraIncludeDirs_TextBox = new TextBox( this );
   this.extraIncludeDirs_TextBox.toolTip = TOOLTIP_EXTRAINCDIRS;
   this.extraIncludeDirs_TextBox.setScaledFixedHeight( 60 );

   this.addIncludeDir_Button = new ToolButton( this );
   this.addIncludeDir_Button.icon = this.scaledResource( ":/icons/add.png" );
   this.addIncludeDir_Button.setScaledFixedSize( 32, 32 );
   this.addIncludeDir_Button.toolTip = "<p>Add an include search directory.</p>";

   this.addIncludeDir_Button.onClick = function()
   {
      let gdd = new GetDirectoryDialog;
      gdd.caption = "Select Include Search Directory";
      if ( gdd.execute() )
      {
         let txt = this.dialog.extraIncludeDirs_TextBox.text.trim();
         if ( txt.length > 0 )
            txt += '\n';
         this.dialog.extraIncludeDirs_TextBox.text = txt + gdd.directory + '\n';
      }
   };

   this.extraIncludeDirs_Sizer = new HorizontalSizer;
   this.extraIncludeDirs_Sizer.spacing = 4;
   this.extraIncludeDirs_Sizer.add( this.extraIncludeDirs_Label );
   this.extraIncludeDirs_Sizer.add( this.extraIncludeDirs_TextBox, 100 );
   this.extraIncludeDirs_Sizer.add( this.addIncludeDir_Button );

   //

#define TOOLTIP_EXTRALIBDIRS \
"<p>Additional library search directories.</p>" + \
"<p>This is a list of directories to find static and dynamic libraries. Note that " + \
"standard PCL library directories are always included in all makefiles and project " + \
"files, as necessary, so you don't have to specify them here.</p>" + \
"<p>You can use the Add button to select directories on the filesystem. Each directory " + \
"must be defined in a single text line.</p>"

   this.extraLibraryDirs_Label = new Label( this );
   this.extraLibraryDirs_Label.text = "Library directories:";
   this.extraLibraryDirs_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.extraLibraryDirs_Label.minWidth = labelWidth1 - 1;
   this.extraLibraryDirs_Label.scaledMinHeight = 60;
   this.extraLibraryDirs_Label.toolTip = TOOLTIP_EXTRALIBDIRS;

   this.extraLibraryDirs_TextBox = new TextBox( this );
   this.extraLibraryDirs_TextBox.toolTip = TOOLTIP_EXTRALIBDIRS;
   this.extraLibraryDirs_TextBox.setScaledFixedHeight( 60 );

   this.addLibraryDir_Button = new ToolButton( this );
   this.addLibraryDir_Button.icon = this.scaledResource( ":/icons/add.png" );
   this.addLibraryDir_Button.setScaledFixedSize( 32, 32 );
   this.addLibraryDir_Button.toolTip = "<p>Add a library search directory.</p>";

   this.addLibraryDir_Button.onClick = function()
   {
      let gdd = new GetDirectoryDialog;
      gdd.caption = "Select Library Search Directory";
      if ( gdd.execute() )
      {
         let txt = this.dialog.extraLibraryDirs_TextBox.text.trim();
         if ( txt.length > 0 )
            txt += '\n';
         this.dialog.extraLibraryDirs_TextBox.text = txt + gdd.directory + '\n';
      }
   };

   this.extraLibraryDirs_Sizer = new HorizontalSizer;
   this.extraLibraryDirs_Sizer.spacing = 4;
   this.extraLibraryDirs_Sizer.add( this.extraLibraryDirs_Label );
   this.extraLibraryDirs_Sizer.add( this.extraLibraryDirs_TextBox, 100 );
   this.extraLibraryDirs_Sizer.add( this.addLibraryDir_Button );

   //

#define TOOLTIP_EXTRALIBS \
"<p>Additional libraries.</p>" + \
"<p>This is a list of libraries (static or dynamic) that will be linked to your shared " + \
"library or executable. Note that standard PCL libraries are always linked to modules, " + \
"so you don't need to specify them here. You can use the Add button to select libraries " + \
"on the filesystem.</p>" + \
"<p>Each library must be defined in a single text line.</p>"

   this.extraLibraries_Label = new Label( this );
   this.extraLibraries_Label.text = "Libraries:";
   this.extraLibraries_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.extraLibraries_Label.minWidth = labelWidth1 - 1;
   this.extraLibraries_Label.scaledMinHeight = 60;
   this.extraLibraries_Label.toolTip = TOOLTIP_EXTRALIBS;

   this.extraLibraries_TextBox = new TextBox( this );
   this.extraLibraries_TextBox.toolTip = TOOLTIP_EXTRALIBS;
   this.extraLibraries_TextBox.setScaledFixedHeight( 60 );

   this.addLibraries_Button = new ToolButton( this );
   this.addLibraries_Button.icon = this.scaledResource( ":/icons/add.png" );
   this.addLibraries_Button.setScaledFixedSize( 32, 32 );
   this.addLibraries_Button.toolTip = "<p>Add a set of libraries.</p>";

   this.addLibraries_Button.onClick = function()
   {
      let ofd = new OpenFileDialog;
      ofd.multipleSelections = true;
      ofd.caption = "Select Libraries";
      if ( ofd.execute() )
      {
         let txt = this.dialog.extraLibraries_TextBox.text.trim();
         if ( txt.length > 0 )
            txt += '\n';
         for ( let i = 0; i < ofd.fileNames.length; ++i )
            txt += ofd.fileNames[i] + '\n';
         this.dialog.extraLibraries_TextBox.text = txt;
      }
   };

   this.extraLibraries_Sizer = new HorizontalSizer;
   this.extraLibraries_Sizer.spacing = 4;
   this.extraLibraries_Sizer.add( this.extraLibraries_Label );
   this.extraLibraries_Sizer.add( this.extraLibraries_TextBox, 100 );
   this.extraLibraries_Sizer.add( this.addLibraries_Button );

   //

   this.newInstance_Button = new ToolButton( this );
   this.newInstance_Button.icon = this.scaledResource( ":/process-interface/new-instance.png" );
   this.newInstance_Button.setScaledFixedSize( 24, 24 );
   this.newInstance_Button.toolTip = "New Instance";
   this.newInstance_Button.onMousePress = function()
   {
      this.hasFocus = true;
      this.pushed = false;

      /*
       * Export parameters and generate a new instance
       */
      this.dialog.exportParameters();
      this.dialog.newInstance();
   };

   this.reset_Button = new PushButton( this );
   this.reset_Button.text = "Reset";
   this.reset_Button.icon = this.scaledResource( ":/icons/reload.png" );
   this.reset_Button.toolTip = "<p>Clear all additional definitions, search directories and libraries.</p>"
   this.reset_Button.onClick = function()
   {
      this.dialog.extraIncludeDirs_TextBox.clear();
      this.dialog.extraLibraryDirs_TextBox.clear();
      this.dialog.extraLibraries_TextBox.clear();
      this.dialog.updateControls();
   };

   this.ok_Button = new PushButton( this );
   this.ok_Button.text = "Run";
   this.ok_Button.icon = this.scaledResource( ":/icons/power.png" );
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
   this.buttons_Sizer.add( this.newInstance_Button );
   this.buttons_Sizer.addUnscaledSpacing( labelWidth1 + this.logicalPixelsToPhysical( 4-6 ) - this.newInstance_Button.width );
   this.buttons_Sizer.add( this.reset_Button );
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.ok_Button );
   this.buttons_Sizer.add( this.cancel_Button );

   //

   this.sizer = new VerticalSizer;
   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add( this.helpLabel );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.directory_Sizer );
   this.sizer.add( this.id_Sizer );
   this.sizer.add( this.type_Sizer );
   this.sizer.add( this.platform_Sizer );
   this.sizer.add( this.architecture_Sizer );
   this.sizer.add( this.hostMakefiles_Sizer );
   this.sizer.add( this.osxArchOptions_Sizer );
   this.sizer.add( this.osxSDKVersion_Sizer );
   this.sizer.add( this.signed_Sizer );
   this.sizer.add( this.signingIdentity_Sizer );
   this.sizer.add( this.gccDebug_Sizer );
   this.sizer.add( this.gccUnstripped_Sizer );
   this.sizer.add( this.gccSuffixLinux_Sizer );
   this.sizer.add( this.gccOptimization_Sizer );
   this.sizer.add( this.diagnostics_Sizer );
   this.sizer.add( this.extraDefinitions_Sizer );
   this.sizer.add( this.extraIncludeDirs_Sizer );
   this.sizer.add( this.extraLibraryDirs_Sizer );
   this.sizer.add( this.extraLibraries_Sizer );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = TITLE + " Script";
   this.adjustToContents();
   this.setFixedSize();

   //

   this.importParameters = function()
   {
      if ( Parameters.has( "directory" ) )
         this.directory_Edit.text                  = Parameters.get( "directory" );
      if ( Parameters.has( "id" ) )
         this.id_Edit.text                         = Parameters.get( "id" );
      if ( Parameters.has( "type" ) )
         this.type_ComboBox.currentItem            = Parameters.getInteger( "type" );
      if ( Parameters.has( "platform" ) )
         this.platform_ComboBox.currentItem        = Parameters.getInteger( "platform" );
      if ( Parameters.has( "allPlatforms" ) )
         this.allPlatforms_CheckBox.checked        = Parameters.getBoolean( "allPlatforms" );
      if ( Parameters.has( "architecture" ) )
         this.architecture_ComboBox.currentItem    = Parameters.getInteger( "architecture" );
      if ( Parameters.has( "allArchitectures" ) )
         this.allArchitectures_CheckBox.checked    = Parameters.getBoolean( "allArchitectures" );
      if ( Parameters.has( "osxArchOptions" ) )
         this.osxArchOptions_CheckBox.checked      = Parameters.getBoolean( "osxArchOptions" );
      if ( Parameters.has( "osxSDKVersion" ) )
         this.osxSDKVersion_ComboBox.currentItem   = Parameters.getInteger( "osxSDKVersion" );
      if ( Parameters.has( "signed" ) )
         this.signed_CheckBox.checked              = Parameters.getBoolean( "signed" );
      if ( Parameters.has( "signingIdentity" ) )
         this.signingIdentity_Edit.text            = Parameters.get( "signingIdentity" );
      if ( Parameters.has( "gccDebug" ) )
         this.gccDebug_CheckBox.checked            = Parameters.getBoolean( "gccDebug" );
      if ( Parameters.has( "gccUnstripped" ) )
         this.gccUnstripped_CheckBox.checked       = Parameters.getBoolean( "gccUnstripped" );
      if ( Parameters.has( "gccSuffixLinux" ) )
         this.gccSuffixLinux_Edit.text             = Parameters.get( "gccSuffixLinux" );
      if ( Parameters.has( "gccOptimization" ) )
         this.gccOptimization_ComboBox.currentItem = Parameters.getInteger( "gccOptimization" );
      if ( Parameters.has( "diagnostics" ) )
         this.diagnostics_ComboBox.currentItem     = Parameters.getInteger( "diagnostics" );
      if ( Parameters.has( "extraDefinitions" ) )
         this.extraDefinitions_TextBox.text        = Parameters.get( "extraDefinitions" );
      if ( Parameters.has( "extraIncludeDirs" ) )
         this.extraIncludeDirs_TextBox.text        = Parameters.get( "extraIncludeDirs" );
      if ( Parameters.has( "extraLibraryDirs" ) )
         this.extraLibraryDirs_TextBox.text        = Parameters.get( "extraLibraryDirs" );
      if ( Parameters.has( "extraLibraries" ) )
         this.extraLibraries_TextBox.text          = Parameters.get( "extraLibraries" );

      this.updateControls();
   };

   this.exportParameters = function()
   {
      Parameters.set( "directory",        this.directory_Edit.text );
      Parameters.set( "id",               this.id_Edit.text );
      Parameters.set( "type",             this.type_ComboBox.currentItem );
      Parameters.set( "platform",         this.platform_ComboBox.currentItem );
      Parameters.set( "allPlatforms",     this.allPlatforms_CheckBox.checked  );
      Parameters.set( "architecture",     this.architecture_ComboBox.currentItem );
      Parameters.set( "allArchitectures", this.allArchitectures_CheckBox.checked );
      Parameters.set( "osxArchOptions",   this.osxArchOptions_CheckBox.checked );
      Parameters.set( "osxSDKVersion",    this.osxSDKVersion_ComboBox.currentItem );
      Parameters.set( "signed",           this.signed_CheckBox.checked );
      Parameters.set( "signingIdentity",  this.signingIdentity_Edit.text );
      Parameters.set( "gccDebug",         this.gccDebug_CheckBox.checked );
      Parameters.set( "gccUnstripped",    this.gccUnstripped_CheckBox.checked );
      Parameters.set( "gccSuffixLinux",   this.gccSuffixLinux_Edit.text );
      Parameters.set( "gccOptimization",  this.gccOptimization_ComboBox.currentItem );
      Parameters.set( "diagnostics",      this.diagnostics_ComboBox.currentItem );
      Parameters.set( "extraDefinitions", this.extraDefinitions_TextBox.text );
      Parameters.set( "extraIncludeDirs", this.extraIncludeDirs_TextBox.text );
      Parameters.set( "extraLibraryDirs", this.extraLibraryDirs_TextBox.text );
      Parameters.set( "extraLibraries",   this.extraLibraries_TextBox.text );
   };

   this.updateControls = function()
   {
      if ( this.type_ComboBox.currentItem == TYPE_STANDARD_MODULES ||
           this.type_ComboBox.currentItem == TYPE_PLATFORM ||
           this.type_ComboBox.currentItem == TYPE_PCL ||
           this.type_ComboBox.currentItem == TYPE_CORE ||
           this.type_ComboBox.currentItem == TYPE_CORE_AUX )
      {
         this.directory_Label.enabled =
         this.directory_Edit.enabled =
         this.selectDirectory_Button.enabled =
         this.id_Label.enabled =
         this.id_Edit.enabled =
         this.platform_Label.enabled =
         this.platform_ComboBox.enabled =
         this.allPlatforms_CheckBox.enabled =
         this.architecture_Label.enabled =
         this.architecture_ComboBox.enabled =
         this.allArchitectures_CheckBox.enabled =
         this.osxArchOptions_CheckBox.enabled =
         this.gccDebug_CheckBox.enabled =
         this.gccUnstripped_CheckBox.enabled =
         this.gccSuffixLinux_Label.enabled =
         this.gccSuffixLinux_Edit.enabled =
         this.gccOptimization_Label.enabled =
         this.gccOptimization_ComboBox.enabled =
         this.diagnostics_Label.enabled =
         this.diagnostics_ComboBox.enabled =
         this.extraDefinitions_Label.enabled =
         this.extraDefinitions_TextBox.enabled =
         this.extraIncludeDirs_Label.enabled =
         this.extraIncludeDirs_TextBox.enabled =
         this.addIncludeDir_Button.enabled =
         this.extraLibraryDirs_Label.enabled =
         this.extraLibraryDirs_TextBox.enabled =
         this.addLibraryDir_Button.enabled =
         this.extraLibraries_Label.enabled =
         this.extraLibraries_TextBox.enabled =
         this.addLibraries_Button.enabled = false;
      }
      else
      {
         let windows = this.platform_ComboBox.currentItem == PLATFORM_WINDOWS;

         this.directory_Label.enabled = true;
         this.directory_Edit.enabled = true;
         this.selectDirectory_Button.enabled = true;
         this.id_Label.enabled = true;
         this.id_Edit.enabled = true;

         this.platform_Label.enabled =
         this.platform_ComboBox.enabled = !this.allPlatforms_CheckBox.checked;

         this.allPlatforms_CheckBox.enabled = true;

         this.architecture_Label.enabled =
         this.architecture_ComboBox.enabled = !this.allArchitectures_CheckBox.checked && !windows;

         this.allArchitectures_CheckBox.enabled = true;

         this.osxArchOptions_CheckBox.enabled =
         this.osxSDKVersion_ComboBox.enabled =
         this.gccDebug_CheckBox.enabled =
         this.gccUnstripped_CheckBox.enabled =
         this.gccSuffixLinux_Label.enabled =
         this.gccSuffixLinux_Edit.enabled =
         this.gccOptimization_Label.enabled =
         this.gccOptimization_ComboBox.enabled = !windows || this.allPlatforms_CheckBox.checked;

         this.diagnostics_Label.enabled =
         this.diagnostics_ComboBox.enabled = windows || this.allPlatforms_CheckBox.checked || this.gccDebug_CheckBox.checked;

         this.extraDefinitions_Label.enabled = true;
         this.extraDefinitions_TextBox.enabled = true;
         this.extraIncludeDirs_Label.enabled = true;
         this.extraIncludeDirs_TextBox.enabled = true;
         this.addIncludeDir_Button.enabled = true;
         this.extraLibraryDirs_Label.enabled = true;
         this.extraLibraryDirs_TextBox.enabled = true;
         this.addLibraryDir_Button.enabled = true;
         this.extraLibraries_Label.enabled = true;
         this.extraLibraries_TextBox.enabled = true;
         this.addLibraries_Button.enabled = true;
      }

      this.signingIdentity_Edit.enabled = this.signed_CheckBox.checked;
   };

   this.updateControls();
}

MakefileGeneratorDialog.prototype = new Dialog;

// ----------------------------------------------------------------------------
// EOF MakGenGUI.js - Released 2019-01-20T14:05:16Z
