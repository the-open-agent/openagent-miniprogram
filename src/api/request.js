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
import {ServerUrl} from "../config";

// wx.request has no cookie jar, so the session cookie returned by the server
// is kept in storage and sent back by hand.
const CookieStorageKey = "openagentCookies";
const WebConfigStorageKey = "openagentWebConfig";
let cookieJar = null;

function getCookieJar() {
  if (cookieJar === null) {
    try {
      cookieJar = Taro.getStorageSync(CookieStorageKey) || {};
    } catch {
      cookieJar = {};
    }
  }
  return cookieJar;
}

export function getCookieHeader() {
  return Object.entries(getCookieJar()).map(([name, value]) => `${name}=${value}`).join("; ");
}

function splitSetCookie(setCookie) {
  if (Array.isArray(setCookie)) {
    return setCookie;
  }
  if (typeof setCookie === "string" && setCookie !== "") {
    return setCookie.split(/,(?=\s*[^;,=\s]+=)/);
  }
  return [];
}

function getHeader(header, name) {
  if (!header) {
    return undefined;
  }
  const key = Object.keys(header).find(k => k.toLowerCase() === name.toLowerCase());
  return key ? header[key] : undefined;
}

export function saveCookies(res) {
  // jsonWebConfig holds raw JSON with commas, which the runtime may split into
  // several "cookies", so it is read from the raw header first.
  const setCookie = getHeader(res.header, "Set-Cookie");
  const webConfigMatch = typeof setCookie === "string" ? setCookie.match(/jsonWebConfig=(\{.*?\}); Path=/) : null;
  if (webConfigMatch) {
    saveWebConfig(webConfigMatch[1]);
  }

  const list = res.cookies?.length ? res.cookies : splitSetCookie(setCookie);
  if (list.length === 0) {
    return;
  }

  const jar = getCookieJar();
  list.forEach(item => {
    if (typeof item !== "string") {
      return;
    }
    const pair = item.split(";")[0];
    const index = pair.indexOf("=");
    if (index <= 0 || !/^[\w.-]+$/.test(pair.slice(0, index).trim())) {
      return;
    }
    const name = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (name === "jsonWebConfig") {
      if (!webConfigMatch) {
        saveWebConfig(value);
      }
      return;
    }
    if (value === "" || /max-age=(0|-\d+)/i.test(item) || /expires=thu, 01 jan 1970/i.test(item)) {
      delete jar[name];
    } else {
      jar[name] = value;
    }
  });
  Taro.setStorageSync(CookieStorageKey, jar);
}

// The server sends its web config (Casdoor issuer, clientId, app name, ...) in
// the jsonWebConfig cookie; it is kept apart from the cookies sent back.
function saveWebConfig(value) {
  let config = null;
  try {
    config = JSON.parse(value);
  } catch {
    try {
      config = JSON.parse(decodeURIComponent(value.replace(/\+/g, " ")));
    } catch {
      return;
    }
  }
  Taro.setStorageSync(WebConfigStorageKey, config);
}

export function getWebConfig() {
  try {
    return Taro.getStorageSync(WebConfigStorageKey) || null;
  } catch {
    return null;
  }
}

export function clearCookies() {
  cookieJar = {};
  Taro.removeStorageSync(CookieStorageKey);
}

export function getAcceptLanguage() {
  let language = "zh";
  try {
    language = (Taro.getAppBaseInfo ? Taro.getAppBaseInfo() : Taro.getSystemInfoSync()).language || language;
  } catch {
    // keep the default
  }
  return language.toLowerCase().startsWith("zh") ? "zh" : "en";
}

export function getHeaders() {
  return {
    "Content-Type": "application/json",
    "Accept-Language": getAcceptLanguage(),
    "Cookie": getCookieHeader(),
  };
}

export function getUrl(path) {
  return `${ServerUrl}${path}`;
}

export function request(method, path, data) {
  return Taro.request({
    url: getUrl(path),
    method: method,
    data: data,
    header: getHeaders(),
  }).then(res => {
    saveCookies(res);
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw new Error(`HTTP ${res.statusCode}`);
    }
    if (typeof res.data !== "object" || res.data === null) {
      throw new Error("Invalid response from server");
    }
    return res.data;
  });
}

export function get(path) {
  return request("GET", path);
}

export function post(path, data) {
  return request("POST", path, data);
}
