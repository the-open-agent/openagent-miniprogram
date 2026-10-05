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
import Taro, {useDidShow, usePullDownRefresh} from "@tarojs/taro";
import {Image, View} from "@tarojs/components";
import * as ChatBackend from "../../api/ChatBackend";
import * as Session from "../../utils/session";
import "./index.scss";

export default function ChatsPage() {
  const [chats, setChats] = useState(null);
  const account = Session.getAccount();

  const loadChats = () => {
    if (!account) {
      Session.goToLogin();
      return Promise.resolve();
    }
    return ChatBackend.getChats(account.name).then(res => {
      if (res.status !== "ok") {
        throw new Error(res.msg);
      }
      setChats((res.data || []).filter(chat => !chat.isHidden));
    }).catch(Session.showError);
  };

  useDidShow(() => {
    loadChats();
  });

  usePullDownRefresh(() => {
    loadChats().finally(() => Taro.stopPullDownRefresh());
  });

  const openChat = (chat) => {
    Taro.eventCenter.trigger("openChat", chat.name);
    Taro.navigateBack();
  };

  const deleteChat = (chat) => {
    Taro.showModal({
      title: "删除对话",
      content: `确定删除“${chat.displayName || "新对话"}”吗？`,
      confirmColor: "#f54a45",
    }).then(({confirm}) => {
      if (!confirm) {
        return;
      }
      ChatBackend.deleteChat(chat).then(res => {
        if (res.status !== "ok") {
          throw new Error(res.msg);
        }
        setChats(list => list.filter(c => c.name !== chat.name));
        Taro.eventCenter.trigger("chatDeleted", chat.name);
      }).catch(Session.showError);
    });
  };

  const signout = () => {
    Taro.showModal({title: "退出登录", content: "确定退出当前账号吗？"}).then(({confirm}) => {
      if (confirm) {
        Session.signout().then(() => Session.goToLogin());
      }
    });
  };

  return (
    <View className="chats-page">
      {account ? (
        <View className="account">
          {account.avatar ? <Image className="avatar" src={account.avatar} mode="aspectFill" /> : <View className="avatar avatar-empty" />}
          <View className="account-name">{account.displayName || account.name}</View>
          <View className="signout" onClick={signout}>退出登录</View>
        </View>
      ) : null}

      {chats === null ? (
        <View className="hint">加载中…</View>
      ) : chats.length === 0 ? (
        <View className="hint">还没有对话</View>
      ) : (
        <View className="chat-list">
          {chats.map(chat => (
            <View key={chat.name} className="chat-item" onClick={() => openChat(chat)} onLongPress={() => deleteChat(chat)}>
              <View className="chat-title">{chat.displayName || "新对话"}</View>
              <View className="chat-time">{Session.formatTime(chat.updatedTime || chat.createdTime)}</View>
            </View>
          ))}
          <View className="hint">长按对话可以删除</View>
        </View>
      )}
    </View>
  );
}
