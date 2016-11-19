#ifndef _CoordUtils_jsh
#define _CoordUtils_jsh

function ParseError(message) {
  this.message = message;
  this.name = "ParseError";
}

function sexadecimalStringToDouble(str,separator) {
   var tokens = str.split(separator);
   var n = tokens.length;
   if (n < 1){
      throw ParseException("empty string");
   }
   if (n > 3){
      throw ParseException("too many components");
   }
   var t1;
   if (n == 1){
      t1 = Math.abs(parseFloat(tokens[0]));
   } else {
      var d = Math.abs(parseInt(tokens[0]));
      if (n == 2){
         if ( m < 0  ){
          throw ParseError( "second component out of range", tokens[1] );
         }
         t1 = d + m/60;
      } else {
         var m = parseFloat(tokens[1]);
         if ( m < 0 ) {
            throw ParseError( "second component out of range", tokens[1] );
         }
         var s = parseFloat(tokens[2]);
         if ( s < 0 ) {
            throw ParseError( "third component out of range", tokens[2] );
         }
         t1 = d + (m + s/60)/60;
      }
   }
   return tokens[0].charAt(0) == "-" ?  -t1 : t1;
}

#endif
