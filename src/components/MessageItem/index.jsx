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
import {RichText, Text, View} from "@tarojs/components";
import {renderMarkdown} from "../../utils/markdown";
import "./index.scss";

function copyText(text) {
  if (!text) {
    return;
  }
  Taro.setClipboardData({data: text});
}

export default function MessageItem({message, text, reasonText, suggestions, isStreaming, onSuggestion}) {
  const [reasonOpen, setReasonOpen] = useState(false);
  const isAI = message.author === "AI";

  if (!isAI) {
    return (
      <View className="message message-user">
        <View className="bubble bubble-user" onLongPress={() => copyText(message.text)}>
          <Text userSelect decode={false}>{message.text}</Text>
        </View>
      </View>
    );
  }

  const isWaiting = isStreaming && !text && !reasonText;

  return (
    <View className="message message-ai">
      <View className="bubble bubble-ai" onLongPress={() => copyText(text)}>
        {reasonText ? (
          <View className="reason">
            <View className="reason-toggle" onClick={() => setReasonOpen(!reasonOpen)}>
              {isStreaming && !text ? "思考中…" : "思考过程"} {reasonOpen ? "▲" : "▼"}
            </View>
            {reasonOpen || (isStreaming && !text) ? <Text className="reason-text">{reasonText}</Text> : null}
          </View>
        ) : null}
        {isWaiting ? <View className="typing">正在生成…</View> : null}
        {text ? <RichText userSelect nodes={renderMarkdown(text)} /> : null}
        {message.errorText ? <View className="error-text">{message.errorText}</View> : null}
      </View>
      {suggestions && suggestions.length > 0 && !isStreaming ? (
        <View className="suggestions">
          {suggestions.map(suggestion => (
            <View key={suggestion} className="suggestion" onClick={() => onSuggestion?.(suggestion)}>
              {suggestion}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
