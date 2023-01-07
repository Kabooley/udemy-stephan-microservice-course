# first microservice posts

## first code 

post service:

`/posts` POST { title: string } Create a new post
`/posts` GET - Retrieve all posts


```JavaScript
const express = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');

const app = express();
app.use(bodyParser.json());
const posts = {};

app.get('/posts', (req, res) => {
    res.send(posts);
});

app.post('/posts', (req, res) => {
    const id = randomBytes(4).toString('hex');
    const { title } = req.body;
    
    posts[id] = {
        id, title
    };

    res.status(201).send(posts[id]);
});

app.listen(4000, () => {
    console.log("Listening on 4000");
});
```

```bash
# sent from postman
# POST localhost:4000/posts
# GET localhost:4000/posts
```