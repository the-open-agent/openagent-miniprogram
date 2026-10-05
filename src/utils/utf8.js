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

// The mini program runtime has no TextDecoder, and a chunk from
// onChunkReceived can end in the middle of a multi-byte character.
export function createUtf8Decoder() {
  let pending = new Uint8Array(0);

  return {
    decode(buffer) {
      const input = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
      let bytes = input;
      if (pending.length > 0) {
        bytes = new Uint8Array(pending.length + input.length);
        bytes.set(pending, 0);
        bytes.set(input, pending.length);
      }

      const chars = [];
      let i = 0;
      while (i < bytes.length) {
        const b = bytes[i];
        let size = 1;
        let codePoint = b;
        if (b >= 0xf0 && b <= 0xf7) {
          size = 4;
          codePoint = b & 0x07;
        } else if (b >= 0xe0) {
          size = 3;
          codePoint = b & 0x0f;
        } else if (b >= 0xc0) {
          size = 2;
          codePoint = b & 0x1f;
        } else if (b >= 0x80) {
          chars.push("�");
          i += 1;
          continue;
        }

        if (i + size > bytes.length) {
          break;
        }
        for (let j = 1; j < size; j++) {
          codePoint = (codePoint << 6) | (bytes[i + j] & 0x3f);
        }
        chars.push(String.fromCodePoint(codePoint));
        i += size;
      }

      pending = bytes.slice(i);
      return chars.join("");
    },
  };
}
