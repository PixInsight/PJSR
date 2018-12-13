// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// MakGenMSVC1xProjects.js - Released 2018-12-13T19:20:07Z
// ----------------------------------------------------------------------------
//
// This file is part of PixInsight Makefile Generator Script version 1.108
//
// Copyright (c) 2009-2018 Pleiades Astrophoto S.L.
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
 * Copyright (c) 2009-2018, Pleiades Astrophoto S.L. All Rights Reserved.
 * Written by Juan Conejero (PTeam)
 *
 * Generation of project files for Microsoft Visual C++ 2010, 2012 and 2013
 * (.vcxproj files).
 */

/*
 * Microsoft Visual C++ 2010 project (.vcxproj)
 */
function MSVCxx10( F, P )
{
   MSVCxx( F, P, 10 );
}

/*
 * Microsoft Visual C++ 2012 project (.vcxproj)
 */
function MSVCxx11( F, P )
{
   MSVCxx( F, P, 11 );
}

/*
 * Microsoft Visual C++ 2013 project (.vcxproj)
 */
function MSVCxx12( F, P )
{
   MSVCxx( F, P, 12 );
}

/*
 * Microsoft Visual C++ 2015 project (.vcxproj)
 */
function MSVCxx14( F, P )
{
   MSVCxx( F, P, 14 );
}

/*
 * Microsoft Visual C++ 2017 project (.vcxproj)
 */
function MSVCxx15( F, P )
{
   MSVCxx( F, P, 15 );
}

/*
 * Microsoft Visual C++ 2010/2012/2013/2015/2017 project (.vcxproj)
 */
function MSVCxx( F, P, vcVersion )
{
   function outSourceFileTag( f, indent, prefix, file )
   {
      f.outTextLn( indent + "<ClCompile Include=\"..\\..\\" + prefix + file + "\"/>" );
   }

   function outSourceFileFilterTag( f, indent, prefix, file )
   {
      f.outTextLn( indent + "<ClCompile Include=\"..\\..\\" + prefix + file + "\">" );
      f.outTextLn( indent + "    <Filter>Source Files</Filter>" );
      f.outTextLn( indent + "</ClCompile>" );
   }

   function outHeaderFileTag( f, indent, prefix, file )
   {
      f.outTextLn( indent + "<ClInclude Include=\"..\\..\\" + prefix + file + "\"/>" );
   }

   function outHeaderFileFilterTag( f, indent, prefix, file )
   {
      f.outTextLn( indent + "<ClInclude Include=\"..\\..\\" + prefix + file + "\">" );
      f.outTextLn( indent + "    <Filter>Header Files</Filter>" );
      f.outTextLn( indent + "</ClInclude>" );
   }

   function outResourceFileTag( f, indent, prefix, file )
   {
      f.outTextLn( indent + "<ResourceCompile Include=\"..\\..\\" + prefix + file + "\"/>" );
   }

   function outResourceFileFilterTag( f, indent, prefix, file )
   {
      f.outTextLn( indent + "<ResourceCompile Include=\"..\\..\\" + prefix + file + "\">" );
      f.outTextLn( indent + "    <Filter>Resource Files</Filter>" );
      f.outTextLn( indent + "</ResourceCompile>" );
   }

   function outImageFileTag( f, indent, prefix, file )
   {
      f.outTextLn( indent + "<None Include=\"..\\..\\" + prefix + file + "\"/>" );
   }

   function outImageFileFilterTag( f, indent, prefix, file )
   {
      f.outTextLn( indent + "<None Include=\"..\\..\\" + prefix + file + "\">" );
      f.outTextLn( indent + "    <Filter>Image Files</Filter>" );
      f.outTextLn( indent + "</None>" );
   }

   let vcYear;
   let toolsVersion;
   let platformToolset32;
   let platformToolset64;
   let projectGUID = UUID().toUpperCase();
   switch ( vcVersion )
   {
   case 10:
      vcYear = "2010";
      toolsVersion = "4.0";
      platformToolset32 = "v100";
      platformToolset64 = "v100";
      break;
   case 11:
      vcYear = "2012";
      toolsVersion = "4.0";
      platformToolset32 = "v110_xp"; // see: http://blogs.msdn.com/b/vcblog/archive/2012/10/08/10357555.aspx
      platformToolset64 = "v110";
      break;
   case 12:
      vcYear = "2013";
      toolsVersion = "12.0";
      platformToolset32 = "v120_xp";
      platformToolset64 = "v120";
      break;
   case 14:
      vcYear = "2015";
      toolsVersion = "14.0";
      platformToolset32 = "v140_xp";
      platformToolset64 = "v140";
      break;
   case 15:
      vcYear = "2017";
      toolsVersion = "15.0";
      platformToolset32 = "v141_xp";
      platformToolset64 = "v141";
      break;
   default:
      throw new Error( "Internal error: Invalid/unsupported Visual C++ compiler version: " + vcVersion.toString() );
   }

   P.validate();
   P.validateMSVCxxBuild();

   let buildDirectory = P.vccBuildDirectory( F.baseDirectory, vcVersion );
   if ( P.cleanUpPreviousBuilds )
      if ( File.directoryExists( buildDirectory ) )
         removeDirectory( buildDirectory );

   let projectPath = buildDirectory + '/' + P.vccProject( vcVersion );

   console.writeln( "<end><cbr><br>==> Generating VC++ " + vcYear + " project file:" );
   console.writeln( projectPath );
   console.flush();

   createDirectoryIfNotExists( buildDirectory + "/Win32/Release", true );
   createDirectoryIfNotExists( buildDirectory + "/x64/Release", true );
   createDirectoryIfNotExists( buildDirectory + "/Win32/Debug", true );
   createDirectoryIfNotExists( buildDirectory + "/x64/Debug", true );

   let includeDirectories = "$(PCLINCDIR);$(PCLSRCDIR)/3rdparty";
   let includeDirectories32 = "";
   let includeDirectories64 = "";
   let dependsOnQt = P.isCore() || P.isCoreAux() || (P.isModule() || P.isDynamicLibrary() || P.isExecutable()) && P.dependsOnQt();
   if ( dependsOnQt )
      includeDirectories += ";$(QTDIR)/qtbase/include" +
                            ";$(QTDIR)/qtbase/include/QtCore" +
                            ";$(QTDIR)/qtbase/include/QtANGLE";
   if ( P.isCore() )
   {
      includeDirectories += ";$(QTDIR)/qtsvg/include" +
                            ";$(QTDIR)/qtwebchannel/include" +
                            ";$(QTDIR)/qtwebengine/include" +
                            ";$(QTDIR)/qtwebengine/include/QtWebEngineWidgets" +
                            ";$(QTDIR)/qtdeclarative/include" +
                            ";$(QTDIR)/qtlocation/include" +
                            ";$(PCLSRCDIR)/core/Components" +
                            ";$(PCLSRCDIR)/core";

      includeDirectories32 = ";$(PCLINCDIR)/js/windows/x86"; // SpiderMonkey
      includeDirectories64 = ";$(PCLINCDIR)/js/windows/x64"; // ..
   }
   if ( dependsOnQt )
      includeDirectories += ";$(QTDIR)/qtwinextras/include;$(QTDIR)/qtbase/mkspecs/win32-msvc" + vcYear;
   if ( !P.isCore() )
   {
      for ( let i = 0; i < P.extraIncludeDirs.length; ++i )
         includeDirectories += ";" + P.extraIncludeDirs[i];
   }
   includeDirectories = File.unixPathToWindows( includeDirectories );

   let preprocessorDefinitions = "WIN32;WIN64;_WINDOWS;UNICODE;__PCL_WINDOWS;__PCL_NO_WIN32_MINIMUM_VERSIONS";
   if ( P.isCore() )
   {
      preprocessorDefinitions += ";__PCL_BUILDING_PIXINSIGHT_APPLICATION" +
                                 ";__PCL_QT_INTERFACE" +
                                 ";XP_WIN" + // SpiderMonkey
                                 ";CURL_STATICLIB" +
                                 ";QT_EDITION=QT_EDITION_OPENSOURCE" +
                                 ";QT_SHARED" +
                                 ";QT_NO_EXCEPTIONS" +
                                 ";QT_NO_DEBUG";
   }
   else
   {
      if ( P.isCoreAux() )
         preprocessorDefinitions += ";__PCL_QT_INTERFACE" +
                                    ";QT_EDITION=QT_EDITION_OPENSOURCE" +
                                    ";QT_SHARED" +
                                    ";QT_NO_EXCEPTIONS" +
                                    ";QT_NO_DEBUG";

      for ( let i = 0; i < P.extraDefinitions.length; ++i )
         preprocessorDefinitions += ";" + P.extraDefinitions[i];
      for ( let i = 0; i < P.winExtraDefinitions.length; ++i )
         preprocessorDefinitions += ";" + P.winExtraDefinitions[i];
   }

   let diagnosticsDefinition = (P.diagnostics != 0) ? ";__PCL_DIAGNOSTICS_LEVEL=" + P.diagnostics.toString() : "";

   let libraryDirectories32 = "$(PCLLIBDIR32)";
   let libraryDirectories64 = "$(PCLLIBDIR64)";
   if ( P.isCore() || P.isCoreAux() || P.dependsOnQt() )
   {
      libraryDirectories32 += ";$(QTDIR32)/qtbase/lib";
      libraryDirectories64 += ";$(QTDIR64)/qtbase/lib";
   }
   if ( !P.isCore() )
      for ( let i = 0; i < P.extraLibDirs.length; ++i )
      {
         libraryDirectories32 += ";" + P.extraLibDirs[i] + "\\x86";
         libraryDirectories64 += ";" + P.extraLibDirs[i] + "\\x64";
      }
   libraryDirectories32 = File.unixPathToWindows( libraryDirectories32 );
   libraryDirectories64 = File.unixPathToWindows( libraryDirectories64 );

   let windowsLibraries = ";kernel32.lib" +
                          ";user32.lib" +
                          ";gdi32.lib" +
                          ";winspool.lib" +
                          ";comdlg32.lib" +
                          ";advapi32.lib" +
                          ";shell32.lib" +
                          ";ole32.lib" +
                          ";oleaut32.lib" +
                          ";uuid.lib" +
                          ";odbc32.lib" +
                          ";odbccp32.lib" +
                          ";userenv.lib" +
                          ";imm32.lib" +
                          ";shlwapi.lib" +
                          ";ws2_32.lib" +
                          ";wldap32.lib" +
                          ";mscms.lib" +
                          ";winmm.lib" +
                          ";crypt32.lib";

   let libraries = "";

   if ( P.isCore() )
   {
      libraries = "qtmain.lib" +
                  ";Qt5UiTools.lib" +
                  ";Qt5Sensors.lib" +
                  ";Qt5Positioning.lib" +
                  ";Qt5MultimediaWidgets.lib" +
                  ";Qt5Multimedia.lib" +
                  ";Qt5OpenGL.lib" +
                  ";Qt5Sql.lib" +
                  ";Qt5Qml.lib" +
                  ";Qt5Quick.lib" +
                  ";Qt5WebChannel.lib" +
                  ";Qt5WebEngine.lib" +
                  ";Qt5WebEngineCore.lib" +
                  ";Qt5WebEngineWidgets.lib" +
                  ";Qt5PrintSupport.lib" +
                  ";Qt5WinExtras.lib" +
                  ";Qt5Widgets.lib" +
                  ";Qt5Gui.lib" +
                  ";Qt5Svg.lib" +
                  ";Qt5Xml.lib" +
                  ";Qt5Network.lib" +
                  ";Qt5Core.lib" +
                  ";libEGL.lib" +
                  ";libGLESv2.lib" +
                  ";mozjs" + CORE_JS_ENGINE_VERSION + ".lib" +
                  ";PCL-pxi.lib" +
                  ";lz4-pxi.lib" +
                  ";zlib-pxi.lib" +
                  ";RFC6234-pxi.lib" +
                  ";curl-pxi.lib" +
                  ";lcms-pxi.lib" +
                  ";cminpack-pxi.lib" +
                  windowsLibraries;
   }
   else
   {
      if ( P.isCoreAux() )
         libraries = "qtmain.lib" +
                     ";Qt5Widgets.lib" +
                     ";Qt5Gui.lib" +
                     ";Qt5Svg.lib" +
                     ";Qt5Core.lib" +
                     ";libEGL.lib" +
                     ";libGLESv2.lib" +
                     ";PCL-pxi.lib" +
                     ";lz4-pxi.lib" +
                     ";zlib-pxi.lib" +
                     ";RFC6234-pxi.lib" +
                     windowsLibraries;

      if ( P.isModule() || P.isExecutable() )
         libraries = "PCL-pxi.lib" +
                     ";lz4-pxi.lib" +
                     ";zlib-pxi.lib" +
                     ";RFC6234-pxi.lib" +
                     ";lcms-pxi.lib" +
                     ";cminpack-pxi.lib" +
                     windowsLibraries;

      for ( let i = 0; i < P.extraLibraries.length; ++i )
      {
         // Make sure that all libraries carry the .lib suffix on Windows.
         let extraLib = P.extraLibraries[i];
         if ( File.extractExtension( extraLib ).length == 0 )
            extraLib += ".lib";
         libraries += ";" + extraLib;
      }
   }

   let configurationType = (P.isModule() || P.isDynamicLibrary()) ? "DynamicLibrary" :
                           (P.isStaticLibrary() ? "StaticLibrary" : "Application");

   let outDir32 = P.isStaticLibrary() ? "$(PCLLIBDIR32)\\" : "$(PCLBINDIR32)\\"
   let outDir64 = P.isStaticLibrary() ? "$(PCLLIBDIR64)\\" : "$(PCLBINDIR64)\\"

   let targetName = File.extractName( P.mainTarget() );

   let wholeProgramOptimization = P.isModule() || P.isDynamicLibrary();

   /*
    * Project file generation
    */

   let f = new File;
   f.createForWriting( projectPath );

   MSVCxxHeader( f, F, P, vcVersion );

   f.outTextLn( "<Project DefaultTargets=\"Build\" ToolsVersion=\"" + toolsVersion + "\" xmlns=\"http:\/\/schemas.microsoft.com/developer/msbuild/2003\">" );
   f.outTextLn( "  <ItemGroup Label=\"ProjectConfigurations\">" );
   f.outTextLn( "    <ProjectConfiguration Include=\"Release|x64\">" );
   f.outTextLn( "      <Configuration>Release</Configuration>" );
   f.outTextLn( "      <Platform>x64</Platform>" );
   f.outTextLn( "    </ProjectConfiguration>" );
   f.outTextLn( "    <ProjectConfiguration Include=\"Release|Win32\">" );
   f.outTextLn( "      <Configuration>Release</Configuration>" );
   f.outTextLn( "      <Platform>Win32</Platform>" );
   f.outTextLn( "    </ProjectConfiguration>" );
   f.outTextLn( "    <ProjectConfiguration Include=\"Debug|x64\">" );
   f.outTextLn( "      <Configuration>Debug</Configuration>" );
   f.outTextLn( "      <Platform>x64</Platform>" );
   f.outTextLn( "    </ProjectConfiguration>" );
   f.outTextLn( "    <ProjectConfiguration Include=\"Debug|Win32\">" );
   f.outTextLn( "      <Configuration>Debug</Configuration>" );
   f.outTextLn( "      <Platform>Win32</Platform>" );
   f.outTextLn( "    </ProjectConfiguration>" );
   f.outTextLn( "  </ItemGroup>" );
   f.outTextLn( "  <PropertyGroup Label=\"Globals\">" );
   f.outTextLn( "    <ProjectGuid>{" + projectGUID + "}</ProjectGuid>" );
   f.outTextLn( "    <RootNamespace>PixInsight</RootNamespace>" );
   f.outTextLn( "    <Keyword>Win32Proj</Keyword>" );
   f.outTextLn( "  </PropertyGroup>" );
   f.outTextLn( "  <Import Project=\"$(VCTargetsPath)\Microsoft.Cpp.Default.props\" />" );
   f.outTextLn( "  <PropertyGroup Condition=\"'$(Configuration)|$(Platform)'=='Release|x64'\" Label=\"Configuration\">" );
   f.outTextLn( "    <ConfigurationType>" + configurationType + "</ConfigurationType>" );
   f.outTextLn( "    <CharacterSet>Unicode</CharacterSet>" );
   f.outTextLn( "    <WholeProgramOptimization>true</WholeProgramOptimization>" );
   f.outTextLn( "    <PlatformToolset>" + platformToolset64 + "</PlatformToolset>" );
   f.outTextLn( "  </PropertyGroup>" );
   f.outTextLn( "  <PropertyGroup Condition=\"'$(Configuration)|$(Platform)'=='Release|Win32'\" Label=\"Configuration\">" );
   f.outTextLn( "    <ConfigurationType>" + configurationType + "</ConfigurationType>" );
   f.outTextLn( "    <CharacterSet>Unicode</CharacterSet>" );
   f.outTextLn( "    <WholeProgramOptimization>true</WholeProgramOptimization>" );
   f.outTextLn( "    <PlatformToolset>" + platformToolset32 + "</PlatformToolset>" );
   f.outTextLn( "  </PropertyGroup>" );
   f.outTextLn( "  <PropertyGroup Condition=\"'$(Configuration)|$(Platform)'=='Debug|x64'\" Label=\"Configuration\">" );
   f.outTextLn( "    <ConfigurationType>" + configurationType + "</ConfigurationType>" );
   f.outTextLn( "    <CharacterSet>Unicode</CharacterSet>" );
   f.outTextLn( "    <PlatformToolset>" + platformToolset64 + "</PlatformToolset>" );
   f.outTextLn( "  </PropertyGroup>" );
   f.outTextLn( "  <PropertyGroup Condition=\"'$(Configuration)|$(Platform)'=='Debug|Win32'\" Label=\"Configuration\">" );
   f.outTextLn( "    <ConfigurationType>" + configurationType + "</ConfigurationType>" );
   f.outTextLn( "    <CharacterSet>Unicode</CharacterSet>" );
   f.outTextLn( "    <PlatformToolset>" + platformToolset32 + "</PlatformToolset>" );
   f.outTextLn( "  </PropertyGroup>" );
   f.outTextLn( "  <Import Project=\"$(VCTargetsPath)\\Microsoft.Cpp.props\" />" );
   f.outTextLn( "  <ImportGroup Label=\"ExtensionSettings\">" );
   f.outTextLn( "  </ImportGroup>" );
   f.outTextLn( "  <ImportGroup Condition=\"'$(Configuration)|$(Platform)'=='Release|x64'\" Label=\"PropertySheets\">" );
   f.outTextLn( "    <Import Project=\"$(UserRootDir)\\Microsoft.Cpp.$(Platform).user.props\" Condition=\"exists('$(UserRootDir)\\Microsoft.Cpp.$(Platform).user.props')\" Label=\"LocalAppDataPlatform\" />" );
   f.outTextLn( "  </ImportGroup>" );
   f.outTextLn( "  <ImportGroup Condition=\"'$(Configuration)|$(Platform)'=='Release|Win32'\" Label=\"PropertySheets\">" );
   f.outTextLn( "    <Import Project=\"$(UserRootDir)\\Microsoft.Cpp.$(Platform).user.props\" Condition=\"exists('$(UserRootDir)\\Microsoft.Cpp.$(Platform).user.props')\" Label=\"LocalAppDataPlatform\" />" );
   f.outTextLn( "  </ImportGroup>" );
   f.outTextLn( "  <ImportGroup Condition=\"'$(Configuration)|$(Platform)'=='Debug|x64'\" Label=\"PropertySheets\">" );
   f.outTextLn( "    <Import Project=\"$(UserRootDir)\\Microsoft.Cpp.$(Platform).user.props\" Condition=\"exists('$(UserRootDir)\\Microsoft.Cpp.$(Platform).user.props')\" Label=\"LocalAppDataPlatform\" />" );
   f.outTextLn( "  </ImportGroup>" );
   f.outTextLn( "  <ImportGroup Condition=\"'$(Configuration)|$(Platform)'=='Debug|Win32'\" Label=\"PropertySheets\">" );
   f.outTextLn( "    <Import Project=\"$(UserRootDir)\\Microsoft.Cpp.$(Platform).user.props\" Condition=\"exists('$(UserRootDir)\\Microsoft.Cpp.$(Platform).user.props')\" Label=\"LocalAppDataPlatform\" />" );
   f.outTextLn( "  </ImportGroup>" );
   f.outTextLn( "  <PropertyGroup Label=\"UserMacros\" />" );
   f.outTextLn( "  <PropertyGroup>" );
   f.outTextLn( "    <_ProjectFileVersion>10.0.40219.1</_ProjectFileVersion>" );
   f.outTextLn( "    <OutDir Condition=\"'$(Configuration)|$(Platform)'=='Release|x64'\">" + outDir64 + "</OutDir>" );
   f.outTextLn( "    <IntDir Condition=\"'$(Configuration)|$(Platform)'=='Release|x64'\">$(Platform)\\$(Configuration)\\</IntDir>" );
   f.outTextLn( "    <OutDir Condition=\"'$(Configuration)|$(Platform)'=='Release|Win32'\">" + outDir32 + "</OutDir>" );
   f.outTextLn( "    <IntDir Condition=\"'$(Configuration)|$(Platform)'=='Release|Win32'\">$(Platform)\\$(Configuration)\\</IntDir>" );
   f.outTextLn( "    <OutDir Condition=\"'$(Configuration)|$(Platform)'=='Debug|x64'\">" + outDir64 + "</OutDir>" );
   f.outTextLn( "    <IntDir Condition=\"'$(Configuration)|$(Platform)'=='Debug|x64'\">$(Platform)\\$(Configuration)\\</IntDir>" );
   f.outTextLn( "    <OutDir Condition=\"'$(Configuration)|$(Platform)'=='Debug|Win32'\">" + outDir32 + "</OutDir>" );
   f.outTextLn( "    <IntDir Condition=\"'$(Configuration)|$(Platform)'=='Debug|Win32'\">$(Platform)\\$(Configuration)\\</IntDir>" );
   f.outTextLn( "    <TargetName Condition=\"'$(Configuration)|$(Platform)'=='Release|x64'\">" + targetName + "</TargetName>" );
   f.outTextLn( "    <TargetName Condition=\"'$(Configuration)|$(Platform)'=='Release|Win32'\">" + targetName + "</TargetName>" );
   f.outTextLn( "    <TargetName Condition=\"'$(Configuration)|$(Platform)'=='Debug|x64'\">" + targetName + "</TargetName>" );
   f.outTextLn( "    <TargetName Condition=\"'$(Configuration)|$(Platform)'=='Debug|Win32'\">" + targetName + "</TargetName>" );
   if ( P.isExecutable() || P.isCore() || P.isCoreAux() )
   {
      f.outTextLn( "    <IgnoreImportLibrary Condition=\"'$(Configuration)|$(Platform)'=='Release|x64'\">true</IgnoreImportLibrary>" );
      f.outTextLn( "    <IgnoreImportLibrary Condition=\"'$(Configuration)|$(Platform)'=='Release|Win32'\">true</IgnoreImportLibrary>" );
      f.outTextLn( "    <IgnoreImportLibrary Condition=\"'$(Configuration)|$(Platform)'=='Debug|x64'\">true</IgnoreImportLibrary>" );
      f.outTextLn( "    <IgnoreImportLibrary Condition=\"'$(Configuration)|$(Platform)'=='Debug|Win32'\">true</IgnoreImportLibrary>" );
   }
   f.outTextLn( "  </PropertyGroup>" );
   f.outTextLn( "  <ItemDefinitionGroup Condition=\"'$(Configuration)|$(Platform)'=='Release|x64'\">" );
   f.outTextLn( "    <Midl>" );
   f.outTextLn( "      <TargetEnvironment>X64</TargetEnvironment>" );
   f.outTextLn( "    </Midl>" );
   f.outTextLn( "    <ClCompile>" );
   f.outTextLn( "      <Optimization>MaxSpeed</Optimization>" );
   f.outTextLn( "      <InlineFunctionExpansion>AnySuitable</InlineFunctionExpansion>" );
   f.outTextLn( "      <IntrinsicFunctions>true</IntrinsicFunctions>" );
   f.outTextLn( "      <FavorSizeOrSpeed>Speed</FavorSizeOrSpeed>" );
   f.outTextLn( "      <OmitFramePointers>true</OmitFramePointers>" );
   f.outTextLn( "      <WholeProgramOptimization>" + (wholeProgramOptimization ? "true" : "false") + "</WholeProgramOptimization>" );
   f.outTextLn( "      <AdditionalIncludeDirectories>" + includeDirectories + includeDirectories64 + ";%(AdditionalIncludeDirectories)</AdditionalIncludeDirectories>" );
   f.outTextLn( "      <PreprocessorDefinitions>" + preprocessorDefinitions + ";_NDEBUG;%(PreprocessorDefinitions)</PreprocessorDefinitions>" );
   f.outTextLn( "      <StringPooling>true</StringPooling>" );
   f.outTextLn( "      <ExceptionHandling>Async</ExceptionHandling>" );
   f.outTextLn( "      <RuntimeLibrary>MultiThreadedDLL</RuntimeLibrary>" );
   f.outTextLn( "      <BufferSecurityCheck>false</BufferSecurityCheck>" );
   f.outTextLn( "      <FunctionLevelLinking>false</FunctionLevelLinking>" );
   // SSE2 is the default for x64 - The VC++ x64 compiler complains about /arch:SSE2
   //f.outTextLn( "      <EnableEnhancedInstructionSet>StreamingSIMDExtensions2</EnableEnhancedInstructionSet>" );
   f.outTextLn( "      <FloatingPointModel>Precise</FloatingPointModel>" );
   f.outTextLn( "      <PrecompiledHeader></PrecompiledHeader>" );
   f.outTextLn( "      <WarningLevel>Level3</WarningLevel>" );
   f.outTextLn( "      <DebugInformationFormat></DebugInformationFormat>" );
   f.outTextLn( "      <MultiProcessorCompilation>true</MultiProcessorCompilation>" );
   f.outTextLn( "      <RuntimeTypeInfo>true</RuntimeTypeInfo>" );
   f.outTextLn( "    </ClCompile>" );

   if ( P.isStaticLibrary() )
   {
      f.outTextLn( "    <Lib>" );
      f.outTextLn( "      <OutputFile>$(PCLLIBDIR64)\\" + P.mainTarget() + "</OutputFile>" );
      f.outTextLn( "    </Lib>" );
   }
   else
   {
      f.outTextLn( "    <Link>" );
      f.outTextLn( "      <AdditionalDependencies>" + libraries + ";%(AdditionalDependencies)</AdditionalDependencies>" );
      f.outTextLn( "      <OutputFile>$(PCLBINDIR64)\\" + P.mainTarget() + "</OutputFile>" );
      f.outTextLn( "      <AdditionalLibraryDirectories>" + libraryDirectories64 + ";%(AdditionalLibraryDirectories)</AdditionalLibraryDirectories>" );
      if ( P.isExecutable() && P.uacAdmin )
         f.outTextLn( "      <UACExecutionLevel>RequireAdministrator</UACExecutionLevel>" );
      f.outTextLn( "      <ModuleDefinitionFile>" + P.winDefFile + "</ModuleDefinitionFile>" );
      f.outTextLn( "      <DelayLoadDLLs>%(DelayLoadDLLs)</DelayLoadDLLs>" );
      f.outTextLn( "      <SubSystem>Windows</SubSystem>" );
      f.outTextLn( "      <LargeAddressAware>true</LargeAddressAware>" );
      f.outTextLn( "      <LinkTimeCodeGeneration>" + (wholeProgramOptimization ? "UseLinkTimeCodeGeneration" : "") + "</LinkTimeCodeGeneration>" );
      f.outTextLn( "      <SupportUnloadOfDelayLoadedDLL>true</SupportUnloadOfDelayLoadedDLL>" );
      if ( P.isModule() || P.isExecutable() )
         f.outTextLn( "      <ImportLibrary>$(Platform)\\$(Configuration)\\$(ProjectName).lib</ImportLibrary>" );
      else
         f.outTextLn( "      <ImportLibrary>$(PCLLIBDIR64)\\$(ProjectName)-pxi.lib</ImportLibrary>" );
      f.outTextLn( "      <TargetMachine>MachineX64</TargetMachine>" );
      f.outTextLn( "      <GenerateDebugInformation>false</GenerateDebugInformation>" );
      if ( P.isCore() )
      {
         f.outTextLn( "      <StackReserveSize>8388608</StackReserveSize>" );
         f.outTextLn( "      <HeapReserveSize>8388608</HeapReserveSize>" );
      }
      f.outTextLn( "    </Link>" );

      if ( P.isCore() || P.isCoreAux() || P.isOfficialModule() || P.isOfficialExecutable() || P.isOfficialDynamicLibrary() ||
           P.signed && (P.isModule() || P.isExecutable() || P.isDynamicLibrary()) )
      {
         f.outTextLn( "    <PostBuildEvent>" );
         f.outTextLn( "      <Command>signtool.exe sign /a /t http://timestamp.verisign.com/scripts/timstamp.dll /v $(TargetDir)$(TargetFileName)</Command>" );
         f.outTextLn( "    </PostBuildEvent>" );
      }
   }

   f.outTextLn( "  </ItemDefinitionGroup>" );
   f.outTextLn( "  <ItemDefinitionGroup Condition=\"'$(Configuration)|$(Platform)'=='Release|Win32'\">" );
   f.outTextLn( "    <ClCompile>" );
   f.outTextLn( "      <Optimization>MaxSpeed</Optimization>" );
   f.outTextLn( "      <InlineFunctionExpansion>AnySuitable</InlineFunctionExpansion>" );
   f.outTextLn( "      <IntrinsicFunctions>true</IntrinsicFunctions>" );
   f.outTextLn( "      <FavorSizeOrSpeed>Speed</FavorSizeOrSpeed>" );
   f.outTextLn( "      <OmitFramePointers>true</OmitFramePointers>" );
   f.outTextLn( "      <WholeProgramOptimization>" + (wholeProgramOptimization ? "true" : "false") + "</WholeProgramOptimization>" );
   f.outTextLn( "      <AdditionalIncludeDirectories>" + includeDirectories + includeDirectories32 + ";%(AdditionalIncludeDirectories)</AdditionalIncludeDirectories>" );
   f.outTextLn( "      <PreprocessorDefinitions>" + preprocessorDefinitions + ";_NDEBUG;%(PreprocessorDefinitions)</PreprocessorDefinitions>" );
   f.outTextLn( "      <StringPooling>true</StringPooling>" );
   f.outTextLn( "      <ExceptionHandling>Async</ExceptionHandling>" );
   f.outTextLn( "      <RuntimeLibrary>MultiThreadedDLL</RuntimeLibrary>" );
   f.outTextLn( "      <BufferSecurityCheck>false</BufferSecurityCheck>" );
   f.outTextLn( "      <FunctionLevelLinking>false</FunctionLevelLinking>" );
   f.outTextLn( "      <EnableEnhancedInstructionSet>StreamingSIMDExtensions2</EnableEnhancedInstructionSet>" );
   f.outTextLn( "      <FloatingPointModel>Precise</FloatingPointModel>" );
   f.outTextLn( "      <PrecompiledHeader></PrecompiledHeader>" );
   f.outTextLn( "      <WarningLevel>Level3</WarningLevel>" );
   f.outTextLn( "      <DebugInformationFormat></DebugInformationFormat>" );
   f.outTextLn( "      <MultiProcessorCompilation>true</MultiProcessorCompilation>" );
   f.outTextLn( "      <RuntimeTypeInfo>true</RuntimeTypeInfo>" );
   f.outTextLn( "    </ClCompile>" );

   if ( P.isStaticLibrary() )
   {
      f.outTextLn( "    <Lib>" );
      f.outTextLn( "      <OutputFile>$(PCLLIBDIR32)\\" + P.mainTarget() + "</OutputFile>" );
      f.outTextLn( "    </Lib>" );
   }
   else
   {
      f.outTextLn( "    <Link>" );
      f.outTextLn( "      <AdditionalDependencies>" + libraries + ";%(AdditionalDependencies)</AdditionalDependencies>" );
      f.outTextLn( "      <OutputFile>$(PCLBINDIR32)\\" + P.mainTarget() + "</OutputFile>" );
      f.outTextLn( "      <AdditionalLibraryDirectories>" + libraryDirectories32 + ";%(AdditionalLibraryDirectories)</AdditionalLibraryDirectories>" );
      if ( P.isExecutable() && P.uacAdmin )
         f.outTextLn( "      <UACExecutionLevel>RequireAdministrator</UACExecutionLevel>" );
      f.outTextLn( "      <ModuleDefinitionFile>" + P.winDefFile + "</ModuleDefinitionFile>" );
      f.outTextLn( "      <DelayLoadDLLs>%(DelayLoadDLLs)</DelayLoadDLLs>" );
      f.outTextLn( "      <SubSystem>Windows</SubSystem>" );
      f.outTextLn( "      <LargeAddressAware>true</LargeAddressAware>" );
      f.outTextLn( "      <LinkTimeCodeGeneration>" + (wholeProgramOptimization ? "UseLinkTimeCodeGeneration" : "") + "</LinkTimeCodeGeneration>" );
      f.outTextLn( "      <SupportUnloadOfDelayLoadedDLL>true</SupportUnloadOfDelayLoadedDLL>" );
      if ( P.isModule() || P.isExecutable() )
         f.outTextLn( "      <ImportLibrary>$(Platform)\\$(Configuration)\\$(ProjectName).lib</ImportLibrary>" );
      else
         f.outTextLn( "      <ImportLibrary>$(PCLLIBDIR32)\\$(ProjectName)-pxi.lib</ImportLibrary>" );
      f.outTextLn( "      <TargetMachine>MachineX86</TargetMachine>" );
      f.outTextLn( "      <GenerateDebugInformation>false</GenerateDebugInformation>" );
      if ( P.isCore() )
      {
         f.outTextLn( "      <StackReserveSize>4194304</StackReserveSize>" );
         f.outTextLn( "      <HeapReserveSize>4194304</HeapReserveSize>" );
      }
      f.outTextLn( "    </Link>" );

      if ( P.isCore() || P.isCoreAux() || P.isOfficialModule() || P.isOfficialExecutable() || P.isOfficialDynamicLibrary() ||
           P.signed && (P.isModule() || P.isExecutable() || P.isDynamicLibrary()) )
      {
         f.outTextLn( "    <PostBuildEvent>" );
         f.outTextLn( "      <Command>signtool.exe sign /a /t http://timestamp.verisign.com/scripts/timstamp.dll /v $(TargetDir)$(TargetFileName)</Command>" );
         f.outTextLn( "    </PostBuildEvent>" );
      }
   }

   f.outTextLn( "  </ItemDefinitionGroup>" );
   f.outTextLn( "  <ItemDefinitionGroup Condition=\"'$(Configuration)|$(Platform)'=='Debug|x64'\">" );
   f.outTextLn( "    <Midl>" );
   f.outTextLn( "      <TargetEnvironment>X64</TargetEnvironment>" );
   f.outTextLn( "    </Midl>" );
   f.outTextLn( "    <ClCompile>" );
   f.outTextLn( "      <Optimization>Disabled</Optimization>" );
   f.outTextLn( "      <AdditionalIncludeDirectories>" + includeDirectories + includeDirectories64 + ";%(AdditionalIncludeDirectories)</AdditionalIncludeDirectories>" );
   f.outTextLn( "      <PreprocessorDefinitions>" + preprocessorDefinitions + ";_DEBUG;%(PreprocessorDefinitions)</PreprocessorDefinitions>" );
   f.outTextLn( "      <ExceptionHandling>Async</ExceptionHandling>" );
   f.outTextLn( "      <MinimalRebuild>true</MinimalRebuild>" );
   f.outTextLn( "      <BasicRuntimeChecks>EnableFastChecks</BasicRuntimeChecks>" );
   f.outTextLn( "      <RuntimeLibrary>MultiThreadedDebugDLL</RuntimeLibrary>" );
   f.outTextLn( "      <PrecompiledHeader></PrecompiledHeader>" );
   f.outTextLn( "      <WarningLevel>Level3</WarningLevel>" );
   f.outTextLn( "      <DebugInformationFormat>ProgramDatabase</DebugInformationFormat>" );
   f.outTextLn( "      <MultiProcessorCompilation>true</MultiProcessorCompilation>" );
   f.outTextLn( "      <RuntimeTypeInfo>true</RuntimeTypeInfo>" );
   f.outTextLn( "    </ClCompile>" );

   if ( P.isStaticLibrary() )
   {
      f.outTextLn( "    <Lib>" );
      f.outTextLn( "      <OutputFile>$(PCLLIBDIR64)\\" + P.mainTarget() + "</OutputFile>" );
      f.outTextLn( "    </Lib>" );
   }
   else
   {
      f.outTextLn( "    <Link>" );
      f.outTextLn( "      <AdditionalDependencies>" + libraries + ";%(AdditionalDependencies)</AdditionalDependencies>" );
      f.outTextLn( "      <OutputFile>$(PCLBINDIR64)\\" + P.mainTarget() + "</OutputFile>" );
      f.outTextLn( "      <AdditionalLibraryDirectories>" + libraryDirectories64 + ";%(AdditionalLibraryDirectories)</AdditionalLibraryDirectories>" );
      if ( P.isExecutable() && P.uacAdmin )
         f.outTextLn( "      <UACExecutionLevel>RequireAdministrator</UACExecutionLevel>" );
      f.outTextLn( "      <ModuleDefinitionFile>" + P.winDefFile + "</ModuleDefinitionFile>" );
      f.outTextLn( "      <SubSystem>Windows</SubSystem>" );
      f.outTextLn( "      <LargeAddressAware>true</LargeAddressAware>" );
      if ( P.isModule() || P.isExecutable() )
         f.outTextLn( "      <ImportLibrary>$(Platform)\\$(Configuration)\\$(ProjectName).lib</ImportLibrary>" );
      else
         f.outTextLn( "      <ImportLibrary>$(PCLLIBDIR64)\\$(ProjectName)-pxi.lib</ImportLibrary>" );
      f.outTextLn( "      <TargetMachine>MachineX64</TargetMachine>" );
      f.outTextLn( "      <GenerateDebugInformation>true</GenerateDebugInformation>" );
      if ( P.isCore() )
      {
         f.outTextLn( "      <StackReserveSize>8388608</StackReserveSize>" );
         f.outTextLn( "      <HeapReserveSize>8388608</HeapReserveSize>" );
      }
      f.outTextLn( "    </Link>" );

      if ( P.isCore() || P.isCoreAux() || P.isOfficialModule() || P.isOfficialExecutable() || P.isOfficialDynamicLibrary() ||
           P.signed && (P.isModule() || P.isExecutable() || P.isDynamicLibrary()) )
      {
         f.outTextLn( "    <PostBuildEvent>" );
         f.outTextLn( "      <Command>signtool.exe sign /a /t http://timestamp.verisign.com/scripts/timstamp.dll /v $(TargetDir)$(TargetFileName)</Command>" );
         f.outTextLn( "    </PostBuildEvent>" );
      }
   }

   f.outTextLn( "  </ItemDefinitionGroup>" );
   f.outTextLn( "  <ItemDefinitionGroup Condition=\"'$(Configuration)|$(Platform)'=='Debug|Win32'\">" );
   f.outTextLn( "    <ClCompile>" );
   f.outTextLn( "      <Optimization>Disabled</Optimization>" );
   f.outTextLn( "      <AdditionalIncludeDirectories>" + includeDirectories + includeDirectories32 + ";%(AdditionalIncludeDirectories)</AdditionalIncludeDirectories>" );
   f.outTextLn( "      <PreprocessorDefinitions>" + preprocessorDefinitions + ";_DEBUG;%(PreprocessorDefinitions)</PreprocessorDefinitions>" );
   f.outTextLn( "      <ExceptionHandling>Async</ExceptionHandling>" );
   f.outTextLn( "      <MinimalRebuild>true</MinimalRebuild>" );
   f.outTextLn( "      <BasicRuntimeChecks>EnableFastChecks</BasicRuntimeChecks>" );
   f.outTextLn( "      <RuntimeLibrary>MultiThreadedDebugDLL</RuntimeLibrary>" );
   f.outTextLn( "      <PrecompiledHeader></PrecompiledHeader>" );
   f.outTextLn( "      <WarningLevel>Level3</WarningLevel>" );
   f.outTextLn( "      <DebugInformationFormat>ProgramDatabase</DebugInformationFormat>" );
   f.outTextLn( "      <MultiProcessorCompilation>true</MultiProcessorCompilation>" );
   f.outTextLn( "      <RuntimeTypeInfo>true</RuntimeTypeInfo>" );
   f.outTextLn( "    </ClCompile>" );

   if ( P.isStaticLibrary() )
   {
      f.outTextLn( "    <Lib>" );
      f.outTextLn( "      <OutputFile>$(PCLLIBDIR32)\\" + P.mainTarget() + "</OutputFile>" );
      f.outTextLn( "    </Lib>" );
   }
   else
   {
      f.outTextLn( "    <Link>" );
      f.outTextLn( "      <AdditionalDependencies>" + libraries + ";%(AdditionalDependencies)</AdditionalDependencies>" );
      f.outTextLn( "      <OutputFile>$(PCLBINDIR32)\\" + P.mainTarget() + "</OutputFile>" );
      f.outTextLn( "      <AdditionalLibraryDirectories>" + libraryDirectories32 + ";%(AdditionalLibraryDirectories)</AdditionalLibraryDirectories>" );
      if ( P.isExecutable() && P.uacAdmin )
         f.outTextLn( "      <UACExecutionLevel>RequireAdministrator</UACExecutionLevel>" );
      f.outTextLn( "      <ModuleDefinitionFile>" + P.winDefFile + "</ModuleDefinitionFile>" );
      f.outTextLn( "      <SubSystem>Windows</SubSystem>" );
      f.outTextLn( "      <LargeAddressAware>true</LargeAddressAware>" );
      if ( P.isModule() || P.isExecutable() )
         f.outTextLn( "      <ImportLibrary>$(Platform)\\$(Configuration)\\$(ProjectName).lib</ImportLibrary>" );
      else
         f.outTextLn( "      <ImportLibrary>$(PCLLIBDIR32)\\$(ProjectName)-pxi.lib</ImportLibrary>" );
      f.outTextLn( "      <TargetMachine>MachineX86</TargetMachine>" );
      f.outTextLn( "      <GenerateDebugInformation>true</GenerateDebugInformation>" );
      if ( P.isCore() )
      {
         f.outTextLn( "      <StackReserveSize>4194304</StackReserveSize>" );
         f.outTextLn( "      <HeapReserveSize>4194304</HeapReserveSize>" );
      }
      f.outTextLn( "    </Link>" );

      if ( P.isCore() || P.isCoreAux() || P.isOfficialModule() || P.isOfficialExecutable() || P.isOfficialDynamicLibrary() ||
           P.signed && (P.isModule() || P.isExecutable() || P.isDynamicLibrary()) )
      {
         f.outTextLn( "    <PostBuildEvent>" );
         f.outTextLn( "      <Command>signtool.exe sign /a /t http://timestamp.verisign.com/scripts/timstamp.dll /v $(TargetDir)$(TargetFileName)</Command>" );
         f.outTextLn( "    </PostBuildEvent>" );
      }
   }

   f.outTextLn( "  </ItemDefinitionGroup>" );

   /*
    * Files
    */

#undef PREPARE_FILE_ITERATION
#define PREPARE_FILE_ITERATION                           \
   let prefix = File.unixPathToWindows( s.directory );   \
   let indent = "    ";                                  \
   if ( s.directory.length > 0 )                         \
      prefix += '\\';

   /*
    * Source files
    */
   f.outTextLn( "  <ItemGroup>" );
   for ( let i = 0; i < F.sources.length; ++i )
   {
      let s = F.sources[i];
      if ( s.hasSourceFiles() )
      {
         PREPARE_FILE_ITERATION
         for ( let j = 0; j < s.files.length; ++j )
            if ( P.isSourceFile( s.files[j] ) )
               outSourceFileTag( f, indent, prefix, s.files[j] );
      }
   }
   f.outTextLn( "  </ItemGroup>" );

   /*
    * Header files
    */
   if ( F.hFileCount > 0 )
   {
      f.outTextLn( "  <ItemGroup>" );
      for ( let i = 0; i < F.sources.length; ++i )
      {
         let s = F.sources[i];
         if ( s.hasHeaderFiles() )
         {
            PREPARE_FILE_ITERATION
            for ( let j = 0; j < s.files.length; ++j )
               if ( isHeaderFile( s.files[j] ) )
                  outHeaderFileTag( f, indent, prefix, s.files[j] );
         }
      }
      f.outTextLn( "  </ItemGroup>" );
   }

   /*
    * Resource files
    */
   if ( F.resFileCount > 0 )
   {
      f.outTextLn( "  <ItemGroup>" );
      for ( let i = 0; i < F.sources.length; ++i )
      {
         let s = F.sources[i];
         if ( s.hasResourceFiles() )
         {
            PREPARE_FILE_ITERATION
            for ( let j = 0; j < s.files.length; ++j )
               if ( isResourceFile( s.files[j] ) )
                  outResourceFileTag( f, indent, prefix, s.files[j] );
         }
      }
      f.outTextLn( "  </ItemGroup>" );
   }

   /*
    * Image files
    */
   if ( F.imgFileCount > 0 )
   {
      f.outTextLn( "  <ItemGroup>" );
      for ( let i = 0; i < F.sources.length; ++i )
      {
         let s = F.sources[i];
         if ( s.hasImageFiles() )
         {
            PREPARE_FILE_ITERATION
            for ( let j = 0; j < s.files.length; ++j )
               if ( isImageFile( s.files[j] ) )
                  outImageFileTag( f, indent, prefix, s.files[j] );
         }
      }
      f.outTextLn( "  </ItemGroup>" );
   }

   // The 'resource' thing required for executables
   /*
   if ( P.isExecutable() || P.isCore() || P.isCoreAux() )
   {
      f.outTextLn( "  <ItemGroup>" );
      outImageFileTag( f, "    ", "", "resource" );
      f.outTextLn( "  </ItemGroup>" );
   }
   */

   f.outTextLn( "  <Import Project=\"$(VCTargetsPath)\\Microsoft.Cpp.targets\"/>" );
   f.outTextLn( "  <ImportGroup Label=\"ExtensionTargets\">" );
   f.outTextLn( "  </ImportGroup>" );
   f.outTextLn( "</Project>" );

   f.flush();
   f.close();

   /*
    * Project filters must be specified as a separate XML unit
    */

   f.createForWriting( projectPath + ".filters" );

   MSVCxxHeader( f, F, P, vcVersion );

   f.outTextLn( "<Project DefaultTargets=\"Build\" ToolsVersion=\"4.0\" xmlns=\"http:\/\/schemas.microsoft.com/developer/msbuild/2003\">" );
   f.outTextLn( "  <ItemGroup>" );
   f.outTextLn( "    <Filter Include=\"Source Files\">" );
   f.outTextLn( "      <UniqueIdentifier>" + UUID() + "</UniqueIdentifier>" );
   f.outTextLn( "    </Filter>" );

   if ( F.hFileCount > 0 )
   {
      f.outTextLn( "    <Filter Include=\"Header Files\">" );
   f.outTextLn( "      <UniqueIdentifier>" + UUID() + "</UniqueIdentifier>" );
      f.outTextLn( "    </Filter>" );
   }

   if ( F.resFileCount > 0 )
   {
      f.outTextLn( "    <Filter Include=\"Resource Files\">" );
   f.outTextLn( "      <UniqueIdentifier>" + UUID() + "</UniqueIdentifier>" );
      f.outTextLn( "    </Filter>" );
   }

   if ( F.imgFileCount > 0 )
   {
      f.outTextLn( "    <Filter Include=\"Image Files\">" );
   f.outTextLn( "      <UniqueIdentifier>" + UUID() + "</UniqueIdentifier>" );
      f.outTextLn( "    </Filter>" );
   }

   f.outTextLn( "  </ItemGroup>" );

   /*
    * Source file filters
    */
   f.outTextLn( "  <ItemGroup>" );
   for ( let i = 0; i < F.sources.length; ++i )
   {
      let s = F.sources[i];
      if ( s.hasSourceFiles() )
      {
         PREPARE_FILE_ITERATION
         for ( let j = 0; j < s.files.length; ++j )
            if ( P.isSourceFile( s.files[j] ) )
               outSourceFileFilterTag( f, indent, prefix, s.files[j] );
      }
   }
   f.outTextLn( "  </ItemGroup>" );

   /*
    * Header file filters
    */
   if ( F.hFileCount > 0 )
   {
      f.outTextLn( "  <ItemGroup>" );
      for ( let i = 0; i < F.sources.length; ++i )
      {
         let s = F.sources[i];
         if ( s.hasHeaderFiles() )
         {
            PREPARE_FILE_ITERATION
            for ( let j = 0; j < s.files.length; ++j )
               if ( isHeaderFile( s.files[j] ) )
                  outHeaderFileFilterTag( f, indent, prefix, s.files[j] );
         }
      }
      f.outTextLn( "  </ItemGroup>" );
   }

   /*
    * Resource file filters
    */
   if ( F.resFileCount > 0 )
   {
      f.outTextLn( "  <ItemGroup>" );
      for ( let i = 0; i < F.sources.length; ++i )
      {
         let s = F.sources[i];
         if ( s.hasResourceFiles() )
         {
            PREPARE_FILE_ITERATION
            for ( let j = 0; j < s.files.length; ++j )
               if ( isResourceFile( s.files[j] ) )
                  outResourceFileFilterTag( f, indent, prefix, s.files[j] );
         }
      }
      f.outTextLn( "  </ItemGroup>" );
   }

   /*
    * Image file filters
    */
   if ( F.imgFileCount > 0 )
   {
      f.outTextLn( "  <ItemGroup>" );
      for ( let i = 0; i < F.sources.length; ++i )
      {
         let s = F.sources[i];
         if ( s.hasImageFiles() )
         {
            PREPARE_FILE_ITERATION
            for ( let j = 0; j < s.files.length; ++j )
               if ( isImageFile( s.files[j] ) )
                  outImageFileFilterTag( f, indent, prefix, s.files[j] );
         }
      }
      f.outTextLn( "  </ItemGroup>" );
   }

   f.outTextLn( "</Project>" );

   f.flush();
   f.close();
}

// ----------------------------------------------------------------------------
// EOF MakGenMSVC1xProjects.js - Released 2018-12-13T19:20:07Z
