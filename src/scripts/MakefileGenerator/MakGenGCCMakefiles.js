// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// MakGenGCCMakefiles.js - Released 2017-04-14T16:45:58Z
// ----------------------------------------------------------------------------
//
// This file is part of PixInsight Makefile Generator Script version 1.104
//
// Copyright (c) 2009-2017 Pleiades Astrophoto S.L.
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
 * Copyright (c) 2009-2017, Pleiades Astrophoto S.L. All Rights Reserved.
 * Written by Juan Conejero (PTeam)
 *
 * Generation of makefiles for GCC and Clang compilers.
 */

/*
 * GNU/GCC and Clang makefiles for 32-bit and 64-bit targets
 */
function GnuCxxAll( F, P )
{
   P.validate();
   P.validateGnuCxxBuild();

   let buildDirectory = P.gccBuildDirectory( F.baseDirectory );

   let makefilePath = buildDirectory + "/Makefile";

   console.writeln( "<end><cbr><br>==> Generating makefile:" );
   console.writeln( makefilePath );
   console.flush();

   let tmp = P.architecture;
   P.architecture = "x86";
   let makefile32 = P.gccMakefile();
   P.architecture = "x64";
   let makefile64 = P.gccMakefile();
   P.architecture = tmp;

   let hasMakefile32 = File.exists( buildDirectory + '/' + makefile32 );
   let hasMakefile64 = File.exists( buildDirectory + '/' + makefile64 );

   if ( !(hasMakefile32 || hasMakefile64) )
      throw new Error( "Internal: No makefile has been generated before calling GnuCxxAll()" );

   let f = new File;
   f.createForWriting( makefilePath );

   f.outTextLn( "######################################################################" );
   f.outTextLn( "# PixInsight Makefile Generator Script v" + VERSION );
   f.outTextLn( "# Copyright (C) 2009-2017 Pleiades Astrophoto" );
   f.outTextLn( "######################################################################" );
   f.outTextLn( "# Generated on .... " + (new Date( Date.now() )).toISOString() );
   f.outTextLn( "# Project id ...... " + P.id );
   f.outTextLn( "# Project type .... " + P.type );
   f.outTextLn( "# Platform ........ " + P.platform + "/g++" );
   f.outTextLn( "# Configuration ... " + (P.gccDebug ? "Debug" : "Release") + "/all" );
   f.outTextLn( "######################################################################" );
   f.outTextLn( '' );

   f.outTextLn( "#" );
   f.outTextLn( "# Targets" );
   f.outTextLn( "#" );
   f.outTextLn( '' );
   f.outTextLn( ".PHONY: all" );
   f.outTextLn( "all: " );
   if ( hasMakefile32 )
      f.outTextLn( "\t$(MAKE) -f ./" + makefile32 + " --no-print-directory" );
   if ( hasMakefile64 )
      f.outTextLn( "\t$(MAKE) -f ./" + makefile64 + " --no-print-directory" );
   f.outTextLn( '' );
   f.outTextLn( ".PHONY: clean" );
   f.outTextLn( "clean:" );
   if ( hasMakefile32 )
      f.outTextLn( "\t$(MAKE) -f ./" + makefile32 + " --no-print-directory clean" );
   if ( hasMakefile64 )
      f.outTextLn( "\t$(MAKE) -f ./" + makefile64 + " --no-print-directory clean" );
   f.outTextLn( '' );

   f.flush();
   f.close();
}

/*
 * GNU/G++ makefile
 */
function GnuCxx( F, P )
{
   P.validate();
   P.validateGnuCxxBuild();

   let buildDirectory = P.gccBuildDirectory( F.baseDirectory );
   if ( P.cleanUpPreviousBuilds )
      if ( File.directoryExists( buildDirectory ) )
         removeDirectory( buildDirectory );

   let makefilePath = buildDirectory + '/' + P.gccMakefile();

   console.writeln( "<end><cbr><br>==> Generating makefile:" );
   console.writeln( makefilePath );
   console.flush();

   let objectPrefix = P.architecture + (P.gccDebug ? "/Debug" : "/Release");
   let objectDirectory = buildDirectory + '/' + objectPrefix;

   let target = "$(OBJ_DIR)/" + P.mainTarget();

   let sources = new Array;
   let objects = new Array;
   let dependencies = new Array;
   for ( let i = 0; i < F.sources.length; ++i )
   {
      let s = F.sources[i];
      if ( s.hasSourceFiles() )
      {
         let prefix = s.directory;
         let objDir = objectDirectory;
         if ( s.directory.length > 0 )
         {
            prefix += '/';
            objDir += '/' + s.directory;
         }
         createDirectoryIfNotExists( objDir, true );

         for ( let j = 0; j < s.files.length; ++j )
            if ( P.isSourceFile( s.files[j] ) )
            {
               sources.push( "../../" + prefix + s.files[j] );
               let n = "./" + objectPrefix + '/' + prefix + File.extractName( s.files[j] );
               objects.push( n + ".o" );
               dependencies.push( n + ".d" );
            }
      }
   }

   let f = new File;
   f.createForWriting( makefilePath );

   f.outTextLn( "######################################################################" );
   f.outTextLn( "# PixInsight Makefile Generator Script v" + VERSION );
   f.outTextLn( "# Copyright (C) 2009-2017 Pleiades Astrophoto" );
   f.outTextLn( "######################################################################" );
   f.outTextLn( "# Generated on .... " + (new Date( Date.now() )).toISOString() );
   f.outTextLn( "# Project id ...... " + P.id );
   f.outTextLn( "# Project type .... " + P.type );
   f.outTextLn( "# Platform ........ " + P.platform + "/g++" );
   f.outTextLn( "# Configuration ... " + (P.gccDebug ? "Debug" : "Release") + '/' + P.architecture );
   if ( P.extraDefinitions.length > 0 )
   {
      f.outTextLn( "# --------------------------------------------------------------------" );
      f.outTextLn( "# Additional preprocessor definitions:" );
      for ( let i = 0; i < P.extraDefinitions.length; ++i )
         f.outTextLn( "# " + P.extraDefinitions[i] );
   }
   if ( P.extraIncludeDirs.length > 0 )
   {
      f.outTextLn( "# --------------------------------------------------------------------" );
      f.outTextLn( "# Additional include search directories:" );
      for ( let i = 0; i < P.extraIncludeDirs.length; ++i )
         f.outTextLn( "# " + P.extraIncludeDirs[i] );
   }
   if ( P.extraLibDirs.length > 0 )
   {
      f.outTextLn( "# --------------------------------------------------------------------" );
      f.outTextLn( "# Additional library search directories:" );
      for ( let i = 0; i < P.extraLibDirs.length; ++i )
         f.outTextLn( "# " + P.extraLibDirs[i] + (P.is64BitProject() ? "/x64" : "/x86") );
   }
   if ( P.extraLibraries.length > 0 )
   {
      f.outTextLn( "# --------------------------------------------------------------------" );
      f.outTextLn( "# Additional libraries:" );
      for ( let i = 0; i < P.extraLibraries.length; ++i )
         f.outTextLn( "# " + P.extraLibraries[i] );
   }
   f.outTextLn( "######################################################################" );
   f.outTextLn( '' );

   /*
    * Perform a greedy replacement of relevant environment variables in the
    * OBJ_DIR value. Without this, we would be propagating our own build
    * directories everywhere!
    */
   f.outTextLn( "OBJ_DIR=\"" + objectDirectory.replace(
                                 RegExp( '^' + PCLSRCDIR ), "$(PCLSRCDIR)" ).replace(
                                    RegExp( '^' + PCLDIR ), "$(PCLDIR)" ) + "\"" );
   f.outTextLn( '' );

   f.outTextLn( ".PHONY: all" );
   f.outTextLn( "all: " + target );
   f.outTextLn( '' );

   f.outTextLn( "#" );
   f.outTextLn( "# Source files" );
   f.outTextLn( "#" );
   f.outTextLn( '' );
   f.outTextLn( "SRC_FILES= \\" );
   for ( let i = 0; ; )
   {
      f.outText( sources[i] );
      if ( ++i == sources.length )
         break;
      f.outTextLn( " \\" );
   }
   f.outTextLn( '' );
   f.outTextLn( '' );

   f.outTextLn( "#" );
   f.outTextLn( "# Object files" );
   f.outTextLn( "#" );
   f.outTextLn( '' );
   f.outTextLn( "OBJ_FILES= \\" );
   for ( let i = 0; ; )
   {
      f.outText( objects[i] );
      if ( ++i == objects.length )
         break;
      f.outTextLn( " \\" );
   }
   f.outTextLn( '' );
   f.outTextLn( '' );

   f.outTextLn( "#" );
   f.outTextLn( "# Dependency files" );
   f.outTextLn( "#" );
   f.outTextLn( '' );
   f.outTextLn( "DEP_FILES= \\" );
   for ( let i = 0; ; )
   {
      f.outText( dependencies[i] );
      if ( ++i == dependencies.length )
         break;
      f.outTextLn( " \\" );
   }
   f.outTextLn( '' );
   f.outTextLn( '' );

   f.outTextLn( "#" );
   f.outTextLn( "# Rules" );
   f.outTextLn( "#" );
   f.outTextLn( '' );
   f.outTextLn( "-include $(DEP_FILES)" );
   f.outTextLn( '' );
   f.outTextLn( target + ": $(OBJ_FILES)" );
   f.outTextLn( "\t" + P.gccBuildCommand() );
   f.outTextLn( "\t$(MAKE) -f ./" + P.gccMakefile() + " --no-print-directory post-build" );
   f.outTextLn( '' );
   f.outTextLn( ".PHONY: clean" );
   f.outTextLn( "clean:" );
   f.outTextLn( "\trm -f $(OBJ_FILES) $(DEP_FILES) " + target );
   f.outTextLn( '' );
   f.outTextLn( ".PHONY: post-build" );
   f.outTextLn( "post-build:" );
	f.outTextLn( "\tcp " + target + ' ' + P.destinationDirectory() );
   if ( P.isMacOSXPlatform() )
   {
      let appDir = "$(PCLDIR)/dist/" + P.architecture;
      let appBundle = appDir + "/PixInsight/" + P.macOSXAppName();

      if ( P.isCore() )
      {
         /*
          * Since OS X 10.9.5, all shared objects must be on the Frameworks
          * application bundle directory.
          */
         f.outTextLn( "\tinstall_name_tool" +
                      " -change @executable_path/liblcms-pxi.dylib" +
                      " @executable_path/../Frameworks/liblcms-pxi.dylib " +
                      appBundle + "/Contents/MacOS/PixInsight" );
         f.outTextLn( "\tinstall_name_tool" +
                      " -change @executable_path/libzlib-pxi.dylib" +
                      " @executable_path/../Frameworks/libzlib-pxi.dylib " +
                      appBundle + "/Contents/MacOS/PixInsight" );
         f.outTextLn( "\tinstall_name_tool" +
                      " -change @executable_path/libmozjs-24.dylib" +
                      " @executable_path/../Frameworks/libmozjs-24.dylib " +
                      appBundle + "/Contents/MacOS/PixInsight" );

         /*
          * Regenerate Qt frameworks and resources.
          */
         f.outTextLn( "\trm -rf " + appBundle + "/Contents/Frameworks/Qt*" );
         f.outTextLn( "\trm -rf " + appBundle + "/Contents/PlugIns" );
         f.outTextLn( "\trm -f " + appBundle + "/Contents/Resources/qt.conf" );
         f.outTextLn( "\texport DYLD_FRAMEWORK_PATH=$(QTDIR)/qtbase/lib" );
         f.outTextLn( "\tmacdeployqt " + appBundle );

         /*
          * Update creation time for the core application bundle.
          * ### N.B.: This must be done *before* signing, as file times are
          * part of the code signature.
          */
         f.outTextLn( "\ttouch " + appBundle );

         /*
          * Since OS X 10.9.5, the --resource-rules argument to codesign is no
          * longer supported. From now on every file inside an application
          * bundle has to be signed without exceptions---even plain text files
          * have to be part of signed code. Fortunately, the --deep argument
          * works fine to simplify things by doing this recursively.
          */
         f.outTextLn( "\tcodesign --deep -s pleiades -f -v --timestamp " + appBundle );
      }
      else if ( P.isCoreAux() )
      {
         f.outTextLn( "\tinstall_name_tool -change QtCore.framework/Versions/5/QtCore" +
                      " @executable_path/../Frameworks/QtCore.framework/Versions/5/QtCore" +
                      " " + appBundle + "/Contents/MacOS/" + P.mainTarget() );
         f.outTextLn( "\tinstall_name_tool -change QtWidgets.framework/Versions/5/QtWidgets" +
                      " @executable_path/../Frameworks/QtWidgets.framework/Versions/5/QtWidgets" +
                      " " + appBundle + "/Contents/MacOS/" + P.mainTarget() );
         f.outTextLn( "\tinstall_name_tool -change QtGui.framework/Versions/5/QtGui" +
                      " @executable_path/../Frameworks/QtGui.framework/Versions/5/QtGui" +
                      " " + appBundle + "/Contents/MacOS/" + P.mainTarget() );
      }
      else if ( P.isModule() || P.isDynamicLibrary() || P.isExecutable() )
      {
         for ( let i = 0; i < P.extraLibraries.length; ++i )
            if ( P.extraLibraries[i].startsWith( "Qt" ) )
            {
               // A Foo Qt framework is named QtFoo *instead* of Qt5Foo.
               let qtFramework = P.extraLibraries[i].replace( "Qt5", "Qt" );
               f.outTextLn( "\tinstall_name_tool -change " + qtFramework + ".framework/Versions/5/" + qtFramework +
                            " " + "@executable_path/../Frameworks/" + qtFramework + ".framework/Versions/5/" + qtFramework +
                            " " + P.destinationDirectory() + "/" + P.mainTarget() );
            }
            else
            {
               f.outTextLn( "\tinstall_name_tool -change @executable_path/lib" + P.extraLibraries[i] + ".dylib" +
                            " " + "@loader_path/lib" + P.extraLibraries[i] + ".dylib" +
                            " " + P.destinationDirectory() + "/" + P.mainTarget() );
            }
         /*
          * In official distributions, all modules and executables are
          * digitally signed on OS X and Windows platforms.
          * ### N.B.: Updater executables are already signed within the core
          * application bundle on OS X.
          */
         if ( P.isOfficialModule() || P.isOfficialDynamicLibrary() )
            if ( P.isMacOSXPlatform() )
               f.outTextLn( "\tcodesign --deep -s pleiades -f -v --timestamp " + P.destinationDirectory() + "/" + P.mainTarget() );
      }
   }
   f.outTextLn( '' );
   if ( F.cppFileCount > 0 )
      for ( let i = 0; i < F.sources.length; ++i )
      {
         let s = F.sources[i];
         if ( s.cppFileCount > 0 )
         {
            let prefix = s.directory;
            if ( s.directory.length > 0 )
               prefix += '/';
            f.outTextLn( "./" + objectPrefix + '/' + prefix + "%.o: " + "../../" + prefix + "%.cpp" );
            f.outTextLn( "\t" + P.gccCxxCompiler() + ' ' + P.gccCompileArgs() );
            f.outTextLn( "\t@echo \' \'" );
         }
      }
   if ( F.cxxFileCount > 0 )
      for ( let i = 0; i < F.sources.length; ++i )
      {
         let s = F.sources[i];
         if ( s.cxxFileCount > 0 )
         {
            let prefix = s.directory;
            if ( s.directory.length > 0 )
               prefix += '/';
            f.outTextLn( "./" + objectPrefix + '/' + prefix + "%.o: " + "../../" + prefix + "%.cxx" );
            f.outTextLn( "\t" + P.gccCxxCompiler() + ' ' + P.gccCompileArgs() );
            f.outTextLn( "\t@echo \' \'" );
         }
      }
   if ( F.cFileCount > 0 )
      for ( let i = 0; i < F.sources.length; ++i )
      {
         let s = F.sources[i];
         if ( s.cFileCount > 0 )
         {
            let prefix = s.directory;
            if ( s.directory.length > 0 )
               prefix += '/';
            f.outTextLn( "./" + objectPrefix + '/' + prefix + "%.o: " + "../../" + prefix + "%.c" );
            f.outTextLn( "\t" + P.gccCCompiler() + ' ' + P.gccCompileArgs( false/*isCpp*/ ) );
            f.outTextLn( "\t@echo \' \'" );
         }
      }
   if ( F.mmFileCount > 0 )
      for ( let i = 0; i < F.sources.length; ++i )
      {
         let s = F.sources[i];
         if ( s.mmFileCount > 0 )
         {
            let prefix = s.directory;
            if ( s.directory.length > 0 )
               prefix += '/';
            f.outTextLn( "./" + objectPrefix + '/' + prefix + "%.o: " + "../../" + prefix + "%.mm" );
            f.outTextLn( "\t" + P.gccCxxCompiler() + ' ' + P.gccCompileArgs() );
            f.outTextLn( "\t@echo \' \'" );
         }
      }
   f.outTextLn( '' );

   f.flush();
   f.close();
}

// ----------------------------------------------------------------------------
// EOF MakGenGCCMakefiles.js - Released 2017-04-14T16:45:58Z
