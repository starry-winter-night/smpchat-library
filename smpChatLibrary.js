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
              ? managerArea(this.args, data.state)
              : clientArea(this.args, data.state);

            const socket = await socketURL(this.args);

            switchState(data.state);

            refleshConn(socket, data.state);

            clickConn(socket);

            messageSend(socket);

            socketReceive(socket).connect();

            socketReceive(socket).switch();

            socketReceive(socket).preview();
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
          // socket.sendBuffer = [];
          console.log("server connect!!");
        });
      },
      switch: () => {
        socket.on("switch", (state) => {
          if (state === "off") {
            connServer(socket).off();
          }

          messageHTML().systemMessage(state);
        });
      },
      preview: () => {
        socket.on("preview", (info) => {
          info.forEach((logs) => messageHTML().preview(logs));
        });
      },
      disconnect: () => {
        socket.on("disconnect", (data) => {});
      },
    };
  };

  const socketSend = function sendSocketArea(socket) {
    return {
      serverSwitch: (state) => {
        socket.emit("switch", state);
      },
      message: (msg) => {
        socket.emit("message", msg);
      },
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
    return io(
      `ws://localhost:7000/${apiKey}?clientId=${clientId}&userId=${userId}`,
      {
        autoConnect: false,
      }
    );
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
          messageHTML().offlineMessage(msg);
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
        messageHTML().offlineMessage(msg);
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
      messageHTML().link(linkAddr, gitAddr);
    }

    if (
      trimWord === "이메일" ||
      trimWord.toLowerCase() === "email" ||
      trimWord.toLowerCase() === "mail" ||
      trimWord === "메일"
    ) {
      const linkAddr = "mailto:smpark7723@gmail.com";
      const gitAddr = "smpark7723@gmail.com";
      messageHTML().link(linkAddr, gitAddr);
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
    dialog.className =
      "smpChat__section__dialog smpChat__section__managerDialog";
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
    const closeImg = document.createElement("img");
    const dialog = document.createElement("div");
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
    smpChatLayout.appendChild(section);

    /*****************************  className & id  *****************************/
    /* common */
    section.id = "smpChat_clientSection";
    section.className = "smpChat__section";
    contents.className = "smpChat__section__contents";
    navbar.className = "smpChat__section__navbar";
    dialog.className =
      "smpChat__section__dialog smpChat__section__clientDialog";
    logo.className = "smpChat__section__logo smpChat__userSelect__none";
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
      "http://localhost:5000/smpChat/image?name=sendBtn.png"
    );
    dialogChatAddLabel.htmlFor = "smp_chat_addImg";
    dialogChatAddInput.type = "file";
    dialogChatAddInput.accept = "image/gif, image/jpeg, image/png";
    dialogChatAddInput.name = "smp_chat_addImg";
  };

  const messageHTML = function drawMessageHTML() {
    /*  layout  */
    const connect = document.querySelector(".smpChat__connect__list");
    const dialog = document.querySelector(".smpChat__dialog__chatView");
    const container = document.createElement("div");
    const profile = document.createElement("div");
    const profileImage = document.createElement("img");
    const id = document.createElement("p");
    const span = document.createElement("span");
    const contentsContainer = document.createElement("div");
    const content = document.createElement("p");
    const contentImage = document.createElement("img");
    const time = document.createElement("time");
    const link = document.createElement("a");

    /*  node  */
    const idText = document.createTextNode("smpchat");

    /*  set  */
    profileImage.setAttribute(
      "src",
      "http://localhost:5000/smpChat/image?name=smpark.jpg"
    );

    return {
      noticeClient: () => {
        /*  node  */
        const idText = document.createTextNode("smpchat");
        const noticeIdSpan = document.createTextNode("[공지사항]");
        const noticeContentText = `안녕하세요! Third_party API SMPCHAT 제작자 sm_Park입니다 :)
        </br>다음은 SMPCHAT 이용방법 입니다.
        </br>우측상단 버튼을 클릭시 서버와 연결됩니다. 
        </br>내용을 입력 후 엔터 또는 우측하단 아이콘 클릭 시 메시지를 보냅니다. 
        </br>좌측하단 플러스 클릭 시 이미지를 보낼 수 있습니다.(1MB 이하) 
        </br>메시지 입력 시 컨트롤 + 엔터키를 통해 줄 바꿈 할 수 있습니다. 
        </br>서버 연결 전 "깃허브" 또는 "이메일"을 입력하시면 해당 링크를 얻을 수 있습니다.
        </br><b>[채팅운영시간]</b></br>평일 10:00 ~ 18:00 
        </br>감사합니다 :D`;

        /*  appned  */
        id.appendChild(idText);
        profile.appendChild(profileImage);
        profile.appendChild(id);
        profile.appendChild(span);
        profile.appendChild(time);
        container.appendChild(profile);
        content.innerHTML = noticeContentText;
        span.appendChild(noticeIdSpan);
        contentsContainer.appendChild(content);
        container.appendChild(contentsContainer);
        dialog.appendChild(container);

        /*  className & id   */
        container.className = "smpChat__dialog__containerLeft";
        contentsContainer.className = "smpChat__dialog__contentLeft";
        profile.className = "smpChat__dialog__profile";
        profileImage.className = "smpChat__dialog__profileImage";
        content.className = "smpChat__dialog__content";
        time.className = "smpChat__dialog__time";
        id.className = "smpChat__dialog__id";
        span.className = "smpChat__dialog__span";

        /*  set  */
        time.setAttribute("datetime", timeData());

        /*  function  */
        msgTime(time);
      },
      link: (linkAddr, msg) => {
        /*  node  */
        const linkMsg = document.createTextNode(msg);
        const linkSpan = document.createTextNode("[정보]");

        /*  appned  */
        id.appendChild(idText);
        link.appendChild(linkMsg);
        span.appendChild(linkSpan);
        profile.appendChild(profileImage);
        profile.appendChild(id);
        profile.appendChild(span);
        profile.appendChild(time);
        container.appendChild(profile);
        contentsContainer.appendChild(link);
        container.appendChild(contentsContainer);
        dialog.appendChild(container);

        /*  className & id   */
        container.className = "smpChat__dialog__containerLeft";
        contentsContainer.className = "smpChat__dialog__contentLeft";
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

        /*  function  */
        msgTime(time);
      },
      offlineMessage: (msg) => {
        /*  node  */
        const offMessage = document.createTextNode(msg);

        /*  appned  */
        content.appendChild(offMessage);
        contentsContainer.appendChild(content);
        container.appendChild(time);
        container.appendChild(contentsContainer);
        dialog.appendChild(container);

        /*  className & id   */
        container.className = "smpChat__dialog__containerRight";
        contentsContainer.className = "smpChat__dialog__contentRight";
        content.className = "smpChat__dialog__content";
        time.className = "smpChat__dialog__time";

        /*  set  */
        time.setAttribute("datetime", timeData());

        /*  function  */
        msgTime(time);
      },
      systemMessage: (state, msg = false) => {
        /*  layout  */
        const container = document.createElement("div");
        const content = document.createElement("p");

        /*  node  */
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
      preview: ({ userId, message, registerTime, image }) => {
        const prevId = document.querySelector(
          `.smpChat__connect__id_${userId}`
        );

        if (prevId === null || prevId.textContent !== userId) {
          /*  node  */
          const idText = document.createTextNode(userId);
          const messageText = document.createTextNode(message);

          /*  appned  */
          id.appendChild(idText);
          content.appendChild(messageText);
          container.appendChild(id);
          container.appendChild(time);
          contentsContainer.appendChild(content);
          contentsContainer.appendChild(contentImage);
          container.appendChild(contentsContainer);
          connect.appendChild(container);

          /*  className & id   */
          container.className = "smpChat__connect__container";
          id.className = `smpChat__connect__id smpChat__connect__id_${userId}`;
          time.className = `smpChat__connect__time smpChat__connect__time_${userId}`;
          content.className = `smpChat__connect__content smpChat__connect__content_${userId}`;
          contentsContainer.className = "smpChat__connect__contentsContainer";

          /*  set  */
          time.setAttribute("datetime", registerTime);

          /*  function  */
          msgTime(time);

          return;
        }

        const prevContent = document.querySelector(
          `.smpChat__connect__content_${userId}`
        );
        const prevTime = document.querySelector(
          `.smpChat__connect__time_${userId}`
        );

        prevTime.setAttribute("datetime", registerTime);
        prevId.textContent = userId;
        prevContent.textContent = message;

        /*  function  */
        msgTime(prevTime);

        return;
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

    // 이전 text + 줄 바꿈만 적용 (줄 바꿈 직후의 커서 위치를 얻기 위해)
    e.target.value = cursorPrevText + lineBreak;

    // 줄 바꿈한 상태의 커서 위치를 저장
    const lineBreakCursorPosition = e.target.selectionEnd;

    // 전체 텍스트를 적용
    e.target.value = cursorPrevText + lineBreak + cursorNextText;

    // 커서를 줄 바꿈한 직후 상태의 포지션에 적용
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
      messageHTML().noticeClient();
      messageHTML().systemMessage(state);

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

  const switchState = function changeSwitchState(state) {
    const checkbox =
      document.querySelector(".smpChat__connect__switchInput") ||
      document.querySelector(".smpChat__dialog__switchInput");
    if (state === "on") {
      return (checkbox.checked = true);
    }

    if (state === "off") {
      return (checkbox.checked = false);
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
