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
import {Button, Input, View} from "@tarojs/components";
import * as AccountBackend from "../../api/AccountBackend";
import * as Session from "../../utils/session";
import {AppName} from "../../config";
import "./index.scss";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const signin = (form) => {
    setLoading(true);
    Taro.login()
      .then(({code}) => AccountBackend.signinWithWechat(code, form))
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
      .catch(Session.showError)
      .finally(() => setLoading(false));
  };

  const onGetPhoneNumber = (e) => {
    if (loading) {
      return;
    }
    const phoneCode = e.detail?.code;
    if (!phoneCode) {
      if (!(e.detail?.errMsg || "").includes("deny")) {
        Session.showError(e.detail?.errMsg || "获取手机号失败");
      }
      return;
    }
    signin({phoneCode: phoneCode});
  };

  const onPasswordSignin = () => {
    if (loading) {
      return;
    }
    if (username.trim() === "" || password === "") {
      Session.showError("请输入账号和密码");
      return;
    }
    signin({username: username.trim(), password: password});
  };

  return (
    <View className="login-page">
      <View className="brand">
        <View className="brand-name">{AppName}</View>
        <View className="brand-text">你的 AI 助手</View>
      </View>

      <Button className="login-button" openType="getPhoneNumber" loading={loading && !showPassword} disabled={loading} onGetPhoneNumber={onGetPhoneNumber}>
        微信手机号登录
      </Button>

      {showPassword ? (
        <View className="password-form">
          <Input className="input" placeholder="账号 / 手机号" value={username} onInput={e => setUsername(e.detail.value)} />
          <Input className="input" placeholder="密码" password value={password} onInput={e => setPassword(e.detail.value)} onConfirm={onPasswordSignin} />
          <Button className="password-button" loading={loading} disabled={loading} onClick={onPasswordSignin}>登录</Button>
        </View>
      ) : (
        <View className="switch" onClick={() => setShowPassword(true)}>账号密码登录</View>
      )}

      <View className="tip">登录后当前微信会和账号绑定，以后点“微信手机号登录”即可直接进入</View>
    </View>
  );
}
