// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// PIDocDocument.js - Released 2014/02/01 17:08:18 UTC
// ****************************************************************************
//
// This file is part of PixInsight Documentation Compiler Script version 1.5.1
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
 * The name of a temporary working file.
 */
#define PIDOC_TMP_FILE_NAME   "__pidoc__"

/*
 * A generic document section.
 */
function Section( title, text, id )
{
   this.__base__ = Object;
   this.__base__();

   this.title = title;
   this.text = text;
   this.id = id;

   this.toXhtml = function()
   {
      return   "<a name=\"" + document.internalLabel( this.id ) + "\"></a>\n"
             + "<div class=\"pidoc_section\">\n"
             + "   <h3 class=\"pidoc_sectionTitle\">" + this.title + "</h3>\n"
             + this.text
             + "</div>\n\n";
   };
}

Section.prototype = new Object;

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
      return   "<a name=\"" + document.internalLabel( this.href ) + "\"></a>\n"
             + ((this.label != undefined && !this.label.isEmpty()) ? "<a name=\"" + this.label + "\"></a>\n" : "")
             + "<div class=\"pidoc_objectItem\">\n"
             + "   <p class=\"pidoc_objectFormalDescription"
               + (this.readOnly ? " pidoc_readOnlyProperty" : "") + "\">"
               + this.formalDescription
               + (this.readOnly ? " <span class=\"pidoc_readOnlyPropertyTag\">&lt;read-only&gt;</span>" : "") + "</p>\n"
             + "   <div class=\"pidoc_objectDescription\">\n"
             + this.description + '\n'
             + "   </div>\n"
             + "</div>\n\n";
   };
}

ObjectPropertySection.prototype = new Object;

/*
 * A document subsection.
 *
 * Subsections are tracked only to include them in the Table of Contents, and
 * for indexing purposes. Subsection contents are fully generated during the
 * compilation phase.
 */
function Subsection( title, label, sectionId )
{
   this.__base__ = Object;
   this.__base__();

   this.title = title;
   this.label = label;
   this.sectionId = sectionId;
}

Subsection.prototype = new Object;

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
      for ( var i = 0; i < this.items.length; ++i )
      {
         var item = this.items[i];
         if ( item.tex == tex )
            if ( item.scale == scale )
               return item.fileName;
      }
      return null;
   };

   this.add = function( tex, scale )
   {
      var fileName = format( "eqn_%04d.svg", ++this.count );
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

   // Generic items available to all document classes
   this.title = '';
   this.subtitle = '';
   this.authors = new Array;
   this.copyright = '';
   this.keywords = new Array;
   this.brief = '';
   this.summary = ''; // hmm... 'abstract' is an ECMA reserved word
   this.description = '';
   this.introduction = '';
   this.methodology = '';
   this.results = '';
   this.discussion = '';
   this.acknowledgments = '';
   this.sections = new Array;
   this.references = new Array;
   this.relatedTools = new Array;
   this.relatedScripts = new Array;
   this.relatedObjects = new Array;
   this.relatedDocuments = new Array;
   this.relatedResources = new Array;

   // Items specific to both the PIToolDoc and PIScriptDoc document classes
   this.toolId = ''
   this.usage = '';
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

   // Subsections array for TOC and index generation
   this.subsections = new Array;
   // The currentSectionId property allows us to keep track of parent sections
   // for subsections, in the addSubsection() method.
   this.currentSectionId = '';
   // The section and subsection counters are used to generate automatic
   // identifiers for custom sections and subsections in calls to
   // setCurrentSection( "section" ) and nextSubsectionLabel().
   this.sectionCount = 0;
   this.subsectionCount = 0;

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
      this.summary = '';
      this.description = '';
      this.introduction = '';
      this.methodology = '';
      this.results = '';
      this.discussion = '';
      this.acknowledgments = '';
      this.sections = new Array;
      this.references = new Array;
      this.relatedTools = new Array;
      this.relatedScripts = new Array;
      this.relatedObjects = new Array;
      this.relatedDocuments = new Array;
      this.relatedResources = new Array;
      this.toolId = ''
      this.usage = '';
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
      this.subsections = new Array;
      this.currentSectionId = '';
      this.sectionCount = 0;
      this.subsectionCount = 0;
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
      var path = filePath.trim();
      if ( path.isEmpty() )
         return "";
      var isRelative = path[0] != '/'
#ifeq __PI_PLATFORM__ MSWINDOWS
               // deal with Windows drive letters
               && (path.length == 1 || path[1] != ':')
#endif
               ;
      if ( isRelative )
      {
         var dir = File.extractDrive( this.filePath ) + File.extractDirectory( this.filePath );
         if ( dir[dir.length-1] != '/' )
            dir += '/';
         path = dir + path;
      }
      return File.fullPath( path );
   };

   this.uniqueId = function()
   {
      var N = "Aa9Bb0CcD8dEe1Ff7Gg2Hh6Ii3Jj4Kk5Ll4MmNn5OoP3pQq6Rr2Ss7TtU1uVv8Ww0Xx9YyZz";
      var n = N.length - 1;
      var id = "";
      for ( var i = 0; ; )
      {
         id += N.charAt( Math.random()*n );
         if ( ++i == 16 )
            break;
      }
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
      var j = 0;
      for ( ; j < name.length; ++j )
         if ( !name.isIdChar( j ) )
            break;
      if ( j == 0 )
         throw new ParseError( "Invalid " + type + " identifier.", tokens, index );
      var id = name.substring( 0, j );
      var text = name.substring( j ).toXhtml();
      var location = new DocumentLocation( tokens, index );
      var file = location.filePath;
      var line = location.lineNumber.toString();
      var ref = String.fromCharCode( REFMARK );
      var sep = String.fromCharCode( SEPMARK );
      return ref + type + sep + id + sep + file + sep + line + ref + text;
   };

   // Write a warning message
   this.warning = function( message, tokensOrLocation, index )
   {
      ++this.warningCount;

      var text = "<end><cbr><raw>** Warning: ";
      if ( tokensOrLocation != undefined )
      {
         var location = new DocumentLocation( tokensOrLocation, index );
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
      this.title = title.trim();
   };

   this.setSubtitle = function( subtitle, tokens, index )
   {
      if ( this.isToolDocument() || this.isScriptDocument() || this.isJSObjectDocument() )
         throw new ParseError( "Custom titles can only be defined for generic documents.", tokens, index );
      if ( !this.subtitle.isEmpty() )
         throw new ParseError( "Redefinition of the document's subtitle.", tokens, index );
      this.subtitle = subtitle.trim();
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
         var p = copyright.indexOf( "<p>" );
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

      var p = brief.indexOf( "<p" );
      if ( p >= 0 )
         if ( brief.substring( p+2 ).indexOf( "<p>" ) > 0 || brief.indexOf( "<br" ) >= 0 )
            this.warning( "Defining a 'brief' description across multiple lines.", tokens, index );
      this.brief = brief;
   };

   this.setSummary = function( summary, tokens, index )
   {
      if ( this.isToolDocument() || this.isScriptDocument() || this.isJSObjectDocument() )
         throw new ParseError( "The Abstract section is only available for generic documents.", tokens, index );
      if ( !this.summary.isEmpty() )
         throw new ParseError( "Redefinition of the Abstract section.", tokens, index );
      this.summary = summary.trim();
      this.currentSectionId = '';
   };

   this.setDescription = function( description, tokens, index )
   {
      if ( !this.description.isEmpty() )
         throw new ParseError( "Redefinition of the Description section.", tokens, index );
      this.description = description.trim();
      this.currentSectionId = '';
   };

   this.setIntroduction = function( introduction, tokens, index )
   {
      if ( !this.introduction.isEmpty() )
         throw new ParseError( "Redefinition of the Introduction section.", tokens, index );
      if ( !this.description.isEmpty() )
         this.warning( "Defining both the Introduction and the Description sections is discouraged.", tokens, index );
      this.introduction = introduction.trim();
      this.currentSectionId = '';
   };

   this.setMethods = function( methods, tokens, index )
   {
      if ( this.isToolDocument() || this.isScriptDocument() || this.isJSObjectDocument() )
         throw new ParseError( "The Methods section is only available for generic documents.", tokens, index );
      if ( !this.methodology.isEmpty() )
         throw new ParseError( "Redefinition of the Methods section.", tokens, index );
      this.methodology = methods.trim();
      this.currentSectionId = '';
   };

   this.setResults = function( results, tokens, index )
   {
      if ( this.isToolDocument() || this.isScriptDocument() || this.isJSObjectDocument() )
         throw new ParseError( "The Results section is only available for generic documents.", tokens, index );
      if ( !this.results.isEmpty() )
         throw new ParseError( "Redefinition of the Results section.", tokens, index );
      this.results = results.trim();
      this.currentSectionId = '';
   };

   this.setDiscussion = function( discussion, tokens, index )
   {
      if ( this.isToolDocument() || this.isScriptDocument() || this.isJSObjectDocument() )
         throw new ParseError( "The Discussion section is only available for generic documents.", tokens, index );
      if ( !this.discussion.isEmpty() )
         throw new ParseError( "Redefinition of the Discussion section.", tokens, index );
      this.discussion = discussion.trim();
      this.currentSectionId = '';
   };

   this.setAcknowledgments = function( acknowledgments, tokens, index )
   {
      if ( !this.acknowledgments.isEmpty() )
         throw new ParseError( "Redefinition of the Acknowledgments section.", tokens, index );
      this.acknowledgments = acknowledgments.trim();
      this.currentSectionId = '';
   };

   this.addSection = function( sectionTitle, sectionText, tokens, index )
   {
      if ( this.currentSectionId.isEmpty() )
         throw new Error( "*** Internal error: No current section has been selected." );
      this.sections.push( new Section( sectionTitle, sectionText, this.currentSectionId ) );
      this.currentSectionId = '';
   };

   this.referenceNumberForName = function( name )
   {
      for ( var i = 0; i < this.references.length; ++i )
         if ( this.references[i].name == name )
         {
            ++this.references[i].count;
            return i+1;
         }
      return -1;
   };

   this.addReference = function( name, text, tokens, index )
   {
      for ( var i = 0; i < this.references.length; ++i )
         if ( this.references[i].name == name )
            throw new ParseError( "Duplicate reference '" + name + "'", tokens, index );
      this.references.push( new Reference( name, text ) );
   };

   this.addRelatedTool = function( toolId, tokens, index )
   {
      toolId = toolId.trim();
      if ( toolId.isEmpty() )
         return;
      var toolUri = this.sysRelDir + "/tools/" + toolId + "/" + toolId + ".html";
      for ( var i = 0; i < this.relatedTools.length; ++i )
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
      var scriptUri = this.sysRelDir + "/scripts/" + scriptId + "/" + scriptId + ".html";
      for ( var i = 0; i < this.relatedScripts.length; ++i )
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
      var objectUri = this.sysRelDir + "/pjsr/objects/" + objectId + "/" + objectId + ".html";
      for ( var i = 0; i < this.relatedObjects.length; ++i )
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
      var documentUri = this.sysRelDir + "/docs/" + documentId + "/" + documentId + ".html";
      for ( var i = 0; i < this.relatedDocuments.length; ++i )
         if ( this.relatedDocuments[i].uri == documentUri )
            throw new ParseError( "Duplicate related document '" + documentId + "'", tokens, index );
      if ( !this.genericDocumentExists( documentId ) )
         this.warning( "Reference to nonexistent document: " + documentId, tokens, index );
      this.relatedDocuments.push( new RelatedResource( documentUri, documentItem ) );
   };

   this.addRelatedResource = function( resourceUri, resourceItem, tokens, index )
   {
      resourceUri = resourceUri.trim();
      for ( var i = 0; i < this.relatedResources.length; ++i )
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

   this.setUsage = function( usage, tokens, index )
   {
      if ( !this.isToolDocument() && !this.isScriptDocument() )
         throw new ParseError( "The Usage section is only available for tool and script documents.", tokens, index );
      if ( !this.usage.isEmpty() )
         throw new ParseError( "Redefinition of the Usage section.", tokens, index );
      this.usage = usage.trim();
      this.currentSectionId = '';
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
      for ( var i = 0; i < this.properties.length; ++i )
         if ( this.properties[i].id == id )
            return true;
      for ( var i = 0; i < this.staticProperties.length; ++i )
         if ( this.staticProperties[i].id == id )
            return true;
      for ( var i = 0; i < this.eventHandlers.length; ++i )
         if ( this.eventHandlers[i].id == id )
            return true;
      for ( var i = 0; i < this.methods.length; ++i )
         if ( this.methods[i].id == id )
            return true;
      for ( var i = 0; i < this.staticMethods.length; ++i )
         if ( this.staticMethods[i].id == id )
            return true;
      for ( var i = 0; i < this.constants.length; ++i )
         if ( this.constants[i].id == id )
            return true;
      return false;
   };

   this.hasMethodIdentifier = function( id, isStatic )
   {
      for ( var i = 0; i < this.properties.length; ++i )
         if ( this.properties[i].id == id )
            return true;
      for ( var i = 0; i < this.staticProperties.length; ++i )
         if ( this.staticProperties[i].id == id )
            return true;
      for ( var i = 0; i < this.eventHandlers.length; ++i )
         if ( this.eventHandlers[i].id == id )
            return true;

      if ( isStatic )
      {
         for ( var i = 0; i < this.methods.length; ++i )
            if ( this.methods[i].id == id )
               return true;
      }
      else
      {
         for ( var i = 0; i < this.staticMethods.length; ++i )
            if ( this.staticMethods[i].id == id )
               return true;
      }

      for ( var i = 0; i < this.constants.length; ++i )
         if ( this.constants[i].id == id )
            return true;

      return false;
   };

   this.parsePropertyFormalDescription = function( formalDescription, tokens, index )
   {
      // <data-type> <object-id>.<property-id>
      var s = formalDescription.indexOf( ' ' );
      if ( s < 0 )
         throw new ParseError( "Invalid property formal description: No data type specified.", tokens, index );
      var d = formalDescription.indexOf( '.', s+1 );
      if ( d < 0 )
         throw new ParseError( "Invalid property formal description: No parent object specified", tokens, index );
      var objectId = formalDescription.substring( s+1, d ).trim();
      if ( objectId.isEmpty() )
         throw new ParseError( "Invalid property formal description: Missing parent object identifier", tokens, index );
      if ( objectId != this.objectId )
         throw new ParseError( "Invalid property formal description: Attempt to define a property of another object \'" + objectId + "\'", tokens, index );
      var propertyId = formalDescription.substring( d+1 ).trim();
      if ( propertyId.isEmpty() )
         throw new ParseError( "Invalid property formal description: Missing property identifier.", tokens, index );
      if ( this.hasPropertyIdentifier( propertyId ) )
         throw new ParseError( "Duplicate object property \'" + propertyId + "\'", tokens, index );
      return propertyId;
   };

   this.parseMethodFormalDescription = function( formalDescription, isStatic, tokens, index )
   {
      // <data-type> <object-id>.<method-id>( ... )
      var s = formalDescription.indexOf( ' ' );
      if ( s < 0 )
         throw new ParseError( "Invalid method formal description: No return data type specified.", tokens, index );
      var d = formalDescription.indexOf( '.', s+1 );
      if ( d < 0 )
         throw new ParseError( "Invalid method formal description: No parent object specified", tokens, index );
      var objectId = formalDescription.substring( s+1, d ).trim();
      if ( objectId.isEmpty() )
         throw new ParseError( "Invalid method formal description: Missing parent object identifier", tokens, index );
      if ( objectId != this.objectId )
         throw new ParseError( "Invalid method formal description: Attempt to define a method of another object \'" + objectId + "\'", tokens, index );

      var p1 = formalDescription.indexOf( '(', d+1 );
      if ( p1 < 0 )
         throw new ParseError( "Invalid method formal description: Missing left parenthesis.", tokens, index );
      var p2 = formalDescription.lastIndexOf( ')' );
      if ( p2 < 0 )
         throw new ParseError( "Invalid method formal description: Missing right parenthesis.", tokens, index );
      if ( p2 != formalDescription.length-1 )
         throw new ParseError( "Invalid method formal description: Extra tokens after right parenthesis.", tokens, index );

      var methodId = formalDescription.substring( d+1, p1 ).trim();
      if ( methodId.isEmpty() )
         throw new ParseError( "Invalid method formal description: Missing method identifier.", tokens, index );
      if ( this.hasMethodIdentifier( methodId, isStatic ) )
         throw new ParseError( "Duplicate object method \'" + methodId + "\'", tokens, index );
      return methodId;
   };

   this.parseConstructorFormalDescription = function( formalDescription, tokens, index )
   {
      // new object-id( ... )
      var s = formalDescription.indexOf( ' ' );
      if ( s < 0 || formalDescription.substring( 0, s ).trim() != "new" )
         throw new ParseError( "Invalid constructor formal description: Missing \'new\' operator.", tokens, index );

      var p1 = formalDescription.indexOf( '(', s+1 );
      if ( p1 < 0 )
         throw new ParseError( "Invalid constructor formal description: Missing left parenthesis.", tokens, index );
      var p2 = formalDescription.lastIndexOf( ')' );
      if ( p2 < 0 )
         throw new ParseError( "Invalid constructor formal description: Missing right parenthesis.", tokens, index );
      if ( p2 != formalDescription.length-1 )
         throw new ParseError( "Invalid constructor formal description: Extra tokens after right parenthesis.", tokens, index );

      var objectId = formalDescription.substring( s+1, p1 ).trim();
      if ( objectId.isEmpty() )
         throw new ParseError( "Invalid constructor formal description: Missing object identifier.", tokens, index );
      if ( objectId != this.objectId )
         throw new ParseError( "Invalid constructor formal description: Attempt to define a constructor of another object \'" + objectId + "\'", tokens, index );
      return objectId;
   };

   this.parseDefineFormalDescription = function( formalDescription, tokens, index )
   {
      // #define <id> <value>
      var s1 = formalDescription.indexOf( ' ' );
      if ( s1 < 0 || formalDescription.substring( 0, s1 ).trim() != "#define" )
         throw new ParseError( "Invalid predefined constant formal description: Missing \'#define\' directive.", tokens, index );
      var s2 = formalDescription.indexOf( ' ', s1+1 );
      if ( s2 < 0 )
         throw new ParseError( "Invalid predefined constant formal description: Missing macro identifier.", tokens, index );
      var macroId = formalDescription.substring( s1+1, s2 ).trim();
      var value = formalDescription.substring( s2+1 ).trim();
      if ( value.isEmpty() )
         throw new ParseError( "Invalid predefined constant formal description: Missing macro value.", tokens, index );
      return macroId;
   };

   this.parseRequiredFormalDescription = function( formalDescription, tokens, index )
   {
      // #include \<include-file\>
      var s1 = formalDescription.indexOf( ' ' );
      if ( s1 < 0 || formalDescription.substring( 0, s1 ).trim() != "#include" )
         throw new ParseError( "Invalid required file formal description: Missing \'#include\' directive.", tokens, index );
      var includeSpec = formalDescription.substring( s1+1 ).trim();
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
      var objectUri = this.sysRelDir + "/pjsr/objects/" + objectId + "/" + objectId + ".html";
      for ( var i = 0; i < this.inherits.length; ++i )
         if ( this.inherits[i].uri == objectUri )
            throw new ParseError( "Duplicate \\inherits object identifier \'" + objectId + "\'", tokens, index );
      for ( var i = 0; i < this.inherited.length; ++i )
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
      var objectUri = this.sysRelDir + "/pjsr/objects/" + objectId + "/" + objectId + ".html";
      for ( var i = 0; i < this.inherited.length; ++i )
         if ( this.inherited[i].uri == objectUri )
            throw new ParseError( "Duplicate \\inherited object identifier \'" + objectId + "\'", tokens, index );
      for ( var i = 0; i < this.inherits.length; ++i )
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

   //

   this.setCurrentSection = function( sectionId )
   {
      this.currentSectionId = (sectionId == "section") ?
                  format( "section%03d", ++this.sectionCount ) : sectionId;
      this.subsectionCount = 0;
   };

   this.nextSubsectionLabel = function()
   {
      return this.currentSectionId + format( "_%03d", this.subsectionCount+1 );
   };

   this.addSubsection = function( title, label, tokens, index )
   {
      if ( this.currentSectionId.isEmpty() )
         throw new ParseError( "Subsections cannot be defined in this context.", tokens, index );
      this.subsections.push( new Subsection( title, label, this.currentSectionId ) );
      ++this.subsectionCount;
   };

   // Contents generation

   this.addImage = function( imageFilePath, tokens, index )
   {
      if ( this.images.indexOf( imageFilePath ) < 0 )
      {
         var suffix = imageFilePath.substring( imageFilePath.lastIndexOf( '.' ) ).toLowerCase();
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
      for ( var i = 0; i < this.equationNames.length; ++i )
         if ( this.equationNames[i].name == name )
         {
            ++this.equationNames[i].count;
            return this.equationNames[i].number;
         }
      return -1;
   };

   this.equationNumberAndFileNameForName = function( name )
   {
      for ( var i = 0; i < this.equationNames.length; ++i )
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
         var P = new ExternalProcess( program );
         if ( P.waitForStarted() )
         {
            processEvents();
            var n = 0;
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
            var e = P.stderr;
            throw new ParseError( "Process failed:\n" + program +
                                  ((e.length > 0) ? "\n" + e : ""), tokens, index );
         }
      }

      var location = new DocumentLocation( tokens, index );
      console.write( "<end><cbr>* Rendering equation (line " + (location.lineNumber+1).toString() + ")  " );

      tex = tex.trim();
      if ( tex.isEmpty() )
         throw new ParseError( "Empty equation" );

      var fileName = this.equations.find( tex, scale );
      if ( fileName != null )
      {
         console.writeln( "\b** cached" );
         return fileName;
      }

      fileName = this.equations.add( tex, scale );
      var filePath = File.systemTempDirectory + '/' + fileName;

      if ( workingData.renderEquations )
      {
         // Render a TeX source code string in SVG format.

         var f = new File;
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

      var validName = name != undefined && !name.isEmpty();
      if ( validName )
         for ( var i = 0; i < this.equationNames.length; ++i )
            if ( this.equationNames[i].name == name )
               throw new ParseError( "Duplicate equation name \'" + name + "\'.", tokens, index );

      var filePath = this.addEquation( tex, scale, tokens, index );

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
      for ( var i = 0; i < this.figureNames.length; ++i )
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
         for ( var i = 0; i < this.figureNames.length; ++i )
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
      for ( var i = 0; i < this.tableNames.length; ++i )
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
         for ( var i = 0; i < this.tableNames.length; ++i )
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
      for ( var i = 0; i < this.labelReferences.length; ++i )
         if ( this.labels.filter( function( x ) { return x.label == this.labelReferences[i].label; }, this ).length == 0 )
            this.warning( "Reference to nonexistent label: '" + this.labelReferences[i].label + "'",
                          this.labelReferences[i].location, undefined );
      for ( var i = 0; i < this.labels.length; ++i )
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

      var keywords = "";
      for ( var i = 0; i < this.keywords.length; ++i )
      {
         if ( i > 0 )
            keywords += ", ";
         keywords += this.keywords[i];
      }

      var authors = "";
      for ( var i = 0; i < this.authors.length; ++i )
      {
         if ( i > 0 )
            authors += " / ";
         authors += this.authors[i];
      }

      var title =
(this.isJSObjectDocument() ?
"PixInsight JavaScript Runtime" :
"PixInsight Reference Documentation") + " | " + this.title.removeHtmlTags().trim();

      var header =
workingData.generateHTML5 ?
  "<!DOCTYPE html>\n"
+ "<html>\n" :
  "<!DOCTYPE html PUBLIC \"-\/\/W3C\/\/DTD XHTML 1.0 Strict\/\/EN\" \"http:\/\/www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd\">\n"
+ "<html xmlns=\"http:\/\/www.w3.org/1999/xhtml\">\n";

      this.xhtmlSource =
header
+ "<head>\n"
+ "   <meta http-equiv=\"content-type\" content=\"text/html; charset=UTF-8\" />\n"
+ "   <title>" + title + "</title>\n"
+ "   <meta name=\"keywords\" content=\"" + keywords + "\" />\n"
+ "   <meta name=\"title\" content=\"" + title + "\" />\n"
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
               var backupFilePath = File.changeExtension( filePath, File.extractExtension( filePath ) + '~' );
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

      if ( this.isToolDocument() )
      {
         var docDir = this.docBaseDir + "/tools/" + this.toolId;
         var outputFilePath = docDir + '/' + this.toolId + ".html";
      }
      else if ( this.isScriptDocument() )
      {
         var docDir = this.docBaseDir + "/scripts/" + this.toolId;
         var outputFilePath = docDir + '/' + this.toolId + ".html";
      }
      else if ( this.isJSObjectDocument() )
      {
         var docDir = this.docBaseDir + "/pjsr/objects/" + this.objectId;
         var outputFilePath = docDir + '/' + this.objectId + ".html";
      }
      else // generic
      {
         var docDir = this.docBaseDir + "/docs/" + this.docId;
         var outputFilePath = docDir + '/' + this.docId + ".html";
      }

      this.createDirectoryIfDoesNotExist( docDir );
      this.backupFileIfExists( outputFilePath );

      var f = new File;
      f.createForWriting( outputFilePath );
      f.write( ByteArray.stringToUTF8( this.xhtmlSource ) );
      f.flush();
      f.close();
      this.message( "Output file created: " + outputFilePath );

      if ( this.images.length > 0 )
      {
         var imagesDir = docDir + "/images";
         this.createDirectoryIfDoesNotExist( imagesDir );

         for ( var i = 0; i < this.images.length; ++i )
            if ( File.exists( this.images[i] ) )
            {
               var targetImagePath = imagesDir + '/' +
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

      this.addXhtmlSource( "<a name=\"" + this.internalLabel( "contents" ) + "\"></a>\n\n" );

      // Optional Abstract section
      if ( this.isGenericDocument() )
         if ( !this.summary.isEmpty() )
            this.makeSummary( tokens, index );

      // Optional Introduction section
      if ( !this.introduction.isEmpty() )
         this.makeIntroduction( tokens, index );

      // Optional Description section
      if ( !this.description.isEmpty() )
         this.makeDescription( tokens, index );

      if ( this.isToolDocument() || this.isScriptDocument() )
      {
         // Optional Parameters section (automatic if any parameter has been defined)
         if ( this.parameters.length > 0 )
            this.makeParameters( tokens, index );

         // Optional Usage section
         if ( !this.usage.isEmpty() )
            this.makeUsage( tokens, index );
      }
      else if ( this.isJSObjectDocument() )
      {
         // Instance properties
         if ( this.properties.length > 0 )
            this.makeProperties( tokens, index );

         // Static properties
         if ( this.staticProperties.length > 0 )
            this.makeStaticProperties( tokens, index );

         // Event handlers
         if ( this.eventHandlers.length > 0 )
            this.makeEventHandlers( tokens, index );

         // Constructors
         if ( this.constructors.length > 0 )
            this.makeConstructors( tokens, index );

         // Instance methods
         if ( this.methods.length > 0 )
            this.makeMethods( tokens, index );

         // Static methods
         if ( this.staticMethods.length > 0 )
            this.makeStaticMethods( tokens, index );

         // Constant properties
         if ( this.constants.length > 0 )
            this.makeConstants( tokens, index );

         // #defined constants
         if ( this.defines.length > 0 )
            this.makeDefines( tokens, index );
      }
      else
      {
         // Optional Methods section
         if ( !this.methodology.isEmpty() )
            this.makeMethodology( tokens, index );

         // Optional Results section
         if ( !this.results.isEmpty() )
            this.makeResults( tokens, index );

         // Optional Discussion section
         if ( !this.discussion.isEmpty() )
            this.makeDiscussion( tokens, index );
      }

      // Custom sections
      if ( this.sections.length > 0 )
         this.makeSections( tokens, index );

      // Optional Acknowledgments section
      if ( !this.acknowledgments.isEmpty() )
         this.makeAcknowledgments( tokens, index );

      // References section
      if ( this.references.length > 0 )
         this.makeReferences( tokens, index );

      // Related Tools, Related Scripts, Related Objects and Related Resources sections
      if ( this.relatedTools.length > 0 || this.relatedScripts.length > 0 || this.relatedObjects.length > 0 ||
           this.relatedDocuments.length > 0 || this.relatedResources.length > 0 )
         this.makeRelated( tokens, index );

      // All document classes have a footer block
      this.makeFooter( tokens, index );

      // Second pass to solve all forwarded reference links
      this.solveReferences();

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
            for ( var i = 0; i < this.authors.length; ++i )
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
         var brief = this.brief;
         var p = brief.lastIndexOf( "</p>" );
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
               for ( var i = 0; i < this.categories.length; ++i )
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
            for ( var i = 0; i < this.keywords.length; ++i )
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
            for ( var i = 0; i < this.inherits.length; ++i )
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
            for ( var i = 0; i < this.inherited.length; ++i )
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
            for ( var i = 0; ; )
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

   this.makeSubsectionsToc = function( sectionId )
   {
      var s = this.subsections.filter( function( s, i, a ) { return s.sectionId == sectionId; }, this );
      for ( var i = 0; i < s.length; ++i )
         this.addXhtmlSource( "<li class=\"pidoc_tocSubitem\">"
                            + "<a href=\"#" + s[i].label + "\">" + s[i].title.removeAnchorTags() + "</a></li>\n" );
   };

   this.makeToc = function( tokens, index )
   {
      function jsTableData( item, href )
      {
         item = item.removeAnchorTags();
         var p1 = Math.max( 0, item.indexOf( ' ' ) );
         var p2 = item.indexOf( '(', p1 );
         if ( p2 < 0 )
            p2 = item.length;
         var itemType = (p1 > 0) ? item.substring( 0, p1 ).trim() : "";
         var itemId = item.substring( p1, p2 ).trim();
         var itemArgs = item.substring( p2 ).trim();
         return  "<td class=\"pidoc_objectTocType\">" + itemType + "</td>\n"
               + "<td class=\"pidoc_objectTocItem\"><a href=\"#" + document.internalLabel( href ) + "\">" + itemId + "</a>" + itemArgs + "</td>\n";
      }

      this.actionMessage( "Generating table of contents..." );

      this.addXhtmlSource( "<a name=\"" + this.internalLabel( "toc" ) + "\"></a>\n"
                         + "<h3 class=\"pidoc_sectionTitle\">Contents</h3>\n"
                         + "<p class=\"pidoc_sectionToggleButton\" onclick=\"pidoc_toggleSection( 'toc', this );\">[hide]</p>\n"
                         + "<div id=\"toc\">\n"
                         + "<ul>\n" );

      if ( !this.summary.isEmpty() )
         this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "abstract" ) + "\">Abstract</a></li>\n" );

      if ( !this.introduction.isEmpty() )
      {
         this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "introduction" ) + "\">Introduction</a></li>\n" );
         this.makeSubsectionsToc( "introduction" );
      }

      if ( !this.description.isEmpty() )
      {
         this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "description" ) + "\">Description</a></li>\n" );
         this.makeSubsectionsToc( "description" );
      }

      if ( this.isToolDocument() || this.isScriptDocument() )
      {
         if ( this.parameters.length > 0 )
         {
            this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "parameters" ) + "\">Parameters</a></li>\n" );
            for ( var i = 0; i < this.parameters.length; ++i )
               this.addXhtmlSource( "<li class=\"pidoc_tocSubitem\">" +
                        "<a href=\"#" + this.internalLabel( format( "parameter%03d", i+1 ) ) + "\">" +
                        this.parameters[i].title.removeAnchorTags() + "</a></li>\n" );
         }

         if ( !this.usage.isEmpty() )
         {
            this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "usage" ) + "\">Usage</a></li>\n" );
            this.makeSubsectionsToc( "usage" );
         }
      }
      else if ( this.isJSObjectDocument() )
      {
         if ( this.properties.length > 0 )
         {
            this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "properties" ) + "\">Properties</a></li>\n" );
            this.addXhtmlSource( "<table class=\"pidoc_objectToc\">\n" );
            for ( var i = 0; i < this.properties.length; ++i )
               this.addXhtmlSource( "<tr>\n" + jsTableData( this.properties[i].formalDescription,
                                                            this.properties[i].href ) + "</tr>\n" );
            this.addXhtmlSource( "</table>\n" );
         }

         if ( this.staticProperties.length > 0 )
         {
            this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "static_properties" ) + "\">Static Properties</a></li>\n" );
            this.addXhtmlSource( "<table class=\"pidoc_objectToc\">\n" );
            for ( var i = 0; i < this.staticProperties.length; ++i )
               this.addXhtmlSource( "<tr>\n" + jsTableData( this.staticProperties[i].formalDescription,
                                                            this.staticProperties[i].href ) + "</tr>\n" );
            this.addXhtmlSource( "</table>\n" );
         }

         if ( this.eventHandlers.length > 0 )
         {
            this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "event_handlers" ) + "\">Event Handlers</a></li>\n" );
            this.addXhtmlSource( "<table class=\"pidoc_objectToc\">\n" );
            for ( var i = 0; i < this.eventHandlers.length; ++i )
               this.addXhtmlSource( "<tr>\n" + jsTableData( this.eventHandlers[i].formalDescription,
                                                            this.eventHandlers[i].href ) + "</tr>\n" );
            this.addXhtmlSource( "</table>\n" );
         }

         if ( this.constructors.length > 0 )
         {
            this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "constructors" ) + "\">Constructors</a></li>\n" );
            this.addXhtmlSource( "<table class=\"pidoc_objectToc\">\n" );
            for ( var i = 0; i < this.constructors.length; ++i )
               this.addXhtmlSource( "<tr>\n" + jsTableData( this.constructors[i].formalDescription,
                                                            this.constructors[i].href ) + "</tr>\n" );
            this.addXhtmlSource( "</table>\n" );
         }

         if ( this.methods.length > 0 )
         {
            this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "methods" ) + "\">Methods</a></li>\n" );
            this.addXhtmlSource( "<table class=\"pidoc_objectToc\">\n" );
            for ( var i = 0; i < this.methods.length; ++i )
               this.addXhtmlSource( "<tr>\n" + jsTableData( this.methods[i].formalDescription,
                                                            this.methods[i].href ) + "</tr>\n" );
            this.addXhtmlSource( "</table>\n" );
         }

         if ( this.staticMethods.length > 0 )
         {
            this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "static_methods" ) + "\">Static Methods</a></li>\n" );
            this.addXhtmlSource( "<table class=\"pidoc_objectToc\">\n" );
            for ( var i = 0; i < this.staticMethods.length; ++i )
               this.addXhtmlSource( "<tr>\n" + jsTableData( this.staticMethods[i].formalDescription,
                                                            this.staticMethods[i].href ) + "</tr>\n" );
            this.addXhtmlSource( "</table>\n" );
         }

         if ( this.constants.length > 0 )
         {
            this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "constants" ) + "\">Constants</a></li>\n" );
            this.addXhtmlSource( "<table class=\"pidoc_objectToc\">\n" );
            for ( var i = 0; i < this.constants.length; ++i )
               this.addXhtmlSource( "<tr>\n" + jsTableData( this.constants[i].id,
                                                            this.constants[i].href ) + "</tr>\n" );
            this.addXhtmlSource( "</table>\n" );
         }

         if ( this.defines.length > 0 )
         {
            this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "defines" ) + "\">Predefined Constants</a></li>\n" );
            this.addXhtmlSource( "<table class=\"pidoc_objectToc\">\n" );
            for ( var i = 0; i < this.defines.length; ++i )
               this.addXhtmlSource( "<tr>\n" + jsTableData( this.defines[i].id,
                                                            this.defines[i].href ) + "</tr>\n" );
            this.addXhtmlSource( "</table>\n" );
         }
      }
      else // generic
      {
         if ( !this.methodology.isEmpty() )
         {
            this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "methods" ) + "\">Methods</a></li>\n" );
            this.makeSubsectionsToc( "methods" );
         }

         if ( !this.results.isEmpty() )
         {
            this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "results" ) + "\">Results</a></li>\n" );
            this.makeSubsectionsToc( "results" );
         }

         if ( !this.discussion.isEmpty() )
         {
            this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "discussion" ) + "\">Discussion</a></li>\n" );
            this.makeSubsectionsToc( "discussion" );
         }
      }

      for ( var i = 0; i < this.sections.length; ++i )
      {
         this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( this.sections[i].id ) + "\">" +
                              this.sections[i].title.removeAnchorTags() + "</a></li>\n" );
         this.makeSubsectionsToc( this.sections[i].id );
      }

      if ( !this.acknowledgments.isEmpty() )
      {
         this.addXhtmlSource( "<li class=\"pidoc_tocItem\"><a href=\"#" + this.internalLabel( "acknowledgments" ) + "\">Acknowledgments</a></li>\n" );
         this.makeSubsectionsToc( "acknowledgments" );
      }

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
      this.actionMessage( "Generating Abstract section..." );

      if ( this.summary.isEmpty() )
         throw new ParseError( "No Abstract section has been defined.", tokens, index );

      this.addXhtmlSource( "<a name=\"" + this.internalLabel( "abstract" ) + "\"></a>\n" +
                           "<div class=\"pidoc_section\">\n" +
                           "   <h3 class=\"pidoc_sectionTitle\">Abstract</h3>\n" +
                           "   <div id=\"abstract\">\n" );

      this.addXhtmlSource( this.summary );

      this.addXhtmlSource( "   </div>\n" +
                           "</div>\n\n" );
   };

   this.makeIntroduction = function( tokens, index )
   {
      this.actionMessage( "Generating Introduction section..." );

      if ( this.introduction.isEmpty() )
         throw new ParseError( "No Introduction section has been defined.", tokens, index );

      this.addXhtmlSource( "<a name=\"" + this.internalLabel( "introduction" ) + "\"></a>\n" +
                           "<div class=\"pidoc_section\">\n" +
                           "   <h3 class=\"pidoc_sectionTitle\">Introduction</h3>\n\n" );

      this.addXhtmlSource( this.introduction );

      this.addXhtmlSource( "</div>\n\n" );
   };

   this.makeDescription = function( tokens, index )
   {
      this.actionMessage( "Generating Description section..." );

      if ( this.description.isEmpty() )
         throw new ParseError( "No Description section has been defined.", tokens, index );

      this.addXhtmlSource( "<a name=\"" + this.internalLabel( "description" ) + "\"></a>\n" +
                           "<div class=\"pidoc_section\">\n" +
                           "   <h3 class=\"pidoc_sectionTitle\">Description</h3>\n\n" );

      this.addXhtmlSource( this.description );

      this.addXhtmlSource( "</div>\n\n" );
   };

   this.makeUsage = function( tokens, index )
   {
      this.actionMessage( "Generating Usage section..." );

      if ( this.usage.isEmpty() )
         throw new ParseError( "No Usage section has been defined.", tokens, index );

      this.addXhtmlSource( "<a name=\"" + this.internalLabel( "usage" ) + "\"></a>\n" +
                           "<div class=\"pidoc_section\">\n" +
                           "   <h3 class=\"pidoc_sectionTitle\">Usage</h3>\n\n" );

      this.addXhtmlSource( this.usage );

      this.addXhtmlSource( "</div>\n\n" );
   };

   this.makeParameters = function( tokens, index )
   {
      this.actionMessage( "Generating Parameters section..." );

      if ( this.parameters.length <= 0 )
         throw new ParseError( "No parameter sections have been defined.", tokens, index );

      this.addXhtmlSource( "<a name=\"" + this.internalLabel( "parameters" ) + "\"></a>\n" +
                           "<div class=\"pidoc_section\">\n" +
                           "   <h3 class=\"pidoc_sectionTitle\">Parameters</h3>\n\n" );

      for ( var j = 0; j < this.parameters.length; ++j )
         this.addXhtmlSource( "   <a name=\"" + this.internalLabel( format( "parameter%03d", j+1 ) ) + "\"></a>\n" +
                              this.parameters[j].toXhtml() );

      this.addXhtmlSource( "</div>\n\n" );
   };

   this.makeProperties = function( tokens, index )
   {
      this.actionMessage( "Generating Properties section..." );

      if ( this.properties.length <= 0 )
         throw new ParseError( "No property sections have been defined.", tokens, index );

      this.addXhtmlSource( "<a name=\"" + this.internalLabel( "properties" ) + "\"></a>\n" +
                           "<div class=\"pidoc_section\">\n" +
                           "   <h3 class=\"pidoc_sectionTitle\">Properties</h3>\n\n" );

      for ( var j = 0; j < this.properties.length; ++j )
         this.addXhtmlSource( this.properties[j].toXhtml() );

      this.addXhtmlSource( "</div>\n\n" );
   };

   this.makeStaticProperties = function( tokens, index )
   {
      this.actionMessage( "Generating Static Properties section..." );

      if ( this.staticProperties.length <= 0 )
         throw new ParseError( "No static property sections have been defined.", tokens, index );

      this.addXhtmlSource( "<a name=\"" + this.internalLabel( "static_properties" ) + "\"></a>\n" +
                           "<div class=\"pidoc_section\">\n" +
                           "   <h3 class=\"pidoc_sectionTitle\">Static Properties</h3>\n\n" );

      for ( var j = 0; j < this.staticProperties.length; ++j )
         this.addXhtmlSource( this.staticProperties[j].toXhtml() );

      this.addXhtmlSource( "</div>\n\n" );
   };

   this.makeEventHandlers = function( tokens, index )
   {
      this.actionMessage( "Generating Event Handlers section..." );

      if ( this.eventHandlers.length <= 0 )
         throw new ParseError( "No event handler sections have been defined.", tokens, index );

      this.addXhtmlSource( "<a name=\"" + this.internalLabel( "event_handlers" ) + "\"></a>\n" +
                           "<div class=\"pidoc_section\">\n" +
                           "   <h3 class=\"pidoc_sectionTitle\">Event Handlers</h3>\n\n" );

      for ( var j = 0; j < this.eventHandlers.length; ++j )
         this.addXhtmlSource( this.eventHandlers[j].toXhtml() );

      this.addXhtmlSource( "</div>\n\n" );
   };

   this.makeConstructors = function( tokens, index )
   {
      this.actionMessage( "Generating Constructors section..." );

      if ( this.constructors.length <= 0 )
         throw new ParseError( "No constructor sections have been defined.", tokens, index );

      this.addXhtmlSource( "<a name=\"" + this.internalLabel( "constructors" ) + "\"></a>\n" +
                           "<div class=\"pidoc_section\">\n" +
                           "   <h3 class=\"pidoc_sectionTitle\">Constructors</h3>\n\n" );

      for ( var j = 0; j < this.constructors.length; ++j )
         this.addXhtmlSource( this.constructors[j].toXhtml() );

      this.addXhtmlSource( "</div>\n\n" );
   };

   this.makeMethods = function( tokens, index )
   {
      this.actionMessage( "Generating Methods section..." );

      if ( this.methods.length <= 0 )
         throw new ParseError( "No method sections have been defined.", tokens, index );

      this.addXhtmlSource( "<a name=\"" + this.internalLabel( "methods" ) + "\"></a>\n" +
                           "<div class=\"pidoc_section\">\n" +
                           "   <h3 class=\"pidoc_sectionTitle\">Methods</h3>\n\n" );

      for ( var j = 0; j < this.methods.length; ++j )
         this.addXhtmlSource( this.methods[j].toXhtml() );

      this.addXhtmlSource( "</div>\n\n" );
   };

   this.makeStaticMethods = function( tokens, index )
   {
      this.actionMessage( "Generating Static Methods section..." );

      if ( this.staticMethods.length <= 0 )
         throw new ParseError( "No static method sections have been defined.", tokens, index );

      this.addXhtmlSource( "<a name=\"" + this.internalLabel( "static_methods" ) + "\"></a>\n" +
                           "<div class=\"pidoc_section\">\n" +
                           "   <h3 class=\"pidoc_sectionTitle\">Static Methods</h3>\n\n" );

      for ( var j = 0; j < this.staticMethods.length; ++j )
         this.addXhtmlSource( this.staticMethods[j].toXhtml() );

      this.addXhtmlSource( "</div>\n\n" );
   };

   this.makeConstants = function( tokens, index )
   {
      this.actionMessage( "Generating Constants section..." );

      if ( this.constants.length <= 0 )
         throw new ParseError( "No method sections have been defined.", tokens, index );

      this.addXhtmlSource( "<a name=\"" + this.internalLabel( "constants" ) + "\"></a>\n" +
                           "<div class=\"pidoc_section\">\n" +
                           "   <h3 class=\"pidoc_sectionTitle\">Constants</h3>\n\n" );

      for ( var j = 0; j < this.constants.length; ++j )
         this.addXhtmlSource( this.constants[j].toXhtml() );

      this.addXhtmlSource( "</div>\n\n" );
   };

   this.makeDefines = function( tokens, index )
   {
      this.actionMessage( "Generating Predefined Constants section..." );

      if ( this.defines.length <= 0 )
         throw new ParseError( "No #define sections have been defined.", tokens, index );

      this.addXhtmlSource( "<a name=\"" + this.internalLabel( "defines" ) + "\"></a>\n" +
                           "<div class=\"pidoc_section\">\n" +
                           "   <h3 class=\"pidoc_sectionTitle\">Predefined Constants</h3>\n\n" );

      for ( var j = 0; j < this.defines.length; ++j )
         this.addXhtmlSource( this.defines[j].toXhtml() );

      this.addXhtmlSource( "</div>\n\n" );
   };

   this.makeMethodology = function()
   {
      this.actionMessage( "Generating Methods section..." );

      if ( this.methodology.isEmpty() )
         throw new ParseError( "No Methods section has been defined.", tokens, index );

      this.addXhtmlSource( "<a name=\"" + this.internalLabel( "methods" ) + "\"></a>\n" +
                           "<div class=\"pidoc_section\">\n" +
                           "   <h3 class=\"pidoc_sectionTitle\">Methods</h3>\n\n" );

      this.addXhtmlSource( this.methodology );

      this.addXhtmlSource( "</div>\n\n" );
   };

   this.makeResults = function()
   {
      this.actionMessage( "Generating Results section..." );

      if ( this.results.isEmpty() )
         throw new ParseError( "No Results section has been defined.", tokens, index );

      this.addXhtmlSource( "<a name=\"" + this.internalLabel( "results" ) + "\"></a>\n" +
                           "<div class=\"pidoc_section\">\n" +
                           "   <h3 class=\"pidoc_sectionTitle\">Results</h3>\n\n" );

      this.addXhtmlSource( this.results );

      this.addXhtmlSource( "</div>\n\n" );
   };

   this.makeDiscussion = function()
   {
      this.actionMessage( "Generating Discussion section..." );

      if ( this.discussion.isEmpty() )
         throw new ParseError( "No Discussion section has been defined.", tokens, index );

      this.addXhtmlSource( "<a name=\"" + this.internalLabel( "discussion" ) + "\"></a>\n" +
                           "<div class=\"pidoc_section\">\n" +
                           "   <h3 class=\"pidoc_sectionTitle\">Discussion</h3>\n\n" );

      this.addXhtmlSource( this.discussion );

      this.addXhtmlSource( "</div>\n\n" );
   };

   this.makeSections = function( tokens, index )
   {
      if ( this.sections.length <= 0 )
         throw new ParseError( "No custom sections have been defined.", tokens, index );

      this.actionMessage( "Generating " + this.sections.length.toString() + " custom section(s)..." );

      for ( var j = 0; j < this.sections.length; ++j )
         this.addXhtmlSource( this.sections[j].toXhtml() );

      this.addXhtmlSource( "\n" );
   };

   this.makeAcknowledgments = function()
   {
      this.actionMessage( "Generating Acknowledgments section..." );

      if ( this.acknowledgments.isEmpty() )
         throw new ParseError( "No Acknowledgments section has been defined.", tokens, index );

      this.addXhtmlSource( "<a name=\"" + this.internalLabel( "acknowledgments" ) + "\"></a>\n" +
                           "<div class=\"pidoc_section\">\n" +
                           "   <h3 class=\"pidoc_sectionTitle\">Acknowledgments</h3>\n\n" );

      this.addXhtmlSource( this.acknowledgments );

      this.addXhtmlSource( "</div>\n\n" );
   };

   this.makeReferences = function( tokens, index )
   {
      this.actionMessage( "Generating References section..." );

      if ( this.references.length <= 0 )
         throw new ParseError( "No references have been defined.", tokens, index );

      this.addXhtmlSource( "<a name=\"" + this.internalLabel( "references" ) + "\"></a>\n" +
                           "<div class=\"pidoc_section\">\n" +
                           "   <h3 class=\"pidoc_sectionTitle\">References</h3>\n" +
                           "   <div id=\"references\">\n" );

      for ( var j = 0; j < this.references.length; ++j )
         this.addXhtmlSource( "      <a name=\"" + this.internalNumberedLabel( "reference", j+1 ) + "\"></a>\n" +
                              "      <p><strong>[" + (j+1).toString() + "]</strong> " + this.references[j].toXhtml() + "</p>\n" );

      this.addXhtmlSource( "   </div>\n" +
                           "</div>\n\n" );
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
      if ( this.relatedTools.length <= 0 && this.relatedScripts.length <= 0 && this.relatedObjects.length <= 0 &&
           this.relatedDocuments.length <= 0 && this.relatedResources.length <= 0 )
         throw new ParseError( "No related items have been defined.", tokens, index );

      if ( this.relatedTools.length > 0 )
      {
         this.actionMessage( "Generating Related Tools section..." );

         this.addXhtmlSource( "<a name=\"" + this.internalLabel( "relatedTools" ) + "\"></a>\n" +
                              "<div class=\"pidoc_section\">\n" +
                              "   <h3 class=\"pidoc_sectionTitle\">Related Tools</h3>\n" +
                              "   <div id=\"relatedTools\">\n" +
                              "      <p>" );

         for ( var j = 0; j < this.relatedTools.length; ++j )
         {
            if ( j > 0 )
               this.addXhtmlSource( ", " );
            this.addXhtmlSource( this.relatedTools[j].toXhtml() );
         }

         this.addXhtmlSource( "</p>\n" +
                              "   </div>\n" +
                              "</div>\n\n" );
      }

      if ( this.relatedScripts.length > 0 )
      {
         this.actionMessage( "Generating Related Scripts section..." );

         this.addXhtmlSource( "<a name=\"" + this.internalLabel( "relatedScripts" ) + "\"></a>\n" +
                              "<div class=\"pidoc_section\">\n" +
                              "   <h3 class=\"pidoc_sectionTitle\">Related Scripts</h3>\n" +
                              "   <div id=\"relatedScripts\">\n" +
                              "      <p>" );

         for ( var j = 0; j < this.relatedScripts.length; ++j )
         {
            if ( j > 0 )
               this.addXhtmlSource( ", " );
            this.addXhtmlSource( this.relatedScripts[j].toXhtml() );
         }

         this.addXhtmlSource( "</p>\n" +
                              "   </div>\n" +
                              "</div>\n\n" );
      }

      if ( this.relatedObjects.length > 0 )
      {
         this.actionMessage( "Generating Related Objects section..." );

         this.addXhtmlSource( "<a name=\"" + this.internalLabel( "relatedObjects" ) + "\"></a>\n" +
                              "<div class=\"pidoc_section\">\n" +
                              "   <h3 class=\"pidoc_sectionTitle\">Related Objects</h3>\n" +
                              "   <div id=\"relatedObjects\">\n" +
                              "      <p>" );

         for ( var j = 0; j < this.relatedObjects.length; ++j )
         {
            if ( j > 0 )
               this.addXhtmlSource( ", " );
            this.addXhtmlSource( this.relatedObjects[j].toXhtml() );
         }

         this.addXhtmlSource( "</p>\n" +
                              "   </div>\n" +
                              "</div>\n\n" );
      }

      if ( this.relatedDocuments.length > 0 )
      {
         this.actionMessage( "Generating Related Documents section..." );

         this.addXhtmlSource( "<a name=\"" + this.internalLabel( "relatedDocuments" ) + "\"></a>\n" +
                              "<div class=\"pidoc_section\">\n" +
                              "   <h3 class=\"pidoc_sectionTitle\">Related Documents</h3>\n" +
                              "   <div id=\"relatedDocuments\">\n" +
                              "      <p>" );

         for ( var j = 0; j < this.relatedDocuments.length; ++j )
         {
            if ( j > 0 )
               this.addXhtmlSource( ", " );
            this.addXhtmlSource( this.relatedDocuments[j].toXhtml() );
         }

         this.addXhtmlSource( "</p>\n" +
                              "   </div>\n" +
                              "</div>\n\n" );
      }

      if ( this.relatedResources.length > 0 )
      {
         this.actionMessage( "Generating Related Resources section..." );

         this.addXhtmlSource( "<a name=\"" + this.internalLabel( "relatedResources" ) + "\"></a>\n" +
                              "<div class=\"pidoc_section\">\n" +
                              "   <h3 class=\"pidoc_sectionTitle\">Related Resources</h3>\n" +
                              "   <div id=\"relatedResources\">\n" +
                              "      <ul>\n" );

         for ( var j = 0; j < this.relatedResources.length; ++j )
            this.addXhtmlSource( "         <li>" + this.relatedResources[j].toXhtml() + "</li>\n" );

         this.addXhtmlSource( "      </ul>\n" +
                              "   </div>\n" +
                              "</div>\n\n" );
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

      var refMark = String.fromCharCode( REFMARK );
      var sepMark = String.fromCharCode( SEPMARK );

      function solveRecursively( xhtmlSource )
      {
         var i = xhtmlSource.indexOf( refMark );
         if ( i < 0 )
            return xhtmlSource;
         var j = xhtmlSource.indexOf( refMark, i+1 );
         if ( j < 0 )
            throw new Error( "*** Internal error: symbolic reference: missing termination mark." );
         //var r = xhtmlSource.substring( i+1, j );
         var p1 = xhtmlSource.indexOf( sepMark, i+1 );
         if ( p1 < 0 || p1 > j )
            throw new Error( "*** Internal error: symbolic reference: missing separator." );
         var p2 = xhtmlSource.indexOf( sepMark, p1+1 );
         if ( p2 < 0 || p2 > j )
            throw new Error( "*** Internal error: symbolic reference: missing separator." );
         var p3 = xhtmlSource.indexOf( sepMark, p2+1 );
         if ( p3 < 0 || p3 > j )
            throw new Error( "*** Internal error: symbolic reference: missing separator." );
         var type = xhtmlSource.substring( i+1, p1 );
         var name = xhtmlSource.substring( p1+1, p2 );
         var file = xhtmlSource.substring( p2+1, p3 );
         var line = xhtmlSource.substring( p3+1 );
         var location = file + ':' + line;
         if ( type.isEmpty() )
            throw new ParseError( "Internal error: symbolic reference: missing reference type.", location );
         if ( name.isEmpty() )
            throw new ParseError( "Internal error: symbolic reference: missing reference name.", location );

         var number = -1;
         var text = "";
         var link = true;
         var sup = false;
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
               var a = document.equationNumberAndFileNameForName( name );
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

         var source = xhtmlSource.substring( 0, i );

         if ( sup )
            source += "<sup>";

         if ( link )
         {
            var capType = type[0].toUpperCase() + type.substring( 1 );
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

      for ( var i = 0; i < this.references.length; ++i )
         if ( this.references[i].count == 0 )
            this.warning( "Unreferenced bibliographic reference \'" +
                          this.references[i].name + "\' (= Reference " + i.toString() + ")" );
      for ( var i = 0; i < this.equationNames.length; ++i )
         if ( this.equationNames[i].count == 0 )
            this.warning( "Unreferenced numbered equation \'" +
                          this.equationNames[i].name + "\' (= Equation " + this.equationNames[i].number.toString() + ")." );
      for ( var i = 0; i < this.figureNames.length; ++i )
         if ( this.figureNames[i].count == 0 )
            this.warning( "Unreferenced numbered figure \'" +
                          this.figureNames[i].name + "\' (= Figure " + this.figureNames[i].number.toString() + ")." );
      for ( var i = 0; i < this.tableNames.length; ++i )
         if ( this.tableNames[i].count == 0 )
            this.warning( "Unreferenced numbered table \'" +
                          this.tableNames[i].name + "\' (= Table " + this.tableNames[i].number.toString() + ")." );
   };
}

PIDocDocument.prototype = new Object;

/*
 * Global document object
 */
var document = new PIDocDocument;

// ****************************************************************************
// EOF PIDocDocument.js - Released 2014/02/01 17:08:18 UTC
