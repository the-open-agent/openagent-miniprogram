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

import * as Request from "./request";

export function getChatMessages(owner, chat) {
  return Request.get(`/api/get-messages?owner=${owner}&chat=${encodeURIComponent(chat)}`);
}

export function getMessage(owner, name) {
  return Request.get(`/api/get-message?id=${owner}/${encodeURIComponent(name)}`);
}

export function addMessage(message) {
  return Request.post("/api/add-message", message);
}

export function cancelMessageAnswer(owner, name) {
  return Request.post(`/api/cancel-message-answer?id=${encodeURIComponent(owner)}/${encodeURIComponent(name)}`);
}

export function updateMessage(owner, name, message) {
  return Request.post(`/api/update-message?id=${owner}/${encodeURIComponent(name)}&isHitOnly=false`, message);
}
