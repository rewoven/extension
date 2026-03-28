import type { Message } from './types';

export function sendMessage(message: Message): Promise<Message> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response);
    });
  });
}

export function onMessage(
  handler: (message: Message, sender: chrome.runtime.MessageSender) => Promise<Message | void> | Message | void
) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const result = handler(message, sender);
    if (result instanceof Promise) {
      result.then(sendResponse);
      return true; // keep the message channel open for async response
    }
    if (result) {
      sendResponse(result);
    }
    return false;
  });
}
