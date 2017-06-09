// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// MakGenGenerators.js - Released 2017-04-14T16:45:58Z
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
 * Makefile generation
 */

function writeSeparator()
{
   console.writeln( "<end><cbr><br>======================================================================" );
}

function GenerateAll( files, parameters, with32Bit/*optional, undefined by default*/ )
{
   parameters.platform = "Host";
   parameters.architecture = "x64";
   GnuCxx( files, parameters );
   if ( with32Bit )
   {
      parameters.architecture = "x86";
      GnuCxx( files, parameters );
   }
   GnuCxxAll( files, parameters );

   parameters.platform = "FreeBSD";
   parameters.architecture = "x64";
   GnuCxx( files, parameters );
   if ( with32Bit )
   {
      parameters.architecture = "x86";
      GnuCxx( files, parameters );
   }
   GnuCxxAll( files, parameters );

   parameters.platform = "Linux";
   parameters.architecture = "x64";
   GnuCxx( files, parameters );
   if ( with32Bit )
   {
      parameters.architecture = "x86";
      GnuCxx( files, parameters );
   }
   GnuCxxAll( files, parameters );

   parameters.platform = "MacOSX";
   parameters.architecture = "x64";
   GnuCxx( files, parameters );
   if ( with32Bit )
   {
      parameters.architecture = "x86";
      GnuCxx( files, parameters );
   }
   GnuCxxAll( files, parameters );

   /*
   parameters.architecture = "x64";
   GnuCxx( files, parameters );
   if ( with32Bit )
   {
      parameters.architecture = "x86";
      GnuCxx( files, parameters );
   }
   GnuCxxAll( files, parameters );
   */

   parameters.platform = "Windows";
   MSVCxxAll( files, parameters );
}

/*
 * Makefiles and projects for PixInsight Class Library
 */
function GeneratePCLMakefiles()
{
   writeSeparator();
   console.writeln( "Generating makefiles for PixInsight Class Library" );
   console.flush();

   var files = new FileLists( PCLSRCDIR + "/pcl" );

   var parameters = new GeneratorParameters();
   parameters.id = "PCL";
   parameters.type = "StaticLibrary";
   parameters.official = true;
   parameters.gccOptimization = "3";
   parameters.hidden = true;

   GenerateAll( files, parameters );
}

/*
 * Makefiles and projects for PixInsight Core executable
 */
function GenerateCoreMakefiles()
{
   writeSeparator();
   console.writeln( "Generating makefiles for PixInsight Core executable" );
   console.flush();

   var files = new FileLists( PCLSRCDIR + "/core", true/*noImages*/ );

   var parameters = new GeneratorParameters();
   parameters.id = "PixInsight";
   parameters.type = "Core";
   parameters.official = true;
   parameters.gccOptimization = "3";

   GenerateAll( files, parameters );
}

/*
 * Makefiles and projects for the updater1 program
 */
function GenerateUpdater1Makefiles()
{
   writeSeparator();
   console.writeln( "Generating makefiles for PixInsight updater1 program" );
   console.flush();

   var files = new FileLists( PCLSRCDIR + "/core-aux/updater1" );

   var parameters = new GeneratorParameters();
   parameters.id = "PixInsightUpdater";
   parameters.type = "Executable";
   parameters.official = true;
   parameters.gccOptimization = "s";
   parameters.uacAdmin = true;  // updater1 requires administrative privileges on Windows

   GenerateAll( files, parameters );
}

/*
 * Makefiles and projects for the updater2 program
 */
function GenerateUpdater2Makefiles()
{
   writeSeparator();
   console.writeln( "Generating makefiles for PixInsight updater2 program" );
   console.flush();

   var files = new FileLists( PCLSRCDIR + "/core-aux/updater2" );

   var parameters = new GeneratorParameters();
   parameters.id = "updater2";
   parameters.type = "Executable";
   parameters.official = true;
   parameters.gccOptimization = "s";

   GenerateAll( files, parameters );
}

/*
 * Makefiles and projects for the updater3 program
 */
function GenerateUpdater3Makefiles()
{
   writeSeparator();
   console.writeln( "Generating makefiles for PixInsight updater3 program" );
   console.flush();

   var files = new FileLists( PCLSRCDIR + "/core-aux/updater3" );

   var parameters = new GeneratorParameters();
   parameters.id = "updater3";
   parameters.type = "CoreAux";
   parameters.official = true;
   parameters.gccOptimization = "s";

   GenerateAll( files, parameters );
}

/*
 * Makefiles and projects for all the updater programs
 */
function GenerateUpdaterMakefiles()
{
   GenerateUpdater1Makefiles();
   GenerateUpdater2Makefiles();
   GenerateUpdater3Makefiles();
}

/*
 * Makefiles and projects for the X11 UNIX/Linux installer program
 */
function GenerateX11InstallerMakefiles()
{
   writeSeparator();
   console.writeln( "Generating makefiles for PixInsight X11 UNIX/Linux installer program" );
   console.flush();

   var files = new FileLists( PCLSRCDIR + "/installer/x11" );

   var parameters = new GeneratorParameters();
   parameters.id = "installer";
   parameters.type = "X11Installer";
   parameters.official = true;
   parameters.gccOptimization = "s";
   parameters.architecture = "x64";

   parameters.platform = "Host";
   GnuCxx( files, parameters );
   GnuCxxAll( files, parameters );

   parameters.platform = "Linux";
   GnuCxx( files, parameters );
   GnuCxxAll( files, parameters );

   parameters.platform = "FreeBSD";
   GnuCxx( files, parameters );
   GnuCxxAll( files, parameters );
}

/*
 * Makefiles and projects for the PCLH code maintenance utility
 */
function GeneratePCLHMakefiles()
{
   writeSeparator();
   console.writeln( "Generating makefiles for PixInsight pclh utility" );
   console.flush();

   var files = new FileLists( PCLSRCDIR + "/utils/pclh" );

   var parameters = new GeneratorParameters();
   parameters.id = "pclh";
   parameters.type = "Executable";
   parameters.official = true;
   parameters.gccOptimization = "3";

   GenerateAll( files, parameters );
}

/*
 * Makefiles and projects for a standard PixInsight module
 */
function GenerateStandardModuleMakefiles( module,
   extraDefinitions, winExtraDefinitions, extraIncludeDirs, extraLibDirs, extraLibraries )
{
   writeSeparator();
   console.writeln( "Generating makefiles for PixInsight module: " + module );
   console.flush();

   var files = new FileLists( PCLSRCDIR + "/modules/" + module );

   var parameters = new GeneratorParameters();
   parameters.id = File.extractName( module );
   parameters.type = "Module";
   parameters.official = true;
   parameters.gccOptimization = "3";
   parameters.winExtraDefinitions.push( "_CRT_SECURE_NO_WARNINGS" );
   for ( var i = 0; i < extraDefinitions.length; ++i )
      parameters.extraDefinitions.push( extraDefinitions[i] );
   for ( var i = 0; i < winExtraDefinitions.length; ++i )
      parameters.winExtraDefinitions.push( winExtraDefinitions[i] );
   for ( var i = 0; i < extraIncludeDirs.length; ++i )
      parameters.extraIncludeDirs.push( extraIncludeDirs[i] );
   for ( var i = 0; i < extraLibDirs.length; ++i )
      parameters.extraLibDirs.push( extraLibDirs[i] );
   for ( var i = 0; i < extraLibraries.length; ++i )
      parameters.extraLibraries.push( extraLibraries[i] );

   GenerateAll( files, parameters );
}

/*
 * Makefiles and projects for a standard PixInsight dynamic library
 */
function GenerateStandardDynamicLibraryMakefiles( library,
   winDefFile, extraDefinitions, winExtraDefinitions, extraIncludeDirs, extraLibDirs, extraLibraries )
{
   writeSeparator();
   console.writeln( "Generating makefiles for dynamic library: " + library );
   console.flush();

   var files = new FileLists( PCLSRCDIR + '/' + library );

   var parameters = new GeneratorParameters();
   parameters.id = File.extractName( library );
   parameters.type = "DynamicLibrary";
   parameters.official = true;
   parameters.winDefFile = winDefFile;
   parameters.winExtraDefinitions.push( "_CRT_SECURE_NO_WARNINGS" );
   for ( var i = 0; i < extraDefinitions.length; ++i )
      parameters.extraDefinitions.push( extraDefinitions[i] );
   for ( var i = 0; i < winExtraDefinitions.length; ++i )
      parameters.winExtraDefinitions.push( winExtraDefinitions[i] );
   for ( var i = 0; i < extraIncludeDirs.length; ++i )
      parameters.extraIncludeDirs.push( extraIncludeDirs[i] );
   for ( var i = 0; i < extraLibDirs.length; ++i )
      parameters.extraLibDirs.push( extraLibDirs[i] );
   for ( var i = 0; i < extraLibraries.length; ++i )
      parameters.extraLibraries.push( extraLibraries[i] );

   GenerateAll( files, parameters );
}

/*
 * Makefiles and projects for a standard PixInsight static library
 */
function GenerateStandardStaticLibraryMakefiles( library, extraDefinitions, winExtraDefinitions, extraIncludeDirs )
{
   writeSeparator();
   console.writeln( "Generating makefiles for static library: " + library );
   console.flush();

   var files = new FileLists( PCLSRCDIR + '/' + library );

   var parameters = new GeneratorParameters();
   parameters.id = File.extractName( library );
   parameters.type = "StaticLibrary";
   parameters.official = true;
   parameters.winExtraDefinitions.push( "_CRT_SECURE_NO_WARNINGS" );
   for ( var i = 0; i < extraDefinitions.length; ++i )
      parameters.extraDefinitions.push( extraDefinitions[i] );
   for ( var i = 0; i < winExtraDefinitions.length; ++i )
      parameters.winExtraDefinitions.push( winExtraDefinitions[i] );
   for ( var i = 0; i < extraIncludeDirs.length; ++i )
      parameters.extraIncludeDirs.push( extraIncludeDirs[i] );

   GenerateAll( files, parameters );
}

function GenerateStandardFileFormatModuleMakefiles()
{
   GenerateStandardModuleMakefiles( "file-formats/BMP",      [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "file-formats/DSLR_RAW", [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "file-formats/FITS",     [], [], [], [], ["cfitsio-pxi"] );
   GenerateStandardModuleMakefiles( "file-formats/JPEG",     [], [], [], [], ["jpeg-pxi"] );
   GenerateStandardModuleMakefiles( "file-formats/JPEG2000", [], [], [], [], ["jasper-pxi"] );
   GenerateStandardModuleMakefiles( "file-formats/TIFF",     [], [], [], [], ["libtiff-pxi", "jpeg-pxi"] );
   GenerateStandardModuleMakefiles( "file-formats/XISF",     [], [], [], [], [] );
}

function GenerateStandardProcessModuleMakefiles()
{
   GenerateStandardModuleMakefiles( "processes/BackgroundModelization",                      [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/CloneStamp",                                  [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/ColorCalibration",                            [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/ColorManagement",                             [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/ColorSpaces",                                 [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/Compatibility",                               [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/Convolution",                                 [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/Deconvolution",                               [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/Flux",                                        [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/Fourier",                                     [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/Geometry",                                    [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/Global",                                      [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/GREYCstoration",                              [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/Image",                                       [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/ImageCalibration",                            [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/ImageIntegration",                            [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/ImageRegistration",                           [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/IntensityTransformations",                    [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/MaskGeneration",                              [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/Morphology",                                  [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/MultiscaleProcessing",                        [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/NoiseGeneration",                             [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/NoiseReduction",                              [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/NoOperation",                                 [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/Obsolete",                                    [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/PixelMath",                                   [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/RestorationFilters",                          [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/Sandbox",                                     [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/StarGenerator",                               [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/TGV",                                         [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/contrib/gviehoever/GradientDomain",           [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/contrib/kkretzschmar/INDIClient",             [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/contrib/nvolkov/Blink",                       [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/contrib/nvolkov/CometAlignment",              [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/contrib/nvolkov/CosmeticCorrection",          [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/contrib/nvolkov/SplitCFA",                    [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/contrib/spool/Debayer",                       [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/contrib/zvrastil/Annotation",                 [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/contrib/zvrastil/AssistedColorCalibration",   [], [], [], [], [] );
   GenerateStandardModuleMakefiles( "processes/contrib/zvrastil/LocalHistogramEqualization", [], [], [], [], [] );
}

function GeneratePixInsightPlatformMakefiles()
{
   // PixInsight Class Library
   GeneratePCLMakefiles();

   // CFITSIO FITS format support library - version >= 3.37
   GenerateStandardStaticLibraryMakefiles( "3rdparty/cfitsio", [], ["_MBCS", "FF_NO_UNISTD_H"], [] );

   // CMINPACK library
   GenerateStandardStaticLibraryMakefiles( "3rdparty/cminpack", [], ["CMINPACK_NO_DLL"], [] );

   // JasPer JPEG2000 format support library
   GenerateStandardStaticLibraryMakefiles( "3rdparty/jasper",  [], [], [] );

   // JPEG format support library
   GenerateStandardStaticLibraryMakefiles( "3rdparty/jpeg", [], [], [] );

   // Little CMS engine
   GenerateStandardStaticLibraryMakefiles( "3rdparty/lcms", [], [], [] );

   // LibTIFF TIFF format support library
   GenerateStandardStaticLibraryMakefiles( "3rdparty/libtiff", [], [], ["$(PCLSRCDIR)/3rdparty/jpeg", "$(PCLSRCDIR)/3rdparty/zlib"] );

   // LZ4 data compression library
   GenerateStandardStaticLibraryMakefiles( "3rdparty/lz4", [], [], [] );

   // OpenJP2 JPEG2000 format support library
   GenerateStandardStaticLibraryMakefiles( "3rdparty/openjp2", "", [], [], [] );

   // RFC6234 cryptographic hashing library
   GenerateStandardStaticLibraryMakefiles( "3rdparty/RFC6234", [], [], [] );

   // ZLIB data compression library
   GenerateStandardStaticLibraryMakefiles( "3rdparty/zlib", [], [], [] );

   // PixInsight Core application
   GenerateCoreMakefiles();

   // Updater programs
   GenerateUpdaterMakefiles();

   // X11 install program
   GenerateX11InstallerMakefiles();

   // PCL source code maintenance utility
   GeneratePCLHMakefiles();

   // Standard file format modules
   GenerateStandardFileFormatModuleMakefiles();

   // Standard process modules
   GenerateStandardProcessModuleMakefiles();
}

// ----------------------------------------------------------------------------
// EOF MakGenGenerators.js - Released 2017-04-14T16:45:58Z
