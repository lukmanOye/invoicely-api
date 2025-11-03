const { Client, Databases, Users, Messaging, ID, Query } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY); // For server-side operations

const databases = new Databases(client);
const users = new Users(client);
const messaging = new Messaging(client);

module.exports = { client, databases, users, messaging, ID, Query };