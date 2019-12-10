const { ApolloServer, gql, PubSub, withFilter } = require('apollo-server');

const typeDefs = `
  type Query {
    getNums: [Int!]!
  }
  type Mutation {
    addNum: [Int!]!
  }
  type Subscription {
    newNum: Int!
  }
`;

let score = 4;
const nums = [0, 1, 2, 3];
const pubsub = new PubSub();

const NEW_NUM = "NEW_NUM";


const resolvers = {
  Query: {
    getNums: () => nums
  },
  Mutation: {
    addNum: () => {
      nums.push(score);
      pubsub.publish(NEW_NUM, { newNum: score });
      score += 1;
      return nums;
    }
  },
  Subscription: {
    newNum: {
      subscribe: () => {
        return pubsub.asyncIterator(NEW_NUM);
      }
    }
  }
};

const server = new ApolloServer({ typeDefs, resolvers })
server.listen().then(({ url }) => {
  console.log(`Server is ready at ${url}`)
});