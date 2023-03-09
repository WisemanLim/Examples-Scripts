const monitor = {
  socketIO: null,
  nodeServerUrl: "http://localhost:3000",

  path: "",
  referrer: "",
  ipAddress: "",
  country: "",
  browserInfo: "",

  localStorageKey: "chatWidgetKey",
  chatUser: null,
  messages: [],

  init: function () {
    this.socketIO = io(this.nodeServerUrl);

    this.path = window.location.href;
    this.referrer = document.referrer;

    if (localStorage.getItem(this.localStorageKey) == null) {
      // chat is not started.
      this.ipAddress = localStorage.getItem(this.localStorageKey);
    } else {
      // chat is started.
      document.getElementById("form-initialize-chat-widget").style.display = "none";
      this.getUser();
    }
  },

  renderMessage: function (message) {
    var html = "";

    const dateObj = new Date(message.createdAt);
    const createdAt = dateObj.getHours() + ":" + dateObj.getMinutes() + ":" + dateObj.getSeconds();

    if (message.me) {
      html += `<div class="row msg_container base_sent">
      <div class="col-md-8">
      <div class="messages msg_send">
      <p>` + message.message + `</p>
      <time datetime="` + createdAt + `">` + createdAt + `</time>
      </div>
      </div>
      </div>`;
    } else {
      html += `<div class="row msg_container base_receive">
      <div class="col-md-8">
      <div class="messages msg_receive">
      <p>` + message.message + `</p>
      <time datetime="` + createdAt + `">` + createdAt + `</time>
      </div>
      </div>
      </div>`;
    }

    $("#chat-widget .panel-body").append(html);
  },

  sendMessage: function (form) {

    if (localStorage.getItem(this.localStorageKey) == null) {
      return false;
    }

    this.messages.push({
      "me": true,
      "message": form.message.value,
      "createdAt": new Date().getTime(),
    });

    this.socketIO.emit("new_message", {
      "accessToken": localStorage.getItem(this.localStorageKey),
      "message": form.message.value,
      "createdAt": new Date().getTime(),
    });

    this.renderMessage({
      "me": true,
      "message": form.message.value,
      "createdAt": new Date().getTime(),
    });

    form.message.value = "";
    return false;
  },

  getUser: function () {
    const self = this;

    const ajax = new XMLHttpRequest();
    ajax.open("POST", this.nodeServerUrl + "/get-user", true);

    ajax.onreadystatechange = function () {
      if (this.readyState == 4) {
        if (this.status == 200) {
          const data = JSON.parse(this.responseText);
          // console.log(data);

          if (data.length > 0) {
            self.chatUser = data[0];
            self.getChatWithAdmin();
          }
        }

        if (this.status == 500) {
          console.log(this.responseText);
        }
      }
    };

    const formData = new FormData();
    formData.append("accessToken", localStorage.getItem(this.localStorageKey));
    ajax.send(formData);
  },

  getChatWithAdmin: function () {
    const self = this;

    const ajax = new XMLHttpRequest();
    ajax.open("POST", this.nodeServerUrl + "/get-chat-with-admin", true);

    ajax.onreadystatechange = function () {
      if (this.readyState == 4) {
        if (this.status == 200) {
          const data = JSON.parse(this.responseText);
          // console.log(data);

          for (var i = 0; i < data.length; i++) {
            self.renderMessage(data[i]);
          }

          if (self.chatUser != null) {
            const form = document.getElementById("form-initialize-chat-widget");
            form.name.value = self.chatUser.name;
            form.email.value = self.chatUser.email;
            
            self.initializeChat(form);
          }
        }

        if (this.status == 500) {
          console.log(this.responseText);
        }
      }
    };

    const formData = new FormData();
    formData.append("accessToken", localStorage.getItem(this.localStorageKey));
    ajax.send(formData);          
  },

  initializeChat: function (form) {
    const self = this;

    form.submit.innerHTML = "Initiating...";
    form.submit.setAttribute("disabled", "disabled");
    
    this.getIpAddress(function () {
      self.socketIO.emit("user_joined", {
        "title": document.querySelector("title").innerHTML,
        "path": self.path,
        "referrer": self.referrer,
        "ipAddress": self.ipAddress,
        "country": self.country,
        "browserInfo": self.browserInfo,
        "name": form.name.value,
        "email": form.email.value,
      });

      self.socketIO.on("user_joined", function (data) {
        localStorage.setItem(self.localStorageKey, data);

        form.submit.removeAttribute("disabled");
        form.submit.innerHTML = "Start chat";

        form.name.value = "";
        form.email.value = "";
        form.style.display = "none";
      });

      self.socketIO.on("user_new_message", function (data) {
        // slide up the chat widget
        const selector = document.querySelector("#chat-widget form input.message");
        self.onChatInputFocus(selector);
        self.renderMessage(data);
      });
    });

    return false;
  },

  getIpAddress: function (callback) {
    var ajax = new XMLHttpRequest();
    ajax.open("GET", "https://www.cloudflare.com/cdn-cgi/trace", true);

    const self = this;

    ajax.onreadystatechange = function () {
      if (this.readyState == 4) {
        if (this.status == 200) {
          // const response = JSON.parse(this.responseText);
          const response = this.responseText;
          // console.log(response);

          const partsIp = response.split("ip=");
          if (partsIp.length > 1) {
            const partsTs = partsIp[1].split("ts");
            if (partsTs.length > 0) {
              self.ipAddress = partsTs[0].trim();
            }
          }

          const partsUag = response.split("uag=");
          if (partsUag.length > 1) {
            const partsColo = partsUag[1].split("colo");
            if (partsColo.length > 0) {
              self.browserInfo = partsColo[0].trim();
            }
          }

          const partsLoc = response.split("loc=");
          if (partsLoc.length > 1) {
            const partsTls = partsLoc[1].split("tls");
            if (partsTls.length > 0) {
              self.country = partsTls[0].trim();
            }
          }

          callback();
        }

        if (this.status == 500) {
          console.log("Error: " + this.responseText);
          callback();
        }
      }
    };

    ajax.send();
  },

  onChatInputFocus: function (self) {
    var $this = $(self);
    if ($("#minim_chat_window").hasClass("panel-collapsed")) {
      $this.parents(".panel").find(".panel-body").slideDown();
      $("#minim_chat_window").removeClass("panel-collapsed");
      $("#minim_chat_window").removeClass("fa-plus").addClass("fa-minus");      
    }
  },

  onIconMinimClick: function (self) {
    var $this = $(self);
    if (!$this.hasClass("panel-collapsed")) {
      $this.parents(".panel").find(".panel-body").slideUp();
      $this.addClass("panel-collapsed");
      $this.removeClass("fa-minus").addClass("fa-plus");
    } else {
      $this.parents(".panel").find(".panel-body").slideDown();
      $this.removeClass("panel-collapsed");
      $this.removeClass("fa-plus").addClass("fa-minus");
    }
  },
}