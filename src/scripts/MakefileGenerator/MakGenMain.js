// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// MakGenMain.js - Released 2015/11/26 08:53:10 UTC
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
 * Script entry point.
 */

function main()
{
   if ( Parameters.isViewTarget )
      throw new Error( TITLE + " cannot be executed on views." );

   /*
    * PCL building environment: Check for required PCL environment variables.
    */
   if ( PCLDIR.length == 0 ||
        PCLSRCDIR.length == 0 ||
        PCLINCDIR.length == 0 ||
        //PCLLIBDIR32.length == 0 ||
        PCLLIBDIR64.length == 0 ||
        //PCLBINDIR32.length == 0 ||
        PCLBINDIR64.length == 0 )
   {
      (new MessageBox( "<p>The PixInsight/PCL build environment has not been correctly configured.</p>" +
                       "<p>You must define all required environment variables: PCLDIR, PCLINCDIR, etc.</p>",
                       TITLE, StdIcon_Error, StdButton_Ok )).execute();
      return;
   }

   /*
    * Sanity check: Every PCL environment variable must point to an existing directory.
    */
   if ( !File.directoryExists( PCLDIR ) ||
        !File.directoryExists( PCLSRCDIR ) ||
        !File.directoryExists( PCLINCDIR ) ||
        //PCLLIBDIR32.length > 0 && !File.directoryExists( PCLLIBDIR32 ) ||
        !File.directoryExists( PCLLIBDIR64 ) ||
        //PCLBINDIR32.length > 0 && !File.directoryExists( PCLBINDIR32 ) ||
        !File.directoryExists( PCLBINDIR64 ) )
   {
      (new MessageBox( "<p>One or more PCL build environment variables point to nonexistent directories.</p>" +
                       "<p>Fix your PixInsight/PCL build environment and try again.</p>",
                       TITLE, StdIcon_Error, StdButton_Ok )).execute();
      return;
   }

   /*
    * Main script loop
    */
   var dialog = new MakefileGeneratorDialog();
   for ( ;; )
   {
      if ( Parameters.isGlobalTarget )
         dialog.importParameters();

      console.hide();

      if ( dialog.execute() )
      {
         console.show();
         console.writeln( "<end><cbr>" );
         writeSeparator();
         console.writeln( "PixInsight Makefile Generator Script v" + VERSION );
         console.writeln( "Copyright (C) 2009-2015 Pleiades Astrophoto" );
         writeSeparator();
         console.flush();

         /*
          * PI internal projects take precedence over the rest of options and
          * ignore all user-selectable settings. Compiler and system settings
          * are always hard wired for internal projects.
          */
         switch ( dialog.type_ComboBox.currentItem )
         {
         case TYPE_PCL:
            GeneratePCLMakefiles();
            return;
         case TYPE_CORE:
            GenerateCoreMakefiles();
            return;
         case TYPE_CORE_AUX:
            GenerateUpdaterMakefiles();
            return;
         case TYPE_STANDARD_MODULES:
            GenerateStandardFileFormatModuleMakefiles();
            GenerateStandardProcessModuleMakefiles();
            return;
         case TYPE_PLATFORM:
            GeneratePixInsightPlatformMakefiles();
            return;
         default:
            break;
         }

         /*
          * So we have a project in the external user land. Honor all dialog
          * settings and do our things.
          */

         var projectDirectory = dialog.directory_Edit.text.trim();
         if ( projectDirectory.length == 0 )
         {
            (new MessageBox( "You must specify a valid project directory.",
                             TITLE, StdIcon_Error, StdButton_Ok )).execute();
            continue;
         }

         if ( !File.directoryExists( projectDirectory ) )
         {
            (new MessageBox( "You have specified a nonexistent project directory.",
                             TITLE, StdIcon_Error, StdButton_Ok )).execute();
            continue;
         }

         var P = new GeneratorParameters();

         P.id = dialog.id_Edit.text.trim();
         if ( P.id.length == 0 )
         {
            P.id = File.extractName( projectDirectory ).trim();
            if ( P.id.length == 0 )
            {
               (new MessageBox( "<p>You haven't specified a project identifier. That's nice, but " +
                                "for some reason, I cannot extract a valid identifier from your " +
                                "project directory !?</p>",
                                TITLE, StdIcon_Error, StdButton_Ok )).execute();
               continue;
            }
         }

         switch ( dialog.type_ComboBox.currentItem )
         {
         case TYPE_MODULE:          P.type = "Module"; break;
         case TYPE_DYNAMIC_LIBRARY: P.type = "DynamicLibrary"; break;
         case TYPE_STATIC_LIBRARY:  P.type = "StaticLibrary"; break;
         case TYPE_EXECUTABLE:      P.type = "Executable"; break;
         case TYPE_PCL:             P.type = "StaticLibrary"; break;
         case TYPE_CORE:            P.type = "Core"; break;
         case TYPE_CORE_AUX:        P.type = "CoreAux"; break;
         default: throw new Error( "Internal error: bad project type item selection!" );
         }

         switch ( dialog.platform_ComboBox.currentItem )
         {
         case PLATFORM_LINUX:       P.platform = "Linux"; break;
         case PLATFORM_FREEBSD:     P.platform = "FreeBSD"; break;
         case PLATFORM_MACOSX:      P.platform = "MacOSX"; break;
         case PLATFORM_WINDOWS:     P.platform = "Windows"; break;
         case PLATFORM_HOST:        P.platform = "Host"; break;
         default: throw new Error( "Internal error: bad platform item selection!" );
         }

         switch ( dialog.architecture_ComboBox.currentItem )
         {
         case ARCH_X86:             P.architecture = "x86"; break;
         case ARCH_X64:             P.architecture = "x64"; break;
         default: throw new Error( "Internal error: bad architecture item selection!" );
         }

         P.osxArchOptions = dialog.osxArchOptions_CheckBox.checked;

         P.gccSuffixLinux = dialog.gccSuffixLinux_Edit.text.trim();

         switch ( dialog.gccOptimization_ComboBox.currentItem )
         {
         case OPTIMIZATION_O0:      P.gccOptimization = "0"; break;
         case OPTIMIZATION_O1:      P.gccOptimization = "1"; break;
         case OPTIMIZATION_O2:      P.gccOptimization = "2"; break;
         case OPTIMIZATION_O3:      P.gccOptimization = "3"; break;
         case OPTIMIZATION_Os:      P.gccOptimization = "s"; break;
         case OPTIMIZATION_Ofast:   P.gccOptimization = "fast"; break;
         default: throw new Error( "Internal error: bad gccOptimization item selection!" );
         }

         P.gccUnstrippedBinaries = dialog.gccUnstripped_CheckBox.checked;

         var a = dialog.extraDefinitions_TextBox.text.trim().split( '\n' );
         for ( var i = 0; i < a.length; ++i )
         {
            var t = a[i].trim();
            if ( t.length > 0 )
               P.extraDefinitions.push( a[i] );
         }

         a = dialog.extraIncludeDirs_TextBox.text.trim().split( '\n' );
         for ( var i = 0; i < a.length; ++i )
         {
            var t = a[i].trim();
            if ( t.length > 0 )
               P.extraIncludeDirs.push( a[i] );
         }

         a = dialog.extraLibraryDirs_TextBox.text.trim().split( '\n' );
         for ( var i = 0; i < a.length; ++i )
         {
            var t = a[i].trim();
            if ( t.length > 0 )
              P.extraLibDirs.push( a[i] );
         }

         a = dialog.extraLibraries_TextBox.text.trim().split( '\n' );
         for ( var i = 0; i < a.length; ++i )
         {
            var t = a[i].trim();
            if ( t.length > 0 )
               P.extraLibraries.push( a[i] );
         }

         P.validate();

         var F = new FileLists( projectDirectory );

         for ( var step = 0; ; )
         {
            if ( dialog.hostMakefiles_CheckBox.checked )
            {
               P.platform = "Host";
               if ( dialog.allArchitectures_CheckBox.checked )
               {
                  P.architecture = "x86";
                  GnuCxx( F, P );
               }
               P.architecture = "x64";
               GnuCxx( F, P );
               if ( step == 0 )
                  GnuCxxAll( F, P );
            }

            if ( dialog.allPlatforms_CheckBox.checked )
            {
               if ( dialog.allArchitectures_CheckBox.checked )
               {
                  P.platform = "FreeBSD";
                  P.architecture = "x86";
                  GnuCxx( F, P );
                  P.architecture = "x64";
                  GnuCxx( F, P );
                  if ( step == 0 )
                     GnuCxxAll( F, P );

                  P.platform = "Linux";
                  P.architecture = "x86";
                  GnuCxx( F, P );
                  P.architecture = "x64";
                  GnuCxx( F, P );
                  if ( step == 0 )
                     GnuCxxAll( F, P );

                  P.platform = "MacOSX";
                  P.architecture = "x86";
                  GnuCxx( F, P );
                  P.architecture = "x64";
                  GnuCxx( F, P );
                  if ( step == 0 )
                     GnuCxxAll( F, P );
               }
               else
               {
                  P.platform = "FreeBSD";
                  GnuCxx( F, P );
                  if ( step == 0 )
                     GnuCxxAll( F, P );

                  P.platform = "Linux";
                  GnuCxx( F, P );
                  if ( step == 0 )
                     GnuCxxAll( F, P );

                  P.platform = "MacOSX";
                  GnuCxx( F, P );
                  if ( step == 0 )
                     GnuCxxAll( F, P );
               }

               if ( step == 0 )
               {
                  P.platform = "Windows";
                  MSVCxxAll( F, P );
               }
            }
            else
            {
               if ( P.platform == "FreeBSD" || P.platform == "Linux" || P.platform == "MacOSX" )
               {
                  if ( dialog.allArchitectures_CheckBox.checked )
                  {
                     P.architecture = "x86";
                     GnuCxx( F, P );
                     P.architecture = "x64";
                     GnuCxx( F, P );
                  }
                  else
                     GnuCxx( F, P );

                  if ( step == 0 )
                     GnuCxxAll( F, P );
               }
               else if ( P.platform == "Windows" )
               {
                  if ( step == 0 )
                     MSVCxxAll( F, P );
               }
            }

            if ( ++step == 2 )
               break;

            if ( !dialog.gccDebug_CheckBox.checked )
               break;

            P.gccDebug = true;
            P.diagnostics = dialog.diagnostics_ComboBox.currentItem;
         }

         if ( (new MessageBox( "Do you want to generate more makefiles ?",
                               TITLE,
                               StdIcon_Question,
                               StdButton_Yes, StdButton_No )).execute() == StdButton_Yes )
            continue;
      } // if ( dialog.execute() )

      break;
   } // for ( ;; )

   console.hide();
}

// ----------------------------------------------------------------------------
// EOF MakGenMain.js - Released 2015/11/26 08:53:10 UTC
