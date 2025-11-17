import { NgModule } from '@angular/core';
import { APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache } from '@apollo/client/core';
import { environment } from '../environments/environment'; // Thay đổi ở đây
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { split, from } from '@apollo/client/core';
import { getMainDefinition } from '@apollo/client/utilities';
// graphql.module.ts

console.log('[GraphQLModule] File graphql.module.ts is being loaded and parsed.'); // DEBUG LOG THÊM MỚI


export function createApollo(httpLink: HttpLink) {
  // alert('[GraphQLModule] createApollo function IS BEING CALLED! Check console for environment.graphqlApiUrl.'); // TEMPORARY ALERT
  console.log('[GraphQLModule] createApollo called. environment.graphqlApiUrl =', environment.graphqlApiUrl); // DEBUG LOG
  const http = httpLink.create({ uri: environment.graphqlApiUrl });

  const ws = new GraphQLWsLink(
    createClient({ url: environment.graphqlWsUrl })
  );

  const link = split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
    },
    ws,
    http
  );

  return { link, cache: new InMemoryCache() };
}


@NgModule({
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink],
    },
  ],
})
export class GraphQLModule {}