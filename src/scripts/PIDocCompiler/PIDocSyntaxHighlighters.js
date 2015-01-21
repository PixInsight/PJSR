// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// PIDocSyntaxHighlighters.js - Released 2015/01/18 20:22:19 UTC
// ****************************************************************************
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
// ****************************************************************************

/*
 * PixInsight Documentation Compiler
 *
 * Copyright (C) 2010-2015 Pleiades Astrophoto. All Rights Reserved.
 * Written by Juan Conejero (PTeam)
 *
 * Syntax highlighting of \code blocks.
 */

/*
 * RegExp-based syntax highlighting rule.
 */
function SyntaxHighlightingRule( pattern, cssClass )
{
   this.__base__ = Object;
   this.__base__();

   this.pattern = pattern;
   this.cssClass = cssClass;

   this.findMatches = function( text, start, end )
   {
      if ( start == undefined )
         start = 0;
      else
         start = Math.max( 0, start );

      if ( end == undefined )
         end = text.length;
      else
         end = Math.min( end, text.length );

      for ( let m = [], i = 0, x = new RegExp( this.pattern, "g" ); ; )
      {
         let r = x.exec( text );
         if ( r == null || r.index >= end )
            return m;
         if ( r.index >= start )
            m.push( {start:r.index, end:x.lastIndex, cssClass:this.cssClass} );
      }
   };
}

SyntaxHighlightingRule.prototype = new Object;

/*
 * Base object for all syntax highlighters.
 */
function SyntaxHighlighter()
{
   this.__base__ = Object;
   this.__base__();

   this.matchBlockRules = function( M, text, rules, start, end )
   {
      if ( start == undefined )
         start = 0;
      if ( end == undefined )
         end = text.length;
      for ( let i = 0; i < rules.length; ++i )
      {
         let m = rules[i].findMatches( text, start, end );
         for ( let j = 0; j < m.length; ++j )
            this.setFormat( M, m[j].start, m[j].end, m[j].cssClass );
      }
   };

   this.matchBlockRulesWithFunctionCalls = function( M, text, rules, start, end )
   {
      if ( start == undefined )
         start = 0;
      if ( end == undefined )
         end = text.length;
      for ( let i = 0; i < rules.length; ++i )
      {
         let m = rules[i].findMatches( text, start, end );
         for ( let j = 0; j < m.length; ++j )
         {
            if ( text[m[j].end-1] == '(' ) // don't include '(' after function identifier
               if ( --m[j].end <= m[j].start )
                  continue;
            this.setFormat( M, m[j].start, m[j].end, m[j].cssClass );
         }
      }
   };

   this.matchMultilineCPreprocessorDirectives = function( M, text )
   {
      for ( let startIndex; ; ++startIndex )
      {
         startIndex = text.indexOf( '#', startIndex );
         if ( startIndex < 0 )
            break;
         if ( !this.inStringOrCxxSingleLineComment( text, startIndex ) )
         {
            let isPPD = true;
            for ( let i = startIndex; --i > 0; )
            {
               let c = text.charCodeAt( i );
               if ( c != SP && c != HT )
               {
                  isPPD = c == LF;
                  break;
               }
            }
            if ( isPPD )
            {
               let eolIndex = text.indexOf( '\n', startIndex );
               if ( eolIndex < 0 )
                  eolIndex = text.length;
               this.setFormat( M, startIndex, eolIndex, "preprocessor" );

               let isEBS;
               do
               {
                  isEBS = false;
                  let ebsIndex = text.indexOf( '\\', startIndex );
                  if ( ebsIndex > 0 && ebsIndex < eolIndex )
                     if ( !this.inCxxSingleLineComment( text, ebsIndex ) )
                     {
                        isEBS = true;
                        for ( let i = ebsIndex; ++i < eolIndex; )
                        {
                           let c = text.charCodeAt( i );
                           if ( c != SP && c != HT )
                           {
                              isEBS = c == LF;
                              break;
                           }
                        }
                        if ( isEBS )
                        {
                           startIndex = eolIndex+1;
                           eolIndex = text.indexOf( '\n', startIndex );
                           if ( eolIndex < 0 )
                              eolIndex = text.length;
                           this.setFormat( M, startIndex, eolIndex, "preprocessor" );
                        }
                     }
               }
               while ( isEBS );

               startIndex = eolIndex;
            }
         }
      }
   };

   this.matchCSingleLineComments = function( M, text )
   {
      for ( let startIndex; ; )
      {
         startIndex = text.indexOf( "//", startIndex );
         if ( startIndex < 0 )
            break;

         if ( !this.inString( text, startIndex ) )
         {
            let eolIndex = text.indexOf( '\n', startIndex+2 );
            if ( eolIndex < 0 )
               eolIndex = text.length;
            this.setFormat( M, startIndex, eolIndex, "singleLineComment" );

            this.matchBlockRules( M, text, SyntaxHighlighter.alertRules, startIndex+2, eolIndex );

            startIndex = eolIndex+1;
         }
         else
            startIndex += 2;
      }
   };

   this.matchCMultilineComments = function( M, text )
   {
      for ( let startIndex; ; startIndex += 2 )
      {
         startIndex = text.indexOf( "/*", startIndex );
         if ( startIndex < 0 )
            break;

         if ( !this.inStringOrCxxSingleLineComment( text, startIndex+1 ) ) // +1 because it could be //\*
         {
            let endIndex = text.indexOf( "\*\/", startIndex+2 );
            if ( endIndex < 0 )
               endIndex = text.length;
            this.setFormat( M, startIndex, endIndex+2, "multiLineComment" );

            this.matchBlockRules( M, text, SyntaxHighlighter.alertRules, startIndex+2, endIndex );

            startIndex = endIndex;
         }
      }
   };

   this.setFormat = function( M, start, end, cssClass )
   {
      start = Math.max( 0, start );
      end = Math.min( end, M.length );

      // Intersection with the previous format item
      for ( let i = start; --i >= 0; )
         if ( M[i] != null )
         {
            let j = i + M[i].length;
            if ( j > start )
            {
               M[i].length = start - i;
               if ( j > end )
                  M[end] = {length:j-end, cssClass:M[i].cssClass};
            }
            break;
         }
      // Intersections with overlapped format items
      for ( let i = start; i < end; ++i )
         if ( M[i] != null )
         {
            let j = i + M[i].length;
            if ( j > end )
               M[end] = {length:j-end, cssClass:M[i].cssClass};
            M[i] = null;
         }

      M[start] = {length:end-start, cssClass:cssClass};
   };

   this.applyFormat = function( text, M )
   {
      let highlighted = "";
      for ( let i = 0, start = 0; ; )
      {
         if ( M[i] != null )
         {
            if ( start < i )
               highlighted += text.substring( start, i );
            start = i + M[i].length;
            highlighted += "<span class=\"pidoc_sh_" + M[i].cssClass + "\">" + text.substring( i, start ) + "</span>";
            i = start;
         }
         else
            ++i;

         if ( i >= M.length )
         {
            if ( start < M.length )
               highlighted += text.substring( start );
            break;
         }
      }
      return highlighted;
   };

   this.inString = function( text, i )
   {
      let dquo = false;
      let squo = false;

      while ( --i >= 0 )
      {
         let c = text[i];
         if ( c == '\n' )
            return false;
         if ( i == 0 || text[i-1] != '\\' )
            if ( c == '\"' )
            {
               if ( !squo )
                  dquo = !dquo;
            }
            else if ( c == '\'' )
            {
               if ( !dquo )
                  squo = !squo;
            }
      }

      return dquo || squo;
   };

   this.inStringOrCxxSingleLineComment = function( text, i )
   {
      let dquo = false;
      let squo = false;

      while ( --i >= 0 )
      {
         let c = text[i];
         if ( c == '\n' )
            return false;
         if ( i == 0 || text[i-1] != '\\' )
            if ( c == '\"' )
            {
               if ( !squo )
                  dquo = !dquo;
            }
            else if ( c == '\'' )
            {
               if ( !dquo )
                  squo = !squo;
            }
         if ( !(dquo || squo) )
            if ( c == '/' && i > 0 && text[i-1] == '/' )
               return true;
      }

      return dquo || squo;
   };

   this.inCxxSingleLineComment = function( text, i )
   {
      while ( --i >= 0 )
      {
         let c = text[i];
         if ( c == '\n' )
            return false;
         if ( c == '/' && i > 0 && text[i-1] == '/' )
            return true;
      }

      return false;
   };
}

SyntaxHighlighter.prototype = new Object;

SyntaxHighlighter.alertRules =
[
   new SyntaxHighlightingRule( "###",            "alert" ),
   new SyntaxHighlightingRule( "\\bXXX\\b",      "alert" ),
   new SyntaxHighlightingRule( "\\bALERT\\b",    "alert" ),
   new SyntaxHighlightingRule( "\\bBUG\\b",      "alert" ),
   new SyntaxHighlightingRule( "\\bDANGER\\b",   "alert" ),
   new SyntaxHighlightingRule( "\\bERROR\\b",    "alert" ),
   new SyntaxHighlightingRule( "\\bFIXME\\b",    "alert" ),
   new SyntaxHighlightingRule( "\\bREMOVEME\\b", "alert" ),
   new SyntaxHighlightingRule( "\\bTODO\\b",     "alert" ),
   new SyntaxHighlightingRule( "\\bN\\.B\\.",    "alert" ),
   new SyntaxHighlightingRule( "\\bNOTE\\b",     "alert" ),
   new SyntaxHighlightingRule( "\\bWARNING\\b",  "alert" )
];

/*
 * JavaScript/PJSR Syntax Highlighter
 */
function JSSyntaxHighlighter()
{
   this.__base__ = SyntaxHighlighter;
   this.__base__();

   this.highlightingRules = new Array;

   for ( let i = 0; i < JSSyntaxHighlighter.reservedWords.length; ++i )
      this.highlightingRules.push( new SyntaxHighlightingRule( "\\b" + JSSyntaxHighlighter.reservedWords[i] + "\\b", "keyword" ) );

   for ( let i = 0; i < JSSyntaxHighlighter.ecmaReservedWords.length; ++i )
      this.highlightingRules.push( new SyntaxHighlightingRule( "\\b" + JSSyntaxHighlighter.ecmaReservedWords[i] + "\\b", "ecmaKeyword" ) );

   this.highlightingRules.push( new SyntaxHighlightingRule( "\\b[A-Za-z0-9_]+(?=\\()", "function" ) );

   /*
    * N.B. Rules for JavaScript core objects and installed processes must be
    * added *after* the above function rule, or object constructor calls won't
    * be highlighted correctly.
    */

   let coreObjects = TypeDescription.coreObjects;
   for ( let i = 0; i < coreObjects.length; ++i )
      this.highlightingRules.push( new SyntaxHighlightingRule( "\\b" + coreObjects[i] + "(?:\\b|\\()", "object" ) );

   let externalObjects = TypeDescription.externalObjects;
   for ( let i = 0; i < externalObjects.length; ++i )
      this.highlightingRules.push( new SyntaxHighlightingRule( "\\b" + externalObjects[i] + "(?:\\b|\\()", "externalObject" ) );

   this.highlightingRules.push( new SyntaxHighlightingRule( "((\\b[0-9]+)?\\.)?\\b[0-9]+([eE][-+]?[0-9]+)?\\b", "number" ) );
   this.highlightingRules.push( new SyntaxHighlightingRule( "\\b0[xX][0-9a-fA-F]+\\b", "hexNumber" ) );
   this.highlightingRules.push( new SyntaxHighlightingRule( "\'([^\'\\n\\\\]|\\\\.)*\'", "quotation" ) );
   this.highlightingRules.push( new SyntaxHighlightingRule( "\"([^\"\\n\\\\]|\\\\.)*\"", "quotation" ) );

   this.highlight = function( text )
   {
      let M = new Array( text.length );
      for ( let i = 0; i < M.length; ++i )
         M[i] = null;

      this.matchBlockRulesWithFunctionCalls( M, text, this.highlightingRules );
      this.matchMultilineCPreprocessorDirectives( M, text );
      this.matchCSingleLineComments( M, text );
      this.matchCMultilineComments( M, text );

      return this.applyFormat( text, M );
   };
}

JSSyntaxHighlighter.prototype = new SyntaxHighlighter;

JSSyntaxHighlighter.reservedWords =
[
   "break", "case", "catch", "class", "const", "constructor", "continue",
   "debugger", "default", "delete", "do", "else", "export", "extends", "false",
   "finally", "for", "function", "get", "if", "import", "in", "instanceof",
   "let", "new", "null", "prototype", "return", "set", "static", "super",
   "switch", "this", "throw", "true", "try", "typeof", "undefined", "var",
   "void", "while", "with", "yield", "Infinity", "NaN"
];

JSSyntaxHighlighter.ecmaReservedWords =
[
   "abstract", "arguments", "await", "boolean", "byte", "char", "double",
   "enum", "final", "float", "goto", "implements", "int", "interface", "long",
   "native", "package", "private", "protected", "public", "short",
   "synchronized", "transient", "volatile"
];

/*
 * C++/PCL Syntax Highlighter
 */
function CppSyntaxHighlighter()
{
   this.__base__ = SyntaxHighlighter;
   this.__base__();

   this.highlightingRules = new Array;

   for ( let i = 0; i < CppSyntaxHighlighter.reservedWords.length; ++i )
      this.highlightingRules.push( new SyntaxHighlightingRule( "\\b" + CppSyntaxHighlighter.reservedWords[i] + "\\b", "keyword" ) );

   for ( let i = 0; i < CppSyntaxHighlighter.pclReservedWords.length; ++i )
      this.highlightingRules.push( new SyntaxHighlightingRule( "\\b" + CppSyntaxHighlighter.pclReservedWords[i] + "\\b", "pclKeyword" ) );

   for ( let i = 0; i < CppSyntaxHighlighter.qtReservedWords.length; ++i )
      this.highlightingRules.push( new SyntaxHighlightingRule( "\\b" + CppSyntaxHighlighter.qtReservedWords[i] + "\\b", "qtKeyword" ) );

   this.highlightingRules.push( new SyntaxHighlightingRule( "\\b[A-Za-z0-9_]+(?=\\()", "function" ) );
   this.highlightingRules.push( new SyntaxHighlightingRule( "((\\b[0-9]+)?\\.)?\\b[0-9]+([eE][-+]?[0-9]+)?\\b", "number" ) );
   this.highlightingRules.push( new SyntaxHighlightingRule( "\\b0[xX][0-9a-fA-F]+\\b", "hexNumber" ) );
   this.highlightingRules.push( new SyntaxHighlightingRule( "\\b0[0-7]+\\b", "octNumber" ) );
   this.highlightingRules.push( new SyntaxHighlightingRule( "\'([^\'\\n\\\\]|\\\\.)*\'", "quotation" ) );
   this.highlightingRules.push( new SyntaxHighlightingRule( "\"([^\"\\n\\\\]|\\\\.)*\"", "quotation" ) );

   this.pclMacroRules = new Array;

   this.pclMacroRules.push( new SyntaxHighlightingRule( "\\b(__)?PCL_[A-Za-z0-9_]+\\b", "pclMacro" ) );
   this.pclMacroRules.push( new SyntaxHighlightingRule( "\\bERROR_HANDLER\\b", "pclMacro" ) );
   this.pclMacroRules.push( new SyntaxHighlightingRule( "\\bERROR_CLEANUP\\b", "pclMacro" ) );
   this.pclMacroRules.push( new SyntaxHighlightingRule( "\\bINIT_THREAD_MONITOR\\b", "pclMacro" ) );
   this.pclMacroRules.push( new SyntaxHighlightingRule( "\\bUPDATE_THREAD_MONITOR\\b", "pclMacro" ) );
   this.pclMacroRules.push( new SyntaxHighlightingRule( "\\bUPDATE_THREAD_MONITOR_CHUNK\\b", "pclMacro" ) );

   this.highlight = function( text )
   {
      let M = new Array( text.length );
      for ( let i = 0; i < M.length; ++i )
         M[i] = null;

      this.matchBlockRulesWithFunctionCalls( M, text, this.highlightingRules );
      this.matchMultilineCPreprocessorDirectives( M, text );
      this.matchBlockRules( M, text, this.pclMacroRules );
      this.matchCSingleLineComments( M, text );
      this.matchCMultilineComments( M, text );

      return this.applyFormat( text, M );
   };
}

CppSyntaxHighlighter.prototype = new SyntaxHighlighter;

CppSyntaxHighlighter.reservedWords =
[
   "alignas", "alignof", "and", "and_eq", "asm", "auto", "bitand", "bitor",
   "bool", "break", "case", "catch", "char", "char16_t", "char32_t", "class",
   "compl", "const", "constexpr", "const_cast", "continue", "decltype",
   "default", "delete", "do", "double", "dynamic_cast", "else", "enum",
   "explicit", "export", "extern", "false", "float", "for", "friend", "goto",
   "if", "inline", "int", "int8_t", "int16_t", "int32_t", "int64_t", "intmax_t",
   "long", "mutable", "namespace", "new", "noexcept", "not", "not_eq",
   "nullptr", "operator", "or", "or_eq", "private", "protected", "public",
   "reinterpret_cast", "return", "short", "signed", "sizeof", "static",
   "static_assert", "static_cast", "struct", "switch", "template", "this",
   "thread_local", "throw", "true", "try", "typedef", "typeid", "typename",
   "union", "unsigned", "uint8_t", "uint16_t", "uint32_t", "uint64_t",
   "uintmax_t", "using", "virtual", "void", "volatile", "wchar_t", "while",
   "xor", "xor_eq"
];

CppSyntaxHighlighter.pclReservedWords =
[
   "char16_type",
   "char32_type",
   "distance_type",
   "fpos_type",
   "fsize_type",
   "int16",
   "int32",
   "int64",
   "int8",
   "pcl",
   "size_type",
   "uint16",
   "uint32",
   "uint64",
   "uint8"
];

CppSyntaxHighlighter.qtReservedWords =
[
   "foreach",
   "forever",
   "emit",
   "signals",
   "slots",
   "connect",
   "SIGNAL",
   "SLOT",
   "Q_OBJECT",
   "Q_ENUM",
   "Q_PROPERTY",
   "Q_SIGNALS",
   "Q_SLOTS",
   "qobject_cast"
];

/*
 * PixelMath Syntax Highlighter
 */
function PMathSyntaxHighlighter()
{
   this.__base__ = SyntaxHighlighter;
   this.__base__();

   this.highlightingRules = new Array;

   this.highlightingRules.push( new SyntaxHighlightingRule( "\\b[A-Za-z0-9_]+(?=\\()", "function" ) );
   this.highlightingRules.push( new SyntaxHighlightingRule( "((\\b[0-9]+)?\\.)?\\b[0-9]+([eE][-+]?[0-9]+)?\\b", "number" ) );
   this.highlightingRules.push( new SyntaxHighlightingRule( "\\b0[xX][0-9a-fA-F]+\\b", "hexNumber" ) );
   this.highlightingRules.push( new SyntaxHighlightingRule( "\\b0[0-7]+\\b", "octNumber" ) );
   this.highlightingRules.push( new SyntaxHighlightingRule( "\\$[TMA]", "keyword" ) );
   this.highlightingRules.push( new SyntaxHighlightingRule( "\\$target\\b", "keyword" ) );
   this.highlightingRules.push( new SyntaxHighlightingRule( "\\$mask\\b", "keyword" ) );
   this.highlightingRules.push( new SyntaxHighlightingRule( "\\$active\\b", "keyword" ) );
   this.highlightingRules.push( new SyntaxHighlightingRule( "\'([^\'\\n\\\\]|\\\\.)*\'", "quotation" ) );
   this.highlightingRules.push( new SyntaxHighlightingRule( "\"([^\"\\n\\\\]|\\\\.)*\"", "quotation" ) );

   this.highlight = function( text )
   {
      let M = new Array( text.length );
      for ( let i = 0; i < M.length; ++i )
         M[i] = null;

      this.matchBlockRulesWithFunctionCalls( M, text, this.highlightingRules );
      this.matchCSingleLineComments( M, text );
      this.matchCMultilineComments( M, text );

      return this.applyFormat( text, M );
   };
}

PMathSyntaxHighlighter.prototype = new SyntaxHighlighter;

/*
 * XML Syntax Highlighter (generic)
 */
function XMLSyntaxHighlighter()
{
   this.__base__ = SyntaxHighlighter;
   this.__base__();

   this.highlightingRules = new Array;

   this.highlightingRules.push( new SyntaxHighlightingRule( "(&[^&;]*;)", "xmlEntity" ) );
   this.highlightingRules.push( new SyntaxHighlightingRule( "(&lt;/?[^0-9][a-zA-Z0-9:_-]*)\\s*(&gt;)?", "xmlTag" ) );
   this.highlightingRules.push( new SyntaxHighlightingRule( "([/|\\?]?&gt;)", "xmlTag" ) );
   this.highlightingRules.push( new SyntaxHighlightingRule( "\\s([\\w\:]*)\\s*\\=", "xmlAttributeName" ) );
   this.highlightingRules.push( new SyntaxHighlightingRule( "\\=\\s*(\'[^\']*\')", "xmlAttributeValue" ) );
   this.highlightingRules.push( new SyntaxHighlightingRule( "\\=\\s*(\"[^\"]*\")", "xmlAttributeValue" ) );

   this.highlight = function( text )
   {
      let M = new Array( text.length );
      for ( let i = 0; i < M.length; ++i )
         M[i] = null;

      for ( let i = 0; i < this.highlightingRules.length; ++i )
      {
         let m = this.highlightingRules[i].findMatches( text, 0, text.length );
         for ( let j = 0; j < m.length; ++j )
         {
            if ( text[m[j].start] == '=' )      // attribute values don't include the equal sign
               if ( ++m[j].start == m[j].end )
                  continue;
            while ( text[m[j].start] == ' ' )   // skip leading white space
               if ( ++m[j].start == m[j].end )
                  continue;

            if ( text[m[j].end-1] == '=' )      // attributes don't include the equal sign
               if ( --m[j].end <= m[j].start )
                  continue;
            while ( text[m[j].end-1] == ' ' )   // remove trailing white space
               if ( --m[j].end <= m[j].start )
                  continue;

            this.setFormat( M, m[j].start, m[j].end, m[j].cssClass );
         }
      }

      // CDATA

      for ( let startIndex = 0; ; startIndex += 6 )
      {
         startIndex = text.indexOf( "&lt;![CDATA[", startIndex );
         if ( startIndex < 0 )
            break;

         let endIndex = text.indexOf( "]]&gt;", startIndex+12 );
         if ( endIndex < 0 )
            endIndex = text.length;

         this.setFormat( M, startIndex, endIndex+6, "xmlCDATA" );

         startIndex = endIndex;
      }

      // Multiline comments

      for ( let startIndex = 0; ; startIndex += 6 )
      {
         startIndex = text.indexOf( "&lt;!--", startIndex );
         if ( startIndex < 0 )
            break;

         let endIndex = text.indexOf( "--&gt;", startIndex+7 );
         if ( endIndex < 0 )
            endIndex = text.length;
         this.setFormat( M, startIndex, endIndex+6, "multiLineComment" );

         startIndex = endIndex;
      }

      return this.applyFormat( text, M );
   };
}

XMLSyntaxHighlighter.prototype = new SyntaxHighlighter;

/*
 * PIDoc Syntax Highlighter
 */
function PIDocSyntaxHighlighter()
{
   this.__base__ = SyntaxHighlighter;
   this.__base__();

   this.commands = new Array;
   this.referenceCommands = new Array;
   this.referenceCommands.push( "reference" );
   this.referenceCommands.push( "label" );
   for ( let i = 0; i < MetaCommand.commands.length; ++i )
   {
      let c = MetaCommand.commands[i];
      this.commands.push( c.id );
      if ( c.id.endsWith( "ref" ) || c.id.endsWith( "num" ) )
         this.referenceCommands.push( c.id );
   }

   this.highlight = function( text )
   {
      text = text.replace( "&amp;", "*amp;", "g"
                  ).replace( "&lt;", "*lt;", "g"
                     ).replace( "&gt;", "*gt;", "g" );

      let M = new Array( text.length );
      for ( let i = 0; i < M.length; ++i )
         M[i] = null;

      // PIDoc commands

      for ( let i = 0; i < this.commands.length; ++i )
         for ( let index = 0; ; )
         {
            index = text.indexOf( this.commands[i], index );
            if ( index <= 0 )
               break;

            let length = this.commands[i].length;

            if ( text[index-1] == '\\' )
               if ( index < 2 || text[index-2] != '\\' )
                  if ( this.isWordSeparator( text, index + length ) )
                  {
                     this.setFormat( M, index-1, index+length, "pidocCommand" );

                     // Highlight reference command arguments
                     if ( this.referenceCommands.indexOf( this.commands[i] ) >= 0 )
                     {
                        let x = /\b\S+\b/g;
                        x.lastIndex = index + length;
                        let r = x.exec( text );
                        if ( r != null )
                           this.setFormat( M, r.index, x.lastIndex, "pidocReference" );
                     }
                  }

            index += length;
         }

      // PIDoc block delimiters

      {
         let r = new SyntaxHighlightingRule( "(?:^|[^\\\\])[\\{\\}]+", "pidocBlockDelimiter" );
         let m = r.findMatches( text, 0, text.length );
         for ( let j = 0; j < m.length; ++j )
            this.setFormat( M, m[j].end-1, m[j].end, m[j].cssClass ); // N.B.: the regexp can match one or two characters
      }

      // Character entities

      {
         let r = new SyntaxHighlightingRule( "(&[^&;]*;)", "pidocCharacterEntity" );
         let m = r.findMatches( text, 0, text.length );
         for ( let j = 0; j < m.length; ++j )
            this.setFormat( M, m[j].start, m[j].end, m[j].cssClass );
      }

      // Command parameters

      for ( let startIndex = 0; ; )
      {
         startIndex = this.findUnscaped( text, "[", startIndex );
         if ( startIndex < 0 )
            break;

         let endIndex = this.findUnscaped( text, "]", startIndex+1 );
         if ( endIndex < 0 )
            endIndex = text.length;
         else
            ++endIndex; // include both brackets

         this.setFormat( M, startIndex, endIndex, "pidocParameters" );

         startIndex = endIndex;
      }

      // Verbatim blocks

      for ( let startIndex = 0; ; )
      {
         startIndex = this.findUnscaped( text, "#:", startIndex );
         if ( startIndex < 0 )
            break;

         let endIndex = text.indexOf( ":#", startIndex+2 ); // escaping is not allowed in verbatim blocks
         if ( endIndex < 0 )
            endIndex = text.length;
         else
            endIndex += 2; // include both tokens

         this.setFormat( M, startIndex, endIndex, "pidocVerbatimBlock" );

         startIndex = endIndex;
      }

      // Single-line comments

      for ( let startIndex = 0; ; )
      {
         startIndex = this.findUnscaped( text, "%", startIndex );
         if ( startIndex < 0 )
            break;

         let eolIndex = text.indexOf( '\n', startIndex+1 );
         if ( eolIndex < 0 )
            eolIndex = text.length;
         this.setFormat( M, startIndex, eolIndex, "pidocComment" );

         this.matchBlockRules( M, text, SyntaxHighlighter.alertRules, startIndex+1, eolIndex );

         startIndex = eolIndex+1;
      }

      return this.applyFormat( text, M ).replace( "*amp;", "&amp;", "g"
                                             ).replace( "*lt;", "&lt;", "g"
                                                ).replace( "*gt;", "&gt;", "g" );
   };

   this.isWordSeparator = function( text, index )
   {
      if ( index >= text.length )
         return true;
      let c = text.charCodeAt( index );
      return !(c >= CHa && c <= CHz || c >= CHA && c <= CHZ || c >= CH0 && c <= CH9 || c == USCORE);
   };

   this.findUnscaped = function( text, pattern, pos )
   {
      if ( pos == undefined )
         pos = 0;
      for ( ;; )
      {
         pos = text.indexOf( pattern, pos );
         if ( pos <= 0 || text.charCodeAt( pos-1 ) != BKSLASH )
            return pos;
         pos += pattern.length;
      }
   };
}

PIDocSyntaxHighlighter.prototype = new SyntaxHighlighter;

// ****************************************************************************
// EOF PIDocSyntaxHighlighters.js - Released 2015/01/18 20:22:19 UTC
