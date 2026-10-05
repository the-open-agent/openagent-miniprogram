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

import {useState} from "react";
import Taro, {useLoad} from "@tarojs/taro";
import {Button, View} from "@tarojs/components";
import * as AccountBackend from "../../api/AccountBackend";
import * as Session from "../../utils/session";
import "./index.scss";

function decode(value) {
  try {
    return decodeURIComponent(value || "");
  } catch {
    return value || "";
  }
}

// The server's /callback page opens this page (wx.miniProgram.redirectTo) with
// the OAuth code from Casdoor.
export default function CallbackPage() {
  const [error, setError] = useState("");

  useLoad((params) => {
    AccountBackend.signin(decode(params.code), decode(params.state))
      .then(res => {
        if (res.status !== "ok") {
          throw new Error(res.msg);
        }
        return Session.loadAccount();
      })
      .then(account => {
        if (!account) {
          throw new Error("登录失败，请重试");
        }
        Taro.reLaunch({url: "/pages/chat/index"});
      })
      .catch(e => setError(e?.message || e?.errMsg || "登录失败，请重试"));
  });

  return (
    <View className="callback-page">
      {error === "" ? (
        <View className="callback-text">正在登录…</View>
      ) : (
        <View className="callback-error">
          <View className="callback-text">{error}</View>
          <Button className="callback-button" onClick={() => Taro.reLaunch({url: "/pages/login/index"})}>重新登录</Button>
        </View>
      )}
    </View>
  );
}
