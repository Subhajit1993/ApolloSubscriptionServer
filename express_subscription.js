var { gql, makeExecutableSchema, PubSub} = require('apollo-server');
const {ApolloServer} = require("apollo-server-express")
var express = require('express')
const { execute, subscribe } = require('graphql');
const { createServer } = require('http');


var pubsub = new PubSub();



const PORT = 4000;

const app = express();

var typeDefs = gql`
  type Query {
    hello(name: String): String
    user: User
  }
  type User {
    id: ID!
    username: String
    firstLetterOfUsername: String
  }
  input UserInfo {
    username: String!
    password: String!
    age: Int
  }
  type Mutation {
    register(userInfo: UserInfo!): String!
    login(userInfo: UserInfo!): String!
  }
  type Subscription {
    newUser: String!
  }
`;

var NEW_USER = "NEW_USER";

var resolvers = {
    Subscription: {
      newUser: {
        subscribe: (_, __, { pubsub }) => pubsub.asyncIterator(NEW_USER)
      }
    },
    User: {
      firstLetterOfUsername: parent => {
        return parent.username ? parent.username[0] : null;
      }
      // username: parent => { return parent.username;
      // }
    },
    Query: {
      hello: (parent, { name }, {pubsub}) => {
        pubsub.publish(NEW_USER, {
          newUser: "This can be any object"
        });
        return `hey ${name}`;
      },
      user: () => ({
        id: 1,
        username: "tom"
      })
    },
    Mutation: {
      login: async (parent, { userInfo: { username } }, context) => {
        // check the password
        // await checkPassword(password);
        return username;
      },
      register: (_, { userInfo: { username } }, { pubsub }) => {
        const user = {
          id: 1,
          username
        };
  
        pubsub.publish(NEW_USER, {
          newUser: user
        });
  
        return {
          user
        };
      }
    }
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});


const server = new ApolloServer({
  schema,
  context: ({req}) => ({
     pubsub
  }),
});

server.applyMiddleware({
  app
});

const httpServer = createServer(app);
server.installSubscriptionHandlers(httpServer);

httpServer.listen({ port: PORT }, () => {
  console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
  console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}`);
});
