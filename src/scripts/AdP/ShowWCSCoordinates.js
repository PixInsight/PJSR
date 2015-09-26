
#include <pjsr/DataType.jsh>
#define SETTINGS_MODULE "SHOWWCS"
#include "WCSmetadata.jsh"


function main()
{
   var window = ImageWindow.activeWindow;
   if (window != null)
   {
      var metadata = new ImageMetadata();
      metadata.ExtractMetadata(window);
      if (metadata.ref_I_G == null){
         console.writeln("The image has not WCS coordinates");
      } else
         metadata.Print();
   } else
      console.writeln("There is not active window");
}
main();
