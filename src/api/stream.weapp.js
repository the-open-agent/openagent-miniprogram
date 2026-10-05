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

/* global wx */
import {createUtf8Decoder} from "../utils/utf8";
import {createSseParser} from "../utils/sse";
import {getHeaders, getUrl} from "./request";

function parseText(data) {
  try {
    const text = JSON.parse(data).text;
    return text === "" ? "\n" : text;
  } catch {
    return "";
  }
}

// Streams /api/get-message-answer with wx.request's chunked transfer, since
// EventSource is not available in mini programs.
// handlers: onMessage, onReason, onChat, onError, onEnd, onClose (the stream
// ended without an "end" event, e.g. a network drop; the answer keeps being
// generated on the server).
export function streamMessageAnswer(owner, name, handlers) {
  const decoder = createUtf8Decoder();
  let finished = false;
  let receivedChunk = false;
  let task = null;

  const finish = (callback, arg) => {
    if (finished) {
      return;
    }
    finished = true;
    if (callback) {
      callback(arg);
    }
  };

  const parser = createSseParser((event, data) => {
    if (finished) {
      return;
    }
    switch (event) {
    case "message":
      handlers.onMessage?.(parseText(data));
      break;
    case "reason":
      handlers.onReason?.(parseText(data));
      break;
    case "chat":
      try {
        handlers.onChat?.(JSON.parse(data));
      } catch {
        // ignore malformed chat events
      }
      break;
    case "myerror":
    case "error":
      finish(handlers.onError, data || "Unknown error");
      task?.abort();
      break;
    case "end":
      finish(handlers.onEnd, data);
      break;
    default:
      break;
    }
  });

  task = wx.request({
    url: getUrl(`/api/get-message-answer?id=${owner}/${encodeURIComponent(name)}`),
    method: "GET",
    header: {...getHeaders(), "Accept": "text/event-stream"},
    enableChunked: true,
    responseType: "arraybuffer",
    timeout: 600000,
    success(res) {
      if (!receivedChunk && res.data && res.data.byteLength > 0) {
        parser.push(decoder.decode(res.data));
      }
      parser.flush();
      finish(handlers.onClose);
    },
    fail(err) {
      finish(handlers.onClose, err?.errMsg);
    },
  });

  task.onChunkReceived(res => {
    receivedChunk = true;
    parser.push(decoder.decode(res.data));
  });

  return {
    abort() {
      finished = true;
      task.abort();
    },
  };
}
