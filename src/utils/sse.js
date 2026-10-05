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

// Parses a text/event-stream body that arrives in arbitrary pieces.
export function createSseParser(onEvent) {
  let buffer = "";

  const dispatch = (block) => {
    let event = "message";
    const data = [];
    block.split("\n").forEach(line => {
      if (line === "" || line.startsWith(":")) {
        return;
      }
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        data.push(line.slice(5).replace(/^ /, ""));
      }
    });
    if (data.length > 0) {
      onEvent(event, data.join("\n"));
    }
  };

  return {
    push(text) {
      buffer += text;
      buffer = buffer.replace(/\r\n/g, "\n");
      let index = buffer.indexOf("\n\n");
      while (index >= 0) {
        dispatch(buffer.slice(0, index));
        buffer = buffer.slice(index + 2);
        index = buffer.indexOf("\n\n");
      }
    },
    flush() {
      if (buffer.trim() !== "") {
        dispatch(buffer);
      }
      buffer = "";
    },
  };
}
