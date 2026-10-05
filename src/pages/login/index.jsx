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
import Taro from "@tarojs/taro";
import {Button, View} from "@tarojs/components";
import * as AccountBackend from "../../api/AccountBackend";
import * as Session from "../../utils/session";
import {AppName} from "../../config";
import "./index.scss";

// Sign-in happens on Casdoor's own page (password, SMS code, WeChat, ...) in a web-view.
export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const openSigninPage = (url) => {
    Taro.navigateTo({url: `/pages/webview/index?url=${encodeURIComponent(url)}`});
  };

  const signin = () => {
    const url = AccountBackend.getSigninUrl();
    if (url !== "") {
      openSigninPage(url);
      return;
    }

    // The sign-in URL comes from the server's web config, which arrives with get-account.
    setLoading(true);
    AccountBackend.getAccount()
      .then(() => {
        const newUrl = AccountBackend.getSigninUrl();
        if (newUrl === "") {
          throw new Error("服务器没有配置登录服务");
        }
        openSigninPage(newUrl);
      })
      .catch(Session.showError)
      .finally(() => setLoading(false));
  };

  return (
    <View className="login-page">
      <View className="brand">
        <View className="brand-name">{AppName}</View>
        <View className="brand-text">你的 AI 助手</View>
      </View>
      <Button className="login-button" loading={loading} disabled={loading} onClick={signin}>
        登录
      </Button>
    </View>
  );
}
