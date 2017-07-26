var request = require('request')
var uuid = require('uuid/v1')
var WebSocketClient = require('websocket').client;

class ChatEvent {
  constructor(sender, client) {
    this.sender = sender
    this.client = client
  }
}

class MessageChatEvent extends ChatEvent {
  constructor(messageText, sender, client) {
    super(sender, client)
    this.messageText = messageText
  }
}

class ImageChatEvent extends ChatEvent {
  constructor(imageUrl, sender, client) {
    super(sender, client)
    this.imageUrl = imageUrl
  }
}

class User {
  constructor() {

  }
}

class ChatClient {
  constructor(userId) {
    var that = this
    this.userId = userId || uuid()
    this.sessionId = null
    this.userInfo = {}
    this.partnerInfo = {}
    this.channel = null
    this.wsClient = new WebSocketClient();
    this.wsConnection = null
    this.eventHandlers = {
      'connected': [],
      'typing': [],
      'message': [],
      'idle': [],
      'imagerequest': [],
      'image': [],
      'left': [],
      'closed': []
    }
    this.wsClient.on('connect', function(connection) {
      that.wsConnection = connection
      setInterval(() => {
        connection.sendUTF('2')
      }, 25 * 1000)
      connection.sendUTF('2probe')
      connection.on('message', function(message) {
        switch (message.utf8Data) {
          case '3probe':
            connection.sendUTF('5')
            connection.sendUTF('42["wantpartner"]')
            break;
          case '3':
            break;
          default:
            var payload = message.utf8Data.substring(2, message.utf8Data.length)
            var messageArray
            try{
              messageArray = JSON.parse(payload)
            }catch(e){
              console.log(e);
            }
            if(messageArray){
              that.handleMessage(messageArray)
            }
        }
      })

      connection.on('close', function() {
        that.fireEvent('closed', new ChatEvent(that.partnerInfo.userId, that))
      })
    })
  }

  on(event, handler){
    this.eventHandlers[event].push(handler)
  }

  fireEvent(event, params){
    for (var i = 0; i < this.eventHandlers[event].length; i++) {
      this.eventHandlers[event][i](params)
    }
  }

  handleMessage(message){
    if(message[0] == 'partnerfound'){
      this.partnerInfo = message[1].partner
      this.channel = message[1].channel
      this.wsConnection.sendUTF(`42["partneraccept",{"channel":"${this.channel}"}]`)
    }else if(message[0] == 'partneraccept'){
      this.userInfo = message[1].users[0]
      this.partnerInfo = message[1].users[1]
      this.channel = message[1].channel
      this.fireEvent('connected', new ChatEvent(this.partnerInfo.userId, this))
    }else if(message[0] == 'typing'){
      this.fireEvent('typing', new ChatEvent(message[1].sender, this))
    }else if(message[0] == 'message'){
      this.fireEvent('message', new MessageChatEvent(message[1].message, message[1].sender, this))
    }else if(message[0] == 'idle'){
      this.fireEvent('idle', new ChatEvent(message[1].sender, this))
    }else if(message[0] == 'partnerleft'){
      this.fireEvent('left', new ChatEvent(message[1].userId, this))
    }else if(message[0] == 'requestimage'){
      this.fireEvent('imagerequest', new ChatEvent(this.partnerInfo.userId, this))
    }else if(message[0] == 'image'){
      this.fireEvent('image', new ImageChatEvent(message[1].url, message[1].sender, this))
    }else if(message[0] == 'roomData'){

    }else{
      console.log(JSON.stringify(message));
    }
  }

  sendImage(url){
    if(this.wsConnection){
      this.wsConnection.sendUTF(`42["image",{"url":"${url}","channel":"${this.channel}"}]`)
    }
  }

  requestImage(){
    if(this.wsConnection){
      this.wsConnection.sendUTF('42["requestimage"]')
    }
  }

  reportTyping(){
    if(this.wsConnection){
      this.wsConnection.sendUTF('42["typing"]')
    }
  }

  reportIdle(){
    if(this.wsConnection){
      this.wsConnection.sendUTF('42["idle"]')
    }
  }

  send(text){
    if(this.wsConnection){
      this.wsConnection.sendUTF(`42["message",{"message":"${text}","to":""}]`)
    }
  }

  requestSessionId(callback){
    var that = this
    return new Promise((resolve, reject) => {
      request(`https://stranger.se/socket.io/?lang=sv&userId=${this.userId}&EIO=3&transport=polling`, (error, response, body) => {
        if(error){
          reject(error)
        }
        var payload = body.substring(5, body.length)
        var responseObject
        try{
          responseObject = JSON.parse(payload)
        }catch(e){
          reject(e)
        }
        if(responseObject['sid'] != undefined){
          var sid = responseObject['sid']
          resolve(sid)
          that.sessionId = sid
        }else{
          reject()
        }
      })
    })
  }

  register(){
    var that = this
    return new Promise((resolve, reject) => {
      request(`https://stranger.se/socket.io/?lang=sv&userId=${this.userId}&EIO=3&transport=polling&sid=${this.sessionId}`, (error, response, body) => {
        if(error){
          reject(error)
        }
        var payload = body.substring(12, body.length)
        var responseObject
        try{
          responseObject = JSON.parse(payload)
        }catch(e){
          reject(e)
        }
        if(responseObject[0] == 'connected'){
          that.userInfo = responseObject[1].user
          resolve(that.userInfo)
          that.wsClient.connect(`wss://stranger.se/socket.io/?lang=sv&userId=${this.userId}&EIO=3&transport=websocket&sid=${this.sessionId}`)
        }
      })
    })
  }

  Connect(){
    this.requestSessionId().then(() => {
      this.register()
    })
  }
}

module.exports = ChatClient