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

function levenshtein(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix = new Array(bn + 1);
  for (let i = 0; i <= bn; ++i) {
    let row = (matrix[i] = new Array(an + 1));
    row[0] = i;
  }
  const firstRow = matrix[0];
  for (let j = 1; j <= an; ++j) {
    firstRow[j] = j;
  }
  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1], // substitution
          matrix[i][j - 1], // insertion
          matrix[i - 1][j] // deletion
        ) + 1;
      }
    }
  }
  return matrix[bn][an];
}

function isMatch(text: string | undefined | null, search: string): boolean {
  if (!text) return false;
  return text.toLowerCase().includes(search.toLowerCase());
}

const typeDefs = gql(fs.readFileSync(path.resolve(__dirname, 'schema.graphql'), 'utf-8'));

const resolvers = {
  Query: {
    speakers: (_: any, args: { name?: string, search?: string }) => {
        if (args.name) {
            return speakers.filter((s: any) => s.name?.toLowerCase().includes(args.name!.toLowerCase()));
        }
        if (args.search) {
             return speakers.filter((s: any) => {
                 const nameMatch = isMatch(s.name, args.search!);
                 const companyMatch = isMatch(s.company, args.search!);
                 const jobTitleMatch = isMatch(s.jobtitle, args.search!); // Note: check data field name vs schema
                 return nameMatch || companyMatch || jobTitleMatch;
             });
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

