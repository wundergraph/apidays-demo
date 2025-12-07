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

function isMatch(text: string | undefined | null, search: string): boolean {
  if (!text) return false;
  return text.toLowerCase().includes(search.toLowerCase());
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
            // s.tags is an array of objects like { title: "tag_name", ... }
            const tagMatch = s.tags ? s.tags.some((t: any) => {
                if (!t || !t.title) return false;
                return isMatch(t.title, args.search!);
            }) : false;
            // Check speaker names and companies
            const speakerMatch = s.speakers ? s.speakers.some((sp: any) => {
                if (!sp) return false;
                const nameMatch = sp.name ? isMatch(sp.name, args.search!) : false;
                const companyMatch = sp.company ? isMatch(sp.company, args.search!) : false;
                return nameMatch || companyMatch;
            }) : false;
            
            if (!titleMatch && !descMatch && !tagMatch && !speakerMatch) return false;
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
