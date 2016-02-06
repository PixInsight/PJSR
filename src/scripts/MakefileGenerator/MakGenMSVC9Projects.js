// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// MakGenMSVC9Projects.js - Released 2015/11/26 08:53:10 UTC
// ----------------------------------------------------------------------------
//
// This file is part of PixInsight Makefile Generator Script version 1.100
//
// Copyright (c) 2009-2015 Pleiades Astrophoto S.L.
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
 * Copyright (c) 2009-2015, Pleiades Astrophoto S.L. All Rights Reserved.
 * Written by Juan Conejero (PTeam)
 *
 * Generation of project files for Microsoft Visual C++ 2008 (.vcproj files).
 */

function MSVCxx9( F, P )
{
   function outFilterTagFromDirectory( f, dir )
   {
      f.outTextLn( "         <Filter Name=\"" + dir.replace( /\x2f/g, '_' ) + "\">" );
   }

   function outCloseFilterTagFromDirectory( f )
   {
      f.outTextLn( "         </Filter>" );
   }

   function outFileTag( f, indent, prefix, file )
   {
      f.outTextLn( indent + "<File RelativePath=\"..\\..\\" + prefix + file + "\"/>" );
   }

   P.validate();
   P.validateMSVCxxBuild();

   var buildDirectory = P.vccBuildDirectory( F.baseDirectory, 9 );
   if ( P.cleanUpPreviousBuilds )
      if ( File.directoryExists( buildDirectory ) )
         removeDirectory( buildDirectory );

   var projectPath = buildDirectory + '/' + P.vccProject( 9 );

   console.writeln( "<end><cbr><br>==> Generating VC++ 2008 project file:" );
   console.writeln( projectPath );
   console.flush();

   createDirectoryIfNotExists( buildDirectory + "/Win32/Release", true );
   createDirectoryIfNotExists( buildDirectory + "/x64/Release", true );
   createDirectoryIfNotExists( buildDirectory + "/Win32/Debug", true );
   createDirectoryIfNotExists( buildDirectory + "/x64/Debug", true );

   var configurationType;
   if ( P.isModule() || P.isDynamicLibrary() )
      configurationType = "2";
   else if ( P.isStaticLibrary() )
      configurationType = "4";
   else if ( P.isExecutable() || P.isCore() || P.isCoreAux() )
      configurationType = "1";

   var includeDirectories = "&quot;$(PCLINCDIR)&quot;";
   var includeDirectories32 = "";
   var includeDirectories64 = "";
   if ( P.isCore() || P.isCoreAux() )
      includeDirectories += ";&quot;$(QTDIR)/include&quot;;&quot;$(QTDIR)/include/Qt&quot;;&quot;$(QTDIR)/mkspecs/win32-msvc2008&quot;";
   if ( P.isCore() )
   {
      includeDirectories += ";&quot;$(PCLSRCDIR)/core/Components&quot;;&quot;$(PCLSRCDIR)/core&quot;";
      includeDirectories32 = ";&quot;$(PCLINCDIR)/js/windows/x86&quot;"; // SpiderMonkey
      includeDirectories64 = ";&quot;$(PCLINCDIR)/js/windows/x64&quot;"; // ..
   }
   else
      for ( var i = 0; i < P.extraIncludeDirs.length; ++i )
         includeDirectories += ";&quot;" + P.extraIncludeDirs[i] + "&quot;";
   includeDirectories = File.unixPathToWindows( includeDirectories );

   var preprocessorDefinitions = "WIN32;_WINDOWS;__PCL_WINDOWS";
   if ( P.isCore() )
   {
      preprocessorDefinitions += ";__PCL_BUILDING_PIXINSIGHT_APPLICATION;__PCL_QT_INTERFACE;" +
                  "XP_WIN;" + // SpiderMonkey
                  "CMS_DLL;CURL_STATICLIB;" +
                  "QT_EDITION=QT_EDITION_OPENSOURCE;QT_SHARED;QT_NO_DEBUG;" +
                  "QT_GUI_LIB;QT_CORE_LIB;QT_XML_LIB;QT_SVG_LIB;QT_WEBKIT_LIB;QT_NETWORK_LIB;" +
                  "QT_NO_QT_INCLUDE_WARN";
   }
   else
   {
      if ( P.isCoreAux() )
         preprocessorDefinitions += ";__PCL_QT_INTERFACE;" +
                     "QT_EDITION=QT_EDITION_OPENSOURCE;QT_SHARED;QT_NO_DEBUG;" +
                     "QT_GUI_LIB;QT_CORE_LIB;" +
                     "QT_NO_QT_INCLUDE_WARN";

      for ( var i = 0; i < P.extraDefinitions.length; ++i )
         preprocessorDefinitions += ";&quot;" + P.extraDefinitions[i] + "&quot;";
      for ( var i = 0; i < P.winExtraDefinitions.length; ++i )
         preprocessorDefinitions += ";&quot;" + P.winExtraDefinitions[i] + "&quot;";
   }

   var diagnosticsDefinition = (P.diagnostics != 0) ? ";__PCL_DIAGNOSTICS_LEVEL=" + P.diagnostics.toString() : "";

   var libraryDirectories32 = "$(PCLLIBDIR32)";
   var libraryDirectories64 = "$(PCLLIBDIR64)";
   if ( P.isCore() || P.isCoreAux() )
   {
      // On Windows, we have all Qt libraries on PCL lib directories
      libraryDirectories32 += ";$(PCLLIBDIR32)/Qt";
      libraryDirectories64 += ";$(PCLLIBDIR64)/Qt";
   }
   if ( !P.isCore() )
      for ( var i = 0; i < P.extraLibDirs.length; ++i )
      {
         libraryDirectories32 += ";&quot;" + P.extraLibDirs[i] + "\\x86&quot;";
         libraryDirectories64 += ";&quot;" + P.extraLibDirs[i] + "\\x64&quot;";
      }
   libraryDirectories32 = File.unixPathToWindows( libraryDirectories32 );
   libraryDirectories64 = File.unixPathToWindows( libraryDirectories64 );

   var libraries = "";
   if ( P.isCore() )
      libraries = "qtmain.lib QtCore4.lib QtGui4.lib QtXml4.lib QtSvg4.lib QtWebKit4.lib QtNetwork4.lib "
                + "mozjs" + CORE_JS_ENGINE_VERSION + ".lib curl-pxi.lib lcms-pxi.lib PCL-pxi.lib "
                + "imm32.lib shlwapi.lib Ws2_32.lib wldap32.lib Mscms.lib Winmm.lib";
   else
   {
      if ( P.isCoreAux() )
         libraries = "qtmain.lib QtCore4.lib QtGui4.lib PCL-pxi.lib "
                   + "imm32.lib shlwapi.lib Ws2_32.lib wldap32.lib Winmm.lib";
      if ( P.isModule() || P.isExecutable() )
         libraries = "PCL-pxi.lib";
      for ( var i = 0; i < P.extraLibraries.length; ++i )
      {
         // Make sure that all libraries carry the .lib suffix on Windows.
         var extraLib = P.extraLibraries[i];
         if ( File.extractExtension( extraLib ).length == 0 )
            extraLib += ".lib";
         libraries += " &quot;" + extraLib + "&quot;";
      }
   }

   var wholeProgramOptimization = P.isModule() || P.isDynamicLibrary();

   /*
    * Project file generation
    */

   var f = new File;
   f.createForWriting( projectPath );

   MSVCxxHeader( f, F, P, 9 );

   f.outTextLn( "<VisualStudioProject" );
   f.outTextLn( "   ProjectType=\"Visual C++\"" );
   f.outTextLn( "   Version=\"9.00\"" );
   f.outTextLn( "   Name=\"" + P.id + "\"" );
	f.outTextLn( "   ProjectGUID=\"{1E7F3743-070F-4407-928E-2A4A7664F5BE}\"" );
   f.outTextLn( "   RootNamespace=\"PixInsight\"" );
   f.outTextLn( "   Keyword=\"Win32Proj\"" );
   f.outTextLn( "   TargetFrameworkVersion=\"196613\"" );
   f.outTextLn( ">" );
   f.outTextLn( "   <Platforms>" );
   f.outTextLn( "      <Platform Name=\"Win32\"/>" );
   f.outTextLn( "      <Platform Name=\"x64\"/>" );
   f.outTextLn( "   </Platforms>" );
   f.outTextLn( "   <Configurations>" );

   // x86 Release

   f.outTextLn( "      <Configuration" );
   f.outTextLn( "         Name=\"Release|Win32\"" );
   f.outTextLn( "         OutputDirectory=\"$(SolutionDir)$(PlatformName)\\$(ConfigurationName)\"" );
   f.outTextLn( "         IntermediateDirectory=\"$(PlatformName)\\$(ConfigurationName)\"" );
   f.outTextLn( "         ConfigurationType=\"" + configurationType + "\"" );
   f.outTextLn( "         CharacterSet=\"2\"" );
   f.outTextLn( "         WholeProgramOptimization=\"" + (wholeProgramOptimization ? "1" : "0") + "\"" );
   f.outTextLn( "      >" );
   f.outTextLn( "         <Tool" );
   f.outTextLn( "            Name=\"VCCLCompilerTool\"" );
   f.outTextLn( "            Optimization=\"2\"" );
   f.outTextLn( "            InlineFunctionExpansion=\"2\"" );
   f.outTextLn( "            EnableIntrinsicFunctions=\"true\"" );
   f.outTextLn( "            FavorSizeOrSpeed=\"1\"" );
   f.outTextLn( "            OmitFramePointers=\"true\"" );
   f.outTextLn( "            WholeProgramOptimization=\"" + (wholeProgramOptimization ? "true" : "false") + "\"" );
   f.outTextLn( "            AdditionalIncludeDirectories=\"" + includeDirectories + includeDirectories32 + "\"" );
   f.outTextLn( "            PreprocessorDefinitions=\"" + preprocessorDefinitions + ";_NDEBUG\"" );
   f.outTextLn( "            StringPooling=\"true\"" );
   f.outTextLn( "            ExceptionHandling=\"2\"" );
   f.outTextLn( "            RuntimeLibrary=\"2\"" );
   f.outTextLn( "            BufferSecurityCheck=\"false\"" );
   f.outTextLn( "            EnableFunctionLevelLinking=\"false\"" );
   f.outTextLn( "            EnableEnhancedInstructionSet=\"2\"" ); // arch:SSE2
   f.outTextLn( "            FloatingPointModel=\"0\"" ); // 'precise' math
   f.outTextLn( "            UsePrecompiledHeader=\"0\"" );
   f.outTextLn( "            WarningLevel=\"3\"" );
   f.outTextLn( "            DebugInformationFormat=\"0\"" );
   f.outTextLn( "         />" );
   if ( P.isStaticLibrary() )
   {
      f.outTextLn( "         <Tool" );
      f.outTextLn( "            Name=\"VCLibrarianTool\"" );
      f.outTextLn( "            OutputFile=\"$(PCLLIBDIR32)\\" + P.mainTarget() + "\"" );
      f.outTextLn( "         />" );
   }
   else
   {
      f.outTextLn( "         <Tool" );
      f.outTextLn( "            Name=\"VCLinkerTool\"" );
      if ( P.isExecutable() || P.isCore() || P.isCoreAux() )
         f.outTextLn( "            IgnoreImportLibrary=\"true\"" );
      f.outTextLn( "            AdditionalDependencies=\"" + libraries + "\"" );
      f.outTextLn( "            OutputFile=\"$(PCLBINDIR32)\\" + P.mainTarget() + "\"" );
      f.outTextLn( "            AdditionalLibraryDirectories=\"" + libraryDirectories32 + "\"" );
      if ( P.isExecutable() && P.uacAdmin )
         f.outTextLn( "            UACExecutionLevel=\"2\"" ); // 0=asInvoker (default), 2=requireAdministrator
      f.outTextLn( "            ModuleDefinitionFile=\"" + P.winDefFile + "\"" );
      f.outTextLn( "            DelayLoadDLLs=\"\"" );
      f.outTextLn( "            SubSystem=\"2\"" );
      f.outTextLn( "            LargeAddressAware=\"2\"" );
      f.outTextLn( "            LinkTimeCodeGeneration=\"" + (wholeProgramOptimization ? "1" : "0") + "\"" );
      f.outTextLn( "            SupportUnloadOfDelayLoadedDLL=\"true\"" );
      if ( P.isModule() || P.isExecutable() )
         f.outTextLn( "            ImportLibrary=\"$(SolutionDir)$(PlatformName)\\$(ConfigurationName)\\$(ProjectName).lib\"" );
      else
         f.outTextLn( "            ImportLibrary=\"$(PCLLIBDIR32)\\$(ProjectName)-pxi.lib\"" );
      f.outTextLn( "            TargetMachine=\"1\"" );
      f.outTextLn( "            GenerateDebugInformation=\"false\"" );
      f.outTextLn( "         />" );
   }
   f.outTextLn( "      </Configuration>" );

   // x64 Release

   f.outTextLn( "      <Configuration" );
   f.outTextLn( "         Name=\"Release|x64\"" );
   f.outTextLn( "         OutputDirectory=\"$(SolutionDir)$(PlatformName)\\$(ConfigurationName)\"" );
   f.outTextLn( "         IntermediateDirectory=\"$(PlatformName)\\$(ConfigurationName)\"" );
   f.outTextLn( "         ConfigurationType=\"" + configurationType + "\"" );
   f.outTextLn( "         CharacterSet=\"2\"" );
   f.outTextLn( "         WholeProgramOptimization=\"" + (wholeProgramOptimization ? "1" : "0") + "\"" );
   f.outTextLn( "      >" );
   f.outTextLn( "         <Tool" );
   f.outTextLn( "            Name=\"VCMIDLTool\"" );
   f.outTextLn( "            TargetEnvironment=\"3\"" );
   f.outTextLn( "         />" );
   f.outTextLn( "         <Tool" );
   f.outTextLn( "            Name=\"VCCLCompilerTool\"" );
   f.outTextLn( "            Optimization=\"4\"" );   // 4="Custom Optimization". MSVC++ 64-bit is buggy with Optimization=2
   f.outTextLn( "            InlineFunctionExpansion=\"2\"" );
   f.outTextLn( "            EnableIntrinsicFunctions=\"true\"" );
   f.outTextLn( "            FavorSizeOrSpeed=\"1\"" );
   f.outTextLn( "            OmitFramePointers=\"true\"" );
   f.outTextLn( "            WholeProgramOptimization=\"" + (wholeProgramOptimization ? "true" : "false") + "\"" );
   f.outTextLn( "            AdditionalIncludeDirectories=\"" + includeDirectories + includeDirectories64 + "\"" );
   f.outTextLn( "            PreprocessorDefinitions=\"" + preprocessorDefinitions + ";_NDEBUG\"" );
   f.outTextLn( "            StringPooling=\"true\"" );
   f.outTextLn( "            ExceptionHandling=\"2\"" );
   f.outTextLn( "            RuntimeLibrary=\"2\"" );
   f.outTextLn( "            BufferSecurityCheck=\"false\"" );
   f.outTextLn( "            EnableFunctionLevelLinking=\"false\"" );
   f.outTextLn( "            EnableEnhancedInstructionSet=\"0\"" ); // should be =2 (SSE2), but VC++ defaults to SSE2 on x64
   f.outTextLn( "            FloatingPointModel=\"0\"" ); // 'precise' math
   f.outTextLn( "            UsePrecompiledHeader=\"0\"" );
   f.outTextLn( "            WarningLevel=\"3\"" );
   f.outTextLn( "            DebugInformationFormat=\"0\"" );
   f.outTextLn( "         />" );
   if ( P.isStaticLibrary() )
   {
      f.outTextLn( "         <Tool" );
      f.outTextLn( "            Name=\"VCLibrarianTool\"" );
      f.outTextLn( "            OutputFile=\"$(PCLLIBDIR64)\\" + P.mainTarget() + "\"" );
      f.outTextLn( "         />" );
   }
   else
   {
      f.outTextLn( "         <Tool" );
      f.outTextLn( "            Name=\"VCLinkerTool\"" );
      if ( P.isExecutable() || P.isCore() || P.isCoreAux() )
         f.outTextLn( "            IgnoreImportLibrary=\"true\"" );
      f.outTextLn( "            AdditionalDependencies=\"" + libraries + "\"" );
      f.outTextLn( "            OutputFile=\"$(PCLBINDIR64)\\" + P.mainTarget() + "\"" );
      f.outTextLn( "            AdditionalLibraryDirectories=\"" + libraryDirectories64 + "\"" );
      if ( P.isExecutable() && P.uacAdmin )
         f.outTextLn( "            UACExecutionLevel=\"2\"" ); // 0=asInvoker (default), 2=requireAdministrator
      f.outTextLn( "            ModuleDefinitionFile=\"" + P.winDefFile + "\"" );
      f.outTextLn( "            DelayLoadDLLs=\"\"" );
      f.outTextLn( "            SubSystem=\"2\"" );
      f.outTextLn( "            LargeAddressAware=\"2\"" );
      f.outTextLn( "            LinkTimeCodeGeneration=\"" + (wholeProgramOptimization ? "1" : "0") + "\"" );
      f.outTextLn( "            SupportUnloadOfDelayLoadedDLL=\"true\"" );
      if ( P.isModule() || P.isExecutable() )
         f.outTextLn( "            ImportLibrary=\"$(SolutionDir)$(PlatformName)\\$(ConfigurationName)\\$(ProjectName).lib\"" );
      else
         f.outTextLn( "            ImportLibrary=\"$(PCLLIBDIR64)\\$(ProjectName)-pxi.lib\"" );
      f.outTextLn( "            TargetMachine=\"17\"" );
      f.outTextLn( "            GenerateDebugInformation=\"false\"" );
      f.outTextLn( "         />" );
   }
   f.outTextLn( "      </Configuration>" );

   // x86 Debug

   f.outTextLn( "      <Configuration" );
   f.outTextLn( "         Name=\"Debug|Win32\"" );
   f.outTextLn( "         OutputDirectory=\"$(SolutionDir)$(PlatformName)\\$(ConfigurationName)\"" );
   f.outTextLn( "         IntermediateDirectory=\"$(PlatformName)\\$(ConfigurationName)\"" );
   f.outTextLn( "         ConfigurationType=\"" + configurationType + "\"" );
   f.outTextLn( "         CharacterSet=\"2\"" );
   f.outTextLn( "      >" );
   f.outTextLn( "         <Tool" );
   f.outTextLn( "            Name=\"VCCLCompilerTool\"" );
   f.outTextLn( "            Optimization=\"0\"" );
   f.outTextLn( "            AdditionalIncludeDirectories=\"" + includeDirectories + includeDirectories32 + "\"" );
   f.outTextLn( "            PreprocessorDefinitions=\"" + preprocessorDefinitions + diagnosticsDefinition + ";_DEBUG\"" );
   f.outTextLn( "            ExceptionHandling=\"2\"" );
   f.outTextLn( "            MinimalRebuild=\"true\"" );
   f.outTextLn( "            BasicRuntimeChecks=\"3\"" );
   f.outTextLn( "            RuntimeLibrary=\"3\"" );
   f.outTextLn( "            UsePrecompiledHeader=\"0\"" );
   f.outTextLn( "            WarningLevel=\"3\"" );
   f.outTextLn( "            DebugInformationFormat=\"3\"" );
   f.outTextLn( "         />" );
   if ( P.isStaticLibrary() )
   {
      f.outTextLn( "         <Tool" );
      f.outTextLn( "            Name=\"VCLibrarianTool\"" );
      f.outTextLn( "            OutputFile=\"$(PCLLIBDIR32)\\" + P.mainTarget() + "\"" );
      f.outTextLn( "         />" );
   }
   else
   {
      f.outTextLn( "         <Tool" );
      f.outTextLn( "            Name=\"VCLinkerTool\"" );
      if ( P.isExecutable() || P.isCore() || P.isCoreAux() )
         f.outTextLn( "            IgnoreImportLibrary=\"true\"" );
      f.outTextLn( "            AdditionalDependencies=\"" + libraries + "\"" );
      f.outTextLn( "            OutputFile=\"$(PCLBINDIR32)\\" + P.mainTarget() + "\"" );
      f.outTextLn( "            AdditionalLibraryDirectories=\"" + libraryDirectories32 + "\"" );
      if ( P.isExecutable() && P.uacAdmin )
         f.outTextLn( "            UACExecutionLevel=\"2\"" ); // 0=asInvoker (default), 2=requireAdministrator
      f.outTextLn( "            ModuleDefinitionFile=\"" + P.winDefFile + "\"" );
      f.outTextLn( "            SubSystem=\"2\"" );
      f.outTextLn( "            LargeAddressAware=\"2\"" );
      if ( P.isModule() || P.isExecutable() )
         f.outTextLn( "            ImportLibrary=\"$(SolutionDir)$(PlatformName)\\$(ConfigurationName)\\$(ProjectName).lib\"" );
      else
         f.outTextLn( "            ImportLibrary=\"$(PCLLIBDIR32)\\$(ProjectName)-pxi.lib\"" );
      f.outTextLn( "            TargetMachine=\"1\"" );
      f.outTextLn( "            GenerateDebugInformation=\"true\"" );
      f.outTextLn( "         />" );
   }
   f.outTextLn( "      </Configuration>" );

   // x64 Debug

   f.outTextLn( "      <Configuration" );
   f.outTextLn( "         Name=\"Debug|x64\"" );
   f.outTextLn( "         OutputDirectory=\"$(SolutionDir)$(PlatformName)\\$(ConfigurationName)\"" );
   f.outTextLn( "         IntermediateDirectory=\"$(PlatformName)\\$(ConfigurationName)\"" );
   f.outTextLn( "         ConfigurationType=\"" + configurationType + "\"" );
   f.outTextLn( "         CharacterSet=\"2\"" );
   f.outTextLn( "      >" );
   f.outTextLn( "         <Tool" );
   f.outTextLn( "            Name=\"VCMIDLTool\"" );
   f.outTextLn( "            TargetEnvironment=\"3\"" );
   f.outTextLn( "         />" );
   f.outTextLn( "         <Tool" );
   f.outTextLn( "            Name=\"VCCLCompilerTool\"" );
   f.outTextLn( "            Optimization=\"0\"" );
   f.outTextLn( "            AdditionalIncludeDirectories=\"" + includeDirectories + includeDirectories64 + "\"" );
   f.outTextLn( "            PreprocessorDefinitions=\"" + preprocessorDefinitions + diagnosticsDefinition + ";_DEBUG\"" );
   f.outTextLn( "            ExceptionHandling=\"2\"" );
   f.outTextLn( "            MinimalRebuild=\"true\"" );
   f.outTextLn( "            BasicRuntimeChecks=\"3\"" );
   f.outTextLn( "            RuntimeLibrary=\"3\"" );
   f.outTextLn( "            UsePrecompiledHeader=\"0\"" );
   f.outTextLn( "            WarningLevel=\"3\"" );
   f.outTextLn( "            DebugInformationFormat=\"3\"" );
   f.outTextLn( "         />" );
   if ( P.isStaticLibrary() )
   {
      f.outTextLn( "         <Tool" );
      f.outTextLn( "            Name=\"VCLibrarianTool\"" );
      f.outTextLn( "            OutputFile=\"$(PCLLIBDIR64)\\" + P.mainTarget() + "\"" );
      f.outTextLn( "         />" );
   }
   else
   {
      f.outTextLn( "         <Tool" );
      f.outTextLn( "            Name=\"VCLinkerTool\"" );
      if ( P.isExecutable() || P.isCore() || P.isCoreAux() )
         f.outTextLn( "            IgnoreImportLibrary=\"true\"" );
      f.outTextLn( "            AdditionalDependencies=\"" + libraries + "\"" );
      f.outTextLn( "            OutputFile=\"$(PCLBINDIR64)\\" + P.mainTarget() + "\"" );
      f.outTextLn( "            AdditionalLibraryDirectories=\"" + libraryDirectories64 + "\"" );
      if ( P.isExecutable() && P.uacAdmin )
         f.outTextLn( "            UACExecutionLevel=\"2\"" ); // 0=asInvoker (default), 2=requireAdministrator
      f.outTextLn( "            ModuleDefinitionFile=\"" + P.winDefFile + "\"" );
      f.outTextLn( "            SubSystem=\"2\"" );
      f.outTextLn( "            LargeAddressAware=\"2\"" );
      if ( P.isModule() || P.isExecutable() )
         f.outTextLn( "            ImportLibrary=\"$(SolutionDir)$(PlatformName)\\$(ConfigurationName)\\$(ProjectName).lib\"" );
      else
         f.outTextLn( "            ImportLibrary=\"$(PCLLIBDIR64)\\$(ProjectName)-pxi.lib\"" );
      f.outTextLn( "            TargetMachine=\"17\"" );
      f.outTextLn( "            GenerateDebugInformation=\"true\"" );
      f.outTextLn( "         />" );
   }
   f.outTextLn( "      </Configuration>" );
   f.outTextLn( "   </Configurations>" );

   /*
    * Files
    */

#define PREPARE_FILE_ITERATION                           \
   var prefix = File.unixPathToWindows( s.directory );   \
   var indent = "         ";                             \
   if ( s.directory.length > 0 )                         \
   {                                                     \
      prefix += '\\';                                    \
      indent += "   ";                                   \
      outFilterTagFromDirectory( f, s.directory );       \
   }

   f.outTextLn( "   <Files>" );
   f.outTextLn( "      <Filter" );
   f.outTextLn( "         Name=\"Source Files\"" );
   f.outTextLn( "         Filter=\"cpp;c;cc;cxx;def;odl;idl;hpj;bat;asm;asmx\"" );
   f.outTextLn( "         UniqueIdentifier=\"{4FC737F1-C7A5-4376-A066-2A32D752A2FF}\"" );
   f.outTextLn( "      >" );

   for ( var i = 0; i < F.sources.length; ++i )
   {
      var s = F.sources[i];
      if ( s.hasSourceFiles() )
      {
         PREPARE_FILE_ITERATION
         for ( var j = 0; j < s.files.length; ++j )
            if ( P.isSourceFile( s.files[j] ) )
               outFileTag( f, indent, prefix, s.files[j] );
         if ( s.directory.length > 0 )
            outCloseFilterTagFromDirectory( f );
      }
   }

   f.outTextLn( "      </Filter>" );
   f.outTextLn( "      <Filter" );
   f.outTextLn( "         Name=\"Header Files\"" );
   f.outTextLn( "         Filter=\"h;hpp;hxx;hm;inl;inc;xsd\"" );
   f.outTextLn( "         UniqueIdentifier=\"{93995380-89BD-4b04-88EB-625FBE52EBFB}\"" );
   f.outTextLn( "      >" );

   for ( var i = 0; i < F.sources.length; ++i )
   {
      var s = F.sources[i];
      if ( s.hasHeaderFiles() )
      {
         PREPARE_FILE_ITERATION
         for ( var j = 0; j < s.files.length; ++j )
            if ( isHeaderFile( s.files[j] ) )
               outFileTag( f, indent, prefix, s.files[j] );
         if ( s.directory.length > 0 )
            outCloseFilterTagFromDirectory( f );
      }
   }

   f.outTextLn( "      </Filter>" );
   f.outTextLn( "      <Filter" );
   f.outTextLn( "         Name=\"Resource Files\"" );
   f.outTextLn( "         Filter=\"rc;ico;cur;bmp;dlg;rc2;rct;bin;rgs;gif;jpg;jpeg;jpe;resx;tiff;tif;png;wav\"" );
   f.outTextLn( "         UniqueIdentifier=\"{67DA6AB6-F800-4c08-8B7A-83BB121AAD01}\"" );
   f.outTextLn( "      >" );

   for ( var i = 0; i < F.sources.length; ++i )
   {
      var s = F.sources[i];
      if ( s.hasResourceFiles() )
      {
         PREPARE_FILE_ITERATION
         for ( var j = 0; j < s.files.length; ++j )
            if ( isResourceFile( s.files[j] ) )
               outFileTag( f, indent, prefix, s.files[j] );
         if ( s.directory.length > 0 )
            outCloseFilterTagFromDirectory( f );
      }
   }

   f.outTextLn( "      </Filter>" );

   if ( F.imgFileCount > 0 )
   {
      f.outTextLn( "      <Filter Name=\"Image Files\">" );

      for ( var i = 0; i < F.sources.length; ++i )
      {
         var s = F.sources[i];
         if ( s.hasImageFiles() )
         {
            PREPARE_FILE_ITERATION
            for ( var j = 0; j < s.files.length; ++j )
               if ( isImageFile( s.files[j] ) )
                  outFileTag( f, indent, prefix, s.files[j] );
            if ( s.directory.length > 0 )
               outCloseFilterTagFromDirectory( f );
         }
      }

      f.outTextLn( "      </Filter>" );
   }

   if ( P.isExecutable() || P.isCore() || P.isCoreAux() )
      outFileTag( f, "      ", "", "resource" );

   f.outTextLn( "   </Files>" );
   f.outTextLn( "   <Globals>" );
   f.outTextLn( "   </Globals>" );
   f.outTextLn( "</VisualStudioProject>" );

   f.flush();
   f.close();
}

// ----------------------------------------------------------------------------
// EOF MakGenMSVC9Projects.js - Released 2015/11/26 08:53:10 UTC
