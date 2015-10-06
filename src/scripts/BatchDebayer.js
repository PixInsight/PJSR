#feature-id    Batch Processing > BatchDeBayer

#feature-info  A batch image deBayer conversion utility for OSC CCD \
               imagers.<br/>\
   <br/>\
   This script allows you to select a set of input image files and an optional \
   output directory. The script then iterates, reading each input file and applying \
   a deBayering algorithm to it, then saving the resulting RGB image on the output \
   directory.<br/>\
   <br/>\
   Copyright (C) 2010 Ken Pendlebury

#feature-icon  Batch_CMYG_DeBayer.xpm

// ======== #includes ==============================================================

#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>
#include <pjsr/UndoFlag.jsh>

// ========= # defines =============================================================

#define DEBUGGING_MODE_ON false
#define TITLE  "Batch Debayer Script"
#define VERSION "1.2.6"
#define COMPILE_DATE "2013/01/18"
#define DEFAULT_EXTENSION  ".fit"

// ========= initialise global variables and data structures =======================
mainDialog.prototype = new Dialog; // create a prototype for a new dialog window
// this will be fully defined later in 'function mainDialog()'

var globalData = new createDataStructure; // create a global data structure to hold all global data

//var deBayerTypes[2] = new Array( ["Super Pixel", "Bilinear" ] );

// ========= initialisation complete, enter main loop ==============================

main();

function createDataStructure()
// only ever called once, during initialisation
// this function call is used to create the global structure called 'globalData'
// variable values are initialised where appropriate
{
   // an array of file names that have been selected for conversion
   // ( this.inputFiles.length provides access to the NUMBER of entries in the array )
   this.inputFiles = new Array;

   // the output path name, defaulted at start-up to ""
   // ( this.outputDirectory.length provides access to the 'length' of the directory path name )
   this.outputDirectory = "";

   // the extension used to filter files when searching, normally set to ".fts" by a #define
   this.outputExtension = DEFAULT_EXTENSION;

   // a flag called 'overwriteExisting', initially set to 'false'
   this.overwriteExisting = false;

   // *** Begin modification by J. Conejero on 2013 Jan 18
   // Evaluate noise and store noise estimates as FITS header keywords.
   this.evaluateNoise = true;
   // *** End modification by J. Conejero on 2013 Jan 18

   var p = new Debayer;
   this.deBayerTypes = new Array;
   this.deBayerTypes.push("Super Pixel");
   this.deBayerTypes.push("Bilinear");
   // *** Begin modification by Z. Vrastil on 2011 Oct 09
   this.deBayerTypes.push("VNG");
   // *** End modification by Z. Vrastil on 2011 Oct 09
   this.deBayerTypesMap = new Array;
   this.deBayerTypesMap.push(p.SuperPixel);
   this.deBayerTypesMap.push(p.Bilinear);
   // *** Begin modification by Z. Vrastil on 2011 Oct 09
   this.deBayerTypesMap.push(p.VNG);
   // *** End modification by Z. Vrastil on 2011 Oct 09

// *** Begin modification by Z. Vrastil on 2011 Oct 09
   this.chosenDeBayerType = "VNG";
   this.chosenDeBayerTypeConstant = p.VNG;
   //this.chosenDeBayerType = "Bilinear";
   //this.chosenDeBayerTypeConstant = p.Bilinear;
   //this.chosenDeBayerType = "Super Pixel";
   //this.chosenDeBayerTypeConstant = Debayer.SuperPixel;
// *** End modification by Z. Vrastil on 2011 Oct 09

   this.bayerPatterns = new Array;
   this.bayerPatterns.push("RGGB");
   this.bayerPatterns.push("BGGR");
   this.bayerPatterns.push("GBRG");
   this.bayerPatterns.push("GRBG");
   this.bayerPatternsMap = new Array;
   this.bayerPatternsMap.push(p.RGGB);
   this.bayerPatternsMap.push(p.BGGR);
   this.bayerPatternsMap.push(p.GBRG);
   this.bayerPatternsMap.push(p.GRBG);
   this.chosenBayerPattern = "RGGB";
   this.chosenBayerPatternConstant = p.RGGB;
}



/*
 *                      MAIN PROCESSING PROCEDURE
 *
 * Various other procedures will be called from here, in order to support this routine
 * These support procedures are called in order to keep this code segment 'tidy'
 */
function deBayer(localData)
// only ever called from within main(), this is the one function NOT called globally
// the local variable 'localData' contains a COPY of the global variable 'globalData', passed by main()
// any changes to 'localData' will NOT therefore be applied to 'globalData'
// it <could> be simpler to directly refer to globalData within this function. However, it is safer and much
// less error-prone to work on a duplicate, since in this way we ensure that this function cannot modify
// the global object. In JavaScript, function arguments are always passed by value. There is no equivalent to
// references and pointers, as in C++, so you cannot pass a constant reference, for example, as can be done
// in C++ to avoid duplicating the data. However, in this case, globalData does not hold a large data structure,
// so copying it as a temporary object is pretty 'cheap' in terms of memory usage and processor time
{
   console.writeln("****************************************************************");
   console.writeln("<b>" + TITLE + " v" + VERSION + " Running...</b>");
   console.writeln("****************************************************************");

   // declare a more 'code-friendly' local variable to contain the number of files that will need to be processed
   var numFiles = localData.inputFiles.length;

   // providing that at least ONE file has been selected for conversion
   if ( numFiles != 0 )
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.writeln( "DeBayer Method   = " + localData.deBayerMethod );
         console.writeln( "Bayer Pattern    = " + localData.bayerPattern );
      }

      // store a value representing the 'start time' of the conversion for each image
      var startTime = Date.now();
      var errorCount = 0;

      // for every file in the image list
      for ( var i = 0; i < numFiles; ++i )
      {
         // create a local variable to hold the source image name (from the indexed entry in the file list)
         var sourceName = localData.inputFiles[i];

         // build the output file path from its separate components : drive + directory + name + extension
         // ##Note## : 'drive' is always an empty string under Linux/UNIX/OSX

         // if the user has specified a (non-zero length) output directory
         // then use this directory, otherwise (:)
         // build it from the extracted Drive and Directory from the path components of the source image
         var fileDir = (localData.outputDirectory.length != 0) ?
            localData.outputDirectory : File.extractDrive( sourceName ) + File.extractDirectory( sourceName );

         // ensure that the directory string ends with a slash separator
         // this step is only necessary if the user has requested a specific output directory
         if ( fileDir.length != 0 && fileDir.charAt( fileDir.length-1 ) != '/' )
            fileDir += '/';

         // extract the file 'name' (as was done above, for the drive letter and the directory path)
         var fileName = File.extractName( sourceName );

         // generate the name for the output image, including a prefixed identifier identifying the deBayering method
         var outputName = fileDir + "debayer_" + fileName + localData.outputExtension;
         var newViewName = fileName + "_RGB";

          // if the user has specified that over-writing an existing file is NOT allowed, then
         if ( !localData.overwriteExisting && File.exists( outputName ) )
         {
            // Obtain a nonexisting file name by appending an underscore and a growing integer to the output file name
            for ( var u = 1; ; ++u )
            {
               // create a temporary file name, and
               var tryFileName = File.appendToName( outputName, '_' + u.toString() );
               // check to see if this new name is acceptable, and
               if ( !File.exists( tryFileName ) )
               {
                  // if it IS acceptable, use it, and
                  outputName = tryFileName;
                  // break out of the 'u' loop
                  break;
               }
            }
         }

         console.writeln("");
         console.writeln("----------------------------------------------------------------");
         console.writeln("<b>Debayer Information:</b>");
         console.writeln("Source:         " + fileName);
         console.writeln("Bayer Pattern:  " + globalData.chosenBayerPattern);
         console.writeln("Debayer Method: " + globalData.chosenDeBayerType);

         // open the (RAW mono) data file, as the ONLY element of an 'image window' array
         // remember that PixInsight maintains a 'collection' of image windows, each of which
         // 'contains' one, or more, 'views', and where each 'view' refers to data that
         // forms the 'image' information for that particular 'view' (where the 'view' could also be a 'preview')
         // we do not need to give this image window a shorter, more meaningful ID, as we will never
         // have to refer to it as part of a 'collection' of image windows. It should normally be one of
         // only TWO image windows open at any given time during the execution of the DeBayer routine
         var inputImageWindow = ImageWindow.open(sourceName);
         // because PI has the ability to open 'many' files at one go, 'ImageWindow.open' creates
         // an 'array' structure - therefore, in order to reference this data we must now use
         // 'inputImageWindow[0]' from here on

         // verify that the newly opened image window array actually contains information capable of being processed
         // (i.e. an image WAS loaded every time, providing we are NOT at the last image file in the input list)
         if ( inputImageWindow.length == 0 && i+1 < numFiles )
         {
            errorCount++;
            // display an error message, and wait for a user "Yes/No" response
            var msg = new MessageBox( "<p>Unable to load input image file:</p>" +
                                      "<p>" + sourceName + "</p>" +
                                      "<p><b>Continue batch deBayer conversion ?</b></p>",
                                      TITLE, StdIcon_Error, StdButton_Yes, StdButton_No );
            // if the user clicks 'No' then exit the loop (in fact, the entire script), stopping all further conversions
            // ##Note## : A 'break' statement will exit the nearest enclosing loop. So, in this case, 'break' exits
            // the 'for every file in the image list' loop. It may be preferable to use a 'return' statement, rather
            // than 'break', since the intention of this code is to abort the entire script if the user response
            // is 'No'. With that in mind, 'return' is more correct and, of course, much safer. For example, what
            // might happen if some code is added after the 'for' loop, which should NOT be executed if the user
            // clicks 'No' in the MessageBox above? ('break' has therefore been replaced with 'return')

            if ( msg.execute() == StdButton_No )
               return;
         }

         if ( DEBUGGING_MODE_ON )
         {
            // display the input image window
            //inputImageWindow[0].show();
            console.writeln("Source Name : ", sourceName);
         }

         // create code-friendly variables for the 'view' and the 'image' of the source file within its ImageWindow
         var sourceView = inputImageWindow[0].mainView;
         var sourceImage = inputImageWindow[0].mainView.image;

         // create code-friendly variables to hold the dimensions of the source image
         var sourceWidth = sourceImage.width;
         var sourceHeight = sourceImage.height;



         if ( DEBUGGING_MODE_ON )
         {
            console.writeln("Path        : ", fileDir);
            console.writeln("Prefix      : ", localData.deBayerName);
            console.writeln("File Name   : ", fileName);
            console.writeln("Extension   : ", localData.outputExtension);
            console.writeln("Output File : ", outputName);
            console.writeln("Image Size  : ", sourceWidth, " pixels W x ", sourceHeight, " pixels H");
         }

          // create an RGB image window to contain the view of the output image from the deBayer algorithm
         // the image will be the same size as the source, but will have three 'colour planes', for Rd, Gn and Bu
         //var outputImageWindow = new ImageWindow(sourceWidth, sourceHeight, 3, 32, true, true, "output");

         // create code-friendly variables to point to the main view, and the actual image of the output ImageWindow
         //var outputView =  outputImageWindow.mainView;
         //var outputImage = outputImageWindow.mainView.image;

         if ( DEBUGGING_MODE_ON )
         {
            // inform the core application that we are going to modify this view's image. Normally, UndoFlag_NoSwapFile
            // avoids the generation of a swap file. Since we are working with a new image, a swap file is not needed,
            // because we will not need to undo anything for this window
            //outputView.beginProcess( UndoFlag_NoSwapFile );

            // ##Note## : In PixInsight, 'View' objects are the unique holders of images within the graphical user interface
            // An 'ImageWindow' is actually a container of 'View' objects, plus a set of graphical resources to allow
            // user interaction with 'Views'. The method 'beginProcess()' is a method of 'View', and is used to inform
            // the core application that the view's image is about to be modified in some way. The 'beginProcess()'
            // method is absolutely necessary for a number of reasons. One of them is that PixInsight is a strongly
            // multithreaded environment. By calling 'beginProcess()', the core application learns that this view
            // is now "busy" and so the application can immediately restrict access to the view from other objects
            // and processes that may be running or that may get called. Another reason is that 'beginProcess()'
            // initializes many important data structures and mechanisms, such as the view's processing history
            // and its associated swap files. Conversely, 'endProcess()' is a method of a 'View' object that informs
            // the core application that the modification process is now complete.

            // initialize the output image with '10% grey' - just to 'prove' that 'something happened' !!!
            //outputImage.fill( 0.5 );
            // advise the core application that processing is complete for this view
            //outputView.endProcess();

            console.writeln("============================================");
            console.writeln("File [" + fileName + "] was processed");
            console.writeln("The output filename was " + outputName);
            console.writeln("");

            // display the image window 'container'
            //outputImageWindow.show();
         }

// *** Begin modification by J. Conejero on 2010 Sep 03

         // Set up the Debayer instance
         var p = new Debayer;
         p.bayerPattern = globalData.chosenBayerPatternConstant;
         p.debayerMethod = globalData.chosenDeBayerTypeConstant;
// *** Begin modification by J. Conejero on 2013 Jan 18
         p.evaluateNoise = globalData.evaluateNoise;
// *** End modification by J. Conejero on 2013 Jan 18

// *** Begin modification by Z. Vrastil on 2011 Oct 09
// ***   New version of Debayer module supports color images
         /*if ( sourceView.image.isColor )
         {
            // If the source view is a RGB color image, then we have a RGB
            // Bayer image. The image is a CFA but each filter component has
            // been stored as a separate plane. Each raw pixel is a 2x2 matrix
            // (one R sample, two G samples and one B sample) and nonexistent
            // elements are black pixel samples on each RGB channel. To
            // reconstruct the monochrome CFA, we simply find the maximum
            // sample of each RGB pixel and store it at the corresponding
            // location of a grayscale image. PixelMath does this task easily.

            // Convert a RGB Bayer image into a CFA monochrome image

            var p1 = new PixelMath;
            p1.expression = "max( $T[0], $T[1], $T[2] )";
            p1.useSingleExpression = true;
            p1.rescale = false;
            p1.createNewImage = true;
            p1.newImageId = "cfa_image";
            p1.newImageColorSpace = p1.Gray;
            p1.newImageSampleFormat = p1.SameAsTarget;

            if ( !p1.executeOn( sourceView ) )
            {
               errorCount++;
               console.writeln( "*** Error: PixelMath failed: " + sourceView.fullId );
            }

            // The original RGB image is no longer needed
            sourceView.window.forceClose();

            // We'll apply Debayer to PixelMath's output image, which is the CFA.
            sourceView = View.viewById( "cfa_image" );

            if ( sourceView.isNull )
            {
               errorCount++;
               console.writeln( "*** Error: Unable to access view: cfa_image" );
            }
         }*/
// *** End modification by Z. Vrastil on 2011 Oct 09

         // Execute Debayer on a monochrome CFA or RGB Bayer image
         if ( !p.executeOn( sourceView ) )
         {
            errorCount++;
            console.writeln( "*** Error: Debayer failed: " + sourceView.fullId );
         }

// *** Begin modification by J. Conejero on 2010 Oct 18
// ***   No need to guess the output image identifier: Debayer now includes a
// ***   read-only property (outputImage) that provides the output view id.
         /*
         // Debayer appends a "_RGB" suffix to identify its output images
         var resultView = View.viewById( sourceView.id + "_RGB" );
         if ( resultView.isNull )
         {
            errorCount++;
            console.writeln( "*** Error: Unable to access view: " + sourceView.id + "_RGB" );
         }
         */
         var resultView = View.viewById( p.outputImage );
         if ( resultView.isNull )
         {
            errorCount++;
            console.writeln( "*** Error: Unable to access view: " + p.outputImage );
         }
// *** End modification by J. Conejero on 2010 Oct 18

         // Original CFA image no longer needed
         sourceView.window.forceClose();

         // Save the output RGB image, disable all warnings and messages
         resultView.window.saveAs( outputName, false, false, false, false );

         // Done with this image
         resultView.window.forceClose();

// *** End modification by J. Conejero on 2010 Sep 03
      }

      var endTime = Date.now();
      console.writeln("");
      console.writeln("****************************************************************");
      console.writeln("Finished processing " + numFiles + " files with " + errorCount + " errors.");
      console.writeln("Total elapsed time: " + (endTime - startTime) / 1000 + " seconds.");
      console.writeln("****************************************************************");
   }
}


/*
 * Main Dialog
 * Used to construct a dialog window that will be called 'fileSelectDialog' in main()
 * Initially, prior to main() being called,
 * a variable 'mainDialog' will have had its 'prototype' property set to 'new Dialog'
 * This action will allow 'mainDialog' to inherit all properties and methods from the core Dialog object
 * The following function, when called from within main(),
 * will 'build' the new 'dialog' variable, whose 'scope' is confined to main(), 'on top' of the core Dialog properties and methods
 */
function mainDialog()
// previously initialised (prototype) at the start of the script
// then only ever called, ONCE, in main(), OUTSIDE the 'for-ever' loop
{
   // Add all properties and methods of the core Dialog object to this object.
   this.__base__ = Dialog;
   this.__base__();

   //

   // create a secondary dialog, which will remain as a 'property' of this 'main' dialog
   // this second dialog will be 'called' when the user clicks the 'DeBayer Setup' button on the 'main' dialog
   // ##Note## : The 'this' object (i.e. the 'mainDialog' object) is 'passed' to setupDialog
   // this is to allow 'visibility' of the 'main' dialog from the second dialog
   //this.setupDialog = new deBayerDialog( this );


   // ##Note## : The dialog looks much better if all labels are right-justified. It is customary
   // to define the minimum (or fixed) width of all labels to be the length, in pixels, of the
   // longest label, taking into account the current dialog font (which is mainly a platform-dependent setting)
   // it is currently assumed that the following label will be the 'widest' one
   var labelWidth1 = this.font.width( " Bayer / Mosaic Pattern: " );

   //

   this.helpLabel = new Label( this ); // adds a new text Label to the dialog box
   this.helpLabel.frameStyle = FrameStyle_Sunken; // defines how the text Label will look
   /* Options are
   FrameStyle_Box    : is provided with a simple, single, solid-line, rectangular border
   FrameStyle_Flat   : has no outline or border, cannot be differentiated from the surrounding area
   FrameStyle_Raised : looks like a standard 'button', but could also be confused for exactly that reason
   FrameStyle_Styled : looks like a combination of the 'Raised' and 'Box' styles
   FrameStyle_Sunken : looks like a 'button' that has been 'pressed'
   */
   this.helpLabel.margin = 4; // applies an 'n-pixel' border on all sides of the control
   this.helpLabel.wordWrapping = true; // allows word-wrapping within the text Label
   this.helpLabel.useRichText = true; // allows simple HTML-style text formatting to be used within the text Label
   // define the text entry for the Label, using basic formatting codes as needed
   this.helpLabel.text =
   "<b>" + TITLE + " v" + VERSION + "</b><br/>" +
   "A batch image debayer conversion utility for OSC CCD and DSLR imagers. " +
   "This script collects a batch of files and applies the Debayer process to " +
   "each with the specified Bayer pattern and debayering method. Then it " +
   "writes the resulting RGB color images to the specified output directory. " +
   "The output format can be selected by modifying the output file extension " +
   "(.fit by default).<br/>" +
   "<br/>" +
   "Based upon an original script created by Niall J. Saunders, with " +
   "contributions from Ken Pendlebury, Juan Conejero and Zbynek Vrastil. " +
   "Last updated on " + COMPILE_DATE + ".";

   //

   // adds a tree box, used to display the list of files selected for conversion
   // ##ToDo## : THIS CONSTRUCT HAS NOT YET BEEN FULLY EXPLORED, AND IS THEREFORE NOT FULLY COMMENTED
   this.files_TreeBox = new TreeBox( this );
   this.files_TreeBox.multipleSelection = true;
   this.files_TreeBox.rootDecoration = false;
   this.files_TreeBox.alternateRowColor = true;
   this.files_TreeBox.setMinSize( 600, 200 );
   // because standard screen space allows, these values have been increased from the original (500, 200) values

   this.files_TreeBox.numberOfColumns = 1;
   this.files_TreeBox.headerVisible = false;

   // for each entry in the 'globalData.inputFiles' array
   for ( var i = 0; i < globalData.inputFiles.length; ++i )
   {
      // populate a single 'node' in the TreeBox with the file name from the array
      var node = new TreeBoxNode( this.files_TreeBox );
      // add the file name to column 0 (in any case, this is a single-column tree box)
      node.setText( 0, globalData.inputFiles[i] );
   }

   //

   // add an 'Add' button - to allow files to be added to the array
   this.filesAdd_Button = new PushButton( this );
   this.filesAdd_Button.text = " Add ";
   this.filesAdd_Button.toolTip = "<p>Add image files to the input images list</p>";

   // create a function to respond when the 'Add' button is clicked
   this.filesAdd_Button.onClick = function()
   {
      // open a new 'API level' dialog box, this time to allow files to be selected for addition to the array
      var ofd = new OpenFileDialog;
      ofd.multipleSelections = true; // multiple files may be added at one time
      ofd.caption = "Select Images"; // this is the caption displayed with the OpenFileDialog window

// *** Begin modification by J. Conejero on 2010 Sep 03

      // Load image filters for all installed file formats able to read images.
      // In this way the script also works for DSLR raw formats.
      ofd.loadImageFilters();

      /*
      // ofd.loadImageFilters(); // the statement would provide NO restriction to the list of input files
      // however, the file list ought to be restricted to '.fts' type files only
      ofd.filters = [[ "FITS Files", ".fit", ".fits", ".fts" ]];
      */

// *** End modification by J. Conejero on 2010 Sep 03


      // here, we assign a set of "format filters". The 'FileDialog.filters' property is
      // an array of arrays (hence the double square brackets [[ and ]]). Each array element is an array formally
      // described as the sequence: <format-filter>: <format-description>, <file-extension-1>[, ... <file-extension-n>]

      // ##ToDo## : THERE IS NO PROVISION FOR MEMORISING THE PATH TO THE LAST SELECTION DIRECTORY
      // (specifically if the script is closed i.e. 'terminated', and then re-started
      // CAN THIS BE IMPLEMENTED WITH THE 'initialPath' PROPERTY

      // this section responds when the 'OPEN' button is finally pressed on the OpenFileDialog window
      // (if the dialog closes WITHOUT the 'OPEN' button having been pressed, then nothing happens)
      if ( ofd.execute() )
      // the 'OPEN' button was pressed
      {
         // disable the TreeBox temporarily, until the array can be updated, and the file list can be repainted
         this.dialog.files_TreeBox.canUpdate = false;
         // for every entry (currently) in the OpenFileDialog.fileNames list
         for ( var i = 0; i < ofd.fileNames.length; ++i )
         {
            // add a new node in the TreeBox
            var node = new TreeBoxNode( this.dialog.files_TreeBox );
            // the '.dialog' (in the statement above) is necessary because this function is a member of
            // 'this.filesAdd_Button', NOT a member of 'this'. It is important to bear in mind that we are still
            // within the body of 'this.filesAdd_Button.onClick'. For this reason, when the function gets
            // executed, "this" refers to a 'Button' object, not to its parent dialog. The 'dialog' and 'parent'
            // properties of 'Control' were specifically created in PixInsight to handle exactly these
            // situations. With 'Control.parent', you can access the parent control of a given control,
            // allowing you to traverse the whole hierarchy recursively. With '.dialog', you can access
            // the parent top-level window of any child control, irrespective of the routine being executed

            // add the file name to column 0
            node.setText( 0, ofd.fileNames[i] );
            // add the filename to the 'globalData.inputFiles' array
            // ##Note## : No 'pointer' is needed for this to happen push() is a method of 'Array' that
            // simply adds a new element at the 'tail' of an existing Array
            globalData.inputFiles.push( ofd.fileNames[i] );
         }
         // re-enable user interaction with the TreeBox, now that the update is complete
         this.dialog.files_TreeBox.canUpdate = true;
      }
   }

   //

   // add a 'Clear' button - to clear ALL files in the TreeBox AND the 'globalData.inputFiles' array to be removed
   this.filesClear_Button = new PushButton( this );
   this.filesClear_Button.text = " Clear ";
   this.filesClear_Button.toolTip = "<p>Clear the list of input images</p>";

   // create a function to respond when the 'Clear' button is clicked
   this.filesClear_Button.onClick = function()
   {
      // clear the TreeBox list
      this.dialog.files_TreeBox.clear();
      // clear the 'globalData.inputFiles' array (simply by resetting the indexing pointer to '0')
      globalData.inputFiles.length = 0;
   }

   //

   // add an 'Invert' button - to invert the current 'selection status' af all files in the Treebox list
   //( this action has no effect on the filenames stored in the 'globalData.inputFiles' array)
   this.filesInvert_Button = new PushButton( this );
   this.filesInvert_Button.text = " Invert Selection ";
   this.filesInvert_Button.toolTip = "<p>Invert the current selection of input images</p>";

   // create a function to respond when the 'Invert' button is clicked
   this.filesInvert_Button.onClick = function()
   {
      // for each entry (node) in the TreeBox list
      for ( var i = 0; i < this.dialog.files_TreeBox.numberOfChildren; ++i )
         // invert the selection status of the node
         this.dialog.files_TreeBox.child( i ).selected =
               !this.dialog.files_TreeBox.child( i ).selected;
   }

   //

   // add a 'Remove' button - to remove ALL files in the TreeBox that are currently selected
   // any files that are thus removed are also cleared from the 'globalData.inputFiles' array as well
   this.filesRemove_Button = new PushButton( this );
   this.filesRemove_Button.text = " Remove Selected ";
   this.filesRemove_Button.toolTip = "<p>Remove all selected images from the input images list</p>";

   // create a function to respond when the 'Remove' button is clicked
   this.filesRemove_Button.onClick = function()
   {
      // first the 'globalData.inputFiles' array is effectively 'cleared' by setting its index pointer to '0'
      globalData.inputFiles.length = 0;
      // then, the COMPLETE TreeBox filename list is scanned and
      for ( var i = 0; i < this.dialog.files_TreeBox.numberOfChildren; ++i )
         // for every entry that has NOT been SELECTED (i.e. every file name that should NOT be deleted)
         if ( !this.dialog.files_TreeBox.child( i ).selected )
            // the filename is copied back to the 'globalData.inputFiles' array
            // push() is a method of 'Array' that simply adds a new element at the tail of an existing Array
            globalData.inputFiles.push( this.dialog.files_TreeBox.child( i ).text( 0 ) );
      // finally, the TreeBox is scanned, this time BACKWARDS, from the END (the 'bottom') to the START (the 'top')
      // (more appropriate, as the 'numberOfChildren' is going to be changing as SELECTED entries are removed)
      for ( var i = this.dialog.files_TreeBox.numberOfChildren; --i >= 0; )
         // remove every entry thas HAS been selected
         if ( this.dialog.files_TreeBox.child( i ).selected )
            this.dialog.files_TreeBox.remove( i );
   }

   //

   // create a new 'HorizontalSizer' group that will contain the four buttons defined above
   this.filesButtons_Sizer = new HorizontalSizer;
   this.filesButtons_Sizer.spacing = 4;
   this.filesButtons_Sizer.add( this.filesAdd_Button );
   // add a dynamically adjustable gap space between the 'Add' and 'Clear' buttons
   this.filesButtons_Sizer.addStretch();
   this.filesButtons_Sizer.add( this.filesClear_Button );
   // add a dynamically adjustable gap space between the 'Clear' and 'Invert Selection' buttons
   this.filesButtons_Sizer.addStretch();
   this.filesButtons_Sizer.add( this.filesInvert_Button );
   this.filesButtons_Sizer.add( this.filesRemove_Button );

   //

   // create a new 'GroupBox' and use it to contain the TreeBox and Buttons_Sizer objects
   this.files_GroupBox = new GroupBox( this );
   // set the GroupBox title
   this.files_GroupBox.title = "Input Images";
   // create a new 'VerticalSizer' group to help space the two horizontal elements being added
   this.files_GroupBox.sizer = new VerticalSizer;
   this.files_GroupBox.sizer.margin = 4;
   this.files_GroupBox.sizer.spacing = 4;
   // add the TreeBox object to the vertical sizer, with a stretch factor of 100
   // The '100' (percent) stretch factor means that the TreeBox will be expanded, vertically, to
   // 'fill up'any remaining vertical space in the 'files_GroupBox' sizer (with the only other
   // vertical space being assigned to the 'fixed vertical size' of the 'filesButtons' sizer)
   this.files_GroupBox.sizer.add( this.files_TreeBox, 100 );
   // add the Buttons_Sizer group 'as is'
   this.files_GroupBox.sizer.add( this.filesButtons_Sizer );

   // Debayer options

   // add a new Combo box, to allow the user to specify which deBayer method should be implemented
   this.deBayerType_ComboBox = new ComboBox( this );
   // populate the Combo Box using the names in the globalData.deBayerOptions array
   // for each entry in the array
   for ( var i = 0; i < globalData.deBayerTypes.length; ++i )
   {
      // add the name to the Combo Box list
      this.deBayerType_ComboBox.addItem( globalData.deBayerTypes[i]);
      //console.write("Combo item: " + globalData.deBayerTypes[i]);
   }
   // set the 'default' entry in the ComboBox
// *** Begin modification by J. Conejero on 2010 Sep 03
   this.deBayerType_ComboBox.currentItem = globalData.chosenDeBayerTypeConstant;
   //this.deBayerType_ComboBox.currentItem = 0;
// *** End modification by J. Conejero on 2010 Sep 03
   this.deBayerType_ComboBox.toolTip = "Select a conversion method to perform the DeBayering";

   // create a function to respond whenever the Combo Box is changed
   this.deBayerType_ComboBox.onItemSelected = function( index )
   {
      // write-back the pointer from the selected entry in the Combo Box
      globalData.chosenDeBayerTypeConstant = globalData.deBayerTypesMap[index];
      // update the working-matrix 'name'
      globalData.chosenDeBayerType = globalData.deBayerTypes[index];

   }

   // add a new Combo box, to allow the user to specify which bayer pattern should be used
   this.bayerPattern_ComboBox = new ComboBox( this );
   // populate the Combo Box using the names in the globalData.deBayerOptions array
   // for each entry in the array
   for ( var i = 0; i < globalData.bayerPatterns.length; ++i )
   {
      // add the name to the Combo Box list
      this.bayerPattern_ComboBox.addItem( globalData.bayerPatterns[i]);
      //console.write("Combo item: " + globalData.bayerPatterns[i]);
   }
   // set the 'default' entry in the ComboBox
// *** Begin modification by J. Conejero on 2010 Sep 03
   this.bayerPattern_ComboBox.currentItem = globalData.chosenBayerPatternConstant;
   //this.bayerPattern_ComboBox.currentItem = 0;
// *** End modification by J. Conejero on 2010 Sep 03
   this.bayerPattern_ComboBox.toolTip = "Select your camera's Bayer pattern.";

   // create a function to respond whenever the Combo Box is changed
   this.bayerPattern_ComboBox.onItemSelected = function( index )
   {
      // write-back the pointer from the selected entry in the Combo Box
      globalData.chosenBayerPatternConstant = globalData.bayerPatternsMap[index];
      // update the working-matrix 'name'
      globalData.chosenBayerPattern = globalData.bayerPatterns[index];

   }

   // add a new Text Label, for displaying 'Debayer Method'
   this.debayerType_Label = new Label( this );
   this.debayerType_Label.text = "Debayer Method:";
   this.debayerType_Label.textAlignment = TextAlign_Left|TextAlign_VertCenter;
   this.debayerType_Label.minWidth = labelWidth1; // minimum label width - see earlier note

   // add a new Text Label, for displaying 'Bayer Pattern'
   this.bayerPattern_Label = new Label( this );
   this.bayerPattern_Label.text = "Bayer / Mosaic Pattern:";
   this.bayerPattern_Label.textAlignment = TextAlign_Left|TextAlign_VertCenter;
   this.bayerPattern_Label.minWidth = labelWidth1; // minimum label width - see earlier note

   // create a new 'GroupBox' and use it to contain the Edit object and the 'Select' button
   this.debayerOptions_GroupBox = new GroupBox( this );
   // set the GroupBox title
   this.debayerOptions_GroupBox.title = "Debayer Options";
   // because there only two items that need to be within this GroupBox,
   // only a single 'HorizontalSizer' layout is needed
   this.debayerOptions_GroupBox.sizer = new HorizontalSizer;
   this.debayerOptions_GroupBox.sizer.margin = 4;
   this.debayerOptions_GroupBox.sizer.spacing = 4;

   this.debayerType_Sizer = new VerticalSizer;
   this.debayerType_Sizer.margin = 4;
   this.debayerType_Sizer.spacing = 4;
   this.debayerType_Sizer.add( this.debayerType_Label );
   this.debayerType_Sizer.add( this.deBayerType_ComboBox );

   this.bayerPattern_Sizer = new VerticalSizer;
   this.bayerPattern_Sizer.margin = 4;
   this.bayerPattern_Sizer.spacing = 4;
   this.bayerPattern_Sizer.add( this.bayerPattern_Label );
   this.bayerPattern_Sizer.add( this.bayerPattern_ComboBox );

   // add the Edit Box object to the horizontal sizer, with a stretch factor of 100
   // The '100' (percent) parameter ensures that the 'Edit' box fills up all space not otherwise occupied
   // within this HorizontalSizer group (the only other item being a single 'button')

   this.debayerOptions_GroupBox.sizer.add( this.debayerType_Sizer );
   // add the 'Select' button 'as is'
   this.debayerOptions_GroupBox.sizer.add( this.bayerPattern_Sizer );

   //

   // create a new 'Edit' object, which will contain the desired output directory - if specified
   this.outputDir_Edit = new Edit( this );
   // the 'Edit' object cannot be 'edited on screen' - it can only be changed by this script
   // (as happens below, when the 'Select' button is pressed)
   this.outputDir_Edit.readOnly = true;
   // initially, the destination directory is read from the 'globalData' construct
   // (if the destination directory is NOT specified, then it will be the same as the source
   // directory, for every image in the 'globalData.inputFiles' list
   this.outputDir_Edit.text = globalData.outputDirectory;
   this.outputDir_Edit.toolTip =
      "<p>If specified, all converted images will be written to the output directory</p>" +
      "<p>If not specified, converted images will be written to the same directories " +
      "as their corresponding input images</p>";

   // create a 'Select' button to allow an output directory to be specified
   this.outputDirSelect_Button = new PushButton( this );
   this.outputDirSelect_Button.text = "Select";
   this.outputDirSelect_Button.toolTip = "<p>Select the output directory</p>";

   // create a function to respond when the 'Select' button is clicked
   this.outputDirSelect_Button.onClick = function()
   {
      // open a new 'API level' dialog box, this time to allow a destination directory to be selected
      var gdd = new GetDirectoryDialog;
      // open the 'GetDirectoryDialog' with at the current setting of the 'globalData.outputDirectory'
      gdd.initialPath = globalData.outputDirectory;
      // unfortunately, when the script first runs, this value is set to ""
      // ##ToDo## : IT MAY BE MORE INTUITIVE TO SET THIS ENTRY TO THE SAME VALUE AS THE LAST 'SOURCE' DIRECTORY
      // RATHER THAN HAVING IT 'EMPTY' WHEN THE SCRIPT STARTS
      gdd.caption = "Select Output Directory";

      // this section responds when the 'OK' button is finally pressed on the OpenFileDialog window
      // (if the dialog closes WITHOUT the 'OK' button having been pressed, then nothing happens)
      // it should also be noted that the 'gdd' dialog allows for a new sub-directory to be created
      if ( gdd.execute() )
      // the 'OK' button was pressed
      {
         // so store the new directory in the 'globalData' construct
         globalData.outputDirectory = gdd.directory;
         // ##Note## : Because outputDirectory is a String property, it is therefore directly assignable
         // because of this, the 'push' method, used elsewhere in the dialog function, is not needed here
         // push() is a method of 'Array' that simply adds a new element at the tail of an existing Array

         // and update the displayed entry on the main dialog window
         this.dialog.outputDir_Edit.text = globalData.outputDirectory;
      }
   };

   // *** Begin modification by J. Conejero on 2013 Jan 18
   this.evaluateNoise_CheckBox = new CheckBox( this );
   this.evaluateNoise_CheckBox.text = "Evaluate noise";
   this.evaluateNoise_CheckBox.checked = globalData.evaluateNoise;
   this.evaluateNoise_CheckBox.toolTip = "<p>Compute per-channel noise estimates for each target image using " +
      "a wavelet-based algorithm (MRS noise evaluation). Noise estimates will be computed from debayered data " +
      "and will be stored as NOISExxx FITS header keywords in the output files. These estimates can be used " +
      "later by several processes and scripts, most notably by the ImageIntegration tool, which uses them by " +
      "default for robust image weighting based on relative SNR values.</p>";
   this.evaluateNoise_CheckBox.onClick = function( checked )
   {
      globalData.evaluateNoise = checked;
   };

   this.evaluateNoise_Sizer = new HorizontalSizer;
   this.evaluateNoise_Sizer.add( this.evaluateNoise_CheckBox );
   this.evaluateNoise_Sizer.addStretch();
   // *** End modification by J. Conejero on 2013 Jan 18

   // create a new 'GroupBox' and use it to contain the Edit object and the 'Select' button
   this.outputDir_GroupBox = new GroupBox( this );
   // set the GroupBox title
   this.outputDir_GroupBox.title = "Output Directory";
   // because there only two items that need to be within this GroupBox,
   // only a single 'HorizontalSizer' layout is needed
   this.outputDir_GroupBox.sizer = new HorizontalSizer;
   this.outputDir_GroupBox.sizer.margin = 4;
   this.outputDir_GroupBox.sizer.spacing = 4;
   // add the Edit Box object to the horizontal sizer, with a stretch factor of 100
   // The '100' (percent) parameter ensures that the 'Edit' box fills up all space not otherwise occupied
   // within this HorizontalSizer group (the only other item being a single 'button')
   this.outputDir_GroupBox.sizer.add( this.outputDir_Edit, 100 );
   // add the 'Select' button 'as is'
   this.outputDir_GroupBox.sizer.add( this.outputDirSelect_Button );

   //

   labelWidth1 = this.font.width( "Output extension: " );
   // add a new Text Label, for displaying 'Output Extension'
   this.outputExt_Label = new Label( this );
   this.outputExt_Label.text = "Output extension :";
   this.outputExt_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.outputExt_Label.minWidth = labelWidth1; // minimum label width - see earlier note

   // add a new Edit box, to allow the output file extension to be specified
   this.outputExt_Edit = new Edit( this );

   // the 'Edit' object cannot be 'edited on screen' - it can only be changed by this script
   // However, no code is provided to allow this to happen, so - for this script only -
   // the 'enabled' property is set to 'false', to disable editing
   // this restriction is explained to the user by the alternative tooltip, below
   this.outputExt_Edit.enabled = false;

   // set the initial entry to that stored in the 'globalData' construct
   this.outputExt_Edit.text = globalData.outputExtension;
   // the width of the Edit Box is defined by the width of 6 letter 'M' characters, based on the current font
   this.outputExt_Edit.setFixedWidth( this.font.width( "MMMMMM" ) );
   // because the user is being prevented from altering the file extension, an alternative tool tip is used
   // this.outputExt_Edit.toolTip = "<p>Specify a file extension to identify the output file format.</p>";
   // this is the alternative tool tip
   this.outputExt_Edit.toolTip =
   "<p>If you need to be able to alter the file extension, please edit the main script file</p>" +
   "<p>For this deBayering routine, the output file should remain in FITS format</p>";

   // this next code segment exists purely to verify that the user has entered an appropriate file extension
   // it is triggered when the user 'moves away' from the Edit Box
   // (typically by pressing 'Enter', hitting 'TAB', or mouse-clicking elsewhere)
   this.outputExt_Edit.onEditCompleted = function()
   {
      // Image extensions are always lowercase in PI/PCL
      var ext = this.text.trim().toLowerCase();

      // Use the default extension if empty.
      // Ensure that ext begins with a dot character.
      if ( ext.length == 0 || ext == '.' )
         ext = DEFAULT_EXTENSION;
      else if ( ext.charAt( 0 ) != '.' )
         ext = '.' + ext;

      // this next statement shows a useful coding feature of JavaScript
      // normally the first two variable would have been set equal to 'ext', as separate expressions
      this.text = globalData.outputExtension = ext;
      // hoewever, as the requirement is to have the FTS extension 'hard-wired' all changes are over-written
      this.text = DEFAULT_EXTENSION;
   }

   //

   // add a new 'CheckBox' to allow the user to control the over-writing of existing files
   this.overwriteExisting_CheckBox = new CheckBox( this );
   this.overwriteExisting_CheckBox.text = "Overwrite existing files";
   // retrieve the stored status of the flag from the 'globalData' construct
   this.overwriteExisting_CheckBox.checked = globalData.overwriteExisting;
   this.overwriteExisting_CheckBox.toolTip =
      "<p>Allow overwriting of existing image files</p>" +
      "<p><b>* Warning *</b> Enabling this option may lead to irreversible data loss</p>";

   // create a function to respond whenever the CheckBox is clicked (either 'ON' or 'OFF')
   this.overwriteExisting_CheckBox.onClick = function( checked )
   {
      // because the CheckBox has been clicked, reflect this condition in the 'globalData' construct
      // there is no {if} code needed - the 'function(checked)' and '=checked' handles the extraction
      // of the Boolean state required by the 'globalData' construct. In other words, if the 'state'
      // of the CheckBox IS 'checked', then the result will be 'true', and this will be stored in
      // the globalData construct, otherwise a 'false' value will be stored
      globalData.overwriteExisting = checked;
      // ##Note## : Because overwriteExisting is a Boolean property, it is therefore directly assignable
      // because of this, the 'push' method, used elsewhere in the dialog function, is not needed here
      // push() is a method of 'Array' that simply adds a new element at the tail of an existing Array
   }

   //

   // create a new 'HorizontalSizer' group that will contain the two objects defined above
   this.options_Sizer = new HorizontalSizer;
   this.options_Sizer.spacing = 4;
   this.options_Sizer.add( this.outputExt_Label );
   this.options_Sizer.add( this.outputExt_Edit );
   // although the Text Label and the Edit Box, above, are kept at the default spacing of '4'
   // and extra space is added ahead of the Check Box
   this.options_Sizer.addSpacing( 12 );
   this.options_Sizer.add( this.overwriteExisting_CheckBox );
   // the items already added to the HorizontalSizer, are now left left-justified
   // by including a dynamically sizeable space to 'fill up' the remaining space on the row
   this.options_Sizer.addStretch();

   //

   // TEMP TEMP TEMP TEMP
   // Replace with real dialog after we prove this works.
   globalData.deBayerMethod = "SuperPixel";
   globalData.bayerPattern = "RGGB";
   globalData.outputExtension = ".fit";
   // END TEMP

   //

   // a (standard) 'OK' button is defined - although it is labelled 'Execute' for operational clarity
   this.ok_Button = new PushButton( this );
   this.ok_Button.text = " Execute ";

   // a function is created to respond to when the 'Execute' button is pressed
   this.ok_Button.onClick = function()
   {
      // closes the dialog window, and returns 'ok'
      // this is the only variable state that is processed by the calling procedure, 'main()'
      this.dialog.ok();
   }

   // a (standard) 'Exit' button is defined
   this.exit_Button = new PushButton( this );
   this.exit_Button.text = " Exit ";

   // a function is created to respond to when the 'Exit' button is pressed
   this.exit_Button.onClick = function()
   {
      // closes the dialog window, and returns 'cancel'
      // although the 'main()' procedure never actually looks for, or processes, this returned value
      this.dialog.cancel();
   }

   //

   // a final HorizontalSizer is created to create the appropriate layout for the 'Setup', 'OK' and 'Cancel' buttons
   this.buttons_Sizer = new HorizontalSizer;
   // a spacing of six or eight pixels is customary between standard dialog buttons
   this.buttons_Sizer.spacing = 8;
   // in order to right-justify the 'OK' and 'Cancel' buttons, a dynamic space is added FIRST
   //this.buttons_Sizer.add( this.setup_Button);
   this.buttons_Sizer.addStretch();
   // now that the 'dynamic space' has been added, the two buttons can be added,
   // without the need for any further spacing commands
   this.buttons_Sizer.add( this.ok_Button );
   this.buttons_Sizer.add( this.exit_Button );

   //

   // now that all the various 'horizontal' elements of the dialog box have been defined,
   // the individual 'rows' can now be added to a VerticalSizer construct
   this.sizer = new VerticalSizer;
   // a margin of eight pixels is advisable for large dialogs, as is the case here
   this.sizer.margin = 8;
   // a spacing of six pixels is advisable for large dialogs, as is the case here
   this.sizer.spacing = 6;
   // add the first element, the HelpLabel
   this.sizer.add( this.helpLabel );
   // add extra spacing
   this.sizer.addSpacing( 4 );
   // add the 'files' GroupBox (which, itself, has two, previously formatted, row elements)
   this.sizer.add( this.files_GroupBox, 100 );
   // add the 'debayerOptions' Group Box
   // (which only contained a single row, but which needed the 'outline' of the GroupBox)
   this.sizer.add( this.debayerOptions_GroupBox );
   // *** Begin modification by J. Conejero on 2013 Jan 18
   this.sizer.add( this.evaluateNoise_Sizer );
   // *** End modification by J. Conejero on 2013 Jan 18
   // add the 'outputDir' Group Box
   // (which only contained a single row, but which needed the 'outline' of the GroupBox)
   this.sizer.add( this.outputDir_GroupBox );
   // add the 'options' sizer (again, just a single line group, this time with no 'outline')
   this.sizer.add( this.options_Sizer );
   // finally, add the last row of the dialog box, which contains the 'OK' and 'Cancel' buttons)
   this.sizer.add( this.buttons_Sizer );

   // give the dialog box a title (from a #define at the start of the script)
   this.windowTitle = TITLE;
   // allow the dialog window to be user re-sizable
   this.userResizable = true;

   // allow the dialog window to resize to the contents of the dialog definition, assuming no other influences
   this.adjustToContents();
   // Control.adjustToContents() changes the size of a control to fit all of its child controls exactly
   // if the control has a minimum size - see the Control.setMinSize(), Control.minWidth and Control.minHeight
   // properties - then it is resized to those minimum dimensions, or to the smallest rectangle that could
   // contain all of the child controls; whichever of these two cases defines the larger rectangle
   // ##Note## : <adjustToContents()> implicitly calls adjustToContents() recursively for all child controls,
   // and their descendants, trying to resize the whole hierarchical tree of Control objects to their
   // minimum possible sizes. This method acts like an exhaustive "packer" for a Control and its children
} // end of mainDialog()


// ========= exit the script =======================================================

function main()
// only ever called once, at the initialisation phase
// when script execution leaves this subroutine, the script execution will terminate
{
   console.show();

   console.abortEnabled = true;

   // this is the ONLY call to the dialog routine
   var fileSelectDialog = new mainDialog ();

   if ( DEBUGGING_MODE_ON )
   {
      console.writeln ("Dialog opened");
      console.writeln ("");
   }

   // initiate an 'endless' loop, whose only 'exit' point comes from the <break> command,
   // and where the <break> command is only acted upon if the user does NOT press <Execute> in the main dialog window
   // (in other words ONLY by pressing <Execute> can the endless loop be sustained, all other actions will terminate
   // loop, and hence the script)
   for ( ; ; )
   {
      // if the <Execute> button was clicked in the main dialogue window
      if ( fileSelectDialog.execute() )
      {
         if ( DEBUGGING_MODE_ON )
         {
            console.writeln ("Dialog 'Execute' pressed");
         }

         // then call the main processing routine, which will deal with all files that have been added to the working array
         // ##Note## : The loop to process all of the files is WITHIN the deBayer() procedure, NOT in this 'main()' procedure
         deBayer(globalData);

         if ( DEBUGGING_MODE_ON )
         {
            console.writeln ("");
         }

         // all files in the working array have now been processed
         // the 'continue' command forces the script to remain within the 'endless' loop
         break;
      }

      if ( DEBUGGING_MODE_ON )
      {
         console.writeln ("Dialog closed");
      }

      // the main dialogue window was closed by some means OTHER than pressing the <Execute> button
      // so issue a 'break' command, to exit the endless loop
      break; // without this, there is no means of ending the 'for-ever' loop
   }

   console.writeln("");
   console.writeln (TITLE + " v" + VERSION + " Completed.");
}
