// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// PIDocCompiler.js - Released 2015/07/22 16:40:31 UTC
// ----------------------------------------------------------------------------
//
// This file is part of PixInsight Documentation Compiler Script version 1.6.1
//
// Copyright (c) 2010-2015 Pleiades Astrophoto S.L.
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

/*
 * PixInsight Documentation Compiler
 *
 * Copyright (C) 2010-2015 Pleiades Astrophoto. All Rights Reserved.
 * Written by Juan Conejero (PTeam)
 *
 * PIDoc compiler and document generation.
 */

// ----------------------------------------------------------------------------
// Compiler Tokens
// ----------------------------------------------------------------------------

/*
 * Auxiliary structure to hold generated contents.
 */
function Contents( contents, nextIndex )
{
   this.contents = contents;
   this.nextIndex = nextIndex;
}

/*
 * Generic token.
 */
function Token()
{
   this.__base__ = Object;
   this.__base__();

   this.wantsNewParagraph = function()
   {
      return false;
   };

   this.toPlainText = function( tokens, nextIndex )
   {
      return new Contents( '', nextIndex );
   };

   this.toUri = function( tokens, nextIndex )
   {
      return this.toPlainText( tokens, nextIndex );
   };

   this.toXhtml = function( paragraphType, tokens, nextIndex )
   {
      return new Contents( '', nextIndex );
   };

   this.toString = function()
   {
      return "<token>";
   };
}

Token.prototype = new Object;

// ----------------------------------------------------------------------------

/*
 * Base object of all marker tokens.
 * Markers are used to locate file name and line number information in all
 * compilation, parsing and generation errors.
 */
function Marker()
{
   this.__base__ = Token;
   this.__base__();

   this.toXhtml = function( paragraphType, tokens, nextIndex )
   {
      // Eat a sequence of contiguous markers and return empty contents
      let i = nextIndex;
      while ( i < tokens.length && tokens[i] instanceof Marker )
         ++i;
      return new Contents( '', i );
   };
}

Marker.prototype = new Token;

/*
 * File path marker token.
 */
function FileMarker( filePath )
{
   this.__base__ = Marker;
   this.__base__();

   this.filePath = filePath;

   this.toString = function()
   {
      return "<file=" + this.filePath + ">";
   };
}

FileMarker.prototype = new Marker;

/*
 * Line number marker token.
 */
function LineMarker( lineNumber )
{
   this.__base__ = Marker;
   this.__base__();

   this.lineNumber = lineNumber;

   // Special copy constructor method to distinguish between true line breaks
   // and duplicate ones (e.g., at the beginning of a text block).
   this.clone = function( lineMarker )
   {
      let m = new LineMarker( this.lineNumber );
      m.isClone = true;
      return m;
   };

   this.toPlainText = function( tokens, nextIndex )
   {
      return new Contents( this.isClone ? '' : '\n', nextIndex );
   };

   this.toUri = function( tokens, nextIndex )
   {
      return new Contents( this.isClone ? '' : '%20', nextIndex );
   };

   this.toString = function()
   {
      return "<line=" + this.lineNumber.toString() + ">";
   };
}

LineMarker.prototype = new Marker;

/*
 * Document location.
 * Finds the document file path and line number from a list of tokens and a
 * token index. Used to generate document location information on error and
 * warning messages.
 */
function DocumentLocation( tokensOrLocation, index )
{
   this.__base__ = Object;
   this.__base__();

   if ( tokensOrLocation instanceof DocumentLocation )
   {
      // Copy constructor
      this.filePath = tokensOrLocation.filePath;
      this.lineNumber = tokensOrLocation.lineNumber;
   }
   else if ( tokensOrLocation instanceof String )
   {
      // Construct from a <file-path>:<line-number> encoded sequence
      let p = tokensOrLocation.lastIndexOf( ':' ); // don't detect a drive letter
      if ( p > 0 )
      {
         this.filePath = tokensOrLocation.substring( 0, p );
         this.lineNumber = parseInt( tokensOrLocation.substring( p+1 ) );
      }
      else
      {
         this.filePath = '';
         this.lineNumber = parseInt( tokensOrLocation );
      }

      if ( this.lineNumber == undefined || !isFinite( this.lineNumber ) )
         this.lineNumber = -1;
   }
   else
   {
      // Search backwards file path and line number information
      this.filePath = '';
      this.lineNumber = -1;
      for ( ; index >= 0; --index )
         if ( tokensOrLocation[index] instanceof LineMarker )
         {
            this.lineNumber = tokensOrLocation[index].lineNumber;
            for ( ; --index >= 0; )
               if ( tokensOrLocation[index] instanceof FileMarker )
               {
                  this.filePath = tokensOrLocation[index].filePath;
                  break;
               }

            break;
         }
   }
}

DocumentLocation.prototype = new Object;

/*
 * Parse Error.
 * Thrown to signal errors in all compilation, parsing and generation phases.
 */
function ParseError( message, tokensOrLocation, index )
{
   this.__base__ = Object;
   this.__base__();

   this.message = message;
   this.location = new DocumentLocation( tokensOrLocation, index );

   this.toString = function()
   {
      return "*** Error" +
              (this.location.filePath.isEmpty() ? "" : ": " + this.location.filePath) +
              ((this.location.lineNumber < 0) ? "" : " (" + (this.location.lineNumber + 1).toString() + ")") + ": " +
              (this.message.isEmpty() ? "(no additional information)" : this.message);
   };
}

ParseError.prototype = new Object;

/*
 * Whitespace token.
 * Used to represent a set of contiguous whitespace characters.
 */
function Whitespace( length )
{
   this.__base__ = Token;
   this.__base__();

   this.length = length;

   this.toPlainText = function( tokens, nextIndex )
   {
      let s = '';
      for ( let i = 0; i < this.length; ++i )
         s += ' ';
      return new Contents( s, nextIndex );
   };

   this.toXhtml = function( paragraphType, tokens, nextIndex )
   {
      return new Contents( ' ', nextIndex );
   };

   this.toString = function()
   {
      return "<whitespace " + this.length.toString() + ">";
   };
}

Whitespace.prototype = new Token;

/*
 * Bracket token.
 * Used to identify command parameters and blocks during the tokenizing phase.
 */
function Bracket( charCode )
{
   this.__base__ = Token;
   this.__base__();

   this.charCode = charCode;

   this.isBeginParameters = function()
   {
      return this.charCode == LSQUARE;
   };

   this.isEndParameters = function()
   {
      return this.charCode == RSQUARE;
   };

   this.isBeginBlock = function()
   {
      return this.charCode == LCURLY;
   };

   this.isEndBlock = function()
   {
      return this.charCode == RCURLY;
   };

   this.bracket = function()
   {
      return String.fromCharCode( this.charCode );
   };

   this.toPlainText = function( tokens, nextIndex )
   {
      return new Contents( this.bracket, nextIndex );
   };

   this.toXhtml = function( paragraphType, tokens, nextIndex )
   {
      return new Contents( this.bracket, nextIndex );
   };

   this.toString = function()
   {
      return "<bracket= " + this.bracket + ">";
   };
}

Bracket.prototype = new Token;

/*
 * Command specifier token.
 * Used to identify commands during the tokenizing phase.
 */
function CommandSpecifier()
{
   this.__base__ = Token;
   this.__base__();

   this.toPlainText = function( tokens, nextIndex )
   {
      return new Contents( '\\', nextIndex );
   };

   this.toXhtml = function( paragraphType, tokens, nextIndex )
   {
      return new Contents( '\\', nextIndex );
   };

   this.toString = function()
   {
      return "<cmdspec>";
   };
}

CommandSpecifier.prototype = new Token;

/*
 * Text word token.
 */
function TextWord( word )
{
   this.__base__ = Token;
   this.__base__();

   this.word = word;

   this.toPlainText = function( tokens, nextIndex )
   {
      return new Contents( this.word.toPlainText(), nextIndex );
   };

   this.toXhtml = function( paragraphType, tokens, nextIndex )
   {
      let contents = this.word.toXhtml();
      if ( !paragraphType.isEmpty() )
         contents = "<" + paragraphType + ">" + contents + "</" + paragraphType + ">\n";
      return new Contents( contents, nextIndex );
   };

   this.toString = function()
   {
      return this.word;
   };
}

TextWord.prototype = new Token;

/*
 * Text block token.
 * Represents a recursive structure consisting of a list of tokens.
 * In the PIDoc language, a block is any text between curly braces '{ ... }'.
 */
function TextBlock( tokens )
{
   this.__base__ = Token;
   this.__base__();

   this.tokens = tokens;

   this.toPlainText = function( tokens, nextIndex )
   {
      let contents = '';
      for ( let i = 0; i < this.tokens.length; )
      {
         let r = this.tokens[i].toPlainText( this.tokens, i+1 );
         contents += r.contents;
         i = r.nextIndex;
      }
      return new Contents( contents, nextIndex );
   };

   this.toUri = function( tokens, nextIndex )
   {
      let contents = '';
      for ( let i = 0; i < this.tokens.length; )
      {
         let r = this.tokens[i].toUri( this.tokens, i+1 );
         contents += r.contents;
         i = r.nextIndex;
      }
      return new Contents( contents.trim(), nextIndex );
   };

   this.toXhtml = function( paragraphType, tokens, nextIndex )
   {
      let beginTag = paragraphType.isEmpty() ? '' : "<" + paragraphType + ">";
      let endTag = paragraphType.isEmpty() ? '' : "</" + paragraphType + ">\n";
      let contents = '';
      let paragraph = '';

      for ( let i = 0; i < this.tokens.length; )
      {
         let r = this.tokens[i].toXhtml( '', this.tokens, i+1 );

         if ( r.contents.isEmpty() )
         {
            // Two or more successive line breaks start a new paragraph
            if ( r.nextIndex - i > 1 )
            {
               paragraph = paragraph.trim();
               if ( !paragraph.isEmpty() )
               {
                  contents += beginTag + paragraph + (endTag.isEmpty() ? ' ' : endTag);
                  paragraph = '';
               }
            }
         }
         else
         {
            if ( this.tokens[i].wantsNewParagraph() )
            {
               // Commands that generate their own paragraphs or blocks
               paragraph = paragraph.trim();
               if ( !paragraph.isEmpty() )
               {
                  contents += (beginTag.isEmpty() ? ' ' : beginTag) + paragraph + endTag;
                  paragraph = '';
               }
               contents += r.contents;
            }
            else
            {
               // Accumulate paragraph contents
               paragraph += r.contents;
            }
         }

         i = r.nextIndex;
      }

      // Complete the current paragraph, if there is some pending text
      paragraph = paragraph.trim();
      if ( !paragraph.isEmpty() )
         contents += beginTag + paragraph + endTag;

      return new Contents( contents, nextIndex );
   };

   this.toString = function()
   {
      let s = "<block={";
      for ( let i = 0; i < this.tokens.length; ++i )
         s += this.tokens[i].toString();
      s += "}>";
      return s;
   };
}

TextBlock.prototype = new Token;

/*
 * Command parameter.
 * A command parameter is an id:value tuple.
 */
function CommandParameter( parameter, tokens, i )
{
   this.__base__ = Object;
   this.__base__();

   if ( parameter.isEmpty() )
      throw new ParseError( "Expected a command parameter between '[]'", tokens, i );

   let c = parameter.indexOf( ':' );
   if ( c == 0 )
      throw new ParseError( "Expected a command parameter identifier before ':'", tokens, i );
   if ( c > 0 )
   {
      this.id = parameter.substring( 0, c ).trim();
      this.value = parameter.substring( c+1 ).trim();
      if ( this.value.isEmpty() )
         throw new ParseError( "Expected a command parameter value after ':'", tokens, i );
   }
   else
   {
      this.id = parameter;
      this.value = '';
   }

   this.hasValue = function()
   {
      return !this.value.isEmpty();
   };

   this.toString = function()
   {
      return this.id + ':' + this.value;
   };
}

CommandParameter.prototype = new Object;

/*
 * Command parameters token.
 */
function CommandParameters( tokens, i, j )
{
   this.__base__ = Token;
   this.__base__();

   this.parameters = new Array;

   let s = '';
   for ( ; i < j; ++i )
   {
      let r = tokens[i].toPlainText( tokens, i );
      s += (r instanceof Contents) ? r.contents : r;
   }
   if ( !s.isEmpty() )
   {
      let p = s[0];
      if ( p == ',' )
         throw new ParseError( "Missing command parameter before ','", tokens, i );
      for ( let k = 1; k < s.length; ++k )
         if ( s[k] == ',' && s[k-1] != '\\' )
         {
            this.parameters.push( new CommandParameter( p.trim(), tokens, i ) );
            p = '';
         }
         else
            p += s[k];
      if ( !p.isEmpty() )
         this.parameters.push( new CommandParameter( p.trim(), tokens, i ) );
   }

   this.wantsNewParagraph = function()
   {
      throw new ParseError( "Command parameters cannot be used in this context.", tokens, i );
   };

   this.toPlainText = function( tokens, i )
   {
      throw new ParseError( "Command parameters cannot be used in this context.", tokens, i );
   };

   this.toUri = function( tokens, i )
   {
      throw new ParseError( "Command parameters cannot be used in this context.", tokens, i );
   };

   this.toXhtml = function( paragraphType, tokens, i )
   {
      throw new ParseError( "Command parameters cannot be used in this context.", tokens, i );
   };

   this.toString = function()
   {
      let s = "<parameters=";
      for ( let i = 0; i < this.parameters.length; ++i )
      {
         if ( i > 0 )
            s += ',';
         s += this.parameters[i].toString();
      }
      s += ">";
      return s;
   };
}

CommandParameters.prototype = new Token;

/*
 * Command token.
 * Commands are the executive elements of the PIDoc language. There are two
 * main classes of commands: contents generators (e.g. \e \table) and document
 * generators (e.g. \title \section \make).
 */
function Command( id, tokens, i )
{
   this.__base__ = Token;
   this.__base__();

   let index = MetaCommand.indexOf( id );
   if ( index < 0 )
      throw new ParseError( "Unknown command '\\" + id + "'", tokens, i );

   this.meta = MetaCommand.commands[index];

   this.indexOfParameters = function( tokens, nextIndex )
   {
      let i = this.meta.indexOfNextArgument( tokens, nextIndex );
      return (i < tokens.length && tokens[i] instanceof CommandParameters) ? i : -1;
   };

   this.wantsNewParagraph = function()
   {
      return this.meta.wantsNewParagraph;
   };

   this.toPlainText = function( tokens, nextIndex )
   {
      throw new ParseError( "The \\" + this.meta.id + " command cannot be used in this context.", tokens, nextIndex-1 );
   };

   this.toUri = function( tokens, nextIndex )
   {
      throw new ParseError( "The \\" + this.meta.id + " command cannot be used in this context.", tokens, nextIndex-1 );
   };

   this.toXhtml = function( paragraphType, tokens, i )
   {
      // Nothing can happen after the \make command
      if ( document.beenMade )
         throw new ParseError( "The \\make command has already been invoked; further document generation is not permitted: '\\" + this.meta.id + "'", tokens, i-1 );

      // Make sure this is a contents generator
      if ( this.meta.xhtmlGenerator == undefined )
         throw new ParseError( "The \\" + this.meta.id + " command is not a contents generator.", tokens, i-1 );

      // If this command takes optional parameters, look ahead for them
      let p = this.indexOfParameters( tokens, i );
      if ( p > 0 )
         if ( !this.meta.hasParameters )
            throw new ParseError( "The \\" + this.meta.id + " command does not take parameters.", tokens, i-1 );

      // If this command requires one or more data arguments, find the first one
      if ( this.meta.tokenCount > 0 )
         i = this.meta.indexOfNextRequiredArgument( tokens, (p > 0) ? p+1 : i );

      // Generate contents
      let r = this.meta.xhtmlGenerator( tokens, i, p );

      // Return the generated contents with the index of the next token
      if ( p < 0 || p < r.nextIndex )
         return r;
      return new Contents( r.contents, p+1 );
   };

   this.execute = function( tokens, i )
   {
      // Nothing can happen after the \make command
      if ( document.beenMade )
         throw new ParseError( "The \\make command has already been invoked; further document generation is not permitted: '\\" + this.meta.id + "'", tokens, i-1 );

      // Make sure this is a document generator
      if ( this.meta.documentGenerator == undefined )
         throw new ParseError( "The \\" + this.meta.id + " command is not a document generator.", tokens, i-1 );

      // If this command takes optional parameters, look ahead for them
      let p = this.indexOfParameters( tokens, i );
      if ( p > 0 )
         if ( !this.meta.hasParameters )
            throw new ParseError( "The \\" + this.meta.id + " command does not take parameters.", tokens, i-1 );

      // If this command requires one or more data arguments, find the first one
      if ( this.meta.tokenCount > 0 )
         i = this.meta.indexOfNextRequiredArgument( tokens, (p > 0) ? p+1 : i );

      // Before generating document elements, make sure we have the document ready to go
      if ( !document.xhtmlInitialized )
         document.beginXhtmlDocument();

      // Invoke the document generator routine for this command
      i = this.meta.documentGenerator( tokens, i, p );

      // Return the index of the next token
      return (p < i) ? i : p+1;
   };

   this.toString = function()
   {
      return "<command=" + this.meta.id + ">";
   };
}

Command.prototype = new Token;

// ----------------------------------------------------------------------------
// PIDoc Compiler
// ----------------------------------------------------------------------------

function PIDocCompiler()
{
   this.__base__ = Object;
   this.__base__();

   /*
    * PIDoc Compiler Driver.
    * Compiles a PIDoc source file. The output is generated in the global
    * document object.
    */
   this.compile = function( filePath )
   {
      console.show();
      console.writeln( "<end><cbr><br>" +
                       "====================================================================" );
      console.writeln( "PixInsight Documentation Compiler script version " + VERSION );
      console.writeln( "Copyright (c) 2010-2015 Pleiades Astrophoto. All Rights Reserved." );
      console.writeln( "====================================================================" );
      console.writeln();
      console.flush();

      document.reset();
      gc();

      this.filePaths = [];

      compiler = this;

      try
      {
         if ( this.compileFile( filePath, [], 0 ) )
         {
            if ( document.xhtmlInitialized )
               document.endXhtmlDocument();
            else
               document.warning( "No document has been generated (didn't \\make ?).", tokens, 1 );

            document.checkLabelReferences();

            document.message( "Successful compilation with " + document.warningCount + " warning(s)." );
         }
         else
            document.warning( "Empty source file: " + filePath, tokens, 0 );

         compiler = null;
      }
      catch ( x )
      {
         compiler = null;
         throw x;
      }
   };

   /*
    * Path to the current file being compiled, either the initial file sent to
    * the driver, or an \include file.
    */
   this.currentFilePath = function()
   {
      return this.filePaths[0];
   };

   /*
    * Compile an \include file.
    */
   this.compileFile = function( filePath, _tokens, _index )
   {
      if ( compiler != this )
         throw new Error( "*** Internal error: Invalid call to PIDocCompiler.compileFile()" );

      if ( this.filePaths.length > 0 )
      {
         let path = File.extractDrive( filePath ) + File.extractDirectory( filePath );
         if ( path.isEmpty() )
         {
            path = File.extractDrive( this.currentFilePath() ) + File.extractDirectory( this.currentFilePath() );
            if ( !path.endsWith( '/' ) )
               path += '/';
            filePath = path + File.extractNameAndSuffix( filePath );
         }
      }

      filePath = File.fullPath( filePath );

      for ( let i = 0; i < this.filePaths.length; ++i )
         if ( this.filePaths[i] == filePath )
            throw new ParseError( "Circular reference to included file: " + filePath, _tokens, _index );

      document.actionMessage( "Compiling source file: " + filePath );

      this.filePaths.unshift( filePath );
      document.setFilePath( this.currentFilePath() );

      let tokens = this.parse( this.tokenize( this.getTextLines( this.read() ) ) );
      if ( tokens.length > 0 )
      {
         for ( let i = 0; i < tokens.length; )
            if ( tokens[i] instanceof Marker || tokens[i] instanceof Whitespace )
               ++i;
            else
            {
               if ( tokens[i] instanceof Command )
                  i = tokens[i].execute( tokens, i+1 );
               else
                  throw new ParseError( "Expected a command token.", tokens, i );
            }
      }
      else
         document.warning( "Empty source file: " + filePath, tokens, 0 );

      if ( this.filePaths.length > 1 )
      {
         this.filePaths.shift();
         document.setFilePath( this.currentFilePath() );
      }

      return tokens.length > 0;
   };

   /*
    * Text file reader.
    * Reads a text file and returns its contents as a ByteArray.
    */
   this.read = function()
   {
      let f = new File;
      f.openForReading( this.currentFilePath() );
      let buffer = f.read( DataType_ByteArray, f.size );
      f.close();
      return buffer;
   };

   /*
    * Line extractor.
    * Extracts all text lines from a ByteArray and returns them as an array of
    * strings. Removes all line comments.
    */
   this.getTextLines = function( buffer )
   {
      let lines = new Array;
      for ( let bol = 0; ; )
      {
         // Scan end-of-line sequence.
         // Support native EOL sequences on all platforms:
         // UNIX (LF), Windows (CR+LF) and old Mac (CR)
         let n = 1;
         let eol = buffer.linearSearch( 0x0A, bol );  // LF
         if ( eol < 0 )
         {
            eol = buffer.linearSearch( 0x0D, bol );   // CR
            if ( eol < 0 )
               eol = buffer.length;
         }
         else
         {
            if ( eol > 0 && buffer.at( eol-1 ) == 0x0D )   // CR+LF
            {
               --eol;
               n = 2;
            }
         }

         // Remove line comments
         let eeol = eol;
         for ( let p = bol; ; )
         {
            let lcm = buffer.linearSearch( PERCENT, p, eol );
            if ( lcm < 0 )
               break;
            if ( lcm == p || buffer.at( lcm-1 ) != BKSLASH ) // ignore escaped '%'
            {
               eeol = lcm;
               break;
            }
            p = lcm + 1;
         }

         // Add this line to the list, with trailing whitespace removed
         lines.push( buffer.utf8ToString( bol, eeol-bol ).trimRight() );

         // Prepare for the next line
         bol = eol + n;
         if ( bol > buffer.upperBound )
            break;
      }

      return lines;
   };

   function isWhitespace( c )
   {
      return c == SP || c == HT || c == VT || c == FF;
   }

   function isCommandIdChar( c )
   {
      return c >= CHa && c <= CHz || c >= CHA && c <= CHZ || c >= CH0 && c <= CH9 || c == USCORE;
   }

   /*
    * PIDoc Tokenizer.
    * Tokenizes a set of source code lines. Returns a list of tokens, including
    * file and line markers for error localization.
    */
   this.tokenize = function( lines )
   {
      let tokens = new Array;
      tokens.push( new FileMarker( this.currentFilePath() ) );

      let verbatim = false;
      let verbatimPos = 0;
      for ( let i = 0; i < lines.length; ++i )
      {
         tokens.push( new LineMarker( i ) );

         let line = lines[i];
         let token = '';
         for ( let j = 0; j < line.length; )
            switch ( line.charCodeAt( j ) )
            {
            // Number sign '#'
            case NUMBER:
               if ( !verbatim )
                  if ( j == 0 || line.charCodeAt( j-1 ) != BKSLASH )
                     if ( j < line.length && line.charCodeAt( j+1 ) == COLON )
                     {
                        // Start verbatim block operator '#:'
                        verbatim = true;
                        verbatimPos = tokens.length-1;
                        j += 2;
                        break;
                     }
               token += '#';
               ++j;
               break;

            // Colon sign ':'
            case COLON:
               if ( j == 0 || line.charCodeAt( j-1 ) != BKSLASH )
                  if ( j < line.length && line.charCodeAt( j+1 ) == NUMBER )
                  {
                     // End verbatim block operator ':#'
                     if ( !verbatim )
                        throw new ParseError( "Unexpected verbatim block end operator.", tokens, tokens.length-1 );
                     verbatim = false;
                     j += 2;
                     break;
                  }
               token += ':';
               ++j;
               break;

            // White space
            case SP:
            case HT:
            case VT:
            case FF:
               if ( !token.isEmpty() )
               {
                  tokens.push( new TextWord( token ) );
                  token = '';
               }
               for ( let n = 1; ++j < line.length; ++n )
                  if ( !isWhitespace( line.charCodeAt( j ) ) )
                  {
                     tokens.push( new Whitespace( n ) );
                     break;
                  }
               break;

            // Backslash
            case BKSLASH:
               if ( verbatim )
               {
                  token += '\\';
                  ++j;
               }
               else if ( ++j < line.length )
               {
                  if ( isCommandIdChar( line.charCodeAt( j ) ) )
                  {
                     // command specifier
                     if ( !token.isEmpty() )
                     {
                        tokens.push( new TextWord( token ) );
                        token = '';
                     }
                     tokens.push( new CommandSpecifier );
                  }
                  else if ( line.charCodeAt( j ) == BKSLASH )
                  {
                     // escaped backslash
                     token += '\\';
                     ++j;
                  }
                  // else eat backslash
               }
               break;

            // Brackets
            case LCURLY:
            case RCURLY:
            case LSQUARE:
            case RSQUARE:
               if ( !verbatim )
                  if ( j == 0 || line.charCodeAt( j-1 ) != BKSLASH )
                  {
                     if ( !token.isEmpty() )
                     {
                        tokens.push( new TextWord( token ) );
                        token = '';
                     }
                     tokens.push( new Bracket( line.charCodeAt( j ) ) );
                     ++j;
                     break;
                  }
               // else fall through

            // Text words
            default:
               token += line[j];
               ++j;
               break;
            }

         if ( !token.isEmpty() )
            tokens.push( new TextWord( token ) );
      }

      if ( verbatim )
         throw new ParseError( "Missing verbatim block end operator.", tokens, verbatimPos );

      return tokens;
   };

   /*
    * PIDoc Parser.
    * Processes a list of raw tokens (the output of tokenize()) and returns a
    * list of parsed tokens.
    */
   this.parse = function( tokens )
   {
      let items = new Array;
      for ( let i = 0; i < tokens.length; ++i )
      {
         let token = tokens[i];

         if ( token instanceof TextWord ||
              token instanceof Whitespace ||
              token instanceof Marker )
         {
            // Text words
            // Contiguous sequences of whitespace characters
            // File and line markers for exception generation and paragraph control
            items.push( token );
         }
         else if ( token instanceof CommandSpecifier )
         {
            // Commands
            if ( ++i < tokens.length )
               if ( tokens[i] instanceof TextWord )
               {
                  let word = tokens[i].word;
                  let j = 0;
                  while ( ++j < word.length && isCommandIdChar( word.charCodeAt( j ) ) ) {}
                  items.push( new Command( word.substring( 0, j ), tokens, i ) );
                  if ( j < word.length )
                     items.push( new TextWord( word.substring( j ) ) );
               }
               else
                  throw new ParseError( "Expected a command identifier after '\\' token.", tokens, i );
         }
         else if ( token instanceof Bracket )
         {
            if ( token.isBeginParameters() )
            {
               // Command parameters
               let completed = false;
               for ( let j = i; ++j < tokens.length; )
                  if ( tokens[j] instanceof Bracket )
                     if ( tokens[j].isEndParameters() )
                     {
                        items.push( new CommandParameters( tokens, i+1, j ) );
                        i = j;
                        completed = true;
                        break;
                     }
                     else
                        throw new ParseError( "Invalid bracket token inside parameters list: '" + tokens[j].bracket() + "'", tokens, j );
               if ( !completed )
                  throw new ParseError( "Missing right bracket token: ']'", tokens, i );
            }
            else if ( token.isBeginBlock() )
            {
               // Text block
               let count = 1;
               for ( let j = i; ++j < tokens.length; )
                  if ( tokens[j] instanceof Bracket )
                     if ( tokens[j].isEndBlock() )
                     {
                        if ( --count == 0 )
                        {
                           let block = tokens.slice( i+1, j );
                           for ( let k = i; k >= 0; --k )
                              if ( tokens[k] instanceof LineMarker )
                              {
                                 block.unshift( tokens[k].clone() );
                                 break;
                              }
                           block.unshift( new FileMarker( this.currentFilePath() ) );
                           items.push( new TextBlock( this.parse( block ) ) );
                           i = j;
                           break;
                        }
                     }
                     else if ( tokens[j].isBeginBlock() )
                        ++count;
               if ( count != 0 )
                  throw new ParseError( "Missing right bracket token: '}'", tokens, i );
            }
            else
            {
               // Orphan right bracket
               throw new ParseError( "Unexpected right bracket token: '" + token.bracket() + "'", tokens, i );
            }
         }
         else
         {
            throw new Error( "*** Internal Error: Invalid token!" );
         }
      }

      //this.print( items );

      return items;
   };

   // Internal debugging and diagnostics routines

   this.print = function( tokens )
   {
      for ( let i = 0; i < tokens.length; ++i )
         console.writeln( "<raw>" + tokens[i].toString() + "</raw>" );
   };

   this.printXHTML = function( tokens )
   {
      for ( let i = 0; i < tokens.length; )
      {
         let r = tokens[i].toXhtml( "p", tokens, i+1 );
         console.writeln( "<raw>" + r.contents + "</raw>" );
         i = r.nextIndex;
      }
   };
}

PIDocCompiler.prototype = new Object;

/*
 * Global compiler object
 */
var compiler = null;

// ----------------------------------------------------------------------------
// EOF PIDocCompiler.js - Released 2015/07/22 16:40:31 UTC
