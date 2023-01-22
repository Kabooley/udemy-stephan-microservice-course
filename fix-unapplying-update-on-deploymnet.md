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

