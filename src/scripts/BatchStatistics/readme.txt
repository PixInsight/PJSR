Script Installation Instructions
================================
BatchStatistics and its documentation form part of the standard release of PixInsight as of version 01.08.04.  If you wish to add this script to an earlier version please follow the instructions below.

1. Find the a folder called "BatchStatistics" in this .ZIP file.  Place the unzipped folder and its contents in your <PixInsight Folder>/src/scripts folder. (Note: Do not place the contents of the "BatchStatistics" folder directly in to /src/scripts but rather ensure that it is inside the scripts folder in a sub-folder called BatchStatistics).

2. In PixInsight select "Script" menu -> "Feature Scripts...".

3. Now click the "Add" button from the "Feature Scripts" dialog. Make sure the <PixInsight Folder>/src folder is selected and click "OK". 

4. You should get a message saying that "1 additional script(s) were found on directory ...". Click "OK" and then "Done".

5. The BatchStatistics Script should now appear under the "Script" menu -> "Batch Processing" -> "BatchStatistics".

6. If you need more help, please see this video: http://www.pixinsight.com.ar/en/docs/2/pixinsight-add-script.html.

Documentation Installation Instructions (Optional)
==================================================

7. To install the documentation unzip the "pidoc" folder to a temporary location.

8. In PixInsight select "Script" menu -> "Development" -> "Documentation Compiler".

9. Click "Add Files" and browse to the pidoc folder that you just unzipped.

10. Choose the "BatchStatistics.pidoc" file and click "Open" to add it to the "PIDoc Source Files" list.

11. Click the "Run" button.

12. Click "No" when asked if you want to perform another compilation.

13. The console should display "PIDocCompiler: 1 succeeded, 0 failed, 17 warning(s)".

14. You can read the documentation by clicking the "Documentation" button at the bottom left of the "BatchStatistics" dialog, or by finding it in the "Process Explorer" under "<Scripts>" -> "Batch Processing" -> "BatchStatistics".

ChangeLog
=========
   1.2.2: Bug fix release
          Mainly to enabling / disabling controls when processing.
   1.2.1: Bug fix release
          Fixed problem where saving a script instance with no input files and
          relaunching it created an empty file name in the input file list.
   1.2  : Third (full) release).
          Fixed script not aborting processing when dialog close button used.
          Fixed re-sizing of file list so that scroll-bars appear when needed.
          Relocated call to dialog.updateUI to resize exit button on launch.
   1.1b : Second (beta) release.
          Fixed incorrect restoration of settings from process icon.
          Fixed problems with reentrant controls crashing script.
          Added abort processing button/functionality.
          Added PIDOC documentation and help button.
          NoiseEvaluation-Engine.js out of beta.
          ImageExtensions-lib.js out of beta.
          GUIFactory-lib.js out of beta.
   1.0b : First (beta) release.

Notes for Script Developers
===========================

a. The "ImageExtensions-lib.js" file contains methods to extend the PJSR Image.prototype to add .count() and .variance() methods, which are available in PCL and also in the (out of date) PJSR ImageStatistics object, but not available on the PJSR Image object.  This is code supplied to me by Juan, all I have done is added a bit of wrapper around it to check for the existence of these methods and any conflicting property names.  Juan said that he will add these methods in a future release, so the wrapper should ensure there is no conflict as and when that happens.  As ever feel free to re-use per the license in the file - it's not my code so no credit claimed!

b. The "NoiseEvaluation-Engine.js" file duplicates the functionality of the NoiseEvaluation script but in a form that can be re-used by other scripts.  The code is documented so if you need these measures in your own code feel free to re-use, again respecting the license and again acknowledging that this is not my code, just a refactoring of Juan's.

c. The "BatchStatistics-Engine.js" file allows (reasonably) efficient processing of image files to calculate statistics. The data can be accessed in delimited text format or directly from the public properties of the StatisticsEngine object. All methods and properties are documented in the code.  I plan to extend this object in the future to re-use in other scripts (I have various ideas).  Again feel free to re-use respecting the license details.

d.  The "GUIFactory-lib.js" contains a rough and ready factory object to simplify creation of UI controls in scripts. It is far from feature-complete and really designed to save me time typing and constantly looking up other examples (there are a lot of controls in my little script!).  Again feel free to re-use or fork as required. Others have done similar things in their scripts, so I'm not looking for any prizes for originality here!