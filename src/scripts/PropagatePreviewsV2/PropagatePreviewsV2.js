"use strict";
/*
   PropagatePreviews.js

   Create previews on specified images based on the (relative) location
   of the previews of a selected image (by default the current one).
   The previews can be added or replace the existing previews.

   In this script the previews are used as simpel ROI (region of interest),
   there is no attempt to copy the history or current information beyond the
   geometry and viewing options.

   Version 2.0, by Jean-Marc Lugrin (PixInsight user), based on:
   Version 1.x, Written by Enzo De Bernardini (PixInsight user)
   Some parts of the code were based on PreviewAggregator.js v0.2.2, by David Serrano (2009)

*/

/*
   Changelog:
   1.0.0: First release in PixInsight Forum
   1.1.0: GUI, previews selection list, target selection list, preserve previews option
   2.0.0: Reworked to support process instance, scaling, previews from active image and more.
   2.1.0: Added command to delete all previews in all target windows
*/

/*
TODO
- save/restore as ROI FITS keywords
- accumulate previews
- renaming of previews in the interface
- generation of image to store previews (possibly as mask)
- Allow deselection when list from icon
- deselect all, deselect source, ...
- proportional rescaling
- absolute with offset
- truncate instead of reject if preview out of bound
- immediate feed back on compliant targets
- integrate doc
- Some code cleaning
*/

#feature-id    Utilities > PropagatePreviewsV2

#feature-info  "<p>Script to copy the geometry of selected previews from a source image to selected open images.</p>"

#define TITLE  "PropagatePreviewsV2"
#define VERSION "2.1.0"

#include <pjsr/Sizer.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/TextAlign.jsh>
#include <pjsr/StdButton.jsh>
#include <pjsr/StdIcon.jsh>


#define DEBUG_MODE false

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

#define DEFAULT_PRESERVE_PREVIEWS false

// How to map the geometry of the previews
// EXACT:        The target view must have the same size as the source view, the previews
//               will be mapped exactly at the same location.
// ABSOLUTE:     The target view can have any size, the previews will be mapped at the
//               absolute location they have in the source view, clipped to the target.
// SCALED:       The target view can be a scaled size of the source view,
//               must be the same integer factor in the X an Y directions.
//               The previews will be mapped and scaled by the same factor.
// PROPORTIONAL: The target view can be any size. The previews will be mapped and scaled
//               by the same factors independently in the X and Y directions.
#define PP_MATCH_MODE_EXACT 1
#define PP_MATCH_MODE_ABSOLUTE 2
#define PP_MATCH_MODE_SCALED 3
#define PP_MATCH_MODE_PROPORTIONAL 4


// ----------------------------------------------------------------------------
// Parameter objects
// ----------------------------------------------------------------------------

// The parameters are used to keep the information of the process instance (icon) and
// to communicate between the GUI and the engine.
// The engine is totally independent of the gui (MVC pattern).
// Only Javascript builtin standard types are used so that the parameters can be
// JSONified easily to be saved in the process instance (icon) or settings.


// --- PP_previewDefinition. A single preview (ROI)
// The geometry and some supporting values of a single preview
// The viewport information can be used to make the view visible at the same location
// and zoom factor than the original one, making visual comparison easier.
function PP_previewDefinition(name, geometryRect, viewportPositionPoint, viewportZoomFactor) {
   this.name = name;
   this.geometry = [geometryRect.x0,geometryRect.y0,geometryRect.x1,geometryRect.y1] ;
   this.position = [viewportPositionPoint.x, viewportPositionPoint.y];
   this.zoomFactor = viewportZoomFactor;
}
PP_previewDefinition.prototype = new Object;

// --- PP_geometryParameters: A set of previews and of options to apply the previews
function PP_geometryParameters() {
   this.sourceWindowSize         = null;
   this.sizeMatchMode            = PP_MATCH_MODE_SCALED;
   this.previewDefinitions       = new Array; // of PP_previewDefinition
   this.preservePreviews         = DEFAULT_PRESERVE_PREVIEWS;
   this.propagateZoomAndPosition = true;
}
PP_geometryParameters.prototype = new Object;

// Serialisation in parameters
PP_geometryParameters.prototype.exportParameters = function() {
   Parameters.set("ppParam", JSON.stringify(this));
}

function importParameters () {
   if (Parameters.has("ppParam")) {
      var parsedJSON = JSON.parse(Parameters.get("ppParam"));
      var gp = Object.create(PP_geometryParameters.prototype);
      for (var prop in parsedJSON) {
        gp[prop] = parsedJSON[prop];
      }
      return gp;

   } else {
      // TODO Use settings to retrieve options
      return new PP_geometryParameters();
   }
}


// ----------------------------------------------------------------------------
// -- ENGINE (execute operations)
// ----------------------------------------------------------------------------
function PP_engine() {


   // Id of the images on which to create previews
   this.targetWindowsIds = new Array; // of ID of the main view of windows

   // Calculate the scaling factor between the original window used to define the
   // previews and the targetWindow, check if the previews are compatible with
   // the target window after scaling.
   // Return the scaling factors in the form of an array of two numbers or
   // an error message as a string.
   // The absolute value of the scaling factors are always larger than 1 and the sign
   // indicates if it is a multiplication or a division (this ensures that integer factors
   // are kept exact and shown as integer number to the user).
   this.calculateScalingFactor = function (targetWindow, gp) {
      var sourceWindowWidth = gp.sourceWindowSize[0];
      var sourceWindowHeight = gp.sourceWindowSize[1];

      var targetWindowWidth = targetWindow.mainView.image.width;
      var targetWindowHeight = targetWindow.mainView.image.height;

      var targetWindowId = targetWindow.mainView.id;

      var msg;

      if (DEBUG_MODE) Console.writeln ("DEBUG calculateScalingFactor for '",targetWindowId,"' source ",sourceWindowWidth, "x", sourceWindowHeight, ", target ",targetWindowWidth, "x", targetWindowHeight);

      var widthRatio = 1;
      if (sourceWindowWidth > targetWindowWidth) {
         widthRatio = -sourceWindowWidth / targetWindowWidth;
      } else if (sourceWindowWidth < targetWindowWidth) {
         widthRatio =  targetWindowWidth / sourceWindowWidth;
      }
      var heightRatio = 1;
      if (sourceWindowHeight > targetWindowHeight) {
         heightRatio = -sourceWindowHeight / targetWindowHeight;
      } else if (sourceWindowHeight <targetWindowHeight) {
         heightRatio =  targetWindowHeight / sourceWindowHeight;
      }
      if (DEBUG_MODE) Console.writeln("DEBUG ratios: ", widthRatio, "x ",heightRatio);

      // Unless we work in 'proportional' mode we need a rounded factor
      if (gp.sizeMatchMode !=  PP_MATCH_MODE_PROPORTIONAL) {

         if ((widthRatio % 1 !== 0) || (heightRatio % 1 !== 0)) {
            // Check if near integer (for example binning of odd number of pixels resolved by truncation)
            var widthRatioInt = Math.floor(Math.abs(widthRatio));
            var heightRatioInt = Math.floor(Math.abs(heightRatio));
            if (DEBUG_MODE) Console.writeln("DEBUG widthRatioInt ", widthRatioInt, ", heightRatioInt " , heightRatioInt);

            var restoredWidth;
            if (sourceWindowWidth > targetWindowWidth) {
               restoredWidth = widthRatioInt * targetWindowWidth;
               if (Math.abs(restoredWidth - sourceWindowWidth) < widthRatioInt) {
                  widthRatio = -widthRatioInt;
               }
            } else if (sourceWindowWidth < targetWindowWidth) {
               restoredWidth =  widthRatioInt * sourceWindowWidth;
               if (Math.abs(restoredWidth - targetWindowWidth) < widthRatioInt) {
                  widthRatio = widthRatioInt;
               }
            }
            var restoredHeight;
            if (sourceWindowHeight > targetWindowHeight) {
               restoredHeight = heightRatioInt * targetWindowHeight;
               if (Math.abs(restoredHeight - sourceWindowHeight) < heightRatioInt) {
                  heightRatio = -heightRatioInt;
               }
            } else if (sourceWindowHeight < targetWindowHeight) {
               restoredHeight =  heightRatioInt * sourceWindowHeight;
               if (Math.abs(restoredHeight - targetWindowHeight) < heightRatioInt) {
                  heightRatio = heightRatioInt;
               }
            }
            if (DEBUG_MODE) Console.writeln("DEBUG restoredWidth ", restoredWidth, ", restoredHeight " , restoredHeight);
         }

         // Check again after rounding above
         if ((widthRatio % 1 !== 0) || (heightRatio % 1 !== 0)) {
            msg = "<br><b>Image " + targetWindowId + "</b> size " + targetWindowWidth + "x" + targetWindowHeight +
            " has non integral size ratio " + Math.abs(widthRatio)+" x "+Math.abs(heightRatio) +
            " with source image " + sourceWindowWidth + "x" + sourceWindowHeight +
            ", previews not propagated to this window.";
            Console.writeln(msg);
            return msg;
         }
     }


      switch (gp.sizeMatchMode) {
         case PP_MATCH_MODE_EXACT:
            if ((widthRatio !== 1) || (heightRatio !== 1)) {
              msg = "<br><b>Image " + targetWindowId +
              "</b> has size " + targetWindowWidth + "x" + targetWindowHeight +
              ", different from target size " + sourceWindowWidth + "x" + sourceWindowHeight +
              " and the scaling mode is EXACT, no preview propagated to this window.";
              Console.writeln(msg);
              return msg;
            }
            if (DEBUG_MODE) Console.writeln("DEBUG returns " + [1,1]);
            return [1, 1];

         case PP_MATCH_MODE_ABSOLUTE:
            // Check that all previews fit (not scaled)
            for (var i=0; i<gp.previewDefinitions.length; i++) {
               var pvd = gp.previewDefinitions[i];
               var g = pvd.geometry;
               if (g[2]>targetWindowWidth || g[3]>targetWindowHeight) {
                 msg = "<br><b>Image " + targetWindowId +
                 "</b> of size " +  + targetWindowWidth + "x" + targetWindowHeight +
                 " is too small for preview '" + pvd.name +
                 "' and scaling mode is ABSOLUTE, no preview propagated to this window.";
                Console.writeln(msg);
                return msg;
               }
            }
            if (DEBUG_MODE) Console.writeln("DEBUG returns " + [1,1]);
            return [1, 1];

         case PP_MATCH_MODE_SCALED:
            // check that the width/height is compatible, if yes return ratio
            if (widthRatio  !== heightRatio) {
               msg = "<br><b>Image " + targetWindowId +
                 "</b> size " + targetWindowWidth + "x" + targetWindowHeight +
                 " has different width/height scaling ratios " + Math.abs(widthRatio)+"x"+Math.abs(heightRatio) +
                 " to scale from source image size " + sourceWindowWidth + "x" + sourceWindowHeight +
                 " and scaling mode is SCALED, no preview propagated to this window." ;
                Console.writeln(msg);
                return msg;
            }
            if (DEBUG_MODE) Console.writeln("DEBUG returns " + [widthRatio,heightRatio]);
            return [widthRatio, heightRatio];

         case PP_MATCH_MODE_PROPORTIONAL:
            if (DEBUG_MODE) Console.writeln("DEBUG returns " + [widthRatio,heightRatio]);
            return [widthRatio, heightRatio];
      }

      throw "InternalError - Unexpected sizeMatchMode " + gp.sizeMatchMode;

   }

   // Create the previews specified in gp: PP_geometryParemters to the target window, applying the specified ratios.
   this.createPreviews = function(targetWindow, gp, ratios) {
      var scalePosition = function(ratio, pos) {
         if (ratio>0) {
           return Math.round(pos * ratio);
         } else if (ratio<0) {
           return Math.round(pos / -ratio);
         } else {
            return pos;
         }
      }
      var scalePoint = function(point) {
         var scaledPoint = [
            scalePosition(ratios[0], point[0]),
            scalePosition(ratios[1], point[1])
         ];
         return scaledPoint;
      }
      var scaleRectangle = function(rectangle) {
         var scaledRectangle = [
            scalePosition(ratios[0], rectangle[0]),
            scalePosition(ratios[1], rectangle[1]),
            scalePosition(ratios[0], rectangle[2]),
            scalePosition(ratios[1], rectangle[3])
         ];
         return scaledRectangle;
      }
      var targetImage = targetWindow.mainView.image;
      var savedCurrentView = targetWindow.currentView;
      for (var i=0; i<gp.previewDefinitions.length; i++) {
         var pvd = gp.previewDefinitions[i];
         var g = scaleRectangle(pvd.geometry);
         // Make sure the preview fits in the image and is visible if we bother creating it
         if (g[0] >= targetImage.width) {
            g[0] = targetImage.width-10;
         }
         if (g[1] >= targetImage.height) {
            g[1] = targetImage.height-10;
         }
         if (g[2] >= targetImage.width) {
            g[2] = targetImage.width-1;
         }
         if (g[3] >= targetImage.height) {
            g[3] = targetImage.height-1;
         }
         var createdPreview = targetWindow.createPreview( g[0], g[1], g[2], g[3], pvd.name );
         // Name will have changed if the preview already existed
         var previewName = createdPreview.id;

         // The zoom factor of the preview is only used when the preview is selected by the user and 
         // in the image window. Its value does not depend on the scaling or relocation of the previe
         // in the target main window.
         // The viewPortPosition is also used to position the preview when it is selected by the user
         // in the image window, is relative to the size of the created preview and must be scaled 
         // by the same factor as the preview.        
         var zoomedText = "";
         if (gp.propagateZoomAndPosition) {
             targetWindow.currentView = createdPreview;
             targetWindow.zoomFactor = pvd.zoomFactor;

             var vpp = scalePoint(pvd.position);
             targetWindow.viewportPosition = new Point(vpp[0],vpp[1]);
             if (DEBUG_MODE) Console.writeln("DEBUG zoomFactor " + targetWindow.zoomFactor + ", viewportPosition " + targetWindow.viewportPosition + " from pvd.position " + pvd.position);

             if (pvd.zoomFactor < 0) {
                 zoomedText = "preview zoomed 1:" + -pvd.zoomFactor;
             } else if (pvd.zoomFactor > 1) {
                 zoomedText = "preview zoomed " + pvd.zoomFactor + ":1";
             }

         }
         targetWindow.currentView = savedCurrentView;

         // Build nice message to inform the users
         var scaleText = "";
         if (ratios[0] !== 1 && ratios[1] !==1) {
            if (ratios[0] === ratios[1]) {
               var ratio = ratios[0];
               scaleText = (  ratio < 0 ? ("(/" + -ratio + ") ") : ("(*" + ratio + ") "));
            } else {
               scaleText = (ratios[0] < 0 ? ("(/" + -ratios[0] + ") ") : ("(*" + ratios[0])) + " /" +
                           (ratios[1] < 0 ? (" /" + -ratios[1] + ") ") : (" *" + ratios[1] + ") "));
            }
         }

         Console.writeln( " added preview " + previewName + " @ ["  + g + "] "  + scaleText + zoomedText);
      }
   }

   // Create the previews on each target window after calculation of the scaling factor
   // Parameter: gp: PP_geometryParameters (information on all previews to create)
   // returns: true if ok, false if any preview could not be created or no target was present
   this.propagatePreviews = function(gp) {
      var anyChange = false;
      var anyError = false;
      for ( var i = 0; i < this.targetWindowsIds.length; i++ ) {
         var window = ImageWindow.windowById(this.targetWindowsIds[i]);

         // Size ratio between windows (0 means incompatible)
         var ratiosOrError = this.calculateScalingFactor(window, gp);

         if( "string" !== typeof ratiosOrError) {
            // if preservePreview is true, destination images preserve existings previews
            // if preservePreview is false, previews on destination images are deleted before new previews creation
            var logMsg = "";
            if( !gp.preservePreview && window.previews.length >0) {
               logMsg = " (" + window.previews.length + " preview(s) deleted)";
               window.deletePreviews();
            };
            console.writeln( "<br><b>Image " + window.mainView.id + "</b>"  + logMsg);

            // Create all the previews
            this.createPreviews(window, gp, ratiosOrError);

            anyChange = true;
         } else {
            anyError = true;
         }
      };

      return anyChange && !anyError;

   };

   // Delete all previews of the target images (only used for that specific command)
   this.deleteAllPreviews = function() {
      var anyChange = false;
      for ( var i = 0; i < this.targetWindowsIds.length; i++ ) {
        var window = ImageWindow.windowById(this.targetWindowsIds[i]);
        var logMsg = "";
        if( window.previews.length >0) {
           logMsg = " -" + window.previews.length + " preview(s) deleted";
           window.deletePreviews();
           anyChange = true;
        } else {
          logMsg = " - no preview to delete";
        }
        console.writeln( "<br><b>Image " + window.mainView.id + "</b>"  + logMsg);
      }
      // Consider no change as suspect
      if (!anyChange) {
        console.writeln("<br>There was no preview to delete in any target image!");
      }
      return anyChange;
   }

};






// ----------------------------------------------------------------------------
// User Interface
// ----------------------------------------------------------------------------


// Create the dialog for PropagatePreviews.
// geometryParameters is defined (not null) only if executing a process icon,
// in that case the user cannot select the source image.
function PP_dialog(geometryParameters) {

   this.__base__ = Dialog;
   this.__base__();


   this.helpLabel = new Label (this);
   this.helpLabel.frameStyle = FrameStyle_Box;
   this.helpLabel.margin = 4;
   this.helpLabel.wordWrapping = true;
   this.helpLabel.useRichText = true;
   this.helpLabel.text = "<b>" + TITLE + " v" + VERSION +
   "</b> &mdash; Script to copy the geometry of selected previews from a source image or process instance to selected open images.";

   this.target_GroupBox = new GroupBox (this);
   if (geometryParameters) {
      this.target_GroupBox.title = "Previews to copy (from process instance):";
   } else {
      this.target_GroupBox.title = "Image and previews to copy from:";
   }

   this.target_GroupBox.sizer = new VerticalSizer;
   this.target_GroupBox.sizer.margin = 4;
   this.target_GroupBox.sizer.spacing = 4;


   // -- Select the source view
   if (geometryParameters) {

      // Nothing, do not allow to select source image, only selecting target images and relevant previews is allowed.
 
   } else {
      // List to select the view we want to extract previews from
      this.viewList = new ViewList(this);
      this.viewListNullCurrentView = this.viewList.currentView;
      this.viewList.getMainViews();
      this.viewList.onViewSelected = function(view) {
         // Recreate the list of previews from the selected view
        this.dialog.refreshViewList(view.window);
        // Update flags of target views
        this.dialog.refreshViewNodeFlags(view.window, false);
      }
      this.viewList.toolTip = "Select the image from which you want to copy the previews.";
      this.target_GroupBox.sizer.add(this.viewList);

   }


   // -- List to select the previews to copy from the source view
   this.previews_List = new TreeBox (this);
   this.previews_List.alternateRowColor = true;
   this.previews_List.setMinSize (450, 150);
   this.previews_List.font = new Font ("monospace", 10); // best to show tabulated data
   this.previews_List.numberOfColumns = 3;
   this.previews_List.headerVisible = true;
   this.previews_List.headerSorting = true;
   this.previews_List.setHeaderText (0, "Previews");
   this.previews_List.setHeaderText (1, "Dimensions");
   this.previews_List.setHeaderText (2, "Coordinates");
   this.previews_List.setHeaderAlignment (0, Align_Left);
   this.previews_List.setHeaderAlignment (1, Align_Left);
   this.previews_List.setHeaderAlignment (2, Align_Left);
   if (geometryParameters) {
      this.previews_List.toolTip ="The list of previews was loaded from a process instance, it is fixed.";
   } else {
      this.previews_List.toolTip ="Select the previews you want to copy.";
   }


   // View list creation/refresh helper

   this.refreshViewList = function(aSourceWindow) {

      // Clear previous list
      this.previews_List.clear();

      // Active image previews list
      this.sourceWindow = aSourceWindow;

      var sourceWindowId = this.sourceWindow.mainView.id;
      var previews  = this.sourceWindow.previews;

      for ( var i = 0; i < previews.length; ++i ) {
         this.addViewNodePreviews( this.previews_List, previews[i], this.sourceWindow.previewRect( previews[i] ) );
      }

      this.previews_List.sort();

      // Ensure that all columns are initially visible
      this.previews_List.adjustColumnWidthToContents (0);
      this.previews_List.adjustColumnWidthToContents (1);
      this.previews_List.adjustColumnWidthToContents (2);

   }

   // Preview list: Node creation helper
   this.addViewNodePreviews = function( parent, preview, rect ) {

      var node  = new TreeBoxNode( parent );
      var id    = preview.id;
      var image = preview.image;

      // Rectangle Data
      rect = rect.toString();
      rect = rect.replace("[","");
      rect = rect.replace("]","");
      var rect_array = rect.split(",");
      var rect_data = "x0: " + parseInt( rect_array[0] ) + ", x1: " + parseInt( rect_array[2] ) + ", y0: " + parseInt( rect_array[1] ) + ", y1: " + parseInt( rect_array[3] );
      //

      var metadata = format ("%d x %d", image.width, image.height);

      node.checkable = true;
      node.checked = true;
      node.setText ( 0, id );
      node.setText ( 1, metadata );
      node.setText ( 2, rect_data );

      return node;

   }

   this.target_GroupBox.sizer.add (this.previews_List, 100);


   // UI for the options
   this.options_GroupBox = new GroupBox (this);
   //this.options_GroupBox.title = "Options";
   this.options_GroupBox.sizer = new VerticalSizer;
   this.options_GroupBox.sizer.margin = 2;
   this.options_GroupBox.sizer.spacing = 2;
   this.options_GroupBox.title="Options";

   this.optionsFirstLine_Sizer = new HorizontalSizer;
   this.optionsFirstLine_Sizer.margin = 2;
   this.optionsFirstLine_Sizer.spacing = 2;

   this.preservePreview_CheckBox = new CheckBox( this );
   this.preservePreview_CheckBox.text = "Preserve existing previews";
   this.preservePreview_CheckBox.toolTip = "<p>Enable this option to preserve the existing previews of the destination images.</p>";
   this.preservePreview_CheckBox.checked = DEFAULT_PRESERVE_PREVIEWS;
   /*   this.preservePreview_CheckBox.onClick = function( checked ) {
      engine.preservePreview = checked;
   };
   */
   this.optionsFirstLine_Sizer.add (this.preservePreview_CheckBox);
   this.optionsFirstLine_Sizer.addStretch();

   this.mode_Label = new Label(this);
   this.mode_Label.text="Size compatibility: ";
   this.mode_ComboBox = new ComboBox( this );
   this.mode_ComboBox.addItem( "Exact");
   this.mode_ComboBox.addItem( "Absolute");
   this.mode_ComboBox.addItem( "Scaled");
   this.mode_ComboBox.addItem( "Proportional");
  /*
   Maybe could update target view status depending on scaling factor
    this.mode_ComboBox.onItemSelect = function (onItemIndex) {
      ///this.dialog.
   }
   */
   this.mode_ComboBox.currentItem = PP_MATCH_MODE_SCALED -1;
   this.mode_ComboBox.toolTip = "Action if the source image size does not match the target image size:<br/>" +
                             "EXACT        - Ignore the previews if the source and target images do not have the same size.<br/>"+
                             "SCALED       - Scale previews if target size is a near integer factor of source size (for example due to binning), ignore them otherwise.<br/>"+
                             "PROPORTIONAL - Scale previews independently in the X and Y directions independently  (may be useful to copy previews to slighly cropped copies of an image).<br/>"+
                             "ABSOLUTE     - Use the source location and dimension of of the preview even if the target image has a different size.";
   this.optionsFirstLine_Sizer.add (this.mode_Label);
   this.optionsFirstLine_Sizer.add (this.mode_ComboBox);

   this.options_GroupBox.sizer.add(this.optionsFirstLine_Sizer);


   this.optionsSecondLine_Sizer = new HorizontalSizer;
   this.optionsSecondLine_Sizer.margin = 2;
   this.optionsSecondLine_Sizer.spacing = 2;

   this.copyZoom_CheckBox = new CheckBox( this );
   this.copyZoom_CheckBox.text = "Copy zoom factor and location";
   this.copyZoom_CheckBox.toolTip = "<p>Enable this option to copy the viewing zoom and position of the source previews to the target previews.</p>";
   this.copyZoom_CheckBox.checked = true;

   this.deletePreviewsOnly_CheckBox = new CheckBox( this );
   this.deletePreviewsOnly_CheckBox.text = "Delete previews only";
   this.deletePreviewsOnly_CheckBox.toolTip = "<p>Enable this option to request deletion of all previews on the target windows.<br/>"+
                                              "No preview will be added.</p>";
   this.deletePreviewsOnly_CheckBox.checked = false;   // Always unchecked by default
   this.deletePreviewsOnly_CheckBox.onClick = function( checked ) 
   {
       this.dialog.updateOnDeletePreviewsOnlyChanged(checked);
   };
   // If executing a process icon, we cannot delete all previous (button kept to keep consistant layout)
   if (geometryParameters) {
      this.deletePreviewsOnly_CheckBox.enabled = false;
   }

   this.optionsSecondLine_Sizer.add (this.copyZoom_CheckBox);
   this.optionsSecondLine_Sizer.add (this.deletePreviewsOnly_CheckBox);

   this.options_GroupBox.sizer.add(this.optionsSecondLine_Sizer);



   // -- Selection of target images

   this.destination_List = new TreeBox (this);
   this.destination_List.alternateRowColor = true;
   this.destination_List.setMinSize (450, 150);
   this.destination_List.font = new Font ("monospace", 10); // best to show tabulated data
   this.destination_List.numberOfColumns = 2;
   this.destination_List.headerVisible = true;
   this.destination_List.headerSorting = true;
   this.destination_List.setHeaderText (0, "Images");
   this.destination_List.setHeaderText (1, "Dimensions / Channels");
   this.destination_List.setHeaderText (2, "Current Previews");
   this.destination_List.setHeaderAlignment (0, Align_Left);
   this.destination_List.setHeaderAlignment (1, Align_Left);
   this.destination_List.setHeaderAlignment (2, Align_Left);
   this.destination_List.toolTip = "Select the windows you want to copy the previews to and press " +
         "<i>OK</i> or <i>Execute immediately</i>.<br/>" +
         "Alternatively create a new process instance (dragging the bottom left corner arrow to the workspace), " +
         "<i>Cancel</i> the script and then drag the created process icon to the desired target windows.<br>" +
         "Dragging directly the <i>new instance</i> icon to the target windows is not supported.";


   // Create the list of possible target windows
   this.createViewNodeTargets = function() {
      this.destination_List.clear();

      // Create a list of all images
      var aWindows = ImageWindow.windows;
      for ( var i = 0; i < aWindows.length; ++i ) {
         var w = aWindows[i];
         this.addViewNodeTargets( this.destination_List, w );
      }
   }


   // Refresh the enable/checkable flags to ensure that the source view (if present) is disabled,
   // If we select the images to delete preview, then we allow selection of the
   // source window 
    this.refreshViewNodeFlags = function(sourceWindow, forDeleteAllPreviews) {
      // TODO Disable selection of incompatible window size
      // Disable the sourceWindow as a target (not needed)
      if (sourceWindow) {
         var sourceWindowId = sourceWindow.mainView.id;
         var i;
         for (i=0; i<this.destination_List.numberOfChildren; i++) {
            var node = this.destination_List.child(i);
            var viewId = node.text(0);
            if(viewId == sourceWindowId)  {
               // source window cannot be a target, unless forDeleteAllPreviews is set
               this.setFontOfNode(node, ! forDeleteAllPreviews);
               node.checkable = forDeleteAllPreviews;
               node.enabled = forDeleteAllPreviews;
               // Source window is never checked by default for consistency 
               node.checked = false;
            } else {
               this.setFontOfNode(node, false);
               node.checkable = true;
               node.enabled = true;
            };
         }
      }
   }

   this.setFontOfNode = function (node, italic) {
      var i, font;
      for (i=0; i<3; i++) {
         font = node.font(i);
         font.italic = italic;
         node.setFont(i,font);
      }
   }

      // Node creation helper
   this.addViewNodeTargets = function( parent, view ) {

      var node = new TreeBoxNode( parent );
      var previewNumber = view.previews;
      var id = view.mainView.id;
      var image = view.currentView.image;
      var metadata = format ("%d x %d x %d", image.width, image.height, image.numberOfChannels);

      node.checkable = true;
      node.checked = false;
      node.setText (0, id);
      node.setText (1, metadata);
      node.setText (2, previewNumber.length + " preview(s)");
      return node;

   }

   // Initial creation of lisz of target windows
   this.createViewNodeTargets();

   // Disable the selection of the target window which is the same as the source window,
   // but only if the source is a window, not a loaded process icon
   if (!geometryParameters) {
      this.refreshViewNodeFlags(ImageWindow.activeWindow, false);
   }

   this.destination_List.sort();

   // Ensure that all columns are initially visible
   this.destination_List.adjustColumnWidthToContents (0);
   this.destination_List.adjustColumnWidthToContents (1);
   this.destination_List.adjustColumnWidthToContents (2);

   this.destination_GroupBox = new GroupBox (this);
   this.destination_GroupBox.title = "Target images";
   this.destination_GroupBox.sizer = new VerticalSizer;
   this.destination_GroupBox.sizer.margin = 4;
   this.destination_GroupBox.sizer.spacing = 4;
   this.destination_GroupBox.sizer.add (this.destination_List, 100);

   // Buttons

   this.ok_Button = new PushButton (this);
   this.ok_Button.text = "OK";

#ifneq __PI_PLATFORM__ MACOSX
   this.ok_Button.icon =  ":/icons/ok.png" ;
#endif

   // transfer the names of the selected images to the engine
   this.ok_Button.onClick = function() {

      // Keep track of the selected previews to copy TODO Not needed, but may be do it

      this.dialog.ok();
   };

   this.cancel_Button = new PushButton (this);
   this.cancel_Button.text = "Cancel";

#ifneq __PI_PLATFORM__ MACOSX
   this.cancel_Button.icon =  ":/icons/cancel.png" ;
#endif

   this.cancel_Button.onClick = function() {
      this.dialog.cancel();
   };

   this.newInstance_Button = new ToolButton(this);
   this.newInstance_Button.icon = ":/process-interface/new-instance.png";
   this.newInstance_Button.onMousePress = function()
      {
         this.hasFocus = true;
         var gp = this.dialog.getGeometryParameters(geometryParameters);

         gp.exportParameters();

         this.pushed = false;  // TODO not sure why this is needed
         this.dialog.newInstance();
      };
   this.newInstance_Button.toolTip = "Drag and drop on the desktop to create a process icon<br/>"
      + "that can then be dropped on any desired target image (ignoring the list of target images above).";

   this.apply_Button = new ToolButton(this);
   this.apply_Button.icon = ":/process-interface/apply.png";
   this.apply_Button.onClick = function()
      {
         var gp = this.dialog.getGeometryParameters(geometryParameters);

         // Extract the target images from the GUI
         var targetImages = this.dialog.makeTargetParameters();
         engine.targetWindowsIds = targetImages;
         engine.propagatePreviews(gp);

      };
   this.apply_Button.toolTip = "Execute immediately on target images.";

   this.help_Button = new ToolButton( this );
   this.help_Button.icon = ":/process-interface/browse-documentation.png";
   this.help_Button.onClick = function() {
      if ( !Dialog.browseScriptDocumentation( "PropagatePreviewsV2" ) )
            (new MessageBox( "<p>Documentation has not been installed.</p>",
               TITLE + "." + VERSION,
               StdIcon_Error,
               StdButton_Ok
            )).execute();
      };


    // Enable/disable choice of source previews depending on the flag cotrolling
    // if the previews are copied or all previews are deleted
    this.updateOnDeletePreviewsOnlyChanged = function(checked) 
    {
        this.viewList.enabled = ! checked;
        this.target_GroupBox = ! checked;
        this.previews_List.enabled = ! checked;
        this.preservePreview_CheckBox.enabled= ! checked;
        this.mode_ComboBox.enabled = ! checked;
        this.mode_Label.enabled = ! checked;
        this.copyZoom_CheckBox.enabled = ! checked;

        this.refreshViewNodeFlags(ImageWindow.activeWindow, checked);
    };

   // Action buttons
   this.buttons_Sizer = new HorizontalSizer;
   this.buttons_Sizer.spacing = 6;
   this.buttons_Sizer.add (this.newInstance_Button);
   this.buttons_Sizer.add (this.apply_Button);
   this.buttons_Sizer.add (this.help_Button);
   this.buttons_Sizer.addStretch();
   this.buttons_Sizer.add (this.ok_Button);
   this.buttons_Sizer.add (this.cancel_Button);


   this.sizer = new VerticalSizer;
   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add (this.helpLabel);
   this.sizer.addSpacing (4);
   this.sizer.add (this.target_GroupBox, 100);
   this.sizer.add (this.options_GroupBox);
   this.sizer.add (this.destination_GroupBox, 100);
   this.sizer.add (this.buttons_Sizer);

   this.windowTitle = TITLE + " Script v" + VERSION;

   // Default list
   if (geometryParameters) {
      this.preservePreview_CheckBox.checked = geometryParameters.preservePreview ;
      this.copyZoom_CheckBox.checked = geometryParameters.propagateZoomAndPosition;
      this.mode_ComboBox.currentItem = geometryParameters.sizeMatchMode-1;

      for ( var i = 0; i < geometryParameters.previewDefinitions.length; ++i ) {
         this.addFixedPreviewGeometry( this.previews_List, geometryParameters, geometryParameters.previewDefinitions[i]  );
      }
      this.previews_List.sort();

      // Ensure that all columns are initially visible
      this.previews_List.adjustColumnWidthToContents (0);
      this.previews_List.adjustColumnWidthToContents (1);
      this.previews_List.adjustColumnWidthToContents (2);

   } else {
      this.refreshViewList(ImageWindow.activeWindow);
      this.viewList.currentView = ImageWindow.activeWindow.mainView;
   }


   this.adjustToContents();

}
PP_dialog.prototype = new Dialog;

function geometryFromWindow(w) {

   var previewDefinitions = [];

   var savedCurrentView = w.currentView;
   var previews = w.previews;

   for ( var i = 0; i < previews.length; ++i ) {
      var pv = w.previews[i];
      w.currentView = pv;
      var ppd = new PP_previewDefinition(pv.id, w.previewRect(pv), w.viewportPosition, w.zoomFactor);
      previewDefinitions.push(ppd);
   };

   if (w.isValidView(savedCurrentView)) {
       w.currentView = savedCurrentView;
   }

   return previewDefinitions;
}


// Build the parameters from the state of the GUI
PP_dialog.prototype.makeGeometryParameters = function() {
   var gp = new PP_geometryParameters;
   gp.preservePreview = this.preservePreview_CheckBox.checked;
   gp.sizeMatchMode = this.mode_ComboBox.currentItem+1;
   gp.propagateZoomAndPosition = this.copyZoom_CheckBox.checked;

   // Extract geometry information of the source window of the previews
   var w = this.sourceWindow;
   gp.sourceWindowSize = [w.mainView.image.width,w.mainView.image.height];
   var savedCurrentView = w.currentView;
   var previews = w.previews;

   var selectedPreviewsIDs = new Array;
   for(var n = 0; n < this.dialog.previews_List.numberOfChildren; n++) {
      if( this.dialog.previews_List.child(n).checked ) {
         selectedPreviewsIDs.push( this.dialog.previews_List.child(n).text(0) );
      };
   };


   for ( var i = 0; i < previews.length; ++i ) {
      var pv = w.previews[i];
      if( selectedPreviewsIDs.indexOf( pv.id ) != -1 ) {
         // Include preview
         w.currentView = pv;
         var ppd = new PP_previewDefinition(pv.id, w.previewRect(pv), w.viewportPosition, w.zoomFactor);
         gp.previewDefinitions.push(ppd);
      };
   };
   if (w.isValidView(savedCurrentView)) {
       w.currentView = savedCurrentView;
   }
   return gp;
}

// update the geometry parameters that can be updated from a process icon
PP_dialog.prototype.updateGeometryParameters = function(gp) {
   gp.preservePreview = this.preservePreview_CheckBox.checked;
   gp.sizeMatchMode = this.mode_ComboBox.currentItem+1;
   gp.propagateZoomAndPosition = this.copyZoom_CheckBox.checked;

   // currently the list of checked preview cannot be updated

   return gp;
}

PP_dialog.prototype.makeTargetParameters = function() {
   var targetIDs = new Array;
   for(var n = 0; n < this.destination_List.numberOfChildren; n++) {
      if( this.destination_List.child(n).checked ) {
         targetIDs.push( this.dialog.destination_List.child(n).text(0) );
      }
   };
   return targetIDs;
}

// Add preview parameters from the geometryParameters
PP_dialog.prototype.addFixedPreviewGeometry = function( parent, gp, pd) {
      var node  = new TreeBoxNode( parent );

      var rect_data = "x0: " + pd.geometry[0] + ", x1: " + pd.geometry[2] + ", y0: " + pd.geometry[1] + ", y1: " +pd.geometry[3] ;

      var metadata = format ("%d x %d", gp.sourceWindowSize[0], gp.sourceWindowSize[1] );

      node.checkable = true;
      node.checked = true;
      // TODO Currently cannot enable/disable from this list
      node.enabled = false;
      node.setText ( 0, pd.name );
      node.setText ( 1, metadata );
      node.setText ( 2, rect_data );

      return node;

   }


PP_dialog.prototype.getGeometryParameters = function(geometryParameters) {
   var gp;
   if (Parameters.isGlobalTarget) {
      // update the loaded parameters with the modifiable fields - geometryParameters must be defined
      gp = this.dialog.updateGeometryParameters(geometryParameters);
   } else {
      // Create a new geometry parameters from all information in the GUI and from the selected window
      gp = this.dialog.makeGeometryParameters();
   }
   if (DEBUG_MODE) Console.writeln("DEBUG - global: " + Parameters.isGlobalTarget + ", gp: " + JSON.stringify(gp, null, "\t"));
   return gp;
}




// ----------------------------------------------------------------------------
// -- main
// ----------------------------------------------------------------------------

var engine = new PP_engine();


// The execution may be have been launched by the menu or by global execution of the Process Icon.
// If launched by the menu then the currently activeWindow will be used as the source of preview.
// If launched by a global execution of the script 'Process Icon' then the preview definitions
//    are taken from the 'Process Icon' and cannot be changed.
function main() {
   var dialog;
   var success;
   var gp = null;

   if (DEBUG_MODE) Console.writeln("DEBUG - Parameters ",Parameters.isViewTarget, " ",  Parameters.isGlobalTarget, " ", Parameters.targetView);

   if (Parameters.isViewTarget) {

      // --- A script 'Process Icon' was dropped on an ImageWindow.
      //     Create the previews saved in the 'Process Icon' on that target window without user interaction.

      // The target window
      var w = Parameters.targetView.window.mainView;
      // Other parameters from the process icon
      gp = importParameters();

      if (DEBUG_MODE) Console.writeln("DEBUG - parameters: " + JSON.stringify(gp, null, "\t"));
      engine.targetWindowsIds = [w.id];
      success = engine.propagatePreviews(gp);
      if (!success) {
         Console.show();
      }


   } else {

      // -- Execute interactively, show the user interface initialized from the target window or the 'Process Icon'

      if (Parameters.isGlobalTarget) {
         // The GUI is started from a process icon, load the preview information from the icon,
         // do not allow to change the source window.
         gp = importParameters();
         dialog = new PP_dialog(gp);
       } else {
          // The GUI is started directly, allow use to select source window for previews (default to active)
         dialog = new PP_dialog(null);
      }

      // Execute dialog and operate
      for (;;) {
         if (!dialog.execute())
            break;

        // Get the list of target images from the GUI
        var targetImages = dialog.makeTargetParameters();
        if (DEBUG_MODE) Console.writeln("DEBUG - main: " + targetImages.length + " targetImages: " + JSON.stringify(targetImages, null, "\t"));
        engine.targetWindowsIds = targetImages;

        // Special case for delete previews
        if (dialog.deletePreviewsOnly_CheckBox.checked) {
         
          if (targetImages.length > 0) {
            // Confirm request to delete all previews
            var confirm = new MessageBox(
                      "<p>Delete all previews in image(s) " + targetImages.join(", ") + " ?</p>",
                      TITLE, StdIcon_Question, StdButton_Ok, StdButton_Cancel).execute();
              if (StdButton_Ok === confirm) {
              success = engine.deleteAllPreviews();
              if (! success) {
                // Consider no change as suspect, show console
                 Console.show();
              }
              // Quit execution (maxbe should be only after effective changes ?)
              // Continuing execution would require refresh of the target images
              break;
            }     
          } else {
              var msg = new MessageBox(
                    "<p>No target was selected - Use <i>Cancel</i> to exit without any action.</p>",
                    TITLE, StdIcon_Warning, StdButton_Ok );
              msg.execute();
          }

        } else {

           // Get the parameters that are independent of the target images from the gui
           gp = dialog.getGeometryParameters(gp);

           if (DEBUG_MODE) Console.writeln("DEBUG - main: geometry parameters: " + JSON.stringify(gp, null, "\t"));

           // Add the preview to the target images
           if ( targetImages.length > 0 && gp.previewDefinitions.length > 0 ) {

              // Execute on the target images
              success = engine.propagatePreviews(gp);
              if (!success) {
                 Console.show();
              }

              // Quit execution (maxbe should be only after effective changes ?)
              break;
           } else {
              var msg = new MessageBox(
                    "<p>No preview and/or target was selected - Use <i>Cancel</i> to exit without any action.</p>",
                    TITLE, StdIcon_Warning, StdButton_Ok );
              msg.execute();
           }
         }
      }
   }

}

// True if the script is included by the test program and driven by it
#ifndef TEST_MODE
   main();
#endif

