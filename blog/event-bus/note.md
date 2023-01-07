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