// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// PIDocCommands.js - Released 2014/12/09 21:37:52 UTC
// ****************************************************************************
//
// This file is part of PixInsight Documentation Compiler Script version 1.5.4
//
// Copyright (c) 2010-2014 Pleiades Astrophoto S.L.
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

/*
 * PixInsight Documentation Compiler
 *
 * Copyright (C) 2010-2014 Pleiades Astrophoto. All Rights Reserved.
 * Written by Juan Conejero (PTeam)
 *
 * Formal descriptions and implementations of all PIDoc commands.
 */

function MetaCommand( id,                 // command identifier
                      tokenCount,         // number of consumed tokens
                      hasParameters,      // true if the command accepts parameters
                      wantsNewParagraph,  // true if the command forces a paragraph break
                      xhtmlGenerator,     // XHTML contents generator
                      documentGenerator ) // document generator
{
   this.__base__ = Object;
   this.__base__();

   this.id = id;
   this.tokenCount = tokenCount;
   this.hasParameters = hasParameters;
   this.wantsNewParagraph = wantsNewParagraph;
   this.xhtmlGenerator = xhtmlGenerator;
   this.documentGenerator = documentGenerator;

   this.indexOfNextArgument = function( tokens, nextIndex )
   {
      var i = nextIndex;
      while ( i < tokens.length && (tokens[i] instanceof Marker || tokens[i] instanceof Whitespace) )
         ++i;
      return i;
   };

   this.indexOfNextRequiredArgument = function( tokens, nextIndex )
   {
      var i = this.indexOfNextArgument( tokens, nextIndex );
      if ( i == tokens.length )
         throw new ParseError( "\\" + this.id + ": Expected a command argument", tokens, nextIndex-1 );
      return i;
   };
}

MetaCommand.prototype = new Object;

/*
 * Code/Verbatim Parameters.
 */
function CodeParameters( command, parameters, tokens, index )
{
   this.__base__ = Object;
   this.__base__();

   this.mode = "inline";
   this.lang = workingData.highlightCode ? "auto" : "none";

   for ( var i = 0; i < parameters.length; ++i )
      switch ( parameters[i].id )
      {
      case "import":
      case "inline":
         if ( parameters[i].hasValue() )
            throw new ParseError( "The " + parameters[i].id + " parameter takes no value.", tokens, index );
         this.mode = parameters[i].id;
         break;
      case "lang":
         if ( command != "code" )
            throw new ParseError( "Only the \\code command supports language specification parameters.", tokens, index );
         if ( !parameters[i].hasValue() )
            throw new ParseError( "Missing code language specification.", tokens, index );
         this.lang = parameters[i].value;
         if ( this.lang != "none" && this.lang != "auto" && this.lang != "js" && this.lang != "c++" && this.lang != "pmath" )
            throw new ParseError( "Unsupported source code language \'" + this.lang + "\'", tokens, index );
         break;
      default:
         throw new ParseError( "Unknown " + command + " parameter \'" + parameters[i].id + "\'", tokens, index );
      }

   this.toCssSource = function()
   {
      return (this.blockParameters != undefined) ? this.blockParameters.toCssSource() : '';
   };
}

CodeParameters.prototype = new Object;

/*
 * Block element Parameters.
 */
function BlockParameters( command, parameters, tokens, index )
{
   this.__base__ = Object;
   this.__base__();

   this.border = '';
   this.floating = '';
   this.displayMode = '';
   this.marginLeft = '';
   this.marginRight = '';
   this.marginTop = '';
   this.marginBottom = '';
   this.width = '';
   this.height = '';
   this.wrap = '';

   for ( var i = 0; i < parameters.length; ++i )
      switch ( parameters[i].id )
      {
      case "border":
         if ( parameters[i].hasValue() )
            this.border = parameters[i].value;
         else
            this.border = "1px solid black";
         break;
      case "float":
         if ( parameters[i].hasValue() )
            this.floating = parameters[i].value;
         else
            this.floating = "left";
         break;
      case "display":
         if ( !parameters[i].hasValue() )
            throw new ParseError( "Missing value of the display parameter.", tokens, index );
         this.displayMode = parameters[i].value;
         break;
      case "marginleft":
      case "margin_left":
      case "marginLeft": // ### N.B.: All capitalized forms are now deprecated - retained for compatibility
         if ( !parameters[i].hasValue() )
            throw new ParseError( "Missing value of the marginleft parameter.", tokens, index );
         this.marginLeft = parameters[i].value;
         break;
      case "marginright":
      case "margin_right":
      case "marginRight":
         if ( !parameters[i].hasValue() )
            throw new ParseError( "Missing value of the marginright parameter.", tokens, index );
         this.marginRight = parameters[i].value;
         break;
      case "marginhorz":
      case "margin_horz":
      case "marginHorz":
         if ( !parameters[i].hasValue() )
            throw new ParseError( "Missing value of the marginhorz parameter.", tokens, index );
         this.marginLeft = this.marginRight = parameters[i].value;
         break;
      case "margintop":
      case "margin_top":
      case "marginTop":
         if ( !parameters[i].hasValue() )
            throw new ParseError( "Missing value of the margintop parameter.", tokens, index );
         this.marginTop = parameters[i].value;
         break;
      case "marginbottom":
      case "margin_bottom":
      case "marginBottom":
         if ( !parameters[i].hasValue() )
            throw new ParseError( "Missing value of the marginbottom parameter.", tokens, index );
         this.marginBottom = parameters[i].value;
         break;
      case "marginvert":
      case "margin_vert":
      case "marginVert":
         if ( !parameters[i].hasValue() )
            throw new ParseError( "Missing value of the marginvert parameter.", tokens, index );
         this.marginTop = this.marginBottom = parameters[i].value;
         break;
      case "margin":
         if ( !parameters[i].hasValue() )
            throw new ParseError( "Missing value of the margin parameter.", tokens, index );
         this.marginLeft = this.marginRight = this.marginTop = this.marginBottom = parameters[i].value;
         break;
      case "size":
         if ( !parameters[i].hasValue() )
            throw new ParseError( "Missing value of the size parameter.", tokens, index );
         this.width = this.height = parameters[i].value;
         break;
      case "width":
         if ( !parameters[i].hasValue() )
            throw new ParseError( "Missing value of the width parameter.", tokens, index );
         this.width = parameters[i].value;
         break;
      case "height":
         if ( !parameters[i].hasValue() )
            throw new ParseError( "Missing value of the height parameter.", tokens, index );
         this.height = parameters[i].value;
         break;
      case "wrap":
         if ( parameters[i].hasValue() )
            throw new ParseError( "The wrap parameter takes no value.", tokens, index );
         this.wrap = "normal";
         break;
      case "nowrap":
      case "no_wrap":
         if ( parameters[i].hasValue() )
            throw new ParseError( "The nowrap parameter takes no value.", tokens, index );
         this.wrap = "nowrap";
         break;
      default:
         throw new ParseError( "Unknown " + command + " parameter '" + parameters[i].id + "'", tokens, index );
      }

   this.toCssSource = function()
   {
      var css = '';
      if ( !this.border.isEmpty() )
         css += "border:" + this.border + ";";
      if ( !this.floating.isEmpty() )
         css += "float:" + this.floating + ";";
      if ( !this.displayMode.isEmpty() )
         css += "display:" + this.displayMode + ";";
      if ( !this.marginLeft.isEmpty() )
         css += "margin-left:" + this.marginLeft + ";";
      if ( !this.marginRight.isEmpty() )
         css += "margin-right:" + this.marginRight + ";";
      if ( !this.marginTop.isEmpty() )
         css += "margin-top:" + this.marginTop + ";";
      if ( !this.marginBottom.isEmpty() )
         css += "margin-bottom:" + this.marginBottom + ";";
      if ( !this.width.isEmpty() )
         css += "width:" + this.width + ";";
      if ( !this.height.isEmpty() )
         css += "height:" + this.height + ";";
      if ( !this.wrap.isEmpty() )
         css += "white-space:" + this.wrap + ";";
      return css;
   };
}

BlockParameters.prototype = new Object;

/*
 * List Parameters.
 */
function ListParameters( parameters, tokens, index )
{
   this.__base__ = Object;
   this.__base__();

   this.listType = 'unordered';
   this.startingNumber = 1;
   this.spaced = false;
   this.blockParameters = undefined;

   var block = new Array;
   for ( var i = 0; i < parameters.length; ++i )
      switch ( parameters[i].id )
      {
      case "unordered":
         if ( parameters[i].hasValue() )
            throw new ParseError( "The unordered parameter takes no value.", tokens, index );
         this.listType = "unordered";
         break;
      case "ordered":
         if ( parameters[i].hasValue() )
            this.startingNumber = parseInt( parameters[i].value );
         else
            this.startingNumber = 1;
         this.listType = "ordered";
         break;
      case "spaced":
         if ( parameters[i].hasValue() )
            throw new ParseError( "The spaced parameter takes no value.", tokens, index );
         this.spaced = true;
         break;
      default:
         block.push( parameters[i] );
         break;
      }
   if ( block.length > 0 )
      this.blockParameters = new BlockParameters( "list", block, tokens, index );

   this.toCssSource = function()
   {
      return (this.blockParameters != undefined) ? this.blockParameters.toCssSource() : '';
   };
}

ListParameters.prototype = new Object;

/*
 * Table Parameters.
 */
function TableParameters( parameters, tokens, index )
{
   this.__base__ = Object;
   this.__base__();

   this.headers = 0;
   this.caption = false;
   this.numbered = workingData.numberAllTables;
   this.name = undefined;
   this.blockParameters = undefined;

   var block = new Array;
   for ( var i = 0; i < parameters.length; ++i )
      switch ( parameters[i].id )
      {
      case "header":
         if ( parameters[i].hasValue() )
            this.headers = parseInt( parameters[i].value );
         else
            this.headers = 1;
         break;
      case "caption":
         if ( parameters[i].hasValue() )
            throw new ParseError( "The caption parameter takes no value.", tokens, index );
         this.caption = true;
         break;
      case "numbered":
         if ( parameters[i].hasValue() )
         {
            this.name = parameters[i].value.trim();
            if ( this.name.isEmpty() )
               throw new ParseError( "Missing table identifier.", tokens, index );
            if ( !this.name.isValidId() )
               throw new ParseError( "Invalid table identifier.", tokens, index );
         }
         this.numbered = true;
         break;
      case "unnumbered":
         if ( parameters[i].hasValue() )
            throw new ParseError( "The unnumbered parameter takes no value.", tokens, index );
         this.numbered = false;
         break;
      default:
         block.push( parameters[i] );
         break;
      }
   if ( block.length > 0 )
      this.blockParameters = new BlockParameters( "table", block, tokens, index );

   this.toCssSource = function()
   {
      return (this.blockParameters != undefined) ? this.blockParameters.toCssSource() : '';
   };
}

TableParameters.prototype = new Object;

/*
 * Parameters of the \vs command (vertical space).
 */
function SpacingParameters( parameters, tokens, index )
{
   this.__base__ = Object;
   this.__base__();

   this.length = undefined;

   if ( parameters.length > 1 )
      throw new ParseError( "Too many parameters in spacing command.", tokens, index );

   if ( parameters.length > 0 )
      switch ( parameters[0].id )
      {
      case "length":
         if ( !parameters[0].hasValue() )
            throw new ParseError( "Missing length parameter value.", tokens, index );
         this.length = parameters[0].value;
         break;
      default:
         throw new ParseError( "Unknown/invalid spacing command parameter \'" + parameters[0].id + "\'", tokens, index );
      }
}

/*
 * Parameters of the \imageselect command.
 */
function ImageSelectParameters( parameters, tokens, index )
{
   this.__base__ = Object;
   this.__base__();

   this.menuPos = "bottom";
   this.blockParameters = undefined;

   var block = new Array;
   for ( var i = 0; i < parameters.length; ++i )
      switch ( parameters[i].id )
      {
      case "menupos":
      case "menu_pos":
      case "menuPos":
         if ( !parameters[i].hasValue() )
            throw new ParseError( "Missing menupos parameter value.", tokens, index );
         switch ( parameters[i].value )
         {
         case "left":
         case "right":
         case "bottom":
         case "top":
            this.menuPos = parameters[i].value;
            break;
         default:
            throw new ParseError( "Unknown/invalid menupos parameter value \'" + parameters[i].value + "\'", tokens, index );
         }
         break;
      default:
         block.push( parameters[i] );
         break;
      }
   if ( block.length > 0 )
      this.blockParameters = new BlockParameters( "imageselect", block, tokens, index );

   this.toCssSource = function()
   {
      return (this.blockParameters != undefined) ? this.blockParameters.toCssSource() : '';
   };
}

ImageSelectParameters.prototype = new Object;

/*
 * Parameters of the \equation and \im commands.
 */
function EquationParameters( command, parameters, tokens, index )
{
   this.__base__ = Object;
   this.__base__();

   this.mode = "inline";
   this.numbered = workingData.numberAllEquations;
   this.name = undefined;
   this.scale = 1.0;
   this.blockParameters = undefined;

   var block = new Array;
   for ( var i = 0; i < parameters.length; ++i )
      switch ( parameters[i].id )
      {
      case "import":
      case "inline":
         if ( command != "equation" )
            throw new ParseError( "The " + parameters[i].id + " parameter is not applicable to inline equations.", tokens, index );
         if ( parameters[i].hasValue() )
            throw new ParseError( "The " + parameters[i].id + " parameter takes no value.", tokens, index );
         this.mode = parameters[i].id;
         break;
      case "numbered":
         if ( command != "equation" )
            throw new ParseError( "The numbered parameter is not applicable to inline equations.", tokens, index );
         if ( parameters[i].hasValue() )
         {
            this.name = parameters[i].value.trim();
            if ( this.name.isEmpty() )
               throw new ParseError( "Missing equation identifier.", tokens, index );
            if ( !this.name.isValidId() )
               throw new ParseError( "Invalid equation identifier.", tokens, index );
         }
         this.numbered = true;
         break;
      case "unnumbered":
         if ( parameters[i].hasValue() )
            throw new ParseError( "The unnumbered parameter takes no value.", tokens, index );
         this.numbered = false;
         break;
      case "scale":
         if ( !parameters[i].hasValue() )
            throw new ParseError( "Missing scale parameter value.", tokens, index );
         this.scale = parseFloat( parameters[i].value );
         if ( !isFinite( this.scale ) || this.scale <= 0 || this.scale > 10 )
            throw new ParseError( "Invalid scale parameter value \'" + parameters[i].value + "\'", tokens, index );
         break;
      default:
         block.push( parameters[i] );
         break;
      }
   if ( block.length > 0 )
      this.blockParameters = new BlockParameters( "equation", block, tokens, index );

   this.toCssSource = function()
   {
      return (this.blockParameters != undefined) ? this.blockParameters.toCssSource() : '';
   };
}

EquationParameters.prototype = new Object;

/*
 * Parameters of the \figure command.
 */
function FigureParameters( command, parameters, tokens, index )
{
   this.__base__ = Object;
   this.__base__();

   this.numbered = workingData.numberAllFigures;
   this.name = undefined;
   this.blockParameters = undefined;

   var block = new Array;
   for ( var i = 0; i < parameters.length; ++i )
      switch ( parameters[i].id )
      {
      case "numbered":
         if ( parameters[i].hasValue() )
         {
            this.name = parameters[i].value.trim();
            if ( this.name.isEmpty() )
               throw new ParseError( "Missing figure identifier.", tokens, index );
            if ( !this.name.isValidId() )
               throw new ParseError( "Invalid figure identifier.", tokens, index );
         }
         this.numbered = true;
         break;
      case "unnumbered":
         if ( parameters[i].hasValue() )
            throw new ParseError( "The unnumbered parameter takes no value.", tokens, index );
         this.numbered = false;
         break;
      default:
         block.push( parameters[i] );
         break;
      }
   if ( block.length > 0 )
      this.blockParameters = new BlockParameters( "figure", block, tokens, index );

   this.toCssSource = function()
   {
      return (this.blockParameters != undefined) ? this.blockParameters.toCssSource() : '';
   };
}

FigureParameters.prototype = new Object;

/*
 * Parameters of the \property and \staticproperty commands.
 */
function PropertyParameters( command, parameters, tokens, index )
{
   this.__base__ = Object;
   this.__base__();

   this.label = "";
   this.readOnly = false;

   for ( var i = 0; i < parameters.length; ++i )
   {
      switch ( parameters[i].id )
      {
      case "label":
         if ( parameters[i].hasValue() )
            this.label = parameters[i].value.trim();
         if ( this.label.isEmpty() )
            throw new ParseError( "Missing label name.", tokens, index );
         break;
      case "readonly":
      case "read_only":
         if ( command != "property" && command != "staticproperty" )
            throw new ParseError( "The readonly parameter can only be used with the \\property and \\staticproperty commands.", tokens, index );
         if ( parameters[i].hasValue() )
            throw new ParseError( "The readonly parameter takes no value.", tokens, index );
         this.readOnly = true;
         break;
      case "readwrite":
      case "read_write":
         if ( command != "property" && command != "staticproperty" )
            throw new ParseError( "The readwrite parameter can only be used with the \\property and \\staticproperty commands.", tokens, index );
         if ( parameters[i].hasValue() )
            throw new ParseError( "The readwrite parameter takes no value.", tokens, index );
         this.readOnly = false;
         break;
      default:
         throw new ParseError( "Unknown/invalid parameter '" + parameters[i].id + "' of the \\" + command + " command.", tokens, index );
      }
   }
}

PropertyParameters.prototype = new Object;

/*
 * Parameters of the \pragma command.
 */
function PragmaParameters( parameters, tokens, index )
{
   this.__base__ = Object;
   this.__base__();

   for ( var i = 0; i < parameters.length; ++i )
   {
      var takesValue = false;
      switch ( parameters[i].id )
      {
      case "basedir":
      case "base_dir":
         takesValue = true;
         if ( parameters[i].hasValue() )
            workingData.baseDirectory = parameters[i].value.trim();
         else
            workingData.baseDirectory = ""; // = integrate with Core app.
         break;
      case "generate":
         workingData.generateOutput = true;
         break;
      case "nogenerate":
      case "no_generate":
         workingData.generateOutput = false;
         break;
      case "html5":
         workingData.generateHTML5 = true;
         break;
      case "xhtml":
         workingData.generateHTML5 = false;
         break;
      case "equations":
         workingData.renderEquations = true;
         break;
      case "noequations":
      case "no_equations":
         workingData.renderEquations = false;
         break;
      case "highlightcode":
      case "highlight_code":
         workingData.highlightCode = true;
         break;
      case "nohighlightcode":
      case "no_highlight_code":
         workingData.highlightCode = false;
         break;
      case "numberequations":
      case "number_equations":
         workingData.numberAllEquations = true;
         break;
      case "nonumberequations":
      case "no_number_equations":
         workingData.numberAllEquations = false;
         break;
      case "numberfigures":
      case "number_figures":
         workingData.numberAllFigures = true;
         break;
      case "nonumberfigures":
      case "no_number_figures":
         workingData.numberAllFigures = false;
         break;
      case "numbertables":
      case "number_tables":
         workingData.numberAllTables = true;
         break;
      case "nonumbertables":
      case "no_number_tables":
         workingData.numberAllTables = false;
         break;
      case "backup":
         workingData.backupExistingFiles = true;
         break;
      case "nobackup":
      case "no_backup":
         workingData.backupExistingFiles = false;
         break;
      case "errorwarnings":
      case "error_warnings":
         workingData.treatWarningsAsErrors = true;
         break;
      case "noerrorwarnings":
      case "no_error_warnings":
         workingData.treatWarningsAsErrors = false;
         break;
      default:
         throw new ParseError( "Unknown/invalid parameter '" + parameters[i].id + "' of the \\pragma command.", tokens, index );
      }

      if ( !takesValue )
         if ( parameters[i].hasValue() )
            throw new ParseError( "The " + parameters[i].id + " parameter takes no value.", tokens, index );
   }
}

PragmaParameters.prototype = new Object;

/*
 * Parameters of the \make command.
 */
function MakeParameters( parameters, tokens, index )
{
   this.__base__ = Object;
   this.__base__();

   for ( var i = 0; i < parameters.length; ++i )
   {
      switch ( parameters[i].id )
      {
      case "noauthors":
      case "no_authors":
         document.noAuthors = true;
         break;
      case "nocategories":
      case "no_categories":
         document.noCategories = true;
         break;
      case "nokeywords":
      case "no_keywords":
         document.noKeywords = true;
         break;
      case "notoc":
      case "no_toc":
         document.noToc = true;
         break;
      case "nocopyright":
      case "no_copyright":
         document.noToc = true;
         break;
      default:
         throw new ParseError( "Unknown/invalid parameter '" + parameters[i].id + "' of the \\make command.", tokens, index );
      }

      // No parameter of \make takes a value
      if ( parameters[i].hasValue() )
         throw new ParseError( "The " + parameters[i].id + " parameter takes no value.", tokens, index );
   }
}

MakeParameters.prototype = new Object;

MetaCommand.commands = [

   // MetaCommand constructor parameters:
   //
   //    id, tokenCount, hasParameters, wantsNewParagraph, xhtmlGenerator, documentGenerator
   //
   // Generator parameters:
   //
   //    tokens - The token list being compiled
   //    i      - The current token index
   //    p      - The index p > 0 of the parameters token

   // -------------------------------------------------------------------------
   // Document Generators
   // -------------------------------------------------------------------------

   new MetaCommand( "documentclass", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         document.setClass( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "title", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( "h1", tokens, i+1 );
         document.setTitle( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "author", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         document.addAuthor( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "copyright", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( "p", tokens, i+1 );
         document.setCopyright( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "keyword", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         document.addKeyword( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "keywords", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         var keywords = r.contents.split( ',' );
         for ( var j = 0; j < keywords.length; ++j )
            document.addKeyword( keywords[j], tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "brief", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( "p", tokens, i+1 );
         document.setBrief( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "abstract", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         document.setCurrentSection( this.id );
         var r = tokens[i].toXhtml( "p", tokens, i+1 );
         document.setSummary( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "introduction", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         document.setCurrentSection( this.id );
         var r = tokens[i].toXhtml( "p", tokens, i+1 );
         document.setIntroduction( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "description", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         document.setCurrentSection( this.id );
         var r = tokens[i].toXhtml( "p", tokens, i+1 );
         document.setDescription( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "methods", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         document.setCurrentSection( this.id );
         var r = tokens[i].toXhtml( "p", tokens, i+1 );
         document.setMethods( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "results", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         document.setCurrentSection( this.id );
         var r = tokens[i].toXhtml( "p", tokens, i+1 );
         document.setResults( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "discussion", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         document.setCurrentSection( this.id );
         var r = tokens[i].toXhtml( "p", tokens, i+1 );
         document.setDiscussion( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "section", 2, false, false,
      undefined,
      function( tokens, i, p )
      {
         var i0 = i-1;
         var r1 = tokens[i].toXhtml( '', tokens, i+1 );
         i = this.indexOfNextRequiredArgument( tokens, r1.nextIndex );
         document.setCurrentSection( this.id );
         var r2 = tokens[i].toXhtml( "p", tokens, i+1 );
         document.addSection( r1.contents, r2.contents, tokens, i0 );
         return r2.nextIndex;
      } ),

   new MetaCommand( "acknowledgments", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         document.setCurrentSection( this.id );
         var r = tokens[i].toXhtml( "p", tokens, i+1 );
         document.setAcknowledgments( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "reference", 2, false, false,
      undefined,
      function( tokens, i, p )
      {
         var i0 = i-1;
         var r1 = tokens[i].toPlainText( tokens, i+1 );
         i = this.indexOfNextRequiredArgument( tokens, r1.nextIndex );
         var r2 = tokens[i].toXhtml( "", tokens, i+1 );
         document.addReference( r1.contents, r2.contents, tokens, i0 );
         return r2.nextIndex;
      } ),

   new MetaCommand( "relatedtool", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         document.addRelatedTool( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "relatedtools", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         var tools = r.contents.split( ',' );
         for ( var j = 0; j < tools.length; ++j )
            document.addRelatedTool( tools[j], tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "relatedscript", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         document.addRelatedScript( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "relatedscripts", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         var scripts = r.contents.split( ',' );
         for ( var j = 0; j < scripts.length; ++j )
            document.addRelatedScript( scripts[j], tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "relatedobject", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         document.addRelatedObject( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "relatedobjects", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         var objects = r.contents.split( ',' );
         for ( var j = 0; j < objects.length; ++j )
            document.addRelatedObject( objects[j], tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "relateddocument", 2, false, false,
      undefined,
      function( tokens, i, p )
      {
         var i0 = i-1;
         var r1 = tokens[i].toUri( tokens, i+1 );
         i = this.indexOfNextRequiredArgument( tokens, r1.nextIndex );
         var r2 = tokens[i].toXhtml( '', tokens, i+1 );
         document.addRelatedDocument( r1.contents, r2.contents, tokens, i0 );
         return r2.nextIndex;
      } ),

   new MetaCommand( "related", 2, false, false,
      undefined,
      function( tokens, i, p )
      {
         var i0 = i-1;
         var r1 = tokens[i].toUri( tokens, i+1 );
         i = this.indexOfNextRequiredArgument( tokens, r1.nextIndex );
         var r2 = tokens[i].toXhtml( '', tokens, i+1 );
         document.addRelatedResource( r1.contents, r2.contents, tokens, i0 );
         return r2.nextIndex;
      } ),

   new MetaCommand( "inherits", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         var objects = r.contents.split( ',' );
         for ( var j = 0; j < objects.length; ++j )
            document.addInherits( objects[j], tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "inherited", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         var objects = r.contents.split( ',' );
         for ( var j = 0; j < objects.length; ++j )
            document.addInherited( objects[j], tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "tool", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         document.setToolId( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "module", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         document.setModuleId( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "category", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         document.addCategory( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "categories", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         var categories = r.contents.split( ',' );
         for ( var j = 0; j < categories.length; ++j )
            document.addCategory( categories[j], tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "script", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         document.setScriptId( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "usage", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         document.setCurrentSection( this.id );
         var r = tokens[i].toXhtml( "p", tokens, i+1 );
         document.setUsage( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "parameter", 2, false, false,
      undefined,
      function( tokens, i, p )
      {
         var i0 = i-1;
         var r1 = tokens[i].toXhtml( '', tokens, i+1 );
         i = this.indexOfNextRequiredArgument( tokens, r1.nextIndex );
         var r2 = tokens[i].toXhtml( "p", tokens, i+1 );
         document.addParameter( r1.contents, r2.contents, tokens, i0 );
         return r2.nextIndex;
      } ),

   new MetaCommand( "object", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         document.setObjectId( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "required", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         document.addRequired( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "property", 2, true, false,
      undefined,
      function( tokens, i, p )
      {
         var label = "";
         var readOnly = false;
         if ( p > 0 )
         {
            var parameters = new PropertyParameters( "property", tokens[p].parameters, tokens, i );
            label = parameters.label;
            readOnly = parameters.readOnly;
         }
         var i0 = i-1;
         var r1 = tokens[i].toPlainText( tokens, i+1 );
         i = this.indexOfNextRequiredArgument( tokens, r1.nextIndex );
         var r2 = tokens[i].toXhtml( "p", tokens, i+1 );
         document.addProperty( r1.contents, r2.contents, label, readOnly, tokens, i0 );
         return r2.nextIndex;
      } ),

   new MetaCommand( "staticproperty", 2, true, false,
      undefined,
      function( tokens, i, p )
      {
         var label = "";
         var readOnly = false;
         if ( p > 0 )
         {
            var parameters = new PropertyParameters( "staticproperty", tokens[p].parameters, tokens, i );
            label = parameters.label;
            readOnly = parameters.readOnly;
         }
         var i0 = i-1;
         var r1 = tokens[i].toPlainText( tokens, i+1 );
         i = this.indexOfNextRequiredArgument( tokens, r1.nextIndex );
         var r2 = tokens[i].toXhtml( "p", tokens, i+1 );
         document.addStaticProperty( r1.contents, r2.contents, label, readOnly, tokens, i0 );
         return r2.nextIndex;
      } ),

   new MetaCommand( "eventhandler", 2, true, false,
      undefined,
      function( tokens, i, p )
      {
         var label = "";
         if ( p > 0 )
         {
            var parameters = new PropertyParameters( "eventhandler", tokens[p].parameters, tokens, i );
            label = parameters.label;
         }
         var i0 = i-1;
         var r1 = tokens[i].toPlainText( tokens, i+1 );
         i = this.indexOfNextRequiredArgument( tokens, r1.nextIndex );
         var r2 = tokens[i].toXhtml( "p", tokens, i+1 );
         document.addEventHandler( r1.contents, r2.contents, label, tokens, i0 );
         return r2.nextIndex;
      } ),

   new MetaCommand( "constructor", 2, true, false,
      undefined,
      function( tokens, i, p )
      {
         var label = "";
         if ( p > 0 )
         {
            var parameters = new PropertyParameters( "constructor", tokens[p].parameters, tokens, i );
            label = parameters.label;
         }
         var i0 = i-1;
         var r1 = tokens[i].toPlainText( tokens, i+1 );
         i = this.indexOfNextRequiredArgument( tokens, r1.nextIndex );
         var r2 = tokens[i].toXhtml( "p", tokens, i+1 );
         document.addConstructor( r1.contents, r2.contents, label, tokens, i0 );
         return r2.nextIndex;
      } ),

   new MetaCommand( "method", 2, true, false,
      undefined,
      function( tokens, i, p )
      {
         var label = "";
         if ( p > 0 )
         {
            var parameters = new PropertyParameters( "method", tokens[p].parameters, tokens, i );
            label = parameters.label;
         }
         var i0 = i-1;
         var r1 = tokens[i].toPlainText( tokens, i+1 );
         i = this.indexOfNextRequiredArgument( tokens, r1.nextIndex );
         var r2 = tokens[i].toXhtml( "p", tokens, i+1 );
         document.addMethod( r1.contents, r2.contents, label, tokens, i0 );
         return r2.nextIndex;
      } ),

   new MetaCommand( "staticmethod", 2, true, false,
      undefined,
      function( tokens, i, p )
      {
         var label = "";
         if ( p > 0 )
         {
            var parameters = new PropertyParameters( "staticmethod", tokens[p].parameters, tokens, i );
            label = parameters.label;
         }
         var i0 = i-1;
         var r1 = tokens[i].toPlainText( tokens, i+1 );
         i = this.indexOfNextRequiredArgument( tokens, r1.nextIndex );
         var r2 = tokens[i].toXhtml( "p", tokens, i+1 );
         document.addStaticMethod( r1.contents, r2.contents, label, tokens, i0 );
         return r2.nextIndex;
      } ),

   new MetaCommand( "constant", 2, true, false,
      undefined,
      function( tokens, i, p )
      {
         var label = "";
         if ( p > 0 )
         {
            var parameters = new PropertyParameters( "constant", tokens[p].parameters, tokens, i );
            label = parameters.label;
         }
         var i0 = i-1;
         var r1 = tokens[i].toPlainText( tokens, i+1 );
         i = this.indexOfNextRequiredArgument( tokens, r1.nextIndex );
         var r2 = tokens[i].toXhtml( "p", tokens, i+1 );
         document.addConstant( r1.contents, r2.contents, label, tokens, i0 );
         return r2.nextIndex;
      } ),

   new MetaCommand( "predefined", 2, true, false,
      undefined,
      function( tokens, i, p )
      {
         var label = "";
         if ( p > 0 )
         {
            var parameters = new PropertyParameters( "predefined", tokens[p].parameters, tokens, i );
            label = parameters.label;
         }
         var i0 = i-1;
         var r1 = tokens[i].toPlainText( tokens, i+1 );
         i = this.indexOfNextRequiredArgument( tokens, r1.nextIndex );
         var r2 = tokens[i].toXhtml( "p", tokens, i+1 );
         document.addDefine( r1.contents, r2.contents, label, tokens, i0 );
         return r2.nextIndex;
      } ),

   new MetaCommand( "document", 1, false, false,
      undefined,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         document.setDocumentId( r.contents, tokens, i-1 );
         return r.nextIndex;
      } ),

   new MetaCommand( "pragma", 0, true, false,
      undefined,
      function( tokens, i, p )
      {
         if ( p > 0 )
            new PragmaParameters( tokens[p].parameters, tokens, i-1 );
         else
            document.warning( "\\pragma command without parameters ignored." );
         return i;
      } ),

   new MetaCommand( "make", 0, true, false,
      undefined,
      function( tokens, i, p )
      {
         if ( p > 0 )
            new MakeParameters( tokens[p].parameters, tokens, i-1 );
         document.make( tokens, i );
         return i;
      } ),

   // -------------------------------------------------------------------------
   // Content Generators
   // -------------------------------------------------------------------------

   new MetaCommand( "label", 1, false, false,
      function( tokens, i, parameters )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         var label = r.contents.trim();
         document.addLabel( label, tokens, i );
         return new Contents( "<a name=\"" + label + "\"></a>",
                              r.nextIndex );
      },
      undefined ),

   new MetaCommand( "lref", 2, false, false,
      function( tokens, i, p )
      {
         var r1 = tokens[i].toUri( tokens, i+1 );
         var label = r1.contents.trim();
         document.addLabelReference( label, tokens, i );
         i = this.indexOfNextRequiredArgument( tokens, r1.nextIndex );
         var r2 = tokens[i].toXhtml( '', tokens, i+1 );
         return new Contents( "<a href=\"#" + label + "\">" + r2.contents + "</a>",
                              r2.nextIndex );
      },
      undefined ),

   new MetaCommand( "tref", 2, false, false,
      function( tokens, i, p )
      {
         var r1 = tokens[i].toUri( tokens, i+1 );
         var toolId = r1.contents.trim();
         if ( !document.toolDocumentExists( toolId ) )
            document.warning( "Reference to nonexistent tool document: " + toolId, tokens, i );
         i = this.indexOfNextRequiredArgument( tokens, r1.nextIndex );
         var r2 = tokens[i].toXhtml( '', tokens, i+1 );
         var toolUri = "../../tools/" + toolId + "/" + toolId + ".html";
         return new Contents( "<a href=\"" + toolUri.encodeWhitespace() + "\" title=\"" + toolUri + "\">" + r2.contents + "</a>",
                              r2.nextIndex );
      },
      undefined ),

   new MetaCommand( "sref", 2, false, false,
      function( tokens, i, p )
      {
         var r1 = tokens[i].toUri( tokens, i+1 );
         var scriptId = r1.contents.trim();
         if ( !document.scriptDocumentExists( scriptId ) )
            document.warning( "Reference to nonexistent script document: " + scriptId, tokens, i );
         i = this.indexOfNextRequiredArgument( tokens, r1.nextIndex );
         var r2 = tokens[i].toXhtml( '', tokens, i+1 );
         var scriptUri = "../../scripts/" + scriptId + "/" + scriptId + ".html";
         return new Contents( "<a href=\"" + scriptUri.encodeWhitespace() + "\" title=\"" + scriptUri + "\">" + r2.contents + "</a>",
                              r2.nextIndex );
      },
      undefined ),

   new MetaCommand( "dref", 2, false, false,
      function( tokens, i, p )
      {
         var r1 = tokens[i].toUri( tokens, i+1 );
         var docId = r1.contents.trim();
         if ( !document.genericDocumentExists( docId ) )
            document.warning( "Reference to nonexistent document: " + docId, tokens, i );
         i = this.indexOfNextRequiredArgument( tokens, r1.nextIndex );
         var r2 = tokens[i].toXhtml( '', tokens, i+1 );
         var docUri = "../../docs/" + docId + "/" + docId + ".html";
         return new Contents( "<a href=\"" + docUri.encodeWhitespace() + "\" title=\"" + docUri + "\">" + r2.contents + "</a>",
                              r2.nextIndex );
      },
      undefined ),

   new MetaCommand( "xref", 2, false, false,
      function( tokens, i, p )
      {
         var r1 = tokens[i].toUri( tokens, i+1 );
         i = this.indexOfNextRequiredArgument( tokens, r1.nextIndex );
         var r2 = tokens[i].toXhtml( '', tokens, i+1 );
         var uri = r1.contents.trim();
         return new Contents( "<a href=\"" + uri.encodeWhitespace() + "\" title=\"" + uri + "\">" + r2.contents + "</a>",
                              r2.nextIndex );
      },
      undefined ),

   new MetaCommand( "group", 1, true, true,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( "p", tokens, i+1 );
         var contents = "\n<div class=\"pidoc_group\""
         if ( p > 0 )
         {
            var parameters = new BlockParameters( this.id, tokens[p].parameters, tokens, i );
            var css = parameters.toCssSource();
            if ( !css.isEmpty() )
               contents += " style=\"" + css + "\"";
         }
         contents += ">\n";
         contents += r.contents;
         contents += "</div>\n";
         return new Contents( contents, r.nextIndex );
      },
      undefined ),

   new MetaCommand( "block", 1, true, true,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( "p", tokens, i+1 );
         var contents = "\n<div"
         if ( p > 0 )
         {
            var parameters = new BlockParameters( this.id, tokens[p].parameters, tokens, i );
            var css = parameters.toCssSource();
            if ( !css.isEmpty() )
               contents += " style=\"" + css + "\"";
         }
         contents += ">\n";
         contents += r.contents;
         contents += "</div>\n";
         return new Contents( contents, r.nextIndex );
      },
      undefined ),

   new MetaCommand( "left", 1, false, true,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( "p", tokens, i+1 );
         return new Contents( "\n<div style=\"text-align:left;\">\n" + r.contents + "</div>\n",
                              r.nextIndex );
      },
      undefined ),

   new MetaCommand( "center", 1, false, true,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( "p", tokens, i+1 );
         return new Contents( "\n<div style=\"text-align:center;\">\n" + r.contents + "</div>\n",
                              r.nextIndex );
      },
      undefined ),

   new MetaCommand( "right", 1, false, true,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( "p", tokens, i+1 );
         return new Contents( "\n<div style=\"text-align:right;\">\n" + r.contents + "</div>\n",
                              r.nextIndex );
      },
      undefined ),

   new MetaCommand( "subsection", 2, true, true,
      function( tokens, i, p )
      {
         var r1 = tokens[i].toXhtml( '', tokens, i+1 );
         i = this.indexOfNextRequiredArgument( tokens, r1.nextIndex );
         var r2 = tokens[i].toXhtml( "p", tokens, i+1 );
         var label = document.nextSubsectionLabel();
         document.addSubsection( r1.contents, label, tokens, i );
         return new Contents( "<a name=\"" + label + "\"></a>\n" +
                              "<div class=\"pidoc_subsection\">\n" +
                              "   <h4 class=\"pidoc_subsectionTitle\">" + r1.contents + "</h4>\n" +
                              r2.contents +
                              "</div>\n\n",
                              r2.nextIndex );
      },
      undefined ),

   new MetaCommand( "division", 2, true, true,
      function( tokens, i, p )
      {
         var r1 = tokens[i].toXhtml( '', tokens, i+1 );
         i = this.indexOfNextRequiredArgument( tokens, r1.nextIndex );
         var r2 = tokens[i].toXhtml( "p", tokens, i+1 );
         return new Contents( "<h5 class=\"pidoc_subsectionTitle\">" + r1.contents + "</h5>\n" +
                              r2.contents +
                              "\n\n",
                              r2.nextIndex );
      },
      undefined ),

   new MetaCommand( "verbatim", 1, true, true,
      function( tokens, i, p )
      {
         var mode = "inline";
         if ( p > 0 )
         {
            var parameters = new CodeParameters( this.id, tokens[p].parameters, tokens, i );
            mode = parameters.mode;
         }
         switch ( mode )
         {
         default: // ?!
         case "inline":
            var r = tokens[i].toPlainText( tokens, i+1 );
            return new Contents( "\n<pre>" + r.contents.toXhtml().trimRight() + "</pre>\n\n",
                                 r.nextIndex );
         case "import":
            var r = tokens[i].toUri( tokens, i+1 );
            var filePath = document.fullFilePath( r.contents.trim() );
            try
            {
               var f = new File;
               f.openForReading( filePath );
               var buffer = f.read( DataType_ByteArray, f.size );
               f.close();
               return new Contents( "\n<pre>" + buffer.utf8ToString().toXhtml().trimRight() + "</pre>\n\n",
                                    r.nextIndex );
            }
            catch ( x )
            {
               throw new ParseError( x.message, tokens, i );
            }
         }
      },
      undefined ),

   new MetaCommand( "code", 1, true, true,
      function( tokens, i, p )
      {
         var mode = "inline";
         var lang = workingData.highlightCode ? "auto" : "none";
         if ( p > 0 )
         {
            var parameters = new CodeParameters( this.id, tokens[p].parameters, tokens, i );
            mode = parameters.mode;
            lang = parameters.lang;
         }
         var code = "";
         var suffix = ""; // for lang:auto
         switch ( mode )
         {
         default: // ?!
         case "inline":
            var r = tokens[i].toPlainText( tokens, i+1 );
            code = r.contents;
            break;
         case "import":
            var r = tokens[i].toUri( tokens, i+1 );
            var filePath = document.fullFilePath( r.contents.trim() );
            suffix = File.extractSuffix( filePath );
            try
            {
               var f = new File;
               f.openForReading( filePath );
               var buffer = f.read( DataType_ByteArray, f.size );
               f.close();
               code = buffer.utf8ToString();
            }
            catch ( x )
            {
               throw new ParseError( x.message, tokens, i );
            }
            break;
         }

         if ( lang == "auto" )
            if ( mode == "inline" )
               lang = "none";
            else switch ( suffix )
            {
            case ".js":
            case ".jsh":
               lang = "js";
               break;
            case ".cpp":
            case ".h":
            case ".cxx":
            case ".hpp":
            case ".hxx":
            case ".c":
            case ".cc":
               lang = "c++";
               break;
            case ".pm":
            case ".pmath":
               lang = "pmath";
               break;
            default:
               lang = "none";
               break;
            }

         if ( lang == "none" ) // no syntax highlighting
            return new Contents( "\n<pre class=\"code\">" + code.toPlainXhtml().trimRight() + "</pre>\n\n", r.nextIndex );

         /*
          * N.B. Assume that syntax highlighting does not highlight operators.
          * Otherwise the '<' and '>' operators would not be highlighted, and
          * the '&' would be a serious problem...
          *
          * Furthermore, we cannot replace quotes in code blocks, and hence we
          * cannot use String.toPlainXhtml() as above.
          */
         code = code.replace( "&", "&amp;", "g"
                     ).replace( "<", "&lt;", "g"
                        ).replace( ">", "&gt;", "g" ).trimRight();
         switch ( lang )
         {
         default: // ?!
         case "js":    var h = new JSSyntaxHighlighter; break;
         case "c++":   var h = new CppSyntaxHighlighter; break;
         case "pmath": var h = new PMathSyntaxHighlighter; break;
         }
         code = h.highlight( code );
         return new Contents( "\n<pre class=\"code\">" + code + "</pre>\n\n", r.nextIndex );
      },
      undefined ),

   new MetaCommand( "equation", 1, true, true,
      function( tokens, i, p )
      {
         var mode = "";
         var scale = 1.0;
         var numbered = workingData.numberAllEquations;
         var name = undefined;
         var contents = "<div class=\"pidoc_equation\"><img";
         if ( p > 0 )
         {
            var parameters = new EquationParameters( this.id, tokens[p].parameters, tokens, i );
            mode = parameters.mode;
            scale = parameters.scale;
            numbered = parameters.numbered;
            name = parameters.name;
            var css = parameters.toCssSource();
            if ( !css.isEmpty() )
               contents += " style=\"" + css + "\"";
         }
         var tex = "";
         var r;
         switch ( mode )
         {
         default:
         case "inline":
            r = tokens[i].toPlainText( tokens, i+1 );
            tex = r.contents;
            break;
         case "import":
            r = tokens[i].toUri( tokens, i+1 );
            var filePath = document.fullFilePath( r.contents.trim() );
            try
            {
               var f = new File;
               f.openForReading( filePath );
               var buffer = f.read( DataType_ByteArray, f.size );
               f.close();
               tex = buffer.utf8ToString();
            }
            catch ( x )
            {
               throw new ParseError( x.message, tokens, i );
            }
            break;
         }
         var fileName = numbered ? document.addNumberedEquation( tex, scale, name, tokens, i ) :
                                   document.addEquation( tex, scale, tokens, i );
         contents += " src=\"images/" + fileName + "\" alt=\"\"/>";
         if ( numbered )
         {
            var number = document.currentEquationNumber();
            contents = "<a name=\"" + document.internalNumberedLabel( "equation", number ) + "\"></a>\n" + contents +
                       format( "<span class=\"pidoc_equation_number\">[%d]</span>", number );
         }
         contents += "</div>\n";
         return new Contents( contents, r.nextIndex );
      },
      undefined ),

   new MetaCommand( "im", 1, true, false,
      function( tokens, i, p )
      {
         var scale = 1.0;
         var css = "vertical-align:middle;";
         if ( p > 0 )
         {
            var parameters = new EquationParameters( this.id, tokens[p].parameters, tokens, i );
            scale = parameters.scale;
            css += parameters.toCssSource();
         }
         var r = tokens[i].toPlainText( tokens, i+1 );
         var tex = "$$ " + r.contents.trim() + " $$";
         var contents = "<img style=\"" + css + "\" src=\"images/" +
                        document.addEquation( tex, 0.9*scale, tokens, i ) + "\" alt=\"\"/>";
         return new Contents( contents, r.nextIndex );
      },
      undefined ),

   new MetaCommand( "image", 1, true, true,
      function( tokens, i, p )
      {
         var r = tokens[i].toUri( tokens, i+1 );
         var imagePath = document.fullFilePath( r.contents );
         var imageFileName = File.extractName( imagePath ) + File.extractExtension( imagePath );
         var contents = "<img";
         if ( p > 0 )
         {
            var parameters = new BlockParameters( this.id, tokens[p].parameters, tokens, i );
            var css = parameters.toCssSource();
            if ( !css.isEmpty() )
               contents += " style=\"" + css + "\"";
         }
         contents += " src=\"images/" + imageFileName + "\" alt=\"\"/>\n";
         document.addImage( imagePath, tokens, i );
         return new Contents( contents, r.nextIndex );
      },
      undefined ),

   new MetaCommand( "figure", 1, true, true,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( "p", tokens, i+1 );
         var numbered = workingData.numberAllFigures;
         var name = undefined;
         var contents = "\n<div class=\"pidoc_figure\""
         if ( p > 0 )
         {
            var parameters = new FigureParameters( this.id, tokens[p].parameters, tokens, i );
            numbered = parameters.numbered;
            name = parameters.name;
            var css = parameters.toCssSource();
            if ( !css.isEmpty() )
               contents += " style=\"" + css + "\"";
         }
         contents += ">\n";
         if ( numbered )
         {
            document.addNumberedFigure( name, tokens, i );
            var number = document.currentFigureNumber();
            contents += "<a name=\"" + document.internalNumberedLabel( "figure", number ) + "\"></a>\n";
            var p1 = r.contents.indexOf( String.fromCharCode( REFMARK ) + "figure_title_tag" );
            if ( p1 >= 0 )
            {
               var p2 = r.contents.indexOf( String.fromCharCode( REFMARK ), p1+1 );
               if ( p2 < 0 )
                  throw new ParseError( "Internal error: unterminated \'figure_title_tag\' symbolic reference.", tokens, i );
               r.contents = r.contents.substring( 0, p1 ) +
                            format( "<span class=\"pidoc_figure_title\">Figure %d &mdash;</span> ", number ) +
                            r.contents.substring( p2+1 );
            }
            else
            {
               contents += format( "<p class=\"pidoc_figure_title\">Figure %d</p>\n", number );
            }
         }
         contents += r.contents;
         contents += "</div>\n";
         return new Contents( contents, r.nextIndex );
      },
      undefined ),

   new MetaCommand( "box", 1, true, true,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( "p", tokens, i+1 );
         var contents = "\n<div class=\"pidoc_box\""
         if ( p > 0 )
         {
            var parameters = new BlockParameters( this.id, tokens[p].parameters, tokens, i );
            var css = parameters.toCssSource();
            if ( !css.isEmpty() )
               contents += " style=\"" + css + "\"";
         }
         contents += ">\n";
         contents += r.contents;
         contents += "</div>\n";
         return new Contents( contents, r.nextIndex );
      },
      undefined ),

   new MetaCommand( "list", 1, true, true,
      function( tokens, i, p )
      {
         if ( !(tokens[i] instanceof TextBlock) )
            throw new ParseError( "List items must be defined into a block argument.", tokens, i );

         if ( p > 0 )
            var parameters = new ListParameters( tokens[p].parameters, tokens, i );

         var items = tokens[i].tokens;
         var listItems = new Array;
         for ( var j = this.indexOfNextArgument( items, 0 ); j < items.length; )
         {
            var r = items[j].toXhtml( '', items, j+1 );
            listItems.push( r.contents );
            j = this.indexOfNextArgument( items, r.nextIndex );
         }

         var contents = '';
         if ( listItems.length > 0 )
         {
            var listType = (p > 0) ? parameters.listType : "unordered";
            var listTag;
            switch ( listType )
            {
            default: // ?!
            case "unordered":
               listTag = "ul";
               break;
            case "ordered":
               listTag = "ol";
               break;
            }
            contents += "\n<" + listTag + " class=\"pidoc_list\"";
            if ( p > 0 )
            {
               var css = parameters.toCssSource();
               if ( !css.isEmpty() )
                  contents += " style=\"" + css + "\"";
            }
            contents += ">\n";

            for ( var j = 0; j < listItems.length; ++j )
            {
               // ### TODO: Implement [ordered:<first-item>]
               contents += "<li";
               if ( p > 0 && parameters.spaced && j > 0 )
                  contents += " class=\"pidoc_spaced_list_item\"";
               contents += ">" + listItems[j] + "</li>\n";
            }

            contents += "</" + listTag + ">\n\n"
         }
         else
            document.warning( "Empty list.", tokens, i );

         return new Contents( contents, i+1 );
      },
      undefined ),

   new MetaCommand( "definition", 1, true, true,
      function( tokens, i, p )
      {
         if ( !(tokens[i] instanceof TextBlock) )
            throw new ParseError( "Definition list items must be defined into a block argument.", tokens, i );

         var items = tokens[i].tokens;
         var definitions = new Array;
         for ( var j = this.indexOfNextArgument( items, 0 ); j < items.length; )
         {
            var r1 = items[j].toXhtml( "p", items, j+1 );
            j = this.indexOfNextArgument( items, r1.nextIndex );
            if ( j == items.length )
               throw new ParseError( "Missing definition list item description.", items, j-1 );
            var r2 = items[j].toXhtml( "p", items, j+1 );
            definitions.push( new Array( r1.contents, r2.contents ) );
            j = this.indexOfNextArgument( items, r2.nextIndex );
         }

         var contents = '';
         if ( definitions.length > 0 )
         {
            contents += "\n<dl class=\"pidoc_list\"";
            if ( p > 0 )
            {
               var parameters = new BlockParameters( "definition", tokens[p].parameters, tokens, i );
               var css = parameters.toCssSource();
               if ( !css.isEmpty() )
                  contents += " style=\"" + css + "\"";
            }
            contents += ">\n";

            for ( var j = 0; j < definitions.length; ++j )
            {
               contents += "<dt>\n" + definitions[j][0] + "</dt>\n";
               contents += "<dd>\n" + definitions[j][1] + "</dd>\n";
            }

            contents += "</dl>\n\n"
         }
         else
            document.warning( "Empty definition list.", tokens, i );

         return new Contents( contents, i+1 );
      },
      undefined ),

   new MetaCommand( "imageselect", 1, true, true,
      function( tokens, i, p )
      {
         if ( !(tokens[i] instanceof TextBlock) )
            throw new ParseError( "image selection items must be defined into a block argument.", tokens, i );

         var items = tokens[i].tokens;
         var selectionItems = new Array;
         for ( var j = this.indexOfNextArgument( items, 0 ); j < items.length; )
         {
            var r1 = items[j].toUri( items, j+1 );
            var imageFilePath = document.fullFilePath( r1.contents );
            var imageFileName = File.extractName( imageFilePath ) + File.extractExtension( imageFilePath );
            document.addImage( imageFilePath, items, j );

            j = this.indexOfNextArgument( items, r1.nextIndex );
            if ( j == items.length )
               throw new ParseError( "Missing image selection text.", items, j-1 );
            var r2 = items[j].toXhtml( '', items, j+1 );
            selectionItems.push( new Array( imageFileName, r2.contents ) );
            j = this.indexOfNextArgument( items, r2.nextIndex );
         }
         if ( selectionItems.length < 2 )
            throw new ParseError( "At least two image selection items are required.", tokens, i );

         var imageId = document.uniqueId();
         var contents = "<div class=\"pidoc_mouseover\"";
         var menuPos = "bottom";
         if ( p > 0 )
         {
            var parameters = new ImageSelectParameters( tokens[p].parameters, tokens, i );
            menuPos = parameters.menuPos;
            var css = parameters.toCssSource();
            if ( !css.isEmpty() )
               contents += " style=\"" + css + "\"";
         }
         contents += ">\n";
         var imgTag = "<img src=\"images/" + selectionItems[0][0] + "\" id=\"" + imageId + "\" alt=\"\" />\n";
         var ulTag = "<ul>\n";
         for ( var j = 0; j < selectionItems.length; ++j )
         {
            var id = imageId + "_" + (j+1).toString();
            ulTag += "<li><span style=\"opacity:" + ((j == 0) ? "1.0" : "0.0") + ";\" id=\"" + id + "\">&#x25B6;&nbsp;</span>" +
                     "<a style=\"cursor:default;\" href=\"javascript:void( 0 );\" " +
                        "onmouseover=\"pidoc_setImgSrc( \'" + imageId + "\', \'images/" + selectionItems[j][0] + "\' ); " +
                                      "pidoc_hideGroup( \'" + imageId + "\', " + selectionItems.length.toString() + " ); " +
                                      "pidoc_setOpacity( \'" + id + "\', 1.0 );\">" +
                     selectionItems[j][1] + "</a></li>\n";
         }
         ulTag += "</ul>\n";
         switch ( menuPos )
         {
         case "top":
            contents += ulTag + imgTag;
            break;
         default: // ?!
         case "bottom":
            contents += imgTag + ulTag;
            break;
         case "left":
            contents += "<div style=\"float:right; margin-left:0.75em;\">" + imgTag + "</div>" + ulTag + "<br style=\"clear:right;\" />";
            break;
         case "right":
            contents += "<div style=\"float:left; margin-right:0.75em;\">" + imgTag + "</div>" + ulTag + "<br style=\"clear:left;\" />";
            break;
         }
         contents += "</div>\n";
         return new Contents( contents, i+1 );
      },
      undefined ),

   new MetaCommand( "imageswap", 2, true, true,
      function( tokens, i, p )
      {
         var r1 = tokens[i].toUri( tokens, i+1 );
         var outFilePath = document.fullFilePath( r1.contents );
         var outFileName = File.extractName( outFilePath ) + File.extractExtension( outFilePath );
         document.addImage( outFilePath, tokens, i );
         if ( p > 0 )
            var parameters = new BlockParameters( this.id, tokens[p].parameters, tokens, i );

         i = this.indexOfNextRequiredArgument( tokens, r1.nextIndex );
         var r2 = tokens[i].toUri( tokens, i+1 );
         var overFilePath = document.fullFilePath( r2.contents );
         var overFileName = File.extractName( overFilePath ) + File.extractExtension( overFilePath );
         document.addImage( overFilePath, tokens, i );

         var imageId = document.uniqueId();
         var linkSrc =  "<a style=\"cursor:default;\" href=\"javascript:void( 0 );\" " +
                           "onmouseover=\"pidoc_setImgSrc( \'" + imageId + "\', \'images/" + overFileName + "\' );\" " +
                           "onmouseout=\"pidoc_setImgSrc( \'" + imageId + "\', \'images/" + outFileName + "\' );\">";
         var contents = "<div class=\"pidoc_mouseover\"";
         if ( p > 0 )
         {
            var css = parameters.toCssSource();
            if ( !css.isEmpty() )
               contents += " style=\"" + css + "\"";
         }
         contents += ">" + linkSrc +
                     "<img src=\"images/" + outFileName + "\" id=\"" + imageId + "\" alt=\"\" /></a>\n" +
                     "<p>" + linkSrc + "[mouseover]</a></p></div>\n";
         return new Contents( contents, i+1 );
      },
      undefined ),

   new MetaCommand( "table", 1, true, true,
      function( tokens, i, p )
      {
         if ( !(tokens[i] instanceof TextBlock) )
            throw new ParseError( "Table rows must be defined into a block argument.", tokens, i );

         var numbered = workingData.numberAllTables;
         var name = undefined;
         var contents = "\n<p><table class=\"pidoc_table\"";
         if ( p > 0 )
         {
            var parameters = new TableParameters( tokens[p].parameters, tokens, i );
            numbered = parameters.numbered;
            name = parameters.name;
            var css = parameters.toCssSource();
            if ( !css.isEmpty() )
               contents += " style=\"" + css + "\"";
         }
         contents += ">\n";

         var rows = tokens[i].tokens;
         var nr = 0;
         for ( var j = this.indexOfNextArgument( rows, 0 );
                   j < rows.length;
                   j = this.indexOfNextArgument( rows, j+1 ) )
         {
            if ( !(rows[j] instanceof TextBlock) )
               throw new ParseError( "Table rows must be defined into a block argument.", rows, j );

            if ( numbered || (p > 0 && parameters.caption) )
            {
               contents += "<caption>";
               var caption = (p > 0 && parameters.caption) ? rows[j].toXhtml( '', rows, j+1 ).contents : "";
               if ( numbered )
               {
                  document.addNumberedTable( name, tokens, i );
                  var number = document.currentTableNumber();
                  contents += "<a name=\"" + document.internalNumberedLabel( "table", number ) + "\"></a>\n";
                  var p1 = caption.indexOf( String.fromCharCode( REFMARK ) + "table_title_tag" );
                  if ( p1 >= 0 )
                  {
                     var p2 = caption.indexOf( String.fromCharCode( REFMARK ), p1+1 );
                     if ( p2 < 0 )
                        throw new ParseError( "Internal error: unterminated \'table_title_tag\' symbolic reference.", rows, j );
                     caption = caption.substring( 0, p1 ) +
                                  format( "<span class=\"pidoc_table_title\">Table %d &mdash; ", number ) +
                                  caption.substring( p2+1 ) + "</span>";
                  }
                  else
                  {
                     var tag = format( "<span class=\"pidoc_table_title\">Table %d", number );
                     if ( caption.isEmpty() )
                        caption = tag;
                     else
                        caption = tag + "<br/>\n" + caption;
                     caption += "</span>";
                  }
                  numbered = false;
               }
               contents += caption + "</caption>\n";
               if ( p > 0 && parameters.caption )
               {
                  parameters.caption = false;
                  continue;
               }
            }

            contents += "<tr>\n";
            var cells = rows[j].tokens;
            var nc = 0;
            for ( var k = this.indexOfNextArgument( cells, 0 ); k < cells.length; ++nc )
            {
               var r = cells[k].toXhtml( "p", cells, k+1 );
               if ( p > 0 && parameters.headers > 0 )
                  contents += "<th>" + r.contents + "</th>\n";
               else
                  contents += "<td>" + r.contents + "</td>\n";
               k = this.indexOfNextArgument( cells, r.nextIndex );
            }
            if ( p > 0 && parameters.headers > 0 )
               --parameters.headers;
            contents += "</tr>\n";
            if ( nc == 0 )
               document.warning( "Empty table row.", rows, j );
            ++nr;
         }
         contents += "</table></p>\n\n";
         if ( nr == 0 )
            document.warning( "Empty table.", tokens, i );

         return new Contents( contents, i+1 );
      },
      undefined ),

   new MetaCommand( "note", 1, true, true,
      function( tokens, i, p )
      {
         var contents = "\n<div class=\"pidoc_note\"";
         if ( p > 0 )
         {
            var parameters = new BlockParameters( this.id, tokens[p].parameters, tokens, i );
            var css = parameters.toCssSource();
            if ( !css.isEmpty() )
               contents += " style=\"" + css + "\"";
         }
         contents += ">\n";
         var r = tokens[i].toXhtml( "p", tokens, i+1 );
         contents += r.contents + "</div>\n";
         return new Contents( contents, r.nextIndex );
      },
      undefined ),

   new MetaCommand( "hs", 0, true, false,
      function( tokens, i, p )
      {
         var contents = "<span style=\"margin-left:";
         var length = "1em";
         if ( p > 0 )
         {
            var parameters = new SpacingParameters( tokens[p].parameters, tokens, i );
            if ( parameters.length != undefined )
               length = parameters.length;
         }
         contents += length + ";\"></span>\n";
         return new Contents( contents, i );
      },
      undefined ),

   new MetaCommand( "vs", 0, true, false,
      function( tokens, i, p )
      {
         var contents = "\n<div style=\"margin-top:";
         var length = "1em";
         if ( p > 0 )
         {
            var parameters = new SpacingParameters( tokens[p].parameters, tokens, i );
            if ( parameters.length != undefined )
               length = parameters.length;
         }
         contents += length + ";\"></div>\n";
         return new Contents( contents, i );
      },
      undefined ),

   new MetaCommand( "a", 1, false, false,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( '', tokens, i+1 );
         return new Contents( "<span class=\"pidoc_argument\">" + r.contents + "</span>",
                              r.nextIndex );
      },
      undefined ),

   new MetaCommand( "c", 1, false, false,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( '', tokens, i+1 );
         return new Contents( "<span class=\"pidoc_code\">" + r.contents + "</span>",
                              r.nextIndex );
      },
      undefined ),

   new MetaCommand( "e", 1, false, false,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( '', tokens, i+1 );
         return new Contents( "<em>" + r.contents + "</em>",
                              r.nextIndex );
      },
      undefined ),

   new MetaCommand( "s", 1, false, false,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( '', tokens, i+1 );
         return new Contents( "<strong>" + r.contents + "</strong>",
                              r.nextIndex );
      },
      undefined ),

   new MetaCommand( "u", 1, false, false,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( '', tokens, i+1 );
         return new Contents( "<u>" + r.contents + "</u>",
                              r.nextIndex );
      },
      undefined ),

   new MetaCommand( "d", 1, false, false,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( '', tokens, i+1 );
         return new Contents( "<del>" + r.contents + "</del>",
                              r.nextIndex );
      },
      undefined ),

   new MetaCommand( "i", 1, false, false,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( '', tokens, i+1 );
         return new Contents( "<ins>" + r.contents + "</ins>",
                              r.nextIndex );
      },
      undefined ),

   new MetaCommand( "sub", 1, false, false,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( '', tokens, i+1 );
         return new Contents( "<sub>" + r.contents + "</sub>",
                              r.nextIndex );
      },
      undefined ),

   new MetaCommand( "sup", 1, false, false,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( '', tokens, i+1 );
         return new Contents( "<sup>" + r.contents + "</sup>",
                              r.nextIndex );
      },
      undefined ),

   new MetaCommand( "wrap", 1, false, false,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( '', tokens, i+1 );
         return new Contents( "<span class=\"pidoc_wrap\">" + r.contents + "</span>",
                              r.nextIndex );
      },
      undefined ),

   new MetaCommand( "nowrap", 1, false, false,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( '', tokens, i+1 );
         return new Contents( "<span class=\"pidoc_nowrap\">" + r.contents + "</span>",
                              r.nextIndex );
      },
      undefined ),

   new MetaCommand( "cite", 1, false, false,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( '', tokens, i+1 );
         return new Contents( "<cite>" + r.contents + "</cite>",
                              r.nextIndex );
      },
      undefined ),

   new MetaCommand( "k", 1, false, false,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( '', tokens, i+1 );
         return new Contents( "<kbd>" + r.contents + "</kbd>",
                              r.nextIndex );
      },
      undefined ),

   new MetaCommand( "kbd", 1, false, false, // deprecated
      function( tokens, i, p )
      {
         document.warning( "The \\kbd command has been deprecated; use \\k in new code.", tokens, i );
         var r = tokens[i].toXhtml( '', tokens, i+1 );
         return new Contents( "<kbd>" + r.contents + "</kbd>",
                              r.nextIndex );
      },
      undefined ),

   new MetaCommand( "m", 1, false, false,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( '', tokens, i+1 );
         return new Contents( "<span class=\"pidoc_menu\">" + r.contents + "</span>",
                              r.nextIndex );
      },
      undefined ),

   new MetaCommand( "menu", 1, false, false, // deprecated
      function( tokens, i, p )
      {
         document.warning( "The \\menu command has been deprecated; use \\m in new code.", tokens, i );
         var r = tokens[i].toXhtml( '', tokens, i+1 );
         return new Contents( "<span class=\"pidoc_menu\">" + r.contents + "</span>",
                              r.nextIndex );
      },
      undefined ),

   new MetaCommand( "v", 1, false, false,
      function( tokens, i, p )
      {
         var r = tokens[i].toXhtml( '', tokens, i+1 );
         return new Contents( "<var>" + r.contents + "</var>",
                              r.nextIndex );
      },
      undefined ),

   new MetaCommand( "var", 1, false, false, // deprecated
      function( tokens, i, p )
      {
         document.warning( "The \\var command has been deprecated; use \\v in new code.", tokens, i );
         var r = tokens[i].toXhtml( '', tokens, i+1 );
         return new Contents( "<var>" + r.contents + "</var>",
                              r.nextIndex );
      },
      undefined ),

   new MetaCommand( "ref", 1, false, false,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         var name = r.contents.trim();
         if ( name.isEmpty() )
            throw new ParseError( "Empty or missing reference name.", tokens, i );
         return new Contents( document.encodedSymbolicReference( "reference", name, tokens, i ), r.nextIndex );
      },
      undefined ),

   new MetaCommand( "eqnref", 1, false, false,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         var name = r.contents.trim();
         if ( name.isEmpty() )
            throw new ParseError( "Empty or missing equation name.", tokens, i );
         return new Contents( document.encodedSymbolicReference( "equation", name, tokens, i ), r.nextIndex );
      },
      undefined ),

   new MetaCommand( "eqnnum", 1, false, false,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         var name = r.contents.trim();
         if ( name.isEmpty() )
            throw new ParseError( "Empty or missing equation name.", tokens, i );
         return new Contents( document.encodedSymbolicReference( "equation_number", name, tokens, i ), r.nextIndex );
      },
      undefined ),

   new MetaCommand( "figref", 1, false, false,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         var name = r.contents.trim();
         if ( name.isEmpty() )
            throw new ParseError( "Empty or missing figure name.", tokens, i );
         return new Contents( document.encodedSymbolicReference( "figure", name, tokens, i ), r.nextIndex );
      },
      undefined ),

   new MetaCommand( "fignum", 1, false, false,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         var name = r.contents.trim();
         if ( name.isEmpty() )
            throw new ParseError( "Empty or missing figure name.", tokens, i );
         return new Contents( document.encodedSymbolicReference( "figure_number", name, tokens, i ), r.nextIndex );
      },
      undefined ),

   new MetaCommand( "figtag", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( document.encodedSymbolicReference( "figure_title_tag", 'dummy'/*can't be empty*/, tokens, i ), i );
      },
      undefined ),

   new MetaCommand( "tbltag", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( document.encodedSymbolicReference( "table_title_tag", 'dummy'/*can't be empty*/, tokens, i ), i );
      },
      undefined ),

   new MetaCommand( "tblref", 1, false, false,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         var name = r.contents.trim();
         if ( name.isEmpty() )
            throw new ParseError( "Empty or missing table name.", tokens, i );
         return new Contents( document.encodedSymbolicReference( "table", name, tokens, i ), r.nextIndex );
      },
      undefined ),

   new MetaCommand( "tblnum", 1, false, false,
      function( tokens, i, p )
      {
         var r = tokens[i].toPlainText( tokens, i+1 );
         var name = r.contents.trim();
         if ( name.isEmpty() )
            throw new ParseError( "Empty or missing table name.", tokens, i );
         return new Contents( document.encodedSymbolicReference( "table_number", name, tokens, i ), r.nextIndex );
      },
      undefined ),

   /*
    * Entities
    */

   // line break
   new MetaCommand( "n", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "<br/>\n", i );
      },
      undefined ),

   // line break + stop floating elements
   new MetaCommand( "nf", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "<br style=\"clear:both;\"/>\n", i );
      },
      undefined ),

   // soft (breakable, collapsible) space
   new MetaCommand( "w", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( " ", i );
      },
      undefined ),

   // hard (nonbreakable, noncollapsible) space
   new MetaCommand( "wh", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&nbsp;", i );
      },
      undefined ),

   // en space
   new MetaCommand( "wn", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&ensp;", i );
      },
      undefined ),

   // em space
   new MetaCommand( "wm", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&emsp;", i );
      },
      undefined ),

   // thin space
   new MetaCommand( "wt", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&thinsp;", i );
      },
      undefined ),

   // backslash
   new MetaCommand( "backslash", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "\\", i );
      },
      undefined ),

   // bullet
   new MetaCommand( "bullet", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&bull;", i );
      },
      undefined ),

   // horizontal ellipsis
   new MetaCommand( "ellipsis", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&hellip;", i );
      },
      undefined ),

   // multiplication sign
   new MetaCommand( "times", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&times;", i );
      },
      undefined ),

   // division sign
   new MetaCommand( "div", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&divide;", i );
      },
      undefined ),

   // equal to sign
   new MetaCommand( "eq", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "=", i );
      },
      undefined ),

   // not equal to sign
   new MetaCommand( "ne", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&ne;", i );
      },
      undefined ),

   // approximately equal to sign
   new MetaCommand( "aeq", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&cong;", i );
      },
      undefined ),

   // equivalent to sign
   new MetaCommand( "eeq", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&equiv;", i );
      },
      undefined ),

   // less than sign
   new MetaCommand( "le", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&le;", i );
      },
      undefined ),

   // greater than sign
   new MetaCommand( "ge", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&ge;", i );
      },
      undefined ),

   // proportional to sign
   new MetaCommand( "prop", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&prop;", i );
      },
      undefined ),

   // degree sign
   new MetaCommand( "deg", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&deg;", i );
      },
      undefined ),

   // minus sign
   new MetaCommand( "minus", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&minus;", i );
      },
      undefined ),

   // plus/minus sign
   new MetaCommand( "pm", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&plusmn;", i );
      },
      undefined ),

   // infinity sign
   new MetaCommand( "inf", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&infin;", i );
      },
      undefined ),

   // paragraph sign
   new MetaCommand( "para", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&para;", i );
      },
      undefined ),

   // section sign
   new MetaCommand( "sect", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&sect;", i );
      },
      undefined ),

   // copyright sign
   new MetaCommand( "copy", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&copy;", i );
      },
      undefined ),

   // trademark sign
   new MetaCommand( "tm", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&reg;", i );
      },
      undefined ),

   // no operation special command
   new MetaCommand( "nop", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( '', i );
      },
      undefined ),

   /*
    * Greek Letters
    */

   new MetaCommand( "Alpha", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Alpha;", i );
      },
      undefined ),
   new MetaCommand( "Beta", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Beta;", i );
      },
      undefined ),
   new MetaCommand( "Gamma", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Gamma;", i );
      },
      undefined ),
   new MetaCommand( "Delta", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Delta;", i );
      },
      undefined ),
   new MetaCommand( "Epsilon", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Epsilon;", i );
      },
      undefined ),
   new MetaCommand( "Zeta", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Zeta;", i );
      },
      undefined ),
   new MetaCommand( "Eta", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Eta;", i );
      },
      undefined ),
   new MetaCommand( "Theta", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Theta;", i );
      },
      undefined ),
   new MetaCommand( "Iota", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Iota;", i );
      },
      undefined ),
   new MetaCommand( "Kappa", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Kappa;", i );
      },
      undefined ),
   new MetaCommand( "Lambda", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Lambda;", i );
      },
      undefined ),
   new MetaCommand( "Mu", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Mu;", i );
      },
      undefined ),
   new MetaCommand( "Nu", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Nu;", i );
      },
      undefined ),
   new MetaCommand( "Xi", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Xi;", i );
      },
      undefined ),
   new MetaCommand( "Omicron", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Omicron;", i );
      },
      undefined ),
   new MetaCommand( "Pi", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Pi;", i );
      },
      undefined ),
   new MetaCommand( "Rho", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Rho;", i );
      },
      undefined ),
   new MetaCommand( "Sigma", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Sigma;", i );
      },
      undefined ),
   new MetaCommand( "Tau", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Tau;", i );
      },
      undefined ),
   new MetaCommand( "Upsilon", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Upsilon;", i );
      },
      undefined ),
   new MetaCommand( "Phi", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Phi;", i );
      },
      undefined ),
   new MetaCommand( "Chi", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Chi;", i );
      },
      undefined ),
   new MetaCommand( "Psi", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Psi;", i );
      },
      undefined ),
   new MetaCommand( "Omega", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&Omega;", i );
      },
      undefined ),
   new MetaCommand( "alpha", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&alpha;", i );
      },
      undefined ),
   new MetaCommand( "beta", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&beta;", i );
      },
      undefined ),
   new MetaCommand( "gamma", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&gamma;", i );
      },
      undefined ),
   new MetaCommand( "delta", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&delta;", i );
      },
      undefined ),
   new MetaCommand( "epsilon", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&epsilon;", i );
      },
      undefined ),
   new MetaCommand( "zeta", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&zeta;", i );
      },
      undefined ),
   new MetaCommand( "eta", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&eta;", i );
      },
      undefined ),
   new MetaCommand( "theta", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&theta;", i );
      },
      undefined ),
   new MetaCommand( "vartheta", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&thetasym;", i );
      },
      undefined ),
   new MetaCommand( "iota", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&iota;", i );
      },
      undefined ),
   new MetaCommand( "kappa", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&kappa;", i );
      },
      undefined ),
   new MetaCommand( "lambda", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&lambda;", i );
      },
      undefined ),
   new MetaCommand( "mu", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&mu;", i );
      },
      undefined ),
   new MetaCommand( "nu", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&nu;", i );
      },
      undefined ),
   new MetaCommand( "xi", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&xi;", i );
      },
      undefined ),
   new MetaCommand( "omicron", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&omicron;", i );
      },
      undefined ),
   new MetaCommand( "pi", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&pi;", i );
      },
      undefined ),
   new MetaCommand( "varpi", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&piv;", i );
      },
      undefined ),
   new MetaCommand( "rho", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&rho;", i );
      },
      undefined ),
   new MetaCommand( "sigma", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&sigma;", i );
      },
      undefined ),
   new MetaCommand( "varsigma", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&sigmaf;", i );
      },
      undefined ),
   new MetaCommand( "tau", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&tau;", i );
      },
      undefined ),
   new MetaCommand( "upsilon", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&upsilon;", i );
      },
      undefined ),
   new MetaCommand( "phi", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&phi;", i );
      },
      undefined ),
   new MetaCommand( "chi", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&chi;", i );
      },
      undefined ),
   new MetaCommand( "psi", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&psi;", i );
      },
      undefined ),
   new MetaCommand( "omega", 0, false, false,
      function( tokens, i, p )
      {
         return new Contents( "&omega;", i );
      },
      undefined )
];

MetaCommand.commands.sort( function( a, b ) { return (a.id != b.id) ? ((a.id < b.id) ? -1 : +1) : 0; } );

MetaCommand.indexOf = function( id )
{
   for ( var n = MetaCommand.commands.length, i = 0, j = n; ; )
   {
      if ( j <= i )
         return (i < n && id == MetaCommand.commands[i].id) ? i : -1;
      var m = (i + j) >> 1;
      if ( MetaCommand.commands[m].id < id )
         i = m+1;
      else
         j = m;
   }
};

// ****************************************************************************
// EOF PIDocCommands.js - Released 2014/12/09 21:37:52 UTC
