// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// MainViewController.js - Released 2017/01/15 00:00:00 UTC
// ****************************************************************************
//
// This file is part of ViewIdReplace Script Version 1.4
//
// Copyright (C) 2012-2017 Mike Schuster. All Rights Reserved.
// Copyright (C) 2003-2017 Pleiades Astrophoto S.L. All Rights Reserved.
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

function MainController(model) {
   this.view = null;

   this.setView = function(view) {
      this.view = view;
   };

   // Filters a view id to match /^[_a-zA-Z][_a-zA-Z0-9]*$/ by replacing invalid
   // characters by "_".
   this.filterViewId = function(viewId) {
      return viewId.trim() == "" ?
         "_" :
         viewId.trim().
            replace(/[^_a-zA-Z0-9]/g, '_').
            replace(/^[^_a-zA-Z]/, '_');
   };

   this.replaceViewId = function(view) {
      if (view != null && view.isView) {
         var patternFlags = model.pattern.match(/^\/(.*)\/([^/]*)$/);

         try {
            var pattern = patternFlags != null && patternFlags.length == 3 ?
               new RegExp(
                  patternFlags[1],
                  patternFlags[2].replace(/[^gi]/g, "")
               ) :
               model.pattern;

            view.id = this.filterViewId(
               view.id.replace(pattern, model.replacement.trim())
            );
         }
         catch (exception) {
            console.criticalln(
               "<b>Error:</b> Invalid regular expression: " +
               exception.message + ": " +
               model.pattern
            );
         }
      }
   };

   this.execute = function() {
      if (Parameters.isViewTarget) {
         this.replaceViewId(Parameters.targetView);
      }
      else {
         this.view.execute();
      }
   };

   this.patternOnTextUpdated = function(text) {
      model.pattern = text;
   };

   this.replacementOnTextUpdated = function(text) {
      model.replacement = text;
   };

   this.newInstance = function() {
      model.storeParameters();
   };

   this.browseDocumentation = function() {
      if (!Dialog.browseScriptDocumentation(TITLE)) {
         (new MessageBox(
            "<p>Documentation has not been installed.</p>",
            TITLE,
            StdIcon_Warning,
            StdButton_Ok
         )).execute();
      }
   };

   this.reset = function() {
      model.pattern = model.patternDefault;
      this.view.patternEdit.text = model.pattern;

      model.replacement = model.replacementDefault;
      this.view.replacementEdit.text = model.replacement;
   };

   this.diagnostics = function() {
      var patternFlags = model.pattern.match(/^\/(.*)\/([^/]*)$/);

      try {
         var pattern = patternFlags != null && patternFlags.length == 3 ?
            new RegExp(
               patternFlags[1],
               patternFlags[2].replace(/[^gi]/g, "")
            ) :
            model.pattern;

         (new MessageBox(
            "<p>No syntax errors detected.</p>",
            TITLE,
            StdIcon_Information,
            StdButton_Ok
         )).execute();
      }
      catch (exception) {
         (new MessageBox(
            "<p><b>Error</b>: " +
               exception.message + ".</p>",
            TITLE,
            StdIcon_Error,
            StdButton_Ok
         )).execute();
      }
   };

   this.dismiss = function() {
      this.view.ok();
   };
}

function MainView(model, controller) {
   this.__base__ = Dialog;
   this.__base__();

   this.addGroupBox = function(title) {
      var groupBox = new GroupBox(this);
      this.sizer.add(groupBox);

      groupBox.sizer = new VerticalSizer;
      groupBox.sizer.margin = 6;
      groupBox.sizer.spacing = 6;
      groupBox.title = title;
      groupBox.styleSheet = "*{}";

#ifeq __PI_PLATFORM__ MACOSX
      if (coreVersionBuild < 1168) {
         groupBox.sizer.addSpacing(-6);
      }
#endif

      return groupBox;
   };

   this.addPane = function(group) {
      var buttonPane = new HorizontalSizer;
      buttonPane.spacing = 6;
      group.sizer.add(buttonPane);

      return buttonPane;
   };

   this.addEdit = function(
      pane, text, toolTip, onTextUpdated, onEditCompleted
   ) {
      var edit = new Edit(this);
      pane.add(edit);

      edit.text = text;
      edit.toolTip = toolTip;
      edit.onTextUpdated = onTextUpdated;
      edit.onEditCompleted = onEditCompleted;

      return edit;
   };

   this.addLabel = function(pane, text, toolTip) {
      var label = new Label(this);
      pane.add(label);

      label.text = text;
      label.toolTip = toolTip;
      label.textAlignment = TextAlign_Right | TextAlign_VertCenter;

      return label;
   };

   this.addPushButton = function(pane, text, toolTip, onClick) {
      var pushButton = new PushButton(this);
      pane.add(pushButton);

      pushButton.text = text;
      pushButton.toolTip = toolTip;
      pushButton.onClick = onClick;

      return pushButton;
   };

   this.addToolButtonMousePress = function(pane, icon, toolTip, onMousePress) {
      var toolButton = new ToolButton(this);
      pane.add(toolButton);

      toolButton.icon = this.scaledResource(icon);
      toolButton.setScaledFixedSize(20, 20);
      toolButton.toolTip = toolTip;
      toolButton.onMousePress = onMousePress;

      return toolButton;
   };

   this.addToolButton = function(pane, icon, toolTip, onClick) {
      var toolButton = new ToolButton(this);
      pane.add(toolButton);

      toolButton.icon = this.scaledResource(icon);
      toolButton.setScaledFixedSize(20, 20);
      toolButton.toolTip = toolTip;
      toolButton.onClick = onClick;

      return toolButton;
   };

   this.sizer = new VerticalSizer;
   this.sizer.margin = 6;
   this.sizer.spacing = 6;

   {
      this.patternGroupBox = this.addGroupBox("Pattern");

      {
         this.patternPane = this.addPane(this.patternGroupBox);

         this.patternEdit = this.addEdit(
            this.patternPane,
            model.pattern,
            "<p>A regular expression or a string.</p>" +

            "<p>If a regular expression of the form /pattern/flags, the " +
            "match or matches are replaced with the string specified by " +
            "replacement parameter.</p>" +

            "<p>If a string, it is treated as a verbatim string. Only the " +
            "first occurrence will be replaced.</p>" +

            "<p>An abbreviated list of pattern meanings in regular " +
            "expressions.</p>" +

            "<ul>" +
            "<li>.&nbsp;&nbsp;Matches any single character.</li>" +
            "<li>\\d&nbsp;&nbsp;Matches any digit character, equivalent to " +
            "[0-9].</li>" +
            "<li>\\D&nbsp;&nbsp;Matches any character that is not a digit, " +
            "equivalent to [^0-9].</li>" +
            "</ul>" +

            "<ul>" +
            "<li>[xyz]</li>" +
            "<li>[a-c]&nbsp;&nbsp;A character set. Matches any one of the " +
            "enclosed characters. You can specify a range of characters by " +
            "using a hyphen.</li>" +
            "<li>[^xyz]</li>" +
            "<li>[^a-c]&nbsp;&nbsp;A negated or complemented character set. " +
            "That is, it matches anything that is not enclosed in the " +
            "brackets. You can specify a range of characters by using a " +
            "hyphen.</li>" +
            "</ul>" +

            "<ul>" +
            "<li>x|y&nbsp;&nbsp;Matches either x or y.<li>" +
            "</ul>" +

            "<ul>" +
            "<li>^&nbsp;&nbsp;Matches beginning of input.<li>" +
            "<li>$&nbsp;&nbsp;Matches end of input.<li>" +
            "</ul>" +

            "<ul>" +
            "<li>(x)&nbsp;&nbsp;Matches x and remembers the match as a " +
            "parenthesized submatch string.<li>" +
            "<li>\\n&nbsp;&nbsp;Where n is a positive integer, a back " +
            "reference to the substring matching the nth parenthesized " +
            "submatch string.<li>" +
            "<li>(?:x)&nbsp;&nbsp;Matches x but does not remember the " +
            "match.<li>" +
            "</ul>" +

            "<ul>" +
            "<li>x*&nbsp;&nbsp;Matches the preceding item x 0 or more " +
            "times.<li>" +
            "<li>x+&nbsp;&nbsp;Matches the preceding item x 1 or more " +
            "times.<li>" +
            "<li>x?&nbsp;&nbsp;Matches the preceding item x 0 or 1 time.<li>" +
            "<li>x*?</li>" +
            "<li>x+?</li>" +
            "<li>x??&nbsp;&nbsp;Matches the preceding item x like *, +, and " +
            "?, however the match is the smallest possible match.</li>" +
            "</ul>" +

            "<ul>" +
            "<li>x(?=y)&nbsp;&nbsp;Matches x only if x is followed by y.<li>" +
            "<li>x(?!y)&nbsp;&nbsp;Matches x only if x is not followed by " +
            "y.<li>" +
            "</ul>" +

            "<p>If specified, flags can have any combination of the " +
            "following values:</p>" +

            "<ul>" +
            "<li>g&nbsp;&nbsp;Global match; find all matches rather than " +
            "stopping after the first match.</li>" +
            "<li>i&nbsp;&nbsp;Ignore character case.</li>" +
            "</ul>",
            function(text) {
               controller.patternOnTextUpdated(text);
            },
            function() {
               this.text = model.pattern;
            }
         );
      }
   }

   {
      this.replacementGroupBox = this.addGroupBox("Replacement");

      {
         this.replacementPane = this.addPane(this.replacementGroupBox);

         this.replacementEdit = this.addEdit(
            this.replacementPane,
            model.replacement,
            "<p>The string that replaces the substring specified by the " +
            "pattern parameter. A number of special replacement patterns are " +
            "supported:</p>" +

            "<ul>" +
            "<li>$&&nbsp;&nbsp;Inserts the matched substring.</li>" +
            "<li>$`&nbsp;&nbsp;Inserts the portion of the string that " +
            "precedes the matched substring.</li>" +
            "<li>$'&nbsp;&nbsp;Inserts the portion of the string that " +
            "follows the matched substring.</li>" +
            "<li>$n&nbsp;&nbsp;Where n is a positive integer, inserts " +
            "the nth parenthesized submatch string, provided the pattern " +
            "parameter was a regular expression.</li>" +
            "</ul>" +

            "<p>Replacement characters not in the set [A-Za-z0-9_] are " +
            "themselves replaced with underscore.</p>" +

            "<p>If the output is not a unique view id, one or more digits " +
            "will be appended.</p>",
            function(text) {
               controller.replacementOnTextUpdated(text);
            },
            function() {
               this.text = model.replacement;
            }
         );
      }
   }

   this.sizer.addStretch();

   {
      this.buttonPane = this.addPane(this);

      this.newInstanceButton = this.addToolButtonMousePress(
         this.buttonPane,
         ":/process-interface/new-instance.png",
         "<p>Create a new instance.</p>",
         function() {
            this.hasFocus = true;
            controller.newInstance();
            this.pushed = false;
            this.dialog.newInstance();
         }
      );

      this.browseDocumentationButton = this.addToolButton(
         this.buttonPane,
         ":/process-interface/browse-documentation.png",
         "<p>Open a browser to view documentation.</p>",
         function() {
            controller.browseDocumentation();
         }
      );

      this.resetButton = this.addToolButton(
         this.buttonPane,
         ":/process-interface/reset.png",
         "<p>Reset all parameters.</p>",
         function() {
            controller.reset();
         }
      );

      this.diagnosticsButton = this.addToolButton(
         this.buttonPane,
         ":/process-interface/diagnostics.png",
         "<p>Check the pattern for syntax errors.</p>",
         function() {
            controller.diagnostics();
         }
      );

      this.versionLabel = this.addLabel(
         this.buttonPane,
         "Version " + VERSION,
         "<p><b>" + TITLE + " Version " + VERSION + "</b></p>" +

         "<p>Script that renames a view with some or all matches of a " +
         "pattern replaced by a replacement.</p>" +

         "<p>The script provides an alternative to manually renaming " +
         "multiple views when the renaming can be expressed as a regular " +
         "expression or string replacement.</p>" +

         "<p>Typical usage is as follows: Launch the script, specify pattern " +
         "and replacement, drag an instance to the workspace, dismiss the " +
         "script, drag the instance onto one or more views to rename.</p>" +

         "<p>Multiple instances of the script with different patterns and " +
         "replacements may be created in the workspace. Drag the appropriate " +
         "instance onto the view.</p>" +

         "<p>Copyright &copy; 2012-2017 Mike Schuster. All Rights " +
         "Reserved.<br>" +
         "Copyright &copy; 2003-2017 Pleiades Astrophoto S.L. All Rights " +
         "Reserved.</p>"
      );
      this.versionLabel.setVariableWidth();

      this.buttonPane.addStretch();

      this.dismissButton = this.addPushButton(
         this.buttonPane,
         "Dismiss",
         "<p>Dismiss the dialog.</p>",
         function() {
            controller.dismiss();
         }
      );
      this.dismissButton.defaultButton = true;
      this.dismissButton.hasFocus = true;
   }

   this.windowTitle = TITLE;

   this.adjustToContents();
   this.setMinWidth(this.width + this.logicalPixelsToPhysical(80));
   this.setFixedHeight(this.height + this.logicalPixelsToPhysical(6));
}
MainView.prototype = new Dialog;

// ****************************************************************************
// EOF MainViewController.js - Released 2017/01/15 00:00:00 UTC
