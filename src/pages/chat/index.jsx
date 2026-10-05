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

import {useEffect, useRef, useState} from "react";
import Taro, {useLoad, useUnload} from "@tarojs/taro";
import {ScrollView, Text, Textarea, View} from "@tarojs/components";
import * as ChatBackend from "../../api/ChatBackend";
import * as MessageBackend from "../../api/MessageBackend";
import {streamMessageAnswer} from "../../api/stream";
import {parseAnswer} from "../../utils/carrier";
import * as Session from "../../utils/session";
import {AppName} from "../../config";
import MessageItem from "../../components/MessageItem";
import "./index.scss";

const PollInterval = 2000;
const MaxPollTimes = 300;

function isPendingAnswer(message) {
  return message && message.author === "AI" && message.replyTo !== "" && message.text === "" && !message.errorText;
}

export default function ChatPage() {
  const [account, setAccount] = useState(Session.getAccount());
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [streamReason, setStreamReason] = useState("");
  const [scrollTop, setScrollTop] = useState(0);

  const chatRef = useRef(null);
  const streamRef = useRef(null);
  const pollTimerRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => setScrollTop(value => (value === 1000000 ? 1000001 : 1000000)), 50);
  };

  const setTitle = (title) => {
    Taro.setNavigationBarTitle({title: title || "新对话"});
  };

  const updateChat = (newChat) => {
    chatRef.current = newChat;
    setChat(newChat);
    setTitle(newChat?.displayName);
  };

  const stopStreaming = () => {
    if (streamRef.current) {
      streamRef.current.abort();
      streamRef.current = null;
    }
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const refreshChat = (name) => {
    ChatBackend.getChat("admin", name).then(res => {
      if (res.status === "ok" && res.data && chatRef.current?.name === name) {
        updateChat(res.data);
      }
    }).catch(() => {});
  };

  const replaceLastMessage = (updates) => {
    setMessages(list => {
      if (list.length === 0) {
        return list;
      }
      const next = [...list];
      next[next.length - 1] = {...next[next.length - 1], ...updates};
      return next;
    });
  };

  const pollAnswer = (chatName, aiMessage, times) => {
    const retry = () => {
      if (times >= MaxPollTimes) {
        setGenerating(false);
        return;
      }
      pollTimerRef.current = setTimeout(() => pollAnswer(chatName, aiMessage, times + 1), PollInterval);
    };

    MessageBackend.getMessage(aiMessage.owner, aiMessage.name).then(res => {
      if (chatRef.current?.name !== chatName) {
        return;
      }
      const message = res.status === "ok" ? res.data : null;
      if (message && !isPendingAnswer(message)) {
        replaceLastMessage(message);
        setGenerating(false);
        scrollToBottom();
        refreshChat(chatName);
        return;
      }
      retry();
    }).catch(retry);
  };

  const startAnswer = (chatName, aiMessage) => {
    stopStreaming();
    setGenerating(true);
    setStreamText("");
    setStreamReason("");

    let text = "";
    let reason = "";
    streamRef.current = streamMessageAnswer(aiMessage.owner, aiMessage.name, {
      onMessage: (data) => {
        text += data;
        setStreamText(text);
        scrollToBottom();
      },
      onReason: (data) => {
        reason += data;
        setStreamReason(reason);
      },
      onChat: (update) => {
        if (update?.displayName && chatRef.current?.name === chatName) {
          updateChat({...chatRef.current, displayName: update.displayName, needTitle: update.needTitle ?? false});
        }
      },
      onError: (error) => {
        streamRef.current = null;
        replaceLastMessage({text: text, reasonText: reason, errorText: error});
        setGenerating(false);
      },
      onEnd: () => {
        streamRef.current = null;
        replaceLastMessage({text: text, reasonText: reason});
        setGenerating(false);
        scrollToBottom();
        refreshChat(chatName);
      },
      onClose: () => {
        // The answer keeps being generated on the server, so wait for it to be saved.
        streamRef.current = null;
        pollAnswer(chatName, aiMessage, 0);
      },
    });
  };

  const loadMessages = (chatName, resume) => {
    return MessageBackend.getChatMessages("admin", chatName).then(res => {
      if (chatRef.current?.name !== chatName) {
        return;
      }
      if (res.status !== "ok") {
        Session.showError(res.msg);
        setGenerating(false);
        return;
      }
      const list = (res.data || []).filter(message => !message.isHidden);
      setMessages(list);
      scrollToBottom();

      const last = list[list.length - 1];
      if (resume && isPendingAnswer(last)) {
        startAnswer(chatName, last);
      } else {
        setGenerating(false);
      }
    });
  };

  const openChat = (name) => {
    stopStreaming();
    setGenerating(false);
    setMessages([]);
    updateChat({name: name, displayName: ""});
    refreshChat(name);
    loadMessages(name, true).catch(Session.showError);
  };

  const newChat = () => {
    stopStreaming();
    updateChat(null);
    setMessages([]);
    setGenerating(false);
    setInput("");
  };

  const sendMessage = (value) => {
    const text = (typeof value === "string" ? value : input).trim();
    if (text === "" || generating) {
      return;
    }
    if (!account) {
      Session.goToLogin();
      return;
    }

    const current = chatRef.current;
    const message = {
      owner: "admin",
      name: `message_${Session.getRandomName()}`,
      createdTime: new Date().toISOString(),
      organization: account.owner,
      store: current?.store || "",
      user: account.name,
      chat: current?.name || "",
      replyTo: "",
      author: account.name,
      text: text,
      isHidden: false,
      isDeleted: false,
      isAlerted: false,
      isRegenerated: false,
      fileName: "",
      webSearchEnabled: false,
      modelProvider: current?.modelProvider || "",
    };
    const placeholder = {owner: "admin", name: "", author: "AI", replyTo: message.name, text: "", errorText: ""};

    setInput("");
    setGenerating(true);
    setStreamText("");
    setStreamReason("");
    setMessages(list => [...list, message, placeholder]);
    scrollToBottom();

    MessageBackend.addMessage(message).then(res => {
      if (res.status !== "ok") {
        throw new Error(res.msg);
      }
      updateChat(res.data);
      return loadMessages(res.data.name, true);
    }).catch(error => {
      setGenerating(false);
      setMessages(list => list.filter(m => m !== message && m !== placeholder));
      setInput(text);
      Session.showError(error);
    });
  };

  const stopAnswer = () => {
    const last = messages[messages.length - 1];
    stopStreaming();
    setGenerating(false);
    if (!last || last.author !== "AI" || !last.name) {
      return;
    }
    const stopped = {...last, text: streamText || "（已停止生成）", reasonText: streamReason};
    replaceLastMessage(stopped);
    MessageBackend.cancelMessageAnswer(last.owner, last.name)
      .then(() => MessageBackend.updateMessage(last.owner, last.name, stopped))
      .catch(() => {});
  };

  useLoad((params) => {
    Session.loadAccount().then(user => {
      if (!user) {
        Session.goToLogin();
        return;
      }
      setAccount(user);
      if (params?.chat) {
        openChat(decodeURIComponent(params.chat));
      } else {
        setTitle("");
      }
    }).catch(error => {
      Session.showError(`无法连接服务器：${error?.message || error?.errMsg || ""}`);
    });
  });

  useEffect(() => {
    const onOpenChat = (name) => (name ? openChat(name) : newChat());
    const onChatDeleted = (name) => {
      if (chatRef.current?.name === name) {
        newChat();
      }
    };
    Taro.eventCenter.on("openChat", onOpenChat);
    Taro.eventCenter.on("chatDeleted", onChatDeleted);
    return () => {
      Taro.eventCenter.off("openChat", onOpenChat);
      Taro.eventCenter.off("chatDeleted", onChatDeleted);
    };
  });

  useUnload(() => stopStreaming());

  const lastIndex = messages.length - 1;

  return (
    <View className="chat-page">
      <View className="toolbar">
        <View className="toolbar-button" onClick={() => Taro.navigateTo({url: "/pages/chats/index"})}>历史对话</View>
        <View className="toolbar-button toolbar-button-primary" onClick={newChat}>＋ 新对话</View>
      </View>

      <ScrollView className="message-list" scrollY scrollTop={scrollTop} enhanced showScrollbar={false}>
        {messages.length === 0 ? (
          <View className="empty">
            <View className="empty-title">{AppName}</View>
            <View className="empty-text">有什么可以帮你的？</View>
          </View>
        ) : (
          <View className="messages">
            {messages.map((message, index) => {
              const isStreaming = generating && index === lastIndex && message.author === "AI";
              const rawText = isStreaming ? streamText : message.text;
              const parsed = message.author === "AI" ? parseAnswer(rawText, chat?.needTitle) : null;
              return (
                <MessageItem
                  key={message.name || `pending-${index}`}
                  message={message}
                  text={parsed ? parsed.text : message.text}
                  reasonText={isStreaming ? streamReason : message.reasonText}
                  suggestions={index === lastIndex && parsed ? parsed.suggestions : []}
                  isStreaming={isStreaming}
                  onSuggestion={sendMessage}
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      <View className="composer">
        <Textarea
          className="composer-input"
          value={input}
          placeholder="输入你的问题"
          autoHeight
          maxlength={-1}
          showConfirmBar={false}
          confirmType="send"
          cursorSpacing={20}
          disableDefaultPadding
          onInput={e => setInput(e.detail.value)}
          onConfirm={() => sendMessage()}
        />
        {generating ? (
          <View className="composer-button composer-button-stop" onClick={stopAnswer}>
            <Text>停止</Text>
          </View>
        ) : (
          <View className={`composer-button ${input.trim() ? "" : "composer-button-disabled"}`} onClick={() => sendMessage()}>
            <Text>发送</Text>
          </View>
        )}
      </View>
    </View>
  );
}
