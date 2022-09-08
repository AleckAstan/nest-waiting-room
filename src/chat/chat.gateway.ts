import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Iidentity } from './interfaces/identity.interface';
import { Imessage } from './interfaces/message.interface';
@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server;
  users: string[] = [];
  socketId = '';
  correspondanceTable = {};
  async handleConnection(socket) {
    this.socketId = socket.id;
    this.server.to(this.socketId).emit('connected', `${this.socketId}`);
    this.correspondanceTable[this.socketId] = '';
    console.log(this.correspondanceTable, 'connect');
    // A client has connected
    // Notify connected clients of current users
    this.server.emit('users', this.users);
  }
  async handleDisconnect(socket) {
    // A client has disconnected
    this.socketId = socket.id;
    const index = this.users.indexOf(this.correspondanceTable[socket.id]);
    if (index > -1) {
      this.users.splice(index, 1);
    }
    delete this.correspondanceTable[socket.id];

    this.server.emit('users', this.users);
  }

  getObjKey(obj, value) {
    return Object.keys(obj).find((key) => obj[key] === value);
  }

  @SubscribeMessage('chat')
  async onChat(client, message: Imessage) {
    console.log(message);
    const key = this.getObjKey(this.correspondanceTable, message.receiver);
    console.log('key', key);

    this.server.to(key).emit('chat', message.message);
    // client.broadcast.emit('chat', message);
  }

  @SubscribeMessage('identity')
  async getIdentity(client, identity: Iidentity) {
    if (!this.users.includes(identity.name)) {
      this.users.push(identity.name);
    }
    this.server.emit('users', this.users);
    this.correspondanceTable[identity.id] = identity.name;
    console.log('updated users', this.correspondanceTable);
  }
}
