import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { buildSubgraphSchema } from '@apollo/subgraph';
import gql from 'graphql-tag';
import fs from 'fs';
import path from 'path';

const dataPath = path.resolve(__dirname, '../../db/data.json');
const rawData = fs.readFileSync(dataPath, 'utf-8');
const data = JSON.parse(rawData);
const sessions = data.sessions || [];

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

function isMatch(text: string, search: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  const lowerSearch = search.toLowerCase();
  
  // 1. Exact substring
  if (lowerText.includes(lowerSearch)) return true;

  // 2. Fuzzy match
  const maxTotalDistance = Math.max(5, Math.floor(lowerSearch.length * 0.4));
  if (levenshtein(lowerSearch, lowerText) <= maxTotalDistance) return true;

  // 3. Word match
  const words = lowerText.split(/[\s-]+/);
  return words.some(word => {
     const allowed = word.length < 4 ? 0 : Math.min(3, Math.ceil(word.length * 0.4));
     return levenshtein(lowerSearch, word) <= allowed;
  });
}

const typeDefs = gql(fs.readFileSync(path.resolve(__dirname, 'schema.graphql'), 'utf-8'));

const resolvers = {
  Query: {
    sessions: (_: any, args: { id?: string, title?: string, tag?: string, search?: string }) => {
      return sessions.filter((s: any) => {
        if (args.id && s.id != args.id) return false;
        
        if (args.title && !isMatch(s.title, args.title)) return false;
        
        if (args.search) {
            const titleMatch = isMatch(s.title, args.search);
            const descMatch = isMatch(s.description, args.search);
            const tagMatch = s.tags ? s.tags.some((t: any) => isMatch(t.title, args.search)) : false;
            if (!titleMatch && !descMatch && !tagMatch) return false;
        }

        if (args.tag) {
            if (!s.tags) return false;
            const tagMatch = s.tags.some((t: any) => t.title?.toLowerCase().includes(args.tag!.toLowerCase()));
            if (!tagMatch) return false;
        }
        return true;
      });
    },
    session: (_: any, { id }: { id: string }) => sessions.find((s: any) => s.id == id),
  },
  Session: {
    __resolveReference(ref: { id: string }) {
      return sessions.find((s: any) => s.id == ref.id);
    },
    dateStart(session: any) {
      return session.date_start;
    },
    dateEnd(session: any) {
      return session.date_end;
    },
    tags(session: any) {
        if (!session.tags) return [];
        return session.tags.map((t: any) => t.title);
    },
    speakers(session: any) {
      if (!session.speakers) return [];
      return session.speakers.map((s: any) => ({ __typename: 'Speaker', id: s.id, name: s.name }));
    },
    locations(session: any) {
        if (!session.places) return [];
        // Map 'places' in JSON to 'locations' in GraphQL
        return session.places.map((p: any) => ({ __typename: 'Location', id: p.id }));
    }
  },
  Speaker: {
    sessions(speaker: { id: string }) {
      return sessions.filter((s: any) => s.speakers && s.speakers.some((sp: any) => sp.id == speaker.id));
    },
    locations(speaker: { id: string }) {
       const speakerSessions = sessions.filter((s: any) => s.speakers && s.speakers.some((sp: any) => sp.id == speaker.id));
       const locationsMap = new Map();
       speakerSessions.forEach((s: any) => {
           if (s.places) {
               s.places.forEach((p: any) => {
                   if (!locationsMap.has(p.id)) {
                       locationsMap.set(p.id, { __typename: 'Location', id: p.id });
                   }
               });
           }
       });
       return Array.from(locationsMap.values());
    }
  },
  Location: {
    sessions(location: { id: string }) {
      return sessions.filter((s: any) => s.places && s.places.some((p: any) => p.id == location.id));
    },
    speakers(location: { id: string }) {
       const locationSessions = sessions.filter((s: any) => s.places && s.places.some((p: any) => p.id == location.id));
       const speakersMap = new Map();
       locationSessions.forEach((s: any) => {
           if (s.speakers) {
               s.speakers.forEach((sp: any) => {
                   if (!speakersMap.has(sp.id)) {
                       speakersMap.set(sp.id, { __typename: 'Speaker', id: sp.id, name: sp.name });
                   }
               });
           }
       });
       return Array.from(speakersMap.values());
    }
  }
};

const server = new ApolloServer({
  schema: buildSubgraphSchema({ typeDefs, resolvers }),
});

startStandaloneServer(server, {
  listen: { port: 5003 },
}).then(({ url }) => {
  console.log(`Sessions subgraph ready at ${url}`);
});
