# minikubeがdockerイメージの更新を反映してくれない件

NOTE: どうやらこの症状はサーフェイスのほうだけである模様。デスクトップのほうは問題なく反映されている。

blog/posts/index.jsの内容を更新して、それを反映させるために講義では次の手順を踏んでいる。

posts-depl.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
    name: posts-depl
spec:
    replicas: 1
    selector: 
        matchLabels:
            app: posts
    template:
        metadata: 
          labels:
            app: posts
        spec: 
            containers: 
              - name: posts
                image: kabooley/posts
---
apiVersion: v1
kind: Service
metadata:
    name: posts-clusterip-srv
spec:
    selector:
        app: posts
    # type: ClusterIP # 省略可能とのこと
    ports: 
        - name: posts
          protocol: TCP
          port: 4000
          targetPort: 4000
```

```bash
# docker and minikube is already starting...
$ cd blog/posts
# Modified index.js...
$ docker build -t $username/posts .
$ docker push $username/posts
# ロールアウト再起動する
$ kubectl get deployments
NAME             READY   UP-TO-DATE   AVAILABLE   AGE
event-bus-depl   1/1     1            1           2d21h
posts-depl       1/1     1            1           2d21h
$ kubectl rollout restart deployment event-bus-depl
$ kubectl rollout restart deployment posts-depl
# podが新旧入れ替わったことがわかる
$ kubectl get pods
```

DockerをLinux環境で動かしており、minikubeを使う場合、Clusterにアクセスするには

Clusterのアドレスをホストへ公開するためにトンネルさせなくてはならない。

```bash
# 別ターミナルを開いて...
$ kubectl get deployemnts
$ kubectl service posts-srv --url
http://127.0.0.1:xxxx
# 上記のURLならばホストＯＳ側からクラスター（というかposts-srv）へアクセスできる
```

今問題なのは、

blog/posts/index.jsの更新内容がrollout restartしたあとに反映されていないことである。

```bash
# このコマンドでポッド内で実行されているposts/index.jsの出力を得ることができるのだが
$ kubectl logs <postsのpodの名前>
...
v55
Listening on 4000
```

`v55`と出力するところ、`v77`と変更したのだが、それが反映されていない...

## クラスターを削除する

という手段をとってみる。

で、一から作り直せばいいのでは？

```bash
$ minikube delete
$ minikube start
# これまでのコンフィグファイルを再度反映させる
$ cd blog/infra/k8s
$ kubectl apply -f .
$ kubectl logs posts-depl-6f5976ccf7-2trwh

> posts@1.0.0 start
> nodemon index.js

[nodemon] 2.0.20
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node index.js`
# 以下の出力は最新のdockerイメージを反映しているので
# 更新は反映された模様...
version baddass 777
Listening on 4000
```
postmanで次のリクエストを送信

`http://127.0.0.1:38253/posts?Content-Type=application/json`

正常に返事を取得。

実行後のアプリケーションの状況を確認

```bash
$ kubectl logs posts-depl-6f5976ccf7-2trwh

> posts@1.0.0 start
> nodemon index.js

[nodemon] 2.0.20
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node index.js`
version baddass 777
Listening on 4000
{ id: '2af1837e', title: 'test surface environment' }
Received event PostCreated
$ kubectl logs comments-depl-554fddcdf8-zbpqm

> comments@1.0.0 start
> nodemon index.js

[nodemon] 2.0.20
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node index.js`
Listening 4001
Received event PostCreated
/app/index.js:48
    if(type = 'CommentModerated') {
            ^

TypeError: Assignment to constant variable.
    at /app/index.js:48:13
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at next (/app/node_modules/express/lib/router/route.js:144:13)
    at Route.dispatch (/app/node_modules/express/lib/router/route.js:114:3)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at /app/node_modules/express/lib/router/index.js:284:15
    at Function.process_params (/app/node_modules/express/lib/router/index.js:346:12)
    at next (/app/node_modules/express/lib/router/index.js:280:10)
    at cors (/app/node_modules/cors/lib/index.js:188:7)
    at /app/node_modules/cors/lib/index.js:224:17

Node.js v19.4.0
[nodemon] app crashed - waiting for file changes before starting...
$ kubectl logs event-bus-depl-c75497b89-mbhr6

> event-bus@1.0.0 start
> nodemon index.js

[nodemon] 2.0.20
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node index.js`
version baddass 77
Listening on 4005
socket hang up
$ kubectl logs query-depl-7df9688c4d-qdl2n

> query@1.0.0 start
> nodemon index.js

[nodemon] 2.0.20
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node index.js`
Listening 4002
$ kubectl logs moderation-depl-6ffdbb65d8-cgj56

> moderation@1.0.0 start
> nodemon index.js

[nodemon] 2.0.20
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node index.js`
Listening 4003

```

なんかタイポを発見してけども、

少なくともpostsは正常に稼働していることが確認できる。


## 他

なんかタスクマネージャも監視してたけど、

なんかどうしてもdockerイメージを反映してくれなかったときは

vmmemが2~3gb占有していたのに、

今回は1gbで済んでいた。

なんかメモリリーク起きていたんじゃないかなぁ...

ちなみにデフォルトのminikubeの確保サイズは2048kbyte。