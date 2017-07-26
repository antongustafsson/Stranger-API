# Stranger-API
An API for the Swedish chat app

## Dependencies
* [request](https://www.npmjs.com/package/request) – `npm install request`
* [uuid](https://www.npmjs.com/package/uuid) – `npm install uuid`
* [websocket](https://www.npmjs.com/package/websocket) – `npm install websocket`

## Quickstart
Require the module
```javascript
var ChatClient = require('./ChatClient')
```

Instantiate the client
```javascript
var client = new ChatClient()
```
***
## ChatClient-class
The ChatClient is an object which is used for communicating with the partner
### Properties
* `userInfo: Object` – User information about the client, reported by backend
* `partnerInfo: Object` – User information about the partner, reported by backend
* `channel: String` – Channel identifier provided by backend

### Methods
* `on(event: String, handler: (event: ChatEvent | MessageChatEvent | ImageChatEvent) => Any) -> Void` – used for registering an event handler
* `sendImage(url: String) -> Void` – send an image to the partner. The `url`-parameter should be a base64-data-URI-string of a JPEG-formatted image.
* `requestImage( Void )` – request a image from the partner. This will update the partner's user interface, informing about the request.
* `reportTyping( Void ) -> Void` – inform the partner that the client is typing, by updating the partner's user interface.
* `reportIdle( Void ) -> Void` – inform the partner that the client has stopped typing, by updating the partner's user interface.
* `send(text: String) -> Void` – send a string as a text-message to the partner.
* `Connect( Void ) -> Void` – Invoking this method will start searching for a chat-room and eventually start a chat session.

### Events
* `connected: ChatEvent` – client has connected to a partner
* `typing: ChatEvent` – client's partner started typing
* `idle: ChatEvent` – client's partner stopped typing
* `message: MessageChatEvent` – client's partner sent a message
* `imagerequest: ChatEvent` – client recieved a image-request from it's partner
* `image: ImageChatEvent` – client recieved a image from it's partner
* `left: ChatEvent` – client's partner left the chat-room
* `closed: ChatEvent` – connection to the server closed
***
## ChatEvent-class
### Properties
* `sender: String` – a unique identifier, as a string, which represents the sender of the event.
* `client: ChatClient` – the client the event was fired by.
***
## MessageChatEvent-class
### Properties
* `sender: String` – inherited from ChatEvent.
* `client: ChatClient` – inherited from ChatEvent.
* `messageText: String` – a string containing the message.
***
## ImageChatEvent-class
### Properties
* `sender: String` – inherited from ChatEvent.
* `client: ChatClient` – inherited from ChatEvent.
* `imageUrl: String` – a string containing the absolute URL for the image resource.
