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

            switchState(data.state);

            serverBtn(socket, data.type, data.state);

            msgSend();

            socketReceive(socket).connect();
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
        socket.on("connect", () => console.log("server connect!!"));
      },
      preview: () => {
        socket.on("preview", (data) => {});
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
    textLine();
  };

  const clientArea = function ctrlClientChat({ domId }) {
    clientHTML(domId);
    messageHTML().notice();
    chatIcon();
    dialogHeight();
    textLine();
  };

  const socketSend = function sendSocketArea(socket) {
    return {
      serverSwitch: (state) => {
        socket.emit("switch", state);
      },
      message: (msg) => {
        socket.emit("message", { msg });
      },
    };
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
    const dialog = document.querySelector(".smpChat__dialog__chatView");
    const container = document.createElement("div");
    const profile = document.createElement("div");
    const profileImage = document.createElement("img");
    const id = document.createElement("p");
    const span = document.createElement("span");
    const time = document.createElement("time");
    const contentsContainer = document.createElement("div");
    const content = document.createElement("p");

    /*  node  */
    const idText = document.createTextNode("smpchat");

    /*  appned  */
    id.appendChild(idText);
    profile.appendChild(profileImage);
    profile.appendChild(id);
    profile.appendChild(span);
    profile.appendChild(time);
    container.appendChild(profile);

    /*  className & id   */
    container.className = "smpChat__dialog__container";
    profile.className = "smpChat__dialog__profile";
    profileImage.className = "smpChat__dialog__profileImage";
    id.className = "smpChat__dialog__id";
    time.className = "smpChat__dialog__time";
    span.className = "smpChat__dialog__span";
    contentsContainer.className = "smpChat__dialog__contentsContainer";
    content.className = "smpChat__dialog__content";

    /*  set  */
    profileImage.setAttribute(
      "src",
      "http://localhost:5000/smpChat/image?name=smpark.jpg"
    );

    return {
      notice: () => {
        /*  node  */
        const noticeIdSpan = document.createTextNode("[Notice]");
        const noticeContentText = `안녕하세요! 
        </br></br> Third_party API SMPCHAT입니다. 
        </br></br> 우측상단의 버튼을 클릭하시면 채팅서버와 연결됩니다. 
        </br></br> 하단에서 메세지를 입력 후 엔터 혹은 우측 아이콘을 클릭하시면 관리자와 연결됩니다. 
        </br></br> 좌측 플러스 버튼으로 이미지를 보내실 수 있습니다.(1MB 이하) 
        </br></br> 메세지 입력시 컨트롤 + 엔터키를 통해 줄바꿈 하실 수 있습니다. 
        </br></br> "깃허브" 또는 "이메일"을 입력하시면 해당 링크를 얻으실 수 있습니다.
        </br></br> <b>[채팅운영시간]</b> 
        </br>평일 10:00 ~ 18:00 
        </br></br> 감사합니다 :D`;

        /*  appned  */
        content.innerHTML = noticeContentText;
        span.appendChild(noticeIdSpan);
        profile.appendChild(span);
        contentsContainer.appendChild(content);
        container.appendChild(contentsContainer);
        dialog.appendChild(container);

        /*  className & id   */
        container.className = "smpChat__dialog__noticeContainer";
      },
      link: (linkAddr, word) => {
        /*  layout  */
        const link = document.createElement("a");

        /*  node  */
        const linkWord = document.createTextNode(word);
        const linkSpan = document.createTextNode("[Info]");

        /*  appned  */
        link.appendChild(linkWord);
        profile.appendChild(linkSpan);
        contentsContainer.appendChild(link);
        container.appendChild(contentsContainer);
        dialog.appendChild(container);

        /*  className & id   */
        link.className = "smpChat__dialog__content";

        /*  set  */
        link.setAttribute("href", linkAddr);
        link.target = "_blank";
      },
      message: () => {},
    };
  };

  const chatIcon = function toggleChatView() {
    const icon = document.querySelector(".smpChatIcon");
    const section = document.querySelector(".smpChat__section");
    const close = document.querySelector(".smpChat__section__close");
    const notice = document.querySelector(".smpChat__dialog__noticeContainer");

    icon.addEventListener("click", () => {
      icon.classList.toggle("smp_active");
      section.classList.toggle("smp_active");
      notice.classList.toggle("smp_active");
    });
    close.addEventListener("click", () => {
      icon.classList.toggle("smp_active");
      section.classList.toggle("smp_active");
      notice.classList.toggle("smp_active");
    });
  };

  const dialogHeight = function changeDialogAreaHeight() {
    const msgInput = document.querySelector(".smpChat__dialog__msgTextArea");
    const footer = document.querySelector(".smpChat__dialog__footer");
    const chatView = document.querySelector(".smpChat__dialog__chatView");

    const applyDialogHeight = (e) => {
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
      //console.log("currentHeight:", currentHeight);
      // console.log("chatViewHeight", chatViewHeight);
      // console.log("inputHeight:", inputHeight);
      // console.log("e.target.offsetHeigh:", e.target.offsetHeight);
      // console.log("msgInput.scrollHeight:", msgInput.scrollHeight);
      textHeight(msgInput);
    };

    msgInput.addEventListener("input", applyDialogHeight, false);
  };

  const textLine = function lineBreakTextArea() {
    const msgInput = document.querySelector(".smpChat__dialog__msgTextArea");
    const inputLineHeight = styleValue(msgInput, "line-height");

    const applyLineBreakHeight = (e) => {
      if (e.ctrlKey && e.key === "Enter") {
        const footer = document.querySelector(".smpChat__dialog__footer");
        const chatView = document.querySelector(".smpChat__dialog__chatView");
        const lineHeight = removeStr(inputLineHeight);
        const msgInputHeight = e.target.offsetHeight;
        const footerHeight = footer.offsetHeight;
        const chatViewHeight = chatView.offsetHeight;
        const cursorPosition = e.target.selectionStart;
        const textLineBreak = `${e.target.value}\r\n`;

        e.target.value = textLineBreak;

        if (cursorPosition > 0) {
          msgInput.style.height = `${msgInputHeight + lineHeight}px`;
          footer.style.height = `${footerHeight + lineHeight}px`;
          chatView.style.height = `${chatViewHeight - lineHeight}px`;
        }
        scrollBottom(chatView);
        textHeight(msgInput);
        textFocus(msgInput);
      }
    };
    msgInput.addEventListener("keydown", applyLineBreakHeight, false);
  };

  const styleValue = function getStyleValue(dom, propName) {
    const style = window.getComputedStyle(dom);
    return style.getPropertyValue(propName);
  };

  const removeStr = function removeStringWord(str) {
    return Number(str.replace(/[^0-9]/g, ""));
  };

  const textHeight = function limitTextAreaHeight(dom) {
    const maxHeight = removeStr(styleValue(dom, "max-height"));
    if (dom.offsetHeight >= maxHeight) {
      dom.style.overflowY = "scroll";
    } else {
      dom.style.overflowY = "hidden";
    }
  };

  const textFocus = function focusTextAreaCursor(input) {
    input.blur();
    input.focus();
  };

  const scrollBottom = function fixScrollBottom(dom) {
    dom.scrollTop = dom.scrollHeight;
  };

  const serverBtn = function ctrlServerConnect(socket, type, state) {
    const name = type === "manager" ? "connect" : "dialog";
    const checkbox = document.querySelector(`.smpChat__${name}__switchInput`);
    if (!checkbox) return;

    checkbox.addEventListener("click", async () => {
      if (!checkbox.checked) {
        socketSend(socket).serverSwitch("off");
        ctrlServer(socket).off();
        return;
      }

      ctrlServer(socket).on();
      socketSend(socket).serverSwitch("on");
    });

    if (state === "on") {
      ctrlServer(socket).on();
      socketSend(socket).serverSwitch("on");
    }
  };

  const ctrlServer = function turnOnOffServer(socket) {
    return {
      on: () => socket.open(),
      off: () => socket.close(),
    };
  };

  const switchState = function changeSwitchState(state) {
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
