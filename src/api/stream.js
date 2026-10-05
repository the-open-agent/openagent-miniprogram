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

// Platforms without chunked responses: report the stream as closed right
// away, and the chat page polls the message until the answer is saved.
export function streamMessageAnswer(owner, name, handlers) {
  const timer = setTimeout(() => handlers.onClose?.(), 0);
  return {
    abort() {
      clearTimeout(timer);
    },
  };
}
