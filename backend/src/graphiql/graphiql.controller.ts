import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';

@Controller()
export class GraphiQLController {
  @Get('/graphql')
  getGraphiQL(@Res() res: Response) {
    const graphiqlHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>GraphiQL 2.0</title>
    <link
      rel="stylesheet"
      href="https://unpkg.com/graphiql@3/graphiql.min.css"
    />
    <style>
      body, #root { height: 100vh; margin: 0; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script
      crossorigin
      src="https://unpkg.com/react@18/umd/react.development.js"
    ></script>
    <script
      crossorigin
      src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"
    ></script>
    <script src="https://unpkg.com/graphiql@3/graphiql.min.js"></script>
    <script>
      const fetcher = GraphiQL.createFetcher({ url: '/graphql' });
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(GraphiQL, { fetcher }));
    </script>
  </body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(graphiqlHtml);
  }
}
