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

// Same rules as web/src/carrier in openagent: the answer may carry a chat
// title after "=====" and follow-up suggestions after "|||".
const TitleDivider = "=====";
const SuggestionDivider = "|||";

export function parseAnswer(answer, needTitle) {
  let text = answer || "";
  let title = "";

  if (needTitle) {
    const parts = text.split(TitleDivider);
    if (parts.length >= 2) {
      text = parts[0];
      title = parts[1].trim().split(/[\r\n]/)[0].split(SuggestionDivider)[0].trim();
    }
  }

  const parts = text.split(SuggestionDivider);
  const suggestions = parts.slice(1).map(s => s.trim()).filter(s => s !== "");

  return {
    text: parts[0],
    title: title,
    suggestions: suggestions,
  };
}
