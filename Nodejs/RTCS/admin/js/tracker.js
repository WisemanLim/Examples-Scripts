const tracker = {
  socketIO: null,
  adminSocketId: 0,
  nodeServerUrl: "http://localhost:3000",

  consolelog: function (data) {
    let html = document.getElementById("consolelog").innerHTML;
    html += "<br>" + data;
    document.getElementById("consolelog").innerHTML = html;
  },

  users: [],
  userObj: null,
  audio: null,

  init: function () {
    const self = this;

    this.socketIO = io(this.nodeServerUrl);
    this.audio = new Audio("/new-message.mp3");

    this.socketIO.on("admin_joined", function (data) {
      self.adminSocketId = data;
      // console.log(data);
      // self.consolelog(data);
    });
    this.socketIO.emit("admin_joined", "1");

    var ajax = new XMLHttpRequest();
    ajax.open("POST", this.nodeServerUrl + "/get-all-chat-users", true);

    ajax.onreadystatechange = function () {
      if (this.readyState == 4) {
        if (this.status == 200) {
          const data = JSON.parse(this.responseText);
          // console.log(data);
          // self.consolelog(data.length);

          for (var i = 0; i < data.length; i++) {
            self.renderUser(data[i]);
          }
        }

        if (this.status == 500) {
          console.log(this.responseText);
          // self.consolelog(this.responseText);
        }
      }
    };

    const formData = new FormData();
    formData.append("adminId", document.getElementById("admin-id").value);
    ajax.send(formData);

    this.socketIO.on("user_joined", function (data) {
      self.renderUser(data);
    });

    this.socketIO.on("new_message", function (data) {
      var userObj = null;
      for (var i = 0; i < self.users.length; i++) {
        if (self.users[i].email == data.email) {
          userObj = self.users[i];

          self.users[i].messages.push({
            "me": false,
            "message": data.message,
            "createdAt": new Date().getTime()
          });
          break;
        }
      }

      if (userObj != null) {
        $("#socket-id-" + data.socketID).notify(
          data.message,
          "success"
        );

        self.audio.play();

        // render in modal if currently visible
        self.renderMessage(data);
      }
    });
  },

  renderUser: function (data) {
    const self = this;

    // push in users array if not exists
    var flag = false;
    const userSocketId = data.socketID;

    for (var i = 0; i < self.users.length; i++) {
      if (self.users[i].email == data.email) {
        flag = true;
        
        self.users[i].history.push({
          "path": data.path,
          "title": data.title,
          "referrer": data.referrer,
        });

        self.users[i].path = data.path;
        self.users[i].title = data.title;
        self.users[i].referrer = data.referrer;
        userSocketId = self.users[i].userSocketId;

        break;
      }
    }

    if (!flag) {
      // push in users array
      self.users.push({
        "title": data.title,
        "path": data.path,
        "referrer": data.referrer,
        "ipAddress": data.ipAddress,
        "country": data.country,
        "userSocketId": userSocketId,
        "browserInfo": data.browserInfo,
        "email": data.email,
        "history": [{
          "title": data.title,
          "path": data.path,
          "referrer": data.referrer,
        }],
        "name": data.name,
        "email": data.email,
        "chat_user_ud": data.id,
        "messages": [],
      });
    }

    // prepend it in history if current being viewed by admin
    if (self.userObj != null) {
      if (self.userObj.email == data.email) {
        var html = "";
        html += `<tr>
        <td>` + self.userObj.ipAddress + `</td>
        <td><a href='` + data.referrer + `'>` + data.referrer + `</a></td>
        <td><a href='` + data.path + `'>` + data.title + `</a></td>
        </tr>`;
        $("#historyModel .model-body tbody").prepend(html);
      }
    }

    const usersList = document.getElementById("users-list");
    if (usersList != null) {
      if (flag) {
        document.querySelector("#socket-id-" + userSocketId + ".referrer").innerHTML = data.referrer;
        document.querySelector("#socket-id-" + userSocketId + ".title").innerHTML = data.title;
        // document.querySelector("#socket-id-" + userSocketId + ".path").innerHTML = data.title;
        document.querySelector("#socket-id-" + userSocketId + ".path").innerHTML = data.path;
      } else {
        var html = "";
        html += `<tr id='socket-id-` + data.socketID + `'>
        <td>` + data.ipAddress + `</td>
        <td>` + data.country + `</td>
        <td><a class='referrer' href='` + data.referrer + `'>` + data.referrer + `</a></td>
        <td><a class='path' href='` + data.path + `'>` + data.path + `</a></td>
        <td>` + data.browserInfo + `</td>
        <td style="display: flex;">
        <button type="button" class="btn btn-primary" data-ip-address="` + data.ipAddress + `"
        data-email="`+ data.email + `"
        onclick="tracker.showHistory(this);"
        style="border-top-right-radius: 0px; border-bottom-right-radius: 0px;">History</button>
        <button type="button" class="btn btn-secondary" data-ip-address="` + data.ipAddress + `"
        data-email="`+ data.email + `"
        onclick="tracker.showChat(this);"
        style="border-top-right-radius: 0px; border-bottom-right-radius: 0px;">Chat</button>
        </td>
        </tr>`;

        usersList.innerHTML = html + usersList.innerHTML;
      }
    }
  },

  showHistory: function (self) {
    const ipAddress = self.getAttribute("data-ip-address");
    const email = self.getAttribute("data-email");

    this.userObj = null;
    for (var i = 0; i < this.users.length; i++) {
      if (this.users[i].email == email) {
        this.userObj = this.users[i];
        break;
      }
    }

    if (this.userObj == null) {
      alert("User does not exists.");
      return false;
    }

    const history = this.userObj.history.reverse();
    var html = "";
    for (var i = 0; i < history.length; i++) {
      html += `<tr>
      <td>` + this.userObj.ipAddress + `</td>
      <td><a href='` + history[i].referrer + `'>` + history[i].referrer + `</a></td>
      <td><a href='` + history[i].path + `'>` + history[i].path + `</a></td>
      </tr>`;
    }
    $("#historyModal .modal-body tbody").html(html);
    // document.getElementById("history-list").innerHTML = html;
    $("#historyModal").modal("show");
  },

  showChat: function (self) {
    const selfObj = this;
    const ipAddress = self.getAttribute("data-ip-address");
    const email = self.getAttribute("data-email");

    this.userObj = null;
    for (var i = 0; i < this.users.length; i++) {
      if (this.users[i].email == email) {
        this.userObj = this.users[i];
        break;
      }
    }

    if (this.userObj == null) {
      alert("User does not exists.");
      return false;
    }

    $("#customerSupportChatModal .modal-body").html("Loading...");

    // show messages from database
    var ajax = new XMLHttpRequest();
    ajax.open("POST", this.nodeServerUrl + "/get-users-chat", true);

    ajax.onreadystatechange = function () {
      if (this.readyState == 4) {
        if (this.status == 200) {
          const data = JSON.parse(this.responseText);
          // console.log(data);

          $("#customerSupportChatModal .modal-body").empty();

          for (var i = 0; i < data.length; i++) {
            selfObj.renderMessage(data[i]);
          }
        }

        if (this.status == 500) {
          console.log(this.responseText);
          // self.consolelog(this.responseText);
        }
      }
    };

    const formData = new FormData();
    formData.append("adminId", document.getElementById("admin-id").value);
    formData.append("email", this.userObj.email);
    ajax.send(formData);

    $("#customerSupportChatModal").modal("show");
  },

  renderMessage: function (message) {
    var html = "";
    var createdAt = message.createdAt;

    if (createdAt.toString().length > 8) {
      createdAt = new Date(message.createdAt);
      createdAt = createdAt.getHours() + ":" + createdAt.getMinutes() + ":" + createdAt.getSeconds();
    }

    if (message.me) {
      html += `<div style="text-align: right;">` + message.message + `<div style="font-size: 5px;">` + createdAt + `</div></div>`;
    } else {
      html += `<div style="text-align: left;">` + message.message + `<div style="font-size: 5px;">` + createdAt + `</div></div>`;
    }

    $("#customerSupportChatModal .modal-body").append(html);
  },

  sendMessage: function (form) {
    this.socketIO.emit("user_new_message", {
      "message": form.message.value,
      "socketID": this.userObj.userSocketId,
      "email": this.userObj.email,
      "createdAt": new Date().getTime(),
      "adminId": document.getElementById("admin-id").value,
    });

    for (var i = 0; i < this.users.length; i++) {
      if (this.users[i].email == this.userObj.email) {
        this.users[i].messages.push({
          "me": true,
          "message": form.message.value,
          "createdAt": new Date().getTime(),
        });
        break;
      }
    }

    const dateObj = new Date();
    const createdAt = dateObj.getHours() + ":" + dateObj.getMinutes() + ":" + dateObj.getSeconds();
    // const createdAt = dateObj;

    this.renderMessage({
      "me": true,
      "message": form.message.value,
      "createdAt": createdAt,
    });

    form.message.value = "";
    return false;
  },
}