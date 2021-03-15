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
        static useSocketArea(socket, domName) {
          socket.on("connect", () => {
            console.log("server connect!!");
          });
          socket.on("initChat", (data) => {
            divideUserType(data, domName);
          });

          errSocketArea();

          function ctrlManagerChat() {
            drawManagerHTML();
            toggleChatView();
          }
          function divideUserType(data, domName) {
            if (!domName)
              throw new SmpChatError("채팅이 그려질 domId를 설정해주세요.");
            // const state = false;
            data.userType === "manager" ? ctrlManagerChat() : ctrlClientChat();
          }
          function drawManagerHTML() {
            const smpChatLayout = document.querySelector(`${domName}`);
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
            const dialogChatMsgInput = document.createElement("input");
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
            dialogChatFooter.appendChild(dialogChatMsgInput);
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
            closeImg.className =
              "smpChat__section__close smpChat__userSelect__none";
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
            dialogChatAddInput.className = "smpChat__dialog__addInput";
            dialogChatAddLabel.className = "smpChat__dialog__addLabel";
            dialogChatMsgInput.className = "smpChat__dialog__msgInput";
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
              "http://localhost:5000/chat/image?name=chat.png"
            );
            smpChatIconImg.setAttribute("alt", "채팅아이콘");
            closeImg.setAttribute(
              "src",
              "http://localhost:5000/chat/image?name=close.png"
            );
            closeImg.setAttribute("alt", "채팅창닫기 아이콘");

            /* connect */
            connSwitchLabel.htmlFor = "smp_chat_switch";
            connSwitchInput.type = "checkbox";
            connSwitchInput.name = "smp_chat_switch";
            connSwitchInput.id = "smp_chat_switch";

            /* dialog */
            dialogChatAddImg.setAttribute(
              "src",
              "http://localhost:5000/chat/image?name=plus.png"
            );
            dialogChatMsgSend.setAttribute(
              "src",
              "http://localhost:5000/chat/image?name=sendBtn.png"
            );
            dialogChatAddLabel.htmlFor = "smp_chat_addImg";
            dialogChatAddInput.type = "file";
            dialogChatAddInput.accept = "image/gif, image/jpeg, image/png";
            dialogChatAddInput.id = "smp_chat_addImg";
            dialogChatAddInput.name = "smp_chat_addImg";
          }

          function toggleChatView() {
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
          }
          function errSocketArea() {
            socket.on("connect_error", (err) => console.log(err));
            socket.on("connect_failed", (err) => console.log(err));
            socket.on("disconnect", (err) => console.log(err));
            socket.on("error", (err) => console.log(err.content));
          }
          
        }
      },
    },
  };
  w.smpChat = smpChat;
})(window);
