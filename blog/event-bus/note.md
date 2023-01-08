# first microservice app: Event Bus

#### Summary of Event Bus

たくさんの異なる実装方法が存在する

イベントを受信してリスナへ通知する

非同期通信をより簡単またはより困難にするさまざまな微妙な機能

Expressを使った独自のevent busを実装する

今回は学習のためにevent busを実装するけれど、通常はOSSや製品版のevent busを使うのが一般的である

#### Emit Event

各サービスは何かするたびにevent bus(`/events`)へpostする

```JavaScript
// /posts/index.js

const axios = require('axios');

app.use('/posts', async (req, res) => {
    // ...
    await axios.post('http://localhost:4005/events', {
        type: 'PostCreated',
        data: {
            id, title
        }
    });
})
```
```JavaScript
// comments/index.js
const axios = require('axios');

app.post('/posts/:id/comments', (req, res) => {
    const commentId = randomBytes(4).toString('hex');
    const { content } = req.body;

    const comments = commentsByPostId[req.params.id] || [];

    comments.push({ id: commentId, content });

    commentsByPostId[req.params.id] = comments;

    // コメントが作成されたことをevent-busへ送信する
    axios.post('http://localhost:4005/events', {
        type: 'CommentCreated',
        data: {
            id: commentId,
            content,
            postId: req.params.id
        }
    });

    res.status(201).send(comments);
});
```

## queryサービスの作成

event: `PostCreated`, `CommentCreated`が発生したときに

queryサービスは

getリクエストが発生したときにすべての投稿とコメントの完全なリストを返す

今、

`event-bus`では`/events`に対してpostされたらすべてのサービスに対して

`/events`URLでその受信したイベントを通知している(postしている)

`query`は

そのイベントの内容が

`type: PostCreated`または`CommentCreated`だったときに

`query`はすべての投稿と各投稿のコメントを出力するようになる。

なので今後投稿とコメントの取得は`query`が担うことになる

## 38 using query service

投稿内容の取得を、`/posts`からではなく`query`から取得する。

投稿の作成やコメントの作成はいまだ各サービスがになうけれど

ユーザに表示する情報はqueryから出力する

```JavaScript
// client/PostList.js
const PostList = () => {
    const [posts, setPosts] = useState({});

    const fetchPosts = async () => {
        // const res = await axios.get('http://localhost:4000/posts');

        // `query`の`post`から投稿もコメントもすべて取得している
        const res = await axios.get('http://localhost:4002/posts');

        // DEBUG:
        console.log(res.data);
        
        setPosts(res.data);
    };
    // ...

    const renderedPosts = Object.values(posts).map(post => {
        return (
            <div 
                className="card" 
                style={{width: "30%", marginBottom: '20px'}}
                key={post.id}
            >
                <div className="card-body">
                    <h3>{post.title}</h3>
                    {/* 
                        fetchposts()の時点ですべての投稿とコメントを取得済なので
                        コメントはCommentListから取得する必要がなくなった
                        直接propsでわたせばよい
                    */}
                    {/* <CommentList postId={post.id} /> */}
                    <CommentList comments={post.comments} />
                    <CommentCreate postId={post.id} />
                </div>
            </div>
        );
    });

    // ...
};


```

```JavaScript
// CommentList.js

import React 
// ,{ useState, useEffect } 
from 'react';
// import axios from 'axios';

const CommentList = ({ 
    // postId
    comments
    }) => {
    // const [comments, setComments] = useState([]);

    // const fetchData = async () => {
    //     const res = await axios.get(`http://localhost:4001/posts/${postId}/comments`);

    //     setComments(res.data);
    // };

    // useEffect(() => {
    //     fetchData();
    // }, []);

    const renderedComments = comments.map(comment => {
        return <li key={comment.id}>{comment.content}</li>
    })

    return (
        <ul>
            {renderedComments}
        </ul>
    );
};

export default CommentList;
```

これで投稿が増えるにつれてコメントを取得するためのfetchの回数を1回で済むようになった

重要なのは、`query`サービスは他のサービスに依存していないということである。

そのため

たとえば`posts`や`comments`のサービスに障害が発生しても

clientとqueryが生きていればユーザに対して表示する機能は生き残り

サービスを提供し続けることができる。

## 簡単な機能の追加:コメントのフィルタリング

Add instance functionality

コメントのフィルタリング機能の追加を行う

commentに対して新しいプロパティを追加する

承認/審査中/拒否のフラグを意味する値の追加

#### 問題

ユーザがコメントをサブミットしたら...

`/comments` がコメントをpost

発行：event: `CommentCreated`

`/events`が上記を受信し

通常であれば`query`がそれをそのまま表示させるのだが

今回フィルタリング機能を追加することになっているので

ここでフィルタリングする役目を設けることになる

その役目を`moderation`が担う。

1. オプション１：`Moderation`が`query`サービスへのイベント発行と通信する

つまり、`query`へイベントを発行する前に`Moderation`が審査する

審査が完了したらその結果を示す値を追加してイベントを発行する。

という処理にすればいいかもしれない。

問題は審査にかかる時間がかなり長くなるかもしれないことである。

審査に時間がかかりすぎるときにユーザへの表示をどうにかしなくてはならない

2. オプション２: `Moderation`はコメントとqueryサービスの両方のステータスを更新する

たとえば`{ status: 'pending' }`のようなステータスを示す値を追加しても出レーションがこれを更新する。

これで審査にかかる時間がどうなろうとひとまずユーザへステータスの表示できるから解決できる


`query`サービスはpresentationに関するサービスである

`query`サービスは`Moderation`に関して関知すべきか

今後コメント機能がどんどん追加されるかもしれない

たとえば投票機能とか、いいねボタンとか。

となると非常に多くのイベントの種類が発行されることになり

それらすべてをqueryは知る必要があるのか考える必要が出てくる

3. オプション３：Queryサービスは`update`イベントだけをリスンさせる

つまりたくさんのイベントが発行されることになってもqueryが受信するのは`update`というイベントだけになるということ

何が更新されたのかに関して関知せず更新されたことだけに関心を払う

講義ではこのオプション3を採用する。

#### Moderationサービスの作成

