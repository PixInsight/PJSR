// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// MakGenParameters.js - Released 2017-08-01T15:54:50Z
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
 * Project generation parameters.
 */

function GeneratorParameters()
{
   /*
    * Identifier of this project
    */
   this.id = "";

   /*
    * Project type
    * One of: "Module" "StaticLibrary" "DynamicLibrary" "Executable" "X11Installer" "CoreAux" "Core"
    */
   this.type = "";

   /*
    * Project platform
    * One of: "FreeBSD" "Linux" "MacOSX" "Windows"
    */
   this.platform = "";

   /*
    * Project architecture
    * One of: "x86" "x64"
    * For GNU/GCC only; ignored for Windows projects.
    */
   this.architecture = "";

   /*
    * If true, we are generating makefiles for an official PixInsight
    * distribution.
    * In an official distribution, the PixInsight Core application and all
    * modules and auxiliary executables are digitally signed with our corporate
    * code signing certificates.
    */
   this.official = false;

   /*
    * Remove existing build directories before generating new makefiles.
    */
   this.cleanUpPreviousBuilds = true;

   /*
    * GCC debug builds. If true, generate debug makefiles.
    * For GNU/GCC only; ignored for Windows projects.
    */
   this.gccDebug = false;

   /*
    * GCC optimization level.
    * One of: "0", "1", "2", "3", "s"
    * For GNU/GCC only; ignored for Windows projects.
    */
   this.gccOptimization = OPTIMIZATION_DEFAULT_STR;

   /*
    * GCC link-time optimization (-flto). Disabled by default because it
    * produces very slow code in our tests.
    */
   this.gccLinkTimeOptimization = false;

   /*
    * Do not strip binaries. If true, the -rdynamic flag will be used to enable
    * backtraces with demangled function names. If false, the -s flag will be
    * used to strip all executable files.
    */
   this.gccUnstrippedBinaries = false;

   /*
    * GCC C++ compiler executable suffix for Linux builds.
    * Set this to an empty string to use the system default compiler.
    */
   this.gccSuffixLinux = DEFAULT_GCC_VERSION_SUFFIX_LINUX;

   /*
    * Include -arch xxx and -Xarch_xxx compiler and linker options for Mac OS X
    * makefiles.
    */
   this.osxArchOptions = true;

   /*
    * OS X sysroot SDK version.
    */
   this.osxSDKVersion = DEFAULT_OSX_SDK_VERSION;

   /*
    * PCL diagnostics level
    * 0=disabled, 1=preconditions, 2=preconditions+checks
    */
   this.diagnostics = 0;

   /*
    * Add -fvisibility=hidden option for GNU/GCC makefiles
    * Ignored for module projects
    */
   this.hidden = false;

   /*
    * Windows-specific: module definition file
    */
   this.winDefFile = "";

   /*
    * Windows-specific: UAC execution level = requireAdministrator
    * For internal use ONLY (required by the update system)
    */
   this.uacAdmin = false;

   /*
    * Additional preprocessor definitions
    */
   this.extraDefinitions = new Array;

   /*
    * Additional preprocessor definitions - Windows-specific
    */
   this.winExtraDefinitions = new Array;

   /*
    * Additional include search directories
    */
   this.extraIncludeDirs = new Array;

   /*
    * Additional library search directories
    */
   this.extraLibDirs = new Array;

   /*
    * Additional library dependencies
    */
   this.extraLibraries = new Array;

   //

   this.isModule = function()
   {
      return this.type == "Module";
   };

   this.isOfficialModule = function()
   {
      return this.official && this.isModule();
   };

   this.isDynamicLibrary = function()
   {
      return this.type == "DynamicLibrary";
   };

   this.isOfficialDynamicLibrary = function()
   {
      return this.official && this.isDynamicLibrary();
   };

   this.isStaticLibrary = function()
   {
      return this.type == "StaticLibrary";
   };

   this.isExecutable = function()
   {
      return this.type == "Executable" || this.isCoreExecutable();
   };

   this.isOfficialExecutable = function()
   {
      return this.official && this.isExecutable();
   };

   this.isCore = function()
   {
      return this.type == "Core";
   };

   this.isCoreAux = function()
   {
      return this.type == "CoreAux";
   };

   this.isCoreExecutable = function()
   {
      return this.type == "CoreExecutable";
   };

   this.isX11Installer = function()
   {
      return this.type == "X11Installer";
   };

   this.isHostPlatform = function()
   {
      return this.platform == "Host";
   };

   this.isLinuxPlatform = function()
   {
      return this.platform == "Linux" || this.isHostPlatform();
   };

   this.isFreeBSDPlatform = function()
   {
      return this.platform == "FreeBSD";
   };

   this.isMacOSXPlatform = function()
   {
      return this.platform == "MacOSX";
   };

   this.isWindowsPlatform = function()
   {
      return this.platform == "Windows";
   };

   this.is32BitProject = function()
   {
      return this.architecture == "x86";
   };

   this.is64BitProject = function()
   {
      return this.architecture == "x64";
   };

   this.validate = function()
   {
      /*
       * Ensure validity of project type, platform and architecture.
       */
      this.id = this.id.trim();
      if ( this.id.length == 0 )
         throw new Error( "Empty project identifier." );
      if ( !this.isModule() && !this.isStaticLibrary() && !this.isDynamicLibrary() && !this.isExecutable() && !this.isCore() && !this.isCoreAux() && !this.isX11Installer() )
         throw new Error( "Invalid project type: " + this.type );
      if ( !this.isLinuxPlatform() && !this.isFreeBSDPlatform() && !this.isMacOSXPlatform() && !this.isWindowsPlatform() )
         throw new Error( "Unknown platform: " + this.platform );
      if ( !this.is32BitProject() && !this.is64BitProject() )
         throw new Error( "Unknown architecture: " + this.architecture );
   };

   this.isSourceFile = function( fileName )
   {
      var ext = File.extractExtension( fileName );
      return ext == ".cpp" || ext == ".c" || ext == ".cxx" || this.isMacOSXPlatform() && ext == ".mm";
   };

   this.mainTarget = function()
   {
      if ( this.isModule() || this.isDynamicLibrary() )
      {
         var s = this.id;

         if ( this.isModule() )
            s += "-pxm";
         else
            s += "-pxi";

         if ( this.isLinuxPlatform() || this.isFreeBSDPlatform() )
            s += ".so";
         else if ( this.isMacOSXPlatform() )
            s += ".dylib";
         else if ( this.isWindowsPlatform() )
            s += ".dll";

         if ( this.isDynamicLibrary() )
            if ( this.isLinuxPlatform() || this.isFreeBSDPlatform() || this.isMacOSXPlatform() )
               s = "lib" + s;

         return s;
      }

      if ( this.isStaticLibrary() )
      {
         var s = this.id;

         if ( this.isLinuxPlatform() || this.isFreeBSDPlatform() || this.isMacOSXPlatform() )
            s = "lib" + s + "-pxi.a";
         else if ( this.isWindowsPlatform() )
            s += "-pxi.lib";

         return s;
      }

      if ( this.isExecutable() || this.isCoreAux() || this.isX11Installer() )
      {
         if ( this.isWindowsPlatform() )
            return this.id + ".exe";
         return this.id;
      }

      if ( this.isCore() )
      {
         if ( this.isWindowsPlatform() )
            return "PixInsight.exe";
         if ( this.isMacOSXPlatform() )
            return this.is32BitProject() ? "PixInsight32" : "PixInsight";
         return "PixInsight";
      }

      return null;
   };

   this.macOSXAppName = function()
   {
      return "PixInsight.app";
   };

   this.platformMacroId = function()
   {
      if ( this.isFreeBSDPlatform() )
         return "__PCL_FREEBSD";
      if ( this.isLinuxPlatform() )
         return "__PCL_LINUX";
      if ( this.isMacOSXPlatform() )
         return "__PCL_MACOSX";
      if ( this.isWindowsPlatform() )
         return "__PCL_WINDOWS";

      return null;
   };

   this.platformBuildDirectory = function( baseDirectory )
   {
      if ( this.isFreeBSDPlatform() )
         return baseDirectory + "/freebsd";
      if ( this.isLinuxPlatform() )
         return baseDirectory + (this.isHostPlatform() ? "/host" : "/linux");
      if ( this.isMacOSXPlatform() )
         return baseDirectory + "/macosx";
      if ( this.isWindowsPlatform() )
         return baseDirectory + "/windows";

      return null;
   };

   this.dependsOnQt = function()
   {
      if ( this.isCore() || this.isCoreAux() )
         return true;
      for ( let i = 0; i < this.extraLibraries.length; ++i )
         if ( this.extraLibraries[i].startsWith( "Qt" ) )
            return true;
      return false;
   };

   this.validateGnuCxxBuild = function()
   {
      if ( this.isWindowsPlatform() )
         throw new Error( "Unsupported environment: Windows with GCC or Clang compiler." );
      if ( !this.isLinuxPlatform() && !this.isFreeBSDPlatform() && !this.isMacOSXPlatform() )
         throw new Error( "Unsupported environment: Unknown platform with GCC or Clang compiler." );
   };

   this.validateMSVCxxBuild = function()
   {
      if ( !this.isWindowsPlatform() )
         throw new Error( "Unsupported environment: VC++ compiler on non-Windows platform." );
   };

   this.gccBuildDirectory = function( baseDirectory )
   {
      if ( this.isWindowsPlatform() )
         return null;
      return this.platformBuildDirectory( baseDirectory ) + "/g++";
   };

   this.gccQtMkspecsDirectory = function()
   {
      if ( this.isFreeBSDPlatform() )
         return "/usr/local/lib/qt5/mkspecs/freebsd-clang";
      let s = this.qtDirectory() + "/qtbase/mkspecs/";
      if ( this.isMacOSXPlatform() )
         s += "macx-g++";
      else // Linux
         s += this.is64BitProject() ? "linux-g++-64" : "linux-g++-32";
      return s;
   };

   this.gccMakefile = function()
   {
      var makefile = "makefile-" + this.architecture;
      if ( this.gccDebug )
         makefile += "-debug";
      return makefile;
   };

   this.vccBuildDirectory = function( baseDirectory, vcVersion )
   {
      return baseDirectory + "/windows/vc" + vcVersion.toString();
   };

   this.vccProject = function( vcVersion )
   {
      if ( vcVersion < 10 ) // VC++ 2008
         return this.id + ".vcproj";
      return this.id + ".vcxproj"; // VC++ 2010, 2012
   };

   this.gccCxxCompiler = function()
   {
      if ( this.isMacOSXPlatform() || this.isFreeBSDPlatform() )
         return "clang++";
      if ( this.isHostPlatform() )
         return "g++" + DEFAULT_GCC_VERSION_SUFFIX_HOST;
      return "g++" + this.gccSuffixLinux;
   };

   this.gccCCompiler = function()
   {
      if ( this.isMacOSXPlatform() || this.isFreeBSDPlatform() )
         return "clang";
      if ( this.isHostPlatform() )
         return "gcc" + DEFAULT_GCC_VERSION_SUFFIX_HOST;
      return "gcc" + this.gccSuffixLinux;
   };

   this.gccArchFlags = function()
   {
      if ( this.isMacOSXPlatform() && this.osxArchOptions )
         return this.is64BitProject() ? " -arch x86_64" : " -arch i386";
      return this.is64BitProject() ? " -m64" : " -m32";
   };

   this.gccPICFlags = function()
   {
      // PIC is always enabled for OS X. On Linux and FreeBSD, it is enabled only for 64-bit builds.
      return (this.isMacOSXPlatform() || (this.isLinuxPlatform() || this.isFreeBSDPlatform()) && this.is64BitProject()) ? " -fPIC" : "";
   };

   this.gccCompileArgs = function( isCpp )
   {
      if ( isCpp == undefined ) // assume C++ compilation by default
         isCpp = true;

      let s = "-c -pipe -pthread" + this.gccArchFlags() + this.gccPICFlags();

      if ( this.isMacOSXPlatform() )
      {
         s += " -isysroot /Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX" + this.osxSDKVersion + ".sdk";
         s += " -mmacosx-version-min=10.10";
      }

      s += " -D_REENTRANT -D" + this.platformMacroId();
      if ( this.isCore() )
      {
         s += " -D__PCL_BUILDING_PIXINSIGHT_APPLICATION -D__PCL_QT_INTERFACE" + // PCL
              " -DXP_UNIX" + // SpiderMonkey
              " -D_LARGEFILE64_SOURCE -D_LARGEFILE_SOURCE" +
              " -DQT_EDITION=QT_EDITION_OPENSOURCE" + // Qt/LGPL
              " -DQT_NO_EXCEPTIONS -DQT_NO_DEBUG -DQT_SHARED" +
              " -DQT_NO_MTDEV -DQT_NO_LIBUDEV -DQT_NO_MTDEV -DQT_NO_TSLIB -DQT_NO_LIBINPUT";
         if ( this.isMacOSXPlatform() )
            s += " -DQT_NO_EVDEV";
      }
      else
      {
         if ( this.isCoreAux() )
         {
            s += " -D__PCL_QT_INTERFACE" + // PCL
                 " -D_LARGEFILE64_SOURCE -D_LARGEFILE_SOURCE" +
                 " -DQT_EDITION=QT_EDITION_OPENSOURCE" + // Qt/LGPL
                 " -DQT_NO_EXCEPTIONS -DQT_NO_DEBUG -DQT_SHARED" +
                 " -DQT_NO_MTDEV -DQT_NO_LIBUDEV -DQT_NO_MTDEV -DQT_NO_TSLIB -DQT_NO_LIBINPUT";
            if ( this.isMacOSXPlatform() )
               s += " -DQT_NO_EVDEV";
         }

         for ( var i = 0; i < this.extraDefinitions.length; ++i )
            s += " -D\"" + this.extraDefinitions[i] + "\"";
      }

      if ( this.diagnostics != 0 )
         s += " -D__PCL_DIAGNOSTICS_LEVEL=" + this.diagnostics.toString();

      s += " -I\"$(PCLINCDIR)\" -I\"$(PCLSRCDIR)/3rdparty\"";

      if ( this.isCore() || this.isCoreAux() )
      {
         if ( this.isFreeBSDPlatform() )
            s += " -I/usr/local/include/qt5";
         else
         {
            s += " -I\"" + this.qtDirectory() + "/qtbase/include\"";
            s += " -I\"" + this.qtDirectory() + "/qtbase/include/QtCore\"";
            s += " -I\"" + this.qtDirectory() + "/qtsvg/include\"";
            if ( this.isCore() )
            {
               s += " -I\"" + this.qtDirectory() + "/qtwebchannel/include\"";
               s += " -I\"" + this.qtDirectory() + "/qtwebengine/include\"";
               s += " -I\"" + this.qtDirectory() + "/qtwebengine/include/QtWebEngineWidgets\"";
               s += " -I\"" + this.qtDirectory() + "/qtdeclarative/include\"";
               s += " -I\"" + this.qtDirectory() + "/qtlocation/include\"";
            }
            if ( this.isLinuxPlatform() || this.isFreeBSDPlatform() )
               s += " -I\"" + this.qtDirectory() + "/qtx11extras/include\"";
            if ( this.isMacOSXPlatform() )
               s += " -I\"" + this.qtDirectory() + "/qtmacextras/include\"";
         }
         s += " -I\"" + this.gccQtMkspecsDirectory() + "\"";

         if ( this.isCore() )
         {
            s += " -I\"$(PCLSRCDIR)/core/Components\" -I\"$(PCLSRCDIR)/core\"";

            // SpiderMonkey include directories are architecture- and platform-dependent
            s += " -I\"$(PCLINCDIR)/js/";
            if ( this.isFreeBSDPlatform() )
               s += "freebsd";
            if ( this.isLinuxPlatform() )
               s += "linux";
            if ( this.isMacOSXPlatform() )
               s += "macosx";
            s += "/" + this.architecture + "\"";
         }

         s += " -I\"$(PCLINCDIR)/pcl\"";

         if ( this.isFreeBSDPlatform() )
            s += " -I/usr/local/include -I/usr/X11R6/include";
      }

      if ( this.isModule() || this.isDynamicLibrary() || this.isExecutable() )
         if ( this.dependsOnQt() )
         {
            if ( this.isFreeBSDPlatform() )
               s += " -I/usr/local/include -I/usr/local/include/qt5";
            else
               s += " -I\"" + this.qtDirectory() + "/qtbase/include\"";
            s += " -I\"" + this.gccQtMkspecsDirectory() + "\"";
         }

      if ( !this.isCore() )
         for ( let i = 0; i < this.extraIncludeDirs.length; ++i )
            s += " -I\"" + this.extraIncludeDirs[i] + "\"";

      if ( this.gccDebug )
         s += " -O0 -g";
      else
      {
         // -Ofast not supported by GCC 4.2.x and Clang on OS X
         let optimization = this.gccOptimization;
         if ( this.isMacOSXPlatform() )
            if ( optimization == "fast" )
               optimization = "3";

         // Optimize for a common Intel EM64 architecture (Core i7) on
         // Linux and UNIX builds.
         s += " -mtune=corei7";

         // OS X builds require SSSE3 support. Linux and FreeBSD builds require
         // only SSE3, for compatibility with vintage AMD machines.
         if ( this.isMacOSXPlatform() )
            s += " -mssse3";
         else
         {
            if ( this.isLinuxPlatform() )
               s += " -mfpmath=sse";
            s += " -msse3";
         }

         // Inline string operations for small blocks with runtime checks, and
         // use library calls for large blocks.
         s += " -minline-all-stringops";

         // GCC optimization level
         s += " -O" + optimization;

         // Make all functions susceptible to inlining under -O2 optimization
         // (already enabled for -O3).
         if ( optimization == "2" )
            s += " -finline-functions";

         // On OS X, omitting frame pointers is *not allowed* and leads to a
         // nightmare of crashes.
         if ( !this.isMacOSXPlatform() )
            s += " -fomit-frame-pointer"; // this may not be enabled by default on x64

         // Generate separate function and data sections, for removal of unused
         // sections during the link phase (see the --gc-sections linker flag).
         s += " -ffunction-sections -fdata-sections";

         if ( optimization == "2" || optimization == "3" )
         {
            // Fast math always enabled for optimized builds.
            s += " -ffast-math";

            // Link-time optimization available for modules, PCL, and
            // third-party shared libraries.
            // ### N.B.: Use of this option is experimental and not recommended
            // without extensive testing. It poses a risk to generate unstable
            // binaries without a significant performance improvement.
            if ( this.gccLinkTimeOptimization )
               if ( this.isModule() || this.official && (this.isStaticLibrary() || this.isDynamicLibrary()) )
                  s += " -flto";
         }
      }

      // GCC 4.2 on OS X requires hidden visibility enabled also for executables
      // ### FIXME: Doesn't hurt, but, is this still true for Clang?
      if ( this.hidden || this.isModule() || (this.isCore() || this.isCoreAux() || this.isExecutable()) && this.isMacOSXPlatform() )
      {
         s += " -fvisibility=hidden";
         if ( isCpp )
            s += " -fvisibility-inlines-hidden";
      }

      // Generate code that allows trapping instructions to throw exceptions.
      // This is not available on Clang.
      if ( !this.isMacOSXPlatform() && !this.isFreeBSDPlatform() )
         s += " -fnon-call-exceptions";

      // Optional unstripped binaries to allow for significant backtraces with
      // demangled function names.
      if ( this.gccUnstrippedBinaries )
         s += " -rdynamic";

      // Since Core version 1.8.3, we require C++11 support.
      if ( isCpp )
      {
         s += " -std=c++11";
         if ( this.isMacOSXPlatform() )
            s += " -stdlib=libc++"; // ?! - required since Xcode 6 - hmmm...
      }

      // - Enable all warnings.
      // - Suppress some useless warnings related to parentheses.
      s += " -Wall -Wno-parentheses";

      if ( isCpp )
      {
         // Clang generates *really* useless and nasty warnings about different
         // representations of empty structures in C and C++.
         if ( this.isMacOSXPlatform() || this.isFreeBSDPlatform() )
            s += " -Wno-extern-c-compat";

         // SpiderMonkey on g++ and clang generates warnings about applying
         // offsetof() to non-POD types.
         if ( this.isCore() )
            s += " -Wno-invalid-offsetof";
      }

      // Manage dependencies.
      s += " -MMD -MP -MF\"$(@:%.o=%.d)\" -o\"$@\" \"$<\"";

      return s;
   };

   this.gccBuildCommand = function()
   {
      if ( this.isStaticLibrary() )
         return "ar r $(OBJ_DIR)/" + this.mainTarget() + " $(OBJ_FILES)";

      let s = this.gccCxxCompiler() + this.gccArchFlags() + this.gccPICFlags();

      if ( this.isMacOSXPlatform() )
      {
         // The documentation for install_name_tool points out:
         //    "For this tool to work when the install names or rpaths are
         //    larger the binary should be built with the ld
         //    -headerpad_max_install_names option."
         // See: http://stackoverflow.com/questions/2092378/
         //             macosx-how-to-collect-dependencies-into-a-local-bundle
         s += " -headerpad_max_install_names";
         s += " -Wl,-syslibroot,/Applications/Xcode.app/Contents/Developer/Platforms/MacOSX.platform/Developer/SDKs/MacOSX" + this.osxSDKVersion + ".sdk";
         s += " -mmacosx-version-min=10.10";
         s += " -stdlib=libc++";
      }
      else
      {
         // On Linux, always use the gold linker.
         if ( this.isLinuxPlatform() )
            s += " -pthread -Wl,-fuse-ld=gold"
         // On Linux and FreeBSD, mark all executables and shared objects as
         // not requiring an executable stack.
         s += " -Wl,-z,noexecstack";
         // GCC and Clang on Darwin don't support linker optimizations.
         s += " -Wl,-O1";
      }

      // Exclude unused sections.
      s += " -Wl," + (this.isMacOSXPlatform() ? "-dead_strip" : "--gc-sections");

      // Be compatible with old Linux distributions without CXXABI_1.3.8, such
      // as RHEL 7. This rpath allows us to use a libstdc++.so.6.0.22 or newer
      // created by installing GCC >= 4.9. Note that the updater1 program is
      // executed by root (through an SUID bit) on regular installations, so
      // the process does not inherit the core application's environment.
      if ( this.isLinuxPlatform() )
         if ( this.mainTarget() == "PixInsightUpdater" )
            s += " -Wl,-rpath,/usr/local/lib64/:/lib64/";

      // Strip all symbols by default, or optionally allow for significant
      // backtraces with demangled function names.
      if ( this.gccUnstrippedBinaries )
         s += " -rdynamic";
      else if ( !this.isMacOSXPlatform() ) // -s declared obsolete in latest versions of clang
         s += " -s";

      if ( this.isModule() || this.isDynamicLibrary() )
         s += (this.isMacOSXPlatform()) ?
               " -dynamiclib -install_name @executable_path/" + this.mainTarget() : " -shared";
      if ( this.isMacOSXPlatform() )
         if ( this.isCore() || this.isCoreAux() || this.dependsOnQt() )
            s += " -rpath @executable_path/../Frameworks";

      // Link-time optimization for building modules and third-party shared
      // libraries. ### Warning: this option is experimental.
      if ( this.gccLinkTimeOptimization )
         if ( this.isModule() || this.official && (this.isStaticLibrary() || this.isDynamicLibrary()) )
            if ( this.gccOptimization == "2" || this.gccOptimization == "3" || this.gccOptimization == "fast" )
               s += " -flto";

      s += " -L\"" + this.libDirectory() + "\"";
      s += " -L\"" + this.binDirectory() + "\"";

      if ( this.isCore() || this.isCoreAux() ||
           (this.isModule() || this.isDynamicLibrary() || this.isExecutable()) && this.dependsOnQt() )
      {
         if ( this.isLinuxPlatform() || this.isFreeBSDPlatform() )
            s += " -L\"" + this.binDirectory() + "/lib\"";
         if ( this.isFreeBSDPlatform() )
         {
            s += " -L/usr/local/lib -L/usr/local/lib/qt5";
            if ( this.isCore() || this.isCoreAux() )
               s += " -L/usr/X11R6/lib";
         }
         else
         {
            s += " -L\"" + this.qtDirectory() + "/qtbase/lib\"";
            if ( this.isMacOSXPlatform() )
               s += " -F\"" + this.qtDirectory() + "/qtbase/lib\"";
         }
      }

      if ( this.isModule() || this.isDynamicLibrary() || this.isExecutable() || this.isCoreAux() )
         for ( let i = 0; i < this.extraLibDirs.length; ++i )
            s += " -L\"" + this.extraLibDirs[i] + (this.is64BitProject() ? "/x64" : "/x86") + "\"";

      s += " -o $(OBJ_DIR)/" + this.mainTarget() + " $(OBJ_FILES)";

      if ( this.isModule() || this.isDynamicLibrary() )
         if ( this.isMacOSXPlatform() )
         {
            s += " -framework CoreFoundation"; // required since PI 1.8.0
            for ( let i = 0; i < this.extraLibraries.length; ++i )
               if ( this.extraLibraries[i].startsWith( "Qt" ) )
                  s += " -framework " + this.extraLibraries[i].replace( "Qt5", "Qt" );
            if ( this.isModule() )
               s += " -lpthread -lPCL-pxi -llz4-pxi -lzlib-pxi -lRFC6234-pxi -llcms-pxi -lcminpack-pxi";
            for ( let i = 0; i < this.extraLibraries.length; ++i )
               if ( !this.extraLibraries[i].startsWith( "Qt" ) )
                  s += " -l" + this.extraLibraries[i];
         }
         else
         {
            if ( this.isModule() )
               s += " -lpthread -lPCL-pxi -llz4-pxi -lzlib-pxi -lRFC6234-pxi -llcms-pxi -lcminpack-pxi";
            for ( let i = 0; i < this.extraLibraries.length; ++i )
               s += " -l" + this.extraLibraries[i];
         }

      if ( this.isExecutable() || this.isX11Installer() )
      {
         if ( this.isMacOSXPlatform() )
            s += " -framework AppKit -framework ApplicationServices";
         s += " -lpthread -lPCL-pxi -llz4-pxi -lzlib-pxi -lRFC6234-pxi -llcms-pxi -lcminpack-pxi";
         for ( let i = 0; i < this.extraLibraries.length; ++i )
            s += " -l" + this.extraLibraries[i];
      }

      if ( this.isCore() )
      {
         // System and Qt libraries.
         if ( this.isMacOSXPlatform() )
         {
            // Cocoa-based core application, Qt/Mac >= 5.4
            s += " -lz -framework Carbon -framework AppKit -framework ApplicationServices -framework Security" +
                 " -framework DiskArbitration -framework IOKit -framework OpenGL -framework AGL" +
                 " -lQt5UiTools -framework QtSensors -framework QtPositioning -framework QtMultimediaWidgets" +
                 " -framework QtMultimedia -framework QtOpenGL -framework QtSql -framework QtQml -framework QtQuick" +
                 " -framework QtWebChannel -framework QtWebEngine -framework QtWebEngineCore -framework QtWebEngineWidgets" +
                 " -framework QtPrintSupport -framework QtMacExtras -framework QtWidgets -framework QtGui -framework QtSvg" +
                 " -framework QtXml -framework QtNetwork -framework QtCore";
         }
         else
         {
            // X11-Linux/FreeBSD core application, Qt/X11 >= 5.4
            s += " -lSM -lICE -lXi -lXrender -lXrandr -lfreetype -lfontconfig -lXext -lX11" +
                 " -lm -lgthread-2.0 -lgobject-2.0 -lrt -lglib-2.0 -lpthread";
            if ( this.isFreeBSDPlatform() )
               s += " -lexecinfo";
            else
               s += " -ldl -lresolv";
            s += " -lcom_err -lidn -lz";
            if ( !this.isMacOSXPlatform() )
               s += " -lssl -lcrypto";
            if ( !this.isFreeBSDPlatform() )
               s += " -lssh2";
            s += " -lQt5UiTools -lQt5Sensors -lQt5Positioning -lQt5MultimediaWidgets -lQt5Multimedia" +
                 " -lQt5OpenGL -lQt5Sql -lQt5Qml -lQt5Quick -lQt5WebChannel -lQt5WebEngine -lQt5WebEngineCore" +
                 " -lQt5WebEngineWidgets -lQt5PrintSupport -lQt5X11Extras -lQt5Widgets -lQt5Gui -lQt5Svg" +
                 " -lQt5Xml -lQt5Network -lQt5Core";
         }

         // SpiderMonkey >= 1.8.7 since PI version 1.8.0.853
         // PixInsight Class Library (PCL)
         // LZ4
         // Zlib
         // RFC6234
         // cURL
         // Little CMS
         s += " -lmozjs" + CORE_JS_ENGINE_VERSION + " -lPCL-pxi -llz4-pxi -lzlib-pxi -lRFC6234-pxi -lcurl-pxi -llcms-pxi";
      }

      if ( this.isCoreAux() )
      {
         if ( this.isMacOSXPlatform() )
         {
            s += " -framework AppKit -framework ApplicationServices" +
                 " -framework DiskArbitration -framework IOKit -framework OpenGL -framework AGL" +
                 " -framework QtWidgets -framework QtGui -framework QtCore";
         }
         else
         {
            s += " -lSM -lICE -lXext -lX11 -lm -lpthread";
            if ( !this.isFreeBSDPlatform() )
               s += " -ldl -lresolv";
            s += " -lQt5Widgets -lQt5Gui -lQt5Core";
         }

         s += " -lPCL-pxi";
         for ( let i = 0; i < this.extraLibraries.length; ++i )
            s += " -l" + this.extraLibraries[i];
      }

      return s;
   };

   this.qtDirectory = function()
   {
      return this.is64BitProject() ? "$(QTDIR64)" : "$(QTDIR32)";
   };

   this.libDirectory = function()
   {
      return this.is64BitProject() ? "$(PCLLIBDIR64)" : "$(PCLLIBDIR32)";
   };

   this.binDirectory = function()
   {
      return this.is64BitProject() ? "$(PCLBINDIR64)" : "$(PCLBINDIR32)";
   };

   this.destinationDirectory = function()
   {
      // Static libraries, e.g. the PCL library.
      if ( this.isStaticLibrary() )
         return this.libDirectory();

      // Installer program on FreeBSD and Linux.
      if ( this.isX11Installer() )
         return this.binDirectory() + "/../..";

      // Core executables inside the application bundle on Mac OS X.
      if ( this.isMacOSXPlatform() )
         if ( this.isCore() || this.isCoreAux() || this.isCoreExecutable() )
            return "$(PCLDIR)/dist/" + this.architecture + "/PixInsight/" + this.macOSXAppName() + "/Contents/MacOS";

      // Everything else on the bin distribution directory on all platforms.
      return this.binDirectory();
   };
}

// ----------------------------------------------------------------------------
// EOF MakGenParameters.js - Released 2017-08-01T15:54:50Z
