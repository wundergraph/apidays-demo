import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';
import fs from 'fs';
import path from 'path';

const typeDefs = gql(fs.readFileSync(path.resolve(__dirname, 'schema.graphql'), 'utf-8'));

// In-memory storage: sessionId -> list of ratings
const ratings = new Map<string, number[]>();

const resolvers = {
  Mutation: {
    rateSession: (_: any, { sessionId, rating }: { sessionId: string; rating: number }) => {
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      if (!ratings.has(sessionId)) {
        ratings.set(sessionId, []);
      }
      ratings.get(sessionId)!.push(rating);

      return { __typename: 'Session', id: sessionId };
    },
  },
  Session: {
    __resolveReference(ref: { id: string }) {
      return { __typename: 'Session', id: ref.id };
    },
    averageRating(session: { id: string }) {
      const sessionRatings = ratings.get(session.id);
      if (!sessionRatings || sessionRatings.length === 0) return null;
      
      const sum = sessionRatings.reduce((a, b) => a + b, 0);
      return sum / sessionRatings.length;
    },
    ratingsCount(session: { id: string }) {
      const sessionRatings = ratings.get(session.id);
      return sessionRatings ? sessionRatings.length : 0;
    },
  },
};

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
});

startStandaloneServer(server, {
  listen: { port: 5004 },
}).then(({ url }) => {
  console.log(`Ratings subgraph ready at ${url}`);
});

