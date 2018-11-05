// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// SubframeSelectorReadWriteImage.js - Released 2018-11-05T16:53:08Z
// ----------------------------------------------------------------------------
//
// This file is part of SubframeSelector Script version 1.12
//
// Copyright (C) 2012-2018 Mike Schuster. All Rights Reserved.
// Copyright (C) 2003-2018 Pleiades Astrophoto S.L. All Rights Reserved.
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

if (!File.copy) {
   File.copy = function(filePath, newPath) {
      var backupPath = "";
      if ( File.exists( newPath ) )
      {
#ifgteq __PI_BUILD__ 1075
         if ( File.sameFile( filePath, newPath ) )
            throw new Error( "Attempt to copy a file to itself: " + newPath + " <= " + filePath );
#endif
         for ( var u = 0; ; ++u )
         {
            backupPath = newPath + ".old-" + u.toString();
            if ( !File.exists( backupPath ) )
               break;
         }
         File.move( newPath, backupPath );
      }
      File.copyFile( newPath, filePath );
      if ( backupPath.length > 0 )
         if ( File.exists( backupPath ) )
            File.remove( backupPath );
      /*
      var newFile = new File;
      newFile.createForWriting(newPath);
      var file = new File;
      file.openForReading(filePath);
      var length = 1024 * 1024;
      for (var j = 0; j < file.size; j += length) {
         var byteArray = file.read(
            DataType_ByteArray,
            Math.min(file.size - file.position, length)
         );
         newFile.write(byteArray);
      }
      file.close();
      newFile.close();
      */
   };
}

/*
 * Loads all FITS keywords from the first HDU of the specified FITS file and
 * returns them as an array.
 */
if ( !File.loadFITSKeywords )
   File.loadFITSKeywords = function( filePath )
   {
      function searchCommentSeparator( b )
      {
         var inString = false;
         for ( var i = 9; i < 80; ++i )
            switch ( b.at( i ) )
            {
            case 39: // single quote
               inString ^= true;
               break;
            case 47: // slash
               if ( !inString )
                  return i;
               break;
            }
         return -1;
      }

      var f = new File;
      f.openForReading( filePath );

      var keywords = new Array;
      for ( ;; )
      {
         var rawData = f.read( DataType_ByteArray, 80 );

         var name = rawData.toString( 0, 8 );
         if ( name.toUpperCase() == "END     " ) // end of HDU keyword list?
            break;

         if ( f.isEOF )
            throw new Error( "Unexpected end of file: " + filePath );

         var value;
         var comment;
         if ( rawData.at( 8 ) == 61 ) // value separator (an equal sign at byte 8) present?
         {
            // This is a valued keyword
            var cmtPos = searchCommentSeparator( rawData ); // find comment separator slash
            if ( cmtPos < 0 ) // no comment separator?
               cmtPos = 80;
            value = rawData.toString( 9, cmtPos-9 ); // value substring
            if ( cmtPos < 80 )
               comment = rawData.toString( cmtPos+1, 80-cmtPos-1 ); // comment substring
            else
               comment = new String;
         }
         else
         {
            // No value in this keyword
            value = new String;
            comment = rawData.toString( 8, 80-8 );
         }

         // Perform a naive sanity check: a valid FITS file must begin with a SIMPLE=T keyword.
         if ( keywords.length == 0 )
            if ( name != "SIMPLE  " && value.trim() != 'T' )
               throw new Error( "File does not seem a valid FITS file: " + filePath );

         // Add new keyword. Note: use FITSKeyword with PI >= 1.6.1
         keywords.push( new FITSKeyword( name.trim(), value.trim(), comment.trim() ) );
      }
      f.close();
      return keywords;
   };

function cantReadImageAbort(filePath) {
   (new MessageBox(
      "<p>Error: Can't read image: " + filePath + "</p>" +
      "<p><b>Aborting process due to errors.</b></p>",
      TITLE + "." + VERSION,
      StdIcon_Warning,
      StdButton_Ok
   )).execute();
   console.writeln("");
   console.writeln("Process aborted");
}

function cantReadImageAskUser(filePath) {
   var response = (new MessageBox(
      "<p>Error: Can't read image: " + filePath + "</p>" +
      "<p><b>Do you want to abort the process?</b></p>",
      TITLE + "." + VERSION,
      StdIcon_Warning,
      StdButton_Yes,
      StdButton_No,
      StdButton_NoButton,
      1
   )).execute();
   if (response == StdButton_Yes) {
      console.writeln("");
      console.writeln("Process aborted");
   }
   return response;
}

function cantWriteImageAbort(filePath) {
   (new MessageBox(
      "<p>Error: Can't write image: " + filePath + "</p>" +
      "<p><b>Aborting process due to errors.</b></p>",
      TITLE + "." + VERSION,
      StdIcon_Warning,
      StdButton_Ok
   )).execute();
   console.writeln("");
   console.writeln("Process aborted");
}

function cantWriteImageAskUser(filePath) {
   var response = (new MessageBox(
      "<p>Error: Can't write image: " + filePath + "</p>" +
      "<p><b>Do you want to abort the process?</b></p>",
      TITLE + "." + VERSION,
      StdIcon_Warning,
      StdButton_Yes,
      StdButton_No,
      StdButton_NoButton,
      1
   )).execute();
   if (response == StdButton_Yes) {
      console.writeln("");
      console.writeln("Process aborted");
   }
   return response;
}

function cantMoveImageAbort(filePath) {
   (new MessageBox(
      "<p>Error: Can't move image: " + filePath + "</p>" +
      "<p><b>Aborting process due to errors.</b></p>",
      TITLE + "." + VERSION,
      StdIcon_Warning,
      StdButton_Ok
   )).execute();
   console.writeln("");
   console.writeln("Process aborted");
}

function cantMoveImageAskUser(filePath) {
   var response = (new MessageBox(
      "<p>Error: Can't move image: " + filePath + "</p>" +
      "<p><b>Do you want to abort the process?</b></p>",
      TITLE + "." + VERSION,
      StdIcon_Warning,
      StdButton_Yes,
      StdButton_No,
      StdButton_NoButton,
      1
   )).execute();
   if (response == StdButton_Yes) {
      console.writeln("");
      console.writeln("Process aborted");
   }
   return response;
}

function cantWriteCSVFileAbort(filePath) {
   (new MessageBox(
      "<p>Error: Can't write .csv file: " + filePath + "</p>" +
      "<p><b>Aborting process due to errors.</b></p>",
      TITLE + "." + VERSION,
      StdIcon_Warning,
      StdButton_Ok
   )).execute();
   console.writeln("");
   console.writeln("Process aborted");
}

function cantWriteCSVFileAskUser(filePath) {
   var response = (new MessageBox(
      "<p>Error: Can't write .csv file: " + filePath + "</p>" +
      "<p><b>Do you want to abort the process?</b></p>",
      TITLE + "." + VERSION,
      StdIcon_Warning,
      StdButton_Yes,
      StdButton_No,
      StdButton_NoButton,
      1
   )).execute();
   if (response == StdButton_Yes) {
      console.writeln("");
      console.writeln("Process aborted");
   }
   return response;
}

function readImage(filePath, hints) {
   var imageWindows = ImageWindow.open(filePath);
   if (imageWindows.length != 1) {
      console.writeln("");
      console.writeln("*** Error: multi image file not supported: ", filePath);
      return null;
   }
   return imageWindows[0];

   var extension = File.extractExtension(filePath);

   var fileFormat = new FileFormat(extension, true, false);
   if (fileFormat.isNull) {
      return null;
   }

   var fileFormatInstance = new FileFormatInstance(fileFormat);
   if (fileFormatInstance.isNull) {
      return null;
   }

   var description = fileFormatInstance.open(filePath, hints);
   if (description == null) {
      return null;
   }
   else if (description.length != 1) {
      console.writeln("");
      console.writeln("*** Error: multi image FITS file not supported: ", filePath);
      return null;
   }

   var imageWindow = new ImageWindow(
      1,
      1,
      3,
      32,
      true,
      true,
      uniqueViewId(filterViewId(File.extractName(filePath) + "_target"))
   );
   var mainView = imageWindow.mainView;
   mainView.beginProcess(UndoFlag_NoSwapFile);
   if (!fileFormatInstance.readImage(mainView.image)) {
      fileFormatInstance.close();
      return null;
   }
   mainView.endProcess();

   fileFormatInstance.close();

   try {
      var extensions = fileFormat.fileExtensions;
      for (var i = 0; i != extensions.length; ++i) {
         if (extensions[i] == ".fit") {
            imageWindow.keywords = File.loadFITSKeywords(filePath);
         }
      }
   }
   catch (error) {
      console.writeln("");
      console.writeln("*** Error: Can't load FITS keywords: ", filePath);
   }

   return imageWindow;
}

function writeImage(filePath, imageWindows, ieeefpSampleFormat, hints) {
   var extension = File.extractExtension(filePath);

   var fileFormat = new FileFormat(extension, false, true);
   if (fileFormat.isNull) {
      return null;
   }

   var fileFormatInstance = new FileFormatInstance(fileFormat);
   if (fileFormatInstance.isNull) {
      return null;
   }

   if (!fileFormatInstance.create(filePath, hints)) {
      return null;
   }

   var description = new ImageDescription;
   description.bitsPerSample = ieeefpSampleFormat ? 32 : 8;
   description.ieeefpSampleFormat = ieeefpSampleFormat;
   if (!fileFormatInstance.setOptions(description)) {
      fileFormatInstance.close();
      return null;
   }

   for (var i = 0; i != imageWindows.length; ++i) {
      fileFormatInstance.keywords = imageWindows[i].keywords;
      if (!fileFormatInstance.writeImage(imageWindows[i].mainView.image)) {
         return null;
      }
   }

   fileFormatInstance.close();

   return imageWindows;
}

// ----------------------------------------------------------------------------
// EOF SubframeSelectorReadWriteImage.js - Released 2018-11-05T16:53:08Z
