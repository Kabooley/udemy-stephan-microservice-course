# first microservice application

## コメントのも出レーション機能の追加と他のサービスとの連携

- ユーザ：commentがサブミットされた

- `client/src/CommentCreate.js`: 

```JavaScript
axios.post(`http://localhost:4001/posts/${postId}/comments`, {
    content
})
```

- - `comments/index.js`: 

そのコメントオブジェクトに`status: 'pending'`を追加して、

`event`へpost

```JavaScript

    // Send signal to event bus that comment was created.
    axios.post('http://localhost:4005/events', {
        type: 'CommentCreated',
        data: {
            id: commentId,
            content,
            postId: req.params.id,
            status: 'pending'
        }
    })
```

