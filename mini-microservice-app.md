# Microservice

Stephan Grider Course

## Note

#### DBはサービスごとに一つである

1. 各サービスは独立している

2. DBの構成やスキーマが突然変更になるかもしれない

3. いくつかのサービスの機能は異なるDBを用いた方がより効率的になる場合がある。

- いずれのサービスも各サービス専用のDBのみにアクセスする

- いずれのサービスも異なるサービスのDBへアクセスすることはない

- ではどうやってサービス間でデータを共有することになるのだろうか？

もしもDBがどのサービスからでもアクセスできるような物であった場合に、

DBに障害が発生したらすべてのサービスが機能を提供できなくなる（DBへアクセスできなくなる）

また、

サービスBがクラッシュしているときに、もしもサービスAもサービスBのDBへアクセスできるなんて状態だったら、サービスAもクラッシュすることになる


#### Communication strategy between services

*Not meaning in JS.*

独立したサービス間でどうやってデータを共有するのかの話。

たとえばサービスA,B,Cの各データが欲しいサービスDを追加するとする。

サービスDは当然ABCのDBへアクセスできない。

なのでサービスDは他のサービスへリクエストを送ることで欲しいデータを取得するとする。

同期通信する場合メリットデメリット:

- サービス間の依存関係を発生させてしまう
- 内部リクエストのいずれかが失敗すると、すべてのリクエストが失敗する
- 全てのリクエストは一番遅いリクエストの速度に合わせることになる
- 依存関係が強まる
- サービスDはDBが要らない

非同期通信の場合2通り：

1. 異なるサービス間で共通でアクセスできる何らかの共有物をアプリケーション全体に導入しようとする(event bus)

サービスDが直接必要なサービスへリクエスト送るのではなくて、アプリケーション全体でのリクエストを管理するevet busが全てのリクエストの代行を実行する話

- event busがクラッシュしたらおじゃん
- eventbusがクラッシュしないようにするなど負担大
- 理解が困難である
- (同期通信の場合のすべての欠点を有することになる)


ということでまず採用されない方法であるが、そういう方法もあるから知って桶とのこと

2. サービスDに専用のDBを用意する

問題は、いかにしてABCの情報をDへ引っ張っていくかという点でここを解決する


非同期通信のメリットデメリット:

- サービスDは他のサービスから独立している
- 高速である
- データが重複する、重複したDBを用意しなくてはならない
- ロジックが複雑になる

講義ではこの非同期通信の方法でマイクロサービスを構築していく。

## 最初の小さなマイクロサービス・アプリケーション

#### Summary of application

Goal:

1. マイクロサービスを味わう
2. ゼロから構築する

今回構築するアプリケーションを今後のテンプレートとして使うことなかれ。

(著作権とかというより、参考にならないという理由で)

作成するサービス:

- posts
- moderate
- query
- event-bus
- comments
- client

シンプルなアプリケーションの作成になるけれど

実際には複雑なものを作ることになる

たとえばコメントは特定の投稿内容に対してなされるので、

コメントサービスは投稿サービスの内容について知っている必要がある、など。

するとコメントサービスは投稿サービスに依存しているということになる。


#### post

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

#### comment

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

#### client

```bash
App
 |- PostCreate  # 投稿を作成するコンポーネント
 |- PostList    # 作成済の投稿を表示するコンポーネント
        |-CommentList   # その投稿に対してなされたコメント
        |-CommentCreate     # その当行に対して新規のコメント
```

```JavaScript
// postを作成するコンポーネント
import React, { useState } from 'react';
import axios from 'axios';

const PostCreate = () => {
    const [title, setTitle] = useState('');

    /**
     * onSubmitで実行される内容の定義
     * 
     * /postsへPOSTする内容
     * */ 
    const onSubmit = async (event) => {
        event.preventDefault();

        await axios.post('http://localhost:4000/posts', {
            title
        })
    };

    return (<div>
        <form onSubmit={onSubmit}>
            <div className="form-group">
                <label>Title</label>
                <input 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="form-control" />
            </div>
            <button className="btn btn-primary">Submit</button>
        </form>
    </div>);
};

export default PostCreate;
```

```bash
client$ npm start
```

これでlocalhost:3000へアクセスしてフォームへタイトルをサブミットさせると...
(/postsのlocalhost:4000が起動中であることも)

`CORS`エラーが発生する。

```bash
Access to XMLHttpRequest at 'http://localhost:4000/posts' from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

要は同じポート以外へのアクセスは拒否されるのである。

サーバの構成を変更する必要があるようで。

localhost:4000と4001へnpm package`cors`をインストールする

```JavaScript
// posts/index.js
const cors = require('cors');

app.use(cors);
```

これでlocalhost:4000へのアクセスが可能になる。



## 27 リクエスト最小化戦略

講義の最初の小さなアプリケーションをひとまず作った。

アプリケーションにおいて、

すでに投稿済のpostに対するコメントを取得するために

各postに対して一つずつコメントを取得するためのリクエストが発生していた

今後、postが増えてきて例えば1000剣とかになったときに

1000回各投稿に対するコメントを取得するリクエストを送信することになって

大変な負荷がかかること間違いなし。

なのですべてのコメントを一つのリクエストで取得するようにする。

monolith pattern:

DB（サーバ）は一つなのでそのリクエストが来たらすべてのコメントを含むレスポンスを返すだけ

event-busを利用する方法をとる。

各サービスで何か起こったらそれを感知して関心を寄せているオブザーバ（サービス）へ通知し、

サービスはリクエストに応答してevent-busへ返し

event-busはリクエスト元へ結果を返す...

みたいな

pros & cons.

- queryサービスは依存関係なし
- queryサービスは圧倒的に高速である
- データが重複することになる
- 難解である

#### event bus

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

#### queryサービスの作成

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

#### 38 using query service

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

#### 簡単な機能の追加:コメントのフィルタリング

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


#### moderation

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

#### イベントの保存

```JavaScript
// event-bus/index.js

// NOTE: イベントキュー
const events = [];

app.post('/events', (req, res) => {
    const event = req.body;

    // NOTE: イベントを保存する
    event.pus(event);

    axios.post("http://localhost:4000/events", event).catch((err) => {
        console.log(err.message);
    });
    axios.post("http://localhost:4001/events", event).catch((err) => {
        console.log(err.message);
    });
    axios.post("http://localhost:4002/events", event).catch((err) => {
        console.log(err.message);
    });
    axios.post("http://localhost:4003/events", event).catch((err) => {
        console.log(err.message);
    });
    res.send({status: 'OK'});
});

// NOTE: GETリクエストですべてのeventを送信する
app.get('/events', (req, res) => {
    res.send(events);
});
```
queryは毎マウント時にイベントバスから全てのイベントを取得する

```JavaScript
// query/index.js

app.listen(4002, async () => {
    console.log("Listening 4002");
    // NOTE: event-busからeventsを取得する
    try {
        const res = await axios.get('http://localhost:4005/events');

        for(let event of res.data) {
            console.log('Processing event:', event.type);

            handleEvent(event.type, event.data);
        }
    }
    catch(e) {
        console.error(e.message);
    }
});
```
これで例えばqueryサーバがダウンしてしまったとしても、

サーバダウン中のイベントはすべてevent-busに保存されており

queryは復旧したときにすべてのイベントを取得して処理することができる



## 29 非同期イベントに関するFAQ

1. 新規のデータを追加しなくてはならなくなったときはいつも新規のサービスを用意しなくてはならないの？

No.

2. 各サービスが独立していなきゃいけない必要ある？

独立したサービスと信頼度の高さはmicroserviceを用いる第一の理由である

3. 難解なくせに得られる利益が少ないのだが？

このアーキテクチャを使用すると、いくつかの機能を簡単に追加できるようになります
