# first microservice client

#### Warnings about default export

無名デフォルトエクスポートをするな。

命名しろとのこと。

## setup

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

## /postsから投稿内容を取得する

`/posts`からGETして投稿内容を取得してPostListコンポーネントへ表示する

