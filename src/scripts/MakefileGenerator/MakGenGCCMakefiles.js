// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// MakGenGCCMakefiles.js - Released 2014/10/15 17:07:00 UTC
// ****************************************************************************
//
// This file is part of PixInsight Makefile Generator Script version 1.93
//
// Copyright (c) 2009-2014 Pleiades Astrophoto S.L.
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
// ****************************************************************************

/*
 * PixInsight Makefile Generator
 *
 * Automatic generation of PCL makefiles and projects for FreeBSD, Linux,
 * Mac OS X and Windows platforms.
 *
 * Copyright (c) 2009-2014, Pleiades Astrophoto S.L. All Rights Reserved.
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

   var buildDirectory = P.gccBuildDirectory( F.baseDirectory );

   var makefilePath = buildDirectory + "/Makefile";

   console.writeln( "<end><cbr><br>==> Generating makefile:" );
   console.writeln( makefilePath );
   console.flush();

   var tmp = P.architecture;
   P.architecture = "x86";
   var makefile32 = P.gccMakefile();
   P.architecture = "x64";
   var makefile64 = P.gccMakefile();
   P.architecture = tmp;

   var hasMakefile32 = File.exists( buildDirectory + '/' + makefile32 );
   var hasMakefile64 = File.exists( buildDirectory + '/' + makefile64 );

   if ( !(hasMakefile32 || hasMakefile64) )
      throw new Error( "Internal: No makefile has been generated before calling GnuCxxAll()" );

   var f = new File;
   f.createForWriting( makefilePath );

   f.outTextLn( "######################################################################" );
   f.outTextLn( "# PixInsight Makefile Generator Script v" + VERSION );
   f.outTextLn( "# Copyright (C) 2009-2014 Pleiades Astrophoto" );
   f.outTextLn( "######################################################################" );
   f.outTextLn( "# Automatically generated on " + new Date( Date.now() ).toUTCString() );
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

   var buildDirectory = P.gccBuildDirectory( F.baseDirectory );
   if ( P.cleanUpPreviousBuilds )
      if ( File.directoryExists( buildDirectory ) )
         removeDirectory( buildDirectory );

   var makefilePath = buildDirectory + '/' + P.gccMakefile();

   console.writeln( "<end><cbr><br>==> Generating makefile:" );
   console.writeln( makefilePath );
   console.flush();

   var objectPrefix = P.architecture + (P.gccDebug ? "/Debug" : "/Release");
   var objectDirectory = buildDirectory + '/' + objectPrefix;

   var target = "$(OBJ_DIR)/" + P.mainTarget();

   var sources = new Array;
   var objects = new Array;
   var dependencies = new Array;
   for ( var i = 0; i < F.sources.length; ++i )
   {
      var s = F.sources[i];
      if ( s.hasSourceFiles() )
      {
         var prefix = s.directory;
         var objDir = objectDirectory;
         if ( s.directory.length > 0 )
         {
            prefix += '/';
            objDir += '/' + s.directory;
         }
         createDirectoryIfNotExists( objDir, true );

         for ( var j = 0; j < s.files.length; ++j )
            if ( P.isSourceFile( s.files[j] ) )
            {
               sources.push( "../../" + prefix + s.files[j] );
               var n = "./" + objectPrefix + '/' + prefix + File.extractName( s.files[j] );
               objects.push( n + ".o" );
               dependencies.push( n + ".d" );
            }
      }
   }

   var f = new File;
   f.createForWriting( makefilePath );

   f.outTextLn( "######################################################################" );
   f.outTextLn( "# PixInsight Makefile Generator Script v" + VERSION );
   f.outTextLn( "# Copyright (C) 2009-2014 Pleiades Astrophoto" );
   f.outTextLn( "######################################################################" );
   f.outTextLn( "# Automatically generated on " + new Date( Date.now() ).toUTCString() );
   f.outTextLn( "# Project id ...... " + P.id );
   f.outTextLn( "# Project type .... " + P.type );
   f.outTextLn( "# Platform ........ " + P.platform + "/g++" );
   f.outTextLn( "# Configuration ... " + (P.gccDebug ? "Debug" : "Release") + '/' + P.architecture );
   if ( P.extraDefinitions.length > 0 )
   {
      f.outTextLn( "# --------------------------------------------------------------------" );
      f.outTextLn( "# Additional preprocessor definitions:" );
      for ( var i = 0; i < P.extraDefinitions.length; ++i )
         f.outTextLn( "# " + P.extraDefinitions[i] );
   }
   if ( P.extraIncludeDirs.length > 0 )
   {
      f.outTextLn( "# --------------------------------------------------------------------" );
      f.outTextLn( "# Additional include search directories:" );
      for ( var i = 0; i < P.extraIncludeDirs.length; ++i )
         f.outTextLn( "# " + P.extraIncludeDirs[i] );
   }
   if ( P.extraLibDirs.length > 0 )
   {
      f.outTextLn( "# --------------------------------------------------------------------" );
      f.outTextLn( "# Additional library search directories:" );
      for ( var i = 0; i < P.extraLibDirs.length; ++i )
         f.outTextLn( "# " + P.extraLibDirs[i] + (P.is64BitProject() ? "/x64" : "/x86") );
   }
   if ( P.extraLibraries.length > 0 )
   {
      f.outTextLn( "# --------------------------------------------------------------------" );
      f.outTextLn( "# Additional libraries:" );
      for ( var i = 0; i < P.extraLibraries.length; ++i )
         f.outTextLn( "# " + P.extraLibraries[i] );
   }
   f.outTextLn( "######################################################################" );
   f.outTextLn( '' );

   /*
    * Perform a greedy replacement of relevant environment variables in the OBJ_DIR value.
    * Without this, we'd be propagating our own build directories everywhere!
    */
   f.outTextLn( "OBJ_DIR=\"" + objectDirectory.replace(
                                 RegExp( '^' + escapeForRegExp(PCLSRCDIR) ), "$(PCLSRCDIR)" ).replace(
                                    RegExp( '^' + escapeForRegExp(PCLDIR) ), "$(PCLDIR)" ) + "\"" );
   f.outTextLn( '' );

   f.outTextLn( ".PHONY: all" );
   f.outTextLn( "all: " + target );
   f.outTextLn( '' );

   f.outTextLn( "#" );
   f.outTextLn( "# Source files" );
   f.outTextLn( "#" );
   f.outTextLn( '' );
   f.outTextLn( "SRC_FILES= \\" );
   for ( var i = 0; ; )
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
   for ( var i = 0; ; )
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
   for ( var i = 0; ; )
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
      var appDir = "$(PCLDIR)/dist/" + P.architecture;
      var appBundle = appDir + "/PixInsight/" + P.macOSXAppName();

      if ( P.isCore() )
      {
         f.outTextLn( "\trm -rf " + appBundle + "/Contents/Frameworks" );
         f.outTextLn( "\trm -rf " + appBundle + "/Contents/PlugIns" );
         f.outTextLn( "\trm -f " + appBundle + "/Contents/Resources/qt.conf" );
         f.outTextLn( "\tmacdeployqt " + appBundle );

         /*
          * Fix macdeployqt bug on Mac OS X >= 10.9.5. See:
          *    http://stackoverflow.com/questions/19637131/sign-a-framework-for-osx-10-9
          */
      	f.outTextLn( "\tcp " + P.qtDirectory() + "/lib/QtCore.framework/Contents/Info.plist " + appBundle + "/Contents/Frameworks/QtCore.framework/Resources" );
	      f.outTextLn( "\tcp " + P.qtDirectory() + "/lib/QtGui.framework/Contents/Info.plist " + appBundle + "/Contents/Frameworks/QtGui.framework/Resources" );
	      f.outTextLn( "\tcp " + P.qtDirectory() + "/lib/QtNetwork.framework/Contents/Info.plist " + appBundle + "/Contents/Frameworks/QtNetwork.framework/Resources" );
      	f.outTextLn( "\tcp " + P.qtDirectory() + "/lib/QtSvg.framework/Contents/Info.plist " + appBundle + "/Contents/Frameworks/QtSvg.framework/Resources" );
      	f.outTextLn( "\tcp " + P.qtDirectory() + "/lib/QtWebKit.framework/Contents/Info.plist " + appBundle + "/Contents/Frameworks/QtWebKit.framework/Resources" );
      	f.outTextLn( "\tcp " + P.qtDirectory() + "/lib/QtXml.framework/Contents/Info.plist " + appBundle + "/Contents/Frameworks/QtXml.framework/Resources" );

         f.outTextLn( "\ttouch " + appBundle );

         if ( !P.isMacOSX106Platform() )
         {
            // Compatibility Mac OS X versions are not digitally signed.

            /*
             * _Unfortunately_, since Mac OS X 10.9.5, the --resource-rules
             * argument to codesign is no longer supported. From now on every
             * file inside an application bundle has to be signed without
             * exceptions - even plain text files have to be part of signed
             * code. The --deep argument does this recursively.
             */
            f.outTextLn( "\tcodesign --deep -s pleiades -f -v --timestamp " + appBundle );

            /*
             * Signing commands for Mac OS X < 10.9.5
             *
            f.outTextLn( "\tcodesign -s pleiades -f -v --timestamp " + appBundle + "/Contents/Frameworks/QtCore.framework/Versions/4/QtCore" );
            f.outTextLn( "\tcodesign -s pleiades -f -v --timestamp " + appBundle + "/Contents/Frameworks/QtGui.framework/Versions/4/QtGui" );
            f.outTextLn( "\tcodesign -s pleiades -f -v --timestamp " + appBundle + "/Contents/Frameworks/QtNetwork.framework/Versions/4/QtNetwork" );
            f.outTextLn( "\tcodesign -s pleiades -f -v --timestamp " + appBundle + "/Contents/Frameworks/QtSvg.framework/Versions/4/QtSvg" );
            f.outTextLn( "\tcodesign -s pleiades -f -v --timestamp " + appBundle + "/Contents/Frameworks/QtWebKit.framework/Versions/4/QtWebKit" );
            f.outTextLn( "\tcodesign -s pleiades -f -v --timestamp " + appBundle + "/Contents/Frameworks/QtXml.framework/Versions/4/QtXml" );

            f.outTextLn( "\tcodesign -s pleiades -f -v --timestamp " + appBundle + "/Contents/PlugIns/bearer/libqcorewlanbearer.dylib" );
            f.outTextLn( "\tcodesign -s pleiades -f -v --timestamp " + appBundle + "/Contents/PlugIns/bearer/libqgenericbearer.dylib" );

            f.outTextLn( "\tcodesign -s pleiades -f -v --timestamp " + appBundle + "/Contents/PlugIns/codecs/libqcncodecs.dylib" );
            f.outTextLn( "\tcodesign -s pleiades -f -v --timestamp " + appBundle + "/Contents/PlugIns/codecs/libqjpcodecs.dylib" );
            f.outTextLn( "\tcodesign -s pleiades -f -v --timestamp " + appBundle + "/Contents/PlugIns/codecs/libqkrcodecs.dylib" );
            f.outTextLn( "\tcodesign -s pleiades -f -v --timestamp " + appBundle + "/Contents/PlugIns/codecs/libqtwcodecs.dylib" );

            f.outTextLn( "\tcodesign -s pleiades -f -v --timestamp " + appBundle + "/Contents/PlugIns/iconengines/libqsvgicon.dylib" );

            f.outTextLn( "\tcodesign -s pleiades -f -v --timestamp " + appBundle + "/Contents/PlugIns/imageformats/libqgif.dylib" );
            f.outTextLn( "\tcodesign -s pleiades -f -v --timestamp " + appBundle + "/Contents/PlugIns/imageformats/libqico.dylib" );
            f.outTextLn( "\tcodesign -s pleiades -f -v --timestamp " + appBundle + "/Contents/PlugIns/imageformats/libqjpeg.dylib" );
            f.outTextLn( "\tcodesign -s pleiades -f -v --timestamp " + appBundle + "/Contents/PlugIns/imageformats/libqmng.dylib" );
            f.outTextLn( "\tcodesign -s pleiades -f -v --timestamp " + appBundle + "/Contents/PlugIns/imageformats/libqsvg.dylib" );
            f.outTextLn( "\tcodesign -s pleiades -f -v --timestamp " + appBundle + "/Contents/PlugIns/imageformats/libqtga.dylib" );
            f.outTextLn( "\tcodesign -s pleiades -f -v --timestamp " + appBundle + "/Contents/PlugIns/imageformats/libqtiff.dylib" );

            f.outTextLn( "\tcodesign -s pleiades -f -v --timestamp --resource-rules " + appDir + "/CoreSignRules.plist " + appBundle );
             */
         }
      }
      else if ( P.isCoreAux() )
      {
         f.outTextLn( "\tinstall_name_tool -change " + P.qtDirectory() + "/lib/QtCore.framework/Versions/4/QtCore" +
                      " @executable_path/../Frameworks/QtCore.framework/Versions/4/QtCore" +
                      " " + appBundle + "/Contents/MacOS/" + P.mainTarget() );
         f.outTextLn( "\tinstall_name_tool -change " + P.qtDirectory() + "/lib/QtGui.framework/Versions/4/QtGui" +
                      " @executable_path/../Frameworks/QtGui.framework/Versions/4/QtGui" +
                      " " + appBundle + "/Contents/MacOS/" + P.mainTarget() );
      }
      else if ( P.isModule() || P.isDynamicLibrary() || P.isExecutable() )
      {
         for ( var i = 0; i < P.extraLibraries.length; ++i )
            f.outTextLn( "\tinstall_name_tool -change @executable_path/lib" + P.extraLibraries[i] + ".dylib" +
                         " @loader_path/lib" + P.extraLibraries[i] + ".dylib" +
                         " " + P.destinationDirectory() + "/" + P.mainTarget() );
      }
   }
   f.outTextLn( '' );
   if ( F.cppFileCount > 0 )
      for ( var i = 0; i < F.sources.length; ++i )
      {
         var s = F.sources[i];
         if ( s.cppFileCount > 0 )
         {
            var prefix = s.directory;
            if ( s.directory.length > 0 )
               prefix += '/';
            f.outTextLn( "./" + objectPrefix + '/' + prefix + "%.o: " + "../../" + prefix + "%.cpp" );
            f.outTextLn( "\t" + P.gccCxxCompiler() + P.gccCompileArgs() );
            f.outTextLn( "\t@echo \' \'" );
         }
      }
   if ( F.cxxFileCount > 0 )
      for ( var i = 0; i < F.sources.length; ++i )
      {
         var s = F.sources[i];
         if ( s.cxxFileCount > 0 )
         {
            var prefix = s.directory;
            if ( s.directory.length > 0 )
               prefix += '/';
            f.outTextLn( "./" + objectPrefix + '/' + prefix + "%.o: " + "../../" + prefix + "%.cxx" );
            f.outTextLn( "\t" + P.gccCxxCompiler() + P.gccCompileArgs() );
            f.outTextLn( "\t@echo \' \'" );
         }
      }
   if ( F.cFileCount > 0 )
      for ( var i = 0; i < F.sources.length; ++i )
      {
         var s = F.sources[i];
         if ( s.cFileCount > 0 )
         {
            var prefix = s.directory;
            if ( s.directory.length > 0 )
               prefix += '/';
            f.outTextLn( "./" + objectPrefix + '/' + prefix + "%.o: " + "../../" + prefix + "%.c" );
            f.outTextLn( "\t" + P.gccCCompiler() + P.gccCompileArgs() );
            f.outTextLn( "\t@echo \' \'" );
         }
      }
   if ( F.mmFileCount > 0 )
      for ( var i = 0; i < F.sources.length; ++i )
      {
         var s = F.sources[i];
         if ( s.mmFileCount > 0 )
         {
            var prefix = s.directory;
            if ( s.directory.length > 0 )
               prefix += '/';
            f.outTextLn( "./" + objectPrefix + '/' + prefix + "%.o: " + "../../" + prefix + "%.mm" );
            f.outTextLn( "\t" + P.gccCxxCompiler() + P.gccCompileArgs() );
            f.outTextLn( "\t@echo \' \'" );
         }
      }
   f.outTextLn( '' );

   f.flush();
   f.close();
}

// ****************************************************************************
// EOF MakGenGCCMakefiles.js - Released 2014/10/15 17:07:00 UTC
