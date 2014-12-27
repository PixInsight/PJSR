// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// MakGenParameters.js - Released 2014/10/15 17:07:00 UTC
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
    * One of: "FreeBSD" "Linux" "MacOSX" "MacOSX106" "Windows"
    */
   this.platform = "";

   /*
    * Project architecture
    * One of: "x86" "x64"
    * For GNU/GCC only; ignored for Windows projects.
    */
   this.architecture = "";

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
   this.gccOptimization = "2"; // -O2

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

   this.isDynamicLibrary = function()
   {
      return this.type == "DynamicLibrary";
   };

   this.isStaticLibrary = function()
   {
      return this.type == "StaticLibrary";
   };

   this.isExecutable = function()
   {
      return this.type == "Executable";
   };

   this.isCore = function()
   {
      return this.type == "Core";
   };

   this.isCoreAux = function()
   {
      return this.type == "CoreAux";
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
      return this.platform == "MacOSX" || this.platform == "MacOSX106";
   };

   this.isMacOSX106Platform = function()
   {
      return this.platform == "MacOSX106";
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
         if ( this.isMacOSX106Platform() )
            return baseDirectory + "/macosx10.6";
         else
            return baseDirectory + "/macosx";
      if ( this.isWindowsPlatform() )
         return baseDirectory + "/windows";

      return null;
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
      {
         if ( this.isMacOSX106Platform() )
            return "clang++-mp-3.2 ";
         return "clang++ ";
      }

      return "g++" + this.gccSuffixLinux + ' ';
   };

   this.gccCCompiler = function()
   {
      if ( this.isMacOSXPlatform() || this.isFreeBSDPlatform() )
      {
         if ( this.isMacOSX106Platform() )
            return "clang-mp-3.2 ";
         return "clang ";
      }

      return "gcc" + this.gccSuffixLinux + ' ';
   };

   this.gccArchFlags = function()
   {
      if ( this.isMacOSXPlatform() )
      {
         var s = (this.is64BitProject() ? (this.osxArchOptions ? "-arch x86_64 -Xarch_x86_64" : "-m64") :
                                          (this.osxArchOptions ? "-arch i386 -Xarch_i386"     : "-m32"));
         return s + (this.isMacOSX106Platform() ? " -mmacosx-version-min=10.6" : " -mmacosx-version-min=10.8");
      }
      return this.is64BitProject() ? "-m64" : "-m32";
   };

   this.gccPICFlags = function()
   {
      // PIC is always enabled for Mac OS X. Enabled only for x64 Linux and FreeBSD builds.
      return (this.isMacOSXPlatform() || (this.isLinuxPlatform() || this.isFreeBSDPlatform()) && this.is64BitProject()) ? " -fPIC" : "";
   };

   this.gccCompileArgs = function()
   {
      var s = "-c -pipe " + this.gccArchFlags() + this.gccPICFlags();

      s += " -D_REENTRANT -D" + this.platformMacroId();
      if ( this.isCore() )
      {
         if ( this.isMacOSX106Platform() ) // Control some platform-specific conditional compilations for OSX 10.6/10.7
            s += " -D__PCL_MACOSX106";
         s += " -D__PCL_BUILDING_PIXINSIGHT_APPLICATION -D__PCL_QT_INTERFACE" + // PCL
              " -DXP_UNIX" + // SpiderMonkey
              " -DQT_EDITION=QT_EDITION_OPENSOURCE -DQT_SHARED" + // Qt/LGPL
              " -DQT_NO_DEBUG -DQT_GUI_LIB -DQT_CORE_LIB -DQT_XML_LIB -DQT_SVG_LIB -DQT_WEBKIT_LIB -DQT_NETWORK_LIB" +
              " -DQT_NO_QT_INCLUDE_WARN" +
              " -D_LARGEFILE64_SOURCE -D_LARGEFILE_SOURCE";
         // On Mac OS X, all 64-bit core builds must use the Cocoa-based version of Qt.
         if ( this.isMacOSXPlatform() && this.is64BitProject() )
            s += " -DQT_MAC_USE_COCOA";
      }
      else
      {
         if ( this.isCoreAux() )
            s += " -D__PCL_QT_INTERFACE" + // PCL
                 " -DQT_EDITION=QT_EDITION_OPENSOURCE -DQT_SHARED" + // Qt/LGPL
                 " -DQT_NO_DEBUG -DQT_GUI_LIB -DQT_CORE_LIB" +
                 " -DQT_NO_QT_INCLUDE_WARN" +
                 " -D_LARGEFILE64_SOURCE -D_LARGEFILE_SOURCE";

         for ( var i = 0; i < this.extraDefinitions.length; ++i )
            s += " -D\"" + this.extraDefinitions[i] + "\"";
      }

      if ( this.diagnostics != 0 )
         s += " -D__PCL_DIAGNOSTICS_LEVEL=" + this.diagnostics.toString();

      s += " -I\"$(PCLINCDIR)\"";
      if ( this.isCore() || this.isCoreAux() )
      {
         s += " -I\"" + this.qtDirectory() + "/include\"";
         s += " -I\"" + this.qtDirectory() + "/include/Qt\"";
         s += " -I\"" + this.qtDirectory() + "/mkspecs/";
         if ( this.isMacOSXPlatform() )
            s += "macx-g++";
         else if ( this.isFreeBSDPlatform() )
            s += "freebsd-g++";
         else
            s += this.is64BitProject() ? "mkspecs/linux-g++-64" : "mkspecs/linux-g++-32";
         s += "\"";

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

      if ( !this.isCore() )
         for ( var i = 0; i < this.extraIncludeDirs.length; ++i )
            s += " -I\"" + this.extraIncludeDirs[i] + "\"";

      if ( this.gccDebug )
         s += " -O0 -g";
      else
      {
         // -Ofast not supported by GCC 4.2.x on Mac OS X
         // ### FIXME: Unimportant, but is this still true for Clang?
         var optimization = this.gccOptimization;
         if ( this.isMacOSXPlatform() )
            if ( optimization == "fast" )
               optimization = "3";

         // All Mac OS X builds require SSSE3 support
         // 64-bit and 32-bit FreeBSD, Linux and Windows builds require SSE3 support
         s += " -O" + optimization + " -mtune=generic";
         if ( this.isMacOSXPlatform() )
            s += " -mssse3";
         else
         {
            if ( this.isLinuxPlatform() )
               s += " -mfpmath=sse"; // clang does not have this one
            s += " -msse3"; // no SSSE3 for compatibility with vintage AMD processors
         }

         if ( !this.isMacOSXPlatform() && !this.isFreeBSDPlatform() )
            s += " -minline-all-stringops -ffunction-sections -fdata-sections"; // clang does not have these ones

         // On Mac OS X, omitting frame pointers is not *allowed* and leads to a nightmare of crashes.
         if ( !this.isMacOSXPlatform() )
            s += " -fomit-frame-pointer"; // this may not be enabled by default on x64

         if ( optimization != "fast" )
         {
            s += " -ffast-math";
            if ( optimization != "3" )
               if ( !this.isMacOSX106Platform() ) // clang 3.x does not support vectorization
                  s += " -ftree-vectorize";
         }

         // Whole program optimization enabled for modules on GCC >= 4.6.x
         if ( !this.isMacOSXPlatform() && !this.isFreeBSDPlatform() )
            if ( !(this.isCore() || this.isCoreAux()) )
               s += " -flto -fwhole-program";
      }

      // GCC 4.2 on Mac OS X requires hidden visibility enabled also for executables
      // ### FIXME: Doesn't hurt, but is this still true for Clang?
      if ( this.hidden || this.isModule() || (this.isCore() || this.isCoreAux() || this.isExecutable()) && this.isMacOSXPlatform() )
         s += " -fvisibility=hidden -fvisibility-inlines-hidden";

      if ( !this.isMacOSXPlatform() && !this.isFreeBSDPlatform() )
         s += " -fnon-call-exceptions"; // clang does not have this one

      s += " -Wall -Wno-parentheses";

      // SpiderMonkey 24 on GCC generates warnings about applying offsetof() to
      // non-POD types.
      if ( this.isCore() )
         if ( this.isLinuxPlatform() )
            s += " -Wno-invalid-offsetof";

      s += " -MMD -MP -MF\"$(@:%.o=%.d)\" -o\"$@\" \"$<\"";

      return s;
   };

   this.gccBuildCommand = function()
   {
      if ( this.isStaticLibrary() )
         return "ar r $(OBJ_DIR)/" + this.mainTarget() + " $(OBJ_FILES)";

      var s = this.gccCxxCompiler() + this.gccArchFlags() + this.gccPICFlags();

      if ( this.isMacOSXPlatform() )
      {
         // The documentation for install_name_tool points out:
         //    "For this tool to work when the install names or rpaths are
         //    larger the binary should be built with the ld
         //    -headerpad_max_install_names option."
         // See: http://stackoverflow.com/questions/2092378/
         //             macosx-how-to-collect-dependencies-into-a-local-bundle
         s += " -headerpad_max_install_names";
      }
      else
      {
         // On Linux and FreeBSD, mark all executables and shared objects as
         // not requiring an executable stack.
         s += " -Wl,-z,noexecstack";
         // GCC on Darwin doesn't support linker optimizations.
         s += " -Wl,-O1";
      }

      if ( this.isModule() || this.isDynamicLibrary() )
         s += (this.isMacOSXPlatform()) ?
               " -dynamiclib -install_name @executable_path/" + this.mainTarget() : " -shared";

      s += " -L\"" + this.libDirectory() + "\"";
      s += " -L\"" + this.binDirectory() + "\"";

      if ( this.isCore() || this.isCoreAux() )
      {
         if ( this.isLinuxPlatform() || this.isFreeBSDPlatform() )
            s += " -L\"" + this.binDirectory() + "/lib\"";
         s += " -L\"" + this.qtDirectory() + "/lib\"";
         if ( this.isMacOSXPlatform() )
            s += " -L\"" + this.destinationDirectory() + "\" -F\"" + this.qtDirectory() + "/lib\"";
         if ( this.isFreeBSDPlatform() )
            s += " -L/usr/local/lib -L/usr/X11R6/lib";
      }

      if ( this.isModule() || this.isDynamicLibrary() || this.isExecutable() || this.isCoreAux() )
         for ( var i = 0; i < this.extraLibDirs.length; ++i )
            s += " -L\"" + this.extraLibDirs[i] + (this.is64BitProject() ? "/x64" : "/x86") + "\"";

      s += " -o $(OBJ_DIR)/" + this.mainTarget() + " $(OBJ_FILES)";

      if ( this.isModule() || this.isDynamicLibrary() )
      {
         if ( this.isMacOSXPlatform() )
            s += " -framework CoreFoundation"; // required since PI 1.8.0
         for ( var i = 0; i < this.extraLibraries.length; ++i )
            s += " -l" + this.extraLibraries[i];
         if ( this.isModule() )
            s += " -lpthread -lPCL-pxi";
      }

      if ( this.isExecutable() || this.isX11Installer() )
      {
         if ( this.isMacOSXPlatform() )
            s += " -framework Carbon -framework AppKit -framework ApplicationServices";
         for ( var i = 0; i < this.extraLibraries.length; ++i )
            s += " -l" + this.extraLibraries[i];
         s += " -lpthread -lPCL-pxi";
      }

      if ( this.isCore() )
      {
         // System and Qt libraries.
         if ( this.isMacOSXPlatform() )
         {
            // Carbon-based and Cocoa-based core application, Qt/Mac >= 4.5.3
            s += " -lz -framework Carbon -framework AppKit -framework ApplicationServices -framework Security" +
                 " -framework QtGui -framework QtSvg -framework QtXml -framework QtWebKit -framework QtNetwork -framework QtCore";
         }
         else
         {
            // X11-Linux/FreeBSD core application, Qt/X11 >= 4.5.3
            s += " -lSM -lICE -lXi -lXrender -lXrandr -lfreetype -lfontconfig -lXext -lX11" +
                 " -lm -lgthread-2.0 -lgobject-2.0 -lrt -lglib-2.0 -lpthread";
            if ( !this.isFreeBSDPlatform() )
               s += " -ldl -lresolv";
            s += " -lcom_err -lidn -lz";
            if ( !this.isFreeBSDPlatform() )
               s += " -lssh2";
            s += " -lQtGui -lQtSvg -lQtXml -lQtWebKit -lQtNetwork -lQtCore";
         }

         // SpiderMonkey >= 1.8.7 since PI version 1.8.0.853
         // cURL
         s += " -lmozjs" + CORE_JS_ENGINE_VERSION + " -lcurl-pxi";

         // OpenSSL required on FreeBSD and Linux
         if ( !this.isMacOSXPlatform() )
            s += " -lssl-pxi -lcrypto-pxi";

         // Little CMS
         // PixInsight Class Library (PCL)
         s += " -llcms-pxi -lPCL-pxi";
      }

      if ( this.isCoreAux() )
      {
         if ( this.isMacOSXPlatform() )
         {
            s += " -framework Carbon -framework AppKit -framework ApplicationServices" +
                 " -framework QtGui -framework QtCore";
         }
         else
         {
            s += " -lSM -lICE -lXext -lX11 -lm -lpthread";
            if ( !this.isFreeBSDPlatform() )
               s += " -ldl -lresolv";
            s += " -lQtGui -lQtCore";
         }

         s += " -lPCL-pxi";
         for ( var i = 0; i < this.extraLibraries.length; ++i )
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
         if ( this.isCore() || this.isCoreAux() )
            return "$(PCLDIR)/dist/" + this.architecture + "/PixInsight/" + this.macOSXAppName() + "/Contents/MacOS";

      // Everything else on the bin distribution directory on all platforms.
      return this.binDirectory();
   };
}

// ****************************************************************************
// EOF MakGenParameters.js - Released 2014/10/15 17:07:00 UTC
