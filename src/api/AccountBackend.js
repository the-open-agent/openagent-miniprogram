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

export function signin(code, state) {
  return Request.post(`/api/signin?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || "")}`);
}

// Casdoor's sign-in page; after sign-in it redirects to the server's /callback,
// which hands the code back to pages/callback in the mini program.
export function getSigninUrl() {
  const authConfig = Request.getWebConfig()?.authConfig;
  if (!authConfig?.issuer || !authConfig?.clientId) {
    return "";
  }
  const redirectUri = Request.getUrl("/callback");
  return `${authConfig.issuer}/login/oauth/authorize?client_id=${authConfig.clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read&state=${encodeURIComponent(authConfig.appName || "")}`;
}

export function signout() {
  return Request.post("/api/signout").finally(() => Request.clearCookies());
}
