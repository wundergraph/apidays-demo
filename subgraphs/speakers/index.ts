import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';
import fs from 'fs';
import path from 'path';

const dataPath = path.resolve(__dirname, '../../db/data.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');
const data = JSON.parse(rawData);

// Extract unique speakers
const speakersMap = new Map();
if (data.sessions) {
    data.sessions.forEach((session: any) => {
        if (session.speakers) {
            session.speakers.forEach((speaker: any) => {
                if (!speakersMap.has(speaker.id)) {
                    speakersMap.set(speaker.id, speaker);
                }
            });
        }
    });
}
const speakers = Array.from(speakersMap.values());

const typeDefs = gql(fs.readFileSync(path.resolve(__dirname, 'schema.graphql'), 'utf-8'));

const resolvers = {
  Query: {
    speakers: (_: any, args: { name?: string }) => {
        if (args.name) {
            return speakers.filter((s: any) => s.name?.toLowerCase().includes(args.name!.toLowerCase()));
        }
        return speakers;
    },
    speaker: (_: any, { id }: { id: string }) => speakers.find((s: any) => s.id == id),
  },
  Speaker: {
    __resolveReference(ref: { id: string }) {
      return speakers.find((s: any) => s.id == ref.id);
    },
  },
};

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
});

startStandaloneServer(server, {
  listen: { port: 5002 },
}).then(({ url }) => {
  console.log(`Speakers subgraph ready at ${url}`);
});

