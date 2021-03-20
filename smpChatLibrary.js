(function (w) {
  // craete namespace
  const smpChat = {
    setting: {
      chatService: class ChatService {
        constructor(clientId, apiKey) {
          this.clientId = clientId;
          this.apiKey = apiKey;
        }

        async init(userId, domId) {
          this.args = {
            clientId: this.clientId,
            apiKey: this.apiKey,
            userId,
            domId,
          };

          try {
            if (!argCheck(this.args)) return;

            const res = await fetch(serverURL(this.args));

            if (!res.ok) SmpChatError.errHandle(res.statusText);

            const data = await res.json();

            resetHTML(this.args);

            data.type === "manager"
              ? managerArea(this.args)
              : clientArea(this.args);

            const socket = await socketURL(this.args);

            switchState(data);

            connServer(socket, data);

            socketReceive(socket);
          } catch (e) {
            SmpChatError.errHandle(e);
          }
        }
      },
    },
  };

  const socketReceive = function receiveSocketContact(socket) {
    socket.on("connect", () => {
      console.log("server connect!!");
    });

    socket.on("initChat", (data) => {
      //processMessageSend(socket);
    });

    socket.on("preview", (previewData) => {
      console.log(previewData);
    });
  };

  const argCheck = function checkMainArguments({
    clientId,
    apiKey,
    userId,
    domId,
  }) {
    if (!clientId || clientId == "" || typeof clientId !== "string") {
      SmpChatError.errHandle("clientId가 유효하지 않습니다.");
      return false;
    }

    if (!apiKey || apiKey == "" || typeof apiKey !== "string") {
      SmpChatError.errHandle("apiKey가 유효하지 않습니다.");
      return false;
    }

    if (userId == "") {
      SmpChatError.errHandle("id를 입력해주세요.");
      return false;
    }

    if (!domId || domId == "") {
      SmpChatError.errHandle("올바른 documentId를 입력해주세요.");
      return false;
    }

    return true;
  };

  const serverURL = function connectServerURL({ clientId, userId }) {
    return `http://localhost:5000/smpChat?clientId=${clientId}&userId=${userId}`;
  };

  const socketURL = function connectSocketURL({ clientId, apiKey }) {
    return io(`ws://localhost:7000/${apiKey}?clientId=${clientId}`, {
      autoConnect: false,
    });
  };

  const managerArea = function ctrlManagerChat({ domId }) {
    managerHTML(domId);
    chatIcon();
    dialogHeight();
    textLine();
  };

  const clientArea = function ctrlClientChat({ domId }) {
    clientHTML();
  };

  const socketSend = function sendSocketArea(socket) {
    return {
      serverSwitch: (order) => {
        console.log(order);
        socket.emit("switch", { order });
      },
      message: (msg) => {
        socket.emit("message", { msg });
      },
    };
  };

  const socketError = function errorSocketArea() {
    socket.on("connect_error", (err) => console.log(err));
    socket.on("connect_failed", (err) => console.log(err));
    socket.on("disconnect", (err) => console.log(err));
    socket.on("error", (err) => console.log(err.content));
  };

  const resetHTML = function resetHTML({ domId }) {
    const chatBox = document.getElementById(domId);
    const section = document.querySelector(".smpChat__section");
    const icon = document.querySelector(".smpChatIcon");
    if (chatBox && section && icon) {
      chatBox.removeChild(section);
      chatBox.removeChild(icon);
    }
  };

  const managerHTML = function drawManagerHTML(domId) {
    const smpChatLayout = document.getElementById(domId);
    /*****************************  layout *****************************/
    /* common */
    const section = document.createElement("section");
    const inconsolataFont = document.createElement("link");
    const josefinSansFont = document.createElement("link");
    const nanumGothicFont = document.createElement("link");
    const navbar = document.createElement("div");
    const contents = document.createElement("div");
    const logo = document.createElement("h3");
    const closeImg = document.createElement("img");
    const connect = document.createElement("div");
    const dialog = document.createElement("div");
    const smpChatIconImg = document.createElement("img");

    /* connect */
    const connNav = document.createElement("div");
    const connNavInfo = document.createElement("h3");
    const connSwitch = document.createElement("div");
    const connSwitchLabel = document.createElement("label");
    const connSwitchBall = document.createElement("span");
    const connSwitchSpan = document.createElement("span");
    const connSwitchInput = document.createElement("input");
    const connSwitchOffP = document.createElement("p");
    const connSwitchOnP = document.createElement("p");
    const connList = document.createElement("div");

    /* dialog */
    const dialogNav = document.createElement("div");
    const dialogChatView = document.createElement("div");
    const dialogChatFooter = document.createElement("div");
    const dialogChatAddImg = document.createElement("img");
    const dialogChatAddInput = document.createElement("input");
    const dialogChatAddLabel = document.createElement("label");
    const dialogChatMsgTextArea = document.createElement("textarea");
    const dialogChatMsgSend = document.createElement("img");

    /*****************************  node  *****************************/
    /* common */
    const logoText = document.createTextNode("smpchat");

    /* connect */
    const infoText = document.createTextNode("Connect to Chat Server:");
    const connSwitchOff = document.createTextNode("OFF");
    const connSwitchOn = document.createTextNode("ON");

    /*****************************  appned  *****************************/
    /* common */
    section.appendChild(inconsolataFont);
    section.appendChild(josefinSansFont);
    section.appendChild(nanumGothicFont);
    section.appendChild(navbar);
    section.appendChild(contents);
    logo.appendChild(logoText);
    navbar.appendChild(logo);
    navbar.appendChild(closeImg);

    /* connect */
    connNavInfo.appendChild(infoText);
    connSwitchOffP.appendChild(connSwitchOff);
    connSwitchOnP.appendChild(connSwitchOn);
    connSwitchSpan.appendChild(connSwitchOffP);
    connSwitchSpan.appendChild(connSwitchOnP);
    connSwitchLabel.appendChild(connSwitchBall);
    connSwitchLabel.appendChild(connSwitchSpan);
    connSwitch.appendChild(connSwitchInput);
    connSwitch.appendChild(connSwitchLabel);
    connNav.appendChild(connNavInfo);
    connNav.appendChild(connSwitch);
    connect.appendChild(connNav);
    connect.appendChild(connList);
    contents.appendChild(connect);

    /* dialog */
    dialog.appendChild(dialogNav);
    dialog.appendChild(dialogChatView);
    dialog.appendChild(dialogChatFooter);
    dialogChatFooter.appendChild(dialogChatAddImg);
    dialogChatFooter.appendChild(dialogChatAddLabel);
    dialogChatFooter.appendChild(dialogChatAddInput);
    dialogChatFooter.appendChild(dialogChatMsgTextArea);
    dialogChatFooter.appendChild(dialogChatMsgSend);
    contents.appendChild(dialog);

    /* smpchat */

    smpChatLayout.appendChild(smpChatIconImg);
    smpChatLayout.appendChild(section);

    /*****************************  className & id  *****************************/
    /* common */
    section.id = "smpChat_managerSection";
    section.className = "smpChat__section";
    contents.className = "smpChat__section__contents";
    navbar.className = "smpChat__section__navbar";
    connect.className = "smpChat__section__connect";
    dialog.className = "smpChat__section__dialog";
    logo.className = "smpChat__section__logo smpChat__userSelect__none";
    closeImg.className = "smpChat__section__close smpChat__userSelect__none";
    smpChatIconImg.className = "smpChatIcon smpChat__userSelect__none";

    /* connect */
    connNav.className = "smpChat__connect__navbar";
    connNavInfo.className =
      "smpChat__connect__navInfo smpChat__userSelect__none";
    connList.className = "smpChat__connect__list";
    connSwitch.className = "smpChat__connect__switch";
    connSwitchBall.className = "smpChat__connect__switchBall";
    connSwitchSpan.className = "smpChat__connect__switchSpan";
    connSwitchLabel.className = "smpChat__connect__switchLabel";
    connSwitchInput.id = "smp_chat_switch";
    connSwitchInput.className = "smpChat__connect__switchInput";
    connSwitchOffP.className =
      "smpChat__connect__switchOff smpChat__userSelect__none";
    connSwitchOnP.className =
      "smpChat__connect__switchOn smpChat__userSelect__none";

    /* dialog */
    dialogNav.className = "smpChat__dialog__navbar";
    dialogChatView.className = "smpChat__dialog__chatView";
    dialogChatFooter.className = "smpChat__dialog__footer";
    dialogChatAddImg.className =
      "smpChat__dialog__addImg smpChat__userSelect__none";
    dialogChatAddInput.id = "smp_chat_addImg";
    dialogChatAddInput.className = "smpChat__dialog__addInput";
    dialogChatAddLabel.className = "smpChat__dialog__addLabel";
    dialogChatMsgTextArea.className = "smpChat__dialog__msgTextArea";
    dialogChatMsgSend.className =
      "smpChat__dialog__sendImg smpChat__userSelect__none";

    /***************************** set *****************************/
    /* common */
    inconsolataFont.setAttribute("rel", "stylesheet");
    inconsolataFont.setAttribute(
      "href",
      "https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;600;700&display=swap"
    );
    josefinSansFont.setAttribute("rel", "stylesheet");
    josefinSansFont.setAttribute(
      "href",
      "https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@100;300;400;600;700&display=swap"
    );
    nanumGothicFont.setAttribute("rel", "stylesheet");
    nanumGothicFont.setAttribute(
      "href",
      "https://fonts.googleapis.com/css2?family=Nanum+Gothic+Coding&display=swap"
    );

    smpChatIconImg.setAttribute(
      "src",
      "http://localhost:5000/smpChat/image?name=chat.png"
    );
    smpChatIconImg.setAttribute("alt", "채팅아이콘");
    closeImg.setAttribute(
      "src",
      "http://localhost:5000/smpChat/image?name=close.png"
    );
    closeImg.setAttribute("alt", "채팅창닫기 아이콘");

    /* connect */
    connSwitchLabel.htmlFor = "smp_chat_switch";
    connSwitchInput.type = "checkbox";
    connSwitchInput.name = "smp_chat_switch";

    /* dialog */
    dialogChatAddImg.setAttribute(
      "src",
      "http://localhost:5000/smpChat/image?name=plus.png"
    );
    dialogChatMsgSend.setAttribute(
      "src",
      "http://localhost:5000/smpChat/image?name=sendBtn.png"
    );
    dialogChatAddLabel.htmlFor = "smp_chat_addImg";
    dialogChatAddInput.type = "file";
    dialogChatAddInput.accept = "image/gif, image/jpeg, image/png";
    dialogChatAddInput.name = "smp_chat_addImg";
  };

  const chatIcon = function toggleChatView() {
    const icon = document.querySelector(".smpChatIcon");
    const section = document.querySelector(".smpChat__section");
    const close = document.querySelector(".smpChat__section__close");
    icon.addEventListener("click", () => {
      icon.classList.toggle("smp_active");
      section.classList.toggle("smp_active");
    });
    close.addEventListener("click", () => {
      icon.classList.toggle("smp_active");
      section.classList.toggle("smp_active");
    });
  };

  const dialogHeight = function changeDialogAreaHeight() {
    const msgInput = document.querySelector(".smpChat__dialog__msgTextArea");
    const footer = document.querySelector(".smpChat__dialog__footer");
    const chatView = document.querySelector(".smpChat__dialog__chatView");

    msgInput.addEventListener("input", applyDialogHeight, false);

    function applyDialogHeight(e) {
      //const currentHeight = msgInput.scrollHeight;
      const inputHeight = msgInput.offsetHeight;
      const footerHeight = footer.offsetHeight;
      const chatViewHeight = chatView.offsetHeight;

      // textarea의 높이 값을 부여하여 자동으로 높이값을 조절하게 한다.
      msgInput.style.height = "0px";
      msgInput.style.height = `${msgInput.scrollHeight}px`;
      if (msgInput.scrollHeight > inputHeight) {
        chatView.style.height = `${
          chatViewHeight - (msgInput.scrollHeight - inputHeight)
        }px`;
        footer.style.height = `${
          footerHeight + (msgInput.scrollHeight - inputHeight)
        }px`;
      }
      if (msgInput.scrollHeight < inputHeight) {
        chatView.style.height = `${
          chatViewHeight + (inputHeight - msgInput.scrollHeight)
        }px`;
        footer.style.height = `${
          footerHeight - (inputHeight - msgInput.scrollHeight)
        }px`;
      }

      /******** 중요한 부분이라 크게 남긴다. 미래의 나 보아라. ********/
      /*                                                               */
      /*     text가 늘어나서 줄바꿈이 되면                             */
      /*     currentHeight 와 msgInput.scrollHeight은                  */
      /*     동시에 값이 바뀌지만 inputHeight는 줄이 바뀌고            */
      /*     한번 더 put이 되어야 바뀐다.                              */
      /*                                                               */
      /*                                                               */
      /*     text가 줄어들어서 줄바꿈이 되면                           */
      /*     msgInput.scrollHeight 값이 먼저 바뀌고                    */
      /*     currentHeight와 inputHeight는 줄이 바뀌고                 */
      /*     한번 더 put이 되어야 바뀐다.                              */
      /*                                                               */
      /*****************************************************************/
      // console.log("currentHeight:", currentHeight);
      // console.log("inputHeight:", inputHeight);
      // console.log("e.target.offsetHeigh:", e.target.offsetHeight);
      // console.log("msgInput.scrollHeight:",  msgInput.scrollHeight);
      textHeight(msgInput);
    }
  };

  const textLine = function lineBreakTextArea() {
    const msgInput = document.querySelector(".smpChat__dialog__msgTextArea");
    msgInput.addEventListener("keydown", applyLineBreakHeight, false);
    function applyLineBreakHeight(e) {
      if (e.ctrlKey && e.key === "Enter") {
        const footer = document.querySelector(".smpChat__dialog__footer");
        const chatView = document.querySelector(".smpChat__dialog__chatView");

        const msgInputHeight = e.target.offsetHeight;
        const footerHeight = footer.offsetHeight;
        const chatViewHeight = chatView.offsetHeight;

        msgInput.style.height = `${msgInputHeight + 30}px`;
        footer.style.height = `${footerHeight + 30}px`;
        chatView.style.height = `${chatViewHeight - 30}px`;

        e.target.value = `${e.target.value}\r\n`;
        textHeight(msgInput);
        textFocus(msgInput);
      }
    }
  };

  const textHeight = function limitTextAreaHeight(input) {
    if (input.offsetHeight >= 180) {
      input.style.overflowY = "scroll";
    } else {
      input.style.overflowY = "hidden";
    }
  };

  const textFocus = function focusTextAreaCursor(input) {
    input.blur();
    input.focus();
  };

  const connServer = function ctrlServerConnect(socket, { state }) {
    const checkbox = document.querySelector(".smpChat__connect__switchInput");
    checkbox.addEventListener("click", async () => {
      if (!checkbox.checked) {
        socketSend(socket).serverSwitch(false);
        socket.close();
        return;
      }
      socketSend(socket).serverSwitch(true);
      socket.open();
    });
    if (state === "on") {
      socket.open();
    }
  };

  const switchState = function changeSwitchState({ state }) {
    const checkbox = document.querySelector(".smpChat__connect__switchInput");
    if (state === "on") {
      checkbox.checked = true;
    }

    if (state === "off") {
      checkbox.checked = false;
    }
  };

  class SmpChatError extends Error {
    constructor(message) {
      super(message);
      this.message = message;
      this.name = "SmpChatError";
    }

    static errHandle(e) {
      return console.log(e);
      //return console.log(`${e.name} : ${e.message}`);
    }
  }

  w.smpChat = smpChat;
})(window);
