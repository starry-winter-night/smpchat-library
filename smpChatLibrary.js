(function (w) {
  // craete namespace
  const smpChat = {
    setting: {
      chatService: class ChatService {
        constructor(clientId, api, option) {
          this.clientId = clientId;
          this.api = api;
          this.option = option;
        }
        init(id, domName) {
          this.id = id;
          this.domName = domName;
          try {
            const socket = connectManagerURL(this.clientId, this.api, this.id);
            // 소켓 사용
            ChatService.useSocketArea(socket, this.domName);
          } catch (e) {
            SmpChatError.errHandle(e);
          }

          function connectManagerURL(clientId, apiKey, managerId) {
            return io(
              `ws://localhost:7000/${apiKey}?CLIENTID=${clientId}&USERID=${managerId}`
            );
          }
        }
      },
    },
  };
  w.smpChat = smpChat;
})(window);
