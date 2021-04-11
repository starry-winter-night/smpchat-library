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

            resetHTML().sectionIcon(this.args);

            data.type === "manager"
              ? managerArea(this.args, data.state)
              : clientArea(this.args, data.state);

            /*
              서버에서 인증여부 가져와서 false면 
              입력창 하나 만들고 
              거기에 직접 api키를 넣게 만들어서
              서버에 던지고 맞으면 인증ok 
              레퍼러 검사해서 같은 레퍼러면 계속 통과
              다른 레퍼러에서 넘어오면 다시 인증
            */
            const socket = await socketURL(this.args);

            changeTheme();

            changeSwitch(data.state);

            refleshConn(socket, data.state);

            clickConn(socket);

            messageSend(socket);

            dialogScroll(socket);

            sendImage(socket);

            socketReceive(socket).error();

            socketReceive(socket).connect();

            socketReceive(socket).switch();

            socketReceive(socket).start(userId, data.type);

            socketReceive(socket).preview(userId);

            socketReceive(socket).dialog(userId);

            socketReceive(socket).prevDialog(userId);

            socketReceive(socket).message(userId);

            socketReceive(socket).observe();

            socketReceive(socket).alarm(userId);
          } catch (e) {
            SmpChatError.errHandle(e);
          }
        }
      },
    },
  };

  const socketReceive = function receiveSocketContact(socket) {
    return {
      connect: () => {
        socket.on("connect", () => {
          console.log("server connect!!");
        });
      },
      switch: () => {
        socket.on("switch", (state) => {
          if (state === "off") {
            connServer(socket).off();
          }

          contentsHTML().systemAlarm(state);
        });
      },
      start: (userId, type) => {
        socket.on("start", (info) => {
          const { dialog, previewLog, alarmCount } = info;

          resetHTML().dialog();

          if (dialog.length !== 0) {
            let count = 0;

            dialog.forEach((logs) => {
              contentsHTML().dialog(logs, userId);

              if (!logs.observe && logs.userId !== userId) {
                count = count + 1;

                observeChatView(socket, dialog[0].roomName);
              }
            });

            drawAlarm.icon(count);
          }

          if (previewLog) {
            resetHTML().preview();

            previewLog.forEach((logs) => {
              contentsHTML().preview(logs);

              const drawPreviewCount = onceDraw.preview(logs.roomName);

              if (drawPreviewCount === 1) clickPreview(socket, logs.roomName);

              drawAlarm.refleshPreview(alarmCount.previewCount, logs.roomName);

              drawAlarm.icon(alarmCount.iconCount);
            });

            if (dialog.length !== 0 && type === "manager") {
              effectSelect(dialog[0].roomName);
            }
          }

          drawAlarm.clickCloseReDraw();
        });
      },
      preview: (userId) => {
        socket.on("preview", (info) => {
          contentsHTML().preview(info);

          const result = checkSelectEffect(info.roomName);

          if (!result.select && !result.effect) alarmPreview(info.roomName);

          const drawPreviewCount = onceDraw.preview(info.roomName);

          if (drawPreviewCount === 1) clickPreview(socket, info.roomName);

          drawAlarm.messagePreview(info.alarm, info.roomName);

          countIconAlarm(info, userId);

          if (onceDraw.alarm(info.roomName) === 1) {
            drawAlarm.clickIconHide();
            drawAlarm.clickCloseReDraw();
          }
        });
      },
      dialog: (userId) => {
        socket.on("dialog", (dialog) => {
          resetHTML().dialog(dialog[0].roomName);

          dialog.forEach((logs) => contentsHTML().dialog(logs, userId));

          scrollBottom(document.querySelector(".smpChat__dialog__chatView"));

          effectSelect(dialog[0].roomName);
        });
      },
      prevDialog: (userId) => {
        socket.on("prevDialog", (dialog) => {
          const chatView = document.querySelector(".smpChat__dialog__chatView");
          const prevHeight = chatView.scrollHeight;

          dialog.reverse().forEach((logs) => {
            contentsHTML().prevDialog(logs, userId);
          });

          const afterHeight = chatView.scrollHeight;
          const increaseHeight = afterHeight - prevHeight;

          scrollIncrease(chatView, increaseHeight);
        });
      },
      message: (userId) => {
        socket.on("message", (message) => {
          contentsHTML().dialog(message, userId);

          scrollBottom(document.querySelector(".smpChat__dialog__chatView"));

          if (message.userId !== userId) {
            drawAlarm.icon(message.alarm);

            drawAlarm.clickCloseReDraw();

            observeChatView(socket, message.roomName);
          }
        });
      },
      observe: () => {
        socket.on("observe", (observe) => {
          if (observe) {
            changeReadIcon();
          }
        });
      },
      alarm: () => {
        socket.on("alarm", (msgCounts) => {
          let count = 0;
          console.log(msgCounts);
          for (userId in msgCounts) count = count + msgCounts[userId];

          document.querySelector(
            ".smpChat__message__alarm"
          ).textContent = count;
        });
      },
      disconnect: () => {
        socket.on("disconnect", (data) => {});
      },
      error: () => {
        socket.on("connect_error", (err) => {
          if (err.data.message === "duplicate_connection") {
            changeSwitch(err.data.state);
            contentsHTML().alert("duplicate");
          }
        });
      },
    };
  };

  const checkSelectEffect = function checkSelectAndEffectPreview(roomName) {
    const currDom = document.querySelector(
      `.smpChat__connect__container_${roomName}`
    );

    let select = false;
    let effect = false;

    if (currDom.classList.contains("select")) select = true;
    if (currDom.classList.contains("effect")) effect = true;

    return { select, effect };
  };

  const socketSend = function sendSocketArea(socket) {
    return {
      serverSwitch: (state) => socket.emit("switch", state),

      message: (msg = null, img = null) => socket.emit("message", msg, img),

      dialog: (userId) => socket.emit("dialog", userId),

      prevDialog: (seq) => socket.emit("prevDialog", seq),

      observe: (roomName) => socket.emit("observe", roomName),

      alarm: (userId, msgUser) => socket.emit("alarm", userId, msgUser),
    };
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

  const socketURL = function connectSocketURL({ clientId, apiKey, userId }) {
    return io(`ws://localhost:7000/${clientId}`, {
      reconnectionDelayMax: 10000,
      autoConnect: false,
      auth: {
        apiKey,
      },
      query: {
        userId,
        clientId,
      },
    });
  };

  const managerArea = function ctrlManagerChat({ domId }) {
    managerHTML(domId);
    chatIcon();
    dialogHeight();
  };

  const clientArea = function ctrlClientChat({ domId }) {
    clientHTML(domId);
    chatIcon();
    dialogHeight();
  };

  const messageSend = function sendMessage(socket) {
    const message = document.querySelector(".smpChat__dialog__msgTextArea");
    const footer = document.querySelector(".smpChat__dialog__footer");
    const chatView = document.querySelector(".smpChat__dialog__chatView");
    const sendButton = document.querySelector(".smpChat__dialog__sendImg");
    const checkbox =
      document.querySelector(`.smpChat__connect__switchInput`) ||
      document.querySelector(`.smpChat__dialog__switchInput`);

    const sendMsgEnterKey = (e) => {
      if (e.key === "Enter" && !e.ctrlKey) {
        const msg = e.target.value;

        if (!emptyCheck(msg)) {
          e.preventDefault();
          return;
        }

        const state = checkbox.checked ? "on" : "off";

        if (state === "on") socketSend(socket).message(msg);
        if (state === "off") {
          contentsHTML().offlineMessage(msg);
          linkInfo(msg);
        }

        scrollBottom(chatView);

        message.value = "";
        message.style.height = "40px";
        footer.style.height = "60px";
        chatView.style.height = "540px";

        e.preventDefault();
      }
    };

    const sendMsgButtonClick = (e) => {
      const msg = message.value;

      if (!emptyCheck(msg)) {
        e.preventDefault();
        return;
      }

      const state = checkbox.checked ? "on" : "off";

      if (state === "on") socketSend(socket).message(msg);
      if (state === "off") {
        contentsHTML().offlineMessage(msg);
        linkInfo(msg);
      }

      linkInfo(msg);

      scrollBottom(chatView);

      message.value = "";
      message.style.height = "40px";
      footer.style.height = "60px";
      chatView.style.height = "540px";

      e.preventDefault();
    };

    message.addEventListener("keydown", sendMsgEnterKey);
    sendButton.addEventListener("click", sendMsgButtonClick);
  };

  const linkInfo = function createLinkInfo(word) {
    const trimWord = word.trim();
    if (
      trimWord === "깃허브" ||
      trimWord === "깃" ||
      trimWord.toLowerCase() === "github" ||
      trimWord.toLowerCase() === "git"
    ) {
      const linkAddr = "https://github.com/starry-winter-night";
      const gitAddr = "github.com/starry-winter-night";
      contentsHTML().link(linkAddr, gitAddr);
    }

    if (
      trimWord === "이메일" ||
      trimWord.toLowerCase() === "email" ||
      trimWord.toLowerCase() === "mail" ||
      trimWord === "메일"
    ) {
      const linkAddr = "mailto:smpark7723@gmail.com";
      const gitAddr = "smpark7723@gmail.com";
      contentsHTML().link(linkAddr, gitAddr);
    }
  };

  const emptyCheck = function checkEmptyString(data) {
    return typeof data.trim() === "string" && data.trim() !== "" ? true : false;
  };

  const socketError = function errorSocketArea() {
    socket.on("connect_error", (err) => console.log(err));
    socket.on("connect_failed", (err) => console.log(err));
    socket.on("disconnect", (err) => console.log(err));
    socket.on("error", (err) => console.log(err.content));
  };

  const resetHTML = function resetHTML() {
    return {
      sectionIcon: ({ domId }) => {
        const chatBox = document.getElementById(domId);
        const section = document.querySelector(".smpChat__section");
        const icon = document.querySelector(".smpChatIcon");
        if (chatBox && section && icon) {
          chatBox.removeChild(section);
          chatBox.removeChild(icon);
        }
      },
      dialog: (userId) => {
        let chatView = document.querySelector(".smpChat__dialog__chatView");

        if (chatView === null) {
          chatView = document.querySelector(
            `.smpChat__dialog__chatView_${userId}`
          );
        }

        while (chatView.firstChild) {
          chatView.removeChild(chatView.firstChild);
        }
      },
      preview: () => {
        const chatList = document.querySelector(".smpChat__connect__list");

        while (chatList.firstChild) {
          chatList.removeChild(chatList.firstChild);
        }
      },
    };
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
    const theme = document.createElement("img");
    const closeImg = document.createElement("img");
    const connect = document.createElement("div");
    const dialog = document.createElement("div");
    const alarm = document.createElement("p");
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
    navbar.appendChild(theme);
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
    smpChatLayout.appendChild(alarm);
    smpChatLayout.appendChild(section);

    /*****************************  className & id  *****************************/
    /* common */
    section.id = "smpChat_managerSection";
    section.className = "smpChat__section";
    contents.className = "smpChat__section__contents";
    navbar.className = "smpChat__section__navbar";
    connect.className = "smpChat__section__connect";
    dialog.className =
      "smpChat__section__dialog smpChat__section__managerDialog";
    logo.className = "smpChat__section__logo smpChat__userSelect__none";
    theme.className = "smpChat__section__theme smpChat__userSelect__none";
    closeImg.className = "smpChat__section__close smpChat__userSelect__none";
    alarm.className = "smpChat__message__alarm";
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
    theme.setAttribute(
      "src",
      "http://localhost:5000/smpChat/image?name=redFlower.png"
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
      "http://localhost:5000/smpChat/image?name=blueSend.png"
    );
    dialogChatAddLabel.htmlFor = "smp_chat_addImg";
    dialogChatAddInput.type = "file";
    dialogChatAddInput.accept = "image/gif, image/jpeg, image/png";
    dialogChatAddInput.name = "smp_chat_addImg";
  };

  const clientHTML = function drawClientHTML(domId) {
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
    const theme = document.createElement("img");
    const closeImg = document.createElement("img");
    const dialog = document.createElement("div");
    const alarm = document.createElement("p");
    const smpChatIconImg = document.createElement("img");

    /* dialog */
    const dialogNav = document.createElement("div");
    const dialogSwitch = document.createElement("div");
    const dialogNavInfo = document.createElement("h3");
    const dialogSwitchLabel = document.createElement("label");
    const dialogSwitchBall = document.createElement("span");
    const dialogSwitchSpan = document.createElement("span");
    const dialogSwitchInput = document.createElement("input");
    const dialogSwitchOffP = document.createElement("p");
    const dialogSwitchOnP = document.createElement("p");
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

    /* dialog */
    const infoText = document.createTextNode("Web Developer smPark 채팅하기");
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
    navbar.appendChild(theme);
    navbar.appendChild(closeImg);

    /* dialog */
    dialogNavInfo.appendChild(infoText);
    dialogSwitchOffP.appendChild(connSwitchOff);
    dialogSwitchOnP.appendChild(connSwitchOn);
    dialogSwitchSpan.appendChild(dialogSwitchOffP);
    dialogSwitchSpan.appendChild(dialogSwitchOnP);
    dialogSwitchLabel.appendChild(dialogSwitchBall);
    dialogSwitchLabel.appendChild(dialogSwitchSpan);
    dialogSwitch.appendChild(dialogSwitchInput);
    dialogSwitch.appendChild(dialogSwitchLabel);
    dialogNav.appendChild(dialogNavInfo);
    dialogNav.appendChild(dialogSwitch);

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
    smpChatLayout.appendChild(alarm);
    smpChatLayout.appendChild(section);

    /*****************************  className & id  *****************************/
    /* common */
    section.id = "smpChat_clientSection";
    section.className = "smpChat__section";
    contents.className = "smpChat__section__contents";
    alarm.className = "smpChat__message__alarm";
    navbar.className = "smpChat__section__navbar";
    dialog.className =
      "smpChat__section__dialog smpChat__section__clientDialog";
    logo.className = "smpChat__section__logo smpChat__userSelect__none";
    theme.className = "smpChat__section__theme smpChat__userSelect__none";
    closeImg.className = "smpChat__section__close smpChat__userSelect__none";
    smpChatIconImg.className = "smpChatIcon smpChat__userSelect__none";

    /* dialog */
    dialogNav.className = "smpChat__dialog__navbar";
    dialogNavInfo.className =
      "smpChat__dialog__navInfo smpChat__userSelect__none";
    dialogSwitch.className = "smpChat__dialog__switch";
    dialogSwitchBall.className = "smpChat__dialog__switchBall";
    dialogSwitchSpan.className = "smpChat__dialog__switchSpan";
    dialogSwitchLabel.className = "smpChat__dialog__switchLabel";
    dialogSwitchInput.id = "smp_chat_switch";
    dialogSwitchInput.className = "smpChat__dialog__switchInput";
    dialogSwitchOffP.className =
      "smpChat__dialog__switchOff smpChat__userSelect__none";
    dialogSwitchOnP.className =
      "smpChat__dialog__switchOn smpChat__userSelect__none";
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
    theme.setAttribute(
      "src",
      "http://localhost:5000/smpChat/image?name=redFlower.png"
    );
    closeImg.setAttribute(
      "src",
      "http://localhost:5000/smpChat/image?name=close.png"
    );
    closeImg.setAttribute("alt", "채팅창닫기 아이콘");

    /* dialog */

    dialogSwitchLabel.htmlFor = "smp_chat_switch";
    dialogSwitchInput.type = "checkbox";
    dialogSwitchInput.name = "smp_chat_switch";
    dialogChatAddImg.setAttribute(
      "src",
      "http://localhost:5000/smpChat/image?name=plus.png"
    );
    dialogChatMsgSend.setAttribute(
      "src",
      "http://localhost:5000/smpChat/image?name=blueSend.png"
    );
    dialogChatAddLabel.htmlFor = "smp_chat_addImg";
    dialogChatAddInput.type = "file";
    dialogChatAddInput.accept = "image/gif, image/jpeg, image/png";
    dialogChatAddInput.name = "smp_chat_addImg";
  };

  const contentsHTML = function drawContentHTML() {
    /*  layout  */
    const connect = document.querySelector(".smpChat__connect__list");
    const dialog = document.querySelector(".smpChat__dialog__chatView");
    const alarm = document.querySelector(".smpChat__message__alarm");
    const container = document.createElement("div");
    const profile = document.createElement("div");
    const profileImage = document.createElement("img");
    const id = document.createElement("p");
    const span = document.createElement("span");
    const contentsContainer = document.createElement("div");
    const content = document.createElement("p");
    const contentImage = document.createElement("img");
    const time = document.createElement("time");
    const observe = document.createElement("img");
    const link = document.createElement("a");

    /*  textNode  */
    const idText = document.createTextNode("smpchat");

    /*  set  */
    // dialog.setAttribute("ondrop", handleDrop());

    return {
      noticeClient: () => {
        /*  textNode  */
        const idText = document.createTextNode("smpchat_bot");
        const noticeIdSpan = document.createTextNode("[공지사항]");
        const noticeContentText = `안녕하세요! 이용방법을 읽어주세요.
        </br>우측상단 버튼을 클릭시 서버와 연결됩니다. 
        </br>메시지 입력 시 컨트롤 + 엔터키를 통해 줄 바꿈 할 수 있습니다. 
        </br>메시지 입력 후 엔터 또는 우측하단 아이콘 클릭 시 전송됩니다. 
        </br>좌측하단 플러스 아이콘으로 이미지를 보낼 수 있습니다.(1MB 이하) 
        </br>서버 연결 전 "깃허브" 또는 "이메일"을 입력하시면 해당 링크를 얻을 수 있습니다.
        </br>서버 연결 전 메시지는 저장되지 않으며 새로고침 또는 서버 연결 시 삭제됩니다.
        </br><b>[채팅운영시간]</b></br>평일 10:00 ~ 18:00 
        </br>감사합니다 :D`;

        /*  appned  */
        id.appendChild(idText);
        profile.appendChild(profileImage);
        profile.appendChild(id);
        profile.appendChild(span);
        container.appendChild(profile);
        content.innerHTML = noticeContentText;
        span.appendChild(noticeIdSpan);
        contentsContainer.appendChild(content);
        container.appendChild(contentsContainer);
        container.appendChild(time);
        dialog.appendChild(container);

        /*  className & id   */
        container.className = "smpChat__dialog__containerLeft";
        contentsContainer.className = "smpChat__dialog__contentContainerLeft";
        profile.className = "smpChat__dialog__profile";
        profileImage.className = "smpChat__dialog__profileImage";
        content.className = "smpChat__dialog__content";
        time.className = "smpChat__dialog__time";
        id.className = "smpChat__dialog__id";
        span.className = "smpChat__dialog__span";

        /*  set  */
        time.setAttribute("datetime", timeData());
        profileImage.src =
          "http://localhost:5000/smpChat/image?name=smpark.jpg";

        /*  function  */
        msgTime(time);
      },
      link: (linkAddr, msg) => {
        /*  textNode  */
        const linkMsg = document.createTextNode(msg);
        const linkSpan = document.createTextNode("[정보]");

        /*  appned  */
        id.appendChild(idText);
        link.appendChild(linkMsg);
        span.appendChild(linkSpan);
        profile.appendChild(profileImage);
        profile.appendChild(id);
        profile.appendChild(span);
        container.appendChild(profile);
        contentsContainer.appendChild(link);
        container.appendChild(contentsContainer);
        container.appendChild(time);
        dialog.appendChild(container);

        /*  className & id   */
        container.className = "smpChat__dialog__containerLeft";
        contentsContainer.className = "smpChat__dialog__contentContainerLeft";
        profile.className = "smpChat__dialog__profile";
        profileImage.className = "smpChat__dialog__profileImage";
        link.className = "smpChat__dialog__content";
        time.className = "smpChat__dialog__time";
        id.className = "smpChat__dialog__id";
        span.className = "smpChat__dialog__span";

        /*  set  */
        link.setAttribute("href", linkAddr);
        link.target = "_blank";
        time.setAttribute("datetime", timeData());
        profileImage.src =
          "http://localhost:5000/smpChat/image?name=smpark.jpg";

        /*  function  */
        msgTime(time);
      },
      alert: (type) => {
        let noticeContentText = null;
        /*  textNode  */
        const idText = document.createTextNode("smpchat_bot");
        const noticeIdSpan = document.createTextNode("[알림]");

        if (type === "duplicate") {
          noticeContentText = `사용자가 이미 채팅 서버를 이용 중입니다.
          </br>기존에 채팅 서버를 이용 중이 아니셨다면 잦은 새로고침이 원인일 수 있습니다.
          </br>30초 뒤에 서버를 다시 실행해 주세요.`;
        }

        if (type === "imageSizeOver") {
          noticeContentText = `이미지 크기는 1MB 이하만 가능합니다.`;
        }

        if (type === "imageTypeError") {
          noticeContentText = `이미지 확장자는 jpg, png, bmp만 지원합니다.`;
        }

        /*  appned  */
        id.appendChild(idText);
        profile.appendChild(profileImage);
        profile.appendChild(id);
        profile.appendChild(span);
        container.appendChild(profile);
        content.innerHTML = noticeContentText;
        span.appendChild(noticeIdSpan);
        contentsContainer.appendChild(content);
        container.appendChild(contentsContainer);
        container.appendChild(time);
        dialog.appendChild(container);

        /*  className & id   */
        container.className = "smpChat__dialog__containerLeft";
        contentsContainer.className = "smpChat__dialog__contentContainerLeft";
        profile.className = "smpChat__dialog__profile";
        profileImage.className = "smpChat__dialog__profileImage";
        content.className = "smpChat__dialog__content";
        time.className = "smpChat__dialog__time";
        id.className = "smpChat__dialog__id";
        span.className = "smpChat__dialog__span";

        /*  set  */
        time.setAttribute("datetime", timeData());
        profileImage.src =
          "http://localhost:5000/smpChat/image?name=smpark.jpg";

        /*  function  */
        msgTime(time);
        scrollBottom(dialog);
      },
      offlineMessage: (msg) => {
        /*  textNode  */
        const offMessage = document.createTextNode(msg);

        /*  appned  */
        content.appendChild(offMessage);
        contentsContainer.appendChild(content);
        container.appendChild(time);
        container.appendChild(contentsContainer);
        dialog.appendChild(container);

        /*  className & id   */
        container.className = "smpChat__dialog__containerRight";
        contentsContainer.className = "smpChat__dialog__contentContainerRight";
        content.className = "smpChat__dialog__content";
        time.className = "smpChat__dialog__time";

        /*  set  */
        time.setAttribute("datetime", timeData());

        /*  function  */
        msgTime(time);

        return;
      },
      dialog: (msg, currUserId) => {
        const { seq, userId, message, registerTime, roomName, image } = msg;

        /*  textNode  */
        const onMessage = document.createTextNode(message);
        const idText = document.createTextNode(userId);

        if (userId !== currUserId) {
          /*  appned  */
          id.appendChild(idText);
          profile.appendChild(profileImage);
          profile.appendChild(id);
          profile.appendChild(span);
          container.appendChild(profile);

          if (image !== null) {
            contentsContainer.appendChild(contentImage);
          } else {
            contentsContainer.appendChild(content);
          }

          content.appendChild(onMessage);
          container.appendChild(contentsContainer);
          container.appendChild(time);
          container.appendChild(observe);

          /*  className & id   */
          id.className = "smpChat__dialog__id";
          profile.className = "smpChat__dialog__profile";
          profileImage.className = "smpChat__dialog__profileImage";
          dialog.className = `smpChat__dialog__chatView smpChat__dialog__chatView_${roomName}`;
          container.className = "smpChat__dialog__containerLeft";
          contentsContainer.className =
            image !== null
              ? "smpChat__dialog__imageContentContainerLeft"
              : "smpChat__dialog__contentContainerLeft";

          /*  set  */
          profileImage.src =
            msg.userType === "manager"
              ? "http://localhost:5000/smpChat/image?name=smpark.jpg"
              : "http://localhost:5000/smpChat/image?name=발리.jpg";
        }

        if (userId === currUserId) {
          /*  appned  */
          container.appendChild(observe);
          container.appendChild(time);

          image !== null
            ? contentsContainer.appendChild(contentImage)
            : contentsContainer.appendChild(content);

          content.appendChild(onMessage);
          container.appendChild(contentsContainer);

          /*  className & id   */
          container.className = "smpChat__dialog__containerRight";
          contentsContainer.className =
            image !== null
              ? "smpChat__dialog__imageContentContainerRight"
              : "smpChat__dialog__contentContainerRight";

          /*  set  */
          if (!msg.observe) {
            observe.src =
              "http://localhost:5000/smpChat/image?name=greyCheck.png";
          } else {
            const color = localStorage.getItem("smpchat-user-theme");

            observe.src = `http://localhost:5000/smpChat/image?name=${color}Check.png`;
          }
        }

        dialog.appendChild(container);

        /*  className & id   */
        content.className = "smpChat__dialog__content";
        contentImage.className = "smpChat__dialog__contentImage";
        time.className = "smpChat__dialog__time";
        observe.className = "smpChat__dialog__observe";

        /*  set  */
        time.setAttribute("datetime", registerTime);
        container.dataset.seq = seq;

        if (image !== null) {
          contentImage.src = `data:image/jpeg;base64,${image}`;

          contentImage.onload = () => scrollBottom(dialog);
        }

        /*  function  */
        msgTime(time);

        return;
      },
      prevDialog: (msg, currUserId) => {
        const { seq, userId, message, registerTime, roomName, image } = msg;

        const chatView = document.querySelector(
          `.smpChat__dialog__chatView_${currUserId}`
        );

        if (!chatView) {
          dialog.classList.add(`smpChat__dialog__chatView_${roomName}`);
        }

        /*  textNode  */
        const onMessage = document.createTextNode(message);
        const idText = document.createTextNode(userId);

        if (userId !== currUserId) {
          /*  appned  */
          id.appendChild(idText);
          profile.appendChild(profileImage);
          profile.appendChild(id);
          profile.appendChild(span);

          container.appendChild(profile);
          container.appendChild(time);
          if (image !== null) {
            contentsContainer.appendChild(contentImage);
          } else {
            contentsContainer.appendChild(content);
          }
          content.appendChild(onMessage);
          container.appendChild(contentsContainer);
          container.appendChild(time);
          /*  className & id   */
          id.className = "smpChat__dialog__id";
          profile.className = "smpChat__dialog__profile";
          profileImage.className = "smpChat__dialog__profileImage";
          container.className = "smpChat__dialog__containerLeft";
          contentsContainer.className =
            image !== null
              ? "smpChat__dialog__imageContentContainerLeft"
              : "smpChat__dialog__contentContainerLeft";
        } else {
          /*  appned  */
          container.appendChild(time);
          if (image !== null) {
            contentsContainer.appendChild(contentImage);
          } else {
            contentsContainer.appendChild(content);
          }
          content.appendChild(onMessage);
          container.appendChild(contentsContainer);
          /*  className & id   */
          container.className = "smpChat__dialog__containerRight";
          contentsContainer.className =
            image !== null
              ? "smpChat__dialog__imageContentContainerRight"
              : "smpChat__dialog__contentContainerRight";
        }

        dialog.prepend(container);

        /*  className & id   */
        content.className = "smpChat__dialog__content";
        contentImage.className = `smpChat__dialog__contentImage smpChat__dialog__contentImage_${userId}`;
        time.className = `smpChat__dialog__time smpChat__dialog__time_${userId}`;

        /*  set  */
        time.setAttribute("datetime", registerTime);
        container.dataset.seq = seq;
        profileImage.src = "http://localhost:5000/smpChat/image?name=발리.jpg";

        if (image !== null) {
          contentImage.src = `data:image/jpeg;base64,${image}`;
        }

        /*  function  */
        msgTime(time);

        return;
      },
      systemAlarm: (state, msg = false) => {
        /*  layout  */
        const container = document.createElement("div");
        const content = document.createElement("p");

        /*  textNode  */
        let systemMsgText = null;

        if (state === "on" && !msg) {
          systemMsgText = document.createTextNode("서버에 연결되었습니다.");
        }

        if (state === "off" && !msg) {
          systemMsgText = document.createTextNode(
            "서버에 연결되지 않았습니다."
          );
        }

        if (state === "on" && msg) {
          systemMsgText = document.createTextNode(msg);
        }

        /*  appned  */
        content.appendChild(systemMsgText);
        container.appendChild(content);
        dialog.appendChild(container);

        /*  className & id   */
        container.className = "smpChat__dialog__systemBar";
        content.className = "smpChat__dialog__systemMsg";

        /*  function  */
        scrollBottom(dialog);
      },
      preview: (logs) => {
        const { message, registerTime, image, roomName } = logs;

        const addPreview = () => {
          const content = document.querySelector(
            `.smpChat__connect__content_${roomName}`
          );
          const time = document.querySelector(
            `.smpChat__connect__time_${roomName}`
          );

          /*  textNode  */
          content.textContent = message;

          /*  set  */
          time.setAttribute("datetime", registerTime);

          /*  function  */
          msgTime(time);

          return;
        };

        const drawPreview = () => {
          /* layout */
          const container = document.createElement("div");
          const id = document.createElement("p");
          const previewAlarm = document.createElement("p");

          /*  textNode  */
          const idText = document.createTextNode(roomName);
          const messageText = document.createTextNode(message);

          /*  appned  */
          id.appendChild(idText);
          content.appendChild(messageText);
          container.appendChild(id);
          container.appendChild(time);
          contentsContainer.appendChild(content);
          contentsContainer.appendChild(previewAlarm);
          container.appendChild(contentsContainer);
          connect.appendChild(container);

          /*  className & id   */

          id.className = "smpChat__connect__id";
          time.className = `smpChat__connect__time smpChat__connect__time_${roomName}`;
          content.className = `smpChat__connect__content smpChat__connect__content_${roomName}`;
          container.className = `smpChat__connect__container smpChat__connect__container_${roomName}`;
          previewAlarm.className = `smpChat__connect_previewAlarm smpChat__connect_previewAlarm_${roomName}`;
          contentsContainer.className = "smpChat__connect__contentsContainer";

          /*  set  */
          time.setAttribute("datetime", registerTime);
          container.dataset.id = roomName;

          /*  function  */
          msgTime(time);

          return;
        };

        const container = document.querySelector(
          `.smpChat__connect__container_${roomName}`
        );

        container ? addPreview() : drawPreview();
      },
    };
  };

  const timeData = function createTimeDate(mSec) {
    const changeNumberFormat = (num) => (num < 10 ? `0${num}` : num);

    const today = mSec ? new Date(mSec) : new Date();
    const year = today.getFullYear();
    const month = changeNumberFormat(today.getMonth() + 1);
    const day = changeNumberFormat(today.getDate());
    const h = changeNumberFormat(today.getHours());
    const m = changeNumberFormat(today.getMinutes());
    const result = mSec
      ? `${month}월 ${day}일`
      : `${year}-${month}-${day} ${h}:${m}`;

    return result;
  };

  const msgTime = function elapseMessageTime(dom) {
    const dialogTime = dom;
    const prevTime = new Date(dialogTime.dateTime);
    const currentTime = new Date(timeData());
    const elapseTime = currentTime - prevTime;
    const minutesTime = Math.floor(elapseTime / (1000 * 60));
    const hourTime = Math.floor(elapseTime / (1000 * 60 * 60));
    const dayTime = Math.floor(elapseTime / (1000 * 60 * 60 * 24));
    let word = "방금 전";

    if (minutesTime >= 1 && hourTime < 1) word = `${minutesTime}분 전`;

    if (hourTime >= 1 && dayTime < 1) word = `약 ${hourTime}시간 전`;

    if (dayTime >= 1) word = timeData(currentTime - elapseTime);

    setTimeout(() => msgTime(dom), 1000 * 60);

    dialogTime.textContent = word;
  };

  const chatIcon = function toggleChatView() {
    const icon = document.querySelector(".smpChatIcon");
    const section = document.querySelector(".smpChat__section");
    const close = document.querySelector(".smpChat__section__close");
    const chatView = document.querySelector(".smpChat__dialog__chatView");

    icon.addEventListener("click", () => {
      icon.classList.toggle("smp_active");
      section.classList.toggle("smp_active");

      scrollBottom(chatView);
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

    const changeDialogHeight = (e) => {
      //const currentHeight = msgInput.scrollHeight;
      const inputHeight = msgInput.offsetHeight;
      const footerHeight = footer.offsetHeight;
      const chatViewHeight = chatView.offsetHeight;

      // textarea의 높이 값을 부여하여 자동으로 높이값을 조절하게 한다.
      msgInput.style.height = "0px";
      msgInput.style.height = `${msgInput.scrollHeight}px`;
      // 핵심은 줄바꿈마다 inputBox의 초기높이 만큼 더하거나 빼준다.
      if (msgInput.scrollHeight > inputHeight) {
        chatView.style.height = `${
          chatViewHeight - (e.target.offsetHeight - inputHeight)
        }px`;
        footer.style.height = `${
          footerHeight + (e.target.offsetHeight - inputHeight)
        }px`;
      }
      if (msgInput.scrollHeight < inputHeight) {
        chatView.style.height = `${
          chatViewHeight + (inputHeight - e.target.offsetHeight)
        }px`;
        footer.style.height = `${
          footerHeight - (inputHeight - e.target.offsetHeight)
        }px`;
      }

      changeScroll(msgInput);
    };

    msgInput.addEventListener("input", changeDialogHeight, false);
    msgInput.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        cursorPosition(e);
        changeDialogHeight(e);
        scrollBottom(chatView);
        textFocus(msgInput);
      }
    });
  };

  const cursorPosition = function ctrlCursorPosition(e) {
    const cursorPosition = e.target.selectionEnd;
    const cursorNextText = e.target.value.substring(cursorPosition);
    const cursorPrevText = e.target.value.substring(0, cursorPosition);
    const lineBreak = "\r\n";

    e.target.value = cursorPrevText + lineBreak;

    const lineBreakCursorPosition = e.target.selectionEnd;

    e.target.value = cursorPrevText + lineBreak + cursorNextText;
    e.target.selectionEnd = lineBreakCursorPosition;

    return;
  };

  const styleValue = function getStyleValue(dom, propName) {
    const style = window.getComputedStyle(dom);

    return style.getPropertyValue(propName);
  };

  const removeStr = function removeStringWord(str) {
    return Number(str.replace(/[^0-9]/g, ""));
  };

  const changeScroll = function changeScrollMaxHeight(dom) {
    const maxHeight = removeStr(styleValue(dom, "max-height"));

    if (dom.offsetHeight >= maxHeight) {
      dom.style.overflowY = "scroll";
    } else {
      dom.style.overflowY = "hidden";
    }

    return;
  };

  const textFocus = function focusTextAreaCursor(input) {
    input.blur();
    input.focus();

    return;
  };

  const scrollIncrease = function fixScrollIncrease(dom, height) {
    dom.scrollTop = height;

    return;
  };

  const scrollBottom = function fixScrollBottom(dom) {
    dom.scrollTop = dom.scrollHeight;

    return;
  };

  const refleshConn = function refleshServerConnect(socket, state) {
    if (state === "on") {
      connServer(socket).on();
      socketSend(socket).serverSwitch(state);

      return;
    }

    if (state === "off") {
      contentsHTML().noticeClient();
      contentsHTML().systemAlarm(state);

      return;
    }
  };

  const clickConn = function clickServerConnect(socket) {
    const checkbox =
      document.querySelector(`.smpChat__connect__switchInput`) ||
      document.querySelector(`.smpChat__dialog__switchInput`);
    if (!checkbox) return;

    const ctrlServer = () => {
      state = !checkbox.checked ? "off" : "on";

      if (!checkbox.checked) {
        socketSend(socket).serverSwitch(state);

        return;
      }

      connServer(socket).on();
      socketSend(socket).serverSwitch(state);

      return;
    };

    checkbox.addEventListener("click", ctrlServer, false);
  };

  const connServer = function turnOnOffServer(socket) {
    return {
      on: () => socket.open(),
      off: () => socket.disconnect(),
    };
  };

  const changeSwitch = function changeSwitchState(state) {
    const checkbox =
      document.querySelector(".smpChat__connect__switchInput") ||
      document.querySelector(".smpChat__dialog__switchInput");
    if (state === "on") {
      checkbox.checked = true;
      return;
    }

    if (state === "off") {
      checkbox.checked = false;
      return;
    }
  };

  const clickPreview = function joinChatRoom(socket, roomName) {
    const list = document.querySelector(
      `.smpChat__connect__container_${roomName}`
    );
    const alarm = document.querySelector(
      `.smpChat__connect_previewAlarm_${roomName}`
    );

    list.addEventListener(
      "click",
      () => {
        alarm.classList.remove("view");
        alarm.textContent = 0;

        socketSend(socket).dialog(roomName);
        socketSend(socket).observe(roomName);
      },
      false
    );
    return;
  };

  const eDelegation = function eventDelegation(targetDom, domName) {
    while (!targetDom.classList.contains(domName)) {
      targetDom = targetDom.parentNode;

      if (targetDom.nodeName === "SECTION") {
        targetDom = null;
        return;
      }
    }

    return targetDom;
  };

  const dialogScroll = function loadDialogScroll(socket) {
    const loadDialogScrollHandler = (e) => {
      const currentScrollY = e.target.scrollTop;

      if (currentScrollY === 0 && e.target.firstChild) {
        const sysClassName = e.target.firstChild.className;

        if (sysClassName !== "smpChat__dialog__systemBar") {
          const chatSeq = e.target.firstChild.dataset.seq;

          socketSend(socket).prevDialog(chatSeq);
        }
      }
    };

    const chatView = document.querySelector(".smpChat__dialog__chatView");

    chatView.addEventListener("scroll", loadDialogScrollHandler, false);
  };

  const sendImage = function sendImage(socket) {
    const sendImageHandler = (image) => {
      if (image) {
        const check = checkImageRule(image);

        if (check === "ok") {
          const reader = new FileReader();
          const name = image.name;

          reader.readAsArrayBuffer(image);

          reader.onload = (e) => {
            const bytes = new Uint8Array(e.target.result);

            socketSend(socket).message(null, { bytes, name });
          };
        }
      }
    };

    const plusClickHandler = (e) => {
      sendImageHandler(e.target.files[0]);

      e.target.value = null;
    };

    const dropHandler = (e) => {
      e.preventDefault();

      chatView.classList.remove("smpChat__dialog__dottedLine");

      const dataTrans = e.dataTransfer;
      const files = dataTrans.files;

      sendImageHandler(files[0]);
    };

    const overViewHandler = (e) => {
      e.preventDefault();

      chatView.classList.add("smpChat__dialog__dottedLine");
    };

    const leaveViewHandler = (e) => {
      e.preventDefault();

      chatView.classList.remove("smpChat__dialog__dottedLine");
    };

    const checkImageRule = (image) => {
      if (
        image.type !== "image/png" &&
        image.type !== "image/jpg" &&
        image.type !== "image/jpeg" &&
        image.type !== "image/bmp"
      ) {
        contentsHTML().alert("imageTypeError");
        return;
      }

      if (image.size > "1048576") {
        contentsHTML().alert("imageSizeOver");
        return;
      }

      return "ok";
    };

    const input = document.querySelector(".smpChat__dialog__addInput");
    const chatView = document.querySelector(".smpChat__dialog__chatView");

    input.addEventListener("change", plusClickHandler, false);

    chatView.addEventListener("dragover", overViewHandler, false);
    chatView.addEventListener("dragleave", leaveViewHandler, false);
    chatView.addEventListener("drop", dropHandler, false);
  };

  const changeTheme = function changeSmpChatTheme() {
    const theme = document.querySelector(".smpChat__section__theme");
    const send = document.querySelector(".smpChat__dialog__sendImg");

    document.documentElement.setAttribute("smpchat-user-theme", "blue");

    localStorage.setItem("smpchat-user-theme", "blue");

    const themeClickHandler = (e) => {
      if (localStorage.getItem("smpchat-user-theme") === "blue") {
        document.documentElement.setAttribute("smpchat-user-theme", "red");

        theme.src = "http://localhost:5000/smpChat/image?name=blueFlower.png";
        send.src = "http://localhost:5000/smpChat/image?name=redSend.png";

        changeReadIcon("red");

        localStorage.setItem("smpchat-user-theme", "red");
        return;
      }

      if (localStorage.getItem("smpchat-user-theme") === "red") {
        document.documentElement.setAttribute("smpchat-user-theme", "blue");

        theme.src = "http://localhost:5000/smpChat/image?name=redFlower.png";
        send.src = "http://localhost:5000/smpChat/image?name=blueSend.png";

        changeReadIcon("blue");

        localStorage.setItem("smpchat-user-theme", "blue");
        return;
      }
    };

    theme.addEventListener("click", themeClickHandler, false);
  };

  const alarmPreview = function alarmNewPreview(roomName) {
    const container = document.querySelector(
      `.smpChat__connect__container_${roomName}`
    );
    const list = document.querySelector(".smpChat__connect__list");
    let previewRaf = null;
    let opacity = 0;
    let startTime = 0;
    let opacitySwitch = true;

    container.classList.add("effect");

    previewRaf = requestAnimationFrame(effectAlarmPreview);

    list.addEventListener("click", stopAlarmPreview, false);

    function effectAlarmPreview(timestamp) {
      let interval = 0;

      if (startTime === 0) startTime = timestamp;

      interval = (timestamp - startTime) / 10;

      if (interval > 10) {
        opacity = opacitySwitch ? opacity + 0.1 : opacity - 0.1;

        if (opacity === 1) opacitySwitch = false;

        if (opacity === 0) opacitySwitch = true;

        opacity = Number(opacity.toFixed(1));

        applyPreviewColor();

        startTime = timestamp;
      }

      previewRaf = requestAnimationFrame(effectAlarmPreview);
    }

    function applyPreviewColor() {
      container.style.outline = `3px groove ${getRootColorRGB()}, ${opacity})`;
      container.style.boxShadow = `inset 0 2px 45px ${getRootColorRGB()}, ${opacity})`;
    }

    function getRootColorRGB() {
      const domStyle = getComputedStyle(document.documentElement);
      const color = domStyle.getPropertyValue("--smpchat_color_navSubBarRGB");

      return color.substring(0, color.length - 1);
    }

    function stopAlarmPreview(e) {
      const targetDom = eDelegation(e.target, "smpChat__connect__container");

      if (targetDom === container) {
        container.style.outline = "none";
        container.style.boxShadow = "none";

        cancelAnimationFrame(previewRaf);
      }
    }
  };

  const effectSelect = function effectPreviewSelect(roomName) {
    if (roomName) {
      const list = document.querySelectorAll(".smpChat__connect__container");

      list.forEach((dom) => dom.classList.remove("select"));

      const clickedDom = document.querySelector(
        `.smpChat__connect__container_${roomName}`
      );

      clickedDom.classList.remove("effect");
      clickedDom.classList.add("select");
    }
  };

  const observeChatView = function observeMessageRead(socket, roomName) {
    const chatView = document.querySelector(
      `.smpChat__dialog__chatView_${roomName}`
    );

    const icon = document.querySelector(".smpChatIcon");

    if (chatView) {
      const observer = new IntersectionObserver((entries, options) => {
        const active = icon.classList.contains("smp_active");

        if (active) socketSend(socket).observe(roomName);

        return;
      });

      observer.observe(chatView);
    }

    return;
  };

  const changeReadIcon = function changeMessageReadIcon(color = null) {
    let observe = document.querySelectorAll(".smpChat__dialog__observe");

    observe = [...observe];

    observe.map((dom) => {
      const src = dom.getAttribute("src");

      if (src !== null) {
        const index = src.indexOf("greyCheck");

        if (index === -1 && color) {
          dom.src = `http://localhost:5000/smpChat/image?name=${color}Check.png`;
        }

        const srcName = src.substring(index, src.length - 4);

        if (srcName === "greyCheck") {
          if (!color) {
            themeColor = localStorage.getItem("smpchat-user-theme");
            dom.src = `http://localhost:5000/smpChat/image?name=${themeColor}Check.png`;
          }
        }
      }
    });
  };

  const countIconAlarm = function countMessageIconAlarm() {
    const iconAlarm = document.querySelector(".smpChat__message__alarm");
    const alarms = document.querySelectorAll(".smpChat__connect_previewAlarm");
    const arrAlarm = [...alarms];

    let alramCount = 0;

    arrAlarm.forEach((dom) => {
      if (dom.textContent) {
        const alarm = parseInt(dom.textContent);

        if (typeof alarm === "number") {
          alramCount = alramCount + alarm;
        }
      }
    });

    if (alramCount === 0) iconAlarm.classList.remove("view");

    if (alramCount > 0) {
      if (iconAlarm.classList.contains("view")) {
        iconAlarm.textContent = alramCount;

        return;
      }

      if (!iconAlarm.classList.contains("view")) {
        iconAlarm.classList.add("view");
        iconAlarm.textContent = alramCount;

        return;
      }
    }
  };

  const onceDraw = (function checkOnceDraw() {
    let checkPreview = {};
    let checkAlarm = 0;

    return {
      preview: (roomName) => {
        const currDom = document.querySelector(
          `.smpChat__connect__container_${roomName}`
        );

        if (!checkPreview[roomName]) checkPreview[roomName] = 0;

        if (!currDom) return 0;

        if (currDom) checkPreview[roomName] = checkPreview[roomName] + 1;

        return checkPreview[roomName];
      },
      alarm: (roomName) => {
        const currDom = document.querySelector(
          `.smpChat__connect__container_${roomName}`
        );

        if (!currDom) return 0;

        if (currDom) checkAlarm = checkAlarm + 1;

        return checkAlarm;
      },
    };
  })();

  const drawAlarm = (function drawChatAlarm() {
    return {
      messagePreview: (count, roomName) => {
        const previewAlarm = document.querySelector(
          `.smpChat__connect_previewAlarm_${roomName}`
        );
        const chatView = document.querySelector(
          `.smpChat__dialog__chatView_${roomName}`
        );
        const section = document.querySelector(".smpChat__section");

        if (typeof count === "number" && count > 0) {
          if (chatView && section.classList.contains("smp_active")) return;

          previewAlarm.classList.add("view");

          previewAlarm.textContent = count;
        }
      },
      refleshPreview: (count, roomName) => {
        const previewAlarm = document.querySelector(
          `.smpChat__connect_previewAlarm_${roomName}`
        );
        const chatView = document.querySelector(
          `.smpChat__dialog__chatView_${roomName}`
        );

        if (typeof count === "object" && !chatView) {
          for (id in count) {
            if (id === roomName && count[id] > 0) {
              previewAlarm.classList.add("view");
              previewAlarm.textContent = count[id];
            }
          }
        }
      },
      icon: (count) => {
        const iconAlarm = document.querySelector(".smpChat__message__alarm");

        if (iconAlarm && typeof count === "number" && count > 0) {
          iconAlarm.classList.add("view");

          iconAlarm.textContent = count;
        }
      },
      clickIconHide: () => {
        const icon = document.querySelector(".smpChatIcon");

        icon.addEventListener("click", iconEventHandler, false);

        function iconEventHandler() {
          let container = document.querySelectorAll(
            ".smpChat__connect__container"
          );

          container = [...container];

          container.map((dom) => {
            if (dom.classList.contains("select")) {
              const id = dom.dataset.id;
              const alarm = document.querySelector(
                `.smpChat__connect_previewAlarm_${id}`
              );

              alarm.textContent = 0;
              alarm.classList.remove("view");
            }
          });
        }
      },
      clickCloseReDraw: () => {
        const close = document.querySelector(".smpChat__section__close");
        const iconAlarm = document.querySelector(".smpChat__message__alarm");

        close.addEventListener("click", closeEventHandler, false);

        function closeEventHandler() {
          let count = 0;
          let previewAlarm = document.querySelectorAll(
            ".smpChat__connect_previewAlarm"
          );

          if (!previewAlarm) {
            iconAlarm.textContent = 0;
            iconAlarm.classList.remove("view");

            return;
          }

          if (previewAlarm) {
            previewAlarm = [...previewAlarm];

            previewAlarm.map((dom) => {
              if (dom.textContent) {
                const alarmCount = parseInt(dom.textContent);

                if (typeof alarmCount === "number" && alarmCount > 0) {
                  count = count + alarmCount;
                }
              }
            });

            count > 0
              ? (iconAlarm.textContent = count)
              : iconAlarm.classList.remove("view");

            return;
          }
        }
      },
    };
  })();

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
