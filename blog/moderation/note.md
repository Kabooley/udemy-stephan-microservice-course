# first microservice application

## コメントのも出レーション機能の追加と他のサービスとの連携

流れ：

簡単にまとめると、

コメントを入力された 

--> event-busがそれを検知して他のサービスへ通知

--> queryは一旦そのままそのコメントを出力

--> moderationはコメントを検査して検査結果を再度event-busへ送信

--> queryは更新されたコメントを出力

- ユーザ：commentがサブミットされた

- `client/src/CommentCreate.js`: 

```JavaScript
axios.post(`http://localhost:4001/posts/${postId}/comments`, {
    content
})
```

- `comments/index.js`: 

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

- `event-bus/index.js`:

`event-bus`はイベントがあったことをすべてのサービスへ通知するだけ

受信するサービスのうち関心を寄せることになるのは

`Moderation`と`query`

```JavaScript
// moderation/index.js
app.post('/events', async (req, res) => {
    const { type, data } = req.body;
  
    if (type === 'CommentCreated') {
        // NOTE: コメントの内容に`orange`が含まれているかどうかチェックする
      const status = data.content.includes('orange') ? 'rejected' : 'approved';
  
        // コメントstatusを更新して再度eventを発行する
      await axios.post('http://localhost:4005/events', {
        type: 'CommentModerated',
        data: {
          id: data.id,
          postId: data.postId,
          status,
          content: data.content
        }
      });
    }
  res.send({});
});
```

queryはいったん`status: pending`でコメントを出力して、

moderationでコメント検査された後のイベントで`CommentUpdated`を受け取ったら

あらためてstatusを更新する

```JavaScript
// query/index.js
app.post('/events', (req, res) => {
    const { type, data } = req.body;

    if (type === 'PostCreated') {
        const { id, title } = data;

        posts[id] = { id, title, comments: [] };
    }

    if (type === 'CommentCreated') {
        const { id, content, postId, status } = data;

        const post = posts[postId];
        post.comments.push({ id, content, status });
    }

    if(type === 'CommentUpdated') {
        const { id, status, content, postId } = data;

        const post = posts[postId];
        const comment = post.comments.find(comment => comment.id === id);
        comment.status = status;
        comment.content = content;
    }

    console.log(posts);

    res.send({});
});
```


#### statusに基づくレンダリング

上記までの通り、コメントの検査機能が付いたので

検査結果に基づくコメントのレンダリングをするようにする

```JavaScript
// CommentList.js

const CommentList = ({ comments }) => {

    const renderedComments = comments.map(comment => {

        // NOTE: 条件分岐を設けた
        let content;
        if(comment.status === 'approved') {
            content = comment.content;
        }
        if(comment.status === 'pending') {
            content = "This comment is awaiting moderation";
        }
        if(comment.status === 'rejected') {
            content = "This comment has been rejected";
        }

        return <li key={comment.id}>{content}</li>
    })

    return (
        <ul>
            {renderedComments}
        </ul>
    );
};

```

#### 欠落したイベントの処理

もしも一時的にModerationサーバが落ちていたら

その間に送信されていたイベントは完全に失われている。

サーバが復帰したとしてもコメントの検査が行われるわけではない。

そんなときはどうすべきか？

1. 同期リクエストを使う

`query`は`posts`と`Moderate`の両方に所持しているすべてのデータを渡せとリクエストする。

これだと結局同期通信になるので同期通信のすべてのデメリットを負うことになる。

2. DBへ直接アクセスする

`query`は`posts`と`Moderate`の両方のDBへ直接アクセスできる権限を持たせてDBへリクエストを行うことで必要なデータを取得する方法。

DBがMySQLだったりMongoDBだったり潜在的に書かなくてはならない異なるコードを抱えることになる

3. イベントを保持する

event-busにイベントを保持する場所を設けて全てのイベントを保持させる。

講義ではこのオプション3を採用する。

