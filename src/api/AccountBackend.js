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

export function getAccount() {
  return Request.get("/api/get-account");
}

// form: {phoneCode} from a getPhoneNumber button, or {username, password} to
// bind an existing account. Once bound, the WeChat user signs in directly.
export function signinWithWechat(code, form = {}) {
  return Request.post(`/api/signin?code=${encodeURIComponent(code)}&state=&tag=wechat_miniprogram`, form);
}

export function signout() {
  return Request.post("/api/signout").finally(() => Request.clearCookies());
}
