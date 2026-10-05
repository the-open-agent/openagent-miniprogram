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

import Taro from "@tarojs/taro";
import * as AccountBackend from "../api/AccountBackend";

let account = null;

export function getAccount() {
  return account;
}

// Resolves to the signed-in account, or null when the session is missing or expired.
export function loadAccount() {
  return AccountBackend.getAccount().then(res => {
    account = res.status === "ok" && res.data ? res.data : null;
    return account;
  });
}

export function signout() {
  account = null;
  return AccountBackend.signout().catch(() => {});
}

export function goToLogin() {
  Taro.reLaunch({url: "/pages/login/index"});
}

export function showError(error) {
  const text = typeof error === "string" ? error : (error?.message || error?.errMsg || "出错了");
  Taro.showToast({title: text, icon: "none", duration: 3000});
}

export function getRandomName() {
  return Math.random().toString(36).slice(-6);
}

export function formatTime(time) {
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const pad = n => String(n).padStart(2, "0");
  const now = new Date();
  const hm = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (date.toDateString() === now.toDateString()) {
    return hm;
  }
  const md = `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  if (date.getFullYear() === now.getFullYear()) {
    return `${md} ${hm}`;
  }
  return `${date.getFullYear()}-${md}`;
}
