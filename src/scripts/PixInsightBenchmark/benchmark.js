// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// benchmark.js - Released 2015/10/12 20:16:23 UTC
// ----------------------------------------------------------------------------
//
// This file is part of PixInsight Benchmark Script version 1.03
//
// Copyright (C) 2014-2015 Pleiades Astrophoto S.L. All Rights Reserved.
// Written by Juan Conejero, PTeam.
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

#feature-id    Benchmarks > PixInsight Benchmark

#feature-info  A script to evaluate the performance of your machine for \
               execution of intermediate and advanced image processing tasks \
               with PixInsight.<br/>\
               Copyright (C) 2014-2015 Pleiades Astrophoto S.L. All Rights Reserved.<br/>\
               Written by Juan Conejero, PTeam

#include <pjsr/CryptographicHash.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdDialogCode.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/TextAlign.jsh>

#define VERSION "1.03"
#define TITLE   "PixInsight Benchmark"

if ( coreVersionBuild < 1157 )
   throw new Error( "The " + TITLE + " script requires PixInsight 1.8.4.1157 or higher." );

// ----------------------------------------------------------------------------

/*
 * CPU Identification
 *
 * References:
 *
 *    Intel® 64 and IA-32 Architectures Software Developer’s Manual /
 *    Volume 2A: Instruction Set Reference, A-M, 3-157
 */
function CPUId()
{
   this.__base__ = Object;
   this.__base__();

   this.vendor = function()
   {
      this.id( 0 );
      return (this.registerToASCII( this.ebx ) +
              this.registerToASCII( this.edx ) +
              this.registerToASCII( this.ecx )).trim();
   };

   this.model = function()
   {
      this.id( 0x80000000 );
      if ( this.eax < 0x80000004 )
         throw "Unsupported function";
      let s;
      this.id( 0x80000002 );
      s =  this.registerToASCII( this.eax ) +
           this.registerToASCII( this.ebx ) +
           this.registerToASCII( this.ecx ) +
           this.registerToASCII( this.edx );
      this.id( 0x80000003 );
      s += this.registerToASCII( this.eax ) +
           this.registerToASCII( this.ebx ) +
           this.registerToASCII( this.ecx ) +
           this.registerToASCII( this.edx );
      this.id( 0x80000004 );
      s += this.registerToASCII( this.eax ) +
           this.registerToASCII( this.ebx ) +
           this.registerToASCII( this.ecx ) +
           this.registerToASCII( this.edx );
      return s.trim();
   };

   this.id = function( eax )
   {
      let r = cpuId( eax );
      this.eax = r[0];
      this.ebx = r[1];
      this.ecx = r[2];
      this.edx = r[3];
   };

   this.registerToASCII = function( r )
   {
      let s = "";
      for ( let i = 0, n = 0; i < 4; ++i, n += 8 )
      {
         let c = (r & (0x000000ff << n)) >> n;
         if ( c != 0 )
            s += String.fromCharCode( c );
      }
      return s;
   };
}

CPUId.prototype = new Object;

// ----------------------------------------------------------------------------

/*
 * System Identification Routines
 */
function SystemId()
{
   this.__base__ = Object;
   this.__base__();

   this.platform = function()
   {
      if ( corePlatform == "MSWindows" )
         return "Windows";

      if ( corePlatform == "Linux" )
      {
         let p = new ExternalProcess( "lsb_release -a" );
         p.waitForFinished();
         if ( p.exitCode == 0 )
         {
            let t = p.stdout.utf8ToString().trim();
            let l = t.split( '\n' );
            let d = "";
            for ( let i = 0; i < l.length; ++i )
               if ( l[i].indexOf( "Description" ) >= 0 )
               {
                  d = l[i].substring( l[i].indexOf( ':' )+1 ).trim();
                  break;
               }
            if ( d.length > 0 )
               return "Linux / " + d;
         }
      }
      else if ( corePlatform == "FreeBSD" )
      {
         let p = new ExternalProcess( "cat /etc/version" );
         p.waitForFinished();
         if ( p.exitCode == 0 )
            return "FreeBSD " + p.stdout.utf8ToString().trim();
      }

      return corePlatform;
   };

   this.platformBrief = function()
   {
      if ( corePlatform == "MSWindows" )
         return "Windows";
      return corePlatform;
   };

   this.coreVersion = function()
   {
      return coreId;
   };

   this.operatingSystem = function()
   {
      if ( corePlatform == "MSWindows" )
      {
         let p = new ExternalProcess( "wmic os get Caption /value" );
         p.waitForFinished();
         let t = this.windowsDataToText( p.stdout );
         return t.substring( t.indexOf( '=' )+1 ).trim();
      }
      else if ( corePlatform == "Linux" )
      {
         let p = new ExternalProcess( "uname -rvo" );
         p.waitForFinished();
         return p.stdout.utf8ToString().trim();
      }
      else if ( corePlatform == "FreeBSD" )
      {
         let p = new ExternalProcess( "/sbin/sysctl kern.version" );
         p.waitForFinished();
         let t = p.stdout.utf8ToString().trim();
         let i = t.indexOf( ':' );
         let j = t.indexOf( '\n' );
         if ( i >= 0 && j >= 0 )
            return t.substring( i+1, j ).trim();
         return t;
      }
      else if ( corePlatform == "MacOSX" )
      {
         let p = new ExternalProcess( "sw_vers" );
         p.waitForFinished();
         let t = p.stdout.utf8ToString().trim();
         let l = t.split( '\n' );
         let n = "", v = "", b = "";
         for ( let i = 0; i < l.length; ++i )
            if ( l[i].indexOf( "ProductName" ) >= 0 )
               n = l[i].substring( l[i].indexOf( ':' )+1 ).trim();
            else if ( l[i].indexOf( "ProductVersion" ) >= 0 )
               v = l[i].substring( l[i].indexOf( ':' )+1 ).trim();
            else if ( l[i].indexOf( "BuildVersion" ) >= 0 )
               b = l[i].substring( l[i].indexOf( ':' )+1 ).trim();
         return n + ' ' + v + ' ' + b;
      }
      return ""; // !?
   };

   this.numberOfProcessors = function()
   {
      if ( corePlatform == "MSWindows" )
      {
         let p = new ExternalProcess( "wmic cpu get NumberOfLogicalProcessors /value" );
         p.waitForFinished();
         let t = this.windowsDataToText( p.stdout );
         return parseInt( t.substring( t.indexOf( '=' )+1 ).trim() );
      }
      else if ( corePlatform == "Linux" )
      {
         let p = new ExternalProcess( "nproc" );
         p.waitForFinished();
         return parseInt( p.stdout.utf8ToString().trim() );
      }
      else if ( corePlatform == "FreeBSD" )
      {
         let p = new ExternalProcess( "/sbin/sysctl hw.ncpu" );
         p.waitForFinished();
         let t = p.stdout.utf8ToString();
         return parseInt( t.substring( t.indexOf( ':' )+1 ).trim() );
      }
      else if ( corePlatform == "MacOSX" )
      {
         let p = new ExternalProcess( "sysctl hw.ncpu" );
         p.waitForFinished();
         let t = p.stdout.utf8ToString();
         return parseInt( t.substring( t.indexOf( ':' )+1 ).trim() );
      }
      return 0; // !?
   };

   this.totalMemorySizeKiB = function()
   {
      if ( corePlatform == "MSWindows" )
      {
         let p = new ExternalProcess( "wmic os get TotalVisibleMemorySize /value" );
         p.waitForFinished();
         let t = this.windowsDataToText( p.stdout );
         return parseInt( t.substring( t.indexOf( '=' )+1 ).trim() );
      }
      else if ( corePlatform == "Linux" )
      {
         let p = new ExternalProcess( "cat /proc/meminfo" );
         p.waitForFinished();
         let s = p.stdout.utf8ToString();
         let l = s.split( '\n' );
         for ( let i = 0; i < l.length; ++i )
            if ( l[i].indexOf( "MemTotal" ) >= 0 )
               return parseInt( l[i].split( ' ' ).filter( function( x ){ return x.trim().length > 0; } )[1].trim() );
         return 0; // !?
      }
      else if ( corePlatform == "FreeBSD" )
      {
         let p = new ExternalProcess( "/sbin/sysctl hw.physmem" );
         p.waitForFinished();
         let t = p.stdout.utf8ToString();
         return parseInt( t.substring( t.indexOf( ':' )+1 ).trim() )/1024;
      }
      else if ( corePlatform == "MacOSX" )
      {
         let p = new ExternalProcess( "sysctl hw.memsize" );
         p.waitForFinished();
         let t = p.stdout.utf8ToString();
         return parseInt( t.substring( t.indexOf( ':' )+1 ).trim() )/1024;
      }
      return 0; // !?
   };

   this.windowsDataToText = function( data )
   {
      let B = new ByteArray;
      for ( let i = 0; i < data.length; ++i )
      {
         let b = data.at( i );
         if ( b != 0x0D )
            B.add( b );
      }
      return B.toString().trim();
   };
}

SystemId.prototype = new Object;

// ----------------------------------------------------------------------------

/*
 * Benchmark Engine
 */

#define BENCHMARK_VERSION_BIG "1.0"
#define BENCHMARK_VERSION     "1.00.08"
#define INPUT_CHECKSUM        "2cd72b67e12fff2812ef5b5da054ab2a70a25e23"
#define TOTAL_SWAP_SIZE       5520.92728805542 // MiB

// Reference times in seconds
// Reference machine is Antares workstation at PixInsight Labs w/ single SSD
#define REFERENCE_TOTAL       47.04
#define REFERENCE_CPU         37.85
#define REFERENCE_SWAP         9.18

function Benchmark()
{
   this.__base__ = Object;
   this.__base__();

   // User definable parameters
   this.secureConnections = true;
   this.forceDownload = false;
   this.showImage = true;

   /*
    * Benchmark process
    *
    * Returns true if the benchmark has been completed; false if the user has
    * calceled it, or if an error occurs.
    */
   this.perform = function()
   {
      try
      {
         console.hide();
         console.clear();
         console.writeln( "<end><cbr><br>",
                          "*******************************************************************************" );
         console.writeln( "<b>The Official PixInsight Benchmark version ", BENCHMARK_VERSION_BIG, "</b>" );
         console.writeln( "Copyright (C) 2014-2015 Pleiades Astrophoto. All Rights Reserved." );
         console.writeln( "*******************************************************************************" );

         this.progress = new BenchmarkProgressDialog;

         let filePath = this.download();
         if ( filePath.length == 0 )
         {
            if ( this.progress.canceled )
            {
               this.cancel();
               return false;
            }
            throw new Error( "Unable to download the benchmark input image." );
         }
         if ( !this.validateInput( filePath ) )
            throw new Error( "Invalid benchmark input image." );

         this.reset();
         this.window = this.load( filePath );

         let t0 = new ElapsedTime;

         let P = this.instances();

         this.progress.setText( "Performing benchmark, please wait." );
         this.progress.setRange( 0, 3*P.length );
         this.progress.show();

         let view = this.window.mainView;

         for ( let i = 0; i < P.length; ++i )
         {
            if ( this.progress.canceled )
            {
               this.cancel();
               return false;
            }
            let t1 = new ElapsedTime;
            P[i].executeOn( view );
            this.swapTime += t1.value - P[i].executionTime();
            this.cpuTime += P[i].executionTime();
            this.progress.increment();
         }

         for ( let i = 0; i < P.length; ++i )
         {
            if ( this.progress.canceled )
            {
               this.cancel();
               return false;
            }
            let t1 = new ElapsedTime;
            view.historyIndex--;
            this.swapTime += t1.value;
            this.progress.increment();
         }

         for ( let i = 0; i < P.length; ++i )
         {
            if ( this.progress.canceled )
            {
               this.cancel();
               return false;
            }
            let t1 = new ElapsedTime;
            P[i].executeOn( view );
            this.swapTime += t1.value - P[i].executionTime();
            this.cpuTime += P[i].executionTime();
            this.progress.increment();
         }

         this.progress.cancel();
         this.progress = undefined;

         {
            let t1 = new ElapsedTime;
            view.beginProcess();
            let t2 = new ElapsedTime;
            this.cosmetics( view.image );
            let dt2 = t2.value;
            this.cpuTime += dt2;
            view.endProcess();
            this.swapTime += t1.value - dt2;
         }

         this.totalTime = t0.value;

         this.totalIndex = 10000*REFERENCE_TOTAL/this.totalTime;
         this.cpuIndex = 10000*REFERENCE_CPU/this.cpuTime;
         this.swapIndex = 10000*REFERENCE_SWAP/this.swapTime;
         this.swapTransferRate = (12 + 3*TOTAL_SWAP_SIZE)/this.swapTime;

         view.beginProcess();
         this.watermark( view.image );
         view.endProcess();

         let cpu = new CPUId;
         this.cpuVendor = cpu.vendor();
         this.cpuModel = cpu.model();

         let sys = new SystemId;
         this.numberOfProcessors = sys.numberOfProcessors();
         this.totalMemorySizeKiB = sys.totalMemorySizeKiB();
         this.platform = sys.platform();
         this.platformBrief = sys.platformBrief();
         this.operatingSystem = sys.operatingSystem();
         this.coreVersion = sys.coreVersion();

         this.serialNumber = this.randomId( 32 );

         let s = this.report();
         console.writeln( "<end><cbr><br>",
                          "*******************************************************************************" );
         console.writeln( "<b>Benchmark Results</b>" );
         console.writeln( "*******************************************************************************" );
         console.writeln( "" );
         for ( let i = 0; i < s.length; ++i )
            console.writeln( s[i] );

         if ( this.showImage )
         {
            this.window.purge();
            this.window.show();
            this.window.zoomToFit();
         }
         else
         {
            this.window.forceClose();
            this.window = undefined;
         }

         gc();
         return true;
      }
      catch ( e )
      {
         this.cancel();
         console.criticalln( "<end><cbr><br>" + e.toString() );
         (new MessageBox( e.toString(), TITLE, StdIcon_Error, StdButton_Ok )).execute();
         return false;
      }
   };

   /*
    * Resets all benchmark resuts to empty values.
    */
   this.reset = function()
   {
      // Benchmark results
      this.serialNumber = "";
      this.cpuVendor = "";
      this.cpuModel = "";
      this.platform = "";
      this.platformBrief = "";
      this.operatingSystem = "";
      this.coreVersion = "";
      this.numberOfProcessors = 0;
      this.totalMemorySizeKiB = 0;
      this.totalTime = 0;
      this.cpuTime = 0;
      this.swapTime = 0;
      this.swapTransferRate = 0;
      this.totalIndex = 0;
      this.cpuIndex = 0;
      this.swapIndex = 0;

      // Optional user-defined information
      this.machineInfo = "";
      this.motherboardInfo = "";
      this.diskInfo = "";
      this.comments = "";

      // Server answer after submission
      this.serverResponse = "";
   };

   /*
    * Cancels an ongoing benchmark process.
    */
   this.cancel = function()
   {
      console.criticalln( "<end><cbr><br><raw><* abort *></raw>" );

      this.reset();

      if ( this.progress )
      {
         this.progress.cancel();
         this.progress = undefined;
      }

      if ( this.window )
      {
         if ( !this.window.isNull )
            this.window.forceClose();
         this.window = undefined;
      }

      processEvents();
      gc();
   };

   /*
    * Returns a report of the last benchmark performed. This function returns
    * an array of plain text lines, *not* a printable string.
    */
   this.report = function()
   {
      let n = Math.trunc( Math.log10( Math.max( this.totalIndex, this.cpuIndex, this.swapIndex ) ) ) + 1;
      let items = [
         "Benchmark version ...... " + BENCHMARK_VERSION                                        ,
         "Input checksum ......... " + INPUT_CHECKSUM                                           ,
         "Serial number .......... " + this.serialNumber                                        ,
         ""                                                                                     ,
         "CPU Identification"                                                                   ,
         "CPU vendor ............. " + this.cpuVendor                                           ,
         "CPU model .............. " + this.cpuModel                                            ,
         ""                                                                                     ,
         "System Information"                                                                   ,
         "Platform ............... " + this.platform                                            ,
         "Operating system ....... " + this.operatingSystem                                     ,
         "Core version ........... " + this.coreVersion                                         ,
         "Logical processors ..... " + this.numberOfProcessors                                  ,
         "Total memory size ...... " + format( "%.3f GiB", this.totalMemorySizeKiB/1024/1024 )  ,
         ""                                                                                     ,
         "Execution Times"                                                                      ,
         "Total time ............. " + this.timeAsString( this.totalTime )                      ,
         "CPU time ............... " + this.timeAsString( this.cpuTime )                        ,
         "Swap time .............. " + this.timeAsString( this.swapTime )                       ,
         "Swap transfer rate ..... " + format( "%.3f MiB/s", this.swapTransferRate )            ,
         ""                                                                                     ,
         "Performance Indices"                                                                  ,
         "Total performance ...... " + format( "%*.0f", n, this.totalIndex )                    ,
         "CPU performance ........ " + format( "%*.0f", n, this.cpuIndex )                      ,
         "Swap performance ....... " + format( "%*.0f", n, this.swapIndex )
      ];

      if ( this.hasOptionalItems() )
      {
         items.push( "" );
         items.push( "Additional Information" );
         if ( this.diskInfo.length > 0 )
            items.push( "Swap disks ............. " + this.diskInfo );
         if ( this.motherboardInfo.length > 0 )
            items.push( "Motherboard ............ " + this.motherboardInfo );
         if ( this.machineInfo.length > 0 )
            items.push( "Machine description .... " + this.machineInfo );
         if ( this.comments.length > 0 )
            items.push( "Comments ............... " + this.comments );
      }

      return items;
   };

   /*
    * Sends benchmark data to the server.
    */
   this.submit = function()
   {
      try
      {
         if ( this.serialNumber.length <= 0 )
            throw new Error( "Attempt to send an invalid benchmark." );

         let url = (this.secureConnections ? "https" : "http") + "://pixinsight.com/benchmark/cgi-bin/v1/benchmark-submit.php";
         url += "?serialNumber="          + this.serialNumber;
         url += "&version="               + this.toPercentEncoding( BENCHMARK_VERSION );
         url += "&cpuVendor="             + this.toPercentEncoding( this.cpuVendor );
         url += "&cpuModel="              + this.toPercentEncoding( this.cpuModel );
         url += "&platform="              + this.toPercentEncoding( this.platform );
         url += "&platformBrief="         + this.toPercentEncoding( this.platformBrief );
         url += "&operatingSystem="       + this.toPercentEncoding( this.operatingSystem );
         url += "&coreVersion="           + this.toPercentEncoding( this.coreVersion );
         url += "&numberOfProcessors="    + this.numberOfProcessors.toString();
         url += "&totalMemorySizeKiB="    + this.totalMemorySizeKiB.toString();
         url += "&totalTime="             + this.toPercentEncoding( format( "%.3f", this.totalTime ) );
         url += "&cpuTime="               + this.toPercentEncoding( format( "%.3f", this.cpuTime ) );
         url += "&swapTime="              + this.toPercentEncoding( format( "%.3f", this.swapTime ) );
         url += "&swapTransferRate="      + this.toPercentEncoding( format( "%.3f", this.swapTransferRate ) );
         url += "&totalIndex="            + Math.round( this.totalIndex ).toString();
         url += "&cpuIndex="              + Math.round( this.cpuIndex ).toString();
         url += "&swapIndex="             + Math.round( this.swapIndex ).toString();
         url += "&machineInfo="           + this.toPercentEncoding( this.machineInfo );
         url += "&motherboardInfo="       + this.toPercentEncoding( this.motherboardInfo );
         url += "&diskInfo="              + this.toPercentEncoding( this.diskInfo );
         url += "&comments="              + this.toPercentEncoding( this.comments );

         let responseFilePath = File.systemTempDirectory + "/benchmark-sr.txt";

         console.writeln( "<end><cbr><br><b>Sending benchmark data to server...</b>" );
         //console.writeln( "<raw>" + url + "</raw>" );
         console.flush();

         (new FileDownload( url, responseFilePath )).perform();

         let response = File.readFile( responseFilePath ).toString();
         if ( response.indexOf( "<* OK *>" ) == 0 )
         {
            this.serverResponse = response.substring( 8 ).trim();
            console.writeln( "<end><cbr>Server response:<br><raw>" + this.serverResponse + "</raw>" );
            console.noteln( "Benchmark data have been sent successfully." );
            return true;
         }
         this.serverResponse = response;
         console.criticalln( "<end><cbr>*** Error: Failed to send benchmark data. Server response:<br><raw>" + response + "</raw>" );
         return false;
      }
      catch ( e )
      {
         this.serverResponse = "";
         console.criticalln( "<end><cbr>", e.toString() );
         return false;
      }
   };

   /*
    * Download the official benchmark image. Returns a local file path.
    */
   this.download = function()
   {
      console.writeln( "<end><cbr><br><b>Downloading benchmark input image:</b>" );
      let localPath = File.systemTempDirectory + "/pixinsight_benchmark_v1.fit";
      if ( this.forceDownload || !File.exists( localPath ) )
      {
         let remoteURL = (this.secureConnections ? "https" : "http") + "://pixinsight.com/benchmark/data/v1/RGB.fit";
         console.writeln( remoteURL );
         try
         {
            if ( this.progress )
            {
               this.progress.setText( "Downloading benchmark input image..." );
               this.progress.show();
            }
            let download = new BenchmarkFileDownload( localPath, this.progress );
            download.setSSL( this.secureConnections );
            download.setURL( remoteURL );
            download.download();
            download.flush();
            if ( this.progress )
               if ( this.progress.canceled )
                  throw "";
         }
         catch ( e )
         {
            if ( File.exists( localPath ) )
               File.remove( localPath );
            let t = e.toString();
            if ( t.length > 0 )
               console.criticalln( "<end><cbr>", t );
            return "";
         }
      }
      else
      {
         console.noteln( "* Loading already existing local file:" );
         console.noteln( localPath );
      }
      return localPath;
   };

   /*
    * Returns true if the specified file is a valid benchmark image.
    */
   this.validateInput = function( filePath )
   {
      console.writeln( "<end><cbr><br><b>Validating benchmark input file:</b>" );
      console.writeln( filePath );
      let sha1 = (new CryptographicHash( CryptographicHash_SHA1 )).hash( File.readFile( filePath ) ).toHex();
      if ( sha1 == INPUT_CHECKSUM )
      {
         console.writeln( "Valid file, SHA1 = ", sha1 );
         return true;
      }
      console.writeln( "Invalid file, SHA1 = ", sha1, ", expected ", INPUT_CHECKSUM );
      return false;
   };

   /*
    * Loads the benchmark image. Returns an ImageWindow object.
    */
   this.load = function( filePath )
   {
      return ImageWindow.open( filePath, "benchmark" )[0];
   };

   /*
    * Cosmetic corrections for the official benchmark image.
    */
   this.cosmetics = function( image )
   {
      function fixColumn( image, x )
      {
         if ( x > 0 && x < image.width-1 )
            for ( let i = 0; i < image.numberOfChannels; ++i )
               for ( let y = 0; y < image.height; ++y )
                  image.setSample( (image.sample( x-1, y, i ) + image.sample( x+1, y, i ))/2, x, y, i );
      }

      function fixRow( image, y )
      {
         if ( y > 0 && y < image.height-1 )
            for ( let i = 0; i < image.numberOfChannels; ++i )
               for ( let x = 0; x < image.width; ++x )
                  image.setSample( (image.sample( x, y-1, i ) + image.sample( x, y+1, i ))/2, x, y, i );
      }

      for ( let i = 0; i < 2; ++i )
      {
         fixColumn( image, 332 );
         fixColumn( image, 333 );
         fixColumn( image, 337 );
         fixColumn( image, 338 );
         fixColumn( image, 345 );
         fixColumn( image, 346 );
         fixColumn( image, 355 );
      }
      // No rows to fix in this version
   };

   /*
    * Draws a watermark on the benchmark's output image.
    */
   this.watermark = function( image )
   {
      const text = "PixInsight Benchmark v" + BENCHMARK_VERSION +
         format( ": TOTAL=%.0f CPU=%.0f SWAP=%.0f", this.totalIndex, this.cpuIndex, this.swapIndex );

      // Create the font
      let font = new Font( "Open Sans" );
      font.pixelSize = 26;

      let innerMargin = Math.round( font.pixelSize/5 );
      let width = font.width( text ) + 2*innerMargin;
      let height = font.ascent + font.descent + 2*innerMargin;

      let bmp = new Bitmap( width, height );
      bmp.fill( 0x80000000 );

      let G = new Graphics( bmp );
      G.font = font;
      G.pen = new Pen( 0xffff7f00 );
      G.transparentBackground = true; // draw text with transparent bkg
      G.textAntialiasing = true;
      G.drawText( innerMargin, height - font.descent - innerMargin, text );
      G.end();

      image.selectedPoint = new Point( (image.width - width) >> 1, image.height - height - 8 );
      image.blend( bmp );
   };

   /*
    * Close the output image window. Returns true if a window was closed.
    */
   this.closeWindow = function()
   {
      if ( this.window )
         if ( !this.window.isNull )
         {
            this.window.forceClose();
            this.window = undefined;
            return true;
         }
      return false;
   };

   /*
    * A random sequence of n characters, including uppercase letters and
    * decimal digits.
    */
   this.randomId = function( n )
   {
      const chars = "A9B0CD8E1F7G2H6I3J4K5L4MN5OP3Q6R2S7TU1V8W0X9YZ";
      let scale = chars.length - 1;
      let id = "";
      for ( let i = 0; i < n; ++i )
         id += chars[Math.round( scale*Math.random() )];
      return id;
   };

   /*
    * Elapsed time represented as mm:ss.ss
    */
   this.timeAsString = function( seconds )
   {
      let minutes = seconds/60;
      return format( "%02.0f:%05.2f", Math.trunc( minutes ), 60*Math.frac( minutes ) );
   };

   /*
    * Returns a percent-encoded version of a string.
    */
   this.toPercentEncoding = function( s )
   {
      function nibbleToHex( n )
      {
         return "0123456789ABCDEF"[n & 0xf];
      }

      let e = new String;
      for ( let i = 0, n = s.length; i < n; ++i )
      {
         let c = s.charCodeAt( i );
         if ( c > 0 )
            if (   c >= 0x61 && c <= 0x7A  // a ... z
                || c >= 0x41 && c <= 0x5A  // A ... Z
                || c >= 0x30 && c <= 0x39  // 0 ... 9
                || c == 0x2D               // -
                || c == 0x2E               // .
                || c == 0x5F               // _
                || c == 0x7E )             // ~
            {
               e += s[i];
            }
            else
            {
               e += '%';
               e += nibbleToHex( (c & 0xf0) >> 4 );
               e += nibbleToHex( c & 0x0f );
            }
      }
      return e;
   };

   this.hasOptionalItems = function()
   {
      return this.machineInfo.length > 0 ||
             this.motherboardInfo.length > 0 ||
             this.diskInfo.length > 0 ||
             this.comments.length > 0;
   };

   /*
    * Benchmark Instances
    * Execution times on reference machine
    */
   this.instances = function()
   {
      let P = [];

      /*
       * 0.040 s
       */
      let P01 = new BackgroundNeutralization;
      P01.backgroundReferenceViewId = "";
      P01.backgroundLow = 0.0000000;
      P01.backgroundHigh = 0.1000000;
      P01.useROI = true;
      P01.roiX0 = 106;
      P01.roiY0 = 57;
      P01.roiX1 = 260;
      P01.roiY1 = 173;
      P01.mode = BackgroundNeutralization.prototype.RescaleAsNeeded;
      P01.targetBackground = 0.0010000;
      P.push( P01 );

      /*
       * 0.079 s
       */
      let P02 = new ColorCalibration;
      P02.whiteReferenceViewId = "";
      P02.whiteLow = 0.0000000;
      P02.whiteHigh = 0.9000000;
      P02.whiteUseROI = true;
      P02.whiteROIX0 = 114;
      P02.whiteROIY0 = 79;
      P02.whiteROIX1 = 839;
      P02.whiteROIY1 = 874;
      P02.structureDetection = false;
      P02.structureLayers = 5;
      P02.noiseLayers = 1;
      P02.manualWhiteBalance = false;
      P02.manualRedFactor = 1.0000;
      P02.manualGreenFactor = 1.0000;
      P02.manualBlueFactor = 1.0000;
      P02.backgroundReferenceViewId = "";
      P02.backgroundLow = 0.0000000;
      P02.backgroundHigh = 0.1000000;
      P02.backgroundUseROI = true;
      P02.backgroundROIX0 = 106;
      P02.backgroundROIY0 = 57;
      P02.backgroundROIX1 = 260;
      P02.backgroundROIY1 = 173;
      P02.outputWhiteReferenceMask = false;
      P02.outputBackgroundReferenceMask = false;
      P.push( P02 );

      /*
       * 0.016 s
       */
      let P03 = new DynamicCrop;
      P03.centerX = 0.50052;
      P03.centerY = 0.49018;
      P03.width = 0.93264;
      P03.height = 0.93071;
      P03.angle = 0.0000;
      P03.scaleX = 1.00000;
      P03.scaleY = 1.00000;
      P03.optimizeFast = true;
      P03.interpolation = DynamicCrop.prototype.Auto;
      P03.clampingThreshold = 0.00;
      P03.smoothness = 1.50;
      P03.red = 0.000000;
      P03.green = 0.000000;
      P03.blue = 0.000000;
      P03.alpha = 1.000000;
      P.push( P03 );

      /*
       * 4.676 s
       */
      let P04 = new MultiscaleMedianTransform;
      P04.layers = [ // enabled, biasEnabled, bias, noiseReductionEnabled, noiseReductionThreshold, noiseReductionAmount, noiseReductionAdaptive
         [true, true, 0.000, false, 1.0000, 1.00, 0.0000],
         [true, true, 0.000, true, 4.0000, 0.80, 0.2000],
         [true, true, 0.000, true, 2.0000, 0.80, 0.2000],
         [true, true, 0.000, true, 1.0000, 0.80, 0.1000],
         [true, true, 0.000, false, 1.0000, 1.00, 0.0000]
      ];
      P04.transform = MultiscaleMedianTransform.prototype.MedianWaveletTransform;
      P04.medianWaveletThreshold = 5.00;
      P04.scaleDelta = 0;
      P04.linearMask = true;
      P04.linearMaskAmpFactor = 500;
      P04.linearMaskSmoothness = 1.00;
      P04.linearMaskInverted = true;
      P04.linearMaskPreview = false;
      P04.lowRange = 0.0000;
      P04.highRange = 0.0000;
      P04.previewMode = MultiscaleMedianTransform.prototype.Disabled;
      P04.previewLayer = 0;
      P04.toLuminance = true;
      P04.toChrominance = true;
      P04.linear = false;
      P.push( P04 );

      /*
       * 0.108 s
       */
      let P05 = new HistogramTransformation;
      P05.H = [ // c0, m, c1, r0, r1
         [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000],
         [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000],
         [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000],
         [0.00565845, 0.00055048, 1.00000000, 0.00000000, 1.00000000],
         [0.00000000, 0.50000000, 1.00000000, 0.00000000, 1.00000000]
      ];
      P.push( P05 );

      /*
       * 0.952 s
       */
      let P06 = new HDRMultiscaleTransform;
      P06.numberOfLayers = 5;
      P06.numberOfIterations = 1;
      P06.invertedIterations = true;
      P06.overdrive = 0.000;
      P06.medianTransform = false;
      P06.scalingFunctionData = [
         0.003906,0.015625,0.023438,0.015625,0.003906,
         0.015625,0.0625,0.09375,0.0625,0.015625,
         0.023438,0.09375,0.140625,0.09375,0.023438,
         0.015625,0.0625,0.09375,0.0625,0.015625,
         0.003906,0.015625,0.023438,0.015625,0.003906
      ];
      P06.scalingFunctionRowFilter = [
         0.0625,0.25,
         0.375,0.25,
         0.0625
      ];
      P06.scalingFunctionColFilter = [
         0.0625,0.25,
         0.375,0.25,
         0.0625
      ];
      P06.scalingFunctionName = "B3 Spline (5)";
      P06.deringing = false;
      P06.smallScaleDeringing = 0.000;
      P06.largeScaleDeringing = 0.250;
      P06.outputDeringingMaps = false;
      P06.midtonesBalanceMode = HDRMultiscaleTransform.prototype.Automatic;
      P06.midtonesBalance = 0.500000;
      P06.toLightness = false;
      P06.preserveHue = false;
      P06.luminanceMask = true;
      P.push( P06 );

      /*
       * 0.046 s
       */
      let P07 = new CurvesTransformation;
      P07.R = [ // x, y
         [0.00000, 0.00000],
         [1.00000, 1.00000]
      ];
      P07.Rt = CurvesTransformation.prototype.AkimaSubsplines;
      P07.G = [ // x, y
         [0.00000, 0.00000],
         [1.00000, 1.00000]
      ];
      P07.Gt = CurvesTransformation.prototype.AkimaSubsplines;
      P07.B = [ // x, y
         [0.00000, 0.00000],
         [1.00000, 1.00000]
      ];
      P07.Bt = CurvesTransformation.prototype.AkimaSubsplines;
      P07.K = [ // x, y
         [0.00000, 0.00000],
         [0.23797, 0.12567],
         [0.51070, 0.46257],
         [1.00000, 1.00000]
      ];
      P07.Kt = CurvesTransformation.prototype.AkimaSubsplines;
      P07.L = [ // x, y
         [0.00000, 0.00000],
         [1.00000, 1.00000]
      ];
      P07.Lt = CurvesTransformation.prototype.AkimaSubsplines;
      P07.a = [ // x, y
         [0.00000, 0.00000],
         [1.00000, 1.00000]
      ];
      P07.at = CurvesTransformation.prototype.AkimaSubsplines;
      P07.b = [ // x, y
         [0.00000, 0.00000],
         [1.00000, 1.00000]
      ];
      P07.bt = CurvesTransformation.prototype.AkimaSubsplines;
      P07.c = [ // x, y
         [0.00000, 0.00000],
         [1.00000, 1.00000]
      ];
      P07.ct = CurvesTransformation.prototype.AkimaSubsplines;
      P07.H = [ // x, y
         [0.00000, 0.00000],
         [1.00000, 1.00000]
      ];
      P07.Ht = CurvesTransformation.prototype.AkimaSubsplines;
      P07.S = [ // x, y
         [0.00000, 0.00000],
         [1.00000, 1.00000]
      ];
      P07.St = CurvesTransformation.prototype.AkimaSubsplines;
      P.push( P07 );

      /*
       * 0.101 s
       */
      let P08 = new CurvesTransformation;
      P08.R = [ // x, y
         [0.00000, 0.00000],
         [1.00000, 1.00000]
      ];
      P08.Rt = CurvesTransformation.prototype.AkimaSubsplines;
      P08.G = [ // x, y
         [0.00000, 0.00000],
         [1.00000, 1.00000]
      ];
      P08.Gt = CurvesTransformation.prototype.AkimaSubsplines;
      P08.B = [ // x, y
         [0.00000, 0.00000],
         [1.00000, 1.00000]
      ];
      P08.Bt = CurvesTransformation.prototype.AkimaSubsplines;
      P08.K = [ // x, y
         [0.00000, 0.00000],
         [1.00000, 1.00000]
      ];
      P08.Kt = CurvesTransformation.prototype.AkimaSubsplines;
      P08.L = [ // x, y
         [0.00000, 0.00000],
         [1.00000, 1.00000]
      ];
      P08.Lt = CurvesTransformation.prototype.AkimaSubsplines;
      P08.a = [ // x, y
         [0.00000, 0.00000],
         [1.00000, 1.00000]
      ];
      P08.at = CurvesTransformation.prototype.AkimaSubsplines;
      P08.b = [ // x, y
         [0.00000, 0.00000],
         [1.00000, 1.00000]
      ];
      P08.bt = CurvesTransformation.prototype.AkimaSubsplines;
      P08.c = [ // x, y
         [0.00000, 0.00000],
         [1.00000, 1.00000]
      ];
      P08.ct = CurvesTransformation.prototype.AkimaSubsplines;
      P08.H = [ // x, y
         [0.00000, 0.00000],
         [1.00000, 1.00000]
      ];
      P08.Ht = CurvesTransformation.prototype.AkimaSubsplines;
      P08.S = [ // x, y
         [0.00000, 0.00000],
         [0.17380, 0.40374],
         [0.38235, 0.64439],
         [1.00000, 1.00000]
      ];
      P08.St = CurvesTransformation.prototype.AkimaSubsplines;
      P.push( P08 );

      /*
       * 0.098 s
       */
      let P09 = new SCNR;
      P09.amount = 1.00;
      P09.protectionMethod = SCNR.prototype.AverageNeutral;
      P09.colorToRemove = SCNR.prototype.Green;
      P09.preserveLightness = true;
      P.push( P09 );

      /*
       * 0.886 s
       */
      let P10 = new Resample;
      P10.xSize = 9.1022;
      P10.ySize = 9.1022;
      P10.mode = Resample.prototype.RelativeDimensions;
      P10.absoluteMode = Resample.prototype.ForceWidthAndHeight;
      P10.xResolution = 72.000;
      P10.yResolution = 72.000;
      P10.metric = false;
      P10.forceResolution = false;
      P10.interpolation = Resample.prototype.Auto;
      P10.clampingThreshold = 0.30;
      P10.smoothness = 1.50;
      P.push( P10 );

      /*
       * 0.735 s
       */
      let P11 = new Resample;
      P11.xSize = 0.2500;
      P11.ySize = 0.2500;
      P11.mode = Resample.prototype.RelativeDimensions;
      P11.absoluteMode = Resample.prototype.ForceWidthAndHeight;
      P11.xResolution = 72.000;
      P11.yResolution = 72.000;
      P11.metric = false;
      P11.forceResolution = false;
      P11.interpolation = Resample.prototype.Auto;
      P11.clampingThreshold = 0.30;
      P11.smoothness = 1.50;
      P.push( P11 );

      /*
       * 2.856 s
       */
      let P12 = new Resample;
      P12.xSize = 8.0000;
      P12.ySize = 8.0000;
      P12.mode = Resample.prototype.RelativeDimensions;
      P12.absoluteMode = Resample.prototype.ForceWidthAndHeight;
      P12.xResolution = 72.000;
      P12.yResolution = 72.000;
      P12.metric = false;
      P12.forceResolution = false;
      P12.interpolation = Resample.prototype.Auto;
      P12.clampingThreshold = 0.30;
      P12.smoothness = 1.50;
      P.push( P12 );

      /*
       * 3.698 s
       */
      let P13 = new Resample;
      P13.xSize = 0.5000;
      P13.ySize = 0.5000;
      P13.mode = Resample.prototype.RelativeDimensions;
      P13.absoluteMode = Resample.prototype.ForceWidthAndHeight;
      P13.xResolution = 72.000;
      P13.yResolution = 72.000;
      P13.metric = false;
      P13.forceResolution = false;
      P13.interpolation = Resample.prototype.Auto;
      P13.clampingThreshold = 0.30;
      P13.smoothness = 1.50;
      P.push( P13 );

      /*
       * 4.004 s
       */
      let P14 = new UnsharpMask;
      P14.sigma = 8.00;
      P14.amount = 0.80;
      P14.useLuminance = false;
      P14.linear = false;
      P14.deringing = false;
      P14.deringingDark = 0.0200;
      P14.deringingBright = 0.0000;
      P14.outputDeringingMaps = false;
      P14.rangeLow = 0.0000000;
      P14.rangeHigh = 0.0000000;
      P.push( P14 );

      /*
       * 0.500 s
       */
      let P15 = new Resample;
      P15.xSize = 0.1250;
      P15.ySize = 0.1250;
      P15.mode = Resample.prototype.RelativeDimensions;
      P15.absoluteMode = Resample.prototype.ForceWidthAndHeight;
      P15.xResolution = 72.000;
      P15.yResolution = 72.000;
      P15.metric = false;
      P15.forceResolution = false;
      P15.interpolation = Resample.prototype.Auto;
      P15.clampingThreshold = 0.30;
      P15.smoothness = 1.50;
      P.push( P15 );

      return P;
   };

   this.reset();
}

Benchmark.prototype = new Object;

// ----------------------------------------------------------------------------

function BenchmarkFrontPageDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   //

   this.title_Label = new Label( this );
   this.title_Label.useRichText = true;
   this.title_Label.styleSheet = this.scaledStyleSheet(
      "QWidget {"
   +     "font-family: Open Sans, DejaVu Sans, sans-serif;"
   +     "font-size: 18pt;"
   +     "font-weight: 200;"
   +     "color: #0066ff;"
   +     "padding: 4px;"
   +  "}" );
   this.title_Label.text =
   "<p>" +
      "Welcome to PixInsight Benchmark version " + BENCHMARK_VERSION_BIG +
   "</p>";

   this.info_Label = new Label( this );
   this.info_Label.wordWrapping = true;
   this.info_Label.useRichText = true;
   this.info_Label.styleSheet = this.scaledStyleSheet(
      "QWidget {"
   +     "font-family: Open Sans, DejaVu Sans, sans-serif;"
   +     "font-size: 10pt;"
   +     "padding: 4px;"
   +  "}" );
   this.info_Label.text =
   "<p>" +
      "This script will evaluate the performance of your machine for execution " +
      "of intermediate and advanced image processing tasks with PixInsight. This " +
      "process has been carefully designed to provide you with reliable estimates " +
      "of quality for your actual user experience on the PixInsight platform. " +
      "These estimates have been standardized so that they are directly comparable " +
      "to other benchmark results obtained with different hardware and/or PixInsight " +
      "versions." +
   "</p>" +
   "<p>" +
      "The PixInsight benchmark is a community-driven project. By submitting your " +
      "benchmark results, you help us build a comprehensive database of benchmark " +
      "data. This is an invaluable resource, both for us to improve our software and " +
      "for other users to make hardware-related decisions. Benchmark submission is " +
      "optional and a completely anonymous process." +
   "</p>" +
   "<p>" +
      "If you want to proceed, click the Enter button below. To ensure the best possible " +
      "results, make sure that you don't have other applications running, including " +
      "background processes such as operating system or application updates. A benchmark " +
      "may take a while to complete, from just 10 seconds to several minutes, depending " +
      "on your computer's performance." +
   "</p>" +
   "<p>" +
      "For more information on the PixInsight Benchmark project, please visit:" +
   "</p>" +
   "<p>" +
      "http://pixinsight.com/benchmark/" +
   "</p>";

   //

   this.enter_Button = new PushButton( this );
   this.enter_Button.text = "Enter";
   this.enter_Button.icon = this.scaledResource( ":/icons/next.png" );
   this.enter_Button.onClick = function()
   {
      this.dialog.ok();
   };

   this.close_Button = new PushButton( this );
   this.close_Button.text = "Close";
   this.close_Button.icon = this.scaledResource( ":/icons/close.png" );
   this.close_Button.onClick = function()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 8;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.enter_Button );
   this.buttons_Sizer.add( this.close_Button );

   //

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 8;
   this.sizer.add( this.title_Label );
   this.sizer.add( this.info_Label );
   this.sizer.addSpacing( 8 );
   this.sizer.add( this.buttons_Sizer );
   this.scaledMinWidth = 600;
   this.adjustToContents();
   this.setFixedSize();

   //

   this.windowTitle = TITLE + " Script v" + VERSION;
}

BenchmarkFrontPageDialog.prototype = new Dialog;

// ----------------------------------------------------------------------------

function BenchmarkDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   //

   this.benchmarks = new Array;
   this.benchmarkCounter = 0;

   //

   this.run_Button = new PushButton( this );
   this.run_Button.text = "Run Benchmark";
   this.run_Button.icon = this.scaledResource( ":/icons/play.png" );
   this.run_Button.toolTip =
      "<p>Run a new benchmark and add it to the list.</p>";
   this.run_Button.onClick = function()
   {
      this.dialog.enabled = false;
      processEvents();
      let B = new Benchmark;
      B.secureConnections = this.dialog.secureConnections_CheckBox.checked;
      B.forceDownload = this.dialog.forceDownload_CheckBox.checked;
      B.showImage = this.dialog.showImages_CheckBox.checked;
      if ( B.perform() )
      {
         B.sequenceIndex = ++this.dialog.benchmarkCounter;
         this.dialog.benchmarks.push( B );
         this.dialog.sortByTotalPerformance();
         this.dialog.regenerate();
      }
      this.dialog.enabled = true;
   };

   this.report_Button = new PushButton( this );
   this.report_Button.text = "Report";
   this.report_Button.icon = this.scaledResource( ":/icons/window-text.png" );
   this.report_Button.toolTip =
      "<p>View a text report of the selected benchmarks.</p>";
   this.report_Button.onClick = function()
   {
      if ( this.dialog.benchmarks.length < 1 )
      {
         this.dialog.noBenchmarksErrorMessage();
         return;
      }

      let text = this.dialog.reportHeader();
      let selection = this.dialog.hasSelection();
      for ( let i = 0; i < this.dialog.benchmarks.length; ++i )
         if ( !selection || this.dialog.benchmarks_TreeBox.child( i ).selected )
         {
            text += '\n';
            let s = this.dialog.benchmarks[i].report();
            for ( let j = 0; j < s.length; ++j )
               text += s[j] + '\n';
            text += this.dialog.reportSeparator();
         }
      (new BenchmarkReportDialog( text )).execute();
   };

   this.delete_Button = new PushButton( this );
   this.delete_Button.text = "Delete";
   this.delete_Button.icon = this.scaledResource( ":/icons/delete.png" );
   this.delete_Button.toolTip =
      "<p>Delete selected benchmarks.</p>";
   this.delete_Button.onClick = function()
   {
      if ( this.dialog.benchmarks.length < 1 )
      {
         this.dialog.noBenchmarksErrorMessage();
         return;
      }

      let newBenchmarks = new Array;
      if ( this.dialog.hasSelection() )
         for ( let i = 0; i < this.dialog.benchmarks.length; ++i )
            if ( !this.dialog.benchmarks_TreeBox.child( i ).selected )
               newBenchmarks.push( this.dialog.benchmarks[i] );
      if ( (new MessageBox( (newBenchmarks.length > 0) ? "Delete selected benchmarks?" : "Delete all benchmarks?",
                            TITLE, StdIcon_Warning, StdButton_Yes, StdButton_No )).execute() == StdButton_Yes )
      {
         this.dialog.benchmarks = newBenchmarks;
         this.dialog.regenerate();
      }
   };

   this.closeWindows_Button = new PushButton( this );
   this.closeWindows_Button.text = "Close Images";
   this.closeWindows_Button.icon = this.scaledResource( ":/icons/window-close-all.png" );
   this.closeWindows_Button.toolTip =
      "<p>Close benchmark output images.</p>" +
      "<p>Note: Image windows generated by deleted benchmarks won't be closed.</p>";
   this.closeWindows_Button.onClick = function()
   {
      let n = 0;
      for ( let i = 0; i < this.dialog.benchmarks.length; ++i )
         if ( this.dialog.benchmarks[i].closeWindow() )
            ++n;
      (new MessageBox( "<p>" + ((n == 1) ? "One image has" : n.toString() + " images have") + " been closed.</p>",
                       TITLE, StdIcon_Information, StdButton_Ok )).execute();
   };

   this.submit_Button = new PushButton( this );
   this.submit_Button.text = "Submit";
   this.submit_Button.icon = this.scaledResource( ":/icons/upload.png" );
   this.submit_Button.toolTip =
      "<p>Upload the best benchmark to the server. The best benchmark is the one " +
      "with the higher total performance index, which corresponds to the first row " +
      "in the list below.</p>" +
      "<p>You must perform at least three benchmarks before submission. This reduces " +
      "the probability of sending occasional poor results, which improves the " +
      "reliability of the whole benchmark system.</p>";
   this.submit_Button.onClick = function()
   {
      if ( this.dialog.benchmarks.length < 3 )
      {
         if ( this.dialog.benchmarks.length < 1 )
            this.dialog.noBenchmarksErrorMessage();
         else
            (new MessageBox( "<p>You have to perform at least three benchmarks before " +
                             "submitting data to the server.</p>", TITLE, StdIcon_Error, StdButton_Ok )).execute();
         return;
      }

      let d = new BenchmarkSubmissionDialog;
      if ( d.execute() )
      {
         this.dialog.enabled = false;
         processEvents();
         let B = this.dialog.benchmarks[0];
         B.secureConnections = this.dialog.secureConnections_CheckBox.checked;
         B.machineInfo = d.machineInfo;
         B.motherboardInfo = d.motherboardInfo;
         B.diskInfo = d.diskInfo;
         B.comments = d.comments;
         if ( B.submit() )
         {
            this.enabled = false;
            this.toolTip = "<p>You already have submitted your benchmark data. Thank you!</p>";

            let text = this.dialog.reportHeader();
            text += '\n';
            let s = B.report();
            for ( let j = 0; j < s.length; ++j )
               text += s[j] + '\n';
            text += this.dialog.reportSeparator();
            text += '\n';
            text += B.serverResponse;
            (new BenchmarkReportDialog( text )).execute();
         }
         else
         {
            (new MessageBox( "<p>Failed to send benchmark data. See the console for more information.</p>",
                             TITLE, StdIcon_Error, StdButton_Ok )).execute();
         }
         this.dialog.enabled = true;
      }
   };

   this.actions_Sizer = new HorizontalSizer;
   this.actions_Sizer.spacing = 8;
   this.actions_Sizer.add( this.run_Button );
   this.actions_Sizer.add( this.report_Button );
   this.actions_Sizer.add( this.delete_Button );
   this.actions_Sizer.add( this.closeWindows_Button );
   this.actions_Sizer.addSpacing( 24 );
   this.actions_Sizer.addStretch();
   this.actions_Sizer.add( this.submit_Button );

   //

   this.benchmarks_TreeBox = new TreeBox( this );
   this.benchmarks_TreeBox.multipleSelection = true;
   this.benchmarks_TreeBox.rootDecoration = false;
   this.benchmarks_TreeBox.alternateRowColor = true;
   this.benchmarks_TreeBox.setScaledMinSize( 600, 200 );
   this.benchmarks_TreeBox.numberOfColumns = 6;
   this.benchmarks_TreeBox.headerVisible = true;
   this.benchmarks_TreeBox.setHeaderText( 0, "#" );
   this.benchmarks_TreeBox.setHeaderText( 1, "Serial Number" );
   this.benchmarks_TreeBox.setHeaderText( 2, "Total" );
   this.benchmarks_TreeBox.setHeaderText( 3, "CPU" );
   this.benchmarks_TreeBox.setHeaderText( 4, "Swap" );
   this.benchmarks_TreeBox.setHeaderText( 5, "Transfer MiB/s" );
   this.benchmarks_TreeBox.styleSheet = this.scaledStyleSheet(
        "QTreeView {"
      +    "font-family: DejaVu Sans Mono, monospace;"
      + "}"
      + "QTreeView::item {"
      +    "padding: 4px;"
      + "}"
      + "QHeaderView::section {"
      +    "padding: 2px 4px;"
      + "}" );

   //

   this.secureConnections_CheckBox = new CheckBox( this );
   this.secureConnections_CheckBox.text = "Secure connections";
   this.secureConnections_CheckBox.checked = true;
   this.secureConnections_CheckBox.toolTip =
      "<p>Use secure network connections for transferring benchmark data " +
      "(recommended).</p>";
   this.secureConnections_CheckBox.onClick = function( checked )
   {
      for ( let i = 0; i < this.benchmarks; ++i )
         this.benchmarks[i].secureConnections = checked;
   };

   //

   this.showImages_CheckBox = new CheckBox( this );
   this.showImages_CheckBox.text = "Show image windows";
   this.showImages_CheckBox.checked = true;
   this.showImages_CheckBox.toolTip =
      "<p>Show benchmark final images as new image windows. This does not affect " +
      "benchmark results.</p>";
   this.showImages_CheckBox.onClick = function( checked )
   {
      for ( let i = 0; i < this.benchmarks; ++i )
         this.benchmarks[i].showImage = checked;
   };

   //

   this.forceDownload_CheckBox = new CheckBox( this );
   this.forceDownload_CheckBox.text = "Force input image downloads";
   this.forceDownload_CheckBox.checked = false;
   this.forceDownload_CheckBox.toolTip =
      "<p>By default, if the benchmark input image has already been downloaded, " +
      "the existing local copy will be reused by successive benchmarks. " +
      "Enable this option to force download of the benchmark input image.</p>";
   this.forceDownload_CheckBox.onClick = function( checked )
   {
      for ( let i = 0; i < this.benchmarks; ++i )
         this.benchmarks[i].forceDownload = checked;
   };

   //

   this.options_Sizer = new HorizontalSizer;
   this.options_Sizer.spacing = 16;
   this.options_Sizer.add( this.secureConnections_CheckBox );
   this.options_Sizer.add( this.showImages_CheckBox );
   this.options_Sizer.add( this.forceDownload_CheckBox );
   this.options_Sizer.addStretch();

   //

   this.close_Button = new PushButton( this );
   this.close_Button.text = "Close";
   this.close_Button.icon = this.scaledResource( ":/icons/close.png" );
   this.close_Button.onClick = function()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.close_Button );

   //

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 8;
   this.sizer.add( this.actions_Sizer );
   this.sizer.add( this.benchmarks_TreeBox, 100 );
   this.sizer.add( this.options_Sizer );
   this.sizer.addSpacing( 8 );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = TITLE + " Script v" + VERSION;
   this.scaledMinWidth = 600;
   this.adjustToContents();
   this.setFixedWidth();

   this.sortByTotalPerformance = function()
   {
      this.benchmarks.sort( function( a, b ) { return b.totalIndex - a.totalIndex; } );
   };

   this.sortByCPUPerformance = function()
   {
      this.benchmarks.sort( function( a, b ) { return b.cpuIndex - a.cpuIndex; } );
   };

   this.sortBySwapPerformance = function()
   {
      this.benchmarks.sort( function( a, b ) { return b.swapIndex - a.swapIndex; } );
   };

   this.regenerate = function()
   {
      this.benchmarks_TreeBox.clear();
      for ( let i = 0; i < this.benchmarks.length; ++i )
      {
         let b = this.benchmarks[i];
         let node = new TreeBoxNode;
         this.benchmarks_TreeBox.add( node );
         node.setText( 0, format( "%3d", b.sequenceIndex ) );
         node.setText( 1, b.serialNumber );
         node.setText( 2, format( "%5.0f", b.totalIndex ) );
         node.setText( 3, format( "%5.0f", b.cpuIndex ) );
         node.setText( 4, format( "%5.0f", b.swapIndex ) );
         node.setText( 5, format( "%9.3f", b.swapTransferRate ) );
      }
      for ( let i = 0; i < this.benchmarks_TreeBox.numberOfColumns; ++i )
         this.benchmarks_TreeBox.adjustColumnWidthToContents( i );
   };

   this.hasSelection = function()
   {
      for ( let i = 0; i < this.benchmarks.length; ++i )
         if ( this.benchmarks_TreeBox.child( i ).selected )
            return true;
      return false;
   };

   this.reportHeader = function()
   {
      return "*******************************************************************************\n" +
             "The Official PixInsight Benchmark version " + BENCHMARK_VERSION_BIG + '\n' +
             "Copyright (C) 2014-2015 Pleiades Astrophoto. All Rights Reserved.\n" +
             "*******************************************************************************\n";
   };

   this.reportSeparator = function()
   {
      return "\n*******************************************************************************\n";
   };

   this.noBenchmarksErrorMessage = function()
   {
      (new MessageBox( "<p>No benchmarks have been performed.</p>",
                       TITLE, StdIcon_Error, StdButton_Ok )).execute();
   };

   this.regenerate();
}

BenchmarkDialog.prototype = new Dialog;

// ----------------------------------------------------------------------------

function BenchmarkReportDialog( text )
{
   this.__base__ = Dialog;
   this.__base__();

   this.text = text;

   this.report_TextBox = new TextBox( this );
   this.report_TextBox.setScaledMinSize( 600, 500 );
   this.report_TextBox.readOnly = true;
   this.report_TextBox.styleSheet = this.scaledStyleSheet(
      "QWidget {"
   +     "font-family: DejaVu Sans Mono, monospace;"
   +     "font-size: 9pt;"
   +  "}" );
   this.report_TextBox.text = this.text;

   //

   this.save_Button = new PushButton( this );
   this.save_Button.text = "Save";
   this.save_Button.icon = this.scaledResource( ":/icons/save.png" );
   this.save_Button.onClick = function()
   {
      let saveDialog = new SaveFileDialog;
      saveDialog.caption = "Save Benchmark Report";
      saveDialog.overwritePrompt = true;
      saveDialog.filters = [["Plain Text Files", "*.txt"], ["Any Files", "*"]];
      if ( saveDialog.execute() )
      {
         let file = new File;
         file.createForWriting( saveDialog.fileName );
         file.write( ByteArray.stringToUTF8( text ) );
         file.close();
      }
   };

   //

   this.close_Button = new PushButton( this );
   this.close_Button.text = "Close";
   this.close_Button.icon = this.scaledResource( ":/icons/close.png" );
   this.close_Button.onClick = function()
   {
      this.dialog.cancel();
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.add( this.save_Button );
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.close_Button );

   //

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 8;
   this.sizer.add( this.report_TextBox );
   this.sizer.addSpacing( 8 );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = "Benchmark Report";
   this.adjustToContents();
}

BenchmarkReportDialog.prototype = new Dialog;

// ----------------------------------------------------------------------------

function MyDescriptionTextBox( parent )
{
   this.__base__ = TextBox;
   if ( parent )
      this.__base__( parent );
   else
      this.__base__();

   this.styleSheet = this.scaledStyleSheet(
      "QWidget {"
   +     "font-family: DejaVu Sans Mono, monospace;"
   +     "font-size: 9pt;"
   +  "}" );

   this.setScaledFixedSize( 500, 60 );
}

MyDescriptionTextBox.prototype = new TextBox;

// ----------------------------------------------------------------------------

function BenchmarkSubmissionDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   this.machineInfo = "";
   this.motherboardInfo = "";
   this.diskInfo = "";
   this.comments = "";

   this.help_Label = new Label( this );
   this.help_Label.wordWrapping = true;
   this.help_Label.useRichText = true;
   this.help_Label.text =
   "Before submitting your benchmark, you can fill in the following optional " +
   "fields. Although these items are not required, they are an added value to " +
   "your benchmark data that can make them more useful to the community of " +
   "PixInsight users. The following fields are presented by order of relevance.";

   this.diskInfo_Label = new Label( this );
   this.diskInfo_Label.wordWrapping = true;
   this.diskInfo_Label.useRichText = true;
   this.diskInfo_Label.text = "<b>Swap disks</b><br/>" +
   "If possible, write the brand and model of the hard disk(s) where PixInsight " +
   "stores swap files. Unless you have customized swap file storage via " +
   "preferences, this is the disk where system temporary files are being stored, " +
   "which typically is the machine's main system disk.";

   this.diskInfo_TextBox = new MyDescriptionTextBox( this );

   this.motherboardInfo_Label = new Label( this );
   this.motherboardInfo_Label.wordWrapping = true;
   this.motherboardInfo_Label.useRichText = true;
   this.motherboardInfo_Label.text = "<b>Motherboard</b><br/>" +
   "If you know it, write the brand and model of your computer's motherboard.";

   this.motherboardInfo_TextBox = new MyDescriptionTextBox( this );

   this.machineInfo_Label = new Label( this );
   this.machineInfo_Label.wordWrapping = true;
   this.machineInfo_Label.useRichText = true;
   this.machineInfo_Label.text = "<b>Machine description</b><br/>" +
   "Here you can write your computer's brand and model, or something to help " +
   "identify it in case it is a custom built machine.";

   this.machineInfo_TextBox = new MyDescriptionTextBox( this );

   this.comments_Label = new Label( this );
   this.comments_Label.wordWrapping = true;
   this.comments_Label.useRichText = true;
   this.comments_Label.text = "<b>Comments</b><br/>" +
   "If necessary, write any general comments relevant to your benchmark data.";

   this.comments_TextBox = new MyDescriptionTextBox( this );

   //

   this.submit_Button = new PushButton( this );
   this.submit_Button.text = "Submit";
   this.submit_Button.icon = this.scaledResource( ":/icons/upload.png" );
   this.submit_Button.onClick = function()
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
   this.buttons_Sizer.spacing = 8;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.submit_Button );
   this.buttons_Sizer.add( this.cancel_Button );

   //

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.add( this.help_Label );
   this.sizer.addSpacing( 16 );
   this.sizer.add( this.diskInfo_Label );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.diskInfo_TextBox );
   this.sizer.addSpacing( 8 );
   this.sizer.add( this.motherboardInfo_Label );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.motherboardInfo_TextBox );
   this.sizer.addSpacing( 8 );
   this.sizer.add( this.machineInfo_Label );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.machineInfo_TextBox );
   this.sizer.addSpacing( 8 );
   this.sizer.add( this.comments_Label );
   this.sizer.addSpacing( 4 );
   this.sizer.add( this.comments_TextBox );
   this.sizer.addSpacing( 8 );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = "Submit Benchmark";
   this.adjustToContents();
   this.setFixedSize();

   this.onReturn = function( retVal )
   {
      if ( retVal == StdDialogCode_Ok )
      {
         this.machineInfo = this.machineInfo_TextBox.text.trim();
         this.motherboardInfo = this.motherboardInfo_TextBox.text.trim();
         this.diskInfo = this.diskInfo_TextBox.text.trim();
         this.comments = this.comments_TextBox.text.trim();
      }
   };
}

BenchmarkSubmissionDialog.prototype = new Dialog;

// ----------------------------------------------------------------------------

function MyProgressBar( parent )
{
   this.__base__ = Control;
   if ( parent )
      this.__base__( parent );
   else
      this.__base__();

   this.value = 0;
   this.bounded = true;

   this.setFixedHeight( this.font.tightBoundingRect( "100%" ).height << 1 );

   this.onPaint = function()
   {
      let d = this.logicalPixelsToPhysical( 1 );
      let d2 = d >> 1;
      let G = new Graphics( this );
      G.transparentBackground = true;
      G.textAntialiasing = true;
      G.pen = new Pen( 0xff505050, d );
      G.brush = new Brush( 0xfff0f0f0 );
      G.drawRect( this.boundsRect.deflatedBy( d2 ) );
      G.brush = new Brush( 0xffffa858 );
      if ( this.bounded )
      {
         G.fillRect( d, d, Math.round( this.value*(this.width-d-d2) ), this.height-d-d2 );
         G.pen = new Pen( 0xff000000 );
         G.drawTextRect( this.boundsRect, format( "%d%%", Math.round( this.value*100 ) ), TextAlign_Center );
      }
      else
      {
         if ( this.value >= this.width )
            this.value = 0;
         G.fillRect( Math.max( d, this.value ), d, Math.min( this.value + (this.width >> 2), this.width-d-d2 ), this.height-d-d2 );
      }
      G.end();
   };
}

MyProgressBar.prototype = new Control;

function BenchmarkProgressDialog()
{
   this.__base__ = Dialog;
   this.__base__();

   this.canceled = false;

   //

   this.info_Label = new Label( this );

   this.progress = new MyProgressBar( this );
   this.progress.setScaledFixedSize( 400, 20 );

   //

   this.cancel_Button = new PushButton( this );
   this.cancel_Button.text = "Cancel";
   this.cancel_Button.icon = this.scaledResource( ":/icons/cancel.png" );
   this.cancel_Button.onClick = function()
   {
      this.dialog.canceled = true;
   };

   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add( this.cancel_Button );

   //

   this.sizer = new VerticalSizer;
   this.sizer.margin = 8;
   this.sizer.spacing = 8;
   this.sizer.add( this.info_Label );
   this.sizer.add( this.progress );
   this.sizer.addSpacing( 8 );
   this.sizer.add( this.buttons_Sizer );

   this.windowTitle = TITLE;
   this.adjustToContents();
   this.setFixedSize();

   this.onHide = function()
   {
      this.canceled = true;
   };

   this.setRange = function( minimum, maximum )
   {
      if ( maximum === undefined )
      {
         maximum = minimum;
         minimum = 0;
      }
      minimum |= 0;
      maximum |= 0;
      if ( maximum < minimum )
      {
         let t = minimum;
         minimum = maximum;
         maximum = t;
      }
      this.minimum = minimum;
      this.maximum = maximum;
      this.progress.bounded = this.minimum < this.maximum;
      this.setValue( this.minimum );
   };

   this.setText = function( text )
   {
      this.info_Label.text = text;
      processEvents();
   };

   this.setValue = function( value )
   {
      this.value = Math.range( value, this.minimum, this.maximum );
      if ( this.progress.bounded )
         this.progress.value = (this.value - this.minimum)/(this.maximum - this.minimum);
      else
         this.progress.value++;
      this.progress.update();
      processEvents();
   };

   this.increment = function()
   {
      this.setValue( this.value + 1 );
   };

   this.setRange( 0 );
}

BenchmarkProgressDialog.prototype = new Dialog;

// ----------------------------------------------------------------------------

function BenchmarkFileDownload( localFilePath, progress )
{
   this.__base__ = NetworkTransfer;
   this.__base__();

   this.localFilePath = localFilePath;
   this.localFile = null;
   this.progress = progress;

   this.onDownloadDataAvailable = function( data )
   {
      if ( !this.localFile )
      {
         this.localFile = new File;
         this.localFile.createForWriting( this.localFilePath );
      }
      this.localFile.write( data );
      return true;
   };

   this.onTransferProgress = function( dlTotal, dlCurrent, ulTotal, ulCurrent )
   {
      if ( this.progress )
      {
         if ( this.progress.canceled )
         {
            if ( this.localFile )
            {
               this.localFile.close();
               this.localFile = null;
               if ( File.exists( this.localFilePath ) )
                  File.remove( this.localFilePath );
            }
            return false;
         }

         if ( dlCurrent > 0 )
         {
            if ( !this.localFile )
            {
               this.localFile = new File;
               this.localFile.createForWriting( this.localFilePath );
               this.progress.setRange( dlTotal );
            }
            this.progress.setValue( dlCurrent );
         }
      }

      return true;
   };

   this.flush = function()
   {
      if ( this.localFile )
      {
         this.localFile.flush();
         this.localFile.close();
         this.localFile = null;
      }
   };
}

BenchmarkFileDownload.prototype = new NetworkTransfer;

// ----------------------------------------------------------------------------

function main()
{
   let memSizeGiB = (new SystemId).totalMemorySizeKiB()/1024/1024;
   if ( memSizeGiB < 6 )
   {
      if ( (new MessageBox( "<p>This machine has only " + format( "%.3f GiB", memSizeGiB ) + " of physical RAM.</p>" +
                            "<p>The PixInsight benchmark has been designed for machines with 6 GiB of RAM or more. " +
                            "Running the benchmark on this computer may lead to considerable disk swapping, which can " +
                            "be very slow.</p>" +
                            "<p><b>Do you really want to run the PixInsight benchmark on this machine?</b></p>",
                            TITLE, StdIcon_Warning, StdButton_No, StdButton_Yes )).execute() != StdButton_Yes )
      {
         return;
      }
   }

   console.hide();
   let frontPage = new BenchmarkFrontPageDialog;
   if ( frontPage.execute() )
   {
      let dialog = new BenchmarkDialog;
      for ( ;; )
         if ( !dialog.execute() )
         {
            if ( (new MessageBox( "Do you really want to exit " + TITLE + "?",
                 TITLE, StdIcon_Question, StdButton_No, StdButton_Yes )).execute() == StdButton_Yes )
               break;
         }
   }
}

// ----------------------------------------------------------------------------

main();

// ----------------------------------------------------------------------------
// EOF benchmark.js - Released 2015/10/12 20:16:23 UTC
