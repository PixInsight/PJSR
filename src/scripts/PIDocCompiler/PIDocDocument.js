// ----------------------------------------------------------------------------
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ----------------------------------------------------------------------------
// PIDocDocument.js - Released 2017/01/23 20:54:58 UTC
// ----------------------------------------------------------------------------
//
// This file is part of PixInsight Documentation Compiler Script version 1.6.2
//
// Copyright (c) 2010-2017 Pleiades Astrophoto S.L.
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
 * Copyright (C) 2010-2017 Pleiades Astrophoto. All Rights Reserved.
 * Written by Juan Conejero (PTeam)
 *
 * Document object.
 */

#include <pjsr/ProcessExitStatus.jsh>
#include <pjsr/CryptographicHash.jsh>

/*
 * Document classes.
 */
#define PIDOC_CLASS_UNKNOWN   0
#define PIDOC_CLASS_GENERIC   1
#define PIDOC_CLASS_TOOL      2
#define PIDOC_CLASS_SCRIPT    3
#define PIDOC_CLASS_JSOBJECT  4

/*
 * The file name of a temporary working file.
 */
#define PIDOC_TMP_FILE_NAME   "__pidoc__"

/*
 * A generic document section.
 */
function Section( parent, title, sectionId, noIndex )
{
   this.__base__ = Object;
   this.__base__();

   this.parent = parent;
   this.title = title.replace( /a\>\s+/g, "a>" ); // remove white spaces after label tags
   this.text = '';
   this.noIndex = (noIndex == undefined) ? false : noIndex;

   if ( this.parent )
      this.id = this.parent.id + "_:_";
   else
      this.id = "";
   this.id += this.title.removeHtmlTags().trim().replace( /\s+/g, '_' ).replace( /[^a-zA-Z0-9_]/g, '' );

   this.subsections = [];
   if ( this.parent )
      this.parent.subsections.push( this );

   this.end = function( text )
   {
      this.text = text;
   };

   this.hasSubsection = function( title )
   {
      for ( let i = 0; i < this.subsections.length; ++i )
         if ( this.subsections[i].title == title )
            return true;
      return false;
   };

   this.setSectionNumber = function( sn )
   {
      this.title = sn + "&emsp;" + this.title;
   };

   this.toXhtml = function()
   {
      let xhtml = '';
      if ( this.parent )
      {
         xhtml += "<div class=\"pidoc_subsection\"";
         if ( !this.noIndex )
            xhtml += " id=\"" + document.internalLabel( this.id ) + "\"";
         xhtml += ">\n";
         if ( !this.title.isEmpty() )
            if ( this.parent.parent )
               xhtml += "   <h5 class=\"pidoc_subsectionTitle\">" + this.title + "</h5>\n";
            else
               xhtml += "   <h4 class=\"pidoc_subsectionTitle\">" + this.title + "</h4>\n";
      }
      else
      {
         xhtml += Section.startXhtml( this.title, this.noIndex ? '' : this.id );
      }

      xhtml += this.text;

      for ( let i = 0; i < this.subsections.length; ++i )
         xhtml += this.subsections[i].toXhtml();

      if ( !this.parent )
         xhtml += "   </div>\n";
      xhtml += "</div>\n\n";

      return xhtml;
   };
}

Section.prototype = new Object;

Section.toggleSectionXhtml = function( id )
{
   return "<p class=\"pidoc_sectionToggleButton\" onclick=\"pidoc_toggleSection( '" + id + "', this );\">[hide]</p>\n";
};

Section.startXhtml = function( title, id, toggle )
{
   if ( toggle == undefined )
      toggle = true;
   let s = "<div class=\"pidoc_section\" id=\"" + document.internalLabel( id ) + "\">\n";
   if ( !title.isEmpty() )
      s += "   <h3 class=\"pidoc_sectionTitle\">" + title + "</h3>\n";
   return s
        + (toggle ? ("   " + Section.toggleSectionXhtml( id )) : "")
        + "   <div id=\"" + id + "\">\n";
};

Section.endXhtml = function()
{
   return "   </div>\n"
        + "</div>\n\n";
};

/*
 * A document section to describe a process parameter.
 */
function ParameterSection( title, text )
{
   this.__base__ = Object;
   this.__base__();

   this.title = title;
   this.text = text;

   this.toXhtml = function()
   {
      return   "<div class=\"pidoc_parameter\">\n"
             + "   <h4 class=\"pidoc_parameterTitle\">" + this.title + "</h4>\n"
             + this.text
             + "</div>\n\n";
   };
}

ParameterSection.prototype = new Object;

/*
 * A document section to describe an object's property.
 */
function ObjectPropertySection( id, formalDescription, description, label, readOnly )
{
   this.__base__ = Object;
   this.__base__();

   this.id = id;
   this.formalDescription = formalDescription;
   this.href = (new CryptographicHash( CryptographicHash_SHA1 )).hash( ByteArray.stringToUTF8( formalDescription ) ).toHex();
   this.description = description;
   this.label = label;
   this.readOnly = readOnly;

   this.toXhtml = function()
   {
      return   "<div class=\"pidoc_objectItem\" id=\"" + document.internalLabel( this.href ) + "\">\n"
             + ((this.label != undefined && !this.label.isEmpty()) ? "<div id=\"" + this.label + "\">\n" : "")
             + "   <p class=\"pidoc_objectFormalDescription"
               + (this.readOnly ? " pidoc_readOnlyProperty" : "") + "\">"
               + this.formalDescription
               + (this.readOnly ? " <span class=\"pidoc_readOnlyPropertyTag\">&lt;read-only&gt;</span>" : "") + "</p>\n"
             + "   <div class=\"pidoc_objectDescription\">\n"
             + this.description + '\n'
             + "   </div>\n"
             + ((this.label != undefined && !this.label.isEmpty()) ? "</div>\n" : "")
             + "</div>\n\n";
   };
}

ObjectPropertySection.prototype = new Object;

/*
 * A reference to a related resource (document, web page, etc.), within or
 * outside the PixInsight Reference Documentation system.
 */
function RelatedResource( uri, text )
{
   this.__base__ = Object;
   this.__base__();

   this.uri = uri;
   this.text = text;

   this.toXhtml = function()
   {
      if ( this.uri.isEmpty() )
         return this.text;
      return "<a href=\"" + this.uri.encodeWhitespace() + "\" title=\"" + this.uri + "\">" + this.text + "</a>";
   };
}

RelatedResource.prototype = new Object;

/*
 * A bibliographic reference accessible through a symbol.
 */
function Reference( name, text )
{
   this.__base__ = Object;
   this.__base__();

   this.name = name;
   this.text = text;
   this.count = 0;

   this.toXhtml = function()
   {
      return this.text;
   };
}

Reference.prototype = new Object;

/*
 * A local label reference.
 */
function LabelReference( label, tokens, index )
{
   this.__base__ = Object;
   this.__base__();

   this.label = label;
   this.location = new DocumentLocation( tokens, index );
}

LabelReference.prototype = new Object;

/*
 * Cache of LaTeX equation renditions.
 */
function EquationCache()
{
   this.__base__ = Object;
   this.__base__();

   this.items = new Array;
   this.count = 0;

   this.find = function( tex, scale )
   {
      for ( let i = 0; i < this.items.length; ++i )
      {
         let item = this.items[i];
         if ( item.tex == tex )
            if ( item.scale == scale )
               return item.fileName;
      }
      return null;
   };

   this.add = function( tex, scale )
   {
      let fileName = format( "eqn_%04d.svg", ++this.count );
      this.items.push( {tex:tex, fileName:fileName, scale:scale} );
      return fileName;
   };

   this.clear = function()
   {
      this.items = new Array;
      this.count = 0;
   };
}

EquationCache.prototype = new Object;

/*
 * PixInsight documentation object.
 */

function PIDocDocument()
{
   // Inherit from the global Object object
   this.__base__ = Object;
   this.__base__();

   // File path of the main source file being compiled
   this.filePath = '';

   // Document class: PIGenericDoc, PIToolDoc
   this.documentClass = PIDOC_CLASS_UNKNOWN;

   // Document components and sections for all document classes
   this.title = '';
   this.subtitle = '';
   this.authors = new Array;
   this.copyright = '';
   this.keywords = new Array;
   this.brief = '';
   this.summary = null; // 'abstract' is an ECMA reserved word
   this.introduction = null;
   this.description = null;
   this.methodology = null; // 'methods' is potentially conflictive
   this.results = null;
   this.discussion = null;
   this.usage = null;
   this.acknowledgments = null;
   this.sections = new Array;
   this.currentSection = null;

   // References and related resources
   this.references = new Array;
   this.relatedTools = new Array;
   this.relatedScripts = new Array;
   this.relatedObjects = new Array;
   this.relatedDocuments = new Array;
   this.relatedResources = new Array;

   // Items specific to both the PIToolDoc and PIScriptDoc document classes
   this.toolId = ''
   this.parameters = new Array;

   // Items specific to the PIToolDoc document class
   this.moduleId = '';
   this.categories = new Array;

   // Items specific to the PIJSObjectDoc document class
   this.objectId = '';
   this.properties = new Array;
   this.staticProperties = new Array;
   this.eventHandlers = new Array;
   this.constructors = new Array;
   this.methods = new Array;
   this.staticMethods = new Array;
   this.constants = new Array;
   this.defines = new Array;
   this.inherits = new Array;
   this.inherited = new Array;
   this.required = new Array;

   // Items specific to the PIGenericDoc document class
   this.docId = '';

   // Generated XHTML source code
   this.xhtmlSource = '';
   this.xhtmlInitialized = false;

   // Cache of LaTeX equation renditions
   this.equations = new EquationCache;

   // Enumerated equations, figures and tables
   this.equationNumber = 0;         // current object number
   this.equationNames = new Array;  // name-number associations
   this.figureNumber = 0;
   this.figureNames = new Array;
   this.tableNumber = 0;
   this.tableNames = new Array;

   // The list of image references
   this.images = new Array;

   // The list of labels and label references, for local references diagnostics
   this.labels = new Array;
   this.labelReferences = new Array;

   // Options for suppression of output elements
   // These options are selected exclusively through parameters of the \make
   // command; they cannot be modified directly by the user.
   this.noAuthors = false;    // don't generate the authors section
   this.noCategories = false; // don't generate the categories section
   this.noKeywords = false;   // don't generate the keywords section
   this.noToc = false;        // don't generate the table of contents
   this.noCopyright = false;  // don't generate the copyright section

   // User-definable options
   this.noBackups = true;       // don't generate backups of existing output files
   this.abortOnWarning = false; // treat warnings as errors

   // Number of issued warnings
   this.warningCount = 0;

   // Flag true when the \make command has been invoked
   this.beenMade = false;

   // Target PIDoc system root directory
   this.docBaseDir = "";

   // Relative path to the PIDoc system root directory
   // The default is valid for all document classes except PIJSObjectDoc
   this.sysRelDir = "../..";

   // Temporary working files for LaTeX equation rendering
   this.tmpTeXFilePath = File.systemTempDirectory + '/' + PIDOC_TMP_FILE_NAME + ".tex";
   this.tmpDVIFilePath = File.systemTempDirectory + '/' + PIDOC_TMP_FILE_NAME + ".dvi";
   this.tmpEPSFilePath = File.systemTempDirectory + '/' + PIDOC_TMP_FILE_NAME + ".eps";
   this.tmpPDFFilePath = File.systemTempDirectory + '/' + PIDOC_TMP_FILE_NAME + ".pdf";

   // Reset the document and prepare it for a new compilation
   this.reset = function()
   {
      // Base directory path of the PixInsight documentation system
      this.docBaseDir = workingData.baseDirectory.trim();
      if ( this.docBaseDir.isEmpty() )
      {
         this.docBaseDir = getEnvironmentVariable( "PXI_DOCDIR" );
         if ( this.docBaseDir.isEmpty() )
            throw new Error( "*** System error: Unable to retrieve the platform documentation base directory." );
      }

      if ( !File.directoryExists( this.docBaseDir ) )
         throw new Error( "The documentation base directory does not exist: " + this.docBaseDir );

      // Check for existence of required system directories
      if ( !PIDocSystem.isValidSystem( this.docBaseDir ) )
         throw new Error( "The output base directory \'" + this.docBaseDir + "\' does not seem to be the root of a valid PIDoc system." );

      this.filePath = '';
      this.documentClass = PIDOC_CLASS_UNKNOWN;
      this.title = '';
      this.subtitle = '';
      this.authors = new Array;
      this.copyright = '';
      this.keywords = new Array;
      this.brief = '';
      this.summary = null;
      this.introduction = null;
      this.description = null;
      this.methodology = null;
      this.results = null;
      this.discussion = null;
      this.usage = null;
      this.acknowledgments = null;
      this.sections = new Array;
      this.currentSection = null;
      this.references = new Array;
      this.relatedTools = new Array;
      this.relatedScripts = new Array;
      this.relatedObjects = new Array;
      this.relatedDocuments = new Array;
      this.relatedResources = new Array;
      this.toolId = ''
      this.parameters = new Array;
      this.moduleId = '';
      this.categories = new Array;
      this.objectId = '';
      this.properties = new Array;
      this.staticProperties = new Array;
      this.eventHandlers = new Array;
      this.constructors = new Array;
      this.methods = new Array;
      this.staticMethods = new Array;
      this.constants = new Array;
      this.defines = new Array;
      this.inherits = new Array;
      this.inherited = new Array;
      this.required = new Array;
      this.docId = '';
      this.xhtmlSource = '';
      this.xhtmlInitialized = false;
      this.equations.clear();
      this.equationNumber = 0;
      this.equationNames = new Array;
      this.figureNumber = 0;
      this.figureNames = new Array;
      this.tableNumber = 0;
      this.tableNames = new Array;
      this.images = new Array;
      this.labels = new Array;
      this.labelReferences = new Array;
      this.noAuthors = false;
      this.noCategories = false;
      this.noKeywords = false;
      this.noToc = false;
      this.noCopyright = false;
      this.warningCount = 0;
      this.beenMade = false;
   };

   // Returns the full absolute file path for the specified path. Relative
   // paths are considered relative to the directory of the current source file.
   this.fullFilePath = function( filePath )
   {
      let path = filePath.trim();
      if ( path.isEmpty() )
         return "";
      let isRelative = path[0] != '/'
#ifeq __PI_PLATFORM__ MSWINDOWS
               // deal with Windows drive letters
               && (path.length == 1 || path[1] != ':')
#endif
               ;
      if ( isRelative )
      {
         let dir = File.extractDrive( this.filePath ) + File.extractDirectory( this.filePath );
         if ( dir[dir.length-1] != '/' )
            dir += '/';
         path = dir + path;
      }
      return File.fullPath( path );
   };

   this.uniqueId = function()
   {
      let N = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      let n = N.length - 1;
      let id = "";
      for ( let i = 0; i < 16; ++i )
         id += N.charAt( Math.round( Math.random()*n ) );
      return id;
   };

   this.internalLabel = function( id )
   {
      return "__" + id.trim() + "__";
   };

   this.internalNumberedLabel = function( type, number )
   {
      return this.internalLabel( type + "_" + number.toString() );
   };

   this.encodedSymbolicReference = function( type, name, tokens, index )
   {
      // <REFMARK><type>:<name>:<file>:<line><REFMARK>
      let j = 0;
      for ( ; j < name.length; ++j )
         if ( !name.isIdChar( j ) )
            break;
      if ( j == 0 )
         throw new ParseError( "Invalid " + type + " identifier.", tokens, index );
      let id = name.substring( 0, j );
      let text = name.substring( j ).toXhtml();
      let location = new DocumentLocation( tokens, index );
      let file = location.filePath;
      let line = location.lineNumber.toString();
      let ref = String.fromCharCode( REFMARK );
      let sep = String.fromCharCode( SEPMARK );
      return ref + type + sep + id + sep + file + sep + line + ref + text;
   };

   // Write a warning message
   this.warning = function( message, tokensOrLocation, index )
   {
      ++this.warningCount;

      let text = "<end><cbr><raw>** Warning: ";
      if ( tokensOrLocation != undefined )
      {
         let location = new DocumentLocation( tokensOrLocation, index );
         text += location.filePath + " (" + (location.lineNumber + 1).toString() + "): ";
      }
      console.warningln( text + message + "</raw>" );

      if ( this.abortOnWarning )
         throw new ParseError( "*** Aborting on warning.", tokensOrLocation, index );
   };

   // Write an informative message
   this.message = function( message )
   {
      console.noteln( "<end><cbr><raw>* " + message + "</raw>" );
   };

   this.actionMessage = function( actionMessage )
   {
      console.writeln( "<end><cbr><raw>==> " + actionMessage + "</raw>" );
   }

   // Document classification

   this.isGenericDocument = function()
   {
      return this.documentClass == PIDOC_CLASS_GENERIC;
   };

   this.isToolDocument = function()
   {
      return this.documentClass == PIDOC_CLASS_TOOL;
   };

   this.isScriptDocument = function()
   {
      return this.documentClass == PIDOC_CLASS_SCRIPT;
   };

   this.isJSObjectDocument = function()
   {
      return this.documentClass == PIDOC_CLASS_JSOBJECT;
   };

   // Required CSS file for the current document type

   this.styleSheet = function()
   {
      switch ( this.documentClass )
      {
      default: // ?!
      case PIDOC_CLASS_GENERIC:
         return "pidoc-generic.css";
      case PIDOC_CLASS_TOOL:
      case PIDOC_CLASS_SCRIPT:
         return "pidoc-tool.css";
      case PIDOC_CLASS_JSOBJECT:
         return "pidoc-pjsr.css";
      }
   };

   // PIGenericDoc class

   this.setFilePath = function( filePath )
   {
      this.filePath = filePath.trim();
   };

   this.setClass = function( documentClass, tokens, index )
   {
      if ( this.documentClass != PIDOC_CLASS_UNKNOWN )
         throw new ParseError( "Redefinition of the document's class.", tokens, index );

      documentClass = documentClass.trim();
      switch ( documentClass )
      {
      case "PIGenericDoc":
         this.documentClass = PIDOC_CLASS_GENERIC;
         break;
      case "PIToolDoc":
         this.documentClass = PIDOC_CLASS_TOOL;
         break;
      case "PIScriptDoc":
         this.documentClass = PIDOC_CLASS_SCRIPT;
         break;
      case "PIJSObjectDoc":
         this.documentClass = PIDOC_CLASS_JSOBJECT;
         this.sysRelDir = "../../..";
         workingData.numberSections = false;
         break;
      default:
         throw new ParseError( "Unknown document class \'" + documentClass + "\'", tokens, index );
      }
   };

   this.setTitle = function( title, tokens, index )
   {
      if ( this.isToolDocument() || this.isScriptDocument() || this.isJSObjectDocument() )
         throw new ParseError( "Custom titles can only be defined for generic documents.", tokens, index );
      if ( !this.title.isEmpty() )
         throw new ParseError( "Redefinition of the document's title.", tokens, index );
      this.title = title.trim().replace( /\s+/g, ' ' );
   };

   this.setSubtitle = function( subtitle, tokens, index )
   {
      if ( this.isToolDocument() || this.isScriptDocument() || this.isJSObjectDocument() )
         throw new ParseError( "Custom titles can only be defined for generic documents.", tokens, index );
      if ( !this.subtitle.isEmpty() )
         throw new ParseError( "Redefinition of the document's subtitle.", tokens, index );
      this.subtitle = subtitle.trim().replace( /\s+/g, ' ' );
   };

   this.addAuthor = function( author, tokens, index )
   {
      author = author.trim();
      if ( author.isEmpty() )
         return;
      if ( this.authors.indexOf( author ) >= 0 )
         throw new ParseError( "Duplicate author '" + author + "'", tokens, index );
      this.authors.push( author.trim() );
   };

   this.setCopyright = function( copyright, tokens, index )
   {
      if ( !this.copyright.isEmpty() )
         throw new ParseError( "Redefinition of the document's copyright.", tokens, index );

      if ( copyright.indexOf( "&copy;" ) < 0 && copyright.indexOf( "Copyright" ) < 0 )
      {
         let p = copyright.indexOf( "<p>" );
         if ( p >= 0 )
            copyright = copyright.substring( 0, p ) +
                           "<p>Copyright &copy; " + copyright.substring( p+3 );
      }
      this.copyright = copyright.trim();
   };

   this.addKeyword = function( keyword, tokens, index )
   {
      keyword = keyword.trim();
      if ( keyword.isEmpty() )
         return;
      if ( this.keywords.indexOf( keyword ) >= 0 )
         throw new ParseError( "Duplicate keyword '" + keyword + "'", tokens, index );
      this.keywords.push( keyword.trim() );
   };

   this.setBrief = function( brief, tokens, index )
   {
      if ( !this.brief.isEmpty() )
         throw new ParseError( "Redefinition of the Brief Description section.", tokens, index );

      brief = brief.trim();
      if ( brief.length > 256 )
         this.warning( "The specified 'brief' description has more than 256 characters.", tokens, index );

      let p = brief.indexOf( "<p" );
      if ( p >= 0 )
         if ( brief.substring( p+2 ).indexOf( "<p>" ) > 0 || brief.indexOf( "<br" ) >= 0 )
            this.warning( "Defining a 'brief' description across multiple lines.", tokens, index );
      this.brief = brief;
   };

   this.beginSection = function( sectionId, title, tokens, index )
   {
      if ( this.currentSection )
         throw new ParseError( "A top-level document section is already being defined: '" + this.currentSection.title + "'.", tokens, index );

      switch ( sectionId )
      {
      case "abstract":
      case "methods":
      case "results":
      case "discussion":
         if ( !this.isGenericDocument() )
            throw new ParseError( "The " + title + " section is only available for generic documents.", tokens, index );
         break;
      case "description":
         if ( this.isGenericDocument() )
            throw new ParseError( "The " + title + " section is not available for generic documents.", tokens, index );
         break;
      case "usage":
         if ( !this.isToolDocument() && !this.isScriptDocument() )
            throw new ParseError( "The " + title + " section is only available for tool and script documents.", tokens, index );
         break;
      case "introduction":
      case "acknowledgments":
      case "section":
         break;
      default:
         throw new Error( "*** Internal error: Unknown section identifier '" + sectionId + "'." );
      }

      let alreadyDefined = false;
      switch ( sectionId )
      {
      case "abstract":
         if ( this.summary )
            alreadyDefined = true;
         break;
      case "introduction":
         if ( this.introduction )
            alreadyDefined = true;
         break;
      case "description":
         if ( this.description )
            alreadyDefined = true;
         break;
      case "methods":
         if ( this.methodology )
            alreadyDefined = true;
         break;
      case "results":
         if ( this.results )
            alreadyDefined = true;
         break;
      case "discussion":
         if ( this.discussion )
            alreadyDefined = true;
         break;
      case "usage":
         if ( this.usage )
            alreadyDefined = true;
         break;
      case "acknowledgments":
         if ( this.acknowledgments )
            alreadyDefined = true;
         break;
      default:
         for ( let i = 0; i < this.sections.length; ++i )
            if ( this.sections[i].title == title )
            {
               alreadyDefined = true;
               break;
            }
         break;
      }

      if ( alreadyDefined )
         throw new ParseError( "Redefinition of the " + title + " section.", tokens, index );

      this.currentSection = new Section( null, title, sectionId );

      switch ( sectionId )
      {
      case "abstract":
         this.summary = this.currentSection;
         break;
      case "introduction":
         this.introduction = this.currentSection;
         break;
      case "description":
         this.description = this.currentSection;
         break;
      case "methods":
         this.methodology = this.currentSection;
         break;
      case "results":
         this.results = this.currentSection;
         break;
      case "discussion":
         this.discussion = this.currentSection;
         break;
      case "usage":
         this.usage = this.currentSection;
         break;
      case "acknowledgments":
         this.acknowledgments = this.currentSection;
         break;
      default:
         this.sections.push( this.currentSection );
         break;
      }
   };

   this.endSection = function( text, tokens, index )
   {
      if ( !this.currentSection )
         throw new Error( "*** Internal error: Invalid section termination: No section is being defined." );
      if ( this.currentSection.parent )
         throw new Error( "*** Internal error: Invalid section termination: A subsection is being defined." );

      this.currentSection.end( text );
      this.currentSection = this.currentSection.parent;
   };

   this.beginSubsection = function( title, tokens, index, noIndex )
   {
      if ( !this.currentSection )
         throw new ParseError( "No top-level document section is being defined.", tokens, index );
      if ( this.currentSection.hasSubsection( title ) )
         throw new ParseError( "Redefinition of the '" + title + "' subsection.", tokens, index );

      this.currentSection = new Section( this.currentSection, title, '', noIndex );
   };

   this.endSubsection = function( text, tokens, index )
   {
      if ( !this.currentSection )
         throw new Error( "*** Internal error: Invalid subsection termination: No section is being defined." );
      if ( !this.currentSection.parent )
         throw new Error( "*** Internal error: Invalid subsection termination: No subsection is being defined." );

      this.currentSection.end( text );
      this.currentSection = this.currentSection.parent;
   };

   this.referenceNumberForName = function( name )
   {
      for ( let i = 0; i < this.references.length; ++i )
         if ( this.references[i].name == name )
         {
            ++this.references[i].count;
            return i+1;
         }
      return -1;
   };

   this.addReference = function( name, text, tokens, index )
   {
      for ( let i = 0; i < this.references.length; ++i )
         if ( this.references[i].name == name )
            throw new ParseError( "Duplicate reference '" + name + "'", tokens, index );
      this.references.push( new Reference( name, text ) );
   };

   this.addRelatedTool = function( toolId, tokens, index )
   {
      toolId = toolId.trim();
      if ( toolId.isEmpty() )
         return;
      let toolUri = this.sysRelDir + "/tools/" + toolId + "/" + toolId + ".html";
      for ( let i = 0; i < this.relatedTools.length; ++i )
         if ( this.relatedTools[i].uri == toolUri )
            throw new ParseError( "Duplicate related tool '" + toolId + "'", tokens, index );
      if ( !this.toolDocumentExists( toolId ) )
         this.warning( "Reference to nonexistent tool document: " + toolId, tokens, index );
      this.relatedTools.push( new RelatedResource( toolUri, toolId ) );
   };

   this.addRelatedScript = function( scriptId, tokens, index )
   {
      scriptId = scriptId.trim();
      if ( scriptId.isEmpty() )
         return;
      let scriptUri = this.sysRelDir + "/scripts/" + scriptId + "/" + scriptId + ".html";
      for ( let i = 0; i < this.relatedScripts.length; ++i )
         if ( this.relatedScripts[i].uri == scriptUri )
            throw new ParseError( "Duplicate related script '" + scriptId + "'", tokens, index );
      if ( !this.scriptDocumentExists( scriptId ) )
         this.warning( "Reference to nonexistent script document: " + scriptId, tokens, index );
      this.relatedScripts.push( new RelatedResource( scriptUri, scriptId ) );
   };

   this.addRelatedObject = function( objectId, tokens, index )
   {
      objectId = objectId.trim();
      if ( objectId.isEmpty() )
         return;
      let objectUri = this.sysRelDir + "/pjsr/objects/" + objectId + "/" + objectId + ".html";
      for ( let i = 0; i < this.relatedObjects.length; ++i )
         if ( this.relatedObjects[i].uri == objectUri )
            throw new ParseError( "Duplicate related object '" + objectId + "'", tokens, index );
      if ( !this.jsObjectDocumentExists( objectId ) )
         this.warning( "Reference to nonexistent JavaScript object document: " + objectId, tokens, index );
      this.relatedObjects.push( new RelatedResource( objectUri, objectId ) );
   };

   this.addRelatedDocument = function( documentId, documentItem, tokens, index )
   {
      documentId = documentId.trim();
      if ( documentId.isEmpty() )
         return;
      let documentUri = this.sysRelDir + "/docs/" + documentId + "/" + documentId + ".html";
      for ( let i = 0; i < this.relatedDocuments.length; ++i )
         if ( this.relatedDocuments[i].uri == documentUri )
            throw new ParseError( "Duplicate related document '" + documentId + "'", tokens, index );
      if ( !this.genericDocumentExists( documentId ) )
         this.warning( "Reference to nonexistent document: " + documentId, tokens, index );
      this.relatedDocuments.push( new RelatedResource( documentUri, documentItem ) );
   };

   this.addRelatedResource = function( resourceUri, resourceItem, tokens, index )
   {
      resourceUri = resourceUri.trim();
      for ( let i = 0; i < this.relatedResources.length; ++i )
         if ( this.relatedResources[i].uri == resourceUri )
            throw new ParseError( "Duplicate related resource '" + resourceUri + "'", tokens, index );
      this.relatedResources.push( new RelatedResource( resourceUri, resourceItem ) );
   };

   // PIToolDoc and PIScriptDoc classes

   this.setToolId = function( toolId, tokens, index )
   {
      if ( !this.isToolDocument() )
         throw new ParseError( "The tool identifier property is only available for tool documents.", tokens, index );
      if ( !this.toolId.isEmpty() )
         throw new ParseError( "Redefinition of the tool identifier property.", tokens, index );
      this.toolId = toolId.removeHtmlTags().trim();
      if ( this.title.isEmpty() )
         this.title = "<h1>" + this.toolId + "</h1>\n";
   };

   this.setScriptId = function( scriptId, tokens, index )
   {
      if ( !this.isScriptDocument() )
         throw new ParseError( "The script identifier property is only available for script documents.", tokens, index );
      if ( !this.toolId.isEmpty() )
         throw new ParseError( "Redefinition of the script identifier property.", tokens, index );
      this.toolId = scriptId.removeHtmlTags().trim();
      if ( this.title.isEmpty() )
         this.title = "<h1>" + this.toolId + "</h1>\n";
   };

   this.addParameter = function( parameterName, parameterDescription, tokens, index )
   {
      if ( !this.isToolDocument() && !this.isScriptDocument() )
         throw new ParseError( "Only tool and script documents can define parameter sections.", tokens, index );
      this.parameters.push( new ParameterSection( parameterName, parameterDescription ) );
   };

   // PIToolDoc class

   this.setModuleId = function( moduleId, tokens, index )
   {
      if ( !this.isToolDocument() )
         throw new ParseError( "The module identifier property is only available for tool documents.", tokens, index );
      if ( !this.moduleId.isEmpty() )
         throw new ParseError( "Redefinition of the module identifier property.", tokens, index );
      this.moduleId = moduleId.removeHtmlTags().trim();
   };

   this.addCategory = function( categoryId, tokens, index )
   {
      if ( !this.isToolDocument() )
         throw new ParseError( "The tool category property is only available for tool documents.", tokens, index );
      categoryId = categoryId.trim();
      if ( categoryId.isEmpty() )
         return;
      if ( this.categories.indexOf( categoryId ) >= 0 )
         throw new ParseError( "Duplicate tool category \'" + categoryId + "\'", tokens, index );
      this.categories.push( categoryId );
   };

   // PIJSObjectDoc class

   this.setObjectId = function( objectId, tokens, index )
   {
      if ( !this.isJSObjectDocument() )
         throw new ParseError( "The object identifier property is only available for JavaScript object reference documents.", tokens, index );
      if ( !this.objectId.isEmpty() )
         throw new ParseError( "Redefinition of the object identifier property.", tokens, index );
      this.objectId = objectId.removeHtmlTags().trim();
      if ( this.title.isEmpty() )
         this.title = "<h1>" + this.objectId + "</h1>\n";
   };

   this.hasPropertyIdentifier = function( id )
   {
      for ( let i = 0; i < this.properties.length; ++i )
         if ( this.properties[i].id == id )
            return true;
      for ( let i = 0; i < this.staticProperties.length; ++i )
         if ( this.staticProperties[i].id == id )
            return true;
      for ( let i = 0; i < this.eventHandlers.length; ++i )
         if ( this.eventHandlers[i].id == id )
            return true;
      for ( let i = 0; i < this.methods.length; ++i )
         if ( this.methods[i].id == id )
            return true;
      for ( let i = 0; i < this.staticMethods.length; ++i )
         if ( this.staticMethods[i].id == id )
            return true;
      for ( let i = 0; i < this.constants.length; ++i )
         if ( this.constants[i].id == id )
            return true;
      return false;
   };

   this.hasMethodIdentifier = function( id, isStatic )
   {
      for ( let i = 0; i < this.properties.length; ++i )
         if ( this.properties[i].id == id )
            return true;
      for ( let i = 0; i < this.staticProperties.length; ++i )
         if ( this.staticProperties[i].id == id )
            return true;
      for ( let i = 0; i < this.eventHandlers.length; ++i )
         if ( this.eventHandlers[i].id == id )
            return true;

      if ( isStatic )
      {
         for ( let i = 0; i < this.methods.length; ++i )
            if ( this.methods[i].id == id )
               return true;
      }
      else
      {
         for ( let i = 0; i < this.staticMethods.length; ++i )
            if ( this.staticMethods[i].id == id )
               return true;
      }

      for ( let i = 0; i < this.constants.length; ++i )
         if ( this.constants[i].id == id )
            return true;

      return false;
   };

   this.parsePropertyFormalDescription = function( formalDescription, tokens, index )
   {
      // <data-type> <object-id>.<property-id>
      let s = formalDescription.indexOf( ' ' );
      if ( s < 0 )
         throw new ParseError( "Invalid property formal description: No data type specified.", tokens, index );
      let d = formalDescription.indexOf( '.', s+1 );
      if ( d < 0 )
         throw new ParseError( "Invalid property formal description: No parent object specified", tokens, index );
      let objectId = formalDescription.substring( s+1, d ).trim();
      if ( objectId.isEmpty() )
         throw new ParseError( "Invalid property formal description: Missing parent object identifier", tokens, index );
      if ( objectId != this.objectId )
         throw new ParseError( "Invalid property formal description: Attempt to define a property of another object \'" + objectId + "\'", tokens, index );
      let propertyId = formalDescription.substring( d+1 ).trim();
      if ( propertyId.isEmpty() )
         throw new ParseError( "Invalid property formal description: Missing property identifier.", tokens, index );
      if ( this.hasPropertyIdentifier( propertyId ) )
         throw new ParseError( "Duplicate object property \'" + propertyId + "\'", tokens, index );
      return propertyId;
   };

   this.parseMethodFormalDescription = function( formalDescription, isStatic, tokens, index )
   {
      // <data-type> <object-id>.<method-id>( ... )
      let s = formalDescription.indexOf( ' ' );
      if ( s < 0 )
         throw new ParseError( "Invalid method formal description: No return data type specified.", tokens, index );
      let d = formalDescription.indexOf( '.', s+1 );
      if ( d < 0 )
         throw new ParseError( "Invalid method formal description: No parent object specified", tokens, index );
      let objectId = formalDescription.substring( s+1, d ).trim();
      if ( objectId.isEmpty() )
         throw new ParseError( "Invalid method formal description: Missing parent object identifier", tokens, index );
      if ( objectId != this.objectId )
         throw new ParseError( "Invalid method formal description: Attempt to define a method of another object \'" + objectId + "\'", tokens, index );

      let p1 = formalDescription.indexOf( '(', d+1 );
      if ( p1 < 0 )
         throw new ParseError( "Invalid method formal description: Missing left parenthesis.", tokens, index );
      let p2 = formalDescription.lastIndexOf( ')' );
      if ( p2 < 0 )
         throw new ParseError( "Invalid method formal description: Missing right parenthesis.", tokens, index );
      if ( p2 != formalDescription.length-1 )
         throw new ParseError( "Invalid method formal description: Extra tokens after right parenthesis.", tokens, index );

      let methodId = formalDescription.substring( d+1, p1 ).trim();
      if ( methodId.isEmpty() )
         throw new ParseError( "Invalid method formal description: Missing method identifier.", tokens, index );
      if ( this.hasMethodIdentifier( methodId, isStatic ) )
         throw new ParseError( "Duplicate object method \'" + methodId + "\'", tokens, index );
      return methodId;
   };

   this.parseConstructorFormalDescription = function( formalDescription, tokens, index )
   {
      // new object-id( ... )
      let s = formalDescription.indexOf( ' ' );
      if ( s < 0 || formalDescription.substring( 0, s ).trim() != "new" )
         throw new ParseError( "Invalid constructor formal description: Missing \'new\' operator.", tokens, index );

      let p1 = formalDescription.indexOf( '(', s+1 );
      if ( p1 < 0 )
         throw new ParseError( "Invalid constructor formal description: Missing left parenthesis.", tokens, index );
      let p2 = formalDescription.lastIndexOf( ')' );
      if ( p2 < 0 )
         throw new ParseError( "Invalid constructor formal description: Missing right parenthesis.", tokens, index );
      if ( p2 != formalDescription.length-1 )
         throw new ParseError( "Invalid constructor formal description: Extra tokens after right parenthesis.", tokens, index );

      let objectId = formalDescription.substring( s+1, p1 ).trim();
      if ( objectId.isEmpty() )
         throw new ParseError( "Invalid constructor formal description: Missing object identifier.", tokens, index );
      if ( objectId != this.objectId )
         throw new ParseError( "Invalid constructor formal description: Attempt to define a constructor of another object \'" + objectId + "\'", tokens, index );
      return objectId;
   };

   this.parseDefineFormalDescription = function( formalDescription, tokens, index )
   {
      // #define <id> <value>
      let s1 = formalDescription.indexOf( ' ' );
      if ( s1 < 0 || formalDescription.substring( 0, s1 ).trim() != "#define" )
         throw new ParseError( "Invalid predefined constant formal description: Missing \'#define\' directive.", tokens, index );
      let s2 = formalDescription.indexOf( ' ', s1+1 );
      if ( s2 < 0 )
         throw new ParseError( "Invalid predefined constant formal description: Missing macro identifier.", tokens, index );
      let macroId = formalDescription.substring( s1+1, s2 ).trim();
      let value = formalDescription.substring( s2+1 ).trim();
      if ( value.isEmpty() )
         throw new ParseError( "Invalid predefined constant formal description: Missing macro value.", tokens, index );
      return macroId;
   };

   this.parseRequiredFormalDescription = function( formalDescription, tokens, index )
   {
      // #include \<include-file\>
      let s1 = formalDescription.indexOf( ' ' );
      if ( s1 < 0 || formalDescription.substring( 0, s1 ).trim() != "#include" )
         throw new ParseError( "Invalid required file formal description: Missing \'#include\' directive.", tokens, index );
      let includeSpec = formalDescription.substring( s1+1 ).trim();
      if ( includeSpec.isEmpty() )
         throw new ParseError( "Invalid required file formal description: Missing included file specification.", tokens, index );
      if ( !includeSpec.startsWith( '<' ) || !includeSpec.endsWith( '>' ) )
         throw new ParseError( "Bad required file specification \'" + includeSpec + "\'", tokens, index );
      if ( this.required.indexOf( includeSpec ) >= 0 )
         throw new ParseError( "Duplicate required file specification \'" + includeSpec + "\'", tokens, index );
      return includeSpec;
   };

   this.addProperty = function( formalDescription, description, label, readOnly, tokens, index )
   {
      if ( !this.isJSObjectDocument() )
         throw new ParseError( "Only JavaScript object reference documents can define property sections.", tokens, index );
      if ( this.objectId.isEmpty() )
         throw new ParseError( "No object identifier has been defined.", tokens, index );

      formalDescription = formalDescription.trim();
      if ( formalDescription.isEmpty() )
         throw new ParseError( "Missing property formal description.", tokens, index );

      if ( !label.isEmpty() )
         this.addLabel( label, tokens, index );
      this.properties.push( new ObjectPropertySection(
            this.parsePropertyFormalDescription( formalDescription, tokens, index ), formalDescription, description, label, readOnly ) );
   };

   this.addStaticProperty = function( formalDescription, description, label, readOnly, tokens, index )
   {
      if ( !this.isJSObjectDocument() )
         throw new ParseError( "Only JavaScript object reference documents can define static property sections.", tokens, index );
      if ( this.objectId.isEmpty() )
         throw new ParseError( "No object identifier has been defined.", tokens, index );

      formalDescription = formalDescription.trim();
      if ( formalDescription.isEmpty() )
         throw new ParseError( "Missing static property formal description.", tokens, index );

      if ( !label.isEmpty() )
         this.addLabel( label, tokens, index );
      this.staticProperties.push( new ObjectPropertySection(
            this.parsePropertyFormalDescription( formalDescription, tokens, index ), formalDescription, description, label, readOnly ) );
   };

   this.addEventHandler = function( formalDescription, description, label, tokens, index )
   {
      if ( !this.isJSObjectDocument() )
         throw new ParseError( "Only JavaScript object reference documents can define event handler sections.", tokens, index );
      if ( this.objectId.isEmpty() )
         throw new ParseError( "No object identifier has been defined.", tokens, index );

      formalDescription = formalDescription.trim();
      if ( formalDescription.isEmpty() )
         throw new ParseError( "Missing event handler formal description.", tokens, index );

      if ( !label.isEmpty() )
         this.addLabel( label, tokens, index );
      this.eventHandlers.push( new ObjectPropertySection(
            this.parseMethodFormalDescription( formalDescription, false/*static*/, tokens, index ), formalDescription, description, label ) );
   };

   this.addConstructor = function( formalDescription, description, label, tokens, index )
   {
      if ( !this.isJSObjectDocument() )
         throw new ParseError( "Only JavaScript object reference documents can define constructor sections.", tokens, index );
      if ( this.objectId.isEmpty() )
         throw new ParseError( "No object identifier has been defined.", tokens, index );

      formalDescription = formalDescription.trim();
      if ( formalDescription.isEmpty() )
         throw new ParseError( "Missing constructor formal description.", tokens, index );
      if ( formalDescription.indexOf( "new " ) != 0 )
         throw new ParseError( "A constructor's formal description must start with a \'new <object-id>\' sequence.", tokens, index );

      if ( !label.isEmpty() )
         this.addLabel( label, tokens, index );
      this.constructors.push( new ObjectPropertySection(
            this.parseConstructorFormalDescription( formalDescription, tokens, index ), formalDescription, description, label ) );
   };

   this.addMethod = function( formalDescription, description, label, tokens, index )
   {
      if ( !this.isJSObjectDocument() )
         throw new ParseError( "Only JavaScript object reference documents can define method sections.", tokens, index );
      if ( this.objectId.isEmpty() )
         throw new ParseError( "No object identifier has been defined.", tokens, index );

      formalDescription = formalDescription.trim();
      if ( formalDescription.isEmpty() )
         throw new ParseError( "Missing method formal description.", tokens, index );

      if ( !label.isEmpty() )
         this.addLabel( label, tokens, index );
      this.methods.push( new ObjectPropertySection(
            this.parseMethodFormalDescription( formalDescription, false/*static*/, tokens, index ), formalDescription, description, label ) );
   };

   this.addStaticMethod = function( formalDescription, description, label, tokens, index )
   {
      if ( !this.isJSObjectDocument() )
         throw new ParseError( "Only JavaScript object reference documents can define static method sections.", tokens, index );
      if ( this.objectId.isEmpty() )
         throw new ParseError( "No object identifier has been defined.", tokens, index );

      formalDescription = formalDescription.trim();
      if ( formalDescription.isEmpty() )
         throw new ParseError( "Missing static method formal description.", tokens, index );

      if ( !label.isEmpty() )
         this.addLabel( label, tokens, index );
      this.staticMethods.push( new ObjectPropertySection(
            this.parseMethodFormalDescription( formalDescription, true/*static*/, tokens, index ), formalDescription, description, label ) );
   };

   this.addConstant = function( formalDescription, description, label, tokens, index )
   {
      if ( !this.isJSObjectDocument() )
         throw new ParseError( "Only JavaScript object reference documents can define constant property sections.", tokens, index );
      if ( this.objectId.isEmpty() )
         throw new ParseError( "No object identifier has been defined.", tokens, index );

      formalDescription = formalDescription.trim();
      if ( formalDescription.isEmpty() )
         throw new ParseError( "Missing constant property formal description.", tokens, index );

      if ( !label.isEmpty() )
         this.addLabel( label, tokens, index );
      this.constants.push( new ObjectPropertySection(
            this.parsePropertyFormalDescription( formalDescription, tokens, index ), formalDescription, description, label ) );
   };

   this.addDefine = function( formalDescription, description, label, tokens, index )
   {
      if ( !this.isJSObjectDocument() )
         throw new ParseError( "Only JavaScript object reference documents can define predefined constant sections.", tokens, index );
      if ( this.objectId.isEmpty() )
         throw new ParseError( "No object identifier has been defined.", tokens, index );

      formalDescription = formalDescription.trim();
      if ( formalDescription.isEmpty() )
         throw new ParseError( "Missing predefined constant formal description.", tokens, index );

      if ( !label.isEmpty() )
         this.addLabel( label, tokens, index );
      this.defines.push( new ObjectPropertySection(
            this.parseDefineFormalDescription( formalDescription, tokens, index ), formalDescription, description, label ) );
   };

   this.addRequired = function( formalDescription, tokens, index )
   {
      if ( !this.isJSObjectDocument() )
         throw new ParseError( "Only JavaScript object reference documents can define required file sections.", tokens, index );
      if ( this.objectId.isEmpty() )
         throw new ParseError( "No object identifier has been defined.", tokens, index );
      formalDescription = formalDescription.trim();
      if ( formalDescription.isEmpty() )
         throw new ParseError( "Missing required file formal description.", tokens, index );
      this.required.push( this.parseRequiredFormalDescription( formalDescription, tokens, index ) );
   };

   this.addInherits = function( objectId, tokens, index )
   {
      if ( !this.isJSObjectDocument() )
         throw new ParseError( "Only JavaScript object reference documents can define inherited objects.", tokens, index );
      objectId = objectId.trim();
      if ( objectId.isEmpty() )
         return;
      let objectUri = this.sysRelDir + "/pjsr/objects/" + objectId + "/" + objectId + ".html";
      for ( let i = 0; i < this.inherits.length; ++i )
         if ( this.inherits[i].uri == objectUri )
            throw new ParseError( "Duplicate \\inherits object identifier \'" + objectId + "\'", tokens, index );
      for ( let i = 0; i < this.inherited.length; ++i )
         if ( this.inherited[i].uri == objectUri )
            throw new ParseError( "\'" + objectId + "\' cannot be inherited by and from this object.", tokens, index );
      if ( !this.jsObjectDocumentExists( objectId ) )
         this.warning( "Reference to nonexistent JavaScript object document: " + objectId, tokens, index );
      this.inherits.push( new RelatedResource( objectUri, objectId ) );
   };

   this.addInherited = function( objectId, tokens, index )
   {
      if ( !this.isJSObjectDocument() )
         throw new ParseError( "Only JavaScript object reference documents can define inherited objects.", tokens, index );
      objectId = objectId.trim();
      if ( objectId.isEmpty() )
         return;
      let objectUri = this.sysRelDir + "/pjsr/objects/" + objectId + "/" + objectId + ".html";
      for ( let i = 0; i < this.inherited.length; ++i )
         if ( this.inherited[i].uri == objectUri )
            throw new ParseError( "Duplicate \\inherited object identifier \'" + objectId + "\'", tokens, index );
      for ( let i = 0; i < this.inherits.length; ++i )
         if ( this.inherits[i].uri == objectUri )
            throw new ParseError( "\'" + objectId + "\' cannot be inherited by and from this object.", tokens, index );
      if ( !this.jsObjectDocumentExists( objectId ) )
         this.warning( "Reference to nonexistent JavaScript object document: " + objectId, tokens, index );
      this.inherited.push( new RelatedResource( objectUri, objectId ) );
   };

   // PIGenericDoc class

   this.setDocumentId = function( docId, tokens, index )
   {
      if ( !this.isGenericDocument() )
         throw new ParseError( "The document identifier property is only available for generic documents.", tokens, index );
      if ( !this.docId.isEmpty() )
         throw new ParseError( "Redefinition of the document identifier property.", tokens, index );
      this.docId = docId.removeHtmlTags().trim();
   };

   // Contents generation

   this.addImage = function( imageFilePath, tokens, index )
   {
      if ( this.images.indexOf( imageFilePath ) < 0 )
      {
         let suffix = imageFilePath.substring( imageFilePath.lastIndexOf( '.' ) ).toLowerCase();
         if ( suffix != ".jpg" && suffix != ".png" && suffix != ".svg" )
            this.warning( "Unsupported image type \'" + suffix + "\'; should be .jpg, .png or .svg.", tokens, index );
         this.images.push( imageFilePath );
         if ( !File.exists( imageFilePath ) )
            this.warning( "Reference to nonexistent image file: " + imageFilePath, tokens, index );
      }
   };

   this.currentEquationNumber = function()
   {
      return this.equationNumber;
   };

   this.equationNumberForName = function( name )
   {
      for ( let i = 0; i < this.equationNames.length; ++i )
         if ( this.equationNames[i].name == name )
         {
            ++this.equationNames[i].count;
            return this.equationNames[i].number;
         }
      return -1;
   };

   this.equationNumberAndFileNameForName = function( name )
   {
      for ( let i = 0; i < this.equationNames.length; ++i )
         if ( this.equationNames[i].name == name )
         {
            ++this.equationNames[i].count;
            return [this.equationNames[i].number, this.equationNames[i].fileName];
         }
      return undefined;
   };

   // Returns the file name of the generated (or cached) equation.
   this.addEquation = function( tex, scale, tokens, index )
   {
      function run( program )
      {
         let P = new ExternalProcess( program );
         if ( P.waitForStarted() )
         {
            processEvents();
            let n = 0;
            for ( ; n < 10 && !P.waitForFinished( 250 ); ++n )
            {
               console.write( "<end>\b" + "-/|\\".charAt( n%4 ) );
               processEvents();
            }
            if ( n > 0 )
               console.writeln( "<end>\b" );
         }
         if ( P.exitStatus == ProcessExitStatus_Crash || P.exitCode != 0 )
         {
            let e = P.stderr;
            throw new ParseError( "Process failed:\n" + program +
                                  ((e.length > 0) ? "\n" + e : ""), tokens, index );
         }
      }

      let location = new DocumentLocation( tokens, index );
      console.write( "<end><cbr>* Rendering equation (line " + (location.lineNumber+1).toString() + ")  " );

      tex = tex.trim();
      if ( tex.isEmpty() )
         throw new ParseError( "Empty equation" );

      let fileName = this.equations.find( tex, scale );
      if ( fileName != null )
      {
         console.writeln( "\b** cached" );
         return fileName;
      }

      fileName = this.equations.add( tex, scale );
      let filePath = File.systemTempDirectory + '/' + fileName;

      if ( workingData.renderEquations )
      {
         // Render a TeX source code string in SVG format.

         let f = new File;
         f.createForWriting( this.tmpTeXFilePath );
         f.outTextLn( "\\documentclass[landscape,a0]{article}" );
         f.outTextLn( "\\usepackage[paperwidth=100cm,paperheight=100cm,margin=0pt]{geometry}" );
         f.outTextLn( "\\pagestyle{empty}" );
         f.outTextLn( "\\begin{document}" );
         f.outTextLn( "\\noindent" );
         f.outTextLn( tex );
         f.outTextLn( "\\end{document}" );
         f.close();

         if ( scale == undefined || scale <= 0 )
            scale = 1;
         scale = Math.round( scale*1400 );

         run( "latex -interaction=batchmode -file-line-error -output-format=dvi -output-directory=/tmp " + this.tmpTeXFilePath );
         run( format( "dvips -q -e 0 -E -D %d -x %d -o ", scale, scale ) + this.tmpEPSFilePath + " " + this.tmpDVIFilePath );
         run( "epstopdf --outfile=" + this.tmpPDFFilePath + " " + this.tmpEPSFilePath );
         run( "pdf2svg " + this.tmpPDFFilePath + " " + filePath );
      }
      else
      {
         console.writeln( "\b** skipped" );
      }

      this.addImage( filePath, tokens, index );

      return fileName;
   };

   this.addNumberedEquation = function( tex, scale, name, tokens, index )
   {
      ++this.equationNumber;

      let validName = name != undefined && !name.isEmpty();
      if ( validName )
         for ( let i = 0; i < this.equationNames.length; ++i )
            if ( this.equationNames[i].name == name )
               throw new ParseError( "Duplicate equation name \'" + name + "\'.", tokens, index );

      let filePath = this.addEquation( tex, scale, tokens, index );

      if ( validName )
         this.equationNames.push( {name:name, number:this.equationNumber, fileName:File.extractNameAndSuffix( filePath ), count:0} );

      return filePath;
   };

   this.currentFigureNumber = function()
   {
      return this.figureNumber;
   };

   this.figureNumberForName = function( name )
   {
      for ( let i = 0; i < this.figureNames.length; ++i )
         if ( this.figureNames[i].name == name )
         {
            ++this.figureNames[i].count;
            return this.figureNames[i].number;
         }
      return -1;
   };

   this.addNumberedFigure = function( name, tokens, index )
   {
      ++this.figureNumber;

      if ( name != undefined && !name.isEmpty() )
      {
         for ( let i = 0; i < this.figureNames.length; ++i )
            if ( this.figureNames[i].name == name )
               throw new ParseError( "Duplicate figure name \'" + name + "\'.", tokens, index );
         this.figureNames.push( {name:name, number:this.figureNumber, count:0} );
      }
   };

   this.currentTableNumber = function()
   {
      return this.tableNumber;
   };

   this.tableNumberForName = function( name )
   {
      for ( let i = 0; i < this.tableNames.length; ++i )
         if ( this.tableNames[i].name == name )
         {
            ++this.tableNames[i].count;
            return this.tableNames[i].number;
         }
      return -1;
   };

   this.addNumberedTable = function( name, tokens, index )
   {
      ++this.tableNumber;

      if ( name != undefined && !name.isEmpty() )
      {
         for ( let i = 0; i < this.tableNames.length; ++i )
            if ( this.tableNames[i].name == name )
               throw new ParseError( "Duplicate table name \'" + name + "\'.", tokens, index );
         this.tableNames.push( {name:name, number:this.tableNumber, count:0} );
      }
   };

   this.addLabel = function( label, tokens, index )
   {
      if ( this.labels.filter( function( x ) { return x.label == label; } ).length > 0 )
         throw new ParseError( "Duplicate label '" + label + "'", tokens, index );
      this.labels.push( new LabelReference( label, tokens, index ) );
   };

   this.addLabelReference = function( label, tokens, index )
   {
      if ( this.labelReferences.filter( function( x ) { return x.label == label; } ).length == 0 )
         this.labelReferences.push( new LabelReference( label, tokens, index ) );
   };

   this.checkLabelReferences = function()
   {
      for ( let i = 0; i < this.labelReferences.length; ++i )
         if ( this.labels.filter( function( x ) { return x.label == this.labelReferences[i].label; }, this ).length == 0 )
            this.warning( "Reference to nonexistent label: '" + this.labelReferences[i].label + "'",
                          this.labelReferences[i].location, undefined );
      for ( let i = 0; i < this.labels.length; ++i )
         if ( this.labelReferences.filter( function( x ) { return x.label == this.labels[i].label; }, this ).length == 0 )
            this.warning( "Unreferenced label: '" + this.labels[i].label + "'",
                          this.labels[i].location, undefined );
   };

   this.beginXhtmlDocument = function()
   {
      if ( this.xhtmlInitialized )
         throw new Error( "*** Internal error: invalid XHTML document initialization." );
      this.xhtmlSource = "";
      this.xhtmlInitialized = true;
   };

   this.addXhtmlSource = function( xhtml )
   {
      if ( !this.xhtmlInitialized )
         throw new Error( "*** Internal error: invalid XHTML document generation." );
      this.xhtmlSource += xhtml;
   };

   this.endXhtmlDocument = function()
   {
      if ( !this.xhtmlInitialized )
         throw new Error( "*** Internal error: invalid XHTML document finalization." );

      let keywords = "";
      for ( let i = 0; i < this.keywords.length; ++i )
      {
         if ( i > 0 )
            keywords += ", ";
         keywords += this.keywords[i];
      }

      let authors = "";
      for ( let i = 0; i < this.authors.length; ++i )
      {
         if ( i > 0 )
            authors += " / ";
         authors += this.authors[i];
      }

      let title =
(this.isJSObjectDocument() ?
"PixInsight JavaScript Runtime" :
"PixInsight Reference Documentation") + " | " + this.title.removeHtmlTags().trim();

      this.xhtmlSource =
  "<!DOCTYPE html"
+ (workingData.generateHTML5 ?
  ">\n" :
  " PUBLIC \"-\/\/W3C\/\/DTD XHTML 1.0 Strict\/\/EN\" \"http:\/\/www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\">\n")
+ "<html xmlns=\"http:\/\/www.w3.org/1999/xhtml\">\n"
+ "<head>\n"
+ "   <meta http-equiv=\"content-type\" content=\"text/html; charset=UTF-8\" />\n"
+ "   <title>" + title + "</title>\n"
+ "   <meta name=\"keywords\" content=\"" + keywords + "\" />\n"
+ "   <meta name=\"author\" content=\"" + authors + "\" />\n"
+ "   <meta name=\"description\" content=\"" + this.brief.removeHtmlTags() + "\" />\n"
+ "   <meta name=\"robots\" content=\"INDEX,FOLLOW\" />\n"
+ "   <meta name=\"generator\" content=\""
+ TITLE
+ " script version "
+ VERSION
+ "\" />\n"
+ "   <script type=\"text/javascript\" src=\"" + this.sysRelDir + "/pidoc/scripts/pidoc-utility.js\"></script>\n"
+ "   <link type=\"text/css\" href=\"" + this.sysRelDir + "/pidoc/css/pidoc-common.css\" rel=\"stylesheet\" />\n"
+ "   <link type=\"text/css\" href=\"" + this.sysRelDir + "/pidoc/css/pidoc-highlight.css\" rel=\"stylesheet\" />\n"
+ "   <link type=\"text/css\" href=\"" + this.sysRelDir + "/pidoc/css/" + this.styleSheet() + "\" rel=\"stylesheet\" />\n"
+ "   <link rel=\"icon\" href=\"" + this.sysRelDir + "/pidoc/icons/pidoc-icon.png\" type=\"image/png\" />\n"
+ "   <link rel=\"shortcut icon\" href=\"" + this.sysRelDir + "/pidoc/icons/pidoc-icon.png\" type=\"image/png\" />\n"
+ "</head>\n"
+ "<body>\n"
+ "<script type=\"text/javascript\">\n"
+ "   pidoc_generateDynamicContents();\n"
+ "</script>\n\n"
+     this.xhtmlSource
+ "</body>\n"
+ "</html>\n";

      this.xhtmlInitialized = false;
   };

   this.hasXhtmlDocument = function()
   {
      return !this.xhtmlSource.isEmpty();
   };

   this.writeXhtmlDocument = function()
   {
      if ( this.xhtmlInitialized )
         throw new Error( "*** Internal error: Trying to write an incomplete XHTML document." );

      this.actionMessage( "Writing " + (workingData.generateHTML5 ? "HTML5" : "XHTML") + " document..." );

      this.createDirectoryIfDoesNotExist = function( dirPath )
      {
         if ( !File.directoryExists( dirPath ) )
         {
            File.createDirectory( dirPath, true/*createIntermediateDirs*/ );
            this.message( "Directory created: " + dirPath );
         }
      };

      this.backupFileIfExists = function( filePath )
      {
         if ( File.exists( filePath ) )
         {
            if ( !this.noBackups )
            {
               let backupFilePath = File.changeExtension( filePath, File.extractExtension( filePath ) + '~' );
               if ( File.exists( backupFilePath ) )
                  File.remove( backupFilePath );
               File.move( filePath, backupFilePath );
               this.message( "Backup file created: " + backupFilePath );
            }
            else
               this.message( "Existing file overwritten: " + filePath );
         }
      };

      this.copyFile = function( targetFilePath, sourceFilePath )
      {
         if ( File.exists( targetFilePath ) )
            File.remove( targetFilePath );
         File.copyFile( targetFilePath, sourceFilePath );
         this.message( "File copied: " + targetFilePath );
      };

      let docDir, outputFilePath;
      if ( this.isToolDocument() )
      {
         docDir = this.docBaseDir + "/tools/" + this.toolId;
         outputFilePath = docDir + '/' + this.toolId + ".html";
      }
      else if ( this.isScriptDocument() )
      {
         docDir = this.docBaseDir + "/scripts/" + this.toolId;
         outputFilePath = docDir + '/' + this.toolId + ".html";
      }
      else if ( this.isJSObjectDocument() )
      {
         docDir = this.docBaseDir + "/pjsr/objects/" + this.objectId;
         outputFilePath = docDir + '/' + this.objectId + ".html";
      }
      else // generic
      {
         docDir = this.docBaseDir + "/docs/" + this.docId;
         outputFilePath = docDir + '/' + this.docId + ".html";
      }

      this.createDirectoryIfDoesNotExist( docDir );
      this.backupFileIfExists( outputFilePath );

      let f = new File;
      f.createForWriting( outputFilePath );
      f.write( ByteArray.stringToUTF8( this.xhtmlSource ) );
      f.flush();
      f.close();
      this.message( "Output file created: " + outputFilePath );

      if ( this.images.length > 0 )
      {
         let imagesDir = docDir + "/images";
         this.createDirectoryIfDoesNotExist( imagesDir );

         for ( let i = 0; i < this.images.length; ++i )
            if ( File.exists( this.images[i] ) )
            {
               let targetImagePath = imagesDir + '/' +
                     File.extractName( this.images[i] ) + File.extractExtension( this.images[i] );
               this.backupFileIfExists( targetImagePath );
               this.copyFile( targetImagePath, this.images[i] );
            }
      }
   };

   // Executive document generator

   this.make = function( tokens, index )
   {
      if ( this.beenMade )
         throw new Error( "*** Internal Error: trying to re-make a document!" );

      // Prerequisites
      if ( this.isToolDocument() )
      {
         if ( this.toolId.isEmpty() )
            throw new ParseError( "No tool identifier has been specified (which is mandatory in a tool document).", tokens, index );
         if ( this.moduleId.isEmpty() )
            throw new ParseError( "No module identifier has been specified (which is mandatory in a tool document).", tokens, index );
         if ( this.categories.length <= 0 )
            throw new ParseError( "No categories have been specified (which are mandatory in a tool document).", tokens, index );
      }
      else if ( this.isScriptDocument() )
      {
         if ( this.toolId.isEmpty() )
            throw new ParseError( "No script identifier has been specified (which is mandatory in a script document).", tokens, index );
      }
      else if ( this.isJSObjectDocument() )
      {
         if ( this.objectId.isEmpty() )
            throw new ParseError( "No object identifier has been specified (which is mandatory in a JavaScript object reference document).", tokens, index );
      }
      else // generic
      {
         if ( this.docId.isEmpty() )
            throw new ParseError( "No document identifier has been specified (which is mandatory in a generic document).", tokens, index );
         if ( this.title.isEmpty() )
            throw new ParseError( "No document title has been specified.", tokens, index );
      }

      // Keywords should normally be defined for all documents
      if ( this.keywords.length <= 0 )
         this.warning( "No keywords have been specified.", tokens, index );

      // A brief description should be defined for all non-generic documents
      if ( !this.isGenericDocument() )
         if ( this.brief.isEmpty() )
            this.warning( "No brief description has been specified.", tokens, index );

      // All document classes have a title block
      this.makeTitle( tokens, index );

      // Optional table of contents
      if ( !this.noToc )
         this.makeToc( tokens, index );

      // Open the contents container
      this.addXhtmlSource( "<div id=\"" + this.internalLabel( "contents" ) + "\">\n\n" );

      // Optional Abstract section
      if ( this.isGenericDocument() )
         this.makeSummary( tokens, index );

      // Optional Introduction section
      this.makeIntroduction( tokens, index );

      // Optional Description section
      this.makeDescription( tokens, index );

      if ( this.isToolDocument() || this.isScriptDocument() )
      {
         // Optional Parameters section (automatic if any parameter has been defined)
         this.makeParameters( tokens, index );

         // Optional Usage section
         this.makeUsage( tokens, index );
      }
      else if ( this.isJSObjectDocument() )
      {
         // Instance properties
         this.makeProperties( tokens, index );

         // Static properties
         this.makeStaticProperties( tokens, index );

         // Event handlers
         this.makeEventHandlers( tokens, index );

         // Constructors
         this.makeConstructors( tokens, index );

         // Instance methods
         this.makeMethods( tokens, index );

         // Static methods
         this.makeStaticMethods( tokens, index );

         // Constant properties
         this.makeConstants( tokens, index );

         // #defined constants
         this.makeDefines( tokens, index );
      }
      else
      {
         // Optional Methods section
         this.makeMethodology( tokens, index );

         // Optional Results section
         this.makeResults( tokens, index );

         // Optional Discussion section
         this.makeDiscussion( tokens, index );
      }

      // Custom sections
      this.makeSections( tokens, index );

      // Optional Acknowledgments section
      this.makeAcknowledgments( tokens, index );

      // References section
      this.makeReferences( tokens, index );

      // Related Tools, Related Scripts, Related Objects and Related Resources sections
      this.makeRelated( tokens, index );

      // All document classes have a footer block
      this.makeFooter( tokens, index );

      // Close the contents container
      this.addXhtmlSource( "</div> <!-- contents -->\n\n" );

      // Second pass to solve all forwarded reference links
      this.solveReferences();

      // Clean up invalid markup elements
      this.cleanupMarkup();

      this.beenMade = true;
   };

   // Internal generators -- not to be called externally
   // I mean that these would be private member functions if this were C++.

   this.makeTitle = function( tokens, index )
   {
      this.actionMessage( "Generating title block..." );

      if ( this.title.isEmpty() )
         throw new Error( "*** Internal error: No document title has been defined." );

      this.addXhtmlSource( this.title + "\n" );

      if ( !this.subtitle.isEmpty() )
         this.addXhtmlSource( this.subtitle + "\n" );

      if ( !this.noAuthors )
         if ( this.authors.length > 0 )
         {
            this.addXhtmlSource( "<div id=\"authors\">\n" );
            this.addXhtmlSource( "<p>By " );
            for ( let i = 0; i < this.authors.length; ++i )
            {
               if ( i > 0 )
                  this.addXhtmlSource( " / " );
               this.addXhtmlSource( this.authors[i] );
            }
            this.addXhtmlSource( "</p>\n" );
            this.addXhtmlSource( "</div>\n\n" );
         }

      this.addXhtmlSource( "<hr class=\"separator\"/>\n\n" );

      if ( !this.brief.isEmpty() )
      {
         let brief = this.brief;
         let p = brief.lastIndexOf( "</p>" );
         if ( p > 0 )
            brief = brief.substring( 0, p )
                    + " <a href=\"#" + this.internalLabel( "contents" ) + "\">[more]</a>"
                    + brief.substring( p );
         this.addXhtmlSource( "<div id=\"brief\">\n" );
         this.addXhtmlSource( brief );
         this.addXhtmlSource( "</div>\n\n" );
      }

      if ( this.isToolDocument() )
         if ( !this.noCategories )
            if ( this.categories.length > 0 )
            {
               this.addXhtmlSource( "<div id=\"categories\">\n" );
               this.addXhtmlSource( "<p><strong>Categories:</strong> " );
               for ( let i = 0; i < this.categories.length; ++i )
               {
                  if ( i > 0 )
                     this.addXhtmlSource( ", " );
                  this.addXhtmlSource( this.categories[i] );
               }
               this.addXhtmlSource( "</p>\n" );
               this.addXhtmlSource( "</div>\n\n" );
            }

      if ( !this.noKeywords )
         if ( this.keywords.length > 0 )
         {
            this.addXhtmlSource( "<div id=\"keywords\">\n" );
            this.addXhtmlSource( "<p><strong>Keywords:</strong> " );
            for ( let i = 0; i < this.keywords.length; ++i )
            {
               if ( i > 0 )
                  this.addXhtmlSource( ", " );
               this.addXhtmlSource( this.keywords[i] );
            }
            this.addXhtmlSource( "</p>\n" );
            this.addXhtmlSource( "</div>\n\n" );
         }

      if ( this.isJSObjectDocument() )
      {
         // Objects inherited by this object
         if ( this.inherits.length > 0 )
         {
            this.addXhtmlSource( "<div id=\"inherits_from\">\n" );
            this.addXhtmlSource( "<p><strong>Inherits from:</strong> " );
            for ( let i = 0; i < this.inherits.length; ++i )
            {
               if ( i > 0 )
                  this.addXhtmlSource( ", " );
               this.addXhtmlSource( this.inherits[i].toXhtml() );
            }
            this.addXhtmlSource( "</p>\n" );
            this.addXhtmlSource( "</div>\n\n" );
         }

         // Objects that inherit from this object
         if ( this.inherited.length > 0 )
         {
            this.addXhtmlSource( "<div id=\"inherited_by\">\n" );
            this.addXhtmlSource( "<p><strong>Inherited by:</strong> " );
            for ( let i = 0; i < this.inherited.length; ++i )
            {
               if ( i > 0 )
                  this.addXhtmlSource( ", " );
               this.addXhtmlSource( this.inherited[i].toXhtml() );
            }
            this.addXhtmlSource( "</p>\n" );
            this.addXhtmlSource( "</div>\n\n" );
         }

         // Prerequisites
         if ( this.required.length > 0 )
         {
            this.addXhtmlSource( "<div id=\"required\">\n" );
            this.addXhtmlSource( "<p>\n" );
            for ( let i = 0; ; )
            {
               this.addXhtmlSource( "#include " + this.required[i].toPlainXhtml() );
               if ( ++i == this.required.length )
                  break;
               this.addXhtmlSource( "<br/>\n" );
            }
            this.addXhtmlSource( "</p>\n" );
            this.addXhtmlSource( "</div>\n\n" );
         }
      }
   };

   this.makeToc = function( tokens, index )
   {
      function jsTableData( item, href )
      {
         item = item.removeTitleAnchorTags();
         let p1 = Math.max( 0, item.indexOf( ' ' ) );
         let p2 = item.indexOf( '(', p1 );
         if ( p2 < 0 )
            p2 = item.length;
         let itemType = (p1 > 0) ? item.substring( 0, p1 ).trim() : "";
         let itemId = item.substring( p1, p2 ).trim();
         let itemArgs = item.substring( p2 ).trim();
         return  "<td class=\"pidoc_objectTocType\">" + itemType + "</td>\n"
               + "<td class=\"pidoc_objectTocItem\"><a href=\"#" + document.internalLabel( href ) + "\">" + itemId + "</a>" + itemArgs + "</td>\n";
      }

      let sectionNumber = 0;

      function sectionTOC( section, sn )
      {
         if ( section.noIndex )
            return '';

         if ( sn == undefined )
            sn = (++sectionNumber).toString();

         if ( workingData.numberSections )
            section.setSectionNumber( sn );

         let text = "<li class=\"" + (section.parent ? "pidoc_tocSubitem" : "pidoc_tocItem") + "\">"
                  + "<a href=\"#" + document.internalLabel( section.id ) + "\">"
                  + section.title.removeTitleAnchorTags()
                  + "</a>";

         if ( section.subsections.length > 0 )
         {
            text += "\n<ul>\n";
            for ( let i = 0; i < section.subsections.length; ++i )
               text += sectionTOC( section.subsections[i], sn + '.' + (i+1).toString() );
            text += "</ul>\n";
         }

         text += "</li>\n";
         return text;
      }

      this.actionMessage( "Generating table of contents..." );

      this.addXhtmlSource( "<h3 class=\"pidoc_sectionTitle\" id=\"" + this.internalLabel( "toc" ) + "\">Contents</h3>\n"
                         + Section.toggleSectionXhtml( "toc" )
                         + "<div id=\"toc\">\n"
                         + "<ul>\n" );

      if ( this.summary )
         this.addXhtmlSource( sectionTOC( this.summary ) );

      if ( this.introduction )
         this.addXhtmlSource( sectionTOC( this.introduction ) );

      if ( this.description )
         this.addXhtmlSource( sectionTOC( this.description ) );

      if ( this.isToolDocument() || this.isScriptDocument() )
      {
         if ( this.parameters.length > 0 )
         {
            this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "parameters" ) + "\">Parameters</a></li>\n" );
            for ( let i = 0; i < this.parameters.length; ++i )
               this.addXhtmlSource( "<li class=\"pidoc_tocSubitem\">" +
                        "<a href=\"#" + this.internalLabel( format( "parameter%03d", i+1 ) ) + "\">" +
                        this.parameters[i].title.removeTitleAnchorTags() + "</a></li>\n" );
         }

         if ( this.usage )
            this.addXhtmlSource( sectionTOC( this.usage ) );
      }
      else if ( this.isJSObjectDocument() )
      {
         if ( this.properties.length > 0 )
         {
            this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "properties" ) + "\">Properties</a></li>\n" );
            this.addXhtmlSource( "<table class=\"pidoc_objectToc\">\n" );
            for ( let i = 0; i < this.properties.length; ++i )
               this.addXhtmlSource( "<tr>\n" + jsTableData( this.properties[i].formalDescription,
                                                            this.properties[i].href ) + "</tr>\n" );
            this.addXhtmlSource( "</table>\n" );
         }

         if ( this.staticProperties.length > 0 )
         {
            this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "static_properties" ) + "\">Static Properties</a></li>\n" );
            this.addXhtmlSource( "<table class=\"pidoc_objectToc\">\n" );
            for ( let i = 0; i < this.staticProperties.length; ++i )
               this.addXhtmlSource( "<tr>\n" + jsTableData( this.staticProperties[i].formalDescription,
                                                            this.staticProperties[i].href ) + "</tr>\n" );
            this.addXhtmlSource( "</table>\n" );
         }

         if ( this.eventHandlers.length > 0 )
         {
            this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "event_handlers" ) + "\">Event Handlers</a></li>\n" );
            this.addXhtmlSource( "<table class=\"pidoc_objectToc\">\n" );
            for ( let i = 0; i < this.eventHandlers.length; ++i )
               this.addXhtmlSource( "<tr>\n" + jsTableData( this.eventHandlers[i].formalDescription,
                                                            this.eventHandlers[i].href ) + "</tr>\n" );
            this.addXhtmlSource( "</table>\n" );
         }

         if ( this.constructors.length > 0 )
         {
            this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "constructors" ) + "\">Constructors</a></li>\n" );
            this.addXhtmlSource( "<table class=\"pidoc_objectToc\">\n" );
            for ( let i = 0; i < this.constructors.length; ++i )
               this.addXhtmlSource( "<tr>\n" + jsTableData( this.constructors[i].formalDescription,
                                                            this.constructors[i].href ) + "</tr>\n" );
            this.addXhtmlSource( "</table>\n" );
         }

         if ( this.methods.length > 0 )
         {
            this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "methods" ) + "\">Methods</a></li>\n" );
            this.addXhtmlSource( "<table class=\"pidoc_objectToc\">\n" );
            for ( let i = 0; i < this.methods.length; ++i )
               this.addXhtmlSource( "<tr>\n" + jsTableData( this.methods[i].formalDescription,
                                                            this.methods[i].href ) + "</tr>\n" );
            this.addXhtmlSource( "</table>\n" );
         }

         if ( this.staticMethods.length > 0 )
         {
            this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "static_methods" ) + "\">Static Methods</a></li>\n" );
            this.addXhtmlSource( "<table class=\"pidoc_objectToc\">\n" );
            for ( let i = 0; i < this.staticMethods.length; ++i )
               this.addXhtmlSource( "<tr>\n" + jsTableData( this.staticMethods[i].formalDescription,
                                                            this.staticMethods[i].href ) + "</tr>\n" );
            this.addXhtmlSource( "</table>\n" );
         }

         if ( this.constants.length > 0 )
         {
            this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "constants" ) + "\">Constants</a></li>\n" );
            this.addXhtmlSource( "<table class=\"pidoc_objectToc\">\n" );
            for ( let i = 0; i < this.constants.length; ++i )
               this.addXhtmlSource( "<tr>\n" + jsTableData( this.constants[i].id,
                                                            this.constants[i].href ) + "</tr>\n" );
            this.addXhtmlSource( "</table>\n" );
         }

         if ( this.defines.length > 0 )
         {
            this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "defines" ) + "\">Predefined Constants</a></li>\n" );
            this.addXhtmlSource( "<table class=\"pidoc_objectToc\">\n" );
            for ( let i = 0; i < this.defines.length; ++i )
               this.addXhtmlSource( "<tr>\n" + jsTableData( this.defines[i].id,
                                                            this.defines[i].href ) + "</tr>\n" );
            this.addXhtmlSource( "</table>\n" );
         }
      }
      else // generic
      {
         if ( this.methodology )
            this.addXhtmlSource( sectionTOC( this.methodology ) );

         if ( this.results )
            this.addXhtmlSource( sectionTOC( this.results ) );

         if ( this.discussion )
            this.addXhtmlSource( sectionTOC( this.discussion ) );
      }

      for ( let i = 0; i < this.sections.length; ++i )
         this.addXhtmlSource( sectionTOC( this.sections[i] ) );

      if ( this.acknowledgments )
         this.addXhtmlSource( sectionTOC( this.acknowledgments ) );

      if ( this.references.length > 0 )
         this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "references" ) + "\">References</a></li>\n" );

      if ( this.relatedTools.length > 0 )
         this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "relatedTools" ) + "\">Related Tools</a></li>\n" );

      if ( this.relatedScripts.length > 0 )
         this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "relatedScripts" ) + "\">Related Scripts</a></li>\n" );

      if ( this.relatedObjects.length > 0 )
         this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "relatedObjects" ) + "\">Related Objects</a></li>\n" );

      if ( this.relatedDocuments.length > 0 )
         this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "relatedDocuments" ) + "\">Related Documents</a></li>\n" );

      if ( this.relatedResources.length > 0 )
         this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "relatedResources" ) + "\">Related Resources</a></li>\n" );

      this.addXhtmlSource( "</ul>\n" +
                           "</div>\n\n" );
   };

   this.makeSummary = function( tokens, index )
   {
      if ( this.summary )
      {
         this.actionMessage( "Generating Abstract section..." );
         this.addXhtmlSource( this.summary.toXhtml() );
      }
   };

   this.makeIntroduction = function( tokens, index )
   {
      if ( this.introduction )
      {
         this.actionMessage( "Generating Introduction section..." );
         this.addXhtmlSource( this.introduction.toXhtml() );
      }
   };

   this.makeDescription = function( tokens, index )
   {
      if ( this.description )
      {
         this.actionMessage( "Generating Description section..." );
         this.addXhtmlSource( this.description.toXhtml() );
      }
   };

   this.makeUsage = function( tokens, index )
   {
      if ( this.usage )
      {
         this.actionMessage( "Generating Usage section..." );
         this.addXhtmlSource( this.usage.toXhtml() );
      }
   };

   this.makeParameters = function( tokens, index )
   {
      if ( this.parameters.length > 0 )
      {
         this.actionMessage( "Generating Parameters section..." );

         this.addXhtmlSource( Section.startXhtml( "Parameters", "parameters" ) );

         for ( let j = 0; j < this.parameters.length; ++j )
            this.addXhtmlSource( "      <div id=\"" + this.internalLabel( format( "parameter%03d", j+1 ) ) + "\">\n"
                               + this.parameters[j].toXhtml()
                               + "      </div>\n" );

         this.addXhtmlSource( Section.endXhtml() );
      }
   };

   this.makeProperties = function( tokens, index )
   {
      if ( this.properties.length > 0 )
      {
         this.actionMessage( "Generating Properties section..." );

         this.addXhtmlSource( Section.startXhtml( "Properties", "properties" ) );

         for ( let j = 0; j < this.properties.length; ++j )
            this.addXhtmlSource( this.properties[j].toXhtml() );

         this.addXhtmlSource( Section.endXhtml() );
      }
   };

   this.makeStaticProperties = function( tokens, index )
   {
      if ( this.staticProperties.length > 0 )
      {
         this.actionMessage( "Generating Static Properties section..." );

         this.addXhtmlSource( Section.startXhtml( "Static Properties", "static_properties" ) );

         for ( let j = 0; j < this.staticProperties.length; ++j )
            this.addXhtmlSource( this.staticProperties[j].toXhtml() );

         this.addXhtmlSource( Section.endXhtml() );
      }
   };

   this.makeEventHandlers = function( tokens, index )
   {
      if ( this.eventHandlers.length > 0 )
      {
         this.actionMessage( "Generating Event Handlers section..." );

         this.addXhtmlSource( Section.startXhtml( "Event Handlers", "event_handlers" ) );

         for ( let j = 0; j < this.eventHandlers.length; ++j )
            this.addXhtmlSource( this.eventHandlers[j].toXhtml() );

         this.addXhtmlSource( Section.endXhtml() );
      }
   };

   this.makeConstructors = function( tokens, index )
   {
      if ( this.constructors.length > 0 )
      {
         this.actionMessage( "Generating Constructors section..." );

         this.addXhtmlSource( Section.startXhtml( "Constructors", "constructors" ) );

         for ( let j = 0; j < this.constructors.length; ++j )
            this.addXhtmlSource( this.constructors[j].toXhtml() );

         this.addXhtmlSource( Section.endXhtml() );
      }
   };

   this.makeMethods = function( tokens, index )
   {
      if ( this.methods.length > 0 )
      {
         this.actionMessage( "Generating Methods section..." );

         this.addXhtmlSource( Section.startXhtml( "Methods", "methods" ) );

         for ( let j = 0; j < this.methods.length; ++j )
            this.addXhtmlSource( this.methods[j].toXhtml() );

         this.addXhtmlSource( Section.endXhtml() );
      }
   };

   this.makeStaticMethods = function( tokens, index )
   {
      if ( this.staticMethods.length > 0 )
      {
         this.actionMessage( "Generating Static Methods section..." );

         this.addXhtmlSource( Section.startXhtml( "Static Methods", "static_methods" ) );

         for ( let j = 0; j < this.staticMethods.length; ++j )
            this.addXhtmlSource( this.staticMethods[j].toXhtml() );

         this.addXhtmlSource( Section.endXhtml() );
      }
   };

   this.makeConstants = function( tokens, index )
   {
      if ( this.constants.length > 0 )
      {
         this.actionMessage( "Generating Constants section..." );

         this.addXhtmlSource( Section.startXhtml( "Constants", "constants" ) );

         for ( let j = 0; j < this.constants.length; ++j )
            this.addXhtmlSource( this.constants[j].toXhtml() );

         this.addXhtmlSource( Section.endXhtml() );
      }
   };

   this.makeDefines = function( tokens, index )
   {
      if ( this.defines.length > 0 )
      {
         this.actionMessage( "Generating Predefined Constants section..." );

         this.addXhtmlSource( Section.startXhtml( "Predefined Constants", "defines" ) );

         for ( let j = 0; j < this.defines.length; ++j )
            this.addXhtmlSource( this.defines[j].toXhtml() );

         this.addXhtmlSource( Section.endXhtml() );
      }
   };

   this.makeMethodology = function()
   {
      if ( this.methodology )
      {
         this.actionMessage( "Generating Methods section..." );
         this.addXhtmlSource( this.methodology.toXhtml() );
      }
   };

   this.makeResults = function()
   {
      if ( this.results )
      {
         this.actionMessage( "Generating Results section..." );
         this.addXhtmlSource( this.results.toXhtml() );
      }
   };

   this.makeDiscussion = function()
   {
      if ( this.discussion )
      {
         this.actionMessage( "Generating Discussion section..." );
         this.addXhtmlSource( this.discussion.toXhtml() );
      }
   };

   this.makeSections = function( tokens, index )
   {
      if ( this.sections.length > 0 )
      {
         this.actionMessage( "Generating " + this.sections.length.toString() + " custom section(s)..." );
         for ( let j = 0; j < this.sections.length; ++j )
            this.addXhtmlSource( this.sections[j].toXhtml() );
      }
   };

   this.makeAcknowledgments = function()
   {
      if ( this.acknowledgments )
      {
         this.actionMessage( "Generating Acknowledgments section..." );
         this.addXhtmlSource( this.acknowledgments.toXhtml() );
      }
   };

   this.makeReferences = function( tokens, index )
   {
      if ( this.references.length > 0 )
      {
         this.actionMessage( "Generating References section..." );

         this.addXhtmlSource( Section.startXhtml( "References", "references", false/*toggle*/ ) );

         for ( let j = 0; j < this.references.length; ++j )
            this.addXhtmlSource( "      <p id=\"" + this.internalNumberedLabel( "reference", j+1 )
                               + "\"><strong>[" + (j+1).toString() + "]</strong> "
                               + this.references[j].toXhtml() + "</p>\n" );

         this.addXhtmlSource( Section.endXhtml() );
      }
   };

   this.genericDocumentExists = function( docId )
   {
      return File.exists( this.docBaseDir + "/docs/" + docId + "/" + docId + ".html" );
   };

   this.toolDocumentExists = function( toolId )
   {
      return File.exists( this.docBaseDir + "/tools/" + toolId + "/" + toolId + ".html" );
   };

   this.scriptDocumentExists = function( scriptId )
   {
      return File.exists( this.docBaseDir + "/scripts/" + scriptId + "/" + scriptId + ".html" );
   };

   this.jsObjectDocumentExists = function( objectId )
   {
      return File.exists( this.docBaseDir + "/pjsr/objects/" + objectId + "/" + objectId + ".html" );
   };

   this.makeRelated = function( tokens, index )
   {
      if ( this.relatedTools.length > 0 )
      {
         this.actionMessage( "Generating Related Tools section..." );

         this.addXhtmlSource( Section.startXhtml( "Related Tools", "related_tools", false/*toggle*/ ) );
         this.addXhtmlSource( "<p>" );

         for ( let j = 0; j < this.relatedTools.length; ++j )
         {
            if ( j > 0 )
               this.addXhtmlSource( ", " );
            this.addXhtmlSource( this.relatedTools[j].toXhtml() );
         }

         this.addXhtmlSource( "</p>\n" );
         this.addXhtmlSource( Section.endXhtml() );
      }

      if ( this.relatedScripts.length > 0 )
      {
         this.actionMessage( "Generating Related Scripts section..." );

         this.addXhtmlSource( Section.startXhtml( "Related Scripts", "related_scripts", false/*toggle*/ ) );
         this.addXhtmlSource( "<p>" );

         for ( let j = 0; j < this.relatedScripts.length; ++j )
         {
            if ( j > 0 )
               this.addXhtmlSource( ", " );
            this.addXhtmlSource( this.relatedScripts[j].toXhtml() );
         }

         this.addXhtmlSource( "</p>\n" );
         this.addXhtmlSource( Section.endXhtml() );
      }

      if ( this.relatedObjects.length > 0 )
      {
         this.actionMessage( "Generating Related Objects section..." );

         this.addXhtmlSource( Section.startXhtml( "Related Objects", "related_objects", false/*toggle*/ ) );
         this.addXhtmlSource( "<p>" );

         for ( let j = 0; j < this.relatedObjects.length; ++j )
         {
            if ( j > 0 )
               this.addXhtmlSource( ", " );
            this.addXhtmlSource( this.relatedObjects[j].toXhtml() );
         }

         this.addXhtmlSource( "</p>\n" );
         this.addXhtmlSource( Section.endXhtml() );
      }

      if ( this.relatedDocuments.length > 0 )
      {
         this.actionMessage( "Generating Related Documents section..." );

         this.addXhtmlSource( Section.startXhtml( "Related Documents", "related_documents", false/*toggle*/ ) );
         this.addXhtmlSource( "<p>" );

         for ( let j = 0; j < this.relatedDocuments.length; ++j )
         {
            if ( j > 0 )
               this.addXhtmlSource( ", " );
            this.addXhtmlSource( this.relatedDocuments[j].toXhtml() );
         }

         this.addXhtmlSource( "</p>\n" );
         this.addXhtmlSource( Section.endXhtml() );
      }

      if ( this.relatedResources.length > 0 )
      {
         this.actionMessage( "Generating Related Resources section..." );

         this.addXhtmlSource( Section.startXhtml( "Related Resources", "related_resources", false/*toggle*/ ) );
         this.addXhtmlSource( "<ul>\n" );

         for ( let j = 0; j < this.relatedResources.length; ++j )
            this.addXhtmlSource( "   <li>" + this.relatedResources[j].toXhtml() + "</li>\n" );

         this.addXhtmlSource( "</ul>\n" );
         this.addXhtmlSource( Section.endXhtml() );
      }
   };

   this.makeFooter = function( tokens, index )
   {
      function utcDate( d )
      {
         return format( "%d-%02d-%02d %02d:%02d:%02d UTC",
                        d.getUTCFullYear(), d.getUTCMonth()+1, d.getUTCDate(),
                        d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds() );
      }

      this.actionMessage( "Generating document footer..." );

      this.addXhtmlSource( "<hr class=\"separator\"/>\n\n" );

      if ( !this.noCopyright )
         if ( !this.copyright.isEmpty() )
         {
            this.addXhtmlSource( "<div id=\"copyright\">\n" );
            this.addXhtmlSource( "   " + this.copyright + '\n' );
            this.addXhtmlSource( "</div>\n\n" );
         }

      this.addXhtmlSource( "<div id=\"footer\">\n" );
      this.addXhtmlSource( "   <p>Generated by the " + TITLE + " script version " + VERSION +
                           " on " + utcDate( new Date( Date.now() ) ) + "</p>\n" );
      this.addXhtmlSource( "</div>\n<br/>\n<br/>\n\n" );
   };

   this.solveReferences = function()
   {
      // Encoded reference format:
      //    <REFMARK><type>:<name>:<file>:<line><REFMARK>

      this.actionMessage( "Solving enumerated references..." );

      let refMark = String.fromCharCode( REFMARK );
      let sepMark = String.fromCharCode( SEPMARK );

      function solveRecursively( xhtmlSource )
      {
         let i = xhtmlSource.indexOf( refMark );
         if ( i < 0 )
            return xhtmlSource;
         let j = xhtmlSource.indexOf( refMark, i+1 );
         if ( j < 0 )
            throw new Error( "*** Internal error: symbolic reference: missing termination mark." );
         //let r = xhtmlSource.substring( i+1, j );
         let p1 = xhtmlSource.indexOf( sepMark, i+1 );
         if ( p1 < 0 || p1 > j )
            throw new Error( "*** Internal error: symbolic reference: missing separator." );
         let p2 = xhtmlSource.indexOf( sepMark, p1+1 );
         if ( p2 < 0 || p2 > j )
            throw new Error( "*** Internal error: symbolic reference: missing separator." );
         let p3 = xhtmlSource.indexOf( sepMark, p2+1 );
         if ( p3 < 0 || p3 > j )
            throw new Error( "*** Internal error: symbolic reference: missing separator." );
         let type = xhtmlSource.substring( i+1, p1 );
         let name = xhtmlSource.substring( p1+1, p2 );
         let file = xhtmlSource.substring( p2+1, p3 );
         let line = xhtmlSource.substring( p3+1 );
         let location = file + ':' + line;
         if ( type.isEmpty() )
            throw new ParseError( "Internal error: symbolic reference: missing reference type.", location );
         if ( name.isEmpty() )
            throw new ParseError( "Internal error: symbolic reference: missing reference name.", location );

         let number = -1;
         let text = "";
         let link = true;
         let sup = false;
         switch ( type )
         {
         case "reference" :
            number = document.referenceNumberForName( name );
            if ( number > 0 )
               text = document.references[number-1].text.replace( '\"', '\'', "g" );
            sup = true;
            break;
         case "equation" :
            {
               let a = document.equationNumberAndFileNameForName( name );
               if ( a != undefined )
               {
                  number = a[0];
                  text = "<img src=\'images/" + a[1] + "\' alt=\'\'/>";
               }
            }
            break;
         case "equation_number" :
            number = document.equationNumberForName( name );
            type = "equation"; // for error reporting
            link = false;
            break;
         case "figure" :
            number = document.figureNumberForName( name );
            break;
         case "figure_number" :
            number = document.figureNumberForName( name );
            type = "figure";
            link = false;
            break;
         case "table" :
            number = document.tableNumberForName( name );
            break;
         case "table_number" :
            number = document.tableNumberForName( name );
            type = "table";
            link = false;
            break;
         case "figure_title_tag" :
            throw new ParseError( "Unexpected figure title tag.", location );
         case "table_title_tag" :
            throw new ParseError( "Unexpected table title tag.", location );
         default:
            throw new ParseError( "Internal error: symbolic reference: unknown reference type \'" + type + "\'.", location );
         }
         if ( number < 0 )
            throw new ParseError( "Undefined " + type + " \'" + name + "\'.", location );

         let source = xhtmlSource.substring( 0, i );

         if ( sup )
            source += "<sup>";

         if ( link )
         {
            let capType = type[0].toUpperCase() + type.substring( 1 );
            source += "<a href=\"#" + document.internalNumberedLabel( type, number ) + "\""
                   +  " class=\"pidoc_referenceTooltip\""
                   +  " onmouseover=\"pidoc_showReferenceToolTip( this );\""
                   +  " onmouseout=\"pidoc_hideReferenceToolTip();\""
                   +  " data-tooltip=\"[" + capType + " " + number.toString() + "]";
            if ( !text.isEmpty() )
               source += "<br/>\n" + text;
            source += "\">[" + number.toString() + "]</a>";
         }
         else
         {
            source += number.toString();
         }

         if ( sup )
            source += "</sup>";

         return source + solveRecursively( xhtmlSource.substring( j+1 ) );
      }

      this.xhtmlSource = solveRecursively( this.xhtmlSource );

      for ( let i = 0; i < this.references.length; ++i )
         if ( this.references[i].count == 0 )
            this.warning( "Unreferenced bibliographic reference \'" +
                          this.references[i].name + "\' (= Reference " + i.toString() + ")" );
      for ( let i = 0; i < this.equationNames.length; ++i )
         if ( this.equationNames[i].count == 0 )
            this.warning( "Unreferenced numbered equation \'" +
                          this.equationNames[i].name + "\' (= Equation " + this.equationNames[i].number.toString() + ")." );
      for ( let i = 0; i < this.figureNames.length; ++i )
         if ( this.figureNames[i].count == 0 )
            this.warning( "Unreferenced numbered figure \'" +
                          this.figureNames[i].name + "\' (= Figure " + this.figureNames[i].number.toString() + ")." );
      for ( let i = 0; i < this.tableNames.length; ++i )
         if ( this.tableNames[i].count == 0 )
            this.warning( "Unreferenced numbered table \'" +
                          this.tableNames[i].name + "\' (= Table " + this.tableNames[i].number.toString() + ")." );
   };

   this.cleanupMarkup = function()
   {
      this.xhtmlSource = this.xhtmlSource.replace( "<p><div", "<div", "g"
                                        ).replace( "</div></p>", "</div>", "g"
                                        ).replace( "<p><table", "<table", "g"
                                        ).replace( "</table></p>", "</table>", "g" );
   };
}

PIDocDocument.prototype = new Object;

/*
 * Global document object
 */
var document = new PIDocDocument;

// ----------------------------------------------------------------------------
// EOF PIDocDocument.js - Released 2017/01/23 20:54:58 UTC
