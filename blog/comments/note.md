# first microservice comments

## first code

`/posts/:id/comments` POST { content: string } Create a comment associated with the given post ID
`/posts/:id/comments` GET - Retrieve all comments associated with given post ID

postのIdに紐づいたコメントを引き出すようにする

```JavaScript
const express = require('express');
const bodyParser = require('body-parser');
const { randomBytes } = require('crypto');

const app = express();
app.use(bodyParser.json());

const commentsByPostId = {};

app.get('/posts/:id/comments', (req, res) => {
    res.send(commentsByPostId[req.params.id] || []);
});

app.post('/posts/:id/comments', (req, res) => {
    const commentId = randomBytes(4).toString('hex');
    const { content } = req.body;

    const comments = commentsByPostId[req.params.id] || [];

    comments.push({ id: commentId, content });

    commentsByPostId[req.params.id] = comments;

    res.status(201).send(comments);
});

app.listen(4001, () => {
    console.log("Listening 4001");
})
```