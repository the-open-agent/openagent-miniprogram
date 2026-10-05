// Copyright 2026 The OpenAgent Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {marked} from "marked";

// <rich-text> ignores page styles, so every tag gets inline styles.
const TagStyles = {
  p: "margin:0 0 8px 0;line-height:1.7;",
  h1: "font-size:20px;font-weight:600;margin:12px 0 8px 0;",
  h2: "font-size:18px;font-weight:600;margin:12px 0 8px 0;",
  h3: "font-size:16px;font-weight:600;margin:10px 0 6px 0;",
  h4: "font-size:15px;font-weight:600;margin:10px 0 6px 0;",
  h5: "font-size:15px;font-weight:600;margin:8px 0 4px 0;",
  h6: "font-size:15px;font-weight:600;margin:8px 0 4px 0;",
  ul: "padding-left:20px;margin:4px 0 8px 0;",
  ol: "padding-left:20px;margin:4px 0 8px 0;",
  li: "margin:2px 0;line-height:1.7;",
  blockquote: "margin:8px 0;padding:2px 0 2px 10px;border-left:3px solid #dcdfe6;color:#646a73;",
  pre: "margin:8px 0;padding:10px;background:#f6f8fa;border-radius:6px;white-space:pre-wrap;word-break:break-all;font-size:13px;line-height:1.5;",
  code: "font-family:Menlo,Consolas,monospace;font-size:13px;background:#f2f3f5;padding:0 3px;border-radius:3px;",
  table: "border-collapse:collapse;margin:8px 0;font-size:14px;",
  th: "border:1px solid #dcdfe6;padding:4px 8px;background:#f6f8fa;font-weight:600;",
  td: "border:1px solid #dcdfe6;padding:4px 8px;",
  a: "color:#3370ff;word-break:break-all;",
  img: "max-width:100%;",
  hr: "border:none;border-top:1px solid #e5e6eb;margin:12px 0;",
};

const TagRegex = new RegExp(`<(${Object.keys(TagStyles).join("|")})(\\s[^>]*)?>`, "g");

function addInlineStyles(html) {
  return html.replace(TagRegex, (match, tag, attrs = "") => {
    const style = TagStyles[tag];
    if (/\sstyle="/.test(attrs)) {
      return `<${tag}${attrs.replace(/\sstyle="/, ` style="${style}`)}>`;
    }
    return `<${tag} style="${style}"${attrs}>`;
  }).replace(/(<pre [^>]*>)<code style="[^"]*"/g, "$1<code style=\"font-family:Menlo,Consolas,monospace;\"");
}

export function renderMarkdown(text) {
  if (!text) {
    return "";
  }
  try {
    const html = marked.parse(text, {gfm: true, breaks: true, async: false});
    return addInlineStyles(html);
  } catch {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>");
  }
}
