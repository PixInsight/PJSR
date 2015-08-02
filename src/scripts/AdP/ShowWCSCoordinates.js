
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

/*      var wcs = new WCSKeywords();
      wcs.ctype1="'RA---MER'";
      wcs.ctype2="'DEC--MER'";
      wcs.crpix1=metadata.width/2;
      wcs.crpix2=metadata.height/2;
      wcs.crval1=0;
      wcs.crval2=-90;
      var proj=wcs.CreateProjection();
      console.writeln(JSON.stringify(proj));*/

      //console.write("IMG:"); metadata.ref_I_G.Apply(new Point(-0.5,metadata.height+0.5)).Print();
      //console.write("RefPoint:"); proj.Inverse(new Point(-0.5,metadata.height+0.5)).Print();
/*      var p=new Point(-0.5,metadata.height+0.5);
      console.writeln("pI:",p.toString());
      console.writeln("pG:",metadata.ref_I_G.Apply(p).toString());
      var p1=metadata.Convert_I_RD(p);
      console.writeln("pRD:",p1.toString());
      console.writeln("pI:",metadata.Convert_RD_I(p1).toString());*/

      console.writeln("p:",metadata.projection.sph.CelestialToNative(new Point(15*15,-80)).toString());
      console.writeln("p:",metadata.projection.sph.CelestialToNative(new Point(23*15,-80)).toString());

      console.writeln("p:",metadata.projection.sph.CelestialToNative(new Point(23*15,20)).toString());
      console.writeln("p:",metadata.projection.sph.CelestialToNative(new Point(1*15,20)).toString());

   } else
      console.writeln("There is not active window");
}
main();
