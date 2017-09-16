// version 1_16 (c) Niall Saunders 15-June-2009

// =================================================================================
// As a non-professional programmer, I have based this program on pre-existing
// scripts, where possible, and I have added comments throughout the script to
// help 'me' understand what the pre-existing routines were intended to achieve.
// Some of these comments may NOT be 'correct', some may use inappropriate
// terminology or poor programming concepts. I welcome criticism from those who
// know far more than I do - if nothing else, I will learn from my errors !!
// Niall J. Saunders B.Sc. MIET. Clinterty Observatories. Aberdeen, SCOTLAND
// PI_scripting (at) njs101 (dot) com
// =================================================================================

// ======== #license ===============================================================
// This program is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the
// Free Software Foundation, version 3 of the License.
//
// This program is distributed in the hope that it will be useful, but WITHOUT
// ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
// FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
// more details.
//
// You should have received a copy of the GNU General Public License along with
// this program.  If not, see <http://www.gnu.org/licenses/>.
// =================================================================================

// Within the script, the following text can be 'searched for' :-
// (specifically, the text enclosed by the double-hash characters)
// ##ToDo## : These are areas of the script that have still to be created / implemented
// ##ToThink## : This is code that the PI team may need to address, or may be addressing
// ##Note## : These are comment sections explaining specific features or bugs
// ##Query## : These are areas of code where 'I' am having problems, or need assistance
// ##Answer## : These are responses that have come directly from the PI development team

// ======== #release information ===================================================

// v1.16 10/07/09 lines 1609 and 2209 - missing 'var' keywords added
//                line 51 - Improved #feature-info description
//                line 1638 - enabled alternateRowColor property for the file
//                selection TreeBox
// v1.15 15/06/09 'console.show' "bug" fixed at line 3135
//                The 'OK' button on the main dialogue page re-titled as 'Execute'
//                (with all references to 'OK' changed where appropriate)
// v1.14 14/06/09 First 'public' release, posted on PixInsight Forum

// ======== #features ==============================================================

#feature-id    Batch Processing > Batch CMYG DeBayer

#feature-info  A batch image deBayer conversion utility for (Meade DSI) CMYG OSC CCD \
               imagers.<br/>\
   <br/>\
   This script allows you to select a set of input image files, and an optional \
   output directory. The script then iterates, reading each input file and applying \
   a deBayering algorithm to it, then saving the RGB image in the output directory.<br/>\
   <br/>\
   A user dialogue interface allows full control of the parameters for the conversion \
   matrix. Image shift can also be allowed for and basic colour balance is also made \
   available within the dialogue box<br/>\
   <br/>\
   Copyright &copy; 2009 Niall Saunders

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

#define DEFAULT_CONVERSION_METHOD 0
#define DEFAULT_EXTENSION  ".fts"
#define WARN_ON_NO_OUTPUT_DIRECTORY 1

#define TITLE  "Batch CMYG DeBayer Script (c) NJS 2009"

// for Meade Envisage RAW DSI-IIC, no image flipping
#define ENVISAGE_DEFAULT_COL_OFFSET 1
#define ENVISAGE_DEFAULT_ROW_OFFSET 2

// ##ToDo## : THESE VALUES MAY BE 'WRONG' AND NEED TO BE RECONFIRMED NOW THAT THE DEBAYER SCRIPT HAS BEEN MODIFIED
// for Stark Labs RAW Nebulosity DSI-IIC, with no image flipping
#define NEBULOSITY_DEFAULT_COL_OFFSET 0
#define NEBULOSITY_DEFAULT_ROW_OFFSET 0

#define X_FLOP false
#define Y_FLIP false

#define CORNER_SCALE 0.25
#define SIDE_SCALE 0.50

#define APPLY_HISTO true
#define ALIGN_IMAGE_MEDIANS true
#define ALIGN_ALL_MEDIANS false
#define APPLY_COLOUR_SATURATION true
#define APPLY_COLOUR_CURVE false
#define COLOUR_SATURATION_AMOUNT 75

// ========= initialise global variables and data structures =======================

var deBayerOptions = new Array; // declare a global array structure, which will be populated later
var CFApixelGrid = new Array; // declare a global array structure, which will be 'hard-coded' later
var workingCFApixelGrid = new Array; // declare a global array structure, which will be based on CFApixelGrid

void initialiseDeBayerOptions(); // populate the global DeBayerOptions array
void initialisePixelGrids(); // 'hard-code' the global CFApixelGrid array, create the global 'working'VFApixelGrid array

var globalData = new createDataStructure; // create a global data structure to hold all global data

void generate_workingCFApixelGrid(); // update the global working copy of the CFA pixel grid

mainDialog.prototype = new Dialog; // create a prototype for a new dialog window
// this will be fully defined later in 'function mainDialog()'

deBayerDialog.prototype = new Dialog; // create a prototype for another new dialog window
// this will be fully defined later in 'function deBayerDialog(main)'

// ========= initialisation complete, enter main loop ==============================

void main();

// ========= exit the script =======================================================


// ========= function definitions ==================================================
function initialiseDeBayerOptions()
// only ever called once, during initialisation
// calls deBayerMethodDefinition(), once for each (hard-coded) deBayer method
{
   // this is just about as simple as it gets, but it does actually seem to work well enough
   deBayerOptions[0] = new deBayerMethodDefinition( [
   0.0, 1.0, 1.0, 0.0 ,
   1.0, 0.0, 1.0, 1.0 ,
   1.0, 1.0, 0.0, 0.0 ],
   "Theoretical_1" );

   // this tries to 'think' about how secondary colours might contribute to the primary colours
   deBayerOptions[1] = new deBayerMethodDefinition( [
   0.0, 1.0, 1.0, 0.0 ,
   0.5, 0.0, 1.0, 0.5 ,
   1.0, 0.5, 0.0, 0.0 ],
   "Theoretical_2" );

   // this tries to think 'even harder'
   deBayerOptions[2] = new deBayerMethodDefinition( [
   0.0, 0.5, 0.5, 0.0 ,
   0.3333333, 0.0, 0.3333333, 0.3333333 ,
   0.5, 0.25, 0.0, 0.25 ],
   "Theoretical_3" );

   // these values were obtained empirically, by illuminating a Meade DSI-IIC camera from a white light source
   // but with Meade CCD RGB filters introduced in front of the camera, to try and determine sensitivity
   // for the DSI-IIC - in relationship to 'primary coloured light'
   deBayerOptions[3] = new deBayerMethodDefinition( [
   0.0480104, 0.8793507, 0.9173381, 0.0471233 , // sum of row values is 1.8918225
   0.6916858, 0.1207320, 0.8264541, 0.6435795 , // sum of row values is 2.2824514
   0.9147310, 0.4139785, 0.0663064, 0.2892698 ], // sum of row values is 1.6842857
   "NJS_Empirical_1" );

   // these values are taken from the basic 'empirical' values, such that the 'sum' of each line
   // equals the 'maximum sum' of the fundamental emprical line entries (which was 2.2824514, for the 'Gn' row)
   // the 'Rd' and 'Bu' rows have been scaled by xxx and xxx respectively
   deBayerOptions[4] = new deBayerMethodDefinition( [
   0.0579237, 1.0609215, 1.1067526, 0.0568535 , // all values multiplied by (2.2824514 / 1.8918225)
   0.6916858, 0.1207320, 0.8264541, 0.6435795 , // sum of row values remains 2.2824514
   1.2395932, 0.5610009, 0.0898548, 0.3920025 ], // all values multiplied by (2.2824514 / 1.6842857)
   "NJS_Empirical_2" );

   // the previously scaled values are then scaled again, such that the row sums are now all '1.0'
   // in other words, all values are divided by 2.2824514
   deBayerOptions[5] = new deBayerMethodDefinition( [
   0.0253778, 0.4648167, 0.4848965, 0.0249090 , // sum of row values is 1.0
   0.3030451, 0.0528958, 0.3620906, 0.2819685 , // sum of row values is 1.0
   0.5430973, 0.2457888, 0.0393676, 0.1717463 ], // sum of row values is 1.0
   "NJS_Empirical_3" );

   // these values are just a pruely randm set of values, literraly based on the following function :-
   // value = (random_number * 4) - 2
   // where 'random_number' is always generated between 0.000 and 0.999
   // it is unlikely that this data set can have any real usefulness - but has been left here to allow experimentation
   deBayerOptions[6] = new deBayerMethodDefinition( [
   -1.324, 0.508, -1.516, 0.128 ,
   1.316, 0.004, 1.616, -1.144 ,
   -0.156, -1.956, 0.528, -0.712 ],
   "RANDOM" );
}

function deBayerMethodDefinition( kernel, name )
// only ever called once, by the Fill...Array function
// (which, itself, is only ever called once)
// this function is a constructor for the DeBayerMethodDefinition object, which has two properties
// the properties that are being defined here are 'kernel' and 'name'
// several DeBayerMethodDefinition objects are 'instanciated' in 'initialiseDeBayerOptions' function
// using the new operator defined here (standard OOP within JavaScript)
{
   this.kernel = kernel;
   this.name = name;
}

function initialisePixelGrids()
// only ever called once, during initialisation
// creates a two-column x four-row array, with an initial (Meade DSI-IIC 'standard') CFA layout
// the code to 'look-up' this array is of the form :
// array_value = CFApixelGrid[row][column];
// because the 'basic' 2x2 grid repeats over four rows, 'primary' and 'secondary' suffixes have been added
// this helps in the debayering algorithm itself
// (at least in the manner in which the script has been written for this release)
{
   // this version of the CFA grid is only ever used to create the 'working' version
   CFApixelGrid =
   [
   ["C1", "Y1"],
   ["M1", "G1"],
   ["C2", "Y2"],
   ["G2", "M2"]
   ];

   // this definition is simply for 'neatness'
   // a function will later re-populate the array based on offset data and 'Y-flip' or 'X-flop' requirements
   workingCFApixelGrid =
   [
   ["C1", "Y1"],
   ["M1", "G1"],
   ["C2", "Y2"],
   ["G2", "M2"]
   ];
}

function createDataStructure()
// only ever called once, during initialisation
// this function call is used to create the global structure called 'globalData'
// variable values are initialised where appropriate
{
   // the array of possible DeBayer methods available
   this.deBayerOptions = deBayerOptions;
   // the index of the conversion method currently in use
   this.chosenDeBayerMethod = DEFAULT_CONVERSION_METHOD;
   // the name of the conversion method currently in use
   this.deBayerName = deBayerOptions[this.chosenDeBayerMethod].name;
   // the kernel of the method currently being used by the conversion algorithm
   this.deBayerKernel = deBayerOptions[this.chosenDeBayerMethod].kernel;

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

   // define offsets for the CFA matrix - the script starts up with settings suitable for Envisage
   // (as opposed to (0,0) settings)
   // these values can be modified via the 'DeBayer Setup' button on the main dialog
   this.CFAcolOffset = ENVISAGE_DEFAULT_COL_OFFSET; // 1 for Meade Envisage RAW DSI-IIC, no image flipping
   this.CFArowOffset = ENVISAGE_DEFAULT_ROW_OFFSET; // 2 for Meade Envisage RAW DSI-IIC, no image flipping

   // the script starts up with no X-flopping or Y-flipping being applied to the CFA matrix
   // these values are later modified via the 'DeBayer Setup' button on the main dialog
   this.CFAxFlopped = X_FLOP;
   this.CFAyFlipped = Y_FLIP;

   // ##ToDo## : THESE VALUES ARE CURRENTLY SET BY #DEFINEs - THIS NEEDS TO BE ADDED TO THE GUI DIALOG
   // (although some further thought is needed here, as changing from these 'base'
   // values has left the image looking very 'pixelated' - horrible, in fact)
   this.cornerScaleFactor = CORNER_SCALE;
   this.sideScaleFactor = SIDE_SCALE;

   // the script default is to always apply all of the basic post-deBayering algorithms
   this.applyClippingHisto = APPLY_HISTO;
   this.applyRGBmedianAlign = ALIGN_IMAGE_MEDIANS;

   // the script has the option to align all subsequent image median values to the median of the first image
   this.alignAllMedians = ALIGN_ALL_MEDIANS;
   // this variable will hold the 'maxMedian' value obtained from the first image processed in a data set
   this.maxMedian = 0;

   // the script defaults to a condition where an enhanced colour saturation process is applied to every image
   // the base level for this enhancement is provided by a '#define' statement
   this.applyColourSaturation = APPLY_COLOUR_SATURATION;
   this.colourSaturationAmount = COLOUR_SATURATION_AMOUNT;

   // the default operation will NOT apply the double colour-curve correction
   // (the two curves have been obtained by colour-correcting exposures of a typical 'test-card' image)
   this.applyColourCorrectionCurve = APPLY_COLOUR_CURVE;

   // create a duplicate set of variables to hold a copy of parameters that can be changed by the user
   // this data will be used to reset these variables if the user decides to 'Cancel' the setup operation
   this.stored_chosenDeBayerMethod = this.chosenDeBayerMethod;
   this.stored_CFAcolOffset = this.CFAcolOffset;
   this.stored_CFArowOffset = this.CFArowOffset;
   this.stored_CFAxFlopped = this.CFAxFlopped;
   this.stored_CFAyFlipped = this.CFAyFlipped;
   this.stored_applyClippingHisto = this.applyClippingHisto;
   this.stored_applyRGBmedianAlign = this.applyRGBmedianAlign;
   this.stored_alignAllMedians = this.alignAllMedians;
   this.stored_applyColourSaturation = this.applyColourSaturation;
   this.stored_colourSaturationAmount = this.colourSaturationAmount;
   this.stored_applyColourCorrectionCurve = this.applyColourCorrectionCurve;
}

function generate_workingCFApixelGrid()
// initially called during the script initialisation phase
// then called whenever parameters are changed by the deBayerDialog
// CFApixelGrid and workingCFApixelGrid are both GLOBAL array variables
{
   var colStart = 0;
   var colEnd = 1;
   var colStep = 1;
   var colCounter = 0;
   var outputCol = 0;
   var outputColStart = 0;
   var outputColStep = 1;

   var rowStart = 0;
   var rowEnd = 3;
   var rowStep = 1;
   var rowCounter = 0;
   var outputRow = 0;
   var outputRowStart = 0;
   var outputRowStep = 1;

   var lookupRow = 0;
   var lookupCol = 0;

   if (globalData.CFAxFlopped)
   {
      var outputColStart = colEnd;
      var outputColStep = -1;
   }

   if (globalData.CFAyFlipped)
   {
      var outputRowStart = rowEnd;
      var outputRowStep = -1;
   }

   for (rowCounter = rowStart, outputRow = outputRowStart;
         rowCounter <= rowEnd;
         rowCounter += rowStep, outputRow += outputRowStep )
   {
      for (colCounter = colStart, outputCol = outputColStart;
            colCounter <= colEnd;
            colCounter += colStep, outputCol += outputColStep )
      {
         lookupRow = Math.mod((rowCounter + globalData.CFArowOffset),4);
         lookupCol = Math.mod((colCounter + globalData.CFAcolOffset),2);

         workingCFApixelGrid[outputRow][outputCol] = CFApixelGrid[lookupRow][lookupCol];
      }
   }

      if ( DEBUGGING_MODE_ON )
      {
      console.writeln(workingCFApixelGrid[0][0],workingCFApixelGrid[0][1]);
      console.writeln(workingCFApixelGrid[1][0],workingCFApixelGrid[1][1]);
      console.writeln(workingCFApixelGrid[2][0],workingCFApixelGrid[2][1]);
      console.writeln(workingCFApixelGrid[3][0],workingCFApixelGrid[3][1]);
      console.writeln("");
      }
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
   // declare a more 'code-friendly' local variable to contain the number of files that will need to be processed
   var numFiles = localData.inputFiles.length;

   // providing that at least ONE file has been selected for conversion
   if ( numFiles != 0 )
   {
      if ( DEBUGGING_MODE_ON )
      {
         console.writeln("Method ID   = " + localData.chosenDeBayerMethod);
         console.writeln("Method Name = " + localData.methodName);
      }

      // for every file in the image list
      for ( var i = 0; i < numFiles; ++i )
      {
         // create a local variable to hold the source image name (from the indexed entry in the file list)
         var sourceName = localData.inputFiles[i];

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
            inputImageWindow[0].show();
            console.writeln("Source Name : ", sourceName);
         }

         // create code-friendly variables for the 'view' and the 'image' of the source file within its ImageWindow
         var sourceView = inputImageWindow[0].mainView;
         var sourceImage = inputImageWindow[0].mainView.image;

         // create code-friendly variables to hold the dimensions of the source image
         var sourceWidth = sourceImage.width;
         var sourceHeight = sourceImage.height;

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
         var outputName = fileDir + localData.deBayerName + "_" + fileName + localData.outputExtension;

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
         var outputImageWindow = new ImageWindow(sourceWidth, sourceHeight, 3, 32, true, true, "output");

         // create code-friendly variables to point to the main view, and the actual image of the output ImageWindow
         var outputView =  outputImageWindow.mainView;
         var outputImage = outputImageWindow.mainView.image;

         if ( DEBUGGING_MODE_ON )
         {
            // inform the core application that we are going to modify this view's image. Normally, UndoFlag_NoSwapFile
            // avoids the generation of a swap file. Since we are working with a new image, a swap file is not needed,
            // because we will not need to undo anything for this window
            outputView.beginProcess( UndoFlag_NoSwapFile );

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
            outputImage.fill( 0.5 );
            // advise the core application that processing is complete for this view
            outputView.endProcess();

            console.writeln("============================================");
            console.writeln("File [" + fileName + "] was processed");
            console.writeln("The output filename was " + outputName);
            console.writeln("");

            // display the image window 'container'
            outputImageWindow.show();
         }

         // inform the core application that this view is now 'busy'
         outputView.beginProcess( UndoFlag_NoSwapFile );

         // store a value representing the 'start time' of the conversion for each image
         var startTime = Date.now();

         // this is the call to the function that will actually perform the conversion
         // the two images are 'passed' to the 'convert()' function
         convert(sourceImage, outputImage);

         //

         // rescale the deBayered image, such that all ADU values are between 0.0 and 1.0 (the preferred range for PI)
         outputImage.rescale();

         //
/*
         // this code snippet demonstrates how statistical image information can be accessed in the PJSR framework
         // (it is only included here for reference purposes)

         var img = new Image
         // ...
         var mn = img.minimum(); // minimum sample value
         var mx = img.maximum(); // maximum sample value
         var md = img.median(); // median
         var av = img.mean(); // arithmetic mean
         var sd = img.stdDev(); // standard deviation
         // and, in v1.5, there will also be
         var ad = img.avgDev(); // average median deviation
         // (all values are provided in the [0,1] range for all pixel data types)

         // assuming that the image is a typical RGB image, data for the BLUE channel (channel 2) can be obtained as follows
         img.selectedChannel = 2;
         var Bu_md = img.median(); // median of channel #2

         // you can also define a rectangular ROI (region of interest) and a range of image channels:
         img.selectedChannel = 1; // select green channel
         img.selectedRect = new Rect( 10, 15, 250, 375 ); // define a ROI
         var Gn_md_inSelected = img.median(); // median of ROI in channel #1
         // ...
         img.resetRectSelection(); // forget ROI and re-select the entire image
         img.firstSelectedChannel = 0; // select a channel range from red
         img.lastSelectedChannel = 1; // to green
         var md = img.median(); // this returns the median of the whole image, in the Rd and Gn channels only
         // ...
         img.resetSelections(); // reset all selections: no ROI and all channels

         // along with direct image statistics (described above), there is also the ImageStatistics object
         // ImageStatistics are accessed as in the following example:
         var img = new Image;
         // ...
         var stats = new ImageStatistics( img );
         console.writeln( "The median is: %.5f", stats.median );
         // ...
         stats.generate( img ); // you can reuse a ImageStatistics object - possibly targetted at another image
         console.writeln( "Now the median is: %.5f", stats.median );
         // as with direct statistics, the ImageStatistics object performs its calculations
         // for the current image selection (ROI and channel range)
*/

         //

         // if the 'clipping histogram' process IS to be applied,
         if ( globalData.applyClippingHisto )
         {
            // then access the 'max' and 'min' information for the deBayered image, on a 'per channel' basis
            outputImage.selectedChannel = 0; // select the Red channel
            var RdMin = outputImage.minimum(); // minimum value of the Rd channel
            var RdMax = outputImage.maximum(); // maximum value of the Rd channel

            outputImage.selectedChannel = 1; // select the Green channel
            var GnMin = outputImage.minimum(); // minimum value of the Gn channel
            var GnMax = outputImage.maximum(); // maximum value of the Gn channel

            outputImage.selectedChannel = 2; // select the Blue channel
            var BuMin = outputImage.minimum(); // minimum value of the Bu channel
            var BuMax = outputImage.maximum(); // maximum value of the Bu channel

            // remove all 'selection' restrictions - both area AND channel restrictions
            outputImage.resetSelections;

            // then apply a histogram transformation to the deBayered image
            // this transform will rescale each colour plane to 'fill' the full available range (0.0 to 1.0)
            // the 'rescale' function applied earlier will have only affected the overall image, usually by
            // rescaling ONE of the three colour planes. In fact, the first 'rescale' could well be redundant
            // most importantly, the data REMAINS LINEAR. There is NO 'MTF' function applied
            var clipEdgesNoLosses = new HistogramTransformation;

            with ( clipEdgesNoLosses )
            {
               H = // shadows, midtones, highlights, rescale0, rescale1
               [
               [RdMin, 0.5, RdMax, 0.0, 1.0], // red
               [GnMin, 0.5, GnMax, 0.0, 1.0], // green
               [BuMin, 0.5, BuMax, 0.0, 1.0], // blue
               [ 0.0 , 0.5,  1.0 , 0.0, 1.0], // luminance (RGB)
               [ 0.0 , 0.5,  1.0 , 0.0, 1.0]  // alpha
               ];

               executeOn(outputView);
            }
         }

         //

         // if the 'align image channel medians' process IS to be applied,
         if ( globalData.applyRGBmedianAlign )
         {
            // then access the 'median' information for the deBayered image, on a 'per channel' basis
            outputImage.selectedChannel = 0; // select the Red channel
            var RdMed = outputImage.median(); // median value of the Rd channel

            outputImage.selectedChannel = 1; // select the Green channel
            var GnMed = outputImage.median(); // median value of the Gn channel

            outputImage.selectedChannel = 2; // select the Blue channel
            var BuMed = outputImage.median(); // median value of the Bu channel

            // remove all 'selection' restrictions - both area AND channel restrictions
            outputImage.resetSelections;

            // obtain the value of the 'highest' median for the three colour channels
            // the other two channels will have their histograms shifted, linearly, to 'line up' with this value
            var maxMedian = Math.max(RdMed, BuMed, GnMed);

            // now create a PixelMath process to align all median values to the highest median
            var alignMediansToMaxMedian = new PixelMath;

            // if this is the 'first' image being processed during this run, then the 'maxMedian' value is stored,
            // allowing it to be used to determine the appropriate offsets for all subsequent images in the data set
            if (i == 0)
            {
               // then the image that has been processed is the first one from a data set,
               // so store the 'maxMedian' value
               globalData.maxMedian = maxMedian;
            }

            if (i !=0 )
            {
               // otherwise the image that has just been processed is NOT the first of the data set,
               // so decide whether to use the stored value based on the global 'alignAllMedians' flag
               if ( globalData.alignAllMedians )
               {
                  // use the stored value, obtained from the first image processed in this data set
                  maxMedian = globalData.maxMedian;
               }
            }

            // calculate offset values that will have to be applied to the individual channels
            var RdOffset = maxMedian - RdMed;
            var GnOffset = maxMedian - GnMed;
            var BuOffset = maxMedian - BuMed;

            with ( alignMediansToMaxMedian )
            {
               // although the following expressions COULD be used, for the sake of clarity (and at the slight
               // expense of 'slower' code, the expressions actually used have been 'expanded'
               // expression = "$T[0]+(max(med($T[0]), med($T[1]), med($T[2]))-med($T[0]))"; // for the red channel
               // expression1 = "$T[1]+(max(med($T[0]), med($T[1]), med($T[2]))-med($T[1]))"; // for the green channel
               // expression2 = "$T[2]+(max(med($T[0]), med($T[1]), med($T[2]))-med($T[2]))"; // for the blue channel

               // use the 'expanded' (and, perhaps, 'slower' version of the expressions
               expression = "$T[0] + " + RdOffset; // for the red channel
               expression1 = "$T[1] + " + GnOffset; // for the green channel
               expression2 = "$T[2] + " + BuOffset; // for the blue channel

               expression3 = ""; // luminance (RGB)
               useSingleExpression = false;
               symbols = "";
               use64BitWorkingImage = false;

               // ##Note## : in order to be able to align medians over multiple images, based on the aligned medians
               // of the first image, the images can no longer be rescaled - they have to be truncated instead. This
               // means that 'some' pixel data will be lost, however this loss happens at the darkest and brightest
               // areas only, and this loss 'may' be acceptable. If it is NOT acceptable, do not select this option

               // if this is the first image in the dataset
               if (i == 0)
               {
                  // then the image can be scaled as normal
                  rescale = true;
                  rescaleLower = 0.0000000000;
                  rescaleUpper = 1.0000000000;

                  // and therefore the data does NOT have to be truncated
                  truncate = false;
                  truncateLower = 0.0000000000;
                  truncateUpper = 1.0000000000;
               }
               // otherwise, this is NOT the first image in a dataset
               else
               {
                  // if we are NOT going to align all medians
                  if ( !globalData.alignAllMedians )
                  {
                     // then we can rescale the image data as normal
                     rescale = true;
                     rescaleLower = 0.0000000000;
                     rescaleUpper = 1.0000000000;

                     // and , again, we do not have to truncate
                     truncate = false;
                     truncateLower = 0.0000000000;
                     truncateUpper = 1.0000000000;
                  }
                  // we ARE going to align all medians, so
                  else
                  {
                     // we cannot rescale the data
                     rescale = false;
                     rescaleLower = 0.0000000000;
                     rescaleUpper = 1.0000000000;

                     // we have to truncate the data instead
                     truncate = true;
                     truncateLower = 0.0000000000;
                     truncateUpper = 1.0000000000;
                  }
               }

               createNewImage = false;
               newImageId = "";
               newImageWidth = 0;
               newImageHeight = 0;
               newImageAlpha = false;
               newImageColorSpace = SameAsTarget;
               newImageSampleFormat = SameAsTarget;

               executeOn(outputView);
            }
         }

         //

         // if the 'colour saturation' process IS to be applied,
         if ( globalData.applyColourSaturation )
         {
            // then apply a ColorSaturation process (in this case, as a 'flat-line' enhancement)
            var colourSaturate = new ColorSaturation;
            with ( colourSaturate )
            {
               HS = // x, y
               [
               [0.00000, globalData.colourSaturationAmount / 100], // the values are stored as percentages
               [1.00000, globalData.colourSaturationAmount / 100]  // but are converted to decimal (/100) for use by the process
               ];
               HSt = AkimaSubsplines;
               hueShift = 0.000;

               executeOn(outputView);
            }
         }

         //

         // if the 'colour curve correction' process IS to be applied,
         if ( globalData.applyColourCorrectionCurve )
         {
            // then apply a Curves process
            var colourCurve1 = new CurvesTransformation;
            with ( colourCurve1 )
            {
               R = // x, y
               [
               [0.00000, 0.00000],
               [1.00000, 1.00000]];
               Rt = AkimaSubsplines;
               G = // x, y
               [
               [0.00000, 0.00000],
               [1.00000, 1.00000]];
               Gt = AkimaSubsplines;
               B = // x, y
               [
               [0.00000, 0.00000],
               [1.00000, 1.00000]];
               Bt = AkimaSubsplines;
               K = // x, y
               [
               [0.00000, 0.00000],
               [1.00000, 1.00000]];
               Kt = AkimaSubsplines;
               L = // x, y
               [
               [0.00000, 0.00000],
               [1.00000, 1.00000]];
               Lt = AkimaSubsplines;
               a = // x, y
               [
               [0.00000, 0.00000],
               [1.00000, 1.00000]];
               at = AkimaSubsplines;
               b = // x, y
               [
               [0.00000, 0.00000],
               [1.00000, 1.00000]];
               bt = AkimaSubsplines;
               c = // x, y
               [
               [0.00000, 0.00000],
               [1.00000, 1.00000]];
               ct = AkimaSubsplines;
               H = // x, y
               [
               [0.00000, 0.00000],
               [0.07660, 0.16625],
               [0.30638, 0.31486],
               [0.57660, 0.50630],
               [0.65957, 0.65743],
               [0.91915, 0.81864],
               [0.97447, 0.97733],
               [1.00000, 1.00000]];
               Ht = AkimaSubsplines;
               S = // x, y
               [
               [0.00000, 0.00000],
               [1.00000, 1.00000]];
               St = AkimaSubsplines;

               executeOn(outputView);
            }

            // then apply a second Curves process
            var colourCurve2 = new CurvesTransformation;
            with ( colourCurve2 )
            {
               R = // x, y
               [
               [0.00000, 0.00000],
               [1.00000, 1.00000]];
               Rt = AkimaSubsplines;
               G = // x, y
               [
               [0.00000, 0.00000],
               [1.00000, 1.00000]];
               Gt = AkimaSubsplines;
               B = // x, y
               [
               [0.00000, 0.00000],
               [1.00000, 1.00000]];
               Bt = AkimaSubsplines;
               K = // x, y
               [
               [0.00000, 0.00000],
               [1.00000, 1.00000]];
               Kt = AkimaSubsplines;
               L = // x, y
               [
               [0.00000, 0.00000],
               [1.00000, 1.00000]];
               Lt = AkimaSubsplines;
               a = // x, y
               [
               [0.00000, 0.00000],
               [1.00000, 1.00000]];
               at = AkimaSubsplines;
               b = // x, y
               [
               [0.00000, 0.00000],
               [1.00000, 1.00000]];
               bt = AkimaSubsplines;
               c = // x, y
               [
               [0.00000, 0.00000],
               [1.00000, 1.00000]];
               ct = AkimaSubsplines;
               H = // x, y
               [
               [0.00000, 0.00000],
               [0.17234, 0.16373],
               [0.32128, 0.29219],
               [0.50000, 0.50378],
               [0.90000, 0.80101],
               [0.98511, 0.98237],
               [1.00000, 1.00000]];
               Ht = AkimaSubsplines;
               S = // x, y
               [
               [0.00000, 0.00000],
               [1.00000, 1.00000]];
               St = AkimaSubsplines;

               executeOn(outputView);
            }
         }

         //

         // all proceesing is now complete as far as outputView is concerned,
         // so inform the core application that this is the case
         outputView.endProcess();

         if ( !DEBUGGING_MODE_ON )
         {
            // write the output image to disk using
            // Boolean ImageWindow.saveAs(
            //    String filePath[,
            //    Boolean queryOptions[,
            //    Boolean allowMessages[,
            //    Boolean strict[,
            //    Boolean verifyOverwrite]]]] )

            outputImageWindow.saveAs( outputName, false, false, false, false );
            // this statement will force ImageWindow to disable all format and security features, as follows
            //    disable query format-specific options
            //    disable warning messages on missing format features (icc profiles, etc)
            //    disable strict image writing mode (ignore lossy image generation)
            //    disable overwrite verification/protection
         }

         var stopTime = Date.now();
         console.writeln("Elapsed Time ", (stopTime - startTime)/1000," seconds");

         // close the source and output image windows
         // ##Note## : Because inputImageWindow.show() and outputImageWindow.show() are only ever
         // called if 'debugging' is enabled, these images will have remained hidden. However,
         // the windows still need to be closed when processing is finished (unless debugging is ON)
         if ( !DEBUGGING_MODE_ON )
         {
            inputImageWindow[0].purge();
            inputImageWindow[0].close();

            outputImageWindow.purge();
            outputImageWindow.close();

            // call the JSR 'garbage collection routine' - may need multiple calls to help regain memory, etc.
            gc();
         }
      } // end of the main 'for-all-images' loop (whose 'counter' variable was 'i')
   }

   // call the JSR 'garbage collection routine' - may need multiple calls to help regain memory, etc.
   gc();
}

function convert( RAWimage, RGBimage )
{
   // gather working parameters from the output image
   var numcolumns = RGBimage.width;
   var numrows = RGBimage.height;

   // define working loop variables, to allow the images to be scanned
   var rowcounter = 0;
   var columncounter = 0;

   // used for debugging purposes only
   var CFALine = "";

   // used to identify the 'colour' of the current pixel, according to the CFA
   var CurrentCFAcolour = "";

   // used to hold the raw ADU values for the 3x3 grid centred at the current pixel location
   var ADUtopleft = 0;
   var ADUtopcentre = 0;
   var ADUtopright = 0;

   var ADUmiddleleft = 0;
   var ADUmiddlecentre = 0;
   var ADUmiddleright = 0;

   var ADUbottomleft = 0;
   var ADUbottomcentre = 0;
   var ADUbottomright = 0;

   // define more 'code-friendly' variable names
   var RdCy = globalData.deBayerKernel[0];
   var RdMg = globalData.deBayerKernel[1];
   var RdYe = globalData.deBayerKernel[2];
   var RdGn = globalData.deBayerKernel[3];

   var GnCy = globalData.deBayerKernel[4];
   var GnMg = globalData.deBayerKernel[5];
   var GnYe = globalData.deBayerKernel[6];
   var GnGn = globalData.deBayerKernel[7];

   var BuCy = globalData.deBayerKernel[8];
   var BuMg = globalData.deBayerKernel[9];
   var BuYe = globalData.deBayerKernel[10];
   var BuGn = globalData.deBayerKernel[11];

   // define variables that will hold the resultant ADU values for the current pixel, in CFA 'secondary' colours
   var CyADU = 0;
   var MgADU = 0;
   var YeADU = 0;
   var GnADU = 0;

   // define variables that will hold the 'primary colour' ADU values
   var Rd_ADU = 0;
   var Gn_ADU = 0;
   var Bu_ADU = 0;

   // define scaling factors for the 'nearest neighbour' cells - based on FWHM (set elsewhere)
   // ##ToDo## : THE USER INTERFACE REQUIRED TO SET/CHANGE THE FWHM ARRAY NEEDS TO BE CREATED
   // HOWEVER, SEE THE OTHER 'FWHM' NOTES - IT MAY NOT BE THE CORRECT 'WAY FORWARD'
   var crnrScale = globalData.cornerScaleFactor;
   var sideScale = globalData.sideScaleFactor;

   if ( DEBUGGING_MODE_ON )
   {
      CFALine = "";
      numcolumns = 6;
      numrows = 6;

      console.writeln(RdCy + " " + RdMg + " " + RdYe + " " + RdGn);
      console.writeln(GnCy + " " + GnMg + " " + GnYe + " " + GnGn);
      console.writeln(BuCy + " " + BuMg + " " + BuYe + " " + BuGn);
      console.writeln("");
   }

/*
   // this code section seems to cause the convert() call to run slower and slower
   // it has therefore been temporarily removed, pending further investigation
   // ##ToDo## : FIND OUT WHAT THE PROBLEM IS
   if ( !DEBUGGING_MODE_ON )
   {
      // Initialize the status monitoring system for this image.
      // The status monitor will provide progress information on the console.
      RGBimage.statusEnabled = true;
      RGBimage.initializeStatus( "DeBayer Conversion", numrows * numcolumns );

      // Don't allow other routines to re-initialize the status monitor
      RGBimage.statusInitializationEnabled = false;
   }
*/

   // for each row
   for ( var rowcounter = 1; rowcounter < (numrows - 1); ++rowcounter )
   {
      if ( DEBUGGING_MODE_ON )
      {
         CFALine = "";
      }

      // for each column
      for ( var columncounter = 1; columncounter < (numcolumns - 1); ++columncounter )
      {
         var CFAcolumn = Math.mod(columncounter,2);
         var CFArow = Math.mod(rowcounter,4);

         CurrentCFAcolour = workingCFApixelGrid[CFArow][CFAcolumn];

         ADUtopleft = RAWimage.sample(columncounter - 1,rowcounter - 1);
         ADUtopcentre = RAWimage.sample(columncounter,rowcounter - 1);
         ADUtopright = RAWimage.sample(columncounter + 1,rowcounter - 1);

         ADUmiddleleft = RAWimage.sample(columncounter - 1,rowcounter);
         ADUmiddlecentre = RAWimage.sample(columncounter,rowcounter);
         ADUmiddleright = RAWimage.sample(columncounter + 1,rowcounter);

         ADUbottomleft = RAWimage.sample(columncounter - 1,rowcounter + 1);
         ADUbottomcentre = RAWimage.sample(columncounter,rowcounter + 1);
         ADUbottomright = RAWimage.sample(columncounter + 1,rowcounter + 1);

         if ( DEBUGGING_MODE_ON )
         {
            ADUtopleft = Math.floor(ADUtopleft * 65535);
            ADUtopcentre = Math.floor(ADUtopcentre * 65535);
            ADUtopright = Math.floor(ADUtopright * 65535);

            ADUmiddleleft = Math.trunc(ADUmiddleleft * 65535);
            ADUmiddlecentre = Math.trunc(ADUmiddlecentre * 65535);
            ADUmiddleright = Math.trunc(ADUmiddleright * 65535);

            ADUbottomleft = Math.trunc(ADUbottomleft * 65535);
            ADUbottomcentre = Math.trunc(ADUbottomcentre * 65535);
            ADUbottomright = Math.trunc(ADUbottomright * 65535);

            console.writeln("R" + rowcounter + "C" + columncounter);
            console.writeln(ADUtopleft + " " + ADUtopcentre + " " + ADUtopright);
            console.writeln(ADUmiddleleft + " " + ADUmiddlecentre + " " + ADUmiddleright);
            console.writeln(ADUbottomleft + " " + ADUbottomcentre + " " + ADUbottomright);
         }

         // get the 'nearest neighbour' values, based on 'where' in the CFA grid the 'current' pixel is
         // irrespective of FWHM, 'corner' pixels contribute 25% of ADU value, 'side' pixels contribute 50%
         // obviously, the 'centre' pixel contributes the full 100% of its ADU value
         switch(CurrentCFAcolour)
         {
            case "C1":
               CyADU = ADUmiddlecentre;
               MgADU = ((ADUtopleft + ADUtopright) * crnrScale) + (ADUbottomcentre * sideScale);
               YeADU = (ADUmiddleleft + ADUmiddleright) * sideScale;
               GnADU = ((ADUbottomleft + ADUbottomright) * crnrScale) + (ADUtopcentre * sideScale);
            break;

            case "C2":
               CyADU = ADUmiddlecentre;
               MgADU = ((ADUbottomleft + ADUbottomright) * crnrScale) + (ADUtopcentre * sideScale);
               YeADU = (ADUmiddleleft + ADUmiddleright) * sideScale;
               GnADU = ((ADUtopleft + ADUtopright) * crnrScale) + (ADUbottomcentre * sideScale);
            break;

            case "M1":
               CyADU = (ADUtopcentre + ADUbottomcentre) * sideScale;
               MgADU = ADUmiddlecentre;
               YeADU = (ADUtopleft + ADUtopright + ADUbottomleft + ADUbottomright) * crnrScale;
               GnADU = (ADUmiddleleft + ADUmiddleright) * sideScale;
            break;

            case "M2":
               CyADU = (ADUtopleft + ADUtopright + ADUbottomleft + ADUbottomright) * crnrScale;
               MgADU = ADUmiddlecentre;
               YeADU = (ADUtopcentre + ADUbottomcentre) * sideScale;
               GnADU = (ADUmiddleleft + ADUmiddleright) * sideScale;
            break;

            case "Y1":
               CyADU = (ADUmiddleleft + ADUmiddleright) * sideScale;
               MgADU = ((ADUbottomleft + ADUbottomright) * crnrScale) + (ADUtopcentre * sideScale);
               YeADU = ADUmiddlecentre;
               GnADU = ((ADUtopleft + ADUtopright) * crnrScale) + (ADUbottomcentre * sideScale);
            break;

            case "Y2":
               CyADU = (ADUmiddleleft + ADUmiddleright) * sideScale;
               MgADU = ((ADUtopleft + ADUtopright) * crnrScale) + (ADUbottomcentre * sideScale);
               YeADU = ADUmiddlecentre;
               GnADU = ((ADUbottomleft + ADUbottomright) * crnrScale) + (ADUtopcentre * sideScale);
            break;

            case "G1":
               CyADU = (ADUtopleft + ADUtopright + ADUbottomleft + ADUbottomright) * crnrScale;
               MgADU = (ADUmiddleleft + ADUmiddleright) * sideScale;
               YeADU = (ADUtopcentre + ADUbottomcentre) * sideScale;
               GnADU = ADUmiddlecentre;
            break;

            case "G2":
               CyADU = (ADUtopcentre + ADUbottomcentre) * sideScale;
               MgADU = (ADUmiddleleft + ADUmiddleright) * sideScale;
               YeADU = (ADUtopleft + ADUtopright + ADUbottomleft + ADUbottomright) * crnrScale;
               GnADU = ADUmiddlecentre;
            break;

         } // end of switch(CurrentCFAcolour)

         if ( DEBUGGING_MODE_ON )
         {
            CFALine += CurrentCFAcolour;
         }

         // calculate the primary colour ADU values by applying the deBayer array kernel
         // values to the secondary CFA values that have just been interpolated
         Rd_ADU = (CyADU * RdCy) + (MgADU * RdMg) + (YeADU * RdYe) + (GnADU * RdGn);
         Gn_ADU = (CyADU * GnCy) + (MgADU * GnMg) + (YeADU * GnYe) + (GnADU * GnGn);
         Bu_ADU = (CyADU * BuCy) + (MgADU * BuMg) + (YeADU * BuYe) + (GnADU * BuGn);

/*
         // the following loop demonstrates how to copy an image 'pixel by pixel'
         // for each row
         for (var rowcounter = 0; rowcounter < numrows, ++rowcounter)
         {
            // for each column
            for (var columncounter = 0; columncounter < numcolumns; ++columncounter)
            {
               // for each channel
               for ( var channelcounter = 0; channelcounter < numchannels; ++channelcounter )
               {
                  var sourceADU = RAWimage.sample( columncounter, rowcounter, channelcounter )
                  RGBimage.setSample( sourceADU, columncounter, rowcounter, channelcounter );
               }
            }
         }
*/

         // transfer the calculated ADU values into the output image, on a channel by channel basis
         RGBimage.setSample( Rd_ADU, columncounter, rowcounter, 0 );
         RGBimage.setSample( Gn_ADU, columncounter, rowcounter, 1 );
         RGBimage.setSample( Bu_ADU, columncounter, rowcounter, 2 );

/*
         // this code section seems to cause the convert() call to run slower and slower
         // it has therefore been temporarily removed, pending further investigation
         // ##ToDo## : FIND OUT WHAT THE PROBLEM IS
         // Update status monitoring (progress information)
         if ( !DEBUGGING_MODE_ON )
         {
            RGBimage.advanceStatus( 1 );
         }
*/

      } // end of column loop

      if ( DEBUGGING_MODE_ON )
      {
         console.writeln (CFALine);
         console.writeln ("");
      }

   } //end of row loop

/*
   // this code section seems to cause the convert() call to run slower and slower
   // it has therefore been temporarily removed, pending further investigation
   // ##ToDo## : FIND OUT WHAT THE PROBLEM IS
   // final update of status monitoring (progress information)
   if ( !DEBUGGING_MODE_ON )
   {
      RGBimage.advanceStatus( numrows * numcolumns );
   }
*/

   //

   // deal with the first and last rows of the new image, as well as the left and right side columns
   // each interpolated pixel is the average of the three nearest neighbour pixels in the completed row/column

   // for the first row
   rowcounter = 0;
   // for each column, excluding the 'corners'
   for ( columncounter = 2; columncounter < (numcolumns - 2); ++columncounter )
   {
      Rd_ADU = RGBimage.sample (columncounter-1,rowcounter+1,0)
               + RGBimage.sample (columncounter,rowcounter+1,0)
               + RGBimage.sample (columncounter+1,rowcounter+1,0);

      Gn_ADU = RGBimage.sample (columncounter-1,rowcounter+1,1)
               + RGBimage.sample (columncounter,rowcounter+1,1)
               + RGBimage.sample (columncounter+1,rowcounter+1,1);

      Bu_ADU = RGBimage.sample (columncounter-1,rowcounter+1,2)
               + RGBimage.sample (columncounter,rowcounter+1,2)
               + RGBimage.sample (columncounter+1,rowcounter+1,2);

      RGBimage.setSample( Rd_ADU / 3, columncounter, rowcounter, 0 );
      RGBimage.setSample( Gn_ADU / 3, columncounter, rowcounter, 1 );
      RGBimage.setSample( Bu_ADU / 3, columncounter, rowcounter, 2 );
   } //end of column loop

   // for the last row
   rowcounter = numrows-1;
   // for each column, excluding the 'corners'
   for ( columncounter = 2; columncounter < (numcolumns - 2); ++columncounter )
   {
      Rd_ADU = RGBimage.sample (columncounter-1,rowcounter-1,0)
               + RGBimage.sample (columncounter,rowcounter-1,0)
               + RGBimage.sample (columncounter+1,rowcounter-1,0);

      Gn_ADU = RGBimage.sample (columncounter-1,rowcounter-1,1)
               + RGBimage.sample (columncounter,rowcounter-1,1)
               + RGBimage.sample (columncounter+1,rowcounter-1,1);

      Bu_ADU = RGBimage.sample (columncounter-1,rowcounter-1,2)
               + RGBimage.sample (columncounter,rowcounter-1,2)
               + RGBimage.sample (columncounter+1,rowcounter-1,2);

      RGBimage.setSample( Rd_ADU / 3, columncounter, rowcounter, 0 );
      RGBimage.setSample( Gn_ADU / 3, columncounter, rowcounter, 1 );
      RGBimage.setSample( Bu_ADU / 3, columncounter, rowcounter, 2 );
   } //end of column loop

   // for the first column
   columncounter = 0;
   // for each row, excluding the 'corners'
   for ( rowcounter = 2; rowcounter < (numrows - 2); ++rowcounter )
   {
      Rd_ADU = RGBimage.sample (columncounter+1,rowcounter-1,0)
               + RGBimage.sample (columncounter+1,rowcounter,0)
               + RGBimage.sample (columncounter+1,rowcounter+1,0);

      Gn_ADU = RGBimage.sample (columncounter+1,rowcounter-1,1)
               + RGBimage.sample (columncounter+1,rowcounter,1)
               + RGBimage.sample (columncounter+1,rowcounter+1,1);

      Bu_ADU = RGBimage.sample (columncounter+1,rowcounter-1,2)
               + RGBimage.sample (columncounter+1,rowcounter,2)
               + RGBimage.sample (columncounter+1,rowcounter+1,2);

      RGBimage.setSample( Rd_ADU / 3, columncounter, rowcounter, 0 );
      RGBimage.setSample( Gn_ADU / 3, columncounter, rowcounter, 1 );
      RGBimage.setSample( Bu_ADU / 3, columncounter, rowcounter, 2 );
   } //end of row loop

   // for the last column
   columncounter = numcolumns-1;
   // for each row, excluding the 'corners'
   for ( rowcounter = 2; rowcounter < (numrows - 2); ++rowcounter )
   {
      Rd_ADU =   RGBimage.sample (columncounter-1,rowcounter-1,0)
               + RGBimage.sample (columncounter-1,rowcounter,0)
               + RGBimage.sample (columncounter-1,rowcounter+1,0);

      Gn_ADU =   RGBimage.sample (columncounter-1,rowcounter-1,1)
               + RGBimage.sample (columncounter-1,rowcounter,1)
               + RGBimage.sample (columncounter-1,rowcounter+1,1);

      Bu_ADU =   RGBimage.sample (columncounter-1,rowcounter-1,2)
               + RGBimage.sample (columncounter-1,rowcounter,2)
               + RGBimage.sample (columncounter-1,rowcounter+1,2);

      RGBimage.setSample( Rd_ADU / 3, columncounter, rowcounter, 0 );
      RGBimage.setSample( Gn_ADU / 3, columncounter, rowcounter, 1 );
      RGBimage.setSample( Bu_ADU / 3, columncounter, rowcounter, 2 );
   } //end of row loop

   //

   // deal with the four corners of the new image
   // each interpolated pixel is the average of the three nearest neighbour pixels in the completed row/column

   // for the top left corner, right-side pixel
   columncounter = 1;
   rowcounter = 0;
      Rd_ADU =   RGBimage.sample (columncounter+1,rowcounter,0)
               + RGBimage.sample (columncounter,rowcounter+1,0)
               + RGBimage.sample (columncounter+1,rowcounter+1,0);

      Gn_ADU =   RGBimage.sample (columncounter+1,rowcounter,1)
               + RGBimage.sample (columncounter,rowcounter+1,1)
               + RGBimage.sample (columncounter+1,rowcounter+1,1);

      Bu_ADU =   RGBimage.sample (columncounter+1,rowcounter,2)
               + RGBimage.sample (columncounter,rowcounter+1,2)
               + RGBimage.sample (columncounter+1,rowcounter+1,2);

      RGBimage.setSample( Rd_ADU / 3, columncounter, rowcounter, 0 );
      RGBimage.setSample( Gn_ADU / 3, columncounter, rowcounter, 1 );
      RGBimage.setSample( Bu_ADU / 3, columncounter, rowcounter, 2 );

   // for the top left corner, left-side pixel
   columncounter = 0;
   rowcounter = 1;
      Rd_ADU =   RGBimage.sample (columncounter,rowcounter+1,0)
               + RGBimage.sample (columncounter+1,rowcounter,0)
               + RGBimage.sample (columncounter+1,rowcounter+1,0);

      Gn_ADU =   RGBimage.sample (columncounter,rowcounter+1,1)
               + RGBimage.sample (columncounter+1,rowcounter,1)
               + RGBimage.sample (columncounter+1,rowcounter+1,1);

      Bu_ADU =   RGBimage.sample (columncounter,rowcounter+1,2)
               + RGBimage.sample (columncounter+1,rowcounter,2)
               + RGBimage.sample (columncounter+1,rowcounter+1,2);

      RGBimage.setSample( Rd_ADU / 3, columncounter, rowcounter, 0 );
      RGBimage.setSample( Gn_ADU / 3, columncounter, rowcounter, 1 );
      RGBimage.setSample( Bu_ADU / 3, columncounter, rowcounter, 2 );

   // for the top left corner, corner pixel
   columncounter = 0;
   rowcounter = 0;
      Rd_ADU =   RGBimage.sample (columncounter+1,rowcounter,0)
               + RGBimage.sample (columncounter+1,rowcounter+1,0)
               + RGBimage.sample (columncounter,rowcounter+1,0);

      Gn_ADU =   RGBimage.sample (columncounter+1,rowcounter,1)
               + RGBimage.sample (columncounter+1,rowcounter+1,1)
               + RGBimage.sample (columncounter,rowcounter+1,1);

      Bu_ADU =   RGBimage.sample (columncounter+1,rowcounter,2)
               + RGBimage.sample (columncounter+1,rowcounter+1,2)
               + RGBimage.sample (columncounter,rowcounter+1,2);

      RGBimage.setSample( Rd_ADU / 3, columncounter, rowcounter, 0 );
      RGBimage.setSample( Gn_ADU / 3, columncounter, rowcounter, 1 );
      RGBimage.setSample( Bu_ADU / 3, columncounter, rowcounter, 2 );

   // for the top left corner, left-side pixel
   columncounter = numcolumns-2;
   rowcounter = 0;
      Rd_ADU =   RGBimage.sample (columncounter-1,rowcounter,0)
               + RGBimage.sample (columncounter,rowcounter+1,0)
               + RGBimage.sample (columncounter-1,rowcounter+1,0);

      Gn_ADU =   RGBimage.sample (columncounter-1,rowcounter,1)
               + RGBimage.sample (columncounter,rowcounter+1,1)
               + RGBimage.sample (columncounter-1,rowcounter+1,1);

      Bu_ADU =   RGBimage.sample (columncounter-1,rowcounter,2)
               + RGBimage.sample (columncounter,rowcounter+1,2)
               + RGBimage.sample (columncounter-1,rowcounter+1,2);

      RGBimage.setSample( Rd_ADU / 3, columncounter, rowcounter, 0 );
      RGBimage.setSample( Gn_ADU / 3, columncounter, rowcounter, 1 );
      RGBimage.setSample( Bu_ADU / 3, columncounter, rowcounter, 2 );

   // for the top left corner, right-side pixel
   columncounter = numcolumns-1;
   rowcounter = 1;
      Rd_ADU =   RGBimage.sample (columncounter,rowcounter+1,0)
               + RGBimage.sample (columncounter-1,rowcounter,0)
               + RGBimage.sample (columncounter-1,rowcounter+1,0);

      Gn_ADU =   RGBimage.sample (columncounter,rowcounter+1,1)
               + RGBimage.sample (columncounter-1,rowcounter,1)
               + RGBimage.sample (columncounter-1,rowcounter+1,1);

      Bu_ADU =   RGBimage.sample (columncounter,rowcounter+1,2)
               + RGBimage.sample (columncounter-1,rowcounter,2)
               + RGBimage.sample (columncounter-1,rowcounter+1,2);

      RGBimage.setSample( Rd_ADU / 3, columncounter, rowcounter, 0 );
      RGBimage.setSample( Gn_ADU / 3, columncounter, rowcounter, 1 );
      RGBimage.setSample( Bu_ADU / 3, columncounter, rowcounter, 2 );

   // for the top left corner, corner pixel
   columncounter = numcolumns-1;
   rowcounter = 0;
      Rd_ADU =   RGBimage.sample (columncounter-1,rowcounter,0)
               + RGBimage.sample (columncounter-1,rowcounter+1,0)
               + RGBimage.sample (columncounter,rowcounter+1,0);

      Gn_ADU =   RGBimage.sample (columncounter-1,rowcounter,1)
               + RGBimage.sample (columncounter-1,rowcounter+1,1)
               + RGBimage.sample (columncounter,rowcounter+1,1);

      Bu_ADU =   RGBimage.sample (columncounter-1,rowcounter,2)
               + RGBimage.sample (columncounter-1,rowcounter+1,2)
               + RGBimage.sample (columncounter,rowcounter+1,2);

      RGBimage.setSample( Rd_ADU / 3, columncounter, rowcounter, 0 );
      RGBimage.setSample( Gn_ADU / 3, columncounter, rowcounter, 1 );
      RGBimage.setSample( Bu_ADU / 3, columncounter, rowcounter, 2 );

   // for the bottom left corner, left-side pixel
   columncounter = 0;
   rowcounter = numrows-2;
      Rd_ADU =   RGBimage.sample (columncounter,rowcounter-1,0)
               + RGBimage.sample (columncounter+1,rowcounter,0)
               + RGBimage.sample (columncounter+1,rowcounter-1,0);

      Gn_ADU =   RGBimage.sample (columncounter,rowcounter-1,1)
               + RGBimage.sample (columncounter+1,rowcounter,1)
               + RGBimage.sample (columncounter+1,rowcounter-1,1);

      Bu_ADU =   RGBimage.sample (columncounter,rowcounter-1,2)
               + RGBimage.sample (columncounter+1,rowcounter,2)
               + RGBimage.sample (columncounter+1,rowcounter-1,2);

      RGBimage.setSample( Rd_ADU / 3, columncounter, rowcounter, 0 );
      RGBimage.setSample( Gn_ADU / 3, columncounter, rowcounter, 1 );
      RGBimage.setSample( Bu_ADU / 3, columncounter, rowcounter, 2 );

   // for the bottom left corner, right-side pixel
   columncounter = 1;
   rowcounter = numrows-1;
      Rd_ADU =   RGBimage.sample (columncounter+1,rowcounter,0)
               + RGBimage.sample (columncounter,rowcounter-1,0)
               + RGBimage.sample (columncounter+1,rowcounter-1,0);

      Gn_ADU =   RGBimage.sample (columncounter+1,rowcounter,1)
               + RGBimage.sample (columncounter,rowcounter-1,1)
               + RGBimage.sample (columncounter+1,rowcounter-1,1);

      Bu_ADU =   RGBimage.sample (columncounter+1,rowcounter,2)
               + RGBimage.sample (columncounter,rowcounter-1,2)
               + RGBimage.sample (columncounter+1,rowcounter-1,2);

      RGBimage.setSample( Rd_ADU / 3, columncounter, rowcounter, 0 );
      RGBimage.setSample( Gn_ADU / 3, columncounter, rowcounter, 1 );
      RGBimage.setSample( Bu_ADU / 3, columncounter, rowcounter, 2 );

   // for the bottom left corner, corner pixel
   columncounter = 0;
   rowcounter = numrows-1;
      Rd_ADU =   RGBimage.sample (columncounter,rowcounter-1,0)
               + RGBimage.sample (columncounter+1,rowcounter-1,0)
               + RGBimage.sample (columncounter+1,rowcounter,0);

      Gn_ADU =   RGBimage.sample (columncounter,rowcounter-1,1)
               + RGBimage.sample (columncounter+1,rowcounter-1,1)
               + RGBimage.sample (columncounter+1,rowcounter,1);

      Bu_ADU =   RGBimage.sample (columncounter,rowcounter-1,2)
               + RGBimage.sample (columncounter+1,rowcounter-1,2)
               + RGBimage.sample (columncounter+1,rowcounter,2);

      RGBimage.setSample( Rd_ADU / 3, columncounter, rowcounter, 0 );
      RGBimage.setSample( Gn_ADU / 3, columncounter, rowcounter, 1 );
      RGBimage.setSample( Bu_ADU / 3, columncounter, rowcounter, 2 );

   // for the bottom right corner, right-side pixel
   columncounter = numcolumns-1;
   rowcounter = numrows-2;
      Rd_ADU =   RGBimage.sample (columncounter,rowcounter-1,0)
               + RGBimage.sample (columncounter-1,rowcounter,0)
               + RGBimage.sample (columncounter-1,rowcounter-1,0);

      Gn_ADU =   RGBimage.sample (columncounter,rowcounter-1,1)
               + RGBimage.sample (columncounter-1,rowcounter,1)
               + RGBimage.sample (columncounter-1,rowcounter-1,1);

      Bu_ADU =   RGBimage.sample (columncounter,rowcounter-1,2)
               + RGBimage.sample (columncounter-1,rowcounter,2)
               + RGBimage.sample (columncounter-1,rowcounter-1,2);

      RGBimage.setSample( Rd_ADU / 3, columncounter, rowcounter, 0 );
      RGBimage.setSample( Gn_ADU / 3, columncounter, rowcounter, 1 );
      RGBimage.setSample( Bu_ADU / 3, columncounter, rowcounter, 2 );

   // for the bottom right corner, left-side pixel
   columncounter = numcolumns-2;
   rowcounter = numrows-1;
      Rd_ADU =   RGBimage.sample (columncounter-1,rowcounter,0)
               + RGBimage.sample (columncounter,rowcounter-1,0)
               + RGBimage.sample (columncounter-1,rowcounter-1,0);

      Gn_ADU =   RGBimage.sample (columncounter-1,rowcounter,1)
               + RGBimage.sample (columncounter,rowcounter-1,1)
               + RGBimage.sample (columncounter-1,rowcounter-1,1);

      Bu_ADU =   RGBimage.sample (columncounter-1,rowcounter,2)
               + RGBimage.sample (columncounter,rowcounter-1,2)
               + RGBimage.sample (columncounter-1,rowcounter-1,2);

      RGBimage.setSample( Rd_ADU / 3, columncounter, rowcounter, 0 );
      RGBimage.setSample( Gn_ADU / 3, columncounter, rowcounter, 1 );
      RGBimage.setSample( Bu_ADU / 3, columncounter, rowcounter, 2 );

   // for the bottom right corner, corner pixel
   columncounter = numcolumns-1;
   rowcounter = numrows-1;
      Rd_ADU =   RGBimage.sample (columncounter,rowcounter-1,0)
               + RGBimage.sample (columncounter-1,rowcounter-1,0)
               + RGBimage.sample (columncounter-1,rowcounter,0);

      Gn_ADU =   RGBimage.sample (columncounter,rowcounter-1,1)
               + RGBimage.sample (columncounter-1,rowcounter-1,1)
               + RGBimage.sample (columncounter-1,rowcounter,1);

      Bu_ADU =   RGBimage.sample (columncounter,rowcounter-1,2)
               + RGBimage.sample (columncounter-1,rowcounter-1,2)
               + RGBimage.sample (columncounter-1,rowcounter,2);

      RGBimage.setSample( Rd_ADU / 3, columncounter, rowcounter, 0 );
      RGBimage.setSample( Gn_ADU / 3, columncounter, rowcounter, 1 );
      RGBimage.setSample( Bu_ADU / 3, columncounter, rowcounter, 2 );

} // end of function convert( RAWimage, RGBimage )

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
   this.setupDialog = new deBayerDialog( this );


   // ##Note## : The dialog looks much better if all labels are right-justified. It is customary
   // to define the minimum (or fixed) width of all labels to be the length, in pixels, of the
   // longest label, taking into account the current dialog font (which is mainly a platform-dependent setting)
   // it is currently assumed that the following label will be the 'widest' one
   var labelWidth1 = this.font.width( "Output extension :" );

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
   "<b>Batch CMYG DeBayer Converter</b>" + "<br>" +
   "   A batch image deBayer conversion utility for (Meade DSI) CMYG OSC CCD imagers" + "<br>" +
   "   Niall J. Saunders B.Sc. MIET [Clinterty Observatories. Aberdeen, SCOTLAND]";

   //

   // adds a tree box, used to display the list of files selected for conversion
   // ##ToDo## : THIS CONSTRUCT HAS NOT YET BEEN FULLY EXPLORED, AND IS THEREFORE NOT FULLY COMMENTED
   this.files_TreeBox = new TreeBox( this );
   this.files_TreeBox.multipleSelection = true;
   this.files_TreeBox.rootDecoration = false;
   this.files_TreeBox.alternateRowColor = true;
   this.files_TreeBox.setScaledMinSize( 600, 200 );
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
      // ofd.loadImageFilters(); // the statement would provide NO restriction to the list of input files
      // however, the file list ought to be restricted to '.fts' type files only
      ofd.filters = [[ "FITS Files", ".fit", ".fits", ".fts" ]];
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
   this.outputDirSelect_Button.text = " Select ";
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
   }

   //

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
      // Trim whitespace at both ends of the file extension string
      // ##ToThink## : Add trim(), trimLeft() and trimRight() methods to String
      //              (which departs from ECMAScript specification) ?
      var ext = ""
      var i = 0;
      var j = this.text.length;
      for ( ; i < j && this.text.charAt( i ) == ' '; ++i ) {}
      for ( ; --j > i && this.text.charAt( j ) == ' '; ) {}
      if ( i <= j )
         ext = this.text.substring( i, j+1 ).toLowerCase();
            // Image extensions are always lowercase in PI/PCL

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

   // add a button that will, when clicked, open up a second dialog window
   // that will allow the deByering process to be controlled
   this.setup_Button = new PushButton( this );
   this.setup_Button.text = " DeBayer Setup ";

   // add a function to respond to the setup button being pressed
   this.setup_Button.onClick = function()
   {
      // loop 'for ever', until the secondary dialog is closed
      for ( ; ; )
      {
         // the secondary dialog was closed by pressing the 'OK' button
         if ( this.dialog.setupDialog.execute() )
         {
            // no need to do anything, other than 'break' out of the 'for ever' loop
            break;
         }

         // because 'OK' was not used to exit the secondary dialog, the 'stored' parameters are used
         // to reset the working parameters, thus clearing any changes that 'may' have been made whilst
         // the secondary 'setup' dialog was active (changes are made here in order to catch ALL possible
         // 'exits' from the secondary 'setup' dialog - including pressing the 'X' box on the dialog window
         globalData.chosenDeBayerMethod = globalData.stored_chosenDeBayerMethod;
         // because the 'method' index has been reset, the 'name' and 'kernel' objects also need to be reset
         globalData.deBayerName = globalData.deBayerOptions[globalData.chosenDeBayerMethod].name;
         globalData.deBayerKernel = globalData.deBayerOptions[globalData.chosenDeBayerMethod].kernel;
         globalData.CFAcolOffset = globalData.stored_CFAcolOffset;
         globalData.CFArowOffset = globalData.stored_CFArowOffset;
         globalData.CFAxFlopped = globalData.stored_CFAxFlopped;
         globalData.CFAyFlipped = globalData.stored_CFAyFlipped;
         globalData.applyClippingHisto = globalData.stored_applyClippingHisto;
         globalData.applyRGBmedianAlign = globalData.stored_applyRGBmedianAlign;
         globalData.alignAllMedians = globalData.stored_alignAllMedians;
         globalData.applyColourSaturation = globalData.stored_applyColourSaturation;
         globalData.colourSaturationAmount = globalData.stored_colourSaturationAmount;
         globalData.applyColourCorrectionCurve = globalData.stored_applyColourCorrectionCurve;

         // use 'break' to exit the 'for ever' loop now that the necessary parameters have been reset
         break;
      } // end of the 'for ever' loop
   } // the secondary 'setup' dialog has now been closed

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
   this.buttons_Sizer.add( this.setup_Button);
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

/*
 * deBayer Dialog
 * Used to construct a dialog window that will be called 'deBayerSetupDialog' in mainDialog()
 * Initially, prior to mainDialog() being called,
 * a variable 'deBayerDialog' will have had its 'prototype' property set to 'new Dialog'
 * This action will allow 'deBayerDialog' to inherit all properties and methods from the core Dialog object
 * The following function, when called from within mainDialog(), will 'build' the new 'dialog' variable,
 * whose 'scope' is confined to mainDialog(), 'on top' of the core Dialog properties and methods
 * ##Note## : This function is 'passed' the parent object, i.e. mainDialog(), when it is called from mainDialog()
*/
function deBayerDialog( main )
// previously initialised (prototype) at the start of the script
// then only ever called, ONCE, in mainDialog(), when the <Set DeBayer Options> button is pressed
{
   // Add all properties and methods of the core Dialog object to this object.
   this.__base__ = Dialog;
   this.__base__();

   //

   // define a variable to point at the 'main dialog', i.e. the object that 'called' this one
   this.parentWindow = main;

   // anchor this new dialog 32 pixels from the top-left corner of the parent, 'mainDialog()'
   // (this helps to improve visual identification of dialog hierarchy)
   this.onShow = function()
   {
      var p = new Point( this.parentWindow.position );
      p.moveBy( 32 );
      this.position = p; // for PI v1.5 onwards
      // ##Note## : Unfortunately, the PJSR in PI pre-v1.5.0 has a bug (fixed in PI v1.5.0) that prevents
      // the correct assignment of the 'control.position' property (as shown above, valid for v1.5.0 onwards)
      // the workaround (if needed for pre v1.5.0) is to use the 'control.move()' function, as follows :-
      // this.move( p ); // for pre- PI v1.5.0

      // define variables that will hold the 'original' data values defined prior to any modifications within this dialog
      // (these will be reset if the user presses 'Cancel' to exit, rather than OK)
      // these variables need to be global to allow the data to be reset if the user closes this dialog box by
      // any means other than pressing the 'OK' button
      globalData.stored_chosenDeBayerMethod = globalData.chosenDeBayerMethod;
      globalData.stored_CFAcolOffset = globalData.CFAcolOffset;
      globalData.stored_CFArowOffset = globalData.CFArowOffset;
      globalData.stored_CFAxFlopped = globalData.CFAxFlopped;
      globalData.stored_CFAyFlipped = globalData.CFAyFlipped;
      globalData.stored_applyClippingHisto = globalData.applyClippingHisto;
      globalData.stored_applyRGBmedianAlign = globalData.applyRGBmedianAlign;
      globalData.stored_alignAllMedians = globalData.alignAllMedians;
      globalData.stored_applyColourSaturation = globalData.applyColourSaturation;
      globalData.stored_colourSaturationAmount = globalData.colourSaturationAmount;
      globalData.stored_applyColourCorrectionCurve = globalData.applyColourCorrectionCurve;

      // all values on the secondary dialog box need to be updated 'on-show' to handle
      // the situation where the dialog window was previously closed using 'Cancel', etc.
      // (full details for these statements can be found within each event handler function - see elsewhere)
      this.dialog.deBayerOption_ComboBox.currentItem = globalData.chosenDeBayerMethod;

      this.dialog.kernelCell00_Label.text = format("% 1.5f", globalData.deBayerKernel[0]);
      this.dialog.kernelCell01_Label.text = format("% 1.5f", globalData.deBayerKernel[1]);
      this.dialog.kernelCell02_Label.text = format("% 1.5f", globalData.deBayerKernel[2]);
      this.dialog.kernelCell03_Label.text = format("% 1.5f", globalData.deBayerKernel[3]);

      this.dialog.kernelCell10_Label.text = format("% 1.5f", globalData.deBayerKernel[4]);
      this.dialog.kernelCell11_Label.text = format("% 1.5f", globalData.deBayerKernel[5]);
      this.dialog.kernelCell12_Label.text = format("% 1.5f", globalData.deBayerKernel[6]);
      this.dialog.kernelCell13_Label.text = format("% 1.5f", globalData.deBayerKernel[7]);

      this.dialog.kernelCell20_Label.text = format("% 1.5f", globalData.deBayerKernel[8]);
      this.dialog.kernelCell21_Label.text = format("% 1.5f", globalData.deBayerKernel[9]);
      this.dialog.kernelCell22_Label.text = format("% 1.5f", globalData.deBayerKernel[10]);
      this.dialog.kernelCell23_Label.text = format("% 1.5f", globalData.deBayerKernel[11]);

      this.dialog.CFAxOffset_SpinBox.value = globalData.CFAcolOffset;
      this.dialog.CFAyOffset_SpinBox.value = globalData.CFArowOffset;
      this.dialog.CFAyOffset_SpinBox.value = globalData.CFArowOffset;
      this.dialog.CFAyOffset_SpinBox.value = globalData.CFArowOffset;

      this.dialog.CFACell00_Label.text = workingCFApixelGrid[0][0];
      this.dialog.CFACell01_Label.text = workingCFApixelGrid[0][1];
      this.dialog.CFACell10_Label.text = workingCFApixelGrid[1][0];
      this.dialog.CFACell11_Label.text = workingCFApixelGrid[1][1];
      this.dialog.CFACell20_Label.text = workingCFApixelGrid[2][0];
      this.dialog.CFACell21_Label.text = workingCFApixelGrid[2][1];
      this.dialog.CFACell30_Label.text = workingCFApixelGrid[3][0];
      this.dialog.CFACell31_Label.text = workingCFApixelGrid[3][1];

      this.dialog.CFAxFlop_CheckBox.checked = globalData.CFAxFlopped;
      this.dialog.CFAyFlip_CheckBox.checked = globalData.CFAyFlipped;

      this.dialog.applyClippingHisto_CheckBox.checked = globalData.applyClippingHisto;
      this.dialog.RGBmedianAlign_CheckBox.checked = globalData.applyRGBmedianAlign;
      this.dialog.alignAllMedians_CheckBox.checked = globalData.alignAllMedians;
      this.dialog.applyColourSaturation_CheckBox.checked = globalData.applyColourSaturation;
      this.dialog.colourSaturationAmount_SpinBox.value = globalData.colourSaturationAmount;
      this.dialog.colourCorrection_CheckBox.checked = globalData.applyColourCorrectionCurve;

      if ( !globalData.applyColourSaturation )
      {
         this.dialog.colourSaturationAmount_Label.enabled = false;
         this.dialog.colourSaturationAmount_SpinBox.enabled = false;
      }
      else
      {
         this.dialog.colourSaturationAmount_Label.enabled = true;
         this.dialog.colourSaturationAmount_SpinBox.enabled = true;
      }
   }

   //

   // ##Note## : The dialog looks much better if all labels are right-justified. It is customary
   // to define the minimum (or fixed) width of all labels to be the length, in pixels, of the
   // longest label, taking into account the current dialog font (which is mainly a platform-dependent setting)
   // it is currently assumed that the following label will be the 'widest' one
   var labelWidth1 = this.font.width("DeBayer Method : ");

   //

   // add a new Text Label, for displaying 'DeBayer Method'
   this.deBayerOption_Label = new Label( this );
   this.deBayerOption_Label.text = "DeBayer Method : ";
   this.deBayerOption_Label.toolTip = "Select a conversion method to perform the DeBayering";
   this.deBayerOption_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.deBayerOption_Label.minWidth = labelWidth1;

   // add a new Combo box, to allow the user to specify which deBayer method should be implemented
   this.deBayerOption_ComboBox = new ComboBox( this );
   // populate the Combo Box using the names in the globalData.deBayerOptions array
   // for each entry in the array
   for ( var i = 0; i < globalData.deBayerOptions.length; ++i )
      // add the name to the Combo Box list
      this.deBayerOption_ComboBox.addItem( globalData.deBayerOptions[i].name );
   // set the 'default' entry in the ComboBox
   this.deBayerOption_ComboBox.currentItem = globalData.chosenDeBayerMethod;
   this.deBayerOption_ComboBox.toolTip = "Select a conversion method to perform the DeBayering";

   // create a function to respond whenever the Combo Box is changed
   this.deBayerOption_ComboBox.onItemSelected = function( index )
   {
      // write-back the pointer from the selected entry in the Combo Box
      globalData.chosenDeBayerMethod = index;
      // update the working-matrix 'name'
      globalData.deBayerName = globalData.deBayerOptions[index].name;
      // update the working-matrix 'ID'
      globalData.deBayerKernel = globalData.deBayerOptions[index].kernel;

      // ##Note## : For full information about the 'format' function, refer to any documentation
      // that covers the well-established <sprintf()> function, common to C, C++, etc.
      // here we are reserving a leading character space as a placeholder for a '-' sign
      // then we require space for a single leading digit, followed by five decimal places

      this.dialog.kernelCell00_Label.text = format("% 1.5f", globalData.deBayerKernel[0]);
      this.dialog.kernelCell01_Label.text = format("% 1.5f", globalData.deBayerKernel[1]);
      this.dialog.kernelCell02_Label.text = format("% 1.5f", globalData.deBayerKernel[2]);
      this.dialog.kernelCell03_Label.text = format("% 1.5f", globalData.deBayerKernel[3]);

      this.dialog.kernelCell10_Label.text = format("% 1.5f", globalData.deBayerKernel[4]);
      this.dialog.kernelCell11_Label.text = format("% 1.5f", globalData.deBayerKernel[5]);
      this.dialog.kernelCell12_Label.text = format("% 1.5f", globalData.deBayerKernel[6]);
      this.dialog.kernelCell13_Label.text = format("% 1.5f", globalData.deBayerKernel[7]);

      this.dialog.kernelCell20_Label.text = format("% 1.5f", globalData.deBayerKernel[8]);
      this.dialog.kernelCell21_Label.text = format("% 1.5f", globalData.deBayerKernel[9]);
      this.dialog.kernelCell22_Label.text = format("% 1.5f", globalData.deBayerKernel[10]);
      this.dialog.kernelCell23_Label.text = format("% 1.5f", globalData.deBayerKernel[11]);
   }

   //

   // this.objectExample.font = new Font( "monospace", 10 ); // best to show tabulated data
   var arrayCellWidth = this.font.width ("-8.88888");
   var sideLabelWidth = this.font.width (" Rd = ");

   // set up the labels for the columns of the table
   var topLabel1 = "Cy";
   var topLabel2 = "Mg";
   var topLabel3 = "Ye";
   var topLabel4 = "Gn";

   this.deBayerArray_topLabel1 = new Label( this );
   this.deBayerArray_topLabel1.text = topLabel1;
   this.deBayerArray_topLabel1.minWidth = arrayCellWidth;
   this.deBayerArray_topLabel1.textAlignment = TextAlign_Center|TextAlign_VertCenter;

   this.deBayerArray_topLabel2 = new Label( this );
   this.deBayerArray_topLabel2.text = topLabel2;
   this.deBayerArray_topLabel2.minWidth = arrayCellWidth;
   this.deBayerArray_topLabel2.textAlignment = TextAlign_Center|TextAlign_VertCenter;

   this.deBayerArray_topLabel3 = new Label( this );
   this.deBayerArray_topLabel3.text = topLabel3;
   this.deBayerArray_topLabel3.minWidth = arrayCellWidth;
   this.deBayerArray_topLabel3.textAlignment = TextAlign_Center|TextAlign_VertCenter;

   this.deBayerArray_topLabel4 = new Label( this );
   this.deBayerArray_topLabel4.text = topLabel4;
   this.deBayerArray_topLabel4.minWidth = arrayCellWidth;
   this.deBayerArray_topLabel4.textAlignment = TextAlign_Center|TextAlign_VertCenter;

   //

   // set up the labels for the rows of the table
   this.deBayerArray_RLabel = new Label( this );
   this.deBayerArray_RLabel.text = "R = ";
   this.deBayerArray_RLabel.minWidth = sideLabelWidth;
   this.deBayerArray_RLabel.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.deBayerArray_GLabel = new Label( this );
   this.deBayerArray_GLabel.text = "G = ";
   this.deBayerArray_GLabel.minWidth = sideLabelWidth;
   this.deBayerArray_GLabel.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.deBayerArray_BLabel = new Label( this );
   this.deBayerArray_BLabel.text = "B = ";
   this.deBayerArray_BLabel.minWidth = sideLabelWidth;
   this.deBayerArray_BLabel.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   //

   // populate the table (reading the values from the current information in the 'globalData' construct)
   // first row of four values
   this.kernelCell00_Label = new Label( this );
   this.kernelCell00_Label.text = format("% 1.5f", globalData.deBayerKernel[0]);
   this.kernelCell00_Label.minWidth = arrayCellWidth;
   this.kernelCell00_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.kernelCell01_Label = new Label( this );
   this.kernelCell01_Label.text = format("% 1.5f", globalData.deBayerKernel[1]);
   this.kernelCell01_Label.minWidth = arrayCellWidth;
   this.kernelCell01_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.kernelCell02_Label = new Label( this );
   this.kernelCell02_Label.text = format("% 1.5f", globalData.deBayerKernel[2]);
   this.kernelCell02_Label.minWidth = arrayCellWidth;
   this.kernelCell02_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.kernelCell03_Label = new Label( this );
   this.kernelCell03_Label.text = format("% 1.5f", globalData.deBayerKernel[3]);
   this.kernelCell03_Label.minWidth = arrayCellWidth;
   this.kernelCell03_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   // second row of four values
   this.kernelCell10_Label = new Label( this );
   this.kernelCell10_Label.text = format("% 1.5f", globalData.deBayerKernel[4]);
   this.kernelCell10_Label.minWidth = arrayCellWidth;
   this.kernelCell10_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.kernelCell11_Label = new Label( this );
   this.kernelCell11_Label.text = format("% 1.5f", globalData.deBayerKernel[5]);
   this.kernelCell11_Label.minWidth = arrayCellWidth;
   this.kernelCell11_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.kernelCell12_Label = new Label( this );
   this.kernelCell12_Label.text = format("% 1.5f", globalData.deBayerKernel[6]);
   this.kernelCell12_Label.minWidth = arrayCellWidth;
   this.kernelCell12_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.kernelCell13_Label = new Label( this );
   this.kernelCell13_Label.text = format("% 1.5f", globalData.deBayerKernel[7]);
   this.kernelCell13_Label.minWidth = arrayCellWidth;
   this.kernelCell13_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   // third row of four values
   this.kernelCell20_Label = new Label( this );
   this.kernelCell20_Label.text = format("% 1.5f", globalData.deBayerKernel[8]);
   this.kernelCell20_Label.minWidth = arrayCellWidth;
   this.kernelCell20_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.kernelCell21_Label = new Label( this );
   this.kernelCell21_Label.text = format("% 1.5f", globalData.deBayerKernel[9]);
   this.kernelCell21_Label.minWidth = arrayCellWidth;
   this.kernelCell21_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.kernelCell22_Label = new Label( this );
   this.kernelCell22_Label.text = format("% 1.5f", globalData.deBayerKernel[10]);
   this.kernelCell22_Label.minWidth = arrayCellWidth;
   this.kernelCell22_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   this.kernelCell23_Label = new Label( this );
   this.kernelCell23_Label.text = format("% 1.5f", globalData.deBayerKernel[11]);
   this.kernelCell23_Label.minWidth = arrayCellWidth;
   this.kernelCell23_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;

   //

   // create a sizer for the first 'label' row
   this.kernelRow1_Sizer = new HorizontalSizer;
   this.kernelRow1_Sizer.spacing = 4;
   this.kernelRow1_Sizer.addSpacing(sideLabelWidth);
   this.kernelRow1_Sizer.add(this.deBayerArray_topLabel1);
   this.kernelRow1_Sizer.add(this.deBayerArray_topLabel2);
   this.kernelRow1_Sizer.add(this.deBayerArray_topLabel3);
   this.kernelRow1_Sizer.add(this.deBayerArray_topLabel4);

   // create a sizer for the first 'data' row
   this.kernelRow2_Sizer = new HorizontalSizer;
   this.kernelRow2_Sizer.spacing = 4;
   this.kernelRow2_Sizer.add(this.deBayerArray_RLabel);
   this.kernelRow2_Sizer.add(this.kernelCell00_Label);
   this.kernelRow2_Sizer.add(this.kernelCell01_Label);
   this.kernelRow2_Sizer.add(this.kernelCell02_Label);
   this.kernelRow2_Sizer.add(this.kernelCell03_Label);

   // create a sizer for the second 'data' row
   this.kernelRow3_Sizer = new HorizontalSizer;
   this.kernelRow3_Sizer.spacing = 4;
   this.kernelRow3_Sizer.add(this.deBayerArray_GLabel);
   this.kernelRow3_Sizer.add(this.kernelCell10_Label);
   this.kernelRow3_Sizer.add(this.kernelCell11_Label);
   this.kernelRow3_Sizer.add(this.kernelCell12_Label);
   this.kernelRow3_Sizer.add(this.kernelCell13_Label);

   // create a sizer for the third 'data' row
   this.kernelRow4_Sizer = new HorizontalSizer;
   this.kernelRow4_Sizer.spacing = 4;
   this.kernelRow4_Sizer.add(this.deBayerArray_BLabel);
   this.kernelRow4_Sizer.add(this.kernelCell20_Label);
   this.kernelRow4_Sizer.add(this.kernelCell21_Label);
   this.kernelRow4_Sizer.add(this.kernelCell22_Label);
   this.kernelRow4_Sizer.add(this.kernelCell23_Label);

   //

   // create a new 'GroupBox' and use it to contain the deBayer kernel itself
   this.kernel_GroupBox = new GroupBox( this );
   // set the GroupBox title
   this.kernel_GroupBox.title = "DeBayer Kernel";
   // because there only two items that need to be within this GroupBox,
   // only a single 'HorizontalSizer' layout is needed
   this.kernel_GroupBox.sizer = new VerticalSizer;
   this.kernel_GroupBox.sizer.margin = 4;
   this.kernel_GroupBox.sizer.spacing = 4;
   // add the four horizontal sizers
   this.kernel_GroupBox.sizer.add( this.kernelRow1_Sizer );
   this.kernel_GroupBox.sizer.add( this.kernelRow2_Sizer );
   this.kernel_GroupBox.sizer.add( this.kernelRow3_Sizer );
   this.kernel_GroupBox.sizer.add( this.kernelRow4_Sizer );

   //

   // create a new 'HorizontalSizer' group that will contain the three objects defined above
   // (i.e. the label, the comboBox and the groupBox)
   this.deBayerOption_Sizer = new HorizontalSizer;
   this.deBayerOption_Sizer.spacing = 8;
   this.deBayerOption_Sizer.margin = 4;
   // add the Label 'as is'
   this.deBayerOption_Sizer.add( this.deBayerOption_Label );
   // add the Combo Box object to the horizontal sizer
   this.deBayerOption_Sizer.add( this.deBayerOption_ComboBox );
   // add a 'stretch' to the sizer, to allow the Combo Box to remain placed in a more 'natural' position
   this.deBayerOption_Sizer.addSpacing(20);
   // add the 'kernel' groupBox
   this.deBayerOption_Sizer.add( this.kernel_GroupBox, 100 );

   //

   // create a new 'GroupBox' and use it to contain the deBayer kernel selection information
   this.deBayer_GroupBox = new GroupBox( this );
   // set the GroupBox title
   this.deBayer_GroupBox.title = "DeBayer Parameters";
   // because there are only two items that need to be within this GroupBox,
   // only a single 'HorizontalSizer' layout is needed
   this.deBayer_GroupBox.sizer = new HorizontalSizer;
   this.deBayer_GroupBox.sizer.margin = 4;
   this.deBayer_GroupBox.sizer.spacing = 4;
   // add the label/combo box sizer 'as is'
   this.deBayer_GroupBox.sizer.add( this.deBayerOption_Sizer );
   // add a 'stretch' to the sizer
   this.deBayer_GroupBox.sizer.addStretch();

   //

   // add SpinBoxes and CheckBoxes, to allow the user to describe the location, order and orientation of the CFA
   // set a minimum width for the offset spinBoxes
   var XYspinBoxWidth = 15 * this.font.width ("0");

   // add a new label for the X-offset SpinBox
   this.CFAxOffset_Label = new Label( this );
   this.CFAxOffset_Label.text = "CFA X-Offset : ";
   this.CFAxOffset_Label.minWidth = labelWidth1;
   this.CFAxOffset_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.CFAxOffset_Label.toolTip = "Enter an X-offset to be applied to the CFA";

   // add a new SpinBox to establish the X-offset of the CFA
   this.CFAxOffset_SpinBox = new SpinBox( this );
   this.CFAxOffset_SpinBox.minValue = 0;
   this.CFAxOffset_SpinBox.maxValue = 1;
   this.CFAxOffset_SpinBox.stepSize = 1;
   this.CFAxOffset_SpinBox.value = globalData.CFAcolOffset;

   // ##Note## : There is a bug in v1.4x (i.e, in Qt 4.4) that prevents the following statement from working
   // i.e. it is not possible to 'centre-align' a value within a spinBox
   // ##Query## : HAVING NOW TESTED THIS ON v1.5.0, THE 'bug' STILL SEEMS TO BE PRESENT. CHECK WITH JUAN
   this.CFAxOffset_SpinBox.textAlignment = TextAlign_Center|TextAlign_VertCenter; // v1.5.0 onwards ONLY (SEE ABOVE)

   this.CFAxOffset_SpinBox.minWidth = XYspinBoxWidth;
   // ##Note## : the spin boxes must be made larger manually when a suffix is used because PI does not compute their
   // widths correctly (a bug-fix scheduled for PI v1.6, BTW!). The current fix is as per <spinBox.minWidth>, above
   this.CFAxOffset_SpinBox.suffix = " pixel(s)";
   // allow the spinBox to 'wrap round' from min value to max, and vice versa
   this.CFAxOffset_SpinBox.wrapping = true;
   this.CFAxOffset_SpinBox.toolTip = "Enter an X-offset to be applied to the CFA";

   // create a function to respond whenever the SpinBox is changed
   this.CFAxOffset_SpinBox.onValueUpdated = function( index )
   {
      globalData.CFAcolOffset = index;
      generate_workingCFApixelGrid();

      this.dialog.CFACell00_Label.text = workingCFApixelGrid[0][0];
      this.dialog.CFACell01_Label.text = workingCFApixelGrid[0][1];
      this.dialog.CFACell10_Label.text = workingCFApixelGrid[1][0];
      this.dialog.CFACell11_Label.text = workingCFApixelGrid[1][1];
      this.dialog.CFACell20_Label.text = workingCFApixelGrid[2][0];
      this.dialog.CFACell21_Label.text = workingCFApixelGrid[2][1];
      this.dialog.CFACell30_Label.text = workingCFApixelGrid[3][0];
      this.dialog.CFACell31_Label.text = workingCFApixelGrid[3][1];
   }

   this.CFAx_Sizer = new HorizontalSizer;
   this.CFAx_Sizer.spacing = 8;
   this.CFAx_Sizer.margin = 4;
   this.CFAx_Sizer.add(this.CFAxOffset_Label);
   this.CFAx_Sizer.add(this.CFAxOffset_SpinBox);
   this.CFAx_Sizer.addStretch();

   //

   // add a new SpinBox to establish the Y-offset of the CFA
   // add a new label for the Y-offset SpinBox
   this.CFAyOffset_Label = new Label( this );
   this.CFAyOffset_Label.text = "CFA Y-Offset : ";
   this.CFAyOffset_Label.minWidth = labelWidth1;
   this.CFAyOffset_Label.textAlignment = TextAlign_Right|TextAlign_VertCenter;
   this.CFAyOffset_Label.toolTip = "Enter a Y-offset to be applied to the CFA";

   // add a new ComboBox to establish the Y-offset of the CFA
   this.CFAyOffset_SpinBox = new SpinBox( this );
   this.CFAyOffset_SpinBox.minValue = 0;
   this.CFAyOffset_SpinBox.maxValue = 3;
   this.CFAyOffset_SpinBox.stepSize = 1;
   this.CFAyOffset_SpinBox.value = globalData.CFArowOffset;

   // ##Note## : There is a bug in v1.4x (i.e, in Qt 4.4) that prevents the following statement from working
   // i.e. it is not possible to 'centre-align' a value within a spinBox
   // ##Query## : HAVING NOW TESTED THIS ON v1.5.0, THE 'bug' STILL SEEMS TO BE PRESENT. CHECK WITH JUAN
   this.CFAyOffset_SpinBox.textAlignment = TextAlign_Center|TextAlign_VertCenter; // v1.5.0 onwards ONLY (SEE ABOVE)

   this.CFAyOffset_SpinBox.minWidth = XYspinBoxWidth;
   // the spin boxes must be made larger manually when a suffix is used because PI does not compute their
   // widths correctly (a bug-fix scheduled for PI v1.6, BTW!). The current fix is as per <spinBox.minWidth>, above
   this.CFAyOffset_SpinBox.suffix = " pixel(s)";
   // allow the spinBox to 'wrap round' from min value to max, and vice versa
   this.CFAyOffset_SpinBox.wrapping = true;
   this.CFAyOffset_SpinBox.toolTip = "Enter an Y-offset to be applied to the CFA";

   // create a function to respond whenever the SpinBox is changed
   this.CFAyOffset_SpinBox.onValueUpdated = function( index )
   {
      globalData.CFArowOffset = index;
      generate_workingCFApixelGrid();

      this.dialog.CFACell00_Label.text = workingCFApixelGrid[0][0];
      this.dialog.CFACell01_Label.text = workingCFApixelGrid[0][1];
      this.dialog.CFACell10_Label.text = workingCFApixelGrid[1][0];
      this.dialog.CFACell11_Label.text = workingCFApixelGrid[1][1];
      this.dialog.CFACell20_Label.text = workingCFApixelGrid[2][0];
      this.dialog.CFACell21_Label.text = workingCFApixelGrid[2][1];
      this.dialog.CFACell30_Label.text = workingCFApixelGrid[3][0];
      this.dialog.CFACell31_Label.text = workingCFApixelGrid[3][1];
   }

   this.CFAy_Sizer = new HorizontalSizer;
   this.CFAy_Sizer.spacing = 8;
   this.CFAy_Sizer.margin = 4;
   this.CFAy_Sizer.add(this.CFAyOffset_Label);
   this.CFAy_Sizer.add(this.CFAyOffset_SpinBox);
   this.CFAy_Sizer.addStretch();

   this.CFAxy_Sizer = new VerticalSizer;
   this.CFAxy_Sizer.spacing = 8;
   this.CFAxy_Sizer.margin = 4;
   this.CFAxy_Sizer.add(this.CFAx_Sizer);
   this.CFAxy_Sizer.add(this.CFAy_Sizer);

   //

   // add a new CheckBox to establish whether the grid requires to be X-flopped (horizontally mirrored)
   this.CFAxFlop_CheckBox = new CheckBox( this );
   this.CFAxFlop_CheckBox.text = "Apply X-flop to CFA Grid";
   this.CFAxFlop_CheckBox.checked = globalData.CFAxFlopped;
   this.CFAxFlop_CheckBox.toolTip = "Tick this box to apply an X-flop to the CFA";

   // create a function to respond whenever the CheckBox is clicked (either 'ON' or 'OFF')
   this.CFAxFlop_CheckBox.onClick = function( checked )
   {
      // because the CheckBox has been clicked, reflect this condition in the 'globalData' construct
      // there is no {if} code needed - the 'function(checked)' and '=checked' handles the extraction
      // of the Boolean state required by the 'globalData' construct. In other words, if the 'state'
      // of the CheckBox IS 'checked', then the result will be 'true', and this will be stored in
      // the globalData construct, otherwise a 'false' value will be stored
      globalData.CFAxFlopped = checked;
      generate_workingCFApixelGrid();

      this.dialog.CFACell00_Label.text = workingCFApixelGrid[0][0];
      this.dialog.CFACell01_Label.text = workingCFApixelGrid[0][1];
      this.dialog.CFACell10_Label.text = workingCFApixelGrid[1][0];
      this.dialog.CFACell11_Label.text = workingCFApixelGrid[1][1];
      this.dialog.CFACell20_Label.text = workingCFApixelGrid[2][0];
      this.dialog.CFACell21_Label.text = workingCFApixelGrid[2][1];
      this.dialog.CFACell30_Label.text = workingCFApixelGrid[3][0];
      this.dialog.CFACell31_Label.text = workingCFApixelGrid[3][1];
   }

   this.CFAxFlop_Sizer = new HorizontalSizer;
   this.CFAxFlop_Sizer.spacing = 8;
   this.CFAxFlop_Sizer.margin = 4;
   this.CFAxFlop_Sizer.add(this.CFAxFlop_CheckBox);

   //

   // add a new CheckBox to establish whether the grid requires to be Y-flipped (vertically mirrored)
   this.CFAyFlip_CheckBox = new CheckBox( this );
   this.CFAyFlip_CheckBox.text = "Apply Y-flip to CFA Grid";
   this.CFAyFlip_CheckBox.checked = globalData.CFAyFlipped;
   this.CFAyFlip_CheckBox.toolTip = "Tick this box to apply a Y-flip to the CFA";

   // create a function to respond whenever the CheckBox is clicked (either 'ON' or 'OFF')
   this.CFAyFlip_CheckBox.onClick = function( checked )
   {
      // because the CheckBox has been clicked, reflect this condition in the 'globalData' construct
      // there is no {if} code needed - the 'function(checked)' and '=checked' handles the extraction
      // of the Boolean state required by the 'globalData' construct. In other words, if the 'state'
      // of the CheckBox IS 'checked', then the result will be 'true', and this will be stored in
      // the globalData construct, otherwise a 'false' value will be stored
      globalData.CFAyFlipped = checked;
      generate_workingCFApixelGrid();

      this.dialog.CFACell00_Label.text = workingCFApixelGrid[0][0];
      this.dialog.CFACell01_Label.text = workingCFApixelGrid[0][1];
      this.dialog.CFACell10_Label.text = workingCFApixelGrid[1][0];
      this.dialog.CFACell11_Label.text = workingCFApixelGrid[1][1];
      this.dialog.CFACell20_Label.text = workingCFApixelGrid[2][0];
      this.dialog.CFACell21_Label.text = workingCFApixelGrid[2][1];
      this.dialog.CFACell30_Label.text = workingCFApixelGrid[3][0];
      this.dialog.CFACell31_Label.text = workingCFApixelGrid[3][1];
   }

   this.CFAyFlip_Sizer = new HorizontalSizer;
   this.CFAyFlip_Sizer.spacing = 8;
   this.CFAyFlip_Sizer.margin = 4;
   this.CFAyFlip_Sizer.add(this.CFAyFlip_CheckBox);

   //

   // add a new sizer to contain two rows, i.e. the X and Y checkBoxes
   this.CFAxyFlip_Sizer = new VerticalSizer;
   this.CFAxyFlip_Sizer.spacing = 8;
   this.CFAxyFlip_Sizer.margin = 4;
   this.CFAxyFlip_Sizer.add(this.CFAxFlop_Sizer);
   this.CFAxyFlip_Sizer.add(this.CFAyFlip_Sizer);

   //

   // set the minimum label width for the table cells (there are no row/column labels for this table)
   var CFAarrayCellWidth = this.font.width ("WW");

   // populate the table with the data from the 'working' CFA array
   this.CFACell00_Label = new Label( this );
   this.CFACell00_Label.text = workingCFApixelGrid[0][0];
   this.CFACell00_Label.minWidth = CFAarrayCellWidth;
   this.CFACell00_Label.textAlignment = TextAlign_Center|TextAlign_VertCenter;

   this.CFACell01_Label = new Label( this );
   this.CFACell01_Label.text = workingCFApixelGrid[0][1];
   this.CFACell01_Label.minWidth = CFAarrayCellWidth;
   this.CFACell01_Label.textAlignment = TextAlign_Center|TextAlign_VertCenter;

   this.CFACell10_Label = new Label( this );
   this.CFACell10_Label.text = workingCFApixelGrid[1][0];
   this.CFACell10_Label.minWidth = CFAarrayCellWidth;
   this.CFACell10_Label.textAlignment = TextAlign_Center|TextAlign_VertCenter;

   this.CFACell11_Label = new Label( this );
   this.CFACell11_Label.text = workingCFApixelGrid[1][1];
   this.CFACell11_Label.minWidth = CFAarrayCellWidth;
   this.CFACell11_Label.textAlignment = TextAlign_Center|TextAlign_VertCenter;

   this.CFACell20_Label = new Label( this );
   this.CFACell20_Label.text = workingCFApixelGrid[2][0];
   this.CFACell20_Label.minWidth = CFAarrayCellWidth;
   this.CFACell20_Label.textAlignment = TextAlign_Center|TextAlign_VertCenter;

   this.CFACell21_Label = new Label( this );
   this.CFACell21_Label.text = workingCFApixelGrid[2][1];
   this.CFACell21_Label.minWidth = CFAarrayCellWidth;
   this.CFACell21_Label.textAlignment = TextAlign_Center|TextAlign_VertCenter;

   this.CFACell30_Label = new Label( this );
   this.CFACell30_Label.text = workingCFApixelGrid[3][0];
   this.CFACell30_Label.minWidth = CFAarrayCellWidth;
   this.CFACell30_Label.textAlignment = TextAlign_Center|TextAlign_VertCenter;

   this.CFACell31_Label = new Label( this );
   this.CFACell31_Label.text = workingCFApixelGrid[3][1];
   this.CFACell31_Label.minWidth = CFAarrayCellWidth;
   this.CFACell31_Label.textAlignment = TextAlign_Center|TextAlign_VertCenter;

   //

   // create four sizers, one for each row of the CFA table
   this.CFARow1_Sizer = new HorizontalSizer;
   this.CFARow1_Sizer.spacing = 4;
   this.CFARow1_Sizer.addStretch();
   this.CFARow1_Sizer.add(this.CFACell00_Label);
   this.CFARow1_Sizer.add(this.CFACell01_Label);
   this.CFARow1_Sizer.addStretch();

   this.CFARow2_Sizer = new HorizontalSizer;
   this.CFARow2_Sizer.spacing = 4;
   this.CFARow2_Sizer.addStretch();
   this.CFARow2_Sizer.add(this.CFACell10_Label);
   this.CFARow2_Sizer.add(this.CFACell11_Label);
   this.CFARow2_Sizer.addStretch();

   this.CFARow3_Sizer = new HorizontalSizer;
   this.CFARow3_Sizer.spacing = 4;
   this.CFARow3_Sizer.addStretch();
   this.CFARow3_Sizer.add(this.CFACell20_Label);
   this.CFARow3_Sizer.add(this.CFACell21_Label);
   this.CFARow3_Sizer.addStretch();

   this.CFARow4_Sizer = new HorizontalSizer;
   this.CFARow4_Sizer.spacing = 4;
   this.CFARow4_Sizer.addStretch();
   this.CFARow4_Sizer.add(this.CFACell30_Label);
   this.CFARow4_Sizer.add(this.CFACell31_Label);
   this.CFARow4_Sizer.addStretch();

   //

   // create a new 'GroupBox' and use it to contain the CFA grid itself
   this.CFAgrid_GroupBox = new GroupBox( this );
   // set the GroupBox title
   this.CFAgrid_GroupBox.title = "CFA Grid";
   this.CFAgrid_GroupBox.sizer = new VerticalSizer;
   this.CFAgrid_GroupBox.sizer.margin = 4;
   this.CFAgrid_GroupBox.sizer.spacing = 4;
   // add the four horizontal sizers
   this.CFAgrid_GroupBox.sizer.add( this.CFARow1_Sizer );
   this.CFAgrid_GroupBox.sizer.add( this.CFARow2_Sizer );
   this.CFAgrid_GroupBox.sizer.add( this.CFARow3_Sizer );
   this.CFAgrid_GroupBox.sizer.add( this.CFARow4_Sizer );

   //

   // an 'Envisage Defaults' button is defined
   this.envisage_Button = new PushButton( this );
   this.envisage_Button.text = " Envisage Defaults ";
   this.envisage_Button.toolTip = "Resets CFA parameters to suit RAW data acquired by Envisage";

   // a function is created to respond to when the 'Envisage' button is pressed
   this.envisage_Button.onClick = function()
   {
      // reset the CFA parameters to their appropriate start-up default values
      globalData.CFAcolOffset = ENVISAGE_DEFAULT_COL_OFFSET;
      globalData.CFArowOffset = ENVISAGE_DEFAULT_ROW_OFFSET;
      globalData.CFAxFlopped = X_FLOP;
      globalData.CFAyFlipped = Y_FLIP;

      if ( DEBUGGING_MODE_ON )
      {
         console.writeln("Envisage Reset");
      }

      generate_workingCFApixelGrid();

      // repaint the dialog box parameters to reflect the changes
      this.dialog.CFAxOffset_SpinBox.value = globalData.CFAcolOffset;
      this.dialog.CFAyOffset_SpinBox.value = globalData.CFArowOffset;

      this.dialog.CFACell00_Label.text = workingCFApixelGrid[0][0];
      this.dialog.CFACell01_Label.text = workingCFApixelGrid[0][1];
      this.dialog.CFACell10_Label.text = workingCFApixelGrid[1][0];
      this.dialog.CFACell11_Label.text = workingCFApixelGrid[1][1];
      this.dialog.CFACell20_Label.text = workingCFApixelGrid[2][0];
      this.dialog.CFACell21_Label.text = workingCFApixelGrid[2][1];
      this.dialog.CFACell30_Label.text = workingCFApixelGrid[3][0];
      this.dialog.CFACell31_Label.text = workingCFApixelGrid[3][1];

      this.dialog.CFAxFlop_CheckBox.checked = globalData.CFAxFlopped;
      this.dialog.CFAyFlip_CheckBox.checked = globalData.CFAyFlipped;
   }

   //

   // a 'Nebulosity Defaults' button is defined
   this.nebulosity_Button = new PushButton( this );
   this.nebulosity_Button.text = " Nebulosity Defaults ";
   this.nebulosity_Button.toolTip = "Resets CFA parameters to suit RAW data acquired by Nebulosity";

   // a function is created to respond to when the 'Envisage' button is pressed
   this.nebulosity_Button.onClick = function()
   {
      // reset the CFA parameters to their appropriate start-up default values
      globalData.CFAcolOffset = NEBULOSITY_DEFAULT_COL_OFFSET;
      globalData.CFArowOffset = NEBULOSITY_DEFAULT_ROW_OFFSET;
      globalData.CFAxFlopped = X_FLOP;
      globalData.CFAyFlipped = Y_FLIP;

      if ( DEBUGGING_MODE_ON )
      {
         console.writeln("Nebulosity Reset");
      }

      generate_workingCFApixelGrid();

      // repaint the dialog box parameters to reflect the changes
      this.dialog.CFAxOffset_SpinBox.value = globalData.CFAcolOffset;
      this.dialog.CFAyOffset_SpinBox.value = globalData.CFArowOffset;

      this.dialog.CFACell00_Label.text = workingCFApixelGrid[0][0];
      this.dialog.CFACell01_Label.text = workingCFApixelGrid[0][1];
      this.dialog.CFACell10_Label.text = workingCFApixelGrid[1][0];
      this.dialog.CFACell11_Label.text = workingCFApixelGrid[1][1];
      this.dialog.CFACell20_Label.text = workingCFApixelGrid[2][0];
      this.dialog.CFACell21_Label.text = workingCFApixelGrid[2][1];
      this.dialog.CFACell30_Label.text = workingCFApixelGrid[3][0];
      this.dialog.CFACell31_Label.text = workingCFApixelGrid[3][1];

      this.dialog.CFAxFlop_CheckBox.checked = globalData.CFAxFlopped;
      this.dialog.CFAyFlip_CheckBox.checked = globalData.CFAyFlipped;
   }

   //

   // create a new horizontal sizer, to contain the first row of three elements
   this.CFArowGroup1_Sizer = new HorizontalSizer;
   this.CFArowGroup1_Sizer.spacing = 4;
   this.CFArowGroup1_Sizer.margin = 4;
   this.CFArowGroup1_Sizer.addStretch();
   this.CFArowGroup1_Sizer.add( this.CFAxy_Sizer );
   this.CFArowGroup1_Sizer.add( this.CFAgrid_GroupBox );
   this.CFArowGroup1_Sizer.add( this.CFAxyFlip_Sizer );
   this.CFArowGroup1_Sizer.addStretch();

   // create a second new horizontal sizer to contain the two 'reset' buttons
   this.CFArowGroup2_Sizer = new HorizontalSizer;
   this.CFArowGroup2_Sizer.spacing = 4;
   this.CFArowGroup2_Sizer.margin = 4;
   this.CFArowGroup2_Sizer.add( this.envisage_Button );
   this.CFArowGroup2_Sizer.add( this.nebulosity_Button );
   this.CFArowGroup2_Sizer.addStretch();

   // create a new 'GroupBox' and use it to contain the CFA setup information
   this.CFA_GroupBox = new GroupBox( this );
   // set the GroupBox title
   this.CFA_GroupBox.title = "CFA Parameters";
   // because there are only two items that need to be within this GroupBox,
   // (i.e. two previously formatted 'horizontal sizers'), only a single 'VerticalSizer' layout is needed
   this.CFA_GroupBox.sizer = new VerticalSizer;
   this.CFA_GroupBox.sizer.margin = 4;
   this.CFA_GroupBox.sizer.spacing = 4;
   this.CFA_GroupBox.sizer.add( this.CFArowGroup1_Sizer );
   this.CFA_GroupBox.sizer.add( this.CFArowGroup2_Sizer );

   //

   // add a new applyClippingHisto checkBox
   this.applyClippingHisto_CheckBox = new CheckBox( this );
   this.applyClippingHisto_CheckBox.text = "Apply RGB Clipping Histogram";
   this.applyClippingHisto_CheckBox.checked = globalData.applyClippingHisto;
   this.applyClippingHisto_CheckBox.toolTip =
   "Tick this box to stretch the R, G and B histograms so each fits the (0.0 - 1.0) range";

   // create a function to respond whenever the CheckBox is clicked (either 'ON' or 'OFF')
   this.applyClippingHisto_CheckBox.onClick = function( checked )
   {
      // because the CheckBox has been clicked, reflect this condition in the 'globalData' construct
      // there is no {if} code needed - the 'function(checked)' and '=checked' handles the extraction
      // of the Boolean state required by the 'globalData' construct. In other words, if the 'state'
      // of the CheckBox IS 'checked', then the result will be 'true', and this will be stored in
      // the globalData construct, otherwise a 'false' value will be stored
      globalData.applyClippingHisto = checked;
   }

   //

   // add a new histo_Sizer (horizontal)
   this.histo_Sizer = new HorizontalSizer;
   this.histo_Sizer.spacing = 8;
   this.histo_Sizer.margin = 4;
   this.histo_Sizer.add(this.applyClippingHisto_CheckBox);
   this.histo_Sizer.addStretch();

   //

   // add a new RGBmedianAlign checkBox
   this.RGBmedianAlign_CheckBox = new CheckBox( this );
   this.RGBmedianAlign_CheckBox.text = "Apply RGB Median Alignment";
   this.RGBmedianAlign_CheckBox.checked = globalData.applyRGBmedianAlign;
   this.RGBmedianAlign_CheckBox.toolTip =
   "Tick this box to align the median values of the R, G and B histograms within each image";

   // create a function to respond whenever the CheckBox is clicked (either 'ON' or 'OFF')
   this.RGBmedianAlign_CheckBox.onClick = function( checked )
   {
      // because the CheckBox has been clicked, reflect this condition in the 'globalData' construct
      // there is no {if} code needed - the 'function(checked)' and '=checked' handles the extraction
      // of the Boolean state required by the 'globalData' construct. In other words, if the 'state'
      // of the CheckBox IS 'checked', then the result will be 'true', and this will be stored in
      // the globalData construct, otherwise a 'false' value will be stored
      globalData.applyRGBmedianAlign = checked;
   }

   //

   // add a new alignAllMedians checkBox
   this.alignAllMedians_CheckBox = new CheckBox( this );
   this.alignAllMedians_CheckBox.text = "Align RGB Medians for ALL images";
   this.alignAllMedians_CheckBox.checked = globalData.alignAllMedians;
   this.alignAllMedians_CheckBox.enabled = true;
   this.alignAllMedians_CheckBox.toolTip =
   "Tick this box to align the median values of the R, G and B histograms on ALL images<br>"+
   "Note that selecting this option WILL result in some image data being truncated, leading to minor pixel loss";

   // create a function to respond whenever the CheckBox is clicked (either 'ON' or 'OFF')
   this.alignAllMedians_CheckBox.onClick = function( checked )
   {
      // because the CheckBox has been clicked, reflect this condition in the 'globalData' construct
      // there is no {if} code needed - the 'function(checked)' and '=checked' handles the extraction
      // of the Boolean state required by the 'globalData' construct. In other words, if the 'state'
      // of the CheckBox IS 'checked', then the result will be 'true', and this will be stored in
      // the globalData construct, otherwise a 'false' value will be stored
      globalData.alignAllMedians = checked;
   }

   //

   // add a new median_Sizer (horizontal)
   this.median_Sizer = new HorizontalSizer;
   this.median_Sizer.spacing = 8;
   this.median_Sizer.margin = 4;
   this.median_Sizer.add(this.RGBmedianAlign_CheckBox);
   this.median_Sizer.add(this.alignAllMedians_CheckBox);

   //

   // add a new colourSaturation checkBox
   this.applyColourSaturation_CheckBox = new CheckBox( this );
   this.applyColourSaturation_CheckBox.text = "Apply Colour Saturation Enhancement";
   this.applyColourSaturation_CheckBox.checked = globalData.applyColourSaturation;
   this.applyColourSaturation_CheckBox.toolTip =
   "Tick this box to apply a Colour Saturation Enhancement to the deBayered image";

   // create a function to respond whenever the CheckBox is clicked (either 'ON' or 'OFF')
   this.applyColourSaturation_CheckBox.onClick = function( checked )
   {
      // because the CheckBox has been clicked, reflect this condition in the 'globalData' construct
      // there is no {if} code needed - the 'function(checked)' and '=checked' handles the extraction
      // of the Boolean state required by the 'globalData' construct. In other words, if the 'state'
      // of the CheckBox IS 'checked', then the result will be 'true', and this will be stored in
      // the globalData construct, otherwise a 'false' value will be stored
      globalData.applyColourSaturation = checked;

      // if the 'apply' checkBox is not ticked, then 'disable' the 'amount' spinBox
      if ( !globalData.applyColourSaturation )
      {
         this.dialog.colourSaturationAmount_Label.enabled = false;
         this.dialog.colourSaturationAmount_SpinBox.enabled = false;
      }
      // otherwise (because the checkBox IS ticked), 'enable' the spinBox
      else
      {
         this.dialog.colourSaturationAmount_Label.enabled = true;
         this.dialog.colourSaturationAmount_SpinBox.enabled = true;
      }
   }

   //

   // add a new colourSaturationAmount Label
   this.colourSaturationAmount_Label = new Label( this );
   this.colourSaturationAmount_Label.text = "Amount of Colour Saturation (%) : ";
   // this.colourSaturationAmount_Label.minWidth = labelWidth1;
   this.colourSaturationAmount_Label.textAlignment = TextAlign_Left|TextAlign_VertCenter;
   this.colourSaturationAmount_Label.toolTip = "Enter the percentage amount of colour saturation enhancement required";

   //

   // add a new colourSaturationAmount SpinBox
   this.colourSaturationAmount_SpinBox = new SpinBox( this );
   this.colourSaturationAmount_SpinBox.minValue = 50;
   this.colourSaturationAmount_SpinBox.maxValue = 100;
   this.colourSaturationAmount_SpinBox.stepSize = 1;
   this.colourSaturationAmount_SpinBox.value = globalData.colourSaturationAmount;
   this.colourSaturationAmount_SpinBox.minWidth = this.font.width ("88888");
   this.colourSaturationAmount_SpinBox.wrapping = false;
   this.colourSaturationAmount_SpinBox.toolTip = "Enter the amount of colour saturation enhancement required (50% to 100%)";

   // create a function to respond whenever the SpinBox is changed
   this.colourSaturationAmount_SpinBox.onValueUpdated = function( index )
   {
      globalData.colourSaturationAmount = index;
   }

   //

   // add a new colourSaturation_Sizer (horizontal)
   this.colourSaturation_Sizer = new HorizontalSizer;
   this.colourSaturation_Sizer.spacing = 8;
   this.colourSaturation_Sizer.margin = 4;
   this.colourSaturation_Sizer.add(this.applyColourSaturation_CheckBox);
   this.colourSaturation_Sizer.add(this.colourSaturationAmount_Label);
   this.colourSaturation_Sizer.add(this.colourSaturationAmount_SpinBox);
   this.colourSaturation_Sizer.addStretch();

   //

   // add a new colourCorrection checkBox
   this.colourCorrection_CheckBox = new CheckBox( this );
   this.colourCorrection_CheckBox.text = "Apply Colour Correction Curve";
   this.colourCorrection_CheckBox.checked = globalData.applyColourCorrectionCurve;
   this.colourCorrection_CheckBox.toolTip =
   "Tick this box to apply an empirically defined Colour Correction Curve to all images";

   // create a function to respond whenever the CheckBox is clicked (either 'ON' or 'OFF')
   this.colourCorrection_CheckBox.onClick = function( checked )
   {
      // because the CheckBox has been clicked, reflect this condition in the 'globalData' construct
      // there is no {if} code needed - the 'function(checked)' and '=checked' handles the extraction
      // of the Boolean state required by the 'globalData' construct. In other words, if the 'state'
      // of the CheckBox IS 'checked', then the result will be 'true', and this will be stored in
      // the globalData construct, otherwise a 'false' value will be stored
      globalData.applyColourCorrectionCurve = checked;
   }

   //

   // add a new colourCorrection_Sizer (horizontal)
   this.colourCorrection_Sizer = new HorizontalSizer;
   this.colourCorrection_Sizer.spacing = 8;
   this.colourCorrection_Sizer.margin = 4;
   this.colourCorrection_Sizer.add(this.colourCorrection_CheckBox);
   this.colourCorrection_Sizer.addStretch();

   //

   // add a new postProcessing_GroupBox and use it to contain the Post-deBayering setup
   this.postProcessing_GroupBox = new GroupBox( this );
   // set the GroupBox title
   this.postProcessing_GroupBox.title = "Post Processing Actions";
   // only a single 'VerticalSizer' layout is needed as we will only be adding a single 'column'
   this.postProcessing_GroupBox.sizer = new VerticalSizer;
   this.postProcessing_GroupBox.sizer.margin = 2;
   this.postProcessing_GroupBox.sizer.spacing = 0;
   this.postProcessing_GroupBox.sizer.add( this.histo_Sizer );
   this.postProcessing_GroupBox.sizer.add( this.median_Sizer );
   this.postProcessing_GroupBox.sizer.add( this.colourSaturation_Sizer );
   this.postProcessing_GroupBox.sizer.add( this.colourCorrection_Sizer );

   //


   // a (standard) 'OK' button is defined
   this.ok_Button = new PushButton( this );
   this.ok_Button.text = " OK ";
   // a function is created to respond to when the 'OK' button is pressed
   this.ok_Button.onClick = function()
   {
      // closes the dialog window, and returns 'ok'
      this.dialog.ok();
   }

   //

   // a (standard) 'Cancel' button is defined
   this.cancel_Button = new PushButton( this );
   this.cancel_Button.text = " Cancel ";
   // a function is created to respond to when the 'Cancel' button is pressed
   this.cancel_Button.onClick = function()
   {
      // closes the dialog window, and returns 'cancel'
      // in order to also be able to 'trap' the case where the second 'setup' dialog is closed by using
      // any option OTHER than the 'Cancel' button, the actual 'reset' code is implemented in the 'main' dialog
      this.dialog.cancel();
   }

   //

   // a final HorizontalSizer is created to create the appropriate layout for the 'OK' and 'Cancel' buttons
   this.buttons_Sizer = new HorizontalSizer;
   // a spacing of six or eight pixels is customary between standard dialog buttons
   this.buttons_Sizer.spacing = 8;
   // in order to right-justify the 'OK' and 'Cancel' buttons, a dynamic space is added
   this.buttons_Sizer.addStretch();
   // now that the 'dynamic space' has been added, the two buttons can be added,
   // without the need for any further spacing commands
   this.buttons_Sizer.add( this.ok_Button );
   this.buttons_Sizer.add( this.cancel_Button );

   //

   // now that all the various 'horizontal' elements of the dialog box have been defined,
   // the individual 'rows' can now be added to a VerticalSizer construct
   this.sizer = new VerticalSizer;
   // a margin of eight pixels is advisable for large dialogs, as is the case here
   this.sizer.margin = 8;
   // a spacing of six pixels is advisable for large dialogs, as is the case here
   this.sizer.spacing = 6;
   // add the three groupBoxes
   this.sizer.add( this.deBayer_GroupBox, 100 );
   this.sizer.add( this.CFA_GroupBox, 100 );
   this.sizer.add( this.postProcessing_GroupBox, 100 );
   // finally, add the last row of the dialog box, which contains the 'OK' and 'Cancel' buttons)
   this.sizer.add( this.buttons_Sizer );

   //

   // give the dialog box a title
   this.windowTitle = "Batch CMYG DeBayer Options";
   // prevent the dialog window from being user re-sizable
   this.userResizable = false;

   // allow the dialog window to resize to the contents of the dialog definition, assuming no other influences
   this.adjustToContents();
   // Control.adjustToContents() changes the size of a control to fit all of its child controls exactly
   // if the control has a minimum size - see the Control.setMinSize(), Control.minWidth and Control.minHeight
   // properties - then it is resized to those minimum dimensions, or to the smallest rectangle that could
   // contain all of the child controls; whichever of these two cases defines the larger rectangle
   // ##Note## : <adjustToContents()> implicitly calls adjustToContents() recursively for all child controls,
   // and their descendants, trying to resize the whole hierarchical tree of Control objects to their
   // minimum possible sizes. This method acts like an exhaustive "packer" for a Control and its children

} // end of deBayerDialog()

function main()
// only ever called once, at the initialisation phase
// when script execution leaves this subroutine, the script execution will terminate
{
   console.show();

   // ##Query## : HOW DO YOU EXIT AN 'ENDLESS' LOOP WHEN A SCRIPT IS RUNNING?
   // ##Answer## : Currently there is no way to stop an 'out-of-control' script, except by killing
   // the PI application, obviously. This will be fixed in a future version, probably when (hopefully)
   // the TraceMonkey JS engine is embedded into PI, along with a JS debugger

   console.abortEnabled = true;
   // this still does NOT allow you to exit a 'for-ever' loop
   // as would be the case if the 'break' instruction was not present (see below)

   // this is the ONLY call to the dialog routine
   var fileSelectDialog = new mainDialog ();

   if ( DEBUGGING_MODE_ON )
   {
      console.writeln ("Dialog opened, " + deBayerOptions.length + " conversion methods available");
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
         continue;
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
   console.writeln (TITLE + " - script completed");
}
