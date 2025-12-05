import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';
import fs from 'fs';
import path from 'path';

const dataPath = path.resolve(__dirname, '../../db/data.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');
const data = JSON.parse(rawData);

// Extract unique locations
const locationsMap = new Map();
if (data.sessions) {
    data.sessions.forEach((session: any) => {
        if (session.places) {
            session.places.forEach((place: any) => {
                // Use ID as key to deduplicate
                if (!locationsMap.has(place.id)) {
                    locationsMap.set(place.id, place);
                }
            });
        }
    });
}
const locations = Array.from(locationsMap.values());

const typeDefs = gql(fs.readFileSync(path.resolve(__dirname, 'schema.graphql'), 'utf-8'));

const resolvers = {
  Query: {
    locations: () => locations,
    location: (_: any, { id }: { id: string }) => locations.find((l: any) => l.id == id),
  },
  Location: {
    __resolveReference(ref: { id: string }) {
      return locations.find((l: any) => l.id == ref.id);
    },
  },
};

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
});

startStandaloneServer(server, {
  listen: { port: 5001 },
}).then(({ url }) => {
  console.log(`Locations subgraph ready at ${url}`);
});

