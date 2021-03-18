const AWS = require("aws-sdk");
const mongoose = require("mongoose");
const https = require("https");
const sslAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 64,
  rejectUnauthorized: false,
});
sslAgent.setMaxListeners(0);
AWS.config.update({
  httpOptions: {
    agent: sslAgent,
  },
});

mongoose
  .connect(process.env.MONGODB_STRING, {
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => console.log("Connected to MongoDB..."))
  .catch((err) => console.log(err));

const chatSchema = new mongoose.Schema({
  connectionId: { type: String },
});

const Chat = mongoose.model("Chat", chatSchema);

exports.handler = async (event) => {
  const eventType = event.requestContext.eventType;
  const connectionId = event.requestContext.connectionId;

  switch (eventType) {
    case "CONNECT":
      break;

    case "DISCONNECT":
      await deleteConnection(connectionId);

    case "MESSAGE":
      await processMessage(
        connectionId,
        JSON.parse(event.body),
        event.requestContext
      );
      break;

    default:
      console.log("Error: unknown event type " + eventType);
  }

  const response = {
    statusCode: 200,
  };

  return response;
};

async function processMessage(connectionId, body, request) {
  const message = body;

  const action = message.action;
  delete message.action;

  switch (action) {
    case "message":
      await sendMessageToRoom(message, request);

      break;
    case "init":
      await initConnection(connectionId);

      break;
    default:
      console.log("Error: unknown action " + action);
  }
}

async function initConnection(connectionId) {
  const id = new Chat({ connectionId });
  await id.save();
}

async function sendMessageToRoom(message, request) {
  const apiGatewayApi = new AWS.ApiGatewayManagementApi({
    endpoint: request.domainName + "/" + request.stage,
  });

  const connectionsData = await Chat.find();

  connectionsData.map(async ({ connectionId }) => {
    await sendMessagesToConnection(connectionId, message, apiGatewayApi);
  });
}

async function sendMessagesToConnection(connectionId, message, apiGatewayApi) {
  try {
    await apiGatewayApi
      .postToConnection({
        ConnectionId: connectionId,
        Data: JSON.stringify(message),
      })
      .promise();
  } catch (err) {
    console.log(err);
  }
}

async function deleteConnection(connectionId) {
  await Chat.findOneAndDelete({
    connectionId,
  });
}
